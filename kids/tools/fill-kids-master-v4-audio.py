#!/usr/bin/env python3
"""Resumable Serhat V4 fill for Akademie phrases and Den Dīn lernen lessons.

Reuses exact existing master clips. German requests never attach the Arabic
pronunciation dictionary. Arabic-script segments use the pinned dictionary
version. Never retries an ambiguous paid POST. Does not set liveConfirmed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
BATCH = DATA / "academy-topic-batches"
ASSETS = ROOT / "kids/assets/kids-academy-audio"
DEEN_ASSETS = ROOT / "kids/assets/kids-deen-audio"
ORIGINALS = ROOT / "kids/original-media/v4-fill-20261126"
PUBLIC = DATA / "academy-audio.json"
LEDGER = BATCH / "v4-fill-ledger-20261126.json"
PROGRESS = BATCH / "v4-fill-progress-20261126.json"
DICT_PIN = BATCH / "v4-fill-dictionary-version-20261126.json"
INV = BATCH / "v4-fill-inventory-20261126.json"
PROD = ROOT / "data/pronunciation/elevenlabs-production.json"

VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
PROFILE = "serhat-owner-voice-2026"
SPEAKER = "Serhat Abu Malik"
SETTINGS = {
    "stability": 0.62,
    "similarity_boost": 0.88,
    "style": 0.16,
    "speed": 0.91,
    "use_speaker_boost": True,
}
RESERVE = 2000
USER_AGENT = "DAR-KIDS-V4-FILL/20261126"
AR_RE = re.compile(
    r"(ﷺ)|([\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+(?:\s+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]+)*)"
)
PRIORITY_FIRST = ["sidq", "akhlaq-sabr", "akhlaq-amanah", "adab-salam", "adab-worte"]


def nfc(s: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", s or "")).strip()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stamp() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def save_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY missing")
    return key


def remaining_credits() -> int:
    last_err = None
    for attempt in range(8):
        req = urllib.request.Request(
            "https://api.elevenlabs.io/v1/user/subscription",
            headers={"xi-api-key": api_key(), "Accept": "application/json", "User-Agent": USER_AGENT},
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode())
            return max(0, int(data.get("character_limit") or 0) - int(data.get("character_count") or 0))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", "replace")[:300]
            if e.code == 429 or (500 <= e.code < 600):
                last_err = f"HTTP {e.code} {err_body}"
                ra = e.headers.get("Retry-After") if e.headers else None
                try:
                    wait = float(ra) if ra else min(90, 6 * (2 ** attempt))
                except ValueError:
                    wait = min(90, 6 * (2 ** attempt))
                time.sleep(max(2.0, wait))
                continue
            raise RuntimeError(f"subscription HTTP {e.code}: {err_body}")
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = type(e).__name__ + ": " + str(e)
            time.sleep(min(60, 4 * (2 ** attempt)))
            continue
    raise RuntimeError("subscription retries exhausted: " + str(last_err))


def dict_locator() -> dict:
    pin = load_json(DICT_PIN)
    return {
        "pronunciation_dictionary_id": pin["dictionaryId"],
        "version_id": pin["versionId"],
    }


def ff_seconds(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True,
    ).strip()
    return float(out)


def mp3_to_m4a(src: Path, dest: Path) -> float:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-i", str(src), "-ac", "1", "-ar", "48000",
         "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", str(dest)],
        check=True, timeout=120,
    )
    dur = ff_seconds(dest)
    if dest.stat().st_size < 1200 or dur < 0.4:
        dest.unlink(missing_ok=True)
        raise RuntimeError("m4a technical QA failed: " + dest.name)
    return dur


def concat_mp3(parts: list[Path], dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if len(parts) == 1:
        dest.write_bytes(parts[0].read_bytes())
        return
    inputs = []
    filt = []
    for i, p in enumerate(parts):
        inputs += ["-i", str(p)]
        filt.append(f"[{i}:a]")
    fc = "".join(filt) + f"concat=n={len(parts)}:v=0:a=1[a]"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
         "-filter_complex", fc, "-map", "[a]", "-c:a", "libmp3lame",
         "-b:a", "128k", str(dest)],
        check=True, timeout=180,
    )


# Lift scholarly Latin Arabic terms to vowelized Fuṣḥā so they become their
# own Arabic TTS segments. Display/spokenText stays unchanged. Longer / more
# specific forms first. Do not lift Ṣadaqah as Ṣidq, or Ṣiddīq as Ṣidq.
_WB = r"(?<![A-Za-zṢṣḤḥḌḍṬṭẒẓĠġĀāĪīŪūʾʿ])"
_WA = r"(?![A-Za-zāīūḍḥṣṭẓʾʿĀĪŪṢṣḤḥ])"
_TERM_LIFTS: list[tuple[re.Pattern, str]] = [
    (re.compile(_WB + r"(?:Al-Fātiḥah|al-Fātiḥah|Al-Fatihah|al-Fatihah|al-fātiḥah|al-fatihah)" + _WA), "الْفَاتِحَة"),
    (re.compile(_WB + r"(?:Al-Ikhlāṣ|al-Ikhlāṣ|Al-Iḫlāṣ|al-Iḫlāṣ|Al-Ikhlas|al-Ikhlas|al-iḫlāṣ|al-ikhlas)" + _WA), "الْإِخْلَاص"),
    (re.compile(_WB + r"(?:a[sṣSṢ]-)?(?:Ṣidq|Sidq|ṣidq|sidq)" + _WA), "SIDQ_SPECIAL"),
    (re.compile(_WB + r"(?:Wuḍūʾ|Wudūʾ|Wuḍū'|Wudu'|Wudhu|Wuḍuʾ)" + _WA), "وُضُوء"),
    (re.compile(_WB + r"(?:Ṣaḥābah|Sahabah|ṣaḥābah)" + _WA), "صَحَابَة"),
    (re.compile(_WB + r"(?:Ṣaḥābī|Sahabi|ṣaḥābī)" + _WA), "صَحَابِيّ"),
    (re.compile(_WB + r"(?:Ṣaḥīḥ|Sahih|ṣaḥīḥ)" + _WA), "صَحِيح"),
    (re.compile(_WB + r"(?:Ṣalāh|Salah|ṣalāh)" + _WA), "صَلَاة"),
    (re.compile(_WB + r"(?:Akhlāq|Akhlaq|akhlāq)" + _WA), "أَخْلَاق"),
    (re.compile(_WB + r"(?:Ikhlāṣ|Ikhlas|Iḫlāṣ|ikhlāṣ|iḫlāṣ)" + _WA), "إِخْلَاص"),
    (re.compile(_WB + r"(?:Tawḥīd|Tawhid|tawḥīd)" + _WA), "تَوْحِيد"),
    (re.compile(_WB + r"(?:Ṣabr|ṣabr)(?![a-zāīū])" ), "صَبْر"),
    (re.compile(_WB + r"(?:ʿIbādah|Ibādah|ʿibādah)" + _WA), "عِبَادَة"),
    (re.compile(_WB + r"(?:ʿAqīdah|Aqīdah|ʿaqīdah)" + _WA), "عَقِيدَة"),
    (re.compile(_WB + r"(?:Amānah|amānah)" + _WA), "أَمَانَة"),
    (re.compile(_WB + r"(?:Duʿāʾ|Duʿā)(?![a-zāīūʾ])"), "دُعَاء"),
    (re.compile(_WB + r"(?:Ṭahārah|ṭahārah|Taharah)" + _WA), "طَهَارَة"),
    (re.compile(_WB + r"(?:Ramaḍān|ramaḍān)" + _WA), "رَمَضَان"),
    (re.compile(_WB + r"(?:Raḥmah|raḥmah)" + _WA), "رَحْمَة"),
    (re.compile(_WB + r"(?:Ġībah|Ghibah|ġībah|ghibah)" + _WA), "غِيبَة"),
    (re.compile(_WB + r"(?:Niyyah|Niyya|niyyah)" + _WA), "نِيَّة"),
    (re.compile(_WB + r"(?:Masḥ|masḥ)" + _WA), "مَسْح"),
    (re.compile(_WB + r"(?:Fiqh|fiqh)" + _WA), "فِقْه"),
    (re.compile(_WB + r"(?:Īmān|īmān)" + _WA), "إِيمَان"),
    (re.compile(_WB + r"(?:Qurʾān)" + _WA), "الْقُرْآن"),
    (re.compile(_WB + r"(?:Sunnah)" + _WA), "سُنَّة"),
    (re.compile(_WB + r"(?:Ṣadaqah|ṣadaqah)" + _WA), "صَدَقَة"),
]


def lift_arabic_terms_for_tts(text: str) -> str:
    """TTS-only rewrite. Do not use the result as a manifest key."""
    out = text
    for rx, repl in _TERM_LIFTS:
        if repl == "SIDQ_SPECIAL":
            def sidq_repl(m: re.Match, _rx=rx) -> str:
                raw = m.group(0)
                if raw[:2].lower() in {"as", "aṣ"} and len(raw) > 2 and raw[2] == "-":
                    return "الصِّدْق"
                if raw.lower().startswith("a") and len(raw) > 2 and raw[1] in "-‐‑":
                    return "الصِّدْق"
                return "الصِّدْق"
            out = rx.sub(sidq_repl, out)
        else:
            out = rx.sub(repl, out)
    return out


def lift_sidq_for_tts(text: str) -> str:
    return lift_arabic_terms_for_tts(text)


def split_segments(text: str) -> list[tuple[str, str]]:
    """Return ordered (lang, text) segments. Arabic script / ﷺ are ar."""
    out = []
    idx = 0
    for m in AR_RE.finditer(text):
        if m.start() > idx:
            de = text[idx:m.start()]
            if de.strip():
                out.append(("de", de))
            elif de:
                if out and out[-1][0] == "de":
                    out[-1] = ("de", out[-1][1] + de)
                else:
                    out.append(("de", de))
        chunk = m.group(0)
        if chunk.strip():
            out.append(("ar", chunk.strip()))
        idx = m.end()
    if idx < len(text):
        de = text[idx:]
        if de.strip() or not out:
            out.append(("de", de if de.strip() else text))
    # merge adjacent same-lang
    merged = []
    for lang, t in out:
        if merged and merged[-1][0] == lang:
            merged[-1] = (lang, merged[-1][1] + t)
        else:
            merged.append((lang, t))
    # if a 'de' segment is only punctuation/space, attach to neighbor
    cleaned = []
    for lang, t in merged:
        if lang == "de" and not re.search(r"[A-Za-zÄÖÜäöüß]", t) and cleaned:
            cleaned[-1] = (cleaned[-1][0], cleaned[-1][1] + t)
        else:
            cleaned.append((lang, t))
    if not cleaned:
        cleaned = [("de", text)]
    return cleaned


def tts_request(text: str, lang: str, use_dict: bool) -> tuple[bytes, str, int]:
    """One official TTS call. Retry only 429/transient pre-body failures."""
    payload = {
        "text": text,
        "model_id": MODEL,
        "language_code": lang,
        "voice_settings": dict(SETTINGS),
        "apply_text_normalization": "off" if lang == "ar" else "auto",
    }
    if use_dict:
        payload["pronunciation_dictionary_locators"] = [dict_locator()]
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128"
    last_err = None
    for attempt in range(6):
        req = urllib.request.Request(
            url, data=body, method="POST",
            headers={
                "xi-api-key": api_key(),
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
                "User-Agent": USER_AGENT,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                mime = (resp.headers.get_content_type() or "").lower()
                if mime not in ("audio/mpeg", "audio/mp3", "application/octet-stream"):
                    raise RuntimeError("non-mp3 content-type: " + mime)
                request_id = resp.headers.get("request-id") or resp.headers.get("xi-request-id") or ""
                char_hdr = resp.headers.get("x-character-count") or resp.headers.get("x-characters-used") or ""
                try:
                    spent = int(char_hdr) if char_hdr else len(text)
                except ValueError:
                    spent = len(text)
                data = resp.read()
                if len(data) < 1200:
                    raise RuntimeError("mp3 too short")
                return data, request_id, spent
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", "replace")[:400]
            if e.code == 429 or (500 <= e.code < 600):
                last_err = f"HTTP {e.code} {err_body}"
                time.sleep(min(60, 4 * (2 ** attempt)))
                continue
            if e.code == 422 and "voice_settings" in err_body and "style" in json.dumps(payload):
                # Fallback once: kids_story style/speed may be rejected; do not attach dictionary to German.
                payload["voice_settings"] = {"stability": 0.62, "similarity_boost": 0.88, "use_speaker_boost": True}
                body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                last_err = f"HTTP 422 retry-without-style {err_body}"
                continue
            raise RuntimeError(f"HTTP {e.code}: {err_body}")
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = type(e).__name__ + ": " + str(e)
            # Timeout after the request was sent may have billed; do not blindly retry.
            if "timed out" in str(e).lower() or "timeout" in type(e).__name__.lower():
                raise RuntimeError("UNCERTAIN_TIMEOUT: " + last_err)
            time.sleep(min(30, 3 * (2 ** attempt)))
            continue
    raise RuntimeError("retries exhausted: " + str(last_err))


def file_ok(url: str, digest: str | None = None) -> bool:
    if not url:
        return False
    path = ROOT / url.split("?")[0].lstrip("/")
    if not path.is_file() or path.is_symlink() or path.stat().st_size < 1200:
        return False
    if digest and sha(path.read_bytes()) != digest:
        return False
    return True


def reusable_entry(text: str, public: dict, extras: list[dict]) -> dict | None:
    key = nfc(text)
    rec = (public.get("entries") or {}).get(text) or (public.get("entries") or {}).get(key)
    if isinstance(rec, dict) and rec.get("voiceId") == VOICE and rec.get("modelId") == MODEL:
        if file_ok(rec.get("url") or "", rec.get("sha256")):
            return rec
    for pack in extras:
        entries = pack.get("entries") or {}
        rec = entries.get(text) or entries.get(key)
        if not isinstance(rec, dict):
            # some packs use spokenText field
            for k, v in entries.items():
                if isinstance(v, dict) and nfc(v.get("spokenText") or v.get("text") or k) == key:
                    rec = v
                    break
        if not isinstance(rec, dict):
            continue
        model = rec.get("modelId") or pack.get("modelId")
        voice = rec.get("voiceId") or pack.get("voiceId") or ""
        if model == MODEL and (voice in (VOICE, "", None) or voice == VOICE):
            profile = rec.get("voiceProfileId") or pack.get("voiceProfileId")
            if profile and profile != PROFILE:
                continue
            if file_ok(rec.get("url") or "", rec.get("sha256")):
                if voice in (VOICE, "", None) and rec.get("sourceVoice") == "authorized-owner-voice":
                    return rec
                if voice == VOICE:
                    return rec
    return None


def load_extra_manifests() -> list[dict]:
    extras = []
    for p in [
        DATA / "owner-voice-audio.json",
        DATA / "quiz-v4-full-rebuild-public.json",
        DATA / "dua-audio.json",
        DATA / "term-learning-audio.json",
    ]:
        if p.exists():
            try:
                extras.append(load_json(p))
            except Exception:
                pass
    return extras


def load_plans():
    files = list(DATA.glob("academy*voice-plan*.json"))
    files += [
        DATA / "academy-full-salam-voice-plan-v19.json",
        DATA / "academy-vocabulary-voice-plan-v24.json",
    ]
    needed = {}
    for p in files:
        if not p.exists():
            continue
        d = load_json(p)
        for ph in d.get("phrases") or []:
            t = nfc(ph.get("text"))
            if not t:
                continue
            for ctx in ph.get("contexts") or [{}]:
                lid = ctx.get("lessonId") or d.get("lessonId") or ctx.get("topicId")
                if not lid:
                    continue
                needed.setdefault(lid, {})
                if t not in needed[lid]:
                    needed[lid][t] = {"text": t, "lang": ph.get("lang") or "de-DE"}
    return needed


def priority_key(lesson_id: str, seq_ids: list[str], vocab_ids: list[str]) -> tuple:
    if lesson_id in PRIORITY_FIRST:
        return (0, PRIORITY_FIRST.index(lesson_id), lesson_id)
    if lesson_id in seq_ids:
        return (1, seq_ids.index(lesson_id), lesson_id)
    if lesson_id in vocab_ids:
        return (2, vocab_ids.index(lesson_id), lesson_id)
    return (3, 0, lesson_id)


def build_queue():
    seq = load_json(DATA / "academy-full-release-sequence-v1.json")
    seq_ids = [l["lessonId"] for l in seq["existingLessons"]]
    needed = load_plans()
    vocab_ids = sorted(i for i in needed if i not in set(seq_ids))
    unique = {}
    for lid, texts in needed.items():
        if lid not in set(seq_ids) | set(vocab_ids):
            continue
        for t, meta in texts.items():
            if t not in unique:
                unique[t] = {"text": t, "lang": meta.get("lang") or "de-DE", "lessons": []}
            unique[t]["lessons"].append(lid)
    items = []
    for t, info in unique.items():
        first = sorted(info["lessons"], key=lambda x: priority_key(x, seq_ids, vocab_ids))[0]
        items.append({
            "kind": "academy",
            "text": t,
            "lang": info["lang"],
            "lessons": info["lessons"],
            "firstLesson": first,
            "sort": priority_key(first, seq_ids, vocab_ids),
            "chars": len(t),
        })
    items.sort(key=lambda x: (x["sort"], x["text"]))

    # Den Dīn lernen
    cur = load_json(DATA / "deen-curriculum-v1.json")
    dl = load_json(DATA / "deen-lessons.json")
    intros = {it["id"]: it for it in dl["items"]}
    deen = []
    order = 0
    for cat in cur["categories"]:
        for les in cat["lessons"]:
            text = les.get("masterStoryText") or intros.get(les["id"], {}).get("masterStoryText") or ""
            text = nfc(text) if text else ""
            # keep paragraph structure for TTS: use original master text, not fully flattened
            raw = les.get("masterStoryText") or intros.get(les["id"], {}).get("masterStoryText") or ""
            deen.append({
                "kind": "deen",
                "id": les["id"],
                "category": cat["id"],
                "title": les.get("title"),
                "text": raw.strip(),
                "chars": len(raw.strip()),
                "sort": (4, order, les["id"]),
                "source": "curriculum" if les.get("masterStoryText") else "deen-lessons",
            })
            order += 1
    return items, deen, seq_ids, vocab_ids


def ledger_init():
    if LEDGER.exists():
        return load_json(LEDGER)
    obj = {
        "schemaVersion": 1,
        "id": "KIDS_V4_FILL_LEDGER_20261126",
        "voiceId": VOICE,
        "modelId": MODEL,
        "dictionaryVersionId": load_json(DICT_PIN)["versionId"],
        "createdAt": stamp(),
        "charactersSpentThisRun": 0,
        "generated": 0,
        "reused": 0,
        "uncertain": 0,
        "requests": {},
    }
    save_json(LEDGER, obj)
    return obj


def manifest_entry(url: str, digest: str, duration: float, text: str, lesson_id: str | None, spent_meta: dict) -> dict:
    rec = {
        "url": url,
        "sha256": digest,
        "durationSeconds": round(duration, 3),
        "voiceId": VOICE,
        "voiceProfileId": PROFILE,
        "voiceSettingsProfile": "kids_story",
        "modelId": MODEL,
        "sourceVoice": "authorized-owner-voice",
        "sourceSpeaker": SPEAKER,
        "sourceType": "owner-V4-official-tts",
        "spokenText": text,
        "qaStatus": "technical-passed-awaiting-human-review",
        "approvedForPlayback": False,
        "humanListeningApproved": False,
        "releaseEnabled": False,
        "dictionaryVersionId": load_json(DICT_PIN)["versionId"] if spent_meta.get("usedDictionary") else None,
        "languageCode": spent_meta.get("languageCode"),
        "providerRequestIds": spent_meta.get("requestIds") or [],
    }
    if lesson_id:
        rec["sourceLessonId"] = lesson_id
    return {k: v for k, v in rec.items() if v is not None}


def upsert_academy(public: dict, text: str, entry: dict) -> None:
    public.setdefault("entries", {})[text] = entry
    public["speaker"] = SPEAKER
    public["voiceProfileId"] = PROFILE
    public["id"] = public.get("id") or "KIDS_ACADEMY_SERHAT_MASTER_V1"


def update_deen_audio(lesson_id: str, source: str, url: str, digest: str, duration: float, chars: int):
    audio = {
        "status": "technical-ready-awaiting-human-review",
        "url": url,
        "sha256": digest,
        "durationSeconds": round(duration, 3),
        "voiceId": VOICE,
        "voiceProfileId": PROFILE,
        "modelId": MODEL,
        "sourceVoice": "authorized-owner-voice",
        "sourceSpeaker": SPEAKER,
        "singleMasterAudio": True,
        "masterAgeRange": "4-10",
        "humanListeningApproved": False,
        "requiresExactTextMatch": True,
        "source": "masterStoryText",
        "characters": chars,
    }
    if source == "curriculum" or True:
        cur = load_json(DATA / "deen-curriculum-v1.json")
        for cat in cur["categories"]:
            for les in cat["lessons"]:
                if les["id"] == lesson_id:
                    les["audio"] = dict(audio)
                    if "masterAudio" in les:
                        les["masterAudio"] = {"status": audio["status"], "url": url, "sha256": digest}
        save_json(DATA / "deen-curriculum-v1.json", cur)
    dl = load_json(DATA / "deen-lessons.json")
    for it in dl["items"]:
        if it["id"] == lesson_id:
            it["audio"] = dict(audio)
            vp = it.get("voiceProduction") or {}
            vp.update({
                "status": "audio-technical-ready",
                "singleMasterAudio": True,
                "masterAgeRange": "4-10",
                "ttsSource": "masterStoryText",
                "audioStatus": audio["status"],
                "masterAudioUrl": url,
            })
            it["voiceProduction"] = vp
    save_json(DATA / "deen-lessons.json", dl)


def synthesize_text(text: str, ident: str) -> tuple[Path, list[str], int, str, bool]:
    """Return (mp3_path, request_ids, chars_spent, language_label, used_dict)."""
    segs = split_segments(lift_arabic_terms_for_tts(text))
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    parts = []
    request_ids = []
    spent = 0
    used_dict = False
    langs = []
    for i, (lang, chunk) in enumerate(segs):
        piece = chunk if lang == "ar" else chunk
        if not piece.strip() and lang == "de" and len(segs) > 1:
            continue
        if not piece.strip():
            piece = chunk or text
        use_dict = lang == "ar"
        if use_dict:
            used_dict = True
        langs.append(lang)
        data, req_id, used = tts_request(piece.strip() if lang == "ar" else piece, lang, use_dict)
        part = ORIGINALS / f"{ident}-{i}-{lang}.mp3"
        if part.exists():
            raise RuntimeError("refusing to overwrite possible paid original: " + part.name)
        part.write_bytes(data)
        parts.append(part)
        request_ids.append(req_id)
        spent += used
    merged = ORIGINALS / f"{ident}.mp3"
    if merged.exists():
        raise RuntimeError("refusing to overwrite possible paid original: " + merged.name)
    concat_mp3(parts, merged)
    label = "mixed" if len(set(langs)) > 1 else (langs[0] if langs else "de")
    return merged, request_ids, spent, label, used_dict


def produce_one_academy(item, public, extras, ledger) -> str:
    text = item["text"]
    ident = sha(text.encode("utf-8"))[:24]
    recs = ledger["requests"]
    state = recs.get(ident)
    if state and state.get("state") == "done":
        if file_ok(state.get("url") or "", state.get("sha256")):
            # ensure manifest has it
            if text not in public.get("entries", {}) or not file_ok(public["entries"][text].get("url", ""), public["entries"][text].get("sha256")):
                public.setdefault("entries", {})[text] = manifest_entry(
                    state["url"], state["sha256"], state.get("durationSeconds") or 1.0,
                    text, item.get("firstLesson"),
                    {"usedDictionary": state.get("usedDictionary"), "languageCode": state.get("languageCode"),
                     "requestIds": state.get("providerRequestIds") or []},
                )
            return "already"
        raise RuntimeError("ledger done but file missing: " + ident)
    if state and state.get("state") == "uncertain-do-not-retry":
        # If the original MP3 actually landed, finish without a new paid request.
        existing_mp3 = ORIGINALS / f"{ident}.mp3"
        if not (existing_mp3.is_file() and existing_mp3.stat().st_size >= 1200):
            return "uncertain"
    if state and state.get("state") == "attempt-started-never-auto-retry":
        existing_mp3 = ORIGINALS / f"{ident}.mp3"
        if not (existing_mp3.is_file() and existing_mp3.stat().st_size >= 1200):
            return "uncertain"
        # Paid audio exists; only transcode and register.
        dest = ASSETS / (sha((MODEL + "|" + VOICE + "|" + text).encode())[:20] + ".m4a")
        duration = mp3_to_m4a(existing_mp3, dest)
        digest = sha(dest.read_bytes())
        url = "/" + dest.relative_to(ROOT).as_posix()
        entry = manifest_entry(url, digest, duration, text, item.get("firstLesson"), {
            "usedDictionary": state.get("usedDictionary"), "languageCode": state.get("languageCode") or "de",
            "requestIds": state.get("providerRequestIds") or [],
        })
        upsert_academy(public, text, entry)
        recs[ident].update({
            "state": "done", "reused": False, "url": url, "sha256": digest,
            "durationSeconds": duration, "completedAt": stamp(), "recoveredFromOriginal": True,
        })
        ledger["generated"] = ledger.get("generated", 0) + 1
        return "generated"

    existing = reusable_entry(text, public, extras)
    if existing:
        entry = manifest_entry(
            existing["url"], existing.get("sha256") or sha((ROOT / existing["url"].lstrip("/")).read_bytes()),
            float(existing.get("durationSeconds") or existing.get("durationSec") or ff_seconds(ROOT / existing["url"].split("?")[0].lstrip("/"))),
            text, item.get("firstLesson"),
            {"usedDictionary": False, "languageCode": "reused", "requestIds": []},
        )
        entry["sourceType"] = "reused-existing-master-v4"
        if existing.get("sourceType"):
            entry["reusedFromSourceType"] = existing.get("sourceType")
        upsert_academy(public, text, entry)
        recs[ident] = {
            "state": "done", "text": text, "reused": True,
            "url": entry["url"], "sha256": entry["sha256"],
            "durationSeconds": entry["durationSeconds"],
            "completedAt": stamp(), "firstLesson": item.get("firstLesson"),
        }
        ledger["reused"] = ledger.get("reused", 0) + 1
        return "reused"

    recs[ident] = {
        "state": "attempt-started-never-auto-retry",
        "text": text, "chars": len(text), "createdAt": stamp(),
        "firstLesson": item.get("firstLesson"), "voiceId": VOICE, "modelId": MODEL,
    }
    save_json(LEDGER, ledger)
    try:
        mp3, req_ids, spent, lang, used_dict = synthesize_text(text, ident)
    except RuntimeError as e:
        if str(e).startswith("UNCERTAIN_TIMEOUT"):
            recs[ident]["state"] = "uncertain-do-not-retry"
            recs[ident]["error"] = str(e)[:300]
            ledger["uncertain"] = ledger.get("uncertain", 0) + 1
            save_json(LEDGER, ledger)
            return "uncertain"
        recs[ident]["state"] = "uncertain-do-not-retry" if "HTTP 5" in str(e) or "UNCERTAIN" in str(e) else "failed-not-billed-unknown"
        recs[ident]["error"] = str(e)[:400]
        if recs[ident]["state"].startswith("uncertain"):
            ledger["uncertain"] = ledger.get("uncertain", 0) + 1
        save_json(LEDGER, ledger)
        if "HTTP 401" in str(e) or "HTTP 403" in str(e):
            raise
        return "failed"

    dest = ASSETS / (sha((MODEL + "|" + VOICE + "|" + text).encode())[:20] + ".m4a")
    if dest.exists():
        # unique suffix from ident
        dest = ASSETS / (sha((MODEL + "|" + VOICE + "|" + text + "|" + ident).encode())[:20] + ".m4a")
    duration = mp3_to_m4a(mp3, dest)
    digest = sha(dest.read_bytes())
    url = "/" + dest.relative_to(ROOT).as_posix()
    entry = manifest_entry(url, digest, duration, text, item.get("firstLesson"), {
        "usedDictionary": used_dict, "languageCode": lang, "requestIds": req_ids,
    })
    upsert_academy(public, text, entry)
    recs[ident].update({
        "state": "done", "reused": False, "url": url, "sha256": digest,
        "durationSeconds": duration, "charactersSpent": spent,
        "providerRequestIds": req_ids, "usedDictionary": used_dict,
        "languageCode": lang, "completedAt": stamp(),
    })
    ledger["generated"] = ledger.get("generated", 0) + 1
    ledger["charactersSpentThisRun"] = ledger.get("charactersSpentThisRun", 0) + spent
    return "generated"


def produce_one_deen(item, ledger) -> str:
    ident = "deen-" + item["id"]
    recs = ledger["requests"]
    state = recs.get(ident)
    if state and state.get("state") == "done" and file_ok(state.get("url") or "", state.get("sha256")):
        return "already"
    if state and state.get("state") in {"uncertain-do-not-retry", "attempt-started-never-auto-retry"}:
        return "uncertain"
    text = item["text"]
    if not text:
        recs[ident] = {"state": "skipped-no-text", "id": item["id"]}
        return "skipped"
    recs[ident] = {
        "state": "attempt-started-never-auto-retry", "kind": "deen",
        "id": item["id"], "chars": len(text), "createdAt": stamp(),
    }
    save_json(LEDGER, ledger)
    try:
        mp3, req_ids, spent, lang, used_dict = synthesize_text(text, ident)
    except RuntimeError as e:
        recs[ident]["state"] = "uncertain-do-not-retry" if "UNCERTAIN" in str(e) or "HTTP 5" in str(e) else "failed-not-billed-unknown"
        recs[ident]["error"] = str(e)[:400]
        if recs[ident]["state"].startswith("uncertain"):
            ledger["uncertain"] = ledger.get("uncertain", 0) + 1
        save_json(LEDGER, ledger)
        if "HTTP 401" in str(e) or "HTTP 403" in str(e):
            raise
        return "failed"
    dest = DEEN_ASSETS / (sha((MODEL + "|" + VOICE + "|deen|" + item["id"] + "|" + text).encode())[:20] + ".m4a")
    duration = mp3_to_m4a(mp3, dest)
    digest = sha(dest.read_bytes())
    url = "/" + dest.relative_to(ROOT).as_posix()
    update_deen_audio(item["id"], item.get("source") or "curriculum", url, digest, duration, len(text))
    recs[ident].update({
        "state": "done", "url": url, "sha256": digest, "durationSeconds": duration,
        "charactersSpent": spent, "providerRequestIds": req_ids,
        "usedDictionary": used_dict, "languageCode": lang, "completedAt": stamp(),
    })
    ledger["generated"] = ledger.get("generated", 0) + 1
    ledger["charactersSpentThisRun"] = ledger.get("charactersSpentThisRun", 0) + spent
    return "generated"


def write_progress(public, ledger, extra: dict):
    save_json(PROGRESS, {
        "updatedAt": stamp(),
        "academyEntries": len((public or {}).get("entries") or {}),
        "generated": ledger.get("generated"),
        "reused": ledger.get("reused"),
        "uncertain": ledger.get("uncertain"),
        "charactersSpentThisRun": ledger.get("charactersSpentThisRun"),
        **extra,
    })


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--produce", action="store_true")
    parser.add_argument("--max", type=int, default=0, help="Optional cap of new billed items")
    parser.add_argument("--deen-only", action="store_true")
    parser.add_argument("--academy-only", action="store_true")
    args = parser.parse_args()
    academy, deen, seq_ids, vocab_ids = build_queue()
    public = load_json(PUBLIC) if PUBLIC.exists() else {"schemaVersion": 2, "id": "KIDS_ACADEMY_SERHAT_MASTER_V1", "voiceProfileId": PROFILE, "speaker": SPEAKER, "entries": {}}
    extras = load_extra_manifests()
    miss_ac = [i for i in academy if not reusable_entry(i["text"], public, extras)]
    miss_deen = [i for i in deen if i["chars"] > 0]
    already_audio_deen = 0
    for i in deen:
        # check if audio url already set and file exists
        pass
    print(json.dumps({
        "academyUnique": len(academy),
        "academyMissingOrUnverified": len(miss_ac),
        "academyMissingChars": sum(i["chars"] for i in miss_ac),
        "deenLessons": len(deen),
        "deenChars": sum(i["chars"] for i in deen),
        "creditsRemaining": None,
        "dictionaryVersionId": load_json(DICT_PIN)["versionId"],
    }, ensure_ascii=False, indent=2), flush=True)
    if args.status and not args.produce:
        # Single subscription fetch for a status-only run.
        print("creditsRemaining", remaining_credits(), flush=True)
        return
    if not args.produce:
        parser.error("use --status or --produce")

    credits = remaining_credits()
    print("START remaining_credits", credits, flush=True)
    if credits < RESERVE + 50:
        raise SystemExit("credits below reserve; no paid work started")
    ledger = ledger_init()
    generated_now = 0
    last_credit_check_generated = 0
    stop_reason = None
    work = []
    if not args.deen_only:
        work += academy
    if not args.academy_only:
        work += deen

    ASSETS.mkdir(parents=True, exist_ok=True)
    DEEN_ASSETS.mkdir(parents=True, exist_ok=True)

    for idx, item in enumerate(work, 1):
        if args.max and generated_now >= args.max:
            stop_reason = "max-items"
            break
        need_chars = item["chars"]
        # Refresh official remaining only after batches of billed items, not on reuse.
        if generated_now > 0 and generated_now % 20 == 0 and last_credit_check_generated != generated_now:
            credits = remaining_credits()
            last_credit_check_generated = generated_now
            print("CREDIT_REFRESH remaining", credits, "generated_now", generated_now, flush=True)
        if credits < RESERVE + need_chars:
            stop_reason = f"credits-low remaining={credits} need={need_chars} reserve={RESERVE}"
            print("STOP", stop_reason, flush=True)
            break
        kind = item["kind"]
        label = item.get("firstLesson") or item.get("id")
        try:
            if kind == "academy":
                result = produce_one_academy(item, public, extras, ledger)
            else:
                result = produce_one_deen(item, ledger)
        except Exception as e:
            save_json(LEDGER, ledger)
            save_json(PUBLIC, public)
            write_progress(public, ledger, {"lastError": str(e)[:300], "index": idx, "label": label})
            raise
        if result == "generated":
            generated_now += 1
            credits = max(0, credits - item["chars"])
            save_json(PUBLIC, public)
            save_json(LEDGER, ledger)
            time.sleep(0.35)
        elif result in {"reused", "already"} and kind == "academy":
            save_json(PUBLIC, public)
            save_json(LEDGER, ledger)
        else:
            save_json(LEDGER, ledger)
        if idx % 5 == 0 or result == "generated":
            write_progress(public, ledger, {
                "index": idx, "total": len(work), "label": label, "lastResult": result,
                "creditsEstimate": credits, "generatedNow": generated_now,
            })
            print(f"[{idx}/{len(work)}] {result} {label} chars={item['chars']} generated_now={generated_now}", flush=True)

    save_json(PUBLIC, public)
    save_json(LEDGER, ledger)
    credits_end = remaining_credits()
    write_progress(public, ledger, {
        "done": True, "stopReason": stop_reason, "creditsRemaining": credits_end,
        "generatedNow": generated_now, "academyEntries": len(public.get("entries") or {}),
    })
    print(json.dumps({
        "finished": True,
        "stopReason": stop_reason,
        "generatedNow": generated_now,
        "ledgerGenerated": ledger.get("generated"),
        "ledgerReused": ledger.get("reused"),
        "ledgerUncertain": ledger.get("uncertain"),
        "charactersSpentThisRun": ledger.get("charactersSpentThisRun"),
        "creditsRemaining": credits_end,
        "academyEntries": len(public.get("entries") or {}),
    }, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
