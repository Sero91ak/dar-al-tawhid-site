#!/usr/bin/env python3
"""GET-only metadata diagnostic for already paid V4 original recordings.
Zero synthesis; no signed links or user-authored unrelated text printed.
"""
import json, os, pathlib, urllib.parse, urllib.request, urllib.error
SOURCE=pathlib.Path("kids/data/academy-topic-batches/akhlaq-sidq-14-missing-real-v4-plan-v1.json")
p=json.loads(SOURCE.read_text("utf8"))
expected={v["generationId"]:v["text"] for k,v in p["segments"].items() if k!="ar-07"}
key=os.getenv("ELEVENLABS_API_KEY","").strip()
if not key:raise SystemExit("API secret missing")
args={"page_size":1000,"source":"Flows","voice_id":"DkU7j9uO4ZEtLD2iRZSH","model_id":"eleven_v4"}
request=urllib.request.Request("https://api.elevenlabs.io/v1/history?"+urllib.parse.urlencode(args),headers={"xi-api-key":key,"Accept":"application/json"})
with urllib.request.urlopen(request,timeout=30) as r:data=json.load(r)
rows=data.get("history") or []
gen_ids=set(expected)
matched_fields={field:sum(1 for row in rows if str(row.get(field,"")) in gen_ids) for field in ("history_item_id","request_id","id","generation_id")}
has_text=sum(bool(row.get("text")) for row in rows)
contains_full=sum(any(str(row.get("text","")).strip()==text for text in expected.values()) for row in rows)
contains_terms=sum(any(term in str(row.get("text","")).lower() for term in ("ṣidq","صِدْق","wahrheit","sunnah")) for row in rows)
dates=[int(row.get("date_unix") or 0) for row in rows]
print(json.dumps({"historyItems":len(rows),"hasText":has_text,"containsExactTarget":contains_full,
"containsRelatedVocabulary":contains_terms,"genIdFieldMatches":matched_fields,
"dateMin":min(dates) if dates else None,"dateMax":max(dates) if dates else None,
"firstRowsShapes":[{"fieldNames":sorted(row.keys()),"textCharacters":len(str(row.get("text") or "")),
"textIsNull":row.get("text") is None,"model":row.get("model_id"),
"source":row.get("source")} for row in rows[:3]]},ensure_ascii=False))
# Confirm the read-only authorized content endpoint can return real media.
if rows:
    id=str(rows[0].get("history_item_id") or "")
    u="https://api.elevenlabs.io/v1/history/"+urllib.parse.quote(id,safe="")+"/audio"
    r=urllib.request.Request(u,headers={"xi-api-key":key,"Accept":"audio/mpeg"})
    try:
        with urllib.request.urlopen(r,timeout=20) as res:
            sample=res.read(20)
            print("HISTORY_AUDIO_CHECK",json.dumps({"http":res.status,"mime":res.headers.get("Content-Type"),"firstBytesAreMp3":sample.startswith(b"ID3") or (sample[:1]==b"\\xff"),"newCredits":0}))
    except urllib.error.HTTPError as exc:
        print("HISTORY_AUDIO_CHECK",json.dumps({"http":exc.code,"newCredits":0}))
