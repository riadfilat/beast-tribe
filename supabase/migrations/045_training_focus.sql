-- 045: what a member is training for, so Train can recommend a plan and the week's sessions.
alter table public.profiles
  add column if not exists train_goal  text check (train_goal in ('strength','calisthenics','home','running','padel','hyrox','busy')),
  add column if not exists train_level text check (train_level in ('beginner','intermediate','advanced')),
  add column if not exists train_days  int check (train_days between 1 and 7),
  add column if not exists week_focus  text check (week_focus in ('strength','calisthenics','home','running','padel','hyrox','busy')),
  add column if not exists week_focus_until date;
