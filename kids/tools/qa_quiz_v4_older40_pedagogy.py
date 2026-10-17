#!/usr/bin/env python3
"""Editorial and limited source-evidence review for the first 40 older-age V4 quiz questions.

Does NOT rewrite the canonical 900 question texts or the voice scripts and
does NOT claim that an automated check equals a scholarly source signoff.
It detects specifically reviewed educational wording and tafsir nuances;
suggestions are NON-EXECUTABLE, reviewed before any further paid audio.
Only pre-existing selected question IDs/sources may appear in the report.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "kids/data"
REVIEWS = ROOT / ".github/reports"
STAGES = (
    REVIEWS / "kids-v4-older-age-stage1-exact-voice-preflight.json",
    REVIEWS / "kids-v4-older-age-stage2-exact-voice-preflight.json",
)
OUTPUT = REVIEWS / "kids-v4-older40-editorial-source-findings.json"

# These are exact, deliberately narrow editorial findings. They do NOT
# authorize changed text or synthetic audio. A human reviewer must decide
# whether to change the source, the answer, the instructional text, or none.
FINDINGS = {
    "kids-quiz-034": ("arabic-term", "Wuḍūʾ",
        "Beim ersten Auftreten kurz als rituelle Waschung vor dem Gebet erläutern."),
    "kids-quiz-044": ("fiqh-pedagogy", "Wuḍūʾ",
        "Gesicht/Arme/Füße werden im Vers gewaschen; der Kopf wird überstrichen. Die Unterscheidung kindgerecht erklären."),
    "kids-quiz-026": ("arabic-term", "Dīn",
        "Dīn als Religion bzw. Lebensweise im Islam altersgerecht erklären."),
    "kids-quiz-024": ("arabic-term", "Dīn",
        "Dīn als islamischen Glauben und dessen Lebenspraxis erläutern."),
    "kids-quiz-041": ("arabic-term", "Taqwā",
        "Taqwā bedeutet Allahbewusstsein/Gottesfurcht und pflichtbewusstes Handeln, nicht bloß ein auswendig gelerntes Wort."),
    "kids-quiz-094": ("arabic-term", "Taqwā",
        "Taqwā im Zusammenhang des Fastens mit Alltagssprache erläutern."),
    "kids-quiz-023": ("arabic-term", "Muttaqīn",
        "Muttaqīn als Menschen mit Taqwā/Gottesfürchtige kindgerecht erklären."),
    "kids-quiz-070": ("arabic-term", "Shirk",
        "Shirk als Beigesellung in der Anbetung erläutern; keine Polemik gegen Personengruppen."),
    "kids-quiz-022": ("arabic-term", "Īmān",
        "Īmān als Glaube erklären; den Jüngsten Tag kindgerecht einordnen."),
    "kids-quiz-037": ("arabic-term", "Īmān",
        "Īmān und Allahs Bestimmung (al-Qadar) in einfachen Worten erklären."),
    "kids-quiz-276": ("direct-text-versus-exegesis", "Leise und demütig",
        "Qurʾān 19:3 belegt ausdrücklich den VERBORGENEN/LEISEN Ruf; Demut ist eine erläuternde Tafsīr-Deutung. Deutlich trennen."),
    "kids-quiz-147": ("tafsir-nuance", "Falsches Zeugnis",
        "Qurʾān 25:72 hat unterschiedliche Erklärungstraditionen zu az-zūr. 'Kein falsches Zeugnis' ist eine belegte Deutung, keine erschöpfende Versübersetzung."),

    "kids-quiz-035": ("arabic-term", "Iḥsān",
        "Iḥsān als aufrichtige, bewusste Anbetung Allahs erklären; die Frage verweist auf den Ḥadīṯ Jibrīl."),
    "kids-quiz-036": ("arabic-term", "Ḥaǧǧ",
        "Ḥaǧǧ kindgerecht als Pilgerfahrt nach Makkah erläutern, wenn die fünf Säulen erklärt werden."),
    "kids-quiz-046": ("arabic-term", "Zakāh",
        "Zakāh als vorgeschriebene Abgabe für Berechtigte erklären, nicht mit freiwilliger Ṣadaqah vermengen."),
    "kids-quiz-045": ("arabic-term", "Ramaḍān",
        "Ramaḍān als Monat des verpflichtenden Fastens für diejenigen mit religiöser Pflicht erläutern."),
    "kids-quiz-095": ("arabic-term", "Laylat al-Qadr",
        "Laylat al-Qadr als Nacht der Bestimmung erläutern; 'besser als tausend Monate' bleibt der belegte Versinhalt."),
    "kids-quiz-091": ("arabic-term", "Ṣadaqah",
        "Ṣadaqah als freiwillige gute Gabe erläutern; versehentliche Verletzung anderer durch Vorwürfe besprechen."),
    "kids-quiz-520": ("arabic-term", "Āyat al-Kursī",
        "Āyat al-Kursī als Thronvers (Qurʾān 2:255) erklären; 'Schlummer' und 'Schlaf' als zwei unterschiedliche Begriffe altersgerecht erklären."),
    "kids-quiz-389": ("verse-context", "Leute des Wissens fragen",
        "Den Offenbarungskontext von Qurʾān 16:43 kurz erklären; das Fragen kundiger Personen als pädagogische Anwendung kennzeichnen."),

}
# The following public research pages have actually been inspected. Other
# citations are NOT automatically marked source-verified.
EVIDENCE = {

    "kids-quiz-026": [{
        "source": "islamweb.net · Tafsīr aṭ-Ṭabarī, an-Naḥl 16:43",
        "url": "https://islamweb.net/ar/library/content/50/2903/%D8%A7%D9%84%D9%82%D9%88%D9%84-%D9%81%D9%8A-%D8%AA%D8%A3%D9%88%D9%8A%D9%84-%D9%82%D9%88%D9%84%D9%87-%D8%AA%D8%B9%D8%A7%D9%84%D9%89-%D9%88%D9%85%D8%A7-%D8%A3%D8%B1%D8%B3%D9%84%D9%86%D8%A7-%D9%85%D9%86-%D9%82%D8%A8%D9%84%D9%83-%D8%A5%D9%84%D8%A7-%D8%B1%D8%AC%D8%A7%D9%84%D8%A7-%D9%86%D9%88%D8%AD%D9%8A-%D8%A5%D9%84%D9%8A%D9%87%D9%85-",
        "supports": "Original historical context: earlier messengers and people of prior scripture",
        "scope": "verse wording; wider educational application requires explicit differentiation"
    }],
    "kids-quiz-389": [{
        "source": "islamweb.net · Tafsīr aṭ-Ṭabarī, an-Naḥl 16:43",
        "url": "https://islamweb.net/ar/library/content/50/2903/%D8%A7%D9%84%D9%82%D9%88%D9%84-%D9%81%D9%8A-%D8%AA%D8%A3%D9%88%D9%8A%D9%84-%D9%82%D9%88%D9%84%D9%87-%D8%AA%D8%B9%D8%A7%D9%84%D9%89-%D9%88%D9%85%D8%A7-%D8%A3%D8%B1%D8%B3%D9%84%D9%86%D8%A7-%D9%85%D9%86-%D9%82%D8%A8%D9%84%D9%83-%D8%A5%D9%84%D8%A7-%D8%B1%D8%AC%D8%A7%D9%84%D8%A7-%D9%86%D9%88%D8%AD%D9%8A-%D8%A5%D9%84%D9%8A%D9%87%D9%85-",
        "supports": "Early exegetical context; general question asks a pedagogically derived principle",
        "scope": "verse wording not literal all-context universalization"
    }],
    "kids-quiz-035": [{
        "source": "dorar.net · Ṣaḥīḥ Muslim 8, Ḥadīṯ Jibrīl",
        "url": "https://dorar.net/hadith/sharh/63778",
        "supports": "Iḥsān: worship Allah as though seeing Him, knowing He sees you",
        "scope": "specific authentic hadith wording"
    }],
    "kids-quiz-036": [{
        "source": "dorar.net · Ṣaḥīḥ al-Bukhārī 8; Muslim 16",
        "url": "https://dorar.net/hadith/sharh/8211",
        "supports": "Five pillars of Islam including prayer, charity, pilgrimage and Ramadan fasting",
        "scope": "specific authentic hadith and traditional enumeration"
    }],
    "kids-quiz-044": [{
        "source": "islamweb.net · Tafsīr aṭ-Ṭabarī, al-Māʾidah 5:6",
        "url": "https://www.islamweb.net/ar/library/content/50/1508/%D8%A7%D9%84%D9%82%D9%88%D9%84-%D9%81%D9%8A-%D8%AA%D8%A3%D9%88%D9%8A%D9%84-%D9%82%D9%88%D9%84%D9%87-%D8%AA%D8%B9%D8%A7%D9%84%D9%89-%D9%88%D8%A3%D8%B1%D8%AC%D9%84%D9%83%D9%85-%D8%A5%D9%84%D9%89-%D8%A7%D9%84%D9%83%D8%B9%D8%A8%D9%8A%D9%86",
        "supports": "Ritual washing of feet contrasted with wiping the head in the Wuḍūʾ verse",
        "scope": "specific excerpt and relevant fiqh interpretation"
    }],
    "kids-quiz-027": [
        {
            "source": "dorar.net · Ṣaḥīḥ al-Bukhārī 6018; Muslim 47",
            "url": "https://dorar.net/h/HXe5YKJL?osoul=1",
            "supports": "Speak good or remain silent; source numbering also checked",
            "scope": "specific supporting hadith segment",
        }
    ],
    "kids-quiz-028": [
        {
            "source": "dorar.net · Ṣaḥīḥ al-Bukhārī 6018; Muslim 47",
            "url": "https://dorar.net/h/HXe5YKJL?osoul=1",
            "supports": "Do not harm the neighbor; source numbering also checked",
            "scope": "specific supporting hadith segment",
        }
    ],
    "kids-quiz-037": [
        {
            "source": "dorar.net · Ṣaḥīḥ Muslim 8, Ḥadīṯ Jibrīl",
            "url": "https://dorar.net/hadith/sharh/63778",
            "supports": "Belief in divine decree is a component of Īmān",
            "scope": "specific supporting hadith segment",
        }
    ],
    "kids-quiz-276": [
        {
            "source": "islamweb.net · Tafsīr Ibn Kaṯīr, Maryam 19:3",
            "url": "https://www.islamweb.net/ar/library/content/49/1098/%D8%AA%D9%81%D8%B3%D9%8A%D8%B1-%D8%B3%D9%88%D8%B1%D8%A9-%D9%85%D8%B1%D9%8A%D9%85",
            "supports": "His invocation was hidden/quiet; humility is interpretative, not exact Arabic wording",
            "scope": "verse wording and its interpretation",
        }
    ],
    "kids-quiz-147": [
        {
            "source": "islamweb.net · Tafsīr al-Qurṭubī, al-Furqān 25:72",
            "url": "https://www.islamweb.net/ar/library/content/48/2555/%D9%82%D9%88%D9%84%D9%87-%D8%AA%D8%B9%D8%A7%D9%84%D9%89-%D9%88%D8%A7%D9%84%D8%B0%D9%8A%D9%86-%D9%84%D8%A7-%D9%8A%D8%B4%D9%87%D8%AF%D9%88%D9%86-%D8%A7%D9%84%D8%B2%D9%88%D8%B1-%D9%88%D8%A5%D8%B0%D8%A7-%D9%85%D8%B1%D9%88%D8%A7-%D8%A8%D8%A7%D9%84%D9%84%D8%BA%D9%88-%D9%85%D8%B1%D9%88%D8%A7-%D9%83%D8%B1%D8%A7%D9%85%D8%A7",
            "supports": "False testimony is a supported exegetical interpretation",
            "scope": "a supported interpretation, not exclusive meaning",
        }
    ],
    "kids-quiz-050": [
        {
            "source": "islamweb.net · Tafsīr aṭ-Ṭabarī, al-Ḥujurāt 49:9",
            "url": "https://www.islamweb.net/ar/library/content/50/4581/%D8%A7%D9%84%D9%82%D9%88%D9%84-%D9%81%D9%8A-%D8%AA%D8%A3%D9%88%D9%8A%D9%84-%D9%82%D9%88%D9%84%D9%87-%D8%AA%D8%B9%D8%A7%D9%84%D9%89-%D9%88%D8%A5%D9%86-%D8%B7%D8%A7%D8%A6%D9%81%D8%AA%D8%A7%D9%86-%D9%85%D9%86-%D8%A7%D9%84%D9%85%D8%A4%D9%85%D9%86%D9%8A%D9%86-%D8%A7%D9%82%D8%AA%D8%AA%D9%84%D9%88%D8%A7-%D9%81%D8%A3%D8%B5%D9%84%D8%AD%D9%88%D8%A7-%D8%A8%D9%8A%D9%86%D9%87%D9%85%D8%A7",
            "supports": "Reconciliation among believers",
            "scope": "verse wording and interpretation",
        }
    ],
}


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def demand(ok, message):
    if not ok:
        raise RuntimeError("KIDS V4 40 EDITORIAL QA: " + message)


def main():
    staged = [load(path) for path in STAGES]
    original = load(DATA / "quiz-kids.json")
    selected = load(DATA / "quiz-kids-curated-450-review.json")
    reserved = load(DATA / "quiz-kids-expansion-reserve-450.json")
    release = load(DATA / "quiz-curation-release.json")
    demand(release["enabled"] is False, "public quiz unexpectedly enabled")
    C = {q["id"]: q for q in original["items"]}
    S = {q["id"]: q for q in selected["items"]}
    R = {q["id"]: q for q in reserved["items"]}
    demand((len(C), len(S), len(R)) == (900, 450, 450)
           and not (set(S) & set(R)) and set(S) | set(R) == set(C),
           "Original 900/450+450 age data missing")
    demand(all(C[k] == v for k, v in S.items())
           and all(C[k] == v for k, v in R.items()),
           "Original question wordings were mutated")
    rows = [q for st in staged for q in st["questions"]]
    ids = {q["questionId"] for q in rows}
    demand(len(rows) == len(ids) == 40, "Expected 40 unique priority questions")
    demand(set(FINDINGS) <= ids and set(EVIDENCE) <= ids,
           "Editorial findings/evidence refer to outside question IDs")
    findings = []
    summaries = Counter()
    for st in staged:
        demand(st.get("published") is False and
               st.get("voiceGenerationAuthorized") is False and
               st.get("newCreditsSpent") == 0, "Only unpaid review stages allowed")
        for q in st["questions"]:
            qid = q["questionId"]
            demand(qid in S, "A question is not in the curated 450")
            saved = S[qid]
            demand(saved["question"] == q["originalQuestion"]
                   and saved["source"] == q["originalSource"],
                   "Editorial review no longer matches canonical question/source")
            demand([x["label"] for x in saved["answers"]] == q["answers"]
                   and sum(x["correct"] is True for x in saved["answers"]) == 1
                   and q["correctAnswer"] == next(x["label"] for x in saved["answers"]
                                                  if x["correct"] is True),
                   "Incorrect answer key in source review")
            finding = FINDINGS.get(qid)
            citations = EVIDENCE.get(qid) or []
            for evidence in citations:
                demand(evidence["url"].startswith((
                    "https://dorar.net/", "https://www.islamweb.net/",
                    "https://islamweb.net/", "https://gcp.islamweb.net/")),
                    "Unexpected evidence provider")
            source_status = ("specific-reference-externally-spotchecked"
                             if citations else "awaiting-individual-source-verification")
            flags = []
            if finding:
                classification, marker, recommendation = finding
                demand(marker in q["originalQuestion"] + " " + q["spokenQuestion"] +
                       " " + q["explanation"] + " " + q["correctAnswer"] +
                       " " + " ".join(q["answers"]),
                       "Issue marker no longer occurs in " + qid)
                flags.append({
                    "category": classification,
                    "sourceTextPreserved": True,
                    "identifiedTermOrPhrase": marker,
                    "reviewSuggestion": recommendation,
                    "requiresHumanDecisionBeforeNewPaidVoice": True,
                })
                summaries[classification] += 1
            findings.append({
                "questionId": qid,
                "ageBand": q["ageBand"],
                "originalQuestionSha256": sha(q["originalQuestion"]),
                "sourceReference": q["originalSource"],
                "spokenQuestionSha256": sha(q["spokenQuestion"]),
                "originalExplanationSha256": sha(q["explanation"]),
                "sourceEvidenceStatus": source_status,
                "sourceSpotcheckEvidence": citations,
                "editorialFlags": flags,
                "pedagogicalContentApproved": False,
                "scientificSourceVerificationComplete": False,
                "reviewerApprovedNewSpeechGeneration": False,
                "oldVoiceClipsUnaffected": True,
            })
    count_spotchecked = sum(bool(q["sourceSpotcheckEvidence"]) for q in findings)
    flagged = sum(bool(q["editorialFlags"]) for q in findings)
    demand(count_spotchecked == len(EVIDENCE) and flagged == len(FINDINGS),
           "Source coverage or flagged items unexpectedly altered")
    report = {
        "schemaVersion": 1,
        "app": "TAWḤĪD KIDS",
        "scope": "PRIVATE_40_SELECTED_V4_EDITORIAL_AND_PARTIAL_SOURCE_SPOTCHECK",
        "reviewOnly": True, "publicQuizChanged": False,
        "elevenLabsCreditsSpent": 0, "paidVoiceGenerationAuthorized": False,
        "allSourcesVerified": False,
        "humanSourceSignoffGranted": False,
        "quizQuestionsInspected": len(findings),
        "sourceReferencesExternallySpotchecked": count_spotchecked,
        "remainingQuestionReferencesNeedingIndividualVerification":
            len(findings) - count_spotchecked,
        "questionsWithEditorialFlags": flagged,
        "editorialFlagCategories": dict(summaries),
        "findings": findings,
        "nextAction": "Scholarly/editorial review and controlled rebaseline before any new V4 recording",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("PASS_KIDS_V4_OLDER40_REVIEW_SOURCE_SCREEN " + json.dumps({
        "questions": len(findings),
        "partiallyCheckedSourceReferences": count_spotchecked,
        "awaitingIndividualSourceEvidence": len(findings) - count_spotchecked,
        "editorialFlags": flagged,
        "paidCredits": 0,
        "liveAppChanged": False,
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
