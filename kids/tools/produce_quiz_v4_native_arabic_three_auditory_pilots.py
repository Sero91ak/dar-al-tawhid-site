#!/usr/bin/env python3
"""Three unique, vowelled, Arabic-only Eleven V4 audition takes for the owner's
rejected ʿIbādah and held Ḥalāl/Ḥarām pronunciations. These are NOT replacements
until the owner hears and approves each one; app release stays prohibited.
Every provider POST is journalled remotely BEFORE attempting it; never retry.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import (build_canonical_v4_payload,original_mp3,subscription)
from generate_quiz_v4_older_stage1_exact import persist_remote_paid_checkpoint
from quiz_v4_no_double_charge_guard import protect_paid_texts
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
SOURCES={"ʿIbādah":"عِبَادَة","Ḥalāl":"حَلَال","Ḥarām":"حَرَام"}
LEDGER=ROOT/"kids/data/quiz-v4-native-arabic-owner-three-auditory-pilot-ledger.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
HOLD=ROOT/"kids/data/quiz-v4-owner-pronunciation-hold-20261021.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-native-fusha-pronunciation-pilots-review"
MAX_CREDITS_ESTIMATE=125.0
MAX_POSTS=3

def read(p):return json.loads(p.read_text(encoding="utf-8"))
def sha(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()
def check(ok,msg):
    if not ok:raise RuntimeError("KIDS_V4_NATIVE_THREE_OWNER_AUDITION_STOP: "+msg)
def preflight():
    check(not LEDGER.exists(),"this three-word pilot has previously started or finished, never repeat paid audio")
    check(read(FLAG).get("enabled") is False,"no public quiz release")
    hold=read(HOLD)
    check(hold["modelId"]==MODEL and hold["voiceId"]==VOICE and len(hold["originals"])==7
          and not hold["humanListeningApproved"],"owner rejection/human hearing guard missing")
    check(all(x["blockedForQuizPlayback"] and x["retainPaidOriginal"] and not x["allowBlindRegeneration"]
              for x in hold["originals"]),"prior owner's 7 defective originals lost quarantine")
    reg,ledger=read(REG),read(PAID)
    check(reg["modelId"]==MODEL and reg["voiceId"]==VOICE and reg["live"] is False,
          "wrong master registry")
    protected=protect_paid_texts(ROOT,reg,ledger)
    for grapheme,arabic in SOURCES.items():
        check(arabic not in protected and arabic not in reg["textClips"],
             "authentic Arabic standalone term previously paid/reserved, NEVER rebuy")
        check(grapheme in ["ʿIbādah","Ḥalāl","Ḥarām"],"not one of three owner-held terms")
        expected={"text":arabic,"model_id":MODEL,"language_code":"ar",
                  "apply_text_normalization":"off"}
        check(build_canonical_v4_payload(arabic,language="ar")==expected,
             "actual outgoing native fully vowelled Fuṣḥā V4 profile lost")
    estimate=sum(len(s)*0.969 for s in SOURCES.values())
    check(estimate<=MAX_CREDITS_ESTIMATE,"maximum 125 credit estimate violated")
    return {"schemaVersion":1,"scope":"KIDS_V4_450_OWNER_PRONUNCIATION_NATIVE_AR_THREE_PILOTS",
            "modelId":MODEL,"voiceId":VOICE,"language":"ar",
            "ownerGermanDictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
            "ownerGermanDictionaryVersionId":"wSzgkGpAwEDiTak8DApc",
            "germanPronunciationDictionaryAppliedToArabic":False,
            "pilotTerms":[{"ownerTerm":k,"spokenNativeArabic":v,"originalTextSHA256":sha(v)}
                          for k,v in SOURCES.items()],
            "totalAllowedProviderPosts":MAX_POSTS,
            "maxForecastCreditsNotProviderInvoice":MAX_CREDITS_ESTIMATE,
            "estimatedCreditsNotInvoice":round(estimate,2),
            "humanPronunciationApproved":False,"existingSevenDisputedTakesPreserved":True,
            "existingSevenDisputedTakesPlayable":False,
            "publicReleaseAllowed":False,
            "status":"READ_ONLY_PLANNED",
            "entries":[]}
def main():
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--audit",action="store_true")
    group.add_argument("--produce",action="store_true")
    args=p.parse_args()
    report=preflight()
    if args.audit:
        print("PASS_KIDS_NATIVE_ARABIC_THREE_PILOT_PREFLIGHT "+
              json.dumps({"terms":len(report["pilotTerms"]),
                          "maxPosts":MAX_POSTS,
                          "estimatedCreditsNotInvoice":report["estimatedCreditsNotInvoice"],
                          "willSpendCredits":False},ensure_ascii=False),flush=True)
        return
    check(os.getenv("GITHUB_ACTIONS")=="true" and
          os.getenv("GITHUB_REF_NAME")=="review/kids-quiz-v4-batch-001-020-20261014",
          "use only restricted signed GitHub review job")
    check(os.getenv("KIDS_V4_OWNER_450_BULK_EXPLICIT")=="YES"
          and os.getenv("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
          "owner credit consent is not set")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"provider key is not available")
    check(subscription(key)>MAX_CREDITS_ESTIMATE*2,"insufficient available provider credit reserve")
    OUT.mkdir(parents=True,exist_ok=True)
    report["status"]="STARTED_DO_NOT_RETRY"
    report["startedAt"]=datetime.now(timezone.utc).isoformat()
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,purpose="three-native-AR-owner-audition-start")
    for index,(term,arabic) in enumerate(SOURCES.items(),1):
        check(not any(x["originalTextSHA256"]==sha(arabic) for x in report["entries"]),
              "already attempted original in this wave")
        row={"ownerTerm":term,"sourceText":arabic,"originalTextSHA256":sha(arabic),
             "status":"REQUEST_STARTED_UNCONFIRMED",
             "startedAt":datetime.now(timezone.utc).isoformat()}
        report["entries"].append(row)
        LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        persist_remote_paid_checkpoint(LEDGER,purpose="native-three-%02d-request-start"%index)
        target=OUT/(sha(arabic)[:32]+".mp3")
        check(not target.exists(),"original file exists; REFUSE repeat")
        raw,rid=original_mp3(key,arabic,language="ar")
        target.write_bytes(raw)
        probe=subprocess.run(["ffprobe","-v","error","-show_entries",
            "format=duration:stream=codec_name,codec_type","-of","json",str(target)],
            capture_output=True,text=True,check=True)
        audio=[x for x in json.loads(probe.stdout).get("streams",[])
               if x.get("codec_type")=="audio"]
        check(audio and audio[0].get("codec_name")=="mp3","paid MP3 decoder failed")
        row.update({"status":"ORIGINAL_MP3_SAVED_REVIEW_ONLY",
                    "mp3Sha256":hashlib.sha256(raw).hexdigest(),
                    "mp3Bytes":len(raw),"providerRequestId":rid,
                    "originalUrl":"/"+str(target.relative_to(ROOT)),
                    "completedAt":datetime.now(timezone.utc).isoformat(),
                    "humanPronunciationApproved":False,"publicReleaseAllowed":False})
        LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        persist_remote_paid_checkpoint(LEDGER,target,purpose="native-three-%02d-original-MP3"%index)
        print("KIDS_NATIVE_OWNER_PILOT_SAVED "+json.dumps({
            "index":index,"sourceTextSha256":sha(arabic),"mp3Sha256":row["mp3Sha256"],
            "MP3Bytes":row["mp3Bytes"],"providerRequestPresent":bool(rid),
            "humanApproved":False,"releaseEnabled":False}),flush=True)
    report["status"]="THREE_ORIGINALS_SAVED_FOR_OWNER_LISTENING_REVIEW"
    report["completedAt"]=datetime.now(timezone.utc).isoformat()
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,purpose="native-three-pilots-finished")
if __name__=="__main__":main()
