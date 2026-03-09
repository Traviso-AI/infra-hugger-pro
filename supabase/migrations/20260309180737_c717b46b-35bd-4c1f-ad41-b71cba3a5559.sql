
-- Trip collaborators table
CREATE TABLE public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner can manage collaborators
CREATE POLICY "Trip owners can manage collaborators" ON public.trip_collaborators
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_collaborators.trip_id AND creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_collaborators.trip_id AND creator_id = auth.uid()));

-- Collaborators can view their own invites
CREATE POLICY "Users can view their collaborations" ON public.trip_collaborators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Anyone with invite token can accept (update their user_id)
CREATE POLICY "Users can accept invites" ON public.trip_collaborators
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Activity votes table
CREATE TABLE public.activity_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.trip_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

ALTER TABLE public.activity_votes ENABLE ROW LEVEL SECURITY;

-- Votes visible to trip collaborators and owners
CREATE POLICY "Votes viewable by trip participants" ON public.activity_votes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_activities ta
      JOIN public.trip_days td ON td.id = ta.trip_day_id
      JOIN public.trips t ON t.id = td.trip_id
      LEFT JOIN public.trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = auth.uid()
      WHERE ta.id = activity_votes.activity_id
        AND (t.creator_id = auth.uid() OR tc.user_id IS NOT NULL)
    )
  );

-- Users can vote on activities in trips they participate in
CREATE POLICY "Participants can vote" ON public.activity_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.trip_activities ta
      JOIN public.trip_days td ON td.id = ta.trip_day_id
      JOIN public.trips t ON t.id = td.trip_id
      LEFT JOIN public.trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = auth.uid()
      WHERE ta.id = activity_votes.activity_id
        AND (t.creator_id = auth.uid() OR tc.user_id IS NOT NULL)
    )
  );

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON public.activity_votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete own votes
CREATE POLICY "Users can delete own votes" ON public.activity_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Payment splits table
CREATE TABLE public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Splits viewable by trip participants
CREATE POLICY "Splits viewable by participants" ON public.payment_splits
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.trips WHERE id = payment_splits.trip_id AND creator_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.trip_collaborators WHERE trip_id = payment_splits.trip_id AND user_id = auth.uid())
  );

-- Trip owners can manage splits
CREATE POLICY "Owners can manage splits" ON public.payment_splits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips WHERE id = payment_splits.trip_id AND creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE id = payment_splits.trip_id AND creator_id = auth.uid()));

-- Enable realtime for collaborators and votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_splits;
