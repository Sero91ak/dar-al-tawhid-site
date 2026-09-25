#!/usr/bin/env python3
from __future__ import annotations
import json, os, re, subprocess, threading, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[2]
PRON=ROOT/"data/pronunciation/pronunciation-rules.json"
PROFILE=ROOT/"data/pronunciation/voice-production-profile.json"
VOICE_HOME=Path.home()/"SerhatVoice"
_ref_env=os.environ.get("SERHAT_VOICE_REF")
if _ref_env:
    REF=Path(_ref_env).expanduser()
else:
    _adobe=VOICE_HOME/"Serhat_Adobe_MASTER.wav"
    _final=VOICE_HOME/"Serhat_FINAL_REF.wav"
    REF=_adobe if _adobe.exists() else _final
HOST=os.environ.get("DAR_VOICE_HOST","127.0.0.1")
PORT=int(os.environ.get("DAR_VOICE_PORT","8787"))
OUTPUT=Path(os.environ.get("DAR_VOICE_OUTPUT",str(VOICE_HOME/"VoiceStudioOutput"))).expanduser()
OUTPUT.mkdir(parents=True,exist_ok=True)
LIB=json.load(PRON.open(encoding="utf-8"))
VOICE_PROFILE=json.load(PROFILE.open(encoding="utf-8"))
RULES=sorted(LIB.get("rules",[]),key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
MODEL=None
MODEL_LOCK=threading.Lock()

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
        out.append(str(hit.get("alias") or hit["string_to_replace"]))
        found.append(hit)
        pos+=len(str(hit["string_to_replace"]))
    return "".join(out),found

def quran_guard(text:str):
    """Nur echte zusammenhängende arabische Passagen blockieren.

    Einzelne arabische Fachbegriffe/Namen in einem deutschen Satz (z. B.
    الله, الإسلام, القرآن, التوحيد) sind ausdrücklich erlaubt.
    """
    value=str(text or "")
    arabic_chars=len(re.findall(r"[\u0600-\u06ff]",value))
    if arabic_chars<24:
        return

    max_run=0
    run=0
    arabic_tokens=0
    punctuation=re.compile(r'^[\.,،؛:!?؟…·\-–—()\[\]{}«»"“”„‘’]+
def load_model():
    global MODEL
    if MODEL is not None:return MODEL
    with MODEL_LOCK:
        if MODEL is not None:return MODEL
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        device="mps" if torch.backends.mps.is_available() else "cpu"
        MODEL=ChatterboxMultilingualTTS.from_pretrained(device=device,t3_model="v3")
    return MODEL

def postprocess(src:Path):
    if subprocess.run(["/usr/bin/env","bash","-lc","command -v ffmpeg"],capture_output=True).returncode!=0:
        return src
    dst=src.with_name(src.stem+"_master.wav")
    filt="highpass=f=65,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=7"
    p=subprocess.run(["ffmpeg","-y","-i",str(src),"-af",filt,str(dst)],capture_output=True)
    return dst if p.returncode==0 and dst.exists() else src

def generate(text:str):
    quran_guard(text)
    if not REF.exists():raise RuntimeError("Referenzstimme fehlt: "+str(REF))
    prepared,_=prepare(text)
    import torch,torchaudio as ta
    model=load_model()
    torch.manual_seed(2026)
    wav=model.generate(
        prepared,
        language_id="de",
        audio_prompt_path=str(REF),
        exaggeration=0.22,
        cfg_weight=0.30,
        temperature=0.55
    )
    raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
    ta.save(str(raw),wav.cpu(),model.sr)
    return postprocess(raw)

class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Private-Network","true")
        self.send_header("Cache-Control","no-store")

    def send_json(self,status,obj):
        b=json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(b)))
        self.cors()
        self.end_headers()
        self.wfile.write(b)

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        p=urlparse(self.path).path
        if p=="/health":
            ok=REF.exists()
            self.send_json(200,{
                "ok":ok,
                "provider":"chatterbox-v3",
                "reference":str(REF),
                "reference_exists":ok,
                "library":LIB.get("counts",{}),
                "profile":VOICE_PROFILE.get("delivery",{})
            })
        elif p=="/capabilities":
            self.send_json(200,{
                "providers":{
                    "chatterbox":{"available":True,"active":True},
                    "omnivoice":{"available":False,"active":False},
                    "elevenlabs":{"available":False,"active":False}
                },
                "quran_recitation":"real-recording-only",
                "formats":["wav"]
            })
        else:
            self.send_json(404,{"error":"not found"})

    def do_POST(self):
        p=urlparse(self.path).path
        n=int(self.headers.get("Content-Length","0") or 0)
        try:
            data=json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.send_json(400,{"error":"Ungültiges JSON"})
        if p=="/analyze":
            text=str(data.get("text",""))
            prepared,found=prepare(text)
            return self.send_json(200,{"original":text,"prepared":prepared,"terms":found})
        if p=="/generate":
            try:
                text=str(data.get("text","")).strip()
                if not text:raise ValueError("Text fehlt.")
                out=generate(text)
                b=out.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("Content-Disposition",'inline; filename="dar-voice.wav"')
                self.cors()
                self.end_headers()
                self.wfile.write(b)
            except Exception as e:
                return self.send_json(500,{"error":str(e)})
        else:
            self.send_json(404,{"error":"not found"})

    def log_message(self,fmt,*args):
        print("[Voice]",fmt%args)

if __name__=="__main__":
    print("DĀR Voice Engine http://%s:%s"%(HOST,PORT))
    print("Referenz:",REF)
    ThreadingHTTPServer((HOST,PORT),H).serve_forever()
)
    for token in re.findall(r"\S+",value):
        has_arabic=bool(re.search(r"[\u0600-\u06ff]",token))
        has_latin=bool(re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]",token))
        if has_arabic and not has_latin:
            run+=1
            arabic_tokens+=1
            max_run=max(max_run,run)
        elif punctuation.fullmatch(token):
            # Satzzeichen zwischen arabischen Wörtern unterbrechen die Passage nicht.
            continue
        else:
            run=0

    letters=len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ\u0600-\u06ff]",value))
    arabic_ratio=arabic_chars/max(1,letters)

    # Schutz nur bei einer echten arabischen Passage – nicht bei Code-Switching.
    if max_run>=4 or (arabic_ratio>=0.70 and arabic_tokens>=4):
        raise ValueError("Zusammenhängende arabische Qurʾān-/Rezitationspassage erkannt. Verwende dafür echte Rezitation.")

def load_model():
    global MODEL
    if MODEL is not None:return MODEL
    with MODEL_LOCK:
        if MODEL is not None:return MODEL
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        device="mps" if torch.backends.mps.is_available() else "cpu"
        MODEL=ChatterboxMultilingualTTS.from_pretrained(device=device,t3_model="v3")
    return MODEL

def postprocess(src:Path):
    if subprocess.run(["/usr/bin/env","bash","-lc","command -v ffmpeg"],capture_output=True).returncode!=0:
        return src
    dst=src.with_name(src.stem+"_master.wav")
    filt="highpass=f=65,acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=7"
    p=subprocess.run(["ffmpeg","-y","-i",str(src),"-af",filt,str(dst)],capture_output=True)
    return dst if p.returncode==0 and dst.exists() else src

def generate(text:str):
    quran_guard(text)
    if not REF.exists():raise RuntimeError("Referenzstimme fehlt: "+str(REF))
    prepared,_=prepare(text)
    import torch,torchaudio as ta
    model=load_model()
    torch.manual_seed(2026)
    wav=model.generate(
        prepared,
        language_id="de",
        audio_prompt_path=str(REF),
        exaggeration=0.22,
        cfg_weight=0.30,
        temperature=0.55
    )
    raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
    ta.save(str(raw),wav.cpu(),model.sr)
    return postprocess(raw)

class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Headers","Content-Type")
        self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Private-Network","true")
        self.send_header("Cache-Control","no-store")

    def send_json(self,status,obj):
        b=json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(b)))
        self.cors()
        self.end_headers()
        self.wfile.write(b)

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.end_headers()

    def do_GET(self):
        p=urlparse(self.path).path
        if p=="/health":
            ok=REF.exists()
            self.send_json(200,{
                "ok":ok,
                "provider":"chatterbox-v3",
                "reference":str(REF),
                "reference_exists":ok,
                "library":LIB.get("counts",{}),
                "profile":VOICE_PROFILE.get("delivery",{})
            })
        elif p=="/capabilities":
            self.send_json(200,{
                "providers":{
                    "chatterbox":{"available":True,"active":True},
                    "omnivoice":{"available":False,"active":False},
                    "elevenlabs":{"available":False,"active":False}
                },
                "quran_recitation":"real-recording-only",
                "formats":["wav"]
            })
        else:
            self.send_json(404,{"error":"not found"})

    def do_POST(self):
        p=urlparse(self.path).path
        n=int(self.headers.get("Content-Length","0") or 0)
        try:
            data=json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self.send_json(400,{"error":"Ungültiges JSON"})
        if p=="/analyze":
            text=str(data.get("text",""))
            prepared,found=prepare(text)
            return self.send_json(200,{"original":text,"prepared":prepared,"terms":found})
        if p=="/generate":
            try:
                text=str(data.get("text","")).strip()
                if not text:raise ValueError("Text fehlt.")
                out=generate(text)
                b=out.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type","audio/wav")
                self.send_header("Content-Length",str(len(b)))
                self.send_header("Content-Disposition",'inline; filename="dar-voice.wav"')
                self.cors()
                self.end_headers()
                self.wfile.write(b)
            except Exception as e:
                return self.send_json(500,{"error":str(e)})
        else:
            self.send_json(404,{"error":"not found"})

    def log_message(self,fmt,*args):
        print("[Voice]",fmt%args)

if __name__=="__main__":
    print("DĀR Voice Engine http://%s:%s"%(HOST,PORT))
    print("Referenz:",REF)
    ThreadingHTTPServer((HOST,PORT),H).serve_forever()
