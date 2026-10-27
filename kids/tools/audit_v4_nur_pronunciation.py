#!/usr/bin/env python3
"""Read-only German 'nur' / Arabic Nūr collision audit for KIDS Quiz V4.

No ElevenLabs requests, audio changes, release flags or human-approval writes.
Run: python3 kids/tools/audit_v4_nur_pronunciation.py
Use --strict to block a future generation/release until P1 clips are reviewed.
"""
from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "kids/data/quiz-v4-full-rebuild-public.json"
DICT = ROOT / "data/pronunciation/DAR_AL_TAWHID_ElevenLabs_ARABIC_MASTER_29122.pls"
QA_QUEUE = ROOT / "kids/review-only/voice-nur-qa-20261027.json"
CAP = re.compile(r"(?<!\w)Nur(?!\w)")
LOW = re.compile(r"(?<!\w)nur(?!\w)")
PARTS = ("question", "correct", "retry", "explanation")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true",
                        help="Exit unsuccessfully while P1 capital-Nur cases lack human approval")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    questions = manifest.get("questions", {})
    if len(questions) != 450 or sum(len(q.get("clips", {})) for q in questions.values()) != 1800:
        raise SystemExit("KIDS V4: expected 450 questions / 1800 clips")

    ns = "{http://www.w3.org/2005/01/pronunciation-lexicon}"
    root = ET.parse(DICT).getroot()
    lexemes = {}
    for lexeme in root.iter(ns + "lexeme"):
        g = lexeme.findtext(ns + "grapheme")
        if g:
            lexemes.setdefault(g, []).append(lexeme.findtext(ns + "alias"))
    if "النور" not in lexemes.get("Nur", []):
        raise SystemExit("PLS dictionary has changed: recheck collision diagnosis")
    if "nur" in lexemes:
        raise SystemExit("Unexpected new lowercase 'nur' rule; manually review")

    slots = {}
    for question_id, question in questions.items():
        if set(question.get("clips", {})) != set(PARTS):
            raise SystemExit(f"{question_id}: incomplete clip mapping")
        for part in PARTS:
            clip = question["clips"][part]
            spoken = str(clip.get("text") or "")
            if CAP.search(spoken) or LOW.search(spoken):
                slots[(question_id, part)] = {
                    "capital": bool(CAP.search(spoken)),
                    "lower": bool(LOW.search(spoken)),
                    "url": clip.get("url"),
                    "sha256": clip.get("sha256"),
                }

    old = json.loads(QA_QUEUE.read_text(encoding="utf-8"))
    queued = {(r["questionId"], r["part"]): r for r in old["entries"]}
    if slots.keys() != queued.keys():
        raise SystemExit("KIDS V4: QA queue and public manifest keys differ; regenerate queue")
    for key, slot in slots.items():
        q = queued[key]
        if slot["url"] != q["url"] or slot["sha256"] != q["sha256"]:
            raise SystemExit(f"{key}: published MP3 changed; refresh the human QA queue")

    p1 = sum(x["capital"] for x in slots.values())
    p2_only = sum(not x["capital"] for x in slots.values())
    counted = {"total": len(slots), "capitalNur": p1, "lowercaseOnly": p2_only,
               "lexicon": "Nur -> النور", "speechHearingVerified": False}
    print(json.dumps(counted, ensure_ascii=False, indent=2))
    if args.strict and any(
        row["containsCapitalNur"] and row["status"] != "approved-by-human"
        for row in old["entries"]
    ):
        raise SystemExit("BLOCKED: Capital-Nur cases require targeted human hearing QA")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
