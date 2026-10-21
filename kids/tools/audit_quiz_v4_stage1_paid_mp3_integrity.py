#!/usr/bin/env python3
"""Independent zero-credit audit of ACTUALLY saved older V4 originals.

Checks real on-disk MP3 bytes, paid POST receipts, write-ahead request journal,
stage1 source SHA, offline technical QA and the 450-question audio import.
No ElevenLabs network, no paid synthesis, no source/question rewriting.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
STAGE=ROOT/".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
USAGE=ROOT/"kids/data/quiz-v4-older-stage1-usage.json"
TECH=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
IMPORT=ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import-summary.json"
NEXT=ROOT/"kids/review-only/quiz-v4-older-stage1-next-recording-batch.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
REPORT=ROOT/"kids/review-only/quiz-v4-stage1-real-paid-mp3-integrity.json"

def read(p):
    return json.loads(p.read_text(encoding="utf-8"))
def require(ok,why):
    if not ok: raise RuntimeError("V4_STAGE1_REAL_MP3_INTEGRITY_FAILED: "+why)
def digest(data):
    return hashlib.sha256(data).hexdigest()

def verify():
    stage=read(STAGE);registry=read(REG);ledger=read(LEDGER)
    journal=read(JOURNAL);usage=read(USAGE)
    tech=read(TECH);imported=read(IMPORT);plan=read(NEXT)
    require(read(RELEASE)["enabled"] is False,"public review flag was enabled")
    require(registry["voiceId"]==VOICE and registry["modelId"]==MODEL
            and registry["live"] is False and ledger["live"] is False,
            "wrong master voice/model or unexpected release")
    require(tech["modelId"]==MODEL and tech["voiceId"]==VOICE
            and tech["overallTechnicalPass"] is True
            and tech["readyForLive"] is False
            and tech["allHumanListeningApproved"] is False
            and tech["synthesisCallsMade"]==0,"technical QA is missing or incorrectly marked")
    require(stage["numberOfNewOriginalTexts"]==65
            and stage["numberOfQuestions"]==20,"first twenty voice source unexpectedly changed")
    require(journal["voiceId"]==VOICE and journal["modelId"]==MODEL
            and usage["batchId"]==BATCH
            and usage.get("requestJournal")==journal,
            "charged POST journal not in existing 90-day GitHub action backup")
    expected={r["spokenTextSHA256"]:r["spokenText"] for r in stage["originalTextRecordingQueue"]}
    require(len(expected)==65,"original text SHA duplicate or missing")
    for textsha,spoken in expected.items():
        require(digest(spoken.encode("utf-8"))==textsha,
                "stage1 original source speech hash changed")
    rows=[r for r in ledger["rows"] if r.get("batchId")==BATCH]
    charged={r["textSha256"]:r for r in rows}
    require(len(charged)==len(rows),"same stage1 source text charged twice")
    attempts=journal.get("entries") or []
    statuses={"ORIGINAL_MP3_SAVED","REQUEST_STARTED_UNCONFIRMED"}
    seen=set();request_ids=set();real=[]
    qa={r["textSha256"]:r for r in tech["clips"]}
    require(len(qa)==len(tech["clips"])==tech["savedClipCount"]==len(registry["textClips"]),
            "technical MP3 QA count differs from original registry")
    for attempt in attempts:
        textsha=attempt["textSHA256"];status=attempt["status"]
        require(textsha in expected and textsha not in seen and status in statuses,
                "ambiguous or repeated paid original request")
        seen.add(textsha)
        spoken=expected[textsha]
        if status=="REQUEST_STARTED_UNCONFIRMED":
            require(textsha not in charged,
                    "uncertain provider response has a ledger receipt; reconcile the event")
            continue
        row=charged.get(textsha)
        require(row is not None and row["text"]==spoken
                and row["mp3Sha256"]==attempt["mp3SHA256"],
                "saved paid MP3 lacks matching original payment ledger")
        req=row.get("providerRequestId")
        require(isinstance(req,str) and req and req==attempt.get("providerRequestId")
                and req not in request_ids,
                "original has missing, repeated or mismatched provider request ID")
        request_ids.add(req)
        clip=registry["textClips"].get(spoken)
        require(clip is not None
                and clip.get("textSha256")==textsha and clip.get("sha256")==row["mp3Sha256"]
                and clip.get("voiceId")==VOICE and clip.get("modelId")==MODEL
                and clip.get("audioListeningApproved") is not True,
                "saved original text/voice or human-review flag mismatch")
        url=clip.get("url")
        require(isinstance(url,str)
                and re.fullmatch(r"/kids/assets/kids-quiz-audio/v4-curated450-review/[a-f0-9]{32}\.mp3",url),
                "unexpected external/original MP3 path")
        path=(ROOT/url.lstrip("/")).resolve()
        require(path.is_relative_to(ROOT.resolve()) and path.is_file(),
                "original paid MP3 missing on disk")
        audio=path.read_bytes()
        require(len(audio)==clip["bytes"] and digest(audio)==clip["sha256"],
                "original paid MP3 on-disk bytes differ from recorded SHA256")
        check=qa.get(textsha)
        require(check is not None and check.get("technicalPassed") is True
                and check.get("listeningApproved") is False
                and check.get("mp3Bytes")==len(audio)
                and check.get("durationSeconds",0)>0.3,
                "real original MP3 missing verified technical decode or falsely human approved")
        real.append({"textSha256":textsha,"mp3Sha256":clip["sha256"],
                     "bytes":len(audio),"durationSeconds":check["durationSeconds"],
                     "providerRequestId":req,"listeningApproved":False})
    require(seen==set(charged),"charged original text omitted from write-ahead safety journal")
    recorded=set(charged)
    require(len(recorded)+len(set(expected)-recorded)==65,
            "65-stage paid and still-pending originals mismatch")
    require(plan["remainingFirstStageOriginals"]==65-len(recorded)
            and plan["previouslyRecordedFirstStageOriginals"]==len(recorded),
            "next authorized paid batch selection is stale")
    require(set(plan["nextExactTextSha256"])<=set(expected)-recorded,
            "next batch would repurchase a previously charged V4 original")
    require(sum(int(r["newOriginalsThisRun"]) for r in usage["runs"])==len(real),
            "recorded stage1 run count and verified actual MP3 originals differ")
    require(imported["questionsStaged"]==450
            and imported["completeFourPartQuestions"]==sum(
                imported["byAge"][age]["completeFourPartQuestions"]
                for age in ("4-6","7-8","9-10")),
            "original 450 quiz MP3 staging map is inconsistent")
    return {
        "scope":"KIDS_V4_STAGE1_REAL_PAID_MP3_INTEGRITY_REVIEW_ONLY",
        "masterVoiceId":VOICE,"modelId":MODEL,
        "first20OlderQuizStagePlannedUniqueOriginals":65,
        "stageOriginalsActuallyPaidAndSaved":len(real),
        "stageOriginalsAmbiguousPaidRequestCount":sum(
            r["status"]=="REQUEST_STARTED_UNCONFIRMED" for r in attempts),
        "stageOriginalsRemaining":65-len(real),
        "stageOriginalMP3sPassedByteSHAAndTechnicalQA":len(real),
        "providerRequestIdsPresent":len(request_ids),
        "nextRecordingBatchUniqueTextCount":len(plan["nextExactTextSha256"]),
        "stagedFourPartQuizQuestions":imported["completeFourPartQuestions"],
        "ageBreakdown":{age:imported["byAge"][age]["completeFourPartQuestions"]
                        for age in ("4-6","7-8","9-10")},
        "humanListeningApproved":False,"publicReleaseAllowed":False,
        "newElevenLabsCallsByAudit":0,"newCreditsByAudit":0,
        "providerExactBilledCreditsReconciled":False,
        "verifiedOriginals":real,
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--save-report",action="store_true",
                        help="Write sanitized JSON proof within private review branch")
    args=parser.parse_args()
    report=verify()
    if args.save_report:
        REPORT.parent.mkdir(parents=True,exist_ok=True)
        REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: verified actual original V4 MP3 bytes + paid request journal "+
          json.dumps({"verifiedSaved":report["stageOriginalsActuallyPaidAndSaved"],
                      "remaining":report["stageOriginalsRemaining"],
                      "ambiguous":report["stageOriginalsAmbiguousPaidRequestCount"],
                      "fourPartQuiz":report["stagedFourPartQuizQuestions"],
                      "newCreditsSpent":0},ensure_ascii=False))

if __name__=="__main__":main()
