#!/usr/bin/env python3
"""Owner's exact 2026-10-23 rule: use the invariant word Halal in Kids quiz.
Rewrite ONLY three selected quiz records and their exact V4 source segments.
Preserve original 900-question archive, source IDs and already-billed audio
receipts. Old MP3 remains quarantined and must NOT be reused under new text.
No provider POST, release or false listening approval.
"""
from __future__ import annotations
import hashlib,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SELECTED=ROOT/"kids/data/quiz-kids-curated-450-review.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
CORRECTION=ROOT/"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json"
LEDGER=ROOT/"kids/review-only/quiz-v4-contextual-three-owner-audition-paid-once-ledger-20261023.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

# Complete old/new source-unit contracts. Never general-purpose regex replace.
RULES={
"kids-quiz-109":{
  "topic":("Halāl essen","Halal essen"),
  "question":("Sollen wir halāle und gute Dinge essen?",
              "Sollen wir Nahrung essen, die Halal und gut ist?"),
  "explanation":("Allah erlaubt das Halāle und Gute und warnt vor den Wegen des Shayṭān.",
                 "Allah erlaubt uns, Nahrung zu essen, die Halal und gut ist, und warnt vor den Wegen des Shayṭān.")
},
"kids-quiz-131":{
  "topic":("Halāl und ṭayyib","Halal und ṭayyib"),
  "answers[0].label":("Halāle und gute Nahrung",
                       "Nahrung, die Halal und gut ist"),
  "explanation":("Allah befiehlt, von dem Halālen und Guten auf der Erde zu essen.",
                 "Allah befiehlt, Nahrung zu essen, die Halal und gut ist.")
},
"kids-quiz-271":{
  "explanation":("Allah erlaubt das Halāle und Gute und warnt vor den Schritten des Shayṭān.",
                 "Allah erlaubt uns, Nahrung zu essen, die Halal und gut ist, und warnt vor den Schritten des Shayṭān.")
}}
def read(p):return json.loads(p.read_text(encoding="utf8"))
def write(p,obj):p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
def sha(t):return hashlib.sha256(t.encode("utf8")).hexdigest()
def ensure(ok,msg):
    if not ok:raise RuntimeError("OWNER_HALAL_FIX_STOP: "+msg)
def modify_record(record,key,old,new):
    if key.startswith("answers["):
        idx=int(key.split("[")[1].split("]")[0])
        ensure(record["answers"][idx]["label"]==old,"selected option changed")
        record["answers"][idx]["label"]=new
    else:
        ensure(record[key]==old,"selected source changed: "+key)
        record[key]=new
def main():
    ensure(not CORRECTION.exists(),"already applied; do not duplicate owner correction")
    hold,release,oldpilot=map(read,(HOLD,RELEASE,LEDGER))
    ensure(hold["productionPaused"] is True and hold["humanPronunciationApproved"] is False,
           "pronunciation hold unexpectedly lifted")
    ensure(hold["publicQuizAudioReleaseAuthorized"] is False and release["enabled"] is False,
           "public release unexpectedly enabled")
    ensure(oldpilot["status"]=="THREE_CONTEXTUAL_ORIGINALS_SAVED_PRIVATE_PENDING_HEARING",
           "historical paid 3-source pilot receipt changed")
    original=next((x for x in oldpilot["entries"]
           if x["sourceText"]=="Halāle und gute Nahrung."),None)
    ensure(original is not None
       and original["status"]=="ORIGINAL_MP3_SAVED_AWAITING_CONTEXT_OWNER_LISTENING"
       and original["fullSentenceOwnerListeningApproved"] is False
       and original["publicReleaseAllowed"] is False,
       "owner-rejected paid original must stay quarantined")
    media=(ROOT/original["originalUrl"].lstrip("/")).resolve()
    ensure(media.is_relative_to(ROOT/"kids/assets/kids-quiz-audio")
           and media.is_file()
           and hashlib.sha256(media.read_bytes()).hexdigest()==original["mp3Sha256"],
           "preserve genuine paid source MP3 SHA as historical evidence")
    selected,plan=map(read,(SELECTED,PLAN))
    ensure(len(selected["items"])==450 and len(plan["recipes"])==450,
           "curated source 450 must remain intact")
    ensure(selected["sourceTextsUnmodified"] is True,
           "source selection already owner-edited; recheck before another fix")
    records={x["id"]:x for x in selected["items"]}
    recipes={x["questionId"]:x for x in plan["recipes"]}
    ensure(len(records)==len(recipes)==450,"duplicate source IDs")
    record_changes=[]
    plan_changes=[]
    pending_changes=[]
    for id,changes in RULES.items():
        ensure(id in records and id in recipes,"missing selected question "+id)
        selected_record=records[id]
        recipe=recipes[id]
        ensure(selected_record["source"]=="Qurʾān 2:168" and recipe["source"]=="Qurʾān 2:168",
               "Qur'an attribution changed")
        for field,(old,new) in changes.items():
            ensure("Halal" in new,"owner word not preserved")
            modify_record(selected_record,field,old,new)
            record_changes.append({"questionId":id,"field":field,
                          "originalText":old,"correctedText":new,
                          "originalTextSHA256":sha(old),"correctedTextSHA256":sha(new)})
            if field=="topic":continue  # Topic is NOT a spoken V4 segment
            slot="question" if field in ("question","answers[0].label") else "explanation"
            source=old+"." if field=="answers[0].label" else old
            corrected=new+"." if field=="answers[0].label" else new
            media_slot=recipe[slot]
            ensure(media_slot["mode"]=="compose-from-segments",
                   "actual source must be a joined exact V4 segment")
            ensure(media_slot["segments"].count(source)==1,
                   "exact deprecated original segment count differs from 1")
            ensure(media_slot["text"].count(source)==1,
                   "exact deprecated full spoken text count differs from 1")
            media_slot["segments"]=[corrected if s==source else s
                                    for s in media_slot["segments"]]
            media_slot["text"]=media_slot["text"].replace(source,corrected,1)
            # Derived after correction, so no unpublished/deprecated text survives
            # as a billed source in the new production queue.
            candidates=[x for x in plan["pendingAudioFragments"] if x["text"]==source]
            ensure(len(candidates)==1 and id in candidates[0]["usedBy"],
                   "pending source index not uniquely matched")
            candidates[0]["text"]=corrected
            candidates[0]["characters"]=len(corrected)
            candidates[0]["generated"]=False
            plan_changes.append({"questionId":id,"slot":slot,"before":source,
                 "after":corrected,"beforeSHA256":sha(source),"afterSHA256":sha(corrected)})
            pending_changes.append((source,corrected))
    ensure(len(record_changes)==7 and len(plan_changes)==5
           and len(pending_changes)==5,"only 3 questions / 5 actual TTS sources allowed")
    ensure(len({x["text"] for x in plan["pendingAudioFragments"]})==len(plan["pendingAudioFragments"]),
           "new source collision in pending V4 queue")
    # Preserve the 900-question archive, exact IDs and sources. Clearly label
    # the selected 450 as corrected, not falsely 'unmodified'.
    selected["sourceTextsUnmodified"]=False
    selected["ownerSourceCorrection"]={
        "date":"2026-10-23","scope":"kids-quiz-109/131/271",
        "rule":"Halal is invariant (no Halāle/Halālen/halāle inflection)",
        "canonicalSource900NotModified":True,
        "questionIds":[*RULES],
        "noAudioVoiceApprovalImplied":True,
        "liveReleaseNotAllowed":True}
    length_delta=sum(len(new)-len(old) for old,new in pending_changes)
    ensure(isinstance(plan["newCharacters"],int),"original plan character total absent")
    plan["newCharacters"]+=length_delta
    # Existing credit estimate is a historical estimate. Move it only by the
    # exact source-character delta at the existing 0.969066 campaign rate.
    plan["creditEstimate"]=round(plan["creditEstimate"]+length_delta*0.969066,2)
    plan["ownerSourceCorrection"]={
        "date":"2026-10-23","source":"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json",
        "fourPartQuestionAudioMustBeReassembled":True,
        "deprecatedMP3MustNeverBeReused":True,"publicReleaseAllowed":False}
    # Fail closed: NEVER leave any deleted inflected form in these 3 question
    # records or rebuilt V4 full-text, fragments and pending source list.
    for id in RULES:
        for data in (records[id],recipes[id]):
            content=json.dumps(data,ensure_ascii=False)
            for wrong in ("Halāle","Halālen","halāle","halālen"):
                ensure(wrong not in content,id+" still contains wrong inflected term")
    for x in plan["pendingAudioFragments"]:
        for wrong in ("Halāle","Halālen","halāle","halālen"):
            ensure(wrong not in x["text"],"old inflected source still in V4 TTS queue")
    manifest={
        "schemaVersion":1,"ownerDirectCorrection":"Halale falsch gibt es nicht die Aussprache ist auch falsch sondern nur Halal",
        "ownerCorrectionDate":"2026-10-23",
        "wordToDisplayAndSpeakExactly":"Halal",
        "noInflectionAllowedInThisKidsQuizTerm":True,
        "arabicMeaning":"حلال",
        "affectedQuestionIds":[*RULES],
        "questionDisplaySourceEdits":record_changes,
        "changedExactV4SpeechFragments":plan_changes,
        "oldPaidRejectedContextOriginal":{
          "oldText":"Halāle und gute Nahrung.",
          "originalSha256":original["mp3Sha256"],
          "originalURL":original["originalUrl"],
          "retainedForPaidProvenance":True,
          "ownerPronunciationRejected":True,
          "approvedForPlayback":False,
          "publicReleaseAllowed":False,
          "doNotRepeatChargeOriginalText":True,
        },
        "blockedSourceTexts": [x["before"] for x in plan_changes],
        "holdNewCorrectedTextUntilVerifiedReRecording":True,
        "newCorrectedAudioGenerated":False,
        "newCreditsSpent":0,
        "ownerApprovedForV4Live":False,
        "publicReleaseAllowed":False,
        "productionStatusMustBeRecomputed":True}
    write(SELECTED,selected)
    write(PLAN,plan)
    write(CORRECTION,manifest)
    print("KIDS_HALAL_OWNER_SOURCE_CORRECTION_SUCCESS "+json.dumps({
        "questions":[*RULES],"v4ReplacedExactSegments":len(plan_changes),
        "word":"Halal","retainedPaidSourceSha":original["mp3Sha256"],
        "newCredits":0,"liveRelease":False,
        "allPreviouslyRecordedAffectedAudioNeedsRecut":True,
        "newCharactersDelta":length_delta,
    },ensure_ascii=False),flush=True)
if __name__=="__main__":main()
