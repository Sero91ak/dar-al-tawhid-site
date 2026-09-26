#!/usr/bin/env python3
from __future__ import annotations
import concurrent.futures, difflib, gc, hashlib, importlib.util, json, os, platform, re, shutil, subprocess, threading, time, traceback, unicodedata, urllib.request, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

# Apple-Silicon: unsupported MPS ops dürfen auf CPU zurückfallen statt den Render abzubrechen.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

APP_HOME=Path(os.environ.get("DAR_VOICE_APP_HOME",str(Path.home()/"Applications"/"DAR-Voice-Studio"))).expanduser()
PRON=APP_HOME/"pronunciation-rules.json"
PROFILE=APP_HOME/"voice-production-profile.json"
VOICE_HOME=Path.home()/"SerhatVoice"

def first_existing(paths):
    for p in paths:
        if p and Path(p).expanduser().exists():
            return Path(p).expanduser()
    return Path(paths[-1]).expanduser() if paths else Path("")

_ref_env=os.environ.get("SERHAT_VOICE_REF")
REF_DE=first_existing([
    _ref_env,
    VOICE_HOME/"Serhat_Adobe_MASTER.wav",
    VOICE_HOME/"Serhat_FINAL_REF.wav",
])

_ar_ref_env=os.environ.get("SERHAT_VOICE_REF_AR")
_ar_master=VOICE_HOME/"Serhat_AR_MASTER.wav"
REF_AR=first_existing([_ar_ref_env,_ar_master,REF_DE])
ARABIC_DEDICATED_REFERENCE=REF_AR.exists() and REF_DE.exists() and REF_AR.resolve()!=REF_DE.resolve()

# Backward-compatible name used by older status/error paths.
REF=REF_DE

HOST="127.0.0.1"
PORT=8787
OUTPUT=VOICE_HOME/"VoiceStudioOutput"
OUTPUT.mkdir(parents=True,exist_ok=True)
MASTER_AUDIO_DIR=VOICE_HOME/"MasterPronunciations"
PENDING_AUDIO_DIR=MASTER_AUDIO_DIR/"pending"
MASTER_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
PENDING_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
MASTER_AUDIO_MANIFEST=MASTER_AUDIO_DIR/"manifest.json"
LEARNING_HOME=VOICE_HOME/"PronunciationLearning"
LEARNING_PENDING_DIR=LEARNING_HOME/"pending"
USER_OVERRIDES_FILE=LEARNING_HOME/"user-overrides.json"
ONLINE_LIBRARY_CACHE=LEARNING_HOME/"online-library.json"
LEARNING_LOG=LEARNING_HOME/"learning-log.jsonl"
RENDER_CACHE_DIR=VOICE_HOME/"RenderCache"/"v3"
LEARNING_HOME.mkdir(parents=True,exist_ok=True)
LEARNING_PENDING_DIR.mkdir(parents=True,exist_ok=True)
RENDER_CACHE_DIR.mkdir(parents=True,exist_ok=True)
ONLINE_LIBRARY_URL=os.environ.get(
    "DAR_VOICE_ONLINE_LIBRARY_URL",
    "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/data/pronunciation/pronunciation-rules.json"
)
LEARNING_LOCK=threading.Lock()
LEARNING_PREVIEWS={}

def load_json_file(path:Path,default):
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print("[DĀR Voice] JSON load warning",path,e,flush=True)
        # Ein beschädigter, reproduzierbarer Online-Cache wird automatisch
        # quarantänisiert. Persönliche User-Overrides werden niemals gelöscht.
        try:
            if path==ONLINE_LIBRARY_CACHE and path.exists():
                stamp=time.strftime("%Y%m%d-%H%M%S")
                bad=path.with_name(path.stem+".corrupt-"+stamp+path.suffix)
                os.replace(path,bad)
                print("[DĀR Voice] defekten Online-Cache verschoben nach",bad,flush=True)
        except Exception as move_error:
            print("[DĀR Voice] cache quarantine warning",move_error,flush=True)
    return default

def atomic_write_json(path:Path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    # Prozess-eigene Tempdatei verhindert Cache-Kollisionen bei parallelen Starts.
    tmp=path.with_name(path.name+f".tmp.{os.getpid()}.{uuid.uuid4().hex[:8]}")
    try:
        tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
        os.replace(tmp,path)
    finally:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass

def normalize_lookup(value:str):
    text=unicodedata.normalize("NFKD",str(value or "").casefold())
    text="".join(ch for ch in text if not unicodedata.combining(ch))
    text=text.replace("ʿ","").replace("ʾ","").replace("’","").replace("'","")
    text=text.replace("š","sh").replace("ǧ","j").replace("ḏ","dh").replace("ṯ","th")
    text=re.sub(r"[^a-z0-9\\u0600-\\u06ff]+"," ",text)
    return re.sub(r"\\s+"," ",text).strip()

def append_learning_log(event:str,**payload):
    record={"at":time.strftime("%Y-%m-%dT%H:%M:%S%z"),"event":event,**payload}
    try:
        with LEARNING_LOG.open("a",encoding="utf-8") as fh:
            fh.write(json.dumps(record,ensure_ascii=False)+"\\n")
    except Exception as e:
        print("[DĀR Voice] learning log warning",e,flush=True)

def validate_online_library(data):
    rules=(data or {}).get("rules") or []
    if len(rules)<1000:
        raise ValueError("Online-Wortschatz ist unvollständig.")
    good=[]
    for r in rules:
        needle=str(r.get("string_to_replace","")).strip()
        tts=str(r.get("tts_text","")).strip()
        if not needle or not tts:
            continue
        if not any("\u0600" <= ch <= "\u06ff" for ch in tts):
            continue
        good.append(r)
    if len(good)<1000:
        raise ValueError("Online-Wortschatz enthält zu wenige gültige arabische Sprechformen.")
    return good

BASE_LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
BASE_RULES=list(BASE_LIB.get("rules",[]))
USER_OVERRIDE_DATA=load_json_file(USER_OVERRIDES_FILE,{"schemaVersion":1,"rules":[]})
ONLINE_LIB=load_json_file(ONLINE_LIBRARY_CACHE,{"schemaVersion":1,"rules":[],"syncedAt":None})
ONLINE_RULES=list((ONLINE_LIB or {}).get("rules") or [])
HONORIFIC_KEYS={"salawat_prophet","radiyallahu_anhu","radiyallahu_anha","radiyallahu_anhuma","radiyallahu_anhum"}

PROSODY_MODES=(VOICE_PROFILE.get("prosody") or {}).get("modes",{})
CONTEXT_CONFIG=VOICE_PROFILE.get("contextDetection") or {}
QA_CONFIG=VOICE_PROFILE.get("qualityAssurance") or {}
CONTINUITY_CONFIG=VOICE_PROFILE.get("continuity") or {}

LIB={}
RULES=[]
MASTER_TTS=set()
AUDIO_LOCK_BY_TTS={}
AUDIO_LOCK_LABELS={}
AUDIO_LOCK_FORMS=[]
HONORIFIC_TTS_BY_KEY={}
HONORIFIC_RULE_BY_KEY={}
HONORIFIC_SOURCE_FORMS={}

def rebuild_runtime_rules():
    global LIB,RULES,MASTER_TTS,AUDIO_LOCK_BY_TTS,AUDIO_LOCK_LABELS,AUDIO_LOCK_FORMS
    global HONORIFIC_TTS_BY_KEY,HONORIFIC_RULE_BY_KEY,HONORIFIC_SOURCE_FORMS
    user_rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    # User-bestätigte Regeln stehen zuerst und überschreiben bei gleicher Schreibweise die Basisbibliothek.
    RULES=sorted(user_rules+BASE_RULES,key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
    LIB=dict(BASE_LIB)
    LIB["rules"]=RULES
    counts=dict(BASE_LIB.get("counts") or {})
    counts["rules"]=len(RULES)
    counts["userLearnedRules"]=len(user_rules)
    counts["onlineSearchRules"]=len(ONLINE_RULES)
    LIB["counts"]=counts
    MASTER_TTS={str(r.get("tts_text","")) for r in RULES if r.get("voice_lock")=="MASTER" and r.get("tts_text")}
    AUDIO_LOCK_BY_TTS={}
    for r in RULES:
        tts=str(r.get("tts_text",""))
        key=str(r.get("audio_lock_key",""))
        # RULES ist absichtlich user-first sortiert: der jüngste bestätigte Lernstand gewinnt.
        if tts and key and tts not in AUDIO_LOCK_BY_TTS:
            AUDIO_LOCK_BY_TTS[tts]=key
    AUDIO_LOCK_LABELS={}
    for r in RULES:
        key=str(r.get("audio_lock_key",""))
        if key and key not in AUDIO_LOCK_LABELS:
            AUDIO_LOCK_LABELS[key]=str(r.get("canonical") or r.get("string_to_replace") or key)
    AUDIO_LOCK_FORMS=sorted(AUDIO_LOCK_BY_TTS,key=len,reverse=True)
    HONORIFIC_TTS_BY_KEY={}
    HONORIFIC_RULE_BY_KEY={}
    HONORIFIC_SOURCE_FORMS={key:[] for key in HONORIFIC_KEYS}
    for r in RULES:
        key=str(r.get("audio_lock_key",""))
        if key in HONORIFIC_KEYS:
            tts=str(r.get("tts_text",""))
            src=str(r.get("string_to_replace",""))
            if tts and key not in HONORIFIC_TTS_BY_KEY:
                HONORIFIC_TTS_BY_KEY[key]=tts
                HONORIFIC_RULE_BY_KEY[key]=r
            if src:
                HONORIFIC_SOURCE_FORMS.setdefault(key,[]).append(src)
    for key in list(HONORIFIC_SOURCE_FORMS):
        HONORIFIC_SOURCE_FORMS[key]=sorted(set(HONORIFIC_SOURCE_FORMS[key]),key=len,reverse=True)

rebuild_runtime_rules()

MODEL=None
MODEL_DEVICE=None
MODEL_LOCK=threading.Lock()
RENDER_LOCK=threading.Lock()
STATUS_LOCK=threading.Lock()
MODEL_ACTIVE_REFERENCE=None
MODEL_REFERENCE_PREPARES=0
MODEL_REFERENCE_CACHE_HITS=0
MODEL_CONDITIONAL_CACHE={}
AUDIO_WAV_CACHE={}
RENDER_CACHE_STATS={"hits":0,"misses":0,"writes":0}
RENDER_CACHE_MAX_BYTES=2*1024*1024*1024

# Apple-Silicon Production Backend.
MLX_MODEL=None
MLX_MODEL_ERROR=""
MLX_CONDITIONALS={}
MLX_WORKER=concurrent.futures.ThreadPoolExecutor(max_workers=1,thread_name_prefix="dar-mlx")
MLX_MODEL_ID=os.environ.get("DAR_VOICE_MLX_MODEL","mlx-community/chatterbox-multilingual-v3")
MLX_ENABLED=os.environ.get("DAR_VOICE_DISABLE_MLX","0")!="1" and platform.machine().lower()=="arm64"
ACTIVE_BACKEND="mlx" if MLX_ENABLED and importlib.util.find_spec("mlx_audio") is not None else "torch"

# Persistente Kern-Aussprache-Locks haben einen eigenen Zustand.
# Diese Initialisierung muss VOR jedem /health- oder /status-Aufruf existieren.
AUDIO_LOCK_STATE_LOCK=threading.RLock()
PENDING_AUDIO_LOCKS={}
PENDING_AUDIO_RENDER_ID=""

TORCH_LOAD_ORIGINAL=None

AUDIO_LOCK_EDGE_CHARS=" \t\r\n.,،;؛:!?؟…·-–—()[]{}«»\\\"“”„‘’"

def audio_lock_key_for_chunk(text:str):
    value=str(text or "").strip()
    value=value.strip(AUDIO_LOCK_EDGE_CHARS)
    return AUDIO_LOCK_BY_TTS.get(value,"")

def audio_lock_path(key:str):
    safe=re.sub(r"[^a-z0-9_-]+","_",str(key or "").lower()).strip("_")
    return MASTER_AUDIO_DIR/f"{safe}.wav"

def confirmed_audio_lock_keys():
    return sorted(key for key in set(AUDIO_LOCK_BY_TTS.values()) if key and audio_lock_path(key).exists())

def pending_audio_lock_keys():
    with AUDIO_LOCK_STATE_LOCK:
        return sorted(PENDING_AUDIO_LOCKS)

def load_locked_wav(path:Path,target_sr:int):
    import numpy as np, torch, wave
    cache_key=(str(path),int(target_sr),file_signature(path))
    cached=AUDIO_WAV_CACHE.get(cache_key)
    if cached is not None:
        return cached.clone()
    with wave.open(str(path),"rb") as wf:
        channels=wf.getnchannels()
        width=wf.getsampwidth()
        sr=wf.getframerate()
        frames=wf.readframes(wf.getnframes())
    if width!=2:
        raise RuntimeError(f"MASTER-Audio hat nicht unterstützte Sample-Breite: {width}")
    arr=np.frombuffer(frames,dtype=np.int16).astype(np.float32)/32767.0
    if channels>1:
        arr=arr.reshape(-1,channels).mean(axis=1)
    w=torch.from_numpy(arr).view(1,-1)
    if int(sr)!=int(target_sr) and w.shape[-1]>1:
        new_len=max(1,round(w.shape[-1]*float(target_sr)/float(sr)))
        w=torch.nn.functional.interpolate(w.unsqueeze(0),size=new_len,mode="linear",align_corners=False).squeeze(0)
    AUDIO_WAV_CACHE[cache_key]=w.clone()
    return w

def split_audio_locked_spans(text:str):
    value=str(text or "")
    if not AUDIO_LOCK_FORMS:
        return [("text",value)] if value else []
    out=[];pos=0
    while pos<len(value):
        hit=None;hit_pos=None
        for form in AUDIO_LOCK_FORMS:
            idx=value.find(form,pos)
            if idx<0: continue
            if hit_pos is None or idx<hit_pos or (idx==hit_pos and len(form)>len(hit or "")):
                hit=form;hit_pos=idx
        if hit is None:
            if pos<len(value): out.append(("text",value[pos:]))
            break
        if hit_pos>pos:
            out.append(("text",value[pos:hit_pos]))
        end=hit_pos+len(hit)
        # Satzzeichen gehören akustisch zur vorherigen Einheit, dürfen aber den
        # Audio-Lock-Schlüssel nicht verändern. Leerzeichen nach Satzzeichen mitnehmen.
        while end<len(value) and value[end] in ".,،;؛:!?؟…":
            end+=1
        while end<len(value) and value[end].isspace() and end>hit_pos+len(hit):
            end+=1
        out.append(("lock",value[hit_pos:end].strip()))
        pos=end
    return out

def discard_pending_audio_locks():
    global PENDING_AUDIO_LOCKS,PENDING_AUDIO_RENDER_ID
    with AUDIO_LOCK_STATE_LOCK:
        old=list(PENDING_AUDIO_LOCKS.values())
        PENDING_AUDIO_LOCKS={}
        PENDING_AUDIO_RENDER_ID=""
    for p in old:
        try: Path(p).unlink(missing_ok=True)
        except Exception: pass

def stage_pending_audio_locks(render_id:str,candidates:dict,sr:int):
    global PENDING_AUDIO_LOCKS,PENDING_AUDIO_RENDER_ID
    discard_pending_audio_locks()
    paths={}
    for key,wav in candidates.items():
        path=PENDING_AUDIO_DIR/f"{render_id}-{key}.wav"
        save_wav(path,wav,sr)
        if path.exists() and path.stat().st_size>44:
            paths[key]=path
    with AUDIO_LOCK_STATE_LOCK:
        PENDING_AUDIO_LOCKS=paths
        PENDING_AUDIO_RENDER_ID=render_id
    return sorted(paths)

def confirm_pending_audio_locks():
    global PENDING_AUDIO_LOCKS,PENDING_AUDIO_RENDER_ID
    with AUDIO_LOCK_STATE_LOCK:
        pending=dict(PENDING_AUDIO_LOCKS)
        render_id=PENDING_AUDIO_RENDER_ID
    confirmed=[]
    for key,src in pending.items():
        if not Path(src).exists():
            continue
        dst=audio_lock_path(key)
        tmp=dst.with_suffix(".tmp.wav")
        shutil.copy2(src,tmp)
        os.replace(tmp,dst)
        confirmed.append(key)
    if confirmed:
        manifest={
            "schemaVersion":1,
            "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "sourceRenderId":render_id,
            "confirmed":{key:{"file":audio_lock_path(key).name,"label":AUDIO_LOCK_LABELS.get(key,key)} for key in confirmed_audio_lock_keys()},
        }
        tmp=MASTER_AUDIO_MANIFEST.with_suffix(".tmp.json")
        tmp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        os.replace(tmp,MASTER_AUDIO_MANIFEST)
    with AUDIO_LOCK_STATE_LOCK:
        for p in PENDING_AUDIO_LOCKS.values():
            try: Path(p).unlink(missing_ok=True)
            except Exception: pass
        PENDING_AUDIO_LOCKS={}
        PENDING_AUDIO_RENDER_ID=""
    return sorted(confirmed)

def unlock_audio_lock(key:str):
    key=str(key or "").strip()
    if key not in set(AUDIO_LOCK_BY_TTS.values()):
        raise ValueError("Unbekannter Kern-Audio-Lock.")
    audio_lock_path(key).unlink(missing_ok=True)
    return key

def save_user_override(rule:dict):
    global USER_OVERRIDE_DATA
    needle=str(rule.get("string_to_replace","")).strip()
    if not needle:
        raise ValueError("Zu lernendes Wort fehlt.")
    rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    rules=[r for r in rules if str(r.get("string_to_replace",""))!=needle]
    rules.insert(0,rule)
    USER_OVERRIDE_DATA={
        "schemaVersion":2,
        "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "rules":rules,
    }
    atomic_write_json(USER_OVERRIDES_FILE,USER_OVERRIDE_DATA)
    rebuild_runtime_rules()
    return rule

def combined_search_rules():
    seen=set();out=[]
    sources=[
        ("gelernt",list((USER_OVERRIDE_DATA or {}).get("rules") or [])),
        ("online",ONLINE_RULES),
        ("installiert",BASE_RULES),
    ]
    for source,rules in sources:
        for r in rules:
            key=(str(r.get("string_to_replace","")),str(r.get("tts_text","")))
            if key in seen:
                continue
            seen.add(key)
            out.append((source,r))
    return out

def pronunciation_search(query:str,limit:int=10):
    q=normalize_lookup(query)
    if not q:
        return []
    scored=[]
    for source,r in combined_search_rules():
        values=[
            str(r.get("string_to_replace","")),
            str(r.get("canonical","")),
            str(r.get("alias","")),
        ]
        norm=[normalize_lookup(v) for v in values if v]
        if not norm:
            continue
        score=max(difflib.SequenceMatcher(None,q,v).ratio() for v in norm)
        if any(v==q for v in norm): score=1.0
        elif any(q in v or v in q for v in norm if min(len(q),len(v))>=4): score=max(score,0.92)
        if score<0.48:
            continue
        scored.append((score,0 if source=="gelernt" else 1 if source=="online" else 2,source,r))
    scored.sort(key=lambda x:(-x[0],x[1],-len(str(x[3].get("string_to_replace","")))))
    out=[];seen=set()
    for score,_,source,r in scored:
        key=(str(r.get("canonical") or r.get("string_to_replace")),str(r.get("tts_text","")))
        if key in seen: continue
        seen.add(key)
        out.append({
            "source":source,
            "score":round(float(score),3),
            "input":str(r.get("string_to_replace","")),
            "canonical":str(r.get("canonical") or r.get("string_to_replace","")),
            "alias":str(r.get("alias","")),
            "ttsText":str(r.get("tts_text","")),
            "ipa":str(r.get("ipa","")),
            "category":str(r.get("category","")),
            "audioLockKey":str(r.get("audio_lock_key","")),
            "requiredHonorificKey":str(r.get("required_honorific_key","")),
            "voiceLock":str(r.get("voice_lock","")),
        })
        if len(out)>=max(1,min(25,int(limit))): break
    return out

def sync_online_pronunciation_library():
    global ONLINE_LIB,ONLINE_RULES
    req=urllib.request.Request(ONLINE_LIBRARY_URL,headers={"User-Agent":"DARVoiceStudio/2.3"})
    with urllib.request.urlopen(req,timeout=15) as resp:
        raw=resp.read()
    data=json.loads(raw.decode("utf-8"))
    rules=validate_online_library(data)
    cached={
        "schemaVersion":1,
        "syncedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "source":ONLINE_LIBRARY_URL,
        "rules":rules,
    }
    atomic_write_json(ONLINE_LIBRARY_CACHE,cached)
    ONLINE_LIB=cached
    ONLINE_RULES=rules
    rebuild_runtime_rules()
    append_learning_log("online_sync",rules=len(rules))
    return {"rules":len(rules),"syncedAt":cached["syncedAt"]}

def find_learning_rule(term:str,tts_text:str="",canonical:str=""):
    tts_text=str(tts_text or "").strip()
    canonical=str(canonical or "").strip()
    term=str(term or "").strip()
    pools=[list((USER_OVERRIDE_DATA or {}).get("rules") or []),ONLINE_RULES,BASE_RULES]
    if tts_text:
        for rules in pools:
            for r in rules:
                if str(r.get("tts_text","")).strip()==tts_text and (not canonical or str(r.get("canonical") or r.get("string_to_replace"))==canonical):
                    return r
    nq=normalize_lookup(term)
    for rules in pools:
        for r in rules:
            if normalize_lookup(r.get("string_to_replace",""))==nq or normalize_lookup(r.get("canonical",""))==nq:
                return r
    return None

def learning_lock_key(term:str,existing_key:str=""):
    if existing_key:
        return existing_key
    digest=hashlib.sha1(normalize_lookup(term).encode("utf-8")).hexdigest()[:12]
    return "learned_"+digest

def create_learning_preview(term:str,tts_text:str="",canonical:str=""):
    term=str(term or "").strip()
    if not term:
        raise ValueError("Wort oder Name fehlt.")
    rule=find_learning_rule(term,tts_text,canonical)
    effective_tts=str(tts_text or (rule or {}).get("tts_text","")).strip()
    if not effective_tts:
        raise ValueError("Keine Sprechform gefunden. Online suchen oder die arabische Sprechform eintragen.")
    if not re.search(r"[\u0600-\u06ff]",effective_tts):
        raise ValueError("Die manuelle Sprechform muss in arabischer Schrift angegeben werden.")
    model=load_production_model()
    preview_id=uuid.uuid4().hex[:16]
    existing_key=str((rule or {}).get("audio_lock_key","")) or str(AUDIO_LOCK_BY_TTS.get(effective_tts,""))
    lock_key=learning_lock_key(term,existing_key)
    seed=3000+(int(preview_id[:8],16)%800000)
    wav,metrics=render_segment_with_qa(model,effective_tts,"ar","narration",True,seed_base=seed)
    path=LEARNING_PENDING_DIR/f"{preview_id}.wav"
    save_wav(path,wav,int(model.sr))
    meta={
        "id":preview_id,
        "term":term,
        "canonical":str(canonical or (rule or {}).get("canonical") or term),
        "tts_text":effective_tts,
        "alias":str((rule or {}).get("alias","")),
        "ipa":str((rule or {}).get("ipa","")),
        "category":str((rule or {}).get("category","USER LEARNED")),
        "required_honorific_key":str((rule or {}).get("required_honorific_key","")),
        "audio_lock_key":lock_key,
        "path":str(path),
        "sample_rate":int(model.sr),
        "metrics":metrics,
        "createdAt":time.time(),
    }
    with LEARNING_LOCK:
        # Alte Vorschauen aufräumen, damit der Ordner klein bleibt.
        old=list(LEARNING_PREVIEWS.values())
        LEARNING_PREVIEWS.clear()
        LEARNING_PREVIEWS[preview_id]=meta
    for item in old:
        try: Path(item.get("path","")).unlink(missing_ok=True)
        except Exception: pass
    append_learning_log("preview",term=term,canonical=meta["canonical"],lockKey=lock_key)
    return meta

def confirm_learning_preview(preview_id:str,input_term:str=""):
    with LEARNING_LOCK:
        meta=dict(LEARNING_PREVIEWS.get(str(preview_id or "")) or {})
    if not meta:
        raise ValueError("Der Aussprache-Test ist nicht mehr verfügbar. Bitte neu testen.")
    src=Path(meta["path"])
    if not src.exists():
        raise ValueError("Test-Audio fehlt. Bitte neu testen.")
    term=str(input_term or meta.get("term","")).strip()
    if not term:
        raise ValueError("Wort oder Name fehlt.")
    lock_key=str(meta["audio_lock_key"])
    dst=audio_lock_path(lock_key)
    tmp=dst.with_suffix(".learn.tmp.wav")
    shutil.copy2(src,tmp)
    os.replace(tmp,dst)
    rule={
        "category":"USER LEARNED",
        "canonical":str(meta.get("canonical") or term),
        "string_to_replace":term,
        "alias":str(meta.get("alias") or term),
        "ipa":str(meta.get("ipa","")),
        "priority":"user-master",
        "tts_text":str(meta["tts_text"]),
        "tts_language":"ar",
        "tts_strategy":"user-confirmed-audio-learning-v1",
        "voice_lock":"MASTER",
        "qa_tier":"critical",
        "audio_lock_key":lock_key,
        "audio_lock_policy":"CONFIRMED_WAV",
        "learned_at":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    if meta.get("required_honorific_key"):
        rule["required_honorific_key"]=meta["required_honorific_key"]
    save_user_override(rule)
    append_learning_log("confirmed",term=term,canonical=rule["canonical"],lockKey=lock_key)
    with LEARNING_LOCK:
        LEARNING_PREVIEWS.pop(str(preview_id),None)
    try: src.unlink(missing_ok=True)
    except Exception: pass
    return rule

def learning_state():
    user_rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    return {
        "learned":len(user_rules),
        "onlineRules":len(ONLINE_RULES),
        "onlineSyncedAt":(ONLINE_LIB or {}).get("syncedAt"),
        "onlineUrl":ONLINE_LIBRARY_URL,
        "autoSyncHours":24,
        "learnedTerms":[str(r.get("string_to_replace","")) for r in user_rules[:50]],
    }

def online_sync_is_stale(max_age_hours:int=24):
    try:
        if not ONLINE_LIBRARY_CACHE.exists():
            return True
        age=time.time()-ONLINE_LIBRARY_CACHE.stat().st_mtime
        return age>max(1,int(max_age_hours))*3600
    except Exception:
        return True

def refresh_online_library_if_stale():
    if not online_sync_is_stale(24):
        return
    try:
        result=sync_online_pronunciation_library()
        print("[DĀR Voice] online pronunciation sync",result,flush=True)
    except Exception as e:
        print("[DĀR Voice] online pronunciation sync skipped:",e,flush=True)

def patch_torch_load_for_device(device:str):
    """Chatterbox official macOS workaround: force checkpoint loads onto MPS/CPU."""
    global TORCH_LOAD_ORIGINAL
    import torch
    if TORCH_LOAD_ORIGINAL is None:
        TORCH_LOAD_ORIGINAL=torch.load
    original=TORCH_LOAD_ORIGINAL
    map_location=torch.device(device)
    def patched_torch_load(*args,**kwargs):
        if "map_location" not in kwargs:
            kwargs["map_location"]=map_location
        return original(*args,**kwargs)
    torch.load=patched_torch_load

def restore_torch_load():
    global TORCH_LOAD_ORIGINAL
    if TORCH_LOAD_ORIGINAL is None:
        return
    import torch
    torch.load=TORCH_LOAD_ORIGINAL

STATUS={
    "model_state":"not_loaded",
    "model_device":None,
    "render_state":"idle",
    "progress":0,
    "message":"Engine gestartet",
    "last_error":"",
    "last_output":"",
    "model_loaded_at":None,
    "render_started_at":None,
    "render_finished_at":None,
    "prosody_mode":"narration",
    "last_qa":{},
}

def set_status(**updates):
    with STATUS_LOCK:
        STATUS.update(updates)

def get_status():
    with STATUS_LOCK:
        out=dict(STATUS)
    out["reference"]=str(REF_DE)
    out["reference_exists"]=REF_DE.exists()
    out["reference_de"]=str(REF_DE)
    out["reference_ar"]=str(REF_AR)
    out["arabic_reference_dedicated"]=ARABIC_DEDICATED_REFERENCE
    out["output_dir"]=str(OUTPUT)
    out["audio_lock_confirmed"]=confirmed_audio_lock_keys()
    out["audio_lock_pending"]=pending_audio_lock_keys()
    out["audio_lock_total"]=len(set(AUDIO_LOCK_BY_TTS.values()))
    out["honorific_policy_enabled"]=True
    out["honorific_name_variants"]=sum(1 for r in RULES if r.get("required_honorific_key"))
    out["honorific_audio_keys"]=sorted(k for k in HONORIFIC_KEYS if k in HONORIFIC_TTS_BY_KEY)
    out["pronunciation_learning"]=learning_state()
    out["performance_engine"]="persistent-conditionals+segment-cache-v2"
    out["reference_prepares_total"]=MODEL_REFERENCE_PREPARES
    out["reference_cache_hits_total"]=MODEL_REFERENCE_CACHE_HITS
    out["render_cache"]=dict(RENDER_CACHE_STATS)
    out["production_backend"]=ACTIVE_BACKEND
    if ACTIVE_BACKEND=="mlx" and out.get("model_state")=="ready":
        out["model_device"]="mlx-metal"
    out["mlx_enabled"]=bool(MLX_ENABLED)
    out["mlx_model"]=MLX_MODEL_ID if MLX_ENABLED else None
    out["mlx_error"]=MLX_MODEL_ERROR
    return out

def source_honorific_match(text:str,pos:int,required_key:str=""):
    value=str(text or "")
    i=max(0,int(pos))
    while i<len(value) and (value[i].isspace() or value[i] in ".,،;؛:!?؟…·-–—()[]{}«»\\\"“”„‘’"):
        i+=1
    prefix=value[max(0,int(pos)):i]
    keys=[required_key] if required_key else []
    keys += [k for k in HONORIFIC_SOURCE_FORMS if k not in keys]
    for key in keys:
        for form in HONORIFIC_SOURCE_FORMS.get(key,[]):
            if value.startswith(form,i):
                return {"key":key,"form":form,"start":i,"end":i+len(form),"prefix":prefix}
    return None

def source_has_honorific(text:str,pos:int,required_key:str=""):
    return source_honorific_match(text,pos,required_key) is not None

def prepare(text:str):
    pos=0;out=[];found=[]
    while pos<len(text):
        hit=None
        for r in RULES:
            needle=str(r.get("string_to_replace",""))
            if needle and text.startswith(needle,pos):
                hit=r;break
        if not hit:
            out.append(text[pos]);pos+=1;continue

        needle=str(hit.get("string_to_replace",""))
        out.append(str(hit.get("tts_text") or hit.get("alias") or needle))
        found.append(hit)
        next_pos=pos+len(needle)

        required_key=str(hit.get("required_honorific_key",""))
        if required_key:
            honorific_tts=HONORIFIC_TTS_BY_KEY.get(required_key,"")
            explicit=source_honorific_match(text,next_pos,required_key)
            if honorific_tts:
                honorific_rule=HONORIFIC_RULE_BY_KEY.get(required_key)
                if explicit:
                    prefix=str(explicit.get("prefix",""))
                    out.append((prefix if prefix else " ")+honorific_tts)
                    next_pos=int(explicit["end"])
                    if honorific_rule:
                        found.append(honorific_rule)
                else:
                    out.append(" "+honorific_tts)
                    if honorific_rule:
                        found.append(honorific_rule)

        pos=next_pos
    return "".join(out),found

def quran_guard(text:str):
    """Nur echte zusammenhängende arabische Passagen blockieren.

    Einzelne arabische Fachbegriffe/Namen in einem deutschen Satz
    sind ausdrücklich erlaubt.
    """
    value=str(text or "")
    arabic_chars=len(re.findall(r"[\u0600-\u06ff]",value))
    if arabic_chars<24:
        return

    max_run=0
    run=0
    arabic_tokens=0
    punctuation_chars=set('.,،؛:!?؟…·-–—()[]{}«»"“”„‘’')

    for token in re.findall(r"\S+",value):
        has_arabic=bool(re.search(r"[\u0600-\u06ff]",token))
        has_latin=bool(re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]",token))
        punctuation_only=bool(token) and all(ch in punctuation_chars for ch in token)

        if has_arabic and not has_latin:
            run+=1
            arabic_tokens+=1
            max_run=max(max_run,run)
        elif punctuation_only:
            continue
        else:
            run=0

    letters=len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ\u0600-\u06ff]",value))
    arabic_ratio=arabic_chars/max(1,letters)

    if max_run>=4 or (arabic_ratio>=0.70 and arabic_tokens>=4):
        raise ValueError("Zusammenhängende arabische Qurʾān-/Rezitationspassage erkannt. Verwende dafür echte Rezitation.")

def choose_device():
    forced=str(os.environ.get("DAR_VOICE_DEVICE","")).strip().lower()
    if forced in ("mps","cpu"):
        return forced
    import torch
    return "mps" if torch.backends.mps.is_available() else "cpu"

class GenerationTokenLimitReached(RuntimeError):
    pass

class MLXModelAdapter:
    _dar_backend="mlx"
    def __init__(self,model):
        self.model=model
        self.sr=int(getattr(model,"sample_rate",24000))

def generation_token_budget(text:str,language_id:str):
    value=str(text or "").strip()
    chars=len(re.sub(r"\s+","",value))
    words=max(1,len(re.findall(r"\S+",value)))
    # 25 speech tokens ≈ 1 s Audio. Für 140 DE-/90 AR-Zeichen reicht diese
    # Reserve komfortabel für natürliche Sprechgeschwindigkeit, verhindert aber
    # den 1000-token runaway des Upstream-Modells.
    budget=int(90 + chars*1.55 + words*2.0)
    if language_id=="ar":
        return max(150,min(300,budget))
    return max(165,min(360,budget))

def mlx_token_budget(text:str,language_id:str):
    # Backward-compatible interner Alias.
    return generation_token_budget(text,language_id)

def _load_mlx_model_worker():
    global MLX_MODEL,MLX_MODEL_ERROR
    if MLX_MODEL is not None:
        return MLX_MODEL
    try:
        from mlx_audio.tts.utils import load_model as mlx_load_model
        MLX_MODEL=mlx_load_model(MLX_MODEL_ID)
        MLX_MODEL_ERROR=""
        return MLX_MODEL
    except Exception as e:
        MLX_MODEL_ERROR=f"{type(e).__name__}: {e}"
        raise

def load_mlx_model():
    global ACTIVE_BACKEND
    if not MLX_ENABLED or importlib.util.find_spec("mlx_audio") is None:
        raise RuntimeError("MLX Audio ist auf diesem System nicht verfügbar.")
    set_status(model_state="loading",model_device="mlx-metal",message="Chatterbox V3 · MLX wird geladen …",last_error="")
    try:
        model=MLX_WORKER.submit(_load_mlx_model_worker).result()
        adapter=MLXModelAdapter(model)
        ACTIVE_BACKEND="mlx"
        set_status(
            model_state="ready",model_device="mlx-metal",model_loaded_at=time.time(),
            message="Chatterbox V3 · MLX auf Apple Silicon bereit",last_error=""
        )
        return adapter
    except Exception as e:
        set_status(last_error=f"MLX: {type(e).__name__}: {e}")
        raise

def load_production_model():
    global ACTIVE_BACKEND
    if MLX_ENABLED and importlib.util.find_spec("mlx_audio") is not None and not MLX_MODEL_ERROR:
        try:
            return load_mlx_model()
        except Exception as e:
            print("[DĀR Voice] MLX fallback auf PyTorch/MPS:",e,flush=True)
    ACTIVE_BACKEND="torch"
    return load_model()

def _mlx_generate_worker(adapter,ref_path:str,text:str,language_id:str,mode:str,max_tokens:int):
    import numpy as np, torch
    model=adapter.model
    p=prosody_settings(mode,language_id,text)
    ref_sig=file_signature(Path(ref_path))
    conds=MLX_CONDITIONALS.get(ref_sig)
    if conds is None:
        # String-Pfad wird vom MLX-Chatterbox-Port selbst auf 24 kHz geladen.
        conds=model.prepare_conditionals(ref_path,int(getattr(model,"sample_rate",24000)),p["exaggeration"])
        MLX_CONDITIONALS[ref_sig]=conds

    result=None
    for item in model.generate(
        text=text,
        conds=conds,
        exaggeration=p["exaggeration"],
        cfg_weight=p["cfg_weight"],
        temperature=p["temperature"],
        repetition_penalty=1.2,
        min_p=0.05,
        top_p=1.0,
        max_new_tokens=int(max_tokens),
        lang_code=language_id,
        verbose=False,
    ):
        result=item
    if result is None:
        raise RuntimeError("MLX hat kein Audio geliefert.")

    token_count=int(getattr(result,"token_count",0) or 0)
    if token_count>=int(max_tokens)-3:
        raise GenerationTokenLimitReached(
            f"MLX token ceiling reached ({token_count}/{max_tokens})"
        )

    arr=np.asarray(result.audio,dtype=np.float32)
    if arr.ndim>1:
        arr=arr.reshape(-1)
    wav=torch.from_numpy(arr.copy()).view(1,-1)
    return wav,{
        "mlx_token_count":token_count,
        "mlx_max_tokens":int(max_tokens),
        "mlx_processing_seconds":round(float(getattr(result,"processing_time_seconds",0.0) or 0.0),3),
        "mlx_rtf":round(float(getattr(result,"real_time_factor",0.0) or 0.0),4),
    }

def render_with_mlx(model,text:str,language_id:str,mode:str):
    ref=reference_for_language(language_id)
    budget=mlx_token_budget(text,language_id)
    wav,meta=MLX_WORKER.submit(
        _mlx_generate_worker,model,str(ref),text,language_id,mode,budget
    ).result()
    return wav,meta

def load_model(force_device=None):
    global MODEL, MODEL_DEVICE, MODEL_ACTIVE_REFERENCE, MODEL_CONDITIONAL_CACHE, AUDIO_WAV_CACHE
    target=force_device or choose_device()
    if MODEL is not None and MODEL_DEVICE==target:
        return MODEL

    with MODEL_LOCK:
        if MODEL is not None and MODEL_DEVICE==target:
            return MODEL

        set_status(model_state="loading",model_device=target,message=f"Chatterbox V3 wird auf {target.upper()} geladen …",last_error="")
        try:
            import torch
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS
            # Beim Gerätewechsel altes Modell freigeben.
            if MODEL is not None:
                MODEL=None
                gc.collect()
                if torch.backends.mps.is_available():
                    try: torch.mps.empty_cache()
                    except Exception: pass

            # Offizieller Chatterbox-Mac-Workaround: torch.load braucht auf
            # Apple Silicon ein explizites map_location für MPS.
            patch_torch_load_for_device(target)
            try:
                try:
                    model=ChatterboxMultilingualTTS.from_pretrained(device=target,t3_model="v3")
                except TypeError:
                    # Kompatibilität mit Chatterbox-Versionen ohne t3_model-Parameter.
                    model=ChatterboxMultilingualTTS.from_pretrained(device=target)
            finally:
                restore_torch_load()

            # Einige Versionen laden intern zunächst auf CPU; nach dem Laden
            # noch einmal sicherstellen, dass das Modell wirklich auf target liegt.
            if hasattr(model,"to") and str(getattr(model,"device","")) != target:
                try:
                    model.to(target)
                except Exception:
                    pass

            MODEL=model
            MODEL_DEVICE=target
            MODEL_ACTIVE_REFERENCE=None
            MODEL_CONDITIONAL_CACHE={}
            AUDIO_WAV_CACHE={}
            set_status(
                model_state="ready",
                model_device=target,
                model_loaded_at=time.time(),
                message=f"Chatterbox V3 auf {target.upper()} bereit",
                last_error=""
            )
            return MODEL
        except Exception as e:
            MODEL=None
            MODEL_DEVICE=None
            detail=f"{type(e).__name__}: {e}"
            set_status(model_state="error",message="Modell konnte nicht geladen werden",last_error=detail)
            print("[DĀR Voice] MODEL ERROR",detail,flush=True)
            traceback.print_exc()
            raise

def warm_model():
    try:
        model=load_production_model()
        if getattr(model,"_dar_backend","torch")=="mlx":
            # Konditionierung beider Referenzen im dedizierten MLX-Worker vorwärmen,
            # ohne einen langen TTS-Render zu starten.
            def _warm():
                base=model.model
                for lang,probe in (("de","Warmup"),("ar","تجربة")):
                    ref=reference_for_language(lang)
                    sig=file_signature(ref)
                    if sig in MLX_CONDITIONALS:
                        continue
                    p=prosody_settings("narration",lang,probe)
                    MLX_CONDITIONALS[sig]=base.prepare_conditionals(str(ref),int(getattr(base,"sample_rate",24000)),p["exaggeration"])
            MLX_WORKER.submit(_warm).result()
        else:
            prepare_reference_if_needed(model,"de",prosody_settings("narration","de","Warmup")["exaggeration"])
            if REF_AR.exists() and file_signature(REF_AR)!=file_signature(REF_DE):
                prepare_reference_if_needed(model,"ar",prosody_settings("narration","ar","تجربة")["exaggeration"])
            prepare_reference_if_needed(model,"de",prosody_settings("narration","de","Warmup")["exaggeration"])
        cleanup_render_cache()
    except Exception:
        pass

def split_chunks(text:str,max_chars:int=280):
    text=re.sub(r"\s+"," ",text).strip()
    if len(text)<=max_chars:
        return [text] if text else []
    pieces=re.split(r"(?<=[.!?…])\s+",text)
    chunks=[];current=""
    for piece in pieces:
        if len(piece)>max_chars:
            words=piece.split()
            for word in words:
                candidate=(current+" "+word).strip()
                if current and len(candidate)>max_chars:
                    chunks.append(current);current=word
                else:
                    current=candidate
            continue
        candidate=(current+" "+piece).strip()
        if current and len(candidate)>max_chars:
            chunks.append(current);current=piece
        else:
            current=candidate
    if current:chunks.append(current)
    return [c for c in chunks if c.strip()]

ARABIC_CHAR_RE=re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]")

def split_language_segments(text:str):
    """Trennt Deutsch und Arabisch, damit Chatterbox nie beide Sprachen
    mit demselben language_id in einem Generate-Aufruf sprechen muss.
    """
    segments=[]
    buf=[]
    current_lang=None

    def flush():
        nonlocal buf,current_lang
        value="".join(buf).strip()
        if value:
            segments.append((current_lang or "de",value))
        buf=[]
        current_lang=None

    for ch in str(text or ""):
        if ARABIC_CHAR_RE.search(ch):
            char_lang="ar"
        elif ch.isalpha() or ch.isdigit():
            char_lang="de"
        else:
            char_lang=None

        if char_lang is None:
            buf.append(ch)
            continue

        if current_lang is None:
            current_lang=char_lang
            buf.append(ch)
            continue

        if char_lang==current_lang:
            buf.append(ch)
            continue

        # Sprachwechsel: neutrale Leer-/Satzzeichen bleiben beim vorherigen Segment.
        flush()
        current_lang=char_lang
        buf.append(ch)

    flush()

    # Direkt benachbarte gleiche Sprachsegmente wieder zusammenführen.
    merged=[]
    for lang,value in segments:
        if merged and merged[-1][0]==lang:
            merged[-1]=(lang,(merged[-1][1]+" "+value).strip())
        else:
            merged.append((lang,value))
    return merged

def build_render_plan(text:str):
    plan=[]
    for kind,value in split_audio_locked_spans(text):
        if kind=="lock":
            plan.append(("ar",value.strip()))
            continue
        for lang,segment in split_language_segments(value):
            max_chars=90 if lang=="ar" else 140
            for chunk in split_chunks(segment,max_chars=max_chars):
                if chunk.strip():
                    plan.append((lang,chunk.strip()))
    return plan

def detect_prosody_mode(text:str):
    value=str(text or "").strip()
    low=value.casefold()

    if "?" in value or "؟" in value:
        return "question"

    checks=[
        ("dua",CONTEXT_CONFIG.get("dua") or ["duʿāʾ","dua","wir bitten allah","bitten wir allah"]),
        ("serious",CONTEXT_CONFIG.get("serious") or ["achtung","warnung","verboten","sehr ernst","gefahr"]),
        ("gentle",CONTEXT_CONFIG.get("gentle") or ["ganz ruhig","sanft","behutsam","schritt für schritt"]),
        ("kids_story",CONTEXT_CONFIG.get("kidsStory") or ["eines tages","geschichte","es war einmal","komm, wir entdecken"]),
        ("kids_lesson",CONTEXT_CONFIG.get("kidsLesson") or ["heute lernen wir","kids","kinder","gemeinsam lernen"]),
    ]
    for mode,needles in checks:
        if any(str(x).casefold() in low for x in needles):
            return mode

    word_count=len(re.findall(r"\S+",value))
    if value.count(",")>=3 or value.count(";")>=2 or ":" in value or (value.count(",")>=1 and " und " in low and word_count<=20):
        return "list"

    teaching=CONTEXT_CONFIG.get("teaching") or ["bedeutet","lernen wir","erklärt","grundlage","pflicht","wir beten","wir finden","liest","bereiten wir uns","folgen"]
    if any(str(x).casefold() in low for x in teaching):
        return "teaching"
    return "narration"

def resolve_prosody_mode(text:str,requested:str="auto"):
    requested=str(requested or "auto").strip()
    if requested!="auto" and requested in PROSODY_MODES:
        return requested
    mode=detect_prosody_mode(text)
    return mode if mode in PROSODY_MODES else "narration"

def resolve_segment_prosody(text:str,doc_mode:str,requested:str="auto"):
    """Auto darf innerhalb eines Dokuments natürlich reagieren; manuelle Auswahl bleibt strikt."""
    requested=str(requested or "auto").strip()
    if requested!="auto" and requested in PROSODY_MODES:
        return requested
    local=detect_prosody_mode(text)
    if local!="narration" and local in PROSODY_MODES:
        return local
    if doc_mode in ("kids_story","kids_lesson","teaching","gentle","serious","dua","list"):
        return doc_mode
    return "narration"

def prosody_settings(mode:str,language_id:str,text:str=""):
    mode_cfg=PROSODY_MODES.get(mode) or PROSODY_MODES.get("narration") or {}
    lang_cfg=mode_cfg.get(language_id) or {}
    is_ar=language_id=="ar"
    short_ar=is_ar and len(re.sub(r"\s+","",str(text or "")))<=48

    exaggeration=float(lang_cfg.get("exaggeration",0.12 if short_ar else (0.18 if is_ar else 0.22)))
    cfg=float(lang_cfg.get("cfgWeight",0.0 if is_ar else 0.30))
    temperature=float(lang_cfg.get("temperature",0.44 if short_ar else (0.50 if is_ar else 0.55)))

    if short_ar:
        # Guard rail: short Arabic terms should remain neutral and compact.
        exaggeration=min(exaggeration,0.16)
        temperature=min(temperature,0.48)

    if audio_lock_key_for_chunk(text):
        # Kernbegriffe müssen maximal stabil und nicht expressiv gesprochen werden.
        exaggeration=min(exaggeration,0.08)
        temperature=min(temperature,0.36)
        cfg=0.0

    return {
        "exaggeration":exaggeration,
        "cfg_weight":cfg,
        "temperature":temperature,
        "sentence_pause_ms":int(mode_cfg.get("sentencePauseMs",92)),
        "soft_pause_ms":int(mode_cfg.get("softPauseMs",34)),
        "crossfade_ms":int(mode_cfg.get("crossfadeMs",28)),
    }

def file_signature(path:Path):
    try:
        st=path.stat()
        return f"{path.resolve()}|{st.st_size}|{st.st_mtime_ns}"
    except Exception:
        return str(path)

def render_cache_key(text:str,language_id:str,mode:str):
    p=prosody_settings(mode,language_id,text)
    payload={
        "schema":2,
        "model":"chatterbox-multilingual-v3",
        "backend":str(ACTIVE_BACKEND),
        "text":str(text),
        "language":str(language_id),
        "mode":str(mode),
        "reference":file_signature(reference_for_language(language_id)),
        "exaggeration":round(float(p["exaggeration"]),6),
        "cfg_weight":round(float(p["cfg_weight"]),6),
        "temperature":round(float(p["temperature"]),6),
    }
    raw=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def render_cache_path(key:str):
    return RENDER_CACHE_DIR/f"{key}.wav"

def load_render_cache(text:str,language_id:str,mode:str,target_sr:int):
    key=render_cache_key(text,language_id,mode)
    path=render_cache_path(key)
    if not path.exists() or path.stat().st_size<=44:
        RENDER_CACHE_STATS["misses"]+=1
        return None,None,key
    try:
        wav=load_locked_wav(path,target_sr)
        metrics=audio_quality_metrics(wav,target_sr,text,language_id,mode)
        hard=[x for x in metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
        if hard:
            path.unlink(missing_ok=True)
            RENDER_CACHE_STATS["misses"]+=1
            return None,None,key
        try: os.utime(path,None)
        except Exception: pass
        RENDER_CACHE_STATS["hits"]+=1
        metrics["attempt"]=0
        metrics["critical"]=False
        metrics["rescued"]=False
        metrics["segment_cache"]="hit"
        return wav,metrics,key
    except Exception:
        try: path.unlink(missing_ok=True)
        except Exception: pass
        RENDER_CACHE_STATS["misses"]+=1
        return None,None,key

def save_render_cache(key:str,wav,sr:int):
    if not key:
        return
    path=render_cache_path(key)
    tmp=path.with_name(path.name+f".tmp.{os.getpid()}.{uuid.uuid4().hex[:8]}.wav")
    try:
        save_wav(tmp,wav,sr)
        if tmp.exists() and tmp.stat().st_size>44:
            os.replace(tmp,path)
            RENDER_CACHE_STATS["writes"]+=1
    finally:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass

def cleanup_render_cache():
    try:
        files=[p for p in RENDER_CACHE_DIR.glob("*.wav") if p.is_file()]
        total=sum(p.stat().st_size for p in files)
        if total<=RENDER_CACHE_MAX_BYTES:
            return
        for p in sorted(files,key=lambda x:x.stat().st_mtime):
            size=p.stat().st_size
            p.unlink(missing_ok=True)
            total-=size
            if total<=int(RENDER_CACHE_MAX_BYTES*0.85):
                break
    except Exception as e:
        print("[DĀR Voice] render cache cleanup warning",e,flush=True)

def reference_for_language(language_id:str):
    return REF_AR if language_id=="ar" and REF_AR.exists() else REF_DE

def prepare_reference_if_needed(model,language_id:str,exaggeration:float):
    """Voice-Conditioning pro Referenz nur einmal je Modell-Lebensdauer berechnen."""
    global MODEL_ACTIVE_REFERENCE,MODEL_REFERENCE_PREPARES,MODEL_REFERENCE_CACHE_HITS
    ref=reference_for_language(language_id)
    ref_key=file_signature(ref)

    cached=MODEL_CONDITIONAL_CACHE.get(ref_key)
    if cached is not None:
        model.conds=cached
        MODEL_ACTIVE_REFERENCE=ref_key
        MODEL_REFERENCE_CACHE_HITS+=1
        return False

    if not hasattr(model,"prepare_conditionals"):
        return False

    try:
        model.prepare_conditionals(str(ref),exaggeration=float(exaggeration))
    except TypeError:
        model.prepare_conditionals(str(ref))
    MODEL_CONDITIONAL_CACHE[ref_key]=model.conds
    MODEL_ACTIVE_REFERENCE=ref_key
    MODEL_REFERENCE_PREPARES+=1
    return True

def render_with_model(model,text:str,language_id:str,mode:str="narration"):
    import torch
    if getattr(model,"_dar_backend","torch")=="mlx":
        wav,meta=render_with_mlx(model,text,language_id,mode)
        render_with_model._last_backend_meta=meta
        return wav

    p=prosody_settings(mode,language_id,text)
    ref=reference_for_language(language_id)
    kwargs=dict(
        language_id=language_id,
        exaggeration=p["exaggeration"],
        cfg_weight=p["cfg_weight"],
        temperature=p["temperature"]
    )
    prepare_reference_if_needed(model,language_id,p["exaggeration"])
    if not hasattr(model,"prepare_conditionals") or getattr(model,"conds",None) is None:
        kwargs["audio_prompt_path"]=str(ref)

    # Upstream Chatterbox Multilingual setzt max_new_tokens intern fest auf 1000.
    # Für kurze Long-Form-Chunks ist das unnötig hoch und kann bei einer schlechten
    # Sampling-Schleife minutenlang rechnen. Wir deckeln die interne T3-Inferenz,
    # ohne die restliche Chatterbox-Pipeline oder Voice-Conditioning zu verändern.
    cap=generation_token_budget(text,language_id)
    original_inference=getattr(getattr(model,"t3",None),"inference",None)
    state={"tokens":0,"hit":False}
    if original_inference is not None:
        def bounded_inference(*args,**inner_kwargs):
            inner_kwargs["max_new_tokens"]=min(int(inner_kwargs.get("max_new_tokens",cap) or cap),int(cap))
            result=original_inference(*args,**inner_kwargs)
            try:
                state["tokens"]=int(result.shape[-1])
                state["hit"]=state["tokens"]>=int(cap)-3
            except Exception:
                pass
            return result
        model.t3.inference=bounded_inference

    try:
        with torch.inference_mode():
            wav=model.generate(text,**kwargs)
    finally:
        if original_inference is not None:
            model.t3.inference=original_inference

    if state["hit"]:
        raise GenerationTokenLimitReached(
            f"PyTorch token ceiling reached ({state['tokens']}/{cap})"
        )

    render_with_model._last_backend_meta={
        "torch_token_count":int(state["tokens"]),
        "torch_max_tokens":int(cap),
    }
    return wav

render_with_model._last_backend_meta={}

def normalize_segment_shape(wav):
    w=wav.detach().float().cpu()
    if w.ndim==1:
        w=w.unsqueeze(0)
    if w.ndim>2:
        w=w.reshape(w.shape[0],-1)
    return w

def trim_segment_edges(wav,sr:int):
    """Nur echte Randstille entfernen; Konsonanten/Anlaute bleiben geschützt."""
    import torch
    w=normalize_segment_shape(wav)
    if w.numel()==0 or w.shape[-1]<8:
        return w

    envelope=w.abs().amax(dim=0)
    peak=float(envelope.max().item()) if envelope.numel() else 0.0
    if peak<=1e-7:
        return w

    # Profilgesteuerte Randstille: konservativ trimmen, Anlaute/Konsonanten schützen.
    threshold=max(peak*float(CONTINUITY_CONFIG.get("trimThresholdRelative",0.0035)),1e-5)
    active=torch.nonzero(envelope>threshold).flatten()
    if active.numel()==0:
        return w

    pad=max(1,int(sr*float(CONTINUITY_CONFIG.get("trimSafetyMs",20))/1000.0))
    start=max(0,int(active[0].item())-pad)
    end=min(w.shape[-1],int(active[-1].item())+pad+1)
    return w[...,start:end]

def segment_rms(wav):
    import torch
    w=normalize_segment_shape(wav)
    if not w.numel():
        return 0.0
    return float(torch.sqrt(torch.mean(w*w)+1e-12).item())

def audio_quality_metrics(wav,sr:int,text:str,language_id:str,mode:str="narration"):
    import torch
    w=normalize_segment_shape(wav)
    metrics={
        "duration_s":0.0,
        "rms":0.0,
        "peak":0.0,
        "clipping_ratio":0.0,
        "max_internal_silence_ms":0,
        "max_sustained_plateau_ms":0,
        "speech_rate_wpm":0.0,
        "issues":[],
    }
    if not w.numel():
        metrics["issues"].append("empty_audio")
        return metrics

    finite=bool(torch.isfinite(w).all().item())
    if not finite:
        metrics["issues"].append("non_finite")
        return metrics

    duration=w.shape[-1]/max(1,int(sr))
    rms=float(torch.sqrt(torch.mean(w*w)+1e-12).item())
    peak=float(w.abs().max().item())
    clipping=float((w.abs()>=0.995).float().mean().item())

    metrics.update({
        "duration_s":round(duration,3),
        "rms":round(rms,6),
        "peak":round(peak,6),
        "clipping_ratio":round(clipping,6),
    })

    min_rms=float(QA_CONFIG.get("minRms",0.0015))
    min_peak=float(QA_CONFIG.get("minPeak",0.01))
    max_clip=float(QA_CONFIG.get("maxClippingRatio",0.02))
    if rms<min_rms: metrics["issues"].append("near_silence")
    if peak<min_peak: metrics["issues"].append("low_peak")
    if clipping>max_clip: metrics["issues"].append("clipping")

    # 10-ms energy frames: echte interne Stille wird auch bei Satzzeichen begrenzt.
    env=w.abs().amax(dim=0)
    frame=max(1,int(sr*0.010))
    count=env.numel()//frame
    if count>=3 and peak>0:
        framed=env[:count*frame].reshape(count,frame).mean(dim=1)
        threshold=max(peak*0.012,0.0004)
        silent=(framed<threshold).tolist()
        longest=run=0
        for flag in silent[1:-1]:
            if flag:
                run+=1;longest=max(longest,run)
            else:
                run=0
        silence_ms=longest*10
        metrics["max_internal_silence_ms"]=silence_ms
        has_punctuation=bool(re.search(r"[.!?؟…,:;،؛]",str(text)))
        key="maxInternalSilenceMsWithPunctuation" if has_punctuation else "maxInternalSilenceMsWithoutPunctuation"
        limit=int(QA_CONFIG.get(key,1250 if has_punctuation else 700))
        if silence_ms>limit:
            metrics["issues"].append("excessive_internal_pause" if has_punctuation else "unexpected_internal_hold")

    # Sustained-hold guard: auffällig gleichförmige Energie über fast eine Sekunde
    # ist bei kurzen Segmenten ein typisches Hängen/Dehnen des TTS-Modells.
    plateau_frame_ms=max(10,int(QA_CONFIG.get("sustainedPlateauFrameMs",20)))
    pframe=max(1,int(sr*plateau_frame_ms/1000))
    pcount=env.numel()//pframe
    if pcount>=4 and peak>0:
        levels=env[:pcount*pframe].reshape(pcount,pframe).mean(dim=1).tolist()
        active_floor=max(peak*0.05,0.0008)
        delta=float(QA_CONFIG.get("sustainedPlateauRelativeDelta",0.035))
        longest=run=0
        prev=None
        for level in levels:
            if prev is not None and level>active_floor and prev>active_floor:
                rel=abs(level-prev)/max(level,prev,1e-6)
                if rel<=delta:
                    run+=1;longest=max(longest,run)
                else:
                    run=0
            else:
                run=0
            prev=level
        plateau_ms=longest*plateau_frame_ms
        metrics["max_sustained_plateau_ms"]=plateau_ms
        word_count=len(re.findall(r"\S+",str(text)))
        if plateau_ms>int(QA_CONFIG.get("maxSustainedEnergyPlateauMs",950)) and (language_id=="ar" or word_count<=8):
            metrics["issues"].append("suspicious_sustained_hold")

    if language_id=="ar":
        letters=len(ARABIC_CHAR_RE.findall(str(text)))
        if 0<letters<=24:
            max_dur=float(QA_CONFIG.get("shortArabicMaxSecondsBase",1.2))+letters*float(QA_CONFIG.get("shortArabicMaxSecondsPerLetter",0.34))
            if duration>max_dur:
                metrics["issues"].append("short_arabic_too_long")
    else:
        words=re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9'’\-]*",str(text))
        word_count=len(words)
        if word_count:
            wpm=(word_count/max(duration,0.1))*60.0
            metrics["speech_rate_wpm"]=round(wpm,1)
            min_words=int(QA_CONFIG.get("minSpeechRateWords",6))
            floors=QA_CONFIG.get("minSpeechRateWpmByMode") or {}
            floor=float(floors.get(mode,floors.get("default",78)))
            if word_count>=min_words and wpm<floor:
                metrics["issues"].append("speech_rate_too_slow")
            max_dur=max(6.0,float(QA_CONFIG.get("longSegmentBaseSeconds",2.5))+word_count*float(QA_CONFIG.get("longSegmentSecondsPerWord",0.85)))
            if duration>max_dur:
                metrics["issues"].append("segment_too_long")

    if duration<0.12:
        metrics["issues"].append("too_short")
    metrics["issues"]=list(dict.fromkeys(metrics["issues"]))
    return metrics

def split_rescue_chunks(text:str):
    """Nur lange, nicht-MASTER Segmente deterministisch in sichere Teilstücke zerlegen."""
    value=re.sub(r"\s+"," ",str(text or "")).strip()
    if not value:
        return []
    words=value.split()
    min_words=max(6,int(QA_CONFIG.get("rescueMinWords",9)))
    min_chars=max(60,int(QA_CONFIG.get("rescueMinChars",90)))
    if len(words)<min_words and len(value)<min_chars:
        return [value]

    parts=[p.strip() for p in re.split(r"(?<=[,،;؛:])\s+",value) if p.strip()]
    if len(parts)>=2 and max(map(len,parts))<len(value)*0.82:
        return parts

    # Bevorzugt an einer natürlichen deutschen Konjunktion nahe der Mitte trennen.
    candidates=[m for m in re.finditer(r"\s+(?:und|aber|denn|doch|während|weil|wenn)\s+",value,flags=re.I)]
    if candidates:
        middle=len(value)/2
        cut=min(candidates,key=lambda m:abs(m.start()-middle)).start()
        left=value[:cut].strip()
        right=value[cut:].strip()
        if left and right:
            return [left,right]

    if len(words)>=min_words:
        mid=max(1,min(len(words)-1,len(words)//2))
        return [" ".join(words[:mid])," ".join(words[mid:])]
    return [value]

def render_segment_with_qa(model,text:str,language_id:str,mode:str,critical:bool=False,seed_base:int=2026):
    import torch
    attempts=max(1,int(QA_CONFIG.get("maxRenderAttempts",2)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    seed_base=max(1,int(seed_base))
    last=None

    for attempt in range(attempts):
        torch.manual_seed(seed_base+attempt*seed_offset)
        try:
            wav=render_with_model(model,text,language_id,mode)
        except GenerationTokenLimitReached as e:
            print(f"[DĀR Voice] bounded generation rescue: {e}",flush=True)
            last=(None,{"issues":["generation_token_limit"],"attempt":attempt+1,"critical":bool(critical),"rescued":False})
            break
        metrics=audio_quality_metrics(wav,int(model.sr),text,language_id,mode)
        metrics.update(getattr(render_with_model,"_last_backend_meta",{}) or {})
        metrics["attempt"]=attempt+1
        metrics["critical"]=bool(critical)
        metrics["rescued"]=False
        last=(wav,metrics)
        if not metrics["issues"]:
            return wav,metrics
        print(f"[DĀR Voice] QA retry {attempt+1}/{attempts} lang={language_id} mode={mode}: {metrics['issues']}",flush=True)

    rescue_allowed={
        "unexpected_internal_hold","excessive_internal_pause","suspicious_sustained_hold",
        "short_arabic_too_long","segment_too_long","speech_rate_too_slow","generation_token_limit"
    }
    last_issues=set(last[1]["issues"]) if last else set()
    if bool(QA_CONFIG.get("rescueLongSegments",True)) and not critical and last_issues and last_issues.issubset(rescue_allowed):
        parts=split_rescue_chunks(text)
        if len(parts)>1:
            rescued=[]
            rescue_metrics=[]
            for part_idx,part in enumerate(parts):
                torch.manual_seed(seed_base+(attempts+part_idx)*seed_offset)
                try:
                    sub=render_with_model(model,part,language_id,mode)
                except GenerationTokenLimitReached:
                    rescued=[]
                    break
                subm=audio_quality_metrics(sub,int(model.sr),part,language_id,mode)
                subm.update(getattr(render_with_model,"_last_backend_meta",{}) or {})
                if subm["issues"]:
                    rescued=[]
                    break
                rescued.append((sub,language_id,part,mode,subm))
                rescue_metrics.append(subm)
            if rescued:
                joined=join_rendered_segments(rescued,int(model.sr))
                metrics=audio_quality_metrics(joined,int(model.sr),text,language_id,mode)
                if not metrics["issues"]:
                    metrics.update({
                        "attempt":attempts,
                        "critical":False,
                        "rescued":True,
                        "rescue_parts":len(parts),
                        "rescue_metrics":rescue_metrics,
                    })
                    print(f"[DĀR Voice] segment rescued in {len(parts)} parts lang={language_id} mode={mode}",flush=True)
                    return joined,metrics

    issues=", ".join(last[1]["issues"]) if last else "unknown"
    raise RuntimeError(f"Audio-QA fehlgeschlagen ({language_id}/{mode}): {issues}")

def gently_level_segments(items):
    """Kleine Pegelsprünge glätten, ohne die natürliche Dynamik plattzumachen."""
    import statistics
    levels=[segment_rms(item[0]) for item in items]
    valid=[x for x in levels if x>1e-5]
    if not valid:
        return items
    target=float(statistics.median(valid))
    clamp=CONTINUITY_CONFIG.get("gainClamp") or [0.88,1.14]
    lo=float(clamp[0]);hi=float(clamp[1])
    out=[]
    for item,level in zip(items,levels):
        w=item[0]
        if level>1e-5:
            gain=max(lo,min(hi,target/level))
            w=(w*gain).clamp(-0.995,0.995)
        out.append((w,*item[1:]))
    return out

def crossfade_audio(left,right,sr:int,seconds:float):
    import torch
    a=normalize_segment_shape(left)
    b=normalize_segment_shape(right)
    n=min(int(sr*seconds),a.shape[-1]//3,b.shape[-1]//3)
    if n<8:
        return torch.cat([a,b],dim=-1)

    fade_in=torch.linspace(0.0,1.0,n,dtype=a.dtype).view(1,-1)
    fade_out=1.0-fade_in
    mixed=a[...,-n:]*fade_out+b[...,:n]*fade_in
    return torch.cat([a[...,:-n],mixed,b[...,n:]],dim=-1)

def join_rendered_segments(items,sr:int):
    """Deutsch/Arabisch ohne hörbare harte Schnittkante zusammensetzen."""
    import torch
    if not items:
        raise RuntimeError("Keine Audiosegmente erzeugt.")

    cleaned=[]
    for item in items:
        wav=item[0]
        cleaned.append((trim_segment_edges(wav,sr),*item[1:]))
    cleaned=gently_level_segments(cleaned)

    full=cleaned[0][0]
    prev_lang=cleaned[0][1]
    prev_chunk=cleaned[0][2]
    prev_mode=cleaned[0][3]

    for item in cleaned[1:]:
        wav,lang,chunk,mode=item[0],item[1],item[2],item[3]
        prev_text=prev_chunk.strip()
        sentence_end=bool(re.search(r"[.!?؟…]$",prev_text))
        soft_pause=bool(re.search(r"[,،;؛:]$",prev_text))
        p=prosody_settings(prev_mode,prev_lang,prev_chunk)

        if sentence_end:
            factors=CONTINUITY_CONFIG.get("sentencePauseFactors") or {}
            if re.search(r"[?؟]$",prev_text): factor=float(factors.get("question",1.06))
            elif prev_text.endswith("!"): factor=float(factors.get("exclamation",0.96))
            elif prev_text.endswith("…"): factor=float(factors.get("ellipsis",1.16))
            else: factor=float(factors.get("period",1.0))
            pause=max(0,int(p["sentence_pause_ms"]*factor))
            silence=torch.zeros((1,max(1,int(sr*pause/1000))),dtype=full.dtype)
            full=torch.cat([full,silence,wav],dim=-1)
        elif soft_pause:
            factors=CONTINUITY_CONFIG.get("softPauseFactors") or {}
            if re.search(r"[,،]$",prev_text): factor=float(factors.get("comma",0.86))
            elif re.search(r"[;؛]$",prev_text): factor=float(factors.get("semicolon",1.0))
            else: factor=float(factors.get("colon",1.08))
            pause=max(0,int(p["soft_pause_ms"]*factor))
            silence=torch.zeros((1,max(1,int(sr*pause/1000))),dtype=full.dtype)
            full=torch.cat([full,silence,wav],dim=-1)
        else:
            ms=max(8,int(p["crossfade_ms"]))
            if prev_lang==lang:
                ms=min(ms,int(CONTINUITY_CONFIG.get("sameLanguageCrossfadeMaxMs",22)))
            else:
                ms=max(ms,int(CONTINUITY_CONFIG.get("languageCrossfadeMinMs",14)))
            full=crossfade_audio(full,wav,sr,ms/1000.0)

        prev_lang=lang
        prev_chunk=chunk
        prev_mode=mode

    edge_ms=int(CONTINUITY_CONFIG.get("outputEdgeFadeMs",12))
    edge=max(1,min(int(sr*edge_ms/1000),full.shape[-1]//4))
    if edge>1:
        fade=torch.linspace(0.0,1.0,edge,dtype=full.dtype).view(1,-1)
        full[...,:edge]*=fade
        full[...,-edge:]*=torch.flip(fade,dims=[1])
    return full

def save_wav(path:Path,wav,sr:int):
    tensor=wav.detach().float().cpu()
    if tensor.ndim==1:
        tensor=tensor.unsqueeze(0)
    try:
        import torchaudio as ta
        ta.save(str(path),tensor,sr)
        return
    except Exception as first:
        print("[DĀR Voice] torchaudio.save fallback:",first,flush=True)

    # Robuster Fallback ohne TorchCodec/torchaudio-Backend.
    import numpy as np, wave
    arr=tensor.squeeze(0).numpy()
    arr=np.nan_to_num(arr,nan=0.0,posinf=0.0,neginf=0.0)
    peak=float(np.max(np.abs(arr))) if arr.size else 1.0
    if peak>1.0: arr=arr/peak
    pcm=(np.clip(arr,-1.0,1.0)*32767.0).astype(np.int16)
    with wave.open(str(path),"wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(int(sr))
        wf.writeframes(pcm.tobytes())

def find_ffmpeg():
    candidates=[
        os.environ.get("DAR_FFMPEG_BIN","").strip(),
        shutil.which("ffmpeg") or "",
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/opt/local/bin/ffmpeg",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file() and os.access(candidate,os.X_OK):
            return candidate
    return None

def postprocess(src:Path):
    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        print("[DĀR Voice] ffmpeg nicht gefunden – liefere ungemasterte WAV aus.",flush=True)
        return src

    dst=src.with_name(src.stem+"_master.wav")
    filt="highpass=f=65,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=7"
    try:
        p=subprocess.run([ffmpeg,"-y","-i",str(src),"-af",filt,str(dst)],capture_output=True,text=True)
    except (FileNotFoundError,OSError) as e:
        print("[DĀR Voice] ffmpeg nicht startbar – Roh-WAV bleibt erhalten:",e,flush=True)
        return src

    if p.returncode==0 and dst.exists() and dst.stat().st_size>44:
        return dst
    if p.stderr:
        print("[DĀR Voice] ffmpeg fallback:",p.stderr[-1200:],flush=True)
    return src

def generate(text:str,prepared:str="",style:str="auto"):
    quran_guard(text)
    if not REF_DE.exists():
        raise RuntimeError("Referenzstimme fehlt: "+str(REF_DE))

    speak,found=prepare(text)
    plan=build_render_plan(speak)
    if not plan:
        raise ValueError("Sprechtext ist leer.")

    if not RENDER_LOCK.acquire(blocking=False):
        raise RuntimeError("Es läuft bereits eine Audio-Erzeugung.")

    # Ein neuer Render macht jeden unbestätigten Kandidaten des vorherigen Renders ungültig.
    discard_pending_audio_locks()

    doc_mode=resolve_prosody_mode(text,style)
    master_forms={
        str(r.get("tts_text",""))
        for r in found
        if r.get("voice_lock")=="MASTER" and r.get("tts_text")
    }

    set_status(
        render_state="rendering",
        progress=1,
        render_started_at=time.time(),
        render_finished_at=None,
        last_error="",
        prosody_mode=doc_mode,
        last_qa={},
        message=f"Audio wird vorbereitet · {doc_mode} …"
    )

    try:
        model=load_production_model()
        outputs=[None]*len(plan)
        qa_segments=[None]*len(plan)
        total=len(plan)
        render_id=uuid.uuid4().hex[:12]
        session_audio_locks={}
        new_audio_lock_candidates={}
        render_started_perf=time.perf_counter()
        prepares_before=MODEL_REFERENCE_PREPARES

        # Performance: gleiche Sprache/Referenz zusammen erzeugen. Das Ergebnis wird
        # anschließend wieder exakt in die ursprüngliche Textreihenfolge eingesetzt.
        # Damit wechseln wir bei langen DE/AR-Dokumenten typischerweise nur 1–2× die
        # teure Voice-Conditioning-Referenz statt bei jedem Fachbegriff.
        execution_order=sorted(range(total),key=lambda i:(0 if plan[i][0]=="de" else 1,i))

        for processed_pos,original_idx in enumerate(execution_order,1):
            lang,chunk=plan[original_idx]
            idx=original_idx+1
            pct=8+int(((processed_pos-1)/max(1,total))*78)
            lang_label="Arabisch" if lang=="ar" else "Deutsch"
            mode=resolve_segment_prosody(chunk,doc_mode,style)
            audio_lock_key=audio_lock_key_for_chunk(chunk)
            critical=bool(audio_lock_key) or (lang=="ar" and any(x and x in chunk for x in master_forms))
            set_status(progress=pct,message=f"{lang_label} · {mode} · Abschnitt {idx}/{total} …")
            print(f"[DĀR Voice] segment {idx}/{total} lang={lang} mode={mode} critical={critical} lock={audio_lock_key or '-'}: {chunk}",flush=True)

            locked_path=audio_lock_path(audio_lock_key) if audio_lock_key else None
            if audio_lock_key and locked_path.exists():
                wav=load_locked_wav(locked_path,int(model.sr))
                metrics=audio_quality_metrics(wav,int(model.sr),chunk,lang,mode)
                hard=[x for x in metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
                if hard:
                    raise RuntimeError("Bestätigter Kern-Audio-Lock ist technisch beschädigt: "+audio_lock_key)
                metrics["attempt"]=0
                metrics["critical"]=True
                metrics["rescued"]=False
                metrics["audio_lock"]="confirmed"
            elif audio_lock_key and audio_lock_key in session_audio_locks:
                wav=session_audio_locks[audio_lock_key].clone()
                metrics=audio_quality_metrics(wav,int(model.sr),chunk,lang,mode)
                metrics["attempt"]=0
                metrics["critical"]=True
                metrics["rescued"]=False
                metrics["audio_lock"]="session_reuse"
            else:
                cached_wav=cached_metrics=None
                cache_key=""
                if not audio_lock_key:
                    cached_wav,cached_metrics,cache_key=load_render_cache(chunk,lang,mode,int(model.sr))
                if cached_wav is not None:
                    wav,metrics=cached_wav,cached_metrics
                else:
                    try:
                        core_seed=2026
                        if audio_lock_key:
                            render_salt=int(render_id[:8],16)
                            key_salt=sum((i+1)*ord(ch) for i,ch in enumerate(audio_lock_key))
                            core_seed=2026+((render_salt+key_salt*131)%900000)
                        wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical,seed_base=core_seed)
                    except Exception as first_error:
                        if getattr(model,"_dar_backend","torch")=="mlx":
                            print("[DĀR Voice] MLX segment failed, retry PyTorch/MPS:",first_error,flush=True)
                            set_status(message=f"{lang_label} · MLX-Fallback auf PyTorch/MPS …")
                            model=load_model()
                            wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical,seed_base=core_seed)
                        elif MODEL_DEVICE=="mps":
                            print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                            set_status(message=f"{lang_label} · MPS-Fallback auf CPU …")
                            model=load_model(force_device="cpu")
                            wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical,seed_base=core_seed)
                        else:
                            raise
                    if not audio_lock_key:
                        save_render_cache(cache_key,wav,int(model.sr))
                        metrics["segment_cache"]="miss"
                    if audio_lock_key:
                        wav=wav.detach().float().cpu()
                        session_audio_locks[audio_lock_key]=wav.clone()
                        new_audio_lock_candidates[audio_lock_key]=wav.clone()
                        metrics["audio_lock"]="candidate"

            qa_segments[original_idx]={
                "index":idx,
                "language":lang,
                "mode":mode,
                "critical":critical,
                **metrics
            }
            outputs[original_idx]=(wav.detach().float().cpu(),lang,chunk,mode,metrics)

        outputs=[x for x in outputs if x is not None]
        qa_segments=[x for x in qa_segments if x is not None]
        sr=int(model.sr)
        full=join_rendered_segments(outputs,sr)
        final_metrics=audio_quality_metrics(full,sr,text,"de",doc_mode)
        # Final composite may legitimately contain punctuation pauses; only hard
        # signal defects are fatal here.
        fatal=[x for x in final_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
        if fatal:
            raise RuntimeError("Finale Audio-QA fehlgeschlagen: "+", ".join(fatal))

        staged_audio_locks=stage_pending_audio_locks(render_id,new_audio_lock_candidates,sr)

        qa_summary={
            "mode":doc_mode,
            "segment_modes":sorted({x.get("mode","narration") for x in qa_segments}),
            "rescued_segments":sum(1 for x in qa_segments if x.get("rescued")),
            "continuity_engine":"sentence-context-2.1",
            "render_id":render_id,
            "audio_lock_confirmed":confirmed_audio_lock_keys(),
            "audio_lock_pending":staged_audio_locks,
            "segments":qa_segments,
            "final":final_metrics,
            "arabic_reference_dedicated":ARABIC_DEDICATED_REFERENCE,
            "performance":{
                "render_seconds":round(time.perf_counter()-render_started_perf,3),
                "segments":total,
                "reference_prepares":max(0,MODEL_REFERENCE_PREPARES-prepares_before),
                "reference_cache_hits_total":MODEL_REFERENCE_CACHE_HITS,
                "segment_cache_hits":sum(1 for x in qa_segments if x.get("segment_cache")=="hit"),
                "segment_cache_misses":sum(1 for x in qa_segments if x.get("segment_cache")=="miss"),
                "execution_strategy":"mlx-bounded-long-form-v1" if getattr(model,"_dar_backend","torch")=="mlx" else "persistent-conditionals+segment-cache-v2",
                "backend":"mlx" if getattr(model,"_dar_backend","torch")=="mlx" else "torch",
            },
        }
        set_status(last_qa=qa_summary)

        set_status(progress=90,message="WAV wird gespeichert …")
        raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
        save_wav(raw,full,sr)
        if not raw.exists() or raw.stat().st_size<=44:
            raise RuntimeError("WAV-Datei wurde nicht korrekt geschrieben.")

        set_status(progress=95,message="Audio-Mastering läuft …")
        out=postprocess(raw)
        cleanup_render_cache()
        set_status(
            render_state="done",
            progress=100,
            message=f"Audio fertig · {doc_mode}",
            last_output=str(out),
            render_finished_at=time.time(),
            last_error=""
        )
        return out
    except Exception as e:
        detail=f"{type(e).__name__}: {e}"
        set_status(
            render_state="error",
            progress=0,
            message="Audio-Erzeugung fehlgeschlagen",
            last_error=detail,
            render_finished_at=time.time()
        )
        print("[DĀR Voice] GENERATE ERROR",detail,flush=True)
        traceback.print_exc()
        raise
    finally:
        RENDER_LOCK.release()

class VoiceHTTPServer(ThreadingHTTPServer):
    allow_reuse_address=True
    daemon_threads=True

class H(BaseHTTPRequestHandler):
    def cors(self):
        origin=self.headers.get("Origin","")
        allowed=origin if origin in ("https://dar-al-tawhid.de","https://www.dar-al-tawhid.de") or origin.startswith("http://127.0.0.1") or origin.startswith("http://localhost") else "https://dar-al-tawhid.de"
        self.send_header("Access-Control-Allow-Origin",allowed)
        self.send_header("Vary","Origin")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Access-Control-Expose-Headers","X-Learning-Preview-Id, X-Learning-Lock-Key")
        self.send_header("Access-Control-Allow-Private-Network","true")
        self.send_header("Cache-Control","no-store")

    def send_json(self,status,obj):
        b=json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(b)))
        self.cors();self.end_headers();self.wfile.write(b)

    def do_OPTIONS(self):
        self.send_response(204);self.cors();self.end_headers()

    def send_file(self,path:Path,content_type:str):
        if not path.exists():
            return self.send_json(404,{"error":"file not found"})
        b=path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type",content_type)
        self.send_header("Content-Length",str(len(b)))
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        p=urlparse(self.path).path
        if p=="/health":
            st=get_status()
            ok=REF.exists()
            self.send_json(200,{
                "ok":ok,
                "provider":"Chatterbox Multilingual V3",
                "reference_exists":ok,
                "reference_arabic_dedicated":ARABIC_DEDICATED_REFERENCE,
                "prosody_mode":st.get("prosody_mode","narration"),
                "model_state":st["model_state"],
                "model_device":st["model_device"],
                "render_state":st["render_state"],
                "progress":st["progress"],
                "last_error":st["last_error"],
                "library":LIB.get("counts",{}),
                "profile":VOICE_PROFILE.get("delivery",{})
            })
        elif p=="/status":
            self.send_json(200,{"ok":True,**get_status()})
        elif p=="/diagnostics":
            import sys, platform
            try:
                import torch
                torch_version=getattr(torch,"__version__","?")
                mps_available=bool(torch.backends.mps.is_available())
                mps_built=bool(torch.backends.mps.is_built())
            except Exception as e:
                torch_version="error: "+str(e)
                mps_available=False
                mps_built=False
            self.send_json(200,{
                "ok":True,
                "python":sys.version.split()[0],
                "platform":platform.platform(),
                "machine":platform.machine(),
                "torch":torch_version,
                "mps_built":mps_built,
                "mps_available":mps_available,
                "reference":str(REF),
                "reference_exists":REF.exists(),
                "mixed_language_segmentation":True,
                "voice_studio_2":True,
                "prosody_modes":sorted(PROSODY_MODES.keys()),
                "master_pronunciation_forms":len(MASTER_TTS),
                "arabic_reference_dedicated":ARABIC_DEDICATED_REFERENCE,
                "arabic_language_id":"ar",
                "german_language_id":"de",
                "boundary_silence_trim":True,
                "language_crossfade_ms":32,
                "gentle_level_matching":True,
                **get_status()
            })
        elif p in ("/studio","/studio/","/studio/index.html"):
            self.send_file(APP_HOME/"studio.html","text/html; charset=utf-8")
        elif p=="/data/pronunciation/pronunciation-rules.json":
            self.send_json(200,LIB)
        elif p=="/learning/state":
            self.send_json(200,{"ok":True,**learning_state()})
        elif p=="/data/pronunciation/voice-production-profile.json":
            self.send_file(PROFILE,"application/json; charset=utf-8")
        elif p=="/watermark-my-logo-full.png":
            self.send_file(APP_HOME/"watermark-my-logo-full.png","image/png")
        elif p in ("/app-icon-192.png","/app-icon-512.png"):
            self.send_file(APP_HOME/"app-icon-512.png","image/png")
        elif p=="/":
            self.send_response(302);self.send_header("Location","/studio/");self.end_headers()
        else:
            self.send_json(404,{"error":"not found"})

    def do_POST(self):
        p=urlparse(self.path).path
        n=int(self.headers.get("Content-Length","0") or 0)
        try:data=json.loads(self.rfile.read(n) or b"{}")
        except Exception:return self.send_json(400,{"error":"Ungültiges JSON"})

        if p=="/warmup":
            st=get_status()
            if st["model_state"] not in ("loading","ready"):
                threading.Thread(target=warm_model,daemon=True).start()
            return self.send_json(202,{"ok":True,**get_status()})

        if p=="/analyze":
            try:
                text=str(data.get("text","")).strip()
                style=str(data.get("style","auto")).strip() or "auto"
                if not text: raise ValueError("Text fehlt.")
                prepared,found=prepare(text)
                mode=resolve_prosody_mode(text,style)
                plan=build_render_plan(prepared)
                return self.send_json(200,{
                    "ok":True,
                    "mode":mode,
                    "prepared":prepared,
                    "segments":[{"language":lang,"text":chunk} for lang,chunk in plan],
                    "masterTerms":sorted({
                        str(r.get("canonical") or r.get("string_to_replace"))
                        for r in found if r.get("voice_lock")=="MASTER"
                    }),
                    "reviewTerms":sorted({
                        str(r.get("canonical") or r.get("string_to_replace"))
                        for r in found if r.get("voice_lock")=="REVIEW"
                    }),
                    "audioLocks":sorted({
                        str(r.get("audio_lock_key"))
                        for r in found if r.get("audio_lock_key")
                    }),
                    "audioLocksConfirmed":confirmed_audio_lock_keys(),
                    "honorificPolicyEnabled":True,
                    "requiredHonorificNames":sorted({
                        str(r.get("canonical") or r.get("string_to_replace"))
                        for r in found if r.get("required_honorific_key")
                    }),
                    "arabicReferenceDedicated":ARABIC_DEDICATED_REFERENCE
                })
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/search":
            try:
                query=str(data.get("query","")).strip()
                if not query: raise ValueError("Suchwort fehlt.")
                return self.send_json(200,{"ok":True,"query":query,"results":pronunciation_search(query,int(data.get("limit",10) or 10)),**learning_state()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/sync":
            try:
                result=sync_online_pronunciation_library()
                return self.send_json(200,{"ok":True,**result,**learning_state()})
            except Exception as e:
                return self.send_json(502,{"ok":False,"error":"Online-Wortschatz konnte nicht synchronisiert werden: "+str(e),**learning_state()})

        if p=="/learning/preview":
            try:
                meta=create_learning_preview(
                    str(data.get("term","")),
                    str(data.get("ttsText","")),
                    str(data.get("canonical","")),
                )
                b=Path(meta["path"]).read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("X-Learning-Preview-Id",meta["id"])
                self.send_header("X-Learning-Lock-Key",meta["audio_lock_key"])
                self.cors();self.end_headers();self.wfile.write(b)
                return
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/confirm":
            try:
                rule=confirm_learning_preview(str(data.get("previewId","")),str(data.get("term","")))
                return self.send_json(200,{"ok":True,"rule":rule,**learning_state()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e),**learning_state()})

        if p=="/confirm-core-audio":
            try:
                confirmed=confirm_pending_audio_locks()
                return self.send_json(200,{"ok":True,"confirmed":confirmed,"status":get_status()})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e),"status":get_status()})

        if p=="/unlock-core-audio":
            try:
                key=unlock_audio_lock(str(data.get("key","")))
                return self.send_json(200,{"ok":True,"unlocked":key,"status":get_status()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e),"status":get_status()})

        if p=="/generate":
            try:
                text=str(data.get("text","")).strip()
                prepared=str(data.get("prepared","")).strip()
                style=str(data.get("style","auto")).strip() or "auto"
                if not text:raise ValueError("Text fehlt.")
                out=generate(text,prepared,style)
                b=out.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("Content-Disposition",'inline; filename="dar-serhat-voice.wav"')
                self.cors();self.end_headers();self.wfile.write(b)
            except RuntimeError as e:
                status=409 if "bereits" in str(e) else 500
                return self.send_json(status,{"error":str(e),"status":get_status()})
            except Exception as e:
                return self.send_json(500,{"error":str(e),"status":get_status()})
        else:
            self.send_json(404,{"error":"not found"})

    def log_message(self,fmt,*args):
        print("[DĀR Voice]",fmt%args,flush=True)

def existing_engine_health(timeout:float=0.6):
    try:
        req=urllib.request.Request(f"http://{HOST}:{PORT}/health",headers={"Cache-Control":"no-cache"})
        with urllib.request.urlopen(req,timeout=timeout) as resp:
            return int(getattr(resp,"status",0) or 0)==200
    except Exception:
        return False

def port_listener_pids(port:int):
    commands=[
        ["/usr/sbin/lsof","-nP",f"-iTCP:{int(port)}","-sTCP:LISTEN","-t"],
        ["lsof","-nP",f"-iTCP:{int(port)}","-sTCP:LISTEN","-t"],
    ]
    for cmd in commands:
        try:
            out=subprocess.check_output(cmd,stderr=subprocess.DEVNULL,text=True,timeout=2)
            return sorted({int(x) for x in out.split() if x.strip().isdigit()})
        except Exception:
            continue
    return []

def process_command(pid:int):
    try:
        return subprocess.check_output(
            ["/bin/ps","-p",str(int(pid)),"-o","command="],
            stderr=subprocess.DEVNULL,text=True,timeout=2
        ).strip()
    except Exception:
        return ""

def is_our_engine_process(pid:int):
    cmd=process_command(pid)
    if not cmd:
        return False
    engine=str((APP_HOME/"local-engine.py").resolve())
    return engine in cmd or ("DAR-Voice-Studio/local-engine.py" in cmd and "python" in cmd.lower())

def stop_stale_own_listener():
    own=[pid for pid in port_listener_pids(PORT) if pid!=os.getpid() and is_our_engine_process(pid)]
    if not own:
        return False
    print("[DĀR Voice] stale eigene Engine auf Port 8787:",own,flush=True)
    for pid in own:
        try: os.kill(pid,15)
        except Exception: pass
    deadline=time.time()+3.0
    while time.time()<deadline:
        alive=[pid for pid in own if process_command(pid)]
        if not alive:
            break
        time.sleep(0.15)
    for pid in own:
        if process_command(pid):
            try: os.kill(pid,9)
            except Exception: pass
    time.sleep(0.35)
    return True

def serve_single_instance():
    print(f"DĀR Voice Engine http://{HOST}:{PORT}",flush=True)
    print("Referenz:",REF,flush=True)

    # ZUERST den Port binden. Erst danach Modell/Online-Sync starten.
    # Dadurch kann ein zweiter Starter niemals parallel ein zweites Chatterbox-Modell laden.
    server=None
    last_error=None
    for attempt in range(3):
        try:
            server=VoiceHTTPServer((HOST,PORT),H)
            break
        except OSError as e:
            last_error=e
            if getattr(e,"errno",None) not in (48,98):
                raise

            # Eine bereits gesunde Serhat-Engine ist ein erfolgreicher Zustand.
            for _ in range(12):
                if existing_engine_health():
                    print("[DĀR Voice] Engine läuft bereits auf Port 8787 – Doppelstart wird sauber beendet.",flush=True)
                    return 0
                time.sleep(0.2)

            # Nur einen eindeutig eigenen alten Engine-Prozess beenden.
            if stop_stale_own_listener():
                continue

            listeners=port_listener_pids(PORT)
            print("[DĀR Voice] Port 8787 ist fremd/nicht reagierend belegt:",listeners,flush=True)
            break

    if server is None:
        raise last_error if last_error is not None else OSError("Port 8787 konnte nicht gebunden werden.")

    with server:
        # Modell und Online-Wortschatz erst nach erfolgreichem exklusivem Bind vorladen.
        threading.Thread(target=warm_model,daemon=True).start()
        threading.Thread(target=refresh_online_library_if_stale,daemon=True).start()
        server.serve_forever()
    return 0

if __name__=="__main__":
    raise SystemExit(serve_single_instance())
