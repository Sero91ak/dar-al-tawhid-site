#!/usr/bin/env python3
"""Deterministic, no-credit FULL 450-question eleven_v4 recording queue.

Never starts TTS or touches public quiz assets. Existing source words, exact
UTF-8 hashes, paid invoice journal and the nine older paid generations are
immutable. Later recording runs MUST re-audit their ledger and credit budget.
The price constant is a conservative planning forecast, not an invoice.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids/tools"))
from quiz_v4_no_double_charge_guard import protect_paid_texts

VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
KINDS = ("question", "correct", "retry", "explanation")
AGES = ("4-6", "7-8", "9-10")
ESTIMATE_CREDITS_PER_CODEPOINT = 1.220004  # project-only forecast
MAX_NEW_ORIGINALS_PER_WAVE = 25
MAX_ESTIMATED_CREDITS_PER_WAVE = 2000.0
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
REG = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER = ROOT / "kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE = ROOT / "kids/data/quiz-curation-release.json"
ALREADY_PAID_NINE = ROOT / "kids/data/quiz-v4-missing9-prepaid-originals.json"
STAGE_ATTEMPTS = ROOT / "kids/data/quiz-v4-older-stage1-request-journal.json"
OUT = ROOT / "kids/review-only/quiz-v4-450-all-missing-recording-waves.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def guard(ok, why):
    if not ok:
        raise RuntimeError("KIDS V4 STOP: " + why)


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def estimate(text):
    return len(text) * ESTIMATE_CREDITS_PER_CODEPOINT


def build():
    cfg, plan, reg, ledger, nine = (load(x) for x in
       (RELEASE, PLAN, REG, LEDGER, ALREADY_PAID_NINE))
    guard(cfg["enabled"] is False, "public release must stay OFF")
    guard(plan["modelId"] == MODEL and plan["voiceId"] == VOICE,
          "production source not approved V4 master")
    guard(reg["modelId"] == MODEL and reg["voiceId"] == VOICE
          and reg["live"] is False and ledger["live"] is False,
          "private original MP3 ledger changed")
    recipes = plan["recipes"]
    guard(len(recipes) == 450 and len({q["questionId"] for q in recipes}) == 450,
          "450 fixed source question IDs altered")
    guards = protect_paid_texts(ROOT, reg, ledger)
    original_nine = {r["originalSpokenText"] for r in nine["items"]}
    guard(len(original_nine) == 9, "historical prepaid originals missing or altered")
    connected = ROOT / "kids/data/quiz-v4-connected-flow-originals-ledger.json"
    # Verified separately by protect_paid_texts: these are NOT already
    # playable. They remain outstanding for MP3 import but may not be bought.
    flow_pending = set()
    if connected.is_file():
        flow = load(connected)
        flow_pending = {x["sourceText"] for x in flow["entries"]
                        if x["status"] != "IMPORTED_ORIGINAL_MP3_VERIFIED"}
    by_id = {r["questionId"]: r for r in recipes}
    age = {qid: row["ageBand"] for qid, row in by_id.items()}
    guard(Counter(age.values()) == {"4-6":150, "7-8":150, "9-10":150},
          "not 150 questions in each age band")
    # A timed-out provider POST might already be billed. Exclude its exact
    # source SHA from ALL new purchasing waves, without blocking unrelated
    # genuinely unpaid source texts or silently trying the uncertain one again.
    uncertain=set()
    if STAGE_ATTEMPTS.is_file():
        journal=load(STAGE_ATTEMPTS)
        for attempt in journal.get("entries",[]):
            if attempt.get("status")=="REQUEST_STARTED_UNCONFIRMED":
                h=attempt.get("textSHA256")
                guard(isinstance(h,str) and len(h)==64 and h not in uncertain,
                      "duplicate or invalid uncertain paid source SHA")
                uncertain.add(h)
    requested = {}
    use = defaultdict(set)
    question_fragments = defaultdict(set)
    # Most utterances are *composed* from many separately paid original
    # fragments. Never synthesize the full question text in addition to its
    # segments: that would double-charge and break the exact composition map.
    for q in recipes:
        for kind in KINDS:
            part = q[kind]
            full = part["text"]
            guard(isinstance(full, str) and full, "missing exact spoken source")
            if part["mode"] == "existing-paid-exact":
                guard(bool(part.get("generationId")),
                      "older prepaid take missing its immutable generation ID")
                continue
            guard(part["mode"] == "compose-from-segments",
                  "unknown original recording mode")
            fragments = part["segments"]
            guard(isinstance(fragments, list) and fragments and
                  all(isinstance(x,str) and x for x in fragments) and
                  " ".join(fragments) == full,
                  "exact fragment composition contract mismatch")
            for s in fragments:
                if s in reg["textClips"] or s in original_nine or s in flow_pending:
                    continue
                h = digest(s)
                if h in uncertain:
                    # Already attempted: original bytes must be recovered,
                    # never synthesize a paid replacement in another wave.
                    continue
                guard(s not in guards, "unreconciled old paid text: " + h)
                requested[h] = s
                use[h].add(q["questionId"])
                question_fragments[q["questionId"]].add(h)
    # A provider-uncertain source remains protected and visibly excluded.
    # Its absence from a new wave is a prerequisite, not permission to discard
    # its previous payment record.
    guard(not (set(requested) & uncertain),
          "uncertain previous provider POST entered new paid queue")
    for q in recipes:
        for part in KINDS:
            s = q[part]["text"]
            if s in original_nine:
                guard(s not in reg["textClips"],
                      "historical prepaid MP3 and direct text registry conflict")
    pending = set(requested)
    waves = []
    counts = Counter()
    while pending:
        chosen = []
        chosen_set = set()
        wave_cost = 0.0
        # First complete the cheapest feasible whole question so children can
        # actually finish a quiz; balance 7–8 and 9–10 age bands.
        while True:
            options = []
            for qid, q in by_id.items():
                needed = question_fragments[qid] & pending
                unseen = needed - chosen_set
                if not unseen:
                    continue
                cost = sum(estimate(requested[h]) for h in unseen)
                if len(chosen_set) + len(unseen) > MAX_NEW_ORIGINALS_PER_WAVE:
                    continue
                if wave_cost + cost > MAX_ESTIMATED_CREDITS_PER_WAVE:
                    continue
                shared = sum(len(use[h]) for h in unseen)
                options.append((counts[age[qid]], len(unseen),
                                cost, -shared, qid, unseen))
            if not options:
                break
            _, _, cost, _, qid, add = min(options)
            for h in sorted(add):
                chosen_set.add(h)
                chosen.append(h)
            wave_cost += cost
            counts[age[qid]] += 1
            if len(chosen_set) >= MAX_NEW_ORIGINALS_PER_WAVE:
                break
        # Pack spare capacity with highly reused exact originals; no unsourced
        # filler and no duplicate payment in any wave.
        for h in sorted(pending - chosen_set,
                        key=lambda key:(-len(use[key]), estimate(requested[key]), key)):
            price = estimate(requested[h])
            if len(chosen_set) >= MAX_NEW_ORIGINALS_PER_WAVE:
                break
            if wave_cost + price <= MAX_ESTIMATED_CREDITS_PER_WAVE:
                chosen_set.add(h)
                chosen.append(h)
                wave_cost += price
        guard(bool(chosen) and len(chosen) == len(chosen_set),
              "no budget-fitting progress or same original twice in wave")
        guard(wave_cost <= MAX_ESTIMATED_CREDITS_PER_WAVE + 0.0001,
              "estimated wave exceeds stated safety cap")
        pending -= chosen_set
        waves.append({
            "wave":len(waves)+1,
            "exactTexts": [
                {"text":requested[h], "textSHA256":h,
                 "usedBy":sorted(use[h]),
                 "ageBands":sorted({age[qid] for qid in use[h]}),
                 "estimatedCreditsNotInvoice":round(estimate(requested[h]),2)}
                for h in chosen
            ],
            "uniqueOriginals":len(chosen),
            "estimatedCreditsNotInvoice":round(wave_cost,2),
            "requiresFreshSourceLedgerAudit":True,
            "requiresExplicitCreditAuthorization":True,
            "userVoiceAndClassicalArabicPronunciationListeningApprovalPending":True,
            "publicReleaseAllowed":False,
        })
        guard(len(waves) <= 200,
              "unreasonably many recording waves")
    guard(len({x["textSHA256"] for w in waves for x in w["exactTexts"]}) == len(requested),
          "planned segments missing or repeated")
    return {
        "schemaVersion":1,
        "scope":"TAWHID_KIDS_SELECTED450_NO_CREDIT_FULL_V4_RECORDING_QUEUE",
        "modelId":MODEL, "voiceId":VOICE, "languageInstruction":
            "German explanatory speech; established Arabic expressions pronounced in correct Arabic fusha. No auto-approved pronunciation.",
        "selectedQuizQuestions":450,
        "ageCounts":{"4-6":150,"7-8":150,"9-10":150},
        "savedOriginalDirectTextCount":len(reg["textClips"]),
        "previouslyPaidUnrecoveredOriginals":len(original_nine),
        "connectedFlowOriginalsUnimportedNoRepurchase":len(flow_pending),
        "uncertainAlreadyAttemptedSourceSHA256NeverRebuy":sorted(uncertain),
        "connectedFlowOriginalTextsAwaitingImport":sorted(flow_pending),
        "trulyUnrecordedDistinctTextCount":len(requested),
        "trulyUnrecordedCodepoints":sum(len(x) for x in requested.values()),
        "recordingWaveCount":len(waves),
        "originalsPerWaveMaximum":MAX_NEW_ORIGINALS_PER_WAVE,
        "estimatedCreditsPerWaveMaximum":MAX_ESTIMATED_CREDITS_PER_WAVE,
        "estimatedTotalCreditsNotProviderBill":round(sum(estimate(x) for x in requested.values()),2),
        "estimatedCreditRateNotProviderBill":ESTIMATE_CREDITS_PER_CODEPOINT,
        "recordingWaves":waves,
        "newElevenLabsCreditsSpentByPlanner":0,
        "humanListeningApproved":False,
        "newAudioGenerationAuthorizedByPlanner":False,
        "publicQuizReleaseEnabled":False,
        "sourceQuestionsOrExistingAudioModified":False,
        "historicalNineOriginalsMayNotBeRegenerated":True,
        "note":"The recording schedule is private and provisional. Every later paid batch must recheck the actual latest saved MP3 SHA, source, credit limit and billing journal. This file alone cannot buy credits or run TTS.",
    }


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out",type=Path,default=OUT)
    args=ap.parse_args()
    doc=build()
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(doc,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({k:doc[k] for k in
      ("selectedQuizQuestions","trulyUnrecordedDistinctTextCount",
       "trulyUnrecordedCodepoints","recordingWaveCount",
       "estimatedTotalCreditsNotProviderBill","newElevenLabsCreditsSpentByPlanner")},
       ensure_ascii=False))


if __name__=="__main__":
    main()
