#!/usr/bin/env python3
"""Cost-free direct import of remaining, ALREADY PAID Eleven V4 Flow MP3s.

GET-only official Flow API and signed private media endpoints. No POST, no
regeneration, no newly billed ElevenLabs credits. Refuses bad MP3s/unknown IDs.
Never prints or commits a signed URL, API secret or response body.
If ElevenLabs still returns HTTP 402, emit a sanitized audit and exit with the
originals safely untouched; no repeated calls are made for this condition.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,urllib.error,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
RECEIPT=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/"kids/paid-flow-originals-inbox"
STATUS=ROOT/"kids/data/quiz-v4-paid-flow-official-get-retry.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def read(p):return json.loads(p.read_text(encoding="utf-8"))

def main():
    expected=read(RECEIPT)
    registry=read(REG)
    if len(expected["items"])!=20 or registry.get("voiceId")!=VOICE or registry.get("modelId")!=MODEL:
        raise RuntimeError("Original paid 56 ID receipts or voice integrity failure")
    wanted={take["generationId"]:take for q in expected["items"] for take in q.get("recordings",[])}
    if len(wanted)!=56:raise RuntimeError("Expected exactly 56 original generation IDs")
    existing=set((registry.get("generationClips") or {}).keys())
    if not existing.issubset(wanted):raise RuntimeError("Registry has unrelated original IDs")
    pending=sorted(set(wanted)-existing)
    audit={"scope":"KIDS V4 PREPAID DIRECT-GET RETRY","expectedOriginals":56,
           "previouslyImported":len(existing),"pendingOriginalsAtStart":len(pending),
           "newlyRecoveredNow":0,"providerHTTPCode":None,"providerErrorCode":None,
           "bytesDownloaded":0,"officialGETAvailable":False,
           "newVoiceGenerationCalls":0,"newSynthesisCredits":0,
           "originalsTouched":False,"liveRelease":False}
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:
        audit["blocked"]="GitHub ElevenLabs key not configured"
    else:
        OUT.mkdir(exist_ok=True,parents=True)
        for gid in pending:
            req=urllib.request.Request("https://api.elevenlabs.io/v1/flows/text-to-speech/"+gid,
                 headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
            try:
                with urllib.request.urlopen(req,timeout=25) as r:
                    info=json.loads(r.read(1000000).decode("utf-8"))
                url=info.get("content_url") or ""
                host=urllib.parse.urlparse(url)
                if info.get("status")!="completed" or host.scheme!="https" or host.hostname!="storage.googleapis.com":
                    raise RuntimeError("Official ElevenLabs original URL invalid")
                with urllib.request.urlopen(url,timeout=60) as response:
                    b=response.read(6000000)
                if len(b)<1800 or not(b.startswith(b"ID3") or b[:1]==b"\xff"):
                    raise RuntimeError("MP3 incomplete or wrong data")
                dest=OUT/(gid+".mp3")
                if dest.exists():
                    if hashlib.sha256(dest.read_bytes()).digest()!=hashlib.sha256(b).digest():
                        raise RuntimeError("Previously downloaded same generation differs")
                else:
                    dest.write_bytes(b)
                audit["newlyRecoveredNow"]+=1
                audit["bytesDownloaded"]+=len(b)
                audit["officialGETAvailable"]=True
            except urllib.error.HTTPError as e:
                audit["providerHTTPCode"]=e.code
                try:
                    error=json.loads(e.read(3000).decode("utf-8"))
                    detail=error.get("detail") or {}
                    audit["providerErrorCode"]=str(detail.get("status") or "unknown") if isinstance(detail,dict) else "unknown"
                except Exception:
                    audit["providerErrorCode"]="unknown"
                audit["blocked"]="Provider denied read-only retrieval; not a reason to regenerate paid recordings"
                break
            except Exception as e:
                audit["blocked"]=str(e)[:130]
                break
    audit["bytesDownloaded"] = int(audit["bytesDownloaded"])
    STATUS.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_PREPAID_READONLY_API "+json.dumps(audit,ensure_ascii=False),flush=True)
    if audit["newlyRecoveredNow"]:
        print("NEW_ORIGINAL_MP3S_ARE_IN_LOCAL_INBOX_USE_EXISTING_SAFE_IMPORT_SCRIPT",flush=True)

if __name__=="__main__":main()
