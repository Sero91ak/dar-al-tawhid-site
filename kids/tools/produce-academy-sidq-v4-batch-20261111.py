#!/usr/bin/env python3
"""TAWḤĪD KIDS owner-only first Ṣidq batch: V4, exact phrases, staging only.

Never touches the public audio catalog or uses synthetic Qur'an recitation.
Uses the *existing* approved DAR Voice Studio kids_story backend and the
existing Kids master pronunciation text preparation. One controlled 4-clip
credit budget; no retry of a failed billable clip in this process.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REQUEST=ROOT/"kids/data/academy-sidq-v4-batch-20261111.json"
STAGING=ROOT/"kids/data/academy-audio-staging-sidq-v4-20261111.json"
ASSETS=ROOT/"kids/assets/kids-academy-audio"
VOICE_POLICY=ROOT/"kids/data/academy-voice-policy-v10.json"
PRODUCTION_POLICY=ROOT/"data/pronunciation/elevenlabs-production.json"
LESSON_PLAN=ROOT/"kids/data/academy-sidq-voice-plan-v18.json"
SALAM_PLAN=ROOT/"kids/data/academy-full-salam-voice-plan-v19.json"

import sys
sys.path.insert(0,str(ROOT/"kids/tools"))
from voice_text import prepare_kids_voice_text
spec=importlib.util.spec_from_file_location("kids_academy_canonical_staging",ROOT/"kids/tools/build-academy-v9-staging.py")
voice=importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)

def load(file):
    return json.loads(file.read_text(encoding="utf-8"))

def save(data):
    STAGING.parent.mkdir(parents=True,exist_ok=True)
    STAGING.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args()
    request=load(REQUEST);policy=load(VOICE_POLICY);production=load(PRODUCTION_POLICY)
    if request.get("confirmed")!="GENERATE-FOUR-SIDQ-20261111" or request.get("stagingOnly") is not True:
        raise RuntimeError("Owner batch authorization missing; zero credits used")
    if request.get("maxClips")!=4 or request.get("maxPreparedCharacters")!=650:
        raise RuntimeError("Bounded batch budget changed; zero credits used")
    if (policy["voiceIdentity"]["voiceId"]!="DkU7j9uO4ZEtLD2iRZSH" or
        policy["production"]["profile"]!="kids_story" or
        policy["production"]["modelId"]!="eleven_v4" or
        production["masterVoice"]["voiceId"]!=policy["voiceIdentity"]["voiceId"] or
        production["modelId"]!="eleven_v4"):
        raise RuntimeError("Master voice/profile/model mismatch; zero credits used")
    dictionary=production["pronunciationDictionary"]
    if (dictionary["id"]!=policy["production"]["pronunciationDictionaryId"] or
        dictionary["versionId"]!=policy["production"]["pronunciationDictionaryVersionId"]):
        raise RuntimeError("Fusha master library version changed; zero credits used")
    studio=(ROOT/"cloudflare/video-studio/voice.js").read_text(encoding="utf-8")
    if 'profile === "kids_story"' not in studio or 'modelId !== "eleven_v4"' not in studio:
        raise RuntimeError("Canonical V4 story backend changed; zero credits used")
    story=studio.split('profile === "kids_story"',1)[1].split('profile === "kids_lesson"',1)[0]
    for k,v in policy["production"]["voiceSettings"].items():
        expected=f"{k}: {str(v).lower() if isinstance(v,bool) else v}"
        if expected not in story:
            raise RuntimeError("Canonical story settings changed: "+k+"; zero credits used")
    # The global multilingual PLS is intentionally NOT attached by Voice Studio:
    # it contains a documented collision (German 'Nur'). The existing master
    # pronunciation preparation is applied instead and must be human-auditioned.
    if "const pronunciationDictionaryApplied = false;" not in studio:
        raise RuntimeError("Voice Studio dictionary behavior changed; re-review before billing")
    allowed={x["text"] for x in load(LESSON_PLAN)["phrases"]}
    allowed.update(x["text"] for x in load(SALAM_PLAN)["phrases"])
    exact=request.get("exactPhrases") or []
    if len(exact)!=4 or len(set(exact))!=4 or not set(exact)<=allowed:
        raise RuntimeError("Non-canonical, duplicate or incorrect phrases; zero credits used")
    # Full Salām has one explicitly reviewed canonical Arabic spelling and must
    # synthesize as a native ar-only segment. Never let the global PLS replace
    # German words with unrelated Arabic script (the historical 'Nur' collision).
    native_fusha={
        "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.": "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ."
    }
    prepared={}
    for phrase in exact:
        val=native_fusha.get(phrase) or prepare_kids_voice_text(phrase,apply_pronunciation=False)
        if not val.strip() or len(val)>700:
            raise RuntimeError("Invalid prepared phrase; zero credits used")
        arabic=any("\u0600" <= ch <= "\u06ff" for ch in val)
        latin=any(("a" <= ch.lower() <= "z") for ch in val)
        if arabic and (latin or phrase not in native_fusha):
            raise RuntimeError("Unsafe mixed-script synthesis; split language segments first")
        if phrase in native_fusha and not arabic:
            raise RuntimeError("Canonical native Arabic greeting lost; zero credits used")
        prepared[phrase]=val
    total=sum(len(t) for t in prepared.values())
    if total>650:
        raise RuntimeError("Exceeds approved character budget; zero credits used")
    old=load(STAGING) if STAGING.exists() else {}
    if old and (old.get("id")!="KIDS_ACADEMY_SIDQ_V4_20261111_STAGING" or
                old.get("stagingOnly") is not True):
        raise RuntimeError("Staging manifest identity changed; zero credits used")
    entries=old.get("entries",{})
    if any(text not in exact for text in entries):
        raise RuntimeError("Staging contains unrequested clip; zero credits used")
    clips={}
    for phrase in exact:
        digest=hashlib.sha256(json.dumps({
            "text":prepared[phrase],"voice":policy["voiceIdentity"]["voiceId"],
            "model":"eleven_v4","profile":"kids_story",
            "settings":policy["production"]["voiceSettings"],
            "dictionaryVersion":dictionary["versionId"]
        },sort_keys=True,ensure_ascii=False).encode("utf-8")).hexdigest()
        dest=ASSETS/(digest[:20]+".m4a")
        previous=entries.get(phrase,{})
        valid=(dest.is_file() and dest.stat().st_size>=1800 and
               previous.get("preparedSha256")==digest and
               previous.get("sha256")==hashlib.sha256(dest.read_bytes()).hexdigest() and
               previous.get("voiceId")==policy["voiceIdentity"]["voiceId"] and
               previous.get("modelId")=="eleven_v4")
        clips[phrase]=(digest,dest,valid)
    pending=sum(not x[2] for x in clips.values())
    print(f"KIDS ṢIDQ V4: {len(exact)} exact canonical phrases, {total} prepared characters, {pending} pending; staging only",flush=True)
    if args.dry_run or pending==0:
        return
    secret=os.getenv("ADMIN_PUBLISH_SECRET","").strip()
    if not secret:
        raise RuntimeError("Voice Studio admin secret missing; zero credits used")
    ASSETS.mkdir(parents=True,exist_ok=True)
    for phrase in exact:
        digest,dest,valid=clips[phrase]
        if valid:
            continue
        if dest.exists() and dest.stat().st_size>=1800:
            # Existing file may come from an interrupted previous request.
            # Reuse the binary; never bill again just to restore a manifest.
            duration=voice.technical_duration(dest)
        else:
            print(f"Generating 1 canonical V4 staging clip: {len(prepared[phrase])} chars",flush=True)
            duration=voice.generate_audio(phrase,dest,secret,prepared_override=prepared[phrase])
        entries[phrase]={
            "url":"/"+dest.relative_to(ROOT).as_posix(),
            "sha256":hashlib.sha256(dest.read_bytes()).hexdigest(),
            "preparedSha256":digest,
            "durationSeconds":round(duration,3),
            "voiceProfileId":"serhat-owner-voice-2026",
            "voiceId":policy["voiceIdentity"]["voiceId"],
            "voiceSettingsProfile":"kids_story",
            "modelId":"eleven_v4",
            "sourceVoice":"authorized-owner-voice",
            "sourceSpeaker":"Serhat Abu Malik",
            "sourceType":"owner-voice-generated",
            "pronunciationPreparation":"native Fuṣḥā Arabic-only for canonical Salām; otherwise exact German without unsafe cross-language PLS",
            "pronunciationDictionaryAppliedByBackend":False,
            "qaStatus":"technical-passed-awaiting-human-fusha-review",
            "approvedForPlayback":False,
            "sameAsApprovedKidsStoryProfile":True
        }
        stage={
            "schemaVersion":2,
            "id":"KIDS_ACADEMY_SIDQ_V4_20261111_STAGING",
            "voiceProfileId":"serhat-owner-voice-2026",
            "modelId":"eleven_v4",
            "voiceSettingsProfile":"kids_story",
            "reviewRequiredBeforePublicPlayback":True,
            "stagingOnly":True,
            "pilotFirstLesson":True,
            "entries":entries
        }
        save(stage) # Durable per-clip snapshot: interrupted batches aren't rebilled blindly.
    print(f"KIDS ṢIDQ V4 DONE: {len(entries)}/4 clips staged, never added to public audio manifest",flush=True)

if __name__=="__main__":
    main()
