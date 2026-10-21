#!/usr/bin/env python3
"""Restore three already synthesized V4 MP3s from a GitHub Actions artifact.

No calls to ElevenLabs and no synthetic replacement audio. This importer
refuses source-text mismatches, duplicate source hashes, unexpected voice/model,
corrupted assets, and publication. The resulting recordings are QA candidates.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MAN=ROOT/"kids/review-only/quiz-v4-creative-v4candidate-transfer-20261022.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/"kids/review-only/quiz-v4-creative-v4candidate-transfer-results-20261022.json"
SOURCE=ROOT/"kids-artifact-backup/assets/kids-quiz-audio/v4-curated450-review"
TARGET=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def need(ok, msg):
    if not ok: raise RuntimeError(msg)

def main():
    m=json.loads(MAN.read_text(encoding="utf-8"))
    r=json.loads(REG.read_text(encoding="utf-8"))
    need(m["scope"]=="KIDS_QUIZ_V4_CANDIDATES_REVIEW_ONLY" and m["publicReleaseAllowed"] is False, "invalid review scope")
    need(r.get("live") is False and r.get("modelId")=="eleven_v4" and r.get("voiceId")==VOICE, "wrong registry model/voice")
    rows=m["items"]
    need(len(rows)==3 and len({x["generationId"] for x in rows})==3,"unexpected new audio count")
    receipts=[]
    for item in rows:
        txt=item["text"]
        digest=hashlib.sha256(txt.encode("utf-8")).hexdigest()
        need(digest==item["textSha256"],"spoken text does not match original request SHA")
        need(item["voiceId"]==VOICE and item["modelId"]=="eleven_v4","wrong recorded voice")
        need(txt not in r["textClips"],"already imported, refusing overwrite/duplicate")
        asset=SOURCE/(digest[:32]+".mp3")
        need(asset.is_file() and 1800<asset.stat().st_size<2_000_000,"missing previously generated MP3 bytes")
        mp3=asset.read_bytes()
        target=TARGET/asset.name
        need(not target.exists(),"do not overwrite an existing paid MP3 original")
        x=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,codec_type",
            "-of","json",str(asset)],check=True,capture_output=True,text=True)
        data=json.loads(x.stdout)
        kinds=[t.get("codec_name") for t in data.get("streams",[]) if t.get("codec_type")=="audio"]
        seconds=float(data.get("format",{}).get("duration") or 0)
        need(kinds==["mp3"] and .5<seconds<40,"audio is invalid MP3")
        sha=hashlib.sha256(mp3).hexdigest()
        TARGET.mkdir(parents=True,exist_ok=True)
        target.write_bytes(mp3)
        url="/"+str(target.relative_to(ROOT))
        r["textClips"][txt]={
            "url":url,"sha256":sha,"bytes":len(mp3),"textSha256":digest,
            "voiceId":VOICE,"modelId":"eleven_v4","audioListeningApproved":False,
            "qaApproval":"pending-human-auditory-review",
            "source":"elevenlabs-v4-master-actual-generation-recovered-from-github-actions-artifact",
            "providerGenerationId":item["generationId"],"durationSeconds":round(seconds,3),
            "status":"ORIGINAL_MP3_SAVED_REVIEW_ONLY_NOT_PUBLISHED",
            "pronunciationDictionaryAppliedVerified":False
        }
        receipts.append({"questionId":item["questionId"],"part":item["part"],"textSha256":digest,
                         "generationId":item["generationId"],"sha256":sha,"url":url,
                         "creditsPreviouslySpent":item["creditsReportedByProvider"],"listeningApproved":False})
    REG.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    OUT.write_text(json.dumps({"reviewOnly":True,"publicReleaseAllowed":False,
       "sourceRun":39688590926,"sourceArtifact":12387413256,
       "newVoiceSynthesisRequests":0,"newVoiceCredits":0,
       "savedOriginals":len(receipts),"receipts":receipts},
       ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RECOVERED_AND_IMPORTED",len(receipts),"EXISTING_MP3S; SYNTHESIS_CALLS=0; PUBLIC_RELEASE=false")

if __name__=="__main__":main()
