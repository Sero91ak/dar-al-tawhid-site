#!/usr/bin/env python3
"""Benchmark DĀR Voice through the public cloud gateway.

Usage:
  DAR_VOICE_WEB_TOKEN='...' python voice-studio/cloud-gpu/benchmark.py --text-file sample.txt

Reports:
- job acceptance latency
- first progressive audio latency
- final render latency
- output bytes, when available

The access code is exchanged for an HttpOnly session and is never written to disk.
"""
from __future__ import annotations

import argparse
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def request_json(opener, url, *, method="GET", body=None, timeout=30):
    data = None
    headers = {"Accept": "application/json", "Cache-Control": "no-store"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with opener.open(req, timeout=timeout) as res:
            raw = res.read()
            return res.status, json.loads(raw.decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            payload = json.loads(raw or "{}")
        except Exception:
            payload = {"error": raw[:500]}
        return exc.code, payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.environ.get("DAR_VOICE_PUBLIC_BASE", "https://dar-al-tawhid.de"))
    ap.add_argument("--text-file")
    ap.add_argument("--text")
    ap.add_argument("--style", default="narration")
    ap.add_argument("--timeout", type=float, default=900.0)
    args = ap.parse_args()

    text = args.text or ""
    if args.text_file:
        text = open(args.text_file, "r", encoding="utf-8").read()
    text = text.strip()
    if not text:
        raise SystemExit("Text fehlt. --text oder --text-file angeben.")

    token = os.environ.get("DAR_VOICE_WEB_TOKEN", "").strip()
    if not token:
        raise SystemExit("DAR_VOICE_WEB_TOKEN fehlt in der Umgebung.")

    base = args.base.rstrip("/")
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    status, access = request_json(
        opener,
        base + "/voice-studio/api/access",
        method="POST",
        body={"code": token},
    )
    if status != 200 or not access.get("ok"):
        raise SystemExit(f"Cloud-Zugang fehlgeschlagen: HTTP {status} {access}")

    health_status, health = request_json(opener, base + "/voice-studio/api/engine/health")
    if health_status != 200 or not health.get("ok"):
        raise SystemExit(f"Engine nicht gesund: HTTP {health_status} {health}")

    if health.get("model_state") != "ready":
        request_json(
            opener,
            base + "/voice-studio/api/engine/warmup",
            method="POST",
            body={},
        )
        deadline = time.monotonic() + min(args.timeout, 300.0)
        while time.monotonic() < deadline:
            time.sleep(0.5)
            _, health = request_json(opener, base + "/voice-studio/api/engine/health")
            if health.get("model_state") == "ready":
                break
        else:
            raise SystemExit("Modell wurde nicht rechtzeitig warm.")

    started = time.perf_counter()
    status, start = request_json(
        opener,
        base + "/voice-studio/api/engine/generate-start",
        method="POST",
        body={"text": text, "style": args.style, "interactiveFast": True},
        timeout=60,
    )
    accepted = time.perf_counter()
    if status not in (200, 202) or not start.get("ok"):
        raise SystemExit(f"Jobstart fehlgeschlagen: HTTP {status} {start}")

    job_id = str(start.get("jobId") or "").strip()
    if not job_id:
        raise SystemExit(f"Job-ID fehlt: {start}")

    first_audio_at = None
    final_at = None
    last = None
    deadline = time.monotonic() + args.timeout

    while time.monotonic() < deadline:
        _, job = request_json(
            opener,
            base + "/voice-studio/api/engine/generate-job?id=" + urllib.parse.quote(job_id),
            timeout=30,
        )
        last = job
        render = job.get("render") or {}
        chunk_count = int(render.get("render_preview_chunk_count") or 0)
        preview_ready = bool(render.get("render_preview_ready"))
        if first_audio_at is None and (chunk_count > 0 or preview_ready):
            first_audio_at = time.perf_counter()

        state = str(job.get("state") or "")
        if state == "ready":
            final_at = time.perf_counter()
            break
        if state == "error":
            raise SystemExit("Renderfehler: " + str(job.get("error") or job))

        time.sleep(0.12)

    if final_at is None:
        raise SystemExit(f"Benchmark-Timeout. Letzter Zustand: {last}")

    result = {
        "ok": True,
        "engineVersion": health.get("engine_version"),
        "device": health.get("model_device"),
        "backend": health.get("production_backend"),
        "textChars": len(text),
        "jobAcceptMs": round((accepted - started) * 1000),
        "firstAudioMs": round((first_audio_at - started) * 1000) if first_audio_at else None,
        "finalAudioMs": round((final_at - started) * 1000),
        "finalAudioSeconds": round(final_at - started, 3),
        "outputBytes": int((last or {}).get("outputBytes") or 0),
        "reused": bool((last or {}).get("reused")),
        "reuseType": (last or {}).get("reuseType"),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
