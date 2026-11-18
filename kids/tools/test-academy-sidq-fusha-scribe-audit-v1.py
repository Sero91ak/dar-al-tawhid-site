#!/usr/bin/env python3
"""Offline consistency guard for nine Arabic original V4/Scribe transcriptions.

No network, no ElevenLabs charging, no automatic acoustic approval.
"""
from __future__ import annotations
import json
import pathlib
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIR = ROOT / "kids/data/academy-topic-batches"


def read(name):
    return json.loads((DIR / name).read_text("utf-8"))


def main():
    source = read("akhlaq-sidq-fusha-term-audio-v1.json")
    checked = read("akhlaq-sidq-fusha-scribe-qa-v1.json")
    if (checked.get("voiceId") != source.get("voiceId")
        or checked.get("flowId") != source.get("flowId")
        or checked.get("lessonId") != "sidq"
        or checked.get("automatedTranscriptMatchedCount") != 9
        or checked.get("checkedArabicOriginals") != 9
        or checked.get("originalsAudioBytesDownloaded") != 0
        or checked.get("ownerManualAudioApprovalClaimed") is not False):
        raise AssertionError("Fuṣḥā QA receipt changed or falsely describes file import")
    expected = {r["key"]: r for r in source["entries"]}
    actual = {r["key"]: r for r in checked["entries"]}
    if len(expected) != 9 or len(actual) != 9 or set(expected) != set(actual):
        raise AssertionError("All nine original Fuṣḥā segments must remain audited")
    for key, orig in expected.items():
        entry = actual[key]
        for f, req in (("originalGenerationId", orig["generationId"]),
                       ("originalTtsSessionId", orig["sessionId"]),
                       ("expectedArabic", orig["arabic"]),
                       ("modelId", "eleven_scribe_v1")):
            if entry.get(f) != req:
                raise AssertionError(f"{key}: source provenance changed: {f}")
        if (unicodedata.normalize("NFC", entry["scribeRecognizedArabic"])
            != unicodedata.normalize("NFC", orig["arabic"])):
            raise AssertionError(f"{key}: ASR no longer matches native term")
        if (entry.get("exactNfcTranscriptMatch") is not True
            or entry.get("acousticPhoneticPrecisionProven") is not False
            or entry.get("originalMediaImportedToGithub") is not False
            or entry.get("approvedForPlayback") is not False):
            raise AssertionError(f"{key}: acoustic QA or release improperly asserted")
        if not entry.get("scribeGenerationId"):
            raise AssertionError(f"{key}: missing actual Scribe generation id")
    blob = (DIR / "akhlaq-sidq-fusha-scribe-qa-v1.json").read_text("utf-8")
    if "content.mp3?" in blob or "Signature=" in blob:
        raise AssertionError("Signed media URLs must never enter public source")
    print("PASS: nine native Fuṣḥā originals recognized word-for-word by Scribe, auditable IDs, not fake owner listening, no TTS credits.")


if __name__ == "__main__":
    main()
