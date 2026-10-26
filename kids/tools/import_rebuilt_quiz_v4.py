#!/usr/bin/env python3
"""Collect 3 paid ElevenLabs V4 CI artifacts into an isolated review branch.

Never writes any production live audio manifest or deletes historical assets.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/review-only/quiz-v4-full-rebuild-20261026/450-speech-scripts.json"
PARTS = ("question", "correct", "retry", "explanation")
BANDS = ("4-6", "7-8", "9-10")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--artifacts-root", required=True, type=Path)
    p.add_argument("--destination", default=ROOT / "kids/assets/kids-quiz-audio/v4-full-rebuild-20261026", type=Path)
    p.add_argument("--manifest", default=ROOT / "kids/data/quiz-v4-full-rebuild-review.json", type=Path)
    args = p.parse_args()
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    expected = {q["questionId"]: q for q in plan["items"]}
    if len(expected) != 450 or plan["modelId"] != "eleven_v4" or plan["voiceId"] != VOICE:
        raise SystemExit("Source plan incorrect")
    found = {}
    checks = list(args.artifacts_root.rglob("checkpoint.json"))
    if len(checks) != 3:
        raise SystemExit(f"Expected 3 complete age artifacts; got {len(checks)}")
    for checkpoint_path in checks:
        c = json.loads(checkpoint_path.read_text(encoding="utf-8"))
        band = c["band"]
        if band not in BANDS or band in found or c["questionsCompleted"] != 150 or len(c["entries"]) != 150:
            raise SystemExit(f"Incomplete or duplicated band {band}")
        found[band] = c
    result = {"schemaVersion":1, "id":"TAWHID_KIDS_450_V4_NEW_REBUILD_REVIEW",
              "modelId":"eleven_v4", "voiceId":VOICE, "voiceName":"Serhat Abu Malik – Master",
              "releaseEnabled":False, "humanListeningApproved":False,
              "sourceQuestions":"kids/data/quiz-kids-public-450.json",
              "questions":{}, "releaseNotes":"Not live. Human Fuṣḥā/Makhāriǧ and breath QA required."}
    for band in BANDS:
        check = found[band]
        for entry in check["entries"]:
            qid = entry["questionId"]
            if qid in result["questions"] or qid not in expected or entry["ageBand"] != band:
                raise SystemExit(f"Unexpected, duplicate or wrong-age question {qid}")
            if set(entry["parts"]) != set(PARTS):
                raise SystemExit(f"Missing audio part: {qid}")
            payload = {"ageBand": band, "source": expected[qid]["source"], "clips": {}}
            for kind in PARTS:
                clip = entry["parts"][kind]
                if (clip["modelId"] != "eleven_v4" or clip["voiceId"] != VOICE or
                    clip["approvedForPlayback"] is not False or clip["humanListeningApproved"] is not False):
                    raise SystemExit(f"Unapproved data metadata changed: {qid}:{kind}")
                if clip["ttsText"] != expected[qid]["parts"][kind]["ttsText"]:
                    raise SystemExit(f"Audio-to-script mismatch: {qid}:{kind}")
                original = checkpoint_path = next(path for path in checks if json.loads(path.read_text(encoding="utf-8"))["band"] == band)
                source = original.parent / clip["url"]
                if not source.is_file() or digest(source) != clip["sha256"] or source.stat().st_size < 1700:
                    raise SystemExit(f"MP3 missing or corrupt: {qid}:{kind}")
                target = args.destination / band / source.name
                target.parent.mkdir(parents=True, exist_ok=True)
                if target.exists() and digest(target) != clip["sha256"]:
                    raise SystemExit(f"Collision: {target}")
                if not target.exists():
                    shutil.copyfile(source, target)
                payload["clips"][kind] = {
                    "url": "/" + target.relative_to(ROOT).as_posix(),
                    "sha256": clip["sha256"], "durationSeconds": clip["durationSeconds"],
                    "text": expected[qid]["parts"][kind]["displayText"],
                    "ttsTextSha256": clip["ttsTextSha256"],
                    "modelId":"eleven_v4", "voiceId":VOICE,
                    "humanListeningApproved":False, "approvedForPlayback":False,
                }
            result["questions"][qid] = payload
    if len(result["questions"]) != 450 or sum(len(q["clips"]) for q in result["questions"].values()) != 1800:
        raise SystemExit("450 × 4 invariant failed")
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"PASS: {len(result['questions'])} questions / 1800 exact MP3 slots, V4 Master, age and hash verified; review only")
    print(f"Unique MP3 files: {len(list(args.destination.rglob('*.mp3')))}")

if __name__ == "__main__":
    main()
