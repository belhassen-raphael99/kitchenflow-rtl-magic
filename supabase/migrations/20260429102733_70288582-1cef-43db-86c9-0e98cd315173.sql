ALTER TABLE public.production_tasks
  ADD COLUMN IF NOT EXISTS rescheduled_from date,
  ADD COLUMN IF NOT EXISTS original_date date;

CREATE INDEX IF NOT EXISTS idx_production_tasks_date_status
  ON public.production_tasks(date, status);