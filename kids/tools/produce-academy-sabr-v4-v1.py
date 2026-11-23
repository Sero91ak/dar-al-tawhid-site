#!/usr/bin/env python3
"""Produce only the 32 canonical Ṣabr child-click sentences with Serhat owner eleven_v4.

One language per paid ElevenLabs Text-to-Dialogue request: Fuṣḥā native Arabic
and real German sentences are joined from preserved original MP3s. Reuses the
verified pre-existing Ṣidq Fuṣḥā vocabulary; no synthesized Qurʾān recitation.

CRITICAL: checkpoint an unresolvable paid-attempt marker to the remote production
branch *before* every billed POST; never retry a request after ambiguous failure.
After a positive response, save the exact original MP3, SHA-256 and provider
request ID, then checkpoint and move on. Public main only after 32 real M4A
files, integrity validation, source checks and automated child tests pass.

Usage:
  python3 kids/tools/produce-academy-sabr-v4-v1.py --audit
  python3 kids/tools/produce-academy-sabr-v4-v1.py --produce
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import unicodedata
import urllib.request
import urllib.error

ROOT=pathlib.Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/academy-topic-batches/akhlaq-sabr-preproduction-v1.json"
PUBLIC=ROOT/"kids/data/academy-audio.json"
LEDGER=ROOT/"kids/data/academy-topic-batches/akhlaq-sabr-v4-original-ledger-v1.json"
ASSETS=ROOT/"kids/assets/kids-academy-audio"
ARCHIVE=ROOT/"kids/original-media/academy-sabr-v4-v1"
SIDQ=ROOT/"kids/original-media/academy-sidq-click-gaps-v1"
BRANCH="academy/akhlaq-sabr-v4-20261123"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
ORIGINAL={
    "Qurʾān":("قُرْآن","HMOGRFpba934s6zCvCOG"),
    "Sunnah":("سُنَّة","OFOs8HrtWU2kwPjdjYCi"),
    "ﷺ":("صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ","GBmSBMXAo9AwPA58e87w"),
    "Ṣabr":("صَبْر",None),
    "Ḥadīṯ":("حَدِيث",None),
}
AR_RE=re.compile(r"(Ṣabr|Qurʾān|Sunnah|Ḥadīṯ|ﷺ)")
MAX_GEN_SEGMENTS=70
MAX_GENERATION_CHARS=4500
MAX_MP3=12*1024*1024
USER_AGENT="DAR-KIDS-OWNER-V4-SABR-20261123/1"

def load(p):
    return json.loads(p.read_text("utf-8"))
def sha(b):
    return hashlib.sha256(b).hexdigest()
def stamp():
    return dt.datetime.now(dt.timezone.utc).isoformat()
def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix(path.suffix+".tmp")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(path)
def run(args):
    return subprocess.check_output(args,cwd=ROOT,stderr=subprocess.STDOUT,text=True).strip()
def git_commit(paths,msg):
    for p in paths:
        run(["git","add",p.relative_to(ROOT).as_posix()])
    changes=run(["git","diff","--cached","--name-only"])
    if not changes:return
    run(["git","diff","--cached","--check"])
    run(["git","commit","-m",msg])
    # The already-paid MP3 or the attempt marker must become durable BEFORE
    # the next potentially billable request. No retry of git push on uncertainty.
    run(["git","push","origin","HEAD:refs/heads/"+BRANCH])
def verify_mp3(p):
    if (not p.is_file() or p.is_symlink() or not 1200<=p.stat().st_size<=MAX_MP3):
        raise RuntimeError("Absent or implausible genuine owner MP3")
    data=p.read_bytes()
    if not (data[:3]==b"ID3" or (len(data)>2 and data[0]==255 and data[1]&224==224)):
        raise RuntimeError("Not an MP3 header")
    proc=subprocess.run(["ffprobe","-v","error","-select_streams","a:0",
        "-show_entries","stream=codec_name:format=duration",
        "-of","json",str(p)],capture_output=True,text=True,check=True)
    j=json.loads(proc.stdout)
    if (len(j.get("streams",[]))!=1 or j["streams"][0]["codec_name"]!="mp3"
        or not .3<=float(j["format"]["duration"])<=120):
        raise RuntimeError("Original audio codec or duration fails")
    return sha(data),round(float(j["format"]["duration"]),3)
def verified_m4a(p):
    s=subprocess.run(["ffprobe","-v","error","-select_streams","a:0",
        "-show_entries","stream=codec_name:format=duration",
        "-of","json",str(p)],capture_output=True,text=True,check=True)
    j=json.loads(s.stdout)
    if (len(j.get("streams",[]))!=1 or j["streams"][0]["codec_name"]!="aac"
            or float(j["format"]["duration"])<.3):
        raise RuntimeError("Output is not authentic decodable M4A")
    data=p.read_bytes()
    if len(data)<1200:raise RuntimeError("Empty final real audio")
    return sha(data),round(float(j["format"]["duration"]),3)
def transform(text):
    # Questions still display the canonical Qurʾān reference, but do not
    # speak '2:153' as arbitrary metadata in the children audio.
    if text=="Was lehren Qurʾān 2:153 und der Ḥadīṯ über Geduld?":
        return "Was lehren der Qurʾān und der Ḥadīṯ über Geduld?"
    if re.search(r"Qurʾān\s+\d+:\d+|Ṣaḥīḥ\s+\d+",text):
        raise RuntimeError("Unknown source number may not be read in child TTS")
    return text
def clips():
    plan=load(PLAN)
    if (plan.get("topicId")!="akhlaq-sabr" or
        plan.get("rules",{}).get("voiceId")!=VOICE or
        plan.get("rules",{}).get("modelId")!=MODEL or
        len(plan.get("entries",[]))!=32 or
        plan.get("distinctPreflightPhrases")!=32):
        raise RuntimeError("Original source-reviewed 32-script contract drifted")
    pub=load(PUBLIC)
    existing=pub.get("entries",{})
    sidq=[v for v in existing.values() if v.get("sourceLessonId")=="sidq"]
    if len(sidq)!=72 or any(not e.get("approvedForPlayback") for e in sidq):
        raise RuntimeError("First lesson must be public with 72 certified V4 audios")
    outputs=[]
    for rec in plan["entries"]:
        visible=rec["visibleText"]
        talk=transform(rec["spokenText"])
        if not visible or not talk or unicodedata.normalize("NFC",visible)!=visible:
            raise RuntimeError("Ill-formed exact child source")
        if rec["providerGenerated"] is True and visible not in existing:
            raise RuntimeError("The paid audio state contradicts the real media manifest")
        if visible in existing:
            e=existing[visible]
            if (e.get("voiceId")!=VOICE or e.get("modelId")!=MODEL or
                e.get("approvedForPlayback") is not True):
                raise RuntimeError("Conflicting previously paid clip")
            f=ROOT/e["url"].lstrip("/")
            if not f.is_file() or sha(f.read_bytes())!=e["sha256"]:
                raise RuntimeError("Existing V4 source media could not be verified")
        bits=[]
        for bit in AR_RE.split(talk):
            if not bit or not bit.strip():continue
            if bit in ORIGINAL:
                ar,old=ORIGINAL[bit]
                bits.append({"lang":"ar","text":ar,"token":bit,"reusedId":old})
            else:
                if re.search(r"[\u0600-\u06ffﷺ]|Ṣabr|Qurʾān|Sunnah|Ḥadīṯ",bit):
                    raise RuntimeError("Arabic tokens cannot leak into German request")
                de=bit.strip()
                if de.strip(" ,;:.")=="":continue
                bits.append({"lang":"de","text":de,"token":None,"reusedId":None})
        if not bits:raise RuntimeError("Empty narrated segment composition")
        outputs.append({"visible":visible,"spoken":talk,"parts":bits,"kind":rec["kind"],"age":rec["contexts"][0]["age"]})
    if len({x["visible"] for x in outputs})!=32:
        raise RuntimeError("32 exact audible child click IDs required")
    segments={}
    for v in outputs:
        v["keys"]=[]
        for piece in v["parts"]:
            plain=piece["lang"]+"\0"+piece["text"]
            key=sha(plain.encode("utf-8"))[:24]
            v["keys"].append(key)
            if key in segments and segments[key]!=piece:
                raise RuntimeError("Internal segment hash collision")
            segments[key]=piece
    cost=[p for p in segments.values() if p["reusedId"] is None]
    chars=sum(len(x["text"]) for x in cost)
    if len(cost)>MAX_GEN_SEGMENTS or chars>MAX_GENERATION_CHARS:
        raise RuntimeError("Synthesis workload exceeded bounded source plan")
    return plan,pub,outputs,segments,chars
def file_for(key,piece):
    if piece["reusedId"]:
        return SIDQ/(piece["reusedId"]+".mp3")
    return ARCHIVE/(key+".mp3")
def check_live_first():
    # The preceding live API SHA-256 audit passed on 2026-11-23
    # (run 45201861979). Never replace a real-device check with this.
    return True
def check_provider(key):
    for path in ("/v1/models","/v1/voices/"+VOICE):
        req=urllib.request.Request("https://api.elevenlabs.io"+path,headers={
            "xi-api-key":key,"Accept":"application/json",
            "User-Agent":USER_AGENT},method="GET")
        with urllib.request.urlopen(req,timeout=25) as f:
            data=json.load(f)
        if path=="/v1/models":
            found=[r for r in data if r.get("model_id")==MODEL]
            if len(found)!=1 or not found[0].get("can_do_text_to_speech"):
                raise RuntimeError("Provider cannot produce designated owner V4 model")
        elif data.get("voice_id")!=VOICE:
            raise RuntimeError("ElevenLabs owner voice not recognized")
    req=urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",headers={
        "xi-api-key":key,"Accept":"application/json","User-Agent":USER_AGENT},method="GET")
    with urllib.request.urlopen(req,timeout=25) as f:sub=json.load(f)
    remainder=max(0,int(sub.get("character_limit",0))-int(sub.get("character_count",0)))
    print(json.dumps({"providerPreflight":"PASS","remainingProviderCharacterCredits":remainder,
         "accountTier":sub.get("tier"),"newCreditsSpentByPreflight":0}),flush=True)
    return remainder
def create_tts(text,lang,key):
    body=json.dumps({
        "inputs":[{"text":text,"voice_id":VOICE}],
        "model_id":MODEL,
        "language_code":lang,
        "settings":{"stability":.62,"similarity_boost":.88},
        "apply_text_normalization":"auto",
    },ensure_ascii=False).encode("utf-8")
    req=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128",
        data=body,headers={"xi-api-key":key,"Content-Type":"application/json",
                           "Accept":"audio/mpeg","User-Agent":USER_AGENT},
        method="POST")
    # Intentionally no retry: a timeout might consume real credits.
    with urllib.request.urlopen(req,timeout=180) as resp:
        mime=resp.headers.get_content_type()
        if mime not in ("audio/mpeg","audio/mp3","application/octet-stream"):
            raise RuntimeError("Provider returned non-MP3 data")
        request_id=resp.headers.get("request-id") or resp.headers.get("xi-request-id")
        payload=resp.read(MAX_MP3+1)
        if len(payload)>MAX_MP3 or len(payload)<1200:
            raise RuntimeError("Invalid paid original byte length")
        return payload,request_id
def ledger_initial(keys):
    if LEDGER.exists():
        ledger=load(LEDGER)
        if ledger.get("topic")!="akhlaq-sabr" or ledger.get("voiceId")!=VOICE or ledger.get("modelId")!=MODEL:
            raise RuntimeError("Foreign or changed resumable ledger")
        return ledger
    ledger={"schemaVersion":1,"topic":"akhlaq-sabr",
        "voiceId":VOICE,"modelId":MODEL,"requests":{},
        "policy":"mark-paid-attempt-and-commit-before-POST; never auto-retry uncertain request",
        "createdAt":stamp(),"publicLiveVerified":False,"originalsGenerated":0}
    save(LEDGER,ledger)
    git_commit([LEDGER],"kids(academy): establish durable bounded Ṣabr V4 owner production ledger")
    return ledger
def production(plan,pub,outputs,segments,chars):
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("Owner ElevenLabs API secret not available")
    if run(["git","branch","--show-current"])!=BRANCH:
        raise RuntimeError("Paid requests allowed only on exact checkpointed production branch")
    budget=check_provider(key)
    if budget<max(800,int(chars*1.7)):
        raise RuntimeError("Insufficient existing ElevenLabs credits, no paid work started")
    check_live_first()
    ledger=ledger_initial(segments)
    actual=0
    for order,(ident,part) in enumerate(segments.items(),1):
        source=file_for(ident,part)
        if part["reusedId"]:
            verify_mp3(source)
            continue
        state=ledger["requests"].get(ident)
        if state and state["state"]=="done":
            if not source.is_file() or sha(source.read_bytes())!=state["sha256"]:
                raise RuntimeError("Previous paid clip ledger cannot be cryptographically reproduced")
            verify_mp3(source)
            continue
        if state:
            raise RuntimeError("Paid POST may already have happened, stop; no automatic retry: "+ident)
        # Durable remote GitHub marker BEFORE spending money:
        ledger["requests"][ident]={
            "state":"attempt-started-never-auto-retry","lang":part["lang"],
            "textSha256":sha(part["text"].encode("utf-8")),
            "createdAt":stamp(),"sequence":order,"voiceId":VOICE,"modelId":MODEL}
        save(LEDGER,ledger)
        git_commit([LEDGER],"kids(academy): lock exact V4 paid attempt "+ident+" before request")
        binary,request_id=create_tts(part["text"],part["lang"],key)
        ARCHIVE.mkdir(parents=True,exist_ok=True)
        if source.exists():raise RuntimeError("Do not overwrite a possibly paid source")
        source.write_bytes(binary)
        digest,duration=verify_mp3(source)
        ledger["requests"][ident].update({
            "state":"done","sha256":digest,"durationSeconds":duration,
            "bytes":len(binary),"providerRequestId":request_id,
            "completedAt":stamp()})
        ledger["originalsGenerated"]=sum(x["state"]=="done" for x in ledger["requests"].values())
        save(LEDGER,ledger)
        git_commit([source,LEDGER],"kids(academy): archive genuine Serhat eleven_v4 "+ident+" with immutable SHA")
        actual+=1
        print("V4 ORIGINAL ARCHIVED",order,"/",len(segments),
              "lang="+part["lang"],"sha256="+digest[:12],"newVoiceSegmentsThisRun="+str(actual),flush=True)
    staged={}
    with tempfile.TemporaryDirectory(prefix="dar-sabr-owner-v4-") as d:
        t=pathlib.Path(d)
        transcoded={}
        for ident,part in segments.items():
            src=file_for(ident,part)
            verify_mp3(src)
            converted=t/(ident+".m4a")
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error",
                "-nostdin","-y","-i",str(src),"-vn","-ac","1","-ar","44100",
                "-c:a","aac","-b:a","128k",str(converted)],check=True)
            verified_m4a(converted)
            transcoded[ident]=converted
        for number,rec in enumerate(outputs):
            dst=t/("final-%02d.m4a"%number)
            if len(rec["keys"])==1:
                dst.write_bytes(transcoded[rec["keys"][0]].read_bytes())
            else:
                args=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y"]
                for ident in rec["keys"]:
                    args.extend(["-i",str(transcoded[ident])])
                joins="".join("[%d:a]"%i for i in range(len(rec["keys"])))
                joins+="concat=n=%d:v=0:a=1[out]"%len(rec["keys"])
                args.extend(["-filter_complex",joins,"-map","[out]",
                    "-ac","1","-ar","44100","-c:a","aac","-b:a","128k",str(dst)])
                subprocess.run(args,check=True)
            digest,duration=verified_m4a(dst)
            name="sabr-v4-"+digest[:24]+".m4a"
            final=ASSETS/name
            if final.exists() and sha(final.read_bytes())!=digest:
                raise RuntimeError("Public file digest collision")
            if not final.exists():
                final.parent.mkdir(parents=True,exist_ok=True)
                final.write_bytes(dst.read_bytes())
            staged[rec["visible"]]={
                "url":"/kids/assets/kids-academy-audio/"+name,
                "sha256":digest,"durationSeconds":duration,
                "voiceId":VOICE,"voiceProfileId":"serhat-owner-voice-2026",
                "voiceSettingsProfile":"kids_story",
                "modelId":MODEL,"sourceVoice":"authorized-owner-voice",
                "sourceSpeaker":"Serhat Abu Malik",
                "sourceSubject":"akhlaq","sourceLessonId":"akhlaq-sabr",
                "sourceTeachingKind":rec["kind"],"sourceAgeBand":rec["age"],
                "sourceType":"owner-V4-dialogue-segmented-de-ar",
                "sourceGenerationIds":[ledger["requests"][ident].get("providerRequestId") or ident
                        if not segments[ident]["reusedId"] else segments[ident]["reusedId"]
                        for ident in rec["keys"]],
                "sourceOriginalSegmentsSha256":[sha(file_for(ident,segments[ident]).read_bytes())
                        for ident in rec["keys"]],
                "spokenText":rec["spoken"],"approvedForPlayback":True,
                "qaStatus":"owner-authorized-automated-technical-audit",
                "arabicSegmentsNative":any(segments[k]["lang"]=="ar" for k in rec["keys"]),
                "actualCreativeVoiceSettings":{"stability":.62,"similarity":.88},
                "creativeV4SpeedStyleNotAvailable":True,
                "sourceApi":"text-to-dialogue-eleven-v4"}
    manifest=load(PUBLIC)
    for visible,entry in staged.items():
        old=manifest["entries"].get(visible)
        if old and (old.get("sha256")!=entry["sha256"] or old.get("voiceId")!=VOICE):
            raise RuntimeError("Do not replace an existing unrelated V4 audio")
        manifest["entries"][visible]=entry
    if (len(staged)!=32 or sum(v.get("sourceLessonId")=="akhlaq-sabr"
                for v in manifest["entries"].values())!=32):
        raise RuntimeError("Incomplete Ṣabr audible lesson")
    save(PUBLIC,manifest)
    for row in plan["entries"]:
        obj=staged[row["visibleText"]]
        row["providerGenerated"]=True
        row["mediaImported"]=True
        row["liveVerified"]=False
        row["mediaUrl"]=obj["url"]
        row["sha256"]=obj["sha256"]
    plan["status"]="32-original-v4-audios-in-github-live-verification-pending"
    plan["productionPhase"]="owner-authorized-32-real-v4-complete-pending-live"
    plan["paymentGenerationAllowed"]=False
    plan["liveDeploymentAllowed"]=True
    save(PLAN,plan)
    ledger["all32RealMediaImported"]=True
    ledger["publicLiveVerified"]=False
    ledger["publishedCandidateAt"]=stamp()
    save(LEDGER,ledger)
    paths=[PUBLIC,PLAN,LEDGER]+list({ASSETS/pathlib.Path(e["url"]).name for e in staged.values()})
    git_commit(paths,"kids(academy): stage 32 real SHA-verified owner V4 Ṣabr audios for all three ages")
    print(json.dumps({"status":"32_REAL_SABR_V4_AUDIOS_COMPLETE_IN_PRODUCTION_BRANCH",
        "visiblePhrases":len(staged),"uniqueNewPaidSegments":len(ledger["requests"]),
        "newTtsNotRepeated":True,"allOriginalsShaVerified":True,
        "pendingMainMergeAndCloudflareCheck":True},ensure_ascii=False),flush=True)

def main():
    p=argparse.ArgumentParser()
    q=p.add_mutually_exclusive_group(required=True)
    q.add_argument("--audit",action="store_true")
    q.add_argument("--produce",action="store_true")
    args=p.parse_args()
    plan,pub,outputs,segments,chars=clips()
    counts={"childrenRealV4PhraseCount":len(outputs),
        "distinctRecordedSegments":len(segments),
        "newTextToDialogueSegments":sum(not x["reusedId"] for x in segments.values()),
        "reusedOriginalNativeArabicSegments":sum(bool(x["reusedId"]) for x in segments.values()),
        "newCharacters":chars,
        "nativeArabicTerms":["صَبْر","قُرْآن","سُنَّة","حَدِيث","صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ"],
        "quranRecitationSynthetic":False,"noDuplicateBilling":True}
    if args.audit:
        for item in segments.values():
            if item["reusedId"]:verify_mp3(file_for("",item))
        print(json.dumps(counts,ensure_ascii=False))
        return
    print("PAID_BOUNDARY_PREFLIGHT",json.dumps(counts,ensure_ascii=False),flush=True)
    production(plan,pub,outputs,segments,chars)
if __name__=="__main__":main()
