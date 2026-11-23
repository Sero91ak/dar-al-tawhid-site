#!/usr/bin/env python3
"""Recover only the ACTUAL child-visible first sentence from an already paid V4 take.

Uses the provider's original per-character timing, never synthesizes a retake.
The original, longer 11.12s MP3 remains archived unchanged. A deterministic
cut point is computed inside the sentence break and the shortened visible
answer is audited against the canonical child choice projection.
"""
from __future__ import annotations
import argparse, hashlib, json, os, pathlib, urllib.request, urllib.parse

ROOT=pathlib.Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-14-missing-real-v4-plan-v1.json"
GAPS=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-visible-click-gaps-v1.json"
MAPPING=ROOT/"kids/data/academy-topic-batches/akhlaq-sidq-history-recovery-map-v1.json"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
SOURCE_SEGMENT="de-20"
SHORT_SENTENCE="Einen Fehler kann man unbeabsichtigt machen."
TRIM_FILE="_de20-exact-trim.json"
def load(p):
    return json.loads(p.read_text("utf-8"))
def save(p,value):
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source-dir",type=pathlib.Path,required=True)
    args=ap.parse_args()
    key=os.getenv("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("Missing authenticated ElevenLabs history GET credential")
    directory=args.source_dir.resolve()
    plan,gaps,history=load(PLAN),load(GAPS),load(MAPPING)
    segment=plan["segments"][SOURCE_SEGMENT]
    provider_text=segment["text"]
    if not provider_text.startswith(SHORT_SENTENCE+" ") or len(provider_text)!=180:
        raise RuntimeError("Recorded full-length V4 source has changed")
    original_key="Antwort 1: "+provider_text
    child_key="Antwort 1: "+SHORT_SENTENCE
    matches=[x for x in plan["tasks"] if x.get("visibleText")==original_key and x.get("segments")==[SOURCE_SEGMENT]]
    gap_rows=[x for x in gaps["entries"] if x.get("text")==original_key]
    if len(matches)!=1 or len(gap_rows)!=1:
        raise RuntimeError("Unexpected child answer or gap identity")
    provider=next(x for x in history["originals"] if x["segment"]==SOURCE_SEGMENT)
    if not (provider["generationId"]==segment["generationId"] and provider.get("voiceVerified") is True
            and provider["modelId"]==MODEL and provider["promptVerified"] is True):
        raise RuntimeError("Original audio receipt mismatch")
    original=directory/(segment["generationId"]+".mp3")
    if not original.is_file() or original.stat().st_size<1200:
        raise RuntimeError("Missing already-paid full source MP3")
    req=urllib.request.Request(
        "https://api.elevenlabs.io/v1/history/"+urllib.parse.quote(provider["historyItemId"],safe=""),
        headers={"xi-api-key":key,"Accept":"application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req,timeout=30) as resp:
        doc=json.load(resp)
    if (doc.get("history_item_id")!=provider["historyItemId"] or doc.get("model_id")!=MODEL
            or doc.get("source") not in ("Flows","TTS")
            or doc.get("voice_id") not in (None,"",VOICE)):
        raise RuntimeError("Original provider alignment identity mismatch")
    alignment=doc.get("alignments") or {}
    chosen=alignment.get("normalized_alignment") or alignment.get("alignment") or {}
    chars=chosen.get("characters") or []
    starts=chosen.get("character_start_times_seconds") or []
    lengths=chosen.get("character_end_times_seconds") or []
    if ("".join(chars)!=provider_text or len(chars)!=len(starts) or len(chars)!=len(lengths)
            or len(chars)!=180 or not all(isinstance(x,(float,int)) for x in starts+lengths)):
        raise RuntimeError("Original V4 text and character alignment mismatch")
    last=len(SHORT_SENTENCE)-1
    following=next((i for i in range(last+1,len(chars)) if not chars[i].isspace()),None)
    if following is None:raise RuntimeError("Long V4 recording unexpectedly lacks the second sentence")
    # ElevenLabs History's 'character_end_times_seconds' array in this original
    # is character DURATIONS, not absolute end timestamps (verified 2026-11-23).
    last_end=float(starts[last])+float(lengths[last])
    next_start=float(starts[following])
    silence=next_start-last_end
    if not (0.08<=silence<=0.8 and 2.0<=last_end<next_start<4.5):
        raise RuntimeError("Original silence interval unsafe to cut")
    cut=round((last_end+next_start)/2,3)
    sha=hashlib.sha256(original.read_bytes()).hexdigest()
    save(directory/TRIM_FILE,{
        "schemaVersion":1,"segment":SOURCE_SEGMENT,"generationId":segment["generationId"],
        "sourceOriginalSha256":sha,"providerHistoryId":provider["historyItemId"],
        "originalFullText":provider_text,"exactChildAudioText":SHORT_SENTENCE,
        "lastCharacterEndSeconds":round(last_end,3),
        "nextSentenceStartSeconds":round(next_start,3),
        "silenceSeconds":round(silence,3),"cutSeconds":cut,
        "approvedForExactOfflineTrim":True,"newV4Generations":0
    })
    matches[0]["visibleText"]=child_key
    matches[0]["speechExtraction"]="provider-character-aligned-first-sentence-de20"
    matches[0]["fullSourceAudioPreservedInOriginalMp3"]=True
    segment["promptVerifiedExactToVisibleText"]=False
    segment["originalProviderPromptConfirmed"]=True
    segment["sourceIsFullLengthForVerifiableFirstSentenceExtraction"]=True
    gap_rows[0]["text"]=child_key
    gap_rows[0]["originalGenerationDurationSeconds"]=gap_rows[0].get("durationSeconds")
    gap_rows[0]["durationSeconds"]=None
    gap_rows[0]["speechExtraction"]="provider-character-aligned-first-sentence-de20"
    save(PLAN,plan)
    save(GAPS,gaps)
    print(json.dumps({"status":"EXACT_FIRST_SENTENCE_ALIGNED","segment":SOURCE_SEGMENT,
         "trimSeconds":cut,"providerSilentGapSeconds":round(silence,3),
         "exactVisibleAnswer":True,"newElevenLabsCredits":0},ensure_ascii=False))

if __name__=="__main__":
    main()
