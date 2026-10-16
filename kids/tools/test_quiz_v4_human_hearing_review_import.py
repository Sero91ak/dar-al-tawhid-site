#!/usr/bin/env python3
"""Fail-closed, completely offline tests of the V4 human hearing import.

Synthetic test decisions MUST NEVER be committed as real human approvals.
Tests do not write to source, staging or public quiz.
"""
from __future__ import annotations
import copy
import json
import tempfile
from pathlib import Path

import import_quiz_v4_human_hearing_reviews as imp

def expect_reject(stage,files,label):
    try: imp.build_report(stage,files)
    except (RuntimeError,ValueError):return
    raise AssertionError("Unsafe fake hearing claim was accepted: "+label)

def main():
    stage=json.loads(imp.STAGED.read_text(encoding="utf-8"))
    index,eligible=imp.index_real_audio(stage)
    assert len(stage["questions"])==450
    assert len(index)>=275
    assert len(eligible["4-6"])>0 and len(eligible["7-10"])>0
    # A staged MP3 JSON digest is NOT trusted until actual original bytes are
    # verified. Reject changes to its hash or to its permitted file location.
    sample_id=next(qid for qid,q in stage["questions"].items() if q["parts"])
    sample_kind=next(iter(stage["questions"][sample_id]["parts"]))
    tampered=copy.deepcopy(stage)
    tampered["questions"][sample_id]["parts"][sample_kind]["sha256"]="0"*64
    try: imp.index_real_audio(tampered)
    except ValueError: pass
    else: raise AssertionError("Edited MP3 SHA was not caught by on-disk byte audit")
    tampered=copy.deepcopy(stage)
    tampered["questions"][sample_id]["parts"][sample_kind]["url"]="/etc/passwd"
    try: imp.index_real_audio(tampered)
    except ValueError: pass
    else: raise AssertionError("Unsafe MP3 path was accepted")
    young_text,young_sha=next(iter(eligible["4-6"].items()))
    older_text,older_sha=next(iter(eligible["7-10"].items()))
    def submission(group, approvals, issues=None):
        return {"schemaVersion":2,"scope":imp.SCOPES[group],
                "reviewerName":"Synthetic QA fixture; not human",
                "exportedAt":"2026-10-16T08:00:00+00:00",
                "selfAttestedHumanHearing":True,
                "approvedAudioShaByTextSha":approvals,
                "reportedIssuesByTextSha":issues or {}}
    demo_young=submission("4-6",{young_text:young_sha})
    demo_older=submission("7-10",{older_text:older_sha})
    assert imp.review_one(demo_young,"4-6",eligible["4-6"])["approvedClaims"]=={young_text:young_sha}
    assert imp.review_one(demo_older,"7-10",eligible["7-10"])["approvedClaims"]=={older_text:older_sha}
    assert imp.build_report(stage,{})["claimedApprovalClipCount"]==0
    assert imp.build_report(stage,{})["publicReleaseAllowed"] is False
    assert imp.build_report(stage,{})["humanApprovalVerifiedByImporter"] is False

    def invalid(payload,label):
        try:imp.review_one(payload,"4-6",eligible["4-6"])
        except ValueError:return
        raise AssertionError("Wrong reviewer JSON passed: "+label)
    bad=copy.deepcopy(demo_young)
    bad["approvedAudioShaByTextSha"][young_text]="0"*64
    invalid(bad,"tampered MP3 SHA")
    bad=copy.deepcopy(demo_young)
    bad["approvedAudioShaByTextSha"]={"a"*64:young_sha}
    invalid(bad,"unknown text")
    bad=copy.deepcopy(demo_young)
    bad["approvedAudioShaByTextSha"]={older_text:older_sha}
    if older_text not in eligible["4-6"]: invalid(bad,"wrong-age clip")
    bad=copy.deepcopy(demo_young)
    bad["scope"]=imp.SCOPES["7-10"]
    invalid(bad,"wrong age scope")
    bad=copy.deepcopy(demo_young)
    bad["schemaVersion"]=1
    invalid(bad,"wrong schema")
    bad=copy.deepcopy(demo_young)
    bad["reviewerName"]=""
    invalid(bad,"missing human reviewer label")
    bad=copy.deepcopy(demo_young)
    bad["selfAttestedHumanHearing"]=False
    invalid(bad,"no human claim")
    bad=copy.deepcopy(demo_young)
    bad["exportedAt"]="2099-01-01T00:00:00Z"
    invalid(bad,"future timestamp")
    bad=copy.deepcopy(demo_young)
    bad["reportedIssuesByTextSha"]={young_text:{
        "audioSha":young_sha,"category":"pronunciation","note":"test"
    }}
    invalid(bad,"same SHA both approval and issue")
    bad=copy.deepcopy(demo_young)
    bad["approvedAudioShaByTextSha"]={}
    bad["reportedIssuesByTextSha"]={young_text:{
        "audioSha":young_sha,"category":"unrecognized","note":"test"
    }}
    invalid(bad,"invalid category")
    bad=copy.deepcopy(demo_young)
    bad["approvedAudioShaByTextSha"]={}
    bad["reportedIssuesByTextSha"]={young_text:{
        "audioSha":young_sha,"category":"pronunciation","note":"a"*1501
    }}
    invalid(bad,"oversized note")

    # A reviewer note can contain names or sensitive details. No free-form
    # text must ever be copied into a versioned GitHub review result.
    private_note="CONTACT DETAILS MUST STAY LOCAL ONLY"
    issue_submission=submission("4-6",{}, {young_text:{
        "audioSha":young_sha,"category":"pronunciation",
        "note":private_note
    }})
    checked_issue=imp.review_one(issue_submission,"4-6",eligible["4-6"])
    assert checked_issue["reportedIssues"][young_text]["hasPrivateNote"] is True
    assert checked_issue["reportedIssues"][young_text]["noteLength"]==len(private_note)
    assert private_note not in json.dumps(checked_issue)
    assert "reviewerName" not in json.dumps(checked_issue)
    # A hostile JSON document with duplicate keys may silently overwrite a
    # good review decision in normal json.loads; fail before importing.
    with tempfile.TemporaryDirectory() as tmp:
        bad_json=Path(tmp)/"duplicate.json"
        bad_json.write_text('{"schemaVersion":2,"schemaVersion":1}',encoding="utf-8")
        try: imp.load(bad_json)
        except ValueError: pass
        else: raise AssertionError("Duplicate JSON keys were accepted")

    # Even a locally simulated 'yes' is never considered verified human QA.
    old_load=imp.load
    try:
        def synthetic_loader(path,max_size=imp.MAX_BYTES):
            return demo_young
        imp.load=synthetic_loader
        report=imp.build_report(stage,{"4-6":Path("synthetic-test-only.json")})
        assert report["claimedApprovalClipCount"]==1
        assert report["humanApprovalVerifiedByImporter"] is False
        assert report["publicPlaybackApprovedCount"]==0
        assert report["publicReleaseAllowed"] is False
        assert report["newElevenLabsCreditsSpent"]==0
        assert "Synthetic QA fixture" not in json.dumps(report)
    finally:
        imp.load=old_load
    print("PASS: review-only claims validated against 450 real V4 entries; "
          "12+ negative safety controls; no synthetic approval persisted; 0 credits")

if __name__=="__main__":main()
