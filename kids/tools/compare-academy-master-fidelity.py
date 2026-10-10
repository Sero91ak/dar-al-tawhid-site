#!/usr/bin/env python3
"""Serhat Kids Academy: bounded A/B voice-fidelity experiment (NOT public playback).

Two EXACT academy phrases are rendered twice with the same cloned voice and
the same prepared speech text. Only voice synthesis settings differ. Audios
remain staging-only until owner listening and pronunciation review.
No percentage similarity is inferred from ElevenLabs 'similarity_boost'.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import subprocess
import tempfile
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
CONFIG=json.loads((ROOT/"data/pronunciation/elevenlabs-production.json").read_text("utf-8"))
MASTER=CONFIG["masterVoice"]
OUT=ROOT/"kids/data/academy-master-fidelity-ab-v1.json"
ASSETS=ROOT/"kids/assets/kids-academy-fidelity-staging"
MODEL="eleven_flash_v2_5"
VOICE_PROFILE="serhat-owner-voice-2026"
from voice_text import prepare_kids_voice_text

PROMPTS=(
    "Schön, dass du da bist!",
    "Heute geht es darum, die Wahrheit zu sagen. Wir hören zu und überlegen zusammen. Du darfst eine Pause machen.",
)
PRESETS={
    "A-baseline-083":{
        "stability":0.63,
        "similarity_boost":0.83,
        # Use the same implicit defaults as the previous pipeline.
    },
    "B-fidelity-096":{
        "stability":0.58,
        "similarity_boost":0.96,
        "use_speaker_boost":True,
        "style":0.0,
        "speed":1.0,
    },
}
MAX_CLIPS=4


def duration(path:pathlib.Path)->float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",str(path)
    ],text=True).strip())


def synthesize(prepared:str, settings:dict, target:pathlib.Path, secret:str)->float:
    payload=json.dumps({"text":prepared,"model_id":MODEL,"voice_settings":settings},ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/"+MASTER["voiceId"],
        data=payload,method="POST",
        headers={"xi-api-key":secret,"Content-Type":"application/json",
                 "Accept":"audio/mpeg","User-Agent":"Dar-Kids-Master-Fidelity-AB/1"}
    )
    with urllib.request.urlopen(req,timeout=110) as response:
        mp3=response.read()
    if len(mp3)<1800:
        raise RuntimeError("Incomplete TTS output")
    with tempfile.TemporaryDirectory() as folder:
        input_file=pathlib.Path(folder)/"reference.mp3"
        input_file.write_bytes(mp3)
        subprocess.run([
            "ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(input_file),
            "-ac","1","-ar","48000","-c:a","aac","-b:a","48k",
            "-movflags","+faststart",str(target)
        ],check=True,timeout=100)
    seconds=duration(target)
    if not (0.8 <= seconds <= 65) or target.stat().st_size<1800:
        target.unlink(missing_ok=True)
        raise RuntimeError("Audio technical quality guard rejected result")
    return seconds


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--dry-run",action="store_true")
    parser.add_argument("--run",action="store_true")
    args=parser.parse_args()
    if args.dry_run == args.run:
        parser.error("Select exactly one: --dry-run or --run")
    if MASTER.get("name")!="Serhat Abu Malik – Master" or MASTER.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH":
        raise RuntimeError("Owner master voice not matched; audio generation denied")
    academy=(ROOT/"kids/akademie/index.html").read_text("utf-8")
    for prompt in PROMPTS:
        if prompt not in academy:
            raise RuntimeError("Original Academy text changed; no synthesis permitted: "+prompt)
    expected=[(preset,prompt) for preset in PRESETS for prompt in PROMPTS]
    if len(expected)!=MAX_CLIPS:
        raise RuntimeError("Four-clip experiment budget exceeded")
    previous=json.loads(OUT.read_text("utf-8")) if OUT.exists() else {}
    samples={x["id"]:x for x in previous.get("samples",[]) if isinstance(x,dict) and x.get("id")}
    ready=[]
    for preset,phrase in expected:
        prepared=prepare_kids_voice_text(phrase)
        settings=PRESETS[preset]
        identifier=hashlib.sha256(json.dumps({
            "text":prepared,"voiceId":MASTER["voiceId"],"modelId":MODEL,
            "settings":settings
        },sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        result_path=ASSETS/(identifier[:20]+".m4a")
        sample_id=preset+":"+identifier[:20]
        existing=samples.get(sample_id,{})
        is_valid=(result_path.is_file() and existing.get("sha256") and
                  result_path.stat().st_size>1800 and
                  hashlib.sha256(result_path.read_bytes()).hexdigest()==existing["sha256"])
        ready.append((sample_id,preset,phrase,prepared,identifier,result_path,is_valid))
    missing=sum(not item[-1] for item in ready)
    total_chars=sum(len(item[3]) for item in ready if not item[-1])
    print(f"Academy fidelity A/B: {len(ready)} bounded clips, {missing} missing, {total_chars} synthesis characters",flush=True)
    if args.dry_run or missing==0:
        return
    if missing>MAX_CLIPS or total_chars>650:
        raise RuntimeError("Audio credits cap exceeded")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:
        raise RuntimeError("Missing API key – no generation was performed")
    ASSETS.mkdir(parents=True,exist_ok=True)
    for sample_id,preset,phrase,prepared,identifier,result_path,is_valid in ready:
        if is_valid:
            continue
        seconds=synthesize(prepared,PRESETS[preset],result_path,key)
        samples[sample_id]={
            "id":sample_id,"prompt":phrase,"url":"/"+result_path.relative_to(ROOT).as_posix(),
            "sha256":hashlib.sha256(result_path.read_bytes()).hexdigest(),
            "preparedSha256":hashlib.sha256(prepared.encode()).hexdigest(),
            "durationSeconds":round(seconds,3),"modelId":MODEL,
            "voiceProfileId":VOICE_PROFILE,"voiceId":MASTER["voiceId"],
            "settingsPreset":preset,"voiceSettings":PRESETS[preset],
            "sourceVoice":"authorized-owner-voice","sourceSpeaker":"Serhat Abu Malik",
            "qaStatus":"technical-passed-awaiting-owner-listening",
            "humanApproved":False,"verifiedSimilarityPercent":None,
            "reviewRubric":{"voiceIdentity":None,"tone":None,"accent":None,
                            "naturalness":None,"arabicPronunciation":None},
        }
    payload={
        "schemaVersion":1,"id":"KIDS_ACADEMY_MASTER_FIDELITY_AB_V1",
        "voiceProfileId":VOICE_PROFILE,"speaker":"Serhat Abu Malik",
        "modelId":MODEL,"presetA":PRESETS["A-baseline-083"],
        "presetB":PRESETS["B-fidelity-096"],
        "measureNotice":"0.96 is a synthesis control, NOT 96% verified voice similarity.",
        "approvalRequired":True,"publishedToAcademy":False,
        "samples":[samples[item[0]] for item in ready],
    }
    OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n","utf-8")
    print("Produced complete bounded A/B set. No public voice manifest modified.",flush=True)


if __name__=="__main__":
    main()
