#!/usr/bin/env python3
"""Controlled Serhat Academy V9 recording batch.

Output is STAGING ONLY. No generated clip becomes a public lesson voice until
human pronunciation QA approves the exact phrase and promotes its manifest.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/academy-voice-plan-v9.json"
STAGING=ROOT/"kids/data/academy-audio-staging-v9.json"
ASSETS=ROOT/"kids/assets/kids-academy-audio"
CONFIG=json.loads((ROOT/"data/pronunciation/elevenlabs-production.json").read_text("utf-8"))
MASTER=CONFIG["masterVoice"]
MODEL="eleven_flash_v2_5"
PROFILE="serhat-owner-voice-2026"
from voice_text import prepare_kids_voice_text


def technical_duration(filepath:pathlib.Path)->float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",str(filepath)
    ],text=True).strip())


def generate_audio(text:str,target:pathlib.Path,key:str)->float:
    prepared=prepare_kids_voice_text(text)
    request=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/"+MASTER["voiceId"],
        data=json.dumps({"text":prepared,"model_id":MODEL,
                         "voice_settings":{"stability":0.63,"similarity_boost":0.83}},
                        ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={"xi-api-key":key,"Content-Type":"application/json",
                 "Accept":"audio/mpeg","User-Agent":"Dar-Kids-Academy-V9-Staging/1"}
    )
    with urllib.request.urlopen(request,timeout=90) as response:
        mp3=response.read()
    if len(mp3)<1800:
        raise RuntimeError("Short or empty ElevenLabs response")
    with tempfile.TemporaryDirectory() as folder:
        src=pathlib.Path(folder)/"recording.mp3"
        src.write_bytes(mp3)
        subprocess.run([
            "ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src),
            "-ac","1","-ar","48000","-c:a","aac","-b:a","48k",
            "-movflags","+faststart",str(target)
        ],check=True,timeout=80)
    duration=technical_duration(target)
    if not (0.8<=duration<=65) or target.stat().st_size<1800:
        target.unlink(missing_ok=True)
        raise RuntimeError("Recording technical QA failed")
    return duration


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--dry-run",action="store_true")
    parser.add_argument("--limit",type=int,default=12)
    parser.add_argument("--max-chars",type=int,default=4000)
    args=parser.parse_args()
    if not 1<=args.limit<=36 or not 250<=args.max_chars<=10000:
        raise RuntimeError("Batch budget exceeded")
    if MASTER.get("name")!="Serhat Abu Malik – Master":
        raise RuntimeError("Unauthorized speaker")
    plan=json.loads(PLAN.read_text("utf-8"))
    if plan.get("voiceProfileId")!=PROFILE or plan.get("modelId")!=MODEL:
        raise RuntimeError("Invalid master voice plan")
    phrases=plan.get("phrases") or []
    if len(phrases)!=plan.get("phraseCount") or len(phrases)<200:
        raise RuntimeError("Incomplete or changed voice plan")
    staged=json.loads(STAGING.read_text("utf-8")) if STAGING.exists() else {}
    previous=staged.get("entries",{})
    valid_current={}
    for item in phrases:
        phrase=item["text"]
        entry=previous.get(phrase) or {}
        path=ROOT/str(entry.get("url","")).lstrip("/")
        if entry.get("sha256") and path.is_file() and path.stat().st_size>=1800 and hashlib.sha256(path.read_bytes()).hexdigest()==entry["sha256"]:
            valid_current[phrase]=entry
    pending=[r for r in phrases if r["text"] not in valid_current]
    print(f"Academy: {len(valid_current)}/{len(phrases)} staged, {len(pending)} waiting for synthesis",flush=True)
    if args.dry_run or not pending:
        return
    secret=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not secret:
        raise RuntimeError("ELEVENLABS_API_KEY unavailable; no credits were used")
    ASSETS.mkdir(parents=True,exist_ok=True)
    created=0
    used_chars=0
    for row in pending:
        phrase=row["text"]
        prepared=prepare_kids_voice_text(phrase)
        if created>=args.limit or used_chars+len(prepared)>args.max_chars:
            break
        digest=hashlib.sha256((MODEL+"|"+MASTER["voiceId"]+"|"+prepared).encode()).hexdigest()
        path=ASSETS/(digest[:20]+".m4a")
        if path.exists() and path.stat().st_size>=1800:
            duration=technical_duration(path)
        else:
            print(f"Producing staged clip {created+1}: {len(prepared)} chars",flush=True)
            duration=generate_audio(phrase,path,secret)
            time.sleep(0.25)
        valid_current[phrase]={
            "url":"/"+path.relative_to(ROOT).as_posix(),
            "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
            "preparedSha256":digest,"durationSeconds":round(duration,3),
            "voiceProfileId":PROFILE,"sourceVoice":"authorized-owner-voice",
            "sourceType":"owner-voice-generated","sourceSpeaker":"Serhat Abu Malik",
            "modelId":MODEL,"qaStatus":"technical-passed-awaiting-human-review",
            "approvedForPlayback":False
        }
        created+=1
        used_chars+=len(prepared)
    staged={
        "schemaVersion":2,"id":"KIDS_ACADEMY_V9_SERHAT_STAGING",
        "voiceProfileId":PROFILE,"modelId":MODEL,
        "reviewRequiredBeforePublicPlayback":True,
        "entries":valid_current
    }
    STAGING.write_text(json.dumps(staged,ensure_ascii=False,indent=2)+"\n","utf-8")
    print(f"Audio staging created {created} clips, {used_chars} chars. Nothing was published to /kids/data/academy-audio.json.",flush=True)


if __name__=="__main__":
    main()
