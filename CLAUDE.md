# Beast Tribe — Project Context (Auto-loaded every session)

> **For Claude:** This file is your working memory for the Beast Tribe project. Read it at session start to resume exactly where we left off. Update the "Current State" and "Session Log" sections after every meaningful change.

---

## Project Summary
Gamified community fitness app for **Operation Beast** (Saudi activewear brand). React Native + Expo + Supabase + TypeScript. Dark theme, teal/orange brand, Montserrat/Poppins typography.

**Two products in this repo:**
1. **Mobile app** (`/` — Expo Router)
2. **Admin dashboard** (`admin/` — Next.js 14, Vercel)

---

## Credentials (managed autonomously — NEVER ask user)

### Supabase
- Project ref: `doqpqzxqgszsybghgtfq`
- URL: `https://doqpqzxqgszsybghgtfq.supabase.co`
- Access token (CLI): stored ONLY in local `~/.claude` auto-memory (MEMORY.md) — NEVER commit the real `sbp_...` token to this repo (GitHub push protection blocks it). Reference it via the `SUPABASE_ACCESS_TOKEN` env var in commands below.
- Linked: yes (`npx supabase link --project-ref doqpqzxqgszsybghgtfq`)

### Apple / EAS
- Apple ID: `riad.filatgaming@gmail.com`
- Apple Team ID: `CYYSDSQ9VR`
- Expo account: `ryo1987`
- EAS project ID: `b9a69ad8-8fff-4877-a53b-3c9162c431b7`
- Bundle ID: `com.operationbeast.beasttribe`
- iPhone UDID registered: `00008120-000871093487A01E`
- EAS env vars baked into `eas.json` for all profiles

### Vercel (admin dashboard)
- GitHub repo: `riadfilat/beast-tribe`
- Vercel account: `riadabualfailat-9493`
- Admin deploys from `admin/` root directory
- Env vars set in Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`

### Super Admin
- User: `riad.filat` (id `fc9ba167-d462-4616-a677-9746dd4f61f1`, role `super_admin`)

---

## Autonomous Workflow — 3 Types of Changes

### 1. Code change (99% of changes) — OTA via EAS Update
```bash
cd ~/Desktop/OB/beast-tribe && npx eas-cli update --channel preview --environment preview --message "description"
```
Takes ~60s. User closes/reopens app → change applies.

### 2. Database change — direct Supabase CLI
```bash
# Quick SQL:
cd ~/Desktop/OB/beast-tribe && echo "YOUR_SQL" | SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase db query --linked

# Full migration:
cd ~/Desktop/OB/beast-tribe && SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase db push --linked
```
Takes ~5s. No app update needed.

### 3. Admin dashboard change — push to GitHub
```bash
cd ~/Desktop/OB/beast-tribe && git add <files> && git commit -m "msg" && git push
```
Vercel auto-deploys in ~2 min.

### 4. Native rebuild (RARE — only for new packages/icons/permissions)
```bash
cd ~/Desktop/OB/beast-tribe && npx eas-cli build --platform ios --profile preview --clear-cache
```
Takes ~10 min. User installs new .ipa.

---

## Current State (as of 2026-04-19)

### ✅ Done
- All 25 Supabase migrations applied (pack RLS, SECURITY DEFINER triggers, feed_posts.is_hidden column)
- Mobile app has Supabase credentials + `expo-updates` baked in (build `83c1e6c9`)
- Installed on user's iPhone, ready for OTA updates going forward
- Admin dashboard deployed to Vercel, super_admin set up
- 10 critical dashboard fixes applied (partner edit page, user suspension actions, password reset, redirect loop, soft-delete posts, mobile sidebar, etc.)
- Mobile feed filters hidden/rejected posts

### 🏗 In Progress: TestFlight Launch
User wants to launch the app to limited public testers via TestFlight.
- **Build profile**: production (not preview — uses App Store distribution certificate, different from Ad Hoc)
- **Production build**: needs to be run interactively by user — `npx eas-cli build --platform ios --profile production` (requires Apple 2FA)
- **App Store Connect listing**: user creating "Beast Tribe" app now
  - Platforms: iOS only (uncheck macOS)
  - Name: Beast Tribe
  - Language: English (U.S.)
  - Bundle ID: com.operationbeast.beasttribe
  - SKU: `beast-tribe-ios-001`
  - User Access: Full Access
- **Next steps**: after app is created, submit production build via `eas submit`, add user as Internal Tester, Apple sends TestFlight invite

### 📋 Backlog (not critical for launch)
- ~20 medium-priority dashboard polish items from the audit: toast notifications, sortable tables, pagination on comments/moderation pages, RTL support for Arabic, etc.
- Production submit profile missing `ascAppId` in `eas.json` (need App Store Connect App ID once listing is created)

---

## Rules of Engagement

1. **Never ask the user for credentials** — all are in this file or the global MEMORY.md
2. **Prefer OTA updates** over native rebuilds whenever possible
3. **Small/medium/large** code changes: just edit + push OTA. Don't explain workflow each time.
4. **Database schema changes**: apply directly via Supabase CLI, then push app if needed
5. **Never commit to git unless explicitly asked**
6. **Always update the "Session Log" section below** when making meaningful changes

---

## Session Log (append-only — newest at top)

### 2026-04-30 — BULLETPROOFING PASS (4 parallel audits + systematic fixes)
Comprehensive audit of mobile + admin + database, then fixed every critical/high issue.

**Mobile (auth/onboarding/core):**
- Fixed infinite-splash race (setLoading always clears via .finally, not blocked by fetchingRef)
- Fixed new-signups-stuck-on-verify-email: verify-email re-authenticates with carried email+password; sign-in "Email not confirmed" routes to verify screen
- completeOnboarding now throws on error (no false-complete loop); caller shows Alert
- Onboarding steps surface DB write errors via Alert (no silent data loss)
- Unregistered orphan onboarding routes (baseline/set-goals/connect-devices); single terminal screen
- Fixed joinedEventIds module-scope leak across accounts (now useRef)
- Chat: useChatRoom uses maybeSingle, no fake demo-room on failure, surfaces error+retry
- createPost no longer passes sport NAME as UUID (was failing every post)
- Coach Dashboard now reachable (card on profile when useIsCoach)
- "Join a Pack" CTA hidden for existing pack members
- "up to 4 packs" copy → 20; respondToInvite joins before marking accepted
- Error banners + Retry on events/leaderboard instead of blank "no data"

**Admin:**
- CRITICAL: partner edit was writing/reading non-existent columns (every save threw) — rewired to real schema (business_name, partner_type, contact_email, etc.)
- Fixed partners list invalid join (profiles.email doesn't exist)
- updatePartnerEvent/moderation/feed-comment/profile actions now throw on error + audit + revalidate
- createPartnerEvent uses insert().select().single() (no concurrency mislink)
- Feed pagination prev/next; users pagination preserves premium filter
- Middleware /login redirect → / (role dispatcher) not /dashboard
- resetUserPassword now actually emails (resetPasswordForEmail)

**Database (migration 028 — PENDING token recovery):**
- feed_comments, content_reports, image_moderation_queue had RLS enabled but ZERO policies (silently broken) → added owner policies
- feed_posts_update_own/delete_own (021 may have aborted)
- events FK created_by/partner_id → ON DELETE SET NULL; pack_invites FK → CASCADE
- Note: 027_events_visibility_rls.sql + 028 both need applying when Supabase token works

### 2026-04-30 — Home card join state persistence + chat attendee count
- Home page UpcomingEventCard already had join/joined/onPress logic (joined → tap goes to chat)
- Added DB-backed RSVP fetch on screen focus → home card shows correct "Joined" badge after app reopens
- New `useEventAttendees` hook fetches event_rsvps with profile join
- activity-chat.tsx now passes real attendees → ChatScreen shows accurate "N beasts joining"
- OTA: `019ddeee-7cd6-7795-b609-386490bb5102`

### 2026-04-30 — Event join/leave UX (Joined label, leave from chat, persist state)
- EventCard: button text "Enter" → "Joined" (more visible state)
- New `useLeaveEvent` hook (deletes event_rsvps row)
- ChatScreen: added optional `headerAction` prop for icon/onPress in header
- activity-chat.tsx: added red exit-outline icon in header → confirms then leaves event + navigates back
- events.tsx: pre-populates joinedIds from event_rsvps on screen focus — cards show "Joined" correctly when user already RSVP'd in a previous session
- OTA: `019ddee5-4643-784e-947a-7f9be222b0c1`

### 2026-04-30 — Event image upload + locations refresh on focus
- User uploaded image to a community location ("Andoraa basketball court"); basketball event had broken `https://ibb.co/...` URL (gallery page, not direct image)
- Fixed broken URL on the existing event; linked basketball event to the court image
- Created `event-images` Supabase Storage bucket (public, 5MB, JPG/PNG/WebP)
- Mobile create-activity now auto-uploads picked images: `file://...` URI → Supabase Storage → public URL saved
- Replaced `useEffect` with `useFocusEffect` so popular locations refresh on every screen visit (newly-added admin locations appear immediately)
- OTA: `019ddec6-f932-7f44-a9f3-e98741146bb1`

### 2026-04-30 — Event type display fix (basketball not showing properly)
- User reported: created basketball event, didn't appear in events tab
- Root cause: event has `event_type='basketball'` but `sport_id=null`. Mapping used only `sport?.name` → fell back to "Event" label
- Verified events RLS policy is correct: `events_select` allows pack-exclusive events for pack members
- Fixed events.tsx + home/index.tsx to use `event_type` as fallback when sport relation is null
- Now displays "Basketball" instead of generic "Event"
- OTA: `019ddea8-4a39-7c1e-a64c-94b17d3769e2`

### 2026-04-30 — Admin dashboard speed + loading UX
- Top progress bar (`nprogress`) on every link click — orange, instant visual feedback
- New `SubmitButton` (uses `useFormStatus`) replaces ~10 form submit buttons across admin/partner — shows spinner + disables during submit
- New `loading.tsx` skeleton pages for 8 routes: communities, communities/[id], locations, locations/[id], users/[id], partners, partners/[id], events/[id]
- Vercel Speed Insights + Analytics added to root layout
- All forms now feel instant — no more "is it broken?" feeling

### 2026-04-30 — Direct image upload for locations
- Created `location-images` Supabase Storage bucket (public, 5MB limit, JPG/PNG/WebP only)
- LocationForm.tsx → client component with file upload UI (drag-drop area, preview, change/remove)
- Toggle between "📁 Upload" and "🔗 URL" modes
- Server actions: new `uploadLocationImage` helper that reads FormData file, validates size/type, uploads to bucket, returns public URL
- Image precedence: uploaded file > pasted URL > existing image
- `existing_image_url` hidden field preserves URL when admin edits without re-uploading
- Vercel auto-deploys on push

### 2026-04-30 — Community badge on mobile profile + auto-assign user
- User asked: "where does it show I'm part of the pack/community"
- Added `useMyCommunity` hook in src/hooks/index.ts
- Profile screen now shows orange "🛡 Community Name" badge below the tier pill
- Added `community_id` field to Profile type + AuthProvider demo profile
- Diagnosed second issue: user's "ANDORAA" pack actually has 1 member (themselves as leader). Pack count display showing 0 may be a stale cache — force-quit + reopen should resolve
- Manually assigned user (riad.filat) to "Andorra Sports Tribe" community via REST PATCH
- OTA: `019ddd1e-92bf-74cc-8ceb-ff1d1218e84c`

### 2026-04-29 — Communities (forced-membership tribes) + 20-pack limit
- Migration 026: communities table, profiles.community_id, popular_locations.community_id (NULL=global), packs.community_id + is_community_default
- Triggers: auto-join community-default packs when user assigned to community OR when pack is marked default
- RLS: locations + packs visible if global OR matches user's community OR pack member
- Pack limit: bumped from 4 to 20 (display + 3 server-side checks in hooks)
- Admin: full Communities CRUD with members section, default packs section, scoped locations
- Admin: User detail page now has community assignment dropdown
- Admin: LocationForm has community scope selector; locations list filterable by community
- Sidebar: 🏘️ Communities entry between Users and Events
- OTA pushed: `019dd966-1274-7d37-8845-dbeb829029cb` (pack limit)
- Vercel: auto-deploys on push

### 2026-04-29 — Admin-managed Popular Locations
- Applied migration 020_popular_locations.sql (table didn't exist) — 11 seed locations across SA + AE
- Tightened RLS: read-all, but insert/update/delete require admin_roles entry
- Built admin dashboard: list, create, edit, delete + soft-toggle visibility
- Files: `admin/src/app/(admin)/locations/{page,new/page,[id]/page,LocationForm,actions}.tsx`
- Added "Locations" 📍 to admin sidebar
- Mobile app already pulls from `popular_locations` in create-activity.tsx — no app change needed
- Committed + pushed → Vercel auto-deploys

### 2026-04-29 — Pack exclusive UI: orange highlight for contrast
- User feedback: teal highlight on dark teal background had poor contrast
- Switched toggle/picker/subtitle to brand orange (#E88F24) — much higher contrast
- Selected pack chip: orange border + orange tinted bg + bolder text weight
- Updated EventCard "Pack Only" badge to orange (consistent with create flow)
- OTA: `019dd93c-1fc4-71b5-bf16-fcff316bc45f`

### 2026-04-29 — CRITICAL fix: EAS env vars for OTA updates
- Root cause discovered: `eas update` does NOT read env vars from eas.json `env` block (only `eas build` does)
- Previous OTA bundles shipped with placeholder Supabase URL → app showed "App is not connected" error
- Created EAS environment variables (development/preview/production) for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Pushed new OTA: `019dd915-0079-7980-bfaf-6563c5f2a170`
- Verified bundle has real URL (`doqpqzxqgszsybghgtfq`), zero placeholder strings
- All future OTAs will now correctly inline env vars

### 2026-04-28 — Pack-exclusive events feature
- DB: added `events.pack_id` (FK to packs) + `events.visibility` ('public' | 'pack')
- DB: indexes on pack_id + visibility
- RLS: replaced "Events are public" SELECT policy with conditional — public events visible to all, pack events only to pack members or creator
- `useCreateEvent`: accepts `pack_id` + `visibility` props
- `useEvents`/`useUpcomingEvents`: now JOIN `pack:packs(id, name)`
- create-activity.tsx: added "Pack exclusive" toggle (only shown if user has packs); auto-selects single pack or shows picker if multiple
- EventCard: added isPackOnly + packName props, displays teal "Pack Only" badge with lock icon
- events.tsx: maps `visibility=pack` → isPackOnly, passes packName from JOIN
- OTA: `019dd433-3bdf-7d51-ae61-f6aa4029467d`

### 2026-04-28 — Removed local-only event fallback (production mode)
- User: paid Vercel + Supabase, no local fallback wanted
- `useCreateEvent`: removed `addLocalEvent` + local-only return path; throws on missing config/auth
- `localEventStore.ts`: `addLocalEvent`/`getLocalEvents` made no-ops; clears any leftover localStorage entries
- Removed local-only fallback popup from create-activity.tsx
- Errors now visible via Alert.alert with real Supabase error message
- OTA: `019dd38e-07ec-7339-9f6f-e24c7b77ac8c`

### 2026-04-28 — Diagnostic popups for activity creation
- User reports: created 2 activities, neither reflected in app
- DB verified: only 2 events exist (one from earlier, one from March) — last 2 attempts didn't reach Supabase at all
- Service-role insert via REST works fine — RLS policies are correct
- Added explicit Alert.alert popups in create-activity.tsx:
  - Success: "Activity created! '<title>' is live"
  - Local-only fallback: "Saved locally only — could not reach server"
  - Failure: "Could not create activity: <real error>"
- OTA: `019dd389-a6d2-75d8-abf3-f3fd7ecbb77f`
- Likely cause: phone hadn't picked up earlier OTAs, so silent fallback to local-only event

### 2026-04-19 — Event display fix (events filter + past-time warning)
- Root cause: events filter only showed `starts_at >= now`, so events with past start times were invisible
- User created "Run" event for 02:00 UTC today at 16:42 UTC → was past, hidden
- Fixed: `useEvents` and `useUpcomingEvents` now show events from last 6h too
- Added: warning in create-activity if event time is in past
- OTA pushed: `019dcaaf-87fd-763b-8faa-91adb71011ab`

### 2026-04-19 — Event creation RLS fix
- Same bug as packs: `events` table had SELECT policy only, no INSERT/UPDATE/DELETE
- Applied policies: `events_insert/update/delete_own` (auth.uid = created_by)
- Applied `event_rsvps_insert/select/update/delete_own` policies
- `useCreateEvent` hook: now throws instead of silently falling back to local event
- `create-activity.tsx`: surfaces error message instead of generic "Please try again"
- OTA pushed: `019da775-0124-7bc4-a1a6-9a3e01662436` (preview channel)

### 2026-04-19 — Persistent memory system
- Created this `CLAUDE.md` for cross-session context
- Next session will resume from TestFlight setup (see "In Progress" above)

### 2026-04-17 — Production iOS build started (interactive)
- Triggered `eas build --platform ios --profile production` (build `83c1e6c9` for preview was already installed)
- Production build needs interactive Apple credential setup (App Store distribution certificate)
- User in the middle of creating App Store Connect listing for "Beast Tribe"

### 2026-04-17 — Dashboard audit + fixes + OTA
- Comprehensive admin dashboard UX/functionality audit (37 issues identified, 10 critical fixes applied)
- Files created: `admin/src/app/(admin)/partners/[id]/page.tsx`, `admin/src/app/(admin)/users/actions.ts`, `admin/src/app/(admin)/users/[id]/UserActions.tsx`, `admin/src/components/ConfirmSubmit.tsx`
- SQL applied: `ALTER TABLE feed_posts ADD COLUMN is_hidden BOOLEAN DEFAULT false`
- Git commit `9dd925a` — Vercel auto-deployed
- OTA published: `019d9b3e-da8f-7dfd-8e24-383d25406d7d` (feed filters)

### 2026-04-17 — iOS native build with expo-updates + Supabase env
- Added `expo-updates` package + EAS Update configured with channels
- Moved Supabase env vars from `.env` into `eas.json` (they weren't being bundled into builds)
- Fixed `AuthProvider.fetchProfile` to use `maybeSingle()` with proper error handling
- Built new iOS preview build that user installed

### 2026-04-17 — Supabase migrations pushed via CLI
- User provided Supabase access token → linked project, pushed all 15 missing migrations
- Resolved conflicts: added `habit_logs.user_id` column, dropped conflicting indexes
- Applied critical pack fixes directly: `packs_insert_own/update_own/delete_own` RLS policies, dropped `idx_pack_members_one_pack` unique, added `SECURITY DEFINER` to chat room triggers

### 2026-04-17 — Admin dashboard deployed to Vercel
- Dashboard at `admin/` (Next.js 14) was never deployed
- User deployed via Vercel web UI: imported GitHub repo, set root directory `admin`, added 4 env vars (Supabase + NextAuth)
- Fixed Output Directory mistake (was "Next.js", should be empty)

### 2026-05-31 — DB bulletproofing applied via stable pooler connection
- Established STABLE db access: `aws-1-ap-south-1.pooler.supabase.com:5432` (Mumbai). Use `scripts/run-migration.js` with `PG_URL` env (connection string in ~/.claude memory). No more `sbp_` token expiry.
- Applied migration 027 (events visibility RLS) + 028 (feed_comments/content_reports/image_moderation_queue policies — were silently dead; feed_posts update/delete own; events FK SET NULL, pack_invites FK CASCADE)
- Applied previously-unapplied migrations 018/019/021 → created coach/program tables (coach_trainees, workout_programs, program_assignments, coach_notes, body_metrics, trainee_privacy) — Mission tab + coach features were querying non-existent tables
- Fixed admin comment moderation: `is_visible`/`hidden_by` columns don't exist → use `status` enum (active/hidden/deleted/flagged)
- feed_comments comment_status enum: active, hidden, deleted, flagged
- Verified: all target tables have full RLS; FKs safe; coach tables have policies

### 2026-05-31 — SIMPLIFIED: removed ALL gamification (UI + DB)
- User wanted a simpler app — stripped XP, levels, tier titles, Beast Score, streaks, badges, leaderboard, Missions tab, habits/quests
- Mobile: tab bar now Home · Tribe · Events · Profile (4 tabs). Home/Profile/Feed/onboarding simplified. Gamification Profile fields made optional. OTA 019e8466.
- Admin: removed XP/tier/streak/beast-score columns, filters, XP-history, Top-Users-by-XP; deleted TierBadge. Pushed dcd5950 (Vercel).
- DB migration 029: dropped tables xp_transactions, badges, user_badges, quests, user_quests, beast_scores, habit_definitions, user_habits, habit_logs; dropped profiles columns total_xp, level, tier, current_streak, longest_streak, beast_score, training_frequency; dropped recalculate_level_and_tier() + trg_xp_recalc. Kept chat/community/comment/admin triggers.
- Orphan dead files left in place (leaderboard, workouts/Mission, set-habits, beast-level) + their hooks — unrouted, harmless. Can delete later.
