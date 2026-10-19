#!/usr/bin/env python3
"""Zero-credit proof that wrong-pronunciation V4 takes never enter quiz review."""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
from quiz_v4_quarantine import blocked_full_utterances,quarantined_originals


def main():
    bad_texts,bad_ids=quarantined_originals(ROOT)
    assert {
        "Glücksspiele spielen.",
        "Angeben.",
        "Der Qurʾān befiehlt an vielen Stellen Gebet und Zakāh gemeinsam.",
    }<=bad_texts,"Previously paid but rejected wrong-pronunciation takes became playable"
    assert {"UoyfOZJg4ysPhTee41ru","15jWoEmEjxXcSEz9r79Z",
            "fXiqKqmUPFZBMOCKBUQ5"}<=bad_ids,"Paid provider IDs lost"
    plan=json.loads((ROOT/"kids/data/quiz-v4-curated-450-production-review.json").read_text(encoding="utf-8"))
    bad_full=blocked_full_utterances(plan["recipes"],bad_texts,bad_ids)
    bad_question=next(q for q in plan["recipes"] if q["questionId"]=="kids-quiz-046")
    assert bad_question["question"]["text"] in bad_full
    assert bad_question["explanation"]["text"] in bad_full
    assert all("Glücksspiele spielen." not in q["question"]["text"] or
               q["question"]["text"] in bad_full for q in plan["recipes"])
    ledger=json.loads((ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json").read_text(encoding="utf-8"))
    for item in ledger["entries"]:
        if item.get("generationId") in bad_ids:
            assert item["blockedForQuizPlayback"] is True
            assert item["blockedForPublicRelease"] is True
            assert item["preservePaidGenerationDoNotRebuyAutomatically"] is True
            assert item["actualProviderCredits"]>0
    flag=json.loads((ROOT/"kids/data/quiz-curation-release.json").read_text(encoding="utf-8"))
    assert flag["enabled"] is False
    print("PASS_KIDS_V4_BAD_PRONUNCIATION_QUARANTINE "+json.dumps({
        "paidBadGenerationIDs":len(bad_ids),
        "blockedSpokenTexts":len(bad_texts),
        "blockedComposedUtterances":len(bad_full),
        "quarantinedQuestion":"kids-quiz-046",
        "retainedOriginalProof":True,
        "newSyntheses":0,
        "creditsSpent":0,
        "publicRelease":False},ensure_ascii=False))


if __name__=="__main__":
    main()
