#!/usr/bin/env python3
"""Fail-closed promotion of TAWḤĪD KIDS 450×4 V4 audio AFTER documented listening QA.

Never approves an audio recording itself. Does not deploy, merge, notify or delete.
Human evidence must be supplied as a separate, non-generated review file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"kids/data/quiz-kids-public-450.json"
PLAN=ROOT/"kids/review-only/quiz-v4-full-rebuild-20261026/450-speech-scripts.json"
PRIVATE=ROOT/"kids/data/quiz-v4-full-rebuild-review.json"
PUBLIC=ROOT/"kids/data/quiz-v4-full-rebuild-public.json"
PARTS=("question","correct","retry","explanation")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PUBLIC_ID="TAWHID_KIDS_450_V4_NEW_REBUILD_PUBLIC"

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--human-review-evidence",type=Path,required=True)
    p.add_argument("--output",type=Path,default=PUBLIC)
    args=p.parse_args()
    if not args.human_review_evidence.is_file():
        raise SystemExit("Human listening-review evidence missing; no publication.")
    original=read(SOURCE)["items"]
    plan=read(PLAN)["items"]
    review=read(PRIVATE)
    evidence=read(args.human_review_evidence)
    if evidence.get("purpose")!="KIDS_V4_HUMAN_AUDIO_LISTENING_REVIEW" or not evidence.get("reviewer") or not evidence.get("reviewedAt"):
        raise SystemExit("Missing attributable human listening QA")
    answers=evidence.get("approvals")
    if not isinstance(answers,dict) or not answers:
        raise SystemExit("No human-approved audio hashes")
    if review.get("releaseEnabled") is not False or review.get("humanListeningApproved") is not False:
        raise SystemExit("Review manifest unexpectedly pre-approved: refuse")
    if review.get("modelId")!="eleven_v4" or review.get("voiceId")!=VOICE:
        raise SystemExit("Wrong provider voice/model")
    if len(original)!=len(plan)!=len(review.get("questions",{}))!=450:
        raise SystemExit("Wrong question count")
    canonical={q["id"]:q for q in original}
    manuscripts={q["questionId"]:q for q in plan}
    if len(canonical)!=450 or len(manuscripts)!=450:
        raise SystemExit("Duplicated IDs")
    published={"schemaVersion":1,"id":PUBLIC_ID,"modelId":"eleven_v4",
               "voiceId":VOICE,"voiceName":"Serhat Abu Malik – Master",
               "releaseEnabled":True,"humanListeningApproved":True,
               "sourceQuestions":"kids/data/quiz-kids-public-450.json",
               "releaseScope":"Kids Quiz only; NO OneSignal device notification",
               "questions":{}}
    counts={"4-6":0,"7-8":0,"9-10":0}
    used=set()
    for qid,entry in review["questions"].items():
        q=canonical.get(qid)
        manuscript=manuscripts.get(qid)
        if not q or not manuscript or q["ageBand"]!=entry.get("ageBand") or q["source"]!=entry.get("source"):
            raise SystemExit("Question/source mismatch "+qid)
        if q["status"]!="published" or q["reviewStatus"]!="approved" or q["verification"]!="approved":
            raise SystemExit("Unapproved question "+qid)
        if set(entry.get("clips",{}))!=set(PARTS):
            raise SystemExit("Incomplete recording "+qid)
        out={"ageBand":q["ageBand"],"source":q["source"],"clips":{}}
        counts[q["ageBand"]]+=1
        for part in PARTS:
            clip=entry["clips"][part]
            digest=clip["sha256"]
            proof=answers.get(digest)
            if not re.fullmatch(r"[0-9a-f]{64}",digest):
                raise SystemExit("Missing audio SHA "+qid+":"+part)
            if (not isinstance(proof,dict) or proof.get("approved") is not True
                or proof.get("sha256")!=digest or proof.get("listened") is not True
                or proof.get("arabicTermsChecked") is not True or proof.get("breathingChecked") is not True
                or proof.get("childComprehensionChecked") is not True):
                raise SystemExit("Missing actual attributable listening signoff "+qid+":"+part)
            if clip.get("ttsTextSha256") is None or clip["text"]!=manuscript["parts"][part]["displayText"]:
                raise SystemExit("Generated audio text mismatch "+qid+":"+part)
            if clip["modelId"]!="eleven_v4" or clip["voiceId"]!=VOICE:
                raise SystemExit("Wrong model/voice "+qid+":"+part)
            rel=Path(str(clip["url"]).lstrip("/"))
            if (not rel.as_posix().startswith("kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/")
                or ".." in rel.parts):
                raise SystemExit("Audio outside protected asset scope")
            path=ROOT/rel
            if not path.is_file() or path.stat().st_size<1700 or sha(path)!=digest:
                raise SystemExit("Missing or changed human-approved original bytes "+qid+":"+part)
            outclip=dict(clip)
            outclip.update({"humanListeningApproved":True,"approvedForPlayback":True,
                            "qaStatus":"human-listening-approved"})
            out["clips"][part]=outclip
            used.add(digest)
        published["questions"][qid]=out
    if counts!={"4-6":150,"7-8":150,"9-10":150} or len(published["questions"])!=450:
        raise SystemExit("Wrong approved age-band counts")
    if len(used)!=len(set(used)&set(answers)):
        raise SystemExit("Approval hash mismatch")
    for q in published["questions"].values():
        for c in q["clips"].values():
            if not c["humanListeningApproved"] or not c["approvedForPlayback"]:
                raise SystemExit("Not all segments approved")
    # A PUBLIC manifest is only produced after valid evidence; code change is
    # not an app release, which must pass separate Test/Visitor end-device gates.
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(published,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("ELIGIBLE FOR SEPARATE DEPLOYMENT QA: 450 × 4 genuine human-approved V4 master clips")
    print(f"Distinct reviewed MP3 hashes: {len(used)}; nothing published or deleted")

if __name__=="__main__":
    main()
