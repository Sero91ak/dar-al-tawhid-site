#!/usr/bin/env python3
"""TAWḤĪD KIDS: safe four-clip V4 Academy staging worker.

Default mode is ZERO-CREDIT dry-run. Requires source-approved per-text batch,
verified cached source text, strict DE / Fuṣḥā separation, and explicit --execute.
Never publishes to /kids/data/academy-audio.json or a children's player.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.request

from voice_text import prepare_kids_voice_text

ROOT = Path(__file__).resolve().parents[2]
POLICY = ROOT / "kids/data/academy-voice-policy-v10.json"
REQUEST = ROOT / "kids/review-only/academy-208-v4-approved-batch.json"
STAGING = ROOT / "kids/review-only/academy-208-v4-staging"
MANIFEST = STAGING / "manifest.json"
BACKEND = "https://dar-admin-publisher.sero91ak.workers.dev/voice-studio/api/generate-with-timings"
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")
TRUE_FIELDS = (
    "lessonSourcesReviewed", "childPedagogyReviewed",
    "fushaPronunciationTextReviewed", "voiceIdentityConfirmed",
    "notQuranRecitation"
)

def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def read(p: Path):
    return json.loads(p.read_text("utf-8"))

def verify_production_contract(policy):
    if policy["voiceIdentity"]["voiceId"] != "DkU7j9uO4ZEtLD2iRZSH":
        raise RuntimeError("Wrong owner voice; zero credits spent")
    if policy["production"]["modelId"] != "eleven_v4" or policy["production"]["profile"] != "kids_story":
        raise RuntimeError("Wrong V4 profile; zero credits spent")
    if policy["production"]["effectiveLanguageIsolation"]["germanPronunciationDictionaryLocators"] != []:
        raise RuntimeError("Arabic master lexicon must not reach German speech")
    src = (ROOT / "cloudflare/video-studio/voice.js").read_text("utf-8")
    for marker in ('profile === "kids_story"', 'language_code: nativeArabicScriptOnly ? "ar" : "de"',
                   "const pronunciationDictionaryApplied = false"):
        if marker not in src:
            raise RuntimeError("Voice Studio implementation drift: " + marker)

def queue_from_source():
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "queue.json"
        subprocess.run(["node", "kids/tools/export-academy-208-v4-dedup-plan.cjs", str(p)],
                       cwd=ROOT, check=True, timeout=90, capture_output=True, text=True)
        result=read(p)
    if result["status"]!="NEVER_GENERATE_UNAPPROVED" or result["allowMassGeneration"] is not False:
        raise RuntimeError("Unapproved content queue changed; abort")
    return {x["id"]:x for x in result["phrases"]}

def prepared_batch(request, queue, policy):
    controls=policy["costControls"]
    if request["voiceId"]!=policy["voiceIdentity"]["voiceId"] or request["modelId"]!="eleven_v4":
        raise RuntimeError("Voice mismatch")
    if request["voiceSettingsProfile"]!="kids_story" or request["languageCode"]!="de":
        raise RuntimeError("Language/profile mismatch")
    if request["publicReleaseAllowed"] is not False:
        raise RuntimeError("Batch must be staging-only")
    items=request["items"]
    if len(items)>min(4, controls["maxClipsPerInvocation"]):
        raise RuntimeError("Too many clips; zero credits spent")
    selected=[]
    seen=set()
    used_chars=0
    for item in items:
        key=item.get("phraseId", "")
        row=queue.get(key)
        if not row or key in seen:
            raise RuntimeError("Missing/duplicate exact queue ID")
        seen.add(key)
        if any(item.get(flag) is not True for flag in TRUE_FIELDS):
            raise RuntimeError("Individual text/source/voice approval missing")
        if row["sourceApproved"] is not False or row["audioGenerationAllowed"] is not False:
            raise RuntimeError("Canonical review queue unexpectedly approved")
        if any(context["isDraft"] for context in row["contexts"]):
            raise RuntimeError("Draft 142 lessons remain academically locked")
        if row.get("languageCode") != "de" or row.get("globalArabicDictionaryApplied") is not False:
            raise RuntimeError("Cross-language dictionary risk")
        if row.get("pronunciationDictionaryLocators") != []:
            raise RuntimeError("Dictionary leakage")
        original=row["text"]
        if ARABIC.search(original):
            raise RuntimeError("Arabic script must use separate Fuṣḥā workflow")
        if item.get("canonicalTextSha256") != sha(original.encode("utf-8")):
            raise RuntimeError("Text changed since signed editorial approval")
        prepared=prepare_kids_voice_text(original)
        if ARABIC.search(prepared):
            raise RuntimeError("Prepared speech acquired mixed Arabic script")
        if not prepared.strip() or len(prepared)>1200:
            raise RuntimeError("Invalid voice-script length")
        used_chars+=len(prepared)
        if used_chars>min(1200,controls["maxPreparedCharactersPerInvocation"]):
            raise RuntimeError("Batch exceeds cost budget")
        selected.append((row,prepared))
    return selected,used_chars

def safe_existing(entries, row):
    entry=entries.get(row["id"])
    if not entry:
        return None
    if entry.get("voiceId")!=row["voiceId"] or entry.get("modelId")!="eleven_v4":
        raise RuntimeError("Cached voice/model identity mismatch")
    if entry.get("languageCode")!="de" or entry.get("approvedForPlayback") is not False:
        raise RuntimeError("Cached entry violates stage-only gate")
    source=entry.get("file","")
    filepath=STAGING / source
    if Path(source).name!=source or not filepath.is_file() or sha(filepath.read_bytes())!=entry.get("sha256"):
        raise RuntimeError("Cached audio byte hash mismatch; refusing duplicate billing")
    return entry

def fetch_staged_audio(text,secret):
    body=json.dumps({"text":text,"prepared":prepare_kids_voice_text(text),
                     "profile":"kids_story"},ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(BACKEND,data=body,method="POST",headers={
        "X-Admin-Secret":secret,
        "Origin":"https://dar-al-tawhid.de",
        "Referer":"https://dar-al-tawhid.de/voice-studio/",
        "Content-Type":"application/json","Accept":"application/json",
        "User-Agent":"DAR-Kids-Academy-208-V4-Manual-Staging/1"})
    # No automatic retries: network ambiguity could otherwise double-bill.
    with urllib.request.urlopen(req,timeout=150) as response:
        reply=json.load(response)
    audio=base64.b64decode(reply.get("audioBase64",""),validate=True)
    if len(audio)<1800:
        raise RuntimeError("Backend returned incomplete audio")
    return audio

def convert_to_m4a(mp3,destination):
    with tempfile.TemporaryDirectory() as d:
        source=Path(d)/"speech.mp3"
        source.write_bytes(mp3)
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                        "-i",str(source),"-ac","1","-ar","48000",
                        "-c:a","aac","-b:a","48k","-movflags","+faststart",
                        str(destination)],check=True,timeout=90)
    if destination.stat().st_size<1800:
        destination.unlink(missing_ok=True)
        raise RuntimeError("Invalid transcoded audio")
    duration=subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
                                      "-of","default=noprint_wrappers=1:nokey=1",str(destination)],
                                      text=True,timeout=15).strip()
    seconds=float(duration)
    if not (0.8<=seconds<=65):
        destination.unlink(missing_ok=True)
        raise RuntimeError("Unusable audio duration")
    return seconds

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--execute",action="store_true",
                        help="Make paid calls ONLY when the signed request contains approved texts")
    args=parser.parse_args()
    policy=read(POLICY)
    verify_production_contract(policy)
    request=read(REQUEST)
    queue=queue_from_source()
    selected,used_chars=prepared_batch(request,queue,policy)
    if not selected:
        print("BLOCKED: zero approved batch items; 0 paid calls, no public changes.")
        return
    entries=read(MANIFEST)["entries"] if MANIFEST.exists() else {}
    todo=[(r,p) for r,p in selected if safe_existing(entries,r) is None]
    print(f"Eligible review-only clips: {len(selected)}; cached: {len(selected)-len(todo)}; "
          f"new required: {len(todo)}; prepared characters: {used_chars}.")
    if not args.execute:
        print("DRY RUN: zero paid calls; explicit --execute and owner secret required.")
        return
    secret=os.environ.get("ADMIN_PUBLISH_SECRET","").strip()
    if not secret:
        raise RuntimeError("Missing owner backend secret; zero credits spent")
    STAGING.mkdir(parents=True,exist_ok=True)
    for row,_ in todo:
        output=STAGING/(row["id"]+".m4a")
        if output.exists():
            raise RuntimeError("Unregistered audio file exists; inspect before charging")
        encoded=fetch_staged_audio(row["text"],secret)
        length=convert_to_m4a(encoded,output)
        entry={"id":row["id"],"file":output.name,"sha256":sha(output.read_bytes()),
               "text":row["text"],"voiceId":row["voiceId"],"modelId":"eleven_v4",
               "voiceSettingsProfile":"kids_story","languageCode":"de",
               "pronunciationDictionaryLocators":[],"durationSeconds":round(length,3),
               "approvedForPlayback":False,"humanListeningApproved":False,
               "qaStatus":"technical-output-awaiting-human-listening"}
        entries[row["id"]]=entry
        staging={"schemaVersion":1,"stagingOnly":True,"productionManifestChanged":False,
                 "publicPlaybackApproved":False,"entries":entries}
        tmp=MANIFEST.with_suffix(".tmp")
        tmp.write_text(json.dumps(staging,ensure_ascii=False,indent=2)+"\n","utf-8")
        tmp.replace(MANIFEST)
        print("Staged one exact-phrase V4 clip: "+row["id"][:12])
    print("DONE: review-only staging. No public audio manifest or live app updated.")

if __name__=="__main__":
    main()
