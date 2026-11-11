-- FitBase schema for a standalone Postgres (multi-tenant account isolation).
-- Executed automatically by the postgres image on first start (empty volume).

create extension if not exists pgcrypto; -- gen_random_uuid() on older servers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users ----------------------------------------------------------------------
create table public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  password_hash  text,
  auth_provider  text not null default 'local',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index users_email_unique_idx on public.users (lower(email));

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Refresh tokens (only SHA-256 hashes are stored) ------------------------------
create table public.refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  token_hash  varchar(64) not null unique,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index refresh_tokens_user_id_idx on public.refresh_tokens (user_id);

-- Profiles -------------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references public.users (id) on delete cascade,
  username              text,
  display_name          text,
  avatar_url            text,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint profiles_username_check check (
    username is null
    or (char_length(username) between 2 and 30 and username = btrim(username))
  )
);

create unique index profiles_username_unique_idx on public.profiles (lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Stats (Per-account fitness metrics & progression) ---------------------------
create table public.user_stats (
  user_id                    uuid primary key references public.profiles (id) on delete cascade,
  height                     real,
  weight                     real,
  target_weight              real,
  fitness_goal               text,
  fitness_level              text,
  streak                     integer not null default 0,
  best_streak                integer not null default 0,
  sessions_this_week         integer not null default 0,
  total_workouts             integer not null default 0,
  weekly_target              integer not null default 4,
  estimated_calories_today   integer not null default 0,
  total_calories_burned      integer not null default 0,
  total_hours                integer not null default 0,
  total_minutes              integer not null default 0,
  last_workout_date          varchar(16),
  completed_exercises_today  jsonb not null default '{}'::jsonb,
  activity_history           jsonb not null default '[]'::jsonb
);

-- Settings (Per-account notification & app preferences) -----------------------
create table public.user_settings (
  user_id                     uuid primary key references public.users (id) on delete cascade,
  notifications_enabled       boolean not null default true,
  workout_reminder_enabled    boolean not null default true,
  workout_reminder_window     varchar(32) not null default '07:00-10:00',
  rest_day_reminder_enabled   boolean not null default true,
  rest_day_reminder_window    varchar(32) not null default '10:00-11:00',
  streak_reminder_enabled     boolean not null default true,
  streak_reminder_window      varchar(32) not null default '17:00-19:30',
  achievement_alerts_enabled  boolean not null default true,
  sound_enabled               boolean not null default true,
  vibration_enabled           boolean not null default true,
  language                    varchar(16) not null default 'auto',
  units                       varchar(16) not null default 'metric',
  plan_structure              varchar(32) not null default '1_week',
  read_notification_ids       jsonb not null default '[]'::jsonb,
  deleted_notification_ids    jsonb not null default '[]'::jsonb,
  updated_at                  timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Achievements (Per-account badge progression & unlock timestamps) ------------
create table public.user_achievements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  achievement_key  varchar(64) not null,
  title            text not null,
  description      text not null,
  category         varchar(32) not null,
  tier             varchar(32) not null,
  icon             varchar(64) not null,
  current_value    integer not null default 0,
  target_value     integer not null,
  unit             varchar(32) not null,
  is_unlocked      boolean not null default false,
  unlocked_at      timestamptz,
  updated_at       timestamptz not null default now(),
  constraint uq_user_achievement_key unique (user_id, achievement_key)
);

create index ix_user_achievements_user_id on public.user_achievements (user_id);

-- Workout Sessions (Historical workout log per account) -----------------------
create table public.workout_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users (id) on delete cascade,
  session_date         varchar(16) not null,
  day_of_week          integer not null default 0,
  workout_title        text,
  exercises_completed  integer not null default 0,
  duration_minutes     integer not null default 0,
  calories_burned      integer not null default 0,
  exercise_details     jsonb not null default '[]'::jsonb,
  completed_at         timestamptz not null default now()
);

create index ix_workout_sessions_user_date on public.workout_sessions (user_id, session_date);

-- Weekly plan ----------------------------------------------------------------
create table public.user_weekly_plan (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  day_of_week    integer not null check (day_of_week between 0 and 6),
  day_name       text not null,
  type           text not null check (type in ('workout', 'rest')),
  workout_title  text,
  workout_meta   text,
  exercises      jsonb default '[]'::jsonb,
  unique (user_id, day_of_week)
);
