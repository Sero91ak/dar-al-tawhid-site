#!/usr/bin/env python3
"""Exact current 17 KIDS V4 blockers after recovering approved-native Halal,
two historical paid contextual MP3s, and 1815 verified source assets.
This source-only audit spends zero credits and never publishes invalid audio.
"""
import hashlib,json,sys
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_v4_quarantine import quarantined_originals
from quiz_v4_native_fusha_reuse import load_mapping,expand_slot
from quiz_v4_no_double_charge_guard import protect_paid_texts
STAT=ROOT/"kids/data/quiz-v4-450-production-status.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
OLD=ROOT/"kids/review-only/quiz-v4-450-exact-remaining20-master-v4-20261023.json"
QA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
OUT=ROOT/"kids/review-only/quiz-v4-450-remaining17-exact-source-blockers-20261023.json"
TEXT=ROOT/"kids/review-only/KIDS-V4-450-NOCH-17-20261023.md"
def rd(p):return json.loads(p.read_text(encoding="utf8"))
def sha(t):return hashlib.sha256(t.encode("utf8")).hexdigest()
def check(v,msg):
    if not v:raise RuntimeError("KIDS_V4_EXACT_REMAINING17_AUDIT_STOP: "+msg)
def main():
    s,plan,reg,paid,previous,qa=map(rd,(STAT,PLAN,REG,LEDGER,OLD,QA))
    check(s["completedQuestionsWithAllFourAudioParts"]==433
       and s["uniqueNewOriginalMP3sStored"]==1815
       and s["savedMP3TechnicallyAudited"]==1815
       and s["questionsHumanListeningApproved"]==0
       and s["livePublished"] is False and s["appReleaseFlagEnabled"] is False
       and s["all450AudioReadyToPublish"] is False,
       "source status must be the SHA-checked 433/450 pre-release snapshot")
    check(qa["overallTechnicalPass"] is True
        and qa["savedClipCount"]==1815 and qa["allHumanListeningApproved"] is False,
        "actual MP3 technical QA did not pass")
    check(len(plan["recipes"])==450
       and reg["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH"
       and reg["modelId"]=="eleven_v4" and reg["live"] is False,
       "canonical source identity drift")
    check(previous["actualFourPartCompleted"]==430
          and previous["remainingDistinctSourceTexts"]==28,
          "historical remaining20 baseline was edited")
    mapping,native_assets=load_mapping(ROOT)
    blocked,blocked_ids=quarantined_originals(ROOT)
    originals={key:row for key,row in reg["textClips"].items() if key not in blocked}
    prior_gen={key:row for key,row in reg["generationClips"].items() if key not in blocked_ids}
    protected=protect_paid_texts(ROOT,reg,paid)
    sources={r["text"]:r["blocker"] for r in previous["missingSourceTexts"]}
    issues=[];seen=set();buckets=Counter();refs=Counter()
    for question in plan["recipes"]:
        fragments=[]
        for kind in ("question","correct","retry","explanation"):
            p=question[kind]
            if p["mode"]=="existing-paid-exact":
                check(p["generationId"] in prior_gen,
                  "old paid MP3 missing unexpectedly for "+question["questionId"])
                continue
            check(p["mode"]=="compose-from-segments","unexpected audio composition")
            _,_,missing=expand_slot(p,originals,mapping,native_assets)
            for text in dict.fromkeys(missing):
                check(text in sources,
                      "new unrecognized unpaid source "+sha(text)+" "+question["questionId"])
                check(text in blocked or text not in reg["textClips"],
                      "audio source present but not correctly represented")
                fragments.append({"part":kind,"text":text,"sha256":sha(text),
                                  "blocker":sources[text],
                                  "existingPaidOrProtected":text in protected,
                                  "oldInvalidAudioMustNotPlay":text in blocked,
                                  "auditoryApprovalRequired":True})
                refs[sources[text]]+=1
                if text not in seen:
                    seen.add(text);buckets[sources[text]]+=1
        if fragments:
            issues.append({
              "questionId":question["questionId"],"ageBand":question["ageBand"],
              "missingSourceFragments":fragments,
              "publicReleaseAllowed":False
            })
    check(len(issues)==17 and len(seen)==23,
          f"Expected 17 incomplete questions / 23 distinct source texts; actual {len(issues)}/{len(seen)}")
    check(Counter(q["ageBand"] for q in issues)=={"7-8":3,"9-10":14},
          "age-band counts changed unexpectedly")
    check(buckets=={"NEW_V4_REQUIRED_AFTER_APPROVED_PILOT":10,
                   "RESERVED_UNCONFIRMED_TTS":2,
                   "QUARANTINED_PRONUNCIATION":10,
                   "PREVIOUS_PROVIDER_REQUEST_UNCONFIRMED_DO_NOT_REBUY":1},
          "remaining source categorization mismatch")
    expected_blocked={"kids-quiz-023","kids-quiz-131","kids-quiz-271"}
    check(not expected_blocked.intersection({q["questionId"] for q in issues}),
          "already fixed question regressed")
    result={
      "schemaVersion":1,"asOf":"2026-10-23",
      "scope":"KIDS_450_TRUE_REMAINING17_REVIEW_ONLY_NO_NEW_CREDITS",
      "selectedQuestions":450,"technicallyCompleteQuestions":433,"incompleteQuestions":17,
      "missingDistinctSourceTexts":23,
      "missingSourceReferences":sum(refs.values()),
      "ageBreakdownIncomplete":{"7-8":3,"9-10":14},
      "sourceDistinctCountsByBlocker":dict(buckets),
      "sourceReferenceCountsByBlocker":dict(refs),
      "savedOriginalMP3sTechnicallyVerified":1815,"humanAuditoryApprovedQuestions":0,
      "newElevenLabsRequestsMadeByAudit":0,"additionalCreditsByAudit":0,
      "livePublished":False,"all450Ready":False,
      "requirementsToClose":[
         "Reconcile one provider-unconfirmed source before any repeat payment",
         "Use native, fully vocalized Arabic V4 word sources for problematic terms; no German 'Hala' alias fallback",
         "Keep previously charged/owner-rejected V4 originals quarantined; when rerecording corrected segments, preserve full old receipts and verify distinct source hashes",
         "Verify each of 23 source texts with original MP3 bytes SHA, ffprobe and spoken-text alignment",
         "Complete private 450/450 four-part playback map, then get real owner hearing QA before any public Kids app release"
       ],
      "questions":issues}
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    lines=["# DĀR AL TAWḤĪD KIDS – 17 exakt offene Quizfragen",
           "", "**433 von 450 technisch vollständig. 17 noch offen.**",
           "**23 unterschiedliche Original-Sprechtexte** fehlen oder sind wegen Aussprache/Zahlung gesperrt.",
           "1.815 echte private Audiodateien/Segmente technisch geprüft; 0/450 endgültige Hörfreigaben; Live aus.",
           "", "## Offene Fragen"]
    for issue in issues:
        lines.append(f"### {issue['questionId']} ({issue['ageBand']} Jahre)")
        for x in issue["missingSourceFragments"]:
            lines.append(f"- {x['part']}: {x['text']} — {x['blocker']}")
        lines.append("")
    TEXT.write_text("\n".join(lines)+"\n",encoding="utf8")
    print("KIDS_V4_EXACT_17_OF_450_SOURCE_BLOCKERS_PASS "+
        json.dumps({"technicalComplete":433,"stillOpen":17,
         "missingDistinctSources":23,"byBlocker":dict(buckets),
         "newCredits":0,"publicRelease":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
