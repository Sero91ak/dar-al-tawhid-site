#!/usr/bin/env python3
"""TAWḤĪD KIDS · Schätze der Salaf · atomic, evidence-gated public audio packer.

Zero ElevenLabs calls. --audit never writes files. --promote only accepts all
33 genuinely reviewed master recordings with exact audio/text SHA-256 and
paragraph synchronization; the public Kids story catalog remains untouched
unless every check succeeds. Run in an isolated checked-out publication branch.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
CATALOG = ROOT / "kids/data/salaf-library-v1.json"
QA = ROOT / "kids/audio-jobs/salaf-v4-human-approval-20261028.json"
PILOT = ROOT / "kids/review-only/salaf-v4-20261027"
NEW_ROOT = ROOT / "kids/review-only/salaf-v4-complete-20261028"
PLAN = ROOT / "kids/audio-jobs/salaf-v4-remaining-plan-20261028.json"
PUBLIC = ROOT / "kids/audio/salaf"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
PROFILE = "kids_story"
EXPECTED = 33
REVIEW_FIELDS = (
    "germanPronunciationPassed",
    "fushaTermsPassed",
    "iphonePlaybackPassed",
    "ipadPlaybackPassed",
    "textAudioParityPassed",
    "paragraphTimingPassed",
    "fullAudioListened",
    "noAudibleArtifacts",
)
SHA = re.compile(r"^[a-f0-9]{64}$")


def read(path: pathlib.Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(value: bytes):
    return hashlib.sha256(value).hexdigest()


def check(condition, message):
    if not condition:
        raise ValueError(message)


def review_entries():
    check(QA.is_file(), "No human-listening approval file; release prohibited.")
    qa = read(QA)
    check(qa.get("schemaVersion") == 1, "Unknown human QA schema")
    check(qa.get("collection") == "Schätze der Salaf", "Wrong review collection")
    check(qa.get("reviewMode") == "manual-full-listening", "Not an actual manual full listening review")
    check(qa.get("ownerAuthorizedPublicRelease") is True, "Missing explicit owner publication approval")
    entries = qa.get("entries")
    check(isinstance(entries, dict), "QA entries must be keyed by story ID")
    return entries


def inspect(require_human):
    data, plan = read(CATALOG), read(PLAN)
    approved = [s for s in data["items"] if s.get("verification") == "approved" and s.get("editorialRelease") is True]
    blocked = [s for s in data["items"] if s not in approved]
    check(len(data["items"]) == 34 and len(approved) == EXPECTED and len(blocked) == 1,
          "Salaf editorial inventory changed; refuse promotion")
    check(plan["remainingStoryCount"] == 29 and len(plan["batches"]) == 8,
          "29-master inventory or batch count changed")
    pilot = plan["pilot"]["storyIds"]
    new = [id for b in plan["batches"] for id in b["storyIds"]]
    check(len(pilot) == 4 and len(new) == 29 and len(set(pilot + new)) == EXPECTED,
          "Duplicate or missing story in launch plan")
    check(set(pilot + new) == {s["id"] for s in approved}, "Story approval set mismatch")
    stage = {}
    for id in pilot:
        path = PILOT / "manifest.json"
        check(path.is_file(), "Missing pilot manifest: " + str(path))
        m = read(path)
        check(m["publicRelease"] is False and m["mode"] == "staging-review-only",
              "Pilot release isolation breached")
        check(id in m["entries"], "Missing pilot record " + id)
        stage[id] = m["entries"][id]
    for batch in plan["batches"]:
        path = NEW_ROOT / batch["batchId"] / "manifest.json"
        check(path.is_file(), "Missing new staged manifest: " + str(path))
        m = read(path)
        check(m.get("publicRelease") is False and m.get("mode") == "staging-review-only",
              "Staging manifest must remain review-only")
        check(set(m.get("entries", {})) == set(batch["storyIds"]),
              "Wrong batch membership: " + batch["batchId"])
        for id, entry in m["entries"].items():
            check(id not in stage, "Duplicate staged story " + id)
            stage[id] = entry
    check(len(stage) == EXPECTED, "Not all 33 recordings are staged")
    evidence = review_entries() if require_human else None
    if require_human:
        check(set(evidence) == set(stage), "Human review does not cover exactly 33 stories")

    results = []
    for story in approved:
        id = story["id"]
        entry = stage[id]
        check(entry.get("status") == "technical-passed-awaiting-human-listening",
              id + ": not technically successful")
        check(entry.get("approvedForPlayback") is False and
              entry.get("humanListeningApproved") is False and
              entry.get("releaseEnabled") is False and
              entry.get("stagingOnly") is True, id + ": staging flags changed")
        check(entry.get("voiceId") == VOICE and
              entry.get("voiceProfileId") == "serhat-owner-voice-2026" and
              entry.get("modelId") == MODEL and entry.get("profile") == PROFILE and
              entry.get("languageCode") == "de" and
              entry.get("globalArabicDictionaryApplied") is False,
              id + ": Fuṣḥā/German/voice/model isolation invalid")
        text_bytes = story["masterStoryText"].encode("utf-8")
        check(SHA.fullmatch(entry.get("textSha256", "")) and
              entry["textSha256"] == sha(text_bytes), id + ": changed master text SHA")
        audio_path = ROOT / str(entry.get("audioFile", ""))
        check(audio_path.is_file() and audio_path.resolve().is_relative_to(ROOT.resolve()),
              id + ": missing/unsafe review audio path")
        expected_pilot = "kids/review-only/salaf-v4-20261027/" + id + ".m4a"
        new_pattern = ("kids/review-only/salaf-v4-complete-20261028/" +
                       next(b["batchId"] for b in plan["batches"] if id in b["storyIds"]) + "/" +
                       id + ".m4a") if id in new else None
        check(entry["audioFile"] == (expected_pilot if id in pilot else new_pattern),
              id + ": staged path is not canonical")
        audio_bytes = audio_path.read_bytes()
        check(len(audio_bytes) > 8000 and SHA.fullmatch(entry.get("audioSha256", "")) and
              entry["audioSha256"] == sha(audio_bytes), id + ": review audio corrupted")
        paragraph_count = len(re.split(r"\n{2,}", story["masterStoryText"]))
        cues = entry.get("timings")
        check(entry.get("timingStatus") == "character-alignment-exact" and
              isinstance(cues, list) and len(cues) == paragraph_count,
              id + ": exact paragraph alignment absent")
        duration = float(entry.get("durationSec") or 0)
        check(25 <= duration <= 540, id + ": implausible duration")
        for i, cue in enumerate(cues):
            check(cue.get("paragraphIndex") == i and
                  0 <= float(cue["start"]) < float(cue["end"]) <= duration + .5,
                  id + ": invalid paragraph " + str(i))
            if i:
                check(float(cues[i-1]["start"]) < float(cue["start"]),
                      id + ": unordered paragraphs")

        if require_human:
            vote = evidence[id]
            check(vote.get("storyId") == id and vote.get("audioSha256") == entry["audioSha256"]
                  and vote.get("textSha256") == entry["textSha256"],
                  id + ": review evidence is not bound to exact audio and text")
            check(isinstance(vote.get("reviewer"), str) and len(vote["reviewer"].strip()) >= 3,
                  id + ": missing identifiable real reviewer")
            check(isinstance(vote.get("reviewedAt"), str) and
                  re.match(r"^20\d{2}-\d{2}-\d{2}T", vote["reviewedAt"]),
                  id + ": missing actual review timestamp")
            check(isinstance(vote.get("qaEvidenceReference"), str) and
                  len(vote["qaEvidenceReference"].strip()) > 10,
                  id + ": missing listening evidence reference")
            for field in REVIEW_FIELDS:
                check(vote.get(field) is True, id + ": hearing check is unconfirmed: " + field)
            review_evidence = {k: vote[k] for k in REVIEW_FIELDS}
            review_evidence.update({
                "reviewer": vote["reviewer"],
                "reviewedAt": vote["reviewedAt"],
                "qaEvidenceReference": vote["qaEvidenceReference"],
            })
        else:
            review_evidence = None
        results.append((story, entry, audio_bytes, review_evidence))
    return data, results


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--audit", action="store_true", help="Prove all 33 technical stage files, no write")
    mode.add_argument("--promote", action="store_true", help="Only with full manual audio QA evidence")
    args = parser.parse_args()
    data, results = inspect(require_human=args.promote)
    if args.audit:
        print("PASS: 33 / 33 audio masters, exact text/sha/model/voice/paragraph timing validated; zero new credits")
        print("PUBLIC RELEASE NOT ATTEMPTED. Human listening is independently required.")
        return
    # Stage all validated files on a dedicated promotion PR branch; publication
    # requires code-review, CI and merge. Never mark a story approved from TTS alone.
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for story, entry, payload, evidence in results:
        id = story["id"]
        target = PUBLIC / (id + ".m4a")
        if target.exists():
            check(sha(target.read_bytes()) == entry["audioSha256"],
                  id + ": existing public audio differs, refuse overwrite")
        else:
            target.write_bytes(payload)
        story["audioMaster"] = {
            "url": "/kids/audio/salaf/" + id + ".m4a",
            "sha256": entry["audioSha256"],
            "textSha256": entry["textSha256"],
            "voiceId": VOICE,
            "voiceProfileId": "serhat-owner-voice-2026",
            "modelId": MODEL,
            "profile": PROFILE,
            "languageCode": "de",
            "globalArabicDictionaryApplied": False,
            "humanListeningApproved": True,
            "approvedForPlayback": True,
            "releaseEnabled": True,
            "durationSec": entry["durationSec"],
            "timings": entry["timings"],
            "approvalEvidence": {
                "reviewer": evidence["reviewer"],
                "reviewedAt": evidence["reviewedAt"],
                "germanPronunciationPassed": evidence["germanPronunciationPassed"],
                "fushaTermsPassed": evidence["fushaTermsPassed"],
                "iphonePlaybackPassed": evidence["iphonePlaybackPassed"],
                "ipadPlaybackPassed": evidence["ipadPlaybackPassed"],
                "textAudioParityPassed": evidence["textAudioParityPassed"],
                "qaEvidenceReference": evidence["qaEvidenceReference"],
            },
        }
        story["audioStatus"] = "owner-human-review-approved"
    # Write the public manifest LAST, after every audio file has been validated/copied.
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("READY FOR REVIEW: 33 SHA-locked, human-listening-approved master audios + public catalog")
    print("Run node scripts/kids-master-text-standard-v2-check.js and all CI before merging release PR.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("RELEASE BLOCKED:", error, file=sys.stderr)
        sys.exit(2)
