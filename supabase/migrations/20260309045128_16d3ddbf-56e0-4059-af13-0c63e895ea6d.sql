
CREATE OR REPLACE FUNCTION public.update_trip_booking_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act on confirmed bookings (new insert or status change to confirmed)
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.trips
    SET total_bookings = COALESCE(total_bookings, 0) + 1,
        total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total_price, 0)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'confirmed' AND NEW.status = 'confirmed' THEN
    UPDATE public.trips
    SET total_bookings = COALESCE(total_bookings, 0) + 1,
        total_revenue = COALESCE(total_revenue, 0) + COALESCE(NEW.total_price, 0)
    WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_trip_booking_stats
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_trip_booking_stats();
