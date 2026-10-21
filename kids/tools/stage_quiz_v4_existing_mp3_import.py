#!/usr/bin/env python3
"""Stage real, already saved V4 quiz MP3s against their canonical question IDs.

Zero ElevenLabs requests. Never changes public quiz audio data or enables live
release. Verifies original MP3 bytes/SHA/codec before every staged assignment.
Imports all usable question parts, including incomplete questions, into a
versioned internal quiz-review map; blocks legacy TTS/fake V4 entries.
"""
from __future__ import annotations
import hashlib
import json
import subprocess
from collections import Counter
from pathlib import Path
from quiz_v4_quarantine import quarantined_originals,blocked_full_utterances

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
YOUNG=ROOT/"kids/data/quiz-v4-first150-composed-preview.json"
OLDER=ROOT/"kids/data/quiz-v4-age7to10-composed-preview.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
YOUNG_STATUS=ROOT/"kids/data/quiz-v4-first150-audio-status.json"
OLDER_STATUS=ROOT/"kids/data/quiz-v4-age7to10-offline-coverage.json"
STAGED=ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import.json"
SUMMARY=ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import-summary.json"
ROOT_AUDIO=(ROOT/"kids/assets/kids-quiz-audio").resolve()
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
KINDS=("question","correct","retry","explanation")
AGES=("4-6","7-8","9-10")

def load(p):return json.loads(p.read_text(encoding="utf-8"))
def require(ok,msg):
    if not ok:raise RuntimeError(msg)

def checked_preview(path):
    obj=load(path)
    require(obj.get("modelId")==MODEL and obj.get("voiceId")==VOICE,
            "Wrong preview voice/model in "+str(path))
    require(obj.get("published") is False and obj.get("humanListeningApproved") is False,
            "Public or human approval incorrectly asserted by preview")
    entries=obj.get("entries")
    require(isinstance(entries,dict) and entries,"Preview lacks real MP3 entries")
    return entries

def check_clip(phrase,item):
    require(isinstance(item,dict),"Unrecognized MP3 source")
    require(item.get("modelId")==MODEL and item.get("voiceId")==VOICE,
            "Wrong recorded V4 model/voice for "+hashlib.sha256(phrase.encode()).hexdigest()[:8])
    require(item.get("audioListeningApproved") is False,
            "Preview clip cannot claim human approval")
    u=item.get("url")
    require(isinstance(u,str) and u.startswith("/kids/assets/kids-quiz-audio/") and
            u.endswith(".mp3") and "?" not in u and "#" not in u and ".." not in u,
            "Invalid audio file locator")
    local=(ROOT/u.lstrip("/")).resolve()
    require(local.is_relative_to(ROOT_AUDIO) and local.is_file() and
            1800<local.stat().st_size<6_000_000,"MP3 source missing or unsafe")
    raw=local.read_bytes()
    digest=hashlib.sha256(raw).hexdigest()
    require(digest==item.get("sha256"),"Previously saved MP3 does not match SHA256")
    proc=subprocess.run(["ffprobe","-v","error","-show_entries",
         "format=duration:stream=codec_name,codec_type","-of","json",str(local)],
         capture_output=True,text=True,check=True)
    meta=json.loads(proc.stdout)
    tracks=[s for s in meta.get("streams",[]) if s.get("codec_type")=="audio"]
    seconds=float((meta.get("format") or {}).get("duration") or 0)
    require(len(tracks)==1 and tracks[0].get("codec_name")=="mp3" and .3<seconds<240,
            "Audio original cannot be decoded or has invalid duration")
    return {"url":u,"sha256":digest,"voiceId":VOICE,"modelId":MODEL,
            "bytes":len(raw),"durationSeconds":round(seconds,3),
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "reviewOnly":True}

def main():
    require(load(RELEASE).get("enabled") is False,
            "Refuse stage import if public 450 release is enabled")
    plan=load(PLAN)
    require(plan.get("modelId")==MODEL and plan.get("voiceId")==VOICE,"Not V4 master")
    recipes=plan.get("recipes")
    require(isinstance(recipes,list) and len(recipes)==450 and
            len({q.get("questionId") for q in recipes})==450,
            "Expected exactly 450 independent question IDs")
    blocked_texts,blocked_generations=quarantined_originals(ROOT)
    # Stale composed MP3 previews can survive a prior error. Never re-stage
    # anything whose constituent original was explicitly rejected by user.
    blocked_utterances=blocked_full_utterances(recipes,blocked_texts,blocked_generations)
    sources=[checked_preview(YOUNG),checked_preview(OLDER)]
    all_keys={r[k]["text"] for r in recipes for k in KINDS}
    candidates={}
    for preview in sources:
        for phrase,item in preview.items():
            require(phrase in all_keys,"Preview contains extra/unrecognized quiz audio")
            if phrase in blocked_utterances:
                continue
            if phrase in candidates:
                other=candidates[phrase]
                require(other["sha256"]==item.get("sha256"),
                        "Same spoken text mapped to conflicting original MP3s")
            else:
                candidates[phrase]=item

    verified={}
    for phrase,item in candidates.items():
        verified[phrase]=check_clip(phrase,item)
    records={}
    by_age={age:{"questions":0,"complete":0,"available":Counter(),
                 "missing":Counter()} for age in AGES}
    for rec in recipes:
        qid=rec["questionId"];age=rec["ageBand"]
        require(age in by_age,"Unexpected age group")
        by_age[age]["questions"]+=1
        parts={}
        pending={}
        for part in KINDS:
            phrase=rec[part]["text"]
            if phrase in verified:
                parts[part]={"spokenTextSha256":hashlib.sha256(phrase.encode()).hexdigest(),
                             **verified[phrase]}
                by_age[age]["available"][part]+=1
            else:
                pending[part]="unavailable-original-v4-mp3"
                by_age[age]["missing"][part]+=1
        complete=not pending
        by_age[age]["complete"]+=int(complete)
        records[qid]={"ageBand":age,"parts":parts,"missing":pending,
                      "fourPartTechnicallyReady":complete,
                      "humanListeningApproved":False,"publicPlaybackAuthorized":False}
    by_age={age:{"questions":x["questions"],"completeFourPartQuestions":x["complete"],
       "availableParts":dict(x["available"]),"missingParts":dict(x["missing"])}
       for age,x in by_age.items()}
    require(all(x["questions"]==150 for x in by_age.values()),
            "Staged import did not cover 150 IDs per age")
    # Never pin historical counts: importing the last nine prepaid originals
    # must be able to increase 4–6 automatically without changing this tool.
    # Cross-check the current independent offline reports, not guessed totals.
    young_status=load(YOUNG_STATUS)
    older_status=load(OLDER_STATUS)
    recorded_counts={"4-6":young_status["completeFourPartQuestions"],
        "7-8":older_status["byAge"]["7-8"]["completeFourPartQuestions"],
        "9-10":older_status["byAge"]["9-10"]["completeFourPartQuestions"]}
    for age in AGES:
        require(by_age[age]["completeFourPartQuestions"]==recorded_counts[age],
                "Real MP3 full-question count disagrees with offline QA for "+age)
        expected_fields=(young_status["availableFieldCounts"] if age=="4-6" else
            older_status["byAge"][age]["availableFieldCounts"])
        for kind in KINDS:
            require(by_age[age]["availableParts"].get(kind,0)==expected_fields[kind],
                    "Real MP3 part count disagrees with offline QA: "+age+"/"+kind)
    require(sum(x["completeFourPartQuestions"] for x in by_age.values())<=450,
            "Impossible V4 question audio coverage")
    staged={"schemaVersion":1,"scope":"KIDS_QUIZ_450_V4_INTERNAL_AUDIO_IMPORT",
            "modelId":MODEL,"voiceId":VOICE,"reviewOnly":True,
            "source":"already-paid original V4 MP3s and exact offline composed files",
            "originalMP3sSynthesizedForThisImport":0,
            "elevenLabsCreditsSpentByImport":0,
            "humanListeningApproved":False,"publicReleaseEnabled":False,
            "legacyAudioFallbackAllowedForReview":False,
            "all450ReadyForLive":False,"byAge":by_age,"questions":records}
    summary={"schemaVersion":1,"scope":staged["scope"],
       "questionsStaged":len(records),
       "uniqueRealMP3TextKeys":len(verified),
       "uniqueRealMP3Hashes":len(set(item["sha256"] for item in verified.values())),
       "completeFourPartQuestions":sum(by_age[a]["completeFourPartQuestions"] for a in AGES),
       "notCompleteFourPartQuestions":450-sum(by_age[a]["completeFourPartQuestions"] for a in AGES),
       "byAge":by_age,"humanListeningApprovals":0,
       "newElevenLabsCreditsSpent":0,"publicReleaseEnabled":False}
    STAGED.parent.mkdir(parents=True,exist_ok=True)
    STAGED.write_text(json.dumps(staged,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    SUMMARY.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_REAL_MP3_STAGED_IMPORT "+json.dumps(summary,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
