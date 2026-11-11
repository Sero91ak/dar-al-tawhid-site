#!/usr/bin/env python3
"""TAWḤĪD KIDS: cost-bounded, exact-text, review-only V4 audio for next 64.

One invocation = at most four source-audited German speech clips.
No Qurʾān synthesis, live release, automatic retries, or child data.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/academy-v32-first64-source-audited-safe.json"
CATALOG = ROOT / "kids/data/academy-65-lessons-v32-voice-catalog.json"
PRIOR = ROOT / "kids/data/academy-sidq-v4-coverage-v31.json"
POLICY = ROOT / "kids/data/academy-voice-policy-v10.json"
MASTER = ROOT / "data/pronunciation/elevenlabs-production.json"
STAGING = ROOT / "kids/data/academy-v32-first64-audio-staging-20261111.json"
ASSETS = ROOT / "kids/assets/kids-academy-audio"
RISK = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\uFB50-\uFDFF\uFE70-\uFEFFṢṣḤḥḌḍṬṭḎḏṮṯẒẓĀāŪūĪīʿʾǦǧŠšḪḫ]")
OPEN_PROMPT = re.compile(r"^(?:Erkläre|Beschreibe|Schreibe|Sprich|Formuliere|Sage|Nenne|Erzähl|Berichte|Begründe)\b|in eigenen Worten", re.I)

sys.path.insert(0, str(ROOT / "kids/tools"))
from voice_text import prepare_kids_voice_text

spec = importlib.util.spec_from_file_location("kids_story_backend", ROOT / "kids/tools/build-academy-v9-staging.py")
backend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend)

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(doc):
    STAGING.parent.mkdir(parents=True, exist_ok=True)
    tmp = STAGING.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, STAGING)

def validate():
    plan, catalog, prior, policy, master = map(read, (PLAN, CATALOG, PRIOR, POLICY, MASTER))
    v = "DkU7j9uO4ZEtLD2iRZSH"
    assert plan["id"] == "KIDS_V32_SOURCE_AUDITED_GERMAN_SAFE_64_20261111"
    assert plan["modelId"] == "eleven_v4" and plan["voiceId"] == v and plan["voiceSettingsProfile"] == "kids_story"
    assert plan["totalClips"] == 64 and plan["totalBatches"] == 16
    assert plan["perBatchMaxClips"] == 4 and plan["perBatchMaxCharacters"] == 1200
    assert plan["first80Excluded"] and plan["sourceAuditGate"] and plan["nativeArabicTermHold"]
    assert plan["syntheticQuranRecitation"] is False
    assert plan["publication"] == "NEVER_APPROVE_WITHOUT_OWNER_LISTENING"
    assert prior["totals"]["exactRequired"] == 80 and prior["totals"]["staged"] == 80
    assert prior["totals"]["publicApproved"] == 0
    assert catalog["lessonCount"] == 65 and catalog["questionCount"] == 520
    assert policy["voiceIdentity"]["voiceId"] == v
    assert policy["production"]["modelId"] == master["modelId"] == "eleven_v4"
    assert master["masterVoice"]["voiceId"] == v
    assert policy["production"]["profile"] == "kids_story"
    assert policy["production"]["pronunciationDictionaryVersionId"] == master["pronunciationDictionary"]["versionId"]
    assert policy["production"]["pronunciationDictionaryId"] == master["pronunciationDictionary"]["id"]
    assert policy["costControls"]["autoPublishWithoutOwnerReview"] is False
    assert policy["costControls"]["maxClipsPerInvocation"] == 4
    assert policy["costControls"]["maxPreparedCharactersPerInvocation"] == 1200

    source = (ROOT / "cloudflare/video-studio/voice.js").read_text(encoding="utf-8")
    assert 'profile === "kids_story"' in source
    assert 'modelId !== "eleven_v4"' in source
    assert "const pronunciationDictionaryApplied = false;" in source
    settings = source.split('profile === "kids_story"', 1)[1].split('profile === "kids_lesson"', 1)[0]
    for key, value in policy["production"]["voiceSettings"].items():
        text = f"{key}: {str(value).lower() if isinstance(value, bool) else value}"
        if text not in settings:
            raise RuntimeError("Voice settings changed, no credits spent: " + key)

    previous = {e["text"] for e in prior["entries"]}
    corpus = {x["text"]: x for x in catalog["phrases"]}
    source_missing = set(catalog["audit"]["lessonsMissingSourceAudit"])
    texts = []
    for index, batch in enumerate(plan["batches"]):
        assert batch["batchIndex"] == index and len(batch["items"]) == 4
        assert batch["maxClips"] == 4 and batch["maxPreparedCharacters"] == 1200
        assert batch["totalSourceCharacters"] == sum(len(x["text"]) for x in batch["items"])
        assert batch["totalSourceCharacters"] <= 1200
        for item in batch["items"]:
            t = item["text"]
            assert t not in previous and t in corpus and t and not RISK.search(t)
            assert not (any(c["kind"] == "question" for c in item["contexts"]) and OPEN_PROMPT.search(t))
            assert item["sha256"] == hashlib.sha256(t.encode("utf-8")).hexdigest()
            assert item["contexts"] == corpus[t]["contexts"]
            assert item["sourceAuditProven"] is True and item["humanListeningRequired"] is True
            assert item["approvedForPlayback"] is False
            assert item["modelId"] == "eleven_v4" and item["voiceId"] == v
            assert all(c["lessonId"] not in source_missing for c in item["contexts"])
            texts.append(t)
    assert len(texts) == len(set(texts)) == 64
    assert sum(map(len, texts)) == plan["totalSourceCharacters"] == 3620
    return plan, policy, master

def stage_entry(doc, text, item, target, digest, duration):
    doc["entries"][text] = {
        "url": "/" + target.relative_to(ROOT).as_posix(),
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "preparedSha256": digest, "sourceSha256": item["sha256"],
        "durationSeconds": round(duration, 3), "contexts": item["contexts"],
        "voiceId": doc["voiceId"], "voiceSettingsProfile": "kids_story",
        "modelId": "eleven_v4", "pronunciationDictionaryAppliedByBackend": False,
        "qaStatus": "technical-passed-awaiting-owner-listening",
        "sourceAuditProven": True, "approvedForPlayback": False
    }
    save(doc)

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-all", action="store_true")
    parser.add_argument("--index", type=int)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    plan, policy, master = validate()
    if args.check_all:
        print("PASS: 64 unique V4 source-audited texts, 16 capped batches, first 80 excluded, no public approval, credits=0")
        return
    if args.index is None or not (0 <= args.index < 16):
        raise RuntimeError("Require --index 0 through 15; no credits used")
    batch = plan["batches"][args.index]
    items = batch["items"]
    prepared = {x["text"]: prepare_kids_voice_text(x["text"], apply_pronunciation=False) for x in items}
    if any(not t.strip() or len(t) > 700 or RISK.search(t) for t in prepared.values()):
        raise RuntimeError("Unsafe prepared pronunciation text; no credits used")
    if sum(map(len, prepared.values())) > 1200:
        raise RuntimeError("Prepared characters exceed 1200; no credits used")

    doc = read(STAGING) if STAGING.exists() else {
        "schemaVersion": 1, "id": "KIDS_V32_FIRST64_V4_STAGING_20261111",
        "sourcePlan": "kids/data/academy-v32-first64-source-audited-safe.json",
        "modelId": "eleven_v4", "voiceId": plan["voiceId"],
        "voiceSettingsProfile": "kids_story", "stagingOnly": True,
        "requiresOwnerListeningApproval": True, "approvedForPlayback": False,
        "entries": {}
    }
    if doc["id"] != "KIDS_V32_FIRST64_V4_STAGING_20261111" or not doc["stagingOnly"] or doc["approvedForPlayback"] is not False:
        raise RuntimeError("Staging release gate modified")
    valid = {x["text"] for b in plan["batches"] for x in b["items"]}
    assert set(doc["entries"]).issubset(valid)

    missing = []
    for x in items:
        t = x["text"]
        payload = {"text": prepared[t], "voice": plan["voiceId"], "model": "eleven_v4",
                   "profile": "kids_story", "settings": policy["production"]["voiceSettings"],
                   "dictionaryVersion": master["pronunciationDictionary"]["versionId"]}
        digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()
        target = ASSETS / ("v32-" + digest[:20] + ".m4a")
        entry = doc["entries"].get(t)
        if entry:
            if not target.is_file() or entry["sha256"] != hashlib.sha256(target.read_bytes()).hexdigest() or entry["preparedSha256"] != digest:
                raise RuntimeError("Previously paid or staged clip corrupted/missing: refuse rebilling")
            continue
        missing.append((x, target, digest))
    print(f"KIDS V32 batch {args.index + 1}/16: {len(items)} source-audited, {len(missing)} unstaged, no public approval", flush=True)
    if args.dry_run or not missing:
        return
    secret = os.environ.get("ADMIN_PUBLISH_SECRET", "").strip()
    if not secret:
        raise RuntimeError("Canonical owner-voice backend credential absent; zero credits used")
    ASSETS.mkdir(parents=True, exist_ok=True)
    for x, target, digest in missing:
        if target.is_file():
            if target.stat().st_size < 1800:
                raise RuntimeError("Existing incomplete cache: refuse another billed request")
            duration = backend.technical_duration(target)
        else:
            print(f"V4 source-audited German clip: {len(prepared[x['text']])} characters", flush=True)
            duration = backend.generate_audio(x["text"], target, secret, prepared_override=prepared[x["text"]])
        stage_entry(doc, x["text"], x, target, digest, duration)
    print(f"PASS: {len(items)} checked, {len(doc['entries'])}/64 staged, published=0", flush=True)

if __name__ == "__main__":
    run()
