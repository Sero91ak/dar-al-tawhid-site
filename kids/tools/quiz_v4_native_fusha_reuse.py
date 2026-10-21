#!/usr/bin/env python3
"""Source-faithful, zero-credit assembly of German+native Arabic eleven_v4 clips.

Read the previously pinned mapping and REAL SHA-backed V4 original registry.
Never add synthesized text, edit canonical quiz prose, substitute an Arabic
recitation for Qur'an verses, or claim that a human listened to an MP3.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
MAP=ROOT/"kids/review-only/quiz-v4-20261021-two-shared-native-fusha-real-master-originals.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
SYMBOL_TO_VOCALIZED={
    "ﷺ":"صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
    "عليه السلام":"عَلَيْهِ السَّلَامُ",
}

def load_mapping(root=ROOT):
    raw=json.loads((root/"kids/review-only/quiz-v4-20261021-two-shared-native-fusha-real-master-originals.json").read_text(encoding="utf-8"))
    if not (raw.get("modelId")==MODEL and raw.get("voiceId")==VOICE and
            raw.get("canonicalMixedAudioOccurrences")==58 and
            raw.get("publicReleaseEnabled") is False and
            raw.get("additionalElevenLabsCreditsSpentByThisLinking")==0):
        raise RuntimeError("KIDS_FUSHA_MIX: canonical 450 German/Arabic master mapping mismatch")
    assets={}
    for item in raw["masterArabicOriginals"]:
        token=item["sourceToken"]
        if (token not in SYMBOL_TO_VOCALIZED or item["spokenText"]!=SYMBOL_TO_VOCALIZED[token]
                or not item["realOriginalMP3"].startswith("/kids/assets/kids-quiz-audio/")
                or not item.get("mp3Sha256") or item["humanPronunciationApproved"] is not False):
            raise RuntimeError("KIDS_FUSHA_MIX: unverified native Arabic original metadata")
        assets[token]=item
    if set(assets)!=set(SYMBOL_TO_VOCALIZED):
        raise RuntimeError("KIDS_FUSHA_MIX: only two native original phonetic phrases permitted")
    phrases={}
    for item in raw["items"]:
        text=item["canonicalMixedText"]
        pieces=item["mixedAudioParts"]
        if not isinstance(text,str) or not pieces:
            raise RuntimeError("KIDS_FUSHA_MIX: empty mixed phrase")
        rebuilt=[]
        for p in pieces:
            typ=p["kind"]
            if typ=="native_arabic_fusha_v4_reuse":
                sym=p["sourceToken"]
                if sym not in assets or p["spokenArabic"]!=assets[sym]["spokenText"] or p["existingMP3SHA256"]!=assets[sym]["mp3Sha256"]:
                    raise RuntimeError("KIDS_FUSHA_MIX: master Arabic original no longer matches")
                rebuilt.append(sym)
            elif typ=="german_master_dictionary_v4_component":
                rebuilt.append(p["source"])
            elif typ=="punctuation_whitespace_unspoken":
                rebuilt.append(p["source"])
            else:raise RuntimeError("KIDS_FUSHA_MIX: unknown source language")
        # The stored mapping trims surrounding source spaces at the component
        # boundary. Do not guess text alignment: compare after separating the
        # exact two special Arabic terms and normalizing whitespace only.
        normalize=lambda s:" ".join(s.split())
        if normalize("".join(rebuilt))!=normalize(text):
            raise RuntimeError("KIDS_FUSHA_MIX: German/Arabic source text changed: "+text)
        if text in phrases and phrases[text]!=pieces:
            raise RuntimeError("KIDS_FUSHA_MIX: one phrase mapped to conflicting original assets")
        phrases[text]=pieces
    return phrases,assets

def resolve_text_originals(text, originals, mapping, native_assets, *, available=None):
    """Return immutable ORIGINAL registry rows and exact unsupplied text units.

    Source text identity is unchanged. A punctuation-only fragment stays silent.
    The caller joins resulting MP3s with 0ms between sub-segments.
    """
    if text in originals:
        return [originals[text]],[]
    pieces=mapping.get(text)
    if pieces is None:
        return [],[text]
    rows=[];missing=[]
    for piece in pieces:
        typ=piece["kind"]
        if typ=="punctuation_whitespace_unspoken":
            continue
        if typ=="native_arabic_fusha_v4_reuse":
            asset=native_assets[piece["sourceToken"]]
            original=originals.get(asset["spokenText"])
            if original is None:
                missing.append(asset["spokenText"])
            elif original.get("sha256")!=asset["mp3Sha256"] or original.get("url")!=asset["realOriginalMP3"]:
                raise RuntimeError("KIDS_FUSHA_MIX: native Arabic MP3 receipt mismatch")
            else:rows.append(original)
        elif typ=="german_master_dictionary_v4_component":
            source=piece["source"]
            original=originals.get(source)
            if original is None:missing.append(source)
            else:rows.append(original)
        else:
            raise RuntimeError("KIDS_FUSHA_MIX: unexpected component")
    return (rows if not missing else []), missing

def expand_slot(part, originals, mapping, native_assets):
    if part["mode"]!="compose-from-segments":
        raise RuntimeError("KIDS_FUSHA_MIX: only canonical segmented original slot supported")
    segments=part["segments"]
    if not isinstance(segments,list) or not segments or " ".join(segments)!=part["text"]:
        raise RuntimeError("KIDS_FUSHA_MIX: question speech text changed")
    pauses=part.get("pauseAfterMs",[])
    if len(pauses)!=len(segments)-1 or not all(isinstance(n,int) and 0<=n<=1600 for n in pauses):
        raise RuntimeError("KIDS_FUSHA_MIX: wrong original pause contract")
    fragments=[];joined_pauses=[];missing=[]
    for i,text in enumerate(segments):
        rows,not_found=resolve_text_originals(text,originals,mapping,native_assets)
        if not_found:
            missing.extend(not_found)
            continue
        for j,src in enumerate(rows):
            if fragments:
                joined_pauses.append(pauses[i-1] if j==0 and i else 0)
            fragments.append(src)
    if missing:return [],[],list(dict.fromkeys(missing))
    if not fragments:
        raise RuntimeError("KIDS_FUSHA_MIX: empty resolved audio for nonempty question")
    if len(joined_pauses)!=len(fragments)-1:
        raise RuntimeError("KIDS_FUSHA_MIX: segment pause alignment error")
    return fragments,joined_pauses,[]
