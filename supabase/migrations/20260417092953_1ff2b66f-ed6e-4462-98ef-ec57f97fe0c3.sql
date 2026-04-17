-- Add a RESTRICTIVE policy that blocks all writes to user_roles
-- unless the caller is already an admin. RESTRICTIVE policies are AND'd
-- with PERMISSIVE policies, so this acts as a hard gate.
-- The handle_new_user trigger is SECURITY DEFINER and bypasses RLS,
-- so default 'employee' role assignment on signup continues to work.

CREATE POLICY "Restrict role writes to admins only"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));