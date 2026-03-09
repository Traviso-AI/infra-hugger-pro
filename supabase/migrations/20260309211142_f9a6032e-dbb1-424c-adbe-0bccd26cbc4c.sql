-- #25: Create trigger for auto-recalculating avg_rating on review changes
-- The function recalculate_avg_rating() already exists, just needs triggers attached

CREATE TRIGGER trg_reviews_recalc_avg
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_avg_rating();

-- #26: Rate-limit trip_views by adding a unique constraint on (trip_id, viewer_id) per session
-- Instead, create a dedup function that checks for recent views (last 30 min)
CREATE OR REPLACE FUNCTION public.deduplicate_trip_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip insert if same viewer viewed same trip within last 30 minutes
  IF NEW.viewer_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.trip_views
      WHERE trip_id = NEW.trip_id
        AND viewer_id = NEW.viewer_id
        AND created_at > now() - interval '30 minutes'
    ) THEN
      RETURN NULL; -- silently skip the insert
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduplicate_trip_view
BEFORE INSERT ON public.trip_views
FOR EACH ROW
EXECUTE FUNCTION public.deduplicate_trip_view();