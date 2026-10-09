# Beast Tribe — Rules for working in this repo

Beast Tribe is a community sports app by Operation Beast (Saudi activewear brand): members find,
join and host sessions with their communities. Phone app (Expo / React Native) at the repo root,
website and dashboards in `admin/` (Next.js on Vercel), database in Supabase.

**Read first:** `ARCHITECTURE.md` (how it's organised), `DECISIONS.md` (why), `docs/AUDIT.md`
(known problems), `PRODUCT.md` (what the product is), `DESIGN.md` (how it looks).
History of past work: `docs/SESSION-LOG.md`.

The owner is not an engineer. Keep everything understandable to them and to any developer they hire.

## The rules

1. **Plan first.** For any feature, show a short plan (files to touch, schema changes, risks) and wait for the owner's OK before writing code.
2. **Each sport is a self-contained module.** Sports are built on shared components, and adding a sport must never require editing other sports.
   - Today a sport is spread over several files (see docs/AUDIT.md, problem 7); the target is one file per sport.
   - Workouts are optional for a sport: a sport can exist without any.
3. **Community courts and booking are their own domain**, separate from workouts and sessions' display code.
   - They have their own data models, permissions (members-only visibility) and rules.
   - Never put business logic in UI code: screens display, the data layer and the database decide.
4. **Keep files small** (about 300 lines max) and functions single-purpose. Split before they grow.
5. **No duplicated logic.** Extract and reuse shared code. If the app and the website need the same rule, it belongs in the database or in one shared module.
6. **Database changes only through migrations**, numbered files in `supabase/migrations/`, explained to the owner in plain language. Never change the live database by hand.
7. **Write tests for business logic** (booking conflicts, member access, permissions) and run them before saying a task is done.
8. **Never hardcode secrets, API keys or content data** in code. Secrets live in environment variables or the password manager, never in this repo or its docs. Content (places, prices, sport lists) belongs in the database or a config file.
9. **After every task:**
   - update `ARCHITECTURE.md` and `DECISIONS.md`
   - add a line to `docs/SESSION-LOG.md`
   - give the owner a 3–5 line plain-English summary of what changed and why
10. **Push back.** If a request would hurt the architecture, say so and propose a better approach instead of just doing it.
11. **Prefer simple, well-known patterns** over clever ones.

## Working notes (how things are done here)

**Releasing**
- **App update** (most changes): `scripts/release/ship-update.sh "message"`. It reaches iPhone AND Android; the Expo token comes from the local memory file, never the repo.
- **Native change** (new package, permission, icon) changes the "runtime" fingerprint. It needs new store builds for both platforms (`eas build`); updates only reach builds with the same runtime.
- **Website:** push the branch to GitHub `main`; Vercel deploys in about 2 minutes.
- **Database:** add a migration file, test it inside a transaction that is rolled back, then apply it with `PG_URL=… node scripts/run-migration.js <file>`. The connection string lives in local memory only.

**Traps that have bitten before**
- **Column-level permissions (since migration 073):** a new column on `profiles`, `events`, `event_rsvps`, `feed_posts`, `feed_comments` or `pack_members` is invisible to the app until you `GRANT` it to `authenticated`.
- **Don't edit `eas.json` or `app.json` without planning new builds:** they change the runtime fingerprint.
- **Other Claude sessions push to `main` too.** `git fetch` and check `origin/main` before building.
- **Train is off** (`TRAIN_ENABLED=false` in the app and website): add no workout entry points until the owner says so.
- **Members see "Group", the code says `pack`.** "Team" means company teams only.
- **No gamification** (points, levels on show, leaderboards). Level ratings stay private.
- **Every update goes to both iPhone and Android.**
- **Photos:** conservative, people fully clothed, no signage. Icons come from professional sets (game-icons.net, SF Symbols, Material Community Icons), never hand-drawn.

**Accounts and IDs** (not secrets): Supabase project `doqpqzxqgszsybghgtfq` (Mumbai) · Expo `ryo1987`, project `b9a69ad8-8fff-4877-a53b-3c9162c431b7` · bundle `com.operationbeast.beasttribe` · App Store Connect app `6762473448` · website `https://beast-tribe.vercel.app`. Passwords and tokens are never written here.
