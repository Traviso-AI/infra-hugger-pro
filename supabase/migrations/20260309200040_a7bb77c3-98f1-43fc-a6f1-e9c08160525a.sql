
-- Add a dedicated table to track who is the group organizer for each trip
-- This is separate from trip creator — any user can organize group planning
CREATE TABLE IF NOT EXISTS public.group_organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

ALTER TABLE public.group_organizers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see who organized a group
CREATE POLICY "select_group_organizers" ON public.group_organizers
  FOR SELECT TO authenticated USING (true);

-- Any authenticated user can start organizing a group
CREATE POLICY "insert_group_organizer" ON public.group_organizers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Only the organizer can remove themselves
CREATE POLICY "delete_own_organizer" ON public.group_organizers
  FOR DELETE TO authenticated USING (user_id = auth.uid());
