#!/usr/bin/env python3
"""GET-only attempt to recover already-paid Creative Studio V4 MP3 bytes.

Never synthesizes, retries a charged request, modifies a public quiz file or
writes signed URLs/credentials to a GitHub artifact. Original generation IDs
MUST come from the immutable connected escrow, never be inferred from prompts.
An API denial is safely reported: no blind purchase or source substitution.
"""
from __future__ import annotations
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
import tempfile
from import_quiz_v4_connected_flow_originals import expected, run, probe

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"kids/review-only/quiz-v4-connected-flow-get-only-recovery-report.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def require(x,msg):
    if not x:raise RuntimeError("KIDS_V4_CONNECTED_ORIGINAL_GET: "+msg)

def fetch_json(url,key):
    req=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
    with urllib.request.urlopen(req,timeout=25) as r:
        require(r.status==200,"provider refused read-only generation metadata")
        return json.loads(r.read(1000000).decode("utf-8"))

def download_signed(url):
    parts=urllib.parse.urlsplit(url)
    require(parts.scheme=="https"
        and parts.hostname in ("storage.googleapis.com",
                               "storage.cloud.google.com",
                               "cdn.elevenlabs.io"),
        "untrusted provider audio download host")
    request=urllib.request.Request(url,headers={"Accept":"audio/mpeg"},method="GET")
    with urllib.request.urlopen(request,timeout=65) as r:
        require(r.status==200,"signed original download failed")
        data=r.read(6000001)
    require(1800<len(data)<6000000 and
            (data.startswith(b"ID3") or data[:1]==bytes([255])),
            "provider result is not an actual bounded MP3 original")
    return data

def main():
    flow,reg,ledger,by_id,by_text=expected()
    need=sorted((e for e in flow["entries"]
                 if e["status"]=="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"),
                key=lambda e:e["generationId"])
    report={"scope":"KIDS_V4_CONNECTED_PAID_ORIGINALS_GET_ONLY",
            "requestedOriginals":len(need),
            "providerGETsAttempted":0,
            "downloadedOriginals":0,
            "importedOriginals":0,
            "providerHTTP":None,
            "failedGenerationId":None,
            "newPaidSpeechCalls":0,
            "newSynthesisCredits":0,
            "modelId":MODEL,"voiceId":VOICE,
            "reusedAlreadyPaidGenerationsOnly":True,
            "humanListeningApproved":False,
            "publicReleaseEnabled":False}
    require(len(need)<=25,"too many paid generations in a single read-only recovery attempt")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:
        report["blocked"]="GitHub ElevenLabs API secret unavailable"
    else:
        # Original bytes exist only inside this temporary inbox until the
        # verifier imports them into immutable private MP3 paths.
        with tempfile.TemporaryDirectory(prefix="kids-v4-paid-original-get-only-") as td:
            inbox=Path(td)
            for e in need:
                gid=e["generationId"]
                try:
                    report["providerGETsAttempted"]+=1
                    meta=fetch_json("https://api.elevenlabs.io/v1/flows/text-to-speech/"+gid,key)
                    if meta.get("model_id") not in (None,MODEL):
                        raise RuntimeError("provider generation V4 model changed")
                    if meta.get("voice_id") not in (None,VOICE):
                        raise RuntimeError("provider generation master voice changed")
                    if meta.get("generation_id") not in (None,gid):
                        raise RuntimeError("provider generation ID mismatch")
                    if meta.get("status")!="completed":
                        raise RuntimeError("original generation not yet downloadable")
                    url=meta.get("content_url")
                    require(isinstance(url,str) and url,"provider returned no original download URL")
                    media=download_signed(url)
                    path=inbox/(gid+".mp3")
                    path.write_bytes(media)
                    probe(path,e["providerGenerationDurationSeconds"])
                    report["downloadedOriginals"]+=1
                except urllib.error.HTTPError as exc:
                    report["providerHTTP"]=exc.code
                    report["failedGenerationId"]=gid
                    report["blocked"]="Provider read-only original download denied; retain paid generation and do not regenerate."
                    break
                except (OSError,ValueError,RuntimeError) as exc:
                    report["failedGenerationId"]=gid
                    report["blocked"]="Provider returned unusable original or no verified MP3; no resynthesis."
                    break
            if report["downloadedOriginals"]:
                status=run(inbox)
                report["importedOriginals"]=len(status["newlyImportedProviderGenerationIds"])
                require(report["importedOriginals"]==report["downloadedOriginals"],
                        "provider MP3 count does not match validated zero-credit import")
    # Never save signed original audio URLs, API keys, signed thumbnails,
    # arbitrary network exception bodies, or anything from provider headers.
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_ORIGINAL_PAID_GET_ONLY "+json.dumps(report,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
