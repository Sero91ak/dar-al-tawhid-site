#!/usr/bin/env python3
"""Regression checks: visible source citations must not be spoken as numbers."""
import importlib.util
import pathlib

SCRIPT = pathlib.Path(__file__).with_name("build-academy-v9-staging.py")
SPEC = importlib.util.spec_from_file_location("academy_v9_staging", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

CASES = {
    "Sūrat at-Tawbah 9:119": "Sūrat at-Tawbah",
    "Ṣaḥīḥ Muslim 2607a": "Ṣaḥīḥ Muslim",
    "Ṣaḥīḥ Muslim, Nr. 2607a": "Ṣaḥīḥ Muslim,",
    "Qurʾān 9:119 und Ṣaḥīḥ Muslim 2607a": "Qurʾān und Ṣaḥīḥ Muslim",
    "Das Verhältnis ist 2:1.": "Das Verhältnis ist 2: 1.",
    "Der Unterricht beginnt um 10:30.": "Der Unterricht beginnt um 10: 30.",
}
for source, expected in CASES.items():
    actual = MODULE.prepare_academy_spoken_text(source)
    if actual != expected:
        raise SystemExit(f"citation speech regression: {source!r} -> {actual!r}; expected {expected!r}")

print(f"Academy spoken-source citation checks passed: {len(CASES)}")
