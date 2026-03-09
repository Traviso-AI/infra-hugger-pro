
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follows (needed for counts)
CREATE POLICY "Follows viewable by all" ON public.follows FOR SELECT USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
