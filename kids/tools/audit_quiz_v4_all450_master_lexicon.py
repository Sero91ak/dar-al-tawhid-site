#!/usr/bin/env python3
"""Audit ALL curated 450 quiz audio texts against the authentic 10,099-rule PLS.

Zero ElevenLabs calls and zero speech credits. Reads source only; never changes
an approved question, spends money, claims Fuṣḥā quality or publishes the quiz.

The dictionary is de-DE. Fully vocalized Arabic is a SEPARATE Fuṣḥā clip,
never flattened into a German phonetic alias. Mixed segments need splitting
before a later authorized paid request.
"""
from __future__ import annotations

import collections
import hashlib
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
CONFIG=ROOT/"data/pronunciation/elevenlabs-production.json"
OUT=ROOT/"kids/review-only/quiz-v4-all450-master-dictionary-coverage.json"
PARTS=("question","correct","retry","explanation")
TRANSLIT=re.compile(r"[ʾʿāĀīĪūŪḥḤḍḌṣṢṭṬẓẒṯṮḏḎǧǦšŠġĠ]")
ARABIC=re.compile(r"[\u0621-\u064A]")
LATIN=re.compile(r"[a-zA-ZÀ-ÿ]")
TOKEN=re.compile(r"[\wʾʿĀāĪīŪūḤḥḌḍṢṣṬṭẒẓṮṯḎḏǦǧŠšĠġ-]+",re.UNICODE)
REQUIRED_ALIASES={
    "Qurʾān":"Qur-aan",
    "Īmān":"Iimaan",
    "Wuḍūʾ":"Wuduu",
    "Zakāh":"Zakaah",
    "Tawḥīd":"Tauhiid",
    "Āyat al-Kursī":"Aayat al-Kursii"
}

def fail(message):
    raise RuntimeError("KIDS_V4_MASTER_DICTIONARY_AUDIT_BLOCKED: "+message)

def sha_git_blob(raw):
    return hashlib.sha1(b"blob "+str(len(raw)).encode("ascii")+b"\x00"+raw).hexdigest()

def run():
    config=json.loads(CONFIG.read_text(encoding="utf-8"))
    d=config["pronunciationDictionary"]
    if config["modelId"]!="eleven_v4" or config["masterVoice"]["voiceId"]!="DkU7j9uO4ZEtLD2iRZSH":
        fail("Not canonical ElevenLabs V4 owner voice")
    raw=(ROOT/d["masterFile"]).read_bytes()
    if sha_git_blob(raw)!=d["gitBlobSha"]:
        fail("Original PLS Git blob hash changed")
    tree=ET.fromstring(raw)
    ns="{http://www.w3.org/2005/01/pronunciation-lexicon}"
    entries=tree.findall(ns+"lexeme")
    if len(entries)!=d["ruleCount"] or len(entries)!=10099:
        fail("Expected original 10,099-rule PLS")
    dictionary={}
    for e in entries:
        key=e.findtext(ns+"grapheme")
        alias=e.findtext(ns+"alias")
        if key:
            dictionary[unicodedata.normalize("NFC",key).casefold()]=alias
    for term,alias in REQUIRED_ALIASES.items():
        if dictionary.get(term.casefold())!=alias:
            fail("Missing or changed canonical pronunciation: "+term)

    plan=json.loads(PLAN.read_text(encoding="utf-8"))
    recipes=plan.get("recipes")
    if len(recipes)!=450 or len(set(q["questionId"] for q in recipes))!=450:
        fail("Not the reviewed 450 quiz recipe set")
    ages=collections.Counter(q["ageBand"] for q in recipes)
    if ages!={"4-6":150,"7-8":150,"9-10":150}:
        fail("450 age band count changed")

    used=collections.defaultdict(set)
    examples={}
    mixed=[]
    fully_arabic=[]
    all_fragments=set()
    for q in recipes:
        for kind in PARTS:
            part=q[kind]
            if not isinstance(part.get("text"),str):
                fail("Missing original quiz narration text")
            snippets=part.get("segments") or [part["text"]]
            for phrase in snippets:
                if not isinstance(phrase,str) or not phrase:
                    fail("Empty quiz original source phrase")
                all_fragments.add(phrase)
                if ARABIC.search(phrase):
                    row={"questionId":q["questionId"],"ageBand":q["ageBand"],
                         "part":kind,"fragmentSha256":hashlib.sha256(phrase.encode("utf-8")).hexdigest()}
                    if LATIN.search(phrase):
                        row["spokenText"]=phrase
                        mixed.append(row)
                    else:
                        fully_arabic.append(row)
                for match in TOKEN.finditer(phrase):
                    token=match.group(0).strip("-")
                    if not TRANSLIT.search(token):
                        continue
                    normalized=unicodedata.normalize("NFC",token).casefold()
                    used[normalized].add(q["questionId"])
                    examples.setdefault(normalized,{"questionId":q["questionId"],"spokenText":phrase})

    absent=[]
    keys=list(dictionary.keys())
    for term,qids in sorted(used.items()):
        if term in dictionary:
            continue
        if any(term in key for key in keys):
            continue
        absent.append({"term":term,"usedByQuestions":sorted(qids)[:20],
                       "uniqueQuestionCount":len(qids),
                       "firstOriginalContext":examples[term]})
    result={
        "schemaVersion":1,
        "scope":"KIDS_ALL_450_V4_OWNER_DICTIONARY_COVERAGE_READ_ONLY",
        "modelId":"eleven_v4",
        "voiceId":config["masterVoice"]["voiceId"],
        "dictionaryId":d["id"],
        "dictionaryVersionId":d["versionId"],
        "dictionaryRuleCount":len(entries),
        "selectedQuestions":len(recipes),
        "ageBreakdown":dict(ages),
        "distinctSourceSpeechFragments":len(all_fragments),
        "distinctArabicTransliterationTokens":len(used),
        "unmatchedTransliterationTokens":absent,
        "unmatchedTransliterationTokenCount":len(absent),
        "mixedGermanArabicSegmentsRequireSeparation":mixed,
        "nativeArabicSegmentsRequireFuṣḥāProfile":fully_arabic,
        "newSynthesisCalls":0,
        "newElevenLabsCreditsSpent":0,
        "publicReleaseEnabled":False,
        "humanArabicPronunciationApproved":False,
        "sourceContentModified":False
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Supply the exact unmatched tokens and source identifiers in the PRIVATE
    # GitHub Actions log. The full JSON is also a private CI artifact.
    # Do not invent aliases, edit original speech text or synthesize a test.
    print("KIDS_V4_ALL450_UNMATCHED_PRONUNCIATION_TERMS "+
          json.dumps(absent,ensure_ascii=False),flush=True)
    print("KIDS_V4_ALL450_NATIVE_FUSHA_MIXED_SEGMENTS "+
          json.dumps(mixed,ensure_ascii=False),flush=True)
    print("PASS_KIDS_V4_ALL_450_MASTER_DICTIONARY_AUDIT "+json.dumps({
        "selectedQuestions":450,
        "uniqueSourceSegments":len(all_fragments),
        "arabicTermsNotDirectlyCovered":len(absent),
        "mixedLanguageSegments":len(mixed),
        "nativeArabicSegments":len(fully_arabic),
        "newCredits":0,
        "publicRelease":False
    },ensure_ascii=False))

if __name__=="__main__":
    run()
