import type { Achievement, PlayerRank } from "@/models/Achievement";
import { achievementsRepository } from "@/repositories/AchievementsRepository";
import { profileRepository } from "@/repositories/ProfileRepository";
import { settingsRepository } from "@/repositories/SettingsRepository";
import { achievementsService } from "@/services/AchievementsService";
import { avatarService } from "@/services/AvatarService";
import { bodyMetricsService } from "@/services/BodyMetricsService";
import { NotificationService } from "@/services/NotificationService";
import type {
  Profile,
  ProfileUpdate,
  UserSettings,
  UserSettingsUpdate,
} from "@/types/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";

export type { Profile };

const PROFILE_CACHE_PREFIX = "@fitbase_profile_cache";
const SETTINGS_CACHE_PREFIX = "@fitbase_settings_cache";

export interface ProfileContextType {
  profile: Profile | null;
  settings: UserSettings | null;
  achievements: Achievement[];
  playerRank: PlayerRank | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (changes: ProfileUpdate) => Promise<Profile>;
  updateSettings: (changes: UserSettingsUpdate) => Promise<UserSettings>;
  updateWorkoutCompletion: (completed: boolean) => Promise<void>;
  recordWorkoutCompleted: (
    caloriesBurned: number,
    durationMinutes?: number,
    exercisesCompleted?: number,
    workoutTitle?: string,
    exerciseDetails?: Array<Record<string, unknown>>
  ) => Promise<void>;
  resetProfileStats: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const { language } = useLanguage();
  const userId = session?.user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dbAchievements, setDbAchievements] = useState<Achievement[] | null>(null);
  const [, setDbRank] = useState<PlayerRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getProfileCacheKey = useCallback(
    (uid: string) => `${PROFILE_CACHE_PREFIX}_${uid}`,
    []
  );
  const getSettingsCacheKey = useCallback(
    (uid: string) => `${SETTINGS_CACHE_PREFIX}_${uid}`,
    []
  );

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      bodyMetricsService.setActiveUserId(null);
      avatarService.setActiveUserId(null);
      await NotificationService.getInstance().syncWithAccount(null);
      setProfile(null);
      setSettings(null);
      setDbAchievements(null);
      setDbRank(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    bodyMetricsService.setActiveUserId(userId);
    avatarService.setActiveUserId(userId);

    try {
      const [fetchedProfile, fetchedSettings, fetchedAchievements] = await Promise.all([
        profileRepository.get(),
        settingsRepository.get().catch(() => null),
        achievementsRepository.get().catch(() => null),
      ]);

      setProfile(fetchedProfile);
      await AsyncStorage.setItem(
        getProfileCacheKey(userId),
        JSON.stringify(fetchedProfile)
      ).catch(() => {});

      if (fetchedProfile.target_weight !== undefined && fetchedProfile.target_weight !== null) {
        await bodyMetricsService.saveTargetWeight(fetchedProfile.target_weight, userId);
      }

      if (fetchedSettings) {
        setSettings(fetchedSettings);
        await AsyncStorage.setItem(
          getSettingsCacheKey(userId),
          JSON.stringify(fetchedSettings)
        ).catch(() => {});
      }

      if (fetchedAchievements) {
        setDbAchievements(fetchedAchievements.achievements);
        setDbRank(fetchedAchievements.rank);
      }

      await NotificationService.getInstance().syncWithAccount(
        userId,
        fetchedSettings,
        fetchedProfile.streak || 0
      );
      setError(null);
    } catch (err) {
      console.error("Error fetching account profile from database:", err);
      // Helyi gyorsítótár használata offline módban
      try {
        const cachedRaw = await AsyncStorage.getItem(getProfileCacheKey(userId));
        if (cachedRaw) {
          const parsedProfile: Profile = JSON.parse(cachedRaw);
          if (parsedProfile.id === userId) {
            if (parsedProfile.last_workout_date) {
              const todayIso = new Date().toISOString().slice(0, 10);
              const lastIso = parsedProfile.last_workout_date.slice(0, 10);
              const diffDays = Math.round(
                (new Date(todayIso).getTime() - new Date(lastIso).getTime()) / (1000 * 3600 * 24)
              );
              if (diffDays > 2) {
                parsedProfile.streak = 0;
              }
            }
            setProfile(parsedProfile);
          }
        }
        const cachedSettingsRaw = await AsyncStorage.getItem(getSettingsCacheKey(userId));
        if (cachedSettingsRaw) {
          const parsedSettings: UserSettings = JSON.parse(cachedSettingsRaw);
          if (parsedSettings.user_id === userId) {
            setSettings(parsedSettings);
          }
        }
      } catch {
        // Gyorsítótár olvasási hiba figyelmen kívül hagyása
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId, getProfileCacheKey, getSettingsCacheKey]);

  const updateProfile = useCallback(
    async (changes: ProfileUpdate): Promise<Profile> => {
      const updated = await profileRepository.update(changes);
      setProfile(updated);
      if (userId) {
        await AsyncStorage.setItem(
          getProfileCacheKey(userId),
          JSON.stringify(updated)
        ).catch(() => {});
        if (changes.target_weight !== undefined) {
          await bodyMetricsService.saveTargetWeight(changes.target_weight ?? null, userId);
        }
      }
      return updated;
    },
    [userId, getProfileCacheKey]
  );

  const updateSettings = useCallback(
    async (changes: UserSettingsUpdate): Promise<UserSettings> => {
      const updated = await settingsRepository.update(changes);
      setSettings(updated);
      if (userId) {
        await AsyncStorage.setItem(
          getSettingsCacheKey(userId),
          JSON.stringify(updated)
        ).catch(() => {});
        await NotificationService.getInstance().syncWithAccount(
          userId,
          updated,
          profile?.streak || 0
        );
      }
      return updated;
    },
    [userId, getSettingsCacheKey, profile?.streak]
  );

  const recordWorkoutCompleted = useCallback(
    async (
      caloriesBurned: number,
      durationMinutes?: number,
      exercisesCompleted?: number,
      workoutTitle?: string,
      exerciseDetails?: Array<Record<string, unknown>>
    ) => {
      if (!userId) return;

      const sessionMins = durationMinutes && durationMinutes > 0 ? durationMinutes : 45;
      const calBurned = caloriesBurned > 0 ? caloriesBurned : 250;

      try {
        const result = await profileRepository.completeWorkout({
          calories_burned: calBurned,
          duration_minutes: sessionMins,
          exercises_completed: exercisesCompleted ?? 1,
          workout_title: workoutTitle ?? "Workout Session",
          exercise_details: exerciseDetails || [],
        });

        setProfile(result.profile);
        await AsyncStorage.setItem(
          getProfileCacheKey(userId),
          JSON.stringify(result.profile)
        ).catch(() => {});

        // Jelvények és eredmények újratöltése az adatbázisból
        const syncedAch = await achievementsRepository.get().catch(() => null);
        if (syncedAch) {
          setDbAchievements(syncedAch.achievements);
          setDbRank(syncedAch.rank);
        }

        await NotificationService.getInstance().syncWithAccount(
          userId,
          settings,
          result.profile.streak || 0
        );
      } catch (err) {
        console.warn("Failed to record workout on server, updating account-scoped state:", err);
        setProfile((prev) => {
          if (!prev) return prev;
          const todayIso = new Date().toISOString().slice(0, 10);
          const lastDate = prev.last_workout_date ? prev.last_workout_date.slice(0, 10) : null;
          let newStreak = prev.streak || 0;

          if (lastDate === todayIso) {
            newStreak = Math.max(1, newStreak);
          } else if (lastDate) {
            const diffDays = Math.round(
              (new Date(todayIso).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)
            );
            newStreak = diffDays <= 2 ? (prev.streak || 0) + 1 : 1;
          } else {
            newStreak = 1;
          }

          const newBestStreak = Math.max(prev.best_streak || 0, newStreak);
          const newSessions = (prev.sessions_this_week || 0) + 1;
          const newTotalWorkouts = Math.max((prev.total_workouts || 0) + 1, newSessions);
          const baseMinutes = prev.total_minutes ?? (prev.total_hours || 0) * 45;
          const newMinutes = baseMinutes + sessionMins;
          const newHours = Math.round(newMinutes / 60);

          const fallbackUpdated: Profile = {
            ...prev,
            streak: newStreak,
            best_streak: newBestStreak,
            sessions_this_week: newSessions,
            total_workouts: newTotalWorkouts,
            estimated_calories_today: calBurned,
            total_calories_burned: (prev.total_calories_burned || 0) + calBurned,
            total_hours: newHours,
            total_minutes: newMinutes,
            last_workout_date: todayIso,
          };

          AsyncStorage.setItem(
            getProfileCacheKey(userId),
            JSON.stringify(fallbackUpdated)
          ).catch(() => {});

          return fallbackUpdated;
        });
      }
    },
    [userId, getProfileCacheKey, settings]
  );

  const updateWorkoutCompletion = useCallback(
    async (completed: boolean) => {
      if (completed) {
        await recordWorkoutCompleted(350, 45, 1, "Scheduled Workout");
      }
    },
    [recordWorkoutCompleted]
  );

  const resetProfileStats = useCallback(async () => {
    if (!userId) return;
    try {
      const updated = await profileRepository.resetStats();
      setProfile(updated);
      await AsyncStorage.setItem(
        getProfileCacheKey(userId),
        JSON.stringify(updated)
      ).catch(() => {});
    } catch (e) {
      console.warn("Failed to reset profile stats on backend:", e);
    }
  }, [userId, getProfileCacheKey]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const achievements = useMemo(() => {
    return achievementsService.getAchievements(profile, dbAchievements);
  }, [profile, dbAchievements, language]);

  const playerRank = useMemo(() => {
    return achievementsService.calculatePlayerRank(achievements);
  }, [achievements, language]);

  const contextValue = useMemo<ProfileContextType>(
    () => ({
      profile,
      settings,
      achievements,
      playerRank,
      loading,
      error,
      refreshProfile,
      updateProfile,
      updateSettings,
      updateWorkoutCompletion,
      recordWorkoutCompleted,
      resetProfileStats,
    }),
    [
      profile,
      settings,
      achievements,
      playerRank,
      loading,
      error,
      refreshProfile,
      updateProfile,
      updateSettings,
      updateWorkoutCompletion,
      recordWorkoutCompleted,
      resetProfileStats,
    ]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be within ProfileProvider");
  }
  return context;
};
