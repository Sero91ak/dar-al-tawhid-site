#!/usr/bin/env python3
"""KIDS 150 questions (age 4–6): cash-aware, original-only V4 direct-MP3 builder.

Safeguards: no paid generation in --audit; avoid 56 earlier Flow takes;
do not regenerate existing imported files; restore source-text identity; save
every audio and ledger immediately; stop if API result is uncertain; original
voice eleven_v4 only. Requires QA before any publication, releases nothing.
"""
from __future__ import annotations
import argparse,hashlib,json,os,re,subprocess,sys,time,urllib.error,urllib.request
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
CATALOG=ROOT/"kids/data/quiz-kids-curated-450-review.json"
ARCHIVE=ROOT/"kids/data/quiz-kids-expansion-reserve-450.json"
READY=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
QA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
RATE=0.969066
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
MAX_CREDITS_WAVE=1800.0
MAX_CREDITS_NEW_AGE=14000.0
MAX_CHARS_ONE=500
BAND="4-6"
FIELDS=("question","correct","retry","explanation")

def load(path,default=None):
    if not path.exists():return {} if default is None else default
    return json.loads(path.read_text(encoding="utf-8"))

def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+".tmp")
    temp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    temp.replace(path)

def hexsha(t):return hashlib.sha256(t.encode("utf-8")).hexdigest()

def validate():
    cat=load(CATALOG).get("items") or []
    reserved=load(ARCHIVE).get("items") or []
    plan=load(PLAN)
    if len(cat)!=450 or len(reserved)!=450:raise RuntimeError("450 selected / 450 reserve not saved")
    if Counter(x["ageBand"] for x in cat)!=Counter({"4-6":150,"7-8":150,"9-10":150}):
        raise RuntimeError("Selection lost exactly 150 per age")
    if len(plan.get("recipes",[]))!=450 or plan.get("voiceId")!=VOICE or plan.get("modelId")!=MODEL:
        raise RuntimeError("450 speech contract damaged")
    if load(FLAG).get("enabled") is not False:
        raise RuntimeError("Cannot synthesize while launch is enabled")
    ready=load(READY)
    if not ready.get("safeToTryOneDirectV4Original"):
        raise RuntimeError("Original voice / model not available via direct ElevenLabs API")
    registry=load(REG,{"schemaVersion":1,"scope":"KIDS_V4_450_REVIEW_ONLY","voiceId":VOICE,
                  "modelId":MODEL,"live":False,"textClips":{}})
    ledger=load(LEDGER,{"schemaVersion":1,"scope":"CURATED_450_V4_PAID_LEDGER",
                  "containsCredentials":False,"live":False,"rows":[]})
    if registry.get("live") is not False or ledger.get("live") is not False:
        raise RuntimeError("Refuse any public launch or external credit spending")
    clips=registry.get("textClips",{})
    lines=ledger.get("rows",[])
    if any(x.get("text") not in clips for x in lines):
        raise RuntimeError("Paid file/ledger discrepancy! Resolve before next charge")
    protected=protect_paid_texts(ROOT,registry,ledger)
    target=[q for q in plan["recipes"] if q["ageBand"]==BAND]
    if len(target)!=150:raise RuntimeError("150 young questions are not present")
    pending_map={x["text"]:x for x in plan["pendingAudioFragments"]}
    required=set()
    old_paid=set()
    for rec in target:
        for k in FIELDS:
            slot=rec[k]
            if slot["mode"]=="existing-paid-exact":
                old_paid.add(slot["generationId"])
            elif slot["mode"]=="compose-from-segments":
                if " ".join(slot["segments"])!=slot["text"]:
                    raise RuntimeError("Concatenation would change the educational text")
                for phrase in slot["segments"]:
                    if phrase not in pending_map:
                        # This exact fragment was already PAID in an earlier
                        # ElevenLabs Flow. Export it later, NEVER re-synthesize.
                        old_paid.add("paid-flow-fragment:"+hexsha(phrase))
                    else:
                        required.add(phrase)
            else:raise RuntimeError("Unknown exact V4 contract mode")
    # No old paid Flow-only takes appear in this new direct-MP3 purchase list.
    unrecorded=required-set(clips)
    for phrase in unrecorded:
        prohibit_prepaid_selection(phrase,protected)
    if any(not clips[x].get("sha256") for x in required&set(clips)):
        raise RuntimeError("Old MP3 output lacks a SHA digest")
    # Verify output exists for existing 4-6 clips; never pay a second time.
    for phrase in required&set(clips):
        entry=clips[phrase]
        url=entry.get("url") or ""
        if not url.startswith("/kids/assets/kids-quiz-audio/") or ".." in url:
            raise RuntimeError("Prior paid source path invalid")
        path=(ROOT/url.lstrip("/")).resolve()
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=entry["sha256"]:
            raise RuntimeError("Prior original MP3 missing/modified. Stop; NEVER pay again")
    age_existing=[x for x in lines if x.get("text") in required]
    age_already_credits=sum(x.get("estimatedCreditsAtObservedRate",0) for x in age_existing)
    balance_chars=sum(len(x) for x in unrecorded)
    return plan,registry,ledger,target,required,unrecorded,old_paid,age_already_credits,balance_chars

def fresh_queue(target,remaining):
    # Wave scheduling: most reusable common text first, then contiguous
    # questions, preserving age progression while never paying duplicate clips.
    uses=Counter()
    for rec in target:
        for kind in FIELDS:
            for t in (rec[kind].get("segments") or []):uses[t]+=1
    common=sorted((s for s in remaining if uses[s]>=4),key=lambda x:(-uses[x],len(x),x))
    wanted=[];seen=set()
    def add(s):
        if s in remaining and s not in seen:
            wanted.append(s);seen.add(s)
    for s in common:add(s)
    for rec in target:
        for kind in ("question","correct","retry","explanation"):
            for s in rec[kind].get("segments") or []:add(s)
    if set(wanted)!=remaining:raise RuntimeError("Not all age 4–6 speech fragments scheduled")
    return wanted

def request_one(key,spoken):
    url=f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128"
    req=urllib.request.Request(url,method="POST",headers={
      "xi-api-key":key,"Accept":"audio/mpeg","Content-Type":"application/json"},
      data=json.dumps({"text":spoken,"model_id":MODEL},ensure_ascii=False).encode("utf-8"))
    # Single POST. Never retry after HTTP failure or uncertain response.
    try:
        with urllib.request.urlopen(req,timeout=110) as resp:
            if resp.status!=200:raise RuntimeError("Provider result unknown after POST, no retry")
            ct=resp.headers.get("Content-Type") or ""
            if not("audio/" in ct or "octet-stream" in ct):
                raise RuntimeError("Provider did not return MP3; no retry")
            data=resp.read(1500000)
            rid=resp.headers.get("request-id") or resp.headers.get("xi-request-id")
    except urllib.error.HTTPError as e:
        raise RuntimeError("Provider response HTTP "+str(e.code)+"; no automatic retry") from None
    if not (1500<len(data)<1500000) or not(data.startswith(b"ID3") or data[:1]==b"\xff"):
        raise RuntimeError("Original MP3 malformed after POST. STOP, never regenerate blindly")
    return data,rid

def subscription(key):
    r=urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",method="GET",
          headers={"xi-api-key":key,"Accept":"application/json"})
    with urllib.request.urlopen(r,timeout=25) as response:
        sub=json.loads(response.read().decode("utf-8"))
    return float(sub["character_limit"])-float(sub["character_count"])

def main():
    ap=argparse.ArgumentParser()
    mode=ap.add_mutually_exclusive_group()
    mode.add_argument("--audit",action="store_true")
    mode.add_argument("--produce",action="store_true")
    ap.add_argument("--limit",type=int,default=25)
    args=ap.parse_args()
    p,registry,ledger,targets,needed,remaining,prior,already,chars=validate()
    ordered=fresh_queue(targets,remaining)
    estimate=sum(len(t)*RATE for t in ordered)
    result={
      "scope":"TAWḤĪD KIDS FIRST 150 AGE 4-6 V4",
      "sourceSelected":150,"othersPreserved":750,
      "modelId":MODEL,"voiceId":VOICE,
      "uniqueVoiceFragmentsNeeded":len(needed),
      "alreadyDirectOriginalsInAge":len(needed)-len(remaining),
      "missingVoiceFragments":len(remaining),
      "missingCharacters":chars,
      "estimateCreditsYetToGenerate":round(estimate,2),
      "estimateCreditsPreviouslyGeneratedForAge":round(already,2),
      "originalPaidFlowGenerationsWithoutImportedMP3":len(prior),
      "status":"AUDIO_REVIEW_ONLY_NO_LIVE",
      "newPaidCallsMadeInAudit":0}
    print("KIDS_150_4_6_V4_AUDIT "+json.dumps(result,ensure_ascii=False),flush=True)
    if not args.produce:return
    # The current 150 young questions have ZERO new V4 originals to buy.
    # Exit before reading credentials, querying the balance or attempting
    # any paid API request. Nine already-paid Flow MP3s must be restored.
    if not ordered:
        print("KIDS_150_4_6_ALREADY_PAID_ONLY: restore old V4 originals; NO new TTS or subscription request",flush=True)
        return
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("API key absent, no synthesis")
    if not 1<=args.limit<=40:raise RuntimeError("Maximum paid chunks per single GitHub wave: 40")
    if estimate+already>MAX_CREDITS_NEW_AGE*1.02:
        raise RuntimeError("Full 4-6 production exceeds fixed spending cap")
    balance=subscription(key)
    if balance<min(MAX_CREDITS_WAVE,estimate)*1.35:
        raise RuntimeError("No available ElevenLabs budget for safe new batch")
    count=0;spent=0
    OUT.mkdir(parents=True,exist_ok=True)
    for phrase in ordered:
        if count>=args.limit:break
        if len(phrase)>MAX_CHARS_ONE:
            raise RuntimeError("Unusually long prompt needs review before spending")
        projected=len(phrase)*RATE
        if spent+projected>MAX_CREDITS_WAVE:
            print(f"KIDS_150_WAVE_CREDIT_CAP remaining_tasks={len(ordered)-count}",flush=True)
            break
        if phrase in registry["textClips"]:
            raise RuntimeError("Original already paid, stop to avoid duplication")
        name=hexsha(VOICE+"\n"+MODEL+"\n"+phrase)[:32]+".mp3"
        path=OUT/name
        if path.exists():
            raise RuntimeError("Unregistered prior MP3 exists; NO second paid call")
        audio,request_id=request_one(key,phrase)
        path.write_bytes(audio)
        digest=hashlib.sha256(audio).hexdigest()
        text_sha=hexsha(phrase)
        registry["textClips"][phrase]={
          "url":"/"+str(path.relative_to(ROOT)),"sha256":digest,"textSha256":text_sha,
          "bytes":len(audio),"modelId":MODEL,"voiceId":VOICE,
          "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
          "source":"official-direct-v4-text-to-speech-api",
          "status":"completed-original-mp3-on-review-branch-not-live",
          "providerRequestId":request_id}
        ledger["rows"].append({
          "batchId":"KIDS_150_4_6_COSTED_CAMPAIGN",
          "text":phrase,"textSha256":text_sha,
          "estimatedCreditsAtObservedRate":round(projected,4),
          "exactBilledCredits":None,"mp3Sha256":digest,
          "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
          "note":"charged direct TTS; exact billing requires separate reconciliation"})
        # Immediately persist recoverable master bytes+ledger to runner filesystem.
        save(REG,registry);save(LEDGER,ledger)
        count+=1;spent+=projected
        print("KIDS_150_NEW_MP3 "+json.dumps({"index":count,"textSha256":text_sha,
          "audioSha256":digest,"bytes":len(audio),"estimatedCredits":round(spent,2)},ensure_ascii=False),flush=True)
        if count<args.limit:time.sleep(.45)
    summary={"segmentCount":count,"estimatedCredits":round(spent,2),
             "alreadyExistingAge":len(needed)-len(remaining),
             "remainingBeforeWave":len(remaining),
             "remainingAfterWave":len(remaining)-count,
             "noLive":True,"voice":VOICE,"model":MODEL,"status":"REVIEW_ONLY"}
    save(ROOT/"kids/data/quiz-v4-first150-last-wave.json",summary)
    print("KIDS_150_WAVE_FINISHED "+json.dumps(summary,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
