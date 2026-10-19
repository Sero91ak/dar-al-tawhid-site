#!/usr/bin/env python3
"""Zero-credit recording waves for the unfinished 65-original older-age stage.

Pure scheduling, NEVER a TTS producer. Each real paid workflow still requires
a fresh immutable registry+ledger fingerprint and both manual YES approvals.
Already-paid/unconfirmed texts are handled by the existing conservative guard.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import generate_quiz_v4_older_stage1_exact as stage1

ROOT=Path(__file__).resolve().parents[2]
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"


def build():
    registry,ledger,source,outstanding,protected=stage1.prepare()
    if source["numberOfNewOriginalTexts"]!=65 or len(source["questions"])!=20:
        raise RuntimeError("Unexpected approved older-age stage")
    if stage1.COUNT_PER_RUN!=10 or stage1.MAX_ESTIMATED_CREDITS_PER_RUN!=850.0:
        raise RuntimeError("Stage count/credit safeguard changed")
    if len(outstanding)>65 or len(outstanding)<0:
        raise RuntimeError("Invalid remainder")
    source_sha={q["spokenTextSHA256"] for q in source["originalTextRecordingQueue"]}
    missing_sha={q["spokenTextSHA256"] for q in outstanding}
    if len(source_sha)!=65 or len(missing_sha)!=len(outstanding) or not missing_sha<=source_sha:
        raise RuntimeError("Original stage text hashes changed")
    if any(x["spokenText"] in protected for x in outstanding):
        raise RuntimeError("Paid original wrongly placed in future recording waves")
    actually_stored=sum(x["spokenText"] in registry["textClips"]
                        for x in source["originalTextRecordingQueue"])
    reserved_sha=source.get("_reservedUnimportedTextSHA256",[])
    uncertain_sha=source.get("_uncertainPaidRequestTextSHA256",[])
    reserved=len(reserved_sha)
    uncertain=len(uncertain_sha)
    blocked=set(reserved_sha)|set(uncertain_sha)
    if (len(reserved_sha)!=len(set(reserved_sha)) or
            len(uncertain_sha)!=len(set(uncertain_sha)) or
            set(reserved_sha)&set(uncertain_sha) or
            blocked&missing_sha or
            not blocked<=source_sha or
            actually_stored+reserved+uncertain+len(outstanding)!=65):
        raise RuntimeError("Saved, reserved Flow, uncertain prior POST and genuinely new V4 classes overlap")
    # An unconfirmed previous POST is NOT a new unpaid original. ElevenLabs
    # might already have charged it: quarantine until original history GET or
    # paid-run backup proves whether actual bytes exist.
    # Reserved Flow takes are also NOT existing MP3s, and must not be bought twice.

    previous_paid=set(registry["textClips"])
    wave_rows=[]
    remaining=outstanding[:]
    visited=set()
    all_completed=set()
    while remaining:
        selected,estimate,complete=stage1.candidate_batch(remaining,source)
        hashes=[x["spokenTextSHA256"] for x in selected]
        if not hashes or len(hashes)>10 or estimate>850 or len(hashes)!=len(set(hashes)):
            raise RuntimeError("No finite zero-repurchase schedule under the fixed cap")
        if any(x["spokenText"] in previous_paid for x in selected):
            raise RuntimeError("Already saved original scheduled for another paid request")
        if visited.intersection(hashes):
            raise RuntimeError("Repeated original text scheduled in another wave")
        visited.update(hashes)
        remaining=[x for x in remaining if x["spokenTextSHA256"] not in visited]
        projected_new=set(complete)-all_completed
        all_completed.update(complete)
        wave_rows.append({
            "wave":len(wave_rows)+1,
            "uniqueNewOriginals":len(hashes),
            "exactTextSHA256":hashes,
            "estimatedCreditsNotAnInvoice":estimate,
            "couldCompleteQuestionIds":sorted(projected_new),
            "manualFreshFingerprintRequired":True,
            "automaticallyAuthorized":False,
        })
        if len(wave_rows)>7:
            raise RuntimeError("Unexpected number of remaining manual batches")
    if visited!=missing_sha or sum(w["uniqueNewOriginals"] for w in wave_rows)!=len(outstanding):
        raise RuntimeError("Schedule omitted or repeated original speech")
    if stage1.read(stage1.RELEASE).get("enabled") is not False:
        raise RuntimeError("Quiz release flag unexpectedly enabled")
    first=wave_rows[0] if wave_rows else None
    return {
        "schemaVersion":1,
        "scope":"TAWHID_KIDS_OLDER_STAGE1_ZERO_CREDIT_RECORDING_ROADMAP",
        "stageQuestionCount":20,
        "stageOriginalTextCount":65,
        "alreadyStoredStageOriginals":actually_stored,
        "reservedFlowOriginalsNotYetInGithub":reserved,
        "uncertainPreviousPaidRequestsQuarantined":uncertain,
        "uncertainRequestExactTextSHA256":sorted(uncertain_sha),
        "mustNotRebuyUncertainOriginals":True,
        "historyOrBackupRecoveryRequiredForUncertain":uncertain>0,
        "totalStillMissingOriginalMP3s":reserved+uncertain+len(outstanding),
        "newOriginalsEligibleForSeparatePaidApproval":len(outstanding),
        "unrecordedOriginals":len(outstanding),
        "manualWavesRemaining":len(wave_rows),
        "modelId":MODEL,
        "voiceId":VOICE,
        "newCreditsSpentByPlanner":0,
        "speechSynthesisCallsByPlanner":0,
        "humanContentApprovalProvided":False,
        "humanHearingApprovalProvided":False,
        "published":False,
        "estimatesAreNotProviderBills":True,
        "estimatedRemainingCredits":round(sum(w["estimatedCreditsNotAnInvoice"] for w in wave_rows),2),
        "earlierPrepaidNineMustNeverBeRegenerated":True,
        "reservedFlowTakesMustNotBeRegenerated":True,
        "providerStatusReconciliationRequiredForReserved":reserved>0,
        "wavesAfterFirstAreProvisionalUntilFreshRegistryAndLedgerAudit":True,
        "firstWaveRequiresActualCurrentAuditFingerprint":True,
        "recordingWaves":wave_rows,
        "sourceSHA256":hashlib.sha256(stage1.PREP.read_bytes()).hexdigest(),
        "notes":"Only original spoken texts missing from the 65-stage, no reruns of accepted quiz content; every wave requires explicit credit authorization and fresh preflight before paid POST.",
    }


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output",type=Path,help="Optional private JSON review artifact; no network calls")
    args=parser.parse_args()
    plan=build()
    data=json.dumps(plan,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(data,encoding="utf-8")
    print("KIDS_V4_ZERO_CREDIT_STAGE1_WAVES "+json.dumps({
        "missingOriginals":plan["totalStillMissingOriginalMP3s"],
        "alreadyStored":plan["alreadyStoredStageOriginals"],
        "reservedFlowNotImported":plan["reservedFlowOriginalsNotYetInGithub"],
        "previousPaidRequestUnconfirmed":plan["uncertainPreviousPaidRequestsQuarantined"],
        "newTextsEligibleAfterApproval":plan["newOriginalsEligibleForSeparatePaidApproval"],
        "manualWaves":plan["manualWavesRemaining"],
        "estimatedCreditsNotInvoice":plan["estimatedRemainingCredits"],
        "firstWaveQuestionsCouldComplete":plan["recordingWaves"][0]["couldCompleteQuestionIds"] if plan["recordingWaves"] else [],
        "newCreditsSpent":0,
    },ensure_ascii=False))


if __name__=="__main__":
    main()
