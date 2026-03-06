
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN DEFAULT false,
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trips
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  cover_image_url TEXT,
  duration_days INTEGER NOT NULL DEFAULT 1,
  price_estimate NUMERIC(10,2),
  commission_rate NUMERIC(5,2) DEFAULT 10,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  total_bookings INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published trips viewable by all" ON public.trips FOR SELECT USING (is_published = true OR auth.uid() = creator_id);
CREATE POLICY "Creators can insert trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = creator_id);
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip Days
CREATE TABLE public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trip days viewable with trip" ON public.trip_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND (is_published = true OR creator_id = auth.uid()))
);
CREATE POLICY "Creators can manage trip days" ON public.trip_days FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND creator_id = auth.uid())
);
CREATE POLICY "Creators can update trip days" ON public.trip_days FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND creator_id = auth.uid())
);
CREATE POLICY "Creators can delete trip days" ON public.trip_days FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND creator_id = auth.uid())
);

-- Trip Activities
CREATE TABLE public.trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_day_id UUID REFERENCES public.trip_days(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight','hotel','restaurant','activity','event','transport')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  price_estimate NUMERIC(10,2),
  booking_url TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities viewable with trip day" ON public.trip_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_days td
    JOIN public.trips t ON t.id = td.trip_id
    WHERE td.id = trip_day_id AND (t.is_published = true OR t.creator_id = auth.uid())
  )
);
CREATE POLICY "Creators can manage activities" ON public.trip_activities FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_days td
    JOIN public.trips t ON t.id = td.trip_id
    WHERE td.id = trip_day_id AND t.creator_id = auth.uid()
  )
);
CREATE POLICY "Creators can update activities" ON public.trip_activities FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_days td
    JOIN public.trips t ON t.id = td.trip_id
    WHERE td.id = trip_day_id AND t.creator_id = auth.uid()
  )
);
CREATE POLICY "Creators can delete activities" ON public.trip_activities FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_days td
    JOIN public.trips t ON t.id = td.trip_id
    WHERE td.id = trip_day_id AND t.creator_id = auth.uid()
  )
);

-- Hotel Inventory (simulated)
CREATE TABLE public.hotel_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  price_per_night NUMERIC(10,2) NOT NULL,
  amenities TEXT[],
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hotels viewable by all" ON public.hotel_inventory FOR SELECT USING (true);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES public.hotel_inventory(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  check_in DATE,
  check_out DATE,
  guests INTEGER DEFAULT 1,
  total_price NUMERIC(10,2),
  commission_amount NUMERIC(10,2),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages (AI conversation history)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trips_destination ON public.trips(destination);
CREATE INDEX idx_trips_published ON public.trips(is_published);
CREATE INDEX idx_trips_featured ON public.trips(is_featured);
CREATE INDEX idx_trips_creator ON public.trips(creator_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_user ON public.messages(user_id);
CREATE INDEX idx_hotel_destination ON public.hotel_inventory(destination);
CREATE INDEX idx_reviews_trip ON public.reviews(trip_id);

-- Storage bucket for trip images
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true);
CREATE POLICY "Trip images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'trip-images');
CREATE POLICY "Authenticated users can upload trip images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trip-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own trip images" ON storage.objects FOR UPDATE USING (bucket_id = 'trip-images' AND auth.uid()::text = (storage.foldername(name))[1]);
