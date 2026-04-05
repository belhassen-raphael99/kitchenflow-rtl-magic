
-- Explicitly deny UPDATE on production_logs
CREATE POLICY "No updates on production_logs"
ON public.production_logs
FOR UPDATE
USING (false);

-- Explicitly deny DELETE on production_logs
CREATE POLICY "No deletes on production_logs"
ON public.production_logs
FOR DELETE
USING (false);
