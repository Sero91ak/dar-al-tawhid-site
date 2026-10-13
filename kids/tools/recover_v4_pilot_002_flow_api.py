#!/usr/bin/env python3
"""Retrieve three ALREADY PAID ElevenLabs V4 Flow speech generations, zero TTS.

Only uses GET /v1/flows/text-to-speech/{generation_id} and GET the returned
short-lived Google Storage URL. Never executes a model, never asks user to
redownload, never writes an approved or live application audio manifest.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids" / "tools"))
from import_quiz_v4_pilot_002 import build, details  # noqa: E402

PILOT = ROOT / "kids/data/quiz-v4-pilot-002.json"
REVIEW = ROOT / "kids/assets/kids-quiz-audio/pilot-002-v4-review"
META = ROOT / "kids/data/quiz-v4-pilot-002-recovered-review.json"
API = "https://api.elevenlabs.io/v1/flows/text-to-speech/"


def get_generation(key: str, generation_id: str) -> dict:
    if not generation_id.isalnum() or len(generation_id) > 80:
        raise RuntimeError("Unexpected generation identifier")
    req = urllib.request.Request(
        API + generation_id, method="GET",
        headers={"xi-api-key": key, "Accept": "application/json",
                 "User-Agent": "DAR-KIDS-ReadOnlyFlowV4Importer/1"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.load(resp)
    if result.get("status") != "completed" or result.get("id") != generation_id:
        raise RuntimeError("Flow generation is not completed or has wrong ID")
    if result.get("model_id") not in (None, "eleven_v4"):
        raise RuntimeError("Flow generation is not the approved V4 model")
    return result


def download_original(generation: dict, part: dict, dest: Path) -> dict:
    raw_url = generation.get("content_url")
    if not isinstance(raw_url, str):
        raise RuntimeError("Completed Flow has no downloadable audio URL")
    url = urllib.parse.urlparse(raw_url)
    if (url.scheme != "https" or url.hostname != "storage.googleapis.com"
            or not url.path.startswith("/xi-backend/database/workspace/")
            or not url.path.endswith("/content.mp3") or not url.query):
        raise RuntimeError("Unexpected Flow media URL; private export blocked")
    req = urllib.request.Request(raw_url, method="GET")
    with urllib.request.urlopen(req, timeout=45) as resp:
        content = resp.read(5_000_000)
    if len(content) < 2000 or len(content) >= 5_000_000:
        raise RuntimeError("Unusable original MP3 size")
    if not (content.startswith(b"ID3") or content[0] == 255):
        raise RuntimeError("Original Flow asset does not look like an MP3")
    dest.write_bytes(content)
    duration, codec = details(dest)
    if codec.lower() != "mp3" or abs(duration - float(part["durationSec"])) > 2:
        raise RuntimeError("MP3 model/duration validation failed for " + part["key"])
    return {
        "part": part["key"], "originalGenerationId": part["originalGenerationId"],
        "filename": part["expectedLocalFile"], "sha256": hashlib.sha256(content).hexdigest(),
        "durationSeconds": round(duration, 3), "bytes": len(content),
    }


def main() -> None:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("Missing existing ElevenLabs API credential")
    pilot = json.loads(PILOT.read_text(encoding="utf-8"))
    parts = pilot["parts"]
    if (pilot["questionId"] != "kids-quiz-002"
            or pilot["modelId"] != "eleven_v4"
            or pilot["voiceId"] != "DkU7j9uO4ZEtLD2iRZSH"
            or len(parts) != 3
            or pilot["textContract"] != " ".join(p["text"] for p in parts)):
        raise RuntimeError("Pilot/voice/text contract does not match")
    if REVIEW.exists() or META.exists():
        raise RuntimeError("Already recovered files exist. Do not overwrite original paid audio.")
    with tempfile.TemporaryDirectory(prefix="kids-002-flow-v4-") as d:
        temporary = Path(d)
        source = temporary / "originals"
        source.mkdir()
        audit = []
        for part in parts:
            gen = get_generation(key, part["originalGenerationId"])
            audit.append(download_original(gen, part, source / part["expectedLocalFile"]))
        joined = temporary / "kids-quiz-002-v4-joined.mp3"
        info = build(source, joined)
        if info["synthesisCreditsSpentByImport"] != 0:
            raise RuntimeError("Unexpected model charge by offline import")
        REVIEW.mkdir(parents=True, exist_ok=False)
        for original in audit:
            shutil.copy2(source / original["filename"], REVIEW / original["filename"])
        shutil.copy2(joined, REVIEW / joined.name)
        manifest = {
            "schemaVersion": 1, "questionId": "kids-quiz-002",
            "voiceId": pilot["voiceId"], "modelId": "eleven_v4",
            "status": "review-only-audio-awaiting-human-listening",
            "audioListeningApproved": False, "publicationApproved": False,
            "newTtsRequests": 0, "newTtsCreditsSpent": 0,
            "source": "already-paid-elevenlabs-v4-flow-generations",
            "originals": audit, "assembled": info,
            "assetDirectory": str(REVIEW.relative_to(ROOT)),
        }
        META.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("PASS: three ORIGINAL paid V4 MP3 files and joined MP3 preserved, ZERO new credits")
        print("REVIEW_ONLY: no public manifest modified; listening approval outstanding")


if __name__ == "__main__":
    main()
