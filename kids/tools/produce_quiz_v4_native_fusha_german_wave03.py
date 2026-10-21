#!/usr/bin/env python3
"""One guarded batch of up to 25 NEW German connectors for mixed Fuṣḥā quiz audio.
German components use the original 10,099-rule de-DE PLS; existing native Arabic
source originals are NEVER rebought or fed to the German pronunciation dictionary.
Any request that reached the provider is checkpointed before POST: NEVER retry it.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, subprocess, sys, xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import (
    build_canonical_v4_payload,original_mp3,subscription,source_requires_separate_pronunciation_approval)
from generate_quiz_v4_older_stage1_exact import persist_remote_paid_checkpoint
from quiz_v4_no_double_charge_guard import protect_paid_texts

VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
MAP=ROOT/"kids/review-only/quiz-v4-20261021-two-shared-native-fusha-real-master-originals.json"
MAP_GIT_BLOB="e914581ac79e1047a8b4197a4b11d25ec7b941c3"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
LEDGER=ROOT/"kids/data/quiz-v4-20261021-native-fusha-german25-wave03-ledger.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-native-fusha-german-components-review"
MAX_NEW=25
MAX_ESTIMATE=1500.0
RATE=0.969
TRANSLIT=set("ʾʿāĀīĪūŪḥḤḍḌṣṢṭṬẓẒṯṮḏḎǧǦšŠġĠ")
TOKEN=re.compile(r"[\wʾʿĀāĪīŪūḤḥḌḍṢṣṬṭẒẓṮṯḎḏǦǧŠšĠġ-]+",re.UNICODE)

def load(path):return json.loads(path.read_text(encoding="utf-8"))
def digest(text):return hashlib.sha256(text.encode("utf-8")).hexdigest()
def require(test,msg):
    if not test:raise RuntimeError("KIDS_NATIVE_FUSHA_DE_25_STOP: "+msg)
def gitblob(data):return hashlib.sha1(b"blob "+str(len(data)).encode("ascii")+b"\0"+data).hexdigest()
def candidate_batch():
    require(load(RELEASE).get("enabled") is False,"public quiz release must stay off")
    require(not LEDGER.exists(),"this wave was already started or charged; never restart")
    prior=load(ROOT/"kids/data/quiz-v4-20261021-native-fusha-german25-original-ledger.json")
    require(prior.get("status")=="WAVE_ALL_ORIGINALS_STORED_PENDING_HUMAN_PRONUNCIATION" and len(prior.get("entries",[]))==25,
            "original wave01 must finish before wave03")
    prior2=load(ROOT/"kids/data/quiz-v4-20261021-native-fusha-german25-wave02-ledger.json")
    require(prior2.get("status")=="WAVE_ALL_ORIGINALS_STORED_PENDING_HUMAN_PRONUNCIATION" and len(prior2.get("entries",[]))==25,
            "owner's second paid wave has not finished; refuse third spend")
    b=MAP.read_bytes()
    require(gitblob(b)==MAP_GIT_BLOB,"owner reviewed native source mapping SHA changed")
    mapping=json.loads(b)
    require(mapping["modelId"]==MODEL and mapping["voiceId"]==VOICE and
            mapping["canonicalMixedAudioOccurrences"]==58 and
            len(mapping["masterArabicOriginals"])==2 and
            mapping["additionalDistinctGermanSpeechComponentsRequiringOriginalV4"]==87,
            "shared native audio mapping unexpectedly differs")
    require(mapping["publicReleaseEnabled"] is False,"native mapping cannot authorize publication")
    for native in mapping["masterArabicOriginals"]:
        target=(ROOT/native["realOriginalMP3"].lstrip("/")).resolve()
        require(target.is_relative_to(ROOT/"kids/assets/kids-quiz-audio") and target.is_file(),
                "native Fuṣḥā original is missing")
        require(hashlib.sha256(target.read_bytes()).hexdigest()==native["mp3Sha256"],
                "genuine native Arabic MP3 SHA mismatch")
    registry,paid=load(REG),load(PAID)
    require(registry["modelId"]==MODEL and registry["voiceId"]==VOICE and registry["live"] is False,
            "wrong primary original V4 registry")
    for earlier in load(ROOT/"kids/data/quiz-v4-20261021-native-fusha-german25-wave02-ledger.json")["entries"]:
        saved=registry["textClips"].get(earlier["sourceText"])
        require(saved is not None and saved.get("sha256")==earlier["mp3Sha256"]
                and saved.get("providerRequestId")==earlier["providerRequestId"],
                "wave02 paid original not imported atomically; STOP to prevent duplicate billing")
    protected=protect_paid_texts(ROOT,registry,paid)
    owner=load(ROOT/"data/pronunciation/elevenlabs-production.json")["pronunciationDictionary"]
    p=ROOT/owner["masterFile"]
    raw=p.read_bytes()
    require(gitblob(raw)==owner["gitBlobSha"] and owner["ruleCount"]==10099,
            "owner dictionary SHA or original rule count changed")
    lexemes={e.findtext("{http://www.w3.org/2005/01/pronunciation-lexicon}grapheme","").casefold()
            for e in ET.fromstring(raw).findall("{http://www.w3.org/2005/01/pronunciation-lexicon}lexeme")}
    used={}
    for q in mapping["items"]:
        for part in q["mixedAudioParts"]:
            if part["kind"]!="german_master_dictionary_v4_component" or not part["stillNeedsGermanV4Original"]:
                continue
            spoken=part["source"]
            require(bool(spoken.strip()) and spoken==spoken.strip(),
                    "unaligned German source segment")
            used[spoken]=used.get(spoken,0)+1
    require(len(used)==87,"expected exactly 87 distinct German connectors")
    eligible=[]
    deferred=[]
    for text,usage in sorted(used.items()):
        if text in registry["textClips"]:
            require(text in protected, "registered V4 original missing paid-text guard")
            continue
        require(text not in protected, "previously charged or reserved original: NEVER repurchase")
        if source_requires_separate_pronunciation_approval(text):
            deferred.append({"textSha256":digest(text),"reason":"OWNER_PRONUNCIATION_REVIEW"})
            continue
        not_in_dictionary=[m.group() for m in TOKEN.finditer(text)
                           if any(char in TRANSLIT for char in m.group())
                           and m.group().casefold() not in lexemes]
        if not_in_dictionary:
            deferred.append({"textSha256":digest(text),"reason":"UNLISTED_EXACT_FUSHA_TOKEN"})
            continue
        payload=build_canonical_v4_payload(text,language="de")
        require(payload["model_id"]==MODEL and payload["language_code"]=="de" and
                payload["pronunciation_dictionary_locators"]==[{
                   "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
                   "version_id":"wSzgkGpAwEDiTak8DApc"}],
                "a German connector lost the pinned master dictionary")
        eligible.append({"text":text,"usedBy":usage,"textSha256":digest(text)})
    require(len(eligible)==34 and len(deferred)==3,
            "unexpected German connector Fuṣḥā eligibility; stop before spending")
    eligible.sort(key=lambda x:(-x["usedBy"],len(x["text"]),x["text"]))
    chosen=[];estimate=0.0
    for item in eligible:
        nextcost=round(len(item["text"])*RATE,2)
        if len(chosen)>=MAX_NEW:break
        if estimate+nextcost>MAX_ESTIMATE:continue
        chosen.append(item);estimate+=nextcost
    require(len(chosen)==MAX_NEW and estimate<=MAX_ESTIMATE,"cannot fill safe bounded German wave")
    report={"schemaVersion":1,"scope":"KIDS_NATIVE_FUSHA_DE_25_ONE_TIME_MASTER_DICTIONARY_V4",
        "modelId":MODEL,"voiceId":VOICE,"dictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
        "dictionaryVersionId":"wSzgkGpAwEDiTak8DApc","dictionaryRuleCount":10099,
        "inputMappingGitBlob":MAP_GIT_BLOB,"eligibleOriginals":len(eligible),
        "ownerPronunciationHeld":deferred,"plannedExactTextSHA256":[x["textSha256"] for x in chosen],
        "selectedOriginals":len(chosen),"estimatedCreditsNotInvoice":round(estimate,2),
        "hardCreditEstimateCap":MAX_ESTIMATE,"userCreditCallsHardLimit":MAX_NEW,
        "modelLanguage":"de","nativeArabicOriginalsPreviouslyPaid":2,
        "newOriginalsPaidBeforeRun":0,"humanListeningApproved":False,
        "publicReleaseAllowed":False,"status":"READ_ONLY_PREFLIGHT","entries":[]}
    return chosen,report
def main():
    parser=argparse.ArgumentParser()
    choices=parser.add_mutually_exclusive_group(required=True)
    choices.add_argument("--audit",action="store_true")
    choices.add_argument("--produce",action="store_true")
    args=parser.parse_args()
    chosen,report=candidate_batch()
    if args.audit:
        print("KIDS_NATIVE_FUSHA_DE25_COSTLESS_PREFLIGHT "+json.dumps({
            k:report[k] for k in ("eligibleOriginals","selectedOriginals","estimatedCreditsNotInvoice",
                       "hardCreditEstimateCap","plannedExactTextSHA256")}),flush=True)
        return
    require(os.getenv("GITHUB_ACTIONS")=="true" and
            os.getenv("GITHUB_REF_NAME")=="review/kids-quiz-v4-batch-001-020-20261014",
            "only the checked GitHub review runner may pay")
    require(os.getenv("KIDS_V4_OWNER_450_BULK_EXPLICIT")=="YES" and
            os.getenv("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES",
            "user credit approval not attached to this wave")
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    require(bool(key),"missing ElevenLabs provider key")
    available=subscription(key)
    require(available>MAX_ESTIMATE*1.5,"insufficient ElevenLabs credits and reserve")
    OUT.mkdir(parents=True,exist_ok=True)
    report["status"]="WAVE_STARTED_DO_NOT_RETRY"
    report["startedAt"]=datetime.now(timezone.utc).isoformat()
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,purpose="third-Fusha-German25-wave-open")
    for index,item in enumerate(chosen,1):
        speech=item["text"];hashtext=item["textSha256"]
        # Write ahead to remote BEFORE EACH paid request; failure always stops.
        row={"sourceText":speech,"sourceTextSHA256":hashtext,
             "modelId":MODEL,"voiceId":VOICE,"status":"REQUEST_STARTED_UNCONFIRMED",
             "startedAt":datetime.now(timezone.utc).isoformat()}
        require(not any(x["sourceTextSHA256"]==hashtext for x in report["entries"]),
                "speech source repeated inside one paid wave")
        report["entries"].append(row)
        LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        persist_remote_paid_checkpoint(LEDGER,purpose="German-Fusha-W03-%02d-request-start"%index)
        # Exactly one paid request for this text; never automatically retry.
        raw,request_id=original_mp3(key,speech,language="de")
        target=OUT/(digest(VOICE+"\n"+MODEL+"\n"+speech)[:32]+".mp3")
        require(not target.exists(),"paid original file already exists outside journal")
        target.write_bytes(raw)
        metadata=json.loads(subprocess.run(["ffprobe","-v","error","-show_entries",
                   "format=duration:stream=codec_name,codec_type","-of","json",str(target)],
                   capture_output=True,text=True,check=True).stdout)
        audio=[x for x in metadata.get("streams",[]) if x.get("codec_type")=="audio"]
        require(audio and audio[0].get("codec_name")=="mp3","paid original MP3 decoder failure")
        row.update({"status":"ORIGINAL_MP3_SAVED_REVIEW_ONLY",
            "mp3Sha256":hashlib.sha256(raw).hexdigest(),"mp3Bytes":len(raw),
            "providerRequestId":request_id,"audioUrl":"/"+str(target.relative_to(ROOT)),
            "completedAt":datetime.now(timezone.utc).isoformat(),
            "humanListeningApproved":False,"publicReleaseAllowed":False})
        LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        persist_remote_paid_checkpoint(LEDGER,target,purpose="German-Fusha-W03-%02d-original-mp3"%index)
        print("KIDS_NATIVE_FUSHA_GERMAN_ORIGINAL_SAVED "+json.dumps({
            "index":index,"total":len(chosen),"textSHA256":hashtext,
            "mp3SHA256":row["mp3Sha256"],"newRequests":1,"publicRelease":False}),flush=True)
    report["status"]="WAVE_ALL_ORIGINALS_STORED_PENDING_HUMAN_PRONUNCIATION"
    report["completedAt"]=datetime.now(timezone.utc).isoformat()
    LEDGER.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    persist_remote_paid_checkpoint(LEDGER,purpose="German-Fusha-25-W03-wave-finished")
    print("KIDS_NATIVE_FUSHA_DE25_DONE "+json.dumps({
      "stored":len(report["entries"]),"estimatedCreditsNotInvoice":report["estimatedCreditsNotInvoice"],
      "publicRelease":False,"humanApproved":False}),flush=True)
if __name__=="__main__":main()
