#!/usr/bin/env python3
"""Import 15 already generated V4 originals, 2026-10-23.
No new TTS calls; never publish to visitor Kids.
"""
from __future__ import annotations
import hashlib
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from import_quiz_v4_creative_candidates_20261022 import verify_and_store

MANIFEST=ROOT/"kids/review-only/quiz-v4-15-new-master-transfer-20261023.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PRIORITY=ROOT/"kids/review-only/quiz-v4-450-next-completion-priority.json"
OUTPUT=ROOT/"kids/review-only/quiz-v4-15-new-master-import-results-20261023.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))
def assert_true(ok,reason):
    if not ok: raise RuntimeError(reason)

def main():
    transfer=load(MANIFEST)
    rows=transfer.get("items") or []
    assert_true(transfer.get("scope")=="KIDS_QUIZ_V4_15_PAID_MASTER_NEW_ORIGINALS_REVIEW_ONLY","wrong scope")
    assert_true(transfer.get("reviewOnly") is True and transfer.get("publicReleaseAllowed") is False,"public release blocked")
    assert_true(len(rows)==15,"expected exactly 15 distinct newly generated V4 original sources")
    assert_true(len({x["textSha256"] for x in rows})==15,"repeated source text")
    assert_true(len({x["generationId"] for x in rows})==15,"repeated generation")
    assert_true(load(RELEASE).get("enabled") is False,"public release switch must remain disabled")
    reg=load(REGISTRY)
    assert_true(reg.get("voiceId")==VOICE and reg.get("modelId")==MODEL and reg.get("live") is False,"wrong registry or public release")
    priority=load(PRIORITY)
    permitted={sha for q in priority.get("possibleNewSpeechPriorityAfterOriginalRecovery",[]) for sha in q.get("newTextSha256",[])}
    paid={x.get("textSha256") for x in (reg.get("textClips") or {}).values()}
    assert_true(all(x["textSha256"] in permitted for x in rows),"unapproved source text")
    assert_true(all(x["textSha256"] not in paid for x in rows),"already paid original cannot be duplicated")
    results=[]
    for item in rows:
        assert_true(item["voiceId"]==VOICE and item["modelId"]==MODEL,"voice/model mismatch")
        assert_true(hashlib.sha256(item["text"].encode("utf-8")).hexdigest()==item["textSha256"],"text sha mismatch")
        original=verify_and_store(item)
        reg["textClips"][item["text"]]=original
        results.append({"questionId":item["questionId"],"part":item["part"],"textSha256":item["textSha256"],"generationId":item["generationId"],
                        "originalMP3":original["url"],"mp3Sha256":original["sha256"],"bytes":original["bytes"],"durationSeconds":original["durationSeconds"],
                        "creditsPreviouslyCharged":item["creditsReportedByProvider"],"humanListeningApproved":False})
    REGISTRY.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    OUTPUT.write_text(json.dumps({"scope":"KIDS_450_V4_15_NEW_ORIGINALS_IMPORTED_TO_REVIEW","source":"ElevenLabs eleven_v4 Serhat Abu Malik - Master",
       "modelId":MODEL,"voiceId":VOICE,"imported":len(results),"newSynthesisRequestedByImporter":0,
       "publicReleaseAllowed":False,"humanListeningApproved":False,"sourceDictionaryAppliedProven":False,"receipts":results},
       ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_15_PAID_ORIGINALS_SAVED_AND_VERIFIED_REVIEW_ONLY",len(results),flush=True)
if __name__=="__main__":
    main()
