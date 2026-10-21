#!/usr/bin/env python3
"""Build strictly review-only stage-1/stage-2 V4 recording checklists.

Preserves exactly 900 original KIDS quiz questions. Every proposed recording
must come from the selected 450 spoken-text recipe and must be absent from
existing original MP3 receipts (including 9 missing previously paid takes).
No TTS requests, downloads, credit usage, public resources or approvals.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
OUT = ROOT / ".github/reports"
PRIORITY = OUT / "kids-v4-older-age-no-credit-priority.json"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
PARTS = ("question", "correct", "retry", "explanation")
BANDS = ("7-8", "9-10")


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(cond, msg):
    if not cond:
        raise RuntimeError("TAWHID_KIDS_STAGE_PREFLIGHT_REJECTED: " + msg)


def hash_text(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def main():
    priority = load(PRIORITY)
    catalog = load(DATA / "quiz-kids.json")
    curated = load(DATA / "quiz-kids-curated-450-review.json")
    reserve = load(DATA / "quiz-kids-expansion-reserve-450.json")
    plan = load(DATA / "quiz-v4-curated-450-production-review.json")
    reg = load(DATA / "quiz-v4-450-original-clip-registry.json")
    old = load(DATA / "quiz-v4-missing9-prepaid-originals.json")
    release = load(DATA / "quiz-curation-release.json")
    require(release.get("enabled") is False, "public release must be OFF")
    require(reg.get("live") is False and
            reg.get("voiceId") == plan.get("voiceId") == VOICE and
            reg.get("modelId") == plan.get("modelId") == MODEL,
            "wrong V4 voice or model")
    require(priority.get("reviewOnly") is True and
            priority.get("authorizedNewPaidSynthesis") is False and
            priority.get("newElevenLabsCreditsSpent") == 0,
            "recording priorities must be unpaid, unapproved drafts")
    C = {q["id"]: q for q in catalog["items"]}
    S = {q["id"]: q for q in curated["items"]}
    R = {q["id"]: q for q in reserve["items"]}
    P = {q["questionId"]: q for q in plan["recipes"]}
    require((len(C), len(S), len(R), len(P)) == (900, 450, 450, 450),
            "900/450+450 catalog count or duplicate IDs changed")
    require(not (set(S) & set(R)) and (set(S) | set(R)) == set(C) and set(P) == set(S),
            "original/curated/reserved question IDs not conserved")
    require(all(C[id_] == q for id_, q in S.items())
            and all(C[id_] == q for id_, q in R.items()),
            "original pedagogical content was changed")
    present = set(reg["textClips"])
    generation = set(reg["generationClips"])
    prepaid = {q["originalSpokenText"]: q["generationId"] for q in old["items"]}
    require(len(prepaid) == 9, "missing previously paid originals changed")

    stages = priority["twoIncrementalTenPerAgeReviewStages"]
    require(len(stages) == 2, "Expected exactly two ten-per-age priority stages")
    original_queue = priority["preciseUnrecordedOriginalTextQueue"]
    queue = {q["sha256"]: q for q in original_queue}
    require(len(queue) == 150 and
            all(hash_text(q["spokenText"]) == q["sha256"] for q in original_queue),
            "priority script does not have 150 exact unique source texts")
    require(len(priority["priorityQuestionSteps"]) == 40,
            "Exactly forty priority questions required")
    chosen_steps = {q["questionId"]: q for q in priority["priorityQuestionSteps"]}
    require(len(chosen_steps) == 40, "Duplicate priority question IDs")
    outputs = []
    stage_seen = set()
    preceding_texts = set()
    stage_total_new = 0
    stage_total_chars = 0
    for number, stage in enumerate(stages, 1):
        require(stage.get("stage") == number and
                stage.get("newQuestionsPerAgeBand") == {"7-8": 10, "9-10": 10},
                "stage order or per-age distribution mismatch")
        question_ids = stage["selectedQuestionIds"]
        require(len(question_ids) == 20 and len(set(question_ids)) == 20 and
                not (stage_seen & set(question_ids)),
                "question copied to multiple stages")
        stage_seen.update(question_ids)
        required = set()
        local_uses = defaultdict(list)
        checks = []
        for id_ in question_ids:
            require(id_ in S and id_ in P and id_ in chosen_steps,
                    "stage includes a nonselected question")
            original = S[id_]
            recipe = P[id_]
            band = recipe["ageBand"]
            require(band in BANDS and original["ageBand"] == band,
                    "question belongs to wrong age group")
            answers = original.get("answers") or []
            require(len(answers) == 3 and
                    sum(a.get("correct") is True for a in answers) == 1,
                    "each question needs exactly 3 answers, one correct")
            must_review = []
            slots = {}
            for part in PARTS:
                utterance = recipe[part]
                text = utterance["text"]
                if utterance["mode"] == "existing-paid-exact":
                    gid = utterance["generationId"]
                    require(gid in generation, "stage would require unrecovered paid take")
                    slots[part] = {
                        "mode": "original-paid-exact",
                        "spokenTextSHA256": hash_text(text),
                        "paidOriginalGenerationId": gid,
                        "alreadyRecorded": True,
                    }
                elif utterance["mode"] == "compose-from-segments":
                    fragments = utterance.get("segments") or []
                    pauses = utterance.get("pauseAfterMs") or []
                    require(fragments and " ".join(fragments) == text and
                            len(pauses) == len(fragments) - 1,
                            "spoken wording/pauses not identical to production plan")
                    pending = []
                    for fragment in fragments:
                        if fragment in present:
                            continue
                        require(fragment not in prepaid,
                                "would charge again for an old already-paid original")
                        required.add(fragment)
                        pending.append(hash_text(fragment))
                        local_uses[fragment].append({"questionId": id_, "audioPart": part})
                    slots[part] = {
                        "mode": "compose-from-verified-originals",
                        "spokenTextSHA256": hash_text(text),
                        "segments": [
                            {"textSHA256": hash_text(frag),
                             "alreadyRecorded": frag in present}
                            for frag in fragments
                        ],
                        "pauseAfterMs": pauses,
                        "missingOriginalTextSHA256": pending,
                    }
                else:
                    raise RuntimeError("Unsupported V4 audio part mode")
            # Pedagogical validity is NOT decided automatically. The source
            # and true answer are printed for a separate manual review.
            spoken_question = recipe["question"]["text"]
            for idx, answer in enumerate(answers, 1):
                if "Antwort "+str(idx)+":" not in spoken_question or \
                        answer["label"] not in spoken_question:
                    must_review.append("Check spoken multiple-choice option "+str(idx))
            checks.append({
                "questionId": id_, "ageBand": band,
                "originalQuestion": original["question"],
                "correctAnswer": next(a["label"] for a in answers if a["correct"] is True),
                "answers": [a["label"] for a in answers],
                "originalSource": original.get("source"),
                "originalVerification": original.get("verification"),
                "originalReviewStatus": original.get("reviewStatus"),
                "spokenQuestion": spoken_question,
                "explanation": recipe["explanation"]["text"],
                "audioParts": slots, "automaticTextWarnings": must_review,
                "humanSourceApproval": False,
                "humanPronunciationApproval": False,
                "manualRecordingAuthorization": False,
            })
        for b in BANDS:
            require(sum(c["ageBand"] == b for c in checks) == 10,
                    "stage must have ten questions per age band")
        new = required - preceding_texts
        in_stage = {q["sha256"]: q for q in original_queue if q["spokenText"] in new}
        require(len(in_stage) == len(new), "missing authorized exact-text recipe")
        require(set(in_stage) == set(stage["incrementalOriginalTextSha256"]),
                "stage recorded text hashes differ from initial priority plan")
        require(len(new) == stage["newDistinctOriginals"] and
                sum(map(len, new)) == stage["newOriginalCharacters"],
                "stage length/count differs from source plan")
        require(not(new & present) and not(new & set(prepaid)),
                "previously paid/existing audio in new-stage queue")
        script = [{
            "spokenText": text,
            "spokenTextSHA256": hash_text(text),
            "characters": len(text),
            "expectedVoiceId": VOICE,
            "expectedModelId": MODEL,
            "neededBy": local_uses[text],
            "existingOriginalMP3": False,
            "newRecordingStarted": False,
            "paidCreditsSpent": 0,
            "reviewerApprovedSourceText": False,
            "reviewerApprovedPronunciation": False,
            "explicitRecordingAuthorization": False,
        } for text in sorted(new)]
        checklist = {
            "schemaVersion": 1, "app": "TAWḤĪD KIDS",
            "scope": "V4_OLDER_AGE_PRIVATE_STAGE_PREFLIGHT",
            "stage": number, "ageBands": list(BANDS),
            "reviewOnly": True, "published": False,
            "voiceGenerationAuthorized": False,
            "automatedElevenLabsRequest": False,
            "newCreditsSpent": 0,
            "humanHearingApproved": False,
            "questions": checks,
            "originalTextRecordingQueue": script,
            "numberOfQuestions": 20,
            "numberOfNewOriginalTexts": len(new),
            "numberOfNewCharacters": sum(map(len, new)),
            "dependsOnPreviousStage": number > 1,
            "priorStageRecordedAudioPresumed": False,
            "requiresHumanContentAndReferenceAudit": True,
            "requiresSeparateExplicitCostAuthorization": True,
            "requiresManualListeningBeforePublication": True,
        }
        OUT.mkdir(parents=True, exist_ok=True)
        outfile = OUT / f"kids-v4-older-age-stage{number}-exact-voice-preflight.json"
        outfile.write_text(json.dumps(checklist, ensure_ascii=False, indent=2) + "\n",
                           encoding="utf-8")
        outputs.append({"path": str(outfile.relative_to(ROOT)),
                        "stage": number, "questions": 20, "fragments": len(new),
                        "characters": sum(map(len, new)),
                        "manualTextWarnings": sum(len(q["automaticTextWarnings"])
                                                  for q in checks)})
        stage_total_new += len(new)
        stage_total_chars += sum(map(len, new))
        preceding_texts.update(new)
    require(len(stage_seen) == 40 and
            stage_total_new == priority["newDistinctTextCountForFirst40"] and
            stage_total_chars == priority["newCharactersForFirst40"],
            "Combined stage manifests do not match the 40-question contract")
    require(preceding_texts == set(q["spokenText"] for q in original_queue),
            "A priority original is missing from stage recording checklists")
    print("PASS_KIDS_V4_OLDER_AGE_EXACT_VOICE_PREFLIGHT_NO_TTS " +
          json.dumps({"stages": outputs, "synthesisCreditsSpent": 0,
                      "livePublished": False}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
