
-- 1. Drop ALL existing policies on trip_collaborators (they're all RESTRICTIVE which blocks everything)
DROP POLICY IF EXISTS "Authenticated users can invite collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Inviters can view their invites" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can delete collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can update collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners can view collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can accept invites" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can view their collaborations" ON public.trip_collaborators;

-- 2. Recreate as PERMISSIVE policies
CREATE POLICY "insert_collaborators" ON public.trip_collaborators
  FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "select_own_invites" ON public.trip_collaborators
  FOR SELECT TO authenticated
  USING (invited_by = auth.uid());

CREATE POLICY "select_trip_owner" ON public.trip_collaborators
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));

CREATE POLICY "select_own_collaborations" ON public.trip_collaborators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "update_accept_invite" ON public.trip_collaborators
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_trip_owner" ON public.trip_collaborators
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));

CREATE POLICY "delete_trip_owner" ON public.trip_collaborators
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_collaborators.trip_id AND trips.creator_id = auth.uid()));

-- 3. Remove duplicate email invites (keep oldest)
DELETE FROM public.trip_collaborators a
USING public.trip_collaborators b
WHERE a.id > b.id
  AND a.trip_id = b.trip_id
  AND a.email IS NOT NULL
  AND a.email = b.email;

-- 4. Add unique constraint to prevent future email duplicates per trip
CREATE UNIQUE INDEX IF NOT EXISTS uq_trip_collaborators_trip_email
  ON public.trip_collaborators (trip_id, email)
  WHERE email IS NOT NULL;
