#!/usr/bin/env python3
"""Finish the five corrected Halal KIDS quiz sources using eight ALREADY PAID
German MP3 originals; NO ElevenLabs access, NO paid retries. Revalidate exact
source hashes and owner-approved native Fuṣḥā original before composing.
"""
import hashlib,json,sys
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
from produce_kids_v4_halal_5_native_exact_review_20261023 import (
    MAP,AR,BATCH,REG,LEDGER,PRIVATE,OUT,OWNER,PLAN,VERDICT,VOICE,MODEL,
    rd,sha,shatext,save,fail,check_source)
from quiz_v4_first150_offline_join import assemble,probe
def main():
    data=rd(PRIVATE);reg=rd(REG);ledger=rd(LEDGER);owner=rd(OWNER)
    verdict=rd(VERDICT);plan=rd(PLAN)
    fail(data["scope"]=="FIVE_OWNER_CORRECTED_HALAL_QUIZ_SOURCE_FRAGMENTS"
         and data["status"] in ("STARTED_REMOTE_CHECKPOINT",
              "FIVE_HALAL_NATIVE_COMPOSITES_PRIVATE_TECHNICALLY_READY_AWAIT_OWNER_HEARING")
         and data["liveRelease"] is False and data["humanHearingApproved"] is False,
         "not a protected pending owner Halal repair batch")
    fail(len(data["entries"])==8 and all(e["status"]=="ORIGINAL_MP3_SAVED" for e in data["entries"]),
         "exact eight paid German originals must exist – stop on ambiguity")
    parts={v for values in MAP.values() for v in values if v!=AR}
    fail(parts=={e["text"] for e in data["entries"]},"source set changed since paid requests")
    ledger_rows={e["text"]:e for e in ledger["rows"] if e.get("batchId")==BATCH}
    fail(len(ledger_rows)==8 and len(reg["textClips"])>1700,
         "paid original registry or per-batch ledger incomplete")
    for e in data["entries"]:
        t=e["text"];row=reg["textClips"].get(t)
        fail(row and row["sha256"]==e["sha256"] and row["bytes"]==e["bytes"]
             and row["textSha256"]==shatext(t) and row["voiceId"]==VOICE
             and row["modelId"]==MODEL and row["providerRequestId"]==e["providerRequestId"]
             and ledger_rows[t]["mp3Sha256"]==e["sha256"]
             and ledger_rows[t]["providerRequestId"]==e["providerRequestId"],
             "original German receipt mismatch; no replay or charging")
        path=check_source(row["url"],row["sha256"])
        fail(path.stat().st_size==e["bytes"],"German original bytes mismatch")
        probe(path)
    fail(owner["approvedNativeSourceText"]==AR
         and owner["approvedNativeOriginalSHA256"]==data["approvedNativeSHA256"]
         and owner["mustNeverReuseRejectedFullGermanTake"] is True
         and not owner["mixedSentenceHearingApproved"],"native owner source approval missing")
    fail(verdict["ownerAcceptedAllThreeIsolatedSamples"] is True
         and verdict["approvalAppliesOnlyToThreeIsolatedSamples"] is True
         and not verdict["publicReleaseAuthorized"],"owner sample approval not scoped")
    native=check_source(owner["nativeOriginalURL"],owner["approvedNativeOriginalSHA256"])
    probe(native)
    pending={r["text"] for r in plan["pendingAudioFragments"]}
    fail(set(MAP)<=pending and len(plan["recipes"])==450,
         "five corrected source texts no longer in immutable quiz plan")
    OUT.mkdir(parents=True,exist_ok=True)
    saved={}
    for full,units in MAP.items():
        fail(" ".join(units)==full.replace("Halal",AR),"source-to-phonetics mapping changed")
        audio=[native if t==AR else check_source(reg["textClips"][t]["url"],
                    reg["textClips"][t]["sha256"]) for t in units]
        target=OUT/(shatext(full)[:32]+"-native-joined.mp3")
        if not target.exists():
            assemble(audio,[60,60],target)
        duration=probe(target)
        digest=sha(target.read_bytes())
        fail(1.0<duration<90,"invalid assembled speech duration")
        oldrow=reg["textClips"].get(full)
        if oldrow:
            fail(oldrow.get("sha256")==digest and
                 oldrow.get("source")=="owner-approved-native-Fusha-Halal-with-genuine-German-V4-components",
                 "previous full source exists but does not match")
        newrow={"url":"/"+str(target.relative_to(ROOT)),
             "sha256":digest,"textSha256":shatext(full),"bytes":target.stat().st_size,
             "modelId":MODEL,"voiceId":VOICE,"audioListeningApproved":False,
             "qaApproval":"pending-human-auditory-review",
             "source":"owner-approved-native-Fusha-Halal-with-genuine-German-V4-components",
             "status":"PRIVATE_COMPOSITE_NOT_OWNER_SENTENCE_APPROVED",
             "compositeNativeOriginalSha256":owner["approvedNativeOriginalSHA256"],
             "replacesRejectedGermanWholeOriginalSha256":owner["rejectedProviderOriginalSHA256"]}
        reg["textClips"][full]=newrow
        saved[full]={"sourceTextSHA256":shatext(full),"sha256":digest,
                     "bytes":target.stat().st_size,"originalURL":newrow["url"],
                     "nativeOriginalSHA256":owner["approvedNativeOriginalSHA256"],
                     "ownerApprovedWholeSentence":False}
    fail(len(saved)==5,"five exact corrected original native composite required")
    data["composites"]=list(saved.values())
    data["status"]="FIVE_HALAL_NATIVE_COMPOSITES_PRIVATE_TECHNICALLY_READY_AWAIT_OWNER_HEARING"
    data["recoveredWithoutNewPaidCallsAt"]=datetime.now(timezone.utc).isoformat()
    data["newPaidCallsDuringRecovery"]=0
    data["ownerApprovedFullSentences"]=0
    data["publicQuizReleased"]=False
    save(REG,reg);save(PRIVATE,data)
    print("KIDS_HALAL_FIVE_ZERO_NEW_CREDITS_COMPOSITES_RECOVERED "+
       json.dumps({"count":len(saved),"reusedEightAlreadyPaidGermanMP3s":True,
                   "nativeMasterSHA256":owner["approvedNativeOriginalSHA256"],
                   "newCredits":0,"live":False,"humanApproved":False},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
