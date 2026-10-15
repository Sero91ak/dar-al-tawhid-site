#!/usr/bin/env python3
"""Package the existing original-only age 7–10 V4 audio as a PRIVATE offline hearing ZIP.

Imports the already tested local hearing UI layout. No voice synthesis,
no calls to ElevenLabs, no public output and no automatic human approval.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED

from build_quiz_v4_first150_hearing_review import PAGE

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
PREVIEW = ROOT / "kids/data/quiz-v4-age7to10-composed-preview.json"
REPORT = ROOT / "kids/data/quiz-v4-age7to10-offline-coverage.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
HTML = ROOT / "kids/review-only/quiz-v4-age7to10-hearing-review.html"
ZIP = ROOT / "kids/review-only/quiz-v4-age7to10-hearing-bundle.zip"
PARTS = ("question", "correct", "retry", "explanation")


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as src:
        for block in iter(lambda: src.read(1024*1024), b""):
            h.update(block)
    return h.hexdigest()


def replace_exact(text, before, after):
    if text.count(before) != 1:
        raise RuntimeError("Existing hearing UI changed unexpectedly: " + before[:70])
    return text.replace(before, after)


def main():
    if load(FLAG).get("enabled") is not False:
        raise RuntimeError("No private KIDS hearing package may be built while live release is ON")
    plan, preview, summary = load(PLAN), load(PREVIEW), load(REPORT)
    if preview.get("published") is not False or preview.get("humanListeningApproved") is not False:
        raise RuntimeError("Age 7–10 listening preview is not explicitly review-only")
    if preview.get("voiceId") != "DkU7j9uO4ZEtLD2iRZSH" or preview.get("modelId") != "eleven_v4":
        raise RuntimeError("Wrong original V4 voice/model")
    if summary.get("livePublished") is not False or summary.get("elevenLabsCreditsSpent") != 0:
        raise RuntimeError("Unexpected older-age production state")
    originals = preview.get("entries") or {}
    questions = preview.get("questions") or {}
    selected = [x for x in plan.get("recipes", []) if x["ageBand"] in ("7-8", "9-10")]
    if len(selected) != 300 or len({x["questionId"] for x in selected}) != 300:
        raise RuntimeError("Expected exactly 300 unique selected older-age quiz questions")
    if len(questions) != 300:
        raise RuntimeError("Preview coverage is incomplete")

    used = {}
    records = []
    full = 0
    for q in selected:
        question_status = questions.get(q["questionId"])
        if not question_status or question_status.get("ageBand") != q["ageBand"]:
            raise RuntimeError("Stale or mismatched age-band question preview")
        tracks = []
        has_four = True
        for name in PARTS:
            phrase = q[name]["text"]
            slot = question_status["parts"][name]
            present = slot["available"] is True
            has_four = has_four and present
            track = {"part": name, "text": phrase,
                     "textSha": hashlib.sha256(phrase.encode("utf-8")).hexdigest(),
                     "src": None, "audioSha": None}
            if present:
                item = originals.get(phrase)
                if item is None or item.get("audioListeningApproved") is not False:
                    raise RuntimeError("Available voice missing or wrongly approved")
                if item.get("approvedForPlayback") is not False:
                    raise RuntimeError("Public playback approval was incorrectly asserted")
                url = item.get("url") or ""
                if (not url.startswith("/kids/assets/kids-quiz-audio/")
                        or ".." in url or "?" in url or "#" in url):
                    raise RuntimeError("Unsafe original MP3 URL")
                mp3 = (ROOT / url.lstrip("/")).resolve()
                if not mp3.is_relative_to((ROOT / "kids/assets/kids-quiz-audio").resolve()):
                    raise RuntimeError("Original MP3 is outside the review area")
                if not mp3.is_file() or mp3.stat().st_size < 1500:
                    raise RuntimeError("Previously verified original MP3 does not exist")
                if digest(mp3) != item.get("sha256") or slot.get("mp3Sha256") != item["sha256"]:
                    raise RuntimeError("MP3 content differs from the known original SHA")
                if slot["textSha256"] != track["textSha"]:
                    raise RuntimeError("Question audio text SHA mismatch")
                used[mp3] = item["sha256"]
                track.update({"src": os.path.relpath(mp3, HTML.parent).replace(os.sep, "/"),
                              "audioSha": item["sha256"]})
            tracks.append(track)
        full += bool(has_four)
        records.append({"id": q["questionId"], "band": q["ageBand"],
                        "complete": bool(has_four), "parts": tracks})
    if full != sum(summary["byAge"][band]["completeFourPartQuestions"] for band in ("7-8", "9-10")):
        raise RuntimeError("Original-only completed coverage does not match the report")
    if len(used) != summary["uniqueFullAudioClipsAvailable"]:
        raise RuntimeError("Review ZIP source file count disagrees with unique audio entries")

    payload = {"title": "TAWḤĪD KIDS · V4 Hörprüfung · 7–10 Jahre",
               "questionCount": 300, "fullQuestions": full,
               "uniqueAudioFiles": len(used), "parts": records}
    # Embedded JSON must never allow HTML/script tag injection.
    embedded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    embedded = embedded.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    page = PAGE
    page = replace_exact(page, "TAWḤĪD KIDS · Interne V4-Hörprüfung",
                         "TAWḤĪD KIDS · Interne V4-Hörprüfung · 7–10 Jahre")
    page = replace_exact(page, "<h1>TAWḤĪD KIDS · V4-Hörprüfung</h1>",
                         "<h1>TAWḤĪD KIDS · V4-Hörprüfung 7–10 Jahre</h1>")
    page = replace_exact(page, "150 Fragen (4–6 Jahre)",
                         "300 Fragen (7–8 und 9–10 Jahre)")
    page = replace_exact(page, "Alle 150", "Alle 300")
    page = replace_exact(page, 'id.textContent="Frage "+q.id.split("-").pop();',
                         'id.textContent="Frage "+q.id.split("-").pop()+" · "+q.band+" Jahre";')
    page = replace_exact(page, 'document.getElementById("search").addEventListener("input",render);',
                         'document.getElementById("search").addEventListener("input",render);')
    page = replace_exact(page, 'TAWHID_KIDS_FIRST150_AGE4_6_HUMAN_AUDIO_LISTENING',
                         'TAWHID_KIDS_AGE7_TO_10_HUMAN_AUDIO_LISTENING')
    page = replace_exact(page, 'quiz-v4-first150-human-auditory-approvals.json',
                         'quiz-v4-age7to10-human-auditory-approvals.json')
    page = replace_exact(page, '__EMBEDDED_REVIEW_DATA__', embedded)
    HTML.parent.mkdir(parents=True, exist_ok=True)
    HTML.write_text(page, encoding="utf-8")
    with ZipFile(ZIP, "w", compression=ZIP_STORED) as out:
        out.write(HTML, arcname=str(HTML.relative_to(ROOT)))
        for path in sorted(used):
            out.write(path, arcname=str(path.relative_to(ROOT)))
    print("PASS_KIDS_V4_AGE7TO10_PRIVATE_HEARING_ZIP " + json.dumps({
        "questions": 300, "completeFourPartQuestions": full,
        "uniqueOriginalOnlyClips": len(used),
        "archiveBytes": ZIP.stat().st_size, "humanApprovalsGenerated": 0,
        "newElevenLabsCreditsSpent": 0, "published": False,
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
