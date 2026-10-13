#!/usr/bin/env python3
"""No-credit Islamic Academy feedback QA for every KIDS quiz age band."""
from __future__ import annotations
import json
from pathlib import Path
from quiz_joy_v4_script import prepare, SUCCESS, RETRY

ROOT=Path(__file__).resolve().parents[2]
questions=json.loads((ROOT/"kids/data/quiz-kids.json").read_text(encoding="utf-8"))["items"]
if len(questions)!=900: raise SystemExit("KIDS: expected 900 questions")
for age in ("4-6","7-8","9-10"):
    children=[q for q in questions if q["ageBand"]==age]
    if len(children)!=300: raise SystemExit(f"KIDS: wrong age-band size {age}")
    if len(set(SUCCESS[age]))!=5 or len(set(RETRY[age]))!=5:
        raise SystemExit(f"KIDS: praise/retry should have exactly 5 varied takes for {age}")
    if not any("Mā schāʾ Allāh" in t for t in SUCCESS[age]):
        raise SystemExit(f"KIDS: missing Mā schāʾ Allāh for {age}")
    if not any("Allāhumma bārik" in t for t in SUCCESS[age]):
        raise SystemExit(f"KIDS: missing Allāhumma bārik for {age}")
    if not any("Al-ḥamdu lillāh" in t for t in SUCCESS[age]):
        raise SystemExit(f"KIDS: missing Al-ḥamdu lillāh for {age}")
    for q in children:
        voice=prepare(q)
        if voice["correctAudioText"] not in SUCCESS[age] or voice["retryAudioText"] not in RETRY[age]:
            raise SystemExit(f"KIDS: praise/retry age mismatch: {q['id']}")
        for k in ("correctAudioText","retryAudioText"):
            s=voice[k]
            if not (16<=len(s)<=200):
                raise SystemExit(f"KIDS: feedback text length unsuitable for {age}: {q['id']}")
            if not s.endswith(("!",".")):
                raise SystemExit(f"KIDS: feedback punctuation missing: {q['id']}")
print("PASS: 900 KIDS questions (3 age bands) use 15 varied Islamic blessings and 15 gentle retries, zero paid credits.")
