#!/usr/bin/env python3
"""Read-only recovery of PAID V4 originals for the first 20 KIDS quiz questions.

Never calls a text-to-speech endpoint. Download only an exact ElevenLabs history
record matching Serhat Master, eleven_v4 and the authored script. No production
audio manifest, main branch, or published app is modified.
"""
from __future__ import annotations
import hashlib, json, os, subprocess, sys, time, unicodedata
from pathlib import Path
from urllib import parse, request, error

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
ASSETS=ROOT/"kids/assets/kids-quiz-audio/v4-review-001-020"
REVIEW=ROOT/"kids/data/quiz-v4-batch-001-020-import-review.json"
REPORT=ROOT/"kids/data/quiz-v4-batch-001-020-recovery-report.json"
API="https://api.elevenlabs.io/v1"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS={"question":"questionAudioText","correct":"correctAudioText",
       "retry":"retryAudioText","explanation":"explanationAudioText"}
ORIGINAL_002={
  "question-opening":"Schau, was du schon alles weißt.",
  "question-core":"Ist Allah Einer?",
  "question-guidance":"Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein."
}

def norm(v):
    return unicodedata.normalize("NFC"," ".join(str(v or "").split()))

def get(path,key):
    if not path.startswith("/history"):
        raise RuntimeError("SECURITY: history GET only, no synthesis")
    headers={"xi-api-key":key,"Accept":"application/json,audio/mpeg","User-Agent":"DAR-KIDS-NoCredit-V4-Recovery-001-020"}
    req=request.Request(API+path,headers=headers,method="GET")
    for attempt in range(3):
        try:
            with request.urlopen(req,timeout=50) as response:return response.read()
        except (error.HTTPError,error.URLError) as e:
            code=getattr(e,"code",0)
            if code in (401,403):raise
            if attempt==2:raise
            time.sleep(1+attempt)
    raise RuntimeError("history retrieval failed")

def info(path):
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,codec_type","-of","json",str(path)],
                     capture_output=True,text=True,check=True)
    j=json.loads(p.stdout)
    length=float((j.get("format") or {}).get("duration") or 0)
    codecs=[s.get("codec_name") for s in j.get("streams") or [] if s.get("codec_type")=="audio"]
    if not codecs or codecs[0]!="mp3" or not .5<=length<=180:raise ValueError(f"Bad MP3: {path}, {length}, {codecs}")
    return round(length,3)

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def paid_targets(items):
    by_gen={}
    for q in items:
        for rec in q.get("recordings") or []:
            part=rec["part"]
            expected=ORIGINAL_002[part] if q["number"]==2 and part in ORIGINAL_002 else q[PARTS[part]]
            gid=rec["generationId"]
            if rec.get("modelId")!="eleven_v4":raise RuntimeError("Non-V4 model blocked")
            if gid in by_gen and norm(by_gen[gid]["text"])!=norm(expected):
                raise RuntimeError("Same generation ID for different spoken texts")
            by_gen[gid]={"generationId":gid,"text":expected}
    return by_gen

def read_history(key,wanted):
    found={}
    observed={"total":0,"voiceMatches":0,"v4Matches":0,"textMatches":0,"voiceAndTextMatches":0,"modelHistogram":{}}
    wanted_texts={norm(x['text']) for x in wanted.values()}
    cursor=""
    for page in range(20):
        params={"page_size":"100"}
        if cursor:params["start_after_history_item_id"]=cursor
        payload=json.loads(get("/history?"+parse.urlencode(params),key))
        rows=payload.get("history") or []
        for row in rows:
            text=norm(row.get("text"))
            voice=row.get("voice_id")
            model=row.get("model_id")
            observed['total']+=1
            observed['voiceMatches']+=int(voice==VOICE)
            observed['v4Matches']+=int(model=='eleven_v4')
            observed['textMatches']+=int(text in wanted_texts)
            observed['voiceAndTextMatches']+=int(voice==VOICE and text in wanted_texts)
            mk=str(model or 'none')
            observed['modelHistogram'][mk]=observed['modelHistogram'].get(mk,0)+1
            for gid,w in wanted.items():
                if gid in found or norm(w["text"])!=text or voice!=VOICE or model!="eleven_v4":continue
                found[gid]=row
        print(f"READ_ONLY_HISTORY_PAGE {page+1}, records={len(rows)}, matches={len(found)}/{len(wanted)}",flush=True)
        if len(found)==len(wanted) or not payload.get("has_more") or not rows:break
        next_cursor=rows[-1].get("history_item_id") or ""
        if not next_cursor or next_cursor==cursor:break
        cursor=next_cursor
    print('READ_ONLY_HISTORY_AUDIT '+json.dumps(observed,ensure_ascii=False),flush=True)
    return found

def join_002(gens):
    files=[ASSETS/(gens[k]+".mp3") for k in ("question-opening","question-core","question-guidance")]
    if any(not p.exists() for p in files):return None
    out=ASSETS/"kids-quiz-002-question-joined.mp3"
    import tempfile
    with tempfile.TemporaryDirectory(prefix="kids-v4-002-") as tmp:
        td=Path(tmp)
        wav=[]
        for i,f in enumerate(files):
            target=td/f"part-{i}.wav"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(f),
                 "-ar","48000","-ac","1","-c:a","pcm_s16le",str(target)],check=True)
            wav.append(target)
        pause=td/"pause.wav"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
           "-f","lavfi","-i","anullsrc=r=48000:cl=mono","-t","0.24",
           "-c:a","pcm_s16le",str(pause)],check=True)
        seq=[wav[0],pause,wav[1],pause,wav[2]]
        playlist=td/"concat.txt"
        playlist.write_text("".join("file '"+str(x.resolve()).replace("'","'\\''")+"'\n" for x in seq),encoding="utf-8")
        target=td/"joined.mp3"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0",
             "-i",str(playlist),"-ar","48000","-ac","1","-c:a","libmp3lame","-b:a","128k",str(target)],check=True)
        duration=info(target)
        expected=sum(info(p) for p in files)+.48
        if abs(duration-expected)>1.0:raise RuntimeError(f"Join duration mismatch {duration} vs {expected}")
        out.write_bytes(target.read_bytes())
    return out

def main():
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("No ELEVENLABS_API_KEY secret; cannot recover without re-synthesis")
    data=json.loads(PLAN.read_text(encoding="utf-8"))
    items=data["items"]
    if len(items)!=20 or [x["number"] for x in items]!=list(range(1,21)):raise RuntimeError("Expected 20 ordered questions")
    targets=paid_targets(items)
    if len(targets)!=56:raise RuntimeError(f"Expected 56 unique V4 generations, got {len(targets)}")
    ASSETS.mkdir(parents=True,exist_ok=True)
    found=read_history(key,targets)
    downloaded,missing=[],[]
    for gid,w in targets.items():
        matched=found.get(gid)
        if not matched:
            missing.append({"generationId":gid,"reason":"not-in-verified-history","text":w["text"][:60]})
            continue
        history_id=matched.get("history_item_id")
        if not history_id:
            missing.append({"generationId":gid,"reason":"no-history-item-id"});continue
        dest=ASSETS/(gid+".mp3")
        if dest.exists():
            try:duration=info(dest)
            except Exception as e:raise RuntimeError(f"Existing invalid original: {dest} ({e})")
        else:
            try:
                body=get("/history/"+parse.quote(history_id,safe="")+"/audio",key)
                if len(body)<1300 or not (body.startswith(b"ID3") or body[:1]==b"\xff"):raise ValueError("Invalid original MP3")
                dest.write_bytes(body)
                duration=info(dest)
            except Exception as e:
                if dest.exists():dest.unlink()
                missing.append({"generationId":gid,"reason":"history-audio-unavailable","error":str(e)[:180]})
                continue
        downloaded.append({"generationId":gid,"historyId":history_id,"url":"/"+str(dest.relative_to(ROOT)),
                           "sha256":sha(dest),"bytes":dest.stat().st_size,"durationSeconds":duration})
    report={"scope":"TAWḤĪD KIDS V4 001-020","modelId":"eleven_v4","voiceId":VOICE,
            "originalTargets":56,"downloadedOriginals":len(downloaded),"missing":missing,
            "creditsSpentByRecovery":0,"allOriginalsRecovered":not missing,
            "published":False,"humanListeningApproved":False}
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RECOVERY_SUMMARY "+json.dumps({k:v for k,v in report.items() if k!="missing"},ensure_ascii=False),flush=True)
    if missing:
        print("MISSING_IDS "+json.dumps(missing,ensure_ascii=False),flush=True)
        sys.exit(2)
    for q in items:
        for part in q["recordings"]:
            f=ASSETS/(part["generationId"]+".mp3")
            part["reviewAssetUrl"]="/"+str(f.relative_to(ROOT))
            part["sha256"]=sha(f)
        q["audioQA"]="originals-imported-pending-human-auditory-approval"
        q["published"]=False
    parts_002={x["part"]:x["generationId"] for x in items[1]["recordings"]}
    joined=join_002(parts_002)
    if joined is None:raise RuntimeError("Question 002 original 3-part join failed")
    entries={}
    for q in items:
        for part,key in PARTS.items():
            rec=next((x for x in q["recordings"] if x["part"]==part),None)
            if part=="question" and q["number"]==2:dest=joined
            elif rec:dest=ASSETS/(rec["generationId"]+".mp3")
            else:raise RuntimeError(f"Missing question audio mapping: {q['questionId']} {part}")
            text=norm(q[key])
            value={"url":"/"+str(dest.relative_to(ROOT)),"sha256":sha(dest),
                   "modelId":"eleven_v4","voiceId":VOICE,"audioListeningApproved":False,
                   "qaApproval":"pending-human-auditory-review"}
            if text in entries and entries[text]["sha256"]!=value["sha256"]:
                raise RuntimeError("Same exact spoken text assigned different audio")
            entries[text]=value
    REVIEW.write_text(json.dumps({"scope":"review-only-not-for-production","countQuestions":20,
             "modelId":"eleven_v4","voiceId":VOICE,"entries":entries,"humanListeningApproved":False,
             "published":False},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    data["qaSummary"]["audioFilesImportedToGitHub"]=len(downloaded)+1
    data["qaSummary"]["playableMergedQuestions"]=1
    data["releaseStatus"]="all-review-assets-imported-human-listening-and-app-qa-required"
    PLAN.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"PASS_RECOVERED {len(downloaded)} originals and one joined q002 review MP3; {len(entries)} contract keys; NO synthesis",flush=True)

if __name__=="__main__":main()
