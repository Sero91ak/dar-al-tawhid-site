#!/usr/bin/env python3
"""Import five already generated ElevenLabs V4 original MP3s into internal quiz.
Never generates new speech, modifies public manifest or approves pronunciation.
"""
import json, hashlib, subprocess, urllib.request, urllib.parse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
INPUT=ROOT/"kids/review-only/quiz-v4-five-existing-originals-transfer-20261022.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PRIORITY=ROOT/"kids/review-only/quiz-v4-450-next-completion-priority.json"
CONNECTED=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
RESULT=ROOT/"kids/review-only/quiz-v4-five-originals-import-results-20261022.json"
DEST=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def ok(condition,msg):
    if not condition:raise RuntimeError(msg)

def load(p):return json.loads(p.read_text("utf-8"))
def save(p,j):p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def main():
    inputs=load(INPUT)
    ok(inputs["scope"]=="KIDS_V4_FIVE_PREGENERATED_REVIEW_ONLY" and inputs["newSpeechRequests"]==0 and inputs["publicRelease"] is False,"unsafe delivery scope")
    items=inputs["items"]
    ok(len(items)==6,"not the specified six existing originals")
    ok(len(set(x["textSha256"] for x in items))==5 and len(set(x["generationId"] for x in items))==5,"duplicate audio source")
    reg,priority,connected=load(REG),load(PRIORITY),load(CONNECTED)
    ok(reg.get("live") is False and reg.get("voiceId")==VOICE and reg.get("modelId")=="eleven_v4","wrong registry")
    pendingNew={h for q in priority["possibleNewSpeechPriorityAfterOriginalRecovery"] for h in q["newTextSha256"]}
    pendingConnected={x["sourceTextSHA256"]:x for x in connected["entries"] if x["status"] in ("GENERATED_AWAITING_ORIGINAL_MP3_IMPORT", "GENERATION_SUBMITTED_DO_NOT_RETRY")}
    receipts=[]
    for x in items:
        t=x["text"]
        h=hashlib.sha256(t.encode("utf-8")).hexdigest()
        ok(h==x["textSha256"],"spoken text SHA differs from source")
        ok(h in pendingNew or h in pendingConnected,"text was already paid or not eligible for this import")
        ok(t not in reg["textClips"],"recording is already imported; no duplicate")
        ok(x["modelId"]=="eleven_v4" and x["voiceId"]==VOICE,"unexpected speaker or model")
        if h in pendingConnected:
            ok(pendingConnected[h].get("generationId") in (None,x["generationId"]),"connected provider original ID mismatch")
            ok(pendingConnected[h].get("nodeId") in (None,x.get("nodeId")),"source node ID mismatch")
        url=urllib.parse.urlsplit(x["signedSourceUrl"])
        ok(url.scheme=="https" and url.hostname=="storage.googleapis.com" and url.path.endswith("/"+x["generationId"]+"/content.mp3"),"unexpected original source URL")
        ok("X-Goog-Signature" in urllib.parse.parse_qs(url.query),"source URL is not signed")
        req=urllib.request.Request(x["signedSourceUrl"],headers={"User-Agent":"DAR-KIDS-V4-existing-original-only/1"})
        with urllib.request.urlopen(req,timeout=60) as u:
            ok(u.status==200,"original audio unavailable")
            audio=u.read(6000001)
        ok(1800<len(audio)<6000000,"invalid MP3 size")
        DEST.mkdir(parents=True,exist_ok=True)
        local=DEST/(h[:32]+".mp3")
        ok(not local.exists(),"existing original cannot be overwritten")
        local.write_bytes(audio)
        p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,codec_type",
                          "-of","json",str(local)],text=True,capture_output=True,check=True)
        info=json.loads(p.stdout)
        codec=[s.get("codec_name") for s in info.get("streams",[]) if s.get("codec_type")=="audio"]
        seconds=float(info.get("format",{}).get("duration") or 0)
        ok(codec==["mp3"] and .3<seconds<40,"original bytes are not a valid audio clip")
        sha=hashlib.sha256(audio).hexdigest()
        link="/"+str(local.relative_to(ROOT))
        entry={"url":link,"textSha256":h,"sha256":sha,"bytes":len(audio),
               "voiceId":VOICE,"modelId":"eleven_v4","audioListeningApproved":False,
               "qaApproval":"pending-human-auditory-review",
               "source":"existing-paid-or-already-generated-elevenlabs-v4-original",
               "providerGenerationId":x["generationId"],"durationSeconds":round(seconds,3),
               "status":"ORIGINAL_MP3_SAVED_REVIEW_ONLY_NOT_PUBLISHED"}
        reg["textClips"][t]=entry
        if h in pendingConnected:
            row=pendingConnected[h]
            row.update(status="IMPORTED_ORIGINAL_MP3_VERIFIED",generationId=x["generationId"],originalMP3ImportedIntoGithub=True,
                importedMP3SHA256=sha,originalMP3SHA256=sha,originalMP3URL=link,
                humanListeningApproved=False,publicReleaseAllowed=False)
        receipts.append({"questionId":x["questionId"],"part":x["part"],"generationId":x["generationId"],
                         "textSha256":h,"sha256":sha,"url":link,"durationSeconds":round(seconds,3)})
    save(REG,reg);save(CONNECTED,connected)
    save(RESULT,{"scope":"FIVE_V4_EXISTING_ORIGINALS_IMPORTED_REVIEW_ONLY",
        "count":len(receipts),"newSpeechRequests":0,"newSpeechCreditsSpent":0,
        "pronunciationApproved":False,"publicRelease":False,"receipts":receipts})
    print("IMPORTED_EXISTING_SIX_V4_ORIGINALS",len(receipts),"TTS_CREDITS=0")

if __name__=="__main__": main()
