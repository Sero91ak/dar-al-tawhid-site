#!/usr/bin/env python3
"""Import ONE already owner-heard ElevenLabs V4 generation into published KIDS quiz.

This never generates any paid audio, never modifies original MP3s, and fails
closed unless the input matches the exact owner-auditioned q178:question pilot.
The caller must pass a short-lived signed asset URL through environment; this
script does not store the URL in Git history.
"""
from __future__ import annotations
import hashlib, json, os, pathlib, re, subprocess, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
PUBLIC=ROOT/"kids/data/quiz-v4-full-rebuild-public.json"
REVIEW=ROOT/"kids/data/quiz-v4-full-rebuild-review.json"
PILOT=ROOT/"kids/review-only/voice-language-isolation-pilot-20261027.json"
AGE="7-8"; QID="kids-quiz-178"; PART="question"
ORIGINAL_SHA="c0df7c6e983fb9e3adf4572b884b985f4a01dd89067c1739e12542a44c61a79a"
GENERATED_ID="4vpdmlfHmhNx5f0aOoqQ"
ASSET_DIR=ROOT/"kids/assets/kids-quiz-audio/v4-de-isolated-20261027"/AGE

def read(path):return json.loads(path.read_text(encoding="utf-8"))
def save(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
def require(cond,msg):
    if not cond:raise RuntimeError(msg)

def main():
    published=read(PUBLIC);review=read(REVIEW);pilot=read(PILOT)
    require(pilot.get("hearing")=="OWNER_CONFIRMED_CORRECT_2026-10-27" and pilot.get("germanNurVerified"),"Pilot not approved by listener")
    require(pilot.get("providerGenerationId")==GENERATED_ID,"Wrong paid ElevenLabs generation")
    require(pilot.get("questionId")==QID and pilot.get("part")==PART,"Wrong pilot question")
    require(len(published["questions"])==len(review["questions"])==450,"Quiz count")
    old=review["questions"][QID]["clips"][PART];entry=published["questions"][QID]["clips"][PART]
    require(old["sha256"]==ORIGINAL_SHA,"Review backup mismatch")
    require(entry==old,"Slot modified before owner-approved single retake")
    require(published.get("humanListeningApproved") is False,"No global hearing approval")
    url=os.environ.get("KIDS_OWNER_APPROVED_V4_SIGNED_MP3_URL","")
    require(url.startswith("https://storage.googleapis.com/xi-backend/") and
            "/"+GENERATED_ID+"/content.mp3" in url and "X-Goog-Signature=" in url,
            "Missing exact short-lived signed generation URL")
    req=urllib.request.Request(url,headers={"User-Agent":"DAR-KIDS-V4-OWNER-APPROVED-IMPORT/1"})
    with urllib.request.urlopen(req,timeout=75) as response:
        mime=response.headers.get("content-type","").lower()
        require(response.status==200 and ("mpeg" in mime or "octet" in mime),"Unexpected origin response")
        blob=response.read(4_000_001)
    require(4000<len(blob)<4_000_000,"Unexpected MP3 size")
    require(blob[:3]==b"ID3" or blob[:1]==b"\xff","MP3 header missing")
    digest=hashlib.sha256(blob).hexdigest()
    ASSET_DIR.mkdir(parents=True,exist_ok=True)
    file=ASSET_DIR/(digest[:28]+".mp3")
    require(not file.exists(),"Duplicate retake import")
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".mp3") as tmp:
        tmp.write(blob);tmp.flush()
        p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                          "-of","default=noprint_wrappers=1:nokey=1",tmp.name],
                         capture_output=True,text=True,check=True)
    duration=float(p.stdout.strip())
    require(3<duration<40,"Unexpected audio duration")
    file.write_bytes(blob)
    clip=published["questions"][QID]["clips"][PART]
    clip.update({
      "url":"/"+str(file.relative_to(ROOT)),
      "sha256":digest,
      "durationSeconds":round(duration,3),
      "humanListeningApproved":True,
      "approvedForPlayback":True,
      "ownerReviewedGenerationId":GENERATED_ID,
      "reviewedByOwnerAt":"2026-10-27",
      "languageCode":"de",
      "pronunciationIsolationPolicy":"dar-voice-language-isolation-v1"
    })
    save(PUBLIC,published)
    pilot.update({"hearing":"OWNER_CONFIRMED_CORRECT_2026-10-27",
                  "germanNurVerified":True,
                  "humanListeningApproved":True,
                  "newAudioSha256":digest,
                  "newAudioPath":"/"+str(file.relative_to(ROOT)),
                  "newDurationSeconds":round(duration,3),
                  "manifestUpdated":True,
                  "visitorAppChanged":True,
                  "approvedForPlayback":True,
                  "importedWithoutNewCredits":True})
    save(PILOT,pilot)
    print(json.dumps({"slot":QID+":"+PART,"bytes":len(blob),"sha256":digest,
                      "durationSeconds":round(duration,3),
                      "replacedOriginalInRepo":False,
                      "newCreditsChargedByImport":0,
                      "originalPublicReviewUnchanged":True},indent=2))

if __name__=="__main__":main()
