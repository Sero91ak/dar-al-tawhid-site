#!/usr/bin/env python3
"""Read-only first 20 older-age quiz V4 source and spend regression.

No ElevenLabs network, no voice synthesis, no human approvals. Explicitly
proves the first ten stage-1 texts and stage's future 65-original queue
cannot accidentally rebuy earlier paid speech or change the master voice.
"""
from __future__ import annotations
import json
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import generate_quiz_v4_older_stage1_exact as stage1

def must(ok,msg):
    if not ok:raise AssertionError("V4_STAGE1_DRYRUN_FAILED: "+msg)

def main():
    registry,ledger,source,missing,protected=stage1.prepare()
    batch,estimate=stage1.candidate_batch(missing)
    qids={q["questionId"] for q in source["questions"]}
    must(len(qids)==20,"20 original question IDs must remain unchanged")
    must(len(source["originalTextRecordingQueue"])==65,"first stage must contain 65 exact V4 original texts")
    must(sum(q["ageBand"]=="7-8" for q in source["questions"])==10 and
         sum(q["ageBand"]=="9-10" for q in source["questions"])==10,
         "stage1 should span ten questions per older age band")
    must(stage1.VOICE=="DkU7j9uO4ZEtLD2iRZSH" and stage1.MODEL=="eleven_v4",
         "model/voice drift")
    must(0<=len(batch)<=10 and estimate<=850,
         "unapproved unexpected spend")
    must(all(item["spokenText"] not in protected
             and item["spokenText"] not in registry["textClips"] for item in batch),
         "an original MP3 would be purchased twice")
    must(all(stage1.sha(item["spokenText"])==item["spokenTextSHA256"] for item in batch),
         "candidate text doesn't match immutable first-stage SHA")
    must(0<=len(missing)<=65,"wrong first-stage remainder")
    if len(missing)==65:
        must(len(batch)==10,"initial first-ten candidate queue changed")
        must(sum(len(x["spokenText"]) for x in missing)==1842,
             "the first 65 source texts must remain exactly 1842 Unicode characters")
    must(registry["live"] is False and ledger["live"] is False,
         "producer may not touch public audio")

    # Fail on tampering with the original stage's canonical speech SHA.
    with tempfile.TemporaryDirectory() as temp:
        invalid=json.loads(stage1.PREP.read_text(encoding="utf-8"))
        invalid["originalTextRecordingQueue"][0]["spokenTextSHA256"]="0"*64
        modified=Path(temp)/"tampered-stage1.json"
        modified.write_text(json.dumps(invalid,ensure_ascii=False),encoding="utf-8")
        original=stage1.PREP
        try:
            stage1.PREP=modified
            try:stage1.prepare()
            except RuntimeError:pass
            else:raise AssertionError("Tampered V4 original text was accepted")
        finally:stage1.PREP=original
    print("PASS: exact first-20 older quiz V4 stage; 65 original texts, "
          "first ten SHA matched, no prepaid duplicate, 0 new ElevenLabs credits")

if __name__=="__main__":main()
