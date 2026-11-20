#!/usr/bin/env python3
"""Import 76 *real* Serhat V4 audio originals and prepare a complete Ṣidq release.

The owner authorized generation and publication without a separate listening
signoff. This script verifies genuine media and provenance, but does not pretend
to have listened. NO NETWORK ACCESS, NO TTS CREDIT CHARGES, NO SYNTHETIC FILES.

Run in a connected Work/CI environment with original ElevenLabs MP3s named
<generationId>.mp3 in --source-dir. Each must be downloaded directly from the
existing ElevenLabs canvas (flow zrB4zGdz9OTndLryQtIB), not re-generated.

--dry-run checks references and completeness without moving any files.
--import converts originals, stitches native Fuṣḥā segments, verifies all 58
canonical Ṣidq audio keys, prepares one atomic public audio manifest update.
Git commit/merge + Cloudflare deployment + real-app playback must STILL happen.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
DIR = ROOT / "kids/data/academy-topic-batches"
MEDIA = ROOT / "kids/assets/kids-academy-audio"
PUBLIC = ROOT / "kids/data/academy-audio.json"
STAGING = ROOT / "kids/data/academy-audio-staging-v9.json"
RELEASE = DIR / "release-state-v1.json"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
FLOW = "zrB4zGdz9OTndLryQtIB"
SOURCE_BATCHES = [
    "akhlaq-sidq-elevenlabs-v4-generations-b01.json",
    "akhlaq-sidq-elevenlabs-v4-generations-b02.json",
    "akhlaq-sidq-elevenlabs-v4-generations-b03.json",
    "akhlaq-sidq-elevenlabs-v4-generations-b04.json",
    "akhlaq-sidq-de-fragments-b05.json",
    "akhlaq-sidq-de-fragments-b06.json",
]
ARABIC_BATCH = "akhlaq-sidq-fusha-term-audio-v1.json"
SEGMENTS = "akhlaq-sidq-de-ar-segments-v1.json"
CANONICAL_SALAM = "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."


def load(path):
    return json.loads(path.read_text("utf-8"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True
    ).strip())


def source_inventory():
    canonical = load(ROOT / "kids/data/academy-sidq-voice-plan-v18.json")
    salam = load(ROOT / "kids/data/academy-full-salam-voice-plan-v19.json")
    if canonical.get("lessonId") != "sidq":
        raise RuntimeError("Not Ṣidq canonical source")
    source = {
        x["text"] for x in canonical["phrases"]
        if not x["text"].startswith("As-salāmu ʿalaykum, ")
    } | {x["text"] for x in salam["phrases"]}
    if len(source) != 58 or CANONICAL_SALAM not in source:
        raise RuntimeError("Exact canonical 58-phrase inventory changed")

    originals = {}
    for name in SOURCE_BATCHES:
        block = load(DIR / name)
        if block.get("voiceId") != VOICE or block.get("flowId", block.get("generationFlowId")) != FLOW:
            raise RuntimeError("Wrong voice or flow in " + name)
        if block.get("modelId") != "eleven_v4":
            raise RuntimeError("Model not V4 in " + name)
        for x in block["entries"]:
            if x.get("status", x.get("generationStatus")) != "completed":
                raise RuntimeError("Incomplete generation in " + name)
            x = {**x, "language": "de"}
            if x["generationId"] in originals:
                raise RuntimeError("Duplicated billable generation ID")
            originals[x["generationId"]] = x
    ar = load(DIR / ARABIC_BATCH)
    if (ar.get("voiceId") != VOICE or ar.get("modelId") != "eleven_v4"
            or ar.get("flowId") != FLOW):
        raise RuntimeError("Unexpected Arabic master voice")
    arabic_by_key = {}
    for x in ar["entries"]:
        if x.get("status") != "completed" or x["key"] in arabic_by_key:
            raise RuntimeError("Bad or repeated Arabic Fuṣḥā clip")
        arabic_by_key[x["key"]] = x
        if x["generationId"] in originals:
            raise RuntimeError("Arabic generation ID collides with German source")
        originals[x["generationId"]] = {**x, "language": "ar", "text": x["arabic"]}
    if len(arabic_by_key) != 9:
        raise RuntimeError("Expected 8 Arabic terms plus full Salām")
    if len(originals) != 76:
        raise RuntimeError(f"Expected 76 actual generation IDs; found {len(originals)}")

    hybrid = load(DIR / SEGMENTS)
    hybrid_text = {x["visibleText"] for x in hybrid["entries"]}
    if len(hybrid_text) != 9 or not hybrid_text.issubset(source):
        raise RuntimeError("Mixed German/Arabic phrases differ from canonical plan")
    complete_direct = {
        x["text"]: x for x in originals.values()
        if x["language"] == "de" and x["text"] in source
    }
    if len(complete_direct) != 45:
        raise RuntimeError(f"Expected 45 single-track German phrases, got {len(complete_direct)}")
    if set(complete_direct) & hybrid_text:
        raise RuntimeError("Ambiguous complete/mixed text")
    if CANONICAL_SALAM in complete_direct:
        raise RuntimeError("The full Arabic Salām cannot use a German narration")
    used_parts = set()
    for phrase in hybrid["entries"]:
        for seg in phrase["spokenSegments"]:
            if seg["language"] == "ar":
                if seg["termKey"] not in arabic_by_key:
                    raise RuntimeError("Missing Fuṣḥā word master " + seg["termKey"])
                used_parts.add(arabic_by_key[seg["termKey"]]["generationId"])
            elif seg["language"] == "de":
                parts = [x for x in originals.values()
                         if x["language"] == "de" and x["text"] == seg["text"]]
                if len(parts) != 1:
                    raise RuntimeError("Missing or duplicated German fragment: " + seg["text"])
                used_parts.add(parts[0]["generationId"])
            else:
                raise RuntimeError("Unexpected language")
    if len(used_parts) != 29:
        # 22 German fragments + 7 used Arabic terms; one full Salam is separate,
        # and additional Arabic standalones may be maintained for reuse.
        raise RuntimeError("Unexpected number of unique reusable bilingual segments")
    archive = load(STAGING)
    reuse = {}
    for key, clip in archive["entries"].items():
        if (clip.get("deprecatedForPlayback") is not True
                and key in source
                and clip.get("voiceId") == VOICE
                and clip.get("modelId") == "eleven_v4"):
            reuse[key] = clip
    if len(reuse) != 3:
        raise RuntimeError("Three canonical old V4 pilots must be reused exactly")
    if set(reuse) & (set(complete_direct) | hybrid_text | {CANONICAL_SALAM}):
        raise RuntimeError("A paid generation duplicates a reusable old pilot")
    covered = set(reuse) | set(complete_direct) | hybrid_text | {CANONICAL_SALAM}
    if covered != source:
        raise RuntimeError(f"Missing canonical texts: {sorted(source - covered)}")
    return source, originals, complete_direct, reuse, hybrid["entries"], arabic_by_key


def transcode(src, dest):
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-i", str(src), "-vn", "-c:a", "aac", "-b:a", "128k",
        "-ar", "44100", "-ac", "1", str(dest),
    ], check=True)
    if not dest.exists() or dest.stat().st_size < 1200:
        raise RuntimeError("Real transcoded AAC audio missing")
    dur = duration(dest)
    if not .35 <= dur <= 100:
        raise RuntimeError("Invalid media duration")


def join_audio(parts, output):
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y"]
    for part in parts:
        args += ["-i", str(part)]
    filter_expr = "".join(f"[{n}:a]" for n in range(len(parts)))
    filter_expr += f"concat=n={len(parts)}:v=0:a=1[out]"
    args += ["-filter_complex", filter_expr, "-map", "[out]",
             "-ar", "44100", "-ac", "1", "-c:a", "aac", "-b:a", "128k", str(output)]
    subprocess.run(args, check=True)
    if not output.exists() or output.stat().st_size < 1800:
        raise RuntimeError("Unable to assemble native Fuṣḥā + German audio")


def public_entry(file, spoken, source_type, generation_ids, arabic=False, original=None):
    info = {
        "url": "/" + file.relative_to(ROOT).as_posix(),
        "sha256": sha(file),
        "durationSeconds": round(duration(file), 3),
        "voiceId": VOICE,
        "voiceProfileId": "serhat-owner-voice-2026",
        "voiceSettingsProfile": "kids_story",
        "modelId": "eleven_v4",
        "sourceVoice": "authorized-owner-voice",
        "sourceSpeaker": "Serhat Abu Malik",
        "sourceType": source_type,
        "sourceLessonId": "sidq",
        "sourceSubject": "akhlaq",
        "spokenText": spoken,
        "sourceGenerationIds": generation_ids,
        "qaStatus": "owner-authorized-automated-technical-audit",
        "actualCreativeVoiceSettings": {"stability": 0.62, "similarity": 0.88},
        "creativeV4SpeedStyleNotAvailable": True,
        "arabicSegmentsNative": arabic,
        "approvedForPlayback": True,
    }
    if original:
        info.update({
            "sourceType": "prior-V4-owner-pilot-reused-exact",
            "actualCreativeVoiceSettings": None,
            "creativeV4SpeedStyleNotAvailable": None,
        })
    return info


def verify_official_import_receipts(src_dir, originals):
    """Do not use arbitrary files renamed to generationId.mp3 as genuine media.

    An independent signed-URL downloader has validated workspace/session/ID,
    written an unsigned SHA-256 ledger and kept private URLs outside Git.
    This function checks those hashes before any public manifest mutation.
    """
    ledger_path = src_dir / "_official-originals-sha256.json"
    if not ledger_path.is_file() or ledger_path.is_symlink():
        raise RuntimeError("Official signed-originals SHA ledger missing; no release")
    ledger = load(ledger_path)
    if (ledger.get("schemaVersion") != 1
            or ledger.get("topic") != "akhlaq/sidq"
            or ledger.get("flowId") != FLOW
            or ledger.get("origin") != "original-elevenlabs-creative-signed-audio-get"
            or ledger.get("newTtsGenerations") != 0):
        raise RuntimeError("Invalid source-original import provenance")
    entries = ledger.get("entries")
    if not isinstance(entries, dict) or set(entries) != set(originals):
        raise RuntimeError("Source MP3 original SHA ledger must cover all 76 generations")
    for gid, generation in originals.items():
        entry = entries[gid]
        file = src_dir / (gid + ".mp3")
        if file.is_symlink() or not file.is_file():
            raise RuntimeError("No symlink or missing MP3 permitted in secure import")
        if entry.get("sessionId") != generation["sessionId"]:
            raise RuntimeError("Audio original session mismatch: " + gid)
        digest = entry.get("sha256")
        if (not isinstance(digest, str) or len(digest) != 64
                or sha(file) != digest):
            raise RuntimeError("Audio bytes differ from official signed original: " + gid)
        if entry.get("bytes") != file.stat().st_size:
            raise RuntimeError("Original MP3 byte count mismatch: " + gid)
        try:
            delta = abs(duration(file) - float(entry.get("durationSeconds")))
        except (ValueError, TypeError):
            raise RuntimeError("Missing original media duration in SHA ledger") from None
        if delta > 0.10:
            raise RuntimeError("Original MP3 changed duration since signed download")
    return True


def import_publish(src_dir):
    sources, originals, direct, reused, mixed, ar = source_inventory()
    # Require all actual 76 originals BEFORE any asset or public manifest writes.
    missing = [str(src_dir / (gid + ".mp3"))
               for gid in originals if not (src_dir / (gid + ".mp3")).is_file()]
    if missing:
        raise RuntimeError("No import; actual original MP3 files missing: " +
                           ", ".join(missing[:6]) + f" (total {len(missing)})")
    for gid in originals:
        path = src_dir / (gid + ".mp3")
        if path.stat().st_size < 1200 or not .35 <= duration(path) <= 100:
            raise RuntimeError("Invalid original paid ElevenLabs clip: " + path.name)
    verify_official_import_receipts(src_dir, originals)
    for text, clip in reused.items():
        path = ROOT / clip["url"].lstrip("/")
        if not path.is_file() or sha(path) != clip["sha256"]:
            raise RuntimeError("Historical certified reused Serhat original missing: " + text)
    MEDIA.mkdir(parents=True, exist_ok=True)
    file_by_id = {}
    for gid, entry in originals.items():
        target = MEDIA / (hashlib.sha256(("sidq\0" + gid).encode()).hexdigest()[:20] + ".m4a")
        if target.exists():
            if target.stat().st_size < 1200 or not .35 <= duration(target) <= 100:
                raise RuntimeError("Cached transcoded asset is corrupted")
        else:
            transcode(src_dir / (gid + ".mp3"), target)
        file_by_id[gid] = target

    full = {}
    for text, entry in direct.items():
        gid = entry["generationId"]
        full[text] = public_entry(file_by_id[gid], text, "owner-V4-creative-german", [gid])
    salam_id = ar["full_salam"]["generationId"]
    full[CANONICAL_SALAM] = public_entry(
        file_by_id[salam_id], ar["full_salam"]["arabic"],
        "owner-V4-creative-arabic-fusha", [salam_id], arabic=True
    )
    for item in mixed:
        parts = []
        ids = []
        for fragment in item["spokenSegments"]:
            if fragment["language"] == "ar":
                gid = ar[fragment["termKey"]]["generationId"]
            else:
                gid = next(x["generationId"] for x in originals.values()
                           if x["language"] == "de" and x["text"] == fragment["text"])
            parts.append(file_by_id[gid])
            ids.append(gid)
        target = MEDIA / (hashlib.sha256(("sidq-assembled\0" + item["visibleText"]).encode()).hexdigest()[:20] + ".m4a")
        if not target.exists():
            join_audio(parts, target)
        full[item["visibleText"]] = public_entry(
            target, item["visibleText"], "owner-V4-creative-bilingual-assembled", ids,
            arabic=True
        )
    for text, old in reused.items():
        source_file = ROOT / old["url"].lstrip("/")
        full[text] = public_entry(
            source_file, text, "previous-owner-V4-pilot", [], original=old
        )
    if set(full) != sources or len(full) != 58:
        raise RuntimeError("Internal error: release is not 58/58 complete")
    for key, entry in full.items():
        file = ROOT / entry["url"].lstrip("/")
        if sha(file) != entry["sha256"] or not .35 <= duration(file) <= 120:
            raise RuntimeError("SHA mismatch or nonplayable assembled audio: " + key)
    doc = load(PUBLIC)
    if doc.get("id") != "KIDS_ACADEMY_SERHAT_MASTER_V1":
        raise RuntimeError("Unrecognized live audio manifest")
    doc["entries"] = {**doc.get("entries", {}), **full}
    doc["manualReviewNote"] = (
        "The owner authorized generation and direct publication without manual "
        "prelisten. 58 Ṣidq entries passed source/voice/media/hash automated checks. "
        "No false claim of acoustic human signoff."
    )
    tmp = PUBLIC.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", "utf-8")
    tmp.replace(PUBLIC)
    release = load(RELEASE)
    release["status"] = "prepared-for-live-deployment"
    release["expectedCount"] = 58
    release["fullyCertifiedCount"] = 58
    release["ownerAuthorizedNoListeningPrecheck"] = True
    release["liveConfirmed"] = False
    release["nextTopicLocked"] = True
    tmp = RELEASE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(release, ensure_ascii=False, indent=2) + "\n", "utf-8")
    tmp.replace(RELEASE)
    print("COMPLETE: Ṣidq 58/58 real Serhat V4 entries prepared. "
          "Commit assets+manifest, merge in main, deploy Cloudflare and check production. "
          "No deployment occurred from this local script.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--import", dest="do_import", action="store_true")
    parser.add_argument("--source-dir", type=pathlib.Path)
    args = parser.parse_args()
    if args.dry_run == args.do_import:
        parser.error("Choose exactly --dry-run or --import")
    if args.dry_run:
        src, orig, direct, reuse, mixed, ar = source_inventory()
        print(json.dumps({
            "subject": "akhlaq", "lesson": "sidq", "canonicalPhrases": len(src),
            "reusedPriorV4": len(reuse), "directV4": len(direct),
            "mixedSentenceAssemblies": len(mixed), "nativeArabicTerms": len(ar),
            "originalGenerationFilesRequired": len(orig),
            "needsActualBinaryFiles": True, "live": False,
        }, ensure_ascii=False))
        return
    if not args.source_dir:
        parser.error("--source-dir required for --import")
    import_publish(args.source_dir)


if __name__ == "__main__":
    main()
