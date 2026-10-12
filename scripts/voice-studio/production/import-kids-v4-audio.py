#!/usr/bin/env python3
"""One-time import of approved ElevenLabs V4 KIDS master audio without replacing existing masters."""
import datetime
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AGE_KEYS = ("4-5", "6-8", "9-10")
KIND_CONFIG = {
    "prophet": ("kids/data/prophet-stories.json", "kids/assets/prophet-story-audio", "story.mp3"),
    "sahabiyyah": ("kids/data/sahabiyyat-stories.json", "kids/assets/sahabiyyat-story-audio", "master.mp3"),
}

def run(*cmd):
    return subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True).strip()

def duration(path):
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)))

def download(source_url, target):
    parsed = urllib.parse.urlparse(source_url)
    if parsed.scheme != "https" or parsed.hostname != "storage.googleapis.com" or not parsed.path.startswith("/xi-backend/database/workspace/"):
        raise ValueError("Blocked untrusted or non-ElevenLabs audio download URL")
    req = urllib.request.Request(source_url, headers={"User-Agent": "DAR-KIDS-V4-Audio-Importer/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response, target.open("wb") as output:
        shutil.copyfileobj(response, output)
    if target.stat().st_size < 30000:
        raise ValueError("Generated audio is unexpectedly small: " + str(target))
    if not 10 <= duration(target) <= 1000:
        raise ValueError("Unreasonable source audio duration: " + str(target))

def import_batch(manifest_path):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("model") != "eleven_v4" or manifest.get("voiceId") != "DkU7j9uO4ZEtLD2iRZSH":
        raise ValueError("Incorrect ElevenLabs model/owner voice: import prohibited")
    rows = manifest.get("items", [])
    if not rows or len(rows) > 34:
        raise ValueError("Expected 1–34 approved stories")
    data = {}
    for kind, (json_path, _, _) in KIND_CONFIG.items():
        data[kind] = json.loads((ROOT / json_path).read_text(encoding="utf-8"))
    report = {"imported": [], "skipped_existing": [], "model": "eleven_v4"}
    planned = []
    with tempfile.TemporaryDirectory(prefix="kids-v4-") as tmpdir:
        tmp = Path(tmpdir)
        seen = set()
        for row in rows:
            kind, story_id = row.get("kind"), row.get("id")
            if kind not in KIND_CONFIG or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(story_id)):
                raise ValueError("Invalid kind or story id")
            key = (kind, story_id)
            if key in seen:
                raise ValueError("Duplicated story: " + str(key))
            seen.add(key)
            story = next((x for x in data[kind]["items"] if x.get("id") == story_id), None)
            if not story:
                raise ValueError("Unknown story " + str(key))
            texts = [story.get("scripts", {}).get(k) for k in AGE_KEYS]
            if not all(texts) or len(set(texts)) != 1:
                raise ValueError("Missing or inconsistent approved story master text " + str(key))
            existing = story.get("audio") or {}
            if any((existing.get(k) or {}).get("url") for k in AGE_KEYS):
                if all((existing.get(k) or {}).get("url") for k in AGE_KEYS):
                    report["skipped_existing"].append({"kind": kind, "id": story_id})
                    continue
                raise ValueError("Partial audio previously exists: don't overwrite")
            urls = row.get("urls")
            if not isinstance(urls, list) or not 1 <= len(urls) <= 2:
                raise ValueError("Expected one or two rendered ElevenLabs parts " + str(key))
            _, directory, filename = KIND_CONFIG[kind]
            dest = ROOT / directory / story_id / filename
            if dest.exists():
                raise ValueError("Refusing to overwrite existing disk master " + str(dest))
            segment_paths = []
            for idx, url in enumerate(urls):
                part = tmp / (kind + "_" + story_id + "_" + str(idx + 1) + ".mp3")
                download(url, part)
                segment_paths.append(part)
            prepared = tmp / (kind + "_" + story_id + "_master.mp3")
            if len(segment_paths) == 1:
                shutil.copyfile(segment_paths[0], prepared)
            else:
                file_list = tmp / (kind + "_" + story_id + "_concat.txt")
                file_list.write_text("".join("file '" + str(p) + "'\n" for p in segment_paths), encoding="utf-8")
                subprocess.check_call(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(file_list), "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", str(prepared)])
            sec = round(duration(prepared), 3)
            if not 30 <= sec <= 1200:
                raise ValueError("Invalid final audio duration " + str(key))
            planned.append((kind, story_id, story, prepared, dest, sec, len(urls)))
        # Only start writing into the tracked repository once all pending source downloads validated.
        now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
        for kind, story_id, story, prepared, dest, sec, parts in planned:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(prepared, dest)
            public_url = "/" + dest.relative_to(ROOT).as_posix() + "?v=20261012-v4"
            meta = {"url": public_url, "status": "ready", "durationSec": sec, "source": "ElevenLabs V4 · Serhat Abu Malik – Master", "modelId": "eleven_v4", "voiceProfileId": "DkU7j9uO4ZEtLD2iRZSH", "masterAudio": True, "singleMasterAudio": True, "masterAgeRange": "4-10", "allAges": True, "publishedAt": now, "segmentCountBeforeMerge": parts}
            story["audio"] = {age: dict(meta) for age in AGE_KEYS}
            vp = story.setdefault("voiceProduction", {})
            vp.update({"status": "audio-complete", "audioRefreshRequired": False, "lastPublishedAt": now, "singleMasterAudio": True, "masterAgeRange": "4-10", "masterAudioUrl": public_url, "permanentAudioPath": "/" + dest.relative_to(ROOT).as_posix(), "source": "ElevenLabs V4 Serhat Abu Malik Master", "followReaderSync": "not-yet-forced-aligned"})
            report["imported"].append({"kind": kind, "id": story_id, "durationSec": sec, "partsMerged": parts, "bytes": dest.stat().st_size})
        for kind, (json_path, _, _) in KIND_CONFIG.items():
            if any(i["kind"] == kind for i in report["imported"]):
                data[kind]["updatedAt"] = now
                (ROOT / json_path).write_text(json.dumps(data[kind], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        report_path = ROOT / "scripts/voice-studio/production/kids-v4-import-report.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
    return len(report["imported"])

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: import-kids-v4-audio.py manifest.json")
    import_batch(ROOT / sys.argv[1])
