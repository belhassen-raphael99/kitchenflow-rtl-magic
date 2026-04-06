
CREATE TABLE public.user_totp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret_encrypted text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  backup_codes jsonb DEFAULT '[]'::jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_totp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own totp" ON public.user_totp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own totp" ON public.user_totp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own totp" ON public.user_totp
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all totp" ON public.user_totp
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_totp_updated_at
  BEFORE UPDATE ON public.user_totp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
