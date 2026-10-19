#!/usr/bin/env python3
"""Zero-credit integration safety test of the exact Eleven v4 master dictionary.

Audits real production API payload including 10,099 lexemes and pinned Git
blob SHA. Never makes HTTP requests or launches any paid speech generation.
"""
import json
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import generate_quiz_v4_450_paid_batch02 as t


def must_fail(callback,marker):
    try:
        callback()
    except RuntimeError as error:
        assert marker in str(error),(marker,str(error))
        return
    raise AssertionError("unexpectedly accepted invalid master/Fuṣḥā input: "+marker)


def main():
    english=t.build_canonical_v4_payload("Der Qurʾān lehrt den Īmān.",language="de")
    assert english=={
        "text":"Der Qurʾān lehrt den Īmān.",
        "model_id":"eleven_v4",
        "language_code":"de",
        "apply_text_normalization":"off",
        "pronunciation_dictionary_locators":[{
            "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
            "version_id":"wSzgkGpAwEDiTak8DApc"}]
    }
    assert t.build_canonical_v4_payload("Angeben.")["pronunciation_dictionary_locators"]==english["pronunciation_dictionary_locators"]
    assert t.build_canonical_v4_payload("Iman.")["language_code"]=="de"
    fusha=t.build_canonical_v4_payload("الْقُرْآنُ وَالْإِيمَانُ.",language="ar")
    assert fusha["model_id"]=="eleven_v4" and fusha["language_code"]=="ar"
    assert "pronunciation_dictionary_locators" not in fusha
    assert fusha["text"]=="الْقُرْآنُ وَالْإِيمَانُ."
    assert fusha["apply_text_normalization"]=="off"
    must_fail(lambda:t.build_canonical_v4_payload("Der الْقُرْآنُ"),"V4_MIXED_LANGUAGE")
    must_fail(lambda:t.build_canonical_v4_payload("الْقُرْآنُ",language="de"),"V4_GERMAN_SOURCE_CONTAINS_ARABIC")
    must_fail(lambda:t.build_canonical_v4_payload("القرآن",language="ar"),"V4_FUSHA")
    must_fail(lambda:t.build_canonical_v4_payload("Iman.",language="ar"),"V4_FUSHA")
    must_fail(lambda:t.original_mp3("NO_REAL_KEY","Der Qurʾān."),"PRONUNCIATION_HOLD")
    old=t.PRONUNCIATION
    try:
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"tampered.json"
            contract=json.loads(old.read_text(encoding="utf-8"))
            contract["pronunciationDictionary"]["versionId"]="wrong-dictionary-version"
            p.write_text(json.dumps(contract,ensure_ascii=False),encoding="utf-8")
            t.PRONUNCIATION=p
            must_fail(lambda:t.build_canonical_v4_payload("Der Qurʾān."),"V4_MASTER_DICTIONARY_ID_OR_VERSION_MISMATCH")
            contract["pronunciationDictionary"]["versionId"]="wSzgkGpAwEDiTak8DApc"
            contract["pronunciationDictionary"]["gitBlobSha"]="0"*40
            p.write_text(json.dumps(contract,ensure_ascii=False),encoding="utf-8")
            must_fail(lambda:t.build_canonical_v4_payload("Der Qurʾān."),"V4_MASTER_PLS_GIT_SHA_MISMATCH")
            contract["pronunciationDictionary"]["gitBlobSha"]="cfd8c24d78ec4a8bde85ee74b75fdb4faa07358a"
            contract["pronunciationDictionary"]["ruleCount"]=10098
            p.write_text(json.dumps(contract,ensure_ascii=False),encoding="utf-8")
            must_fail(lambda:t.build_canonical_v4_payload("Der Qurʾān."),"V4_MASTER_PLS_RULE_COUNT_MISMATCH")
    finally:
        t.PRONUNCIATION=old
    print("PASS_KIDS_V4_MASTER_10099_RULE_DICTIONARY_PAYLOAD; German Qurʾān/Īmān; vocalized native Fuṣḥā; mixed text rejection; production HOLD; ZERO credits")


if __name__=="__main__":
    main()
