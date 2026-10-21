#!/usr/bin/env python3
"""No-credit regression for all 450 KIDS quiz V4 paid-workflow paths."""
from __future__ import annotations

import ast
import copy
import hashlib
import json
import tempfile
from pathlib import Path

from quiz_v4_no_double_charge_guard import (
    MODEL, VOICE, protect_paid_texts, prohibit_prepaid_selection,
)

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = (
    "kids/tools/generate_quiz_v4_450_paid_pilot.py",
    "kids/tools/generate_quiz_v4_450_paid_batch02.py",
    "kids/tools/generate_quiz_v4_450_paid_batch03.py",
    "kids/tools/quiz_v4_first150_costed_campaign.py",
)
WORKFLOWS = (
    ".github/workflows/kids-quiz-v4-450-paid-pilot.yml",
    ".github/workflows/kids-v4-450-paid-batch02.yml",
    ".github/workflows/kids-v4-450-paid-batch03.yml",
    ".github/workflows/kids-v4-first150-campaign.yml",
)


def require(ok, why):
    if not ok:
        raise AssertionError(why)


def refused(call, label):
    try:
        call()
    except RuntimeError:
        return
    raise AssertionError("Previously paid item not blocked: " + label)


def main():
    # Read only: verify actual paid provider IDs, text SHA receipts, original
    # registration, and all nine unrecovered takes. No network or synthesis.
    reg = json.loads((ROOT / "kids/data/quiz-v4-450-original-clip-registry.json")
                     .read_text(encoding="utf-8"))
    ledger = json.loads((ROOT / "kids/data/quiz-v4-450-paid-generation-ledger.json")
                        .read_text(encoding="utf-8"))
    old = json.loads((ROOT / "kids/data/quiz-v4-missing9-prepaid-originals.json")
                     .read_text(encoding="utf-8"))
    protected = protect_paid_texts(ROOT, reg, ledger)
    # Other audio workers can have connected ElevenLabs generations already
    # submitted or reserved even when MP3 bytes have not yet reached GitHub.
    # Those source texts are protected too; do not treat them as unbilled.
    flow_path=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
    connected=json.loads(flow_path.read_text(encoding="utf-8")) if flow_path.is_file() else {"entries":[]}
    connected_pending={e["sourceText"] for e in connected["entries"]
                       if e["status"]!="IMPORTED_ORIGINAL_MP3_VERIFIED"}
    # Unconfirmed historical ElevenLabs POSTs can already have consumed
    # credits, despite the original never reaching the MP3 registry.
    journal=json.loads((ROOT/"kids/data/quiz-v4-older-stage1-request-journal.json")
                      .read_text(encoding="utf-8"))
    uncertain_hashes={r["textSHA256"] for r in journal["entries"]
                      if r["status"]=="REQUEST_STARTED_UNCONFIRMED"}
    plan=json.loads((ROOT/"kids/data/quiz-v4-curated-450-production-review.json")
                    .read_text(encoding="utf-8"))
    candidate_texts={phrase for q in plan["recipes"]
                     for kind in ("question","correct","retry","explanation")
                     for phrase in ([q[kind]["text"]]+q[kind].get("segments",[]))}
    uncertain={text for text in candidate_texts
               if hashlib.sha256(text.encode("utf-8")).hexdigest() in uncertain_hashes}
    require({hashlib.sha256(text.encode("utf-8")).hexdigest() for text in uncertain}
            ==uncertain_hashes,"Unconfirmed provider POST is not protected")
    expected = (set(reg["textClips"]) |
                {r["text"] for r in ledger["rows"]} |
                {r["originalSpokenText"] for r in old["items"]} |
                connected_pending | uncertain)
    require(protected == expected, "Some previously paid or connected pending V4 speech missing from protection")
    for text in connected_pending:
        refused(lambda text=text: prohibit_prepaid_selection(text,protected),
                "connected flow reserved/pending original")
    require(not connected_pending.intersection(
            {r["originalSpokenText"] for r in old["items"]}),
            "connected flow would duplicate one of nine historical paid originals")
    require(len({r["providerRequestId"] for r in ledger["rows"] if r.get("providerRequestId")}) ==
            sum(bool(r.get("providerRequestId")) for r in ledger["rows"]),
            "Duplicate paid provider receipts")
    for text in protected:
        refused(lambda text=text: prohibit_prepaid_selection(text, protected), "known take")
    prohibit_prepaid_selection("Completely new unpaid synthetic fixture only", protected)

    bad = copy.deepcopy(ledger)
    bad["rows"].append(copy.deepcopy(bad["rows"][0]))
    refused(lambda: protect_paid_texts(ROOT, reg, bad), "duplicate ledger charge")
    bad = copy.deepcopy(ledger)
    bad["rows"][0]["mp3Sha256"] = "0" * 64
    refused(lambda: protect_paid_texts(ROOT, reg, bad), "mismatched paid MP3 SHA")
    bad = copy.deepcopy(reg)
    bad["textClips"].pop(ledger["rows"][0]["text"])
    refused(lambda: protect_paid_texts(ROOT, bad, ledger), "paid clip missing from registry")
    bad = copy.deepcopy(reg)
    text = next(iter(bad["textClips"]))
    bad["textClips"][text]["modelId"] = "eleven_flash_v2_5"
    refused(lambda: protect_paid_texts(ROOT, bad, ledger), "Flash instead of V4")
    with tempfile.TemporaryDirectory(prefix="kids-v4-no-credit-guard-") as folder:
        temp = Path(folder)
        (temp / "kids/data").mkdir(parents=True)
        corrupted = copy.deepcopy(old)
        corrupted["items"][0]["newSynthesisAllowed"] = True
        (temp / "kids/data/quiz-v4-missing9-prepaid-originals.json").write_text(
            json.dumps(corrupted), encoding="utf-8")
        refused(lambda: protect_paid_texts(temp, reg, ledger),
                "previously paid missing original falsely marked regenerable")
    for file in SCRIPTS:
        source = (ROOT / file).read_text(encoding="utf-8")
        ast.parse(source, filename=file)
        require("protect_paid_texts(ROOT,registry,ledger)" in source,
                "Missing paid-record preflight in " + file)
        require("prohibit_prepaid_selection(" in source,
                "Missing per-selection double-charge refusal in " + file)
        require("model_id" in source or "MODEL=\"eleven_v4\"" in source,
                "No documented original V4 model contract in " + file)
    for file in WORKFLOWS:
        workflow = (ROOT / file).read_text(encoding="utf-8")
        require("group: tawhid-kids-v4-450-shared-paid-queue" in workflow,
                "Costly workflow could overlap another paid batch: " + file)
        require("authorize_new_credit_spend:" in workflow and
                "cancel-in-progress: false" in workflow,
                "Manual permission or safe queue policy missing: " + file)

    print("PASS_KIDS_QUIZ_V4_NO_DUPLICATE_CHARGES " + json.dumps({
        "paidLedgerRows": len(ledger["rows"]),
        "allSavedOriginalTextKeys": len(reg["textClips"]),
        "previouslyPaidOldOriginalsImported": len(reg["generationClips"]),
        "oldPrepaidStillRecoverableOnly": len(old["items"]),
        "protectedDistinctSpeechTexts": len(protected),
        "checkedPaidScripts": len(SCRIPTS),
        "serializedPaidWorkflows": len(WORKFLOWS),
        "negativeCases": 5,
        "newSpeechCredits": 0,
        "humanListeningApprovalClaimed": False,
        "publicRelease": False,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
