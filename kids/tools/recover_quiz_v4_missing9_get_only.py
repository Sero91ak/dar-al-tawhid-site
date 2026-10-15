#!/usr/bin/env python3
"""Zero-credit retrieval of ONLY missing, ALREADY PAID, V4 Flow originals.

Official ElevenLabs GET endpoints only; NO POST, NO speech generation, NO
upgrade, NO repeated charge. Signed URLs, keys, and audio payloads are never
printed or committed. If nine missing paid generations are directly readable,
download into a temporary inbox and let the canonical strict importer validate
model, voice, original ID, duration and SHA before commit.

Run in GitHub Actions with ELEVENLABS_API_KEY. The script may find API reads
plan-gated (402). That is a documented blocker, not a reason to resynthesize.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,tempfile,urllib.error,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MISSING=ROOT/"kids/data/quiz-v4-paid-flow-import-status.json"
PRIOR=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
REPORT=ROOT/"kids/data/quiz-v4-paid-flow-get-recovery-attempt.json"
API="https://api.elevenlabs.io"
HEADERS={"Accept":"application/json"}
MAX_AUDIO=5_500_000
EXPECTED="eleven_v4"

def load(p):return json.loads(p.read_text(encoding="utf-8"))
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def api_get(path,key,accept="application/json"):
    url=API+path
    req=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":accept},method="GET")
    try:
        with urllib.request.urlopen(req,timeout=30) as res:
            data=res.read(MAX_AUDIO+1024)
            return res.status,data,res.headers.get("Content-Type","")
    except urllib.error.HTTPError as exc:
        return exc.code,b"",""
    except Exception:return 0,b"",""

def take_mp3(url):
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!="https" or parsed.netloc not in ("storage.googleapis.com","storage.cloud.google.com"):
        raise RuntimeError("Unexpected download origin; refusing storage request")
    with urllib.request.urlopen(urllib.request.Request(url,method="GET"),timeout=40) as r:
        data=r.read(MAX_AUDIO+1)
    if not 1800<len(data)<MAX_AUDIO or not(data[:3]==b"ID3" or data[:1]==b"\xff"):
        raise RuntimeError("Not a valid original MP3 response")
    return data

def must_be_mp3(path):
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
        "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
        capture_output=True,text=True)
    if p.returncode:raise RuntimeError("Original audio could not be decoded")
    m=json.loads(p.stdout)
    dur=float((m.get("format") or {}).get("duration") or 0)
    audio=[s for s in m.get("streams",[]) if s.get("codec_type")=="audio"]
    if len(audio)!=1 or audio[0].get("codec_name")!="mp3" or not 0.4<dur<180:
        raise RuntimeError("Invalid original MP3 duration or codec")
    return round(dur,3)

def main():
    state=load(MISSING)
    paid=load(PRIOR)
    reg=load(REGISTRY)
    if paid.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH" or paid.get("modelId")!=EXPECTED:
        raise RuntimeError("Original model/owner voice cannot be verified")
    original={r["generationId"] for q in paid["items"] for r in q.get("recordings") or []}
    recorded=set((reg.get("generationClips") or {}).keys())
    needed=sorted(original-recorded)
    if len(original)!=56 or any(not isinstance(x,str) or len(x)!=20 for x in needed):
        raise RuntimeError("The previous 56 paid IDs are inconsistent")
    if len(needed)>9:
        raise RuntimeError("Refusing broad unknown recovery: expected at most 9 missing originals")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    result={
       "schemaVersion":1,
       "scope":"TAWḤĪD KIDS remaining already-paid Eleven V4 original GET recovery",
       "previouslyPaidOriginals":56,
       "alreadyImportedOriginals":len(recorded),
       "missingBeforeGET":len(needed),
       "originalIdsAttempted":needed,
       "successfullyImportedOriginals":0,
       "statusPerGeneration":{},
       "modelId":EXPECTED,
       "voiceId":paid["voiceId"],
       "onlyGETRequestsUsed":True,
       "newSpeechSyntheses":0,
       "elevenLabsCreditsSpent":0,
       "apiKeySaved":False,
       "signedUrlsSaved":False,
       "publicReleaseAllowed":False,
    }
    if not key:
        result["problem"]="ELEVENLABS_API_KEY missing; no API request made"
        save(REPORT,result)
        print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)
        return
    if not needed:
        result["problem"]="All original paid MP3s already recovered"
        save(REPORT,result)
        print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)
        return
    with tempfile.TemporaryDirectory(prefix="kids-paid-v4-nine-") as folder:
        folder=Path(folder)
        for gid in needed:
            stat={"flowGetHTTP":None,"historyAudioHTTP":None,"importableMP3":False}
            result["statusPerGeneration"][gid]=stat
            code,data,ct=api_get(f"/v1/flows/text-to-speech/{gid}",key)
            stat["flowGetHTTP"]=code
            if code==200:
                try:
                    gen=json.loads(data.decode("utf-8"))
                    if gen.get("id")==gid and gen.get("status")=="completed" and gen.get("content_url"):
                        binary=take_mp3(gen["content_url"])
                        path=folder/(gid+".mp3")
                        path.write_bytes(binary)
                        stat["mp3DurationSec"]=must_be_mp3(path)
                        stat["importableMP3"]=True
                except (OSError,ValueError,RuntimeError,KeyError):
                    stat["flowAudioDownload"]="failed-keep-paid-original-untouched"
            if not stat["importableMP3"]:
                # GET on the documented ElevenLabs History audio route is
                # read-only. Flow generation IDs may not be history_item_ids;
                # if 404, never infer an original existed in this history.
                hist,hdata,hct=api_get(f"/v1/history/{gid}/audio",key,accept="audio/mpeg")
                stat["historyAudioHTTP"]=hist
                if hist==200:
                    try:
                        if not 1800<len(hdata)<MAX_AUDIO or not(
                                hdata[:3]==b"ID3" or hdata[:1]==b"\xff"):
                            raise ValueError("Unexpected original audio bytes")
                        path=folder/(gid+".mp3")
                        path.write_bytes(hdata)
                        stat["mp3DurationSec"]=must_be_mp3(path)
                        stat["importableMP3"]=True
                    except (ValueError,RuntimeError):
                        stat["historyAudioDownload"]="invalid-original-mp3"
        success=[x for x in needed if result["statusPerGeneration"][x]["importableMP3"]]
        if success:
            subprocess.run(["python3","kids/tools/import_quiz_v4_prepaid_flow_originals.py",
                            "--directory",str(folder)],cwd=ROOT,check=True)
            newreg=load(REGISTRY)
            for gid in success:
                if gid not in (newreg.get("generationClips") or {}):
                    raise RuntimeError("Original importer could not save verified generation "+gid)
            result["successfullyImportedOriginals"]=len(success)
    result["missingAfterAttempt"]=len(original-set((load(REGISTRY).get("generationClips") or {}).keys()))
    if result["missingAfterAttempt"]:
        result["nextStep"]="Recover signed original files through the connected ElevenLabs Flow account or authorized original MP3 export; do not resynthesize"
    else:
        result["nextStep"]="Recompose first150 question MP3s and perform full human listening QA"
    save(REPORT,result)
    print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
