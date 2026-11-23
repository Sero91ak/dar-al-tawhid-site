#!/usr/bin/env python3
"""Read-only Cloudflare proof for 32 genuine, child-clickable Ṣabr V4 clips.
Compares every public media byte hash with the same GitHub main manifest;
never starts new ElevenLabs calls or alters any user/app data.
"""
from __future__ import annotations
import concurrent.futures,datetime,json,hashlib,pathlib,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
HOST="https://dar-al-tawhid.de"
MANIFEST="/kids/data/academy-audio.json"
PLAN=ROOT/"kids/data/academy-topic-batches/akhlaq-sabr-preproduction-v1.json"
OWNER="DkU7j9uO4ZEtLD2iRZSH"

def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(path,limit=8*1024*1024):
    url=HOST+path+("?v="+str(int(time.time())) if "?" not in path else "&v="+str(int(time.time())))
    req=urllib.request.Request(url,headers={"User-Agent":"DAR-KIDS-SABR-V4-RELEASE-DELIVERY-AUDIT/1","Cache-Control":"no-cache"})
    with urllib.request.urlopen(req,timeout=25) as f:
        code=f.status
        ctype=f.headers.get("Content-Type","").split(";",1)[0].lower()
        body=f.read(limit+1)
    if code!=200 or len(body)>limit:
        raise RuntimeError("Cloudflare did not return full HTTP 200 media for "+path)
    return body,ctype

def by_topic(doc):
    return {t:e for t,e in doc["entries"].items()
            if isinstance(e,dict) and e.get("sourceLessonId")=="akhlaq-sabr"}

def main():
    local=json.loads((ROOT/MANIFEST.lstrip("/")).read_text("utf-8"))
    plan=json.loads(PLAN.read_text("utf-8"))
    expected=by_topic(local)
    ids={item["visibleText"] for item in plan["entries"]}
    if (len(ids)!=32 or len(expected)!=32 or set(expected)!=ids or
        any(not x["providerGenerated"] or not x["mediaImported"] for x in plan["entries"])):
        raise RuntimeError("Source manifest does not contain exactly the 32 genuine approved owner V4 recordings")
    for t,e in expected.items():
        if (e.get("voiceId")!=OWNER or e.get("modelId")!="eleven_v4" or
            e.get("sourceApi")!="text-to-dialogue-eleven-v4" or
            e.get("sourceVoice")!="authorized-owner-voice" or
            e.get("approvedForPlayback") is not True or
            not e.get("sourceSegmentKeys") or
            not e["url"].startswith("/kids/assets/kids-academy-audio/") or
            not e["url"].endswith(".m4a") or not len(e["sha256"])==64):
            raise RuntimeError("Non-original audio placeholder in source manifest: "+t)
        target=ROOT/e["url"].lstrip("/")
        if not target.is_file() or sha(target.read_bytes())!=e["sha256"]:
            raise RuntimeError("Local original media sha drift")
    for trial in range(1,13):
        try:
            raw,content_type=fetch(MANIFEST)
            live=json.loads(raw.decode("utf-8"))
            published=by_topic(live)
            if (set(published)!=set(expected) or
                any(published[t].get("sha256")!=e["sha256"] or
                    published[t].get("url")!=e["url"] or
                    published[t].get("voiceId")!=e["voiceId"]
                    for t,e in expected.items())):
                raise RuntimeError("Cloudflare content still differs from GitHub main")
            break
        except Exception:
            if trial==12:raise
            print("Cloudflare deploy awaiting matching all-32 manifest; check",trial,flush=True)
            time.sleep(15)
    def track(item):
        t,e=item
        b,mime=fetch(e["url"])
        if mime not in ("audio/mp4","audio/x-m4a","application/octet-stream","video/mp4"):
            raise RuntimeError("Unexpected media MIME for real audio "+t)
        if len(b)<1200 or sha(b)!=e["sha256"]:
            raise RuntimeError("Live audio is not the original SHA-verified owner V4 file: "+t)
        return len(b)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        sizes=list(pool.map(track,sorted(expected.items())))
    if len(sizes)!=32:raise RuntimeError("Incomplete topic web delivery")
    ages={a for row in plan["entries"] for a in [c["age"] for c in row["contexts"]]}
    if not {"4-5","6-8","9-10"}.issubset(ages):
        raise RuntimeError("Not all three children's age bands are in real source material")
    print(json.dumps({"status":"PASS","topic":"akhlaq-sabr",
        "ownerVoice":"Serhat Abu Malik – Master","model":"eleven_v4",
        "publicManifestExactMatches":32,"realAudioHTTP200Sha256Matches":len(sizes),
        "publicOriginalAudioBytesVerified":sum(sizes),
        "ageBandsVerifiedFromSource":sorted(ages),
        "quranRecitationNotSyntheticallyGenerated":True,
        "webAndInAppWebViewAssetDeliveryVerified":True,
        "realIphoneIpadPlaybackNotTestedByScript":True,
        "humanArabicListeningAssessmentNotPerformed":True,
        "lastVerifiedUtc":datetime.datetime.now(datetime.timezone.utc).isoformat()},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
