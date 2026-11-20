#!/bin/bash
# Non-destructive recovery audit, never changes apps/projects/simulators/Apple data.
set -Eeuo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
OUT="$HERE/.qa"
mkdir -p "$OUT"
STAMP="$(date '+%Y%m%d-%H%M%S')"
LOG="$OUT/recovery-preflight-$STAMP.log"
{
  echo "TAWHID KIDS NEXT: recovery preflight only / $(date -u)"
  echo "Repository: $ROOT"
  echo "Current path: $PWD"
  echo "--- Git worktree / branch ---"
  git -C "$ROOT" rev-parse --show-toplevel || true
  git -C "$ROOT" branch --show-current || true
  git -C "$ROOT" rev-parse HEAD || true
  git -C "$ROOT" status --short --untracked-files=all || true
  echo "--- Xcode selection/version ---"
  xcode-select -p 2>&1 || true
  xcodebuild -version 2>&1 || true
  echo "--- Existing Kids projects and schemes ---"
  find "$ROOT/ios/DarAlTawhidKids" -name '*.xcodeproj' -type d -print 2>/dev/null || true
  find "$ROOT/ios/DarAlTawhidKids" -name '*.xcscheme' -type f -print 2>/dev/null || true
  echo "--- Available simulator devices ---"
  xcrun simctl list devices available 2>&1 || true
  echo "--- Current Kids source checks (read only) ---"
  for file in \
    "kids/index.html" \
    "kids/start.html" \
    "kids/KIDS-DESIGN.md" \
    "kids/data/quiz-kids.json" \
    "kids/data/quiz-audio.json" \
    "kids/data/dua-kids.json" \
    "ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj/project.pbxproj" \
    "ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift"; do
    if [ -f "$ROOT/$file" ]; then shasum -a 256 "$ROOT/$file"; else echo "MISSING: $file"; fi
  done
  echo "PASS: inventory only; no files/projects/simulators modified outside this .qa report."
} > "$LOG"
echo "Read-only recovery report: $LOG"
echo "REQUIRED: compare any changed/untracked Xcode files against the current canonical GitHub main before importing changes. Never reset/clean."
