#!/usr/bin/env python3
"""Offline first150 V4 MP3 assembly, preserving earlier paid-flow-originals.

No ElevenLabs API, no expensive speech generation, no live changes. Creates a
listening-review MP3 for every question/explanation whose EXACT component
originals are safely present. Tracks any missing already-paid old Flow clips
WITHOUT resynthesizing them or pretending a question is audio-complete.
"""
from __future__ import annotations
import hashlib,json,subprocess,tempfile
from collections import Counter
from pathlib import Path
from import_quiz_v4_prepaid_flow_originals import original_metadata
from quiz_v4_quarantine import quarantined_originals
from quiz_v4_native_fusha_reuse import load_mapping, expand_slot

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
PAID=ROOT/"kids/data/quiz-v4-batch-001-020-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/"kids/assets/kids-quiz-audio/v4-first150-composed-review"
MANIFEST=ROOT/"kids/data/quiz-v4-first150-composed-preview.json"
SUMMARY=ROOT/"kids/data/quiz-v4-first150-audio-status.json"
PARTS=("question","correct","retry","explanation")
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def load(path):return json.loads(path.read_text(encoding="utf-8"))
def hsum(src):return hashlib.sha256(src).hexdigest()
def hashfile(path):
    sha=hashlib.sha256()
    with path.open("rb") as inp:
        for block in iter(lambda:inp.read(1024*1024),b""):sha.update(block)
    return sha.hexdigest()
def probe(path):
    result=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,codec_type",
                           "-of","json",str(path)],capture_output=True,text=True,check=True)
    obj=json.loads(result.stdout)
    codecs=[x["codec_name"] for x in obj.get("streams",[]) if x.get("codec_type")=="audio"]
    duration=float(obj.get("format",{}).get("duration") or 0)
    if len(codecs)!=1 or codecs[0] not in ("mp3","aac") or not .35<duration<180:
        raise RuntimeError("Invalid original MP3 output")
    return duration

def source_mp3(row):
    if row.get("voiceId")!=VOICE or row.get("modelId")!=MODEL:
        raise RuntimeError("Wrong imported original owner voice")
    url=row.get("url") or ""
    if not url.startswith("/kids/assets/kids-quiz-audio/") or "?" in url or ".." in url:
        raise RuntimeError("Unapproved external/cached URL for original audio")
    path=(ROOT/url.lstrip("/")).resolve()
    if not path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()) or not path.is_file():
        raise RuntimeError("Actual V4 mp3 file missing")
    if row.get("sha256")!=hashfile(path):
        raise RuntimeError("Already-paid original MP3 changed unexpectedly")
    probe(path)
    return path

def assemble(paths,pauses,target):
    if len(paths)==1:return paths[0]
    with tempfile.TemporaryDirectory(prefix="tawhid-kids-150-original-join-") as d:
        d=Path(d)
        units=[]
        for i,src in enumerate(paths):
            dest=d/f"piece{i}.wav"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src),
                 "-ac","1","-ar","48000","-c:a","pcm_s16le",str(dest)],check=True)
            if i:
                p=d/f"pause{i}.wav"
                subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","lavfi",
                    "-i","anullsrc=channel_layout=mono:sample_rate=48000",
                    "-t",str(pauses[i-1]/1000),"-c:a","pcm_s16le",str(p)],check=True)
                units.append(p)
            units.append(dest)
        concat=d/"join.txt"
        concat.write_text("".join("file '"+str(x.resolve())+"'"+chr(10) for x in units),encoding="utf-8")
        encoded=d/"output.mp3"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
            "-f","concat","-safe","0","-i",str(concat),"-ac","1","-ar","48000",
            "-c:a","libmp3lame","-b:a","96k",str(encoded)],check=True)
        actual=probe(encoded)
        expected=sum(probe(p) for p in paths)+sum(pauses)/1000
        if abs(actual-expected)>max(0.95,.08*len(paths)):
            raise RuntimeError(f"Concatenation duration mismatch {actual}/{expected}")
        target.write_bytes(encoded.read_bytes())
    return target

def main():
    plan,registry,old=map(load,(PLAN,REG,PAID))
    chosen=[r for r in plan["recipes"] if r["ageBand"]=="4-6"]
    if len(chosen)!=150:raise RuntimeError("Exactly 150 first-age recipes required")
    blocked_texts,blocked_generations=quarantined_originals(ROOT)
    original={text:media for text,media in registry["textClips"].items()
              if text not in blocked_texts}
    native_mixed_mapping, native_master_assets=load_mapping(ROOT)
    paid_known={q["questionId"]:q for q in old["items"]}
    if len(old["items"])!=20:raise RuntimeError("Previously paid 20 originals disappeared")
    all_paid_ids={take["generationId"] for q in old["items"] for take in q["recordings"]}
    if len(all_paid_ids)!=56:
        raise RuntimeError("Previously paid original generation ledger must contain 56 unique IDs")
    imported_paid_ids=set(registry.get("generationClips") or {})-blocked_generations
    if imported_paid_ids-all_paid_ids:
        raise RuntimeError("Registry contains an unknown previously paid generation ID")
    missing_all_paid_ids=sorted(all_paid_ids-imported_paid_ids)
    paid_receipts=original_metadata()
    if set(paid_receipts)!=all_paid_ids:
        raise RuntimeError("Original paid MP3 receipt IDs and production plan diverged")
    hypothetical_original_texts=(set(original)|{paid_receipts[gid]["text"] for gid in missing_all_paid_ids})-blocked_texts
    OUT.mkdir(parents=True,exist_ok=True)
    text_audio={}
    missing=set()
    missing_flow_ids=set()
    missing_used=Counter()
    by_age={"4-6":{"questions":150}}
    original_full_coverage=0
    individual_complete={"question":0,"correct":0,"retry":0,"explanation":0}
    complete=0
    projected_complete_if_all_old_paid_imported=0
    projected_still_blocked=[]
    question_overview=[]
    for q in chosen:
        available={}
        reasons={}
        for kind in PARTS:
            part=q[kind];text=part["text"]
            if part["mode"]=="existing-paid-exact":
                gid=part["generationId"]
                imported=(registry.get("generationClips") or {}).get(gid) if gid not in blocked_generations else None
                if imported:
                    genuine=source_mp3(imported)
                    if text not in text_audio:
                        text_audio[text]={
                            "url":"/"+str(genuine.relative_to(ROOT)),
                            "sha256":hashfile(genuine),
                            "voiceId":VOICE,"modelId":MODEL,
                            "qaApproval":"pending-human-auditory-review",
                            "audioListeningApproved":False,
                            "status":"PREVIEW_ONLY_PREPAID_ORIGINAL_NOT_PUBLISHED"}
                    available[kind]=text
                    individual_complete[kind]+=1
                    continue
                missing_flow_ids.add(gid)
                missing.add(text)
                reasons[kind]="earlier-paid-original-flow-mp3-export-missing"
                missing_used[text]+=1
                continue
            if part["mode"]!="compose-from-segments" or " ".join(part["segments"])!=text:
                raise RuntimeError("Broken V4 utterance contract")
            segments=part["segments"]
            matched_originals,matched_pauses,unavailable=expand_slot(
                part,original,native_mixed_mapping,native_master_assets)
            if unavailable:
                for segment in unavailable:
                    missing.add(segment);missing_used[segment]+=1
                reasons[kind]="earlier-paid-original-flow-fragments-not-imported"
                continue
            if text not in text_audio:
                clips=[source_mp3(row) for row in matched_originals]
                key=hsum((VOICE+"|"+MODEL+"|"+text+"|"+
                    json.dumps(part.get("pauseAfterMs",[]))+("|mixedSHA:"+
                    json.dumps([hashfile(c) for c in clips]) if len(clips)!=len(segments) else "")).encode())[:32]
                target=OUT/(key+".mp3")
                if len(clips)==1:
                    composed=clips[0]
                else:
                    if not target.is_file():assemble(clips,matched_pauses,target)
                    composed=target
                source_mp3({"url":"/"+str(composed.relative_to(ROOT)),
                            "sha256":hashfile(composed),"voiceId":VOICE,"modelId":MODEL})
                text_audio[text]={"url":"/"+str(composed.relative_to(ROOT)),
                    "sha256":hashfile(composed),"voiceId":VOICE,"modelId":MODEL,
                    "qaApproval":"pending-human-auditory-review",
                    "audioListeningApproved":False,
                    "status":"PREVIEW_ONLY_NOT_PUBLISHED"}
            available[kind]=text
            individual_complete[kind]+=1
        ready=len(available)==4
        if ready:complete+=1
        # No generated audio is assumed here: only the nine ORIGINAL already-paid
        # ElevenLabs takes from the immutable paid receipts are hypothetically restored.
        eventual_parts=[]
        for kind in PARTS:
            part=q[kind]
            if part["mode"]=="existing-paid-exact":
                eventual_parts.append(part["generationId"] in all_paid_ids)
            else:
                eventual_parts.append(all(x in hypothetical_original_texts for x in part["segments"]))
        if all(eventual_parts):
            projected_complete_if_all_old_paid_imported+=1
        else:
            projected_still_blocked.append(q["questionId"])
        question_overview.append({"questionId":q["questionId"],"availableAudioParts":sorted(available),
                                  "missingOrBlockedAudioParts":reasons,
                                  "allFourPartsAvailable":ready})
    report={
      "scope":"TAWḤĪD KIDS · 150 age 4–6 V4 cost-free listening preview",
      "questionCount":150,
      "newPaidSynthesesForAssembly":0,
      "originalMasterMP3sStored":len(original),
      "completeFourPartQuestions":complete,
      "availableFieldCounts":individual_complete,
      "importedPreviouslyPaidGenerationIdCount":len(registry.get("generationClips") or {}),
      "missingPreviouslyPaidOriginalTextCount":len(missing),
      "missingPreviouslyPaidGenerationIdCount":len(missing_all_paid_ids),
      "missingDirectPaidPartGenerationIdCount":len(missing_flow_ids),
      "missingDirectPaidPartGenerationIds":sorted(missing_flow_ids),
      "missingPreviouslyPaidTexts":[{"text":t,"requiredByQuestionParts":missing_used[t]}
                                    for t in sorted(missing)],
      "missingPaidOriginalGenerationIds":missing_all_paid_ids,
      "originalFlowImportNeeded":bool(missing_all_paid_ids),
      "projectedFourPartQuestionCountAfterAuthenticOldPaidImport":projected_complete_if_all_old_paid_imported,
      "projectedBlockedQuestionIdsAfterAuthenticOldPaidImport":projected_still_blocked,
      "projectionIsNotAudioProofOrHumanApproval":True,
      "readyForLive":False,"audioListeningApproved":False,
      "questions":question_overview
    }
    MANIFEST.write_text(json.dumps({
        "schemaVersion":1,"scope":"KIDS_4_6_150_V4_PREVIEW_ONLY",
        "voiceId":VOICE,"modelId":MODEL,"published":False,
        "humanListeningApproved":False,"entries":text_audio
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    SUMMARY.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_150_4_6_OFFLINE_JOIN_PASS "+json.dumps({k:v for k,v in report.items()
        if k not in ("missingPreviouslyPaidTexts","missingPaidOriginalGenerationIds","questions")},
        ensure_ascii=False),flush=True)

if __name__=="__main__":main()
