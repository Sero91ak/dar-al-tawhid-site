#!/usr/bin/env python3
"""Zero-credit, no-network queue for the complete 208-slot Kids Academy.

Select ONE existing, source-backed topic at a time; gather all exact Serhat V4
scripts and deduplicate repeated phrases without ever generating/releasing
audio. The 142 editorial-only future topics remain strictly locked.

Next topics unlock only when the last live release has its actual verified
production commit, timestamp and a local live receipt. No guesswork.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
BATCH = DATA / "academy-topic-batches"
ROSTER = DATA / "academy-full-release-sequence-v1.json"
RELEASE = BATCH / "release-state-v1.json"
HISTORY = BATCH / "academy-topic-live-history-v1.json"
VOICE_ID = "DkU7j9uO4ZEtLD2iRZSH"
PLAN_NAMES = [
    "academy-voice-plan-v9.json",
    "academy-sidq-voice-plan-v18.json",
    "academy-voice-plan-v22.json",
    "academy-voice-plan-v25.json",
    "academy-voice-plan-v26.json",
    "academy-voice-plan-v27.json",
    "academy-voice-plan-v28.json",
    "academy-voice-plan-v29.json",
    "academy-vocabulary-voice-plan-v24.json",
]
EXPECTED_AGES = {"4-5", "6-8", "9-10"}


def load(file):
    return json.loads(file.read_text("utf-8"))


def scripts_for(lesson_id, roster):
    combined = {}
    relevant = [
        DATA / name
        for name in PLAN_NAMES
        if (DATA / name).is_file()
    ]
    for plan_path in relevant:
        plan = load(plan_path)
        if (plan.get("voiceProfileId") != "serhat-owner-voice-2026"
            or plan.get("modelId") != "eleven_v4"):
            raise RuntimeError("Unknown master voice policy in " + plan_path.name)
        if plan.get("phraseCount") != len(plan.get("phrases", [])):
            raise RuntimeError("Drifted source text plan " + plan_path.name)
        for item in plan["phrases"]:
            contexts = [ctx for ctx in item.get("contexts", [])
                        if ctx.get("lessonId") == lesson_id]
            if not contexts:
                continue
            text = item["text"]
            if not isinstance(text, str) or not text.strip() or text != text.strip():
                raise RuntimeError("Invalid exact speech text")
            if text not in combined:
                combined[text] = {
                    "text": text, "contexts": [], "sourcePlans": [],
                    "voiceId": VOICE_ID, "modelId": "eleven_v4",
                    "language": "de", "realAudioGenerated": False,
                    "realAudioBytesImported": False, "approvedForPlayback": False,
                }
            entry = combined[text]
            for ctx in contexts:
                if ctx not in entry["contexts"]:
                    entry["contexts"].append(ctx)
            if plan_path.name not in entry["sourcePlans"]:
                entry["sourcePlans"].append(plan_path.name)
    if lesson_id == "sidq":
        # Existing source includes two obsolete short greeting variants.
        # Canonical full Salam and both child profile addresses are instead
        # exclusively owned by the official full-Salam voice-plan-v19.
        for text in list(combined):
            if text.startswith("As-salāmu ʿalaykum, "):
                del combined[text]
        salam = load(DATA / "academy-full-salam-voice-plan-v19.json")
        for item in salam["phrases"]:
            text = item["text"]
            if text in combined:
                raise RuntimeError("Duplicate canonical full Salām")
            combined[text] = {
                "text": text, "contexts": item["contexts"],
                "sourcePlans": ["academy-full-salam-voice-plan-v19.json"],
                "voiceId": VOICE_ID, "modelId": "eleven_v4",
                "language": "ar" if text.startswith("As-Salāmu ") else "de",
                "realAudioGenerated": False, "realAudioBytesImported": False,
                "approvedForPlayback": False,
            }
        if len(combined) != 58:
            raise RuntimeError("Ṣidq must have exactly 58 canonical keys; found " +
                               str(len(combined)))
    if not combined:
        raise RuntimeError("No exact voice plan for " + lesson_id)
    return list(combined.values())


def approved_live_history():
    state = load(HISTORY)
    if state.get("schemaVersion") != 1 or state.get("topicReleaseOrder") != []:
        # A future populated history is allowed only if every entry is a fully
        # verifiable receipt, not a claimed future release.
        if state.get("schemaVersion") != 1 or not isinstance(
            state.get("topicReleaseOrder"), list
        ):
            raise RuntimeError("Unexpected publication history schema")
    return state["topicReleaseOrder"]


def select_topic(roster):
    lessons = roster["existingLessons"]
    if len(lessons) != 66 or roster["summary"]["additionalEditorialOutlinesNotYetInApp"] != 142:
        raise RuntimeError("208-slot roadmap changed unexpectedly")
    history = approved_live_history()
    ids = [x["lessonId"] for x in lessons]
    seen = set()
    if len(history) > len(ids):
        raise RuntimeError("Release history exceeds 66 actual curriculum topics")
    for n, row in enumerate(history):
        if not isinstance(row, dict) or row.get("lessonId") != ids[n]:
            raise RuntimeError("No skipped, reordered or duplicated topic releases permitted")
        if row["lessonId"] in seen:
            raise RuntimeError("Repeated live release history")
        seen.add(row["lessonId"])
        if not (
            row.get("liveConfirmed") is True and row.get("cloudflareLiveVerified") is True
            and isinstance(row.get("liveCommit"), str)
            and len(row["liveCommit"]) == 40
            and all(c in "0123456789abcdef" for c in row["liveCommit"])
            and row.get("allThreeAgeGroupsVerified") is True
            and row.get("bothProfilesVerified") is True
        ):
            raise RuntimeError("Topic cannot advance without real deployment receipt")
        try:
            dt.datetime.fromisoformat(row["verifiedAt"].replace("Z", "+00:00"))
        except (KeyError, ValueError, AttributeError) as exc:
            raise RuntimeError("Invalid live verified timestamp") from exc
    if len(history) >= len(ids):
        return None, history
    current = lessons[len(history)]
    if len(history) == 0:
        first = load(RELEASE)
        if (first.get("currentTopic") != "sidq" or
                first.get("liveConfirmed") is True or
                first.get("nextTopicLocked") is not True):
            raise RuntimeError("First-topic lock or production state mismatch")
    return current, history


def summarize(topic):
    rows = scripts_for(topic["lessonId"], None)
    by_age = {age: 0 for age in sorted(EXPECTED_AGES)}
    kinds = {}
    for row in rows:
        for ctx in row["contexts"]:
            age = ctx.get("age")
            if age in by_age:
                by_age[age] += 1
            kind = ctx.get("kind")
            if kind:
                kinds[kind] = kinds.get(kind, 0) + 1
    if any(count < 1 for count in by_age.values()):
        raise RuntimeError("Selected topic lacks separate source context for all three ages")
    return {
        "schemaVersion": 1, "lessonId": topic["lessonId"],
        "productionOrder": topic["productionOrder"], "sourceLessonSlot": topic["editorialSlot"],
        "voiceId": VOICE_ID, "modelId": "eleven_v4",
        "exactUniquePhrases": len(rows), "contextCountsByAge": by_age,
        "contextsByKind": kinds, "termsRequireFushaSegmentation": topic["needsArabicTermSegmentation"],
        "nativeQuranRecitationOnly": True, "existingFushaLibraryMustBeAppliedWhenSupported": True,
        "playbackNeedsRealMediaBytes": True, "ownerAuthorizedNoPreview": True,
        "publicLive": False, "newCreditsChargedByThisScript": 0,
        "phrases": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--status", action="store_true")
    group.add_argument("--queue", action="store_true")
    group.add_argument("--audit-all", action="store_true")
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    roster = load(ROSTER)
    if args.audit_all:
        if len(roster.get("existingLessons", [])) != 66 or len(roster.get("futureEditorial", [])) != 142:
            raise RuntimeError("Expected 66 real source lessons plus 142 future outlines")
        all_rows = [summarize(x) for x in roster["existingLessons"]]
        if len({x["lessonId"] for x in all_rows}) != 66:
            raise RuntimeError("Duplicate lesson in release roster")
        print(json.dumps({
            "curriculumLessonCount": len(all_rows),
            "sourceBackedLessonCount": sum(x["exactUniquePhrases"] > 0 for x in all_rows),
            "sourceExactPhraseAssociations": sum(x["exactUniquePhrases"] for x in all_rows),
            "firstLessonId": all_rows[0]["lessonId"],
            "firstLessonExactPhrases": all_rows[0]["exactUniquePhrases"],
            "lastLessonId": all_rows[-1]["lessonId"],
            "additionalEditorialOutlinesLocked": len(roster["futureEditorial"]),
            "autoPublishes": False, "newTtsCreditsCharged": 0,
        }, ensure_ascii=False))
        return
    next_topic, history = select_topic(roster)
    if next_topic is None:
        print(json.dumps({
            "all66ExistingLessonsReleased": True, "futureEditorialOutlinesLocked": 142,
            "noAudioGeneration": True,
        }))
        return
    summary = summarize(next_topic)
    compact = {
        k: v for k, v in summary.items() if k != "phrases"
    }
    compact.update({
        "completedPriorTopicReleases": len(history),
        "remainingExistingTopicsIncludingCurrent": 66 - len(history),
        "futureEditorialOutlinesLocked": 142,
    })
    if args.queue:
        if args.output is None:
            raise RuntimeError("--queue requires --output to avoid stdout leaking unreviewed corpus")
        target = args.output.resolve()
        designated = (BATCH / "production-queues").resolve()
        if target.parent != designated or target.suffix != ".json":
            raise RuntimeError("Queue output restricted to dedicated production-queues/*.json")
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(summary, ensure_ascii=False, indent=2) + "\\n"
        if target.exists() and target.read_text("utf-8") != payload:
            raise RuntimeError("Existing topic queue differs; refuse destructive overwrite")
        target.write_text(payload, "utf-8")
        compact["output"] = target.relative_to(ROOT).as_posix()
    print(json.dumps(compact, ensure_ascii=False))


if __name__ == "__main__":
    main()
