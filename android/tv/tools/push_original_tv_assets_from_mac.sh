#!/usr/bin/env bash
# Safe one-time importer for owner-approved tvOS artwork.
# Runs on owner's Mac using EXISTING GitHub credentials, isolated git worktree.
# Does NOT modify current local iOS/TV working tree, main or other apps.
set -euo pipefail

REPO="${2:-$HOME/Documents/dar-al-tawhid-site}"
BUNDLE="${1:-$HOME/Downloads/DAR_AL_TAWHID_ANDROID_TV_ORIGINAL_ASSETS_OPTIMIZED.zip}"
BRANCH="feat/android-tv-apple-tv-layout-parity-20261009"
TARGET="android/tv/src/main/res/drawable-nodpi"

if [[ ! -f "$BUNDLE" ]]; then
  printf >&2 'Originalbild-Paket nicht gefunden: %s\n' "$BUNDLE"
  exit 2
fi
if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf >&2 'Kein Git-Repository unter %s\n' "$REPO"
  exit 2
fi
REMOTE="$(git -C "$REPO" remote get-url origin)"
if [[ ! "$REMOTE" =~ github\.com[:/]Sero91ak/dar-al-tawhid-site(\.git)?$ ]]; then
  echo >&2 "Sicherheitssperre: falsches GitHub-Repository."
  exit 2
fi
for command in unzip python3 git; do
  command -v "$command" >/dev/null || { echo >&2 "Fehlt: $command"; exit 2; }
done
if ! unzip -tq "$BUNDLE" >/dev/null; then
  echo >&2 "Originalbild-Paket ist beschädigt."
  exit 2
fi

echo "Lade ausschließlich Android-TV-Entwicklungszweig von GitHub …"
git -C "$REPO" fetch --no-tags origin "refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"

# Separate detached worktree: user's Xcode project, local uncommitted work,
# staging and main are never checked out, reset, stashed, or modified.
WORKTREE="$(mktemp -d "${TMPDIR:-/tmp}/dar-tv-assets-XXXXXXXX")"
cleanup() {
  git -C "$REPO" worktree remove --force "$WORKTREE" 2>/dev/null || true
  rmdir "$WORKTREE" 2>/dev/null || true
}
trap cleanup EXIT
git -C "$REPO" worktree add --detach "$WORKTREE" "refs/remotes/origin/$BRANCH"
mkdir -p "$WORKTREE/$TARGET"

if [[ -n "$(find "$WORKTREE/$TARGET" -maxdepth 1 -name 'tv_kaaba_*.webp' -o -name 'tv_brand_mark.webp')" ]]; then
  # Existing images are acceptable ONLY if verified against the locked SHA.
  echo "Prüfe vorhandene TV-Bilder …"
  python3 "$WORKTREE/android/tv/tools/check_original_tv_assets.py" --require --root "$WORKTREE" || exit 2
  echo "Bereits vollständig und korrekt eingebunden; kein erneuter Upload nötig."
  exit 0
fi
unzip -j -qq "$BUNDLE" 'drawable-nodpi/*.webp' -d "$WORKTREE/$TARGET"
python3 "$WORKTREE/android/tv/tools/check_original_tv_assets.py" --require --root "$WORKTREE"

# Whitelist EXACTLY the original TV assets; never upload the project ZIP,
# Xcode files, secrets, personal documents, phone or Kids resources.
while IFS= read -r file; do
  git -C "$WORKTREE" add -- "$TARGET/$file"
done < <(python3 - "$WORKTREE/android/tv/tools/original_asset_lock.json" <<'PY'
import json, sys
for item in json.load(open(sys.argv[1]))["resource_files"]:
    print(item["name"])
PY
)
CHANGED="$(git -C "$WORKTREE" diff --cached --name-only)"
if [[ -z "$CHANGED" ]]; then
  echo "Keine Änderungen notwendig."
  exit 0
fi
if [[ "$(printf '%s\n' "$CHANGED" | wc -l | tr -d ' ')" != "10" ]]; then
  echo >&2 "Sperre: Erwartet werden genau 10 überprüfte TV-Bilder."
  exit 2
fi
git -C "$WORKTREE" commit -m "assets(android-tv): import ten verified Apple TV original Kaaba scenes and mark"
git -C "$WORKTREE" push origin "HEAD:refs/heads/$BRANCH"
echo "Fertig: exakt zehn verifizierte Android-TV-Bilder im bestehenden PR #911."
echo "Kein Public-Deploy und keine APK-Veröffentlichung ausgelöst."
