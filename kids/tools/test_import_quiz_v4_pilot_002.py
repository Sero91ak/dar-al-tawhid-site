#!/usr/bin/env python3
"""Pure local regression: synthesize TEST TONES, no TTS or ElevenLabs credits."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from import_quiz_v4_pilot_002 import build, PILOT

def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
                   check=True, capture_output=True)

pilot = json.loads(PILOT.read_text(encoding="utf-8"))
with tempfile.TemporaryDirectory(prefix="kids-v4-pilot-002-qa-") as folder:
    temp = pathlib.Path(folder)
    source = temp / "originals"
    source.mkdir()
    for index, item in enumerate(pilot["parts"]):
        ffmpeg("-f", "lavfi", "-i",
               f"sine=frequency={380 + index * 180}:sample_rate=48000",
               "-t", str(item["durationSec"]),
               "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "128k",
               str(source / item["expectedLocalFile"]))
    output = temp / "kids-quiz-002-v4.mp3"
    dry = build(source, output, validate_only=True)
    assert dry["validated"] == 3 and not output.exists(), dry
    result = build(source, output)
    assert output.exists() and output.stat().st_size > 10000
    assert 9.4 < result["durationSeconds"] < 11.7, result
    assert len(result["sourceGenerationIds"]) == 3
    assert result["synthesisCreditsSpentByImport"] == 0
    assert result["audioListeningApproved"] is False
    assert result["publicationApproved"] is False
    print(f"PASS: 3 synthetic mp3 parts -> 1 iPhone-compatible MP3; {result['durationSeconds']} seconds, zero credits")
