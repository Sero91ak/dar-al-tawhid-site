#!/usr/bin/env python3
"""Offline listening assets for 7–8 and 9–10 years, using only existing genuine V4 originals.

NEVER synthesizes speech, calls ElevenLabs, changes a public quiz manifest,
or labels anything as human-auditory-approved. Merges previously stored MP3
segments only when every exact text part already exists and verifies SHA256.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

from quiz_v4_first150_offline_join import assemble, hashfile, probe, source_mp3
from quiz_v4_quarantine import quarantined_originals
from quiz_v4_native_fusha_reuse import load_mapping, expand_slot

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
OUTPUT_DIR = ROOT / "kids/assets/kids-quiz-audio/v4-age7to10-composed-review"
PREVIEW = ROOT / "kids/data/quiz-v4-age7to10-composed-preview.json"
REPORT = ROOT / "kids/data/quiz-v4-age7to10-offline-coverage.json"
PARTS = ("question", "correct", "retry", "explanation")
BANDS = ("7-8", "9-10")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def checked_pauses(part, segments):
    pauses = part.get("pauseAfterMs", [])
    if not isinstance(pauses, list) or len(pauses) != len(segments) - 1:
        raise RuntimeError("V4 fragment/pause contract mismatch")
    if not all(isinstance(x, int) and 0 <= x <= 1600 for x in pauses):
        raise RuntimeError("Invalid original V4 pause duration")
    return pauses


def main():
    if load(FLAG).get("enabled") is not False:
        raise RuntimeError("Cannot generate non-live review assets with a release switch ON")
    plan, registry = load(PLAN), load(REGISTRY)
    if plan.get("voiceId") != VOICE or plan.get("modelId") != MODEL:
        raise RuntimeError("Unexpected plan voice/model")
    if registry.get("voiceId") != VOICE or registry.get("modelId") != MODEL or registry.get("live") is not False:
        raise RuntimeError("Unexpected original registry identity or live switch")
    if len(plan.get("recipes", [])) != 450:
        raise RuntimeError("Selected 450 V4 question contract changed")
    for band in ("4-6",) + BANDS:
        if sum(r["ageBand"] == band for r in plan["recipes"]) != 150:
            raise RuntimeError("Exactly 150 curated questions per age band required")

    # Keep paid original bytes and receipts, but reject the three recordings
    # made without the owner's pronunciation dictionary from ANY quiz preview.
    blocked_texts,blocked_generations=quarantined_originals(ROOT)
    originals={text:audio for text,audio in registry["textClips"].items()
               if text not in blocked_texts}
    generation={gid:audio for gid,audio in registry["generationClips"].items()
                if gid not in blocked_generations}
    mixed_mapping,native_assets=load_mapping(ROOT)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    # Strict source audio verification is cached only within this invocation.
    verified_source = {}
    def source(row):
        key = (row.get("url"), row.get("sha256"), row.get("voiceId"), row.get("modelId"))
        if key not in verified_source:
            verified_source[key] = source_mp3(row)
        return verified_source[key]

    # Metadata for the 46+ available unique spoken phrases, NOT 626 new MP3s.
    playable = {}
    per_question = {}
    counts = {}
    unrecorded = Counter()
    all_composites = set()
    for band in BANDS:
        band_rows = [r for r in plan["recipes"] if r["ageBand"] == band]
        present_fields = dict.fromkeys(PARTS, 0)
        missing_fields = dict.fromkeys(PARTS, 0)
        complete = 0
        for q in band_rows:
            id_ = q["questionId"]
            if id_ in per_question:
                raise RuntimeError("A question ID is duplicated across age bands")
            slots = {}
            for kind in PARTS:
                part = q[kind]
                text = part["text"]
                missing = []
                pauses = []
                original_paths = []
                if part["mode"] == "existing-paid-exact":
                    original = generation.get(part["generationId"])
                    if original is None:
                        missing = ["original-generation:" + part["generationId"]]
                    else:
                        original_paths = [source(original)]
                elif part["mode"] == "compose-from-segments":
                    segments = part["segments"]
                    if not isinstance(segments, list) or not segments or " ".join(segments) != text:
                        raise RuntimeError("V4 segmented utterance text is not exact")
                    matched,pauses,missing=expand_slot(part,originals,mixed_mapping,native_assets)
                    if not missing:
                        original_paths=[source(r) for r in matched]
                else:
                    raise RuntimeError("Unrecognized V4 part mode")
                if missing:
                    for frag in set(missing):
                        unrecorded[frag] += 1
                    missing_fields[kind] += 1
                    slots[kind] = {"available": False, "missingOriginalSegments": sorted(set(missing))}
                    continue

                if len(original_paths) == 1:
                    mp3 = original_paths[0]
                else:
                    token = digest(json.dumps({
                        "voice": VOICE, "model": MODEL,
                        "segments": part["segments"], "pauseAfterMs": pauses,
                        "joinedSourceShas": [hashfile(p) for p in original_paths]
                            if len(original_paths)!=len(part["segments"]) else [],
                    }, ensure_ascii=False, sort_keys=True))
                    mp3 = OUTPUT_DIR / (token[:40] + ".mp3")
                    if not mp3.is_file():
                        assemble(original_paths, pauses, mp3)
                    all_composites.add(mp3)

                # Verify both exact resulting codec and bytes, including cached joins.
                seconds = probe(mp3)
                if not 0.4 < seconds < 180:
                    raise RuntimeError("V4 assembled clip duration invalid")
                media = {
                    "url": "/" + str(mp3.relative_to(ROOT)),
                    "sha256": hashfile(mp3),
                    "voiceId": VOICE, "modelId": MODEL,
                    "qaApproval": "pending-human-auditory-review",
                    "audioListeningApproved": False,
                    "approvedForPlayback": False,
                    "source": "preexisting-original-v4-offline-join",
                    "status": "PRIVATE_REVIEW_ONLY_NOT_PUBLISHED"
                }
                previous = playable.get(text)
                if previous is not None and (previous["url"], previous["sha256"]) != (media["url"], media["sha256"]):
                    raise RuntimeError("One spoken phrase points to conflicting V4 audio. Manual adjudication required.")
                playable.setdefault(text, media)
                present_fields[kind] += 1
                slots[kind] = {"available": True, "textSha256": digest(text),
                               "mp3Sha256": media["sha256"], "url": media["url"]}
            complete += all(slots[k]["available"] for k in PARTS)
            per_question[id_] = {"ageBand": band, "parts": slots,
                                 "allFourPartsAvailable": all(slots[k]["available"] for k in PARTS)}
        counts[band] = {
            "questions": 150, "completeFourPartQuestions": complete,
            "availableFieldCounts": present_fields, "missingFieldCounts": missing_fields,
        }

    for p in all_composites:
        if not p.is_file() or p.stat().st_size < 1500:
            raise RuntimeError("Missing or empty original-only composite")
    report = {
        "scope": "TAWḤĪD KIDS existing eleven_v4 audio, ages 7–8 and 9–10",
        "reviewOnly": True, "publicManifestModified": False,
        "livePublished": False, "elevenLabsCreditsSpent": 0,
        "humanListeningApprovalsCreated": 0,
        "originalMP3sCreatedBySynthesis": 0,
        "sourceOriginalsVerified": len(verified_source),
        "uniqueFullAudioClipsAvailable": len(playable),
        "newOfflineComposites": len(all_composites),
        "byAge": counts,
        "missingUniqueOriginalSegments": len(unrecorded),
        "missingOriginalSegmentsByFrequency": [
            {"fragment": frag, "requiredByFields": count}
            for frag, count in unrecorded.most_common()
        ],
        "readyForLive": False
    }
    preview = {
        "schemaVersion": 1, "scope": "KIDS_AGE_7_TO_10_V4_PRIVATE_REVIEW_ONLY",
        "published": False, "humanListeningApproved": False,
        "voiceId": VOICE, "modelId": MODEL,
        "ageBands": list(BANDS), "entries": playable, "questions": per_question,
    }
    PREVIEW.write_text(json.dumps(preview, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KIDS_V4_AGE7_TO_10_OFFLINE_PREVIEW_PASS " + json.dumps({
        "byAge": counts, "uniqueFullAudioClips": len(playable),
        "offlineCompositeCount": len(all_composites),
        "missingOriginalSegments": len(unrecorded),
        "elevenLabsCreditsSpent": 0,
        "livePublished": False
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
