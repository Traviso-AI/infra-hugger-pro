# Traviso AI — Product Requirements Document (PRD)

**Version:** 2.0  
**Updated:** March 10, 2026  
**Platform:** Web Application (React + Vite + TypeScript)  
**Live URL:** https://traviso.lovable.app  
**Backend:** Lovable Cloud (Supabase)  
**Payments:** Stripe  
**AI Models:** Google Gemini (via Lovable AI Gateway)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [User Personas](#3-user-personas)
4. [Feature Map (Quick Reference)](#4-feature-map-quick-reference)
5. [Authentication & Accounts](#5-authentication--accounts)
6. [Homepage](#6-homepage)
7. [Explore Marketplace](#7-explore-marketplace)
8. [Trip Detail Page](#8-trip-detail-page)
9. [AI Trip Planner (Nala)](#9-ai-trip-planner-nala)
10. [Creator Studio](#10-creator-studio)
11. [Booking & Payments](#11-booking--payments)
12. [Group Planning](#12-group-planning)
13. [Dashboard & Analytics](#13-dashboard--analytics)
14. [My Trips](#14-my-trips)
15. [Collections](#15-collections)
16. [User Profiles](#16-user-profiles)
17. [Social Features](#17-social-features)
18. [Notifications](#18-notifications)
19. [Leaderboard](#19-leaderboard)
20. [Sharing & Viral Growth](#20-sharing--viral-growth)
21. [Onboarding](#21-onboarding)
22. [Admin Dashboard](#22-admin-dashboard)
23. [Email System](#23-email-system)
24. [Internationalization (i18n)](#24-internationalization-i18n)
25. [Mobile App (Install Page)](#25-mobile-app-install-page)
26. [Database Schema](#26-database-schema)
27. [Edge Functions](#27-edge-functions)
28. [Security & RLS](#28-security--rls)
29. [Design System](#29-design-system)
30. [SEO & Performance](#30-seo--performance)
31. [Third-Party Integrations](#31-third-party-integrations)
32. [Follow-Up Items & Roadmap](#32-follow-up-items--roadmap)
33. [Glossary](#33-glossary)

---

## 1. Executive Summary

Traviso AI is an AI-powered travel planning platform and creator marketplace. Users plan trips via an AI assistant (Nala), browse curated itineraries published by travel creators, book all-inclusive packages via Stripe, and collaborate with friends on group trips. Creators earn commissions when others book their itineraries.

**Core value proposition:** "Plan it, book it, and get paid when others follow your lead."

---

## 2. Product Vision

### Tagline
"The trip finally made it out of the group chat."

### Three Pillars
1. **AI Trip Builder** — Describe a trip idea, paste a TikTok/Instagram link, or upload a group chat screenshot → Nala generates a complete itinerary.
2. **Creator Marketplace** — Travel creators publish curated trip packages that anyone can browse, book, and review.
3. **Earn as a Creator** — Creators earn commission (default 10%) on every booking. Referral tracking via `?ref=username` links.

---

## 3. User Personas

| Persona | Description | Key Actions |
|---------|-------------|-------------|
| **Traveler** | End-user seeking trip inspiration and bookable itineraries | Browse, search, book, favorite, review, use AI planner, join group plans |
| **Creator** | Travel influencer or enthusiast monetizing expertise | Create trips via Creator Studio, share referral links, track analytics, earn commissions |
| **Admin** | Platform operator managing content and users | Moderate trips, feature/unfeature, manage users, view revenue |

---

## 4. Feature Map (Quick Reference)

| Category | Features | Status |
|----------|----------|--------|
| **AI** | Chat with Nala, image/file upload, social link scraping, comparison mode, save-as-trip, streaming responses | ✅ Live |
| **Marketplace** | Explore page, search, filters, sort, map view, pagination, "From Creators You Follow" carousel | ✅ Live |
| **Trips** | Detail page, itinerary viewer, photo gallery, activity map, live trip tracker, reviews | ✅ Live |
| **Booking** | Package pricing, animated breakdown, Stripe Checkout, booking success, commission tracking | ✅ Live |
| **Group Planning** | Start group, invite via email/link, members tab, real-time chat, activity voting, cost splitting | ✅ Live |
| **Creator Tools** | Creator Studio (3-step wizard), AI itinerary generation, edit trip, analytics dashboard | ✅ Live |
| **Social** | Follow/unfollow, favorites, collections, reviews, sharing (7 platforms), viral signup banner | ✅ Live |
| **Profiles** | Public profiles, avatar upload, social links (5 platforms), verified/top creator badges, edit dialog | ✅ Live |
| **Notifications** | In-app real-time (booking, follow, review, group message), notification bell with unread count | ✅ Live |
| **Leaderboard** | Most Booked, Top Rated, Most Saved, Top Creators | ✅ Live |
| **Admin** | Stats, trip moderation, user management, booking overview | ✅ Live |
| **Auth** | Email/password signup, Google OAuth, forgot/reset password, email verification, custom branded emails | ✅ Live |
| **i18n** | Language switcher (30 languages listed), English translations only | ⚠️ Partial |
| **Email Notifications** | Edge Function built, NOT delivering | ⚠️ Not Connected |
| **Mobile App** | Install page (coming soon), PWA not implemented | ⚠️ Placeholder |
| **Hotel API (RateHawk)** | Not integrated | ❌ Not Built |
| **Creator Payouts (Stripe Connect)** | Not integrated | ❌ Not Built |
| **Flight API** | Not integrated | ❌ Not Built |

---

## 5. Authentication & Accounts

### Methods
- **Email + Password** — Signup with email verification required (NOT auto-confirmed)
- **Google OAuth** — Via Lovable Cloud managed social login
- **Forgot Password** — Email reset link → `/reset-password`

### Auto-provisioning (Database Triggers)
- `handle_new_user()` → Creates `profiles` row (display name, avatar, auto-generated username)
- `handle_new_user()` → Assigns `user` role in `user_roles`

### Routes
| Route | Purpose |
|-------|---------|
| `/login` | Email/password + Google login |
| `/signup` | Full name + email/password + Google signup |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password via email link |

### Custom Auth Emails
- 6 templates: signup confirmation, recovery, magic link, invite, email change, reauthentication
- Branded with Traviso teal (#29A38B) and horizontal logo
- Delivered via `auth-email-hook` Edge Function using `@lovable.dev/email-js`

---

## 6. Homepage

**Route:** `/`

| Section | Details |
|---------|---------|
| **Hero** | Full-bleed travel photo, gradient overlay, tagline, two CTAs ("Plan with AI" / "Explore Trips"), floating animated trip cards (desktop) |
| **Value Props** | 3-column grid: AI Trip Builder, Creator Marketplace, Earn as a Creator |
| **Trending Trips** | Top 6 published trips by booking count. Empty state encourages early creator adoption |
| **CTA Section** | Dark navy background, "Ready to share your travel expertise?" |

All sections use Framer Motion fade-in / scroll-triggered animations.

---

## 7. Explore Marketplace

**Route:** `/explore`

### Search & Discovery
- **Search Autocomplete** — Mapbox Geocoding API for destination suggestions. Trending destinations dropdown (8 curated) with thumbnail photos. Debounced 250ms.
- **Filter Bar** — Duration range, tags (multi-select overlap), traveler types, sort options (Most Popular, Newest, Top Rated, Duration Short/Long)
- **View Toggle** — Grid view (default) or Map view (`ExploreMap` with Mapbox GL)
- **"From Creators You Follow"** — Horizontal carousel with infinite loop scroll, arrow navigation, fade hints. Only shown when logged in & following creators.
- **Trending Trips** — Paginated grid (21 per page) with smart pagination UI (ellipsis)

### Trip Card Component
Displays: cover image, destination, title, duration, rating, bookings/"New" badge, tags (up to 3), creator name + avatar, "Get Price →" CTA, heart (favorite) toggle, folder (add to collection) button.

---

## 8. Trip Detail Page

**Route:** `/trip/:id`

### Content
- **Photo Gallery** — Cover + activity images in responsive grid. Full-screen lightbox viewer with navigation.
- **Trip Metadata** — Title, destination, duration, avg rating, total bookings, tags, description
- **Day-by-Day Itinerary** — Activities with type icons (✈️🏨🍽️🏃🎵🚌), title, description, location, time, price. Activity voting (thumbs up/down) for group members.
- **Activity Map** — Mapbox GL map plotting all activities with location data, numbered markers
- **Live Trip Tracker** — For users with active bookings: checklist-style progress through each day's activities with completion tracking
- **Reviews** — Star ratings + comments. Inline review form (not for trip creator). Edit/delete own reviews.
- **Booking Sidebar** (sticky desktop) — Price, "Check Availability →", share button, creator card
- **Group Planning Panel** — Collapsible sidebar module (see Section 12)

### Tracking & Attribution
- **View Tracking** — Inserts into `trip_views` (deduped by 30-min window per viewer via DB trigger)
- **Referral Handling** — `?ref=username` stored in `sessionStorage`, applied to bookings
- **Invite Handling** — `?invite=token` auto-accepts group collaboration invite

### SEO
- Dynamic meta tags (title, description, OG image) via `usePageSEO` hook

---

## 9. AI Trip Planner (Nala)

**Route:** `/ai-planner`

### Persona
Nala is a conversational AI travel assistant named after a mini golden doodle 🐾. Warm, playful, knowledgeable tone.

### Chat Features
| Feature | Details |
|---------|---------|
| **Streaming Responses** | SSE token streaming with Markdown rendering via `react-markdown` |
| **File Upload** | Images (JPG/PNG) and text files (TXT), up to 10MB. Images uploaded to `trip-images` storage bucket. |
| **Group Chat Screenshot → Itinerary** | Upload a screenshot of a group chat; Nala reads it via Gemini vision and builds an itinerary |
| **Social Link Scraping** | Paste TikTok, Instagram, YouTube, Twitter, Reddit, or blog URLs. TikTok uses oEmbed API; others use Firecrawl connector. Fallback: asks user to describe content if scraping fails. |
| **Comparison Mode** | Shopping intents (e.g. "find me hotels in Tulum") trigger structured comparison cards with name, price, rating, pros/cons. Rendered via `ComparisonCard` component. |
| **Save as Trip** | Extracts structured data from conversation via `extract-trip` Edge Function → creates trip + days + activities → redirects to trip detail |
| **Conversation Persistence** | Saved to `conversations` + `messages` tables. History drawer to switch/delete past conversations. |
| **Suggested Prompts** | Pre-built suggestions on empty chat state |

### Nala Floating Bubble
- Appears as a FAB (bottom-right) on pages without sidebar conflicts
- Mini chat widget with 2 free messages for unauthenticated users, then signup gate
- Hidden on `/trip/*`, `/ai-planner`, `/booking` routes

### Backend
- `ai-travel-planner` — Gemini for image messages (direct API with base64), Lovable AI Gateway for text (SSE streaming)
- `extract-trip` — Lovable AI Gateway (google/gemini-3-flash-preview) → parses JSON → inserts trip+days+activities
- `scrape-social` — TikTok oEmbed + Firecrawl connector for other platforms

---

## 10. Creator Studio

**Route:** `/create-trip` (create), `/edit-trip/:id` (edit)

### Creator Gate
Non-creators see a gate: "Enable Creator Mode" → sets `is_creator = true`. Grants Creator badge on profile.

### 3-Step Wizard
1. **Trip Basics** — Title (3+ chars, Title Case via DB trigger), destination (Mapbox autocomplete), description (20+ chars), duration (1-30 days), price estimate, tags (multi-select), cover image upload
2. **Build Itinerary** — Day-by-day builder. Each day: title, description, activities. Each activity: type (hotel/activity/restaurant/event/flight/transport, lowercase enforced), title (required), description, location. "Generate with AI" button.
3. **Preview & Publish** — Full preview, publish checklist, "Save Draft" or "Publish Trip"

### Success Screen
Animated celebration with link to view trip and sharing options.

---

## 11. Booking & Payments

**Route:** `/booking/:tripId`

### Flow
1. Select dates (future only) + guests (1-6)
2. "Calculate Price →" triggers animated loading sequence (contextual to trip content: flights, hotels, experiences)
3. Itemized price breakdown by activity type with per-item pricing
4. "Confirm & Book →" redirects to Stripe Checkout

### Pricing
- Uses actual `price_estimate` from each activity
- Fallback: deterministic hash-based pricing (flights $280-480, hotels $120-270, restaurants $25-75, etc.)
- Total = Σ activity prices × guests

### Stripe Integration
- `create-checkout-session` Edge Function → Stripe Checkout Session
- Success: `/booking/success` → upserts booking (idempotent via `stripe_payment_id`)
- Commission calculated (default 10%)
- DB triggers auto-update `total_bookings` and `total_revenue` on trips table + creator notification

---

## 12. Group Planning

Accessible via "Plan with Friends" panel on any trip detail page.

### Architecture
- **Organizer Model** — User who starts group is the organizer
- **Invite Methods** — Email invite or shareable link (reusable token per group)
- **Invite Acceptance** — `?invite=token` URL param auto-joins user to group

### Three Tabs
| Tab | Features |
|-----|----------|
| **Members** | Organizer (👑), joined members, pending invites. Invite by email or link. Remove members. |
| **Chat** | Real-time group messaging via Supabase Realtime on `group_messages` table. Sender names, timestamps. |
| **Costs** | "Book first, split after" model. Organizer sets amounts per member. "Settle Up" external tracking. |

### Activity Voting
- Group members can thumbs-up/down individual activities in the itinerary
- Votes displayed as colored badges with counts
- Powered by `activity_votes` table with realtime subscription

### Notifications
- Group message trigger sends notifications to all other group members

---

## 13. Dashboard & Analytics

**Route:** `/dashboard` (protected)

### Sections
- **Onboarding Checklist** — Progress tracker (profile, browse, AI planner, create trip)
- **Quick Stats** — Published Trips, Total Bookings, Revenue, My Bookings
- **Creator Analytics** — 30-day summary cards (Views, Bookings, Revenue, Followers) + interactive charts (Area/Bar via Recharts) with Views/Bookings/Revenue tabs
- **My Groups** — Active group planning sessions with deep-links to trip pages
- **Install App CTA** — Banner linking to `/install`

---

## 14. My Trips

**Route:** `/my-trips` (protected, top-level nav link)

### Four Tabs
| Tab | Content |
|-----|---------|
| **Calendar** | Visual month-view calendar showing booked trips (teal dots) and group plans (blue dots). Click day to see events. Upcoming trips sidebar. |
| **My Trips** | All created trips with Published/Draft badges, Publish/Edit actions |
| **Bookings** | Confirmed bookings with status, dates, price |
| **Saved** | Favorited trips as TripCard grid with "Add to Collection" button |

---

## 15. Collections

**Route:** `/collections` (protected)

- **Create** — Name + optional description via dialog
- **Browse** — Grid of folder cards with share + delete actions
- **View Collection** — TripCard grid of trips in that collection
- **Add to Collection** — Modal from any TripCard (folder icon). Shows collections with checkmarks for already-added. Inline "New Collection" creation.
- **Share Collection** — Dialog with copy link, WhatsApp, X/Twitter, Email, native share
- **Delete** — Confirmation dialog. Cascades to collection items.

---

## 16. User Profiles

### Public Profile (`/profile/:username`)
- Large avatar, display name, Creator badge, Verified badge (3+ published trips), Top Creator badge (top 10 leaderboard)
- Username, bio, social links (website, Instagram, X/Twitter, TikTok, WhatsApp)
- Stats: Trips Created, Trips Taken, Followers, Leaderboard Rank
- Follow/Unfollow button (self-follow prevented)
- Share Profile modal
- Tabs: "Trips Created" (published) + "Trips Taken" (from confirmed bookings, deduplicated)
- Profile view tracking

### Edit Profile (Dialog)
- Avatar upload (to `avatars` bucket, max 5MB)
- Display name, bio, website, Instagram, Twitter, TikTok, WhatsApp
- Creator Mode toggle
- Save → refreshes profile context

### Profile Redirect
`/profile` → redirects to `/profile/{username}` for logged-in user

---

## 17. Social Features

| Feature | Details |
|---------|---------|
| **Following** | Follow/unfollow users. Self-follow prevented by RLS. Follower count on profiles. "From Creators You Follow" on Explore. |
| **Favorites** | Heart toggle on TripCards → `favorites` table. Displayed in My Trips "Saved" tab. |
| **Reviews** | 1-5 star rating + optional comment. Inline form on trip detail (not for creator). Edit/delete own. Avg rating auto-recalculated via DB trigger. |
| **Collections** | Organize saved trips into themed folders (see Section 15) |

---

## 18. Notifications

### In-App (Real-time)
- **NotificationBell** — Navbar component with unread count badge
- **Supabase Realtime** subscription on `notifications` table
- **Dropdown** — Recent notifications with type icons, messages, timestamps
- **Mark as Read** — Click notification or "Mark All Read" button

### Triggers (Database Functions)
| Trigger | Event | Message |
|---------|-------|---------|
| `notify_on_booking` | Booking confirmed | "New booking! 🎉" to creator |
| `notify_on_follow` | New follow | "New follower! 👋" to user |
| `notify_on_review` | New review | "New review ⭐" to creator |
| `notify_on_group_message` | Group chat message | "New group message 💬" to all other members |

---

## 19. Leaderboard

**Route:** `/leaderboard`

| Tab | Ranked By | Limit |
|-----|-----------|-------|
| Most Booked | `total_bookings` desc | Top 20 |
| Top Rated | `avg_rating` desc | Top 20 |
| Most Saved | `total_favorites` desc | Top 20 |
| Top Creators | `total_earnings` desc | Top 20 |

---

## 20. Sharing & Viral Growth

### Share Trip Modal (`ShareTripModal`)
Responsive (Dialog desktop / Drawer mobile). Two tabs:

**Share Tab:**
- Trip preview card (cover, title, destination, duration)
- Copy link, native share buttons: X, Facebook, WhatsApp, iMessage, Instagram, TikTok, Email
- Instagram/TikTok → copies pre-written caption to clipboard with toast

**Creator Tools Tab** (trip owner only):
- Stats: Views, Link Clicks, Bookings, Revenue
- Referral link: `?ref=username` for booking attribution
- Ready-to-post captions for Instagram, TikTok, X/Twitter, WhatsApp/Text

### Share Profile Modal
- Share link, platform buttons

### Share Collection Modal
- Copy link, WhatsApp, X/Twitter, Email, native share

### Viral Signup Banner
- Shown on trip detail & public profile pages to unauthenticated visitors

### Referral Tracking
- `?ref=username` → `sessionStorage` → `referral_username` on bookings
- `trip_shares` table tracks platform shares

---

## 21. Onboarding

### Checklist (`OnboardingChecklist`)
Dashboard widget tracking 4 steps:
1. Complete profile (avatar or bio exists)
2. Browse trips (any published trips exist)
3. Try AI Planner (user has conversations)
4. Create first trip (user has created trips)

Dismissable (localStorage). Progress bar. Links to relevant pages.

### Welcome Modal
4 action cards: Explore Trips, Plan with AI, Complete Profile, Become a Creator.

---

## 22. Admin Dashboard

**Route:** `/admin` (protected, role-gated via `has_role('admin')`)

| Section | Features |
|---------|----------|
| Stats | Total Users, Total Trips, Bookings, Revenue |
| Trips Tab | All trips with publish/unpublish, feature/unfeature, delete (with confirmation) |
| Users Tab | All profiles with creator badge, earnings |
| Bookings Tab | All bookings with status, trip name, price |

---

## 23. Email System

### ✅ Authentication Emails (Active)
- Custom React Email templates via `auth-email-hook` Edge Function
- 6 templates: signup, recovery, magic-link, invite, email-change, reauthentication
- Branded with Traviso logo, teal styling
- Delivered via `@lovable.dev/email-js` callback

### ⚠️ Transactional Emails (NOT Connected)
- `send-notification-email` Edge Function handles: `booking_confirmation`, `new_follower`, `new_review`
- Currently **logs payloads only** — no email delivery
- **Needs:** Transactional email service (Resend recommended) + API key

### ❌ Weekly Digest (Not Built)
- Creator engagement summaries (views, bookings, followers, reviews)
- **Needs:** Cron job + email service

---

## 24. Internationalization (i18n)

### Current State
- **Framework:** i18next + react-i18next + browser language detector
- **Language Switcher:** UI component in navbar supporting 30 languages
- **Translations:** Only English (`en.json`) has translations. All other languages fall back to English.
- **Supported Languages (UI listed):** English, Spanish, French, Portuguese, German, Italian, Dutch, Russian, Polish, Swedish, Turkish, Chinese, Japanese, Korean, Arabic, Hindi, Thai, Vietnamese, Indonesian, Malay, Filipino, Ukrainian, Greek, Hebrew, Danish, Finnish, Norwegian, Czech, Romanian, Hungarian

### ⚠️ Follow-Up
- Professional translations needed for all non-English languages
- Not all strings are wrapped in `t()` calls yet

---

## 25. Mobile App (Install Page)

**Route:** `/install`

- **Status:** Coming Soon placeholder page
- Shows iOS/Android icons, 6 feature cards (offline itineraries, smart notifications, etc.)
- "Notify Me at Launch" button (currently client-side only, no backend persistence)
- **PWA:** `vite-plugin-pwa` is installed as a dependency but service worker is NOT configured

---

## 26. Database Schema

### Tables (17)

| Table | Purpose | Key RLS |
|-------|---------|---------|
| `profiles` | User profiles | Select: all; Insert/Update: own |
| `trips` | Trip listings | Select: published or own; CUD: own |
| `trip_days` | Day-by-day breakdown | Scoped to trip |
| `trip_activities` | Activities within days | Scoped to trip |
| `bookings` | Booking records | Own only |
| `favorites` | Favorited trips | Own only |
| `collections` | Named trip collections | Own only |
| `collection_items` | Trips in collections | Via collection ownership |
| `reviews` | Ratings + comments | Select: all; CUD: own |
| `follows` | Follower relationships | Select: all; Insert/Delete: own |
| `conversations` | AI chat sessions | Own only |
| `messages` | Chat messages | Own only |
| `notifications` | In-app notifications | Own only |
| `trip_views` | View tracking | Insert: valid trip; Select: creator |
| `trip_shares` | Share tracking | Insert: valid trip; Select: creator |
| `profile_views` | Profile view tracking | Insert: valid profile; Select: own |
| `hotel_inventory` | Hotel listings (read-only) | Select: all |
| `user_roles` | RBAC roles | Select: own only |
| `group_organizers` | Group planning organizers | Select: all (auth); Insert/Delete: own |
| `group_messages` | Group chat messages | Scoped to group membership |
| `trip_collaborators` | Group members/invites | Scoped to involvement |
| `activity_votes` | Activity voting | Scoped to trip participation |
| `payment_splits` | Cost splitting | Scoped to trip owner/participants |

### Key Functions & Triggers
| Function | Purpose |
|----------|---------|
| `handle_new_user` | Auto-create profile + assign user role on signup |
| `enforce_trip_title_case` | Title Case normalization on trips |
| `update_trip_booking_stats` | Increment booking count & revenue |
| `recalculate_avg_rating` | Recalculate avg rating on review changes |
| `notify_on_booking/follow/review` | Create in-app notifications |
| `notify_on_group_message` | Notify group members of new messages |
| `deduplicate_trip_view` | Skip duplicate views within 30 min |
| `has_role` | SECURITY DEFINER role check for RBAC |
| `to_title_case` | Immutable title case conversion |

---

## 27. Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `ai-travel-planner` | Chat with Nala (text via Lovable AI Gateway SSE, images via Gemini direct) | Anon key |
| `extract-trip` | Extract structured trip from AI conversation → insert to DB | JWT |
| `create-checkout-session` | Create Stripe Checkout Session | JWT |
| `auth-email-hook` | Custom auth email rendering & delivery | Bypass |
| `send-notification-email` | Transactional emails (⚠️ logs only) | Bypass |
| `scrape-social` | TikTok oEmbed + Firecrawl scraping for social links | Anon key |
| `generate-itinerary` | AI itinerary generation for Creator Studio | — |
| `backfill-itineraries` | Utility for backfilling itinerary data | — |
| `export-data` | SQL export of all tables | — |

---

## 28. Security & RLS

- **All tables** have RLS enabled with user-scoped policies
- **Public data:** Published trips, profiles, reviews, follows readable by all
- **RBAC:** Roles in `user_roles` table (admin/moderator/user), checked via `has_role()` SECURITY DEFINER function
- **Auth:** Email verification required, passwords via Supabase Auth (bcrypt), JWT validation in Edge Functions
- **CORS:** Headers on all Edge Functions

---

## 29. Design System

### Typography
- **Display:** Playfair Display (serif) — headings
- **Body:** DM Sans (sans-serif) — body text

### Colors (HSL)
| Token | Value | Purpose |
|-------|-------|---------|
| `--accent` | 174 60% 40% | Primary brand (teal) |
| `--sunset` | 25 95% 55% | Secondary (warm orange) |
| `--primary` | 220 60% 15% | Dark navy |
| `--background` | 40 20% 98% | Warm off-white |
| `--foreground` | 220 25% 10% | Near-black navy |
| `--destructive` | 0 72% 51% | Error/delete |

### UI Framework
- shadcn/ui (Radix + Tailwind), custom variants
- Full dark mode via `next-themes`
- Mobile-first responsive (44px+ touch targets, collapsible nav, safe area insets)
- Framer Motion for all animations

---

## 30. SEO & Performance

- Dynamic meta tags via `usePageSEO` (title, description, OG image, canonical)
- Semantic HTML, single H1, alt text on images
- Skeleton loading states for all data pages
- Lazy loading on trip card images
- Image fallback system for broken covers
- Destination-specific cover generation via `destination-covers.ts`

---

## 31. Third-Party Integrations

| Service | Usage | Status |
|---------|-------|--------|
| **Mapbox** | Destination autocomplete (Geocoding API), explore map view, activity maps | ✅ Active |
| **Stripe** | Payment processing via Checkout Sessions | ✅ Active |
| **Google Gemini** | AI chat (vision + text), trip extraction, itinerary generation | ✅ Active (via Lovable AI Gateway) |
| **Firecrawl** | Social media content scraping (YouTube, blogs, etc.) | ✅ Connected (connector) |
| **TikTok oEmbed** | Free metadata extraction for TikTok links | ✅ Active |
| **Supabase Realtime** | Live notifications, group chat, collaborator updates | ✅ Active |
| **RateHawk** | Hotel/flight inventory API | ❌ Not Integrated |
| **Resend** | Transactional email delivery | ❌ Not Integrated |
| **Stripe Connect** | Creator payout disbursement | ❌ Not Integrated |

---

## 32. Follow-Up Items & Roadmap

### 🔴 Critical (Revenue-Impacting)

| Item | Status | What's Needed |
|------|--------|---------------|
| **RateHawk Integration** | ❌ Not built | Real hotel/flight inventory API to replace mock pricing. Would provide actual availability, real prices, and booking confirmation. Need API key + Edge Function + booking flow integration. |
| **Creator Payouts (Stripe Connect)** | ❌ Not built | Automated commission disbursement to creators. Currently tracking commissions but no way to pay out. Need Stripe Connect onboarding flow + payout logic. |
| **Transactional Email Delivery** | ⚠️ Infra only | `send-notification-email` Edge Function logs but doesn't send. Need Resend API key → update function to call Resend API. |
| **Booking Confirmation Emails** | ❌ Not built | Travelers don't receive email after payment. Depends on transactional email. |

### 🟡 Important (Engagement/Growth)

| Item | Status | What's Needed |
|------|--------|---------------|
| **i18n Translations** | ⚠️ Framework only | Professional translations for 29 non-English languages. Many strings not yet wrapped in `t()`. |
| **Weekly Digest Emails** | ❌ Not built | Cron-triggered Edge Function for creator engagement summaries. |
| **Push Notifications** | ❌ Not built | Service worker + web push for real-time alerts. |
| **PWA / Service Worker** | ⚠️ Plugin installed | `vite-plugin-pwa` dependency exists but no service worker configured. |
| **Install Page Backend** | ⚠️ Placeholder | "Notify Me" button is client-side only, doesn't persist to DB. |
| **Shared Collection Page** | ❌ Not built | `/collections/shared/:id` route doesn't exist — shared links lead to 404. Need public collection view page. |
| **Trip Collaboration** | ❌ Not built | Multiple creators editing a trip together. |
| **Booking Management** | ❌ Limited | Creators see notifications but can't manage/confirm/cancel bookings. |
| **Trip Search by Location** | ❌ Not built | Currently text-only. PostGIS or geocoding-based radius search. |

### 🟢 Nice-to-Have (Polish)

| Item | Status | Notes |
|------|--------|-------|
| **Multi-currency** | ❌ | Everything in USD |
| **Trip Templates** | ❌ | Pre-built itinerary templates for popular destinations |
| **Social Proof (Homepage)** | ❌ | Animated counters, testimonials, trust badges |
| **Creator Verification Program** | ❌ | Manual verification beyond auto-badges |
| **Advanced Analytics** | ⚠️ Basic | No cohort analysis, conversion funnels, or attribution |
| **A/B Testing** | ❌ | No feature flags or experimentation |
| **Accessibility Audit** | ⚠️ Partial | Semantic HTML but no comprehensive a11y testing |

### 🔧 Technical Debt

| Item | Notes |
|------|-------|
| `any` types | Several components use `any` for Supabase query results |
| Large files | `GroupPlanning.tsx` (968 lines), `AiPlanner.tsx` (573 lines), `PublicProfile.tsx` (504 lines), `MyTrips.tsx` (438 lines) need refactoring |
| Test coverage | Minimal — only a few test files exist |
| Leaked password protection | Supabase linter warning — should be enabled |

---

## 33. Glossary

| Term | Definition |
|------|-----------|
| **Nala** | AI travel planning assistant (named after a mini golden doodle) |
| **Creator** | User with `is_creator = true` who can publish trips |
| **Creator Studio** | 3-step trip creation wizard |
| **Package Booking** | All-inclusive trip booking model |
| **Referral Link** | `?ref=username` URL parameter for booking attribution |
| **Commission** | Percentage of booking price earned by creator (default 10%) |
| **Collection** | User-created folder for organizing saved trips |
| **Organizer** | User who initiates a group planning session |
| **Comparison Mode** | AI feature that returns structured option cards for shopping-intent queries |
| **Live Trip Tracker** | Checklist-style progress tracker for active bookings |

---

*This document reflects the current state of the Traviso AI platform as of March 10, 2026.*
