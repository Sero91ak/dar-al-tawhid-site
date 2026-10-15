#!/usr/bin/env python3
"""Import ALREADY PAID original ElevenLabs Flow MP3 files, without calling ElevenLabs.

Supports the complete 56 known V4 take IDs from 20 original quiz questions.
Place unmodified downloads named <generationId>.mp3 in a private local inbox;
never commit the inbox or signed ElevenLabs download URLs.

- --audit: no writes, prints which original IDs are still missing.
- --import: validates and copies available originals into the GitHub review
  audio directory, updates text and generation registries, and preserves all
  existing directly paid MP3s. Human approval remains FALSE.
- --strict: require all 56 originals locally present; no changes.

All actions are offline and consume ZERO generation credits.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAID = ROOT / "kids/data/quiz-v4-batch-001-020-review.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
IMPORT_LOG = ROOT / "kids/data/quiz-v4-paid-flow-import-log.json"
OUTPUT = ROOT / "kids/assets/kids-quiz-audio/v4-original-paid-flow-review"
DEFAULT_INBOX = ROOT / "kids/paid-flow-originals-inbox"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
PARTS = {
    "question": "questionAudioText", "correct": "correctAudioText",
    "retry": "retryAudioText", "explanation": "explanationAudioText",
}
Q002 = {
    "question-opening": "Schau, was du schon alles weißt.",
    "question-core": "Ist Allah Einer?",
    "question-guidance": "Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein.",
}


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path):
    result = hashlib.sha256()
    with path.open("rb") as handle:
        for buf in iter(lambda: handle.read(1024 * 1024), b""):
            result.update(buf)
    return result.hexdigest()


def inventory():
    source = load(PAID)
    if source.get("voiceId") != VOICE or source.get("modelId") != MODEL:
        raise RuntimeError("Voice/model mismatches original paid V4 ledger")
    items = source.get("items") or []
    if len(items) != 20:
        raise RuntimeError("Expected 20 already paid quiz questions")
    if " ".join(Q002.values()) != next(
        q["questionAudioText"] for q in items if q["questionId"] == "kids-quiz-002"
    ):
        raise RuntimeError("Original #002 three-part text mismatch")
    expected = {}
    for question in items:
        if question["modelId"] != MODEL or question["voiceId"] != VOICE:
            raise RuntimeError("Wrong original voice for " + question["questionId"])
        for take in question.get("recordings", []):
            part = take["part"]
            phrase = (Q002.get(part) if question["questionId"] == "kids-quiz-002" else None)
            if phrase is None:
                field = PARTS.get(part)
                if not field:
                    raise RuntimeError("Unknown previously paid segment part " + str(part))
                phrase = question[field]
            gid = take["generationId"]
            if not re.fullmatch(r"[A-Za-z0-9]{20}", gid):
                raise RuntimeError("Original paid generation ID invalid")
            if gid in expected:
                if expected[gid]["text"] != phrase:
                    raise RuntimeError("Original paid generation ID used for two texts")
                continue
            expected[gid] = {
                "generationId": gid,
                "questionId": question["questionId"],
                "part": part,
                "text": phrase,
                "creditsPreviouslyPaid": float(
                    take.get("credits", take.get("creditsPreviouslyPaid", 0))
                ),
                "durationSeconds": float(take.get("durationSeconds") or 0),
                "flowId": take.get("flowId") or question.get("flowId"),
                "modelId": MODEL,
                "voiceId": VOICE,
            }
    if len(expected) != 56:
        raise RuntimeError("56 original paid generation IDs expected")
    return expected


def probe(path, duration_hint):
    data = path.read_bytes()
    if len(data) < 1500 or not (data.startswith(b"ID3") or data[:1] == b"\xff"):
        raise RuntimeError("Invalid/missing original MP3 header")
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_name,codec_type", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    )
    meta = json.loads(proc.stdout)
    audio = [row for row in meta.get("streams", []) if row.get("codec_type") == "audio"]
    seconds = float((meta.get("format") or {}).get("duration") or 0)
    if len(audio) != 1 or audio[0].get("codec_name") != "mp3":
        raise RuntimeError("Expected one readable MP3 audio track")
    if not 0.35 < seconds < 240:
        raise RuntimeError("Implausible MP3 length")
    if duration_hint and abs(seconds - duration_hint) > max(1.8, duration_hint * 0.2):
        raise RuntimeError(f"Original MP3 duration differs from paid take metadata ({seconds:.1f}/{duration_hint:.1f})")
    return seconds


def safe_audio_url(path):
    return "/" + str(path.relative_to(ROOT))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, default=DEFAULT_INBOX)
    modes = p.add_mutually_exclusive_group()
    modes.add_argument("--audit", action="store_true")
    modes.add_argument("--strict", action="store_true")
    modes.add_argument("--import", dest="do_import", action="store_true")
    args = p.parse_args()
    expected = inventory()
    reg = load(REGISTRY)
    if reg.get("voiceId") != VOICE or reg.get("modelId") != MODEL or reg.get("live") is not False:
        raise RuntimeError("Refuse upload into non-review or wrong voice registry")
    existing_ids = set((reg.get("generationClips") or {}).keys())
    if existing_ids - set(expected):
        raise RuntimeError("Unknown generation already recorded in paid flow registry")
    inbox = args.source.resolve()
    # Relative inbox may be anywhere locally; NEVER read from network or remote URLs.
    present = {}
    for gid, meta in expected.items():
        path = inbox / (gid + ".mp3")
        if path.is_file() and not path.is_symlink():
            present[gid] = path
    missing = set(expected) - existing_ids - set(present)
    first150_ids = {
        x["questionId"] for x in load(ROOT / "kids/data/quiz-v4-curated-450-production-review.json")["recipes"]
        if x["ageBand"] == "4-6"
    }
    needed_first150 = {
        gid for gid, v in expected.items() if v["questionId"] in first150_ids
    }
    report = {
        "scope": "TAWḤĪD KIDS 56 previously paid V4 ORIGINALS / import only",
        "mode": "offline-only-no-new-credits",
        "expectedPreviouslyPaidGenerationIDs": 56,
        "alreadyImportedGenerationIDs": len(existing_ids),
        "MP3sAvailableInLocalInbox": len(present),
        "uniqueIDsStillMissing": len(missing),
        "missingForFirst150Age4to6": len(needed_first150 - existing_ids - set(present)),
        "missingOriginalGenerationIDs": sorted(missing),
        "purchaseAuthorized": False,
        "liveReleaseAllowed": False,
    }
    print("KIDS_PREVIOUSLY_PAID_V4_IMPORT_AUDIT " + json.dumps(report, ensure_ascii=False), flush=True)
    if args.strict:
        if missing:
            raise SystemExit("BLOCKED: previously paid V4 originals must be imported, not regenerated")
        return
    if not args.do_import:
        return
    if not present:
        raise SystemExit("No original paid MP3s in local inbox; no changes made")

    generation = reg.setdefault("generationClips", {})
    text_clips = reg.setdefault("textClips", {})
    previous_log = {
        "schemaVersion": 1, "scope": "KIDS_V4_ALREADY_PAID_ORIGINAL_IMPORT",
        "voiceId": VOICE, "modelId": MODEL,
        "importedOriginals": {},
        "extraPaidSynthesisCredits": 0,
        "audioHumanApproved": False,
        "live": False,
    }
    if IMPORT_LOG.exists():
        previous_log = load(IMPORT_LOG)
    imported = 0
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for gid in sorted(present):
        meta = expected[gid]
        src = present[gid]
        actual_duration = probe(src, meta["durationSeconds"])
        actual_sha = sha(src)
        dest = OUTPUT / (gid + ".mp3")
        if gid in generation:
            if generation[gid].get("sha256") != actual_sha:
                raise RuntimeError(f"Existing already-paid original {gid} has a different SHA. Stop, no overwrite")
            continue
        if dest.exists():
            if sha(dest) != actual_sha:
                raise RuntimeError(f"Previously imported {gid} original would be overwritten")
        else:
            shutil.copyfile(src, dest)
        if sha(dest) != actual_sha:
            raise RuntimeError("Original MP3 changed during copy")
        row = {
            "url": safe_audio_url(dest),
            "generationId": gid,
            "questionId": meta["questionId"],
            "part": meta["part"],
            "textSha256": hashlib.sha256(meta["text"].encode("utf-8")).hexdigest(),
            "sha256": actual_sha, "bytes": dest.stat().st_size,
            "modelId": MODEL, "voiceId": VOICE,
            "source": "paid-earlier-elevenlabs-flow-original-import",
            "durationSeconds": round(actual_duration, 3),
            "audioListeningApproved": False,
            "qaApproval": "pending-human-auditory-review",
            "published": False,
        }
        generation[gid] = row
        # Identical spoken texts are reused, never replaced or regenerated.
        existing_text = text_clips.get(meta["text"])
        if existing_text is None:
            text_clips[meta["text"]] = row
        previous_log.setdefault("importedOriginals", {})[gid] = {
            "questionId": meta["questionId"], "part": meta["part"],
            "sha256": actual_sha, "url": safe_audio_url(dest),
            "previouslyPaidCredits": meta["creditsPreviouslyPaid"],
            "originalFlowId": meta["flowId"],
            "extraCreditsSpentOnImport": 0,
        }
        imported += 1
    previous_log["importedOriginalCount"] = len(generation)
    previous_log["stillMissingOriginalCount"] = len(expected) - len(generation)
    # The import log deliberately stores no signed URL or API credential.
    REGISTRY.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    IMPORT_LOG.write_text(json.dumps(previous_log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KIDS_PREPAID_MP3_IMPORT_OK " + json.dumps({
        "importedNow": imported,
        "previousOriginalsNowOnDisk": len(generation),
        "remainingPriorOriginals": len(expected) - len(generation),
        "newElevenLabsCreditsSpent": 0, "published": False,
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
