#!/usr/bin/env python3
"""Zero-credit cost-prioritization for the 300 already selected older-age V4 quizzes.

This generates an internal, human-review-only *recording schedule*, never a
synthesis job. The canonical 900 questions and the curated 450+450 split
remain byte-equivalent as JSON. No voice credits and no public app changes.
"""
from __future__ import annotations
import hashlib,json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"kids/data"
OUT=ROOT/".github/reports/kids-v4-older-age-no-credit-priority.json"
PARTS=("question","correct","retry","explanation")
BANDS=("7-8","9-10")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
TARGET=20

def load(path): return json.loads(path.read_text(encoding="utf-8"))
def must(ok,message):
    if not ok: raise RuntimeError("KIDS older V4 cost safety: "+message)
def digest(txt):return hashlib.sha256(txt.encode("utf-8")).hexdigest()

def main():
    original=load(DATA/"quiz-kids.json")["items"]
    selected=load(DATA/"quiz-kids-curated-450-review.json")["items"]
    reserve=load(DATA/"quiz-kids-expansion-reserve-450.json")["items"]
    plan=load(DATA/"quiz-v4-curated-450-production-review.json")
    register=load(DATA/"quiz-v4-450-original-clip-registry.json")
    missing9=load(DATA/"quiz-v4-missing9-prepaid-originals.json")["items"]
    release=load(DATA/"quiz-curation-release.json")
    must(release.get("enabled") is False,"Live audio release unexpectedly enabled")
    must(plan.get("voiceId")==VOICE and plan.get("modelId")==MODEL and
         register.get("voiceId")==VOICE and register.get("modelId")==MODEL and
         register.get("live") is False,"V4 owner voice/model changed")
    must(len(original)==900 and len(selected)==450 and len(reserve)==450 and
         len(plan.get("recipes",[]))==450,"900/450+450 contract changed")
    canonical={q["id"]:q for q in original}
    chosen={q["id"]:q for q in selected}
    other={q["id"]:q for q in reserve}
    recipes={q["questionId"]:q for q in plan["recipes"]}
    must(len(canonical)==900 and len(chosen)==450 and len(other)==450 and
         len(recipes)==450,"Duplicate original or selected question IDs")
    must(not(set(chosen)&set(other)) and
         set(chosen)|set(other)==set(canonical)==set(recipes)|set(other),
         "Selected/remaining questions lost or overlap")
    must(all(canonical[i]==q for i,q in chosen.items()) and
         all(canonical[i]==q for i,q in other.items()),
         "Locked original quiz questions were modified")

    present=set(register["textClips"])
    paid_present=set(register["generationClips"])
    prepaid_missing={x["generationId"]:x["originalSpokenText"] for x in missing9}
    must(len(prepaid_missing)==9 and len(set(prepaid_missing.values()))==9,
         "Previously paid nine original recovery ledger changed")
    prepaid_texts=set(prepaid_missing.values())
    wanted={}
    for band in BANDS:
        subset=[q for q in plan["recipes"] if q["ageBand"]==band]
        must(len(subset)==150,"Need exactly 150 already selected "+band+" questions")
        for q in subset:
            missing=set()
            blocked=set()
            for k in PARTS:
                part=q[k]
                if part["mode"]=="existing-paid-exact":
                    id_=part["generationId"]
                    if id_ not in paid_present:
                        must(id_ in prepaid_missing,"Unknown existing paid audio generation")
                        blocked.add(id_)
                elif part["mode"]=="compose-from-segments":
                    seg=part["segments"]
                    must(bool(seg) and " ".join(seg)==part["text"] and
                         len(part.get("pauseAfterMs",[]))==len(seg)-1,
                         "V4 exact text or pause segment contract changed")
                    for t in seg:
                        if t in present:continue
                        if t in prepaid_texts:
                            blocked.update(id_ for id_,speech in prepaid_missing.items() if speech==t)
                        else:missing.add(t)
                else:raise RuntimeError("Unknown V4 part mode")
            wanted[q["questionId"]]={
                "questionId":q["questionId"],"ageBand":band,
                "category":str(q.get("category") or chosen[q["questionId"]].get("category") or ""),
                "missing":missing,"blocked":sorted(blocked)}
    must(len(wanted)==300,"Need all 300 older-age question recipes")
    all_new=set().union(*(v["missing"] for v in wanted.values()))
    must(not(all_new&present) and not(all_new&prepaid_texts),
         "Potentially charging again for already recorded/prepaid text")

    scheduled=[]
    by_band=Counter()
    by_category=Counter()
    scheduled_fragments=set()
    while any(by_band[band]<TARGET for band in BANDS):
        options=[]
        for id_,q in wanted.items():
            if id_ in scheduled or by_band[q["ageBand"]]>=TARGET:continue
            if q["blocked"] or not q["missing"]:continue
            add=q["missing"]-scheduled_fragments
            score=(sum(map(len,add)),
                   by_category[(q["ageBand"],q["category"])],
                   len(add),id_)
            options.append((score,q,add))
        must(bool(options),"Not enough nonblocked older-age questions to prioritize")
        _,q,add=min(options,key=lambda row:row[0])
        scheduled.append(q["questionId"])
        by_band[q["ageBand"]]+=1
        by_category[(q["ageBand"],q["category"])]+=1
        scheduled_fragments.update(add)
    must(len(scheduled)==TARGET*len(BANDS) and
         all(by_band[band]==TARGET for band in BANDS),"Unexpected schedule size")

    # Serialize reproducibly; only new texts are included, never originals
    # already paid, and no queued operation contacts ElevenLabs.
    by_question=[]
    all_reachable=set(present)|scheduled_fragments
    projection={}
    baseline={}
    for band in BANDS:
        subset=[q for q in wanted.values() if q["ageBand"]==band]
        baseline[band]=sum(not q["missing"] and not q["blocked"] for q in subset)
        projection[band]=sum(not q["blocked"] and q["missing"]<=all_reachable for q in subset)
    activated=set()
    used_categories=Counter()
    for index,id_ in enumerate(scheduled,1):
        q=wanted[id_]
        new=q["missing"]-activated
        activated.update(new)
        used_categories[(q["ageBand"],q["category"])]+=1
        by_question.append({
            "order":index,"questionId":id_,"ageBand":q["ageBand"],
            "category":q["category"],
            "missingOriginalTextCountForQuestion":len(q["missing"]),
            "incrementalDistinctNewOriginals":len(new),
            "incrementalNewCharacters":sum(map(len,new)),
            "newOriginalTextSHA256":[digest(t) for t in sorted(new)],
            "originalQuestionTextChanged":False,
            "maySynthesizeAutomatically":False,
        })
    must(activated==scheduled_fragments,"Greedy commitment reconstruction differs")
    missed=set(wanted)-set(scheduled)
    must(len(missed)==260,"Must retain 260 selected older-age questions for later")
    full_character_count=sum(map(len,all_new))
    batch_character_count=sum(map(len,scheduled_fragments))
    must(batch_character_count<=full_character_count,
         "Greedy planned batch cannot cost more characters than the total")
    # Separate the first 40 selected questions into two small sequential
    # human-review steps of exactly ten questions per age group. The second
    # step never repays for fragments already in the first.
    milestones=[]
    remaining_slots=dict.fromkeys(BANDS,0)
    first_chunk=[]
    next_chunk=[]
    for id_ in scheduled:
        band=wanted[id_]["ageBand"]
        if remaining_slots[band]<10:
            first_chunk.append(id_)
        else:
            next_chunk.append(id_)
        remaining_slots[band]+=1
    must(len(first_chunk)==20 and len(next_chunk)==20 and
         all(sum(wanted[id_]["ageBand"]==band for id_ in group)==10
             for band in BANDS for group in (first_chunk,next_chunk)),
         "Priority phases must contain ten questions per age")
    previously_planned=set()
    for batch_id,batch_ids in enumerate((first_chunk,next_chunk),1):
        unique=set().union(*(wanted[id_]["missing"] for id_ in batch_ids))
        incremental=unique-previously_planned
        previously_planned.update(incremental)
        must(not(incremental & present) and not(incremental & prepaid_texts),
             "Planned phase includes existing/previously paid original")
        expected_full={
            band:sum(not v["blocked"] and
                     v["missing"]<=previously_planned
                     for v in wanted.values() if v["ageBand"]==band)
            for band in BANDS}
        milestones.append({
            "stage":batch_id,"newQuestionsPerAgeBand":{band:10 for band in BANDS},
            "selectedQuestionIds":batch_ids,
            "newDistinctOriginals":len(incremental),
            "newOriginalCharacters":sum(map(len,incremental)),
            "incrementalOriginalTextSha256":[digest(t) for t in sorted(incremental)],
            "projectedFullFourPartQuestionsIfAllPreviousStageFilesVerified":expected_full,
            "creditsSpent":0,"automaticallyExecuted":False,
            "requiresManualApprovalAndHumanListening":True})
    must(previously_planned==scheduled_fragments and
         sum(step["newOriginalCharacters"] for step in milestones)==batch_character_count,
         "Two-phase character accounting must match the full forty-question plan")
    source_list=[
        {"spokenText":t,"sha256":digest(t),"characterCount":len(t),
         "usedInSelectedPriorityQuestions":sum(t in wanted[q]["missing"] for q in scheduled),
         "mustUseAuthorizedOriginalVoice":True,
         "synthesized":False}
        for t in sorted(scheduled_fragments)
    ]
    report={
        "schemaVersion":1,"app":"TAWḤĪD KIDS",
        "scope":"V4_OLDER_AGES_PRIVATE_NO_CREDIT_RECORDING_PRIORITY",
        "reviewOnly":True,"live":False,"authorizedNewPaidSynthesis":False,
        "newElevenLabsCreditsSpent":0,"humanListeningApproved":False,
        "original900AndCurated450Reserve450Verified":True,
        "speakerVoiceId":VOICE,"modelId":MODEL,
        "olderAgeQuestionCount":300,
        "selectedPriorityQuestionCount":len(scheduled),
        "priorityQuestionsPerAgeBand":dict(by_band),
        "remainingOlderAgeSelectedQuestions":len(missed),
        "baselineFullFourPartQuestions":baseline,
        "projectedFullQuestionsOnlyIfEveryListedAuthenticMP3IsLaterGeneratedAndVerified":projection,
        "allRemainingUnrecordedOlderAgeDistinctTextCount":len(all_new),
        "allRemainingUnrecordedOlderAgeCharacters":full_character_count,
        "newDistinctTextCountForFirst40":len(scheduled_fragments),
        "newCharactersForFirst40":batch_character_count,
        "priorityQuestionSteps":by_question,
        "twoIncrementalTenPerAgeReviewStages":milestones,
        "preciseUnrecordedOriginalTextQueue":source_list,
        "estimateIsCharacterCountNotElevenLabsCreditsOrBilling":True,
        "nextAction":"Manual pedagogical and cost approval required before any paid generation"
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_OLDER_AGE_PRIORITY_ZERO_CREDITS "+json.dumps({
        "questions":len(scheduled),"perAge":dict(by_band),
        "distinctNewTexts":len(scheduled_fragments),
        "newCharacters":batch_character_count,
        "allOlderUnrecordedTexts":len(all_new),
        "remainingQuestionIDsPreserved":len(missed),
        "elevenLabsCreditsSpent":0,"live":False
    },ensure_ascii=False),flush=True)

if __name__=="__main__":main()
