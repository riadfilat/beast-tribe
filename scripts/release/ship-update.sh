#!/bin/bash
# Publish one over-the-air update to BOTH iPhone and Android.
#   EXPO_TOKEN=… scripts/release/ship-update.sh "what changed"
# Both the production channel (store / TestFlight builds) and the preview channel (Android test APK)
# follow the "production" branch, so this one publish reaches every installed build whose runtime matches.
set -euo pipefail
cd "$(dirname "$0")/../.."
MSG="${1:?Say what changed, e.g. ship-update.sh \"Court booking fixes\"}"
: "${EXPO_TOKEN:?Set EXPO_TOKEN}"
EAS="${EAS_BIN:-npx -y eas-cli}"

echo "▸ Type check"
npx tsc --noEmit -p .

echo "▸ Runtime of each platform (an update only reaches builds with the same runtime)"
for p in ios android; do
  echo "  $p: $(npx expo-updates runtimeversion:resolve --platform $p 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).runtimeVersion)}catch{console.log("?")}})')"
done

echo "▸ Publishing for iOS and Android"
OUT=$($EAS update --channel production --environment production --platform all --non-interactive --message "$MSG" 2>&1)
echo "$OUT" | grep -E "Runtime version|Update group ID|Platform|EAS Dashboard|Published|Error|error" || echo "$OUT" | tail -20
GROUP=$(echo "$OUT" | grep -m1 "Update group ID" | awk '{print $NF}')
[ -n "$GROUP" ] && echo "▸ Check installs later: node scripts/release/installs.js $GROUP"
