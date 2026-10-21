#!/usr/bin/env python3
"""Fail-closed 150-question V4 listening approval and release-candidate generator.

DO NOT call ElevenLabs; DO NOT deploy; DO NOT modify kids/data/quiz-audio.json.
Only real, technically verified local V4 MP3 clips with human approvals pinned
to their exact MP3 SHA can ever enter the staged candidate manifest.
"""
from __future__ import annotations
import argparse,hashlib,json,re,subprocess
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
PREVIEW=ROOT/"kids/data/quiz-v4-first150-composed-preview.json"
APPROVALS=ROOT/"kids/data/quiz-v4-first150-human-auditory-approvals.json"
REPORT=ROOT/"kids/data/quiz-v4-first150-release-readiness.json"
CANDIDATE=ROOT/"kids/data/quiz-v4-first150-final-candidate-not-live.json"
FLAG=ROOT/"kids/data/quiz-curation-release.json"
PUBLIC=ROOT/"kids/data/quiz-audio.json"
MODEL="eleven_v4"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
PARTS=("question","correct","retry","explanation")

def load(path,default=None):
    if not path.is_file():return {} if default is None else default
    return json.loads(path.read_text(encoding="utf-8"))
def file_sha(p):
    sha=hashlib.sha256()
    with p.open("rb") as src:
        for item in iter(lambda:src.read(1024*1024),b""):sha.update(item)
    return sha.hexdigest()

def valid_audio(row):
    if not isinstance(row,dict):return False,"missing"
    if row.get("voiceId")!=VOICE or row.get("modelId")!=MODEL:
        return False,"voice-or-model"
    path=row.get("url")
    if not isinstance(path,str) or not path.startswith("/kids/assets/kids-quiz-audio/") or ".." in path or "#" in path or "?" in path:
        return False,"unsafe-url"
    audio=(ROOT/path.lstrip("/")).resolve()
    if not audio.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()):
        return False,"unsafe-url"
    if not audio.is_file() or audio.stat().st_size<1500:return False,"missing-file"
    if not re.fullmatch("[0-9a-f]{64}",str(row.get("sha256") or "")):
        return False,"bad-sha"
    if file_sha(audio)!=row["sha256"]:
        return False,"sha-mismatch"
    p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration:stream=codec_name,codec_type",
                      "-of","json",str(audio)],capture_output=True,text=True)
    if p.returncode:return False,"unreadable-codec"
    try:
        meta=json.loads(p.stdout)
        streams=[s for s in meta.get("streams") or [] if s.get("codec_type")=="audio"]
        seconds=float(meta.get("format",{}).get("duration") or 0)
        if len(streams)!=1 or streams[0].get("codec_name")!="mp3" or not .4<seconds<180:
            return False,"invalid-codec"
    except (ValueError,TypeError):
        return False,"invalid-codec"
    return True,"okay"

def main():
    parser=argparse.ArgumentParser()
    group=parser.add_mutually_exclusive_group()
    group.add_argument("--strict",action="store_true")
    group.add_argument("--candidate",action="store_true")
    opts=parser.parse_args()
    plan=load(PLAN)
    rows=[q for q in plan.get("recipes") or [] if q["ageBand"]=="4-6"]
    if len(rows)!=150 or len({q["questionId"] for q in rows})!=150:
        raise RuntimeError("Must use exact selected age 4–6 150 question contract")
    if plan.get("voiceId")!=VOICE or plan.get("modelId")!=MODEL:
        raise RuntimeError("Correct owner voice or model missing")
    if load(FLAG).get("enabled") is not False:
        raise RuntimeError("Cannot audit while release switch is ON")
    preview=load(PREVIEW)
    if preview.get("published") is not False or preview.get("modelId")!=MODEL or preview.get("voiceId")!=VOICE:
        raise RuntimeError("This requires the unchanged, offline assembled V4 preview")
    raw=preview.get("entries") or {}
    approvals=load(APPROVALS)
    approved=approvals.get("approvedAudioShaByTextSha") or {}
    if not isinstance(approved,dict):raise RuntimeError("Audio approvals must be a hash-pinned object")
    issues=approvals.get("reportedIssuesByTextSha") or {}
    if not isinstance(issues,dict):
        raise RuntimeError("Audio defect reports must be a text hash object")
    reviewer=approvals.get("reviewerName")
    reviewer_recorded=isinstance(reviewer,str) and bool(reviewer.strip())
    hearing_attested=approvals.get("selfAttestedHumanHearing") is True
    correct_scope=approvals.get("scope")=="TAWHID_KIDS_FIRST150_AGE4_6_HUMAN_AUDIO_LISTENING"
    # Any audio approval is strictly a reviewer attestation, never machine QA.
    # Refuse legacy bare SHA maps without a named human reviewer and explicit
    # hearing statement. A name is an audit trail, not cryptographic identity proof.
    evidence_complete=reviewer_recorded and hearing_attested and correct_scope
    allowed_categories={"pronunciation","content","pauses","sound","other"}
    for text_sha,issue in issues.items():
        if not (re.fullmatch(r"[0-9a-f]{64}",str(text_sha))
                and isinstance(issue,dict)
                and issue.get("category") in allowed_categories
                and re.fullmatch(r"[0-9a-f]{64}",str(issue.get("audioSha") or ""))):
            raise RuntimeError("Malformed SHA-bound auditory defect record")
    summary={"scope":"TAWḤĪD KIDS first 150 (4–6) V4 completion gate",
             "originalQuizQuestions":150,"totalAudioFieldAssignments":600,
             "sourceOriginalsRequired":True,
             "humanListeningApprovalRequired":True,
             "humanReviewerAttributionProvided":bool(reviewer_recorded),
             "explicitHumanHearingAttestationProvided":bool(hearing_attested),
             "auditEvidenceComplete":bool(evidence_complete),
             "reportedAudioDefects":len(issues),
             "published":False,"publicManifestModified":False,
             "voiceId":VOICE,"modelId":MODEL,
             "humanApprovedQuestionSets":0,
             "completeTechnicalQuestionSets":0,
             "fieldAvailable":dict.fromkeys(PARTS,0),
             "fieldHumanApproved":dict.fromkeys(PARTS,0),
             "missingTechnicalByPart":dict.fromkeys(PARTS,0),
             "unapprovedByPart":dict.fromkeys(PARTS,0),
             "technicalErrorCounts":{},
             "readyForPrivateReleaseCandidate":False,
             "readyForLive":False,
             "voiceCreditsSpent":0}
    missing=Counter()
    all_entries={}
    for q in rows:
        technical=True;human=True
        for kind in PARTS:
            text=q[kind]["text"]
            entry=raw.get(text)
            ok,reason=valid_audio(entry)
            if not ok:
                technical=False;human=False
                summary["missingTechnicalByPart"][kind]+=1
                missing[reason]+=1
                continue
            summary["fieldAvailable"][kind]+=1
            spoken_sha=hashlib.sha256(text.encode("utf-8")).hexdigest()
            signed=approved.get(spoken_sha)
            if (not evidence_complete or spoken_sha in issues or not signed
                    or signed!=entry["sha256"]):
                human=False
                summary["unapprovedByPart"][kind]+=1
                continue
            summary["fieldHumanApproved"][kind]+=1
            all_entries[text]=dict(entry,qaApproval="human-reviewed-natural-speech",
                 audioListeningApproved=True,approvedForPlayback=True,
                 voiceProfileId="serhat-owner-voice-2026",
                 sourceVoice="authorized-owner-voice",
                 sourceSpeaker="Serhat Abu Malik",
                 approvedSource="original-v4-recording-listening-review")
        summary["completeTechnicalQuestionSets"]+=int(technical)
        summary["humanApprovedQuestionSets"]+=int(human)
    summary["technicalErrorCounts"]=dict(missing)
    ready=(evidence_complete and not issues and summary["humanApprovedQuestionSets"]==150 and
           summary["completeTechnicalQuestionSets"]==150 and
           len(all_entries)==len({q[k]["text"] for q in rows for k in PARTS}))
    summary["readyForPrivateReleaseCandidate"]=ready
    REPORT.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_FIRST150_V4_COMPLETION_GATE "+json.dumps(summary,ensure_ascii=False),flush=True)
    if opts.strict and not ready:
        raise SystemExit("150-item ORIGINAL V4 release blocked: missing paid Flow MP3s or human hearing approvals")
    if opts.candidate:
        if not ready:
            # Invalidate any previously staged private candidate so it cannot
            # be mistaken for a current approval after the audit regresses.
            # The public manifest is never touched.
            CANDIDATE.unlink(missing_ok=True)
            raise SystemExit("Refusing to create unapproved V4 candidate manifest")
        # Does not write to kids/data/quiz-audio.json and cannot publish.
        candidate={"id":"KIDS_QUIZ_FIRST150_V4_AUDITORY_APPROVED_CANDIDATE",
                   "app":"TAWḤĪD KIDS","status":"review-only-requires-separate-kids-release",
                   "voiceProfileId":"serhat-owner-voice-2026","speaker":"Serhat Abu Malik",
                   "voiceId":VOICE,"modelId":MODEL,"ageBand":"4-6",
                   "questionCount":150,"fieldAssignments":600,
                   "testFirst":True,"live":False,"entries":all_entries}
        CANDIDATE.write_text(json.dumps(candidate,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("FIRST150_VALIDATED_CANDIDATE_WRITTEN_NO_LIVE",flush=True)

if __name__=="__main__":
    main()
