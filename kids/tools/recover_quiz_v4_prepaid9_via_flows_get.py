#!/usr/bin/env python3
"""Recover the NINE older already-paid ElevenLabs Flow originals with GET only.

Never generates speech. Downloads only immutable provider IDs missing from the
earlier 56 original takes, verifies MP3 bytes and duration through the existing
safe old-Flow importer; unresolved paid originals stay blocked from re-buying.
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from recover_quiz_v4_flows_history_exact import flow_generation_original
import import_quiz_v4_prepaid_flow_originals as original

MISSING=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"

def data(path):
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--restore",action="store_true")
    args=a.parse_args()
    if data(RELEASE)["enabled"] is not False:
        raise RuntimeError("Public 450 release must be OFF")
    m=data(MISSING)
    r=data(REG)
    seen=set(r["generationClips"])
    todo=[x for x in m["items"] if x["generationId"] not in seen]
    if len(m["items"])!=9 or len({x["generationId"] for x in m["items"]})!=9:
        raise RuntimeError("Immutable nine historical paid take IDs changed")
    if not args.restore:
        print(json.dumps({"paidMissingOriginals":len(todo),"newCredits":0,
                          "nextAction":"GET existing provider original bytes only"}))
        return
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:
        raise RuntimeError("Provider API key missing; no paid requests were made")
    with tempfile.TemporaryDirectory(prefix="tawhid-kids-v4-historical9-zero-charge-") as d:
        folder=Path(d)
        downloaded=[]
        unavailable=[]
        for entry in todo:
            try:
                mp3=flow_generation_original(entry,key)
            except RuntimeError as e:
                unavailable.append({"id":entry["generationId"],"reason":str(e)[:140]})
                continue
            dest=folder/(entry["generationId"]+".mp3")
            dest.write_bytes(mp3)
            downloaded.append(entry["generationId"])
        if downloaded:
            # This original importer handles all 56 old generation IDs,
            # including those already saved: it never resynthesizes or releases.
            original.run(folder)
        print("OLDER_NINE_PROVIDER_GET "+json.dumps({
            "recoveredOriginalIDs":downloaded,
            "unavailableOldPaid":unavailable,
            "newTTSGenerations":0,"newCreditsSpent":0,
            "publicReleaseEnabled":False,
        },ensure_ascii=False),flush=True)

if __name__=="__main__":main()
