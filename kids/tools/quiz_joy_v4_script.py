#!/usr/bin/env python3
"""Prepare kinderfreundliche Serhat V4 Quiz-Sprechtexte, ohne API-Aufrufe oder Credits.

Dieses Werkzeug erzeugt NUR einen versionierten Freigabeplan. Kein veröffentlichtes
Audio-Manifest und keine App-Fragetexte werden geändert.
python3 kids/tools/quiz_joy_v4_script.py --pilot
python3 kids/tools/quiz_joy_v4_script.py --all --output /tmp/quiz-joy-v4-plan.json
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QUIZ = ROOT / "kids" / "data" / "quiz-kids.json"
REVISION = "quiz-joy-serhat-v4-20261013"
AGE_BANDS = ("4-6", "7-8", "9-10")

YES_NO_GUIDANCE = (
    "Was meinst du? Wenn du glaubst, dass es stimmt, wähle Ja. Wenn nicht, wähle Nein.",
    "Überlege kurz. Ist das richtig? Dann tippe auf Ja. Wenn nicht, auf Nein.",
    "Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein.",
    "Hör gut zu. Was denkst du? Wähle Ja für richtig oder Nein für nicht richtig.",
    "Jetzt bist du dran. Wenn es stimmt, wähle Ja. Wenn es nicht stimmt, Nein.",
)
YOUNG_OPEN = (
    "Komm, wir probieren eine Wissensfrage.",
    "Hör einmal aufmerksam zu.",
    "Schau, was du schon alles weißt.",
    "Du darfst mitdenken.",
)
OLDER_OPEN = (
    "Hör dir die Frage und die Antworten in Ruhe an.",
    "Überlege kurz, bevor du dich entscheidest.",
    "Mal sehen, was du zu diesem Thema weißt.",
    "Nimm dir Zeit für deine Antwort.",
)
SUCCESS = {
    "4-6": (
        "Sehr schön! Du hast gut aufgepasst.",
        "Prima! Das hast du richtig erkannt.",
        "Gut gemacht! Du lernst immer mehr.",
        "Ja, das ist richtig. Schön überlegt!",
        "Sehr gut! Du hast die passende Antwort gewählt.",
    ),
    "7-8": (
        "Das stimmt. Gut nachgedacht!",
        "Richtig erkannt! Sehr gut.",
        "Prima! Du hast aufmerksam zugehört.",
        "Gut gemacht! Genau diese Antwort passt.",
        "Sehr schön! Du hast die Frage verstanden.",
    ),
    "9-10": (
        "Das ist richtig. Gut überlegt.",
        "Sehr gut. Diese Antwort passt.",
        "Richtig erkannt! Mach weiter so.",
        "Gut durchdacht. Das stimmt.",
        "Sehr schön. Du hast die passende Antwort gefunden.",
    ),
}
RETRY = {
    "4-6": (
        "Das war noch nicht richtig. Versuch es noch einmal in Ruhe.",
        "Macht nichts, du darfst noch einmal nachdenken.",
        "Schau dir die Antworten noch einmal an. Probiere es wieder.",
        "Noch nicht ganz. Höre aufmerksam zu und versuche es erneut.",
        "Nimm dir Zeit. Du kannst noch einmal wählen.",
    ),
    "7-8": (
        "Noch nicht richtig. Schau dir die Antworten noch einmal an.",
        "Überlege noch einmal. Du darfst es erneut versuchen.",
        "Diese Antwort passt noch nicht. Nimm dir Zeit.",
        "Versuche es noch einmal. Hör gut auf die Frage.",
        "Denk noch einmal in Ruhe nach.",
    ),
    "9-10": (
        "Diese Antwort passt noch nicht. Überlege noch einmal.",
        "Vergleiche die Antworten erneut und versuche es noch einmal.",
        "Das war noch nicht richtig. Denk in Ruhe darüber nach.",
        "Lass dir einen Moment Zeit und wähle erneut.",
        "Schau noch einmal genau auf die Fragestellung.",
    ),
}

def normal(value: object) -> str:
    return " ".join(str(value or "").split()).strip()

def answer_line(label: str, index: int) -> str:
    label = normal(label)
    return f"Antwort {index}: {label}" + ("" if label.endswith((".", "!", "?", "؟")) else ".")

def is_yes_no(question: dict) -> bool:
    labels = [normal(a.get("label")).casefold() for a in question.get("answers", [])]
    return len(labels) == 2 and set(labels) == {"ja", "nein"}

def prepare(question: dict) -> dict:
    band = question["ageBand"]
    if band not in AGE_BANDS:
        raise ValueError("Unbekanntes Alter")
    n = int(question["number"])
    title = normal(question["question"])
    explanation = normal(question["explanation"])
    answers = question["answers"]
    if not title or not explanation or len(answers) < 2 or sum(bool(a.get("correct")) for a in answers) != 1:
        raise ValueError(f"{question['id']}: unvollständig oder ohne eindeutige Antwort")
    if band == "4-6" and is_yes_no(question):
        question_script = f"{YOUNG_OPEN[n % len(YOUNG_OPEN)]} {title} {YES_NO_GUIDANCE[n % len(YES_NO_GUIDANCE)]}"
    elif band == "4-6":
        options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
        question_script = f"{YOUNG_OPEN[n % len(YOUNG_OPEN)]} {title} {options} Welche Antwort passt deiner Meinung nach?"
    elif band == "7-8":
        options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
        question_script = f"{OLDER_OPEN[n % len(OLDER_OPEN)]} {title} {options} Wähle die Antwort, die du für richtig hältst."
    else:
        options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
        question_script = f"{title} {options} Überlege und wähle die beste Antwort."

    return {
        "questionId": question["id"],
        "number": n,
        "ageBand": band,
        "category": question["category"],
        "modelId": "eleven_v4",
        "voiceProfileId": "serhat-owner-voice-2026",
        "revision": REVISION,
        "questionAudioText": normal(question_script),
        "correctAudioText": SUCCESS[band][n % len(SUCCESS[band])],
        "retryAudioText": RETRY[band][n % len(RETRY[band])],
        "explanationAudioText": normal("Das merken wir uns: " + explanation),
        "originalQuestion": title,
        "originalExplanation": explanation,
        "source": question["source"],
        "pronunciationQA": "pending-human-approval",
        "audioQA": "not-generated",
        "published": False,
    }

def segment_plan(question: dict) -> dict[str, list[str]]:
    """V4-only, no-credit audio composition plan; keys equal prepare() exactly.

    Spoken parts are full phrases, never sliced inside a word, Arabic name,
    Qurʾān quotation or answer. The playback key stays the full approved text.
    The app receives a locally composed .m4a, not multiple network players.
    """
    full = prepare(question)
    band = question["ageBand"]
    n = int(question["number"])
    title = normal(question["question"])
    answers = question["answers"]
    if band == "4-6":
        opening = YOUNG_OPEN[n % len(YOUNG_OPEN)]
        if is_yes_no(question):
            core = title
            closing = YES_NO_GUIDANCE[n % len(YES_NO_GUIDANCE)]
        else:
            options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
            core = f"{title} {options}"
            closing = "Welche Antwort passt deiner Meinung nach?"
        question_parts = [opening, core, closing]
    elif band == "7-8":
        opening = OLDER_OPEN[n % len(OLDER_OPEN)]
        options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
        question_parts = [opening, f"{title} {options}", "Wähle die Antwort, die du für richtig hältst."]
    else:
        options = " ".join(answer_line(a["label"], i) for i, a in enumerate(answers, 1))
        question_parts = [f"{title} {options}", "Überlege und wähle die beste Antwort."]
    explanation_parts = ["Das merken wir uns:", normal(question["explanation"])]
    plan = {
        "questionAudioText": list(map(normal, question_parts)),
        "correctAudioText": [full["correctAudioText"]],
        "retryAudioText": [full["retryAudioText"]],
        "explanationAudioText": list(map(normal, explanation_parts)),
    }
    for key, parts in plan.items():
        if not parts or any(not part for part in parts):
            raise ValueError(f"{question['id']}: empty audio fragment")
        if normal(" ".join(parts)) != full[key]:
            raise ValueError(f"{question['id']}: V4 audio fragment contract mismatch in {key}")
    return plan


def select_pilot(questions: list[dict]) -> list[dict]:
    chosen = []
    for band in AGE_BANDS:
        selected, cats = [], set()
        for q in questions:
            if q["ageBand"] != band:
                continue
            if q["category"] in cats and len(cats) < 4:
                continue
            selected.append(q)
            cats.add(q["category"])
            if len(selected) == 4:
                break
        if len(selected) != 4:
            raise ValueError(f"Pilot-Alter {band} hat weniger als vier geeignete Fragen")
        chosen.extend(selected)
    return chosen

def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--pilot", action="store_true")
    mode.add_argument("--all", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = json.loads(QUIZ.read_text(encoding="utf-8"))
    qs = data["items"]
    if len(qs) != 900 or {b: sum(q["ageBand"] == b for q in qs) for b in AGE_BANDS} != dict.fromkeys(AGE_BANDS, 300):
        raise SystemExit("KIDS V4 SCRIPT GUARD: erwarteter 900er Katalog (300 je Altersgruppe) fehlt")
    if len({q["id"] for q in qs}) != 900:
        raise SystemExit("KIDS V4 SCRIPT GUARD: doppelte Frage-ID")
    source = select_pilot(qs) if args.pilot else qs
    plan = {
        "revision": REVISION,
        "purpose": "REVIEW_ONLY_NO_TTS_SPEND",
        "sourceFile": "kids/data/quiz-kids.json",
        "totalCatalog": len(qs),
        "items": [prepare(q) for q in source],
        "approvalRequired": "human-check-arabic-pronunciation-and-natural-flow",
        "releaseCondition": "replace exact manifest keys only after matching V4 recordings were approved and delivered",
    }
    output = json.dumps(plan, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(output, encoding="utf-8")
        print(f"{len(plan['items'])} V4 Sprechtext-Sets (ohne Audio) -> {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
