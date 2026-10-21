#!/usr/bin/env python3
"""Manual, narrowly-authorized first pending wave of TAWḤĪD KIDS 450 V4 originals.

--audit NEVER spends credits. --produce is deliberately inaccessible without
two independent manual YES confirmations, current content/ledger SHA fingerprint,
provider key and enough available V4 speech credits. At most 25 distinct originals
are purchased per invocation. No repeat of historical prepaid text, silent paid
retries, public release, synthetic fallback, or false listening approvals.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/"kids/tools"))
import plan_quiz_v4_all450_exact_paid_original_waves as planner
from generate_quiz_v4_450_paid_batch02 import original_mp3, subscription, source_requires_separate_pronunciation_approval
from generate_quiz_v4_older_stage1_exact import persist_remote_paid_checkpoint
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection

VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
BATCH = "KIDS_V4_ALL450_MANUAL_EXACT_ORIGINAL_WAVE"
REG = ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER = ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
PLAN = ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
OUT = ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
JOURNAL = ROOT/"kids/data/quiz-v4-all450-paid-wave-request-journal.json"
BACKUP = ROOT/"kids/data/quiz-v4-all450-paid-wave-usage-backup.json"
REPORT = ROOT/"kids/review-only/quiz-v4-all450-next-exact-paid-wave.json"
ONE_TIME_APPROVAL = ROOT/"kids/review-only/quiz-v4-20261020-one-wave-authorization.json"
# Standard audited one-wave mode stays at ten originals / 240 forecast credits.
# Only an explicitly authorized, serialized GitHub 450-owner job may raise
# the per-wave bound; per-text paid GitHub checkpoints are still mandatory.
OWNER_450_BULK = os.getenv("KIDS_V4_OWNER_450_BULK_EXPLICIT") == "YES"
MAX_NEW_PER_CALL = 25 if OWNER_450_BULK else 10
MAX_ESTIMATED_CREDITS = 1500.0 if OWNER_450_BULK else 240.0


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def save(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    temp = p.with_name(p.name + ".pending")
    temp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n", encoding="utf-8")
    temp.replace(p)


def require(ok, reason):
    if not ok:
        raise RuntimeError("PAID_V4_ALL450_STOP_BEFORE_REBUY: "+reason)


def hashtext(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def journal_safe(registry):
    old_backup=load(BACKUP) if BACKUP.is_file() else {}
    old_log=load(JOURNAL) if JOURNAL.is_file() else old_backup.get("requestJournal") or {
        "schemaVersion":1,"modelId":MODEL,"voiceId":VOICE,
        "purpose":"NO_RETRY_OF_ANY_AMBIGUOUS_PAID_REQUEST","entries":[]}
    if JOURNAL.is_file() and old_backup.get("requestJournal"):
        require(old_log==old_backup["requestJournal"],
                "request journal differs from previous durable paid backup")
    require(old_log.get("modelId")==MODEL and old_log.get("voiceId")==VOICE and
            isinstance(old_log.get("entries"),list),
            "paid attempt journal source invalid")
    seen=set()
    for item in old_log["entries"]:
        h=item.get("textSHA256")
        require(isinstance(h,str) and len(h)==64 and h not in seen,
                "ambiguous repeated paid POST entry")
        seen.add(h)
        if item.get("status")=="REQUEST_STARTED_UNCONFIRMED":
            require(False,"old charged original has unconfirmed outcome "+h+
                    "; recover provider MP3 from earlier paid request, NEVER BUY AGAIN")
        require(item.get("status")=="ORIGINAL_MP3_SAVED",
                "unknown paid request state; refuse purchases")
        text=item.get("text")
        require(isinstance(text,str) and hashtext(text)==h,
                "saved paid journal lost source text")
        saved=registry["textClips"].get(text)
        require(saved and saved["sha256"]==item.get("mp3SHA256"),
                "previously paid MP3 not present in source registry")
    return old_log


def keep_journal(log):
    backup=load(BACKUP) if BACKUP.is_file() else {
        "schemaVersion":1,"modelId":MODEL,"voiceId":VOICE,"runs":[]}
    require(backup.get("modelId")==MODEL and backup.get("voiceId")==VOICE and
            isinstance(backup.get("runs"),list),
            "paid backup source corrupted")
    backup["requestJournal"]=log
    save(BACKUP,backup)
    save(JOURNAL,log)


def preflight():
    queue=planner.build()
    reg,ledger=load(REG),load(LEDGER)
    protected=protect_paid_texts(ROOT,reg,ledger)
    attempts=journal_safe(reg)
    require(queue["modelId"]==MODEL and queue["voiceId"]==VOICE and
            queue["selectedQuizQuestions"]==450 and
            queue["publicQuizReleaseEnabled"] is False,
            "wrong full quiz plan")
    waves=queue["recordingWaves"]
    require(bool(waves),"all new original texts already saved")
    # The recording plan orders pending texts across MANY immutable waves.
    # A first wave can contain only separately-held Arabic terms or texts
    # exceeding the narrower paid cap, while later waves contain safe texts.
    # Scan the full pending queue in deterministic order, never relax the
    # pronunciation hold, the original text SHA or the per-wave credit cap.
    texts=[]
    bounded_credits=0.0
    for planned_wave in waves:
        for candidate in planned_wave["exactTexts"]:
            if len(texts)>=MAX_NEW_PER_CALL:
                break
            if source_requires_separate_pronunciation_approval(candidate["text"]):
                continue
            cost=round(len(candidate["text"])*planner.ESTIMATE_CREDITS_PER_CODEPOINT,4)
            if bounded_credits+cost>MAX_ESTIMATED_CREDITS:
                continue
            texts.append(candidate)
            bounded_credits+=cost
        if len(texts)>=MAX_NEW_PER_CALL:
            break
    bounded_credits=round(bounded_credits,2)
    require(1<=len(texts)<=MAX_NEW_PER_CALL and
            0<bounded_credits<=MAX_ESTIMATED_CREDITS and
            len({x["textSHA256"] for x in texts})==len(texts),
            "no unique, pronunciation-safe original fits user credit cap")
    for item in texts:
        s=item["text"]
        require(hashtext(s)==item["textSHA256"],
                "exact immutable V4 utterance changed")
        require(s not in reg["textClips"],"already stored paid V4 MP3 selected")
        prohibit_prepaid_selection(s,protected)
    require(not any(x["textSHA256"] in {r["textSHA256"] for r in attempts["entries"]}
                    for x in texts),
            "a previously attempted paid speech item was selected again")
    source_hash=hashlib.sha256(
        PLAN.read_bytes()+b"\0"+REG.read_bytes()+b"\0"+LEDGER.read_bytes()+b"\0"+
        json.dumps([x["textSHA256"] for x in texts],separators=(",",":")).encode("utf-8")
    ).hexdigest()
    report={
        "scope":"KIDS_450_FIRST_PENDING_ORIGINAL_WAVE_MANUAL",
        "modelId":MODEL,"voiceId":VOICE,
        "totalSelectedQuestions":450,
        "remainingDistinctSpeechOriginals":queue["trulyUnrecordedDistinctTextCount"],
        "plannedManualWavesRemaining":queue["recordingWaveCount"],
        "nextOriginalCount":len(texts),
        "nextEstimatedCreditsNotInvoice":bounded_credits,
        "perWaveMaximumEstimatedCredits":MAX_ESTIMATED_CREDITS,
        "exactTextSHA256":[x["textSHA256"] for x in texts],
        "userMustAuthorizeThisExactBatchFingerprintSHA256":source_hash,
        "humanContentReviewRequired":True,
        "humanPronunciationReviewRequiredAfterGeneration":True,
        "creditPurchasePerformedByAudit":False,
        "synthesisAuthorizedByAudit":False,
        "newCreditsSpentByAudit":0,
        "newMP3sGeneratedByAudit":0,
        "historicalPaidNineRegenerationBlocked":True,
        "publicReleaseAllowed":False}
    return queue,reg,ledger,protected,attempts,texts,report


def main():
    ap=argparse.ArgumentParser()
    group=ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--audit",action="store_true")
    group.add_argument("--produce",action="store_true")
    args=ap.parse_args()
    queue,reg,ledger,protected,journal,items,report=preflight()
    save(REPORT,report)
    if args.audit:
        print("KIDS_450_V4_NO_CREDIT_PREFLIGHT "+
              json.dumps(report,ensure_ascii=False),flush=True)
        return
    approval=load(ONE_TIME_APPROVAL)
    require(approval.get("scope")=="KIDS_450_USER_AUTHORIZED_20261020_ONE_WAVE" and
            approval.get("oneTimeAuthorization") is True and
            approval.get("maxNewOriginals")==MAX_NEW_PER_CALL and
            approval.get("maxEstimatedCredits")==MAX_ESTIMATED_CREDITS and
            approval.get("modelId")==MODEL and approval.get("voiceId")==VOICE and
            approval.get("publicReleaseAllowed") is False,
            "not the exact one-time owner-approved 2026-10-20 batch")
    require(approval.get("expectedRegistryGitBlobSha") ==
            os.getenv("KIDS_V4_APPROVED_REGISTRY_BLOB_SHA") and
            approval.get("expectedLedgerGitBlobSha") ==
            os.getenv("KIDS_V4_APPROVED_LEDGER_BLOB_SHA"),
            "authorization is not pinned to current original and ledger snapshot")
    require(approval.get("exactBatchFingerprintSha256") ==
            report["userMustAuthorizeThisExactBatchFingerprintSHA256"],
            "authorization no longer matches exact uncharged V4 speech texts")
    require(os.getenv("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
            "run lacks the user's explicit consent to spend credits")
    require(os.getenv("KIDS_V4_HUMAN_SOURCE_CHECK")=="YES",
            "previously approved immutable canonical question/source review must be acknowledged")
    require(os.getenv("KIDS_V4_APPROVED_BATCH_FINGERPRINT","")==
            report["userMustAuthorizeThisExactBatchFingerprintSHA256"],
            "outdated source/voice/cost SHA or source changed, NO PURCHASE")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    require(bool(key),"ElevenLabs API key not available")
    available=subscription(key)
    estimate=report["nextEstimatedCreditsNotInvoice"]
    require(0<estimate<=MAX_ESTIMATED_CREDITS and len(items)<=MAX_NEW_PER_CALL,
            "user one-wave spend ceiling exceeded before any provider call")
    require(available>=max(estimate*1.5,estimate+50.0),
            "insufficient provider credits for current exact V4 wave plus proportional reserve")
    OUT.mkdir(parents=True,exist_ok=True)
    count=0
    for item in items:
        s=item["text"];h=item["textSHA256"]
        prohibit_prepaid_selection(s,protected)
        require(s not in reg["textClips"],"do not buy existing original")
        target=OUT/(hashlib.sha256((VOICE+"\n"+MODEL+"\n"+s).encode()).hexdigest()[:32]+".mp3")
        require(not target.exists(),"a paid original already exists without a registered receipt")
        # Persist uncertainty BEFORE sending the paid POST. A timeout can
        # consume credits; it must NEVER lead to blind retry.
        logitem={"text":s,"textSHA256":h,"batchId":BATCH,
                 "status":"REQUEST_STARTED_UNCONFIRMED",
                 "startedAt":datetime.now(timezone.utc).isoformat()}
        require(not any(x["textSHA256"]==h for x in journal["entries"]),
                "paid request already attempted")
        journal["entries"].append(logitem)
        keep_journal(journal)
        # HARD ANTI-DOUBLE-CHARGE CONTRACT: request uncertainty must be
        # durably committed and pushed BEFORE any paid ElevenLabs HTTP POST.
        # A GitHub permission/race failure blocks speech without a charge.
        persist_remote_paid_checkpoint(JOURNAL,BACKUP,
                                       purpose="all450-request-"+h[:12])
        audio,request_id=original_mp3(key,s)
        temp=target.with_name(target.name+".pending")
        temp.write_bytes(audio)
        temp.replace(target)
        audiosha=hashlib.sha256(audio).hexdigest()
        reg["textClips"][s]={
          "url":"/"+str(target.relative_to(ROOT)),"sha256":audiosha,
          "textSha256":h,"bytes":len(audio),"voiceId":VOICE,"modelId":MODEL,
          "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
          "providerRequestId":request_id,"source":"exact-user-approved-paid-v4-direct-mp3",
          "status":"REVIEW_ONLY_NOT_PUBLIC"}
        ledger["rows"].append({
          "batchId":BATCH,"text":s,"textSha256":h,
          "estimatedCreditsAtObservedRate":round(len(s)*planner.ESTIMATE_CREDITS_PER_CODEPOINT,4),
          "exactBilledCredits":None,"mp3Sha256":audiosha,
          "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
          "note":"Official V4 paid original, no blind retries; verify invoice separately"})
        save(REG,reg);save(LEDGER,ledger)
        logitem["status"]="ORIGINAL_MP3_SAVED"
        logitem["mp3SHA256"]=audiosha
        logitem["providerRequestId"]=request_id
        keep_journal(journal)
        persist_remote_paid_checkpoint(REG,LEDGER,JOURNAL,BACKUP,target,
                                       purpose="all450-original-"+h[:12])
        require(bool(request_id),
                "provider omitted charge receipt; paid MP3 backed up, stop before next request")
        count+=1
        print("KIDS_V4_NEW_GENUINE_ORIGINAL_SAVED "+json.dumps({
            "count":count,"textSHA256":h,"mp3SHA256":audiosha,"bytes":len(audio)
        }),flush=True)
    backup=load(BACKUP)
    backup["runs"].append({
        "recordedOriginals":count,
        "plannedEstimateNotInvoice":report["nextEstimatedCreditsNotInvoice"],
        "humanListeningApproved":False,"publicReleaseAllowed":False,
        "endedAt":datetime.now(timezone.utc).isoformat()})
    save(BACKUP,backup)
    print("KIDS_V4_450_MANUAL_WAVE_SAVED "+str(count),flush=True)


if __name__=="__main__":
    main()
