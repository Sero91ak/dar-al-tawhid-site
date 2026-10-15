#!/usr/bin/env python3
"""Fail-closed source/pedagogy audit registry regression for first 40 V4 texts.

A Python dictionary silently overrides duplicate question IDs. This static
AST check detects duplicate keys *before* import, then verifies audit output.
No synthesis, network requests, source rewriting, or app publication.
"""
from __future__ import annotations

import ast
import importlib
import json
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/"kids/tools/qa_quiz_v4_older40_pedagogy.py"
REPORT=ROOT/".github/reports/kids-v4-older40-editorial-source-findings.json"
VOICE_REPORTS=ROOT/".github/reports"

def check():
    node=ast.parse(SCRIPT.read_text(encoding="utf-8"), filename=str(SCRIPT))
    registered={}
    for expr in node.body:
        if not isinstance(expr, ast.Assign) or len(expr.targets)!=1:
            continue
        if not isinstance(expr.targets[0], ast.Name):
            continue
        name=expr.targets[0].id
        if name not in {"FINDINGS","EVIDENCE"}:
            continue
        if not isinstance(expr.value, ast.Dict):
            raise AssertionError(name+" must be a literal dict for source audit")
        ids=[ast.literal_eval(k) for k in expr.value.keys]
        if len(ids)!=len(set(ids)):
            repeated=[i for i,c in Counter(ids).items() if c>1]
            raise AssertionError(name+" duplicates original question ID(s): "+str(repeated))
        registered[name]=set(ids)
    assert set(registered)=={"FINDINGS","EVIDENCE"}
    assert len(registered["FINDINGS"])==20
    assert len(registered["EVIDENCE"])==11

    sys.path.insert(0,str(SCRIPT.parent))
    module=importlib.import_module("qa_quiz_v4_older40_pedagogy")
    module.main()
    doc=json.loads(REPORT.read_text(encoding="utf-8"))
    assert doc["quizQuestionsInspected"]==40
    assert doc["sourceReferencesExternallySpotchecked"]==11
    assert doc["remainingQuestionReferencesNeedingIndividualVerification"]==29
    assert doc["questionsWithEditorialFlags"]==20
    assert doc["allSourcesVerified"] is False
    assert doc["humanSourceSignoffGranted"] is False
    assert doc["paidVoiceGenerationAuthorized"] is False
    assert doc["elevenLabsCreditsSpent"]==0
    stage_ids={
        q["questionId"]
        for stage in (1,2)
        for q in json.loads((VOICE_REPORTS/
            f"kids-v4-older-age-stage{stage}-exact-voice-preflight.json"
        ).read_text(encoding="utf-8"))["questions"]
    }
    assert len(stage_ids)==40
    assert {q["questionId"] for q in doc["findings"]}==stage_ids
    assert all(q["pedagogicalContentApproved"] is False and
               q["scientificSourceVerificationComplete"] is False and
               q["reviewerApprovedNewSpeechGeneration"] is False
               for q in doc["findings"])
    print("PASS_KIDS_V4_OLDER40_EDITORIAL_AST_NO_DUPLICATE_IDS " + json.dumps({
        "allQuestions":40,"individualEvidenceReferences":11,
        "distinctEditorialWarnings":20,"pendingReferences":29,
        "falseApprovalsGenerated":0,"voiceCreditsSpent":0,
        "livePublished":False,
    }),flush=True)

if __name__=="__main__":
    check()
