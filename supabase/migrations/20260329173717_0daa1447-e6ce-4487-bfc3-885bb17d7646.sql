
-- Add missing columns to reserve_items
ALTER TABLE reserve_items
ADD COLUMN IF NOT EXISTS production_date date,
ADD COLUMN IF NOT EXISTS shelf_life_days integer,
ADD COLUMN IF NOT EXISTS production_day_label text;

-- Add missing columns to warehouse_items
ALTER TABLE warehouse_items
ADD COLUMN IF NOT EXISTS last_restocked_at timestamptz,
ADD COLUMN IF NOT EXISTS item_notes text;

-- Add missing columns to recipes
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS max_capacity_grams numeric,
ADD COLUMN IF NOT EXISTS assembly_type text DEFAULT 'מלאי',
ADD COLUMN IF NOT EXISTS qty_x2 jsonb,
ADD COLUMN IF NOT EXISTS qty_x3 jsonb;

-- Add missing columns to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS delivery_slip_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_slip_url text;

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('warehouse','reserve')),
  item_id uuid NOT NULL,
  item_name text,
  movement_type text NOT NULL CHECK (movement_type IN (
    'production','order_fulfillment','manual_add','manual_subtract','expiry_loss','purchase_reception'
  )),
  quantity_before numeric DEFAULT 0,
  quantity_change numeric DEFAULT 0,
  quantity_after numeric DEFAULT 0,
  reason text,
  event_id uuid REFERENCES events(id),
  task_id uuid REFERENCES production_tasks(id),
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_movements" ON stock_movements FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'demo'::app_role));

CREATE POLICY "insert_movements" ON stock_movements FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'demo'::app_role));

-- Create purchase_lists table
CREATE TABLE IF NOT EXISTS purchase_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at timestamptz DEFAULT now(),
  generated_by uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','ordered','received')),
  notes text
);

ALTER TABLE purchase_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_purchases" ON purchase_lists FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role) OR has_role(auth.uid(), 'demo'::app_role));

CREATE POLICY "admin_purchases" ON purchase_lists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add assembly_type validation trigger
CREATE OR REPLACE FUNCTION public.validate_recipe_assembly_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.assembly_type IS NOT NULL AND NEW.assembly_type NOT IN ('מלאי', 'הרכבה', 'שניהם') THEN
    RAISE EXCEPTION 'Invalid assembly_type: %', NEW.assembly_type;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_recipe_assembly ON recipes;
CREATE TRIGGER validate_recipe_assembly BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION validate_recipe_assembly_type();
