#!/usr/bin/env python3
"""TAWḤĪD KIDS: fail-closed, read-only release gate for ALL 900 V4 questions.

This gate must pass before any KIDS live audio release. No network, synthesis or
deployment here. Default prints an audit; --strict exits 2 unless all audio
files have real hashes, valid codecs, the exact model/voice, and listening QA.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-all900-segmented-review.json"
OFFICIAL=ROOT/"kids/data/quiz-audio.json"
PREVIEW=ROOT/"kids/data/quiz-v4-all900-audio-preview.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")
ALLOWED_QA={"human-reviewed-natural-speech","human-reviewed-pronunciation","human-reviewed-natural-fusha"}

def load(p):
    if not p.exists():return {}
    try:return json.loads(p.read_text(encoding="utf-8"))
    except (OSError,ValueError):return {}

def check(entry):
    if not isinstance(entry,dict):return "no-entry"
    if entry.get("modelId")!="eleven_v4":return "wrong-model"
    if entry.get("voiceId")!=VOICE:return "wrong-voice"
    if entry.get("audioListeningApproved") is not True or entry.get("qaApproval") not in ALLOWED_QA:
        return "not-listening-approved"
    url=entry.get("url") or ""
    root=ROOT/"kids/assets/kids-quiz-audio"
    if not isinstance(url,str) or not url.startswith("/kids/assets/kids-quiz-audio/"):
        return "not-local-quiz-asset"
    if "?" in url or "#" in url or ".." in url or not url.endswith((".mp3",".m4a")):
        return "unsafe-audio-path"
    path=(ROOT/url.lstrip("/")).resolve()
    if not path.is_relative_to(root.resolve()):
        return "unsafe-audio-path"
    if not path.exists() or not path.is_file() or path.stat().st_size<1500:
        return "missing-audio-file"
    expected=entry.get("sha256") or ""
    if len(expected)!=64 or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
        return "sha256-mismatch"
    probe=subprocess.run(["ffprobe","-v","error","-show_entries",
       "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
       capture_output=True,text=True)
    if probe.returncode:return "unreadable-audio"
    try:
        meta=json.loads(probe.stdout)
        seconds=float((meta.get("format") or {}).get("duration") or 0)
        streams=[s for s in meta.get("streams") or [] if s.get("codec_type")=="audio"]
        codec=streams[0].get("codec_name") if streams else None
        if not 0.5<seconds<240 or codec not in ("mp3","aac"):
            return "wrong-audio-format"
    except (KeyError,ValueError,TypeError):return "unreadable-audio"
    return None

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--strict",action="store_true")
    parser.add_argument("--preview",action="store_true",help="Audit preview manifest, never authorize LIVE")
    args=parser.parse_args()
    p=load(PLAN)
    recipes=p.get("recipes") or []
    if len(recipes)!=900 or Counter(q.get("ageBand") for q in recipes)!=Counter({"4-6":300,"7-8":300,"9-10":300}):
        raise RuntimeError("No valid 900-question segmented plan in review branch")
    if len({q.get("questionId") for q in recipes})!=900 or p.get("modelId")!="eleven_v4" or p.get("voiceId")!=VOICE:
        raise RuntimeError("Full catalog or original speaker integrity failure")
    file=PREVIEW if args.preview else OFFICIAL
    manifest=load(file)
    entries=manifest.get("entries") or {}
    all_keys={q[k]["text"] for q in recipes for k in PARTS}
    errors=Counter()
    approved=set()
    for text in all_keys:
        err=check(entries.get(text))
        if err:errors[err]+=1
        else:approved.add(text)
    counts={}
    for age in ("4-6","7-8","9-10"):
        age_recipes=[q for q in recipes if q["ageBand"]==age]
        qapproved=sum(all(q[k]["text"] in approved for k in PARTS) for q in age_recipes)
        counts[age]={"questions":len(age_recipes),"allFourAudiosApproved":qapproved}
    release=not errors and not args.preview and len(approved)==len(all_keys) and sum(x["allFourAudiosApproved"] for x in counts.values())==900
    result={"schema":"900-v4-release-gate","scope":"TAWḤĪD KIDS","requestedQuestions":900,
       "distinctExactAudioKeys":len(all_keys),"approvedUniqueAudioKeys":len(approved),
       "notReadyKeys":len(all_keys)-len(approved),"byAge":counts,
       "errorCounts":dict(errors),"previewOnly":args.preview,"releaseAllowed":release,
       "newCreditsSpentByGate":0}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if args.strict and not release:
        raise SystemExit("LIVE AUDIO RELEASE BLOCKED: 900 V4 recordings not fully validated")

if __name__=="__main__":main()
