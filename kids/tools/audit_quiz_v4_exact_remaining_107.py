#!/usr/bin/env python3
"""Exact, zero-credit, source-faithful account of all unfinished KIDS V4 quizzes.

Inspect the already-staged real four-part MP3 map, immutable 450 recipes,
the genuine original registry, two shared native Arabic master originals,
the owner's seven rejected takes, and all earlier charged/reserved receipts.
NEVER synthesize, mark a fake MP3 as ready, or publish. Rerunnable at any count.
"""
from __future__ import annotations
import collections, hashlib, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_v4_quarantine import quarantined_originals
from quiz_v4_native_fusha_reuse import load_mapping
from generate_quiz_v4_450_paid_batch02 import source_requires_separate_pronunciation_approval
P=ROOT/"kids"
PARTS=("question","correct","retry","explanation")
OUT=P/"review-only/quiz-v4-current-unfinished-questions-source-audit.json"

def load(path):
    return json.loads((ROOT/path).read_text(encoding="utf-8"))
def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
def require(test,why):
    if not test:raise RuntimeError("KIDS_V4_LAST107_SOURCE_AUDIT_STOP: "+why)

def run():
    stage=load("kids/review-only/quiz-v4-450-actual-mp3-import.json")
    summary=load("kids/review-only/quiz-v4-450-actual-mp3-import-summary.json")
    plan=load("kids/data/quiz-v4-curated-450-production-review.json")
    registry=load("kids/data/quiz-v4-450-original-clip-registry.json")
    nine=load("kids/data/quiz-v4-missing9-prepaid-originals.json")
    flow=load("kids/data/quiz-v4-connected-flow-originals-ledger.json")
    journal=load("kids/data/quiz-v4-older-stage1-request-journal.json")
    production=load("kids/data/quiz-v4-450-production-status.json")
    release=load("kids/data/quiz-curation-release.json")
    blocked,blocked_gens=quarantined_originals(ROOT)
    native,native_assets=load_mapping(ROOT)
    require(release.get("enabled") is False and registry.get("live") is False,
            "only private review allowed")
    require(stage.get("publicReleaseEnabled") is False and
            stage.get("humanListeningApproved") is False,
            "staging release flag or hearing verdict changed")
    require(len(plan["recipes"])==450 and len(stage["questions"])==450 and
            summary["questionsStaged"]==450, "not the canonical 450")
    originals=registry["textClips"]
    generations=registry["generationClips"]
    by_id={q["questionId"]:q for q in plan["recipes"]}
    old_by_id={x["generationId"]:x for x in nine["items"]}
    old_by_text={x["originalSpokenText"]:x for x in nine["items"]}
    pending_flow={x["sourceText"]:x for x in flow["entries"]
                  if x["status"]!="IMPORTED_ORIGINAL_MP3_VERIFIED"}
    uncertain={x["textSHA256"] for x in journal["entries"]
               if x["status"]=="REQUEST_STARTED_UNCONFIRMED"}
    require(len(old_by_id)==9 and len(uncertain)>=1,
            "paid original / uncertain request protection missing")
    require(sum(bool(row["fourPartTechnicallyReady"]) for row in stage["questions"].values())
            ==summary["completeFourPartQuestions"]
            ==production["completedQuestionsWithAllFourAudioParts"],
            "source-of-truth count differs; fail closed")
    require(all(row["humanListeningApproved"] is False for row in stage["questions"].values()),
            "human approval cannot be inferred from technical decoding")
    text_use=collections.defaultdict(lambda:{"parts":0,"questions":set(),"category":None})
    categories=collections.defaultdict(set)
    incomplete=[]
    def classify(text):
        if text in blocked:return "OWNER_QUARANTINED_PRONUNCIATION"
        if text in old_by_text:return "OLDER_ALREADY_PAID_NINE_ORIGINAL"
        if text in pending_flow:return "EXISTING_RESERVED_CONNECTED_FLOW"
        if sha(text) in uncertain:return "PAID_REQUEST_UNCONFIRMED_NO_RETRY"
        if source_requires_separate_pronunciation_approval(text):
            return "OWNER_MASTER_PRONUNCIATION_VERIFICATION_REQUIRED"
        return "UNRECORDED_ORIGINAL_NEW_CREDIT_REVIEW_REQUIRED"
    for qid,stage_q in stage["questions"].items():
        if stage_q["fourPartTechnicallyReady"]:continue
        recipe=by_id[qid]
        missing_parts={}
        seen=set()
        for kind in stage_q["missing"]:
            require(kind in PARTS and kind not in stage_q["parts"],
                    "stage contradicts missing part: "+qid+":"+kind)
            x=recipe[kind]
            gaps=[]
            if x["mode"]=="existing-paid-exact":
                gid=x["generationId"]
                if gid not in generations:
                    require(gid in old_by_id,"unknown paid generation: "+gid)
                    gaps=[{"text":old_by_id[gid]["originalSpokenText"],"oldGenerationId":gid}]
                elif gid in blocked_gens:
                    gaps=[{"text":x["text"],"oldGenerationId":gid}]
            else:
                require(x["mode"]=="compose-from-segments","unknown recipe mode")
                for part in x["segments"]:
                    if part in originals and part not in blocked:continue
                    pieces=native.get(part)
                    if pieces:
                        for piece in pieces:
                            typ=piece["kind"]
                            if typ=="punctuation_whitespace_unspoken":continue
                            ptxt=(piece["spokenArabic"] if typ=="native_arabic_fusha_v4_reuse"
                                  else piece["source"])
                            if ptxt not in originals or ptxt in blocked:
                                gaps.append({"text":ptxt})
                    else:gaps.append({"text":part})
            require(gaps,"missing stage part has no missing/quarantined source: "+qid+":"+kind)
            sources=[]
            for gap in gaps:
                text=gap["text"]
                category=classify(text)
                entry={"sourceTextSha256":sha(text),"reason":category}
                if gap.get("oldGenerationId"):entry["previouslyPaidGenerationId"]=gap["oldGenerationId"]
                sources.append(entry)
                seen.add(category)
                key=text_use[text]
                key["parts"]+=1
                key["questions"].add(qid)
                require(key["category"] in (None,category),"same text assigned conflicting reasons")
                key["category"]=category
            missing_parts[kind]=sources
        require(seen,"unfinished question has no source blocker "+qid)
        for name in seen:categories[name].add(qid)
        incomplete.append({"questionId":qid,"ageBand":stage_q["ageBand"],
                           "missingAudioParts":missing_parts,"blockers":sorted(seen),
                           "publicReleaseAllowed":False,"rechargePreviouslyPaidAllowed":False})
    require(len(incomplete)==450-summary["completeFourPartQuestions"],
            "unfinished source audit count inconsistent")
    counts={age:sum(x["ageBand"]==age for x in incomplete)
            for age in ("4-6","7-8","9-10")}
    require(all(counts[age]+summary["byAge"][age]["completeFourPartQuestions"]==150
                for age in counts), "age-band completeness mismatch")
    # Some 4–6 year questions use these same prepaid originals as literal
    # segments instead of generation-ID slots. Count both forms of reuse.
    old_hits={gid:sum(any(
        x2.get("previouslyPaidGenerationId")==gid or
        x2["sourceTextSha256"]==sha(original["originalSpokenText"])
        for seq in row["missingAudioParts"].values() for x2 in seq)
        for row in incomplete)
        for gid,original in old_by_id.items()}
    report={
      "schemaVersion":1,"scope":"KIDS_V4_450_CURRENT_EXACT_SOURCE_BLOCKERS_REVIEW",
      "voiceId":registry["voiceId"],"modelId":registry["modelId"],
      "masterDictionaryRules":10099,"selectedQuestions":450,
      "completeFourPartQuestions":summary["completeFourPartQuestions"],
      "incompleteQuestions":len(incomplete),"incompleteByAge":counts,
      "realOriginalMP3sRecorded":len(originals),
      "uniqueMissingSourceTexts":len(text_use),
      "blockersByUniqueQuestion":{k:len(v) for k,v in sorted(categories.items())},
      "categoriesOverlapAcrossQuestions":True,
      "previouslyPaidNineNeverChargeAgain":[
         {"generationId":gid,"originalTextSha256":sha(x["originalSpokenText"]),
          "affectedQuestions":old_hits[gid],"alreadyPaid":True,
          "requiresOriginalRecovery":True,"newSynthesisAllowed":False}
         for gid,x in sorted(old_by_id.items())],
      "missingDistinctSourceCategories":dict(collections.Counter(
          z["category"] for z in text_use.values())),
      "sharedNativeArabicOriginalsStillReservedForHumanHearingApproval":True,
      "ownerRejectedPronunciationStillBlocked":True,
      "newElevenLabsCreditsSpentByAudit":0,
      "actualElevenLabsSynthesisCalls":0,"humanListeningApproved":False,
      "publicReleaseEnabled":False,"questions":incomplete}
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_CURRENT_UNFINISHED_SOURCE_AUDIT "+json.dumps({
        k:report[k] for k in ("selectedQuestions","completeFourPartQuestions",
        "incompleteQuestions","incompleteByAge","realOriginalMP3sRecorded",
        "uniqueMissingSourceTexts","blockersByUniqueQuestion",
        "newElevenLabsCreditsSpentByAudit")},ensure_ascii=False),flush=True)
if __name__=="__main__":run()
