#!/usr/bin/env python3
"""Kids Quiz speech source/manifest QA. This never spends TTS credits."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "kids/data/quiz-kids.json"


def norm(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def answer_for_speech(label: object) -> str:
    text = norm(label)
    return text if not text or text.endswith((".", "!", "?", "؟")) else text + "."


def quiz_prompt(question: dict) -> str:
    title = norm(question.get("question"))
    labels = [norm(a.get("label")) for a in (question.get("answers") or [])]
    labels = [label for label in labels if label]
    lower = [label.casefold() for label in labels]
    if question.get("ageBand") == "4-6" and len(labels) == 2 and "ja" in lower and "nein" in lower:
        return norm(title + " Ja oder Nein?")
    choices = " ".join(
        f"Antwort {i}: {answer_for_speech(label)}"
        for i, label in enumerate(labels, 1)
    )
    return norm(title + " " + choices)


def required_texts(question: dict) -> list[str]:
    return [
        text for text in (
            quiz_prompt(question),
            norm(question.get("success")),
            norm(question.get("retry")),
            norm(question.get("explanation")),
        ) if text
    ]


def test_composition() -> None:
    examples = [
        ({"ageBand":"7-8","question":"Warum?","answers":[{"label":"Ja."},{"label":"Vielleicht?"},{"label":"Nein"}]},
         "Warum? Antwort 1: Ja. Antwort 2: Vielleicht? Antwort 3: Nein."),
        ({"ageBand":"4-6","question":"Ist das richtig?","answers":[{"label":"Ja"},{"label":"Nein"}]},
         "Ist das richtig? Ja oder Nein?"),
        ({"ageBand":"9-10","question":"  Welche Regel gilt? ","answers":[{"label":" Wir helfen. "},{"label":" Wir streiten! "}]},
         "Welche Regel gilt? Antwort 1: Wir helfen. Antwort 2: Wir streiten!"),
    ]
    for question, expected in examples:
        actual = quiz_prompt(question)
        if actual != expected:
            raise SystemExit(f"QUIZ SPEECH GUARD: composition mismatch {actual!r} != {expected!r}")
    print("QUIZ SPEECH GUARD: sentence and answer punctuation tests passed.")


def audit(manifest_path: Path | None) -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    questions = [
        q for q in catalog.get("items", [])
        if q.get("status") == "published"
        and q.get("reviewStatus") == "approved"
        and q.get("verification") == "approved"
    ]
    errors = []
    if len(questions) != 900:
        errors.append(f"Expected 900 approved quiz questions, got {len(questions)}")
    if len({q.get("number") for q in questions}) != len(questions):
        errors.append("Duplicate quiz question numbers")

    prompts = set()
    for question in questions:
        number = question.get("number")
        title = norm(question.get("question"))
        answers = question.get("answers") or []
        if not title.endswith("?"):
            errors.append(f"#{number}: question must end with a question mark")
        if len(answers) not in (2, 3) or sum(a.get("correct") is True for a in answers) != 1:
            errors.append(f"#{number}: 2-3 options with exactly one correct answer required")
        if any(not norm(a.get("label")) for a in answers):
            errors.append(f"#{number}: empty answer choice")
        for field in ("success", "retry", "explanation"):
            if not re.search(r"[.!?؟]$", norm(question.get(field))):
                errors.append(f"#{number}: {field} must be a complete spoken sentence")
        prompt = quiz_prompt(question)
        if re.search(r"(?:\.\.|[?!؟]\.)", prompt):
            errors.append(f"#{number}: double or conflicting punctuation in spoken prompt")
        if prompt in prompts:
            errors.append(f"#{number}: duplicate spoken question")
        prompts.add(prompt)

    ready_prompts = full_questions = 0
    missing = []
    if manifest_path:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        entries = manifest.get("entries") or {}
        for question in questions:
            texts = required_texts(question)
            if entries.get(texts[0]):
                ready_prompts += 1
            if all(entries.get(text) for text in texts):
                full_questions += 1
            else:
                missing.append(question.get("number"))
        counts = manifest.get("counts") or {}
        claimed = (
            counts.get("readyQuestionPrompts"),
            counts.get("remainingQuestionsWithMissingAudio"),
        )
        actual = (ready_prompts, len(questions) - full_questions)
        if claimed != actual:
            errors.append(f"Voice manifest out of sync: claimed={claimed}, actual={actual}")
        print(
            f"QUIZ SPEECH GUARD: {full_questions}/900 complete; "
            f"{len(missing)} missing or stale clips; first pending: {missing[:12]}"
        )
    else:
        print(f"QUIZ SPEECH GUARD: {len(questions)} approved questions; all speech prompts checked.")

    if errors:
        for error in errors[:25]:
            print("QUIZ SPEECH GUARD ERROR:", error)
        raise SystemExit(f"QUIZ SPEECH GUARD: {len(errors)} validation error(s)")
    print("QUIZ SPEECH GUARD OK")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--manifest", type=Path, default=None)
    args = parser.parse_args()
    test_composition()
    audit(args.manifest)


if __name__ == "__main__":
    main()
