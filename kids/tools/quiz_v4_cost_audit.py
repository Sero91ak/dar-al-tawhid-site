#!/usr/bin/env python3
"""Read-only budget report for all 900 Serhat V4 Kids Quiz prompts.

Counts characters, not actual credits. Estimates ignore per-account plan,
pronunciation expansion, re-rendering and any already-available V4 files.
Does not contact ElevenLabs, generate audio, or alter manifests.
"""
from __future__ import annotations
from collections import defaultdict
import json
from pathlib import Path
from quiz_joy_v4_script import prepare, segment_plan

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"kids/data/quiz-kids.json"
FIELDS=("questionAudioText","correctAudioText","retryAudioText","explanationAudioText")
PROFILES={"4-6":"quiz_4_6","7-8":"quiz_7_8","9-10":"quiz_9_10"}

def profile_for(q:dict,key:str)->str:
    return PROFILES[q["ageBand"]] if key=="questionAudioText" else "quiz_feedback"

def report()->dict:
    data=json.loads(DATA.read_text(encoding="utf-8"))
    qs=data["items"]
    if len(qs)!=900:raise ValueError("Expected exactly 900 Kids Quiz questions")
    before=set()
    after=set()
    counts=defaultdict(int)
    question_chars=defaultdict(int)
    for q in qs:
        audio=prepare(q)
        parts=segment_plan(q)
        band=q["ageBand"]
        counts[band]+=1
        for field in FIELDS:
            p=profile_for(q,field)
            before.add((p,audio[field]))
            question_chars[field]+=len(audio[field])
            for phrase in parts[field]:
                after.add((p,phrase))
            if " ".join(parts[field])!=audio[field]:
                raise ValueError(f"Full-text mismatch at {q['id']} {field}")
    # The existing Quiz completion message is shared and generated once.
    completion=("quiz_feedback","Sehr gut. Du hast das Quiz geschafft.")
    before.add(completion)
    after.add(completion)
    before_chars=sum(len(s) for _,s in before)
    after_chars=sum(len(s) for _,s in after)
    saved=before_chars-after_chars
    return {
      "scope":"kids-quiz-all-900-no-paid-synthesis",
      "model":"eleven_v4",
      "voice":"Serhat Abu Malik – Master",
      "questions":len(qs),
      "ageBands":dict(counts),
      "wholeClipUniqueTexts":len(before),
      "wholeClipUniqueTextCharacters":before_chars,
      "phraseUniqueTextsByProfile":len(after),
      "phraseUniqueTextCharacters":after_chars,
      "charactersSaved":saved,
      "estimatedCharacterSavingPct":round(100*saved/before_chars,2),
      "totalUnsharedCharactersBeforeDedup":sum(question_chars.values()),
      "creditEstimateCaution":"character counts only; V4 credits are plan-dependent; exact billing is API estimate/usage, not this report",
      "naturalnessQA":"manual review of joined age bands and pronunciation required before mass production"
    }

if __name__=="__main__":
    print(json.dumps(report(),ensure_ascii=False,indent=2))
