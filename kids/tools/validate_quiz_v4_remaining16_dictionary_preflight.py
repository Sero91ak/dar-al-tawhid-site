#!/usr/bin/env python3
"""Zero-cost, fail-closed audit of 15 genuinely new V4 texts plus one uncertain old request.

GitHub Actions execution confirms actual 10,099-rule pinned PLS and original voice.
NEVER sends a request to ElevenLabs or alters live application data.
"""
from __future__ import annotations
import json
import hashlib
from pathlib import Path
from generate_quiz_v4_450_paid_batch02 import (build_canonical_v4_payload,
    source_requires_separate_pronunciation_approval)

ROOT = Path(__file__).resolve().parents[2]
QUEUE=ROOT/"kids/review-only/quiz-v4-16-new-text-dictionary-preflight-20261022.json"
JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
CONNECTED=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
QHOLD=ROOT/"kids/data/quiz-v4-owner-pronunciation-hold-20261021.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def load(p): return json.loads(p.read_text(encoding="utf-8"))
def require(ok,why):
    if not ok: raise RuntimeError("V4_PREFLIGHT_STOP: "+why)

def main():
    q,r,p,h,led,qh,journal=map(load,(QUEUE,REG,PLAN,HOLD,CONNECTED,QHOLD,JOURNAL))
    require(q.get("newTextCount")==15 and len(q.get("items") or [])==15,"exact 15 never-recorded candidates")
    require(q.get("newSpeechCreditsAllowed")==0 and q.get("publicReleaseAllowed") is False,"review only")
    require(q.get("masterVoiceId")==VOICE and q.get("modelId")==MODEL and q.get("languageCode")=="de","wrong speaker or language")
    require(q.get("dictionaryId")=="Q8w3SxtoVo8NSjsnlJEd"
            and q.get("dictionaryVersionId")=="wSzgkGpAwEDiTak8DApc","wrong dictionary version")
    require(r.get("voiceId")==VOICE and r.get("modelId")==MODEL and r.get("live") is False,"original registry changed")
    require(h.get("productionPaused") is True and h.get("paidSpeechAuthorized") is False,
            "do not authorize new credits without owner hearing")
    require(p.get("voiceId")==VOICE and p.get("modelId")==MODEL and len(p.get("recipes") or [])==450,
            "original selected 450 changed")
    reserved={x["sourceText"] for x in led["entries"]
              if x["status"]=="RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED"}
    blocked={x["sourceText"] for x in qh["originals"]}
    blocked.update(x["sourceText"] for x in led["entries"] if x.get("blockedForQuizPlayback"))
    original=set(r.get("textClips") or {})
    uncertain=q.get("previouslyAttemptedExcludedFromNewTTS") or {}
    unsafe_sha=uncertain.get("sourceTextSHA256")
    require(uncertain.get("questionId")=="kids-quiz-080" and uncertain.get("allowNewSynthesis") is False
            and uncertain.get("chargeReconciled") is False, "uncertain 080 provider request must stay held")
    require(hashlib.sha256(uncertain.get("text","").encode("utf-8")).hexdigest()==unsafe_sha,
            "uncertain request exact text SHA changed")
    require(any(e.get("textSHA256")==unsafe_sha and e.get("status")=="REQUEST_STARTED_UNCONFIRMED"
                for e in journal.get("entries", [])), "uncertain paid request missing from provider journal")
    seen=set()
    at_risk=[]
    for x in q["items"]:
        text=x["text"]
        require(text not in seen,"candidate repeated")
        seen.add(text)
        if source_requires_separate_pronunciation_approval(text):
            at_risk.append({'sourceText':text,'usedBy':x['usedBy'],
                            'reason':'REQUIRES_ARABIC_FUSHA_PHONETIC_REVIEW_BEFORE_ANY_PAID_TTS'})
        require(text not in original and text not in reserved and text not in blocked
                and hashlib.sha256(text.encode("utf-8")).hexdigest()!=unsafe_sha,
                "already paid, reserved or pronunciation-rejected candidate")
        require(len(x.get("usedBy") or [])>=1,"missing exact question reference")
        for used in x["usedBy"]:
            source=next((z for z in p["recipes"] if z["questionId"]==used["questionId"]),None)
            require(source is not None and used["part"] in ("question","correct","retry","explanation"),
                    "source question/part invalid")
            require(text in source[used["part"]]["text"],"text not in canonical question audio")
        # This pinned production function validates the actual 10,099-rule
        # Git-blob SHA and the exact dictionary provider locators. No HTTP.
        payload=build_canonical_v4_payload(text,language="de")
        require(payload["model_id"]==MODEL and payload["language_code"]=="de",
                "wrong V4 model/language")
        dictionary=payload["pronunciation_dictionary_locators"]
        require(len(dictionary)==1 and dictionary[0]["pronunciation_dictionary_id"]==q["dictionaryId"]
                and dictionary[0]["version_id"]==q["dictionaryVersionId"],
                "dictionary not actually attached to payload")
    require(sum(len(x["text"]) for x in q["items"])==q["newCharacters"],
            "new text character count drift")
    # A valid dictionary locator alone never proves any pronunciation. All
    # 15 currently awaiting speech are mixed with Qur'an/Arabic terms that
    # the paid-production path deliberately blocks, EVEN IF owner consent
    # eventually releases the global halt. Audit this second gate explicitly.
    require(len(at_risk)==15,"the source phonetic-risk profile changed; re-audit before charging")
    report={'schemaVersion':1,'scope':'KIDS_450_LAST_15_PRONUNCIATION_RISK',
            'modelId':MODEL,'voiceId':VOICE,'dictionaryId':q['dictionaryId'],
            'dictionaryVersionId':q['dictionaryVersionId'],
            'uniqueNewTextCount':len(q['items']),
            'phoneticApprovalRequiredCount':len(at_risk),
            'dictionaryVersionCheckPassed':True,
            'thisDoesNotAuthorizePaidSpeech':True,
            'allTextsProductionBlockedUntilPhoneticReview':True,
            'ownerPronunciationApproved':False,
            'newElevenLabsRequests':0,'publicReleaseAllowed':False,
            'items':at_risk}
    output=ROOT/"kids/review-only/quiz-v4-15-arabic-phonetic-risks-dryrun-report.json"
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    print("KIDS_V4_REMAINING_15_PREFLIGHT_PASS: 15 truly new texts are non-duplicate;",
          "ALL 15 currently have Arabic/Quran phonetic production risks;",
          "the 10,099-rule dictionary locator alone is NOT pronunciation approval;",
          "080 prior request remains held. ZERO TTS CREDITS; NO LIVE RELEASE.")

if __name__ == "__main__":
    main()
