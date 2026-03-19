-- Add missing columns to trip_sessions
alter table trip_sessions
  add column if not exists selected_restaurants jsonb,
  add column if not exists traveler_info jsonb;

-- RLS: users can insert their own trip sessions
create policy "Users can insert own trip_sessions"
  on trip_sessions for insert
  with check (auth.uid() = user_id);

-- RLS: users can update their own trip sessions
create policy "Users can update own trip_sessions"
  on trip_sessions for update
  using (auth.uid() = user_id);
