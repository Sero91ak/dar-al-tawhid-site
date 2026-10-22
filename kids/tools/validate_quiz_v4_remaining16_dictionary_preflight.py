#!/usr/bin/env python3
"""Zero-cost, fail-closed audit of exactly sixteen never-recorded V4 quiz texts.
NEVER sends a request to ElevenLabs or alters live application data.
"""
from __future__ import annotations
import json
from pathlib import Path
from generate_quiz_v4_450_paid_batch02 import build_canonical_v4_payload

ROOT = Path(__file__).resolve().parents[2]
QUEUE=ROOT/"kids/review-only/quiz-v4-16-new-text-dictionary-preflight-20261022.json"
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
    q,r,p,h,led,qh=map(load,(QUEUE,REG,PLAN,HOLD,CONNECTED,QHOLD))
    require(q.get("newTextCount")==16 and len(q.get("items") or [])==16,"exact 16 candidates")
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
    seen=set()
    for x in q["items"]:
        text=x["text"]
        require(text not in seen,"candidate repeated")
        seen.add(text)
        require(text not in original and text not in reserved and text not in blocked,
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
    print("KIDS_V4_REMAINING_16_PREFLIGHT_PASS: 16 exact non-duplicate texts;",
          "dictionary provider/version, real SHA and owner hold verified;",
          "ZERO TTS CREDITS; NOT PUBLICLY APPROVED.")

if __name__ == "__main__":
    main()
