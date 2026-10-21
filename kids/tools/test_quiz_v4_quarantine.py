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
    # Owner rejected ʿIbādah and requested individual review of Ḥalāl/Ḥarām.
    # These seven ORIGINAL paid MP3s must never be selected for quiz playback.
    # A separate master-dictionary spelling does not authorize their audio.
    hold=json.loads((ROOT/"kids/data/quiz-v4-owner-pronunciation-hold-20261021.json")
                    .read_text(encoding="utf-8"))
    assert hold["modelId"]=="eleven_v4"
    assert hold["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH"
    assert len(hold["originals"])==7
    owner_texts={x["sourceText"] for x in hold["originals"]}
    assert len(owner_texts)==7 and owner_texts<=bad_texts
    assert sum("ʿIbādah" in t for t in owner_texts)==3
    assert sum("Ḥalāl" in t or "Ḥarām" in t for t in owner_texts)==4
    assert all(x["retainPaidOriginal"] is True and
               x["blockedForQuizPlayback"] is True and
               x["blockedForPublicRelease"] is True and
               x["allowBlindRegeneration"] is False
               for x in hold["originals"])
    for q in plan["recipes"]:
        for part in ("question","correct","retry","explanation"):
            if any(fragment in owner_texts for fragment in q[part].get("segments",[])):
                assert q[part]["text"] in bad_full, (
                    "Owner-rejected paid V4 sample became playable: "+q["questionId"])
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
