#!/usr/bin/env python3
"""Verify the ACTUAL composed V4 MP3 listening previews for first 150 (age 4–6).

Runs offline: no ElevenLabs, no new credits, no public release. Checks that
every claimed available question field has a real intact MP3, correct SHA,
playable codec, sensible duration and non-silent waveform. Distinguishes
technical verification from human pronunciation approval.
"""
from __future__ import annotations
import hashlib,json,re,subprocess
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
PREVIEW=ROOT/"kids/data/quiz-v4-first150-composed-preview.json"
STATUS=ROOT/"kids/data/quiz-v4-first150-audio-status.json"
RESULT=ROOT/"kids/data/quiz-v4-first150-composed-technical-qa.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
KINDS=("question","correct","retry","explanation")

def load(p):return json.loads(p.read_text(encoding="utf-8"))

def file_hash(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):
            h.update(part)
    return h.hexdigest()

def technical_check(text,row):
    if row.get("voiceId")!=VOICE or row.get("modelId")!="eleven_v4":
        raise ValueError("Voice model is not original Serhat Eleven V4")
    if row.get("audioListeningApproved") is True:
        # Technical inspection alone cannot establish pronunciation accuracy.
        raise ValueError("Preview claims unsupported human listening approval")
    url=row.get("url") or ""
    if not url.startswith("/kids/assets/kids-quiz-audio/") or ".." in url or "?" in url or "#" in url:
        raise ValueError("Unsafe MP3 URL")
    path=(ROOT/url.lstrip("/")).resolve()
    if not path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()):
        raise ValueError("MP3 outside allowed root")
    if not path.is_file() or path.stat().st_size<1500 or path.suffix!=".mp3":
        raise ValueError("Source MP3 missing/tiny/unexpected format")
    digest=file_hash(path)
    if row.get("sha256")!=digest:
        raise ValueError("MP3 changed after generation/assembly")
    proc=subprocess.run(["ffprobe","-v","error","-show_entries",
         "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
         capture_output=True,text=True,check=True)
    meta=json.loads(proc.stdout)
    tracks=[x for x in meta.get("streams",[]) if x.get("codec_type")=="audio"]
    duration=float(meta.get("format",{}).get("duration") or 0)
    if len(tracks)!=1 or tracks[0].get("codec_name")!="mp3" or not .3<duration<240:
        raise ValueError("No usable MP3 audio track/duration")
    v=subprocess.run(["ffmpeg","-v","info","-i",str(path),"-af",
        "volumedetect","-vn","-f","null","-"],capture_output=True,text=True,check=True)
    m=re.search(r"mean_volume:\s*([-+]?\d+(?:\.\d+)?)\s*dB",v.stderr)
    if not m or float(m.group(1))<-60:
        raise ValueError("No audible speech/volume below permissible minimum")
    return {"sha256":digest,"lengthSeconds":round(duration,3),
            "meanVolumeDB":float(m.group(1)),"bytes":path.stat().st_size}

def main():
    plan=load(PLAN)
    preview=load(PREVIEW)
    status=load(STATUS)
    rows=[x for x in plan["recipes"] if x["ageBand"]=="4-6"]
    if len(rows)!=150 or status.get("questionCount")!=150:
        raise RuntimeError("Exactly 150 age 4–6 questions required")
    if preview.get("published") is not False or preview.get("humanListeningApproved") is not False:
        raise RuntimeError("Premature publication/approval in review-only preview")
    if preview.get("voiceId")!=VOICE or preview.get("modelId")!="eleven_v4":
        raise RuntimeError("Wrong model/voice in first150 composed preview")
    entries=preview.get("entries") or {}
    if not entries:raise RuntimeError("No actual composed MP3 preview generated")
    checked={}
    failures=[]
    for text,row in entries.items():
        try:checked[text]=technical_check(text,row)
        except Exception as e:failures.append({"textSha256":hashlib.sha256(text.encode()).hexdigest(),
                                              "error":str(e)[:140]})
    by_age={"4-6":{"questions":150,"questionMP3sPresent":0,"explanationsPresent":0,
                    "correctMP3sPresent":0,"retryMP3sPresent":0,"allFourPresent":0}}
    field_names={"question":"questionMP3sPresent","explanation":"explanationsPresent",
                 "correct":"correctMP3sPresent","retry":"retryMP3sPresent"}
    qbyid={q["questionId"]:q for q in rows}
    status_ids={r["questionId"] for r in status["questions"]}
    if len(status_ids)!=150 or status_ids!=set(qbyid):
        raise RuntimeError("Wrong question IDs in first150 preview status")
    for q in rows:
        present=0
        for k in KINDS:
            if q[k]["text"] in checked:
                by_age["4-6"][field_names[k]]+=1
                present+=1
        if present==4:by_age["4-6"]["allFourPresent"]+=1
    prev=status.get("availableFieldCounts") or {}
    for k in KINDS:
        if by_age["4-6"][field_names[k]]!=prev.get(k):
            raise RuntimeError("Claimed original MP3 coverage differs from actual checked files for "+k)
    if by_age["4-6"]["allFourPresent"]!=status.get("completeFourPartQuestions"):
        raise RuntimeError("Claimed fully audible question count differs from verified MP3 files")
    result={
        "schemaVersion":1,"scope":"TAWḤĪD KIDS first 150 4–6 MP3 technical preview QA",
        "originalPreviewAudioFiles":len(entries),
        "filesWithCorrectOriginalSHAAndAudibleWaveform":len(checked),
        "failedFiles":len(failures),"failures":failures,
        "byAge":by_age,
        "sourceOriginalsPaidAgain":False,"creditsSpentByCheck":0,
        "allCurrentMP3sTechnicallyValid":not failures,
        "humanPronunciationApproved":False,"publicReleaseAllowed":False,
        "source":"kids/data/quiz-v4-first150-composed-preview.json"
    }
    RESULT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_FIRST150_COMPOSED_QA "+json.dumps({
        k:v for k,v in result.items() if k!="failures"
    },ensure_ascii=False),flush=True)
    if failures:raise SystemExit(f"BLOCKED: {len(failures)} corrupted/invalid review MP3s")
if __name__=="__main__":main()
