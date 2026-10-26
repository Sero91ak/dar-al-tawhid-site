#!/usr/bin/env python3
"""Conservative, NON-DELETING storage cleanup plan for legacy KIDS quiz audio.

Only emits an audit report. Never deletes files, rewrites Git history, modifies
manifests or touches Du'a, story, Academy, or Qur'an/reciter assets.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PREFIX = "kids/assets/kids-quiz-audio/"
NEW_PREFIX = PREFIX + "v4-full-rebuild-20261026/"
TEXT_SUFFIXES = {".json", ".html", ".js", ".css", ".py", ".cjs", ".mjs", ".ts", ".tsx", ".md", ".yml", ".yaml"}
AUDIO_SUFFIXES = {".mp3", ".m4a", ".aac", ".wav", ".ogg"}

def files_in_git():
    raw = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    return [Path(s.decode("utf-8")) for s in raw.split(b"\0") if s]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    tracked = files_in_git()
    old = [p for p in tracked if p.as_posix().startswith(PREFIX)
           and not p.as_posix().startswith(NEW_PREFIX)
           and p.suffix.lower() in AUDIO_SUFFIXES and (ROOT / p).is_file()]
    old.sort(key=lambda x: x.as_posix())
    # Text references are a conservative approximation: any lexical match means
    # keep the asset. A lack of references is NOT sufficient for safe deletion.
    text_blobs = []
    for rel in tracked:
        if rel.suffix.lower() not in TEXT_SUFFIXES or rel.as_posix().startswith("node_modules/"):
            continue
        path = ROOT / rel
        if not path.is_file() or path.stat().st_size > 8_000_000:
            continue
        try:
            text_blobs.append((rel.as_posix(), path.read_text("utf-8", errors="replace")))
        except OSError:
            continue
    rows=[]
    for rel in old:
        path=ROOT/rel
        url="/"+rel.as_posix()
        name=rel.name
        references=[p for p,s in text_blobs if url in s or rel.as_posix() in s or name in s]
        content_hash=hashlib.sha256(path.read_bytes()).hexdigest()
        rows.append({"path":rel.as_posix(),"bytes":path.stat().st_size,"sha256":content_hash,
                     "references":references[:20],"referenceCount":len(references),
                     "candidateForLaterReview":not bool(references),
                     "approvedForDeletion":False})
    total=sum(r["bytes"] for r in rows)
    referenced=sum(r["bytes"] for r in rows if r["referenceCount"])
    candidate=sum(r["bytes"] for r in rows if not r["referenceCount"])
    report={
        "schemaVersion":1,"purpose":"REVIEW_ONLY_NO_DELETE",
        "scanScope":PREFIX,"newProtectedDirectory":NEW_PREFIX,
        "trackedLegacyAssets":len(rows),"trackedLegacyBytes":total,
        "currentlyReferencedBytes":referenced,"potentialReviewOnlyBytes":candidate,
        "deletionAuthorized":False,
        "constraints":[
          "Do not delete unless 450x4 newly generated audio was checked and approved by listening.",
          "Require successful actual Test + Visitor deployments and no missing playback.",
          "Require full archives and SHA-256 restore manifest, including old source bytes.",
          "Verify any dynamic runtime references manually; lexical zero references is not enough.",
          "Git deletions do not remove prior Git history or necessarily reduce repo pack storage.",
          "Never delete Dua, Stories, Quran recitations, Academy, Android/iOS or other app assets."
        ],"legacy":[*rows],
    }
    output=json.dumps(report,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(output,encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k!="legacy"},ensure_ascii=False,indent=2))
    print("No file deleted; all candidates require later human+technical release approval.")

if __name__=="__main__":
    main()
