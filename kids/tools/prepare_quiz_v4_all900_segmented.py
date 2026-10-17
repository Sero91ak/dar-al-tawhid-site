#!/usr/bin/env python3
"""Build one authoritative, cost-deduplicated Eleven V4 narration plan for ALL 900 KIDS quiz questions.

NO TTS, NO HTTP, NO payment, NO production manifest or deployment changes.
All content derives from the already approved kids/data/quiz-kids.json and
kids/tools/quiz_joy_v4_script.py. Existing paid take IDs are reused verbatim.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from collections import Counter,defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_joy_v4_script import prepare,is_yes_no,normal
SOURCE=ROOT/"kids/data/quiz-kids.json"
PAID=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
OUTPUT=ROOT/"kids/data/quiz-v4-all900-segmented-review.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
PAUSE_MS=240
FIELDS=("questionAudioText","correctAudioText","retryAudioText","explanationAudioText")
PART_KEYS={"question":"questionAudioText","correct":"correctAudioText","retry":"retryAudioText","explanation":"explanationAudioText"}
Q2_PARTS={
    "question-opening":"Schau, was du schon alles weißt.",
    "question-core":"Ist Allah Einer?",
    "question-guidance":"Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein.",
}

def die(msg):raise RuntimeError(msg)

def answer_line(label,index):
    label=normal(label)
    return f"Antwort {index}: {label}"+("" if label.endswith((".","!","?","؟")) else ".")

def get_question_segments(q,prepared):
    title=normal(q["question"])
    choices=q["answers"]
    opts=" ".join(answer_line(a["label"],i) for i,a in enumerate(choices,1))
    core=title if q["ageBand"]=="4-6" and is_yes_no(q) else title+" "+opts
    text=prepared["questionAudioText"]
    idx=text.find(core)
    if idx<0:
        die(f"Question core not exact in spoken text: {q['id']}")
    intro=text[:idx].strip()
    rest=text[idx+len(core):].strip()
    # Extra-saving variant: answer labels and repeated response texts are
    # separately reusable; original audible wording stays byte-identical.
    split_core=[title]
    if not (q["ageBand"]=="4-6" and is_yes_no(q)):
        for i,a in enumerate(choices,1):
            label=normal(a["label"])
            suffix="" if label.endswith((".","!","?","؟")) else "."
            split_core.extend([f"Antwort {i}:",label+suffix])
    segments=[s for s in ([intro]+split_core+[rest]) if s]
    if " ".join(segments)!=text:
        die(f"Lossy sentence reconstruction: {q['id']}")
    if q["ageBand"]=="9-10" and intro:
        die(f"Older questions cannot have unexpected intro: {q['id']}")
    return segments

def old_takes():
    obj=json.loads(PAID.read_text(encoding="utf-8"))
    if len(obj.get("items",[]))!=20:
        die("Expected original 20 prior V4 questions, never silently lose paid work")
    paid_by_text={}
    q2_parts={}
    recorded_by_q={}
    for q in obj["items"]:
        if q["modelId"]!=MODEL or q.get("voiceId")!=VOICE:
            die("Paid 20 have unexpected V4 speaker/model")
        if q.get("audioQA")!="generated-pending-asset-import-and-human-listening":
            die("Paid V4 generation not confirmed complete "+q["questionId"])
        recorded_by_q[q["questionId"]]=q
        for r in q.get("recordings") or []:
            if r.get("modelId")!=MODEL or not r.get("generationId") or r.get("status") not in (None,"completed"):
                die("Paid voice segment has missing ID or incomplete status")
            part=r["part"]
            if q["questionId"]=="kids-quiz-002" and part in Q2_PARTS:
                q2_parts[Q2_PARTS[part]]=r["generationId"]
                continue
            field=PART_KEYS.get(part)
            if not field:die("Unknown paid segment type "+str(part))
            key=q[field]
            old=paid_by_text.get(key)
            if old and old!=r["generationId"]:
                # Identical text may have been recorded twice; preserve first known take.
                continue
            paid_by_text[key]=r["generationId"]
    if len(q2_parts)!=3:die("Q002 must reuse three existing paid fragments")
    if " ".join(Q2_PARTS.values())!=recorded_by_q["kids-quiz-002"]["questionAudioText"]:
        die("Q002 original 3-part contract mismatch")
    for k,v in q2_parts.items():paid_by_text.setdefault(k,v)
    return paid_by_text,recorded_by_q,q2_parts

def make():
    data=json.loads(SOURCE.read_text(encoding="utf-8"))
    questions=data["items"]
    if len(questions)!=900 or dict(Counter(q["ageBand"] for q in questions))!={"4-6":300,"7-8":300,"9-10":300}:
        die("Strict 900 quiz catalog / 3 ages x 300 missing")
    if len({q["id"] for q in questions})!=900 or len({q["number"] for q in questions})!=900:
        die("Duplicate quiz IDs or numbers")
    known,previous,q2_parts=old_takes()
    recipes=[]
    registry={}
    unique_full_texts=set()
    for q in questions:
        if q.get("reviewStatus")!="approved" or q.get("verification")!="approved" or q.get("status")!="published":
            die("Unapproved quiz catalog entry "+q["id"])
        if sum(bool(x.get("correct")) for x in q["answers"])!=1 or len(q["answers"])<2 or not q.get("source"):
            die("Invalid answer or source "+q["id"])
        prepared=prepare(q)
        if prepared["modelId"]!=MODEL or prepared["voiceProfileId"]!="serhat-owner-voice-2026":
            die("Unexpected voice profile/model in script")
        text={k:prepared[k] for k in FIELDS}
        if not all(text.values()):die("Missing full V4 text for "+q["id"])
        unique_full_texts.update(text.values())
        def use_segment(s,usage):
            s=normal(s)
            if not s:die("Empty segment")
            if s not in registry:
                gid=known.get(s)
                registry[s]={"text":s,"kind":usage,"characters":len(s),
                    "generationId":gid,"status":"paid-original-flow-unimported" if gid else "not-generated",
                    "usedBy":[],"ageBands":[]}
            entry=registry[s]
            entry["usedBy"].append(q["id"])
            if q["ageBand"] not in entry["ageBands"]:entry["ageBands"].append(q["ageBand"])
            return s
        def make_slot(kind,full,pieces):
            if full in known:
                return {"mode":"existing-paid-exact","text":full,"generationId":known[full]}
            if not pieces:die("Missing composition parts")
            if " ".join(pieces)!=full:
                die(f"Text reconstruction failed: {q['id']}:{kind}")
            for i,s in enumerate(pieces):
                use_segment(s,kind+"-fragment-"+str(i))
            pauses=[70 if piece.startswith("Antwort ") and piece.endswith(":") else PAUSE_MS
                    for piece in pieces[:-1]]
            return {"mode":"compose-from-segments","text":full,"segments":pieces,
                    "pauseAfterMs":pauses,"pauseBetweenPartsMs":PAUSE_MS}
        question_parts=get_question_segments(q,prepared)
        if q["id"]=="kids-quiz-002" and question_parts!=list(Q2_PARTS.values()):
            die("Original Q002 parts lost")
        explanation_intro="Das merken wir uns:"
        if text["explanationAudioText"]!=explanation_intro+" "+normal(q["explanation"]):
            die("Explanation context mismatch "+q["id"])
        slot_q=make_slot("question",text["questionAudioText"],question_parts)
        slot_ex=make_slot("explanation",text["explanationAudioText"],[explanation_intro,normal(q["explanation"])])
        slot_good=make_slot("correct",text["correctAudioText"],[text["correctAudioText"]])
        slot_retry=make_slot("retry",text["retryAudioText"],[text["retryAudioText"]])
        recipes.append({"questionId":q["id"],"number":q["number"],"ageBand":q["ageBand"],
                        "category":q["category"],"source":q["source"],"status":"review-only-not-live",
                        "question":slot_q,"correct":slot_good,"retry":slot_retry,"explanation":slot_ex})
    if len(recipes)!=900 or len(unique_full_texts)<900:
        die("Incomplete full text contracts")
    missing=[v for v in registry.values() if not v["generationId"]]
    reused=[v for v in registry.values() if v["generationId"]]
    lengths=sum(i["characters"] for i in missing)
    by_age={}
    for age in ("4-6","7-8","9-10"):
        used={t for t,v in registry.items() if age in v["ageBands"]}
        needed={t for t in used if not registry[t]["generationId"]}
        by_age[age]={"questions":300,"uniqueSegmentsInPlan":len(used),
                     "unrecordedUniqueSegments":len(needed),
                     "unrecordedCharactersIfProducedSeparately":sum(len(t) for t in needed)}
    allfull_unique_count=len(unique_full_texts)
    result={
        "schemaVersion":1,"purpose":"REVIEW_ONLY_NOT_LIVE_NO_TTS_SPEND",
        "createdAt":"2026-10-14","app":"TAWḤĪD KIDS","voiceId":VOICE,"modelId":MODEL,
        "catalog":"kids/data/quiz-kids.json","questionCount":900,
        "ageBandCounts":{"4-6":300,"7-8":300,"9-10":300},
        "fourSpeechFieldsPerQuestion":True,"totalSpokenFieldAssignments":3600,
        "uniqueUnsegmentedFullTexts":allfull_unique_count,
        "uniqueSegmentTexts":len(registry),
        "reusedPaidExistingSegmentTexts":len(reused),
        "newUniqueSegmentsRequired":len(missing),
        "newCharactersRequired":lengths,
        "estimatedAdditionalCreditsObservedRate":round(lengths*0.969066,2),
        "estimatedRateCreditsPerCharacter":0.969066,
        "statusAudioOriginalsImported":0,
        "statusQuestionsPublishedWithNewV4":0,
        "pauseBetweenPartsMs":PAUSE_MS,
        "aging":by_age,
        "costControl":{"maxQuestionsPerPaidBatch":2,"paidSynthesisEnabled":False,
          "oneTakePerUniqueText":True,"originalMP3ImportFirst":True,
          "unknownGenerationMustNotRetry":True,"listenReviewRequired":True,
          "testAppBeforeLive":True,"liveReleaseAllowed":False},
        "originalPaidGenerationIDs":sorted({r["generationId"] for q in previous.values() for r in q.get("recordings") or []}),
        "originalQ002GenerationIds":[q2_parts[k] for k in Q2_PARTS.values()],
        "segments":list(registry.values()),"recipes":recipes,
        "noDevLanguageInPublicApp":True
    }
    if len(result["originalPaidGenerationIDs"])!=56:
        die("Expected 56 unique previously paid original V4 takes")
    for recipe in recipes:
        if recipe["question"]["text"] is None or recipe["explanation"]["text"] is None:
            die("Missing reconstruction")
    return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true",help="Validate and calculate, do not write plan file")
    args=parser.parse_args()
    result=make()
    print("QUIZ_900_V4_VERIFIED "+json.dumps({
        k:result[k] for k in ("questionCount","ageBandCounts",
          "totalSpokenFieldAssignments","uniqueUnsegmentedFullTexts",
          "uniqueSegmentTexts","reusedPaidExistingSegmentTexts",
          "newUniqueSegmentsRequired","newCharactersRequired",
          "estimatedAdditionalCreditsObservedRate","statusAudioOriginalsImported",
          "statusQuestionsPublishedWithNewV4")},ensure_ascii=False),flush=True)
    if not args.check:
        OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("REVIEW_PLAN_CREATED "+str(OUTPUT),flush=True)

if __name__=="__main__":main()
