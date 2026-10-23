#!/usr/bin/env python3
"""Private, once-only native Fuṣḥā repairs for 3 exact original KIDS sources.
No German-model Arabic pronunciation, no double billing, no live publication.
Remote SHA receipt MUST be committed before each provider POST.
"""
from __future__ import annotations
import hashlib,json,os,re,subprocess,sys,urllib.request
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import build_canonical_v4_payload,subscription
from quiz_v4_no_double_charge_guard import protect_paid_texts
from quiz_v4_first150_offline_join import assemble,probe
BRANCH="review/kids-v4-nine-prepaid-artifact-replay-20261022"
VOICE="DkU7j9uO4ZEtLD2iRZSH";MODEL="eleven_v4"
TOKENS={"Schahāda":"الشَّهَادَة","Zakāh":"زَكَاة","Ḥaǧǧ":"الْحَجّ","Ramaḍān":"رَمَضَان"}
SOURCES={
 "nannte Schahāda, Gebet, Zakāh, Ḥaǧǧ und Fasten im Ramaḍān als Säulen des Islam.":"kids-quiz-036",
}
WORK=ROOT/"kids/review-only/kids-v4-q036-native-4-terms-paid-once-20261023.json"
ASSETS=ROOT/"kids/assets/kids-quiz-audio/v4-q036-native-4-terms-20261023"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
STATUS=ROOT/"kids/data/quiz-v4-450-production-status.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
MISSING=ROOT/"kids/review-only/quiz-v4-450-remaining17-exact-source-blockers-20261023.json"
BATCH="KIDS_V4_NATIVE_Q036_4_TERMS_20261023"
def rd(path):return json.loads(path.read_text(encoding="utf8"))
def sha(b):return hashlib.sha256(b).hexdigest()
def hashtext(s):return sha(s.encode("utf8"))
def ensure(v,m):
    if not v:raise RuntimeError("NATIVE_3_V4_PRIVATE_STOP: "+m)
def save(p,o):
    p.parent.mkdir(parents=True,exist_ok=True)
    t=p.with_name(p.name+".pending");t.write_text(json.dumps(o,ensure_ascii=False,indent=2)+"\n");t.replace(p)
def git(*args):
    res=subprocess.run(["git",*args],cwd=ROOT,capture_output=True,text=True,timeout=120)
    ensure(res.returncode==0,"git "+args[0]+": "+res.stderr[-300:])
    return res.stdout.strip()
def checkpoint(*files,reason):
    ensure(os.getenv("GITHUB_ACTIONS")=="true" and os.getenv("GITHUB_REF_NAME")==BRANCH,
           "only owner GitHub protected review branch")
    git("config","user.name","kids-v4-three-native-20261023")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    git("add","--",*(str(p.relative_to(ROOT)) for p in files))
    ensure(bool(git("diff","--cached","--name-only")),"no paid receipt changes")
    git("commit","-m","review(kids V4): three native source "+reason+" [skip ci]")
    git("push","origin","HEAD:"+BRANCH)
    rev=git("rev-parse","HEAD")
    ensure(git("ls-remote","--heads","origin",BRANCH).split()[0]==rev,
           "SHA receipt not preserved remotely")
    print("KIDS_NATIVE3_CHECKPOINT "+reason,flush=True)
def build_speech_units(full):
    pattern="("+("|".join(re.escape(t) for t in sorted(TOKENS,key=len,reverse=True)))+")"
    spans=re.split(pattern,full)
    ensure("".join(spans)==full and len(spans)>1,"cannot split full canonical source")
    pieces=[]
    for p in spans:
        if not p:continue
        if p in TOKENS:
            pieces.append({"sourceToken":p,"sourceSpoken":TOKENS[p],
                           "language":"ar","type":"native_v4_fusha"})
        else:
            # Preserve every canonical letter in the SOURCE contract, while
            # punctuation-only separators are pauses, not charged speech.
            say=p.strip()
            say=say.strip(" -–")
            if say and re.search(r"[A-Za-zÄÖÜäöüß]",say):
                pieces.append({"sourceToken":p,"sourceSpoken":say,
                    "language":"de","type":"owner_dictionary_german_v4"})
    ensure(len(pieces)>=2 and any(x["language"]=="ar" for x in pieces),
           "must insert at least one genuine native Fuṣḥā audio")
    return pieces
def validated_original(row,source):
    ensure(row["modelId"]==MODEL and row["voiceId"]==VOICE
        and row["textSha256"]==hashtext(source)
        and row["audioListeningApproved"] is False,
        "original protected model source or owner hearing changed")
    path=(ROOT/row["url"].lstrip("/")).resolve()
    ensure(row["url"].startswith("/kids/assets/kids-quiz-audio/")
          and path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve())
          and path.is_file(),"source MP3 unsafe/missing")
    raw=path.read_bytes()
    ensure(sha(raw)==row["sha256"] and len(raw)==row["bytes"],
          "original paid SHA/byte mismatch")
    probe(path)
    return path
def preflight():
    ensure(not WORK.exists(),"this source-specific V4 native source production already attempted")
    status,plan,missing,reg,ledger,hold,release=map(rd,
      (STATUS,PLAN,MISSING,REG,LEDGER,HOLD,RELEASE))
    ensure(status["completedQuestionsWithAllFourAudioParts"]==436
        and status["uniqueNewOriginalMP3sStored"]==1826
        and status["savedMP3TechnicallyAudited"]==1815
        and not status["livePublished"],"technical baseline 433/450 changed")
    ensure(not release["enabled"] and hold["productionPaused"]
        and not hold["humanPronunciationApproved"]
        and not hold["publicQuizAudioReleaseAuthorized"]
        and hold["ownerRequestedAll450Originals"],"owner public/phonetic hold changed")
    ensure(len(plan["recipes"])==450 and reg["modelId"]==MODEL and reg["voiceId"]==VOICE
        and not reg["live"] and not ledger["live"],"quiz original voice/model changed")
    missing_by_text={f["text"]:f for q in missing["questions"]
           for f in q["missingSourceFragments"]}
    old={q["questionId"]:q for q in plan["recipes"]}
    ensure(set(SOURCES)<={q["text"] for q in missing["questions"] for q in q["missingSourceFragments"]},
            "current exactly missing source set changed")
    for source,id in SOURCES.items():
        ensure(missing_by_text[source]["blocker"]=="NEW_V4_REQUIRED_AFTER_APPROVED_PILOT",
           "previously billed/rejected source – do NOT reorder")
        ensure(id in old and any(source in slot.get("text","") for
           slot in (old[id][k] for k in ("question","correct","retry","explanation"))),
           "exact canonical question no longer matches")
        ensure(source not in reg["textClips"],"source already exists or billed")
    protected=protect_paid_texts(ROOT,reg,ledger)
    units={source:build_speech_units(source) for source in SOURCES}
    spoken={}
    for group in units.values():
        for item in group:
            t=item["sourceSpoken"]
            if t in spoken:ensure(spoken[t]==item["language"],"language mismatch")
            spoken[t]=item["language"]
    todo={}
    for t,lang in spoken.items():
        if t in reg["textClips"]:
            validated_original(reg["textClips"][t],t)
        else:
            ensure(t not in protected,"previously paid or uncertain source fragment – no rebuy")
            payload=build_canonical_v4_payload(t,language=lang)
            ensure(payload["text"]==t and payload["model_id"]==MODEL
                 and payload["language_code"]==lang,
                 "source voice/model payload not exact")
            if lang=="de":
                ensure(payload["pronunciation_dictionary_locators"]==[{
                   "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
                   "version_id":"wSzgkGpAwEDiTak8DApc"}],
                   "German owner dictionary not bound")
            else:
                ensure("pronunciation_dictionary_locators" not in payload,
                   "native Fuṣḥā cannot use German grapheme aliases")
            todo[t]=lang
    estimate=round(sum(len(x) for x in todo)*1.220004,2)
    ensure(0<len(todo)<=12 and 0<estimate<=800,"private trial must be <=12 clips and <=800 estimated credits")
    return reg,ledger,units,todo,estimate
def main():
    reg,ledger,units,todo,estimate=preflight()
    ensure(os.getenv("KIDS_V4_OWNER_EXACT_THREE_NATIVE_RUN")=="YES"
        and os.getenv("GITHUB_ACTIONS")=="true","owner exact scoped generation not authorized")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    ensure(key and all(33<=ord(c)<=126 for c in key),"provider secret unavailable")
    ensure(subscription(key)>max(1.5*estimate,estimate+100),
           "insufficient prepaid credits for owner exact three private repairs")
    ASSETS.mkdir(exist_ok=True,parents=True)
    report={"schemaVersion":1,"scope":"ONE_QUIZ_036_FOUR_NATIVE_FUSHA_TERMS_PRIVATE_REVIEW",
      "createdAt":datetime.now(timezone.utc).isoformat(),
      "modelId":MODEL,"voiceId":VOICE,
      "fullSources":SOURCES,
      "sourceUnits":units,"newSourcesPlanned":todo,
      "estimatedCreditsNotInvoice":estimate,"publicRelease":False,
      "humanHearingApproved":False,"providerRequestsAllowed":len(todo),
      "payments":[],"composites":[],"status":"STARTED_PREPAYMENT_REMOTE_CHECKPOINT"}
    save(WORK,report);checkpoint(WORK,reason="started")
    for t,lang in todo.items():
        keyhash=hashtext(t)
        charge={"text":t,"textSHA256":keyhash,"language":lang,
            "status":"REQUEST_STARTED_UNCONFIRMED",
            "requestStartedAt":datetime.now(timezone.utc).isoformat()}
        report["payments"].append(charge);save(WORK,report)
        checkpoint(WORK,reason="prepaid-"+keyhash[:9])
        payload=build_canonical_v4_payload(t,language=lang)
        request=urllib.request.Request(
            "https://api.elevenlabs.io/v1/text-to-speech/"+VOICE+
             "?output_format=mp3_44100_128",
            data=json.dumps(payload,ensure_ascii=False).encode("utf8"),
            headers={"xi-api-key":key,"Accept":"audio/mpeg","Content-Type":"application/json"},
            method="POST")
        # Fail shut on ANY provider errors. A charged ambiguous request is
        # not retried; its remote journal already exists for reconciliation.
        with urllib.request.urlopen(request,timeout=120) as response:
            raw=response.read(1500000)
            reqid=response.headers.get("request-id") or response.headers.get("xi-request-id")
            ensure(response.status==200,"unexpected possibly charged provider response")
        ensure(1800<len(raw)<1500000 and (raw.startswith(b"ID3") or raw[:1]==b"\xff"),
               "charged response did not contain a genuine MP3")
        dest=ASSETS/(keyhash[:32]+".mp3")
        ensure(not dest.exists(),"source MP3 exists without paid journal")
        dest.write_bytes(raw)
        digest=sha(raw)
        row={"url":"/"+str(dest.relative_to(ROOT)),"sha256":digest,
          "textSha256":keyhash,"bytes":len(raw),"modelId":MODEL,"voiceId":VOICE,
          "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
          "source":"native-ar-v4" if lang=="ar" else "owner-dictionary-de-v4",
          "status":"PRIVATE_FUSHA_SEGMENT_NOT_OWNER_HEARD",
          "providerRequestId":reqid,"languageCode":lang}
        reg["textClips"][t]=row
        ledger["rows"].append({
          "batchId":BATCH,"text":t,"textSha256":keyhash,
          "mp3Sha256":digest,"providerRequestId":reqid,
          "exactBilledCredits":None,
          "estimatedCreditsAtObservedRate":round(len(t)*1.220004,3),
          "createdAt":datetime.now(timezone.utc).isoformat(),
          "note":"Private owner master; new native Fuṣḥā QA requires listening"})
        charge.update(status="ORIGINAL_MP3_SAVED",providerRequestId=reqid,
             mp3SHA256=digest,mp3Bytes=len(raw),audioURL=row["url"])
        save(WORK,report);save(REG,reg);save(LEDGER,ledger)
        checkpoint(WORK,REG,LEDGER,dest,reason="original-"+keyhash[:9])
    for full,components in units.items():
        paths=[validated_original(reg["textClips"][c["sourceSpoken"]],
                                  c["sourceSpoken"]) for c in components]
        dest=ASSETS/(hashtext(full)[:32]+"-fusha-joined.mp3")
        ensure(not dest.exists(),"private composite already produced")
        assemble(paths,[65]*(len(paths)-1),dest)
        data=dest.read_bytes();digest=sha(data)
        row={"url":"/"+str(dest.relative_to(ROOT)),
           "sha256":digest,"textSha256":hashtext(full),
           "bytes":len(data),"modelId":MODEL,"voiceId":VOICE,
           "audioListeningApproved":False,
           "qaApproval":"pending-human-auditory-review",
           "source":"composite-german-plus-native-v4-fusha-review-only",
           "status":"PRIVATE_COMPOSITE_AWAITING_OWNER_FULL_SENTENCE_HEARING",
           "compositeUnitSources":[c["sourceSpoken"] for c in components],
           "nativeOriginalsIncluded":[reg["textClips"][c["sourceSpoken"]]["sha256"]
                 for c in components if c["language"]=="ar"]}
        reg["textClips"][full]=row
        report["composites"].append({"sourceText":full,"mp3URL":row["url"],
             "sha256":digest,"bytes":len(data),"voiceId":VOICE,
             "humanListeningApproved":False})
        save(WORK,report);save(REG,reg)
        checkpoint(WORK,REG,dest,reason="joined-"+hashtext(full)[:9])
    ensure(len(report["composites"])==1,"must compose exactly one source originals")
    report["status"]="THREE_NATIVE_COMPOSITES_SAVED_PRIVATE_PENDING_HUMAN_HEARING"
    report["recoveredFromSavedPayments"]=len(todo)
    report["finishedAt"]=datetime.now(timezone.utc).isoformat()
    save(WORK,report);checkpoint(WORK,reason="private-complete")
    print("KIDS_450_NATIVE_Q036_FOUR_TERMS_READY "+
       json.dumps({"questions":list(SOURCES.values()),"sourceComposites":1,
             "originalRequests":len(todo),"publicRelease":False,
             "humanApproved":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
