#!/usr/bin/env python3
"""Restore 21 uniquely mapped, ALREADY PAID Serhat eleven_v4 original MP3s.
Only authenticated ElevenLabs history GET, NEVER POST or a new synthesis.
Produce 14 exact child-click AAC recordings via existing pure offline importer.
Abort on any mismatch BEFORE modifying the public manifest.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-14-missing-real-v4-plan-v1.json"
MAPPING=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-history-recovery-map-v1.json"
IMPORTER=ROOT/"kids/tools/import-academy-sidq-click-gaps-v1.py"
ALIGNER=ROOT/"kids/tools/align-academy-sidq-de20-short-answer-v1.py"
ARCHIVE=ROOT/"kids/original-media/academy-sidq-click-gaps-v1"
LEDGER=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-originals-sha-v1.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
API="https://api.elevenlabs.io/v1/history/"
ID_RE=re.compile(r"^[A-Za-z0-9_-]{15,40}$")

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))
def digest(data):
    return hashlib.sha256(data).hexdigest()
def get(url,api_key,max_bytes):
    # No signed or secret URL is ever included in a log or persisted.
    req=urllib.request.Request(url,method="GET",headers={
        "xi-api-key":api_key,"User-Agent":"DAR-KIDS-OWNER-PAID-HISTORY-RESTORE/1"})
    with urllib.request.urlopen(req,timeout=45) as res:
        if res.status!=200:raise RuntimeError("Existing audio history GET failed")
        b=res.read(max_bytes+1)
        if len(b)>max_bytes:raise RuntimeError("History reply exceeded approved size")
        return b,res.headers.get_content_type()
def duration(path):
    p=subprocess.run(["ffprobe","-v","error","-select_streams","a:0",
        "-show_entries","stream=codec_name:format=duration",
        "-of","json",str(path)],capture_output=True,text=True,check=True)
    meta=json.loads(p.stdout)
    if len(meta.get("streams",[]))!=1 or meta["streams"][0]["codec_name"]!="mp3":
        raise RuntimeError("Not original MP3 audio")
    return float(meta["format"]["duration"])
def verified_plan():
    p=load(PLAN);m=load(MAPPING)
    if (p["voiceId"]!=VOICE or p["modelId"]!=MODEL or
        m["voiceId"]!=VOICE or m["modelId"]!=MODEL or m["sourceFlowId"]!=p["flowId"]):
        raise RuntimeError("Not owner-authorized V4 flow")
    originals=m["originals"]
    if len(originals)!=21 or len(set(x["historyItemId"] for x in originals))!=21:
        raise RuntimeError("Need exactly 21 distinct original ElevenLabs history objects")
    by_key={r["segment"]:r for r in originals}
    if set(by_key)!=set(p["segments"]):
        raise RuntimeError("Original segment inventory mismatch")
    for segment, spec in p["segments"].items():
        r=by_key[segment]
        expected_id="GBmSBMXAo9AwPA58e87w" if segment=="ar-07" else spec["generationId"]
        if r["generationId"]!=expected_id or r.get("modelId")!=MODEL:
            raise RuntimeError("Generation model identity mismatch: "+segment)
        if segment!="ar-07" and r["sessionId"]!=spec["sessionId"]:
            raise RuntimeError("Original provider session mismatch: "+segment)
        if (r.get("providerStatus")!="completed" or r.get("promptVerified") is not True
            or r.get("voiceVerified") is not True or
            not ID_RE.fullmatch(r["historyItemId"]) or
            not ID_RE.fullmatch(r["generationId"])):
            raise RuntimeError("Unverified provider receipt: "+segment)
    return p,m,originals
def recover(originals,key,target):
    ledger={}
    for count,rec in enumerate(originals,1):
        hid=rec["historyItemId"]
        info_bytes,info_mime=get(API+urllib.parse.quote(hid,safe=""),key,100_000)
        if info_mime not in ("application/json","text/json"):
            raise RuntimeError("Unexpected history metadata MIME for "+rec["segment"])
        meta=json.loads(info_bytes)
        identity_checks={
            "historyIdMatches": meta.get("history_item_id")==hid,
            "voiceMatchesOrUnspecifiedInHistory": meta.get("voice_id") in (None, "", VOICE),
            "modelMatches": meta.get("model_id")==MODEL,
            "sourceExpected": meta.get("source") in ("Flows","TTS"),
        }
        if not all(identity_checks.values()):
            # Print no user text, credentials, source URL or history item IDs.
            print("HISTORY_METADATA_IDENTITY_CHECK",rec["segment"],
                  json.dumps({"checks":identity_checks,
                      "source":str(meta.get("source"))[:40],
                      "availableFields":sorted(meta.keys())[:40]}),flush=True)
            raise RuntimeError("History original wrong voice/model/source: "+rec["segment"])
        when=int(meta.get("date_unix") or 0)
        if abs(when*1000-int(rec["createdAtUnixMs"]))>120_000:
            raise RuntimeError("History item creation timestamp mismatch: "+rec["segment"])
        audio,mime=get(API+urllib.parse.quote(hid,safe="")+"/audio",key,12*1024*1024)
        if mime not in ("audio/mpeg","audio/mp3","application/octet-stream"):
            raise RuntimeError("GET did not return original MP3")
        if not (1200<=len(audio)<=12*1024*1024):
            raise RuntimeError("Original MP3 byte length invalid")
        f=target/(rec["generationId"]+".mp3")
        f.write_bytes(audio)
        measured=duration(f)
        if abs(measured-float(rec["durationSeconds"]))>1.0:
            raise RuntimeError("Duration differs from exact Creative V4 receipt: "+rec["segment"])
        ledger[rec["segment"]]={
            "generationId":rec["generationId"],"sessionId":rec["sessionId"],
            "historyItemId":hid,"originalSha256":digest(audio),
            "originalBytes":len(audio),"durationSeconds":round(measured,3),
            "providerModel":meta["model_id"],"sourceVoiceInHistory":meta.get("voice_id"),
            "sourceVoiceFromVerifiedCreativeReceipt":VOICE}
        print("RECOVERED",count,"/21",rec["segment"],"original VERIFIED",flush=True)
    return ledger
def main():
    if len(sys.argv)!=2 or sys.argv[1] not in ("--verify","--restore"):
        raise SystemExit("Use --verify (zero GET), or --restore (GET only + exact offline assembly)")
    p,m,records=verified_plan()
    if sys.argv[1]=="--verify":
        print(json.dumps({"safe":True,"originals":len(records),"newGenerations":0,
            "expectedChildClickMedia":len(p["tasks"])},ensure_ascii=False))
        return
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("Missing GitHub ELEVENLABS_API_KEY secret")
    subprocess.run([sys.executable,str(IMPORTER),"--dry-run"],cwd=ROOT,check=True)
    with tempfile.TemporaryDirectory(prefix="dar-sidq-history-") as directory:
        source=pathlib.Path(directory)
        ledger=recover(records,key,source)
        # Before building the short child's answer, certify an EXACT spoken
        # first sentence boundary in the paid 11.12s original's alignments.
        subprocess.run([sys.executable,str(ALIGNER),"--source-dir",str(source)],
            cwd=ROOT,check=True)
        # The atomic offline importer writes exact real M4A bytes and SHA declarations.
        subprocess.run([sys.executable,str(IMPORTER),"--import",
            "--source-dir",str(source)],cwd=ROOT,check=True)
        # The aligner corrected the child-visible key in the canonical task.
        p=load(PLAN)
        document=load(ROOT/"kids/data/academy-audio.json")
        if sum(e.get("sourceLessonId")=="sidq" for e in document["entries"].values())!=72:
            raise RuntimeError("14 new exact-matched public recordings missing")
        for task in p["tasks"]:
            obj=document["entries"].get(task["visibleText"])
            if not obj or not obj.get("approvedForPlayback"):raise RuntimeError("Missing click text")
            local=ROOT/obj["url"].lstrip("/")
            if not local.is_file() or digest(local.read_bytes())!=obj["sha256"]:
                raise RuntimeError("Public child audio file not actually stored or hash mismatch")
        ARCHIVE.mkdir(parents=True,exist_ok=True)
        for row in records:
            src=source/(row["generationId"]+".mp3")
            dst=ARCHIVE/src.name
            if dst.exists():
                if digest(dst.read_bytes())!=digest(src.read_bytes()):
                    raise RuntimeError("Original MP3 archive collision")
            else:
                shutil.copy2(src,dst)
        LEDGER.write_text(json.dumps({
            "schemaVersion":1,"source":"authenticated-ElevenLabs-history-GET-only",
            "createdAtUtc":dt.datetime.now(dt.timezone.utc).isoformat(),
            "originals":ledger,"newTtsGenerations":0,
            "originalsArchivedInGitHub":21,
            "childPlayableM4aFilesAdded":14,
            "audioMergedWithoutGenerating":True,
            "cloudflareLiveConfirmed":False,
            "nativeDevicePlaybackVerified":False},ensure_ascii=False,indent=2)+"\n",
            encoding="utf-8")
        print("RECOVERY_COMPLETE originals=21 childM4A=14 voice=owner V4 newTTS=0",flush=True)
if __name__=="__main__": main()
