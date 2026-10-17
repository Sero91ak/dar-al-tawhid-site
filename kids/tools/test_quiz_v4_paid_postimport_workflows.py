#!/usr/bin/env python3
"""Zero-credit regression for the paid V4 workflow post-import safety.

Read only. Confirms every manually gated 20/50-take job executes the
original-MP3 integrity audit, both age builders, complete progress report,
and question-ID staging BEFORE its git commit and backup. No paid TTS,
provider API, permissions changes or public files are touched here.
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
WORKFLOWS=(
    ".github/workflows/kids-v4-450-paid-batch02.yml",
    ".github/workflows/kids-v4-450-paid-batch03.yml",
)
COMMANDS=(
    "python3 kids/tools/qa_quiz_v4_saved_mp3.py",
    "python3 kids/tools/quiz_v4_first150_offline_join.py",
    "python3 kids/tools/quiz_v4_age7to10_offline_join.py",
    "python3 kids/tools/report_quiz_v4_450_progress.py",
    "python3 kids/tools/stage_quiz_v4_existing_mp3_import.py",
    "python3 kids/tools/write_quiz_v4_handover.py",
    "python3 kids/tools/quiz_v4_selected450_release_gate.py --ignore-flag",
)
REVIEW_FILES=(
    "quiz-v4-first150-composed-preview.json",
    "quiz-v4-first150-audio-status.json",
    "quiz-v4-age7to10-composed-preview.json",
    "quiz-v4-age7to10-offline-coverage.json",
    "quiz-v4-450-production-status.json",
    "quiz-v4-450-actual-mp3-import.json",
    "quiz-v4-450-actual-mp3-import-summary.json",
    "QUIZ-V4-UEBERGABE-AKTUELL.md",
)
def require(value, reason):
    if not value:raise AssertionError("V4 paid-post-import safety violation: "+reason)

def main():
    for name in WORKFLOWS:
        raw=(ROOT/name).read_text(encoding="utf-8")
        require("workflow_dispatch:" in raw and 'authorize_new_credit_spend' in raw
                and "== 'YES'" in raw,
                name+": paid actions must remain explicitly consent-gated")
        require("group: tawhid-kids-v4-450-shared-paid-queue" in raw,
                name+": paid jobs must serialize to prevent double purchase")
        require("review/kids-quiz-v4-batch-001-020-20261014" in raw,
                name+": only private V4 review branch")
        require("on:\n  workflow_dispatch:" in raw,
                name+": paid workflow must never be triggered by PR or public push")
        require(raw.count("python3 kids/tools/generate_quiz_v4_450_paid_batch")==1,
                name+": one bounded generator only")
        occurrences=[raw.find(k) for k in COMMANDS]
        require(all(i>=0 for i in occurrences)
                and occurrences==sorted(occurrences)
                and len(set(occurrences))==len(COMMANDS),
                name+": MP3 post-generation integrity and staging order wrong")
        generation=raw.index("python3 kids/tools/generate_quiz_v4_450_paid_batch")
        save=raw.index("git config user.name")
        require(generation<occurrences[0]<occurrences[-1]<save,
                name+": MP3s not built/validated before commit")
        for file in REVIEW_FILES:
            require(file in raw,name+": missing generated review file in staging or backup: "+file)
        require("if: always()" in raw and "actions/upload-artifact@v4" in raw,
                name+": paid original recovery artifact must survive failures")
        require("kids/assets/kids-quiz-audio/v4-curated450-review/" in raw,
                name+": original MP3 bytes must be backed up")
        require("kids/data/quiz-audio.json" not in raw
                and "git push origin HEAD:main" not in raw
                and "kids/data/quiz-curation-release.json" not in raw,
                name+": public audio / live flag must never be modified by paid jobs")

    # The current first 150 have no actually-new V4 texts. If that changes,
    # fail the audit until the speech receipts have been reconciled.
    sys.path.insert(0,str(ROOT/"kids/tools"))
    from quiz_v4_first150_costed_campaign import validate, fresh_queue
    _,_,_,targets,_,remaining,_,_,_=validate()
    require(len(targets)==150 and not remaining and not fresh_queue(targets,remaining),
            "age 4-6 still has unpaid texts; first recover previously-paid originals")
    campaign=(ROOT/"kids/tools/quiz_v4_first150_costed_campaign.py").read_text(encoding="utf-8")
    require(campaign.index('if not ordered:\n        print("KIDS_150_4_6_ALREADY_PAID_ONLY')
            <campaign.index('key=os.environ.get("ELEVENLABS_API_KEY"'),
            "first150 campaign must exit before provider key/balance access")
    print("PASS: 20/50 V4 paid jobs gated, SHA validated, both ages joined, "
          "450 question IDs staged and backed up; current 4-6 new TTS = 0")

if __name__=="__main__":
    main()
