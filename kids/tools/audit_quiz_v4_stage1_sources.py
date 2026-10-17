#!/usr/bin/env python3
"""Strict zero-credit editorial/source preflight for first 20 older quiz items.

This is NOT a scholarly or human signoff. Preserve all canonical questions,
answer keys, citations and already charged voice originals unchanged.
Cite only independently located source references in this PRIVATE audit;
never inject external source links into the children's public application.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[2]
STAGE=ROOT/".github/reports/kids-v4-older-age-stage1-exact-voice-preflight.json"
NEXT=ROOT/"kids/review-only/quiz-v4-older-stage1-next-recording-batch.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
OUT=ROOT/".github/reports/kids-v4-older-stage1-source-and-answer-audit.json"
MD=ROOT/".github/reports/KIDS-V4-STAGE1-QUELLEN-UND-ANTWORTCHECK.md"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")
SOURCES={
    "kids-quiz-034":"Qurʾān 5:6",
    "kids-quiz-026":"Qurʾān 16:43",
    "kids-quiz-033":"Qurʾān 49:12",
    "kids-quiz-031":"Qurʾān 3:134",
    "kids-quiz-050":"Qurʾān 49:9–10",
    "kids-quiz-048":"Qurʾān 24:27",
    "kids-quiz-045":"Qurʾān 2:183–185",
    "kids-quiz-389":"Qurʾān 16:43",
    "kids-quiz-022":"Ṣaḥīḥ Muslim 8",
    "kids-quiz-043":"Qurʾān 2:238",
    "kids-quiz-041":"Qurʾān 49:13",
    "kids-quiz-046":"Qurʾān 2:43",
    "kids-quiz-520":"Qurʾān 2:255",
    "kids-quiz-044":"Qurʾān 5:6",
    "kids-quiz-025":"Qurʾān 33:21",
    "kids-quiz-023":"Qurʾān 2:2",
    "kids-quiz-032":"Qurʾān 49:10",
    "kids-quiz-080":"Qurʾān 49:11",
    "kids-quiz-087":"Qurʾān 72:18",
    "kids-quiz-036":"Ṣaḥīḥ al-Bukhārī 8; Ṣaḥīḥ Muslim 16",
}
# Independently located references (not a certification of EVERY source).
EVIDENCE={
    "kids-quiz-034":{
        "url":"https://www.islamweb.net/ar/article/220252/",
        "assessment":"5:6 explicitly includes washing the face in ablution"},
    "kids-quiz-044":{
        "url":"https://www.islamweb.net/ar/library/content/202/310/",
        "assessment":"5:6 mentions face, arms, head and feet; washing versus wiping must not be conflated"},
    "kids-quiz-026":{
        "url":"https://www.islamweb.net/ar/library/content/50/2903/",
        "assessment":"Al-Tabari on Quran 16:43: original context is asking about previous human messengers, not every later legal question"},
    "kids-quiz-389":{
        "url":"https://www.islamweb.net/ar/library/content/50/2903/",
        "assessment":"Al-Tabari on Quran 16:43: the child-friendly scholarly consultation lesson is an application beyond the immediate original context"},
    "kids-quiz-050":{
        "url":"https://www.islamweb.net/amp/ar/library/content/50/4581/",
        "assessment":"49:9–10 commands reconciliation, including justice where conflicts occur"},
    "kids-quiz-048":{
        "url":"https://www.islamweb.net/ar/library/content/50/3532/",
        "assessment":"24:27 requires permission and greeting before entering others' homes"},
    "kids-quiz-036":{
        "url":"https://islamweb.net/ar/library/content/0/7/",
        "assessment":"Sahih al-Bukhari hadith 8 states five pillars. Muslim 16 cross-referenced in Ibn al-Mulaqqin's commentary."},
    "kids-quiz-022":{
        "url":"https://dorar.net/h/qhgIL7pG?osoul=1",
        "assessment":"Sahih Muslim 8 in the hadith of Jibril includes belief in the Last Day as a pillar of iman."},
    "kids-quiz-033":{
        "url":"https://www.islamweb.net/ar/fatwa/52279/",
        "assessment":"Quran 49:12 expressly forbids backbiting; keep the children's answer focused on harmful talk behind others."},
    "kids-quiz-031":{
        "url":"https://www.islamweb.net/ar/fatwa/95384/",
        "assessment":"Quran 3:134 expressly praises those who control anger and pardon others."},
    "kids-quiz-043":{
        "url":"https://www.islamweb.net/ar/fatwa/50212/",
        "assessment":"Quran 2:238 commands preserving the prayers, with special mention of the middle prayer."},
    "kids-quiz-520":{
        "url":"https://islamweb.net/ar/fatwa/62487/",
        "assessment":"Quran 2:255 negates slumber and sleep of Allah; not a denial of His knowledge or power."},
    "kids-quiz-087":{
        "url":"https://www.islamweb.net/ar/fatwa/130695/",
        "assessment":"Quran 72:18 forbids invoking anyone with Allah in the context of worship."},
    "kids-quiz-025":{
        "url":"https://islamweb.net/ar/fatwa/119900/",
        "assessment":"Quran 33:21 makes the Messenger an excellent example for believers."},
    "kids-quiz-080":{
        "url":"https://www.islamweb.net/ar/library/content/50/4583/",
        "assessment":"Tabari on Quran 49:11 condemns nicknames that the person dislikes and insulting labels."},
    "kids-quiz-045":{
        "url":"https://www.islamweb.net/ar/library/content/51/95/",
        "assessment":"Al-Baghawi comments on Quran 2:185: Ramadan is the prescribed fasting month, with Quranic exemptions for sickness and travel."},
    "kids-quiz-041":{
        "url":"https://www.islamweb.net/ar/library/content/305/5587/",
        "assessment":"Quran 49:13 expressly makes taqwa, not wealth or lineage, the criterion of honor with Allah."},
    "kids-quiz-046":{
        "url":"https://www.islamweb.net/ar/library/content/48/397/",
        "assessment":"Al-Qurtubi on Quran 2:43: establishing prayer is coupled with giving zakah."},
    "kids-quiz-023":{
        "url":"https://www.islamweb.net/ar/library/content/48/140/",
        "assessment":"Al-Qurtubi on Quran 2:2: the Quran is described as guidance for the God-fearing."},
    "kids-quiz-032":{
        "url":"https://www.islamweb.net/ar/library/content/50/4582/",
        "assessment":"Al-Tabari on Quran 49:10: believers are brothers and are commanded to reconcile disputes according to justice."}
}
CAVEATS={
    "kids-quiz-026":"Interpretive application of 16:43: original context is asking about earlier messengers.",
    "kids-quiz-389":"Interpretive application of 16:43: original context is asking about earlier messengers.",
    "kids-quiz-044":"Do not imply washing every named part; verse distinguishes wiping of the head.",
    "kids-quiz-050":"Child-friendly summary omits the fuller conditions of 49:9–10; never present it as exhaustive fiqh.",
    "kids-quiz-022":"Hadith identifier Muslim (8) checked; pronunciation and teaching context still need separate review.",
    "kids-quiz-036":"Hadith numbering Bukhari (8) / Muslim (16) checked; variant word order across narrations is not a contradiction."
}

def must(value,message):
    if not value:raise RuntimeError("TAWHID_KIDS_STAGE1_QA_BLOCKED: "+message)

def sha(x):return hashlib.sha256(x.encode("utf-8")).hexdigest()
def read(p):return json.loads(p.read_text(encoding="utf-8"))

def main():
    stage=read(STAGE);next_run=read(NEXT)
    selected_catalog=read(ROOT/"kids/data/quiz-kids-curated-450-review.json")
    spoken_plan=read(ROOT/"kids/data/quiz-v4-curated-450-production-review.json")
    canonical={q["id"]:q for q in selected_catalog["items"]}
    recipes={q["questionId"]:q for q in spoken_plan["recipes"]}
    must(len(canonical)==len(recipes)==450 and set(canonical)==set(recipes),
         "450 selected original content and voice recipes diverged")
    must(stage["stage"]==1 and stage["reviewOnly"] is True and
         stage["published"] is False,"not private stage1")
    must(next_run["modelId"]==MODEL and next_run["voiceId"]==VOICE
         and next_run["paidSynthesisAuthorizedByAudit"] is False,
         "wrong voice / unexpectedly authorized spending")
    must(set(EVIDENCE)==set(SOURCES),
         "not all 20 questions have independently located source references")
    for qid,row in EVIDENCE.items():
        loc=urlsplit(row["url"])
        must(loc.scheme=="https" and loc.hostname in {"www.islamweb.net","islamweb.net","dorar.net"}
             and loc.path and not loc.username and not loc.password
             and isinstance(row["assessment"],str) and len(row["assessment"])>=25,
             "external source proof is unverified or not on the approved domains for "+qid)
    must(stage["numberOfQuestions"]==20 and stage["numberOfNewOriginalTexts"]==65,
         "first20 / 65 source contract changed")
    must(len(stage["questions"])==20 and len(SOURCES)==20,"question count or reviewed key map changed")
    originals=stage["originalTextRecordingQueue"]
    must(len(originals)==65 and sum(len(x["spokenText"]) for x in originals)==1842,
         "spoken text 65 originals/1842 characters changed")
    by_sha={}
    for item in originals:
        digest=item["spokenTextSHA256"];spoken=item["spokenText"]
        must(sha(spoken)==digest and digest not in by_sha,
             "duplicate or changed source V4 speech SHA")
        must(item["expectedModelId"]==MODEL and item["expectedVoiceId"]==VOICE
             and item["explicitRecordingAuthorization"] is False,
             "unapproved stage1 speech/voice")
        by_sha[digest]=item
    registry=read(REGISTRY)
    must(registry.get("modelId")==MODEL and registry.get("voiceId")==VOICE
         and registry.get("live") is False, "not a private correct-V4 original registry")
    saved=registry.get("textClips")
    must(isinstance(saved,dict),"original MP3 mapping missing")
    completed_text_sha=set()
    for digest,item in by_sha.items():
        already=saved.get(item["spokenText"])
        if already is not None:
            must(already.get("textSha256")==digest and
                 already.get("modelId")==MODEL and already.get("voiceId")==VOICE
                 and bool(already.get("sha256")),
                 "already paid stage1 MP3 has a different SHA, voice or text")
            completed_text_sha.add(digest)
    pending_source=set(by_sha)-completed_text_sha
    next_hashes=next_run["nextExactTextSha256"]
    must(0<=len(next_hashes)<=10 and len(set(next_hashes))==len(next_hashes)
         and set(next_hashes)<=pending_source,
         "next proposed V4 originals are duplicated, recorded or wrong source")
    must(next_run.get("remainingFirstStageOriginals")==len(pending_source)
         and next_run.get("previouslyRecordedFirstStageOriginals")==len(completed_text_sha),
         "stage1 batch plan is stale relative to actual saved V4 originals")
    records=[]
    for q in stage["questions"]:
        qid=q["questionId"]
        must(qid in SOURCES and q["originalSource"]==SOURCES[qid],
             "changed question ID or original source")
        must(qid in canonical and qid in recipes,"source quiz no longer selected")
        original=canonical[qid];recipe=recipes[qid]
        must(q["originalQuestion"]==original["question"]
             and q["originalSource"]==original["source"]
             and q["ageBand"]==original["ageBand"],
             "question, source or age changed compared with canonical catalog")
        must(q["answers"]==[a["label"] for a in original["answers"]]
             and sum(a["correct"] is True for a in original["answers"])==1
             and q["correctAnswer"]==next(a["label"] for a in original["answers"] if a["correct"]),
             "spoken answer key does not match exact canonical choice labels")
        must(q["spokenQuestion"]==recipe["question"]["text"]
             and q["explanation"]==recipe["explanation"]["text"],
             "spoken text or explanation edited without approved source recipe")
        must(q["ageBand"] in ("7-8","9-10"),"wrong older question age band")
        must(q["originalReviewStatus"]=="approved" and
             q["originalVerification"]=="approved",
             "original content not earlier approved in catalog")
        answers=q["answers"]
        must(len(answers)==3 and len(set(answers))==3 and q["correctAnswer"] in answers,
             "ambiguous three-choice answer key")
        must(all("Antwort "+str(i)+": "+a in q["spokenQuestion"]
                 for i,a in enumerate(answers,1)),
             "spoken version changed or failed to include exact answer label")
        must(q["spokenQuestion"].count("Antwort ")==3,"number of oral answer slots changed")
        must("Das merken wir uns:" in q["explanation"],"lost original explanation")
        must(not q["automaticTextWarnings"],"original text already flagged for review")
        must(q["humanSourceApproval"] is False and
             q["humanPronunciationApproval"] is False and
             q["manualRecordingAuthorization"] is False,
             "source QA is not human approval")
        q_shas=set()
        for part in PARTS:
            must(part in q["audioParts"],"missing audio field")
            audio=q["audioParts"][part]
            if audio["mode"]=="compose-from-verified-originals":
                for digest in audio["missingOriginalTextSHA256"]:
                    must(digest in by_sha,"unregistered speech text in question")
                    q_shas.add(digest)
            elif audio["mode"]=="original-paid-exact":
                must(audio["alreadyRecorded"] is True,"missing old, paid generation cannot be re-bought")
            else:raise RuntimeError("Unexpected speech recipe type")
        row={
            "questionId":qid,"ageBand":q["ageBand"],"originalSource":q["originalSource"],
            "originalQuestion":q["originalQuestion"],"correctAnswer":q["correctAnswer"],
            "answers":answers,
            "spokenTextAnswerOrderMatches":True,"questionAndExplanationUnchanged":True,
            "missingNewOriginalTextSHA256":sorted(q_shas),
            "remainingNewOriginalTextSHA256":sorted(q_shas&pending_source),
            "nextRunNeedsNewTextSHA256":sorted(q_shas&set(next_hashes)),
            "externalEvidenceLocated":qid in EVIDENCE,
            "externalEvidencePrivateReference":EVIDENCE[qid]["url"] if qid in EVIDENCE else None,
            "externalReferenceMatchNote":EVIDENCE[qid]["assessment"] if qid in EVIDENCE else None,
            "interpretiveOrCitationCaveat":CAVEATS.get(qid),
            "scholarlySourceReviewCompletedByHuman":False,
            "humanSpeechTextApproved":False,"humanAudioListeningApproved":False
        }
        records.append(row)
    must(set(x["questionId"] for x in records)==set(SOURCES),"missing referenced quiz questions")
    missing_used=set().union(*(set(x["missingNewOriginalTextSHA256"]) for x in records))
    must(missing_used==set(by_sha),"not all 65 proposed sources used by stage1 questions")
    may_complete=sorted(x["questionId"] for x in records
                        if set(x["remainingNewOriginalTextSHA256"]) and
                        set(x["remainingNewOriginalTextSHA256"])<=set(next_hashes))
    must(may_complete==sorted(next_run["questionsThatCouldGainCompleteV4AudioAfterNextRun"]),
         "first-ten proposed question completions inconsistent")
    report={
        "schemaVersion":1,"scope":"PRIVATE_KIDS_V4_FIRST20_EDITORIAL_AND_SOURCE_MAPPING_AUDIT",
        "modelId":MODEL,"voiceId":VOICE,"totalQuestions":20,
        "age7to8":sum(x["ageBand"]=="7-8" for x in records),
        "age9to10":sum(x["ageBand"]=="9-10" for x in records),
        "sourceMappingConsistentWithPreviouslyApprovedCatalog":True,
        "allTwentyExactCanonicalQuestionAnswerAndSpokenRecipeMatches":True,
        "independentExternalEvidenceLocatedFor":len(EVIDENCE),
        "externalEvidenceDoesNotEstablishCompleteSourceApproval":True,
        "allTwentyEvidenceUrlsOnApprovedDomains":True,
        "sourceContextsNeedingExtraCare":sorted(CAVEATS),
        "exactNewSourceTexts":65,"previouslyRecordedFirstStageOriginals":len(completed_text_sha),
        "remainingNewSourceTexts":len(pending_source),
        "nextProposedV4OriginalCount":len(next_hashes),
        "firstProposedNewV4Texts":len(next_hashes),
        "fourPossibleQuestionCompletionsAfterActualAudioAndQA":may_complete,
        "humanSourceApprovalGranted":False,
        "humanPronunciationApprovalGranted":False,
        "newOriginalMP3BytesCreated":0,"creditsSpent":0,
        "publicReleaseAllowed":False,"records":records
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    md=[
        "# TAWḤĪD KIDS – V4 Erststufe: interne Quellen- und Antwortprüfung",
        "",
        "**Kein Live-Inhalt. Keine neue Sprachsynthese. Keine menschliche Quellen-/Hörfreigabe.**",
        "",
        "- 20 unveränderte Quizfragen, 10 für 7–8 Jahre und 10 für 9–10 Jahre.",
        "- 65 überprüfte exakte Text-SHA-256-Verweise der originalen Produktionsliste.",
        "- "+str(len(completed_text_sha))+" V4-Originale aus der ersten Stufe sind im Registry registriert; "+str(len(pending_source))+" fehlen noch.",
        "- "+str(len(next_hashes))+" priorisierte V4-Takes könnten nach echter Erzeugung und technischer Prüfung "+str(len(may_complete))+" weitere Quizfragen schließen: "+(", ".join(may_complete) if may_complete else "keine")+".",
        "- Für "+str(len(EVIDENCE))+" Fragen wurden zusätzliche passende Online-Belegstellen lokalisiert; **nicht** als vollständige wissenschaftliche Freigabe zu behandeln.",
        "- Originale Quellen stehen nur im internen Review. **Keine Webseiten-Links in der Kinder-App anzeigen.**",
        "",
        "## Genauigkeitshinweise",
        ""
    ]
    for qid,note in CAVEATS.items():
        md.append("- `"+qid+"`: "+note)
    md+=["","## Nächster sicherer Schritt","",
         "1. Die 20 Quellen/Antworten unter Einschluss dieser Hinweise fachlich und altersdidaktisch abnehmen.",
         "2. Nur den unmittelbar danach ausdrücklich freigegebenen originalen `eleven_v4`-Batch bestellen.",
         "3. Gespeicherte V4-MP3-Bytes mit SHA, Audiocodec, gesprochenem Wort und Kostenledger abgleichen.",
         "4. Öffentliche Quizfreigabe auslassen, bis Audio-Hörprüfung, Quiz-Offline-Test und finaler Release-Gate bestanden sind.",
         ""]
    MD.write_text("\n".join(md),encoding="utf-8")
    print("PASS_STAGE1_SOURCE_AND_ANSWER_AUDIT "+
          json.dumps({"questions":20,"externalEvidence":len(EVIDENCE),
                      "newOriginalTexts":65,"possibleComplete":len(may_complete),
                      "humanApproval":False,"credits":0},ensure_ascii=False))

if __name__=="__main__":main()
