#!/usr/bin/env python3
"""TAWḤĪD KIDS Academy: visible source citations are NOT audio instructions.

Never alter the displayed Qurʾān/ḥadīth source, its numbering or its link.
Never synthesize Qurʾān recitation. Do not treat text normalization as evidence
of correct Fuṣḥā pronunciation; the owner must listen before release.
"""
from __future__ import annotations

import re
import unicodedata

_SURAT_TAWBAH = re.compile(
    r"\b(?:Sūrat|Sūrah|Surat|Surah|Sura)\s+(?:at\s*[-–]?\s*)?Tawba[h]?\b",
    re.IGNORECASE,
)
_SURAT_NAHL = re.compile(
    r"\b(?:Sūrat|Sūrah|Surat|Surah|Sura)\s+(?:an\s*[-–]?\s*)?Na[hḥ]l\b",
    re.IGNORECASE,
)
_SAHIH_MUSLIM = re.compile(r"\b(?:Ṣaḥīḥ|Sahih|Saheeh)\s+Muslim\b", re.IGNORECASE)
# Verse citations immediately following a sūrah title (9:119, 16:90, 16:90–91).
_SURAH_VERSE_ID = re.compile(
    r"(\bSūrat\s+(?:at-Tawbah|an-Naḥl|[\wʿʾāūīḥṣḍṭẓḏṯšḫ-]+))\s*,?\s*\d{1,3}\s*:\s*\d{1,3}(?:\s*[-–—]\s*\d{1,3})?\b",
    re.IGNORECASE,
)
# Quran-only citations in displayed prose, e.g. Qurʾān 9:119.
_QURAN_VERSE_ID = re.compile(
    r"\b(Qurʾān|Qur'an|Quran|Koran)\s*,?\s*\d{1,3}\s*:\s*\d{1,3}(?:\s*[-–—]\s*\d{1,3})?\b",
    re.IGNORECASE,
)
# ḥadīth book and number, e.g. Ṣaḥīḥ Muslim 2607a; Ṣaḥīḥ Muslim, Nr. 2607.
_HADITH_ID = re.compile(
    r"(\b(?:Ṣaḥīḥ|Sahih|Saheeh)\s+(?:Muslim|(?:al[- ]?)?Bu[ḫk]ār[iī]|(?:al[- ]?)?Bukhari))\s*,?\s*(?:(?:Nr\.?|Nummer|Ḥadīṯ\s+Nr\.?|Hadith\s+Nr\.?)\s*)?\d{1,8}[a-z]?\b",
    re.IGNORECASE,
)
# Other explicit source numbering, when marked as such; never strip lesson
# counts, ages or questions that contain normal numeric quantities.
_EXPLICIT_SOURCE_ID = re.compile(
    r"\b(?:Ḥadīṯnummer|Hadithnummer|Ḥadīṯ\s+Nr\.?|Hadith\s+Nr\.?|Quellennummer|Quelle\s+Nr\.?)\s*\d{1,8}[a-z]?\b",
    re.IGNORECASE,
)


def source_labels_for_speech(visible_text: str) -> str:
    """Return proposed spoken script; leave `visible_text` untouched.

    Numbers in the visual citation remain visible in the KIDS lesson.
    This function does NOT certify that ElevenLabs speaks Fuṣḥā correctly.
    """
    text = unicodedata.normalize("NFC", str(visible_text or ""))
    text = _SURAT_TAWBAH.sub("Sūrat at-Tawbah", text)
    text = _SURAT_NAHL.sub("Sūrat an-Naḥl", text)
    text = _SAHIH_MUSLIM.sub("Ṣaḥīḥ Muslim", text)
    text = _SURAH_VERSE_ID.sub(lambda m: m.group(1), text)
    text = _QURAN_VERSE_ID.sub(lambda m: m.group(1), text)
    text = _HADITH_ID.sub(lambda m: m.group(1), text)
    text = _EXPLICIT_SOURCE_ID.sub("", text)
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def assert_no_spoken_source_numbers(text: str) -> None:
    """Fail closed when an unstripped source ID still would be spoken."""
    if any(p.search(text) for p in (
        _SURAH_VERSE_ID, _QURAN_VERSE_ID, _HADITH_ID, _EXPLICIT_SOURCE_ID,
    )):
        raise ValueError("Blocked Academy narration: citation number left in spoken text")


def _self_test() -> None:
    examples = {
        "Was lehrt uns der Vers aus Sūrat at-Tawbah 9:119?":
            "Was lehrt uns der Vers aus Sūrat at-Tawbah?",
        "Sura At-Tawba 9:119": "Sūrat at-Tawbah",
        "Sura An-Nahl 16:90": "Sūrat an-Naḥl",
        "Im Qurʾān 9:119 lernen wir Wahrhaftigkeit.":
            "Im Qurʾān lernen wir Wahrhaftigkeit.",
        "In Ṣaḥīḥ Muslim 2607a erfahren wir mehr.":
            "In Ṣaḥīḥ Muslim erfahren wir mehr.",
        "In Sahih Muslim, Nr. 2607 steht der Ḥadīṯ.":
            "In Ṣaḥīḥ Muslim steht der Ḥadīṯ.",
        "Allah nennt fünf Gebete und sieben Himmel.":
            "Allah nennt fünf Gebete und sieben Himmel.",
    }
    for given, expected in examples.items():
        actual = source_labels_for_speech(given)
        assert actual == expected, (given, actual, expected)
        assert_no_spoken_source_numbers(actual)
    try:
        assert_no_spoken_source_numbers("Ṣaḥīḥ Muslim 2607a")
        raise AssertionError("Source-number gate did not block")
    except ValueError:
        pass
    print(f"Academy source speech: {len(examples)} normalization checks passed; source numbers blocked.")


if __name__ == "__main__":
    _self_test()
