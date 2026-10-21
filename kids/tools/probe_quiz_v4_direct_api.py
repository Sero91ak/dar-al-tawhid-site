#!/usr/bin/env python3
"""Cost-free ElevenLabs readiness probe for saving ORIGINAL V4 directly as MP3.

No POST, no charge, no account identifiers, emails, API tokens or signed URL
saved or logged. This tests whether GitHub's secret can do standard text-to-
speech with the project's actual master voice and V4 model and if enough
subscription balance remains for the selected 450. No released assets.
"""
from __future__ import annotations
import json,os,urllib.error,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUTPUT=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-summary.json"

def get(path,key):
    req=urllib.request.Request("https://api.elevenlabs.io"+path,
          headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
    try:
        with urllib.request.urlopen(req,timeout=20) as resp:
            return resp.status,json.loads(resp.read(3000000).decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code,None
    except Exception:
        return 0,None

def main():
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    if PLAN.is_file():
        planned=json.loads(PLAN.read_text(encoding="utf-8"))
        estimate=float(planned["estimatedAdditionalCredits"])
    else:
        fallback=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
        planned=json.loads(fallback.read_text(encoding="utf-8"))
        estimate=float(planned["creditEstimate"])
    result={
        "scope":"TAWḤĪD KIDS · 450 ORIGINAL ELEVEN V4 READ-ONLY PROBE",
        "date":"2026-10-14","modelId":MODEL,"voiceId":VOICE,
        "apiKeyConfigured":bool(key),
        "requiresOnlyGetRequests":True,"newCreditsCharged":0,
        "voiceEndpointStatus":None,"modelEndpointStatus":None,
        "subscriptionEndpointStatus":None,
        "masterVoiceAccessible":False,"v4SupportsStandardDirectTTS":False,
        "subscriptionBudgetReadSuccessful":False,
        "remainingBudgetAtLeastProjected450":None,
        "projected450Credits":estimate,
        "safeToTryOneDirectV4Original":False,
        "liveAudioReleaseAllowed":False
    }
    if key:
        voice_status,voice=get("/v1/voices/"+VOICE,key)
        model_status,models=get("/v1/models",key)
        sub_status,sub=get("/v1/user/subscription",key)
        result["voiceEndpointStatus"]=voice_status
        result["modelEndpointStatus"]=model_status
        result["subscriptionEndpointStatus"]=sub_status
        result["masterVoiceAccessible"]=(voice_status==200 and
            isinstance(voice,dict) and voice.get("voice_id")==VOICE)
        result["v4SupportsStandardDirectTTS"]=(model_status==200 and
            isinstance(models,list) and any(m.get("model_id")==MODEL and
                                         m.get("can_do_text_to_speech") is True
                                         for m in models if isinstance(m,dict)))
        if sub_status==200 and isinstance(sub,dict):
            count=sub.get("character_count")
            limit=sub.get("character_limit")
            if isinstance(count,(int,float)) and isinstance(limit,(int,float)):
                result["subscriptionBudgetReadSuccessful"]=True
                result["remainingBudgetAtLeastProjected450"]=limit-count>=estimate
        result["safeToTryOneDirectV4Original"]=bool(
            result["masterVoiceAccessible"] and result["v4SupportsStandardDirectTTS"]
        )
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_450_API_READINESS "+json.dumps(result,ensure_ascii=False),flush=True)
    print("NO PAID TTS CALLS MADE; do not infer original MP3 is saved or approved",flush=True)

if __name__=="__main__":main()
