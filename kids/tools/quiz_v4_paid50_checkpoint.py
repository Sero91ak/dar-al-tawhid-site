#!/usr/bin/env python3
"""Durable per-take paid V4 checkpoint for a single 50-original review batch.

The write-ahead marker MUST be committed before each potentially billable POST.
After each returned MP3, bytes, their SHA256 and the receipt are committed
BEFORE the next POST. An uncertain provider response is never retried.
Requires same-repository GitHub Actions with write access to the review branch.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path

REVIEW="review/kids-quiz-v4-batch-001-020-20261014"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_450_BATCH_04_50"
MAX_NEW=50
JOURNAL=Path("kids/data/quiz-v4-450-batch04-attempts.json")

def load():
    if JOURNAL.exists():
        data=json.loads(JOURNAL.read_text(encoding="utf-8"))
        if data.get("voiceId")!=VOICE or data.get("modelId")!=MODEL or data.get("batchId")!=BATCH:
            raise RuntimeError("Original V4 checkpoint contract changed; NEVER repeat charged audio")
        if not isinstance(data.get("attempts"),list) or len(data["attempts"])>MAX_NEW:
            raise RuntimeError("Invalid existing fifty-take journal")
        hashes=[x.get("textSha256") for x in data["attempts"]]
        if len(set(hashes))!=len(hashes):
            raise RuntimeError("Duplicate text in recorded paid requests")
        return data
    return {"schemaVersion":1,"batchId":BATCH,"voiceId":VOICE,"modelId":MODEL,
            "reviewOnly":True,"live":False,"attempts":[]}

def command(*args):
    return subprocess.run(list(args),check=True,stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE,text=True)

def commit_checkpoint(*paths):
    if os.environ.get("GITHUB_ACTIONS")!="true":
        raise RuntimeError("Paid original requires durable GitHub Actions checkpoint")
    if os.environ.get("GITHUB_REF_NAME")!=REVIEW:
        raise RuntimeError("Wrong GitHub review branch for paid audio")
    command("git","config","user.name","tawhid-kids-v4-50-originals-checkpoint")
    command("git","config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    existing=[str(x) for x in paths if Path(x).exists()]
    if existing:
        command("git","add","--",*existing)
    changed=command("git","diff","--cached","--name-only").stdout.strip()
    if not changed:
        return
    command("git","commit","-m","audio(kids V4): preserve 50er paid original attempt or MP3 receipt, review only")
    for i in range(4):
        try:
            command("git","push","origin","HEAD:"+REVIEW)
            return
        except subprocess.CalledProcessError:
            command("git","fetch","origin",REVIEW)
            try:
                command("git","rebase","FETCH_HEAD")
            except subprocess.CalledProcessError as exc:
                raise RuntimeError("Checkpoint conflict. Stop paid POST and recover already-paid artifacts, NEVER retry.") from exc
    raise RuntimeError("Could not persist paid MP3 checkpoint to GitHub. Stop synthesis.")


def reserve_batch(selected_hashes):
    """Push all 50 exact SHA reservations ONCE before any potentially paid call.

    If a runner crashes, the remote journal blocks accidental re-purchase;
    recover the actual MP3s from original provider history and runner artifact.
    """
    if len(selected_hashes)!=MAX_NEW or len(set(selected_hashes))!=MAX_NEW:
        raise RuntimeError("Exactly 50 distinct new original texts required")
    if JOURNAL.exists():
        raise RuntimeError("An earlier paid 50er batch is already reserved. Reconcile originals before any more charges")
    data=load()
    data["approvedSelection"]=selected_hashes
    data["attempts"]=[{"textSha256":d,"status":"RESERVED_BEFORE_BILLING"} for d in selected_hashes]
    JOURNAL.parent.mkdir(parents=True,exist_ok=True)
    JOURNAL.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    commit_checkpoint(JOURNAL)
    return data

def record_before_post(spoken,selected_hashes):
    data=load()
    if data.get("approvedSelection")!=selected_hashes:
        raise RuntimeError("Prepared 50 original SHA selection changed; stop payment")
    digest=hashlib.sha256(spoken.encode("utf-8")).hexdigest()
    matches=[z for z in data["attempts"] if z["textSha256"]==digest]
    if len(matches)!=1 or matches[0]["status"]!="RESERVED_BEFORE_BILLING":
        raise RuntimeError("Original may already be charged or previously attempted; NO REBUY")
    matches[0]["status"]="SUBMITTED_UNKNOWN_RESULT"
    JOURNAL.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    return digest

def record_returned_mp3(textsha,mp3sha,filepath,registry_path,ledger_path,request_id):
    data=load()
    matches=[x for x in data["attempts"] if x["textSha256"]==textsha]
    if len(matches)!=1 or matches[0]["status"]!="SUBMITTED_UNKNOWN_RESULT":
        raise RuntimeError("Cannot reconcile original paid MP3 receipt; NEVER RETRY")
    matches[0].update({"status":"ORIGINAL_MP3_SAVED",
                       "mp3Sha256":mp3sha,"providerRequestId":request_id})
    JOURNAL.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    if not Path(filepath).exists() or not Path(registry_path).exists() or not Path(ledger_path).exists():
        raise RuntimeError("Original MP3 bytes or paid ledger missing after charged POST")
