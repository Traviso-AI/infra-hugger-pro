-- Trip sessions
create table trip_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  status text default 'pending' check (status in ('pending','confirmed','processing','completed','failed')),
  selected_flights jsonb,
  selected_hotels jsonb,
  selected_activities jsonb,
  total_amount_cents integer,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Booking items
create table booking_items (
  id uuid primary key default gen_random_uuid(),
  trip_session_id uuid references trip_sessions(id) on delete cascade,
  type text check (type in ('flight','hotel','activity','restaurant')),
  provider_reference text,
  status text default 'pending' check (status in ('pending','booked','failed')),
  amount_cents integer,
  provider_response jsonb,
  created_at timestamptz default now()
);

-- Booking status events
create table booking_status_events (
  id uuid primary key default gen_random_uuid(),
  trip_session_id uuid references trip_sessions(id) on delete cascade,
  event_type text,
  message text,
  created_at timestamptz default now()
);

-- Commission ledger
create table commission_ledger (
  id uuid primary key default gen_random_uuid(),
  trip_session_id uuid references trip_sessions(id),
  creator_id uuid references profiles(id),
  booking_type text check (booking_type in ('exact_itinerary')),
  amount_cents integer,
  creator_percentage integer default 25,
  traviso_margin_cents integer,
  created_at timestamptz default now()
);

-- Creator earnings
create table creator_earnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) unique,
  pending_payout_cents integer default 0,
  total_paid_out_cents integer default 0,
  stripe_connect_account_id text,
  updated_at timestamptz default now()
);

-- Enable RLS on all tables
alter table trip_sessions enable row level security;
alter table booking_items enable row level security;
alter table booking_status_events enable row level security;
alter table commission_ledger enable row level security;
alter table creator_earnings enable row level security;

-- trip_sessions: users can read their own rows
create policy "Users can read own trip_sessions"
  on trip_sessions for select
  using (auth.uid() = user_id);

-- booking_items: users can read items belonging to their trip sessions
create policy "Users can read own booking_items"
  on booking_items for select
  using (
    trip_session_id in (
      select id from trip_sessions where user_id = auth.uid()
    )
  );

-- booking_status_events: users can read events for their trip sessions
create policy "Users can read own booking_status_events"
  on booking_status_events for select
  using (
    trip_session_id in (
      select id from trip_sessions where user_id = auth.uid()
    )
  );

-- commission_ledger: no user access (service role only)
-- No policies = no access for authenticated users; service role bypasses RLS

-- creator_earnings: no user access (service role only)
-- No policies = no access for authenticated users; service role bypasses RLS
