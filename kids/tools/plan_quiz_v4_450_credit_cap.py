#!/usr/bin/env python3
"""Cost-capped ZERO-SYNTHESIS V4 queue for 450 curated TAWḤĪD KIDS questions.

Builds an exact reuse/dependency plan from canonical records and 374 existing
full-text fragments. The 9 already-paid missing ElevenLabs originals are
PROJECTED as restored only, NEVER substituted or billed again. Cost figures
use observed historical estimate (not a binding ElevenLabs quote).
Generates review-only reports; no voice API calls, charges, or live changes.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"kids/data"
PLAN=DATA/"quiz-v4-curated-450-production-review.json"
REG=DATA/"quiz-v4-450-original-clip-registry.json"
MISSING_NINE=DATA/"quiz-v4-missing9-prepaid-originals.json"
LEDGER=DATA/"quiz-v4-450-paid-generation-ledger.json"
FLAG=DATA/"quiz-curation-release.json"
REPORT=ROOT/".github/reports/kids-v4-450-credit-cap-priority-review.json"
BUDGET_CREDITS=27860.0
BANDS=("4-6","7-8","9-10")
PARTS=("question","correct","retry","explanation")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"


def load(p):return json.loads(p.read_text(encoding="utf-8"))
def require(condition,message):
    if not condition:raise RuntimeError("CREDIT_CAP_REVIEW_BLOCKED: "+message)
def digest(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main():
    plan,reg,nine,ledger,flag=map(load,(PLAN,REG,MISSING_NINE,LEDGER,FLAG))
    require(flag["enabled"] is False,"live release is ON")
    require(flag["curatedQuestions"]==450 and flag["reserveQuestions"]==450,
            "450+450 original quiz source was modified")
    require(len(plan["recipes"])==450,"selected 450 question contract missing")
    require(plan["voiceId"]==VOICE and plan["modelId"]==MODEL,
            "unexpected ElevenLabs master voice/model")
    require(reg["voiceId"]==VOICE and reg["modelId"]==MODEL and reg["live"] is False,
            "original V4 registry corrupted or public")
    require(nine.get("missingOriginalCount")==9 and len(nine.get("items",[]))==9,
            "cannot assume recovery of unknown paid originals")
    paid_missing={item["generationId"]:item["originalSpokenText"] for item in nine["items"]}
    require(len(paid_missing)==9,"duplicated nine-generation receipt")
    require(all(item.get("newSynthesisAllowed") is False and
                item.get("modelId")==MODEL and item.get("voiceId")==VOICE
                for item in nine["items"]),
            "old paid original provenance inconsistent")
    have=set(reg["textClips"])
    paid_have=set(reg["generationClips"])
    still_missing_paid=set(paid_missing)-paid_have
    # The list names the original nine paid receipts; partial recovery is
    # welcome, and no previously purchased take is ever budgeted twice.
    # Estimate ONLY: historical per-character ratio, not a provider price.
    rows=[x for x in ledger.get("rows",[]) if isinstance(x.get("estimatedCreditsAtObservedRate"),(int,float))
          and isinstance(x.get("text"),str) and x["text"]]
    require(len(rows)>=10,"not enough historical expense estimates to cross-check")
    rates=sorted(x["estimatedCreditsAtObservedRate"]/len(x["text"]) for x in rows)
    rate=rates[len(rates)//2]
    require(0.5<rate<2.0,"implausible historical V4 credit estimate ratio")
    if any(abs(x["estimatedCreditsAtObservedRate"]/len(x["text"])-rate)>0.015 for x in rows):
        raise RuntimeError("Historical V4 credit ratios are inconsistent; do not forecast spending")
    require(rate*10_000 > BUDGET_CREDITS/6,"credit rate looks implausibly low")

    selected_by_age={band:[] for band in BANDS}
    references={}
    all_unpaid={}
    for q in plan["recipes"]:
        band=q["ageBand"]
        require(band in BANDS,"unsupported age band")
        need=set()
        for kind in PARTS:
            part=q[kind]
            if part["mode"]=="existing-paid-exact":
                gid=part["generationId"]
                require(gid in paid_have or gid in paid_missing,
                        "unknown unpaid full-take ID: "+gid)
            elif part["mode"]=="compose-from-segments":
                segments=part["segments"]
                require(bool(segments) and " ".join(segments)==part["text"],
                        "spoken-text fragments changed for "+q["questionId"])
                for phrase in segments:
                    if phrase not in have and phrase not in paid_missing.values():
                        need.add(phrase)
                        references.setdefault(phrase,[]).append({
                            "questionId":q["questionId"],"ageBand":band,"part":kind})
            else:
                raise RuntimeError("Unknown original V4 speech mode")
        selected_by_age[band].append({"questionId":q["questionId"],"need":need})
        all_unpaid.update({t:len(t) for t in need})
    require(all(len(q)==150 for q in selected_by_age.values()),
            "expected 150 selected quiz questions per age band")
    require(len(all_unpaid)>1000,"unexpected amount of missing fragments")

    # Greedy marginal-cost ranking. Favor the age band with fewer completed
    # questions to protect balanced pedagogy, while reusing every selected
    # word segment across ALL ages and questions.
    chosen=set()
    previously_complete={}
    preexisting_done=set()
    for band in BANDS:
        previously_complete[band]=sum(not item["need"] for item in selected_by_age[band])
        preexisting_done.update(q["questionId"] for q in selected_by_age[band] if not q["need"])
    completed={band:0 for band in BANDS}
    selected_questions=[]
    consumed_chars=0
    while True:
        options=[]
        min_current=min(previously_complete[b]+completed[b] for b in ("7-8","9-10"))
        for band in ("7-8","9-10"):
            for q in selected_by_age[band]:
                if q["questionId"] in selected_questions or q["questionId"] in preexisting_done:continue
                additional=[text for text in q["need"] if text not in chosen]
                cost_chars=sum(len(t) for t in additional)
                if round((consumed_chars+cost_chars)*rate,4)>BUDGET_CREDITS:
                    continue
                # Balance with a small penalty, never erase true cost ranking.
                imbalance=(previously_complete[band]+completed[band])-min_current
                score=cost_chars+max(0,imbalance)*4
                options.append((score,cost_chars,band,q["questionId"],additional))
        if not options:break
        options.sort(key=lambda row:(row[0],row[1],row[2],row[3]))
        _,cost_chars,band,qid,fragments=options[0]
        chosen.update(fragments)
        consumed_chars+=cost_chars
        completed[band]+=1
        selected_questions.append(qid)

    def evaluate_alternate_balance(penalty):
        """Deterministic scenario only, not a new generation or provider quote."""
        sim_chosen=set()
        sim_completed={b:0 for b in BANDS}
        sim_done=set(preexisting_done)
        sim_chars=0
        while True:
            choices=[]
            minimum=min(previously_complete[b]+sim_completed[b] for b in ("7-8","9-10"))
            for b in ("7-8","9-10"):
                for item in selected_by_age[b]:
                    if item["questionId"] in sim_done:continue
                    frags=[t for t in item["need"] if t not in sim_chosen]
                    added=sum(map(len,frags))
                    if round((sim_chars+added)*rate,4)>BUDGET_CREDITS:continue
                    gap=previously_complete[b]+sim_completed[b]-minimum
                    choices.append((added+penalty*max(0,gap),added,b,
                                    item["questionId"],frags))
            if not choices:break
            choices.sort(key=lambda z:(z[0],z[1],z[2],z[3]))
            _,nchars,b,qid,frags=choices[0]
            sim_chosen.update(frags)
            sim_done.add(qid)
            sim_chars+=nchars
            sim_completed[b]+=1
        projected={b:previously_complete[b]+sim_completed[b] for b in BANDS}
        return {
            "projectedFourPartQuestions":projected,
            "projectedTotalFourPartQuestions":sum(projected.values()),
            "estimatedCredits":round(sim_chars*rate,2),
            "additionalOriginalSegments":len(sim_chosen),
            "newCharacters":sim_chars,
            "heuristicNotProvenOptimal":True
        }

    alternate_budget_scenarios={
        "maximizeQuestionCountButUnevenAges":evaluate_alternate_balance(0),
        "nearlyEqualOlderAgeCoverage":evaluate_alternate_balance(75)
    }
    for option in alternate_budget_scenarios.values():
        require(option["estimatedCredits"]<=BUDGET_CREDITS,
                "alternative planning scenario exceeded the declared cap")
        require(option["projectedFourPartQuestions"]["4-6"]==150,
                "alternative scenario incorrectly charges for old paid takes")

    # A deterministic owner-approved FULL 450 synthesis still needs source
    # originals for every one of the remaining unique texts.
    total_missing_chars=sum(map(len,all_unpaid))
    queue=[]
    for phrase in sorted(chosen,key=lambda s:(-len(references[s]),len(s),digest(s))):
        queue.append({
            "text":phrase,"textSha256":digest(phrase),
            "characters":len(phrase),
            "estimatedCredits":round(rate*len(phrase),4),
            "usedByFieldAssignments":len(references[phrase]),
            "ageBands":sorted({row["ageBand"] for row in references[phrase]}),
            "requiresSeparateHumanHearingApproval":True
        })
    all_question_ids={b:{x["questionId"] for x in selected_by_age[b]} for b in BANDS}
    require(len(set(selected_questions))==len(selected_questions),"same question in a priority queue twice")
    require(set(selected_questions)<=all_question_ids["7-8"]|all_question_ids["9-10"],
            "first-age question incorrectly billed a second time")
    require(sum(len(t) for t in chosen)==consumed_chars,
            "selected unique fragment cost not deduplicated")
    newly_covered={b:previously_complete[b]+completed[b] for b in BANDS}
    require(newly_covered["4-6"]==150,
            "nine already-paid originals would not finish first age band")
    require(round(consumed_chars*rate,4)<=BUDGET_CREDITS,
            "projected V4 bill exceeds owner credit cap")
    report={
        "schemaVersion":1,
        "app":"TAWḤĪD KIDS",
        "scope":"450_QUIZ_V4_REVIEW_ONLY_27860_CREDIT_CAP_DRY_RUN",
        "live":False,"providerPriceQuote":False,
        "newTTSGenerationsCreated":0,"newElevenLabsCreditsSpent":0,
        "permissionToSynthesizeGrantedByReport":False,
        "canonicalQuizCount":900,"selectedQuestions":450,"reservedQuestionsPreserved":450,
        "modelId":MODEL,"voiceId":VOICE,
        "creditCapTarget":BUDGET_CREDITS,
        "estimatedCreditsPerSourceCharacter":round(rate,6),
        "creditEstimateSource":"Historical V4 ledger estimates; not current provider billing",
        "currentlyMissingPreviouslyPaidOriginals":len(still_missing_paid),
        "missingAlreadyPaidOriginalsCostedAgain":False,
        "firstAgeCompleteOnlyAfterRealNineOriginalImports":bool(still_missing_paid),
        "full450CurrentlyMissingDistinctTextFragments":len(all_unpaid),
        "full450CurrentlyMissingDistinctCharacters":total_missing_chars,
        "full450EstimatedMissingTextCreditsAtHistoricalRate":round(total_missing_chars*rate,2),
        "greedyBudgetSubsetOriginalFragments":len(chosen),
        "greedyBudgetSubsetUniqueCharacters":consumed_chars,
        "notProvenGlobalOptimum":True,
        "estimatedSubsetCredits":round(consumed_chars*rate,2),
        "estimatedUnusedCreditHeadroom":round(BUDGET_CREDITS-consumed_chars*rate,2),
        "questionsProjectedFullyPlayableAfterNineAndBudgetSelectionByAge":newly_covered,
        "additionalOlderAgeQuestionsCoveredByBudgetSelection":completed,
        "totalQuestionsProjectedFullyPlayableAfterPrerequisites":
            sum(newly_covered.values()),
        "additionalBudgetStrategyComparisons":alternate_budget_scenarios,
        "priorityQuestionIds":selected_questions,
        "prioritizedExactNewFragmentsForReview":queue,
        "warnings":[
            "A dry-run is NOT confirmed provider billing or authorization to spend credits",
            "The nine old paid original MP3s must actually be exported and verified before 4-6 completion",
            "Human listening, accent/pronunciation, iOS/Android offline QA and manual release gate are still required",
            "Never synthesize or publish directly from this report"
        ]
    }
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_27860_CAP_DRY_RUN "+json.dumps({
        k:v for k,v in report.items()
        if k not in ("prioritizedExactNewFragmentsForReview","priorityQuestionIds","warnings")
    },ensure_ascii=False),flush=True)


if __name__=="__main__":main()
