#!/usr/bin/env python3
"""DĀR AL TAWḤĪD KIDS · explicit one-time 29-story V4 completion batches.

All eight calls are separate, bounded invocations of the EXISTING single-master
generator (one whole story per TTS request). This wrapper cannot publish to
the Kids catalog; the runner commits each completed batch before continuing.
"""
from __future__ import annotations

import importlib.util
import json
import pathlib
import re
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
AUTH = ROOT / "kids/audio-jobs/salaf-v4-complete-request-20261028.json"
PLAN = ROOT / "kids/audio-jobs/salaf-v4-remaining-plan-20261028.json"
CATALOG = ROOT / "kids/data/salaf-library-v1.json"
PILOT = ROOT / "kids/audio-jobs/salaf-v4-request-20261027.json"
ORIGINAL = ROOT / "kids/tools/build-salaf-v4-master-staging.py"
STAGE_ROOT = ROOT / "kids/review-only/salaf-v4-complete-20261028"
EXPECTED_AUTH = "OWNER_EXPLICIT_SALAF_AUDIO_2026_10_28"
EXPECTED_VOICE = "DkU7j9uO4ZEtLD2iRZSH"
EXPECTED_MODEL = "eleven_v4"
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")


def load(path: pathlib.Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def audited_batch_map() -> tuple[dict, list[tuple[str, list[str]]]]:
    auth, plan, catalog, pilot = (load(p) for p in (AUTH, PLAN, CATALOG, PILOT))
    if (auth.get("authorization") != EXPECTED_AUTH
        or auth.get("mode") != "staging-review-only"
        or auth.get("allowPaidSynthesis") is not True
        or auth.get("allowLivePublication") is not False
        or auth.get("allowAutomaticRetries") is not False
        or auth.get("requireDocumentedHumanListeningBeforePublicPlayback") is not True
        or auth.get("modelId") != EXPECTED_MODEL
        or auth.get("voiceId") != EXPECTED_VOICE
        or auth.get("profile") != "kids_story"
        or auth.get("languageCode") != "de"
        or auth.get("globalArabicPronunciationDictionary") is not False
        or auth.get("maxPaidCalls") != 29
        or auth.get("maxTotalCharacters") != 89722
        or auth.get("batchCount") != 8
        or auth.get("maxClipsPerBatch") != 4
        or auth.get("maxCharactersPerBatch") != 18000
        or auth.get("stagingOnlyBranch") != "audio/salaf-v4-complete-review-20261028"
        or auth.get("stagingFolder") != str(STAGE_ROOT.relative_to(ROOT))
        or auth.get("planSource") != str(PLAN.relative_to(ROOT))):
        raise RuntimeError("Exact explicit owner/credit/voice/staging authorization absent")
    if (plan.get("planningOnly") is not True
        or plan.get("remainingStoryCount") != 29
        or plan.get("remainingTextCharacters") != 89722
        or plan.get("totalApprovedStories") != 33
        or len(plan.get("batches", [])) != 8):
        raise RuntimeError("Original 29-master approved inventory changed")
    if (pilot.get("storyIds") != plan["pilot"]["storyIds"]
        or pilot.get("storyIds") != list(dict.fromkeys(pilot["storyIds"]))):
        raise RuntimeError("Pilot overlap/deduplication contract changed")
    batches = [(b["batchId"], b["storyIds"]) for b in plan["batches"]]
    story_ids = [sid for _, ids in batches for sid in ids]
    if (auth.get("batchIds") != [bid for bid, _ in batches]
        or auth.get("storyIds") != story_ids
        or auth.get("blockedStoryIds") != plan.get("blockedStoryIds")
        or len(story_ids) != len(set(story_ids)) != 0
        or len(story_ids) != 29
        or set(story_ids).intersection(pilot["storyIds"])):
        raise RuntimeError("Exact 29 story IDs or pilot exclusions changed")
    items = {item["id"]: item for item in catalog["items"]}
    approved = {sid for sid, item in items.items()
                if item.get("verification") == "approved"
                and item.get("editorialRelease") is True}
    if (len(approved) != 33
        or approved != set(story_ids).union(pilot["storyIds"])
        or set(auth["blockedStoryIds"]) != set(items).difference(approved)):
        raise RuntimeError("Catalog editorial approval or exclusions changed")
    total_chars = 0
    for b in plan["batches"]:
        ids = b["storyIds"]
        if (not re.fullmatch(r"salaf-v4-pending-0[1-8]", b["batchId"])
            or not 1 <= len(ids) <= 4
            or len(ids) != b["maxClips"]):
            raise RuntimeError("Invalid bounded batch " + b["batchId"])
        chars = 0
        for sid in ids:
            item = items[sid]
            src = item["masterStoryText"]
            if (item.get("audioMaster") or len(src) > 5000
                or not 350 <= len(src.split()) <= 1000
                or ARABIC.search(src)):
                raise RuntimeError(sid + ": unsafe/previously narrated master")
            chars += len(src)
        if chars != b["totalMasterCharacters"] or chars > 18000:
            raise RuntimeError(b["batchId"] + ": character budget changed")
        total_chars += chars
    if total_chars != auth["maxTotalCharacters"]:
        raise RuntimeError("Authorized exact total cost budget changed")
    return auth, batches


def run(batch_id: str, preflight: bool) -> None:
    _, batches = audited_batch_map()
    chosen = next((ids for bid, ids in batches if bid == batch_id), None)
    if chosen is None:
        raise RuntimeError("Unknown batch " + batch_id)
    stage = STAGE_ROOT / batch_id
    # Never hide an existing billing investigation by spawning a new folder.
    if stage.exists() and (stage / "manifest.json").exists():
        existing = load(stage / "manifest.json")
        if any(entry.get("status") == "billing-investigation-required"
               for entry in existing.get("entries", {}).values()):
            raise RuntimeError("Billing-investigation-required: stop, inspect before any paid retry")
        if set(existing.get("entries", {})).difference(chosen):
            raise RuntimeError("Unexpected saved staged story in batch")
    # Build the legacy generator's required one-batch request. This temporary
    # file is never written to the public catalog or remote staging branch.
    request = {
        "authorization": EXPECTED_AUTH,
        "mode": "staging-review-only",
        "allowLivePublication": False,
        "retryPaidRequests": False,
        "storyIds": chosen,
        "maxClips": len(chosen),
        "maxTotalCharacters": 18000,
        "voiceId": EXPECTED_VOICE,
        "modelId": EXPECTED_MODEL,
        "profile": "kids_story",
    }
    spec = importlib.util.spec_from_file_location("kids_salaf_v4_original", ORIGINAL)
    if spec is None or spec.loader is None:
        raise RuntimeError("Original V4 generator unavailable")
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)
    with tempfile.TemporaryDirectory(prefix="salaf-v4-authorized-") as d:
        path = pathlib.Path(d) / "batch-request.json"
        path.write_text(json.dumps(request, ensure_ascii=False), encoding="utf-8")
        generator.REQUEST = path
        generator.STAGE = stage
        generator.MANIFEST = stage / "manifest.json"
        old_argv = sys.argv
        try:
            sys.argv = [str(ORIGINAL)] + (["--preflight"] if preflight else [])
            generator.main()
        finally:
            sys.argv = old_argv
    print(("PREFLIGHT" if preflight else "STAGED"), batch_id, len(chosen),
          "complete exact masters; NO PUBLIC AUDIO RELEASE", flush=True)


def main() -> None:
    if sys.argv[1:] == ["--all-preflight"]:
        _, batches = audited_batch_map()
        for batch_id, _ in batches:
            run(batch_id, preflight=True)
        print("ALL 8 BATCHES VERIFIED: 29 authorized stories, zero synthesis", flush=True)
        return
    if len(sys.argv) == 3 and sys.argv[1] in ("--preflight", "--batch"):
        run(sys.argv[2], preflight=sys.argv[1] == "--preflight")
        return
    raise SystemExit("Use --all-preflight or --preflight BATCHID or --batch BATCHID")


if __name__ == "__main__":
    main()
