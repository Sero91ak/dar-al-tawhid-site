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
BATCH="KIDS_V4_450_BATCH_03_50"
MAX_NEW=50
JOURNAL=Path("kids/data/quiz-v4-450-batch03-attempts.json")

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

def record_before_post(spoken,selected_hashes):
    data=load()
    if not (len(selected_hashes)==MAX_NEW and len(set(selected_hashes))==MAX_NEW):
        raise RuntimeError("The first 50 billed source hashes must be immutable and distinct")
    if data.get("approvedSelection") is not None and data["approvedSelection"]!=selected_hashes:
        raise RuntimeError("50-source selection changed after billing; DO NOT BUY")
    data["approvedSelection"]=selected_hashes
    hashvalue=hashlib.sha256(spoken.encode("utf-8")).hexdigest()
    if hashvalue not in selected_hashes:
        raise RuntimeError("Unapproved exact text in billed fifty")
    if any(x["textSha256"]==hashvalue for x in data["attempts"]):
        raise RuntimeError("Previous paid request for exact text, including uncertain responses; DO NOT RETRY")
    data["attempts"].append({"textSha256":hashvalue,"status":"SUBMITTED_UNKNOWN_RESULT"})
    JOURNAL.parent.mkdir(parents=True,exist_ok=True)
    JOURNAL.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Atomic cost barrier: do NOT POST before GitHub accepts this marker.
    commit_checkpoint(JOURNAL)
    return hashvalue

def record_returned_mp3(textsha,mp3sha,filepath,registry_path,ledger_path,request_id):
    data=load()
    matches=[x for x in data["attempts"] if x["textSha256"]==textsha]
    if len(matches)!=1 or matches[0]["status"]!="SUBMITTED_UNKNOWN_RESULT":
        raise RuntimeError("The original paid audio receipt is ambiguous; DO NOT REPEAT")
    matches[0].update({"status":"ORIGINAL_MP3_SAVED",
                       "mp3Sha256":mp3sha,"providerRequestId":request_id})
    JOURNAL.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    commit_checkpoint(JOURNAL,filepath,registry_path,ledger_path)
