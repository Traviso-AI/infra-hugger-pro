
-- Add policy so inviters can see the invites they created
CREATE POLICY "Inviters can view their invites"
ON public.trip_collaborators FOR SELECT TO authenticated
USING (invited_by = auth.uid());
