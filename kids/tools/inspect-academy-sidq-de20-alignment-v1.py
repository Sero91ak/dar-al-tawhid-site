#!/usr/bin/env python3
"""Zero-credit GET check for already paid one-phrase/sentence clipping boundaries."""
import os, json, pathlib, urllib.request, urllib.parse
doc=json.loads(pathlib.Path("kids/data/academy-topic-batches/akhlaq-sidq-history-recovery-map-v1.json").read_text("utf8"))
rec=next(x for x in doc["originals"] if x["segment"]=="de-20")
token=os.environ["ELEVENLABS_API_KEY"].strip()
url="https://api.elevenlabs.io/v1/history/"+urllib.parse.quote(rec["historyItemId"],safe="")
with urllib.request.urlopen(urllib.request.Request(url,headers={"xi-api-key":token}),timeout=30) as resp:meta=json.load(resp)
al=meta.get("alignments")
def summarize(obj,depth=0):
    if depth>4:return "nested"
    if obj is None:return None
    if isinstance(obj,list):return {"type":"list","length":len(obj),"first":summarize(obj[0],depth+1) if obj else None}
    if isinstance(obj,dict):return {k:summarize(v,depth+1) for k,v in obj.items()}
    if isinstance(obj,str):return {"type":"str","chars":len(obj),"preview":obj[:6] if len(obj)<30 else None}
    return obj
print(json.dumps({"segment":"de-20","history_id_matches":meta.get("history_item_id")==rec["historyItemId"],
    "meta_text_available":bool(meta.get("text")),"alignment":summarize(al),
    "state":meta.get("state"),"date_unix":meta.get("date_unix"),
    "firstSentenceCharacterCount":len("Einen Fehler kann man unbeabsichtigt machen.")},ensure_ascii=False))
prefix="Einen Fehler kann man unbeabsichtigt machen."
norm=(al or {}).get("normalized_alignment") or (al or {}).get("alignment") or {}
letters=norm.get("characters") or []
ends=norm.get("character_end_times_seconds") or []
starts=norm.get("character_start_times_seconds") or []
joined="".join(letters)
if not joined.startswith(prefix) or len(ends)!=len(letters):
    raise RuntimeError("Exact original alignment prefix not present")
next_index=next((i for i in range(len(prefix),len(letters)) if not letters[i].isspace()),None)
print(json.dumps({"prefixExact":True,"prefixLastCharacter":letters[len(prefix)-1],
  "firstSentenceEndSeconds":ends[len(prefix)-1],
  "nextNonSpaceStartSeconds":starts[next_index] if next_index is not None else None,
  "nextNonSpaceCharacter":letters[next_index] if next_index is not None else None,
  "firstSentenceChars":len(prefix),
  "totalOriginalChars":len(letters),
  "prefixEndMax":max(ends[:len(prefix)]),
  "prefixStartMax":max(starts[:len(prefix)]),
  "lastTiming":[{"ch":letters[i],"start":starts[i],"end":ends[i]}
    for i in range(max(0,len(prefix)-18),len(prefix))]},ensure_ascii=False))
