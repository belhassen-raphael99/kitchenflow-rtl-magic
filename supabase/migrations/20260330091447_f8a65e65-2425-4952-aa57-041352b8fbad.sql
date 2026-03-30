DROP POLICY IF EXISTS "Public can validate demo tokens" ON public.demo_tokens;

CREATE OR REPLACE FUNCTION public.validate_demo_token(p_token text)
RETURNS TABLE(id uuid, email text, used boolean, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dt.id, dt.email, dt.used, dt.expires_at
  FROM public.demo_tokens dt
  WHERE dt.token = p_token
    AND dt.used = false
    AND dt.expires_at > now()
  LIMIT 1;
$$;