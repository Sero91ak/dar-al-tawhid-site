#!/usr/bin/env python3
"""Offline release-gate regression: no user approvals or real V4 assets are modified.

The synthetic 150-question approval fixtures in temporary storage DO NOT
constitute human approval or genuine audio; they test logic only.
The real-MP3 checks below only READ an existing verified original.
ElevenLabs is never called and 0 voice credits are consumed.
"""
from __future__ import annotations

import hashlib
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import quiz_v4_first150_final_release_gate as gate


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def expect_refused(call, error_type, label):
    try:
        call()
    except error_type:
        return
    raise AssertionError("Gate unexpectedly accepted " + label)


def main():
    original_plan = gate.load(gate.PLAN)
    original_preview = gate.load(gate.PREVIEW)
    rows = [q for q in original_plan["recipes"] if q["ageBand"] == "4-6"]
    expect(len(rows) == 150, "Expected 150 canonical age 4–6 recipes")

    # Truly inspect a REAL, unchanged original MP3 on disk, not only mock data.
    sample = next(row for row in original_preview["entries"].values()
                  if isinstance(row, dict) and row.get("url"))
    verified, why = gate.valid_audio(sample)
    expect(verified, "An existing real MP3 failed before negative tests: " + why)
    wrong = dict(sample, sha256="0" * 64)
    expect(gate.valid_audio(wrong)[1] == "sha-mismatch",
           "Modifying an MP3 SHA must be rejected")
    expect(gate.valid_audio(dict(sample, voiceId="UNKNOWN"))[1] == "voice-or-model",
           "Different ElevenLabs voice must be rejected")
    expect(gate.valid_audio(dict(sample, modelId="eleven_v3"))[1] == "voice-or-model",
           "Older speech model must be rejected")
    expect(gate.valid_audio(dict(sample, url="/kids/assets/kids-quiz-audio/../../index.html"))[1] == "unsafe-url",
           "Traversal must be rejected")

    # Synthetic coverage for all 150 questions: NEVER use as production data.
    simulated = {}
    for q in rows:
        for part in gate.PARTS:
            phrase = q[part]["text"]
            simulated[phrase] = {
                "sha256": sha("FAKE_QA_FIXTURE_ONLY:" + phrase),
                "voiceId": gate.VOICE,
                "modelId": gate.MODEL,
                "url": "/kids/assets/kids-quiz-audio/NEVER_EXPORT_TEST_FIXTURE/" + sha(phrase) + ".mp3",
            }

    def simulated_audio(row):
        if not isinstance(row, dict):
            return False, "missing"
        # Checks metadata for the isolated logic fixture, NEVER marks a real MP3.
        if row.get("voiceId") != gate.VOICE or row.get("modelId") != gate.MODEL:
            return False, "voice-or-model"
        if row.get("sha256") not in {value["sha256"] for value in simulated.values()}:
            return False, "fixture-sha-missing"
        return True, "okay"

    audit = {
        "schemaVersion": 2,
        "scope": "TAWHID_KIDS_FIRST150_AGE4_6_HUMAN_AUDIO_LISTENING",
        "reviewerName": "QA FICTIONAL FIXTURE – NOT A HUMAN APPROVAL",
        "selfAttestedHumanHearing": True,
        "exportedAt": "2026-10-15T00:00:00.000Z",
        "approvedAudioShaByTextSha": {
            sha(phrase): clip["sha256"] for phrase, clip in simulated.items()
        },
        "reportedIssuesByTextSha": {},
    }

    with tempfile.TemporaryDirectory(prefix="kids-v4-gate-logic-test-") as td:
        root = Path(td)
        plan = root / "plan.json"
        preview = root / "preview.json"
        approvals = root / "manual-approval-test-only.json"
        summary = root / "readiness.json"
        candidate = root / "candidate-NEVER-LIVE.json"
        flag = root / "release-flag-test.json"
        public = root / "public-test-file-NEVER-REAL.json"
        write(plan, {"recipes": rows, "voiceId": gate.VOICE, "modelId": gate.MODEL})
        write(preview, {"entries": simulated, "published": False,
                        "voiceId": gate.VOICE, "modelId": gate.MODEL})
        write(flag, {"enabled": False})
        public.write_bytes(b"UNCHANGED PUBLIC MANIFEST SENTINEL")

        def execute(data, *, candidate_mode=False, strict=False, missing=None):
            write(approvals, data)
            p = gate.load(preview)
            if missing is not None:
                p["entries"].pop(missing, None)
            write(preview, p)
            args = ["test-release-guard"]
            if candidate_mode:
                args.append("--candidate")
            if strict:
                args.append("--strict")
            with patch.object(sys, "argv", args):
                gate.main()
            return gate.load(summary)

        old = {key: getattr(gate, key) for key in (
            "PLAN", "PREVIEW", "APPROVALS", "REPORT", "CANDIDATE", "FLAG", "PUBLIC"
        )}
        with patch.multiple(gate, PLAN=plan, PREVIEW=preview,
                            APPROVALS=approvals, REPORT=summary,
                            CANDIDATE=candidate, FLAG=flag, PUBLIC=public), \
             patch.object(gate, "valid_audio", simulated_audio):
            no_approval = execute({})
            expect(no_approval["completeTechnicalQuestionSets"] == 150,
                   "Synthetic technical coverage fixture should be 150")
            expect(no_approval["humanApprovedQuestionSets"] == 0,
                   "Absent human approvals must keep 0 approved question sets")
            expect(not no_approval["readyForPrivateReleaseCandidate"],
                   "Empty approval map cannot release")

            no_reviewer = dict(audit, reviewerName="")
            expect(not execute(no_reviewer)["readyForPrivateReleaseCandidate"],
                   "Unnamed review must fail")
            no_attestation = dict(audit, selfAttestedHumanHearing=False)
            expect(not execute(no_attestation)["readyForPrivateReleaseCandidate"],
                   "No explicit listening attestation must fail")
            wrong_scope = dict(audit, scope="PUBLIC_KIDS")
            expect(not execute(wrong_scope)["readyForPrivateReleaseCandidate"],
                   "Other app/age scope must fail")

            one_phrase = next(iter(simulated))
            broken = dict(audit, approvedAudioShaByTextSha=dict(audit["approvedAudioShaByTextSha"]))
            broken["approvedAudioShaByTextSha"][sha(one_phrase)] = "0" * 64
            expect(not execute(broken)["readyForPrivateReleaseCandidate"],
                   "Changed MP3 approval SHA must fail")
            with patch.object(sys, "argv", ["test-release-guard", "--strict"]):
                write(approvals, broken)
                expect_refused(gate.main, SystemExit, "bad approval SHA in strict mode")

            defect = dict(audit, reportedIssuesByTextSha={
                sha(one_phrase): {
                    "audioSha": simulated[one_phrase]["sha256"],
                    "category": "pronunciation",
                    "note": "Synthetic regression – do not deploy",
                }
            })
            defective = execute(defect)
            expect(defective["reportedAudioDefects"] == 1
                   and not defective["readyForPrivateReleaseCandidate"],
                   "One Arabic pronunciation defect must block release")
            malformed = dict(audit, reportedIssuesByTextSha={
                sha(one_phrase): {"audioSha": "xxx", "category": "pronunciation"}
            })
            write(approvals, malformed)
            expect_refused(gate.main, RuntimeError, "malformed audio defect report")

            old_entries = gate.load(preview)["entries"]
            missing_phrase = next(iter(old_entries))
            incomplete = execute(audit, missing=missing_phrase)
            expect(incomplete["completeTechnicalQuestionSets"] < 150
                   and not incomplete["readyForPrivateReleaseCandidate"],
                   "Even with approval maps, missing source MP3 must block release")
            write(preview, {"entries": simulated, "published": False,
                            "voiceId": gate.VOICE, "modelId": gate.MODEL})
            write(flag, {"enabled": True})
            write(approvals, audit)
            expect_refused(gate.main, RuntimeError, "accidentally enabled live release flag")
            write(flag, {"enabled": False})

            # Test-positive is an ISOLATED fake fixture only. No real human approval.
            positive = execute(audit, candidate_mode=True)
            expect(positive["completeTechnicalQuestionSets"] == 150
                   and positive["humanApprovedQuestionSets"] == 150,
                   "Only a full explicitly attested (synthetic) fixture can pass")
            expect(positive["readyForPrivateReleaseCandidate"] is True
                   and positive["readyForLive"] is False,
                   "Passing the private candidate MUST NOT enable live release")
            staged = gate.load(candidate)
            expect(staged["live"] is False and staged["questionCount"] == 150
                   and staged["status"] == "review-only-requires-separate-kids-release",
                   "Even a privately passing test fixture cannot publish")
            expect(public.read_bytes() == b"UNCHANGED PUBLIC MANIFEST SENTINEL",
                   "Public manifest sentinel was unexpectedly modified")
            expect(gate.load(flag)["enabled"] is False,
                   "A passing test must not enable the release flag")
            # Regression after a previous (synthetic) candidate must remove the
            # obsolete file rather than leave an apparently approved artifact.
            write(approvals, broken)
            with patch.object(sys, "argv", ["test-release-guard", "--candidate"]):
                expect_refused(gate.main, SystemExit, "stale candidate after failed approval")
            expect(not candidate.exists(),
                   "An obsolete private candidate was not invalidated on regression")
            expect(public.read_bytes() == b"UNCHANGED PUBLIC MANIFEST SENTINEL",
                   "Bad approval unexpectedly changed the public manifest")

    print("PASS_KIDS_V4_150_GATE_REGRESSION " + json.dumps({
        "fixturesAreSyntheticNotHumanApproved": True,
        "realMp3CheckedReadOnly": 1,
        "canonicalQuestions": len(rows),
        "negativeScenarios": 10,
        "positiveTemporaryFixtureOnly": 1,
        "oldAudioBytesModified": False,
        "publicAppModified": False,
        "elevenLabsCreditsSpent": 0,
    }), flush=True)


if __name__ == "__main__":
    main()
