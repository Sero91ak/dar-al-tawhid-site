#!/bin/bash
set -euo pipefail

SRC="${DAR_VOICE_HOME:-$HOME/SerhatVoice}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${1:-$HOME/Desktop/DAR_Voice_Cloud_State_$STAMP.tar.gz}"

if [[ ! -d "$SRC" ]]; then
  echo "FEHLER: SerhatVoice-Verzeichnis fehlt: $SRC" >&2
  exit 2
fi

if [[ ! -s "$SRC/Serhat_Adobe_MASTER.wav" && ! -s "$SRC/Serhat_FINAL_REF.wav" ]]; then
  echo "FEHLER: Keine deutsche Master-Referenz gefunden." >&2
  exit 3
fi

ITEMS=()
for item in \
  Serhat_Adobe_MASTER.wav \
  Serhat_FINAL_REF.wav \
  Serhat_AR_MASTER.wav \
  PronunciationLearning \
  MasterPronunciations \
  AlphabetMasters \
  QuizMasters \
  KidsOwnerVoiceMasters; do
  [[ -e "$SRC/$item" ]] && ITEMS+=("$item")
done

if [[ "${DAR_VOICE_INCLUDE_HISTORY:-0}" == "1" ]]; then
  [[ -d "$SRC/VoiceStudioOutput" ]] && ITEMS+=("VoiceStudioOutput")
fi
if [[ "${DAR_VOICE_INCLUDE_EXPORTS:-0}" == "1" ]]; then
  [[ -d "$SRC/KidsAppExport" ]] && ITEMS+=("KidsAppExport")
  [[ -d "$SRC/KidsOwnerVoiceExport" ]] && ITEMS+=("KidsOwnerVoiceExport")
fi
if [[ "${DAR_VOICE_INCLUDE_RENDER_CACHE:-0}" == "1" ]]; then
  [[ -d "$SRC/RenderCache" ]] && ITEMS+=("RenderCache")
fi

if [[ "${#ITEMS[@]}" -eq 0 ]]; then
  echo "FEHLER: Keine migrierbaren Voice-Daten gefunden." >&2
  exit 4
fi

mkdir -p "$(dirname "$OUT")"
tar -C "$SRC" -czf "$OUT" "${ITEMS[@]}"
chmod 600 "$OUT"

if command -v shasum >/dev/null 2>&1; then
  HASH="$(shasum -a 256 "$OUT" | awk '{print $1}')"
else
  HASH="$(openssl dgst -sha256 "$OUT" | awk '{print $NF}')"
fi

echo "Cloud-Migrationspaket erstellt:"
echo "$OUT"
echo "SHA256: $HASH"
echo "Enthalten: ${ITEMS[*]}"
echo "WICHTIG: Dieses Paket enthält private Stimm- und Lerndaten. Nicht in Git hochladen."
