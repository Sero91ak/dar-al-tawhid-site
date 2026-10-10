#!/usr/bin/env python3
"""Controlled Serhat Academy V9 recording batch.

Output is STAGING ONLY. No generated clip becomes a public lesson voice until
human pronunciation QA approves the exact phrase and promotes its manifest.
"""
from __future__ import annotations
import argparse
import base64
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
POLICY=json.loads((ROOT/"kids/data/academy-voice-policy-v10.json").read_text("utf-8"))
VOICE_ID=POLICY["voiceIdentity"]["voiceId"]
MASTER_PROFILE=POLICY["production"]["profile"]
MODEL=POLICY["production"]["modelId"]
PROFILE=POLICY["voiceIdentity"]["voiceProfileId"]
BACKEND="https://dar-admin-publisher.sero91ak.workers.dev/voice-studio/api"
from voice_text import prepare_kids_voice_text


def technical_duration(filepath:pathlib.Path)->float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",str(filepath)
    ],text=True).strip())


def generate_audio(text:str, target:pathlib.Path, secret:str)->float:
    """Use exactly the approved story-generation backend; do NOT call Flash directly."""
    prepared=prepare_kids_voice_text(text)
    payload=json.dumps({"text":text,"prepared":prepared,"profile":MASTER_PROFILE},ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(
        BACKEND+"/generate-with-timings",data=payload,method="POST",
        headers={"X-Admin-Secret":secret,"Origin":"https://dar-al-tawhid.de",
                 "Referer":"https://dar-al-tawhid.de/voice-studio/",
                 "Content-Type":"application/json","Accept":"application/json",
                 "User-Agent":"DAR-Kids-Academy-Story-Voice-V10/1"}
    )
    with urllib.request.urlopen(req,timeout=150) as response:
        answer=json.loads(response.read().decode("utf-8"))
    mp3=base64.b64decode(str(answer.get("audioBase64") or ""),validate=True)
    if len(mp3)<1800:
        raise RuntimeError("Story voice API returned incomplete audio; no public clips affected")
    with tempfile.TemporaryDirectory() as folder:
        src=pathlib.Path(folder)/"story-voice.mp3"
        src.write_bytes(mp3)
        subprocess.run([
            "ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src),
            "-ac","1","-ar","48000","-c:a","aac","-b:a","48k",
            "-movflags","+faststart",str(target)
        ],check=True,timeout=90)
    seconds=technical_duration(target)
    if not (0.8<=seconds<=65) or target.stat().st_size<1800:
        target.unlink(missing_ok=True)
        raise RuntimeError("Invalid media; clip rejected without publication")
    return seconds


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--dry-run",action="store_true")
    parser.add_argument("--limit",type=int,default=4)
    parser.add_argument("--max-chars",type=int,default=1200)
    args=parser.parse_args()
    if not 1<=args.limit<=POLICY["costControls"]["maxClipsPerInvocation"] or not 100<=args.max_chars<=POLICY["costControls"]["maxPreparedCharactersPerInvocation"]:
        raise RuntimeError("Batch budget exceeded")
    config=json.loads((ROOT/"data/pronunciation/elevenlabs-production.json").read_text("utf-8"))
    if config["masterVoice"]["voiceId"]!=VOICE_ID or MASTER_PROFILE!="kids_story" or MODEL!="eleven_v4":
        raise RuntimeError("Story master voice/model/profile mismatch – refusing billed generation")
    voice_impl=(ROOT/"cloudflare/video-studio/voice.js").read_text("utf-8")
    if 'profile === "kids_story"' not in voice_impl or 'modelId !== "eleven_v4"' not in voice_impl:
        raise RuntimeError("Story backend changed: cannot prove canonical production profile")
    settings=POLICY["production"]["voiceSettings"]
    story_segment=voice_impl.split('profile === "kids_story"',1)[1].split('profile === "kids_lesson"',1)[0]
    for key,value in settings.items():
        match=f"{key}: {str(value).lower() if isinstance(value,bool) else value}"
        if match not in story_segment:
            raise RuntimeError("Story profile settings changed: "+key)
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
    secret=os.environ.get("ADMIN_PUBLISH_SECRET","").strip()
    if not secret:
        raise RuntimeError("DĀR Voice Studio admin secret missing; no audio credits were used")
    ASSETS.mkdir(parents=True,exist_ok=True)
    created=0
    used_chars=0
    for row in pending:
        phrase=row["text"]
        prepared=prepare_kids_voice_text(phrase)
        if created>=args.limit or used_chars+len(prepared)>args.max_chars:
            break
        digest=hashlib.sha256(json.dumps({"text":prepared,"voice":VOICE_ID,"model":MODEL,"profile":MASTER_PROFILE,"settings":POLICY["production"]["voiceSettings"],"dictionaryVersion":POLICY["production"]["pronunciationDictionaryVersionId"]},sort_keys=True,ensure_ascii=False).encode()).hexdigest()
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
            "voiceProfileId":PROFILE,"voiceId":VOICE_ID,"voiceSettingsProfile":MASTER_PROFILE,
            "sourceVoice":"authorized-owner-voice",
            "sourceType":"owner-voice-generated","sourceSpeaker":"Serhat Abu Malik",
            "modelId":MODEL,"qaStatus":"technical-passed-awaiting-human-review",
            "approvedForPlayback":False,"sameAsApprovedKidsStoryProfile":True
        }
        created+=1
        used_chars+=len(prepared)
    staged={
        "schemaVersion":2,"id":"KIDS_ACADEMY_V9_SERHAT_STAGING",
        "voiceProfileId":PROFILE,"modelId":MODEL,"voiceSettingsProfile":MASTER_PROFILE,
        "reviewRequiredBeforePublicPlayback":True,
        "entries":valid_current
    }
    STAGING.write_text(json.dumps(staged,ensure_ascii=False,indent=2)+"\n","utf-8")
    print(f"Audio staging created {created} clips, {used_chars} chars. Nothing was published to /kids/data/academy-audio.json.",flush=True)


if __name__=="__main__":
    main()
