#!/usr/bin/env python3
"""Zero-credit, non-destructive compact spoken-copy proposal for KIDS V4 older 300.

Uses ONLY original canonical questions, original answers and exact explanations.
Removes filler intros/closing only. Never changes canonical questions, voice
production plan, paid originals, release switches or public quiz files.
A potential narration must still be reviewed by a human before ANY V4 TTS.
"""
from __future__ import annotations
import hashlib
import json
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
CAT=ROOT/"kids/data/quiz-kids-curated-450-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/review-only/quiz-v4-older300-compact-spoken-proposals.json"
SUMMARY=ROOT/"kids/review-only/QUIZ-V4-SPRECHTEXT-OPTIMIERUNG-ENTWURF.md"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))
def require(test,msg):
    if not test: raise RuntimeError("V4 compact draft blocked: "+msg)
def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def main():
    plan,cat,reg,flag=map(load,(PLAN,CAT,REG,FLAG))
    require(flag.get("enabled") is False and reg.get("live") is False,
            "public release must remain disabled")
    require(plan.get("voiceId")==VOICE and plan.get("modelId")==MODEL
            and reg.get("voiceId")==VOICE and reg.get("modelId")==MODEL,
            "never mix legacy and original master V4 voices")
    canon={q["id"]:q for q in cat["items"]}
    require(len(canon)==450,"not the curated canonical 450 originals")
    old={q["questionId"]:q for q in plan["recipes"]}
    require(len(old)==450,"lost original V4 source contracts")
    drafts=[]
    stats={age:Counter() for age in ("7-8","9-10")}
    for age in ("7-8","9-10"):
        for original in plan["recipes"]:
            if original["ageBand"]!=age:continue
            q=canon[original["questionId"]]
            require(q["ageBand"]==age,"category/age changed")
            require(q["question"] in original["question"]["text"]
                    and q["explanation"] in original["explanation"]["text"],
                    "cannot prove original question and explanation are preserved")
            choices=q.get("answers")
            require(isinstance(choices,list) and 2<=len(choices)<=5
                    and sum(a.get("correct") is True for a in choices)==1,
                    "original answer key not complete")
            for item in choices:
                require(isinstance(item.get("label"),str) and item["label"].strip(),
                        "answer label missing")
                require(item["label"] in original["question"]["text"],
                        "an original answer is missing in the V4 source audio")
            # No extra filler: use original educational text unchanged.
            # Do not remove diacritics, Qur'an notation, or any answer label.
            spoken_question=q["question"].strip()+" "+" ".join(
                "Antwort "+str(i+1)+": "+answer["label"] for i,answer in enumerate(choices))
            spoken_explanation=q["explanation"].strip()
            require(q["question"] in spoken_question
                    and all(a["label"] in spoken_question for a in choices)
                    and spoken_explanation==q["explanation"].strip(),
                    "a proposed edit changed an educational statement")
            old_q=original["question"]["text"]
            old_e=original["explanation"]["text"]
            # A shorter script may require different unique fragments and
            # potentially NEW original MP3s. Do not claim direct credit saving.
            saved_raw=len(old_q)+len(old_e)-len(spoken_question)-len(spoken_explanation)
            require(saved_raw>=0,"compact alternative is longer than current V4 speech")
            stats[age]["questions"]+=1
            stats[age]["originalFullFieldCodepoints"]+=len(old_q)+len(old_e)
            stats[age]["compactFullFieldCodepoints"]+=len(spoken_question)+len(spoken_explanation)
            stats[age]["rawFullFieldCodepointsRemoved"]+=saved_raw
            drafts.append({
                "questionId":q["id"],"ageBand":age,
                "category":q.get("category"),"source":q.get("source"),
                "originalCanonicalQuestion":q["question"],
                "originalCanonicalAnswerLabels":[a["label"] for a in choices],
                "originalCorrectAnswer":next(a["label"] for a in choices if a["correct"] is True),
                "originalCanonicalExplanation":q["explanation"],
                "proposedSpokenQuestion":spoken_question,
                "proposedSpokenExplanation":spoken_explanation,
                "currentQuestionVoiceTextSha256":sha(old_q),
                "currentExplanationVoiceTextSha256":sha(old_e),
                "proposedQuestionVoiceTextSha256":sha(spoken_question),
                "proposedExplanationVoiceTextSha256":sha(spoken_explanation),
                "removedRawVoiceCodepointsBeforeDedup":saved_raw,
                "educationalWordingPreserved":True,
                "audioRevisionAuthorized":False,
                "requiresQualifiedHumanEditorialReview":True,
                "publicVisible":False
            })
    require(len(drafts)==300 and all(stats[a]["questions"]==150 for a in stats),
            "need exactly 150 unchanged questions per older age band")
    totals={key:sum(stats[a][key] for a in stats) for key in
            ("questions","originalFullFieldCodepoints",
             "compactFullFieldCodepoints","rawFullFieldCodepointsRemoved")}
    totals["rawFullFieldReductionPercent"]=round(
        100*totals["rawFullFieldCodepointsRemoved"]/totals["originalFullFieldCodepoints"],1)
    data={"schemaVersion":1,"scope":"TAWHID_KIDS_OLDER300_COMPACT_V4_REVIEW_ONLY",
          "voiceId":VOICE,"modelId":MODEL,"newV4GenerationsRequested":0,
          "creditsSpent":0,"audioProductionAuthorized":False,
          "canonicalQuestionTextsModified":False,"existingPaidMP3sModified":False,
          "voicePlanModified":False,"humanEditorialApproved":False,
          "publicReleaseAllowed":False,
          "rawCodepointComparisonNotEquivalentToElevenLabsBilledCreditSavings":True,
          "summary":totals,"byAge":{a:dict(stats[a]) for a in stats},
          "proposals":drafts}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    markdown=[
        "# TAWḤĪD KIDS – kompaktere V4-Sprechtexte (nur Entwurf)",
        "",
        "**300/300 unveränderte Originalfragen mit identischen Antwortmöglichkeiten, Antwortschlüsseln und Erklärungen.**",
        "Noch nicht freigegeben, keine bezahlten Audios erzeugt, keine öffentliche App-Datei geändert.",
        "Ausschließlich die Masterstimme `"+VOICE+"`, Modell `eleven_v4`.",
        "",
        "| Alter | Original-Zeichen Frage+Erklärung | Entwurf-Zeichen | Rohe Textverkürzung |",
        "|---|---:|---:|---:|"
    ]
    for age in ("7-8","9-10"):
        q=stats[age]
        markdown.append("| "+age+" | "+str(q["originalFullFieldCodepoints"])+" | "+
                        str(q["compactFullFieldCodepoints"])+" | "+
                        str(q["rawFullFieldCodepointsRemoved"])+" |")
    markdown.extend([
        "",
        "Gesamte rohe Textlängenänderung: **"+str(totals["rawFullFieldReductionPercent"])+
        " %** gegenüber den bisherigen vollständig ausgeschriebenen Sprachfeldern.",
        "**Wichtige Einschränkung:** Der Wert ist KEINE verlässliche Credit-Ersparnis.",
        "Schon vorhandene einzelne V4-Fragmente und altersübergreifende Wiederverwendung",
        "müssen vor einem möglichen neuen Produktionsplan separat gegen die Text-SHA geprüft werden.",
        "",
        "Die Kürzung entfernt lediglich wiederholte Einleitungen, Schlussaufforderungen und",
        "die wiederholte Floskel vor der Erklärung. Alle kanonischen Frage- und Erklärungstexte",
        "sowie alle Antwortmöglichkeiten bleiben vollständig erhalten.",
        "",
        "Voraussetzung vor Änderung der Produktion: Jede neue Sprechfassung",
        "durch Fachprüfung, Altersangemessenheit, Audio-Mastermodell und Kostenregeln freigeben.",
        "Keine Änderungen an den bereits bezahlten 327 direkten V4-MP3s oder neun noch",
        "nicht wiederhergestellten, bereits bezahlten Originalen.",
        ""
    ])
    SUMMARY.write_text("\n".join(markdown),encoding="utf-8")
    print("TAWHID_KIDS_OLDER_V4_COMPACT_REVIEW "+
          json.dumps({"questions":300,**totals,"humanApproval":False,
                      "creditsSpent":0,"live":False},ensure_ascii=False))

if __name__=="__main__":
    main()
