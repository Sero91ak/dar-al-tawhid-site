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
    # The connected Creative Studio may finish a paid speech generation before
    # its ORIGINAL MP3 bytes are imported into the GitHub registry.  Reserve
    # the exact UTF-8 text immediately: neither older GitHub Actions batches
    # nor newer full-450 batch planners may ever purchase it again.
    flow_ledger = root / "kids/data/quiz-v4-connected-flow-originals-ledger.json"
    pending_flow = set()
    if flow_ledger.is_file():
        flow = json.loads(flow_ledger.read_text(encoding="utf-8"))
        if (flow.get("modelId") != MODEL or flow.get("voiceId") != VOICE
                or flow.get("live") is not False
                or not isinstance(flow.get("entries"), list)):
            raise RuntimeError("Connected ElevenLabs paid-flow ledger invalid")
        statuses = {
            "RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED",
            "GENERATION_SUBMITTED_DO_NOT_RETRY",
            "GENERATED_AWAITING_ORIGINAL_MP3_IMPORT",
            "PROVIDER_REJECTED_NO_CHARGE_VERIFY",
            "IMPORTED_ORIGINAL_MP3_VERIFIED",
        }
        for item in flow["entries"]:
            spoken = item.get("sourceText")
            status = item.get("status")
            if (not isinstance(spoken, str) or not spoken
                    or item.get("sourceTextSHA256") != hashlib.sha256(
                        spoken.encode("utf-8")).hexdigest()
                    or item.get("modelId") != MODEL or item.get("voiceId") != VOICE
                    or status not in statuses or spoken in pending_flow):
                raise RuntimeError("Connected paid text identity/status mismatch")
            if spoken in reserved or (spoken in charged and status != "IMPORTED_ORIGINAL_MP3_VERIFIED"):
                raise RuntimeError("Connected V4 speech already paid through another source")
            if spoken in recorded and status != "IMPORTED_ORIGINAL_MP3_VERIFIED":
                raise RuntimeError("Connected pending MP3 conflicts with saved registry")
            if status == "IMPORTED_ORIGINAL_MP3_VERIFIED":
                original = recorded.get(spoken)
                if (not original or spoken not in charged
                        or original.get("sha256") != item.get("importedMP3SHA256")
                        or original.get("originalGenerationId") != item.get("generationId")):
                    raise RuntimeError("Connected audio claimed imported without verified MP3 and paid receipt")
            if status != "IMPORTED_ORIGINAL_MP3_VERIFIED":
                pending_flow.add(spoken)
    # An earlier provider POST may have consumed credits without ever
    # returning a confirmation or MP3. Protect its ORIGINAL source SHA too.
    # Never infer "unpaid" from the absence of a generated audio file.
    older_journal=root/"kids/data/quiz-v4-older-stage1-request-journal.json"
    uncertain=set()
    if older_journal.is_file():
        j=json.loads(older_journal.read_text(encoding="utf-8"))
        if j.get("modelId")!=MODEL or j.get("voiceId")!=VOICE or not isinstance(j.get("entries"),list):
            raise RuntimeError("Prior uncertain charged request journal malformed; no new synthesis")
        pending_hashes={r.get("textSHA256") for r in j["entries"]
                        if r.get("status")=="REQUEST_STARTED_UNCONFIRMED"}
        if None in pending_hashes:
            raise RuntimeError("Uncertain paid original lacks text SHA; stop")
        if pending_hashes:
            p=root/"kids/data/quiz-v4-curated-450-production-review.json"
            plan=json.loads(p.read_text(encoding="utf-8"))
            if len(plan.get("recipes",[]))!=450:
                raise RuntimeError("Uncertain paid original cannot be matched to source review")
            candidates=set()
            for row in plan["recipes"]:
                for part in ("question","correct","retry","explanation"):
                    rec=row[part]
                    candidates.add(rec["text"])
                    candidates.update(rec.get("segments",[]))
            for speech in candidates:
                if hashlib.sha256(speech.encode("utf-8")).hexdigest() in pending_hashes:
                    uncertain.add(speech)
            if {hashlib.sha256(text.encode("utf-8")).hexdigest() for text in uncertain}!=pending_hashes:
                raise RuntimeError("Unresolved provider request SHA not in canonical quiz; never repurchase")
            if uncertain & charged:
                raise RuntimeError("Uncertain paid original has been charged again; reconcile first")
    # Protect saved paid takes, the nine old Flow originals, reserved connected
    # Flow and uncertain POSTs before allowing ANY new text-to-speech request.
    return charged | reserved | set(recorded) | pending_flow | uncertain


def prohibit_prepaid_selection(spoken: str, protected: set[str]) -> None:
    if spoken in protected:
        raise RuntimeError("V4 original already paid, including unimported originals; do not regenerate")
