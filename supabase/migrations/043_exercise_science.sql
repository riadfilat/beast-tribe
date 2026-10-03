-- 043: the exercise library becomes a training reference: muscles split into primary/secondary,
-- movement pattern and mechanic, how it's tracked, setup / execution / breathing / tempo,
-- common mistakes and safety notes (all bilingual jsonb arrays of { en, ar }).

alter table public.exercises
  add column if not exists primary_muscles   text[] not null default '{}',
  add column if not exists secondary_muscles text[] not null default '{}',
  add column if not exists pattern   text,      -- squat | hinge | lunge | push_h | push_v | pull_h | pull_v | carry | rotation | anti_rotation | core_flexion | locomotion | plyometric | mobility | stretch | isolation
  add column if not exists mechanic  text check (mechanic in ('compound','isolation')),
  add column if not exists unilateral boolean not null default false,
  add column if not exists tracking  text not null default 'reps' check (tracking in ('reps','reps_weight','time','distance','distance_time')),
  add column if not exists setup     jsonb not null default '[]'::jsonb,
  add column if not exists mistakes  jsonb not null default '[]'::jsonb,
  add column if not exists safety    jsonb not null default '[]'::jsonb,
  add column if not exists breathing jsonb,      -- { en, ar }
  add column if not exists tempo     text,       -- e.g. "3-1-1-0" (down, pause, up, pause)
  add column if not exists rest_seconds int,     -- typical rest between sets
  add column if not exists sports    text[] not null default '{}'; -- sports it transfers to

-- Members log every set; one row per set, tied to the workout log.
create table if not exists public.workout_sets (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references public.workout_logs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise    text not null references public.exercises(slug) on update cascade,
  set_no      int not null check (set_no between 1 and 50),
  reps        int check (reps between 0 and 1000),
  weight_kg   numeric(6,2) check (weight_kg between 0 and 1000),
  seconds     int check (seconds between 0 and 86400),
  meters      int check (meters between 0 and 200000),
  rpe         numeric(3,1) check (rpe between 1 and 10),
  created_at  timestamptz not null default now()
);
create index if not exists workout_sets_user_ex_idx on public.workout_sets (user_id, exercise, created_at desc);
create index if not exists workout_sets_log_idx on public.workout_sets (log_id);

alter table public.workout_sets enable row level security;
drop policy if exists workout_sets_own on public.workout_sets;
create policy workout_sets_own on public.workout_sets for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.workout_logs l where l.id = log_id and l.user_id = auth.uid()));
