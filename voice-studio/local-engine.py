#!/usr/bin/env python3
from __future__ import annotations
import gc, json, os, re, shutil, subprocess, threading, time, traceback, uuid
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

LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
RULES=sorted(LIB.get("rules",[]),key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
PROSODY_MODES=(VOICE_PROFILE.get("prosody") or {}).get("modes",{})
CONTEXT_CONFIG=VOICE_PROFILE.get("contextDetection") or {}
QA_CONFIG=VOICE_PROFILE.get("qualityAssurance") or {}
CONTINUITY_CONFIG=VOICE_PROFILE.get("continuity") or {}
MASTER_TTS={
    str(r.get("tts_text",""))
    for r in RULES
    if r.get("voice_lock")=="MASTER" and r.get("tts_text")
}
AUDIO_LOCK_BY_TTS={
    str(r.get("tts_text","")):str(r.get("audio_lock_key",""))
    for r in RULES
    if r.get("tts_text") and r.get("audio_lock_key")
}
AUDIO_LOCK_LABELS={}
for _r in RULES:
    _key=str(_r.get("audio_lock_key",""))
    if _key and _key not in AUDIO_LOCK_LABELS:
        AUDIO_LOCK_LABELS[_key]=str(_r.get("canonical") or _r.get("string_to_replace") or _key)
AUDIO_LOCK_FORMS=sorted(AUDIO_LOCK_BY_TTS,key=len,reverse=True)
AUDIO_LOCK_STATE_LOCK=threading.Lock()
PENDING_AUDIO_LOCKS={}
PENDING_AUDIO_RENDER_ID=""

MODEL=None
MODEL_DEVICE=None
MODEL_LOCK=threading.Lock()
RENDER_LOCK=threading.Lock()
STATUS_LOCK=threading.Lock()
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

def stage_pending_audio_locks(render_id:str,candidates:dict,sr:int):
    global PENDING_AUDIO_LOCKS,PENDING_AUDIO_RENDER_ID
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
    return out

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
        out.append(str(hit.get("tts_text") or hit.get("alias") or hit["string_to_replace"]))
        found.append(hit)
        pos+=len(str(hit["string_to_replace"]))
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

def load_model(force_device=None):
    global MODEL, MODEL_DEVICE
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
        load_model()
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
            max_chars=180 if lang=="ar" else 280
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

def render_with_model(model,text:str,language_id:str,mode:str="narration"):
    import torch
    p=prosody_settings(mode,language_id,text)
    ref=REF_AR if language_id=="ar" and REF_AR.exists() else REF_DE
    kwargs=dict(
        language_id=language_id,
        audio_prompt_path=str(ref),
        exaggeration=p["exaggeration"],
        cfg_weight=p["cfg_weight"],
        temperature=p["temperature"]
    )
    with torch.inference_mode():
        return model.generate(text,**kwargs)

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

def render_segment_with_qa(model,text:str,language_id:str,mode:str,critical:bool=False):
    import torch
    attempts=max(1,int(QA_CONFIG.get("maxRenderAttempts",2)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    last=None

    for attempt in range(attempts):
        torch.manual_seed(2026+attempt*seed_offset)
        wav=render_with_model(model,text,language_id,mode)
        metrics=audio_quality_metrics(wav,int(model.sr),text,language_id,mode)
        metrics["attempt"]=attempt+1
        metrics["critical"]=bool(critical)
        metrics["rescued"]=False
        last=(wav,metrics)
        if not metrics["issues"]:
            return wav,metrics
        print(f"[DĀR Voice] QA retry {attempt+1}/{attempts} lang={language_id} mode={mode}: {metrics['issues']}",flush=True)

    rescue_allowed={
        "unexpected_internal_hold","excessive_internal_pause","suspicious_sustained_hold",
        "short_arabic_too_long","segment_too_long","speech_rate_too_slow"
    }
    last_issues=set(last[1]["issues"]) if last else set()
    if bool(QA_CONFIG.get("rescueLongSegments",True)) and not critical and last_issues and last_issues.issubset(rescue_allowed):
        parts=split_rescue_chunks(text)
        if len(parts)>1:
            rescued=[]
            rescue_metrics=[]
            for part_idx,part in enumerate(parts):
                torch.manual_seed(2026+(attempts+part_idx)*seed_offset)
                sub=render_with_model(model,part,language_id,mode)
                subm=audio_quality_metrics(sub,int(model.sr),part,language_id,mode)
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
        model=load_model()
        outputs=[]
        qa_segments=[]
        total=len(plan)
        render_id=uuid.uuid4().hex[:12]
        session_audio_locks={}
        new_audio_lock_candidates={}

        for idx,(lang,chunk) in enumerate(plan,1):
            pct=8+int(((idx-1)/max(1,total))*78)
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
                try:
                    wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical)
                except Exception as first_error:
                    if MODEL_DEVICE=="mps":
                        print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                        set_status(message=f"{lang_label} · MPS-Fallback auf CPU …")
                        model=load_model(force_device="cpu")
                        wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical)
                    else:
                        raise
                if audio_lock_key:
                    wav=wav.detach().float().cpu()
                    session_audio_locks[audio_lock_key]=wav.clone()
                    new_audio_lock_candidates[audio_lock_key]=wav.clone()
                    metrics["audio_lock"]="candidate"

            qa_segments.append({
                "index":idx,
                "language":lang,
                "mode":mode,
                "critical":critical,
                **metrics
            })
            outputs.append((wav.detach().float().cpu(),lang,chunk,mode,metrics))

        sr=int(model.sr)
        full=join_rendered_segments(outputs,sr)
        final_metrics=audio_quality_metrics(full,sr,text,"de",doc_mode)
        # Final composite may legitimately contain punctuation pauses; only hard
        # signal defects are fatal here.
        fatal=[x for x in final_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
        if fatal:
            raise RuntimeError("Finale Audio-QA fehlgeschlagen: "+", ".join(fatal))

        staged_audio_locks=stage_pending_audio_locks(render_id,new_audio_lock_candidates,sr) if new_audio_lock_candidates else []

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
        }
        set_status(last_qa=qa_summary)

        set_status(progress=90,message="WAV wird gespeichert …")
        raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
        save_wav(raw,full,sr)
        if not raw.exists() or raw.stat().st_size<=44:
            raise RuntimeError("WAV-Datei wurde nicht korrekt geschrieben.")

        set_status(progress=95,message="Audio-Mastering läuft …")
        out=postprocess(raw)
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
            self.send_file(PRON,"application/json; charset=utf-8")
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
                    "arabicReferenceDedicated":ARABIC_DEDICATED_REFERENCE
                })
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

if __name__=="__main__":
    print("DĀR Voice Engine http://127.0.0.1:8787",flush=True)
    print("Referenz:",REF,flush=True)
    # Modell im Hintergrund vorladen; HTTP bleibt sofort erreichbar.
    threading.Thread(target=warm_model,daemon=True).start()
    VoiceHTTPServer((HOST,PORT),H).serve_forever()
,"",value)
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
        out.append(("lock",hit))
        pos=hit_pos+len(hit)
    return out

def stage_pending_audio_locks(render_id:str,candidates:dict,sr:int):
    global PENDING_AUDIO_LOCKS,PENDING_AUDIO_RENDER_ID
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
    return out

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
        out.append(str(hit.get("tts_text") or hit.get("alias") or hit["string_to_replace"]))
        found.append(hit)
        pos+=len(str(hit["string_to_replace"]))
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

def load_model(force_device=None):
    global MODEL, MODEL_DEVICE
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
        load_model()
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
            max_chars=180 if lang=="ar" else 280
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

def render_with_model(model,text:str,language_id:str,mode:str="narration"):
    import torch
    p=prosody_settings(mode,language_id,text)
    ref=REF_AR if language_id=="ar" and REF_AR.exists() else REF_DE
    kwargs=dict(
        language_id=language_id,
        audio_prompt_path=str(ref),
        exaggeration=p["exaggeration"],
        cfg_weight=p["cfg_weight"],
        temperature=p["temperature"]
    )
    with torch.inference_mode():
        return model.generate(text,**kwargs)

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

def render_segment_with_qa(model,text:str,language_id:str,mode:str,critical:bool=False):
    import torch
    attempts=max(1,int(QA_CONFIG.get("maxRenderAttempts",2)))
    seed_offset=max(1,int(QA_CONFIG.get("retrySeedOffset",97)))
    last=None

    for attempt in range(attempts):
        torch.manual_seed(2026+attempt*seed_offset)
        wav=render_with_model(model,text,language_id,mode)
        metrics=audio_quality_metrics(wav,int(model.sr),text,language_id,mode)
        metrics["attempt"]=attempt+1
        metrics["critical"]=bool(critical)
        metrics["rescued"]=False
        last=(wav,metrics)
        if not metrics["issues"]:
            return wav,metrics
        print(f"[DĀR Voice] QA retry {attempt+1}/{attempts} lang={language_id} mode={mode}: {metrics['issues']}",flush=True)

    rescue_allowed={
        "unexpected_internal_hold","excessive_internal_pause","suspicious_sustained_hold",
        "short_arabic_too_long","segment_too_long","speech_rate_too_slow"
    }
    last_issues=set(last[1]["issues"]) if last else set()
    if bool(QA_CONFIG.get("rescueLongSegments",True)) and not critical and last_issues and last_issues.issubset(rescue_allowed):
        parts=split_rescue_chunks(text)
        if len(parts)>1:
            rescued=[]
            rescue_metrics=[]
            for part_idx,part in enumerate(parts):
                torch.manual_seed(2026+(attempts+part_idx)*seed_offset)
                sub=render_with_model(model,part,language_id,mode)
                subm=audio_quality_metrics(sub,int(model.sr),part,language_id,mode)
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
        model=load_model()
        outputs=[]
        qa_segments=[]
        total=len(plan)
        render_id=uuid.uuid4().hex[:12]
        session_audio_locks={}
        new_audio_lock_candidates={}

        for idx,(lang,chunk) in enumerate(plan,1):
            pct=8+int(((idx-1)/max(1,total))*78)
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
                try:
                    wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical)
                except Exception as first_error:
                    if MODEL_DEVICE=="mps":
                        print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                        set_status(message=f"{lang_label} · MPS-Fallback auf CPU …")
                        model=load_model(force_device="cpu")
                        wav,metrics=render_segment_with_qa(model,chunk,lang,mode,critical)
                    else:
                        raise
                if audio_lock_key:
                    wav=wav.detach().float().cpu()
                    session_audio_locks[audio_lock_key]=wav.clone()
                    new_audio_lock_candidates[audio_lock_key]=wav.clone()
                    metrics["audio_lock"]="candidate"

            qa_segments.append({
                "index":idx,
                "language":lang,
                "mode":mode,
                "critical":critical,
                **metrics
            })
            outputs.append((wav.detach().float().cpu(),lang,chunk,mode,metrics))

        sr=int(model.sr)
        full=join_rendered_segments(outputs,sr)
        final_metrics=audio_quality_metrics(full,sr,text,"de",doc_mode)
        # Final composite may legitimately contain punctuation pauses; only hard
        # signal defects are fatal here.
        fatal=[x for x in final_metrics["issues"] if x in ("empty_audio","non_finite","near_silence","low_peak","clipping","too_short")]
        if fatal:
            raise RuntimeError("Finale Audio-QA fehlgeschlagen: "+", ".join(fatal))

        staged_audio_locks=stage_pending_audio_locks(render_id,new_audio_lock_candidates,sr) if new_audio_lock_candidates else []

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
        }
        set_status(last_qa=qa_summary)

        set_status(progress=90,message="WAV wird gespeichert …")
        raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
        save_wav(raw,full,sr)
        if not raw.exists() or raw.stat().st_size<=44:
            raise RuntimeError("WAV-Datei wurde nicht korrekt geschrieben.")

        set_status(progress=95,message="Audio-Mastering läuft …")
        out=postprocess(raw)
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
            self.send_file(PRON,"application/json; charset=utf-8")
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
                    "arabicReferenceDedicated":ARABIC_DEDICATED_REFERENCE
                })
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

if __name__=="__main__":
    print("DĀR Voice Engine http://127.0.0.1:8787",flush=True)
    print("Referenz:",REF,flush=True)
    # Modell im Hintergrund vorladen; HTTP bleibt sofort erreichbar.
    threading.Thread(target=warm_model,daemon=True).start()
    VoiceHTTPServer((HOST,PORT),H).serve_forever()
