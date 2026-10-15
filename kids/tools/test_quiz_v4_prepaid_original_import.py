#!/usr/bin/env python3
"""Read-only integrity regression for import of previously paid V4 originals.

No ElevenLabs API, no speech generation, no public app mutation, no test MP3
introduced into the original audio registry or published KIDS directories.
"""
from __future__ import annotations
import json
import tempfile
import zipfile
from pathlib import Path
from import_quiz_v4_prepaid_flow_originals import original_metadata, scan_files, extract_safe, run, ROOT, REG

def expected_failure(action,fragment):
    try:
        action()
    except RuntimeError as exc:
        if fragment not in str(exc):
            raise AssertionError("Unexpected safeguard error: "+str(exc)) from exc
    else:
        raise AssertionError("Unsafe original import action was not rejected")

def main():
    takes=original_metadata()
    assert len(takes)==56, "Exactly 56 historical ElevenLabs original generation IDs"
    registry=json.loads(REG.read_text(encoding="utf-8"))
    original_ids=set(registry.get("generationClips",{}))
    assert original_ids <= set(takes), "Unknown original generation ID in registry"
    with tempfile.TemporaryDirectory(prefix="tawhid-kids-v4-import-guard-") as td:
        folder=Path(td)
        ids=list(sorted(takes))
        sample=folder/"original.mp3"
        sample.write_bytes(b"unused bytes - never entered as original audio")
        expected_failure(
            lambda: scan_files(folder,{ids[0]:sample.name,ids[1]:sample.name},takes),
            "A single MP3 cannot represent two separate paid generation IDs")
        expected_failure(
            lambda: scan_files(folder,{"INVALID_ORIGINAL_GENERATION":sample.name},takes),
            "unknown already-paid generation ID")
        badzip=folder/"path-traversal.zip"
        with zipfile.ZipFile(badzip,"w") as z:
            z.writestr("../evil.mp3",b"invalid test only")
        expected_failure(
            lambda: extract_safe(badzip,folder/"outside"),
            "unsafe path")
        (folder/"outside").mkdir(exist_ok=True)
        report=run(folder/"outside",dry=True)
        assert report["newCreditsSpent"]==0
        assert report["reviewOnly"] is True and report["livePublicationAllowed"] is False
        assert report["importedPriorPaidGenerations"]==len(original_ids)
        assert report["remainingPriorPaidGenerations"]==56-len(original_ids)
        assert set(report["remainingGenerationIds"])==set(takes)-original_ids
        assert report.get("humanOriginalSourceAndPronunciationVerificationRequired") is True
    print("PASS_KIDS_V4_PAID_ORIGINAL_IMPORT_AUDIT "+json.dumps({
        "alreadyImportedOriginals":len(original_ids),
        "remainingPreviouslyPaidOriginals":56-len(original_ids),
        "securityGuardsTested":3,
        "newSpeechCredits":0,"publicReleaseAllowed":False,
        "oldAudioBytesModified":False
    }),flush=True)

if __name__=="__main__":
    main()
