
-- Add beta columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Create beta_whitelist table
CREATE TABLE public.beta_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  has_signed_up boolean NOT NULL DEFAULT false,
  invited_by text
);

ALTER TABLE public.beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Only admins can manage whitelist
CREATE POLICY "Admins can manage whitelist" ON public.beta_whitelist
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Anyone can check if their email is whitelisted (for signup check)
CREATE POLICY "Anyone can check whitelist by email" ON public.beta_whitelist
  FOR SELECT TO anon, authenticated
  USING (true);

-- Create app_settings table
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read app_settings
CREATE POLICY "Anyone can read app_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can update app_settings
CREATE POLICY "Admins can update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Seed beta_mode
INSERT INTO public.app_settings (key, value) VALUES ('beta_mode', 'true');

-- Admin RLS policy for profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- Admins can update any profile (for toggling is_beta)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- Admin policy for bookings: admins can view all
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Admin policy for trips: admins can manage all
CREATE POLICY "Admins can update all trips" ON public.trips
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete all trips" ON public.trips
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can view all trips" ON public.trips
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));
