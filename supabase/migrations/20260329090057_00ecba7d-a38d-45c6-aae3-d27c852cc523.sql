
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_website text NOT NULL,
  name_internal text NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  department text,
  unit_type text DEFAULT 'יחידות',
  quantity_per_serving numeric,
  size_option text,
  notes text,
  price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read catalog" ON public.catalog_items
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR 
    has_role(auth.uid(), 'demo'::app_role)
  );

CREATE POLICY "Admins can manage catalog" ON public.catalog_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
