#!/usr/bin/env python3
"""Import and join the three ALREADY PAID quiz #002 V4 segments locally.

This script NEVER calls ElevenLabs or makes network requests. Export the three
original MP3s into --input-dir under the filenames in the pilot manifest.
Use --output to write ONE child-friendly MP3 with 240-ms pauses.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
PILOT = ROOT / "kids/data/quiz-v4-pilot-002.json"


def command(*args: str, tolerate_error: bool = False) -> subprocess.CompletedProcess:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode and not tolerate_error:
        raise RuntimeError(
            f"Audio tool failed ({result.returncode}): {result.stderr[-1200:]}"
        )
    return result


def details(path: Path) -> tuple[float, str]:
    if not path.is_file() or path.stat().st_size < 2000:
        raise ValueError(f"Audio missing or too small: {path}")
    response = command(
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration:stream=codec_name,codec_type", "-of", "json", str(path)
    )
    data = json.loads(response.stdout)
    duration = float((data.get("format") or {}).get("duration") or 0)
    streams = [s for s in data.get("streams") or [] if s.get("codec_type") == "audio"]
    if not streams or not 0.4 <= duration <= 60:
        raise ValueError(f"Audio invalid or implausible duration: {path}")
    return duration, str(streams[0].get("codec_name") or "")


def build(input_dir: Path, output: Path, validate_only: bool = False) -> dict:
    pilot = json.loads(PILOT.read_text(encoding="utf-8"))
    if pilot["modelId"] != "eleven_v4" or pilot["questionNumber"] != 2:
        raise ValueError("Wrong V4 pilot manifest")
    if pilot["textContract"] != " ".join(x["text"] for x in pilot["parts"]):
        raise ValueError("Pilot spoken text does not match source contract")
    if len(pilot["parts"]) != 3:
        raise ValueError("Exactly three original V4 parts required")
    originals = []
    durations = []
    for item in pilot["parts"]:
        original = input_dir / item["expectedLocalFile"]
        seconds, codec = details(original)
        if codec.lower() != "mp3":
            raise ValueError(f"Expected exported ElevenLabs MP3: {original} ({codec})")
        if abs(seconds - item["durationSec"]) > 2.0:
            raise ValueError(f"Audio duration differs from paid original {item['index']}: {seconds}")
        originals.append(original)
        durations.append(seconds)
    if validate_only:
        return {"validated": 3, "creditsSpent": 0, "expectedSpokenSeconds": sum(durations)}

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="kids-quiz-002-v4-") as working:
        tmp = Path(working)
        pcm = []
        for index, part in enumerate(originals):
            dest = tmp / f"part-{index+1}.wav"
            command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(part), "-ar", "48000", "-ac", "1",
                    "-c:a", "pcm_s16le", str(dest))
            pcm.append(dest)
        pause = tmp / "pause.wav"
        command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                "-t", str(pilot["pauseBetweenPartsMs"] / 1000),
                "-c:a", "pcm_s16le", str(pause))
        sequence = [pcm[0], pause, pcm[1], pause, pcm[2]]
        concat_list = tmp / "sequence.txt"
        concat_list.write_text(
            "".join("file '" + str(x.resolve()).replace("'", "'\\''") + "'\n"
                    for x in sequence), encoding="utf-8"
        )
        result = tmp / "joined.mp3"
        command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "concat", "-safe", "0", "-i", str(concat_list),
                "-ar", "48000", "-ac", "1",
                "-codec:a", "libmp3lame", "-b:a", "128k",
                "-metadata", "title=Ist Allah Einer? - KIDS V4 Pilot",
                str(result))
        total, codec = details(result)
        expected = sum(durations) + 2 * pilot["pauseBetweenPartsMs"] / 1000
        if codec != "mp3" or abs(total - expected) > 1.0:
            raise RuntimeError(f"Joined audio failed QA: {total:.2f}s vs expected {expected:.2f}s")
        result.replace(output)

    return {
        "questionId": pilot["questionId"],
        "provider": pilot["provider"],
        "modelId": pilot["modelId"],
        "voiceId": pilot["voiceId"],
        "sourceGenerationIds": [x["originalGenerationId"] for x in pilot["parts"]],
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "durationSeconds": round(details(output)[0], 3),
        "fileBytes": output.stat().st_size,
        "pauseBetweenPartsMs": pilot["pauseBetweenPartsMs"],
        "synthesisCreditsSpentByImport": 0,
        "audioListeningApproved": False,
        "publicationApproved": False
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-dir", required=True, type=Path,
                    help="Folder with 01-opening.mp3, 02-question.mp3, 03-guidance.mp3")
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--validate-only", action="store_true")
    args = ap.parse_args()
    result = build(args.input_dir, args.output, args.validate_only)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
