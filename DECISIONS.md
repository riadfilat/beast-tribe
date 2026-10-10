# Beast Tribe — Decision Log

Major technical decisions: **what** was decided, **why**, and **what was rejected**. Newest first.
Add an entry whenever a choice would surprise a new engineer (CLAUDE.md, rule 9).

---

### 2026-10-10 · The super admin can delete a member's account
- **What:** a "Delete account" box on a person's page in People, for the super admin only, after typing their full name. The database function `delete_member()` refuses yourself, HQ staff and community leaders, logs the deletion (full name only) and deletes the account the same way "Delete account" in the app does.
- **Why:** the owner asked for it; members can ask for their data to be removed (Saudi PDPL). Suspend stays the reversible choice for problem accounts.
- **Found on the way:** links in the database blocked ANY account deletion, including members deleting themselves in the app, once they had reported a post, booked a coach or created a business (an App Store requirement). Migration 099 lets go: what is theirs goes with them; what they did for others stays without their name.

### 2026-10-10 · One dashboard look: the classic staff pages moved into HQ
- **What:** every staff page now lives in HQ in the board look, with a shorter menu: Dashboard and Business became the command center and Growth; Communities and Partners became Leaders & communities and Businesses; Feed and Moderation became one Safety page. Old addresses forward. Only the workout library stays in the classic area while Train is off.
- **Why:** the owner wanted the whole dashboard as simple and consistent as the new HQ and leader dashboard.
- **Fixed on the way:** reports can be resolved or dismissed and hidden posts restored (F4, F5); one staff session form with men-only and a community picker (F7); session times were saved as UTC (an 18:00 session showed at 9 pm); hiding a place never worked; saving a school community turned it into a club; the business and comment pages joined people through a link that doesn't exist and showed no names; People's "active" used a field the app never writes (now `member_days`).

### 2026-10-10 · The command center counts in the database, and shows only real numbers
- **What:** every number on the HQ command center comes from a tested database function that only HQ admins can call. Growth shows leads, revenue, sign-ups and first sessions from our own data; social, website visits and app installs say "not connected yet" until each account is connected with its business login.
- **Why:** the owner wants to see everything, but a number we can't back up is worse than none.
- **Rejected:** placeholder or estimated social numbers; giving the website the social passwords.

### 2026-10-10 · The old partner dashboard is retired
- **What:** `admin/src/app/(partner)` and its helpers (`capabilities.ts`, `club.ts`, `wellness.ts`) were removed; leaders and supporters use `/leader`, staff use `/hq`. People with only an old partner login see "ask your community leader or Beast Tribe to add you".
- **Why:** no live partner used it (Andorra has no login; the other was a test account), and two dashboards for the same job confuse everyone.
- **Not yet moved:** company step challenges and the printable join poster; they come back in the leader dashboard if leaders ask for them.

### 2026-10-10 · One kind of community leader who switches features on
- **What:** the dashboard is for community leaders (and the supporters they add). A leader can be a coach, gym, trainer, company HR or activation lead, or several at once, and switches on what they run: courts and booking, guest passes, 1:1 coaching, nutrition, company teams.
- **Why:** the owner found the dashboard unclear; fixed partner types decided the pages, and real leaders are often several kinds at once.
- **Rejected:** keeping 9 fixed partner types (the old `PARTNER_KINDS`); separate portals per kind.

### 2026-10-10 · The database decides who may do what in the leader dashboard
- **What:** leader actions that need permission (features, supporters, who paid, the Home numbers) call database functions with the person's own sign-in token; the functions check the role. Supporters never get money back from them.
- **Why:** the audit found the old dashboard checked ownership only in website code (problem 10). Database checks are tested (`tests/db/team.test.js`, `overview.test.js`) and can't be skipped by a bug in a page.
- **Found by the tests:** a "no role" check that let anyone through (fixed before going live with `IS NOT DISTINCT FROM`).

### 2026-10-10 · Supporters never see money
- **What:** supporters post sessions and check players in, but see no prices, income or payments, and can't change courts, features or the profile.
- **Why:** the owner's decision.

### 2026-10-10 · "Where members are" = city and phone type, once a day
- **What:** the app records one row per member per day (`member_days`): the city, iPhone or Android, the app language. No exact location, no IP address; deleted after 400 days.
- **Why:** the command center needs active members and cities; this matches the "approximate location" declared to Apple and Google. The privacy policy says so.
- **Rejected:** storing positions or IP addresses (more than we need).

### 2026-10-10 · Hijri birthdays: a way to pick, not a way to store
- **What:** the date-of-birth picker has a Gregorian | Hijri switch (Umm al-Qura, the official Saudi calendar). The profile still stores a Gregorian date; the field shows both.
- **Why:** many Saudi members know their birthday in Hijri; storing one calendar keeps ages, sorting and the database simple.
- **How:** `hijri-converter` (MIT, small, pure JavaScript, so it ships as a normal update).
- **Rejected:** storing Hijri dates (two formats everywhere); the phone's built-in Hijri calendar (support differs between iPhone and Android and can't convert Hijri back to Gregorian); writing our own converter.

### 2026-10-10 · Tests run from `scripts/test.sh`, not package.json
- **What:** `scripts/test.sh` (app logic) and `scripts/test.sh db` (database rules, each test rolled back).
- **Why:** the "scripts" section of package.json is part of the app's runtime fingerprint: adding `npm test` there would have forced new store builds.
- **Rejected:** a test framework such as Jest (Node's built-in test runner is enough for now and adds nothing to the app).

### 2026-10-09 · Place search never sends the member's position
- **What:** route-drawing search goes to Photon (OpenStreetMap search) with the typed words and the city or place, not the phone's position.
- **Why:** privacy, and so the Google Play data-safety form can honestly say no location is shared.
- **Rejected:** biasing by the exact position (slightly better results, but leaks location); Google Places (paid, needs a key, sends more data).

### 2026-10-08 · Maps: MapLibre + OpenFreeMap with our own style
- **What:** a native map component (MapLibre) showing OpenStreetMap data from OpenFreeMap, recoloured to the brand (`admin/public/map/beast.json`). Builds without the map draw routes as a sketch.
- **Why:** free, no API key, fully brand-styled, works on both platforms.
- **Rejected:** Google Maps (key + billing, Android-only styling limits); Apple Maps via react-native-maps (iPhone only, can't be branded); Mapbox (paid at scale).
- **Cost:** needed a new store build (iOS 14 / Android 5–6).

### 2026-10-09 · Routes: tap points, tied to a place
- **What:** a track is drawn by tapping points around a chosen place; saved tracks belong to that area and the most-run one is offered first.
- **Why:** freehand drawing was unreliable on phones; most runs happen in a handful of known parks.
- **Rejected:** freehand finger drawing (tried, removed); GPS-recorded routes (needs background location, a much bigger privacy ask).

### 2026-10-08 · Courts without an integration: the host owns the booking
- **What:** for venues not connected to us, the host marks *booked* or *I'll book it*, can add a price, and everyone sees their share before joining; reminders nudge the host.
- **Why:** keeps the journey simple without integrations; makes responsibility clear.
- **Rejected:** scraping or integrating each venue's booking system (slow, fragile); auto-cancelling unbooked sessions (too harsh; we warn instead).

### 2026-10-04 · Court price split equally between players who are in
- **What:** `share = court price ÷ players in`, recalculated on every join or leave (`bt_court_resplit`).
- **Why:** fair, and nobody ends up paying for empty spots.
- **Rejected:** the organiser covering empty spots (felt unfair); fixed price per spot (wrong when the court isn't full).

### 2026-10-03 · Payments staged: pay at the venue
- **What:** the app shows each person's share; the venue ticks *paid*. Online payment is behind `PAYMENTS_ENABLED=false`.
- **Why:** online payment needs a merchant account (Moyasar or Tap) in the owner's name; the split had to be clear now.
- **Rejected:** collecting money through Beast Tribe now (licensing, refunds, merchant setup).

### 2026-10-03 · Revenue: flat B2B subscriptions, 0% commission, members free
- **What:** companies, gyms, venues and coaches pay a flat monthly plan; members never pay; no cut of guest fees or bookings.
- **Why:** partners never have a reason to take members off the app; pricing stays simple.
- **Rejected:** commission on bookings; a member premium tier; ads.

### 2026-10-03 · One partner dashboard for every business type
- **What:** one dashboard where `admin/src/lib/capabilities.ts` decides which sections each partner type sees.
- **Why:** one codebase to maintain; partners that do several things (a gym with courts) get both.
- **Rejected:** a separate portal per partner type.

### 2026-10-04 · Communities are created by Beast Tribe; groups live inside communities
- **What:** members request a community; staff create it. Groups (friends, crews) always belong to a community.
- **Why:** communities are the paid product for companies and gyms; this ended the overlap between "community" and "group".
- **Rejected:** member-created communities and clubs (removed, migration 072).

### 2026-10-04 · Security in the database, with column-level permissions
- **What:** row-level security on every table, triggers that block forbidden changes, and per-column write permissions (migration 073).
- **Why:** the app can be modified by anyone; only the database can be trusted.
- **Cost:** every new column needs an explicit permission (a known trap; see CLAUDE.md).
- **Rejected:** checking rules only in the app or only in server code.

### 2026-10-04 · Train (workouts) switched off for launch
- **What:** `TRAIN_ENABLED=false`. The code and content stay, hidden.
- **Why:** focus the launch on finding and joining sessions; Train wasn't finished.
- **Rejected:** deleting it (the content took real work and will come back).

### 2026-10-04 · "Group" instead of "pack" for members
- **What:** the screens say Group / مجموعة; the code and database still say `packs`.
- **Why:** simpler word; "team / فريق" is reserved for company teams.
- **Rejected:** renaming the database (risky for little gain).

### 2026-10-04 · Level ratings are private
- **What:** teammates rate each other's level after a session; nobody can read the ratings. They only guide matching and call-outs.
- **Why:** avoid judgement and gamification while still matching similar levels.
- **Rejected:** visible levels, scores or leaderboards.

### 2026-06 · No gamification
- **What:** XP, tiers, badges, streaks and leaderboards were removed.
- **Why:** the owner wanted a simpler app about showing up, not points.
- **Rejected:** keeping a lighter points system.

### 2026-04 · Updates over the air, store builds only for native changes
- **What:** most changes ship through EAS Update (`scripts/release/ship-update.sh`) to both platforms. The "runtime" fingerprint decides which installed builds can take an update.
- **Why:** minutes instead of a store review for every fix.
- **Rule that follows:** adding a native package changes the fingerprint and needs new builds for both platforms.

### 2026-04 · Stack: Expo (React Native) + Supabase + Next.js on Vercel
- **What:** one TypeScript codebase for iPhone and Android, Supabase for the database, sign-in and storage, a Next.js website for the dashboards.
- **Why:** small team, one language, managed hosting, strong database rules.
- **Rejected:** separate native apps (Swift/Kotlin); Firebase (weaker for relational data and rules).

### 2026-09 · English and Arabic from day one
- **What:** every word lives in `src/i18n/strings/en.ts` and `ar.ts`; the layout mirrors for Arabic.
- **Why:** launch market is Saudi Arabia and the Gulf.
- **Rejected:** adding Arabic later.

### Open decisions (recorded so they aren't forgotten)
- **Database migrations are applied by hand** with `scripts/run-migration.js`, not the Supabase CLI, because the CLI token kept expiring. Downside: nothing records which files ran (docs/AUDIT.md, problem 4).
- **Few automated tests so far** (sport names, Hijri calendar). Booking, members-only access and permissions are next (CLAUDE.md, rule 7).
