#!/usr/bin/env python3
"""Cost-FREE exact next-20 Eleven V4 original plan across 450 selected KIDS quizzes.

Never generates audio, authorizes purchases, declares audible Fuṣḥā correct
or publishes the visitor app. Uses the actual owner voice, pinned version of
the original 10,099-rule dictionary, saved SHA registry, nine prepaid misses,
Flow reservations and immutable exact source text IDs.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

import generate_quiz_v4_450_paid_batch02 as source
from quiz_v4_no_double_charge_guard import protect_paid_texts

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"kids/review-only/quiz-v4-450-next20-real-original-recording-plan.json"
ARABIC=re.compile(r"[\u0621-\u064A]|ﷺ")
UNLISTED_ISLAMIC=re.compile(
    r"(?i)(?<![\w])(?:bārik|ghībah|muttaqīn|muḥsinīn|ash-sharḥ|schahāda)(?![\w])"
)

def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def build():
    assert json.loads((ROOT/"kids/data/quiz-curation-release.json").read_text())["enabled"] is False
    plan=source.load(source.PLAN)
    registry=source.load(source.REGISTRY)
    ledger=source.load(source.LEDGER)
    hold=source.load(source.PRONUNCIATION_HOLD)
    if len(plan["recipes"])!=450:
        raise RuntimeError("Selected quiz set changed; never bill another original")
    protected=protect_paid_texts(ROOT,registry,ledger)
    originals=registry["textClips"]
    selected,estimated=source.choose(plan,registry,protected)
    safe=[]
    deferred=[]
    for item in selected:
        text=item["text"]
        if ARABIC.search(text):
            deferred.append({"originalTextSha256":digest(text),"reason":"NATIVE_FUSHA_SEGMENTATION_REQUIRED"})
            continue
        if UNLISTED_ISLAMIC.search(text):
            deferred.append({"originalTextSha256":digest(text),"reason":"OWNER_MASTER_LEXICON_HAS_NO_EXACT_ENTRY"})
            continue
        payload=source.build_canonical_v4_payload(text)
        if (payload["model_id"]!="eleven_v4" or payload["language_code"]!="de"
            or len(payload["pronunciation_dictionary_locators"])!=1
            or payload["pronunciation_dictionary_locators"][0]!={"pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
                                                           "version_id":"wSzgkGpAwEDiTak8DApc"}):
            raise RuntimeError("Original Eleven V4 payload lost canonical dictionary")
        safe.append({
            "originalSpeechText":text,
            "originalTextSha256":digest(text),
            "providerSpeechTextSha256":digest(payload["text"]),
            "unchangedVisibleText":True,
            "canonicalOwnerLexiconNormalization":payload["text"]!=text,
            "estimatedCreditsNotAnInvoice":round(len(text)*source.RATE,3),
            "usedByQuestionIds":item["usedBy"],
            "alreadyRecorded":False
        })
    protected_extra=source.load(source.PRONUNCIATION_HOLD)
    if not protected_extra["dictionaryProviderVerified"]:
        raise RuntimeError("Provider master lexicon has not been verified")
    return {
        "schemaVersion":1,
        "scope":"KIDS_V4_450_NEXT20_EXACT_NEW_RECORDING_CANDIDATES_READ_ONLY",
        "masterVoiceId":"DkU7j9uO4ZEtLD2iRZSH",
        "modelId":"eleven_v4",
        "ownerDictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
        "ownerDictionaryVersionId":"wSzgkGpAwEDiTak8DApc",
        "ownerMasterDictionaryRules":10099,
        "selectedQuestions":450,
        "previouslyRecordedOriginals":len(originals),
        "prohibitedPaidOrReservedSpeechTexts":len(protected),
        "nextExistingSelectionSize":len(selected),
        "nextEstimatedCreditsNotInvoice":round(estimated,2),
        "immediatelySynthesisSafeExactNewTexts":safe,
        "deferredArabicOrUnlistedTermOriginals":deferred,
        "humanHearingApprovalStillRequired":not hold["humanListeningQualityGateReleased"],
        "actualPaidRecordingsInThisPlan":0,
        "newElevenLabsCreditsSpent":0,
        "ninePrepaidMustNotBeRepurchased":True,
        "publicReleaseAllowed":False
    }

if __name__=="__main__":
    result=build()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_NEXT20_MASTER_ORIGINALS_COST_FREE "+
        json.dumps({"selected":result["nextExistingSelectionSize"],
                    "safe":len(result["immediatelySynthesisSafeExactNewTexts"]),
                    "deferred":len(result["deferredArabicOrUnlistedTermOriginals"]),
                    "estimatedCreditsNotInvoice":result["nextEstimatedCreditsNotInvoice"],
                    "noNewCredits":True,"noPublicRelease":True},ensure_ascii=False))
