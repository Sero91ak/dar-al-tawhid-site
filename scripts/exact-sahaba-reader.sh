#!/usr/bin/env bash
set -euo pipefail

VOICE_API="${VOICE_API:-https://dar-admin-publisher.sero91ak.workers.dev/voice-studio/api}"
IDS=(abu-bakr umar uthman ali talha zubayr abd-ar-rahman sad said abu-ubaydah)

python3 - <<'PY'
import json
from pathlib import Path
d=json.loads(Path("kids/data/mubashshirun-stories.json").read_text(encoding="utf-8"))
ids=["abu-bakr","umar","uthman","ali","talha","zubayr","abd-ar-rahman","sad","said","abu-ubaydah"]
by={str(x.get("id")):x for x in d.get("items",[])}
for sid in ids:
    item=by.get(sid)
    if not item: raise SystemExit("Missing story: "+sid)
    text=str((item.get("scripts") or {}).get("9-10") or (item.get("scripts") or {}).get("6-8") or (item.get("scripts") or {}).get("4-5") or "").strip()
    if not text: raise SystemExit("Missing master text: "+sid)
    Path("/tmp/"+sid+"-story.txt").write_text(text,encoding="utf-8")
PY

for sid in "${IDS[@]}"; do
  audio="kids/assets/mubashshirun-story-audio/$sid/master.mp3"
  story="/tmp/$sid-story.txt"
  result="/tmp/$sid-alignment.json"
  [ -s "$audio" ] || { echo "::error::Missing master audio: $sid"; exit 1; }
  ok=0

  if [ -n "${ADMIN_PUBLISH_SECRET:-}" ]; then
    for attempt in 1 2 3; do
      code="$(curl -sS -o "$result" -w '%{http_code}' \
        -X POST "$VOICE_API/align-story" \
        -H "Origin: https://dar-al-tawhid.de" \
        -H "Referer: https://dar-al-tawhid.de/voice-studio/" \
        -H "X-Admin-Secret: $ADMIN_PUBLISH_SECRET" \
        -H "Accept: application/json" \
        -F "file=@$audio;type=audio/mpeg" \
        --form-string "text=$(cat "$story")" || true)"
      if [ "$code" = "200" ] && python3 - "$result" <<'PY2'
import json,sys
d=json.load(open(sys.argv[1]))
sys.exit(0 if d.get("ok") and d.get("timings") and str(d.get("syncMode","")).startswith("elevenlabs-forced-alignment") else 1)
PY2
      then
        ok=1
        break
      fi
      sleep 2
    done
  fi

  if [ "$ok" != "1" ] && [ -n "${ELEVENLABS_API_KEY:-}" ]; then
    raw="/tmp/$sid-eleven-alignment-raw.json"
    code="$(curl -sS -o "$raw" -w '%{http_code}' \
      -X POST "https://api.elevenlabs.io/v1/forced-alignment" \
      -H "xi-api-key: $ELEVENLABS_API_KEY" \
      -F "file=@$audio;type=audio/mpeg" \
      --form-string "text=$(cat "$story")" || true)"
    if [ "$code" = "200" ]; then
      python3 - "$story" "$raw" "$result" <<'PY2'
import json,re,sys
from pathlib import Path
text=Path(sys.argv[1]).read_text(encoding="utf-8").strip()
raw=json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
chars=raw.get("characters") or []
paragraphs=[x.strip() for x in re.split(r"\n\s*\n",text) if x.strip()]
if not chars or not paragraphs: raise SystemExit("No forced alignment data")
joined="".join(str(x.get("text","")) for x in chars)
starts=[]; cursor=0
for p in paragraphs:
    probe=p[:min(80,len(p))]
    hit=joined.find(probe,cursor)
    if hit<0:
        ratio=max(0,text.find(p))/max(1,len(text))
        hit=max(0,min(len(chars)-1,round(ratio*(len(chars)-1))))
    while hit<len(chars)-1 and not str(chars[hit].get("text","")).strip():
        hit+=1
    cursor=max(cursor,hit)
    starts.append(max(0.0,float(chars[hit].get("start") or 0)))
duration=float((chars[-1] or {}).get("end") or 0)
timings=[]
for i,st in enumerate(starts):
    en=starts[i+1] if i+1<len(starts) else duration
    timings.append({"paragraphIndex":i,"start":round(st,3),"end":round(max(st,en),3)})
Path(sys.argv[3]).write_text(json.dumps({
    "ok":True,
    "timings":timings,
    "alignmentLoss":raw.get("loss"),
    "alignedWords":len(raw.get("words") or []),
    "alignedCharacters":len(chars),
    "syncMode":"elevenlabs-forced-alignment-v1"
},ensure_ascii=False),encoding="utf-8")
PY2
      ok=1
    fi
  fi

  [ "$ok" = "1" ] || { echo "::error::Exact forced alignment failed: $sid"; exit 1; }
  echo "$sid exact alignment ready"
done

python3 - <<'PY'
import json,re,time
from pathlib import Path
data_path=Path("kids/data/mubashshirun-stories.json")
d=json.loads(data_path.read_text(encoding="utf-8"))
ids=["abu-bakr","umar","uthman","ali","talha","zubayr","abd-ar-rahman","sad","said","abu-ubaydah"]
by={str(x.get("id")):x for x in d.get("items",[])}
stamp=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())

for sid in ids:
    item=by[sid]
    text=str((item.get("scripts") or {}).get("9-10") or (item.get("scripts") or {}).get("6-8") or (item.get("scripts") or {}).get("4-5") or "").strip()
    paragraphs=[x.strip() for x in re.split(r"\n\s*\n",text) if x.strip()]
    a=json.loads(Path("/tmp/"+sid+"-alignment.json").read_text(encoding="utf-8"))
    timings=a.get("timings") or []
    mode=str(a.get("syncMode") or "")
    if not mode.startswith("elevenlabs-forced-alignment"):
        raise SystemExit("Non-exact alignment: "+sid)
    if len(timings)!=len(paragraphs):
        raise SystemExit(f"Paragraph mismatch {sid}: {len(timings)} != {len(paragraphs)}")
    previous=-1.0
    for i,row in enumerate(timings):
        st=float(row.get("start",-1)); en=float(row.get("end",-1))
        if int(row.get("paragraphIndex",-1))!=i or st<previous or en<st:
            raise SystemExit("Bad timing sequence: "+sid)
        previous=st
    for age in ("4-5","6-8","9-10"):
        meta=item.setdefault("audio",{}).setdefault(age,{})
        if meta.get("status")!="ready" or not meta.get("url"):
            raise SystemExit(f"Audio not ready before alignment: {sid} {age}")
        meta["timings"]=timings
        meta["syncMode"]=mode
        meta["alignmentLoss"]=a.get("alignmentLoss")
        meta["alignedWords"]=a.get("alignedWords")
        meta["alignedCharacters"]=a.get("alignedCharacters")
        meta["alignmentGeneratedAt"]=stamp
        meta["technicalQaPassed"]=True
    vp=item.setdefault("voiceProduction",{})
    vp.update({
        "singleMasterAudio":True,
        "followReaderSync":"exact-forced-alignment",
        "followReaderSyncMode":mode,
        "followReaderParagraphs":len(timings),
        "followReaderSyncedAt":stamp
    })
    if sid!="abu-bakr":
        vp["masterVoice"]="Serhat Abu Malik – Master"
        vp["model"]="eleven_v4"

d["version"]=max(11,int(d.get("version") or 0)+1)
d["updatedAt"]=stamp
data_path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

kvp=Path("kids/version.json")
kv=json.loads(kvp.read_text(encoding="utf-8"))
visual=kv.setdefault("visualSystem",{})
visual["mubashshirunDataVersion"]=d["version"]
visual["mubashshirunAudioMastersReady"]=10
visual["mubashshirunTtsModel"]="eleven_v4"
visual["mubashshirunMasterVoice"]="Serhat Abu Malik – Master"
visual["mubashshirunReadAlongTiming"]="elevenlabs-forced-alignment-v1"
visual["mubashshirunExactAlignedMasters"]=10
kvp.write_text(json.dumps(kv,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

hubjs=Path("kids/story-hub.js")
js=hubjs.read_text(encoding="utf-8")
m=re.search(r"/kids/data/mubashshirun-stories\.json\?v=(\d+)",js)
cache_v=(int(m.group(1))+1) if m else 21
js=re.sub(r"/kids/data/mubashshirun-stories\.json\?v=\d+",f"/kids/data/mubashshirun-stories.json?v={cache_v}",js)
hubjs.write_text(js,encoding="utf-8")

hp=Path("kids/data/story-hub.json")
hub=json.loads(hp.read_text(encoding="utf-8"))
for src in hub.get("sources",[]):
    if str(src.get("id"))=="sahaba":
        src["dataUrl"]=f"/kids/data/mubashshirun-stories.json?v={cache_v}"
if isinstance(hub.get("version"),int): hub["version"]+=1
hub["updatedAt"]=stamp
hp.write_text(json.dumps(hub,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

print("Exact forced alignment installed for all 10 Sahaba · data",d["version"],"cache",cache_v)
PY

node scripts/kids-prophet-release-guard.js
