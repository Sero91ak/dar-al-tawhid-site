#!/usr/bin/env python3
"""Recover nine missing ALREADY PAID quiz V4 originals from old GitHub artifacts.

Safe and FREE of ElevenLabs charges. Searches ONLY named historical KIDS V4
original-audio artifacts in this exact GitHub repository. Accepts only MP3
bytes named EXACTLY a missing paid Flow generation ID; checks ZIP safety,
MP3 codec and original expected duration via the existing strict importer.
Do not trust filename/metadata as cryptographic authorship proof. Never
silently approve listening, write public quiz files, or invoke voice TTS.
"""
from __future__ import annotations

import io
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from urllib.parse import urlsplit
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
REPO="Sero91ak/dar-al-tawhid-site"
BASE="https://api.github.com/repos/"+REPO+"/actions"
STATE=ROOT/"kids/data/quiz-v4-paid-flow-import-status.json"
ORIGINALS=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
REPORT=ROOT/"kids/review-only/quiz-v4-nine-originals-github-archive-recovery.json"
NAMES=(
    # Prioritize unique original-asset backups ahead of repetitive GET reports.
    "tawhid-kids-recovered-previously-paid-v4-originals-review",
    "kids-v4-prepaid-nine-github-archives-safe-restore",
    "kids-nine-paid-v4-original-free-get-recovery",
    "paid-v4-flow-originals-free-recovery-backup",
    "tawhid-kids-v4-prepaid-flow-original-restoration",
    "kids-v4-paid-flow-original-backup",
    "tawhid-kids-v4-paid-flow-original-recovery",
    "tawhid-kids-v4-older-stage1-exact-prepaid-safekeeping",
)
MAX_PAGES_PER_NAME=3
MAX_ARTIFACTS_DOWNLOADED=48
MAX_BYTES_DOWNLOADED=300_000_000
MAX_ARCHIVE_BYTES=16_000_000
MAX_INDIVIDUAL_MP3_BYTES=6_000_000

def strict(ok,message):
    if not ok:raise RuntimeError("PAID_V4_GITHUB_ARCHIVE_RECOVERY_BLOCKED: "+message)
def load(path):return json.loads(path.read_text(encoding="utf-8"))
def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

class ArtifactSafeRedirect(urllib.request.HTTPRedirectHandler):
    """Follow GitHub-authorized ZIP links without forwarding bearer credentials."""
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        parsed=urlsplit(newurl)
        host=(parsed.hostname or "").lower()
        valid=(host in {"api.github.com","github.com","objects.githubusercontent.com"}
               or host.endswith(".githubusercontent.com")
               or host.endswith(".blob.core.windows.net")
               or host.endswith(".amazonaws.com"))
        strict(parsed.scheme=="https" and valid,
               "unexpected artifact redirect host blocked")
        redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
        if redirected is not None and host!="api.github.com":
            redirected.remove_header("Authorization")
        return redirected

SAFE_OPENER=urllib.request.build_opener(ArtifactSafeRedirect)

def api(url,token,max_bytes,expected_json=False):
    strict(url.startswith(BASE+"/") and "@" not in url and "#" not in url,
           "only same-repository GitHub Actions API endpoints permitted")
    req=urllib.request.Request(url,headers={
        "Accept":"application/vnd.github+json",
        "Authorization":"Bearer "+token,
        "X-GitHub-Api-Version":"2022-11-28",
        "User-Agent":"tawhid-kids-v4-already-paid-archive-search/1.0"},method="GET")
    with SAFE_OPENER.open(req,timeout=40) as response:
        data=response.read(max_bytes+1)
        strict(len(data)<=max_bytes,"response larger than maximum allowed")
        if expected_json:
            return json.loads(data.decode("utf-8"))
        return data

def artifact_zip(artifact_id,token):
    # GitHub's authorized archive endpoint redirects to short-lived object
    # storage. The download URL and token are NEVER logged or persisted.
    strict(isinstance(artifact_id,int) and artifact_id>0,"invalid artifact ID")
    data=api(f"{BASE}/artifacts/{artifact_id}/zip",token,MAX_ARCHIVE_BYTES)
    strict(data.startswith(b"PK"),"not an original GitHub Actions ZIP")
    return data

def original_id_from_export_name(filename,missing):
    """Accept only known paid generation IDs, with optional descriptive suffixes."""
    matched=re.fullmatch(r"([A-Za-z0-9]{20})(?:[-_][A-Za-z0-9_-]{1,70})?\.mp3",Path(filename).name,re.I)
    return matched.group(1) if matched and matched.group(1) in missing else None


def mp3_candidates(raw,missing):
    results={}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        members=archive.infolist()
        strict(len(members)<1200,"unexpected archive entry count")
        strict(sum(x.file_size for x in members)<120_000_000,
               "archive expanded size unsafe")
        for entry in members:
            if entry.is_dir():continue
            strict(not entry.filename.startswith("/") and
                   ".." not in Path(entry.filename).parts and
                   not entry.filename.startswith("\\"),
                   "unsafe ZIP member name")
            gid=original_id_from_export_name(entry.filename,missing)
            if gid is None:continue
            strict(1800<=entry.file_size<=MAX_INDIVIDUAL_MP3_BYTES,
                   "unusual original MP3 size")
            strict(gid not in results,"duplicate original MP3 within same artifact")
            data=archive.read(entry)
            strict(len(data)==entry.file_size,"MP3 ZIP length mismatch")
            results[gid]=data
    return results

def main():
    state=load(STATE)
    expected=load(ORIGINALS)
    missing=set(state["remainingGenerationIds"])
    original={x["generationId"] for x in expected["items"]}
    strict(len(original)==9 and missing<=original and
           state["remainingPriorPaidGenerations"]==len(missing),
           "historical original generation inventory changed")
    strict(load(ROOT/"kids/data/quiz-curation-release.json")["enabled"] is False,
           "public quiz must remain disabled")
    token=os.environ.get("GITHUB_TOKEN","").strip()
    strict(bool(token),"GitHub Actions artifact read token not available")
    stats={"schemaVersion":1,"scope":"KIDS_V4_ALREADY_PAID_NINE_GITHUB_ACTIONS_ARTIFACT_SEARCH",
           "modelId":"eleven_v4","masterVoiceId":"DkU7j9uO4ZEtLD2iRZSH",
           "repo":REPO,"beforeMissingCount":len(missing),
           "queriedArtifactNames":list(NAMES),"artifactListingsChecked":0,
           "eligibleArchivesExamined":0,"archiveDownloadAttempts":0,
           "archiveDownloadFailuresByStatus":{},"archiveCandidatesSeen":0,
           "archiveBytesExamined":0,
           "matchingOriginalGenerationIds":[],"matchedArtifactIds":[],
           "newElevenLabsCreditsSpent":0,"elevenLabsSpeechSynthesisCalls":0,
           "publicReleaseAllowed":False,"humanListeningApproved":False,
           "retrievedMP3sAreUnverifiedExports":True}
    seen=set()
    found={}
    # Search *named* originals-backup artifacts. Never download private audio
    # hearing bundles, arbitrary files, or other repository archives.
    for name in NAMES:
        if not missing or stats["eligibleArchivesExamined"]>=MAX_ARTIFACTS_DOWNLOADED:break
        for page in range(1,MAX_PAGES_PER_NAME+1):
            query=urllib.parse.urlencode({"name":name,"per_page":100,"page":page})
            data=api(BASE+"/artifacts?"+query,token,2_000_000,expected_json=True)
            records=data.get("artifacts") or []
            if not isinstance(records,list):break
            stats["artifactListingsChecked"]+=1
            for row in records:
                if not missing or stats["eligibleArchivesExamined"]>=MAX_ARTIFACTS_DOWNLOADED:break
                aid=row.get("id")
                if not isinstance(aid,int) or aid in seen or row.get("name")!=name or row.get("expired"):continue
                seen.add(aid)
                size=row.get("size_in_bytes") or 0
                if size<500 or size>MAX_ARCHIVE_BYTES:continue
                stats["archiveCandidatesSeen"]+=1
                if stats["archiveBytesExamined"]+size>MAX_BYTES_DOWNLOADED:break
                stats["archiveDownloadAttempts"]+=1
                try:
                    archive=artifact_zip(aid,token)
                    matches=mp3_candidates(archive,missing)
                except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError,zipfile.BadZipFile,
                        json.JSONDecodeError,RuntimeError) as exc:
                    # Distinguish an unreadable ZIP from a verified search
                    # with 0 matches. Do not log signed URLs or credentials.
                    if isinstance(exc,urllib.error.HTTPError):
                        reason="http-"+str(exc.code)
                    elif isinstance(exc,urllib.error.URLError):
                        reason="connection-error"
                    elif isinstance(exc,TimeoutError):
                        reason="timeout"
                    elif isinstance(exc,zipfile.BadZipFile):
                        reason="invalid-archive"
                    else:
                        reason="invalid-payload"
                    errs=stats["archiveDownloadFailuresByStatus"]
                    errs[reason]=errs.get(reason,0)+1
                    continue
                stats["archiveBytesExamined"]+=len(archive)
                stats["eligibleArchivesExamined"]+=1
                for gid,bytes_mp3 in matches.items():
                    strict(gid not in found,"same original ID located in multiple archives; reconcile manually")
                    found[gid]=bytes_mp3
                    stats["matchedArtifactIds"].append(aid)
                    missing.remove(gid)
            if not records or len(records)<100 or not missing:break
    stats["matchingOriginalGenerationIds"]=sorted(found)
    stats["archiveAuditWasAbleToReadAtLeastOneBackup"]=bool(stats["eligibleArchivesExamined"])
    stats["zeroMatchesProveAllHistoricBackupsWereChecked"]=False
    if found:
        with tempfile.TemporaryDirectory(prefix="kids-existing-paid-archive-") as folder:
            inbox=Path(folder)
            for gid,bytes_mp3 in found.items():
                (inbox/(gid+".mp3")).write_bytes(bytes_mp3)
            # The original importer rejects modified receipts, wrong
            # duration, invalid codecs, and incorrect voice/ID bookkeeping.
            subprocess.run(["python3","kids/tools/import_quiz_v4_prepaid_flow_originals.py",
                            "--directory",str(inbox)],check=True,cwd=ROOT)
    after=load(STATE)
    stats["afterMissingCount"]=after["remainingPriorPaidGenerations"]
    stats["newOriginalsImported"]=len(found)
    strict(stats["afterMissingCount"]==stats["beforeMissingCount"]-len(found),
           "paid original import state did not change by exact matching IDs")
    save(REPORT,stats)
    print("KIDS_V4_GITHUB_ARCHIVED_ORIGINALS "+
          json.dumps({k:v for k,v in stats.items() if k not in
                      ("matchedArtifactIds","matchingOriginalGenerationIds")},
                     ensure_ascii=False),flush=True)
    if not found:
        if not stats["eligibleArchivesExamined"]:
            print("GITHUB_ARTIFACTS_NOT_ACTUALLY_READ; "
                  "no claim of missing source bytes can be made; manual original export still required",flush=True)
        else:
            print("NO_MISSING_PAID_ORIGINAL_IN_SAMPLED_READABLE_ARCHIVES; "
                  "not an exhaustive search; never re-synthesize",flush=True)

if __name__=="__main__":main()
