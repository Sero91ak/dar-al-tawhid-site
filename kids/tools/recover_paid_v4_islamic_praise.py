#!/usr/bin/env python3
"""Recover one already-paid Serhat V4 KIDS praise via the ElevenLabs history API.

READ-ONLY ElevenLabs operations: GET /history, GET /history/{id},
GET /history/{id}/audio. Never calls TTS, voice change or any billable API.
Stores a REVIEW ONLY asset on the current GitHub test branch; no public manifest
is modified or released. Fails closed on wrong voice/model/text or absent history.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT=Path(__file__).resolve().parents[2]
RECORD=ROOT/"kids/data/quiz-v4-islamic-praise-pilot.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/serhat-islamic-praise-v4-reviewed-pending.m4a"
API="https://api.elevenlabs.io/v1"

def canonical(text:object)->str:
    return unicodedata.normalize("NFC"," ".join(str(text or "").split()))

def get(endpoint:str, key:str)->tuple[bytes,str]:
    if not endpoint.startswith("/history"):
        raise ValueError("Security guard: history-only GET request allowed")
    request=urllib.request.Request(API+endpoint,method="GET",headers={
        "xi-api-key":key,"Accept":"application/json,audio/mpeg","User-Agent":"DAR-KIDS-NoCreditV4Recovery/1"
    })
    with urllib.request.urlopen(request,timeout=35) as response:
        return response.read(),response.headers.get("Content-Type","")

def history_match(item:dict,pilot:dict)->bool:
    return (canonical(item.get("text"))==canonical(pilot["text"]) and
            item.get("model_id")=="eleven_v4" and
            item.get("voice_id")==pilot["voiceId"])

def find_paid_history_item(key:str,pilot:dict)->dict:
    # Flow generation IDs are not guaranteed to be account history-item IDs.
    generation_id=pilot["generationId"]
    try:
        raw,_=get("/history/"+urllib.parse.quote(generation_id,safe=""),key)
        obj=json.loads(raw.decode("utf-8"))
        if history_match(obj,pilot):
            return obj
    except (urllib.error.HTTPError,ValueError,json.JSONDecodeError):
        pass
    cursor=""
    seen=set()
    for _ in range(4):
        params={"page_size":"100","source":"TTS","search":"Allāhumma bārik"}
        if cursor:params["start_after_history_item_id"]=cursor
        raw,_=get("/history?"+urllib.parse.urlencode(params),key)
        batch=json.loads(raw.decode("utf-8"))
        rows=batch.get("history") or []
        for row in rows:
            if history_match(row,pilot):return row
        if not batch.get("has_more") or not rows:break
        cursor=rows[-1].get("history_item_id") or ""
        if not cursor or cursor in seen:break
        seen.add(cursor)
    raise RuntimeError("Approved Serhat V4 original not found in ElevenLabs API-key history; DO NOT regenerate")

def duration(path:Path)->float:
    info=subprocess.run(["ffmpeg","-hide_banner","-i",str(path)],
        capture_output=True,text=True)
    m=re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",info.stderr)
    if not m:raise ValueError("Cannot verify actual audio duration")
    return 3600*int(m[1])+60*int(m[2])+float(m[3])

def main()->None:
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("ELEVENLABS_API_KEY unavailable; stop without uploading or generating")
    pilot=json.loads(RECORD.read_text(encoding="utf-8"))
    if pilot["modelId"]!="eleven_v4" or pilot["voiceId"]!="DkU7j9uO4ZEtLD2iRZSH":
        raise RuntimeError("Mastervoice/model guard mismatch")
    if OUTPUT.exists():raise RuntimeError("Recovered file already exists: never overwrite without review")
    item=find_paid_history_item(key,pilot)
    history_id=item.get("history_item_id")
    if not history_id:raise RuntimeError("Matched record has no history_item_id")
    audio,ctype=get("/history/"+urllib.parse.quote(history_id,safe="")+"/audio",key)
    if len(audio)<1400 or not (audio.startswith(b"ID3") or audio[:1]==b"\\xff"):
        raise RuntimeError("History audio is missing, tiny or not an MP3 file")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="kids-paid-v4-recover-") as t:
        original=Path(t)/"original.mp3"
        result=Path(t)/"result.m4a"
        original.write_bytes(audio)
        original_secs=duration(original)
        if abs(original_secs-float(pilot["durationSeconds"]))>2.0:
            raise RuntimeError(f"Unexpected source audio duration: {original_secs}")
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
            "-i",str(original),"-ac","1","-ar","48000",
            "-c:a","aac","-b:a","48k","-movflags","+faststart",str(result)],check=True)
        joined_secs=duration(result)
        if result.stat().st_size<1700 or abs(joined_secs-original_secs)>0.7:
            raise RuntimeError("Recovered V4 audio transcode invalid")
        result.replace(OUTPUT)
    pilot["status"]="original-v4-audio-recovered-on-review-branch-awaiting-human-approval"
    pilot["sourceHistoryItemId"]=history_id
    pilot["localAudioPath"]="/"+str(OUTPUT.relative_to(ROOT))
    pilot["sha256"]=hashlib.sha256(OUTPUT.read_bytes()).hexdigest()
    pilot["recoveredAudioDurationSeconds"]=round(duration(OUTPUT),3)
    pilot["recoveredAudioBytes"]=OUTPUT.stat().st_size
    pilot["published"]=False
    pilot["qaListeningApproved"]=False
    pilot["originalAudioImportRequired"]=False
    RECORD.write_text(json.dumps(pilot,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: pre-existing V4-only Serhat recording recovered without any ElevenLabs generation")
    print("REVIEW_ONLY_FILE="+str(OUTPUT))
    print("HISTORY_ITEM_ID="+history_id)
    print("BYTE_COUNT="+str(pilot["recoveredAudioBytes"]))

if __name__=="__main__":
    main()
