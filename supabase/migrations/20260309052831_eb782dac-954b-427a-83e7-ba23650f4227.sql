
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify creator when someone books their trip
CREATE OR REPLACE FUNCTION public.notify_on_booking()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  trip_record RECORD;
  booker_name text;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT id, title, creator_id INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
    SELECT display_name INTO booker_name FROM public.profiles WHERE user_id = NEW.user_id;
    
    IF trip_record.creator_id IS NOT NULL AND trip_record.creator_id <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        trip_record.creator_id,
        'booking',
        'New booking! 🎉',
        COALESCE(booker_name, 'Someone') || ' booked your trip "' || trip_record.title || '"',
        '/trip/' || trip_record.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_booking
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking();

-- Trigger: notify when someone follows you
CREATE OR REPLACE FUNCTION public.notify_on_follow()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  follower_name text;
  follower_uname text;
BEGIN
  SELECT display_name, username INTO follower_name, follower_uname FROM public.profiles WHERE user_id = NEW.follower_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.following_id,
    'follow',
    'New follower! 👋',
    COALESCE(follower_name, 'Someone') || ' started following you',
    '/profile/' || COALESCE(follower_uname, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: notify creator when someone reviews their trip
CREATE OR REPLACE FUNCTION public.notify_on_review()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  trip_record RECORD;
  reviewer_name text;
BEGIN
  SELECT id, title, creator_id INTO trip_record FROM public.trips WHERE id = NEW.trip_id;
  SELECT display_name INTO reviewer_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  IF trip_record.creator_id IS NOT NULL AND trip_record.creator_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      trip_record.creator_id,
      'review',
      'New review ⭐',
      COALESCE(reviewer_name, 'Someone') || ' left a ' || NEW.rating || '-star review on "' || trip_record.title || '"',
      '/trip/' || trip_record.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_review();

-- Also add the avg_rating recalculation trigger
CREATE OR REPLACE FUNCTION public.recalculate_avg_rating()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  target_trip_id uuid;
BEGIN
  target_trip_id := COALESCE(NEW.trip_id, OLD.trip_id);
  UPDATE public.trips
  SET avg_rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.reviews
    WHERE trip_id = target_trip_id
  ), 0)
  WHERE id = target_trip_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalculate_avg_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_avg_rating();
