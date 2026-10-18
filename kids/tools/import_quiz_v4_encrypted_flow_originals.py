#!/usr/bin/env python3
"""Restore ALREADY GENERATED eleven_v4 MP3(s) via encrypted signed provider URLs.

Zero text-to-speech requests. The encrypted URL cannot appear in logs or Git.
This runner downloads REAL previously charged bytes, verifies MP3, and adds
originals and provider receipts to the private Quiz V4 original registry.
"""
from __future__ import annotations
import base64,hashlib,json,os,re,subprocess,tempfile,urllib.parse,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MANIFEST=ROOT/"kids/review-only/quiz-v4-generated-awaiting-original-import.json"
SEALED=ROOT/"kids/data/v4-new-audio-envelope-review/sealed-oaep.json"
PRIVATE_KEY=ROOT/"kids/data/v4-prepaid-envelope-review/private-key-encrypted.pem"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def load(path):return json.loads(path.read_text(encoding="utf-8"))
def write(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+".new")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(path)
def require(test,message):
    if not test:raise RuntimeError("V4_REAL_ORIGINAL_IMPORT_STOPPED: "+message)
def sha(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()

def retrieve_one(row,known,key_path):
    require(row.get("generationId")==known["generationId"] and
            row.get("textSha256")==known["textSha256"] and
            row.get("modelId")==MODEL and row.get("voiceId")==VOICE,
            "original generation/voice/text SHA changed")
    gid=row["generationId"];sid=row["sessionId"]
    require(re.fullmatch("[A-Za-z0-9]{20}",gid) and
            re.fullmatch("[A-Za-z0-9]{20}",sid),"provider ID malformed")
    chunks=row["cipherChunks"]
    require(isinstance(chunks,list) and 1<=len(chunks)<=15,
            "original signed download not properly sealed")
    decrypted=[]
    for chunk in chunks:
        cipher=base64.b64decode(chunk,validate=True)
        require(len(cipher)==384,"invalid RSA-3072 encrypted chunk")
        cmd=["openssl","pkeyutl","-decrypt","-inkey",str(key_path),
             "-pkeyopt","rsa_padding_mode:oaep","-pkeyopt","rsa_oaep_md:sha256",
             "-pkeyopt","rsa_mgf1_md:sha256"]
        decrypted.append(subprocess.run(cmd,input=cipher,capture_output=True,check=True).stdout)
    url=b"".join(decrypted).decode("ascii")
    parsed=urllib.parse.urlsplit(url)
    require(parsed.scheme=="https" and parsed.hostname=="storage.googleapis.com"
            and "/content_generation/"+sid+"/"+gid+"/content.mp3" in parsed.path
            and "X-Goog-Signature=" in parsed.query and not parsed.username,
            "signed original source is NOT the correct ElevenLabs Flow MP3")
    # Never print or persist the signed URL, query, or provider credentials.
    req=urllib.request.Request(url,headers={"User-Agent":"TAWHID-KIDS-EXISTING-V4-ORIGINAL/1.0"})
    with urllib.request.urlopen(req,timeout=75) as resp:
        require(resp.status==200,"previously paid original bytes unavailable")
        audio=resp.read(2_000_001)
    require(2000<len(audio)<2_000_001 and
            (audio.startswith(b"ID3") or audio[:1]==b"\xff"),
            "provider media was not a complete small original MP3")
    return audio

def main():
    require(bool(os.getenv("ELEVENLABS_API_KEY")),
            "original decrypt secret unavailable, but no credits will be spent")
    require(SEALED.is_file(),"no encrypted originals to import")
    sealed=load(SEALED);manifest=load(MANIFEST);reg=load(REG);ledger=load(LEDGER)
    require(isinstance(sealed,list) and 1<=len(sealed)<=10,
            "only 1–10 known existing originals per encrypted ZIP-free batch")
    require(reg["modelId"]==MODEL and reg["voiceId"]==VOICE and reg["live"] is False
            and ledger["live"] is False and manifest["releaseAllowed"] is False,
            "wrong master voice or accidentally live release")
    by_id={r["generationId"]:r for r in manifest["items"]}
    require(len(by_id)==len(manifest["items"]),"duplicate provider generation IDs")
    require(len({x["generationId"] for x in sealed})==len(sealed),
            "same paid original referenced twice")
    key_path=None
    try:
        with tempfile.TemporaryDirectory() as d:
            key_path=Path(d)/"private.pem"
            subprocess.run(
                ["openssl","pkcs8","-in",str(PRIVATE_KEY),"-passin",
                 "env:ELEVENLABS_API_KEY","-out",str(key_path)],
                check=True,capture_output=True)
            OUT.mkdir(parents=True,exist_ok=True)
            count=0
            for row in sealed:
                gid=row["generationId"];require(gid in by_id,"unrecognized paid original")
                known=by_id[gid]
                require(known["chargedOrGeneratedOnce"] is True and
                        known["regenerationAllowed"] is False
                        and known["modelId"]==MODEL and known["voiceId"]==VOICE,
                        "audio not previously paid by ElevenLabs")
                text=known["text"];text_hash=sha(text)
                require(text_hash==known["textSha256"],
                        "recorded original text SHA changed")
                file_id=sha(VOICE+"\n"+MODEL+"\n"+text)[:32]
                dest=OUT/(file_id+".mp3")
                old=reg["textClips"].get(text)
                if old:
                    require(dest.is_file() and
                            hashlib.sha256(dest.read_bytes()).hexdigest()==old["sha256"],
                            "original already registered but cannot verify real file")
                    print("PRESENT_ALREADY_PAID_MP3_SKIPPED",gid)
                    continue
                require(not dest.exists(),
                        "unregistered MP3 bytes exist: reconcile manually, no duplicate")
                audio=retrieve_one(row,known,key_path)
                dest.write_bytes(audio)
                try:
                    check=subprocess.run(["ffprobe","-v","error","-select_streams","a:0",
                        "-show_entries","stream=codec_name","-of","default=noprint_wrappers=1",
                        str(dest)],capture_output=True,text=True,check=True)
                    require("codec_name=mp3" in check.stdout,"the provider returned non-MP3 media")
                    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(dest),
                                    "-f","null","-"],capture_output=True,check=True)
                except Exception:
                    dest.unlink(missing_ok=True)
                    raise
                audiosha=hashlib.sha256(audio).hexdigest()
                reg["textClips"][text]={
                    "url":"/"+str(dest.relative_to(ROOT)),
                    "textSha256":text_hash,"sha256":audiosha,"bytes":len(audio),
                    "modelId":MODEL,"voiceId":VOICE,
                    "audioListeningApproved":False,
                    "qaApproval":"pending-human-auditory-review",
                    "source":"official-elevenlabs-flow-original-existing-generation",
                    "status":"completed-original-mp3-on-review-branch-not-live",
                    "providerRequestId":gid}
                ledger["rows"].append({
                    "batchId":"KIDS_V4_EXACT_EXISTING_FLOW_ORIGINAL",
                    "text":text,"textSha256":text_hash,
                    "estimatedCreditsAtObservedRate":known["approximateReportedCredits"],
                    "exactBilledCredits":None,"mp3Sha256":audiosha,
                    "providerRequestId":gid,"providerSessionId":known["sessionId"],
                    "note":"Existing completed eleven_v4 Flow original; NO NEW TTS POST"});
                known["originalMp3ContentChecksum"]=audiosha
                known["status"]="PROVIDER_ORIGINAL_MP3_IMPORTED_PRIVATE_QUIZ"
                write(REG,reg);write(LEDGER,ledger);write(MANIFEST,manifest)
                count+=1
                print("REAL_ELEVEN_V4_ORIGINAL_IMPORTED",gid,"mp3Bytes",len(audio))
            print("TOTAL_REAL_V4_MP3S_IMPORTED",count,"TTS_POST_REQUESTS",0)
    finally:
        pass

if __name__=="__main__": main()
