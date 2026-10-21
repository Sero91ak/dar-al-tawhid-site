#!/usr/bin/env python3
"""Offline-only V4 sound composition for TAWḤĪD KIDS age 4–6 (300 questions).

This utility NEVER accesses ElevenLabs, charges credits, uses device TTS or
modifies kids/data/quiz-audio.json. It may assemble only genuinely imported,
hash-verified original MP3s from an explicit REVIEW asset registry.

Commands:
  python3 kids/tools/quiz_v4_segmented_300.py --audit
  python3 kids/tools/quiz_v4_segmented_300.py --strict
  python3 kids/tools/quiz_v4_segmented_300.py --assemble

--strict and --assemble fail closed while original files are unavailable.
--assemble creates a separate, unreleased review-only audio manifest.
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
PLAN=ROOT/"kids/data/quiz-v4-age4-6-300-segmented-plan.json"
CONTRACT=ROOT/"kids/data/quiz-v4-age4-6-300-review.json"
SOURCE=ROOT/"kids/data/quiz-kids.json"
ORIGINALS=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
CLIP_REGISTRY=ROOT/"kids/data/quiz-v4-age4-6-original-clip-registry.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-age4-6-review-only"
OUT_MANIFEST=ROOT/"kids/data/quiz-v4-age4-6-300-audio-preview.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
SPEECH_MODEL="eleven_v4"
PAUSE_MS=240

def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))

def digest(path):
    h=hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda:fh.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def validate_plan():
    plan,contract,source,old=map(read_json,(PLAN,CONTRACT,SOURCE,ORIGINALS))
    items=plan["recipes"]
    qmap={q["questionId"]:q for q in contract["items"]}
    source_ids={x["id"] for x in source["items"] if x["ageBand"]=="4-6"}
    assert len(items)==len(qmap)==len(source_ids)==300
    assert set(qmap)==source_ids=={q["questionId"] for q in items}
    assert plan["counts"]["missingDistinctSegments"]==558
    assert plan["counts"]["missingCharacters"]==28749
    assert plan["counts"]["previouslyPaidThreePartQuestionSets"]==1
    assert plan["voiceId"]==VOICE and plan["modelId"]==SPEECH_MODEL
    assert plan["pauseBetweenPartsMs"]==PAUSE_MS
    all_texts=set()
    part_ids={}
    for q in old["items"]:
        if q["ageBand"]=="4-6":
            part_ids[q["questionId"]]={r["part"]:r["generationId"]
                                       for r in q["recordings"] if r.get("generationId")}
    for recipe in items:
        id=recipe["questionId"]
        a=qmap[id]
        assert a["ageBand"]=="4-6" and a["source"]
        assert recipe["ageBand"]=="4-6"
        assert recipe["question"]["expectedText"]==a["questionAudioText"]
        assert recipe["explanation"]["expectedText"]==a["explanationAudioText"]
        assert recipe["correct"]["text"]==a["correctAudioText"]
        assert recipe["retry"]["text"]==a["retryAudioText"]
        for k in ("question","explanation"):
            rec=recipe[k]
            mode=rec["mode"]
            if mode.startswith("compose"):
                assert rec["parts"] and all(x.strip() for x in rec["parts"])
                assert " ".join(rec["parts"])==rec["expectedText"]
            elif mode=="reuse-full-original":
                assert len(rec["existingGenerationIds"])==1
                assert rec["existingGenerationIds"][0]==part_ids[id][k]
            else:
                raise AssertionError(f"Unsupported audio composition mode: {mode}")
        if id=="kids-quiz-002":
            assert recipe["question"]["mode"]=="compose-three-previously-paid-v4-original-segments"
            assert len(recipe["question"]["existingGenerationIds"])==3
        for k in ("correct","retry"):
            assert recipe[k]["existingGenerationId"] and len(recipe[k]["text"])
        all_texts.update([a["questionAudioText"],a["correctAudioText"],
                          a["retryAudioText"],a["explanationAudioText"]])
    assert len(all_texts)==592
    pending=plan["missingFragments"]
    assert len(pending)==558 and len({x["text"] for x in pending})==558
    assert sum(x["characters"] for x in pending)==28749
    return plan,contract

def probe_audio(path):
    result=subprocess.run(["ffprobe","-v","error","-show_entries",
         "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
         capture_output=True,text=True,check=True)
    data=json.loads(result.stdout)
    duration=float(data["format"]["duration"])
    streams=[s for s in data.get("streams",[]) if s.get("codec_type")=="audio"]
    if not streams or streams[0].get("codec_name") not in ("mp3","aac") or not .45<=duration<=180:
        raise ValueError("Unplayable or implausible original audio clip")
    return duration

def check_clip(entry,registry_root):
    if not isinstance(entry,dict):
        raise ValueError("Original clip missing")
    if entry.get("modelId")!=SPEECH_MODEL or entry.get("voiceId")!=VOICE:
        raise ValueError("Invalid master voice or V4 model")
    url=entry.get("url") or ""
    prefix="/kids/assets/kids-quiz-audio/"
    if not url.startswith(prefix) or ".." in url or "?" in url or "#" in url:
        raise ValueError("Signed/external/unsafe audio URL blocked")
    src=(ROOT/url.lstrip("/")).resolve()
    if not src.is_relative_to(registry_root) or not src.is_file() or src.stat().st_size<1400:
        raise ValueError("Original audio not stored as a local KIDS asset")
    checksum=entry.get("sha256") or ""
    if len(checksum)!=64 or digest(src)!=checksum:
        raise ValueError("Original audio checksum missing or changed")
    return src,probe_audio(src)

def required_sources(plan):
    needed_gen=set()
    needed_text=set()
    for recipe in plan["recipes"]:
        for kind in ("question","explanation"):
            obj=recipe[kind]
            if obj["mode"]=="reuse-full-original":
                needed_gen.update(obj["existingGenerationIds"])
            else:
                needed_text.update(obj["parts"])
        for kind in ("correct","retry"):
            needed_gen.add(recipe[kind]["existingGenerationId"])
    return needed_gen,needed_text

def inspect(plan):
    required_generations,required_texts=required_sources(plan)
    registry=read_json(CLIP_REGISTRY) if CLIP_REGISTRY.exists() else {}
    generations=registry.get("generationClips") or {}
    texts=registry.get("textClips") or {}
    missing_generations=sorted(required_generations-set(generations))
    missing_texts=sorted(required_texts-set(texts))
    report={
      "scope":"300 KIDS questions age 4–6, review only",
      "questions":300,"speechKeys":592,
      "requiredGenerationAssets":len(required_generations),
      "requiredDistinctTextFragments":len(required_texts),
      "missingOriginalGenerationAssets":len(missing_generations),
      "missingTextFragmentAssets":len(missing_texts),
      "estimatedNewSyntheses":plan["counts"]["missingDistinctSegments"],
      "estimatedAdditionalCredits":plan["counts"]["estimatedCreditsAtPreviouslyObservedRate"],
      "readyForAssembly":not(missing_generations or missing_texts),
      "synthesisCreditsSpent":0,
      "published":False
    }
    return registry,report

def run(cmd):
    subprocess.run(cmd,capture_output=True,text=True,check=True)

def compose(paths,target):
    OUTPUT.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="kids-v4-compose-") as tmp:
        tmp=Path(tmp)
        wav=[]
        durations=[]
        for i,path in enumerate(paths):
            durations.append(probe_audio(path))
            to=tmp/f"{i:02d}.wav"
            run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                 "-i",str(path),"-ac","1","-ar","48000","-c:a","pcm_s16le",str(to)])
            wav.append(to)
        pause=tmp/"pause.wav"
        run(["ffmpeg","-hide_banner","-loglevel","error","-y",
             "-f","lavfi","-i","anullsrc=r=48000:cl=mono",
             "-t",str(PAUSE_MS/1000),"-c:a","pcm_s16le",str(pause)])
        seq=[]
        for i,x in enumerate(wav):
            if i:seq.append(pause)
            seq.append(x)
        playlist=tmp/"concat.txt"
        playlist.write_text("".join("file '"+str(x.resolve()).replace("'","'\\''")+"'\n" for x in seq),encoding="utf-8")
        encoded=tmp/"joined.mp3"
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat",
             "-safe","0","-i",str(playlist),"-ac","1","-ar","48000",
             "-c:a","libmp3lame","-b:a","96k",str(encoded)])
        actual=probe_audio(encoded)
        expected=sum(durations)+(len(paths)-1)*PAUSE_MS/1000
        if abs(actual-expected)>1.0:
            raise ValueError(f"Broken audio join: {actual:.3f} != ~{expected:.3f}")
        target.write_bytes(encoded.read_bytes())
    return target

def main():
    ap=argparse.ArgumentParser()
    mx=ap.add_mutually_exclusive_group()
    mx.add_argument("--audit",action="store_true")
    mx.add_argument("--strict",action="store_true")
    mx.add_argument("--assemble",action="store_true")
    args=ap.parse_args()
    plan,contract=validate_plan()
    registry,report=inspect(plan)
    print("KIDS_V4_SEGMENTED_300_AUDIT "+json.dumps(report,ensure_ascii=False),flush=True)
    if args.audit or not(args.strict or args.assemble):return
    if not report["readyForAssembly"]:
        raise SystemExit("BLOCKED: paid originals not fully imported; no re-generation or publishing")
    root=(ROOT/"kids/assets/kids-quiz-audio").resolve()
    if args.strict:
        for key in required_sources(plan)[0]:check_clip(registry['generationClips'][key],root)
        for key in required_sources(plan)[1]:check_clip(registry['textClips'][key],root)
        print('STRICT_ASSET_QA_PASS: hash, codec, duration, master voice, model',flush=True)
        return
    gens=registry["generationClips"];texts=registry["textClips"]
    clip_cache={}
    def imported(entry):
        identifier=entry["url"]
        if identifier not in clip_cache:
            clip_cache[identifier]=check_clip(entry,root)[0]
        return clip_cache[identifier]
    entries={}
    def assign(text,entry):
        if text in entries and entries[text]["sha256"]!=entry["sha256"]:
            raise ValueError("Two sound files for identical text keys")
        entries[text]=entry
    def ready_asset(path):
        return {"url":"/"+str(path.relative_to(ROOT)),
                "sha256":digest(path),"modelId":SPEECH_MODEL,
                "voiceId":VOICE,"audioListeningApproved":False,
                "qaApproval":"pending-human-auditory-review",
                "status":"PREVIEW_ONLY_NEVER_LIVE"}
    for recipe in plan["recipes"]:
        for kind in ("question","explanation"):
            obj=recipe[kind];text=obj["expectedText"]
            if text in entries:continue
            if obj["mode"]=="reuse-full-original":
                path=imported(gens[obj["existingGenerationIds"][0]])
                assign(text,ready_asset(path))
            else:
                parts=[imported(texts[t]) for t in obj["parts"]]
                sig=hashlib.sha256((VOICE+SPEECH_MODEL+text).encode("utf-8")).hexdigest()[:24]
                dest=OUTPUT/(sig+".mp3")
                if not dest.exists():compose(parts,dest)
                assign(text,ready_asset(dest))
        for kind in ("correct","retry"):
            obj=recipe[kind]
            assign(obj["text"],ready_asset(imported(gens[obj["existingGenerationId"]])))
    if len(entries)!=592:raise RuntimeError(f"Expected 592 exact keys, got {len(entries)}")
    manifest={"schemaVersion":1,"scope":"AGE_4_6_300_V4_REVIEW_ONLY",
              "modelId":SPEECH_MODEL,"voiceId":VOICE,
              "published":False,"humanListeningApproved":False,"entries":entries}
    OUT_MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS: composed 300 original V4 contracts; publication still blocked",flush=True)

if __name__=="__main__":main()
