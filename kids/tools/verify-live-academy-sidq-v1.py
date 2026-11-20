#!/usr/bin/env python3
"""Read-only production delivery proof for all 58 genuine Ṣidq master clips.

Checks actual public Cloudflare response bytes, not just a green GitHub build.
No TTS calls, no private secrets, no player changes, no rollback.
Use after Workers deployment or within the KIDS Academy live-audio workflow.
"""
from __future__ import annotations
import concurrent.futures
import hashlib
import json
import pathlib
import random
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
HOST = "https://dar-al-tawhid.de"
MANIFEST = "/kids/data/academy-audio.json"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"


def fetch(route, *, timeout=24, size_limit=12 * 1024 * 1024):
    if (not isinstance(route, str) or not route.startswith("/kids/")
            or route.startswith("//") or ".." in route or "#" in route or "?" in route):
        raise RuntimeError("Unsafe public Kids asset path")
    err = None
    for attempt in range(3):
        url = HOST + route + "?audio-verification=" + str(int(time.time())) + "-" + str(attempt)
        req = urllib.request.Request(url, headers={
            "User-Agent": "Dar-Kids-MasterVoice-LiveIntegrity/1.0",
            "Accept": "*/*", "Cache-Control": "no-cache",
        })
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status != 200:
                    raise RuntimeError("HTTP " + str(response.status))
                body = response.read(size_limit + 1)
                if len(body) > size_limit:
                    raise RuntimeError("Exceeded legitimate audio media limit")
                mimetype = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                if (body[:16].lstrip().lower().startswith((b"<html", b"<!doctype"))):
                    raise RuntimeError("HTML returned instead of Kids audio JSON/media")
                return body, mimetype
        except (RuntimeError, urllib.error.URLError, TimeoutError, OSError) as exc:
            err = str(exc)
            if attempt < 2:
                time.sleep(1 + attempt)
    raise RuntimeError("Cloudflare delivery failed at " + route + ": " + str(err))


def sidq_entries(document):
    if (not isinstance(document, dict)
            or document.get("id") != "KIDS_ACADEMY_SERHAT_MASTER_V1"
            or document.get("voiceProfileId") != "serhat-owner-voice-2026"):
        raise RuntimeError("Wrong public Academy manifest")
    rows = {name: e for name, e in (document.get("entries") or {}).items()
            if isinstance(e, dict) and e.get("sourceLessonId") == "sidq"}
    if len(rows) != 58:
        raise RuntimeError("Expected exactly 58 Ṣidq canonical audio entries, got " + str(len(rows)))
    for name, e in rows.items():
        if not (
            e.get("modelId") == "eleven_v4"
            and e.get("voiceId") == VOICE
            and e.get("sourceVoice") == "authorized-owner-voice"
            and e.get("sourceSpeaker") == "Serhat Abu Malik"
            and e.get("sourceSubject") == "akhlaq"
            and e.get("approvedForPlayback") is True
            and isinstance(e.get("sha256"), str)
            and len(e["sha256"]) == 64
            and isinstance(e.get("url"), str)
            and e["url"].startswith("/kids/assets/kids-academy-audio/")
            and e["url"].endswith(".m4a")
            and "?" not in e["url"] and "#" not in e["url"]
        ):
            raise RuntimeError("Invalid Ṣidq media declaration: " + name)
    return rows


def verify_track(item):
    name, e = item
    body, mime = fetch(e["url"])
    if mime not in ("audio/mp4", "audio/x-m4a", "video/mp4", "application/octet-stream"):
        raise RuntimeError("Wrong audio content type for " + name + ": " + mime)
    if len(body) < 1200:
        raise RuntimeError("Incomplete real audio bytes for " + name)
    sha = hashlib.sha256(body).hexdigest()
    if sha != e["sha256"]:
        raise RuntimeError("Live audio differs from GitHub original: " + name)
    return name, len(body)


def main():
    source = json.loads((ROOT / MANIFEST.lstrip("/")).read_text("utf-8"))
    expected = sidq_entries(source)
    body, mime = fetch(MANIFEST, timeout=25, size_limit=4 * 1024 * 1024)
    if mime not in ("application/json", "text/json", "text/plain"):
        raise RuntimeError("Cloudflare returned non-JSON Academy manifest: " + mime)
    live = sidq_entries(json.loads(body.decode("utf-8")))
    if set(expected) != set(live):
        raise RuntimeError("Cloudflare manifest does not contain exactly the expected 58 texts")
    for name, e in expected.items():
        if any(live[name].get(field) != e.get(field)
               for field in ("url", "sha256", "voiceId", "modelId", "sourceGenerationIds")):
            raise RuntimeError("Cloudflare audio manifest is stale or incorrect: " + name)
    checked = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for result in pool.map(verify_track, sorted(expected.items())):
            checked.append(result)
    if len(checked) != 58:
        raise RuntimeError("Incomplete batch HTTP audit")
    print(json.dumps({
        "status": "PASS",
        "scope": "akhlaq/sidq",
        "liveUrl": HOST + "/kids/akademie/",
        "sourceOriginalVoice": "Serhat Abu Malik",
        "model": "eleven_v4",
        "canonicalTextsInCloudflareManifest": len(live),
        "http200Sha256MatchedM4a": len(checked),
        "audioBytesVerified": sum(x[1] for x in checked),
        "webAudioDeliveryVerified": True,
        "realIphoneIpadPlaybackNotTestedByThisScript": True,
        "future142EditorialOutlinesNotClaimedLive": True,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
