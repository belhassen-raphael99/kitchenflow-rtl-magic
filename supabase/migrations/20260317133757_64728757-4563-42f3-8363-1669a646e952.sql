-- Allow demo users to update production_tasks (status changes)
CREATE POLICY "Demo users can update production_tasks"
ON public.production_tasks
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'demo'::app_role))
WITH CHECK (has_role(auth.uid(), 'demo'::app_role));

-- Allow demo users to update reserve_items (for stock deduction)
CREATE POLICY "Demo users can update reserve_items"
ON public.reserve_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'demo'::app_role))
WITH CHECK (has_role(auth.uid(), 'demo'::app_role));

-- Allow demo users to insert production_logs
CREATE POLICY "Demo users can insert production_logs"
ON public.production_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'demo'::app_role));

-- Allow demo users to update warehouse_items (for ingredient deduction)
CREATE POLICY "Demo users can update warehouse_items"
ON public.warehouse_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'demo'::app_role))
WITH CHECK (has_role(auth.uid(), 'demo'::app_role));

-- Allow demo users to insert notifications
CREATE POLICY "Demo users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'demo'::app_role));

-- Allow demo users to view notifications
CREATE POLICY "Demo users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'demo'::app_role));