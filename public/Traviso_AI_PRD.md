# Traviso AI — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** March 9, 2026  
**Platform:** Web Application (React + Vite + TypeScript)  
**Live URL:** https://traviso.lovable.app  
**Backend:** Lovable Cloud (Supabase)  
**Payments:** Stripe  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Positioning](#2-product-vision--positioning)
3. [User Personas](#3-user-personas)
4. [Authentication & Account System](#4-authentication--account-system)
5. [Homepage & Landing Experience](#5-homepage--landing-experience)
6. [Explore Marketplace](#6-explore-marketplace)
7. [Trip Detail Page](#7-trip-detail-page)
8. [AI Trip Planner (Nala)](#8-ai-trip-planner-nala)
9. [Creator Studio (Create/Edit Trip)](#9-creator-studio-createedit-trip)
10. [Booking & Payments](#10-booking--payments)
11. [Dashboard](#11-dashboard)
12. [Creator Analytics](#12-creator-analytics)
13. [Collections](#13-collections)
14. [User Profiles (Public & Edit)](#14-user-profiles-public--edit)
15. [Social Features](#15-social-features)
16. [Notifications System](#16-notifications-system)
17. [Leaderboard](#17-leaderboard)
18. [Sharing & Viral Growth](#18-sharing--viral-growth)
19. [Onboarding](#19-onboarding)
20. [Admin Dashboard](#20-admin-dashboard)
21. [Email System](#21-email-system)
22. [Database Schema](#22-database-schema)
23. [Edge Functions (Backend)](#23-edge-functions-backend)
24. [Security & RLS](#24-security--rls)
25. [Design System](#25-design-system)
26. [SEO & Performance](#26-seo--performance)
27. [Static Pages](#27-static-pages)
28. [Known Gaps & Future Work](#28-known-gaps--future-work)
29. [Glossary](#29-glossary)

---

## 1. Executive Summary

Traviso AI is an AI-powered travel planning platform that doubles as a creator marketplace. Users can plan trips with an AI assistant named Nala, browse curated itineraries published by travel creators, book all-inclusive travel packages via Stripe, and earn commissions by publishing their own trips for others to book.

**Core value proposition:** "Plan it, book it, and get paid when others follow your lead."

---

## 2. Product Vision & Positioning

### Tagline
"The trip finally made it out of the group chat."

### Three Pillars
1. **AI Trip Builder** — Users describe a trip idea (or upload a group chat screenshot) and Nala generates a complete itinerary with flights, hotels, activities, and cost estimates.
2. **Creator Marketplace** — Travel creators, influencers, and locals publish curated trip packages that anyone can browse and book.
3. **Earn as a Creator** — Creators earn commission (default 10%) every time someone books their trip. Referral tracking via `?ref=username` links.

---

## 3. User Personas

| Persona | Description | Key Actions |
|---------|-------------|-------------|
| **Traveler** | End-user looking for trip inspiration and bookable itineraries | Browse, search, book, favorite, review, use AI planner |
| **Creator** | Travel influencer or enthusiast monetizing travel expertise | Create trips via Creator Studio, share with referral links, track analytics |
| **Admin** | Platform operator managing content and users | Moderate trips, feature/unfeature, manage users, view revenue |

---

## 4. Authentication & Account System

### Features
- **Email + Password signup** with email verification (confirmation required before login)
- **Google OAuth** via Lovable Cloud managed social login
- **Forgot Password** flow with email reset link → redirect to `/reset-password`
- **Auto-profile creation** — Database trigger `handle_new_user()` auto-creates a `profiles` row with display name, avatar URL, and generated username on signup
- **Auto-role assignment** — New users automatically get the `user` role in `user_roles`
- **Session management** — Persistent sessions with auto-refresh via Supabase Auth
- **Protected routes** — `<ProtectedRoute>` wrapper redirects unauthenticated users to `/login`

### Auth Pages
| Route | Purpose |
|-------|---------|
| `/login` | Email/password + Google login |
| `/signup` | Full name + email/password + Google signup |
| `/forgot-password` | Enter email to receive reset link |
| `/reset-password` | Set new password (accessed via email link) |

### Custom Auth Emails
- Custom branded email templates deployed via `auth-email-hook` Edge Function
- Sender domain: `notify.traviso.ai`
- Templates: signup confirmation, password recovery, magic link, invite, email change, reauthentication
- Styled with Traviso teal (#29A38B) branding and horizontal logo

---

## 5. Homepage & Landing Experience

**Route:** `/`

### Sections
1. **Hero Section** — Full-bleed travel photo background with gradient overlay. Hero text "The trip finally made it out of the group chat." Two CTAs: "Plan with AI" and "Explore Trips". Floating animated trip card thumbnails on desktop (Bali, Paris, Tokyo).
2. **Value Props** — 3-column grid: AI Trip Builder, Creator Marketplace, Earn as a Creator.
3. **Trending Trips** — Grid of top 6 most-booked published trips (TripCard components). Fallback empty state encourages early creator adoption.
4. **CTA Section** — Dark navy background. "Ready to share your travel expertise?" with "Get Started Free" button.

### Animations
- Framer Motion fade-in on hero text and floating cards
- Scroll-triggered fade-in on value prop cards

---

## 6. Explore Marketplace

**Route:** `/explore`

### Features
- **Search** — Full-text search across trip titles and destinations (`ilike`)
- **Filters** (via `ExploreFilterBar`):
  - Price range slider (min/max)
  - Duration range (days)
  - Tags (multi-select overlap filter)
  - Sort: Most Popular, Newest, Price Low→High, Price High→Low, Top Rated
- **From Creators You Follow** — Horizontal scrolling carousel of trips from followed creators (only visible when logged in and following someone). Infinite loop scroll with arrow buttons.
- **Trending Trips** — Paginated grid (21 per page) with server-side pagination. Smart pagination UI with ellipsis.
- **Empty states** — "No trips found" and "Follow creators to see trips here"

### Trip Card (`TripCard`) Component
Each card displays:
- Cover image (auto-generated from destination if not provided, via Unsplash-style URL generation)
- Destination with map pin icon
- Trip title (line-clamped to 1 line)
- Duration (days), average rating (stars), total bookings or "New" badge
- Tags (up to 3)
- Creator name + avatar initial
- "Get Price →" CTA
- **Heart button** — Toggle favorite (auth required)
- **Folder button** — Add to collection modal (auth required)

---

## 7. Trip Detail Page

**Route:** `/trip/:id`

### Features
- **Hero Image** — Full-width cover image with gradient overlay
- **Trip Metadata** — Title, destination, duration, average rating, total bookings, tags, description
- **Itinerary** — Day-by-day breakdown with activities. Each activity shows: icon by type (flight ✈️, hotel 🏨, restaurant 🍽️, activity 🏃, event 🎵, transport 🚌), title, description, location, time, and price estimate.
- **Booking Sidebar** (sticky on desktop) — Price per person, "Check Availability →" CTA, Share button, Creator info card
- **Reviews Section** — Star ratings and comments from users. Inline review form for logged-in users (except trip creator). Reviews update `avg_rating` on the trips table via database trigger.
- **Viral Signup Banner** — `ViralSignupBanner` component shown at bottom for unauthenticated users
- **View Tracking** — Each visit inserts into `trip_views` with viewer_id and referral_source
- **Referral Handling** — `?ref=username` param stored in `sessionStorage`
- **SEO** — Dynamic meta tags (title, description, OG image) via `usePageSEO` hook
- **Share Modal** — Full sharing experience (see Section 18)

---

## 8. AI Trip Planner (Nala)

**Route:** `/ai-planner`

### Overview
Nala is a conversational AI travel assistant named after a mini golden doodle 🐾. Users describe trip ideas in natural language and receive complete, structured itineraries.

### Features
- **Chat Interface** — Full-screen chat with message bubbles. User messages in teal accent, assistant messages with card styling.
- **Nala Avatar** — Custom avatar with "online" status indicator
- **Typing Animation** — `TypingDots` component during AI response
- **Streaming Responses** — Server-Sent Events (SSE) for real-time token streaming. Markdown rendering via `react-markdown`.
- **File Upload** — Attach images (JPG, PNG) or text files (TXT) up to 10MB. Images uploaded to `trip-images` storage bucket. Images sent to Gemini for visual understanding. Text files parsed inline.
- **Group Chat Screenshot** → Itinerary — Users can upload a screenshot of a group chat conversation. Nala reads the image (via Gemini vision) and builds an itinerary from the group's plans.
- **Conversation Persistence** — Conversations saved to `conversations` and `messages` tables. Chat history drawer to switch between past conversations.
- **Save as Trip** — "Save as Trip" button extracts structured data from AI conversation via `extract-trip` Edge Function, creates trip + days + activities in database, and redirects to trip detail page.
- **Suggested Prompts** — Pre-built suggestions on empty chat: "3 days in Tokyo with friends...", "Weekend in Barcelona...", etc.
- **New Chat** — Users can start fresh conversations while preserving history
- **Delete Conversation** — Users can delete past conversations

### Backend (Edge Functions)
- **`ai-travel-planner`** — Handles chat requests. Uses Gemini for image-attached messages (direct API with base64 inlineData), Lovable AI Gateway for text-only (SSE streaming). System prompt defines Nala's personality and itinerary structure.
- **`extract-trip`** — Extracts structured trip data from conversation. Uses Lovable AI Gateway (google/gemini-3-flash-preview). Parses AI response into trip + days + activities and inserts into database.

---

## 9. Creator Studio (Create/Edit Trip)

**Route:** `/create-trip` (create), `/edit-trip/:id` (edit)

### Creator Gate
Non-creators are shown a gate screen: "Enable Creator Mode" with explanation. Clicking enables `is_creator = true` on their profile.

### 3-Step Wizard
1. **Step 1: Trip Basics** (`StepTripBasics`)
   - Title (min 3 chars, Title Case enforced via DB trigger)
   - Destination (autocomplete via `DestinationAutocomplete`)
   - Description (min 20 chars)
   - Duration (1-30 days)
   - Price Estimate (optional)
   - Tags (multi-select from predefined list: luxury, budget, solo, family, etc.)
   - Cover Image Upload (`CoverImageUpload`) — Uploaded to `trip-images` storage bucket

2. **Step 2: Build Itinerary** (`StepBuildItinerary`)
   - Day-by-day builder. Days auto-sync with duration.
   - Each day: title, description, multiple activities
   - Each activity: type (hotel, activity, restaurant, event, flight, transport — lowercase enforced), title (required), description, location
   - **"Generate itinerary with AI"** — Button that calls AI to populate itinerary from trip basics
   - Validation: each day needs ≥1 activity with title

3. **Step 3: Preview & Publish** (`StepPreviewPublish`)
   - Full preview of the trip as it will appear
   - Publish checklist validates all requirements
   - Two actions: "Save Draft" or "Publish Trip"

### Success Screen
After publishing: animated success with confetti-style UI, link to view trip, sharing options.

### Edit Trip
Same wizard but pre-populated with existing trip data. Supports updating title, description, days, activities. Can republish or save as draft.

---

## 10. Booking & Payments

### Booking Flow
**Route:** `/booking/:tripId`

1. **Select Dates** — Check-in and check-out date pickers (min = today)
2. **Select Guests** — Dropdown (1-6 guests)
3. **Calculate Price** — "Calculate Price →" button triggers animated loading sequence:
   - "Searching flights..." (if trip has flight activities)
   - "Checking hotel availability..." (if trip has hotel activities)
   - "Calculating experiences..." (if trip has non-flight/hotel activities)
   - "Building your package..."
4. **Price Breakdown** — Itemized by activity type (Flights, Accommodation, Dining, Activities, Events, Transport). Each line item with individual price. Per-guest multiplier. Grand total.
5. **Confirm & Book** — Redirects to Stripe Checkout (same-window redirect for session preservation)

### Price Calculation
- Uses actual `price_estimate` from each activity in the itinerary
- Fallback: deterministic hash-based pricing when no price set (e.g., flights $280-480, hotels $120-270, restaurants $25-75)
- Total = sum of all activity prices × number of guests

### Stripe Integration
- **Edge Function:** `create-checkout-session`
- Creates/reuses Stripe customer by email
- Generates Checkout Session with trip metadata
- Success redirect: `/booking/success?session_id=...&trip_id=...`

### Booking Success
**Route:** `/booking/success`
- Reads URL params and creates/upserts booking record
- Idempotent via `stripe_payment_id` unique constraint
- Calculates commission (default 10%)
- DB trigger `update_trip_booking_stats` auto-increments `total_bookings` and `total_revenue` on the trips table
- DB trigger `notify_on_booking` creates in-app notification for the creator

---

## 11. Dashboard

**Route:** `/dashboard` (protected)

### Sections
1. **Header** — "Dashboard" with welcome message, "Create Trip" CTA
2. **Onboarding Checklist** — Getting Started progress tracker (see Section 19)
3. **Creator Analytics** — Charts and graphs (see Section 12)
4. **Summary Stats** — 4 cards: Published Trips, Total Bookings, Revenue, My Bookings
5. **My Trips** — List of all trips (draft & published) with status badges, publish/edit actions
6. **My Bookings** — List of confirmed bookings with status, dates, price
7. **Saved Trips** — Grid of favorited trips (TripCard components)
8. **Collections CTA** — Banner linking to Collections page

---

## 12. Creator Analytics

**Component:** `CreatorAnalytics` (embedded in Dashboard)

### Features
- **30-day Summary Cards** — Views, Bookings (confirmed), Revenue, New Followers
- **Interactive Charts** (recharts):
  - **Views Tab** — Area chart of daily trip views (teal gradient)
  - **Bookings Tab** — Bar chart of daily bookings (orange/sunset)
  - **Revenue Tab** — Area chart of daily revenue (navy gradient)
- **Data Sources** — Queries `trip_views`, `bookings`, and `follows` tables for the last 30 days, aggregated by date

---

## 13. Collections

**Route:** `/collections` (protected)

### Features
- **Create Collection** — Name + optional description. Modal dialog.
- **View Collections** — Grid of collection cards with folder icon, name, description
- **Open Collection** — Shows all trips in that collection as TripCard grid
- **Add to Collection** — Modal triggered from TripCard's folder icon. Shows all collections with checkmarks for already-added trips. "New Collection" inline creation.
- **Remove from Collection** — Trash button overlay on trip cards within collection view
- **Delete Collection** — Deletes collection and all items (CASCADE)

### Database Tables
- `collections` — id, user_id, name, description, cover_image_url, timestamps
- `collection_items` — id, collection_id (FK), trip_id (FK), added_at, UNIQUE(collection_id, trip_id)

---

## 14. User Profiles (Public & Edit)

### Public Profile
**Route:** `/profile/:username`

- **Avatar** — Uploaded to `avatars` storage bucket (max 5MB)
- **Display Name** + Creator Badge (if `is_creator`)
- **Username** — Auto-generated on signup (full_name-slug + first 4 chars of user_id)
- **Bio** — Optional text
- **Website Link** — External link
- **Stats** — Trips Created, Trips Taken, Followers, Leaderboard Rank (if creator)
- **Follow/Unfollow** — Button for other logged-in users. Self-follow prevented by RLS.
- **Edit Profile** — Dialog with: avatar upload, display name, bio, website, Creator Mode toggle
- **Share Profile** — Modal with sharing options (see Section 18)
- **Tabs** — "Trips Created" and "Trips Taken" (from confirmed bookings, deduplicated)
- **Profile View Tracking** — Each visit inserts into `profile_views` (own views excluded)
- **Viral Signup Banner** — Shown to unauthenticated visitors

### Profile Redirect
**Route:** `/profile` — Redirects to `/profile/{username}` for the logged-in user

---

## 15. Social Features

### Following System
- **Follow/Unfollow** — Users can follow other users. Self-follow prevented by RLS check constraint.
- **Follower Count** — Displayed on public profiles
- **Following Feed** — Explore page "From Creators You Follow" carousel
- **Follow Notification** — DB trigger creates notification when followed

### Favorites
- **Heart Toggle** — On TripCard, adds/removes from `favorites` table
- **Saved Trips** — Displayed on Dashboard
- **Total Favorites** — Tracked on trips table

### Reviews
- **Star Rating** (1-5) + optional comment
- **Inline Form** — On trip detail page for logged-in users (not trip creator)
- **Edit/Update** — Users can update their own review
- **Average Rating** — Auto-calculated via `recalculate_avg_rating` trigger on reviews INSERT/UPDATE/DELETE
- **Display** — Reviewer avatar, name, stars, comment

---

## 16. Notifications System

### In-App Notifications
- **NotificationBell** — Navbar component with unread count badge
- **Real-time** — Supabase Realtime subscription on `notifications` table
- **Dropdown** — Shows recent notifications with type icons, titles, messages, timestamps
- **Mark as Read** — Click notification to mark read and navigate to link
- **Mark All Read** — Button to clear all unread

### Notification Triggers (Database Functions)
| Trigger | Event | Notification |
|---------|-------|-------------|
| `notify_on_booking` | Booking confirmed | Creator gets "New booking! 🎉" |
| `notify_on_follow` | New follow | User gets "New follower! 👋" |
| `notify_on_review` | New review | Creator gets "New review ⭐" |

### ⚠️ INCOMPLETE: Email Notifications
> **Status:** Infrastructure built, email delivery NOT connected.  
> The `send-notification-email` Edge Function is deployed and can process booking confirmations, new follower, and new review events. However, it currently **only logs the email payloads** — actual email delivery requires integrating a transactional email service (e.g., Resend) with an API key.  
> **Action Required:** Connect a transactional email provider (Resend recommended). Add the API key as a secret. Update the Edge Function to call the provider's API for email delivery.

---

## 17. Leaderboard

**Route:** `/leaderboard`

### Tabs
1. **Most Booked** — Top 20 trips by `total_bookings` (descending)
2. **Top Rated** — Top 20 trips by `avg_rating` (descending)
3. **Most Saved** — Top 20 trips by `total_favorites` (descending)
4. **Top Creators** — Top 20 creator profiles by `total_earnings` (descending)

Each item shows rank number, trip/creator info, and relevant metric.

---

## 18. Sharing & Viral Growth

### Share Trip Modal (`ShareTripModal`)
Triggered from trip detail page. Responsive: Dialog on desktop, Drawer on mobile.

**Share Tab:**
- Trip preview card (cover image, title, destination, duration)
- Copy link button
- Platform share buttons: Twitter/X, WhatsApp, SMS, Email — with pre-written captions

**Creator Tools Tab** (only for trip creators):
- **Stats Grid** — Views, Link Clicks, Bookings, Earned
- **Referral Link** — Personalized `?ref=username` link for booking attribution
- **Ready-to-Post Captions** — Pre-written copy-paste captions for: Instagram, TikTok, X/Twitter, WhatsApp/Text. Each with copy button.

### Share Profile Modal (`ShareProfileModal`)
- Share link for the user's public profile
- Platform share buttons

### Viral Signup Banner (`ViralSignupBanner`)
- Shown on trip detail and public profile pages to unauthenticated visitors
- Encourages signup with CTA

### Referral Tracking
- `?ref=username` param on trip URLs stored in `sessionStorage`
- `referral_username` field on bookings table links bookings to referrers
- `trip_shares` table tracks which platforms trips are shared on

---

## 19. Onboarding

### Onboarding Checklist (`OnboardingChecklist`)
Displayed at top of Dashboard for users who haven't completed all steps.

**Steps tracked:**
1. ✅ Complete your profile (checks if `avatar_url` or `bio` exists)
2. ✅ Browse trips (checks if any trips exist in the database)
3. ✅ Try AI Planner (checks if user has any conversations)
4. ✅ Create your first trip (checks if user has created any trips)

**Behavior:**
- Dismissable via X button (stored in `localStorage`)
- Progress bar showing completion ratio
- Links to relevant pages for each step

### Welcome Modal (`WelcomeModal`)
Dialog shown to new users with 4 action cards:
- Explore Trips
- Plan with AI
- Complete Your Profile
- Become a Creator

---

## 20. Admin Dashboard

**Route:** `/admin` (protected, role-gated)

### Access Control
- Uses `has_role` security-definer function to check `admin` role
- Non-admins redirected to `/dashboard`
- Role stored in `user_roles` table (never on profiles)

### Features
- **Stats** — Total Users, Total Trips, Bookings, Revenue
- **Trips Tab** — All trips with publish/unpublish toggle, feature/unfeature toggle, delete button
- **Users Tab** — All profiles with creator badge, earnings
- **Bookings Tab** — All bookings with status, trip name, price

---

## 21. Email System

### Authentication Emails (Active ✅)
- Custom React Email templates via `auth-email-hook` Edge Function
- Sender domain: `notify.traviso.ai`
- 6 templates: signup, recovery, magic-link, invite, email-change, reauthentication
- Branded with Traviso logo and teal (#29A38B) styling
- Uses `@lovable.dev/webhooks-js` for signature verification
- Uses `@lovable.dev/email-js` for delivery via callback URL
- Email assets hosted in `email-assets` storage bucket (public)

### ⚠️ INCOMPLETE: Transactional Emails
> **Status:** Edge Function `send-notification-email` deployed but NOT sending emails.  
> **What's built:**  
> - Edge Function handles three event types: `booking_confirmation`, `new_follower`, `new_review`  
> - Fetches recipient email from auth.users via admin API  
> - Constructs subject line and body text  
> - Currently logs email payload (no delivery)  
>  
> **Action Required:**  
> 1. Choose a transactional email service (Resend recommended)  
> 2. Add `RESEND_API_KEY` as a secret  
> 3. Update the Edge Function to call Resend's API for actual email delivery  
> 4. Wire up database triggers or webhooks to invoke the function on booking/follow/review events  

### ⚠️ NOT BUILT: Weekly Digest
> **Status:** Not implemented.  
> **Recommendation:** Create a cron-triggered Edge Function that:  
> - Runs weekly via `pg_cron`  
> - Aggregates views, bookings, followers, and reviews for each creator  
> - Sends summary email via transactional email service  

---

## 22. Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (display_name, avatar, bio, socials, is_creator, earnings) | Select: all; Insert/Update: own |
| `trips` | Trip listings (title, destination, duration, price, tags, cover image, stats) | Select: published or own; Insert/Update/Delete: own |
| `trip_days` | Day-by-day breakdown for trips | Scoped to trip ownership/publication |
| `trip_activities` | Individual activities within days (type, title, description, price, location, time) | Scoped to trip ownership/publication |
| `bookings` | Booking records (dates, guests, price, commission, Stripe ID) | Insert/Select/Update: own |
| `favorites` | User's favorited trips | Insert/Select/Delete: own |
| `collections` | Named trip collections | Full CRUD: own |
| `collection_items` | Trips within collections | Select/Insert/Delete: via collection ownership |
| `reviews` | Star ratings + comments on trips | Select: all; Insert/Update/Delete: own |
| `follows` | Follower relationships | Select: all; Insert/Delete: own (self-follow prevented) |
| `conversations` | AI Planner chat sessions | Full CRUD: own |
| `messages` | Individual chat messages | Insert/Select: own |
| `notifications` | In-app notifications | Select/Update: own; Insert: own |
| `trip_views` | View tracking per trip | Insert: with valid trip; Select: trip creator |
| `trip_shares` | Share tracking per platform | Insert: with valid trip; Select: trip creator |
| `profile_views` | Profile view tracking | Insert: valid profile; Select: own profile |
| `hotel_inventory` | Hotel listings (destination, price, amenities, star rating) | Select: all (read-only) |
| `user_roles` | RBAC roles (admin, moderator, user) | Select: own (no client insert/update/delete) |

### Key Database Functions & Triggers
| Function | Trigger | Purpose |
|----------|---------|---------|
| `handle_new_user` | `auth.users` INSERT | Auto-creates profile + user_role |
| `enforce_trip_title_case` | `trips` INSERT/UPDATE | Title Case normalization |
| `update_trip_booking_stats` | `bookings` INSERT/UPDATE | Increment total_bookings/revenue on trips |
| `notify_on_booking` | `bookings` INSERT/UPDATE | Create booking notification |
| `notify_on_follow` | `follows` INSERT | Create follow notification |
| `notify_on_review` | `reviews` INSERT | Create review notification |
| `recalculate_avg_rating` | `reviews` INSERT/UPDATE/DELETE | Recalculate trip avg_rating |
| `update_updated_at_column` | Various | Auto-update timestamps |
| `has_role` | — (function, not trigger) | SECURITY DEFINER role check for RBAC |
| `to_title_case` | — | Immutable title case conversion |

---

## 23. Edge Functions (Backend)

| Function | Auth | Purpose |
|----------|------|---------|
| `ai-travel-planner` | JWT bypass (anon key in header) | Chat with Nala. Handles text (Lovable AI Gateway SSE) and image (Gemini direct API) requests |
| `extract-trip` | JWT verified | Extracts structured trip data from AI conversation, creates trip+days+activities in DB |
| `create-checkout-session` | JWT verified | Creates Stripe Checkout Session for trip booking |
| `auth-email-hook` | JWT bypass | Handles custom auth email rendering and delivery |
| `send-notification-email` | JWT bypass | Processes transactional email events (**⚠️ logs only, no delivery**) |
| `export-data` | — | Generates SQL export of all database tables for migration |
| `backfill-itineraries` | — | Utility for backfilling itinerary data |
| `generate-itinerary` | — | Generates itinerary content |

---

## 24. Security & RLS

### Row-Level Security
- All 17+ tables have RLS enabled
- Policies enforce user-scoped access (users can only CRUD their own data)
- Public data (published trips, profiles, reviews, follows) readable by all
- Admin access via `has_role()` SECURITY DEFINER function (never client-side checks)

### RBAC
- Roles stored in `user_roles` table (never on profiles)
- Available roles: `admin`, `moderator`, `user`
- Auto-assigned `user` role on signup
- Admin dashboard gated by `has_role(_user_id, 'admin')` check

### Auth Security
- Email verification required (not auto-confirmed)
- Passwords handled by Supabase Auth (bcrypt)
- JWT validation in Edge Functions via `getClaims()` (not `getUser()` — Deno compatibility)
- CORS headers on all Edge Functions

---

## 25. Design System

### Typography
- **Display Font:** Playfair Display (serif) — headings
- **Body Font:** DM Sans (sans-serif) — body text

### Colors (HSL)
| Token | Light Mode | Purpose |
|-------|-----------|---------|
| `--background` | 40 20% 98% | Page background (warm off-white) |
| `--foreground` | 220 25% 10% | Primary text (near-black navy) |
| `--accent` | 174 60% 40% | Primary brand color (teal) |
| `--sunset` | 25 95% 55% | Secondary accent (warm orange) |
| `--primary` | 220 60% 15% | Dark navy |
| `--muted` | 40 15% 94% | Subtle backgrounds |
| `--destructive` | 0 72% 51% | Error/delete actions |

### Dark Mode
Full dark mode support with inverted token values. Toggle via `next-themes`.

### Component Library
- Built on shadcn/ui (Radix primitives + Tailwind)
- Custom variants for buttons, badges, cards
- Responsive breakpoints: mobile-first design with `sm:`, `md:`, `lg:` prefixes

### Mobile Responsiveness
- 44px+ touch targets on all interactive elements
- Collapsible hamburger nav on mobile with icons
- Safe area inset respect for iOS (`pb-[env(safe-area-inset-bottom)]`)
- Stacked layouts on mobile, grid on desktop

---

## 26. SEO & Performance

### SEO
- Dynamic meta tags via `usePageSEO` hook (title, description, OG image, canonical URL)
- OG image: `/og-image.png`
- Robots.txt: `/robots.txt`
- Semantic HTML (single H1 per page)
- Alt text on all images

### Performance
- Lazy loading on trip card images (`loading="lazy"`)
- Image fallback system for broken cover images
- Skeleton loading states for data-fetching pages
- Framer Motion animations (GPU-accelerated)
- Code splitting via React Router lazy routes

---

## 27. Static Pages

| Route | Purpose |
|-------|---------|
| `/about` | About Traviso AI |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/404` | Not Found page |

---

## 28. Known Gaps & Future Work

### 🔴 Critical (Revenue-Impacting)

| Item | Status | Notes |
|------|--------|-------|
| **Transactional email delivery** | ⚠️ Infrastructure only | Edge Function logs payloads but doesn't send. Need Resend API key integration. |
| **Weekly digest emails** | ❌ Not built | Need cron job + email service for creator engagement. |
| **Booking confirmation emails to travelers** | ❌ Not built | Travelers don't receive email confirmation after payment. |

### 🟡 Important (Engagement/Growth)

| Item | Status | Notes |
|------|--------|-------|
| **Push notifications** | ❌ Not built | Service worker + web push for real-time alerts. |
| **Trip search by location radius** | ❌ Not built | Currently text-only search. PostGIS or geocoding API needed. |
| **Creator payout system** | ❌ Not built | Stripe Connect for automated creator payouts. Commission tracking exists but no disbursement. |
| **Booking management for creators** | ❌ Limited | Creators see booking notifications but can't manage/confirm/cancel individual bookings. |
| **Trip collaboration** | ❌ Not built | Multiple users editing a trip together. |
| **Trip versioning/history** | ❌ Not built | No edit history or rollback capability. |

### 🟢 Nice-to-Have (Polish)

| Item | Status | Notes |
|------|--------|-------|
| **Image gallery per trip** | ❌ Not built | Only single cover image supported. |
| **Multi-currency support** | ❌ Not built | Everything in USD currently. |
| **Localization (i18n)** | ❌ Not built | English only. |
| **Accessibility audit** | ⚠️ Partial | Semantic HTML but no comprehensive a11y testing. |
| **Social proof on homepage** | ❌ Not built | No animated counters, testimonials, or trust badges. |
| **Creator verification/badges** | ❌ Not built | No verified creator program. |
| **Trip templates** | ❌ Not built | Pre-built itinerary templates for common destinations. |
| **Mobile app (PWA)** | ❌ Not built | Web-only. Service worker for offline support not implemented. |
| **Advanced analytics** | ⚠️ Basic | 30-day charts exist. No cohort analysis, conversion funnels, or attribution. |
| **A/B testing infrastructure** | ❌ Not built | No feature flags or experimentation framework. |

### 🔧 Technical Debt

| Item | Notes |
|------|-------|
| Leaked password protection | Supabase linter warning — should be enabled in auth settings |
| `any` types in components | Several components use `any` for Supabase query results |
| Large file refactoring | Dashboard.tsx, AiPlanner.tsx, and PublicProfile.tsx are 200-450 lines |
| Test coverage | Only 1 example test file exists. No unit/integration/e2e tests. |

---

## 29. Glossary

| Term | Definition |
|------|-----------|
| **Nala** | AI travel planning assistant (named after a mini golden doodle) |
| **Creator** | User with `is_creator = true` who can publish trips to the marketplace |
| **Creator Studio** | 3-step trip creation wizard |
| **Package Booking** | All-inclusive trip booking model (flights + hotels + activities bundled) |
| **Referral Link** | `?ref=username` URL parameter for tracking booking attribution |
| **Commission** | Percentage of booking price earned by creator (default 10%) |
| **Trip View** | Tracked page visit to a trip detail page |
| **Collection** | User-created folder for organizing saved trips |

---

*This document reflects the current state of the Traviso AI platform as of March 9, 2026. Items marked with ⚠️ require additional implementation work before they are production-ready.*
