#!/usr/bin/env python3
"""Zero-credit integrity test: old-nine and connected ElevenLabs Flow reservations.

Run AFTER plan_quiz_v4_finish_without_duplicate_credits.py.
Uses only existing private JSON data; NO provider operations, no fake audio.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts
from quiz_v4_native_fusha_reuse import load_mapping, resolve_text_originals
from quiz_v4_quarantine import quarantined_originals

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"kids/review-only/quiz-v4-450-next-completion-priority.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
OLD=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
FLOW=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
OLDER_JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
STAGE=ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import.json"
PARTS=("question","correct","retry","explanation")
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def fail_unless(test,description):
    if not test:raise AssertionError("KIDS_V4_FLOW_DOUBLE_CREDIT_FAIL: "+description)

def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def main():
    report,plan,reg,ledger,nine,flow=map(load,(OUT,PLAN,REG,LEDGER,OLD,FLOW))
    stage=load(STAGE)
    native_mapping,native_assets=load_mapping(ROOT)
    quarantined,quarantined_ids=quarantined_originals(ROOT)
    fail_unless(len(stage.get("questions",{}))==450 and stage["publicReleaseEnabled"] is False,
                "actual 450 quiz stage is absent or public")
    protect=protect_paid_texts(ROOT,reg,ledger)
    missing9={r["originalSpokenText"] for r in nine["items"]
              if r["generationId"] not in reg["generationClips"]}
    reserved={r["sourceText"] for r in flow["entries"]
              if r["status"]!="IMPORTED_ORIGINAL_MP3_VERIFIED"}
    attempts=load(OLDER_JOURNAL)
    fail_unless(attempts["modelId"]=="eleven_v4" and attempts["voiceId"]==VOICE,
                "unconfirmed historic provider request identities changed")
    uncertain_hashes={x["textSHA256"] for x in attempts["entries"]
                      if x["status"]=="REQUEST_STARTED_UNCONFIRMED"}
    registered=set(reg["textClips"])
    fail_unless(not (reserved&registered or reserved&missing9),
                "connected Flow pending text is already saved or an old nine original")
    fail_unless(reserved<=protect,"Flow pending text not protected against double charges")
    expected=set()
    expected_reserved=set()
    expected_uncertain=set()
    for row in plan["recipes"]:
        q_stage=stage["questions"][row["questionId"]]
        fail_unless(q_stage["ageBand"]==row["ageBand"],
                    "real audio stage age does not match source question")
        for part in PARTS:
            entry=row[part]
            # Completed composed MP3 parts have already passed SHA and codec
            # validation. Do not bill fragments of such a part a second time.
            if part in q_stage["parts"]:
                fail_unless(part not in q_stage["missing"] and
                            q_stage["parts"][part]["spokenTextSha256"]==digest(entry["text"]),
                            "invalid playback SHA in current stage")
                continue
            fail_unless(part in q_stage["missing"],
                        "current quiz stage lacks a missing-part marker")
            for text in entry.get("segments",[]):
                _,missing=resolve_text_originals(text,reg["textClips"],
                                                 native_mapping,native_assets)
                for needed in missing:
                    if needed in registered or needed in quarantined:continue
                    if needed in reserved:expected_reserved.add(needed)
                    elif digest(needed) in uncertain_hashes:
                        expected_uncertain.add(digest(needed))
                    elif needed not in missing9:
                        fail_unless(needed not in protect,
                                    "unavailable audio was already charged or reserved; never rebuy")
                        expected.add(needed)
    summary=report["summary"]
    fail_unless(summary["selectedQuestions"]==450 and
                summary["voiceId"]==VOICE and
                summary["modelId"]=="eleven_v4",
                "changed canonical voice or 450 review scope")
    fail_unless(summary["connectedFlowOriginalTextsPendingOrReserved"]==len(reserved)
                and summary["reservedFlowOriginalsExcludedFromNewChargeQueue"]==len(reserved),
                "Flow reservation counts inconsistent with real connected ledger")
    fail_unless(set(reserved)==expected_reserved,"some pending Flow texts not used or not blocked")
    fail_unless(uncertain_hashes==expected_uncertain,
                "previous paid POST uncertainty not explicitly identified in 450 review")
    fail_unless(uncertain_hashes==set(summary["uncertainPreviouslyAttemptedSourceSHA256"]),
                "uncertain provider source entered a paid-original queue")
    fail_unless(summary["missingGenuineNewExactSegments"]==len(expected)
                and summary["missingGenuineNewTextCodepoints"]==sum(len(x) for x in expected),
                "genuine new V4 cost count includes duplicate or reserved take")
    queue=report["possibleNewSpeechPriorityAfterOriginalRecovery"]
    queue_hashes=[h for q in queue for h in q["newTextSha256"]]
    fail_unless(len(queue_hashes)==len(set(queue_hashes))
                and set(queue_hashes)=={digest(t) for t in expected},
                "paid audio completion queue missing a needed source or duplicates one")
    fail_unless(not (uncertain_hashes&set(queue_hashes)),
                "old uncertain provider POST was queued again for paid synthesis")
    fail_unless(not ({digest(x) for x in reserved}&set(queue_hashes)),
                "already reserved connected Flow text was offered to paid synthesis")
    fail_unless(all(x["newSynthesisAllowed"] is False
                    for x in report["connectedFlowOriginalsToRecoverWithoutSecondPurchase"]),
                "unresolved Flow items marked eligible for new paid TTS")
    totals=sum(sum(groups.values()) for groups in summary["ageCounts"].values())
    fail_unless(totals==450,"unaccounted quiz groups in recovery plan")
    fail_unless(summary["alreadyTechnicallyComplete"]==
                sum(int(q["fourPartTechnicallyReady"]) for q in stage["questions"].values()),
                "recovery report disagrees with SHA-verified staged MP3 count")
    fail_unless(sum(sum(groups.values()) for groups in summary["ageCounts"].values())==450,
                "one or more owner-held, prepaid or reserved questions unaccounted for")
    fail_unless(summary["newElevenLabsCreditsSpent"]==0 and
                summary["paidSynthesisAuthorized"] is False and
                summary["publicReleaseAllowed"] is False,
                "cost-only report must never authorize spending or release")
    print("PASS: %d reserved Flow originals protected; %d genuine new fragments; "
          "all 450 questions accounted; 0 extra provider requests."%
          (len(reserved),len(expected)))

if __name__=="__main__":main()
