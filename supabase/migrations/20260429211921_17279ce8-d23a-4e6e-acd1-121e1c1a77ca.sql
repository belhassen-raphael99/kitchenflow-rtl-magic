-- Replace overly broad RESTRICTIVE policy that also blocked SELECT on user_roles,
-- causing demo/employee users to be unable to read their own role and triggering
-- a fail-closed sign-out loop. Restrict only writes (INSERT/UPDATE/DELETE) to admins.
DROP POLICY IF EXISTS "Restrict role writes to admins only" ON public.user_roles;

CREATE POLICY "Restrict role inserts to admins only"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Restrict role updates to admins only"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Restrict role deletes to admins only"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::public.app_role));