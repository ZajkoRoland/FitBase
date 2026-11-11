export type Category = 'strength' | 'stretching' | 'cardio' | 'plyometrics' | 'olympic';
export type ForceType = 'push' | 'pull' | 'static' | 'dynamic';
export type Mechanic = 'compound' | 'isolation';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type BodyPart =
  | 'upper_legs'
  | 'lower_legs'
  | 'core'
  | 'full_body'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'upper_arms'
  | 'lower_arms';

export type Goal =
  | 'hypertrophy'
  | 'strength'
  | 'endurance'
  | 'power'
  | 'mobility'
  | 'rehabilitation'
  | 'core';

export type ImageKind = 'start' | 'peak' | 'main';

export interface Muscle {
  slug: string;
  name: string;
  image_url: string | null;
}

export interface Equipment {
  slug: string;
  name: string;
  image_url: string | null;
}

/** Card representation in the 2-column exercise grid */
export interface ExerciseSummary {
  slug: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  body_part: BodyPart;
  equipment: Equipment | null;
  met: number;
  primary_muscles: Muscle[];
  image_url: string | null;
}

/** Full exercise specification for the detail sheet */
export interface ExerciseDetail extends ExerciseSummary {
  language: string;
  description: string | null;
  instructions: string[];
  tips: string[];
  secondary_muscles: Muscle[];
  images: Record<ImageKind, string>;
  goals: Goal[];
  tags: string[];
  is_unilateral: boolean;
  is_bodyweight: boolean;
  variation_group: string | null;
}

export interface ExercisePage {
  items: ExerciseSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExerciseFilterOptions {
  body_parts: BodyPart[];
  difficulties: Difficulty[];
  categories: Category[];
  equipment: Equipment[];
  muscles: Muscle[];
}

export interface ExerciseQueryParams {
  q?: string;
  body_part?: BodyPart | string;
  difficulty?: Difficulty | string;
  category?: Category;
  equipment?: string;
  muscle?: string;
  goal?: Goal;
  lang?: string;
  limit?: number;
  offset?: number;
}
