CREATE OR REPLACE FUNCTION public.check_beta_whitelist_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only grant beta access if admin-invited (source = 'admin'), NOT self-signups
  IF EXISTS (SELECT 1 FROM public.beta_whitelist WHERE email = NEW.email AND source = 'admin') THEN
    NEW.is_beta := true;
  END IF;
  -- Mark as signed up regardless of source
  UPDATE public.beta_whitelist SET has_signed_up = true WHERE email = NEW.email;
  RETURN NEW;
END;
$function$;