-- End dates are inclusive and evaluated in the assigned store's timezone.
ALTER TABLE public.user_roles ADD COLUMN access_ends_on date;

-- Keep every role-based permission check consistent, including existing JWT sessions.
-- Most roles have no end date; that path needs no store lookup.
CREATE FUNCTION public.role_access_active(p_active boolean, p_ends_on date, p_store varchar)
RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT CASE
   WHEN NOT p_active THEN false
   WHEN p_ends_on IS NULL THEN true
   ELSE p_ends_on >= (CURRENT_TIMESTAMP AT TIME ZONE
     (SELECT timezone FROM public.stores WHERE dgt_id=p_store))::date
 END
$$;
