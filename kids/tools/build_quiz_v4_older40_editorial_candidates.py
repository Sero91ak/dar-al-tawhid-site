#!/usr/bin/env python3
"""Non-executable exact wording proposals for four pending KIDS V4 source nuances.

These are human-review CANDIDATES only, NEVER silently changing any source
quiz, paid voice clip, text SHA, lesson, or public KIDS resource.
"""
from __future__ import annotations
import hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
D=ROOT/"kids/data"
REVIEW=ROOT/".github/reports"
FILES=[REVIEW/f"kids-v4-older-age-stage{i}-exact-voice-preflight.json" for i in (1,2)]
OUT=REVIEW/"kids-v4-older40-nuanced-wording-proposals-review-only.json"

# Do not automatically accept: changes may require updating the immutable
# selected script contract and creating NEW paid voice audio only after signoff.
CANDIDATES={
  "kids-quiz-276":{
    "issue":"Qurʾān 19:3 directly describes a quiet/hidden invocation; 'demütig' is interpretation, not literal translation",
    "proposedCorrectAnswer":"Leise und verborgen",
    "proposedExplanation":"Der Qurʾān berichtet, dass Zakariyyā seinen Herrn mit einem verborgenen Ruf anrief.",
    "reference":"Qurʾān 19:3; Tafsīr al-Māwardī: islamweb.net/ar/library/content/202/914",
    "action":"human-choice-rebaseline-question-and-voice-audio-after-approval",
  },
  "kids-quiz-147":{
    "issue":"False witness is one tafsīr explanation of az-zūr; do not imply it is the exclusive meaning",
    "proposedExplanation":"Zu az-zūr nennen Gelehrte verschiedene Erklärungen, darunter falsche Zeugenaussagen. Allah lobt Seine Diener, die Falsches meiden.",
    "reference":"Qurʾān 25:72; Tafsīr al-Qurṭubī: islamweb.net/ar/library/content/48/2555",
    "action":"human-choice-rebaseline-explanation-and-voice-audio-after-approval",
  },
  "kids-quiz-026":{
    "issue":"Qurʾān 16:43 directly concerns whether prior messengers were human; general advice is educational extrapolation",
    "proposedExplanation":"In diesem Vers wird erklärt, dass man bei Unsicherheit über frühere Gesandte kundige Menschen fragen soll. Wir lernen, beim Dīn verlässliches Wissen zu suchen.",
    "reference":"Qurʾān 16:43; Tafsīr aṭ-Ṭabarī: islamweb.net/ar/library/content/50/2903",
    "action":"human-choice-rebaseline-explanation-and-voice-audio-after-approval",
  },
  "kids-quiz-389":{
    "issue":"Qurʾān 16:43 is a context-specific instruction and should not be quoted as verbatim general social advice",
    "proposedExplanation":"Die Frage im Vers betrifft frühere Gesandte und Menschen mit Schriftwissen. Wir lernen daraus auch: Wissen soll man bei zuverlässigen Kundigen suchen.",
    "reference":"Qurʾān 16:43; Tafsīr aṭ-Ṭabarī: islamweb.net/ar/library/content/50/2903",
    "action":"human-choice-rebaseline-explanation-and-voice-audio-after-approval",
  },
  "kids-quiz-044":{
    "issue":"Qurʾān 5:6 distinguishes washed limbs from wiping over the head in Wuḍūʾ",
    "proposedExplanation":"Beim Wuḍūʾ waschen wir Gesicht und Arme sowie die Füße; über den Kopf wird gestrichen.",
    "reference":"Qurʾān 5:6; Tafsīr aṭ-Ṭabarī: islamweb.net/ar/library/content/50/1508",
    "action":"human-choice-rebaseline-explanation-and-voice-audio-after-approval",
  },
}

def load(p):return json.loads(p.read_text(encoding="utf-8"))
def sha(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()
def require(ok,message):
    if not ok:raise RuntimeError("KIDS_V4_EDITS_NOT_APPROVED: "+message)

def main():
    release=load(D/"quiz-curation-release.json")
    require(release.get("enabled") is False,"live flag unexpectedly enabled")
    selected={q["id"]:q for q in load(D/"quiz-kids-curated-450-review.json")["items"]}
    original={q["id"]:q for q in load(D/"quiz-kids.json")["items"]}
    reserved={q["id"]:q for q in load(D/"quiz-kids-expansion-reserve-450.json")["items"]}
    require(len(selected)==450 and len(reserved)==450 and len(original)==900
            and not (set(selected)&set(reserved)) and
            set(selected)|set(reserved)==set(original),
            "900/450/450 split has changed")
    by_id={q["questionId"]:q for stage in FILES for q in load(stage)["questions"]}
    require(len(by_id)==40 and set(CANDIDATES)<=set(by_id),
            "All 5 editorial candidates must come from chosen first 40")
    suggested=[]
    for qid,draft in CANDIDATES.items():
        record=by_id[qid]
        existing=selected[qid]
        require(existing==original[qid], "Canonical original source has changed for "+qid)
        require(existing["question"]==record["originalQuestion"],"Staged question text changed")
        require(existing["source"]==record["originalSource"],"Staged source changed")
        proposed=draft.get("proposedExplanation")
        require(isinstance(proposed,str) and proposed.strip() and
                proposed!=record["explanation"],"Proposed explanation missing or same")
        changed_answer=draft.get("proposedCorrectAnswer")
        if changed_answer is not None:
            require(changed_answer!=record["correctAnswer"],"Proposed answer is unchanged")
        suggested.append({
            "questionId":qid,"ageBand":record["ageBand"],
            "source":record["originalSource"],
            "originalQuestion":record["originalQuestion"],
            "originalQuestionSHA256":sha(record["originalQuestion"]),
            "originalCorrectAnswer":record["correctAnswer"],
            "proposedCorrectAnswer":changed_answer,
            "originalExplanation":record["explanation"],
            "originalExplanationSHA256":sha(record["explanation"]),
            "proposedExplanation":proposed,
            "issue":draft["issue"],"referenceForManualReview":draft["reference"],
            "action":draft["action"],
            "editorialApprovalGranted":False,
            "voiceRebaselineAuthorized":False,
            "mayGeneratePaidSpeech":False,
            "canonicalTextModified":False,
        })
    OUT.parent.mkdir(parents=True,exist_ok=True)
    report={
      "schemaVersion":1,"app":"TAWḤĪD KIDS",
      "scope":"PRIVATE_V4_OLDER40_EDITORIAL_CANDIDATES_NOT_IMPLEMENTED",
      "reviewOnly":True,"publicQuizModified":False,
      "original900Selected450Reserve450Preserved":True,
      "noOriginalVoiceReplacement":True,"newTTSsCreated":0,
      "voiceCreditsSpent":0,"humanApprovalsGranted":0,
      "requiresSeparateHumanSourceReview":True,
      "requiresManualApprovalBeforeAnyTextOrAudioChange":True,
      "candidates":suggested,
    }
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_OLDER40_POSSIBLE_CORRECTIONS_DRAFT_ONLY "+json.dumps({
      "candidates":len(suggested),"originalQuestionsChanged":0,
      "paidAudioGenerated":0,"published":False
    }),flush=True)
if __name__=="__main__":main()
