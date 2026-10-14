#!/usr/bin/env python3
"""TAWḤĪD KIDS: deterministic editorial shortlist, 150 for EACH age group.

Preserves ALL 900 approved original questions, their answers, sources and IDs.
Keeps all 20 already paid ElevenLabs V4 questions in the first 450 to avoid
duplicate charges. Writes three separate REVIEW-ONLY JSON files.

No TTS. No external downloads. Does not modify the 900-question canonical
source, production app, or any public audio manifest.

Outputs:
  kids/data/quiz-kids-curated-450-review.json
  kids/data/quiz-kids-expansion-reserve-450.json
  kids/data/quiz-v4-curated-450-production-review.json
"""
from __future__ import annotations

import json,math,re
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"kids/data/quiz-kids.json"
FULL_PLAN=ROOT/"kids/data/quiz-v4-all900-segmented-review.json"
PAID=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
ACTIVE=ROOT/"kids/data/quiz-kids-curated-450-review.json"
RESERVE=ROOT/"kids/data/quiz-kids-expansion-reserve-450.json"
VOICE_PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
AGES=("4-6","7-8","9-10")
CORE_PRIORITY={
 "Tawḥīd":1.4,"Īmān":1.3,"Qurʾān":1.3,"Ṣalāh":1.3,
 "Duʿāʾ":1.2,"Sunnah":1.18,"Wissen":1.1,
 "Ṣawm":1.13,"Zakāh":1.13,"Fiqh":1.12,"Ākhirah":1.10,
 "Adab":1.07,"Aḫlāq":1.06,"Iḥsān":1.08,"Islam":1.2,
 "Dhikr":1.09,"Tawbah":1.10,"Tawakkul":1.04,
 "Ṣadaqah":1.08,"Dankbarkeit":1.02,"Schöpfung":0.97,
}
PARTS=("question","correct","retry","explanation")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def topic_root(q):
    s=q.get("topic") or q["question"]
    s=re.sub(r"\s*·\s*(?:Alltag|Verständnis|Anwendung|Vertiefung|Übung|Wissen)\s*\d+\s*$","",s,flags=re.I)
    return " ".join(s.lower().split())

def quality(q):
    # Curation heuristic only, not a scholarly source-verification claim.
    n=int(q["number"])
    age=q["ageBand"]
    qtext=q["question"]
    desired={"4-6":51,"7-8":68,"9-10":90}[age]
    length_penalty=abs(len(qtext)-desired)*0.12
    duplicate_style = 5 if re.search(r"·\s*(?:Alltag|Verständnis)\s*[2-9]$",q["topic"]) else 0
    if n<=50: intro=4.5
    elif n<=180: intro=3.5
    elif n<=400: intro=2.5
    else:intro=1.0
    simple_question=3 if len(qtext)<105 else 0
    strong_source=2 if q["sourceType"] in ("Qurʾān","Ṣaḥīḥ Ḥadīth") else 0
    return round(CORE_PRIORITY.get(q["category"],1.0)*20 + intro +
                 simple_question+strong_source-length_penalty-duplicate_style,5)

def select_age(rows,pinned):
    if len(rows)!=300:raise RuntimeError("Expected 300 per age group")
    pool={q["id"]:q for q in rows}
    counts=Counter(q["category"] for q in rows)
    # Cap any one topic area at 25/150, without dropping any source category.
    cap={cat:min(n,max(2,min(25,math.ceil(n/2)+3))) for cat,n in counts.items()}
    selected=[]
    chosen=set()
    cat_count=Counter()
    topic_count=Counter()
    scene_count=Counter()
    def add(q):
        if q["id"] in chosen:raise RuntimeError("Duplicate selection")
        chosen.add(q["id"]);selected.append(q)
        cat_count[q["category"]]+=1
        topic_count[topic_root(q)]+=1
        scene_count[q["scene"]]+=1
    for id in pinned:
        if id in pool:add(pool[id])
    # Ensure EVERY category is represented if it exists in a band.
    for cat in sorted(counts, key=lambda c:(-CORE_PRIORITY.get(c,1),c)):
        if cat_count[cat]:continue
        target=max((q for q in rows if q["category"]==cat and q["id"] not in chosen),
                   key=lambda q:(quality(q),-q["number"]))
        add(target)
    while len(selected)<150:
        options=[q for q in rows if q["id"] not in chosen and cat_count[q["category"]]<cap[q["category"]]]
        if not options:
            raise RuntimeError("Quota limits prevent exactly 150 questions")
        def ranking(q):
            dup=topic_count[topic_root(q)]
            context_penalty=min(dup,3)*7.0
            cat_density=cat_count[q["category"]]/max(1,cap[q["category"]])
            return (quality(q)-context_penalty-9*cat_density-
                    0.07*scene_count[q["scene"]],-q["number"])
        add(max(options,key=ranking))
    if len(selected)!=150 or not set(pinned).issubset(chosen):
        raise RuntimeError("Incomplete curation or lost paid recordings")
    return selected,{"ageBand":rows[0]["ageBand"],"picked":150,
                     "categoriesSelected":dict(sorted(cat_count.items())),
                     "categoriesSource":dict(sorted(counts.items())),
                     "retainedPreviouslyPaid":sum(1 for x in pinned if x in chosen),
                     "sourceNumbers":sorted(q["number"] for q in selected)}

def main():
    catalog=json.loads(SOURCE.read_text(encoding="utf-8"))
    original=catalog["items"]
    if len(original)!=900 or Counter(q["ageBand"] for q in original)!=Counter({"4-6":300,"7-8":300,"9-10":300}):
        raise RuntimeError("Canonical source must remain exactly 900/300-300-300")
    fullplan=json.loads(FULL_PLAN.read_text(encoding="utf-8"))
    prior=json.loads(PAID.read_text(encoding="utf-8"))
    if len(fullplan.get("recipes",[]))!=900 or len(prior.get("items",[]))!=20:
        raise RuntimeError("Voice plan or original paid take history unavailable")
    if fullplan.get("voiceId")!=VOICE or fullplan.get("modelId")!=MODEL:
        raise RuntimeError("Wrong voice or model")
    pinned={q["questionId"] for q in prior["items"]}
    if len(pinned)!=20:raise RuntimeError("Expected 20 original already-paid quiz IDs")
    selected=[];report={}
    for age in AGES:
        rows=[q for q in original if q["ageBand"]==age]
        chosen,meta=select_age(rows,sorted(pinned & {q["id"] for q in rows}))
        selected.extend(chosen);report[age]=meta
    keys={q["id"] for q in selected}
    if len(selected)!=450 or len(keys)!=450 or not pinned.issubset(keys):
        raise RuntimeError("450 unique questions or paid IDs not preserved")
    # Keep original chronological order to simplify old progress deep-links.
    active=[q for q in original if q["id"] in keys]
    reserve=[q for q in original if q["id"] not in keys]
    if len(active)!=450 or len(reserve)!=450:raise RuntimeError("Invalid partition")
    if {q["id"] for q in reserve}&keys:raise RuntimeError("Overlap in active/reserve")
    if {q["id"] for q in active+reserve}!={q["id"] for q in original}:
        raise RuntimeError("Lost a canonical original quiz")
    for q in active+reserve:
        if (q.get("status"),q.get("reviewStatus"),q.get("verification"))!=("published","approved","approved"):
            raise RuntimeError("Source item not approved: "+q["id"])
        if not q.get("source") or sum(bool(a.get("correct")) for a in q["answers"])!=1:
            raise RuntimeError("Quiz answer/source invalid "+q["id"])
    common={"schemaVersion":1,"app":"TAWḤĪD KIDS","selectedAt":"2026-10-14",
            "canonicalSource":"kids/data/quiz-kids.json","canonicalTotal":900,
            "ageBands":{"4-6":150,"7-8":150,"9-10":150},
            "preservesOriginalIds":True,"sourceTextsUnmodified":True,
            "audioPublication":"blocked-until-audio-hash-and-human-QA",
            "selectionMethod":"v1 reproducible multi-category, repetition-averse algorithm; editorial QA pending"}
    ACTIVE.write_text(json.dumps({**common,"purpose":"CURATED_450_AUDIO_FIRST_REVIEW_NOT_LIVE",
         "items":active,"selection":report},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    RESERVE.write_text(json.dumps({**common,"purpose":"ARCHIVED_450_QUIZZES_FOR_NEXT_EXPANSION",
         "items":reserve},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    recipes=[r for r in fullplan["recipes"] if r["questionId"] in keys]
    if len(recipes)!=450 or Counter(r["ageBand"] for r in recipes)!=Counter({"4-6":150,"7-8":150,"9-10":150}):
        raise RuntimeError("Selected V4 speech plan did not preserve 150/150/150")
    by_text={s["text"]:s for s in fullplan["segments"]}
    texts={}
    paid_exact=set()
    for q in recipes:
        for kind in PARTS:
            slot=q[kind]
            if slot["mode"]=="existing-paid-exact":
                paid_exact.add(slot["generationId"])
                continue
            if " ".join(slot["segments"])!=slot["text"]:
                raise RuntimeError("Exact reconstructed pronunciation broken "+q["questionId"])
            for phrase in slot["segments"]:
                texts[phrase]=by_text[phrase]
    missing=[t for t,s in texts.items() if not s.get("generationId")]
    known=[t for t,s in texts.items() if s.get("generationId")]
    charsum=sum(len(t) for t in missing)
    by_age={}
    for age in AGES:
        part=[r for r in recipes if r["ageBand"]==age]
        phrases={t for r in part for kind in PARTS for t in (r[kind].get("segments") or [])}
        to_speak=[t for t in phrases if not by_text[t].get("generationId")]
        by_age[age]={"questions":len(part),"uniqueRequiredAudioSegments":len(phrases),
                     "unrecordedUniqueFragmentsBeforeCrossAgeDedup":len(to_speak),
                     "newCharsBeforeCrossAgeDedup":sum(len(t) for t in to_speak)}
    voice={
         "schemaVersion":1,"app":"TAWḤĪD KIDS",
         "status":"REVIEW_ONLY_NOT_SYNTHESIZED_NOT_LIVE",
         "questions":450,"ageBandCounts":{"4-6":150,"7-8":150,"9-10":150},
         "voiceId":VOICE,"modelId":MODEL,"totalSpeechFieldAssignments":1800,
         "uniqueFullAudioKeys":len({r[kind]["text"] for r in recipes for kind in PARTS}),
         "newUniqueFragments":len(missing),"newCharacters":charsum,
         "creditEstimate":round(charsum*0.969066,2),
         "estimateSource":"Prior observed V4 credits per source-character, not provider quote",
         "alreadyPaidDistinctFullGenerationIds":len(paid_exact),
         "reusePaidPartsInSegmentRegistry":len(known),
         "allOld20PaidQuestionsRetained":True,
         "offlineMP3ImportSupported":True,
         "originalAudioFilesImported":0,"listeningApproved":0,
         "permissionToPublish":False,
         "blockedBy":"ElevenLabs API 402 paid_plan_required on original Flow MP3 export",
         "byAge":by_age,
         "selectedQuestionIds":[q["id"] for q in active],
         "pendingAudioFragments":[{"text":t,"characters":len(t),
             "usedBy":[q["id"] for q in active if any(t in (r.get("segments") or [])
                      for r in [next(x for x in recipes if x["questionId"]==q["id"])[k] for k in PARTS])],
             "modelId":MODEL,"voiceId":VOICE,"generated":False} for t in missing],
         "recipes":recipes
    }
    VOICE_PLAN.write_text(json.dumps(voice,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Age-by-age incremental costs reuse text snippets once across the ENTIRE academy.
    produced={t for t,s in texts.items() if s.get("generationId")}
    incremental={}
    for age in AGES:
        parts=[r for r in recipes if r["ageBand"]==age]
        needed={t for r in parts for part in PARTS
                  for t in (r[part].get("segments") or [])}
        fresh=needed-produced
        incremental[age]={"questions":150,"newUniqueClips":len(fresh),
                          "newChars":sum(len(t) for t in fresh),
                          "creditsEstimated":round(sum(len(t) for t in fresh)*0.969066,2)}
        produced.update(fresh)
    if sum(x["newChars"] for x in incremental.values())!=charsum:
        raise RuntimeError("Incremental age-by-age budget differs from full curated total")
    summary={"schemaVersion":1,"scope":"TAWḤĪD KIDS 450 AUDIO-FIRST",
             "selection":{"4-6":150,"7-8":150,"9-10":150},
             "reserve":{"4-6":150,"7-8":150,"9-10":150},
             "savedFiles":{"active":"kids/data/quiz-kids-curated-450-review.json",
                           "reserve":"kids/data/quiz-kids-expansion-reserve-450.json",
                           "fullOriginal":"kids/data/quiz-kids.json",
                           "audioPlan":"kids/data/quiz-v4-curated-450-production-review.json"},
             "selectedIDs":[q["id"] for q in active],
             "reservedIDs":[q["id"] for q in reserve],
             "uniqueFullSpokenTexts":voice["uniqueFullAudioKeys"],
             "newUniqueSegmentClips":len(missing),
             "newV4Characters":charsum,"estimatedAdditionalCredits":voice["creditEstimate"],
             "perAgeIncremental":incremental,
             "previous20PaidPreserved":True,"published":False,
             "originalMP3ExportBlocked":True,"nextCommand":"Quizfragen erweitern",
             "futureExpansion":"Reuse saved reserve questions and existing full900 audio plan; never rewrite original questions or regenerate paid clips"}
    (ROOT/"kids/data/quiz-v4-curated-450-summary.json").write_text(
         json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_450_CURATION_QA_PASS "+json.dumps({
       "chosen":len(active),"remaining":len(reserve),
       "ageBands":voice["ageBandCounts"],"allOld20":True,
       "spokenFieldAssignments":voice["totalSpeechFieldAssignments"],
       "uniqueFullAudioKeys":voice["uniqueFullAudioKeys"],
       "missingSegments":len(missing),"newCharacters":charsum,
       "estimatedV4Credits":voice["creditEstimate"],
       "categoryCoverage":{age:len(report[age]["categoriesSelected"]) for age in AGES}
    },ensure_ascii=False),flush=True)
if __name__=="__main__":
    main()
