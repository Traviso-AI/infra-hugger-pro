-- Notify all group members when a new group message is sent
CREATE OR REPLACE FUNCTION public.notify_on_group_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trip_title text;
  sender_name text;
  member_id uuid;
BEGIN
  SELECT title INTO trip_title FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO sender_name FROM public.profiles WHERE user_id = NEW.user_id;

  -- Notify organizers (except sender)
  FOR member_id IN
    SELECT user_id FROM public.group_organizers
    WHERE trip_id = NEW.trip_id AND user_id <> NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      member_id,
      'group_message',
      'New group message 💬',
      COALESCE(sender_name, 'Someone') || ' in "' || COALESCE(trip_title, 'a trip') || '": ' || LEFT(NEW.content, 80),
      '/trip/' || NEW.trip_id || '?tab=group'
    );
  END LOOP;

  -- Notify accepted collaborators (except sender)
  FOR member_id IN
    SELECT user_id FROM public.trip_collaborators
    WHERE trip_id = NEW.trip_id AND user_id IS NOT NULL AND user_id <> NEW.user_id AND accepted_at IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      member_id,
      'group_message',
      'New group message 💬',
      COALESCE(sender_name, 'Someone') || ' in "' || COALESCE(trip_title, 'a trip') || '": ' || LEFT(NEW.content, 80),
      '/trip/' || NEW.trip_id || '?tab=group'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_group_message
  AFTER INSERT ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_group_message();