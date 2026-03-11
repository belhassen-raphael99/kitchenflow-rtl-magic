
-- STEP 1: Convert ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- Drop and recreate every policy with default PERMISSIVE modifier

-- ============ warehouse_items ============
DROP POLICY IF EXISTS "Authenticated users can view warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Admins can insert warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Admins can update warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Admins can delete warehouse items" ON public.warehouse_items;

CREATE POLICY "Authenticated users can view warehouse items" ON public.warehouse_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert warehouse items" ON public.warehouse_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update warehouse items" ON public.warehouse_items FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete warehouse items" ON public.warehouse_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ rate_limits ============
DROP POLICY IF EXISTS "No public access to rate limits" ON public.rate_limits;
CREATE POLICY "No public access to rate limits" ON public.rate_limits FOR ALL USING (false);

-- ============ suppliers ============
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ categories ============
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ recipe_ingredients ============
DROP POLICY IF EXISTS "Authenticated users can view recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Admins can insert recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Admins can update recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Admins can delete recipe_ingredients" ON public.recipe_ingredients;

CREATE POLICY "Authenticated users can view recipe_ingredients" ON public.recipe_ingredients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert recipe_ingredients" ON public.recipe_ingredients FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update recipe_ingredients" ON public.recipe_ingredients FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete recipe_ingredients" ON public.recipe_ingredients FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ audit_logs ============
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
-- STEP 3 FIX: Change INSERT from WITH CHECK (true) to WITH CHECK (false) - triggers use SECURITY DEFINER
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (false);

-- ============ user_roles ============
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ production_logs ============
DROP POLICY IF EXISTS "Authenticated users can view production_logs" ON public.production_logs;
DROP POLICY IF EXISTS "Admins can insert production_logs" ON public.production_logs;

CREATE POLICY "Authenticated users can view production_logs" ON public.production_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert production_logs" ON public.production_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ clients ============
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- STEP 3 FIX: Restrict SELECT to admin only (client PII protection)
CREATE POLICY "Admins can view clients" ON public.clients FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ events ============
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Authenticated users can view events" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ notifications ============
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
-- STEP 3 FIX: Restrict INSERT to admin only
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((user_id = auth.uid()) OR (user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ event_items ============
DROP POLICY IF EXISTS "Authenticated users can view event_items" ON public.event_items;
DROP POLICY IF EXISTS "Admins can insert event_items" ON public.event_items;
DROP POLICY IF EXISTS "Admins can update event_items" ON public.event_items;
DROP POLICY IF EXISTS "Admins can delete event_items" ON public.event_items;

CREATE POLICY "Authenticated users can view event_items" ON public.event_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert event_items" ON public.event_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update event_items" ON public.event_items FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete event_items" ON public.event_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ reserve_items ============
DROP POLICY IF EXISTS "Authenticated users can view reserve_items" ON public.reserve_items;
DROP POLICY IF EXISTS "Admins can insert reserve_items" ON public.reserve_items;
DROP POLICY IF EXISTS "Admins can update reserve_items" ON public.reserve_items;
DROP POLICY IF EXISTS "Admins can delete reserve_items" ON public.reserve_items;

CREATE POLICY "Authenticated users can view reserve_items" ON public.reserve_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert reserve_items" ON public.reserve_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update reserve_items" ON public.reserve_items FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reserve_items" ON public.reserve_items FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ production_tasks ============
DROP POLICY IF EXISTS "Authenticated users can view production_tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "Admins can insert production_tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "Admins can update production_tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "Admins can delete production_tasks" ON public.production_tasks;

CREATE POLICY "Authenticated users can view production_tasks" ON public.production_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert production_tasks" ON public.production_tasks FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update production_tasks" ON public.production_tasks FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete production_tasks" ON public.production_tasks FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ profiles ============
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are created via trigger only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profiles are created via trigger only" ON public.profiles FOR INSERT WITH CHECK (false);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ recipes ============
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Admins can insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Admins can update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Admins can delete recipes" ON public.recipes;

CREATE POLICY "Authenticated users can view recipes" ON public.recipes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert recipes" ON public.recipes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update recipes" ON public.recipes FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete recipes" ON public.recipes FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ STEP 4: Add missing audit triggers ============
CREATE TRIGGER audit_trigger_recipes
  AFTER INSERT OR UPDATE OR DELETE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_events
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_reserve_items
  AFTER INSERT OR UPDATE OR DELETE ON public.reserve_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_production_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
