#!/usr/bin/env python3
"""Deterministic preflight for the 900 approved Kids Quiz German spoken texts.

Checks sentence structure and high-confidence grammar errors without paraphrasing
religious content or spending TTS credits. It cannot replace listening review.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QUIZ = ROOT / "kids/data/quiz-kids.json"
AGE_BANDS = {"4-6", "7-8", "9-10"}
TEXT_FIELDS = ("question", "success", "retry", "explanation")
GRAMMAR_ERRORS = (
    (re.compile(r"\bWelche Nutzen\b", re.I), "Kasus: 'Welchen Nutzen'"),
    (re.compile(r"\bWas warnt\b", re.I), "Frageanfang: 'Wovor warnt'"),
    (re.compile(r"\bWas sollen wir\b.*\bnicht folgen\b", re.I), "Kasus: 'Welchen Schritten ... folgen'"),
    (re.compile(r"\bnichts bringe\b", re.I), "unnatuerlicher Konjunktiv in Kindersprache"),
)
AWKWARD_START = re.compile(r"^(?:und|aber|weil|dass|oder)\b", re.I)
REPEATED_PUNCTUATION = re.compile(r"[!?]{2,}|\.{3,}|[!?][!?]")
SPACE_BEFORE_PUNCTUATION = re.compile(r"\s+[,.!?]")
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b-\x1f]")


def norm(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def prompt(question: dict) -> str:
    """Keep in lockstep with quiz_prompt() in voice workflow and kids/index.html."""
    q = norm(question.get("question"))
    labels = [norm(a.get("label")) for a in question.get("answers", [])]
    labels = [x for x in labels if x]
    low = [x.casefold() for x in labels]
    if question.get("ageBand") == "4-6" and len(low) == 2 and "ja" in low and "nein" in low:
        return norm(q + " Ja oder Nein?")
    choices = " ".join(f"Antwort {idx}: {label if label.endswith(('.', '!', '?', '؟')) else label + '.'}" for idx, label in enumerate(labels, 1))
    return norm(q + " " + choices)


def test_spoken_punctuation() -> None:
    """Regression: mirror production quiz_prompt without duplicate punctuation."""
    q = {"ageBand": "7-8", "question": "Was stimmt?", "answers": [
        {"label": "Ein ganzer Satz."}, {"label": "Eine Frage?"}, {"label": "Ein Wort"}
    ]}
    expected = "Was stimmt? Antwort 1: Ein ganzer Satz. Antwort 2: Eine Frage? Antwort 3: Ein Wort."
    actual = prompt(q)
    if actual != expected:
        raise SystemExit(f"KIDS GERMAN QA: speech punctuation drift: {actual!r}")


def audit() -> list[str]:
    data = json.loads(QUIZ.read_text(encoding="utf-8"))
    items = data.get("items", [])
    errors: list[str] = []
    if len(items) != 900:
        errors.append(f"Erwartet: 900 Quizfragen; gefunden: {len(items)}.")
    numbers = [item.get("number") for item in items]
    if set(numbers) != set(range(1, 901)) or len(numbers) != 900:
        errors.append("Quiznummern muessen exakt 1 bis 900 ohne Duplikate enthalten.")
    age_counts = Counter(item.get("ageBand") for item in items)
    for band in sorted(AGE_BANDS):
        if age_counts[band] != 300:
            errors.append(f"Altersgruppe {band}: {age_counts[band]} statt 300.")

    seen_prompts: set[str] = set()
    for item in items:
        number = item.get("number", "?")
        prefix = f"Quiz {number}"
        if item.get("status") != "published" or item.get("reviewStatus") != "approved" or item.get("verification") != "approved":
            errors.append(f"{prefix}: Inhalt nicht vollstaendig freigegeben.")
        answers = item.get("answers") or []
        if len(answers) not in (2, 3, 4):
            errors.append(f"{prefix}: ungueltige Anzahl Antwortmoeglichkeiten.")
        if sum(a.get("correct") is True for a in answers) != 1:
            errors.append(f"{prefix}: genau eine korrekte Antwort erwartet.")
        if any(not norm(a.get("label")) for a in answers):
            errors.append(f"{prefix}: leere Antwortmoeglichkeit.")
        for field in TEXT_FIELDS:
            value = norm(item.get(field))
            if not value:
                errors.append(f"{prefix}: {field} fehlt.")
                continue
            if CONTROL_CHARS.search(value) or REPEATED_PUNCTUATION.search(value) or SPACE_BEFORE_PUNCTUATION.search(value):
                errors.append(f"{prefix}: {field} hat unnatuerliche Zeichensetzung.")
            if field == "question":
                if not value.endswith("?"):
                    errors.append(f"{prefix}: Frage muss mit Fragezeichen enden.")
                if not value[0].isupper():
                    errors.append(f"{prefix}: Frage muss mit einem Grossbuchstaben beginnen.")
            if field != "question" and not value.endswith((".", "!", "?")):
                errors.append(f"{prefix}: {field} muss einen sauberen Satzschluss haben.")
            if AWKWARD_START.search(value):
                errors.append(f"{prefix}: {field} beginnt mit isolierter Konjunktion.")
            for expression, description in GRAMMAR_ERRORS:
                if expression.search(value):
                    errors.append(f"{prefix}: {field}: {description}.")
        for ans in answers:
            label = norm(ans.get("label"))
            if not label:
                continue
            for expression, description in GRAMMAR_ERRORS:
                if expression.search(label):
                    errors.append(f"{prefix}: Antwort: {description}.")
        spoken = prompt(item)
        if spoken in seen_prompts:
            errors.append(f"{prefix}: doppelte Sprechfrage.")
        seen_prompts.add(spoken)
        if re.search(r"\?\s*\?", spoken):
            errors.append(f"{prefix}: doppelter Fragebeginn im Sprechtext.")
    if errors:
        return errors
    print(f"KIDS GERMAN QA OK: {len(items)} Fragen; 900 eindeutige Sprechfragen; 300 je Altersgruppe.")
    print("Geprueft: Satzanfang, Fragezeichen, Satzschluss, Optionen, Grammatikmuster, Inhaltsfreigaben.")
    print("Hinweis: Aussprache, Betonung und Tonqualitaet brauchen separate Audiohoerpruefung.")
    return []


if __name__ == "__main__":
    test_spoken_punctuation()
    findings = audit()
    for finding in findings[:80]:
        print("KIDS GERMAN QA FAIL:", finding)
    if findings:
        raise SystemExit(f"{len(findings)} Fehler vor der Audioerzeugung gefunden.")
