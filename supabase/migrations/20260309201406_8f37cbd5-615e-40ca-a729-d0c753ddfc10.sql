
-- Add a reusable invite_token to group_organizers (one per group)
ALTER TABLE public.group_organizers
  ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid();

-- Clean up phantom collaborator rows (no email, no user_id = link placeholders)
DELETE FROM public.trip_collaborators
  WHERE email IS NULL AND user_id IS NULL;
