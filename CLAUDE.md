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
- App Store Connect App ID = 6762473448 (TestFlight: https://appstoreconnect.apple.com/apps/6762473448/testflight/ios). Not yet in eas.json `ascAppId`; add it with the next native build.

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
- **2026-10-08 — Hosts can edit a session; links survive sign-up (086).** update_session(p_event, title, starts_at, duration, place, capacity, difficulty, notes): host only, before start, court bookings keep time/place (COURT_FIXED), spots ≥ going (SPOTS_BELOW_GOING), more spots promote the waitlist, time/place change → bt_notify 'event_changed' (push EN/AR in bt_push_body). Tested rolled back, applied. App: app/session/[id]/edit.tsx (name, day, time, duration, place, spots, level, notes), Edit session in the host menu, Session.atCourt (facility_id), src/lib/times.ts shared with Play. Links: src/lib/pendingLink.ts keeps a /session or /court link (with ?g guest key) opened while signed out / unverified / onboarding and AuthGate opens it after onboarding. /s/ page: 'open this link again after installing', Arabic group wording (مجموعة). TestFlight: build 13 approved for external testing (group friends); public link needs the user's tap. OTA 7211eb44 (iOS) / f321acd6 (Android).
- **2026-10-08 — Roles guide (design/roles-guide.html, artifact https://claude.ai/artifact/RUcwPjdiyNVu1oEmC8TAAW).** Every role (member, group leader, club leader, captain, gym, company, school, venue, coach, other partners, guest, staff): how they get in, dashboard step → app result, can't-do, plus 34 recommendations (F fixes, P/O/S/M simplify, D decisions) with Approve / Not now / Discuss saved in the artifact db collection `decisions` (read with ArtifactData list). Proposal: partner dashboard = Today/People/Schedule/Grow/Account(+Wellness); staff = Today/Pipeline/Communities/Safety/Places/People. Nothing built yet; wait for the user's votes.
- **2026-10-07**: Sport picker: my sports first, More sports sheet (search, popularity order), onboarding search (OTA d60b5c19 / 9361c72c). Sport icons checked by eye: iOS padel/pickleball = figure.pickleball, hyrox = strengthtraining.functional, MMA = kickboxing; Android/web now use Material Community Icons per sport (`mci` in sports.ts; racquetball for padel, kettlebell Hyrox, weight-lifter CrossFit, boxing-glove, etc.). City pre-selected from the phone's position in onboarding (asks once) and Play; Play falls back to the profile city (OTA dce2ce93 / a7c790d6).

- **2026-10-07 — Badges: sport icons + black colours; no group photo (085, OTA 6ebcb66c / b5625377).** 16 game-icons.net glyphs (Lorc, Delapouite; CC BY 3.0) at the front of the Sport family: run, sprint, walk, hiking, cycling, swim, yoga, lotus, riding, jumprope, cardio, martial, badminton, surf, goalkeeper, whistle (generate.py BRAND set now explicit; downloaded SVGs stripped of the background square). 085 widens packs_emblem_color_chk: night/ember/frost (black grounds), steel, navy, sand, olive, coral — app emblem.ts + Patch edge + admin PackPatch. Group cover photo removed from Start a group and the group page (setPackPhoto deleted; packs.photo_url kept, no longer shown). Also: own Toggle switch replaces RN Switch (iOS 27 drew it high) — OTA b61e6dbf / a1804fed.

- **2026-10-07 — Men-only sessions; Play city first; local places only (084, OTA 5aba4342 / 6fdeccfd).** events.is_men_only + trg_events_men_only_host (MEN_ONLY_HOST), bt_rsvp_before MEN_ONLY, call-outs and invite_partner respect it, CHECK not both; granted SELECT. Tested rolled back. Play: Women only (women) / Men only (men) on the main form (was under More options, women only); City before Place; useHostPlaces(sport, lang, pos, city) lists only places in that city (within 50 km when no city) with a photo, own community courts always. usePopularSpots drops places without image_url; empty Board shows my city only. Running/Walking already existed (sports + places tagged).

- **2026-10-07 — Store privacy + storage.** App Store Connect › App Privacy published (privacy URL /legal/privacy; 10 types linked, no tracking: Name, Email, Health, Fitness, Coarse Location [App Functionality + Product Personalization], Emails/Text Messages, Photos/Videos, Other User Content, User ID, Other Data [gender, DOB]). Duplicate location-images/1777547610350-j697fr.png deleted by the user (backup in db-backups/2026-10-04-storage). Nelly Attar leader task cancelled by the user. Partner insights mock-up published privately: https://claude.ai/artifact/4CRpNRaFKu63WCfvT3i6wb. Google Play data-safety form waits for the Play account.

- **2026-10-06 — Leaders + partners: two sessions built the same thing; kept the cloud session's version.** This Mac session had also built leaders/partners (its own 083 + community_leaders RPC, applied live, never shipped). Reconciled: reverted that commit, merged main (898da76/e643604), applied live `082b_undo_parallel_083.sql` (dropped the parallel columns work_style/group_size/goals/show_level + community_leaders() + 4-arg find_partners; they held no data) then the canonical `083_partner_level_community_about.sql` (tested rolled back: level only when both show, same_vibe, shared_goals, community scope, old named-arg calls). OTA 00fa83c7 (iOS) / 5bd538eb (Android). Lesson: check `git fetch` / origin/main before building a request — another session may already have it.

- **2026-10-05 — Partners: show my level, find by community, optional "About you" (migration 083 NOT APPLIED; NOT shipped).** 083: partner_profiles += show_level, work (desk/on_feet/shifts/student/flexible), goals[] (≤3 of fitness/weight/compete/friends/stress/event), vibe (easy/steady/push); find_partners dropped + recreated with p_community UUID DEFAULT NULL (members of one community the caller is in, any city; else NOT_MEMBER) and returns level (bt_self_level as easy/medium/hard, only when BOTH show it; ratings still never returned), same_vibe, shared_goals; score: same vibe +10 / easy-vs-push −8, shared goals +6 each (≤12), both shifts/student +6. Answers themselves are never returned. Tested in PGlite with stub tables (11/11, incl. old named-arg calls). App: partners setup gets Show my level + About you chips; suggestions get a WHERE row (Everywhere + my non-default communities, lock icon for private), LevelTag + badges "Trains like you" / shared goal; You page: Training partners section (open toggle, show level, About you sheet "n of 3"), old partners row removed. ORDER: apply 083 BEFORE the OTA (the app now selects the new columns). Merged to main (898da76) 2026-10-05 → dashboard (community leader form) deploys; 083 and the OTA still to run from the Mac.

- **2026-10-05 — Community leaders list (no migration; NOT shipped yet).** Tribe › Communities: new "Community leaders" section under Your communities: leader photo (Magnet), leader name, "{Sport} community" (orange), club name · members, one-tap Join (orange) / Joined; sport filter chips when 2+ sports. Source: useLeaderCommunities() = communities open + active + leader_id + verified_at, leader profiles fetched separately; they're dropped from "Open communities" so they don't show twice. Preview data: 6 sample leader clubs. Dashboard › community page: "Add / Change the community leader" (app email via bt_user_id_by_email, sport, "Verify and list" → listing public, verified_at, visibility open, leader = community admin, club_verified push) + "Remove leader" (setCommunityLeader / removeCommunityLeader). Built in a cloud session: no EXPO_TOKEN/PG_URL there → needs OTA from the Mac after push. Leaders can already host sessions in their community; paid sessions wait on payments (PAYMENTS_ENABLED=false).
- **2026-10-04 — Backend audit: over-fetching, N+1, connections, storage, background jobs (081, 082; OTA 719f8ae0 / 1c258596).** Over-fetch: SESSION_LIST_SELECT (lists) vs SESSION_SELECT (+description, workout only if TRAIN_ENABLED); dropped unused Session.priceSar/facilityId/country; roster faces 6 (lists) / 4 (group sessions); session page reads my status from its roster; My sessions newest-300; useMyPlan off while Train off; unread dot = limit 1; chat loads newest 100 (was oldest 200 = bug). Dashboard: community counts via embedded count (JS count capped at 1,000 = bug), lean Events/Feed/Partners. N+1 (082): bt_call_players cheap filters first + level lookup last (identical recipients in test), job/insert use going_count; sessions_to_rate from my recent sessions; feed_posts.beast_count/comment_count kept by triggers (comment counts were always 0); communities admin policy split per command, admin_roles duplicate SELECT policies dropped, partners/feed_comments admin checks wrapped; open_packs counts once; indexes facility_bookings(event_id), events(facility_id), notifications unread + players_wanted, session_calls(user_id), level_ratings(event_id). Chat uses realtime payload + author cache; series cancel batched. Connections (081): idle_in_transaction_session_timeout authenticator 60s / postgres 10min; pg_cron history purge daily (cron-history-cleanup); run-migration.js closes in finally. App: auth token refresh + inbox realtime paused in background. Storage: replaced/removed avatars & group photos, deleted posts and failed-save uploads now removed; 1 orphan found (location-images/1777547610350-j697fr.png, byte-identical duplicate of the in-use place photo, backed up in ~/Desktop/OB/db-backups/2026-10-04-storage) — SQL delete blocked by Supabase, sbp token expired, left for the user. Not done: courts list text columns, nutrition goals from auth profile, challenge counts embed, challenge cards per-card boards, admin steps/club metrics SQL functions. pg_stat_statements reset 2026-10-04.

- **2026-10-04 — Leaders invite to their own groups (080).** bt_can_invite_pack: since 072 every group has a community, so only community admins got the code; now the creator/leader of a (non-default, non-system) group can too. Joining still needs community membership. Tested rolled back, applied. Also: badge colour is a named dropdown (OTA d7cb1152 / 9d8e6b07).

- **2026-10-04 — Groups: open or invite only; simpler Start a group (079, OTA 1a1e1b53 / 3c7bc139).** packs.visibility 'open' | 'invite' (default invite = the leader's own circle via code/invite). Open groups: visible to members of their community who fit the audience (packs_select + bt_fits_audience), listed by open_packs(), joined with join_open_pack() (community, audience, size and 20-group limits). Tested rolled back (outsider/private/women-only refused), applied. Start a group: tap the badge → sheet with symbols, one-row colourways and cover photo; then three Dropdowns (Community, Who can find it, Who it's for). Shared Dropdown + ChoiceList now in controls.tsx (host.tsx uses it). Groups tab: "Open groups" with one-tap Join. Group page: leader changes Who can find it; meta shows Open / Invite only. Also: Session page seats line on its own row + "Place to be confirmed"; Talal (talalabdulmalik@gmail.com) added as internal TestFlight tester in group Team; App Store Connect app id 6762473448.

- **2026-10-04 — Equal court split, personal Today line, free = no price (migration 078, OTA d80ba05d / 72b66448).** The court price is split equally between everyone who is in (no-shows/empty spots no longer fall on the organiser): events.court_sar (granted SELECT) + bt_court_resplit() from bt_rsvp_dues on every join/leave/promotion → share_sar = court ÷ players in, unpaid share dues follow, paid ones stay; court_sar guarded from members (trg_events_court_guard). Free courts create no dues. App: model share/court are null when 0, so free sessions show no tag, split or price on the join button; split block shows "Court SAR X ÷ n players", per-player rows, "With all N in, it's SAR Y each"; join button shows the share after you join. Board hero: "You're in N sessions today · M more to join" / "You have N sessions to join today" / "Nothing today · N this week" (today only, no city). Dashboard bookings copy updated. Location-on-open (useLocationRefresh, LocationAsk, useCitySync) shipped earlier as f9211011 / eb7e5284; iOS build 13 submitted to TestFlight.

- **2026-10-04 — Place photos, levels guide calls only, Where/City dropdowns, location (builds 13 / v5).** 076: no LEVEL gate on joining (levels only steer call-outs; keeps ratings private). 077: real place photos (admin/public/places/spots + CREDITS.md; Settings photoCredit): Jeddah Corniche (Unsplash), Kite Beach (CC0), Wadi Hanifah (CC BY 2.0 Peter Dowley), gym (Unsplash) for Leejam, "King Fahd Park" → Salam Park (CC BY 4.0 Hamza A. Durrani; no Riyadh King Fahd Park photo exists), Riyadh Boulevard no photo (all free ones are billboards). Play: Where = dropdown sheet with photos (community courts → places for the sport, by distance → somewhere else); City = dropdown (country first), set from the phone's position via src/lib/location.ts (native ExpoLocation module directly, guarded; web geolocation; nearest known city within 80 km; never sent to the server), else profile city. Shipped as OTA f0cdc64c / d6488c87 BEFORE adding the package. Then expo-location (coarse, foreground; FINE/BACKGROUND blocked on Android) + privacy policy section → new runtimes iOS d5f4632d… / Android c389710c…; builds iOS 13 (639cbaf7), Android v5 AAB (fca1c532) + APK (a74d5b11). OTAs now target these; build 12 / v4 frozen.

- **2026-10-04 — "Play" + looking for players (migration 075).** Host renamed Play (EN العب). Levels Beginner/Intermediate/Advanced (events.difficulty easy/medium/hard) chosen on the main Play form (defaults to the host's own level); bt_rsvp_before: a level-set session takes that level or one below (bt_level_of, unknown = welcome) → LEVEL; waiting list capped per session (events.waitlist_max 0–3, default 3) → FULL. Call-outs: bt_call_players() notifies (type players_wanted, push "X is looking for players at your level") eligible members — its community/group, city for open communities, gender for women-only, plays the sport; round 1 same level, later rounds one level lower too; once per member per session (session_calls), ≤3 a day per member, ≤60 per round; first round on insert (trg_events_first_call), then cron 'players-wanted' every 30 min every 2 h while seats are open, 07:00–21:59 Riyadh, up to 6 rounds, sessions within 3 days. call_round/last_call_at guarded from members. Board: "Looking for {level} players · N spots left" (orange), "Seats filled" tag; sport picture (session photo → sport field photo in src/lib/sportPhotos.ts from the Andorra set → icon tile): banner on the next session, 64 px thumbnail on others. Session page: "Seats filled" disabled when the waiting list is full too.

- **2026-10-04 — Security hardening (migration 073) + dashboard on Next 15.5 / React 19.** Four audits (DB, dashboard, app, dead code); every DB exploit reproduced as a member/anon in a rolled-back transaction, fixed, and re-tested live (scratchpad t73live.js: 26/27 — the 27th is pg_net, owned by the extension and not exposed by the API). DB: column-level grants now (profiles UPDATE/INSERT without community_id/pack_id/is_premium/premium_expires_at; events SELECT without guest_token → session_guest_token() for hosts; feed_posts/feed_comments moderation columns; pack_members UPDATE; event_rsvps UPDATE(status,event_id,user_id) + trg_rsvp_status_guard (no moving, no 'interested'), INSERT without attended_at); bt_notify revoked from members/anon; pack_members insert = leader of own new group or pending invite; full groups refuse joins; bt_events_money also keeps captain/partner/class/count/price/creator fields; image_moderation_queue member writes revoked; TRUNCATE/TRIGGER/REFERENCES revoked; functions no longer PUBLIC (anon runs none); bt_trusted_caller no longer trusts anon; user-uploads 5 MB images, no overwrite; event-images upload policy added (covers were failing). NOTE FOR NEW COLUMNS on those six tables: grant them to authenticated explicitly. Dashboard: moderation fetch/delete only our storage buckets (storedFile()), admins must enrol two-step (requireAdmin → /security?required=1), requireRole (moderators: Feed + Moderation only), facility parent must be the partner's own, lib/validate.ts, security headers, /s/ hides private-community sessions without a valid guest key, Next 15.5.27 + React 19 (codemod; cookies/headers awaited). App: guest key via RPC, password held in memory (src/lib/pendingSignIn.ts), sanitized group search, ship-update refuses EXPO_PUBLIC_PREVIEW. OTA 17518687 (iOS) / 346d7df6 (Android).

- **2026-10-04 — Communities by request; groups inside communities (migration 072).** packs.community_id NOT NULL (old groups → general community); bt_packs_guard lets members create groups in communities they belong to (general = auto-join); bt_pack_join_community_guard auto-joins the general community. create_club raises BY_REQUEST for non-admins. New RPC request_community → partner_leads (new kinds influencer/compound/school/other, user_id column, source 'app') + bt_notify 'community_request' to admin_roles (push text EN/AR). App: club-new removed → app/community-request.tsx (per-audience copy, EN/AR); RequestCommunityCard; pack-create community picker; Groups tab grouped by community; community page Groups section. Admin Leads labels the new kinds and maps them to partner types.

- **2026-10-04 — Train off for launch; Host simplified.** `TRAIN_ENABLED = false` (app constants + admin lib/features.ts): Train tab hidden (`href: null`), Train/workout/program/moves screens redirect to the Board, plan card, profile training stats, workout links (feed, session), plan of the month, plan reminder (cancelled on start), Ask Beast workouts (tool removed), partner Workouts cap, workouts challenge metric, and library claims on /for-gyms, /for-companies and plans all hidden. Host: own sports first + More sports; Place after sport ranked by src/data/places.ts (community courts first, then courts/spots for the sport by use and city); bookable court → its slots/length/players, `hostAtCourt` books then adds extras; time is one row with a period switch.

- **2026-10-04 — Native round + partner sessions merge.** Removed expo-speech, expo-video (app.json plugin too), expo-web-browser; added expo-system-ui (Android dark UI). New runtimes: iOS 9956a149… (build 12, EAS 8405ad10), Android 55a47ff5… (versionCode 4: AAB d98a6d96, test APK ec52fea5). OTAs now reach only these builds; older builds (iOS 10/11, Android ≤3) stop getting updates. iOS 12 needs `eas submit` with the user's Apple login (Terminal). Partner "events" merged into the classes tool for every partner type (`requireCap('classes')`, `loadSessions`, `SessionFields`, `updateClass`); non-club partners post to the open default community; /partner/events* redirects (next.config.js). The tokens in old git history are confirmed revoked by the user.

- **2026-10-04 — Code review + cleanup phases 1–2 (shipped).** Security: partners only see their own events/guest lists, password reset works signed out, admin Next 14.2.35. Phase 1: removed Expo template (components/, constants/), XP-era types/constants, legacy colour chain, unused packages (date-fns, flash-list, expo-status-bar, @react-navigation/native; admin recharts, date-fns), mascot PNGs, stale docs, 41 unused i18n keys; .impeccable/questions, supabase/.temp, .claude/ untracked via .git/info/exclude (NOT .gitignore — fingerprint). Phase 2: query.ts shares in-flight requests + `CATALOGUE` staleMs; board always loads 14 days (Home slices); my RSVPs/sessions bounded (180 days); errors via src/data/errors.ts (CodedError/codeFrom/errorKey); useMeId in src/data/me.ts; PERSON_COLUMNS in model.ts; SPORT_PLAN in programs.ts. Admin: requireCap guard, lib/events.ts readEventForm, lib/format.ts sar/monthRange, lib/search.ts, fetchAll for pay pages, one sport list in lib/workouts.ts. Runtimes unchanged; OTA ceb5ff4c (iOS) / 10cf5058 (Android).
- **Phase 3 (database) applied 2026-10-04 as migration 071** (user approved; auto mode had blocked it first): dropped 19 unused tables (pack_challenges, beast_roar_*, goal_templates, goals, journal_entries, baselines, step_logs, device_connections, qr_codes, program_assignments, workout_programs, comment_likes/reports, post_reports, image_moderation, partner_events, partner_members, admin_audit_logs), functions log_admin_action + generate_invite_code, type moderation_status, 10 redundant indexes; VACUUM FULL on the load-test tables: database 212 MB -> 41 MB. Backups: ~/Desktop/OB/db-backups/2026-10-04-cleanup/.

- **2026-10-04 — Andorra facilities round 2 (070).** Sports Squash + Table Tennis added (DB, app registry, EN/AR, dashboard lists). Andorra facilities: Squash Court 1, Squash Court 2 (squash + table tennis), Football pitch, Boxing studio + Spin studio (classes only), Padel Court 2 photo. All 11 user photos live under admin/public/places/andorra/. Opening hours still a 06:00–23:00 placeholder: none readable in the photos, waiting on the user. OTA f5c1a2ca (iOS) / d547d66f (Android).

### 2026-10-04 (midday) — Community courts with house rules (Andorra), recommendations, horse riding
- User (voice note + 12 photos of Andorra Sports Tribe's facilities): recommend close / community courts first; Andorra has 3 padel, 2 tennis, 1 indoor multi-use court (full court: basketball, football, handball, volleyball; badminton = half court) and an indoor pool for classes (show coaches); padel house rule = one booking a day per member even if invited, max 1.5 h; private courts only for the community ("general and private almost for everything"); add horse riding.
- DB 069 (tested in a rolled-back transaction as two members, applied): facilities.sports[] / parent_id (half courts) / bookable / daily_limit / sort; bt_facility_busy() (a full court blocks its halves and vice versa, advisory lock per court); facility_slots + book_facility(..., p_sport) rewritten (multi-use sport choice, DAILY_LIMIT via bt_check_daily_limit(), not-bookable pool → NOT_FOUND); bt_rsvp_before also checks the daily limit when someone joins a court booking. Partner 'Andorra Sports Tribe' (venue, id a1d0aa00-…-001) + 9 facilities, audience community (members only), price 0, hours 06:00–23:00 PLACEHOLDER (confirm), photos in admin/public/places/andorra/. Sport 'Horse Riding' in sports.
- App: courts ranked (own community → courts you use → your sports → your city), grouped "your community" first; free / classes-only / "1 a day" labels; court page: "What are you playing?" for multi-use, half-court and house-rule notes, pool page shows coaches + "Set up a class" (host takes ?sport=). Ask Beast: find_courts tool + court cards. Dashboard facility form: other sports, half of another court, bookings a day, classes only.
- Horse riding: sport id horse_riding (SF figure.equestrian.sports / Ionicons paw), EN/AR names, 12 library workouts (rider fitness). check.js key rule allowed no underscore — fixed.
- Not used (third-party logos): boxing studio, spinning studio, padel-racket photos. Squash courts and the outdoor pitch were in the photos but not in the user's list — not added.

### 2026-10-04 (morning) — Photo review on phone and desktop, 48-hour window
- User: admins (Beast Tribe admins only) review uploaded photos from phone or desktop within 48 hours; if nobody reviews, keep notifying admins.
- DB 067: image_moderation_queue.uploaded_by nullable (place/facility photos have no member; the 066 trigger failed saving them). 068: bt_photo_reminders() + pg_cron 'photo-review-reminders' hourly (:07): push + inbox to every admin_roles user while photos are pending — after new ones wait 10 min (max hourly), then every 6 h, every 3 h once any is past 48 h (photo_overdue); push texts photo_review / photo_overdue (EN/AR). Last send in app_settings 'moderation'.last_reminder. NOTE: the super admin account has NO push token yet — sign into the app with it and allow notifications to get the pushes.
- Admin: Moderation page shows "N h left to review" / "Overdue by N h" per photo and the overdue count; bigger photo + buttons on phones; content no longer under the phone menu button (admin + partner layouts); /manifest.webmanifest so the dashboard can be added to the home screen. App inbox: photo reminders open the Moderation page.

### 2026-10-04 (night, later) — Group photos; every uploaded photo checked
- User: allow a group photo, small once uploaded; catch unacceptable uploads (sexual content, nudity, anything not allowed).
- DB 066 (tested in a rolled-back transaction, applied): packs.photo_url (+ column grants); bt_check_image() AFTER INSERT/UPDATE triggers on feed_posts.image_url, profiles.avatar_url, events.image_url, packs.photo_url, popular_locations.image_url, facilities.image_url → image_moderation_queue row + pg_net POST to https://beast-tribe.vercel.app/api/moderate with app_settings 'moderation' secret (only our storage URLs; a reused picture reuses its verdict, a re-attached blocked one is cleared at once); bt_take_down_image() (service role) clears the picture everywhere and hides posts (auto_rejected / rejected).
- Admin: /api/moderate (secret-checked) → Claude vision (MODERATION_MODEL, default claude-haiku-4-5-20251001) returns allow / review / block; block = take down + delete file; review stays pending; allow = auto_approved. NEEDS ANTHROPIC_API_KEY in Vercel — until then every photo waits in Moderation for a person. Moderation page shows the check's reason; Reject now takes the picture down everywhere (it wrote a non-existent feed_posts.image_status before — fixed).
- App: group photo as a 16:9 banner on the group page (leader: add / change / remove) and optional at creation; uploads resized to 640 px JPEG ('group' size).

### 2026-10-04 (late night) — Partner switches; guests invited to community sessions by link
- User: training partners need a "same community" and a "same gender" switch; hosts should be able to invite guests to certain community sessions, chosen when creating the session.
- DB 065 (tested as two real non-admin members in a rolled-back transaction, then applied): partner_profiles.same_community / same_gender (women_only kept in sync for old builds; same gender ignored without a gender); find_partners: if either person asks, the pair must share a non-default community / have the same gender. Guests by link: events.guest_invite + guest_token (trigger makes the token; only for community sessions; communities.allow_guests can switch it off → GUESTS_OFF); guest_session_preview(id, token) and join_as_guest(id, token) (bt.guest_invite lets bt_rsvp_before accept that one outsider; women-only/capacity checks still apply); events_select lets guests see a session after joining via bt_my_guest_event_ids() (a direct subquery looped events ↔ event_rsvps policies). Not listed on any board.
- App: partner setup "Same community only" / "Same gender only" (gender switch only with a gender set); Host: "Guests can join with the link" for private community sessions; share links carry ?g=<token>; session screen shows GuestJoin (preview + Join as a guest) to outsiders with the link. Web /s/<id>?g= passes the key into beasttribe://session/<id>?g=. Dashboard › community page: "Members can invite guests to their sessions".

### 2026-10-04 (late) — Login security pass (from the user's reel: "5 ways your login isn't secure")
- 1 Token storage: app keeps the Supabase session in AsyncStorage (app sandbox, no web-script exposure, but unencrypted). NEXT NATIVE BUILD (both platforms): add expo-secure-store and store the session encrypted (large-session pattern: AES key in SecureStore). Adding the package changes the fingerprint, so it waits for that build. Admin site cookies are script-readable because login/verify/security/reset/sign-out use the browser client; moving them to server actions would allow httpOnly cookies.
- 2 Server-side checks: audited — every admin/partner server action calls requireAdmin/requirePartner (+ ownership checks); only the public lead form is unauthenticated (honeypot + per-IP limits). DB access is RLS.
- 3 2FA: dashboard two-step sign-in (Supabase MFA, TOTP). /security (QR enroll, turn off), /login/verify (code step), requireAdmin/requirePartner redirect to /login/verify when an enrolled account's session is not AAL2; banner on admin pages until the admin enrols; Security link in both sidebars. Not yet forced for admins without a factor (avoid lock-out before the user enrols) — flip to mandatory once the super admin has enrolled.
- 4 Rate limits: Supabase Auth per-IP limits + our own (join codes 10/h, assistant 25/day, lead form). CAPTCHA (Turnstile) + stricter limits need the Supabase dashboard (sbp_ token expired 2026-10-04).
- 5 Passwords: src/lib/password.ts (+ admin copy): min 10 (dashboard accounts 12), common-password list, email-part and keyboard-pattern checks; app sign-up and the reset page (with strength meter). Server-side minimum/leaked-password check is a Supabase dashboard setting.

### 2026-10-04 (night) — Gender captured at the start; women-only / men-only by gender
- User: capture gender at the start so only women can create women-only groups and only men men-only groups.
- DB 064 (tested as real non-admin members in a rolled-back transaction, then applied): only women create women-only groups (PACK_CREATE_WOMEN), only men men-only (PACK_CREATE_MEN), no gender → PACK_GENDER_NEEDED; only women host women-only sessions (WOMEN_ONLY_HOST); joining a women-only session with no gender → GENDER_NEEDED (was a free pass); gender is set once — later changes only by admins/dashboard (GENDER_LOCKED). Service role, admins and bt.trusted functions are exempt (bt_trusted_caller()).
- App: onboarding requires gender; once set it shows locked with "email support to change"; group form offers Everyone + your own gender's option only (+ "Add your gender" link when missing); host already shows the women-only toggle to women only; one-time "One quick question" sheet on the Board for members without a gender (GenderAsk). EN + AR.
- Note: gender is self-declared. Real proof needs ID/Nafath verification (discussed 2026-10-03, not built).

### 2026-10-04 (evening) — "Pack" renamed to "Group" for members
- User: change the word pack to group or team so it's simpler. Chose **Group / مجموعة**: "Team / فريق" is already the company-team word in step challenges, and the Arabic had mixed فريق and مجموعة for packs. All member-facing text (EN + AR, feminine agreement), website (privacy, /for-companies, /s/ share page), admin labels and the store listing copy. Code, routes and tables still say pack/packs.

### 2026-10-04 (later) — 12 workouts per sport, clearer week card, levels everywhere
- User: at least 12 workouts under each sport; the week-plan control should be a highlighted box like Next up; plans and workouts must show beginner / intermediate / advanced.
- Library: scripts/library (kit.js helpers, check.js validator, sports/<sport>.js × 22, build.js loader). 264 new library workouts, 4 per level per sport, EN + AR, only the 104 library exercises; padel written first as the reference, the other 21 by parallel writers held to check.js. DB 063: workouts.library_key (unique) so build.js updates in place. Every workout walked through the player's step logic (264/264 play to the end). Re-run: `PG_URL=… node scripts/library/build.js`.
- Fixes found on the way: Arabic units in "15 s / side" doses kept the English unit (kit + programs build fixed, check.js now rejects it; plans rebuilt in place); overhead_press Arabic name said "بالبار" for a dumbbell move (library json + DB). App list query was capped at 80 workouts → 500.
- App: WeekCard (src/components/board/plan.tsx) replaces the "This week" pill: week N of M, each workout of the week with ticks, next marked, switch focus / back to plan, change goal. LevelTag/LevelBars (src/components/board/level.tsx): 1–3 bars + Beginner/Intermediate/Advanced on workout rows, plan rows, plan page, recommended card; Train list grouped by level with level chips, All shows the member's own sports; plans list grouped by level.

### 2026-10-04 — Android builds, one update stream for both phones, animated exercise demos
- Android: test APK (EAS e60fcc51, preview, versionCode 2) and Play store .aab (EAS b3f44b4c, production, versionCode 3), runtime 2b9ae4e3…; iOS runtime unchanged (5fa84627, build 10). Channel `preview` now follows branch `production`, so ONE publish reaches both. Release: `scripts/release/ship-update.sh "msg"` (needs EXPO_TOKEN; EAS_BIN=~/.npm/_npx/6bc7bae5c2059953/node_modules/.bin/eas), installs per platform: `node scripts/release/installs.js <group>`. Google Play account not created yet (user); Android push needs a Firebase project; Health Connect not built.
- Exercise demos: 062 exercises.demo_id = ExerciseDB id (free OSS API, oss.exercisedb.dev, no key). Their terms forbid storing their media → the app loads https://static.exercisedb.dev/media/<id>.gif live (MoveDemo component, white card, "Animation: ExerciseDB"). 63/104 matched, each checked by eye (names lie: "wind sprints" = hanging knee raise, "quads (bodyweight squat)" = Bulgarian split squat); 41 warm-ups/stretches have none. GIFs are 180 px (paid V2 has HD/video). OTA groups f7ba8c20 (iOS) / 4d9d7a37 (Android).
- Disk was full (113 MB free): cleared the npm cache (5.4 GB). Web dev overlay "wake lock … has not activated yet" in the player is web-only (expo-keep-awake in a hidden tab).

### 2026-10-03 (latest) — Guest classes, court booking with a per-person split, one partner dashboard
- User: (1) gyms/clubs ask "what's in it for me" → let people OUTSIDE their community join classes for a paid fee (new market); (2) court booking with the payment split between players, simple; school facilities too; (3) ONE dashboard for all B2B, shaped by business / coach / influencer. Decisions (user): payment staged for now but the split must be clear per person; Beast Tribe takes nothing extra; each player pays their own share; venues list their own courts.
- DB 060 (applied; tested in a rolled-back transaction first): facilities (hours by weekday in Riyadh time, price, slot length, max players, audience everyone|women|community, notice/cancel hours, is_school; members read, only the dashboard writes), facility_bookings (EXCLUDE constraint: no two confirmed bookings overlap), events += guest_open / guest_price_sar / guest_spots / share_sar / facility_id (trigger bt_events_money: members can never set them), events_select + bt_rsvp_before let outsiders see and join guest classes (GUESTS_FULL), session_dues (who owes what; members read their own, organiser reads the session's, nobody but the dashboard writes) filled by trigger on RSVP, facility_slots(), book_facility() (max 3 upcoming per member), partner_income() (service role). 061: communities.kind += 'school'.
- App: Explore tile "Book a court" → /courts → /court/[id] (day, time, players, live split, book) → the session page with "The split" (each amount, who paid, open spots); guest classes show "Guests SAR n" on the Board, a guest price block and "Join as a guest · SAR n"; "Paid" appears once the venue ticks it. Times already passed are hidden and the screen opens on the next day with free times. Board city name now follows the app language. EN + AR strings.
- Admin (one dashboard): admin/src/lib/capabilities.ts maps partner type → what they run; the sidebar and /partner/dashboard are built from it (Overview: needs-you-today list, numbers, "From outside your community" income, coming up, tools). New types: school, venue, leader (club leader or influencer; free). /partner/facilities (+new, edit, hide), /partner/bookings (players, share each, mark paid, everyone paid, cancel + notify), classes: "Open to guests" (price, guest spots), guest tag + "Mark paid" on the class roster. /for-gyms + plans mention guest spots and courts. Gym/company accounts now land on Overview; the old Club page is still there as "Club"/"Community".
- Verified on web with seeded data (then deleted): guest class on the Board, join as guest, due created, court booking 240 ÷ 3 = 80 each, session split, paid marks after the venue update, Arabic for all of it, partner_income for both partners. NOT visually checked: the logged-in dashboard pages (no partner login available to me) — `next build` and type-check pass.
- Staged, not built: online payment. Needs a Moyasar/Tap merchant account in the owner's name.

### 2026-10-04 (night) — Club leaders, training partners, private level ratings, Ask Beast
- User: AI features to match players; a model to onboard coaches/community leaders (people who own run clubs); teammates can rate a player's level (hidden from the player) so the engine matches similar levels; "things users would appreciate". Decisions (user): leaders are FREE (move to the Coach plan only if they charge); built-in matching + a Claude assistant; partner matching is OPT-IN.
- DB 059 (applied, tested in a rolled-back transaction first): communities.leader_id/sport/listing/verified_at (+ column GRANT), create_club() (one free club per leader, starts private with a join code, leader = admin, creates a 'leader' row in partner_leads with community_id), update_my_club(); level_ratings (NO policies, revoked from members) + rate_players() (only people who were in the session, after it ended, within 14 days; coach/captain/club-admin ratings weigh 2), my_level_ratings() (what I gave only), sessions_to_rate(); bt_level_of() (self level blended toward teammates' ratings; server only); partner_profiles (own row only; women_only forced off unless female) + find_partners(p_cities, p_sport) (only open members see open members; never returns a level, only close_level; excludes level gaps ≥ 1.75; scores sport, level, usual times, pace, shared club, sessions together) + invite_partner() (invite to a real upcoming session; no DMs; 10/day); push text partner_invite / club_verified; assistant_usage + assistant_take() (25 questions/day).
- App: Explore tiles (Training partners, Ask Beast); /partners (setup → suggestions with reasons → invite to one of my sessions); /club-new (Start your club, code to share); community page: "Club leader: …", Verified badge, leader panel + edit sheet (name, about, notice, who can join); session page: private "Rate the level you saw" after it ends; Board nudge for sessions to rate; You rows; inbox routes. EN + AR strings (1123 keys each).
- Admin: /api/assistant (Claude via fetch, model env ASSISTANT_MODEL default claude-sonnet-5-5; tools find_training_partners / find_sessions / find_workouts / find_clubs run with the MEMBER's JWT so RLS applies; never sees ratings). Needs ANTHROPIC_API_KEY in Vercel env — until then it answers 503 and the app says "being set up". Leads: kind 'leader' + "Open the club to verify it"; community page "Verify club" (lists it if the leader chose public, notifies the leader); public /for-leaders page; privacy policy sections for partners, ratings and Ask Beast.
- Verified on web: Explore tiles, partner setup → empty state, Start your club form, Ask Beast intro. Not verified: a real Claude answer (no key yet), rating UI on a real finished session with other people.

### 2026-10-04 (evening) — Workout player: one exercise at a time
- User: "each exercise on its own, you click next and jump to the next exercise… super simple, a nine-year-old can train with it; videos later to show the exact movement".
- `src/data/guide.ts` (buildGuide, nextStep) lays a workout out as single steps: rounds in order, "3 × 10" as three sets with a rest between them in strength blocks (rest from the exercise library), every-minute blocks as one step per minute, as-many-rounds blocks as a loop until the block clock ends (laps counted as rounds for the log). Walked all 32 distinct workouts in the database.
- `app/workout/[id]/play.tsx` rewritten around it: exercise name, one big number (countdown, or reps), two coaching cues + "How to do it", "Up next", Previous / Pause / big NEXT, progress bar. Timed steps count down and move on by themselves (ticks on the last 3 s); everything else waits for Next. The log sheet at the end is unchanged.
- Media slot: shows `exercises.poster_url` when set; videos (`video_url`) are the next step — none recorded yet.

### 2026-10-04 (later) — Phone was on build 7; onboarding trap; language switch in onboarding
- User (in Arabic): no way to change language during onboarding, and "ادخل المجتمع" (last onboarding button) did nothing.
- ROOT CAUSE: the phone was still on **build 7** (runtime f96462…). Expo update insights show its last installed OTA was 70ad57f5 (10:27 UTC, 3 Oct); every OTA after build 10 went to runtime 5fa84627 with 0 installs. Build 7's code reads `profiles.select('*')`, which migration 050 no longer allows, so the profile came back empty → gate sent the member into onboarding → the last step saved but could not read the profile back → stuck. None of the day's later work (wellness, captains, Arabic pass) had reached the phone either.
- CHECK BEFORE BELIEVING AN OTA LANDED: `updatesByGroup(group).insights` on api.expo.dev/graphql (installs / failed installs per update), script pattern in this log's session. Build 10 was uploaded to TestFlight 12:57 UTC; the user has to install it from TestFlight.
- App: language switch (auth.langSwitch) on all three onboarding screens; completeOnboarding lets the member in even if the profile can't be read back; realtime topics are unique per subscription (reusing `inbox:<id>` threw "cannot add postgres_changes callbacks after subscribe()" and crashed the tabs); profile.locale is synced to the app language at start (was only saved on a manual switch, so Arabic phones got English pushes); needLevel string said باحث where the level is مبادر.
- Xcode IS installed on this Mac now (/Applications/Xcode.app, iOS 27 runtime; no simulator booted). The "no Xcode" note in memory is out of date; eas.json `development` profile is a simulator dev-client build.

### 2026-10-04 — Arabic pass: one vocabulary, workout names, places
- User: "double check the RTL, the Arabic journey is not smooth; naming of workouts needs to be double checked, some are wrong".
- Finding: layout was already direction-safe (start/end everywhere, 999/999 strings translated). The roughness was wording: "session" was تمرين in 51 strings, جلسة in 15, حصة in 5, while تمرين also meant a workout and a single exercise.
- ARABIC VOCABULARY (keep to it): session on the Board = جلسة · workout = تمرين · single exercise = حركة · gym class = حصة · plan = خطة · squat = سكوات · lunge = طعن · deadlift = الرفعة الميتة · row = سحب (تجديف only for the rowing machine) · kettlebell = كيتل بل · band = شريط المقاومة · stretch = إطالة · calves = السمانة · الفخذ is feminine.
- App: ~75 Arabic strings rewritten with feminine agreement for جلسة (tags مكتملة/جارية/ملغاة/انتهت); Board/profile counts; cities shown in the reader's language (`cityLabel` in src/lib/cities.ts); places use popular_locations.name_ar; "Done lately" shows the workout's current name in the reader's language (was the English title saved with the log).
- DB 056 (applied): library workout titles/moves corrected ("Engine 20" → Hyrox Engine / تحمّل هايروكس, "No-Kit 15" → No-Kit Circuit / دائرة بدون معدات — the numbers were not the workout's length; "مزدحم 20" (crowded) → 20 دقيقة · اليوم N; "كور مع شريك" → تمرين البطن مع شريك, etc.). 057: popular_locations.name_ar (+ admin form field). 058: Arabic push text says جلسة.
- scripts/exercises/lib/*.json: all 104 Arabic names on one glossary (63 renamed). scripts/programs/build.js: Arabic units inside set counts ("3 × 10 لكل جهة", was English), clearer workout titles, and it now UPDATES plan workouts in place (same week/day) instead of archiving and recreating them, so plans in progress keep their place. Both re-run against the database.
- Not verifiable here: the iPhone itself (no Xcode on this Mac). Web in Arabic checked screen by screen: Board, Train, workout, exercise library, Explore, Tribe, You.
- Follow-up (user: "titles should be right to left, they are mirroring left to right"): Txt left alignment to iOS ('auto'), which follows the phone's localization, not the app's forced RTL, so Arabic titles sat on the left. Txt now sets the start edge explicitly in Arabic (native: 'left', because React Native swaps left/right when the layout is RTL; web: 'right') and writingDirection 'rtl' on iOS for lines containing Arabic. `alignStart(lang)` / `alignEnd(lang)` exported from Txt for the few raw cases. Reasoned from the RN iOS source (RCTAttributedTextUtils.mm); not seen on a device.

### 2026-10-03 (after midnight) — Beast Captains
- User: assign someone ("beast coach or a cool name") to follow up and create activities three times a week when the community doesn't, easy to join, no pressure for a no-show; paid by the hour, outside the subscription, and Beast Tribe takes a cut from the coach. Named **Beast Captain** (Arabic: كابتن).
- DB 053 (applied): community_captains (weekly_target, hourly_rate_sar, cut_pct; members may read who/where only), app_settings 'captain' {cut_pct: 20}, events.drop_in + events.captain_hosted (set by trigger, never by the client), bt_week_start() (Sunday, Riyadh), my_captaincies(), captain_statement(from, to) (service role), push texts captain_assigned / captain_nudge, bt_captain_nudges(). 054: pg_cron 'captain-nudges' Sun/Tue/Thu 09:00 Riyadh. 055: bt_user_id_by_email(), captain_week() (service role).
- App: Board card for a captain (week against target, tap → Host in that community); Host shows "As Beast Captain": Open session (no capacity) + repeat weekly 4/8 weeks (class_series_id); sessions show an "Open session" tag, "Hosted by … · Beast Captain" and a no-pressure line above I'M IN; community page shows "Your Beast Captain"; inbox opens Host for captain notifications. Verified on web with a seeded test community (then deleted).
- Admin: /captains (this week vs target, assign by the coach's app email, edit rate/share/end, standard share, monthly statement: hours, community pays, our share, captain gets; printable), Business page line, Leads link for 'captain request'. Portal: "Your Beast Captain" card on the overview (hours, joins, billed this month) or "Ask for a Beast Captain" (lands in Leads). /for-gyms and /for-companies mention the add-on; promise reworded to "0% commission on what you sell".
- Logged-in admin/portal pages still not visually checked (no login available to me); `next build` passes.

### 2026-10-03 (late night) — Company wellness beyond steps
- User: "for companies feels a bit too little, add something more than just the step challenge".
- DB 052 (applied): challenges.metric steps|active_days|workouts|minutes|sessions + by_team + prize/prize_ar; community_teams + community_team_members (one team per member per community; choose_team()/leave_team() RPCs; cleared on leaving the community); bt_challenge_scores() (Riyadh days), challenge_board() now returns score (+steps alias) and team, challenge_team_board() ranks teams by average per entrant; communities.notice/notice_ar/notice_until/featured_program_id (column GRANT added — communities is read by column).
- App (OTA 11812c20 → build 10): challenge card shows type, prize, Teams/People tabs; joining a team challenge asks for a team first; "Your team" row; community page shows the notice and "Plan of the month" (opens /program/[slug]). Apple Health is asked only for steps challenges. Verified on web with seeded data (then removed).
- Portal: Challenges (what counts, team challenge, prize), Teams page, "Your page in the app" on the overview (notice + plan of the month), Monthly report (/partner/report, printable). /for-companies rewritten; exec brief "Why companies pay" slide now six points.
- Weekly wellbeing pulse for HR: user said "not for go-live" — parked until after launch.

### 2026-10-03 (night) — Scale rehearsal, privacy, commercial tooling, six-month plan
- User: "make sure everything is scalable", make the app more competitive, build a commercial plan + 3–6 month guide.
- Scale rehearsal (`scripts/scale/simulate.js`: 20k members / 40k sessions / 320k bookings in a rolled-back transaction, times the app's queries as a member, before and after a migration). Before: Board 8.3 s, feed 11.4 s, session roster 7.5 s. After 050: 0.12 s, 3 ms, 2 ms.
- DB 050 (applied): RLS evaluates auth.uid()/is_admin once per statement (112 policies rewritten by a DO block; is_admin STABLE); events/feed via bt_visible_community_ids(); rsvps/beasts/comments use EXISTS instead of scanning the whole parent table; indexes added, 8 duplicate indexes dropped; pg_trgm name search; profiles: authenticated may SELECT only id, full_name, display_name, avatar_url, created_at — own row through my_profile(); anon has NO table privileges; admin_roles readable by self/admin only; events.city_key + open_scope (Board by city); bt_notify sends pushes in batches of 100; challenge_board(p_challenge, p_limit=100) returns top rows + caller + entrants; join codes: wrong code returns no row and is recorded in code_attempts (10 an hour, then TOO_MANY).
- DB 051 (applied): partner_leads, business_overview() RPC, bt_partner_mrr(), plan 'venue', app_settings 'app_links'.
- App (OTA d9fea836 → build 10, runtime 5fa84627): my_profile(), Board scoped to the member's city (src/lib/cities.ts) and capped at 300, wrong-code/TOO_MANY handling, "Train on your own today" on an empty Board. Photo-upload fix OTA 44cb341c earlier the same day. Verified on web with the test account: sign-in, Board, feed, communities, wrong code, You metrics.
- Admin (deployed): LeadForm on /for-gyms and new /for-companies (server action, honeypot + per-IP/day limits); admin › Leads (pipeline, notes, create account from a lead → trial) and › Business (MRR, paying partners, trials ending, pipeline, progress vs `src/lib/targets.ts`, app download links); Club/Company Portal: setup checklist, /partner/poster (printable, QR → /get?code=…), trial/past-due banner; public /get page; fetchAll() paging in club + wellness libs (PostgREST caps at 1,000 rows); privacy policy now covers Apple Health, who-sees-what and the Mumbai data location.
- Plan: https://claude.ai/artifact/RbrxvyrniSJZyZMMLuTYy7 (checklist progress in the artifact db, `plan/progress`). Decks relabelled: revenue is year-end annual run-rate.
- Not done / next (promised in the plan): Android + Health Connect; Arabic sales pages; crash reporting + tests; teams inside a company; SMTP (needs the user's Resend key); DB compute upgrade at ~2,000 weekly actives; legal check on PDPL / data stored in India.

### 2026-10-03 (evening) — Wellness, Company Portal, pack controls, Sport patches
- Decisions (user): Apple Health steps in the next store build; companies/gyms see top movers only through OPT-IN step challenges (no app-wide leaderboard — gamification stays removed); only partners pay (members free, no premium); "crew" replaced by plain words (friends / group / pack); women-only and men-only packs; pink patches; patches use the brand guideline icons; community packs: only community admins invite; personal packs: only the leader invites.
- DB 047 (applied): daily_activity (own rows), challenges + challenge_entries + RPC challenge_board (entrants only), community_partners (package: nutritionist/coach/gym/kitchen) + RPC connect_package_expert (member starts coaching with chosen sharing), partner_type += company, nutritionist; partners plan += company.
- DB 048 (applied): packs.audience everyone|women|men (trigger checks profile gender; automatic community-pack joins skip quietly), join_pack_by_code checks audience, pink colourways blush/rose, bt_can_invite_pack + pack_invite_code() + community_invite_code(); pack_invites insert now requires bt_can_invite_pack (FIX: anyone could invite anyone to any pack); joining a community pack needs community membership.
- DB 049 (applied 2026-10-03, user is the only tester): revokes table SELECT on packs.invite_code / communities.join_code (builds ≤8 read them directly and would break).
- App: src/lib/health.ts (@kingstinct/react-native-healthkit, read steps only), src/data/wellness.ts, components/board/wellness.tsx (StepsCard on You, CommunityWellness on community page: challenges + included experts), steps sync on app open; pack create "Who can join"; pack page shows Women/Men only + who can invite; community code only for admins; keep-awake in the player; expo-video + expo-speech installed for later.
- Patches: Sport family = 26 icons extracted as vectors from the brand guidelines p.44 (scripts/brand/pack-glyphs/source/brand/*.svg; generator supports fill-rule evenodd); new Sport tab first in the picker.
- Admin: Company Portal (partner_type company: Community, People, Sessions, Challenges, Plan), Challenges page (create, ranking, cancel), Wellness panel on overview (avg steps once 5+ connected, live challenge top 5), admin community page "Package" (link nutritionist/coach/gym/kitchen + perk EN/AR), partner types Company and Nutritionist, per-seat Company plan.
- Native build 9 (iOS, HealthKit entitlement) started in Terminal tab with --auto-submit; first non-interactive attempt failed (profile lacked HealthKit) — needs the user's Apple login once.
- Decks: exec brief + "Why companies pay" slide; full deck company dashboard Built, crew wording removed.

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
