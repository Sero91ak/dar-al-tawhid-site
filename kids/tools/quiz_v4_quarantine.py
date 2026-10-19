#!/usr/bin/env python3
"""Fail-closed quarantine of already-paid but user-rejected V4 speech.

Do NOT erase paid receipts, drop generation IDs or re-buy originals. Exclude
their audio bytes from BOTH offline quiz composers and staging/playback.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


def quarantined_originals(root: Path):
    ledger=root/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
    rows=json.loads(ledger.read_text(encoding="utf-8")).get("entries")
    if not isinstance(rows,list):
        raise RuntimeError("V4 quarantined generation ledger unavailable; refuse playback assembly")
    blocked_texts=set()
    blocked_ids=set()
    for item in rows:
        if not item.get("blockedForQuizPlayback",False):
            continue
        speech=item.get("sourceText")
        digest=item.get("sourceTextSHA256")
        gid=item.get("generationId")
        if (not isinstance(speech,str) or not speech
            or hashlib.sha256(speech.encode("utf-8")).hexdigest()!=digest
            or not isinstance(gid,str) or not gid
            or item.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH"
            or item.get("modelId")!="eleven_v4"
            or item.get("blockedForPublicRelease") is not True):
            raise RuntimeError("V4 quarantined paid original has invalid voice, SHA or release protection")
        blocked_texts.add(speech)
        blocked_ids.add(gid)
    return blocked_texts,blocked_ids


def blocked_full_utterances(recipes,blocked_texts,blocked_ids):
    """Even an old composite cache must never bypass the underlying ban."""
    bad=set()
    for question in recipes:
        for kind in ("question","correct","retry","explanation"):
            part=question[kind]
            if (part.get("generationId") in blocked_ids
                    or any(seg in blocked_texts for seg in part.get("segments",[]))):
                bad.add(part["text"])
    return bad
