#!/usr/bin/env python3
"""Download already-paid ElevenLabs ElevenCreative V4 MP3 originals via official GET.

NO TTS calls, POSTs, retries, credit purchases, synthetic substitutes or
public app changes. Downloads only the exact confirmed generation IDs that
the KIDS quiz connected-flow source ledger identifies as already paid.
All MP3 bytes are sent through the existing exact-source offline importer.
Uses the documented read-only ElevenLabs GET /v1/flows/text-to-speech/{id}.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
FLOW=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
STATUS="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"
URL="https://api.elevenlabs.io/v1/flows/text-to-speech/"
MAX_BYTES=6_000_000

def check(cond,msg):
    if not cond:
        raise RuntimeError("V4_PREPAID_GET_STOP: "+msg)

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def request_json(id_,key):
    req=urllib.request.Request(URL+id_,headers={
        "xi-api-key":key,"Accept":"application/json",
        "User-Agent":"TAWHID-KIDS-original-only-no-TTS/1"},method="GET")
    with urllib.request.urlopen(req,timeout=35) as response:
        check(response.status==200,"provider GET returned non-200")
        check("json" in response.headers.get("Content-Type",""),
              "provider GET did not supply JSON")
        result=json.loads(response.read(100000).decode("utf-8"))
    check(isinstance(result,dict) and result.get("id")==id_,
          "unexpected generation id or provider response")
    check(result.get("status")=="completed",
          "original generation not completed; no new purchase")
    return result

def mp3_from_signed_url(content_url):
    check(isinstance(content_url,str) and len(content_url)<5000,
          "missing signed original media URL")
    u=urllib.parse.urlparse(content_url)
    check(u.scheme=="https" and u.hostname=="storage.googleapis.com"
          and u.username is None and u.password is None and u.fragment=="",
          "original media must use trusted Google Cloud storage HTTPS")
    check(u.path.startswith(("/xi-backend/database/workspace/","/generations/")),
          "unexpected media location")
    # The provider's temporary signed URL is never printed, copied to the
    # public repo or persisted in the ledger; only original bytes are saved.
    req=urllib.request.Request(content_url,headers={
        "Accept":"audio/mpeg,application/octet-stream",
        "User-Agent":"TAWHID-KIDS-original-only-no-TTS/1"},method="GET")
    with urllib.request.urlopen(req,timeout=75) as response:
        check(response.status==200,"original download returned non-200")
        payload=response.read(MAX_BYTES+1)
    check(1800<len(payload)<MAX_BYTES,
          "downloaded provider MP3 was empty or too large")
    check(payload.startswith(b"ID3") or payload[0]==255,
          "download was not original MP3 bytes")
    return payload

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output",type=Path,required=True)
    ap.add_argument("--audit",action="store_true",
                    help="Read local provider source hashes only; NO NETWORK")
    a=ap.parse_args()
    flow,reg,release=load(FLOW),load(REG),load(RELEASE)
    check(release.get("enabled") is False,"public release is ON")
    check(flow.get("modelId")==MODEL and flow.get("voiceId")==VOICE
          and flow.get("live") is False
          and reg.get("voiceId")==VOICE and reg.get("modelId")==MODEL
          and reg.get("live") is False,"unexpected V4 source identity")
    previous=set(reg.get("textClips") or {})
    pending=[x for x in flow.get("entries",[]) if x.get("status")==STATUS]
    ids=set()
    texts=set()
    for row in pending:
        gid=row.get("generationId")
        s=row.get("sourceText")
        check(isinstance(gid,str) and re.fullmatch(r"[A-Za-z0-9]{20}",gid)
              and gid not in ids,"invalid or repeated generation ID")
        check(isinstance(s,str) and s not in texts and s not in previous,
              "text already paid elsewhere or duplicated")
        check(row.get("sourceTextSHA256")==hashlib.sha256(s.encode("utf-8")).hexdigest(),
              "the spoken exact source was modified")
        check(row.get("modelId")==MODEL and row.get("voiceId")==VOICE
              and row.get("providerStatus")=="completed"
              and row.get("originalMP3ImportedIntoGithub") is False,
              "not a confirmed original pending file")
        ids.add(gid)
        texts.add(s)
    print("KIDS_CONNECTED_V4_GET_AUDIT "+
          json.dumps({"pendingConfirmedPaidOriginals":len(pending),
                      "allOriginalIdsUnique":len(ids)==len(pending),
                      "synthesisRequests":0},ensure_ascii=False),flush=True)
    if a.audit:
        return
    check(bool(pending),"no already-paid audio to retrieve")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    check(bool(key),"read-only API key unavailable; nothing synthesized")
    a.output.mkdir(parents=True,exist_ok=True)
    success=0
    problems=[]
    for row in pending:
        gid=row["generationId"]
        dst=a.output/(gid+".mp3")
        if dst.is_file():
            check(len(dst.read_bytes())>1800,"an existing incomplete MP3 download was found")
            continue
        try:
            remote=request_json(gid,key)
            mime=remote.get("content_mime_type")
            check(mime in ("audio/mpeg","audio/mp3","application/octet-stream",None),
                  "provider returned non-audio content")
            audio=mp3_from_signed_url(remote.get("content_url"))
            dst.write_bytes(audio)
            success+=1
            print("KIDS_V4_PAID_ORIGINAL_MP3_RETRIEVED "+
                  json.dumps({"generationId":gid,"bytes":len(audio),
                              "sha256":hashlib.sha256(audio).hexdigest()}),flush=True)
        except Exception as err:
            # No attempt at a new text generation and no blind retry.
            # Print status only, never the signed URL or API token.
            status=err.code if isinstance(err,urllib.error.HTTPError) else type(err).__name__
            problems.append({"generationId":gid,"errorType":str(status)})
    print("KIDS_V4_ORIGINAL_GET_END "+json.dumps(
        {"originalsDownloadedNow":success,"unavailableOriginals":problems,
         "newSpeechCreditsSpent":0,"providerPOSTRequests":0},
        ensure_ascii=False),flush=True)
    if not any(a.output.glob("*.mp3")):
        raise RuntimeError("No original V4 MP3 downloadable by the provider GET endpoint: zero new charges")

if __name__=="__main__":
    main()
