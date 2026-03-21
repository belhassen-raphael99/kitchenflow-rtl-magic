-- Production schedule table for weekly plan
CREATE TABLE public.production_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL,
  department text NOT NULL,
  product_name text NOT NULL,
  min_quantity numeric DEFAULT 0,
  unit text DEFAULT 'יחידה',
  notes text,
  storage_type text DEFAULT 'מלאי',
  created_at timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_production_schedule()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.day_of_week < 0 OR NEW.day_of_week > 6 THEN
    RAISE EXCEPTION 'day_of_week must be between 0 and 6';
  END IF;
  IF NEW.storage_type NOT IN ('מלאי', 'הרכבה') THEN
    RAISE EXCEPTION 'storage_type must be מלאי or הרכבה';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_production_schedule_trigger
  BEFORE INSERT OR UPDATE ON public.production_schedule
  FOR EACH ROW EXECUTE FUNCTION public.validate_production_schedule();

ALTER TABLE public.production_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view production_schedule"
  ON public.production_schedule FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee') OR has_role(auth.uid(), 'demo'));

CREATE POLICY "Admins can manage production_schedule"
  ON public.production_schedule FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add delivery proof column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS delivery_proof_url text;

-- Create delivery-proofs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for delivery-proofs
CREATE POLICY "Authenticated users can upload delivery proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'delivery-proofs');

CREATE POLICY "Anyone can view delivery proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'delivery-proofs');
