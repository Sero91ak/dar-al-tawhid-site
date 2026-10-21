#!/usr/bin/env python3
"""One-shot import of already paid ElevenLabs V4 originals via signed media URLs.

Only GET, NEVER TTS. The ten spoken texts / voice / model / generation IDs
must match the previously persisted provider receipt escrow exactly. Signed
urls are transient input ONLY, not included in reports, committed registries
or GitHub issue comments. Caller deletes transient URL source on success.
"""
from __future__ import annotations
import hashlib,json,os,subprocess,urllib.parse,urllib.request
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts

ROOT=Path(__file__).resolve().parents[2]
REQ=ROOT/"kids/review-only/quiz-v4-signed-originals-one-time-private-transfer.json"
LEDGER=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PAID=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
REPORT=ROOT/"kids/review-only/quiz-v4-signed-originals-import-result.json"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def load(p):return json.loads(p.read_text(encoding="utf-8"))
def write(p,obj):
    p.parent.mkdir(parents=True,exist_ok=True)
    temp=p.with_suffix(p.suffix+".pending")
    temp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    temp.replace(p)
def require(x,why):
    if not x:raise RuntimeError("KIDS_V4_SIGNED_ORIGINAL_IMPORT_STOP: "+why)
def shas(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()
def shab(b):return hashlib.sha256(b).hexdigest()

def source_url(url,entry):
    require(isinstance(url,str) and len(url)<2200,"invalid signed media reference")
    p=urllib.parse.urlsplit(url)
    require(p.scheme=="https" and p.hostname=="storage.googleapis.com" and
        p.port is None and p.username is None and p.password is None,
        "signed MP3 host differs from ElevenLabs original")
    require(p.path.endswith("/"+entry["generationId"]+"/content.mp3") and
        "/content_generation/"+entry["sessionId"]+"/" in p.path and
        p.path.startswith("/xi-backend/database/workspace/"),
        "signed URL does not point to the previously paid exact generation")
    q=urllib.parse.parse_qs(p.query,keep_blank_values=True)
    require(q.get("X-Goog-Algorithm")==["GOOG4-RSA-SHA256"] and
        bool(q.get("X-Goog-Signature")) and
        q.get("X-Goog-SignedHeaders")==["host"],
        "not a real time-limited signed download URL")
    return url

def download(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={"Accept":"audio/mpeg"}),timeout=55) as r:
        require(r.status==200,"original signed MP3 denied")
        media=r.read(2_000_001)
    require(1800<len(media)<=2_000_000 and
            (media.startswith(b"ID3") or media[:1]==b"\xff"),
            "wrong byte shape or oversized signed original")
    return media

def main():
    require(load(RELEASE).get("enabled") is False,"public release must be OFF")
    req,escrow,reg,paid=map(load,(REQ,LEDGER,REG,PAID))
    require(req.get("voiceId")==VOICE and req.get("modelId")==MODEL and
        escrow.get("voiceId")==VOICE and escrow.get("modelId")==MODEL and
        reg.get("voiceId")==VOICE and reg.get("modelId")==MODEL and
        escrow.get("live") is False and reg.get("live") is False and paid.get("live") is False,
        "voice, model or private source changed")
    source=req.get("originals")
    require(isinstance(source,list) and 0<len(source)<=10,
            "exactly one bounded already-paid originals batch expected")
    # Only actually generated originals have a generation ID. Future
    # source texts are reserved with null IDs to prohibit double charges.
    finished_ids=[x["generationId"] for x in escrow["entries"] if x.get("generationId")]
    byid={x["generationId"]:x for x in escrow["entries"] if x.get("generationId")}
    require(len(byid)==len(finished_ids),"duplicated non-empty provider generation ID")
    require(len(source)==len({x["generationId"] for x in source}),
            "signed original generation repeated")
    protect_paid_texts(ROOT,reg,paid)
    registered=set(reg["textClips"])
    paidtexts={x["text"] for x in paid["rows"]}
    validated=[]
    for row in source:
        gid=row["generationId"]
        old=byid.get(gid)
        require(old is not None and old["status"]=="GENERATED_AWAITING_ORIGINAL_MP3_IMPORT"
            and old["sourceTextSHA256"]==row.get("sourceTextSHA256")
            and shas(old["sourceText"])==row["sourceTextSHA256"]
            and old.get("providerStatus")=="completed"
            and old.get("sessionId")==row.get("sessionId")
            and old["sourceText"] not in registered and old["sourceText"] not in paidtexts,
            "recovery source absent, already paid in another source, or already imported")
        validated.append((old,source_url(row.get("signedOriginalMP3"),old)))
    OUT.mkdir(parents=True,exist_ok=True)
    completed=[]
    for old,url in validated:
        audio=download(url)
        text=old["sourceText"]
        name=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode()).hexdigest()[:32]+".mp3"
        target=OUT/name
        require(not target.exists(),"source MP3 already physically saved")
        pending=target.with_name(name+".pending")
        pending.write_bytes(audio)
        try:
            ff=subprocess.run(["ffprobe","-v","error","-show_entries",
                "format=duration:stream=codec_name,codec_type","-of","json",str(pending)],
                text=True,capture_output=True,check=True)
            meta=json.loads(ff.stdout)
            streams=[x for x in meta.get("streams",[]) if x.get("codec_type")=="audio"]
            dur=float((meta.get("format") or {}).get("duration") or 0)
            expected=float(old.get("providerGenerationDurationSeconds") or 0)
            require(len(streams)==1 and streams[0].get("codec_name")=="mp3"
                and .30<dur<180 and (not expected or abs(dur-expected)<1.5),
                "verified original MP3 codec/duration disagrees with provider receipt")
            pending.replace(target)
        finally:
            if pending.exists():pending.unlink()
        digest=shab(audio)
        url="/"+str(target.relative_to(ROOT))
        original={
            "url":url,"sha256":digest,"textSha256":shas(text),"bytes":len(audio),
            "voiceId":VOICE,"modelId":MODEL,
            "audioListeningApproved":False,
            "qaApproval":"pending-human-auditory-review",
            "source":"already-paid-elevenlabs-original-signed-media-get",
            "originalGenerationId":old["generationId"],
            "status":"REVIEW_ONLY_NOT_PUBLIC"}
        reg["textClips"][text]=original
        paid["rows"].append({
            "batchId":"KIDS_V4_CREATIVE_PAID_IMPORT_GET_ONLY",
            "text":text,"textSha256":shas(text),"mp3Sha256":digest,
            "providerGenerationId":old["generationId"],
            "providerRequestId":None,
            "exactBilledCredits":old.get("actualProviderCredits"),
            "note":"Original generation already paid; GET-only recovery; NEVER charge a second TTS"})
        old.update({
            "status":"IMPORTED_ORIGINAL_MP3_VERIFIED",
            "importedMP3SHA256":digest,"originalMP3SHA256":digest,
            "originalMP3URL":url,"originalMP3ImportedIntoGithub":True})
        write(REG,reg);write(PAID,paid);write(LEDGER,escrow)
        completed.append({"generationId":old["generationId"],
                          "sourceTextSHA256":shas(text),"mp3Sha256":digest,
                          "durationSeconds":dur,"bytes":len(audio)})
        print("KIDS_V4_EXISTING_PAID_ORIGINAL_IMPORTED "+
              json.dumps({"count":len(completed),"sourceTextSHA256":shas(text),
                          "mp3SHA256":digest}),flush=True)
    # No temporary signed URL is saved to the durable report.
    write(REPORT,{"scope":"KIDS_V4_SIGNED_ALREADY_PAID_ORIGINALS",
        "alreadyPaidOriginalsImported":len(completed),
        "successfulImports":completed,
        "newTTSGenerations":0,"newCreditsSpent":0,
        "newCreditPurchases":0,"publicReleaseEnabled":False,
        "humanPronunciationApproved":False})
    print("KIDS_V4_SIGNED_IMPORT_DONE "+
          json.dumps({"imported":len(completed),"chargedNewCredits":0}),flush=True)

if __name__=="__main__":main()
