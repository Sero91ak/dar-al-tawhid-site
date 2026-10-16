#!/usr/bin/env python3
"""Reproducible, credit-free, copyable project handover for TAWḤĪD KIDS Quiz V4.

Always regenerate from actual review import, original MP3 registry and ledgers.
No ElevenLabs API, no synthesis, no approval flags, no public app changes.
Do not put auth codes, signed URLs, environment variables or credentials in report.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
BRANCH="review/kids-quiz-v4-batch-001-020-20261014"
PR="https://github.com/Sero91ak/dar-al-tawhid-site/pull/1143"
FLOW="https://elevenlabs.io/app/flows/n2ovmGko2iTlNWTAEqHk"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
OUT=ROOT/"kids/review-only/QUIZ-V4-UEBERGABE-AKTUELL.md"
STATE=ROOT/"kids/review-only/quiz-v4-handover-latest.json"

def read(file):
    return json.loads((ROOT/file).read_text(encoding="utf-8"))

def require(condition, reason):
    if not condition: raise RuntimeError("V4 handover state invalid: "+reason)

def current_commit():
    try:
        r=subprocess.run(["git","rev-parse","HEAD"],cwd=ROOT,
                         capture_output=True,text=True,check=True)
        result=r.stdout.strip()
        return result if len(result)==40 and all(c in "0123456789abcdef" for c in result) else "unavailable"
    except (OSError,subprocess.CalledProcessError):
        return "unavailable (GitHub PR #1143)"

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--check",action="store_true",
                   help="Check this handover without changing existing files")
    args=a.parse_args()
    import_status=read("kids/review-only/quiz-v4-450-actual-mp3-import-summary.json")
    saved=read("kids/data/quiz-v4-450-original-clip-registry.json")
    charged=read("kids/data/quiz-v4-450-paid-generation-ledger.json")
    paid_import=read("kids/data/quiz-v4-paid-flow-import-status.json")
    last9=read("kids/data/quiz-v4-missing9-prepaid-originals.json")
    plan=read("kids/data/quiz-v4-450-production-status.json")
    release=read("kids/data/quiz-curation-release.json")
    recovery_priority=read("kids/review-only/quiz-v4-450-next-completion-priority.json")["summary"]
    cost=read("kids/review-only/quiz-v4-remaining-unique-audio-credit-breakdown.json")
    draft_file=ROOT/"kids/review-only/quiz-v4-older300-compact-spoken-proposals.json"
    speech_draft=read("kids/review-only/quiz-v4-older300-compact-spoken-proposals.json") if draft_file.is_file() else None
    if speech_draft is not None:
        require(speech_draft["modelId"]==MODEL and speech_draft["voiceId"]==VOICE
                and len(speech_draft["proposals"])==300
                and speech_draft["audioProductionAuthorized"] is False
                and speech_draft["publicReleaseAllowed"] is False,
                "older300 spoken edit proposals must remain a safe review only")
    require(cost["modelId"]==MODEL and cost["voiceId"]==VOICE
            and cost["selectedQuestions"]==450
            and cost["creditsSpentByThisAudit"]==0
            and cost["paidSynthesisAuthorized"] is False,
            "new audio cost review must remain V4 master and no-credit")
    hearing_file=ROOT/"kids/review-only/quiz-v4-450-human-hearing-submission-ledger.json"
    hearing=read("kids/review-only/quiz-v4-450-human-hearing-submission-ledger.json") if hearing_file.is_file() else None
    if hearing is not None:
        require(hearing.get("masterVoiceId")==VOICE and hearing.get("modelId")==MODEL
                and hearing.get("publicReleaseAllowed") is False
                and hearing.get("humanApprovalVerifiedByImporter") is False,
                "hearing submissions must never silently become public approval")
    if release.get("enabled") is not False:raise RuntimeError("Never publish unapproved V4 quiz")
    require(saved["modelId"]==MODEL and saved["voiceId"]==VOICE and saved["live"] is False,
            "wrong original audio model or voice")
    require(release["publishingRequirements"]["modelId"]==MODEL
            and release["publishingRequirements"]["voiceId"]==VOICE,
            "wrong publishing voice contract")
    require(import_status["questionsStaged"]==450
            and import_status["completeFourPartQuestions"]+import_status["notCompleteFourPartQuestions"]==450,
            "invalid staged quiz coverage")
    require(plan["selectedTotal"]==450 and plan["reservedTotal"]==450
            and plan["originalQuizCatalogCount"]==900,"canonical 900 question partition lost")
    require(len(charged["rows"])<=len(saved["textClips"]),
            "ledger exceeds registry")
    require(len({row["text"] for row in charged["rows"]})==len(charged["rows"]),
            "a charged text is duplicated")
    require(len({row["providerRequestId"] for row in charged["rows"] if row.get("providerRequestId")})
            ==sum(bool(row.get("providerRequestId")) for row in charged["rows"]),
            "a paid ElevenLabs receipt is duplicated")
    for row in charged["rows"]:
        recorded=saved["textClips"].get(row["text"],{})
        require(recorded.get("sha256")==row["mp3Sha256"]
                and row["textSha256"]==hashlib.sha256(row["text"].encode()).hexdigest(),
                "a paid original receipt differs from the registry")
    prior=saved["generationClips"]
    require(len(prior)+len(paid_import["remainingGenerationIds"])==56,
            "56 original paid Flow takes have not been completely reconciled")
    require(set(prior).isdisjoint(paid_import["remainingGenerationIds"]),
            "an original MP3 is simultaneously missing and imported")
    missing={x["generationId"] for x in last9["items"]}
    require(set(paid_import["remainingGenerationIds"]).issubset(missing),
            "prepaid recovery contains unrecognized IDs")
    require(all(x.get("modelId")==MODEL and x.get("voiceId")==VOICE
                and x.get("existingPaid") is True and x.get("newSynthesisAllowed") is False
                for x in last9["items"]),"unrecovered V4 takes are not protected")
    ages=import_status["byAge"]
    require(all(ages[a]["questions"]==150 for a in ("4-6","7-8","9-10")),
            "expected 150 quiz questions per age")
    require(sum(ages[a]["completeFourPartQuestions"] for a in ages)
            ==import_status["completeFourPartQuestions"],"totals do not match age rows")
    require(import_status["humanListeningApprovals"]==0,
            "not authorized to claim human hearing approval")

    require(recovery_priority["modelId"]==MODEL and recovery_priority["voiceId"]==VOICE,
            "recovery-first completion plan has wrong voice/model")
    priority_current=(recovery_priority["alreadyTechnicallyComplete"]==import_status["completeFourPartQuestions"]
                      and recovery_priority["previouslyPaidMissingGenerationCount"]==len(paid_import["remainingGenerationIds"]))
    sha=current_commit()
    count=len(paid_import["remainingGenerationIds"])
    details={
        "schemaVersion":1,"app":"TAWḤĪD KIDS",
        "branch":BRANCH,"pullRequest":PR,"basedOnReviewedCommit":sha,
        "modelId":MODEL,"masterVoiceId":VOICE,
        "totalCanonicalQuestions":900,
        "selected":450,"reserved":450,"ageBreakdown":ages,
        "uniqueVerifiedQuizMP3s":import_status["uniqueRealMP3Hashes"],
        "reusedSpeechPartAssignments":sum(sum(row["availableParts"].values()) for row in ages.values()),
        "fourPartAudioQuestions":import_status["completeFourPartQuestions"],
        "missingPartsQuestions":import_status["notCompleteFourPartQuestions"],
        "remainingNewV4UniqueSegmentsByCostAudit":cost["uniqueTrulyNewTextFragments"],
        "remainingNewV4TextCodepoints":cost["trulyNewTextCodepoints"],
        "older300CompactSpokenDraftCount":len(speech_draft["proposals"]) if speech_draft else 0,
        "older300RawFullTextReductionPercent":speech_draft["summary"]["rawFullFieldReductionPercent"] if speech_draft else None,
        "creditBudgetAspirationalTarget":cost["earlierAspirationalBudgetCredits"],
        "estimatedAudioTextReductionForTargetPercent":cost["approxTextReductionPercentageNeededAtSameRate"],
        "recoveryFirstPriorityPlanFresh":priority_current,
        "onlyAlreadyPaidMP3RecoveryBlockedQuestions":recovery_priority["questionsBlockedOnlyOnAlreadyPaidNine"] if priority_current else None,
        "questionsNeedingNewV4Originals":recovery_priority["questionsNeedingAtLeastOneGenuinelyNewOriginal"] if priority_current else None,
        "originalV4TextClipsRegistered":len(saved["textClips"]),
        "previouslyChargedDirectV4Takes":len(charged["rows"]),
        "prepaidOriginalsImported":len(prior),
        "prepaidOriginalsStillMissing":count,
        "missingGenerationIds":sorted(paid_import["remainingGenerationIds"]),
        "remainingUniqueSpeechSegmentsEstimate":plan["uniqueSegmentsStillWithoutOriginalMP3"],
        "remainingEstimatedCreditsForAll450":plan["estimatedAdditionalCreditsForFullSelected450"],
        "preciseBillingReconciled":not plan["exactProviderChargesNotFullyReconciled"],
        "masterOfflineHearingPackageBuilder":"kids/tools/build_quiz_v4_all450_master_hearing_review.py",
        "masterOfflineHearingGitHubActions":"https://github.com/Sero91ak/dar-al-tawhid-site/actions/workflows/kids-v4-all450-master-hearing-package.yml",
        "selfAttestedHearingClaimCount":hearing["claimedApprovalClipCount"] if hearing else 0,
        "reportedHearingIssuesCount":hearing["submittedIssueClipCount"] if hearing else 0,
        "hearingReviewVerifiedByImporter":False,
        "humanAudioApprovals":0,"publicEnabled":False,
        "newElevenLabsCreditsConsumedByThisReport":0,
        "recoveryFlowUrl":FLOW,
        "nextTechnicalStep":("Obtain original, already-paid MP3 bytes for missing generation IDs; use existing import workflow and reassemble without synthesis"
                            if count else
                            "Review staged audio, confirm hearing quality, plan only new unique missing V4 recordings")
    }
    header=[
        "# TAWḤĪD KIDS – QUIZ V4 · KOPIERBARE ÜBERGABE (aktueller GitHub-Stand)",
        "",
        "**Geltungsbereich:** interner Quiz-Reviewzweig, **nicht** öffentliche App.",
        "**Pflichtmodell:** `eleven_v4`, **Masterstimme:** Serhat Abu Malik, Voice-ID `"+VOICE+"`.",
        "**Untersagt:** Flash/ältere TTS, wiederholte kostenpflichtige Generierung bereits bezahlter Aufnahmen, fingierte MP3s, Freigabe ohne menschliche Hörkontrolle.",
        "",
        "- GitHub: "+PR,
        "- Arbeitszweig: `"+BRANCH+"`",
        "- Commit beim Erstellen dieses Berichts: `"+sha+"`",
        "- Originalkatalog: **900**, davon **450 ausgewählt (150 je Altersgruppe)** und **450 Reserve**; ursprüngliche IDs beibehalten.",
        "- Im Quiz-Reviewbestand zugeordnete echte V4-MP3s: **"+str(details["uniqueVerifiedQuizMP3s"])+" unterschiedliche MP3-SHAs**, mehrfach wiederverwendet für **"+str(details["reusedSpeechPartAssignments"])+" Frage-/Lob-/Retry-/Erklärungsteile**.",
        "- Technisch vierteilig vollständig: **"+str(details["fourPartAudioQuestions"])+"/450**, noch unvollständig: **"+str(details["missingPartsQuestions"])+"/450**.",
        "- Letzter V4-Kostenaudit: **"+str(cost["uniqueTrulyNewTextFragments"])+
          " neue Sprachfragmente** = **"+str(cost["trulyNewTextCodepoints"])+
          " Unicode-Zeichen**; **0 neue Lob-/Retry-Fragmente**, **0 neue V4-Texte für 4–6 Jahre**.",
        "- Nach Originalkosten getrennt: **"+str(details["onlyAlreadyPaidMP3RecoveryBlockedQuestions"])+ " Fragen nur durch bereits bezahlte MP3s blockiert**, **"+str(details["questionsNeedingNewV4Originals"])+" Fragen benötigen neue V4-Originaltexte**." if priority_current else "- Prioritätsliste nach letztem MP3-Import neu berechnen; ursprüngliche V4-Quellen bleiben geschützt.",
    ]
    for age in ("4-6","7-8","9-10"):
        row=ages[age]
        header.append("- Alter "+age+": **"+str(row["completeFourPartQuestions"])+"/150** komplett; vorhandene Hörteile "+", ".join(k+"="+str(row["availableParts"].get(k,0)) for k in ("question","correct","retry","explanation"))+".")
    header.extend([
        "- Ursprünglich bezahlte ElevenLabs-Flow-Aufnahmen: **56**, davon **"+str(len(prior))+" importiert**, **"+str(count)+" noch ohne heruntergeladene Original-MP3-Datei**.",
        "- Zusätzlich im Originalregister: **"+str(len(saved["textClips"]))+" Textschlüssel**, davon **"+str(len(charged["rows"]))+" direkte bezahlte V4-Ledger-Einträge**; keine doppelten Text- oder Provider-Request-IDs im geprüften Ledger.",
        "- Kosten für den bisherigen Import und diese Berichterstellung: **0 neue ElevenLabs-Sprachcredits**.",
        "- Noch geschätzter Bedarf für alle 450 nach gegenwärtigem Plan: **"+str(plan["estimatedAdditionalCreditsForFullSelected450"])+" Credits**; **keine bestätigte Rechnungsabbuchung** (Ledger enthält Schätzwerte).",
        "- Menschliche Aussprache-/Hörfreigabe: **0**. Freigabeschalter: **aus**. Kein Live-Push und kein Merge.",
        "- Rückimportierte Selbstauskünfte zur Hörprüfung: **"+str(details["selfAttestedHearingClaimCount"])+"**; gemeldete Audiofehler: **"+str(details["reportedHearingIssuesCount"])+"**. Diese Einträge sind noch KEINE unabhängig bestätigte Freigabe.",
        "",
        "Genauer kostenfreier Restplan: `kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md` und `kids/review-only/quiz-v4-450-next-completion-priority.json`.",
        "",
        "## Noch fehlende, **bereits bezahlte** Originalaufnahmen",
        "",
        "Die neun historischen `eleven_v4`-Originale existieren als ElevenLabs-Flow-Assets; der bisherige direkte API-GET ist mit `HTTP 402 paid_plan_required` blockiert. **Nicht neu synthetisieren.**",
        "",
        "Generation-IDs: `"+", ".join(sorted(paid_import["remainingGenerationIds"]))+"`.",
        "",
        "Original-Flow: "+FLOW,
        "",
        "## Gesamte Hörprüfung für 450 Fragen (kostenfrei)",
        "",
        "Der aktuelle Gesamt-Hörprüfungsbau verwendet echte, zuvor gespeicherte MP3-Originale, nach SHA geprüft. Die beiden interaktiven Seiten und ihre Hördateien werden unter `START-HIER.html` zusammengeführt; die menschlichen Freigaben bleiben unerteilt.",
        "",
        "Neuer Build: `python3 kids/tools/build_quiz_v4_all450_master_hearing_review.py`.",
        "GitHub-Workflow: https://github.com/Sero91ak/dar-al-tawhid-site/actions/workflows/kids-v4-all450-master-hearing-package.yml",
        "Privates Actions-Artefakt: `tawhid-kids-v4-all450-human-hearing-offline-bundle`. Niemals ins öffentliche KIDS-Frontend einbauen.",
        "",
        "## Prüfentscheidungen sicher rückimportieren",
        "",
        "Prüfdateien aus dem Offline-Hörpaket werden ausschließlich anhand echter V4-MP3-Prüfsummen, genauer Textzuordnung und korrekter Altersgruppe akzeptiert.",
        "Importer: `python3 kids/tools/import_quiz_v4_human_hearing_reviews.py`.",
        "Internes Ledger: `kids/review-only/quiz-v4-450-human-hearing-submission-ledger.json`.",
        "CI: https://github.com/Sero91ak/dar-al-tawhid-site/actions/workflows/kids-v4-hearing-results-secure-import.yml",
        "Selbstauskünfte bleiben von unabhängigen Audiofreigaben und der öffentlichen Quiz-Freigabe strikt getrennt. Der Importer validiert jedes Mal die REALEN MP3-Bytes gegen SHA-256, weist doppelte JSON-Schlüssel zurück und speichert weder Prüfernamen noch freie Notiztexte im GitHub-Bericht.",
        "",
        "## Kostenplan für fehlende V4-Originale",
        "",
        "Lesen: `kids/review-only/QUIZ-V4-AUDIO-KOSTENCHECK.md`.",
        "Die aktuelle, nicht vom Provider bestätigte 79.075,79-Credit-Prognose und das bisherige Budgetziel 27.860 Credits weichen erheblich ab. Eine reine Kürzung wiederholter Anmoderationen erzielt nach dem ersten nicht-destruktiven Vergleich nur einen Teil der nötigen Reduktion; die 450 Originalfragen und Lerninhalte unverändert erhalten.",
        "Bezahlte V4-Neugenerierungen niemals automatisch anstoßen. Exakte Text-SHA gegen bezahlte Originale und Provider-Abrechnung prüfen.",
        "",
        "## Kürzere Originalsprache für 7–10 Jahre – nur redaktioneller Entwurf",
        "",
        "Neuer kostenfreier Textentwurf: `kids/review-only/QUIZ-V4-SPRECHTEXT-OPTIMIERUNG-ENTWURF.md` und `kids/review-only/quiz-v4-older300-compact-spoken-proposals.json`.",
        "Er umfasst 300 Originalfragen mit identischen Antwortmöglichkeiten und ursprünglichen Erklärungen. Nur redundante Anmoderationen und Schlussfloskeln werden herausgenommen. Es wurden noch KEINE MP3s regeneriert und KEINE Quellen geändert.",
        "Eine prozentuale Einsparung bei der rohen Feldtextlänge ist noch keine gleich hohe bestätigte Credit-Ersparnis; vorhandene V4-Sprachsegmente müssen in jedem Fall wiederverwendet werden.",
        "",
        "## Automatischer V4-MP3-Import nach späteren kostenpflichtigen Originalen",
        "",
        "Die beiden bestehenden, ausdrücklich manuell freizugebenden V4-Produktionsabläufe `.github/workflows/kids-v4-450-paid-batch02.yml` und `.github/workflows/kids-v4-450-paid-batch03.yml` importieren künftig jede gespeicherte neue Aufnahme automatisch in den internen Quizbereich: SHA-Originalprüfung, Offline-Zusammenbau für beide Altersgruppen, vollständiger 450-Fragen-Status, MP3-Frage-IDs und aktualisierte Übergabe – erst danach Speicherung mit Backup. Die öffentliche App wird nicht freigeschaltet.",
        "",
        "Zero-Credit-Sicherheitstest: `kids/tools/test_quiz_v4_paid_postimport_workflows.py`; CI: `.github/workflows/kids-v4-paid-postimport-regression.yml`.",
        "Für die 150 jüngsten Fragen wurde die kostenpflichtige Kampagne repariert: Fehlen keine neuen Texte, beendet sie sich vor Guthabenprüfung und vor jedem ElevenLabs-POST. Stattdessen sind die neun zuvor bezahlten Originale wiederherzustellen.",
        "",
        "## Nächste verbindliche Schritte",
        "",
        "1. Original-MP3-Dateien für die fehlenden Generation-IDs aus der bereits bezahlten ElevenLabs-Erzeugung exportieren; exakt `<generationId>.mp3` benennen. Für fehlende Dateien niemals Ersatz-V4 kostenpflichtig bestellen.",
        "2. Im Reviewzweig über `kids/tools/import_quiz_v4_prepaid_flow_originals.py --zip ORIGINAL_NINE_MP3.zip` oder den vorhandenen GitHub-Workflow `.github/workflows/kids-v4-prepaid-flow-restore.yml` importieren; dabei echte MP3-Daten, Original-ID, Laufzeit, SHA256 und Codec prüfen.",
        "3. Automatisch `kids/tools/quiz_v4_first150_offline_join.py` und `kids/tools/stage_quiz_v4_existing_mp3_import.py` erneut ausführen; neue Zuordnungen in `kids/review-only/quiz-v4-450-actual-mp3-import.json` speichern.",
        "4. Vor jeder weiteren kostenpflichtigen Produktion den kostenfreien Abschlussplan `kids/tools/plan_quiz_v4_finish_without_duplicate_credits.py` erneut erstellen, alle existierenden V4-Texte, 56 alten paid Flow IDs und mindestens 327 direkten kostenpflichtigen Belege mit `kids/tools/test_quiz_v4_no_double_charge_guard.py` abgleichen; Kosten optimieren.",
        "5. Alle vier Audiofelder pro Frage erst technisch und dann mit dem vorhandenen interaktiven Gesamt-Hörpaket (`kids/tools/build_quiz_v4_all450_master_hearing_review.py`) per menschlicher Hörprobe prüfen; arabische Aussprache und korrekte deutsche Inhalte beurteilen; Freigabe bleibt strikt aus.",
        "6. Die 450 ausgewählten Quizfragen in der Kinder-Test-App mit altersabhängiger Darstellung, Offlinebetrieb und stabiler Fortschrittsspeicherung testen. Konflikte mit aktuellem `main` vor jedem Merge beheben; keine Salaf-/Mädchen-Farbänderungen überschreiben.",
        "7. Erst nach erfolgreichem `python3 kids/tools/quiz_v4_selected450_release_gate.py --strict`, Qualitätsprüfung und ausdrücklicher Freigabe live veröffentlichen.",
        "",
        "## Für den nächsten Chat",
        "",
        "„Arbeite selbstständig weiter im GitHub-Repository `Sero91ak/dar-al-tawhid-site`, PR #1143 / Branch `"+BRANCH+"`. Lies `kids/review-only/QUIZ-V4-UEBERGABE-AKTUELL.md`, `kids/review-only/QUIZ-V4-NAECHSTE-SCHRITTE.md` sowie `kids/review-only/quiz-v4-handover-latest.json` und die aktuellen QA-Dateien, bevor du Änderungen machst. Nur Serhat Master `eleven_v4`. Keine doppelt bezahlten MP3s regenerieren, keine neuen Sprachcredits ohne klaren Kostenabgleich. Importiere echte bereits bezahlte MP3s in den Quiz-Reviewbestand; prüfe alle Änderungen; aktualisiere anschließend diese Übergabedateien. Berichte immer den tatsächlichen GitHub-Commit, belegte Tests, Restblocker und Live-Status.“",
        "",
        "_Stand ausschließlich aus JSON-Ledger und V4-Importdaten berechnet. GitHub-CI-Ergebnis und Mergefähigkeit müssen beim nächsten Arbeitsbeginn frisch gelesen werden._",
        ""
    ])
    text="\n".join(header)
    if args.check:
        require(OUT.is_file() and STATE.is_file() and
                OUT.read_text(encoding="utf-8")==text and
                read("kids/review-only/quiz-v4-handover-latest.json")==details,
                "existing handover differs from current reviewed state")
    else:
        OUT.parent.mkdir(parents=True,exist_ok=True)
        OUT.write_text(text,encoding="utf-8")
        STATE.write_text(json.dumps(details,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS_V4_HANDOVER "+json.dumps({
        "commit":sha,"questions":details["selected"],
        "full":details["fourPartAudioQuestions"],
        "mp3s":details["uniqueVerifiedQuizMP3s"],
        "existingAssignments":details["reusedSpeechPartAssignments"],
        "stillMissingPrepaidOriginals":count,
        "masterV4":True,"spentCredits":0,"public":False
    },ensure_ascii=False))
if __name__=="__main__":main()
