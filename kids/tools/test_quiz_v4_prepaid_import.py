#!/usr/bin/env python3
"""Zero-credit regression test: import one REAL-FORMAT dummy MP3 to temp area.

Tests ZIP extraction, exact generation-id mapping, duration verification,
sha256, deduplication, and tamper blocking. Synthetic tone is never stored
in the product repo nor mistaken for a paid human voice recording.
"""
from __future__ import annotations
import importlib.util,json,shutil,subprocess,tempfile,zipfile
from pathlib import Path

REPO=Path(__file__).resolve().parents[2]
SRC=REPO/"kids/tools/import_quiz_v4_prepaid_flow_originals.py"
spec=importlib.util.spec_from_file_location("prepaid_import",SRC)
mod=importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)

def verify_real_zip_workflow_shell_syntax():
    """Reject the nested heredoc defect even when no paid ZIP is uploaded."""
    file=REPO/".github/workflows/kids-v4-prepaid-flow-restore.yml"
    lines=file.read_text(encoding="utf-8").splitlines()
    target="      - name: Import uploaded ZIP originals if present and update free MP3 preview"
    assert lines.count(target)==1,"real imported ZIP workflow step missing"
    index=lines.index(target)
    assert lines[index+1].strip()=="run: |","restoration step missing bash script"
    script=[]
    for line in lines[index+2:]:
        if line.startswith("      - ") or line.startswith("    - "):
            break
        if line.strip() and not line.startswith("          "):
            raise AssertionError("bad YAML indentation for paid ZIP restoration step")
        script.append(line[10:] if len(line)>=10 else "")
    bash=subprocess.run(["bash","-n"],input="\n".join(script)+"\n",
                         capture_output=True,text=True)
    assert bash.returncode==0,(
        "Broken ZIP import workflow shell syntax; paid audio restore could fail: "+
        bash.stderr)
    assert any("assert_quiz_v4_prepaid_postimport.py" in x for x in script),(
        "importer must validate full 450 private question mapping after real original ZIP")
    print("PASS: GitHub Action ZIP restore shell syntax accepted even with no uploaded MP3; 0 credits")

def main():
    verify_real_zip_workflow_shell_syntax()
    with tempfile.TemporaryDirectory(prefix="kids-v4-prepaid-flow-import-selftest-") as base:
        root=Path(base)
        prior=root/"kids/data/quiz-v4-batch-001-020-review.json"
        reg=root/"kids/data/quiz-v4-450-original-clip-registry.json"
        summary=root/"kids/data/quiz-v4-paid-flow-import-status.json"
        out=root/"kids/assets/kids-quiz-audio/v4-paid-flow-original-review"
        folder=root/"downloaded"
        folder.mkdir(parents=True)
        prior.parent.mkdir(parents=True)
        shutil.copy2(REPO/"kids/data/quiz-v4-batch-001-020-review.json",prior)
        reg.write_text(json.dumps({
            "schemaVersion":1,"scope":"KIDS_V4_450_REVIEW_ONLY",
            "voiceId":mod.VOICE,"modelId":mod.MODEL,"live":False,
            "textClips":{},"generationClips":{}
        })+"\n",encoding="utf-8")
        mod.ROOT=root;mod.PRIOR=prior;mod.REG=reg;mod.REPORT=summary;mod.OUT=out
        takes=mod.original_metadata()
        old=next(v for v in takes.values() if v["questionId"]=="kids-quiz-001" and v["kind"]=="question")
        gid=old["generationId"]
        audio=folder/(gid+".mp3")
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
            "-f","lavfi","-i","sine=frequency=444:sample_rate=44100",
            "-t",str(old["durationExpected"]),
            "-c:a","libmp3lame","-b:a","48k",str(audio)],check=True)
        zip_path=root/"original-upload.zip"
        with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_DEFLATED) as z:
            z.write(audio,audio.name)
        with tempfile.TemporaryDirectory(prefix="kids-v4-zip-test-") as tmp:
            dest=Path(tmp)
            mapping=mod.extract_safe(zip_path,dest)
            if mapping:raise RuntimeError("Unexpected extra mapping from simple ZIP")
            first=mod.run(dest)
            assert first["importedPriorPaidGenerations"]==1,first
            assert first["remainingPriorPaidGenerations"]==55,first
            registry=json.loads(reg.read_text())
            assert gid in registry["generationClips"],"Real MP3 was not stored"
            assert old["text"] in registry["textClips"],"Original text key not restored"
            assert registry["generationClips"][gid]["audioListeningApproved"] is False
            clip=registry["generationClips"][gid]
            assert clip["source"]=="manual-prepaid-elevenlabs-flow-export-linked-by-generation-id-and-duration"
            assert clip["sourceOriginalityCryptographicallyConfirmed"] is False
            assert clip["requiresHumanSourceAndPronunciationVerification"] is True
            assert clip["audioListeningApproved"] is False
            assert clip["originalGenerationId"]==gid
            assert clip["textSha256"]==mod.hashlib.sha256(old["text"].encode()).hexdigest()
            assert clip["url"].startswith("/kids/assets/kids-quiz-audio/v4-paid-flow-original-review/")
            assert "sine" not in str(clip) # synthetic test MP3 must never be described as a genuine voice
            again=mod.run(dest)
            assert again["importedPriorPaidGenerations"]==1
            assert len(again["alreadyImportedIds"])==1
            # Same generation ID, different bytes MUST NOT replace a paid original.
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                "-f","lavfi","-i","sine=frequency=555:sample_rate=44100",
                "-t",str(old["durationExpected"]),
                "-c:a","libmp3lame","-b:a","48k",str(audio)],check=True)
            shutil.copyfile(audio,dest/audio.name)
            try:mod.run(dest)
            except RuntimeError as e:
                assert "different MP3" in str(e),str(e)
            else:raise AssertionError("Tampered already-paid audio accepted")
        print("PASS_V4_PREPAID_IMPORT_SELFTEST: 56 known IDs, 1 imported MP3, 55 missing, idempotent, tampering rejected, 0 TTS",flush=True)

if __name__=="__main__":main()
