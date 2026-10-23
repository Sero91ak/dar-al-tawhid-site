#!/usr/bin/env python3
"""Three one-time, exact-source, privately held contextual V4 owner auditions.

These are phonetic trial recordings AFTER owner approved three isolated native
Arabic words; they are NOT yet approved inside German full sentences. Preserve
every paid POST with a remote SHA/receipt checkpoint, never retry or release.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import build_canonical_v4_payload,subscription,source_requires_separate_pronunciation_approval
from quiz_v4_no_double_charge_guard import protect_paid_texts

BRANCH="review/kids-v4-nine-prepaid-artifact-replay-20261022"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
DICTIONARY_ID="Q8w3SxtoVo8NSjsnlJEd"
DICTIONARY_VERSION="wSzgkGpAwEDiTak8DApc"
TRIALS=[
    "Halāle und gute Nahrung.",
    "Allah beschreibt den Qurʾān als Rechtleitung für die Muttaqīn.",
    "Mit wessen Erlaubnis geschahen die Wunder ʿĪsās?",
]
MAX_POSTS=3
MAX_ESTIMATED_CREDITS=230.0
JOURNAL=ROOT/"kids/review-only/quiz-v4-contextual-three-owner-audition-paid-once-ledger-20261023.json"
AUDIO=ROOT/"kids/assets/kids-quiz-audio/v4-owner-contextual-pilots-review-20261023"
APPROVAL=ROOT/"kids/review-only/kids-v4-three-arabic-audition-owner-verdict-20261023.json"
ARABIC_ORIGINALS=ROOT/"kids/data/quiz-v4-native-arabic-owner-three-auditory-pilot-ledger.json"
BLOCKERS=ROOT/"kids/review-only/quiz-v4-450-exact-remaining20-master-v4-20261023.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"

def read(p):return json.loads(p.read_text(encoding="utf8"))
def save(p,obj):
    p.parent.mkdir(parents=True,exist_ok=True)
    tmp=p.with_suffix(".pending")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    tmp.replace(p)
def sha(x):return hashlib.sha256(x.encode("utf8")).hexdigest()
def utc():return datetime.now(timezone.utc).isoformat()
def check(ok,msg):
    if not ok:raise RuntimeError("KIDS_V4_CONTEXTUAL_OWNER_PILOT_STOP: "+msg)
def git(*args,fail=True):
    p=subprocess.run(["git",*args],cwd=ROOT,stdout=subprocess.PIPE,
       stderr=subprocess.PIPE,text=True,timeout=90,check=False)
    if fail:check(p.returncode==0,"Git checkpoint failure: "+args[0])
    return p
def remote_checkpoint(*paths,reason):
    check(os.getenv("GITHUB_ACTIONS")=="true" and os.getenv("GITHUB_REF_NAME")==BRANCH,
          "only the protected review Actions runner can checkpoint paid requests")
    git("config","user.name","dar-kids-v4-owner-contextual-audition")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    git("add","--",*(str(p.relative_to(ROOT)) for p in paths))
    check(bool(git("diff","--cached","--name-only").stdout.strip()),
          "no changed source receipt to checkpoint")
    git("commit","-m","review(kids V4): preserve owner contextual pilot "+reason+" [skip ci]")
    for attempt in range(5):
        res=git("push","origin","HEAD:"+BRANCH,fail=False)
        if res.returncode==0:
            own=git("rev-parse","HEAD").stdout.strip()
            remote=git("ls-remote","--heads","origin",BRANCH).stdout.strip().split()
            check(remote and remote[0]==own,"remote did not confirm paid receipt")
            print("KIDS_CONTEXTUAL_OWNER_PILOT_REMOTE_SHA "+reason+" "+own[:12],flush=True)
            return
        err=res.stderr.lower()
        check("non-fast-forward" in err or "fetch first" in err or "[rejected]" in err,
              "Git push denied; no retry of previously billed TTS")
        git("fetch","origin",BRANCH)
        rebased=git("rebase","--autostash","FETCH_HEAD",fail=False)
        check(rebased.returncode==0,"Paid checkpoint branch conflict; no TTS retry")
    raise RuntimeError("Paid checkpoint not accepted by GitHub")

def preflight():
    check(not JOURNAL.exists(),"This exact contextual trial was already attempted; never re-buy")
    approval,arabic,hold,src,reg,paid=map(read,
        (APPROVAL,ARABIC_ORIGINALS,HOLD,BLOCKERS,REGISTRY,PAID))
    check(approval.get("ownerAcceptedAllThreeIsolatedSamples") is True
          and approval.get("ownerFeedback")=="Alles richtig"
          and approval.get("approvalAppliesOnlyToThreeIsolatedSamples") is True
          and approval.get("publicReleaseAuthorized") is False,
          "no exact owner's isolated-word approval record")
    check(arabic["modelId"]==MODEL and arabic["voiceId"]==VOICE
          and len(arabic["entries"])==3 and all(
          x["status"]=="ORIGINAL_MP3_SAVED_REVIEW_ONLY"
          and x["humanPronunciationApproved"] is False
          for x in arabic["entries"]),
          "do not rewrite historical native original receipts")
    check(hold["productionPaused"] is True and hold["paidSpeechAuthorized"] is False
          and hold["publicQuizAudioReleaseAuthorized"] is False
          and hold["ownerRequestedAll450Originals"] is True,
          "owner's global production halt, original 450 task, or public hold changed")
    check(src["actualFourPartCompleted"]==430 and src["stillNotFourPartComplete"]==20
          and len(src["missingSourceTexts"])==28,
          "remaining exact source review must remain 430 and 28 texts")
    check(reg["voiceId"]==VOICE and reg["modelId"]==MODEL and reg["live"] is False
          and paid["live"] is False,
          "wrong source voice or release lane")
    protected=protect_paid_texts(ROOT,reg,paid)
    sources={row["text"]:row for row in src["missingSourceTexts"]}
    estimated=sum(len(t) for t in TRIALS)*0.969066
    check(estimated<MAX_ESTIMATED_CREDITS and len(TRIALS)==MAX_POSTS,
          "pilot credit ceiling reached")
    for t in TRIALS:
        check(t in sources
          and sources[t]["sha256"]==sha(t)
          and sources[t]["blocker"]=="NEW_V4_REQUIRED_AFTER_APPROVED_PILOT",
          "not an exact previously unpaid quiz component")
        check(t not in protected and t not in reg["textClips"],
          "already paid or reserved original would be re-bought")
        check(source_requires_separate_pronunciation_approval(t),
          "this scoped pilot must test previously unsafe Arabic/German context")
        payload=build_canonical_v4_payload(t,language="de")
        check(payload["text"]==t and payload["model_id"]==MODEL
          and payload["language_code"]=="de"
          and payload["pronunciation_dictionary_locators"]==[{
           "pronunciation_dictionary_id":DICTIONARY_ID,
           "version_id":DICTIONARY_VERSION
          }],"real V4 German + pinned PLS source drifted")
    return {
      "schemaVersion":1,"date":"2026-10-23",
      "scope":"ONLY_THREE_CONTEXTUAL_FULL_SENTENCE_LISTENING_PILOTS",
      "voiceId":VOICE,"modelId":MODEL,
      "dictionaryId":DICTIONARY_ID,"dictionaryVersionId":DICTIONARY_VERSION,
      "approvedParentNativeTerms":["ʿIbādah","Ḥalāl","Ḥarām"],
      "parentOwnerVerdict":"Alles richtig",
      "parentApprovalDoesNotProveSentencePhonetics":True,
      "newContextSentenceOwnerListeningApproved":False,
      "all450SpeechAudioApproved":False,
      "publicReleaseAuthorized":False,
      "globalProductionHoldRemainsActive":True,
      "allowedProviderPOSTs":3,
      "estimatedCreditsNotInvoice":round(estimated,2),
      "maximumEstimatedCredits":MAX_ESTIMATED_CREDITS,
      "noRetryAfterAmbiguousRequest":True,
      "originalTextHashes":[{"text":t,"sha256":sha(t)} for t in TRIALS],
      "entries":[],"status":"PRIVATE_PREPRODUCTION_AUDIT",
    }

def main():
    p=argparse.ArgumentParser()
    modes=p.add_mutually_exclusive_group(required=True)
    modes.add_argument("--audit",action="store_true")
    modes.add_argument("--produce",action="store_true")
    args=p.parse_args()
    report=preflight()
    if args.audit:
        print("PASS_KIDS_V4_CONTEXTUAL_THREE_OWNER_V4_PREFLIGHT "+json.dumps({
          "texts":len(TRIALS),"creditsMax":MAX_ESTIMATED_CREDITS,
          "dictionary":DICTIONARY_ID,"newCredits":0,"noPublicRelease":True},ensure_ascii=False),
          flush=True)
        return
    check(os.getenv("GITHUB_ACTIONS")=="true" and
          os.getenv("GITHUB_REF_NAME")==BRANCH and
          os.getenv("KIDS_V4_APPROVED_NATIVE_THREE_CONTEXTUAL_TRIAL")=="YES",
          "only one explicitly scoped contextual paid private hearing batch")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    check(key and all(33<=ord(x)<=126 for x in key),
          "ElevenLabs direct API key not available in GitHub secret")
    available=subscription(key)
    check(available>MAX_ESTIMATED_CREDITS*1.5,
          "insufficient credit cushion; do not begin paid generation")
    report["status"]="STARTED_REMOTE_CHECKPOINTED_ONCE"
    report["startedAt"]=utc()
    save(JOURNAL,report)
    remote_checkpoint(JOURNAL,reason="opened")
    for text in TRIALS:
        row={"sourceText":text,"sourceTextSHA256":sha(text),
             "status":"REQUEST_STARTED_UNCONFIRMED",
             "startedAt":utc(),"publicReleaseAllowed":False,
             "fullSentenceOwnerListeningApproved":False}
        report["entries"].append(row)
        save(JOURNAL,report)
        remote_checkpoint(JOURNAL,reason="prepaid-"+sha(text)[:10])
        payload=build_canonical_v4_payload(text,language="de")
        req=urllib.request.Request(
           "https://api.elevenlabs.io/v1/text-to-speech/"+VOICE+"?output_format=mp3_44100_128",
           data=json.dumps(payload,ensure_ascii=False).encode("utf8"),
           method="POST",headers={"xi-api-key":key,"Accept":"audio/mpeg",
                                 "Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(req,timeout=110) as answer:
                raw=answer.read(1800000)
                reqid=(answer.headers.get("request-id") or
                       answer.headers.get("xi-request-id"))
                check(answer.status==200,"Unexpected paid original status; never retry")
        except urllib.error.HTTPError as ex:
            raise RuntimeError("V4 contextual master POST HTTP "+str(ex.code)+
               " – uncertain billing; do not retry") from None
        check(1500<len(raw)<1800000 and (raw.startswith(b"ID3") or raw[:1]==b"\xff"),
              "invalid MP3 from possibly charged original; never retry")
        AUDIO.mkdir(parents=True,exist_ok=True)
        target=AUDIO/(sha(text)[:32]+".mp3")
        check(not target.exists(),"existing original at same source SHA; never overwrite")
        target.write_bytes(raw)
        cmd=["ffprobe","-v","error","-show_entries","stream=codec_name:format=duration",
             "-of","json",str(target)]
        probe=subprocess.run(cmd,capture_output=True,text=True,timeout=15,check=True)
        check('mp3' in probe.stdout,"stored contextual original fails MP3 decoder")
        row.update(status="ORIGINAL_MP3_SAVED_AWAITING_CONTEXT_OWNER_LISTENING",
                   mp3Sha256=hashlib.sha256(raw).hexdigest(),
                   mp3Bytes=len(raw),providerRequestId=reqid,
                   originalUrl="/"+str(target.relative_to(ROOT)),
                   completedAt=utc())
        save(JOURNAL,report)
        remote_checkpoint(JOURNAL,target,reason="original-"+sha(text)[:10])
        print("KIDS_CONTEXTUAL_REAL_MASTER_V4_MP3_SAVED "+sha(text)[:16],flush=True)
    report["status"]="THREE_CONTEXTUAL_ORIGINALS_SAVED_PRIVATE_PENDING_HEARING"
    report["completedAt"]=utc()
    save(JOURNAL,report)
    remote_checkpoint(JOURNAL,reason="three-complete")
    print("KIDS_V4_CONTEXTUAL_OWNER_THREE_COMPLETED_FOR_LISTENING; no public release",flush=True)
if __name__=="__main__":main()
