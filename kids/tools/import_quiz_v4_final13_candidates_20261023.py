#!/usr/bin/env python3
"""Import 13 new authorized but NOT pronunciation-approved Serhat V4 MP3s.
Preserve all earlier paid and user-quarantined originals unchanged.
"""
from pathlib import Path
import hashlib, json, urllib.parse, urllib.request, subprocess

ROOT=Path(__file__).resolve().parents[2]
INPUT=ROOT/"kids/review-only/quiz-v4-final13-transfer-20261023.json"
OUTPUT=ROOT/"kids/review-only/quiz-v4-final13-candidate-originals-20261023.json"
AUDIO=ROOT/"kids/assets/kids-quiz-audio/v4-final13-review"
PUBLIC=ROOT/"kids/data/quiz-curation-release.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
REQUIRED={
"Taqwā.",
"Allah nennt Taqwā als Maßstab der besonderen Ehre bei Ihm.",
"Glücksspiele spielen.",
"Angeben.",
"Der Qurʾān befiehlt an vielen Stellen Gebet und Zakāh gemeinsam.",
"Zur al-Masǧid al-Ḥarām in Makkah.",
"Welche Regel lehrt der Ḥadīṯ über Ḥalāl, Ḥarām und zweifelhafte Dinge?",
"Es gibt keinen Unterschied zwischen Ḥalāl und Ḥarām.",
"Ḥalāl und Ḥarām sind klar; bei Zweifelhaftem ist Vorsicht gut.",
"ʿIbādah und Duʿāʾ richten wir an Allah allein.",
"Gute Taten und ʿIbādah werden aufrichtig für Allah getan.",
"Wir machen ʿIbādah nicht, um vor Menschen Eindruck zu machen.",
"Dürfen wir andere mit beleidigenden Spitznamen rufen?"
}
def load(p):return json.loads(p.read_text(encoding="utf-8"))
def check(ok,why):
    if not ok:raise RuntimeError(why)

def main():
    transfer=load(INPUT)
    rows=transfer.get("items") or []
    check(transfer.get("scope")=="DAR_KIDS_V4_FINAL13_CANDIDATE_REVIEW_ONLY" and
          transfer.get("publicRelease") is False and transfer.get("humanListeningApproved") is False,"Forbidden transfer")
    check(load(PUBLIC).get("enabled") is False,"Public release flag must be off")
    registry=load(REG)
    check(registry.get("voiceId")==VOICE and registry.get("modelId")==MODEL and registry.get("live") is False,"Bad original registry")
    check(len(rows)==13 and {x["text"] for x in rows}==REQUIRED and
          len({x["generationId"] for x in rows})==13,"Missing, duplicate or unrelated source text")
    AUDIO.mkdir(parents=True,exist_ok=True)
    saved={}
    for item in rows:
        src=item["signedSourceUrl"]
        parsed=urllib.parse.urlsplit(src)
        check(parsed.scheme=="https" and parsed.netloc=="storage.googleapis.com"
              and "/content_generation/" in parsed.path and parsed.path.endswith("/content.mp3")
              and parsed.path.split("/content_generation/")[1].split("/")[1]==item["generationId"]
              and "X-Goog-Signature=" in parsed.query, "Untrusted provider source")
        text=item["text"];digest=hashlib.sha256(text.encode("utf-8")).hexdigest()
        check(item["textSha256"]==digest and item["voiceId"]==VOICE and item["modelId"]==MODEL,"Wrong text/voice/model")
        dest=AUDIO/(digest[:32]+".mp3")
        check(not dest.exists(),"Original candidate already stored; do not overwrite or rebill")
        req=urllib.request.Request(src,headers={"User-Agent":"DAR-KIDS-V4-authorized-final13-import/1"})
        with urllib.request.urlopen(req,timeout=45) as res:
            data=res.read(1_900_000)
            check(res.status==200 and 1800<len(data)<1_900_000 and res.read(1)==b"","Invalid provider MP3 bytes")
        dest.write_bytes(data)
        dec=subprocess.run(["ffprobe","-v","error","-show_entries",
            "format=duration:stream=codec_name,codec_type","-of","json",str(dest)],
            capture_output=True,text=True,check=True)
        meta=json.loads(dec.stdout)
        streams=[s for s in meta.get("streams",[]) if s.get("codec_type")=="audio"]
        duration=float(meta.get("format",{}).get("duration") or 0)
        check(len(streams)==1 and streams[0].get("codec_name")=="mp3"
              and .5<duration<45,"MP3 codec/duration invalid")
        vol=subprocess.run(["ffmpeg","-v","info","-i",str(dest),"-af","volumedetect","-vn","-f","null","-"],
                           capture_output=True,text=True,check=True)
        check("mean_volume:" in vol.stderr,"No audio signal detected")
        saved[text]={
            "url":"/"+str(dest.relative_to(ROOT)), "textSha256":digest,
            "sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),
            "voiceId":VOICE,"modelId":MODEL,"durationSeconds":round(duration,3),
            "generationId":item["generationId"],"source":"owner-authorized-new-V4-review-original",
            "audioListeningApproved":False,"humanPronunciationApproved":False,
            "approvedForPlayback":False,"publicReleaseAllowed":False,
            "dictionaryAppliedVerified":False,"retainsPreviousPaidOriginal":True,
            "creditsReportedByProvider":item["creditsReportedByProvider"]
        }
    OUTPUT.write_text(json.dumps({
        "scope":"KIDS_V4_13_NEW_MASTER_CANDIDATES_PRIVATE",
        "modelId":MODEL,"voiceId":VOICE,"expectedCount":13,
        "reviewOnly":True,"publicReleaseAllowed":False,"humanListeningApproved":False,
        "oldPaidOriginalsPreserved":True,"clips":saved
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_FINAL13_VERIFIED_MP3_ORIGINALS",len(saved), "REVIEW_ONLY",flush=True)

if __name__=="__main__":main()
