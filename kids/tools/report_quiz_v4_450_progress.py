#!/usr/bin/env python3
"""TAWḤĪD KIDS 450 release board. No synthesis, no live changes.

Separately reports selected QUESTIONS versus real ORIGINAL MP3 clips, and
does not mistake a generated audio fragment for a fully playable question.
"""
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"kids/data/quiz-v4-450-production-status.json"
PLANNED=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
SELECTED=ROOT/"kids/data/quiz-kids-curated-450-review.json"
RESERVED=ROOT/"kids/data/quiz-kids-expansion-reserve-450.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
QA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
PARTS=("question","correct","retry","explanation")

def load(path):
    if not path.exists():return {}
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    planned=load(PLANNED);sel=load(SELECTED).get("items") or []
    res=load(RESERVED).get("items") or []
    reg=load(REGISTRY);led=load(LEDGER);qa=load(QA)
    if len(sel)!=450 or len(res)!=450 or len(planned.get("recipes") or [])!=450:
        raise RuntimeError("Curated 450+450 locked catalog is missing")
    clips=reg.get("textClips") or {}
    good={t for t,v in clips.items() if v.get("audioListeningApproved") is True}
    available=set(clips)
    paid_gen=reg.get("generationClips") or {}
    def available_slot(row,kind,human=False):
        x=row[kind]
        if x["mode"]=="existing-paid-exact":
            clip=paid_gen.get(x["generationId"])
            return isinstance(clip,dict) and (not human or clip.get("audioListeningApproved") is True)
        if x["mode"]!="compose-from-segments":raise RuntimeError("Unsupported V4 contract")
        return all((t in good if human else t in available) for t in x["segments"])
    counts={}
    for age in ("4-6","7-8","9-10"):
        rows=[q for q in planned["recipes"] if q["ageBand"]==age]
        if len(rows)!=150:raise RuntimeError("Incorrect selected question age count")
        present=sum(all(available_slot(q,k) for k in PARTS) for q in rows)
        approved=sum(all(available_slot(q,k,human=True) for k in PARTS) for q in rows)
        counts[age]={"selectedQuestions":150,"sourceQuestionsSavedForLater":150,
                    "completeAllFourOriginalAudios":present,
                    "allFourHumanListeningApproved":approved}
    complete=sum(v["completeAllFourOriginalAudios"] for v in counts.values())
    heard=sum(v["allFourHumanListeningApproved"] for v in counts.values())
    ledger=led.get("rows") or []
    report={"schemaVersion":1,"app":"TAWḤĪD KIDS","scope":"450 audio-first quiz release",
        "originalQuizCatalogCount":900,"selectedTotal":450,"reservedTotal":450,
        "sourceAndArchivePreserved":True,"modelId":"eleven_v4",
        "totalSelectedSpeechAssignments":1800,
        "uniqueNewSegmentTarget":planned["newUniqueFragments"],
        "uniqueNewOriginalMP3sStored":len(available),
        "uniqueSegmentsStillWithoutOriginalMP3":len(
            {x["text"] for x in planned["pendingAudioFragments"]}-available),
        "priorPaidFlowOriginalCount":56,
        "priorPaidFlowOriginalsNotRecovered":max(0,56-len(paid_gen)),
        "savedMP3TechnicallyAudited":qa.get("savedClipCount",0)
           if qa.get("overallTechnicalPass") else 0,
        "savedMP3HumanListeningApproved":len(good),
        "completedQuestionsWithAllFourAudioParts":complete,
        "questionsHumanListeningApproved":heard,
        "estimatedAdditionalCreditsForFullSelected450":planned["creditEstimate"],
        "estimatedCreditsForAlreadyStoredDirectOriginals":round(sum(
             float(x.get("estimatedCreditsAtObservedRate") or 0) for x in ledger),2),
        "exactProviderChargesNotFullyReconciled":True,
        "ageBreakdown":counts,
        "appReleaseFlagEnabled":load(ROOT/"kids/data/quiz-curation-release.json").get("enabled") is True,
        "all450AudioReadyToPublish":heard==450,
        "livePublished":False,
        "remaining450StoredForLater":True,
        "nextExpansionCommand":"Quizfragen erweitern"}
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_450_V4_PROGRESS "+json.dumps({k:v for k,v in report.items() if k!="ageBreakdown"},ensure_ascii=False),flush=True)
if __name__=="__main__":
    main()
