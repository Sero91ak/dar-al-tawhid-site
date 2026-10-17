#!/usr/bin/env python3
"""Read-only and credit-free analysis of still-new V4 quiz spoken text.

Separates V4 originals that HAVE ALREADY BEEN PAID FOR from truly new speech
fragments. Reports text length by age and question-part type, and how much
the UNCONFIRMED 79k estimate would have to shrink to meet the earlier
aspirational 27,860-credit ceiling. Does NOT rewrite the 450 questions,
create generated speech, or authorize spending/publishing.
"""
from __future__ import annotations

import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
REG=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
PREPAID=ROOT/"kids/data/quiz-v4-missing9-prepaid-originals.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/review-only/quiz-v4-remaining-unique-audio-credit-breakdown.json"
MARKDOWN=ROOT/"kids/review-only/QUIZ-V4-AUDIO-KOSTENCHECK.md"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")
AGES=("4-6","7-8","9-10")
ASPIRATIONAL_BUDGET=27860.0

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def ensure(value, reason):
    if not value:raise RuntimeError("Quiz V4 cost report blocked: "+reason)

def main():
    plan,reg,prepaid,flag=map(load,(PLAN,REG,PREPAID,FLAG))
    ensure(flag.get("enabled") is False and reg.get("live") is False,
           "public release unexpectedly enabled")
    ensure(all(x.get("modelId")==MODEL and x.get("voiceId")==VOICE for x in (plan,reg)),
           "V4 master voice/model mismatch")
    ensure(len(plan["recipes"])==450,"expected 450 selected questions")
    ensure(all(sum(q["ageBand"]==age for q in plan["recipes"])==150 for age in AGES),
           "150 age-band questions missing")
    historic={x["originalSpokenText"] for x in prepaid["items"]}
    ensure(len(prepaid["items"])==9,"must protect exactly nine known old paid recordings")
    ensure(all(x["existingPaid"] is True and x["newSynthesisAllowed"] is False
               for x in prepaid["items"]),"old paid MP3 unprotected")
    existing=set(reg["textClips"])
    seen=defaultdict(lambda:{"ages":set(),"parts":set(),"uses":0})
    byage={age:defaultdict(lambda:{"uses":0,"segments":set()}) for age in AGES}
    historic_dependencies=Counter()
    for q in plan["recipes"]:
        for part in PARTS:
            item=q[part]
            if item["mode"]=="existing-paid-exact":
                ensure(item["generationId"] in reg["generationClips"]
                       or item["text"] in historic,
                       "unknown missing historic charged MP3")
                if item["generationId"] not in reg["generationClips"]:
                    historic_dependencies[q["ageBand"]]+=1
                continue
            ensure(item["mode"]=="compose-from-segments" and
                   " ".join(item["segments"])==item["text"],"invalid spoken text split")
            for segment in item["segments"]:
                if segment in existing:continue
                if segment in historic:
                    historic_dependencies[q["ageBand"]]+=1
                    continue
                entry=seen[segment]
                entry["ages"].add(q["ageBand"])
                entry["parts"].add(part)
                entry["uses"]+=1
                age=byage[q["ageBand"]][part]
                age["uses"]+=1
                age["segments"].add(segment)

    counts={}
    for age in AGES:
        counts[age]={}
        distinct=set()
        for part in PARTS:
            row=byage[age][part]
            distinct.update(row["segments"])
            counts[age][part]={
                "uniqueNewSegments":len(row["segments"]),
                "newTextCodepoints":sum(len(t) for t in row["segments"]),
                "newTextAssignments":row["uses"]
            }
        counts[age]["allUniqueNewSegmentsWithoutCrossAgeDedupe"]=len(distinct)
        counts[age]["newCodepointsWithoutCrossAgeDedupe"]=sum(len(t) for t in distinct)
    all_text=set(seen)
    unique_chars=sum(len(t) for t in all_text)
    other_total=sum(counts[age]["newCodepointsWithoutCrossAgeDedupe"] for age in AGES)
    cross_age={t for t,fields in seen.items() if len(fields["ages"])>1}
    existing_forecast=float(plan["creditEstimate"])
    ensure(unique_chars>0 and existing_forecast>0,"wrong cost estimation basis")
    derived_rate=existing_forecast/unique_chars
    allowed_chars=math.floor(ASPIRATIONAL_BUDGET/derived_rate)
    report={
        "schemaVersion":1,
        "scope":"KIDS_450_UNPAID_V4_SPOKEN_TEXT_FORECAST_REVIEW_ONLY",
        "modelId":MODEL,"voiceId":VOICE,
        "selectedQuestions":450,
        "previouslyPaidMissingFlowOriginals":len(prepaid["items"]),
        "alreadySavedDistinctV4TextClips":len(existing),
        "uniqueTrulyNewTextFragments":len(all_text),
        "trulyNewTextCodepoints":unique_chars,
        "newTextCodepointsBeforeCrossAgeDedup":other_total,
        "codepointsSavedByCrossAgeReuse":other_total-unique_chars,
        "crossAgeSharedNewTextFragments":len(cross_age),
        "byAge":counts,
        "newSpeechNeededForAge4to6":len({
            t for t,x in seen.items() if "4-6" in x["ages"]})>0,
        "existingUnconfirmedFull450ForecastCredits":round(existing_forecast,2),
        "originalForecastNotAnInvoice":True,
        "earlierAspirationalBudgetCredits":ASPIRATIONAL_BUDGET,
        "currentEstimateOverTargetCredits":round(max(0,existing_forecast-ASPIRATIONAL_BUDGET),2),
        "derivedForecastCreditsPerNewCodepoint":round(derived_rate,6),
        "approxCodepointCeilingToHitBudgetAtUnchangedForecastRate":allowed_chars,
        "approxTextReductionPercentageNeededAtSameRate":round(
            100*max(0,unique_chars-allowed_chars)/unique_chars,1),
        "creditForecastMustBeRecheckedAgainstProviderBilling":True,
        "candidateTextEditsAuthorized":False,
        "paidSynthesisAuthorized":False,
        "creditsSpentByThisAudit":0,
        "humanPronunciationApproved":False,
        "publicReleaseAllowed":False
    }
    current_expected={x["text"] for x in plan["pendingAudioFragments"]}
    current_expected-=existing
    current_expected-=historic
    ensure(all_text==current_expected,
           "Remaining new original list no longer matches the exact selected V4 plan")
    ensure(not report["newSpeechNeededForAge4to6"],
           "Unexpected new speech required in 4-6 group; audit old paid first")
    ensure(sum(counts[age]["question"]["uniqueNewSegments"]+
               counts[age]["explanation"]["uniqueNewSegments"]
               for age in ("7-8","9-10"))>=len(all_text),
           "Missing question/explanation billing classification")
    ensure(all(counts[a][part]["uniqueNewSegments"]==0 for a in AGES
               for part in ("correct","retry")),
           "New correct/retry speech has appeared; audit existing V4 reuse")
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    lines=[
        "# TAWḤĪD KIDS – V4-Audiokosten: neuer Originalbedarf, keine Doppelkäufe",
        "",
        "Das ist ein **kostenfreier, unveröffentlichter Text- und Budgetaudit**.",
        "**Verbindliche Stimme:** `eleven_v4` / `"+VOICE+"`.",
        "",
        "| Altersgruppe | Neue Fragen-Fragmente | Neue Erklärungs-Fragmente | Neue Lob-Audios | Neue Retry-Audios |",
        "|---|---:|---:|---:|---:|",
    ]
    for age in AGES:
        c=counts[age]
        lines.append("| "+age+" | "+str(c["question"]["uniqueNewSegments"])+" | "+
            str(c["explanation"]["uniqueNewSegments"])+" | "+
            str(c["correct"]["uniqueNewSegments"])+" | "+
            str(c["retry"]["uniqueNewSegments"])+" |")
    lines.extend([
        "",
        "- **"+str(len(all_text))+"** echte neue, unterschiedliche Originalfragmente nach Deduplizierung.",
        "- **"+str(unique_chars)+"** neue Unicode-Textzeichen insgesamt.",
        "- **"+str(len(cross_age))+"** altersübergreifend wiederverwendbare neue Fragmente.",
        "- **"+str(other_total-unique_chars)+"** Zeichen werden durch exakte altersübergreifende Wiederverwendung nicht mehrfach gekauft.",
        "- Für 4–6 Jahre sind **null neue Sprachgenerierungen** erforderlich, aber neun bereits bezahlte ElevenLabs-Flow-Originale müssen noch wiederhergestellt werden.",
        "",
        "## Planungsbudget: früheres Ziel und aktueller Quelltext",
        "",
        "- Frühere interne Budgetzielgröße: **"+str(int(ASPIRATIONAL_BUDGET))+" Credits**.",
        "- Bisheriger, **nicht vom Provider bestätigter** Kostenansatz für den Vollausbau: **"+str(round(existing_forecast,2))+" Credits**.",
        "- Daraus rein rechnerisch: Bei unverändertem angenommenem Satz dürften nur etwa **"+
          str(allowed_chars)+"** neue Textzeichen übrigbleiben (**"+
          str(report["approxTextReductionPercentageNeededAtSameRate"])+
          " %** Reduktion). Das ist keine belastbare Zusage über ElevenLabs-Rechnungen.",
        "- Der bestehende Kostenansatz enthält keine hier autorisierten neuen TTS-Aufträge.",
        "",
        "## Verbindliche Fortsetzung",
        "",
        "1. Die neun schon bezahlten Original-MP3s zuerst exportieren/importieren. Nicht erneut bezahlen.",
        "2. Die bisher vorhandenen korrekten Lob-/Retry-Audios altersübergreifend exakt wiederverwenden.",
        "3. Frage- und Erklärungstexte für 7–10 Jahre zunächst auf überflüssige Anmoderation und Wiederholungen **redaktionell** prüfen; keine falsche Kürzung von Quelleninhalt oder Änderung der pädagogischen Aussage.",
        "4. Vor jeder bezahlten Aufnahme Credit-Schätzung neu berechnen, Originaltext-SHA prüfen, Master V4 festlegen und das Original einmalig speichern.",
        "5. **Keine** automatische Bearbeitung der 450 kanonischen Fragen, kein kostenpflichtiges API-POST, kein Live-Push oder vorweggenommene Hörfreigabe.",
        ""
    ])
    MARKDOWN.write_text("\n".join(lines),encoding="utf-8")
    print("KIDS_V4_NO_CREDIT_AUDIO_BUDGET "+json.dumps({
        "fragments":len(all_text),"chars":unique_chars,
        "crossAgeSavedCharacters":other_total-unique_chars,
        "ages4to6NewSpeech":0,"estimateNotActualCredits":existing_forecast,
        "creditsSpent":0,"public":False},ensure_ascii=False))

if __name__=="__main__":
    main()
