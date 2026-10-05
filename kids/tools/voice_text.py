#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

SYNTHESIS_REVISION = "kids-speech-flow-v2-20261005"

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
_REPO_ROOT = Path(__file__).resolve().parents[2]
_PRONUNCIATION_RULES = _REPO_ROOT / "data/pronunciation/pronunciation-rules.json"
_RULE_BUCKETS = None


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


def _load_rule_buckets():
    global _RULE_BUCKETS
    if _RULE_BUCKETS is not None:
        return _RULE_BUCKETS

    buckets = {}
    try:
        data = json.loads(_PRONUNCIATION_RULES.read_text(encoding="utf-8"))
        for rule in data.get("rules") or []:
            needle = str(rule.get("string_to_replace") or "")
            spoken = str(rule.get("tts_text") or rule.get("alias") or "")
            if not needle or not spoken:
                continue
            buckets.setdefault(needle[0], []).append((needle, spoken))
        for values in buckets.values():
            values.sort(key=lambda row: len(row[0]), reverse=True)
    except Exception:
        buckets = {}

    _RULE_BUCKETS = buckets
    return buckets


def apply_pronunciation_library(text: str) -> str:
    """Apply DĀR Voice Studio's longest-match curated TTS spellings."""
    value = str(text or "")
    buckets = _load_rule_buckets()
    if not value or not buckets:
        return value

    out = []
    pos = 0
    while pos < len(value):
        hit = None
        for needle, spoken in buckets.get(value[pos], ()):
            if value.startswith(needle, pos):
                hit = (needle, spoken)
                break
        if hit is None:
            out.append(value[pos])
            pos += 1
            continue
        out.append(hit[1])
        pos += len(hit[0])
    return "".join(out)


def prepare_kids_voice_text(text: str, *, apply_dictionary: bool = True) -> str:
    """Prepare hidden TTS text while leaving visible Kids content untouched.

    Numbers are expanded to deterministic German speech, including Qurʾān
    references and answer numbering. Then the shared DĀR pronunciation library
    is applied so Quiz and Duʿāʾ use the same learned/native Islamic terms as
    the Voice Studio.
    """
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
        quran_reference,
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(?:Nr\.?|Nummer)\s*(\d{1,8})\b",
        lambda m: "Nummer " + german_number(int(m.group(1))),
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Antwort)\s+(\d{1,2})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Sūrah|Sūrat|Surah|Sura)\s+(\d{1,3})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\b(Āyah|Ayah|Vers)\s+(\d{1,3})\b",
        lambda m: m.group(1) + " " + german_number(int(m.group(2))),
        value,
        flags=re.IGNORECASE,
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

    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\s+([,;:!?؟])", r"\1", value)
    value = re.sub(r"([,;:!?؟])(?=\S)", r"\1 ", value)
    value = value.strip()

    if apply_dictionary:
        value = apply_pronunciation_library(value)
    return value


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
        actual = prepare_kids_voice_text(source, apply_dictionary=False)
        if actual != expected:
            raise SystemExit(f"voice-text self-test failed: {source!r} -> {actual!r} != {expected!r}")

    if _PRONUNCIATION_RULES.exists() and not _load_rule_buckets():
        raise SystemExit("voice-text self-test failed: pronunciation library is empty")
    if _PRONUNCIATION_RULES.exists():
        sample = apply_pronunciation_library("Tawḥīd")
        if sample == "Tawḥīd":
            raise SystemExit("voice-text self-test failed: pronunciation rules not applied")

    print(f"Kids voice text self-test OK · {len(cases)} number cases · {SYNTHESIS_REVISION}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("text", nargs="?")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--numbers-only", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        _self_test()
        return
    source = args.text if args.text is not None else sys.stdin.read()
    sys.stdout.write(prepare_kids_voice_text(source, apply_dictionary=not args.numbers_only))


if __name__ == "__main__":
    main()
