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
# Guard real browser feedback and its text layout in the three KIDS entrypoints.
htmls=[(ROOT/p).read_text(encoding="utf-8") for p in
       ("kids/index.html","kids/start.html","kids/shell.html")]
if len(set(htmls))!=1:
    raise SystemExit("KIDS: Islamic quiz feedback differs between index/start/shell")
html=htmls[0]
required=(
    "quizAcademyPraiseText(q)",
    "quizAcademyRetryText(q)",
    'quizSpeak(quizV4Text(q,"correctAudioText",q.success)',
    'quizSpeak(quizV4Text(q,"retryAudioText",q.retry)',
    "overflow-wrap:break-word",
    "font-size:clamp(14px,2.5vw,17px)",
)
for pattern in required:
    if pattern not in html:
        raise SystemExit("KIDS: missing accessible Islamic feedback integration: "+pattern)
feedback_scope=html[html.index("function chooseQuizAnswer("):html.index("function renderQuizFinish(")]
if 'feedback.textContent=""' in feedback_scope:
    raise SystemExit("KIDS: retry encouragement may disappear before a child finishes reading")
worker=(ROOT/"kids/sw.js").read_text(encoding="utf-8")
if "quiz-v4-bridge.js?v=20261013-academy1" not in worker or "quiz-v4-bridge.js?v=20261013-academy1" not in html:
    raise SystemExit("KIDS: Islamic voice bridge cache revision mismatch")
print("PASS: 900 KIDS questions, 15 Islamic blessings + 15 gentle retries; all 3 apps consistent, readable, no paid credits.")
