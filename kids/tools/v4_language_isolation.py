#!/usr/bin/env python3
"""TAWḤĪD KIDS V4: hard language boundary and selective review-only retakes.

Default is read-only/preflight. No bulk regeneration, no user-facing changes.
Use:
  python3 kids/tools/v4_language_isolation.py --self-test
  python3 kids/tools/v4_language_isolation.py --audit
  python3 kids/tools/v4_language_isolation.py --slot kids-quiz-019:question
  python3 kids/tools/v4_language_isolation.py --slot kids-quiz-019:question \
    --execute-one --credit-authorization I_AUTHORIZE_ONE_V4_RETAKE

Only the final command calls ElevenLabs (one new V4 German candidate).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
POLICY_FILE = ROOT / "data/pronunciation/voice-language-isolation-v1.json"
MASTER_PLS = ROOT / "data/pronunciation/DAR_AL_TAWHID_ElevenLabs_ARABIC_MASTER_29122.pls"
MANIFEST = ROOT / "kids/data/quiz-v4-full-rebuild-public.json"
QUEUE = ROOT / "kids/review-only/voice-nur-qa-20261027.json"
OUTPUT = ROOT / "kids/review-only/voice-boundary-retakes-20261027"
PARTS = ("question", "correct", "retry", "explanation")
MODEL = "eleven_v4"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
GERMAN_NUR = re.compile(r"(?<!\w)[Nn]ur(?!\w)")
CAP_NUR = re.compile(r"(?<!\w)Nur(?!\w)")
# Arabic block, presentation forms, and salawat ligatures: never send native
# Arabic letters through a German instruction or dictionary by accident.
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")
LATIN = re.compile(r"[A-Za-zÄÖÜäöüß]")
# Only a QA signal, not a literal source-text rewrite or semantic dictionary.
ARABIC_ROMANIZED = re.compile(
    r"(?<![\w])(?:Allāhumma|Al-ḥamdu|Mā schāʾ Allāh|"
    r"Qurʾān|Fuṣḥā|Ṣalāh|Duʿāʾ|Tawḥīd|"
    r"Īmān|Iḥsān|Wuḍūʾ|Sūrat|Dīn|Ramaḍān|"
    r"Ṣadaqah|Zakāh|Ḥadīṯ|Ṭāġūt|Allāh)(?![\w])", re.I
)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def text_tag(content: str) -> str:
    """Strip ElevenLabs emotion directions solely for lexical preflight."""
    return re.sub(r"^\s*(?:\[[^\]]+\]\s*)+", "", content).strip()


def classify(text: str) -> str:
    bare = text_tag(text)
    if not bare:
        raise ValueError("Empty speech segment")
    ar, de = bool(ARABIC.search(bare)), bool(LATIN.search(bare))
    if ar and de:
        return "mixed"
    if ar:
        return "ar"
    if de:
        return "de"
    raise ValueError("No recognized language in speech segment")


def payload(text: str, language: str, policy: dict) -> dict:
    """Only isolated TTS requests may be constructed.

    Do not ever attach the global Arabic dictionary locator to German words,
    even when they appear next to an Arabic transliterated religious term.
    Mixed script must first be explicitly segmented and separately reviewed.
    """
    if language not in ("de", "ar"):
        raise ValueError("Mixed speech requires separate de/ar segments")
    detected = classify(text)
    if detected != language:
        raise ValueError(f"Language boundary violation: expected {language}, got {detected}")
    settings = policy["german" if language == "de" else "arabic"]
    if settings.get("pronunciationDictionaryLocators") != []:
        raise ValueError("Production policy must not attach cross-language dictionaries")
    if settings["requiredModelId"] != MODEL or settings["requiredVoiceId"] != VOICE:
        raise ValueError("Master voice/model mismatch")
    return {
        "text": text, "model_id": MODEL,
        "language_code": language,  # V4 German must stay 'de', Fuṣḥā stays 'ar'.
        "voice_settings": {"stability": 0.58, "similarity_boost": 0.82},
        # Deliberately NO pronunciation_dictionary_locators for this request.
        # No global substitutions: Nur (German) is never Arabic Nūr.
    }


def split_payloads(segments: list[dict], policy: dict) -> list[dict]:
    if not isinstance(segments, list) or not segments:
        raise ValueError("Explicit mixed-language segments are required")
    out = []
    for part in segments:
        if set(part) != {"language", "text"}:
            raise ValueError("Segment must explicitly name only language and text")
        out.append(payload(part["text"], part["language"], policy))
    # Audio concatenation is intentionally NOT done here; separate takes and
    # joins need prosody, normalization and documented human auditory approval.
    return out


def master_collision() -> tuple[str, str]:
    root = ET.parse(MASTER_PLS).getroot()
    ns = {"p": "http://www.w3.org/2005/01/pronunciation-lexicon"}
    entries = {}
    for item in root.findall("p:lexeme", ns):
        key = item.findtext("p:grapheme", default="", namespaces=ns)
        alias = item.findtext("p:alias", default="", namespaces=ns)
        if key:
            entries.setdefault(key, set()).add(alias)
    if "النور" not in entries.get("Nur", set()):
        raise ValueError("Arabic PLS changed: re-audit German/Arabic Nur collision")
    if "nur" in entries:
        raise ValueError("An additional lowercase 'nur' PLS entry needs review")
    return "Nur", "النور"


def manifest_slots() -> tuple[dict, dict]:
    source = load(MANIFEST)
    if len(source.get("questions", {})) != 450:
        raise ValueError("450-question public contract changed")
    slots = {}
    bands = {"4-6": 0, "7-8": 0, "9-10": 0}
    for qid, q in source["questions"].items():
        bands[q["ageBand"]] += 1
        if set(q.get("clips", {})) != set(PARTS):
            raise ValueError(f"Four-part V4 contract broken: {qid}")
        for part, c in q["clips"].items():
            slots[(qid, part)] = {"clip": c, "band": q["ageBand"], "source": q["source"]}
    if bands != dict.fromkeys(bands, 150) or len(slots) != 1800:
        raise ValueError("450/1800/150x3 V4 contract broken")
    return source, slots


def audit() -> dict:
    master_collision()
    source, slots = manifest_slots()
    queue = load(QUEUE)
    queued = {(r["questionId"], r["part"]): r for r in queue["entries"]}
    matched = {}
    capitals = lowercase_only = mixed = loan_terms = 0
    for key, value in slots.items():
        clip = value["clip"]
        spoken = clip.get("text", "")
        kind = classify(spoken)
        if kind != "de":
            mixed += 1
        if ARABIC_ROMANIZED.search(spoken):
            loan_terms += 1
        if GERMAN_NUR.search(spoken):
            matched[key] = clip
            if CAP_NUR.search(spoken):
                capitals += 1
            else:
                lowercase_only += 1
    if set(queued) != set(matched):
        raise ValueError("Stale Nur queue or changed public quiz manifest")
    for key, clip in matched.items():
        recorded = queued[key]
        # The single user-auditioned q178 retake may now be correctly live;
        # keep comparing the original review/QA row with immutable original
        # provenance, never pretend all 131 old MP3s were heard.
        pilot = load(ROOT / "kids/review-only/voice-language-isolation-pilot-20261027.json")
        is_imported = (key == ("kids-quiz-178", "question") and
                       pilot.get("manifestUpdated") is True and
                       clip.get("ownerReviewedGenerationId") == "4vpdmlfHmhNx5f0aOoqQ" and
                       clip.get("sha256") == pilot.get("newAudioSha256") and
                       clip.get("humanListeningApproved") is True)
        if is_imported:
            if (recorded["url"] != pilot.get("originalPublicAudioUrl") or
                    recorded["sha256"] != pilot.get("originalSha256")):
                raise ValueError("Owner-retake source provenance changed")
        elif recorded["url"] != clip["url"] or recorded["sha256"] != clip["sha256"]:
            raise ValueError(f"{key}: QA row SHA-256 or URL no longer matches published source")
    return {"questions": len(source["questions"]), "totalSlots": len(slots),
            "affectedNunWordSlots": len(matched), "capitalNurSlots": capitals,
            "lowercaseOnlySlots": lowercase_only, "nativeArabicOrMixedScriptSlots": mixed,
            "romanizedArabicTermSlotsForListeningReview": loan_terms,
            "arabicMasterPLSContains": {"Nur": "النور"},
            "currentMP3Approval": "human-unverified; do not claim fixed",
            "retakesGeneratedByAudit": 0}


def retake_slot(slot: str, execute: bool, credit_authorization: str, policy: dict) -> dict:
    if ":" not in slot:
        raise ValueError("Provide exact quiz-id:part")
    qid, part = slot.rsplit(":", 1)
    _, clips = manifest_slots()
    if part not in PARTS or (qid, part) not in clips:
        raise ValueError("Unknown question ID or four-part segment")
    clip = clips[(qid, part)]["clip"]
    # Avoid losing source provenance, overproducing, and accidental scripted
    # replacements of the answer or religiously reviewed canonical text.
    spoken = str(clip["text"])
    if not GERMAN_NUR.search(spoken):
        raise ValueError("This guarded retake lane is for reported Nur slots only")
    if classify(spoken) != "de":
        raise ValueError("Arabic text needs separately verified native Arabic segments")
    prompt = spoken  # canonical display speech, NO altered German source text
    request_payload = payload(prompt, "de", policy)
    meta = {
        "sourceSlot": slot, "ageBand": clips[(qid, part)]["band"],
        "originalUrl": clip["url"], "originalSha256": clip["sha256"],
        "originalTtsTextSha256": clip["ttsTextSha256"],
        "sourceSpeechText": spoken, "newTtsText": prompt,
        "newTtsTextSha256": digest(prompt.encode("utf-8")),
        "language": "de-DE",
        "arabicMasterDictionaryApplied": False,
        "containsRomanizedArabicTerms": bool(ARABIC_ROMANIZED.search(prompt)),
        "newStatus": "PENDING-HUMAN-LISTENING",
        "releaseEnabled": False, "humanListeningApproved": False,
        "audioReplacedInPublicManifest": False,
        "modelId": MODEL, "voiceId": VOICE,
    }
    if not execute:
        meta["operation"] = "DRY_RUN_NO_ELEVENLABS_CREDITS"
        return meta
    if credit_authorization != "I_AUTHORIZE_ONE_V4_RETAKE":
        raise ValueError("A separately authorized ONE-CLIP paid run is required")
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise ValueError("ELEVENLABS_API_KEY absent: zero requests made")
    output_dir = OUTPUT / qid / part
    if output_dir.exists():
        raise ValueError("Retake candidate already exists; do not duplicate charged output")
    output_dir.mkdir(parents=True)
    target = output_dir / "candidate.mp3"
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/" + VOICE + "?output_format=mp3_44100_128",
        data=json.dumps(request_payload, ensure_ascii=False).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json",
                 "Accept": "audio/mpeg", "User-Agent": "DAR-KIDS-V4-ISOLATED-DE/1"},
        method="POST",
    )
    # Paid request must never be retried automatically. A timed-out request
    # may have spent credits; inspect provider history before any manual rerun.
    try:
        with urllib.request.urlopen(req, timeout=180) as result:
            mime = str(result.headers.get("Content-Type", "")).lower()
            if "audio" not in mime and "octet-stream" not in mime:
                raise ValueError("Unexpected TTS non-audio response")
            audio = result.read()
        if len(audio) < 1700 or not (audio.startswith(b"ID3") or
                                   (audio[0] == 0xff and audio[1] & 0xe0 == 0xe0)):
            raise ValueError("Generated candidate is not a valid MP3 header")
        target.write_bytes(audio)
        meta["newAudioSha256"] = digest(audio)
        meta["newAudioPath"] = str(target.relative_to(ROOT))
        meta["newBytes"] = len(audio)
        meta["operation"] = "ONE_ISOLATED_GERMAN_V4_RETAKE_REVIEW_ONLY"
        (output_dir / "provenance.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    except BaseException:
        # Never free up this destination for accidental duplicate paid retry.
        (output_dir / "manual-billing-investigation-required.txt").write_text(
            "An API run may have charged credits. Investigate provider history, "
            "do not automatically retry.\n", encoding="utf-8")
        raise
    return meta


def self_test(policy: dict) -> None:
    assert classify("Nur das Gebet.") == "de"
    assert classify("Bitte nur zu Allah beten.") == "de"
    assert classify("نُور") == "ar"
    assert classify("Nur das Gebet. نُور") == "mixed"
    for s in ("Nur das Gebet.", "Antwort drei: Nur für Erwachsene.",
              "Ich bete nur zu Allah."):
        de = payload(s, "de", policy)
        assert de["text"] == s and de["language_code"] == "de" and "pronunciation_dictionary_locators" not in de
    assert payload("نُور", "ar", policy)["language_code"] == "ar"
    assert "pronunciation_dictionary_locators" not in payload("نُور", "ar", policy)
    for bad in (("Nur das Gebet. نُور", "de"), ("Nur das Gebet.", "ar")):
        try:
            payload(*bad, policy)
        except ValueError:
            pass
        else:
            raise AssertionError("Mixed-language boundary not enforced")
    sections = split_payloads([{"language": "de", "text": "Nur das Gebet."},
                               {"language": "ar", "text": "نُور"}], policy)
    assert len(sections) == 2
    assert all("pronunciation_dictionary_locators" not in p for p in sections)
    print("PASS: strict German/Arabic V4 isolation, no Arabic PLS for German 'Nur'")


def main() -> int:
    arg = argparse.ArgumentParser()
    group = arg.add_mutually_exclusive_group(required=True)
    group.add_argument("--self-test", action="store_true")
    group.add_argument("--audit", action="store_true")
    group.add_argument("--slot", help="Exact question-id:part; dry-run by default")
    arg.add_argument("--execute-one", action="store_true")
    arg.add_argument("--credit-authorization", default="")
    args = arg.parse_args()
    policy = load(POLICY_FILE)
    if policy["id"] != "dar-voice-language-isolation-v1":
        raise ValueError("Voice language isolation policy mismatch")
    if args.execute_one and not args.slot:
        raise ValueError("--execute-one requires one exact slot")
    if args.self_test:
        self_test(policy)
    if args.audit:
        print(json.dumps(audit(), ensure_ascii=False, indent=2))
    if args.slot:
        print(json.dumps(retake_slot(args.slot, args.execute_one,
                                      args.credit_authorization, policy),
                         ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
