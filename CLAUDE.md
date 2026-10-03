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

### 2026-10-03 (later) — Train upgrade shipped + gym Club Portal + subscription model
- Train upgrade OTA'd (group 766cd3a1, runtime f96462…): 104-exercise library with depth (setup, cues, mistakes, safety, dose), 7 programs (Calisthenics Start, Strength Base, Home Strength, First 5K, Padel Fit, Hyrox Ready, Busy Week), goal → recommended plan → Next up (Train + Board strip), weekly focus, sport cards, set logging with last-time numbers + double-progression suggestion + personal bests, You-page training metrics, 6 PM plan reminder. DB 041–045.
- User: gyms get a dynamic dashboard (members, interactivity, classes) and it must show why it matters; coaches + gyms pay a SUBSCRIPTION, not a percentage (PRODUCT.md › Business Model).
- DB 046 (applied): communities.kind + 'gym'; partners.plan/plan_status/billing_cycle/trial_ends_at/plan_renews_at; events.is_class/class_series_id; event_rsvps.attended_at; bt_notify granted to service_role (portal cancels notify members).
- Admin (Club Portal for gym partners): /partner/club (value receipt "what your club did between visits", members/active/at-risk, weekly actives, busiest-times heat map, upcoming classes, members to nudge, create-my-club self-serve), /partner/members (status filters, search, sort), /partner/classes (+ new with weekly repeat up to 12 weeks, detail with roster, mark attendance / everyone came, waitlist, cancel one or series), /partner/plan (all partners). Public /for-gyms pitch page with pricing. Admin partner form: plan fields; community kind Gym. Fixed: partner event creation inserted a non-existent partner_events.role column (always failed).
- App strings: community kind "Gym" + join-code privacy line (OTA).
- Verified: club metrics logic run against seeded data (statuses, fill, waitlist, came-back, heat map) then all QA data deleted; /for-gyms checked at desktop + phone width. NOT visually checked: logged-in portal pages (no partner login available to me; auth bypass for QA was refused — correct). `next build` passes.

### 2026-10-03 — First store build + onboarding fixes
- iOS production build 7 built and uploaded to TestFlight (App Store Connect app 6762473448). Apple agreement + login done by user. OTAs go to channel `production` with `--platform ios`; runtime must match build 7 (fingerprint f96462ed…). Do NOT edit eas.json without a new build — it changes the fingerprint.
- Onboarding bugs found by tapping through the real app (web, live backend) and fixed (OTA group 2d661cf2):
  1. Sign-up signed the new member out right after creating the account (Supabase confirmation is OFF, so sign-up returns a session) → onboarding opened then bounced to sign-in, so buttons looked dead. Now stays signed in and goes straight to onboarding; "check your email" only when confirmation is on.
  2. Create account / Continue (About you, Your sports) were silently disabled → now always tappable and say what's missing.
  3. Date-of-birth wheels ignored taps → values are tappable.
  4. Train tab failed for everyone ("Couldn't load workouts"): workouts query embedded profiles via partners.user_id (FK is to auth.users) → coach profiles fetched separately.
- DB 041: trigger creates a profile for every new auth user (+ backfill).

### 2026-10-02 (night) — Investor deck
- 20-slide investor deck (English) as a Slides artifact: https://claude.ai/artifact/T8bnTgnRVqpZQEhVS3Fu4y — "Uber for sports, nutrition and health communities", real app screens, animated backdrops, founder slide (Riad Abualfailat + photo) with three open founding seats.
- Every market figure fact-checked with a researcher + independent skeptic; stale/unsupported figures replaced (see memory beast-tribe-investor-deck). Contrast audited by rendering each slide and sampling real pixels: all text ≥4.5:1 (≥3:1 at 44px+).
- Open: email/phone, Operation Beast traction numbers, raise amount/stage. iOS store build still waiting on the Apple login in Terminal tab "iOS store build".

### 2026-10-02 (later) — Train: workouts, coach pay by use
- User: add workouts so Beast Tribe feels all-in-one — coach-posted workouts, coaches paid by use, our own library, wearables (Whoop) later. Decision and rules in PRODUCT.md › Train.
- DB 040 (dry-run 21/21, applied): extends the first app's `workouts` (bilingual `blocks`, sport id, format, equipment, source library|coach, status draft|pending|published|rejected|archived, author_partner_id, community scope, featured) and `workout_logs` (result, rpe, event_id, metrics, `counted` + coach_partner_id set by trigger `bt_workout_logs_before`), `workout_saves`, `events.workout_id`, `feed_posts.workout_id`, RPC `workout_done_counts` (counts only), `app_settings` (service role; `coach_pay` = rate | pool). 58 old English-only workouts archived; 12 OB library workouts seeded EN+AR (fixed ids 0b7e0000-…-0001..12).
- App: Train tab (today's workout, coaches, library, saved, done lately), `/workout/[id]` (WOD board, save, share, "train it with your crew" → Host prefilled), `/workout/[id]/play` (format-aware timer, rounds tally, log sheet with Share to: only me / a community feed / a pack chat), Host workout picker, session "The workout" row, feed "Workout · …" tag. Fixed "Coach Coach Reem".
- Admin: Workouts (tabs by status, review coach submissions, feature today's workout, archive), editor, Coach pay (rate or pool, per-coach monthly totals). Partner portal: My workouts (submit for review, edits re-review, uses + estimated earnings).
- Not visually checked: admin/partner pages (no admin login available here) — `next build` passes. No keep-awake during the player (not in the installed binary); the clock is time-based so it stays right after the screen locks.

### 2026-10-02 — Voiceover cut (English) + photo review
- User supplied an ElevenLabs voiceover (`beast-tribe-video/workout-video/public/vo-en.mp3`, 49.2 s). Transcribed locally with whisper.cpp (base.en, installed in the session scratchpad, not in the repo) and timed every sentence. The narration covers Join, Sport, I'M IN, Packs, Coaches, Courts, Food, Teams + logo and sign-off; it has no Board/Host/Share lines, so the voiceover cut drops those scenes.
- Compositions `BeastTribe-Explainer-EN-VO` (16:9) and `BeastTribe-Vertical-EN-VO` (9:16), both 50.5 s: scene starts and per-scene beats live in `src/journey/vo.ts` (VO_STARTS, VO_BEATS); to change the narration, re-transcribe and update those frames.
- Photo review: padel stand-in showed women lying on a court — replaced across the video and the web preview (see memory beast-tribe-photo-taste).

### 2026-10-01 (v2) — Video feedback: humans first
- User: "humans want to see humans, everyone wants to be part of a community." Name magnets now show the member's photo under a light brand-teal wash (yours keeps an orange ring); food offers show the restaurant's photo (partners.logo_url).
- Copy: "company, compound or club" → "company, club or gym"; onboarding adds "No code? Join people who play your sport."
- Preview data (web preview only): faces (Unsplash stand-ins), names/places/posts in Arabic for AR, sessions on the hour/half hour, My Company (MYCO24), Padel Gang / Riyadh Runners / Weekend Football (open), Thursday Crew pack (CREW26), three padel courts, three coaches, three restaurants. No real business names.
- Videos v2 (`exports/*-v2.mp4`): new Sport step, Coaches / Courts / Food as three scenes, people photos behind every scene, wall of faces at the end. Capture: `scratchpad/shots/capture2.cjs` (fixed clock 6:10 PM Riyadh, measures ring targets).

### 2026-10-01 (later) — Marketing videos (user journey) + web Arabic fixes
- Videos built in Remotion: `../beast-tribe-video/workout-video/src/journey/` (compositions BeastTribe-Explainer-EN/AR 1920x1080 ~60s, BeastTribe-Vertical-EN/AR 1080x1920 ~42s). Renders in `../beast-tribe-video/exports/`. Silent (no licensed music yet), with chalk-board motion, real app screens, rings and taps on the key actions, the I'M IN tap flooding orange into the sun.
- Screens come from the web preview (EXPO_PUBLIC_PREVIEW=1, synthetic data) via Playwright at 390x844 @3x; copy lives in `src/journey/copy.ts` (EN + AR), annotation targets are measured app points. Re-render: `npx remotion render src/index.ts <id> ../exports/<id>.mp4 --codec=h264 --crf=18`.
- Web-only RTL fixes (8d956fc): root `dir`, Arabic aligns right on web, Arabic heading stacks fall back to the Latin brand faces. No iOS OTA needed (web-gated).
- `.github/workflows/*` remain untracked on purpose (need a workflow-scoped token).

### 2026-10-01 — Community-driven model (B2B first), go-live readiness
- Decisions (user): open app + PRIVATE B2B communities joined by invite code; members in several communities; sessions live in a community or a pack (no global public); packs private to members; payments prepared but OFF; videos: 60–90s explainer + vertical cut-downs EN/AR. Monetization: app must earn itself (see memory beast-tribe-monetization).
- DB 039 (dry-run 26/26, applied): communities.visibility/kind/join_code/seat_limit/contract_ends_at/is_default; community_members (multi); default open "Beast Tribe" (everyone auto-joins); events.community_id + price_sar, visibility community|pack, host guard; RLS now private-by-default for events, RSVPs, packs, pack_members, feed_posts (+community_id), comments, beasts, coach_bookings, locations, partners; RPCs join_community_by_code / join_open_community / join_pack_by_code / coach_taken_starts; payments table (no client writes). Andorra = private, code RUDZPH.
- App: Tribe › Communities (mine, join code, open to join), community page (code share, sessions, leave), onboarding step 3 "Join your community", host "Who it's for" (community or pack), private-community tags on sessions/posts, "Post to" in composer, Explore › open communities, Nutrition › Eat well (nutrition partners' offers), PAYMENTS_ENABLED=false.
- Admin: community access (open/private, kind, seats, contract end, invite code + New code, multi-member list); partners fixed (creation was failing on NOT NULL name/slug/type and new partners were hidden as 'pending') + healthy restaurants (offer EN/AR + code, no login needed) + community scope + coach weekly availability editor.

### 2026-09-30 (later) — Pack patch icons redone with a professional set
- User: my hand-drawn glyphs (polygons, then a chalk-line pass) "really don't look good, create something great". Switched to one professionally drawn silhouette family from game-icons.net (Lorc, Delapouite, Skoll, Carl Olsen; CC BY 3.0 — credit line under the lockup in Settings, CREDITS.md in assets/brand/pack-glyphs). 35 glyphs: 12 beasts (+tiger, fox; oryx/leopard retired), 11 myths (+griffin, hydra, minotaur, centaur, hermes; phoenix retired), 12 marks (+claws, trophy, fist, run, lift).
- Stitch animation on the preview patch (outline draws via strokeDashoffset, fill lands, outline fades; Reanimated animatedProps on react-native-svg; works on web too). User had added skills svg-animations + icon-system; the Skill tool can't load skills added mid-session, so their SKILL.md files were read from disk and applied.
- DB 038 (dry-run 6/6, applied): emblem trigger maps eagle→falcon, leopard→tiger, oryx→ibex, phoenix→griffin; existing rows updated.

### 2026-09-30 — Pack patches replace the neon t-shirt mascots (review comment 1)
- User's review, comment 1: the Wolf/Eagle/Tiger/Rhino neon mascots are t-shirt art; wanted options (icons, emoji, etc.) + unique on-brand icons. Chose all kinds + asked for Greek mythology.
- New: 27 glyphs drawn in the OB wolf's geometry — Beasts of Arabia (12), Myths (8), Marks (7). Sources: scripts/brand/pack-glyphs/ (glyphs.py = shapes, workbench.py = review sheet, generate.py → src/components/brand/glyphs.ts + admin copy + assets/brand/pack-glyphs/*.svg).
- App: Patch + PatchPreview (src/components/board/Patch.tsx), PatchPicker (tabs Beasts·Myths·Marks·Emoji·Letters + 6 colourways), src/lib/emblem.ts (emblemOf, initials, firstEmoji). Start a pack (name first, random beast default), pack page (creator gets "Change patch" sheet), Tribe list, You tab, invites. Old patch PNGs + patches.ts removed.
- DB 037 (dry-run 21/21, applied): packs.emblem_kind/emblem_value/emblem_color + checks; legacy `animal` mirrored by trigger (old writers still valid; eagle→falcon, tiger→leopard). SECURITY FIX: members could move their pack into any community / make it a community default (the SECURITY DEFINER sync trigger then added every community member) or system pack, or change owner — now blocked by trg_packs_guard (admins + service role exempt). Dropped duplicate insert/update policies.
- Admin: PackPatch component; default-pack form picks glyph + colour with preview; community + user pages show patches.

### 2026-09-29 (later) — Beast Tribe logo "The Pack" + new welcome
- User chose logo A "The Pack": three parent wolves (from LogoVariations.ai vectors) in Dreamer aqua / Seeker orange / Mover ink; BEAST TRIBE wordmark from the parent logotype glyphs. Sources: assets/brand/*.svg; components src/components/brand/Logo.tsx (PackMark, Wordmark, Lockup, WolfGlyph) + admin/src/components/brand/Logo.tsx; geometry paths.ts (generated).
- Rolled out: welcome (photo-led, teal overlay, lockup, "By Operation Beast"), sign-in, Board masthead, Settings footer, Beast reaction = single wolf; admin sidebar + login (was a 🐺 emoji), /s/ share page, support + legal headers, favicon/apple-icon, og-default.png.
- Native assets regenerated (icon.png no alpha, splash, android adaptive, favicon) — the phone still shows Expo's DEFAULT icon until the next native build (EAS). Old orange marks (mark-sun, beast-icon, ob-logo-*) removed.
- Welcome photo is a stand-in (Mina Rad, Unsplash License, loaded from Unsplash CDN). Guideline photos are other brands' moodboard refs — do not ship. Ask user for OB shoot photos.

### 2026-09-29 — UPLIFT continued (branch uplift/box-board; NOT pushed — no GitHub login on this Mac)
- DB 036 applied (dry-run tested): coaching by consent — coach requests (pending), member accepts + picks sharing (nutrition / body), either side ends (delete). Fixed: coach notes (even private) were readable by every user; coach/trainee pairs public; anyone could insert body_metrics for others; coaches could never read shared nutrition. New: profiles.nutrition_goals, bt_coach_can_see(), coach_request/coach_accepted notifications (localized push).
- Rebuilt on the kit + EN/AR: Nutrition (week strip, day ledger, editable targets, water tally, delete, local-date logging), Coach dashboard, Trainee view, member coach request/sharing on You, +not-found. Inbox routes coach notifications.
- OTA SAFETY: src/lib/notifications.ts statically imported expo-notifications/expo-device (NOT in the installed April binary; they throw at import) → now lazy + guarded (requireOptionalNativeModule). Reminders localized; left/cancelled sessions drop their reminder; Board syncs reminders from all my sessions.
- Removed legacy src/hooks (2,200 lines), components/ui, old home/feed/nutrition/onboarding components, localEventStore, eventTime; 8 unused fonts no longer loaded; a font failure no longer crashes startup.
- Admin: public /s/[id] session page (OG preview, deep link beasttribe://session/<id>, noindex; /s/ added to middleware public paths); support FAQ updated to the new app. Deploys only after push.
- Contrast audit (both boards, EN/AR, all main screens): only whiteboard aqua failed (4.496) → #147070. Tab bar label clipping fixed.
- DESIGN.md + .impeccable/design.json written (North Star "The Box Board").
- NEXT: user wants a page-by-page design review; push branch once GitHub auth exists; merge to main (deploys admin /s/ page); native build later (push capability needs ASC API key; bump runtime then).

### 2026-09-28 — UPLIFT IN PROGRESS (branch uplift/box-board, not shipped)
- Visual world "The Box Board" chosen by user; contract in .impeccable/surfaces/app-tabs-home-index-tsx.md; product truth in PRODUCT.md.
- Built: theme kit (src/theme), i18n EN/AR + RTL (src/i18n), board components (src/components/board), data layer (src/data), screens: Board, Explore, Session sheet + chat, Host, Inbox, My sessions, Tribe feed, Packs (+create/invite), You, Settings, Welcome, Sign-in, Verify, About-you, Pick-sports.
- DB applied: 032 (waitlist/capacity/cancel/notifications/recaps/stats), 033 (all 22 sports), 034 (partners admin columns), 035 (realtime chat + inbox).
- LEFT: migrate nutrition, coach-dashboard, trainee-detail, +not-found to kit + i18n; QA Arabic RTL + Whiteboard; finish review + DESIGN.md; public /s/[id] invite page on admin; OTA with EXPO_TOKEN; next native build (push capability needs ASC API key).
- Preview: workspace launcher "Beast Tribe Preview" (EXPO_PUBLIC_PREVIEW=1, synthetic data, web).

### 2026-06-02 — App Store submission prep: compliance fixes + CI + notifications build
**Goal:** ship Beast Tribe to the public App Store without rejection; move builds to cloud (no local commands).
- **CI pipeline** added (`.github/workflows/eas-update.yml` + `eas-build.yml`) — OTA on every push, native build on native changes / manual. **NOT yet pushed** (needs a GitHub token with `workflow` scope). Files exist on disk, untracked.
- **App Store compliance fixes (migration 031 + UI):**
  - In-app **account deletion** — `delete_my_account()` SECURITY DEFINER RPC (deletes auth.users → cascades). UI: Settings danger zone + confirm modal. (AuthProvider.deleteAccount)
  - **Report content** — wired feed 3-dot Report → modal (reason picker) → inserts content_reports. Hooks: useReportContent.
  - **Block users** — `blocked_users` table + RLS; block action in feed menu; feed filters blocked authors. Hooks: useBlockUser, useBlockedUserIds.
  - **Terms/Privacy acceptance** at signup (required checkbox + links). Public legal pages live: https://beast-tribe.vercel.app/legal/privacy and /legal/terms. constants.ts: LEGAL_BASE_URL/TERMS_URL/PRIVACY_URL.
  - Pushed (commits a7ca1f7, 52086d2) + OTA `019e882d` (preview).
- **Reviewer demo account** created: `appreview@operationbeast.com` / `BeastReview2026!` (profile id 07835314-aa73-4f1e-8d13-a7048aae304b, onboarding_completed=true). For App Review notes.
- **BLOCKER:** iOS native build (push notifications capability) needs an **App Store Connect API key** (.p8 + Key ID + Issuer ID) so EAS can regen the push-enabled provisioning profile non-interactively. Waiting on user to generate it. Also optional: Expo access token + workflow-scoped GitHub token for full CI.
- Vercel admin domain confirmed: **beast-tribe.vercel.app**.
- **Support page** live: https://beast-tribe.vercel.app/support (Apple Support URL). /support added to middleware public paths.
- **Light-theme contrast bug fixed** (was: white titles invisible on light bg). Swept app/ + src/components/ — white text on light surfaces → COLORS.textPrimary; translucent-white cards → COLORS.cardBg. Delete-account modal forced light text on its dark sheet. OTA `019e88ee`.
- **App Store metadata pack** (copy-paste ready) given to user. Support URL: /support, Privacy: /legal/privacy. Demo acct in review notes.
- **Screenshots:** user's first batch showed the contrast bug (pre-fix) + wrong pixel dims (uploaded to 6.3" slot). Plan: user retakes after OTA, drops PNG files in ~/Desktop/OB/screenshots/, I resize via `sips` to exact 1290x2796 (6.9" slot).



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
