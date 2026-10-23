#!/usr/bin/env python3
"""Fail-closed remaining-20 source/receipt report for 450 KIDS V4.
Uses only immutable saved MP3s and actual provider receipts; spends zero credits,
does not alter released website/app or pretend owner accepted audio phonetics.
"""
from __future__ import annotations
import hashlib,json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
LEGACY=ROOT/"kids/review-only/quiz-v4-450-remaining21-audio-blocker-ledger-20261022.json"
STATUS=ROOT/"kids/data/quiz-v4-450-production-status.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
FLOW=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
OUTPUT=ROOT/"kids/review-only/quiz-v4-450-exact-remaining20-master-v4-20261023.json"
MD=ROOT/"kids/review-only/KIDS-V4-450-OFFENE-20-20261023.md"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
JOURNALS={
 "q031-three":"kids/review-only/quiz-v4-q031-three-german-paid-once-journal.json",
 "q041-two":"kids/review-only/quiz-v4-q041-two-german-paid-once-journal.json",
}
CATEGORIES={
 "NEW_V4_REQUIRED_AFTER_APPROVED_PILOT",
 "RESERVED_UNCONFIRMED_TTS",
 "QUARANTINED_PRONUNCIATION",
 "PREVIOUS_PROVIDER_REQUEST_UNCONFIRMED_DO_NOT_REBUY",
}
def read(path):return json.loads(path.read_text(encoding="utf8"))
def require(ok,msg):
    if not ok: raise RuntimeError("KIDS_V4_REMAINING20_SOURCE_REVIEW_STOP: "+msg)
def digest(source):return hashlib.sha256(source.encode("utf8")).hexdigest()

def main():
    legacy,status,reg,flow,paid,hold,release=map(read,
        (LEGACY,STATUS,REG,FLOW,PAID,HOLD,RELEASE))
    require(status["completedQuestionsWithAllFourAudioParts"]==430,
            "must be 430/450 actual validated MP3s, do not relabel older state")
    require(status["uniqueNewOriginalMP3sStored"]==1800
            and status["savedMP3TechnicallyAudited"]==1800,
            "all 1800 originals must be in registry + technically passed")
    require(status["ageBreakdown"]["4-6"]["completeAllFourOriginalAudios"]==150
            and status["ageBreakdown"]["7-8"]["completeAllFourOriginalAudios"]==144
            and status["ageBreakdown"]["9-10"]["completeAllFourOriginalAudios"]==136,
            "age counts changed, re-audit sources")
    require(reg["modelId"]==MODEL and reg["voiceId"]==VOICE and reg["live"] is False
            and flow["modelId"]==MODEL and flow["voiceId"]==VOICE
            and paid["live"] is False,"original model/voice/review state diverged")
    require(hold["productionPaused"] and not hold["paidSpeechAuthorized"]
            and not hold["humanPronunciationApproved"]
            and not hold["publicQuizAudioReleaseAuthorized"]
            and not hold["ownerRestartAuthorized"] and not release["enabled"],
            "pronunciation and live release hold must not be bypassed")
    require(legacy["technicallyCompleted"]==429 and len(legacy["openQuestions"])==21
            and legacy["missingDistinctFragments"]==33,
            "frozen historical 21 questions changed; stop")
    registry=reg["textClips"]
    paid_rows={x["text"]:x for x in paid["rows"]}
    protected={e["sourceText"]:e for e in flow["entries"]}
    new={}
    for name,filename in JOURNALS.items():
        journal=read(ROOT/filename)
        expected=3 if name=="q031-three" else 2
        require(len(journal["providerRequests"])==expected
                and journal["status"] in
                ("THREE_GERMAN_ORIGINALS_SAVED_PRIVATE_REVIEW",
                 "TWO_GERMAN_ORIGINALS_SAVED_PRIVATE_REVIEW"),
                "source generation journal incomplete "+name)
        for entry in journal["providerRequests"]:
            t=entry["sourceText"]
            require(t not in new and entry["status"]=="ORIGINAL_MP3_SAVED_PRIVATE_REVIEW",
                    "unconfirmed/duplicate paid original")
            meta=registry.get(t)
            require(meta and meta["sha256"]==entry["originalMP3Sha256"]
                    and meta["textSha256"]==digest(t)
                    and meta["voiceId"]==VOICE and meta["modelId"]==MODEL
                    and meta["url"]==entry["originalMP3"],
                    "provider original wrong source/voice/SHA")
            require(meta.get("bytes")==entry["bytes"]
                    and paid_rows.get(t,{}).get("mp3Sha256")==meta["sha256"]
                    and protected[t]["importedMP3SHA256"]==meta["sha256"]
                    and protected[t]["status"]=="DIRECT_MASTER_V4_DICTIONARY_MP3_IMPORTED_REVIEW_ONLY",
                    "billing/source not verified")
            p=(ROOT/meta["url"].lstrip("/")).resolve()
            require(p.is_relative_to(ROOT/"kids/assets/kids-quiz-audio") and p.is_file(),
                    "unsafe/original unavailable")
            raw=p.read_bytes()
            require(len(raw)==entry["bytes"]
                    and hashlib.sha256(raw).hexdigest()==meta["sha256"],
                    "original MP3 bytes changed")
            require(not meta.get("audioListeningApproved"),"owner approval cannot be inferred")
            new[t]={"sha256":meta["sha256"],"bytes":len(raw),"url":meta["url"],
                    "sourceTextSHA256":digest(t),"sourcePaidJournal":filename}
    require(len(new)==5,"exactly five newly imported previous reserved source clips")
    left=[];seen=set()
    counts=Counter()
    per_question=[]
    for q in legacy["openQuestions"]:
        blocked=[]
        for part in q["missingFragments"]:
            word=part["text"]
            if word in new:
                require(part["blocker"]=="RESERVED_UNCONFIRMED_TTS",
                        "new German original not previously reserved; possible false claim")
                continue
            require(part["blocker"] in CATEGORIES,"unrecognized source blocker")
            require(word not in new and word not in registry
                    or part["blocker"]=="QUARANTINED_PRONUNCIATION",
                    "source present but not recorded as quarantined; re-audit")
            source=dict(part)
            source["sourceTextSHA256"]=digest(word)
            blocked.append(source)
            counts[part["blocker"]]+=1
            if word not in seen:
                seen.add(word)
                left.append({"text":word,"sha256":digest(word),"blocker":part["blocker"],
                   "reviewOnly":True,"newProviderChargeApproved":False})
        if blocked:
            require(q["questionId"]!="kids-quiz-031","already completed quiz 031 remains incorrectly blocked")
            per_question.append({
                "questionId":q["questionId"],"ageBand":q["ageBand"],
                "stillMissingFragments":blocked,
                "missingFieldTypes":list(dict.fromkeys(x["part"] for x in blocked)),
                "requiresHumanFuṣḥāQualityApproval":True,
                "publicReleaseAllowed":False})
    require(len(per_question)==20 and len(seen)==28 and sum(counts.values())==29,
            "expected 20 questions, 28 unique missing source texts / 29 usages")
    require(counts=={
       "NEW_V4_REQUIRED_AFTER_APPROVED_PILOT":15,
       "RESERVED_UNCONFIRMED_TTS":3,
       "QUARANTINED_PRONUNCIATION":10,
       "PREVIOUS_PROVIDER_REQUEST_UNCONFIRMED_DO_NOT_REBUY":1},
       "category counts changed: review before further provider calls")
    require(Counter(q["ageBand"] for q in per_question)=={"7-8":6,"9-10":14},
            "20 age-band question assignments drifted")
    output={
       "schemaVersion":2,"reportDate":"2026-10-23",
       "scope":"KIDS_V4_450_PRIVATE_REVIEW_ONLY_ACTUAL_REMAINING20",
       "branch":"review/kids-v4-nine-prepaid-artifact-replay-20261022",
       "total450":450,"actualFourPartCompleted":430,
       "stillNotFourPartComplete":20,
       "sourceOriginalClipsStoredAndTechnicallyAudited":1800,
       "newlyImportedHistoricalOriginalsCount":5,
       "newlyImportedOriginals":new,
       "remainingSourceTextReferences":29,"remainingDistinctSourceTexts":28,
       "remainingSourceClassificationReferences":dict(counts),
       "remainingSourceClassificationDistinct":dict(Counter(x["blocker"] for x in left)),
       "remainingAgeBands":{"7-8":6,"9-10":14},
       "missingSourceTexts":left,
       "questions":per_question,
       "voiceId":VOICE,"modelId":MODEL,
       "humanApprovedQuestions":0,"newCreditSpendingAuthorized":False,
       "pronunciationProductionOnHold":True,
       "approvedForPublicQuiz":False,"releasedToVisitors":False,
       "all450Ready":False,
       "nextActions":[
          "Secure human listening approval of new native Fuṣḥā pilot without pretending dictionary metadata proves correct articulation",
          "Resolve old quarantined/original source clips by actual source-specific listening, preserve receipts and do not rebuy",
          "Reconcile the one unconfirmed historical provider request before any repeat billing",
          "Produce only missing source fragments with pinned owner voice, model and exact phonetic approval; SHA-journal every provider request",
          "Verify 450/450 four-part playable master audio with native app and child comprehension tests before release"
       ]}
    OUTPUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    lines=["# DĀR AL TAWḤĪD KIDS · genaue 20 offene V4-Quizfragen",
     "",
     "**430/450** technisch vierteilig vollständig · **20** Fragen unvollständig · **28** unterschiedliche Sprechtexte offen.",
     "Die fünf neu erzeugten echten Master-V4-Dateien sind in GitHub gespeichert und technisch geprüft.",
     "Arabische Aussprache, Fuṣḥā, Makhāriǧ, Ḥarakāt und ggf. Qurʾān-Rezitation bleiben gesperrt, bis echte Hörfreigabe vorliegt.",
     "**Kein öffentlicher Push. Keine neuen ElevenLabs-Credits durch diesen Bericht.**",""]
    for q in per_question:
        lines.append("## "+q["questionId"]+" · "+q["ageBand"]+" Jahre")
        for item in q["stillMissingFragments"]:
            lines.append("- "+item["part"]+" · "+item["blocker"]+" · "+item["text"])
        lines.append("")
    MD.write_text("\n".join(lines)+"\n",encoding="utf8")
    print("PASS_KIDS_V4_EXACT_REMAINING20 "+json.dumps({
      "done":430,"missingQuestions":len(per_question),
      "distinctMissing":len(left),"missingReferences":sum(counts.values()),
      "existingMasterOriginalsAudited":1800,"historicOriginalsRecovered":len(new),
      "newSpeechRequests":0,"newCredits":0,"humanApproved":0,"released":False},
      ensure_ascii=False),flush=True)
if __name__=="__main__":main()
