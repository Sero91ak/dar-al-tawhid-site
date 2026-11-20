#!/usr/bin/env python3
"""Import actual ElevenLabs Creative V4 generations for the exact Ṣidq 4–5 batch.

Producer: ElevenLabs Creative flow zrB4zGdz9OTndLryQtIB.
No generation, no new credits. Download original MP3 from ElevenLabs in Work,
name as <generationId>.mp3, pass --source-dir and commit resulting real media.

NEVER infer binary success from a generation ID. No placeholder media.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RECORD = ROOT / "kids/data/academy-topic-batches/akhlaq-sidq-elevenlabs-v4-generations-b01.json"
JOB = ROOT / "kids/data/academy-topic-batches/akhlaq-sidq-b01.json"
OUTPUT = ROOT / "kids/data/academy-audio-staging-akhlaq-sidq-b01.json"
MEDIA = ROOT / "kids/assets/kids-academy-audio"


def json_load(path):
    return json.loads(path.read_text("utf-8"))


def ffprobe_duration(filename):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(filename)],
        text=True
    ).strip())


def convert_original(src, dest):
    if src.suffix.lower() != ".mp3" or not src.is_file() or src.stat().st_size < 1800:
        raise RuntimeError(f"Missing or invalid real ElevenLabs MP3: {src}")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
         "-i", str(src), "-vn", "-codec:a", "aac", "-b:a", "128k",
         "-ar", "44100", str(dest)], check=True
    )
    if not dest.is_file() or dest.stat().st_size < 1800:
        raise RuntimeError("Conversion did not produce real playable AAC audio")


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source_dir = args.source_dir
    record = json_load(RECORD)
    job = json_load(JOB)
    if (record.get("generationFlowId") != "zrB4zGdz9OTndLryQtIB"
            or record.get("voiceId") != "DkU7j9uO4ZEtLD2iRZSH"
            or record.get("modelId") != "eleven_v4"
            or record.get("languageCode") != "de"):
        raise RuntimeError("Unexpected authenticated V4 generation set")
    if record.get("voiceSettingsApplied") != {"stability": 0.62, "similarity": 0.88}:
        raise RuntimeError("Unexpected ElevenLabs V4 settings")
    if job.get("lessonId") != "sidq" or job.get("age") != "4-5":
        raise RuntimeError("Unexpected lesson ID")
    items = record.get("entries") or []
    if len(items) != 4 or set(x["text"] for x in items) != set(job["phrases"]):
        raise RuntimeError("The Creative output does not match the first exact batch")
    if len({x["generationId"] for x in items}) != 4:
        raise RuntimeError("Each phrase must have a different generation ID")
    for x in items:
        if x.get("generationStatus") != "completed":
            raise RuntimeError("Only real completed ElevenLabs generations may be imported")
    files = [source_dir / (x["generationId"] + ".mp3") for x in items]
    # Fail before writing a single public/media asset if the entire set is missing.
    for src in files:
        if not src.is_file() or src.stat().st_size < 1800:
            raise RuntimeError(f"Missing original MP3 — no release: {src}")
        duration = ffprobe_duration(src)
        if not 0.8 <= duration <= 65:
            raise RuntimeError(f"Unexpected recorded duration for {src.name}")
    MEDIA.mkdir(parents=True, exist_ok=True)
    old = json_load(OUTPUT) if OUTPUT.exists() else {}
    if old and old.get("id") != "KIDS_ACADEMY_AKHLAQ_SIDQ_B01_STAGING":
        raise RuntimeError("Unexpected staging manifest ID; no existing media overwritten")
    entries = old.get("entries", {})
    for x, src in zip(items, files):
        key = hashlib.sha256(
            (x["text"] + "\0" + record["voiceId"] + "\0" + "eleven_v4\0" +
             x["generationId"]).encode("utf-8")
        ).hexdigest()[:20]
        dest = MEDIA / (key + ".m4a")
        if dest.is_file():
            if ffprobe_duration(dest) < 0.8:
                raise RuntimeError(f"Cached audio file appears corrupted: {dest}")
        else:
            convert_original(src, dest)
        sha = hashlib.sha256(dest.read_bytes()).hexdigest()
        entries[x["text"]] = {
            "url": "/" + dest.relative_to(ROOT).as_posix(),
            "sha256": sha,
            "durationSeconds": round(ffprobe_duration(dest), 3),
            "voiceId": record["voiceId"],
            "voiceProfileId": "serhat-owner-voice-2026",
            "modelId": "eleven_v4",
            "voiceSettingsProfile": "kids_story",
            # V4 does not accept user profile speed, style, speaker_boost
            # through current ElevenLabs Creative connector. Never represent
            # those old settings as applied to these generated outputs.
            "actualVoiceSettings": record["voiceSettingsApplied"],
            "settingsPartial": True,
            "languageCode": "de",
            "arabicDictionaryApplied": False,
            "sourceVoice": "authorized-owner-voice",
            "sourceSpeaker": "Serhat Abu Malik",
            "sameAsApprovedKidsStoryProfile": False,
            "sourceGenerationId": x["generationId"],
            "sourceFlowId": record["generationFlowId"],
            "qaStatus": "technical-pass-source-v4-voice",
            "approvedForPlayback": False,
        }
    doc = {
        "schemaVersion": 1, "id": "KIDS_ACADEMY_AKHLAQ_SIDQ_B01_STAGING",
        "subject": "akhlaq", "lessonId": "sidq", "age": "4-5",
        "voiceId": record["voiceId"], "modelId": "eleven_v4",
        "voiceSettingsProfile": "kids_story",
        "stagingOnly": True, "approvedForPlayback": False,
        "entries": entries,
    }
    # No partial manifest is written before every source is verified.
    OUTPUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print("Real Ṣidq 4–5 V4 files imported and hashed: %d/4, still NOT live." % len(items))


if __name__ == "__main__":
    run()
