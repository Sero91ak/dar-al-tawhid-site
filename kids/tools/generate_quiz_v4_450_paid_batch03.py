#!/usr/bin/env python3
"""TAWḤĪD KIDS: third real ORIGINAL V4 audio batch (50 low-cost fragments).

All requests are DIRECT synchronous MP3 downloads; no paid Flow GET needed.
Existing original 2-take pilot MUST pass SHA/codec/signal QA. All original
MP3s and ledger are written immediately and backed up by GitHub artifacts.
NEVER retries a charged/uncertain API call or modifies live quiz manifests.
"""
from __future__ import annotations
import hashlib,json,os,time,urllib.error,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
READY=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
TECHQA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_450_BATCH_03_50"
RATE=0.969066
LIMIT=50
MAX_COST=2600

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def subscription(key):
    req=urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",
       headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
    with urllib.request.urlopen(req,timeout=30) as response:
        obj=json.loads(response.read().decode("utf-8"))
    return float(obj["character_limit"])-float(obj["character_count"])

# NEVER create a separate text-only ElevenLabs HTTP payload here:
# always route through the master lexicon + Fuṣḥā safety + hearing gates.
from generate_quiz_v4_450_paid_batch02 import original_mp3 as _canonical_v4_original_mp3

def original_mp3(key,spoken):
    return _canonical_v4_original_mp3(key,spoken)

def age_for(plan):
    return {r["questionId"]:r["ageBand"] for r in plan["recipes"]}

def choose(plan,registry,protected):
    existing=set((registry.get("textClips") or {}).keys())
    ages=age_for(plan)
    available=[r for r in plan["pendingAudioFragments"] if r["text"] not in existing and r["text"] not in protected]
    if len(available)<LIMIT:raise RuntimeError("Remaining unrecorded fragments below batch size")
    selected=[];seen=set()
    def take(r):
        if len(selected)>=LIMIT:return False
        if r["text"] in seen:return False
        if len(r["text"])*RATE+sum(len(x["text"])*RATE for x in selected)>MAX_COST:return False
        seen.add(r["text"]);selected.append(r)
        return True
    # Repeated fragments should be bought once: use common prefixes first.
    common=[r for r in available if len(r["usedBy"])>=20 and len(r["text"])<=75]
    for r in sorted(common,key=lambda x:(-len(x["usedBy"]),len(x["text"]),x["text"]))[:2]:
        take(r)
    # Six question-bearing fragments per age band, spread across all profiles.
    for age in ("4-6","7-8","9-10"):
        candidates=[r for r in available if r["text"].endswith("?") and 16<=len(r["text"])<=95 and
                    any(ages.get(id)==age for id in r["usedBy"])]
        def question_number(r):
            return min(int(id.rsplit("-",1)[-1]) for id in r["usedBy"] if ages.get(id)==age)
        for r in sorted(candidates,key=lambda x:(question_number(x),len(x["text"]))):
            if sum(1 for x in selected if x["text"] in {z["text"] for z in candidates})>=6:break
            take(r)
    for r in sorted(available,key=lambda x:(-len(x["usedBy"]),len(x["text"]),x["text"])):
        if len(selected)>=LIMIT:break
        if len(r["text"])<=85:take(r)
    if len(selected)!=LIMIT:
        raise RuntimeError("Could not select exactly 20 source-authentic V4 texts inside budget")
    estimate=sum(len(x["text"])*RATE for x in selected)
    if estimate>MAX_COST:raise RuntimeError("Exceeded per-batch 2600 credit estimate cap")
    return selected,estimate

def main():
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("ElevenLabs API key missing")
    if load(ROOT/"kids/data/quiz-curation-release.json").get("enabled") is not False:
        raise RuntimeError("No original V4 batch when public 450 mode enabled prematurely")
    plan=load(PLAN);qa=load(TECHQA);readiness=load(READY)
    if len(plan.get("recipes",[]))!=450 or plan.get("voiceId")!=VOICE or plan.get("modelId")!=MODEL:
        raise RuntimeError("Curated 450 V4 contract changed; stop")
    if not readiness.get("safeToTryOneDirectV4Original"):
        raise RuntimeError("Read-only direct TTS API probe failed, no paid generation")
    if not qa.get("overallTechnicalPass") or qa.get("savedClipCount",0)<22:
        raise RuntimeError("First 22 paid V4 originals must pass hash/codec and sound-level QA first")
    registry=load(REGISTRY);ledger=load(LEDGER)
    if registry.get("live") is not False or ledger.get("live") is not False:
        raise RuntimeError("Registry is not guaranteed REVIEW ONLY")
    old_for_batch=[x for x in ledger.get("rows",[]) if x.get("batchId")==BATCH]
    if len(old_for_batch)>=LIMIT:
        print("V4_450_BATCH03_ALREADY_COMPLETE: zero new charges on repeat",flush=True)
        return
    if old_for_batch:
        raise RuntimeError("Partially charged batch exists. Reconcile exact saved originals first; never retry")
    protected=protect_paid_texts(ROOT,registry,ledger)
    chosen,estimate=choose(plan,registry,protected)
    before=subscription(key)
    if before<max(MAX_COST*1.25,estimate*1.4):
        raise RuntimeError("Subscription budget lower than estimated batch: no charges")
    print(f"V4_450_BATCH03_PLAN clips={len(chosen)} estimated_max={MAX_COST} estimate={estimate:.2f}",flush=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for n,item in enumerate(chosen,1):
        text=item["text"]
        prohibit_prepaid_selection(text,protected)
        if text in registry["textClips"]:
            raise RuntimeError("Original already exists; do not synthesize again")
        code=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        dest=OUTPUT/(code[:32]+".mp3")
        if dest.exists():
            raise RuntimeError("Original bytes exist without ledger. Do NOT synthesize again")
        audio,request_id=original_mp3(key,text)
        dest.write_bytes(audio)
        actual=hashlib.sha256(audio).hexdigest()
        registry["textClips"][text]={
            "url":"/"+str(dest.relative_to(ROOT)),
            "sha256":actual,"textSha256":hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "bytes":len(audio),"modelId":MODEL,"voiceId":VOICE,
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "source":"official-direct-v4-text-to-speech-api",
            "status":"completed-original-mp3-on-review-branch-not-live",
            "providerRequestId":request_id
        }
        ledger["rows"].append({
            "batchId":BATCH,"text":text,"textSha256":registry["textClips"][text]["textSha256"],
            "estimatedCreditsAtObservedRate":round(len(text)*RATE,4),
            "exactBilledCredits":None,"mp3Sha256":actual,
            "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
            "note":"Provider charged for audio; verify exact billing; no blind retries"
        })
        save(REGISTRY,registry);save(LEDGER,ledger)
        print(f"V4_450_BATCH03_ORIGINAL_SAVED locally={n}/{len(chosen)} sha={actual[:16]} size={len(audio)}",flush=True)
        if n<len(chosen):time.sleep(0.65)
    after=subscription(key)
    billing_delta=max(0,before-after)
    stats={"batchId":BATCH,"newOriginalMP3s":len(chosen),
           "estimatedCreditsAtObservedRate":round(estimate,2),
           "observedSubscriptionUsageDelta":round(billing_delta,2),
           "billableExpenseApproximate":True,
           "source":"eleven_v4","savedOnRunner":True,
           "listeningApproved":False,"live":False}
    save(ROOT/"kids/data/quiz-v4-450-batch03-usage.json",stats)
    print("V4_450_BATCH03_SAVED_ALL "+json.dumps(stats,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
