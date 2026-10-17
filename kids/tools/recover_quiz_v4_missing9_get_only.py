#!/usr/bin/env python3
"""Zero-credit retrieval of ONLY missing, ALREADY PAID, V4 Flow originals.

Official ElevenLabs GET endpoints only; NO POST, NO speech generation, NO
upgrade, NO repeated charge. Signed URLs, keys, and audio payloads are never
printed or committed. If nine missing paid generations are directly readable,
download into a temporary inbox and let the canonical strict importer validate
model, voice, original ID, duration and SHA before commit.

Run in GitHub Actions with ELEVENLABS_API_KEY. The script may find API reads
plan-gated (402). That is a documented blocker, not a reason to resynthesize.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,tempfile,urllib.error,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MISSING=ROOT/"kids/data/quiz-v4-paid-flow-import-status.json"
PREPAID_NINE=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
PRIOR=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
REPORT=ROOT/"kids/data/quiz-v4-paid-flow-get-recovery-attempt.json"
API="https://api.elevenlabs.io"
HEADERS={"Accept":"application/json"}
MAX_AUDIO=5_500_000
EXPECTED="eleven_v4"

def load(p):return json.loads(p.read_text(encoding="utf-8"))
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def api_get(path,key,accept="application/json"):
    url=API+path
    req=urllib.request.Request(url,headers={"xi-api-key":key,"Accept":accept},method="GET")
    try:
        with urllib.request.urlopen(req,timeout=30) as res:
            data=res.read(MAX_AUDIO+1024)
            return res.status,data,res.headers.get("Content-Type","")
    except urllib.error.HTTPError as exc:
        return exc.code,b"",""
    except Exception:return 0,b"",""

def take_mp3(url):
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!="https" or parsed.netloc not in ("storage.googleapis.com","storage.cloud.google.com"):
        raise RuntimeError("Unexpected download origin; refusing storage request")
    with urllib.request.urlopen(urllib.request.Request(url,method="GET"),timeout=40) as r:
        data=r.read(MAX_AUDIO+1)
    if not 1800<len(data)<MAX_AUDIO or not(data[:3]==b"ID3" or data[:1]==b"\xff"):
        raise RuntimeError("Not a valid original MP3 response")
    return data

def must_be_mp3(path):
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
        "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
        capture_output=True,text=True)
    if p.returncode:raise RuntimeError("Original audio could not be decoded")
    m=json.loads(p.stdout)
    dur=float((m.get("format") or {}).get("duration") or 0)
    audio=[s for s in m.get("streams",[]) if s.get("codec_type")=="audio"]
    if len(audio)!=1 or audio[0].get("codec_name")!="mp3" or not 0.4<dur<180:
        raise RuntimeError("Invalid original MP3 duration or codec")
    return round(dur,3)


def locate_history_flow_items(key,needed):
    """Read-only bounded Flows history. Exact text is not identity proof.

    ElevenLabs Flow generation IDs are NOT necessarily history_item_ids.
    Only a provider history row whose own history_item_id or request_id
    explicitly equals the historical generation ID can authorize importing
    an MP3 under that original ID. Others are discovery hints only.
    """
    manifest=load(PREPAID_NINE)
    originals={x["generationId"]:x for x in manifest["items"]}
    if set(needed)-set(originals):
        raise RuntimeError("Unrecognized paid original in history matching")
    matches={gid:[] for gid in needed}
    diagnostic={"correctVoiceAndModelRows":0,"sourceFlowsRows":0,
                "rowsWithSpokenText":0,"rowsWithDialogue":0,
                "textMatchesIgnoringSourceFilter":0,
                "historyIdMatchesOldGeneration":0,
                "requestIdMatchesOldGeneration":0,
                "dialogueItemsWithText":0,"dialogueItemsWithExpectedVoice":0,
                "dialogueItemsWithExactOriginalText":0,
                "singleSpeakerDialogueOriginalMatches":0,
                "dialogueFieldNames":[]}
    statuses=[]
    inspected=0
    cursor=None
    seen=set()
    max_pages=5
    for page in range(max_pages):
        opts={"page_size":100,"source":"Flows","voice_id":manifest["items"][0]["voiceId"],
              "model_id":EXPECTED,"sort_direction":"desc"}
        if cursor:opts["start_after_history_item_id"]=cursor
        path="/v1/history?"+urllib.parse.urlencode(opts)
        code,data,ct=api_get(path,key)
        statuses.append(code)
        if code!=200:break
        try: response=json.loads(data.decode("utf-8"))
        except (ValueError,UnicodeError):break
        rows=response.get("history",[])
        if not isinstance(rows,list):break
        inspected+=len(rows)
        for row in rows:
            if not isinstance(row,dict):continue
            dialogue=row.get("dialogue")
            dialogue=dialogue if isinstance(dialogue,list) else []
            single=dialogue[0] if len(dialogue)==1 and isinstance(dialogue[0],dict) else None
            for voicepart in dialogue:
                if not isinstance(voicepart,dict):continue
                if isinstance(voicepart.get("text"),str) and voicepart["text"]:
                    diagnostic["dialogueItemsWithText"]+=1
                if voicepart.get("voice_id")==manifest["items"][0]["voiceId"]:
                    diagnostic["dialogueItemsWithExpectedVoice"]+=1
                if any(voicepart.get("text")==originals[g]["originalSpokenText"] for g in needed):
                    diagnostic["dialogueItemsWithExactOriginalText"]+=1
                diagnostic["dialogueFieldNames"]=sorted(
                    set(diagnostic["dialogueFieldNames"])|set(voicepart.keys()))
            if single and single.get("voice_id")==manifest["items"][0]["voiceId"] and any(
                single.get("text")==originals[g]["originalSpokenText"] for g in needed):
                diagnostic["singleSpeakerDialogueOriginalMatches"]+=1
            if row.get("model_id")==EXPECTED and row.get("voice_id")==manifest["items"][0]["voiceId"]:
                diagnostic["correctVoiceAndModelRows"]+=1
            if row.get("source")=="Flows":diagnostic["sourceFlowsRows"]+=1
            if isinstance(row.get("text"),str) and row["text"]:diagnostic["rowsWithSpokenText"]+=1
            if isinstance(row.get("dialogue"),list) and row["dialogue"]:diagnostic["rowsWithDialogue"]+=1
            if row.get("history_item_id") in needed:
                diagnostic["historyIdMatchesOldGeneration"]+=1
            if row.get("request_id") in needed:
                diagnostic["requestIdMatchesOldGeneration"]+=1
            if any(row.get("text")==originals[gid]["originalSpokenText"] for gid in needed):
                diagnostic["textMatchesIgnoringSourceFilter"]+=1
            # In the Flows history API, top-level text/voice_id are often
            # null when 'dialogue' is populated. A single exact voice/text
            # pair is a candidate; an unrelated dialogue is NOT.
            flat_ok=(row.get("model_id")==EXPECTED and
                     row.get("voice_id")==manifest["items"][0]["voiceId"])
            dialogue_ok=(single is not None and
                         single.get("voice_id")==manifest["items"][0]["voiceId"] and
                         row.get("model_id") in (None,EXPECTED))
            if row.get("source")!="Flows" or not (flat_ok or dialogue_ok):
                continue
            h_id=row.get("history_item_id")
            request=row.get("request_id")
            if not isinstance(h_id,str) or not h_id or h_id in seen:continue
            seen.add(h_id)
            for gid in needed:
                if (flat_ok and row.get("text")==originals[gid]["originalSpokenText"]) or (
                    dialogue_ok and single.get("text")==originals[gid]["originalSpokenText"]):
                    matches[gid].append({
                        "historyItemId":h_id,
                        "providerIdCrosslinked":h_id==gid or request==gid,
                        "generationId":gid})
        if not response.get("has_more"):break
        new_cursor=response.get("last_history_item_id")
        if not isinstance(new_cursor,str) or not new_cursor or new_cursor==cursor:break
        cursor=new_cursor
    # No auto-import just because a generated recording sounds plausible.
    # We require EXACT unique text, original voice/model AND provider-ID link.
    linked={}
    result={}
    for gid,items in matches.items():
        direct=[x for x in items if x["providerIdCrosslinked"]]
        if len(items)==1 and len(direct)==1:
            linked[gid]=direct[0]["historyItemId"]
        result[gid]={
            "exactTextAndVoiceHistoryMatches":len(items),
            "directProviderIdCrosslink":gid in linked,
            "needsOriginalMp3Export":gid not in linked
        }
    summary={
        "usedOnlyReadOnlyGET":True,
        "pagesInspected":len(statuses),
        "httpCodes":statuses,
        "historyRowsInspected":inspected,
        "historyPrivacySafeAggregateDiagnostics":diagnostic,
        "candidateExactTextMatches":sum(x["exactTextAndVoiceHistoryMatches"] for x in result.values()),
        "strongOriginalIdLinks":len(linked),
        "unlinkedOriginals":sum(v["needsOriginalMp3Export"] for v in result.values()),
        "noUnverifiedAudioAutolabelledAsOriginal":True,
        "perGeneration":result}
    return linked,summary

def main():
    state=load(MISSING)
    paid=load(PRIOR)
    reg=load(REGISTRY)
    if paid.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH" or paid.get("modelId")!=EXPECTED:
        raise RuntimeError("Original model/owner voice cannot be verified")
    original={r["generationId"] for q in paid["items"] for r in q.get("recordings") or []}
    recorded=set((reg.get("generationClips") or {}).keys())
    needed=sorted(original-recorded)
    if len(original)!=56 or any(not isinstance(x,str) or len(x)!=20 for x in needed):
        raise RuntimeError("The previous 56 paid IDs are inconsistent")
    if len(needed)>9:
        raise RuntimeError("Refusing broad unknown recovery: expected at most 9 missing originals")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    result={
       "schemaVersion":1,
       "scope":"TAWḤĪD KIDS remaining already-paid Eleven V4 original GET recovery",
       "previouslyPaidOriginals":56,
       "alreadyImportedOriginals":len(recorded),
       "missingBeforeGET":len(needed),
       "originalIdsAttempted":needed,
       "successfullyImportedOriginals":0,
       "statusPerGeneration":{},
       "modelId":EXPECTED,
       "voiceId":paid["voiceId"],
       "onlyGETRequestsUsed":True,
       "newSpeechSyntheses":0,
       "elevenLabsCreditsSpent":0,
       "apiKeySaved":False,
       "signedUrlsSaved":False,
       "publicReleaseAllowed":False,
    }
    if not key:
        result["problem"]="ELEVENLABS_API_KEY missing; no API request made"
        save(REPORT,result)
        print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)
        return
    if not needed:
        result["problem"]="All original paid MP3s already recovered"
        save(REPORT,result)
        print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)
        return
    # Unlike a Flow generationId, an ElevenLabs history_item_id identifies
    # an actual History audio resource. Search the official GET-only Flows
    # history first, and use it ONLY if provider IDs prove the crosslink.
    links,history_summary=locate_history_flow_items(key,needed)
    result["historyFlowSearch"]=history_summary
    with tempfile.TemporaryDirectory(prefix="kids-paid-v4-nine-") as folder:
        folder=Path(folder)
        for gid in needed:
            stat={"flowGetHTTP":None,"historyAudioHTTP":None,"importableMP3":False}
            result["statusPerGeneration"][gid]=stat
            code,data,ct=api_get(f"/v1/flows/text-to-speech/{gid}",key)
            stat["flowGetHTTP"]=code
            if code==200:
                try:
                    gen=json.loads(data.decode("utf-8"))
                    if gen.get("id")==gid and gen.get("status")=="completed" and gen.get("content_url"):
                        binary=take_mp3(gen["content_url"])
                        path=folder/(gid+".mp3")
                        path.write_bytes(binary)
                        stat["mp3DurationSec"]=must_be_mp3(path)
                        stat["importableMP3"]=True
                except (OSError,ValueError,RuntimeError,KeyError):
                    stat["flowAudioDownload"]="failed-keep-paid-original-untouched"
            if not stat["importableMP3"] and gid in links:
                # History entry is explicitly crosslinked by the provider's
                # request_id or its original generation ID, never text alone.
                hid=links[gid]
                hcode,hbin,hct=api_get(
                    "/v1/history/"+urllib.parse.quote(hid,safe="")+"/audio",
                    key,accept="audio/mpeg")
                stat["verifiedHistoryAudioHTTP"]=hcode
                if hcode==200:
                    try:
                        if not 1800<len(hbin)<MAX_AUDIO or not(
                             hbin[:3]==b"ID3" or hbin[:1]==bytes([255])):
                            raise ValueError("Unexpected MP3 for confirmed old generation")
                        path=folder/(gid+".mp3")
                        path.write_bytes(hbin)
                        stat["mp3DurationSec"]=must_be_mp3(path)
                        stat["importableMP3"]=True
                        stat["recoveredVia"]="linked-official-flows-history-GET"
                    except (ValueError,RuntimeError):
                        stat["linkedHistoryDownload"]="invalid-old-audio"
            if not stat["importableMP3"]:
                # GET on the documented ElevenLabs History audio route is
                # read-only. Flow generation IDs may not be history_item_ids;
                # if 404, never infer an original existed in this history.
                hist,hdata,hct=api_get(f"/v1/history/{gid}/audio",key,accept="audio/mpeg")
                stat["historyAudioHTTP"]=hist
                if hist==200:
                    try:
                        if not 1800<len(hdata)<MAX_AUDIO or not(
                                hdata[:3]==b"ID3" or hdata[:1]==b"\xff"):
                            raise ValueError("Unexpected original audio bytes")
                        path=folder/(gid+".mp3")
                        path.write_bytes(hdata)
                        stat["mp3DurationSec"]=must_be_mp3(path)
                        stat["importableMP3"]=True
                    except (ValueError,RuntimeError):
                        stat["historyAudioDownload"]="invalid-original-mp3"
        success=[x for x in needed if result["statusPerGeneration"][x]["importableMP3"]]
        if success:
            subprocess.run(["python3","kids/tools/import_quiz_v4_prepaid_flow_originals.py",
                            "--directory",str(folder)],cwd=ROOT,check=True)
            newreg=load(REGISTRY)
            for gid in success:
                if gid not in (newreg.get("generationClips") or {}):
                    raise RuntimeError("Original importer could not save verified generation "+gid)
            result["successfullyImportedOriginals"]=len(success)
    result["missingAfterAttempt"]=len(original-set((load(REGISTRY).get("generationClips") or {}).keys()))
    if result["missingAfterAttempt"]:
        result["nextStep"]="Recover signed original files through the connected ElevenLabs Flow account or authorized original MP3 export; do not resynthesize"
    else:
        result["nextStep"]="Recompose first150 question MP3s and perform full human listening QA"
    save(REPORT,result)
    print("KIDS_PREPAID_RECOVERY "+json.dumps(result,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
