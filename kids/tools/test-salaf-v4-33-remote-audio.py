#!/usr/bin/env python3
"""Technical HTTP playback accessibility audit for 33 ORIGINAL Salaf V4 files.

No TTS synthesis, no publish, and absolutely no human hearing or native-device
certification. The noindex audition HTML is the only URL inventory.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = ROOT / "salaf-v4-33-hoeren-20261028.html"
REPORT = ROOT / "salaf-v4-33-remote-http-report.json"

def fail(message):
    raise RuntimeError(message)

def read_entries():
    html = HTML.read_text(encoding="utf-8")
    match = re.search(r"const SNAPSHOT=(\{[^\n]+\});\nconst INDEX_URL=", html)
    if not match:
        fail("33-story embedded audition data missing")
    data = json.loads(match.group(1))
    stories = data.get("items", [])
    entries = data.get("entries", {})
    if len(stories) != 33 or len(entries) != 33:
        fail("Expected precisely 33 records")
    checked = []
    for story in stories:
        sid = story["id"]
        row = entries[sid]
        source = row.get("_root", "") + row.get("audioFile", "")
        if not re.fullmatch(
            r"https://raw\.githubusercontent\.com/Sero91ak/dar-al-tawhid-site/[a-f0-9]{40}/kids/review-only/salaf-v4-(?:20261027|complete-20261028/salaf-v4-pending-0[1-8])/[a-z0-9-]+\.m4a",
            source,
        ):
            fail(sid + ": unsafe or mutable source")
        if row["audioFile"].split("/")[-1] != sid + ".m4a":
            fail(sid + ": wrong audio filename")
        expected_sha = hashlib.sha256(story["masterStoryText"].encode("utf-8")).hexdigest()
        if expected_sha != row.get("textSha256"):
            fail(sid + ": source text SHA mismatch")
        if row.get("modelId") != "eleven_v4" or row.get("languageCode") != "de":
            fail(sid + ": unexpected TTS source")
        if row.get("humanListeningApproved") is not False or row.get("releaseEnabled") is not False:
            fail(sid + ": simulated QA or unexpected release")
        cues = row.get("timings", [])
        if len(cues) != len(re.split(r"\n{2,}", story["masterStoryText"])):
            fail(sid + ": paragraph count changed")
        checked.append((sid, source, row["audioSha256"], len(cues)))
    if len({sid for sid, _, _, _ in checked}) != 33:
        fail("Duplicate story IDs")
    return checked

def fetch_sample(row):
    sid, url, sha, paragraphs = row
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Kids-Salaf-V4-Technical-HTTP-Audit/1.0",
                         "Range": "bytes=0-2047", "Accept": "audio/mp4,*/*"},
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=35) as response:
                code = response.status
                sample = response.read(2048)
                ctype = response.headers.get("Content-Type", "")
            if code not in (200, 206):
                fail(sid + ": server HTTP " + str(code))
            if len(sample) < 64 or sample[4:8] != b"ftyp":
                fail(sid + ": response not an MP4/M4A audio container")
            return {
                "storyId": sid, "status": "technical-original-audio-sample-reachable",
                "httpStatus": code, "sampleBytes": len(sample),
                "container": "mp4-ftyp", "mime": ctype,
                "audioSha256ExpectedFromIndependentProduction": sha,
                "paragraphCount": paragraphs, "humanListeningApproved": False,
            }
        except (OSError, RuntimeError, urllib.error.URLError) as exc:
            last = str(exc)
            time.sleep((attempt + 1) * 2)
    fail(sid + ": audio not reachable after retries: " + str(last))

def main():
    rows = read_entries()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        result = sorted(pool.map(fetch_sample, rows), key=lambda item: item["storyId"])
    output = {
        "collection": "Schätze der Salaf",
        "auditType": "HTTP-container-and-SHA-metadata-only",
        "originalAudioCount": len(result),
        "newGenerationInvoked": False,
        "publicKidsPlaybackApproved": False,
        "humanListeningCompleted": False,
        "nativeIphoneIpadDeviceChecked": False,
        "entries": result,
    }
    REPORT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS: 33 / 33 immutable V4 original M4A sources return audio bytes (HTTP 200/206); zero new ElevenLabs calls")
    print("Not a hearing check or approval for visitor Kids audio.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("SALAF 33 REMOTE AUDIO AUDIT FAILED:", exc, file=sys.stderr)
        sys.exit(2)
