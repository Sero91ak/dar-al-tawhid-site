#!/usr/bin/env python3
"""Locally compose V4 quiz phrases without new synthesis for repeated instructions.

All generated parts come from the SAME authorized Serhat Master with Eleven v4.
Question/audio manifest keys stay byte-for-byte equal to the original full text.
No ElevenLabs secrets or network calls occur in this module.
"""
from __future__ import annotations

import hashlib
import pathlib
import subprocess
import tempfile
from collections.abc import Callable


JOIN_REVISION = "quiz-v4-phrase-audio-v1"
PAUSE_SECONDS = 0.24


def composed_digest(full_text: str, voice_id: str, model_id: str, profile: str) -> str:
    payload = "\n".join((JOIN_REVISION, voice_id, model_id, profile, full_text))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def _run(args: list[str]) -> None:
    subprocess.run(args, check=True, capture_output=True, text=True)


def compose_clips(
    *,
    full_text: str,
    segments: list[str],
    voice_id: str,
    model_id: str,
    profile: str,
    output_dir: pathlib.Path,
    synth_part: Callable[[str], pathlib.Path],
    read_duration: Callable[[pathlib.Path], float],
) -> tuple[pathlib.Path, float]:
    """Compose verified local audio with a gentle real pause between sentences.

    Reusable fragments remain in output_dir so later quiz batches cost 0 credits
    for matching text/profile/model/dictionary. Atomic replace prevents broken
    files from being exposed after an interrupted ffmpeg process.
    """
    if len(segments) < 2 or not all(isinstance(s, str) and s.strip() for s in segments):
        raise ValueError("Phrase composition requires two or more non-empty sentences")
    if " ".join(s.strip() for s in segments) != full_text:
        raise ValueError("Phrase text differs from the exact quiz manifest key")
    target = output_dir / (composed_digest(full_text, voice_id, model_id, profile) + ".m4a")
    output_dir.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 1200:
        length = read_duration(target)
        if 0.25 <= length <= 180:
            return target, length

    clips = []
    for part in segments:
        path = pathlib.Path(synth_part(part))
        if not path.is_file() or path.stat().st_size < 1200:
            raise ValueError(f"Missing playable V4 component for {part[:40]!r}")
        clips.append(path)

    with tempfile.TemporaryDirectory(prefix="kids-quiz-v4-join-") as tmp:
        tmpdir = pathlib.Path(tmp)
        silence = tmpdir / "quiet.m4a"
        _run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
            "-t", str(PAUSE_SECONDS), "-c:a", "aac", "-b:a", "48k",
            "-ar", "48000", "-ac", "1", "-movflags", "+faststart",
            str(silence),
        ])
        sequence = []
        for i, clip in enumerate(clips):
            if i:
                sequence.append(silence)
            sequence.append(clip)
        listing = tmpdir / "pieces.txt"
        listing.write_text(
            "".join("file '" + str(p.resolve()).replace("'", "'\\''") + "'\n" for p in sequence),
            encoding="utf-8",
        )
        temp_out = tmpdir / "assembled.m4a"
        _run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(listing),
            "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", "48k",
            "-movflags", "+faststart", str(temp_out),
        ])
        if not temp_out.exists() or temp_out.stat().st_size < 1200:
            raise ValueError("Composed V4 file was too small")
        length = read_duration(temp_out)
        if not 0.25 <= length <= 180:
            raise ValueError(f"Composed V4 duration invalid: {length}")
        temp_out.replace(target)
    return target, length
