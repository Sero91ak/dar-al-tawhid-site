#!/usr/bin/env python3
"""Attempt zero-credit ORIGINAL ElevenCreative V4 recovery for nine older paid takes.

These nine saved generation IDs predate the newer connected-flow ledger.
Official ElevenLabs GET /v1/flows/text-to-speech/{generation_id} may return
a signed MP3. Download ORIGINAL ONLY. Import with the existing historic
receipt/voice/codec verifier. Never synthesize, renew, or repurchase a take.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from recover_quiz_v4_connected_flow_originals_get import request_json,mp3_from_signed_url,check
OLD=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument("--output",type=Path,required=True)
    a.add_argument("--audit",action="store_true")
    args=a.parse_args()
    old=json.loads(OLD.read_text(encoding="utf-8"))
    reg=json.loads(REG.read_text(encoding="utf-8"))
    release=json.loads(RELEASE.read_text(encoding="utf-8"))
    check(not release["enabled"] and not reg["live"],"not a review-only recovery")
    rows=old["items"]
    check(len(rows)==9 and len({x["generationId"] for x in rows})==9,
          "nine paid provider original ID contract changed")
    needed=[]
    for x in rows:
        check(x["existingPaid"] is True and x["newSynthesisAllowed"] is False
              and x["modelId"]==MODEL and x["voiceId"]==VOICE,
              "original paid generation lost its do-not-regenerate protection")
        check(hashlib.sha256(x["originalSpokenText"].encode("utf-8")).hexdigest(),
              "original source text absent")
        if x["generationId"] not in reg["generationClips"]:
            needed.append(x)
    print("KIDS_V4_PREPAID9_FREE_GET_AUDIT "+json.dumps({
        "priorPaidTakesMissing":len(needed),
        "alreadyImported":9-len(needed),
        "newSpeechCreditsSpent":0,
        "providerPOSTRequests":0},ensure_ascii=False),flush=True)
    if args.audit:return
    check(bool(needed),"nothing missing from historical nine; no provider calls")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"official read-only provider API key unavailable")
    args.output.mkdir(parents=True,exist_ok=True)
    got=0;errors=[]
    for item in needed:
        gid=item["generationId"]
        path=args.output/(gid+".mp3")
        if path.is_file():
            check(path.stat().st_size>1800,"prior paid MP3 seems incomplete")
            continue
        try:
            data=request_json(gid,key)
            check(data.get("content_mime_type") in ("audio/mpeg","audio/mp3","application/octet-stream",None),
                  "provider returned non-audio original")
            audio=mp3_from_signed_url(data.get("content_url"))
            path.write_bytes(audio)
            got+=1
            print("KIDS_V4_OLD_PAID_ORIGINAL_MP3_GET "+
                json.dumps({"generationId":gid,"bytes":len(audio),
                            "sha256":hashlib.sha256(audio).hexdigest()}),flush=True)
        except Exception as e:
            errors.append({"generationId":gid,"errorType":type(e).__name__,
                           "errorCode":str(getattr(e,"code","unavailable"))})
    print("KIDS_V4_PREPAID9_FREE_GET_END "+json.dumps({
        "downloadedOriginals":got,
        "unavailableOriginals":errors,
        "newSpeechCredits":0,
        "newSynthesisCalls":0},ensure_ascii=False),flush=True)
    if not any(args.output.glob("*.mp3")):
        raise RuntimeError("Provider did not expose original MP3 for any of the nine already paid IDs; no new charges")

if __name__=="__main__":
    main()
