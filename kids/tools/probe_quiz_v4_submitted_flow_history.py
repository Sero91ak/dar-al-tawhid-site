#!/usr/bin/env python3
"""GET-only evidence search for submitted TAWḤĪD KIDS V4 Creative Flow takes.

A completed node is NOT a saved MP3, and identical text in history is NOT proof
of the exact same generation. This script only discovers candidate HISTORY IDs.
It deliberately cannot create speech, download audio, register a paid receipt,
or alter a quiz. The seven merely reserved/unspent takes remain untouched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
FLOW = ROOT / "kids/data/quiz-v4-connected-flow-originals-ledger.json"
REG = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
RELEASE = ROOT / "kids/data/quiz-curation-release.json"
REPORT = ROOT / "kids/review-only/quiz-v4-submitted-flow-history-candidates.json"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
API = "https://api.elevenlabs.io/v1/history"

def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def require(ok: bool, reason: str) -> None:
    if not ok:
        raise RuntimeError("KIDS_V4_FLOW_HISTORY_NO_SPEND: " + reason)

def prepare() -> tuple[list[dict], int]:
    flow, reg, release = load(FLOW), load(REG), load(RELEASE)
    require(flow.get("voiceId") == reg.get("voiceId") == VOICE and
            flow.get("modelId") == reg.get("modelId") == MODEL,
            "voice or model diverged from master V4")
    require(flow.get("live") is False and reg.get("live") is False and
            release.get("enabled") is False, "public quiz must remain disabled")
    waiting = []
    reserved = 0
    for row in flow["entries"]:
        status = row["status"]
        if status == "RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED":
            reserved += 1
            continue
        if status != "GENERATION_SUBMITTED_DO_NOT_RETRY":
            continue
        spoken = row.get("sourceText")
        digest = row.get("sourceTextSHA256")
        require(isinstance(spoken, str) and spoken and
                hashlib.sha256(spoken.encode("utf-8")).hexdigest() == digest,
                "submitted speech was edited")
        require(row.get("modelId") == MODEL and row.get("voiceId") == VOICE and
                isinstance(row.get("flowId"), str) and bool(row["flowId"]) and
                isinstance(row.get("nodeId"), str) and bool(row["nodeId"]),
                "submitted take has no stable original V4 node")
        require(spoken not in reg["textClips"],
                "submitted text was already imported: reconcile the ledger")
        waiting.append(row)
    require(reserved <= 8 and len(waiting) <= 8,
            "unexpected number of reserved/submitted originals")
    require(len({r["sourceTextSHA256"] for r in waiting}) == len(waiting),
            "duplicate submitted text hash")
    return waiting, reserved

def matching(items: list[dict], target: dict) -> list[dict]:
    found = []
    for row in items:
        if (row.get("text") != target["sourceText"] or
            row.get("model_id") != MODEL or row.get("voice_id") != VOICE or
            str(row.get("source", "")).lower() != "flows"):
            continue
        hid = row.get("history_item_id")
        if isinstance(hid, str) and hid and hid.isalnum():
            found.append({"historyItemId": hid, "dateUnix": row.get("date_unix")})
    return found

def search_history(key: str) -> tuple[list[dict], bool]:
    result: list[dict] = []
    cursor = None
    truncated = False
    for _ in range(5):
        q = {"source": "Flows", "model_id": MODEL, "voice_id": VOICE,
             "page_size": "100", "sort_direction": "desc"}
        if cursor:
            q["start_after_history_item_id"] = cursor
        url = API + "?" + urllib.parse.urlencode(q)
        req = urllib.request.Request(url, headers={
            "xi-api-key": key, "Accept": "application/json",
            "User-Agent": "TAWHID-KIDS-GET-ONLY-RECONCILIATION/1.0"}, method="GET")
        with urllib.request.urlopen(req, timeout=35) as response:
            require(response.status == 200, "history GET returned non-200")
            payload = json.loads(response.read(2_000_001).decode("utf-8"))
        page = payload.get("history")
        require(isinstance(page, list), "history API did not return a list")
        result.extend(page)
        truncated = bool(payload.get("has_more"))
        if not truncated:
            break
        cursor = payload.get("last_history_item_id")
        require(isinstance(cursor, str) and cursor, "history cursor absent")
    return result, truncated

def report(scan: bool) -> dict:
    waiting, reserved = prepare()
    result = {
        "schemaVersion": 1,
        "scope": "KIDS_V4_SUBMITTED_FLOW_HISTORY_CANDIDATES_GET_ONLY",
        "modelId": MODEL, "voiceId": VOICE, "reviewOnly": True,
        "submittedWithoutConfirmedMP3": len(waiting),
        "reservedUnspentExcludedFromHistoryRecovery": reserved,
        "historyPagesMaximum": 5, "historyRecordsMaximum": 500,
        "newSynthesisCalls": 0, "newSpeechCreditsSpent": 0,
        "originalMP3sDownloaded": 0, "quizAudioRegistryChanged": False,
        "humanHearingApproved": False, "publicReleaseEnabled": False,
        "unprovenHistoryCandidateMustNotBeImported": True,
        "items": []
    }
    found = []
    truncated = False
    if scan and waiting:
        key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        if not key:
            result["status"] = "BLOCKED_NO_PROVIDER_KEY"
        else:
            try:
                found, truncated = search_history(key)
                result["status"] = "READ_ONLY_HISTORY_SCAN_COMPLETED"
            except urllib.error.HTTPError as e:
                result["status"] = "PROVIDER_HTTP_" + str(e.code)
            except (urllib.error.URLError, TimeoutError):
                result["status"] = "PROVIDER_UNAVAILABLE"
    else:
        result["status"] = "OFFLINE_INTEGRITY_AUDIT" if not scan else "NO_SUBMITTED_TAKES"
    result["historyResultsTruncated"] = truncated
    for item in waiting:
        candidates = matching(found, item)
        result["items"].append({
            "textSHA256": item["sourceTextSHA256"],
            "flowId": item["flowId"], "nodeId": item["nodeId"],
            "candidateCount": len(candidates),
            "candidates": candidates,
            "exactOriginalProven": False,
            "providerAudioImported": False,
            "nextAction": "Correlate history item with original Flow generation/session, then GET original MP3; never regenerate"
        })
    return result

def selftest() -> None:
    target = {"sourceText": "Im Rabīʿ al-Awwal."}
    records = [
        {"text": target["sourceText"], "source": "Flows",
         "model_id": MODEL, "voice_id": VOICE, "history_item_id": "Known123",
         "date_unix": 1790000000},
        {"text": target["sourceText"], "source": "TTS",
         "model_id": MODEL, "voice_id": VOICE, "history_item_id": "WrongSource"},
        {"text": target["sourceText"], "source": "Flows",
         "model_id": MODEL, "voice_id": "WRONG", "history_item_id": "WrongVoice"},
        {"text": target["sourceText"], "source": "Flows",
         "model_id": "eleven_v3", "voice_id": VOICE, "history_item_id": "WrongModel"},
    ]
    require([x["historyItemId"] for x in matching(records, target)] == ["Known123"],
            "history candidate matching accepted an unsafe take")
    offline = report(False)
    require(offline["newSynthesisCalls"] == offline["newSpeechCreditsSpent"] == 0 and
            not offline["quizAudioRegistryChanged"] and
            all(not x["exactOriginalProven"] for x in offline["items"]),
            "read-only offline audit accidentally authorized voice generation or import")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scan", action="store_true", help="Only official history HTTP GET; zero synthesis")
    parser.add_argument("--self-test", action="store_true", help="Offline matching regression; zero network")
    args = parser.parse_args()
    if args.self_test:
        selftest()
        print("PASS_KIDS_V4_SUBMITTED_FLOW_HISTORY_SAFETY_OFFLINE")
        return
    result = report(args.scan)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("KIDS_V4_SUBMITTED_FLOW_GET_ONLY " + json.dumps({
        "status": result["status"],
        "submitted": result["submittedWithoutConfirmedMP3"],
        "reservedNotRetried": result["reservedUnspentExcludedFromHistoryRecovery"],
        "historyCandidates": sum(x["candidateCount"] for x in result["items"]),
        "creditsSpent": 0, "imported": 0
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
