#!/usr/bin/env python3
"""Import exact already-generated eleven_v4 review takes from short-lived signed
ElevenLabs asset links; never synthesizes speech or enables the public Kids app.
"""
from __future__ import annotations
import hashlib
import json
import os
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "kids/review-only/quiz-v4-creative-v4candidate-transfer-20261022.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
PRIORITY = ROOT / "kids/review-only/quiz-v4-450-next-completion-priority.json"
OUTPUT = ROOT / "kids/review-only/quiz-v4-creative-v4candidate-transfer-results-20261022.json"
AUDIO = ROOT / "kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def verify_and_store(row):
    phrase = row["text"]
    h = hashlib.sha256(phrase.encode("utf-8")).hexdigest()
    require(h == row["textSha256"], "source text SHA mismatch")
    require(len(phrase) < 400 and phrase.strip() == phrase, "invalid source utterance")
    require(row["modelId"] == MODEL and row["voiceId"] == VOICE, "wrong voice or model")
    url = row["signedSourceUrl"]
    parsed = urllib.parse.urlsplit(url)
    require(parsed.scheme == "https" and parsed.netloc == "storage.googleapis.com", "untrusted media origin")
    require("/content_generation/" in parsed.path and parsed.path.endswith("/content.mp3"), "wrong media asset path")
    require(parsed.path.split("/content_generation/")[1].split("/")[1] == row["generationId"],
            "generation reference does not match signed media path")
    require("X-Goog-Signature=" in parsed.query and "X-Goog-Expires=" in parsed.query,
            "expected short-lived provider-signed source")
    req = urllib.request.Request(url, headers={"User-Agent":"DAR-KIDS-V4-exact-review-import/1"})
    with urllib.request.urlopen(req, timeout=45) as response:
        require(response.status == 200, "download denied")
        audio = response.read(2_000_000)
        require(1800 < len(audio) < 2_000_000 and response.read(1) == b"", "audio size invalid")
    # ffprobe validates the actual MP3 codec below; legitimate MP3 files may lack ID3 headers.
    AUDIO.mkdir(parents=True, exist_ok=True)
    target = AUDIO / (h[:32] + ".mp3")
    require(not target.exists(), "candidate exact destination already exists; never overwrite")
    target.write_bytes(audio)
    meta = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
        "format=duration:stream=codec_name,codec_type", "-of", "json", str(target)],
        capture_output=True, text=True, check=True)
    j = json.loads(meta.stdout)
    a = [s for s in j.get("streams", []) if s.get("codec_type") == "audio"]
    duration = float(j.get("format", {}).get("duration") or 0)
    require(len(a) == 1 and a[0].get("codec_name") == "mp3" and 0.5 < duration < 40,
            "MP3 codec or duration fail")
    vol = subprocess.run(["ffmpeg", "-v", "info", "-i", str(target), "-af",
        "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True, check=True)
    require("mean_volume:" in vol.stderr, "cannot verify voiced audio")
    return {
        "url": "/" + str(target.relative_to(ROOT)),
        "textSha256": h,
        "sha256": hashlib.sha256(audio).hexdigest(),
        "bytes": len(audio),
        "modelId": MODEL, "voiceId": VOICE,
        "audioListeningApproved": False,
        "qaApproval": "pending-human-auditory-review",
        "source": "elevenlabs-creative-v4-owner-master-without-confirmed-provider-dictionary",
        "status": "V4_CANDIDATE_ORIGINAL_SAVED_REVIEW_ONLY_NOT_PUBLISHED",
        "generationId": row["generationId"],
        "durationSeconds": round(duration, 3),
        "pronunciationDictionaryAppliedVerified": False
    }

def main():
    transfer = load(MANIFEST)
    require(transfer.get("scope") == "KIDS_QUIZ_V4_CANDIDATES_REVIEW_ONLY", "scope mismatch")
    require(transfer.get("reviewOnly") is True and transfer.get("publicReleaseAllowed") is False,
            "review-only guard missing")
    candidates = transfer.get("items") or []
    require(0 < len(candidates) <= 6, "batch must be small, verified and auditable")
    require(len({x["textSha256"] for x in candidates}) == len(candidates), "duplicate text")
    require(len({x["generationId"] for x in candidates}) == len(candidates), "duplicate generation IDs")
    r = load(REGISTRY)
    require(r.get("voiceId") == VOICE and r.get("modelId") == MODEL and r.get("live") is False,
            "production registry guard")
    priority = load(PRIORITY)
    permitted = {t for q in priority.get("possibleNewSpeechPriorityAfterOriginalRecovery", [])
                 for t in q.get("newTextSha256", [])}
    already = set(x.get("textSha256") for x in (r.get("textClips") or {}).values())
    for x in candidates:
        require(x["textSha256"] in permitted, "not an approved genuinely NEW source text SHA")
        require(x["textSha256"] not in already, "text already paid/saved, never import duplicate")
    receipt = []
    for x in candidates:
        result = verify_and_store(x)
        r["textClips"][x["text"]] = result
        receipt.append({"questionId":x["questionId"],"part":x["part"],
                        "textSha256":x["textSha256"],"generationId":x["generationId"],
                        "newMp3SHA256":result["sha256"],
                        "creditsReportedByProvider":x["creditsReportedByProvider"],
                        "durationSeconds":result["durationSeconds"],
                        "localUrl":result["url"],"humanListeningApproved":False})
    REGISTRY.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    OUTPUT.write_text(json.dumps({"scope":"KIDS_V4_450_REVIEW_ONLY",
        "sourceManifest":MANIFEST.name,"count":len(receipt),
        "sourceContainsConfirmedDictionary":False,
        "publicReleaseAllowed":False,"listeningApprovalCount":0,
        "noNewTtsApiCallsByImporter":True,"receipts":receipt},
        ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("IMPORTED_GENERATED_REVIEW_V4_MP3",len(receipt), "NO TTS CALL / NO PUBLIC PUSH")

if __name__ == "__main__":
    main()
