#!/usr/bin/env python3
"""Credit-free diagnostic: can existing creative Flow V4 recordings be retrieved via ElevenLabs history?
Read-only GET. No secrets, signed URLs, or generated files are ever logged/committed.
Designed for a *single* GitHub Actions probe; never synthesizes.
"""
import json
import os
import pathlib
import urllib.parse
import urllib.request
import urllib.error

ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-14-missing-real-v4-plan-v1.json"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
BASE="https://api.elevenlabs.io/v1/history"
API=os.getenv("ELEVENLABS_API_KEY","").strip()
def get(params):
    url=BASE+"?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={"xi-api-key":API,"Accept":"application/json","User-Agent":"DAR-KIDS-PAID-ORIGINAL-READONLY-PROBE/1"})
    try:
        with urllib.request.urlopen(req,timeout=25) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        print("ElevenLabs history returned HTTP",exc.code,"(no body or token logged)")
        return None
    except Exception as exc:
        print("ElevenLabs history GET failed:",type(exc).__name__)
        return None
def main():
    p=json.loads(SOURCE.read_text("utf8"))
    expected={str(v["generationId"]):v["text"] for k,v in p["segments"].items() if k!="ar-07"}
    if len(expected)!=20:raise RuntimeError("Source drift: expected exactly 20 paid originals")
    if not API:
        print("PROBE_BLOCKED: GitHub ELEVENLABS_API_KEY unavailable; zero cost.")
        return 3
    scenarios=[("flows",{"source":"Flows","model_id":MODEL,"voice_id":VOICE}),
               ("all",{"voice_id":VOICE})]
    for name,filter_ in scenarios:
        history=[]
        cursor=None
        ok=True
        for page in range(3):
            params={"page_size":1000,"sort_direction":"desc",**filter_}
            if cursor:params["start_after_history_item_id"]=cursor
            data=get(params)
            if data is None:ok=False;break
            rows=data.get("history",[])
            if not isinstance(rows,list):ok=False;break
            history.extend(rows)
            cursor=data.get("last_history_item_id")
            if not data.get("has_more") or not cursor:break
        by_id={str(x.get("history_item_id")):x for x in history}
        matched_ids=[gid for gid in expected if gid in by_id]
        exact_texts=[v for v in expected.values() if any(x.get("text")==v and x.get("model_id")==MODEL for x in history)]
        sources=sorted({str(x.get("source")) for x in history})
        models=sorted({str(x.get("model_id")) for x in history})
        print(json.dumps({"scope":name,"apiSucceeded":ok,"historyItems":len(history),
            "matchedByGenerationId":len(matched_ids),"matchedByExactPrompt":len(exact_texts),
            "sources":sources[:10],"models":models[:10],
            "retrievalPossible":bool(matched_ids or exact_texts),
            "newCreditsSpent":0},ensure_ascii=False))
        if matched_ids or exact_texts: return 0
    print("PROBE_RESULT: Creative Flow generation IDs NOT confirmed in public ElevenLabs history. Do NOT repeat paid generation.")
    return 2

def direct_probe():
    """Read-only GET against the official Flow generation retrieval endpoint."""
    p=json.loads(SOURCE.read_text("utf8"))
    if not API:
        print("DIRECT_PROBE_BLOCKED: no ELEVENLABS_API_KEY")
        return 3
    n=0
    for key in ("ar-01","de-02","de-20"):
        seg=p["segments"].get(key)
        if not seg or not seg.get("generationId"):continue
        gid=seg["generationId"]
        url="https://api.elevenlabs.io/v1/flows/text-to-speech/"+urllib.parse.quote(gid,safe="")
        req=urllib.request.Request(url,headers={
            "xi-api-key":API,"Accept":"application/json",
            "User-Agent":"DAR-KIDS-DIRECT-GET-PAID-V4-PROBE/1"})
        try:
            with urllib.request.urlopen(req,timeout=30) as res:
                data=json.load(res)
        except urllib.error.HTTPError as exc:
            print("DIRECT_GENERATION",key,"HTTP",exc.code,"(no response body logged)")
            continue
        except Exception as exc:
            print("DIRECT_GENERATION",key,"error",type(exc).__name__)
            continue
        # Print shape and URL availability, never signed content URLs.
        def paths(obj,prefix="",depth=0):
            if depth>5:return []
            if isinstance(obj,dict):
                out=[]
                for k,v in obj.items():
                    if isinstance(v,(dict,list)):
                        out+=paths(v,prefix+"."+k,depth+1)
                    elif isinstance(v,str) and v.startswith("https://"):
                        out.append(prefix+"."+k+"=URL("+
                            str(urllib.parse.urlsplit(v).hostname)+")")
                    elif k in ("status","id","model_id"):
                        out.append(prefix+"."+k+"="+str(v)[:40])
                return out
            if isinstance(obj,list):return sum((paths(v,prefix+"[]",depth+1) for v in obj[:3]),[])
            return []
        fields=paths(data)
        print("DIRECT_GENERATION",key,"keys=",list(data.keys()),"meta=",fields[:20])
        if any("=URL(" in x for x in fields):n+=1
    print("DIRECT_PROBE_URLS",n,"creditsCharged",0)
    return 0 if n else 2

if __name__=="__main__":
    import sys
    raise SystemExit(direct_probe() if "--direct" in sys.argv[1:] else main())
