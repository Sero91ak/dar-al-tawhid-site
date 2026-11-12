#!/usr/bin/env python3
"""Review-only pronunciation-safe speech drafts for 144 existing KIDS recordings.

IMPORTANT: No HTTP, no ElevenLabs, no audio synthesis, no release.
The visual lesson/source remains verbatim. German and Arabic are separate
voice segments; Arabic words are NOT passed as Latin transliterations.
This constructs testable scripts, NOT a guarantee of correct TTS pronunciation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids/tools"))
from academy_source_voice import source_labels_for_speech, assert_no_spoken_source_numbers

SIDQ = ROOT / "kids/data/academy-sidq-v4-coverage-v31.json"
NEXT = ROOT / "kids/data/academy-v32-first64-audio-staging-20261111.json"
POLICY = ROOT / "kids/data/academy-voice-policy-v10.json"
LANGUAGE = ROOT / "data/pronunciation/voice-language-isolation-v1.json"

# Explicit, finite, source-backed review lexicon; NOT the entire cross-language
# PLS. Longer expressions first. Phonemic detail still requires owner hearing.
# Never equate Ṣidq (صِدْق) with Ṣiddīq (صِدِّيق).
REVIEW_TERMS = (
    ("full-salam", "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ",
     ("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh",)),
    ("siddiq", "الصِّدِّيق", ("aṣ-Ṣiddīq", "as-Siddiq", "Ṣiddīq", "Siddiq")),
    ("sidq", "صِدْق", ("Ṣidq", "Sidq")),
    ("surat-at-tawbah", "سُورَةُ التَّوْبَةِ",
     ("Sūrat at-Tawbah", "Sura at-Tawba", "Surat at-Tawbah")),
    ("surat-an-nahl", "سُورَةُ النَّحْلِ",
     ("Sūrat an-Naḥl", "Sura an-Nahl", "Surat an-Nahl")),
    ("sahih-muslim", "صَحِيحُ مُسْلِمٍ",
     ("Ṣaḥīḥ Muslim", "Sahih Muslim")),
    ("quran", "الْقُرْآن", ("Qurʾān", "Qur'an", "Quran")),
    ("hadith", "حَدِيث", ("Ḥadīṯ", "Hadith")),
    ("sunnah", "السُّنَّة", ("Sunnah", "Sunna")),
    ("tawhid", "تَوْحِيد", ("Tawḥīd", "Tawhid")),
    ("iman", "إِيمَان", ("Īmān", "Iman")),
    ("ikhlas", "إِخْلَاص", ("Ikhlāṣ", "Ikhlas")),
    ("ibadah", "عِبَادَة", ("ʿIbādah", "Ibadah")),
    ("dua", "دُعَاء", ("Duʿāʾ", "Dua")),
    ("qadar", "الْقَدَر", ("al-Qadar", "al Qadar")),
    ("halal", "حَلَال", ("Ḥalāl", "Halal")),
    ("haram", "حَرَام", ("Ḥarām", "Haram")),
    ("bismillah", "بِسْمِ اللَّهِ", ("Bismillāh", "Bismillah")),
    ("salawat", "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ", ("ﷺ",)),
    ("allah", "اللَّه", ("Allah",)),
)

# A small explicit set of *spoken-only* grammatical paraphrases.
# The visible source/question/answer must remain byte-for-byte unchanged.
# They do not change answer correctness, and remain UNAPPROVED until hearing QA.
# This avoids making German genitive "Allahs" into an unnatural Arabic+German
# joined recording, or silently pronouncing it through a German model.
REVIEW_PARAPHRASES = {
    "Antwort 1: Beide lehren, dass man Allahs Anbetung anderen zuwenden soll.":
        "Antwort 1: Beide lehren, dass man die Anbetung, die Allah zusteht, anderen zuwenden soll.",
    "Wir glauben an Allahs Bestimmung und fragen bei schwierigen Fragen nach.":
        "Wir glauben an die Bestimmung von Allah und fragen bei schwierigen Fragen nach.",
    "Wir glauben an Allahs Bücher und Seine Gesandten.":
        "Wir glauben an die Bücher von Allah und an Seine Gesandten.",
    "Zu ihnen zählen außerdem Engel, die Bücher und die Gesandten Allahs.":
        "Zu ihnen zählen außerdem Engel, die Bücher und die Gesandten von Allah.",
    "Antwort 1: Der Glaube an den Jüngsten Tag und an Allahs Bestimmung, al-Qadar.":
        "Antwort 1: Der Glaube an den Jüngsten Tag und an die Bestimmung von Allah, al-Qadar.",
    "Der Glaube an den Jüngsten Tag und an Allahs Bestimmung, al-Qadar.":
        "Der Glaube an den Jüngsten Tag und an die Bestimmung von Allah, al-Qadar.",
}

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")
LATIN = re.compile(r"[A-Za-zÄÖÜäöüß]")
UNSAFE_ROMAN = re.compile(r"[ṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾǦǧŠšḪḫ]")
ROMAN_SURAH = re.compile(r"\b(?:Sūrat|Surat|Surah|Sūrah|Sura)\b", re.I)
QURAN_RECITATION = re.compile(r"[\u06d6-\u06ed]")  # Qurʾānic verse-end/recitation marks
ALLAH_GENITIVE = re.compile(r"\bAllahs\b", re.I)

PATTERNS = []
for name, script, variants in REVIEW_TERMS:
    for spelling in variants:
        if spelling == "ﷺ":
            pattern = re.compile(re.escape(spelling))
        else:
            pattern = re.compile(
                r"(?<!\w)" + re.escape(spelling) + r"(?!\w)", re.IGNORECASE
            )
        PATTERNS.append((len(spelling), name, script, pattern))
PATTERNS.sort(key=lambda item: -item[0])


def read(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _add(parts: list, language: str, value: str, matched_term: str = "") -> None:
    clean = value.strip()
    if not clean:
        return
    if language == "ar" and (not ARABIC.search(clean) or LATIN.search(clean)):
        raise ValueError("Mixed or non-Arabic script in an ar segment")
    if language == "de" and ARABIC.search(clean):
        raise ValueError("Arabic escaped into German segment")
    if parts and parts[-1]["language"] == language and not matched_term:
        parts[-1]["text"] += " " + clean
    else:
        entry = {"language": language, "text": clean}
        if matched_term:
            entry["termId"] = matched_term
        parts.append(entry)


def draft_one(visible_text: str) -> dict:
    """Produce separate monolingual speech segments; never mutate visible text."""
    if not isinstance(visible_text, str) or not visible_text.strip():
        raise ValueError("Empty canonical Academy utterance")
    # ﷺ is a single salawat ligature in the Arabic Presentation Forms block.
    # It is NOT Qurʾānic recitation and has a fixed Fuṣḥā expansion below.
    # Reject any other Arabic script in the original to protect real Qurʾān text.
    source_without_salawat_ligature = visible_text.replace("ﷺ", "")
    if ARABIC.search(source_without_salawat_ligature) or QURAN_RECITATION.search(source_without_salawat_ligature):
        raise ValueError("Existing Arabic-script source needs manual Qurʾān/dua review")
    spoken_source = REVIEW_PARAPHRASES.get(visible_text, visible_text)
    stripped = source_labels_for_speech(spoken_source)
    assert_no_spoken_source_numbers(stripped)
    if re.search(r"(?<!\w)\d{1,3}\s*:\s*\d{1,3}(?!\w)", stripped):
        raise ValueError("Unresolved source-number sequence in voice draft")
    if ALLAH_GENITIVE.search(stripped):
        raise ValueError("Unresolved Arabic possessive: Allahs; manual review required")
    positions = []
    i = 0
    while i < len(stripped):
        match = None
        for _, name, arabic, pattern in PATTERNS:
            found = pattern.match(stripped, i)
            if found:
                match = (found, name, arabic)
                break
        if match is not None:
            found, name, arabic = match
            positions.append((i, found.end(), name, arabic))
            i = found.end()
        else:
            i += 1

    # Fail closed on remaining Arabized words. Add reviewed terms, NOT
    # approximate German phonetic spellings, to resolve them.
    leftovers = stripped
    for start, end, _, _ in reversed(positions):
        leftovers = leftovers[:start] + (" " * (end - start)) + leftovers[end:]
    unknown = []
    if UNSAFE_ROMAN.search(leftovers):
        unknown.append("unrecognized-diaconsonant-term")
    if ROMAN_SURAH.search(leftovers):
        unknown.append("unrecognized-surah-title")
    if unknown:
        raise ValueError("Human phonetic script required: " + ",".join(unknown))

    parts = []
    last = 0
    for start, end, term, arabic in positions:
        _add(parts, "de", stripped[last:start])
        _add(parts, "ar", arabic, term)
        last = end
    tail = stripped[last:]
    if tail.strip(" \t\r\n.,!?;:"):
        _add(parts, "de", tail)
    elif tail.strip():
        if parts:
            parts[-1]["text"] += tail.strip()
        else:
            raise ValueError("No phonetic content in source")
    if not parts or len(parts) > 32:
        raise ValueError("Zero or excessive number of spoken segments")
    if not any(p["language"] == "de" for p in parts) and len(parts) > 1:
        # A pure Arabic greeting may be one Arabic script segment.
        raise ValueError("Unexpected fragmented Arabic-only speech")
    for p in parts:
        if len(p["text"]) > 700:
            raise ValueError("Overlong speech segment")
    return {
        "displayText": visible_text,
        "displaySha256": hashlib.sha256(visible_text.encode("utf-8")).hexdigest(),
        "spokenOnlyGrammaticalParaphrase": spoken_source != visible_text,
        "paraphraseRequiresMeaningAndHearingApproval": spoken_source != visible_text,
        "proposedSpokenTextWithoutSourceIds": stripped,
        "segments": parts,
        "termIds": list(dict.fromkeys(p["termId"] for p in parts if p.get("termId"))),
        "pronunciationApproved": False,
        "ownerHearingRequired": True,
        "released": False,
    }


def self_test():
    cases = [
        ("Heute sprechen wir über Ṣidq und aṣ-Ṣiddīq.", ("sidq", "siddiq")),
        ("Was lehrt uns Sūrat at-Tawbah 9:119?", ("surat-at-tawbah",)),
        ("Sūrat an-Naḥl 16:90", ("surat-an-nahl",)),
        ("In Ṣaḥīḥ Muslim 2607a steht es.", ("sahih-muslim",)),
        ("Qurʾān 9:119 und Ṣaḥīḥ Muslim 2607a.", ("quran", "sahih-muslim")),
        ("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.", ("full-salam",)),
        ("Allah befiehlt uns, mit den Wahrhaftigen zu sein.", ("allah",)),
        ("Der Prophet ﷺ lehrte uns Wahrhaftigkeit.", ("salawat",)),
        ("Wir glauben an die Bestimmung von Allah, al-Qadar.", ("allah", "qadar")),
        ("Heute lernen wir nur die Wahrheit.", ()),
    ]
    for src, expected in cases:
        item = draft_one(src)
        assert set(item["termIds"]) == set(expected), (src, item["termIds"], expected)
        assert item["displayText"] == src
        assert item["released"] is False
        assert all(not (ARABIC.search(p["text"]) and LATIN.search(p["text"])) for p in item["segments"])
        assert all("2607" not in p["text"] and "9:119" not in p["text"] for p in item["segments"])
    a = draft_one("Ṣidq.")["segments"][0]["text"]
    b = draft_one("Ṣiddīq.")["segments"][0]["text"]
    assert a.startswith("صِدْق") and b.startswith("الصِّدِّيق") and a != b
    for original, spoken in REVIEW_PARAPHRASES.items():
        row = draft_one(original)
        assert row["spokenOnlyGrammaticalParaphrase"] is True
        assert row["paraphraseRequiresMeaningAndHearingApproval"] is True
        assert row["displayText"] == original
        assert row["proposedSpokenTextWithoutSourceIds"] == source_labels_for_speech(spoken)
        assert not ALLAH_GENITIVE.search(row["proposedSpokenTextWithoutSourceIds"])
    for unsafe in ("Sūrat al-Kawthar 108:1", "Allahs Worte", "﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾"):
        try:
            draft_one(unsafe)
        except ValueError:
            pass
        else:
            raise AssertionError("Unsafe source was not blocked: " + unsafe)
    print(f"PASS: {len(cases)} source-to-speech examples; distinct Ṣidq/Ṣiddīq; source ids silent; no credits")


def inventory():
    policy = read(POLICY)
    hold = policy["production"]["ownerPronunciationHold"]
    isolation = read(LANGUAGE)
    assert hold["enabled"] is True and hold["newGenerationAllowed"] is False
    assert isolation["mixed"]["automaticTtsAllowed"] is False
    first, second = read(SIDQ), read(NEXT)
    all_items = [("sidq", item["text"]) for item in first["entries"]]
    all_items += [("next64", text) for text in second["entries"]]
    assert len(all_items) == 144 and len(set(t for _, t in all_items)) == 144
    accepted = []
    held = []
    for group, original in all_items:
        try:
            row = draft_one(original)
            row["group"] = group
            accepted.append(row)
        except ValueError as exc:
            held.append({"group": group, "displayText": original, "reason": str(exc)})
    return {
        "schemaVersion": 1,
        "id": "KIDS_ACADEMY_V34_FUSHA_SPEECH_REVIEW_ONLY",
        "ownerApproved": False,
        "producedNewAudio": False,
        "publicReleaseAllowed": False,
        "quranRecitationPolicy": "human-only",
        "originalAudioCount": 144,
        "drafted": len(accepted),
        "heldForManualPhoneticAuthoring": len(held),
        "arabicWordsAreSeparateArLanguageSegments": True,
        "citationNumbersAreVisibleOnly": True,
        "spokenParaphrasesHeldForMeaningApproval": sum(bool(row["spokenOnlyGrammaticalParaphrase"]) for row in accepted),
        "reviewOnly": accepted,
        "unresolved": held,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--export", type=Path)
    args = parser.parse_args()
    self_test()
    result = inventory()
    assert result["drafted"] + result["heldForManualPhoneticAuthoring"] == 144
    summary = {key: result[key] for key in (
        "originalAudioCount", "drafted", "heldForManualPhoneticAuthoring",
        "producedNewAudio", "ownerApproved", "publicReleaseAllowed"
    )}
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if args.export is not None:
        args.export.parent.mkdir(parents=True, exist_ok=True)
        args.export.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.check and result["heldForManualPhoneticAuthoring"]:
        print("REVIEW HOLD: unmatched original vocabulary requires manual phonetic writing; no audio generated")


if __name__ == "__main__":
    main()
