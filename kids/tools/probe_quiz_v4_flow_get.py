#!/usr/bin/env python3
"""Check the OFFICIAL ElevenLabs Flow speech GET endpoint for one paid take.
GET ONLY, zero generation costs. No signed URLs or credentials are logged.
"""
import hashlib,json,os,subprocess,urllib.request,urllib.error
from pathlib import Path
ID="ki4e57kvaTCDQxzLio3o"
key=os.getenv("ELEVENLABS_API_KEY","").strip()
if not key:raise SystemExit("No authorized ElevenLabs key; no audio generation attempted")
url="https://api.elevenlabs.io/v1/flows/text-to-speech/"+ID
req=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
report={"generationId":ID,"endpoint":"official-get-flows-text-to-speech","generatedNewSpeech":False,"success":False}
try:
    with urllib.request.urlopen(req,timeout=30) as resp:
        obj=json.loads(resp.read().decode())
    report["status"]=obj.get("status")
    report["modelId"]=obj.get("model_id")
    report["returnedFields"]=[x for x in obj.keys() if x not in ("content_url","thumbnail_url")]
    if obj.get("status")!="completed" or not obj.get("content_url"):
        raise RuntimeError("Not completed or signed audio URL unavailable")
    signed=obj["content_url"]
    if not signed.startswith("https://storage.googleapis.com/"):
        raise RuntimeError("Unexpected signed asset host")
    with urllib.request.urlopen(signed,timeout=60) as resp:
        audio=resp.read()
    if len(audio)<2000 or not (audio.startswith(b"ID3") or audio[:1]==b"\xff"):
        raise RuntimeError("Audio data is not a valid MP3")
    out=Path("kids/assets/kids-quiz-audio/v4-review-001-020")/(ID+".mp3")
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(audio)
    proc=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(out)],capture_output=True,text=True,check=True)
    duration=float(proc.stdout.strip())
    if not .4<duration<180:raise RuntimeError("Implausible audio duration")
    report.update(success=True,sha256=hashlib.sha256(audio).hexdigest(),bytes=len(audio),durationSeconds=round(duration,3),localPath=str(out))
except urllib.error.HTTPError as e:
    report["httpError"]=e.code
    try:
        detail=json.loads(e.read().decode("utf-8"))
        reason=detail.get("detail") or detail.get("error") or {}
        report["providerErrorCode"]=str(reason.get("status") or reason.get("code") or "unknown")[:64] if isinstance(reason,dict) else "unknown"
        report["providerMessage"]=str(reason.get("message") or "")[:190] if isinstance(reason,dict) else str(reason)[:190]
    except Exception:
        report["providerErrorCode"]="unavailable"
    report["error"]="The documented Flow GET endpoint rejected the read-only original MP3 retrieval"
except Exception as e:
    report["error"]=str(e)[:160]
Path("kids/data/quiz-v4-flow-get-probe.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print("OFFICIAL_FLOW_GET_RESULT "+json.dumps(report,ensure_ascii=False),flush=True)
if not report["success"]:raise SystemExit(2)
