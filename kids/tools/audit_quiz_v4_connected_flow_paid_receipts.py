#!/usr/bin/env python3
"""Zero-credit end-to-end audit of connected ElevenLabs V4 KIDS recordings.

Count only provider-confirmed voice/model/generation IDs as recorded in the
escrow. A generated MP3 without ORIGINAL BYTES in GitHub is *not* playable.
Check globally against 450 exact speech segment recipes and all previous
direct/old paid recordings. Never invoke TTS, mutate a file or grant release.
"""
from __future__ import annotations
import hashlib
import json
import math
import re
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
def obj(name):return json.loads((ROOT/name).read_text(encoding="utf-8"))
def chk(x,m):
    if not x:raise AssertionError("KIDS V4 PAID RECEIPT AUDIT: "+m)

def main():
    flow=obj("kids/data/quiz-v4-connected-flow-originals-ledger.json")
    reg=obj("kids/data/quiz-v4-450-original-clip-registry.json")
    paid=obj("kids/data/quiz-v4-450-paid-generation-ledger.json")
    old=obj("kids/data/quiz-v4-missing9-prepaid-originals.json")
    quiz=obj("kids/data/quiz-v4-curated-450-production-review.json")
    release=obj("kids/data/quiz-curation-release.json")
    chk(flow.get("modelId")==MODEL and flow.get("voiceId")==VOICE
        and reg.get("modelId")==MODEL and reg.get("voiceId")==VOICE
        and quiz.get("modelId")==MODEL and quiz.get("voiceId")==VOICE,
        "source V4 speaker/model changed")
    chk(flow.get("live") is False and flow.get("humanListeningApproved") is False
        and release.get("enabled") is False,"cannot claim public release or listening approval")
    recipes=quiz["recipes"]
    chk(len(recipes)==450 and len({r["questionId"] for r in recipes})==450,
        "selected quiz question IDs changed")
    chk(Counter(q["ageBand"] for q in recipes)=={"4-6":150,"7-8":150,"9-10":150},
        "exact age group source counts changed")
    fragments=set()
    for q in recipes:
        for field in ("question","correct","retry","explanation"):
            part=q[field]
            if part["mode"]=="existing-paid-exact":
                chk(bool(part.get("generationId")),"older prepaid generation without ID")
                continue
            chk(part["mode"]=="compose-from-segments",
                "unsupported composite V4 question part mode")
            clips=part["segments"]
            chk(isinstance(clips,list) and clips
                and " ".join(clips)==part["text"],"spoken source fragments changed")
            fragments.update(clips)
    old_paid={row["originalSpokenText"] for row in old["items"]}
    old_ids={row["generationId"] for row in old["items"]}
    chk(len(old_paid)==len(old_ids)==9,"the nine original prepaid takes changed")
    direct=set(reg["textClips"])
    charges={r["text"] for r in paid["rows"]}
    chk(len(charges)==len(paid["rows"]),"duplicate paid source text in billing")
    ids=set()
    spoken=set()
    total=0.0
    ready=0
    imported=0
    for e in flow["entries"]:
        phrase=e["sourceText"]
        sha=hashlib.sha256(phrase.encode("utf-8")).hexdigest()
        status=e["status"]
        chk(e.get("modelId")==MODEL and e.get("voiceId")==VOICE
            and e.get("sourceTextSHA256")==sha and phrase in fragments,
            "source text SHA is not an exact required original segment")
        chk(phrase not in spoken and phrase not in old_paid,
            "duplicate source text or previously prepaid historical original")
        spoken.add(phrase)
        chk(not e.get("humanListeningApproved") and not e.get("publicReleaseAllowed"),
            "incorrect listening or public playback claim")
        if status in ("GENERATED_AWAITING_ORIGINAL_MP3_IMPORT",
                      "IMPORTED_ORIGINAL_MP3_VERIFIED"):
            gid=e.get("generationId")
            cost=e.get("actualProviderCredits")
            chk(isinstance(gid,str) and re.fullmatch("[A-Za-z0-9]{20}",gid)
                and gid not in ids and gid not in old_ids,
                "provider generation missing, reused or collides with old paid take")
            ids.add(gid)
            chk(e.get("providerStatus")=="completed"
                and isinstance(cost,(int,float))
                and math.isfinite(cost) and 0<cost<2000,
                "missing or unreasonable provider-supplied per-generation credit receipt")
            total+=cost
            ready+=1
            if status=="IMPORTED_ORIGINAL_MP3_VERIFIED":
                imported+=1
                media=reg["textClips"].get(phrase)
                bills=[row for row in paid["rows"] if row["text"]==phrase]
                chk(media and len(bills)==1
                    and media.get("originalGenerationId")==gid
                    and bills[0].get("providerGenerationId")==gid
                    and media.get("sha256")==e.get("importedMP3SHA256")
                    and bills[0].get("mp3Sha256")==e.get("importedMP3SHA256"),
                    "claimed imported original missing SHA / matching paid receipt")
                chk(not media.get("audioListeningApproved"),
                    "imported original cannot be automatically human-approved")
            else:
                chk(phrase not in direct and phrase not in charges
                    and not e.get("originalMP3ImportedIntoGithub"),
                    "ElevenLabs-generated but unimported clip wrongly marked playable or billed twice")
        else:
            chk(status in ("RESERVED_UNSPENT_DO_NOT_RETRY_UNTIL_RECONCILED",
                           "GENERATION_SUBMITTED_DO_NOT_RETRY",
                           "PROVIDER_REJECTED_NO_CHARGE_VERIFY"),
                "unknown or unverified provider charge state")
            chk(phrase not in direct and phrase not in charges,
                "pending reserved original already in paid direct ledger")
    import sys
    sys.path.insert(0,str(ROOT/"kids/tools"))
    from quiz_v4_no_double_charge_guard import protect_paid_texts
    covered=protect_paid_texts(ROOT,reg,paid)
    chk(spoken<=covered,"pending connected V4 original escaped anti-repurchase guard")
    summary={"scope":"KIDS_V4_CONNECTED_PAID_REAL_RECEIPT_AUDIT",
             "verifiedProviderCompletedOriginals":ready,
             "importedOriginalMP3s":imported,
             "awaitingOriginalMP3Import":ready-imported,
             "creditsReportedByProvider":round(total,4),
             "historicallyPrepaidNineRebought":0,
             "sourceTextDuplicatePurchases":0,
             "newCreditsSpentByAudit":0,
             "publicReleaseAllowed":False,
             "humanListeningApproved":False}
    print(json.dumps(summary,ensure_ascii=False,sort_keys=True))

if __name__=="__main__":
    main()
