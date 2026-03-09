
-- Group chat messages for trip collaborators
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Anyone in the group (organizer or accepted collaborator) can read messages
CREATE POLICY "group_members_select" ON public.group_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM group_organizers WHERE group_organizers.trip_id = group_messages.trip_id AND group_organizers.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_collaborators.trip_id = group_messages.trip_id AND trip_collaborators.user_id = auth.uid() AND trip_collaborators.accepted_at IS NOT NULL)
  );

-- Group members can send messages
CREATE POLICY "group_members_insert" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM group_organizers WHERE group_organizers.trip_id = group_messages.trip_id AND group_organizers.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM trip_collaborators WHERE trip_collaborators.trip_id = group_messages.trip_id AND trip_collaborators.user_id = auth.uid() AND trip_collaborators.accepted_at IS NOT NULL)
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
