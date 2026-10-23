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
    # User pronunciation review also covers direct paid MP3 originals that
    # were generated outside ElevenLabs Creative Flow. Keep the original MP3,
    # request receipt and SHA intact; reject only their quiz/playback approval.
    owner_hold=root/"kids/data/quiz-v4-owner-pronunciation-hold-20261021.json"
    if owner_hold.is_file():
        approval=json.loads(owner_hold.read_text(encoding="utf-8"))
        registry=json.loads((root/"kids/data/quiz-v4-450-original-clip-registry.json")
                            .read_text(encoding="utf-8"))
        originals=approval.get("originals")
        if (approval.get("modelId")!="eleven_v4"
            or approval.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH"
            or not isinstance(originals,list) or len(originals)!=7
            or registry.get("modelId")!="eleven_v4"
            or registry.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH"):
            raise RuntimeError("Owner V4 pronunciation hold/registry invalid; no quiz playback")
        seen=set()
        for item in originals:
            spoken=item.get("sourceText")
            saved=(registry.get("textClips") or {}).get(spoken)
            if (not isinstance(spoken,str) or not spoken or spoken in seen
                or not saved or saved.get("sha256")!=item.get("mp3Sha256")
                or saved.get("url")!=item.get("audioUrl")
                or saved.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH"
                or saved.get("modelId")!="eleven_v4"
                or item.get("blockedForQuizPlayback") is not True
                or item.get("blockedForPublicRelease") is not True
                or item.get("retainPaidOriginal") is not True
                or item.get("allowBlindRegeneration") is not False
                or item.get("ownerFeedback") not in
                    ("owner_rejected","owner_listening_review_requested")):
                raise RuntimeError("Owner-rejected V4 MP3 changed; no quiz playback")
            seen.add(spoken)
            blocked_texts.add(spoken)
    # Owner specifically rejected the inflected "Halāle/Halālen" text and
    # pronunciation in 3 Kids questions. This applies also to old original
    # caches: retain exact paid receipts, but refuse playback and reuse.
    correction_path=root/"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json"
    if correction_path.is_file():
        correction=json.loads(correction_path.read_text(encoding="utf8"))
        sources=correction.get("blockedSourceTexts")
        old=correction.get("oldPaidRejectedContextOriginal") or {}
        if (correction.get("wordToDisplayAndSpeakExactly")!="Halal"
            or correction.get("ownerCorrectionDate")!="2026-10-23"
            or correction.get("affectedQuestionIds")!=[
                "kids-quiz-109","kids-quiz-131","kids-quiz-271"]
            or not isinstance(sources,list) or len(sources)!=5
            or len(set(sources))!=5
            or "Halāle und gute Nahrung." not in sources
            or not all(any(w in source for w in (
                "Halāle","Halālen","halāle","halālen")) for source in sources)
            or old.get("ownerPronunciationRejected") is not True
            or old.get("approvedForPlayback") is not False
            or old.get("publicReleaseAllowed") is not False
            or correction.get("newCorrectedAudioGenerated") is not False
            or correction.get("publicReleaseAllowed") is not False):
            raise RuntimeError("Owner rejected Halal pronunciation source receipt invalid")
        oldpath=(root/str(old.get("originalURL","")).lstrip("/")).resolve()
        if (not oldpath.is_relative_to((root/"kids/assets/kids-quiz-audio").resolve())
            or not oldpath.is_file()
            or hashlib.sha256(oldpath.read_bytes()).hexdigest()!=old.get("originalSha256")):
            raise RuntimeError("Owner rejected paid Halal trial MP3 receipt unavailable")
        blocked_texts.update(sources)
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
