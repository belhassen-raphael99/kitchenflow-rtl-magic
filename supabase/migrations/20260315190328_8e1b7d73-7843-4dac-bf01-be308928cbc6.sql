-- Add login_methods jsonb to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS login_methods jsonb DEFAULT '{"password": true, "magic_link": false, "otp": false, "google": false}'::jsonb;

-- Create security_questions table
CREATE TABLE IF NOT EXISTS public.security_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  question text NOT NULL,
  answer_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security question" ON public.security_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security question" ON public.security_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security question" ON public.security_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security questions" ON public.security_questions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));