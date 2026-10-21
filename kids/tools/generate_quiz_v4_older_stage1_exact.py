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
import subprocess
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
ATTEMPTS=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
COUNT_PER_RUN=10
MAX_ESTIMATED_CREDITS_PER_RUN=850.0
RATE_FOR_ESTIMATE_ONLY=0.969066
STAGE_SIZE=65
STAGE_CHARACTERS=1842

def required_subscription_credits(estimate):
    """A prudent cushion for THIS batch, not the unrelated 850-credit hard cap.

    ElevenLabs reports consumption differently by model/account; estimates
    are not invoices. Never demand 850 credits for a 237-credit batch.
    """
    check(isinstance(estimate,(int,float)) and 0<estimate<=MAX_ESTIMATED_CREDITS_PER_RUN,
          "estimated new recording batch exceeds 850-credit safety ceiling")
    return round(max(estimate*1.5,estimate+50.0),2)

def read(path):return json.loads(path.read_text(encoding="utf-8"))
def write(path,data):
    """Replace each paid-audio ledger/checkpoint atomically on the same disk."""
    path.parent.mkdir(parents=True,exist_ok=True)
    staged=path.with_name(path.name+".pending")
    staged.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    staged.replace(path)
def check(ok,msg):
    if not ok:raise RuntimeError("KIDS_V4_STAGE1_PAYMENT_BLOCKED: "+msg)
def sha(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()

def durable_attempts(journal):
    # Always put the same anti-repurchase evidence in the existing
    # GitHub Actions *always-uploaded* usage backup, even if MP3 QA fails.
    # A separate detailed journal remains available for local recovery.
    usage=read(USAGE) if USAGE.is_file() else {"batchId":BATCH,"runs":[]}
    check(usage.get("batchId")==BATCH and isinstance(usage.get("runs"),list),
          "paid backup usage contract changed")
    usage["requestJournal"]=journal
    write(USAGE,usage)
    write(ATTEMPTS,journal)


def persist_remote_paid_checkpoint(*paths, purpose):
    """Write and confirm the real GitHub pre/post-POST receipts without double billing.

    The review branch receives unrelated CI commits while recording is running.
    A non-fast-forward push may be safely rebased BEFORE a new ElevenLabs POST,
    because this local commit has never been lost or duplicated. Never force
    push, discard an original, retry synthesis, or treat a failed push as proof.
    """
    expected="review/kids-quiz-v4-batch-001-020-20261014"
    check(os.getenv("GITHUB_ACTIONS")=="true"
          and os.getenv("GITHUB_REF_NAME")==expected,
          "paid original requires checkpoint-capable GitHub review runner")
    check(paths and all(Path(p).is_file() for p in paths),
          "missing real request journal, original receipt or MP3 checkpoint")
    def git(*args, allow_fail=False):
        result=subprocess.run(["git",*args],cwd=ROOT,check=False,
                              capture_output=True,text=True,timeout=50)
        if not allow_fail:
            check(result.returncode==0,"GitHub paid original checkpoint git "+
                  str(args[0])+" failed ("+purpose+"); NEVER retry a paid POST")
        return result
    git("config","user.name","dar-kids-v4-paid-original-checkpoint")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    for p in paths:
        check(p.resolve().is_relative_to(ROOT.resolve()),
              "checkpoint outside GitHub review root")
    git("add","--",*(str(p.relative_to(ROOT)) for p in paths))
    staged=git("diff","--cached","--name-only").stdout.strip()
    check(bool(staged),"paid original already checkpointed or missing; STOP before proceeding")
    git("commit","-m","audio(kids V4): protect paid original "+purpose+" [skip ci]")

    for attempt in range(1,6):
        pushed=git("push","origin","HEAD:"+expected,allow_fail=True)
        if pushed.returncode==0:
            # Authoritative remote confirmation required before the paid POST.
            remote=git("ls-remote","--heads","origin",expected).stdout.strip()
            local=git("rev-parse","HEAD").stdout.strip()
            check(bool(remote) and remote.split()[0]==local,
                  "push returned success but remote checkpoint SHA differs")
            print("KIDS_V4_ORIGINAL_CHECKPOINT_SAVED "+purpose+
                  " remote_sha="+local[:12],flush=True)
            return

        # Only a competing review-branch commit may be automatically resolved.
        err=(pushed.stderr or "")[-1400:]
        conflict=("non-fast-forward" in err or "fetch first" in err
                  or "failed to push some refs" in err
                  or "[rejected]" in err)
        if not conflict or attempt==5:
            code=("NON_FAST_FORWARD_MAX_RETRIES" if conflict
                  else "GITHUB_TOKEN_PERMISSION_OR_BRANCH_RULES")
            raise RuntimeError("KIDS_V4_STAGE1_PAYMENT_BLOCKED: remote GitHub "+
                  code+" before/after "+purpose+
                  "; original request evidence preserved; DO NOT retry TTS. "+
                  "Remote error class: "+("non-fast-forward" if conflict
                                         else ("permission" if "403" in err or "denied" in err.lower()
                                               else "other")))
        git("fetch","--no-tags","origin",expected)
        # Autostash unrelated audited files while reapplying only THIS receipt.
        # Conflict or restricted branch permissions are a hard stop, not an
        # excuse to override any original MP3 SHA or remote payment journal.
        rebased=git("rebase","--autostash","FETCH_HEAD",allow_fail=True)
        if rebased.returncode!=0:
            git("rebase","--abort",allow_fail=True)
            raise RuntimeError("KIDS_V4_STAGE1_PAYMENT_BLOCKED: real GitHub "+
                               "paid checkpoint rebase conflict, preserve saved "+
                               "MP3 and never retry this paid original")
        print("KIDS_V4_CHECKPOINT_FAST_FORWARD_RETRY_NO_TTS "+
              purpose+" count="+str(attempt),flush=True)
    raise RuntimeError("KIDS_V4_STAGE1_PAYMENT_BLOCKED: remote checkpoint unavailable")


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
    # Each paid POST gets a durable write-ahead marker. A timed-out,
    # disconnected or ambiguous provider response must NOT be re-purchased.
    previous_usage=read(USAGE) if USAGE.is_file() else {}
    journal=read(ATTEMPTS) if ATTEMPTS.is_file() else previous_usage.get("requestJournal") or {
        "schemaVersion":1,"modelId":MODEL,"voiceId":VOICE,
        "purpose":"DO_NOT_REGENERATE_UNCERTAIN_PAID_REQUESTS","entries":[]}
    if ATTEMPTS.is_file() and previous_usage.get("requestJournal"):
        check(journal==previous_usage["requestJournal"],
              "paid request journal differs from protected action backup; never retry")
    check(journal.get("modelId")==MODEL and journal.get("voiceId")==VOICE
          and isinstance(journal.get("entries"),list),"invalid write-ahead paid audit journal")
    attempted=set()
    unresolved=set()
    for entry in journal["entries"]:
        digest=entry.get("textSHA256")
        check(isinstance(digest,str) and len(digest)==64 and digest not in attempted,
              "ambiguous duplicate original request journal entry")
        attempted.add(digest)
        text=next((x["spokenText"] for x in rows if x["spokenTextSHA256"]==digest),None)
        check(text is not None,"paid request log references an unapproved spoken text")
        if entry.get("status")=="REQUEST_STARTED_UNCONFIRMED":
            # An ambiguous provider POST may have consumed credits. Quarantine
            # THIS text only; continue planning other unpaid originals.
            check(text not in reg["textClips"] and text not in {row["text"] for row in ledger["rows"]},
                  "unconfirmed request conflicts with saved MP3/receipt; reconcile without another POST")
            unresolved.add(digest)
        elif entry.get("status")=="ORIGINAL_MP3_SAVED":
            check(text in reg["textClips"] and
                  reg["textClips"][text]["sha256"]==entry.get("mp3SHA256"),
                  "saved MP3 lost since paid request; do not regenerate")
        else:
            check(False,"unknown original request status; fail closed")
    paid={row["text"] for row in ledger["rows"]}
    check(len(paid)==len(ledger["rows"]),"paid text has duplicate receipt")
    check(paid<=set(reg["textClips"]),"charged original missing from registry")
    outstanding=[]
    reserved_pending=[]
    uncertain_pending=[]
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
            if x["spokenTextSHA256"] in unresolved:
                uncertain_pending.append(x)
            elif text in protected:
                # A connected ElevenLabs Flow has already reserved or
                # submitted this exact original. Never POST it again.
                reserved_pending.append(x)
            else:
                outstanding.append(x)
    # Private in-memory queue metadata; NEVER change the canonical 65 texts.
    stage["_reservedUnimportedTextSHA256"]=[
        x["spokenTextSHA256"] for x in reserved_pending]
    stage["_uncertainPaidRequestTextSHA256"]=[
        x["spokenTextSHA256"] for x in uncertain_pending]
    check(len(outstanding)+len(reserved_pending)+len(uncertain_pending)+
          sum(x["spokenText"] in reg["textClips"] for x in rows)==STAGE_SIZE,
          "missing or doubly counted stage1 V4 originals")
    return reg,ledger,stage,outstanding,protected

def candidate_batch(outstanding, stage):
    """Prefer COMPLETE older questions, balanced between age bands, not A–Z speech.

    Each slot is a real exact V4 text hash from the first-stage 65. This
    greedy order can finish 3–4 questions with the first 10 clips; alphabetical
    text ordering would often leave all questions incomplete.
    """
    allowed={x["spokenTextSHA256"]:x for x in stage["originalTextRecordingQueue"]}
    pending={x["spokenTextSHA256"]:x for x in outstanding}
    blocked=set(stage.get("_reservedUnimportedTextSHA256",[]))
    blocked.update(stage.get("_uncertainPaidRequestTextSHA256",[]))
    check(len(allowed)==STAGE_SIZE and len(pending)==len(outstanding)
          and not blocked.intersection(pending)
          and blocked<=set(allowed),
          "duplicate, reserved or lost source SHA")
    need={}
    fully_missing={}
    age_by_question={}
    for q in stage["questions"]:
        qid=q["questionId"];age=q["ageBand"]
        hashes=set()
        for part in q["audioParts"].values():
            hashes.update(part.get("missingOriginalTextSHA256",[]))
        check(hashes<=set(allowed),"quiz part references unrecognized stage1 speech")
        need[qid]=hashes&set(pending)
        fully_missing[qid]=hashes&(set(pending)|blocked)
        age_by_question[qid]=age
    check(set(pending)==set().union(*need.values()),
          "paid stage1 text is not needed by any approved quiz question")
    selected=[];chosen=set();estimated=0.0
    finished_by_age={"7-8":0,"9-10":0}
    while len(selected)<COUNT_PER_RUN:
        possible=[]
        for qid,required in need.items():
            new=required-chosen
            if not new or (fully_missing[qid] & blocked):
                # This question cannot finish until the other provider's
                # genuine MP3 originals arrive, so do not count it as done.
                continue
            parts=[pending[h] for h in sorted(new)]
            cost=sum(len(p["spokenText"])*RATE_FOR_ESTIMATE_ONLY for p in parts)
            if len(selected)+len(parts)>COUNT_PER_RUN or estimated+cost>MAX_ESTIMATED_CREDITS_PER_RUN:
                continue
            # Balance new completions between both older age profiles.
            possible.append((finished_by_age[age_by_question[qid]],len(parts),
                             cost,qid,parts))
        if not possible:break
        _,_,cost,qid,parts=min(possible,key=lambda x:x[:4])
        for part in parts:
            digest=part["spokenTextSHA256"]
            check(digest not in chosen,"same V4 source would be purchased twice")
            chosen.add(digest);selected.append(part)
        estimated+=cost
        finished_by_age[age_by_question[qid]]+=1
    # Use any leftover slots on speech needed for the next nearest-to-complete
    # question, never on an unassociated alphabetical filler.
    while len(selected)<COUNT_PER_RUN:
        candidates=[]
        for qid,required in need.items():
            missing=required-chosen
            if not missing:continue
            possible=sorted(missing,key=lambda h:(len(pending[h]["spokenText"]),h))
            part=pending[possible[0]]
            cost=len(part["spokenText"])*RATE_FOR_ESTIMATE_ONLY
            if estimated+cost<=MAX_ESTIMATED_CREDITS_PER_RUN:
                candidates.append((len(missing),cost,qid,part))
        if not candidates:break
        _,cost,_,part=min(candidates,key=lambda x:x[:3])
        chosen.add(part["spokenTextSHA256"]);selected.append(part)
        estimated+=cost
    check(bool(selected) or not outstanding,
          "first-stage V4 originals do not fit within manual credit cap")
    complete=sorted(qid for qid,req in fully_missing.items()
                    if req and req<=chosen)
    return selected,round(estimated,2),complete

def main():
    parser=argparse.ArgumentParser()
    choice=parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--audit",action="store_true",
                        help="Offline exact V4 text/credit and double-charge audit; zero credits")
    choice.add_argument("--produce",action="store_true",
                        help="Requires explicit manual workflow approval and API key")
    args=parser.parse_args()
    reg,ledger,stage,missing,protected=prepare()
    selected,estimate,completion_candidates=candidate_batch(missing,stage)
    # Bind manual cost approval to the *exact* source file, current stored
    # V4 MP3 registry, immutable paid ledger and selected SHA sequence.
    # A later commit, newly recorded MP3 or ledger change invalidates the
    # old fingerprint and requires a new deliberate approval.
    paid_snapshot=hashlib.sha256(
        PREP.read_bytes()+b"\\x00"+REG.read_bytes()+b"\\x00"+
        LEDGER.read_bytes()+b"\\x00"+USAGE.read_bytes()+b"\\x00"+ATTEMPTS.read_bytes()+b"\\x00"+
        json.dumps([x["spokenTextSHA256"] for x in selected],
                   ensure_ascii=False,separators=(",",":")).encode("utf-8")
    ).hexdigest()
    report={
        "scope":"KIDS_V4_OLDER_STAGE1_20_QUESTIONS_65_EXACT_ORIGINALS",
        "modelId":MODEL,"voiceId":VOICE,"reviewOnly":True,
        "questionCount":20,"questions7to8":10,"questions9to10":10,
        "stageExpectedNewOriginals":STAGE_SIZE,
        "previouslyRecordedFirstStageOriginals":STAGE_SIZE-len(missing)-len(stage["_reservedUnimportedTextSHA256"])-len(stage["_uncertainPaidRequestTextSHA256"]),
        "remainingFirstStageOriginals":len(missing)+len(stage["_reservedUnimportedTextSHA256"])+len(stage["_uncertainPaidRequestTextSHA256"]),
        "reservedOrSubmittedInConnectedFlowNotToRebuy":len(stage["_reservedUnimportedTextSHA256"]),
        "uncertainPreviousPaidRequestsNotToRebuy":len(stage["_uncertainPaidRequestTextSHA256"]),
        "uncertainPaidRequestTextSHA256":stage["_uncertainPaidRequestTextSHA256"],
        "genuinelyUnreservedTextsEligibleForNewV4":len(missing),
        "nextPaidRunOriginalLimit":COUNT_PER_RUN,
        "manualApprovalMustMatchExactBatchFingerprintSHA256":paid_snapshot,
        "nextExactTextSha256":[x["spokenTextSHA256"] for x in selected],
        "questionsThatCouldGainCompleteV4AudioAfterNextRun":completion_candidates,
        "newlyCompleteQuestionCountProjectedFromActualSourceGaps":len(completion_candidates),
        "audioQualityStillRequiresHumanApproval":True,
        "nextEstimatedCreditsNotProviderBill":estimate,
        "estimatedPerRunCreditsMaximum":MAX_ESTIMATED_CREDITS_PER_RUN,
        "previouslyPaidHistoricalFlowTextsInQueue":0,
        "paidSynthesisAuthorizedByAudit":False,
        "newElevenLabsCreditsSpentByAudit":0,
        "humanSourceApprovalInPreflight":False,
        "noBlindRetryAfterProviderError":True,
        "publicReleaseAllowed":False
    }
    # A source review must succeed freshly against all 450 canonical items
    # *before* any paid POST is permitted, even if workflow approval says YES.
    write(REPORT,report)
    from audit_quiz_v4_stage1_sources import main as audit_stage1_sources
    audit_stage1_sources()
    if args.audit:
        print("PASS_KIDS_V4_OLDER_STAGE1_NO_CREDIT_PREFLIGHT "+
              json.dumps(report,ensure_ascii=False),flush=True)
        return
    # Existing approved 450 canonical answers are verified by SHA; only acknowledge
    # that original review, do not request an unnecessary second review. Credit
    # expenditure remains separately and explicitly authorized.
    # neither is inferred from previous messages or from the JSON preflight.
    check(os.getenv("KIDS_V4_STAGE1_APPROVED_CANONICAL_450")=="YES",
          "requires acknowledgement of existing approved original 450 questions, without repeating the old review")
    check(os.getenv("KIDS_V4_STAGE1_EXPLICIT_SPEND_APPROVAL")=="YES",
          "requires explicit paid-credit authorization for this run")
    check(os.getenv("KIDS_V4_STAGE1_EXPECTED_BATCH_SHA256","").strip()==paid_snapshot,
          "batch SHA does not match actual voice, current source texts, paid ledger and next ten originals; re-audit and re-authorize, NO credits spent")
    hold=read(ROOT/"kids/data/quiz-v4-pronunciation-hold.json")
    check(hold.get("productionPaused") is False and hold.get("dictionaryProviderVerified") is True
          and hold.get("ownerRestartAuthorized") is True,
          "PRONUNCIATION_HOLD: current provider lexicon/Arabic Fuṣḥā must be verified before paid V4; no more bad takes")
    check(hold.get("humanPronunciationApproved") is False,
          "do not falsely mark previous spoken audio as human-approved")
    check(bool(selected),"first 65 already recorded; no further purchases")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"provider credential absent")
    # Initial resumed production is ONLY ONE sample; no uncontrolled 10-take
    # series until it is heard with the user's authentic dictionary.
    sample_only=os.getenv("KIDS_V4_STAGE1_SAMPLE_ONLY")=="YES"
    if sample_only:
        existing_journal=read(ATTEMPTS) if ATTEMPTS.is_file() else {"entries":[]}
        check(not any(x.get("dictionaryPilot20261019") is True for x in existing_journal.get("entries",[])),
              "one-time master dictionary V4 hearing pilot was already attempted; no second paid sample")
        old_usage=read(USAGE) if USAGE.is_file() else {"runs":[]}
        check(not any(x.get("isSingleDictionaryPilot") is True for x in old_usage.get("runs",[])),
              "one-time owner pilot already billed; hearing QA required before new credits")
    # The ONE hearing pilot must actually exercise the owner's canonical
    # Qurʾān pronunciation rule, not a generic German answer like "Das Gebet".
    # Choose only within the SAME already-fingerprinted, genuinely new ten
    # original phrases; all prior paid/quarantined texts remain protected.
    if sample_only:
        eligible_pilot=[x for x in selected
                        if "Qurʾān" in x["spokenText"] and "Wuḍūʾ" in x["spokenText"]]
        check(len(eligible_pilot)==1,
              "Qurʾān/Wuḍūʾ new exact V4 original missing from approved SHA sequence")
        batch_to_record=eligible_pilot
    else:
        batch_to_record=selected
    if not sample_only:
        if hold.get("humanListeningQualityGateReleased") is not True:
            # User has explicitly renewed the order to finish all 450. Permit
            # only ONE safely bounded <=10-original, <=240-estimated-credit
            # internal recording wave, WITHOUT claiming that anyone listened.
            check(os.getenv("KIDS_V4_STAGE1_OWNER_CORRECT_DICTIONARY_BATCH")=="YES"
                  and hold.get("ownerExplicitlyRequestedContinuedPaidQuizProduction") is True
                  and hold.get("allowOneStrictTenOriginalDictionaryBatchBeforeListeningApproval") is True
                  and hold.get("maximumPreHearingAdditionalNewOriginals")==10
                  and hold.get("maximumPreHearingAdditionalEstimatedCredits")==240
                  and len(batch_to_record)<=10,
                  "Only one explicit 10-take owner-authorized V4 dictionary wave; full production still quality gated")
            previous=read(USAGE) if USAGE.is_file() else {"runs":[]}
            check(not any(x.get("isOwnerPostPilotTenTake") is True for x in previous.get("runs",[])),
                  "Owner-approved post-pilot 10-take wave previously charged; NO second wave without reconciliation")
            check(any(x.get("dictionaryPilot20261019") is True
                      and x.get("status")=="ORIGINAL_MP3_SAVED"
                      and x.get("mp3SHA256") and x.get("providerRequestId")
                      for x in read(ATTEMPTS)["entries"]),
                  "No authentic 10099-rule pilot original safely checkpointed")
    run_estimate=round(sum(len(x["spokenText"])*RATE_FOR_ESTIMATE_ONLY for x in batch_to_record),2)
    if not sample_only and hold.get("humanListeningQualityGateReleased") is not True:
        check(run_estimate<=240,
              "Estimated owner-directed pilot-follow-up batch exceeds 240-credit ceiling")
    available=subscription(key)
    check(available>=required_subscription_credits(run_estimate),
          "insufficient provider credits for THIS small batch plus safety margin; no paid calls started")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    completed=0
    # New texts are not reselected from the global pending list: the exact
    # stage-1 source texts are the sole allowed billable candidates.
    for item in batch_to_record:
        text=item["spokenText"]
        prohibit_prepaid_selection(text,protected)
        check(text not in reg["textClips"],"cannot re-record existing original")
        digest=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        path=OUTPUT/(digest[:32]+".mp3")
        check(not path.exists(),"original audio exists without ledger; DO NOT REGENERATE")
        # Mark uncertainty BEFORE the request: a failed or timed-out paid
        # POST might have consumed credits without returning an MP3.
        previous_usage=read(USAGE) if USAGE.is_file() else {}
        journal=read(ATTEMPTS) if ATTEMPTS.is_file() else previous_usage.get("requestJournal") or {
            "schemaVersion":1,"modelId":MODEL,"voiceId":VOICE,
            "purpose":"DO_NOT_REGENERATE_UNCERTAIN_PAID_REQUESTS","entries":[]}
        attempt={"textSHA256":sha(text),
                 "dictionaryPilot20261019":sample_only,
                 "status":"REQUEST_STARTED_UNCONFIRMED",
                 "startedAt":datetime.now(timezone.utc).isoformat(),
                 "batchId":BATCH}
        check(not any(z["textSHA256"]==sha(text) for z in journal["entries"]),
              "prior paid request logged for this text, no new POST allowed")
        journal["entries"].append(attempt)
        durable_attempts(journal)
        persist_remote_paid_checkpoint(USAGE,ATTEMPTS,
                                       purpose="request-"+sha(text)[:12])
        # On any ambiguous provider/network exception, keep the marker.
        # Recovery occurs through actual historical/provider bytes, never TTS.
        audio,request_id=original_mp3(key,text)
        # Persist the charged MP3 bytes EVEN when the provider omitted a
        # request ID: a lost receipt must NEVER trigger a second purchase.
        temporary=path.with_name(path.name+".pending")
        temporary.write_bytes(audio)
        temporary.replace(path)
        audiosha=hashlib.sha256(audio).hexdigest()
        reg["textClips"][text]={
            "url":"/"+str(path.relative_to(ROOT)),"sha256":audiosha,
            "textSha256":sha(text),"bytes":len(audio),
            "voiceId":VOICE,"modelId":MODEL,
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "source":"official-direct-v4-text-to-speech-api",
            "status":"completed-original-mp3-on-review-branch-not-live",
            "providerRequestId":request_id,
            "pronunciationDictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
            "pronunciationDictionaryVersionId":"wSzgkGpAwEDiTak8DApc",
            "pronunciationLanguageCode":"de",
            "pronunciationMasterRuleCount":10099,
            "pronunciationQualityApproved":False}
        ledger["rows"].append({
            "batchId":BATCH,"text":text,"textSha256":sha(text),
            "estimatedCreditsAtObservedRate":round(len(text)*RATE_FOR_ESTIMATE_ONLY,4),
            "exactBilledCredits":None,"mp3Sha256":audiosha,
            "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
            "pronunciationDictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
            "pronunciationDictionaryVersionId":"wSzgkGpAwEDiTak8DApc",
            "pronunciationLanguageCode":"de",
            "note":"Original V4; audit exact provider billing; no blind retries"})
        write(REG,reg);write(LEDGER,ledger)
        attempt["status"]="ORIGINAL_MP3_SAVED"
        attempt["mp3SHA256"]=audiosha
        attempt["providerRequestId"]=request_id
        durable_attempts(journal)
        persist_remote_paid_checkpoint(REG,LEDGER,USAGE,ATTEMPTS,path,
                                       purpose="original-"+sha(text)[:12])
        if not request_id:
            raise RuntimeError("Paid MP3 bytes were saved without a provider request ID. Preserve runner artifact, reconcile manually; NEVER RETRY this text.")
        completed+=1
        print("PAID_V4_STAGE1_ORIGINAL_SAVED "+
              json.dumps({"count":completed,"sha256":audiosha,
                          "textSHA256":sha(text),"mp3Bytes":len(audio)}),flush=True)
    # Only after each genuine MP3 has been remotely checkpointed: read account
    # consumption for a useful estimate. Other activity may affect the delta.
    # Failed billing GET must never discard or cause a repeat paid original.
    balance_after=None
    try:
        balance_after=subscription(key)
    except Exception:
        print("KIDS_V4_PROVIDER_BILLING_GET_UNAVAILABLE: originals already saved, do NOT regenerate",flush=True)
    observed_delta=(round(max(0.0,available-balance_after),2)
                    if balance_after is not None else None)
    summary={"batchId":BATCH,"newOriginalsThisRun":completed,
             "estimatedCreditsNotProviderBill":run_estimate,
             "isSingleDictionaryPilot":sample_only,
             "isOwnerPostPilotTenTake":not sample_only and hold.get("humanListeningQualityGateReleased") is not True,
             "masterDictionaryRules":10099,
             "startingAvailableCreditsFromSubscription":round(available,2),
             "endingAvailableCreditsFromSubscription":(round(balance_after,2) if balance_after is not None else None),
             "observedSubscriptionUsageDeltaNotInvoice":observed_delta,
             "minimumStartCreditsRequiredForThisBatch":required_subscription_credits(run_estimate),
             "remainingStage1Originals":len(missing)-completed,
             "exactBilledCreditsUnknown":True,"live":False,
             "humanListeningApproved":False}
    prior=read(USAGE) if USAGE.is_file() else {"batchId":BATCH,"runs":[]}
    prior["runs"].append(summary);write(USAGE,prior)
    print("PAID_V4_STAGE1_NO_REPEATS "+json.dumps(summary),flush=True)

if __name__=="__main__":main()
