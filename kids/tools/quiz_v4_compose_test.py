#!/usr/bin/env python3
"""Offline synthetic audio test for V4 phrase reuse; NEVER calls ElevenLabs."""
from __future__ import annotations

import json
import pathlib
import shutil
import subprocess
import tempfile
from quiz_joy_v4_script import prepare, segment_plan
from quiz_v4_audio_compose import PAUSE_SECONDS, compose_clips

ROOT=pathlib.Path(__file__).resolve().parents[2]
items=json.loads((ROOT/"kids/data/quiz-kids.json").read_text(encoding="utf-8"))["items"]
assert len(items)==900
phrase_texts=set()
for q in items:
    original=prepare(q)
    segments=segment_plan(q)
    for name,parts in segments.items():
        assert " ".join(parts)==original[name],f"{q['id']}: {name}"
        phrase_texts.update(parts)
assert len(phrase_texts) < 1660, f"Unexpected explosion of phrases: {len(phrase_texts)}"
assert shutil.which("ffmpeg"),"ffmpeg required for joining test"
assert shutil.which("ffprobe"),"ffprobe required for duration test"

def duration(p:pathlib.Path)->float:
    return float(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1",str(p)
    ],text=True).strip())

with tempfile.TemporaryDirectory(prefix="kids-v4-cost-zero-test-") as t:
    folder=pathlib.Path(t)
    count=[0]
    def fake_synth(text:str)->pathlib.Path:
        import hashlib
        path=folder/(hashlib.sha256(text.encode("utf-8")).hexdigest()[:20]+".m4a")
        if path.is_file():return path
        count[0]+=1
        subprocess.run([
            "ffmpeg","-hide_banner","-loglevel","error","-y",
            "-f","lavfi","-i","sine=frequency=440:sample_rate=48000",
            "-t","0.60","-ac","1","-c:a","aac","-b:a","48k",str(path)
        ],check=True)
        return path
    q=items[1]
    row=prepare(q)
    seg=segment_plan(q)["questionAudioText"]
    result1,secs=compose_clips(
        full_text=row["questionAudioText"],segments=seg,
        voice_id="NON_BILLABLE_SYNTHETIC_TEST_ONLY",
        model_id="eleven_v4",profile="quiz_4_6",recipe_revision="test",
        output_dir=folder,synth_part=fake_synth,read_duration=duration
    )
    assert result1.exists() and result1.stat().st_size>1200
    assert abs(secs-(0.60*len(seg)+PAUSE_SECONDS*(len(seg)-1)))<0.30,secs
    generated=count[0]
    result2,secs2=compose_clips(
        full_text=row["questionAudioText"],segments=seg,
        voice_id="NON_BILLABLE_SYNTHETIC_TEST_ONLY",
        model_id="eleven_v4",profile="quiz_4_6",recipe_revision="test",
        output_dir=folder,synth_part=fake_synth,read_duration=duration
    )
    assert result1==result2 and generated==count[0], "Composite should be cached without resynthesizing"
    try:
        compose_clips(full_text="different key",segments=seg,voice_id="x",
            model_id="eleven_v4",profile="quiz_4_6",recipe_revision="test",
            output_dir=folder,synth_part=fake_synth,read_duration=duration)
    except ValueError:
        pass
    else:
        raise AssertionError("Incorrect spoken text must be rejected before any generation")
print(f"PASS: 900 plans, {len(phrase_texts)} unique phrases, natural pause join, caching, mismatch refusal; 0 paid credits")
