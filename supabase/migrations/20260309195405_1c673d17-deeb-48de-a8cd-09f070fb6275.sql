
-- Allow inviters to also delete the collaborators they invited
DROP POLICY IF EXISTS "delete_trip_owner" ON public.trip_collaborators;
CREATE POLICY "delete_owner_or_inviter" ON public.trip_collaborators
  FOR DELETE TO authenticated
  USING (
    invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid())
  );
