-- 1. Owner check independent of the mutable profiles.email
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND lower(u.email) IN ('jayakrushna1622@gmail.com', 'hemanthleads@gmail.com')
  );
$$;

-- 2. Prevent anyone (including admins) from rewriting a profile's login email
CREATE OR REPLACE FUNCTION public.lock_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_lock_email ON public.profiles;
CREATE TRIGGER profiles_lock_email BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.lock_profile_email();

-- 3. app_settings readable only by admins
DROP POLICY IF EXISTS app_settings_read_all ON public.app_settings;
CREATE POLICY app_settings_admin_read ON public.app_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. hackathon_results scoped to owner or admin (leaderboard uses the definer function)
DROP POLICY IF EXISTS hr_read ON public.hackathon_results;
CREATE POLICY hr_read_own_or_admin ON public.hackathon_results
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 5. Squads / squad members visible only to active members with completed profiles
CREATE OR REPLACE FUNCTION public.is_active_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.is_active AND p.profile_completed
  );
$$;

DROP POLICY IF EXISTS squads_read ON public.squads;
CREATE POLICY squads_read ON public.squads
FOR SELECT TO authenticated
USING (public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS sm_read ON public.squad_members;
CREATE POLICY sm_read ON public.squad_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_active_member(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- 6. Lock down EXECUTE on SECURITY DEFINER routines
REVOKE ALL ON FUNCTION public.audit_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lock_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.write_audit(text, text, text, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_leaderboard(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_names() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_member_names() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.write_audit(text, text, text, text, jsonb, uuid) TO service_role;