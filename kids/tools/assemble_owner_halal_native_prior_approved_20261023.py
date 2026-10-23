#!/usr/bin/env python3
"""Cost-free private 'Halal' review. Preserve owner-approved Fuṣḥā حَلَال.
Do not use the rejected German V4 Hala full take for playback.
Only take two German fragments and insert the exact prior native original.
Timing boundaries must still receive owner listening approval.
"""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
META=ROOT/"kids/review-only/quiz-v4-halal-fusha-owner-bad-full-sentence-quarantine-20261023.json"
VERDICT=ROOT/"kids/review-only/kids-v4-three-arabic-audition-owner-verdict-20261023.json"
CORRECT=ROOT/"kids/data/quiz-v4-halal-invariant-owner-correction-20261023.json"
STATUS=ROOT/"kids/data/quiz-v4-450-production-status.json"
HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-halal-native-joined-owner-review-20261023"
RESULT=ROOT/"kids/review-only/kids-v4-halal-native-arabic-reused-composite-audit-20261023.json"
def read(p):return json.loads(p.read_text(encoding="utf8"))
def check(v,msg):
    if not v:raise RuntimeError("KIDS_HALAL_NATIVE_OWNER_REUSE_STOP: "+msg)
def asset(url,expected):
    check(isinstance(url,str) and url.startswith("/kids/assets/kids-quiz-audio/"),"unsafe original URL")
    path=(ROOT/url.lstrip("/")).resolve()
    check(path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve())
          and path.is_file(),"missing original MP3")
    raw=path.read_bytes()
    check(hashlib.sha256(raw).hexdigest()==expected,"original source SHA drift")
    check(len(raw)>1500 and (raw.startswith(b"ID3") or raw[:1]==b"\xff"),"source not MP3")
    return path
def main():
    check(not RESULT.exists(),"already generated private review; do not overwrite")
    meta,v,c,hold,status=map(read,(META,VERDICT,CORRECT,HOLD,STATUS))
    check(meta["rejectedSourceText"]=="Nahrung, die Halal und gut ist."
          and meta["approvedNativeSourceText"]=="حَلَال"
          and meta["mustNeverReuseRejectedFullGermanTake"]
          and meta["mixedSentenceHearingApproved"] is False
          and meta["publicReleaseAllowed"] is False,"Hala rejection changed")
    check(v["ownerAcceptedAllThreeIsolatedSamples"] is True
          and v["approvalAppliesOnlyToThreeIsolatedSamples"] is True
          and v["publicReleaseAuthorized"] is False,"native original has no owner sample verdict")
    check(c["wordToDisplayAndSpeakExactly"]=="Halal"
          and not c["publicReleaseAllowed"],"displayed Halal source changed")
    check(hold["productionPaused"] is True
          and hold["humanPronunciationApproved"] is False
          and not hold["publicQuizAudioReleaseAuthorized"]
          and not status["livePublished"],"public quiz pronunciation still held")
    bad=asset(meta["rejectedOriginalURL"],meta["rejectedProviderOriginalSHA256"])
    native=asset(meta["nativeOriginalURL"],meta["approvedNativeOriginalSHA256"])
    OUTPUT.mkdir(parents=True,exist_ok=True)
    dest=OUTPUT/"Halal-previously-approved-native-fusha-in-sentence-review.mp3"
    m4a=OUTPUT/"Halal-previously-approved-native-fusha-in-sentence-review.m4a"
    check(not dest.exists() and not m4a.exists(),"do not overwrite hearing recording")
    # Boundaries determined from the original short German sample around its
    # mistaken middle word. Must be approved by listening, not SHA QA alone.
    filt=(
      "[0:a]atrim=start=0:end=0.708,asetpts=PTS-STARTPTS[a0];"
      "[1:a]atrim=start=0:end=0.800,asetpts=PTS-STARTPTS[a1];"
      "[0:a]atrim=start=1.563:end=2.560,asetpts=PTS-STARTPTS[a2];"
      "[a0][a1][a2]concat=n=3:v=0:a=1[review]"
    )
    proc=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
           "-i",str(bad),"-i",str(native),
           "-filter_complex",filt,"-map","[review]",
           "-c:a","libmp3lame","-ar","44100","-b:a","128k",str(dest)],
           capture_output=True,text=True,timeout=35)
    check(proc.returncode==0,"ffmpeg join invalid "+proc.stderr[-250:])
    check(dest.is_file() and dest.stat().st_size>3000,"review MP3 missing")
    duration=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
       "-of","default=nw=1:nk=1",str(dest)],capture_output=True,text=True,timeout=10)
    check(duration.returncode==0 and 2.3<float(duration.stdout)<3.0,
          "joined audio duration unexpected; do not reuse")
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
       "-i",str(dest),"-vn","-c:a","aac","-b:a","128k",str(m4a)],
       check=True,timeout=25)
    out={"schemaVersion":1,"date":"2026-10-23",
        "sourceText":"Nahrung, die Halal und gut ist.",
        "spokenNativeArabicInserted":"حَلَال",
        "nativeOriginalSHA256":meta["approvedNativeOriginalSHA256"],
        "nativeV4OwnerApprovedAsIsolatedWord":True,
        "rejectedWholeGermanSourceSHA256":meta["rejectedProviderOriginalSHA256"],
        "rejectedWholeGermanClipNeverAllowedForPlayback":True,
        "reusedOnlyGermanStartAndEndOfOldTake":True,
        "approxCutPointsSeconds":{"germanPrefixEnd":0.708,
                                 "germanSuffixStart":1.563,
                                 "germanSuffixEnd":2.560},
        "manualBoundaryListeningStillRequired":True,
        "newFullSentenceOwnerListeningApproved":False,
        "assembledMP3":"/"+str(dest.relative_to(ROOT)),
        "assembledM4A":"/"+str(m4a.relative_to(ROOT)),
        "assembledMP3SHA256":hashlib.sha256(dest.read_bytes()).hexdigest(),
        "assembledM4ASHA256":hashlib.sha256(m4a.read_bytes()).hexdigest(),
        "newElevenLabsProviderCalls":0,"newCreditsSpent":0,
        "originalQuizManifestChanged":False,
        "liveAppUpdated":False,"publicReleaseAllowed":False}
    RESULT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("HALAL_APPROVED_NATIVE_REUSE_PRIVATE_MP3_CREATED "+
          json.dumps({"source":out["sourceText"],"sha256":out["assembledMP3SHA256"],
                      "nativeOriginal":out["nativeOriginalSHA256"],
                      "providerCalls":0,"publicRelease":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
