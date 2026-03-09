
-- Drop all existing RESTRICTIVE policies on trip_collaborators
DROP POLICY IF EXISTS "Authenticated users can invite collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can delete collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can update collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can view collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can accept invites" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can view their collaborations" ON public.trip_collaborators;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can invite collaborators"
ON public.trip_collaborators FOR INSERT TO authenticated
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Trip owners can view collaborators"
ON public.trip_collaborators FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));

CREATE POLICY "Users can view their collaborations"
ON public.trip_collaborators FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Trip owners can update collaborators"
ON public.trip_collaborators FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));

CREATE POLICY "Users can accept invites"
ON public.trip_collaborators FOR UPDATE TO authenticated
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trip owners can delete collaborators"
ON public.trip_collaborators FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));
