#!/usr/bin/env python3
"""Independent SHA/codec/assignment audit of all 450 KIDS V4 private quiz previews.

Only reads original/composed MP3 bytes. Never synthesizes speech, grants human
approval, writes public manifests, or deploys. The optional report is read-only
CI output and remains an internal workflow artifact.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
YOUNG = ROOT / "kids/data/quiz-v4-first150-composed-preview.json"
OLDER = ROOT / "kids/data/quiz-v4-age7to10-composed-preview.json"
STATUS_YOUNG = ROOT / "kids/data/quiz-v4-first150-audio-status.json"
STATUS_OLDER = ROOT / "kids/data/quiz-v4-age7to10-offline-coverage.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
PUBLIC = ROOT / "kids/data/quiz-audio.json"
REPORT = ROOT / "kids/review-only/quiz-v4-selected450-crossage-integrity.json"
BANDS = ("4-6", "7-8", "9-10")
PARTS = ("question", "correct", "retry", "explanation")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_hash(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def text_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def check(condition, why):
    if not condition:
        raise RuntimeError(why)


def mp3_path(item):
    url = item.get("url")
    check(isinstance(url, str) and
          url.startswith("/kids/assets/kids-quiz-audio/") and
          ".." not in url and "?" not in url and "#" not in url and
          re.fullmatch(r"/kids/assets/kids-quiz-audio/[A-Za-z0-9/_-]+\.mp3", url),
          "Unsafe or non-MP3 preview source")
    path = (ROOT / url.lstrip("/")).resolve()
    check(path.is_relative_to((ROOT / "kids/assets/kids-quiz-audio").resolve()),
          "Audio path escaped its expected asset root")
    check(path.is_file() and path.stat().st_size > 1500,
          "A referenced original MP3 is missing or empty")
    return path


def verify_mp3(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_name,codec_type", "-of", "json", str(path)],
        text=True, capture_output=True,
    )
    check(result.returncode == 0, "ffprobe failed for " + str(path))
    raw = json.loads(result.stdout)
    streams = [s for s in raw.get("streams", []) if s.get("codec_type") == "audio"]
    check(len(streams) == 1 and streams[0].get("codec_name") == "mp3",
          "Original-only review requires one MP3 audio track")
    dur = float(raw.get("format", {}).get("duration") or 0)
    check(0.4 < dur < 180, "Original audio duration is unreasonable")
    return round(dur, 4)


def main():
    plan, young, older, sy, so, flag = map(
        load, (PLAN, YOUNG, OLDER, STATUS_YOUNG, STATUS_OLDER, FLAG)
    )
    check(flag.get("enabled") is False, "Release flag unexpectedly enabled")
    check(plan.get("voiceId") == VOICE and plan.get("modelId") == MODEL,
          "Original curated owner voice or model has changed")
    check(len(plan.get("recipes") or []) == 450, "450 selected questions missing")
    check(len({r["questionId"] for r in plan["recipes"]}) == 450,
          "Duplicate curated question IDs")
    for band in BANDS:
        check(sum(q["ageBand"] == band for q in plan["recipes"]) == 150,
              "Expected exactly 150 curated questions for " + band)

    for p in (young, older):
        check(p.get("published") is False and p.get("humanListeningApproved") is False,
              "Private V4 audio preview was wrongly flagged published or human-approved")
        check(p.get("voiceId") == VOICE and p.get("modelId") == MODEL,
              "Voice/model differs from selected original")
    check(older.get("ageBands") == ["7-8", "9-10"], "Cross-age preview scope changed")

    entries = {"4-6": young["entries"], "7-8": older["entries"],
               "9-10": older["entries"]}
    status_by_id = {q["questionId"]: q for q in sy["questions"]}
    older_questions = older["questions"]
    check(len(status_by_id) == 150 and len(older_questions) == 300,
          "Original-only question coverage lists do not include all 450 questions")

    verified = {}  # Cache per URL + verified SHA; prevent duplicate probes.
    seen_text = {}  # Same text must never map to different audio bytes.
    counts = {b: {"questions": 150, "completeFourPartQuestions": 0,
                  "availableFieldCounts": dict.fromkeys(PARTS, 0),
                  "missingFieldCounts": dict.fromkeys(PARTS, 0)} for b in BANDS}
    cross_age_slots = 0
    for p in (young, older):
        for text, item in p["entries"].items():
            check(isinstance(text, str) and bool(text), "Empty utterance in preview")
            check(item.get("voiceId") == VOICE and item.get("modelId") == MODEL,
                  "Wrong speech voice/model")
            check(item.get("audioListeningApproved") is False and
                  item.get("qaApproval") == "pending-human-auditory-review" and
                  item.get("approvedForPlayback") is not True,
                  "Machine QA may never be represented as human hearing approval")
            digest = item.get("sha256")
            check(isinstance(digest, str) and
                  re.fullmatch(r"[0-9a-f]{64}", digest) is not None,
                  "One preview MP3 is missing its SHA256")
            prior = seen_text.get(text)
            check(prior is None or prior == digest,
                  "Same spoken text points to conflicting MP3 originals across ages")
            seen_text[text] = digest
            path = mp3_path(item)
            previous = verified.get(item["url"])
            if previous:
                check(previous["sha256"] == digest, "Same URL has two claimed MP3 hashes")
            else:
                check(file_hash(path) == digest, "Actual original/composite MP3 SHA mismatch")
                verified[item["url"]] = {
                    "sha256": digest, "duration": verify_mp3(path),
                    "bytes": path.stat().st_size,
                }

    for q in plan["recipes"]:
        band, question_id = q["ageBand"], q["questionId"]
        completed = True
        for kind in PARTS:
            phrase = q[kind]["text"]
            clip = entries[band].get(phrase)
            available = clip is not None
            counts[band]["availableFieldCounts" if available else "missingFieldCounts"][kind] += 1
            cross_age_slots += int(available)
            completed &= available
            if band == "4-6":
                status = status_by_id[question_id]
                check((kind in status["availableAudioParts"]) == available,
                      "4–6 audio availability disagrees with the per-question status")
                check(bool(status["allFourPartsAvailable"]) ==
                      all(k in status["availableAudioParts"] for k in PARTS),
                      "4–6 status wrongly says a question is complete")
            else:
                status = older_questions[question_id]
                check(status["ageBand"] == band, "Older question assigned to wrong age")
                item = status["parts"][kind]
                check(item["available"] is available,
                      "Older-age audio availability disagrees with individual question")
                if available:
                    check(item["textSha256"] == text_hash(phrase) and
                          item["mp3Sha256"] == clip["sha256"] and
                          item["url"] == clip["url"],
                          "Older-age audio key/hash/path mismatch")
        counts[band]["completeFourPartQuestions"] += int(completed)
        if band != "4-6":
            check(bool(older_questions[question_id]["allFourPartsAvailable"]) == completed,
                  "Older-age question completion status mismatch")

    check(counts["4-6"]["completeFourPartQuestions"] ==
          sy["completeFourPartQuestions"], "Young complete question count mismatch")
    check(counts["4-6"]["availableFieldCounts"] ==
          sy["availableFieldCounts"], "Young field counts mismatch")
    for band in ("7-8", "9-10"):
        check(counts[band] == so["byAge"][band],
              "Older-age count/field totals disagree with saved private review")
    check(cross_age_slots == sum(sum(b["availableFieldCounts"].values())
                                 for b in counts.values()),
          "Total assigned existing audio fields mismatch")
    check(not sy.get("readyForLive") and not so.get("readyForLive"),
          "A technical audio report must NEVER authorize live")

    report = {
        "schemaVersion": 1, "scope": "KIDS_V4_SELECTED_450_CROSS_AGE_ORIGINAL_AUDIO_AUDIT",
        "selectedQuestions": 450, "audioFieldAssignments": 1800,
        "existingAudioFieldAssignments": cross_age_slots,
        "missingAudioFieldAssignments": 1800 - cross_age_slots,
        "humanApprovedAudioFieldAssignments": 0,
        "uniqueSpokenTextsWithMP3": len(seen_text),
        "uniqueReferencedMP3URLsSHAAndCodecVerified": len(verified),
        "uniqueOriginalOnlyPreviewEntries": len(young["entries"]) + len(older["entries"]),
        "ageBreakdown": counts,
        "all450FourPartComplete": all(v["completeFourPartQuestions"] == 150
                                    for v in counts.values()),
        "readyForHumanHearingReview": True,
        "readyForLive": False, "livePublished": False,
        "testAudioCreated": False, "newVoiceGenerationsCreated": 0,
        "elevenLabsCreditsSpent": 0,
        "reviewOnly": True,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS_KIDS_V4_SELECTED450_CROSSAGE_REAL_MP3_AUDIT " +
          json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
