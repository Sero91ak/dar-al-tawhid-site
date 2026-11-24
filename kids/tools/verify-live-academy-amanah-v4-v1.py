#!/usr/bin/env python3
"""Read-only public Cloudflare proof of 32 Amānah age-based V4 audio clicks:
27 new real owner V4 clips + five previously approved exact-SHA media tracks.
Never requests new paid synthesis or falsely claims native hardware review.
"""
from __future__ import annotations
import concurrent.futures,datetime,hashlib,json,pathlib,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
HOST="https://dar-al-tawhid.de"
MANIFEST="/kids/data/academy-audio.json"
PLAN=ROOT/"kids/data/academy-topic-batches/akhlaq-amanah-preproduction-v1.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(path,limit=8*1024*1024):
    url=HOST+path+("?v="+str(int(time.time())) if "?" not in path else "&v="+str(int(time.time())))
    req=urllib.request.Request(url,headers={"User-Agent":"DAR-KIDS-AMANAH-V4-LIVE-HASH-AUDIT/1","Cache-Control":"no-cache"})
    with urllib.request.urlopen(req,timeout=25) as resp:
        data=resp.read(limit+1)
        code=resp.status
        mime=resp.headers.get("Content-Type","").split(";",1)[0].lower()
    if code!=200 or len(data)>limit:raise RuntimeError("Missing HTTP200 full media "+path)
    return data,mime

def main():
    plan=json.loads(PLAN.read_text("utf-8"))
    wanted={row["visibleText"] for row in plan["entries"]}
    reused={row["visibleText"] for row in plan["entries"] if row.get("reusedExistingApprovedOwnerV4") is True}
    if (plan.get("topicId")!="akhlaq-amanah" or len(plan["entries"])!=32 or len(wanted)!=32 or len(reused)!=5
        or any(not row["providerGenerated"] or not row["mediaImported"] for row in plan["entries"])):
        raise RuntimeError("The 32 genuine exact public child phrase contracts are not complete")
    original=json.loads((ROOT/MANIFEST.lstrip("/")).read_text("utf-8"))
    if not wanted.issubset(original.get("entries",{})):raise RuntimeError("Missing local owner master V4 audio")
    new={k for k,e in original["entries"].items() if e.get("sourceLessonId")=="akhlaq-amanah"}
    if len(new)!=27 or new!=(wanted-reused):
        raise RuntimeError("Amānah must have 27 new distinct plus 5 exact pre-approved shared audios")
    expected={k:original["entries"][k] for k in wanted}
    for name,e in expected.items():
        if (not e.get("approvedForPlayback") or e.get("voiceId")!=VOICE or
            e.get("modelId")!="eleven_v4" or e.get("sourceVoice")!="authorized-owner-voice"
            or e.get("sourceSpeaker")!="Serhat Abu Malik" or
            not e["url"].startswith("/kids/assets/kids-academy-audio/") or
            not e["url"].endswith(".m4a") or len(e.get("sha256",""))!=64):
            raise RuntimeError("Invalid or unauthenticated master audio "+name)
        if name in reused and e.get("sourceLessonId")!="akhlaq-sabr":
            raise RuntimeError("Previously paid audio should belong to the earlier Ṣabr lesson")
        if name in new and e.get("sourceApi")!="text-to-dialogue-eleven-v4":
            raise RuntimeError("New Amānah clip was not actually owner eleven_v4 generated")
        local=ROOT/e["url"].lstrip("/")
        if not local.is_file() or sha(local.read_bytes())!=e["sha256"]:
            raise RuntimeError("Original GitHub media mismatch "+name)
    for n in range(12):
        try:
            data,ctype=fetch(MANIFEST)
            manifest=json.loads(data.decode("utf-8"))
            actual=manifest.get("entries",{})
            if not wanted.issubset(actual):raise RuntimeError("Cloudflare manifest older than production")
            for title,e in expected.items():
                if any(actual[title].get(k)!=e.get(k) for k in ("voiceId","modelId","url","sha256")):
                    raise RuntimeError("Cloudflare manifest original media differs "+title)
            break
        except Exception:
            if n==11:raise
            print("Waiting for canonical worker public manifest to include all 32 original V4 clips",n+1,flush=True)
            time.sleep(15)
    def verify(item):
        title,e=item
        data,mime=fetch(e["url"])
        if mime not in ("audio/mp4","audio/x-m4a","application/octet-stream","video/mp4"):
            raise RuntimeError("Non-M4A media MIME "+title)
        if len(data)<1200 or sha(data)!=e["sha256"]:
            raise RuntimeError("Wrong public original owner V4 media bytes "+title)
        return len(data)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        sizes=list(pool.map(verify,sorted(expected.items())))
    ages={ctx.get("age") for e in plan["entries"] for ctx in e["contexts"]}
    if not {"4-5","6-8","9-10"}.issubset(ages):
        raise RuntimeError("Missing age coverage in child audio source")
    result={"status":"PASS","topic":"akhlaq-amanah","modelId":"eleven_v4",
        "voiceId":VOICE,"fullChildAudios":32,"newPaidOriginalChildClips":27,
        "reusedPreviouslyApprovedOriginalChildClips":5,
        "publicManifestExactMatches":32,"realAudioHTTP200Sha256Matches":32,
        "publicOriginalAudioBytesVerified":sum(sizes),
        "ageGroups":["4-5","6-8","9-10"],
        "syntheticQuranRecitationUsed":False,
        "nativeIphoneIpadManualPlaybackNotVerifiedByAutomation":True,
        "humanFuṣḥāListeningAuditNotPerformed":True,
        "verifiedAtUtc":datetime.datetime.now(datetime.timezone.utc).isoformat()}
    print(json.dumps(result,ensure_ascii=False),flush=True)
if __name__=="__main__":main()
