
-- Function to convert text to title case
CREATE OR REPLACE FUNCTION public.to_title_case(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  words text[];
  result text := '';
  word text;
  i integer;
  minor_words text[] := ARRAY['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it'];
BEGIN
  words := string_to_array(input_text, ' ');
  FOR i IN 1..array_length(words, 1) LOOP
    word := words[i];
    IF i = 1 OR NOT (lower(word) = ANY(minor_words)) THEN
      word := upper(left(word, 1)) || lower(substring(word from 2));
    ELSE
      word := lower(word);
    END IF;
    IF i = 1 THEN
      result := word;
    ELSE
      result := result || ' ' || word;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger function to enforce title case on trip titles
CREATE OR REPLACE FUNCTION public.enforce_trip_title_case()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.title := public.to_title_case(NEW.title);
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_trips_title_case
BEFORE INSERT OR UPDATE OF title ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trip_title_case();

-- Fix existing data
UPDATE public.trips SET title = public.to_title_case(title);
