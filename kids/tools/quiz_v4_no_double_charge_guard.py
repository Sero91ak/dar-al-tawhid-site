#!/usr/bin/env python3
"""Cost-free, fail-closed reusable V4 original-audio expense protection.

Never uses ElevenLabs. Before any new paid KIDS quiz POST, reconcile every
already-charged text and protect the 9 known prepaid-but-not-imported texts.
These nine must be recovered from the original generation, not re-synthesized.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

MODEL = "eleven_v4"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"


def protect_paid_texts(root: Path, registry: dict, ledger: dict) -> set[str]:
    if (registry.get("modelId") != MODEL or registry.get("voiceId") != VOICE
            or registry.get("live") is not False or ledger.get("live") is not False):
        raise RuntimeError("V4 original source or review lane changed; no paid synthesis")
    recorded = registry.get("textClips")
    rows = ledger.get("rows")
    if not isinstance(recorded, dict) or not isinstance(rows, list) or not rows:
        raise RuntimeError("Previously paid V4 source records unavailable")
    charged = set()
    requests = set()
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("text"), str):
            raise RuntimeError("Paid billing record missing text; stop")
        spoken = row["text"]
        if spoken in charged:
            raise RuntimeError("Same exact V4 text already charged twice in ledger; stop")
        charged.add(spoken)
        request_id = row.get("providerRequestId")
        if request_id:
            if request_id in requests:
                raise RuntimeError("A paid provider request ID appears twice; stop")
            requests.add(request_id)
        saved = recorded.get(spoken)
        if not isinstance(saved, dict):
            raise RuntimeError("Charged text has no saved MP3 registry entry; stop")
        if (saved.get("modelId") != MODEL or saved.get("voiceId") != VOICE
                or saved.get("sha256") != row.get("mp3Sha256")
                or row.get("textSha256") != hashlib.sha256(spoken.encode("utf-8")).hexdigest()):
            raise RuntimeError("Previously paid original V4 receipt/hash mismatch; stop")

    original_list = root / "kids/data/quiz-v4-missing9-prepaid-originals.json"
    data = json.loads(original_list.read_text(encoding="utf-8"))
    # Historical recovery manifest stores the source voice/model on EACH take.
    # Optional root-level keys are checked if present, but never invented.
    if (data.get("modelId", MODEL) != MODEL or data.get("voiceId", VOICE) != VOICE):
        raise RuntimeError("Previously paid ElevenLabs Flow speaker/model changed; stop")
    nine = data.get("items")
    if not isinstance(nine, list) or len(nine) != 9:
        raise RuntimeError("Original prepaid-nine recovery contract changed; stop")
    ids = set()
    reserved = set()
    for item in nine:
        gid = item.get("generationId")
        spoken = item.get("originalSpokenText")
        if (not gid or gid in ids or not isinstance(spoken, str) or not spoken
                or spoken in reserved or item.get("existingPaid") is not True
                or item.get("newSynthesisAllowed") is not False
                or item.get("modelId") != MODEL or item.get("voiceId") != VOICE):
            raise RuntimeError("Ambiguous previously paid source; refuse new credits")
        ids.add(gid)
        reserved.add(spoken)
    if charged & reserved:
        raise RuntimeError("A prepaid original was charged again; reconcile before more synthesis")
    for spoken, saved in recorded.items():
        if (not isinstance(saved, dict) or saved.get("modelId") != MODEL
                or saved.get("voiceId") != VOICE or not saved.get("sha256")
                or (saved.get("textSha256") and
                    saved["textSha256"] != hashlib.sha256(spoken.encode("utf-8")).hexdigest())):
            raise RuntimeError("Saved original has inconsistent voice/model/text/hash metadata; stop")
    # Covers all 327 cost-ledger takes, 47 imported prepaid originals and
    # 9 paid originals that are not yet downloadable.
    return charged | reserved | set(recorded)


def prohibit_prepaid_selection(spoken: str, protected: set[str]) -> None:
    if spoken in protected:
        raise RuntimeError("V4 original already paid, including unimported originals; do not regenerate")
