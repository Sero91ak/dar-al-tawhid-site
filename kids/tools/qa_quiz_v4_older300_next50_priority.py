#!/usr/bin/env python3
"""Verify a source-fragment-deduplicated future V4 queue; NEVER generate speech.

Budget is measured in unique text characters, not estimated provider credits.
All selected questions and proposed texts must still match the exact immutable
canonical 450-question V4 review plan and reuse any already-paid originals.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
REG = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
MISSING9 = ROOT / "kids/data/quiz-v4-missing9-prepaid-originals.json"
QUEUE = ROOT / "kids/data/quiz-v4-older300-next50-unique-fragment-review.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
PARTS = ("question", "correct", "retry", "explanation")
AGES = ("7-8", "9-10")


def read(p):
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    plan, reg, paid, queued, flag = map(read, (PLAN, REG, MISSING9, QUEUE, FLAG))
    assert flag.get("enabled") is False, "Public KIDS quiz release is on; STOP"
    assert (reg["live"], plan["voiceId"], plan["modelId"]) == (False, reg["voiceId"], reg["modelId"])
    assert queued["newTTSCreditsAuthorized"] == 0 and queued["actualTTSSynthesisPerformed"] is False
    assert queued["livePublished"] is False and queued["humanAudioApproved"] is False
    assert queued["selectedForFutureProduction"] == 50
    assert queued["ageBands"] == list(AGES)
    rows = [q for q in plan["recipes"] if q["ageBand"] in AGES]
    assert len(rows) == 300
    by_id = {q["questionId"]: q for q in rows}
    assert len(by_id) == 300
    known = set(reg["textClips"]) | {item["originalSpokenText"] for item in paid["items"]}
    paid_ids = set(reg["generationClips"]) | {item["generationId"] for item in paid["items"]}

    def unrecorded(row):
        missing = set()
        unresolved = []
        for part in PARTS:
            item = row[part]
            if item["mode"] == "existing-paid-exact":
                if item["generationId"] not in paid_ids:
                    unresolved.append(item["generationId"])
            elif item["mode"] == "compose-from-segments":
                assert " ".join(item["segments"]) == item["text"]
                missing.update(text for text in item["segments"] if text not in known)
            else:
                raise AssertionError("Unexpected V4 segment mode")
        return missing, unresolved

    before_ready = Counter()
    remaining = {}
    all_missing = set()
    by_age_missing = {age: set() for age in AGES}
    for q in rows:
        absent, old_ids = unrecorded(q)
        assert not old_ids, "Older band references an unavailable unknown paid ID"
        if not absent:
            before_ready[q["ageBand"]] += 1
        else:
            remaining[q["questionId"]] = absent
        all_missing.update(absent)
        by_age_missing[q["ageBand"]].update(absent)

    expect = {age: before_ready[age] for age in AGES}
    assert queued["alreadyFourPartCompleteQuestions"] == expect
    for age in AGES:
        state = queued["byAgeRemainingUnique"][age]
        assert state["unrecordedUniqueTexts"] == len(by_age_missing[age])
        assert state["unrecordedTextCharacters"] == sum(len(t) for t in by_age_missing[age])
    assert queued["entireOlder300UniqueMissingFragments"] == len(all_missing)
    assert queued["entireOlder300UniqueMissingCharacters"] == sum(len(t) for t in all_missing)

    approved_queue = queued["queue"]
    seen_ids, recorded = set(), set()
    counts = Counter()
    aggregate_naive = 0
    for order, item in enumerate(approved_queue, start=1):
        assert item["priority"] == order
        band, qid = item["ageBand"], item["questionId"]
        assert band in AGES and qid in remaining and qid not in seen_ids
        assert by_id[qid]["ageBand"] == band
        assert item["estimatedTechnicalQuestionCompletenessAfterAuthenticRecording"] is True
        # Fair alternation: 7-8, 9-10, ... (never merge ages).
        assert band == AGES[(order - 1) % 2]
        missing = remaining[qid]
        new = missing - recorded
        assert set(item["missingTextFragments"]) == new, (qid, "fragment mismatch")
        assert item["additionalUniqueFragments"] == len(new)
        assert item["additionalCharacters"] == sum(len(t) for t in new)
        aggregate_naive += sum(len(t) for t in missing)
        recorded.update(new)
        counts[band] += 1
        seen_ids.add(qid)
    assert dict(counts) == queued["queuedQuestionCounts"]
    assert counts == Counter({"7-8": 25, "9-10": 25})
    assert queued["uniqueAdditionalTextsInQueue"] == len(recorded)
    assert queued["uniqueAdditionalCharactersInQueue"] == sum(len(t) for t in recorded)
    assert queued["sourceTextCharactersNaiveWithoutQueueDedup"] == aggregate_naive
    assert queued["sourceTextCharactersSavedViaReuse"] == (
        aggregate_naive - sum(len(t) for t in recorded))
    assert queued["remainingSelectedQuestionsOutsideQueue"] == (
        len(rows) - sum(before_ready.values()) - len(approved_queue))

    ordered = queued["deduplicatedFutureRecordingTexts"]
    assert len(ordered) == len(recorded)
    assert len({x["text"] for x in ordered}) == len(recorded)
    assert {x["text"] for x in ordered} == recorded
    for item in ordered:
        assert item["requiredBySelectedQuestions"] == sum(
            item["text"] in remaining[qid] for qid in seen_ids)
    print("PASS_KIDS_V4_OLDER300_NEXT50_CREDIT_SAVER " + json.dumps({
        "plannedQuestions": len(approved_queue),
        "questionsByAge": dict(counts),
        "uniqueSourceTexts": len(recorded),
        "sourceCharacters": sum(len(t) for t in recorded),
        "crossQuestionReuseCharactersSaved": queued["sourceTextCharactersSavedViaReuse"],
        "providerCreditsSpent": 0,
        "published": False,
        "humanApproved": False
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
