#!/usr/bin/env python3
from __future__ import annotations
import ast, json, re, sys
from pathlib import Path

ARABIC_RE=re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]")
LATIN_RE=re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]")

def fail(msg):
    print("VOICE-STUDIO-V2 VALIDATION FAILED:",msg,file=sys.stderr)
    raise SystemExit(1)

def load(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception as e:
        fail(f"{path}: {e}")

def prepare(text,rules):
    rules=sorted(rules,key=lambda r:len(str(r.get("string_to_replace",""))),reverse=True)
    honorific_keys={"salawat_prophet","radiyallahu_anhu","radiyallahu_anha","radiyallahu_anhuma","radiyallahu_anhum"}
    honorific_tts={}
    honorific_forms={k:[] for k in honorific_keys}
    for r in rules:
        key=str(r.get("audio_lock_key",""))
        if key in honorific_keys:
            if r.get("tts_text") and key not in honorific_tts:
                honorific_tts[key]=str(r.get("tts_text"))
            if r.get("string_to_replace"):
                honorific_forms[key].append(str(r.get("string_to_replace")))
    for key in honorific_forms:
        honorific_forms[key]=sorted(set(honorific_forms[key]),key=len,reverse=True)

    def has_explicit_honorific(pos):
        tail=str(text or "")[pos:].lstrip()
        tail=tail.lstrip(".,،;؛:!?؟…·-–—()[]{}«»\\\"“”„‘’ ")
        for forms in honorific_forms.values():
            if any(tail.startswith(form) for form in forms):
                return True
        return False

    pos=0;out=[]
    while pos<len(text):
        hit=None
        for r in rules:
            needle=str(r.get("string_to_replace",""))
            if needle and text.startswith(needle,pos):
                hit=r;break
        if not hit:
            out.append(text[pos]);pos+=1;continue
        needle=str(hit.get("string_to_replace",""))
        out.append(str(hit.get("tts_text") or hit.get("alias") or needle))
        next_pos=pos+len(needle)
        required_key=str(hit.get("required_honorific_key",""))
        if required_key and required_key in honorific_tts and not has_explicit_honorific(next_pos):
            out.append(" "+honorific_tts[required_key])
        pos=next_pos
    return "".join(out)

def classify(text):
    s=str(text or "").strip()
    low=s.casefold()
    if "?" in s or "؟" in s:
        return "question"
    if any(x in low for x in ["duʿāʾ","dua","wir bitten allah","bitten wir allah"]):
        return "dua"
    if any(x in low for x in ["achtung","warnung","verboten","sehr ernst","gefahr"]):
        return "serious"
    if any(x in low for x in ["ganz ruhig","sanft","behutsam","schritt für schritt"]):
        return "gentle"
    if any(x in low for x in ["eines tages","geschichte","komm, wir entdecken","es war einmal"]):
        return "kids_story"
    if any(x in low for x in ["heute lernen wir","kids","kinder","gemeinsam lernen"]):
        return "kids_lesson"
    words=len(re.findall(r"\S+",s))
    if s.count(",")>=3 or s.count(";")>=2 or ":" in s or (s.count(",")>=1 and " und " in low and words<=20):
        return "list"
    if any(x in low for x in ["bedeutet","lernen wir","erklärt","grundlage","pflicht","wir beten","wir finden","liest","bereiten wir uns","folgen"]):
        return "teaching"
    return "narration"

def classify_segment(text,doc_mode,requested="auto"):
    requested=str(requested or "auto").strip()
    if requested!="auto":
        return requested
    local=classify(text)
    if local!="narration":
        return local
    if doc_mode in {"kids_story","kids_lesson","teaching","gentle","serious","dua","list"}:
        return doc_mode
    return "narration"

def main():
    if len(sys.argv)!=5:
        fail("usage: validate-v2.py pronunciation-rules.json voice-production-profile.json local-engine.py voice-regression-fixtures.json")
    pron,profile,engine_path,fixtures_path=sys.argv[1:]
    lib=load(pron); prof=load(profile); fixtures=load(fixtures_path)
    rules=lib.get("rules") or []
    if len(rules)<3700: fail(f"too few pronunciation rules: {len(rules)}")
    if int(lib.get("counts",{}).get("canonicalTerms",0))<900: fail("canonical term count regressed")

    seen={}
    ipa_groups={}
    for idx,r in enumerate(rules):
        needle=str(r.get("string_to_replace",""))
        if not needle: fail(f"rule {idx} has empty string_to_replace")
        tts=str(r.get("tts_text",""))
        if not tts or not ARABIC_RE.search(tts): fail(f"rule has no native Arabic tts_text: {needle}")
        if LATIN_RE.search(tts): fail(f"Arabic tts_text contains Latin letters: {needle} -> {tts}")
        if r.get("tts_language")!="ar": fail(f"wrong tts_language for {needle}")
        if needle in seen and seen[needle]!=tts: fail(f"conflicting duplicate rule for {needle}")
        seen[needle]=tts
        ipa=str(r.get("ipa",""))
        ipa_groups.setdefault(ipa,set()).add(tts)

    conflicts=[(ipa,vals) for ipa,vals in ipa_groups.items() if ipa and len(vals)>1]
    if conflicts:
        ipa,vals=conflicts[0]
        fail(f"one pronunciation group has multiple TTS forms: {ipa} -> {sorted(vals)[:3]}")

    required_modes={"narration","kids_story","kids_lesson","teaching","gentle","serious","question","list","dua"}
    modes=set((prof.get("prosody") or {}).get("modes",{}))
    missing=required_modes-modes
    if missing: fail("missing prosody modes: "+", ".join(sorted(missing)))
    if int(prof.get("schemaVersion",0))<7: fail("voice profile schemaVersion must be >=7")
    qa=prof.get("qualityAssurance") or {}
    if int(qa.get("maxRenderAttempts",0))<2: fail("QA maxRenderAttempts must be >=2")
    if int(qa.get("maxInternalSilenceMsWithPunctuation",0))<900: fail("QA punctuation-pause guard missing")
    if int(qa.get("minSpeechRateWords",0))<4: fail("QA speech-rate minimum sample size missing")
    if not isinstance(qa.get("minSpeechRateWpmByMode"),dict): fail("QA speech-rate mode thresholds missing")
    if int(qa.get("maxSustainedEnergyPlateauMs",0))<700: fail("QA sustained-hold guard missing")
    if not bool(qa.get("rescueLongSegments")): fail("QA long-segment rescue must be enabled")
    if not bool(qa.get("coreAudioLockRequiredForRepeatability")): fail("core audio-lock repeatability policy missing")
    if not bool(qa.get("coreAudioCandidateSinglePerRender")): fail("core audio single-candidate policy missing")
    if not bool(qa.get("coreAudioConfirmedNeverResynthesized")): fail("confirmed core audio must never be resynthesized")

    core=prof.get("corePronunciationLocks") or {}
    expected_core={
        "quran":"قُرْآنْ",
        "al_quran":"الْقُرْآنْ",
        "tawhid":"تَوْحِيدْ",
        "iman":"إِيمَانْ",
        "ihsan":"إِحْسَانْ",
        "abu_bakr":"أَبُو بَكْرْ",
        "abu_bakr_siddiq":"أَبُو بَكْرٍ الصِّدِّيقْ",
        "umar":"عُمَرْ",
        "umar_ibn_al_khattab":"عُمَرُ بْنُ الْخَطَّابْ",
        "salawat_prophet":"صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
        "radiyallahu_anhu":"رَضِيَ اللَّهُ عَنْهُ",
        "radiyallahu_anha":"رَضِيَ اللَّهُ عَنْهَا",
        "radiyallahu_anhuma":"رَضِيَ اللَّهُ عَنْهُمَا",
        "radiyallahu_anhum":"رَضِيَ اللَّهُ عَنْهُمْ",
    }
    if set((core.get("keys") or {}).keys())!=set(expected_core):
        fail("core pronunciation-lock keys are incomplete")
    audio_lock_variants=0
    seen_core={k:0 for k in expected_core}
    for r in rules:
        key=str(r.get("audio_lock_key",""))
        if not key:
            continue
        audio_lock_variants+=1
        if key not in expected_core:
            fail(f"unknown audio_lock_key: {key}")
        if str(r.get("audio_lock_policy",""))!="CONFIRMED_WAV":
            fail(f"wrong audio lock policy for {r.get('string_to_replace')}")
        if str(r.get("tts_text",""))!=expected_core[key]:
            fail(f"wrong locked TTS form for {r.get('string_to_replace')}: {r.get('tts_text')}")
        seen_core[key]+=1
    missing_core=[k for k,v in seen_core.items() if v<4]
    if missing_core:
        fail("too few audio-locked variants for: "+", ".join(sorted(missing_core)))
    for required_alias in ("Omar","omar","Umar ibn al-Chattab","Omar ibn al-Chattab","Omar ibn al-Khattab"):
        if required_alias not in seen:
            fail("missing common name alias: "+required_alias)

    honorific_policy=prof.get("requiredHonorifics") or {}
    if not honorific_policy.get("enabled"): fail("required honorific policy must be enabled")
    if not honorific_policy.get("duplicateProtection"): fail("required honorific duplicate protection missing")
    if not bool(qa.get("requiredHonorificRegression")): fail("required honorific regression QA missing")
    if not bool(qa.get("duplicateHonorificGuard")): fail("duplicate honorific QA guard missing")
    if not bool(qa.get("pronunciationLearningRegression")): fail("pronunciation learning regression QA missing")
    if not bool(qa.get("onlineRuleValidation")): fail("online rule validation QA missing")
    if not bool(qa.get("learnedRuleRequiresConfirmedAudio")): fail("learned rule confirmed-audio QA missing")

    learning=prof.get("pronunciationLearning") or {}
    required_learning_flags=(
        "enabled","clickableDetectedTerms","textSelectionCapture","manualUnknownTermEntry",
        "manualArabicTtsRequiredWhenNoRuleFound","isolatedPreviewBeforeSave",
        "explicitHumanConfirmationRequired","confirmedPreviewBecomesPersistentAudioLock",
        "userRuleOverridesBaseRule","onlineRulesNeverAutoPromoteToMaster","vocabularyExpandsPersistently"
    )
    for flag in required_learning_flags:
        if not learning.get(flag): fail("pronunciation learning policy missing: "+flag)

    required_name_rules=[r for r in rules if r.get("required_honorific_key")]
    male_required=[r for r in required_name_rules if r.get("required_honorific_key")=="radiyallahu_anhu"]
    female_required=[r for r in required_name_rules if r.get("required_honorific_key")=="radiyallahu_anha"]
    prophet_required=[r for r in required_name_rules if r.get("required_honorific_key")=="salawat_prophet"]
    if len(required_name_rules)<340: fail(f"too few required-honorific name variants: {len(required_name_rules)}")
    if len(male_required)<250: fail(f"too few male Ṣaḥābah honorific variants: {len(male_required)}")
    if len(female_required)<60: fail(f"too few female Ṣaḥābiyyāt honorific variants: {len(female_required)}")
    if len(prophet_required)<4: fail(f"too few Prophet Muḥammad honorific variants: {len(prophet_required)}")

    salawat=expected_core["salawat_prophet"]
    anhu=expected_core["radiyallahu_anhu"]
    anha=expected_core["radiyallahu_anha"]
    honorific_cases=[
        ("prophet-auto","Muhammad sagte",salawat,1),
        ("prophet-explicit","Muhammad ﷺ sagte",salawat,1),
        ("sahabi-auto","Omar ibn al-Chattab sagte",anhu,1),
        ("sahabi-explicit","Abū Bakr رضي الله عنه sagte",anhu,1),
        ("sahabiyyah-auto","ʿĀʾišah bint Abī Bakr berichtete",anha,1),
    ]
    for cid,source,fragment,count in honorific_cases:
        speech=prepare(source,rules)
        if speech.count(fragment)!=count:
            fail(f"honorific regression {cid}: expected {count} x {fragment}, got {speech}")

    engine_source=Path(engine_path).read_text(encoding="utf-8")
    try:
        tree=ast.parse(engine_source)
    except SyntaxError as e:
        fail(f"engine syntax error: {e}")
    functions={n.name for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}
    for required in {"resolve_segment_prosody","split_rescue_chunks","audio_quality_metrics","render_segment_with_qa","join_rendered_segments","audio_lock_key_for_chunk","split_audio_locked_spans","discard_pending_audio_locks","stage_pending_audio_locks","confirm_pending_audio_locks","load_locked_wav","source_has_honorific","rebuild_runtime_rules","pronunciation_search","sync_online_pronunciation_library","create_learning_preview","confirm_learning_preview","save_user_override","learning_state"}:
        if required not in functions: fail(f"engine missing production function: {required}")
    for marker in {"excessive_internal_pause","suspicious_sustained_hold","speech_rate_too_slow","/confirm-core-audio","audio_lock_pending","session_audio_locks","required_honorific_key","honorificPolicyEnabled","/learning/search","/learning/sync","/learning/preview","/learning/confirm","USER_OVERRIDES_FILE","ONLINE_LIBRARY_CACHE","CONFIRMED_WAV"}:
        if marker not in engine_source: fail(f"engine missing QA/audio-lock marker: {marker}")

    for case in fixtures.get("cases",[]):
        speech=prepare(case["text"],rules)
        for expected in case.get("expectedTts",[]):
            # Fixtures use stable fragments, because full generated diacritics can be richer.
            compact=re.sub(r"[\u064b-\u065f\u0670]","",speech)
            exp=re.sub(r"[\u064b-\u065f\u0670]","",expected)
            if exp not in compact:
                fail(f"fixture {case['id']} missing TTS fragment {expected}; got {speech}")
        mode=classify(case["text"])
        if mode!=case.get("expectedMode"):
            fail(f"fixture {case['id']} mode {mode} != {case.get('expectedMode')}")

    segment_cases=fixtures.get("segmentCases",[])
    if len(segment_cases)<5: fail("too few sentence-level prosody regression cases")
    for case in segment_cases:
        doc_mode=classify(case["documentText"])
        if doc_mode!=case.get("expectedDocumentMode"):
            fail(f"segment fixture {case['id']} document mode {doc_mode} != {case.get('expectedDocumentMode')}")
        mode=classify_segment(case["segmentText"],doc_mode,case.get("requested","auto"))
        if mode!=case.get("expectedSegmentMode"):
            fail(f"segment fixture {case['id']} mode {mode} != {case.get('expectedSegmentMode')}")

    masters=[r for r in rules if r.get("voice_lock")=="MASTER"]
    if len(masters)<20: fail(f"too few MASTER pronunciation variants: {len(masters)}")

    print(json.dumps({
        "ok":True,
        "rules":len(rules),
        "pronunciationGroups":len(ipa_groups),
        "masterVariants":len(masters),
        "regressionCases":len(fixtures.get("cases",[])),
        "segmentRegressionCases":len(fixtures.get("segmentCases",[])),
        "audioLockVariants":audio_lock_variants,
        "audioLockKeys":sorted(k for k,v in seen_core.items() if v),
        "requiredHonorificNameVariants":len(required_name_rules),
        "requiredHonorificMaleVariants":len(male_required),
        "requiredHonorificFemaleVariants":len(female_required),
        "requiredHonorificProphetVariants":len(prophet_required),
        "pronunciationLearning":True,
        "profileSchema":prof.get("schemaVersion")
    },ensure_ascii=False))

if __name__=="__main__":
    main()
