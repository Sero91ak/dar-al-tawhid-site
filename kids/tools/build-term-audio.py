#!/usr/bin/env python3
"""Generate cost-controlled Serhat owner-voice glossary clips for Kids Du'a and Quiz.

Produces one shared reusable audio clip per term and age level, never changing
the audited Arabic Du'a, Quran recitation, original quiz explanations or source.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "kids/data/term-learning-audio.json"
ASSETS = ROOT / "kids/assets/kids-term-audio"
MODEL = "eleven_flash_v2_5"
PROFILE = "serhat-owner-voice-2026"
CONFIG = json.loads((ROOT / "data/pronunciation/elevenlabs-production.json").read_text("utf-8"))
VOICE = CONFIG["masterVoice"]["voiceId"]
SECRET = os.getenv("ELEVENLABS_API_KEY", "").strip()
BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech/" + VOICE
from voice_text import prepare_kids_voice_text

def term_catalog() -> list[dict]:
    code = (
        'global.window={addEventListener(){}};'
        'global.document={addEventListener(){}};'
        'global.Audio=function(){this.setAttribute=function(){}};'
        'require("./kids/term-learning.js");'
        'process.stdout.write(JSON.stringify(window.DARKidsTermLearning.terms));'
    )
    result = subprocess.run(["node", "-e", code], cwd=ROOT, check=True, capture_output=True, text=True)
    data = json.loads(result.stdout)
    if len(data) < 18 or len({v["id"] for v in data}) != len(data):
        raise RuntimeError("Term catalog incomplete or has duplicated IDs")
    return data

def requested_text(term: dict, level: str) -> str:
    body = term["basic"] if level == "basic" else term["deep"]
    return f"Der arabische Begriff {term['name']} bedeutet auf Deutsch: {term['de']}. {body}"

def duration(path: pathlib.Path) -> float:
    output = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)], text=True
    ).strip()
    return float(output)

def render(prepared: str, output: pathlib.Path):
    if not SECRET:
        raise RuntimeError("ELEVENLABS_API_KEY fehlt – kostenpflichtige Produktion nicht möglich")
    payload = json.dumps({
        "text": prepared, "model_id": MODEL,
        "voice_settings": {"stability": 0.63, "similarity_boost": 0.83}
    }, ensure_ascii=False).encode("utf-8")
    last = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(
                BASE_URL, data=payload, method="POST",
                headers={"xi-api-key": SECRET, "Content-Type": "application/json",
                         "Accept": "audio/mpeg", "User-Agent": "Dar-Kids-Term-Voice/1"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                mp3 = resp.read()
            if len(mp3) < 1500:
                raise RuntimeError("ElevenLabs audio response too short")
            with tempfile.TemporaryDirectory() as tmp:
                source = pathlib.Path(tmp) / "clip.mp3"
                source.write_bytes(mp3)
                subprocess.run(
                    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                     "-i", str(source), "-ac", "1", "-ar", "48000",
                     "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", str(output)],
                    check=True, timeout=90
                )
            seconds = duration(output)
            if not 1.5 <= seconds <= 45 or output.stat().st_size < 1800:
                raise RuntimeError(f"Implausible audio clip: {seconds:.2f}s")
            return seconds
        except (urllib.error.HTTPError, urllib.error.URLError, OSError, subprocess.CalledProcessError, RuntimeError) as exc:
            last = exc
            if output.exists():
                output.unlink()
            print(f"VOICE attempt {attempt}/3 failed: {type(exc).__name__} {str(exc)[:180]}", flush=True)
            if attempt != 3:
                time.sleep(attempt * 5)
    raise RuntimeError(f"Speech generation failed: {last}")

def main():
    if CONFIG.get("masterVoice", {}).get("name") != "Serhat Abu Malik – Master":
        raise RuntimeError("Incorrect master voice")
    catalog = term_catalog()
    previous = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
    if previous.get("voiceProfileId") != PROFILE or previous.get("modelId") != MODEL:
        previous = {}
    prev_entries = previous.get("entries") or {}
    entries = {}
    ASSETS.mkdir(parents=True, exist_ok=True)
    generated, reused = 0, 0

    for term in catalog:
        for level in ("basic", "deep"):
            key = term["id"] + "-" + level
            text = requested_text(term, level)
            prepared = prepare_kids_voice_text(text)
            digest = hashlib.sha256((MODEL + "|" + VOICE + "|" + prepared).encode()).hexdigest()
            output = ASSETS / (key + "-" + digest[:12] + ".m4a")
            old = prev_entries.get(key) or {}
            if old.get("preparedSha256") == digest and output.is_file() and output.stat().st_size > 1800:
                seconds = duration(output)
                reused += 1
            else:
                print(f"GENERATING {key} with Serhat Master / {MODEL}", flush=True)
                seconds = render(prepared, output)
                generated += 1
            entries[key] = {
                "text": text,
                "preparedSha256": digest,
                "url": "/kids/assets/kids-term-audio/" + output.name,
                "durationSeconds": round(seconds, 3),
                "sizeBytes": output.stat().st_size,
                "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
                "qaStatus": "passed",
                "qaType": "technical-media-validation",
                "voiceProfileId": PROFILE,
                "modelId": MODEL,
            }
    if len(entries) != len(catalog) * 2:
        raise RuntimeError("Missing term audio")
    payload = {
        "schemaVersion": 1,
        "id": "DAR_KIDS_BILINGUAL_TERM_VOICE",
        "voiceProfileId": PROFILE,
        "speaker": "Serhat Abu Malik – Master",
        "modelId": MODEL,
        "nativeArabicAudioRule": "Separate native Arabic passages remain eleven_v4.",
        "explanationRule": "Full German term definitions use cost-saving Flash v2.5.",
        "counts": {"terms": len(catalog), "clips": len(entries), "generatedThisRun": generated, "reusedThisRun": reused},
        "entries": entries,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", "utf-8")
    # Offline pre-cache is appended only after ALL audio assets pass QA.
    sw = ROOT / "kids/sw.js"
    body = sw.read_text("utf-8")
    start, end = "  // KIDS_TERM_AUDIO_PRECACHE_START", "  // KIDS_TERM_AUDIO_PRECACHE_END"
    if start in body:
        body = body[:body.index(start)] + body[body.index(end) + len(end):]
    lines = [f'  "{entry["url"]}",' for entry in entries.values()]
    block = start + "\n  \"/kids/data/term-learning-audio.json?v=1\",\n" + "\n".join(lines) + "\n  " + end
    anchor = '  "/kids/term-learning.js?v=1",'
    if anchor not in body:
        raise RuntimeError("Missing Kids term runtime SW marker")
    body = body.replace(anchor, anchor + "\n" + block)
    sw.write_text(body, "utf-8")
    print(f"TERM AUDIO COMPLETE: {len(catalog)} terms, {len(entries)} clips; generated={generated}, reused={reused}", flush=True)

if __name__ == "__main__":
    main()
