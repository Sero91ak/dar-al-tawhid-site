#!/usr/bin/env python3
"""Block TAWḤĪD KIDS 450-audio launch until all original V4 recordings pass QA.

Read-only. Does not synthesize, deploy, copy or amend any public file.
The complete source remains 900 questions. The selected 450 retain their
canonical IDs and original questions for uninterrupted learner progress.
"""
import argparse,json,sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from quiz_v4_all900_release_gate import check
from quiz_v4_quarantine import quarantined_originals,blocked_full_utterances

CURATED=ROOT/"kids/data/quiz-kids-curated-450-review.json"
ARCHIVE=ROOT/"kids/data/quiz-kids-expansion-reserve-450.json"
CATALOG=ROOT/"kids/data/quiz-kids.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
MANIFEST=ROOT/"kids/data/quiz-audio.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
FIELDS=("question","correct","retry","explanation")
COUNTS=Counter({"4-6":150,"7-8":150,"9-10":150})

def load(path):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (OSError,ValueError):return {}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--strict",action="store_true")
    p.add_argument("--ignore-flag",action="store_true",help="Audit audio asset coverage only, NEVER authorize release")
    a=p.parse_args()
    selected=load(CURATED).get("items") or []
    reserved=load(ARCHIVE).get("items") or []
    original=load(CATALOG).get("items") or []
    voice=load(PLAN)
    cfg=load(FLAG)
    # A correct model ID, PLS dictionary, waveform and SHA do NOT establish
    # correct Arabic makhārij/Tajwīd. Owner rejected pronunciation 2026-10-21.
    pronunciation_hold=load(ROOT/"kids/data/quiz-v4-pronunciation-hold.json")
    phonetic_quality_approved=(
        pronunciation_hold.get("productionPaused") is False and
        pronunciation_hold.get("humanPronunciationApproved") is True and
        pronunciation_hold.get("humanListeningQualityGateReleased") is True
    )
    if len(selected)!=450 or len(reserved)!=450:
        raise RuntimeError("Expected exactly 450 in both selection and archive")
    if len(original)!=900 or Counter(q["ageBand"] for q in selected)!=COUNTS:
        raise RuntimeError("Catalog or 150+150+150 selection mismatch")
    if Counter(q["ageBand"] for q in reserved)!=COUNTS:
        raise RuntimeError("Reserve must also keep 150 original questions per age")
    ids={q["id"] for q in selected}
    if len(ids)!=450 or ids&{q["id"] for q in reserved} or ids|{q["id"] for q in reserved}!={q["id"] for q in original}:
        raise RuntimeError("Selected and reserve do not partition the 900 originals")
    canon={q["id"]:q for q in original}
    if any(q!=canon[q["id"]] for q in selected+reserved):
        raise RuntimeError("Original quiz source was modified while partitioning")
    records=voice.get("recipes") or []
    if len(records)!=450 or {r["questionId"] for r in records}!=ids:
        raise RuntimeError("The 450 V4 source contracts differ from curated IDs")
    if voice.get("modelId")!="eleven_v4" or voice.get("voiceId")!="DkU7j9uO4ZEtLD2iRZSH":
        raise RuntimeError("Unknown original V4 master speech")
    keys={r[k]["text"] for r in records for k in FIELDS}
    # Ban old mispronounced provider originals even when a stale composite
    # is present in the public manifest or claims approval.
    banned_texts,banned_ids=quarantined_originals(ROOT)
    banned_full=blocked_full_utterances(records,banned_texts,banned_ids)
    manifest=load(MANIFEST).get("entries") or {}
    errors=Counter()
    approved=set()
    for phrase in keys:
        issue=check(manifest.get(phrase))
        if issue:errors[issue]+=1
        else:approved.add(phrase)
    quarantined_approved=approved&banned_full
    if quarantined_approved:
        errors["previously-rejected-pronunciation-source"]+=len(quarantined_approved)
        approved-=quarantined_approved
    by_age={}
    for age in ("4-6","7-8","9-10"):
        rows=[r for r in records if r["ageBand"]==age]
        passed=sum(all(r[k]["text"] in approved for k in FIELDS) for r in rows)
        by_age[age]={"total":150,"fullyAudibleAndApproved":passed}
    config_enabled=cfg.get("enabled") is True
    allowed=(config_enabled and phonetic_quality_approved and not errors and
             all(x["fullyAudibleAndApproved"]==150 for x in by_age.values()))
    status={"curatedQuestions":450,"reservedForLater":450,"ageCounts":{"4-6":150,"7-8":150,"9-10":150},
       "uniqueFullAudioTextKeys":len(keys),
       "importedAndListeningApprovedKeys":len(approved),
       "audioMissingOrUnapprovedKeys":len(keys)-len(approved),
       "quarantinedPaidGenerationIDs":len(banned_ids),
       "blockedFullUtteranceKeys":len(banned_full),
       "quarantinedAlreadyApprovedKeys":len(quarantined_approved),
       "byAge":by_age,"errorCounts":dict(errors),
       "releaseSwitchEnabled":config_enabled,
       "ownerArabicPronunciationApproved":phonetic_quality_approved,
       "ownerPronunciationHoldActive":pronunciation_hold.get("productionPaused") is not False,
       "releaseAllowed":allowed and not a.ignore_flag,
       "creditsSpentByGuard":0}
    print(json.dumps(status,ensure_ascii=False,indent=2))
    if a.strict and not allowed:
        raise SystemExit("LIVE BLOCKED: 450 original V4 quiz audios not approved for all ages")
if __name__=="__main__":
    main()
