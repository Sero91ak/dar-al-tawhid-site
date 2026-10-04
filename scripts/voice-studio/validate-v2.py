#!/usr/bin/env python3
from __future__ import annotations
import ast, importlib.util, json, re, sys, shutil, subprocess
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
    master_path=Path(pron).with_name("islamic-master-library.json")
    if not master_path.exists():
        fail("islamic-master-library.json missing next to pronunciation-rules.json")
    master=load(master_path)
    story_refs={
        "muhammad":("story-reference-muhammad-2026-10-04.json","d6d7c21c76211def9e1fc6ae1acae0de92b830907218715418eeef3df6b2ad1c",1000),
        "adam":("story-reference-adam-2026-10-04.json","f1e9870c8b182f1d7a564020d26ae02ba1c2750a0ec2ade27efc205499818e19",2500),
        "idris":("story-reference-idris-2026-10-04.json","ffd834a2e64a98731603940ff6a0d758e0a5e1eac0f424468836c22acc4818d1",2000),
    }
    for item_id,(filename,expected_sha,min_chars) in story_refs.items():
        story_ref_path=Path(pron).with_name(filename)
        if not story_ref_path.exists():
            fail(f"{item_id} story reference seed missing next to pronunciation-rules.json")
        story_ref=load(story_ref_path)
        if int(story_ref.get("schemaVersion",0))!=1:
            fail(f"{item_id} story reference schemaVersion must be 1")
        if str(story_ref.get("itemId",""))!=item_id:
            fail(f"story reference itemId must be {item_id}")
        if len(str(story_ref.get("sourceText","")).strip())<min_chars:
            fail(f"{item_id} story reference sourceText is incomplete")
        source_audio=story_ref.get("sourceAudio") or {}
        if str(source_audio.get("sha256",""))!=expected_sha:
            fail(f"{item_id} story reference source audio fingerprint changed")
        if not bool((story_ref.get("runtimePolicy") or {}).get("exactTextAudioReuse")):
            fail(f"{item_id} story reference exact-text reuse policy missing")
    master_entries=master.get("entries") or []
    rules=lib.get("rules") or []
    if len(rules)<3700: fail(f"too few pronunciation rules: {len(rules)}")
    if int(lib.get("counts",{}).get("canonicalTerms",0))<900: fail("canonical term count regressed")

    if int(master.get("schemaVersion",0))<1: fail("master library schemaVersion missing")
    prophet_entries=[e for e in master_entries if str(e.get("personType",""))=="prophet"]
    if len(prophet_entries)<25: fail(f"too few verified prophet master entries: {len(prophet_entries)}")
    expected_prophets={
        "Ādam","Idrīs","Nūḥ","Hūd","Ṣāliḥ","Ibrāhīm","Lūṭ","Ismāʿīl","Isḥāq","Yaʿqūb",
        "Yūsuf","Ayyūb","Šuʿayb","Mūsā","Hārūn","Ḏū al-Kifl","Dāwūd","Sulaymān","Ilyās",
        "al-Yasaʿ","Yūnus","Zakariyyā","Yaḥyā","ʿĪsā","Muḥammad"
    }
    got_prophets={str(e.get("canonical","")) for e in prophet_entries}
    missing_prophets=expected_prophets-got_prophets
    if missing_prophets: fail("master prophet entries missing: "+", ".join(sorted(missing_prophets)))
    required_story_terms={"Ḥirāʾ","Ḫadīǧah","al-Ḥudaybiyah"}
    got_master={str(e.get("canonical","")) for e in master_entries}
    missing_story_terms=required_story_terms-got_master
    if missing_story_terms: fail("story pronunciation entries missing: "+", ".join(sorted(missing_story_terms)))
    khadijah=next((e for e in master_entries if str(e.get("canonical",""))=="Ḫadīǧah"),None)
    if not khadijah or str(khadijah.get("required_honorific_key",""))!="radiyallahu_anha":
        fail("Ḫadīǧah must carry raḍiya llāhu ʿanhā honorific policy")
    for e in master_entries:
        canonical=str(e.get("canonical","")).strip()
        tts=str(e.get("tts_text") or e.get("arabic") or "").strip()
        if not canonical: fail("master entry missing canonical")
        if not tts or not ARABIC_RE.search(tts): fail(f"master entry has no Arabic tts_text: {canonical}")
        if e.get("status")=="verified" and not bool(e.get("autoUse")):
            fail(f"verified master entry is not enabled for controlled auto-use: {canonical}")
    policy=master.get("policy") or {}
    for flag in ("verifiedMasterMayAutoFillMissingRules","onlineSuggestionsNeverOverrideInstalledOrUserRules","persistentAudioMasterRequiresHumanConfirmation","unknownIslamicTermsMustBeSurfaced"):
        if not policy.get(flag): fail("master library policy missing: "+flag)

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
    if int(prof.get("schemaVersion",0))<8: fail("voice profile schemaVersion must be >=8")
    qa=prof.get("qualityAssurance") or {}
    if int(qa.get("maxRenderAttempts",0))<2: fail("QA maxRenderAttempts must be >=2")
    if not 450<=int(qa.get("maxInternalSilenceMsWithPunctuation",0))<=900: fail("QA punctuation-pause guard invalid")
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
        "aishah":"عَائِشَة",
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
    if not bool(qa.get("boundedGenerationRegression")): fail("bounded generation QA missing")
    if not bool(qa.get("mlxFallbackRegression")): fail("MLX fallback QA missing")
    if not bool(qa.get("backendIdentityVisible")): fail("backend identity QA missing")
    if not bool(qa.get("islamicMasterLibraryRegression")): fail("Islamic master-library QA missing")
    if not bool(qa.get("unknownIslamicTermDetectionRegression")): fail("unknown Islamic-term detection QA missing")
    if not bool(qa.get("masterLibraryPrecedenceRegression")): fail("master-library precedence QA missing")
    if not bool(qa.get("inlineArabicFlowRegression")): fail("inline Arabic flow regression QA missing")
    if not bool(qa.get("continuousSentenceFlowRegression")): fail("continuous sentence-flow regression QA missing")
    if not bool(qa.get("originalTextOrderRegression")): fail("original text-order regression QA missing")
    if not bool(qa.get("generalBoundaryTrimRegression")): fail("general boundary-trim regression QA missing")
    if not bool(qa.get("strictSentencePreflightRegression")): fail("strict sentence-preflight QA missing")
    if not bool(qa.get("zeroPauseInfinitiveRegression")): fail("zero-pause infinitive QA missing")
    if not bool(qa.get("renderPlanBoundaryRegression")): fail("render-plan boundary QA missing")
    if not bool(qa.get("visibleTextIntegrityRegression")): fail("visible-text integrity QA missing")
    if not bool(qa.get("inlineArabicPhonemeAwarePauseQa")): fail("inline Arabic phoneme-aware pause QA missing")
    if not bool(qa.get("fullSentenceContinuityStillAuthoritative")): fail("full-sentence continuity authority missing")
    if not bool(qa.get("lexicalBridgeRegression")): fail("lexical bridge regression QA missing")
    if not bool(qa.get("noGapBeforeKnownArabicTerm")): fail("known Arabic term no-gap QA missing")
    if not bool(qa.get("automaticBoundaryRegression")): fail("automatic boundary regression QA missing")
    if not bool(qa.get("noPerWordPatchDependency")): fail("structural boundary QA policy missing")
    if not bool(qa.get("unpunctuatedBoundaryMustBeGapless")): fail("gapless unpunctuated boundary QA missing")
    if not bool(qa.get("learnedCanonicalGroupPersistenceRegression")): fail("learned canonical-group persistence QA missing")
    if not bool(qa.get("learnedAliasPersistenceRegression")): fail("learned alias persistence QA missing")
    if not bool(qa.get("learnedBackupRecoveryRegression")): fail("learned backup recovery QA missing")
    if not bool(qa.get("learnedMasterNeverReviewRegression")): fail("learned MASTER/REVIEW regression QA missing")
    if not bool(qa.get("learnedAudioBackupRegression")): fail("learned audio backup QA missing")
    if not bool(qa.get("priorLearnedMigrationRegression")): fail("prior learned migration QA missing")
    if not bool(qa.get("contextualCoarticulationRegression")): fail("contextual coarticulation QA missing")
    if not bool(qa.get("noStandaloneGermanBeforeArabicRegression")): fail("standalone German-before-Arabic regression QA missing")
    if not bool(qa.get("carrierNeverExposedRegression")): fail("context carrier exposure QA missing")
    if not bool(qa.get("contextBridgeCacheRegression")): fail("context bridge cache QA missing")
    if int(qa.get("contextBridgeRenderAttempts",0))<2: fail("context bridge retries too low")
    for flag in ("moderatePauseAutoRepair","qaCleanCacheOnly","knownSentenceReuse","backendIndependentVerifiedCache"):
        if not bool(qa.get(flag)): fail("fast reuse/pause-repair QA missing: "+flag)
    if int(qa.get("autoRepairPauseWithoutPunctuationMs",999))>180:
        fail("auto-repair no-punctuation target too long")
    if int(qa.get("autoRepairPauseWithPunctuationMs",999))>250:
        fail("auto-repair punctuation target too long")
    if not 700<=int(qa.get("autoRepairPauseMaxMs",0))<=1100:
        fail("auto-repair maximum pause window invalid")
    if int(qa.get("inlineArabicRenderAttempts",0))<4: fail("inline Arabic retries too low")
    if not 420<=int(qa.get("inlineArabicInternalSilenceMs",0))<=550:
        fail("inline Arabic internal-silence guard invalid")
    if not 0<float(qa.get("inlineArabicSilenceThresholdRelative",0))<=0.006:
        fail("inline Arabic silence threshold invalid")
    punctuation_limits=qa.get("maxInternalSilenceMsWithPunctuationByMode") or {}
    for mode_name in ("narration","kids_story","kids_lesson","teaching","gentle","serious","question","list","dua"):
        if int(punctuation_limits.get(mode_name,9999))>900:
            fail("punctuation silence limit too loose for "+mode_name)
    if int(qa.get("maxInternalSilenceMsWithoutPunctuation",9999))>420:
        fail("non-punctuation silence limit too loose")
    if int(qa.get("finalMaxInternalSilenceMs",9999))>560:
        fail("final continuity silence guard too loose")
    continuity=prof.get("continuity") or {}
    if not bool(continuity.get("inlineArabicMicroTermBridge")): fail("inline Arabic micro-term bridge missing")
    if int(continuity.get("inlineArabicCrossfadeMs",0))<50: fail("inline Arabic crossfade too short")
    if int(continuity.get("inlineArabicTrimSafetyMs",99))>8: fail("inline Arabic trim safety too large")
    if float(qa.get("inlineArabicMaxSecondsBase",9))>0.9: fail("inline Arabic duration guard too loose")
    if not bool(continuity.get("continuousSentenceFlow")): fail("continuous sentence flow missing")
    if not bool(continuity.get("renderInOriginalTextOrder")): fail("original text-order rendering missing")
    if not bool(continuity.get("noArtificialThinkingPause")): fail("anti-thinking-pause policy missing")
    if int(continuity.get("internalFlowCrossfadeMs",0))<40: fail("general flow crossfade too short")
    if int(continuity.get("boundaryTrimSafetyMs",99))>10: fail("general boundary trim safety too large")
    if not bool(continuity.get("lexicalBridgeEnabled")): fail("lexical bridge missing")
    if not bool(continuity.get("functionWordArabicBinding")): fail("function-word Arabic binding missing")
    if int(continuity.get("lexicalBridgeTrimSafetyMs",99))>3: fail("lexical bridge trim safety too large")
    if int(continuity.get("lexicalBridgeCrossfadeMs",0))<100: fail("lexical bridge crossfade too short")
    if float(continuity.get("lexicalBridgeMaxFraction",0))<0.42: fail("lexical bridge overlap fraction too small")
    if not bool(continuity.get("automaticBoundaryClassification")): fail("automatic boundary classifier missing")
    if not bool(continuity.get("structuralNotWordSpecific")): fail("boundary logic must be structural, not per-word")
    if not bool(continuity.get("automaticTightJoin")): fail("automatic tight join missing")
    if not bool(continuity.get("noGapOnUnpunctuatedBoundary")): fail("unpunctuated boundary no-gap policy missing")
    if int(continuity.get("automaticTightJoinCrossfadeMs",0))<55: fail("automatic tight join too weak")
    if int(continuity.get("strongLexicalBridgeCrossfadeMs",0))<95: fail("strong lexical bridge too weak")

    renderer=prof.get("productionRenderer") or {}
    if renderer.get("framework")!="mlx-audio": fail("MLX production renderer policy missing")
    if renderer.get("primaryAppleSilicon")!="mlx-community/chatterbox-4bit": fail("wrong Extreme-Fast MLX model policy")
    if renderer.get("qualityAppleSilicon")!="mlx-community/chatterbox-multilingual-v3": fail("V3 quality fallback policy missing")
    if int(renderer.get("quantizationBits",0))!=4: fail("Extreme-Fast renderer must be 4-bit")
    if int(renderer.get("germanChunkMaxChars",0))>140: fail("quality German chunk ceiling too high")
    if int(renderer.get("arabicChunkMaxChars",0))>90: fail("quality Arabic chunk ceiling too high")
    if int(renderer.get("germanMaxNewTokens",0))>360: fail("quality German token ceiling too high")
    if int(renderer.get("arabicMaxNewTokens",0))>300: fail("quality Arabic token ceiling too high")
    if not (300 <= int(renderer.get("interactiveGermanChunkMaxChars",0)) <= 460): fail("Extreme-Fast German chunk window invalid")
    if not (280 <= int(renderer.get("interactiveKidsStoryChunkMaxChars",0)) <= 420): fail("Extreme-Fast kids-story chunk window invalid")
    if not (700 <= int(renderer.get("interactiveGermanMaxNewTokens",0)) <= 960): fail("Extreme-Fast German token window invalid")
    if not (340 <= int(renderer.get("interactiveArabicMaxNewTokens",0)) <= 460): fail("Extreme-Fast Arabic token window invalid")
    for flag in ("voiceCloning","boundedGeneration","tokenCeilingRescue","preservePronunciationRules","preserveConfirmedAudioLocks","preserveHonorificPolicy","preserveTechnicalQa","preserveAntiStutterQa","preserveAntiHoldQa","phraseAwareChunking","renderInOriginalTextOrder","generalBoundaryFlowBridge","noHardWordBoundaryChunking","lazyModelLoad","skipModelWhenAllSegmentsKnown","verifiedSentenceFastReuse","backendIndependentVerifiedCache","autoRepairModeratePause","lexicalBridgeEnabled","functionWordArabicBinding","automaticBoundaryClassification","structuralNotWordSpecific","automaticTightJoin","noGapOnUnpunctuatedBoundary","preserveLearnedPronunciationAcrossUpdates","userLearnedMasterPriority","contextualCoarticulation","contextBridgeAllGermanArabicBoundaries","contextBridgeLeadIn","contextBridgeFollowOn","contextBridgeCache","interactiveExtremeFast","interactiveUnconfirmedArabicAlias","confirmedAudioMasterNeverFlattened","fastModelCanBeOverriddenByEnv"):
        if not renderer.get(flag): fail("production renderer policy missing: "+flag)
    if renderer.get("flowArchitecture")!="continuous-sentence-flow-v3":
        fail("continuous sentence-flow architecture identity missing")
    for flag in ("strictSentencePreflight","grammarAwarePunctuation"):
        if not renderer.get(flag): fail("strict flow renderer policy missing: "+flag)

    learning=prof.get("pronunciationLearning") or {}
    required_learning_flags=(
        "enabled","clickableDetectedTerms","textSelectionCapture","manualUnknownTermEntry",
        "manualArabicTtsRequiredWhenNoRuleFound","isolatedPreviewBeforeSave",
        "explicitHumanConfirmationRequired","confirmedPreviewBecomesPersistentAudioLock",
        "userRuleOverridesBaseRule","onlineRulesNeverAutoPromoteToMaster","vocabularyExpandsPersistently",
        "automaticOnlineSync","onlineRulesAreSuggestionsOnly","masterLibraryEnabled",
        "verifiedMasterMayAutoFillMissingRules","masterNeverOverridesUserOrInstalled",
        "unknownIslamicTermsMustBeReviewed","persistAcrossTasks","persistAcrossRestart",
        "persistAcrossAppUpdates","confirmedCanonicalGroupBecomesMaster",
        "confirmedAliasesBecomeMaster","confirmedNeverReturnsToReview",
        "atomicLocalBackup","backupRecovery","userMasterAlwaysPrecedesReview",
        "confirmedAudioBackupRecovery","migratePreviouslyLearnedTerms","noRetestAfterUpgrade"
    )
    for flag in required_learning_flags:
        if not learning.get(flag): fail("pronunciation learning policy missing: "+flag)
    if int(learning.get("automaticOnlineSyncHours",0))!=24:
        fail("pronunciation learning auto-sync must be 24 hours")

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
    engine_dir=Path(engine_path).resolve().parent
    flow_path=engine_dir/"speech_flow.py"
    if not flow_path.exists():
        fail("speech_flow.py missing next to local-engine.py")
    spec=importlib.util.spec_from_file_location("dar_voice_speech_flow_validation",flow_path)
    flow=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(flow)

    source="Wir bitten Ihn darum, sie anzunehmen."
    spoken,decisions=flow.normalize_synthesis_punctuation(source)
    if spoken!="Wir bitten Ihn darum sie anzunehmen.":
        fail("zero-pause infinitive regression failed: "+spoken)
    if len(decisions)!=1 or decisions[0].get("reason")!="pronominaladverb_infinitive":
        fail("grammar-aware comma classification regression failed")
    if source!="Wir bitten Ihn darum, sie anzunehmen.":
        fail("visible source text was mutated by speech-flow preflight")
    report=flow.validate_render_plan(source,spoken,[("de",spoken)])
    if not report.get("passed") or int(report.get("segments",0))!=1:
        fail("strict sentence preflight regression failed")

    mixed="Eine gute Tat tun wir für Allāh, und wir bitten Ihn darum, sie anzunehmen."
    mixed_spoken,mixed_decisions=flow.normalize_synthesis_punctuation(mixed)
    if "darum, sie anzunehmen" in mixed_spoken or "darum sie anzunehmen" not in mixed_spoken:
        fail("mixed sentence zero-pause regression failed")
    if len(mixed_decisions)!=1:
        fail("mixed sentence punctuation classification changed unexpectedly")
    try:
        tree=ast.parse(engine_source)
    except SyntaxError as e:
        fail(f"engine syntax error: {e}")
    confirm_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="confirm_learning_preview"),None)) or ""
    if "learned_canonical_forms" not in confirm_src or "save_user_override_group" not in confirm_src:
        fail("confirmed learning must persist canonical group and aliases")
    persist_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="_persist_user_override_data"),None)) or ""
    if "USER_OVERRIDES_FILE" not in persist_src or "USER_OVERRIDES_BACKUP" not in persist_src:
        fail("learned pronunciation must be written to primary + backup")
    load_override_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="load_persistent_user_overrides"),None)) or ""
    if "USER_OVERRIDES_BACKUP" not in load_override_src or "override_restore_from_backup" not in load_override_src:
        fail("learned pronunciation backup recovery missing")
    migrate_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="migrate_existing_user_override_groups"),None)) or ""
    if "learned_canonical_forms" not in migrate_src or "override_group_migration" not in migrate_src:
        fail("previously learned pronunciation migration missing")
    audio_path_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="audio_lock_path"),None)) or ""
    if "learning_audio_backup_path" not in audio_path_src or "audio_lock_restore_from_backup" not in audio_path_src:
        fail("confirmed learned audio backup recovery missing")
    bridge_dir_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="contextual_bridge_direction"),None)) or ""
    if '"lead-in"' not in bridge_dir_src or '"follow-on"' not in bridge_dir_src:
        fail("context bridge must support both DE→AR and AR→DE")
    bridge_render_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="render_context_bridge"),None)) or ""
    if 'carrier=f"{source}, weiter"' not in bridge_render_src or 'f"weiter, {source}"' not in bridge_render_src:
        fail("contextual carrier render strategy missing")
    if "carrier_not_exposed" not in bridge_render_src:
        fail("contextual carrier must never reach output")
    functions={n.name for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}
    for required in {"resolve_segment_prosody","split_rescue_chunks","audio_quality_metrics","render_segment_with_qa","join_rendered_segments","audio_lock_key_for_chunk","split_audio_locked_spans","discard_pending_audio_locks","stage_pending_audio_locks","confirm_pending_audio_locks","load_locked_wav","source_has_honorific","rebuild_runtime_rules","derive_master_entries_from_rules","build_master_library","master_rules_from_entries","master_suggestions","known_master_form_or_german_inflection","detect_unresolved_islamic_terms","pronunciation_search","sync_online_pronunciation_library","create_learning_preview","confirm_learning_preview","save_user_override","learning_state","online_sync_is_stale","refresh_online_library_if_stale","file_signature","render_cache_key","load_render_cache","save_render_cache","cleanup_render_cache","reference_for_language","prepare_reference_if_needed","generation_token_budget","generation_timeout_seconds","_mlx_process_main","_start_mlx_process","_stop_mlx_process","load_mlx_model","load_production_model","render_with_mlx","is_inline_arabic_micro_term","repair_internal_pause","legacy_render_cache_keys","flow_boundary_strength","learned_canonical_forms","save_user_override_group","load_persistent_user_overrides","_persist_user_override_data","migrate_existing_user_override_groups","learning_audio_backup_path","contextual_bridge_direction","context_bridge_cache_key","load_context_bridge_cache","save_context_bridge_cache","render_context_bridge","_crop_context_bridge_audio","_find_context_separator","normalize_story_reference_text","story_reference_text_sha256","register_story_reference_pair","story_reference_state","story_reference_matches_text","bootstrap_story_reference_seed"}:
        if required not in functions: fail(f"engine missing production function: {required}")
    for marker in {"excessive_internal_pause","suspicious_sustained_hold","speech_rate_too_slow","generation_timeout","MLX_PROCESS_LOCK=threading.RLock()","MLX worker stopped","Watchdog aktiv","/confirm-core-audio","audio_lock_pending","session_audio_locks","required_honorific_key","honorificPolicyEnabled","/learning/search","/learning/sync","/learning/preview","/learning/confirm","USER_OVERRIDES_FILE","ONLINE_LIBRARY_CACHE","MASTER_LIBRARY_CACHE","MASTER_LIBRARY_URL","islamic-master-library.json","unresolvedIslamicTerms","librarySuggestions","Ungeprüfte islamische Namen/Begriffe erkannt","user_rules+BASE_RULES+MASTER_RULES","CONFIRMED_WAV","autoSyncHours","AUDIO_LOCK_STATE_LOCK=threading.RLock()","PENDING_AUDIO_LOCKS={}","PENDING_AUDIO_RENDER_ID=\"\"","MODEL_CONDITIONAL_CACHE={}","RENDER_CACHE_DIR","continuous-sentence-flow-v3","mlx-community/chatterbox-multilingual-v3","GenerationTokenLimitReached","GenerationTimeoutReached","max_new_tokens","production_backend","unnatural_final_internal_pause","execution_order=list(range(total))","Flow-aware Chunking","inline_arabic_internal_hold","inlineArabicRenderAttempts","inlineArabicSilenceThresholdRelative","cache-only-fast-path","Stimm-Modell wird nicht geladen","cache_reused_without_resynthesis","pause auto-repair","automaticTightJoinCrossfadeMs","strong_lexical_boundary","boundary_strength","flow_boundary_strength","USER_OVERRIDES_BACKUP","user-overrides.latest.json","learned_group_id","savedForms","persistentPath","backupPath","LEARNING_CONFIRMED_AUDIO_DIR","audio_lock_restore_from_backup","override_group_migration","migrate_existing_user_override_groups","CONTEXT_BRIDGE_CACHE_DIR","context-bridge-v1","carrier_not_exposed","context_bridge_direction","context_bridge_cache_hits","STORY_REFERENCE_HOME","STORY_REFERENCE_STATE","story-reference-muhammad-2026-10-04.json","story_reference_registered","reference-audio-exact-text-fast-path","dar-story-reference-bootstrap","storyReferenceMemory"}:
        if marker not in engine_source: fail(f"engine missing QA/audio-lock marker: {marker}")
    unresolved_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="known_master_form_or_german_inflection"),None)) or ""
    if (
        'norm.endswith("s")' not in unresolved_src
        or 'stem in MASTER_ALIAS_INDEX' not in unresolved_src
        or 'stem in KNOWN_RULE_ALIAS_INDEX' not in unresolved_src
    ):
        fail("German possessive Islamic-name regression guard missing")

    split_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="split_chunks"),None)) or ""
    if "Konjunktion" not in split_src or "Jeder Satz bleibt eine eigene QA-/Retry-Einheit" not in split_src:
        fail("sentence-first flow-aware chunking implementation missing")
    if "execution_order=list(range(total))" not in engine_source:
        fail("rendering must preserve original text order")
    prosody_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="detect_prosody_mode"),None)) or ""
    if 'value.count(",")>=1 and " und " in low' in prosody_src:
        fail("normal comma+und sentences must not be forced into list mode")
    cache_key_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="render_cache_key"),None)) or ""
    if "ACTIVE_BACKEND" in cache_key_src:
        fail("verified sentence cache key must be backend independent")
    repair_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="repair_internal_pause"),None)) or ""
    if "pause_runs_repaired" not in repair_src or "autoRepairPauseMaxMs" not in repair_src:
        fail("moderate pause auto-repair implementation missing")
    boundary_src=ast.get_source_segment(engine_source,next((n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and n.name=="flow_boundary_strength"),None)) or ""
    if "return 1" not in boundary_src or "return 2" not in boundary_src:
        fail("automatic structural boundary classifier missing")
    if "GERMAN_LINK_WORDS" in engine_source or "is_german_link_fragment" in engine_source:
        fail("per-word lexical patching must not remain in the engine")
    function_nodes={n.name:n for n in ast.walk(tree) if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}
    save_src=ast.get_source_segment(engine_source,function_nodes.get("save_wav")) or ""
    load_src=ast.get_source_segment(engine_source,function_nodes.get("load_locked_wav")) or ""
    if "ta.save(" in save_src:
        fail("save_wav must never call torchaudio.save; internal WAV must stay PCM16")
    for marker in ("np.int16","wf.setsampwidth(2)","wave.open(str(path),\"wb\")"):
        if marker not in save_src: fail("PCM16 WAV writer marker missing: "+marker)
    for marker in ("torchaudio as ta","pcm_s16le","legacy WAV migrated to PCM16"):
        if marker not in load_src: fail("legacy float-WAV migration marker missing: "+marker)

    state_pos=engine_source.find("AUDIO_LOCK_STATE_LOCK=threading.RLock()")
    pending_fn_pos=engine_source.find("def pending_audio_lock_keys")
    if state_pos<0 or pending_fn_pos<0 or state_pos>pending_fn_pos:
        fail("audio lock runtime state must be initialized before pending_audio_lock_keys")

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

    root=Path(__file__).resolve().parents[2]
    engine_dir=Path(engine_path).resolve().parent
    repo_studio=root/"voice-studio/content-studio.js"
    staged_studio=engine_dir/"content-studio.js"
    studio_js=staged_studio if staged_studio.exists() else repo_studio
    if not studio_js.exists():
        fail("content-studio.js missing next to local engine or in repository")
    studio_source=studio_js.read_text(encoding="utf-8")
    for required in (
        "effectiveKind()","effectiveTarget()","quizDraft","gameDraft","checkpointPackage","productionPhase",
        "generateCover({internal:true})","sendPush:effectiveTarget()===\"kids\"",
        'data-cs-kind="dua"','data-cs-kind="narration"',"handleDirectAudioFile","publishDirectKids",
        "manual-owner-upload","audioAssetText","directAudioReadyForCurrentText"
    ):
        if required not in studio_source: fail("content studio workflow marker missing: "+required)

    engine_source=Path(engine_path).read_text(encoding="utf-8")
    for required in ("KNOWN_RULE_ALIAS_INDEX","knownRuleAliases","max-master-pls-v1","fastKnownPath"):
        if required not in engine_source: fail("fast-known pronunciation marker missing: "+required)

    integration_paths=[]
    kids_admin_js=root/"cloudflare/kids-content-admin.js"
    kids_feed_js=root/"kids/content-studio-feed.js"
    if kids_admin_js.exists() and kids_feed_js.exists():
        admin_source=kids_admin_js.read_text(encoding="utf-8")
        feed_source=kids_feed_js.read_text(encoding="utf-8")
        for required in ("normalizeQuiz","normalizeGame","normalizeProduction","test-published","live-published","genau eine richtige Antwort nötig"):
            if required not in admin_source: fail("kids content server marker missing: "+required)
        for required in ("studioNewSection","openDeepLink","data-studio-content","renderQuiz","renderGame","studio-audio"):
            if required not in feed_source: fail("kids content feed marker missing: "+required)
        integration_paths.extend((kids_admin_js,kids_feed_js))

    node=shutil.which("node")
    if node:
        for path in (studio_js,*integration_paths):
            check=subprocess.run([node,"--check",str(path)],capture_output=True,text=True)
            if check.returncode!=0:
                try: label=path.relative_to(root)
                except ValueError: label=path.name
                fail(f"JavaScript syntax error in {label}: {check.stderr.strip()}")
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
        "masterLibraryEntries":len(master_entries),
        "masterProphets":len(prophet_entries),
        "profileSchema":prof.get("schemaVersion"),
        "contentStudioValidation":True
    },ensure_ascii=False))

if __name__=="__main__":
    main()
