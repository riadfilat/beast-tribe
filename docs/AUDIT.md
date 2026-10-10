# Beast Tribe — Architecture Audit (9 October 2026)

Read-only review of the whole repository: the phone app, the website/dashboards, the database
migrations and the scripts. Nothing was changed while auditing. Problems are ranked by risk:
**how likely they are to cause a real failure, a leak, or slow down the next engineer.**

## The app in numbers

| Part | Size |
|---|---|
| Phone app (`app/` screens + `src/` logic) | ~25,600 lines of TypeScript |
| Website: staff dashboard, partner dashboard, public pages (`admin/`) | ~16,300 lines |
| Database changes (`supabase/migrations/`) | 90 files, ~10,700 lines of SQL |
| Automated tests | none at audit time; first ones added 10 October (`tests/`) |
| Files over 300 lines | 25 in the app, 8 on the website |

## Ranked problems

### Critical: fix first

**1. Some sports never trigger "looking for players" (confirmed bug). FIXED 10 October (migration 091, with a test).**
The database writes "Table Tennis" as `table tennis`, but the app saves sessions as `table_tennis`.
They never match, so Table Tennis, Horse Riding, Muay Thai and Jiu-Jitsu sessions never call
anyone, and partner matching skips those sports. *Fix: one small database change; about 30 minutes.*

**2. A live login password is written in the repository.**
The App Store reviewer account's password was in `CLAUDE.md` (removed from the current files today),
and an old Supabase access token sits in the git history. Anyone with the repo can read them.
*Fix: change the reviewer password, keep it in a password manager, revoke the old token, and
optionally clean the history.*

**3. No automated tests.** *(Started 10 October: `tests/` with `scripts/test.sh`; sport names and the Hijri calendar are covered. Booking, members-only and permissions are next.)*
Booking clashes, members-only courts, women-only sessions and the price split are all
checked only by hand. Every change risks breaking one of them silently.
*Fix: a test suite for the database rules (they're the source of truth), run before every release.*

### High: will hurt as the app grows or a new engineer joins

**4. The database can't be rebuilt from the migrations folder.**
Some files depend on things that only exist in the live database, one deletes tables no file
creates, and nothing records which files were applied. A new engineer can't set up a copy.
*Fix: take a clean snapshot of the live schema as the new starting point, then keep migrations in order.*

**5. The same rule is written in several places.**
- The court price split is calculated in 7 places with different formulas (the database is right; some screens show a different preview).
- Cities, distances, levels, durations and money formatting each exist two or three times.
- Fix one copy and the others stay wrong.

*Fix: one shared function per rule; screens only display what it returns.*

**6. Some screens are too big and mix rules with layout.**
`app/host.tsx` (Play) is 974 lines and handles courts, coaches, routes, captains and workouts in one
file. Booking rules, level rules and time rules live inside screens instead of in `src/data`.
*Fix: split Play into small sections and move the rules into data/domain files.*

**7. Sports have no single source of truth.**
Adding a sport means editing 6–9 files (sports list, English, Arabic, dashboard list, database row,
the name-matching function, photos, default spots). Nothing checks they agree, which is how bug 1
happened. *Fix: one sport file per sport, with everything else generated or read from it.*

**8. Creating a session is several separate steps with no "all or nothing".**
If the phone loses signal halfway, a session can be created without its court status, repeats or
coach booking. *Fix: one database function that does the whole thing at once.*

### Medium: worth doing, not urgent

**9. Two different time checks:** Play allows a start 5 minutes in the past, Edit requires 5 minutes in the future.
**10. The dashboard uses the "master key"** (service role) on many partner pages and checks ownership in code; one missed check would show one partner another's data. Moving those reads behind database rules is safer. *(10 October: the leader dashboard and HQ command center check permissions in tested database functions; the classic staff pages still use the master key.)*
**11. Words differ between screens, code and database:** Group / pack, Play / host, Session / event, Community / club, and three meanings of "partner". A glossary helps; renames can come later.
**12. Switched-off features still ship:** about 3,400 lines of Train (workouts) code, plus Nutrition and coach screens. They add size, and Play still loads 500 workouts it never shows.
**13. Hardcoded values:** plan prices, limits (50 km, 80 km, 12 weeks, waiting list of 3), the website address, Riyadh as the fallback city, and Andorra photos used as the default picture for some sports.
**14. Few rate limits:** posts, chat, joins and route saves have none.
**15. Preview/demo data ships inside the real app** (240+ branches).

### Low

**16.** Five early database functions run with elevated rights without a fixed search path (probably replaced later; needs checking).
**17.** The migration script doesn't verify the database's security certificate.
**18.** The automatic build files (`.github/`) were never switched on, so nothing runs checks on GitHub.

## What is in good shape

- **Security rules live in the database** (row-level security and triggers), not only in the app, so a modified app can't get around them. This was tested by hand after the October 4 hardening.
- **Every dashboard action checks who is calling** (staff role or partner ownership).
- **No server keys or database passwords** are in the repository. The key in `eas.json` is the public one, which is safe by design.
- **Most screens read data through one layer** (`src/data/*`) that does caching and error handling.
- **English and Arabic** (right-to-left) are complete and kept side by side.

## Suggested order (each step waits for your OK)

1. Fix bug 1 and move the reviewer password out (small, safe).
2. Add database rule tests for booking, members-only access and permissions (rule 7).
3. Rebuild the migrations baseline (problem 4).
4. Make sports self-contained (problem 7), then split Play (problem 6) and unify the price split (problem 5).
5. Remove or isolate switched-off Train code (problem 12).
