-- Add missing columns to production_schedule
ALTER TABLE public.production_schedule 
ADD COLUMN IF NOT EXISTS production_day_label text,
ADD COLUMN IF NOT EXISTS shelf_life_label text,
ADD COLUMN IF NOT EXISTS shelf_life_days integer;

-- Make day_of_week nullable for multi-day or unscheduled items
ALTER TABLE public.production_schedule ALTER COLUMN day_of_week DROP NOT NULL;

-- Add total_weight columns to recipes
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS total_weight_x1 numeric,
ADD COLUMN IF NOT EXISTS total_weight_x2 numeric,
ADD COLUMN IF NOT EXISTS total_weight_x3 numeric;

-- Add is_external to catalog_items
ALTER TABLE public.catalog_items 
ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false;