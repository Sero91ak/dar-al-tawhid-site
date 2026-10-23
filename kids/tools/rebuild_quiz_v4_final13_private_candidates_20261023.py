#!/usr/bin/env python3
"""Isolated 450/450 candidacy proof using real original MP3s only.
Monkey-patches local reader instances IN THIS PROCESS ONLY. Never changes
published registry, quarantine ledger, canonical quiz, or release flags.
"""
from __future__ import annotations
import copy, json, os, shutil, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import quiz_v4_quarantine as quarantine
import quiz_v4_age7to10_offline_join as older
import report_quiz_v4_450_progress as report
import stage_quiz_v4_existing_mp3_import as stage

CANDIDATES=ROOT/"kids/review-only/quiz-v4-final13-candidate-originals-20261023.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
RELEASE=ROOT/"kids/data/quiz-curation-release.json"
OUT=ROOT/"kids/review-only/quiz-v4-final13-450-candidate-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"

def load(p):return json.loads(Path(p).read_text(encoding="utf-8"))
def require(cond,msg):
    if not cond:raise RuntimeError(msg)

def main():
    require(load(RELEASE).get("enabled") is False,"Release flag must be OFF")
    manifest=load(CANDIDATES)
    c=manifest["clips"]
    require(manifest["reviewOnly"] is True and manifest["publicReleaseAllowed"] is False
       and manifest["humanListeningApproved"] is False
       and len(c)==13 and manifest["expectedCount"]==13,"Unsafe candidate contract")
    original=load(REGISTRY)
    require(original["modelId"]==MODEL and original["voiceId"]==VOICE and original["live"] is False,"Wrong master source")
    quarantined_texts,quarantined_gens=quarantine.quarantined_originals(ROOT)
    # The original rejection/paid ledger and owner hearing hold remain unchanged:
    # only a local, separately tagged candidate view can use NEW bytes.
    def fake_quarantine(root):
        require(root==ROOT,"Wrong review root")
        return quarantined_texts-set(c),quarantined_gens
    def fake_registry_load(real):
        def local_load(path):
            if Path(path).resolve()==REGISTRY.resolve():
                registry=copy.deepcopy(original)
                registry["textClips"].update(c)
                return registry
            return real(path)
        return local_load

    older.quarantined_originals=fake_quarantine
    older.load=fake_registry_load(older.load)
    report.quarantined_originals=fake_quarantine
    report.load=fake_registry_load(report.load)
    stage.quarantined_originals=fake_quarantine
    stage.load=fake_registry_load(stage.load)
    # Public manifest and initial first-age band never modified by this run.
    older.main()
    report.main()
    stage.main()
    summary=load(ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import-summary.json")
    status=load(ROOT/"kids/data/quiz-v4-450-production-status.json")
    require(summary["questionsStaged"]==450,"Changed selected question count")
    require(summary["completeFourPartQuestions"]==450 and
            status["completedQuestionsWithAllFourAudioParts"]==450,"Private audio assembly not complete")
    require(summary["humanListeningApprovals"]==0 and
            status["questionsHumanListeningApproved"]==0 and
            status["livePublished"] is False and
            status["appReleaseFlagEnabled"] is False,"Unauthorized approval or publication")
    OUT.mkdir(parents=True,exist_ok=True)
    files={
      "preview-age7to10.json":"kids/data/quiz-v4-age7to10-composed-preview.json",
      "coverage-age7to10.json":"kids/data/quiz-v4-age7to10-offline-coverage.json",
      "candidate-450-audio-status.json":"kids/data/quiz-v4-450-production-status.json",
      "candidate-450-playback-manifest.json":"kids/review-only/quiz-v4-450-actual-mp3-import.json",
      "candidate-450-summary.json":"kids/review-only/quiz-v4-450-actual-mp3-import-summary.json",
    }
    for dest,source in files.items():
        shutil.copyfile(ROOT/source,OUT/dest)
    certificate={
      "scope":"KIDS_450_CANDIDATE_REVIEW_NO_PUBLIC_RELEASE",
      "generatedBy":"original-MP3-offline-composer with in-process private candidate overlay",
      "candidateQuestionsTechnicallyFourPartComplete":450,
      "previousVerifiedBaseline":441,
      "newOwnerAuthorizedCandidateClips":13,
      "voiceId":VOICE,"modelId":MODEL,
      "existingPaidSourceAudioFilesPreserved":True,
      "canonical900QuizQuestionsUnchanged":True,
      "humanListeningApproved":False,
      "pronunciationAndFuṣḥāCorrectnessProven":False,
      "replacementsPotentiallyRepeatMispronunciations":True,
      "releaseFlagEnabled":False,
      "published":False,
      "remainingOwnerHearingReview":450
    }
    (OUT/"private-candidate-proof.json").write_text(json.dumps(certificate,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KIDS_V4_450_CANDIDATE_AUDIOS_TECHNICALLY_ASSEMBLED__NOT_LIVE__HEARING_QA_REQUIRED",flush=True)

if __name__=="__main__":main()
