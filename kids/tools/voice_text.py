#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

SYNTHESIS_REVISION = "kids-speech-flow-v3-20261005"

_ONES = [
    "null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun",
    "zehn","elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn",
    "siebzehn","achtzehn","neunzehn",
]
_TENS = {
    20:"zwanzig",30:"dreißig",40:"vierzig",50:"fünfzig",
    60:"sechzig",70:"siebzig",80:"achtzig",90:"neunzig",
}
_DIGIT_TRANSLATION = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹",
    "01234567890123456789",
)


_ROOT = Path(__file__).resolve().parents[2]
_PRONUNCIATION_RULES = _ROOT / "data" / "pronunciation" / "pronunciation-rules.json"
_MASTER_RULE_CACHE = None
_TRUSTED_STRATEGIES = {
    "max-master-pls-v1",
    "max-master-pls-v2-trusted",
    "profile-fixed-component-v1",
    "max-master-token-component-v1",
    "verified-islamic-master-library-v1",
}


def _load_master_rules():
    global _MASTER_RULE_CACHE
    if _MASTER_RULE_CACHE is not None:
        return _MASTER_RULE_CACHE
    rows = []
    try:
        data = json.loads(_PRONUNCIATION_RULES.read_text(encoding="utf-8"))
        for raw in data.get("rules") or []:
            needle = str(raw.get("string_to_replace") or "").strip()
            tts = str(raw.get("tts_text") or raw.get("alias") or "").strip()
            if not needle or not tts or needle == tts:
                continue
            voice_lock = str(raw.get("voice_lock") or raw.get("voiceLock") or "").strip()
            strategy = str(raw.get("tts_strategy") or raw.get("ttsStrategy") or "").strip()
            category = str(raw.get("category") or "").strip()
            trusted = (
                voice_lock == "MASTER"
                or strategy in _TRUSTED_STRATEGIES
                or category in {"MAX MASTER PLS", "MAX MASTER COMPONENT"}
            )
            if trusted:
                rows.append((needle, tts))
    except Exception:
        rows = []
    rows.sort(key=lambda item: len(item[0]), reverse=True)
    _MASTER_RULE_CACHE = rows
    return rows


def apply_master_pronunciations(text: str) -> str:
    value = str(text or "")
    for needle, tts in _load_master_rules():
        if needle in value:
            value = value.replace(needle, tts)
    return value


def german_number(value: int) -> str:
    n = int(value)
    if n < 0:
        return "minus " + german_number(-n)
    if n < 20:
        return _ONES[n]
    if n < 100:
        tens = (n // 10) * 10
        unit = n % 10
        return _TENS[tens] if unit == 0 else ("ein" if unit == 1 else _ONES[unit]) + "und" + _TENS[tens]
    if n < 1000:
        hundreds = n // 100
        rest = n % 100
        prefix = ("ein" if hundreds == 1 else _ONES[hundreds]) + "hundert"
        return prefix + (german_number(rest) if rest else "")
    if n < 1_000_000:
        thousands = n // 1000
        rest = n % 1000
        prefix = ("ein" if thousands == 1 else german_number(thousands)) + "tausend"
        return prefix + (german_number(rest) if rest else "")
    if n < 1_000_000_000:
        millions = n // 1_000_000
        rest = n % 1_000_000
        prefix = "eine Million" if millions == 1 else german_number(millions) + " Millionen"
        return prefix + ((" " + german_number(rest)) if rest else "")
    return str(n)


def prepare_kids_voice_text(text: str, *, apply_pronunciation: bool = True) -> str:
    """Prepare hidden TTS text; visible Kids content is not changed."""
    value = unicodedata.normalize("NFC", str(text or ""))
    value = value.translate(_DIGIT_TRANSLATION)
    value = value.replace("\u00a0", " ").replace("\u202f", " ")

    def quran_reference(match: re.Match[str]) -> str:
        prefix = match.group(1).rstrip(" ,")
        surah = german_number(int(match.group(2)))
        ayah = german_number(int(match.group(3)))
        end = match.group(4)
        spoken = f"{prefix}, Sūrah {surah}, Āyah {ayah}"
        if end:
            spoken += " bis " + german_number(int(end))
        return spoken

    value = re.sub(
        r"\b((?:Qurʾān|Qur'an|Quran)[^.!?\n]{0,60}?)\s+(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[–—-]\s*(\d{1,3}))?",
        quran_reference, value, flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(?:Nr\.?|Nummer)\s*(\d{1,8})\b",
        lambda m: "Nummer " + german_number(int(m.group(1))),
        value, flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Antwort)\s+(\d{1,2})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value, flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Sūrah|Sūrat|Surah|Sura)\s+(\d{1,3})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value, flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Āyah|Ayah|Vers)\s+(\d{1,3})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value, flags=re.IGNORECASE,
    )
    value = re.sub(
        r"(?<![\w./:])(\d{1,6})\s*[–—-]\s*(\d{1,6})(?![\w./:])",
        lambda m: german_number(int(m.group(1))) + " bis " + german_number(int(m.group(2))),
        value,
    )
    value = re.sub(
        r"(?<![\w./:])\d{1,8}(?![\w./:])",
        lambda m: german_number(int(m.group(0))),
        value,
    )

    if apply_pronunciation:
        value = apply_master_pronunciations(value)

    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\s+([,;:!?؟])", r"\1", value)
    value = re.sub(r"([,;:!?؟])(?=\S)", r"\1 ", value)
    return value.strip()


def _self_test() -> None:
    cases = {
        "Welche Sūrah ist Sūrah 112?": "Welche Sūrah ist Sūrah einhundertzwölf?",
        "Qurʾān, Ṭā-Hā 20:114": "Qurʾān, Ṭā-Hā, Sūrah zwanzig, Āyah einhundertvierzehn",
        "Qurʾān, al-Muʾminūn 23:97–98": "Qurʾān, al-Muʾminūn, Sūrah dreiundzwanzig, Āyah siebenundneunzig bis achtundneunzig",
        "Ṣaḥīḥ al-Buḫārī, Nr. 7394": "Ṣaḥīḥ al-Buḫārī, Nummer siebentausenddreihundertvierundneunzig",
        "Antwort 1: Ja. Antwort 2: Nein.": "Antwort eins: Ja. Antwort zwei: Nein.",
        "4–6 Jahre": "vier bis sechs Jahre",
        "Version 2.9.117": "Version 2.9.117",
        "Es gibt 5 Gebete.": "Es gibt fünf Gebete.",
    }
    for source, expected in cases.items():
        actual = prepare_kids_voice_text(source, apply_pronunciation=False)
        if actual != expected:
            raise SystemExit(f"voice-text self-test failed: {source!r} -> {actual!r} != {expected!r}")
    rules = _load_master_rules()
    if _PRONUNCIATION_RULES.exists() and not rules:
        raise SystemExit("voice-text self-test failed: MASTER pronunciation rules are empty")
    print(f"Kids voice text self-test OK · {len(cases)} number cases · {len(rules)} MASTER pronunciation rules · {SYNTHESIS_REVISION}")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("text", nargs="?")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        _self_test()
        return
    source = args.text if args.text is not None else sys.stdin.read()
    sys.stdout.write(prepare_kids_voice_text(source))


if __name__ == "__main__":
    main()
