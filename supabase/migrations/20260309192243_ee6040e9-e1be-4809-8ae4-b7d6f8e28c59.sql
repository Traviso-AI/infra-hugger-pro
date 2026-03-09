-- Drop the restrictive ALL policy that blocks non-owner inserts
DROP POLICY "Trip owners can manage collaborators" ON public.trip_collaborators;

-- Drop the previous attempt
DROP POLICY IF EXISTS "Authenticated users can invite collaborators" ON public.trip_collaborators;

-- Replace with separate policies for each operation
-- Owners can SELECT all collaborators for their trips
CREATE POLICY "Trip owners can view collaborators"
ON public.trip_collaborators
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()
));

-- Owners can UPDATE collaborators on their trips
CREATE POLICY "Trip owners can update collaborators"
ON public.trip_collaborators
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()
));

-- Owners can DELETE collaborators on their trips
CREATE POLICY "Trip owners can delete collaborators"
ON public.trip_collaborators
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()
));

-- Any authenticated user can invite (insert) collaborators
CREATE POLICY "Authenticated users can invite collaborators"
ON public.trip_collaborators
FOR INSERT
TO authenticated
WITH CHECK (invited_by = auth.uid());