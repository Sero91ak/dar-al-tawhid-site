#!/usr/bin/env python3
"""Zero-credit READY-to-produce plan for the next 100 UNIQUE real MP3 originals.

No generation, no credit purchase, no question rewrites and no public release.
Reuses exactly the owner's de-DE 10,099-rule master PLS and existing eleven_v4
voice, and never lists historical/prepaid/uncertain takes as new purchases.
A 100-original plan is split into bounded waves to retain per-POST backup.
"""
from __future__ import annotations

import collections
import hashlib
import json
import math
import re
from pathlib import Path

from quiz_v4_no_double_charge_guard import protect_paid_texts

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
DICT_REPORT=ROOT/"kids/review-only/quiz-v4-all450-master-dictionary-coverage.json"
OUT=ROOT/"kids/review-only/quiz-v4-next100-master-dictionary-safe-plan.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
RATE=0.969066
MAX_PER_WAVE=850.0
MAX_IN_PLAN=100
PARTS=("question","correct","retry","explanation")
ARABIC=re.compile(r"[\u0621-\u064A]|ﷺ")
LATIN=re.compile(r"[a-zA-ZÀ-ÿ]")
TERM=re.compile(r"[\wʾʿĀāĪīŪūḤḥḌḍṢṣṬṭẒẓṮṯḎḏǦǧŠšĠġ-]+",re.UNICODE)
TRANS=re.compile(r"[ʾʿāĀīĪūŪḥḤḍḌṣṢṭṬẓẒṯṮḏḎǧǦšŠġĠ]")

def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    plan=read(PLAN)
    reg=read(REG)
    ledger=read(LEDGER)
    journal=read(JOURNAL)
    hold=read(HOLD)
    dictionary=read(DICT_REPORT)
    release=read(RELEASE)
    if (len(plan.get("recipes",[]))!=450 or len({r["questionId"] for r in plan["recipes"]})!=450
        or plan.get("voiceId")!=VOICE or plan.get("modelId")!=MODEL
        or release["enabled"] is not False):
        raise RuntimeError("KIDS 450 selected source or release changed")
    if (dictionary.get("selectedQuestions")!=450
        or dictionary.get("dictionaryRuleCount")!=10099
        or dictionary.get("voiceId")!=VOICE):
        raise RuntimeError("Required 450/10099-rule dictionary audit is not current")
    if (hold["dictionaryProviderVerified"] is not True
        or hold["dictionaryRuleCount"]!=10099
        or hold["humanListeningQualityGateReleased"] is not False):
        raise RuntimeError("Unexpected producer safety state, do not plan paid originals")
    protected=protect_paid_texts(ROOT,reg,ledger)
    blocked_hashes={j["textSHA256"] for j in journal["entries"]}
    if len(blocked_hashes)!=len(journal["entries"]):
        raise RuntimeError("Duplicated provider request already exists; block")
    unresolved={x["term"].casefold() for x in dictionary["unmatchedTransliterationTokens"]}
    if len(unresolved)!=20:
        raise RuntimeError("Arabic terminology risk list changed; re-audit before charging")
    recipes=plan["recipes"]
    eligible=collections.defaultdict(set)
    context={}
    affected=collections.defaultdict(set)
    excluded=collections.Counter()
    for recipe in recipes:
        id=recipe["questionId"]
        age=recipe["ageBand"]
        for kind in PARTS:
            part=recipe[kind]
            for spoken in part.get("segments") or [part["text"]]:
                if spoken in reg["textClips"] or spoken in protected:
                    excluded["savedOrReservedOriginal"]+=1
                    continue
                if sha(spoken) in blocked_hashes:
                    excluded["previousPaidAttemptIncludingUncertain"]+=1
                    continue
                if not isinstance(spoken,str) or not spoken or spoken.strip()!=spoken:
                    excluded["invalidExactSourceText"]+=1
                    continue
                if ARABIC.search(spoken):
                    excluded["ArabicNeedsSeparateFuṣḥāComposition"]+=1
                    continue
                unlisted={m.group(0).casefold() for m in TERM.finditer(spoken)
                          if TRANS.search(m.group(0)) and m.group(0).casefold() in unresolved}
                if unlisted:
                    excluded["uncoveredAussprachewoerterbuchTerms"]+=1
                    continue
                eligible[spoken].add(id)
                affected[id].add(spoken)
                context.setdefault(spoken,{"questionId":id,"part":kind,"ageBand":age})
    if not eligible:
        raise RuntimeError("No dictionary-ready eligible source phrases remain")
    candidates=[]
    for spoken,qids in eligible.items():
        cost=round(len(spoken)*RATE,2)
        if not 0<cost<=MAX_PER_WAVE:
            excluded["tooLongForSingle850CreditWave"]+=1
            continue
        # First finish near-complete questions, then prioritize reuse across
        # questions. The approved source and word-for-word phrases do not move.
        benefit=sum(1/(len(affected[qid]) or 1) for qid in qids)
        score=round(benefit*10000/(cost+18),8)
        candidates.append({
            "spokenText":spoken,
            "sourceTextSHA256":sha(spoken),
            "referencedQuestionIDs":sorted(qids),
            "firstUse":context[spoken],
            "useCount":len(qids),
            "estimatedCreditsNotInvoice":cost,
            "priorityScore":score,
            "voiceId":VOICE,"modelId":MODEL,
            "pronunciationDictionaryId":hold["dictionaryId"],
            "pronunciationDictionaryVersionId":hold["dictionaryVersionId"],
            "pronunciationDictionaryRules":10099,
            "sourceTextRewritten":False,
            "previousPaidSource":False,
            "humanListeningApproved":False
        })
    candidates.sort(key=lambda x:(-x["priorityScore"],-x["useCount"],x["estimatedCreditsNotInvoice"],x["spokenText"]))
    selected=candidates[:MAX_IN_PLAN]
    if len({x["sourceTextSHA256"] for x in selected})!=len(selected):
        raise RuntimeError("Duplicate new-original SHA selected")
    if any(x["spokenText"] in reg["textClips"] or x["spokenText"] in protected
           or x["sourceTextSHA256"] in blocked_hashes for x in selected):
        raise RuntimeError("Previously paid, reserved or uncertain text entered candidate plan")
    waves=[]
    for original in selected:
        if not waves or len(waves[-1]["items"])>=10 or waves[-1]["estimatedCreditsNotInvoice"]+original["estimatedCreditsNotInvoice"]>MAX_PER_WAVE:
            waves.append({"number":len(waves)+1,"items":[],"estimatedCreditsNotInvoice":0})
        waves[-1]["items"].append(original)
        waves[-1]["estimatedCreditsNotInvoice"]=round(waves[-1]["estimatedCreditsNotInvoice"]+original["estimatedCreditsNotInvoice"],2)
    for wave in waves:
        wave["newExactOriginalCount"]=len(wave["items"])
        wave["exactTextSHA256"]=[r["sourceTextSHA256"] for r in wave["items"]]
        wave["waveFingerprintSHA256"]=sha("\n".join(wave["exactTextSHA256"]))
        if wave["estimatedCreditsNotInvoice"]>MAX_PER_WAVE or wave["newExactOriginalCount"]>10:
            raise RuntimeError("Wave cost cap violated")
    result={
        "schemaVersion":1,
        "scope":"TAWHID_KIDS_V4_NEXT100_SOURCE_EXACT_10099_RULE_LEXICON_PLAN",
        "basedOnOriginalRegistrySHA256":hashlib.sha256(REG.read_bytes()).hexdigest(),
        "basedOnPaidLedgerSHA256":hashlib.sha256(LEDGER.read_bytes()).hexdigest(),
        "basedOnLatestOwnerPronunciationHoldSHA256":hashlib.sha256(HOLD.read_bytes()).hexdigest(),
        "existingOriginalsAccountedFor":len(reg["textClips"]),
        "protectedPaidOrReservedSourceCount":len(protected),
        "selected450QuestionCount":450,
        "sourceTextImmutable":True,
        "modelId":MODEL,"voiceId":VOICE,
        "dictionaryId":hold["dictionaryId"],"dictionaryVersionId":hold["dictionaryVersionId"],
        "dictionaryRuleCount":10099,
        "newOriginalsPrepared":len(selected),
        "nextActualPaidOriginalsMustNotBeGeneratedWithoutQualityGate":hold["humanListeningQualityGateReleased"] is False,
        "newOriginalsStillWaitingForHumanHearingQA":True,
        "readyToBillAutomatically":False,
        "waves":waves,
        "excludedSourceAssignmentsByReason":dict(excluded),
        "newElevenLabsCallsMade":0,
        "newElevenLabsCreditsSpent":0,
        "approximateTotalCreditsNotInvoice":round(sum(x["estimatedCreditsNotInvoice"] for x in selected),2),
        "publicReleaseEnabled":False,
        "originalQuizContentModified":False
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_450_NEXT100_DICTIONARY_SAFE_ZERO_CREDIT_PLAN "+json.dumps({
        "newOriginalsPrepared":len(selected),"waveCount":len(waves),
        "estimatedCredits":result["approximateTotalCreditsNotInvoice"],
        "excludedSourceAssignmentsByReason":dict(excluded),
        "newSpentCredits":0,"publicReleaseEnabled":False},ensure_ascii=False))


if __name__=="__main__":
    main()
