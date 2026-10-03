-- 042: the exercise library. Every move in a workout can point at an exercise (blocks[].items[].ex)
-- with bilingual coaching cues, muscles, equipment, easier/harder versions and a media slot
-- (video_url + poster_url) that the admin can fill later without an app update.
-- Rows are loaded by scripts/exercises/load.js from scripts/exercises/exercises.json.

create table if not exists public.exercises (
  slug        text primary key check (slug ~ '^[a-z0-9_]+$'),
  name        text not null,
  name_ar     text,
  category    text not null check (category in ('warmup','mobility','stretch','strength','core','conditioning','cardio')),
  muscles     text[] not null default '{}',
  equipment   text[] not null default '{}',
  level       text not null default 'medium' check (level in ('easy','medium','hard')),
  cues        jsonb not null default '[]'::jsonb,   -- [{ "en": "...", "ar": "..." }]
  easier      text references public.exercises(slug) on delete set null deferrable initially deferred,
  harder      text references public.exercises(slug) on delete set null deferrable initially deferred,
  aliases     text[] not null default '{}',         -- names coaches write in workouts
  video_url   text,
  poster_url  text,
  media_credit text,
  sort        int not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.exercises enable row level security;

drop policy if exists exercises_read on public.exercises;
create policy exercises_read on public.exercises for select to authenticated using (true);
-- Writes: service role (admin dashboard, loader script) only.

create index if not exists exercises_aliases_idx on public.exercises using gin (aliases);
