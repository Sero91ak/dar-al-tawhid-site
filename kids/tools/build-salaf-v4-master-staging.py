#!/usr/bin/env python3
"""TAWḤĪD KIDS · Schätze der Salaf · single-master ElevenLabs V4 staging.

An explicitly approved request is required. At most four entire master texts
per invocation. No retries, no public catalog modification, no automatic QA.
"""
from __future__ import annotations
import base64
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ROOT / "kids/data/salaf-library-v1.json"
REQUEST = ROOT / "kids/audio-jobs/salaf-v4-request-20261027.json"
POLICY = ROOT / "kids/data/academy-voice-policy-v10.json"
LANG_POLICY = ROOT / "data/pronunciation/voice-language-isolation-v1.json"
STAGE = ROOT / "kids/review-only/salaf-v4-20261027"
MANIFEST = STAGE / "manifest.json"
API = "https://dar-admin-publisher.sero91ak.workers.dev/voice-studio/api/generate-with-timings"
MODEL = "eleven_v4"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
PROFILE = "kids_story"
ARABIC_SCRIPT = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def digest(value: bytes):
    return hashlib.sha256(value).hexdigest()

def save(doc):
    STAGE.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def duration(path):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ], text=True).strip())

def timings(text, answer, source_duration, output_duration):
    # Only use provably aligned character offsets. Never fake timestamps.
    alignment = answer.get("alignment") or answer.get("normalizedAlignment") or {}
    chars = alignment.get("characters") or []
    starts = alignment.get("character_start_times_seconds") or []
    joined = "".join(str(c) for c in chars)
    if joined != text or len(starts) != len(chars):
        return [], "alignment-needs-review"
    sections = [s for s in re.split(r"\n{2,}", text) if s.strip()]
    offsets, pos = [], 0
    for part in sections:
        found = text.find(part, pos)
        if found < pos:
            return [], "alignment-needs-review"
        offsets.append(found)
        pos = found + len(part)
    if not offsets or not source_duration or not output_duration:
        return [], "alignment-needs-review"
    scale = output_duration / source_duration
    markers = [max(0.0, float(starts[i]) * scale) for i in offsets]
    if any(b <= a for a, b in zip(markers, markers[1:])):
        return [], "alignment-needs-review"
    result = []
    for n, start in enumerate(markers):
        end = markers[n + 1] if n + 1 < len(markers) else output_duration
        result.append({"paragraphIndex": n, "start": round(start, 3), "end": round(end, 3)})
    return result, "character-alignment-exact"

def verify_contract():
    req, data, policy, lang = load(REQUEST), load(SOURCE), load(POLICY), load(LANG_POLICY)
    if (req.get("authorization") != "OWNER_EXPLICIT_SALAF_AUDIO_2026_10_27"
        or req.get("mode") != "staging-review-only"
        or req.get("allowLivePublication") is not False
        or req.get("retryPaidRequests") is not False):
        raise RuntimeError("Explicit staged user authorization absent")
    ids = req.get("storyIds", [])
    if not isinstance(ids, list) or not 1 <= len(ids) <= 4 or len(set(ids)) != len(ids):
        raise RuntimeError("Expected 1-4 unique whole-story IDs")
    if req.get("maxClips") != len(ids) or not 1000 <= req.get("maxTotalCharacters", 0) <= 18000:
        raise RuntimeError("Manual credit budget invalid")
    if (policy["voiceIdentity"]["voiceId"] != VOICE
        or policy["production"]["modelId"] != MODEL
        or policy["production"]["profile"] != PROFILE
        or lang["german"]["pronunciationDictionaryLocators"] != []
        or lang["german"]["languageCodeProviderArgument"] != "de"):
        raise RuntimeError("Master identity or German-only language boundary changed")
    backend = (ROOT / "cloudflare/video-studio/voice.js").read_text(encoding="utf-8")
    section = backend.split('profile === "kids_story"', 1)[1].split('profile === "kids_lesson"', 1)[0]
    for key, val in policy["production"]["voiceSettings"].items():
        needle = f"{key}: {str(val).lower() if isinstance(val, bool) else val}"
        if needle not in section:
            raise RuntimeError("Kids story voice-setting changed: " + key)
    if ('language_code: nativeArabicScriptOnly ? "ar" : "de"' not in backend
        or 'const pronunciationDictionaryApplied = false' not in backend):
        raise RuntimeError("Backend no longer isolates languages and dictionaries")
    lookup = {x["id"]: x for x in data["items"]}
    stories = []
    for sid in ids:
        item = lookup.get(sid)
        if not item or item.get("verification") != "approved" or item.get("editorialRelease") is not True:
            raise RuntimeError("Unapproved Salaf story: " + sid)
        if item.get("audioMaster"):
            raise RuntimeError("Approved audio already exists: " + sid)
        source = item["masterStoryText"]
        if not source.startswith("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"):
            raise RuntimeError("Full opening Salām absent")
        if not source.endswith("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."):
            raise RuntimeError("Full closing Salām absent")
        if ARABIC_SCRIPT.search(source):
            raise RuntimeError(sid + ": Mixed Arabic/DE script needs isolated segments; no forced replacement")
        if not 350 <= len(source.split()) <= 1000 or len(source) > 5000:
            raise RuntimeError(sid + ": Not a complete 350-1000 word master or >5000 characters")
        stories.append((sid, source))
    if sum(len(t) for _, t in stories) > req["maxTotalCharacters"]:
        raise RuntimeError("Batch exceeds explicit character credit budget")
    return stories, req

def produce(sid, text, secret):
    # Send the exact original German narrative; do not run older Arabic PLS,
    # replace 'Nur', insert Arabic script, or rewrite any canonical master text.
    payload = json.dumps({"text": text, "prepared": text, "profile": PROFILE},
                         ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(API, data=payload, method="POST", headers={
        "X-Admin-Secret": secret,
        "Origin": "https://dar-al-tawhid.de",
        "Referer": "https://dar-al-tawhid.de/voice-studio/",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "TAWHID-KIDS-SALAF-V4-ONE-MASTER/1"
    })
    # Exactly ONE paid request. A timeout might still have charged credits.
    with urllib.request.urlopen(request, timeout=260) as response:
        answer = json.loads(response.read().decode("utf-8"))
    raw = base64.b64decode(str(answer.get("audioBase64") or ""), validate=True)
    if len(raw) < 7000 or not (raw.startswith(b"ID3") or (raw[0] == 255 and raw[1] & 0xe0 == 0xe0)):
        raise RuntimeError("ElevenLabs returned incomplete MP3")
    STAGE.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        original = pathlib.Path(tmp) / "source.mp3"
        original.write_bytes(raw)
        source_secs = duration(original)
        target = STAGE / (sid + ".m4a")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-i", str(original), "-af", "loudnorm=I=-18:TP=-2:LRA=7",
                        "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "48k",
                        "-movflags", "+faststart", str(target)], check=True)
    secs = duration(target)
    if not (25 <= secs <= 540) or target.stat().st_size < 8000:
        raise RuntimeError("Implausible technical audio duration/size; needs manual review")
    cues, cue_status = timings(text, answer, source_secs, secs)
    return {
        "storyId": sid, "status": "technical-passed-awaiting-human-listening",
        "approvedForPlayback": False, "humanListeningApproved": False,
        "releaseEnabled": False,
        "stagingOnly": True,
        "audioFile": str(target.relative_to(ROOT)),
        "audioSha256": digest(target.read_bytes()), "textSha256": digest(text.encode("utf-8")),
        "voiceId": VOICE, "voiceProfileId": "serhat-owner-voice-2026",
        "modelId": MODEL, "profile": PROFILE, "languageCode": "de",
        "globalArabicDictionaryApplied": False, "durationSec": round(secs, 3),
        "timings": cues, "timingStatus": cue_status,
        "qaRequired": ["full-text audio parity", "German Nur not Arabic Nūr",
                       "natural Fuṣḥā loanword pronunciation", "smooth endings",
                       "paragraph sync", "iPhone/iPad listening"],
    }

def main():
    stories, req = verify_contract()
    if sys.argv[1:] == ["--preflight"]:
        print("PREFLIGHT OK: exact master voice, 4 approved full stories, 0 paid calls",
              "total characters:", sum(len(t) for _, t in stories))
        return
    if sys.argv[1:]:
        raise RuntimeError("Only --preflight is accepted; no silent alternate modes")
    manifest = load(MANIFEST) if MANIFEST.exists() else {
        "schemaVersion": 1, "collection": "Schätze der Salaf",
        "mode": "staging-review-only", "publicRelease": False, "entries": {}
    }
    entries = manifest.setdefault("entries", {})
    if manifest.get("publicRelease") is not False or manifest.get("mode") != "staging-review-only":
        raise RuntimeError("Staging manifest unexpectedly public")
    secret = os.environ.get("ADMIN_PUBLISH_SECRET", "").strip()
    if not secret:
        raise RuntimeError("ADMIN_PUBLISH_SECRET absent; no ElevenLabs calls made")
    print("Approved complete scripts:", len(stories),
          "total characters:", sum(len(t) for _, t in stories), flush=True)
    failures = []
    for sid, text in stories:
        prev = entries.get(sid)
        if prev:
            saved = ROOT / str(prev.get("audioFile") or "")
            if (prev.get("textSha256") == digest(text.encode("utf-8"))
                and prev.get("audioSha256") and saved.is_file()
                and digest(saved.read_bytes()) == prev["audioSha256"]):
                print(sid, "already staged, ZERO new credits", flush=True)
                continue
            raise RuntimeError(sid + ": old stage/unknown charge; investigate before retry")
        if (STAGE / (sid + ".m4a")).exists():
            raise RuntimeError(sid + ": orphaned audio file exists; billing and hash review required")
        print("One V4 generation:", sid, "chars:", len(text), flush=True)
        try:
            row = produce(sid, text, secret)
            entries[sid] = row
            save(manifest)
            print(sid, "staged", row["durationSec"], "secs", row["timingStatus"], flush=True)
        except Exception as error:
            # Do not retry on any provider/network error: the provider may
            # already have charged for the request.
            entries[sid] = {
                "storyId": sid, "status": "billing-investigation-required",
                "approvedForPlayback": False, "humanListeningApproved": False,
                "releaseEnabled": False, "stagingOnly": True,
                "textSha256": digest(text.encode("utf-8")),
                "errorType": type(error).__name__,
                "note": "No automatic retry. Check ElevenLabs billing/history first."
            }
            save(manifest)
            failures.append(sid)
            break
    if failures:
        raise RuntimeError("Staging interrupted. Inspect billing before retry: " + ",".join(failures))
    print("Staging ready; no audio published to children.", flush=True)

if __name__ == "__main__":
    main()
