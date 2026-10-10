#!/usr/bin/env python3
"""Build exact-match Serhat master clips for Kids Academy's first Ṣidq lesson.

Only age-specific, actually spoken phrases are generated. No browser TTS, no
replacement of Qur'an recitation, and no substitution of unrelated sample audio.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import tempfile
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = ROOT / "kids/akademie/index.html"
OUT = ROOT / "kids/data/academy-audio.json"
ASSETS = ROOT / "kids/assets/kids-academy-audio"
CONFIG = json.loads((ROOT / "data/pronunciation/elevenlabs-production.json").read_text("utf-8"))
MASTER = CONFIG["masterVoice"]
MODEL = "eleven_flash_v2_5"
PROFILE = "serhat-owner-voice-2026"
MAX_NEW = 36
from voice_text import prepare_kids_voice_text


def catalog() -> list[str]:
    html = HTML.read_text(encoding="utf-8")
    match = re.search(r"const AGE_EXPLANATIONS=Object\.freeze\((\{[\s\S]*?\})\);", html)
    if not match:
        raise RuntimeError("AGE_EXPLANATIONS source changed – refuse mismatched audio")
    ages = json.loads(match.group(1))
    if set(ages) != {"4-5", "6-8", "9-10"}:
        raise RuntimeError("Unexpected age catalog")
    texts = [
        "As-salāmu ʿalaykum, lieber Bruder.",
        "As-salāmu ʿalaykum, liebe Schwester.",
    ]
    for key in ("welcomeNext", "welcomeBody"):
        values = re.findall(r"\b" + key + r':"([^"]+)"', html)
        if len(values) != 3:
            raise RuntimeError("Missing exact " + key + " phrases")
        texts.extend(values)
    for key in ("4-5", "6-8", "9-10"):
        age = ages[key]
        if len(age["lines"]) != 4 or len(age["recap"]) != 3 or not age["evidence"]:
            raise RuntimeError("Incomplete Ṣidq audio catalog " + key)
        texts.extend(age["lines"])
        texts.append(age["evidence"])
        texts.extend(age["recap"])
    texts = list(dict.fromkeys(texts))
    if not (28 <= len(texts) <= MAX_NEW):
        raise RuntimeError("Unexpected clip count " + str(len(texts)))
    return texts


def seconds(path: pathlib.Path) -> float:
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ], text=True).strip())


def synthesize(text: str, target: pathlib.Path) -> float:
    secret = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not secret:
        raise RuntimeError("ELEVENLABS_API_KEY missing; no recordings were published")
    prepared = prepare_kids_voice_text(text)
    body = json.dumps({
        "text": prepared,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.63, "similarity_boost": 0.83}
    }, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/" + MASTER["voiceId"],
        data=body, method="POST",
        headers={"xi-api-key": secret, "Content-Type": "application/json",
                 "Accept": "audio/mpeg", "User-Agent": "Dar-Kids-Academy-Master/1"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        audio = resp.read()
    if len(audio) < 1800:
        raise RuntimeError("Synthesis response too short")
    with tempfile.TemporaryDirectory() as tmp:
        incoming = pathlib.Path(tmp) / "source.mp3"
        incoming.write_bytes(audio)
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(incoming), "-ac", "1", "-ar", "48000",
            "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", str(target)
        ], check=True, timeout=90)
    duration = seconds(target)
    if not (0.8 <= duration <= 65) or target.stat().st_size < 1800:
        target.unlink(missing_ok=True)
        raise RuntimeError("Audio technical QA failed")
    return duration


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if MASTER.get("name") != "Serhat Abu Malik – Master":
        raise RuntimeError("Unauthorized voice configured")
    prompts = catalog()
    current = json.loads(OUT.read_text("utf-8")) if OUT.exists() else {}
    if current.get("voiceProfileId") != PROFILE:
        raise RuntimeError("Existing voice profile does not match Serhat Master")
    existing = current.get("entries", {})
    if args.dry_run:
        print("Academy source verified:", len(prompts), "exact Ṣidq strings, model", MODEL)
        return
    ASSETS.mkdir(parents=True, exist_ok=True)
    entries = dict(existing)
    count = 0
    for idx, phrase in enumerate(prompts, 1):
        prepared = prepare_kids_voice_text(phrase)
        digest = hashlib.sha256((MODEL + "|" + MASTER["voiceId"] + "|" + prepared).encode()).hexdigest()
        target = ASSETS / (digest[:20] + ".m4a")
        old = existing.get(phrase, {})
        if old.get("preparedSha256") == digest and target.exists() and target.stat().st_size > 1800:
            duration = seconds(target)
        else:
            if count >= MAX_NEW:
                raise RuntimeError("Recording budget exhausted")
            print(f"Generate Academy Ṣidq {idx}/{len(prompts)}", flush=True)
            duration = synthesize(phrase, target)
            count += 1
            time.sleep(0.25)
        entries[phrase] = {
            "url": "/" + target.relative_to(ROOT).as_posix(),
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "preparedSha256": digest,
            "durationSeconds": round(duration, 3),
            "modelId": MODEL,
            "voiceProfileId": PROFILE,
            "sourceVoice": "authorized-owner-voice",
            "sourceType": "owner-voice-generated",
            "sourceSpeaker": "Serhat Abu Malik",
            "qaStatus": "technical-passed"
        }
    current.update({
        "schemaVersion": 2,
        "id": "KIDS_ACADEMY_SERHAT_MASTER_V1",
        "voiceProfileId": PROFILE,
        "speaker": "Serhat Abu Malik",
        "modelId": MODEL,
        "manualReviewNote": "Technical checks passed. Human listening/A-B review is still required; new clips are not independently certified for pronunciation.",
        "policy": "Exact-match Serhat only. No native TTS or unrelated audio substitution.",
        "entries": entries
    })
    OUT.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Academy Master:", len(prompts), "target strings,", count, "new audio assets.", flush=True)


if __name__ == "__main__":
    main()
