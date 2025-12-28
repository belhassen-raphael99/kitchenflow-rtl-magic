-- Fix RLS policies: Restrict to authenticated users only

-- 1. Drop existing public policies on warehouse_items
DROP POLICY IF EXISTS "Anyone can view warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Anyone can insert warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Anyone can update warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Anyone can delete warehouse items" ON public.warehouse_items;

-- Create authenticated-only policies for warehouse_items
CREATE POLICY "Authenticated users can view warehouse items"
ON public.warehouse_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert warehouse items"
ON public.warehouse_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update warehouse items"
ON public.warehouse_items FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete warehouse items"
ON public.warehouse_items FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 2. Drop existing public policies on suppliers
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can update suppliers" ON public.suppliers;

-- Create authenticated-only policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- 3. Drop existing public policies on categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;

-- Create authenticated-only policies for categories
CREATE POLICY "Authenticated users can view categories"
ON public.categories FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert categories"
ON public.categories FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
ON public.categories FOR UPDATE
USING (auth.uid() IS NOT NULL);