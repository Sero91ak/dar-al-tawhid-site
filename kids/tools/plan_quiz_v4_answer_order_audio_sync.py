#!/usr/bin/env python3
"""Draft voice-synchronized answer order for 40 selected unrecorded KIDS quizzes.

The canonical 900/450+450 files, current 450 V4 audio plan, stored originals
and public KIDS app remain UNCHANGED. An offline-only proposed solution:
balanced answer positions and matching reordered ORIGINAL MP3 source segments.
No new speech fragments, no TTS, no public answer-button shuffle.
"""
from __future__ import annotations
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
REPORTS = ROOT / ".github/reports"
OUT = REPORTS / "kids-v4-older-40-audio-synced-answer-order-proposal.json"
PRIORITY = REPORTS / "kids-v4-older-age-no-credit-priority.json"
BANDS = ("7-8", "9-10")


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def demand(ok, description):
    if not ok:
        raise RuntimeError("KIDS V4 AUDIO/ANSWER SYNC PROPOSAL REJECTED: " + description)


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def norm_answer(value):
    return value if value.endswith((".", "!", "?", "؟")) else value + "."


def main():
    plan = read(DATA / "quiz-v4-curated-450-production-review.json")
    selected = read(DATA / "quiz-kids-curated-450-review.json")
    canonical = read(DATA / "quiz-kids.json")
    reserve = read(DATA / "quiz-kids-expansion-reserve-450.json")
    priority = read(PRIORITY)
    audio_registry = read(DATA / "quiz-v4-450-original-clip-registry.json")
    release = read(DATA / "quiz-curation-release.json")

    demand(release.get("enabled") is False, "public release must remain disabled")
    demand(len(canonical["items"]) == 900 and len(selected["items"]) == 450 and
           len(reserve["items"]) == 450 and len(plan["recipes"]) == 450,
           "source/selected/remaining catalog incomplete")
    full = {x["id"]: x for x in canonical["items"]}
    picked = {x["id"]: x for x in selected["items"]}
    leftover = {x["id"]: x for x in reserve["items"]}
    recipes = {q["questionId"]: q for q in plan["recipes"]}
    demand(set(picked).isdisjoint(leftover) and
           set(picked) | set(leftover) == set(full) and
           len(full) == 900 and len(picked) == 450 and
           len(leftover) == 450 and len(recipes) == 450,
           "900 original/450 curated/450 reserved uniqueness violated")
    demand(all(full[i] == q for i, q in picked.items()) and
           all(full[i] == q for i, q in leftover.items()) and
           set(recipes) == set(picked),
           "original question texts or selection have changed")
    # Check the actual question-position bias globally, not just the
    # 40 questions currently planned for future V4 original assembly.
    source_position_counts = {age: Counter() for age in ("4-6", "7-8", "9-10")}
    for question in canonical["items"]:
        answers = question.get("answers") or []
        demand(answers and sum(a.get("correct") is True for a in answers) == 1,
               "all 900 questions must have exactly one correct answer")
        age = question["ageBand"]
        demand(age in source_position_counts, "unexpected source age band")
        position = next(i+1 for i,a in enumerate(answers) if a.get("correct") is True)
        source_position_counts[age][str(position)] += 1
    demand(all(source_position_counts[age]["1"] == 300 and
               sum(source_position_counts[age].values()) == 300
               for age in source_position_counts),
           "original correct-answer positions changed; re-audit existing UI behavior")
    # Never claim that the visible UI currently randomizes answer choices.
    # It iterates answers as stored, and the voice prompt enumerates that order.
    renderer = (ROOT / "kids/index.html").read_text(encoding="utf-8")
    demand('q.answers.forEach(function(a,idx)' in renderer and
           'var a=q.answers[index];' in renderer and
           'return "Antwort "+(i+1)+": "+label' in renderer,
           "quiz UI choice/voice enumeration changed; inspect before reordering")
    demand(plan["voiceId"] == audio_registry["voiceId"] == "DkU7j9uO4ZEtLD2iRZSH"
           and plan["modelId"] == audio_registry["modelId"] == "eleven_v4",
           "wrong original V4 voice contract")
    stages = priority["twoIncrementalTenPerAgeReviewStages"]
    demand(len(stages) == 2 and priority["authorizedNewPaidSynthesis"] is False,
           "two unapproved original recording stages required")
    ordered = [id_ for stage in stages for id_ in stage["selectedQuestionIds"]]
    demand(len(ordered) == 40 and len(set(ordered)) == 40,
           "priority questions duplicated or missing")

    counts = {band: Counter() for band in BANDS}
    seen = Counter()
    proposed = []
    original_fragments = set()
    balanced_fragments = set()
    for id_ in ordered:
        question = picked[id_]
        recipe = recipes[id_]
        band = question["ageBand"]
        demand(band in BANDS and recipe["ageBand"] == band,
               "age-group mismatch: " + id_)
        answers = question["answers"]
        demand(len(answers) == 3 and
               sum(a.get("correct") is True for a in answers) == 1,
               "exactly three original answer options with one correct required")
        before = next(i for i,a in enumerate(answers) if a["correct"] is True)
        demand(before == 0,
               "original-answer bias changed; re-audit all question positions")
        question_audio = recipe["question"]
        demand(question_audio["mode"] == "compose-from-segments",
               "cannot safely reorder already baked full question MP3: "+id_)
        segments = list(question_audio["segments"])
        pauses = list(question_audio["pauseAfterMs"])
        demand(len(pauses) == len(segments)-1 and
               " ".join(segments) == question_audio["text"],
               "original spoken segments/pause contract mismatch")
        markers = [i for i,s in enumerate(segments) if s in
                   ("Antwort 1:", "Antwort 2:", "Antwort 3:")]
        demand(len(markers) == 3 and
               [segments[i] for i in markers] ==
               ["Antwort 1:", "Antwort 2:", "Antwort 3:"] and
               all(markers[i]+1 < len(segments) for i in range(3)),
               "all three answer labels must be independent segments: "+id_)
        old_option_text = [segments[i+1] for i in markers]
        demand(old_option_text == [norm_answer(a["label"]) for a in answers],
               "visible answer labels and audio original differ for "+id_)

        # The order is deterministic by first-occurrence within each band:
        # after 20 questions = correct answer at positions 1:7, 2:7, 3:6.
        offset = seen[band] % 3
        seen[band] += 1
        permutation = [0, 1, 2] if offset == 0 else (
                      [1, 0, 2] if offset == 1 else [1, 2, 0])
        reordered = [answers[i] for i in permutation]
        new_segments = list(segments)
        for j, start in enumerate(markers):
            new_segments[start+1] = old_option_text[permutation[j]]
        new_text = " ".join(new_segments)
        demand(len(new_segments) == len(segments) and
               Counter(new_segments) == Counter(segments) and
               len(new_text) == len(question_audio["text"]),
               "answer permutations must reuse exactly the same already planned fragments")
        demand(sum(a["correct"] is True for a in reordered) == 1,
               "correct answer lost after permutation")
        actual = next(i for i,a in enumerate(reordered) if a["correct"] is True)
        demand(actual == offset, "incorrect proposed visible/spoken position")
        for label, spoken in zip(reordered, [new_segments[i+1] for i in markers]):
            demand(norm_answer(label["label"]) == spoken,
                   "audible answer differs from displayed answer")
        counts[band][str(actual+1)] += 1
        original_fragments.update(segments)
        balanced_fragments.update(new_segments)
        proposed.append({
            "questionId": id_,"ageBand": band,
            "originalCorrectAnswerPosition": 1,
            "proposedCorrectAnswerPosition": actual+1,
            "displayAnswerLabelsInSameOrderAsSpeech": [a["label"] for a in reordered],
            "originalAnswerIdsInProposedDisplayOrder": [a["id"] for a in reordered],
            "originalQuestionAudioSHA256": sha(question_audio["text"]),
            "proposedQuestionAudioText": new_text,
            "proposedQuestionAudioSHA256": sha(new_text),
            "originalSegmentsReusedWithoutRerecording": True,
            "proposedOrderedAudioSegments": new_segments,
            "pauseAfterMsUnchanged": pauses,
            "originalSource": question.get("source"),
            "voicePlaybackAndVisualOrderMustRemainIdentical": True,
            "readyToApplyToVisitorApp": False,
            "humanApproved": False,
        })
    demand(seen == Counter({"7-8": 20, "9-10": 20}),
           "must balance twenty proposed questions per age group")
    demand(all(counts[band] == Counter({"1":7,"2":7,"3":6}) for band in BANDS),
           "the proposed answer positions are not evenly distributed")
    demand(original_fragments == balanced_fragments,
           "proposal would introduce previously unplanned voice fragments")
    demand(all(p["originalSegmentsReusedWithoutRerecording"] for p in proposed),
           "permutation must not require new audio")
    report = {
        "schemaVersion": 1,"app":"TAWḤĪD KIDS",
        "scope":"V4_PRIVATE_AUDIO_SYNCHRONIZED_40_ANSWER_POSITION_PROPOSAL",
        "reviewOnly":True,"liveAppChanged":False,
        "canonical900OriginalsModified":False,"curated450OrReserve450Modified":False,
        "currentAudioProductionPlanModified":False,
        "humanApprovalGranted":False,"newAudioSynthesisStarted":False,
        "newElevenLabsCreditsSpent":0,
        "currentAll900CatalogCorrectFirst":True,
        "canonicalCorrectAnswerPositionsByAge":{
            age:dict(source_position_counts[age]) for age in source_position_counts},
        "existingLiveRendererNeedsCoordinatedAnswerAndNarrationChange":True,
        "existingFullSentenceOriginalsMustNotBeMismatchedWithShuffledAnswers":True,
        "selectedQuestionsInPlan":40,
        "correctAnswerPositionCountsPerAge":{b:dict(counts[b]) for b in BANDS},
        "sameOriginalFragmentSetAfterReordering":True,
        "addedOriginalFragmentCount":len(balanced_fragments-original_fragments),
        "projectedExtraOriginalSpeechCharacters":0,
        "proposedQuestionItems":proposed,
        "mustNotDeployBeforeFull450And900VoiceConsistencyQA":True,
        "status":"DESIGN_ONLY_PENDING_REVIEW_AND_IMPLEMENTATION"
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_SPEECH_SYNCED_40_BALANCED_ANSWERS_DESIGN_NO_TTS "+
          json.dumps({"questions":40,"correctByAge":report["correctAnswerPositionCountsPerAge"],
                      "newFragments":0,"extraSpeechCharacters":0,"live":False},ensure_ascii=False),
          flush=True)


if __name__=="__main__":
    main()
