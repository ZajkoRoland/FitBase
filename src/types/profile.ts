export interface ActivityWeek {
  label: string;
  week_start?: string | null;
  count: number;
  height: number;
  target?: number;
}

export interface CompletedExercisesTodayState {
  date?: string;
  exercise_ids?: Record<string, boolean>;
  finalized?: boolean;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
  onboarding_completed: boolean;
  gender?: string | null;
  age?: number | null;
  height: number | null;
  weight: number | null;
  target_weight?: number | null;
  fitness_goal: string | null;
  fitness_level: string | null;
  streak: number;
  best_streak?: number;
  sessions_this_week: number;
  total_workouts?: number;
  weekly_target?: number;
  estimated_calories_today: number;
  total_calories_burned?: number;
  total_hours: number;
  total_minutes?: number;
  last_workout_date?: string | null;
  completed_exercises_today?: CompletedExercisesTodayState;
  activity_history?: ActivityWeek[];
}

// Profil módosításkor frissíthető mezők
export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'username'
    | 'display_name'
    | 'avatar_url'
    | 'onboarding_completed'
    | 'gender'
    | 'age'
    | 'height'
    | 'weight'
    | 'target_weight'
    | 'fitness_goal'
    | 'fitness_level'
    | 'weekly_target'
    | 'completed_exercises_today'
  >
>;

export interface WorkoutCompletePayload {
  calories_burned: number;
  duration_minutes: number;
  exercises_completed?: number;
  workout_title?: string | null;
  exercise_details?: Array<Record<string, unknown>>;
  session_date?: string;
}

export interface WorkoutSessionItem {
  id: string;
  session_date: string;
  day_of_week: number;
  workout_title?: string | null;
  exercises_completed: number;
  duration_minutes: number;
  calories_burned: number;
  exercise_details: Array<{
    id?: string;
    title: string;
    slug?: string;
    details?: string;
    sets?: Array<{
      set_number: number;
      reps: number;
      weight_kg: number;
      completed?: boolean;
    }>;
    total_volume_kg?: number;
    estimated_1rm?: number;
  }>;
  completed_at: string;
}

export interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  workout_reminder_enabled: boolean;
  workout_reminder_window: string;
  rest_day_reminder_enabled: boolean;
  rest_day_reminder_window: string;
  streak_reminder_enabled: boolean;
  streak_reminder_window: string;
  achievement_alerts_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  language: string;
  units: string;
  plan_structure: string;
  read_notification_ids: string[];
  deleted_notification_ids: string[];
  updated_at?: string | null;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>;
