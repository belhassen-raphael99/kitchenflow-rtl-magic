-- Add missing DELETE policies and fix RLS gaps

-- 1. Add DELETE policy for categories (admin only)
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. Add DELETE policy for suppliers (admin only)
CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. Add INSERT policy for profiles (only via trigger, deny direct inserts)
CREATE POLICY "Profiles are created via trigger only"
ON public.profiles FOR INSERT
WITH CHECK (false);

-- 4. Add DELETE policy for profiles (admin only)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'));