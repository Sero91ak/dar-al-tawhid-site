#!/usr/bin/env python3
"""Fail-closed 300-question KIDS V4 audio release gate (read-only, no TTS).
Run: python3 kids/tools/quiz_v4_first300_release_gate.py [--strict]
Default prints human-useful readiness summary with zero cost.
--strict exits 2 until ALL 300 questions' FOUR exact V4 audio keys are approved,
backed by playable reviewed MP3/M4A files and checksums.
"""
from __future__ import annotations
import argparse, hashlib, json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-age4-6-300-review.json"
MANIFEST=ROOT/"kids/data/quiz-audio.json"
KEYS=("questionAudioText","correctAudioText","retryAudioText","explanationAudioText")
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def load(path):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (ValueError,OSError):return {}

def validated_local_asset(entry):
    if not isinstance(entry,dict):return "no-entry"
    if entry.get("modelId")!="eleven_v4":return "not-v4"
    if entry.get("voiceId")!=VOICE:return "different-voice"
    if entry.get("audioListeningApproved") is not True:return "not-listen-approved"
    if entry.get("qaApproval") not in ("human-reviewed-natural-fusha","human-reviewed-natural-speech","human-reviewed-pronunciation"):
        return "not-human-reviewed"
    link=entry.get("url")
    if not isinstance(link,str) or not link.startswith("/kids/assets/kids-quiz-audio/"):
        return "no-local-quiz-asset"
    if "?" in link or "#" in link or ".." in link or not link.endswith((".mp3",".m4a")):
        return "invalid-asset-url"
    p=(ROOT/link.lstrip("/")).resolve()
    pathroot=(ROOT/"kids/assets/kids-quiz-audio").resolve()
    if not p.is_relative_to(pathroot):return "unsafe-asset-path"
    if not p.is_file() or p.stat().st_size<1500:return "missing-or-tiny-asset"
    h=entry.get("sha256")
    if not isinstance(h,str) or len(h)!=64 or hashlib.sha256(p.read_bytes()).hexdigest()!=h:
        return "sha256-mismatch"
    proc=subprocess.run(["ffprobe","-v","error","-show_entries",
         "format=duration:stream=codec_type,codec_name","-of","json",str(p)],capture_output=True,text=True)
    if proc.returncode:return "unreadable-audio"
    try:
        data=json.loads(proc.stdout)
        duration=float((data.get("format") or {}).get("duration") or 0)
        tracks=[s.get("codec_name") for s in data.get("streams") or [] if s.get("codec_type")=="audio"]
    except (KeyError,ValueError,TypeError):return "invalid-audio-properties"
    if not .5<duration<240 or not tracks or tracks[0] not in ("mp3","aac"):return "invalid-audio-codec-duration"
    return None

def main():
    p=argparse.ArgumentParser();p.add_argument("--strict",action="store_true");args=p.parse_args()
    plan=load(PLAN)
    items=plan.get("items") or []
    if len(items)!=300 or len({q["questionId"] for q in items})!=300 or {q.get("ageBand") for q in items}!={"4-6"}:
        raise RuntimeError("FIRST_300 age4–6 authoritative plan is missing/invalid")
    entries=(load(MANIFEST).get("entries") or {})
    texts={q[k] for q in items for k in KEYS}
    failures={}
    for text in texts:
        code=validated_local_asset(entries.get(text))
        if code:failures[code]=failures.get(code,0)+1
    passed=len(texts)-sum(failures.values())
    report={"ageBand":"4-6","questions":300,"requiredSpeechKeys":len(texts),
       "readyApprovedAudioKeys":passed,"missingOrInvalidKeys":len(texts)-passed,
       "releaseAllowed":len(failures)==0,
       "errorCounts":failures,"scope":"OFFICIAL_KIDS_AUDIO_RELEASE_GUARD"}
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if args.strict and failures:
        raise SystemExit("LIVE BLOCKED: 300 KIDS V4 questions missing verified, approved MP3 files")

if __name__=="__main__":main()
