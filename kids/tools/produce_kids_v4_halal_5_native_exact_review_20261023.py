#!/usr/bin/env python3
"""Exact five KIDS quiz Halal V4 sources, composited from native Arabic original.
Private review only. No direct German V4 Halal ("Hala") phonetics. Every new paid
German text gets a remote pre-POST journal and exact original receipt. Never
request the five full source strings from ElevenLabs, never duplicate an MP3.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,sys,urllib.request
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from generate_quiz_v4_450_paid_batch02 import build_canonical_v4_payload,subscription
from quiz_v4_no_double_charge_guard import protect_paid_texts
from quiz_v4_first150_offline_join import assemble,source_mp3
BRANCH="review/kids-v4-nine-prepaid-artifact-replay-20261022"
VOICE="DkU7j9uO4ZEtLD2iRZSH";MODEL="eleven_v4"
AR="حَلَال"
MAP={
"Sollen wir Nahrung essen, die Halal und gut ist?":
 ["Sollen wir Nahrung essen, die",AR,"und gut ist?"],
"Allah erlaubt uns, Nahrung zu essen, die Halal und gut ist, und warnt vor den Wegen des Shayṭān.":
 ["Allah erlaubt uns, Nahrung zu essen, die",AR,"und gut ist, und warnt vor den Wegen des Shayṭān."],
"Nahrung, die Halal und gut ist.":
 ["Nahrung, die",AR,"und gut ist."],
"Allah befiehlt, Nahrung zu essen, die Halal und gut ist.":
 ["Allah befiehlt, Nahrung zu essen, die",AR,"und gut ist."],
"Allah erlaubt uns, Nahrung zu essen, die Halal und gut ist, und warnt vor den Schritten des Shayṭān.":
 ["Allah erlaubt uns, Nahrung zu essen, die",AR,"und gut ist, und warnt vor den Schritten des Shayṭān."]
}
PRIVATE=ROOT/"kids/review-only/kids-v4-five-halal-native-450-repair-paid-journal-20261023.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-halal-five-native-repaired-review-20261023"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
OWNER=ROOT/"kids/review-only/quiz-v4-halal-fusha-owner-bad-full-sentence-quarantine-20261023.json"
VERDICT=ROOT/"kids/review-only/kids-v4-three-arabic-audition-owner-verdict-20261023.json"
CORRECTION=ROOT/"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json"
BATCH="KIDS_V4_5_HALAL_NATIVE_20261023"
def rd(p):return json.loads(p.read_text(encoding="utf8"))
def sha(b):return hashlib.sha256(b).hexdigest()
def shatext(s):return sha(s.encode("utf8"))
def fail(x,msg):
    if not x:raise RuntimeError("OWNER_HALAL_FIVE_EXACT_STOP: "+msg)
def save(p,o):
    p.parent.mkdir(exist_ok=True,parents=True)
    tmp=p.with_suffix(".pending");tmp.write_text(json.dumps(o,ensure_ascii=False,indent=2)+"\n");tmp.replace(p)
def git(*args):
    x=subprocess.run(["git",*args],cwd=ROOT,text=True,capture_output=True,timeout=100)
    fail(x.returncode==0,"Git "+args[0]+" failed; NO retry of paid TTS")
    return x.stdout.strip()
def checkpoint(message,*files):
    fail(os.getenv("GITHUB_ACTIONS")=="true" and os.getenv("GITHUB_REF_NAME")==BRANCH,
         "not verified private Actions runner")
    git("config","user.name","dar-kids-v4-native-halal-five")
    git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com")
    git("add","--",*(str(z.relative_to(ROOT)) for z in files))
    fail(bool(git("diff","--cached","--name-only")),"no journal checkpoint")
    git("commit","-m","review(kids V4): "+message+" [skip ci]")
    # Parallel reviewers on branch must not allow expensive replay. If branch
    # moved, fail; persisted pre-POST receipts protect all earlier requests.
    git("push","origin","HEAD:"+BRANCH)
    h=git("rev-parse","HEAD")
    fail(git("ls-remote","--heads","origin",BRANCH).split()[0]==h,"remote SHA differs")
    print("KIDS_HALAL_5_REMOTE_CHECKPOINT",message,flush=True)
def check_source(url,expected):
    fail(url.startswith("/kids/assets/kids-quiz-audio/"),"wrong audio source")
    p=(ROOT/url.lstrip("/")).resolve()
    fail(p.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()) and p.is_file(),
        "source asset unavailable")
    fail(sha(p.read_bytes())==expected,"original SHA failed")
    return p
def preflight():
    fail(not PRIVATE.exists(),"earlier partial production exists; never rebuy")
    hold=rd(ROOT/"kids/data/quiz-v4-pronunciation-hold.json")
    owner,verdict,correction,plan,reg,ledger=map(rd,(OWNER,VERDICT,CORRECTION,PLAN,REG,LEDGER))
    fail(hold["productionPaused"] is True and hold["paidSpeechAuthorized"] is False
         and hold["publicQuizAudioReleaseAuthorized"] is False
         and hold["ownerRequestedAll450Originals"] is True,
         "owner private-only production hold changed")
    fail(verdict["ownerAcceptedAllThreeIsolatedSamples"] is True
         and verdict["approvalAppliesOnlyToThreeIsolatedSamples"] is True
         and not verdict["publicReleaseAuthorized"],"native owner-approved word proof missing")
    fail(owner["approvedNativeSourceText"]==AR and owner["mustNeverReuseRejectedFullGermanTake"]
         and not owner["mixedSentenceHearingApproved"]
         and not owner["publicReleaseAllowed"],"wrong German speech source not protected")
    fail(correction["wordToDisplayAndSpeakExactly"]=="Halal"
         and len(correction["changedExactV4SpeechFragments"])==5
         and not correction["publicReleaseAllowed"],"exact displayed source corrections missing")
    fail(reg["voiceId"]==VOICE and reg["modelId"]==MODEL and not reg["live"]
         and not ledger["live"],"wrong V4 speaker or release lane")
    bad=check_source(owner["rejectedOriginalURL"],owner["rejectedProviderOriginalSHA256"])
    native=check_source(owner["nativeOriginalURL"],owner["approvedNativeOriginalSHA256"])
    fail(len(plan["recipes"])==450,"wrong quiz catalog")
    pending={v["text"] for v in plan["pendingAudioFragments"]}
    fail(set(MAP).issubset(pending),"five exact corrected Halal target source fragments missing")
    fail(len(set(MAP))==5,"exactly five V4 source fragments expected")
    protected=protect_paid_texts(ROOT,reg,ledger)
    components=list(dict.fromkeys(x for parts in MAP.values() for x in parts if x!=AR))
    fail(len(components)>=8,"unexpected component count")
    for source,parts in MAP.items():
        fail(" ".join(parts)==source.replace("Halal",AR) and len(parts)==3,
             "source no longer matches native Fusha inserts")
        fail(source not in reg["textClips"] or reg["textClips"][source]["sha256"]!=owner["rejectedProviderOriginalSHA256"],
             "reject existing incorrectly voiced registered original")
    todo=[]
    for text in components:
        if text in reg["textClips"]:
            row=reg["textClips"][text]
            check_source(row["url"],row["sha256"])
            fail(text in protected,"unbilled existing German component")
        else:
            fail(text not in protected,"German component already paid/unconfirmed; no rebuy")
            body=build_canonical_v4_payload(text,language="de")
            fail(body["text"]==text and body["model_id"]==MODEL and body["language_code"]=="de"
               and body["pronunciation_dictionary_locators"]==[{
                 "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
                 "version_id":"wSzgkGpAwEDiTak8DApc"}],"bad owner lexicon")
            todo.append(text)
    estimate=sum(len(x) for x in todo)*0.969066
    fail(estimate<=1200 and len(todo)<=14,"credit/max 14 component limit")
    return reg,ledger,native,todo,estimate,owner
def main():
    reg,ledger,native,todo,estimate,owner=preflight()
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    fail(key and all(33<=ord(x)<=126 for x in key),"secret missing")
    fail(os.getenv("KIDS_V4_HALAL_PRIVATE_5_ONCE")=="YES","private 5 source scope missing")
    fail(subscription(key)>max(estimate*1.5,estimate+100),"insufficient balance")
    OUT.mkdir(parents=True,exist_ok=True)
    report={"scope":"FIVE_OWNER_CORRECTED_HALAL_QUIZ_SOURCE_FRAGMENTS","date":"2026-10-23",
       "modelId":MODEL,"voiceId":VOICE,"nativeArabic":AR,
       "approvedNativeSHA256":owner["approvedNativeOriginalSHA256"],
       "neverReuseBadGermanWholeTakeSHA256":owner["rejectedProviderOriginalSHA256"],
       "expectedRepairedSources":list(MAP),"plannedPaidGermanParts":todo,
       "estimatedCreditsNotInvoice":round(estimate,2),
       "newProviderRequestsAllowed":len(todo),"humanHearingApproved":False,
       "liveRelease":False,"entries":[],"status":"STARTED_REMOTE_CHECKPOINT"}
    save(PRIVATE,report);checkpoint("open Halal 5 one-time private paid journal",PRIVATE)
    for text in todo:
        t_hash=shatext(text)
        line={"text":text,"sourceTextSHA256":t_hash,
              "status":"REQUEST_STARTED_UNCONFIRMED",
              "startedAt":datetime.now(timezone.utc).isoformat()}
        report["entries"].append(line)
        save(PRIVATE,report);checkpoint("prepost-"+t_hash[:10],PRIVATE)
        body=build_canonical_v4_payload(text,language="de")
        request=urllib.request.Request("https://api.elevenlabs.io/v1/text-to-speech/"+
           VOICE+"?output_format=mp3_44100_128",
           data=json.dumps(body,ensure_ascii=False).encode("utf8"),method="POST",
           headers={"xi-api-key":key,"Accept":"audio/mpeg","Content-Type":"application/json"})
        with urllib.request.urlopen(request,timeout=120) as response:
            audio=response.read(1300000)
            reqid=response.headers.get("request-id") or response.headers.get("xi-request-id")
            fail(response.status==200,"unconfirmed provider receipt; do not retry")
        fail(1500<len(audio)<1300000 and (audio.startswith(b"ID3") or audio[:1]==b"\xff"),
             "possibly charged invalid MP3; never retry")
        dst=OUT/(t_hash[:32]+".mp3")
        fail(not dst.exists(),"paid original filename exists")
        dst.write_bytes(audio)
        row={"url":"/"+str(dst.relative_to(ROOT)),"sha256":sha(audio),
             "textSha256":t_hash,"bytes":len(audio),"modelId":MODEL,
             "voiceId":VOICE,"audioListeningApproved":False,
             "qaApproval":"pending-human-auditory-review",
             "source":"private-German-component-for-native-Fusha-Halal",
             "status":"PRIVATE_REVIEW_ONLY","providerRequestId":reqid}
        reg["textClips"][text]=row
        ledger["rows"].append({"batchId":BATCH,"text":text,"textSha256":t_hash,
              "mp3Sha256":row["sha256"],"providerRequestId":reqid,
              "estimatedCreditsAtObservedRate":round(len(text)*0.969066,4),
              "exactBilledCredits":None,"createdAt":datetime.now(timezone.utc).isoformat(),
              "note":"source exact original; old incorrect German Halal whole clips excluded"})
        line.update(status="ORIGINAL_MP3_SAVED",originalMP3=row["url"],
                    bytes=len(audio),sha256=row["sha256"],providerRequestId=reqid)
        save(PRIVATE,report);save(REG,reg);save(LEDGER,ledger)
        checkpoint("exact-german-original-"+t_hash[:10],PRIVATE,REG,LEDGER,dst)
    # Do not promote an old bad whole-sentence take. Join genuine separated
    # original German parts around the native Arabic owner-accepted master.
    for target,parts in MAP.items():
        files=[native if x==AR else check_source(
             reg["textClips"][x]["url"],reg["textClips"][x]["sha256"]) for x in parts]
        dst=OUT/(shatext(target)[:32]+"-native-joined.mp3")
        fail(not dst.exists(),"native composite already exists")
        assemble(files,[60,60],dst)
        payload=dst.read_bytes()
        fail(len(payload)>1800,"joined MP3 empty")
        reg["textClips"][target]={
          "url":"/"+str(dst.relative_to(ROOT)),
          "sha256":sha(payload),"textSha256":shatext(target),"bytes":len(payload),
          "modelId":MODEL,"voiceId":VOICE,"audioListeningApproved":False,
          "qaApproval":"pending-human-auditory-review",
          "source":"owner-approved-native-Fusha-Halal-with-genuine-German-V4-components",
          "status":"PRIVATE_COMPOSITE_NOT_OWNER_SENTENCE_APPROVED",
          "compositeNativeOriginalSha256":owner["approvedNativeOriginalSHA256"],
          "replacesRejectedGermanWholeOriginalSha256":owner["rejectedProviderOriginalSHA256"]}
        report.setdefault("composites",[]).append({
          "text":target,"sha256":sha(payload),"originalURL":reg["textClips"][target]["url"],
          "sourceSegments":parts,"nativeOriginalSHA256":owner["approvedNativeOriginalSHA256"],
          "ownerApprovedWholeSentence":False})
        save(PRIVATE,report);save(REG,reg)
        checkpoint("native-halal-composite-"+shatext(target)[:10],PRIVATE,REG,dst)
    report["status"]="FIVE_HALAL_NATIVE_COMPOSITES_PRIVATE_TECHNICALLY_READY_AWAIT_OWNER_HEARING"
    save(PRIVATE,report);checkpoint("five-source-final-private-report",PRIVATE)
    print("KIDS_HALAL_FIVE_NATIVE_REPAIR_SAVED",json.dumps({
      "compositeCount":len(MAP),"GermanNewOriginalCount":len(todo),
      "estimatedCredits":round(estimate,2),"nativeFuṣḥāOriginalReused":True,
      "publicReleased":False,"humanApproved":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
