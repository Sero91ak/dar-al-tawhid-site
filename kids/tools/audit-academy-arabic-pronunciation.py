#!/usr/bin/env python3
"""ZERO-CREDIT inventory of Arabic terms in the 144 staged KIDS clips.

This is NOT an automatic Fuṣḥā certificate. A PLS alias is merely text, not a
verified sound. A human must listen to EVERY recording and approve every new
Arabic lexeme in context before using it in the public Academy.
"""
from __future__ import annotations

import json
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[2]
MASTER = ROOT / "data/pronunciation/DAR_AL_TAWHID_ElevenLabs_ARABIC_MASTER_29122.pls"
SIDQ = ROOT / "kids/data/academy-sidq-v4-coverage-v31.json"
NEXT = ROOT / "kids/data/academy-v32-first64-audio-staging-20261111.json"
POLICY = ROOT / "kids/data/academy-voice-policy-v10.json"

# Canonical graphemes and Arabic spellings are checkpoints for human review.
# Arabic case endings and audio coarticulation depend on their utterance context.
CORE = {
    "Ṣidq": ("صِدْق", ("Ṣidq", "Sidq", "صِدْق", "صدق")),
    "aṣ-Ṣiddīq": ("الصِّدِّيق", ("aṣ-Ṣiddīq", "as-Siddiq", "Ṣiddīq", "Siddiq")),
    "Sūrat at-Tawbah": ("سُورَةُ التَّوْبَةِ", ("Sūrat at-Tawbah", "Surat at-Tawbah", "Sura At-Tawba")),
    "Sūrat an-Naḥl": ("سُورَةُ النَّحْلِ", ("Sūrat an-Naḥl", "Surat an-Nahl", "Sura An-Nahl")),
    "Ṣaḥīḥ Muslim": ("صَحِيحُ مُسْلِمٍ", ("Ṣaḥīḥ Muslim", "Sahih Muslim")),
    "Qurʾān": ("قُرْآن", ("Qurʾān", "Quran", "Qur'an")),
    "Ḥadīṯ": ("حَدِيث", ("Ḥadīṯ", "Hadith")),
    "Tawḥīd": ("تَوْحِيد", ("Tawḥīd", "Tawhid")),
    "Īmān": ("إِيمَان", ("Īmān", "Iman")),
    "Ikhlāṣ": ("إِخْلَاص", ("Ikhlāṣ", "Ikhlas")),
    "ʿIbādah": ("عِبَادَة", ("ʿIbādah", "Ibadah")),
    "Duʿāʾ": ("دُعَاء", ("Duʿāʾ", "Dua")),
    "Ḥalāl": ("حَلَال", ("Ḥalāl", "Halal")),
    "Ḥarām": ("حَرَام", ("Ḥarām", "Haram")),
    "Sunnah": ("سُنَّة", ("Sunnah", "Sunna")),
    "Bismillāh": ("بِسْمِ اللَّهِ", ("Bismillāh", "Bismillah")),
    "Allah": ("اللَّه", ("Allah",)),
    "Full Salām": ("السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ",
                   ("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh",)),
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def run():
    policy = read(POLICY)
    hold = policy["production"]["ownerPronunciationHold"]
    assert hold["enabled"] and not hold["newGenerationAllowed"]
    assert hold["dictionaryAliasesAreNotAudioQA"]
    sidq = read(SIDQ)
    next64 = read(NEXT)
    entries = [("sidq", item["text"], item) for item in sidq["entries"]]
    entries.extend(("next64", text, item) for text, item in next64["entries"].items())
    assert len(entries) == 144
    assert len({text for _, text, _ in entries}) == 144
    assert all(record.get("approvedForPlayback") is False for _, _, record in entries)
    root = ET.parse(MASTER).getroot()
    ns = "{http://www.w3.org/2005/01/pronunciation-lexicon}"
    entries_pls = {}
    for item in root.findall(ns + "lexeme"):
        g = item.findtext(ns + "grapheme")
        a = item.findtext(ns + "alias")
        if g and a:
            entries_pls.setdefault(g, []).append(a)
    assert len(entries_pls) > 1000

    out = {"reviewRequired": True, "masterLexiconIsNotPhoneticApproval": True,
           "totalAudio": len(entries), "totalPublicApproved": 0, "terms": {},
           "stagedClipsWithAtLeastOneTrackedTerm": 0, "unclassifiedClipsAlsoNeedFullListening": True}
    matched_indices = set()
    for canonical, (arabic, spellings) in CORE.items():
        pattern = re.compile(r"(?<!\w)(?:" + "|".join(re.escape(v) for v in sorted(spellings, key=len, reverse=True)) + r")(?!\w)", re.IGNORECASE)
        matched = [(i, source, text) for i, (source, text, _) in enumerate(entries) if pattern.search(text)]
        matched_indices.update(i for i, _, _ in matched)
        source_aliases = {form: entries_pls.get(form, [])[:3] for form in spellings}
        out["terms"][canonical] = {
            "arabicReferenceForHumanReview": arabic,
            "stagedClipCount": len(matched),
            "clips": [{"source": src, "text": text} for _, src, text in matched],
            "masterLexiconAliasesUnverified": source_aliases,
            "phoneticHumanReview": "REQUIRED",
            "approvedForPlayback": False,
        }
    out["stagedClipsWithAtLeastOneTrackedTerm"] = len(matched_indices)
    # Meaning and phonetic distinction is critical:
    assert "Ṣidq" in out["terms"] and "aṣ-Ṣiddīq" in out["terms"]
    assert out["terms"]["Ṣidq"]["arabicReferenceForHumanReview"] != out["terms"]["aṣ-Ṣiddīq"]["arabicReferenceForHumanReview"]
    assert out["terms"]["Ṣidq"]["stagedClipCount"] >= 2
    out["unmatchedClips"] = len(entries) - len(matched_indices)
    return out


if __name__ == "__main__":
    doc = run()
    print(json.dumps({
        "totalStaged": doc["totalAudio"],
        "publicApproved": doc["totalPublicApproved"],
        "trackedArabicTerms": len(doc["terms"]),
        "matchedClips": doc["stagedClipsWithAtLeastOneTrackedTerm"],
        "unmatchedRequireFullHumanHearing": doc["unmatchedClips"],
        "sidqMatches": doc["terms"]["Ṣidq"]["stagedClipCount"],
        "siddiqMatches": doc["terms"]["aṣ-Ṣiddīq"]["stagedClipCount"],
        "allArabicTermsHumanHearingRequired": True,
        "elevenLabsCreditsUsed": 0
    }, ensure_ascii=False, indent=2))
