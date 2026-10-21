#!/usr/bin/env python3
"""Owner-authorized private 450 quiz production; never blindly retry a charged POST.

Reuses the vetted exact-source planner and eleven_v4 master-dictionary POST.
Before EACH POST, the existing producer pushes the SHA-journal to GitHub;
AFTER EACH successful POST it pushes the original MP3+receipt to GitHub.
This driver repeats distinct bounded waves, checks account balance on every
wave, and commits private composed-question manifests. No public release and
NO claim of human listening approval.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import produce_quiz_v4_450_exact_manual_wave as wave
from generate_quiz_v4_450_paid_batch02 import subscription

BRANCH="review/kids-quiz-v4-batch-001-020-20261014"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
PROGRESS=ROOT/"kids/review-only/quiz-v4-450-owner-bulk-progress.json"
MAX_WAVES=150
MAX_TOTAL_ESTIMATED_CREDITS=80000.0
STAGE_PATHS=[
 "kids/data/quiz-v4-450-production-status.json",
 "kids/data/quiz-v4-450-saved-mp3-technical-qa.json",
 "kids/data/quiz-v4-first150-composed-preview.json",
 "kids/data/quiz-v4-first150-audio-status.json",
 "kids/data/quiz-v4-age7to10-composed-preview.json",
 "kids/data/quiz-v4-age7to10-offline-coverage.json",
 "kids/review-only/quiz-v4-450-actual-mp3-import.json",
 "kids/review-only/quiz-v4-450-actual-mp3-import-summary.json",
 "kids/assets/kids-quiz-audio/v4-first150-composed-review/",
 "kids/assets/kids-quiz-audio/v4-age7to10-composed-review/",
 "kids/review-only/quiz-v4-450-owner-bulk-progress.json",
]

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def check(ok,reason):
    if not ok:
        raise RuntimeError("KIDS_450_OWNER_BULK_SAFE_STOP: "+reason)

def git(*args, check_result=True):
    p=subprocess.run(["git",*args],cwd=ROOT,check=False,text=True,
                     capture_output=True,timeout=100)
    if check_result and p.returncode:
        raise RuntimeError("Git "+args[0]+" failed: "+p.stderr[-800:])
    return p

def blob(path):
    return git("hash-object",str(path.relative_to(ROOT))).stdout.strip()

def invoke(script,*args):
    subprocess.run([sys.executable,str(ROOT/"kids/tools"/script),*args],
                   cwd=ROOT,check=True,timeout=1800)

def qa_and_push(progress):
    # Genuine already-billed MP3s have been individually checkpointed by
    # persist_remote_paid_checkpoint. This step only joins question playback.
    for tool in ("qa_quiz_v4_saved_mp3.py",
                 "quiz_v4_first150_offline_join.py",
                 "quiz_v4_age7to10_offline_join.py",
                 "report_quiz_v4_450_progress.py",
                 "stage_quiz_v4_existing_mp3_import.py"):
        invoke(tool)
    status=load(ROOT/"kids/data/quiz-v4-450-production-status.json")
    check(status["selectedTotal"]==450 and
          status["appReleaseFlagEnabled"] is False and
          load(RELEASE)["enabled"] is False,
          "private app release guard cannot be bypassed")
    progress["completeQuestions"]=status["completedQuestionsWithAllFourAudioParts"]
    progress["storedOriginalMP3s"]=status["uniqueNewOriginalMP3sStored"]
    progress["lastRecordedAt"]=datetime.now(timezone.utc).isoformat()
    wave.save(PROGRESS,progress)
    git("add","--",*STAGE_PATHS)
    if not git("diff","--cached","--quiet",check_result=False).returncode:
        return status
    git("config","user.name","tawhid-kids-v4-owner-bulk")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    git("commit","-m","audio(kids): compose only genuine SHA-protected master V4 originals [skip ci]")
    for n in range(5):
        pushed=git("push","origin","HEAD:"+BRANCH,check_result=False)
        if pushed.returncode==0:
            print("KIDS450_PRIVATE_MP3_APP_MAP_PUSHED completed="+str(progress["completeQuestions"]),
                  "originals="+str(progress["storedOriginalMP3s"]),flush=True)
            return status
        git("fetch","--no-tags","origin",BRANCH)
        rebased=git("rebase","--autostash","FETCH_HEAD",check_result=False)
        if rebased.returncode:
            # This commit contains ONLY derived quiz preview/coverage files.
            # Concurrent zero-credit quiz auditors routinely update the same
            # derived JSON; a generic rebase abort previously stopped bulk
            # production AFTER paid originals were safely checkpointed.
            # Never resolve conflicts in receipts, source plans, or MP3 originals.
            conflicted=[p for p in
                        git("diff","--name-only","--diff-filter=U").stdout.splitlines()
                        if p.strip()]
            approved_exact={
                "kids/data/quiz-v4-450-production-status.json",
                "kids/data/quiz-v4-450-saved-mp3-technical-qa.json",
                "kids/data/quiz-v4-first150-composed-preview.json",
                "kids/data/quiz-v4-first150-audio-status.json",
                "kids/data/quiz-v4-age7to10-composed-preview.json",
                "kids/data/quiz-v4-age7to10-offline-coverage.json",
                "kids/review-only/quiz-v4-450-actual-mp3-import.json",
                "kids/review-only/quiz-v4-450-actual-mp3-import-summary.json",
                "kids/review-only/quiz-v4-450-owner-bulk-progress.json",
            }
            approved_dirs=(
                "kids/assets/kids-quiz-audio/v4-first150-composed-review/",
                "kids/assets/kids-quiz-audio/v4-age7to10-composed-review/",
            )
            if not conflicted or any(
                p not in approved_exact and not p.startswith(approved_dirs)
                for p in conflicted
            ):
                git("rebase","--abort",check_result=False)
                raise RuntimeError(
                    "Non-derived paid/source conflict during Git rebase; "
                    "original paid MP3s remain checkpointed. Never retry TTS."
                )
            for p in conflicted:
                # During rebase, --theirs is the newly computed derived side.
                # Recreate derived outputs again after integrating latest HEAD.
                git("checkout","--theirs","--",p)
                git("add","--",p)
            continued=git("-c","core.editor=true","rebase","--continue",
                          check_result=False)
            if continued.returncode:
                git("rebase","--abort",check_result=False)
                raise RuntimeError(
                    "Derived quiz conflict cannot be safely reconciled; "
                    "original MP3s already stored. Never retry TTS."
                )
            # Revalidate and rebuild against all now-visible originals before
            # the next push. This operation makes ZERO ElevenLabs requests.
            for tool in ("qa_quiz_v4_saved_mp3.py",
                         "quiz_v4_first150_offline_join.py",
                         "quiz_v4_age7to10_offline_join.py",
                         "report_quiz_v4_450_progress.py",
                         "stage_quiz_v4_existing_mp3_import.py"):
                invoke(tool)
            refreshed=load(ROOT/"kids/data/quiz-v4-450-production-status.json")
            check(refreshed["selectedTotal"]==450 and
                  refreshed["appReleaseFlagEnabled"] is False and
                  refreshed["completedQuestionsWithAllFourAudioParts"]>=
                  progress["completeQuestions"],
                  "Concurrent rebase changed private audio coverage unexpectedly")
            git("add","--",*STAGE_PATHS)
            staged=git("diff","--cached","--quiet",check_result=False)
            if staged.returncode:
                git("commit","-m",
                    "audio(kids): refresh SHA-verified composed quiz after rebase [skip ci]")
            print("KIDS450_DERIVED_ONLY_REBASE_RESOLVED_WITH_ZERO_CREDITS",
                  len(conflicted),flush=True)
    raise RuntimeError("Private composition push rejected; paid originals protected, no paid retry")

def main():
    check(os.environ.get("GITHUB_ACTIONS")=="true" and
          os.environ.get("GITHUB_REF_NAME")==BRANCH,
          "only the exact owner-authorized GitHub review branch may spend")
    check(os.environ.get("KIDS_V4_OWNER_450_BULK_EXPLICIT")=="YES"
          and os.environ.get("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
          "owner explicit 450 credit authorization not present")
    check(wave.MAX_NEW_PER_CALL==25 and wave.MAX_ESTIMATED_CREDITS==1500,
          "bulk wave cap differs from strict reviewed settings")
    hold=load(HOLD)
    # Explicit owner rejection supersedes older bulk-spend consent.
    # Keep every saved original and receipt, but never start another paid take.
    check(hold.get("productionPaused") is False and
          hold.get("paidSpeechAuthorized") is True and
          hold.get("ownerRestartAuthorized") is True and
          hold.get("humanPronunciationApproved") is True,
          "owner reported wrong Quran/Fusha pronunciation; paid bulk production paused")
    check(hold.get("ownerBulkConsent20261020") is True and
          hold.get("ownerBulkHearingApprovalClaimed") is False and
          hold.get("ownerBulkTotalForecastCreditsMaximum")==MAX_TOTAL_ESTIMATED_CREDITS and
          hold.get("dictionaryProviderVerified") is True and
          hold.get("dictionaryRuleCount")==10099 and
          hold.get("dictionaryId")=="Q8w3SxtoVo8NSjsnlJEd" and
          hold.get("dictionaryVersionId")=="wSzgkGpAwEDiTak8DApc" and
          hold.get("modelId")=="eleven_v4" and
          hold.get("voiceId")=="DkU7j9uO4ZEtLD2iRZSH" and
          hold.get("humanListeningQualityGateReleased") is False and
          hold.get("publicQuizAudioReleaseAuthorized") is False and
          load(RELEASE)["enabled"] is False,
          "wrong master voice, Fuṣḥā lexicon, financial or human listening safety state")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"ElevenLabs API key missing")
    progress={"schemaVersion":1,"scope":"OWNER_ALL450_BULK_REVIEW_ONLY",
       "livePublished":False,"humanListeningApproved":False,
       "voiceId":wave.VOICE,"modelId":wave.MODEL,
       "dictionaryId":hold["dictionaryId"],"dictionaryVersionId":hold["dictionaryVersionId"],
       "maxForecastCredits":MAX_TOTAL_ESTIMATED_CREDITS,
       "estimatedCreditsCommittedThisRun":0.0,"waves":[]}
    total=0.0
    for i in range(MAX_WAVES):
        current_hold=load(HOLD)
        check(current_hold.get("productionPaused") is False and
              current_hold.get("paidSpeechAuthorized") is True and
              current_hold.get("ownerRestartAuthorized") is True and
              current_hold.get("humanPronunciationApproved") is True,
              "owner pronunciation stop is active, stop before another paid wave")
        try:
            queue,reg,ledger,protected,journal,items,report=wave.preflight()
        except RuntimeError as exc:
            msg=str(exc)
            if "all new original texts already saved" in msg or "no unique, pronunciation-safe original fits" in msg:
                progress["stopReason"]="NO_MORE_PRONUNCIATION_SAFE_ORIGINALS"
                print("KIDS450_STOP_NO_MORE_SAFE_ORIGINALS "+msg,flush=True)
                break
            raise
        forecast=float(report["nextEstimatedCreditsNotInvoice"])
        check(len(items)==report["nextOriginalCount"] and
              1<=len(items)<=25 and 0<forecast<=1500 and
              len({x["textSHA256"] for x in items})==len(items),
              "duplicate source or forecast batch above approved bound")
        if total+forecast>MAX_TOTAL_ESTIMATED_CREDITS:
            progress["stopReason"]="OWNER_FORECAST_LIMIT_REACHED"
            break
        available=subscription(key)
        if available < max(forecast*1.5,forecast+50):
            progress["stopReason"]="PROVIDER_PREPAID_CREDITS_INSUFFICIENT"
            progress["remainingProviderCreditsAtStop"]=available
            print("KIDS450_NO_CREDIT_PURCHASE_STOP available="+str(available),flush=True)
            break
        approved={
          "schemaVersion":1,"scope":"KIDS_450_USER_AUTHORIZED_20261020_ONE_WAVE",
          "oneTimeAuthorization":True,"authorizedByUserRequestDate":"2026-10-20",
          "maxNewOriginals":wave.MAX_NEW_PER_CALL,
          "maxEstimatedCredits":wave.MAX_ESTIMATED_CREDITS,
          "voiceId":wave.VOICE,"modelId":wave.MODEL,
          "dictionaryId":hold["dictionaryId"],
          "dictionaryVersionId":hold["dictionaryVersionId"],
          "expectedRegistryGitBlobSha":blob(wave.REG),
          "expectedLedgerGitBlobSha":blob(wave.LEDGER),
          "expectedPlanGitBlobSha":blob(wave.PLAN),
          "expectedHoldGitBlobSha":blob(HOLD),
          "exactBatchFingerprintSha256":report["userMustAuthorizeThisExactBatchFingerprintSHA256"],
          "exactTextSHA256":report["exactTextSHA256"],
          "estimatedCreditsNotInvoice":forecast,
          "noBlindRetry":True,"publicReleaseAllowed":False,
          "humanListeningApproved":False}
        check(len(approved["exactTextSHA256"])==len(set(approved["exactTextSHA256"])),
              "duplicate source SHA in paid wave")
        wave.save(wave.ONE_TIME_APPROVAL,approved)
        os.environ.update({
          "KIDS_V4_APPROVED_BATCH_FINGERPRINT":approved["exactBatchFingerprintSha256"],
          "KIDS_V4_APPROVED_REGISTRY_BLOB_SHA":approved["expectedRegistryGitBlobSha"],
          "KIDS_V4_APPROVED_LEDGER_BLOB_SHA":approved["expectedLedgerGitBlobSha"],
        })
        print("KIDS450_WAVE_START "+json.dumps({
            "wave":i+1,"newTexts":len(items),"estimatedCredits":forecast,
            "remainingProviderCredits":available,"fingerprint":approved["exactBatchFingerprintSha256"]
        }),flush=True)
        invoke("produce_quiz_v4_450_exact_manual_wave.py","--produce")
        total=round(total+forecast,2)
        progress["estimatedCreditsCommittedThisRun"]=total
        progress["waves"].append({
            "wave":i+1,"exactTextSHA256":approved["exactTextSHA256"],
            "forecastCreditsNotInvoice":forecast})
        qa_and_push(progress)
    else:
        progress["stopReason"]="MAX_150_WAVES_REACHED"
    print("KIDS450_BULK_RUN_FINISHED "+json.dumps({
      "wavesCompleted":len(progress["waves"]),
      "estimatedCreditsNotInvoice":total,
      "completeQuestions":progress.get("completeQuestions"),
      "storedOriginals":progress.get("storedOriginalMP3s"),
      "stopReason":progress.get("stopReason",""),
      "publicRelease":False,"humanListeningApproved":False
    }),flush=True)

if __name__=="__main__":
    main()
