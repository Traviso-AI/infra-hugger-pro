
-- Add email column to profiles so admin panel can display it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update handle_new_user trigger to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '-')) || '-' || LEFT(NEW.id::text, 4),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
