#!/usr/bin/env python3
"""Deduplicate unpaid V4 speech fragments for 450 selected KIDS quiz questions.

The queue is only a READ-ONLY production REVIEW, not a paid ElevenLabs job.
Previously paid unrecovered recordings are a separate recovery dependency,
never silently re-generated. All remaining voice work is cross-age deduped
by exact speech text + voice + model and tied to stable question IDs.
"""
from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
ORIGINALS_MISSING = ROOT / "kids/data/quiz-v4-missing9-prepaid-originals.json"
RELEASE = ROOT / "kids/data/quiz-curation-release.json"
OUTPUT = ROOT / "kids/review-only/quiz-v4-450-deduplicated-unrecorded-originals.json"
MODEL = "eleven_v4"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
PARTS = ("question", "correct", "retry", "explanation")
BANDS = ("4-6", "7-8", "9-10")


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def main():
    plan, saved, recover, release = map(load, (PLAN, REGISTRY, ORIGINALS_MISSING, RELEASE))
    require(release.get("enabled") is False, "A paid production queue requires live release disabled")
    require(plan.get("voiceId") == VOICE and plan.get("modelId") == MODEL and
            saved.get("voiceId") == VOICE and saved.get("modelId") == MODEL and
            saved.get("live") is False, "Original source voice/model contract changed")
    recipes = plan.get("recipes", [])
    require(len(recipes) == 450 and len({q["questionId"] for q in recipes}) == 450,
            "Must have exactly 450 curated stable question IDs")
    for band in BANDS:
        require(sum(x["ageBand"] == band for x in recipes) == 150,
                "Wrong number of curated questions for age group")
    paid = saved["generationClips"]
    recorded = saved["textClips"]
    missing9 = {item["generationId"]: item for item in recover["items"]}
    require(len(missing9) == 9 and recover["missingOriginalCount"] == 9,
            "Known original ElevenLabs Flow generation receipt list changed")
    pending_paid = {gid: item for gid, item in missing9.items() if gid not in paid}

    future = defaultdict(lambda: {"ages": set(), "usage": [], "fieldKinds": set()})
    recover_dependent = defaultdict(list)
    seen = set()
    for q in recipes:
        for part in PARTS:
            item = q[part]
            if item["mode"] == "existing-paid-exact":
                gid = item["generationId"]
                if gid in paid:
                    continue
                require(gid in pending_paid, "Unknown paid generation must never be regenerated blindly")
                recover_dependent[gid].append({"questionId": q["questionId"],
                                                "ageBand": q["ageBand"], "part": part})
            elif item["mode"] == "compose-from-segments":
                segments = item.get("segments", [])
                require(bool(segments) and " ".join(segments) == item["text"],
                        "Broken exact spoken text contract")
                for i, segment in enumerate(segments):
                    if segment in recorded:
                        continue
                    historic = [id for id, p in pending_paid.items()
                                if p["originalSpokenText"] == segment]
                    if historic:
                        for gid in historic:
                            recover_dependent[gid].append({
                                "questionId": q["questionId"], "ageBand": q["ageBand"],
                                "part": part, "fragmentIndex": i,
                            })
                        continue
                    key = (VOICE, MODEL, segment)
                    require(key not in seen or segment in future,
                            "Inconsistent V4 deduplication state")
                    seen.add(key)
                    fragment = future[segment]
                    fragment["ages"].add(q["ageBand"])
                    fragment["fieldKinds"].add(part)
                    fragment["usage"].append({
                        "questionId": q["questionId"], "ageBand": q["ageBand"],
                        "part": part, "fragmentIndex": i,
                    })
            else:
                raise RuntimeError("Unexpected audio composition mode")

    fragments = [
        {
            "text": spoken,
            "textSha256": sha(spoken),
            "modelId": MODEL,
            "voiceId": VOICE,
            "unicodeCodepoints": len(spoken),
            "neededByAgeBands": sorted(data["ages"]),
            "fieldKinds": sorted(data["fieldKinds"]),
            "reuseCount": len(data["usage"]),
            "usedBy": sorted(data["usage"],
                             key=lambda x: (x["ageBand"], x["questionId"], x["part"], x["fragmentIndex"])),
            "originalMp3Ready": False,
            "source": "unrecorded-verified-against-existing-sha-registry",
            "paidSynthesisAuthorized": False,
            "humanListeningApproved": False,
        }
        for spoken, data in future.items()
    ]
    # First, more widely reused audio; shorter phrases after reuse count.
    # This is a *review* order, never an instruction to spend credits.
    fragments.sort(key=lambda f: (-f["reuseCount"], f["unicodeCodepoints"], f["textSha256"]))
    cross_age = sum(len(item["neededByAgeBands"]) > 1 for item in fragments)
    details = [
        {
            "generationId": gid,
            "originalFileName": missing9[gid]["originalFileName"],
            "previouslyPaid": True,
            "mustDownloadOriginalNotRegenerate": True,
            "usageCount": len(recover_dependent[gid]),
            "usedBy": recover_dependent[gid],
        }
        for gid in sorted(pending_paid)
    ]
    require(len(fragments) == len({f["textSha256"] for f in fragments}),
            "Different fragments unexpectedly have the same SHA256 hash")
    require(all(f["voiceId"] == VOICE and f["modelId"] == MODEL for f in fragments),
            "A production item has the wrong owner voice")

    report = {
        "schemaVersion": 1,
        "scope": "KIDS_V4_450_MISSING_FRAGMENTS_CROSS_AGE_REVIEW_ONLY",
        "selectedQuestions": 450, "retainedReserveQuestions": 450,
        "modelId": MODEL, "voiceId": VOICE,
        "newPaidSynthesesLaunched": 0,
        "creditsSpentByThisPlanner": 0,
        "paidGenerationAuthorized": False,
        "allAudioHumanApproved": False,
        "publicReleaseAllowed": False,
        "alreadyRecordedDistinctSpokenSegments": len(recorded),
        "separatePreviouslyPaidOriginalsToRecover": len(pending_paid),
        "uniqueUnrecordedSegmentsAfterCrossAgeDedup": len(fragments),
        "unrecordedUnicodeCodepoints": sum(f["unicodeCodepoints"] for f in fragments),
        "unrecordedFragmentAssignmentsBeforeDedup": sum(f["reuseCount"] for f in fragments),
        "fragmentsSharedAcrossMultipleAgeBands": cross_age,
        "providerCreditsForecast": None,
        "providerCreditsForecastStatus": "not-confirmed-actual-provider-billing-differs-from-codepoint-count",
        "requiredPrepaidOriginalRecovery": details,
        "pendingUniqueFragments": fragments,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PASS_KIDS_V4_450_ZERO_CREDIT_DEDUPED_REVIEW_QUEUE " + json.dumps({
        key: report[key] for key in (
            "selectedQuestions", "separatePreviouslyPaidOriginalsToRecover",
            "uniqueUnrecordedSegmentsAfterCrossAgeDedup",
            "unrecordedUnicodeCodepoints",
            "unrecordedFragmentAssignmentsBeforeDedup",
            "fragmentsSharedAcrossMultipleAgeBands",
            "creditsSpentByThisPlanner", "paidGenerationAuthorized",
            "publicReleaseAllowed"
        )
    }), flush=True)


if __name__ == "__main__":
    main()
