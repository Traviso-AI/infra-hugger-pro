-- Allow any authenticated user to invite collaborators (they set invited_by to their own id)
CREATE POLICY "Authenticated users can invite collaborators"
ON public.trip_collaborators
FOR INSERT
TO authenticated
WITH CHECK (invited_by = auth.uid());