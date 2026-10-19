#!/usr/bin/env python3
"""Zero-credit, read-only forensic QA of already generated Stage-1 V4 originals.

Cross-checks the provider POST journal, backed-up journal, charged ledger,
voice registry, and REAL on-disk MP3 bytes. Never calls ElevenLabs and never
changes the existing 450 questions, their recordings, or the live app.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
STAGE=ROOT/".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
USAGE=ROOT/"kids/data/quiz-v4-older-stage1-usage.json"
JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
REPORT=ROOT/"kids/review-only/quiz-v4-older-stage1-paid-mp3-receipt-audit.json"

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def ensure(cond,message):
    if not cond:
        raise RuntimeError("V4_STAGE1_REAL_PAID_AUDIO_INTEGRITY_FAIL: "+message)

def sha_text(x):
    return hashlib.sha256(x.encode("utf-8")).hexdigest()

def validate():
    original=read(STAGE)
    registry=read(REG)
    ledger=read(LEDGER)
    usage=read(USAGE) if USAGE.exists() else {"batchId":BATCH,"runs":[]}
    journal=read(JOURNAL) if JOURNAL.exists() else usage.get("requestJournal")
    ensure(read(RELEASE).get("enabled") is False,"public quiz release flag switched on")
    ensure(original.get("numberOfNewOriginalTexts")==65
           and original.get("numberOfQuestions")==20,
           "source 65/20-stage contract changed")
    ensure(registry.get("modelId")==MODEL and registry.get("voiceId")==VOICE
           and registry.get("live") is False
           and ledger.get("live") is False,
           "model, source voice, or private release guard changed")
    source={x["spokenTextSHA256"]:x["spokenText"]
            for x in original["originalTextRecordingQueue"]}
    ensure(len(source)==65,"original stage has duplicate source SHA")
    ensure(all(sha_text(t)==d for d,t in source.items()),
           "original text SHA mismatch")
    rows=[r for r in ledger["rows"] if r.get("batchId")==BATCH]
    ensure(len(rows)==len({r["textSha256"] for r in rows}),
           "a Stage1 original was billed more than once")
    recorded={r["textSha256"]:r for r in rows}
    ensure(set(recorded)<=set(source),"provider billed unexpected spoken text")
    ensure(usage.get("batchId")==BATCH and isinstance(usage.get("runs"),list),
           "write-ahead usage ledger unavailable or changed")
    if not rows:
        ensure(not journal or not journal.get("entries"),
               "unreconciled paid POST journal exists without ledger entry; stop")
        return {"schemaVersion":1,"totalNewOriginals":0,"sourceRemaining":65,
                "requestJournalReconciled":True,"realMP3BytesChecked":0,
                "newCreditsSpentByThisAudit":0,"publicReleaseAllowed":False}
    ensure(isinstance(journal,dict),"missing historical provider POST audit journal")
    ensure(journal.get("modelId")==MODEL and journal.get("voiceId")==VOICE,
           "invalid provider journal voice/model")
    if JOURNAL.exists() and usage.get("requestJournal"):
        ensure(journal==usage["requestJournal"],
               "checked-in journal differs from safeguarded backup")
    attempts=journal.get("entries")
    ensure(isinstance(attempts,list),"no original POST attempt records")
    ensure(len(attempts)==len({x.get("textSHA256") for x in attempts}),
           "multiple charged attempts reference a single original")
    uncertain=[x for x in attempts if x.get("status")=="REQUEST_STARTED_UNCONFIRMED"]
    saved_attempts=[x for x in attempts if x.get("status")=="ORIGINAL_MP3_SAVED"]
    ensure(len(saved_attempts)+len(uncertain)==len(attempts),
           "unknown provider paid POST journal status")
    ensure(len(saved_attempts)==len(rows) and
           {x["textSHA256"] for x in saved_attempts}==set(recorded),
           "saved provider requests diverge from real billed originals")
    uncertain_shas={x.get("textSHA256") for x in uncertain}
    ensure(uncertain_shas<=set(source) and not (uncertain_shas & set(recorded)),
           "unconfirmed paid POST collides with recorded original or unapproved text")
    for entry in uncertain:
        digest=entry["textSHA256"]
        text=source[digest]
        ensure(text not in registry["textClips"]
               and not entry.get("providerRequestId")
               and not entry.get("mp3SHA256"),
               "uncertain provider take has registered MP3 bytes; reconcile before use")
    visited_requests=set()
    sha_mp3=set()
    checked=[]
    for entry in saved_attempts:
        digest=entry["textSHA256"]
        row=recorded[digest]
        text=source[digest]
        provider_id=entry.get("providerRequestId")
        ensure(isinstance(provider_id,str) and provider_id and
               provider_id==row.get("providerRequestId") and
               provider_id not in visited_requests,
               "missing, repeated, or mismatched provider request receipt")
        visited_requests.add(provider_id)
        ensure(row.get("text")==text and sha_text(text)==digest,
               "billed text differs from approved original")
        rec=registry["textClips"].get(text)
        ensure(isinstance(rec,dict),"charged text missing original MP3 registry")
        ensure(rec.get("textSha256")==digest and rec.get("modelId")==MODEL
               and rec.get("voiceId")==VOICE and
               rec.get("providerRequestId")==provider_id,
               "original registry lost V4 voice, model, or provider receipt")
        audio_hash=row.get("mp3Sha256")
        ensure(isinstance(audio_hash,str) and len(audio_hash)==64 and
               audio_hash==entry.get("mp3SHA256")==
               rec.get("sha256") and audio_hash not in sha_mp3,
               "real audio hash mismatch or same bytes billed twice")
        sha_mp3.add(audio_hash)
        asset_url=rec.get("url","")
        ensure(asset_url.startswith("/kids/assets/kids-quiz-audio/v4-curated450-review/")
               and asset_url.endswith(".mp3"),
               "original paid audio points outside private review assets")
        path=ROOT/asset_url.lstrip("/")
        ensure(path.is_file(),"saved, billed original MP3 file missing")
        data=path.read_bytes()
        ensure(1500<len(data)<1500000 and
               (data.startswith(b"ID3") or data[:1]==b"\xff"),
               "saved original is empty, non-MP3, or implausibly sized")
        ensure(hashlib.sha256(data).hexdigest()==audio_hash and
               rec.get("bytes")==len(data),
               "actual original MP3 bytes differ from credited source hash")
        checked.append({"textSHA256":digest,"originalMP3SHA256":audio_hash,
                        "bytes":len(data),"voiceId":VOICE,"providerRequestId":provider_id,
                        "humanListeningApproved":False})
    total_recorded=len(checked)
    ensure(total_recorded<=65,"more paid Stage1 originals than approved")
    ensure(all(item.get("humanListeningApproved") is False for item in checked),
           "unreviewed technical originals may not count as human approved")
    # This is only a technical/accounting verification, not a claim that
    # audio was heard or that the provider's final credit invoice is known.
    return {"schemaVersion":1,"scope":"KIDS_V4_STAGE1_REAL_MP3_LEDGER_AND_JOURNAL_QA",
            "modelId":MODEL,"voiceId":VOICE,
            "totalOriginalTextsInApprovedFirstStage":65,
            "totalNewOriginals":total_recorded,
            "sourceRemaining":65-total_recorded,
            "requestJournalReconciled":True,
            "allPaidRequestsResolved":not uncertain,
            "uncertainOriginalRequestCount":len(uncertain),
            "uncertainOriginalRequestTextSHA256":sorted(uncertain_shas),
            "blockedFromDuplicatePaidRequests":True,
            "distinctProviderRequestIds":len(visited_requests),
            "realMP3BytesChecked":len(checked),
            "exactProviderCreditsReconciled":False,
            "newCreditsSpentByThisAudit":0,
            "humanListeningApprovalGranted":False,
            "publicReleaseAllowed":False,
            "originals":checked}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--report",action="store_true",
                        help="Write private accounting summary after full read-only QA")
    args=parser.parse_args()
    result=validate()
    if args.report:
        REPORT.parent.mkdir(parents=True,exist_ok=True)
        REPORT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",
                          encoding="utf-8")
    print("PASS: "+str(result["realMP3BytesChecked"])+
          " actual paid original V4 MP3s match file bytes, receipts and dual journals; "+
          "no paid provider operations, release off.")

if __name__=="__main__":
    main()
