import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EQUIPMENT_HU_MAP,
  resolveEnglishExerciseTitle,
  resolveHungarianExerciseTitle,
} from './ExerciseHuCatalog';

export type SupportedLanguageCode = 'en' | 'hu' | 'de' | 'es' | 'fr';

export const STORAGE_LANGUAGE_KEY = '@fitbase_app_language';

type TranslationDictionary = Record<string, string>;

const EN_TRANSLATIONS: TranslationDictionary = {
  // Navigation Tabs
  'tabs.home': 'Home',
  'tabs.coach': 'AI Coach',
  'tabs.plan': 'Plan',
  'tabs.library': 'Library',
  'tabs.profile': 'Profile',

  // Loading & Initialization
  'loading.initializing': 'Initializing FitBase...',
  'loading.default': 'Loading...',
  'loading.connectionError': 'Could not connect to the server (10.0.2.2:8000).\nPlease check if the backend server is running!',
  'loading.retry': 'Try Again',
  'loading.backToLogin': 'Back to Sign In',
  'loading.tagline': 'AI Coaching you to a healthier and more active life',

  // Auth / LoginScreen
  'auth.tagline': 'AI Coaching you to a healthier and more active life',
  'auth.loginTab': 'Log In',
  'auth.signupTab': 'Sign Up',
  'auth.signInBtn': 'Sign In',
  'auth.signUpBtn': 'Sign Up',
  'auth.usernameLabel': 'Username',
  'auth.usernamePlaceholder': 'Name',
  'auth.emailLabel': 'Email',
  'auth.emailPlaceholder': 'FitBase@gmail.com',
  'auth.passwordLabel': 'Password',
  'auth.passwordPlaceholder': '•••••••••',
  'auth.forgotPassword': 'Forgot password?',
  'auth.forgotPasswordTitle': 'Reset Password',
  'auth.forgotPasswordSubtitle': 'Enter your registered email address to receive a 6-digit verification code.',
  'auth.sendCodeBtn': 'Send Verification Code',
  'auth.codeLabel': 'Verification Code',
  'auth.codePlaceholder': '6-digit code',
  'auth.newPasswordLabel': 'New Password',
  'auth.confirmNewPasswordLabel': 'Confirm New Password',
  'auth.resetPasswordSubmitBtn': 'Update Password',
  'auth.backToEmailBtn': 'Back',
  'auth.codeSentSuccess': 'A 6-digit verification code has been sent to your email.',
  'auth.resetSuccess': 'Password changed successfully! You can now sign in with your new password.',
  'auth.errInvalidResetCode': 'Invalid or expired 6-digit verification code.',
  'auth.confirmPasswordLabel': 'Confirm Password',
  'auth.confirmPasswordPlaceholder': '•••••••••',
  'auth.orDivider': 'or',
  'auth.continueWithGoogle': 'Continue with Google',
  'auth.errRequiredFields': 'Please fill in all required fields.',
  'auth.errEnterUsername': 'Please enter a username.',
  'auth.errUsernameLength': 'Username must be 2–30 characters long.',
  'auth.errPasswordsMismatch': 'Passwords do not match.',
  'auth.errInvalidCredentials': 'Incorrect email or password.',
  'auth.errEmailNotConfirmed': 'Please confirm your email address before signing in.',
  'auth.errAccountExists': 'An account with this email already exists.',
  'auth.errWeakPassword': 'This password is too weak. Use at least 6 characters.',
  'auth.errInvalidEmail': 'Please enter a valid email address.',
  'auth.errRateLimit': 'Too many attempts. Please wait a moment and try again.',
  'auth.errUserBanned': 'This account has been suspended.',
  'auth.errUsernameTaken': 'This username is already taken.',
  'auth.errSessionExpired': 'Your session has expired. Please sign in again.',
  'auth.errFallback': 'Something went wrong. Please try again.',
  'auth.errNetwork': 'No internet connection. Please check your network and try again.',
  'auth.errExpoGoGoogle': 'To use native Google Sign-In, open the installed FitBase app on your device (Expo Go does not support native modules).',
  'auth.errGoogleNoToken': 'Google did not return an ID token. Verify webClientId configuration.',

  // Onboarding
  'onboarding.welcome': 'Welcome, {{name}}!',
  'onboarding.subtitle': "Registration successful! Let's start personalizing your training plan.",
  'onboarding.finishBtn': "Let's Go →",
  'onboarding.continueBtn': 'Continue',
  'onboarding.backBtn': 'Back',
  'onboarding.stepGenderTitle': 'What is your Gender?',
  'onboarding.stepGenderSubtitle': 'Personalized just for you',
  'onboarding.genderFemale': 'Female',
  'onboarding.genderMale': 'Male',
  'onboarding.genderOther': 'Prefer not to say',
  'onboarding.stepAgeTitle': 'How Old Are You?',
  'onboarding.stepAgeSubtitle': 'You can always change it later.',
  'onboarding.stepHeightTitle': 'How Tall Are You?',
  'onboarding.stepHeightSubtitle': 'Helps us estimate calorie burn.',
  'onboarding.stepWeightTitle': "What's Your Weight?",
  'onboarding.stepWeightSubtitle': 'For your personal plan.',
  'onboarding.stepGoalTitle': 'What is your Primary Goal?',
  'onboarding.stepGoalSubtitle': 'Choose what you want to achieve.',
  'onboarding.goalMuscle': 'Muscle Building',
  'onboarding.goalWeightLoss': 'Weight Loss & Shredding',
  'onboarding.goalMaintenance': 'Maintain & Tone',
  'onboarding.goalEndurance': 'Fitness & Endurance',
  'onboarding.stepTargetWeightTitle': 'What is your Target Weight?',
  'onboarding.stepTargetWeightSubtitle': 'The ideal weight you want to reach.',
  'onboarding.stepLevelTitle': 'What is your Experience Level?',
  'onboarding.stepLevelSubtitle': "We'll tune the workout intensity accordingly.",
  'onboarding.levelBeginner': 'Beginner (0–6 months)',
  'onboarding.levelIntermediate': 'Intermediate (6–24 months)',
  'onboarding.levelAdvanced': 'Advanced (2+ years)',
  'onboarding.kilogram': 'kilogramm',
  'onboarding.pounds': 'pounds',
  'onboarding.centimeter': 'centimeters',
  'onboarding.feetInches': 'feet',
  'onboarding.errorTitle': 'Update Failed',
  'onboarding.errSavePlan': 'Error saving plan: ',
  'onboarding.errUpdateProfile': 'Error updating profile: ',

  // Greetings & Dates
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'greeting.defaultUser': 'User',
  'greeting.defaultAthlete': 'Athlete',
  'date.today': 'Today',
  'date.todayTime': 'Today, {{time}}',
  'date.weekMeta': '{{year}} · Week {{week}}',
  'date.monthMeta': '{{days}} days · {{year}}',
  'date.weekCycle': 'Week {{letter}}',

  // Home Screen - Notifications
  'notifications.title': 'Notifications',
  'notifications.newCount': '{{count}} new',
  'notifications.markAllRead': 'Mark all as read',
  'notifications.emptyTitle': 'No notifications yet',
  'notifications.emptySubtitle': 'Daily workout reminders and recovery updates will appear here.',
  'notifications.clearAll': 'Clear all',
  'notifications.deleteLabel': 'Delete notification',
  'notifications.unreadA11y': 'Notifications, {{count}} unread',
  'notifications.cat.workout': 'Workout',
  'notifications.cat.streak': 'Streak & Goal',
  'notifications.cat.reminder': 'Reminder',
  'notifications.cat.recovery': 'Recovery',
  'notifications.cat.default': 'Notification',
  'notifications.fallbackTitle': 'FitBase Reminder',
  'notifications.channelName': 'FitBase Daily Reminders',
  'notifications.restTitle': 'Rest & Recovery Day 🧘',
  'notifications.restBody': 'Today is for muscle repair. Focus on hydrating with 2.5–3L of water and getting quality sleep.',
  'notifications.workoutBody': 'You have a training session planned for today. Remember to warm up thoroughly!',
  'notifications.streakActiveTitle': '🔥 {{count}}-Day Streak Active!',
  'notifications.streakReminderTitle': 'Daily Streak Reminder 🔥',
  'notifications.streakActiveBody': "Don't break your {{count}}-day streak! Keep up your daily discipline.",
  'notifications.streakReminderBody': 'Complete your workout today to ignite your fitness streak!',

  // Home Screen - Stats Block
  'home.stats.days': 'days',
  'home.stats.streakTitle': 'Streak 🔥',
  'home.stats.sessions': 'sessions',
  'home.stats.thisWeekTitle': 'This Week',
  'home.stats.kcal': 'kcal',
  'home.stats.burnedToday': 'Burned Today',
  'home.stats.estimated': 'Estimated',

  // Home Screen - Timer & Routine Block
  'home.timer.workoutTimer': 'WORKOUT TIMER',
  'home.timer.todaysRoutine': "TODAY'S ROUTINE",
  'home.timer.dayRoutine': "{{day}}'S ROUTINE",
  'home.timer.tabTimer': 'Timer',
  'home.timer.tabRoutine': 'Routine',
  'home.timer.done': 'DONE!',
  'home.timer.tapToPause': 'TAP TO PAUSE',
  'home.timer.tapToStart': 'TAP TO START',
  'home.timer.workDuration': '40s',
  'home.timer.restDuration': '60s',
  'home.timer.workLabel': 'Work',
  'home.timer.restLabel': 'Rest',
  'home.timer.restAndRecovery': 'Rest & Recovery',
  'home.timer.dayRestDay': '{{day}} · Rest Day',
  'home.timer.restDescToday': "Take a break, you've earned it! Muscle recovery is an essential part of progress.",
  'home.timer.restDescOther': 'No workout scheduled for {{day}}. Time for muscle recovery.',
  'home.timer.backToToday': 'Back to Today',
  'home.timer.backToTodaysRoutine': "Back to Today's Routine",
  'home.timer.viewFullPlan': 'View Full Plan ➔',
  'home.timer.emptyWorkoutToday': 'Empty Workout Day',
  'home.timer.emptyWorkoutOther': '{{day}} · Workout',
  'home.timer.emptyWorkoutDescToday': 'This day is scheduled as a workout day with 0 exercises. Add exercises from the library to build your routine.',
  'home.timer.emptyWorkoutDescOther': "No exercises added to {{day}}'s workout yet.",
  'home.timer.addExercises': 'Add Exercises ➔',
  'home.timer.daySessionFallback': "{{day}}'s Session",
  'home.timer.previewReadOnly': 'PREVIEW · READ ONLY',
  'home.timer.exerciseCountOne': '1 exercise',
  'home.timer.exerciseCountMany': '{{count}} exercises',
  'home.timer.zeroExercises': '0 exercises',
  'home.timer.workoutCompletedTitle': 'WORKOUT COMPLETED',
  'home.timer.workoutCompletedSub': '{{checked}} of {{total}} completed · Locked for today',
  'home.timer.noticeCheckOne': 'Please check off at least one exercise before tapping DONE!',
  'home.timer.noticeCompleted': 'Workout completed! +1 Daily Streak',
  'home.timer.noticeOnlyToday': "Exercises can only be checked off on today's routine!",

  // Home Screen - Weekly Goal Block
  'home.weeklyGoal.eyebrow': 'WEEKLY TARGET',
  'home.weeklyGoal.subtitle': 'Consistency & Routine',
  'home.weeklyGoal.sessionsDenominator': ' / {{target}} sessions',
  'home.weeklyGoal.remainingOne': '1 more session to complete your week.',
  'home.weeklyGoal.remainingMany': '{{count}} more sessions to complete your week.',
  'home.weeklyGoal.achieved': 'Target achieved! Outstanding consistency this week 🎉',

  // AI Coach Screen
  'coach.headerTitle': 'AI Coach',
  'coach.senderCoach': 'AI COACH',
  'coach.senderYou': 'You',
  'coach.inputPlaceholder': 'Ask your coach...',
  'coach.statusToday': 'Online · Today: {{workout}}',
  'coach.welcomeRest': 'Hi{{name}}! Today is your rest day. How are you feeling, and do you have any questions?',
  'coach.welcomeWorkout': 'Hi{{name}}! Today you have {{workout}} scheduled. How are you feeling—ready to jump in, or do you have any questions?',
  'coach.quickReply1': 'Create a new workout plan for me!',
  'coach.quickReply2': "Detail today's workout and key tips!",
  'coach.quickReply3': 'Give me nutrition advice for my goals',
  'coach.quickReply4': 'I feel tired, adjust today for me',
  'coach.errConnection': 'Could not connect to the server. Please check your internet connection!',
  'coach.aiPrompt.1_week': 'I would like a customized 1-week workout plan. Please ask me about my equipment and preferences so we can build it together!',
  'coach.aiPrompt.2_week': 'I would like a 2-week alternating routine (Week A / Week B). Please assess my preferences and let us design it!',
  'coach.aiPrompt.4_week': 'I would like a 4-week periodized workout program (Foundational, Intensity, Peak Volume, Deload). Please assess my preferences and let us design it!',

  // Plan Screen & Components
  'plan.weeklyTitle': 'Weekly Workout Plan',
  'plan.monthlyTitle': 'Monthly Workout Plan',
  'plan.viewWeek': 'Week',
  'plan.viewMonth': 'Month',
  'plan.todayBadge': 'TODAY',
  'plan.restShort': 'REST',
  'plan.restDayTitle': 'Rest Day',
  'plan.recoveryLabel': 'Recovery',
  'plan.workoutFallback': 'Workout',
  'plan.workoutDayFallback': 'Workout Day',
  'plan.scheduledWorkoutFallback': 'Scheduled Workout',
  'plan.workoutSessionFallback': 'Workout Session',
  'plan.emptyPlanText': 'No workout plan generated yet.',
  'plan.duplicateTitle': 'Already in Routine',
  'plan.duplicateBody': '"{{title}}" is already part of {{day}}.',
  'plan.thisDayFallback': 'this day',
  'plan.deletePlanTitle': 'Delete Entire Workout Plan?',
  'plan.deletePlanDesc': 'Are you sure you want to permanently delete your entire workout plan? All scheduled routines and exercises across your whole training program will be removed, allowing you to start fresh or build a new plan.',
  'plan.deleteAllBtn': 'Delete All',
  'plan.dailyWorkoutEyebrow': 'DAILY WORKOUT',
  'plan.setAsRestDayBtn': 'Set as Rest Day',
  'plan.blueprintMeta': 'Blueprint',
  'plan.addExerciseToRoutineBtn': 'Add Exercise to Routine',
  'plan.removeExerciseTitle': 'Remove Exercise?',
  'plan.removeExerciseDesc': 'Are you sure you want to remove this exercise from your workout routine?',
  'plan.removeBtn': 'Remove',
  'plan.removeFromRoutineBtn': 'Remove from Routine',
  'plan.setRestModalTitle': 'Set as Rest Day?',
  'plan.setRestModalDesc': 'Are you sure you want to change this day into a rest day? This will clear the exercises currently scheduled for this day.',
  'plan.setRestConfirmBtn': 'Set as Rest',
  'plan.restCardEyebrow': 'REST & RECOVERY',
  'plan.restCardDefaultDesc': "Take a break, you've earned it!",
  'plan.restCardTitleToday': 'Today’s Rest Day',
  'plan.restCardTitleFuture': 'Scheduled Rest Day',
  'plan.restCardTitlePast': 'Rest Day',
  'plan.recovery.cardTitleToday': 'Daily Recovery Goals',
  'plan.recovery.cardTitleFuture': 'Scheduled Recovery Goals',
  'plan.recovery.cardTitlePast': 'Past Recovery Goals',
  'plan.recovery.badgeFuture': 'Planned',
  'plan.recovery.badgePast': 'Past Day',
  'plan.addWorkoutBtn': 'Add Workout',
  'plan.loadingDetails': 'Loading details...',
  'plan.descriptionHeading': 'DESCRIPTION',
  'plan.executionStepsHeading': 'EXECUTION STEPS',
  'plan.editSetsBtn': 'Edit Sets & Weights',
  'plan.editSetsBtnShort': 'Edit',
  'plan.editSetsQuick': 'Sets & Weights',
  'plan.setsSummaryHeading': 'SETS & WEIGHTS',
  'plan.totalVolumeBadge': 'Total Weight: {{vol}} kg',
  'plan.best1RMBadge': '1RM: {{oneRm}} kg',
  'plan.repsSuffix': 'reps',
  'plan.restSuffix': 's rest',
  'plan.setSuffix': 'set',
  'plan.setsSuffix': 'sets',
  'plan.editSetsModal.heading': 'Customize sets, reps and target weights',
  'plan.editSetsModal.applyUniformLabel': 'Quick Apply to All Sets',
  'plan.editSetsModal.applyAllBtn': 'Apply to all sets',
  'plan.editSetsModal.setsHeader': 'Sets ({{count}})',
  'plan.editSetsModal.addSetBtn': '+ Add Set',
  'plan.editSetsModal.repsLabel': 'Reps',
  'plan.editSetsModal.weightLabel': 'Weight (kg)',
  'plan.editSetsModal.repsShort': 'Reps',
  'plan.editSetsModal.weightShort': 'Weight (kg)',
  'plan.editSetsModal.restTimeLabel': 'Rest Time Between Sets',
  'plan.editSetsModal.secSuffix': 's',
  'plan.editSetsModal.totalVolume': 'Total Weight',
  'plan.editSetsModal.est1RM': 'Estimated 1RM',
  'plan.1rmExplanationTitle': 'What is 1RM? (One-Rep Maximum)',
  'plan.1rmExplanationBody': 'The maximum estimated weight you could lift for 1 clean repetition. FitBase uses your completed reps and weights with the Epley formula to gauge your maximum absolute strength safely, without needing risky max-out attempts.',
  'plan.editSetsModal.title': 'Edit Sets & Weights',
  'plan.editSetsModal.subtitle': 'Customize sets, reps and target weights for this exercise',
  'plan.editSetsModal.uniformSection': 'Quick apply to all sets',
  'plan.editSetsModal.applyToAll': 'Apply to all sets',
  'plan.editSetsModal.setsSection': 'Individual Sets',
  'plan.editSetsModal.addSet': '+ Add Set',
  'plan.editSetsModal.setLabel': 'Set {{num}}',
  'plan.editSetsModal.restSecondsLabel': 'Rest between sets',
  'plan.editSetsModal.summary': 'Summary',
  'plan.editSetsModal.best1RM': 'Estimated 1RM',
  'plan.editSetsModal.saveBtn': 'Save Changes',
  'plan.editSetsModal.cancelBtn': 'Cancel',
  'plan.deviationBtn': 'Adjusted Sets',
  'plan.deviationTip': 'Adjusted for today\'s workout',

  // Analytics & Exercise Progression
  'analytics.chart.title': 'Personal Progress',
  'analytics.chart.subtitle': 'Track 1RM, volume and weights over time',
  'analytics.chart.loading': 'Loading progress data...',
  'analytics.chart.metric1RM': 'Estimated 1RM',
  'analytics.chart.metricVolume': 'Total Weight',
  'analytics.chart.metricMaxWeight': 'Max Weight',
  'analytics.chart.statCurrent': 'Current',
  'analytics.chart.statStarting': 'Starting',
  'analytics.chart.statProgress': 'Progress',
  'analytics.chart.setsLabel': 'sets',
  'analytics.chart.emptyTitle': 'No Workout Data Yet',
  'analytics.chart.emptyDesc': 'Complete workouts with this exercise to see your progression curve!',
  'analytics.chart.best1RM': 'Best 1RM',
  'analytics.chart.bestVolume': 'Max Weight',
  'analytics.chart.bestWeight': 'Max Weight',
  'analytics.chart.totalSessions': 'Total Sessions',
  'analytics.section.title': 'Exercise Progression',
  'analytics.section.subtitle': 'Select an exercise to analyze your progress over time',
  'analytics.section.selectExercise': 'Select Exercise',
  'analytics.section.emptyLogged': 'No exercise logged yet',

  // Plan - Monthly Overview
  'plan.month.overviewLabel': 'MONTHLY OVERVIEW',
  'plan.month.workoutsLabel': 'workouts',
  'plan.month.restLabel': 'rest',

  // Plan - Recovery Pillars
  'plan.recovery.cardTitle': 'Daily Recovery Goals',
  'plan.recovery.doneCount': '{{completed}}/{{total}} Done',
  'plan.recovery.hydrationTitle': 'Hydration',
  'plan.recovery.hydrationTarget': '2.5 – 3.0 Liters',
  'plan.recovery.hydrationDesc': 'Flushes metabolic waste and keeps joints well lubricated.',
  'plan.recovery.sleepTitle': 'Sleep',
  'plan.recovery.sleepTarget': '7–8 hours',
  'plan.recovery.sleepDesc': 'Maximizes growth hormone release and nervous system repair.',
  'plan.recovery.nutritionTitle': 'Protein Intake',
  'plan.recovery.nutritionTarget': '1.6 – 2.0g / kg',
  'plan.recovery.nutritionDesc': 'Supports continuous muscle protein synthesis on off-days.',

  // Plan - Quick Action Modal
  'plan.quickActions.title': 'Quick Actions',
  'plan.quickActions.subtitle': 'Managing {{day}} routine',
  'plan.quickActions.buildTitle': 'Build Full Workout Plan',
  'plan.quickActions.buildDesc': 'Choose 1-week, 2-week, or 4-week split',
  'plan.quickActions.addExerciseTitle': 'Add Exercise',
  'plan.quickActions.addExerciseDesc': 'Browse library for {{day}}',
  'plan.quickActions.switchToWorkoutTitle': 'Switch to Workout Day',
  'plan.quickActions.setAsRestTitle': 'Set as Rest Day',
  'plan.quickActions.switchToWorkoutDesc': 'Add exercises to {{day}}',
  'plan.quickActions.setAsRestDesc': 'Mark {{day}} as a rest day',
  'plan.quickActions.deletePlanTitle': 'Delete Entire Workout Plan',
  'plan.quickActions.deletePlanDesc': 'Remove your entire workout program completely',

  // Plan - Build Plan Modal & Structures
  'plan.build.stepBadge': 'STEP {{step}} OF 2',
  'plan.build.step1Title': 'Select Plan Duration',
  'plan.build.step2Title': 'Choose Creation Method',
  'plan.build.step1Subtitle': 'Choose your workout routine periodization',
  'plan.build.step2Subtitle': 'For your {{category}}',
  'plan.build.customTitle': 'Custom Routine',
  'plan.build.customSubtitle': 'Build your own plan',
  'plan.build.customBadge': 'MANUAL',
  'plan.build.customDesc': 'Start with a clean skeleton structure and pick your favorite exercises from the library.',
  'plan.build.aiTitle': 'AI Generated Plan',
  'plan.build.aiSubtitle': 'Tailored by AI Assistant',
  'plan.build.aiBadge': 'AI ASSISTANT',
  'plan.build.aiDesc': 'Let the intelligent AI fitness assistant build a tailored split routine matched to your fitness level.',
  'plan.build.nextBtn': 'Next',
  'plan.build.backBtn': 'Back',
  'plan.build.generateAiBtn': 'Generate with AI',
  'plan.build.createCustomBtn': 'Create Custom Plan',
  'plan.structure.1w.title': '1-Week Routine',
  'plan.structure.1w.subtitle': 'Standard 7-Day Split',
  'plan.structure.1w.badge': '1 Week',
  'plan.structure.1w.desc': '7-day structured split with balanced workout and rest distribution.',
  'plan.structure.2w.title': '2-Week Wave',
  'plan.structure.2w.subtitle': 'Week A & Week B Variation',
  'plan.structure.2w.badge': '2 Weeks',
  'plan.structure.2w.desc': 'Alternating 2-week wave routine for progressive overload and variation.',
  'plan.structure.4w.title': '4-Week Periodization',
  'plan.structure.4w.subtitle': 'Monthly Periodization Plan',
  'plan.structure.4w.badge': '4 Weeks',
  'plan.structure.4w.desc': 'Full monthly cycle: Foundation ➔ Progression ➔ Peak Volume ➔ Recovery.',

  // Exercise Library Screen & Modals
  'library.headerTitle': 'Exercise Library',
  'library.sectionDefault': 'EXERCISES',
  'library.sectionFiltered': 'EXERCISES',
  'library.searchPlaceholder': 'Search',
  'library.exercisesCount': '{{count}} exercises',
  'library.emptyTitle': 'No exercises found',
  'library.emptySubtitle': 'Try searching for another term or selecting a different filter.',
  'library.noImage': 'No image',
  'library.noImagePreview': 'No image preview',
  'library.poseStart': 'Start',
  'library.posePeak': 'Peak',
  'library.clearAll': 'Clear All',
  'library.filtersTitle': 'Filters',
  'library.resetAll': 'Reset All',
  'library.filterBodyPart': 'BODY PART',
  'library.filterEquipment': 'EQUIPMENT',
  'library.filterDifficulty': 'DIFFICULTY',
  'library.detail.description': 'Description',
  'library.detail.showMore': 'Show More',
  'library.detail.showLess': 'Show Less',
  'library.detail.exerciseDetails': 'Exercise Details',
  'library.detail.activityType': 'Activity Type',
  'library.detail.difficulty': 'Difficulty',
  'library.detail.equipment': 'Equipment',
  'library.detail.muscles': 'Muscles',
  'library.detail.duration': 'Duration',
  'library.detail.restTime': 'Rest Time',
  'library.detail.instructions': 'Instructions',
  'library.detail.addToDayRoutine': 'Add to {{day}} Routine',
  'library.detail.addToWorkout': 'Add to Workout',
  'library.detail.durationCardio': '1 min 00 sec',
  'library.detail.durationStrength': '0 min 30 sec',
  'library.detail.restAdvanced': '1 min 30 sec',
  'library.detail.restStandard': '1 min 00 sec',

  // Library Filter Options
  'filter.all': 'All',
  'filter.bodyPart.chest': 'Chest',
  'filter.bodyPart.back': 'Back',
  'filter.bodyPart.shoulders': 'Shoulders',
  'filter.bodyPart.legs': 'Legs',
  'filter.bodyPart.arms': 'Arms',
  'filter.bodyPart.core': 'Core',
  'filter.bodyPart.fullBody': 'Full Body',
  'filter.equipment.bodyweight': 'Bodyweight',
  'filter.equipment.dumbbell': 'Dumbbell',
  'filter.equipment.barbell': 'Barbell',
  'filter.equipment.kettlebell': 'Kettlebell',
  'filter.equipment.cable': 'Cable',
  'filter.equipment.ezBar': 'EZ Bar',
  'filter.equipment.smithMachine': 'Smith Machine',
  'filter.equipment.pullUpBar': 'Pull Up Bar',
  'filter.equipment.band': 'Band',
  'filter.difficulty.beginner': 'Beginner',
  'filter.difficulty.intermediate': 'Intermediate',
  'filter.difficulty.advanced': 'Advanced',
  'filter.difficulty.expert': 'Expert',

  // Profile Screen & Menu
  'profile.statsTitle': 'Statistics',
  'profile.statsSubtitle': 'Check your activities and progress',
  'profile.achievementsTitle': 'Achievements',
  'profile.achievementsSubtitle': 'Unlock badges and track milestones',
  'profile.sec.bodyMetrics': 'Body & Fitness Metrics',
  'profile.sec.preferences': 'Preferences',
  'profile.sec.support': 'Support & Feedback',
  'profile.sec.followUs': 'Follow Us',
  'profile.sec.accountSecurity': 'Account & Security',
  'profile.menu.weightHeight': 'Weight & Height',
  'profile.menu.notSet': 'Not set',
  'profile.menu.targetWeight': 'Target Weight',
  'profile.menu.setTargetWeight': 'Set your target weight',
  'profile.menu.fitnessGoalLevel': 'Fitness Goal & Level',
  'profile.menu.displayNameUsername': 'Display Name & Username',
  'profile.menu.changePassword': 'Change Password',
  'profile.menu.deleteAccount': 'Delete Account',
  'profile.menu.language': 'Language',
  'profile.menu.reminders': 'Reminders & Notifications',
  'profile.menu.sound': 'Sound & Audio',
  'profile.menu.integrations': 'Integrations & Wearables',
  'profile.menu.comingSoon': 'Coming Soon',
  'profile.menu.integrationsMsg': 'Google Fit, Wear OS, and smart fitness tracker sync are coming soon to seamlessly track your sets and calories.',
  'profile.menu.rateFitbase': 'Rate FitBase',
  'profile.menu.rateMsg': 'Thank you for using FitBase! Store review and rating integration will open directly once published on Google Play.',
  'profile.menu.sendFeedback': 'Send Feedback',
  'profile.menu.feedbackMsg': 'Have an idea or feature request? We would love to hear from you to make FitBase even better!',
  'profile.menu.customerSupport': 'Customer Support',
  'profile.menu.supportMsg': 'Reach our dedicated engineering & fitness support team anytime. We reply within 24 hours.',
  'profile.menu.legal': 'Legal & Credits',
  'profile.menu.legalMsg': 'FitBase • Smart Workout Assistant\n\nExercise database provided by RepDB (repdb.co) under the Free Tier License. All exercises and anatomical guides are curated for safe, effective training.',
  'profile.menu.logOut': 'Log Out',
  'profile.logoutConfirmTitle': 'Log Out',
  'profile.logoutConfirmMsg': 'Are you sure you want to log out of your FitBase account?',
  'profile.logoutFailed': 'Logout failed.',
  'profile.footer.version': 'Version 1.0.0',
  'profile.footer.exerciseDataBy': 'Exercise data by ',

  // Profile - Avatar Picker
  'profile.avatar.title': 'Profile Photo',
  'profile.avatar.subtitle': 'Choose an action to update your avatar',
  'profile.avatar.chooseLibrary': 'Choose from Library',
  'profile.avatar.chooseLibraryDesc': 'Select a photo from your gallery',
  'profile.avatar.removePhoto': 'Remove Photo',
  'profile.avatar.removePhotoDesc': 'Revert to your default initial avatar',
  'profile.avatar.permTitle': 'Permission Required',
  'profile.avatar.permMsg': 'Gallery access is needed to select a profile picture.',

  // Profile - Body Metrics & BMI
  'bmi.underweight': 'Underweight',
  'bmi.normal': 'Normal',
  'bmi.normalWeight': 'Normal weight',
  'bmi.overweight': 'Overweight',
  'bmi.obese': 'Obese',
  'bmi.whoLabel': 'WHO Body Mass Index (BMI)',
  'weight.goalReached': 'Goal reached! 🎉',
  'weight.toLose': '{{diff}} kg to lose',
  'weight.toGain': '{{diff}} kg to gain',
  'weight.left': '{{diff}} kg left',
  'modal.bodyMetrics.title': 'Weight & Height',
  'modal.bodyMetrics.hint': 'Your physical measurements are used to calculate metabolic rate, calorie expenditure, and body mass index.',
  'modal.bodyMetrics.weightLabel': 'Weight (kg)',
  'modal.bodyMetrics.weightPlaceholder': 'e.g. 78',
  'modal.bodyMetrics.heightLabel': 'Height (cm)',
  'modal.bodyMetrics.heightPlaceholder': 'e.g. 182',
  'modal.bodyMetrics.saveBtn': 'Save Measurements',
  'modal.bodyMetrics.errWeightTitle': 'Invalid Weight',
  'modal.bodyMetrics.errWeightMsg': 'Please enter a realistic weight value (between 20 - 300 kg).',
  'modal.bodyMetrics.errHeightTitle': 'Invalid Height',
  'modal.bodyMetrics.errHeightMsg': 'Please enter a realistic height value (between 50 - 260 cm).',
  'modal.bodyMetrics.savedTitle': 'Measurements Saved',
  'modal.bodyMetrics.savedMsg': 'Your weight and height have been updated successfully.',
  'modal.bodyMetrics.errUpdate': 'Failed to update body metrics.',

  // Profile - Target Weight Modal
  'modal.targetWeight.title': 'Target Weight Goal',
  'modal.targetWeight.hint': 'Define your ideal body weight. FitBase uses this to track your trajectory and transformation progress.',
  'modal.targetWeight.currentWeight': 'CURRENT WEIGHT',
  'modal.targetWeight.targetGoal': 'TARGET GOAL',
  'modal.targetWeight.inputLabel': 'Target Weight (kg)',
  'modal.targetWeight.inputPlaceholder': 'e.g. 75',
  'modal.targetWeight.saveBtn': 'Save Target',
  'modal.targetWeight.errTitle': 'Invalid Target Weight',
  'modal.targetWeight.errMsg': 'Please enter a realistic target weight value (between 20 - 300 kg).',
  'modal.targetWeight.savedTitle': 'Target Weight Saved',
  'modal.targetWeight.savedMsg': 'Your target weight goal has been updated in your account profile.',
  'modal.targetWeight.errUpdate': 'Failed to update target weight.',

  // Profile - Fitness Goals Modal
  'modal.fitnessGoals.title': 'Fitness Goal & Level',
  'modal.fitnessGoals.hint': 'Select your main focus area and current experience level to tailor your workout difficulty.',
  'modal.fitnessGoals.primaryGoal': 'PRIMARY GOAL',
  'modal.fitnessGoals.experienceLevel': 'EXPERIENCE LEVEL',
  'modal.fitnessGoals.saveBtn': 'Save Goals',
  'modal.fitnessGoals.savedTitle': 'Goals Updated',
  'modal.fitnessGoals.savedMsg': 'Your fitness goal and experience level have been saved.',
  'modal.fitnessGoals.errUpdate': 'Failed to update fitness goals.',
  'goal.muscleGain': 'Muscle Gain',
  'goal.fatLoss': 'Fat Loss',
  'goal.strength': 'Strength',
  'goal.endurance': 'Endurance',
  'goal.generalFitness': 'General Fitness',

  // Profile - Edit Account Modal
  'modal.editAccount.title': 'Edit Account & Name',
  'modal.editAccount.hint': 'This name appears on your workout logs, milestones, and community achievements.',
  'modal.editAccount.displayNameLabel': 'Full Display Name',
  'modal.editAccount.displayNamePlaceholder': 'display name',
  'modal.editAccount.usernameLabel': 'Username (@tag)',
  'modal.editAccount.usernamePlaceholder': 'username',
  'modal.editAccount.saveBtn': 'Save Changes',
  'modal.editAccount.errEmptyUsername': 'Username cannot be empty.',
  'modal.editAccount.savedTitle': 'Profile Updated',
  'modal.editAccount.savedMsg': 'Your display name and username have been updated successfully.',
  'modal.editAccount.errUpdate': 'Failed to update profile details.',

  // Profile - Change Password Modal
  'modal.password.title': 'Change Password',
  'modal.password.hint': 'To protect your account, your new password must be at least 8 characters long.',
  'modal.password.currentLabel': 'Current Password',
  'modal.password.newLabel': 'New Password',
  'modal.password.newPlaceholder': 'At least 8 characters',
  'modal.password.confirmLabel': 'Confirm New Password',
  'modal.password.confirmPlaceholder': 'Repeat new password',
  'modal.password.saveBtn': 'Save Password',
  'modal.password.errCurrentMsg': 'Please enter your current password.',
  'modal.password.errShortTitle': 'Password Too Short',
  'modal.password.errShortMsg': 'New password must be at least 8 characters long.',
  'modal.password.errMismatchTitle': 'Password Mismatch',
  'modal.password.errMismatchMsg': 'New password and confirmation do not match.',
  'modal.password.savedTitle': 'Password Updated',
  'modal.password.savedMsg': 'Your account password has been changed successfully.',
  'modal.password.errUpdate': 'Failed to update password.',

  // Profile - Delete Account Modal
  'modal.deleteAccount.title': 'Delete Account?',
  'modal.deleteAccount.subtitle': 'This action is permanent and cannot be reversed.',
  'modal.deleteAccount.desc': 'All your training statistics, workout routines, active streaks, and personal profile data will be permanently deleted from FitBase servers.',
  'modal.deleteAccount.keepBtn': 'Keep Account',
  'modal.deleteAccount.holdIdle': 'Hold to Delete (3s)',
  'modal.deleteAccount.holdActive': 'Hold to Delete...',
  'modal.deleteAccount.errTitle': 'Deletion Failed',
  'modal.deleteAccount.errFallback': 'Failed to delete account from server. Please try again.',

  // Profile - Language Selection Modal
  'modal.language.title': 'Language',
  'modal.language.hint': 'Choose your preferred language for menus, workout routines, and AI Coach responses.',
  'modal.language.selectedTitle': 'Language Updated',
  'modal.language.selectedMsg': 'Application language has been set to {{name}} ({{nativeName}}).',
  'lang.en': 'English',
  'lang.hu': 'Hungarian',
  'lang.de': 'German',
  'lang.es': 'Spanish',
  'lang.fr': 'French',

  // Statistics Modal & Components
  'stats.headerTitle': 'Statistics',
  'stats.backProfile': 'Profile',
  'stats.overview': 'OVERVIEW',
  'stats.share': 'Share',
  'stats.metric.workouts': 'Workouts',
  'stats.metric.trainingTime': 'Training Time',
  'stats.metric.activeStreak': 'Active Streak',
  'stats.metric.bestStreak': 'Best Streak',
  'stats.metric.caloriesBurned': 'Calories Burned',
  'stats.metric.completion': 'Completion',
  'stats.unit.min': 'min',
  'stats.unit.hr': 'hr',
  'stats.unit.hrs': 'hrs',
  'stats.unit.days': 'days',
  'stats.unit.kcal': 'kcal',
  'stats.consistency.eyebrow': 'WEEKLY TARGET',
  'stats.consistency.title': 'Goal: {{target}} Workouts / Week',
  'stats.consistency.remainingOne': '1 more workout to complete this week!',
  'stats.consistency.remainingMany': '{{count}} more workouts to complete this week!',
  'stats.consistency.achieved': 'Outstanding! You hit your weekly fitness target! 🎉',
  'stats.activity.title': 'ACTIVITY · LAST 5 WEEKS',
  'stats.activity.targetBadge': 'Target: {{target}}/wk',
  'stats.activity.goalLine': 'Goal ({{target}})',
  'stats.body.title': 'BODY & WEIGHT JOURNEY',
  'stats.body.currentWeight': 'Current Weight',
  'stats.body.targetGoal': 'Target Goal',
  'stats.share.title': 'FitBase Workout Journey',
  'stats.share.header': "🏋️ {{name}}'s FitBase Training Stats:",
  'stats.share.streak': '🔥 Active Streak: {{streak}} days',
  'stats.share.weekly': '⚡ Completed This Week: {{sessions}}',
  'stats.share.hours': '⏱️ Time Trained: {{hours}} hours',
  'stats.share.footer': 'Track your fitness goals with FitBase! 💪',

  // Achievements Modal & Service
  'achievements.headerTitle': 'Achievements',
  'achievements.backProfile': 'Profile',
  'achievements.levelEyebrow': 'LEVEL {{level}} FITNESS',
  'achievements.unlockedCount': '{{unlocked}} of {{total}} Badges Unlocked',
  'achievements.tab.all': 'All Badges',
  'achievements.tab.streak': 'Streaks',
  'achievements.tab.workouts': 'Workouts',
  'achievements.tab.dedication': 'Dedication',
  'achievements.tier.bronze': 'BRONZE',
  'achievements.tier.silver': 'SILVER',
  'achievements.tier.gold': 'GOLD',
  'achievements.tier.diamond': 'DIAMOND',
  'achievements.unlockedStatus': 'Achievement Unlocked',
  'achievements.progressLabel': 'Progress: {{current}} / {{target}} {{unit}}',
  'achievements.remainingToUnlock': '{{remaining}} more to unlock this badge',
  'achievements.rank.1': 'Apprentice Athlete',
  'achievements.rank.2': 'Rising Contender',
  'achievements.rank.3': 'Dedicated Warrior',
  'achievements.rank.4': 'Master of Strength',
  'achievements.rank.5': 'Iron Legend',
  'achievements.unit.workout': 'workout',
  'achievements.unit.workouts': 'workouts',
  'achievements.unit.days': 'days',
  'achievements.unit.hours': 'hours',
  'achievements.unit.sessions': 'sessions',
  'achievements.badge.first_workout.title': 'First Step',
  'achievements.badge.first_workout.desc': 'Complete your first workout session in FitBase.',
  'achievements.badge.streak_3.title': 'Spark',
  'achievements.badge.streak_3.desc': 'Keep your momentum with an active 3-day streak.',
  'achievements.badge.streak_7.title': 'Unstoppable',
  'achievements.badge.streak_7.desc': 'Achieve a full 7-day uninterrupted workout streak.',
  'achievements.badge.streak_14.title': 'Iron Habit',
  'achievements.badge.streak_14.desc': 'Reach a formidable 14-day training streak.',
  'achievements.badge.workouts_5.title': 'High Five',
  'achievements.badge.workouts_5.desc': 'Complete 5 total training sessions.',
  'achievements.badge.workouts_10.title': 'Dedication',
  'achievements.badge.workouts_10.desc': 'Finish 10 intense workout sessions.',
  'achievements.badge.hours_5.title': 'Hourglass',
  'achievements.badge.hours_5.desc': 'Accumulate 5 total hours of focused training.',
  'achievements.badge.hours_20.title': 'Endurance Beast',
  'achievements.badge.hours_20.desc': 'Log 20 total training hours on your journey.',
  'achievements.badge.goal_crusher.title': 'Goal Crusher',
  'achievements.badge.goal_crusher.desc': 'Hit 100% of your weekly workout target.',
  'achievements.badge.century_club.title': 'Century Club',
  'achievements.badge.century_club.desc': 'Legendary status: complete 100 workouts.',

  // Common Buttons & Dialogs
  'common.ok': 'OK',
  'common.gotIt': 'Got it',
  'common.awesome': 'Awesome',
  'common.understood': 'Understood',
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.confirm': 'Confirm',
  'common.remove': 'Remove',
  'common.error': 'Error',
  'common.missingField': 'Missing Field',
  'common.updateFailed': 'Update Failed',
  'common.openContactLink': 'Open Contact Link',
  'common.confirmActionDefault': 'Are you sure you want to proceed with this action?',

  // --- Reconciled component translation keys ---
  'coach.senderAi': 'AI Coach',
  'library.exerciseDefault': 'Exercise',
  'library.posePreviewA11y': '{{title}} exercise execution animation',
  'library.poseStartA11y': '{{title}} starting pose',
  'library.posePeakA11y': '{{title}} peak contraction pose',
  'home.routine.checkAtLeastOneNotice': 'Please check off at least one exercise before tapping DONE!',
  'home.routine.completedStreakNotice': 'Workout completed! +1 Daily Streak 🔥',
  'home.routine.onlyTodayCheckNotice': 'Exercises can only be checked off on today\'s routine!',
  'home.timer.workoutTimerHeader': 'WORKOUT TIMER',
  'home.timer.todaysRoutineHeader': 'TODAY\'S ROUTINE',
  'home.timer.dayRoutineHeader': '{{day}}\'S ROUTINE',
  'home.timer.seconds40': '40s',
  'home.timer.work': 'Work',
  'home.timer.seconds60': '60s',
  'home.timer.rest': 'Rest',
  'home.routine.restAndRecovery': 'Rest & Recovery',
  'home.routine.dayRestDay': '{{day}} · Rest Day',
  'home.routine.restTodayDesc': 'Take a break, you\'ve earned it! Muscle recovery is an essential part of progress.',
  'home.routine.restOtherDayDesc': 'No workout scheduled for {{day}}. Time for muscle recovery.',
  'home.routine.backToToday': 'Back to Today',
  'home.routine.viewFullPlan': 'View Full Plan ➔',
  'home.routine.workoutDefault': 'Workout',
  'home.routine.emptyWorkoutTitle': 'Empty Workout Day',
  'home.routine.dayWorkoutTitle': '{{day}} · Workout',
  'home.routine.emptyTodayDesc': 'This day is scheduled as a workout day with 0 exercises. Add exercises from the library to build your routine.',
  'home.routine.emptyOtherDayDesc': 'No exercises added to {{day}}\'s workout yet.',
  'home.routine.addExercisesBtn': 'Add Exercises ➔',
  'home.routine.daySessionFallback': '{{day}}\'s Session',
  'home.routine.previewReadOnly': 'PREVIEW · READ ONLY',
  'home.routine.backToTodayRoutine': 'Back to Today\'s Routine',
  'home.routine.workoutCompletedBadge': 'WORKOUT COMPLETED',
  'home.routine.completedSummaryLocked': '{{checked}} of {{total}} completed · Locked for today',
  'home.routine.doneBtn': 'DONE!',
  'home.weeklyGoal.remainingSessions': '{{count}} more {{unit}} to complete your week.',
  'home.weeklyGoal.targetAchieved': 'Target achieved! Outstanding consistency this week 🎉',
  'home.weeklyGoal.sessionsFraction': ' / {{target}} sessions',
  'library.detail.fullBody': 'Full Body',
  'library.detail.durationDefault': '0 min 30 sec',
  'library.detail.restDefault': '1 min 00 sec',
  'library.detail.descriptionHeading': 'Description',
  'library.detail.detailsHeading': 'Exercise Details',
  'library.detail.instructionsHeading': 'Instructions',
  'library.toggleFilterA11y': 'Filter exercises',
  'library.clearSearchA11y': 'Clear search query',
  'plan.build.cancelBtn': 'Cancel',
  'plan.month.overviewEyebrow': 'MONTHLY OVERVIEW',
  'plan.month.workoutsKpi': 'workouts',
  'plan.month.restKpi': 'rest',
  'plan.quickActions.buildFullTitle': 'Build Full Workout Plan',
  'plan.quickActions.buildFullDesc': 'Choose 1-week, 2-week, or 4-week split',
  'plan.quickActions.deleteEntireTitle': 'Delete Entire Workout Plan',
  'plan.quickActions.deleteEntireDesc': 'Remove your entire workout program completely',
  'plan.quickActions.cancelBtn': 'Cancel',
  'plan.approxDuration': '~{{mins}} min',
  'plan.blueprintLabel': 'Blueprint',
  'achievements.card.unlocked': 'Achievement Unlocked',
  'achievements.card.progress': 'Progress: {{current}} / {{target}} {{unit}}',
  'achievements.card.remaining': '{{count}} more to unlock this badge',
  'achievements.filter.all': 'All Badges',
  'achievements.filter.streak': 'Streaks',
  'achievements.filter.workouts': 'Workouts',
  'achievements.filter.dedication': 'Dedication',
  'achievements.closeA11y': 'Close achievements and go back',
  'achievements.title': 'Achievements',
  'achievements.levelFitness': 'LEVEL {{level}} FITNESS',
  'achievements.badgesUnlocked': '{{unlocked}} of {{total}} Badges Unlocked',
  'profile.avatar.modalTitle': 'Profile Photo',
  'profile.avatar.modalSubtitle': 'Choose an action to update your avatar',
  'profile.avatar.cancel': 'Cancel',
  'profile.password.missingCurrentTitle': 'Missing Field',
  'profile.password.missingCurrentMsg': 'Please enter your current password.',
  'profile.password.tooShortTitle': 'Password Too Short',
  'profile.password.tooShortMsg': 'New password must be at least 8 characters long.',
  'profile.password.mismatchTitle': 'Password Mismatch',
  'profile.password.mismatchMsg': 'New password and confirmation do not match.',
  'profile.password.updatedTitle': 'Password Updated',
  'profile.password.updatedMsg': 'Your account password has been changed successfully.',
  'profile.password.failedTitle': 'Update Failed',
  'profile.password.failedMsg': 'Failed to update password.',
  'profile.password.modalTitle': 'Change Password',
  'profile.password.hint': 'To protect your account, your new password must be at least 8 characters long.',
  'profile.password.currentLabel': 'CURRENT PASSWORD',
  'profile.password.newLabel': 'NEW PASSWORD',
  'profile.password.newPlaceholder': 'At least 8 characters',
  'profile.password.confirmLabel': 'CONFIRM NEW PASSWORD',
  'profile.password.confirmPlaceholder': 'Repeat new password',
  'profile.password.cancelBtn': 'Cancel',
  'profile.password.saveBtn': 'Save Password',
  'profile.deleteAccount.failedTitle': 'Deletion Failed',
  'profile.deleteAccount.failedMsg': 'Failed to delete account from server. Please try again.',
  'profile.deleteAccount.modalTitle': 'Delete Account?',
  'profile.deleteAccount.warningText': 'This action is permanent and cannot be reversed.',
  'profile.deleteAccount.description': 'All your training statistics, workout routines, active streaks, and personal profile data will be permanently deleted from FitBase servers.',
  'profile.deleteAccount.keepAccountBtn': 'Keep Account',
  'profile.deleteAccount.holdA11yLabel': 'Hold to confirm permanent account deletion',
  'profile.deleteAccount.holdA11yHint': 'Hold for three seconds to permanently delete account',
  'profile.deleteAccount.holdBtnActive': 'Hold to Delete...',
  'profile.deleteAccount.holdBtnIdle': 'Hold to Delete (3s)',
  'profile.editAccount.missingTitle': 'Missing Field',
  'profile.editAccount.missingUsernameMsg': 'Username cannot be empty.',
  'profile.editAccount.updatedTitle': 'Profile Updated',
  'profile.editAccount.updatedMsg': 'Your display name and username have been updated successfully.',
  'profile.editAccount.failedTitle': 'Update Failed',
  'profile.editAccount.failedMsg': 'Failed to update profile details.',
  'profile.editAccount.modalTitle': 'Edit Account & Name',
  'profile.editAccount.hint': 'This name appears on your workout logs, milestones, and community achievements.',
  'profile.editAccount.displayNameLabel': 'FULL DISPLAY NAME',
  'profile.editAccount.displayNamePlaceholder': 'display name',
  'profile.editAccount.usernameLabel': 'USERNAME (@TAG)',
  'profile.editAccount.usernamePlaceholder': 'username',
  'profile.editAccount.cancelBtn': 'Cancel',
  'profile.editAccount.saveBtn': 'Save Changes',
  'profile.bodyMetrics.invalidWeightTitle': 'Invalid Weight',
  'profile.bodyMetrics.invalidWeightMsg': 'Please enter a realistic weight value (between 20 - 300 kg).',
  'profile.bodyMetrics.invalidHeightTitle': 'Invalid Height',
  'profile.bodyMetrics.invalidHeightMsg': 'Please enter a realistic height value (between 50 - 260 cm).',
  'profile.bodyMetrics.savedTitle': 'Measurements Saved',
  'profile.bodyMetrics.savedMsg': 'Your weight and height have been updated successfully.',
  'profile.bodyMetrics.failedTitle': 'Update Failed',
  'profile.bodyMetrics.failedMsg': 'Failed to update body metrics.',
  'profile.bodyMetrics.modalTitle': 'Weight & Height',
  'profile.bodyMetrics.hint': 'Your physical measurements are used to calculate metabolic rate, calorie expenditure, and body mass index.',
  'profile.bodyMetrics.weightLabel': 'WEIGHT (KG)',
  'profile.bodyMetrics.weightPlaceholder': 'e.g. 78',
  'profile.bodyMetrics.heightLabel': 'HEIGHT (CM)',
  'profile.bodyMetrics.heightPlaceholder': 'e.g. 182',
  'profile.bodyMetrics.bmiHeader': 'WHO Body Mass Index (BMI)',
  'profile.bodyMetrics.cancelBtn': 'Cancel',
  'profile.bodyMetrics.saveBtn': 'Save Measurements',
  'profile.menu.genderAge': 'Gender & Age',
  'profile.demographics.modalTitle': 'Gender & Age',
  'profile.demographics.hint': 'Used to personalize your metabolic rate, calorie burn estimates, and workout recommendations.',
  'profile.demographics.genderLabel': 'GENDER',
  'profile.demographics.ageLabel': 'AGE (YEARS)',
  'profile.demographics.agePlaceholder': 'e.g. 25',
  'profile.demographics.ageSuffix': '{{age}} yrs',
  'profile.demographics.invalidAgeTitle': 'Invalid Age',
  'profile.demographics.invalidAgeMsg': 'Please enter a valid age between 10 and 120 years.',
  'profile.demographics.savedTitle': 'Details Saved',
  'profile.demographics.savedMsg': 'Your gender and age have been updated successfully.',
  'profile.demographics.failedTitle': 'Update Failed',
  'profile.demographics.failedMsg': 'Failed to update personal details.',
  'profile.demographics.cancelBtn': 'Cancel',
  'profile.demographics.saveBtn': 'Save Details',
  'profile.fitnessGoals.updatedTitle': 'Goals Updated',
  'profile.fitnessGoals.updatedMsg': 'Your fitness goal and experience level have been saved.',
  'profile.fitnessGoals.failedTitle': 'Update Failed',
  'profile.fitnessGoals.failedMsg': 'Failed to update fitness goals.',
  'profile.fitnessGoals.modalTitle': 'Fitness Goal & Level',
  'profile.fitnessGoals.hint': 'Select your main focus area and current experience level to tailor your workout difficulty.',
  'profile.fitnessGoals.primaryGoalLabel': 'PRIMARY GOAL',
  'profile.fitnessGoals.experienceLevelLabel': 'EXPERIENCE LEVEL',
  'profile.fitnessGoals.cancelBtn': 'Cancel',
  'profile.fitnessGoals.saveBtn': 'Save Goals',
  'profile.targetWeight.invalidTitle': 'Invalid Target Weight',
  'profile.targetWeight.invalidMsg': 'Please enter a realistic target weight value (between 20 - 300 kg).',
  'profile.targetWeight.savedTitle': 'Target Weight Saved',
  'profile.targetWeight.savedMsg': 'Your target weight goal has been updated in your account profile.',
  'profile.targetWeight.failedTitle': 'Update Failed',
  'profile.targetWeight.failedMsg': 'Failed to update target weight.',
  'profile.targetWeight.modalTitle': 'Target Weight Goal',
  'profile.targetWeight.hint': 'Define your ideal body weight. FitBase uses this to track your trajectory and transformation progress.',
  'profile.targetWeight.currentWeightLabel': 'CURRENT WEIGHT',
  'profile.targetWeight.notSet': 'Not set',
  'profile.targetWeight.targetGoalLabel': 'TARGET GOAL',
  'profile.targetWeight.inputLabel': 'Target Weight (kg)',
  'profile.targetWeight.inputPlaceholder': 'e.g. 75',
  'profile.targetWeight.cancelBtn': 'Cancel',
  'profile.targetWeight.saveBtn': 'Save Target',
  'profile.language.selectedTitle': 'Language Selected',
  'profile.language.selectedFullMsg': 'Application language has been switched to {{name}} ({{nativeName}}).',
  'profile.language.selectedUpcomingMsg': '{{name}} selected. Extended translations are being actively expanded.',
  'profile.language.langName.en': 'English',
  'profile.language.langName.hu': 'Hungarian',
  'profile.language.langName.de': 'German',
  'profile.language.langName.es': 'Spanish',
  'profile.language.langName.fr': 'French',
  'profile.language.modalTitle': 'Language / Nyelv',
  'profile.language.hint': 'Choose your preferred language for menus, workout routines, and AI Coach responses.',
  'profile.avatar.changePhotoA11y': 'Change profile photo',
  'statistics.activity.sectionTitle': 'ACTIVITY · LAST 5 WEEKS',
  'statistics.activity.targetPerWeek': 'Target: {{count}}/wk',
  'statistics.activity.goalTag': 'Goal ({{count}})',
  'statistics.body.sectionTitle': 'BODY & WEIGHT JOURNEY',
  'statistics.body.currentWeight': 'Current Weight',
  'statistics.body.targetGoal': 'Target Goal',
  'statistics.body.kgLeft': '{{diff}} kg left',
  'statistics.body.bmiLabel': 'WHO Body Mass Index (BMI)',
  'statistics.closeA11y': 'Close statistics and go back',
  'statistics.backProfile': 'Profile',
  'statistics.title': 'Statistics',
  'statistics.unit.min': 'min',
  'statistics.unit.hr': 'hr',
  'statistics.unit.hrs': 'hrs',
  'statistics.unit.hoursMinutes': '{{hours}}h {{mins}}m',
  'statistics.overview': 'OVERVIEW',
  'statistics.shareA11y': 'Share your fitness progress',
  'statistics.share': 'Share',
  'statistics.metric.workouts': 'Workouts',
  'statistics.metric.trainingTime': 'Training Time',
  'statistics.metric.activeStreak': 'Active Streak',
  'statistics.unit.days': 'days',
  'statistics.metric.bestStreak': 'Best Streak',
  'statistics.metric.caloriesBurned': 'Calories Burned',
  'statistics.unit.kcal': 'kcal',
  'statistics.metric.completion': 'Completion',
  'statistics.weeklyTarget.subtitle': 'WEEKLY TARGET',
  'statistics.weeklyTarget.title': 'Goal: {{target}} Workouts / Week',
  'statistics.weeklyTarget.remainingOne': '1 more workout to complete this week!',
  'statistics.weeklyTarget.remainingMany': '{{count}} more workouts to complete this week!',
  'statistics.weeklyTarget.completed': 'Outstanding! You hit your weekly fitness target! 🎉',
};

const HU_TRANSLATIONS: TranslationDictionary = {
  // Navigation Tabs
  'tabs.home': 'Főoldal',
  'tabs.coach': 'AI Edző',
  'tabs.plan': 'Edzésterv',
  'tabs.library': 'Gyakorlatok',
  'tabs.profile': 'Profil',

  // Loading & Initialization
  'loading.initializing': 'FitBase inicializálása...',
  'loading.default': 'Betöltés...',
  'loading.connectionError': 'Nem sikerült kapcsolódni a szerverhez.',
  'loading.retry': 'Újrapróbálkozás',
  'loading.backToLogin': 'Bejelentkezési képernyőre',
  'loading.tagline': 'Személyi AI edződ az egészségesebb és aktívabb életért',

  // Auth / LoginScreen
  'auth.tagline': 'Személyi AI edződ az egészségesebb és aktívabb életért',
  'auth.loginTab': 'Belépés',
  'auth.signupTab': 'Regisztráció',
  'auth.signInBtn': 'Bejelentkezés',
  'auth.signUpBtn': 'Regisztráció',
  'auth.usernameLabel': 'Felhasználónév',
  'auth.usernamePlaceholder': 'Név',
  'auth.emailLabel': 'E-mail cím',
  'auth.emailPlaceholder': 'FitBase@gmail.com',
  'auth.passwordLabel': 'Jelszó',
  'auth.passwordPlaceholder': '•••••••••',
  'auth.forgotPassword': 'Elfelejtetted a jelszavad?',
  'auth.forgotPasswordTitle': 'Jelszó visszaállítása',
  'auth.forgotPasswordSubtitle': 'Add meg a regisztrált e-mail címedet a 6 számjegyű biztonsági kód fogadásához!',
  'auth.sendCodeBtn': 'Ellenőrző kód küldése',
  'auth.codeLabel': '6 számjegyű azonosító kód',
  'auth.codePlaceholder': '123456',
  'auth.newPasswordLabel': 'Új jelszó',
  'auth.confirmNewPasswordLabel': 'Új jelszó megerősítése',
  'auth.resetPasswordSubmitBtn': 'Jelszó frissítése',
  'auth.backToEmailBtn': 'Vissza',
  'auth.codeSentSuccess': 'A 6 számjegyű ellenőrző kódot elküldtük az e-mail címedre!',
  'auth.resetSuccess': 'A jelszavad sikeresen módosult! Most már bejelentkezhetsz.',
  'auth.errInvalidResetCode': 'Érvénytelen vagy lejárt 6 számjegyű azonosító kód.',
  'auth.confirmPasswordLabel': 'Jelszó megerősítése',
  'auth.confirmPasswordPlaceholder': '•••••••••',
  'auth.orDivider': 'vagy',
  'auth.continueWithGoogle': 'Folytatás Google-fiókkal',
  'auth.errRequiredFields': 'Kérlek, tölts ki minden kötelező mezőt!',
  'auth.errEnterUsername': 'Kérlek, adj meg egy felhasználónevet!',
  'auth.errUsernameLength': 'A felhasználónévnek 2 és 30 karakter között kell lennie.',
  'auth.errPasswordsMismatch': 'A megadott jelszavak nem egyeznek.',
  'auth.errInvalidCredentials': 'Helytelen e-mail cím vagy jelszó.',
  'auth.errEmailNotConfirmed': 'Bejelentkezés előtt kérlek, erősítsd meg az e-mail címedet!',
  'auth.errAccountExists': 'Ezzel az e-mail címmel már létezik fiók.',
  'auth.errWeakPassword': 'A jelszó túl gyenge. Használj legalább 6 karaktert!',
  'auth.errInvalidEmail': 'Kérlek, adj meg egy érvényes e-mail címet!',
  'auth.errRateLimit': 'Túl sok próbálkozás. Kérlek, várj egy kicsit, majd próbáld újra!',
  'auth.errUserBanned': 'Ez a fiók felfüggesztésre került.',
  'auth.errUsernameTaken': 'Ez a felhasználónév már foglalt.',
  'auth.errSessionExpired': 'A munkameneted lejárt. Kérlek, jelentkezz be újra!',
  'auth.errFallback': 'Hiba történt. Kérlek, próbáld újra!',
  'auth.errNetwork': 'Nincs internetkapcsolat. Ellenőrizd a hálózatot, majd próbáld újra!',
  'auth.errExpoGoGoogle': 'A natív Google felugró ablakhoz a telefonodon lévő FitBase alkalmazást nyisd meg (az Expo Go nem támogat natív modulokat).',
  'auth.errGoogleNoToken': 'A Google nem adott vissza azonosító tokent. Ellenőrizd a webClientId beállítást.',

  // Onboarding
  'onboarding.welcome': 'Üdvözlünk, {{name}}!',
  'onboarding.subtitle': 'Sikeres regisztráció! Állítsuk össze a személyre szabott edzéstervedet.',
  'onboarding.finishBtn': 'Kezdés',
  'onboarding.continueBtn': 'Folytatás',
  'onboarding.backBtn': 'Vissza',
  'onboarding.stepGenderTitle': 'Ön Neme?',
  'onboarding.stepGenderSubtitle': 'Személyre szabott élményért',
  'onboarding.genderFemale': 'Nő',
  'onboarding.genderMale': 'Férfi',
  'onboarding.genderOther': 'Nem adom meg',
  'onboarding.stepAgeTitle': 'Hány éves vagy?',
  'onboarding.stepAgeSubtitle': 'Később bármikor módosíthatod.',
  'onboarding.stepHeightTitle': 'Milyen magas vagy?',
  'onboarding.stepHeightSubtitle': 'Segít az elégetett kalóriák pontos becslésében.',
  'onboarding.stepWeightTitle': 'Mennyi a testsúlyod?',
  'onboarding.stepWeightSubtitle': 'A személyes edzéstervedhez.',
  'onboarding.stepGoalTitle': 'Mi a fő fitness célod?',
  'onboarding.stepGoalSubtitle': 'Válaszd ki, mit szeretnél elérni.',
  'onboarding.goalMuscle': 'Izomtömeg-növelés',
  'onboarding.goalWeightLoss': 'Fogyás és szálkásítás',
  'onboarding.goalMaintenance': 'Alakformálás és szintentartás',
  'onboarding.goalEndurance': 'Állóképesség és fittség',
  'onboarding.stepTargetWeightTitle': 'Mi a célsúlyod?',
  'onboarding.stepTargetWeightSubtitle': 'Az elérni kívánt ideális testsúly.',
  'onboarding.stepLevelTitle': 'Milyen az edzettségi szinted?',
  'onboarding.stepLevelSubtitle': 'Ehhez igazítjuk a gyakorlatok nehézségét.',
  'onboarding.levelBeginner': 'Kezdő (0–6 hónap)',
  'onboarding.levelIntermediate': 'Középhaladó (6–24 hónap)',
  'onboarding.levelAdvanced': 'Haladó (2+ év)',
  'onboarding.kilogram': 'kilogramm',
  'onboarding.pounds': 'font',
  'onboarding.centimeter': 'centiméter',
  'onboarding.feetInches': 'láb',
  'onboarding.errorTitle': 'Sikertelen mentés',
  'onboarding.errSavePlan': 'Hiba történt a terv mentésekor: ',
  'onboarding.errUpdateProfile': 'Hiba történt a profil frissítésekor: ',

  // Greetings & Dates
  'greeting.morning': 'Jó reggelt',
  'greeting.afternoon': 'Szép napot',
  'greeting.evening': 'Jó estét',
  'greeting.defaultUser': 'Sportoló',
  'greeting.defaultAthlete': 'Sportoló',
  'date.today': 'Ma',
  'date.todayTime': 'Ma, {{time}}',
  'date.weekMeta': '{{year}} · {{week}}. hét',
  'date.monthMeta': '{{days}} nap · {{year}}',
  'date.weekCycle': '{{letter}} hét',

  // Home Screen - Notifications
  'notifications.title': 'Értesítések',
  'notifications.newCount': '{{count}} új',
  'notifications.markAllRead': 'Összes olvasottnak jelölése',
  'notifications.emptyTitle': 'Még nincsenek értesítések',
  'notifications.emptySubtitle': 'A napi edzésemlekeztetők és regenerációs tippek itt fognak megjelenni.',
  'notifications.clearAll': 'Összes törlése',
  'notifications.deleteLabel': 'Értesítés törlése',
  'notifications.unreadA11y': 'Értesítések, {{count}} olvasatlan',
  'notifications.cat.workout': 'Edzés',
  'notifications.cat.streak': 'Sorozat és cél',
  'notifications.cat.reminder': 'Emlékeztető',
  'notifications.cat.recovery': 'Regeneráció',
  'notifications.cat.default': 'Értesítés',
  'notifications.fallbackTitle': 'FitBase emlékeztető',
  'notifications.channelName': 'FitBase napi emlékeztetők',
  'notifications.restTitle': 'Pihenő és regeneráció 🧘',
  'notifications.restBody': 'A mai nap az izmok regenerálódásáról szól. Figyelj a 2,5–3 literes vízfogyasztásra és a pihentető alvásra!',
  'notifications.workoutBody': 'Ma edzésed van beütemezve. Ne felejts el alaposan bemelegíteni!',
  'notifications.streakActiveTitle': '🔥 {{count}} napos aktív sorozat!',
  'notifications.streakReminderTitle': 'Napi sorozat emlékeztető 🔥',
  'notifications.streakActiveBody': 'Ne szakítsd meg a(z) {{count}} napos sorozatodat! Tartsd fenn a napi lendületet.',
  'notifications.streakReminderBody': 'Teljesítsd a mai edzésedet, és indítsd el az edzéssorozatodat!',

  // Home Screen - Stats Block
  'home.stats.days': 'nap',
  'home.stats.streakTitle': 'Sorozat 🔥',
  'home.stats.sessions': 'alkalom',
  'home.stats.thisWeekTitle': 'Ezen a héten',
  'home.stats.kcal': 'kcal',
  'home.stats.burnedToday': 'Ma elégetett',
  'home.stats.estimated': 'Becsült',

  // Home Screen - Timer & Routine Block
  'home.timer.workoutTimer': 'EDZÉSIDŐZÍTŐ',
  'home.timer.todaysRoutine': 'MAI EDZÉSTERV',
  'home.timer.dayRoutine': '{{day}} EDZÉSTERV',
  'home.timer.tabTimer': 'Időzítő',
  'home.timer.tabRoutine': 'Edzésterv',
  'home.timer.done': 'KÉSZ!',
  'home.timer.tapToPause': 'SZÜNETELTETÉS',
  'home.timer.tapToStart': 'INDÍTÁS',
  'home.timer.workDuration': '40 mp',
  'home.timer.restDuration': '60 mp',
  'home.timer.workLabel': 'Munka',
  'home.timer.restLabel': 'Pihenő',
  'home.timer.restAndRecovery': 'Pihenés és regeneráció',
  'home.timer.dayRestDay': '{{day}} · Pihenőnap',
  'home.timer.restDescToday': 'Pihenj egyet, megérdemelted! A regeneráció a fejlődés elengedhetetlen része.',
  'home.timer.restDescOther': '{{day}} nincs edzés beütemezve. Ideje regenerálódni.',
  'home.timer.backToToday': 'Vissza a mai naphoz',
  'home.timer.backToTodaysRoutine': 'Vissza a mai edzéshez',
  'home.timer.viewFullPlan': 'Teljes edzésterv ➔',
  'home.timer.emptyWorkoutToday': 'Üres edzésnap',
  'home.timer.emptyWorkoutOther': '{{day}} · Edzés',
  'home.timer.emptyWorkoutDescToday': 'Ez a nap edzésnapként szerepel, de még nem tartalmaz gyakorlatokat. Adj hozzá gyakorlatokat a Gyakorlattárból!',
  'home.timer.emptyWorkoutDescOther': 'Még nincs gyakorlat hozzáadva a {{day}} edzéshez.',
  'home.timer.addExercises': 'Gyakorlatok hozzáadása ➔',
  'home.timer.daySessionFallback': '{{day}} edzés',
  'home.timer.previewReadOnly': 'ELŐNÉZET · CSAK OLVASHATÓ',
  'home.timer.exerciseCountOne': '1 gyakorlat',
  'home.timer.exerciseCountMany': '{{count}} gyakorlat',
  'home.timer.zeroExercises': '0 gyakorlat',
  'home.timer.workoutCompletedTitle': 'EDZÉS TELJESÍTVE',
  'home.timer.workoutCompletedSub': '{{checked}} / {{total}} kész · Mai napra lezárva',
  'home.timer.noticeCheckOne': 'Kérlek, pipálj ki legalább egy gyakorlatot a KÉSZ! gomb megnyomása előtt!',
  'home.timer.noticeCompleted': 'Edzés teljesítve! +1 napi sorozat',
  'home.timer.noticeOnlyToday': 'A gyakorlatokat csak a mai edzésterven lehet kipipálni!',

  // Home Screen - Weekly Goal Block
  'home.weeklyGoal.eyebrow': 'HETI CÉL',
  'home.weeklyGoal.subtitle': 'Következetesség és rendszeresség',
  'home.weeklyGoal.sessionsDenominator': ' / {{target}} edzés',
  'home.weeklyGoal.remainingOne': 'Még 1 edzés van hátra a heti célodhoz.',
  'home.weeklyGoal.remainingMany': 'Még {{count}} edzés van hátra a heti célodhoz.',
  'home.weeklyGoal.achieved': 'Heti cél teljesítve! Kiemelkedő kitartás ezen a héten 🎉',

  // AI Coach Screen
  'coach.headerTitle': 'AI Edző',
  'coach.senderCoach': 'AI EDZŐ',
  'coach.senderYou': 'Te',
  'coach.inputPlaceholder': 'Kérdezz az edződtől...',
  'coach.statusToday': 'Elérhető · Ma: {{workout}}',
  'coach.welcomeRest': 'Szia{{name}}! Ma pihenőnapod van. Hogy érzed magad, van bármilyen kérdésed?',
  'coach.welcomeWorkout': 'Szia{{name}}! Ma {{workout}} edzésed van beütemezve. Hogy érzed magad, belevágunk, vagy van bármilyen kérdésed?',
  'coach.quickReply1': 'Készíts nekem új edzéstervet!',
  'coach.quickReply2': 'Részletezd a mai edzésem és a tippeket!',
  'coach.quickReply3': 'Adj táplálkozási tanácsot a céljaimhoz!',
  'coach.quickReply4': 'Fáradt vagyok, módosítsd a mai edzésem!',
  'coach.errConnection': 'Sajnos nem sikerült kapcsolódni a szerverhez. Ellenőrizd az internetkapcsolatodat!',
  'coach.aiPrompt.1_week': 'Szeretnék egy 1 hetes edzéstervet. Kérdezz rá a lehetőségeimre és felszerelésemre, hogy együtt építsük fel!',
  'coach.aiPrompt.2_week': 'Szeretnék egy 2 hetes váltott ciklusú edzéstervet (A/B hét). Mérd fel a lehetőségeimet és tervezzük meg!',
  'coach.aiPrompt.4_week': 'Szeretnék egy 4 hetes, periodizált edzésprogramot (alapozás, intenzitás, csúcs, deload). Mérd fel a lehetőségeimet és tervezzük meg!',

  // Plan Screen & Components
  'plan.weeklyTitle': 'Heti edzésterv',
  'plan.monthlyTitle': 'Havi edzésterv',
  'plan.viewWeek': 'Heti',
  'plan.viewMonth': 'Havi',
  'plan.todayBadge': 'MA',
  'plan.restShort': 'PIHENŐ',
  'plan.restDayTitle': 'Pihenőnap',
  'plan.recoveryLabel': 'Regeneráció',
  'plan.workoutFallback': 'Edzés',
  'plan.workoutDayFallback': 'Edzésnap',
  'plan.scheduledWorkoutFallback': 'Ütemezett edzés',
  'plan.workoutSessionFallback': 'Edzés',
  'plan.emptyPlanText': 'Még nincs generált edzésterv.',
  'plan.duplicateTitle': 'Már szerepel a tervben',
  'plan.duplicateBody': 'A(z) „{{title}}” már szerepel a {{day}} edzéstervben.',
  'plan.thisDayFallback': 'kiválasztott napi',
  'plan.deletePlanTitle': 'Teljes edzésterv törlése?',
  'plan.deletePlanDesc': 'Biztosan véglegesen törölni szeretnéd a teljes edzéstervedet? Minden beütemezett edzés és gyakorlat törlődik a programból, így tiszta lappal új tervet építhetsz.',
  'plan.deleteAllBtn': 'Összes törlése',
  'plan.dailyWorkoutEyebrow': 'NAPI EDZÉS',
  'plan.setAsRestDayBtn': 'Legyen pihenőnap',
  'plan.blueprintMeta': 'Tervsablon',
  'plan.addExerciseToRoutineBtn': 'Gyakorlat hozzáadása az edzéshez',
  'plan.removeExerciseTitle': 'Gyakorlat eltávolítása?',
  'plan.removeExerciseDesc': 'Biztosan el szeretnéd távolítani ezt a gyakorlatot az edzéstervből?',
  'plan.removeBtn': 'Eltávolítás',
  'plan.removeFromRoutineBtn': 'Eltávolítás az edzéstervből',
  'plan.setRestModalTitle': 'Átállítás pihenőnapra?',
  'plan.setRestModalDesc': 'Biztosan pihenőnappá szeretnéd alakítani ezt a napot? Ezzel törlődnek az erre a napra beütemezett gyakorlatok.',
  'plan.setRestConfirmBtn': 'Legyen pihenőnap',
  'plan.restCardEyebrow': 'PIHENÉS ÉS REGENERÁCIÓ',
  'plan.restCardDefaultDesc': 'Pihenj egyet, megérdemelted!',
  'plan.restCardTitleToday': 'Mai pihenőnap',
  'plan.restCardTitleFuture': 'Tervezett pihenőnap',
  'plan.restCardTitlePast': 'Pihenőnap',
  'plan.recovery.cardTitleToday': 'Mai regenerációs célok',
  'plan.recovery.cardTitleFuture': 'Tervezett regenerációs célok',
  'plan.recovery.cardTitlePast': 'Regenerációs célok',
  'plan.recovery.badgeFuture': 'Tervezett célok',
  'plan.recovery.badgePast': 'Lezárt nap',
  'plan.addWorkoutBtn': 'Edzés hozzáadása',
  'plan.loadingDetails': 'Részletek betöltése...',
  'plan.descriptionHeading': 'LEÍRÁS',
  'plan.executionStepsHeading': 'VÉGREHAJTÁS LÉPÉSEI',
  'plan.editSetsBtn': 'Sorozatok és súly szerkesztése',
  'plan.editSetsBtnShort': 'Módosítás',
  'plan.editSetsQuick': 'Sorozatok és súly',
  'plan.setsSummaryHeading': 'SOROZATOK ÉS SÚLYOK',
  'plan.totalVolumeBadge': 'Összsúly: {{vol}} kg',
  'plan.best1RMBadge': '1RM: {{oneRm}} kg',
  'plan.repsSuffix': 'ism.',
  'plan.restSuffix': 'mp pihenő',
  'plan.setSuffix': 'sorozat',
  'plan.setsSuffix': 'sorozat',
  'plan.editSetsModal.heading': 'Sorozatok, ismétlések és súlyok beállítása',
  'plan.editSetsModal.applyUniformLabel': 'Gyors beállítás minden sorozatra',
  'plan.editSetsModal.applyAllBtn': 'Alkalmazás minden sorozatra',
  'plan.editSetsModal.setsHeader': 'Sorozatok szerkesztése ({{count}})',
  'plan.editSetsModal.addSetBtn': '+ Új sorozat',
  'plan.editSetsModal.repsLabel': 'Ismétlés',
  'plan.editSetsModal.weightLabel': 'Súly (kg)',
  'plan.editSetsModal.repsShort': 'Ismétlés',
  'plan.editSetsModal.weightShort': 'Súly (kg)',
  'plan.editSetsModal.restTimeLabel': 'Pihenőidő a sorozatok között',
  'plan.editSetsModal.secSuffix': 'mp',
  'plan.editSetsModal.totalVolume': 'Összesített súly',
  'plan.editSetsModal.est1RM': 'Becsült 1RM',
  'plan.1rmExplanationTitle': 'Mi az az 1RM? (Egyismétléses maximum)',
  'plan.1rmExplanationBody': 'Az a legnagyobb becsült súly, amellyel 1 szabályos ismétlést tudnál elvégezni. A rendszer az ismétlésszámod és a használt súly alapján (Epley-képlettel) automatikusan számítja ki, így sérülésveszély és kockázatos maximális próbák nélkül követheted az abszolút erőszinted fejlődését.',
  'plan.editSetsModal.title': 'Sorozatok és súly beállítása',
  'plan.editSetsModal.subtitle': 'Állítsd be a sorozatok számát, az ismétléseket és a tervezett súlyokat!',
  'plan.editSetsModal.uniformSection': 'Gyors beállítás minden sorozatra',
  'plan.editSetsModal.applyToAll': 'Alkalmazás minden sorozatra',
  'plan.editSetsModal.setsSection': 'Egyéni sorozatok',
  'plan.editSetsModal.addSet': '+ Új sorozat',
  'plan.editSetsModal.setLabel': '{{num}}. sorozat',
  'plan.editSetsModal.restSecondsLabel': 'Pihenőidő sorozatok között',
  'plan.editSetsModal.summary': 'Összesítés',
  'plan.editSetsModal.best1RM': 'Becsült 1RM',
  'plan.editSetsModal.saveBtn': 'Módosítások mentése',
  'plan.editSetsModal.cancelBtn': 'Mégse',
  'plan.deviationBtn': 'Eltérés rögzítése',
  'plan.deviationTip': 'A mai edzésen végzett tényleges súlyok',

  // Analytics & Exercise Progression
  'analytics.chart.title': 'Személyes fejlődésem',
  'analytics.chart.subtitle': 'Progresszív fejlődés az edzésnaplók alapján',
  'analytics.chart.loading': 'Fejlődési adatok betöltése...',
  'analytics.chart.metric1RM': 'Becsült 1RM',
  'analytics.chart.metricVolume': 'Összvolumen',
  'analytics.chart.metricMaxWeight': 'Max súly',
  'analytics.chart.statCurrent': 'Jelenlegi',
  'analytics.chart.statStarting': 'Kezdő',
  'analytics.chart.statProgress': 'Fejlődés',
  'analytics.chart.setsLabel': 'sorozat',
  'analytics.chart.emptyTitle': 'Még nincs rögzített adat',
  'analytics.chart.emptyDesc': 'Végezz el és rögzíts edzéseket ezzel a gyakorlattal a fejlődési görbe megjelenítéséhez!',
  'analytics.chart.best1RM': 'Legjobb 1RM',
  'analytics.chart.bestVolume': 'Max volumen',
  'analytics.chart.bestWeight': 'Max súly',
  'analytics.chart.totalSessions': 'Edzésnapló',
  'analytics.section.title': 'Gyakorlatok fejlődése',
  'analytics.section.subtitle': 'Válassz ki egy gyakorlatot a fejlődési görbe megtekintéséhez',
  'analytics.section.selectExercise': 'Gyakorlat kiválasztása',
  'analytics.section.emptyLogged': 'Még nincs naplózott edzés',

  // Plan - Monthly Overview
  'plan.month.overviewLabel': 'HAVI ÁTTEKINTÉS',
  'plan.month.workoutsLabel': 'edzés',
  'plan.month.restLabel': 'pihenő',

  // Plan - Recovery Pillars
  'plan.recovery.cardTitle': 'Napi regenerációs célok',
  'plan.recovery.doneCount': '{{completed}}/{{total}} kész',
  'plan.recovery.hydrationTitle': 'Hidratáció',
  'plan.recovery.hydrationTarget': '2,5 – 3,0 liter',
  'plan.recovery.hydrationDesc': 'Segíti az anyagcsere-folyamatokat és védi az ízületeket.',
  'plan.recovery.sleepTitle': 'Alvás',
  'plan.recovery.sleepTarget': '7–8 óra',
  'plan.recovery.sleepDesc': 'Maximalizálja a növekedési hormon termelődését és az idegrendszer regenerációját.',
  'plan.recovery.nutritionTitle': 'Fehérjebevitel',
  'plan.recovery.nutritionTarget': '1,6 – 2,0 g / ttkg',
  'plan.recovery.nutritionDesc': 'Támogatja a folyamatos izomfehérje-szintézist pihenőnapokon is.',

  // Plan - Quick Action Modal
  'plan.quickActions.title': 'Gyorsműveletek',
  'plan.quickActions.subtitle': '{{day}} edzésterv kezelése',
  'plan.quickActions.buildTitle': 'Teljes edzésterv összeállítása',
  'plan.quickActions.buildDesc': 'Válassz 1 hetes, 2 hetes vagy 4 hetes felosztást',
  'plan.quickActions.addExerciseTitle': 'Gyakorlat hozzáadása',
  'plan.quickActions.addExerciseDesc': 'Böngészés a gyakorlattárban {{day}}',
  'plan.quickActions.switchToWorkoutTitle': 'Átállítás edzésnapra',
  'plan.quickActions.setAsRestTitle': 'Beállítás pihenőnapként',
  'plan.quickActions.switchToWorkoutDesc': 'Gyakorlatok hozzáadása {{day}}',
  'plan.quickActions.setAsRestDesc': 'Jelöld meg {{day}} pihenőnapként',
  'plan.quickActions.deletePlanTitle': 'Teljes edzésterv törlése',
  'plan.quickActions.deletePlanDesc': 'A teljes edzésprogram végleges eltávolítása',

  // Plan - Build Plan Modal & Structures
  'plan.build.stepBadge': '{{step}} / 2. LÉPÉS',
  'plan.build.step1Title': 'Edzésterv időtartama',
  'plan.build.step2Title': 'Összeállítás módja',
  'plan.build.step1Subtitle': 'Válaszd ki az edzésprogramod ciklusát',
  'plan.build.step2Subtitle': 'Kiválasztva: {{category}}',
  'plan.build.customTitle': 'Saját edzésterv',
  'plan.build.customSubtitle': 'Állítsd össze magadnak',
  'plan.build.customBadge': 'EGYÉNI',
  'plan.build.customDesc': 'Indulj tiszta alapokkal, és válogasd össze kedvenc gyakorlataidat a Gyakorlattárból.',
  'plan.build.aiTitle': 'AI által generált terv',
  'plan.build.aiSubtitle': 'Személyre szabva az AI Edzővel',
  'plan.build.aiBadge': 'AI ASSZISZTENS',
  'plan.build.aiDesc': 'Hagyd, hogy az intelligens AI fitneszasszisztens állítsa össze az edzettségi szintedhez illő programot.',
  'plan.build.nextBtn': 'Tovább',
  'plan.build.backBtn': 'Vissza',
  'plan.build.generateAiBtn': 'Generálás AI-val',
  'plan.build.createCustomBtn': 'Saját terv létrehozása',
  'plan.structure.1w.title': '1 hetes program',
  'plan.structure.1w.subtitle': 'Klasszikus 7 napos felosztás',
  'plan.structure.1w.badge': '1 hét',
  'plan.structure.1w.desc': '7 napos strukturált beosztás kiegyensúlyozott edzés- és pihenőnapokkal.',
  'plan.structure.2w.title': '2 hetes hullámzó ciklus',
  'plan.structure.2w.subtitle': 'A és B hét váltakozása',
  'plan.structure.2w.badge': '2 hét',
  'plan.structure.2w.desc': 'Váltakozó 2 hetes program a folyamatos fejlődésért és változatosságért.',
  'plan.structure.4w.title': '4 hetes periodizáció',
  'plan.structure.4w.subtitle': 'Teljes havi edzésciklus',
  'plan.structure.4w.badge': '4 hét',
  'plan.structure.4w.desc': 'Teljes havi ciklus: Alapozás ➔ Építkezés ➔ Intenzív szakasz ➔ Regeneráció.',

  // Exercise Library Screen & Modals
  'library.headerTitle': 'Gyakorlattár',
  'library.sectionDefault': 'GYAKORLATOK',
  'library.sectionFiltered': 'GYAKORLATOK',
  'library.searchPlaceholder': 'Keresés...',
  'library.exercisesCount': '{{count}} gyakorlat',
  'library.emptyTitle': 'Nem található gyakorlat',
  'library.emptySubtitle': 'Próbálj más kulcsszóra keresni, vagy módosítsd a szűrőket.',
  'library.noImage': 'Nincs kép',
  'library.noImagePreview': 'Nincs előnézeti kép',
  'library.poseStart': 'Kezdet',
  'library.posePeak': 'Végpont',
  'library.clearAll': 'Szűrők törlése',
  'library.filtersTitle': 'Szűrők',
  'library.resetAll': 'Alaphelyzet',
  'library.filterBodyPart': 'TESTRÉSZ',
  'library.filterEquipment': 'ESZKÖZ',
  'library.filterDifficulty': 'NEHÉZSÉG',
  'library.detail.description': 'Leírás',
  'library.detail.showMore': 'Mutass többet',
  'library.detail.showLess': 'Mutass kevesebbet',
  'library.detail.exerciseDetails': 'Gyakorlat adatai',
  'library.detail.activityType': 'Mozgásforma',
  'library.detail.difficulty': 'Nehézség',
  'library.detail.equipment': 'Eszköz',
  'library.detail.muscles': 'Megdolgoztatott izmok',
  'library.detail.duration': 'Időtartam',
  'library.detail.restTime': 'Pihenőidő',
  'library.detail.instructions': 'Végrehajtás menete',
  'library.detail.addToDayRoutine': 'Hozzáadás a {{day}} edzéshez',
  'library.detail.addToWorkout': 'Hozzáadás az edzéshez',
  'library.detail.durationCardio': '1 perc 00 mp',
  'library.detail.durationStrength': '0 perc 30 mp',
  'library.detail.restAdvanced': '1 perc 30 mp',
  'library.detail.restStandard': '1 perc 00 mp',

  // Library Filter Options
  'filter.all': 'Összes',
  'filter.bodyPart.chest': 'Mell',
  'filter.bodyPart.back': 'Hát',
  'filter.bodyPart.shoulders': 'Váll',
  'filter.bodyPart.legs': 'Láb',
  'filter.bodyPart.arms': 'Kar',
  'filter.bodyPart.core': 'Törzs és has',
  'filter.bodyPart.fullBody': 'Teljes test',
  'filter.equipment.bodyweight': 'Saját testsúly',
  'filter.equipment.dumbbell': 'Kézisúlyzó',
  'filter.equipment.barbell': 'Kétkezes rúd',
  'filter.equipment.kettlebell': 'Kettlebell',
  'filter.equipment.cable': 'Csigás gép',
  'filter.equipment.ezBar': 'Francia rúd (EZ)',
  'filter.equipment.smithMachine': 'Smith-gép',
  'filter.equipment.pullUpBar': 'Húzódzkodórúd',
  'filter.equipment.band': 'Gumiszalag',
  'filter.difficulty.beginner': 'Kezdő',
  'filter.difficulty.intermediate': 'Középhaladó',
  'filter.difficulty.advanced': 'Haladó',
  'filter.difficulty.expert': 'Profi',

  // Profile Screen & Menu
  'profile.statsTitle': 'Statisztikák',
  'profile.statsSubtitle': 'Kövesd nyomon az edzéseidet és a fejlődésedet',
  'profile.achievementsTitle': 'Eredmények',
  'profile.achievementsSubtitle': 'Szerezz jelvényeket és érj el új mérföldköveket',
  'profile.sec.bodyMetrics': 'Testadatok és fitneszcélok',
  'profile.sec.preferences': 'Beállítások',
  'profile.sec.support': 'Támogatás és visszajelzés',
  'profile.sec.followUs': 'Kövess minket',
  'profile.sec.accountSecurity': 'Fiók és biztonság',
  'profile.menu.weightHeight': 'Testsúly és magasság',
  'profile.menu.notSet': 'Nincs megadva',
  'profile.menu.targetWeight': 'Célsúly',
  'profile.menu.setTargetWeight': 'Állítsd be a célsúlyodat',
  'profile.menu.fitnessGoalLevel': 'Fitneszcél és szint',
  'profile.menu.displayNameUsername': 'Megjelenített név és felhasználónév',
  'profile.menu.changePassword': 'Jelszó módosítása',
  'profile.menu.deleteAccount': 'Fiók törlése',
  'profile.menu.language': 'Nyelv',
  'profile.menu.reminders': 'Emlékeztetők és értesítések',
  'profile.menu.sound': 'Hangok és hangeffektek',
  'profile.menu.integrations': 'Integrációk és okoseszközök',
  'profile.menu.comingSoon': 'Hamarosan',
  'profile.menu.integrationsMsg': 'A Google Fit, a Wear OS és az okosóra-szinkronizáció hamarosan elérhető lesz a sorozatok és kalóriák automatikus követéséhez.',
  'profile.menu.rateFitbase': 'FitBase értékelése',
  'profile.menu.rateMsg': 'Köszönjük, hogy a FitBase-t használod! Az áruházi értékelés a Google Play megjelenés után közvetlenül elérhető lesz.',
  'profile.menu.sendFeedback': 'Visszajelzés küldése',
  'profile.menu.feedbackMsg': 'Van egy jó ötleted vagy fejlesztési javaslatod? Szívesen meghallgatjuk, hogy még jobbá tegyük a FitBase-t!',
  'profile.menu.customerSupport': 'Ügyfélszolgálat',
  'profile.menu.supportMsg': 'Kérdésed van? Fejlesztői és fitnesz támogató csapatunk 24 órán belül válaszol.',
  'profile.menu.legal': 'Jogi nyilatkozat és források',
  'profile.menu.legalMsg': 'FitBase • Intelligens edzésasszisztens\n\nA gyakorlatok adatbázisát a RepDB (repdb.co) biztosítja a Free Tier licenc keretében. Minden gyakorlat és anatómiai útmutató a biztonságos és hatékony edzést szolgálja.',
  'profile.menu.logOut': 'Kijelentkezés',
  'profile.logoutConfirmTitle': 'Kijelentkezés',
  'profile.logoutConfirmMsg': 'Biztosan ki szeretnél jelentkezni a FitBase-fiókodból?',
  'profile.logoutFailed': 'Sikertelen kijelentkezés.',
  'profile.footer.version': 'Verzió: 1.0.0',
  'profile.footer.exerciseDataBy': 'Gyakorlatadatbázis: ',

  // Profile - Avatar Picker
  'profile.avatar.title': 'Profilkép',
  'profile.avatar.subtitle': 'Válassz műveletet a profilképed módosításához',
  'profile.avatar.chooseLibrary': 'Választás a galériából',
  'profile.avatar.chooseLibraryDesc': 'Fénykép kiválasztása a telefonodról',
  'profile.avatar.removePhoto': 'Profilkép eltávolítása',
  'profile.avatar.removePhotoDesc': 'Visszaállítás az alapértelmezett monogramra',
  'profile.avatar.permTitle': 'Engedély szükséges',
  'profile.avatar.permMsg': 'A profilkép kiválasztásához hozzáférés szükséges a galériához.',

  // Profile - Body Metrics & BMI
  'bmi.underweight': 'Sovány',
  'bmi.normal': 'Normál',
  'bmi.normalWeight': 'Normál testsúly',
  'bmi.overweight': 'Túlsúlyos',
  'bmi.obese': 'Elhízott',
  'bmi.whoLabel': 'WHO testtömegindex (BMI)',
  'weight.goalReached': 'Cél elérve! 🎉',
  'weight.toLose': '{{diff}} kg fogyás a célig',
  'weight.toGain': '{{diff}} kg tömegnövelés a célig',
  'weight.left': '{{diff}} kg van hátra',
  'modal.bodyMetrics.title': 'Testsúly és magasság',
  'modal.bodyMetrics.hint': 'A testi adataidat az alapanyagcsere, a kalóriaégetés és a testtömegindex (BMI) pontos kiszámításához használjuk.',
  'modal.bodyMetrics.weightLabel': 'Testsúly (kg)',
  'modal.bodyMetrics.weightPlaceholder': 'pl. 78',
  'modal.bodyMetrics.heightLabel': 'Magasság (cm)',
  'modal.bodyMetrics.heightPlaceholder': 'pl. 182',
  'modal.bodyMetrics.saveBtn': 'Adatok mentése',
  'modal.bodyMetrics.errWeightTitle': 'Érvénytelen testsúly',
  'modal.bodyMetrics.errWeightMsg': 'Kérlek, adj meg valós testsúlyt (20 és 300 kg között).',
  'modal.bodyMetrics.errHeightTitle': 'Érvénytelen magasság',
  'modal.bodyMetrics.errHeightMsg': 'Kérlek, adj meg valós magasságot (50 és 260 cm között).',
  'modal.bodyMetrics.savedTitle': 'Adatok elmentve',
  'modal.bodyMetrics.savedMsg': 'A testsúlyod és a magasságod sikeresen frissült.',
  'modal.bodyMetrics.errUpdate': 'Nem sikerült frissíteni a testadatokat.',

  // Profile - Target Weight Modal
  'modal.targetWeight.title': 'Célsúly beállítása',
  'modal.targetWeight.hint': 'Határozd meg az ideális testsúlyodat! A FitBase ez alapján követi az alakulásodat és a célodhoz vezető utat.',
  'modal.targetWeight.currentWeight': 'JELENLEGI SÚLY',
  'modal.targetWeight.targetGoal': 'KITŰZÖTT CÉL',
  'modal.targetWeight.inputLabel': 'Célsúly (kg)',
  'modal.targetWeight.inputPlaceholder': 'pl. 75',
  'modal.targetWeight.saveBtn': 'Célsúly mentése',
  'modal.targetWeight.errTitle': 'Érvénytelen célsúly',
  'modal.targetWeight.errMsg': 'Kérlek, adj meg valós célsúlyt (20 és 300 kg között).',
  'modal.targetWeight.savedTitle': 'Célsúly elmentve',
  'modal.targetWeight.savedMsg': 'A célsúlyod sikeresen frissült a profilodban.',
  'modal.targetWeight.errUpdate': 'Nem sikerült menteni a célsúlyt.',

  // Profile - Fitness Goals Modal
  'modal.fitnessGoals.title': 'Fitneszcél és szint',
  'modal.fitnessGoals.hint': 'Válaszd ki a fő célkitűzésedet és a jelenlegi edzettségi szintedet az edzések nehézségének személyre szabásához.',
  'modal.fitnessGoals.primaryGoal': 'ELSŐDLEGES CÉL',
  'modal.fitnessGoals.experienceLevel': 'EDZETTSÉGI SZINT',
  'modal.fitnessGoals.saveBtn': 'Célok mentése',
  'modal.fitnessGoals.savedTitle': 'Célok frissítve',
  'modal.fitnessGoals.savedMsg': 'A fitneszcélod és az edzettségi szinted elmentve.',
  'modal.fitnessGoals.errUpdate': 'Nem sikerült menteni a fitneszcélokat.',
  'goal.muscleGain': 'Izomépítés',
  'goal.fatLoss': 'Zsírégetés',
  'goal.strength': 'Erőnövelés',
  'goal.endurance': 'Állóképesség',
  'goal.generalFitness': 'Általános fittség',

  // Profile - Edit Account Modal
  'modal.editAccount.title': 'Név és felhasználónév',
  'modal.editAccount.hint': 'Ez a név jelenik meg az edzésnaplódban, a mérföldköveknél és a közösségi eredményeidnél.',
  'modal.editAccount.displayNameLabel': 'Teljes megjelenített név',
  'modal.editAccount.displayNamePlaceholder': 'megjelenített név',
  'modal.editAccount.usernameLabel': 'Felhasználónév (@azonosító)',
  'modal.editAccount.usernamePlaceholder': 'felhasználónév',
  'modal.editAccount.saveBtn': 'Módosítások mentése',
  'modal.editAccount.errEmptyUsername': 'A felhasználónév nem lehet üres.',
  'modal.editAccount.savedTitle': 'Profil frissítve',
  'modal.editAccount.savedMsg': 'A megjelenített neved és a felhasználóneved sikeresen frissült.',
  'modal.editAccount.errUpdate': 'Nem sikerült frissíteni a profiladatokat.',

  // Profile - Change Password Modal
  'modal.password.title': 'Jelszó módosítása',
  'modal.password.hint': 'Fiókod biztonsága érdekében az új jelszónak legalább 8 karakter hosszúnak kell lennie.',
  'modal.password.currentLabel': 'Jelenlegi jelszó',
  'modal.password.newLabel': 'Új jelszó',
  'modal.password.newPlaceholder': 'Legalább 8 karakter',
  'modal.password.confirmLabel': 'Új jelszó megerősítése',
  'modal.password.confirmPlaceholder': 'Új jelszó ismét',
  'modal.password.saveBtn': 'Jelszó mentése',
  'modal.password.errCurrentMsg': 'Kérlek, add meg a jelenlegi jelszavadat!',
  'modal.password.errShortTitle': 'Túl rövid jelszó',
  'modal.password.errShortMsg': 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie.',
  'modal.password.errMismatchTitle': 'Nem egyező jelszavak',
  'modal.password.errMismatchMsg': 'Az új jelszó és a megerősítés nem egyezik.',
  'modal.password.savedTitle': 'Jelszó frissítve',
  'modal.password.savedMsg': 'A fiókod jelszava sikeresen megváltozott.',
  'modal.password.errUpdate': 'Nem sikerült módosítani a jelszót.',

  // Profile - Delete Account Modal
  'modal.deleteAccount.title': 'Fiók törlése?',
  'modal.deleteAccount.subtitle': 'Ez a művelet végleges, és nem vonható vissza.',
  'modal.deleteAccount.desc': 'Minden edzésstatisztikád, edzésterved, aktív sorozatod és személyes profiladatod véglegesen törlődik a FitBase szervereiről.',
  'modal.deleteAccount.keepBtn': 'Fiók megtartása',
  'modal.deleteAccount.holdIdle': 'Tartsd nyomva a törléshez (3 mp)',
  'modal.deleteAccount.holdActive': 'Tartsd nyomva a törléshez...',
  'modal.deleteAccount.errTitle': 'Sikertelen törlés',
  'modal.deleteAccount.errFallback': 'Nem sikerült törölni a fiókot a szerverről. Kérlek, próbáld újra!',

  // Profile - Language Selection Modal
  'modal.language.title': 'Nyelv',
  'modal.language.hint': 'Válaszd ki az alkalmazás felületének, az edzésterveknek és az AI Edzőnek a nyelvét.',
  'modal.language.selectedTitle': 'Nyelv beállítva',
  'modal.language.selectedMsg': 'Az alkalmazás nyelve: {{name}} ({{nativeName}}).',
  'lang.en': 'Angol',
  'lang.hu': 'Magyar',
  'lang.de': 'Német',
  'lang.es': 'Spanyol',
  'lang.fr': 'Francia',

  // Statistics Modal & Components
  'stats.headerTitle': 'Statisztikák',
  'stats.backProfile': 'Profil',
  'stats.overview': 'ÁTTEKINTÉS',
  'stats.share': 'Megosztás',
  'stats.metric.workouts': 'Edzések',
  'stats.metric.trainingTime': 'Edzésidő',
  'stats.metric.activeStreak': 'Aktív sorozat',
  'stats.metric.bestStreak': 'Legjobb sorozat',
  'stats.metric.caloriesBurned': 'Elégetett kalória',
  'stats.metric.completion': 'Teljesítés',
  'stats.unit.min': 'perc',
  'stats.unit.hr': 'óra',
  'stats.unit.hrs': 'óra',
  'stats.unit.days': 'nap',
  'stats.unit.kcal': 'kcal',
  'stats.consistency.eyebrow': 'HETI CÉL',
  'stats.consistency.title': 'Cél: heti {{target}} edzés',
  'stats.consistency.remainingOne': 'Még 1 edzés kell a heti cél teljesítéséhez!',
  'stats.consistency.remainingMany': 'Még {{count}} edzés kell a heti cél teljesítéséhez!',
  'stats.consistency.achieved': 'Kiváló! Teljesítetted a heti edzéscélodat! 🎉',
  'stats.activity.title': 'AKTIVITÁS · ELMÚLT 5 HÉT',
  'stats.activity.targetBadge': 'Cél: {{target}}/hét',
  'stats.activity.goalLine': 'Cél ({{target}})',
  'stats.body.title': 'TESTSÚLY ÉS ALAKULÁS',
  'stats.body.currentWeight': 'Jelenlegi súly',
  'stats.body.targetGoal': 'Kitűzött cél',
  'stats.share.title': 'FitBase edzésnapló',
  'stats.share.header': '🏋️ {{name}} FitBase statisztikái:',
  'stats.share.streak': '🔥 Aktív sorozat: {{streak}} nap',
  'stats.share.weekly': '⚡ Ezen a héten teljesítve: {{sessions}} edzés',
  'stats.share.hours': '⏱️ Edzéssel töltött idő: {{hours}} óra',
  'stats.share.footer': 'Kövesd te is a fitneszcéljaidat a FitBase-szel! 💪',

  // Achievements Modal & Service
  'achievements.headerTitle': 'Eredmények',
  'achievements.backProfile': 'Profil',
  'achievements.levelEyebrow': '{{level}}. SZINTŰ FITNESZ',
  'achievements.unlockedCount': '{{unlocked}} / {{total}} jelvény feloldva',
  'achievements.tab.all': 'Összes jelvény',
  'achievements.tab.streak': 'Sorozatok',
  'achievements.tab.workouts': 'Edzések',
  'achievements.tab.dedication': 'Kitartás',
  'achievements.tier.bronze': 'BRONZ',
  'achievements.tier.silver': 'EZÜST',
  'achievements.tier.gold': 'ARANY',
  'achievements.tier.diamond': 'GYÉMÁNT',
  'achievements.unlockedStatus': 'Jelvény feloldva',
  'achievements.progressLabel': 'Haladás: {{current}} / {{target}} {{unit}}',
  'achievements.remainingToUnlock': 'Még {{remaining}} szükséges a jelvény feloldásához',
  'achievements.rank.1': 'Kezdő sportoló',
  'achievements.rank.2': 'Feltörekvő kihívó',
  'achievements.rank.3': 'Elhivatott harcos',
  'achievements.rank.4': 'Az erő mestere',
  'achievements.rank.5': 'A legenda',
  'achievements.unit.workout': 'edzés',
  'achievements.unit.workouts': 'edzés',
  'achievements.unit.days': 'nap',
  'achievements.unit.hours': 'óra',
  'achievements.unit.sessions': 'alkalom',
  'achievements.badge.first_workout.title': 'Első lépés',
  'achievements.badge.first_workout.desc': 'Teljesítsd az első edzésedet a FitBase-ben.',
  'achievements.badge.streak_3.title': 'Szikra',
  'achievements.badge.streak_3.desc': 'Tartsd fenn a lendületet egy 3 napos aktív sorozattal.',
  'achievements.badge.streak_7.title': 'Megállíthatatlan',
  'achievements.badge.streak_7.desc': 'Érj el egy teljes, 7 napos megszakítás nélküli edzéssorozatot.',
  'achievements.badge.streak_14.title': 'Vasakarat',
  'achievements.badge.streak_14.desc': 'Érj el egy lenyűgöző, 14 napos edzéssorozatot.',
  'achievements.badge.workouts_5.title': 'Ötös csapás',
  'achievements.badge.workouts_5.desc': 'Teljesíts összesen 5 edzést.',
  'achievements.badge.workouts_10.title': 'Elhivatottság',
  'achievements.badge.workouts_10.desc': 'Fejezz be 10 intenzív edzést.',
  'achievements.badge.hours_5.title': 'Homokóra',
  'achievements.badge.hours_5.desc': 'Gyűjts össze összesen 5 órányi fókuszált edzést.',
  'achievements.badge.hours_20.title': 'Állóképesség bajnoka',
  'achievements.badge.hours_20.desc': 'Teljesíts összesen 20 óra edzést.',
  'achievements.badge.goal_crusher.title': 'Célratörő',
  'achievements.badge.goal_crusher.desc': 'Teljesítsd 100%-osan a kitűzött heti edzéscélodat.',
  'achievements.badge.century_club.title': 'Százasok klubja',
  'achievements.badge.century_club.desc': 'Legendás státusz: teljesíts 100 edzést.',

  // Common Buttons & Dialogs
  'common.ok': 'Rendben',
  'common.gotIt': 'Értem',
  'common.awesome': 'Szuper',
  'common.understood': 'Rendben',
  'common.close': 'Bezárás',
  'common.cancel': 'Mégse',
  'common.save': 'Mentés',
  'common.confirm': 'Megerősítés',
  'common.remove': 'Eltávolítás',
  'common.error': 'Hiba',
  'common.missingField': 'Hiányzó adat',
  'common.updateFailed': 'Sikertelen mentés',
  'common.openContactLink': 'Kapcsolat megnyitása',
  'common.confirmActionDefault': 'Biztosan folytatni szeretnéd ezt a műveletet?',

  // --- Reconciled component translation keys ---
  'coach.senderAi': 'AI Edző',
  'library.exerciseDefault': 'Gyakorlat',
  'library.posePreviewA11y': '{{title}} gyakorlat végrehajtási animációja',
  'library.poseStartA11y': '{{title}} kiinduló póz',
  'library.posePeakA11y': '{{title}} csúcskontrakciós póz',
  'home.routine.checkAtLeastOneNotice': 'Kérlek, pipálj ki legalább egy gyakorlatot a KÉSZ megnyomása előtt!',
  'home.routine.completedStreakNotice': 'Edzés befejezve! +1 napi sorozat 🔥',
  'home.routine.onlyTodayCheckNotice': 'Gyakorlatokat csak a mai edzésnél pipálhatsz ki!',
  'home.timer.workoutTimerHeader': 'EDZÉS IDŐZÍTŐ',
  'home.timer.todaysRoutineHeader': 'MAI EDZÉSTERV',
  'home.timer.dayRoutineHeader': '{{day}}I EDZÉSTERV',
  'home.timer.seconds40': '40 mp',
  'home.timer.work': 'Munka',
  'home.timer.seconds60': '60 mp',
  'home.timer.rest': 'Pihenő',
  'home.routine.restAndRecovery': 'Pihenés és regeneráció',
  'home.routine.dayRestDay': '{{day}} · Pihenőnap',
  'home.routine.restTodayDesc': 'Pihenj egyet, megérdemled! Az izomzat regenerációja elengedhetetlen a fejlődéshez.',
  'home.routine.restOtherDayDesc': 'Nincs edzés betervezve {{day}}ra. Ideje a regenerációnak.',
  'home.routine.backToToday': 'Vissza a mai naphoz',
  'home.routine.viewFullPlan': 'Teljes edzésterv megtekintése ➔',
  'home.routine.workoutDefault': 'Edzés',
  'home.routine.emptyWorkoutTitle': 'Üres edzésnap',
  'home.routine.dayWorkoutTitle': '{{day}} · Edzés',
  'home.routine.emptyTodayDesc': 'Ez a nap edzésnapként van beállítva 0 gyakorlattal. Adj hozzá gyakorlatokat a tárból a rutinod összeállításához.',
  'home.routine.emptyOtherDayDesc': 'Még nincsenek gyakorlatok hozzáadva a {{day}}i edzéshez.',
  'home.routine.addExercisesBtn': 'Gyakorlatok hozzáadása ➔',
  'home.routine.daySessionFallback': '{{day}}i edzés',
  'home.routine.previewReadOnly': 'ELŐNÉZET · CSAK OLVASHATÓ',
  'home.routine.backToTodayRoutine': 'Vissza a mai rutinhoz',
  'home.routine.workoutCompletedBadge': 'EDZÉS BEFEJEZVE',
  'home.routine.completedSummaryLocked': '{{checked}} / {{total}} elvégezve · Mára lezárva',
  'home.routine.doneBtn': 'KÉSZ!',
  'home.weeklyGoal.remainingSessions': 'Még {{count}} {{unit}} a heti célod eléréséhez.',
  'home.weeklyGoal.targetAchieved': 'Cél elérve! Kiemelkedő következetesség ezen a héten 🎉',
  'home.weeklyGoal.sessionsFraction': ' / {{target}} edzés',
  'library.detail.fullBody': 'Teljes test',
  'library.detail.durationDefault': '0 perc 30 mp',
  'library.detail.restDefault': '1 perc 00 mp',
  'library.detail.descriptionHeading': 'Leírás',
  'library.detail.detailsHeading': 'Gyakorlat részletei',
  'library.detail.instructionsHeading': 'Végrehajtási útmutató',
  'library.toggleFilterA11y': 'Gyakorlatok szűrése',
  'library.clearSearchA11y': 'Keresés törlése',
  'plan.build.cancelBtn': 'Mégse',
  'plan.month.overviewEyebrow': 'HAVI ÁTTEKINTÉS',
  'plan.month.workoutsKpi': 'edzés',
  'plan.month.restKpi': 'pihenő',
  'plan.quickActions.buildFullTitle': 'Teljes edzésterv készítése',
  'plan.quickActions.buildFullDesc': 'Válassz 1 hetes, 2 hetes vagy 4 hetes felosztást',
  'plan.quickActions.deleteEntireTitle': 'Teljes edzésterv törlése',
  'plan.quickActions.deleteEntireDesc': 'Az összes betervezett edzés teljes eltávolítása',
  'plan.quickActions.cancelBtn': 'Mégse',
  'plan.approxDuration': '~{{mins}} perc',
  'plan.blueprintLabel': 'Sablon',
  'achievements.card.unlocked': 'Jelvény feloldva',
  'achievements.card.progress': 'Előrehaladás: {{current}} / {{target}} {{unit}}',
  'achievements.card.remaining': 'Még {{count}} szükséges a feloldáshoz',
  'achievements.filter.all': 'Összes jelvény',
  'achievements.filter.streak': 'Sorozatok',
  'achievements.filter.workouts': 'Edzések',
  'achievements.filter.dedication': 'Elhivatottság',
  'achievements.closeA11y': 'Jelvények bezárása és visszalépés',
  'achievements.title': 'Eredmények',
  'achievements.levelFitness': '{{level}}. SZINTŰ FITTSÉG',
  'achievements.badgesUnlocked': '{{unlocked}} / {{total}} jelvény feloldva',
  'profile.avatar.modalTitle': 'Profilkép',
  'profile.avatar.modalSubtitle': 'Válassz műveletet a képed frissítéséhez',
  'profile.avatar.cancel': 'Mégse',
  'profile.password.missingCurrentTitle': 'Hiányzó adat',
  'profile.password.missingCurrentMsg': 'Kérlek, add meg a jelenlegi jelszavadat.',
  'profile.password.tooShortTitle': 'A jelszó túl rövid',
  'profile.password.tooShortMsg': 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie.',
  'profile.password.mismatchTitle': 'A jelszavak nem egyeznek',
  'profile.password.mismatchMsg': 'Az új jelszó és a megerősítés nem egyezik.',
  'profile.password.updatedTitle': 'Jelszó frissítve',
  'profile.password.updatedMsg': 'A fiókod jelszava sikeresen megváltozott.',
  'profile.password.failedTitle': 'A módosítás sikertelen',
  'profile.password.failedMsg': 'Nem sikerült megváltoztatni a jelszót.',
  'profile.password.modalTitle': 'Jelszó megváltoztatása',
  'profile.password.hint': 'A fiókod védelmében az új jelszónak legalább 8 karakteresnek kell lennie.',
  'profile.password.currentLabel': 'JELENLEGI JELSZÓ',
  'profile.password.newLabel': 'ÚJ JELSZÓ',
  'profile.password.newPlaceholder': 'Legalább 8 karakter',
  'profile.password.confirmLabel': 'ÚJ JELSZÓ MEGERŐSÍTÉSE',
  'profile.password.confirmPlaceholder': 'Ismételd meg az új jelszót',
  'profile.password.cancelBtn': 'Mégse',
  'profile.password.saveBtn': 'Jelszó mentése',
  'profile.deleteAccount.failedTitle': 'A törlés sikertelen',
  'profile.deleteAccount.failedMsg': 'Nem sikerült törölni a fiókot a szerverről. Kérlek, próbáld újra.',
  'profile.deleteAccount.modalTitle': 'Fiók törlése?',
  'profile.deleteAccount.warningText': 'Ez a művelet végleges és nem vonható vissza.',
  'profile.deleteAccount.description': 'Minden edzési statisztikád, rutinod, aktív sorozatod és személyes profiladatod véglegesen törlődik a FitBase szervereiről.',
  'profile.deleteAccount.keepAccountBtn': 'Fiók megtartása',
  'profile.deleteAccount.holdA11yLabel': 'Tartsd nyomva a fiók végleges törléséhez',
  'profile.deleteAccount.holdA11yHint': 'Tartsd nyomva 3 másodpercig a fiók törléséhez',
  'profile.deleteAccount.holdBtnActive': 'Tartsd nyomva a törléshez...',
  'profile.deleteAccount.holdBtnIdle': 'Tartsd nyomva a törléshez (3 mp)',
  'profile.editAccount.missingTitle': 'Hiányzó mező',
  'profile.editAccount.missingUsernameMsg': 'A felhasználónév nem lehet üres.',
  'profile.editAccount.updatedTitle': 'Profil frissítve',
  'profile.editAccount.updatedMsg': 'A megjelenített neved és a felhasználóneved sikeresen frissült.',
  'profile.editAccount.failedTitle': 'A módosítás sikertelen',
  'profile.editAccount.failedMsg': 'Nem sikerült frissíteni a profil adatait.',
  'profile.editAccount.modalTitle': 'Név és fiók szerkesztése',
  'profile.editAccount.hint': 'Ez a név jelenik meg az edzésnaplódban, a mérföldköveknél és az elért eredményeidnél.',
  'profile.editAccount.displayNameLabel': 'TELJES MEGJELENÍTETT NÉV',
  'profile.editAccount.displayNamePlaceholder': 'megjelenített név',
  'profile.editAccount.usernameLabel': 'FELHASZNÁLÓNÉV (@AZONOSÍTÓ)',
  'profile.editAccount.usernamePlaceholder': 'felhasználónév',
  'profile.editAccount.cancelBtn': 'Mégse',
  'profile.editAccount.saveBtn': 'Módosítások mentése',
  'profile.bodyMetrics.invalidWeightTitle': 'Érvénytelen testsúly',
  'profile.bodyMetrics.invalidWeightMsg': 'Kérlek, valós testsúlyt adj meg (20 és 300 kg között).',
  'profile.bodyMetrics.invalidHeightTitle': 'Érvénytelen testmagasság',
  'profile.bodyMetrics.invalidHeightMsg': 'Kérlek, valós magasságot adj meg (50 és 260 cm között).',
  'profile.bodyMetrics.savedTitle': 'Mérések elmentve',
  'profile.bodyMetrics.savedMsg': 'A testsúlyod és testmagasságod sikeresen frissült.',
  'profile.bodyMetrics.failedTitle': 'A mentés sikertelen',
  'profile.bodyMetrics.failedMsg': 'Nem sikerült frissíteni a testméreteket.',
  'profile.bodyMetrics.modalTitle': 'Testsúly és magasság',
  'profile.bodyMetrics.hint': 'A testi adataidat az anyagcsere-sebesség, a kalóriaégetés és a testtömegindex (BMI) kiszámításához használjuk.',
  'profile.bodyMetrics.weightLabel': 'TESTSÚLY (KG)',
  'profile.bodyMetrics.weightPlaceholder': 'pl. 78',
  'profile.bodyMetrics.heightLabel': 'TESTMAGASSÁG (CM)',
  'profile.bodyMetrics.heightPlaceholder': 'pl. 182',
  'profile.bodyMetrics.bmiHeader': 'WHO Testtömegindex (BMI)',
  'profile.bodyMetrics.cancelBtn': 'Mégse',
  'profile.bodyMetrics.saveBtn': 'Mérések mentése',
  'profile.menu.genderAge': 'Nem és életkor',
  'profile.demographics.modalTitle': 'Nem és életkor',
  'profile.demographics.hint': 'Ezeket az adatokat az alapanyagcsere, a kalóriaégetés és az edzésajánlások személyre szabásához használjuk.',
  'profile.demographics.genderLabel': 'NEM',
  'profile.demographics.ageLabel': 'ÉLETKOR (ÉV)',
  'profile.demographics.agePlaceholder': 'pl. 25',
  'profile.demographics.ageSuffix': '{{age}} éves',
  'profile.demographics.invalidAgeTitle': 'Érvénytelen életkor',
  'profile.demographics.invalidAgeMsg': 'Kérlek, adj meg valós életkort (10 és 120 év között).',
  'profile.demographics.savedTitle': 'Adatok elmentve',
  'profile.demographics.savedMsg': 'A nemed és az életkorod sikeresen frissült.',
  'profile.demographics.failedTitle': 'A mentés sikertelen',
  'profile.demographics.failedMsg': 'Nem sikerült frissíteni a személyes adatokat.',
  'profile.demographics.cancelBtn': 'Mégse',
  'profile.demographics.saveBtn': 'Adatok mentése',
  'profile.fitnessGoals.updatedTitle': 'Célok frissítve',
  'profile.fitnessGoals.updatedMsg': 'Az edzéscélod és tapasztalati szinted sikeresen elmentve.',
  'profile.fitnessGoals.failedTitle': 'A mentés sikertelen',
  'profile.fitnessGoals.failedMsg': 'Nem sikerült frissíteni az edzéscélokat.',
  'profile.fitnessGoals.modalTitle': 'Edzéscél és tapasztalati szint',
  'profile.fitnessGoals.hint': 'Válaszd ki a fő fókuszterületedet és a jelenlegi tapasztalati szintedet az edzések nehézségének személyre szabásához.',
  'profile.fitnessGoals.primaryGoalLabel': 'ELSŐDLEGES CÉL',
  'profile.fitnessGoals.experienceLevelLabel': 'TAPASZTALATI SZINT',
  'profile.fitnessGoals.cancelBtn': 'Mégse',
  'profile.fitnessGoals.saveBtn': 'Célok mentése',
  'profile.targetWeight.invalidTitle': 'Érvénytelen célsúly',
  'profile.targetWeight.invalidMsg': 'Kérlek, valós célsúlyt adj meg (20 és 300 kg között).',
  'profile.targetWeight.savedTitle': 'Célsúly elmentve',
  'profile.targetWeight.savedMsg': 'A célsúlyod sikeresen frissült a profilodban.',
  'profile.targetWeight.failedTitle': 'A mentés sikertelen',
  'profile.targetWeight.failedMsg': 'Nem sikerült frissíteni a célsúlyt.',
  'profile.targetWeight.modalTitle': 'Kitűzött célsúly',
  'profile.targetWeight.hint': 'Határozd meg az ideális testsúlyodat. A FitBase ezt használja a fejlődési pályád és átalakulásod nyomon követéséhez.',
  'profile.targetWeight.currentWeightLabel': 'JELENLEGI TESTSÚLY',
  'profile.targetWeight.notSet': 'Nincs megadva',
  'profile.targetWeight.targetGoalLabel': 'KITŰZÖTT CÉL',
  'profile.targetWeight.inputLabel': 'Célsúly (kg)',
  'profile.targetWeight.inputPlaceholder': 'pl. 75',
  'profile.targetWeight.cancelBtn': 'Mégse',
  'profile.targetWeight.saveBtn': 'Célsúly mentése',
  'profile.language.selectedTitle': 'Nyelv kiválasztva',
  'profile.language.selectedFullMsg': 'Az alkalmazás nyelve sikeresen átállítva: {{name}} ({{nativeName}}).',
  'profile.language.selectedUpcomingMsg': 'A(z) {{name}} nyelv kiválasztva. Egyes felületek fordítása még bővítés alatt áll.',
  'profile.language.langName.en': 'Angol',
  'profile.language.langName.hu': 'Magyar',
  'profile.language.langName.de': 'Német',
  'profile.language.langName.es': 'Spanyol',
  'profile.language.langName.fr': 'Francia',
  'profile.language.modalTitle': 'Nyelv / Language',
  'profile.language.hint': 'Válaszd ki az alkalmazás nyelvét a menükhöz, edzéstervekhez és az AI edző válaszaihoz.',
  'profile.avatar.changePhotoA11y': 'Profilkép módosítása',
  'statistics.activity.sectionTitle': 'AKTIVITÁS · ELMÚLT 5 HÉT',
  'statistics.activity.targetPerWeek': 'Cél: {{count}}/hét',
  'statistics.activity.goalTag': 'Cél ({{count}})',
  'statistics.body.sectionTitle': 'TEST ÉS SÚLYFEJLŐDÉS',
  'statistics.body.currentWeight': 'Jelenlegi súly',
  'statistics.body.targetGoal': 'Kitűzött cél',
  'statistics.body.kgLeft': 'még {{diff}} kg',
  'statistics.body.bmiLabel': 'WHO Testtömegindex (BMI)',
  'statistics.closeA11y': 'Statisztikák bezárása és visszalépés',
  'statistics.backProfile': 'Profil',
  'statistics.title': 'Statisztikák',
  'statistics.unit.min': 'perc',
  'statistics.unit.hr': 'óra',
  'statistics.unit.hrs': 'óra',
  'statistics.unit.hoursMinutes': '{{hours}} ó {{mins}} p',
  'statistics.overview': 'ÁTTEKINTÉS',
  'statistics.shareA11y': 'Fitnesz fejlődésed megosztása',
  'statistics.share': 'Megosztás',
  'statistics.metric.workouts': 'Edzések',
  'statistics.metric.trainingTime': 'Edzésidő',
  'statistics.metric.activeStreak': 'Aktív sorozat',
  'statistics.unit.days': 'nap',
  'statistics.metric.bestStreak': 'Legjobb sorozat',
  'statistics.metric.caloriesBurned': 'Elégetett kalória',
  'statistics.unit.kcal': 'kcal',
  'statistics.metric.completion': 'Teljesítés',
  'statistics.weeklyTarget.subtitle': 'HETI CÉL',
  'statistics.weeklyTarget.title': 'Cél: heti {{target}} edzés',
  'statistics.weeklyTarget.remainingOne': 'Még 1 edzés van hátra a héten!',
  'statistics.weeklyTarget.remainingMany': 'Még {{count}} edzés van hátra a héten!',
  'statistics.weeklyTarget.completed': 'Kiváló! Teljesítetted a heti fitneszcélodat! 🎉',
};


/**
 * Hungarian grammatical forms for each day index (0 = Monday ... 6 = Sunday)
 */
interface DayForms {
  full: string;         // Hétfő
  fullLower: string;    // hétfő
  shortUpper: string;   // HÉT
  calendarCol: string;  // H
  adjectival: string;   // hétfői (pl. "hétfői edzésterv")
  adjectivalCap: string;// Hétfői
  sublative: string;    // hétfőre (pl. "hétfőre nincs edzés")
  sublativeCap: string; // Hétfőre
  accusative: string;   // a hétfőt (pl. "Jelöld meg a hétfőt pihenőnapként")
}

const HU_DAY_FORMS: readonly DayForms[] = [
  { full: 'Hétfő', fullLower: 'hétfő', shortUpper: 'HÉT', calendarCol: 'H', adjectival: 'hétfői', adjectivalCap: 'Hétfői', sublative: 'hétfőre', sublativeCap: 'Hétfőre', accusative: 'a hétfőt' },
  { full: 'Kedd', fullLower: 'kedd', shortUpper: 'KE', calendarCol: 'K', adjectival: 'keddi', adjectivalCap: 'Keddi', sublative: 'keddre', sublativeCap: 'Keddre', accusative: 'a keddet' },
  { full: 'Szerda', fullLower: 'szerda', shortUpper: 'SZE', calendarCol: 'Sz', adjectival: 'szerdai', adjectivalCap: 'Szerdai', sublative: 'szerdára', sublativeCap: 'Szerdára', accusative: 'a szerdát' },
  { full: 'Csütörtök', fullLower: 'csütörtök', shortUpper: 'CSÜT', calendarCol: 'Cs', adjectival: 'csütörtöki', adjectivalCap: 'Csütörtöki', sublative: 'csütörtökre', sublativeCap: 'Csütörtökre', accusative: 'a csütörtököt' },
  { full: 'Péntek', fullLower: 'péntek', shortUpper: 'PÉN', calendarCol: 'P', adjectival: 'pénteki', adjectivalCap: 'Pénteki', sublative: 'péntekre', sublativeCap: 'Péntekre', accusative: 'a pénteket' },
  { full: 'Szombat', fullLower: 'szombat', shortUpper: 'SZO', calendarCol: 'Sz', adjectival: 'szombati', adjectivalCap: 'Szombati', sublative: 'szombatra', sublativeCap: 'Szombatra', accusative: 'a szombatot' },
  { full: 'Vasárnap', fullLower: 'vasárnap', shortUpper: 'VAS', calendarCol: 'V', adjectival: 'vasárnapi', adjectivalCap: 'Vasárnapi', sublative: 'vasárnapra', sublativeCap: 'Vasárnapra', accusative: 'a vasárnapot' },
];

const EN_DAY_FORMS: readonly DayForms[] = [
  { full: 'Monday', fullLower: 'Monday', shortUpper: 'MON', calendarCol: 'M', adjectival: "Monday's", adjectivalCap: "Monday's", sublative: 'Monday', sublativeCap: 'Monday', accusative: 'Monday' },
  { full: 'Tuesday', fullLower: 'Tuesday', shortUpper: 'TUE', calendarCol: 'T', adjectival: "Tuesday's", adjectivalCap: "Tuesday's", sublative: 'Tuesday', sublativeCap: 'Tuesday', accusative: 'Tuesday' },
  { full: 'Wednesday', fullLower: 'Wednesday', shortUpper: 'WED', calendarCol: 'W', adjectival: "Wednesday's", adjectivalCap: "Wednesday's", sublative: 'Wednesday', sublativeCap: 'Wednesday', accusative: 'Wednesday' },
  { full: 'Thursday', fullLower: 'Thursday', shortUpper: 'THU', calendarCol: 'T', adjectival: "Thursday's", adjectivalCap: "Thursday's", sublative: 'Thursday', sublativeCap: 'Thursday', accusative: 'Thursday' },
  { full: 'Friday', fullLower: 'Friday', shortUpper: 'FRI', calendarCol: 'F', adjectival: "Friday's", adjectivalCap: "Friday's", sublative: 'Friday', sublativeCap: 'Friday', accusative: 'Friday' },
  { full: 'Saturday', fullLower: 'Saturday', shortUpper: 'SAT', calendarCol: 'S', adjectival: "Saturday's", adjectivalCap: "Saturday's", sublative: 'Saturday', sublativeCap: 'Saturday', accusative: 'Saturday' },
  { full: 'Sunday', fullLower: 'Sunday', shortUpper: 'SUN', calendarCol: 'S', adjectival: "Sunday's", adjectivalCap: "Sunday's", sublative: 'Sunday', sublativeCap: 'Sunday', accusative: 'Sunday' },
];

const HU_MONTHS_CAP = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December',
];

const HU_MONTHS_LOWER = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
];

const HU_MONTHS_SHORT = [
  'jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.',
  'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.',
];

const EN_MONTHS_CAP = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Dynamic workout title & zone translations (English <-> Hungarian)
 */
const WORKOUT_TITLE_HU_MAP: Record<string, string> = {
  'rest day': 'Pihenőnap',
  'rest': 'Pihenőnap',
  'pihenőnap': 'Pihenőnap',
  'workout': 'Edzés',
  'workout day': 'Edzésnap',
  'scheduled workout': 'Ütemezett edzés',
  'workout session': 'Edzés',
  'full body & core': 'Teljes test és törzs',
  'full body': 'Teljes test',
  'upper body': 'Felsőtest',
  'lower body': 'Alsótest',
  'back & shoulders': 'Hát és váll',
  'chest & triceps': 'Mell és tricepsz',
  'chest & arms': 'Mell és kar',
  'back & biceps': 'Hát és bicepsz',
  'back & arms': 'Hát és kar',
  'chest & shoulders': 'Mell és váll',
  'chest & back': 'Mell és hát',
  'shoulders & arms': 'Váll és kar',
  'legs & core': 'Láb és törzs',
  'arms & core': 'Kar és törzs',
  'chest': 'Mell edzés',
  'back': 'Hát edzés',
  'shoulders': 'Váll edzés',
  'leg day': 'Lábnap',
  'legs': 'Lábnap',
  'biceps': 'Bicepsz',
  'triceps': 'Tricepsz',
  'arm day': 'Karnap',
  'arms': 'Karnap',
  'core & abs': 'Törzs és has',
  'core': 'Törzs és has',
  'cardio & conditioning': 'Kardió és állóképesség',
  'cardio': 'Kardió',
  'push day': 'Toló nap (Push)',
  'pull day': 'Húzó nap (Pull)',
  'upper body strength': 'Felsőtest erő',
  'lower body power': 'Alsótest erő',
  'active recovery & core': 'Aktív regeneráció és törzs',
  'hiit & full body': 'HIIT és teljes test',
};

const ZONE_NAME_HU_MAP: Record<string, string> = {
  'chest': 'Mell',
  'back': 'Hát',
  'shoulders': 'Váll',
  'arms': 'Kar',
  'upper arms': 'Kar',
  'lower arms': 'Alkar',
  'legs': 'Láb',
  'upper legs': 'Combizmok',
  'lower legs': 'Vádli',
  'core': 'Törzs',
  'waist': 'Derék és has',
  'full body': 'Teljes test',
  'cardio': 'Kardió',
  'compound': 'Összetett',
  'general': 'Általános',
  'blueprint': 'Tervsablon',
};

const MUSCLE_HU_MAP: Record<string, string> = {
  'chest': 'Mellizom',
  'pectoralis major': 'Nagy mellizom',
  'pectorals': 'Mellizmok',
  'back': 'Hátizom',
  'latissimus dorsi': 'Széles hátizom',
  'lats': 'Széles hátizom',
  'trapezius': 'Trapézizom',
  'traps': 'Trapézizom',
  'rhomboids': 'Rombuszizom',
  'erector spinae': 'Gerincmerevítő izom',
  'lower back': 'Alsó hát',
  'shoulders': 'Vállizom',
  'deltoids': 'Deltaizom',
  'anterior deltoid': 'Elülső deltaizom',
  'anterior deltoids': 'Elülső deltaizom',
  'lateral deltoid': 'Oldalsó deltaizom',
  'posterior deltoid': 'Hátsó deltaizom',
  'biceps': 'Bicepsz',
  'biceps brachii': 'Kétfejű karizom (bicepsz)',
  'brachialis': 'Karizom',
  'brachioradialis': 'Karorsói izom',
  'triceps': 'Tricepsz',
  'triceps brachii': 'Háromfejű karizom (tricepsz)',
  'forearms': 'Alkar',
  'forearm extensors': 'Alkar feszítőizmai',
  'forearm flexors': 'Alkar hajlítóizmai',
  'quadriceps': 'Négyfejű combizom',
  'quads': 'Combfeszítő',
  'hamstrings': 'Combhajlító',
  'glutes': 'Farizom',
  'gluteus maximus': 'Nagy farizom',
  'gluteus medius': 'Középső farizom',
  'calves': 'Vádli',
  'gastrocnemius': 'Vádli',
  'soleus': 'Gázlóizom',
  'tibialis anterior': 'Elülső sípcsonti izom',
  'abs': 'Hasizom',
  'abdominals': 'Hasizmok',
  'rectus abdominis': 'Egyenes hasizom',
  'transverse abdominis': 'Haránt hasizom',
  'obliques': 'Ferde hasizom',
  'serratus anterior': 'Elülső fűrészizom',
  'core': 'Törzsizmok',
  'hip flexors': 'Csípőhorpasz',
  'adductors': 'Combközelítő',
  'abductors': 'Combtávolító',
  'full body': 'Teljes test',
};



type LanguageChangeListener = (lang: SupportedLanguageCode) => void;

/**
 * LocalizationService (Singleton OOP Service)
 *
 * Provides centralized multilingual translation, grammatical inflection for Hungarian
 * dates/days/plurals, number formatting, and dynamic domain string localization.
 */
export class LocalizationService {
  private static instance: LocalizationService;
  private currentLanguage: SupportedLanguageCode = 'en';
  private listeners: Set<LanguageChangeListener> = new Set();
  private initialized = false;

  private constructor() { }

  public static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  public async init(): Promise<SupportedLanguageCode> {
    if (this.initialized) return this.currentLanguage;
    try {
      const saved = await AsyncStorage.getItem(STORAGE_LANGUAGE_KEY);
      if (saved && this.isValidLanguage(saved)) {
        this.currentLanguage = saved;
      }
    } catch {
      // Fallback to default
    }
    this.initialized = true;
    return this.currentLanguage;
  }

  private isValidLanguage(code: string): code is SupportedLanguageCode {
    return ['en', 'hu', 'de', 'es', 'fr'].includes(code);
  }

  public getLanguage(): SupportedLanguageCode {
    return this.currentLanguage;
  }

  public isHungarian(): boolean {
    return this.currentLanguage === 'hu';
  }

  public async setLanguage(code: string): Promise<void> {
    const validCode: SupportedLanguageCode = this.isValidLanguage(code) ? code : 'en';
    this.currentLanguage = validCode;
    this.initialized = true;
    try {
      await AsyncStorage.setItem(STORAGE_LANGUAGE_KEY, validCode);
    } catch {
      // Ignore storage write error
    }
    this.listeners.forEach((listener) => listener(validCode));
  }

  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Translates a key with optional template interpolation `{{variable}}`.
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const dict = this.currentLanguage === 'hu' ? HU_TRANSLATIONS : EN_TRANSLATIONS;
    let template = dict[key] ?? EN_TRANSLATIONS[key] ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        const formattedVal =
          this.currentLanguage === 'hu' && typeof v === 'number'
            ? this.formatNumber(v)
            : String(v);
        template = template.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), formattedVal);
      }
    }

    return template;
  }

  /**
   * Formats numbers according to active locale (comma decimal in Hungarian, dot in English).
   */
  public formatNumber(value: number): string {
    const str = String(value);
    if (this.currentLanguage === 'hu') {
      return str.replace('.', ',');
    }
    return str;
  }

  /**
   * Resolves a day index (0 = Mon ... 6 = Sun) from either number or English/Hungarian day string.
   */
  public resolveDayIndex(dayOrIndex: string | number): number {
    if (typeof dayOrIndex === 'number') {
      return ((dayOrIndex % 7) + 7) % 7;
    }
    const clean = dayOrIndex.trim().toLowerCase();
    const map: Record<string, number> = {
      mon: 0, monday: 0, hét: 0, hétfő: 0, hetfo: 0,
      tue: 1, tuesday: 1, ked: 1, kedd: 1,
      wed: 2, wednesday: 2, sze: 2, szerda: 2,
      thu: 3, thursday: 3, csü: 3, csütörtök: 3, csutortok: 3,
      fri: 4, friday: 4, pén: 4, péntek: 4, pentek: 4,
      sat: 5, saturday: 5, szo: 5, szombat: 5,
      sun: 6, sunday: 6, vas: 6, vasárnap: 6, vasarnap: 6,
    };
    return map[clean] ?? 0;
  }

  public getDayForms(dayOrIndex: string | number): DayForms {
    const idx = this.resolveDayIndex(dayOrIndex);
    return this.currentLanguage === 'hu' ? HU_DAY_FORMS[idx] : EN_DAY_FORMS[idx];
  }

  public getCalendarColumnHeaders(): readonly string[] {
    const list = this.currentLanguage === 'hu' ? HU_DAY_FORMS : EN_DAY_FORMS;
    return list.map((d) => d.calendarCol);
  }

  public getShortUpperDays(): readonly string[] {
    const list = this.currentLanguage === 'hu' ? HU_DAY_FORMS : EN_DAY_FORMS;
    return list.map((d) => d.shortUpper);
  }

  public getMonthName(monthIndex: number, capitalized = true): string {
    const idx = ((monthIndex % 12) + 12) % 12;
    if (this.currentLanguage === 'hu') {
      return capitalized ? HU_MONTHS_CAP[idx] : HU_MONTHS_LOWER[idx];
    }
    return EN_MONTHS_CAP[idx];
  }

  public getShortMonthName(monthIndex: number): string {
    const idx = ((monthIndex % 12) + 12) % 12;
    if (this.currentLanguage === 'hu') {
      return HU_MONTHS_SHORT[idx];
    }
    return EN_MONTHS_SHORT[idx];
  }

  /**
   * Formats the top greeting date header (e.g. "Wednesday, October 29" vs "október 29., szerda")
   */
  public formatGreetingDate(date: Date = new Date()): string {
    const jsDay = date.getDay();
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    const monthIdx = date.getMonth();
    const dayNum = date.getDate();

    if (this.currentLanguage === 'hu') {
      const monthName = HU_MONTHS_CAP[monthIdx];
      const dayName = HU_DAY_FORMS[dayIdx].fullLower;
      return `${monthName} ${dayNum}., ${dayName}`;
    }

    return `${EN_DAY_FORMS[dayIdx].full}, ${EN_MONTHS_CAP[monthIdx]} ${dayNum}`;
  }

  /**
   * Formats week range (e.g. "Oct 19–25" vs "okt. 19–25." or "okt. 27. – nov. 2.")
   */
  public formatWeekRange(monday: Date, sunday: Date): string {
    const startMonth = monday.getMonth();
    const endMonth = sunday.getMonth();
    const startDay = monday.getDate();
    const endDay = sunday.getDate();

    if (this.currentLanguage === 'hu') {
      const sMonth = HU_MONTHS_SHORT[startMonth];
      const eMonth = HU_MONTHS_SHORT[endMonth];
      if (startMonth === endMonth) {
        return `${sMonth} ${startDay}–${endDay}.`;
      }
      return `${sMonth} ${startDay}. – ${eMonth} ${endDay}.`;
    }

    const sMonth = EN_MONTHS_SHORT[startMonth];
    const eMonth = EN_MONTHS_SHORT[endMonth];
    if (startMonth === endMonth) {
      return `${sMonth} ${startDay}–${endDay}`;
    }
    return `${sMonth} ${startDay} – ${eMonth} ${endDay}`;
  }

  /**
   * Formats month & year (e.g. "October 2026" vs "2026. október")
   */
  public formatMonthYear(date: Date): string {
    const year = date.getFullYear();
    const monthIdx = date.getMonth();
    if (this.currentLanguage === 'hu') {
      return `${year}. ${HU_MONTHS_LOWER[monthIdx]}`;
    }
    return `${EN_MONTHS_CAP[monthIdx]} ${year}`;
  }

  /**
   * Formats short month + day (e.g. "Oct 19" vs "okt. 19.")
   */
  public formatShortMonthDay(date: Date): string {
    const monthIdx = date.getMonth();
    const day = date.getDate();
    if (this.currentLanguage === 'hu') {
      return `${HU_MONTHS_SHORT[monthIdx]} ${day}.`;
    }
    return `${EN_MONTHS_SHORT[monthIdx]} ${day}`;
  }

  /**
   * Formats exercise count ("1 exercise" / "5 exercises" vs "1 gyakorlat" / "5 gyakorlat")
   */
  public formatExerciseCount(count: number): string {
    if (count === 0) return this.t('home.timer.zeroExercises');
    if (count === 1) return this.t('home.timer.exerciseCountOne');
    return this.t('home.timer.exerciseCountMany', { count });
  }

  /**
   * Translates dynamic workout titles (e.g., "Chest & Triceps" -> "Mell és tricepsz")
   */
  public translateWorkoutTitle(title?: string | null): string {
    if (!title) return this.t('plan.workoutFallback');
    const clean = title.trim();
    if (this.currentLanguage !== 'hu') {
      if (clean.toLowerCase() === 'pihenőnap') return 'Rest Day';
      return clean;
    }

    const lower = clean.toLowerCase();
    if (WORKOUT_TITLE_HU_MAP[lower]) {
      return WORKOUT_TITLE_HU_MAP[lower];
    }

    // Handle "Zone1 & Zone2" pattern dynamically
    if (clean.includes(' & ')) {
      const parts = clean.split(' & ').map((p) => {
        const k = p.trim().toLowerCase();
        return ZONE_NAME_HU_MAP[k] || WORKOUT_TITLE_HU_MAP[k] || p.trim();
      });
      return parts.join(' és ');
    }

    return clean;
  }

  /**
   * Translates workout metadata strings (e.g., "Compound · Full Body · ~45min" -> "Összetett · Teljes test · ~45 perc")
   */
  public translateWorkoutMeta(meta?: string | null): string {
    if (!meta) return '';
    if (this.currentLanguage !== 'hu') return meta;

    return meta
      .split('·')
      .map((segment) => {
        const s = segment.trim();
        const lower = s.toLowerCase();
        if (ZONE_NAME_HU_MAP[lower]) {
          return ZONE_NAME_HU_MAP[lower];
        }
        // Match "~45min" or "~40 min"
        const minMatch = s.match(/^~?\s*(\d+)\s*min$/i);
        if (minMatch) {
          return `~${minMatch[1]} perc`;
        }
        // Match "4 exercises" or "1 exercise"
        const exMatch = s.match(/^(\d+)\s*exercises?$/i);
        if (exMatch) {
          return `${exMatch[1]} gyakorlat`;
        }
        return s;
      })
      .join(' · ');
  }

  /**
   * Translates exercise title using the full 650-slug Hungarian catalog and aliases.
   */
  public translateExerciseTitle(title: string, slug?: string | null): string {
    if (!title && !slug) return '';
    if (this.currentLanguage !== 'hu') {
      return resolveEnglishExerciseTitle(title, slug);
    }
    return resolveHungarianExerciseTitle(title, slug);
  }

  /**
   * Translates exercise rest/set details (e.g. "3 × 10-12 · 60s rest" <-> "3 × 10-12 · 60 mp pihenő")
   */
  public translateExerciseDetails(details: string): string {
    if (!details) return '';
    if (this.currentLanguage === 'hu') {
      return details
        .replace(/(\d+)\s*s\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*sec\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*sets\b/gi, '$1 sorozat')
        .replace(/(\d+)\s*set\b/gi, '$1 sorozat')
        .replace(/(\d+)\s*reps\b/gi, '$1 ism.')
        .replace(/\brest\b/gi, 'pihenő');
    }
    return details
      .replace(/(\d+)\s*mp\s*pihenő/gi, '$1s rest')
      .replace(/(\d+)\s*mp\b/gi, '$1s rest')
      .replace(/(\d+)\s*sorozat\b/gi, '$1 sets')
      .replace(/(\d+)\s*ism\./gi, '$1 reps')
      .replace(/(\d+)\s*ism\b/gi, '$1 reps')
      .replace(/\bpihenő\b/gi, 'rest');
  }

  /**
   * Translates exercise rest time badge on PlanExerciseCard (e.g. "60s rest" <-> "60 mp pihenő")
   */
  public formatRestBadge(rawPart?: string): string {
    if (!rawPart) return this.currentLanguage === 'hu' ? '60 mp pihenő' : '60s rest';

    // If rawPart contains weights or does not look like a time value, return default
    if (/(kg|lb|ism|rep|sorozat|set)/i.test(rawPart) || !/(\d+)\s*(mp|s|sec|min|perc|rest|pihen)/i.test(rawPart)) {
      return this.currentLanguage === 'hu' ? '60 mp pihenő' : '60s rest';
    }

    if (this.currentLanguage === 'hu') {
      let cleaned = rawPart
        .trim()
        .replace(/(\d+)\s*s\s*rest/gi, '$1 mp pihenő')
        .replace(/(\d+)\s*s\b/gi, '$1 mp')
        .replace(/\brest\b/gi, 'pihenő');
      if (!cleaned.toLowerCase().includes('pihenő')) {
        cleaned = `${cleaned} pihenő`;
      }
      return cleaned;
    }

    let cleaned = rawPart
      .trim()
      .replace(/(\d+)\s*mp\s*pihenő/gi, '$1s rest')
      .replace(/(\d+)\s*mp\b/gi, '$1s rest')
      .replace(/mp pihenő/gi, 's rest')
      .replace(/pihenő/gi, 'rest');
    if (!cleaned.toLowerCase().includes('rest') && !cleaned.toLowerCase().includes('s')) {
      cleaned = `${cleaned} rest`;
    }
    return cleaned;
  }

  /**
   * Translates body part / zone badge text (e.g. "CHEST" -> "MELL", "UPPER LEGS" -> "COMBIZMOK")
   */
  public translateBadgeText(badge?: string | null): string {
    if (!badge) return '';
    const clean = badge.replace(/_/g, ' ').trim();
    if (this.currentLanguage !== 'hu') return clean.toUpperCase();
    const lower = clean.toLowerCase();
    if (ZONE_NAME_HU_MAP[lower]) {
      return ZONE_NAME_HU_MAP[lower].toUpperCase();
    }
    return clean.toUpperCase();
  }

  /**
   * Translates equipment name
   */
  public translateEquipment(name?: string | null): string {
    if (!name) return this.t('filter.equipment.bodyweight');
    const lower = name.replace(/[_-]/g, ' ').trim().toLowerCase();
    const map: Record<string, string> = {
      'none': 'filter.equipment.bodyweight',
      'bodyweight': 'filter.equipment.bodyweight',
      'body weight': 'filter.equipment.bodyweight',
      'dumbbell': 'filter.equipment.dumbbell',
      'dumbbells': 'filter.equipment.dumbbell',
      'barbell': 'filter.equipment.barbell',
      'kettlebell': 'filter.equipment.kettlebell',
      'cable': 'filter.equipment.cable',
      'ez bar': 'filter.equipment.ezBar',
      'ez curl bar': 'filter.equipment.ezBar',
      'smith machine': 'filter.equipment.smithMachine',
      'pull up bar': 'filter.equipment.pullUpBar',
      'pull-up bar': 'filter.equipment.pullUpBar',
      'band': 'filter.equipment.band',
      'resistance band': 'filter.equipment.band',
    };
    if (map[lower]) return this.t(map[lower]);
    if (this.currentLanguage === 'hu' && EQUIPMENT_HU_MAP[lower]) {
      return EQUIPMENT_HU_MAP[lower];
    }
    return name;
  }

  /**
   * Translates difficulty level
   */
  public translateDifficulty(difficulty?: string | null): string {
    if (!difficulty) return this.t('filter.difficulty.intermediate');
    const lower = difficulty.trim().toLowerCase();
    switch (lower) {
      case 'beginner':
      case 'kezdő':
        return this.t('filter.difficulty.beginner');
      case 'intermediate':
      case 'medium':
      case 'középhaladó':
        return this.t('filter.difficulty.intermediate');
      case 'advanced':
      case 'haladó':
        return this.t('filter.difficulty.advanced');
      case 'expert':
      case 'profi':
        return this.t('filter.difficulty.expert');
      default:
        return difficulty;
    }
  }

  /**
   * Translates activity category
   */
  public translateCategory(category?: string | null): string {
    if (!category) return '';
    if (this.currentLanguage !== 'hu') return category.toUpperCase();
    const lower = category.trim().toLowerCase();
    const map: Record<string, string> = {
      'strength': 'ERŐNLÉTI',
      'cardio': 'KARDIÓ',
      'stretching': 'NYÚJTÁS',
      'mobility': 'MOBILITÁS',
      'plyometrics': 'PLIOMETRIA',
      'powerlifting': 'ERŐEMELÉS',
      'strongman': 'STRONGMAN',
      'olympic': 'SÚLYEMELÉS',
      'olympic weightlifting': 'SÚLYEMELÉS',
      'calisthenics': 'SAJÁT TESTSÚLYOS',
    };
    return map[lower] ?? category.toUpperCase();
  }

  /**
   * Translates muscle names
   */
  public translateMuscleName(name: string): string {
    if (!name) return '';
    if (this.currentLanguage !== 'hu') return name;
    const lower = name.trim().toLowerCase();
    return MUSCLE_HU_MAP[lower] ?? name;
  }

  /**
   * Translates fitness goal stored in profile ("Muscle Gain" <-> "Izomépítés")
   */
  public translateFitnessGoal(goal?: string | null): string {
    if (!goal) return this.t('goal.muscleGain');
    const lower = goal.trim().toLowerCase();
    const map: Record<string, string> = {
      'muscle gain': 'goal.muscleGain',
      'izomépítés': 'goal.muscleGain',
      'fat loss': 'goal.fatLoss',
      'zsírégetés': 'goal.fatLoss',
      'strength': 'goal.strength',
      'erőnövelés': 'goal.strength',
      'endurance': 'goal.endurance',
      'állóképesség': 'goal.endurance',
      'general fitness': 'goal.generalFitness',
      'általános fittség': 'goal.generalFitness',
    };
    return map[lower] ? this.t(map[lower]) : goal;
  }

  /**
   * Translates fitness level stored in profile ("Beginner" <-> "Kezdő")
   */
  public translateFitnessLevel(level?: string | null): string {
    if (!level) return this.t('filter.difficulty.intermediate');
    return this.translateDifficulty(level);
  }

  /**
   * Translates gender code stored in profile ("female" | "male" | "other")
   */
  public translateGender(gender?: string | null): string | null {
    if (!gender) return null;
    switch (gender.trim().toLowerCase()) {
      case 'female':
      case 'nő':
        return this.t('onboarding.genderFemale');
      case 'male':
      case 'férfi':
        return this.t('onboarding.genderMale');
      case 'other':
      case 'prefer not to say':
        return this.t('onboarding.genderOther');
      default:
        return gender;
    }
  }

  /**
   * Translates notification timestamp ("Today, 09:00" -> "Ma, 09:00")
   */
  public translateNotificationTimestamp(ts: string): string {
    if (!ts) return this.t('date.today');
    if (this.currentLanguage === 'hu') {
      if (ts.trim().toLowerCase() === 'today') return 'Ma';
      return ts.replace(/^Today,\s*/i, 'Ma, ');
    }
    if (ts.trim().toLowerCase() === 'ma') return 'Today';
    return ts.replace(/^Ma,\s*/i, 'Today, ');
  }
}

export const i18n = LocalizationService.getInstance();

