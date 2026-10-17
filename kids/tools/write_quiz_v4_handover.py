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
    stage1_report_file=ROOT/"kids/review-only/quiz-v4-older-stage1-next-recording-batch.json"
    stage1_report=read("kids/review-only/quiz-v4-older-stage1-next-recording-batch.json") if stage1_report_file.is_file() else None
    if stage1_report is not None:
        require(stage1_report["modelId"]==MODEL and stage1_report["voiceId"]==VOICE
                and stage1_report["questionCount"]==20
                and stage1_report["stageExpectedNewOriginals"]==65
                and stage1_report["paidSynthesisAuthorizedByAudit"] is False
                and stage1_report["publicReleaseAllowed"] is False,
                "first older V4 stage must remain an unpaid exact-original queue")
    stage_source_path=ROOT/".github/reports/kids-v4-older-stage1-source-and-answer-audit.json"
    stage_source=read(".github/reports/kids-v4-older-stage1-source-and-answer-audit.json") if stage_source_path.is_file() else None
    if stage_source is not None:
        require(stage_source["modelId"]==MODEL and stage_source["voiceId"]==VOICE
                and stage_source["totalQuestions"]==20
                and stage_source["exactNewSourceTexts"]==65
                and stage_source["humanSourceApprovalGranted"] is False
                and stage_source["humanPronunciationApprovalGranted"] is False
                and stage_source["publicReleaseAllowed"] is False,
                "source/answer audit cannot authorize recording or audio release")
    archived=ROOT/"kids/review-only/quiz-v4-nine-originals-github-archive-recovery.json"
    archive=read("kids/review-only/quiz-v4-nine-originals-github-archive-recovery.json") if archived.is_file() else None
    if archive is not None:
        require(archive["modelId"]==MODEL
                and archive["masterVoiceId"]==VOICE
                and archive["newElevenLabsCreditsSpent"]==0
                and archive["elevenLabsSpeechSynthesisCalls"]==0
                and archive["publicReleaseAllowed"] is False,
                "historical backup search must never generate or publish V4 speech")
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
    # Fail closed on an outdated staged audio map: after a paid original import,
    # the technical production report may already have 76 while this JSON
    # still has 72. Handover must not overwrite real progress with old counts.
    require(plan["completedQuestionsWithAllFourAudioParts"]==
            import_status["completeFourPartQuestions"],
            "stale MP3 stage import: production coverage disagrees with 450-question map; regenerate offline staging first")
    for age in ("4-6","7-8","9-10"):
        require(plan["ageBreakdown"][age]["completeAllFourOriginalAudios"]==
                import_status["byAge"][age]["completeFourPartQuestions"],
                "outdated audio import map for "+age+"; do not publish a stale handover")
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
        "olderStage1OriginalsStillMissing":stage1_report["remainingFirstStageOriginals"] if stage1_report else None,
        "olderStage1NextExactOriginalCount":len(stage1_report["nextExactTextSha256"]) if stage1_report else None,
        "olderStage1NextEstimatedCredits":stage1_report["nextEstimatedCreditsNotProviderBill"] if stage1_report else None,
        "olderStage1NextExactBatchFingerprintSHA256":stage1_report.get("manualApprovalMustMatchExactBatchFingerprintSHA256") if stage1_report else None,
        "olderStage1RequiresFreshCanonicalSourceAudit":True,
        "olderStage1RequiresExactBatchFingerprintForPaidRun":True,
        "olderStage1CostForecastUnconfirmed":True,
        "olderStage1RealPaidOriginalIntegrityAudit":"kids/tools/audit_quiz_v4_stage1_paid_audio_integrity.py",
        "olderStage1RealPaidOriginalIntegrityWorkflow":".github/workflows/kids-v4-stage1-paid-original-integrity.yml",
        "olderStage1InternalSourceAnswerAuditItems":stage_source["totalQuestions"] if stage_source else 0,
        "olderStage1IndependentSourceEvidenceLocated":stage_source["independentExternalEvidenceLocatedFor"] if stage_source else 0,
        "olderStage1HumanScholarlySourceApproval":False,
        "historicalOriginalBackupArchivesExamined":archive["eligibleArchivesExamined"] if archive else 0,
        "historicalOriginalBackupMatchesRestored":archive["newOriginalsImported"] if archive else 0,
        "historicalOriginalArchiveSearchExhaustive":False,
        "historicalOriginalArchiveSamplingMethod":archive.get("samplingMethod","previous newest-first search, now obsolete") if archive else None,
        "historicalOriginalArchivePerNameExamined":archive.get("perNameArchivesExamined",{}) if archive else {},
        "historicalOriginalFlowExportChecklist":"kids/review-only/QUIZ-V4-LETZTE9-ORIGINALE-EXPORT.md",
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
        "- WICHTIG: Bei den 450 ausgewählten Originalfragen sind `reviewStatus=approved` und `verification=approved` bereits dokumentiert. Keinen neuen pauschalen Inhaltsprüfungsdurchgang anstoßen; Arbeitsziel bleibt die echte MP3-Audiofertigstellung und separate Hörprüfung.",
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
        "Alle neun vorhandenen Audioelemente sind im Original-Flow eindeutigen Generation-IDs zugeordnet. Exakte Originaldateinamen und sichere Wiederherstellung: `kids/review-only/QUIZ-V4-LETZTE9-ORIGINALE-EXPORT.md`.",
        "Frühere GitHub-Backup-Archive bereits gescannt: **"+str(details["historicalOriginalBackupArchivesExamined"])+"** echte ZIP-Archive, darunter **"+str(details["historicalOriginalBackupMatchesRestored"])+"** neu wiederhergestellte Generationen. Das ist eine begrenzte, NICHT vollständige Bestandsprüfung. Die erweiterte Suche berücksichtigt zusätzliche Archive/Dateinamen und braucht einen neuen belegten Actions-Lauf.",

        "",
        "## Zusätzliche kostenfreie Suche in historischen GitHub-Audioarchiven",
        "",
        "Die ursprünglichen neun bereits bezahlten MP3-Dateien waren über ElevenLabs-GET wiederholt blockiert (Flow-GET 402, alternativ History-GET 400). Der erfolgreiche GitHub-Wiederherstellungslauf https://github.com/Sero91ak/dar-al-tawhid-site/actions/runs/39007730585 speicherte nur die 47 bereits vorhandenen Originalaufnahmen und meldete ausdrücklich 0 neue Originale. Dies NICHT als 9/9-Wiederherstellung ausgeben.",
        "Zusätzliche read-only/ohne ElevenLabs-TTS implementierte Archivsuche: `kids/tools/recover_quiz_v4_nine_from_github_action_archives.py`; CI `.github/workflows/kids-v4-scan-previous-paid-audio-backups.yml`. Sie untersucht streng begrenzte historische GitHub-Audio-Backup-Artefakte auf die exakten neun Generation-IDs und importiert nur wirklich gefundene MP3-Originalbytes unter der bereits geltenden MP3/ID/Laufzeit-/SHA-Kontrolle.",
        "Wichtigster Scanner-Fix: Die alte Suchrunde verbrauchte 297 MB für 48 ZIP-Archive, ohne auf alle benannten alten Backupfamilien zuzugreifen. Die neue Stichprobe verteilt höchstens sechs Archive je Backup-Namen über junge, mittlere und alte Zeitpunkte. Nur tatsächliche MP3-Originalbytes ändern den Wiederherstellungsstatus; vor einem neuen grünen CI-Lauf keine neun Originale als gefunden ausgeben.",
        "Wichtig: Erst den fertigen Laufbericht `kids/review-only/quiz-v4-nine-originals-github-archive-recovery.json` und den echten Audio-Status lesen. Ein laufender oder erfolgreich beendeter GitHub-Workflow beweist allein noch keine neue Originaldatei. Ist nichts gefunden, keine Sprachcredits erneut kaufen: ausschließlich echten Originalexport aus dem ElevenLabs-Flow besorgen.",
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
        "## ZIP-Importblocker behoben – echter Quellbestand weiterhin unverändert",
        "",
        "Im GitHub-Workflow `.github/workflows/kids-v4-prepaid-flow-restore.yml` sind zwei konkrete Fehler beseitigt: Der synthetische MP3-Regressions-Test gleicht die tatsächliche Kennzeichnung importierter Originale ab, ohne die Testdatei als echte bezahlte Sprachaufnahme zu bezeichnen; ein fehlerhaft eingerücktes Shell-Heredoc wurde durch das Prüfskript `kids/tools/assert_quiz_v4_prepaid_postimport.py` ersetzt. Zusätzlich prüft der Test die Shell-Syntax über `bash -n`. GitHub-Actions-Importtest #39017154136: erfolgreich.",
        "Es wurden durch den Test KEINE neuen Original-MP3s importiert; die fehlenden 9 historischen Dateien sind über bestehende GET-Routen bislang mit HTTP 402 (`paid_plan_required`) bzw. HTTP 400 blockiert. Der Flow enthält ihre Generation-IDs, jedoch keine herunterladbare MP3-URL. Nur echten MP3-Export importieren, niemals synthetische Testaufnahmen übernehmen.",
        "",
        "## Kostenfreie Wiederherstellung der neun historischen V4-Originale – drei Wege",
        "",
        "Drei bestehende Importwege sind für die vollständige automatische Quiz-Weiterverarbeitung abgesichert: ZIP-Import über `.github/workflows/kids-v4-prepaid-flow-restore.yml`, verschlüsselter Original-Link-Import über `.github/workflows/kids-v4-secure-original-import.yml` und reiner GET-Import über `.github/workflows/kids-v4-last9-paid-free-get.yml`.",
        "Nach einem ECHTEN Originalimport werden SHA-/Codecprüfung, Quiz-MP3-Zusammenbau für beide Altersbereiche, Fortschrittsdateien für 450 Fragen, Frage-ID-Staging und diese Übergabe automatisch aktualisiert. Sind alle 56 Originale vorhanden, muss die technische 4–6-Abdeckung auf exakt 150/150 steigen. Das ist noch keine menschliche Hörfreigabe.",
        "Null-Credit-Regressionsprüfung: `kids/tools/test_quiz_v4_prepaid_end_to_end_wiring.py` via `.github/workflows/kids-v4-prepaid-endtoend-qa.yml`. Bei bisheriger Provider-Antwort HTTP 402 sind die Originalbytes weiterhin NICHT heruntergeladen; kein erneuter Kauf.",
        "Zusätzlicher offizieller Null-Credit-Wiederherstellungsversuch seit 17.10.2026: `kids/tools/recover_quiz_v4_missing9_get_only.py` durchsucht nun GET `/v1/history` mit Filter `source=Flows`, `voice_id` und `model_id=eleven_v4` nach den **genau neun historisch bezahlten Texten**. Das berücksichtigt, dass ElevenLabs-Flow-generation_id NICHT zwangsläufig history_item_id ist. Die Suche bleibt auf 5 × 100 Verlaufseinträge begrenzt; keine erneute Sprachgenerierung.",
        "WICHTIG: Gleicher Text allein ist KEIN Beweis derselben alten Aufnahme. Ein Original darf nur importiert werden, wenn ein eindeutiger Treffer zusätzlich per History-ID oder Request-ID nachweislich mit der ursprünglichen Generation-ID verknüpft ist. Doppelte oder unverbundene Treffer bleiben ungeklärt und dürfen NICHT als alte Originale etikettiert werden.",
        "Offline-Sicherheitstest: `kids/tools/test_quiz_v4_flow_history_discovery.py` (richtige ID, Mehrdeutigkeit, falsche Stimme, 402, Pagination). Der ausführende GET-only-Workflow `.github/workflows/kids-v4-last9-paid-free-get.yml` startet nach GitHub-Actions-Freigabe. Erst danach aus dem importierten MP3-SHA und dem Statusbericht ablesen, ob tatsächlich eine Datei zurückkam.",

        "",
        "## Erster exakt gebundener V4-Auftrag für 7–10 Jahre",
        "",
        "Aus den 450 ausgewählten Fragen sind **20 ältere Quizfragen (10 × 7–8 und 10 × 9–10)** als erste Produktionsstufe festgelegt. Dafür sind **65 eindeutig neue Original-V4-Sprachbausteine (1.842 Zeichen)** vorbereitet. Neue Abrechnung erst nach Prüfung der Originalquellen und einer getrennten ausdrücklichen Zustimmung zu Sprachcredits.",
        "",
        "Der ausführbare, fortsetzbare Kostengenerator `kids/tools/generate_quiz_v4_older_stage1_exact.py` benutzt ausschließlich die 65 unveränderlichen Sprachtext-Prüfsummen dieser Stufe. `--audit` kostet 0 Credits; `--produce` erfordert zwei bestätigte Freigaben und begrenzt jede Ausführung auf höchstens zehn Original-MP3s und höchstens 850 prognostizierte Credits. Quelle der unveränderten Texte: `.github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json`.",
        "Manuelle Produktions-Pipeline: `.github/workflows/kids-v4-older-stage1-exact-paid.yml`. Kostenfreier CI-Vortest: `.github/workflows/kids-v4-older-stage1-exact-audit.yml`. Sie speichert Originale mit Ledger/Backups sowie die danach neu zusammengesetzten privaten Quiz-Hördateien. Kein Live-Deploy.",
        "Letzte gespeicherte 65er-Restzahl: **"+(str(details["olderStage1OriginalsStillMissing"]) if stage1_report else "noch nicht als Bericht erzeugt")+"**; nächste wartende Originale: **"+(str(details["olderStage1NextExactOriginalCount"]) if stage1_report else "nach kostenfreiem Audit")+"**; reine Kostenschätzung dafür: **"+(str(details["olderStage1NextEstimatedCredits"]) if stage1_report else "offen")+"** Credits. Keine neue MP3 als erzeugt behaupten, bevor das Ledger/MP3-Hash dies beweist.",
        "",
        "## Nachweis der tatsächlich gespeicherten bezahlten V4-Original-MP3s",
        "",
        "Null-Credit-Prüfskript: `python3 kids/tools/audit_quiz_v4_stage1_paid_audio_integrity.py --report` und Workflow `.github/workflows/kids-v4-stage1-paid-original-integrity.yml`. Prüft jede im ersten älteren Batch bereits bezahlte V4-Original-MP3 **byteweise gegen SHA-256**, Text-/Modell-/Voice-ID sowie die beiden Kopien des Request-Journals und das Zahlungsledger. Erzeugt keine Stimme, bewirkt keine menschliche Audiofreigabe und keinen Live-Deploy.",
        "Zusätzlich ruft der etablierte Null-Credit-Regressionstest `kids/tools/test_quiz_v4_older_stage1_exact.py` dieselbe echte Byteprüfung auf. Ein automatischer CI-Bericht ist nur dann als bestanden zu betrachten, wenn GitHub den Job tatsächlich ausgeführt und mit `success` beendet hat; `action_required` gilt NICHT als bestandener Test.",
        "Nach der ersten realen 10er-Aufnahme sind zehn kostenpflichtige Anbieter-Request-IDs im Originalledger dokumentiert; dadurch wurden vier weitere Quizfragen technisch vollständig vertont. Vor endgültiger Hörkontrolle besteht weiterhin keine Live-Freigabe. Der Vergleich mit der tatsächlichen ElevenLabs-Credit-Abrechnung bleibt offen.",
        "",
        "## Interne Quellen-/Antwortprüfung vor kostenpflichtiger V4-Aufnahme",
        "",
        "Interne Quelle-Antwort-Prüfung: `.github/reports/KIDS-V4-STAGE1-QUELLEN-UND-ANTWORTCHECK.md` und `.github/reports/kids-v4-older-stage1-source-and-answer-audit.json`. Nur im privaten GitHub-Review; keine Internet-Quellenlinks in der Kinder-App.",
        "Neu: 20-Fragen-Direktquellenliste mit zugehörigen Originalfragen, exakt richtiger Antwort und fachlichen Kontext-Hinweisen: `kids/review-only/QUIZ-V4-ERST20-QUELLEN-DIREKTNACHWEISE.md` (nur internes Review). Sie dokumentiert 20 passende Islamweb-/Dorar-Nachweise, bedeutet aber KEINE unabhängige menschliche Quellenfreigabe.",
        "Automatisch überprüfte ursprüngliche 20 Frage-Antwort-Quellen-Zuordnungen: **"+str(details["olderStage1InternalSourceAnswerAuditItems"])+"**. Zusätzlich öffentlich lokalisierte passende Belegstellen für **"+str(details["olderStage1IndependentSourceEvidenceLocated"])+"** Fragen; übrige benötigen eine zusätzliche unabhängige Quellenkontrolle. Nicht mit menschlicher theologischer/fachlicher Abnahme verwechseln.",
        "Präzisionshinweise besonders zu Qurʾān 16:43 (Kontext vs. pädagogische Anwendung), Qurʾān 5:6 (Waschen vs. Wischen) und Hadithnummern verschiedener Ausgaben beachten.",
        "Nur nach wirklicher inhaltlicher und finanzieller Freigabe neue V4-Stimmenaufnahmen erzeugen, nie die Original-MP3s überschreiben.",
        "Aktuelle zusätzliche Schutzregel: Der V4-Quellenprüfer muss auch nach bereits gespeicherten Teil-Batches mit 55, 45 usw. fehlenden Originalen erneut bestehen. Die kostenpflichtige Stufe berechnet dafür jedes Mal einen SHA-256-Fingerabdruck aus Originalquelle, gespeicherten MP3-Zuordnungen, vorherigen Kostenbelegen und den nächsten genauen Sprechtext-SHAs.",
        "Nur wenn der ausdrücklich bestätigte Batch-Fingerabdruck exakt zur neu geprüften Quelle und zum aktuellen Ledger passt, darf der Produktionscode überhaupt eine Anfrage an ElevenLabs senden. Bei Abweichung: STOP vor Provider-GET oder TTS-POST; keine stillschweigende Kreditfreigabe.",
        "Zusätzliche Absicherung: unmittelbar VOR jedem potenziell kostenpflichtigen POST schreibt der Generator einen als UNBESTÄTIGT markierten SHA-/Batch-Eintrag in `kids/data/quiz-v4-older-stage1-request-journal.json` und spiegelt ihn in `kids/data/quiz-v4-older-stage1-usage.json`. Die Usage-Datei ist bereits Teil des GitHub-Actions-Backups mit `if: always()`. Nach erhaltenen originalen MP3-Bytes werden Ledger und Originalregister atomar gespeichert; eine unsichere frühere Abrechnung oder unterbrochene Anfrage verbietet jede erneute Generierung derselben Sprachaufnahme, bis die Originaldatei/Provider-Abbuchung geklärt wurde.",

        "Aktuell im Reviewprotokoll vorhandener Fingerabdruck: `"+(str(details["olderStage1NextExactBatchFingerprintSHA256"]) if stage1_report else "nach letztem Null-Credit-Audit erzeugen")+"`. Nach jeder MP3-Ergänzung erneut berechnen.",

        "",
        "## Sicherer echter V4-Originalabruf und Kostenschutz bei Unterbrechung",
        "",
        "Beim nächsten *ausdrücklich bezahlten* 7–10-Jahre-Originalbatch wird vor jedem ElevenLabs-POST der SHA256 des genauen gesprochenen Textes in ein Write-Ahead-Protokoll geschrieben. Ein HTTP-Fehler, Zeitablauf oder Abbruch nach einer möglicherweise abgerechneten Anfrage führt nicht zu einem automatischen zweiten Kauf. Stattdessen zuerst über Provider-Beleg bzw. echte Original-MP3-Datei abgleichen.",
        "Die aktuelle Sicherung verwendet `kids/data/quiz-v4-older-stage1-request-journal.json` und eine **identische Kopie** unter `requestJournal` in `kids/data/quiz-v4-older-stage1-usage.json`. Die bestehende GitHub-Actions-Backup-Regel erfasst bereits die Usage-Datei auch bei Fehlern. Wird die lokale Journaldatei vermisst, kann die Backup-Kopie vor jedem weiteren POST eine unklare Vorbelastung nachweisen.",
        "Der Null-Credit-Regressionscode `kids/tools/test_quiz_v4_older_stage1_exact.py` testet genau den Fall einer simulierten unklaren früheren Anfrage ohne synthetische MP3 und erwartet einen Stop mit `NEVER REBUY`. Sicherung im GitHub-Artefakt ist nicht dasselbe wie ein erfolgreich auf GitHub veröffentlichter Original-MP3-Commit: Bei Runner-Abbruch Recovery-Artefakt zuerst inspizieren und in den Reviewzweig zurückimportieren.",
        "Letzter offener Gratis-GET-Versuch bestätigt neun verbliebene, vorher bezahlte V4-IDs mit `flowGetHTTP=402` und `historyAudioHTTP=400`, **0 authentische neue MP3s importiert**. Der API-GET verlangt zuerst die Freigabe des Originalexports; die bisherigen Sprachcredits dürfen nicht noch einmal ausgegeben werden.",
        "",
        "## Originale aus fehlgeschlagenen bezahlten GitHub-Actions-Läufen retten",
        "",
        "GitHub-Actions lädt bei der exakt begrenzten 7–10-Jahre-V4-10er-Aufnahmerunde unter `tawhid-kids-v4-older-stage1-exact-prepaid-safekeeping` einen ZIP-Backupstand hoch – auch wenn der nachgelagerte MP3-Zusammenbau oder GitHub-Push scheitert. Echte zuvor abgebuchte Originale und die Sperrvermerke NIEMALS neu kaufen.",
        "Neuer **rein lokaler, kostenfreier und ausschließlich privater** Original-Recovery-Importer: `python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip ARTIFACT.zip` (Prüfung ohne Änderungen); nach bestandenem SHA-/Originalledger-/Audio-Prüfbericht `python3 kids/tools/restore_quiz_v4_stage1_paid_run_backup.py --zip ARTIFACT.zip --import` (nur in diesem Reviewcheckout).",
        "Der Import akzeptiert sowohl von GitHub Actions verkürzte ZIP-Pfade als auch vollständige Projektpfade und verweigert manipulierte Alte-Aufnahmen, fehlende echte MP3-Bytes, abweichende Kostenbelege und Pfadmanipulation. Nur nach bestandenem Import Audio-Neuzusammenbau und Statusaktualisierung ausführen; niemals automatisch Live veröffentlichen.",
        "Besonders wichtig: Ein abgebrochener Provider-Aufruf mit unklarem Abrechnungsergebnis bleibt als `REQUEST_STARTED_UNCONFIRMED` erhalten, selbst wenn die MP3-Datei fehlt. Vor jeder weiteren bezahlten V4-Anfrage zwingend zuerst Ledger und Originalexport abgleichen.",
        "Kostenloser Negativtest: `kids/tools/test_quiz_v4_stage1_paid_backup_restore.py` und `.github/workflows/kids-v4-stage1-paid-backup-restore-qa.yml`; der Test erzeugt selbst KEINE Audioaufnahme und kann keine Credits abbuchen.",
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
