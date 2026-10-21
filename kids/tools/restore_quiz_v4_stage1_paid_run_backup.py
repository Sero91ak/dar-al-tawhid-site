#!/usr/bin/env python3
"""Recover REAL, already-billed KIDS V4 older-stage1 MP3s from a failed Actions ZIP.

The original paid workflow uploads its MP3 folder, source registry, paid
ledger and usage file EVEN IF downstream QA or a GitHub commit fails.
This program salvages those genuine bytes and unconfirmed-request markers.
It NEVER generates speech, reads provider credentials, changes canonical
questions, updates the public app, or grants human listening approval.

Usage:
  python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip FILE.zip
  python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip FILE.zip --import

Without --import this tool is READ ONLY. A missing MP3 is NEVER fabricated.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path,PurePosixPath

ROOT=Path(__file__).resolve().parents[2]
BASE="kids/assets/kids-quiz-audio/v4-curated450-review/"
REG="kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER="kids/data/quiz-v4-450-paid-generation-ledger.json"
USAGE="kids/data/quiz-v4-older-stage1-usage.json"
ATTEMPTS="kids/data/quiz-v4-older-stage1-request-journal.json"
STAGE=".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
REPORT="kids/review-only/quiz-v4-older-stage1-backup-salvage-report.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
BATCH="KIDS_V4_OLDER_STAGE1_EXACT_65"
LIMIT=150_000_000

def fail(message):raise RuntimeError("V4_PAID_BACKUP_RESTORE_BLOCKED: "+message)
def read(path):return json.loads(Path(path).read_text(encoding="utf-8"))
def digest(payload):return hashlib.sha256(payload).hexdigest()
def source_digest(text):return digest(text.encode("utf-8"))
def safe_save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w",encoding="utf-8",dir=path.parent,
                                    prefix=path.name+".pending-",delete=False) as tmp:
        json.dump(obj,tmp,ensure_ascii=False,indent=2)
        tmp.write("\n")
        tmp.flush()
        temp=Path(tmp.name)
    temp.replace(path)

def members(z):
    listed={}
    total=0
    for info in z.infolist():
        name=info.filename
        parts=PurePosixPath(name)
        if info.is_dir():continue
        if (not name or name.startswith("/") or "\\" in name or
            parts.is_absolute() or any(p in (".","..","") for p in parts.parts) or
            name in listed or info.file_size>15_000_000 or
            (info.external_attr >> 16) & 0o170000 == 0o120000):
            fail("duplicate, symlink, oversized or unsafe archive entry")
        total+=info.file_size
        if total>LIMIT or len(listed)>1000:fail("archive size or count exceeded")
        listed[name]=info
    return listed

def archive_name(found,name):
    # GitHub Actions upload-artifact strips the least common parent:
    # multiple 'kids/...' artifact paths may appear as 'data/...' and
    # 'assets/...' within the ZIP rather than their checkout paths.
    matches=[x for x in (name,name.removeprefix("kids/")) if x in found]
    if len(set(matches))!=1:
        fail("required Actions backup file absent or ambiguously duplicated: "+name)
    return matches[0]

def reject_duplicate_keys(pairs):
    value={}
    for key,item in pairs:
        if key in value:fail("duplicate key in paid original backup JSON: "+key[:90])
        value[key]=item
    return value

def get_zip_json(z,found,name):
    key=archive_name(found,name)
    if found[key].file_size>3_000_000:fail("unexpectedly large JSON metadata")
    try:
        return json.loads(z.read(key).decode("utf-8"),
                          object_pairs_hook=reject_duplicate_keys)
    except (ValueError,UnicodeError) as exc:
        fail("malformed Actions metadata: "+str(exc)[:100])

def verify_mp3(payload):
    if not 1800<len(payload)<6_000_000 or not (
        payload.startswith(b"ID3") or payload[:1]==b"\xff"):
        fail("not the genuine playable original MP3 bytes")
    with tempfile.NamedTemporaryFile(suffix=".mp3") as tmp:
        tmp.write(payload)
        tmp.flush()
        p=subprocess.run(["ffprobe","-v","error","-show_entries",
           "stream=codec_type,codec_name:format=duration","-of","json",tmp.name],
           capture_output=True,text=True,check=True)
    details=json.loads(p.stdout)
    tracks=[x for x in details.get("streams",[]) if x.get("codec_type")=="audio"]
    duration=float(details.get("format",{}).get("duration") or 0)
    if len(tracks)!=1 or tracks[0].get("codec_name")!="mp3" or not 0.5<duration<40:
        fail("MP3 decoder, codec or duration verification failed")

def import_backup(zip_path,root=ROOT,apply=False):
    root=Path(root)
    stage=read(root/STAGE)
    if stage.get("numberOfNewOriginalTexts")!=65 or stage.get("stage")!=1:
        fail("source 65 first-stage V4 originals were modified")
    originals={x["spokenText"]:x["spokenTextSHA256"] for x in stage["originalTextRecordingQueue"]}
    if len(originals)!=65:fail("duplicate or missing stage source original")
    local_reg=read(root/REG);local_ledger=read(root/LEDGER)
    if local_reg.get("voiceId")!=VOICE or local_reg.get("modelId")!=MODEL or local_reg.get("live") is not False or local_ledger.get("live") is not False:
        fail("master V4 voice or release lane changed")
    if read(root/"kids/data/quiz-curation-release.json").get("enabled") is not False:
        fail("public quiz switch must remain off")
    with zipfile.ZipFile(zip_path) as z:
        contents=members(z)
        remote_reg=get_zip_json(z,contents,REG)
        remote_ledger=get_zip_json(z,contents,LEDGER)
        remote_usage=get_zip_json(z,contents,USAGE)
        if (remote_reg.get("voiceId")!=VOICE or remote_reg.get("modelId")!=MODEL or
            remote_reg.get("live") is not False or remote_ledger.get("live") is not False or
            remote_usage.get("batchId")!=BATCH):
            fail("charged backup is not genuine private original V4 metadata")
        left=local_reg.get("textClips");right=remote_reg.get("textClips")
        if not isinstance(left,dict) or not isinstance(right,dict):
            fail("missing original audio text mapping")
        if not set(left).issubset(right) or any(right[t]!=clip for t,clip in left.items()):
            fail("backup would overwrite or drop existing paid MP3s")
        old_ledger=local_ledger.get("rows")
        new_ledger=remote_ledger.get("rows")
        if not isinstance(old_ledger,list) or not isinstance(new_ledger,list) or new_ledger[:len(old_ledger)]!=old_ledger:
            fail("backup billing ledger has diverged or lost a paid entry")
        fresh={t:right[t] for t in right if t not in left}
        new_rows=new_ledger[len(old_ledger):]
        if len(fresh)!=len(new_rows) or {r.get("text") for r in new_rows}!=set(fresh):
            fail("new paid audio and original billing rows disagree")
        known_requests={r.get("providerRequestId") for r in old_ledger if r.get("providerRequestId")}
        if len(known_requests)!=len([r for r in old_ledger if r.get("providerRequestId")]):
            fail("current ledger already has duplicate provider IDs")
        blobs=[]
        for paid in new_rows:
            text=paid.get("text");clip=fresh.get(text)
            if text not in originals or not isinstance(clip,dict) or paid.get("batchId")!=BATCH:
                fail("backup includes an unauthorized/newly purchased V4 source")
            if (clip.get("modelId")!=MODEL or clip.get("voiceId")!=VOICE or
                clip.get("audioListeningApproved") is not False or
                clip.get("textSha256")!=originals[text] or
                paid.get("textSha256")!=originals[text] or
                paid.get("mp3Sha256")!=clip.get("sha256")):
                fail("recovered original voice, source text hash or MP3 receipt differs")
            request=paid.get("providerRequestId")
            if (request!=clip.get("providerRequestId") or
                clip.get("status")!="completed-original-mp3-on-review-branch-not-live" or
                clip.get("qaApproval")!="pending-human-auditory-review"):
                fail("billed request and original MP3 receipt or human-QA state inconsistent")
            expected_name=digest((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8"))[:32]+".mp3"
            if request and request in known_requests:fail("provider request ID was already charged")
            if request:known_requests.add(request)
            url=clip.get("url") or ""
            if (not url.startswith("/"+BASE) or
                url[len(BASE)+1:]!=expected_name or not
                re.fullmatch(r"[a-f0-9]{32}\.mp3",url[len(BASE)+1:])):
                fail("non-private or source-mismatched MP3 filename in historical backup")
            name=url.lstrip("/")
            key=archive_name(contents,name)
            payload=z.read(key)
            if len(payload)!=clip.get("bytes") or digest(payload)!=clip["sha256"]:
                fail("actual already-billed MP3 bytes fail SHA-256 and size verification")
            verify_mp3(payload)
            dest=root/name
            if dest.exists() and digest(dest.read_bytes())!=clip["sha256"]:
                fail("existing original MP3 at destination has different bytes")
            blobs.append((dest,payload))
        journal=remote_usage.get("requestJournal")
        if not isinstance(journal,dict) or journal.get("modelId")!=MODEL or journal.get("voiceId")!=VOICE:
            fail("missing anti-repurchase attempt log; never trust an old failed run")
        entries=journal.get("entries")
        if not isinstance(entries,list):fail("invalid attempt journal")
        attempts={}
        for entry in entries:
            d=entry.get("textSHA256")
            if d not in set(originals.values()) or d in attempts or entry.get("status") not in ("REQUEST_STARTED_UNCONFIRMED","ORIGINAL_MP3_SAVED"):
                fail("ambiguous or fake attempted original in backup")
            attempts[d]=entry
            matched=next((x for x in remote_reg["textClips"] if source_digest(x)==d),None)
            if entry["status"]=="ORIGINAL_MP3_SAVED":
                if matched is None or entry.get("mp3SHA256")!=remote_reg["textClips"][matched].get("sha256"):
                    fail("saved provider attempt does not match original MP3 hash")
        local_usage=read(root/USAGE) if (root/USAGE).is_file() else {}
        local_attempts=local_usage.get("requestJournal",{}).get("entries",[])
        by_digest={x["textSHA256"]:x for x in entries}
        paid_by_digest={r.get("textSha256"):r for r in new_ledger
                        if r.get("batchId")==BATCH}
        for old in local_attempts:
            new=by_digest.get(old.get("textSHA256"))
            if new==old:
                continue
            # A runner that pushed REQUEST_STARTED_UNCONFIRMED before a
            # charged POST can crash AFTER receiving actual MP3 bytes but
            # BEFORE pushing its saved receipt. Accept only a genuine
            # forward-only upgrade verified against MP3 registry AND ledger.
            if (new is not None
                and old.get("status")=="REQUEST_STARTED_UNCONFIRMED"
                and new.get("status")=="ORIGINAL_MP3_SAVED"
                and all(new.get(k)==v for k,v in old.items() if k!="status")):
                digest_text=old["textSHA256"]
                spoken=next((t for t in originals
                             if source_digest(t)==digest_text),None)
                clip=right.get(spoken) if spoken else None
                paid=paid_by_digest.get(digest_text)
                if (clip is not None and paid is not None
                    and new.get("mp3SHA256")==clip.get("sha256")==paid.get("mp3Sha256")
                    and new.get("providerRequestId")==clip.get("providerRequestId")==paid.get("providerRequestId")
                    and bool(new.get("providerRequestId"))):
                    continue
            fail("old paid POST marker erased, changed or not supported by original MP3 and provider receipt")
        pending=[x["textSHA256"] for x in entries if x["status"]=="REQUEST_STARTED_UNCONFIRMED"]
        result={"scope":"PRIVATE_KIDS_V4_ORIGINAL_PAID_ACTIONS_SALVAGE","reviewOnly":True,
          "newlyRecoveredRealOriginalMP3s":len(fresh),"unchangedExistingOriginals":len(left),
          "unconfirmedPriorPaidRequests":pending,
          "requiresManualBillingReconciliation":bool(pending),
          "creditsConsumedByThisRestoration":0,"humanListeningApproved":False,
          "publicReleaseAllowed":False}
        if apply:
            for dest,payload in blobs:
                dest.parent.mkdir(parents=True,exist_ok=True)
                if not dest.exists():
                    with tempfile.NamedTemporaryFile(dir=dest.parent,suffix=".pending",delete=False) as temp:
                        temp.write(payload)
                        staging=Path(temp.name)
                    staging.replace(dest)
            safe_save(root/REG,remote_reg)
            safe_save(root/LEDGER,remote_ledger)
            safe_save(root/USAGE,remote_usage)
            safe_save(root/ATTEMPTS,journal)
            safe_save(root/REPORT,result)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--zip",required=True,type=Path,help="Unmodified GitHub Actions paid-audio preservation ZIP")
    parser.add_argument("--import",dest="apply",action="store_true",
                        help="Import verified original bytes into private review checkout; otherwise audit only")
    args=parser.parse_args()
    import_backup(args.zip,ROOT,apply=args.apply)

if __name__=="__main__":main()
