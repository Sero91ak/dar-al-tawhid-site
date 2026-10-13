#!/usr/bin/env python3
"""Generate at most ONE new verified Serhat V4 KIDS praise take for review.

Strictly one paid TTS POST, no retries, no production manifest changes.
Preserves MP3 bytes immediately before any ffmpeg or QA step can fail.
Never regenerates the already-paid Allāhumma bārik Flow pilot.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_joy_v4_script import SUCCESS

VOICE_ID="DkU7j9uO4ZEtLD2iRZSH"
MODEL_ID="eleven_v4"
AGE_BAND="4-6"
PHRASE_INDEX=0
MAX_CHARS=125
text=SUCCESS[AGE_BAND][PHRASE_INDEX]
record=ROOT/"kids/data/quiz-v4-islamic-praise-pilot.json"
outbase=ROOT/"kids/assets/kids-quiz-audio"/"serhat-praise-v4-age4-6-index0-review"
rawfile=outbase.with_suffix(".mp3")
m4afile=outbase.with_suffix(".m4a")
metadata=ROOT/"kids/data/quiz-v4-islamic-praise-second-review.json"

if __name__=="__main__":
    if not 10<=len(text)<=MAX_CHARS:
        raise SystemExit("V4 COST GUARD: invalid or overly long phrase")
    known=json.loads(record.read_text(encoding="utf-8"))
    if known["text"]==text:
        raise SystemExit("Already-paid Flow take must never be regenerated")
    if rawfile.exists() or m4afile.exists() or metadata.exists():
        raise SystemExit("One-off paid audio already exists; refusing ANY duplicate generation")
    if os.environ.get("ELEVENLABS_VOICE_ID","").strip() not in ("",VOICE_ID):
        raise SystemExit("Wrong ElevenLabs voice secret; refusing generation")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:
        raise SystemExit("ElevenLabs key missing: no generation attempted")
    payload={
        "text":text,
        "model_id":MODEL_ID,
        "voice_settings":{"stability":0.60,"similarity_boost":0.89},
        "apply_text_normalization":"on",
    }
    req=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/"+VOICE_ID,
        data=json.dumps(payload,ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
          "xi-api-key":key,
          "Content-Type":"application/json",
          "Accept":"audio/mpeg",
          "User-Agent":"DAR-KIDS-V4-ONE-PAID-PILOT/1",
        })
    print(f"One authorized V4 preview: age {AGE_BAND}, phrase index {PHRASE_INDEX}, {len(text)} characters. ONE POST max.",flush=True)
    # May consume credits even on timeout. Do not retry this call under ANY condition.
    with urllib.request.urlopen(req,timeout=150) as response:
        raw=response.read()
        history_id=response.headers.get("history-item-id","")
    if len(raw)<1800 or not (raw.startswith(b"ID3") or raw[:1]==bytes([255])):
        raise RuntimeError("V4 audio payload failed audio header/size validation; no retry")
    outbase.parent.mkdir(parents=True,exist_ok=True)
    rawfile.write_bytes(raw)
    print(f"Already-paid MP3 saved to review branch workspace: {len(raw)} bytes",flush=True)
    subprocess.run([
        "ffmpeg","-hide_banner","-loglevel","error","-y",
        "-i",str(rawfile),"-ac","1","-ar","48000",
        "-c:a","aac","-b:a","48k","-movflags","+faststart",str(m4afile)
    ],check=True)
    if not m4afile.is_file() or m4afile.stat().st_size<1800:
        raise RuntimeError("Transcoded V4 failed post-check; original MP3 retained; no retry")
    stat=subprocess.run(["ffmpeg","-hide_banner","-i",str(m4afile)],capture_output=True,text=True)
    match=re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",stat.stderr)
    if not match:raise RuntimeError("Duration unknown; retain original audio, no retry")
    duration=3600*int(match[1])+60*int(match[2])+float(match[3])
    if not 0.5<=duration<=45:
        raise RuntimeError("Unreasonable duration; original preserved, no retry")
    metadata.write_text(json.dumps({
        "schemaVersion":1,
        "status":"real-v4-audio-generated-on-github-review-awaiting-listening",
        "voiceId":VOICE_ID,"modelId":MODEL_ID,"ageBand":AGE_BAND,
        "phraseIndex":PHRASE_INDEX,"text":text,
        "historyItemId":history_id,
        "originalMp3Path":"/"+str(rawfile.relative_to(ROOT)),
        "reviewM4aPath":"/"+str(m4afile.relative_to(ROOT)),
        "sha256":hashlib.sha256(m4afile.read_bytes()).hexdigest(),
        "durationSeconds":round(duration,3),
        "audioListeningApproved":False,"published":False,
        "manualBudgetMaximumCharacters":MAX_CHARS,
        "numberOfNewTtsRequests":1,
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: one distinct new V4 praise saved as .mp3 + .m4a on review branch; NO public release.",flush=True)
