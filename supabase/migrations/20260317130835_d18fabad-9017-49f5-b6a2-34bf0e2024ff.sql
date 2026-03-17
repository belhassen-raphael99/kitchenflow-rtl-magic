
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS client_name text,
ADD COLUMN IF NOT EXISTS client_phone text,
ADD COLUMN IF NOT EXISTS client_email text,
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_time time,
ADD COLUMN IF NOT EXISTS invoice_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'אירוע פרטי';

ALTER TABLE public.event_items
ADD COLUMN IF NOT EXISTS servings integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS department text;

-- Add validation trigger for invoice_status
CREATE OR REPLACE FUNCTION public.validate_event_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_status IS NOT NULL AND NEW.invoice_status NOT IN ('sent', 'paid', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid invoice_status: %', NEW.invoice_status;
  END IF;
  IF NEW.event_type IS NOT NULL AND NEW.event_type NOT IN ('חתונה', 'בר/בת מצווה', 'אירוע חברה', 'ברית', 'יום הולדת', 'אירוע פרטי', 'אחר') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_fields_trigger
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_fields();

-- Add validation trigger for event_items department
CREATE OR REPLACE FUNCTION public.validate_event_item_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.department IS NOT NULL AND NEW.department NOT IN ('מטבח', 'מאפייה', 'קונדיטוריה') THEN
    RAISE EXCEPTION 'Invalid department: %', NEW.department;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_event_item_fields_trigger
BEFORE INSERT OR UPDATE ON public.event_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_item_fields();
