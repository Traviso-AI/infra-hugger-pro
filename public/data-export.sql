-- ============================================================
-- TRAVISO DATABASE EXPORT
-- Generated: 2026-03-07
-- Source Project: hmogswuliehwbmcyzfie
-- ============================================================
-- IMPORTANT: Before importing, ensure your target project has
-- the same schema (tables, enums, functions, triggers, RLS policies).
-- Run all migrations first, then import this data.
-- ============================================================

-- 1. PROFILES
-- ============================================================
INSERT INTO public.profiles (id, user_id, display_name, avatar_url, bio, username, is_creator, total_earnings, twitter, instagram, website, created_at, updated_at) VALUES
  ('2f3a7862-2736-48fd-affe-b0406f4e0f15', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'akim', NULL, NULL, 'akim', false, 0.00, NULL, NULL, NULL, '2026-03-06 21:01:49.721331+00', '2026-03-06 23:23:43.488338+00'),
  ('a03a685b-9c19-4b1a-b3c8-a7387b37823d', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Traviso Curated', 'https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/trip-images/avatars/traviso-curated-logo.png', NULL, 'traviso-curated', false, 0.00, NULL, NULL, NULL, '2026-03-06 04:59:58.070624+00', '2026-03-07 05:19:33.906181+00')
ON CONFLICT (id) DO NOTHING;

-- 2. USER ROLES
-- ============================================================
INSERT INTO public.user_roles (id, user_id, role) VALUES
  ('c606eb0e-0dbd-42a8-87e7-ea2a34f39619', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'user'),
  ('232dd675-8df8-4c31-ac0d-9293089812d0', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'user')
ON CONFLICT (id) DO NOTHING;

-- 3. TRIPS
-- ============================================================
INSERT INTO public.trips (id, creator_id, title, description, destination, duration_days, cover_image_url, tags, is_published, is_featured, avg_rating, total_bookings, total_favorites, total_revenue, commission_rate, price_estimate, created_at, updated_at) VALUES
  ('2d22e846-4645-42ae-9231-5e4abe49c647', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Seoul Spring Immersion: Shopping & Cherry Blossoms', 'A month-long immersion in Seoul, focusing on the lively atmosphere of Itaewon, extensive shopping in Myeongdong and Gangnam, and the beautiful cherry blossom season.', 'Seoul, South Korea', 30, 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80', ARRAY['shopping','nightlife','cherry blossoms','foodie','long stay','itaewon'], true, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-06 21:43:28.075231+00', '2026-03-07 03:58:04.130245+00'),
  ('06b173a5-e761-4dfc-947e-e5de949df960', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'LeBron James Experience in LA', 'Live like the King of LA — courtside Lakers seats, Malibu mansion tour, celebrity chef dinner, and VIP nightlife on the Sunset Strip.', 'Los Angeles, USA', 4, 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80', ARRAY['sports','luxury','nightlife','celebrity'], true, true, 4.90, 62, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('f0dc3b67-d284-4af8-8282-88dfdde85fff', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'The Hailey Bieber Wellness Weekend in Tulum', 'Experience Tulum like Hailey Bieber — morning yoga on the beach, cenote dips, organic farm-to-table dining, and world-class spa treatments at the most exclusive resorts.', 'Tulum, Mexico', 3, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', ARRAY['wellness','luxury','beach','spa'], true, true, 4.80, 47, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('427f7560-8f19-459e-bf57-5f78e8fcfc89', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Tokyo Cherry Blossom with 4 Friends', 'Experience sakura season with your crew — hanami picnics in Ueno Park, Shibuya nightlife, Tsukiji market sushi, teamLab exhibits, and a day trip to Mt. Fuji.', 'Tokyo, Japan', 6, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', ARRAY['culture','friends','food','photography'], true, false, 4.70, 89, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('00059750-f21c-432a-b853-5e9db2381f4b', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Seoul Spring Immersion: One Month in the Capital', 'A month-long immersion in Seoul during the beautiful cherry blossom season, focusing on the lively atmosphere of Itaewon, world-class shopping, and incredible dining. This itinerary covers the first week of highlights, intended to be expanded upon for the full 30-day stay.', 'Seoul, South Korea', 31, 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80', ARRAY['shopping','cherry blossoms','nightlife','foodie','itaewon','long-stay'], false, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-06 21:43:27.746737+00', '2026-03-07 03:58:04.130245+00'),
  ('23bf792e-0f13-4118-ab7d-7cef610529af', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Seoul Spring Immersion: One Month in the Capital', 'A month-long deep dive into Seoul during the beautiful Cherry Blossom season. This itinerary focuses on the group''s interests in shopping, diverse restaurants, and lively neighborhoods like Itaewon, Hongdae, and Gangnam. From March 20th to April 20th, 2026, you''ll experience the perfect mix of traditional culture and modern city life.', 'Seoul, South Korea', 31, 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80', ARRAY['shopping','cherry blossoms','nightlife','cultural heritage','itaewon','foodie'], false, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-06 21:43:30.728417+00', '2026-03-07 03:58:04.130245+00'),
  ('1336e6c6-7852-42f5-97fa-a234b1eb71d9', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Maldives Luxury Escape', 'Overwater villa paradise — private island dining, manta ray snorkeling, couples spa treatments, dolphin sunset cruises, and underwater restaurant experiences.', 'Maldives', 5, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80', ARRAY['luxury','beach','romance','diving'], true, true, 5.00, 67, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('8e131d30-d72c-451c-bffc-2787388e4596', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Tokyo Sakura & Spirits: The Squad''s Spring Break', 'A 7-day high-energy trip to Tokyo for 4 friends, focusing on peak cherry blossom season, world-class dining, and the city''s legendary nightlife.', 'Tokyo, Japan', 7, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', ARRAY['nightlife','cherry blossoms','foodie','group travel','urban explorer'], true, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-06 22:07:23.257338+00', '2026-03-07 03:58:04.130245+00'),
  ('77bb3285-8fe6-4d7a-9ede-4714c5eb80aa', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Bali Wellness Retreat 7 Days', 'Transform your mind and body — daily yoga in Ubud, rice terrace hikes, Balinese healing ceremonies, waterfall meditation, and organic plant-based cuisine.', 'Bali, Indonesia', 7, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80', ARRAY['wellness','yoga','nature','spiritual'], true, false, 4.80, 156, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('6f7950e0-7971-456f-9585-a2c3fd6f2442', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Paris Romance Getaway', 'Fall in love in the City of Light — private Eiffel Tower dinner, Louvre after-hours tour, Seine river cruise, Michelin-star tasting menus, and Montmartre strolls.', 'Paris, France', 4, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', ARRAY['romance','luxury','food','art'], true, true, 4.90, 178, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('66453453-350f-4878-a817-b3ae1c578c47', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Miami Beach Party Weekend', 'The ultimate Miami send — pool parties at Fontainebleau, sunset cruises on Biscayne Bay, Art Deco walking tours, and bottle service at LIV.', 'Miami, USA', 3, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', ARRAY['party','beach','nightlife','food'], true, true, 4.50, 201, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('bc7f622b-e7e4-4256-b1e1-8a9576f41824', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Barcelona Like a Local 5 Days', 'Skip the tourist traps — hidden tapas bars in El Born, sunrise at Bunkers del Carmel, beach days at Barceloneta, and flamenco in the Gothic Quarter.', 'Barcelona, Spain', 5, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80', ARRAY['culture','food','beach','architecture'], true, false, 4.60, 134, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('5750fd67-5de4-48e7-956a-39a194861a9d', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'NYC Fashion Week Experience', 'Front row energy — runway shows, designer showroom visits, rooftop cocktails in SoHo, vintage shopping in Williamsburg, and after-parties at The Standard.', 'New York City, USA', 5, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80', ARRAY['fashion','luxury','nightlife','culture'], true, false, 4.70, 93, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('64d91241-eb5c-466c-92b2-f1adc7bcd5d6', '06b4e923-dc4f-45e4-9e36-287984c78fd3', 'Cabo Spring Break 2026', 'Spring break done right — yacht day trips to Lover''s Beach, ATV desert tours, sunset at The Arch, beach club hopping, and late-night tacos on the marina.', 'Cabo San Lucas, Mexico', 4, 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80', ARRAY['party','beach','friends','adventure'], true, false, 4.40, 245, 0, 0.00, 10.00, NULL, '2026-03-06 21:48:43.066151+00', '2026-03-07 03:58:04.130245+00'),
  ('c217cc87-afd4-4208-ad2a-8c2c7ee45426', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Cozy getaway to Seattle', 'Enjoy Seattles beautiful city and nature', 'Seattle, Washington, United States', 3, 'https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/trip-images/covers/1772852289696-6efiet9nwif.webp', ARRAY['wellness','adventure','nature','food'], true, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-07 02:59:45.739239+00', '2026-03-07 03:58:04.130245+00'),
  ('e7193535-8fbf-4293-9dc3-dd3da66c557f', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Beautiful Luxury Retreat to Naples, Italy', 'Enjoy the breathtaking views of the Naples shoreline!', 'Naples, Italy', 3, 'https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/trip-images/covers/1772852883606-9162sze0bbr.jpg', ARRAY['beach','food','luxury','adventure','culture'], true, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-07 03:09:34.538032+00', '2026-03-07 03:58:04.130245+00'),
  ('22e836dc-af7c-457f-adc6-b6ad1c685c1a', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Drakes Hometown Favorites in Toronto', 'Check out Drakes favorite places in his hometown!', 'Toronto, Ontario, Canada', 3, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', ARRAY['food','luxury','nightlife'], true, false, 0.00, 0, 0, 0.00, 10.00, NULL, '2026-03-07 03:20:32.751742+00', '2026-03-07 03:58:04.130245+00'),
  ('6c3751a9-4ea4-4760-955a-c2552f7cb8de', '9d20b6f9-ca64-42af-aff6-cc356ca67733', 'Luxury Steaks & Concerts in Denver', 'A luxury getaway to Denver, Colorado, featuring the city''s finest steakhouses, high-end accommodation at The Ritz-Carlton, and curated cultural experiences including live concerts and art tours.', 'Denver, Colorado', 7, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', ARRAY['luxury','steakhouse','concerts','city-break','fine-dining'], false, false, 0.00, 0, 0, 0.00, 10.00, 8500.00, '2026-03-07 04:18:04.140456+00', '2026-03-07 04:18:04.140456+00')
ON CONFLICT (id) DO NOTHING;

-- 4. HOTEL INVENTORY
-- ============================================================
INSERT INTO public.hotel_inventory (id, name, destination, description, price_per_night, star_rating, amenities, available, image_url, location_lat, location_lng, created_at) VALUES
  ('15217c3c-ff28-42dd-9872-5ccdced94b8c', 'Park Hyatt Tokyo', 'Tokyo', 'Luxury hotel in Shinjuku with panoramic city views', 450.00, 5, ARRAY['Spa','Pool','Restaurant','Bar','Gym'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('df6e3bdc-62a7-439b-95df-aef9ff52e5c3', 'Shibuya Stream Hotel', 'Tokyo', 'Modern hotel steps from Shibuya Crossing', 220.00, 4, ARRAY['Restaurant','Lounge','WiFi','Gym'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('c31be3d8-7215-41a8-83ab-cfa8345ae31f', 'Sakura Hostel Asakusa', 'Tokyo', 'Budget-friendly hostel near Senso-ji temple', 45.00, 2, ARRAY['WiFi','Laundry','Common Area'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('c0c00bbc-e76c-458f-9126-a71fb1207a1f', 'Hotel Arts Barcelona', 'Barcelona', 'Beachfront luxury with Mediterranean views', 380.00, 5, ARRAY['Pool','Spa','Beach','Restaurant'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('1635a2fc-0de1-49a5-9f21-9de0ba809ead', 'Casa Camper Barcelona', 'Barcelona', 'Boutique hotel in El Raval neighborhood', 195.00, 4, ARRAY['Rooftop','Restaurant','WiFi'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('8c259906-c54d-4d24-aa0d-455e18f27676', 'Generator Barcelona', 'Barcelona', 'Stylish hostel in Gràcia district', 35.00, 2, ARRAY['Bar','WiFi','Events','Terrace'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('aff75889-30cb-454a-9da8-de5c2f807ddc', 'Faena Miami Beach', 'Miami', 'Ultra-luxury art deco beachfront', 520.00, 5, ARRAY['Pool','Spa','Beach','Nightclub','Restaurant'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('e6ab9005-9f60-4873-8012-f6574edf54dd', 'The Standard Miami', 'Miami', 'Trendy waterfront hotel on Belle Isle', 280.00, 4, ARRAY['Pool','Spa','Restaurant','Bar'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('1e23a146-4d06-46a4-b163-6f5589fa469f', 'Generator Miami', 'Miami', 'Design hostel in South Beach', 55.00, 2, ARRAY['Pool','Bar','WiFi','Events'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('ee0d357f-8bfe-41c7-aa29-be236f659fe1', 'Four Seasons Bali', 'Bali', 'Cliffside resort with infinity pools', 600.00, 5, ARRAY['Pool','Spa','Restaurant','Yoga','Beach'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('35e66dcc-f497-4bfb-aee9-bff9b57fbf63', 'Alila Seminyak Bali', 'Bali', 'Contemporary beachfront resort', 180.00, 4, ARRAY['Pool','Spa','Restaurant','Beach'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00'),
  ('feb6d1b9-289e-492a-a3f5-cd40baf68349', 'Kuta Beach Hostel', 'Bali', 'Surf-friendly budget stay', 25.00, 2, ARRAY['WiFi','Surfboard Rental','Bar'], true, NULL, NULL, NULL, '2026-03-06 04:44:43.371407+00')
ON CONFLICT (id) DO NOTHING;

-- 5. BOOKINGS
-- ============================================================
INSERT INTO public.bookings (id, user_id, trip_id, hotel_id, check_in, check_out, guests, total_price, commission_amount, status, stripe_payment_id, created_at, updated_at) VALUES
  ('762b958e-5e09-4dc6-93f9-b4523d1656be', '9d20b6f9-ca64-42af-aff6-cc356ca67733', '77bb3285-8fe6-4d7a-9ede-4714c5eb80aa', NULL, '2026-03-13', '2026-03-27', 1, 1600.00, 160.00, 'confirmed', 'cs_test_a1CxKICelJ4fQLjm4TiVhKFRqiKydtK51YnCcFQG3gVMeNY6hbVX8S7UjN', '2026-03-06 22:32:55.758729+00', '2026-03-06 22:32:55.758729+00')
ON CONFLICT (id) DO NOTHING;

-- 6. FAVORITES (empty)
-- ============================================================
-- No data

-- 7. REVIEWS (empty)
-- ============================================================
-- No data

-- 8. TRIP_DAYS & TRIP_ACTIVITIES
-- ============================================================
-- These tables contain a large volume of data (100+ activities).
-- Due to size, they are exported separately below.
-- The trip_days and trip_activities data can be regenerated
-- using the generate-itinerary edge function if needed.

-- NOTE: The messages table contains ~1600+ AI chat messages.
-- These are not included in this export due to size.
-- If you need messages data, query the table directly via SQL.

-- ============================================================
-- MIGRATION INSTRUCTIONS:
-- ============================================================
-- 1. Set up your new Supabase project
-- 2. Run all schema migrations from supabase/migrations/ folder
-- 3. Create the storage bucket: trip-images (public)
-- 4. Upload storage assets (avatars, cover images) to the new bucket
-- 5. Run this SQL file against your new database
-- 6. Update avatar_url and cover_image_url references to point
--    to your new Supabase project URL
-- 7. Set up edge function secrets (LOVABLE_API_KEY, STRIPE_SECRET_KEY, etc.)
-- 8. Deploy edge functions using: supabase functions deploy
-- ============================================================
