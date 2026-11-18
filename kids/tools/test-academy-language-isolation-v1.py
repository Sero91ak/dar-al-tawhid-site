#!/usr/bin/env python3
"""Regression checks: German Academy audio must never import Arabic master PLS."""
from __future__ import annotations

import importlib.util
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
TOOLS = ROOT / "kids" / "tools"
sys.path.insert(0, str(TOOLS))
import voice_text  # noqa: E402


def load_stage():
    spec = importlib.util.spec_from_file_location(
        "academy_v9_stage", TOOLS / "build-academy-v9-staging.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    stage = load_stage()
    previous = voice_text._MASTER_RULE_CACHE
    try:
        # Reproduce the documented collision without depending on changing PLS data.
        voice_text._MASTER_RULE_CACHE = [("Nur", "النور"), ("Ṣaḥīḥ", "صحيح")]
        assert "النور" in voice_text.prepare_kids_voice_text("Nur Allah ist Einer.")
        assert stage.prepare_academy_tts_text("Nur Allah ist Einer.") == "Nur Allah ist Einer."
        assert stage.prepare_academy_tts_text("Ich sage nur die Wahrheit.") == "Ich sage nur die Wahrheit."
        assert stage.prepare_academy_tts_text("Ṣaḥīḥ ist ein Begriff.") == "Ṣaḥīḥ ist ein Begriff."
        assert stage.prepare_academy_tts_text(
            "Sūrat at-Tawbah 9:119 lehrt Wahrhaftigkeit."
        ) == "Sūrat at-Tawbah lehrt Wahrhaftigkeit."

        for mixed in (
            "Das arabische Wort غِيبَة ist wichtig.",
            "Der Prophet ﷺ sagte etwas.",
            "Allah ﷻ lehrt uns.",
        ):
            try:
                stage.prepare_academy_tts_text(mixed)
            except RuntimeError as error:
                assert "language isolation" in str(error)
            else:
                raise AssertionError("Mixed-script TTS must be blocked: " + mixed)
    finally:
        voice_text._MASTER_RULE_CACHE = previous
    print("PASS: Academy V4 DE preparation is isolated; mixed DE/AR blocks before billing.")


if __name__ == "__main__":
    main()
