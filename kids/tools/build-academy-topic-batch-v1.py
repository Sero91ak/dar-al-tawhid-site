#!/usr/bin/env python3
"""One Academy topic, one bounded batch, existing owner V4 backend only.

No synthesis unless --generate AND ADMIN_PUBLISH_SECRET are explicitly supplied.
Writes only an isolated staging manifest and its actual verified .m4a bytes.
Never mutates the public player, lesson IDs, progress, or archived pilot files.
"""
from __future__ import annotations

import argparse
import hashlib
import fcntl
import importlib.util
import json
import os
import pathlib
import re
import sys
import tempfile
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
TOOLS = ROOT / "kids" / "tools"
sys.path.insert(0, str(TOOLS))
REQUEST = ROOT / "kids/data/academy-topic-batches/akhlaq-sidq-b01.json"
STAGING = ROOT / "kids/data/academy-audio-staging-akhlaq-sidq-b01.json"
ASSETS = ROOT / "kids/assets/kids-academy-audio"
from voice_text import prepare_kids_voice_text  # noqa: E402


def load_story_backend():
    spec = importlib.util.spec_from_file_location(
        "academy_story_v4_backend", TOOLS / "build-academy-v9-staging.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_json(p: pathlib.Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def prepare(request: dict, story) -> list[dict]:
    policy = load_json(ROOT / "kids/data/academy-voice-policy-v10.json")
    profile = request["masterVoice"]
    required = policy["voiceIdentity"]
    prod = policy["production"]
    if (
        request["id"] != "kids-academy-akhlaq-sidq-b01-20261118"
        or request["subject"] != "akhlaq"
        or request["lessonId"] != "sidq"
        or request["age"] != "4-5"
        or request["profiles"] != ["boy", "girl"]
        or request["languageCode"] != "de"
        or request["useArabicGlobalDictionary"] is not False
        or profile["voiceId"] != required["voiceId"]
        or profile["voiceProfileId"] != required["voiceProfileId"]
        or profile["modelId"] != prod["modelId"]
        or profile["settingsProfile"] != prod["profile"]
        or prod["modelId"] != "eleven_v4"
        or prod["profile"] != "kids_story"
        or prod["voiceSettings"]["speed"] != 0.91
        or request["policy"]["maximumClips"] != 4
        or request["policy"]["maximumPreparedCharacters"] != 350
        or request["policy"]["stagingOnly"] is not True
        or request["policy"]["approvedForPlayback"] is not False
        or request["policy"]["publishOnGeneration"] is not False
    ):
        raise RuntimeError("Unapproved Academy voice, language or budget policy")
    source = load_json(ROOT / request["sourcePlan"])
    if request["sourcePlan"] != "kids/data/academy-sidq-voice-plan-v18.json":
        raise RuntimeError("Unexpected source plan")
    html = (ROOT / request["sourceLesson"]).read_text("utf-8")
    if not request["sourceLesson"].startswith("kids/akademie/"):
        raise RuntimeError("Unexpected lesson source")
    allowed = {
        x["text"] for x in source.get("phrases", [])
        if any(c.get("lessonId") == "sidq" and c.get("age") == "4-5"
               and c.get("kind") == "narration" for c in x.get("contexts", []))
    }
    phrases = request["phrases"]
    if len(phrases) != 4 or len(set(phrases)) != len(phrases):
        raise RuntimeError("First topic must contain exactly four unique phrases")
    if any(t not in allowed or t not in html for t in phrases):
        raise RuntimeError("A spoken line no longer matches the real Ṣidq 4–5 lesson")
    if not hasattr(story, "prepare_academy_tts_text"):
        raise RuntimeError("Protected German/Arabic spoken-text isolator is unavailable")
    entries = []
    for t in phrases:
        if re.search(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]", t):
            raise RuntimeError("Mixed Arabic writing requires a separate Fuṣḥā request")
        # First batch is deliberately German-only. Do not infer pronunciation
        # for Arabic terms or silently replace them with the master PLS.
        if re.search(r"Ṣidq|Ṣiddīq|Qurʾān|Sūrat|Ṣaḥīḥ|Ḥadīṯ|Allāhumma|salāmu", t, re.I):
            raise RuntimeError("Unreviewed Arabic loanword in first German-only batch")
        spoken = story.prepare_academy_spoken_text(t)
        prepared = story.prepare_academy_tts_text(t)
        isolated = prepare_kids_voice_text(spoken, apply_pronunciation=False)
        if prepared != isolated:
            raise RuntimeError("Arabic MASTER lexicon contaminated German text")
        identity = {
            "text": t, "prepared": prepared,
            "voiceId": profile["voiceId"], "modelId": profile["modelId"],
            "profile": profile["settingsProfile"],
            "voiceSettings": prod["voiceSettings"],
            "languageCode": "de", "arabicDictionaryApplied": False,
            "productionRevision": "academy-topic-isolation-v1"
        }
        digest = hashlib.sha256(
            json.dumps(identity, ensure_ascii=False, sort_keys=True).encode("utf-8")
        ).hexdigest()
        entries.append({"text": t, "spokenText": spoken, "prepared": prepared, "digest": digest})
    if sum(len(p["prepared"]) for p in entries) > 350:
        raise RuntimeError("Batch is above the 350-character credit bound")
    return entries


def safe_existing(rows: dict, story) -> dict:
    checked = {}
    for text, entry in rows.items():
        if not isinstance(entry, dict) or entry.get("approvedForPlayback") is not False:
            raise RuntimeError("Unauthorized staging metadata")
        url = str(entry.get("url") or "")
        if not url.startswith("/kids/assets/kids-academy-audio/") or ".." in url:
            raise RuntimeError("Staging audio asset path invalid")
        media = ROOT / url.lstrip("/")
        if (not media.is_file() or media.stat().st_size < 1800
                or hashlib.sha256(media.read_bytes()).hexdigest() != entry.get("sha256")):
            raise RuntimeError("Previously paid staged audio is missing or modified; do not re-bill")
        if not (0.8 <= story.technical_duration(media) <= 65):
            raise RuntimeError("Existing staged audio duration invalid")
        checked[text] = entry
    return checked


def save(entries: dict):
    data = {
        "schemaVersion": 1,
        "id": "KIDS_ACADEMY_AKHLAQ_SIDQ_B01_STAGING",
        "subject": "akhlaq", "lessonId": "sidq", "age": "4-5",
        "voiceId": "DkU7j9uO4ZEtLD2iRZSH",
        "modelId": "eleven_v4", "voiceSettingsProfile": "kids_story",
        "languageCode": "de", "arabicDictionaryApplied": False,
        "stagingOnly": True, "approvedForPlayback": False,
        "requiresActualListeningAndSourceReview": True,
        "entries": entries,
    }
    STAGING.parent.mkdir(parents=True, exist_ok=True)
    temp = STAGING.with_suffix(".json.tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    temp.replace(STAGING)


def run():
    cli = argparse.ArgumentParser()
    cli.add_argument("--dry-run", action="store_true")
    cli.add_argument("--generate", action="store_true")
    args = cli.parse_args()
    if args.generate == args.dry_run:
        raise SystemExit("Select exactly one: --dry-run (free) or --generate (billable)")
    # Serialize the entire state/read/cache/generate/write sequence. This also
    # prevents two authorized invocations from charging for the same phrase.
    lock_name = hashlib.sha256(str(STAGING.resolve()).encode("utf-8")).hexdigest()[:24]
    lock_path = pathlib.Path(tempfile.gettempdir()) / f"dar-kids-academy-{lock_name}.lock"
    with lock_path.open("a+") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        run_locked(args)


def run_locked(args):
    request = load_json(REQUEST)
    story = load_story_backend()
    batches = prepare(request, story)
    # All source/voice checks complete before any billable call.
    existing_file = load_json(STAGING) if STAGING.is_file() else {}
    if existing_file:
        if (existing_file.get("id") != "KIDS_ACADEMY_AKHLAQ_SIDQ_B01_STAGING"
                or existing_file.get("voiceId") != request["masterVoice"]["voiceId"]
                or existing_file.get("modelId") != "eleven_v4"
                or existing_file.get("voiceSettingsProfile") != "kids_story"
                or existing_file.get("stagingOnly") is not True
                or existing_file.get("approvedForPlayback") is not False):
            raise RuntimeError("Unexpected staging state; no credits used")
    done = safe_existing(existing_file.get("entries", {}), story)
    if set(done) - {row["text"] for row in batches}:
        raise RuntimeError("Staging contains unrelated lesson text")
    expected_digests = {r["text"]: r["digest"] for r in batches}
    mismatches = [text for text, entry in done.items()
                  if entry.get("preparedSha256") != expected_digests.get(text)]
    if mismatches:
        raise RuntimeError("Existing staged identity differs; explicit review required; no regeneration")
    waiting = [r for r in batches if r["text"] not in done]
    print(f"Ṣidq 4–5, first topic batch: {len(done)}/4 technically staged, "
          f"{len(waiting)} pending, "
          f"{sum(len(r['prepared']) for r in waiting)} pending characters. "
          f"Model eleven_v4; kids_story; DE-only; no public release.", flush=True)
    if args.dry_run or not waiting:
        return
    secret = os.getenv("ADMIN_PUBLISH_SECRET", "").strip()
    if not secret:
        raise RuntimeError("ADMIN_PUBLISH_SECRET unavailable; zero clips generated")
    if not (os.getenv("ELEVENLABS_TOPIC_JOB_ACK", "") == request["id"]):
        raise RuntimeError("Exact owner-authorized topic job acknowledgement missing")
    ASSETS.mkdir(parents=True, exist_ok=True)
    for row in waiting:
        file = ASSETS / (row["digest"][:20] + ".m4a")
        if file.exists():
            raise RuntimeError("Unregistered cached media requires explicit voice/provenance review; no regeneration")
        else:
            duration, resolved_voice_id = story.generate_audio(
                row["text"], file, secret, include_voice_id=True
            )
            time.sleep(0.25)
            if resolved_voice_id != request["masterVoice"]["voiceId"]:
                file.unlink(missing_ok=True)
                raise RuntimeError("Resolved synthesis voice differs from approved Master voice")
        done[row["text"]] = {
            "url": "/" + file.relative_to(ROOT).as_posix(),
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
            "preparedSha256": row["digest"],
            "spokenText": row["spokenText"],
            "durationSeconds": round(duration, 3),
            "voiceId": request["masterVoice"]["voiceId"],
            "voiceProfileId": request["masterVoice"]["voiceProfileId"],
            "modelId": "eleven_v4",
            "voiceSettingsProfile": "kids_story",
            "languageCode": "de",
            "arabicDictionaryApplied": False,
            "sourceVoice": "authorized-owner-voice",
            "sourceSpeaker": "Serhat Abu Malik",
            "sameAsApprovedKidsStoryProfile": True,
            "qaStatus": "technical-only-awaiting-acoustic-review",
            "approvedForPlayback": False,
        }
        save(done)
        print(f"Staged 1 verified V4 binary for Ṣidq: {len(done)}/4; never published", flush=True)


if __name__ == "__main__":
    run()
