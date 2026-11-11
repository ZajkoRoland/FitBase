export type MessageSender = 'coach' | 'user';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
}

export interface CoachChatRequest {
  message: string;
  language?: 'hu' | 'en' | null;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface PlanModification {
  action:
    | 'swap_days'
    | 'update_workout'
    | 'set_rest_day'
    | 'generate_full_plan'
    | 'replace_exercise'
    | 'add_exercise'
    | 'remove_exercise'
    | 'update_exercise_parameters';
  source_day?: number | null;
  target_day?: number | null;
  day_of_week?: number | null;
  workout_title?: string | null;
  workout_meta?: string | null;
  exercises?: any[] | null;
  full_plan?: any[] | null;
  target_slug?: string | null;
  target_exercise_id?: string | null;
  new_exercise?: any | null;
  exercise?: any | null;
  sets?: number | null;
  reps?: string | number | null;
  rest_seconds?: number | null;
  weight_kg?: number | null;
}

export interface CoachChatResponse {
  reply_text: string;
  quick_replies: string[];
  plan_modification?: PlanModification | null;
}
