#!/usr/bin/env python3
"""Production of twelve Fuṣḥā-sensitive Ṣidq lesson lines with owner V4 voice.

The original German teaching text is kept immutable, and the audio-only
pronunciation script uses source-verified DAR Arabic master lexicon terms.
Three explicit batches, four clips each, max 1200 chars per batch, staging only.
No synthetic recitation of Qurʾān. All 12 require human listening approval.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REQUEST=ROOT/"kids/data/academy-sidq-v30-fusha-qa-batches-20261111.json"
SOURCE=ROOT/"kids/data/academy-sidq-v4-voice-plan-v30.json"
STAGING=ROOT/"kids/data/academy-audio-staging-sidq-fusha-v30-20261111.json"
STAGED_SAFE=ROOT/"kids/data/academy-audio-staging-sidq-v30-20261111.json"
STAGED_FIRST=ROOT/"kids/data/academy-audio-staging-sidq-v4-20261111.json"
POLICY=ROOT/"kids/data/academy-voice-policy-v10.json"
MASTER=ROOT/"data/pronunciation/elevenlabs-production.json"
LEXICON=ROOT/"data/pronunciation/islamic-expanded-lexicon.json"
ASSETS=ROOT/"kids/assets/kids-academy-audio"
RISK=re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFFṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾ]")
sys.path.insert(0,str(ROOT/"kids/tools"))
spec=importlib.util.spec_from_file_location("canonical_story_voice",ROOT/"kids/tools/build-academy-v9-staging.py")
voice=importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)

def read(p):
    return json.loads(Path(p).read_text("utf-8"))

def save(doc):
    STAGING.parent.mkdir(parents=True,exist_ok=True)
    tmp=STAGING.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n","utf-8")
    os.replace(tmp,STAGING)

def preflight():
    req,source,policy,master,lex=(read(f) for f in (REQUEST,SOURCE,POLICY,MASTER,LEXICON))
    if req.get("id")!="KIDS_ACADEMY_SIDQ_FUSHA_V30_20261111_QA" or req.get("count")!=12 or len(req["batches"])!=3:
        raise RuntimeError("Exact Fuṣḥā review batch changed; no credits used")
    if (req.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH" or req.get("voiceProfile")!="kids_story" or
        req.get("model")!="eleven_v4" or req.get("maxClipsPerInvocation")!=4 or
        req["policy"].get("publicRelease") is not False or
        req["policy"].get("humanApprovalRequired") is not True or
        req["policy"].get("noSyntheticQuranRecitation") is not True):
        raise RuntimeError("Voice or protected release gate changed")
    if (policy["voiceIdentity"]["voiceId"]!=req["voiceId"] or
        policy["production"]["modelId"]!=req["model"] or
        policy["production"]["profile"]!=req["voiceProfile"] or
        master["masterVoice"]["voiceId"]!=req["voiceId"] or
        master["modelId"]!="eleven_v4" or
        policy["production"]["pronunciationDictionaryId"]!=master["pronunciationDictionary"]["id"] or
        policy["production"]["pronunciationDictionaryVersionId"]!=master["pronunciationDictionary"]["versionId"]):
        raise RuntimeError("Existing owner Fuṣḥā master configuration changed")
    studio=(ROOT/"cloudflare/video-studio/voice.js").read_text("utf-8")
    if ('profile === "kids_story"' not in studio or 'modelId !== "eleven_v4"' not in studio or
        'const pronunciationDictionaryApplied = false;' not in studio):
        raise RuntimeError("Voice endpoint no longer has verified V4 configuration")
    profile=studio.split('profile === "kids_story"',1)[1].split('profile === "kids_lesson"',1)[0]
    for k,v in policy["production"]["voiceSettings"].items():
        if f"{k}: {str(v).lower() if isinstance(v,bool) else v}" not in profile:
            raise RuntimeError("Owner V4 story voice setting drift: "+k)
    names={x.get("canonical"):x.get("tts_text") for x in lex["entries"]}
    for key in ["Qurʾān","Ḥadīṯ","Ṣaḥīḥ","Sunnah","ṣallā Allāhu ʿalayhi wa-sallam"]:
        if not names.get(key):
            raise RuntimeError("Fuṣḥā master lexicon entry is missing: "+key)
    early,safe=read(STAGED_FIRST),read(STAGED_SAFE)
    if not (early["stagingOnly"] and safe["stagingOnly"] and len(early["entries"])==4 and len(safe["entries"])==64):
        raise RuntimeError("Previously generated 68 V4 assets must be preserved")
    original=[p["text"] for p in source["phrases"] if p["status"]=="not-generated" and RISK.search(p["text"])]
    declared=[x["text"] for b in req["batches"] for x in b["items"]]
    if (len(original)!=12 or len(declared)!=12 or
        declared!=original or len(set(declared))!=12 or
        set(declared)&(set(early["entries"])|set(safe["entries"]))):
        raise RuntimeError("12 Fuṣḥā source strings are not canonical or contain duplicated files")
    if sum(len(x["prepared"]) for b in req["batches"] for x in b["items"])!=req["characters"]:
        raise RuntimeError("Fuṣḥā prepared text count changed")
    for i,b in enumerate(req["batches"]):
        if b["batchIndex"]!=i or len(b["items"])!=4 or b["maxClips"]!=4 or b["maxPreparedCharacters"]!=1200:
            raise RuntimeError("Batch maximum modified")
        if sum(len(x["prepared"]) for x in b["items"])>1200:
            raise RuntimeError("Prepared character budget exceeded")
        for x in b["items"]:
            text=x["prepared"]
            if not text.strip() or not (20<=len(text)<=700):
                raise RuntimeError("Fuṣḥā pronunciation script empty or too long")
            if not any("\u0600"<=c<="\u06ff" for c in text):
                raise RuntimeError("Expected Arabic source-term not found in Fuṣḥā script")
            if x["qaRequired"] is not True or x["approvedForPlayback"] is not False:
                raise RuntimeError("Human approval cannot be bypassed")
    return req,policy,master

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--check-all",action="store_true")
    cli.add_argument("--dry-run",action="store_true")
    cli.add_argument("--index",type=int)
    args=cli.parse_args()
    req,policy,master=preflight()
    if args.check_all:
        print("PASS: 12 canonical Fuṣḥā-sensitive texts, three 4-clip batches, 68 existing stage clips, zero synthetic Qurʾān recitation; no credits")
        return
    if args.index is None or args.index not in (0,1,2):
        raise RuntimeError("Specify batch index 0, 1 or 2")
    batch=req["batches"][args.index]
    m=read(STAGING) if STAGING.exists() else {
      "schemaVersion":2,"id":"KIDS_ACADEMY_SIDQ_FUSHA_V30_20261111_STAGING",
      "modelId":"eleven_v4","voiceId":"DkU7j9uO4ZEtLD2iRZSH",
      "voiceSettingsProfile":"kids_story","stagingOnly":True,
      "requiresOwnerListeningApproval":True,
      "pronunciationSource":"DAR verified expanded Fuṣḥā master lexicon (audio-only overrides)",
      "pronunciationDictionaryAppliedByBackend":False,
      "entries":{}
    }
    if not m.get("stagingOnly") or m.get("id")!="KIDS_ACADEMY_SIDQ_FUSHA_V30_20261111_STAGING":
        raise RuntimeError("Fuṣḥā staging integrity guard failed")
    accepted={x["text"] for b in req["batches"] for x in b["items"]}
    if not set(m["entries"]).issubset(accepted):
        raise RuntimeError("Unrequested item in Fuṣḥā staging")
    pending=[]
    for it in batch["items"]:
        digest=hashlib.sha256(json.dumps({
          "text":it["prepared"],"voice":policy["voiceIdentity"]["voiceId"],
          "model":"eleven_v4","profile":"kids_story",
          "settings":policy["production"]["voiceSettings"],
          "dictionaryVersion":master["pronunciationDictionary"]["versionId"]
        },ensure_ascii=False,sort_keys=True).encode("utf-8")).hexdigest()
        file=ASSETS/(digest[:20]+".m4a")
        previous=m["entries"].get(it["text"],{})
        valid=(file.is_file() and file.stat().st_size>=1800 and
            previous.get("sha256")==hashlib.sha256(file.read_bytes()).hexdigest() and
            previous.get("preparedSha256")==digest and
            previous.get("approvedForPlayback") is False and
            previous.get("voiceId")==policy["voiceIdentity"]["voiceId"])
        if not valid:
            pending.append((it,digest,file))
    print(f"KIDS ṢIDQ FUṢḤĀ REVIEW batch {args.index+1}/3: {len(batch['items'])} canonical scripts, {len(pending)} missing; no public playback",flush=True)
    if args.dry_run or not pending:
        return
    secret=os.environ.get("ADMIN_PUBLISH_SECRET","").strip()
    if not secret:
        raise RuntimeError("Voice Studio secret is absent, no credits spent")
    ASSETS.mkdir(parents=True,exist_ok=True)
    for it,digest,dest in pending:
        if dest.is_file() and dest.stat().st_size>=1800:
            duration=voice.technical_duration(dest)
        else:
            print("Generating owner-V4 mixed German/Fuṣḥā listening candidate",len(it["prepared"]),"chars",flush=True)
            duration=voice.generate_audio(it["text"],dest,secret,prepared_override=it["prepared"])
        m["entries"][it["text"]]={
          "url":"/"+dest.relative_to(ROOT).as_posix(),
          "sha256":hashlib.sha256(dest.read_bytes()).hexdigest(),
          "preparedSha256":digest,"durationSeconds":round(duration,3),
          "voiceId":policy["voiceIdentity"]["voiceId"],
          "voiceProfileId":"serhat-owner-voice-2026",
          "modelId":"eleven_v4","voiceSettingsProfile":"kids_story",
          "sourceSpeaker":"Serhat Abu Malik",
          "spokenPreparation":it["prepared"],
          "pronunciationSource":"DAR expanded Fuṣḥā lexicon and explicitly reviewed Ṣidq/Tawbah orthography",
          "pronunciationDictionaryAppliedByBackend":False,
          "qaStatus":"technical-passed-requires-human-mixed-script-fusha-listening",
          "approvedForPlayback":False,"stagingOnly":True
        }
        save(m)
    print("PASS: Fuṣḥā review batch",args.index+1,"stage",len(m["entries"]),"/12; none published",flush=True)

if __name__=="__main__":
    main()
