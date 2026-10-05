#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---stdin}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

before_total=0
after_total=0
changed_count=0
skipped_count=0

is_protected() {
  local f="$1"
  [[ "$f" =~ (^|/)(Assets\.xcassets|AppIcon|app-icons|icons?|logos?|favicons?|watermarks?|badges?|seals?)(/|$) ]] && return 0
  [[ "$(basename "$f")" =~ (logo|watermark|favicon) ]] && return 0
  [[ "$f" =~ (^|/)(originals?|masters?|sources?|raw)(/|$) ]] && return 0
  [[ "$f" =~ (-master|\.master)\.(png|jpe?g|webp|mp4)$ ]] && return 0
  [[ "$f" == "kids/assets/kids-brand/logo-mark.png" ]] && return 0
  return 1
}

is_voice_asset() {
  local f="${1,,}"
  [[ "$f" =~ (voice|story|stories|quiz|alphabet|narrat|speech|kids[-_/].*audio|owner[-_/].*audio|dua[-_/].*audio) ]]
}

replace_if_smaller() {
  local src="$1" tmp="$2" old new
  [[ -s "$tmp" ]] || return 0
  old=$(stat -c%s "$src")
  new=$(stat -c%s "$tmp")
  if (( new + (old / 50) < old )); then
    mv "$tmp" "$src"
    before_total=$((before_total + old))
    after_total=$((after_total + new))
    changed_count=$((changed_count + 1))
    printf 'optimized %s: %s -> %s bytes\n' "$src" "$old" "$new"
  else
    rm -f "$tmp"
    skipped_count=$((skipped_count + 1))
  fi
}

opt_image() {
  local f="$1" ext tmp size
  ext="${f##*.}"
  ext="${ext,,}"
  size=$(stat -c%s "$f")
  (( size >= 120000 )) || { skipped_count=$((skipped_count + 1)); return; }

  case "$ext" in
    jpg|jpeg)
      tmp="$TMP_DIR/$(basename "$f").jpg"
      convert "$f" -auto-orient -strip -resize '2200x2200>' -sampling-factor 4:2:0 -interlace Plane -quality 78 "$tmp" 2>/dev/null || return 0
      replace_if_smaller "$f" "$tmp"
      ;;
    png)
      local pre="$TMP_DIR/$(basename "$f").pre.png"
      tmp="$TMP_DIR/$(basename "$f").png"
      convert "$f" -auto-orient -strip -resize '2880x2880>' "$pre" 2>/dev/null || cp "$f" "$pre"
      if pngquant --quality=60-82 --speed 2 --strip --force --output "$tmp" -- "$pre" >/dev/null 2>&1; then
        replace_if_smaller "$f" "$tmp"
      fi
      rm -f "$pre"
      # Zweiter Pass nur für weiterhin sehr große Laufzeit-PNGs.
      # Ziel: unter 1,2 MB bleiben, ohne normale Assets unnötig aggressiv anzufassen.
      if (( $(stat -c%s "$f") > 1200000 )); then
        local tight_pre="$TMP_DIR/$(basename "$f").tight.pre.png"
        local tight="$TMP_DIR/$(basename "$f").tight.png"
        convert "$f" -auto-orient -strip -resize '2000x2000>' "$tight_pre" 2>/dev/null || cp "$f" "$tight_pre"
        if pngquant --quality=52-76 --speed 1 --strip --force --output "$tight" -- "$tight_pre" >/dev/null 2>&1; then
          replace_if_smaller "$f" "$tight"
        fi
        rm -f "$tight_pre" "$tight"
      fi
      ;;
    webp)
      tmp="$TMP_DIR/$(basename "$f").webp"
      convert "$f" -auto-orient -strip -resize '2200x2200>' -quality 76 "$tmp" 2>/dev/null || return 0
      replace_if_smaller "$f" "$tmp"
      ;;
  esac
}

opt_video() {
  local f="$1" tmp size
  size=$(stat -c%s "$f")
  (( size >= 800000 )) || { skipped_count=$((skipped_count + 1)); return; }
  tmp="$TMP_DIR/$(basename "$f").mp4"
  if [[ "$f" == kids/assets/kids-cinema/* ]]; then
    ffmpeg -hide_banner -loglevel error -y -i "$f" \
      -map 0:v:0 -map '0:a?' \
      -vf "scale='min(720,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease" \
      -c:v libx264 -preset medium -crf 30 -pix_fmt yuv420p \
      -c:a aac -b:a 64k -movflags +faststart \
      "$tmp" || { rm -f "$tmp"; return 0; }
  else
    ffmpeg -hide_banner -loglevel error -y -i "$f" \
      -map 0:v:0 -map '0:a?' \
      -vf "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease" \
      -c:v libx264 -preset medium -crf 29 -pix_fmt yuv420p \
      -c:a aac -b:a 80k -movflags +faststart \
      "$tmp" || { rm -f "$tmp"; return 0; }
  fi
  replace_if_smaller "$f" "$tmp"
}

opt_voice() {
  local f="$1" ext tmp size bitrate
  is_voice_asset "$f" || { skipped_count=$((skipped_count + 1)); return; }
  size=$(stat -c%s "$f")
  (( size >= 250000 )) || { skipped_count=$((skipped_count + 1)); return; }

  bitrate="$(ffprobe -v error -select_streams a:0 -show_entries stream=bit_rate -of default=nw=1:nk=1 "$f" 2>/dev/null | head -n1 || true)"
  if [[ "$bitrate" =~ ^[0-9]+$ ]] && (( bitrate <= 52000 )); then
    skipped_count=$((skipped_count + 1))
    return
  fi

  ext="${f##*.}"
  ext="${ext,,}"
  case "$ext" in
    m4a|aac)
      tmp="$TMP_DIR/$(basename "$f").m4a"
      ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 1 -ar 48000 -c:a aac -b:a 48k -movflags +faststart "$tmp" || return 0
      ;;
    mp3)
      tmp="$TMP_DIR/$(basename "$f").mp3"
      ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 1 -ar 48000 -c:a libmp3lame -b:a 48k "$tmp" || return 0
      ;;
    *)
      return 0
      ;;
  esac
  replace_if_smaller "$f" "$tmp"
}

process_one() {
  local f="$1" ext
  [[ -f "$f" ]] || return 0
  is_protected "$f" && { skipped_count=$((skipped_count + 1)); return 0; }
  ext="${f##*.}"
  ext="${ext,,}"
  case "$ext" in
    jpg|jpeg|png|webp) opt_image "$f" ;;
    mp4) opt_video "$f" ;;
    m4a|aac|mp3) opt_voice "$f" ;;
  esac
}

if [[ "$MODE" == "--residual" ]]; then
  for f in \
    "kids/assets/kids-cinema/intro-final.mp4" \
    "kids/assets/kids-cinema/intro-ios.mp4" \
    "kids/assets/kids-cinema/intro-v74.mp4" \
    "kids/assets/prophet-story-audio/adam/story.mp3" \
    "kids/assets/prophet-story-audio/muhammad/story.mp3"
  do
    process_one "$f"
  done
elif [[ "$MODE" == "--all" ]]; then
  while IFS= read -r -d '' f; do
    process_one "$f"
  done < <(find assets kids/assets content apple-tv ios test/assets -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.mp4' -o -iname '*.m4a' -o -iname '*.aac' -o -iname '*.mp3' \) \
    -print0 2>/dev/null)
else
  while IFS= read -r f; do
    [[ -n "$f" ]] && process_one "$f"
  done
fi

python3 scripts/update-local-media-metadata.py

saved=$((before_total - after_total))
printf 'MEDIA_OPTIMIZE_SUMMARY changed=%s skipped=%s saved_bytes=%s\n' "$changed_count" "$skipped_count" "$saved"
