#!/usr/bin/env python3
"""Recover one EXISTING confirmed-paid ElevenLabs V4 MP3 using an RSA-OAEP-sealed
short-lived provider URL. No paid TTS, no regeneration, no public playback.

The repository stores only OAEP ciphertext. The GitHub runner decrypts its
pre-existing private key using ELEVENLABS_API_KEY; signed bearer URLs and key
material remain only in process memory and temporary mode-0600 files.
"""
from __future__ import annotations
import argparse, base64, json, os, pathlib, re, subprocess, sys, tempfile
import urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from import_quiz_v4_connected_flow_originals import expected, run
SEALED=ROOT/"kids/data/v4-connected-signed-import/sealed-creative-original.json"
PRIVATE=ROOT/"kids/data/v4-prepaid-envelope-review/private-key-encrypted.pem"
REPORT=ROOT/"kids/review-only/quiz-v4-connected-flow-get-only-recovery-report.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def ensure(ok,msg):
    if not ok: raise RuntimeError("KIDS_V4_SIGNED_ORIGINAL_IMPORT_BLOCKED: "+msg)

def read(p):return json.loads(p.read_text(encoding="utf-8"))

def metadata():
    ensure(SEALED.is_file(),"no encrypted provider-original export yet")
    m=read(SEALED)
    ensure(m.get("schemaVersion")==1 and m.get("type")=="single-confirmed-creative-v4-original-signed-get"
           and m.get("modelId")==MODEL and m.get("voiceId")==VOICE,
           "incompatible V4 signed URL envelope")
    gid=m.get("generationId")
    ensure(isinstance(gid,str) and re.fullmatch(r"[A-Za-z0-9]{20}",gid),
           "invalid generation ID")
    chunks=m.get("cipherChunks")
    ensure(isinstance(chunks,list) and 1<=len(chunks)<=15,"unexpected cipher chunk count")
    for cipher in chunks:
        ensure(isinstance(cipher,str) and
               len(base64.b64decode(cipher,validate=True))==384,
               "RSA3072-OAEP ciphertext invalid")
    flow,registry,ledger,by_gid,by_text=expected()
    match=by_gid.get(gid)
    ensure(match is not None and match["voiceId"]==VOICE and match["modelId"]==MODEL,
           "not a preconfirmed paid V4 generation from connected receipt ledger")
    e=by_text[match["text"]]
    ensure(e["sourceTextSHA256"]==m.get("textSHA256"),"source text SHA mismatch")
    ensure(e["status"] in ("GENERATED_AWAITING_ORIGINAL_MP3_IMPORT",
                           "IMPORTED_ORIGINAL_MP3_VERIFIED"),
           "provider original is not confirmed or is reserved but unpaid")
    ensure(e.get("providerStatus")=="completed" and
           isinstance(e.get("actualProviderCredits"),(int,float)),
           "missing provider completed generation and original credit receipt")
    ensure(e.get("generationId")==gid and e.get("sessionId") and e.get("flowId"),
           "provider session link absent")
    return m,e

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--audit",action="store_true")
    ap.add_argument("--import",dest="perform_import",action="store_true")
    args=ap.parse_args()
    ensure(args.audit != args.perform_import, "choose --audit or --import")
    if not SEALED.is_file():
        print("KIDS_SIGNED_ORIGINAL_SKIP no sealed URL supplied; no TTS",flush=True)
        return
    m,e=metadata()
    if e["status"]=="IMPORTED_ORIGINAL_MP3_VERIFIED":
        print("KIDS_SIGNED_ORIGINAL_ALREADY_IMPORTED no re-download",flush=True)
        return
    if args.audit:
        print("PASS_KIDS_V4_SEALED_OLD_PAID_AUDIO_READY",
              m["generationId"],"no internet, no TTS, no credits",flush=True)
        return
    key=os.environ.get("ELEVENLABS_API_KEY","")
    ensure(bool(key) and PRIVATE.is_file(),
           "encrypted V4 private key or GitHub API-key secret unavailable")
    with tempfile.TemporaryDirectory(prefix="kids-v4-original-only-") as td:
        home=pathlib.Path(td);pkey=home/"original-private.pem";inbox=home/"originals"
        inbox.mkdir()
        pkey.touch(mode=0o600)
        try:
            subprocess.run(
                ["openssl","pkcs8","-in",str(PRIVATE),"-passin",
                 "env:ELEVENLABS_API_KEY","-out",str(pkey)],
                check=True,capture_output=True,env=os.environ)
        except subprocess.CalledProcessError:
            raise RuntimeError("Encrypted key unavailable; no URL/MP3 accessed, never pay for this audio again")
        pieces=[]
        for b64 in m["cipherChunks"]:
            encrypted=base64.b64decode(b64,validate=True)
            try:
                dec=subprocess.run([
                    "openssl","pkeyutl","-decrypt","-inkey",str(pkey),
                    "-pkeyopt","rsa_padding_mode:oaep",
                    "-pkeyopt","rsa_oaep_md:sha256",
                    "-pkeyopt","rsa_mgf1_md:sha256"],
                    input=encrypted,check=True,capture_output=True).stdout
            except subprocess.CalledProcessError:
                raise RuntimeError("Cannot decrypt sealed original URL; do not regenerate")
            pieces.append(dec)
        try: url=b"".join(pieces).decode("ascii")
        except UnicodeDecodeError:
            raise RuntimeError("Invalid original URL encoding; no new speech")
        parsed=urllib.parse.urlsplit(url)
        ensure(parsed.scheme=="https" and parsed.hostname=="storage.googleapis.com"
               and not parsed.username and not parsed.password,
               "untrusted provider download host")
        expected_fragment="/content_generation/"+e["sessionId"]+"/"+e["generationId"]+"/content.mp3"
        ensure(parsed.path.startswith("/xi-backend/database/workspace/")
               and parsed.path.endswith(expected_fragment)
               and "X-Goog-Signature=" in parsed.query
               and "X-Goog-Expires=" in parsed.query,
               "signed provider URL does not match exact paid generation")
        dest=inbox/(m["generationId"]+".mp3")
        req=urllib.request.Request(url,method="GET",headers={"Accept":"audio/mpeg"})
        try:
            with urllib.request.urlopen(req,timeout=50) as response:
                ensure(response.status==200,"signed original download failed")
                audio=response.read(6_000_001)
        except Exception:
            raise RuntimeError("Signed original URL expired or blocked by provider; keep the paid ElevenLabs generation for later free export, DO NOT RETRY TTS")
        ensure(1800<len(audio)<6_000_000
               and (audio.startswith(b"ID3") or audio[:1]==bytes([255])),
               "returned file is not a valid bounded provider MP3")
        dest.write_bytes(audio)
        # Reuses existing authoritative ffprobe, generation-ID and ledger
        # verification. It stores EXACT provider bytes, never manufactured MP3s.
        status=run(inbox)
        imported=status.get("newlyImportedProviderGenerationIds") or []
        ensure(imported==[m["generationId"]],
               "provider original must be imported once under its real generation ID")
        report=read(REPORT) if REPORT.is_file() else {}
        report.update({
            "signedOriginalGetImported":1,
            "importedOriginals":max(int(report.get("importedOriginals",0)),1),
            "newPaidSpeechCalls":0,
            "newSynthesisCredits":0,
            "signedGetWasZeroCredit":True,
            "sourceGenerationId":m["generationId"],
            "humanListeningApproved":False,"publicReleaseEnabled":False})
        REPORT.parent.mkdir(parents=True,exist_ok=True)
        REPORT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        print("PASS_KIDS_V4_GENUINE_SIGNED_MP3_IMPORTED",m["generationId"],
              "no new TTS, review only",flush=True)

if __name__=="__main__":main()
