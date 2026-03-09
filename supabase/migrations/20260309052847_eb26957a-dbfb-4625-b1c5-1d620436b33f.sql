
-- Tighten the notification insert policy - only allow inserting for your own user_id
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can receive notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
