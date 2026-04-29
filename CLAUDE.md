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
- Access token (CLI): `sbp_9b6ae33ca6a0faace42d5bd4ee082a88f7784401`
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
cd ~/Desktop/OB/beast-tribe && echo "YOUR_SQL" | SUPABASE_ACCESS_TOKEN=sbp_9b6ae33ca6a0faace42d5bd4ee082a88f7784401 npx supabase db query --linked

# Full migration:
cd ~/Desktop/OB/beast-tribe && SUPABASE_ACCESS_TOKEN=sbp_9b6ae33ca6a0faace42d5bd4ee082a88f7784401 npx supabase db push --linked
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
