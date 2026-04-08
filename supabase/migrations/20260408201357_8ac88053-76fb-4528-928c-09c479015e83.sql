-- Fix notifications policy for employees to see system alerts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    (user_id IS NULL AND auth.uid() IS NOT NULL)
  );

-- Add FK on stock_movements.created_by
ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;