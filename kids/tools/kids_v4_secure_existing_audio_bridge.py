#!/usr/bin/env python3
"""Zero-TTS, encrypted one-time transfer of previously paid V4 quiz MP3s.

An RSA private key is NEVER committed. On GitHub Actions it is sealed with
AES-GCM using a KDF of ELEVENLABS_API_KEY, then stored briefly as a GitHub
artifact. Only its public key is published. Another trusted runner decrypts
the existing, short-lived URL envelope and saves ORIGINAL MP3 bytes. Public
GitHub commits contain neither decryption key nor bearer media URLs.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from import_quiz_v4_connected_flow_originals import expected,run

VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
AAD=b"TAWHID_KIDS_EXISTING_V4_MP3_ONLY_20261017"
PUBLIC=ROOT/"kids/review-only/v4-secure-audio-import-public.pem"
ENVELOPE=ROOT/"kids/review-only/v4-secure-audio-import-encrypted.json"
META=ROOT/"kids/review-only/v4-secure-audio-import-key-origin.json"

def require(ok,msg):
    if not ok:
        raise RuntimeError("KIDS_V4_SECURE_ORIGINAL_IMPORT_STOP: "+msg)

def b64(data):
    return base64.b64encode(data).decode("ascii")

def unb64(data):
    return base64.b64decode(data,validate=True)

def wrapping_key():
    api=os.environ.get("ELEVENLABS_API_KEY","").strip()
    require(len(api)>=18,"existing provider API secret missing from Actions")
    return hashlib.sha256(AAD+b"\0"+api.encode("utf-8")).digest()

def keygen(artifact_directory,run_id):
    require(not PUBLIC.exists() and not META.exists(),"one-time key already exists")
    private=rsa.generate_private_key(public_exponent=65537,key_size=3072)
    public_bytes=private.public_key().public_bytes(
        serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo)
    private_bytes=private.private_bytes(serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,serialization.NoEncryption())
    nonce=os.urandom(12)
    ciphertext=nonce+AESGCM(wrapping_key()).encrypt(nonce,private_bytes,AAD)
    artifact_directory.mkdir(parents=True,exist_ok=True)
    (artifact_directory/"sealed-private-key.bin").write_bytes(ciphertext)
    PUBLIC.parent.mkdir(parents=True,exist_ok=True)
    PUBLIC.write_bytes(public_bytes)
    META.write_text(json.dumps({"schemaVersion":1,"originRunId":str(run_id),
        "asset":"sealed-private-key.bin","audiosAlreadyPaid":True,
        "privateKeyCommitted":False,"publicMediaLinksCommitted":False},
        indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_RSA_PUBLIC_KEY_READY: private key sealed outside repository")

def validate_generation_ids(items):
    flow,reg,ledger,known,by_text=expected()
    awaiting={gid for gid,row in known.items() if by_text[row["text"]]["status"]==
        "GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"}
    provided={x["generationId"] for x in items}
    require(len(provided)==len(items)==len(awaiting),"wrong existing paid generation count")
    require(provided==awaiting,"existing provider generation IDs do not match immutable receipts")
    require(len(items)<=20,"unexpected number of source audio files")

def valid_url(url,gid):
    require(isinstance(url,str) and len(url)<5000,"bad signed original URL")
    parsed=urllib.parse.urlsplit(url)
    require(parsed.scheme=="https" and parsed.hostname=="storage.googleapis.com"
       and not parsed.username and not parsed.password and not parsed.fragment,
       "unrecognized provider media host")
    require(parsed.path.endswith("/"+gid+"/content.mp3"),
       "provider original MP3 URL disagrees with generation ID")
    require("X-Goog-Signature=" in parsed.query,
       "media URL not signed by provider")
    return url

def decrypt(encrypted_key_file,out_dir):
    require(PUBLIC.is_file() and META.is_file() and ENVELOPE.is_file(),
       "public handshake or encrypted payload missing")
    ciphertext=encrypted_key_file.read_bytes()
    require(len(ciphertext)>30,"sealed private key missing")
    nonce=ciphertext[:12]
    private_pem=AESGCM(wrapping_key()).decrypt(nonce,ciphertext[12:],AAD)
    private=serialization.load_pem_private_key(private_pem,password=None)
    require(private.public_key().public_bytes(
       serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo
    )==PUBLIC.read_bytes(),"decrypted key not bound to public GitHub handshake")
    env=json.loads(ENVELOPE.read_text(encoding="utf-8"))
    require(env.get("scope")=="KIDS_V4_ENCRYPTED_ORIGINALS_TRANSFER"
      and env.get("schemaVersion")==1,"unexpected paid media payload")
    aes_key=private.decrypt(unb64(env["wrappedAESKey"]),
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()),
                     algorithm=hashes.SHA256(),label=AAD))
    plain=AESGCM(aes_key).decrypt(unb64(env["nonce"]),unb64(env["ciphertext"]),AAD)
    items=json.loads(plain.decode("utf-8"))["items"]
    validate_generation_ids(items)
    out_dir.mkdir(parents=True,exist_ok=True)
    for item in sorted(items,key=lambda x:x["generationId"]):
        gid=item["generationId"]
        url=valid_url(item["url"],gid)
        req=urllib.request.Request(url,headers={"Accept":"audio/mpeg","User-Agent":
            "TawhidKidsExistingAudioImport/1.0"},method="GET")
        try:
            with urllib.request.urlopen(req,timeout=70) as r:
                require(r.status==200,"provider original download returned non-200")
                audio=r.read(2_000_001)
        except Exception as exc:
            # Signed URLs are bearer credentials; NEVER log exception URLs.
            raise RuntimeError("provider original GET failed: "+type(exc).__name__) from None
        require(1800<len(audio)<2_000_001 and
                (audio.startswith(b"ID3") or audio[:1]==b"\xff"),
                "original MP3 byte format invalid")
        (out_dir/(gid+".mp3")).write_bytes(audio)
        print("KIDS_V4_EXISTING_AUDIO_FETCHED "+gid+" "+str(len(audio))+" bytes")
    report=run(out_dir)
    require(len(report["newlyImportedProviderGenerationIds"])==len(items),
       "not all paid originals joined to the protected registry")
    print("KIDS_V4_SECURE_MP3_TRANSFER_SUCCEEDED "+str(len(items))+
       " genuine files, ZERO new TTS calls")

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    cmd=ap.add_mutually_exclusive_group(required=True)
    cmd.add_argument("--keygen",action="store_true")
    cmd.add_argument("--decrypt-import",action="store_true")
    ap.add_argument("--run-id")
    ap.add_argument("--private-artifact",type=Path)
    ap.add_argument("--out",type=Path)
    args=ap.parse_args()
    if args.keygen:
        require(args.out is not None and args.run_id,"keygen requires output and run id")
        keygen(args.out,args.run_id)
    else:
        require(args.private_artifact is not None and args.out is not None,
                "the sealed private key artifact is required")
        decrypt(args.private_artifact,args.out)

if __name__=="__main__":
    main()
