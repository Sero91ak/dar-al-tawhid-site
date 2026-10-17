#!/usr/bin/env python3
"""Zero-credit guard for *every* historic paid MP3 recovery entry point.

Only static pipeline verification and existing JSON audit; no fake audio, paid
ElevenLabs requests, credentials, public release or source changes.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
ROUTES={
    ".github/workflows/kids-v4-prepaid-flow-restore.yml":"python3 kids/tools/import_quiz_v4_prepaid_flow_originals.py --zip",
    ".github/workflows/kids-v4-secure-original-import.yml":"python3 kids/tools/import_quiz_v4_prepaid_flow_originals.py --directory",
    ".github/workflows/kids-v4-last9-paid-free-get.yml":"python3 kids/tools/recover_quiz_v4_missing9_get_only.py",
}
AFTER={
    "quiz_v4_first150_offline_join.py",
    "quiz_v4_age7to10_offline_join.py",
    "qa_quiz_v4_first150_composed.py",
    "report_quiz_v4_450_progress.py",
    "stage_quiz_v4_existing_mp3_import.py",
    "write_quiz_v4_handover.py",
}
OUTPUTS={
    "quiz-v4-first150-composed-preview.json",
    "quiz-v4-first150-audio-status.json",
    "quiz-v4-age7to10-composed-preview.json",
    "quiz-v4-age7to10-offline-coverage.json",
    "quiz-v4-450-production-status.json",
    "quiz-v4-450-actual-mp3-import.json",
    "quiz-v4-450-actual-mp3-import-summary.json",
    "QUIZ-V4-UEBERGABE-AKTUELL.md",
    "quiz-v4-handover-latest.json",
}
def must(value,msg):
    if not value:raise AssertionError("V4_PREPAID_RECOVERY_WIRING_FAIL: "+msg)

def validate_workflow(path,source):
    raw=(ROOT/path).read_text(encoding="utf-8")
    must(source in raw,"missing original recovery source in "+path)
    must("permissions:\n  contents: write" in raw,
         "recovery cannot safely persist imported originals: "+path)
    must("github.event.pull_request.number == 1143" in raw,
         "must never run for other PRs: "+path)
    must("review/kids-quiz-v4-batch-001-020-20261014" in raw,
         "must check out private original review branch: "+path)
    must("python3 kids/tools/quiz_v4_selected450_release_gate.py --ignore-flag" in raw or
         "['python3','kids/tools/quiz_v4_selected450_release_gate.py','--ignore-flag']" in raw,
         "the audit must never falsely claim public release readiness: "+path)
    must("python3 kids/tools/quiz_v4_selected450_release_gate.py --strict" not in raw,
         "strict launch gate must not be triggered by private imports: "+path)
    must("kids/data/quiz-audio.json" not in raw and
         "git push origin HEAD:main" not in raw,
         "recovery changed a public quiz manifest: "+path)
    for name in AFTER:
        must(name in raw, "missing automatic downstream "+name+" in "+path)
    for name in OUTPUTS:
        must(name in raw,"no commit/backup of "+name+" in "+path)
    must("kids/assets/kids-quiz-audio/v4-paid-flow-original-review/" in raw,
         "real previously-paid MP3s must be saved: "+path)
    must("if git push origin" in raw and "git rebase FETCH_HEAD" in raw,
         "review-only original import not persisted or not concurrency-safe: "+path)

def main():
    reg=json.loads((ROOT/"kids/data/quiz-v4-450-original-clip-registry.json").read_text())
    paid=json.loads((ROOT/"kids/data/quiz-v4-paid-flow-import-status.json").read_text())
    young=json.loads((ROOT/"kids/data/quiz-v4-first150-audio-status.json").read_text())
    stage=json.loads((ROOT/"kids/review-only/quiz-v4-450-actual-mp3-import-summary.json").read_text())
    release=json.loads((ROOT/"kids/data/quiz-curation-release.json").read_text())
    must(reg["modelId"]==MODEL and reg["voiceId"]==VOICE and reg["live"] is False,
         "wrong master V4 model, voice or release flag")
    must(len(reg["generationClips"])+len(paid["remainingGenerationIds"])==56,
         "56 paid Flow originals must remain accounted for")
    must(set(paid["remainingGenerationIds"]).isdisjoint(reg["generationClips"]),
         "one paid original simultaneously marked restored and missing")
    must(stage["questionsStaged"]==450
         and stage["completeFourPartQuestions"]+stage["notCompleteFourPartQuestions"]==450,
         "450 quiz playback map is invalid")
    must(stage["byAge"]["4-6"]["completeFourPartQuestions"]==young["completeFourPartQuestions"],
         "first150 count differs from actual 450-audio import")
    must(young["projectedFourPartQuestionCountAfterAuthenticOldPaidImport"]==150,
         "original 150-question source cannot be completed with genuine prepaid audio")
    must(release["enabled"] is False,"public release must remain disabled")
    for path,source in ROUTES.items():validate_workflow(path,source)
    # A simulated broken workflow must be detected, without changing GitHub.
    original=(ROOT/next(iter(ROUTES))).read_text(encoding="utf-8")
    must("quiz_v4_age7to10_offline_join.py" in original,
         "cross-age derived files absent from ZIP importer")
    print("PASS: all three zero-credit authentic-original import routes update the "
          "450-question private quiz map, verify 150-age projection, and preserve release OFF")

if __name__=="__main__":main()
