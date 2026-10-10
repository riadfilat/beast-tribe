#!/bin/sh
# Runs the automated tests (CLAUDE.md, rule 7).
#   scripts/test.sh        app logic tests (no network)
#   scripts/test.sh db     database rule tests; needs PG_URL (local memory, never the repo).
#                          Every test runs in a transaction that is rolled back.
# Kept out of package.json on purpose: changing its "scripts" changes the app's runtime
# fingerprint, which would force new store builds.
set -e
cd "$(dirname "$0")/.."
if [ "$1" = "db" ]; then
  exec node --test tests/db/*.test.js
fi
exec node --experimental-strip-types --no-warnings --test tests/*.test.mjs
