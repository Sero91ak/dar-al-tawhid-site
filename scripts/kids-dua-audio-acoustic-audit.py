#!/usr/bin/env python3
"""Non-destructive, no-credit diagnostic for a few existing KIDS Du'a V4 words.

This checks audio-file readability and suspicious timing; it is NOT a
pronunciation, Qur'an accuracy or breath-free listening certification.
"""
from __future__ import annotations

from array import array
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys
import unicodedata
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "kids/data/dua-word-audio.json"
WORDS = (
    "رَبِّ", "زِدْنِي", "عِلْمًا", "لَا", "مَنْ",
    "هُوَ", "وَأَنْتَ", "الْحَمْدُ", "أَعُوذُ", "اللَّهُمَّ",
)
SAMPLE_RATE = 16000
FRAME_SIZE = 320


def key(text: str) -> str:
    return unicodedata.normalize("NFD", text.strip())


def inspect(word: str, entry: dict) -> dict:
    url = str(entry.get("url") or "")
    relative = urlsplit(url).path.lstrip("/")
    if not relative.startswith("kids/assets/kids-dua-word-audio/"):
        raise ValueError(f"Untrusted audio path for {word}: {relative}")
    path = (ROOT / relative).resolve()
    if ROOT not in path.parents or not path.is_file():
        raise FileNotFoundError(f"Missing word clip for {word}: {path}")

    process = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
         "-i", str(path), "-ar", str(SAMPLE_RATE), "-ac", "1",
         "-f", "s16le", "-acodec", "pcm_s16le", "-"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
        timeout=20,
    )
    pcm = array("h")
    pcm.frombytes(process.stdout)
    if sys.byteorder != "little":
        pcm.byteswap()
    if not pcm:
        raise ValueError(f"Silent or undecodable word clip: {word}")
    duration = len(pcm) / SAMPLE_RATE
    if not (0.1 <= duration <= 15):
        raise ValueError(f"Implausible duration for {word}: {duration:.2f} s")
    declared = float(entry.get("durationSeconds") or 0)
    if declared and abs(duration - declared) > 0.3:
        raise ValueError(f"Manifest duration mismatch for {word}: {duration:.2f} vs {declared:.2f}")

    rms = []
    for i in range(0, len(pcm), FRAME_SIZE):
        frame = pcm[i:i + FRAME_SIZE]
        if frame:
            rms.append(math.sqrt(sum(int(s) * int(s) for s in frame) / len(frame)))
    strongest = sorted(rms)
    reference = strongest[min(len(strongest) - 1, int(len(strongest) * 0.95))]
    threshold = max(70.0, reference * 0.15)
    audible = [i for i, value in enumerate(rms) if value >= threshold]
    leading = (audible[0] * FRAME_SIZE / SAMPLE_RATE) if audible else duration
    trailing = ((len(rms) - audible[-1] - 1) * FRAME_SIZE / SAMPLE_RATE) if audible else duration
    letters = sum("\u0621" <= ch <= "\u064a" for ch in word)
    # Large trailing/leading padding and very long short-word clips merit review,
    # but breath noise may overlap speech and cannot be classified by RMS alone.
    flags = []
    if leading >= 0.40:
        flags.append("long-leading-padding")
    if trailing >= 0.50:
        flags.append("long-trailing-padding")
    if duration >= 2.30 and letters <= 3:
        flags.append("short-word-overlong")
    return {
        "word": word,
        "seconds": round(duration, 3),
        "leadingQuietSeconds": round(leading, 3),
        "trailingQuietSeconds": round(trailing, 3),
        "reviewFlags": flags,
    }


def main() -> int:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("FFmpeg decoder unavailable: acoustic QA cannot pass without decoding audio")
    entries = json.loads(MANIFEST.read_text(encoding="utf-8")).get("entries") or {}
    indexed = {key(word): entry for word, entry in entries.items()}
    rows = []
    for word in WORDS:
        record = indexed.get(key(word))
        if not record:
            raise KeyError(f"Cannot find displayed Arabic word in V4 manifest: {word}")
        rows.append(inspect(word, record))
    print(json.dumps({
        "status": "AUDIT_ONLY_NOT_HUMAN_APPROVED",
        "model": "existing-eleven-v4",
        "samples": len(rows),
        "results": rows,
        "humanAudioReviewStillRequired": True,
    }, ensure_ascii=False, indent=2))
    print("KIDS DUA ACOUSTIC AUDIT PASS: sample files decode; flagged timings require listening")
    return 0


if __name__ == "__main__":
    sys.exit(main())
