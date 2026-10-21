#!/usr/bin/env python3
"""One-time, charge-safe DIRECT MP3 recording for a real KIDS quiz segment.

Never buys a known clip, never regenerates on an ambiguous timeout and never
touches the public quiz. The branch reservation is committed BEFORE paid POST.
Only this one GitHub Actions run may finish its reservation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_v4_no_double_charge_guard import protect_paid_texts,prohibit_prepaid_selection
from generate_quiz_v4_450_paid_batch02 import original_mp3,subscription
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
TEXT="Allah ordnet das Fasten des Ramaḍān an."
SHA="4c3305438e0a4fdfa7ae8544aae48e6323a9ddb0248a61d04494ef312b21f826"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LED=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
CLAIM=ROOT/"kids/data/quiz-v4-direct-one-time-run-claim.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
def read(path):return json.loads(path.read_text(encoding="utf-8"))
def save(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+".pending")
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(path)
def check(v,m):
    if not v:raise RuntimeError("KIDS_V4_DIRECT_ORIGINAL_STOP: "+m)
def validate():
    check(hashlib.sha256(TEXT.encode("utf-8")).hexdigest()==SHA,"original text hash changed")
    check(read(FLAG).get("enabled") is False,"release cannot be on")
    plan,reg,ledger=read(PLAN),read(REG),read(LED)
    check(plan.get("voiceId")==VOICE and plan.get("modelId")==MODEL and
          len(plan.get("recipes",[]))==450,"quiz V4 master source not 450")
    wanted=any(TEXT in rec[part].get("segments",[]) for rec in plan["recipes"]
        for part in ("question","correct","retry","explanation"))
    check(wanted,"not an exact recorded original from an approved quiz")
    protected=protect_paid_texts(ROOT,reg,ledger)
    prohibit_prepaid_selection(TEXT,protected)
    check(not CLAIM.is_file(),"this one-time paid text already reserved; never buy again")
    return reg,ledger
def claim():
    validate()
    run=os.environ.get("GITHUB_RUN_ID","").strip()
    check(run.isdigit(),"only GitHub Actions may claim provider spend")
    save(CLAIM,{"schemaVersion":1,"spokenText":TEXT,"spokenTextSHA256":SHA,
                "ownerRunId":run,"voiceId":VOICE,"modelId":MODEL,
                "state":"PREPOST_RESERVED_DO_NOT_RETRY",
                "audioExists":False,"userApprovedSpend":True,"livePublished":False})
    print("CLAIM_SAVED_BEFORE_ANY_TTS "+SHA,flush=True)
def adopt_failed_before_post():
    # GitHub Actions run 39066003170 failed at command -v ffprobe BEFORE
    # invoking --produce (verified from this run's actual job log).
    # Retain the previously committed reservation, but let exactly ONE
    # newly identified runner take over, safely serializing the paid POST.
    row=read(CLAIM)
    check(row.get("ownerRunId")=="39066003170"
          and row.get("state")=="PREPOST_RESERVED_DO_NOT_RETRY"
          and row.get("spokenTextSHA256")==SHA
          and row.get("audioExists") is False
          and not row.get("providerRequestId")
          and row.get("modelId")==MODEL and row.get("voiceId")==VOICE,
          "previous no-charge reservation state changed; no paid recovery")
    reg,ledger=read(REG),read(LED)
    check(TEXT not in reg["textClips"] and
          all(x.get("text")!=TEXT for x in ledger["rows"]),
          "the reserved original was already purchased")
    target=OUT/(hashlib.sha256((VOICE+"\n"+MODEL+"\n"+TEXT).encode()).hexdigest()[:32]+".mp3")
    check(not target.exists(),"MP3 already exists; no purchase")
    run=os.environ.get("GITHUB_RUN_ID","").strip()
    check(run.isdigit() and run!="39066003170","new runner ID required")
    row["previousPrepostRunnerId"]="39066003170"
    row["previousRunnerNeverReachedElevenLabs"]=True
    row["ownerRunId"]=run
    row["recoveryOfCommittedReservationOnly"]=True
    save(CLAIM,row)
    print("SAFE_PREPOST_CLAIM_ADOPTED "+SHA,flush=True)


def produce():
    row=read(CLAIM)
    check(row.get("ownerRunId")==os.environ.get("GITHUB_RUN_ID")
          and row.get("state")=="PREPOST_RESERVED_DO_NOT_RETRY"
          and row.get("spokenTextSHA256")==SHA,
          "one-time authorized run id or claim mismatched")
    check(os.environ.get("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
          "user authorization not passed to job")
    reg,ledger=read(REG),read(LED)
    check(read(FLAG).get("enabled") is False,"no public publishing")
    check(TEXT not in reg["textClips"] and
          all(r["text"]!=TEXT for r in ledger["rows"]),
          "already recorded or charged original must never be bought again")
    target=OUT/(hashlib.sha256((VOICE+"\n"+MODEL+"\n"+TEXT).encode("utf-8")).hexdigest()[:32]+".mp3")
    check(not target.is_file(),"real MP3 original already exists")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"secret not configured")
    credit=subscription(key)
    check(credit>=100,"insufficient current ElevenLabs credit reserve")
    # NO RETRY: provider HTTP failure may have charged an ambiguous request.
    sound,request_id=original_mp3(key,TEXT)
    check(sound and (sound.startswith(b"ID3") or sound[:1]==bytes([255])),
          "invalid paid MP3 bytes, do not retry")
    OUT.mkdir(parents=True,exist_ok=True)
    temp=target.with_name(target.name+".pending")
    temp.write_bytes(sound)
    temp.replace(target)
    duration=subprocess.run(["ffprobe","-v","error","-show_entries",
        "format=duration:stream=codec_name,codec_type","-of","json",str(target)],
        check=True,text=True,capture_output=True)
    meta=json.loads(duration.stdout)
    sec=float(meta.get("format",{}).get("duration") or 0)
    tracks=[x for x in meta.get("streams",[]) if x.get("codec_type")=="audio"]
    check(0.4<sec<180 and len(tracks)==1 and tracks[0].get("codec_name")=="mp3",
          "provider MP3 failed codec/duration QA; preserve bytes without regeneration")
    sha=hashlib.sha256(sound).hexdigest()
    reg["textClips"][TEXT]={
        "url":"/"+str(target.relative_to(ROOT)),"sha256":sha,
        "textSha256":SHA,"bytes":len(sound),"modelId":MODEL,"voiceId":VOICE,
        "source":"official-direct-v4-owner-text-to-speech",
        "providerRequestId":request_id,"audioListeningApproved":False,
        "qaApproval":"pending-human-auditory-review","status":"review-only-original"}
    ledger["rows"].append({"batchId":"KIDS_V4_APPROVED_ONE_TIME_DIRECT",
        "text":TEXT,"textSha256":SHA,"mp3Sha256":sha,
        "providerRequestId":request_id,"estimatedCreditsAtObservedRate":round(len(TEXT)*.969066,4),
        "exactBilledCredits":None,"note":"Exactly one paid direct MP3. Voice Fusha pending listening."})
    save(REG,reg);save(LED,ledger)
    row.update({"state":"ORIGINAL_SAVED","audioExists":True,
                "mp3Sha256":sha,"url":reg["textClips"][TEXT]["url"],
                "mp3Bytes":len(sound),"durationSeconds":sec,
                "providerRequestId":request_id})
    save(CLAIM,row)
    print("KIDS_V4_DIRECT_MP3_SAVED "+json.dumps({
        "question":"kids-quiz-045","sourceSHA256":SHA,"mp3SHA256":sha,
        "bytes":len(sound),"durationSeconds":round(sec,3)},ensure_ascii=False),flush=True)
if __name__=="__main__":
    pa=argparse.ArgumentParser()
    q=pa.add_mutually_exclusive_group(required=True)
    q.add_argument("--claim",action="store_true")
    q.add_argument("--produce",action="store_true")
    q.add_argument("--adopt-unspent-reservation",action="store_true")
    args=pa.parse_args()
    if args.claim:claim()
    elif args.adopt_unspent_reservation:adopt_failed_before_post()
    else:produce()
