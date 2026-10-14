#!/usr/bin/env python3
"""Create/verify the complete FIRST 300 age 4–6 KIDS quiz V4 speech plan.
No synthesis. Never modifies the published app, questions or audio manifest.
Run: python3 kids/tools/prepare_quiz_v4_age_4_6_300.py
"""
import json, sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_joy_v4_script import prepare

QUIZ=ROOT/"kids/data/quiz-kids.json"
PREVIOUS=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
OUTPUT=ROOT/"kids/data/quiz-v4-age4-6-300-review.json"
KEYS=("questionAudioText","correctAudioText","retryAudioText","explanationAudioText")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def main():
    source=json.loads(QUIZ.read_text(encoding="utf-8"))
    catalog=source["items"]
    if len(catalog)!=900 or Counter(q["ageBand"] for q in catalog)!={"4-6":300,"7-8":300,"9-10":300}:
        raise RuntimeError("Unrecognized 900-question three-age source")
    originals=[q for q in catalog if q["ageBand"]=="4-6"]
    if len(originals)!=300 or len({q["id"] for q in originals})!=300:
        raise RuntimeError("Exactly 300 unique age-4-6 IDs required")
    old=json.loads(PREVIOUS.read_text(encoding="utf-8"))
    prior={q["questionId"]:q for q in old["items"]}
    out=[]
    full_scripts={}
    for q in originals:
        if q["status"]!="published" or q["reviewStatus"]!="approved" or q["verification"]!="approved":
            raise RuntimeError("Unapproved primary source: "+q["id"])
        if len([a for a in q["answers"] if a["correct"]])!=1 or not q.get("source"):
            raise RuntimeError("Invalid answers/source for "+q["id"])
        item=prepare(q)
        if any(not item[k] for k in KEYS) or item["ageBand"]!="4-6":
            raise RuntimeError("Incomplete voice contract for "+q["id"])
        previous=prior.get(q["id"])
        if previous:
            for k in KEYS:
                if item[k]!=previous[k]:raise RuntimeError(f"V4 text mismatch: {q['id']} {k}")
            item["alreadyPaidGenerationIds"]=[r["generationId"] for r in previous.get("recordings",[]) if r.get("generationId")]
            item["paidClipsPrepared"]=len(item["alreadyPaidGenerationIds"])>=4
        else:
            item["alreadyPaidGenerationIds"]=[]
            item["paidClipsPrepared"]=False
        item["voiceId"]=VOICE
        item["modelId"]=MODEL
        item["existingFullAudioInApp"]=False
        item["readyForLive"]=False
        for field in KEYS:
            full_scripts.setdefault(item[field],[]).append([q["id"],field])
        out.append(item)
    audio_ready_count=sum(x["paidClipsPrepared"] for x in out)
    unique_by_part={field:len({x[field] for x in out}) for field in KEYS}
    new_unique=sum(1 for text,uses in full_scripts.items() if not any(prior.get(id) and any(
        r.get("generationId") and (
            (r["part"]=="question" and part=="questionAudioText" and id!="kids-quiz-002") or
            (r["part"]=="correct" and part=="correctAudioText") or
            (r["part"]=="retry" and part=="retryAudioText") or
            (r["part"]=="explanation" and part=="explanationAudioText")
        ) for r in prior[id].get("recordings",[]))
        for id,part in uses))
    report={
       "schemaVersion":1,"scope":"FIRST_300_AGE_4_6",
       "catalogQuestions":900,"ageBand":"4-6",
       "totalQuestions":300,"speechPartsPerQuestion":4,
       "totalSpeechContracts":1200,
       "uniqueSpeechTextsAllParts":len(full_scripts),
       "uniqueTextsPerPart":unique_by_part,
       "estimatedUniqueNotYetRecorded":new_unique,
       "previousPaidClipSetsCount":audio_ready_count,
       "humanListeningApproved":0,
       "publishedWithNewV4Audio":0,
       "importedAssets":0,
       "voiceId":VOICE,"modelId":MODEL,
       "releaseStatus":"REVIEW_ONLY_NOT_LIVE",
       "costlyRenderingEnabled":False,
       "requiredBeforeRelease":"Actual audio bytes from each generation, sha256, playable offline manifest, listening+pronunciation QA, staging checks, explicit final gate",
       "items":out
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS V4 AGE 4-6 QA PASS "+json.dumps({k:v for k,v in report.items() if k!="items"},ensure_ascii=False),flush=True)

if __name__=="__main__":main()
