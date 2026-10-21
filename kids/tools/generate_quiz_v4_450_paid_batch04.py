#!/usr/bin/env python3
"""TAWḤĪD KIDS: next 50-original V4 audio batch (50 low-cost fragments).

All requests are DIRECT synchronous MP3 downloads; no paid Flow GET needed.
Existing original 2-take pilot MUST pass SHA/codec/signal QA. All original
MP3s and ledger are written immediately and backed up by GitHub artifacts.
NEVER retries a charged/uncertain API call or modifies live quiz manifests.
"""
from __future__ import annotations
import argparse,hashlib,json,os,time,urllib.error,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection
from quiz_v4_paid50_checkpoint import reserve_batch,record_before_post,record_returned_mp3,JOURNAL

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
READY=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
TECHQA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_450_BATCH_04_50"
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
    """Fill the next 50 exact originals to COMPLETE questions, never re-buy.

    Prioritize smallest cost-to-completion in each older age band and only
    then fill remaining slots with reusable (already missing) short texts.
    """
    priority=load(ROOT/"kids/review-only/quiz-v4-450-next-completion-priority.json")
    if priority.get("summary",{}).get("modelId")!=MODEL or priority.get("summary",{}).get("voiceId")!=VOICE:
        raise RuntimeError("Wrong reviewed 450 original-audio priority model or voice")
    recorded=set(registry["textClips"])
    available=[r for r in plan["pendingAudioFragments"] if r["text"] not in recorded and r["text"] not in protected]
    by_sha={hashlib.sha256(r["text"].encode("utf-8")).hexdigest():r for r in available}
    if len(by_sha)<LIMIT:raise RuntimeError("Fewer than 50 uncharged unique original V4 texts")
    selected=[];chosen=set();cost=0.0
    complete=[]
    age_completed={"7-8":0,"9-10":0}
    rows=[]
    for q in priority["questions"]:
        if q["ageBand"] not in age_completed or q["status"]=="complete-v4-review":
            continue
        if q.get("missingPreviouslyPaidGenerationIds") or q.get("missingConnectedFlowOriginalTextSha256"):
            continue
        hashes=set(q.get("missingNewTextSha256",[]))
        if not hashes or not hashes<=set(by_sha):
            continue
        rows.append({"questionId":q["questionId"],"age":q["ageBand"],"hashes":hashes})
    while len(selected)<LIMIT:
        eligible=[]
        for q in rows:
            need=q["hashes"]-chosen
            if not need:continue
            adds=[by_sha[h] for h in sorted(need)]
            expense=sum(len(x["text"])*RATE for x in adds)
            if len(selected)+len(adds)<=LIMIT and cost+expense<=MAX_COST:
                eligible.append((age_completed[q["age"]],len(adds),expense,q["questionId"],q,adds))
        if not eligible:break
        _,_,expense,qid,q,adds=min(eligible,key=lambda item:item[:4])
        for part in adds:
            digest=hashlib.sha256(part["text"].encode("utf-8")).hexdigest()
            if digest in chosen:raise RuntimeError("Duplicate paid original in same 50er run")
            selected.append(part);chosen.add(digest)
        cost+=expense
        age_completed[q["age"]]+=1
        complete.append(qid)
    # An incomplete question can be helped with remaining slots, no random
    # alphabetical fragments disconnected from upcoming quiz completions.
    while len(selected)<LIMIT:
        eligible=[]
        for q in rows:
            remaining=q["hashes"]-chosen
            if not remaining:continue
            item=min((by_sha[h] for h in remaining),key=lambda x:(len(x["text"]),x["text"]))
            expense=len(item["text"])*RATE
            if cost+expense<=MAX_COST:
                eligible.append((len(remaining),expense,q["questionId"],item))
        if not eligible:break
        _,expense,_,item=min(eligible,key=lambda x:x[:3])
        digest=hashlib.sha256(item["text"].encode("utf-8")).hexdigest()
        if digest in chosen:raise RuntimeError("Duplicate original in filler")
        selected.append(item);chosen.add(digest);cost+=expense
    if len(selected)!=LIMIT:
        raise RuntimeError("Cannot find 50 safe original texts within the existing 2600-credit forecast cap")
    return selected,round(cost,2),sorted(set(complete))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--audit",action="store_true",help="Offline no-cost exact next-50 plan")
    args=parser.parse_args()
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not args.audit and not key:raise RuntimeError("ElevenLabs API key missing")
    if not args.audit and os.environ.get("KIDS_V4_AUTHORIZE_EXACT_50_ORIGINALS")!="YES":
        raise RuntimeError("Real 50 V4 recordings require explicit paid campaign authorization")
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
        print("V4_450_BATCH04_ALREADY_COMPLETE: zero new charges on repeat",flush=True)
        return
    if old_for_batch:
        raise RuntimeError("Partially charged batch exists. Reconcile exact saved originals first; never retry")
    protected=protect_paid_texts(ROOT,registry,ledger)
    chosen,estimate,question_ids=choose(plan,registry,protected)
    plan_report={
        "scope":"PRIVATE_KIDS_V4_NEXT_FIFTY_ORIGINALS",
        "batchId":BATCH,"modelId":MODEL,"voiceId":VOICE,
        "numberOfOriginalMP3Takes":50,"estimatedCreditsNotInvoice":estimate,
        "creditsForecastCeiling":MAX_COST,
        "questionIDsPotentiallyMadeFourPartComplete":question_ids,
        "selectedExactTextSHA256":[hashlib.sha256(z["text"].encode("utf-8")).hexdigest() for z in chosen],
        "approvalFingerprintSHA256":hashlib.sha256(
            json.dumps([hashlib.sha256(z["text"].encode("utf-8")).hexdigest() for z in chosen],
                       separators=(",",":")).encode("utf-8")).hexdigest(),
        "existingChargedOriginalsWillNotBeRegenerated":True,
        "newCreditsSpentByAudit":0,"humanAudioApproved":False,"publicAppEnabled":False
    }
    save(ROOT/"kids/review-only/quiz-v4-next50-originals-audit.json",plan_report)
    if args.audit:
        print("PASS_V4_NEXT50_ZERO_CREDIT_AUDIT "+json.dumps({
            "takes":50,"potentialQuestions":len(question_ids),"estimatedCredits":estimate},ensure_ascii=False))
        return
    if JOURNAL.exists():
        raise RuntimeError("An earlier fifty-take batch was reserved or partially paid: STOP, recover real originals")
    approval=os.environ.get("KIDS_V4_APPROVED_FIFTY_TEXT_SHA256","").strip()
    campaign_hash=plan_report["approvalFingerprintSHA256"]
    if approval!=campaign_hash:
        raise RuntimeError("Exact 50-source SHA digest differs from approved review. Zero paid calls.")
    before=subscription(key)
    if before<max(MAX_COST*1.25,estimate*1.4):
        raise RuntimeError("Subscription budget lower than estimated batch: no charges")
    print(f"V4_450_BATCH04_PLAN clips={len(chosen)} estimated_max={MAX_COST} estimate={estimate:.2f}",flush=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    # One durable remote reservation before any charge. Do not start a second
    # paid campaign if GitHub refuses this private checkpoint.
    reserve_batch(plan_report["selectedExactTextSHA256"])
    for n,item in enumerate(chosen,1):
        text=item["text"]
        prohibit_prepaid_selection(text,protected)
        if text in registry["textClips"]:
            raise RuntimeError("Original already exists; do not synthesize again")
        code=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        dest=OUTPUT/(code[:32]+".mp3")
        if dest.exists():
            raise RuntimeError("Original bytes exist without ledger. Do NOT synthesize again")
        text_sha=record_before_post(text,plan_report["selectedExactTextSHA256"])
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
        record_returned_mp3(text_sha,actual,dest,REGISTRY,LEDGER,request_id)
        print(f"V4_450_BATCH04_ORIGINAL_SAVED locally={n}/{len(chosen)} sha={actual[:16]} size={len(audio)}",flush=True)
        if n<len(chosen):time.sleep(0.65)
    after=subscription(key)
    billing_delta=max(0,before-after)
    stats={"batchId":BATCH,"newOriginalMP3s":len(chosen),
           "estimatedCreditsAtObservedRate":round(estimate,2),
           "observedSubscriptionUsageDelta":round(billing_delta,2),
           "billableExpenseApproximate":True,
           "source":"eleven_v4","savedOnRunner":True,
           "listeningApproved":False,"live":False}
    save(ROOT/"kids/data/quiz-v4-450-batch04-usage.json",stats)
    print("V4_450_BATCH04_SAVED_ALL "+json.dumps(stats,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
