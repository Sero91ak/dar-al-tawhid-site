#!/usr/bin/env python3
"""Audit the 56 already paid ElevenLabs V4 originals with no new credits.

This wrapper delegates ACTUAL MP3 import to the previously installed, tested
canonical importer: kids/tools/import_quiz_v4_prepaid_flow_originals.py.
It DOES NOT implement a second file-copy/registration mechanism.
--audit --write-report updates only the missing-file inventory (no purchases).
--import --source DIR_OR_ZIP passes a pre-downloaded original bundle to the
canonical importer. Signed download URLs are never saved to GitHub.
"""
from __future__ import annotations
import argparse,json,re,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
REPORT=ROOT/"kids/data/quiz-v4-paid-flow-recovery-status.json"
CANONICAL=ROOT/"kids/tools/import_quiz_v4_prepaid_flow_originals.py"
DEFAULT_INBOX=ROOT/"kids/paid-flow-originals-inbox"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def load(p):return json.loads(p.read_text(encoding="utf-8"))

def expected_generations():
    meta=load(SOURCE)
    if len(meta.get("items",[]))!=20 or meta.get("voiceId")!=VOICE or meta.get("modelId")!="eleven_v4":
        raise RuntimeError("Previously paid 20 quiz questions or owner voice lost")
    lookup={}
    for q in meta["items"]:
        for take in q.get("recordings") or []:
            gid=take.get("generationId")
            if not isinstance(gid,str) or not re.fullmatch(r"[A-Za-z0-9]{20}",gid):
                raise RuntimeError("Original take ID missing/invalid")
            if gid in lookup and lookup[gid]!=q["questionId"]:
                raise RuntimeError("Original paid generation ID assigned to two questions")
            lookup[gid]=q["questionId"]
    if len(lookup)!=56:
        raise RuntimeError("Missing original prepaid Flow generation IDs: expected 56")
    return lookup

def audit(source=DEFAULT_INBOX,write=False):
    expected=expected_generations()
    registry=load(REGISTRY)
    if registry.get("voiceId")!=VOICE or registry.get("live") is not False:
        raise RuntimeError("Never release or overwrite registry outside review")
    imported=set((registry.get("generationClips") or {}).keys())
    if imported-set(expected):
        raise RuntimeError("Unrecognized generation in previously paid originals")
    if source.is_file() and source.suffix.lower()==".zip":
        # Archive files are only counted after canonical ZIP import validation.
        locally_available=set()
    else:
        locally_available={gid for gid in expected if
                           (source/(gid+".mp3")).is_file() and
                           not (source/(gid+".mp3")).is_symlink()}
    all_missing=set(expected)-imported-locally_available
    selected={q["questionId"] for q in load(
        ROOT/"kids/data/quiz-v4-curated-450-production-review.json")["recipes"]
        if q["ageBand"]=="4-6"}
    need150={gid for gid,qid in expected.items() if qid in selected}
    result={
        "scope":"TAWḤĪD KIDS 56 previously paid V4 Flow originals",
        "mode":"AUDIT_OR_DELEGATE_TO_CANONICAL_IMPORTER_NO_TTS",
        "expectedPreviouslyPaidGenerationIDs":56,
        "alreadyImportedGenerationIDs":len(imported),
        "MP3sAvailableInLocalInbox":len(locally_available),
        "uniqueIDsStillMissing":len(all_missing),
        "missingForFirst150Age4to6":len(need150-imported-locally_available),
        "missingOriginalGenerationIDs":sorted(all_missing),
        "centralImporter":"kids/tools/import_quiz_v4_prepaid_flow_originals.py",
        "purchaseAuthorized":False,"liveReleaseAllowed":False
    }
    if write:
        REPORT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_PREVIOUSLY_PAID_V4_IMPORT_AUDIT "+json.dumps(result,ensure_ascii=False),flush=True)
    return result

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--source",type=Path,default=DEFAULT_INBOX)
    cli.add_argument("--write-report",action="store_true")
    modes=cli.add_mutually_exclusive_group()
    modes.add_argument("--audit",action="store_true")
    modes.add_argument("--strict",action="store_true")
    modes.add_argument("--import",dest="do_import",action="store_true")
    args=cli.parse_args()
    source=args.source.resolve()
    if args.do_import:
        if not source.exists():raise RuntimeError("Prepaid Flow original files not supplied")
        cmd=[sys.executable,str(CANONICAL)]
        if source.is_file() and source.suffix.lower()==".zip":
            cmd+=["--zip",str(source)]
        elif source.is_dir():
            cmd+=["--directory",str(source)]
        else:raise RuntimeError("Prepaid originals must be a directory or ZIP")
        # Canonical importer rejects unknown IDs/invalid MP3 bytes, preserving
        # existing paid file digests and requiring the same original voice.
        subprocess.run(cmd,check=True)
    report=audit(source,write=args.write_report)
    if args.strict and report["uniqueIDsStillMissing"]>0:
        raise SystemExit("BLOCKED: prior purchased original V4 MP3s not yet restored")

if __name__=="__main__":main()
