#!/usr/bin/env python3
"""Recover a PREVIOUSLY ATTEMPTED V4 MP3 from ElevenLabs history; GET only.

No text-to-speech endpoint, generation tool, checkout of public app, or credit
spend. An exact historic text+voice+model+time match is required before a
provider-original audio GET. Ambiguous matches are never auto-imported.
--audit is completely offline. --recover reads an existing GitHub secret.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PREP=ROOT/".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
JOURNAL=ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json"
USAGE=ROOT/"kids/data/quiz-v4-older-stage1-usage.json"
RESULT=ROOT/"kids/data/quiz-v4-older-stage1-free-history-recovery.json"
AUDIO=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
API="https://api.elevenlabs.io/v1/history"

def get(path):return json.loads(path.read_text(encoding="utf-8"))
def sha_text(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()
def put(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    dest=path.with_suffix(path.suffix+".pending")
    dest.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    dest.replace(path)
def guard(cond,msg):
    if not cond:raise RuntimeError("V4_ORIGINAL_HISTORY_SAFETY: "+msg)

def targets():
    stages=get(PREP)
    reg=get(REG);ledger=get(LEDGER);journal=get(JOURNAL);usage=get(USAGE)
    guard(reg.get("modelId")==journal.get("modelId")==MODEL
          and reg.get("voiceId")==journal.get("voiceId")==VOICE
          and ledger.get("scope")=="CURATED_450_V4_PAID_LEDGER"
          and isinstance(ledger.get("rows"),list),
          "original provider model, master voice or paid ledger scope differs")
    guard(reg["live"] is False and ledger["live"] is False,
          "public/release state is not review-only")
    guard(usage.get("requestJournal")==journal,"write-ahead provider record and backup differ")
    original={x["spokenTextSHA256"]:x["spokenText"] for x in stages["originalTextRecordingQueue"]}
    guard(len(original)==65,"exact first 65 original V4 voices changed")
    saved={v["textSha256"] for v in reg["textClips"].values()}
    charged={r["textSha256"] for r in ledger["rows"]}
    waiting=[]
    for item in journal["entries"]:
        if item["status"]!="REQUEST_STARTED_UNCONFIRMED":continue
        digest=item["textSHA256"]
        guard(digest in original and digest not in saved and digest not in charged,
              "uncertain original exists in bill or registry; never duplicate")
        begun=datetime.fromisoformat(item["startedAt"].replace("Z","+00:00"))
        guard(begun.tzinfo is not None,"unknown time of already paid POST")
        waiting.append((digest,original[digest],item,int(begun.timestamp())))
    guard(len(waiting)==len({a[0] for a in waiting}),"uncertain request duplicated")
    return reg,ledger,journal,usage,waiting

def history(key,epoch):
    # Strictly narrow the history scan around the recorded old provider call:
    # avoid accidentally using an identical voice/text from another date.
    values={"source":"TTS","model_id":MODEL,"voice_id":VOICE,
            "date_after_unix":str(epoch-120),"date_before_unix":str(epoch+1200),
            "page_size":"100","sort_direction":"desc"}
    items=[];cursor=None
    for _ in range(5):
        query=dict(values)
        if cursor:query["start_after_history_item_id"]=cursor
        endpoint=API+"?"+urllib.parse.urlencode(query)
        request=urllib.request.Request(endpoint,headers={
            "xi-api-key":key,"Accept":"application/json",
            "User-Agent":"TAWHID-KIDS-GENUINE-V4-RECOVERY/1.0"},method="GET")
        with urllib.request.urlopen(request,timeout=35) as response:
            guard(response.status==200,"history HTTP response not 200")
            data=json.loads(response.read(2500000).decode("utf-8"))
        rows=data.get("history")
        guard(isinstance(rows,list),"provider history not JSON list")
        items.extend(rows)
        if not data.get("has_more"):break
        cursor=data.get("last_history_item_id")
        guard(isinstance(cursor,str) and cursor,"history pagination ambiguous")
    return items

def matching(items,text,epoch):
    out=[]
    for row in items:
        if (row.get("text")!=text or row.get("model_id")!=MODEL
            or row.get("voice_id")!=VOICE or row.get("source")!="TTS"):continue
        date=row.get("date_unix")
        hid=row.get("history_item_id")
        if (not isinstance(date,int) or abs(date-epoch)>1200 or
            not isinstance(hid,str) or not hid):continue
        out.append(row)
    return out

def download(key,history_id):
    # No POST, no synthesis, no retry: official stored history audio GET.
    guard(isinstance(history_id,str) and 1<=len(history_id)<=128
          and history_id.isalnum(),"invalid provider history ID")
    request=urllib.request.Request(API+"/"+history_id+"/audio",headers={
        "xi-api-key":key,"Accept":"audio/mpeg",
        "User-Agent":"TAWHID-KIDS-GENUINE-V4-RECOVERY/1.0"},method="GET")
    with urllib.request.urlopen(request,timeout=50) as response:
        guard(response.status==200,"history audio download failed")
        audio=response.read(2000001)
        guard(1800<len(audio)<2000000 and
              (audio[:3]==b"ID3" or audio[:1]==b"\xff"),"download not real MP3 bytes")
        return audio

def verify_mp3(file):
    r=subprocess.run(["ffprobe","-v","error","-show_entries",
        "format=duration:stream=codec_name,codec_type","-of","json",str(file)],
        capture_output=True,text=True,check=True,timeout=25)
    info=json.loads(r.stdout)
    audio=[x for x in info.get("streams",[]) if x.get("codec_type")=="audio"]
    seconds=float(info.get("format",{}).get("duration") or 0)
    guard(len(audio)==1 and audio[0].get("codec_name")=="mp3" and 0.5<seconds<40,
          "recovered original failed MP3 technical check")
    return seconds

def recover():
    reg,ledger,journal,usage,waiting=targets()
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    report={
        "scope":"KIDS_V4_UNCERTAIN_PAID_AUDIO_HISTORY_RECOVERY_ONLY",
        "modelId":MODEL,"voiceId":VOICE,"reviewOnly":True,
        "uncertainOriginalsBefore":len(waiting),"successfulAuthenticHistoryImports":0,
        "newSynthesisCalls":0,"newSpeechCreditsSpent":0,"humanListeningApproved":False,
        "publicReleaseEnabled":False,"items":[]}
    if not key:
        report["result"]="NO_PROVIDER_CREDENTIAL_AVAILABLE"
        put(RESULT,report)
        return report
    for digest,text,entry,epoch in waiting:
        record={"spokenTextSHA256":digest,"state":"UNRESOLVED"}
        try:
            rows=matching(history(key,epoch),text,epoch)
            record["exactProviderHistoryMatches"]=len(rows)
            if len(rows)!=1:
                record["state"]="HISTORY_AMBIGUOUS" if rows else "NO_MATCHING_HISTORY_ITEM"
            else:
                item=rows[0]
                hid=item["history_item_id"]
                original=download(key,hid)
                AUDIO.mkdir(parents=True,exist_ok=True)
                digest_name=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
                path=AUDIO/(digest_name[:32]+".mp3")
                guard(not path.exists(),"original MP3 file already exists; manual reconcile first")
                with tempfile.NamedTemporaryFile(prefix="v4-history-",suffix=".mp3",
                     dir=AUDIO,delete=False) as temp:
                    temp.write(original)
                    temp_path=Path(temp.name)
                try:
                    duration=verify_mp3(temp_path)
                    guard(digest not in {v["textSha256"] for v in reg["textClips"].values()},
                          "text already present in register")
                    guard(digest not in {r["textSha256"] for r in ledger["rows"]},
                          "text already charged in ledger")
                    temp_path.replace(path)
                finally:
                    if temp_path.exists():temp_path.unlink()
                filehash=hashlib.sha256(original).hexdigest()
                request_id=item.get("request_id")
                reg["textClips"][text]={
                    "url":"/"+str(path.relative_to(ROOT)),
                    "sha256":filehash,"textSha256":digest,"bytes":len(original),
                    "voiceId":VOICE,"modelId":MODEL,
                    "audioListeningApproved":False,
                    "qaApproval":"pending-human-auditory-review",
                    "status":"recovered-earlier-v4-original-not-live",
                    "source":"official-elevenlabs-original-history-audio-GET",
                    "providerRequestId":request_id,"historyItemId":hid}
                ledger["rows"].append({
                    "batchId":BATCH,"text":text,"textSha256":digest,
                    "estimatedCreditsAtObservedRate":0,
                    "exactBilledCredits":None,"mp3Sha256":filehash,
                    "providerRequestId":request_id,"historyItemId":hid,
                    "createdAt":datetime.now(timezone.utc).isoformat(),
                    "note":"Previously attempted provider MP3 recovered via official history GET: NO NEW TTS"})
                entry.update(status="ORIGINAL_MP3_SAVED",mp3SHA256=filehash,
                             providerRequestId=request_id,historyItemId=hid)
                usage["requestJournal"]=journal
                # Preserve each verified original immediately. These files are
                # also included in the runner's if:always() recovery artifact.
                put(REG,reg);put(LEDGER,ledger)
                put(JOURNAL,journal);put(USAGE,usage)
                record.update(state="ORIGINAL_RECOVERED",historyItemId=hid,
                              mp3SHA256=filehash,realMP3Bytes=len(original),
                              durationSeconds=round(duration,2))
                report["successfulAuthenticHistoryImports"]+=1
        except urllib.error.HTTPError as err:
            record["state"]="PROVIDER_HTTP_"+str(err.code)
        except (urllib.error.URLError,TimeoutError):
            record["state"]="PROVIDER_UNREACHABLE"
        except Exception as err:
            # Never conceal a local integrity failure as a recoverable 402.
            record["state"]="SAFETY_BLOCKED"
            record["reasonCode"]=type(err).__name__
            report["items"].append(record)
            put(RESULT,report)
            raise
        report["items"].append(record)
        put(RESULT,report)
    report["result"]="FINISHED_READ_ONLY_HISTORY_RECOVERY"
    put(RESULT,report)
    return report

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--recover",action="store_true",
                        help="Get original history audio only; never submit text to TTS.")
    args=parser.parse_args()
    _,_,_,_,waiting=targets()
    if args.recover:summary=recover()
    else:
        summary={"scope":"KIDS_V4_HISTORY_GET_OFFLINE_PREFLIGHT",
                 "originalsWithUnconfirmedPaidRequest":len(waiting),
                 "newSynthesisCalls":0,"newSpeechCreditsSpent":0,
                 "publicReleaseEnabled":False}
    print("KIDS_V4_UNCERTAIN_PAID_HISTORY "+
          json.dumps(summary,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
