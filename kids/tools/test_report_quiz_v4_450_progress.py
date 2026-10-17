#!/usr/bin/env python3
"""Zero-credit regression tests for real-byte V4 quiz progress accounting."""
from __future__ import annotations
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

TARGET=Path(__file__).with_name("report_quiz_v4_450_progress.py")
spec=importlib.util.spec_from_file_location("kids_v4_progress",TARGET)
assert spec and spec.loader
progress=importlib.util.module_from_spec(spec)
spec.loader.exec_module(progress)
VOICE="DkU7j9uO4ZEtLD2iRZSH"

class VerifiedOriginalBytesTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix="kids-v4-zero-credit-qa-")
        self.root=Path(self.temp.name)
        self.old_root=progress.ROOT
        progress.ROOT=self.root
        self.assets=self.root/"kids/assets/kids-quiz-audio/v4-curated450-review"
        self.assets.mkdir(parents=True)
        self.text="Wer hat uns erschaffen?"
        self.binary=b"ID3"+bytes([0])*2400
        self.file=self.assets/"exact-original.mp3"
        self.file.write_bytes(self.binary)
        self.record={
            "url":"/kids/assets/kids-quiz-audio/v4-curated450-review/exact-original.mp3",
            "sha256":hashlib.sha256(self.binary).hexdigest(),
            "bytes":len(self.binary),
            "textSha256":hashlib.sha256(self.text.encode("utf-8")).hexdigest(),
            "voiceId":VOICE,"modelId":"eleven_v4",
        }
    def tearDown(self):
        progress.ROOT=self.old_root
        self.temp.cleanup()
    def data(self):
        return {"textClips":{self.text:dict(self.record)},"generationClips":{}}
    def test_real_matching_bytes_count(self):
        obj=progress.validated_audio_registry(self.data())
        self.assertEqual(list(obj["textClips"]),[self.text])
    def test_corrupt_bytes_are_rejected_even_with_old_registry(self):
        self.file.write_bytes(self.binary[:-1]+b"X")
        with self.assertRaisesRegex(RuntimeError,"Corrupt or unverified"):
            progress.validated_audio_registry(self.data())
    def test_missing_file_is_rejected(self):
        self.file.unlink()
        with self.assertRaisesRegex(RuntimeError,"Missing/unsafe"):
            progress.validated_audio_registry(self.data())
    def test_changed_speech_text_is_rejected(self):
        data=self.data()
        data["textClips"][self.text]["textSha256"]="0"*64
        with self.assertRaisesRegex(RuntimeError,"Spoken-text SHA"):
            progress.validated_audio_registry(data)
    def test_wrong_voice_is_rejected(self):
        data=self.data()
        data["textClips"][self.text]["voiceId"]="wrong"
        with self.assertRaisesRegex(RuntimeError,"Unapproved voice"):
            progress.validated_audio_registry(data)
    def test_path_escape_is_rejected(self):
        data=self.data()
        data["textClips"][self.text]["url"]="/kids/assets/kids-quiz-audio/../../outside.mp3"
        with self.assertRaisesRegex(RuntimeError,"Missing/unsafe"):
            progress.validated_audio_registry(data)
    def test_incorrect_prepaid_generation_mapping_is_rejected(self):
        gen="example-paid-generation"
        data={"textClips":{},"generationClips":{gen:{**self.record,"originalGenerationId":"another-generation"}}}
        with self.assertRaisesRegex(RuntimeError,"Paid Flow generation"):
            progress.validated_audio_registry(data)
    def test_prepaid_original_verified_if_identity_matches(self):
        gen="example-paid-generation"
        data={"textClips":{},"generationClips":{gen:{**self.record,"originalGenerationId":gen}}}
        self.assertEqual(list(progress.validated_audio_registry(data)["generationClips"]),[gen])

if __name__=="__main__":
    unittest.main()
