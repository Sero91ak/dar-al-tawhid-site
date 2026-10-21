#!/usr/bin/env python3
"""Zero-credit exact finishing plan for 450 TAWḤĪD KIDS V4 quiz items.

Determine per question WHY it is incomplete: missing historic already-paid
originals versus genuinely new speech segments. The historic 9 are never
returned in the chargeable queue. Reuse exact speech across all ages. Output
a feasible cost-minimizing production order, not a synthesis authorization.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts
from quiz_v4_quarantine import quarantined_originals, blocked_full_utterances
from quiz_v4_native_fusha_reuse import load_mapping, resolve_text_originals

ROOT=Path(__file__).resolve().parents[2]
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")
AGES=("4-6","7-8","9-10")
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
NINE=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
FLOW=ROOT/"kids/data/quiz-v4-connected-flow-originals-ledger.json"
STAGE=ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/review-only/quiz-v4-450-next-completion-priority.json"
TEXT=ROOT/"kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md"

def load(f):return json.loads(f.read_text(encoding="utf-8"))
def need(test,message):
    if not test:raise RuntimeError("V4 priority aborted: "+message)
def txt_hash(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()

def main():
    reg,ledger,plan,nine,stage,release=map(load,(REG,LEDGER,PLAN,NINE,STAGE,RELEASE))
    need(release.get("enabled") is False,"quiz must remain review-only")
    need(reg.get("modelId")==MODEL and reg.get("voiceId")==VOICE and reg.get("live") is False,
         "original MP3 registry wrong model or voice")
    need(plan.get("modelId")==MODEL and plan.get("voiceId")==VOICE,"wrong original V4 plan")
    need(stage.get("modelId")==MODEL and stage.get("voiceId")==VOICE
         and stage.get("reviewOnly") is True and stage.get("publicReleaseEnabled") is False,
         "quiz staging wrong model, voice or visibility")
    need(len(plan.get("recipes",[]))==450 and len(stage.get("questions",{}))==450,
         "must examine exactly 450 questions")
    paid=reg.get("generationClips",{})
    stored=reg.get("textClips",{})
    original={r["generationId"]:r for r in nine["items"]}
    need(len(original)==9 and all(r["modelId"]==MODEL and r["voiceId"]==VOICE
         and r["existingPaid"] is True and r["newSynthesisAllowed"] is False
         for r in original.values()),"missing9 prepaid original contract changed")
    missing9={g:r for g,r in original.items() if g not in paid}
    by_text=defaultdict(list)
    for gid,row in missing9.items():by_text[row["originalSpokenText"]].append(gid)
    need(len(by_text)==len(missing9),"ambiguous prepaid text/GID mapping")
    charged={row["text"] for row in ledger["rows"]}
    need(len(charged)==len(ledger["rows"]),"duplicate paid speech in ledger")
    need(charged<=set(stored),"paid ledger entry missing from MP3 registry")
    need(not (charged&set(by_text)),"paid missing Flow text also charged by direct TTS")
    recorded=set(stored)
    blocked_pronunciation_texts, blocked_pronunciation_generation_ids = quarantined_originals(ROOT)
    native_mapping,native_assets=load_mapping(ROOT)
    blocked_utterances=blocked_full_utterances(plan["recipes"],blocked_pronunciation_texts,blocked_pronunciation_generation_ids)
    production=load(ROOT/"kids/data/quiz-v4-450-production-status.json")
    need(production["completedQuestionsWithAllFourAudioParts"]==sum(
         int(x["fourPartTechnicallyReady"]) for x in stage["questions"].values()),
         "stage differs from actual production progress; regenerate cost-free audio staging")
    stage_sha_cache={}
    # Connected ElevenLabs Flow originals may already be charged or reserved.
    # Exclude them from future paid requests until the ORIGINAL is imported.
    protected=protect_paid_texts(ROOT,reg,ledger)
    flow=load(FLOW)
    need(flow.get("modelId")==MODEL and flow.get("voiceId")==VOICE
         and flow.get("live") is False, "connected provider Flow identity changed")
    pending_flow={r["sourceText"]:r for r in flow["entries"]
                  if r["status"]!="IMPORTED_ORIGINAL_MP3_VERIFIED"}
    need(len(pending_flow)==sum(r["status"]!="IMPORTED_ORIGINAL_MP3_VERIFIED"
                                for r in flow["entries"]),
         "duplicate reserved Flow text")
    need(not (set(pending_flow)&recorded) and set(pending_flow)<=protected,
         "reserved Flow text already recorded or not protected against repurchase")

    pending=defaultdict(set)
    records=[]
    every_new=set()
    prepaid_uses=Counter()
    by_age=defaultdict(lambda:Counter())
    missing_sources_by_question={}
    for recipe in plan["recipes"]:
        qid,age=recipe["questionId"],recipe["ageBand"]
        need(age in AGES and qid in stage["questions"],"unknown quiz ID/age")
        q_stage=stage["questions"][qid]
        need(q_stage["ageBand"]==age and q_stage.get("humanListeningApproved") is False
             and q_stage.get("publicPlaybackAuthorized") is False,
             "stage age or audio permissions changed: "+qid)
        question_new=set();question_paid=set();question_flow=set();question_bad=set();blocked_parts={}
        for part in PARTS:
            entry=recipe[part]
            # The real-MP3 stage has checked every composite's source, voice,
            # codec, exact text and owner quarantine. An already playable
            # composite MUST NOT be treated as another paid source gap.
            staged=q_stage.get("parts",{}).get(part)
            if staged is not None:
                need(part not in q_stage.get("missing",{}),
                     "stage simultaneously present and missing: "+qid+"/"+part)
                need(entry["text"] not in blocked_utterances
                     and staged.get("spokenTextSha256")==txt_hash(entry["text"])
                     and staged.get("modelId")==MODEL and staged.get("voiceId")==VOICE
                     and staged.get("reviewOnly") is True
                     and staged.get("audioListeningApproved") is False,
                     "real V4 stage mismatched or quarantined: "+qid+"/"+part)
                url=staged.get("url")
                need(isinstance(url,str) and url.startswith("/kids/assets/kids-quiz-audio/")
                     and url.endswith(".mp3") and ".." not in url and "?" not in url,
                     "unsafe staged MP3 path: "+qid+"/"+part)
                target=(ROOT/url.lstrip("/")).resolve()
                need(target.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve())
                     and target.is_file() and target.stat().st_size==staged.get("bytes"),
                     "staged original missing or size changed: "+qid+"/"+part)
                if url not in stage_sha_cache:
                    stage_sha_cache[url]=hashlib.sha256(target.read_bytes()).hexdigest()
                need(stage_sha_cache[url]==staged.get("sha256"),
                     "staged MP3 bytes fail original SHA check: "+qid+"/"+part)
                continue
            need(part in q_stage.get("missing",{}),
                 "unstaged original has no missing marker: "+qid+"/"+part)
            missing_new=set();missing_old=set();missing_flow=set();missing_bad=set()
            if entry["mode"]=="existing-paid-exact":
                gid=entry["generationId"]
                if gid in blocked_pronunciation_generation_ids:
                    missing_bad.add("generation:"+gid)
                elif gid not in paid:
                    need(gid in missing9,"unidentified old paid original: "+str(gid))
                    missing_old.add(gid)
            elif entry["mode"]=="compose-from-segments":
                segments=entry.get("segments")
                need(isinstance(segments,list) and bool(segments) and
                     " ".join(segments)==entry["text"],"wrong exact text/segment join")
                for segment in segments:
                    # The canonical mixed German + native Arabic utterance can
                    # consist of REAL existing MP3 originals even though the
                    # full sentence has never been synthesized. Expand it
                    # using the same strict source map as the actual importer.
                    if segment in recorded:
                        if segment in blocked_pronunciation_texts:
                            missing_bad.add(segment)
                        continue
                    if segment in native_mapping:
                        _rows,missing_sources=resolve_text_originals(
                            segment,stored,native_mapping,native_assets)
                    else:
                        missing_sources=[segment]
                    for speech in missing_sources:
                        if speech in recorded:
                            if speech in blocked_pronunciation_texts:
                                missing_bad.add(speech)
                            continue
                        if speech in by_text:
                            missing_old.update(by_text[speech])
                        elif speech in pending_flow:
                            missing_flow.add(speech)
                        else:
                            need(speech not in protected,
                                 "previously charged or reserved V4 text in new credit queue")
                            missing_new.add(speech)
                            pending[speech].add((qid,age,part))
            else:
                raise RuntimeError("Unknown V4 recipe mode; refusing paid queue")
            if missing_old or missing_new or missing_flow or missing_bad:
                blocked_parts[part]={"alreadyPaidNotYetImported":sorted(missing_old),
                                     "awaitingConnectedFlowOriginalTextSha256":sorted(txt_hash(x) for x in missing_flow),
                                     "newOriginalTextSha256":sorted(txt_hash(x) for x in missing_new),
                                     "quarantinedPaidOriginalTextSha256":sorted(txt_hash(x) for x in missing_bad)}
            question_new.update(missing_new)
            question_paid.update(missing_old)
            question_flow.update(missing_flow)
            question_bad.update(missing_bad)
        missing_sources_by_question[qid]=set(question_new)
        for gid in question_paid:prepaid_uses[gid]+=1
        need(set(q_stage["missing"])==set(blocked_parts),
             "Stage MP3 missing parts do not match real originals: "+qid)
        actual_complete=q_stage["fourPartTechnicallyReady"]
        need(actual_complete==(not blocked_parts),"Staged full-MP3 claim conflicts with originals: "+qid)
        if not blocked_parts:group="complete-v4-review"
        elif question_bad and not question_new and not question_paid and not question_flow:group="await-owner-pronunciation-replacement"
        elif question_flow and not question_new and not question_paid:group="await-connected-flow-only"
        elif question_paid and not question_new and not question_flow:group="restore-prepaid-originals-only"
        elif (question_paid or question_flow) and not question_new:group="await-other-prepaid-or-reserved-only"
        elif (question_paid or question_flow) and question_new:group="both-prepaid-recovery-and-new-v4"
        else:group="new-original-v4-needed"
        by_age[age][group]+=1
        every_new.update(question_new)
        records.append({
            "questionId":qid,"ageBand":age,"status":group,
            "missingPreviouslyPaidGenerationIds":sorted(question_paid),
            "missingConnectedFlowOriginalTextSha256":sorted(txt_hash(x) for x in question_flow),
            "missingNewTextSha256":sorted(txt_hash(s) for s in question_new),
            "newUniqueSegmentCount":len(question_new),
            "quarantinedPaidPronunciationOriginals":len(question_bad),
            "incrementalTextCodepointsIfAlone":sum(len(s) for s in question_new),
            "incompleteParts":blocked_parts,
        })
    need(len({r["questionId"] for r in records})==450,"duplicate question IDs")
    need(sum(by_age[a]["complete-v4-review"] for a in AGES)==
         sum(int(q["fourPartTechnicallyReady"]) for q in stage["questions"].values()),
         "Current full-part stage count inconsistent")
    need(not set(by_text)&every_new,"Prepaid originals incorrectly in chargeable list")
    need(not set(pending_flow)&every_new,
         "Reserved connected ElevenLabs Flow originals entered the new credit queue")
    # A potential new-TTS priority order: finish the most questions with
    # the fewest unique new text characters, reusing selections already made.
    # First age 4–6, then 7–8, then 9–10. Prepaid-only items remain blocked
    # until their genuine 9 original MP3s are recovered; never pay for them.
    by_id={x["questionId"]:x for x in records}
    rec_lookup={r["questionId"]:r for r in plan["recipes"]}
    chosen=set()
    queue=[]
    for age in AGES:
        available=[r for r in records if r["ageBand"]==age
                   and r["status"] in ("new-original-v4-needed","both-prepaid-recovery-and-new-v4")]
        while available:
            def fragments(row):
                return missing_sources_by_question[row["questionId"]]
            ranked=[]
            for row in available:
                unique=fragments(row)-chosen
                ranked.append((sum(len(s) for s in unique),len(unique),
                               row["questionId"],row,unique))
            ranked.sort(key=lambda x:(x[0],x[1],x[2]))
            codepoints,n_new,qid,row,incremental=ranked[0]
            chosen.update(incremental)
            queue.append({
                "priority":len(queue)+1,"questionId":qid,"ageBand":age,
                "requiresPrepaidRecovery":bool(row["missingPreviouslyPaidGenerationIds"]),
                "requiresConnectedFlowResolution":bool(row["missingConnectedFlowOriginalTextSha256"]),
                "incrementalUnrecordedSegmentCount":n_new,
                "incrementalUnicodeCodepoints":codepoints,
                "cumulativeNewUniqueSegments":len(chosen),
                "cumulativeUnicodeCodepoints":sum(len(x) for x in chosen),
                "newTextSha256":sorted(txt_hash(x) for x in incremental),
                "speechGenerationAuthorized":False
            })
            available.remove(row)
    need(chosen==every_new,"Not all genuinely new segments scheduled exactly once")
    summary={
        "modelId":MODEL,"voiceId":VOICE,"selectedQuestions":450,
        "ageCounts":{a:dict(by_age[a]) for a in AGES},
        "alreadyTechnicallyComplete":sum(by_age[a]["complete-v4-review"] for a in AGES),
        "questionsBlockedOnlyOnAlreadyPaidNine":sum(by_age[a]["restore-prepaid-originals-only"] for a in AGES),
        "questionsWaitingOnlyForConnectedFlowOriginals":sum(by_age[a]["await-connected-flow-only"] for a in AGES),
        "connectedFlowOriginalTextsPendingOrReserved":len(pending_flow),
        "connectedFlowUnsettledStatuses":dict(Counter(x["status"] for x in pending_flow.values())),
        "questionsNeedingAtLeastOneGenuinelyNewOriginal":sum(
            by_age[a]["new-original-v4-needed"]+by_age[a]["both-prepaid-recovery-and-new-v4"] for a in AGES),
        "previouslyPaidMissingGenerationCount":len(missing9),
        "ownerPronunciationOriginalTextsQuarantined":len(blocked_pronunciation_texts),
        "questionsWaitingOnlyForPronunciationReplacement":sum(by_age[a]["await-owner-pronunciation-replacement"] for a in AGES),
        "reservedFlowOriginalsExcludedFromNewChargeQueue":len(pending_flow),
        "previouslyPaidMissingGenerationIds":sorted(missing9),
        "missingGenuineNewExactSegments":len(every_new),
        "missingGenuineNewTextCodepoints":sum(len(x) for x in every_new),
        "distinctPreviouslySavedOriginalTextKeys":len(recorded),
        "directPaidOriginalsWithUniqueReceipts":len(charged),
        "newElevenLabsCreditsSpent":0,"paidSynthesisAuthorized":False,
        "humanListeningApproved":False,"publicReleaseAllowed":False
    }
    report={"schemaVersion":1,"scope":"KIDS_V4_450_RECOVERY_FIRST_COMPLETION_PRIORITY",
            "summary":summary,"historicalAlreadyPaidOriginalRecoveryOrder":[
                {"generationId":g,"originalFilename":original[g]["originalFileName"],
                 "questionsDependingOnIt":prepaid_uses[g],
                 "mustUseOriginalMP3":True,"newSynthesisAllowed":False}
                for g in sorted(missing9,key=lambda g:(-prepaid_uses[g],g))],
            "questions":sorted(records,key=lambda r:(AGES.index(r["ageBand"]),r["questionId"])),
            "possibleNewSpeechPriorityAfterOriginalRecovery":queue,
            "connectedFlowOriginalsToRecoverWithoutSecondPurchase":[
                {"sourceTextSha256":txt_hash(txt),"status":row["status"],
                 "newSynthesisAllowed":False}
                for txt,row in sorted(pending_flow.items())],
            "queueCostUnit":"Exact new Unicode codepoints only; not billed provider credits",
            "queueIsReviewOnly":True,"noCreditSpendConfirmed":True}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lines=["# KIDS-Quiz – V4-Rettung zuerst, danach neue Aufnahmen (Review)",
           "","**Verbindlich:** Serhat-Masterstimme `"+VOICE+"`, Modell `eleven_v4`.",
           "Kein bestehendes bezahltes Original darf erneut synthetisiert werden. Keine Audiofreigabe und kein Live-Push.",
           "Auch alle reservierten/eingereichten ElevenLabs-Flow-Aufnahmen bleiben bis zur Klärung für neue TTS-Kosten gesperrt.",
           "",
           "| Alter | Technisch komplett | Nur alte Originale nachladen | Nur offenen Flow klären | Neue V4-Originale erforderlich |",
           "|---|---:|---:|---:|---:|"]
    for age in AGES:
        b=by_age[age]
        lines.append("| "+age+" | "+str(b["complete-v4-review"])+" | "+
                     str(b["restore-prepaid-originals-only"])+" | "+
                     str(b["await-connected-flow-only"]+b["await-other-prepaid-or-reserved-only"])+" | "+
                     str(b["new-original-v4-needed"]+b["both-prepaid-recovery-and-new-v4"])+" |")
    lines+=["","**Schon bezahlte Originale noch zu retten:** "+str(len(missing9))+".",
           "**Ungeklärte verbundene Flow-Originale, die nicht erneut gekauft werden dürfen:** "+str(len(pending_flow))+".",
           "**Quizfragen, die nur auf verbundene Flow-Originale warten:** "+str(summary["questionsWaitingOnlyForConnectedFlowOriginals"])+".",
           "**Durch bestätigte bzw. zu prüfende Aussprache gesperrte Texte:** "+str(len(blocked_pronunciation_texts))+" (niemals automatisch neu bezahlen).",
           "**Neue einzigartige Texte nach echtem Deduplizieren:** "+str(len(every_new))+
           " (nur Berechnungsbasis; keine Credits bestellt).",
           "","## Nächste technische Aktion",
           "1. Die historischen neun `eleven_v4`-MP3s mit echten Generation-IDs importieren, nicht regenerieren.",
           "2. Die ausstehenden bereits reservierten oder eingereichten verbundenen Flow-Originale prüfen und NUR als echte Original-MP3s importieren. Keine erneute Synthese dieser Text-SHAs.",
           "3. Den vorhandenen kostenfreien Offline-Zusammenbau und die Quiz-MP3-Zuordnung erneut ausführen.",
           "4. Danach diese Priorisierung mit `python3 kids/tools/plan_quiz_v4_finish_without_duplicate_credits.py` erneut aufbauen.",
           "5. Noch offene neue V4-Originaltexte erneut mit dem Ledger deduplizieren und nur nach Kostenfreigabe produzieren.",
           "6. Menschliche Ausspracheprüfung, Offline-/Gerätetest, Freigabeschalter weiterhin aus.",
           "","## Priorität der historischen Originale", ""]
    for item in report["historicalAlreadyPaidOriginalRecoveryOrder"]:
        lines.append("- `"+item["generationId"]+"`: "+str(item["questionsDependingOnIt"])+" Quizfragen hängen direkt davon ab.")
    lines+=["","_Die technische Priorisierung ist keine Inhalts-, Aussprache- oder Rechnungsprüfung._",""]
    TEXT.write_text("\n".join(lines),encoding="utf-8")
    print("KIDS_V4_RECOVERY_FIRST_PRIORITY "+json.dumps(summary,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
