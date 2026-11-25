#!/usr/bin/env python3
"""Read-only public Cloudflare proof of 45 Gute Worte age-based V4 audio clicks:
34 new real owner V4 clips + eleven previously approved exact-SHA media tracks.
Never requests new paid synthesis or falsely claims native hardware review.
"""
from __future__ import annotations
import concurrent.futures,datetime,hashlib,json,pathlib,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
HOST="https://dar-al-tawhid.de"
MANIFEST="/kids/data/academy-audio.json"
PLAN=ROOT/"kids/data/academy-topic-batches/adab-worte-editorial-preflight-v1.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(path,limit=8*1024*1024):
    url=HOST+path+("?v="+str(int(time.time())) if "?" not in path else "&v="+str(int(time.time())))
    req=urllib.request.Request(url,headers={"User-Agent":"DAR-KIDS-WORTE-V4-LIVE-HASH-AUDIT/1","Cache-Control":"no-cache"})
    with urllib.request.urlopen(req,timeout=25) as resp:
        data=resp.read(limit+1)
        code=resp.status
        mime=resp.headers.get("Content-Type","").split(";",1)[0].lower()
    if code!=200 or len(data)>limit:raise RuntimeError("Missing HTTP200 full media "+path)
    return data,mime

def main():
    plan=json.loads(PLAN.read_text("utf-8"))
    wanted={row["visibleText"] for row in plan["entries"]}
    reused={row["visibleText"] for row in plan["entries"] if row.get("existingApprovedManifestCandidate") is True}
    if (plan.get("topicId")!="adab-worte" or len(plan["entries"])!=45 or len(wanted)!=45 or len(reused)!=11
        or any(not row["providerGenerated"] or not row["mediaImported"] for row in plan["entries"])):
        raise RuntimeError("The 45 genuine exact public child phrase contracts are not complete")
    original=json.loads((ROOT/MANIFEST.lstrip("/")).read_text("utf-8"))
    if not wanted.issubset(original.get("entries",{})):raise RuntimeError("Missing local owner master V4 audio")
    new={k for k,e in original["entries"].items() if e.get("sourceLessonId")=="adab-worte"}
    if len(new)!=34 or new!=(wanted-reused):
        raise RuntimeError("Gute Worte must have 34 new distinct plus 11 exact pre-approved shared audios")
    expected={k:original["entries"][k] for k in wanted}
    full=original["entries"].get("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.")
    if not full or full.get("sha256")!="9932942b89f5c62f8a2dae79a00650ed149e6f17a4e8d137ef086873577ba76b":
        raise RuntimeError("Preserved full Arabic greeting original was regenerated, deleted or replaced")
    for name,e in expected.items():
        if (not e.get("approvedForPlayback") or e.get("voiceId")!=VOICE or
            e.get("modelId")!="eleven_v4" or e.get("sourceVoice")!="authorized-owner-voice"
            or e.get("sourceSpeaker")!="Serhat Abu Malik" or
            not e["url"].startswith("/kids/assets/kids-academy-audio/") or
            not e["url"].endswith(".m4a") or len(e.get("sha256",""))!=64):
            raise RuntimeError("Invalid or unauthenticated master audio "+name)
        if name in reused and e.get("sourceLessonId")=="adab-worte":
            raise RuntimeError("Reused audio provenance overwritten")
        if name in new and e.get("sourceApi")!="text-to-dialogue-eleven-v4":
            raise RuntimeError("New Gute Worte clip was not actually owner eleven_v4 generated")
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
            print("Waiting for canonical worker public manifest to include all 45 original V4 clips",n+1,flush=True)
            time.sleep(15)
    def verify(item):
        title,e=item
        for attempt in range(4):
            try:
                data,mime=fetch(e["url"])
                if mime not in ("audio/mp4","audio/x-m4a","application/octet-stream","video/mp4"):
                    raise RuntimeError("Non-M4A media MIME: "+mime)
                if len(data)<1200 or sha(data)!=e["sha256"]:
                    raise RuntimeError("Wrong public original owner V4 media bytes")
                return len(data)
            except Exception as exc:
                if attempt==3:
                    raise RuntimeError("PUBLIC MASTER AUDIO NOT DELIVERED: "+e["url"]+
                        " childText="+repr(title)+" underlying="+repr(exc)) from exc
                time.sleep(10)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        sizes=list(pool.map(verify,sorted(expected.items())))
    ages={ctx.get("age") for e in plan["entries"] for ctx in e["contexts"]}
    if not {"4-5","6-8","9-10"}.issubset(ages):
        raise RuntimeError("Missing age coverage in child audio source")
    result={"status":"PASS","topic":"adab-worte","modelId":"eleven_v4",
        "voiceId":VOICE,"fullChildAudios":45,"newPaidOriginalChildClips":34,
        "reusedPreviouslyApprovedOriginalChildClips":11,
        "publicManifestExactMatches":45,"realAudioHTTP200Sha256Matches":45,
        "publicOriginalAudioBytesVerified":sum(sizes),
        "ageGroups":["4-5","6-8","9-10"],
        "syntheticQuranRecitationUsed":False,
        "nativeIphoneIpadManualPlaybackNotVerifiedByAutomation":True,
        "humanFuṣḥāListeningAuditNotPerformed":True,
        "verifiedAtUtc":datetime.datetime.now(datetime.timezone.utc).isoformat()}
    print(json.dumps(result,ensure_ascii=False),flush=True)
if __name__=="__main__":main()
