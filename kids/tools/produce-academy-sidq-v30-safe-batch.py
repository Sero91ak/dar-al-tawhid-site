#!/usr/bin/env python3
"""TAWḤĪD KIDS: strictly bounded and resumable 4-clip V4 Ṣidq language-safe batches.

The current three-age Ṣidq V30 plan is immutable during a billed run.
This tool ONLY synthesizes one explicitly indexed 4-clip German-only batch;
12 Arabic/Fuṣḥā-sensitive lines remain on human-supervised hold.
A staged clip is never publicly released by this tool.
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
BATCHES=ROOT/"kids/data/academy-sidq-v30-safe-batches-20261111.json"
PLAN=ROOT/"kids/data/academy-sidq-v4-voice-plan-v30.json"
EARLY=ROOT/"kids/data/academy-audio-staging-sidq-v4-20261111.json"
STAGING=ROOT/"kids/data/academy-audio-staging-sidq-v30-20261111.json"
ASSETS=ROOT/"kids/assets/kids-academy-audio"
POLICY=ROOT/"kids/data/academy-voice-policy-v10.json"
MASTER=ROOT/"data/pronunciation/elevenlabs-production.json"
RISK=re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFFṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾ]")
sys.path.insert(0,str(ROOT/"kids/tools"))
from voice_text import prepare_kids_voice_text
spec=importlib.util.spec_from_file_location("owner_story_audio",ROOT/"kids/tools/build-academy-v9-staging.py")
owner=importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)

def read(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))

def save(p,doc):
    p.parent.mkdir(parents=True,exist_ok=True)
    tmp=p.with_name(p.name+".tmp")
    tmp.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    os.replace(tmp,p)

def validate():
    policy,master,batches,plan=(read(p) for p in (POLICY,MASTER,BATCHES,PLAN))
    if (policy["voiceIdentity"]["voiceId"]!="DkU7j9uO4ZEtLD2iRZSH" or
        policy["production"]["modelId"]!="eleven_v4" or
        policy["production"]["profile"]!="kids_story" or
        master["masterVoice"]["voiceId"]!=policy["voiceIdentity"]["voiceId"] or
        master["modelId"]!="eleven_v4"):
        raise RuntimeError("Owner master voice/model/profile mismatch: no credits used")
    dictionary=master["pronunciationDictionary"]
    if (policy["production"]["pronunciationDictionaryId"]!=dictionary["id"] or
        policy["production"]["pronunciationDictionaryVersionId"]!=dictionary["versionId"]):
        raise RuntimeError("Master Fuṣḥā dictionary revision mismatch: no credits used")
    src=(ROOT/"cloudflare/video-studio/voice.js").read_text(encoding="utf-8")
    if ('profile === "kids_story"' not in src or
        'modelId !== "eleven_v4"' not in src or
        'const pronunciationDictionaryApplied = false;' not in src):
        raise RuntimeError("Voice Studio endpoint behavior changed: no credits used")
    settings=src.split('profile === "kids_story"',1)[1].split('profile === "kids_lesson"',1)[0]
    for k,v in policy["production"]["voiceSettings"].items():
        setting=f"{k}: {str(v).lower() if isinstance(v,bool) else v}"
        if setting not in settings:
            raise RuntimeError("Voice Studio kids_story settings drift: "+k)
    if batches["id"]!="KIDS_SIDQ_V30_20261111_SAFE_BATCHES" or batches["confirmed"]!="USER_AUTHORIZED_BULK_20261111":
        raise RuntimeError("Authorized source batch changed")
    if (batches["voiceId"]!=policy["voiceIdentity"]["voiceId"] or
        batches["modelId"]!="eleven_v4" or
        batches["limitClipsPerInvocation"]!=4 or
        batches["limitPreparedCharactersPerInvocation"]!=1200):
        raise RuntimeError("Cost or owner identity guard changed")
    if plan["version"]!="academy-sidq-v4-final-source-voice-plan-v30-20261111":
        raise RuntimeError("Source plan revision changed")
    source=[p["text"] for p in plan["phrases"] if p["status"]=="not-generated"]
    safe=[t for t in source if not RISK.search(t)]
    held=[t for t in source if RISK.search(t)]
    claimed=[t for batch in batches["batches"] for t in batch["exactPhrases"]]
    if (len(safe)!=64 or len(held)!=12 or len(claimed)!=64 or len(set(claimed))!=64 or
        safe!=claimed or len(batches["batches"])!=16 or
        batches["totalSafeClips"]!=64 or
        batches["heldCount"]!=12 or
        batches["totalRawCharacters"]!=sum(len(t) for t in safe) or
        [d["text"] for d in batches["heldForFushaReview"]]!=held):
        raise RuntimeError("Full curriculum text list changed: no credits used")
    if not batches["publishOnlyAfterHumanReview"] or not batches["neverSynthesizeQuranRecitation"]:
        raise RuntimeError("Source quality release lock changed")
    early=read(EARLY)
    if not early.get("stagingOnly") or len(early.get("entries",{}))!=4:
        raise RuntimeError("First four real owner V4 clips missing from protected staging")
    for i,batch in enumerate(batches["batches"]):
        if batch["batchIndex"]!=i or len(batch["exactPhrases"])!=4 or batch["limitClips"]!=4:
            raise RuntimeError("One invocation exceeded the 4-clip generation limit")
        if sum(len(t) for t in batch["exactPhrases"])!=batch["rawCharacters"]:
            raise RuntimeError("Batch text count changed")
        if batch["maxPreparedCharacters"]!=1200:
            raise RuntimeError("Maximum character budget changed")
        if any(t in early["entries"] for t in batch["exactPhrases"]):
            raise RuntimeError("Attempted rebilling a previously generated original clip")
        for t in batch["exactPhrases"]:
            if RISK.search(t):
                raise RuntimeError("Fuṣḥā-sensitive phrase entered automated German queue")
    if not plan["policy"]["humanFushaHearingRequired"] or plan["counts"]["publicApproved"]!=0:
        raise RuntimeError("Public release or human approval gate changed")
    return policy,master,batches

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--index",type=int)
    parser.add_argument("--check-all",action="store_true")
    parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args()
    policy,master,batches=validate()
    if args.check_all:
        print("PASS: 16 distinct 4-clip batches, 64 German-only exact source texts, 12 Fuṣḥā-sensitive texts withheld, public=0, credits=0")
        return
    if args.index is None or not (0<=args.index<len(batches["batches"])):
        raise RuntimeError("Specify a valid index from 0 to 15; no credits used")
    batch=batches["batches"][args.index]
    texts=batch["exactPhrases"]
    prepared={t:prepare_kids_voice_text(t,apply_pronunciation=False) for t in texts}
    if any(not t.strip() or len(t)>700 or RISK.search(t) for t in prepared.values()):
        raise RuntimeError("Unsafe or invalid prepared script, no credits used")
    total=sum(len(t) for t in prepared.values())
    if total>1200:
        raise RuntimeError("4-clip budget exceeded before generation; no credits used")
    document=read(STAGING) if STAGING.exists() else {
        "schemaVersion":2,"id":"KIDS_ACADEMY_SIDQ_V30_20261111_STAGING",
        "modelId":"eleven_v4","voiceId":policy["voiceIdentity"]["voiceId"],
        "voiceSettingsProfile":"kids_story","stagingOnly":True,
        "reviewRequiredBeforePublicPlayback":True,
        "fuṣḥāSensitiveItemsHeld":batches["heldCount"],"entries":{}
    }
    if (document.get("id")!="KIDS_ACADEMY_SIDQ_V30_20261111_STAGING" or
        document.get("stagingOnly") is not True or
        document.get("reviewRequiredBeforePublicPlayback") is not True):
        raise RuntimeError("Staging integrity guard failed; no credits used")
    eligible={t for b in batches["batches"] for t in b["exactPhrases"]}
    if not set(document["entries"]).issubset(eligible):
        raise RuntimeError("Noncanonical staged clips found; no credits used")
    prepared_hashes={}
    for t in texts:
        hash_input={"text":prepared[t],"voice":policy["voiceIdentity"]["voiceId"],
            "model":"eleven_v4","profile":"kids_story",
            "settings":policy["production"]["voiceSettings"],
            "dictionaryVersion":master["pronunciationDictionary"]["versionId"]}
        prepared_hashes[t]=hashlib.sha256(json.dumps(hash_input,sort_keys=True,
            ensure_ascii=False).encode("utf-8")).hexdigest()
    missing=[]
    for t in texts:
        digest=prepared_hashes[t]
        f=ASSETS/(digest[:20]+".m4a")
        entry=document["entries"].get(t,{})
        valid=(f.is_file() and f.stat().st_size>=1800 and
            entry.get("preparedSha256")==digest and
            entry.get("voiceId")==policy["voiceIdentity"]["voiceId"] and
            entry.get("sha256")==hashlib.sha256(f.read_bytes()).hexdigest() and
            entry.get("approvedForPlayback") is False)
        if not valid: missing.append(t)
    print(f"KIDS ṢIDQ V30 batch {args.index+1}/16: {len(texts)} source phrases, {total} prepared characters, {len(missing)} missing, 0 public clips",flush=True)
    if args.dry_run or not missing:
        return
    secret=os.environ.get("ADMIN_PUBLISH_SECRET","").strip()
    if not secret:
        raise RuntimeError("Owner Voice Studio secret missing; no credits used")
    ASSETS.mkdir(parents=True,exist_ok=True)
    for t in missing:
        digest=prepared_hashes[t]
        destination=ASSETS/(digest[:20]+".m4a")
        if destination.is_file() and destination.stat().st_size>=1800:
            # A lost staging row does not justify a second paid request.
            duration=owner.technical_duration(destination)
        else:
            print(f"OWNER V4 generating one German-safe segment: {len(prepared[t])} chars",flush=True)
            duration=owner.generate_audio(t,destination,secret,prepared_override=prepared[t])
        document["entries"][t]={
            "url":"/"+destination.relative_to(ROOT).as_posix(),
            "sha256":hashlib.sha256(destination.read_bytes()).hexdigest(),
            "preparedSha256":digest,"durationSeconds":round(duration,3),
            "voiceProfileId":"serhat-owner-voice-2026",
            "voiceId":policy["voiceIdentity"]["voiceId"],
            "voiceSettingsProfile":"kids_story","modelId":"eleven_v4",
            "sourceVoice":"authorized-owner-voice",
            "sourceSpeaker":"Serhat Abu Malik","sourceType":"owner-voice-generated",
            "pronunciationPreparation":"exact German original; native Fuṣḥā-sensitive phrases excluded",
            "pronunciationDictionaryAppliedByBackend":False,
            "qaStatus":"technical-passed-awaiting-human-fusha-review",
            "approvedForPlayback":False,"sameAsApprovedKidsStoryProfile":True
        }
        save(STAGING,document)
    print(f"PASS batch {args.index+1}/16: {len(texts)} clips verified, {len(document['entries'])}/64 in V30 staging, never public",flush=True)

if __name__=="__main__":
    main()
