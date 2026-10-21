#!/usr/bin/env python3
"""TAWḤĪD KIDS — safe, zero-TTS offline assembly of all 900 V4 quiz contracts.

Requires already-exported original Serhat V4 MP3s, each with a SHA256 and exact
generation/text ID mapping. NEVER makes HTTP requests, generates voices or
publishes to the real audio manifest. All outputs are REVIEW ONLY.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import tempfile
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-all900-segmented-review.json"
REGISTRY=ROOT/"kids/data/quiz-v4-all900-imported-originals.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-all900-review-only"
MANIFEST=ROOT/"kids/data/quiz-v4-all900-audio-preview.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
KINDS=("question","correct","retry","explanation")

def load(path):
    if not path.exists():return {}
    return json.loads(path.read_text(encoding="utf-8"))

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as fd:
        for chunk in iter(lambda:fd.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def probe(path):
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
      "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
      capture_output=True,text=True)
    if p.returncode:raise ValueError("ffprobe unable to read original")
    m=json.loads(p.stdout)
    secs=float((m.get("format") or {}).get("duration") or 0)
    audio=[s.get("codec_name") for s in m.get("streams") or [] if s.get("codec_type")=="audio"]
    if not 0.4<secs<240 or not audio or audio[0] not in ("mp3","aac"):
        raise ValueError("Invalid sound codec/duration")
    return secs

def verify_clip(info):
    if not isinstance(info,dict):raise ValueError("Missing real original MP3")
    if info.get("modelId")!=MODEL or info.get("voiceId")!=VOICE:
        raise ValueError("Wrong model/voice, blocked")
    url=info.get("url")
    prefix="/kids/assets/kids-quiz-audio/"
    if not isinstance(url,str) or not url.startswith(prefix) or ".." in url or "?" in url or "#" in url:
        raise ValueError("Signed URL, external file or unsafe path forbidden")
    path=(ROOT/url.lstrip("/")).resolve()
    if not path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()):
        raise ValueError("Asset outside the allowed directory")
    if not path.is_file() or path.stat().st_size<1400:
        raise ValueError("Original MP3 file is absent/tiny")
    if len(str(info.get("sha256") or ""))!=64 or info["sha256"]!=sha(path):
        raise ValueError("Audio SHA256 differs from imported master")
    return path,probe(path)

def required(plan):
    paid=set()
    text=set()
    for q in plan["recipes"]:
        for kind in KINDS:
            obj=q[kind]
            if obj["mode"]=="existing-paid-exact":
                paid.add(obj["generationId"])
            elif obj["mode"]=="compose-from-segments":
                ss=obj["segments"]
                if not ss or " ".join(ss)!=obj["text"]:
                    raise ValueError(f"Lost text in {q['questionId']}/{kind}")
                pauses=obj.get("pauseAfterMs") or []
                if len(pauses)!=max(0,len(ss)-1) or any(not isinstance(p,int) or not 0<=p<=400 for p in pauses):
                    raise ValueError("Invalid relative silence boundaries")
                text.update(ss)
            else:
                raise ValueError("Unknown composition mode")
    return paid,text

def compose(paths,pauses,target):
    with tempfile.TemporaryDirectory(prefix="kids-v4-review-compose-") as td:
        td=Path(td)
        list_wavs=[]
        lengths=[]
        for i,path in enumerate(paths):
            lengths.append(probe(path))
            dest=td/f"{i:03d}.wav"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                            "-i",str(path),"-ar","48000","-ac","1",
                            "-c:a","pcm_s16le",str(dest)],check=True)
            list_wavs.append(dest)
        seq=[]
        for i,wav in enumerate(list_wavs):
            if i:
                pause=td/f"pause{i:03d}.wav"
                subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                                "-f","lavfi","-i","anullsrc=r=48000:cl=mono",
                                "-t",str(pauses[i-1]/1000),"-c:a","pcm_s16le",str(pause)],check=True)
                seq.append(pause)
            seq.append(wav)
        playlist=td/"audio.txt"
        playlist.write_text("".join("file '"+str(x.resolve())+"'"+chr(10) for x in seq),encoding="utf-8")
        audio=td/"joined.mp3"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                        "-f","concat","-safe","0","-i",str(playlist),
                        "-ar","48000","-ac","1","-c:a","libmp3lame",
                        "-b:a","96k",str(audio)],check=True)
        length=probe(audio)
        expected=sum(lengths)+sum(pauses)/1000
        if abs(length-expected)>max(1.25,len(paths)*0.1):
            raise RuntimeError("Audio duration does not match expected playback")
        target.write_bytes(audio.read_bytes())
    return target

def self_test():
    """Audio-pipeline probe with temporary test tones ONLY; never published."""
    with tempfile.TemporaryDirectory(prefix="kids-quiz-v4-private-audio-test-") as base:
        path=Path(base)
        inputs=[]
        for i,hz in enumerate((440,660)):
            file=path/f"input{i}.mp3"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                "-f","lavfi","-i",f"sine=frequency={hz}:sample_rate=48000",
                "-t","0.8","-c:a","libmp3lame","-b:a","96k",str(file)],check=True)
            inputs.append(file)
        original_duration=[probe(x) for x in inputs]
        target=path/"joined.mp3"
        compose(inputs,[180],target)
        observed=probe(target)
        target_duration=sum(original_duration)+0.18
        if not 1.2<observed<2.5 or abs(observed-target_duration)>0.35:
            raise RuntimeError(f"Failed private FFmpeg joining QA: {observed} expected {target_duration}")
        if len(sha(target))!=64 or target.stat().st_size<2000:
            raise RuntimeError("Missing hash or broken synthesized test tone output")
    print("PASS_PRIVATE_AUDIO_PIPELINE: two synthetic NON-SPEECH test tones, 180ms pause, verified playable output; no stored media",flush=True)

def main():
    p=argparse.ArgumentParser()
    mode=p.add_mutually_exclusive_group()
    mode.add_argument("--audit",action="store_true")
    mode.add_argument("--self-test",action="store_true")
    mode.add_argument("--strict",action="store_true")
    mode.add_argument("--assemble",action="store_true")
    args=p.parse_args()
    if args.self_test:
        self_test()
        return
    plan=load(PLAN)
    entries=plan.get("recipes") or []
    if len(entries)!=900 or Counter(x["ageBand"] for x in entries)!=Counter({"4-6":300,"7-8":300,"9-10":300}):
        raise RuntimeError("No strict 900-question plan exists")
    if plan.get("modelId")!=MODEL or plan.get("voiceId")!=VOICE:
        raise RuntimeError("V4 master speaker mismatch")
    if len({x["questionId"] for x in entries})!=900:
        raise RuntimeError("Duplicate question in 900-song plan")
    required_paid,required_text=required(plan)
    registry=load(REGISTRY)
    paid=registry.get("generationClips") or {}
    text=registry.get("textClips") or {}
    missing_paid=required_paid-set(paid)
    missing_text=required_text-set(text)
    report={
        "questionsPlanned":len(entries),
        "ageBandCounts":{"4-6":300,"7-8":300,"9-10":300},
        "requiredExistingPaidIDs":len(required_paid),
        "requiredDistinctClipTexts":len(required_text),
        "missingPaidMP3Exports":len(missing_paid),
        "missingOriginalTextMP3s":len(missing_text),
        "completeOriginalAssetsPresent":not missing_paid and not missing_text,
        "newCreditsSpentByAssembly":0,
        "liveReleaseAllowed":False
    }
    print("KIDS_ALL900_SEGMENTED_ASSEMBLY_AUDIT "+json.dumps(report,ensure_ascii=False),flush=True)
    if args.audit or not(args.strict or args.assemble):return
    if missing_paid or missing_text:
        raise SystemExit("BLOCKED: Original Serhat V4 audio files must be imported before assembling 900 quiz questions")
    clip_paths={}
    for gid in required_paid:clip_paths[("paid",gid)]=verify_clip(paid[gid])[0]
    for prompt in required_text:clip_paths[("text",prompt)]=verify_clip(text[prompt])[0]
    if args.strict:
        print("STRICT_ALL900_ORIGINAL_ASSET_QA_PASS",flush=True)
        return
    OUTPUT.mkdir(parents=True,exist_ok=True)
    assembled={}
    by_text={}
    def add(full,asset):
        if full in by_text and by_text[full]["sha256"]!=asset["sha256"]:
            raise RuntimeError("Identical narration text assigned conflicting different audio")
        by_text[full]=asset
    def row(path):
        return {"url":"/"+str(path.relative_to(ROOT)),"sha256":sha(path),
                "voiceId":VOICE,"modelId":MODEL,
                "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
                "published":False}
    for q in entries:
        for kind in KINDS:
            obj=q[kind]
            full=obj["text"]
            if full in by_text:continue
            if obj["mode"]=="existing-paid-exact":
                path=clip_paths[("paid",obj["generationId"])]
                add(full,row(path))
                continue
            parts=[clip_paths[("text",s)] for s in obj["segments"]]
            if len(parts)==1:
                add(full,row(parts[0]))
                continue
            key=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+full+"\n"+json.dumps(obj["pauseAfterMs"])).encode()).hexdigest()[:32]
            dest=OUTPUT/(key+".mp3")
            if not dest.exists() or dest.stat().st_size<1400:
                compose(parts,obj["pauseAfterMs"],dest)
            else:
                probe(dest)
            add(full,row(dest))
    if len(by_text)!=plan["uniqueUnsegmentedFullTexts"]:
        raise RuntimeError("Review manifest is missing full spoken text keys")
    result={"schemaVersion":1,"purpose":"PREVIEW_ONLY_NO_PUBLISH",
            "questionCount":900,"voiceId":VOICE,"modelId":MODEL,
            "humanListeningApproved":False,"published":False,"entries":by_text}
    MANIFEST.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: assembled review-only full 900 audio with zero extra synthesis",flush=True)

if __name__=="__main__":main()
