#!/usr/bin/env python3
"""Read-only 450-question editorial integrity audit for TAWḤĪD KIDS.

This is not a theological fact-check or a human listening approval.
It checks the immutable 900→450+450 partition, question/answer structure,
source presence, grade assignment, duplicates and audio text contracts.
Only internal JSON/CSV reports are written, never public quiz manifests.
Zero network access, no speech generation, no deployment.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAT = ROOT / "kids/data/quiz-kids.json"
SEL = ROOT / "kids/data/quiz-kids-curated-450-review.json"
RES = ROOT / "kids/data/quiz-kids-expansion-reserve-450.json"
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
OUT = ROOT / "kids/review-only/quiz-v4-450-editorial-integrity.json"
CSV = ROOT / "kids/review-only/quiz-v4-450-editorial-checklist.csv"
COUNTS = {"4-6":150, "7-8":150, "9-10":150}
AGES = {"4-6":(4,6), "7-8":(7,8), "9-10":(9,10)}
PARTS = ("question","correct","retry","explanation")
MODEL = "eleven_v4"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def norm(s):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", str(s)).casefold()).strip(" .?!؟؛,;:«»\"'–—")


def run():
    source = load(CAT)
    selected = load(SEL)
    reserve = load(RES)
    plan = load(PLAN)
    release = load(FLAG)
    canonical = source["items"]
    rows = selected["items"]
    archived = reserve["items"]
    recipes = plan["recipes"]
    errors = []
    notices = []
    warnings_by_id = defaultdict(list)
    def error(text):
        errors.append(text)
    def notice(qid, text):
        warnings_by_id[qid].append(text)
        notices.append({"questionId":qid,"issue":text})

    if release.get("enabled") is not False:
        error("Review-only catalog should remain disabled before 450 full release")
    if len(canonical)!=900 or len(rows)!=450 or len(archived)!=450:
        error("Expected 900=450 selected+450 reserved questions")
    if Counter(q.get("ageBand") for q in rows)!=Counter(COUNTS):
        error("Selected catalog is not 150 for each age")
    if Counter(q.get("ageBand") for q in archived)!=Counter(COUNTS):
        error("Reserved catalog is not 150 for each age")
    for label,arr,count in (("canonical",canonical,900),("selected",rows,450),("reserve",archived,450)):
        ids=[q.get("id") for q in arr]
        if len(ids)!=count or len(set(ids))!=len(ids):
            error(label+": IDs missing or repeated")
    canon={q.get("id"):q for q in canonical}
    selids={q.get("id") for q in rows}
    archiveids={q.get("id") for q in archived}
    if selids&archiveids or selids|archiveids!=set(canon):
        error("Selected+reserved do not form an exact canonical partition")
    for q in rows+archived:
        qid=q.get("id")
        if qid not in canon or q!=canon[qid]:
            error("Canonical immutable question changed: "+str(qid))

    if (plan.get("modelId")!=MODEL or plan.get("voiceId")!=VOICE
            or len(recipes)!=450):
        error("V4 speech plan has incorrect model, voice or question count")
    recipe_ids=[q.get("questionId") for q in recipes]
    if set(recipe_ids)!=selids or len(set(recipe_ids))!=len(recipe_ids):
        error("V4 speech recipe IDs differ from selected questions")
    recipe_by_id={r.get("questionId"):r for r in recipes}
    by_question=defaultdict(list)
    by_category=Counter()
    source_types=Counter()
    for q in rows:
        qid=q.get("id")
        age=q.get("ageBand")
        by_category[(age,str(q.get("category","")))] += 1
        source_types[str(q.get("sourceType",""))] += 1
        if age not in AGES or (q.get("ageMin"),q.get("ageMax"))!=AGES.get(age):
            error("Wrong age limits for "+str(qid))
        for field in ("question","explanation","category","topic","source","sourceType"):
            if not isinstance(q.get(field),str) or not q[field].strip():
                error("Missing "+field+" for "+str(qid))
        answers=q.get("answers")
        if not isinstance(answers,list) or not 2<=len(answers)<=5:
            error("Unusable answer count for "+str(qid))
            continue
        if sum(a.get("correct") is True for a in answers)!=1:
            error("Correct-answer count not exactly one for "+str(qid))
        if len({norm(a.get("label")) for a in answers})!=len(answers):
            error("Identical answer options for "+str(qid))
        if not all(isinstance(a.get("label"),str) and a["label"].strip() for a in answers):
            error("Empty answer label for "+str(qid))
        if len({a.get("id") for a in answers})!=len(answers):
            error("Repeated option IDs for "+str(qid))
        original_question=norm(q.get("question",""))
        if not original_question:
            continue
        by_question[(age,original_question)].append(qid)
        if len(q["question"].strip())>230:
            notice(qid,"Question unusually long for spoken quiz (>230 characters)")
        if len(q["explanation"].strip())>650:
            notice(qid,"Explanation unusually long for spoken quiz (>650 characters)")
        if not isinstance(q.get("source"),str) or len(q["source"].strip())<4:
            notice(qid,"Source citation too short; check exact work/ayah/hadith")
        recipe=recipe_by_id.get(qid)
        if recipe is None:
            error("No V4 speech recipe for "+str(qid))
            continue
        if recipe.get("ageBand")!=age:
            error("V4 recipe changed age group: "+str(qid))
        for part in PARTS:
            slot=recipe.get(part)
            if not isinstance(slot,dict) or not isinstance(slot.get("text"),str) or not slot["text"].strip():
                error("Missing V4 "+part+" speech text for "+str(qid))
                continue
            mode=slot.get("mode")
            if mode=="compose-from-segments":
                segments=slot.get("segments")
                if not isinstance(segments,list) or not segments or " ".join(segments)!=slot["text"]:
                    error("V4 spoken text changes when joining segments: "+str(qid)+"/"+part)
            elif mode=="existing-paid-exact":
                if not slot.get("generationId"):
                    error("Old paid original has no generation receipt: "+str(qid)+"/"+part)
            else:
                error("Unexpected V4 audio composition mode: "+str(qid)+"/"+part)

    repeated={age+" / "+key:ids for (age,key),ids in by_question.items() if len(ids)>1}
    for joined,ids in repeated.items():
        for qid in ids: notice(qid,"Near-identical question in same age group: "+",".join(ids))
    report={
        "schemaVersion":1,
        "scope":"TAWHID_KIDS_450_FINAL_EDITORIAL_AUDIT_REVIEW_ONLY",
        "counts":{"canonical":len(canonical),"selected":len(rows),"reserve":len(archived),
                  "byAge":dict(Counter(q.get("ageBand") for q in rows)),
                  "recipes":len(recipes)},
        "voiceId":VOICE,"modelId":MODEL,
        "structuralPass":not errors,
        "hardErrors":errors,
        "editorialFlags":notices,
        "duplicateQuestionGroupsWithinAge":repeated,
        "sourceTypes":dict(source_types),
        "categoriesByAge":{age:{cat:n for (a,cat),n in by_category.items() if a==age} for age in AGES},
        "sourceCitationsHumanVerifiedByThisAudit":False,
        "theologicalAccuracyHumanVerifiedByThisAudit":False,
        "speechPronunciationHumanApprovedByThisAudit":False,
        "elevenLabsCreditsSpent":0,"publicReleaseEnabled":False
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    with CSV.open("w",encoding="utf-8",newline="") as file:
        writer=csv.writer(file)
        writer.writerow(("id","ageBand","category","question","correctAnswer",
                         "explanation","sourceType","source","editorialFlags",
                         "sourceReviewedByHuman","arabicPronunciationReviewedByHuman"))
        for q in rows:
            correct=next((a.get("label","") for a in q.get("answers",[]) if a.get("correct") is True),"")
            writer.writerow((q.get("id",""),q.get("ageBand",""),q.get("category",""),
                q.get("question",""),correct,q.get("explanation",""),q.get("sourceType",""),
                q.get("source","")," / ".join(warnings_by_id[q.get("id")]),"NO","NO"))
    print(json.dumps({k:report[k] for k in ("counts","structuralPass",
          "hardErrors","duplicateQuestionGroupsWithinAge",
          "sourceTypes","elevenLabsCreditsSpent")},ensure_ascii=False,indent=2))
    print("EDITORIAL_FLAGS="+str(len(notices)))
    return 0 if not errors else 2


if __name__=="__main__":
    raise SystemExit(run())
