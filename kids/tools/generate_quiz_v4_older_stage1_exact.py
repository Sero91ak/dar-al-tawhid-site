#!/usr/bin/env python3
"""First *actionable* 7–10-year V4 campaign: exact 65 originals / 20 questions.

Default --audit is completely offline, read-only and costs zero ElevenLabs
credits. --produce requires two independent affirmative human workflow inputs
for CONTENT REVIEW and CREDIT SPEND; produces at most ten originals per run,
all drawn from the immutable first-stage 65 text hashes, never from arbitrary
popular fragments. Recorded originals are re-used, never bought again.
No automatic retry of failed/uncertain provider calls, no public release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime,timezone
from pathlib import Path

from quiz_v4_no_double_charge_guard import protect_paid_texts,prohibit_prepaid_selection
from generate_quiz_v4_450_paid_batch02 import original_mp3,subscription

ROOT=Path(__file__).resolve().parents[2]
PREP=ROOT/".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
REPORT=ROOT/"kids/review-only/quiz-v4-older-stage1-next-recording-batch.json"
USAGE=ROOT/"kids/data/quiz-v4-older-stage1-usage.json"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
COUNT_PER_RUN=10
MAX_ESTIMATED_CREDITS_PER_RUN=850.0
RATE_FOR_ESTIMATE_ONLY=0.969066
STAGE_SIZE=65
STAGE_CHARACTERS=1842

def read(path):return json.loads(path.read_text(encoding="utf-8"))
def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def check(ok,msg):
    if not ok:raise RuntimeError("KIDS_V4_STAGE1_PAYMENT_BLOCKED: "+msg)
def sha(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()

def prepare():
    stage=read(PREP);reg=read(REG);ledger=read(LEDGER)
    check(read(RELEASE)["enabled"] is False,"public 450-quiz switch must remain OFF")
    check(stage["stage"]==1 and stage["scope"]=="V4_OLDER_AGE_PRIVATE_STAGE_PREFLIGHT",
          "not the original first stage")
    check(stage["reviewOnly"] is True and stage["published"] is False,
          "stage must remain private")
    check(stage["newCreditsSpent"]==0 and stage["voiceGenerationAuthorized"] is False,
          "source audit cannot auto-authorize purchases")
    check(stage["numberOfQuestions"]==20
          and stage["numberOfNewOriginalTexts"]==STAGE_SIZE
          and stage["numberOfNewCharacters"]==STAGE_CHARACTERS,
          "20-question first stage or its cost basis was changed")
    check(len(stage["questions"])==20 and
          sum(q["ageBand"]=="7-8" for q in stage["questions"])==10 and
          sum(q["ageBand"]=="9-10" for q in stage["questions"])==10,
          "first stage must retain 10 questions in each older group")
    check(reg["voiceId"]==VOICE and reg["modelId"]==MODEL
          and reg["live"] is False and ledger["live"] is False,
          "non-V4 master or public clip registry")
    rows=stage["originalTextRecordingQueue"]
    check(isinstance(rows,list) and len(rows)==STAGE_SIZE,
          "expected exactly 65 immutable spoken V4 original texts")
    hashes=set();texts=set()
    for x in rows:
        text=x["spokenText"];digest=x["spokenTextSHA256"]
        check(isinstance(text,str) and text and sha(text)==digest,
              "recording text hash changed")
        check(x["expectedModelId"]==MODEL and x["expectedVoiceId"]==VOICE,
              "voice drift")
        check(x["existingOriginalMP3"] is False,
              "unrecorded stage was silently modified")
        check(x["newRecordingStarted"] is False and
              x["paidCreditsSpent"]==0 and
              x["explicitRecordingAuthorization"] is False,
              "stage preflight already includes fake payment or authorization")
        check(digest not in hashes and text not in texts,
              "duplicate V4 audio text in stage1")
        hashes.add(digest);texts.add(text)
    check(sum(len(x["spokenText"]) for x in rows)==STAGE_CHARACTERS,
          "v4 spoken text became longer or shorter")
    protected=protect_paid_texts(ROOT,reg,ledger)
    paid={row["text"] for row in ledger["rows"]}
    check(len(paid)==len(ledger["rows"]),"paid text has duplicate receipt")
    check(paid<=set(reg["textClips"]),"charged original missing from registry")
    check(not((texts-set(reg["textClips"]))&protected),
          "new first-stage queue attempts to rebuy an earlier paid V4 original")
    outstanding=[]
    for x in rows:
        text=x["spokenText"]
        if text in reg["textClips"]:
            check(text in paid,"previously recorded MP3 has no payment ledger; reconcile before another request")
            actual=reg["textClips"][text]
            check(actual["textSha256"]==sha(text) and actual["voiceId"]==VOICE
                  and actual["modelId"]==MODEL,
                  "recorded original differs from exact first-stage source")
        else:
            check(text not in paid,"previously charged exact text is missing MP3, DO NOT buy again")
            outstanding.append(x)
    return reg,ledger,stage,outstanding,protected

def candidate_batch(outstanding):
    selected=[];estimated=0.0
    for item in outstanding:
        if len(selected)>=COUNT_PER_RUN:break
        cost=len(item["spokenText"])*RATE_FOR_ESTIMATE_ONLY
        check(cost<=MAX_ESTIMATED_CREDITS_PER_RUN,
              "one original exceeds whole run credit limit")
        if estimated+cost>MAX_ESTIMATED_CREDITS_PER_RUN:break
        estimated+=cost
        selected.append(item)
    check(bool(selected) or not outstanding,
          "first new V4 original cannot fit within manually capped budget")
    return selected,round(estimated,2)

def main():
    parser=argparse.ArgumentParser()
    choice=parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--audit",action="store_true",
                        help="Offline exact V4 text/credit and double-charge audit; zero credits")
    choice.add_argument("--produce",action="store_true",
                        help="Requires explicit manual workflow approval and API key")
    args=parser.parse_args()
    reg,ledger,stage,missing,protected=prepare()
    selected,estimate=candidate_batch(missing)
    report={
        "scope":"KIDS_V4_OLDER_STAGE1_20_QUESTIONS_65_EXACT_ORIGINALS",
        "modelId":MODEL,"voiceId":VOICE,"reviewOnly":True,
        "questionCount":20,"questions7to8":10,"questions9to10":10,
        "stageExpectedNewOriginals":STAGE_SIZE,
        "previouslyRecordedFirstStageOriginals":STAGE_SIZE-len(missing),
        "remainingFirstStageOriginals":len(missing),
        "nextPaidRunOriginalLimit":COUNT_PER_RUN,
        "nextExactTextSha256":[x["spokenTextSHA256"] for x in selected],
        "nextEstimatedCreditsNotProviderBill":estimate,
        "estimatedPerRunCreditsMaximum":MAX_ESTIMATED_CREDITS_PER_RUN,
        "previouslyPaidHistoricalFlowTextsInQueue":0,
        "paidSynthesisAuthorizedByAudit":False,
        "newElevenLabsCreditsSpentByAudit":0,
        "humanSourceApprovalInPreflight":False,
        "noBlindRetryAfterProviderError":True,
        "publicReleaseAllowed":False
    }
    if args.audit:
        write(REPORT,report)
        print("PASS_KIDS_V4_OLDER_STAGE1_NO_CREDIT_PREFLIGHT "+
              json.dumps(report,ensure_ascii=False),flush=True)
        return
    # The actual source review and the spend are separate user actions;
    # neither is inferred from previous messages or from the JSON preflight.
    check(os.getenv("KIDS_V4_STAGE1_HUMAN_CONTENT_CHECK")=="YES",
          "requires explicit completed human source/text review")
    check(os.getenv("KIDS_V4_STAGE1_EXPLICIT_SPEND_APPROVAL")=="YES",
          "requires explicit paid-credit authorization for this run")
    check(bool(selected),"first 65 already recorded; no further purchases")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"provider credential absent")
    available=subscription(key)
    check(available>=max(estimate*1.5,MAX_ESTIMATED_CREDITS_PER_RUN),
          "insufficient provider credits; no paid calls started")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    completed=0
    # New texts are not reselected from the global pending list: the exact
    # stage-1 source texts are the sole allowed billable candidates.
    for item in selected:
        text=item["spokenText"]
        prohibit_prepaid_selection(text,protected)
        check(text not in reg["textClips"],"cannot re-record existing original")
        digest=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        path=OUTPUT/(digest[:32]+".mp3")
        check(not path.exists(),"original audio exists without ledger; DO NOT REGENERATE")
        # A failed/ambiguous POST is NEVER retried. Runner artifacts retain
        # real MP3s already written before the error.
        audio,request_id=original_mp3(key,text)
        # Persist the charged MP3 bytes EVEN when the provider omitted a
        # request ID: a lost receipt must NEVER trigger a second purchase.
        path.write_bytes(audio)
        audiosha=hashlib.sha256(audio).hexdigest()
        reg["textClips"][text]={
            "url":"/"+str(path.relative_to(ROOT)),"sha256":audiosha,
            "textSha256":sha(text),"bytes":len(audio),
            "voiceId":VOICE,"modelId":MODEL,
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "source":"official-direct-v4-text-to-speech-api",
            "status":"completed-original-mp3-on-review-branch-not-live",
            "providerRequestId":request_id}
        ledger["rows"].append({
            "batchId":BATCH,"text":text,"textSha256":sha(text),
            "estimatedCreditsAtObservedRate":round(len(text)*RATE_FOR_ESTIMATE_ONLY,4),
            "exactBilledCredits":None,"mp3Sha256":audiosha,
            "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
            "note":"Original V4; audit exact provider billing; no blind retries"})
        write(REG,reg);write(LEDGER,ledger)
        if not request_id:
            raise RuntimeError("Paid MP3 bytes were saved without a provider request ID. Preserve runner artifact, reconcile manually; NEVER RETRY this text.")
        completed+=1
        print("PAID_V4_STAGE1_ORIGINAL_SAVED "+
              json.dumps({"count":completed,"sha256":audiosha,
                          "textSHA256":sha(text),"mp3Bytes":len(audio)}),flush=True)
    summary={"batchId":BATCH,"newOriginalsThisRun":completed,
             "estimatedCreditsNotProviderBill":round(sum(len(x["spokenText"])*RATE_FOR_ESTIMATE_ONLY for x in selected),2),
             "remainingStage1Originals":len(missing)-completed,
             "exactBilledCreditsUnknown":True,"live":False,
             "humanListeningApproved":False}
    prior=read(USAGE) if USAGE.is_file() else {"batchId":BATCH,"runs":[]}
    prior["runs"].append(summary);write(USAGE,prior)
    print("PAID_V4_STAGE1_NO_REPEATS "+json.dumps(summary),flush=True)

if __name__=="__main__":main()
