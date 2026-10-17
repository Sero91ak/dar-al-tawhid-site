#!/usr/bin/env python3
"""Validate all 450 curated V4 quiz assignments against actual MP3 bytes.

Read-only across original audio and public KIDS app files. Saves only a
review-branch QA report. Absolutely no new ElevenLabs voice generation.
"""
from __future__ import annotations
import hashlib, json, re, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/"kids/data"
AUDIO=(ROOT/"kids/assets/kids-quiz-audio").resolve()
PLAN=DATA/"quiz-v4-curated-450-production-review.json"
REG=DATA/"quiz-v4-450-original-clip-registry.json"
YOUNG=DATA/"quiz-v4-first150-composed-preview.json"
OLD=DATA/"quiz-v4-age7to10-composed-preview.json"
YSTAT=DATA/"quiz-v4-first150-audio-status.json"
OSTAT=DATA/"quiz-v4-age7to10-offline-coverage.json"
FLAG=DATA/"quiz-curation-release.json"
CANONICAL=DATA/"quiz-kids.json"
SELECTED=DATA/"quiz-kids-curated-450-review.json"
RESERVE=DATA/"quiz-kids-expansion-reserve-450.json"
REPORT=ROOT/".github/reports/kids-v4-all450-crossage-technical-qa.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
PARTS=("question","correct","retry","explanation")
BANDS=("4-6","7-8","9-10")

def load(path): return json.loads(path.read_text(encoding="utf-8"))
def assert_ok(value,message):
    if not value: raise RuntimeError("KIDS V4 cross-age audio QA: "+message)
def digest_file(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest()
def text_sha(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()

def validate_clip(clip,hash_cache,context):
    assert_ok(isinstance(clip,dict),"Missing clip: "+context)
    assert_ok(clip.get("voiceId")==VOICE and clip.get("modelId")==MODEL,
              "Wrong V4 owner voice or model: "+context)
    assert_ok(clip.get("audioListeningApproved") is False and
              clip.get("approvedForPlayback") is not True,
              "Review clip incorrectly human approved or public: "+context)
    sha=clip.get("sha256")
    url=clip.get("url")
    assert_ok(isinstance(sha,str) and re.fullmatch("[a-f0-9]{64}",sha),
              "No valid MP3 SHA: "+context)
    assert_ok(isinstance(url,str) and url.startswith("/kids/assets/kids-quiz-audio/")
              and not any(c in url for c in ("..","?","#")),
              "Unsafe MP3 path: "+context)
    path=(ROOT/url.lstrip("/")).resolve()
    assert_ok(path.is_relative_to(AUDIO) and path.suffix.lower()==".mp3" and
              path.is_file() and path.stat().st_size>=1500,
              "MP3 bytes missing or outside root: "+context)
    if path in hash_cache:
        assert_ok(hash_cache[path]==sha,"Same MP3 file has conflicting hashes: "+context)
        return
    assert_ok(digest_file(path)==sha,"Original SHA mismatch: "+context)
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
                      "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
                     capture_output=True,text=True)
    assert_ok(p.returncode==0,"ffprobe failed: "+context)
    result=json.loads(p.stdout)
    streams=[s for s in result.get("streams") or [] if s.get("codec_type")=="audio"]
    seconds=float((result.get("format") or {}).get("duration") or 0)
    assert_ok(len(streams)==1 and streams[0].get("codec_name")=="mp3"
              and 0.35<seconds<180,"Invalid original MP3 stream/duration: "+context)
    hash_cache[path]=sha

def main():
    plan,reg,y,o=map(load,(PLAN,REG,YOUNG,OLD))
    ys,os,flag=map(load,(YSTAT,OSTAT,FLAG))
    canonical,selected,reserved=map(load,(CANONICAL,SELECTED,RESERVE))
    source_items=canonical.get("items") or []
    selected_items=selected.get("items") or []
    reserved_items=reserved.get("items") or []
    assert_ok(len(source_items)==900 and len(selected_items)==450 and
              len(reserved_items)==450,
              "Canonical/selected/reserved question count must be 900/450/450")
    original_by_id={row["id"]:row for row in source_items}
    selected_by_id={row["id"]:row for row in selected_items}
    reserved_by_id={row["id"]:row for row in reserved_items}
    assert_ok(len(original_by_id)==900 and len(selected_by_id)==450 and
              len(reserved_by_id)==450,
              "Duplicate original, selected, or reserved quiz IDs")
    assert_ok(set(selected_by_id).isdisjoint(reserved_by_id) and
              set(selected_by_id)|set(reserved_by_id)==set(original_by_id),
              "Selected 450 + reserved 450 must form complete disjoint original 900")
    assert_ok(all(original_by_id.get(id_)==row for id_,row in selected_by_id.items())
              and all(original_by_id.get(id_)==row for id_,row in reserved_by_id.items()),
              "Original lesson question payloads must remain byte-equivalent as JSON")
    assert_ok(set(q["questionId"] for q in plan["recipes"])==set(selected_by_id),
              "The 450 V4 audio recipes do not match the exact selected 450 questions")
    for band in BANDS:
        assert_ok(sum(row["ageBand"]==band for row in selected_items)==150 and
                  sum(row["ageBand"]==band for row in reserved_items)==150,
                  "Selected/reserved age groups must have exactly 150 questions each")
    assert_ok(flag.get("enabled") is False and flag.get("curatedQuestions")==450
              and flag.get("reserveQuestions")==450,"450+450 catalog or release flag changed")
    assert_ok(len(plan.get("recipes") or [])==450,"Selected plan must contain 450 recipes")
    for label,obj in (("plan",plan),("registry",reg),("young",y),("older",o)):
        assert_ok(obj.get("voiceId")==VOICE and obj.get("modelId")==MODEL,
                  "Wrong model/voice for "+label)
    assert_ok(reg.get("live") is False and y.get("published") is False and
              o.get("published") is False and y.get("humanListeningApproved") is False
              and o.get("humanListeningApproved") is False,"Public or hearing approval claimed")
    assert_ok(os.get("livePublished") is False and os.get("elevenLabsCreditsSpent")==0
              and os.get("humanListeningApprovalsCreated")==0,
              "Older-age review unexpectedly released or billed")
    assert_ok(ys.get("readyForLive") is False and ys.get("audioListeningApproved") is False,
              "Youngest-age preview unexpectedly approved")
    young_status={row["questionId"]:row for row in ys["questions"]}
    old_status=o["questions"]
    assert_ok(len(young_status)==150 and len(old_status)==300,"Missing 450 question status rows")
    hashes={}
    shared={}
    referenced={"4-6":set(),"7-8":set(),"9-10":set()}
    overview={}
    stats={}
    for band in BANDS:
        recipes=[q for q in plan["recipes"] if q["ageBand"]==band]
        assert_ok(len(recipes)==150,"Must select exactly 150 questions: "+band)
        fields=dict.fromkeys(PARTS,0)
        complete=0
        for q in recipes:
            qid=q["questionId"]
            assert_ok(qid not in overview,"Duplicate selected question ID: "+qid)
            state=young_status.get(qid) if band=="4-6" else old_status.get(qid)
            assert_ok(isinstance(state,dict),"Missing question status: "+qid)
            if band!="4-6":
                assert_ok(state.get("ageBand")==band,"Wrong age status: "+qid)
            available=[]
            for name in PARTS:
                item=q[name]
                phrase=item["text"]
                if item["mode"]=="existing-paid-exact":
                    source=reg["generationClips"].get(item["generationId"])
                    expected=source is not None
                    if expected:validate_clip(source,hashes,qid+":"+name+":paid-source")
                elif item["mode"]=="compose-from-segments":
                    fragments=item["segments"]
                    pauses=item.get("pauseAfterMs") or []
                    assert_ok(bool(fragments) and " ".join(fragments)==phrase,
                              "Spoken text/fragment mismatch: "+qid+":"+name)
                    assert_ok(len(pauses)==len(fragments)-1 and
                              all(isinstance(n,int) and 0<=n<=1600 for n in pauses),
                              "Incorrect pause timings: "+qid+":"+name)
                    expected=all(s in reg["textClips"] for s in fragments)
                    if expected:
                        for s in fragments:
                            validate_clip(reg["textClips"][s],hashes,
                                          qid+":"+name+":original-segment")
                else:
                    raise RuntimeError("Unknown original clip recipe mode "+qid+":"+name)
                if band=="4-6":
                    actual=name in state["availableAudioParts"]
                    assert_ok(actual==(name not in state["missingOrBlockedAudioParts"]),
                              "Youngest-age missing status disagrees: "+qid+":"+name)
                else:
                    slot=state["parts"][name]
                    actual=slot["available"] is True
                assert_ok(expected==actual,"False audio availability: "+qid+":"+name)
                available.append(actual)
                if not actual:continue
                entry=(y if band=="4-6" else o)["entries"].get(phrase)
                validate_clip(entry,hashes,qid+":"+name+":preview")
                if item["mode"]=="existing-paid-exact":
                    assert_ok(entry["sha256"]==source["sha256"],
                              "Exact paid original differs from preview: "+qid)
                if band!="4-6":
                    assert_ok(slot["textSha256"]==text_sha(phrase) and
                              slot["mp3Sha256"]==entry["sha256"] and
                              slot["url"]==entry["url"],
                              "Preview/slot MP3 hash mismatch: "+qid+":"+name)
                prior=shared.get(phrase)
                if prior:
                    assert_ok(prior["sha256"]==entry["sha256"],
                              "Same spoken words have contradictory audio SHA between ages")
                else:
                    shared[phrase]={"sha256":entry["sha256"],"firstBand":band}
                referenced[band].add(phrase)
                fields[name]+=1
            yes=all(available)
            assert_ok(state["allFourPartsAvailable"] is yes,
                      "Four-part question status mismatch: "+qid)
            complete+=yes
            overview[qid]={"ageBand":band,"parts":sum(available),"allFour":yes}
        saved_fields=ys["availableFieldCounts"] if band=="4-6" else os["byAge"][band]["availableFieldCounts"]
        saved_count=ys["completeFourPartQuestions"] if band=="4-6" else os["byAge"][band]["completeFourPartQuestions"]
        assert_ok(fields==saved_fields and complete==saved_count,
                  "Persisted audio progress does not match actual MP3s: "+band)
        assert_ok(set((y if band=="4-6" else o)["entries"])>=referenced[band],
                  "Required complete audio text not found: "+band)
        stats[band]={"selectedQuestions":150,"fourPartComplete":complete,
                     "originalBackedFieldAssignments":sum(fields.values()),"fields":fields,
                     "humanHearingApproved":0}
    overlap=set(y["entries"]) & set(o["entries"])
    for phrase in overlap:
        assert_ok(y["entries"][phrase]["sha256"]==o["entries"][phrase]["sha256"],
                  "Cross-age reuse different MP3 bytes for identical spoken phrase")
    assert_ok(len(overview)==450,"Incomplete original quiz coverage")
    complete_total=sum(x["fourPartComplete"] for x in stats.values())
    audio_fields_total=sum(x["originalBackedFieldAssignments"] for x in stats.values())
    assert_ok(0<=complete_total<=450 and 0<=audio_fields_total<=1800,
              "Overall selected audio coverage outside 450-question contract")
    assert_ok(set(y["entries"])==referenced["4-6"] and
              set(o["entries"])==referenced["7-8"]|referenced["9-10"],
              "Unreferenced/stale audio texts found in a private preview")
    report={"schemaVersion":1,"app":"TAWḤĪD KIDS",
            "scope":"ALL450_CROSSAGE_V4_REAL_ORIGINAL_MP3_QA",
            "reviewOnly":True,"livePublished":False,"publicManifestChanged":False,
            "newSpeechCreditsSpent":0,"humanHearingApproved":False,
            "selectedQuestionsVerified":450,"preservedReserveQuestions":450,
            "all900QuestionIdsDisjointAndComplete":True,
            "selectedAndReserveTextsMatchCanonicalExactly":True,
            "ageBandBreakdown":stats,
            "totalCompleteFourPartQuestions":complete_total,
            "originalBackedFieldAssignments":audio_fields_total,
            "uniqueFullSpokenTextsAcrossAges":len(shared),
            "sharedSpokenTextsAcrossYoungAndOlder":len(overlap),
            "shaConflictsAcrossAges":0,
            "uniqueRealMp3PathsWithShaAndCodecChecked":len(hashes),
            "oldPaidOriginalGenerationIdsMissing":ys["missingPreviouslyPaidGenerationIdCount"],
            "readyForLive":False}
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_KIDS_V4_ALL450_CROSSAGE_REAL_MP3_QA "+
          json.dumps(report,ensure_ascii=False),flush=True)

if __name__=="__main__":main()
