#!/usr/bin/env python3
"""Recover genuine pre-paid ElevenLabs Flow original MP3 bytes; no TTS API calls.
Input signed source links are short-lived and removed from GitHub after import.
"""
import json,sys,tempfile,urllib.parse,urllib.request
from pathlib import Path
from import_quiz_v4_prepaid_flow_originals import original_metadata, run

ROOT=Path(__file__).resolve().parents[2]
PATH=ROOT/"kids/review-only/quiz-v4-nine-prepaid-scribe-source-20261022.json"
def check(value,message):
    if not value: raise RuntimeError(message)

def main():
    manifest=json.loads(PATH.read_text("utf-8"))
    check(manifest.get("purpose")=="recover-only-already-paid-v4-originals","wrong recovery intent")
    check(manifest.get("newSpeechCalls")==0 and manifest.get("liveRelease")==False,"no paid or live actions")
    originals=original_metadata()
    inputs=manifest["sources"]
    check(len(inputs)==9 and len({x["generationId"] for x in inputs})==9,"expected exactly nine IDs")
    with tempfile.TemporaryDirectory(prefix="kids-nine-v4-prepaid-originals-") as folder:
        folder=Path(folder)
        for item in inputs:
            gid=item["generationId"]
            check(gid in originals,"unknown paid original")
            u=urllib.parse.urlsplit(item["sourceUrl"])
            check(u.scheme=="https" and u.hostname=="storage.googleapis.com","invalid source")
            check(u.path.endswith("/"+gid+"/content.mp3"),"generation mismatch")
            check("X-Goog-Signature" in urllib.parse.parse_qs(u.query),"unsigned source")
            req=urllib.request.Request(item["sourceUrl"],headers={"User-Agent":"DAR-KIDS-V4-restore-existing-paid"})
            with urllib.request.urlopen(req,timeout=45) as src:
                check(src.status==200,"source unavailable")
                data=src.read(6000001)
            check(1800<len(data)<6000000,"invalid original data length")
            (folder/(gid+".mp3")).write_bytes(data)
        result=run(folder)
    check(result["remainingPriorPaidGenerations"]==0,"not all nine recovered")
    print("PREPAID_V4_ORIGINALS_RESTORED",len(inputs),"TOTAL_PAID",result["importedPriorPaidGenerations"],"NEW_SPEECH_CALLS 0")

if __name__=="__main__":main()
