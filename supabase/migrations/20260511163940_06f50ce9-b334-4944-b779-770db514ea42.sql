
-- touch_updated_at: set search_path
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke execute on trigger-only functions from public/authenticated
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- has_role is used by RLS policies; revoke from anon, keep authenticated
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
