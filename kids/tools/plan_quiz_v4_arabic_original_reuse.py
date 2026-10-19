#!/usr/bin/env python3
"""Exact zero-credit Arabic Fuṣḥā segmentation plan for all 450 KIDS V4 quiz items.

Treat every original display text and its SHA as immutable. A German phrase
with 'عليه السلام' or ﷺ MUST be divided into native Arabic and German audio
segments instead of being sent wholesale to the German pronunciation dictionary.

One canonical vocalized Arabic master asset may be reused for *all* matches,
but no MP3 exists, no generation is authorized by this report, and human
pronunciation approval remains required before public quiz playback.
"""
from __future__ import annotations
import collections, hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
OUT=ROOT/"kids/review-only/quiz-v4-arabic-fusha-shared-audio-plan.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
PARTS=("question","correct","retry","explanation")
CANONICAL={
  "عليه السلام": "عَلَيْهِ السَّلَامُ",
  "ﷺ": "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ"
}
SPLIT=re.compile(r"(عليه السلام|ﷺ)")
ARABIC=re.compile(r"[\u0621-\u064A]|ﷺ")
LATIN=re.compile(r"[a-zA-ZÀ-ÿ]")

def hash_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def split_exact(text):
    pieces=SPLIT.split(text)
    assert "".join(pieces)==text
    out=[]
    for piece in pieces:
        if not piece:
            continue
        if piece in CANONICAL:
            out.append({"displayText":piece,"spokenText":CANONICAL[piece],
                        "languageCode":"ar","dictionaryProfile":"NATIVE_VOCALIZED_FUSHA_NO_DE_PLS",
                        "spokenTextSHA256":hash_text(CANONICAL[piece])})
        else:
            if ARABIC.search(piece):
                raise RuntimeError("Unrecognized Arabic fragment; do not bill TTS")
            if not LATIN.search(piece) and piece.strip():
                # punctuation, whitespace, etc. are retained as original display
                pass
            out.append({"displayText":piece,"spokenText":piece.strip(),
                        "languageCode":"de","dictionaryProfile":"PINNED_DE_10099_RULE_MASTER",
                        "spokenTextSHA256":hash_text(piece.strip())})
    assert "".join(x["displayText"] for x in out)==text
    return out


def run():
    assert json.loads(RELEASE.read_text(encoding="utf-8"))["enabled"] is False
    data=json.loads(PLAN.read_text(encoding="utf-8"))
    questions=data.get("recipes")
    assert len(questions)==450 and len({q["questionId"] for q in questions})==450
    rows=[]
    needed=collections.defaultdict(set)
    for q in questions:
        for part in PARTS:
            text=q[part]["text"]
            if not ARABIC.search(text):
                continue
            segments=split_exact(text)
            if not any(x["languageCode"]=="ar" for x in segments):
                raise RuntimeError("Unplanned Arabic V4 source")
            for x in segments:
                if x["languageCode"]=="ar":
                    needed[x["spokenText"]].add(q["questionId"])
            rows.append({"questionId":q["questionId"],"ageBand":q["ageBand"],
                         "audioPart":part,"originalSourceText":text,
                         "originalSourceSHA256":hash_text(text),
                         "segments":segments,"sourceStillImmutable":True,
                         "originalHumanAudioApproval":False})
    assert len(rows)>0
    sources=[
      {"sourceText":k,"spokenFushaText":v,
       "sourceTextSHA256":hash_text(k),"spokenFushaSHA256":hash_text(v),
       "usedByDistinctQuizQuestions":len(needed.get(v,set())),
       "modelId":"eleven_v4","voiceId":"DkU7j9uO4ZEtLD2iRZSH",
       "languageCode":"ar","pronunciationDictionaryLocators":[],
       "requiresRealMP3AndHumanPronunciationApproval":True,
       "alreadyRecordedByThisPlanner":False}
      for k,v in CANONICAL.items()
    ]
    report={
      "schemaVersion":1,
      "scope":"KIDS_450_V4_ARABIC_FUSHA_SHARED_PRONUNCIATION_PLAN_NO_TTS",
      "selectedQuestions":450,
      "reviewOnly":True,"publicRelease":False,
      "approvedVisibleQuizTextModified":False,
      "masterGermanDictionaryRuleCount":10099,
      "arabicMasterNewSpeechSourceCountAtMost":len(CANONICAL),
      "affectedAudioParts":len(rows),
      "arabicAudioSources":sources,
      "items":rows,
      "newPaidGenerationCalls":0,
      "newCreditsSpent":0,
      "voiceGenerationAuthorized":False,
      "humanListeningApproved":False}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_450_ARABIC_FUSHA_SHARED_AUDIO_PLAN "+
          json.dumps({"selectedQuestions":450,"affectedAudioParts":len(rows),
                      "distinctCanonicalFushaMasterTexts":len(CANONICAL),
                      "reusableUsesBySource":{item["sourceText"]:item["usedByDistinctQuizQuestions"] for item in sources},
                      "noNewCredits":True,"publicRelease":False},ensure_ascii=False))


if __name__=="__main__":
    run()
