-- 044: programs — multi-week plans built from library workouts, so a member always knows
-- what's next. One active program per member; progress = program sessions with a finished log.

alter table public.workouts add column if not exists program_only boolean not null default false;

create table if not exists public.programs (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  title_ar      text,
  summary       text,
  summary_ar    text,
  goal          text not null,          -- strength | home | padel | running | hyrox | busy
  sport         text,                   -- SportId for the icon
  level         text not null default 'medium' check (level in ('easy','medium','hard')),
  weeks         int not null check (weeks between 1 and 26),
  days_per_week int not null check (days_per_week between 1 and 7),
  minutes       int,                    -- typical session length
  equipment     text[] not null default '{}',
  principles    jsonb not null default '[]'::jsonb,  -- [{ en, ar }] how the plan works
  status        text not null default 'published' check (status in ('draft','published','archived')),
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.program_sessions (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.programs(id) on delete cascade,
  week        int not null,
  day         int not null,
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  focus       text,
  focus_ar    text,
  unique (program_id, week, day)
);
create index if not exists program_sessions_program_idx on public.program_sessions (program_id, week, day);

create table if not exists public.program_enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  program_id  uuid not null references public.programs(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','done','left')),
  train_days  int[] not null default '{}',   -- 0=Sun..6=Sat, for reminders
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create unique index if not exists program_enrollments_one_active on public.program_enrollments (user_id) where status = 'active';

alter table public.workout_logs add column if not exists program_session_id uuid references public.program_sessions(id) on delete set null;
create index if not exists workout_logs_program_session_idx on public.workout_logs (user_id, program_session_id);

alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;
alter table public.program_enrollments enable row level security;

drop policy if exists programs_read on public.programs;
create policy programs_read on public.programs for select to authenticated using (status = 'published');
drop policy if exists program_sessions_read on public.program_sessions;
create policy program_sessions_read on public.program_sessions for select to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.status = 'published'));
drop policy if exists program_enrollments_own on public.program_enrollments;
create policy program_enrollments_own on public.program_enrollments for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
