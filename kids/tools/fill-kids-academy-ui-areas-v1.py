#!/usr/bin/env python3
"""Fill missing Lernakademie UI/hint/explain/meaning/question/answer clips.

Reuses exact existing master V4 clips. Arabic-script segments only attach the
pinned pronunciation dictionary. Never retries an ambiguous paid POST.
Sets approvedForPlayback/releaseEnabled so staging can play; liveConfirmed stays unset.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QUEUE = Path("/tmp/academy-ui-areas-fill-queue-20261126.json")
REPORT = ROOT / "kids/data/academy-topic-batches/v4-ui-areas-fill-20261126.json"

BILLING_KINDS = [
    "genericUi",
    "hints",
    "explainFeedback",
    "quranMeanings",
    "questionPrompts",
    "answerOptions",
    "hadithGerman",
]


def load_fill():
    path = ROOT / "kids/tools/fill-kids-master-v4-audio.py"
    spec = importlib.util.spec_from_file_location("fillv4", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def enable_playback(entry: dict) -> dict:
    entry = dict(entry)
    entry["approvedForPlayback"] = True
    entry["releaseEnabled"] = True
    entry["liveConfirmed"] = False
    return entry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--produce", action="store_true")
    parser.add_argument("--aliases-only", action="store_true")
    parser.add_argument("--max", type=int, default=0)
    args = parser.parse_args()
    fill = load_fill()
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    public = fill.load_json(fill.PUBLIC)
    extras = fill.load_extra_manifests()

    work = []
    seen = set()
    for kind in BILLING_KINDS:
        for it in queue.get(kind) or []:
            text = fill.nfc(it["text"])
            if not text or text in seen:
                continue
            seen.add(text)
            work.append({
                "kind": "academy",
                "text": text,
                "chars": len(text),
                "firstLesson": it.get("firstLesson") or "academy-ui-areas",
                "area": kind,
            })

    missing = [i for i in work if not fill.reusable_entry(i["text"], public, extras)]
    print(json.dumps({
        "queuedUnique": len(work),
        "queuedChars": sum(i["chars"] for i in work),
        "alreadyReusable": len(work) - len(missing),
        "toGenerate": len(missing),
        "toGenerateChars": sum(i["chars"] for i in missing),
        "prefixAliasesQueued": len(queue.get("prefixAliases") or []),
        "creditsRemaining": None if (args.produce or args.aliases_only) else fill.remaining_credits(),
    }, ensure_ascii=False, indent=2), flush=True)

    if args.status and not args.produce and not args.aliases_only:
        return
    if not args.produce and not args.aliases_only:
        parser.error("use --status, --produce, or --aliases-only")

    stats = {
        "generated": 0,
        "reused": 0,
        "already": 0,
        "uncertain": 0,
        "failed": 0,
        "charactersSpent": 0,
        "byArea": {},
        "uncertainItems": [],
        "failedItems": [],
        "aliasesAdded": 0,
        "aliasesSkipped": 0,
    }

    if args.produce:
        credits = fill.remaining_credits()
        print("START remaining_credits", credits, flush=True)
        if credits < fill.RESERVE + 50:
            raise SystemExit("credits below reserve; no paid work started")
        ledger = fill.ledger_init()
        generated_now = 0
        for idx, item in enumerate(work, 1):
            if args.max and generated_now >= args.max:
                print("STOP max-items", args.max, flush=True)
                break
            if generated_now > 0 and generated_now % 20 == 0:
                credits = fill.remaining_credits()
                print("CREDIT_REFRESH remaining", credits, "generated_now", generated_now, flush=True)
            if credits < fill.RESERVE + item["chars"]:
                print("STOP credits-low", credits, "need", item["chars"], flush=True)
                break
            try:
                result = fill.produce_one_academy(item, public, extras, ledger)
            except Exception:
                fill.save_json(fill.LEDGER, ledger)
                fill.save_json(fill.PUBLIC, public)
                raise
            rec = (public.get("entries") or {}).get(item["text"])
            if rec:
                public["entries"][item["text"]] = enable_playback(rec)
            area = item["area"]
            stats["byArea"].setdefault(area, {"generated": 0, "reused": 0, "already": 0, "charsGenerated": 0})
            if result == "generated":
                generated_now += 1
                stats["generated"] += 1
                stats["charactersSpent"] += item["chars"]
                stats["byArea"][area]["generated"] += 1
                stats["byArea"][area]["charsGenerated"] += item["chars"]
                credits = max(0, credits - item["chars"])
                fill.save_json(fill.PUBLIC, public)
                fill.save_json(fill.LEDGER, ledger)
                time.sleep(0.35)
            elif result == "reused":
                stats["reused"] += 1
                stats["byArea"][area]["reused"] += 1
                fill.save_json(fill.PUBLIC, public)
                fill.save_json(fill.LEDGER, ledger)
            elif result == "already":
                stats["already"] += 1
                stats["byArea"][area]["already"] += 1
            elif result == "uncertain":
                stats["uncertain"] += 1
                stats["uncertainItems"].append({"text": item["text"][:160], "area": area, "chars": item["chars"]})
                fill.save_json(fill.LEDGER, ledger)
            else:
                stats["failed"] += 1
                stats["failedItems"].append({"text": item["text"][:160], "area": area, "result": result})
                fill.save_json(fill.LEDGER, ledger)
            if idx % 10 == 0 or result == "generated":
                print(f"[{idx}/{len(work)}] {result} {area} chars={item['chars']} generated_now={generated_now}", flush=True)

        fill.save_json(fill.PUBLIC, public)
        fill.save_json(fill.LEDGER, ledger)

    # Aliases: "Antwort N: …" -> existing plain answer clip (0 billed chars).
    aliases = queue.get("prefixAliases") or []
    for row in aliases:
        prefixed = fill.nfc(row["prefixed"])
        plain = fill.nfc(row["plain"])
        if not prefixed or not plain:
            continue
        entries = public.setdefault("entries", {})
        if prefixed in entries and fill.file_ok(entries[prefixed].get("url") or "", entries[prefixed].get("sha256")):
            entries[prefixed] = enable_playback(entries[prefixed])
            stats["aliasesSkipped"] += 1
            continue
        src = entries.get(plain) or fill.reusable_entry(plain, public, extras)
        if not src or not src.get("url"):
            stats["aliasesSkipped"] += 1
            continue
        alias = enable_playback(dict(src))
        alias["spokenText"] = plain
        alias["aliasedFrom"] = plain
        alias["sourceType"] = "alias-answer-prefix-to-plain"
        alias.pop("playbackStartSeconds", None)
        entries[prefixed] = alias
        stats["aliasesAdded"] += 1
    fill.save_json(fill.PUBLIC, public)

    credits_end = fill.remaining_credits()
    stats["creditsRemaining"] = credits_end
    stats["manifestEntries"] = len(public.get("entries") or {})
    fill.save_json(REPORT, {"updatedAt": fill.stamp(), **stats})
    print(json.dumps({"finished": True, **stats}, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
