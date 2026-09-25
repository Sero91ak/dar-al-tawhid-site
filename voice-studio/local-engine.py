#!/usr/bin/env python3
from __future__ import annotations
import json, os, re, subprocess, threading, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

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
    arabic=len(re.findall(r"[\u0600-\u06ff]",text))
    if arabic>=24 and arabic/max(1,len(text))>.22:
        raise ValueError("Qurʾān-/Rezitationsaudio wird nicht synthetisch erzeugt. Verwende dafür echte Rezitation.")

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

def generate(text:str,prepared:str=""):
    quran_guard(text)
    if not REF.exists():raise RuntimeError("Referenzstimme fehlt: "+str(REF))
    speak=prepared.strip() if prepared.strip() else prepare(text)[0]
    import torch,torchaudio as ta
    model=load_model()
    torch.manual_seed(2026)
    wav=model.generate(speak,language_id="de",audio_prompt_path=str(REF),exaggeration=0.22,cfg_weight=0.30,temperature=0.55)
    raw=OUTPUT/f"dar_voice_{uuid.uuid4().hex[:10]}.wav"
    ta.save(str(raw),wav.cpu(),model.sr)
    return postprocess(raw)

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
    def do_GET(self):
        p=urlparse(self.path).path
        if p=="/health":
            ok=REF.exists()
            self.send_json(200,{"ok":ok,"provider":"Chatterbox Multilingual V3","reference_exists":ok,"library":LIB.get("counts",{}),"profile":VOICE_PROFILE.get("delivery",{})})
        else:self.send_json(404,{"error":"not found"})
    def do_POST(self):
        p=urlparse(self.path).path
        n=int(self.headers.get("Content-Length","0") or 0)
        try:data=json.loads(self.rfile.read(n) or b"{}")
        except Exception:return self.send_json(400,{"error":"Ungültiges JSON"})
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
            except Exception as e:return self.send_json(500,{"error":str(e)})
        else:self.send_json(404,{"error":"not found"})
    def log_message(self,fmt,*args):
        print("[DĀR Voice]",fmt%args)

if __name__=="__main__":
    print("DĀR Voice Engine http://127.0.0.1:8787")
    print("Referenz:",REF)
    ThreadingHTTPServer((HOST,PORT),H).serve_forever()
