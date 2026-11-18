#!/usr/bin/env python3
"""Prevent partial Academy lessons going live. First topic: Akhlāq / Ṣidq.

A topic moves to the public audio manifest only after every canonical phrase
is present as a *real* Serhat V4 kids_story audio asset, verified against its
SHA-256 and individually signed off in the QA ledger. Never bills credits.
A Git commit is not a confirmed Cloudflare deployment.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FOLDER = ROOT / "kids/data/academy-topic-batches"
LEDGER = FOLDER / "akhlaq-sidq-review-ledger-v1.json"
RELEASE = FOLDER / "release-state-v1.json"
PUBLIC = ROOT / "kids/data/academy-audio.json"
VOICE_ID = "DkU7j9uO4ZEtLD2iRZSH"
SPEAKER = "Serhat Abu Malik"
PROFILE_ID = "serhat-owner-voice-2026"
ID = "KIDS_ACADEMY_SERHAT_MASTER_V1"
TOPIC = "sidq"
SUBJECT = "akhlaq"
AGE_KEYS = {"4-5", "6-8", "9-10"}


def read_json(path):
    return json.loads(path.read_text("utf-8"))


def canonical_phrases():
    origin = read_json(ROOT / "kids/data/academy-sidq-voice-plan-v18.json")
    salam = read_json(ROOT / "kids/data/academy-full-salam-voice-plan-v19.json")
    if origin["lessonId"] != TOPIC:
        raise RuntimeError("Canonical source lesson has changed")
    records = [
        x for x in origin["phrases"]
        if not x["text"].startswith("As-salāmu ʿalaykum, ")
    ] + salam["phrases"]
    phrases = [r["text"] for r in records]
    if len(phrases) != 58 or len(set(phrases)) != 58:
        raise RuntimeError("Ṣidq exact source inventory has drifted: release blocked")
    ages = {c.get("age") for row in records for c in row["contexts"]}
    if not AGE_KEYS.issubset(ages):
        raise RuntimeError("Age groups are not completely represented")
    needed = {"narration", "greeting", "address", "question", "answer", "summary"}
    kinds = {c.get("kind") for row in records for c in row["contexts"]}
    if not needed.issubset(kinds):
        raise RuntimeError("A lesson content kind is missing")
    return records


def staged_assets():
    result = {}
    candidates = [
        ROOT / "kids/data/academy-audio-staging-v9.json",
        *sorted((ROOT / "kids/data").glob("academy-audio-staging-akhlaq-sidq-b*.json")),
    ]
    for path in candidates:
        if not path.is_file():
            continue
        doc = read_json(path)
        if doc.get("stagingOnly") is not True:
            raise RuntimeError(f"Not an isolated staging pack: {path.name}")
        for phrase, asset in doc.get("entries", {}).items():
            if phrase in result:
                if asset.get("sha256") != result[phrase].get("sha256"):
                    raise RuntimeError(f"Conflicting staged media for phrase: {phrase}")
            else:
                result[phrase] = asset
    return result


def is_valid_asset(text, asset, record):
    if not isinstance(asset, dict) or not isinstance(record, dict):
        return False
    if (
        asset.get("voiceId") != VOICE_ID
        or asset.get("voiceProfileId") != PROFILE_ID
        or asset.get("modelId") != "eleven_v4"
        or asset.get("voiceSettingsProfile") != "kids_story"
        or asset.get("sourceVoice") != "authorized-owner-voice"
        or asset.get("sourceSpeaker") != SPEAKER
        or asset.get("sameAsApprovedKidsStoryProfile") is not True
        or asset.get("deprecatedForPlayback") is True
    ):
        return False
    # No 'approvedForPlayback' on staging: this is set *only* at publication.
    if asset.get("approvedForPlayback") is not False:
        return False
    url = asset.get("url")
    if not isinstance(url, str) or not url.startswith("/kids/assets/kids-academy-audio/"):
        return False
    if "?" in url or "#" in url or ".." in url or not url.endswith(".m4a"):
        return False
    local = ROOT / url.lstrip("/")
    if not local.is_file() or local.stat().st_size < 1800:
        return False
    digest = hashlib.sha256(local.read_bytes()).hexdigest()
    if digest != asset.get("sha256") or digest != record.get("sha256"):
        return False
    try:
        duration = float(asset.get("durationSeconds"))
    except (TypeError, ValueError):
        return False
    if not (0.8 <= duration <= 90):
        return False
    if record.get("sourceText") != text or record.get("audioPath") != url:
        return False
    if record.get("reviewStatus") != "approved-after-acoustic-audit":
        return False
    if record.get("reviewedBy") != "owner" or not record.get("reviewedAt"):
        return False
    if not all(record.get(key) is True for key in (
        "exactTextVerified", "arabicPronunciationVerified",
        "fuṣḥāLexiconChecked", "profileAndAgeVerified",
        "audioPlaybackVerified", "sourcesReviewed",
    )):
        return False
    try:
        dt.datetime.fromisoformat(record["reviewedAt"].replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return False
    return True


def coverage():
    release_state = read_json(RELEASE)
    if (release_state.get("currentSubject") != SUBJECT
            or release_state.get("currentTopic") != TOPIC
            or release_state.get("status") not in ("recording", "qa", "ready-for-release", "audio-generated-awaiting-original-binary-import")):
        raise RuntimeError("Next-topic lock or unexpected state; publication refused")
    ledger = read_json(LEDGER)
    if ledger.get("subject") != SUBJECT or ledger.get("lessonId") != TOPIC:
        raise RuntimeError("QA ledger is for a different topic")
    rows = canonical_phrases()
    staged = staged_assets()
    approved = ledger.get("entries", {})
    expected = {r["text"] for r in rows}
    # A mismatching or obsolete spoken key is a release blocker, not a silent add.
    if set(approved) - expected:
        raise RuntimeError("Unexpected QA-approved phrase outside canonical Ṣidq inventory")
    confirmed = {}
    missing = []
    for row in rows:
        phrase = row["text"]
        asset = staged.get(phrase)
        approval = approved.get(phrase)
        if is_valid_asset(phrase, asset, approval):
            confirmed[phrase] = asset
        else:
            missing.append(phrase)
    return confirmed, missing, expected


def do_publish():
    approved, missing, expected = coverage()
    if missing:
        raise RuntimeError(
            f"RELEASE BLOCKED — Ṣidq is incomplete: {len(approved)}/{len(expected)} "
            f"certified owner-V4 audio clips. Next topic remains locked."
        )
    public = read_json(PUBLIC)
    if public.get("id") != ID or public.get("voiceProfileId") != PROFILE_ID:
        raise RuntimeError("Public manifest identity unexpectedly changed")
    # Preserve any other previously released certified V4 lessons, but do not
    # keep a Flash clip or an unreviewed pilot masquerading as Academy speech.
    entries = {
        k: v for k, v in public.get("entries", {}).items()
        if (
            v.get("modelId") == "eleven_v4"
            and v.get("voiceId") == VOICE_ID
            and v.get("voiceSettingsProfile") == "kids_story"
            and v.get("approvedForPlayback") is True
        )
    }
    for phrase, asset in approved.items():
        entries[phrase] = {
            **asset,
            "approvedForPlayback": True,
            "qaStatus": "approved-after-acoustic-audit",
            "sourceLessonId": TOPIC,
            "sourceSubject": SUBJECT,
            "publicRelease": "topic-only-sidq-v1",
        }
    public["entries"] = entries
    public["policy"] = (
        "Exact owner-voice V4 kids_story recordings only; topic releases require "
        "complete source, approved acoustic QA and identical media hashes."
    )
    public["manualReviewNote"] = "All published Academy V4 clips individually signed off."
    # Public manifest mutation is atomic. Still REQUIRES GitHub PR, deployed
    # Cloudflare main and real device QA to count as a live release.
    temp = PUBLIC.with_suffix(".json.temp")
    temp.write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n", "utf-8")
    temp.replace(PUBLIC)
    release = read_json(RELEASE)
    release["status"] = "prepared-for-live-deployment"
    release["fullyCertifiedCount"] = len(approved)
    release["expectedCount"] = len(expected)
    release["liveConfirmed"] = False
    release["publishedUtc"] = None
    temp2 = RELEASE.with_suffix(".json.temp")
    temp2.write_text(json.dumps(release, ensure_ascii=False, indent=2) + "\n", "utf-8")
    temp2.replace(RELEASE)
    print("Ṣidq manifest prepared for PR/deployment. NOT yet confirmed live. "
          "Next topic remains locked.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    if args.status == args.publish:
        parser.error("Provide exactly --status or --publish")
    confirmed, missing, expected = coverage()
    if args.status:
        print(json.dumps({
            "subject": SUBJECT, "topic": TOPIC,
            "complete": not missing, "confirmed": len(confirmed),
            "required": len(expected), "missing": len(missing),
            "canPublish": not missing,
            "nextTopicLocked": True, "publicManifestModified": False,
        }, ensure_ascii=False))
        return
    do_publish()


if __name__ == "__main__":
    main()
