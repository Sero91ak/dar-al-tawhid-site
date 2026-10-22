#!/usr/bin/env python3
"""One-off protected German-only voice V4 fragments for Quiz 031.

No Arabic/Quran/Taqwa/halal/haram texts, no release. Permanent pre-POST
GitHub payment journal, exact owner Master and pinned PLS, immutable source
hashes, no retry on any uncertain response.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, urllib.request, urllib.error
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import build_canonical_v4_payload,subscription,source_requires_separate_pronunciation_approval
from quiz_v4_no_double_charge_guard import protect_paid_texts

BRANCH="review/kids-v4-nine-prepaid-artifact-replay-20261022"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
SOURCES=[
    "Viel Geld.",
    "Eine berühmte Familie.",
]
MAX_ESTIMATED_CREDITS=55
JOURNAL=ROOT/"kids/review-only/quiz-v4-q041-two-german-paid-once-journal.json"
FLOW=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
GAPS=ROOT/"kids/review-only/quiz-v4-450-remaining21-audio-blocker-ledger-20261022.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"

def read(p):return json.loads(p.read_text(encoding="utf8"))
def save(p,o):
    p.parent.mkdir(parents=True,exist_ok=True)
    temp=p.with_name(p.name+".pending")
    temp.write_text(json.dumps(o,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    temp.replace(p)
def sha_bytes(x):return hashlib.sha256(x).hexdigest()
def sha(s):return sha_bytes(s.encode("utf8"))
def check(ok,msg):
    if not ok:raise RuntimeError("KIDS_V4_Q041_SAFE_GERMAN_STOP: "+msg)
def now():return datetime.now(timezone.utc).isoformat()
def git(*args,fail=True):
    res=subprocess.run(["git",*args],cwd=ROOT,capture_output=True,text=True,timeout=75)
    if fail:check(res.returncode==0,"git "+args[0]+" could not complete before next paid request")
    return res
def push_checkpoint(*files,reason):
    # Must durably confirm journal BEFORE starting a billable remote POST.
    git("config","user.name","dar-kids-v4-paid-review-checkpoint")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    git("add","--",*(str(Path(p).relative_to(ROOT)) for p in files))
    check(bool(git("diff","--cached","--name-only").stdout.strip()),
          "no checkpoint changes; never initiate a repeated speech POST")
    git("commit","-m","review(kids V4): q041 protected original checkpoint "+reason+" [skip ci]")
    for attempt in range(4):
        res=git("push","origin","HEAD:"+BRANCH,fail=False)
        if res.returncode==0:
            local=git("rev-parse","HEAD").stdout.strip()
            remote=git("ls-remote","--heads","origin",BRANCH).stdout.split()
            check(bool(remote) and remote[0]==local,"remote original proof not confirmed")
            print("KIDS_V4_Q041_REMOTE_CHECKPOINT "+reason,flush=True)
            return
        check("non-fast-forward" in res.stderr or "fetch first" in res.stderr or "[rejected]" in res.stderr,
              "remote push denied; never re-buy")
        git("fetch","origin",BRANCH)
        x=git("rebase","--autostash","FETCH_HEAD",fail=False)
        check(x.returncode==0,"Git conflict; do not repeat provider request")
    raise RuntimeError("Remote commit unavailable; never repeat a paid POST")

def preflight():
    flag,hold,flow,reg,paid,gaps=map(read,(RELEASE,HOLD,FLOW,REG,PAID,GAPS))
    check(flag.get("enabled") is False and reg.get("live") is False and paid.get("live") is False,
          "public quiz switched on")
    check(hold["productionPaused"] is True and hold["humanPronunciationApproved"] is False and
          hold["publicQuizAudioReleaseAuthorized"] is False,
          "owner pronunciation stop must remain active for Arabic and Quran")
    check(flow["voiceId"]==VOICE and flow["modelId"]==MODEL and
          reg["voiceId"]==VOICE and reg["modelId"]==MODEL,
          "master speaker not available")
    q=next(x for x in gaps["openQuestions"] if x["questionId"]=="kids-quiz-031")
    check(q["missingParts"]==["question"] and
          set(x["text"] for x in q["missingFragments"])==set(SOURCES),
          "question 031 has drifted from real 3 missing original fragments")
    estimated=sum(len(s) for s in SOURCES)*0.969066
    check(estimated<=MAX_ESTIMATED_CREDITS,"estimated credit cap exceeded")
    rows=[x for x in flow["entries"] if x.get("sourceText") in SOURCES]
    check(len(rows)==2 and
          all(x["status"]=="RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED"
              for x in rows),"two originals no longer known unspent/reserved")
    for source in SOURCES:
        check(not source_requires_separate_pronunciation_approval(source),
              "Arabic/Quran speech not allowed in this one-time German batch")
        check(source not in reg["textClips"],"already stored original; never charge again")
        payload=build_canonical_v4_payload(source,language="de")
        check(payload["model_id"]==MODEL and payload["language_code"]=="de" and
              payload["pronunciation_dictionary_locators"]==[{
                 "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
                 "version_id":"wSzgkGpAwEDiTak8DApc"
              }],"pinned owner dictionary lost")
    # All known paid originals must remain byte/source/ledger consistent.
    protected=protect_paid_texts(ROOT,reg,paid)
    check(set(SOURCES)<=protected,"3 reserved texts not covered by no-double-charge guard")
    return {"estimatedCreditCeiling":MAX_ESTIMATED_CREDITS,
            "estimatedCreditsNotInvoice":round(estimated,2),
            "ownerRequestedAll21Now":True,
            "newArabicSpeechRequests":0,"publicReleaseAllowed":False,
            "humanPronunciationApproved":False,
            "sourceQuestionId":"kids-quiz-031",
            "voiceId":VOICE,"modelId":MODEL,
            "expectedOriginalTexts":[{"source":s,"sha256":sha(s)} for s in SOURCES]}

def main():
    arg=argparse.ArgumentParser()
    arg.add_argument("--audit",action="store_true")
    arg.add_argument("--produce",action="store_true")
    a=arg.parse_args()
    check(a.audit!=a.produce,"choose exactly one mode")
    check(not JOURNAL.exists(),"this exact source journal already exists; do not repeat")
    initial=preflight()
    if a.audit:
        print("KIDS_Q041_THREE_GERMAN_PREFLIGHT_PASS "+json.dumps(initial,ensure_ascii=False),flush=True)
        return
    check(os.environ.get("GITHUB_ACTIONS")=="true" and
          os.environ.get("GITHUB_REF_NAME")==BRANCH and
          os.environ.get("KIDS_Q041_ONE_TIME_OWNER_SAFE_GERMAN")=="YES",
          "only exact review-only owner requested one-off Github Actions job")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    check(bool(key) and all(33<=ord(c)<=126 for c in key),
          "missing/invalid ElevenLabs GitHub secret")
    avail=subscription(key)
    check(avail>MAX_ESTIMATED_CREDITS*2,
          "insufficient available ElevenLabs credits")
    initial.update({"schemaVersion":1,"status":"STARTED_WITH_REMOTE_PREPOST_CHECKPOINT",
                    "startedAt":now(),"providerRequests":[],"actualChargesUnknown":True})
    save(JOURNAL,initial)
    push_checkpoint(JOURNAL,reason="start")
    for source in SOURCES:
        # Before each provider request we must persist the source hash and
        # irreversible uncertainty marker to prevent accidental double billing.
        check(not any(x["sourceSha256"]==sha(source) for x in initial["providerRequests"]),
              "already attempted by this batch")
        row={"sourceText":source,"sourceSha256":sha(source),
             "status":"REQUEST_STARTED_UNCONFIRMED","startedAt":now(),
             "modelId":MODEL,"voiceId":VOICE,"publicReleaseAllowed":False}
        initial["providerRequests"].append(row)
        save(JOURNAL,initial)
        push_checkpoint(JOURNAL,reason="prepost-"+sha(source)[:10])
        payload=build_canonical_v4_payload(source,language="de")
        req=urllib.request.Request(
          "https://api.elevenlabs.io/v1/text-to-speech/"+VOICE+"?output_format=mp3_44100_128",
          data=json.dumps(payload,ensure_ascii=False).encode("utf8"),
          method="POST",headers={"xi-api-key":key,"Accept":"audio/mpeg",
                                 "Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(req,timeout=100) as answer:
                raw=answer.read(1700000)
                rid=answer.headers.get("request-id") or answer.headers.get("xi-request-id")
                check(answer.status==200,"unexpected ElevenLabs return code")
        except urllib.error.HTTPError as exc:
            raise RuntimeError("Master V4 German exact POST returned HTTP "+str(exc.code)+
                               "; DO NOT RETRY uncertain request") from None
        check(1500<len(raw)<1700000 and (raw.startswith(b"ID3") or raw[:1]==b"\xff"),
              "invalid source original after possible charged request; DO NOT RETRY")
        OUT.mkdir(parents=True,exist_ok=True)
        target=OUT/(sha(source)[:32]+".mp3")
        check(not target.exists(),"an original exists; stop without rewriting")
        target.write_bytes(raw)
        probe=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_name:format=duration",
                              "-of","json",str(target)],capture_output=True,text=True,timeout=15)
        check(probe.returncode==0 and "mp3" in probe.stdout,"MP3 codec invalid")
        digest=sha_bytes(raw)
        reg=read(REG);paid=read(PAID);flow=read(FLOW)
        check(source not in reg["textClips"] and
              not any(x["text"]==source for x in paid["rows"]),
              "original/paid entry already exists")
        clip={"url":"/"+str(target.relative_to(ROOT)),
              "sha256":digest,"textSha256":sha(source),"voiceId":VOICE,
              "modelId":MODEL,"originalType":"owner-master-v4-direct-dictionary",
              "pronunciationApproved":False,
              "publicReleaseAllowed":False}
        reg["textClips"][source]=clip
        paid["rows"].append({"text":source,"textSha256":sha(source),
               "mp3Sha256":digest,"providerRequestId":rid,
               "estimatedCreditsAtObservedRate":round(len(source)*0.969066,3),
               "exactBilledCredits":None,"createdAt":now(),
               "note":"One-time owner-requested German-only V4, private review; not pronunciation approved"})
        hit=[x for x in flow["entries"] if x.get("sourceText")==source]
        check(len(hit)==1 and hit[0]["status"]=="RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED",
              "provider state changed unexpectedly")
        hit[0].update({"status":"DIRECT_MASTER_V4_DICTIONARY_MP3_IMPORTED_REVIEW_ONLY",
                       "importedMP3SHA256":digest,"providerRequestId":rid,
                       "originalMP3":clip["url"],"humanListeningApproved":False,
                       "publicReleaseAllowed":False})
        row.update({"status":"ORIGINAL_MP3_SAVED_PRIVATE_REVIEW",
                    "originalMP3Sha256":digest,"originalMP3":clip["url"],
                    "providerRequestId":rid,"bytes":len(raw),"completedAt":now()})
        save(REG,reg);save(PAID,paid);save(FLOW,flow);save(JOURNAL,initial)
        push_checkpoint(JOURNAL,REG,PAID,FLOW,target,reason="original-"+sha(source)[:10])
        print("KIDS_Q041_REAL_MASTER_V4_ORIGINAL_SAVED "+sha(source)[:16],flush=True)
    initial["status"]="TWO_GERMAN_ORIGINALS_SAVED_PRIVATE_REVIEW"
    initial["completedAt"]=now()
    save(JOURNAL,initial)
    push_checkpoint(JOURNAL,reason="batch-complete")
    print("KIDS_V4_Q041_TWO_REAL_ORIGINALS_COMPLETE, private only; Arabic Taqwa parts still require source phonetic approval",flush=True)

if __name__=="__main__":
    main()
