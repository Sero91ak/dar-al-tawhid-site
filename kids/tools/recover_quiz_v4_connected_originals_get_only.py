#!/usr/bin/env python3
"""Import already purchased connected ElevenLabs V4 MP3s into the quiz.

Only GET requests. NEVER synthesizes, retries paid POST, guesses MP3s, or
enables release. Each downloaded original must match immutable text/model/
voice and be a real decodable MP3 before its SHA enters the original registry.
Unrecoverable provider assets stay in the protected pending ledger.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONNECTED = ROOT / "kids/data/quiz-v4-connected-flow-originals-ledger.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
PAID = ROOT / "kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE = ROOT / "kids/data/quiz-curation-release.json"
OUTPUT = ROOT / "kids/assets/kids-quiz-audio/v4-curated450-review"
REPORT = ROOT / "kids/review-only/quiz-v4-connected-flow-get-import-report.json"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
GOOD_ID = re.compile(r"^[A-Za-z0-9_-]{16,60}$")


def read(p):
    return json.loads(p.read_text(encoding="utf-8"))


def write(p, o):
    p.parent.mkdir(parents=True, exist_ok=True)
    t=p.with_name(p.name+".tmp")
    t.write_text(json.dumps(o,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    t.replace(p)


def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def require(condition, msg):
    if not condition:
        raise RuntimeError("KIDS_V4_CONNECTED_RECOVERY_STOP: "+msg)


def request(url, key):
    q=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":"*/*"},method="GET")
    try:
        with urllib.request.urlopen(q,timeout=50) as r:
            return r.status,r.headers.get("Content-Type",""),r.read(1_500_001)
    except urllib.error.HTTPError as e:
        return e.code,"error",b""


def main():
    require(read(RELEASE).get("enabled") is False,"public release is not OFF")
    reg=read(REGISTRY);paid=read(PAID);connected=read(CONNECTED)
    require(reg.get("live") is False and paid.get("live") is False
            and reg.get("modelId")==MODEL and reg.get("voiceId")==VOICE
            and connected.get("modelId")==MODEL and connected.get("voiceId")==VOICE
            and connected.get("live") is False,"wrong protected V4 originals contract")
    candidates=connected.get("entries") or []
    require(len(candidates)<=100 and all(isinstance(x,dict) for x in candidates),
            "unrecognized paid source queue")
    old_rows={row["text"] for row in paid["rows"]}
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    require(bool(key),"read-only provider API key missing; NO credits spent")
    imported=[];blocked=[]
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for row in candidates:
        if row.get("status") != "GENERATED_AWAITING_ORIGINAL_MP3_IMPORT":
            continue
        text=row.get("sourceText")
        gid=row.get("generationId")
        require(isinstance(text,str) and sha(text)==row.get("sourceTextSHA256")
                and row.get("modelId")==MODEL and row.get("voiceId")==VOICE
                and isinstance(gid,str) and GOOD_ID.fullmatch(gid)
                and row.get("providerStatus")=="completed"
                and row.get("actualProviderCredits") is not None,
                "generation proof absent, not attempting any download")
        require(text not in reg["textClips"] and text not in old_rows,
                "audio already registered and paid; do not import twice")
        url="https://api.elevenlabs.io/v1/history/"+gid
        stat,content,body=request(url,key)
        if stat == 200:
            try:
                details=json.loads(body)
            except ValueError:
                raise RuntimeError("provider metadata not valid JSON")
            require(details.get("voice_id") in (None,VOICE)
                and details.get("model_id") in (None,MODEL)
                and details.get("text") in (None,text),
                "provider history mismatched recorded speech; STOP")
        elif stat in (400,402,403,404,422):
            blocked.append({"generationId":gid,"providerMetadataHTTP":stat,
                            "action":"Export original MP3 via ElevenLabs Download; NEVER regenerate"})
            continue
        else:
            require(False,"unexpected history metadata response HTTP "+str(stat))
        stat,content,data=request(url+"/audio",key)
        if stat != 200:
            blocked.append({"generationId":gid,"providerAudioHTTP":stat,
                            "action":"Manual ORIGINAL MP3 export, never another synthesis"})
            continue
        require(1500<len(data)<1_500_000
            and (data.startswith(b"ID3") or data[:1]==b"\xff")
            and ("audio/" in content or "octet-stream" in content),
            "provider response is not a valid original audio payload")
        target=OUTPUT/(hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()[:32]+".mp3")
        require(not target.exists(),"file already exists; prevent audio overwrite")
        pending=target.with_suffix(".mp3.pending")
        pending.write_bytes(data)
        try:
            p=subprocess.run(["ffprobe","-v","error","-show_entries",
                  "format=duration:stream=codec_name,codec_type","-of","json",str(pending)],
                  capture_output=True,text=True,check=True)
            meta=json.loads(p.stdout)
            tracks=[a for a in meta.get("streams",[]) if a.get("codec_type")=="audio"]
            require(len(tracks)==1 and tracks[0].get("codec_name")=="mp3"
                    and .3<float(meta.get("format",{}).get("duration",0))<180,
                    "unplayable MP3, original remains pending")
            pending.replace(target)
        finally:
            if pending.exists():
                pending.unlink()
        digest=hashlib.sha256(data).hexdigest()
        reg["textClips"][text]={
            "url":"/"+str(target.relative_to(ROOT)),"sha256":digest,
            "textSha256":sha(text),"bytes":len(data),"voiceId":VOICE,"modelId":MODEL,
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "source":"confirmed-original-elevenlabs-creative-history-read-only",
            "providerGenerationId":gid,"originalGenerationId":gid,
            "status":"REVIEW_ONLY_ORIGINAL_MP3_NOT_PUBLISHED"}
        paid["rows"].append({
            "batchId":"KIDS_CONNECTED_CREATIVE_ALREADY_PAID_V4",
            "text":text,"textSha256":sha(text),"mp3Sha256":digest,
            "exactBilledCredits":row.get("actualProviderCredits"),
            "providerGenerationId":gid,"providerRequestId":None,
            "note":"Provider run already completed; recovered original by GET ONLY, no new purchase"})
        row["status"]="IMPORTED_ORIGINAL_MP3_VERIFIED"
        row["originalMP3ImportedIntoGithub"]=True
        row["originalMP3URL"]="/"+str(target.relative_to(ROOT))
        row["originalMP3SHA256"]=digest
        row["importedMP3SHA256"]=digest
        write(REGISTRY,reg);write(PAID,paid);write(CONNECTED,connected)
        imported.append({"sourceTextSHA256":sha(text),"generationId":gid,
                         "sha256":digest,"bytes":len(data)})
    write(REPORT,{"scope":"TAWHID_KIDS_V4_CONNECTED_GET_ONLY",
        "paidRequestsStarted":0,"creditsSpentOnRecovery":0,
        "originalsImported":len(imported),"imported":imported,
        "blocked":blocked,"publicQuizReleaseChanged":False,
        "humanListeningApprovalGiven":False})
    print("CONNECTED_V4_PAID_ORIGINALS_RECOVERY "+json.dumps({
        "imported":len(imported),"blocked":len(blocked),
        "remainingProviderOriginals":sum(x.get("status")=="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT" for x in candidates),
        "newPaidSpeechRequests":0},ensure_ascii=False),flush=True)


if __name__=="__main__":
    main()
