ALTER TABLE public.beta_whitelist ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.beta_whitelist ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin';

-- Add unique constraint on email for upsert support
ALTER TABLE public.beta_whitelist DROP CONSTRAINT IF EXISTS beta_whitelist_email_key;
ALTER TABLE public.beta_whitelist ADD CONSTRAINT beta_whitelist_email_key UNIQUE (email);