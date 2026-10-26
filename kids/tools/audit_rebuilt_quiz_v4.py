#!/usr/bin/env python3
"""Offline, ZERO-CREDIT QA: independently decode 1217 original ElevenLabs V4 MP3s.

This cannot replace human Fuṣḥā/makhārij pronunciation approval and never
writes the production/live kids quiz manifest.
"""
from __future__ import annotations
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from mutagen.mp3 import MP3
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]
PREFIX="kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/"
MANIFEST=ROOT/"kids/data/quiz-v4-full-rebuild-review.json"
QUESTIONS=ROOT/"kids/data/quiz-kids-public-450.json"
SCRIPTS=ROOT/"kids/review-only/quiz-v4-full-rebuild-20261026/450-speech-scripts.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")
BANDS={"4-6":150,"7-8":150,"9-10":150}

def fail(s): raise RuntimeError(s)

def sha(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as fd:
        while chunk:=fd.read(1<<20):h.update(chunk)
    return h.hexdigest()

def qa():
    data=json.loads(MANIFEST.read_text(encoding="utf-8"))
    original=json.loads(QUESTIONS.read_text(encoding="utf-8"))
    scripts=json.loads(SCRIPTS.read_text(encoding="utf-8"))
    if (data["releaseEnabled"] is not False or data["humanListeningApproved"] is not False
        or data["voiceId"]!=VOICE or data["modelId"]!="eleven_v4"):fail("Unapproved private manifest changed")
    canonical={q["id"]:q for q in original["items"]}
    spoken={q["questionId"]:q for q in scripts["items"]}
    if len(canonical)!=len(spoken)!=len(data["questions"])!=450:fail("450 exact questions not found")
    counts=collections.Counter()
    seen={}  # path -> expected hash and duration from all 1800 refs
    for id,q in data["questions"].items():
        ori=canonical.get(id);scr=spoken.get(id)
        if not ori or not scr or q["ageBand"]!=ori["ageBand"] or q["source"]!=ori["source"]:fail("Source mismatch "+id)
        if q["ageBand"] not in BANDS:fail("Unexpected age")
        counts[q["ageBand"]]+=1
        if set(q["clips"])!=set(PARTS):fail("Incomplete clips "+id)
        for part in PARTS:
            clip=q["clips"][part]
            if (clip["voiceId"]!=VOICE or clip["modelId"]!="eleven_v4"
                or clip["humanListeningApproved"] is not False
                or clip["approvedForPlayback"] is not False
                or clip["text"]!=scr["parts"][part]["displayText"]):fail("Incorrect clip "+id+":"+part)
            p=Path(clip["url"].lstrip("/"))
            if not p.as_posix().startswith(PREFIX) or ".." in p.parts or q["ageBand"] not in p.parts:
                fail("Path or age out of scope")
            if not re.fullmatch(r"[0-9a-f]{64}",clip["sha256"]):fail("Bad clip SHA")
            info=(clip["sha256"],float(clip["durationSeconds"]))
            if p.as_posix() in seen and seen[p.as_posix()]!=info:fail("Deduplicated file conflicts")
            seen[p.as_posix()]=info
    if dict(counts)!=BANDS:fail("Question age counts: "+str(dict(counts)))
    if len(seen)!=1217:fail("Original unique MP3 count changed: "+str(len(seen)))
    disk=set(x.relative_to(ROOT).as_posix() for x in (ROOT/PREFIX).rglob("*.mp3"))
    if disk!=set(seen):fail("Missing/extra MP3 files: missing="+str(len(set(seen)-disk))+" extra="+str(len(disk-set(seen))))
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    bad=[];weak=[];duration_mismatches=[];max_peak=[]
    sizes=0;duration_sum=0
    for n,(relative,(hash_expected,duration_expected)) in enumerate(sorted(seen.items()),1):
        p=ROOT/relative;sizes+=p.stat().st_size
        if sha(p)!=hash_expected:
            bad.append({"file":relative,"problem":"SHA-256 mismatch"});continue
        try:
            mp3=MP3(str(p))
            seconds=float(mp3.info.length)
            if seconds<=0.75 or seconds>150:fail("duration out-of-bounds")
            if abs(seconds-duration_expected)>0.75:
                duration_mismatches.append({"file":relative,"expected":duration_expected,"actual":round(seconds,3)})
            result=subprocess.run([ffmpeg,"-hide_banner","-nostdin","-v","error","-xerror",
                                   "-i",str(p),"-f","null","-"],
                                  stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=60)
            if result.returncode:
                bad.append({"file":relative,"problem":result.stderr.decode("utf-8","replace")[:240]})
            if p.stat().st_size<1700:bad.append({"file":relative,"problem":"too small"})
            duration_sum+=seconds
        except Exception as e:
            bad.append({"file":relative,"problem":str(e)[:240]})
        if n%100==0:print("Independent audio decoding:",n,"/",len(seen),flush=True)
    report={
      "schemaVersion":1,"scope":"review-only","humanApproval":False,
      "provider":"ElevenLabs","modelId":"eleven_v4","voiceId":VOICE,
      "questionCount":len(data["questions"]),"clipBindings":sum(len(q["clips"]) for q in data["questions"].values()),
      "uniqueSourceMp3":len(seen),"bands":dict(counts),"totalMp3Bytes":sizes,
      "totalUniqueDurationSeconds":round(duration_sum,2),
      "shaOrDecodeErrors":bad,"durationMismatches":duration_mismatches,
      "technicalPassed":not bad and not duration_mismatches,
      "note":"Technical integrity and lossless decode only; DOES NOT validate Arabic Fuṣḥā pronunciation, children's comprehension or human listening approval."
    }
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--report",type=Path,default=Path("/tmp/kids-v4-audio-technical-audit.json"))
    args=p.parse_args()
    result=qa()
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k not in ("shaOrDecodeErrors","durationMismatches")},ensure_ascii=False,indent=2))
    if not result["technicalPassed"]:
        print("ERROR details",json.dumps(result["shaOrDecodeErrors"][:5]),json.dumps(result["durationMismatches"][:5]))
        sys.exit(1)
    print("PASS: Every original MP3 SHA and full audio frame decode; human hearing remains locked.")

if __name__=="__main__":main()
