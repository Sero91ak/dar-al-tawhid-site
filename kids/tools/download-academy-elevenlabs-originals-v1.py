#!/usr/bin/env python3
"""Import already-billed ElevenLabs Ṣidq V4 originals using fresh signed media URLs.

Only HTTP GET downloads; no text-to-speech calls, no new ElevenLabs credits.
Expected file format: JSON with {"items": [{"generationId": "...",
"contentUrl": "https://elevenlabsusercontent.com/.../content.mp3?..."}]}.
URLs must be obtained from the *existing* authorized ElevenLabs Creative flow
zrB4zGdz9OTndLryQtIB. Keep the URL manifest LOCAL, never commit its signatures.

Run:
    python3 kids/tools/download-academy-elevenlabs-originals-v1.py --status --source-dir /tmp/sidq
    python3 kids/tools/download-academy-elevenlabs-originals-v1.py \
       --download --signed-urls /tmp/private-elevenlabs-sidq-urls.json \
       --source-dir /tmp/sidq

Every entry is matched against the canonical 76 previously paid generation IDs.
Official URL domain, generation ID, session ID, file length, media format and
SHA-256 are verified. Writes an unsigned SHA ledger for source provenance.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
UPSTREAM = ROOT / "kids/tools/import-publish-academy-sidq-v4-v1.py"
FLOW = "zrB4zGdz9OTndLryQtIB"
DOMAIN = "elevenlabsusercontent.com"
WORKSPACE = "9e52ab872d7b4775b36e50d2e07d17be"
PATH_RE = re.compile(
    rf"^/database/workspace/{WORKSPACE}/content_generation/"
    r"([A-Za-z0-9_-]+)/([A-Za-z0-9_-]+)/content\.mp3$"
)
MAX_AUDIO_BYTES = 12 * 1024 * 1024
MIN_AUDIO_BYTES = 1200


def source_inventory():
    spec = importlib.util.spec_from_file_location("academy_sidq_importer", UPSTREAM)
    if spec is None or spec.loader is None:
        raise RuntimeError("Canonical importer unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    source, originals, direct, reuse, mixed, arabic = module.source_inventory()
    if len(source) != 58 or len(originals) != 76:
        raise RuntimeError("Ṣidq inventory drift; stop before downloading")
    if any(
        obj.get("sessionId") is None or obj.get("generationId") != key
        for key, obj in originals.items()
    ):
        raise RuntimeError("Missing immutable original generation/session ID")
    return originals


def safe_signed_url(url: str, generation_id: str, session_id: str):
    if not isinstance(url, str) or len(url) > 4096:
        raise RuntimeError("Invalid signed media URL")
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != "https" or parsed.hostname != DOMAIN
        or parsed.username or parsed.password or parsed.port is not None
        or parsed.fragment):
        raise RuntimeError("Download host must be the official ElevenLabs media domain")
    match = PATH_RE.fullmatch(parsed.path)
    if not match or match.groups() != (session_id, generation_id):
        raise RuntimeError("Signed URL does not belong to the exact paid generation")
    query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
    if not all(query.get(k) and query[k][0] for k in ("Expires", "KeyName", "Signature")):
        raise RuntimeError("Missing official signed media authorization")
    try:
        exp = int(query["Expires"][0])
    except (ValueError, TypeError):
        raise RuntimeError("Malformed signed media expiry") from None
    if exp <= time.time() + 20:
        raise RuntimeError("Signed media URL is expired or nearly expired")
    return url


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Keep authenticated download strictly on the pinned official host.
        if urllib.parse.urlsplit(newurl).hostname != DOMAIN:
            raise RuntimeError("Refusing signed audio redirect outside ElevenLabs")
        raise RuntimeError("Unexpected signed audio redirect; do not follow")


def media_duration(path):
    p = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name:format=duration",
        "-of", "json", str(path)
    ], capture_output=True, text=True, check=True)
    data = json.loads(p.stdout)
    streams = data.get("streams") or []
    if len(streams) != 1 or streams[0].get("codec_name") != "mp3":
        raise RuntimeError("Original file is not MP3 audio")
    value = float(data["format"]["duration"])
    if not (0.35 <= value <= 100):
        raise RuntimeError("Audio duration outside expected range")
    return value


def verified_mp3(path):
    if not path.is_file() or not (MIN_AUDIO_BYTES <= path.stat().st_size <= MAX_AUDIO_BYTES):
        raise RuntimeError("Missing or unreasonable original MP3 size")
    return media_duration(path)


def signed_entries(path: pathlib.Path, originals):
    raw = json.loads(path.read_text("utf-8"))
    rows = raw.get("items")
    if not isinstance(rows, list) or len(rows) != len(originals):
        raise RuntimeError("Exactly 76 signed original URLs required; renew expired links")
    urls = {}
    for row in rows:
        key = row.get("generationId") if isinstance(row, dict) else None
        if key not in originals or key in urls:
            raise RuntimeError("Unexpected or repeated signed generation ID")
        urls[key] = safe_signed_url(
            row.get("contentUrl"), key, originals[key]["sessionId"]
        )
    if set(urls) != set(originals):
        raise RuntimeError("Incomplete signed original list")
    return urls


def download_original(url, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    opener = urllib.request.build_opener(NoRedirect)
    # Restrict to one official GET, limited and atomic. Never log its signature.
    request = urllib.request.Request(
        url, method="GET", headers={"User-Agent": "DAR-Kids-Sidq-Original-Downloader/1"}
    )
    temp = None
    try:
        with opener.open(request, timeout=50) as response:
            if response.status != 200:
                raise RuntimeError("ElevenLabs original download failed")
            media_type = response.headers.get_content_type()
            if media_type not in ("audio/mpeg", "audio/mp3", "application/octet-stream"):
                raise RuntimeError("Signed URL returned non-audio content")
            with tempfile.NamedTemporaryFile(
                mode="wb", suffix=".mp3", prefix=".audio-tmp-",
                dir=target.parent, delete=False,
            ) as f:
                temp = pathlib.Path(f.name)
                size = 0
                while True:
                    chunk = response.read(131072)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_AUDIO_BYTES:
                        raise RuntimeError("Audio download exceeded allowed file size")
                    f.write(chunk)
        verified_mp3(temp)
        temp.replace(target)
    finally:
        if temp and temp.exists():
            temp.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=pathlib.Path, required=True)
    parser.add_argument("--signed-urls", type=pathlib.Path)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status", action="store_true")
    group.add_argument("--download", action="store_true")
    args = parser.parse_args()
    originals = source_inventory()
    source_dir = args.source_dir.resolve()
    existing = set()
    for gen_id in originals:
        file = source_dir / (gen_id + ".mp3")
        if file.is_file():
            verified_mp3(file)
            existing.add(gen_id)
    if args.status:
        print(json.dumps({
            "topic": "akhlaq/sidq", "flowId": FLOW, "requiredOriginals": len(originals),
            "alreadyDownloadedValid": len(existing), "missingOriginals": 76-len(existing),
            "newGenerationRequested": False, "publiclyReleased": False,
        }, ensure_ascii=False))
        return
    if not args.signed_urls:
        parser.error("--signed-urls required for --download")
    urls = signed_entries(args.signed_urls.resolve(), originals)
    source_dir.mkdir(parents=True, exist_ok=True)
    for number, gen_id in enumerate(originals, 1):
        if gen_id in existing:
            continue
        download_original(urls[gen_id], source_dir / (gen_id + ".mp3"))
        print(f"Downloaded canonical original {number}/76, {gen_id}", flush=True)
    sha_ledger = {
        "schemaVersion": 1, "topic": "akhlaq/sidq", "flowId": FLOW,
        "origin": "original-elevenlabs-creative-signed-audio-get",
        "newTtsGenerations": 0,
        "createdUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "entries": {
            key: {
                "sha256": hashlib.sha256((source_dir / (key + ".mp3")).read_bytes()).hexdigest(),
                "bytes": (source_dir / (key + ".mp3")).stat().st_size,
                "durationSeconds": round(verified_mp3(source_dir / (key + ".mp3")), 3),
                "sessionId": value["sessionId"],
            }
            for key, value in originals.items()
        },
    }
    dest = source_dir / "_official-originals-sha256.json"
    dest.write_text(json.dumps(sha_ledger, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print("76/76 original MP3s verified. No synthesis. Run the existing --import job next.")


if __name__ == "__main__":
    main()
