#!/usr/bin/env python3
"""Safely import original V4 MP3s ALREADY charged by connected ElevenLabs Flow.

Exports must be named <generationId>.mp3, or supplied with a flow-audio-map.json
(mapping id to file). Reuses zero-charge historical archive importer for
file scanning, ZIP path safety, ffprobe/codec/duration. NEVER runs TTS, repeats
a charged take, changes a public audio manifest, or marks human listening done.

Examples:
  python3 kids/tools/import_quiz_v4_connected_flow_originals.py --audit
  python3 kids/tools/import_quiz_v4_connected_flow_originals.py --zip /tmp/v4-flow-originals.zip
  python3 kids/tools/import_quiz_v4_connected_flow_originals.py --directory /tmp/v4-originals
Afterwards run the existing offline join and private staging steps.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/"kids/tools"))
from import_quiz_v4_prepaid_flow_originals import (
    extract_safe, probe, scan_files, sha
)
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
FLOW = ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
REG = ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER = ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE = ROOT/"kids/data/quiz-curation-release.json"
OUT = ROOT/"kids/assets/kids-quiz-audio/v4-connected-flow-original-review"
REPORT = ROOT/"kids/review-only/quiz-v4-connected-flow-original-import-status.json"
PENDING = "GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"
IMPORTED = "IMPORTED_ORIGINAL_MP3_VERIFIED"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(ok, message):
    if not ok:
        raise RuntimeError("KIDS_V4_PAID_FLOW_IMPORT_STOP: "+message)


def put(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    staged = path.with_name(path.name+".pending")
    staged.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    staged.replace(path)


def expected():
    require(load(RELEASE).get("enabled") is False,
            "do not import into an enabled public release")
    flow,reg,ledger = load(FLOW),load(REG),load(LEDGER)
    require(flow.get("modelId")==MODEL and flow.get("voiceId")==VOICE and
            flow.get("live") is False and flow.get("humanListeningApproved") is False,
            "wrong connected flow original-audio escrow")
    require(reg.get("modelId")==MODEL and reg.get("voiceId")==VOICE and
            reg.get("live") is False and ledger.get("live") is False,
            "wrong private V4 registry or charged ledger")
    rows=flow.get("entries") or []
    require(isinstance(rows,list) and rows, "connected original escrow empty")
    by_id,by_text={},{}
    known_paid={r["text"]:r for r in ledger["rows"]}
    for e in rows:
        gid=e.get("generationId")
        phrase=e.get("sourceText")
        state=e.get("status")
        require(e.get("voiceId")==VOICE and e.get("modelId")==MODEL,
                "provider identity mismatch")
        require(isinstance(phrase,str) and
                e.get("sourceTextSHA256")==hashlib.sha256(phrase.encode("utf-8")).hexdigest(),
                "source phrase was edited")
        require(state in (PENDING,IMPORTED,"GENERATION_SUBMITTED_DO_NOT_RETRY",
                "RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED",
                "PROVIDER_REJECTED_NO_CHARGE_VERIFY"),
                "unrecognized paid generation state")
        if state in (PENDING,IMPORTED):
            require(isinstance(gid,str) and re.fullmatch(r"[A-Za-z0-9]{20}",gid),
                    "confirmed original generation has invalid ID")
            require(e.get("providerStatus")=="completed" and
                    isinstance(e.get("actualProviderCredits"),(float,int)) and
                    e["actualProviderCredits"]>=0,
                    "paid provider recording proof not complete")
            require(gid not in by_id,"same provider generation used for separate phrases")
            by_id[gid]={"text":phrase,"durationExpected":e.get("providerGenerationDurationSeconds"),
                        "voiceId":VOICE,"modelId":MODEL}
            if state==IMPORTED:
                existing=reg["textClips"].get(phrase)
                require(existing is not None and
                        existing.get("originalGenerationId")==gid and
                        existing.get("sha256")==e.get("importedMP3SHA256") and
                        phrase in known_paid,
                        "claimed imported original missing from paid registry")
        require(phrase not in by_text,"same spoken text reserved more than once")
        by_text[phrase]=e
    return flow,reg,ledger,by_id,by_text


def run(folder,dry=False):
    flow,reg,ledger,takes,by_text=expected()
    mapping_file=folder/"flow-audio-map.json"
    mapping=load(mapping_file) if mapping_file.exists() else {}
    require(isinstance(mapping,dict),"original filename mapping must be JSON object")
    files=scan_files(folder,mapping,takes)
    imported,already=[],[]
    sha_to_text={}
    # Audit all source bytes BEFORE any file or ledger is changed.
    valid=[]
    for gid,path in sorted(files.items()):
        text=takes[gid]["text"]
        e=by_text[text]
        require(e["status"] in (PENDING,IMPORTED),
                "source MP3 arrived before confirmed paid generation")
        duration=probe(path,takes[gid]["durationExpected"])
        digest=sha(path)
        require(digest not in sha_to_text or sha_to_text[digest]==text,
                "same MP3 byte stream supplied for two distinct spoken sources")
        sha_to_text[digest]=text
        existing=reg["textClips"].get(text)
        if existing:
            require(e["status"]==IMPORTED and
                    existing.get("originalGenerationId")==gid and
                    existing.get("sha256")==digest,
                    "already registered original has conflicting provider bytes")
            already.append(gid)
            continue
        require(e["status"]==PENDING,"paid clip state incompatible with new import")
        require(all(x.get("text")!=text for x in ledger["rows"]),
                "source already charged elsewhere, duplicate blocked")
        valid.append((gid,path,digest,duration,e))
    if not files and not dry:
        raise RuntimeError("No known, complete ElevenLabs generation-ID MP3 files supplied")
    report={
        "scope":"KIDS_V4_CONNECTED_FLOW_PAID_ORIGINAL_IMPORT",
        "modelId":MODEL,"voiceId":VOICE,
        "originalsAwaitingImportBefore":sum(x["status"]==PENDING for x in flow["entries"]),
        "alreadyImportedFromZip":already,
        "newlyImportedProviderGenerationIds":[x[0] for x in valid],
        "remainingPendingProviderGenerationIds":sorted(
          x["generationId"] for x in flow["entries"] if x["status"]==PENDING
          and x["generationId"] not in {item[0] for item in valid}),
        "newCreditsSpentByImport":0,"reusedPreviouslyPaidAudio":True,
        "provenance": "linked-to-confirmed-generation-ID-and-expected-duration; manual voice/listening review still required",
        "humanListeningApproved":False,"publicPlaybackAuthorized":False,
        "livePublished":False,
    }
    if dry:
        print("KIDS_V4_CONNECTED_FLOW_IMPORT_AUDIT "+
              json.dumps({"knownCompletedGenerations":len(takes),
                          "confirmedGeneratedAwaitingImport":report["originalsAwaitingImportBefore"],
                          "foundOriginalMP3s":len(files),
                          "newCreditsSpent":0},ensure_ascii=False))
        return report
    OUT.mkdir(parents=True,exist_ok=True)
    # Each generation is stored under its immutable provider ID to avoid
    # buying an original again when the download filename changes.
    for gid,src,digest,duration,e in valid:
        dest=OUT/(gid+".mp3")
        if dest.is_file():
            require(sha(dest)==digest,"destination paid MP3 already exists but differs")
        else:
            tmp=dest.with_name(dest.name+".pending")
            shutil.copyfile(src,tmp)
            tmp.replace(dest)
        phrase=e["sourceText"]
        reg["textClips"][phrase]={
          "url":"/"+str(dest.relative_to(ROOT)),"sha256":digest,
          "textSha256":e["sourceTextSHA256"],"bytes":dest.stat().st_size,
          "modelId":MODEL,"voiceId":VOICE,"originalGenerationId":gid,
          "source":"confirmed-paid-connected-elevenlabs-v4-flow-manual-original-export",
          "sourceOriginalityCryptographicallyConfirmed":False,
          "requiresHumanSourceAndPronunciationVerification":True,
          "durationSeconds":duration,"audioListeningApproved":False,
          "qaApproval":"pending-human-auditory-review","status":"private-original-review-only"}
        ledger["rows"].append({
          "batchId":"KIDS_V4_CONNECTED_FLOW_PAID_IMPORT",
          "text":phrase,"textSha256":e["sourceTextSHA256"],
          "mp3Sha256":digest,"providerGenerationId":gid,
          "providerRequestId":None,
          "estimatedCreditsAtObservedRate":e.get("estimatedCreditsNotInvoice"),
          "exactBilledCredits":e["actualProviderCredits"],
          "note":"Already generated in ElevenLabs Creative Studio; this is ZERO-CREDIT ORIGINAL BYTE IMPORT."})
        e["status"]=IMPORTED
        e["importedMP3SHA256"]=digest
        e["originalMP3ImportedIntoGithub"]=True
        e["savedURL"]="/"+str(dest.relative_to(ROOT))
        e["originalMP3Bytes"]=dest.stat().st_size
    # All three index files are private and use atomic per-file replacement.
    # An abnormal interruption remains fail-closed under the paid-source guard.
    put(REG,reg)
    put(LEDGER,ledger)
    put(FLOW,flow)
    put(REPORT,report)
    print("KIDS_V4_CONNECTED_FLOW_IMPORT "+
          json.dumps({"newOriginalMP3Files":len(valid),
                      "unchangedPreviouslyImported":len(already),
                      "remainingUnimported":len(report["remainingPendingProviderGenerationIds"]),
                      "newCreditsSpent":0,
                      "publicRelease":False},ensure_ascii=False),flush=True)
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    group=ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--audit",action="store_true")
    group.add_argument("--zip",type=Path)
    group.add_argument("--directory",type=Path)
    args=ap.parse_args()
    if args.audit:
        with tempfile.TemporaryDirectory() as d:
            run(Path(d),dry=True)
        return
    if args.zip:
        require(args.zip.is_file(),"missing manually exported ZIP")
        with tempfile.TemporaryDirectory(prefix="kids-connected-flow-import-") as d:
            dest=Path(d)
            mapping=extract_safe(args.zip,dest)
            if mapping:
                put(dest/"flow-audio-map.json",mapping)
            run(dest)
    else:
        require(args.directory.is_dir(),"not an existing original MP3 directory")
        run(args.directory)


if __name__=="__main__":
    main()
