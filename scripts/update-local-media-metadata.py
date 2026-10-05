#!/usr/bin/env python3
from __future__ import annotations
import hashlib
import json
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SEARCH_ROOTS = [ROOT / "kids" / "data", ROOT / "voice-studio", ROOT / "content"]
AUDIO_SUFFIXES = {".m4a", ".aac", ".mp3"}

def probe_duration(path: Path):
    try:
        value = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            text=True,
        ).strip()
        return round(float(value), 3)
    except Exception:
        return None

def local_path(url: str):
    if not isinstance(url, str) or not url.startswith("/"):
        return None
    path = urlsplit(url).path.lstrip("/")
    p = ROOT / path
    if p.suffix.lower() not in AUDIO_SUFFIXES or not p.exists():
        return None
    return p

def refresh_node(node):
    changed = False
    if isinstance(node, dict):
        p = local_path(node.get("url"))
        if p:
            sha = hashlib.sha256(p.read_bytes()).hexdigest()
            size = p.stat().st_size
            duration = probe_duration(p)

            for key in ("sha256",):
                if key in node and node[key] != sha:
                    node[key] = sha
                    changed = True
            for key in ("bytes", "qaBytes", "sizeBytes", "fileBytes"):
                if key in node and node[key] != size:
                    node[key] = size
                    changed = True
            if duration is not None:
                for key in ("durationSeconds", "qaDurationSeconds", "durationSec", "duration"):
                    if key in node and isinstance(node[key], (int, float)) and node[key] != duration:
                        node[key] = duration
                        changed = True

        for value in node.values():
            if refresh_node(value):
                changed = True
    elif isinstance(node, list):
        for value in node:
            if refresh_node(value):
                changed = True
    return changed

changed_files = 0
for base in SEARCH_ROOTS:
    if not base.exists():
        continue
    for path in base.rglob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if refresh_node(data):
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            changed_files += 1
            print("metadata refreshed:", path.relative_to(ROOT))

print("MEDIA_METADATA_SUMMARY changed_json_files=", changed_files)
