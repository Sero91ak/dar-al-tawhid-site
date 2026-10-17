#!/usr/bin/env python3
"""Produce reproducible 18 x 50 non-billable TAWḤĪD KIDS V4 work packets.

Never synthesizes or publishes. Each packet has exactly 50 questions of one
age-band, and only newly needed exact audio fragments. Cache is shared across
all 18 packets, preserving all previous purchased takes.
"""
from __future__ import annotations
import json
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-all900-segmented-review.json"
OUTPUT=ROOT/"kids/data/quiz-v4-all900-production-packets.json"
PARTS=("question","correct","retry","explanation")
AGES=("4-6","7-8","9-10")
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def main():
    p=json.loads(PLAN.read_text(encoding="utf-8"))
    if len(p["recipes"])!=900 or len(p["segments"])!=p["uniqueSegmentTexts"]:
        raise RuntimeError("No verified 900-quiz narration plan")
    if p["modelId"]!="eleven_v4" or p["voiceId"]!=VOICE:
        raise RuntimeError("Wrong master speaker or model")
    texts={item["text"]:item for item in p["segments"]}
    # These exact clips are already paid; retain IDs. Do not regenerate.
    known=set(k for k,v in texts.items() if v.get("generationId"))
    packets=[]
    for age in AGES:
        questions=[q for q in p["recipes"] if q["ageBand"]==age]
        if len(questions)!=300:
            raise RuntimeError("Expected exactly 300 questions in age "+age)
        for start in range(0,300,50):
            subset=questions[start:start+50]
            segment_uses={}
            paid_ids=set()
            for q in subset:
                for kind in PARTS:
                    item=q[kind]
                    if item["mode"]=="existing-paid-exact":
                        paid_ids.add(item["generationId"])
                    elif item["mode"]=="compose-from-segments":
                        if " ".join(item["segments"])!=item["text"]:
                            raise RuntimeError("Audio loses original narration: "+q["questionId"])
                        for part in item["segments"]:
                            if part not in texts:
                                raise RuntimeError("Segment not in authoritative cache: "+q["questionId"])
                            segment_uses.setdefault(part,[]).append(q["questionId"]+"#"+kind)
                    else:
                        raise RuntimeError("Unknown mode "+item["mode"])
            required=[k for k in segment_uses if k not in known]
            reused=[k for k in segment_uses if k in known]
            credits=round(sum(len(s) for s in required)*0.969066,2)
            packets.append({
                "packetNumber":len(packets)+1,
                "ageBand":age,
                "questions":len(subset),
                "firstQuestionId":subset[0]["questionId"],
                "lastQuestionId":subset[-1]["questionId"],
                "questionIds":[x["questionId"] for x in subset],
                "requiredPrepaidGenerationIDs":sorted(paid_ids),
                "newUniqueAudioClips":len(required),
                "reusedIdenticalAudioClips":len(reused),
                "newCharacters":sum(len(s) for s in required),
                "estimatedAdditionalCreditsAtObservedRate":credits,
                "newTextFragments":[{"text":part,"usedBy":segment_uses[part],
                                     "originalVoiceId":VOICE,"modelId":"eleven_v4",
                                     "generationId":None,"state":"not-generated-original-export-gated"}
                                    for part in required],
                "status":"READY_FOR_NONBILLABLE_REVIEW_ONLY",
                "paidSynthesisAuthorized":False,
                "assetsImported":False,
                "humanAudioApproved":False,
                "live":False
            })
            known.update(required)
    if len(packets)!=18 or sum(row["questions"] for row in packets)!=900:
        raise RuntimeError("Expected exactly 18 age-aligned 50-question packets")
    if len(set(id for row in packets for id in row["questionIds"]))!=900:
        raise RuntimeError("Questions repeated or missing across packets")
    missing_total=sum(row["newUniqueAudioClips"] for row in packets)
    char_total=sum(row["newCharacters"] for row in packets)
    if missing_total!=p["newUniqueSegmentsRequired"] or char_total!=p["newCharactersRequired"]:
        raise RuntimeError(f"Global packet dedup mismatch: {missing_total}/{char_total} vs {p['newUniqueSegmentsRequired']}/{p['newCharactersRequired']}")
    summary={age:{
        "packets":sum(1 for r in packets if r["ageBand"]==age),
        "questions":sum(r["questions"] for r in packets if r["ageBand"]==age),
        "newUniqueAudioClips":sum(r["newUniqueAudioClips"] for r in packets if r["ageBand"]==age),
        "newCharacters":sum(r["newCharacters"] for r in packets if r["ageBand"]==age),
        "estimatedCredits":round(sum(r["estimatedAdditionalCreditsAtObservedRate"] for r in packets if r["ageBand"]==age),2)
    } for age in AGES}
    result={
        "schemaVersion":1,"scope":"TAWḤĪD KIDS V4 900 / 18 PACKETS OF 50",
        "voiceId":VOICE,"modelId":"eleven_v4",
        "questionTotal":900,"packetCount":18,"questionsPerPacket":50,
        "newUniqueAudioClips":missing_total,"newCharacters":char_total,
        "estimatedCredits":round(char_total*0.969066,2),
        "estimatedRateNotProviderQuote":True,
        "originalMP3ExportGateRequiredBeforeAnySynthesis":True,
        "status":"REVIEW_ONLY_NO_SYNTHESIS_NO_LIVE",
        "ageBreakdown":summary,"packets":packets
    }
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    summary_path=ROOT/"kids/data/quiz-v4-all900-production-summary.json"
    summary_path.write_text(json.dumps({k:v for k,v in result.items() if k!="packets"},
       ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_900_PACKET_QA_PASS "+json.dumps({k:v for k,v in result.items() if k!="packets"},
       ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
