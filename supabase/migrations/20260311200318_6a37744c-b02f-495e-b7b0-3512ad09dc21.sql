
CREATE TABLE IF NOT EXISTS public.demo_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days',
  used boolean DEFAULT false
);

ALTER TABLE public.demo_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage demo tokens" ON public.demo_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view warehouse items" ON public.warehouse_items;
CREATE POLICY "Authenticated users can view warehouse items" ON public.warehouse_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view recipes" ON public.recipes;
CREATE POLICY "Authenticated users can view recipes" ON public.recipes
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "Authenticated users can view recipe_ingredients" ON public.recipe_ingredients
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view reserve_items" ON public.reserve_items;
CREATE POLICY "Authenticated users can view reserve_items" ON public.reserve_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view production_tasks" ON public.production_tasks;
CREATE POLICY "Authenticated users can view production_tasks" ON public.production_tasks
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view production_logs" ON public.production_logs;
CREATE POLICY "Authenticated users can view production_logs" ON public.production_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) AND 
    (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "Authenticated users can view events" ON public.events
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Authenticated users can view event_items" ON public.event_items;
CREATE POLICY "Authenticated users can view event_items" ON public.event_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'employee'::app_role) OR
    has_role(auth.uid(), 'demo'::app_role)
  );

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
