#!/usr/bin/env python3
"""Verify offline human-hearing JSON submissions against REAL V4 quiz MP3s.

Only manually exported JSON from the existing offline hearing desks is read.
Fail closed for wrong age, wrong voice/model, unknown speech, stale MP3 SHA,
malformed file, conflicting decisions, duplicate keys or false approvals.
Submitted human decisions are SELF-ATTESTED and never automatically authorize
public playback, editing audio manifests or publishing the KIDS quiz.
Reviewer names and raw submissions are not copied into the GitHub output.
No network or ElevenLabs requests. Zero voice credits.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STAGED = ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import.json"
RELEASE = ROOT/"kids/data/quiz-curation-release.json"
INBOX = ROOT/"kids/review-only/hearing-submissions"
REPORT = ROOT/"kids/review-only/quiz-v4-450-human-hearing-submission-ledger.json"
SUMMARY = ROOT/"kids/review-only/QUIZ-V4-HOERPRUEFUNG-IMPORTSTATUS.md"
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"
MAX_BYTES = 500_000
HEX = re.compile(r"^[0-9a-f]{64}$")
SCOPES = {"4-6":"TAWHID_KIDS_FIRST150_AGE4_6_HUMAN_AUDIO_LISTENING",
          "7-10":"TAWHID_KIDS_AGE7_TO_10_HUMAN_AUDIO_LISTENING"}
AGE_BANDS = {"4-6":{"4-6"},"7-10":{"7-8","9-10"}}
CATEGORIES = {"pronunciation","content","pauses","sound","other"}

def fail(reason):
    raise ValueError("KIDS V4 hearing import rejected: "+reason)

def reject_duplicate_keys(pairs):
    obj={}
    for key,value in pairs:
        if key in obj:
            fail("duplicate JSON key: ambiguous review decisions are unsafe")
        obj[key]=value
    return obj

def load(path, max_size=MAX_BYTES):
    if not path.is_file() or not 0<path.stat().st_size<=max_size:
        fail("missing/oversized JSON submission or ledger")
    return json.loads(path.read_text(encoding="utf-8"),
                      object_pairs_hook=reject_duplicate_keys)

def ensure(condition, message):
    if not condition:fail(message)

def is_sha(x):
    return isinstance(x,str) and bool(HEX.fullmatch(x))

def index_real_audio(stage):
    ensure(stage.get("modelId")==MODEL and stage.get("voiceId")==VOICE,"wrong V4 voice")
    ensure(stage.get("reviewOnly") is True and stage.get("publicReleaseEnabled") is False,
           "quiz is not an unpublished review")
    rows=stage.get("questions")
    ensure(isinstance(rows,dict) and len(rows)==450,"expected 450 question IDs")
    indexed={}
    allowed={age:{} for age in SCOPES}
    checked_mp3={}
    allowed_audio_root=(ROOT/"kids/assets/kids-quiz-audio").resolve()
    for qid,row in rows.items():
        band=row.get("ageBand")
        ensure(band in {"4-6","7-8","9-10"},"invalid age group")
        age="4-6" if band=="4-6" else "7-10"
        for kind,p in row["parts"].items():
            ensure(kind in {"question","correct","retry","explanation"},
                   "unknown speech part in staged review")
            textsha=p.get("spokenTextSha256")
            audiosha=p.get("sha256")
            ensure(is_sha(textsha) and is_sha(audiosha)
                   and p.get("modelId")==MODEL and p.get("voiceId")==VOICE,
                   "real MP3 digest or V4 voice absent")
            audio_url=p.get("url")
            ensure(isinstance(audio_url,str)
                   and audio_url.startswith("/kids/assets/kids-quiz-audio/")
                   and audio_url.endswith(".mp3") and ".." not in audio_url
                   and "?" not in audio_url and "#" not in audio_url,
                   "invalid or unsafe staged V4 MP3 path")
            audio_file=(ROOT/audio_url.lstrip("/")).resolve()
            ensure(audio_file.is_relative_to(allowed_audio_root)
                   and audio_file.is_file() and 1500<audio_file.stat().st_size<6_000_000,
                   "original V4 MP3 missing, unsafe or invalid size")
            if audio_url not in checked_mp3:
                with audio_file.open("rb") as source:
                    checked_mp3[audio_url]=hashlib.file_digest(source,"sha256").hexdigest()
            ensure(checked_mp3[audio_url]==audiosha,
                   "saved actual V4 MP3 bytes differ from supplied SHA256")
            assertable=(audiosha,audio_url)
            if textsha in indexed:
                ensure(indexed[textsha]==assertable,"same text maps to different MP3s")
            else:indexed[textsha]=assertable
            if textsha in allowed[age]:
                ensure(allowed[age][textsha]==audiosha,"different clips for same age/text")
            else:allowed[age][textsha]=audiosha
    return indexed,allowed

def review_one(source, group, allowed):
    ensure(isinstance(source,dict),"JSON payload must be an object")
    ensure(source.get("schemaVersion")==2 and source.get("scope")==SCOPES[group],
           "wrong review version or age band")
    ensure(source.get("selfAttestedHumanHearing") is True,
           "cannot accept automated or unsigned-off review")
    reviewer=source.get("reviewerName")
    ensure(isinstance(reviewer,str) and 1<=len(reviewer.strip())<=120,
           "missing self-identified human reviewer")
    instant=source.get("exportedAt")
    ensure(isinstance(instant,str) and len(instant)<=45,"missing export timestamp")
    try:
        t=datetime.fromisoformat(instant.replace("Z","+00:00"))
        ensure(t.tzinfo is not None and t<=datetime.now(timezone.utc),
               "invalid/future export date")
    except (TypeError,ValueError):fail("unparseable timestamp")
    passed=source.get("approvedAudioShaByTextSha")
    problems=source.get("reportedIssuesByTextSha")
    ensure(isinstance(passed,dict) and isinstance(problems,dict),
           "both approvals and issue maps are required")
    ensure(len(passed)+len(problems)<=len(allowed),"more decisions than original audio")
    ensure(not(set(passed)&set(problems)),"cannot both accept and reject same clip")
    approved={}
    issues={}
    for textsha,mp3sha in passed.items():
        ensure(is_sha(textsha) and is_sha(mp3sha)
               and allowed.get(textsha)==mp3sha,
               "unknown, wrong-age or changed MP3 hash in approval")
        approved[textsha]=mp3sha
    for textsha,issue in problems.items():
        ensure(is_sha(textsha) and isinstance(issue,dict),"malformed error report")
        mp3sha=issue.get("audioSha")
        category=issue.get("category")
        note=issue.get("note","")
        ensure(is_sha(mp3sha) and allowed.get(textsha)==mp3sha,
               "unknown, wrong-age or changed MP3 hash in issue")
        ensure(category in CATEGORIES and isinstance(note,str) and len(note)<=1500,
               "unsupported issue classification or note length")
        # Notes may include children's names or contact details. Only keep
        # metadata needed to route a private review. Human follow-up reads
        # the original, gitignored submission stored outside GitHub.
        issues[textsha]={"mp3Sha256":mp3sha,"category":category,
                         "hasPrivateNote":bool(note.strip()),"noteLength":len(note)}
    # Do NOT store reporter names, arbitrary raw JSON, note content, or PII.
    # These are self-attested claims, not production audio approvals.
    return {"scope":SCOPES[group],"ageGroup":group,"approvedClaims":approved,
            "reportedIssues":issues,"selfAttested":True,
            "authenticatedReviewerVerified":False}

def build_report(stage, files):
    index,eligible=index_real_audio(stage)
    results={}
    for group,path in files.items():
        if path is not None:
            results[group]=review_one(load(path),group,eligible[group])
    # Mark contradictory claims as a new REVIEW BLOCKER, never a passed clip.
    approved={}
    problems={}
    for group,row in results.items():
        for sha,mp3 in row["approvedClaims"].items():
            ensure(sha not in approved or approved[sha]==mp3,
                   "different SHA approvals for identical speech")
            approved[sha]=mp3
        for sha,issue in row["reportedIssues"].items():
            if sha in problems:
                ensure(problems[sha]==issue,
                       "contradictory issue reports require human resolution")
            problems[sha]=issue
    conflicting=sorted(set(approved)&set(problems))
    for sha in conflicting:approved.pop(sha,None)
    # Preserve only untrusted review claims; NEVER rewrite source registries.
    qstates={}
    count_age=defaultdict(Counter)
    for qid,row in stage["questions"].items():
        band=row["ageBand"]
        spoken=[]
        flagged=[]
        for part,clip in row["parts"].items():
            sh=clip["spokenTextSha256"]
            if sh in problems:flagged.append(part)
            elif approved.get(sh)==clip["sha256"]:spoken.append(part)
        missing=list(row["missing"])
        ready=not missing and len(spoken)==4 and not flagged
        count_age[band]["questions"]+=1
        count_age[band]["fourPartTechnical"]+=int(row["fourPartTechnicallyReady"])
        count_age[band]["allFourSelfAttestedUnverified"]+=int(ready)
        count_age[band]["questionsWithReportedIssue"]+=int(bool(flagged))
        qstates[qid]={"ageBand":band,"selfAttestedParts":sorted(spoken),
                      "reportedIssueParts":sorted(flagged),
                      "missingOriginalParts":sorted(missing),
                      "fourPartSelfAttestedPendingIdentityReview":ready,
                      "publicPlaybackApproved":False}
    report={"schemaVersion":1,"scope":"TAWHID_KIDS_450_PRIVATE_SELF_ATTESTED_HEARING_SUBMISSIONS",
            "masterVoiceId":VOICE,"modelId":MODEL,
            "knownRealV4TextClips":len(index),"ageSubmitted":["4-6","7-10"]
            if len(results)==2 else sorted(results),
            "claimedApprovalClipCount":len(approved),
            "submittedIssueClipCount":len(problems),
            "claimsConflictingWithIssues":conflicting,
            "allClaimsRequireIndependentAuthorization":True,
            "reviewerIdentityAuthenticated":False,
            "humanApprovalVerifiedByImporter":False,
            "publicPlaybackApprovedCount":0,"publicReleaseAllowed":False,
            "newElevenLabsCreditsSpent":0,
            "rawReviewerNamesOrNotesCommitted":False,
            "byAge":{age:dict(count_age[age]) for age in ("4-6","7-8","9-10")},
            "selfAttestedAudioClaimsByTextSha":approved,
            "reportedIssuesByTextSha":problems,
            "questionReviewStates":qstates}
    return report

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--young",type=Path,default=INBOX/"4-6.json",
                        help="Real hearing desk JSON for ages 4-6")
    parser.add_argument("--older",type=Path,default=INBOX/"7-10.json",
                        help="Real hearing desk JSON for ages 7-10")
    parser.add_argument("--check",action="store_true",
                        help="Check existing generated report, do not change it")
    opts=parser.parse_args()
    ensure(json.loads(RELEASE.read_text(encoding="utf-8")).get("enabled") is False,
           "cannot import hearing claims with production flag enabled")
    for flag,path in (("--young",opts.young),("--older",opts.older)):
        if flag in __import__("sys").argv[1:] and not path.is_file():
            fail("explicitly supplied review JSON does not exist: "+flag)
    files={"4-6":opts.young if opts.young.is_file() else None,
           "7-10":opts.older if opts.older.is_file() else None}
    stage=load(STAGED,10_000_000)
    report=build_report(stage,files)
    lines=["# TAWḤĪD KIDS – V4-Hörprüfungen: sicherer Rückimport",
           "",
           "**Importierte, überprüfbare Review-Dateien:** "+str(len(report["ageSubmitted"]))+" von 2 Altersgruppen.",
           "**Eingereichte Hörfreigabe-Behauptungen:** "+str(report["claimedApprovalClipCount"])+
           " (noch **nicht** unabhängig freigegeben).",
           "**Gemeldete Fehler:** "+str(report["submittedIssueClipCount"])+".",
           "**Konflikte Freigabe/Fehlermeldung:** "+str(len(report["claimsConflictingWithIssues"]))+".",
           "",
           "Jedes Häkchen ist nur eine Selbstauskunft der angegebenen Prüfperson.",
           "Es ist **keine** Authentifizierung, keine finale Audiofreigabe und",
           "**kein** öffentlich sichtbarer Quiz-Status. Kein ElevenLabs-Credit-Verbrauch.",
           "",
           "Zugelassene Eingänge: ausschließlich lokal/temporär; Rohdateien niemals committen:",
           "- `kids/review-only/hearing-submissions/4-6.json`",
           "- `kids/review-only/hearing-submissions/7-10.json`",
           "",
           "Die Inhalte müssen aus dem interaktiven Offline-Hörpaket exportiert",
           "und mit echten MP3-Prüfsummen erstellt worden sein. Externe/unbekannte",
           "Dateien werden abgelehnt. Vorhandene Originale werden nie überschrieben.",
           "Keine Rohdaten, Prüfernamen oder freien Fehlernotizen im GitHub-Ergebnis.",
           "Notiztexte verbleiben ausschließlich in der lokalen, nicht versionierten Originaldatei.",
           ""]
    markdown="\n".join(lines)
    if opts.check:
        ensure(REPORT.is_file() and SUMMARY.is_file() and
               json.loads(REPORT.read_text(encoding="utf-8"))==report and
               SUMMARY.read_text(encoding="utf-8")==markdown,
               "current review report does not match uploaded submissions")
    else:
        REPORT.parent.mkdir(parents=True,exist_ok=True)
        REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",
                          encoding="utf-8")
        SUMMARY.write_text(markdown,encoding="utf-8")
    print("TAWHID_KIDS_V4_HEARING_SUBMISSION_QA "+json.dumps(
        {"inputAgeGroups":report["ageSubmitted"],
         "selfAttestedAudioClaims":report["claimedApprovalClipCount"],
         "issues":report["submittedIssueClipCount"],
         "conflicts":len(report["claimsConflictingWithIssues"]),
         "verifiedHumanApprovals":0,"newElevenLabsCredits":0,
         "publicRelease":False},ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
