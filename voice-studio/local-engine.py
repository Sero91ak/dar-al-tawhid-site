#!/usr/bin/env python3
from __future__ import annotations
import concurrent.futures, difflib, gc, hashlib, importlib.util, json, os, platform, re, shutil, subprocess, sys, threading, time, traceback, unicodedata, urllib.request, uuid
import multiprocessing as mp
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
try:
    from speech_flow import prepare_flow_text
except ModuleNotFoundError:
    sys.path.insert(0,str(Path(__file__).resolve().parent))
    from speech_flow import prepare_flow_text

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
USER_OVERRIDES_BACKUP_DIR=LEARNING_HOME/"backups"
USER_OVERRIDES_BACKUP=USER_OVERRIDES_BACKUP_DIR/"user-overrides.latest.json"
USER_OVERRIDES_BACKUP_DIR.mkdir(parents=True,exist_ok=True)
LEARNING_CONFIRMED_AUDIO_DIR=LEARNING_HOME/"confirmed-audio"
LEARNING_CONFIRMED_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
ONLINE_LIBRARY_CACHE=LEARNING_HOME/"online-library.json"
MASTER_LIBRARY_CACHE=LEARNING_HOME/"islamic-master-library.json"
MASTER_LIBRARY_SEED=APP_HOME/"islamic-master-library.json"
LEARNING_LOG=LEARNING_HOME/"learning-log.jsonl"
RENDER_CACHE_DIR=VOICE_HOME/"RenderCache"/"v3"
CONTEXT_BRIDGE_CACHE_DIR=RENDER_CACHE_DIR/"context-bridge-v1"
LEARNING_HOME.mkdir(parents=True,exist_ok=True)
LEARNING_PENDING_DIR.mkdir(parents=True,exist_ok=True)
RENDER_CACHE_DIR.mkdir(parents=True,exist_ok=True)
CONTEXT_BRIDGE_CACHE_DIR.mkdir(parents=True,exist_ok=True)
ONLINE_LIBRARY_URL=os.environ.get(
    "DAR_VOICE_ONLINE_LIBRARY_URL",
    "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/data/pronunciation/pronunciation-rules.json"
)
MASTER_LIBRARY_URL=os.environ.get(
    "DAR_VOICE_MASTER_LIBRARY_URL",
    "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/data/pronunciation/islamic-master-library.json"
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

def validate_master_library(data):
    entries=list((data or {}).get("entries") or [])
    good=[]
    for raw in entries:
        e=dict(raw or {})
        canonical=str(e.get("canonical","")).strip()
        tts=str(e.get("tts_text") or e.get("arabic") or "").strip()
        if not canonical or not tts or not re.search(r"[\u0600-\u06ff]",tts):
            continue
        e["canonical"]=canonical
        e["tts_text"]=tts
        e["tts_language"]="ar"
        e["aliases"]=list(dict.fromkeys(
            [canonical]+[str(x).strip() for x in (e.get("aliases") or []) if str(x).strip()]
        ))
        e["status"]=str(e.get("status") or "suggestion")
        e["autoUse"]=bool(e.get("autoUse")) and e["status"]=="verified"
        good.append(e)
    return good

BASE_LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
BASE_RULES=list(BASE_LIB.get("rules",[]))

def load_persistent_user_overrides():
    primary=load_json_file(USER_OVERRIDES_FILE,{"schemaVersion":1,"rules":[]})
    rules=list((primary or {}).get("rules") or [])
    if rules:
        return primary
    backup=load_json_file(USER_OVERRIDES_BACKUP,{"schemaVersion":1,"rules":[]})
    backup_rules=list((backup or {}).get("rules") or [])
    if backup_rules:
        restored=dict(backup)
        restored["restoredAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        atomic_write_json(USER_OVERRIDES_FILE,restored)
        append_learning_log("override_restore_from_backup",rules=len(backup_rules))
        return restored
    return primary

USER_OVERRIDE_DATA=load_persistent_user_overrides()
ONLINE_LIB=load_json_file(ONLINE_LIBRARY_CACHE,{"schemaVersion":1,"rules":[],"syncedAt":None})
ONLINE_RULES=list((ONLINE_LIB or {}).get("rules") or [])
INSTALLED_MASTER_LIB=load_json_file(MASTER_LIBRARY_SEED,{"schemaVersion":1,"entries":[],"sources":{}})
ONLINE_MASTER_LIB=load_json_file(MASTER_LIBRARY_CACHE,{"schemaVersion":1,"entries":[],"sources":{},"syncedAt":None})
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
MASTER_ENTRIES=[]
MASTER_RULES=[]
MASTER_ALIAS_INDEX={}

def _rule_person_metadata(rule):
    honorific=str(rule.get("required_honorific_key",""))
    if honorific=="radiyallahu_anhu":
        return "sahabi","sahabi","male"
    if honorific=="radiyallahu_anha":
        return "sahabiyyah","sahabiyyah","female"
    if honorific=="salawat_prophet":
        return "prophet","prophet","male"
    category=str(rule.get("category") or "islamic_term")
    low=normalize_lookup(category)
    person_type="term"
    gender=""
    if "sahab" in low:
        person_type="sahabi"
    elif "tabi" in low:
        person_type="tabii"
    elif "imam" in low or "scholar" in low or "gelehrt" in low:
        person_type="scholar"
    return category,person_type,gender

def derive_master_entries_from_rules(rules,origin:str="installed-rules",qa_status:str="installed-curated"):
    grouped={}
    for r in rules:
        canonical=str(r.get("canonical") or r.get("string_to_replace") or "").strip()
        tts=str(r.get("tts_text") or "").strip()
        needle=str(r.get("string_to_replace") or "").strip()
        if not canonical or not needle or not tts or not re.search(r"[\u0600-\u06ff]",tts):
            continue
        key=(normalize_lookup(canonical),tts)
        category,person_type,gender=_rule_person_metadata(r)
        item=grouped.setdefault(key,{
            "id":"installed_"+hashlib.sha1((canonical+"|"+tts).encode("utf-8")).hexdigest()[:14],
            "canonical":canonical,
            "arabic":tts,
            "transliteration":canonical,
            "aliases":[],
            "category":category,
            "personType":person_type,
            "gender":gender,
            "tts_text":tts,
            "tts_language":"ar",
            "required_honorific_key":str(r.get("required_honorific_key","")),
            "voice_lock":str(r.get("voice_lock","")),
            "qaStatus":qa_status,
            "status":"verified",
            "autoUse":True,
            "sourceIds":["installed_user_curated_rules" if origin=="installed-rules" else "online_pronunciation_rules"],
            "origin":origin,
        })
        if needle not in item["aliases"]:
            item["aliases"].append(needle)
        alias=str(r.get("alias") or "").strip()
        if alias and alias not in item["aliases"]:
            item["aliases"].append(alias)
    return list(grouped.values())

def build_master_library():
    derived=derive_master_entries_from_rules(
        list((USER_OVERRIDE_DATA or {}).get("rules") or [])+BASE_RULES,
        origin="installed-rules",
        qa_status="installed-curated",
    )
    installed=validate_master_library(INSTALLED_MASTER_LIB)
    online=validate_master_library(ONLINE_MASTER_LIB)
    online_derived=derive_master_entries_from_rules(
        ONLINE_RULES,
        origin="online-rules",
        qa_status="online-curated",
    )
    merged={}
    # Höchste Priorität zuerst: lokale/bestätigte Regeln > installierter Seed >
    # verifizierter Master-Seed > online synchronisierte geprüfte Aussprache-Regeln.
    for source,entries in (
        ("installed-rules",derived),
        ("installed-seed",installed),
        ("online-master",online),
        ("online-rules",online_derived),
    ):
        for e in entries:
            key=normalize_lookup(e.get("canonical",""))
            if not key:
                continue
            if key not in merged:
                item=dict(e)
                item["origin"]=item.get("origin") or source
                merged[key]=item
            else:
                item=merged[key]
                aliases=list(item.get("aliases") or [])
                for alias in e.get("aliases") or []:
                    if alias not in aliases:
                        aliases.append(alias)
                item["aliases"]=aliases
                # Aussprache/tts_text der höher priorisierten lokalen Regel bleibt
                # unangetastet. Verifizierte Seed-Metadaten dürfen aber einen bisher
                # generischen "term"-Eintrag fachlich präzisieren (z. B. Mūsā -> Prophet).
                incoming_person=str(e.get("personType") or "")
                current_person=str(item.get("personType") or "")
                if incoming_person and incoming_person!="term" and current_person in ("","term"):
                    item["personType"]=incoming_person
                    item["category"]=str(e.get("category") or item.get("category") or "")
                if not str(item.get("gender") or "") and str(e.get("gender") or ""):
                    item["gender"]=str(e.get("gender"))
                if not str(item.get("required_honorific_key") or "") and str(e.get("required_honorific_key") or ""):
                    item["required_honorific_key"]=str(e.get("required_honorific_key"))
                source_ids=list(item.get("sourceIds") or [])
                for source_id in e.get("sourceIds") or []:
                    if source_id not in source_ids:
                        source_ids.append(source_id)
                item["sourceIds"]=source_ids
    return list(merged.values())

def master_rules_from_entries(entries,blocked_needles):
    out=[]
    seen=set(normalize_lookup(x) for x in blocked_needles if x)
    for e in entries:
        if not bool(e.get("autoUse")) or str(e.get("status"))!="verified":
            continue
        tts=str(e.get("tts_text") or e.get("arabic") or "").strip()
        forms=list(dict.fromkeys([str(e.get("canonical","")).strip()]+list(e.get("aliases") or [])))
        for form in forms:
            form=str(form or "").strip()
            norm=normalize_lookup(form)
            if not form or not norm or norm in seen:
                continue
            seen.add(norm)
            out.append({
                "category":str(e.get("category") or "MASTER LIBRARY"),
                "canonical":str(e.get("canonical") or form),
                "string_to_replace":form,
                "alias":str(e.get("transliteration") or e.get("canonical") or form),
                "tts_text":tts,
                "tts_language":"ar",
                "tts_strategy":"verified-islamic-master-library-v1",
                "voice_lock":"REVIEW",
                "qa_tier":"high",
                "required_honorific_key":str(e.get("required_honorific_key") or ""),
                "master_library_origin":str(e.get("origin") or ""),
                "master_library_source_ids":list(e.get("sourceIds") or []),
            })
    return out

def rebuild_runtime_rules():
    global LIB,RULES,MASTER_TTS,AUDIO_LOCK_BY_TTS,AUDIO_LOCK_LABELS,AUDIO_LOCK_FORMS
    global HONORIFIC_TTS_BY_KEY,HONORIFIC_RULE_BY_KEY,HONORIFIC_SOURCE_FORMS
    global MASTER_ENTRIES,MASTER_RULES,MASTER_ALIAS_INDEX
    user_rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    MASTER_ENTRIES=build_master_library()
    blocked=[str(r.get("string_to_replace","")) for r in user_rules+BASE_RULES]
    MASTER_RULES=master_rules_from_entries(MASTER_ENTRIES,blocked)
    # User-bestätigte Regeln stehen zuerst; installierte Regeln schlagen jeden Online-/Seed-Eintrag.
    RULES=sorted(user_rules+BASE_RULES+MASTER_RULES,key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
    MASTER_ALIAS_INDEX={}
    for e in MASTER_ENTRIES:
        for form in [e.get("canonical",""),*(e.get("aliases") or [])]:
            norm=normalize_lookup(form)
            if norm and norm not in MASTER_ALIAS_INDEX:
                MASTER_ALIAS_INDEX[norm]=e
    LIB=dict(BASE_LIB)
    LIB["rules"]=RULES
    counts=dict(BASE_LIB.get("counts") or {})
    counts["rules"]=len(RULES)
    counts["userLearnedRules"]=len(user_rules)
    counts["onlineSearchRules"]=len(ONLINE_RULES)
    counts["masterEntries"]=len(MASTER_ENTRIES)
    counts["masterAutoRules"]=len(MASTER_RULES)
    counts["masterSahaba"]=sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabi")
    counts["masterSahabiyyat"]=sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabiyyah")
    counts["masterProphets"]=sum(1 for e in MASTER_ENTRIES if e.get("personType")=="prophet")
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
# MLX läuft absichtlich in einem eigenen Prozess. Ein nativer Metal/MLX-Aufruf,
# der festhängt, kann aus einem Python-Thread nicht sicher abgebrochen werden.
# Der Elternprozess kann diesen Worker dagegen hart beenden und sauber neu starten.
MLX_MODEL_ERROR=""
MLX_MODEL_ID=os.environ.get("DAR_VOICE_MLX_MODEL","mlx-community/chatterbox-multilingual-v3")
MLX_ENABLED=os.environ.get("DAR_VOICE_DISABLE_MLX","0")!="1" and platform.machine().lower()=="arm64"
ACTIVE_BACKEND="mlx" if MLX_ENABLED and importlib.util.find_spec("mlx_audio") is not None else "torch"
MLX_PROCESS_LOCK=threading.RLock()
MLX_PROCESS=None
MLX_CONN=None
MLX_SR=24000
MLX_PROCESS_GENERATION=0
MLX_TIMEOUTS=0

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

def learning_audio_backup_path(key:str):
    safe=re.sub(r"[^a-z0-9_-]+","_",str(key or "").lower()).strip("_")
    return LEARNING_CONFIRMED_AUDIO_DIR/f"{safe}.wav"

def audio_lock_path(key:str):
    safe=re.sub(r"[^a-z0-9_-]+","_",str(key or "").lower()).strip("_")
    dst=MASTER_AUDIO_DIR/f"{safe}.wav"
    if not dst.exists():
        backup=learning_audio_backup_path(key)
        if backup.exists() and backup.stat().st_size>44:
            try:
                tmp=dst.with_suffix(".restore.tmp.wav")
                shutil.copy2(backup,tmp)
                os.replace(tmp,dst)
                append_learning_log("audio_lock_restore_from_backup",lockKey=key)
            except Exception as e:
                print("[DĀR Voice] audio-lock backup restore warning",e,flush=True)
    return dst

def confirmed_audio_lock_keys():
    return sorted(key for key in set(AUDIO_LOCK_BY_TTS.values()) if key and audio_lock_path(key).exists())

def pending_audio_lock_keys():
    with AUDIO_LOCK_STATE_LOCK:
        return sorted(PENDING_AUDIO_LOCKS)

def load_locked_wav(path:Path,target_sr:int):
    """Lädt MASTER-/Cache-WAV robust und migriert alte IEEE-Float-WAVs auf PCM16.

    Python wave akzeptiert WAV format code 3 (IEEE float) nicht. Ältere
    torchaudio-Versionen konnten genau dieses Format erzeugen. Darum wird ein
    solcher Altbestand einmalig mit torchaudio oder ffmpeg gelesen und danach
    atomar als PCM16-WAV zurückgeschrieben.
    """
    import numpy as np, torch, wave
    cache_key=(str(path),int(target_sr),file_signature(path))
    cached=AUDIO_WAV_CACHE.get(cache_key)
    if cached is not None:
        return cached.clone()

    def read_pcm16(p:Path):
        with wave.open(str(p),"rb") as wf:
            channels=wf.getnchannels()
            width=wf.getsampwidth()
            sr=wf.getframerate()
            frames=wf.readframes(wf.getnframes())
        if width!=2:
            raise wave.Error(f"unsupported PCM sample width: {width}")
        arr=np.frombuffer(frames,dtype=np.int16).astype(np.float32)/32767.0
        if channels>1:
            arr=arr.reshape(-1,channels).mean(axis=1)
        return torch.from_numpy(arr).view(1,-1),int(sr)

    try:
        w,sr=read_pcm16(path)
    except (wave.Error,EOFError) as first:
        migrated=False
        load_error=None
        try:
            import torchaudio as ta
            w,sr=ta.load(str(path))
            w=w.detach().float().cpu()
            if w.ndim==1:
                w=w.unsqueeze(0)
            if w.ndim>2:
                w=w.reshape(w.shape[0],-1)
            if w.shape[0]>1:
                w=w.mean(dim=0,keepdim=True)
            if not bool(torch.isfinite(w).all().item()):
                raise RuntimeError("nicht-finite Samples im Legacy-WAV")
            tmp=path.with_name(path.name+f".pcm16.{os.getpid()}.{uuid.uuid4().hex[:8]}.wav")
            try:
                save_wav(tmp,w,int(sr))
                os.replace(tmp,path)
                migrated=True
            finally:
                try: tmp.unlink(missing_ok=True)
                except Exception: pass
        except Exception as e:
            load_error=e

        if not migrated:
            ffmpeg=find_ffmpeg()
            if not ffmpeg:
                raise RuntimeError(
                    f"WAV nicht lesbar ({first}); Legacy-Konvertierung fehlgeschlagen ({load_error})"
                ) from load_error
            tmp=path.with_name(path.name+f".ffmpeg-pcm16.{os.getpid()}.{uuid.uuid4().hex[:8]}.wav")
            try:
                p=subprocess.run(
                    [ffmpeg,"-y","-v","error","-i",str(path),"-vn","-ac","1","-c:a","pcm_s16le",str(tmp)],
                    capture_output=True,text=True
                )
                if p.returncode!=0 or not tmp.exists() or tmp.stat().st_size<=44:
                    detail=(p.stderr or "")[-1200:]
                    raise RuntimeError("Legacy-WAV konnte nicht nach PCM16 konvertiert werden. "+detail)
                os.replace(tmp,path)
                w,sr=read_pcm16(path)
                migrated=True
            finally:
                try: tmp.unlink(missing_ok=True)
                except Exception: pass

        if migrated:
            print("[DĀR Voice] legacy WAV migrated to PCM16:",path,flush=True)

    if int(sr)!=int(target_sr) and w.shape[-1]>1:
        new_len=max(1,round(w.shape[-1]*float(target_sr)/float(sr)))
        w=torch.nn.functional.interpolate(w.unsqueeze(0),size=new_len,mode="linear",align_corners=False).squeeze(0)
    final_key=(str(path),int(target_sr),file_signature(path))
    AUDIO_WAV_CACHE[final_key]=w.clone()
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

def _persist_user_override_data(data:dict):
    """Primärdatei + lokale Sicherung atomar schreiben.

    Updates der Voice-Studio-App ändern diese Dateien nicht; sie liegen bewusst
    außerhalb des App-Verzeichnisses unter ~/SerhatVoice/PronunciationLearning.
    """
    atomic_write_json(USER_OVERRIDES_FILE,data)
    atomic_write_json(USER_OVERRIDES_BACKUP,data)

def learned_canonical_forms(term:str,canonical:str,tts_text:str):
    """Alle bekannten Schreibvarianten derselben bestätigten Aussprache sammeln.

    So wird nicht nur exakt 'Ismāʿīl' gespeichert, sondern die komplette lokale
    kanonische Gruppe. Ein anderer Alias darf später nicht wieder als REVIEW auftauchen.
    """
    term=str(term or "").strip()
    canonical=str(canonical or term).strip()
    tts_text=str(tts_text or "").strip()
    target_norms={normalize_lookup(x) for x in (term,canonical) if x}
    canonical_norm=normalize_lookup(canonical)
    forms=[]

    def add(value):
        value=str(value or "").strip()
        if value and value not in forms:
            forms.append(value)

    add(term); add(canonical)

    for e in MASTER_ENTRIES:
        e_can=str(e.get("canonical","")).strip()
        e_tts=str(e.get("tts_text") or e.get("arabic") or "").strip()
        e_norm=normalize_lookup(e_can)
        if (e_norm and e_norm in target_norms) or (canonical_norm and e_norm==canonical_norm):
            add(e_can)
            for alias in e.get("aliases") or []:
                add(alias)

    for pool in (BASE_RULES,MASTER_RULES,ONLINE_RULES):
        for r in pool:
            r_can=str(r.get("canonical") or r.get("string_to_replace") or "").strip()
            r_tts=str(r.get("tts_text","")).strip()
            r_norm=normalize_lookup(r_can)
            if (r_norm and r_norm in target_norms) or (canonical_norm and r_norm==canonical_norm):
                add(r.get("string_to_replace"))
                add(r_can)

    return forms

def save_user_override_group(rule:dict,forms=None):
    global USER_OVERRIDE_DATA
    needle=str(rule.get("string_to_replace","")).strip()
    if not needle:
        raise ValueError("Zu lernendes Wort fehlt.")

    forms=list(forms or [needle])
    if needle not in forms:
        forms.insert(0,needle)
    forms=[str(x).strip() for x in forms if str(x).strip()]
    forms=list(dict.fromkeys(forms))
    normalized={normalize_lookup(x) for x in forms if normalize_lookup(x)}

    rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    # Alte Varianten derselben lokalen Lerngruppe komplett ersetzen.
    rules=[
        r for r in rules
        if normalize_lookup(r.get("string_to_replace","")) not in normalized
        and str(r.get("learned_group_id",""))!=str(rule.get("learned_group_id",""))
    ]

    group_rules=[]
    for form in forms:
        item=dict(rule)
        item["string_to_replace"]=form
        item["voice_lock"]="MASTER"
        item["priority"]="user-master"
        item["learned_alias_count"]=len(forms)
        group_rules.append(item)

    USER_OVERRIDE_DATA={
        "schemaVersion":3,
        "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "rules":group_rules+rules,
    }
    _persist_user_override_data(USER_OVERRIDE_DATA)
    rebuild_runtime_rules()
    return group_rules

def save_user_override(rule:dict):
    saved=save_user_override_group(rule,[str(rule.get("string_to_replace","")).strip()])
    return saved[0]

def migrate_existing_user_override_groups():
    """Alte, bereits bestätigte Lernwörter automatisch auf die neue Gruppenlogik
    anheben. Der Nutzer muss sie nach einem Update nicht erneut testen."""
    global USER_OVERRIDE_DATA
    old_rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    if not old_rules:
        return 0

    expanded=[]
    seen=set()
    changed=False
    for rule in old_rules:
        if str(rule.get("voice_lock",""))=="MASTER" and str(rule.get("tts_text","")).strip():
            forms=learned_canonical_forms(
                str(rule.get("string_to_replace","")),
                str(rule.get("canonical") or rule.get("string_to_replace") or ""),
                str(rule.get("tts_text",""))
            )
            if len(forms)>1:
                changed=True
            group_id=str(rule.get("learned_group_id") or rule.get("audio_lock_key") or learning_lock_key(str(rule.get("string_to_replace",""))))
            for form in forms or [str(rule.get("string_to_replace",""))]:
                norm=normalize_lookup(form)
                key=(norm,str(rule.get("tts_text","")))
                if not norm or key in seen:
                    continue
                seen.add(key)
                item=dict(rule)
                item["string_to_replace"]=form
                item["voice_lock"]="MASTER"
                item["priority"]="user-master"
                item["learned_group_id"]=group_id
                item["learned_alias_count"]=len(forms or [form])
                expanded.append(item)
        else:
            norm=normalize_lookup(rule.get("string_to_replace",""))
            key=(norm,str(rule.get("tts_text","")))
            if key in seen:
                continue
            seen.add(key)
            expanded.append(rule)

    if changed or len(expanded)!=len(old_rules):
        USER_OVERRIDE_DATA={
            "schemaVersion":3,
            "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "migratedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "rules":expanded,
        }
        _persist_user_override_data(USER_OVERRIDE_DATA)
        rebuild_runtime_rules()
        append_learning_log("override_group_migration",before=len(old_rules),after=len(expanded))
    return max(0,len(expanded)-len(old_rules))

migrate_existing_user_override_groups()

def combined_search_rules():
    seen=set();out=[]
    sources=[
        ("gelernt",list((USER_OVERRIDE_DATA or {}).get("rules") or [])),
        ("installiert",BASE_RULES),
        ("master",MASTER_RULES),
        ("online",ONLINE_RULES),
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
        priority={"gelernt":0,"installiert":1,"master":2,"online":3}.get(source,4)
        scored.append((score,priority,source,r))
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

def _download_json(url:str,timeout:int=15):
    req=urllib.request.Request(url,headers={"User-Agent":"DARVoiceStudio/2.7"})
    with urllib.request.urlopen(req,timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def sync_online_pronunciation_library():
    global ONLINE_LIB,ONLINE_RULES,ONLINE_MASTER_LIB
    data=_download_json(ONLINE_LIBRARY_URL,15)
    rules=validate_online_library(data)
    master_data=_download_json(MASTER_LIBRARY_URL,15)
    master_entries=validate_master_library(master_data)
    if len(master_entries)<25:
        raise ValueError("Islamische Master-Bibliothek ist unvollständig.")

    synced=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    cached={
        "schemaVersion":1,
        "syncedAt":synced,
        "source":ONLINE_LIBRARY_URL,
        "rules":rules,
    }
    master_cached=dict(master_data)
    master_cached["schemaVersion"]=max(1,int(master_cached.get("schemaVersion",1) or 1))
    master_cached["syncedAt"]=synced
    master_cached["source"]=MASTER_LIBRARY_URL
    master_cached["entries"]=master_entries

    atomic_write_json(ONLINE_LIBRARY_CACHE,cached)
    atomic_write_json(MASTER_LIBRARY_CACHE,master_cached)
    ONLINE_LIB=cached
    ONLINE_RULES=rules
    ONLINE_MASTER_LIB=master_cached
    rebuild_runtime_rules()
    append_learning_log("online_sync",rules=len(rules),masterEntries=len(master_entries))
    return {"rules":len(rules),"masterEntries":len(master_entries),"syncedAt":synced}

def find_learning_rule(term:str,tts_text:str="",canonical:str=""):
    tts_text=str(tts_text or "").strip()
    canonical=str(canonical or "").strip()
    term=str(term or "").strip()
    pools=[list((USER_OVERRIDE_DATA or {}).get("rules") or []),BASE_RULES,MASTER_RULES,ONLINE_RULES]
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
    audio_backup=learning_audio_backup_path(lock_key)
    audio_backup_tmp=audio_backup.with_suffix(".tmp.wav")
    shutil.copy2(dst,audio_backup_tmp)
    os.replace(audio_backup_tmp,audio_backup)
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
        "learned_group_id":lock_key,
    }
    if meta.get("required_honorific_key"):
        rule["required_honorific_key"]=meta["required_honorific_key"]
    forms=learned_canonical_forms(term,rule["canonical"],rule["tts_text"])
    saved_rules=save_user_override_group(rule,forms)
    append_learning_log(
        "confirmed",term=term,canonical=rule["canonical"],lockKey=lock_key,
        savedForms=[r.get("string_to_replace") for r in saved_rules]
    )
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
        "masterUrl":MASTER_LIBRARY_URL,
        "masterEntries":len(MASTER_ENTRIES),
        "masterAutoRules":len(MASTER_RULES),
        "masterSahaba":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabi"),
        "masterSahabiyyat":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabiyyah"),
        "masterProphets":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="prophet"),
        "autoSyncHours":24,
        "learnedTerms":[str(r.get("string_to_replace","")) for r in user_rules[:100]],
        "learnedCanonicals":list(dict.fromkeys(
            str(r.get("canonical") or r.get("string_to_replace",""))
            for r in user_rules if r.get("voice_lock")=="MASTER"
        ))[:100],
        "persistentPath":str(USER_OVERRIDES_FILE),
        "backupPath":str(USER_OVERRIDES_BACKUP),
        "persistent":True,
    }

ISLAMIC_DISTINCTIVE_RE=re.compile(r"[ʿʾāīūḥṣḍṭẓḏṯšǧġḫĀĪŪḤṢḌṬẒḎṮŠǦĠḪ]|[\u0600-\u06ff]")
ISLAMIC_NAME_PART_RE=re.compile(
    r"^(?:abū|abu|umm|ibn|bin|bint|ʿabd|abd|al-|aš-|ash-|ath-|at-|ar-|as-|az-|ad-)",
    re.I
)

def master_suggestions(query:str,limit:int=5):
    q=normalize_lookup(query)
    if not q:
        return []
    scored=[]
    for e in MASTER_ENTRIES:
        forms=[str(e.get("canonical",""))]+[str(x) for x in (e.get("aliases") or [])]
        norms=[normalize_lookup(x) for x in forms if x]
        if not norms:
            continue
        score=max(difflib.SequenceMatcher(None,q,n).ratio() for n in norms)
        if any(n==q for n in norms):
            score=1.0
        elif any(q in n or n in q for n in norms if min(len(q),len(n))>=4):
            score=max(score,0.92)
        if score>=0.48:
            scored.append((score,e))
    scored.sort(key=lambda x:-x[0])
    out=[];seen=set()
    for score,e in scored:
        key=normalize_lookup(e.get("canonical",""))
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "score":round(float(score),3),
            "canonical":str(e.get("canonical","")),
            "arabic":str(e.get("tts_text") or e.get("arabic") or ""),
            "category":str(e.get("category") or ""),
            "personType":str(e.get("personType") or ""),
            "gender":str(e.get("gender") or ""),
            "requiredHonorificKey":str(e.get("required_honorific_key") or ""),
            "origin":str(e.get("origin") or ""),
            "sourceIds":list(e.get("sourceIds") or []),
        })
        if len(out)>=max(1,min(10,int(limit))):
            break
    return out

def detect_unresolved_islamic_terms(text:str,limit:int=12):
    tokens=re.findall(r"[^\s,.;:!?؟،؛()\[\]{}«»\"“”„]+",str(text or ""))
    if not tokens:
        return []
    out=[];seen=set()
    i=0
    while i<len(tokens):
        token=tokens[i]
        distinctive=bool(ISLAMIC_DISTINCTIVE_RE.search(token) or ISLAMIC_NAME_PART_RE.search(token))
        if not distinctive:
            i+=1
            continue

        end=min(len(tokens),i+5)
        candidates=[]
        for j in range(i+1,end+1):
            phrase=" ".join(tokens[i:j]).strip()
            if phrase:
                candidates.append((phrase,j-i))

        # Exakte bekannte Mehrwortnamen haben immer Vorrang. So wird z. B.
        # „ʿAbdullāh ibn Masʿūd sagte“ nicht als unbekannter Vierwortname markiert.
        exact=None
        for phrase,width in reversed(candidates):
            if normalize_lookup(phrase) in MASTER_ALIAS_INDEX:
                exact=(phrase,width)
                break
        if exact:
            i+=max(1,int(exact[1]))
            continue

        best=None
        for phrase,width in candidates:
            suggestions=master_suggestions(phrase,3)
            score=float((suggestions[0] or {}).get("score",0)) if suggestions else 0.0
            if best is None or score>best[0]:
                best=(score,phrase,width,suggestions)
        if best and best[0]>=0.78:
            _,phrase,width,suggestions=best
            chosen=(phrase,suggestions)
        else:
            norm=normalize_lookup(token)
            chosen=None if norm in MASTER_ALIAS_INDEX else (token,master_suggestions(token,3))

        if chosen:
            phrase,suggestions=chosen
            norm=normalize_lookup(phrase)
            if norm and norm not in seen:
                seen.add(norm)
                out.append({
                    "term":phrase,
                    "normalized":norm,
                    "reason":"unknown-islamic-shaped-token",
                    "suggestions":suggestions,
                })
                if len(out)>=max(1,min(25,int(limit))):
                    break
        i+=1
    return out

def online_sync_is_stale(max_age_hours:int=24):
    try:
        if not ONLINE_LIBRARY_CACHE.exists() or not MASTER_LIBRARY_CACHE.exists():
            return True
        age=min(
            time.time()-ONLINE_LIBRARY_CACHE.stat().st_mtime,
            time.time()-MASTER_LIBRARY_CACHE.stat().st_mtime,
        )
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
    out["performance_engine"]="continuous-sentence-flow-v3"
    out["reference_prepares_total"]=MODEL_REFERENCE_PREPARES
    out["reference_cache_hits_total"]=MODEL_REFERENCE_CACHE_HITS
    out["render_cache"]=dict(RENDER_CACHE_STATS)
    out["long_form_guard"]={"deMaxChars":150,"arMaxChars":96,"maxNewTokens":620}
    out["production_backend"]=ACTIVE_BACKEND
    if ACTIVE_BACKEND=="mlx" and out.get("model_state")=="ready":
        out["model_device"]="mlx-metal"
    out["mlx_enabled"]=bool(MLX_ENABLED)
    out["mlx_model"]=MLX_MODEL_ID if MLX_ENABLED else None
    out["mlx_error"]=MLX_MODEL_ERROR
    out["mlx_worker_supervised"]=True
    out["mlx_worker_pid"]=int(MLX_PROCESS.pid) if MLX_PROCESS is not None and MLX_PROCESS.is_alive() else None
    out["mlx_worker_generation"]=int(MLX_PROCESS_GENERATION)
    out["mlx_watchdog_timeouts"]=int(MLX_TIMEOUTS)
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

class GenerationTimeoutReached(RuntimeError):
    pass

class MLXModelAdapter:
    _dar_backend="mlx"
    def __init__(self,sr:int=24000):
        self.sr=int(sr or 24000)

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

def generation_timeout_seconds(text:str,language_id:str):
    forced=str(os.environ.get("DAR_VOICE_SEGMENT_TIMEOUT_SECONDS","")).strip()
    if forced:
        try:
            return max(20.0,min(180.0,float(forced)))
        except Exception:
            pass
    chars=len(re.sub(r"\s+","",str(text or "")))
    if language_id=="ar":
        return max(32.0,min(60.0,22.0+chars*0.42))
    return max(38.0,min(85.0,24.0+chars*0.42))

def _mlx_process_main(conn,model_id:str):
    """Persistenter MLX-Worker. Nur dieser Prozess besitzt Modell + Metal-Kontext."""
    try:
        import numpy as np
        from mlx_audio.tts.utils import load_model as mlx_load_model

        model=mlx_load_model(model_id)
        sr=int(getattr(model,"sample_rate",24000) or 24000)
        conditionals={}
        conn.send({"kind":"ready","sr":sr,"pid":os.getpid()})

        while True:
            try:
                cmd=conn.recv()
            except EOFError:
                break
            op=str((cmd or {}).get("op",""))
            if op=="stop":
                break
            if op not in ("warm","render"):
                conn.send({"kind":"error","code":"bad_op","error":"Unbekannter MLX-Worker-Auftrag."})
                continue

            ref_path=str(cmd.get("ref_path",""))
            exaggeration=float(cmd.get("exaggeration",0.2))
            ref_key=(file_signature(Path(ref_path)),round(exaggeration,6))
            conds=conditionals.get(ref_key)
            if conds is None:
                try:
                    conds=model.prepare_conditionals(ref_path,sr,exaggeration)
                except TypeError:
                    try:
                        conds=model.prepare_conditionals(ref_path,sr)
                    except TypeError:
                        conds=model.prepare_conditionals(ref_path)
                conditionals[ref_key]=conds

            if op=="warm":
                conn.send({"kind":"warm","sr":sr})
                continue

            max_tokens=int(cmd.get("max_tokens",300))
            result=None
            try:
                for item in model.generate(
                    text=str(cmd.get("text","")),
                    conds=conds,
                    exaggeration=exaggeration,
                    cfg_weight=float(cmd.get("cfg_weight",0.0)),
                    temperature=float(cmd.get("temperature",0.5)),
                    repetition_penalty=1.2,
                    min_p=0.05,
                    top_p=1.0,
                    max_new_tokens=max_tokens,
                    lang_code=str(cmd.get("language_id","de")),
                    verbose=False,
                ):
                    result=item
            except BaseException as e:
                conn.send({
                    "kind":"error","code":"generate_exception",
                    "error":f"{type(e).__name__}: {e}",
                    "traceback":traceback.format_exc()[-5000:],
                })
                continue

            if result is None:
                conn.send({"kind":"error","code":"empty","error":"MLX hat kein Audio geliefert."})
                continue

            token_count=int(getattr(result,"token_count",0) or 0)
            if token_count>=max_tokens-3:
                conn.send({
                    "kind":"error","code":"token_limit",
                    "error":f"MLX token ceiling reached ({token_count}/{max_tokens})",
                })
                continue

            arr=np.asarray(result.audio,dtype=np.float32)
            if arr.ndim>1:
                arr=arr.reshape(-1)
            arr=np.ascontiguousarray(arr,dtype=np.float32)
            conn.send({
                "kind":"result",
                "sr":sr,
                "audio":arr.tobytes(),
                "samples":int(arr.size),
                "meta":{
                    "mlx_token_count":token_count,
                    "mlx_max_tokens":max_tokens,
                    "mlx_processing_seconds":round(float(getattr(result,"processing_time_seconds",0.0) or 0.0),3),
                    "mlx_rtf":round(float(getattr(result,"real_time_factor",0.0) or 0.0),4),
                },
            })
    except BaseException as e:
        try:
            conn.send({
                "kind":"fatal","error":f"{type(e).__name__}: {e}",
                "traceback":traceback.format_exc()[-5000:],
            })
        except Exception:
            pass
    finally:
        try: conn.close()
        except Exception: pass

def _mlx_process_alive():
    return MLX_PROCESS is not None and MLX_PROCESS.is_alive() and MLX_CONN is not None

def _stop_mlx_process(reason:str=""):
    global MLX_PROCESS,MLX_CONN
    with MLX_PROCESS_LOCK:
        proc=MLX_PROCESS
        conn=MLX_CONN
        MLX_PROCESS=None
        MLX_CONN=None
        if conn is not None:
            try: conn.close()
            except Exception: pass
        if proc is not None and proc.is_alive():
            try: proc.terminate()
            except Exception: pass
            try: proc.join(timeout=2.5)
            except Exception: pass
            if proc.is_alive():
                try: proc.kill()
                except Exception: pass
                try: proc.join(timeout=1.0)
                except Exception: pass
        if reason:
            print(f"[DĀR Voice] MLX worker stopped: {reason}",flush=True)

def _start_mlx_process():
    global MLX_PROCESS,MLX_CONN,MLX_SR,MLX_PROCESS_GENERATION,MLX_MODEL_ERROR
    with MLX_PROCESS_LOCK:
        if _mlx_process_alive():
            return int(MLX_SR)
        _stop_mlx_process("restart before start")
        ctx=mp.get_context("spawn")
        parent_conn,child_conn=ctx.Pipe(duplex=True)
        proc=ctx.Process(
            target=_mlx_process_main,
            args=(child_conn,MLX_MODEL_ID),
            name="dar-mlx-synth",
            daemon=True,
        )
        MLX_PROCESS=proc
        MLX_CONN=parent_conn
        proc.start()
        try: child_conn.close()
        except Exception: pass

        if not parent_conn.poll(180.0):
            _stop_mlx_process("model start timeout")
            MLX_MODEL_ERROR="MLX-Modellstart hat das 180-s-Limit überschritten."
            raise GenerationTimeoutReached(MLX_MODEL_ERROR)
        try:
            msg=parent_conn.recv()
        except EOFError as e:
            _stop_mlx_process("model worker exited during start")
            raise RuntimeError("MLX-Worker wurde beim Modellstart beendet.") from e
        if msg.get("kind")!="ready":
            detail=str(msg.get("error") or "MLX-Worker konnte nicht gestartet werden.")
            _stop_mlx_process("model start error")
            MLX_MODEL_ERROR=detail
            raise RuntimeError(detail)

        MLX_SR=int(msg.get("sr",24000) or 24000)
        MLX_PROCESS_GENERATION+=1
        MLX_MODEL_ERROR=""
        print(f"[DĀR Voice] MLX worker ready pid={msg.get('pid')} generation={MLX_PROCESS_GENERATION}",flush=True)
        return int(MLX_SR)

def _mlx_request(payload:dict,timeout_s:float,heartbeat:bool=True):
    global MLX_TIMEOUTS
    with MLX_PROCESS_LOCK:
        _start_mlx_process()
        if not _mlx_process_alive():
            raise RuntimeError("MLX-Worker ist nicht verfügbar.")
        try:
            MLX_CONN.send(payload)
        except Exception as e:
            _stop_mlx_process("send failed")
            raise RuntimeError("MLX-Auftrag konnte nicht gestartet werden.") from e

        started=time.monotonic()
        base_progress=int(get_status().get("progress",0) or 0)
        next_heartbeat=2.0
        while True:
            elapsed=time.monotonic()-started
            remaining=max(0.0,float(timeout_s)-elapsed)
            if remaining<=0.0:
                MLX_TIMEOUTS+=1
                set_status(
                    progress=max(base_progress,int(get_status().get("progress",0) or 0)),
                    message=f"Abschnitt reagiert nicht · Rescue startet nach {int(round(timeout_s))} s …"
                )
                _stop_mlx_process(f"segment timeout after {timeout_s:.1f}s")
                raise GenerationTimeoutReached(
                    f"generation_timeout: MLX watchdog exceeded {timeout_s:.1f}s"
                )

            try:
                ready=MLX_CONN.poll(min(0.35,remaining))
            except (EOFError,OSError) as e:
                _stop_mlx_process("poll failed")
                raise RuntimeError("MLX-Worker-Verbindung wurde unterbrochen.") from e

            if ready:
                try:
                    msg=MLX_CONN.recv()
                except EOFError as e:
                    _stop_mlx_process("worker exited")
                    raise RuntimeError("MLX-Worker wurde während der Synthese beendet.") from e
                kind=str(msg.get("kind",""))
                if kind in ("result","warm"):
                    return msg
                code=str(msg.get("code",""))
                detail=str(msg.get("error") or "Unbekannter MLX-Fehler.")
                if code=="token_limit":
                    raise GenerationTokenLimitReached(detail)
                if kind=="fatal":
                    _stop_mlx_process("fatal worker error")
                raise RuntimeError(detail)

            if heartbeat and elapsed>=next_heartbeat:
                current=int(get_status().get("progress",base_progress) or base_progress)
                pulse=min(86,max(current,base_progress+min(5,int(elapsed//8))))
                set_status(
                    progress=pulse,
                    message=f"Synthese läuft · {int(elapsed)} s · Watchdog aktiv"
                )
                next_heartbeat+=2.0

def load_mlx_model():
    global ACTIVE_BACKEND
    if not MLX_ENABLED or importlib.util.find_spec("mlx_audio") is None:
        raise RuntimeError("MLX Audio ist auf diesem System nicht verfügbar.")
    set_status(model_state="loading",model_device="mlx-metal",message="Chatterbox V3 · MLX wird geladen …",last_error="")
    try:
        sr=_start_mlx_process()
        adapter=MLXModelAdapter(sr)
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

def render_with_mlx(model,text:str,language_id:str,mode:str):
    import numpy as np, torch
    ref=reference_for_language(language_id)
    p=prosody_settings(mode,language_id,text)
    budget=mlx_token_budget(text,language_id)
    timeout_s=generation_timeout_seconds(text,language_id)
    msg=_mlx_request({
        "op":"render",
        "ref_path":str(ref),
        "text":str(text),
        "language_id":str(language_id),
        "exaggeration":float(p["exaggeration"]),
        "cfg_weight":float(p["cfg_weight"]),
        "temperature":float(p["temperature"]),
        "max_tokens":int(budget),
    },timeout_s=timeout_s,heartbeat=True)
    arr=np.frombuffer(msg.get("audio",b""),dtype=np.float32).copy()
    expected=int(msg.get("samples",arr.size) or arr.size)
    if arr.size!=expected or arr.size==0:
        raise RuntimeError("MLX-Worker lieferte ein unvollständiges Audiosegment.")
    wav=torch.from_numpy(arr).view(1,-1)
    return wav,dict(msg.get("meta") or {})

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

            install_t3_generation_guard(model)
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
            # Modell + Referenzkonditionierung im überwachten Prozess vorwärmen.
            for lang,probe in (("de","Warmup"),("ar","تجربة")):
                ref=reference_for_language(lang)
                p=prosody_settings("narration",lang,probe)
                _mlx_request({
                    "op":"warm",
                    "ref_path":str(ref),
                    "exaggeration":float(p["exaggeration"]),
                },timeout_s=75.0,heartbeat=False)
        else:
            prepare_reference_if_needed(model,"de",prosody_settings("narration","de","Warmup")["exaggeration"])
            if REF_AR.exists() and file_signature(REF_AR)!=file_signature(REF_DE):
                prepare_reference_if_needed(model,"ar",prosody_settings("narration","ar","تجربة")["exaggeration"])
            prepare_reference_if_needed(model,"de",prosody_settings("narration","de","Warmup")["exaggeration"])
        cleanup_render_cache()
    except Exception:
        pass

def split_chunks(text:str,max_chars:int=150):
    """Flow-aware Chunking: nie stumpf mitten im Satz schneiden, wenn eine
    natürliche Phrasengrenze vorhanden ist.

    Reihenfolge der Trennstellen:
    1. echtes Satzende
    2. Komma/Semikolon/Doppelpunkt/Gedankenstrich
    3. natürliche Konjunktion
    4. nur als letzter Notfall eine Wortgrenze

    Dadurch bekommt das TTS-Modell zusammenhängende Sinnphrasen statt
    willkürlicher Zeichenblöcke; die Satzmelodie bleibt deutlich stabiler.
    """
    value=re.sub(r"\s+"," ",str(text or "")).strip()
    if not value:
        return []
    if len(value)<=max_chars:
        return [value]

    def split_long_piece(piece:str):
        out=[]
        rest=piece.strip()
        floor=max(24,int(max_chars*0.48))
        while len(rest)>max_chars:
            window=rest[:max_chars+1]
            cuts=[]

            # Phrasenzeichen bleiben am linken Chunk.
            for m in re.finditer(r"[,،;؛:]\s+|\s+[–—]\s+",window):
                cut=m.end()
                if floor<=cut<=max_chars:
                    cuts.append((3,cut))

            # Konjunktion beginnt den rechten Chunk, damit sie prosodisch
            # nicht wie das Ende des vorigen Satzteils klingt.
            for m in re.finditer(
                r"\s+(?:und|oder|aber|denn|doch|weil|wenn|während|sowie|obwohl|damit|dass)\s+",
                window,flags=re.I
            ):
                cut=m.start()
                if floor<=cut<=max_chars:
                    cuts.append((2,cut))

            # Letzter Fallback: saubere Wortgrenze nahe dem Limit.
            if not cuts:
                spaces=[m.start() for m in re.finditer(r"\s+",window) if floor<=m.start()<=max_chars]
                if spaces:
                    cuts.append((1,spaces[-1]))

            if not cuts:
                # Extrem langes Einzelwort / URL: harte Grenze ist besser als
                # ein unendlicher Render; normalerweise nie erreicht.
                cut=max_chars
            else:
                # Höchste Qualitätsklasse zuerst, darin die späteste Stelle.
                best_quality=max(q for q,_ in cuts)
                cut=max(pos for q,pos in cuts if q==best_quality)

            left=rest[:cut].strip()
            right=rest[cut:].strip()
            if not left or not right:
                cut=min(max_chars,max(1,len(rest)-1))
                left=rest[:cut].strip()
                right=rest[cut:].strip()
            out.append(left)
            rest=right

        if rest:
            out.append(rest)
        return out

    # Jeder Satz bleibt eine eigene QA-/Retry-Einheit. Das kostet bei langen
    # Dokumenten ein paar zusätzliche Modellaufrufe, verhindert aber, dass eine
    # fehlerhafte Pause in Satz 2 den korrekt gesprochenen Satz 1 mitreißt.
    sentences=[p.strip() for p in re.split(r"(?<=[.!?؟…])\s+",value) if p.strip()]
    chunks=[]
    for sentence in sentences:
        if len(sentence)>max_chars:
            chunks.extend(split_long_piece(sentence))
        else:
            chunks.append(sentence)
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
    # Ein normaler Satz mit Relativ-/Infinitivkomma und "und" ist keine Liste.
    # Der frühere Shortcut erzeugte unnötig abgehackte Listen-Prosodie.
    if value.count(",")>=3 or value.count(";")>=2 or ":" in value:
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
        # Kurze arabische Begriffe werden mitten in deutscher Narration als Teil des
        # Satzflusses gesprochen, nicht wie eine separate Ansage. Etwas mehr
        # Beweglichkeit verhindert langes Dehnen; Temperatur bleibt kontrolliert.
        exaggeration=max(0.18,min(exaggeration,0.24))
        temperature=min(temperature,0.46)
        cfg=0.0

    if audio_lock_key_for_chunk(text):
        # Kernbegriffe bleiben stabil, dürfen aber akustisch nicht aus dem Satz
        # herausfallen. Extrem niedrige Exaggeration machte sie unnötig langsam.
        exaggeration=max(0.14,min(exaggeration,0.20))
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

def contextual_bridge_direction(plan,index:int):
    """DE↔AR-Grenzen erhalten Kontext-Rendering statt isolierter Mini-Fragmente."""
    if index<0 or index>=len(plan):
        return ""
    lang,text=plan[index]
    if lang!="de":
        return ""
    value=str(text or "").strip()
    if not value:
        return ""
    prev_item=plan[index-1] if index>0 else None
    next_item=plan[index+1] if index+1<len(plan) else None
    if next_item and next_item[0]=="ar" and not re.search(r"[.!?؟…,:;،؛]$",value):
        return "lead-in"
    if prev_item and prev_item[0]=="ar":
        prev_text=str(prev_item[1] or "").strip()
        if not re.search(r"[.!?؟…,:;،؛]$",prev_text):
            return "follow-on"
    return ""

def context_bridge_cache_key(text:str,language_id:str,mode:str,direction:str):
    payload={
        "schema":1,
        "kind":"context-bridge",
        "direction":str(direction),
        "text":str(text),
        "language":str(language_id),
        "mode":str(mode),
        "reference":file_signature(reference_for_language(language_id)),
    }
    raw=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def context_bridge_cache_path(key:str):
    return CONTEXT_BRIDGE_CACHE_DIR/f"{key}.wav"

def _find_context_separator(wav,sr:int,expected_fraction:float):
    import torch
    w=normalize_segment_shape(wav)
    if not w.numel():
        return None
    env=w.abs().amax(dim=0)
    peak=float(env.max().item()) if env.numel() else 0.0
    if peak<=1e-7:
        return None
    frame=max(1,int(sr*0.010))
    count=env.numel()//frame
    if count<12:
        return None
    levels=env[:count*frame].reshape(count,frame).mean(dim=1)
    center=int(max(2,min(count-3,round(count*float(expected_fraction)))))
    radius=max(4,int(count*0.18))
    lo=max(2,center-radius)
    hi=min(count-2,center+radius)
    if hi<=lo:
        return None
    window=levels[lo:hi]
    idx=lo+int(torch.argmin(window).item())
    floor=max(peak*0.055,0.00035)
    if float(levels[idx].item())>floor:
        return None
    start=idx
    end=idx+1
    while start>lo and float(levels[start-1].item())<=floor:
        start-=1
    while end<hi and float(levels[end].item())<=floor:
        end+=1
    if (end-start)*10<20:
        return None
    return start*frame,min(w.shape[-1],end*frame)

def _crop_context_bridge_audio(wav,sr:int,source_text:str,context_text:str,direction:str):
    w=normalize_segment_shape(wav)
    if direction=="lead-in":
        expected=(len(str(source_text))+1)/max(2,len(str(context_text))+1)
    else:
        expected=len("weiter, ")/max(2,len(str(context_text))+1)
    sep=_find_context_separator(w,sr,expected)
    if not sep:
        return None,{"context_bridge":False,"reason":"separator_not_found"}
    start,end=sep
    out=w[...,:start] if direction=="lead-in" else w[...,end:]
    out=trim_segment_edges(out,sr,aggressive=True,lexical=True)
    if not out.numel() or out.shape[-1]<int(sr*0.10):
        return None,{"context_bridge":False,"reason":"cropped_too_short"}
    return out,{
        "context_bridge":True,
        "direction":direction,
        "carrier_text":context_text,
        "separator_ms":[round(start/sr*1000,1),round(end/sr*1000,1)],
    }

def load_context_bridge_cache(text:str,language_id:str,mode:str,direction:str,target_sr:int):
    key=context_bridge_cache_key(text,language_id,mode,direction)
    path=context_bridge_cache_path(key)
    if not path.exists() or path.stat().st_size<=44:
        return None,None,key
    try:
        wav=load_locked_wav(path,target_sr)
        metrics=audio_quality_metrics(wav,target_sr,text,language_id,mode)
        if metrics.get("issues"):
            path.unlink(missing_ok=True)
            return None,None,key
        metrics.update({
            "context_bridge":True,
            "context_bridge_cache":"hit",
            "cache_reused_without_resynthesis":True,
        })
        return wav,metrics,key
    except Exception:
        try: path.unlink(missing_ok=True)
        except Exception: pass
        return None,None,key

def save_context_bridge_cache(key:str,wav,sr:int):
    if not key:
        return
    path=context_bridge_cache_path(key)
    tmp=path.with_name(path.name+f".tmp.{os.getpid()}.{uuid.uuid4().hex[:8]}.wav")
    try:
        save_wav(tmp,wav,sr)
        if tmp.exists() and tmp.stat().st_size>44:
            os.replace(tmp,path)
    finally:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass

def render_context_bridge(model,text:str,mode:str,direction:str,seed_base:int=2026):
    """Erzeugt ein deutsches Fragment mit Fortsetzungs-Kontext und entfernt den Carrier."""
    import torch
    source=str(text or "").strip()
    carrier=f"{source}, weiter" if direction=="lead-in" else f"weiter, {source}"
    attempts=max(2,int(QA_CONFIG.get("contextBridgeRenderAttempts",3)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    last_error=None
    for attempt in range(attempts):
        torch.manual_seed(max(1,int(seed_base))+attempt*seed_offset)
        try:
            rendered=render_with_model(model,carrier,"de",mode)
            cropped,meta=_crop_context_bridge_audio(rendered,int(model.sr),source,carrier,direction)
            if cropped is None:
                last_error=RuntimeError(meta.get("reason","context bridge crop failed"))
                continue
            metrics=audio_quality_metrics(cropped,int(model.sr),source,"de",mode)
            if metrics.get("issues"):
                last_error=RuntimeError(", ".join(metrics["issues"]))
                continue
            metrics.update(meta)
            metrics["attempt"]=attempt+1
            metrics["carrier_not_exposed"]=True
            return cropped,metrics
        except Exception as e:
            last_error=e
    raise RuntimeError(f"Kontext-Bridge fehlgeschlagen ({direction}): {last_error}")

def _render_cache_digest(text:str,language_id:str,mode:str,backend=None,schema:int=3):
    p=prosody_settings(mode,language_id,text)
    payload={
        "schema":int(schema),
        "model":"chatterbox-multilingual-v3",
        "text":str(text),
        "language":str(language_id),
        "mode":str(mode),
        "reference":file_signature(reference_for_language(language_id)),
        "exaggeration":round(float(p["exaggeration"]),6),
        "cfg_weight":round(float(p["cfg_weight"]),6),
        "temperature":round(float(p["temperature"]),6),
    }
    if backend is not None:
        payload["backend"]=str(backend)
    raw=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def render_cache_key(text:str,language_id:str,mode:str):
    # Verifiziertes Audio ist backend-unabhängig wiederverwendbar. Dadurch muss
    # ein Satz nach Wechsel MLX ↔ PyTorch/MPS nicht erneut synthetisiert werden.
    return _render_cache_digest(text,language_id,mode,backend=None,schema=3)

def legacy_render_cache_keys(text:str,language_id:str,mode:str):
    return [
        _render_cache_digest(text,language_id,mode,backend="mlx",schema=2),
        _render_cache_digest(text,language_id,mode,backend="torch",schema=2),
    ]

def render_cache_path(key:str):
    return RENDER_CACHE_DIR/f"{key}.wav"

def load_render_cache(text:str,language_id:str,mode:str,target_sr:int):
    key=render_cache_key(text,language_id,mode)
    candidates=[key]+legacy_render_cache_keys(text,language_id,mode)
    for candidate in candidates:
        path=render_cache_path(candidate)
        if not path.exists() or path.stat().st_size<=44:
            continue
        try:
            wav=load_locked_wav(path,target_sr)
            metrics=audio_quality_metrics(wav,target_sr,text,language_id,mode)
            hard=[x for x in metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
            if hard:
                path.unlink(missing_ok=True)
                continue

            remaining=set(metrics.get("issues") or [])
            if remaining and remaining.issubset({"unexpected_internal_hold","excessive_internal_pause"}):
                repaired,repair_meta=repair_internal_pause(wav,target_sr,text,language_id,mode)
                if repair_meta.get("repaired"):
                    repaired_metrics=audio_quality_metrics(repaired,target_sr,text,language_id,mode)
                    if not repaired_metrics.get("issues"):
                        wav=repaired
                        metrics=repaired_metrics
                        metrics.update(repair_meta)
                        save_wav(path,wav,target_sr)
                        remaining=set()
            if remaining:
                # Nur wirklich freigegebene Sätze werden als "bekannt" wiederverwendet.
                path.unlink(missing_ok=True)
                continue

            if candidate!=key:
                try:
                    migrated=render_cache_path(key)
                    if not migrated.exists():
                        save_wav(migrated,wav,target_sr)
                except Exception:
                    pass
            try: os.utime(path,None)
            except Exception: pass
            RENDER_CACHE_STATS["hits"]+=1
            metrics["attempt"]=0
            metrics["critical"]=False
            metrics["rescued"]=False
            metrics["segment_cache"]="hit"
            metrics["cache_reused_without_resynthesis"]=True
            return wav,metrics,key
        except Exception:
            try: path.unlink(missing_ok=True)
            except Exception: pass
            continue
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

def install_t3_generation_guard(model):
    """Begrenzt die maximale autoregressive Sprach-Token-Länge pro Segment.

    Chatterbox Multilingual ruft t3.inference intern standardmäßig mit
    max_new_tokens=1000 auf. Für unsere kleineren Long-Form-Segmente reicht ein
    deutlich kleineres Limit und verhindert minutenlange Entgleisungen.
    """
    t3=getattr(model,"t3",None)
    if t3 is None or getattr(t3,"_dar_guard_installed",False):
        return
    original=t3.inference

    def guarded_inference(*args,**kwargs):
        requested=int(kwargs.get("max_new_tokens",1000) or 1000)
        # 620 lässt genug Reserve für unsere <=150-Zeichen-DE / <=96-Zeichen-AR-Segmente.
        kwargs["max_new_tokens"]=min(requested,620)
        return original(*args,**kwargs)

    t3.inference=guarded_inference
    t3._dar_guard_installed=True

def normalize_segment_shape(wav):
    w=wav.detach().float().cpu()
    if w.ndim==1:
        w=w.unsqueeze(0)
    if w.ndim>2:
        w=w.reshape(w.shape[0],-1)
    return w

def is_inline_arabic_micro_term(text:str):
    """Kurzer arabischer Name/Begriff, der innerhalb eines deutschen Satzes flüssig eingebettet wird."""
    value=str(text or "").strip().strip(AUDIO_LOCK_EDGE_CHARS)
    if not value:
        return False
    letters=sum(
        1 for ch in value
        if ARABIC_CHAR_RE.match(ch) and unicodedata.category(ch).startswith("L")
    )
    words=len([x for x in re.split(r"\s+",value) if x])
    return 0<letters<=12 and words<=3

def flow_boundary_strength(left_text:str,left_lang:str,right_text:str,right_lang:str):
    """Automatische Satzfluss-Klassifikation ohne Wortlisten.

    0 = echte Satz-/Phrasenpause
    1 = normale nahtlose Satzfortsetzung
    2 = besonders enge Wortgruppen-Grenze, z. B. kurzer deutscher Fragmentblock
        direkt vor/nach einem arabischen Fachbegriff.

    Entscheidend ist die Struktur der Grenze, nicht ein einzelnes Wort. Dadurch
    funktionieren auch neue Kombinationen wie 'wer glaubt', 'er sagte',
    'die Sunnah', 'für Allāh', 'mit Ibrāhīm' usw. automatisch.
    """
    left=str(left_text or "").strip()
    right=str(right_text or "").strip()
    if not left or not right:
        return 0

    # Echte Interpunktion darf ihre natürliche Pause behalten.
    if re.search(r"[.!?؟…,:;،؛]$",left):
        return 0

    left_words=re.findall(r"\S+",left)
    right_words=re.findall(r"\S+",right)
    cross_language=str(left_lang)!=str(right_lang)

    # Sprachwechsel innerhalb desselben Satzes braucht die engste Brücke,
    # besonders wenn eine Seite nur aus einem kurzen grammatischen Fragment besteht.
    if cross_language and (len(left_words)<=4 or len(right_words)<=4):
        return 2

    # Auch innerhalb derselben Sprache dürfen willkürliche Chunk-Grenzen nie
    # wie eine Denkpause klingen.
    return 1

def trim_segment_edges(wav,sr:int,aggressive:bool=False,inline:bool=False,lexical:bool=False):
    """Randstille vor jedem internen Stitch entfernen.

    aggressive=True gilt für *alle* internen Satz-/Phrasengrenzen. inline=True
    ist die noch engere Variante für kurze arabische Begriffe im deutschen Satz.
    Das verhindert das typische KI-Muster: sprechen → warten → Wort → warten → weiter.
    """
    import torch
    w=normalize_segment_shape(wav)
    if w.numel()==0 or w.shape[-1]<8:
        return w

    envelope=w.abs().amax(dim=0)
    peak=float(envelope.max().item()) if envelope.numel() else 0.0
    if peak<=1e-7:
        return w

    # Profilgesteuerte Randstille: konservativ trimmen, Anlaute/Konsonanten schützen.
    rel=float(CONTINUITY_CONFIG.get("trimThresholdRelative",0.0035))
    if aggressive:
        rel=max(rel,float(CONTINUITY_CONFIG.get("boundaryTrimThresholdRelative",0.006)))
    if lexical:
        rel=max(rel,float(CONTINUITY_CONFIG.get("lexicalBridgeTrimThresholdRelative",0.009)))
    if inline:
        rel=max(rel,float(CONTINUITY_CONFIG.get("inlineArabicTrimThresholdRelative",0.012)))
    threshold=max(peak*rel,1e-5)
    active=torch.nonzero(envelope>threshold).flatten()
    if active.numel()==0:
        return w

    if lexical:
        pad_ms=float(CONTINUITY_CONFIG.get("lexicalBridgeTrimSafetyMs",2))
    elif inline:
        pad_ms=float(CONTINUITY_CONFIG.get("inlineArabicTrimSafetyMs",5))
    elif aggressive:
        pad_ms=float(CONTINUITY_CONFIG.get("boundaryTrimSafetyMs",8))
    else:
        pad_ms=float(CONTINUITY_CONFIG.get("trimSafetyMs",20))
    pad=max(1,int(sr*pad_ms/1000.0))
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

    # 10-ms energy frames. Kurze arabische Namen/Begriffe bekommen einen
    # niedrigeren Silence-Floor: leise Reibelaute und unvoiced consonants dürfen
    # nicht fälschlich als "Denkpause" gewertet werden. Echte Pausen werden
    # anschließend zusätzlich im vollständigen Satz geprüft.
    env=w.abs().amax(dim=0)
    inline_arabic=language_id=="ar" and is_inline_arabic_micro_term(text)
    frame=max(1,int(sr*0.010))
    count=env.numel()//frame
    if count>=3 and peak>0:
        framed=env[:count*frame].reshape(count,frame).mean(dim=1)
        if inline_arabic:
            threshold=max(
                peak*float(QA_CONFIG.get("inlineArabicSilenceThresholdRelative",0.0045)),
                float(QA_CONFIG.get("inlineArabicSilenceAbsolute",0.00015))
            )
        else:
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
        probe=str(text or "").strip()
        # Ein Satzendpunkt erlaubt keine lange Stille mitten im Satz. Nur echte
        # interne Satzzeichen erhalten einen etwas größeren Pausenrahmen.
        core=re.sub(r"[.!?؟…]+$","",probe).strip()
        has_internal_punctuation=bool(re.search(r"[,،;؛:!?؟…]|\.(?=\s+\S)",core))
        if inline_arabic:
            limit=int(QA_CONFIG.get("inlineArabicInternalSilenceMs",500))
        elif has_internal_punctuation:
            mode_limits=QA_CONFIG.get("maxInternalSilenceMsWithPunctuationByMode") or {}
            limit=int(mode_limits.get(mode,QA_CONFIG.get("maxInternalSilenceMsWithPunctuation",560)))
        else:
            limit=int(QA_CONFIG.get("maxInternalSilenceMsWithoutPunctuation",380))
        metrics["internal_punctuation"]=has_internal_punctuation
        metrics["inline_arabic_microterm"]=bool(inline_arabic)
        metrics["internal_silence_limit_ms"]=limit
        if silence_ms>limit:
            if inline_arabic:
                metrics["issues"].append("inline_arabic_internal_hold")
            else:
                metrics["issues"].append("excessive_internal_pause" if has_internal_punctuation else "unexpected_internal_hold")

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
        letters=sum(
            1 for ch in str(text or "")
            if ARABIC_CHAR_RE.match(ch) and unicodedata.category(ch).startswith("L")
        )
        if 0<letters<=24:
            if letters<=12:
                # Einzelne Namen/Begriffe dürfen nicht wie isolierte Ansagen mehrere
                # Sekunden stehen bleiben. Das war die Hauptursache hörbarer Stopps
                # mitten in deutschen Sätzen (z. B. vor/nach Allāh).
                max_dur=float(QA_CONFIG.get("inlineArabicMaxSecondsBase",0.65))+letters*float(QA_CONFIG.get("inlineArabicMaxSecondsPerLetter",0.15))
            else:
                max_dur=float(QA_CONFIG.get("shortArabicMaxSecondsBase",1.2))+letters*float(QA_CONFIG.get("shortArabicMaxSecondsPerLetter",0.34))
            metrics["inline_arabic_max_seconds"]=round(max_dur,3)
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

def repair_internal_pause(wav,sr:int,text:str,language_id:str,mode:str):
    """Kürzt nur klar erkannte stille Inseln mitten im Satz.

    Das ist wesentlich schneller als einen ansonsten guten Satz komplett neu zu
    synthetisieren. Sehr lange Aussetzer bleiben ein echter QA-Fehler und werden
    weiterhin neu gerendert.
    """
    import torch
    w=normalize_segment_shape(wav)
    if language_id=="ar" or not w.numel() or w.shape[-1]<int(sr*0.3):
        return w,{"repaired":False}

    env=w.abs().amax(dim=0)
    peak=float(env.max().item()) if env.numel() else 0.0
    if peak<=1e-7:
        return w,{"repaired":False}

    frame=max(1,int(sr*0.010))
    count=env.numel()//frame
    if count<5:
        return w,{"repaired":False}
    framed=env[:count*frame].reshape(count,frame).mean(dim=1)
    threshold=max(peak*0.012,0.0004)
    silent=(framed<threshold).tolist()

    probe=str(text or "").strip()
    core=re.sub(r"[.!?؟…]+$","",probe).strip()
    has_internal_punctuation=bool(re.search(r"[,،;؛:!?؟…]|\.(?=\s+\S)",core))
    target_ms=int(
        QA_CONFIG.get("autoRepairPauseWithPunctuationMs",220)
        if has_internal_punctuation else QA_CONFIG.get("autoRepairPauseWithoutPunctuationMs",150)
    )
    trigger_ms=int(
        (QA_CONFIG.get("maxInternalSilenceMsWithPunctuationByMode") or {}).get(
            mode,QA_CONFIG.get("maxInternalSilenceMsWithPunctuation",560)
        )
        if has_internal_punctuation else QA_CONFIG.get("maxInternalSilenceMsWithoutPunctuation",380)
    )
    max_repair_ms=int(QA_CONFIG.get("autoRepairPauseMaxMs",950))

    runs=[]
    start=None
    for i,flag in enumerate(silent):
        if i==0 or i==len(silent)-1:
            continue
        if flag and start is None:
            start=i
        if (not flag or i==len(silent)-2) and start is not None:
            end=i if not flag else i+1
            dur=(end-start)*10
            if dur>trigger_ms and dur<=max_repair_ms:
                runs.append((start,end,dur))
            start=None

    if not runs:
        return w,{"repaired":False}

    keep_frames=max(2,int(round(target_ms/10.0)))
    pieces=[]
    cursor=0
    removed_ms=0
    for start_f,end_f,dur in runs:
        start_s=start_f*frame
        end_s=min(w.shape[-1],end_f*frame)
        run_frames=max(1,end_f-start_f)
        keep=min(run_frames,keep_frames)
        left_keep=keep//2
        right_keep=keep-left_keep
        cut_start=min(end_s,start_s+left_keep*frame)
        cut_end=max(cut_start,end_s-right_keep*frame)
        pieces.append(w[...,cursor:cut_start])
        pieces.append(w[...,cut_end:end_s])
        cursor=end_s
        removed_ms+=max(0,dur-target_ms)
    pieces.append(w[...,cursor:])
    repaired=torch.cat([p for p in pieces if p.shape[-1]>0],dim=-1)
    return repaired,{
        "repaired":True,
        "pause_runs_repaired":len(runs),
        "pause_ms_removed":int(removed_ms),
        "target_pause_ms":int(target_ms),
    }

def split_rescue_chunks(text:str,force:bool=False):
    """Nicht-MASTER Segmente deterministisch teilen; bei Watchdog-Timeout auch kurze Problemsegmente."""
    value=re.sub(r"\s+"," ",str(text or "")).strip()
    if not value:
        return []
    words=value.split()
    min_words=max(6,int(QA_CONFIG.get("rescueMinWords",9)))
    min_chars=max(60,int(QA_CONFIG.get("rescueMinChars",90)))
    if not force and len(words)<min_words and len(value)<min_chars:
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

    split_floor=2 if force else min_words
    if len(words)>=split_floor:
        mid=max(1,min(len(words)-1,len(words)//2))
        return [" ".join(words[:mid])," ".join(words[mid:])]
    return [value]

def render_segment_with_qa(model,text:str,language_id:str,mode:str,critical:bool=False,seed_base:int=2026):
    import torch
    attempts=max(1,int(QA_CONFIG.get("maxRenderAttempts",2)))
    if language_id=="ar" and is_inline_arabic_micro_term(text):
        attempts=max(attempts,int(QA_CONFIG.get("inlineArabicRenderAttempts",4)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    seed_base=max(1,int(seed_base))
    last=None

    for attempt in range(attempts):
        torch.manual_seed(seed_base+attempt*seed_offset)
        try:
            wav=render_with_model(model,text,language_id,mode)
        except GenerationTimeoutReached as e:
            print(f"[DĀR Voice] watchdog rescue: {e}",flush=True)
            last=(None,{"issues":["generation_timeout"],"attempt":attempt+1,"critical":bool(critical),"rescued":False})
            # Kritische MASTER-Kandidaten dürfen nicht geteilt werden. Ein zweiter
            # Versuch startet automatisch einen frisch initialisierten MLX-Prozess.
            if critical and attempt+1<attempts:
                continue
            break
        except GenerationTokenLimitReached as e:
            print(f"[DĀR Voice] bounded generation rescue: {e}",flush=True)
            last=(None,{"issues":["generation_token_limit"],"attempt":attempt+1,"critical":bool(critical),"rescued":False})
            break
        metrics=audio_quality_metrics(wav,int(model.sr),text,language_id,mode)

        pause_only={"unexpected_internal_hold","excessive_internal_pause"}
        current_issues=set(metrics.get("issues") or [])
        if current_issues and current_issues.issubset(pause_only):
            repaired,repair_meta=repair_internal_pause(wav,int(model.sr),text,language_id,mode)
            if repair_meta.get("repaired"):
                repaired_metrics=audio_quality_metrics(repaired,int(model.sr),text,language_id,mode)
                if not repaired_metrics.get("issues"):
                    wav=repaired
                    metrics=repaired_metrics
                    metrics.update(repair_meta)
                    print(
                        f"[DĀR Voice] pause auto-repair lang={language_id} mode={mode} "
                        f"removed={repair_meta.get('pause_ms_removed',0)}ms",
                        flush=True
                    )

        metrics.update(getattr(render_with_model,"_last_backend_meta",{}) or {})
        metrics["attempt"]=attempt+1
        metrics["critical"]=bool(critical)
        metrics["rescued"]=False
        last=(wav,metrics)
        if not metrics["issues"]:
            return wav,metrics
        print(f"[DĀR Voice] QA retry {attempt+1}/{attempts} lang={language_id} mode={mode}: {metrics['issues']}",flush=True)

    rescue_allowed={
        "unexpected_internal_hold","inline_arabic_internal_hold","excessive_internal_pause","suspicious_sustained_hold",
        "short_arabic_too_long","segment_too_long","speech_rate_too_slow","generation_token_limit","generation_timeout"
    }
    last_issues=set(last[1]["issues"]) if last else set()
    if bool(QA_CONFIG.get("rescueLongSegments",True)) and not critical and last_issues and last_issues.issubset(rescue_allowed):
        parts=split_rescue_chunks(text,force=("generation_timeout" in last_issues))
        if len(parts)>1:
            rescued=[]
            rescue_metrics=[]
            for part_idx,part in enumerate(parts):
                torch.manual_seed(seed_base+(attempts+part_idx)*seed_offset)
                try:
                    sub=render_with_model(model,part,language_id,mode)
                except (GenerationTokenLimitReached,GenerationTimeoutReached):
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
    max_hold=(last[1].get("max_internal_silence_ms") if last else None)
    detail=f"Audio-QA fehlgeschlagen ({language_id}/{mode}): {issues}"
    if max_hold is not None:
        detail+=f" · interne Stille {max_hold} ms"
    detail+=f" · Text: {str(text or '')[:72]}"
    raise RuntimeError(detail)

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

def crossfade_audio(left,right,sr:int,seconds:float,equal_power:bool=False,max_fraction:float=0.333):
    import torch
    a=normalize_segment_shape(left)
    b=normalize_segment_shape(right)
    frac=max(0.20,min(0.49,float(max_fraction)))
    n=min(int(sr*seconds),int(a.shape[-1]*frac),int(b.shape[-1]*frac))
    if n<8:
        return torch.cat([a,b],dim=-1)

    x=torch.linspace(0.0,1.0,n,dtype=a.dtype).view(1,-1)
    if equal_power:
        fade_in=torch.sqrt(x.clamp_min(0.0))
        fade_out=torch.sqrt((1.0-x).clamp_min(0.0))
    else:
        fade_in=x
        fade_out=1.0-x
    mixed=a[...,-n:]*fade_out+b[...,:n]*fade_in
    return torch.cat([a[...,:-n],mixed,b[...,n:]],dim=-1)

def join_rendered_segments(items,sr:int):
    """Deutsch/Arabisch ohne hörbare harte Schnittkante zusammensetzen."""
    import torch
    if not items:
        raise RuntimeError("Keine Audiosegmente erzeugt.")

    cleaned=[]
    edge_stats=[]
    for pos,item in enumerate(items):
        wav,lang,chunk=item[0],item[1],item[2]
        left_lang=items[pos-1][1] if pos>0 else None
        right_lang=items[pos+1][1] if pos+1<len(items) else None
        inline_micro=(
            lang=="ar" and is_inline_arabic_micro_term(chunk)
            and (left_lang=="de" or right_lang=="de")
        )
        left_strength=(
            flow_boundary_strength(items[pos-1][2],items[pos-1][1],chunk,lang)
            if pos>0 else 0
        )
        right_strength=(
            flow_boundary_strength(chunk,lang,items[pos+1][2],items[pos+1][1])
            if pos+1<len(items) else 0
        )
        lexical_bridge=max(left_strength,right_strength)>=1
        internal=(pos>0 or pos+1<len(items))
        before=normalize_segment_shape(wav)
        before_samples=int(before.shape[-1])
        trimmed=trim_segment_edges(
            wav,sr,aggressive=internal,inline=inline_micro,lexical=lexical_bridge
        )
        removed=max(0,before_samples-int(trimmed.shape[-1]))
        edge_stats.append({
            "index":pos+1,
            "language":lang,
            "inline_micro":bool(inline_micro),
            "lexical_bridge":bool(lexical_bridge),
            "trimmed_ms":round(removed/max(1,int(sr))*1000.0,2),
        })
        cleaned.append((trimmed,*item[1:]))
    cleaned=gently_level_segments(cleaned)

    full=cleaned[0][0]
    prev_lang=cleaned[0][1]
    prev_chunk=cleaned[0][2]
    prev_mode=cleaned[0][3]
    boundary_stats=[]

    for boundary_idx,item in enumerate(cleaned[1:],1):
        wav,lang,chunk,mode=item[0],item[1],item[2],item[3]
        prev_text=prev_chunk.strip()
        sentence_end=bool(re.search(r"[.!?؟…]$",prev_text))
        soft_pause=bool(re.search(r"[,،;؛:]$",prev_text))
        p=prosody_settings(prev_mode,prev_lang,prev_chunk)

        prev_inline_ar=(prev_lang=="ar" and is_inline_arabic_micro_term(prev_chunk))
        cur_inline_ar=(lang=="ar" and is_inline_arabic_micro_term(chunk))
        inline_boundary=(prev_inline_ar and lang=="de") or (cur_inline_ar and prev_lang=="de")
        boundary_strength=flow_boundary_strength(prev_chunk,prev_lang,chunk,lang)
        lexical_boundary=boundary_strength>=1
        strong_lexical_boundary=boundary_strength>=2

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
            if prev_inline_ar and lang=="de":
                # Nach einem eingebetteten Namen/Begriff nur die echte Satzzeichenpause,
                # keine zusätzliche "Ansage-Lücke".
                pause=min(pause,int(CONTINUITY_CONFIG.get("inlineArabicSoftPauseMaxMs",22)))
            silence=torch.zeros((1,max(1,int(sr*pause/1000))),dtype=full.dtype)
            full=torch.cat([full,silence,wav],dim=-1)
        else:
            ms=max(8,int(p["crossfade_ms"]))
            max_fraction=0.333

            if strong_lexical_boundary:
                # Kurzer Fragmentblock + Sprachwechsel: maximal eng, aber mit
                # begrenztem Overlap gegen Doppelphoneme/Stottern.
                ms=max(ms,int(CONTINUITY_CONFIG.get("strongLexicalBridgeCrossfadeMs",108)))
                max_fraction=float(CONTINUITY_CONFIG.get("strongLexicalBridgeMaxFraction",0.43))
            elif lexical_boundary:
                # Jede nicht punktuierte Segmentgrenze innerhalb eines Satzes
                # wird automatisch als nahtlose Fortsetzung behandelt.
                ms=max(ms,int(CONTINUITY_CONFIG.get("automaticTightJoinCrossfadeMs",64)))
                max_fraction=float(CONTINUITY_CONFIG.get("automaticTightJoinMaxFraction",0.36))
            elif inline_boundary:
                ms=max(ms,int(CONTINUITY_CONFIG.get("inlineArabicCrossfadeMs",72)))
                max_fraction=float(CONTINUITY_CONFIG.get("inlineArabicMaxFraction",0.38))
            else:
                ms=max(ms,int(CONTINUITY_CONFIG.get("internalFlowCrossfadeMs",52)))
                if prev_lang!=lang:
                    ms=max(ms,int(CONTINUITY_CONFIG.get("languageCrossfadeMinMs",44)))

            full=crossfade_audio(
                full,wav,sr,ms/1000.0,equal_power=True,max_fraction=max_fraction
            )

        boundary_stats.append({
            "index":boundary_idx,
            "from_language":prev_lang,
            "to_language":lang,
            "sentence_end":bool(sentence_end),
            "soft_pause":bool(soft_pause),
            "inline_boundary":bool(inline_boundary),
            "lexical_boundary":bool(lexical_boundary),
            "strong_lexical_boundary":bool(strong_lexical_boundary),
            "boundary_strength":int(boundary_strength),
            "crossfade_ms":0 if (sentence_end or soft_pause) else int(ms),
        })

        prev_lang=lang
        prev_chunk=chunk
        prev_mode=mode

    edge_ms=int(CONTINUITY_CONFIG.get("outputEdgeFadeMs",12))
    edge=max(1,min(int(sr*edge_ms/1000),full.shape[-1]//4))
    if edge>1:
        fade=torch.linspace(0.0,1.0,edge,dtype=full.dtype).view(1,-1)
        full[...,:edge]*=fade
        full[...,-edge:]*=torch.flip(fade,dims=[1])

    join_rendered_segments._last_continuity={
        "engine":"continuous-flow-v1",
        "edge_trims":edge_stats,
        "boundaries":boundary_stats,
        "max_trimmed_ms":max([x["trimmed_ms"] for x in edge_stats],default=0.0),
    }
    return full

join_rendered_segments._last_continuity={}

def save_wav(path:Path,wav,sr:int):
    """Schreibt intern ausschließlich RIFF/WAV PCM16 mono.

    Kein torchaudio.save: einige macOS/torchaudio-Backends schreiben Float-WAV
    (WAVE_FORMAT_IEEE_FLOAT = 3), das Python wave später nicht lesen kann.
    """
    import numpy as np, wave
    tensor=wav.detach().float().cpu()
    if tensor.ndim==1:
        tensor=tensor.unsqueeze(0)
    if tensor.ndim>2:
        tensor=tensor.reshape(tensor.shape[0],-1)
    if tensor.shape[0]>1:
        tensor=tensor.mean(dim=0,keepdim=True)
    arr=tensor.squeeze(0).contiguous().numpy()
    arr=np.nan_to_num(arr,nan=0.0,posinf=0.0,neginf=0.0)
    peak=float(np.max(np.abs(arr))) if arr.size else 0.0
    if peak>1.0:
        arr=arr/peak
    pcm=np.rint(np.clip(arr,-1.0,1.0)*32767.0).astype(np.int16)
    path.parent.mkdir(parents=True,exist_ok=True)
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

def app_delivery_audio(src:Path):
    src=Path(src)
    if not src.exists() or src.stat().st_size<=44:
        raise RuntimeError("Für die Kids-App ist noch keine gültige Audio vorhanden.")
    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("ffmpeg fehlt – kompakte Kids-App-Audio kann nicht erstellt werden.")

    publish_dir=OUTPUT/"publish"
    publish_dir.mkdir(parents=True,exist_ok=True)
    signature=file_signature(src)
    digest=hashlib.sha1(signature.encode("utf-8")).hexdigest()[:16]
    dst=publish_dir/f"dar_kids_{digest}.m4a"
    if dst.exists() and dst.stat().st_size>1024:
        return dst

    tmp=dst.with_suffix(".tmp.m4a")
    cmd=[
        ffmpeg,"-y","-i",str(src),
        "-vn","-ac","1","-ar","24000",
        "-c:a","aac","-b:a","72k",
        "-movflags","+faststart",
        str(tmp)
    ]
    p=subprocess.run(cmd,capture_output=True,text=True)
    if p.returncode!=0 or not tmp.exists() or tmp.stat().st_size<=1024:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass
        detail=(p.stderr or "")[-1200:]
        raise RuntimeError("Kids-App-Audio konnte nicht komprimiert werden. "+detail)
    os.replace(tmp,dst)

    # Alte Delivery-Dateien klein halten; Master-WAV und RenderCache bleiben unangetastet.
    try:
        files=sorted(publish_dir.glob("dar_kids_*.m4a"),key=lambda x:x.stat().st_mtime,reverse=True)
        for old in files[12:]:
            old.unlink(missing_ok=True)
    except Exception:
        pass
    return dst

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
    unresolved=detect_unresolved_islamic_terms(text)
    if unresolved:
        terms=", ".join(str(x.get("term","")) for x in unresolved[:6])
        raise ValueError(
            "Ungeprüfte islamische Namen/Begriffe erkannt: "+terms+
            ". Bitte zuerst in der Ausspracheanalyse prüfen oder im Lernzentrum bestätigen."
        )
    if not REF_DE.exists():
        raise RuntimeError("Referenzstimme fehlt: "+str(REF_DE))

    speak,found=prepare(text)
    synthesis_text,plan,flow_preflight=prepare_flow_text(text,speak,build_render_plan)

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
        message=f"Satzfluss geprüft · {flow_preflight['sentences']} Sätze · Audio wird vorbereitet …"
    )

    try:
        # Fast path: bekannte, bereits verifizierte Sätze und bestätigte
        # Aussprache-Audios werden vor dem schweren Modellstart gesucht.
        model=None
        render_sr=24000
        preloaded={}
        for pre_idx,(pre_lang,pre_chunk) in enumerate(plan):
            pre_mode=resolve_segment_prosody(pre_chunk,doc_mode,style)
            pre_lock=audio_lock_key_for_chunk(pre_chunk)
            pre_lock_path=audio_lock_path(pre_lock) if pre_lock else None
            if pre_lock and pre_lock_path.exists():
                try:
                    pre_wav=load_locked_wav(pre_lock_path,render_sr)
                    pre_metrics=audio_quality_metrics(pre_wav,render_sr,pre_chunk,pre_lang,pre_mode)
                    hard=[x for x in pre_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
                    if not hard:
                        pre_metrics.update({
                            "attempt":0,"critical":True,"rescued":False,
                            "audio_lock":"confirmed","fast_reuse":True
                        })
                        preloaded[pre_idx]=(pre_wav,pre_metrics,"lock")
                        continue
                except Exception:
                    pass
            if not pre_lock:
                pre_bridge=contextual_bridge_direction(plan,pre_idx)
                if pre_bridge:
                    pre_wav,pre_metrics,_=load_context_bridge_cache(
                        pre_chunk,pre_lang,pre_mode,pre_bridge,render_sr
                    )
                    if pre_wav is not None:
                        pre_metrics["fast_reuse"]=True
                        preloaded[pre_idx]=(pre_wav,pre_metrics,"context-bridge")
                        continue
                else:
                    pre_wav,pre_metrics,_=load_render_cache(pre_chunk,pre_lang,pre_mode,render_sr)
                    if pre_wav is not None:
                        pre_metrics["fast_reuse"]=True
                        preloaded[pre_idx]=(pre_wav,pre_metrics,"cache")

        outputs=[None]*len(plan)
        qa_segments=[None]*len(plan)
        total=len(plan)
        render_id=uuid.uuid4().hex[:12]
        session_audio_locks={}
        new_audio_lock_candidates={}
        render_started_perf=time.perf_counter()
        prepares_before=MODEL_REFERENCE_PREPARES

        if len(preloaded)==total:
            set_status(progress=8,message=f"{total}/{total} bekannt · Stimm-Modell wird nicht geladen")
        elif preloaded:
            set_status(progress=8,message=f"{len(preloaded)}/{total} bekannt · nur neue Sätze werden erzeugt")

        # Qualitätsmodus: immer in echter Textreihenfolge rendern.
        # Sprach-Batching war schneller, ließ aber getrennte Segmente stärker wie
        # unabhängige Aufnahmen wirken. Kontinuität hat Vorrang vor maximalem Durchsatz.
        execution_order=list(range(total))

        for processed_pos,original_idx in enumerate(execution_order,1):
            lang,chunk=plan[original_idx]
            idx=original_idx+1
            pct=8+int(((processed_pos-1)/max(1,total))*78)
            lang_label="Arabisch" if lang=="ar" else "Deutsch"
            mode=resolve_segment_prosody(chunk,doc_mode,style)
            bridge_direction=contextual_bridge_direction(plan,original_idx)
            audio_lock_key=audio_lock_key_for_chunk(chunk)
            critical=bool(audio_lock_key) or (lang=="ar" and any(x and x in chunk for x in master_forms))
            set_status(progress=pct,message=f"{lang_label} · {mode} · Abschnitt {idx}/{total} …")
            print(f"[DĀR Voice] segment {idx}/{total} lang={lang} mode={mode} critical={critical} lock={audio_lock_key or '-'}: {chunk}",flush=True)

            locked_path=audio_lock_path(audio_lock_key) if audio_lock_key else None
            if original_idx in preloaded:
                wav,metrics,_reuse_kind=preloaded[original_idx]
            elif audio_lock_key and locked_path.exists():
                wav=load_locked_wav(locked_path,render_sr)
                metrics=audio_quality_metrics(wav,render_sr,chunk,lang,mode)
                hard=[x for x in metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
                if hard:
                    raise RuntimeError("Bestätigter Kern-Audio-Lock ist technisch beschädigt: "+audio_lock_key)
                metrics["attempt"]=0
                metrics["critical"]=True
                metrics["rescued"]=False
                metrics["audio_lock"]="confirmed"
            elif audio_lock_key and audio_lock_key in session_audio_locks:
                wav=session_audio_locks[audio_lock_key].clone()
                metrics=audio_quality_metrics(wav,render_sr,chunk,lang,mode)
                metrics["attempt"]=0
                metrics["critical"]=True
                metrics["rescued"]=False
                metrics["audio_lock"]="session_reuse"
            else:
                cached_wav=cached_metrics=None
                cache_key=""
                bridge_cache_key=""
                if not audio_lock_key:
                    if bridge_direction:
                        cached_wav,cached_metrics,bridge_cache_key=load_context_bridge_cache(
                            chunk,lang,mode,bridge_direction,render_sr
                        )
                    else:
                        cached_wav,cached_metrics,cache_key=load_render_cache(chunk,lang,mode,render_sr)
                if cached_wav is not None:
                    wav,metrics=cached_wav,cached_metrics
                else:
                    if model is None:
                        set_status(message=f"{lang_label} · neuer Satz · Stimm-Modell wird einmalig geladen …")
                        model=load_production_model()
                        render_sr=int(model.sr)
                    try:
                        core_seed=2026
                        if audio_lock_key:
                            render_salt=int(render_id[:8],16)
                            key_salt=sum((i+1)*ord(ch) for i,ch in enumerate(audio_lock_key))
                            core_seed=2026+((render_salt+key_salt*131)%900000)
                        segment_started=time.perf_counter()
                        if bridge_direction and lang=="de" and not audio_lock_key:
                            wav,metrics=render_context_bridge(
                                model,chunk,mode,bridge_direction,seed_base=core_seed
                            )
                        else:
                            wav,metrics=render_segment_with_qa(
                                model,chunk,lang,mode,critical,seed_base=core_seed
                            )
                        metrics["render_seconds"]=round(time.perf_counter()-segment_started,3)
                    except Exception as first_error:
                        if getattr(model,"_dar_backend","torch")=="mlx" and "generation_timeout" in str(first_error):
                            # Nach einem echten stuck inference wurde der MLX-Prozess bereits
                            # hart beendet. Kein unüberwachtes In-Process-Fallback starten.
                            print("[DĀR Voice] MLX watchdog stopped stuck inference:",first_error,flush=True)
                            raise
                        if getattr(model,"_dar_backend","torch")=="mlx":
                            print("[DĀR Voice] MLX segment failed, retry PyTorch/MPS:",first_error,flush=True)
                            set_status(message=f"{lang_label} · MLX-Fallback auf PyTorch/MPS …")
                            model=load_model()
                            segment_started=time.perf_counter()
                            if bridge_direction and lang=="de" and not audio_lock_key:
                                wav,metrics=render_context_bridge(
                                    model,chunk,mode,bridge_direction,seed_base=core_seed
                                )
                            else:
                                wav,metrics=render_segment_with_qa(
                                    model,chunk,lang,mode,critical,seed_base=core_seed
                                )
                            metrics["render_seconds"]=round(time.perf_counter()-segment_started,3)
                        elif MODEL_DEVICE=="mps":
                            print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                            set_status(message=f"{lang_label} · MPS-Fallback auf CPU …")
                            model=load_model(force_device="cpu")
                            if bridge_direction and lang=="de" and not audio_lock_key:
                                wav,metrics=render_context_bridge(
                                    model,chunk,mode,bridge_direction,seed_base=core_seed
                                )
                            else:
                                wav,metrics=render_segment_with_qa(
                                    model,chunk,lang,mode,critical,seed_base=core_seed
                                )
                        else:
                            raise
                    if not audio_lock_key:
                        if bridge_direction:
                            save_context_bridge_cache(bridge_cache_key,wav,render_sr)
                            metrics["context_bridge_cache"]="miss"
                        else:
                            save_render_cache(cache_key,wav,render_sr)
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
                "context_bridge_direction":bridge_direction or None,
                **metrics
            }
            outputs[original_idx]=(wav.detach().float().cpu(),lang,chunk,mode,metrics)
            completed_pct=8+int((processed_pos/max(1,total))*78)
            set_status(
                progress=completed_pct,
                message=f"{lang_label} · {mode} · Abschnitt {idx}/{total} fertig"
            )

        outputs=[x for x in outputs if x is not None]
        qa_segments=[x for x in qa_segments if x is not None]
        sr=int(render_sr)
        full=join_rendered_segments(outputs,sr)
        continuity_metrics=dict(getattr(join_rendered_segments,"_last_continuity",{}) or {})
        final_metrics=audio_quality_metrics(full,sr,synthesis_text,"de",doc_mode)

        fatal=[x for x in final_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
        final_limits=QA_CONFIG.get("finalMaxInternalSilenceMsByMode") or {}
        final_pause_limit=int(final_limits.get(doc_mode,QA_CONFIG.get("finalMaxInternalSilenceMs",620)))
        final_metrics["final_internal_silence_limit_ms"]=final_pause_limit
        if int(final_metrics.get("max_internal_silence_ms",0) or 0)>final_pause_limit:
            fatal.append("unnatural_final_internal_pause")
        if fatal:
            raise RuntimeError("Finale Audio-QA fehlgeschlagen: "+", ".join(dict.fromkeys(fatal)))

        staged_audio_locks=stage_pending_audio_locks(render_id,new_audio_lock_candidates,sr)

        qa_summary={
            "mode":doc_mode,
            "segment_modes":sorted({x.get("mode","narration") for x in qa_segments}),
            "rescued_segments":sum(1 for x in qa_segments if x.get("rescued")),
            "continuity_engine":"continuous-sentence-flow-v3",
            "preflight":flow_preflight,
            "continuity":continuity_metrics,
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
                "execution_strategy":"cache-only-fast-path" if model is None else ("mlx-bounded-long-form-v1" if getattr(model,"_dar_backend","torch")=="mlx" else "continuous-sentence-flow-v3"),
                "backend":"cache-only" if model is None else ("mlx" if getattr(model,"_dar_backend","torch")=="mlx" else "torch"),
                "fast_reused_segments":sum(1 for x in qa_segments if x.get("fast_reuse") or x.get("segment_cache")=="hit" or x.get("context_bridge_cache")=="hit"),
                "context_bridge_segments":sum(1 for x in qa_segments if x.get("context_bridge")),
                "context_bridge_cache_hits":sum(1 for x in qa_segments if x.get("context_bridge_cache")=="hit"),
                "model_load_skipped":bool(model is None),
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
        elif p=="/studio/content-studio.js":
            self.send_file(APP_HOME/"content-studio.js","application/javascript; charset=utf-8")
        elif p=="/studio/voice-studio-icon.png":
            self.send_file(APP_HOME/"voice-studio-icon.png","image/png")
        elif p=="/data/pronunciation/pronunciation-rules.json":
            self.send_json(200,LIB)
        elif p=="/data/pronunciation/islamic-master-library.json":
            sources={}
            sources.update((INSTALLED_MASTER_LIB or {}).get("sources") or {})
            sources.update((ONLINE_MASTER_LIB or {}).get("sources") or {})
            self.send_json(200,{
                "schemaVersion":1,
                "libraryId":"dar-al-tawhid-islamic-pronunciation-master-runtime",
                "entries":MASTER_ENTRIES,
                "sources":sources,
                "counts":{
                    "entries":len(MASTER_ENTRIES),
                    "autoRules":len(MASTER_RULES),
                    "sahaba":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabi"),
                    "sahabiyyat":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabiyyah"),
                    "prophets":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="prophet"),
                }
            })
        elif p=="/learning/state":
            self.send_json(200,{"ok":True,**learning_state()})
        elif p=="/publish-audio":
            try:
                st=get_status()
                src=Path(str(st.get("last_output") or ""))
                delivery=app_delivery_audio(src)
                b=delivery.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/mp4")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("Content-Disposition",'inline; filename="dar-kids-story.m4a"')
                self.send_header("X-DAR-Audio-Bytes",str(len(b)))
                self.send_header("X-DAR-Audio-Codec","aac-72k-mono")
                self.cors();self.end_headers();self.wfile.write(b)
            except Exception as e:
                return self.send_json(409,{"ok":False,"error":str(e)})
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
                unresolved=detect_unresolved_islamic_terms(text)
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
                    "unresolvedIslamicTerms":unresolved,
                    "librarySuggestions":[
                        {"term":x.get("term",""),"suggestions":x.get("suggestions") or []}
                        for x in unresolved
                    ],
                    "masterLibrary":{
                        "entries":len(MASTER_ENTRIES),
                        "autoRules":len(MASTER_RULES),
                        "sahaba":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabi"),
                        "sahabiyyat":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabiyyah"),
                        "prophets":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="prophet"),
                    },
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
