-- Lock down SECURITY DEFINER functions from anon/public
-- 
-- Function access matrix (intentional):
--   public.handle_new_user()    -> postgres, service_role only (auth trigger)
--   public.touch_updated_at()   -> postgres, service_role only (table trigger)
--   public.has_role(uuid,role)  -> authenticated (INTENTIONAL: used in RLS
--                                  policies across many tables; callers must
--                                  be able to invoke it. Safe because it only
--                                  reads user_roles for the supplied user_id.)
--   public.user_journey_day(uuid) -> authenticated only (used in storage RLS
--                                    policy "Authenticated read unlocked guide
--                                    files"; policy expressions require
--                                    EXECUTE on the calling role. Anonymous
--                                    callers have no business querying this.)

REVOKE EXECUTE ON FUNCTION public.user_journey_day(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.user_journey_day(uuid) TO authenticated;

-- has_role is also SECURITY DEFINER; ensure anon cannot call it directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
