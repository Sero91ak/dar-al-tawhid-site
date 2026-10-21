#!/usr/bin/env python3
"""One once-only native Arabic Fuṣḥā V4 pilot, no German de-DE alias on Arabic.
Never retries an uncertain or previously paid request. Private review only.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import (build_canonical_v4_payload,original_mp3,subscription)
from generate_quiz_v4_older_stage1_exact import persist_remote_paid_checkpoint
from plan_quiz_v4_arabic_original_reuse import CANONICAL
from quiz_v4_no_double_charge_guard import protect_paid_texts

VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
SOURCE="عليه السلام"
SPOKEN="عَلَيْهِ السَّلَامُ"
LEDGER=ROOT/"kids/data/quiz-v4-native-fusha-alayhi-salam-original-ledger.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
APPFLAG=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-native-fusha-review"
FORECAST_CREDIT_CEILING=240.0

def require(condition,message):
    if not condition:raise RuntimeError("KIDS_NATIVE_FUSHA_ONCE_STOP: "+message)
def load(p):return json.loads(p.read_text(encoding="utf-8"))
def sha(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()

def preflight():
    require(CANONICAL.get(SOURCE)==SPOKEN,"owner-authored Arabic source changed")
    require(load(APPFLAG).get("enabled") is False,"quiz release must be closed")
    reg,charged=load(REGISTRY),load(PAID)
    require(reg.get("live") is False and reg.get("modelId")==MODEL and reg.get("voiceId")==VOICE,
            "private owner master registry differs")
    require(SPOKEN not in protect_paid_texts(ROOT,reg,charged),"already paid/reserved original, never rebuy")
    require(not LEDGER.exists(),"native source already attempted, paid or uncertain; no automatic retry")
    first=ROOT/"kids/data/quiz-v4-native-fusha-once-original-ledger.json"
    require(first.is_file() and load(first).get("status")=="ORIGINAL_MP3_SAVED_REVIEW_ONLY",
            "first native Fuṣḥā source original not securely checkpointed")
    require(not (OUT/(sha(SPOKEN)[:32]+".mp3")).exists(),"unregistered native MP3; recover it first")
    body=build_canonical_v4_payload(SPOKEN,language="ar")
    require(body=={"text":SPOKEN,"model_id":MODEL,"language_code":"ar",
                   "apply_text_normalization":"off"},"vocalized Arabic master payload lost")
    require(len(SPOKEN)>5 and len(SPOKEN)*1.5<FORECAST_CREDIT_CEILING,"source exceeds spend cap")
    return {"scope":"KIDS_450_NATIVE_ARABIC_FUSHA_ONE_ORIGINAL_REVIEW_ONLY",
            "sourceSymbol":SOURCE,"spokenArabic":SPOKEN,"sourceSHA256":sha(SPOKEN),
            "modelId":MODEL,"voiceId":VOICE,"languageCode":"ar",
            "ownerGermanMasterPLSValidatedByPayload":True,
            "applyGermanPLSToArabic":False,
            "sharedOriginalUsage":"all 450 curated ﷺ references only after listening approval",
            "maxNewPaidRequests":1,"maxForecastCredits":FORECAST_CREDIT_CEILING,
            "humanListeningApproved":False,"publicReleaseAllowed":False,
            "newSpeechCalls":0,"status":"READY_FOR_FIRST_AND_ONLY_POST"}
def main():
    parser=argparse.ArgumentParser()
    x=parser.add_mutually_exclusive_group(required=True)
    x.add_argument("--audit",action="store_true")
    x.add_argument("--produce",action="store_true")
    args=parser.parse_args()
    report=preflight()
    if args.audit:
        print("KIDS_NATIVE_FUSHA_ONCE_PREFLIGHT "+json.dumps(report,ensure_ascii=False),flush=True)
        return
    require(os.getenv("KIDS_V4_OWNER_450_BULK_EXPLICIT")=="YES" and
            os.getenv("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
            "owner explicit credit approval flags absent")
    require(os.getenv("GITHUB_ACTIONS")=="true" and
            os.getenv("GITHUB_REF_NAME")=="review/kids-quiz-v4-batch-001-020-20261014",
            "requires protected GitHub review lane")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    require(bool(key),"provider API key not connected")
    provider_credits=subscription(key)
    require(provider_credits>FORECAST_CREDIT_CEILING*2,"provider credit reserve too small")
    # BEFORE the paid request, commit the uncertain marker to the remote branch.
    report["status"]="REQUEST_STARTED_UNCONFIRMED"
    report["startedAt"]=datetime.now(timezone.utc).isoformat()
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,purpose="one-native-Arabic-AlayhiSalam-POST-start")
    # This code path pays for exactly ONE attempt; no retries after any error.
    raw,rid=original_mp3(key,SPOKEN,language="ar")
    OUT.mkdir(parents=True,exist_ok=True)
    target=OUT/(sha(SPOKEN)[:32]+".mp3")
    require(not target.exists(),"original exists and must never be overwritten")
    target.write_bytes(raw)
    test=subprocess.run(["ffprobe","-v","error","-show_entries",
            "format=duration:stream=codec_name,codec_type","-of","json",str(target)],
            capture_output=True,text=True,check=True)
    streams=json.loads(test.stdout)
    audio=[x for x in streams.get("streams",[]) if x.get("codec_type")=="audio"]
    require(audio and audio[0].get("codec_name")=="mp3","genuine MP3 decoder check failed")
    report.update({"status":"ORIGINAL_MP3_SAVED_REVIEW_ONLY",
                  "completedAt":datetime.now(timezone.utc).isoformat(),
                  "mp3SHA256":hashlib.sha256(raw).hexdigest(),
                  "mp3Bytes":len(raw),"providerRequestId":rid,
                  "localReviewMP3":"/"+str(target.relative_to(ROOT)),
                  "newSpeechCalls":1,"humanListeningApproved":False,
                  "publicReleaseAllowed":False})
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,target,purpose="one-native-Arabic-AlayhiSalam-original-MP3")
    print("KIDS_NATIVE_FUSHA_GENUINE_PILOT_STORED "+json.dumps({
        "spokenTextSha256":sha(SPOKEN),"mp3SHA256":report["mp3SHA256"],
        "bytes":len(raw),"providerRequestPresent":bool(rid),
        "creditsSpentUnknownUntilProviderReconciliation":True,
        "realMP3Saved":True,"humanListeningApproved":False,
        "publicRelease":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
