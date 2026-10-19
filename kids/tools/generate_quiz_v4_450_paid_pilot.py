#!/usr/bin/env python3
"""FIRST 2 paid ORIGINAL Eleven V4 MP3s directly saved to GitHub review branch.

This explicitly costs an estimated <= 120 credits. Exactly one take per unique
text, never regenerate an existing paid flow or saved MP3. No retries after a
POST failure/unknown outcome. GitHub Actions preserves outputs in artifacts if
the git push encounters a conflict. This script NEVER publishes live audio.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,sys,urllib.error,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
READY=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
CREDIT_RATE=0.969066
BUDGET=120
MAX_OUTPUT=2
MAX_CHAR=75

def read(path,default):
    if not path.exists():return default
    return json.loads(path.read_text(encoding="utf-8"))

def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def get_balance(key):
    req=urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",
        headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
    with urllib.request.urlopen(req,timeout=25) as resp:
        data=json.loads(resp.read().decode("utf-8"))
    return float(data["character_limit"])-float(data["character_count"])

def select_tasks(plan,registry,protected):
    saved=registry.get("textClips") or {}
    available=[v for v in plan["pendingAudioFragments"] if v["text"] not in saved and v["text"] not in protected]
    intro=next((x for x in available if x["text"]=="Das merken wir uns:"),None)
    # First individual, actually selected non-recorded young children's quiz question.
    young={q["questionId"] for q in plan["recipes"] if q["ageBand"]=="4-6"}
    question=next((x for x in available if x["text"].endswith("?") and
         23<=len(x["text"])<=MAX_CHAR and
         any(id in young for id in x["usedBy"])),None)
    picked=[x for x in (intro,question) if x is not None]
    if len(picked)!=2 or len({t["text"] for t in picked})!=2:
        raise RuntimeError("Expected 2 distinct missing V4 clips, including explanation opening")
    if sum(len(x["text"])*CREDIT_RATE for x in picked)>BUDGET:
        raise RuntimeError("Planned pilot would exceed strict 120-credit estimate cap")
    return picked

# Historical pilot now uses the same canonical owner-master V4 API request,
# with the real 10,099-rule dictionary and native Fuṣḥā safeguards.
# Its old dictionary-free HTTP POST is permanently disabled.
from generate_quiz_v4_450_paid_batch02 import original_mp3 as _canonical_v4_original_mp3

def request_audio(key,text):
    return _canonical_v4_original_mp3(key,text)

def main():
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("Missing ElevenLabs API credential")
    readiness=read(READY,{})
    if not readiness.get("safeToTryOneDirectV4Original") or readiness.get("voiceId")!=VOICE:
        raise RuntimeError("Do not spend credits: V4 direct read-only capability probe must PASS first")
    config=read(ROOT/"kids/data/quiz-curation-release.json",{})
    if config.get("enabled") is not False:
        raise RuntimeError("Pilot demands public 450 release remain disabled")
    plan=read(PLAN,{})
    if len(plan.get("recipes",[]))!=450 or plan.get("modelId")!=MODEL or plan.get("voiceId")!=VOICE:
        raise RuntimeError("450 question curated plan missing or wrong model/speaker")
    registry=read(REGISTRY,{"schemaVersion":1,"scope":"KIDS_V4_450_REVIEW_ONLY",
            "voiceId":VOICE,"modelId":MODEL,"live":False,"textClips":{}})
    ledger=read(LEDGER,{"schemaVersion":1,"scope":"CURATED_450_V4_PAID_LEDGER",
                       "containsCredentials":False,"live":False,"rows":[]})
    if registry.get("live") is not False or ledger.get("live") is not False:
        raise RuntimeError("Refuse original audio upload if LIVE flag enabled")
    if len(ledger.get("rows",[]))>=2:
        print("KIDS_V4_PILOT_ALREADY_GENERATED: do not charge again",flush=True)
        return
    if len(ledger.get("rows",[]))>0:
        raise RuntimeError("Partially paid pilot detected. Reconcile original assets before any new paid call")
    protected=protect_paid_texts(ROOT,registry,ledger)
    choices=select_tasks(plan,registry,protected)
    # Check budget before making any paid call.
    required=sum(len(x["text"])*CREDIT_RATE for x in choices)
    balance=get_balance(key)
    if balance<max(BUDGET*1.15,required*1.2):
        raise RuntimeError("Not enough subscription balance for bounded pilot, no synthesis performed")
    print(f"KIDS_V4_PAID_PILOT_CAP estimated_credits={required:.2f} allowed_max={BUDGET} clips={len(choices)}",flush=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for entry in choices:
        text=entry["text"]
        prohibit_prepaid_selection(text,protected)
        if text in registry["textClips"]:
            raise RuntimeError("Duplicate clip found before paid call; no synthesis")
        h=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        out=OUTPUT/(h[:32]+".mp3")
        if out.exists():
            raise RuntimeError("Audio file already exists without registered exact text; STOP, never duplicate")
        audio,request_id=request_audio(key,text)
        out.write_bytes(audio)
        actual=hashlib.sha256(audio).hexdigest()
        item={
          "url":"/"+str(out.relative_to(ROOT)),
          "textSha256":hashlib.sha256(text.encode("utf-8")).hexdigest(),
          "sha256":actual,"bytes":len(audio),
          "modelId":MODEL,"voiceId":VOICE,
          "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
          "source":"official-direct-v4-text-to-speech-api",
          "status":"completed-original-mp3-on-review-branch-not-live",
          "providerRequestId":request_id,
        }
        registry["textClips"][text]=item
        ledger["rows"].append({
          "text":text,"textSha256":item["textSha256"],
          "estimatedCreditsAtObservedRate":round(len(text)*CREDIT_RATE,4),
          "exactBilledCredits":None,"mp3Sha256":actual,
          "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
          "note":"Charged by provider; exact charges unknown until billing reconciliation"
        })
        # Persist on disk immediately after each successful paid call so an
        # upload-artifact step can always retrieve the already-paid original.
        save(REGISTRY,registry)
        save(LEDGER,ledger)
        print("PAID_V4_ORIGINAL_MP3_ON_RUNNER "+json.dumps({
          "textSha256":item["textSha256"],"audioSha256":actual,
          "bytes":len(audio),"model":MODEL,"voice":VOICE,
          "qaPending":True,"live":False}),flush=True)
    print("PAID_V4_PILOT_ORIGINALS_SAVED_TO_DISK "+str(len(choices)),flush=True)

if __name__=="__main__":
    main()
