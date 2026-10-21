#!/usr/bin/env python3
"""TAWḤĪD KIDS 450 release board. No synthesis, no live changes.

Separately reports selected QUESTIONS versus real ORIGINAL MP3 clips, and
does not mistake a generated audio fragment for a fully playable question.
"""
import json
import hashlib
from collections import Counter
from pathlib import Path
from quiz_v4_quarantine import quarantined_originals
from quiz_v4_native_fusha_reuse import load_mapping, expand_slot

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"kids/data/quiz-v4-450-production-status.json"
PLANNED=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
SELECTED=ROOT/"kids/data/quiz-kids-curated-450-review.json"
RESERVED=ROOT/"kids/data/quiz-kids-expansion-reserve-450.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
QA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
PARTS=("question","correct","retry","explanation")

def load(path):
    if not path.exists():return {}
    return json.loads(path.read_text(encoding="utf-8"))

def validated_audio_registry(registry):
    """Fail closed before crediting any original MP3 as available.

    Registry metadata alone is insufficient: the on-disk bytes, SHA-256,
    location, ownership and exact spoken-text identity must still agree.
    This function never calls ElevenLabs, changes audio, or grants hearing approval.
    """
    audio_root=(ROOT/"kids/assets/kids-quiz-audio").resolve()
    validated={}
    for collection in ("textClips","generationClips"):
        original=registry.get(collection) or {}
        checked={}
        for identity,row in original.items():
            if row.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH" or row.get("modelId")!="eleven_v4":
                raise RuntimeError(f"Unapproved voice/model for {collection} {identity}")
            url=row.get("url")
            if not isinstance(url,str) or not url.startswith("/kids/assets/kids-quiz-audio/") or not url.endswith(".mp3") or "?" in url:
                raise RuntimeError(f"Invalid private original URL in {collection} {identity}")
            target=(ROOT/url.lstrip("/")).resolve()
            if not target.is_relative_to(audio_root) or not target.is_file():
                raise RuntimeError(f"Missing/unsafe original MP3 for {collection} {identity}")
            sha=hashlib.sha256()
            size=0
            header=b""
            with target.open("rb") as mp3:
                for chunk in iter(lambda:mp3.read(1024*1024),b""):
                    if not header:header=chunk[:3]
                    size+=len(chunk)
                    sha.update(chunk)
            if (size<1500 or size!=row.get("bytes") or
                    sha.hexdigest()!=row.get("sha256") or
                    not (header.startswith(b"ID3") or header[:1]==bytes([255]))):
                raise RuntimeError(f"Corrupt or unverified original MP3 for {collection} {identity}")
            if collection=="textClips":
                if hashlib.sha256(identity.encode("utf-8")).hexdigest()!=row.get("textSha256"):
                    raise RuntimeError(f"Spoken-text SHA changed for {identity}")
            elif row.get("originalGenerationId")!=identity:
                raise RuntimeError(f"Paid Flow generation identity changed for {identity}")
            checked[identity]=row
        validated[collection]=checked
    return validated


def main():
    planned=load(PLANNED);sel=load(SELECTED).get("items") or []
    res=load(RESERVED).get("items") or []
    reg=load(REGISTRY);led=load(LEDGER);qa=load(QA)
    if len(sel)!=450 or len(res)!=450 or len(planned.get("recipes") or [])!=450:
        raise RuntimeError("Curated 450+450 locked catalog is missing")
    # Verify every physical original, not just a registry entry or a previous QA flag.
    verified=validated_audio_registry(reg)
    clips=verified["textClips"]
    blocked_texts, blocked_ids = quarantined_originals(ROOT)
    available=set(clips)-blocked_texts
    good={t for t,v in clips.items() if t in available and v.get("audioListeningApproved") is True}
    paid_gen={gid:v for gid,v in verified["generationClips"].items() if gid not in blocked_ids}
    mixed_mapping,native_assets=load_mapping(ROOT)
    eligible_for_count={text:row for text,row in clips.items() if text in available}
    eligible_for_hearing={text:row for text,row in clips.items() if text in good}
    def available_slot(row,kind,human=False):
        x=row[kind]
        if x["mode"]=="existing-paid-exact":
            clip=paid_gen.get(x["generationId"])
            return isinstance(clip,dict) and (not human or clip.get("audioListeningApproved") is True)
        if x["mode"]!="compose-from-segments":raise RuntimeError("Unsupported V4 contract")
        originals=eligible_for_hearing if human else eligible_for_count
        _parts,_pauses,missing=expand_slot(x,originals,mixed_mapping,native_assets)
        return not missing
    counts={}
    for age in ("4-6","7-8","9-10"):
        rows=[q for q in planned["recipes"] if q["ageBand"]==age]
        if len(rows)!=150:raise RuntimeError("Incorrect selected question age count")
        present=sum(all(available_slot(q,k) for k in PARTS) for q in rows)
        approved=sum(all(available_slot(q,k,human=True) for k in PARTS) for q in rows)
        counts[age]={"selectedQuestions":150,"sourceQuestionsSavedForLater":150,
                    "completeAllFourOriginalAudios":present,
                    "allFourHumanListeningApproved":approved}
    complete=sum(v["completeAllFourOriginalAudios"] for v in counts.values())
    heard=sum(v["allFourHumanListeningApproved"] for v in counts.values())
    ledger=led.get("rows") or []
    report={"schemaVersion":1,"app":"TAWḤĪD KIDS","scope":"450 audio-first quiz release",
        "originalQuizCatalogCount":900,"selectedTotal":450,"reservedTotal":450,
        "sourceAndArchivePreserved":True,"modelId":"eleven_v4",
        "totalSelectedSpeechAssignments":1800,
        "uniqueNewSegmentTarget":planned["newUniqueFragments"],
        "uniqueNewOriginalMP3sStored":len(clips),
        "uniqueSegmentsStillWithoutOriginalMP3":len(
            {x["text"] for x in planned["pendingAudioFragments"]}-set(clips)),
        "priorPaidFlowOriginalCount":56,
        "priorPaidFlowOriginalsNotRecovered":max(0,56-len(verified["generationClips"])),
        "quarantinedOriginalsStoredButNotPlayable":len(set(clips)&blocked_texts),
        "nativeArabicSharedOriginalCount":len(native_assets),
        "mixedGermanArabicCanonicalSourceCount":len(mixed_mapping),
        "savedMP3TechnicallyAudited":qa.get("savedClipCount",0)
           if qa.get("overallTechnicalPass") else 0,
        "savedMP3HumanListeningApproved":len(good),
        "completedQuestionsWithAllFourAudioParts":complete,
        "questionsHumanListeningApproved":heard,
        "estimatedAdditionalCreditsForFullSelected450":planned["creditEstimate"],
        "estimatedCreditsForAlreadyStoredDirectOriginals":round(sum(
             float(x.get("estimatedCreditsAtObservedRate") or 0) for x in ledger),2),
        "exactProviderChargesNotFullyReconciled":True,
        "ageBreakdown":counts,
        "appReleaseFlagEnabled":load(ROOT/"kids/data/quiz-curation-release.json").get("enabled") is True,
        "all450AudioReadyToPublish":heard==450,
        "livePublished":False,
        "remaining450StoredForLater":True,
        "nextExpansionCommand":"Quizfragen erweitern"}
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_450_V4_PROGRESS "+json.dumps({k:v for k,v in report.items() if k!="ageBreakdown"},ensure_ascii=False),flush=True)
if __name__=="__main__":
    main()
