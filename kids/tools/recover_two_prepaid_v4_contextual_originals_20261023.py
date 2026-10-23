#!/usr/bin/env python3
"""Recover EXACT two previously paid genuine V4 contextual MP3s from user's
private audition. Do NOT recover owner-rejected 'Halāle', spend credits,
infer phonetic acceptance, or alter public Kids assets.
"""
from __future__ import annotations
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
JOURNAL=ROOT/"kids/review-only/quiz-v4-contextual-three-owner-audition-paid-once-ledger-20261023.json"
HALAL=ROOT/"kids/review-only/quiz-v4-halal-fusha-owner-bad-full-sentence-quarantine-20261023.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
PROOF=ROOT/"kids/review-only/quiz-v4-two-recovered-prepaid-contextual-master-originals-20261023.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH";MODEL="eleven_v4"
WHITELIST={
  "Allah beschreibt den Qurʾān als Rechtleitung für die Muttaqīn.":"kids-quiz-023",
  "Mit wessen Erlaubnis geschahen die Wunder ʿĪsās?":"kids-quiz-278",
}
def rd(p):return json.loads(p.read_text(encoding="utf8"))
def sha(s):return hashlib.sha256(s).hexdigest()
def require(test,msg):
    if not test:raise RuntimeError("KIDS_V4_PREPAID_CONTEXT_RECOVERY_STOP: "+msg)
def main():
    require(not PROOF.exists(),"one-time recovery already committed")
    j,bad,reg,ledger,plan,hold=map(rd,(JOURNAL,HALAL,REG,LEDGER,PLAN,HOLD))
    require(j["status"]=="THREE_CONTEXTUAL_ORIGINALS_SAVED_PRIVATE_PENDING_HEARING"
            and j["voiceId"]==VOICE and j["modelId"]==MODEL
            and j["publicReleaseAuthorized"] is False
            and j["newContextSentenceOwnerListeningApproved"] is False,
            "three historical originals not safe for private recovery")
    require(len(j["entries"])==3 and
            all(x["status"]=="ORIGINAL_MP3_SAVED_AWAITING_CONTEXT_OWNER_LISTENING"
                and x["fullSentenceOwnerListeningApproved"] is False
                for x in j["entries"]),"not all three original paid receipts intact")
    wrong=[x for x in j["entries"] if "Halāle" in x["sourceText"]]
    require(len(wrong)==1 and wrong[0]["mp3Sha256"]==
            bad["rejectedProviderOriginalSHA256"] or
            len(wrong)==1 and wrong[0]["mp3Sha256"]== 
            rd(ROOT/"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json")
            ["oldPaidRejectedContextOriginal"]["originalSha256"],
            "original Halāle rejection was lost")
    require(reg["modelId"]==MODEL and reg["voiceId"]==VOICE and not reg["live"]
          and not ledger["live"] and len(plan["recipes"])==450,
          "unexpected production source/release lane")
    require(hold["productionPaused"] and not hold["publicQuizAudioReleaseAuthorized"]
          and not hold["humanPronunciationApproved"],"owner pronunciation hold changed")
    sources={x["sourceText"]:x for x in j["entries"]}
    require(len(sources)==3 and set(WHITELIST)<=set(sources),"exact 2 recoverable receipts missing")
    ids={q["questionId"]:q for q in plan["recipes"]}
    for text,qid in WHITELIST.items():
        require(qid in ids and text in [
             x for p in ("question","correct","retry","explanation")
             for x in ids[qid][p].get("segments",[])],
             "source no longer matches intended curated quiz ID")
    imported=[]
    for text,qid in WHITELIST.items():
        src=sources[text]
        require(text not in reg["textClips"],
                "already recovered, do not duplicate paid receipt")
        require(not any(row["text"]==text for row in ledger["rows"]),
                "already billed or imported direct V4 source")
        loc=src["originalUrl"]
        require(isinstance(loc,str) and loc.startswith("/kids/assets/kids-quiz-audio/")
                and loc.endswith(".mp3"),"unsafe source URL")
        path=(ROOT/loc.lstrip("/")).resolve()
        require(path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve())
                and path.is_file(),"actual historical MP3 missing")
        data=path.read_bytes()
        require(len(data)==src["mp3Bytes"] and sha(data)==src["mp3Sha256"]
                and sha(text.encode("utf8"))==src["sourceTextSHA256"]
                and src["providerRequestId"],"paid source SHA/bytes/receipt mismatch")
        probe=subprocess.run(["ffprobe","-v","error",
              "-show_entries","format=duration:stream=codec_name",
              "-of","json",str(path)],capture_output=True,text=True,timeout=12)
        require(probe.returncode==0 and "mp3" in probe.stdout,
                "previously paid MP3 not decodable")
        row={"url":loc,"sha256":src["mp3Sha256"],
            "textSha256":src["sourceTextSHA256"],
            "bytes":src["mp3Bytes"],"voiceId":VOICE,"modelId":MODEL,
            "audioListeningApproved":False,
            "qaApproval":"pending-human-auditory-review",
            "source":"historical-paid-owner-context-audition-private-only",
            "status":"PRIVATE_PREPAID_CONTEXT_AWAITING_HUMAN_PHONETIC_REVIEW",
            "providerRequestId":src["providerRequestId"]}
        reg["textClips"][text]=row
        ledger["rows"].append({
          "batchId":"KIDS_V4_TWO_PREPAID_CONTEXT_RECOVERED_20261023",
          "text":text,"textSha256":src["sourceTextSHA256"],
          "mp3Sha256":src["mp3Sha256"],
          "providerRequestId":src["providerRequestId"],
          "estimatedCreditsAtObservedRate":None,"exactBilledCredits":None,
          "originallyPaidAt":src["completedAt"],
          "note":"PREVIOUSLY PAID same immutable provider original: no new API request or credits"})
        imported.append({"questionId":qid,"text":text,
          "originalSHA256":src["mp3Sha256"],"originalUrl":loc,
          "humanHearingApproved":False})
    require(len(imported)==2 and
            all("Halāle" not in x["text"] for x in imported),
            "do not import obsolete owner-rejected Halāle source")
    REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    LEDGER.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    PROOF.write_text(json.dumps({
        "scope":"TWO_PREVIOUSLY_PAID_V4_CONTEXTUAL_MASTER_MP3S_PRIVATE_RECOVERY",
        "date":"2026-10-23",
        "voiceId":VOICE,"modelId":MODEL,"sourceEntries":imported,
        "previouslyPaidMP3Recovered":2,"newElevenLabsRequests":0,
        "newCreditsSpent":0,"humanListeningApprovalsClaimed":0,
        "publicReleaseAuthorized":False,
        "rejectedHalaleOriginalExcluded":True,
        "quranAndArabicNamePronunciationStillRequiresOwnerReview":True,
     },ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("KIDS_V4_TWO_HISTORICAL_PAID_SAMPLES_IMPORTED_NO_NEW_CREDITS",flush=True)
if __name__=="__main__":main()
