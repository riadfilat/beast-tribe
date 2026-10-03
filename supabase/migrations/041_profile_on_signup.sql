-- 041: every new account gets a profile row, created by the database at sign-up.
-- Before this, the app inserted the profile itself, and only when sign-up returned a
-- session. Any other path (email confirmation on, an app crash mid sign-up) left an
-- account without a profile, and later onboarding steps had nothing to update.

create or replace function public.bt_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
begin
  if v_name is null then
    v_name := split_part(coalesce(new.email, 'Beast'), '@', 1);
  end if;
  insert into public.profiles (id, full_name, display_name)
  values (new.id, v_name, split_part(v_name, ' ', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists bt_on_auth_user_created on auth.users;
create trigger bt_on_auth_user_created
  after insert on auth.users
  for each row execute function public.bt_handle_new_user();

-- Backfill: any existing account without a profile gets one.
insert into public.profiles (id, full_name, display_name)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(u.email, 'Beast'), '@', 1)),
       split_part(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(u.email, 'Beast'), '@', 1)), ' ', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
