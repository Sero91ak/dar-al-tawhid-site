#!/usr/bin/env python3
"""Import EXACT 14 already-rendered Serhat V4 Ṣidq click-to-hear gaps.

Pure offline media assembly; zero ElevenLabs calls and zero credits.
Never claim Cloudflare/iOS delivery here. The importer requires real, already
paid MP3 originals with filenames <generationId>.mp3, including the older
Salawat original GBmSBMXAo9AwPA58e87w.mp3. Download them separately with
authenticated, short-lived provider URLs in a connected Work environment.

Usage:
  python3 kids/tools/import-academy-sidq-click-gaps-v1.py --dry-run
  python3 kids/tools/import-academy-sidq-click-gaps-v1.py --import \
    --source-dir /private/original-mp3-files
"""
from __future__ import annotations
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
TOPIC = ROOT / "kids/data/academy-topic-batches"
PLAN = TOPIC / "akhlaq-sidq-14-missing-real-v4-plan-v1.json"
GAPS = TOPIC / "akhlaq-sidq-visible-click-gaps-v1.json"
VOCAB = ROOT / "kids/data/academy-vocabulary-voice-plan-v24.json"
PUBLIC = ROOT / "kids/data/academy-audio.json"
MEDIA = ROOT / "kids/assets/kids-academy-audio"
OWNER = "DkU7j9uO4ZEtLD2iRZSH"
FLOW = "zrB4zGdz9OTndLryQtIB"
SALAWAT = "GBmSBMXAo9AwPA58e87w"
GENERATION_ID = re.compile(r"^[A-Za-z0-9_-]{12,40}$")
CHILD_GAP_COUNT = 14
NEW_ORIGINALS = 20


def load(path):
    return json.loads(path.read_text("utf-8"))


def sha(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf-8")
    tmp.replace(path)


def ffprobe(path, codec):
    run = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=codec_name:format=duration", "-of", "json",
         str(path)], check=True, capture_output=True, text=True
    )
    doc = json.loads(run.stdout)
    tracks = doc.get("streams") or []
    duration = float(doc["format"]["duration"])
    if len(tracks) != 1 or tracks[0].get("codec_name") != codec:
        raise ValueError("Wrong codec/track count: " + path.name)
    if not (.35 <= duration <= 120):
        raise ValueError("Unreasonable duration: " + path.name)
    if not (1200 <= path.stat().st_size <= 12 * 1024 * 1024):
        raise ValueError("Unreasonable media size: " + path.name)
    return round(duration, 3)


def production_plan():
    plan = load(PLAN)
    gaps = load(GAPS)
    vocab = load(VOCAB)
    manifest = load(PUBLIC)
    if (plan.get("voiceId") != OWNER or plan.get("modelId") != "eleven_v4"
            or plan.get("flowId") != FLOW):
        raise ValueError("Owner voice/model/flow mismatch")
    segments = plan["segments"]
    tasks = plan["tasks"]
    if len(tasks) != CHILD_GAP_COUNT or len({x["visibleText"] for x in tasks}) != CHILD_GAP_COUNT:
        raise ValueError("The 14 child-visible recordings have drifted")
    if len(segments) != 21 or segments["ar-07"].get("sourcePriorGenerationKey") != "existing-sidq-original-salawat":
        raise ValueError("Arabic Salawat reuse plan has drifted")
    new = {}
    for name, item in segments.items():
        if name == "ar-07":
            continue
        if (item.get("language") not in ("de", "ar")
                or not GENERATION_ID.fullmatch(str(item.get("generationId", "")))
                or not GENERATION_ID.fullmatch(str(item.get("sessionId", "")))
                or item.get("plannedProductionStatus") != "original-v4-generated-not-binary-imported"):
            raise ValueError("Missing actual V4 original receipt for " + name)
        if item["generationId"] in new:
            raise ValueError("Duplicate paid generation ID " + name)
        new[item["generationId"]] = name
    if len(new) != NEW_ORIGINALS:
        raise ValueError("Expected 20 distinct completed V4 takes")
    if any(v["text"].strip() != v["text"] for v in segments.values()):
        raise ValueError("Segment text contains trailing whitespace")
    vocab_texts = {p["text"] for p in vocab["phrases"]}
    visible = {e["text"] for e in gaps["entries"]}
    if len(visible) != CHILD_GAP_COUNT:
        raise ValueError("Missing child click gap audit")
    for task in tasks:
        text = task["visibleText"]
        if text not in visible:
            raise ValueError("Generated text must match child-visible text exactly")
        if task["kind"] == "glossary" and text not in vocab_texts:
            raise ValueError("Glossary source phrase does not match official child plan")
        if task["kind"] not in ("glossary", "answer", "question"):
            raise ValueError("Editorial metadata may not be narrated")
        if not task.get("segments") or any(x not in segments for x in task["segments"]):
            raise ValueError("A child task has undefined audio segments")
    if (manifest.get("id") != "KIDS_ACADEMY_SERHAT_MASTER_V1"
            or manifest.get("voiceProfileId") != "serhat-owner-voice-2026"):
        raise ValueError("Public audio manifest mismatch")
    old = {t: v for t, v in manifest["entries"].items()
           if isinstance(v, dict) and v.get("sourceLessonId") == "sidq"}
    if len(old) not in (58, 72):
        raise ValueError("Unexpected number of existing Ṣidq clips")
    if any(e.get("approvedForPlayback") is not True for e in old.values()):
        raise ValueError("Previously approved canonical Ṣidq clips were altered")
    if len(old) == 72:
        for t in tasks:
            if t["visibleText"] not in old:
                raise ValueError("Partial 14-item release; refusing to overwrite")
        return plan, gaps, manifest, True
    if set(old) & {t["visibleText"] for t in tasks}:
        raise ValueError("A new source text already has a recorded voice; avoid duplicate import")
    return plan, gaps, manifest, False


def transcode_audio(src, dst):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error",
                    "-nostdin", "-y", "-i", str(src), "-vn", "-ac", "1",
                    "-ar", "44100", "-c:a", "aac", "-b:a", "128k",
                    str(dst)], check=True)
    return ffprobe(dst, "aac")


def trim_exact_first_sentence(src, dst, seconds):
    """Use certified original V4 alignment to keep only the actually visible answer."""
    if not (2.0 < float(seconds) < 4.5):
        raise ValueError("Unsafe cut position for paid V4 recording")
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error",
                    "-nostdin","-y","-i",str(src),"-t",format(float(seconds),".3f"),
                    "-vn","-ac","1","-ar","44100","-c:a","aac","-b:a","128k",
                    str(dst)],check=True)
    return ffprobe(dst,"aac")


def join_audio(parts, dst):
    # Produce one continuous real AAC track; never use synthesized silence.
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y"]
    for source in parts:
        args += ["-i", str(source)]
    filt = "".join("[%d:a]" % i for i in range(len(parts)))
    filt += "concat=n=%d:v=0:a=1[out]" % len(parts)
    args += ["-filter_complex", filt, "-map", "[out]",
             "-ac", "1", "-ar", "44100", "-c:a", "aac",
             "-b:a", "128k", str(dst)]
    subprocess.run(args, check=True)
    return ffprobe(dst, "aac")


def import_files(plan, gaps, manifest, source_dir):
    segments = plan["segments"]
    generation_sources = {}
    for key, item in segments.items():
        gen = SALAWAT if key == "ar-07" else item["generationId"]
        path = source_dir / (gen + ".mp3")
        if not path.is_file():
            raise FileNotFoundError("Missing original MP3 " + gen)
        ffprobe(path, "mp3")
        generation_sources[key] = path

    # Every file is built before the live manifest is changed.
    results = {}
    with tempfile.TemporaryDirectory(prefix="dar-kids-sidq-14-") as work:
        temp = pathlib.Path(work)
        transcoded = {}
        for key, source in generation_sources.items():
            output = temp / (key + ".m4a")
            transcode_audio(source, output)
            transcoded[key] = output

        for i, task in enumerate(plan["tasks"]):
            key = task["visibleText"]
            parts = task["segments"]
            output = temp / ("final-%02d.m4a" % i)
            if task.get("speechExtraction") == "provider-character-aligned-first-sentence-de20":
                if (parts != ["de-20"] or task["kind"] != "answer"
                        or key != "Antwort 1: Einen Fehler kann man unbeabsichtigt machen."):
                    raise ValueError("Unexpected exact short child answer extraction")
                evidence = load(source_dir / "_de20-exact-trim.json")
                original = generation_sources["de-20"]
                if (evidence.get("approvedForExactOfflineTrim") is not True
                        or evidence.get("segment") != "de-20"
                        or evidence.get("generationId") != segments["de-20"]["generationId"]
                        or evidence.get("sourceOriginalSha256") != sha(original.read_bytes())
                        or evidence.get("exactChildAudioText") != key.removeprefix("Antwort 1: ")
                        or evidence.get("newV4Generations") != 0):
                    raise ValueError("Uncertified paid V4 first-sentence trim")
                length = trim_exact_first_sentence(original, output, evidence["cutSeconds"])
            elif len(parts) == 1:
                # Keep the already rendered content; simple format conversion.
                output.write_bytes(transcoded[parts[0]].read_bytes())
                length = ffprobe(output, "aac")
            else:
                length = join_audio([transcoded[p] for p in parts], output)
            b = output.read_bytes()
            digest = sha(b)
            name = "sidq-click-" + digest[:24] + ".m4a"
            gen_ids = [SALAWAT if s == "ar-07" else segments[s]["generationId"]
                       for s in parts]
            results[key] = {
                "name": name, "bytes": b,
                "info": {
                    "url": "/kids/assets/kids-academy-audio/" + name,
                    "sha256": digest,
                    "durationSeconds": length,
                    "voiceId": OWNER,
                    "voiceProfileId": "serhat-owner-voice-2026",
                    "voiceSettingsProfile": "kids_story",
                    "modelId": "eleven_v4",
                    "sourceVoice": "authorized-owner-voice",
                    "sourceSpeaker": "Serhat Abu Malik",
                    "sourceType": "owner-V4-creative-bilingual-assembled" if any(segments[x]["language"] == "ar" for x in parts) else "owner-V4-creative-german",
                    "sourceSubject": "akhlaq",
                    "sourceLessonId": "sidq",
                    "sourceTeachingKind": task["kind"],
                    "sourceAgeBand": task["age"],
                    "sourceGenerationIds": gen_ids,
                    "spokenText": key if task["kind"] == "glossary" else
                                  re.sub(r"^Antwort \d+:\s*", "", key),
                    "approvedForPlayback": True,
                    "qaStatus": "owner-authorized-automated-technical-audit",
                    "arabicSegmentsNative": any(segments[x]["language"] == "ar" for x in parts),
                    "actualCreativeVoiceSettings": {"stability": 0.62, "similarity": 0.88},
                    "creativeV4SpeedStyleNotAvailable": True,
                },
            }
        if len(results) != CHILD_GAP_COUNT:
            raise ValueError("Cannot publish incomplete child audio block")
        MEDIA.mkdir(parents=True, exist_ok=True)
        for obj in results.values():
            destination = MEDIA / obj["name"]
            if destination.exists():
                if sha(destination.read_bytes()) != obj["info"]["sha256"]:
                    raise ValueError("Existing file collision: " + obj["name"])
            else:
                destination.write_bytes(obj["bytes"])
            if sha(destination.read_bytes()) != obj["info"]["sha256"]:
                raise ValueError("Final published bytes do not match SHA-256")
            ffprobe(destination, "aac")

    before = len(manifest["entries"])
    for text, item in results.items():
        manifest["entries"][text] = item["info"]
    if len(manifest["entries"]) != before + CHILD_GAP_COUNT:
        raise ValueError("Unexpected manifest entry count after exact 14 import")
    # Write the actual bytes into the repository first; the registry update
    # never claims that GitHub/Cloudflare have already deployed these files.
    write_json(PUBLIC, manifest)
    for row in gaps["entries"]:
        item = results[row["text"]]
        row["binaryImportStatus"] = "local-repo-imported-pending-cloudflare-deployment"
        row["productionStatus"] = "real-media-repo-imported-live-verification-pending"
        row["sha256"] = item["info"]["sha256"]
        row["url"] = item["info"]["url"]
        row["durationSeconds"] = item["info"]["durationSeconds"]
        row["publicPlaybackApproved"] = False
    gaps["status"] = "all-14-imported-awaiting-cloudflare-verification"
    write_json(GAPS, gaps)
    plan["taskStatus"] = "all-14-real-binaries-imported-live-verification-pending"
    plan["binaryFilesImported"] = CHILD_GAP_COUNT
    plan["childAudioPlaybackApprovedCount"] = 0
    plan["completionClaimed"] = False
    write_json(PLAN, plan)
    return sorted(results)


def main():
    ap = argparse.ArgumentParser()
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--import", dest="do_import", action="store_true")
    ap.add_argument("--source-dir", type=pathlib.Path)
    args = ap.parse_args()
    plan, gaps, manifest, already = production_plan()
    if already:
        print(json.dumps({"topic": "sidq", "alreadyImported": True,
                          "newSynthesis": 0, "requiredNewMedia": 0}, ensure_ascii=False))
        return
    if args.dry_run:
        print(json.dumps({"topic": "sidq", "newOriginalGenerations": 20,
                          "reusedOriginalSalawat": 1, "sourceMediaRequired": 21,
                          "childRecordings": 14, "arabicGermanAssemblies": 9,
                          "binaryImported": 0, "newSynthesis": 0}, ensure_ascii=False))
        return
    if not args.source_dir:
        ap.error("--source-dir required for --import")
    items = import_files(plan, gaps, manifest, args.source_dir.resolve())
    print(json.dumps({"topic": "sidq", "recordingsImported": len(items),
                      "newSynthesis": 0, "publicVerificationPending": True},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
