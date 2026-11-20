#!/usr/bin/env python3
"""Generate one source-exact, resumable production queue for all 66 real Academy lessons.

This is a deterministic production planner: ZERO API calls, ZERO ElevenLabs
credits, ZERO media fabrication, ZERO public writes. It cannot turn the 142
editorial outlines into supposedly completed lesson/audio content.

After obtaining the 1784+ missing genuine V4 original media elsewhere, run
the existing file-verification/manifest/live-deploy gates. Never autoplay an
unverified TTS substitute for Qurʾān recitation.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib
import re
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
BATCH = DATA / "academy-topic-batches"
SEQUENCE = DATA / "academy-full-release-sequence-v1.json"
PUBLIC = DATA / "academy-audio.json"
QUEUE_HELPER = ROOT / "kids/tools/academy-next-topic-production-v1.py"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
AGE_GROUPS = ("4-5", "6-8", "9-10")
ARABIC_SCRIPT = re.compile(r"[\u0600-\u06FF\u0750-\u077F\ufb50-\ufdff\ufe70-\ufeff]")
TRANSCRIPTION_PITFALL = re.compile(
    r"(?:Qur[ʾ'’]?[aā]n|Sūrat?|Ṣaḥīḥ|Ḥadī[ṯt]|Sunnah|Ṣidq|Ṣiddīq|"
    r"Tawḥīd|Ḥarām|Ḥalāl|ʿIbādah|ﷺ|عليه|ﷲ|Allahumma|Salāmu|"
    r"Abū|Ḫalīfah|Ḥaǧǧ|Šahādah)",
    re.I
)


def read(p):
    return json.loads(p.read_text("utf-8"))


def helper():
    spec = importlib.util.spec_from_file_location("academyb", QUEUE_HELPER)
    if not spec or not spec.loader:
        raise RuntimeError("Source-exact Academy lesson queue helper not found")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def has_verified_audio(text, doc):
    item = (doc.get("entries") or {}).get(text)
    if not isinstance(item, dict):
        return False
    if not (
        item.get("approvedForPlayback") is True
        and item.get("voiceId") == VOICE
        and item.get("voiceProfileId") == "serhat-owner-voice-2026"
        and item.get("modelId") == "eleven_v4"
        and item.get("sourceVoice") == "authorized-owner-voice"
        and item.get("sourceSpeaker") == "Serhat Abu Malik"
    ):
        return False
    url = item.get("url")
    digest = item.get("sha256")
    if (not isinstance(url, str) or not url.startswith("/kids/assets/kids-academy-audio/")
            or "?" in url or "#" in url or ".." in url or not url.endswith(".m4a")
            or not isinstance(digest, str) or not re.fullmatch("[0-9a-f]{64}", digest)):
        return False
    path = ROOT / url.lstrip("/")
    return (path.is_file() and not path.is_symlink()
            and path.stat().st_size >= 1200
            and hashlib.sha256(path.read_bytes()).hexdigest() == digest)


def collect():
    seq = read(SEQUENCE)
    if len(seq["existingLessons"]) != 66 or len(seq["futureEditorial"]) != 142:
        raise RuntimeError("66 complete source lessons / 142 incomplete outlines drifted")
    current = read(BATCH / "release-state-v1.json")
    if current.get("currentTopic") != "sidq":
        raise RuntimeError("Unrecognized current live-release sequence")
    state = read(PUBLIC)
    source = helper()
    queue = {}
    per_lesson = []
    for lesson in seq["existingLessons"]:
        lid = lesson["lessonId"]
        phr = source.scripts_for(lid, seq)
        if not phr:
            raise RuntimeError("No speech texts for " + lid)
        per_lesson.append({
            "lessonId": lid, "editorialSlot": lesson["editorialSlot"],
            "productionOrder": lesson["productionOrder"], "ageVersions": list(AGE_GROUPS),
            "sourcePhraseCount": len(phr),
            "containsArabicTerminology": lesson["needsArabicTermSegmentation"] > 0,
        })
        for item in phr:
            text = unicodedata.normalize("NFC", item["text"])
            if not text or text != item["text"]:
                raise RuntimeError("Source text normalization drift: " + lid)
            if text not in queue:
                queue[text] = {
                    "text": text, "sha256Text": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                    "contexts": [], "sourcePlans": [], "firstLessonId": lid,
                    "kind": "quran-or-arabic-script" if ARABIC_SCRIPT.search(text)
                    else "fuṣḥā-terminology-preflight" if TRANSCRIPTION_PITFALL.search(text)
                    else "german-text",
                    "voiceId": VOICE, "modelId": "eleven_v4",
                    "alreadyRealV4InPublicRepo": has_verified_audio(text, state),
                }
            obj = queue[text]
            for ctx in item["contexts"]:
                key = (ctx.get("lessonId"), ctx.get("age"),ctx.get("kind"),ctx.get("profile"))
                if key not in {(z.get("lessonId"),z.get("age"),z.get("kind"),z.get("profile")) for z in obj["contexts"]}:
                    obj["contexts"].append(ctx)
            for name in item["sourcePlans"]:
                if name not in obj["sourcePlans"]:
                    obj["sourcePlans"].append(name)
    if per_lesson[0]["lessonId"] != "sidq" or len(queue) < 1700:
        raise RuntimeError("Academy 66-lesson voice queue unexpectedly incomplete")
    pending = [x for x in queue.values() if not x["alreadyRealV4InPublicRepo"]]
    complete = [x for x in queue.values() if x["alreadyRealV4InPublicRepo"]]
    if len(complete) < 58:
        raise RuntimeError("Prepared 58 real Ṣidq media unexpectedly missing")
    return {
        "schemaVersion": 1, "id": "TAWHID_KIDS_ACADEMY_66_LESSONS_ONE_PRODUCTION_QUEUE",
        "scope": {
            "sourceBackedLessons": len(per_lesson), "separateAgeVersions": len(AGE_GROUPS),
            "futureEditorialLessonsNotProductionReady": len(seq["futureEditorial"]),
            "voiceId": VOICE, "modelId": "eleven_v4",
        },
        "totals": {
            "distinctSourceUtterances": len(queue), "realVerifiedM4aAlreadyInRepo": len(complete),
            "exactUtterancesMissingRealMedia": len(pending),
            "missingTextCharacters": sum(len(x["text"]) for x in pending),
            "needsFushaTerminologyAudit": sum(x["kind"] != "german-text" for x in pending),
            "germanTextCandidateCount": sum(x["kind"] == "german-text" for x in pending),
        },
        "safety": {
            "noNewAudioGenerated": True, "noTtsCreditsCharged": True,
            "noSyntheticQuranRecitation": True, "neverBillExistingVerifiedMedia": True,
            "noPrivateTokensOrSignedMediaURLs": True,
            "noFalseKidsStorySpeedStyleOrPrivatePlsClaims": True,
            "noUnreviewedEditorialOutlinesInChildrenApp": True,
            "userAuthorizedBulkGenerationAndDirectRelease": True,
            "automaticRealMediaHashAndSourceChecksRequiredBeforeLive": True,
            "productionOrderDoesNotImplyPublication": True,
        },
        "lessons": per_lesson,
        "missingMediaTextQueue": pending,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--export", type=pathlib.Path)
    args = parser.parse_args()
    if args.status == bool(args.export):
        parser.error("Choose exactly --status or --export PATH")
    payload = collect()
    data = {k: v for k, v in payload.items() if k != "missingMediaTextQueue"}
    if args.status:
        print(json.dumps(data, ensure_ascii=False))
        return
    allowed = (BATCH / "production-queues" / "academy-all-66-source-exact-v1.json").resolve()
    output = args.export.resolve()
    if output != allowed:
        raise RuntimeError("Bulk queue export restricted to canonical production-queues path")
    output.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if output.exists() and output.read_text("utf-8") != encoded:
        # A new voice plan or verified media import changed the content:
        # require review of the diff instead of silently overwriting.
        raise RuntimeError("Existing bulk queue differs; review source-plan/media drift")
    output.write_text(encoded, "utf-8")
    data["queuePath"] = output.relative_to(ROOT).as_posix()
    print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
