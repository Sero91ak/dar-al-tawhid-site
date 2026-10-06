#!/usr/bin/env python3
import json, re, subprocess, time, unicodedata
from pathlib import Path
from rapidfuzz.fuzz import ratio
import numpy as np
from faster_whisper import WhisperModel

ROOT=Path(".")
DATA=ROOT/"kids/data/mubashshirun-stories.json"
VERSION=ROOT/"kids/version.json"
STORY_HUB_JS=ROOT/"kids/story-hub.js"
STORY_HUB_JSON=ROOT/"kids/data/story-hub.json"

TRANSLIT=str.maketrans({
    "ḥ":"h","Ḥ":"h","ṣ":"s","Ṣ":"s","ḍ":"d","Ḍ":"d","ṭ":"t","Ṭ":"t",
    "ẓ":"z","Ẓ":"z","ġ":"g","Ġ":"g","ḫ":"kh","Ḫ":"kh","š":"sh","Š":"sh",
    "ṯ":"th","Ṯ":"th","ḏ":"dh","Ḏ":"dh","ǧ":"j","Ǧ":"j","ā":"a","Ā":"a",
    "ī":"i","Ī":"i","ū":"u","Ū":"u","ʿ":"","ʾ":"","’":"","‘":"","`":"","´":""
})

def norm_word(w):
    w=str(w or "").strip().translate(TRANSLIT).lower()
    w=w.replace("الله","allah").replace("ﷺ","").replace("ﷻ","")
    w=unicodedata.normalize("NFKD",w)
    w="".join(ch for ch in w if not unicodedata.combining(ch))
    w=re.sub(r"[^a-z0-9äöü]+","",w)
    return w

def tokenize(text):
    return [x for x in (norm_word(w) for w in re.findall(r"\S+",text)) if x]

def score(a,b):
    if a==b:
        return 3.0
    if min(len(a),len(b))<=1:
        return -1.4
    s=ratio(a,b)/100.0
    if s>=0.92: return 2.3
    if s>=0.82: return 1.55
    if s>=0.70: return 0.55
    return -1.25

def align_tokens(script_tokens, heard_tokens):
    n,m=len(script_tokens),len(heard_tokens)
    gap=-0.82
    ptr=np.zeros((n+1,m+1),dtype=np.uint8)
    prev=np.arange(m+1,dtype=np.float32)*gap
    ptr[0,1:]=3
    for i in range(1,n+1):
        cur=np.empty(m+1,dtype=np.float32)
        cur[0]=i*gap
        ptr[i,0]=2
        a=script_tokens[i-1]
        for j in range(1,m+1):
            diag=prev[j-1]+score(a,heard_tokens[j-1])
            up=prev[j]+gap
            left=cur[j-1]+gap
            if diag>=up and diag>=left:
                cur[j]=diag; ptr[i,j]=1
            elif up>=left:
                cur[j]=up; ptr[i,j]=2
            else:
                cur[j]=left; ptr[i,j]=3
        prev=cur
    pairs=[]
    i,j=n,m
    while i>0 or j>0:
        d=int(ptr[i,j])
        if i>0 and j>0 and d==1:
            a,b=script_tokens[i-1],heard_tokens[j-1]
            sim=1.0 if a==b else ratio(a,b)/100.0
            if sim>=0.70:
                pairs.append((i-1,j-1,sim))
            i-=1; j-=1
        elif i>0 and (j==0 or d==2):
            i-=1
        elif j>0:
            j-=1
        else:
            break
    pairs.reverse()
    return pairs

def ffprobe_duration(path):
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",str(path)
    ],text=True).strip())

d=json.loads(DATA.read_text(encoding="utf-8"))
items=d.get("items") or []
if len(items)!=10:
    raise SystemExit(f"Expected 10 Sahaba, got {len(items)}")

model=WhisperModel("small",device="cpu",compute_type="int8",cpu_threads=4)
stamp=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
report=[]

for item in items:
    sid=str(item.get("id") or "")
    scripts=item.get("scripts") or {}
    text=str(scripts.get("9-10") or scripts.get("6-8") or scripts.get("4-5") or "").strip()
    if not sid or not text:
        raise SystemExit(f"Missing story/text: {sid}")
    paragraphs=[x.strip() for x in re.split(r"\n\s*\n",text) if x.strip()]
    if not paragraphs:
        raise SystemExit(f"No paragraphs: {sid}")

    meta=(item.get("audio") or {}).get("6-8") or (item.get("audio") or {}).get("4-5") or {}
    audio_rel=str(meta.get("url") or "").split("?",1)[0].lstrip("/")
    audio=ROOT/audio_rel
    if not audio.exists() or audio.stat().st_size<100000:
        raise SystemExit(f"Missing audio: {sid} -> {audio}")
    duration=ffprobe_duration(audio)

    segments,info=model.transcribe(
        str(audio),language="de",beam_size=5,word_timestamps=True,
        vad_filter=True,vad_parameters={"min_silence_duration_ms":180},
        condition_on_previous_text=True
    )
    heard=[]
    for seg in segments:
        for w in (seg.words or []):
            nw=norm_word(w.word)
            if not nw:
                continue
            heard.append({"w":nw,"start":float(w.start or 0.0),"end":float(w.end or 0.0),"raw":w.word})
    if len(heard)<30:
        raise SystemExit(f"Too few recognized words for {sid}: {len(heard)}")

    script_words=[]
    para_token_counts=[]
    for pidx,p in enumerate(paragraphs):
        toks=tokenize(p)
        para_token_counts.append(len(toks))
        for tok in toks:
            script_words.append({"w":tok,"p":pidx})
    a=[x["w"] for x in script_words]
    b=[x["w"] for x in heard]
    pairs=align_tokens(a,b)
    if not pairs:
        raise SystemExit(f"No token alignment for {sid}")

    by_para={i:[] for i in range(len(paragraphs))}
    sim_sum=0.0
    for si,hj,sim in pairs:
        pidx=script_words[si]["p"]
        by_para[pidx].append((si,hj,sim))
        sim_sum+=sim
    coverage=len(pairs)/max(1,len(script_words))
    mean_sim=sim_sum/max(1,len(pairs))

    starts=[None]*len(paragraphs)
    para_cov=[]
    for pidx in range(len(paragraphs)):
        rows=by_para[pidx]
        count=para_token_counts[pidx]
        cov=len(rows)/max(1,count)
        para_cov.append(cov)
        if rows:
            hj=min(x[1] for x in rows)
            starts[pidx]=max(0.0,heard[hj]["start"])

    for i,v in enumerate(starts):
        if v is not None:
            continue
        left_idx=next((k for k in range(i-1,-1,-1) if starts[k] is not None),None)
        right_idx=next((k for k in range(i+1,len(starts)) if starts[k] is not None),None)
        left=starts[left_idx] if left_idx is not None else 0.0
        right=starts[right_idx] if right_idx is not None else duration
        if left_idx is None:
            frac=(i+1)/(max(1,right_idx+1))
        elif right_idx is None:
            frac=(i-left_idx)/(max(1,len(starts)-left_idx))
        else:
            frac=(i-left_idx)/(right_idx-left_idx)
        starts[i]=left+(right-left)*frac

    for i in range(len(starts)):
        starts[i]=max(0.0,min(float(starts[i]),duration))
        if i and starts[i]<starts[i-1]:
            starts[i]=starts[i-1]

    long_bad=[]
    for i,(cnt,cov) in enumerate(zip(para_token_counts,para_cov)):
        if cnt>=8 and cov<0.28:
            long_bad.append((i,cnt,round(cov,3)))
    if coverage<0.56 or mean_sim<0.84 or long_bad:
        raise SystemExit(
            f"Alignment QA failed {sid}: coverage={coverage:.3f} meanSim={mean_sim:.3f} longBad={long_bad[:8]}"
        )

    timings=[]
    for i,st in enumerate(starts):
        en=starts[i+1] if i+1<len(starts) else duration
        en=max(st,min(float(en),duration))
        timings.append({
            "paragraphIndex":i,
            "start":round(st,3),
            "end":round(en,3),
            "confidence":round(para_cov[i],3)
        })

    for age in ("4-5","6-8","9-10"):
        m=item.setdefault("audio",{}).setdefault(age,{})
        if m.get("status")!="ready" or not m.get("url"):
            raise SystemExit(f"Audio not ready: {sid} {age}")
        m["timings"]=timings
        m["syncMode"]="whisper-word-alignment-v1"
        m["alignmentEngine"]="faster-whisper-small-int8"
        m["alignmentCoverage"]=round(coverage,4)
        m["alignmentMeanSimilarity"]=round(mean_sim,4)
        m["alignmentGeneratedAt"]=stamp
        m["technicalQaPassed"]=True
        m["masterAudio"]=True
        m["allAges"]=True

    vp=item.setdefault("voiceProduction",{})
    vp["singleMasterAudio"]=True
    vp["followReaderSync"]="audio-word-aligned"
    vp["followReaderSyncMode"]="whisper-word-alignment-v1"
    vp["followReaderParagraphs"]=len(timings)
    vp["followReaderCoverage"]=round(coverage,4)
    vp["followReaderSyncedAt"]=stamp

    report.append({
        "id":sid,"duration":round(duration,2),"paragraphs":len(paragraphs),
        "scriptWords":len(script_words),"heardWords":len(heard),"matched":len(pairs),
        "coverage":round(coverage,4),"meanSimilarity":round(mean_sim,4),
        "minParagraphCoverage":round(min(para_cov),4)
    })
    print(json.dumps(report[-1],ensure_ascii=False))

d["version"]=max(11,int(d.get("version") or 0)+1)
d["updatedAt"]=stamp
DATA.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

kv=json.loads(VERSION.read_text(encoding="utf-8"))
visual=kv.setdefault("visualSystem",{})
visual["mubashshirunDataVersion"]=d["version"]
visual["mubashshirunAudioMastersReady"]=10
visual["mubashshirunReadAlongTiming"]="whisper-word-alignment-v1"
visual["mubashshirunExactAlignedMasters"]=10
VERSION.write_text(json.dumps(kv,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

if STORY_HUB_JS.exists():
    s=STORY_HUB_JS.read_text(encoding="utf-8")
    matches=re.findall(r"/kids/data/mubashshirun-stories\.json\?v=(\d+)",s)
    cache_v=max([int(x) for x in matches],default=d["version"])+1
    s=re.sub(r"/kids/data/mubashshirun-stories\.json\?v=\d+",
             f"/kids/data/mubashshirun-stories.json?v={cache_v}",s)
    STORY_HUB_JS.write_text(s,encoding="utf-8")
else:
    cache_v=d["version"]

if STORY_HUB_JSON.exists():
    hub=json.loads(STORY_HUB_JSON.read_text(encoding="utf-8"))
    for src in hub.get("sources",[]):
        if str(src.get("id"))=="sahaba":
            src["dataUrl"]=f"/kids/data/mubashshirun-stories.json?v={cache_v}"
    if isinstance(hub.get("version"),int):
        hub["version"]+=1
    hub["updatedAt"]=stamp
    STORY_HUB_JSON.write_text(json.dumps(hub,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

Path("/tmp/sahaba-whisper-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("ALL_10_AUDIO_ALIGNED",json.dumps(report,ensure_ascii=False))
