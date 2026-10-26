#!/usr/bin/env python3
"""Resumable review-only 450-question ElevenLabs V4 kids quiz rebuild.

Dry-run by default. No public app route or release flags are ever modified.
Requires explicit --execute + ELEVENLABS_API_KEY. Run separately per age band.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "kids/data/quiz-kids-public-450.json"
PLAN = ROOT / "kids/review-only/quiz-v4-full-rebuild-20261026/450-speech-scripts.json"
PRODUCTION = ROOT / "data/pronunciation/elevenlabs-production.json"
DEFAULT_OUTPUT = ROOT / "kids/review-only/quiz-v4-full-rebuild-20261026/generated"
BANDS = ("4-6", "7-8", "9-10")
PARTS = ("question", "correct", "retry", "explanation")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"

def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def validate(plan: dict, source: dict, production: dict) -> None:
    master = production["masterVoice"]
    dictionary = production["pronunciationDictionary"]
    assert production["modelId"] == MODEL, "V4 production model mismatch"
    assert master["voiceId"] == VOICE and master["name"] == "Serhat Abu Malik – Master"
    assert plan["voiceId"] == VOICE and plan["modelId"] == MODEL
    assert plan["pronunciationDictionary"]["dictionaryId"] == dictionary["id"]
    assert plan["pronunciationDictionary"]["versionId"] == dictionary["versionId"]
    assert plan["publishingEnabled"] is False and plan["humanListeningApproved"] is False
    items, originals = plan["items"], source["items"]
    assert len(items) == len(originals) == 450
    assert len({q["questionId"] for q in items}) == 450
    assert {b: sum(q["ageBand"] == b for q in items) for b in BANDS} == dict.fromkeys(BANDS, 150)
    for q, original in zip(items, originals):
        assert q["questionId"] == original["id"] and q["ageBand"] == original["ageBand"]
        assert q["source"] == original["source"] and q["sourceType"] == original["sourceType"]
        assert q["number"] == original["number"]
        assert original["verification"] == original["reviewStatus"] == "approved"
        assert original["status"] == "published"
        assert sum(bool(a["correct"]) for a in original["answers"]) == 1
        assert set(q["parts"]) == set(PARTS) and q["partCount"] == 4
        assert original["question"] in q["parts"]["question"]["displayText"]
        assert original["explanation"] in q["parts"]["explanation"]["displayText"]
        assert original["answers"][next(i for i, a in enumerate(original["answers"]) if a["correct"])]["label"].rstrip(".") in q["parts"]["correct"]["displayText"]
        for part in PARTS:
            clip = q["parts"][part]
            assert clip["approval"] == "pending-human-listening"
            assert clip["audioFile"] is None
            assert 16 <= len(clip["ttsText"]) <= 1000
            assert clip["displayText"] in clip["ttsText"]
    assert plan["counts"]["clips"] == 1800
    assert not any("Die Quelle steht" in q["parts"]["explanation"]["ttsText"] for q in items), "Spoken citation is prohibited"
    assert not any("Ḥadīṯ Nummer" in q["parts"]["explanation"]["ttsText"] for q in items), "Spoken reference number is prohibited"

def mp3_duration(path: Path) -> float:
    data = path.read_bytes()
    assert len(data) > 1700, "Too-short MP3"
    assert data.startswith(b"ID3") or (data[0] == 0xff and (data[1] & 0xe0) == 0xe0), "Not MP3"
    # Hosted runner images do not guarantee ffprobe. Use the pinned Mutagen
    # package (real MP3 frame inspection) when ffprobe is absent.
    import shutil
    if shutil.which("ffprobe"):
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            check=True, capture_output=True, text=True, timeout=25,
        )
        seconds = float(result.stdout.strip())
    else:
        from mutagen.mp3 import MP3
        seconds = float(MP3(str(path)).info.length)
    if not 0.75 <= seconds <= 150:
        raise ValueError(f"Unexpected duration {seconds}")
    return round(seconds, 3)

def convert(prompt: str, dictionary: dict, api_key: str) -> bytes:
    payload = {
        "text": prompt, "model_id": MODEL,
        "pronunciation_dictionary_locators": [{
            "pronunciation_dictionary_id": dictionary["dictionaryId"],
            "version_id": dictionary["versionId"]
        }],
        "voice_settings": {"stability": 0.58, "similarity_boost": 0.82},
    }
    url = "https://api.elevenlabs.io/v1/text-to-speech/" + VOICE + "?output_format=mp3_44100_128"
    req = urllib.request.Request(
        url, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"xi-api-key": api_key, "Content-Type": "application/json",
                 "Accept": "audio/mpeg", "User-Agent": "DAR-TAWHID-KIDS-V4-REBUILD/1"},
        method="POST",
    )
    # Do not automatically retry ambiguous TTS failures: duplicates may spend credits.
    with urllib.request.urlopen(req, timeout=180) as result:
        mime = str(result.headers.get("Content-Type", "")).lower()
        if "audio/" not in mime and "application/octet-stream" not in mime:
            raise ValueError("TTS returned non-audio content type")
        return result.read()

def build(plan: dict, band: str, target: Path, execute: bool, max_questions: int = 150) -> None:
    items = [q for q in plan["items"] if q["ageBand"] == band]
    assert len(items) == 150
    if max_questions < 1 or max_questions > 150:
        raise ValueError("Invalid max_questions")
    items = items[:max_questions]
    prompts = [(q, kind, q["parts"][kind]["ttsText"]) for q in items for kind in PARTS]
    total_chars = sum(len(t) for _, _, t in prompts)
    distinct_hashes = {digest("|".join((MODEL, VOICE, plan["pronunciationDictionary"]["versionId"], text))) for _,_,text in prompts}
    print(f"Age {band}: {len(items)} questions / {len(prompts)} slots / {len(distinct_hashes)} unique takes / {total_chars} characters")
    if not execute:
        print("DRY RUN: no ElevenLabs requests or paid generations.")
        return
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise SystemExit("ELEVENLABS_API_KEY missing; refusing paid generation")
    out = target / band
    audio_dir = out / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    catalog = []
    for q in items:
        entry = {"questionId": q["questionId"], "ageBand": band, "source": q["source"], "parts": {}}
        for part in PARTS:
            clip = q["parts"][part]
            prompt = clip["ttsText"]
            sha_text = digest("|".join((MODEL, VOICE, plan["pronunciationDictionary"]["versionId"], prompt)))
            path = audio_dir / (sha_text[:28] + ".mp3")
            if path.exists():
                duration = mp3_duration(path)
            else:
                print(f"GENERATE {band} {q['questionId']} {part}", flush=True)
                audio = convert(prompt, plan["pronunciationDictionary"], key)
                with tempfile.NamedTemporaryFile(dir=audio_dir, suffix=".mp3", delete=False) as f:
                    temporary = Path(f.name)
                    f.write(audio)
                try:
                    duration = mp3_duration(temporary)
                    temporary.replace(path)
                finally:
                    temporary.unlink(missing_ok=True)
                time.sleep(0.35)
            entry["parts"][part] = {
                "text": clip["displayText"], "ttsText": prompt,
                "url": "audio/" + path.name,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "ttsTextSha256": sha_text,
                "durationSeconds": duration, "modelId": MODEL,
                "voiceId": VOICE, "voiceProfileId": "serhat-owner-voice-2026",
                "sourceVoice": "authorized-owner-voice",
                "sourceSpeaker": "Serhat Abu Malik",
                "sourceType": "owner-voice-generated",
                "qaStatus": "technical-passed-awaiting-human-review",
                "humanListeningApproved": False,
                "approvedForPlayback": False,
            }
        catalog.append(entry)
        # Atomic checkpoint after EACH question; supports exact resume.
        checkpoint = {"band": band, "questionsCompleted": len(catalog),
                      "entries": catalog, "releaseEnabled": False}
        temp = out / "checkpoint.json.tmp"
        temp.write_text(json.dumps(checkpoint, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temp.replace(out / "checkpoint.json")
    print(f"REVIEW-ONLY COMPLETE: {band}, {len(catalog)} questions; nothing published")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--age-band", choices=BANDS, required=True)
    parser.add_argument("--execute", action="store_true", help="Spend ElevenLabs credits; manual action only")
    parser.add_argument("--max-questions", type=int, default=150, help="1 for paid pilot; 150 full age band")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    plan, source, production = read_json(PLAN), read_json(SOURCE), read_json(PRODUCTION)
    validate(plan, source, production)
    build(plan, args.age_band, args.output_dir, args.execute, args.max_questions)

if __name__ == "__main__":
    main()
