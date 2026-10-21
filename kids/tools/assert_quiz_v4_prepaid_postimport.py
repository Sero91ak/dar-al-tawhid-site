#!/usr/bin/env python3
"""Verify real historical V4 recovery after automatic private quiz reassembly.

Purely read-only assertions. NEVER call paid ElevenLabs speech, publish a
quiz, or treat synthetic sine-wave test clips as original paid voice audio.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
def data(p):return json.loads((ROOT/p).read_text(encoding="utf-8"))
def require(ok,message):
    if not ok:raise RuntimeError("KIDS_V4_PREPAID_IMPORT_INTEGRITY_FAIL: "+message)

def main():
    paid=data("kids/data/quiz-v4-paid-flow-import-status.json")
    young=data("kids/data/quiz-v4-first150-audio-status.json")
    mapped=data("kids/review-only/quiz-v4-450-actual-mp3-import-summary.json")
    originals=data("kids/data/quiz-v4-450-original-clip-registry.json")
    release=data("kids/data/quiz-curation-release.json")
    missing=paid["remainingPriorPaidGenerations"]
    require(paid["expectedPriorPaidGenerations"]==56 and
            paid["importedPriorPaidGenerations"]+missing==56,
            "the 56 historically paid Flow generation IDs were not preserved")
    require(missing==len(paid["remainingGenerationIds"]),
            "Flow missing-original count disagrees with specific generation IDs")
    require(originals["modelId"]=="eleven_v4"
            and originals["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH"
            and originals["live"] is False,
            "historical originals changed the master voice or were made live")
    require(release["enabled"] is False and young["readyForLive"] is False,
            "public preview or unfinished young quiz incorrectly enabled")
    require(mapped["questionsStaged"]==450 and
            mapped["completeFourPartQuestions"]+mapped["notCompleteFourPartQuestions"]==450,
            "all 450 selected questions must retain their playback mapping")
    bands=mapped["byAge"]
    require(bands["4-6"]["questions"]==150
            and bands["7-8"]["questions"]==150
            and bands["9-10"]["questions"]==150,
            "the three original 150-question age groups were changed")
    require(young["completeFourPartQuestions"]==
            bands["4-6"]["completeFourPartQuestions"],
            "young age preview is inconsistent with the 450 question map")
    if missing==0:
        require(young["completeFourPartQuestions"]==150,
                "56/56 genuine paid originals recovered but young quiz is NOT 150/150")
    require(not any(v.get("audioListeningApproved") is True
                    for v in originals["generationClips"].values()),
            "an imported Flow original was silently marked as human-audited")
    print("PASS: authenticated MP3 import mappings retained 450 age-separated "
          "question IDs, with source provenance and public release OFF. "
          f"Already-paid imported: {56-missing}/56. "
          f"Young four-part audio ready: {young['completeFourPartQuestions']}/150.")

if __name__=="__main__":main()
