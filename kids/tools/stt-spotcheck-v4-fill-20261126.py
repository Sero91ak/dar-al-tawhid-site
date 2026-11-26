#!/usr/bin/env python3
"""STT spot-checks for newly generated V4 master clips (غ / خ / ع / long vowels).

Uses official POST /v1/speech-to-text (scribe_v2). Does not print the API key.
Regeneration of confirmed failures is a separate --write-regen-list step;
this script never auto-retries ambiguous TTS.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import time
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
BATCH = ROOT / "kids/data/academy-topic-batches"
LEDGER = BATCH / "v4-fill-ledger-20261126.json"
PUBLIC = ROOT / "kids/data/academy-audio.json"
ORIGINALS = ROOT / "kids/original-media/v4-fill-20261126"
OUT = BATCH / "v4-fill-stt-spotcheck-20261126.json"
REGEN = BATCH / "v4-fill-stt-regen-list-20261126.json"
USER_AGENT = "DAR-KIDS-V4-FILL-STT/20261126"

HARAKAT = dict.fromkeys(map(ord, "ًٌٍَُِّْٰٕٖ̙ٓٔٚٗ٘"), None)
AR_RE = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+")
RISK_LATIN = re.compile(
    r"[ĠġḪḫḤḥʿʾĀāĪīŪūŪûÂâ]|gh|kh|ʿ|ʾ|salām|salam|ibād|ibaad|ġīb|ghib|akhir|āchir|bu[kḫ]hār|qurʾ|ṣabr|amanah|amānah|tawḥ|ṣidq",
    re.I,
)

# Expected phone/token hints for high-risk terms (latin or arabic).
TERM_HINTS = [
    (re.compile(r"as[- ]?salām[ui]? ʿalaykum|السلام", re.I),
     ["salam", "salaam", "salām", "assalam", "as-salam", "السلام", "عليكم", "alaykum", "alaikum"]),
    (re.compile(r"ġīb|ghibah|غيبة|غِيب", re.I),
     ["غيب", "غِيب", "ghib", "ghiib", "geeb", "ġīb", "ghieb"]),
    (re.compile(r"ʿibād|ibaad|عباد", re.I),
     ["عباد", "ibad", "ibaad", "ʿibād"]),
    (re.compile(r"ā[kḫ]hir|akhirah|آخر", re.I),
     ["آخر", "akhir", "aakhir", "akhira", "ākir"]),
    (re.compile(r"bu[kḫ]hār|بخار", re.I),
     ["بخار", "bukhar", "bukhaar", "buchar"]),
    (re.compile(r"qurʾān|quran|قرآن", re.I),
     ["quran", "qur'an", "qurʾān", "koran", "قرآن"]),
]


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s or "")


def strip_harakat(s: str) -> str:
    return nfc(s).translate(HARAKAT)


def norm_cmp(s: str) -> str:
    s = strip_harakat(s).lower()
    s = re.sub(r"[^\w\u0600-\u06ff]+", " ", s, flags=re.U)
    return re.sub(r"\s+", " ", s).strip()


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY missing")
    return key


def transcribe(path: Path, language_code: str | None) -> dict:
    last = None
    data = {"model_id": "scribe_v2", "tag_audio_events": "false"}
    if language_code in {"ar", "de"}:
        data["language_code"] = language_code
    for attempt in range(6):
        with path.open("rb") as fh:
            files = {"file": (path.name, fh, "audio/mpeg")}
            try:
                resp = requests.post(
                    "https://api.elevenlabs.io/v1/speech-to-text",
                    headers={"xi-api-key": api_key(), "User-Agent": USER_AGENT},
                    data=data,
                    files=files,
                    timeout=180,
                )
            except (requests.RequestException, TimeoutError) as e:
                last = type(e).__name__ + ": " + str(e)
                time.sleep(min(40, 4 * (2 ** attempt)))
                continue
        if resp.status_code == 429 or 500 <= resp.status_code < 600:
            last = f"HTTP {resp.status_code}"
            ra = resp.headers.get("Retry-After")
            try:
                wait = float(ra) if ra else min(60, 5 * (2 ** attempt))
            except ValueError:
                wait = min(60, 5 * (2 ** attempt))
            time.sleep(max(2.0, wait))
            continue
        if resp.status_code >= 400:
            raise RuntimeError(f"STT HTTP {resp.status_code}: {resp.text[:300]}")
        return resp.json()
    raise RuntimeError("STT retries exhausted: " + str(last))


def evaluate(text: str, transcript: str) -> dict:
    src = nfc(text)
    tr = nfc(transcript or "")
    src_n = norm_cmp(src)
    tr_n = norm_cmp(tr)
    arabic_words = [strip_harakat(w) for w in AR_RE.findall(src)]
    arabic_ok = True
    missing_ar = []
    for w in arabic_words:
        if len(w) < 2:
            continue
        if w not in strip_harakat(tr) and w.lower() not in tr_n:
            # allow shorter stems (3+ chars)
            stem = w[:3] if len(w) >= 3 else w
            if stem not in strip_harakat(tr):
                arabic_ok = False
                missing_ar.append(w)
    hint_ok = True
    hint_miss = []
    for pat, needles in TERM_HINTS:
        if pat.search(src):
            if not any(norm_cmp(n) in tr_n or n in tr for n in needles):
                hint_ok = False
                hint_miss.append(pat.pattern)
    # German lexical overlap for mostly-German clips
    src_tokens = [t for t in re.findall(r"[a-zäöüß]{4,}", src_n) if t not in {"eine", "einem", "einen", "dieser", "diese", "oder", "und", "nicht"}]
    overlap = 0
    if src_tokens:
        overlap = sum(1 for t in src_tokens if t in tr_n) / len(src_tokens)
    fail = (not arabic_ok) or (not hint_ok)
    # If no arabic/hints, only fail when overlap is very poor on a longer German clip
    if arabic_ok and hint_ok and src_tokens and overlap < 0.25 and len(src_tokens) >= 6:
        fail = True
    return {
        "pass": not fail,
        "arabicOk": arabic_ok,
        "missingArabic": missing_ar,
        "hintOk": hint_ok,
        "missingHints": hint_miss,
        "germanOverlap": round(overlap, 3) if src_tokens else None,
    }


def select_samples(ledger: dict, limit: int) -> list[dict]:
    cands = []
    for ident, rec in (ledger.get("requests") or {}).items():
        if rec.get("state") != "done" or rec.get("reused"):
            continue
        text = rec.get("text") or ""
        if rec.get("kind") == "deen":
            # deen text may be absent; skip if no audio path
            path = ORIGINALS / f"{ident}.mp3"
            score = 3 if AR_RE.search(text) or RISK_LATIN.search(text) else 1
            cands.append((score, ident, rec, path))
            continue
        if not text:
            continue
        path = ORIGINALS / f"{ident}.mp3"
        if not path.is_file():
            continue
        score = 0
        if AR_RE.search(text):
            score += 5
        if RISK_LATIN.search(text):
            score += 4
        if rec.get("usedDictionary"):
            score += 2
        if rec.get("languageCode") in {"ar", "mixed"}:
            score += 2
        if rec.get("firstLesson") in {"sidq", "akhlaq-sabr", "akhlaq-amanah", "adab-salam", "adab-worte"}:
            score += 1
        if score:
            cands.append((score, ident, rec, path))
    cands.sort(key=lambda x: (-x[0], x[1]))
    # diversify a bit by lesson
    picked, seen_lesson = [], {}
    for score, ident, rec, path in cands:
        lesson = rec.get("firstLesson") or rec.get("id") or ""
        if seen_lesson.get(lesson, 0) >= 4 and len(picked) < limit - 5:
            continue
        if not path.is_file() or path.stat().st_size < 1200:
            continue
        seen_lesson[lesson] = seen_lesson.get(lesson, 0) + 1
        picked.append((ident, rec, path, score))
        if len(picked) >= limit:
            break
    return picked


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--sleep", type=float, default=0.4)
    args = parser.parse_args()
    if not LEDGER.exists():
        raise SystemExit("ledger missing")
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    samples = select_samples(ledger, args.limit)
    results = []
    fails = []
    for ident, rec, path, score in samples:
        lang = rec.get("languageCode")
        # mixed or reused language labels: let Scribe detect
        stt_lang = lang if lang in {"ar", "de"} else None
        try:
            raw = transcribe(path, stt_lang)
        except Exception as e:
            results.append({
                "ident": ident, "text": rec.get("text"), "error": str(e)[:300],
                "firstLesson": rec.get("firstLesson") or rec.get("id"),
                "pass": False, "kind": rec.get("kind") or "academy",
            })
            fails.append(ident)
            continue
        transcript = raw.get("text") or ""
        ev = evaluate(rec.get("text") or "", transcript)
        row = {
            "ident": ident,
            "kind": rec.get("kind") or "academy",
            "firstLesson": rec.get("firstLesson") or rec.get("id"),
            "text": rec.get("text"),
            "transcript": transcript,
            "sttLanguage": raw.get("language_code"),
            "scorePriority": score,
            "url": rec.get("url"),
            **ev,
        }
        results.append(row)
        if not ev["pass"]:
            fails.append(ident)
        print(
            ("PASS" if ev["pass"] else "FAIL"),
            rec.get("firstLesson") or rec.get("id"),
            ident[:12],
            "overlap=" + str(ev.get("germanOverlap")),
            flush=True,
        )
        time.sleep(args.sleep)
    report = {
        "createdAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "modelId": "scribe_v2",
        "checked": len(results),
        "passed": sum(1 for r in results if r.get("pass")),
        "failed": sum(1 for r in results if not r.get("pass")),
        "results": results,
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    regen_items = []
    id_map = {i: r for i, r, _, _ in samples}
    for ident in fails:
        rec = (ledger.get("requests") or {}).get(ident) or {}
        ev = next((r for r in results if r["ident"] == ident), {})
        regen_items.append({
            "ident": ident,
            "kind": rec.get("kind") or ev.get("kind") or "academy",
            "text": rec.get("text") or ev.get("text"),
            "firstLesson": rec.get("firstLesson") or rec.get("id"),
            "url": rec.get("url"),
            "reason": {
                "missingArabic": ev.get("missingArabic"),
                "missingHints": ev.get("missingHints"),
                "germanOverlap": ev.get("germanOverlap"),
                "transcript": ev.get("transcript") or ev.get("error"),
            },
        })
    REGEN.write_text(json.dumps({
        "createdAt": report["createdAt"],
        "count": len(regen_items),
        "items": regen_items,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "checked": report["checked"],
        "passed": report["passed"],
        "failed": report["failed"],
        "report": str(OUT.relative_to(ROOT)),
        "regenList": str(REGEN.relative_to(ROOT)),
    }, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
