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
_ref_env=os.environ.get("SERHAT_VOICE_REF")
if _ref_env:
    REF=Path(_ref_env).expanduser()
else:
    _adobe=VOICE_HOME/"Serhat_Adobe_MASTER.wav"
    _final=VOICE_HOME/"Serhat_FINAL_REF.wav"
    REF=_adobe if _adobe.exists() else _final

HOST="127.0.0.1"
PORT=8787
OUTPUT=VOICE_HOME/"VoiceStudioOutput"
OUTPUT.mkdir(parents=True,exist_ok=True)

LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
RULES=sorted(LIB.get("rules",[]),key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)

MODEL=None
MODEL_DEVICE=None
MODEL_LOCK=threading.Lock()
RENDER_LOCK=threading.Lock()
STATUS_LOCK=threading.Lock()
TORCH_LOAD_ORIGINAL=None

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
}

def set_status(**updates):
    with STATUS_LOCK:
        STATUS.update(updates)

def get_status():
    with STATUS_LOCK:
        out=dict(STATUS)
    out["reference"]=str(REF)
    out["reference_exists"]=REF.exists()
    out["output_dir"]=str(OUTPUT)
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
    for lang,segment in split_language_segments(text):
        max_chars=180 if lang=="ar" else 280
        for chunk in split_chunks(segment,max_chars=max_chars):
            if chunk.strip():
                plan.append((lang,chunk.strip()))
    return plan

def render_with_model(model,text:str,language_id:str):
    import torch
    # Arabische Einzelbegriffe sollen neutral und flüssig gesprochen werden,
    # nicht wie isolierte dramatische Clips. Deutsch behält das bisherige Profil.
    is_ar=language_id=="ar"
    short_ar=is_ar and len(str(text).strip())<=48
    kwargs=dict(
        language_id=language_id,
        audio_prompt_path=str(REF),
        exaggeration=0.12 if short_ar else (0.18 if is_ar else 0.22),
        cfg_weight=0.0 if is_ar else 0.30,
        temperature=0.44 if short_ar else (0.50 if is_ar else 0.55)
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

    # Etwa -49 dB relativ zum Segmentpeak; 20 ms Sicherheit an beiden Rändern.
    threshold=max(peak*0.0035,1e-5)
    active=torch.nonzero(envelope>threshold).flatten()
    if active.numel()==0:
        return w

    pad=max(1,int(sr*0.020))
    start=max(0,int(active[0].item())-pad)
    end=min(w.shape[-1],int(active[-1].item())+pad+1)
    return w[...,start:end]

def segment_rms(wav):
    import torch
    w=normalize_segment_shape(wav)
    if not w.numel():
        return 0.0
    return float(torch.sqrt(torch.mean(w*w)+1e-12).item())

def gently_level_segments(items):
    """Kleine Pegelsprünge glätten, ohne die natürliche Dynamik plattzumachen."""
    import statistics
    levels=[segment_rms(w) for w,_,_ in items]
    valid=[x for x in levels if x>1e-5]
    if not valid:
        return items
    target=float(statistics.median(valid))
    out=[]
    for (w,lang,chunk),level in zip(items,levels):
        if level>1e-5:
            gain=max(0.88,min(1.14,target/level))
            w=(w*gain).clamp(-0.995,0.995)
        out.append((w,lang,chunk))
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
    for wav,lang,chunk in items:
        cleaned.append((trim_segment_edges(wav,sr),lang,chunk))
    cleaned=gently_level_segments(cleaned)

    full=cleaned[0][0]
    prev_lang=cleaned[0][1]
    prev_chunk=cleaned[0][2]

    for wav,lang,chunk in cleaned[1:]:
        sentence_end=bool(re.search(r"[.!?؟…]$",prev_chunk.strip()))
        soft_pause=bool(re.search(r"[,،;؛:]$",prev_chunk.strip()))

        if sentence_end:
            # Satzende darf atmen, aber ohne die alte 160-ms-Zwangspause.
            silence=torch.zeros((1,max(1,int(sr*0.085))),dtype=full.dtype)
            full=torch.cat([full,silence,wav],dim=-1)
        elif soft_pause:
            silence=torch.zeros((1,max(1,int(sr*0.035))),dtype=full.dtype)
            full=torch.cat([full,silence,wav],dim=-1)
        else:
            # Sprachwechsel in einem laufenden Satz: keine Pause, sondern
            # 26–32 ms Überblendung. Dadurch kein Stoppen/Neuansetzen.
            xfade=0.032 if prev_lang!=lang else 0.022
            full=crossfade_audio(full,wav,sr,xfade)

        prev_lang=lang
        prev_chunk=chunk

    # Mini-Fades verhindern Klicks am Dateianfang/-ende.
    edge=max(1,min(int(sr*0.012),full.shape[-1]//4))
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

def generate(text:str,prepared:str=""):
    quran_guard(text)
    if not REF.exists():
        raise RuntimeError("Referenzstimme fehlt: "+str(REF))

    # Client-"prepared" wird bewusst ignoriert: ältere Studio-Versionen senden
    # noch Kunstlautungen wie "Tauhiid". Die Engine baut den Sprechtext selbst
    # aus der aktuellen Bibliothek und den nativen arabischen TTS-Formen.
    speak=prepare(text)[0]
    plan=build_render_plan(speak)
    if not plan:
        raise ValueError("Sprechtext ist leer.")

    if not RENDER_LOCK.acquire(blocking=False):
        raise RuntimeError("Es läuft bereits eine Audio-Erzeugung.")

    set_status(
        render_state="rendering",
        progress=1,
        render_started_at=time.time(),
        render_finished_at=None,
        last_error="",
        message="Audio wird vorbereitet …"
    )

    try:
        import torch
        model=load_model()
        outputs=[]
        total=len(plan)

        for idx,(lang,chunk) in enumerate(plan,1):
            pct=8+int(((idx-1)/max(1,total))*78)
            lang_label="Arabisch" if lang=="ar" else "Deutsch"
            set_status(progress=pct,message=f"{lang_label} · Abschnitt {idx}/{total} …")
            print(f"[DĀR Voice] segment {idx}/{total} lang={lang}: {chunk}",flush=True)
            # Gleicher Seed pro Segment stabilisiert Timbre und Sprechhaltung
            # über Deutsch/Arabisch-Grenzen hinweg.
            torch.manual_seed(2026)
            try:
                wav=render_with_model(model,chunk,lang)
            except Exception as first_error:
                # Bei MPS-Problemen einmal sauber auf CPU wiederholen.
                if MODEL_DEVICE=="mps":
                    print("[DĀR Voice] MPS render failed, retry CPU:",first_error,flush=True)
                    set_status(message=f"{lang_label} · MPS-Fallback auf CPU …")
                    model=load_model(force_device="cpu")
                    wav=render_with_model(model,chunk,lang)
                else:
                    raise
            outputs.append((wav.detach().float().cpu(),lang,chunk))

        sr=int(model.sr)
        full=join_rendered_segments(outputs,sr)

        set_status(progress=90,message="WAV wird gespeichert …")
        raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
        save_wav(raw,full,int(model.sr))
        if not raw.exists() or raw.stat().st_size<=44:
            raise RuntimeError("WAV-Datei wurde nicht korrekt geschrieben.")

        set_status(progress=95,message="Audio-Mastering läuft …")
        out=postprocess(raw)
        set_status(
            render_state="done",
            progress=100,
            message="Audio fertig",
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

        if p=="/generate":
            try:
                text=str(data.get("text","")).strip()
                prepared=str(data.get("prepared","")).strip()
                if not text:raise ValueError("Text fehlt.")
                out=generate(text,prepared)
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
