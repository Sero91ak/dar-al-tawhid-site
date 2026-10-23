#!/usr/bin/env python3
"""Avoid German possessive -s being pronounced as a truncated Arabic name.
Four source-preserving Kids quiz rephrasings; canonical question IDs, Qurʾān
citations, answer keys, ages, and 450 catalog remain unchanged. No audio/TTS.
"""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SELECTED=ROOT/"kids/data/quiz-kids-curated-450-review.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
RESULT=ROOT/"kids/data/quiz-v4-four-owner-name-genitive-rephrase-20261023.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
FIXES={
"kids-quiz-276":("explanation",
 "Der Qurʾān beschreibt Zakariyyās Ruf als verborgen und leise.",
 "Der Qurʾān beschreibt den leisen, verborgenen Ruf von Zakariyyā."),
"kids-quiz-278":("explanation",
 "Der Qurʾān wiederholt, dass ʿĪsās Zeichen mit Allahs Erlaubnis geschahen.",
 "Der Qurʾān wiederholt, dass die Zeichen von ʿĪsā mit Allahs Erlaubnis geschahen."),
"kids-quiz-640":("question",
 "Was zeigt die Geschichte Ayyūbs in Qurʾān 21:83–84 über Prüfungen?",
 "Was zeigt die Geschichte von Ayyūb im Qurʾān 21:83–84 über Prüfungen?"),
"kids-quiz-641":("question",
 "Welche Verbindung macht Sulaymāns Duʿāʾ in Qurʾān 27:19 deutlich?",
 "Welche Verbindung macht das Duʿāʾ von Sulaymān im Qurʾān 27:19 deutlich?"),
}
def rd(p):return json.loads(p.read_text(encoding="utf8"))
def dump(p,obj):p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
def sha(t):return hashlib.sha256(t.encode("utf8")).hexdigest()
def check(v,msg):
    if not v:raise RuntimeError("KIDS_V4_FOUR_NAMING_EDIT_STOP: "+msg)
def main():
    check(not RESULT.exists(),"four normalized question text edits already applied")
    selected,plan,hold,release=map(rd,(SELECTED,PLAN,HOLD,RELEASE))
    check(len(selected["items"])==len(plan["recipes"])==450,
          "canonical 450 question catalog changed")
    check(hold["productionPaused"] and not hold["publicQuizAudioReleaseAuthorized"]
          and not release["enabled"],"quiz must stay private")
    check(selected["sourceTextsUnmodified"] is False,"prior owner Halal source correction missing")
    choices={x["id"]:x for x in selected["items"]}
    planned={x["questionId"]:x for x in plan["recipes"]}
    audit=[]
    for id,(kind,old,new) in FIXES.items():
        q=choices[id];p=planned[id]
        check(q["source"]==p["source"] and q["ageBand"]==p["ageBand"],
              "canon source or age drifted")
        check(q[kind]==old,"curated original German possessive text changed: "+id)
        slot=p[kind]
        check(slot["mode"]=="compose-from-segments"
              and slot["segments"].count(old)==1
              and slot["text"].count(old)==1,
              "V4 original exact source fragment missing for "+id)
        pending=[item for item in plan["pendingAudioFragments"] if item["text"]==old]
        check(len(pending)==1 and id in pending[0]["usedBy"]
              and pending[0]["generated"] is False,
              "unbilled old exact source still requires a unique pending fragment")
        q[kind]=new
        slot["segments"]=[new if item==old else item for item in slot["segments"]]
        slot["text"]=slot["text"].replace(old,new,1)
        pending[0]["text"]=new
        pending[0]["characters"]=len(new)
        pending[0]["generated"]=False
        audit.append({"questionId":id,"part":kind,"old":old,"new":new,
           "originalSHA256":sha(old),"newSHA256":sha(new),
           "sourceCitation":q["source"],
           "meaningAndCorrectAnswerUnchanged":True})
    check(len(audit)==4
          and len({r["text"] for r in plan["pendingAudioFragments"]})==
              len(plan["pendingAudioFragments"]),
          "four quiz replacements collided with existing source")
    delta=sum(len(x["new"])-len(x["old"]) for x in audit)
    plan["newCharacters"]+=delta
    plan["creditEstimate"]=round(plan["creditEstimate"]+delta*.969066,2)
    selected["additionalNativeArabicNamePronunciationSourceCorrections"]={
      "date":"2026-10-23","scope":list(FIXES),
      "originalCanonicalSourceUnmodified":True,"answerChoicesUnmodified":True,
      "reason":"Avoid foreign proper-name German possessive -s; native Fuṣḥā names read independently",
      "newTextHumanListeningApproved":False,"publicReleaseAuthorized":False}
    plan["additionalNativeArabicNamePronunciationSourceCorrections"]={
      "date":"2026-10-23","scope":list(FIXES),
      "sourceManifest":"kids/data/quiz-v4-four-owner-name-genitive-rephrase-20261023.json",
      "privateOnly":True}
    dump(SELECTED,selected);dump(PLAN,plan)
    dump(RESULT,{"schemaVersion":1,"date":"2026-10-23",
       "purpose":"Native Fuṣḥā names without German possessive suffix and no change to canonical Qurʾān references",
       "catalogCount":450,"affectedQuestions":list(FIXES),
       "sourceEdits":audit,"estimatedCharacterChange":delta,
       "newAudioGeneratedBySourceRewrite":False,"newCreditsSpent":0,
       "humanListeningApproved":False,"publicQuizReleaseAllowed":False})
    print("KIDS_QURAN_PROPER_NAMES_FOUR_EXACT_SOURCE_REWRITES "+json.dumps({
       "changedIDs":list(FIXES),"language":"de with native-Arabic phonetic names",
       "newCredits":0,"publicRelease":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
