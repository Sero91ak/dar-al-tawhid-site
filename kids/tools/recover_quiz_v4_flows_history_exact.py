#!/usr/bin/env python3
"""Zero-synthesis import of already paid ElevenLabs Flow speech from HISTORY.

This tool performs GET requests only, never POST generation. It maps history
items by exact text+model+voice+source, requires ONE unambiguous historical
match per connected Generation ID, validates MP3 codec/duration and then
delegates all immutable-SHA bookkeeping to the existing private importer.
If a Flow generation cannot be proven unique, leave it unimported.

Uses the authenticated ElevenLabs API key only in CI environment. No key,
signed URLs or raw provider auth headers are written into Git.
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import import_quiz_v4_connected_flow_originals as importer

MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
API="https://api.elevenlabs.io/v1"
BATCH_LIMIT=150
AUDIO_LIMIT_BYTES=2_500_000

def fetch(url, key, audio=False):
    req=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":"audio/mpeg" if audio else "application/json"},method="GET")
    try:
        with urllib.request.urlopen(req,timeout=35) as response:
            ctype=response.headers.get("Content-Type","").split(";")[0].lower()
            data=response.read(AUDIO_LIMIT_BYTES+1 if audio else 3_000_000)
    except urllib.error.HTTPError as e:
        raise RuntimeError("ElevenLabs authenticated history GET HTTP "+str(e.code)+"; no TTS POST used") from None
    if audio:
        if len(data)>AUDIO_LIMIT_BYTES or len(data)<1400 or not(data[:3]==b"ID3" or data[:1]==b"\xff"):
            raise RuntimeError("History audio GET returned missing, non-MP3, or out-of-bounds bytes")
    else:
        if ctype!="application/json" and not data.startswith(b"{"):
            raise RuntimeError("History metadata GET did not yield JSON")
    return data

def flow_generation_original(e, key):
    """Retrieve a fresh signed MP3 URL from official Flows GET – no TTS."""
    gid=e["generationId"]
    # The Flow *generation* ID differs from the regular TTS history_item_id.
    # This is the correct read-only endpoint for Creative Studio recordings:
    # GET /v1/flows/text-to-speech/{generation_id}
    response=json.loads(fetch(API+"/flows/text-to-speech/"+
                              urllib.parse.quote(gid,safe=""),key))
    completed=response.get("completed") if isinstance(response.get("completed"),dict) else response
    if (completed.get("status")!="completed" or
            completed.get("id")!=gid):
        raise RuntimeError("Original Flow generation is not confirmed completed by provider")
    url=completed.get("content_url")
    if not isinstance(url,str) or not url:
        raise RuntimeError("Completed Flow original has no signed audio URL")
    parts=urllib.parse.urlsplit(url)
    if parts.scheme!="https" or parts.hostname not in (
            "storage.googleapis.com","storage.cloud.google.com"):
        raise RuntimeError("Unexpected signed Flow audio origin")
    # The official Flows endpoint may return extensionless
    # /generations/<id> URLs with content_mime_type=audio/mpeg.
    # Validate the actual MP3 bytes below, not the file extension alone.
    mime=completed.get("content_mime_type")
    if parts.username or parts.password or not (
            parts.path.endswith(".mp3")
            or (parts.path.startswith("/generations/") and mime in
                ("audio/mpeg","audio/mp3","audio/x-mpeg"))):
        raise RuntimeError("Unsafe or non-audio provider generation asset")
    # Do not print or persist any signed URL or credential. This URL may expire,
    # so fetch on demand from the immutable generation ID each time.
    req=urllib.request.Request(url,headers={"Accept":"audio/mpeg"},method="GET")
    try:
        with urllib.request.urlopen(req,timeout=50) as r:
            audio=r.read(AUDIO_LIMIT_BYTES+1)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("Provider signed original download HTTP "+
                           str(exc.code)+"; NO TTS RETRY") from None
    if (not 1400<len(audio)<=AUDIO_LIMIT_BYTES
            or not(audio.startswith(b"ID3") or audio[:1]==b"\xff")):
        raise RuntimeError("Original signed Flow audio not a valid bounded MP3")
    return audio


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--audit",action="store_true",help="No API calls at all")
    p.add_argument("--restore",action="store_true",help="GET existing paid originals; never new generation")
    p.add_argument("--limit",type=int,default=10)
    args=p.parse_args()
    if args.audit or not args.restore:
        flow,reg,paid,takes,by_text=importer.expected()
        q=[x for x in flow["entries"] if x["status"]==importer.PENDING]
        print(json.dumps({"source":"ELEVENLABS_FLOWS_HISTORY_READ_ONLY",
          "knownGenerationIds":len(takes),"awaitingOriginalMP3Import":len(q),
          "recoveryCalls":0,"newTTSGenerations":0,"newCreditsSpent":0,
          "publicRelease":False},ensure_ascii=False))
        return
    if not(0<args.limit<=BATCH_LIMIT):
        raise RuntimeError("Invalid bounded GET recovery limit")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    if not key:
        raise RuntimeError("No ElevenLabs CI API key – no download attempted")
    flow,reg,paid,takes,by_text=importer.expected()
    todo=[x for x in flow["entries"] if x["status"]==importer.PENDING][:args.limit]
    if not todo:
        print("ALREADY_IMPORTED_ALL_EXISTING_FLOW_ORIGINALS")
        return
    # ElevenLabs' official history endpoint distinguishes 'Flows' from TTS.
    # Do not confuse generationId with history_item_id: the two may differ!
    by_phrase={}
    after=None
    for page in range(6):
        query={"source":"Flows","voice_id":VOICE,"page_size":"100"}
        if after: query["start_after_history_item_id"]=after
        url=API+"/history?"+urllib.parse.urlencode(query)
        response=json.loads(fetch(url,key))
        items=response.get("history")
        if not isinstance(items,list):
            raise RuntimeError("Unexpected ElevenLabs history response; no import")
        for h in items:
            if not isinstance(h,dict) or h.get("source") not in ("Flows","TTS"):
                continue
            if h.get("voice_id")!=VOICE or h.get("model_id")!=MODEL:
                continue
            spoken=h.get("text")
            hid=h.get("history_item_id")
            if spoken in by_text and isinstance(hid,str) and hid:
                by_phrase.setdefault(spoken,[]).append(hid)
        if not response.get("has_more"):break
        new_after=response.get("last_history_item_id")
        if not isinstance(new_after,str) or not new_after or new_after==after:
            raise RuntimeError("History pagination stalled; refuse ambiguous import")
        after=new_after
    print(json.dumps({"historyMatchedExactTexts":len(by_phrase),
                      "pendingBefore":len(todo),"historyListingIsFreeGET":True},ensure_ascii=False),flush=True)
    with tempfile.TemporaryDirectory(prefix="tawhid-kids-v4-nocharge-history-") as temp:
        d=Path(temp)
        recoveries=[]
        for e in todo:
            # Prefer the immutable provider generation GET; Flows need not
            # appear in the older text-to-speech History list at all.
            try:
                audio=flow_generation_original(e,key)
                pathway="ORIGINAL_FLOWS_GENERATION_GET"
            except RuntimeError as flow_error:
                spoken=e["sourceText"]
                history_ids=list(dict.fromkeys(by_phrase.get(spoken,[])))
                if len(history_ids)!=1:
                    recoveries.append({
                        "generationId":e["generationId"],
                        "status":"ORIGINAL_NOT_RECOVERABLE_BY_READ_ONLY_GET",
                        "historyCandidateCount":len(history_ids),
                        "flowGETError":str(flow_error)[:180]})
                    continue
                hid=history_ids[0]
                audio=fetch(API+"/history/"+urllib.parse.quote(hid,safe="")+"/audio",
                            key,audio=True)
                pathway="EXACT_HISTORY_ITEM_GET"
            target=d/(e["generationId"]+".mp3")
            target.write_bytes(audio)
            # The existing importer independently verifies format, duration,
            # source SHA, generation IDs and immutable paid receipts.
            recoveries.append({"generationId":e["generationId"],
                "status":pathway,"bytes":len(audio)})
        print("HISTORY_GET_RESULTS "+json.dumps(recoveries,ensure_ascii=False),flush=True)
        if not list(d.glob("*.mp3")):
            raise RuntimeError("No unique paid historical flow originals downloadable: all generation IDs remain protected from resynthesis")
        importer.run(d)
        print("SUCCESS_EXACT_ORIGINALS_IMPORTED_FROM_PROVIDER_HISTORY_GET")

if __name__=="__main__":main()
