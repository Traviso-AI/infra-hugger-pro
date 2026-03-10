
-- Trigger: when a new profile is created, check beta_whitelist and set is_beta + update has_signed_up
CREATE OR REPLACE FUNCTION public.check_beta_whitelist_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If this user's email is in the whitelist, grant beta access
  IF EXISTS (SELECT 1 FROM public.beta_whitelist WHERE email = NEW.email) THEN
    NEW.is_beta := true;
    UPDATE public.beta_whitelist SET has_signed_up = true WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_beta_whitelist
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_beta_whitelist_on_signup();
