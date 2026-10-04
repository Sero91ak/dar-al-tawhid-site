#!/usr/bin/env python3
from __future__ import annotations
import base64, concurrent.futures, difflib, gc, hashlib, importlib.util, json, os, platform, re, shutil, subprocess, sys, threading, time, traceback, unicodedata, urllib.request, uuid
import xml.etree.ElementTree as ET
import multiprocessing as mp
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import hmac
try:
    from speech_flow import prepare_flow_text, FLOW_WEAK_ENDINGS
except ModuleNotFoundError:
    sys.path.insert(0,str(Path(__file__).resolve().parent))
    from speech_flow import prepare_flow_text, FLOW_WEAK_ENDINGS

# Apple-Silicon: unsupported MPS ops dürfen auf CPU zurückfallen statt den Render abzubrechen.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

APP_HOME=Path(os.environ.get("DAR_VOICE_APP_HOME",str(Path.home()/"Applications"/"DAR-Voice-Studio"))).expanduser()
PRON=APP_HOME/"pronunciation-rules.json"
PROFILE=APP_HOME/"voice-production-profile.json"
PLS_MASTER=APP_HOME/"DAR_AL_TAWHID_ElevenLabs_Aussprache_MAX_MASTER.pls"
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

NETWORK_MODE=os.environ.get("DAR_VOICE_NETWORK_MODE","0").strip()=="1"
PAIR_TOKEN=os.environ.get("DAR_VOICE_PAIR_TOKEN","").strip()
HOST="0.0.0.0" if NETWORK_MODE and PAIR_TOKEN else "127.0.0.1"
try:
    PORT=int(os.environ.get("DAR_VOICE_PORT",os.environ.get("PORT","8787")) or 8787)
except Exception:
    PORT=8787
ENGINE_VERSION="2.9.106"

def version_tuple(value):
    parts=[]
    for part in str(value or "").split("."):
        m=re.match(r"(\d+)",part)
        parts.append(int(m.group(1)) if m else 0)
    while len(parts)<3:
        parts.append(0)
    return tuple(parts[:4])
OUTPUT=VOICE_HOME/"VoiceStudioOutput"
OUTPUT.mkdir(parents=True,exist_ok=True)
MOBILE_HISTORY_META=OUTPUT/"mobile-history.json"
MASTER_AUDIO_DIR=VOICE_HOME/"MasterPronunciations"
PENDING_AUDIO_DIR=MASTER_AUDIO_DIR/"pending"
MASTER_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
PENDING_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
MASTER_AUDIO_MANIFEST=MASTER_AUDIO_DIR/"manifest.json"
LEARNING_HOME=VOICE_HOME/"PronunciationLearning"
LEARNING_PENDING_DIR=LEARNING_HOME/"pending"
LEARNING_PREVIEW_CACHE_DIR=LEARNING_HOME/"preview-cache"
ALPHABET_MASTER_HOME=VOICE_HOME/"AlphabetMasters"
ALPHABET_MASTER_STATE=ALPHABET_MASTER_HOME/"local-masters.json"
ALPHABET_EXPORT_HOME=VOICE_HOME/"KidsAppExport"
ALPHABET_BATCH_STATE_FILE=ALPHABET_EXPORT_HOME/"batch-state.json"
ALPHABET_PUBLISH_REPO=VOICE_HOME/"KidsAppPublishRepo"
ALPHABET_GENERATION_PROFILE="fusha-strict-v2"
QUIZ_MASTER_HOME=VOICE_HOME/"QuizMasters"
KIDS_OWNER_VOICE_MASTER_HOME=VOICE_HOME/"KidsOwnerVoiceMasters"
KIDS_OWNER_VOICE_EXPORT_HOME=VOICE_HOME/"KidsOwnerVoiceExport"
KIDS_OWNER_VOICE_PUBLISH_REPO=VOICE_HOME/"KidsOwnerVoicePublishRepo"
KIDS_OWNER_VOICE_SYNC_LOCK=threading.Lock()
KIDS_OWNER_VOICE_STATE_LOCK=threading.Lock()
KIDS_OWNER_VOICE_STATE={
    "running":False,"phase":"idle","progress":0,"completed":0,"total":0,
    "current":"","error":"","generated":0,"missing":0,"failed":0,"failedItems":[],
    "repoPublished":False,"repoPublishError":"","repoPublishMessage":"",
    "startedAt":"","finishedAt":""
}
USER_OVERRIDES_FILE=LEARNING_HOME/"user-overrides.json"
USER_OVERRIDES_BACKUP_DIR=LEARNING_HOME/"backups"
USER_OVERRIDES_BACKUP=USER_OVERRIDES_BACKUP_DIR/"user-overrides.latest.json"
USER_OVERRIDES_BACKUP_DIR.mkdir(parents=True,exist_ok=True)
LEARNING_CONFIRMED_AUDIO_DIR=LEARNING_HOME/"confirmed-audio"
LEARNING_CONFIRMED_AUDIO_DIR.mkdir(parents=True,exist_ok=True)
STORY_REFERENCE_HOME=LEARNING_HOME/"story-references"
STORY_REFERENCE_STATE=STORY_REFERENCE_HOME/"state.json"
STORY_REFERENCE_SEEDS=(
    APP_HOME/"story-reference-muhammad-2026-10-04.json",
    APP_HOME/"story-reference-adam-2026-10-04.json",
    APP_HOME/"story-reference-idris-2026-10-04.json",
)
# Compatibility alias for older diagnostics/config consumers.
STORY_REFERENCE_SEED=STORY_REFERENCE_SEEDS[0]
STORY_REFERENCE_HOME.mkdir(parents=True,exist_ok=True)
ONLINE_LIBRARY_CACHE=LEARNING_HOME/"online-library.json"
MASTER_LIBRARY_CACHE=LEARNING_HOME/"islamic-master-library.json"
MASTER_LIBRARY_SEED=APP_HOME/"islamic-master-library.json"
LEARNING_LOG=LEARNING_HOME/"learning-log.jsonl"
RENDER_CACHE_DIR=VOICE_HOME/"RenderCache"/"fast4-v1"
CONTEXT_BRIDGE_CACHE_DIR=RENDER_CACHE_DIR/"context-bridge-v1"
LEARNING_HOME.mkdir(parents=True,exist_ok=True)
LEARNING_PENDING_DIR.mkdir(parents=True,exist_ok=True)
LEARNING_PREVIEW_CACHE_DIR.mkdir(parents=True,exist_ok=True)
ALPHABET_MASTER_HOME.mkdir(parents=True,exist_ok=True)
ALPHABET_EXPORT_HOME.mkdir(parents=True,exist_ok=True)
QUIZ_MASTER_HOME.mkdir(parents=True,exist_ok=True)
KIDS_OWNER_VOICE_MASTER_HOME.mkdir(parents=True,exist_ok=True)
KIDS_OWNER_VOICE_EXPORT_HOME.mkdir(parents=True,exist_ok=True)
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
STORY_REFERENCE_LOCK=threading.RLock()
ALPHABET_MASTER_LOCK=threading.Lock()
ALPHABET_BATCH_LOCK=threading.Lock()
ALPHABET_BATCH_STATE_LOCK=threading.Lock()
PROPHET_STORY_BATCH_LOCK=threading.Lock()
PROPHET_STORY_BATCH_STATE_LOCK=threading.Lock()
PROPHET_STORY_BATCH_CANCEL=threading.Event()
PROPHET_STORY_BATCH_STATE={"running":False,"phase":"idle","progress":0,"completed":0,"total":25,"current":"","error":"","repoPublished":False,"repoPublishError":"","startedAt":"","finishedAt":""}
PROPHET_STORY_HOME=VOICE_HOME/"ProphetStoryExport"
PROPHET_STORY_WORK=PROPHET_STORY_HOME/"work"
PROPHET_STORY_READY=PROPHET_STORY_HOME/"ready"
PROPHET_STORY_CHECKPOINT=PROPHET_STORY_HOME/"checkpoint.json"
PROPHET_STORY_REVIEW_FILE=PROPHET_STORY_HOME/"pronunciation-review.json"
PROPHET_STORY_CAFFEINATE_LOCK=threading.Lock()
PROPHET_STORY_CAFFEINATE=None
LEARNING_PREVIEWS={}
LEARNING_PREVIEW_JOB_LOCK=threading.Lock()
LEARNING_PREVIEW_SERIAL_LOCK=threading.Lock()
LEARNING_PREVIEW_JOBS={}
GENERATION_JOB_LOCK=threading.Lock()
GENERATION_JOBS={}
GENERATION_JOB_TTL_SECONDS=2*60*60
ANALYSIS_PREFLIGHT_CACHE_LOCK=threading.Lock()
ANALYSIS_PREFLIGHT_CACHE={}
ANALYSIS_PREFLIGHT_CACHE_MAX=24
ALPHABET_BATCH_STATE={
    "running":False,
    "phase":"idle",
    "progress":0,
    "completed":0,
    "total":226,
    "current":"",
    "error":"",
    "exportPath":"",
    "zipPath":"",
    "repoPublished":False,
    "repoPublishError":"",
    "startedAt":"",
    "finishedAt":"",
}

def load_json_file(path:Path,default):
    try:
        if path.exists():
            raw=path.read_text(encoding="utf-8")
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                # 2.9.26–2.9.32 konnten bei atomaren JSON-Schreibvorgängen
                # versehentlich die zwei Literalzeichen "\n" hinter ein
                # ansonsten gültiges JSON setzen. Diesen exakt bekannten Altfall
                # einmalig reparieren; sonst niemals Daten stillschweigend ändern.
                repaired=raw
                changed=False
                while repaired.endswith("\\n"):
                    repaired=repaired[:-2]
                    changed=True
                if changed:
                    repaired=repaired.rstrip()+"\n"
                    parsed=json.loads(repaired)
                    try:
                        path.write_text(repaired,encoding="utf-8")
                        print("[DĀR Voice] legacy JSON terminator repaired:",path,flush=True)
                    except Exception as write_error:
                        print("[DĀR Voice] JSON repair write warning",path,write_error,flush=True)
                    return parsed
                raise
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
        tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        os.replace(tmp,path)
    finally:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass


def load_kids_repo_json(local_name:str,repo_path:str,validator):
    """Load packaged Kids JSON and self-heal a missing/invalid installer copy.

    GitHub's Contents API can return either the requested raw media or a JSON
    envelope containing base64 data. Both forms are accepted. A valid remote
    recovery is persisted into APP_HOME so the next app start is fully local.
    """
    local_path=APP_HOME/local_name
    local=load_json_file(local_path,{})
    try:
        if validator(local):
            return local
    except Exception:
        pass

    url=(
        "https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/"
        +repo_path+"?ref=main"
    )
    try:
        req=urllib.request.Request(
            url,
            headers={
                "Accept":"application/vnd.github.raw+json",
                "User-Agent":"DAR-Voice-Studio-Kids-Manifest-Recovery/1",
            },
        )
        with urllib.request.urlopen(req,timeout=25) as response:
            raw=response.read()
        try:
            remote=json.loads(raw.decode("utf-8"))
        except Exception:
            remote=None

        if isinstance(remote,dict) and isinstance(remote.get("content"),str):
            decoded=base64.b64decode(re.sub(r"\s+","",remote["content"]))
            remote=json.loads(decoded.decode("utf-8"))
        elif not isinstance(remote,dict):
            remote=json.loads(raw.decode("utf-8"))

        if not validator(remote):
            raise ValueError("GitHub lieferte eine ungültige Kids-Datendatei.")

        atomic_write_json(local_path,remote)
        print("[DĀR Voice] Kids data self-healed:",local_path,flush=True)
        return remote
    except Exception as e:
        raise RuntimeError(
            f"{local_name} fehlt oder ist ungültig; automatische Wiederherstellung fehlgeschlagen: {e}"
        ) from e

def refresh_studio_ui_from_github():
    files=(
        ("voice-studio/index.html","studio.html",("id=\"prophetPick\"","prophetPickList","Geschichten der Propheten")),
        ("voice-studio/content-studio.js","content-studio.js",("csProphetTab","ensureProphetUi")),
        ("voice-studio/mubashshirun-pack.js","mubashshirun-pack.js",("mubVoicePack","Die zehn Mubaschschirūn")),
        ("kids/data/mubashshirun-stories.json","mubashshirun-stories.json",("\"version\": 4","\"al-ʿAšarah al-Mubaššarūn\"")),
    )
    for repo,name,markers in files:
        try:
            req=urllib.request.Request(
                "https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/"+repo+"?ref=main",
                headers={
                    "Accept":"application/vnd.github.raw+json",
                    "User-Agent":"DAR-Voice-Studio-Studio-Sync/1",
                    "Cache-Control":"no-cache",
                },
            )
            with urllib.request.urlopen(req,timeout=25) as response:
                raw=response.read()
            text=raw.decode("utf-8","replace")
            if text.lstrip().startswith("{") and '"encoding"' in text[:400]:
                remote=json.loads(text)
                blob=str(remote.get("content") or "")
                text=base64.b64decode(re.sub(r"\s+","",blob)).decode("utf-8","replace")
            if not all(m in text for m in markers):
                continue
            (APP_HOME/name).write_text(text,encoding="utf-8")
            print("[DĀR Voice] Studio-UI aktualisiert:",name,flush=True)
        except Exception as e:
            print("[DĀR Voice] Studio-UI Sync übersprungen:",name,e,flush=True)

def load_alphabet_manifest():
    return load_kids_repo_json(
        "alphabet-audio.json",
        "kids/data/alphabet-audio.json",
        lambda d:isinstance(d,dict) and isinstance((d.get("letters") or {}).get("alif"),dict),
    )

def load_quiz_manifest():
    return load_kids_repo_json(
        "quiz-kids.json",
        "kids/data/quiz-kids.json",
        lambda d:isinstance(d,dict) and len(d.get("items") or [])>0,
    )

def load_dua_manifest():
    return load_kids_repo_json(
        "dua-kids.json",
        "kids/data/dua-kids.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_authentic_story_manifest():
    return load_kids_repo_json(
        "stories-authentic.json",
        "kids/data/stories-authentic.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_verified_content_manifest():
    return load_kids_repo_json(
        "verified-content.json",
        "kids/data/verified-content.json",
        lambda d:isinstance(d,dict) and (
            isinstance(d.get("hadithLessons"),list)
            or isinstance(d.get("earlyLessons"),list)
        ),
    )

def load_kids_owner_voice_sources():
    return load_kids_repo_json(
        "short-stories-voice.json",
        "kids/data/short-stories-voice.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_fresh_kids_repo_json(local_name:str,repo_path:str,validator):
    """Lädt Kids-Inhalte frisch von main; bei Netzfehler bleibt die installierte Kopie nutzbar."""
    url="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/"+repo_path+"?ref=main"
    try:
        req=urllib.request.Request(
            url,
            headers={
                "Accept":"application/vnd.github.raw+json",
                "User-Agent":"DAR-Voice-Studio-Kids-Owner-Voice-Sync/1",
                "Cache-Control":"no-cache",
            },
        )
        with urllib.request.urlopen(req,timeout=25) as response:
            raw=response.read()
        try:
            remote=json.loads(raw.decode("utf-8"))
        except Exception:
            remote=None
        if isinstance(remote,dict) and isinstance(remote.get("content"),str):
            decoded=base64.b64decode(re.sub(r"\s+","",remote["content"]))
            remote=json.loads(decoded.decode("utf-8"))
        elif not isinstance(remote,dict):
            remote=json.loads(raw.decode("utf-8"))
        if validator(remote):
            atomic_write_json(APP_HOME/local_name,remote)
            return remote
    except Exception as e:
        print("[DĀR Voice] Kids-Voice-Quelle konnte nicht frisch geladen werden:",repo_path,e,flush=True)
    return load_kids_repo_json(local_name,repo_path,validator)

def load_owner_voice_manifest_fresh():
    return load_fresh_kids_repo_json(
        "owner-voice-audio.json","kids/data/owner-voice-audio.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("entries"),dict),
    )

def load_dua_manifest_fresh():
    return load_fresh_kids_repo_json(
        "dua-kids.json","kids/data/dua-kids.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_authentic_stories_fresh():
    return load_fresh_kids_repo_json(
        "stories-authentic.json","kids/data/stories-authentic.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_short_stories_voice_fresh():
    return load_fresh_kids_repo_json(
        "short-stories-voice.json","kids/data/short-stories-voice.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

def load_verified_content_fresh():
    return load_fresh_kids_repo_json(
        "verified-content.json","kids/data/verified-content.json",
        lambda d:isinstance(d,dict) and any(isinstance(d.get(k),list) for k in ("duas","hadithLessons","earlyLessons")),
    )

def load_live_kids_content_fresh():
    return load_fresh_kids_repo_json(
        "kids-content-index.json","content/kids/content-index.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list),
    )

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
            fh.write(json.dumps(record,ensure_ascii=False)+"\n")
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

def load_max_master_pls(path:Path):
    """Lädt das große PLS-Aussprachelexikon als vorinstallierten Fallback.

    Bereits kuratierte Voice-Studio-Regeln behalten Vorrang. Die PLS-Einträge
    liefern zusätzliche bekannte Schreibweisen und Sprechformen, ohne lokale
    menschlich bestätigte MASTER-Regeln zu überschreiben.
    """
    if not path.exists():
        print("[DĀR Voice] MAX-MASTER-PLS fehlt – starte mit bestehender Bibliothek.",flush=True)
        return []
    try:
        root=ET.parse(path).getroot()
        ns={"p":"http://www.w3.org/2005/01/pronunciation-lexicon"}
        out=[]
        seen=set()
        for lexeme in root.findall("p:lexeme",ns):
            grapheme=str(lexeme.findtext("p:grapheme",default="",namespaces=ns) or "").strip()
            alias=str(lexeme.findtext("p:alias",default="",namespaces=ns) or "").strip()
            if not grapheme or not alias:
                continue
            if grapheme in seen:
                continue
            seen.add(grapheme)
            out.append({
                "category":"MAX MASTER PLS",
                "canonical":grapheme,
                "string_to_replace":grapheme,
                "alias":alias,
                "tts_text":alias,
                "tts_language":"de",
                "tts_strategy":"max-master-pls-v2-trusted",
                "voice_lock":"MASTER",
                "qa_tier":"installed-curated",
                "source":"DAR_AL_TAWHID_ElevenLabs_Aussprache_MAX_MASTER.pls",
                "trusted_seed":True,
                "requires_boundary":True,
            })
        print(f"[DĀR Voice] MAX-MASTER-PLS geladen: {len(out)} Schreib-/Sprechvarianten.",flush=True)
        return out
    except Exception as e:
        print("[DĀR Voice] MAX-MASTER-PLS konnte nicht geladen werden:",e,flush=True)
        return []

BASE_LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
_BASE_RULES=list(BASE_LIB.get("rules",[]))
MAX_MASTER_PLS_RULES=load_max_master_pls(PLS_MASTER)
_BASE_RULE_EXACT={
    str(r.get("string_to_replace","")).strip()
    for r in _BASE_RULES
    if str(r.get("string_to_replace","")).strip()
}
MAX_MASTER_PLS_FALLBACK_RULES=[
    r for r in MAX_MASTER_PLS_RULES
    if str(r.get("string_to_replace","")).strip() not in _BASE_RULE_EXACT
]
BASE_RULES=_BASE_RULES+MAX_MASTER_PLS_FALLBACK_RULES

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

FIXED_PHRASE_ITEMS=[
    dict(item or {})
    for item in ((VOICE_PROFILE.get("pronunciation") or {}).get("fixedPhrases") or [])
    if str((item or {}).get("tts_text") or "").strip()
]
FIXED_PHRASE_TTS={
    str(item.get("tts_text") or "").strip()
    for item in FIXED_PHRASE_ITEMS
}

def fixed_phrase_config_for_tts(text:str):
    value=str(text or "").strip().strip(
        AUDIO_LOCK_EDGE_CHARS if "AUDIO_LOCK_EDGE_CHARS" in globals()
        else " \t\r\n.,،;؛:!?؟…·-–—()[]{}«»\"“”„‘’"
    )
    for item in FIXED_PHRASE_ITEMS:
        if str(item.get("tts_text") or "").strip()==value:
            return item
    return {}

def is_profile_fixed_phrase_tts(text:str):
    return bool(fixed_phrase_config_for_tts(text))

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
KNOWN_RULE_ALIAS_INDEX={}

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

PRONUNCIATION_CATALOG_CACHE_VERSION=0
PRONUNCIATION_CATALOG_CACHE={"key":None,"rows":[]}
PRONUNCIATION_CATALOG_CACHE_LOCK=threading.Lock()

RULES_BY_FIRST={}

def rebuild_runtime_rules():
    global LIB,RULES,MASTER_TTS,AUDIO_LOCK_BY_TTS,AUDIO_LOCK_LABELS,AUDIO_LOCK_FORMS
    global HONORIFIC_TTS_BY_KEY,HONORIFIC_RULE_BY_KEY,HONORIFIC_SOURCE_FORMS
    global MASTER_ENTRIES,MASTER_RULES,MASTER_ALIAS_INDEX,KNOWN_RULE_ALIAS_INDEX,PRONUNCIATION_CATALOG_CACHE_VERSION,RULES_BY_FIRST
    user_rules=list((USER_OVERRIDE_DATA or {}).get("rules") or [])
    MASTER_ENTRIES=build_master_library()
    blocked=[str(r.get("string_to_replace","")) for r in user_rules+BASE_RULES]
    MASTER_RULES=master_rules_from_entries(MASTER_ENTRIES,blocked)
    # User-bestätigte Regeln stehen zuerst; installierte Regeln schlagen jeden Online-/Seed-Eintrag.
    RULES=sorted(user_rules+BASE_RULES+MASTER_RULES,key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
    # 2.9.93: O(1)-Startindex statt bei jedem Zeichen tausende Regeln zu prüfen.
    # Die Reihenfolge pro Anfangszeichen bleibt "längste Regel zuerst".
    RULES_BY_FIRST={}
    for _rule in RULES:
        _needle=str((_rule or {}).get("string_to_replace") or "")
        if _needle:
            RULES_BY_FIRST.setdefault(_needle[0],[]).append(_rule)
    MASTER_ALIAS_INDEX={}
    for e in MASTER_ENTRIES:
        for form in [e.get("canonical",""),*(e.get("aliases") or [])]:
            norm=normalize_lookup(form)
            if norm and norm not in MASTER_ALIAS_INDEX:
                MASTER_ALIAS_INDEX[norm]=e

    # 2.9.96 Fast-Known-Path:
    # Jede tatsächlich aktive Aussprache-Regel wird einmal normalisiert indexiert.
    # Dadurch gelten bestätigte Regeln, kuratierte Basisregeln und das große
    # ElevenLabs/MAX-MASTER-PLS bei exakter Schreibweise sofort als bekannt.
    # Unbekannte Wörter bleiben weiterhin REVIEW-pflichtig.
    KNOWN_RULE_ALIAS_INDEX={}
    for r in RULES:
        for form in (
            r.get("string_to_replace",""),
            r.get("canonical",""),
            r.get("alias",""),
        ):
            norm=normalize_lookup(form)
            if norm and norm not in KNOWN_RULE_ALIAS_INDEX:
                KNOWN_RULE_ALIAS_INDEX[norm]=r
    LIB=dict(BASE_LIB)
    LIB["rules"]=RULES
    counts=dict(BASE_LIB.get("counts") or {})
    counts["rules"]=len(RULES)
    counts["userLearnedRules"]=len(user_rules)
    counts["onlineSearchRules"]=len(ONLINE_RULES)
    counts["maxMasterPlsRules"]=len(MAX_MASTER_PLS_RULES)
    counts["maxMasterPlsFallbackRules"]=len(MAX_MASTER_PLS_FALLBACK_RULES)
    counts["knownRuleAliases"]=len(KNOWN_RULE_ALIAS_INDEX)
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
    PRONUNCIATION_CATALOG_CACHE_VERSION+=1

rebuild_runtime_rules()

MODEL=None
MODEL_DEVICE=None
MODEL_LOCK=threading.Lock()
RENDER_LOCK=threading.Lock()
MANUAL_RENDER_WAITING=threading.Event()
LEARNING_PREVIEW_WAITING=threading.Event()
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
# 2.9.93 Extreme Fast: das quantisierte 4-bit-Modell ist auf Apple Silicon
# der Standard. Der große Multilingual-V3-Renderer bleibt als Qualitätsmodell
# verfügbar und kann per DAR_VOICE_MLX_MODEL erzwungen werden.
MLX_PRIMARY_MODEL_ID="mlx-community/chatterbox-4bit"
MLX_QUALITY_MODEL_ID="mlx-community/chatterbox-multilingual-v3"
MLX_MODEL_ID=os.environ.get("DAR_VOICE_MLX_MODEL",MLX_PRIMARY_MODEL_ID)
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

def honorific_lock_keys_in_chunk(text:str):
    value=str(text or "")
    found=[]
    for form,key in AUDIO_LOCK_BY_TTS.items():
        if key in HONORIFIC_KEYS and form and form in value and key not in found:
            found.append(key)
    return found

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
    """Niedriglatenz-Suche über den bereits im RAM aufgebauten Wortindex.

    Exakte/Teiltreffer brauchen kein teures SequenceMatcher über tausende Regeln.
    Fuzzy-Vergleich läuft nur noch auf einer kleinen, plausiblen Kandidatenmenge.
    """
    q=normalize_lookup(query)
    if not q:
        return []
    limit=max(1,min(25,int(limit or 10)))
    rows=_pronunciation_catalog_rows()
    priority={"gelernt":0,"installiert":1,"master":2,"online":3}
    ranked=[]
    fuzzy=[]

    for row in rows:
        values=[
            normalize_lookup(row.get("input","")),
            normalize_lookup(row.get("canonical","")),
            normalize_lookup(row.get("alias","")),
            normalize_lookup(row.get("ttsText","")),
        ]
        values=[v for v in values if v]
        if not values:
            continue

        if any(v==q for v in values):
            score=1.0
        elif any(v.startswith(q) or q.startswith(v) for v in values if min(len(q),len(v))>=3):
            score=0.96
        elif any(q in v or v in q for v in values if min(len(q),len(v))>=4):
            score=0.92
        else:
            # Nur ähnliche Längen/Anfänge für den teureren Fuzzy-Pfad vormerken.
            # Transliteration/Diakritika sind bereits durch normalize_lookup reduziert.
            q0=q[:1]
            plausible=[
                v for v in values
                if v[:1]==q0 and abs(len(v)-len(q))<=max(5,int(max(len(v),len(q))*.45))
            ]
            if plausible:
                fuzzy.append((row,plausible))
            continue

        ranked.append((
            score,
            priority.get(str(row.get("source") or ""),4),
            row
        ))

    # Nur wenn exakte/Teiltreffer nicht reichen, wenige plausible Formen fuzzy prüfen.
    if len(ranked)<limit:
        for row,values in fuzzy[:700]:
            score=max(difflib.SequenceMatcher(None,q,v).ratio() for v in values)
            if score<0.48:
                continue
            ranked.append((
                score,
                priority.get(str(row.get("source") or ""),4),
                row
            ))

    ranked.sort(key=lambda x:(
        -float(x[0]),
        int(x[1]),
        -len(str(x[2].get("input") or x[2].get("canonical") or ""))
    ))
    out=[];seen=set()
    for score,_,row in ranked:
        key=(
            normalize_lookup(row.get("canonical","")),
            str(row.get("ttsText") or ""),
            str(row.get("ttsLanguage") or "")
        )
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "source":str(row.get("source") or ""),
            "score":round(float(score),3),
            "input":str(row.get("input") or ""),
            "canonical":str(row.get("canonical") or row.get("input") or ""),
            "alias":str(row.get("alias") or ""),
            "ttsText":str(row.get("ttsText") or ""),
            "ttsLanguage":str(row.get("ttsLanguage") or "de"),
            "ipa":str(row.get("ipa") or ""),
            "category":str(row.get("category") or ""),
            "audioLockKey":str(row.get("audioLockKey") or ""),
            "requiredHonorificKey":str(row.get("requiredHonorificKey") or ""),
            "voiceLock":str(row.get("voiceLock") or ""),
        })
        if len(out)>=limit:
            break
    return out

def pronunciation_candidates(query:str,limit:int=12):
    """Mehrere hörbare Kandidaten für den Lernbereich.
    Priorität: bestätigte/lokale Regeln -> Master-Vorschläge -> sichtbare Schreibweise.
    Die sichtbare Schreibweise ist nur ein Testkandidat und wird nie automatisch freigegeben.
    """
    query=str(query or "").strip()
    if not query:
        return []
    out=[];seen=set()

    def add(item):
        tts=str((item or {}).get("ttsText") or "").strip()
        canonical=str((item or {}).get("canonical") or query).strip()
        lang=str((item or {}).get("ttsLanguage") or ("ar" if re.search(r"[\u0600-\u06ff]",tts) else "de")).strip().lower()
        key=(normalize_lookup(canonical),tts,lang)
        if not tts or key in seen:
            return
        seen.add(key)
        row=dict(item or {})
        row["canonical"]=canonical
        row["ttsText"]=tts
        row["ttsLanguage"]=lang if lang in ("ar","de") else ("ar" if re.search(r"[\u0600-\u06ff]",tts) else "de")
        row.setdefault("candidateKind","library")
        out.append(row)

    for row in pronunciation_search(query,max(25,int(limit or 12))):
        add(row)

    # Die Master-Library enthält häufig zusätzliche Fuṣḥā-Formen, die nicht als
    # direkte String-Regel geladen wurden. Diese wieder als auswählbare Kandidaten zeigen.
    for s in master_suggestions(query,max(8,int(limit or 12))):
        add({
            "source":str(s.get("origin") or "Master-Library"),
            "score":float(s.get("score") or 0),
            "input":query,
            "canonical":str(s.get("canonical") or query),
            "alias":str(s.get("transliteration") or ""),
            "ttsText":str(s.get("arabic") or ""),
            "ttsLanguage":"ar",
            "category":str(s.get("category") or ""),
            "audioLockKey":"",
            "requiredHonorificKey":str(s.get("requiredHonorificKey") or ""),
            "voiceLock":"REVIEW",
            "candidateKind":"master-suggestion",
        })

    # Wenn es eine sichere arabische Bibliotheksform gibt, darf der Nutzer zusätzlich
    # die sichtbare Schreibweise als Vergleich hören. Das ist ein Test, kein Auto-Master.
    has_ar=any(str(x.get("ttsLanguage") or "")=="ar" for x in out)
    if has_ar and not re.search(r"[\u0600-\u06ff]",query):
        add({
            "source":"Sichtbare Schreibweise",
            "score":0.5,
            "input":query,
            "canonical":query,
            "alias":query,
            "ttsText":query,
            "ttsLanguage":"de",
            "category":"manual-comparison",
            "audioLockKey":"",
            "requiredHonorificKey":"",
            "voiceLock":"REVIEW",
            "candidateKind":"visible-comparison",
            "requiresReview":True,
        })

    if not out:
        add({
            "source":"Manuell",
            "score":0.25,
            "input":query,
            "canonical":query,
            "alias":query,
            "ttsText":query,
            "ttsLanguage":"ar" if re.search(r"[\u0600-\u06ff]",query) else "de",
            "category":"manual",
            "audioLockKey":"",
            "requiredHonorificKey":"",
            "voiceLock":"REVIEW",
            "candidateKind":"manual",
            "requiresReview":True,
        })

    # Fuṣḥā-/exakte Treffer zuerst, Vergleich/Manuell zuletzt.
    out.sort(key=lambda x:(
        0 if str(x.get("ttsLanguage") or "")=="ar" else 1,
        -float(x.get("score") or 0),
        1 if x.get("candidateKind") in ("visible-comparison","manual") else 0,
    ))
    return out[:max(1,min(25,int(limit or 12)))]

def _pronunciation_catalog_rows():
    """Vollständige Wortliste einmal pro Regelstand aufbauen und im RAM halten."""
    global PRONUNCIATION_CATALOG_CACHE
    confirmed=tuple(sorted(confirmed_audio_lock_keys()))
    cache_key=(int(PRONUNCIATION_CATALOG_CACHE_VERSION),confirmed)
    with PRONUNCIATION_CATALOG_CACHE_LOCK:
        if PRONUNCIATION_CATALOG_CACHE.get("key")==cache_key:
            return list(PRONUNCIATION_CATALOG_CACHE.get("rows") or [])

    rows=[]
    seen=set()
    confirmed_set=set(confirmed)
    for source,r in combined_search_rules():
        canonical=str(r.get("canonical") or r.get("string_to_replace") or "").strip()
        tts=str(r.get("tts_text") or r.get("alias") or canonical).strip()
        if not canonical or not tts:
            continue
        key=(normalize_lookup(canonical),tts,str(r.get("tts_language") or ""))
        if key in seen:
            continue
        seen.add(key)
        lang=str(r.get("tts_language") or ("ar" if re.search(r"[\u0600-\u06ff]",tts) else "de"))
        lock_key=str(r.get("audio_lock_key") or "")
        search_text=" ".join([
            normalize_lookup(canonical),
            normalize_lookup(r.get("string_to_replace","")),
            normalize_lookup(r.get("alias","")),
            normalize_lookup(tts),
        ])
        rows.append({
            "source":source,
            "input":str(r.get("string_to_replace") or canonical),
            "canonical":canonical,
            "alias":str(r.get("alias") or ""),
            "ttsText":tts,
            "ttsLanguage":lang if lang in ("ar","de") else "de",
            "category":str(r.get("category") or ""),
            "ipa":str(r.get("ipa") or ""),
            "audioLockKey":lock_key,
            "requiredHonorificKey":str(r.get("required_honorific_key") or ""),
            "voiceLock":str(r.get("voice_lock") or ""),
            "confirmed":bool(
                str(r.get("voice_lock") or "").upper()=="MASTER"
                or (lock_key and lock_key in confirmed_set)
            ),
            "_search":search_text,
        })
    rows.sort(key=lambda x:(normalize_lookup(x.get("canonical","")),normalize_lookup(x.get("ttsText",""))))
    with PRONUNCIATION_CATALOG_CACHE_LOCK:
        PRONUNCIATION_CATALOG_CACHE={"key":cache_key,"rows":rows}
    return list(rows)

def pronunciation_catalog(query:str="",offset:int=0,limit:int=80):
    """Schnelle, paginierte Gesamtliste des installierten Aussprachewortschatzes."""
    needle=normalize_lookup(query)
    offset=max(0,int(offset or 0))
    limit=max(20,min(160,int(limit or 80)))
    rows=_pronunciation_catalog_rows()
    if needle:
        rows=[row for row in rows if needle in str(row.get("_search") or "")]
    total=len(rows)
    page=[
        {k:v for k,v in row.items() if k!="_search"}
        for row in rows[offset:offset+limit]
    ]
    return {
        "ok":True,
        "query":str(query or ""),
        "total":total,
        "offset":offset,
        "limit":limit,
        "hasMore":offset+len(page)<total,
        "items":page,
        "cached":True,
    }

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

def render_learning_preview_fast(model,text:str,language_id:str,mode:str):
    """Niedriglatenz-Pfad für einzelne Wörter und kurze Phrasen."""
    if getattr(model,"_dar_backend","torch")!="mlx":
        return render_with_model(model,text,language_id,mode)
    import numpy as np, torch
    ref=reference_for_language(language_id)
    p=prosody_settings(mode,language_id,text)
    chars=len(re.sub(r"\s+","",str(text or "")))
    budget=max(64,min(190,int(54+chars*2.6)))
    timeout_s=max(7.0,min(15.0,5.5+chars*0.24))
    msg=_mlx_request({
        "op":"render",
        "ref_path":str(ref),
        "text":str(text),
        "language_id":str(language_id),
        "exaggeration":float(p["exaggeration"]),
        "cfg_weight":float(p["cfg_weight"]),
        "temperature":float(p["temperature"]),
        "max_tokens":int(budget),
    },timeout_s=timeout_s,heartbeat=False)
    arr=np.frombuffer(msg.get("audio",b""),dtype=np.float32).copy()
    expected=int(msg.get("samples",arr.size) or arr.size)
    if arr.size!=expected or arr.size==0:
        raise RuntimeError("Schnelltest lieferte kein vollständiges Audio.")
    render_learning_preview_fast._last_backend_meta=dict(msg.get("meta") or {})
    return torch.from_numpy(arr).view(1,-1)

render_learning_preview_fast._last_backend_meta={}

def create_learning_preview(term:str,tts_text:str="",canonical:str="",language_id:str="",variant:int=0):
    term=str(term or "").strip()
    if not term:
        raise ValueError("Wort oder Name fehlt.")
    rule=find_learning_rule(term,tts_text,canonical)
    effective_tts=str(tts_text or (rule or {}).get("tts_text","")).strip()
    if not effective_tts:
        # Auch normale deutsche Wörter/Namen dürfen manuell gelernt werden.
        # Ohne Bibliothekstreffer ist der sichtbare Begriff selbst die erste Sprechform.
        effective_tts=term

    requested=str(language_id or (rule or {}).get("tts_language") or "").strip().lower()
    if requested not in ("ar","de"):
        requested="ar" if re.search(r"[\u0600-\u06ff]",effective_tts) else "de"
    if requested=="ar" and not re.search(r"[\u0600-\u06ff]",effective_tts):
        raise ValueError("Für Arabisch muss die Sprechform in arabischer Schrift angegeben werden.")

    variant=max(0,min(9,int(variant or 0)))
    preview_id=uuid.uuid4().hex[:16]
    existing_key=str((rule or {}).get("audio_lock_key","")) or str(AUDIO_LOCK_BY_TTS.get(effective_tts,""))
    lock_key=learning_lock_key(term,existing_key)
    mode="kids_lesson" if requested=="ar" else "narration"
    ref=reference_for_language(requested)
    signature="|".join([
        normalize_lookup(term),
        effective_tts,
        requested,
        str(variant),
        file_signature(ref),
        "fast-learning-preview-v2-qa",
    ])
    cache_key=hashlib.sha256(signature.encode("utf-8")).hexdigest()
    cache_path=LEARNING_PREVIEW_CACHE_DIR/(cache_key+".wav")
    path=LEARNING_PENDING_DIR/f"{preview_id}.wav"
    preview_mode="fast-render"
    started=time.perf_counter()

    # Bereits bestätigte Audio-Locks sind die schnellste und sicherste Vorschau.
    locked=audio_lock_path(lock_key)
    if variant==0 and locked.exists() and locked.stat().st_size>44:
        shutil.copy2(locked,path)
        wav=load_locked_wav(locked,24000)
        metrics=audio_quality_metrics(wav,24000,effective_tts,requested,mode)
        preview_mode="confirmed-lock"
        sample_rate=24000
    elif cache_path.exists() and cache_path.stat().st_size>44:
        shutil.copy2(cache_path,path)
        wav=load_locked_wav(cache_path,24000)
        metrics=audio_quality_metrics(wav,24000,effective_tts,requested,mode)
        preview_mode="preview-cache"
        sample_rate=24000
    else:
        # ECHTER Schnelltest: nur das einzelne Wort / die kurze Phrase rendern.
        # Keine schwere Voll-QA-/Rescue-Kaskade: maximal zwei kurze Seeds,
        # danach sofort Ergebnis oder klarer Fehler. Das stellt den früheren
        # 15–30-Sekunden-Prüfworkflow wieder her und hält Varianten vergleichbar.
        model=load_production_model()
        sample_rate=int(model.sr)
        import torch
        seed=3000+(int(preview_id[:8],16)%800000)+variant*977
        last_error=None
        wav=None
        metrics=None
        # Ein Schnelltest ist eine *menschlich anzuhörende* Kandidatenprobe,
        # keine automatische Freigabe. Darum blockieren hier nur technische
        # Defekte bzw. offensichtlich pathologische Ausreißer. Moderate Pausen/
        # Holds bleiben in den Metriken sichtbar und werden vom Nutzer beim
        # Anhören bewertet; sie lösen keinen langsamen Vollrender mehr aus.
        hard={
            "empty_audio","non_finite","near_silence","low_peak","clipping","too_short",
            "short_arabic_too_long","suspicious_sustained_hold"
        }
        for attempt in range(2):
            try:
                torch.manual_seed(seed+attempt*97)
                # Beide Versuche bleiben im Low-Latency-Kurzpfad. Ein zweiter
                # Seed rettet Sampling-Ausreißer, ohne den deutlich langsameren
                # normalen Long-Form-Renderer für ein einzelnes Wort zu starten.
                wav=render_learning_preview_fast(
                    model,effective_tts,requested,mode
                )
                wav=trim_segment_edges(
                    wav,sample_rate,
                    aggressive=True,
                    inline=(requested=="ar" and is_inline_arabic_micro_term(effective_tts))
                )
                metrics=audio_quality_metrics(wav,sample_rate,effective_tts,requested,mode)
                blocking=[x for x in (metrics.get("issues") or []) if x in hard]
                if not blocking:
                    break
                last_error=", ".join(blocking)
                wav=None
            except Exception as e:
                last_error=str(e)
                wav=None
        if wav is None or metrics is None:
            raise RuntimeError(
                "Schnelltest verworfen: "+str(last_error or "technische Kurz-QA fehlgeschlagen")+
                ". Bitte direkt eine andere Variante testen."
            )
        save_wav(cache_path,wav,sample_rate)
        shutil.copy2(cache_path,path)
        preview_mode="low-latency-render"

    elapsed_ms=int(round((time.perf_counter()-started)*1000))
    meta={
        "id":preview_id,
        "term":term,
        "canonical":str(canonical or (rule or {}).get("canonical") or term),
        "tts_text":effective_tts,
        "tts_language":requested,
        "alias":str((rule or {}).get("alias","")),
        "ipa":str((rule or {}).get("ipa","")),
        "category":str((rule or {}).get("category","USER LEARNED")),
        "required_honorific_key":str((rule or {}).get("required_honorific_key","")),
        "audio_lock_key":lock_key,
        "path":str(path),
        "sample_rate":int(sample_rate),
        "metrics":metrics,
        "variant":variant,
        "previewMode":preview_mode,
        "elapsedMs":elapsed_ms,
        "createdAt":time.time(),
    }
    with LEARNING_LOCK:
        # Nur alte temporäre Vorschauen löschen. Der persistente Schnellcache bleibt.
        old=list(LEARNING_PREVIEWS.values())
        LEARNING_PREVIEWS.clear()
        LEARNING_PREVIEWS[preview_id]=meta
    for item in old:
        try: Path(item.get("path","")).unlink(missing_ok=True)
        except Exception: pass
    append_learning_log(
        "preview",term=term,canonical=meta["canonical"],lockKey=lock_key,
        previewMode=preview_mode,elapsedMs=elapsed_ms,variant=variant
    )
    return meta


def _cleanup_learning_preview_jobs():
    cutoff=time.time()-900
    with LEARNING_PREVIEW_JOB_LOCK:
        stale=[
            key for key,row in LEARNING_PREVIEW_JOBS.items()
            if float((row or {}).get("createdAt") or 0)<cutoff
        ]
        for key in stale:
            LEARNING_PREVIEW_JOBS.pop(key,None)

def _learning_preview_job_snapshot(job_id:str):
    with LEARNING_PREVIEW_JOB_LOCK:
        row=dict(LEARNING_PREVIEW_JOBS.get(str(job_id or "")) or {})
    if not row:
        return {"ok":False,"jobId":str(job_id or ""),"state":"missing","error":"Schnelltest-Auftrag nicht gefunden."}
    # Lokale Dateipfade nie an die UI ausgeben.
    row.pop("path",None)
    row.pop("meta",None)
    return {"ok":True,**row}

def _run_learning_preview_job(job_id:str,payload:dict):
    with LEARNING_PREVIEW_SERIAL_LOCK:
        LEARNING_PREVIEW_WAITING.set()
        try:
            with LEARNING_PREVIEW_JOB_LOCK:
                row=LEARNING_PREVIEW_JOBS.get(job_id)
                if row is not None:
                    row.update({
                        "state":"rendering",
                        "message":"Sicherer Schnelltest wird erzeugt …",
                        "startedAt":time.time(),
                    })
            meta=create_learning_preview(
                str(payload.get("term","")),
                str(payload.get("ttsText","")),
                str(payload.get("canonical","")),
                str(payload.get("language","")),
                int(payload.get("variant",0) or 0),
            )
            with LEARNING_PREVIEW_JOB_LOCK:
                row=LEARNING_PREVIEW_JOBS.get(job_id)
                if row is not None:
                    row.update({
                        "state":"ready",
                        "message":"Schnelltest bereit.",
                        "previewId":str(meta.get("id") or ""),
                        "previewMode":str(meta.get("previewMode") or "qa-fast-render"),
                        "elapsedMs":int(meta.get("elapsedMs") or 0),
                        "variant":int(meta.get("variant") or 0),
                        "path":str(meta.get("path") or ""),
                        "finishedAt":time.time(),
                        "error":"",
                    })
        except Exception as e:
            with LEARNING_PREVIEW_JOB_LOCK:
                row=LEARNING_PREVIEW_JOBS.get(job_id)
                if row is not None:
                    row.update({
                        "state":"error",
                        "message":"Schnelltest fehlgeschlagen.",
                        "error":str(e),
                        "finishedAt":time.time(),
                    })
        finally:
            LEARNING_PREVIEW_WAITING.clear()

def start_learning_preview_job(payload:dict):
    _cleanup_learning_preview_jobs()
    payload=dict(payload or {})
    term=str(payload.get("term","")).strip()
    if not term:
        raise ValueError("Wort oder Name fehlt.")

    # Identische Schnelltests werden fünf Minuten lang wiederverwendet. Mobile
    # und Mac dürfen deshalb den wahrscheinlichsten Kandidaten schon nach der
    # Suche leise vorladen; der anschließende Klick hängt sich an denselben Job,
    # statt die Serhat-Engine ein zweites Mal rechnen zu lassen.
    variant=max(0,min(9,int(payload.get("variant",0) or 0)))
    request_key=hashlib.sha256("\u241f".join([
        normalize_lookup(term),
        str(payload.get("ttsText","")).strip(),
        str(payload.get("canonical","")).strip(),
        str(payload.get("language","")).strip().lower(),
        str(variant),
    ]).encode("utf-8")).hexdigest()[:24]
    reuse_id=""
    now=time.time()
    with LEARNING_PREVIEW_JOB_LOCK:
        for existing_id,existing in LEARNING_PREVIEW_JOBS.items():
            if str((existing or {}).get("requestKey") or "")!=request_key:
                continue
            if now-float((existing or {}).get("createdAt") or 0)>300:
                continue
            state=str((existing or {}).get("state") or "")
            if state not in ("queued","rendering","ready"):
                continue
            if state=="ready":
                p=Path(str((existing or {}).get("path") or ""))
                if not p.exists() or p.stat().st_size<=44:
                    continue
            reuse_id=str(existing_id)
            break
    if reuse_id:
        snap=_learning_preview_job_snapshot(reuse_id)
        snap["reused"]=True
        return snap

    job_id=uuid.uuid4().hex[:16]
    row={
        "jobId":job_id,
        "requestKey":request_key,
        "state":"queued",
        "message":"Schnelltest ist vorgemerkt. Laufende Geschichte bleibt unangetastet.",
        "term":term,
        "variant":variant,
        "createdAt":time.time(),
        "startedAt":0,
        "finishedAt":0,
        "previewId":"",
        "previewMode":"",
        "elapsedMs":0,
        "error":"",
    }
    with LEARNING_PREVIEW_JOB_LOCK:
        LEARNING_PREVIEW_JOBS[job_id]=row
    thread=threading.Thread(
        target=_run_learning_preview_job,
        args=(job_id,payload),
        daemon=True,
        name="dar-learning-preview-"+job_id[:6],
    )
    thread.start()
    snap=_learning_preview_job_snapshot(job_id)
    snap["reused"]=False
    return snap


def _alphabet_slot_kind(slot_id:str):
    parts=[p for p in str(slot_id or "").strip().lower().split("-") if p]
    if len(parts)>=2 and parts[1] in ("name","harakat","word"):
        return parts[1],(parts[2] if len(parts)>=3 else "")
    return "",""

def _alphabet_expected_duration(kind:str):
    if kind=="harakat":
        return (0.18,1.35)
    if kind=="name":
        return (0.32,2.40)
    if kind=="word":
        return (0.30,3.20)
    return (0.18,3.20)

def _extract_repeated_pronunciation_token(wav,sr:int,expected_count:int=3):
    """Extract one clean token from a repeated short-learning render.

    Very short Arabic CV targets such as بَ / بِ / بُ are unreliable when sent
    to TTS as a single glyph: the model can swallow the token or emit silence.
    Repeating the exact target three times gives the acoustic model enough
    context. We then isolate one voiced island and return only that token.
    """
    import torch
    w=normalize_segment_shape(wav)
    meta={"repeatedTokenExtracted":False,"detectedTokens":0}
    if not w.numel():
        return w,meta

    env=w.abs().amax(dim=0)
    peak=float(env.max().item()) if env.numel() else 0.0
    if peak<=1e-7:
        return w,meta

    frame=max(1,int(sr*0.010))
    count=env.numel()//frame
    if count<8:
        return w,meta
    framed=env[:count*frame].reshape(count,frame).mean(dim=1)
    threshold=max(peak*0.018,0.00035)
    active=(framed>threshold).tolist()

    # Merge tiny internal gaps (<60 ms) so fricatives/stops are not split.
    max_gap=6
    i=0
    while i<len(active):
        if active[i]:
            i+=1
            continue
        j=i
        while j<len(active) and not active[j]:
            j+=1
        if i>0 and j<len(active) and (j-i)<=max_gap:
            for k in range(i,j): active[k]=True
        i=j

    runs=[]
    start=None
    for i,flag in enumerate(active+[False]):
        if flag and start is None:
            start=i
        elif not flag and start is not None:
            dur_ms=(i-start)*10
            if 90<=dur_ms<=2200:
                runs.append((start,i,dur_ms))
            start=None

    meta["detectedTokens"]=len(runs)
    if not runs:
        return trim_segment_edges(w,sr,aggressive=True,inline=True),meta

    # Prefer a central token among the expected repetitions; otherwise choose
    # the duration closest to the median to avoid clipped first/last attempts.
    usable=runs
    if len(runs)>=expected_count:
        center=len(runs)//2
        usable=runs[max(0,center-1):min(len(runs),center+2)]
    durations=sorted(x[2] for x in usable)
    median=durations[len(durations)//2]
    chosen=min(usable,key=lambda x:(abs(x[2]-median),abs((x[0]+x[1])/2-count/2)))

    pad=max(1,int(sr*0.025))
    s=max(0,chosen[0]*frame-pad)
    e=min(w.shape[-1],chosen[1]*frame+pad)
    out=w[...,s:e]
    out=trim_segment_edges(out,sr,aggressive=True,inline=True)
    meta.update({
        "repeatedTokenExtracted":True,
        "selectedDurationMs":int(round(out.shape[-1]/max(1,sr)*1000)),
    })
    return out,meta

def _alphabet_render_prompt(value:str,kind:str):
    value=str(value or "").strip()
    if kind=="harakat":
        # Exact same Fuṣḥā target repeated; no carrier word is introduced that
        # could contaminate the learned syllable.
        return f"{value}. {value}. {value}.",3
    return value,1

def _render_repeated_harakat_raw(model,prompt:str,seed_base:int):
    """Render the deliberate repeated Ḥarakāt prompt without final short-token QA.

    The prompt contains the same target three times only so the acoustic model
    reliably produces the tiny CV syllable. Running the normal final Arabic
    duration QA on that temporary triple render is wrong by construction and
    caused short_arabic_too_long before extraction could happen.

    This stage therefore checks only hard waveform/generation failures. The
    isolated single token is still passed through the normal strict
    audio_quality_metrics() afterwards.
    """
    import torch

    attempts=max(2,int(QA_CONFIG.get("inlineArabicRenderAttempts",4)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    last_error=""

    for attempt in range(attempts):
        torch.manual_seed(max(1,int(seed_base))+attempt*seed_offset)
        try:
            wav=render_with_model(model,prompt,"ar","kids_lesson")
        except GenerationTimeoutReached as e:
            last_error="generation_timeout: "+str(e)
            continue
        except GenerationTokenLimitReached as e:
            last_error="generation_token_limit: "+str(e)
            continue
        except Exception as e:
            last_error=str(e)
            continue

        metrics=audio_quality_metrics(
            wav,int(model.sr),prompt,"ar","kids_lesson"
        )
        # The repeated working prompt is intentionally longer and contains
        # pauses between repetitions. Those are not defects in the final clip.
        ignored={
            "short_arabic_too_long",
            "unexpected_internal_hold",
            "inline_arabic_internal_hold",
            "excessive_internal_pause",
            "suspicious_sustained_hold",
            "segment_too_long",
            "speech_rate_too_slow",
        }
        hard=[x for x in (metrics.get("issues") or []) if x not in ignored]
        if hard:
            last_error=", ".join(hard)
            continue

        metrics["temporaryRepeatedHarakatRender"]=True
        metrics["ignoredPreExtractionIssues"]=[
            x for x in (metrics.get("issues") or []) if x in ignored
        ]
        return wav,metrics

    raise RuntimeError(
        "Ḥarakāt-Rohaufnahme konnte nicht sauber erzeugt werden"
        +(": "+last_error if last_error else "")
    )

def create_alphabet_voice_preview(text:str,slot_id:str="",variant:int=0):
    """Generate one Arabic learning clip in the local Serhat voice.

    Alphabet learning is now Fuṣḥā-strict. Technical QA never counts as
    linguistic approval. For isolated Ḥarakāt the target is rendered three
    times, one clean token is extracted, and that isolated token is measured
    again before it is offered for review.
    """
    value=str(text or "").strip()
    if not value:
        raise ValueError("Arabischer Lerntext fehlt.")
    if not re.search(r"[\u0600-\u06ff]",value):
        raise ValueError("Für den Alphabet-Lernbereich wird arabischer Text erwartet.")

    model=load_production_model()
    slot=str(slot_id or "alphabet").strip()
    kind,key=_alphabet_slot_kind(slot)
    variant=max(0,min(99,int(variant or 0)))
    digest=int(hashlib.sha1((slot+"|"+value).encode("utf-8")).hexdigest()[:8],16)
    seed0=7000+(digest%500000)+(variant*173)

    prompt,repeat_count=_alphabet_render_prompt(value,kind)
    min_dur,max_dur=_alphabet_expected_duration(kind)
    best=None
    failures=[]

    # Outer candidates are deliberate pronunciation variants. We keep the
    # technically cleanest one; none is linguistically auto-approved.
    for outer in range(4):
        seed=seed0+outer*997
        try:
            if repeat_count>1:
                # Temporary triple render: do not apply the final short-Arabic
                # duration rule until one clean token has been isolated.
                wav,render_metrics=_render_repeated_harakat_raw(
                    model,prompt,seed
                )
            else:
                wav,render_metrics=render_segment_with_qa(
                    model,
                    prompt,
                    "ar",
                    "kids_lesson",
                    True,
                    seed_base=seed
                )
        except Exception as e:
            failures.append(str(e))
            continue

        extraction={}
        if repeat_count>1:
            wav,extraction=_extract_repeated_pronunciation_token(
                wav,int(model.sr),repeat_count
            )
        else:
            wav=trim_segment_edges(
                wav,int(model.sr),
                aggressive=True,
                inline=is_inline_arabic_micro_term(value),
                lexical=False
            )

        final_metrics=audio_quality_metrics(
            wav,int(model.sr),value,"ar","kids_lesson"
        )
        duration=float(final_metrics.get("duration_s",0) or 0)
        issues=list(final_metrics.get("issues") or [])
        if duration<min_dur:
            issues.append("alphabet_target_too_short")
        if duration>max_dur:
            issues.append("alphabet_target_too_long")
        if kind=="harakat" and repeat_count>1 and not extraction.get("repeatedTokenExtracted"):
            issues.append("harakat_token_not_isolated")
        final_metrics["issues"]=list(dict.fromkeys(issues))
        final_metrics["fushaStrict"]=True
        final_metrics["alphabetKind"]=kind or "unknown"
        final_metrics["alphabetKey"]=key
        final_metrics["renderPrompt"]=prompt
        final_metrics["renderAttempt"]=outer+1
        final_metrics["preExtractionMetrics"]=render_metrics
        final_metrics.update(extraction)

        score=(
            len(final_metrics["issues"])*1000
            +abs(duration-({"harakat":0.65,"name":1.05,"word":1.20}.get(kind,1.0)))*10
            +float(final_metrics.get("max_internal_silence_ms",0) or 0)/1000
        )
        candidate=(score,wav,final_metrics)
        if best is None or score<best[0]:
            best=candidate
        if not final_metrics["issues"]:
            break

    if best is None:
        raise RuntimeError(
            "Fuṣḥā-Serhat-Kandidat konnte nicht erzeugt werden. "
            +(failures[-1] if failures else "Unbekannter Renderfehler.")
        )

    _,wav,metrics=best
    hard=list(metrics.get("issues") or [])
    if hard:
        raise RuntimeError(
            "Fuṣḥā-Serhat-Kandidat verworfen: "
            +", ".join(hard)
            +" · Text: "+value
        )

    preview_id=uuid.uuid4().hex[:16]
    path=LEARNING_PENDING_DIR/f"alphabet-{preview_id}.wav"
    save_wav(path,wav,int(model.sr))
    return {
        "id":preview_id,
        "path":str(path),
        "slot":slot,
        "text":value,
        "variant":variant,
        "sample_rate":int(model.sr),
        "metrics":metrics,
        "voice":"serhat-local-owner-voice",
        "generationProfile":ALPHABET_GENERATION_PROFILE,
        "fushaStrict":True,
        "linguisticVerified":False,
    }

def alphabet_master_state():
    state=load_json_file(ALPHABET_MASTER_STATE,{"schemaVersion":1,"masters":[]})
    masters=list((state or {}).get("masters") or [])
    return {
        "schemaVersion":1,
        "masters":masters,
        "count":len(masters),
        "persistentPath":str(ALPHABET_MASTER_STATE),
    }

def confirm_alphabet_voice_preview(
    preview_id:str,slot_id:str,letter_id:str,kind:str,key:str,text:str,
    linguistic_verified:bool=True
):
    preview_id=str(preview_id or "").strip()
    if not re.fullmatch(r"[0-9a-f]{16}",preview_id):
        raise ValueError("Der Serhat-Kandidat ist nicht mehr gültig. Bitte neu erzeugen.")
    slot_id=str(slot_id or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_-]{3,80}",slot_id):
        raise ValueError("Ungültiger Alphabet-Slot.")
    letter_id=str(letter_id or "").strip().lower()
    kind=str(kind or "").strip().lower()
    key=str(key or "").strip().lower()
    value=str(text or "").strip()
    if not letter_id or kind not in ("name","harakat","word") or not value:
        raise ValueError("Alphabet-Master ist unvollständig.")

    src=LEARNING_PENDING_DIR/f"alphabet-{preview_id}.wav"
    if not src.exists() or src.stat().st_size<=44:
        raise ValueError("Der erzeugte Serhat-Kandidat fehlt. Bitte neu erzeugen.")

    filename=re.sub(r"[^a-z0-9_-]+","-",slot_id).strip("-")+".wav"
    dst=ALPHABET_MASTER_HOME/filename
    tmp=dst.with_suffix(".tmp.wav")
    shutil.copy2(src,tmp)
    os.replace(tmp,dst)

    master={
        "slotId":slot_id,
        "letterId":letter_id,
        "kind":kind,
        "key":key,
        "text":value,
        "verified":bool(linguistic_verified),
        "linguisticVerified":bool(linguistic_verified),
        "technicalQaPassed":True,
        "reviewStatus":"approved" if linguistic_verified else "needs-human-review",
        "sourceVoice":"authorized-owner-voice",
        "voiceProfileId":"serhat-owner-voice-2026",
        "sourceType":"local-owner-confirmed-master",
        "generationProfile":ALPHABET_GENERATION_PROFILE,
        "url":"/alphabet/master/"+filename,
        "filename":filename,
        "confirmedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "reviewedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z") if linguistic_verified else "",
    }
    with ALPHABET_MASTER_LOCK:
        state=alphabet_master_state()
        masters=[
            dict(item) for item in (state.get("masters") or [])
            if str((item or {}).get("slotId") or "")!=slot_id
        ]
        masters.append(master)
        masters.sort(key=lambda x:str(x.get("slotId") or ""))
        atomic_write_json(ALPHABET_MASTER_STATE,{
            "schemaVersion":1,
            "updatedAt":master["confirmedAt"],
            "masters":masters,
        })
    try:
        src.unlink(missing_ok=True)
    except Exception:
        pass
    return master


def approve_existing_alphabet_master(slot_id:str):
    slot_id=str(slot_id or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_-]{3,80}",slot_id):
        raise ValueError("Ungültiger Alphabet-Slot.")
    now=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    with ALPHABET_MASTER_LOCK:
        state=alphabet_master_state()
        masters=[]
        approved=None
        for raw in (state.get("masters") or []):
            item=dict(raw or {})
            if str(item.get("slotId") or "")==slot_id:
                item["verified"]=True
                item["linguisticVerified"]=True
                item["technicalQaPassed"]=True
                item["reviewStatus"]="approved"
                item["reviewedAt"]=now
                approved=item
            masters.append(item)
        if approved is None:
            raise ValueError("Lokaler Serhat-Master für diesen Slot fehlt.")
        atomic_write_json(ALPHABET_MASTER_STATE,{
            "schemaVersion":1,
            "updatedAt":now,
            "masters":masters,
        })
    return approved

def _alphabet_batch_snapshot():
    with ALPHABET_BATCH_STATE_LOCK:
        data=dict(ALPHABET_BATCH_STATE)
    data["persistentStatePath"]=str(ALPHABET_BATCH_STATE_FILE)
    return data

def _set_alphabet_batch_state(**updates):
    with ALPHABET_BATCH_STATE_LOCK:
        ALPHABET_BATCH_STATE.update(updates)
        data=dict(ALPHABET_BATCH_STATE)
    try:
        atomic_write_json(ALPHABET_BATCH_STATE_FILE,data)
    except Exception:
        pass
    return data

def _alphabet_slot(manifest,letter_id:str,kind:str,key:str=""):
    letter=(manifest.get("letters") or {}).get(letter_id) or {}
    if kind=="harakat":
        return (letter.get("harakat") or {}).get(key)
    return letter.get(kind)

def _alphabet_tasks(manifest):
    tasks=[]
    for letter_id,letter in (manifest.get("letters") or {}).items():
        if letter.get("name"):
            tasks.append((letter_id,"name","",letter["name"]))
        for key in ("fatha","kasra","damma"):
            slot=(letter.get("harakat") or {}).get(key)
            if slot:
                tasks.append((letter_id,"harakat",key,slot))
        if letter.get("word"):
            tasks.append((letter_id,"word","",letter["word"]))
    return tasks

def _audio_duration_seconds(path:Path):
    import wave
    path=Path(path)
    if path.suffix.lower()==".wav":
        with wave.open(str(path),"rb") as wf:
            return float(wf.getnframes())/max(1,int(wf.getframerate()))
    ffmpeg=find_ffmpeg()
    ffprobe=None
    if ffmpeg:
        candidate=Path(ffmpeg).with_name("ffprobe")
        if candidate.exists():
            ffprobe=str(candidate)
    ffprobe=ffprobe or shutil.which("ffprobe")
    if not ffprobe:
        return 0.0
    try:
        out=subprocess.check_output(
            [ffprobe,"-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(path)],
            text=True,stderr=subprocess.DEVNULL,timeout=15
        ).strip()
        return float(out or 0.0)
    except Exception:
        return 0.0

def _encode_kids_m4a(src:Path,dst:Path):
    src=Path(src);dst=Path(dst)
    if not src.exists() or src.stat().st_size<=44:
        raise RuntimeError("Lokaler Serhat-Master fehlt: "+str(src))
    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("ffmpeg fehlt – Kids-App-M4A kann nicht erstellt werden.")
    dst.parent.mkdir(parents=True,exist_ok=True)
    tmp=dst.with_suffix(".tmp.m4a")
    cmd=[
        ffmpeg,"-y","-v","error","-i",str(src),
        "-vn","-ac","1","-ar","24000",
        "-c:a","aac","-b:a","72k",
        "-movflags","+faststart",
        str(tmp)
    ]
    p=subprocess.run(cmd,capture_output=True,text=True)
    if p.returncode!=0 or not tmp.exists() or tmp.stat().st_size<=1024:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass
        raise RuntimeError("Kids-App-Audio konnte nicht erstellt werden. "+(p.stderr or "")[-800:])
    os.replace(tmp,dst)
    return dst

def _install_story_audio_upload(data_url:str,original_name:str=""):
    """Nimmt eine vom Besitzer ausgewählte Story-Audiodatei sicher lokal entgegen.

    Die Quelldatei bleibt nur bis zur Veröffentlichung im temporären Output-Ordner.
    In die Kids-App gelangt ausschließlich die normalisierte AAC/M4A-Ausgabe.
    """
    value=str(data_url or "").strip()
    m=re.match(r"^data:(audio/[A-Za-z0-9.+-]+);base64,(.+)$",value,re.S)
    if not m:
        raise ValueError("Die gewählte Datei ist kein gültiges Audio.")
    mime=m.group(1).lower()
    allowed={
        "audio/wav":".wav","audio/x-wav":".wav","audio/wave":".wav","audio/vnd.wave":".wav",
        "audio/mp4":".m4a","audio/m4a":".m4a","audio/x-m4a":".m4a",
        "audio/aac":".aac","audio/x-aac":".aac",
        "audio/mpeg":".mp3","audio/mp3":".mp3"
    }
    if mime not in allowed:
        raise ValueError("Audioformat nicht erlaubt. Verwende WAV, M4A/AAC oder MP3.")
    try:
        payload=base64.b64decode(m.group(2),validate=True)
    except Exception as e:
        raise ValueError("Die Audiodatei ist beschädigt.") from e
    if len(payload)<1024:
        raise ValueError("Die Audiodatei ist leer oder zu klein.")
    if len(payload)>64*1024*1024:
        raise ValueError("Die Audiodatei ist größer als 64 MB.")
    upload=OUTPUT/f"story_audio_upload_{uuid.uuid4().hex[:12]}{allowed[mime]}"
    upload.write_bytes(payload)
    return upload,{
        "filename":str(original_name or upload.name),
        "mime":mime,
        "bytes":len(payload),
    }


def _sanitize_story_timings(text:str,raw,duration:float=0.0):
    paragraphs=[x.strip() for x in re.split(r"\n\s*\n",str(text or "").strip()) if x.strip()]
    if not paragraphs or not isinstance(raw,list):
        return []
    rows=[]
    for pos,item in enumerate(raw):
        if not isinstance(item,dict):
            continue
        try:
            idx=int(item.get("paragraphIndex",item.get("paragraph",item.get("index",pos))))
            start=float(item.get("start",item.get("startSec",item.get("time",0))))
            end=float(item.get("end",item.get("endSec",start)))
        except Exception:
            continue
        if idx<0 or idx>=len(paragraphs) or start<0:
            continue
        if duration>0:
            start=min(start,float(duration))
            end=min(max(start,end),float(duration))
        else:
            end=max(start,end)
        rows.append({
            "paragraphIndex":idx,
            "start":round(start,3),
            "end":round(end,3),
        })
    rows.sort(key=lambda x:(x["paragraphIndex"],x["start"]))
    by_index={}
    for row in rows:
        by_index[row["paragraphIndex"]]=row
    if len(by_index)!=len(paragraphs):
        return []
    out=[by_index[i] for i in range(len(paragraphs))]
    last=-1.0
    for i,row in enumerate(out):
        if row["start"]<last:
            return []
        if i+1<len(out):
            row["end"]=max(row["start"],out[i+1]["start"])
        elif duration>0:
            row["end"]=max(row["start"],round(float(duration),3))
        last=row["start"]
    if out:
        out[0]["start"]=0.0 if out[0]["start"]<0.75 else out[0]["start"]
    return out


def normalize_story_reference_text(text:str):
    """Stable text identity for a confirmed long-form audio/text pair.

    Formatting-only whitespace changes do not invalidate the pair, while every
    actual word/punctuation change creates a new hash and falls back to the
    normal incremental segment renderer.
    """
    value=unicodedata.normalize("NFC",str(text or ""))
    value=value.replace("\r\n","\n").replace("\r","\n")
    return re.sub(r"\s+"," ",value).strip()

def story_reference_text_sha256(text:str):
    return hashlib.sha256(
        normalize_story_reference_text(text).encode("utf-8")
    ).hexdigest()

def _story_reference_file_sha256(path:Path):
    h=hashlib.sha256()
    with Path(path).open("rb") as fh:
        while True:
            block=fh.read(1024*1024)
            if not block:
                break
            h.update(block)
    return h.hexdigest()

def _story_reference_load():
    data=load_json_file(STORY_REFERENCE_STATE,{"schemaVersion":1,"references":[]})
    if not isinstance(data,dict):
        data={"schemaVersion":1,"references":[]}
    refs=data.get("references")
    if not isinstance(refs,list):
        refs=[]
    data["schemaVersion"]=1
    data["references"]=refs
    return data

def _story_reference_save(data):
    payload=dict(data or {})
    payload["schemaVersion"]=1
    payload["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    atomic_write_json(STORY_REFERENCE_STATE,payload)
    return payload

def _story_reference_seeds():
    seeds=[]
    for seed_path in STORY_REFERENCE_SEEDS:
        seed=load_json_file(seed_path,{})
        if isinstance(seed,dict) and seed.get("id") and seed.get("itemId"):
            seeds.append(seed)
    return seeds

def _story_reference_seed(item_id:str=""):
    for seed in _story_reference_seeds():
        if item_id and str(seed.get("itemId") or "")!=str(item_id):
            continue
        return seed
    return {}

def _story_reference_to_wav(src:Path,dst:Path):
    src=Path(src)
    dst=Path(dst)
    if not src.exists() or src.stat().st_size<=1024:
        raise ValueError("Referenz-Audio fehlt oder ist leer.")
    dst.parent.mkdir(parents=True,exist_ok=True)
    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        if src.suffix.lower()==".wav":
            shutil.copy2(src,dst)
            return dst
        raise RuntimeError("ffmpeg fehlt – Referenz-Audio kann nicht normalisiert werden.")
    tmp=dst.with_name(dst.stem+f".tmp.{os.getpid()}.{uuid.uuid4().hex[:8]}.wav")
    try:
        p=subprocess.run([
            ffmpeg,"-y","-v","error","-i",str(src),
            "-vn","-ac","1","-ar","24000","-c:a","pcm_s16le",str(tmp)
        ],capture_output=True,text=True,timeout=180)
        if p.returncode!=0 or not tmp.exists() or tmp.stat().st_size<=1024:
            raise RuntimeError(
                "Referenz-Audio konnte nicht in 24-kHz-WAV normalisiert werden. "
                +(p.stderr or "")[-600:]
            )
        os.replace(tmp,dst)
        return dst
    finally:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass

def register_story_reference_pair(
    kind:str,item_id:str,text:str,audio_path:Path,source_name:str="",
    age:str="all",source:str="manual-owner-upload",reference_id:str=""
):
    """Persist a human-approved story audio + exact source text locally.

    This is deliberately a reference/corpus memory, not model-weight fine-tuning.
    It survives app updates under ~/SerhatVoice/PronunciationLearning.
    """
    value=str(text or "").strip()
    if len(value)<40:
        raise ValueError("Referenztext ist zu kurz.")
    src=Path(audio_path)
    if not src.exists() or src.stat().st_size<=1024:
        raise ValueError("Referenz-Audio fehlt.")

    seed=_story_reference_seed(item_id)
    normalized_kind=str(kind or "story").strip().lower()
    default_mode={
        "dua":"dua",
        "duʿāʾ":"dua",
        "du'a":"dua",
        "narration":"narration",
        "erzählung":"narration",
        "erzaehlung":"narration",
        "content":"narration",
        "lesson":"teaching",
        "story":"kids_story",
        "prophet":"kids_story",
        "sahabi":"kids_story",
        "ṣaḥābī":"kids_story",
        "mubashshirun":"kids_story",
    }.get(normalized_kind,"kids_story")
    ref_id=str(reference_id or seed.get("id") or "").strip()
    if not ref_id:
        raw="|".join([str(kind or "story"),str(item_id or ""),story_reference_text_sha256(value)])
        ref_id="story-"+hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20]
    safe=re.sub(r"[^A-Za-z0-9._-]+","-",ref_id).strip("-") or "story-reference"
    wav_path=STORY_REFERENCE_HOME/(safe+".wav")
    transcript_path=STORY_REFERENCE_HOME/(safe+".txt")

    source_sha=_story_reference_file_sha256(src)
    expected_sha=str(((seed.get("sourceAudio") or {}).get("sha256") or "")).strip()
    source_match=(not expected_sha) or hmac.compare_digest(source_sha,expected_sha)
    _story_reference_to_wav(src,wav_path)
    transcript_path.write_text(value+"\n",encoding="utf-8")

    duration=round(_audio_duration_seconds(wav_path),3)
    now=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    trusted=list(((seed.get("pronunciationProfile") or {}).get("trustedTerms") or []))
    record={
        "id":ref_id,
        "kind":normalized_kind,
        "itemId":str(item_id or ""),
        "age":str(age or "all"),
        "prosodyMode":str(seed.get("prosodyMode") or default_mode),
        "language":str(seed.get("language") or "de-DE"),
        "voiceProfileId":str(seed.get("voiceProfileId") or "serhat-owner-voice-2026"),
        "textSha256":story_reference_text_sha256(value),
        "textChars":len(value),
        "transcriptPath":str(transcript_path),
        "audioPath":str(wav_path),
        "audioSha256":_story_reference_file_sha256(wav_path),
        "sourceAudioSha256":source_sha,
        "expectedSourceAudioSha256":expected_sha,
        "sourceAudioHashMatched":bool(source_match),
        "sourceFilename":str(source_name or src.name),
        "source":str(source or "manual-owner-upload"),
        "durationSec":duration,
        "trustedTerms":trusted,
        "exactTextAudioReuse":True,
        "incrementalRerenderForEditedText":True,
        "modelWeightFineTuning":False,
        "registeredAt":now,
    }

    with STORY_REFERENCE_LOCK:
        state=_story_reference_load()
        refs=[
            dict(x) for x in (state.get("references") or [])
            if isinstance(x,dict) and str(x.get("id") or "")!=ref_id
        ]
        refs.append(record)
        state["references"]=refs
        _story_reference_save(state)

    append_learning_log(
        "story_reference_registered",
        referenceId=ref_id,itemId=str(item_id or ""),
        textSha256=record["textSha256"],
        audioSha256=record["audioSha256"],
        sourceAudioHashMatched=bool(source_match),
        durationSec=duration,
    )
    return record

def _story_reference_record_ready(record):
    try:
        path=Path(str((record or {}).get("audioPath") or "")).expanduser()
        return path.exists() and path.stat().st_size>1024
    except Exception:
        return False

def story_reference_state():
    with STORY_REFERENCE_LOCK:
        state=_story_reference_load()
    ready=[x for x in (state.get("references") or []) if _story_reference_record_ready(x)]
    terms=[]
    for row in ready:
        for term in (row.get("trustedTerms") or []):
            value=str(term or "").strip()
            if value and value not in terms:
                terms.append(value)
    return {
        "count":len(ready),
        "ready":bool(ready),
        "referenceIds":[str(x.get("id") or "") for x in ready],
        "itemIds":[str(x.get("itemId") or "") for x in ready],
        "trustedTerms":terms[:200],
        "statePath":str(STORY_REFERENCE_STATE),
        "exactTextAudioReuse":True,
        "incrementalRerenderForEditedText":True,
        "modelWeightFineTuning":False,
    }

def story_reference_matches_text(text:str,mode:str=""):
    requested=str(mode or "").strip()
    if requested not in ("kids_story","dua","narration","teaching"):
        return None
    target=story_reference_text_sha256(text)
    with STORY_REFERENCE_LOCK:
        refs=list((_story_reference_load().get("references") or []))
    for row in reversed(refs):
        row_mode=str(row.get("prosodyMode") or "kids_story").strip()
        if row_mode!=requested:
            continue
        if str(row.get("textSha256") or "")!=target:
            continue
        if _story_reference_record_ready(row):
            return dict(row)
    return None

def _story_reference_bootstrap_download(url:str,seed:dict):
    parsed=urlparse(str(url or ""))
    allowed={str(x).lower() for x in ((seed.get("runtimePolicy") or {}).get("allowedRemoteHosts") or [])}
    if parsed.scheme!="https" or not parsed.hostname or parsed.hostname.lower() not in allowed:
        raise ValueError("Remote-Referenzhost ist nicht freigegeben.")
    suffix=Path(parsed.path).suffix.lower()
    if suffix not in (".mp3",".m4a",".aac",".wav"):
        suffix=".mp3"
    dst=STORY_REFERENCE_HOME/(f"bootstrap-{uuid.uuid4().hex[:10]}{suffix}")
    req=urllib.request.Request(
        url,
        headers={
            "User-Agent":"DAR-Voice-Studio-Story-Reference/1",
            "Accept":"audio/*",
            "Cache-Control":"no-cache",
        }
    )
    try:
        with urllib.request.urlopen(req,timeout=35) as response:
            total=0
            with dst.open("wb") as fh:
                while True:
                    block=response.read(1024*1024)
                    if not block:
                        break
                    total+=len(block)
                    if total>70*1024*1024:
                        raise ValueError("Remote-Referenz ist größer als 70 MB.")
                    fh.write(block)
        if not dst.exists() or dst.stat().st_size<=1024:
            raise ValueError("Remote-Referenz ist leer.")
        expected=str(((seed.get("sourceAudio") or {}).get("sha256") or "")).strip()
        if expected and not hmac.compare_digest(_story_reference_file_sha256(dst),expected):
            raise ValueError("Remote-Audio stimmt nicht mit dem bestätigten Audio-Hash überein.")
        return dst
    except Exception:
        try: dst.unlink(missing_ok=True)
        except Exception: pass
        raise

def bootstrap_story_reference_seed(seed=None):
    """Best-effort bootstrap of one approved owner story recording.

    Runs in a background thread and never blocks app launch or model startup.
    """
    seed=dict(seed or _story_reference_seed())
    if not seed:
        return {"ok":False,"reason":"seed-missing"}
    ref_id=str(seed.get("id") or "").strip()
    existing=story_reference_state()
    if ref_id and ref_id in (existing.get("referenceIds") or []):
        return {"ok":True,"reused":True,"id":ref_id}

    text=str(seed.get("sourceText") or "").strip()
    if len(text)<40:
        return {"ok":False,"reason":"seed-text-missing"}

    for raw in (seed.get("localCandidates") or []):
        candidate=Path(os.path.expanduser(str(raw or "")))
        if candidate.exists() and candidate.stat().st_size>1024:
            try:
                record=register_story_reference_pair(
                    str(seed.get("kind") or "prophet"),
                    str(seed.get("itemId") or "muhammad"),
                    text,candidate,
                    source_name=str(((seed.get("sourceAudio") or {}).get("filename") or candidate.name)),
                    age="all",source="bootstrap-local-owner-audio",
                    reference_id=ref_id,
                )
                return {"ok":True,"source":"local","id":record["id"]}
            except Exception as e:
                print("[DĀR Voice] story reference local bootstrap warning",e,flush=True)

    if not bool((seed.get("runtimePolicy") or {}).get("bootstrapFromProphetManifestAudio")):
        return {"ok":False,"reason":"no-local-reference"}

    manifest=load_json_file(APP_HOME/"prophet-stories.json",{})
    item=next((
        x for x in (manifest.get("items") or [])
        if str((x or {}).get("id") or "")==str(seed.get("itemId") or "")
    ),None)
    if not isinstance(item,dict):
        return {"ok":False,"reason":"story-item-missing"}

    urls=[]
    for age,row in ((item.get("audio") or {}).items()):
        if not isinstance(row,dict):
            continue
        url=str(row.get("url") or "").strip()
        if url.startswith("https://") and url not in urls:
            urls.append(url)

    for url in urls:
        tmp=None
        try:
            tmp=_story_reference_bootstrap_download(url,seed)
            record=register_story_reference_pair(
                str(seed.get("kind") or "prophet"),
                str(seed.get("itemId") or "muhammad"),
                text,tmp,
                source_name=str(((seed.get("sourceAudio") or {}).get("filename") or tmp.name)),
                age="all",source="bootstrap-story-manifest-owner-audio",
                reference_id=ref_id,
            )
            return {"ok":True,"source":"story-manifest","id":record["id"]}
        except Exception as e:
            print("[DĀR Voice] story reference remote bootstrap skipped:",e,flush=True)
        finally:
            try:
                if tmp is not None: Path(tmp).unlink(missing_ok=True)
            except Exception:
                pass

    append_learning_log(
        "story_reference_bootstrap_pending",
        referenceId=ref_id,itemId=str(seed.get("itemId") or "")
    )
    return {"ok":False,"reason":"audio-not-yet-local"}

def bootstrap_story_reference_seeds():
    """Register every installed owner-approved long-form story reference."""
    results=[]
    for seed in _story_reference_seeds():
        try:
            results.append(bootstrap_story_reference_seed(seed))
        except Exception as e:
            print("[DĀR Voice] story reference bootstrap warning",seed.get("itemId"),e,flush=True)
            results.append({"ok":False,"itemId":str(seed.get("itemId") or ""),"reason":str(e)})
    return results


def _slot_asset_name(kind:str,key:str):
    return (key if kind=="harakat" else kind)+".m4a"

def _promote_slot_to_owner_voice(slot:dict,letter_id:str,kind:str,key:str,asset:Path,metrics:dict,build_id:str):
    now=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    old_external=None
    old_url=str(slot.get("url") or "").strip()
    old_type=str(slot.get("sourceType") or "").strip()
    if old_url and old_type.startswith("external-"):
        old_external={
            "url":old_url,
            "sourceType":old_type,
            "sourceProvider":slot.get("sourceProvider"),
            "sourceSpeaker":slot.get("sourceSpeaker"),
            "sourceLanguage":slot.get("sourceLanguage"),
            "sourceTranscription":slot.get("sourceTranscription"),
            "sourcePage":slot.get("sourcePage"),
            "sourceFile":slot.get("sourceFile"),
            "license":slot.get("license"),
            "licenseUrl":slot.get("licenseUrl"),
            "attribution":slot.get("attribution"),
            "archivedAt":now,
            "archiveReason":"Live-Lernclip durch autorisierte Serhat-Eigentümerstimme ersetzt."
        }
    alternates=[dict(x) for x in (slot.get("alternateSources") or []) if isinstance(x,dict)]
    if old_external and not any(str(x.get("url") or "")==old_url for x in alternates):
        alternates.append(old_external)

    rel="/kids/assets/kids-alphabet-audio/"+letter_id+"/"+_slot_asset_name(kind,key)
    sha=hashlib.sha256(asset.read_bytes()).hexdigest()
    slot.update({
        "verified":False,
        "linguisticVerified":False,
        "technicalQaPassed":True,
        "reviewStatus":"needs-human-review",
        "url":rel+"?v="+build_id,
        "expectedPath":rel,
        "sha256":sha,
        "qaBy":"local-serhat-engine-auto-qa",
        "qaAt":now,
        "qaDurationSeconds":round(_audio_duration_seconds(asset),3),
        "qaMetrics":metrics or {},
        "sourceType":"owner-voice-generated",
        "generationProfile":ALPHABET_GENERATION_PROFILE,
        "sourceProvider":"DĀR Voice Studio · lokale Serhat Engine",
        "sourceSpeaker":"Serhat Abu Malik",
        "sourceLanguage":"Arabic / Fuṣḥā learning",
        "sourceTranscription":str(slot.get("text") or ""),
        "sourcePage":"",
        "sourceFile":asset.name,
        "license":"Owner-authorized",
        "licenseUrl":"",
        "attribution":"Serhat Abu Malik · DĀR AL TAWḤĪD",
        "verificationBasis":"Technische QA bestanden; sprachliche Aussprache muss separat menschlich bestätigt werden.",
        "voiceProfileId":"serhat-owner-voice-2026",
        "sourceVoice":"authorized-owner-voice",
        "canonicalVoice":True,
        "sameVoiceConfirmed":True,
        "autoApproved":False,
        "requiresManualReview":True,
    })
    if alternates:
        slot["alternateSources"]=alternates


def _quiz_voice_texts(quiz_data):
    texts=[]
    seen=set()
    def add(value):
        text=re.sub(r"\s+"," ",str(value or "")).strip()
        if text and text not in seen:
            seen.add(text);texts.append(text)
    for item in (quiz_data.get("items") or []):
        question=str(item.get("question") or "").strip()
        answers=list(item.get("answers") or [])
        labels=[str((a or {}).get("label") or "").strip() for a in answers]
        spoken=" ".join(
            f"Antwort {i+1}: {label}."
            for i,label in enumerate(labels) if label
        ).strip()
        lower=[x.casefold() for x in labels]
        age_band=str(item.get("ageBand") or "").strip()
        # Das jüngste Kids-Band hört kurze Ja/Nein-Fragen ohne doppelte
        # Antwort-Aufzählung. Ältere Bänder hören alle Optionen.
        if age_band=="4-6" and len(lower)==2 and "ja" in lower and "nein" in lower:
            add((question+" Ja oder Nein?").strip())
        else:
            add((question+" "+spoken).strip())
        add(item.get("success"))
        add(item.get("retry"))
    add("Sehr gut. Du hast das Quiz geschafft.")
    return texts

def _quiz_bounded_parts(text:str,max_chars:int=48):
    value=re.sub(r"\s+"," ",str(text or "")).strip()
    if not value:
        return []
    max_chars=max(24,int(max_chars))

    # Fragen mit vorgelesenen Optionen zuerst semantisch trennen. So bleibt
    # "Antwort 1:" bei seiner Antwort und landet nie in einem riesigen TTS-Block.
    semantic=[
        x.strip()
        for x in re.split(r"\s+(?=Antwort\s+\d+\s*:)",value,flags=re.I)
        if x.strip()
    ]
    parts=[]
    for segment in semantic:
        sentence_bits=[
            x.strip() for x in re.split(r"(?<=[.!?؟])\s+",segment) if x.strip()
        ] or [segment]
        for bit in sentence_bits:
            current=bit
            while len(current)>max_chars:
                window=current[:max_chars+1]
                cuts=[
                    window.rfind(", "),
                    window.rfind("; "),
                    window.rfind(": "),
                    window.rfind(" und "),
                    window.rfind(" "),
                ]
                cut=max(cuts)
                if cut<max(12,int(max_chars*0.45)):
                    cut=max_chars
                else:
                    # Trennzeichen/Wort nicht verlieren.
                    if current[cut:cut+2] in (", ","; ",": "):
                        cut+=1
                left=current[:cut].strip()
                right=current[cut:].strip()

                # Die strenge Satzfluss-QA verbietet Grenzen direkt nach
                # grammatisch abhängigen Funktionswörtern wie "als", "zu",
                # "mit", "für", "dass" usw. Der Quiz-Splitter darf solche
                # Grenzen daher gar nicht erst erzeugen. Verschiebe den Cut
                # deterministisch vor das abhängige Wort, sodass es zusammen
                # mit seinem Folgeteil gesprochen wird.
                if left and right and not re.search(r"[,،;؛:.!?؟…]$",left):
                    last_word=re.sub(
                        r"[^A-Za-zÄÖÜäöüß]+$","",
                        left.split()[-1]
                    ).casefold()
                    if last_word in FLOW_WEAK_ENDINGS:
                        prev_space=left.rfind(" ")
                        if prev_space>=max(8,int(max_chars*0.30)):
                            cut=prev_space
                            left=current[:cut].strip()
                            right=current[cut:].strip()

                if not left or not right:
                    break
                parts.append(left)
                current=right
            if current:
                parts.append(current)

    # Zweite Schutzschicht für Sonderfälle aus vorherigen semantischen Splits:
    # Ein schwaches Endwort wird zum nächsten Teil verschoben. So kann auch ein
    # zukünftiger Quiztext keine künstliche Pause nach "als"/"zu"/"mit" erzeugen.
    balanced=[]
    i=0
    while i<len(parts):
        part=str(parts[i] or "").strip()
        if not part:
            i+=1
            continue
        if i+1<len(parts) and not re.search(r"[,،;؛:.!?؟…]$",part):
            words=part.split()
            end_word=re.sub(
                r"[^A-Za-zÄÖÜäöüß]+$","",
                words[-1] if words else ""
            ).casefold()
            if end_word in FLOW_WEAK_ENDINGS:
                next_part=str(parts[i+1] or "").strip()
                if len(words)>1:
                    moved=words[-1]
                    part=" ".join(words[:-1]).strip()
                    parts[i+1]=(moved+" "+next_part).strip()
                else:
                    parts[i+1]=(part+" "+next_part).strip()
                    i+=1
                    continue
        balanced.append(part)
        i+=1
    return [x for x in balanced if x]

def _quiz_join_paths(paths,text_value:str,mode:str="kids_lesson"):
    items=[]
    sr=24000
    voice_mode=str(mode or "kids_lesson")
    for path,spoken in paths:
        wav=load_locked_wav(Path(path),sr)
        items.append((wav,"de",spoken,voice_mode,{}))
    if not items:
        raise RuntimeError("Kids-Owner-Audio enthält keine erzeugten Teilstücke.")
    joined=join_rendered_segments(items,sr)
    joined=trim_segment_edges(joined,sr,aggressive=False)

    metrics=audio_quality_metrics(joined,sr,text_value,"de",voice_mode)
    pause_issues={
        "unexpected_internal_hold","excessive_internal_pause","suspicious_sustained_hold"
    }
    current=set(metrics.get("issues") or [])
    if current and current.issubset(pause_issues|{"segment_too_long","speech_rate_too_slow"}):
        repaired,meta=repair_internal_pause(joined,sr,text_value,"de",voice_mode)
        if meta.get("repaired"):
            joined=repaired
            metrics=audio_quality_metrics(joined,sr,text_value,"de",voice_mode)
            metrics.update(meta)

    hard={
        "empty_audio","non_finite","near_silence","low_peak","clipping",
        "unexpected_internal_hold","excessive_internal_pause",
        "suspicious_sustained_hold","generation_token_limit","generation_timeout"
    }
    hard_found=[x for x in (metrics.get("issues") or []) if x in hard]
    if hard_found:
        raise RuntimeError(
            "Kids-Owner-Gesamt-Audio-QA fehlgeschlagen: "+", ".join(hard_found)+
            " · Text: "+str(text_value)[:72]
        )
    metrics["issues"]=[x for x in (metrics.get("issues") or []) if x in hard]
    metrics["owner_voice_composite"]=True
    metrics["owner_voice_parts"]=len(items)
    metrics["owner_voice_mode"]=voice_mode
    return joined,sr,metrics

def _generate_quiz_voice_master(text_value:str):
    value=re.sub(r"\s+"," ",str(text_value or "")).strip()
    if not value:
        raise ValueError("Quiz-Sprachtext fehlt.")
    digest=hashlib.sha1(value.encode("utf-8")).hexdigest()[:20]
    master=QUIZ_MASTER_HOME/(digest+".wav")

    # Bereits bestandene Quiz-Master werden bei einem späteren Batch direkt
    # wiederverwendet. Dadurch setzt ein Lauf nach einem einzelnen Fehler fort,
    # statt alle vorherigen Quiztexte erneut zu synthetisieren.
    if master.exists() and master.stat().st_size>1024:
        try:
            wav=load_locked_wav(master,24000)
            metrics=audio_quality_metrics(wav,24000,value,"de","kids_lesson")
            hard={"empty_audio","non_finite","near_silence","low_peak","clipping"}
            if not any(x in hard for x in (metrics.get("issues") or [])):
                metrics["quiz_master_cache"]="hit"
                return master,metrics
        except Exception:
            pass

    base_parts=_quiz_bounded_parts(value,48)
    if not base_parts:
        raise RuntimeError("Quiztext konnte nicht in sichere Sprachblöcke zerlegt werden.")

    rendered=[]
    for part in base_parts:
        queue=[part]
        while queue:
            piece=queue.pop(0)
            try:
                path=generate(
                    piece,"","kids_lesson",
                    free_mode=True,free_pronunciation=True
                )
                rendered.append((Path(path),piece))
            except RuntimeError as e:
                message=str(e)
                if (
                    ("generation_token_limit" in message or "generation_timeout" in message)
                    and len(piece)>24
                ):
                    rescue=_quiz_bounded_parts(piece,max(24,min(34,len(piece)//2+4)))
                    if len(rescue)>1:
                        queue=rescue+queue
                        continue
                raise

    joined,sr,metrics=_quiz_join_paths(rendered,value)
    tmp=master.with_suffix(".tmp.wav")
    save_wav(tmp,joined,sr)
    os.replace(tmp,master)
    metrics["quiz_master_cache"]="write"
    return master,metrics

def _build_quiz_owner_voice_pack(quiz_data,build_root:Path,build_id:str,start_index:int,total:int):
    texts=_quiz_voice_texts(quiz_data)
    entries={}
    out_dir=build_root/"kids/assets/kids-quiz-audio"
    out_dir.mkdir(parents=True,exist_ok=True)
    generated_cache={}

    for offset,text_value in enumerate(texts,1):
        current_index=start_index+offset
        pct=2+int((current_index-1)/max(1,total)*88)
        _set_alphabet_batch_state(
            phase="quiz",
            progress=min(94,pct),
            completed=current_index-1,
            total=total,
            current=f"Quiz-Stimme {offset}/{len(texts)} · {text_value[:72]}"
        )
        digest=hashlib.sha1(text_value.encode("utf-8")).hexdigest()[:16]
        asset=out_dir/(digest+".m4a")
        source=generated_cache.get(text_value)
        source_metrics={}
        if source is None:
            source,source_metrics=_generate_quiz_voice_master(text_value)
            generated_cache[text_value]=source
        _encode_kids_m4a(source,asset)
        entries[text_value]={
            "url":f"/kids/assets/kids-quiz-audio/{asset.name}?v={build_id}",
            "sha256":hashlib.sha256(asset.read_bytes()).hexdigest(),
            "durationSeconds":round(_audio_duration_seconds(asset),3),
            "voiceProfileId":"serhat-owner-voice-2026",
            "sourceVoice":"authorized-owner-voice",
            "sourceType":"local-owner-generated",
            "qaBy":"local-serhat-engine-auto-qa",
            "qaMetrics":source_metrics,
        }

    manifest={
        "schemaVersion":1,
        "id":"KIDS_QUIZ_OWNER_VOICE_V1",
        "buildId":build_id,
        "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "voiceProfileId":"serhat-owner-voice-2026",
        "speaker":"Serhat Abu Malik",
        "manualPerClipApprovalRequired":False,
        "technicalQaRequired":True,
        "systemTtsFallbackAllowed":False,
        "entries":entries,
        "counts":{
            "quizQuestions":len(quiz_data.get("items") or []),
            "uniqueSpokenTexts":len(entries)
        }
    }
    atomic_write_json(build_root/"kids/data/quiz-audio.json",manifest)
    return manifest


def _kids_owner_voice_snapshot():
    with KIDS_OWNER_VOICE_STATE_LOCK:
        return dict(KIDS_OWNER_VOICE_STATE)

def _set_kids_owner_voice_state(**updates):
    with KIDS_OWNER_VOICE_STATE_LOCK:
        KIDS_OWNER_VOICE_STATE.update(updates)
        return dict(KIDS_OWNER_VOICE_STATE)

def _kids_owner_voice_key(value):
    return re.sub(r"\s+"," ",str(value or "")).strip()

def _kids_owner_voice_add(rows,value,mode,scope,source_id=""):
    original=str(value or "").strip()
    key=_kids_owner_voice_key(original)
    if not key:
        return
    row=rows.get(key)
    if row is None:
        rows[key]={
            "text":original,
            "key":key,
            "mode":str(mode or "kids_lesson"),
            "scopes":[str(scope or "kids")],
            "sourceIds":[str(source_id)] if source_id else [],
        }
        return
    if scope and str(scope) not in row["scopes"]:
        row["scopes"].append(str(scope))
    if source_id and str(source_id) not in row["sourceIds"]:
        row["sourceIds"].append(str(source_id))
    if row.get("mode")!="kids_story" and str(mode)=="kids_story":
        row["mode"]="kids_story"
        row["text"]=original

def _kids_quiz_prompt(q,age_key=""):
    if not isinstance(q,dict):
        return ""
    question=str(q.get("question") or "").strip()
    if not question:
        return ""
    answers=list(q.get("answers") or [])
    labels=[str((a or {}).get("label") or "").strip() for a in answers]
    labels=[x for x in labels if x]
    lower=[x.casefold() for x in labels]
    age_value=str(age_key or q.get("ageBand") or "").strip()
    if age_value in {"4–5","4-5","4–6","4-6"} and len(lower)==2 and "ja" in lower and "nein" in lower:
        return (question+" Ja oder Nein?").strip()
    choices=" ".join(f"Antwort {i+1}: {label}." for i,label in enumerate(labels))
    return (question+" "+choices).strip()

def _kids_quiz_master_for_prompt(prompt):
    key=_kids_owner_voice_key(prompt)
    digest=hashlib.sha1(("question"+"\0"+key).encode("utf-8")).hexdigest()[:24]
    return KIDS_OWNER_VOICE_MASTER_HOME/(digest+".wav")

def load_quiz_audio_manifest_fresh():
    return load_fresh_kids_repo_json(
        "quiz-audio.json","kids/data/quiz-audio.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("entries"),dict),
    )

def _kids_quiz_catalog():
    quiz=load_fresh_kids_repo_json(
        "quiz-kids.json","kids/data/quiz-kids.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list) and len(d.get("items") or [])>0,
    )
    owner=load_owner_voice_manifest_fresh()
    legacy=load_quiz_audio_manifest_fresh()
    owner_entries=dict(owner.get("entries") or {})
    legacy_entries=dict(legacy.get("entries") or {})
    items=[]
    voice_counts={"published":0,"local":0,"missing":0}
    age_counts={}
    for row in (quiz.get("items") or []):
        if not isinstance(row,dict):
            continue
        item_id=str(row.get("id") or "").strip()
        age_band=str(row.get("ageBand") or "").strip()
        prompt=_kids_quiz_prompt(row,age_band)
        key=_kids_owner_voice_key(prompt)
        entry=owner_entries.get(key) or legacy_entries.get(key) or {}
        master=_kids_quiz_master_for_prompt(prompt) if prompt else None
        published=bool((entry or {}).get("url"))
        local=bool(master and master.exists() and master.stat().st_size>1024)
        state="published" if published else ("local" if local else "missing")
        voice_counts[state]=voice_counts.get(state,0)+1
        age_counts[age_band]=age_counts.get(age_band,0)+1
        items.append({
            "id":item_id,
            "number":int(row.get("number") or 0),
            "ageBand":age_band,
            "category":str(row.get("category") or ""),
            "topic":str(row.get("topic") or ""),
            "question":str(row.get("question") or ""),
            "answers":list(row.get("answers") or []),
            "success":str(row.get("success") or ""),
            "retry":str(row.get("retry") or ""),
            "explanation":str(row.get("explanation") or ""),
            "sourceType":str(row.get("sourceType") or ""),
            "source":str(row.get("source") or ""),
            "voicePrompt":prompt,
            "voiceState":state,
            "voiceDurationSeconds":float((entry or {}).get("durationSeconds") or 0),
            "audioUrl":("/kids-quiz/audio?id="+item_id) if (published or local) else "",
        })
    items.sort(key=lambda x:(int(x.get("number") or 0),str(x.get("id") or "")))
    return {
        "ok":True,
        "version":quiz.get("version"),
        "total":len(items),
        "counts":age_counts,
        "voice":voice_counts,
        "items":items,
    }

def _kids_quiz_item_by_id(item_id):
    wanted=str(item_id or "").strip()
    if not wanted:
        raise ValueError("Quiz-ID fehlt.")
    quiz=load_fresh_kids_repo_json(
        "quiz-kids.json","kids/data/quiz-kids.json",
        lambda d:isinstance(d,dict) and isinstance(d.get("items"),list) and len(d.get("items") or [])>0,
    )
    for row in (quiz.get("items") or []):
        if str((row or {}).get("id") or "").strip()==wanted:
            return row
    raise ValueError("Quizfrage nicht gefunden: "+wanted)

def _kids_quiz_render_one(item_id):
    row=_kids_quiz_item_by_id(item_id)
    prompt=_kids_quiz_prompt(row,row.get("ageBand"))
    if not prompt:
        raise ValueError("Quizfrage hat keinen Sprechtext.")
    master,metrics=_generate_kids_owner_voice_master(prompt,"question")
    return {
        "ok":True,
        "id":str(row.get("id") or ""),
        "number":int(row.get("number") or 0),
        "question":str(row.get("question") or ""),
        "voicePrompt":prompt,
        "voiceState":"local",
        "audioUrl":"/kids-quiz/audio?id="+str(row.get("id") or ""),
        "metrics":metrics,
        "cachedMaster":str(master),
        "publishHint":"Der nächste Kids-Voice-Sync übernimmt diesen lokalen Master ohne erneute Aussprache-Erzeugung.",
    }

def _kids_owner_voice_add_question(rows,q,age_key,scope,source_id):
    if not isinstance(q,dict):
        return
    prompt=_kids_quiz_prompt(q,age_key)
    if prompt:
        _kids_owner_voice_add(rows,prompt,"question",scope,source_id)
    _kids_owner_voice_add(rows,q.get("success"),"kids_lesson",scope,source_id)
    _kids_owner_voice_add(rows,q.get("retry"),"kids_lesson",scope,source_id)

def _studio_owner_reference_kind(item):
    tags={str(x or "").strip().lower() for x in ((item or {}).get("tags") or [])}
    if "studio:dua" in tags:
        return "dua"
    if "studio:narration" in tags:
        return "narration"
    kind=str((item or {}).get("kind") or "story").strip().lower()
    return "lesson" if kind=="lesson" else "story"

def _studio_has_owner_audio(item):
    audio=(item or {}).get("audio") or {}
    if not isinstance(audio,dict) or not str(audio.get("url") or "").strip():
        return False
    return bool(audio.get("ownerApproved")) or str(audio.get("codec") or "").strip().lower()=="owner-upload" or str(audio.get("source") or "").strip().lower()=="manual-owner-upload"

def _download_live_owner_audio_asset(asset):
    key=str((asset or {}).get("key") or "").strip().lstrip("/")
    if not key.startswith("assets/kids-content/"):
        raise ValueError("Owner-Audio liegt nicht im freigegebenen Kids-Livepfad.")
    suffix=Path(key).suffix.lower()
    if suffix not in (".mp3",".m4a",".aac",".wav"):
        raise ValueError("Owner-Audioformat ist nicht erlaubt.")
    url="https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/"+key
    tmp=STORY_REFERENCE_HOME/(f"live-owner-{uuid.uuid4().hex[:12]}{suffix}")
    req=urllib.request.Request(url,headers={
        "User-Agent":"DAR-Voice-Studio-Live-Owner-Learning/1",
        "Accept":"application/octet-stream",
        "Cache-Control":"no-cache",
    })
    total=0
    try:
        with urllib.request.urlopen(req,timeout=35) as response, tmp.open("wb") as fh:
            while True:
                block=response.read(1024*1024)
                if not block:
                    break
                total+=len(block)
                if total>70*1024*1024:
                    raise ValueError("Owner-Audio ist größer als 70 MB.")
                fh.write(block)
        if not tmp.exists() or tmp.stat().st_size<=1024:
            raise ValueError("Owner-Audio konnte nicht geladen werden.")
        expected=str((asset or {}).get("sha256") or "").strip().lower()
        if expected and not hmac.compare_digest(_story_reference_file_sha256(tmp).lower(),expected):
            raise ValueError("Owner-Audio-Prüfsumme stimmt nicht mit dem Live-Paket überein.")
        return tmp
    except Exception:
        try: tmp.unlink(missing_ok=True)
        except Exception: pass
        raise

def sync_live_owner_content_references(studio_data):
    """Übernimmt auf Smartphone/Web hochgeladene, explizit freigegebene Eigentümer-Audios.

    Dadurch muss die Mac-App dieselbe Geschichte/Duʿāʾ/Erzählung nicht neu erzeugen.
    Der Audio/Text-Paar-Speicher bleibt lokal; öffentlich bleibt nur die ohnehin
    freigegebene Kids-Audiodatei.
    """
    with STORY_REFERENCE_LOCK:
        current=list((_story_reference_load().get("references") or []))
    ready={
        (str(x.get("itemId") or ""),str(x.get("textSha256") or ""))
        for x in current if _story_reference_record_ready(x)
    }
    imported=0
    skipped=0
    failed=[]
    for item in ((studio_data or {}).get("items") or []):
        if not isinstance(item,dict) or str(item.get("status") or "")!="published":
            continue
        if str(item.get("appTarget") or "kids") not in ("","kids","both"):
            continue
        if not _studio_has_owner_audio(item):
            continue
        text=str(item.get("text") or "").strip()
        item_id=str(item.get("id") or "").strip()
        if len(text)<40 or not item_id:
            continue
        text_sha=story_reference_text_sha256(text)
        if (item_id,text_sha) in ready:
            skipped+=1
            continue
        tmp=None
        try:
            audio=item.get("audio") or {}
            tmp=_download_live_owner_audio_asset(audio)
            ref=register_story_reference_pair(
                _studio_owner_reference_kind(item),item_id,text,tmp,
                source_name=str(audio.get("originalName") or Path(str(audio.get("key") or "owner-audio")).name),
                age=f"{int(item.get('ageMin') or 4)}-{int(item.get('ageMax') or 10)}",
                source="auto-live-owner-content-sync",
            )
            ready.add((item_id,str(ref.get("textSha256") or text_sha)))
            imported+=1
        except Exception as e:
            failed.append({"id":item_id,"error":str(e)[:300]})
            print("[DĀR Voice] Live-Owner-Audio konnte nicht gelernt werden:",item_id,e,flush=True)
        finally:
            try:
                if tmp is not None: Path(tmp).unlink(missing_ok=True)
            except Exception:
                pass
    if imported:
        append_learning_log("live_owner_content_reference_sync",imported=imported,skipped=skipped,failed=len(failed))
    return {"imported":imported,"skipped":skipped,"failed":failed[-20:]}

def _kids_owner_voice_rows(quiz_data,dua_data,story_data,short_story_data,verified_data,studio_data=None):
    rows={}
    for value in _quiz_voice_texts(quiz_data):
        _kids_owner_voice_add(rows,value,"kids_lesson","quiz","quiz")
    _kids_owner_voice_add(rows,"Richtig. Sehr gut.","kids_lesson","feedback","shared")
    _kids_owner_voice_add(rows,"Noch nicht. Hör die Erklärung noch einmal.","kids_lesson","feedback","shared")

    for item in (dua_data.get("items") or []):
        if str(item.get("verification") or "")!="verified":
            continue
        item_id=str(item.get("id") or "")
        explanation=(str(item.get("childPrompt") or "").strip()+" "+str(item.get("meaning") or "").strip()).strip()
        _kids_owner_voice_add(rows,explanation,"dua","dua",item_id)
        q=item.get("quiz") or {}
        if isinstance(q,dict):
            # Heute wird die Erklärung automatisch vorgelesen; die Frage liegt
            # ebenfalls im Pack, damit künftige UI-Schritte keine neue Pipeline brauchen.
            for age_key in ("4–5","6–8","9–10"):
                _kids_owner_voice_add_question(rows,q,age_key,"dua-quiz",item_id)

    for source,scope in ((short_story_data,"short-story"),(story_data,"authentic-story")):
        for item in (source.get("items") or []):
            if scope=="authentic-story" and str(item.get("verification") or "")!="approved":
                continue
            item_id=str(item.get("id") or "")
            _kids_owner_voice_add(rows,item.get("text"),"kids_story",scope,item_id)
            bank=item.get("question") or {}
            if isinstance(bank,dict):
                for age_key,q in bank.items():
                    _kids_owner_voice_add_question(rows,q,age_key,scope+"-quiz",item_id)

    for group in ("duas","hadithLessons","earlyLessons"):
        for item in (verified_data.get(group) or []):
            if str(item.get("verificationStatus") or "")!="verified":
                continue
            item_id=str(item.get("id") or item.get("canonicalId") or "")
            expl=str(item.get("childExplanation") or "").strip()
            if expl:
                _kids_owner_voice_add(rows,expl,"kids_lesson","knowledge",item_id)
                person=str(item.get("person") or "").strip()
                if person:
                    _kids_owner_voice_add(rows,expl+". "+person+".","kids_lesson","knowledge",item_id)

    # Zukünftige über das Kids-Content-Studio veröffentlichte Inhalte:
    # Geschichten/Lektionen, Quizfragen sowie Spiel-Anweisungen und voiceCues.
    for item in ((studio_data or {}).get("items") or []):
        if str((item or {}).get("status") or "")!="published":
            continue
        if str((item or {}).get("appTarget") or "kids") not in ("","kids","both"):
            continue
        item_id=str((item or {}).get("id") or "")
        kind=str((item or {}).get("kind") or "").strip()
        if kind in ("story","lesson") and not _studio_has_owner_audio(item):
            _kids_owner_voice_add(
                rows,(item or {}).get("text"),
                "kids_story" if kind=="story" else "kids_lesson",
                "studio-"+kind,item_id
            )

        bank=(item or {}).get("question") or {}
        if isinstance(bank,dict):
            for age_key,q in bank.items():
                _kids_owner_voice_add_question(rows,q,age_key,"studio-question",item_id)

        quiz=(item or {}).get("quiz") or {}
        questions=(quiz or {}).get("questions") or []
        if isinstance(questions,list):
            age_min=int((item or {}).get("ageMin") or 0)
            age_max=int((item or {}).get("ageMax") or 99)
            quiz_age_bands=[]
            if age_min<=4 and age_max>=6:
                quiz_age_bands.append("4-6")
            if age_min<=7 and age_max>=8:
                quiz_age_bands.append("7-8")
            if age_min<=9 and age_max>=10:
                quiz_age_bands.append("9-10")
            if not quiz_age_bands:
                quiz_age_bands=["studio"]
            for q in questions:
                for quiz_age_band in quiz_age_bands:
                    _kids_owner_voice_add_question(
                        rows,q,quiz_age_band,"studio-quiz",item_id
                    )

        game=(item or {}).get("game") or {}
        if isinstance(game,dict):
            _kids_owner_voice_add(rows,game.get("instructions"),"kids_lesson","studio-game-instructions",item_id)
            for cue in (game.get("voiceCues") or []):
                _kids_owner_voice_add(rows,cue,"kids_lesson","studio-game-cue",item_id)

    return list(rows.values())

def _generate_kids_owner_voice_master(text_value:str,mode:str):
    """Separater dynamischer Kids-Renderer; blockiert den manuellen Alphabet-/Quiz-Batch nicht."""
    value=_kids_owner_voice_key(text_value)
    voice_mode=str(mode or "kids_lesson")
    if not value:
        raise RuntimeError("Kids-Voice-Text ist leer.")
    digest=hashlib.sha1((voice_mode+"\0"+value).encode("utf-8")).hexdigest()[:24]
    master=KIDS_OWNER_VOICE_MASTER_HOME/(digest+".wav")

    if master.exists() and master.stat().st_size>1024:
        try:
            wav=load_locked_wav(master,24000)
            metrics=audio_quality_metrics(wav,24000,value,"de",voice_mode)
            hard={"empty_audio","non_finite","near_silence","low_peak","clipping"}
            if not any(x in hard for x in (metrics.get("issues") or [])):
                metrics["kids_owner_master_cache"]="hit"
                return master,metrics
        except Exception:
            pass

    parts=_quiz_bounded_parts(value,48)
    if not parts:
        raise RuntimeError("Kids-Voice-Text konnte nicht in sichere Sprachblöcke zerlegt werden.")
    rendered=[]
    for part in parts:
        queue=[part]
        while queue:
            piece=queue.pop(0)
            while LEARNING_PREVIEW_WAITING.is_set() or MANUAL_RENDER_WAITING.is_set() or RENDER_LOCK.locked():
                _set_kids_owner_voice_state(current="Interaktive Stimme hat Vorrang · Kids-Voice-Sync wartet …")
                time.sleep(0.08)
            try:
                path=generate(piece,"",voice_mode,free_mode=True,free_pronunciation=True)
                rendered.append((Path(path),piece))
            except RuntimeError as e:
                message=str(e)
                if "Hintergrund-Render pausiert für interaktive Audio-Erzeugung" in message:
                    _set_kids_owner_voice_state(current="Kids-Voice-Sync pausiert · Freistimme/Worttest hat Vorrang …")
                    while MANUAL_RENDER_WAITING.is_set() or LEARNING_PREVIEW_WAITING.is_set() or RENDER_LOCK.locked():
                        time.sleep(0.08)
                    queue.insert(0,piece)
                    time.sleep(0.12)
                    continue
                if (
                    ("generation_token_limit" in message or "generation_timeout" in message)
                    and len(piece)>24
                ):
                    rescue=_quiz_bounded_parts(piece,max(24,min(34,len(piece)//2+4)))
                    if len(rescue)>1:
                        queue=rescue+queue
                        continue
                raise

    joined,sr,metrics=_quiz_join_paths(rendered,value,voice_mode)
    tmp=master.with_suffix(".tmp.wav")
    save_wav(tmp,joined,sr)
    os.replace(tmp,master)
    metrics["kids_owner_master_cache"]="write"
    return master,metrics


def _prepare_kids_owner_voice_publish(export_ready:Path):
    git=shutil.which("git")
    if not git:
        return False,"git ist auf diesem Mac nicht verfügbar."
    repo=KIDS_OWNER_VOICE_PUBLISH_REPO
    env=dict(os.environ)
    env["GIT_TERMINAL_PROMPT"]="0"

    def run(args,timeout=180):
        return subprocess.run(args,capture_output=True,text=True,env=env,timeout=timeout)

    try:
        if not (repo/".git").exists():
            if repo.exists():
                shutil.rmtree(repo)
            p=run([git,"clone","--depth","1","https://github.com/Sero91ak/dar-al-tawhid-site.git",str(repo)],300)
            if p.returncode!=0:
                return False,"Repository konnte nicht vorbereitet werden: "+(p.stderr or p.stdout)[-600:]
        else:
            p=run([git,"-C",str(repo),"fetch","origin","main"],180)
            if p.returncode!=0:
                return False,"Repository-Update fehlgeschlagen: "+(p.stderr or p.stdout)[-600:]
            p=run([git,"-C",str(repo),"reset","--hard","origin/main"],60)
            if p.returncode!=0:
                return False,"Repository konnte nicht auf main gesetzt werden."

        src_manifest=export_ready/"kids/data/owner-voice-audio.json"
        dst_manifest=repo/"kids/data/owner-voice-audio.json"
        dst_manifest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src_manifest,dst_manifest)

        src_audio=export_ready/"kids/assets/kids-owner-voice"
        dst_audio=repo/"kids/assets/kids-owner-voice"
        dst_audio.mkdir(parents=True,exist_ok=True)
        if src_audio.exists():
            for src in src_audio.glob("*.m4a"):
                shutil.copy2(src,dst_audio/src.name)

        p=run([git,"-C",str(repo),"add","kids/data/owner-voice-audio.json","kids/assets/kids-owner-voice"],60)
        if p.returncode!=0:
            return False,"Git staging fehlgeschlagen: "+(p.stderr or p.stdout)[-500:]
        diff=run([git,"-C",str(repo),"diff","--cached","--quiet"],30)
        if diff.returncode==0:
            return True,"Kids-Owner-Voice ist bereits aktuell."

        run([git,"-C",str(repo),"config","user.name","Serhat Abu Malik"],20)
        run([git,"-C",str(repo),"config","user.email","73606501+Sero91ak@users.noreply.github.com"],20)
        p=run([git,"-C",str(repo),"commit","-m","Kids: sync local Serhat owner voice content"],120)
        if p.returncode!=0:
            return False,"Git commit fehlgeschlagen: "+(p.stderr or p.stdout)[-600:]

        gh=shutil.which("gh")
        if gh:
            auth=run([gh,"auth","status"],30)
            if auth.returncode==0:
                run([gh,"auth","setup-git"],30)

        last_push=""
        for attempt in range(1,4):
            fetch=run([git,"-C",str(repo),"fetch","origin","main"],180)
            if fetch.returncode!=0:
                last_push=(fetch.stderr or fetch.stdout)[-700:]
            else:
                rebase=run([git,"-C",str(repo),"rebase","origin/main"],180)
                if rebase.returncode!=0:
                    run([git,"-C",str(repo),"rebase","--abort"],30)
                    return False,"Kids-Voice-Paket konnte nicht konfliktfrei auf main gesetzt werden: "+(rebase.stderr or rebase.stdout)[-700:]
                push=run([git,"-C",str(repo),"push","origin","HEAD:main"],300)
                if push.returncode==0:
                    return True,"Kids-Owner-Voice wurde nach GitHub main übertragen."
                last_push=(push.stderr or push.stdout)[-700:]
                low=last_push.lower()
                if not any(code in low for code in ("500","502","503","504","internal server error")):
                    break
            if attempt<3:
                time.sleep(attempt*3)
        return False,"Kids-Voice-Paket ist lokal fertig; GitHub-Push fehlgeschlagen: "+last_push
    except Exception as e:
        return False,str(e)

def build_kids_owner_voice_sync():
    if not KIDS_OWNER_VOICE_SYNC_LOCK.acquire(blocking=False):
        return _kids_owner_voice_snapshot()
    try:
        started=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        _set_kids_owner_voice_state(
            running=True,phase="scan",progress=1,completed=0,total=0,current="Kids-Inhalte werden auf neue Voice-Texte geprüft …",
            error="",generated=0,missing=0,failed=0,failedItems=[],repoPublished=False,repoPublishError="",repoPublishMessage="",
            startedAt=started,finishedAt=""
        )

        quiz_data=load_fresh_kids_repo_json(
            "quiz-kids.json","kids/data/quiz-kids.json",
            lambda d:isinstance(d,dict) and isinstance(d.get("items"),list) and len(d.get("items") or [])>0,
        )
        dua_data=load_dua_manifest_fresh()
        story_data=load_authentic_stories_fresh()
        short_story_data=load_short_stories_voice_fresh()
        verified_data=load_verified_content_fresh()
        studio_data=load_live_kids_content_fresh()
        owner_reference_sync=sync_live_owner_content_references(studio_data)
        if int(owner_reference_sync.get("imported") or 0):
            _set_kids_owner_voice_state(
                current=f"{int(owner_reference_sync.get('imported') or 0)} neue Eigentümer-Audio/Text-Paare lokal gelernt …"
            )
        manifest=load_owner_voice_manifest_fresh()
        entries=dict(manifest.get("entries") or {})

        rows=_kids_owner_voice_rows(
            quiz_data,dua_data,story_data,short_story_data,verified_data,studio_data
        )
        missing=[row for row in rows if not (entries.get(row["key"]) or {}).get("url")]
        _set_kids_owner_voice_state(total=len(rows),missing=len(missing),current=f"{len(rows)} Sprechtexte geprüft · {len(missing)} neu")

        if not missing:
            finished=time.strftime("%Y-%m-%dT%H:%M:%S%z")
            return _set_kids_owner_voice_state(
                running=False,phase="complete",progress=100,completed=len(rows),total=len(rows),
                current="Kids-Owner-Voice ist vollständig aktuell.",error="",generated=0,missing=0,
                startedAt=started,finishedAt=finished
            )

        build_id="serhat-kids-"+time.strftime("%Y%m%d-%H%M%S")
        build_root=KIDS_OWNER_VOICE_EXPORT_HOME/(".build-"+uuid.uuid4().hex[:10])
        ready=KIDS_OWNER_VOICE_EXPORT_HOME/"ready"
        if build_root.exists():
            shutil.rmtree(build_root)
        (build_root/"kids/assets/kids-owner-voice").mkdir(parents=True,exist_ok=True)
        (build_root/"kids/data").mkdir(parents=True,exist_ok=True)

        generated_count=0
        failures=[]
        for index,row in enumerate(missing,1):
            pct=3+int((index-1)/max(1,len(missing))*90)
            _set_kids_owner_voice_state(
                phase="generate",progress=min(93,pct),completed=index-1,
                current=f"Kids-Stimme {index}/{len(missing)} · {row['key'][:74]}"
            )
            try:
                master,metrics=_generate_kids_owner_voice_master(row["text"],row["mode"])
                digest=hashlib.sha1(row["key"].encode("utf-8")).hexdigest()[:20]
                asset=build_root/"kids/assets/kids-owner-voice"/(digest+".m4a")
                _encode_kids_m4a(master,asset)
                entries[row["key"]]={
                    "url":f"/kids/assets/kids-owner-voice/{asset.name}?v={build_id}",
                    "sha256":hashlib.sha256(asset.read_bytes()).hexdigest(),
                    "durationSeconds":round(_audio_duration_seconds(asset),3),
                    "voiceProfileId":"serhat-owner-voice-2026",
                    "speaker":"Serhat Abu Malik",
                    "engine":"local-serhat-engine",
                    "sourceVoice":"authorized-owner-voice",
                    "sourceType":"local-owner-generated",
                    "mode":row["mode"],
                    "scopes":row["scopes"],
                    "sourceIds":row["sourceIds"],
                    "qaBy":"local-serhat-engine-auto-qa",
                    "qaMetrics":metrics,
                }
                generated_count+=1
            except Exception as item_error:
                failure={
                    "text":row["key"][:160],
                    "mode":row["mode"],
                    "scopes":row["scopes"],
                    "sourceIds":row["sourceIds"],
                    "error":str(item_error)[:500],
                }
                failures.append(failure)
                print(
                    "[DĀR Voice] Kids-Voice-Eintrag offen für nächsten Lauf:",
                    row["key"][:100],item_error,flush=True
                )
            _set_kids_owner_voice_state(
                generated=generated_count,failed=len(failures),
                failedItems=failures[-20:],completed=index,
                missing=max(0,len(missing)-generated_count)
            )

        output={
            "schemaVersion":2,
            "id":"KIDS_OWNER_VOICE_V2",
            "buildId":build_id,
            "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "voiceProfileId":"serhat-owner-voice-2026",
            "speaker":"Serhat Abu Malik",
            "engine":"local-serhat-engine",
            "provider":"self-produced",
            "manualPerClipApprovalRequired":False,
            "technicalQaRequired":True,
            "systemTtsFallbackAllowed":False,
            "syntheticQuranRecitationAllowed":False,
            "security":{
                "publicContainsRenderedAudioOnly":True,
                "voiceReferencePublished":False,
                "modelWeightsPublished":False,
                "pronunciationPrivateStatePublished":False,
            },
            "pronunciationLibrary":"local-master-plus-user-confirmed-overrides",
            "autoDiscovery":True,
            "autoDiscoverySources":[
                "kids/data/quiz-kids.json","kids/data/dua-kids.json",
                "kids/data/stories-authentic.json","kids/data/short-stories-voice.json",
                "kids/data/verified-content.json","content/kids/content-index.json"
            ],
            "entries":entries,
            "counts":{
                "requiredTexts":len(rows),
                "generatedThisRun":generated_count,
                "failedThisRun":len(failures),
                "remainingMissing":len(failures),
                "totalEntries":len(entries)
            },
            "pendingFailures":failures[-50:]
        }
        atomic_write_json(build_root/"kids/data/owner-voice-audio.json",output)

        if ready.exists():
            shutil.rmtree(ready)
        os.replace(build_root,ready)
        _set_kids_owner_voice_state(
            phase="publishing",progress=96,current="Fertige M4A-Dateien werden in die Kids-App übernommen …"
        )
        published,message=_prepare_kids_owner_voice_publish(ready)
        finished=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        remaining=len(failures)
        if not published:
            phase="publish-error"
            current="Audio fertig · Veröffentlichung prüfen"
        elif remaining:
            phase="partial"
            current=f"{generated_count} neue Audios veröffentlicht · {remaining} Einträge bleiben für den nächsten Lauf offen"
        else:
            phase="complete"
            current="Kids-Owner-Voice ist vollständig aktuell."
        return _set_kids_owner_voice_state(
            running=False,phase=phase,
            progress=100,completed=len(rows),total=len(rows),current=current,
            error="",generated=generated_count,missing=remaining,
            failed=remaining,failedItems=failures[-20:],
            repoPublished=bool(published),
            repoPublishError="" if published else message,repoPublishMessage=message,
            startedAt=started,finishedAt=finished
        )
    except Exception as e:
        finished=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return _set_kids_owner_voice_state(
            running=False,phase="error",error=str(e),current="Kids-Voice-Sync abgebrochen",
            finishedAt=finished
        )
    finally:
        KIDS_OWNER_VOICE_SYNC_LOCK.release()

def start_kids_owner_voice_sync():
    state=_kids_owner_voice_snapshot()
    if state.get("running"):
        return state
    thread=threading.Thread(
        target=build_kids_owner_voice_sync,daemon=True,name="dar-kids-owner-voice-sync"
    )
    thread.start()
    time.sleep(0.04)
    return _kids_owner_voice_snapshot()

def _kids_owner_voice_auto_loop():
    # Kein alter Vollbatch: nur fehlende Kids-Sprechtexte. Interaktive Erzeugung
    # bleibt durch die Wait-Guards vor jedem neuen Master vorrangig.
    time.sleep(12)
    while True:
        try:
            if not _kids_owner_voice_snapshot().get("running"):
                start_kids_owner_voice_sync()
        except Exception as e:
            print("[DĀR Voice] automatischer Kids-Voice-Sync:",e,flush=True)
        time.sleep(1800)


def _prepare_publish_repo(export_ready:Path):
    git=shutil.which("git")
    if not git:
        return False,"git ist auf diesem Mac nicht verfügbar."
    repo=ALPHABET_PUBLISH_REPO
    env=dict(os.environ)
    env["GIT_TERMINAL_PROMPT"]="0"

    def run(args,timeout=180):
        return subprocess.run(args,capture_output=True,text=True,env=env,timeout=timeout)

    try:
        if not (repo/".git").exists():
            if repo.exists():
                shutil.rmtree(repo)
            p=run([git,"clone","--depth","1","https://github.com/Sero91ak/dar-al-tawhid-site.git",str(repo)],300)
            if p.returncode!=0:
                return False,"Repository konnte nicht vorbereitet werden: "+(p.stderr or p.stdout)[-600:]
        else:
            p=run([git,"-C",str(repo),"fetch","origin","main"],180)
            if p.returncode!=0:
                return False,"Repository-Update fehlgeschlagen: "+(p.stderr or p.stdout)[-600:]
            p=run([git,"-C",str(repo),"reset","--hard","origin/main"],60)
            if p.returncode!=0:
                return False,"Repository konnte nicht auf main gesetzt werden."

        source_kids=export_ready/"kids"
        if not source_kids.exists():
            return False,"Export enthält keinen Kids-Ordner."

        for rel in [
            Path("data/alphabet-audio.json"),
            Path("data/quiz-audio.json"),
            Path("assets/kids-cinema/intro-voice-serhat.m4a"),
        ]:
            src=source_kids/rel
            dst=repo/"kids"/rel
            dst.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(src,dst)

        src_audio=source_kids/"assets/kids-alphabet-audio"
        dst_audio=repo/"kids/assets/kids-alphabet-audio"
        if dst_audio.exists():
            shutil.rmtree(dst_audio)
        shutil.copytree(src_audio,dst_audio)

        src_quiz=source_kids/"assets/kids-quiz-audio"
        dst_quiz=repo/"kids/assets/kids-quiz-audio"
        if dst_quiz.exists():
            shutil.rmtree(dst_quiz)
        shutil.copytree(src_quiz,dst_quiz)

        p=run([git,"-C",str(repo),"add",
            "kids/data/alphabet-audio.json","kids/assets/kids-alphabet-audio",
            "kids/data/quiz-audio.json","kids/assets/kids-quiz-audio",
            "kids/assets/kids-cinema/intro-voice-serhat.m4a"
        ],60)
        if p.returncode!=0:
            return False,"Git staging fehlgeschlagen: "+(p.stderr or p.stdout)[-500:]

        diff=run([git,"-C",str(repo),"diff","--cached","--quiet"],30)
        if diff.returncode==0:
            return True,"Kids-App enthält bereits genau dieses Serhat-Stimmenpaket."

        run([git,"-C",str(repo),"config","user.name","Serhat Abu Malik"],20)
        run([git,"-C",str(repo),"config","user.email","73606501+Sero91ak@users.noreply.github.com"],20)
        p=run([git,"-C",str(repo),"commit","-m","Kids: install complete local Serhat owner-voice pack"],120)
        if p.returncode!=0:
            return False,"Git commit fehlgeschlagen: "+(p.stderr or p.stdout)[-600:]

        # Wenn gh bereits angemeldet ist, nutzt git dessen Credential Helper.
        gh=shutil.which("gh")
        if gh:
            auth=run([gh,"auth","status"],30)
            if auth.returncode==0:
                run([gh,"auth","setup-git"],30)

        last_push=""
        for attempt in range(1,4):
            # Der Audio-Build kann lange laufen; main darf inzwischen weitergezogen
            # sein. Vor jedem Push den einen lokalen Pack-Commit auf den aktuellen
            # origin/main rebasen. Bei transientem GitHub-5xx erneut versuchen.
            fetch=run([git,"-C",str(repo),"fetch","origin","main"],180)
            if fetch.returncode!=0:
                last_push=(fetch.stderr or fetch.stdout)[-700:]
            else:
                rebase=run([git,"-C",str(repo),"rebase","origin/main"],180)
                if rebase.returncode!=0:
                    run([git,"-C",str(repo),"rebase","--abort"],30)
                    return False,"Paket ist lokal fertig, konnte aber nicht konfliktfrei auf den aktuellen main-Stand gesetzt werden: "+(rebase.stderr or rebase.stdout)[-700:]
                p=run([git,"-C",str(repo),"push","origin","HEAD:main"],300)
                if p.returncode==0:
                    return True,"Serhat-Stimmenpaket wurde nach GitHub main übertragen; der normale Kids-Deploy startet automatisch."
                last_push=(p.stderr or p.stdout)[-700:]
                low=last_push.lower()
                transient=("500" in low or "502" in low or "503" in low or "504" in low or "internal server error" in low)
                if not transient:
                    break
            if attempt<3:
                time.sleep(attempt*3)

        return False,"Paket ist lokal fertig; GitHub-Push nach 3 Versuchen fehlgeschlagen: "+last_push
    except Exception as e:
        return False,str(e)

def build_full_local_kids_voice_pack():
    if not ALPHABET_BATCH_LOCK.acquire(blocking=False):
        return _alphabet_batch_snapshot()
    try:
        started=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        _set_alphabet_batch_state(
            running=True,phase="preparing",progress=1,completed=0,total=226,current="Manifest und Quizdaten werden vorbereitet …",
            generationProfile=ALPHABET_GENERATION_PROFILE,
            error="",exportPath="",zipPath="",repoPublished=False,repoPublishError="",
            startedAt=started,finishedAt=""
        )

        manifest=load_alphabet_manifest()
        quiz_data=load_quiz_manifest()
        tasks=_alphabet_tasks(manifest)
        if len(tasks)!=140:
            raise RuntimeError(f"Alphabet-Pack unvollständig: erwartet 140 Clips, gefunden {len(tasks)}.")
        quiz_texts=_quiz_voice_texts(quiz_data)
        total_work=len(tasks)+len(quiz_texts)+1
        _set_alphabet_batch_state(total=total_work)

        build_id="serhat-local-"+time.strftime("%Y%m%d-%H%M%S")
        build_root=ALPHABET_EXPORT_HOME/(".build-"+uuid.uuid4().hex[:10])
        ready=ALPHABET_EXPORT_HOME/"ready"
        if build_root.exists():
            shutil.rmtree(build_root)
        (build_root/"kids/assets/kids-alphabet-audio").mkdir(parents=True,exist_ok=True)
        (build_root/"kids/assets/kids-cinema").mkdir(parents=True,exist_ok=True)
        (build_root/"kids/data").mkdir(parents=True,exist_ok=True)

        generated=[]
        existing_alphabet_masters={
            str((m or {}).get("slotId") or ""):dict(m or {})
            for m in (alphabet_master_state().get("masters") or [])
        }
        for index,(letter_id,kind,key,slot) in enumerate(tasks,1):
            text_value=str((slot or {}).get("text") or "").strip()
            if not text_value:
                raise RuntimeError(f"Text fehlt bei {letter_id}/{kind}/{key or 'main'}.")
            slot_id="-".join([letter_id,kind,key or "main"])
            pct=2+int((index-1)/max(1,total_work)*88)
            _set_alphabet_batch_state(
                phase="alphabet",progress=pct,completed=index-1,
                current=f"{index}/140 · {letter_id.upper()} · {kind}{(' · '+key) if key else ''} · {text_value}"
            )

            cached_master=existing_alphabet_masters.get(slot_id) or {}
            cached_file=ALPHABET_MASTER_HOME/str(cached_master.get("filename") or "")
            cached_profile=str(cached_master.get("generationProfile") or "")
            meta_metrics={}
            master_wav=None
            cache_reused=False
            if (
                cached_profile==ALPHABET_GENERATION_PROFILE
                and cached_file.name
                and cached_file.exists()
                and cached_file.stat().st_size>44
            ):
                try:
                    cached_wav=load_locked_wav(cached_file,24000)
                    cached_metrics=audio_quality_metrics(
                        cached_wav,24000,text_value,"ar","kids_lesson"
                    )
                    hard={"empty_audio","non_finite","near_silence","low_peak","clipping"}
                    if not any(x in hard for x in (cached_metrics.get("issues") or [])):
                        master_wav=cached_file
                        cache_reused=True
                        meta_metrics=cached_metrics
                        meta_metrics["alphabet_master_cache"]="hit"
                        meta_metrics["generationProfile"]=ALPHABET_GENERATION_PROFILE
                except Exception:
                    master_wav=None
                    cache_reused=False

            if master_wav is None:
                # Ein bewusst gestarteter Gesamtbatch darf die interaktive
                # Arbeit nie blockieren. Zwischen zwei Alphabet-Clips wartet
                # der Batch, solange Worttest oder Freistimme/Erzeugen aktiv sind.
                while (
                    LEARNING_PREVIEW_WAITING.is_set()
                    or MANUAL_RENDER_WAITING.is_set()
                    or RENDER_LOCK.locked()
                ):
                    _set_alphabet_batch_state(
                        current="Interaktive Audio-Anfrage hat Vorrang · Batch wartet sicher …"
                    )
                    time.sleep(0.05)
                meta=create_alphabet_voice_preview(text_value,slot_id,0)
                master=confirm_alphabet_voice_preview(
                    str(meta["id"]),slot_id,letter_id,kind,key,text_value,
                    linguistic_verified=False
                )
                master_wav=ALPHABET_MASTER_HOME/str(master["filename"])
                meta_metrics=meta.get("metrics") or {}
                meta_metrics["alphabet_master_cache"]="regenerated"
                meta_metrics["generationProfile"]=ALPHABET_GENERATION_PROFILE

            asset=build_root/"kids/assets/kids-alphabet-audio"/letter_id/_slot_asset_name(kind,key)
            _encode_kids_m4a(master_wav,asset)
            _promote_slot_to_owner_voice(slot,letter_id,kind,key,asset,meta_metrics,build_id)
            if cache_reused and bool(cached_master.get("linguisticVerified")):
                slot.update({
                    "verified":True,
                    "linguisticVerified":True,
                    "reviewStatus":"approved",
                    "requiresManualReview":False,
                    "reviewedAt":str(cached_master.get("reviewedAt") or ""),
                })
            generated.append(str(asset))

        quiz_manifest=_build_quiz_owner_voice_pack(
            quiz_data,build_root,build_id,len(tasks),total_work
        )

        _set_alphabet_batch_state(
            phase="greeting",progress=94,completed=len(tasks)+len(quiz_texts),
            total=total_work,
            current="Kids-Begrüßung wird mit deiner Serhat-Stimme erzeugt …"
        )
        greeting_text=(
            "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, liebe Kinder. "
            "Willkommen bei DĀR AL TAWḤĪD Kids. Los geht’s!"
        )
        greeting_wav=generate(
            greeting_text,"","kids_lesson",
            free_mode=True,free_pronunciation=True
        )
        greeting_asset=build_root/"kids/assets/kids-cinema/intro-voice-serhat.m4a"
        _encode_kids_m4a(greeting_wav,greeting_asset)

        policy=manifest.setdefault("policy",{})
        policy.update({
            "requireExplicitVerification":True,
            "requireHumanApprovalForGeneratedAudio":True,
            "autoPublishGeneratedAudio":False,
            "voiceMode":"owner-voice-generated-linguistic-review-required",
            "targetVoiceProfileId":"serhat-owner-voice-2026",
            "targetVoiceLabel":"Serhat Abu Malik · DĀR Voice Studio",
            "authorizedOwnerVoiceGeneration":True,
            "linguisticReviewRequired":True,
            "technicalQaIsNotPronunciationVerification":True,
            "generatedPromotionRule":"Die lokale Serhat Engine darf alle 140 Lernclips technisch erzeugen und prüfen. Kein Alphabet-Clip wird allein wegen technischer QA sprachlich freigegeben; jeder Lernclip muss vollständig angehört und menschlich bestätigt werden.",
            "note":"Serhat-Clips bleiben als technische Kandidaten erhalten, bis ihre arabische Aussprache menschlich bestätigt ist. Die Eiarabe-Alif-Datei und weitere externe Aufnahmen bleiben nur als Aussprache-Referenzen erhalten.",
            "batchBuild":{
                "id":build_id,
                "voiceProfileId":"serhat-owner-voice-2026",
                "clips":140,
                "quizVoiceClips":len(quiz_texts),
                "quizQuestions":len(quiz_data.get("items") or []),
                "alphabetManualLinguisticApprovalRequired":True,
                "quizTechnicalQaRequired":True,
                "technicalQaRequired":True,
                "failedQaBlocksBuild":True,
                "engine":"local-serhat-engine",
                "generationProfile":ALPHABET_GENERATION_PROFILE
            }
        })
        manifest["updatedAt"]=time.strftime("%Y-%m-%d")
        manifest["ownerVoiceGreeting"]={
            "url":"/kids/assets/kids-cinema/intro-voice-serhat.m4a?v="+build_id,
            "text":greeting_text,
            "voiceProfileId":"serhat-owner-voice-2026",
            "sourceVoice":"authorized-owner-voice",
            "sourceType":"local-owner-generated",
            "sha256":hashlib.sha256(greeting_asset.read_bytes()).hexdigest(),
            "durationSeconds":round(_audio_duration_seconds(greeting_asset),3),
        }
        atomic_write_json(build_root/"kids/data/alphabet-audio.json",manifest)

        if ready.exists():
            shutil.rmtree(ready)
        os.replace(build_root,ready)
        zip_base=ALPHABET_EXPORT_HOME/"DAR-AL-TAWHID-Kids-Serhat-Voice-Pack"
        try:
            Path(str(zip_base)+".zip").unlink(missing_ok=True)
        except Exception:
            pass
        zip_path=Path(shutil.make_archive(str(zip_base),"zip",root_dir=str(ready)))

        _set_alphabet_batch_state(
            phase="publishing",progress=97,completed=total_work,total=total_work,current="Fertiges Alphabet-, Quiz- und Begrüßungspaket wird direkt in die Kids-App übernommen …",
            exportPath=str(ready),zipPath=str(zip_path)
        )
        published,publish_message=_prepare_publish_repo(ready)

        finished=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return _set_alphabet_batch_state(
            running=False,phase="complete",progress=100,completed=total_work,total=total_work,current="Fertig",
            error="",exportPath=str(ready),zipPath=str(zip_path),
            repoPublished=bool(published),
            repoPublishError="" if published else publish_message,
            repoPublishMessage=publish_message,
            startedAt=started,finishedAt=finished
        )
    except Exception as e:
        finished=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        return _set_alphabet_batch_state(
            running=False,phase="error",error=str(e),current="Abgebrochen",
            finishedAt=finished
        )
    finally:
        ALPHABET_BATCH_LOCK.release()

def start_full_local_kids_voice_pack():
    state=_alphabet_batch_snapshot()
    if state.get("running"):
        return state
    thread=threading.Thread(target=build_full_local_kids_voice_pack,daemon=True,name="dar-alphabet-batch")
    thread.start()
    time.sleep(0.05)
    return _alphabet_batch_snapshot()

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
        "tts_language":str(meta.get("tts_language") or ("ar" if re.search(r"[\u0600-\u06ff]",str(meta["tts_text"])) else "de")),
        "tts_strategy":"user-confirmed-audio-learning-v2",
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
        "knownRuleAliases":len(KNOWN_RULE_ALIAS_INDEX),
        "fastKnownPath":True,
        "masterSahaba":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabi"),
        "masterSahabiyyat":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="sahabiyyah"),
        "masterProphets":sum(1 for e in MASTER_ENTRIES if e.get("personType")=="prophet"),
        "autoSyncHours":24,
        "learnedTerms":[str(r.get("string_to_replace","")) for r in user_rules[:2000]],
        "learnedCanonicals":list(dict.fromkeys(
            str(r.get("canonical") or r.get("string_to_replace",""))
            for r in user_rules if r.get("voice_lock")=="MASTER"
        ))[:2000],
        "confirmedAudioLocks":confirmed_audio_lock_keys(),
        "storyReferenceMemory":story_reference_state(),
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

def known_master_form_or_german_inflection(value:str):
    """Bekannte aktive Ausspracheform oder harmlose deutsche Namensflexion erkennen.

    Exakte Formen aus lokalen MASTER-Locks, den kuratierten Regeln, der
    verifizierten Master-Library und dem MAX-MASTER-PLS werden direkt akzeptiert.
    Nur Wörter ohne aktive bekannte Regel bleiben in der Ausspracheprüfung offen.
    Beispiel: Ibrāhīms -> Ibrāhīm + deutsches Genitiv-s.
    """
    norm=normalize_lookup(value)
    if not norm:
        return False
    known=(norm in MASTER_ALIAS_INDEX) or (norm in KNOWN_RULE_ALIAS_INDEX)
    if known:
        return True
    if len(norm)>4 and norm.endswith("s"):
        stem=norm[:-1]
        if stem in MASTER_ALIAS_INDEX or stem in KNOWN_RULE_ALIAS_INDEX:
            return True
    return False

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
            if known_master_form_or_german_inflection(phrase):
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
            chosen=None if known_master_form_or_german_inflection(token) else (token,master_suggestions(token,3))

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
    "render_preview_name":"",
    "render_preview_ready":False,
    "render_preview_segments":0,
    "render_preview_duration_seconds":0.0,
    "render_preview_generation":0,
    "render_preview_complete":False,
    "render_preview_chunks":[],
    "render_preview_chunk_count":0,
    "render_preview_mode":"",
    "render_first_audio_priority":False,
    "render_first_audio_ms":0,
    "render_first_audio_target_chars":0,
    "render_job_id":"",
}

def set_status(**updates):
    with STATUS_LOCK:
        STATUS.update(updates)

def render_status_snapshot():
    """Kompakter Polling-Status für Mac/iPhone während eines laufenden Renders.

    /status enthält zusätzlich große Learning-/Lock-Daten. Für die 0,5–0,9-s-
    Fortschrittsabfrage werden nur diese kleinen Renderfelder serialisiert.
    """
    with STATUS_LOCK:
        st=dict(STATUS)
    keys=(
        "render_state","progress","message","last_error","last_output",
        "render_started_at","render_finished_at","prosody_mode",
        "render_total_segments","render_completed_segments","render_active_segment",
        "render_cached_segments","segment_elapsed_seconds",
        "render_preview_name","render_preview_ready","render_preview_segments",
        "render_preview_duration_seconds","render_preview_generation","render_preview_complete",
        "render_preview_chunks","render_preview_chunk_count","render_preview_mode",
        "render_first_audio_priority","render_first_audio_ms","render_first_audio_target_chars",
        "render_job_id",
    )
    return {key:st.get(key) for key in keys}

def cleanup_progressive_previews(max_age_seconds:int=1800):
    """Entfernt nur alte temporäre Sofort-Vorschauen; fertige Audios bleiben unberührt."""
    cutoff=time.time()-max(60,int(max_age_seconds or 1800))
    try:
        for p in OUTPUT.glob("dar_voice_live_*.wav"):
            try:
                if p.is_file() and p.stat().st_mtime<cutoff:
                    p.unlink(missing_ok=True)
            except Exception:
                pass
    except Exception:
        pass

def _mobile_history_records():
    data=load_json_file(MOBILE_HISTORY_META,{"schemaVersion":1,"items":[]})
    return list((data or {}).get("items") or [])

def analysis_preflight_cache_key(text:str):
    payload={
        "engine":ENGINE_VERSION,
        "text":str(text or "").strip(),
        "userLearning":file_signature(USER_OVERRIDES_FILE),
        "onlineRules":file_signature(ONLINE_LIBRARY_CACHE),
        "masterRules":file_signature(MASTER_LIBRARY_CACHE),
    }
    return hashlib.sha256(
        json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    ).hexdigest()

def get_cached_analysis_preflight(text:str):
    key=analysis_preflight_cache_key(text)
    with ANALYSIS_PREFLIGHT_CACHE_LOCK:
        row=ANALYSIS_PREFLIGHT_CACHE.get(key)
        if not row:
            return None
        row["lastUsedAt"]=time.time()
        return {
            "prepared":str(row.get("prepared") or ""),
            "found":[dict(x or {}) for x in (row.get("found") or [])],
            "unresolved":[dict(x or {}) for x in (row.get("unresolved") or [])],
            "cacheKey":key,
        }

def cache_analysis_preflight(text:str,prepared:str,found,unresolved):
    key=analysis_preflight_cache_key(text)
    now=time.time()
    with ANALYSIS_PREFLIGHT_CACHE_LOCK:
        ANALYSIS_PREFLIGHT_CACHE[key]={
            "prepared":str(prepared or ""),
            "found":[dict(x or {}) for x in (found or [])],
            "unresolved":[dict(x or {}) for x in (unresolved or [])],
            "createdAt":now,
            "lastUsedAt":now,
        }
        if len(ANALYSIS_PREFLIGHT_CACHE)>ANALYSIS_PREFLIGHT_CACHE_MAX:
            ordered=sorted(
                ANALYSIS_PREFLIGHT_CACHE.items(),
                key=lambda kv:float((kv[1] or {}).get("lastUsedAt") or 0)
            )
            for old_key,_ in ordered[:len(ANALYSIS_PREFLIGHT_CACHE)-ANALYSIS_PREFLIGHT_CACHE_MAX]:
                ANALYSIS_PREFLIGHT_CACHE.pop(old_key,None)
    return key

def prepare_analysis_preflight(text:str):
    cached=get_cached_analysis_preflight(text)
    if cached is not None:
        cached["cacheHit"]=True
        return cached
    prepared,found=prepare(text)
    unresolved=detect_unresolved_islamic_terms(text)
    key=cache_analysis_preflight(text,prepared,found,unresolved)
    return {
        "prepared":prepared,
        "found":found,
        "unresolved":unresolved,
        "cacheKey":key,
        "cacheHit":False,
    }

def generation_request_signature(text:str,style:str="auto",free_mode:bool=False,free_pronunciation:bool=False):
    """Exakter Cache-Schlüssel für einen interaktiven Voice-Auftrag.

    Engine-Version, Referenzstimme und lokale Lernregeln gehören zum Schlüssel.
    Sobald sich Aussprachelernen, Voice-Referenz oder Renderer ändert, wird eine
    ältere Audio deshalb niemals fälschlich als aktuelles Ergebnis wiederverwendet.
    """
    payload={
        "engine":ENGINE_VERSION,
        "text":str(text or "").strip(),
        "style":str(style or "auto").strip() or "auto",
        "freeMode":bool(free_mode),
        "pronunciationLibrary":bool(free_pronunciation),
        "referenceDe":file_signature(REF_DE),
        "referenceAr":file_signature(REF_AR),
        "userLearning":file_signature(USER_OVERRIDES_FILE),
    }
    return hashlib.sha256(
        json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    ).hexdigest()

def find_generation_history_cache(signature:str):
    sig=str(signature or "").strip()
    if not sig:
        return None
    for row in _mobile_history_records():
        if str((row or {}).get("signature") or "")!=sig:
            continue
        name=Path(str((row or {}).get("name") or "")).name
        if not name or name!=str((row or {}).get("name") or "") or not name.lower().endswith(".wav"):
            continue
        candidate=OUTPUT/name
        try:
            if candidate.exists() and candidate.is_file() and candidate.stat().st_size>44:
                return {
                    "name":name,
                    "bytes":int(candidate.stat().st_size),
                    "createdAt":float((row or {}).get("createdAt") or candidate.stat().st_mtime),
                }
        except Exception:
            continue
    return None

def record_mobile_generation(path:Path,text:str,style:str,free_mode:bool=False,generation_signature:str=""):
    """Lokale Verlaufsmetadaten für iPhone/iPad; Audio bleibt in VoiceStudioOutput."""
    try:
        p=Path(path)
        value=" ".join(str(text or "").split())
        title=value[:72]+("…" if len(value)>72 else "")
        now=time.time()
        rows=[
            x for x in _mobile_history_records()
            if str((x or {}).get("name") or "")!=p.name
        ]
        rows.insert(0,{
            "name":p.name,
            "title":title or "DĀR Voice Audio",
            "text":value[:600],
            "style":str(style or "auto"),
            "freeMode":bool(free_mode),
            "signature":str(generation_signature or ""),
            "engineVersion":ENGINE_VERSION,
            "createdAt":now,
        })
        atomic_write_json(MOBILE_HISTORY_META,{
            "schemaVersion":2,
            "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "items":rows[:240],
        })
    except Exception as e:
        print("[DĀR Voice] mobile history metadata warning",e,flush=True)

def mobile_history_snapshot(limit:int=60):
    items=[]
    try:
        meta={str((x or {}).get("name") or ""):dict(x or {}) for x in _mobile_history_records()}
        files=sorted(
            [
                p for p in OUTPUT.glob("*.wav")
                if p.is_file()
                and p.stat().st_size>44
                and not p.name.startswith("dar_voice_live_")
            ],
            key=lambda p:p.stat().st_mtime,
            reverse=True
        )
        style_labels={
            "auto":"Auto","narration":"Erzählung","kids_story":"Kinder-Geschichte",
            "kids_lesson":"Kinder-Unterricht","teaching":"Unterricht","gentle":"Sanft",
            "serious":"Ernst","question":"Frage","list":"Aufzählung","dua":"Duʿāʾ",
        }
        for p in files[:max(1,min(120,int(limit or 60)))]:
            st=p.stat()
            row=meta.get(p.name,{})
            created_ts=float(row.get("createdAt") or st.st_mtime)
            created=time.localtime(created_ts)
            fallback=p.stem
            fallback=re.sub(r"^dar_voice_(?:reference_)?","",fallback)
            fallback=re.sub(r"[_-]+"," ",fallback).strip() or "DĀR Voice Audio"
            style=str(row.get("style") or "auto")
            items.append({
                "name":p.name,
                "label":str(row.get("title") or fallback),
                "title":str(row.get("title") or fallback),
                "text":str(row.get("text") or ""),
                "style":style,
                "styleLabel":style_labels.get(style,style),
                "freeMode":bool(row.get("freeMode")),
                "size":int(st.st_size),
                "sizeLabel":f"{st.st_size/1024/1024:.1f} MB" if st.st_size>=1024*1024 else f"{max(1,int(st.st_size/1024))} KB",
                "createdAt":int(created_ts),
                "createdLabel":time.strftime("%d.%m.%Y · %H:%M",created),
            })
    except Exception as e:
        return {"ok":False,"error":str(e),"items":[]}
    return {"ok":True,"items":items,"count":len(items)}

def cleanup_generation_jobs():
    cutoff=time.time()-GENERATION_JOB_TTL_SECONDS
    with GENERATION_JOB_LOCK:
        stale=[
            job_id for job_id,row in GENERATION_JOBS.items()
            if str((row or {}).get("state") or "") in ("ready","error")
            and float((row or {}).get("finishedAt") or 0)<cutoff
        ]
        for job_id in stale:
            GENERATION_JOBS.pop(job_id,None)

def generation_job_snapshot(job_id:str):
    job_id=str(job_id or "").strip()
    if not job_id:
        return {"ok":False,"error":"Audio-Auftrag fehlt."}
    cleanup_generation_jobs()
    with GENERATION_JOB_LOCK:
        row=dict(GENERATION_JOBS.get(job_id) or {})
    if not row:
        return {"ok":False,"error":"Audio-Auftrag nicht gefunden."}
    # Niemals lokale absolute Dateipfade an Companion-Geräte ausgeben.
    row.pop("outputPath",None)
    # 2.9.90: Job + Renderfortschritt in EINER Antwort. iPhone/iPad müssen
    # während der Erzeugung nicht mehr parallel /generate-job und /render-status
    # abfragen. Das reduziert WLAN-Roundtrips und macht Live-Audio ruhiger.
    render=render_status_snapshot()
    if str(render.get("render_job_id") or "")==job_id:
        row["render"]=render
    row["ok"]=True
    return row

def _generation_job_worker(job_id:str,payload:dict):
    with GENERATION_JOB_LOCK:
        row=GENERATION_JOBS.get(job_id)
        if not row:
            return
        row["state"]="rendering"
        row["startedAt"]=time.time()
    text=str(payload.get("text") or "").strip()
    prepared=str(payload.get("prepared") or "").strip()
    style=str(payload.get("style") or "auto").strip() or "auto"
    free_mode=bool(payload.get("freeMode"))
    free_pronunciation=bool(payload.get("pronunciationLibrary",False))
    try:
        out=generate(
            text,prepared,style,
            free_mode=free_mode,
            free_pronunciation=free_pronunciation,
            interactive_fast=bool(payload.get("interactiveFast",True)),
            job_id=job_id,
            preflight_checked=bool(payload.get("_serverPreflightChecked",False)),
            preflight_found=payload.get("_serverFound")
        )
        with GENERATION_JOB_LOCK:
            current_signature=str((GENERATION_JOBS.get(job_id) or {}).get("signature") or "")
        record_mobile_generation(
            out,text,style,free_mode,
            generation_signature=current_signature
        )
        st=Path(out).stat()
        with GENERATION_JOB_LOCK:
            row=GENERATION_JOBS.get(job_id)
            if row is not None:
                row.update({
                    "state":"ready",
                    "outputName":Path(out).name,
                    "outputBytes":int(st.st_size),
                    "finishedAt":time.time(),
                    "error":"",
                })
    except Exception as e:
        with GENERATION_JOB_LOCK:
            row=GENERATION_JOBS.get(job_id)
            if row is not None:
                row.update({
                    "state":"error",
                    "finishedAt":time.time(),
                    "error":f"{type(e).__name__}: {e}",
                })

def start_generation_job(data:dict,free_mode:bool=False):
    cleanup_generation_jobs()
    text=str((data or {}).get("text") or "").strip()
    if not text:
        raise ValueError("Text fehlt.")
    style=str((data or {}).get("style") or "auto").strip() or "auto"
    free_pronunciation=bool((data or {}).get("pronunciationLibrary",False))
    signature=generation_request_signature(
        text,style,
        free_mode=bool(free_mode),
        free_pronunciation=free_pronunciation
    )

    # 2.9.92 · Exact-repeat before preflight:
    # Der Cache-Schlüssel enthält Engine, Referenzen und lokale Lernrevision.
    # Ein exakter Treffer darf deshalb VOR den Wort-/Qurʾān-Scans zurückkommen.
    # Gerade 5–8-Minuten-Texte reagieren beim erneuten Test dadurch sofort.
    cached=find_generation_history_cache(signature)
    if cached:
        job_id=uuid.uuid4().hex[:20]
        now=time.time()
        with GENERATION_JOB_LOCK:
            GENERATION_JOBS[job_id]={
                "jobId":job_id,
                "state":"ready",
                "signature":signature,
                "style":style,
                "freeMode":bool(free_mode),
                "createdAt":now,
                "startedAt":now,
                "finishedAt":now,
                "outputName":str(cached["name"]),
                "outputBytes":int(cached["bytes"]),
                "error":"",
                "reused":True,
                "reuseType":"exact-history-cache",
            }
        return {
            "ok":True,"jobId":job_id,"state":"ready",
            "reused":True,"reuseType":"exact-history-cache"
        }

    server_prepared=""
    server_found=[]
    if not free_mode:
        # Derselbe Guard wie im Produktionsrenderer, aber VOR dem Thread-Start.
        # Ein vorheriger /analyze-Aufruf (z. B. direkt nach Einfügen des Textes)
        # wird serverseitig wiederverwendet, statt dieselben 5–8 Minuten Text
        # beim Klick auf „Erzeugen“ erneut vollständig zu scannen.
        quran_guard(text)
        preflight=prepare_analysis_preflight(text)
        unresolved=list(preflight.get("unresolved") or [])
        if unresolved:
            raise PronunciationReviewRequired(unresolved)
        if bool((data or {}).get("interactiveFast",True)):
            # Unbekannt-/Qurʾān-Prüfung stammt aus dem Cache; nur die viel leichtere
            # Sprechform wird für Extreme Fast neu aufgebaut.
            server_prepared,server_found=prepare(text,interactive_fast=True)
        else:
            server_prepared=str(preflight.get("prepared") or "")
            server_found=list(preflight.get("found") or [])

    with GENERATION_JOB_LOCK:
        active=[
            (job_id,row) for job_id,row in GENERATION_JOBS.items()
            if str((row or {}).get("state") or "") in ("queued","rendering")
        ]
        for existing_id,row in active:
            if str((row or {}).get("signature") or "")==signature:
                return {
                    "ok":True,"jobId":existing_id,
                    "state":str(row.get("state") or "queued"),
                    "reused":True,
                }
        if active:
            raise RuntimeError("Eine interaktive Audio-Erzeugung läuft bereits.")
        job_id=uuid.uuid4().hex[:20]
        GENERATION_JOBS[job_id]={
            "jobId":job_id,
            "state":"queued",
            "signature":signature,
            "style":style,
            "freeMode":bool(free_mode),
            "createdAt":time.time(),
            "startedAt":0,
            "finishedAt":0,
            "outputName":"",
            "outputBytes":0,
            "error":"",
        }
    payload=dict(data or {})
    payload["text"]=text
    payload["style"]=style
    payload["freeMode"]=bool(free_mode)
    if not free_mode:
        payload["prepared"]=server_prepared
        payload["_serverPreflightChecked"]=True
        payload["_serverFound"]=server_found
    threading.Thread(
        target=_generation_job_worker,
        args=(job_id,payload),
        daemon=True,
        name="dar-interactive-generate-"+job_id[:8],
    ).start()
    return {"ok":True,"jobId":job_id,"state":"queued","reused":False}

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
    out["engine_version"]=ENGINE_VERSION
    out["performance_engine"]="extreme-fast-mlx-4bit-v1"
    out["reference_prepares_total"]=MODEL_REFERENCE_PREPARES
    out["reference_cache_hits_total"]=MODEL_REFERENCE_CACHE_HITS
    out["render_cache"]=dict(RENDER_CACHE_STATS)
    out["long_form_guard"]={"deMaxChars":150,"arMaxChars":96,"maxNewTokens":620}
    out["production_backend"]=ACTIVE_BACKEND
    if ACTIVE_BACKEND=="mlx" and out.get("model_state")=="ready":
        out["model_device"]="mlx-metal"
    out["mlx_enabled"]=bool(MLX_ENABLED)
    out["mlx_model"]=MLX_MODEL_ID if MLX_ENABLED else None
    out["mlx_primary_model"]=MLX_PRIMARY_MODEL_ID if MLX_ENABLED else None
    out["mlx_quality_model"]=MLX_QUALITY_MODEL_ID if MLX_ENABLED else None
    out["interactive_extreme_fast"]=True
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

def apply_user_learned_overrides(text:str):
    """Lokale, vom Nutzer bestätigte Aussprachekorrekturen zuerst anwenden.

    Dadurch überschreibt eine bewusst gelernte Auswahl wie
    'Raḥmatullāhi wa Barakātuh' oder 'Kids' immer unsere eingebauten Presets.
    """
    value=str(text or "")
    found=[]
    rules=[
        dict(x or {})
        for x in ((USER_OVERRIDE_DATA or {}).get("rules") or [])
        if str((x or {}).get("string_to_replace") or "").strip()
        and str((x or {}).get("tts_text") or "").strip()
    ]
    rules.sort(key=lambda x:len(str(x.get("string_to_replace") or "")),reverse=True)
    for rule in rules:
        form=str(rule.get("string_to_replace") or "").strip()
        tts=str(rule.get("tts_text") or "").strip()
        if not form or form not in value:
            continue
        count=value.count(form)
        value=value.replace(form,tts)
        hit=dict(rule)
        hit["learned_override_matches"]=count
        found.append(hit)
    return value,found

def apply_profile_fixed_phrases(text:str):
    """Mehrwort-Phrasen mit Vorrang für lokal bestätigte Teilkorrekturen."""
    value=str(text or "")
    found=[]
    cfg=(VOICE_PROFILE.get("pronunciation") or {}).get("fixedPhrases") or []
    phrases=[]

    learned_rules=[
        dict(x or {})
        for x in ((USER_OVERRIDE_DATA or {}).get("rules") or [])
        if str((x or {}).get("string_to_replace") or "").strip()
        and str((x or {}).get("tts_text") or "").strip()
    ]
    learned_by_norm={}
    for rule in learned_rules:
        learned_by_norm[normalize_lookup(rule.get("string_to_replace",""))]=rule
        learned_by_norm.setdefault(normalize_lookup(rule.get("canonical","")),rule)

    def learned(*forms):
        for form in forms:
            rule=learned_by_norm.get(normalize_lookup(form))
            if rule:
                return rule
        return None

    for raw in cfg:
        item=dict(raw or {})
        tts=str(item.get("tts_text") or "").strip()
        if not tts:
            continue
        for form in (item.get("forms") or []):
            form=str(form or "").strip()
            if form:
                phrases.append((form,tts,item))
    phrases.sort(key=lambda x:len(x[0]),reverse=True)

    for form,tts,item in phrases:
        if form not in value:
            continue

        phrase_id=str(item.get("id") or "")
        effective_tts=tts
        effective_lang=str(item.get("tts_language") or "ar")

        # Die vollständige Begrüßung bleibt EIN Segment. Gelernte Teilkorrekturen
        # werden in diese eine arabische Phrase eingebaut, statt drei neue TTS-
        # Segmente zu erzeugen. Das verhindert hörbare Neustarts zwischen den Wörtern.
        if phrase_id=="salam_full_greeting":
            tail_rule=learned(
                "Raḥmatullāhi wa Barakātuh",
                "wa Raḥmatullāhi wa Barakātuh"
            )
            rahma_rule=learned("wa Raḥmatullāhi","Raḥmatullāhi")
            baraka_rule=learned("wa Barakātuh","Barakātuh")

            def _strip_arabic_wa(v):
                x=str(v or "").strip()
                return re.sub(r"^[و][َُِّْٰ]*","",x).strip()

            if tail_rule and str(tail_rule.get("tts_language") or "ar")=="ar":
                tail=_strip_arabic_wa(tail_rule.get("tts_text"))
                effective_tts="السَّلَامُ عَلَيْكُمْ وَ"+tail
            elif rahma_rule or baraka_rule:
                rahma=_strip_arabic_wa(
                    rahma_rule.get("tts_text") if rahma_rule else "رَحْمَتُ اللَّهِ"
                )
                baraka=_strip_arabic_wa(
                    baraka_rule.get("tts_text") if baraka_rule else "بَرَكَاتُهُ"
                )
                effective_tts="السَّلَامُ عَلَيْكُمْ وَ"+rahma+" وَ"+baraka

        if phrase_id=="salam_part_2_rahmatullahi":
            rule=learned("wa Raḥmatullāhi","Raḥmatullāhi")
            if rule and str(rule.get("tts_language") or "ar")=="ar":
                learned_tts=str(rule.get("tts_text") or "").strip()
                effective_tts=learned_tts if learned_tts.startswith("و") else "وَ"+learned_tts

        if phrase_id=="salam_part_3":
            rule=learned("wa Barakātuh","Barakātuh")
            if rule and str(rule.get("tts_language") or "ar")=="ar":
                learned_tts=str(rule.get("tts_text") or "").strip()
                effective_tts=learned_tts if learned_tts.startswith("و") else "وَ"+learned_tts

        if phrase_id=="salam_tail_rahmatullahi_barakatuh":
            rule=learned(
                "Raḥmatullāhi wa Barakātuh",
                "wa Raḥmatullāhi wa Barakātuh"
            )
            if rule and str(rule.get("tts_language") or "ar")=="ar":
                effective_tts=str(rule.get("tts_text") or effective_tts).strip()

        if phrase_id=="dar_al_tawhid_kids_brand_phrase":
            # Die Markenphrase bleibt absichtlich EIN deutscher Kontextblock.
            # Dadurch bekommt "Kids" keine isolierte Zischlaut-Endung und es gibt
            # keinen Sprachmodell-Neustart nach TAWḤĪD.
            rule=learned("Kids")
            kids_form="Kids"
            if rule and str(rule.get("tts_language") or "")=="de":
                kids_form=str(rule.get("tts_text") or "Kids").strip() or "Kids"
            effective_tts="Daar al Tauhiid "+kids_form
            effective_lang="de"

        count=value.count(form)
        value=value.replace(form,effective_tts)
        found.append({
            "canonical":form,
            "string_to_replace":form,
            "tts_text":effective_tts,
            "tts_language":effective_lang,
            "tts_strategy":"profile-fixed-phrase-v2",
            "voice_lock":"PROFILE_PHRASE",
            "fixed_phrase_id":phrase_id,
            "fixed_phrase_matches":count,
        })
    return value,found

def pronunciation_rule_boundary_ok(text:str,pos:int,needle:str):
    """Verhindert, dass PLS-Kurzbegriffe mitten in normalen Wörtern feuern."""
    value=str(text or "")
    needle=str(needle or "")
    if not needle:
        return False
    end=pos+len(needle)
    lexical_extra="ʿʾ'’"
    def lexical(ch:str):
        return bool(ch) and (ch.isalnum() or ch in lexical_extra)
    if pos>0 and lexical(value[pos-1]) and lexical(needle[0]):
        return False
    if end<len(value) and lexical(value[end]) and lexical(needle[-1]):
        return False
    return True

def interactive_fast_rule_form(rule,default_form:str=""):
    """Extreme-Fast-Sprechform ohne Verlust bestätigter Audio-Master."""
    r=dict(rule or {})
    tts=str(r.get("tts_text") or r.get("alias") or default_form or "").strip()
    if not tts or not re.search(r"[\u0600-\u06ff]",tts):
        return tts or str(default_form or "")
    key=str(r.get("audio_lock_key") or AUDIO_LOCK_BY_TTS.get(tts,"")).strip()
    if key:
        try:
            locked=audio_lock_path(key)
            if locked.exists() and locked.stat().st_size>44:
                return tts
        except Exception:
            pass
    # Noch nicht als Audio bestätigte arabische Bibliotheksformen bleiben im
    # deutschen Satz. Dadurch entfallen dutzende DE↔AR-Modellwechsel.
    for field in ("alias","canonical","string_to_replace"):
        candidate=str(r.get(field) or "").strip()
        if candidate and re.search(r"[A-Za-zÀ-ÖØ-öø-ÿʿʾ]",candidate) and not re.search(r"[\u0600-\u06ff]",candidate):
            return candidate
    return tts

def prepare(text:str,interactive_fast:bool=False):
    pos=0;out=[];found=[]
    while pos<len(text):
        hit=None
        for r in RULES_BY_FIRST.get(text[pos],()):
            needle=str(r.get("string_to_replace",""))
            if needle and text.startswith(needle,pos):
                if r.get("requires_boundary") and not pronunciation_rule_boundary_ok(text,pos,needle):
                    continue
                hit=r;break
        if not hit:
            out.append(text[pos]);pos+=1;continue

        needle=str(hit.get("string_to_replace",""))
        default_spoken=str(hit.get("tts_text") or hit.get("alias") or needle)
        spoken=interactive_fast_rule_form(hit,needle) if interactive_fast else default_spoken
        out.append(spoken)
        found_hit=dict(hit)
        if interactive_fast and spoken!=default_spoken:
            found_hit["interactive_fast_spoken_form"]=spoken
        found.append(found_hit)
        next_pos=pos+len(needle)

        required_key=str(hit.get("required_honorific_key",""))
        if required_key:
            honorific_tts=HONORIFIC_TTS_BY_KEY.get(required_key,"")
            explicit=source_honorific_match(text,next_pos,required_key)
            if honorific_tts:
                honorific_rule=HONORIFIC_RULE_BY_KEY.get(required_key)
                honorific_spoken=(
                    interactive_fast_rule_form(honorific_rule,honorific_tts)
                    if interactive_fast and honorific_rule else honorific_tts
                )
                if explicit:
                    prefix=str(explicit.get("prefix",""))
                    out.append((prefix if prefix else " ")+honorific_spoken)
                    next_pos=int(explicit["end"])
                    if honorific_rule:
                        found.append(honorific_rule)
                else:
                    out.append(" "+honorific_spoken)
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
    if forced=="cpu" or forced=="mps" or forced=="cuda" or forced.startswith("cuda:"):
        return forced
    import torch
    if torch.cuda.is_available():
        return "cuda"
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
    # Größere deutsche Long-Form-Blöcke brauchen Headroom, sonst erzeugt das
    # alte 360er-Limit einen teuren Retry/Rescue statt schneller fertig zu werden.
    budget=int(92 + chars*1.62 + words*2.1)
    if language_id=="ar":
        return max(150,min(340,budget))
    return max(165,min(900,budget))

def mlx_token_budget(text:str,language_id:str):
    # Backward-compatible interner Alias.
    return generation_token_budget(text,language_id)

def generation_timeout_seconds(text:str,language_id:str,mode:str=""):
    forced=str(os.environ.get("DAR_VOICE_SEGMENT_TIMEOUT_SECONDS","")).strip()
    if forced:
        try:
            # Auch ein manuell gesetzter Wert darf einen einzelnen Satz nicht
            # minutenlang blockieren. Rescue bleibt abschnittsweise.
            return max(18.0,min(75.0,float(forced)))
        except Exception:
            pass
    chars=len(re.sub(r"\s+","",str(text or "")))
    if language_id=="ar":
        return max(24.0,min(46.0,17.0+chars*0.28))
    if mode=="kids_story":
        # Bei Kinder-Langtexten ist "scheinbar hängt" meist ein einzelner
        # Sampling-Ausreißer. Nach spätestens ~36 s wird nur dieser Abschnitt
        # beendet, kleiner geteilt und fortgesetzt.
        return max(18.0,min(36.0,14.0+chars*0.16))
    return max(28.0,min(52.0,19.0+chars*0.20))

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
                    set_status(segment_elapsed_seconds=int(round(elapsed)))
                    return msg
                code=str(msg.get("code",""))
                detail=str(msg.get("error") or "Unbekannter MLX-Fehler.")
                if code=="token_limit":
                    raise GenerationTokenLimitReached(detail)
                if kind=="fatal":
                    _stop_mlx_process("fatal worker error")
                raise RuntimeError(detail)

            if heartbeat and elapsed>=next_heartbeat:
                st=get_status()
                active=int(st.get("render_active_segment",0) or 0)
                total=int(st.get("render_total_segments",0) or 0)
                prefix=f"Abschnitt {active}/{total} · " if active and total else ""
                # Prozent zeigt nur noch echte abgeschlossene Arbeit. Während
                # eines laufenden Satzes zeigen wir stattdessen seine Laufzeit.
                set_status(
                    progress=max(base_progress,int(st.get("progress",base_progress) or base_progress)),
                    segment_elapsed_seconds=int(elapsed),
                    message=f"{prefix}Synthese läuft · {int(elapsed)} s · Watchdog aktiv"
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
    # Ein früherer MLX-Fehler darf die High-Speed-Engine nicht für die gesamte
    # App-Laufzeit sperren. Der überwachte Worker wird bei jedem neuen Render
    # erneut versucht; erst ein aktueller Startfehler fällt auf PyTorch/MPS zurück.
    if MLX_ENABLED and importlib.util.find_spec("mlx_audio") is not None:
        try:
            return load_mlx_model()
        except Exception as e:
            print("[DĀR Voice] MLX aktuell nicht verfügbar, Fallback auf PyTorch/MPS:",e,flush=True)
    ACTIVE_BACKEND="torch"
    return load_model()

def render_with_mlx(model,text:str,language_id:str,mode:str):
    import numpy as np, torch
    ref=reference_for_language(language_id)
    p=prosody_settings(mode,language_id,text)
    budget=mlx_token_budget(text,language_id)
    if language_id=="de" and mode=="kids_story":
        budget=max(360,min(max(int(budget),int(len(str(text))*2.05)),920))
    elif language_id=="ar" and mode=="kids_story":
        budget=max(220,min(max(int(budget),int(len(str(text))*2.30)),420))
    timeout_s=generation_timeout_seconds(text,language_id,mode)
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
            if str(target).startswith("cuda"):
                try:
                    torch.backends.cuda.matmul.allow_tf32=True
                    torch.backends.cudnn.allow_tf32=True
                    torch.set_float32_matmul_precision("high")
                except Exception as e:
                    print("[DĀR Voice] CUDA TF32 setup warning:",e,flush=True)
            # Beim Gerätewechsel altes Modell freigeben.
            if MODEL is not None:
                MODEL=None
                gc.collect()
                if torch.backends.mps.is_available():
                    try: torch.mps.empty_cache()
                    except Exception: pass
                if torch.cuda.is_available():
                    try: torch.cuda.empty_cache()
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
                cuda_tf32=bool(str(target).startswith("cuda")),
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

def _idle_voice_maintenance():
    """Teure Nebenarbeit erst ausführen, wenn kein Nutzer auf Audio wartet."""
    try:
        # Der deutsche Hauptpfad ist bereits warm. Arabische Referenz und
        # Cache-Pflege warten auf ein echtes Leerlaufen der interaktiven Engine.
        for _ in range(60):
            time.sleep(2.0)
            if (
                not RENDER_LOCK.locked()
                and not MANUAL_RENDER_WAITING.is_set()
                and not LEARNING_PREVIEW_WAITING.is_set()
            ):
                break
        else:
            return

        if ARABIC_DEDICATED_REFERENCE:
            try:
                ref=reference_for_language("ar")
                p=prosody_settings("narration","ar","تجربة")
                if MLX_ENABLED and _mlx_process_alive():
                    _mlx_request({
                        "op":"warm",
                        "ref_path":str(ref),
                        "exaggeration":float(p["exaggeration"]),
                    },timeout_s=75.0,heartbeat=False)
                elif MODEL is not None:
                    prepare_reference_if_needed(MODEL,"ar",p["exaggeration"])
            except Exception as e:
                print("[DĀR Voice] deferred Arabic warmup warning:",e,flush=True)

        # Cache-Aufräumen ist reine Wartung und darf den ersten Render niemals
        # durch Dateisystem-Scans verzögern.
        if (
            not RENDER_LOCK.locked()
            and not MANUAL_RENDER_WAITING.is_set()
            and not LEARNING_PREVIEW_WAITING.is_set()
        ):
            cleanup_render_cache()
    except Exception as e:
        print("[DĀR Voice] idle maintenance warning:",e,flush=True)

def warm_model():
    try:
        model=load_production_model()
        # 2.9.91: Cold-start optimiert. Nur die deutsche Hauptreferenz wird
        # sofort konditioniert. Alles Weitere läuft später im Leerlauf.
        if getattr(model,"_dar_backend","torch")=="mlx":
            ref=reference_for_language("de")
            p=prosody_settings("narration","de","Warmup")
            _mlx_request({
                "op":"warm",
                "ref_path":str(ref),
                "exaggeration":float(p["exaggeration"]),
            },timeout_s=75.0,heartbeat=False)
        else:
            prepare_reference_if_needed(
                model,"de",
                prosody_settings("narration","de","Warmup")["exaggeration"]
            )
        threading.Thread(
            target=_idle_voice_maintenance,
            daemon=True,
            name="dar-voice-idle-maintenance"
        ).start()
    except Exception as e:
        print("[DĀR Voice] MLX/Voice warmup warning:",e,flush=True)

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

def _coalesce_kids_story_plan(plan,max_chars:int=230,max_sentences:int=2):
    """Reduziert unnötige Modellaufrufe bei langen Kinder-Geschichten.

    Nur direkt benachbarte deutsche Abschnitte werden gebündelt. Arabische
    Fachbegriffe, Audio-Locks und Sprachwechsel bleiben unangetastet, damit die
    bestätigte Aussprache exakt erhalten bleibt. Bei einem Fehler kann der
    gebündelte Block durch die bestehende Rescue-Logik wieder kleiner zerlegt werden.
    """
    compact=[]
    for lang,chunk in plan:
        value=str(chunk or "").strip()
        if not value:
            continue
        if lang!="de":
            compact.append((lang,value))
            continue

        if compact and compact[-1][0]=="de":
            prev=compact[-1][1]
            joined=(prev+" "+value).strip()
            sentence_count=len(re.findall(r"[.!?؟…](?:\s|$)",joined))
            punctuation_load=len(re.findall(r"[,;:]",joined))
            if (
                len(joined)<=int(max_chars)
                and sentence_count<=int(max_sentences)
                and punctuation_load<3
            ):
                compact[-1]=("de",joined)
                continue
        compact.append(("de",value))
    return compact

def prioritize_interactive_first_audio(plan,max_first_chars:int=110):
    """Interaktive Langtexte liefern bewusst einen kurzen ersten DE-Block.

    Das Gesamtaudio bleibt identisch aufgebaut, aber der erste hörbare Abschnitt
    soll deutlich früher verfügbar sein. Nur der bereits gebündelte erste
    deutsche Block wird einmal geteilt; der Rest wird wieder zu einem sicheren
    Folgeblock zusammengezogen. Arabische Blöcke/Audio-Locks bleiben unangetastet.
    """
    rows=list(plan or [])
    if len(rows)<=1:
        return rows
    lang,chunk=rows[0]
    value=str(chunk or "").strip()
    limit=max(56,min(140,int(max_first_chars or 110)))
    if lang!="de" or len(value)<=limit:
        return rows
    parts=split_chunks(value,max_chars=limit)
    if len(parts)<=1:
        return rows
    head=str(parts[0] or "").strip()
    tail=" ".join(str(x or "").strip() for x in parts[1:] if str(x or "").strip()).strip()
    if not head or not tail:
        return rows
    return [("de",head),("de",tail),*rows[1:]]

def build_render_plan(text:str,mode:str=""):
    plan=[]
    story_mode=(str(mode or "")=="kids_story")
    for kind,value in split_audio_locked_spans(text):
        if kind=="lock":
            plan.append(("ar",value.strip()))
            continue
        for lang,segment in split_language_segments(value):
            max_chars=96 if lang=="ar" else (190 if story_mode else 140)

            # Arabische Namens-/Begriffslisten in Kinder-Geschichten niemals als
            # einen einzigen autoregressiven Auftrag senden. Genau Sequenzen wie
            # "آدَم, نُوح, إِبْرَاهِيم, مُوسَى, عِيسَى" liefen sonst trotz
            # korrekter Fuṣḥā-Formen in ein generation_token_limit.
            if story_mode and lang=="ar":
                raw_parts=[
                    p.strip()
                    for p in re.split(r"\s*[,،;؛]\s*",str(segment or ""))
                    if p.strip()
                ]
                if len(raw_parts)>=2:
                    for part_idx,part in enumerate(raw_parts):
                        punct="،" if part_idx<len(raw_parts)-1 else ""
                        for sub in split_chunks(part+punct,max_chars=max_chars):
                            if sub.strip():
                                plan.append(("ar",sub.strip()))
                    continue

            for chunk in split_chunks(segment,max_chars=max_chars):
                clean=chunk.strip()
                if not clean:
                    continue
                if (
                    story_mode and lang=="de"
                    and len(clean)>=72
                    and len(re.findall(r"[,;:]",clean))>=3
                ):
                    # Aufzählungsreiche Erzählsätze sind bei Chatterbox besonders
                    # anfällig für autoregressive Schleifen. Vor der Synthese in
                    # zwei ausgewogene natürliche Phrasen teilen, statt erst nach
                    # einem minutenlangen token-limit zu reagieren.
                    story_parts=split_rescue_chunks(clean,force=True)
                    if len(story_parts)>1:
                        plan.extend(("de",part) for part in story_parts if part.strip())
                        continue
                plan.append((lang,clean))
    if story_mode:
        plan=_coalesce_kids_story_plan(plan,max_chars=230,max_sentences=2)
    return plan

def _expand_free_voice_phrase_plan(lang:str,segment:str):
    """Profilgesteuerte Mehrwort-Phrasen in stabile Sprechbausteine zerlegen."""
    value=str(segment or "")
    render_plans=(VOICE_PROFILE.get("pronunciation") or {}).get("freeVoicePhraseRenderPlans") or []
    parts=[value]
    for raw in render_plans:
        item=dict(raw or {})
        source=str(item.get("sourceTts") or "").strip()
        chunks=[str(x or "").strip() for x in (item.get("chunks") or []) if str(x or "").strip()]
        target_lang=str(item.get("language") or "ar")
        if not source or len(chunks)<2 or target_lang!=lang:
            continue
        expanded=[]
        for part in parts:
            if source not in part:
                expanded.append(part)
                continue
            before,after=part.split(source,1)
            if before.strip():
                expanded.append(before.strip())
            expanded.extend(chunks)
            if after.strip():
                # Komma/Punkt direkt hinter der Phrase gehört akustisch an den letzten Chunk.
                if re.fullmatch(r"[\s,،;؛:!?؟….]+",after):
                    expanded[-1]=(expanded[-1]+after).strip()
                else:
                    expanded.append(after.strip())
        parts=expanded
    return [(lang,x.strip()) for x in parts if x.strip()]

def build_free_pronunciation_render_plan(text:str):
    """Freie Aussprache: bestätigte Kern-/Ehrenformeln bleiben eigene Audioblöcke.

    Der normale freie Modus bleibt unverändert. Nur wenn free_pronunciation aktiv
    ist, werden bekannte Audio-Locks aus längeren arabischen Segmenten getrennt.
    So wird z. B. ein Name plus رضي الله عنه nicht als ein einziger langer
    ar/kids_lesson-Chunk gerendert, sondern Name und Ehrenformel bleiben getrennt.
    """
    plan=[]
    for kind,value in split_audio_locked_spans(text):
        clean=str(value or "").strip()
        if not clean:
            continue
        if kind=="lock":
            plan.append(("ar",clean))
            continue
        plan.extend(build_free_render_plan(clean))
    return plan

def build_free_render_plan(text:str):
    """Freie Stimme: ganze Sätze bevorzugen, nur lange Sätze sicher teilen.

    Die frühere 64/72-Zeichen-Aufteilung machte die Ausgabe schnell, aber hörbar
    stückelig. Nach der MPS-Stabilisierung dürfen natürliche Sätze wieder länger
    bleiben; nur wirklich lange Segmente werden begrenzt.
    """
    plan=[]
    de_max=int(CONTINUITY_CONFIG.get("freeVoiceGermanMaxChars",108))
    ar_max=int(CONTINUITY_CONFIG.get("freeVoiceArabicMaxChars",96))
    for lang,segment in split_language_segments(text):
        expanded=_expand_free_voice_phrase_plan(lang,segment)
        for exp_lang,exp_segment in expanded:
            max_chars=ar_max if exp_lang=="ar" else de_max
            for chunk in split_chunks(exp_segment,max_chars=max_chars):
                if chunk.strip():
                    plan.append((exp_lang,chunk.strip()))
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
    # Fließender Erzähltext darf niemals allein wegen Kommas oder eines Doppelpunkts
    # in Listen-Prosodie kippen. Genau das zerlegte Kinder-Geschichten hörbar in
    # einzelne Ansagen. Auto-"list" ist deshalb bewusst konservativ und greift nur
    # bei echter Listenstruktur oder einer kompakten Aufzählung nach Doppelpunkt.
    lines=[line.strip() for line in re.split(r"[\r\n]+",value) if line.strip()]
    structured_list=sum(
        1 for line in lines
        if re.match(r"^(?:[-•–—]|\d+[.)])\s+\S",line)
    )>=2
    semicolon_list=(value.count(";")>=2 and word_count<=60)

    # Doppelpunkt + Kommas ist in normalem Erzähltext sehr häufig
    # ("... erinnert uns daran: Eine gute Tat ..., und wir ...").
    # Das darf niemals automatisch Listen-Prosodie aktivieren. Echte Listen
    # werden automatisch nur noch an klarer Listenstruktur oder mehreren
    # Semikolon-Gliedern erkannt; alles andere kann bei Bedarf manuell auf
    # "Aufzählung" gestellt werden.
    if structured_list or semicolon_list:
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

    if mode=="kids_story" and not is_ar:
        # Chatterbox verdoppelt bei cfg_weight > 0 intern den Text-Token-Batch.
        # Für lange Kinder-Geschichten entfällt dieser doppelte CFG-Pass.
        # Voice-Conditioning, Temperatur, Exaggeration und QA bleiben erhalten.
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
    """DE↔AR-Grenzen: stabiler Fallback ohne Carrier-Kontext-Rendering.

    Die Carrier-Bridge kann auf einzelnen Apple-Silicon/MLX-Runs hängen oder
    abbrechen. Bis der Übergang separat neu gebaut ist, rendern wir die normalen
    Segmente und verbinden sie ausschließlich im Stitcher per engem Crossfade.
    """
    return ""

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
    if language_id=="de" and mode=="kids_story":
        # Gleiche Headroom-Regel wie im MLX-Pfad.
        cap=max(360,min(max(int(cap),int(len(str(text))*2.20)),560))
    elif language_id=="ar" and mode=="kids_story":
        cap=max(220,min(max(int(cap),int(len(str(text))*2.40)),380))
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
    inline_arabic=language_id=="ar" and is_inline_arabic_micro_term(text)
    fixed_phrase=language_id=="ar" and is_profile_fixed_phrase_tts(text)
    honorific_key=audio_lock_key_for_chunk(text) if language_id=="ar" else ""
    honorific_keys=honorific_lock_keys_in_chunk(text) if language_id=="ar" else []
    honorific_phrase=(honorific_key in HONORIFIC_KEYS) or bool(honorific_keys)
    if (
        (language_id=="ar" and not inline_arabic and not fixed_phrase and not honorific_phrase)
        or not w.numel()
        or w.shape[-1]<int(sr*0.3)
    ):
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
    if inline_arabic or fixed_phrase or honorific_phrase:
        threshold=max(
            peak*float(QA_CONFIG.get("inlineArabicSilenceThresholdRelative",0.0045)),
            float(QA_CONFIG.get("inlineArabicSilenceAbsolute",0.00015))
        )
    else:
        threshold=max(peak*0.012,0.0004)
    silent=(framed<threshold).tolist()

    probe=str(text or "").strip()
    core=re.sub(r"[.!?؟…]+$","",probe).strip()
    has_internal_punctuation=bool(re.search(r"[,،;؛:!?؟…]|\.(?=\s+\S)",core))
    if inline_arabic:
        target_ms=int(QA_CONFIG.get("inlineArabicFlowTargetPauseMs",45))
        trigger_ms=int(QA_CONFIG.get("inlineArabicFlowRepairTriggerMs",120))
        max_repair_ms=int(QA_CONFIG.get("inlineArabicFlowRepairMaxMs",700))
    elif fixed_phrase:
        phrase_cfg=fixed_phrase_config_for_tts(text)
        target_ms=int(phrase_cfg.get("flowRepairTargetMs",QA_CONFIG.get("fixedPhraseFlowTargetPauseMs",140)))
        trigger_ms=int(phrase_cfg.get("flowRepairTriggerMs",QA_CONFIG.get("fixedPhraseFlowRepairTriggerMs",320)))
        max_repair_ms=int(phrase_cfg.get("flowRepairMaxMs",QA_CONFIG.get("fixedPhraseFlowRepairMaxMs",900)))
    elif honorific_phrase:
        # Bekannte Ehrenformeln sind feste, kurze arabische Sprachbausteine.
        # Eine 500–900-ms-Denkpause mitten in ﷺ/رضي الله عنه ist kein natürlicher
        # Bestandteil der Formel und darf sicher komprimiert werden.
        target_ms=int(QA_CONFIG.get("honorificFlowTargetPauseMs",90))
        trigger_ms=int(QA_CONFIG.get("honorificFlowRepairTriggerMs",180))
        max_repair_ms=int(QA_CONFIG.get("honorificFlowRepairMaxMs",900))
    else:
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

    sentence_parts=[p.strip() for p in re.split(r"(?<=[.!?؟…])\s+",value) if p.strip()]
    if len(sentence_parts)>=2 and max(map(len,sentence_parts))<len(value)*0.86:
        return sentence_parts

    parts=[p.strip() for p in re.split(r"(?<=[,،;؛:])\s+",value) if p.strip()]
    if len(parts)>=2 and max(map(len,parts))<len(value)*0.82:
        if len(parts)==2:
            return parts
        # Aufzählungen nicht in winzige Ein-Wort-Clips zerlegen. Stattdessen an
        # der Satzmitte in zwei natürliche Phrasenblöcke teilen; bei Bedarf
        # kann jeder Block rekursiv nochmals geteilt werden.
        best_cut=1
        best_score=None
        for cut in range(1,len(parts)):
            left=" ".join(parts[:cut]).strip()
            right=" ".join(parts[cut:]).strip()
            if not left or not right:
                continue
            score=abs(len(left)-len(right))
            if best_score is None or score<best_score:
                best_score=score
                best_cut=cut
        return [
            " ".join(parts[:best_cut]).strip(),
            " ".join(parts[best_cut:]).strip(),
        ]

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

def render_segment_with_qa(model,text:str,language_id:str,mode:str,critical:bool=False,seed_base:int=2026,interactive_fast:bool=False):
    import torch
    attempts=max(1,int(QA_CONFIG.get("maxRenderAttempts",2)))
    if language_id=="de" and mode=="kids_story":
        attempts=max(attempts,3)
    if language_id=="ar" and mode=="kids_story":
        attempts=max(attempts,5)
    if language_id=="ar" and is_inline_arabic_micro_term(text):
        attempts=max(attempts,int(QA_CONFIG.get("inlineArabicRenderAttempts",4)))
    if interactive_fast:
        # Statt denselben langen Satz 3–5× neu zu rechnen, sofort Rescue/Split.
        attempts=2 if (critical or language_id=="ar") else 1
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    seed_base=max(1,int(seed_base))
    last=None

    for attempt in range(attempts):
        torch.manual_seed(seed_base+attempt*seed_offset)
        try:
            wav=render_with_model(model,text,language_id,mode)

            # Arabische Kernbegriffe und bestätigte Mehrwort-Phrasen dürfen keine
            # hörbare KI-"Denkpause" enthalten. Vor der QA nur echte energiearme
            # Inseln komprimieren; aktive Phoneme bleiben unangetastet.
            proactive_pause_repair={}
            if language_id=="ar" and (
                is_inline_arabic_micro_term(text)
                or is_profile_fixed_phrase_tts(text)
                or audio_lock_key_for_chunk(text) in HONORIFIC_KEYS
                or bool(honorific_lock_keys_in_chunk(text))
            ):
                compacted,proactive_pause_repair=repair_internal_pause(
                    wav,int(model.sr),text,language_id,mode
                )
                if proactive_pause_repair.get("repaired"):
                    wav=compacted
                    print(
                        f"[DĀR Voice] Arabic phrase flow repair "
                        f"removed={proactive_pause_repair.get('pause_ms_removed',0)}ms "
                        f"text={str(text or '')[:72]}",
                        flush=True
                    )
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
            # Ein Sampling-Ausreißer darf bei einem kurzen, nicht weiter teilbaren
            # Fragment nicht sofort fatal sein. Mit neuem Seed erneut versuchen;
            # danach greift wie bisher die rekursive Chunk-Rettung.
            if attempt+1<attempts:
                continue
            break
        metrics=audio_quality_metrics(wav,int(model.sr),text,language_id,mode)
        if proactive_pause_repair.get("repaired"):
            metrics.update({
                "arabic_phrase_flow_repaired":True,
                "honorific_flow_repaired":bool(audio_lock_key_for_chunk(text) in HONORIFIC_KEYS),
                "pause_ms_removed":int(proactive_pause_repair.get("pause_ms_removed",0)),
                "target_pause_ms":int(proactive_pause_repair.get("target_pause_ms",0)),
            })

        pause_only={"unexpected_internal_hold","excessive_internal_pause","inline_arabic_internal_hold"}
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
        # Token-Limit ist wie ein Watchdog-Timeout ein harter Hinweis, dass genau
        # dieser Abschnitt kleiner werden muss. Auch kurze Sätze dürfen dann geteilt
        # werden; vorher blieb z. B. ein 40-60-Zeichen-Kids-Satz endgültig hängen.
        force_rescue=bool(last_issues.intersection({"generation_timeout","generation_token_limit"}))
        parts=split_rescue_chunks(text,force=force_rescue)
        if len(parts)>1:
            rescued=[]
            rescue_metrics=[]
            for part_idx,part in enumerate(parts):
                try:
                    # Rekursiv durch dieselbe QA gehen: Wenn auch ein Teilstück am
                    # Token-Limit landet, wird nur dieses Teilstück nochmals geteilt.
                    # Die Textmenge schrumpft bei jedem Schritt; Ein-Wort-Teile
                    # terminieren deterministisch und fallen dann ggf. ans Backend-Fallback.
                    sub,subm=render_segment_with_qa(
                        model,part,language_id,mode,False,
                        seed_base=seed_base+(attempts+part_idx+1)*seed_offset,
                        interactive_fast=interactive_fast
                    )
                except RuntimeError:
                    rescued=[]
                    break
                if subm.get("issues"):
                    rescued=[]
                    break
                subm=dict(subm)
                subm["recursive_rescue_part"]=True
                rescued.append((sub,language_id,part,mode,subm))
                rescue_metrics.append(subm)
            if rescued:
                joined=join_rendered_segments(rescued,int(model.sr))
                metrics=audio_quality_metrics(joined,int(model.sr),text,language_id,mode)
                # Längen-/Rate-Hinweise gelten nach erfolgreicher Teil-QA nicht mehr
                # für den wieder zusammengesetzten Satz. Technische Fehler und
                # unnatürliche Pausen bleiben weiterhin fatal.
                composite_ignored={"segment_too_long","speech_rate_too_slow"}
                remaining=[x for x in (metrics.get("issues") or []) if x not in composite_ignored]
                if not remaining:
                    metrics["issues"]=[]
                    metrics.update({
                        "attempt":attempts,
                        "critical":False,
                        "rescued":True,
                        "recursive_rescue":True,
                        "rescue_parts":len(parts),
                        "rescue_metrics":rescue_metrics,
                    })
                    print(f"[DĀR Voice] segment recursively rescued in {len(parts)} parts lang={language_id} mode={mode}",flush=True)
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

def install_arabic_reference(data_url:str,original_name:str=""):
    """Installiert eine explizit vom Besitzer ausgewählte arabische Master-Referenz.

    Die Datei wird lokal normalisiert und atomar als ~/SerhatVoice/Serhat_AR_MASTER.wav
    gespeichert. Sie wird niemals automatisch aus der deutschen Referenz erzeugt.
    """
    global REF_AR,ARABIC_DEDICATED_REFERENCE,MODEL_ACTIVE_REFERENCE
    value=str(data_url or "").strip()
    m=re.match(r"^data:(audio/[A-Za-z0-9.+-]+);base64,(.+)$",value,re.S)
    if not m:
        raise ValueError("Arabische Referenzdatei ist kein gültiges Audio.")
    mime=m.group(1).lower()
    allowed={
        "audio/wav":".wav","audio/x-wav":".wav","audio/wave":".wav","audio/vnd.wave":".wav",
        "audio/mp4":".m4a","audio/m4a":".m4a","audio/x-m4a":".m4a","audio/aac":".aac","audio/x-aac":".aac",
        "audio/mpeg":".mp3","audio/mp3":".mp3"
    }
    if mime not in allowed:
        raise ValueError("Audioformat nicht erlaubt. Verwende WAV, M4A/AAC oder MP3.")
    try:
        payload=base64.b64decode(m.group(2),validate=True)
    except Exception as e:
        raise ValueError("Arabische Referenzdatei ist beschädigt.") from e
    if len(payload)<1024:
        raise ValueError("Arabische Referenzdatei ist leer oder zu klein.")
    if len(payload)>32*1024*1024:
        raise ValueError("Arabische Referenzdatei ist größer als 32 MB.")

    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError("ffmpeg fehlt – arabische Master-Referenz kann nicht vorbereitet werden.")

    upload=OUTPUT/f"arabic_reference_upload_{uuid.uuid4().hex[:10]}{allowed[mime]}"
    tmp=VOICE_HOME/f".Serhat_AR_MASTER_{uuid.uuid4().hex[:10]}.wav"
    target=VOICE_HOME/"Serhat_AR_MASTER.wav"
    upload.write_bytes(payload)
    try:
        cmd=[
            ffmpeg,"-y","-v","error","-i",str(upload),
            "-vn","-ac","1","-ar","24000","-c:a","pcm_s16le",
            "-af","highpass=f=65,alimiter=limit=0.95",
            str(tmp)
        ]
        p=subprocess.run(cmd,capture_output=True,text=True)
        if p.returncode!=0 or not tmp.exists() or tmp.stat().st_size<=1024:
            detail=(p.stderr or "")[-1200:]
            raise RuntimeError("Arabische Referenz konnte nicht normalisiert werden. "+detail)

        import wave, numpy as np
        with wave.open(str(tmp),"rb") as wf:
            channels=int(wf.getnchannels())
            rate=int(wf.getframerate())
            frames=int(wf.getnframes())
            raw=wf.readframes(frames)
        duration=float(frames)/max(1,rate)
        if channels!=1 or rate!=24000:
            raise RuntimeError("Arabische Referenz hat nach der Normalisierung ein ungültiges Format.")
        if duration<6.0:
            raise ValueError("Arabische Master-Referenz ist zu kurz. Mindestens 6 Sekunden klare Sprache aufnehmen.")
        if duration>180.0:
            raise ValueError("Arabische Master-Referenz ist zu lang. Maximal 180 Sekunden verwenden.")
        samples=np.frombuffer(raw,dtype=np.int16).astype(np.float32)
        if samples.size<rate*4:
            raise ValueError("Arabische Master-Referenz enthält zu wenig verwertbares Audio.")
        amp=np.abs(samples)/32768.0
        peak=float(np.max(amp)) if amp.size else 0.0
        rms=float(np.sqrt(np.mean(np.square(samples/32768.0)))) if samples.size else 0.0
        clipped=float(np.mean(amp>=0.995)) if amp.size else 0.0
        if peak<0.04 or rms<0.008:
            raise ValueError("Arabische Master-Referenz ist zu leise oder enthält fast nur Stille.")
        if clipped>0.01:
            raise ValueError("Arabische Master-Referenz übersteuert zu stark. Aufnahme mit weniger Pegel wiederholen.")

        target.parent.mkdir(parents=True,exist_ok=True)
        os.replace(tmp,target)
        REF_AR=target
        ARABIC_DEDICATED_REFERENCE=bool(
            REF_AR.exists() and REF_DE.exists() and REF_AR.resolve()!=REF_DE.resolve()
        )
        MODEL_ACTIVE_REFERENCE=None
        set_status(
            message="Eigene arabische Master-Referenz installiert",
            last_error=""
        )
        return {
            "ok":True,
            "path":str(target),
            "name":str(original_name or target.name),
            "durationSeconds":round(duration,2),
            "sampleRate":rate,
            "channels":channels,
            "peak":round(peak,4),
            "rms":round(rms,4),
            "clippedRatio":round(clipped,6),
            "arabicReferenceDedicated":ARABIC_DEDICATED_REFERENCE
        }
    finally:
        try: upload.unlink(missing_ok=True)
        except Exception: pass
        try:
            if tmp.exists(): tmp.unlink(missing_ok=True)
        except Exception: pass

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

def postprocess(src:Path,fast:bool=False):
    ffmpeg=find_ffmpeg()
    if not ffmpeg:
        print("[DĀR Voice] ffmpeg nicht gefunden – liefere ungemasterte WAV aus.",flush=True)
        return src

    dst=src.with_name(src.stem+"_master.wav")
    # Interaktive Erzeugung spart den zweiten Loudness-Analysepass.
    filt=(
        "highpass=f=65,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,alimiter=limit=0.95"
        if fast else
        "highpass=f=65,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=7"
    )
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

def generate(text:str,prepared:str="",style:str="auto",free_mode:bool=False,free_pronunciation:bool=False,interactive_fast:bool=False,job_id:str="",preflight_checked:bool=False,preflight_found=None):
    # Produktionsmodus bleibt unverändert. Der Bereich "Freie Stimme" nutzt
    # dieselbe Serhat-Engine, aber ohne Kids-/Content-Pflichten und ohne neue Locks.
    strict_prophet_story=bool(
        free_mode and free_pronunciation and str(style or "")=="kids_story"
    )
    if not free_mode or strict_prophet_story:
        if not preflight_checked:
            quran_guard(text)
            if strict_prophet_story:
                strict=_prophet_strict_pronunciation_preflight(text)
                if not strict.get("ok"):
                    raise PronunciationReviewRequired(strict.get("items") or [])
            else:
                unresolved=detect_unresolved_islamic_terms(text)
                if unresolved:
                    terms=", ".join(str(x.get("term","")) for x in unresolved[:6])
                    raise ValueError(
                        "Ungeprüfte islamische Namen/Begriffe erkannt: "+terms+
                        ". Bitte zuerst in der Ausspracheanalyse prüfen oder im Lernzentrum bestätigen."
                    )
    if not REF_DE.exists():
        raise RuntimeError("Referenzstimme fehlt: "+str(REF_DE))

    if free_mode and not free_pronunciation:
        speak=text
        found=[]
    elif free_mode and free_pronunciation:
        phrase_text,phrase_found=apply_profile_fixed_phrases(text)
        learned_text,learned_found=apply_user_learned_overrides(phrase_text)
        speak,word_found=prepare(learned_text,interactive_fast=interactive_fast)
        found=phrase_found+learned_found+word_found
    else:
        if preflight_checked and str(prepared or "").strip():
            speak=str(prepared).strip()
            found=list(preflight_found or [])
        else:
            speak,found=prepare(text,interactive_fast=interactive_fast)

    doc_mode=resolve_prosody_mode(text,style)

    # Human-approved long-form reference: exact same source text is served
    # immediately from the persistent local corpus. No model load, no TTS and
    # no render lock are needed. Any actual edit automatically misses this hash
    # and continues through the existing segment-level incremental renderer.
    exact_reference=None if free_mode else story_reference_matches_text(text,doc_mode)
    if exact_reference:
        src=Path(str(exact_reference.get("audioPath") or "")).expanduser()
        out=OUTPUT/f"dar_voice_reference_{uuid.uuid4().hex[:10]}.wav"
        shutil.copy2(src,out)
        qa_summary={
            "mode":doc_mode,
            "reference_audio_exact_text":True,
            "reference_id":str(exact_reference.get("id") or ""),
            "reference_text_sha256":str(exact_reference.get("textSha256") or ""),
            "reference_audio_sha256":str(exact_reference.get("audioSha256") or ""),
            "durationSec":float(exact_reference.get("durationSec") or 0),
            "performance":{
                "render_seconds":0.0,
                "segments":0,
                "segment_cache_hits":0,
                "segment_cache_misses":0,
                "execution_strategy":"reference-audio-exact-text-fast-path",
                "backend":"reference-audio",
                "fast_reused_segments":1,
                "model_load_skipped":True,
            },
        }
        set_status(
            render_state="done",progress=100,
            render_started_at=time.time(),render_finished_at=time.time(),
            render_total_segments=0,render_completed_segments=0,
            render_active_segment=0,render_cached_segments=1,
            segment_elapsed_seconds=0,prosody_mode=doc_mode,
            message="Bestätigte Audio-Text-Referenz sofort wiederverwendet",
            last_output=str(out),last_qa=qa_summary,last_error=""
        )
        append_learning_log(
            "story_reference_exact_reuse",
            referenceId=str(exact_reference.get("id") or ""),
            textSha256=str(exact_reference.get("textSha256") or "")
        )
        return out

    if free_mode and free_pronunciation:
        if doc_mode=="kids_story":
            # Prophetengeschichten nutzen weiterhin die bestätigte
            # Aussprachebibliothek, aber den eigentlichen Story-Renderplan.
            # So bleiben Satzfluss/QA/Rescue identisch zum Produktionsmodus.
            synthesis_text,plan,flow_preflight=prepare_flow_text(
                text,speak,lambda value: build_render_plan(value,doc_mode)
            )
        else:
            synthesis_text,plan,flow_preflight=prepare_flow_text(
                text,speak,build_free_pronunciation_render_plan
            )
    elif free_mode:
        synthesis_text,plan,flow_preflight=prepare_flow_text(text,speak,build_free_render_plan)
    else:
        synthesis_text,plan,flow_preflight=prepare_flow_text(
            text,speak,lambda value: build_render_plan(value,doc_mode)
        )

    # 2.9.82 Interactive Fast Path: weniger Modellaufrufe, aber ein bewusst
    # kurzer Startblock für frühes hörbares Audio. Arabische LOCKED-Formen und
    # Sprachgrenzen bleiben unangetastet.
    if interactive_fast and len(plan)>1:
        # Kurzer erster TTFA-Block bleibt; danach große Satzgruppen für maximalen
        # Durchsatz statt hunderter sequentieller Modellaufrufe.
        fast_chars=390 if doc_mode=="kids_story" else 430
        fast_sentences=5 if doc_mode=="kids_story" else 6
        plan=_coalesce_kids_story_plan(
            plan,max_chars=fast_chars,max_sentences=fast_sentences
        )

        # 2.9.89 · First-Audio-Latency:
        # Der erste normale deutsche Renderblock wird bewusst kleiner gehalten,
        # damit iPhone/iPad/Mac deutlich früher etwas Hörbares bekommen. Nur der
        # erste Block wird geteilt; der Rest bleibt groß/coalesced für hohen
        # Gesamtdurchsatz. Audio-Locks und Arabisch werden niemals zerschnitten.
        first_audio_target=64
        for first_idx,(first_lang,first_chunk) in enumerate(plan[:3]):
            if first_lang!="de" or audio_lock_key_for_chunk(first_chunk):
                continue
            value=str(first_chunk or "").strip()
            if len(value)<=118:
                break
            cut=0
            sentence_cuts=[
                m.end() for m in re.finditer(r"(?<=[.!?…])\s+",value)
                if 44<=m.end()<=108
            ]
            if sentence_cuts:
                cut=min(sentence_cuts,key=lambda x:abs(x-first_audio_target))
            else:
                word_cuts=[
                    m.start() for m in re.finditer(r"\s+",value)
                    if 52<=m.start()<=100
                ]
                if word_cuts:
                    cut=min(word_cuts,key=lambda x:abs(x-first_audio_target))
            if cut:
                head=value[:cut].strip()
                tail=value[cut:].strip()
                if len(head)>=36 and len(tail)>=24:
                    plan=plan[:first_idx]+[(first_lang,head),(first_lang,tail)]+plan[first_idx+1:]
            break
        plan=prioritize_interactive_first_audio(
            plan,max_first_chars=68 if doc_mode=="kids_story" else 60
        )

    # 2.9.63: "free_mode" bedeutet NICHT automatisch Hintergrundarbeit.
    # Ein Klick des Nutzers auf Freistimme ist interaktiv und erhält dieselbe
    # Priorität wie "Erzeugen". Nur echte Batch-Threads laufen im Hintergrund.
    render_thread_name=threading.current_thread().name
    background_render=render_thread_name in ("dar-prophet-story-batch","dar-alphabet-batch","dar-kids-owner-voice-sync")
    manual_priority=not background_render
    if manual_priority:
        MANUAL_RENDER_WAITING.set()
        set_status(message="Interaktive Audio-Erzeugung erhält Vorrang …")
        acquired=RENDER_LOCK.acquire(timeout=75.0)
        MANUAL_RENDER_WAITING.clear()
        if not acquired:
            raise RuntimeError("Interaktive Audio-Erzeugung konnte den Render-Worker nicht rechtzeitig übernehmen.")
    else:
        # Batch-Läufe starten keinen neuen Render, solange ein Nutzer-Auftrag wartet.
        deadline=time.time()+300.0
        while (MANUAL_RENDER_WAITING.is_set() or LEARNING_PREVIEW_WAITING.is_set()) and time.time()<deadline:
            time.sleep(0.05)
        acquired=RENDER_LOCK.acquire(timeout=max(1.0,deadline-time.time()))
        if not acquired:
            raise RuntimeError("Hintergrund-Audio-Warteschlange ist ausgelastet.")

    if not free_mode:
        # Nur der Produktionsbereich verwaltet neue bestätigbare Audio-Locks.
        discard_pending_audio_locks()
    master_forms={
        str(r.get("tts_text",""))
        for r in found
        if r.get("tts_text") and (
            (not free_mode and r.get("voice_lock")=="MASTER")
            or (free_mode and free_pronunciation and r.get("audio_lock_key"))
        )
    }
    def lock_key_for(chunk):
        if not free_mode:
            return audio_lock_key_for_chunk(chunk)
        if not free_pronunciation:
            return ""
        # Im freien Bereich nur bereits bestätigte lokale Audio-Master benutzen.
        # Neue Locks werden hier niemals angelegt oder bestätigt.
        key=audio_lock_key_for_chunk(chunk)
        if not key:
            return ""
        path=audio_lock_path(key)
        return key if path.exists() and path.stat().st_size>44 else ""

    set_status(
        render_state="rendering",
        progress=1,
        render_started_at=time.time(),
        render_finished_at=None,
        last_error="",
        prosody_mode=doc_mode,
        last_qa={},
        render_preview_name="",
        render_preview_ready=False,
        render_preview_segments=0,
        render_preview_duration_seconds=0.0,
        render_preview_generation=0,
        render_preview_complete=False,
        render_preview_chunks=[],
        render_preview_chunk_count=0,
        render_preview_mode="incremental-chunks-v1" if interactive_fast and len(plan)>1 else "",
        render_first_audio_priority=bool(interactive_fast and len(plan)>1),
        render_first_audio_ms=0,
        render_first_audio_target_chars=(68 if doc_mode=="kids_story" else 60) if interactive_fast and len(plan)>1 else 0,
        render_job_id=str(job_id or ""),
        render_total_segments=0,
        render_completed_segments=0,
        render_active_segment=0,
        render_cached_segments=0,
        segment_elapsed_seconds=0,
        message=f"Satzfluss geprüft · {flow_preflight['sentences']} Sätze · Audio wird vorbereitet …"
    )

    try:
        # Fast path: bekannte, bereits verifizierte Sätze und bestätigte
        # Aussprache-Audios werden vor dem schweren Modellstart gesucht.
        model=None
        render_sr=24000
        preloaded={}
        # Interaktiv zählt "time to first audio" stärker als ein vollständiger
        # Vorab-Scan der gesamten 5–8-Minuten-Produktion. Die ersten vier
        # Abschnitte werden vorgeprüft; alle weiteren Cache-/Lock-Treffer werden
        # ohnehin direkt beim jeweiligen Segment on-demand erkannt.
        preload_scan=plan[:min(len(plan),2)] if interactive_fast else plan
        for pre_idx,(pre_lang,pre_chunk) in enumerate(preload_scan):
            pre_mode=resolve_segment_prosody(pre_chunk,doc_mode,style)
            pre_lock=lock_key_for(pre_chunk)
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
                pre_bridge="" if interactive_fast else contextual_bridge_direction(plan,pre_idx)
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
        set_status(
            render_total_segments=total,
            render_completed_segments=0,
            render_active_segment=0,
            render_cached_segments=len(preloaded),
            segment_elapsed_seconds=0
        )
        if free_mode:
            set_status(
                progress=6,
                message=f"Freie Stimme · {total} kurze Sprachabschnitte vorbereitet"
            )
        render_id=uuid.uuid4().hex[:12]
        if interactive_fast:
            threading.Thread(
                target=cleanup_progressive_previews,
                daemon=True,
                name="dar-live-preview-cleanup"
            ).start()
        else:
            cleanup_progressive_previews()
        progressive_preview_path=None
        progressive_preview_seconds=0.0
        progressive_preview_generation=0
        progressive_preview_chunks=[]
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
            # Hintergrundproduktion gibt den Worker spätestens an der nächsten
            # sicheren Segmentgrenze frei, sobald der Nutzer Freistimme/Erzeugen
            # angefordert hat. Der Batch behält seinen Checkpoint und kann später
            # exakt dort weiterarbeiten.
            if background_render and (MANUAL_RENDER_WAITING.is_set() or LEARNING_PREVIEW_WAITING.is_set()):
                raise RuntimeError("Hintergrund-Render pausiert für interaktive Audio-Erzeugung oder Aussprache-Schnelltest.")
            if strict_prophet_story and LEARNING_PREVIEW_WAITING.is_set():
                set_status(message="Aussprache-Schnelltest hat Vorrang · Story wartet zwischen zwei sicheren Segmenten …")
                preview_deadline=time.time()+75.0
                while LEARNING_PREVIEW_WAITING.is_set() and time.time()<preview_deadline:
                    time.sleep(0.05)
            restore_primary_after_segment=False
            lang,chunk=plan[original_idx]
            idx=original_idx+1
            pct=8+int(((processed_pos-1)/max(1,total))*78)
            lang_label="Arabisch" if lang=="ar" else "Deutsch"
            mode=resolve_segment_prosody(chunk,doc_mode,style)
            bridge_direction="" if interactive_fast else contextual_bridge_direction(plan,original_idx)
            audio_lock_key=lock_key_for(chunk)
            critical=bool(audio_lock_key) or (lang=="ar" and any(x and x in chunk for x in master_forms))
            set_status(
                progress=pct,
                render_active_segment=idx,
                render_completed_segments=processed_pos-1,
                segment_elapsed_seconds=0,
                message=(
                    f"Freie Stimme · {lang_label} · Abschnitt {idx}/{total} …"
                    if free_mode else
                    f"{lang_label} · {mode} · Abschnitt {idx}/{total} …"
                )
            )
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
                                model,chunk,lang,mode,critical,seed_base=core_seed,
                                interactive_fast=interactive_fast
                            )
                        metrics["render_seconds"]=round(time.perf_counter()-segment_started,3)
                    except Exception as first_error:
                        mlx_recovered=False
                        if getattr(model,"_dar_backend","torch")=="mlx":
                            # Ein einzelner MLX-Ausreißer darf niemals den ganzen Langtext
                            # dauerhaft auf das langsamere MPS-Backend ziehen. MLX einmal
                            # frisch starten und nur denselben Abschnitt erneut versuchen.
                            print("[DĀR Voice] MLX segment rescue: restart + retry:",first_error,flush=True)
                            set_status(
                                progress=pct,
                                message=f"{lang_label} · Watchdog · MLX wird neu gestartet, Abschnitt {idx}/{total} bleibt erhalten …"
                            )
                            try:
                                _stop_mlx_process("segment recovery before MLX retry")
                                retry_model=MLXModelAdapter(_start_mlx_process())
                                segment_started=time.perf_counter()
                                if bridge_direction and lang=="de" and not audio_lock_key:
                                    wav,metrics=render_context_bridge(
                                        retry_model,chunk,mode,bridge_direction,seed_base=core_seed+313
                                    )
                                else:
                                    wav,metrics=render_segment_with_qa(
                                        retry_model,chunk,lang,mode,critical,seed_base=core_seed+313,
                                        interactive_fast=interactive_fast
                                    )
                                metrics["render_seconds"]=round(time.perf_counter()-segment_started,3)
                                metrics["mlx_worker_restart"]=True
                                model=retry_model
                                mlx_recovered=True
                                set_status(
                                    progress=pct,
                                    message=f"{lang_label} · MLX-Rescue erfolgreich · Abschnitt {idx}/{total} …"
                                )
                            except Exception as retry_error:
                                print("[DĀR Voice] MLX watchdog rescue failed:",retry_error,flush=True)
                                first_error=retry_error

                        if not mlx_recovered:
                            if getattr(model,"_dar_backend","torch")=="mlx":
                                # Letzte kontrollierte Rückfallebene: Der betroffene
                                # Abschnitt wird auf MPS erzeugt, statt den gesamten
                                # Auftrag nach einem MLX-Problem zu verwerfen.
                                print("[DĀR Voice] MLX segment failed, retry PyTorch/MPS:",first_error,flush=True)
                                set_status(
                                    progress=pct,
                                    message=f"{lang_label} · MLX-Rescue erschöpft · PyTorch/MPS für Abschnitt {idx}/{total} …"
                                )
                                _stop_mlx_process("fallback after MLX segment failure")
                                model=load_model()
                                segment_started=time.perf_counter()
                                if bridge_direction and lang=="de" and not audio_lock_key:
                                    wav,metrics=render_context_bridge(
                                        model,chunk,mode,bridge_direction,seed_base=core_seed
                                    )
                                else:
                                    wav,metrics=render_segment_with_qa(
                                        model,chunk,lang,mode,critical,seed_base=core_seed,
                                        interactive_fast=interactive_fast
                                    )
                                metrics["render_seconds"]=round(time.perf_counter()-segment_started,3)
                                metrics["mlx_fallback_after_error"]=type(first_error).__name__
                                # Dieser Fallback gilt nur für den aktuellen Abschnitt.
                                # Beim nächsten noch nicht gecachten Abschnitt wird MLX
                                # automatisch wieder als Primärengine versucht.
                                restore_primary_after_segment=True
                            elif MODEL_DEVICE=="mps":
                                print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                                set_status(
                                    progress=pct,
                                    message=f"{lang_label} · MPS-Fallback auf CPU · Abschnitt {idx}/{total} …"
                                )
                                model=load_model(force_device="cpu")
                                if bridge_direction and lang=="de" and not audio_lock_key:
                                    wav,metrics=render_context_bridge(
                                        model,chunk,mode,bridge_direction,seed_base=core_seed
                                    )
                                else:
                                    wav,metrics=render_segment_with_qa(
                                        model,chunk,lang,mode,critical,seed_base=core_seed,
                                        interactive_fast=interactive_fast
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

            # 2.9.83 · echtes inkrementelles Preview-Queueing:
            # Jeder bereits technisch geprüfte Abschnitt wird genau einmal als
            # kleine WAV-Datei bereitgestellt. Dadurch entfällt das frühere
            # wiederholte Neu-Zusammenfügen des gesamten Prefixes (O(n²)-I/O bei
            # langen Geschichten). iPhone/iPad und Mac können die fertigen
            # Abschnitte nacheinander abspielen, während die Rest-Synthese läuft.
            if interactive_fast and total>1:
                try:
                    preview_wav=wav.detach().float().cpu()
                    candidate=OUTPUT/f"dar_voice_live_{render_id}_chunk_{processed_pos}.wav"
                    save_wav(candidate,preview_wav,int(render_sr))
                    if candidate.exists() and candidate.stat().st_size>44:
                        duration_seconds=round(
                            float(preview_wav.shape[-1])/max(1,int(render_sr)),3
                        )
                        progressive_preview_chunks.append({
                            "sequence":processed_pos,
                            "name":candidate.name,
                            "durationSeconds":duration_seconds,
                            "language":lang,
                        })
                        progressive_preview_seconds+=float(duration_seconds)
                        progressive_preview_generation+=1
                        first_audio_ms=0
                        if progressive_preview_generation==1:
                            first_audio_ms=int(round((time.perf_counter()-render_started_perf)*1000))
                        # Rückwärtskompatibel bleibt render_preview_name auf dem
                        # allerersten Chunk stehen. Neue 2.9.83-UIs benutzen die
                        # komplette render_preview_chunks-Liste und wechseln nicht
                        # mehr ständig auf größer werdende Dateien.
                        if progressive_preview_path is None:
                            progressive_preview_path=candidate
                        set_status(
                            render_preview_name=progressive_preview_path.name,
                            render_preview_ready=True,
                            render_preview_segments=processed_pos,
                            render_preview_duration_seconds=round(progressive_preview_seconds,2),
                            render_preview_generation=1,
                            render_preview_chunks=list(progressive_preview_chunks),
                            render_preview_chunk_count=len(progressive_preview_chunks),
                            render_preview_mode="incremental-chunks-v1",
                            render_first_audio_ms=(
                                first_audio_ms if first_audio_ms
                                else int(get_status().get("render_first_audio_ms",0) or 0)
                            ),
                            message=(
                                f"Sofort-Audio bereit · {processed_pos}/{total} "
                                "Abschnitte · Rest wird weiter erzeugt …"
                            )
                        )
                except Exception as preview_error:
                    print("[DĀR Voice] incremental progressive preview warning:",preview_error,flush=True)

            completed_pct=8+int((processed_pos/max(1,total))*78)
            set_status(
                progress=completed_pct,
                render_completed_segments=processed_pos,
                segment_elapsed_seconds=0,
                message=f"{lang_label} · {mode} · Abschnitt {idx}/{total} fertig"
            )
            if restore_primary_after_segment and MLX_ENABLED:
                # Den langsamen MPS-Fallback nicht für alle folgenden Abschnitte
                # behalten. Bereits erzeugtes Audio bleibt gespeichert; nur das
                # Modell wird für den nächsten echten Render wieder auf MLX gesetzt.
                model=None
                set_status(
                    message=f"Abschnitt {idx}/{total} gesichert · nächster Abschnitt wieder mit MLX/Metal"
                )

        outputs=[x for x in outputs if x is not None]
        qa_segments=[x for x in qa_segments if x is not None]
        sr=int(render_sr)
        full=join_rendered_segments(outputs,sr)
        continuity_metrics=dict(getattr(join_rendered_segments,"_last_continuity",{}) or {})

        final_limits=QA_CONFIG.get("finalMaxInternalSilenceMsByMode") or {}
        final_pause_limit=int(final_limits.get(doc_mode,QA_CONFIG.get("finalMaxInternalSilenceMs",620)))
        final_metrics=audio_quality_metrics(full,sr,synthesis_text,"de",doc_mode)

        # Content-Studio/Kids: Wenn alle Einzelabschnitte sauber waren,
        # darf eine einzige moderate Restpause im fertigen Join weder eine
        # Kids-Geschichte noch einen Kids-Lernclip komplett verwerfen. Der
        # Grenzwert bleibt streng: Nur die tatsächlich erkannte stille Insel
        # wird einmal komprimiert und danach wird das vollständige Audio erneut
        # gemessen. Technische QA und Segment-QA bleiben unverändert.
        kids_final_repair={}
        measured_before=int(final_metrics.get("max_internal_silence_ms",0) or 0)
        kids_final_repair_modes={"kids_story","kids_lesson"}
        kids_repair_limits=QA_CONFIG.get("kidsFinalAutoRepairMaxMsByMode") or {}
        kids_final_repair_max=int(
            kids_repair_limits.get(
                doc_mode,
                QA_CONFIG.get("kidsLessonFinalAutoRepairMaxMs",950)
            )
        )
        if (
            not free_mode
            and doc_mode in kids_final_repair_modes
            and measured_before>final_pause_limit
            and measured_before<=kids_final_repair_max
        ):
            repaired,kids_final_repair=repair_internal_pause(
                full,sr,synthesis_text,"de",doc_mode
            )
            if kids_final_repair.get("repaired"):
                full=repaired
                final_metrics=audio_quality_metrics(full,sr,synthesis_text,"de",doc_mode)
                final_metrics.update({
                    "kids_final_pause_repaired":True,
                    "kids_final_pause_mode":doc_mode,
                    "kids_final_pause_before_ms":measured_before,
                    "kids_final_pause_removed_ms":int(kids_final_repair.get("pause_ms_removed",0)),
                    "kids_final_pause_target_ms":int(kids_final_repair.get("target_pause_ms",0)),
                })
                if doc_mode=="kids_lesson":
                    final_metrics.update({
                        "kids_lesson_final_pause_repaired":True,
                        "kids_lesson_final_pause_before_ms":measured_before,
                        "kids_lesson_final_pause_removed_ms":int(kids_final_repair.get("pause_ms_removed",0)),
                        "kids_lesson_final_pause_target_ms":int(kids_final_repair.get("target_pause_ms",0)),
                    })

        fatal=[x for x in final_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]

        # "Freie Stimme" kann beliebige vollständige Sätze mit Punkt, Ausrufezeichen
        # und bewussten Satzpausen enthalten. Der globale Endtest sieht nur die
        # längste stille Insel und kann nicht erkennen, ob sie grammatisch gewollt
        # ist. Deshalb bleibt die strenge Segment-QA unverändert, während nur der
        # globale End-Grenzwert im freien Bereich großzügiger ist.
        if free_mode:
            final_pause_limit=max(
                final_pause_limit,
                int(QA_CONFIG.get("freeVoiceFinalMaxInternalSilenceMs",1200))
            )
            final_metrics["free_voice_final_pause_policy"]=True

        final_metrics["final_internal_silence_limit_ms"]=final_pause_limit
        measured_final_pause=int(final_metrics.get("max_internal_silence_ms",0) or 0)
        if measured_final_pause>final_pause_limit:
            fatal.append("unnatural_final_internal_pause")
        if fatal:
            raise RuntimeError(
                "Finale Audio-QA fehlgeschlagen: "
                +", ".join(dict.fromkeys(fatal))
                +f" · interne Stille {measured_final_pause} ms"
            )

        staged_audio_locks=(
            [] if free_mode
            else stage_pending_audio_locks(render_id,new_audio_lock_candidates,sr)
        )

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
            "free_voice_mode":bool(free_mode),
            "free_voice_pronunciation_library":bool(free_pronunciation),
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
                "kids_story_fast_cfg":bool(doc_mode=="kids_story"),
                "kids_story_mlx_token_cap":300 if doc_mode=="kids_story" else None,
            },
        }
        set_status(last_qa=qa_summary)

        set_status(progress=90,message="WAV wird gespeichert …")
        raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
        save_wav(raw,full,sr)
        if not raw.exists() or raw.stat().st_size<=44:
            raise RuntimeError("WAV-Datei wurde nicht korrekt geschrieben.")

        set_status(progress=95,message="Audio-Mastering läuft …")
        out=postprocess(raw,fast=interactive_fast)
        if interactive_fast:
            threading.Thread(
                target=cleanup_render_cache,
                daemon=True,
                name="dar-render-cache-cleanup"
            ).start()
        else:
            cleanup_render_cache()
        set_status(
            render_state="done",
            progress=100,
            render_active_segment=0,
            render_completed_segments=total,
            segment_elapsed_seconds=0,
            message=f"Audio fertig · {doc_mode}",
            last_output=str(out),
            render_finished_at=time.time(),
            render_preview_complete=True,
            render_preview_chunk_count=len(progressive_preview_chunks),
            render_preview_mode="incremental-chunks-v1" if progressive_preview_chunks else "",
            last_error=""
        )
        return out
    except Exception as e:
        detail=f"{type(e).__name__}: {e}"
        set_status(
            render_state="error",
            progress=0,
            render_active_segment=0,
            segment_elapsed_seconds=0,
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


class PronunciationReviewRequired(RuntimeError):
    def __init__(self,items):
        self.items=list(items or [])
        labels=[str(x.get("term") or x.get("tts") or "").strip() for x in self.items]
        labels=[x for x in labels if x]
        super().__init__("Ausspracheprüfung erforderlich: "+", ".join(labels[:8]))

def _prophet_review_load():
    data=load_json_file(PROPHET_STORY_REVIEW_FILE,{"schemaVersion":1,"items":[]})
    if not isinstance(data,dict):
        data={"schemaVersion":1,"items":[]}
    if not isinstance(data.get("items"),list):
        data["items"]=[]
    return data

def _prophet_review_save(data):
    payload=dict(data or {})
    payload["schemaVersion"]=1
    payload["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    atomic_write_json(PROPHET_STORY_REVIEW_FILE,payload)
    return payload

def _prophet_review_upsert(item_id,name,ages,text,items):
    data=_prophet_review_load()
    text_hash=hashlib.sha256(str(text or "").encode("utf-8")).hexdigest()
    entry={
        "itemId":str(item_id or ""),
        "name":str(name or item_id or ""),
        "ages":list(ages or []),
        "textSha256":text_hash,
        "status":"pending",
        "issues":list(items or []),
        "updatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    rows=[
        x for x in data.get("items",[])
        if not (
            str((x or {}).get("itemId") or "")==entry["itemId"]
            and str((x or {}).get("textSha256") or "")==text_hash
        )
    ]
    rows.append(entry)
    data["items"]=rows
    _prophet_review_save(data)
    return entry

def _prophet_review_clear(item_id,text):
    data=_prophet_review_load()
    text_hash=hashlib.sha256(str(text or "").encode("utf-8")).hexdigest()
    rows=[
        x for x in data.get("items",[])
        if not (
            str((x or {}).get("itemId") or "")==str(item_id or "")
            and str((x or {}).get("textSha256") or "")==text_hash
        )
    ]
    data["items"]=rows
    _prophet_review_save(data)

def _prophet_review_refresh():
    data=_prophet_review_load()
    rows=list(data.get("items") or [])
    if not rows:
        return data
    try:
        manifest=_prophet_story_manifest()
        by_id={str(x.get("id") or ""):x for x in (manifest.get("items") or [])}
    except Exception:
        return data
    refreshed=[]
    for row in rows:
        item_id=str((row or {}).get("itemId") or "")
        item=by_id.get(item_id)
        if not item:
            continue
        ages=tuple((row or {}).get("ages") or ("4-5","6-8","9-10"))
        text=""
        for age in ages:
            candidate=_prophet_story_age_text(item,str(age))
            if candidate:
                text=candidate
                break
        if not text:
            continue
        strict=_prophet_strict_pronunciation_preflight(text)
        if strict.get("ok"):
            continue
        updated=dict(row or {})
        updated["issues"]=list(strict.get("items") or [])
        updated["status"]="pending"
        updated["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        refreshed.append(updated)
    data["items"]=refreshed
    return _prophet_review_save(data)


def _prophet_strict_pronunciation_preflight(text):
    value=str(text or "").strip()
    if not value:
        return {"ok":False,"items":[{"term":"","reason":"empty-text"}]}
    prepared,found=prepare(value)
    confirmed=set(confirmed_audio_lock_keys())
    issues=[]
    seen=set()

    def add(term,reason,tts="",lock_key="",suggestions=None):
        key=(normalize_lookup(term or tts),reason,str(lock_key or ""))
        if not key[0] or key in seen:
            return
        seen.add(key)
        issues.append({
            "term":str(term or "").strip(),
            "tts":str(tts or "").strip(),
            "reason":str(reason or ""),
            "audioLockKey":str(lock_key or ""),
            "suggestions":list(suggestions or []),
        })

    # Unbekannte islamische Formen dürfen in Prophetenproduktionen nie geraten werden.
    for row in detect_unresolved_islamic_terms(value,25):
        add(
            row.get("term",""),
            "unknown-islamic-term",
            suggestions=row.get("suggestions") or []
        )

    # REVIEW-Regeln sind noch keine endgültig vom Nutzer bestätigten LOCKED-Formen.
    for r in found:
        canonical=str(r.get("canonical") or r.get("string_to_replace") or "").strip()
        tts=str(r.get("tts_text") or "").strip()
        lock_key=str(r.get("audio_lock_key") or "").strip()
        voice_lock=str(r.get("voice_lock") or "").strip().upper()
        if voice_lock=="REVIEW":
            if not lock_key or lock_key not in confirmed:
                add(canonical or tts,"review-term-not-locked",tts,lock_key)

    # Jeder tatsächlich arabisch gerenderte Block muss in diesem strengen
    # Produktionsmodus aus einer bestätigten lokalen Audioform kommen.
    for lang,chunk in build_render_plan(prepared,"kids_story"):
        if lang!="ar":
            continue
        clean=str(chunk or "").strip().strip(AUDIO_LOCK_EDGE_CHARS)
        if not clean:
            continue
        lock_key=audio_lock_key_for_chunk(clean)
        if not lock_key or lock_key not in confirmed:
            add(clean,"arabic-audio-lock-required",clean,lock_key)

    return {
        "ok":not issues,
        "prepared":prepared,
        "items":issues,
        "counts":{
            "issues":len(issues),
            "confirmedAudioLocks":len(confirmed),
            "learnedRules":int((LIB.get("counts") or {}).get("userLearnedRules",0) or 0),
            "masterEntries":len(MASTER_ENTRIES),
        }
    }

def _prophet_batch_snapshot():
    with PROPHET_STORY_BATCH_STATE_LOCK:
        return dict(PROPHET_STORY_BATCH_STATE)

def _set_prophet_batch_state(**patch):
    with PROPHET_STORY_BATCH_STATE_LOCK:
        PROPHET_STORY_BATCH_STATE.update(patch)
        return dict(PROPHET_STORY_BATCH_STATE)

def _prophet_checkpoint_load():
    data=load_json_file(PROPHET_STORY_CHECKPOINT,{})
    return data if isinstance(data,dict) else {}

def _prophet_checkpoint_save(data):
    payload=dict(data or {})
    payload["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    atomic_write_json(PROPHET_STORY_CHECKPOINT,payload)
    return payload

def _prophet_jobs_signature(grouped):
    rows=[]
    for item,group_ages,txt in grouped:
        rows.append({
            "id":str(item.get("id") or ""),
            "ages":list(group_ages),
            "textSha256":hashlib.sha256(str(txt).encode("utf-8")).hexdigest(),
        })
    raw=json.dumps(rows,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def _prophet_job_key(item,group_ages,txt):
    raw="\u241f".join([
        str(item.get("id") or ""),
        ",".join(group_ages),
        hashlib.sha256(str(txt).encode("utf-8")).hexdigest(),
    ]).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:24]

def _start_prophet_caffeinate():
    global PROPHET_STORY_CAFFEINATE
    with PROPHET_STORY_CAFFEINATE_LOCK:
        if PROPHET_STORY_CAFFEINATE is not None and PROPHET_STORY_CAFFEINATE.poll() is None:
            return
        caffeinate="/usr/bin/caffeinate"
        if not Path(caffeinate).exists():
            PROPHET_STORY_CAFFEINATE=None
            return
        try:
            # -w bindet den Wachhalter an diese Engine; ein Crash hinterlässt
            # deshalb niemals einen ewigen caffeinate-Prozess.
            PROPHET_STORY_CAFFEINATE=subprocess.Popen(
                [caffeinate,"-i","-m","-w",str(os.getpid())],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
            )
        except Exception as e:
            PROPHET_STORY_CAFFEINATE=None
            print("[DĀR Voice] caffeinate warning",e,flush=True)

def _stop_prophet_caffeinate():
    global PROPHET_STORY_CAFFEINATE
    with PROPHET_STORY_CAFFEINATE_LOCK:
        p=PROPHET_STORY_CAFFEINATE
        PROPHET_STORY_CAFFEINATE=None
    if p is not None and p.poll() is None:
        try: p.terminate()
        except Exception: pass

def _resume_prophet_story_voice_pack_if_needed():
    cp=_prophet_checkpoint_load()
    if not cp.get("active"):
        return
    if cp.get("phase") in ("complete","cancelled"):
        return

    # 2.9.63 Regression-Fix:
    # Ein alter/unvollständiger Prophetengeschichten-Checkpoint darf beim normalen
    # Studio-Start NICHT mehr ungefragt die einzige Synthese-Engine belegen.
    # Der Fortschritt bleibt vollständig erhalten und kann über den sichtbaren
    # Batch-Start fortgesetzt werden. Auto-Resume ist nur noch explizit opt-in.
    if os.environ.get("DAR_VOICE_AUTO_RESUME_PROPHETS","0").strip()!="1":
        print(
            "[DĀR Voice] Prophetengeschichten-Checkpoint vorhanden; "
            "Auto-Resume pausiert, damit Worttest/Freistimme/Erzeugen sofort frei bleiben.",
            flush=True
        )
        return

    time.sleep(2.0)
    state=_prophet_batch_snapshot()
    if not state.get("running"):
        print("[DĀR Voice] resume persistent prophet-story production (explicit opt-in)",flush=True)
        start_prophet_story_voice_pack(resume=True)

def _prophet_audio_asset_path(item_id:str,age:str):
    item_id=str(item_id or "").strip()
    age=str(age or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]+",item_id):
        return None
    if age not in ("4-5","6-8","9-10"):
        return None
    rel=Path("kids/assets/prophet-story-audio")/item_id/(age+".m4a")
    for root in (PROPHET_STORY_WORK,PROPHET_STORY_READY):
        p=root/rel
        if p.exists() and p.is_file() and p.stat().st_size>1024:
            return p
    try:
        repo_path=ALPHABET_PUBLISH_REPO/rel
        if repo_path.exists() and repo_path.is_file() and repo_path.stat().st_size>1024:
            return repo_path
    except Exception:
        pass
    return None

def _prophet_completed_audio_snapshot():
    cp=_prophet_checkpoint_load()
    completed_jobs=dict(cp.get("completedJobs") or {})
    items={}
    for meta in completed_jobs.values():
        if not isinstance(meta,dict):
            continue
        item_id=str(meta.get("itemId") or "").strip()
        if not item_id:
            continue
        entry=items.setdefault(item_id,{
            "id":item_id,
            "name":str(meta.get("name") or item_id),
            "ages":{},
            "durationSec":float(meta.get("durationSec") or 0),
            "finishedAt":str(meta.get("finishedAt") or ""),
        })
        for age in tuple(meta.get("ages") or ()):
            p=_prophet_audio_asset_path(item_id,str(age))
            if p is None:
                continue
            entry["ages"][str(age)]={
                "available":True,
                "bytes":int(p.stat().st_size),
                "url":f"/prophet-stories/audio?id={item_id}&age={age}",
            }
    ready_items=[x for x in items.values() if x.get("ages")]
    ready_items.sort(key=lambda x:x.get("finishedAt") or "")
    return {
        "ok":True,
        "items":ready_items,
        "completed":len(ready_items),
        "total":int(cp.get("total") or 25),
        "active":bool(cp.get("active")),
        "phase":str(cp.get("phase") or "idle"),
        "updatedAt":str(cp.get("updatedAt") or ""),
    }

def _prophet_story_manifest():
    return load_kids_repo_json(
        "prophet-stories.json",
        "kids/data/prophet-stories.json",
        lambda d:(
            isinstance(d,dict)
            and int(d.get("version") or 0)>=4
            and len(d.get("items") or [])==25
            and all(
                str((item or {}).get("voiceScript") or "").strip()
                and isinstance((item or {}).get("scripts"),dict)
                and all(str(((item or {}).get("scripts") or {}).get(age) or "").strip() for age in ("4-5","6-8","9-10"))
                for item in (d.get("items") or [])
            )
        ),
    )

def _mubashshirun_story_manifest():
    return load_kids_repo_json(
        "mubashshirun-stories.json",
        "kids/data/mubashshirun-stories.json",
        lambda d:(
            isinstance(d,dict)
            and int(d.get("version") or 0)>=3
            and len(d.get("items") or [])==10
            and all(
                isinstance((item or {}).get("scripts"),dict)
                and all(
                    str(((item or {}).get("scripts") or {}).get(age) or "").strip()
                    for age in ("4-5","6-8","9-10")
                )
                for item in (d.get("items") or [])
            )
        ),
    )

def _prophet_story_age_text(item,age):
    scripts=item.get("scripts") if isinstance(item.get("scripts"),dict) else {}
    prepared=str(scripts.get(age) or item.get("voiceScript") or scripts.get("6-8") or "").strip()
    if prepared:
        return prepared
    name=str(item.get("name") or "")
    if age=="4-5":
        intro=f"Komm, wir hören aufmerksam zu. Jetzt geht es um {name}. Diese Geschichte stammt aus geprüften Qurʾān-Belegen. Wir erzählen sie ruhig und einfach und fügen keine erfundenen Abenteuer hinzu."
    elif age=="9-10":
        intro=f"Bevor wir beginnen, merk dir einen wichtigen Grundsatz: Diese Erzählung über {name} folgt den geprüften Qurʾān-Belegen des DĀR-AL-TAWḤĪD-Prophetenprofils. Wir unterscheiden bewusst zwischen sicherem Wissen und späteren Ausschmückungen. Achte beim Zuhören darauf, welche Entscheidungen, Prüfungen und Lehren der Qurʾān selbst hervorhebt."
    else:
        intro=f"Mach es dir bequem und hör aufmerksam zu. Heute geht es um {name}. Die Geschichte ist aus geprüften Qurʾān-Belegen zusammengefasst. Wir bleiben bei dem, was zuverlässig berichtet ist, und machen aus unbekannten Einzelheiten keine erfundenen Abenteuer. Achte besonders darauf, was diese Geschichte über Tawḥīd, Vertrauen, Geduld und Gehorsam gegenüber Allah lehrt."
    ch=list(item.get("chapters") or [])
    if age=="4-5" and len(ch)>4:
        ch=[ch[0],ch[1],ch[max(2,len(ch)-2)],ch[-1]]
    parts=[intro,*ch]
    if age=="9-10" and str(item.get("older") or "").strip():
        parts.append(str(item.get("older")).strip())
    if item.get("disputed"):
        outro="Am Ende ist hier besonders wichtig: Dhū l-Kifl wird im Qurʾān lobend genannt. Sein genauer Prophetenstatus wurde von Gelehrten unterschiedlich beurteilt. Darum behaupten wir nicht mehr, als die Quellen sicher tragen. Genau so lernen wir, Wissen ehrlich und sorgfältig weiterzugeben."
    elif age=="4-5":
        outro="Jetzt denk noch einmal an den wichtigsten Punkt der Geschichte. Allah kennt Seine Diener, hilft, prüft und führt. Wir lernen aus den Propheten, Allah zu gehorchen, Ihm zu vertrauen und nach einem Fehler wieder zu Ihm zurückzukehren. Gleich kommt eine kleine Frage für dich."
    elif age=="9-10":
        outro="Fass die Geschichte noch einmal im Kopf zusammen: Was war der Auftrag dieses Propheten? Welche Prüfung kam vor? Wie zeigte sich Gehorsam gegenüber Allah? Genau diese Fragen helfen, Qurʾān-Geschichten nicht nur zu hören, sondern ihre Botschaft zu verstehen. Die verwendeten Qurʾān-Stellen findest du direkt unter der Erzählung."
    else:
        outro="Bevor du zur Frage weitergehst, denk noch einmal an die wichtigsten Punkte. Die Propheten riefen zu Allah, hielten in Prüfungen an der Wahrheit fest und vertrauten auf Seine Führung. Die Geschichte soll nicht nur spannend sein, sondern dir helfen, die Botschaft des Qurʾān zu verstehen. Die genauen Qurʾān-Stellen stehen direkt unter der Erzählung."
    parts.append(outro)
    return "\n".join(str(x).strip() for x in parts if str(x).strip())

def _publish_prophet_story_pack(ready:Path):
    repo=ALPHABET_PUBLISH_REPO
    git=shutil.which("git")
    if not git:
        return False,"git fehlt."
    def rr(args,timeout=180):
        return run(args,timeout)
    try:
        gh=shutil.which("gh")
        if gh:
            auth=rr([gh,"auth","status"],30)
            if auth.returncode==0:
                rr([gh,"auth","setup-git"],30)
        if not (repo/".git").exists():
            if repo.exists(): shutil.rmtree(repo)
            p=rr([git,"clone","https://github.com/Sero91ak/dar-al-tawhid-site.git",str(repo)],300)
            if p.returncode!=0:
                return False,"Git clone fehlgeschlagen: "+(p.stderr or p.stdout)[-500:]
        rr([git,"-C",str(repo),"fetch","origin","main"],180)
        rr([git,"-C",str(repo),"checkout","main"],60)
        rr([git,"-C",str(repo),"reset","--hard","origin/main"],60)
        src_data=ready/"kids/data/prophet-stories.json"
        dst_data=repo/"kids/data/prophet-stories.json"
        dst_data.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src_data,dst_data)
        src_audio=ready/"kids/assets/prophet-story-audio"
        dst_audio=repo/"kids/assets/prophet-story-audio"
        if dst_audio.exists(): shutil.rmtree(dst_audio)
        shutil.copytree(src_audio,dst_audio)
        p=rr([git,"-C",str(repo),"add","kids/data/prophet-stories.json","kids/assets/prophet-story-audio"],60)
        if p.returncode!=0:
            return False,"Git staging fehlgeschlagen: "+(p.stderr or p.stdout)[-500:]
        if rr([git,"-C",str(repo),"diff","--cached","--quiet"],30).returncode==0:
            return True,"Propheten-Audiopaket ist bereits aktuell."
        rr([git,"-C",str(repo),"config","user.name","Serhat Abu Malik"],20)
        rr([git,"-C",str(repo),"config","user.email","73606501+Sero91ak@users.noreply.github.com"],20)
        p=rr([git,"-C",str(repo),"commit","-m","Kids: install local prophet story voice pack"],120)
        if p.returncode!=0:
            return False,"Git commit fehlgeschlagen: "+(p.stderr or p.stdout)[-600:]
        last=""
        for attempt in range(1,4):
            fetch=rr([git,"-C",str(repo),"fetch","origin","main"],180)
            if fetch.returncode==0:
                rebase=rr([git,"-C",str(repo),"rebase","origin/main"],180)
                if rebase.returncode!=0:
                    rr([git,"-C",str(repo),"rebase","--abort"],30)
                    return False,"Rebase fehlgeschlagen: "+(rebase.stderr or rebase.stdout)[-600:]
                push=rr([git,"-C",str(repo),"push","origin","HEAD:main"],300)
                if push.returncode==0:
                    return True,"Propheten-Audiopaket wurde nach GitHub main übertragen."
                last=(push.stderr or push.stdout)[-700:]
            else:
                last=(fetch.stderr or fetch.stdout)[-700:]
            if attempt<3: time.sleep(attempt*3)
        return False,"GitHub-Push fehlgeschlagen: "+last
    except Exception as e:
        return False,str(e)

def build_prophet_story_voice_pack(resume:bool=False):
    if not PROPHET_STORY_BATCH_LOCK.acquire(blocking=False):
        return _prophet_batch_snapshot()
    _start_prophet_caffeinate()
    try:
        manifest=_prophet_story_manifest()
        items=list(manifest.get("items") or [])
        ages=("4-5","6-8","9-10")

        grouped=[]
        for item in items:
            by_text={}
            for age in ages:
                txt=_prophet_story_age_text(item,age)
                by_text.setdefault(txt,[]).append(age)
            for txt,group_ages in by_text.items():
                grouped.append((item,tuple(group_ages),txt))

        total_jobs=len(grouped)
        total_outputs=len(items)*len(ages)
        signature=_prophet_jobs_signature(grouped)
        cp=_prophet_checkpoint_load()

        reusable=(
            bool(cp)
            and cp.get("signature")==signature
            and isinstance(cp.get("completedJobs"),dict)
        )

        if not reusable:
            if PROPHET_STORY_WORK.exists():
                shutil.rmtree(PROPHET_STORY_WORK)
            (PROPHET_STORY_WORK/"kids/assets/prophet-story-audio").mkdir(parents=True,exist_ok=True)
            (PROPHET_STORY_WORK/"kids/data").mkdir(parents=True,exist_ok=True)
            cp={
                "schemaVersion":2,
                "signature":signature,
                "buildId":"serhat-prophets-local-"+time.strftime("%Y%m%d-%H%M%S"),
                "active":True,
                "phase":"preparing",
                "startedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "completedJobs":{},
                "failedJobs":{},
                "audioByItem":{str(item.get("id")):{} for item in items},
                "total":total_jobs,
                "completed":0,
            }
            _prophet_checkpoint_save(cp)
        else:
            PROPHET_STORY_WORK.mkdir(parents=True,exist_ok=True)
            (PROPHET_STORY_WORK/"kids/assets/prophet-story-audio").mkdir(parents=True,exist_ok=True)
            (PROPHET_STORY_WORK/"kids/data").mkdir(parents=True,exist_ok=True)
            cp["active"]=True
            cp["phase"]="resuming" if resume else "rendering"
            cp["total"]=total_jobs
            cp.setdefault("failedJobs",{})
            cp.setdefault("audioByItem",{str(item.get("id")):{} for item in items})
            _prophet_checkpoint_save(cp)

        started=str(cp.get("startedAt") or time.strftime("%Y-%m-%dT%H:%M:%S%z"))
        build_id=str(cp.get("buildId") or ("serhat-prophets-local-"+time.strftime("%Y%m%d-%H%M%S")))
        completed_jobs=dict(cp.get("completedJobs") or {})
        failed_jobs=dict(cp.get("failedJobs") or {})
        audio_by_item=dict(cp.get("audioByItem") or {})
        for item in items:
            audio_by_item.setdefault(str(item.get("id")),{})

        def asset_ok(item_id,age):
            p=PROPHET_STORY_WORK/"kids/assets/prophet-story-audio"/item_id/(age+".m4a")
            return p.exists() and p.stat().st_size>=8000

        # Checkpoint darf nur Jobs als fertig betrachten, deren Audiodateien noch existieren.
        for key,meta in list(completed_jobs.items()):
            item_id=str(meta.get("itemId") or "")
            group_ages=tuple(meta.get("ages") or [])
            if not item_id or not group_ages or not all(asset_ok(item_id,a) for a in group_ages):
                completed_jobs.pop(key,None)

        def persist(phase,current="",last_error=""):
            done=len(completed_jobs)
            cp.update({
                "active":True,
                "phase":phase,
                "signature":signature,
                "buildId":build_id,
                "completedJobs":completed_jobs,
                "failedJobs":failed_jobs,
                "audioByItem":audio_by_item,
                "total":total_jobs,
                "completed":done,
                "current":current,
                "lastError":last_error,
            })
            _prophet_checkpoint_save(cp)
            return done

        PROPHET_STORY_BATCH_CANCEL.clear()
        done=persist("rendering","Setze Prophetengeschichten-Produktion fort …")
        _set_prophet_batch_state(
            running=True,phase="rendering",
            progress=2+int(done/max(1,total_jobs)*91),
            completed=done,total=total_jobs,
            current=f"Fortsetzung · {done}/{total_jobs} bereits dauerhaft gesichert",
            error="",repoPublished=False,repoPublishError="",
            startedAt=started,finishedAt=""
        )

        pending=[]
        review_pending=[]
        # Strenger Vorab-Gate über alle noch offenen Geschichten. Dadurch weiß
        # der Nutzer sofort, welche Fuṣḥā-/Ausspracheformen noch bestätigt werden
        # müssen, und keine unsichere Geschichte beginnt überhaupt mit TTS.
        for job_idx,(item,group_ages,txt) in enumerate(grouped,1):
            key=_prophet_job_key(item,group_ages,txt)
            item_id=str(item.get("id"))
            if key in completed_jobs and all(asset_ok(item_id,a) for a in group_ages):
                continue
            strict=_prophet_strict_pronunciation_preflight(txt)
            if not strict.get("ok"):
                review_items=list(strict.get("items") or [])
                detail="Ausspracheprüfung erforderlich: "+", ".join(
                    str(x.get("term") or x.get("tts") or "") for x in review_items[:8]
                )
                failed_jobs[key]={
                    "itemId":item_id,
                    "name":str(item.get("name") or item_id),
                    "ages":list(group_ages),
                    "round":0,
                    "attempt":0,
                    "type":"pronunciation-review",
                    "review":review_items,
                    "error":detail,
                }
                _prophet_review_upsert(
                    item_id,str(item.get("name") or item_id),
                    group_ages,txt,review_items
                )
                review_pending.append((job_idx,key,item,group_ages,txt))
                continue
            pending.append((job_idx,key,item,group_ages,txt))

        persist(
            "preflight",
            f"{len(pending)} sichere Geschichten · {len(review_pending)} warten auf Ausspracheprüfung"
        )
        _set_prophet_batch_state(
            phase="rendering",
            progress=2+int(len(completed_jobs)/max(1,total_jobs)*91),
            completed=len(completed_jobs),total=total_jobs,
            current=f"Fuṣḥā-Vorprüfung: {len(pending)} sicher · {len(review_pending)} zurückgestellt",
            error=""
        )

        # Drei Produktionsrunden: Ein schwieriger Abschnitt blockiert niemals
        # alle anderen Geschichten. Nach einem lokalen Fehler kommt der nächste Job.
        max_rounds=3
        for round_idx in range(1,max_rounds+1):
            if not pending:
                break
            next_pending=[]
            for job_idx,key,item,group_ages,txt in pending:
                if PROPHET_STORY_BATCH_CANCEL.is_set():
                    cp.update({"active":False,"phase":"cancelled"})
                    _prophet_checkpoint_save(cp)
                    return _set_prophet_batch_state(
                        running=False,phase="cancelled",
                        completed=len(completed_jobs),total=total_jobs,
                        current="Vom Nutzer gestoppt",error="",
                        finishedAt=time.strftime("%Y-%m-%dT%H:%M:%S%z")
                    )

                item_id=str(item.get("id"))
                age_label="/".join(group_ages)
                done=len(completed_jobs)
                pct=2+int(done/max(1,total_jobs)*91)
                label=f"{job_idx}/{total_jobs} · {item.get('name')} · Alter {age_label}"
                persist("rendering",label)
                _set_prophet_batch_state(
                    phase="rendering",progress=pct,completed=done,total=total_jobs,
                    current=label,error=""
                )

                wav=None
                last_error=None
                # Lokale Selbstheilung. generate() besitzt zusätzlich Segmentcache,
                # Watchdog, MLX-Neustart, semantische Teilung und MPS-Fallback.
                for attempt in range(1,5):
                    try:
                        wav=generate(txt,"","kids_story",free_mode=True,free_pronunciation=True)
                        last_error=None
                        break
                    except PronunciationReviewRequired as e:
                        last_error=e
                        detail=str(e)
                        review_items=list(e.items or [])
                        failed_jobs[key]={
                            "itemId":item_id,
                            "name":str(item.get("name") or item_id),
                            "ages":list(group_ages),
                            "round":round_idx,
                            "attempt":attempt,
                            "type":"pronunciation-review",
                            "review":review_items,
                            "error":detail,
                        }
                        _prophet_review_upsert(
                            item_id,str(item.get("name") or item_id),
                            group_ages,txt,review_items
                        )
                        persist("rendering",label,detail)
                        _set_prophet_batch_state(
                            phase="rendering",progress=pct,completed=done,total=total_jobs,
                            current=f"{label} · Ausspracheprüfung zurückgestellt · andere Geschichten laufen weiter",
                            error=""
                        )
                        break
                    except RuntimeError as e:
                        last_error=e
                        detail=str(e)
                        failed_jobs[key]={
                            "itemId":item_id,
                            "name":str(item.get("name") or item_id),
                            "ages":list(group_ages),
                            "round":round_idx,
                            "attempt":attempt,
                            "type":"technical",
                            "error":detail,
                        }
                        persist("rendering",label,detail)
                        _set_prophet_batch_state(
                            phase="rendering",progress=pct,completed=done,total=total_jobs,
                            current=f"{label} · lokale Rettung {attempt}/4",
                            error=""
                        )
                        if attempt<4:
                            time.sleep(min(8,attempt*2))

                if wav is None:
                    if isinstance(last_error,PronunciationReviewRequired):
                        review_pending.append((job_idx,key,item,group_ages,txt))
                    else:
                        next_pending.append((job_idx,key,item,group_ages,txt))
                    # Nicht blockieren: andere Propheten sofort weiter produzieren.
                    continue

                first_age=group_ages[0]
                first_asset=PROPHET_STORY_WORK/"kids/assets/prophet-story-audio"/item_id/(first_age+".m4a")
                _encode_kids_m4a(wav,first_asset)
                dur=round(_audio_duration_seconds(first_asset),3)
                if dur<20 or first_asset.stat().st_size<8000:
                    detail=f"Audio-QA fehlgeschlagen: {item_id}/{age_label} · {dur}s"
                    failed_jobs[key]={
                        "itemId":item_id,"name":str(item.get("name") or item_id),
                        "ages":list(group_ages),"round":round_idx,"attempt":4,"error":detail,
                    }
                    persist("rendering",label,detail)
                    next_pending.append((job_idx,key,item,group_ages,txt))
                    continue

                base_meta={
                    "durationSec":dur,
                    "bytes":first_asset.stat().st_size,
                    "sha256":hashlib.sha256(first_asset.read_bytes()).hexdigest(),
                    "voiceProfile":"kids_story",
                    "voiceProfileId":"serhat-owner-voice-2026",
                    "source":"DĀR Voice Studio local engine",
                    "sourceSpeaker":"Serhat Abu Malik",
                    "language":"German narration with Arabic/Fuṣḥā terms",
                    "technicalQaPassed":True,
                    "sharedMasterForIdenticalText":len(group_ages)>1,
                }
                for age in group_ages:
                    asset=PROPHET_STORY_WORK/"kids/assets/prophet-story-audio"/item_id/(age+".m4a")
                    if asset!=first_asset:
                        asset.parent.mkdir(parents=True,exist_ok=True)
                        shutil.copy2(first_asset,asset)
                    audio_by_item[item_id][age]={
                        **base_meta,
                        "url":f"/kids/assets/prophet-story-audio/{item_id}/{age}.m4a?v={build_id}",
                    }

                completed_jobs[key]={
                    "itemId":item_id,
                    "name":str(item.get("name") or item_id),
                    "ages":list(group_ages),
                    "durationSec":dur,
                    "sha256":base_meta["sha256"],
                    "finishedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                }
                failed_jobs.pop(key,None)
                _prophet_review_clear(item_id,txt)
                done=persist("rendering",f"{item.get('name')} dauerhaft gesichert")
                _set_prophet_batch_state(
                    phase="rendering",
                    progress=2+int(done/max(1,total_jobs)*91),
                    completed=done,total=total_jobs,
                    current=f"{done}/{total_jobs} fertig · {item.get('name')} dauerhaft gesichert",
                    error=""
                )

            pending=next_pending
            if pending and round_idx<max_rounds:
                persist("retrying",f"{len(pending)} schwierige Audiofassungen kommen in Runde {round_idx+1}")
                _set_prophet_batch_state(
                    phase="retrying",
                    progress=2+int(len(completed_jobs)/max(1,total_jobs)*91),
                    completed=len(completed_jobs),total=total_jobs,
                    current=f"{len(pending)} schwierige Audiofassungen · zweite Rettungsrunde",
                    error=""
                )
                _stop_mlx_process("prophet retry round")
                time.sleep(3)

        if pending:
            names=[
                str(item.get("name") or item.get("id"))
                for _,_,item,_,_ in pending
            ]
            detail="Nach drei autonomen Rettungsrunden offen: "+", ".join(names)
            cp.update({"active":True,"phase":"blocked","lastError":detail})
            _prophet_checkpoint_save(cp)
            return _set_prophet_batch_state(
                running=False,phase="blocked",
                progress=2+int(len(completed_jobs)/max(1,total_jobs)*91),
                completed=len(completed_jobs),total=total_jobs,
                current="Andere Geschichten wurden weiterproduziert; nur technische Problemjobs bleiben offen.",
                error=detail,startedAt=started,
                finishedAt=time.strftime("%Y-%m-%dT%H:%M:%S%z")
            )

        if review_pending:
            names=[
                str(item.get("name") or item.get("id"))
                for _,_,item,_,_ in review_pending
            ]
            detail="Aussprache muss vor der Erzeugung bestätigt werden: "+", ".join(names)
            cp.update({"active":False,"phase":"review-required","lastError":detail})
            _prophet_checkpoint_save(cp)
            return _set_prophet_batch_state(
                running=False,phase="review-required",
                progress=2+int(len(completed_jobs)/max(1,total_jobs)*91),
                completed=len(completed_jobs),total=total_jobs,
                current="Alle sicheren Geschichten wurden weiterproduziert. Offene Fuṣḥā-/Ausspracheformen warten auf Bestätigung.",
                error=detail,startedAt=started,
                finishedAt=time.strftime("%Y-%m-%dT%H:%M:%S%z")
            )

        for item in items:
            item["audio"]=audio_by_item[str(item.get("id"))]

        manifest["audioBuild"]={
            "id":build_id,
            "engine":"local-serhat-engine",
            "voiceProfile":"kids_story",
            "voiceProfileId":"serhat-owner-voice-2026",
            "clips":total_outputs,
            "uniqueRenders":total_jobs,
            "ages":list(ages),
            "technicalQaPassed":True,
            "persistentCheckpoint":True,
            "generatedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z")
        }
        manifest["updatedAt"]=time.strftime("%Y-%m-%d")
        atomic_write_json(PROPHET_STORY_WORK/"kids/data/prophet-stories.json",manifest)

        if PROPHET_STORY_READY.exists():
            shutil.rmtree(PROPHET_STORY_READY)
        shutil.copytree(PROPHET_STORY_WORK,PROPHET_STORY_READY)

        _set_prophet_batch_state(
            phase="publishing",progress=96,completed=total_jobs,total=total_jobs,
            current=f"{total_outputs} Audio-Slots werden veröffentlicht …"
        )
        ok,msg=_publish_prophet_story_pack(PROPHET_STORY_READY)
        cp.update({
            "active":not bool(ok),
            "phase":"complete" if ok else "publish-error",
            "completed":total_jobs,
            "lastError":"" if ok else msg,
            "finishedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        })
        _prophet_checkpoint_save(cp)
        return _set_prophet_batch_state(
            running=False,phase="complete" if ok else "publish-error",
            progress=100 if ok else 98,completed=total_jobs,total=total_jobs,
            current="Fertig" if ok else "Audio vollständig fertig; Veröffentlichung wird später erneut versucht.",
            error="" if ok else msg,repoPublished=bool(ok),
            repoPublishError="" if ok else msg,repoPublishMessage=msg,
            startedAt=started,finishedAt=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        )
    except Exception as e:
        detail=str(e)
        cp=_prophet_checkpoint_load()
        cp.update({
            "active":True,
            "phase":"interrupted",
            "lastError":detail,
        })
        _prophet_checkpoint_save(cp)
        return _set_prophet_batch_state(
            running=False,phase="interrupted",error=detail,
            current="Unterbrochen · wird beim nächsten Engine-Start automatisch fortgesetzt",
            finishedAt=time.strftime("%Y-%m-%dT%H:%M:%S%z")
        )
    finally:
        _stop_prophet_caffeinate()
        PROPHET_STORY_BATCH_LOCK.release()

def start_prophet_story_voice_pack(resume:bool=False):
    state=_prophet_batch_snapshot()
    if state.get("running"):
        return state
    t=threading.Thread(
        target=build_prophet_story_voice_pack,
        kwargs={"resume":bool(resume)},
        daemon=True,
        name="dar-prophet-story-batch"
    )
    t.start()
    time.sleep(.05)
    return _prophet_batch_snapshot()

def publish_manual_prophet_story(item_id:str,age:str,text:str,source_path:Path|None=None,source_name:str="",timings=None,sync_mode:str=""):
    item_id=str(item_id or "").strip()
    requested=str(age or "all").strip()
    text=str(text or "").strip()
    ages=("4-5","6-8","9-10")
    if requested in ("","all","auto","*"):
        target_ages=ages
    elif requested in ages:
        target_ages=(requested,)
    else:
        raise ValueError("Alter muss all, 4-5, 6-8 oder 9-10 sein.")
    if not item_id:
        raise ValueError("Prophet fehlt.")
    if len(text)<40:
        raise ValueError("Erzähltext ist zu kurz.")
    st=get_status()
    src=Path(source_path) if source_path else Path(str(st.get("last_output") or ""))
    manual_upload=bool(source_path)
    if not src.exists() or src.stat().st_size<=44:
        raise ValueError("Zuerst Audio erzeugen oder eine Audiodatei hochladen.")
    git=shutil.which("git")
    if not git:
        raise RuntimeError("git fehlt.")
    repo=ALPHABET_PUBLISH_REPO
    def rr(args,timeout=180):
        return run(args,timeout)
    gh=shutil.which("gh")
    if gh:
        auth=rr([gh,"auth","status"],30)
        if auth.returncode==0:
            rr([gh,"auth","setup-git"],30)
    if not (repo/".git").exists():
        if repo.exists(): shutil.rmtree(repo)
        p=rr([git,"clone","https://github.com/Sero91ak/dar-al-tawhid-site.git",str(repo)],300)
        if p.returncode!=0:
            raise RuntimeError("Git clone fehlgeschlagen: "+(p.stderr or p.stdout)[-500:])
    rr([git,"-C",str(repo),"fetch","origin","main"],180)
    rr([git,"-C",str(repo),"checkout","main"],60)
    rr([git,"-C",str(repo),"reset","--hard","origin/main"],60)
    data_path=repo/"kids/data/prophet-stories.json"
    manifest=json.loads(data_path.read_text(encoding="utf-8"))
    items=list(manifest.get("items") or [])
    item=next((x for x in items if str(x.get("id"))==item_id),None)
    if not item:
        raise ValueError("Prophet nicht gefunden: "+item_id)
    first=target_ages[0]
    first_asset=repo/"kids/assets/prophet-story-audio"/item_id/(first+".m4a")
    _encode_kids_m4a(src,first_asset)
    dur=round(_audio_duration_seconds(first_asset),3)
    if dur<5 or first_asset.stat().st_size<4000:
        raise RuntimeError("Audio-QA fehlgeschlagen: zu kurz oder leer.")
    timing_map=_sanitize_story_timings(text,timings,dur)
    stamp=time.strftime("%Y%m%d-%H%M%S")
    scripts=item.get("scripts") if isinstance(item.get("scripts"),dict) else {}
    audio=item.get("audio") if isinstance(item.get("audio"),dict) else {}
    rels=[]
    meta={
        "durationSec":dur,
        "bytes":first_asset.stat().st_size,
        "sha256":hashlib.sha256(first_asset.read_bytes()).hexdigest(),
        "voiceProfile":"kids_story",
        "voiceProfileId":"serhat-owner-voice-2026",
        "source":"DĀR Voice Studio manual owner-audio upload" if manual_upload else "DĀR Voice Studio local engine",
        "sourceSpeaker":"Serhat Abu Malik",
        "sourceFile":str(source_name or src.name),
        "manual":True,
        "manualUpload":manual_upload,
        "allAges":requested in ("","all","auto","*"),
        "modes":["read","listen"],
        "technicalQaPassed":True,
        "publishedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    if timing_map:
        meta["timings"]=timing_map
        meta["syncMode"]=str(sync_mode or "elevenlabs-forced-alignment-v1")
    for a in target_ages:
        asset=repo/"kids/assets/prophet-story-audio"/item_id/(a+".m4a")
        if asset!=first_asset:
            asset.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(first_asset,asset)
        scripts[a]=text
        audio[a]={**meta,"url":f"/kids/assets/prophet-story-audio/{item_id}/{a}.m4a?v={stamp}"}
        rels.append(str(asset.relative_to(repo)))
    item["scripts"]=scripts
    if len(target_ages)==3:
        item["voiceScript"]=text
    item["audio"]=audio
    manifest["updatedAt"]=time.strftime("%Y-%m-%d")
    atomic_write_json(data_path,manifest)
    # Lokale Bibliothek sofort synchron halten, damit derselbe Text/Audio-Status
    # nach Reload der Voice App erhalten bleibt und nicht aus einem alten Cache kommt.
    atomic_write_json(APP_HOME/"prophet-stories.json",manifest)
    p=rr([git,"-C",str(repo),"add","kids/data/prophet-stories.json",*rels],60)
    if p.returncode!=0:
        raise RuntimeError("Git staging fehlgeschlagen.")
    if rr([git,"-C",str(repo),"diff","--cached","--quiet"],30).returncode==0:
        return {"ok":True,"unchanged":True,"id":item_id,"ages":list(target_ages),"url":audio[first]["url"]}
    rr([git,"-C",str(repo),"config","user.name","Serhat Abu Malik"],20)
    rr([git,"-C",str(repo),"config","user.email","73606501+Sero91ak@users.noreply.github.com"],20)
    name=str(item.get("name") or item_id)
    msg=f"Kids: Prophetengeschichte {name} · alle Altersstufen aus Voice Studio" if len(target_ages)>1 else f"Kids: Prophetengeschichte {name} · Alter {first} aus Voice Studio"
    p=rr([git,"-C",str(repo),"commit","-m",msg],120)
    if p.returncode!=0:
        raise RuntimeError("Git commit fehlgeschlagen: "+(p.stderr or p.stdout)[-600:])
    last=""
    for attempt in range(1,4):
        fetch=rr([git,"-C",str(repo),"fetch","origin","main"],180)
        if fetch.returncode==0:
            rebase=rr([git,"-C",str(repo),"rebase","origin/main"],180)
            if rebase.returncode!=0:
                rr([git,"-C",str(repo),"rebase","--abort"],30)
                raise RuntimeError("Rebase fehlgeschlagen.")
            push=rr([git,"-C",str(repo),"push","origin","HEAD:main"],300)
            if push.returncode==0:
                return {"ok":True,"id":item_id,"name":name,"ages":list(target_ages),"url":audio[first]["url"],"durationSec":dur,"pushed":True}
            last=(push.stderr or push.stdout)[-700:]
        else:
            last=(fetch.stderr or fetch.stdout)[-700:]
        if attempt<3: time.sleep(attempt*3)
    raise RuntimeError("GitHub-Push fehlgeschlagen: "+last)



def publish_manual_mubashshirun_story(item_id:str,age:str,text:str,source_path:Path|None=None,source_name:str="",timings=None,sync_mode:str=""):
    item_id=str(item_id or "").strip()
    age=str(age or "").strip()
    text=str(text or "").strip()
    ages=("4-5","6-8","9-10")
    if age not in ages:
        raise ValueError("Alter muss 4-5, 6-8 oder 9-10 sein.")
    if not item_id:
        raise ValueError("Ṣaḥābī fehlt.")
    if len(text)<80:
        raise ValueError("Erzähltext ist zu kurz.")

    st=get_status()
    src=Path(source_path) if source_path else Path(str(st.get("last_output") or ""))
    manual_upload=bool(source_path)
    if not src.exists() or src.stat().st_size<=44:
        raise ValueError("Zuerst Audio erzeugen oder eine Audiodatei hochladen.")

    git=shutil.which("git")
    if not git:
        raise RuntimeError("git fehlt.")
    repo=ALPHABET_PUBLISH_REPO
    def rr(args,timeout=180):
        return run(args,timeout)

    gh=shutil.which("gh")
    if gh:
        auth=rr([gh,"auth","status"],30)
        if auth.returncode==0:
            rr([gh,"auth","setup-git"],30)

    if not (repo/".git").exists():
        if repo.exists():
            shutil.rmtree(repo)
        p=rr([git,"clone","https://github.com/Sero91ak/dar-al-tawhid-site.git",str(repo)],300)
        if p.returncode!=0:
            raise RuntimeError("Git clone fehlgeschlagen: "+(p.stderr or p.stdout)[-500:])

    rr([git,"-C",str(repo),"fetch","origin","main"],180)
    rr([git,"-C",str(repo),"checkout","main"],60)
    rr([git,"-C",str(repo),"reset","--hard","origin/main"],60)

    data_path=repo/"kids/data/mubashshirun-stories.json"
    if not data_path.exists():
        raise RuntimeError("Mubaschschirūn-Datendatei fehlt im Kids-Repository.")
    manifest=json.loads(data_path.read_text(encoding="utf-8"))
    items=list(manifest.get("items") or [])
    item=next((x for x in items if str(x.get("id") or "")==item_id),None)
    if not item:
        raise ValueError("Ṣaḥābī nicht gefunden: "+item_id)

    asset=repo/"kids/assets/mubashshirun-story-audio"/item_id/(age+".m4a")
    _encode_kids_m4a(src,asset)
    dur=round(_audio_duration_seconds(asset),3)
    if dur<30 or asset.stat().st_size<8000:
        raise RuntimeError("Audio-QA fehlgeschlagen: Geschichte ist zu kurz oder leer.")
    timing_map=_sanitize_story_timings(text,timings,dur)

    stamp=time.strftime("%Y%m%d-%H%M%S")
    scripts=item.get("scripts") if isinstance(item.get("scripts"),dict) else {}
    audio=item.get("audio") if isinstance(item.get("audio"),dict) else {}
    scripts[age]=text
    audio[age]={
        "status":"ready",
        "durationSec":dur,
        "bytes":asset.stat().st_size,
        "sha256":hashlib.sha256(asset.read_bytes()).hexdigest(),
        "voiceProfile":"kids_story",
        "voiceProfileId":"serhat-owner-voice-2026",
        "source":"DĀR Voice Studio manual owner-audio upload" if manual_upload else "DĀR Voice Studio local engine",
        "sourceSpeaker":"Serhat Abu Malik",
        "sourceFile":str(source_name or src.name),
        "manualUpload":manual_upload,
        "age":age,
        "modes":["read","listen"],
        "technicalQaPassed":True,
        "pronunciationReviewRequired":True,
        "publishedAt":time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "url":f"/kids/assets/mubashshirun-story-audio/{item_id}/{age}.m4a?v={stamp}",
    }
    if timing_map:
        audio[age]["timings"]=timing_map
        audio[age]["syncMode"]=str(sync_mode or "elevenlabs-forced-alignment-v1")
    item["scripts"]=scripts
    item["audio"]=audio
    vp=item.get("voiceProduction") if isinstance(item.get("voiceProduction"),dict) else {}
    published=sorted({a for a in ages if isinstance(audio.get(a),dict) and str(audio[a].get("url") or "").strip()})
    vp["publishedAges"]=published
    vp["status"]="audio-complete" if len(published)==3 else "audio-partial"
    vp["lastPublishedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    item["voiceProduction"]=vp
    manifest["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%S%z")
    atomic_write_json(data_path,manifest)
    # Keep the local Voice-Studio library in sync immediately after a publish.
    atomic_write_json(APP_HOME/"mubashshirun-stories.json",manifest)

    rel_asset=str(asset.relative_to(repo))
    p=rr([git,"-C",str(repo),"add","kids/data/mubashshirun-stories.json",rel_asset],60)
    if p.returncode!=0:
        raise RuntimeError("Git staging fehlgeschlagen.")

    if rr([git,"-C",str(repo),"diff","--cached","--quiet"],30).returncode==0:
        return {
            "ok":True,"unchanged":True,"id":item_id,"age":age,
            "url":audio[age]["url"],"durationSec":dur,"publishedAges":published
        }

    rr([git,"-C",str(repo),"config","user.name","Serhat Abu Malik"],20)
    rr([git,"-C",str(repo),"config","user.email","73606501+Sero91ak@users.noreply.github.com"],20)
    name=str(item.get("name") or item_id)
    msg=f"Kids: Ṣaḥābah-Geschichte {name} · Alter {age} · Serhat Voice"
    p=rr([git,"-C",str(repo),"commit","-m",msg],120)
    if p.returncode!=0:
        raise RuntimeError("Git commit fehlgeschlagen: "+(p.stderr or p.stdout)[-600:])

    last=""
    for attempt in range(1,4):
        fetch=rr([git,"-C",str(repo),"fetch","origin","main"],180)
        if fetch.returncode==0:
            rebase=rr([git,"-C",str(repo),"rebase","origin/main"],180)
            if rebase.returncode!=0:
                rr([git,"-C",str(repo),"rebase","--abort"],30)
                raise RuntimeError("Rebase fehlgeschlagen.")
            push=rr([git,"-C",str(repo),"push","origin","HEAD:main"],300)
            if push.returncode==0:
                return {
                    "ok":True,"id":item_id,"name":name,"age":age,
                    "url":audio[age]["url"],"durationSec":dur,
                    "publishedAges":published,"pushed":True
                }
            last=(push.stderr or push.stdout)[-700:]
        else:
            last=(fetch.stderr or fetch.stdout)[-700:]
        if attempt<3:
            time.sleep(attempt*3)
    raise RuntimeError("GitHub-Push fehlgeschlagen: "+last)


class H(BaseHTTPRequestHandler):
    def is_loopback_client(self):
        try:
            host=str(self.client_address[0] or "")
            return host in ("127.0.0.1","::1") or host.startswith("127.")
        except Exception:
            return False

    def request_pair_token(self):
        header=str(self.headers.get("X-DAR-Voice-Token","") or "").strip()
        if header:
            return header
        cookie=str(self.headers.get("Cookie","") or "")
        m=re.search(r"(?:^|;\s*)DARVOICE_PAIR=([^;]+)",cookie)
        if m:
            return m.group(1).strip()
        try:
            query=parse_qs(urlparse(self.path).query)
            return str((query.get("pair") or [""])[0]).strip()
        except Exception:
            return ""

    def token_matches(self,value):
        value=str(value or "")
        return bool(PAIR_TOKEN and value and hmac.compare_digest(value,PAIR_TOKEN))

    def remote_authorized(self):
        if self.is_loopback_client():
            return True
        if not NETWORK_MODE or not PAIR_TOKEN:
            return False
        return self.token_matches(self.request_pair_token())

    def accept_pairing_url(self):
        if self.is_loopback_client() or not NETWORK_MODE or not PAIR_TOKEN:
            return False
        parsed=urlparse(self.path)
        if parsed.path not in ("/","/studio","/studio/","/studio/index.html","/mobile","/mobile/","/mobile/index.html"):
            return False
        query=parse_qs(parsed.query)
        supplied=str((query.get("pair") or [""])[0]).strip()
        if not self.token_matches(supplied):
            return False
        target=("/mobile/#pair="+PAIR_TOKEN) if parsed.path.startswith("/mobile") else ("/studio/#pair="+PAIR_TOKEN)
        self.send_response(302)
        self.send_header("Location",target)
        self.send_header(
            "Set-Cookie",
            "DARVOICE_PAIR="+PAIR_TOKEN+"; Path=/; Max-Age=31536000; SameSite=Strict; HttpOnly"
        )
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        return True

    def reject_remote(self):
        self.send_json(403,{
            "ok":False,
            "error":"Dieses Gerät ist noch nicht mit DĀR Voice Studio gekoppelt.",
            "pairing_required":True
        })

    def cors(self):
        origin=self.headers.get("Origin","")
        allowed=origin if origin in ("https://dar-al-tawhid.de","https://www.dar-al-tawhid.de") or origin.startswith("http://127.0.0.1") or origin.startswith("http://localhost") else "https://dar-al-tawhid.de"
        self.send_header("Access-Control-Allow-Origin",allowed)
        self.send_header("Vary","Origin")
        self.send_header("Access-Control-Allow-Headers","Content-Type,X-DAR-Voice-Token")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Credentials","true")
        self.send_header("Access-Control-Expose-Headers","X-Learning-Preview-Id, X-Learning-Lock-Key")
        self.send_header("Access-Control-Allow-Private-Network","true")
        self.send_header("Cache-Control","no-store")

    def send_json(self,status,obj):
        b=json.dumps(obj,ensure_ascii=False).encode()
        try:
            self.send_response(status)
            self.send_header("Content-Type","application/json; charset=utf-8")
            self.send_header("Content-Length",str(len(b)))
            self.cors();self.end_headers();self.wfile.write(b)
        except (BrokenPipeError,ConnectionResetError):
            # Health-/UI-Clients dürfen kurze Requests abbrechen, ohne dass ein
            # harmloser Disconnect als Engine-Fehler im Startprotokoll landet.
            return

    def do_OPTIONS(self):
        if not self.remote_authorized():
            return self.reject_remote()
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

    def send_audio_file(self,path:Path,content_type:str="audio/mp4"):
        if not path.exists() or not path.is_file():
            return self.send_json(404,{"ok":False,"error":"Audio noch nicht verfügbar."})
        size=int(path.stat().st_size)
        start=0
        end=max(0,size-1)
        partial=False
        raw=str(self.headers.get("Range","") or "").strip()
        if raw.startswith("bytes="):
            m=re.match(r"bytes=(\d*)-(\d*)",raw)
            if m:
                a,b=m.groups()
                if a:
                    start=max(0,min(int(a),end))
                if b:
                    end=max(start,min(int(b),end))
                partial=True
        length=max(0,end-start+1)
        self.send_response(206 if partial else 200)
        self.send_header("Content-Type",content_type)
        self.send_header("Accept-Ranges","bytes")
        self.send_header("Content-Length",str(length))
        if partial:
            self.send_header("Content-Range",f"bytes {start}-{end}/{size}")
        self.cors()
        self.end_headers()
        with path.open("rb") as fh:
            fh.seek(start)
            remaining=length
            while remaining>0:
                chunk=fh.read(min(256*1024,remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining-=len(chunk)

    def do_GET(self):
        if self.accept_pairing_url():
            return

        p=urlparse(self.path).path
        # iOS lädt Home-Screen-Icon/Manifest teils außerhalb des gekoppelten
        # Dokument-Requests. Nur diese statischen, geheimnisfreien Assets sind
        # deshalb ohne Pair-Cookie lesbar; Voice-/Audio-/Statusdaten bleiben geschützt.
        public_mobile_assets={
            # App-Shell darf ohne Cookie laden, damit iOS Home-Screen/WebClip nach
            # einem Neustart seinen lokal gespeicherten Pairing-Token verwenden kann.
            # Sämtliche Engine-/Audio-/Status-/Write-Endpunkte bleiben weiter geschützt.
            "/mobile",
            "/mobile/",
            "/mobile/index.html",
            "/mobile/manifest.webmanifest",
            "/mobile/voice-studio-icon.png",
            "/mobile/apple-touch-icon.png",
            "/mobile/apple-touch-icon-precomposed.png",
            "/studio",
            "/studio/",
            "/studio/index.html",
            "/studio/content-studio.js",
            "/studio/alphabet-audio-studio.js",
            "/studio/voice-studio-icon.png",
            "/studio/manifest.webmanifest",
            "/apple-touch-icon.png",
            "/apple-touch-icon-precomposed.png",
            "/favicon.png",
        }
        if not self.remote_authorized() and p not in public_mobile_assets:
            return self.reject_remote()
        if p=="/health":
            # Start-Handshake muss garantiert leichtgewichtig bleiben. get_status()
            # enthält große Aussprache-/Learning-Listen und ist für /status gedacht,
            # nicht für die mehrfach pro Sekunde laufende Engine-Health-Prüfung.
            with STATUS_LOCK:
                st=dict(STATUS)
            reference_ok=REF.exists()
            self.send_json(200,{
                "ok":True,
                "provider":"DĀR Voice Extreme Fast · Chatterbox Multilingual",
                "engine_version":ENGINE_VERSION,
                "interactive_extreme_fast":True,
                "mlx_model":MLX_MODEL_ID if MLX_ENABLED else None,
                "reference_exists":reference_ok,
                "voice_reference_ready":reference_ok,
                "reference_path":str(REF),
                "reference_arabic_dedicated":ARABIC_DEDICATED_REFERENCE,
                "prosody_mode":st.get("prosody_mode","narration"),
                "model_state":st["model_state"],
                "model_device":st["model_device"],
                "render_state":st["render_state"],
                "progress":st["progress"],
                "last_error":st["last_error"],
                "library":LIB.get("counts",{}),
                "profile":VOICE_PROFILE.get("delivery",{}),
                "companion_mode":bool(NETWORK_MODE and PAIR_TOKEN),
                "companion_client":not self.is_loopback_client(),
                "learning_preview_queue":{
                    "waiting":LEARNING_PREVIEW_WAITING.is_set(),
                    "jobs":len(LEARNING_PREVIEW_JOBS)
                }
            })
        elif p=="/mobile/release":
            latest=ENGINE_VERSION
            source="installed"
            try:
                req=urllib.request.Request(
                    "https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/voice-studio/version.json?ref=main",
                    headers={
                        "Accept":"application/vnd.github.raw+json",
                        "User-Agent":"DAR-Voice-Mobile-Updater/"+ENGINE_VERSION,
                        "Cache-Control":"no-cache",
                    },
                )
                with urllib.request.urlopen(req,timeout=8) as response:
                    raw=response.read()
                data=json.loads(raw.decode("utf-8"))
                latest=str(data.get("version") or ENGINE_VERSION).strip() or ENGINE_VERSION
                source="github"
            except Exception:
                try:
                    req=urllib.request.Request(
                        "https://dar-al-tawhid.de/voice-studio/version.json?mobile_update="+str(int(time.time())),
                        headers={"User-Agent":"DAR-Voice-Mobile-Updater/"+ENGINE_VERSION,"Cache-Control":"no-cache"},
                    )
                    with urllib.request.urlopen(req,timeout=8) as response:
                        raw=response.read()
                    data=json.loads(raw.decode("utf-8"))
                    latest=str(data.get("version") or ENGINE_VERSION).strip() or ENGINE_VERSION
                    source="website"
                except Exception:
                    pass
            self.send_json(200,{
                "ok":True,
                "current":ENGINE_VERSION,
                "latest":latest,
                "updateAvailable":version_tuple(latest)>version_tuple(ENGINE_VERSION),
                "source":source,
            })
        elif p=="/render-status":
            self.send_json(200,{"ok":True,**render_status_snapshot()})
        elif p=="/generate-job":
            qs=parse_qs(urlparse(self.path).query)
            snap=generation_job_snapshot(str((qs.get("id") or [""])[0]))
            self.send_json(200 if snap.get("ok") else 404,snap)
        elif p=="/status":
            self.send_json(200,{"ok":True,**get_status()})
        elif p=="/learning/preview-state":
            qs=parse_qs(urlparse(self.path).query)
            job_id=str((qs.get("id") or [""])[0])
            snap=_learning_preview_job_snapshot(job_id)
            self.send_json(200 if snap.get("ok") else 404,snap)
        elif p=="/learning/preview-audio":
            qs=parse_qs(urlparse(self.path).query)
            job_id=str((qs.get("id") or [""])[0])
            with LEARNING_PREVIEW_JOB_LOCK:
                row=dict(LEARNING_PREVIEW_JOBS.get(job_id) or {})
            if not row:
                return self.send_json(404,{"ok":False,"error":"Schnelltest-Auftrag nicht gefunden."})
            if row.get("state")!="ready":
                return self.send_json(409,{"ok":False,"state":row.get("state"),"error":row.get("error") or "Schnelltest ist noch nicht fertig."})
            path=Path(str(row.get("path") or ""))
            if not path.exists() or path.stat().st_size<=44:
                return self.send_json(410,{"ok":False,"error":"Schnelltest-Audio fehlt."})
            b=path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type","audio/wav")
            self.send_header("Content-Length",str(len(b)))
            self.send_header("X-Learning-Preview-Id",str(row.get("previewId") or ""))
            self.send_header("X-Learning-Preview-Mode",str(row.get("previewMode") or "qa-fast-render"))
            self.send_header("X-Learning-Preview-Ms",str(int(row.get("elapsedMs") or 0)))
            self.send_header("X-Learning-Variant",str(int(row.get("variant") or 0)))
            self.cors();self.end_headers();self.wfile.write(b)
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
        elif p in ("/mobile","/mobile/","/mobile/index.html"):
            self.send_file(APP_HOME/"mobile.html","text/html; charset=utf-8")
        elif p in (
            "/mobile/voice-studio-icon.png",
            "/mobile/apple-touch-icon.png",
            "/mobile/apple-touch-icon-precomposed.png",
            "/apple-touch-icon.png",
            "/apple-touch-icon-precomposed.png",
            "/favicon.png",
        ):
            self.send_file(APP_HOME/"voice-studio-icon.png","image/png")
        elif p=="/mobile/manifest.webmanifest":
            self.send_json(200,{
                "name":"DĀR AL TAWḤĪD Voice",
                "short_name":"DĀR Voice",
                "id":"/mobile/",
                "start_url":"/mobile/",
                "scope":"/mobile/",
                "display":"standalone",
                "background_color":"#f7f7f5",
                "theme_color":"#f7f7f5",
                "orientation":"any",
                "icons":[
                    {"src":"/mobile/apple-touch-icon.png?v=2990","sizes":"256x256","type":"image/png","purpose":"any"},
                    {"src":"/mobile/voice-studio-icon.png?v=2990","sizes":"256x256","type":"image/png","purpose":"maskable"}
                ]
            })
        elif p=="/mobile/history":
            self.send_json(200,mobile_history_snapshot(60))
        elif p=="/mobile/audio":
            qs=parse_qs(urlparse(self.path).query)
            raw_name=str((qs.get("name") or [""])[0]).strip()
            name=Path(raw_name).name
            if not raw_name or name!=raw_name or not name.lower().endswith(".wav"):
                return self.send_json(400,{"ok":False,"error":"Ungültige Audiodatei."})
            candidate=OUTPUT/name
            if not candidate.exists() or candidate.parent.resolve()!=OUTPUT.resolve():
                return self.send_json(404,{"ok":False,"error":"Audio nicht gefunden."})
            self.send_audio_file(candidate,"audio/wav")
        elif p=="/studio/content-studio.js":
            self.send_file(APP_HOME/"content-studio.js","application/javascript; charset=utf-8")
        elif p=="/studio/alphabet-audio-studio.js":
            self.send_file(APP_HOME/"alphabet-audio-studio.js","application/javascript; charset=utf-8")
        elif p=="/studio/alphabet-audio.json":
            try:
                self.send_json(200,load_alphabet_manifest())
            except Exception as e:
                self.send_json(503,{"ok":False,"error":str(e)})
        elif p=="/studio/quiz-kids.json":
            try:
                self.send_json(200,load_quiz_manifest())
            except Exception as e:
                self.send_json(503,{"ok":False,"error":str(e)})
        elif p=="/studio/voice-studio-icon.png":
            self.send_file(APP_HOME/"voice-studio-icon.png","image/png")
        elif p=="/studio/manifest.webmanifest":
            self.send_json(200,{
                "name":"DĀR AL TAWḤĪD Voice Studio",
                "short_name":"Voice Studio",
                "id":"/studio/",
                "start_url":"/studio/?pair="+PAIR_TOKEN if PAIR_TOKEN else "/studio/",
                "scope":"/studio/",
                "display":"standalone",
                "background_color":"#06131f",
                "theme_color":"#071923",
                "orientation":"any",
                "icons":[
                    {"src":"/studio/voice-studio-icon.png","sizes":"256x256","type":"image/png","purpose":"any"},
                    {"src":"/studio/voice-studio-icon.png","sizes":"256x256","type":"image/png","purpose":"maskable"}
                ]
            })
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
        elif p=="/learning/catalog":
            try:
                qs=parse_qs(urlparse(self.path).query)
                query=str((qs.get("q") or [""])[0]).strip()
                offset=int((qs.get("offset") or ["0"])[0] or 0)
                limit=int((qs.get("limit") or ["80"])[0] or 80)
                self.send_json(200,pronunciation_catalog(query,offset,limit))
            except Exception as e:
                self.send_json(400,{"ok":False,"error":str(e)})
        elif p=="/learning/state":
            self.send_json(200,{"ok":True,**learning_state()})
        elif p=="/alphabet/state":
            self.send_json(200,{"ok":True,**alphabet_master_state()})
        elif p=="/kids-voice/sync-state":
            return self.send_json(200,{"ok":True,**_kids_owner_voice_snapshot()})
        elif p=="/kids-quiz/catalog":
            try:
                return self.send_json(200,_kids_quiz_catalog())
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})
        elif p=="/kids-quiz/audio":
            try:
                qs=parse_qs(urlparse(self.path).query)
                item_id=str((qs.get("id") or [""])[0]).strip()
                row=_kids_quiz_item_by_id(item_id)
                prompt=_kids_quiz_prompt(row,row.get("ageBand"))
                master=_kids_quiz_master_for_prompt(prompt)
                if master.exists() and master.stat().st_size>1024:
                    return self.send_audio_file(master,"audio/wav")
                owner=load_owner_voice_manifest_fresh()
                legacy=load_quiz_audio_manifest_fresh()
                key=_kids_owner_voice_key(prompt)
                entry=(owner.get("entries") or {}).get(key) or (legacy.get("entries") or {}).get(key) or {}
                remote=str(entry.get("url") or "").strip()
                if remote:
                    location=remote if remote.startswith(("http://","https://")) else "https://dar-al-tawhid.de"+remote
                    self.send_response(302)
                    self.send_header("Location",location)
                    self.send_header("Cache-Control","no-store")
                    self.cors()
                    self.end_headers()
                    return
                return self.send_json(404,{"ok":False,"error":"Für diese Quizfrage ist noch kein Serhat-Audio vorhanden."})
            except ValueError as e:
                return self.send_json(404,{"ok":False,"error":str(e)})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})
        elif p=="/alphabet/batch-state":
            self.send_json(200,{"ok":True,**_alphabet_batch_snapshot()})
        elif p=="/prophet-stories/batch-state":
            self.send_json(200,{"ok":True,**_prophet_batch_snapshot()})
        elif p=="/prophet-stories/completed-audio":
            self.send_json(200,_prophet_completed_audio_snapshot())
        elif p=="/prophet-stories/pronunciation-review":
            data=_prophet_review_refresh()
            pending=[x for x in data.get("items",[]) if str((x or {}).get("status") or "pending")=="pending"]
            self.send_json(200,{
                "ok":True,
                "items":pending,
                "count":len(pending),
                "learning":learning_state(),
                "confirmedAudioLocks":len(confirmed_audio_lock_keys()),
                "strictMode":"fusha-audio-lock-required-v1"
            })
        elif p=="/prophet-stories/audio":
            try:
                query=parse_qs(urlparse(self.path).query)
                item_id=str((query.get("id") or [""])[0]).strip()
                age=str((query.get("age") or ["6-8"])[0]).strip()
                asset=_prophet_audio_asset_path(item_id,age)
                if asset is None:
                    return self.send_json(404,{"ok":False,"error":"Diese Geschichte ist noch nicht fertig."})
                return self.send_audio_file(asset,"audio/mp4")
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})
        elif p=="/mubashshirun/library":
            try:
                man=_mubashshirun_story_manifest()
                items=[]
                for it in list(man.get("items") or []):
                    items.append({
                        "id":it.get("id"),
                        "name":it.get("name"),
                        "short":it.get("short"),
                        "nameAr":it.get("nameAr"),
                        "honorific":it.get("honorific"),
                        "summary":it.get("summary"),
                        "trait":it.get("trait"),
                        "sourceRefs":it.get("sourceRefs") or [],
                        "sourceLinks":it.get("sourceLinks") or [],
                        "cover":it.get("cover"),
                        "hero":it.get("hero"),
                        "visualDisclaimer":it.get("visualDisclaimer"),
                        "displayOrder":it.get("displayOrder"),
                        "scripts":it.get("scripts") if isinstance(it.get("scripts"),dict) else {},
                        "audio":it.get("audio") if isinstance(it.get("audio"),dict) else {},
                        "pronunciationTerms":it.get("pronunciationTerms") or [],
                        "voiceProduction":it.get("voiceProduction") if isinstance(it.get("voiceProduction"),dict) else {},
                    })
                self.send_json(200,{
                    "ok":True,
                    "count":len(items),
                    "items":items,
                    "mode":"manual-studio",
                    "sourcePolicy":"quran-sahih-sunnah-no-legends"
                })
            except Exception as e:
                self.send_json(500,{"ok":False,"error":str(e)})
        elif p=="/prophet-stories/library":
            try:
                man=_prophet_story_manifest()
                items=[]
                for it in list(man.get("items") or []):
                    ages={}
                    for a in ("4-5","6-8","9-10"):
                        ages[a]=_prophet_story_age_text(it,a)
                    items.append({
                        "id":it.get("id"),
                        "name":it.get("name"),
                        "nameAr":it.get("nameAr"),
                        "honorific":it.get("honorific"),
                        "title":it.get("title"),
                        "summary":it.get("summary"),
                        "sourceRefs":it.get("sourceRefs") or [],
                        "cover":it.get("cover"),
                        "disputed":bool(it.get("disputed")),
                        "displayOrder":it.get("displayOrder"),
                        "scripts":it.get("scripts") if isinstance(it.get("scripts"),dict) else {},
                        "audio":it.get("audio") if isinstance(it.get("audio"),dict) else {},
                        "texts":ages
                    })
                self.send_json(200,{"ok":True,"count":len(items),"items":items,"mode":"manual-studio"})
            except Exception as e:
                self.send_json(500,{"ok":False,"error":str(e)})
        elif p.startswith("/alphabet/master/"):
            name=p.rsplit("/",1)[-1]
            if not re.fullmatch(r"[a-z0-9_-]+\.wav",name):
                return self.send_json(400,{"ok":False,"error":"Ungültiger Master-Dateiname."})
            self.send_file(ALPHABET_MASTER_HOME/name,"audio/wav")
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
        if not self.remote_authorized():
            return self.reject_remote()
        p=urlparse(self.path).path
        n=int(self.headers.get("Content-Length","0") or 0)
        if p=="/arabic-reference" and n>46*1024*1024:
            return self.send_json(413,{"ok":False,"error":"Arabische Referenzdatei ist zu groß."})
        if p=="/story-media/upload" and n>90*1024*1024:
            return self.send_json(413,{"ok":False,"error":"Story-Audiodatei ist zu groß. Maximal 64 MB Audio hochladen."})
        if p=="/content-audio/reference" and n>90*1024*1024:
            return self.send_json(413,{"ok":False,"error":"Referenz-Audiodatei ist zu groß. Maximal 64 MB Audio hochladen."})
        try:data=json.loads(self.rfile.read(n) or b"{}")
        except Exception:return self.send_json(400,{"error":"Ungültiges JSON"})

        if p=="/mobile/update":
            helper=APP_HOME/"update-mac.command"
            log=APP_HOME/"update.log"
            if not helper.exists():
                return self.send_json(503,{
                    "ok":False,
                    "error":"Update-Helper fehlt auf dem Mac. Voice Studio am Mac einmal aktualisieren."
                })
            try:
                log.parent.mkdir(parents=True,exist_ok=True)
                with log.open("ab",buffering=0) as fh:
                    subprocess.Popen(
                        ["/bin/bash",str(helper)],
                        cwd=str(APP_HOME),
                        stdin=subprocess.DEVNULL,
                        stdout=fh,
                        stderr=fh,
                        start_new_session=True,
                        close_fds=True,
                    )
                return self.send_json(202,{
                    "ok":True,
                    "state":"installing",
                    "engine_version":ENGINE_VERSION,
                    "message":"Update wurde am Mac gestartet. Die Smartphone-App verbindet sich danach automatisch neu."
                })
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":"Update konnte nicht gestartet werden: "+str(e)})

        if p=="/content-audio/reference":
            upload=None
            try:
                kind=str(data.get("kind") or "story").strip().lower()
                if kind not in ("story","dua","duʿāʾ","du'a","narration","erzählung","erzaehlung","content","lesson"):
                    raise ValueError("Inhaltstyp ist für den Audio-Text-Lernspeicher nicht erlaubt.")
                item_id=str(data.get("id") or "").strip()
                age=str(data.get("age") or "all").strip() or "all"
                text=str(data.get("text") or "").strip()
                filename=str(data.get("filename") or "").strip()
                if len(text)<40:
                    raise ValueError("Für den Lernspeicher wird der vollständige zugehörige Text benötigt.")
                upload,info=_install_story_audio_upload(str(data.get("dataUrl") or ""),filename)
                reference=register_story_reference_pair(
                    kind,item_id,text,upload,
                    source_name=info["filename"],
                    age=age,
                    source="manual-owner-content-upload",
                )
                return self.send_json(200,{
                    "ok":True,
                    "reference":{
                        "id":str(reference.get("id") or ""),
                        "kind":str(reference.get("kind") or ""),
                        "prosodyMode":str(reference.get("prosodyMode") or ""),
                        "textSha256":str(reference.get("textSha256") or ""),
                        "audioSha256":str(reference.get("audioSha256") or ""),
                        "durationSec":float(reference.get("durationSec") or 0),
                        "persistent":True,
                        "exactTextAudioReuse":True,
                        "incrementalRerenderForEditedText":True,
                        "modelWeightFineTuning":False,
                    },
                    "learning":learning_state(),
                })
            except ValueError as e:
                return self.send_json(422,{"ok":False,"error":str(e)})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})
            finally:
                try:
                    if upload is not None:
                        Path(upload).unlink(missing_ok=True)
                except Exception:
                    pass

        if p=="/story-media/upload":
            upload=None
            try:
                kind=str(data.get("kind") or "").strip().lower()
                item_id=str(data.get("id") or "").strip()
                age=str(data.get("age") or "").strip()
                text=str(data.get("text") or "").strip()
                filename=str(data.get("filename") or "").strip()
                upload,info=_install_story_audio_upload(
                    str(data.get("dataUrl") or ""),
                    filename
                )
                reference=register_story_reference_pair(
                    kind,item_id,text,upload,
                    source_name=info["filename"],
                    age=age or "all",
                    source="manual-owner-story-upload",
                )
                if kind=="prophet":
                    result=publish_manual_prophet_story(
                        item_id,age or "all",text,
                        source_path=upload,source_name=info["filename"],
                        timings=data.get("timings"),
                        sync_mode=str(data.get("syncMode") or "")
                    )
                elif kind in ("sahabi","ṣaḥābī","mubashshirun"):
                    result=publish_manual_mubashshirun_story(
                        item_id,age,text,
                        source_path=upload,source_name=info["filename"],
                        timings=data.get("timings"),
                        sync_mode=str(data.get("syncMode") or "")
                    )
                elif kind in ("story","dua","duʿāʾ","du'a","narration","erzählung","erzaehlung","content","lesson"):
                    # Allgemeines Content Studio: Die fertige Eigentümer-Audio wird
                    # bewusst nur als private Audio/Text-Referenz gelernt. Die Live-
                    # Veröffentlichung in Kids läuft weiterhin über den geschützten
                    # Content-Worker und wird hier nicht doppelt ausgelöst.
                    result={
                        "ok":True,
                        "registered":True,
                        "kind":kind,
                        "id":item_id,
                        "age":age or "all",
                        "prosodyMode":str(reference.get("prosodyMode") or ""),
                    }
                else:
                    raise ValueError("Unbekannter Story-/Content-Typ.")
                result["upload"]={
                    "filename":info["filename"],
                    "bytes":info["bytes"],
                    "mime":info["mime"],
                }
                result["referenceMemory"]={
                    "id":str(reference.get("id") or ""),
                    "textSha256":str(reference.get("textSha256") or ""),
                    "audioSha256":str(reference.get("audioSha256") or ""),
                    "durationSec":float(reference.get("durationSec") or 0),
                    "persistent":True,
                    "exactTextAudioReuse":True,
                    "incrementalRerenderForEditedText":True,
                }
                return self.send_json(200,result)
            except ValueError as e:
                return self.send_json(422,{"ok":False,"error":str(e)})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})
            finally:
                try:
                    if upload is not None:
                        Path(upload).unlink(missing_ok=True)
                except Exception:
                    pass

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
                preflight=prepare_analysis_preflight(text)
                prepared=str(preflight.get("prepared") or "")
                found=list(preflight.get("found") or [])
                unresolved=list(preflight.get("unresolved") or [])
                mode=resolve_prosody_mode(text,style)
                plan=build_render_plan(prepared,mode)
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
                    "analysisCacheHit":bool(preflight.get("cacheHit")),
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
                    "arabicReferenceDedicated":ARABIC_DEDICATED_REFERENCE,
                    "strictPronunciationState":{
                        "learnedRules":int((LIB.get("counts") or {}).get("userLearnedRules",0) or 0),
                        "confirmedAudioLocks":len(confirmed_audio_lock_keys()),
                        "masterEntries":len(MASTER_ENTRIES)
                    }
                })
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/search":
            try:
                query=str(data.get("query","")).strip()
                if not query: raise ValueError("Suchwort fehlt.")
                return self.send_json(200,{"ok":True,"query":query,"results":pronunciation_candidates(query,int(data.get("limit",12) or 12)),**learning_state()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/sync":
            try:
                result=sync_online_pronunciation_library()
                return self.send_json(200,{"ok":True,**result,**learning_state()})
            except Exception as e:
                return self.send_json(502,{"ok":False,"error":"Online-Wortschatz konnte nicht synchronisiert werden: "+str(e),**learning_state()})

        if p=="/learning/preview-start":
            try:
                return self.send_json(202,start_learning_preview_job(data))
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/learning/preview":
            try:
                # Rückwärtskompatibilität für ältere UI-Versionen. Auch dieser
                # synchrone Pfad benutzt dieselbe serielle Sicherheitszone.
                with LEARNING_PREVIEW_SERIAL_LOCK:
                    LEARNING_PREVIEW_WAITING.set()
                    try:
                        meta=create_learning_preview(
                            str(data.get("term","")),
                            str(data.get("ttsText","")),
                            str(data.get("canonical","")),
                            str(data.get("language","")),
                            int(data.get("variant",0) or 0),
                        )
                    finally:
                        LEARNING_PREVIEW_WAITING.clear()
                b=Path(meta["path"]).read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("X-Learning-Preview-Id",meta["id"])
                self.send_header("X-Learning-Lock-Key",meta["audio_lock_key"])
                self.send_header("X-Learning-Preview-Mode",str(meta.get("previewMode") or "fast"))
                self.send_header("X-Learning-Preview-Ms",str(int(meta.get("elapsedMs") or 0)))
                self.send_header("X-Learning-Variant",str(int(meta.get("variant") or 0)))
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

        if p=="/alphabet/preview":
            try:
                meta=create_alphabet_voice_preview(
                    str(data.get("text","")),
                    str(data.get("slotId","")),
                    int(data.get("variant",0) or 0),
                )
                b=Path(meta["path"]).read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("X-Alphabet-Preview-Id",meta["id"])
                self.send_header("X-Alphabet-Voice","serhat-local-owner-voice")
                self.cors();self.end_headers();self.wfile.write(b)
                return
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e),"status":get_status()})

        if p=="/kids-voice/sync-start":
            try:
                state=start_kids_owner_voice_sync()
                return self.send_json(202,{"ok":True,**state})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e),**_kids_owner_voice_snapshot()})

        if p=="/kids-quiz/render-one":
            try:
                return self.send_json(200,_kids_quiz_render_one(str(data.get("id") or "")))
            except ValueError as e:
                return self.send_json(404,{"ok":False,"error":str(e)})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e)})

        if p=="/alphabet/batch-start":
            try:
                state=start_full_local_kids_voice_pack()
                return self.send_json(202,{"ok":True,**state})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e),**_alphabet_batch_snapshot()})

        if p=="/prophet-stories/batch-start":
            try:
                state=start_prophet_story_voice_pack()
                return self.send_json(202,{"ok":True,**state})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e),**_prophet_batch_snapshot()})
        if p=="/mubashshirun/publish":
            try:
                result=publish_manual_mubashshirun_story(
                    str(data.get("id") or ""),
                    str(data.get("age") or ""),
                    str(data.get("text") or ""),
                    timings=data.get("timings"),
                    sync_mode=str(data.get("syncMode") or "")
                )
                return self.send_json(200,result)
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})
        if p=="/prophet-stories/batch-stop":
            PROPHET_STORY_BATCH_CANCEL.set()
            return self.send_json(200,{"ok":True,"stopRequested":True,**_prophet_batch_snapshot()})
        if p=="/prophet-stories/publish":
            try:
                result=publish_manual_prophet_story(
                    str(data.get("id") or ""),
                    str(data.get("age") or ""),
                    str(data.get("text") or ""),
                    timings=data.get("timings"),
                    sync_mode=str(data.get("syncMode") or "")
                )
                return self.send_json(200,result)
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/alphabet/review-approve":
            try:
                master=approve_existing_alphabet_master(str(data.get("slotId","")))
                return self.send_json(200,{"ok":True,"master":master,**alphabet_master_state()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p=="/alphabet/confirm":
            try:
                master=confirm_alphabet_voice_preview(
                    str(data.get("previewId","")),
                    str(data.get("slotId","")),
                    str(data.get("letterId","")),
                    str(data.get("kind","")),
                    str(data.get("key","")),
                    str(data.get("text","")),
                )
                return self.send_json(200,{"ok":True,"master":master,**alphabet_master_state()})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

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

        if p=="/arabic-reference":
            try:
                result=install_arabic_reference(
                    str(data.get("dataUrl","")),
                    str(data.get("filename",""))
                )
                return self.send_json(200,result)
            except ValueError as e:
                return self.send_json(422,{"ok":False,"error":str(e),"status":get_status()})
            except Exception as e:
                return self.send_json(500,{"ok":False,"error":str(e),"status":get_status()})

        if p in ("/generate-start","/generate-free-start"):
            try:
                result=start_generation_job(data,free_mode=(p=="/generate-free-start"))
                return self.send_json(202,result)
            except PronunciationReviewRequired as e:
                return self.send_json(422,{
                    "ok":False,
                    "error":"Ausspracheprüfung erforderlich.",
                    "items":list(e.items or [])
                })
            except RuntimeError as e:
                return self.send_json(409,{"ok":False,"error":str(e)})
            except Exception as e:
                return self.send_json(400,{"ok":False,"error":str(e)})

        if p in ("/generate","/generate-free"):
            try:
                text=str(data.get("text","")).strip()
                prepared=str(data.get("prepared","")).strip()
                style=str(data.get("style","auto")).strip() or "auto"
                free_mode=(p=="/generate-free")
                free_pronunciation=bool(data.get("pronunciationLibrary",False))
                if not text:raise ValueError("Text fehlt.")
                out=generate(
                    text,prepared,style,
                    free_mode=free_mode,
                    free_pronunciation=free_pronunciation,
                    interactive_fast=bool(data.get("interactiveFast",True))
                )
                record_mobile_generation(out,text,style,free_mode)
                b=out.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("Content-Disposition",'inline; filename="dar-serhat-voice.wav"')
                self.send_header("X-DAR-Output-Name",out.name)
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
        # Auch wenn der Server für den Companion-Modus auf 0.0.0.0 lauscht,
        # wird die lokale Doppelstart-Prüfung immer über Loopback durchgeführt.
        req=urllib.request.Request(f"http://127.0.0.1:{PORT}/health",headers={"Cache-Control":"no-cache"})
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
    print("Companion:", "LAN geschützt aktiv" if NETWORK_MODE and PAIR_TOKEN else "nur lokal", flush=True)

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
        # Bestätigte Audio-Text-Paare werden rein lokal/IO-basiert im Hintergrund
        # registriert. Das blockiert weder UI noch Modell-Warmup.
        threading.Thread(
            target=bootstrap_story_reference_seeds,
            daemon=True,
            name="dar-story-reference-bootstrap"
        ).start()
        # Modell und Online-Wortschatz erst nach erfolgreichem exklusivem Bind vorladen.
        threading.Thread(target=warm_model,daemon=True).start()
        threading.Thread(target=refresh_online_library_if_stale,daemon=True).start()
        threading.Thread(target=_kids_owner_voice_auto_loop,daemon=True,name="dar-kids-owner-voice-auto").start()
        # 2.9.68 Stabilitätsmodus: Eine installierte Release-Version darf sich
        # während des Starts niemals einzelne UI-Dateien von GitHub/main
        # überschreiben. Das erzeugte zuvor Mischversionen zwischen UI und Engine.
        # Nur explizites Entwickler-Opt-in erlaubt diesen Sync noch.
        if os.environ.get("DAR_VOICE_DEV_UI_SYNC","0").strip()=="1":
            threading.Thread(target=refresh_studio_ui_from_github,daemon=True).start()
        threading.Thread(target=_resume_prophet_story_voice_pack_if_needed,daemon=True,name="dar-prophet-auto-resume").start()
        server.serve_forever()
    return 0

if __name__=="__main__":
    raise SystemExit(serve_single_instance())
