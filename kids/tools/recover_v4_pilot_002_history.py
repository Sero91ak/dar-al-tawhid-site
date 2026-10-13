#!/usr/bin/env python3
"""Recover ALREADY PAID KIDS quiz #002 ElevenLabs V4 audio from account history.

Only GET /v1/history and GET /v1/history/{id}/audio. NEVER calls generation
endpoints, consumes TTS credits, touches published manifests or deploys.
Fail closed unless all three recordings match exact text, voice and model.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids" / "tools"))
from import_quiz_v4_pilot_002 import build, details  # noqa: E402

PILOT = ROOT / "kids/data/quiz-v4-pilot-002.json"
REVIEW = ROOT / "kids/assets/kids-quiz-audio/pilot-002-v4-review"
META = ROOT / "kids/data/quiz-v4-pilot-002-recovered-review.json"
BASE = "https://api.elevenlabs.io/v1"


def norm(value: object) -> str:
    return unicodedata.normalize("NFC", " ".join(str(value or "").split()))


def api_get(key: str, endpoint: str) -> bytes:
    if not (endpoint == "/history" or endpoint.startswith("/history?")
            or endpoint.startswith("/history/")):
        raise ValueError("Read-only ElevenLabs history endpoints ONLY")
    request = urllib.request.Request(
        BASE + endpoint,
        method="GET",
        headers={"xi-api-key": key, "Accept": "application/json, audio/mpeg",
                 "User-Agent": "DAR-KIDS-ReadOnlyPaidV4Recovery/1"},
    )
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.read()


def matches(item: dict, part: dict, manifest: dict) -> bool:
    return (norm(item.get("text")) == norm(part["text"])
            and item.get("model_id") == manifest["modelId"]
            and item.get("voice_id") == manifest["voiceId"])


def find_all(key: str, manifest: dict) -> dict[int, dict]:
    parts = manifest["parts"]
    result: dict[int, dict] = {}
    # Creative Flow generation IDs sometimes differ from history-item IDs.
    # Direct lookups are optional and never accepted without identity proof.
    for p in parts:
        gen = urllib.parse.quote(p["originalGenerationId"], safe="")
        try:
            obj = json.loads(api_get(key, "/history/" + gen))
            if matches(obj, p, manifest) and obj.get("history_item_id"):
                result[p["index"]] = obj
        except (urllib.error.HTTPError, ValueError, json.JSONDecodeError):
            pass

    for p in parts:
        if p["index"] in result:
            continue
        cursor = ""
        seen = set()
        # Search the paid account's history without generating any new speech.
        for _ in range(4):
            params = {"page_size": "100", "search": p["text"]}
            if cursor:
                params["start_after_history_item_id"] = cursor
            batch = json.loads(api_get(key, "/history?" + urllib.parse.urlencode(params)))
            rows = batch.get("history") or []
            for row in rows:
                if matches(row, p, manifest) and row.get("history_item_id"):
                    result[p["index"]] = row
                    break
            if p["index"] in result or not batch.get("has_more") or not rows:
                break
            cursor = rows[-1].get("history_item_id") or ""
            if not cursor or cursor in seen:
                break
            seen.add(cursor)

    # Search spelling/locale often differs for Fuṣḥā diacritics. One bounded
    # unfiltered history scan can safely recover the missing three originals.
    if len(result) < len(parts):
        cursor = ""
        seen = set()
        for _ in range(18):
            params = {"page_size": "100"}
            if cursor:
                params["start_after_history_item_id"] = cursor
            batch = json.loads(api_get(key, "/history?" + urllib.parse.urlencode(params)))
            rows = batch.get("history") or []
            for row in rows:
                for p in parts:
                    if p["index"] not in result and matches(row, p, manifest) and row.get("history_item_id"):
                        result[p["index"]] = row
            if len(result) == len(parts) or not batch.get("has_more") or not rows:
                break
            cursor = rows[-1].get("history_item_id") or ""
            if not cursor or cursor in seen:
                break
            seen.add(cursor)
    return result


def main() -> None:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("No ElevenLabs account history access on this runner; no generation attempted")
    manifest = json.loads(PILOT.read_text(encoding="utf-8"))
    parts = manifest["parts"]
    if (manifest["questionId"] != "kids-quiz-002"
            or manifest["voiceId"] != "DkU7j9uO4ZEtLD2iRZSH"
            or manifest["modelId"] != "eleven_v4"
            or len(parts) != 3
            or manifest["textContract"] != " ".join(p["text"] for p in parts)):
        raise RuntimeError("Wrong approved V4 pilot/text/voice; import blocked")
    if REVIEW.exists() or META.exists():
        raise RuntimeError("Review files already exist; refusing to overwrite paid recordings")

    found = find_all(key, manifest)
    if len(found) != 3:
        missing = [p["key"] for p in parts if p["index"] not in found]
        raise RuntimeError(
            "History API cannot provide exact paid V4 items: "
            + ", ".join(missing)
            + ". DO NOT synthesize new audio; the Creative Flow asset may not be in history."
        )

    with tempfile.TemporaryDirectory(prefix="kids-paid-quiz-002-") as tmpstr:
        tmp = Path(tmpstr)
        originals = tmp / "originals"
        originals.mkdir()
        record = []
        for p in parts:
            history_id = found[p["index"]]["history_item_id"]
            audio = api_get(key, "/history/" + urllib.parse.quote(history_id, safe="") + "/audio")
            if len(audio) < 2000 or not (audio.startswith(b"ID3") or audio[:1] == b"\\xff"):
                raise RuntimeError("Missing or invalid paid history MP3: " + p["key"])
            outfile = originals / p["expectedLocalFile"]
            outfile.write_bytes(audio)
            seconds, codec = details(outfile)
            if codec.lower() != "mp3" or abs(seconds - float(p["durationSec"])) > 2.0:
                raise RuntimeError("History MP3 codec/duration failed: " + p["key"])
            record.append({
                "part": p["key"], "originalGenerationId": p["originalGenerationId"],
                "historyItemId": history_id,
                "filename": p["expectedLocalFile"],
                "sha256": hashlib.sha256(audio).hexdigest(),
                "durationSeconds": round(seconds, 3), "bytes": len(audio),
            })
        joined = tmp / "kids-quiz-002-v4-joined.mp3"
        qa = build(originals, joined)
        if qa["synthesisCreditsSpentByImport"] != 0 or not joined.exists():
            raise RuntimeError("Unexpected import result")
        # The public quiz manifest stays unchanged; this branch is REVIEW ONLY.
        REVIEW.mkdir(parents=True, exist_ok=False)
        for part in record:
            shutil.copy2(originals / part["filename"], REVIEW / part["filename"])
        shutil.copy2(joined, REVIEW / joined.name)
        review = {
            "schemaVersion": 1, "questionId": "kids-quiz-002",
            "modelId": "eleven_v4", "voiceId": manifest["voiceId"],
            "source": "ElevenLabs-paid-account-history-GET-only",
            "parts": record, "assembledAudio": qa,
            "originalsDirectory": str(REVIEW.relative_to(ROOT)),
            "status": "REVIEW_ONLY_AWAITING_HUMAN_LISTENING",
            "audioListeningApproved": False, "publicationApproved": False,
            "newTTSRequests": 0, "newTTSCharges": 0,
        }
        META.write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("PASS: reused three exact paid ElevenLabs V4 originals; one verified MP3; ZERO new TTS calls.")
        print("REVIEW_AUDIO=" + str(REVIEW / joined.name))
        print("NO LIVE PUBLICATION; listening approval required.")


if __name__ == "__main__":
    main()
