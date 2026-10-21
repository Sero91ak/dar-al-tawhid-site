#!/usr/bin/env python3
"""Zero-credit integration safety test of the exact Eleven v4 master dictionary.

Audits real production API payload including 10,099 lexemes and pinned Git
blob SHA. Never makes HTTP requests or launches any paid speech generation.
"""
import json
import os
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
    # Auditory owner rejected ʿIbādah; Ḥalāl/Ḥarām need hearing.
    # Never charge a second take for these exact words during bulk production.
    for spoken in ("Wir machen ʿIbādah.", "Ḥalāl und Ḥarām.", "Ḥarām."):
        assert t.source_requires_separate_pronunciation_approval(spoken), spoken
    assert not t.source_requires_separate_pronunciation_approval("Wie viele Gebete gibt es?")
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
    # Verify user spelling remains in the *quiz*; only provider TTS graphemes
    # resolve to exact-existing forms in the original 10,099-entry dictionary.
    compound=t.build_canonical_v4_payload("Bismi-llāh – im Namen Allahs.")
    assert compound["text"]=="Bismillāh – im Namen Allahs."
    assert compound["pronunciation_dictionary_locators"]==english["pronunciation_dictionary_locators"]
    supplication=t.build_canonical_v4_payload("In schāʾ Allāh – wenn Allah will.")
    assert supplication["text"]=="in sha' Allah – wenn Allah will."
    assert supplication["pronunciation_dictionary_locators"]==english["pronunciation_dictionary_locators"]

    fusha=t.build_canonical_v4_payload("الْقُرْآنُ وَالْإِيمَانُ.",language="ar")
    assert fusha["model_id"]=="eleven_v4" and fusha["language_code"]=="ar"
    assert "pronunciation_dictionary_locators" not in fusha
    assert fusha["text"]=="الْقُرْآنُ وَالْإِيمَانُ."
    assert fusha["apply_text_normalization"]=="off"
    must_fail(lambda:t.build_canonical_v4_payload("Der الْقُرْآنُ"),"V4_MIXED_LANGUAGE")
    must_fail(lambda:t.build_canonical_v4_payload("Muḥammad ﷺ wird erwähnt."),"V4_MIXED_LANGUAGE")
    must_fail(lambda:t.build_canonical_v4_payload("Mūsā عليه السلام lebte."),"V4_MIXED_LANGUAGE")
    must_fail(lambda:t.build_canonical_v4_payload("ﷺ",language="de"),"V4_GERMAN_SOURCE_CONTAINS_ARABIC")

    must_fail(lambda:t.build_canonical_v4_payload("الْقُرْآنُ",language="de"),"V4_GERMAN_SOURCE_CONTAINS_ARABIC")
    must_fail(lambda:t.build_canonical_v4_payload("القرآن",language="ar"),"V4_FUSHA")
    must_fail(lambda:t.build_canonical_v4_payload("Iman.",language="ar"),"V4_FUSHA")
    # Prove the REAL outgoing HTTP request (not merely an unused helper)
    # includes the correct dictionary+version, even in the paid code path.
    # The HTTP transport is mocked: ZERO credits, no network calls.
    prior_hold=t.PRONUNCIATION_HOLD
    prior_urlopen=t.urllib.request.urlopen
    prior_sample=os.environ.get('KIDS_V4_STAGE1_SAMPLE_ONLY')
    try:
        with tempfile.TemporaryDirectory() as folder:
            h=Path(folder)/"hold.json"
            h.write_text(json.dumps({"productionPaused":True,"dictionaryProviderVerified":False,"ownerRestartAuthorized":False}))
            t.PRONUNCIATION_HOLD=h
            must_fail(lambda:t.original_mp3("NO_REAL_KEY","Der Qurʾān."),"PRONUNCIATION_HOLD")
            h.write_text(json.dumps({"productionPaused":False,"dictionaryProviderVerified":True,"ownerRestartAuthorized":True,"authorizedNewOriginalsBeforeHearing":1,"humanListeningQualityGateReleased":False}))
            os.environ['KIDS_V4_STAGE1_SAMPLE_ONLY']='YES'
            calls=[]
            class PretendMp3:
                status=200
                headers={"Content-Type":"audio/mpeg","request-id":"TEST-FAKE-NOT-A-REAL-RECEIPT"}
                def __enter__(self):return self
                def __exit__(self,*_args):return False
                def read(self,_n):return b"ID3"+(b"x"*2000)
            def intercept(request,**kwargs):
                calls.append(request)
                return PretendMp3()
            t.urllib.request.urlopen=intercept
            audio,_=t.original_mp3("FAKE-TEST-KEY","Der Qurʾān lehrt den Īmān.")
            assert audio.startswith(b"ID3") and len(calls)==1
            assert calls[0].get_method()=="POST"
            sent=json.loads(calls[0].data.decode("utf-8"))
            assert sent==english and sent["language_code"]=="de"
            assert sent["pronunciation_dictionary_locators"]==english["pronunciation_dictionary_locators"]
            calls.clear()
            t.original_mp3("FAKE-TEST-KEY","الْقُرْآنُ وَالْإِيمَانُ.",language="ar")
            assert len(calls)==1
            arabic_sent=json.loads(calls[0].data.decode("utf-8"))
            assert arabic_sent==fusha and "pronunciation_dictionary_locators" not in arabic_sent
    finally:
        t.PRONUNCIATION_HOLD=prior_hold
        t.urllib.request.urlopen=prior_urlopen
        if prior_sample is None:
            os.environ.pop('KIDS_V4_STAGE1_SAMPLE_ONLY',None)
        else:
            os.environ['KIDS_V4_STAGE1_SAMPLE_ONLY']=prior_sample
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
    print("PASS_KIDS_V4_MASTER_10099_RULE_DICTIONARY_PAYLOAD; German Qurʾān/Īmān; exact owner Bismi/Schāʾ aliases; Arabic ﷺ blocked from German TTS; real HTTP mock; ZERO credits")


if __name__=="__main__":
    main()
