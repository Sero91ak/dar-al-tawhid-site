#!/usr/bin/env python3
"""Complete, read-only 450-question / 1800-clip Kids V4 release QA.

This checks EVERY published question and voice mapping across 4–6, 7–8, 9–10.
It does not listen to sound; acoustic and Fuṣḥā approval cannot be synthesized
from hashes, a manifest flag, or a previous audition of a different take.
"""
from __future__ import annotations
import argparse
import collections
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
BANK=ROOT/"kids/data/quiz-kids-public-450.json"
V4=ROOT/"kids/data/quiz-v4-full-rebuild-public.json"
PLS=ROOT/"data/pronunciation/DAR_AL_TAWHID_ElevenLabs_ARABIC_MASTER_29122.pls"
POLICY=ROOT/"data/pronunciation/voice-language-isolation-v1.json"
PILOT=ROOT/"kids/review-only/voice-language-isolation-pilot-20261027.json"
BANDS=("4-6","7-8","9-10")
PARTS=("question","correct","retry","explanation")
ARABIC=re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")
LATIN=re.compile(r"[A-Za-zÄÖÜäöüß]")
NUR=re.compile(r"(?<!\w)[Nn]ur(?!\w)")
CAPITAL_NUR=re.compile(r"(?<!\w)Nur(?!\w)")


def main() -> int:
    cli=argparse.ArgumentParser()
    cli.add_argument("--strict-audio",action="store_true",
                     help="Block when any legacy mixed-language or Nur-risk public MP3 lacks separate human QA")
    args=cli.parse_args()

    bank=json.loads(BANK.read_text("utf-8"))
    v4=json.loads(V4.read_text("utf-8"))
    policy=json.loads(POLICY.read_text("utf-8"))
    pilot=json.loads(PILOT.read_text("utf-8"))
    if policy["id"]!="dar-voice-language-isolation-v1":
        raise SystemExit("Kids DE/ar voice policy missing")
    if policy["german"]["pronunciationDictionaryLocators"]!=[]:
        raise SystemExit("German voice text MUST NOT receive Arabic PLS")
    if pilot["hearing"]!="OWNER_CONFIRMED_CORRECT_2026-10-27" or not pilot["germanNurVerified"]:
        raise SystemExit("Owner-auditioned German Nur V4 reference provenance missing")
    if pilot["manifestUpdated"] or pilot["visitorAppChanged"] or pilot["approvedForPlayback"]:
        raise SystemExit("A pilot alone must never cause the public MP3/approval to be changed")
    root=ET.parse(PLS).getroot()
    ns="{http://www.w3.org/2005/01/pronunciation-lexicon}"
    collisions={}
    for lex in root.iter(ns+"lexeme"):
        g=lex.findtext(ns+"grapheme")
        alias=lex.findtext(ns+"alias")
        if g and alias:collisions.setdefault(g,set()).add(alias)
    if "النور" not in collisions.get("Nur",set()):
        raise SystemExit("Master Nur pronunciation changed; investigate before release")

    items=bank.get("items",[])
    if len(items)!=450 or len(set(q["id"] for q in items))!=450:
        raise SystemExit("Expected 450 unique published IDs")
    questions=v4.get("questions",{})
    if len(questions)!=450 or set(questions)!=set(q["id"] for q in items):
        raise SystemExit("Public voice / question ID disagreement")
    summary={b:{"questions":0,"v4Clips":0,"nurRiskClips":0,
                "capitalNurClips":0,"mixedArabicLatinClips":0,
                "missingQuestionText":0} for b in BANDS}
    flags=[]
    for q in items:
        qid=q["id"];band=q["ageBand"]
        if band not in BANDS:
            raise SystemExit(f"{qid}: invalid age group")
        summary[band]["questions"]+=1
        if q.get("status")!="published" or q.get("reviewStatus")!="approved" or q.get("verification")!="approved":
            raise SystemExit(f"{qid}: unapproved question exposed")
        if not all(isinstance(q.get(k),str) and q[k].strip() for k in ("question","explanation","source")):
            summary[band]["missingQuestionText"]+=1
            raise SystemExit(f"{qid}: missing child-readable question / explanation / source")
        answers=q.get("answers",[])
        if not 2<=len(answers)<=5 or sum(a.get("correct") is True for a in answers)!=1:
            raise SystemExit(f"{qid}: one and only one correct answer is required")
        normalized=[str(a.get("label","")).strip().casefold() for a in answers]
        if not all(normalized) or len(set(normalized))!=len(normalized):
            raise SystemExit(f"{qid}: blank or duplicate answer")
        record=questions[qid]
        if record["ageBand"]!=band or record["source"]!=q["source"]:
            raise SystemExit(f"{qid}: wrong V4 voice source/age")
        clips=record.get("clips",{})
        if set(clips)!=set(PARTS):
            raise SystemExit(f"{qid}: not four independent clips")
        for part in PARTS:
            clip=clips[part]
            text=str(clip.get("text") or "").strip()
            if not text or clip.get("voiceId")!=v4["voiceId"] or clip.get("modelId")!="eleven_v4":
                raise SystemExit(f"{qid}:{part}: invalid voice script or master voice")
            if not re.fullmatch(r"[0-9a-f]{64}",str(clip.get("sha256") or "")):
                raise SystemExit(f"{qid}:{part}: missing integrity hash")
            if not str(clip.get("url") or "").startswith(f"/kids/assets/kids-quiz-audio/v4-full-rebuild-20261026/{band}/"):
                raise SystemExit(f"{qid}:{part}: wrong media lane")
            summary[band]["v4Clips"]+=1
            if NUR.search(text):
                summary[band]["nurRiskClips"]+=1
                if CAPITAL_NUR.search(text):summary[band]["capitalNurClips"]+=1
                flags.append({"id":qid,"part":part,"band":band,"risk":"german-nur-arabic-PLS-collision"})
            if ARABIC.search(text) and LATIN.search(text):
                summary[band]["mixedArabicLatinClips"]+=1
                flags.append({"id":qid,"part":part,"band":band,"risk":"mixed-script-in-legacy-tts-text"})

    for band in BANDS:
        if summary[band]["questions"]!=150 or summary[band]["v4Clips"]!=600:
            raise SystemExit(f"{band}: 150 questions + 600 V4 slots expected")
    total=sum(s["nurRiskClips"] for s in summary.values())
    if total!=131:
        raise SystemExit("Nur-slot risk baseline changed; rerun QA queue and reassess")
    if sum(s["capitalNurClips"] for s in summary.values())!=82:
        raise SystemExit("Capital Nur baseline changed; review master dictionary collision")
    print(json.dumps({
        "result":"STRUCTURAL PASS; HUMAN HEARING STILL REQUIRED FOR LEGACY AUDIO",
        "everyQuestionChecked":450,"everyClipMappingChecked":1800,
        "ageBands":summary,"flaggedAudioSlots":len(set((f["id"],f["part"]) for f in flags)),
        "nurSlotRisks":total,
        "mixedNativeArabicGermanScriptSlots":sum(s["mixedArabicLatinClips"] for s in summary.values()),
        "oneNewReferenceTakeOwnerApproved":pilot["humanListeningApproved"],
        "publicMP3sChanged":False,"publicAudioHumanValidatedByThisAudit":False
    },ensure_ascii=False,indent=2))
    if args.strict_audio and flags:
        raise SystemExit("BLOCKED: legacy MP3s with DE/AR collision risk need individual hearing QA")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
