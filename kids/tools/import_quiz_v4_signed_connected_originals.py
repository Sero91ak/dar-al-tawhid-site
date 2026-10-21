#!/usr/bin/env python3
"""ONE-TIME zero-credit transfer of ten already-generated V4 originals to quiz assets.

Only uses the signed, short-lived audio content URLs of confirmed provider
generations. Never calls a speech generation endpoint. The temporary URL
manifest is removed immediately after the original MP3s are verified/imported.
Never write URLs, tokens or response headers to stdout or workflow artifacts.
"""
import argparse, json, sys, tempfile, urllib.request
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "kids/tools"))
import import_quiz_v4_connected_flow_originals as importer

MANIFEST = ROOT / "kids/review-only/quiz-v4-connected-temporary-original-urls.json"
FLOW = ROOT / "kids/data/quiz-v4-connected-flow-originals-ledger.json"
EXPECTED_VOICE = "DkU7j9uO4ZEtLD2iRZSH"


def check(ok, message):
    if not ok: raise RuntimeError("KIDS V4 SAFE DIRECT IMPORT: "+message)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def inspect():
    src, flow = read(MANIFEST), read(FLOW)
    check(src.get("scope")=="KIDS_V4_ONE_TIME_ALREADY_PAID_ORIGINAL_BYTES",
          "unknown original export scope")
    check(src.get("modelId")=="eleven_v4" and src.get("voiceId")==EXPECTED_VOICE
          and src.get("noNewSynthesis") is True, "incorrect V4 master")
    records = src.get("originals")
    check(isinstance(records,list) and len(records)==10, "not exactly ten paid originals")
    provider = {e["generationId"]:e for e in flow["entries"]
                if e.get("status")=="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"}
    check(len(provider)==10, "import escrow changed since provider signed URLs were issued")
    check({r.get("generationId") for r in records}==set(provider),
          "generation IDs do not match the ten reserved paid originals")
    for r in records:
        e = provider[r["generationId"]]
        check(r.get("sessionId")==e.get("sessionId") and
              r.get("sourceTextSHA256")==e.get("sourceTextSHA256"),
              "paid original source/SHA not identical to receipt")
        url = r.get("temporaryMediaURL")
        check(isinstance(url,str) and len(url)<5000,"temporary file URL missing")
        parsed = urlsplit(url)
        check(parsed.scheme=="https" and parsed.hostname=="storage.googleapis.com"
              and parsed.username is None and parsed.password is None
              and parsed.path.endswith("/content_generation/"+e["sessionId"]+
                                        "/"+e["generationId"]+"/content.mp3"),
              "not the exact provider original from the approved session")
        params = parse_qs(parsed.query)
        check(params.get("X-Goog-Algorithm")==["GOOG4-RSA-SHA256"] and
              bool(params.get("X-Goog-Signature")), "provider signed URL invalid")
    check(read(ROOT/"kids/data/quiz-curation-release.json").get("enabled") is False,
          "live quiz release must remain OFF")
    return records


def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--audit",action="store_true")
    cli.add_argument("--fetch-and-import",action="store_true")
    args=cli.parse_args()
    check(args.audit!=args.fetch_and_import,
          "exactly one mode required")
    records=inspect()
    if args.audit:
        print("PASS: ten exact original V4 media URLs validated against paid ledger; no GET, no credits")
        return
    with tempfile.TemporaryDirectory(prefix="kids-v4-confirmed-originals-") as folder:
        destination=Path(folder)
        for rec in records:
            gid=rec["generationId"]
            request=urllib.request.Request(
                rec["temporaryMediaURL"],headers={"Accept":"audio/mpeg",
                    "User-Agent":"TAWHID-KIDS-paid-original-restore/1.0"})
            try:
                with urllib.request.urlopen(request,timeout=85) as response:
                    check(response.status==200,"original MP3 not available, no synthesis")
                    data=response.read(6_000_001)
            except Exception:
                raise RuntimeError("Original source download unavailable for "+gid+
                                   ". Do not regenerate or spend credits again.") from None
            check(1800<len(data)<6_000_000 and
                  (data.startswith(b"ID3") or data[:1]==bytes([255])),
                  "original source returned non-MP3 bytes "+gid)
            path=destination/(gid+".mp3")
            path.write_bytes(data)
            importer.probe(path,read(FLOW)["entries"][
                next(i for i,e in enumerate(read(FLOW)["entries"])
                     if e.get("generationId")==gid)].get("providerGenerationDurationSeconds"))
            print("Original MP3 downloaded and codec verified: "+gid)
        report=importer.run(destination)
        check(len(report["newlyImportedProviderGenerationIds"])==10 and
              len(report["remainingPendingProviderGenerationIds"])==0,
              "not all ten originals safely imported")
    # Delete temporary access-bearing URLs from the checked-out branch. Workflow
    # commits this deletion together with the new quiz assets, never artifacts.
    MANIFEST.unlink()
    print("PASS: ten original MP3s imported into quiz assets, zero new credits. Temporary media URLs removed.")


if __name__=="__main__":
    main()
