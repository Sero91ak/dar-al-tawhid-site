#!/usr/bin/env python3
"""Technically verify SAVED original paid Eleven V4 MP3s for curated 450.

Never approves spoken Arabic/German pronunciation, and never generates audio.
It verifies SHA-256, real MP3 decoder, duration, non-silent signal, model,
voice, expected text hashes and remaining human QA block.
"""
from __future__ import annotations
import hashlib,json,re,subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    d=json.loads(REGISTRY.read_text(encoding="utf-8"))
    rows=d.get("textClips") or {}
    if not rows:raise RuntimeError("No original MP3s to audit yet")
    result={"scope":"KIDS_V4_450_ORIGINAL_MP3_QA","savedClipCount":len(rows),
            "voiceId":VOICE,"modelId":"eleven_v4","clips":[],
            "overallTechnicalPass":False,"allHumanListeningApproved":False,
            "readyForLive":False,"synthesisCallsMade":0}
    problems=[]
    for spoken,info in sorted(rows.items()):
        # Includes all post-pilot original MP3s, not only the initial two.
        check={"textSha256":hashlib.sha256(spoken.encode("utf-8")).hexdigest(),
               "technicalPassed":False,
               "listeningApproved":info.get("audioListeningApproved") is True}
        try:
            if info.get("voiceId")!=VOICE or info.get("modelId")!="eleven_v4":
                raise ValueError("Unexpected voice/model")
            if info.get("textSha256")!=check["textSha256"]:
                raise ValueError("Text hash mismatch")
            url=info.get("url") or ""
            if not url.startswith("/kids/assets/kids-quiz-audio/") or "?" in url or ".." in url:
                raise ValueError("Unsafe/nonlocal MP3")
            path=(ROOT/url.lstrip("/")).resolve()
            if not path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()):
                raise ValueError("Unsafe path")
            if path.suffix!=".mp3" or not path.is_file() or path.stat().st_size<1500:
                raise ValueError("Missing original MP3")
            if digest(path)!=info.get("sha256"):
                raise ValueError("SHA256 mismatch")
            cmd=["ffprobe","-v","error","-show_entries",
                 "format=duration:stream=codec_name,codec_type,sample_rate",
                 "-of","json",str(path)]
            p=subprocess.run(cmd,capture_output=True,text=True,check=True)
            meta=json.loads(p.stdout)
            tracks=[x for x in meta.get("streams",[]) if x.get("codec_type")=="audio"]
            duration=float(meta.get("format",{}).get("duration",0))
            if len(tracks)!=1 or tracks[0].get("codec_name")!="mp3" or not .5<duration<40:
                raise ValueError("Implausible MP3 audio")
            vol=subprocess.run(["ffmpeg","-v","info","-i",str(path),"-af","volumedetect",
                "-vn","-f","null","-"],capture_output=True,text=True,check=True)
            m=re.search(r"mean_volume:\s*([-+]?\d+(?:\.\d+)?)\s*dB",vol.stderr)
            if not m or float(m.group(1))<-55:
                raise ValueError("Silence / unmeasurable speech volume")
            check.update(technicalPassed=True,durationSeconds=round(duration,3),
                         mp3Bytes=path.stat().st_size,
                         sampleRateHz=int(tracks[0]["sample_rate"]),
                         meanVolumeDB=float(m.group(1)))
        except Exception as exc:
            check["technicalError"]=str(exc)[:170]
            problems.append(check["textSha256"])
        result["clips"].append(check)
    result["overallTechnicalPass"]=not problems
    result["allHumanListeningApproved"]=all(x["listeningApproved"] for x in result["clips"])
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_450_SAVED_MP3_QA "+json.dumps({k:v for k,v in result.items() if k!="clips"},ensure_ascii=False),flush=True)
    if problems:raise SystemExit(f"TECHNICAL AUDIO QA FAILED: {len(problems)} clips")
if __name__=="__main__":
    main()
