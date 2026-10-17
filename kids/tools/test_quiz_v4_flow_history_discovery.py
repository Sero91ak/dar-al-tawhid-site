#!/usr/bin/env python3
"""No-credit tests for matching previously PAID V4 Flows history originals.

Never call ElevenLabs here. A same-text match, even in the same voice, is
NOT enough to invent a historical generation-ID provenance.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent))
import recover_quiz_v4_missing9_get_only as recovery

OLD=recovery.load(recovery.PREPAID_NINE)
VOICE="DkU7j9uO4ZEtLD2iRZSH"

def row(gid,text,hid=None,request=None,voice=VOICE,model="eleven_v4",source="Flows"):
    return {"history_item_id":hid or gid,"request_id":request or "different-request",
            "text":text,"voice_id":voice,"model_id":model,"source":source}

def check(ok,msg):
    if not ok:raise AssertionError("KIDS_V4_PAID_HISTORY_DISCOVERY_TEST_FAILED: "+msg)

def run_case(fake_get,needed):
    previous=recovery.api_get
    recovery.api_get=fake_get
    try:return recovery.locate_history_flow_items("UNUSED_TEST_KEY",needed)
    finally:recovery.api_get=previous

def main():
    ids={x["generationId"]:x["originalSpokenText"] for x in OLD["items"]}
    check(len(ids)==9,"lost previously paid original IDs")
    gid1,gid2,gid3=list(ids)[:3]
    calls=[]
    def good(path,key,accept="application/json"):
        check(key=="UNUSED_TEST_KEY","bad test-key isolation")
        check(path.startswith("/v1/history?"),"unexpected provider endpoint during search")
        check("source=Flows" in path and "model_id=eleven_v4" in path,
              "not constrained to original V4 Flows history")
        calls.append(path)
        items=[row(gid1,ids[gid1]),
               row(gid2,ids[gid2],hid="different-history-id",request=gid2),
               row(gid3,ids[gid3],hid="other-paid-take-with-same-text")]
        return 200,json.dumps({"history":items,"has_more":False}).encode("utf-8"),"application/json"
    linked,report=run_case(good,[gid1,gid2,gid3])
    check(set(linked)=={gid1,gid2},"provider-linked source items should be the only admissible originals")
    check(gid3 not in linked and report["perGeneration"][gid3]["exactTextAndVoiceHistoryMatches"]==1,
          "an exact text without original provider crosslink must NEVER be mislabeled as the old audio")
    check(report["strongOriginalIdLinks"]==2 and report["unlinkedOriginals"]==1,
          "report should explicitly leave unlinked historical originals unresolved")
    check(len(calls)==1,"single-page Flows history did not stop correctly")

    def ambiguous(path,key,accept="application/json"):
        return 200,json.dumps({"history":[row(gid1,ids[gid1]),row(gid1,ids[gid1],hid="second-same-speech")],
                              "has_more":False}).encode("utf-8"),"application/json"
    linked,report=run_case(ambiguous,[gid1])
    check(not linked and report["perGeneration"][gid1]["exactTextAndVoiceHistoryMatches"]==2,
          "two matching historical takes cannot be assigned to the original generation ID")

    def bad_voice(path,key,accept="application/json"):
        return 200,json.dumps({"history":[row(gid1,ids[gid1],voice="different-voice")],
                              "has_more":False}).encode("utf-8"),"application/json"
    linked,report=run_case(bad_voice,[gid1])
    check(not linked,"voice mismatch must never import an old historical take")

    def gated(path,key,accept="application/json"):
        return 402,b"",""
    linked,report=run_case(gated,[gid1])
    check(not linked and report["httpCodes"]==[402],
          "subscription-gated history must not cause paid regeneration")

    def two_pages(path,key,accept="application/json"):
        from urllib.parse import parse_qs,urlsplit
        params=parse_qs(urlsplit(path).query)
        if "start_after_history_item_id" in params:
            check(params["start_after_history_item_id"]==["last-page1"],
                  "history pagination cursor changed")
            data={"history":[row(gid3,ids[gid3])],"has_more":False}
        else:
            data={"history":[row(gid1,ids[gid1])],
                  "has_more":True,"last_history_item_id":"last-page1"}
        return 200,json.dumps(data).encode("utf-8"),"application/json"
    linked,report=run_case(two_pages,[gid1,gid3])
    check(set(linked)=={gid1,gid3} and report["pagesInspected"]==2,
          "history pagination dropped paid originals")

    print("PASS: exact voice/model/text required; only provider IDs can authorize "
          "old MP3 import; ambiguity, wrong voice and HTTP402 fail closed. "
          "No ElevenLabs network requests or credits.")

if __name__=="__main__":main()
