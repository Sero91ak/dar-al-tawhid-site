#!/usr/bin/env python3
"""GET-only import of already-paid ElevenLabs Flow voice MP3 originals.

The Creative Studio generation-ID is never treated as a history-ID.
No POST, no rerender, no paid TTS, no transient/signed URLs in the repo.
The GitHub runner fetches signed media URLs freshly with its API secret,
immediately downloads the original MP3 bytes, validates via the existing
offline importer, and stores durable review-only assets in the branch.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids/tools"))
from import_quiz_v4_connected_flow_originals import expected, run
from quiz_v4_no_double_charge_guard import protect_paid_texts

GENERATION_API = "https://api.elevenlabs.io/v1/flows/text-to-speech/"
ALLOWED_MEDIA_HOSTS = {
    "storage.googleapis.com",
    "cdn.elevenlabs.io",
    "api.elevenlabs.io",
}


def require(ok, why):
    if not ok:
        raise RuntimeError("KIDS_V4_GET_ONLY_STOP: " + why)


def candidates(record):
    """Read official completed output URL regardless of v4 response wrapper."""
    found = []
    def walk(item, key=""):
        if isinstance(item, dict):
            for k,v in item.items():
                if k in ("url","audio_url","download_url","content_url","output_url","asset_url","file_url","master_url"):
                    if isinstance(v,str) and v.startswith("https://"):
                        found.append(v)
                if isinstance(v,(dict,list)):
                    walk(v,k)
        elif isinstance(item,list):
            for row in item:
                walk(row,key)
    walk(record)
    return found


def provider_record(api_key, generation_id):
    require(re.fullmatch("[A-Za-z0-9]{20}",generation_id) is not None,
            "generation ID format mismatch")
    req = urllib.request.Request(GENERATION_API+generation_id, headers={
        "xi-api-key": api_key,
        "Accept":"application/json",
        "User-Agent":"TAWHID-KIDS-V4-GET-ONLY-ORIGINAL-RECOVERY",
    }, method="GET")
    with urllib.request.urlopen(req,timeout=35) as response:
        require(response.status==200,"provider GET failed without rendering")
        raw=response.read(1_000_000)
    report=json.loads(raw)
    require(isinstance(report,dict),"unexpected provider generation detail")
    require(report.get("status")=="completed","paid generation is not completed")
    require(report.get("id",generation_id)==generation_id,
            "GET returned a different generation ID")
    # These fields can live on the generation, or within a completed output.
    if report.get("model_id") is not None:
        require(report["model_id"]=="eleven_v4","wrong original model")
    if report.get("voice_id") is not None:
        require(report["voice_id"]=="DkU7j9uO4ZEtLD2iRZSH","wrong original voice")
    urls=candidates(report)
    require(bool(urls),"completed ElevenLabs generation returned no downloadable media URL")
    for url in urls:
        parsed=urllib.parse.urlsplit(url)
        if (parsed.scheme=="https" and parsed.hostname in ALLOWED_MEDIA_HOSTS
                and not parsed.username and not parsed.password
                and (parsed.hostname=="api.elevenlabs.io" or
                     parsed.path.lower().endswith((".mp3",".mpeg",".audio")))):
            return url
    raise RuntimeError("All provider result URLs failed audio-only host/path validation")


def fetch_original(url, path):
    parsed=urllib.parse.urlsplit(url)
    require(parsed.scheme=="https" and parsed.hostname in ALLOWED_MEDIA_HOSTS,
            "unexpected download host")
    req=urllib.request.Request(url,headers={
        "Accept":"audio/mpeg,application/octet-stream",
        "User-Agent":"TAWHID-KIDS-V4-GET-ONLY",
    },method="GET")
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            require(response.status==200,"original GET did not return HTTP 200")
            data=response.read(2_000_001)
            mime=(response.headers.get("Content-Type","")).lower()
    except Exception as e:
        # Avoid logs with signed URL credentials: raise only exception class.
        raise RuntimeError("Original media GET failed ("+type(e).__name__+")") from None
    require(1_800<len(data)<=2_000_000,"unexpected original MP3 byte length")
    require(data.startswith(b"ID3") or data[:1]==b"\xff",
            "provider original has invalid MP3 header")
    require("audio/" in mime or "octet-stream" in mime,
            "provider returned non-audio mime type")
    path.write_bytes(data)
    return len(data)


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--get-and-import",action="store_true")
    ap.add_argument("--max-files",type=int,default=15)
    args=ap.parse_args()
    flow,reg,ledger,known,by_text=expected()
    protected=protect_paid_texts(ROOT,reg,ledger)
    waiting={gid:row for gid,row in known.items()
             if by_text[row["text"]]["status"]=="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"}
    require(len(waiting)<=args.max_files,"unapproved number of paid originals")
    require(set(by_text)<=protected,"connected exact original texts not protected")
    if not args.get_and_import:
        print("KIDS_V4_GET_ONLY_PREFLIGHT "+
              json.dumps({"pendingOriginals":len(waiting),"alreadyImported":len(known)-len(waiting),
                          "newCreditsSpent":0,"publicReleaseAllowed":False}))
        return
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    require(bool(key),"GitHub ElevenLabs API secret unavailable for GET")
    require(bool(waiting),"no pending existing generation originals to download")
    with tempfile.TemporaryDirectory(prefix="tawhid-kids-existing-v4-") as scratch:
        folder=Path(scratch)
        for gen in sorted(waiting):
            url=provider_record(key,gen)
            size=fetch_original(url,folder/(gen+".mp3"))
            print("EXISTING_PROVIDER_MP3_DOWNLOADED "+json.dumps({"generation":gen,"bytes":size,
                            "newCredits":0}),flush=True)
        report=run(folder)
        require(len(report["newlyImportedProviderGenerationIds"])==len(waiting),
                "not all confirmed charged MP3 bytes were imported")
    print("KIDS_V4_ORIGINALS_IMPORT_COMPLETE "+json.dumps({
        "verifiedOriginals":len(waiting),"newCredits":0,"published":False,
    }),flush=True)


if __name__=="__main__":
    main()
