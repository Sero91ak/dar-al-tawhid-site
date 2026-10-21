#!/usr/bin/env python3
"""Import already-PAID ElevenLabs V4 Flow MP3 originals for TAWḤĪD KIDS.

Input: --zip ZIP or --directory DIR with audio files named GENERATION_ID.mp3.
Optional flow-audio-map.json in ZIP: {"generation_id":"downloaded-filename.mp3"}.
Only actual generation IDs in kids/data/quiz-v4-batch-001-020-review.json
are accepted. Source bytes are validated with ffprobe and SHA256 before
being copied to immutable local MP3 paths in GitHub review branch.
No ElevenLabs API, no credits, no synthesis, no public manifest writes.
"""
from __future__ import annotations
import argparse, hashlib, json, re, shutil, subprocess, tempfile, zipfile
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PRIOR=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-paid-flow-original-review"
REPORT=ROOT/"kids/data/quiz-v4-paid-flow-import-status.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
Q002={
    "question-opening":"Schau, was du schon alles weißt.",
    "question-core":"Ist Allah Einer?",
    "question-guidance":"Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein."
}
SPEECH={"question":"questionAudioText","correct":"correctAudioText",
        "retry":"retryAudioText","explanation":"explanationAudioText"}

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as source:
        for item in iter(lambda:source.read(1024*1024),b""):
            h.update(item)
    return h.hexdigest()

def get(path):return json.loads(path.read_text(encoding="utf-8"))

def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+".pending")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(path)

def original_metadata():
    q=get(PRIOR)
    if len(q.get("items") or [])!=20 or q.get("voiceId")!=VOICE or q.get("modelId")!=MODEL:
        raise RuntimeError("The original 20 paid V4 question metadata was changed")
    takes={}
    for question in q["items"]:
        for take in question.get("recordings") or []:
            gid=take["generationId"]
            if take.get("modelId")!=MODEL or not re.fullmatch(r"[A-Za-z0-9]{20}",gid):
                raise RuntimeError("Invalid old original flow generation ID")
            part=take["part"]
            text=Q002.get(part) if question["questionId"]=="kids-quiz-002" else None
            if text is None:
                field=SPEECH.get(part)
                if not field:
                    raise RuntimeError("Unknown old Flow voice part "+str(part))
                text=question[field]
            if not text:raise RuntimeError("Original paid Flow text unavailable")
            entry={"questionId":question["questionId"],"kind":part,"text":text,
                   "generationId":gid,"durationExpected":take.get("durationSeconds"),
                   "voiceId":VOICE,"modelId":MODEL}
            if gid in takes:
                # 82 old question-part assignments intentionally share only
                # 56 paid original takes: praise and retries were reused.
                # Different question IDs are fine; different texts are NOT.
                previous=takes[gid]
                if (previous["text"],previous["kind"],previous["modelId"],previous["voiceId"])!=(
                    entry["text"],entry["kind"],entry["modelId"],entry["voiceId"]):
                    raise RuntimeError("A paid Flow generation ID was mapped to conflicting text/voice")
                previous.setdefault("usedByQuestionIds",[previous["questionId"]]).append(question["questionId"])
                continue
            takes[gid]=entry
    if len(takes)!=56:raise RuntimeError("The 56 old paid Flow generation IDs were not preserved")
    joined=" ".join(Q002.values())
    byq={q["questionId"]:q for q in q["items"]}
    if byq["kids-quiz-002"]["questionAudioText"]!=joined:
        raise RuntimeError("Q002 three-part original is not text-exact")
    return takes

def probe(path,expected=None):
    if not path.is_file() or not 1800<path.stat().st_size<6_000_000:
        raise RuntimeError("Paid Flow original missing, empty or too large")
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
       "format=duration:stream=codec_name,codec_type","-of","json",str(path)],
       capture_output=True,text=True,check=True)
    data=json.loads(p.stdout)
    audios=[s.get("codec_name") for s in data.get("streams",[])
            if s.get("codec_type")=="audio"]
    dur=float(data.get("format",{}).get("duration") or 0)
    if len(audios)!=1 or audios[0]!="mp3" or not .4<dur<180:
        raise RuntimeError("Original is not a playable MP3 with valid duration")
    if isinstance(expected,(int,float)) and expected>0:
        if abs(dur-float(expected))>max(3.5,float(expected)*.32):
            raise RuntimeError("MP3 duration differs from paid Flow receipt")
    return round(dur,3)

def scan_files(folder,mapping,takes):
    found={}
    used_sources={}
    for gid,name in mapping.items():
        if gid not in takes:raise RuntimeError("Mapping contains an unknown already-paid generation ID")
        name=Path(name).name
        path=folder/name
        if not path.is_file() or path.suffix.lower()!=".mp3":
            raise RuntimeError("Missing mapped MP3 for "+gid)
        source=path.resolve()
        if source in used_sources and used_sources[source]!=gid:
            raise RuntimeError("A single MP3 cannot represent two separate paid generation IDs")
        used_sources[source]=gid
        found[gid]=path
    for mp3 in sorted(folder.rglob("*.mp3")):
        if not mp3.is_file():continue
        basename=mp3.name
        match=re.match(r"^([A-Za-z0-9]{20})(?:\.mp3|[-_].*\.mp3)$",basename,re.I)
        if not match or match.group(1) not in takes:continue
        gid=match.group(1)
        if gid in found and found[gid].resolve()!=mp3.resolve():
            raise RuntimeError("Duplicate ambiguous original audio mapping "+gid)
        found[gid]=mp3
    return found

def extract_safe(src,dest):
    mapping={}
    with zipfile.ZipFile(src) as archive:
        members=archive.infolist()
        if len(members)>250 or sum(x.file_size for x in members)>110_000_000:
            raise RuntimeError("Unusually large/ambiguous original Flow export ZIP")
        for info in members:
            raw=Path(info.filename)
            if info.is_dir():continue
            if raw.is_absolute() or ".." in raw.parts:
                raise RuntimeError("ZIP contains unsafe path")
            if info.file_size>6_000_000:raise RuntimeError("One export file is too large")
            name=raw.name
            if name=="flow-audio-map.json":
                mapping=json.loads(archive.read(info).decode("utf-8"))
                if not isinstance(mapping,dict):raise RuntimeError("Flow mapping must be object")
                continue
            if not name.lower().endswith(".mp3"):
                raise RuntimeError("ZIP contains non-MP3/non-manifest content")
            if (dest/name).exists():raise RuntimeError("Ambiguous duplicate filename in source ZIP")
            with archive.open(info) as fd,(dest/name).open("wb") as output:
                shutil.copyfileobj(fd,output)
    return mapping

def run(folder,dry=False):
    takes=original_metadata()
    reg=get(REG)
    if reg.get("voiceId")!=VOICE or reg.get("modelId")!=MODEL or reg.get("live") is not False:
        raise RuntimeError("Registry not correct V4 review-only speaker")
    reg.setdefault("generationClips",{})
    reg.setdefault("textClips",{})
    mapped={}
    inline_map=folder/"flow-audio-map.json"
    if inline_map.exists():
        mapped=get(inline_map)
        if not isinstance(mapped,dict):raise RuntimeError("Flow import map invalid")
    found=scan_files(folder,mapped,takes)
    report={"scope":"KIDS_V4_PREPAID_FLOW_RECOVERY","expectedPriorPaidGenerations":len(takes),
            "newCreditsSpent":0,"reviewOnly":True,
            "importedSourceIsUserExportNotProviderSignedAPIProof":True,
            "humanOriginalSourceAndPronunciationVerificationRequired":True,
            "importedIds":[],
            "alreadyImportedIds":[],"remainingGenerationIds":[],
            "errors":[],"previewPlaybackAllowed":False,
            "humanListeningApproved":False,"livePublicationAllowed":False}
    if not dry:OUT.mkdir(parents=True,exist_ok=True)
    # A human-supplied filename/metadata match is NOT cryptographic proof of
    # origin. Reject reusing identical MP3 bytes for DIFFERENT spoken texts;
    # preserve a separate human hearing/source verification requirement.
    sha_to_text={}
    for gid,path in sorted(found.items()):
        digest=sha(path)
        speech=takes[gid]["text"]
        previous=sha_to_text.get(digest)
        if previous is not None and previous!=speech:
            raise RuntimeError("One MP3 byte stream was mapped to conflicting V4 spoken texts")
        sha_to_text[digest]=speech
    for gid,info in sorted(takes.items()):
        source=found.get(gid)
        earlier=reg["generationClips"].get(gid)
        if earlier:
            url=earlier.get("url") or ""
            old=(ROOT/url.lstrip("/")).resolve()
            if not old.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()):
                raise RuntimeError("Previously imported paid audio path is unsafe")
            if not old.is_file() or sha(old)!=earlier.get("sha256"):
                raise RuntimeError("Previously imported paid audio missing or modified. STOP.")
            if source and sha(source)!=sha(old):
                raise RuntimeError("Same paid generation ID points to a different MP3; STOP.")
            report["alreadyImportedIds"].append(gid)
            continue
        if not source:
            report["remainingGenerationIds"].append(gid)
            continue
        secs=probe(source,info.get("durationExpected"))
        digest=sha(source)
        if not dry:
            dest=OUT/(gid+".mp3")
            if dest.is_file() and sha(dest)!=digest:
                raise RuntimeError("Already saved paid original file does not match. STOP.")
            if not dest.exists():shutil.copyfile(source,dest)
            clip={"url":"/"+str(dest.relative_to(ROOT)),"sha256":digest,
                "bytes":dest.stat().st_size,"modelId":MODEL,"voiceId":VOICE,
                "source":"manual-prepaid-elevenlabs-flow-export-linked-by-generation-id-and-duration",
                "sourceOriginalityCryptographicallyConfirmed":False,
                "requiresHumanSourceAndPronunciationVerification":True,
                "originalGenerationId":gid,"durationSeconds":secs,
                "textSha256":hashlib.sha256(info["text"].encode()).hexdigest(),
                "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
                "status":"prepaid-original-imported-review-only"}
            reg["generationClips"][gid]=clip
            reg["textClips"].setdefault(info["text"],clip)
            # Persist immediately, never lose a verified paid clip on subsequent errors.
            save(REG,reg)
        report["importedIds"].append(gid)
    report["remainingGenerationIds"]=[
        x for x in sorted(takes) if x not in reg["generationClips"]
        and x not in report["importedIds"]
    ]
    report["importedPriorPaidGenerations"]=len(report["importedIds"])+len(report["alreadyImportedIds"])
    report["remainingPriorPaidGenerations"]=len(report["remainingGenerationIds"])
    if not dry:save(REPORT,report)
    print("KIDS_V4_PREPAID_FLOW_IMPORT "+json.dumps({
        k:v for k,v in report.items() if k not in ("importedIds","alreadyImportedIds","remainingGenerationIds","errors")},ensure_ascii=False),flush=True)
    return report

def main():
    a=argparse.ArgumentParser()
    g=a.add_mutually_exclusive_group(required=True)
    g.add_argument("--zip",type=Path)
    g.add_argument("--directory",type=Path)
    g.add_argument("--audit",action="store_true")
    args=a.parse_args()
    if args.audit:
        with tempfile.TemporaryDirectory(prefix="kids-flow-empty-") as td:
            report=run(Path(td),dry=True)
        return
    if args.zip:
        if not args.zip.is_file():raise RuntimeError("Paid Flow ZIP file not found")
        with tempfile.TemporaryDirectory(prefix="kids-paid-flow-extract-") as td:
            directory=Path(td)
            mapping=extract_safe(args.zip,directory)
            if mapping:save(directory/"flow-audio-map.json",mapping)
            run(directory)
    else:
        if not args.directory.is_dir():raise RuntimeError("Directory with original MP3s missing")
        run(args.directory)

if __name__=="__main__":
    main()
