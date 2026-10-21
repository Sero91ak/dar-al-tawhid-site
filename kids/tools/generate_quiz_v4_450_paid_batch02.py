#!/usr/bin/env python3
"""TAWḤĪD KIDS: second real ORIGINAL V4 audio batch (20 low-cost fragments).

All requests are DIRECT synchronous MP3 downloads; no paid Flow GET needed.
Existing original 2-take pilot MUST pass SHA/codec/signal QA. All original
MP3s and ledger are written immediately and backed up by GitHub artifacts.
NEVER retries a charged/uncertain API call or modifies live quiz manifests.
"""
from __future__ import annotations
import hashlib,json,os,time,urllib.error,urllib.request,re
from datetime import datetime,timezone
from pathlib import Path
from quiz_v4_no_double_charge_guard import protect_paid_texts, prohibit_prepaid_selection

ROOT=Path(__file__).resolve().parents[2]
PLAN=ROOT/"kids/data/quiz-v4-curated-450-production-review.json"
READY=ROOT/"kids/data/quiz-v4-450-api-readiness.json"
REGISTRY=ROOT/"kids/data/quiz-v4-450-original-clip-registry.json"
LEDGER=ROOT/"kids/data/quiz-v4-450-paid-generation-ledger.json"
# The unique wave ID must exist before deriving the per-wave journal path.
BATCH=os.environ.get("KIDS_V4_450_BATCH_ID","KIDS_V4_450_BATCH_02_20").strip()
ATTEMPTS=(ROOT/"kids/data/quiz-v4-450-batch02-request-journal.json"
          if BATCH=="KIDS_V4_450_BATCH_02_20"
          else ROOT/"kids/data/quiz-v4-paid-wave-journals"/(BATCH+".json"))
USAGE=(ROOT/"kids/data/quiz-v4-450-batch02-usage.json"
       if BATCH=="KIDS_V4_450_BATCH_02_20"
       else ROOT/"kids/data/quiz-v4-paid-wave-usage"/(BATCH+".json"))
TECHQA=ROOT/"kids/data/quiz-v4-450-saved-mp3-technical-qa.json"
OUTPUT=ROOT/"kids/assets/kids-quiz-audio/v4-curated450-review"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
# Default preserves the legacy original campaign identity. Subsequent
# distinct, user-approved 20-text recording waves get stable, NONREUSABLE
# names; provider SHA identities remain global across all waves.

RATE=0.969066
LIMIT=20
MAX_COST=1200

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path,obj):
    """Atomic on-disk paid receipt before durable remote GitHub push."""
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+".pending")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    tmp.replace(path)

def subscription(key):
    req=urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription",
       headers={"xi-api-key":key,"Accept":"application/json"},method="GET")
    with urllib.request.urlopen(req,timeout=30) as response:
        obj=json.loads(response.read().decode("utf-8"))
    return float(obj["character_limit"])-float(obj["character_count"])

# One canonical, pinned user dictionary; never substitute a new alias list,
# an assistant-generated voice, or another model.
PRONUNCIATION=ROOT/"data/pronunciation/elevenlabs-production.json"
PRONUNCIATION_HOLD=ROOT/"kids/data/quiz-v4-pronunciation-hold.json"

def build_canonical_v4_payload(spoken, *, language="de"):
    """Fail closed before any paid request unless the original 10,099-rule
    German lexicon, its version and its content SHA match GitHub exactly.

    Native Arabic Fuṣḥā is intentionally a distinct language profile: the
    German de-DE PLS uses Latin transliteration aliases, which must NOT
    rewrite fully vocalized Arabic words. The existing owner voice is shared.
    """
    import re
    import xml.etree.ElementTree as ET
    if not isinstance(spoken,str) or not spoken.strip() or spoken!=spoken.strip():
        raise RuntimeError("V4_SOURCE_TEXT_INVALID: use exact approved speech text")
    if language not in ("de","ar"):
        raise RuntimeError("V4_LANGUAGE_INVALID: only German or native Arabic")
    cfg=load(PRONUNCIATION)
    voice=cfg.get("masterVoice") or {}
    dic=cfg.get("pronunciationDictionary") or {}
    if cfg.get("modelId")!=MODEL or voice.get("voiceId")!=VOICE:
        raise RuntimeError("V4_MASTER_VOICE_MODEL_MISMATCH")
    if dic.get("requiredForProduction") is not True:
        raise RuntimeError("V4_MASTER_DICTIONARY_REQUIRED")
    if dic.get("id")!="Q8w3SxtoVo8NSjsnlJEd" or dic.get("versionId")!="wSzgkGpAwEDiTak8DApc":
        raise RuntimeError("V4_MASTER_DICTIONARY_ID_OR_VERSION_MISMATCH")
    p=(ROOT/str(dic.get("masterFile",""))).resolve()
    if not p.is_relative_to(ROOT.resolve()) or not p.is_file():
        raise RuntimeError("V4_MASTER_PLS_MISSING")
    data=p.read_bytes()
    git_sha=hashlib.sha1(b"blob "+str(len(data)).encode("ascii")+b"\x00"+data).hexdigest()
    if git_sha!=dic.get("gitBlobSha"):
        raise RuntimeError("V4_MASTER_PLS_GIT_SHA_MISMATCH")
    ns="{http://www.w3.org/2005/01/pronunciation-lexicon}"
    root=ET.fromstring(data)
    if root.tag!=ns+"lexicon" or root.attrib.get("{http://www.w3.org/XML/1998/namespace}lang")!="de-DE":
        raise RuntimeError("V4_MASTER_PLS_INVALID_LANGUAGE")
    lexemes=root.findall(ns+"lexeme")
    if len(lexemes)!=dic.get("ruleCount") or len(lexemes)!=10099:
        raise RuntimeError("V4_MASTER_PLS_RULE_COUNT_MISMATCH")
    core={}
    safe_aliases={}
    safe_forms={"Bismillāh":"Bismillaah","in sha' Allah":"in schaa Allaah"}
    for x in lexemes:
        label=x.findtext(ns+"grapheme")
        if label in ("Qurʾān","Īmān","Koran","Iman"):
            core[label]=x.findtext(ns+"alias")
        if label in safe_forms:
            safe_aliases[label]=x.findtext(ns+"alias")
    if safe_aliases!=safe_forms:
        raise RuntimeError("V4_CANONICAL_OWNER_GERMAN_PHRASE_ALIASES_CHANGED_STOP")

    if core.get("Qurʾān")!="Qur-aan" or core.get("Īmān")!="Iimaan":
        raise RuntimeError("V4_MASTER_PLS_QURAN_IMAN_ALIASES_MISSING")
    # A mixed Latin/Arabic-script speech item MUST be explicitly segmented
    # before synthesis, never guessed as German or Arabic.
    has_arabic=bool(re.search(r"[\u0621-\u064A]",spoken) or "ﷺ" in spoken)
    has_latin=bool(re.search(r"[A-Za-zÀ-ÿ]",spoken))
    if has_arabic and has_latin:
        raise RuntimeError("V4_MIXED_LANGUAGE: split German and native Fuṣḥā audio before charging")
    if language=="ar":
        if not has_arabic or has_latin or not re.search(r"[\u064B-\u065F\u0670]",spoken):
            raise RuntimeError("V4_FUSHA: require separately vocalized Arabic-only script")
        # Never apply de-DE transliteration aliases to genuine Arabic;
        # preserve madd, shaddah and case vowels in the source.
        return {"text":spoken,"model_id":MODEL,"language_code":"ar",
                "apply_text_normalization":"off"}
    if has_arabic:
        raise RuntimeError("V4_GERMAN_SOURCE_CONTAINS_ARABIC: split Fuṣḥā before charging")
    # These two common quiz variants are NOT listed verbatim as graphemes
    # in the user's ORIGINAL 10099-rule dictionary. Bind them to the
    # semantically identical forms it DOES contain, without touching
    # immutable displayed quiz text, source SHA or any saved MP3 receipt.
    # Do not invent a pronunciation for other unlisted Arabic terms.
    normalized=spoken.replace("Bismi-llāh","Bismillāh")
    normalized=normalized.replace("In schāʾ Allāh","in sha' Allah")
    return {"text":normalized,"model_id":MODEL,"language_code":"de",
            "apply_text_normalization":"off",
            "pronunciation_dictionary_locators":[{
                "pronunciation_dictionary_id":dic["id"],
                "version_id":dic["versionId"]}]}


def original_mp3(key,spoken,*,language="de"):
    hold=load(PRONUNCIATION_HOLD)
    if (hold.get("productionPaused") is not False
        or hold.get("paidSpeechAuthorized") is not True
        or hold.get("humanPronunciationApproved") is not True
        or hold.get("dictionaryProviderVerified") is not True
        or hold.get("ownerRestartAuthorized") is not True):
        raise RuntimeError(
            "PRONUNCIATION_HOLD: owner rejected Quran/Fuṣḥā pronunciation; "
            "no charged V4 generation until a verified and personally accepted "
            "auditory pilot plus fresh owner authorization"
        )
    # This is the common paid HTTP POST used by multiple old workflows.
    # NO workflow may quietly render 20+ new takes while the first correctly
    # dictionary-bound recording still awaits the user's hearing verdict.
    if hold.get("humanListeningQualityGateReleased") is not True:
        one_pilot=(os.environ.get("KIDS_V4_STAGE1_SAMPLE_ONLY")=="YES"
                   and hold.get("authorizedNewOriginalsBeforeHearing")==1)
        one_owner_batch=(os.environ.get("KIDS_V4_STAGE1_OWNER_CORRECT_DICTIONARY_BATCH")=="YES"
                         and os.environ.get("KIDS_V4_STAGE1_SAMPLE_ONLY")!="YES"
                         and os.environ.get("KIDS_V4_STAGE1_EXPLICIT_SPEND_APPROVAL")=="YES"
                         and hold.get("ownerExplicitlyRequestedContinuedPaidQuizProduction") is True
                         and hold.get("allowOneStrictTenOriginalDictionaryBatchBeforeListeningApproval") is True
                         and hold.get("maximumPreHearingAdditionalNewOriginals")==10
                         and hold.get("maximumPreHearingAdditionalEstimatedCredits")==240)
        # Explicitly renewed owner's all-450 request permits paid private staging,
        # NOT a fabricated hearing approval or a public audio release.
        # Only the dedicated SHA-journaled bulk workflow may set this flag.
        owner_bulk=(os.environ.get("KIDS_V4_OWNER_450_BULK_EXPLICIT")=="YES"
                    and hold.get("ownerRequestedAll450Originals") is True
                    and hold.get("ownerExplicitlyRequestedContinuedPaidQuizProduction") is True
                    and hold.get("ownerBulkConsent20261020") is True
                    and hold.get("ownerBulkHearingApprovalClaimed") is False
                    and hold.get("publicQuizAudioReleaseAuthorized") is False
                    and os.environ.get("KIDS_V4_EXPLICIT_SPEND_APPROVAL")=="YES")
        if not (one_pilot or one_owner_batch or owner_bulk):
            raise RuntimeError("V4_HUMAN_HEARING_GATE: only owner-authorized SHA-checkpointed private originals; no fake listening approval or public release")
    body=build_canonical_v4_payload(spoken,language=language)
    req=urllib.request.Request(
        "https://api.elevenlabs.io/v1/text-to-speech/"+VOICE+
        "?output_format=mp3_44100_128",
        data=json.dumps(body,ensure_ascii=False).encode("utf-8"),
        method="POST",headers={"xi-api-key":key,"Accept":"audio/mpeg","Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req,timeout=110) as r:
            data=r.read(1500000)
            ct=r.headers.get("Content-Type","")
            rid=r.headers.get("request-id") or r.headers.get("xi-request-id")
            if r.status!=200 or ("audio/" not in ct and "octet-stream" not in ct):
                raise RuntimeError("Unexpected V4 MP3 HTTP/content-type. NEVER RETRY blindly.")
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"ElevenLabs V4 master+dictionary HTTP {exc.code}; NO AUTOMATIC RETRY")
    if not (1500<len(data)<1500000) or not(data.startswith(b"ID3") or data[:1]==b"\xff"):
        raise RuntimeError("Invalid original MP3 response; NO AUTOMATIC RETRY")
    return data,rid

def age_for(plan):
    return {r["questionId"]:r["ageBand"] for r in plan["recipes"]}

# Exact Arabic words from the 450-corpus source audit that do NOT occur
# as exact graphemes in the user's authentic 10,099-rule German PLS.
# Do NOT guess pronunciations or silently record them with a German model.
# Two high-frequency equivalent forms (Bismi-llāh / In schāʾ Allāh) are
# already mapped to authentic owner dictionary graphemes in the payload.
UNLISTED_OWNER_TERMS=re.compile(
    r"(?i)(?<![\w])(?:ash-sharḥ|ayyūbs|bārik|ghībah|halāle|halālen|"
    r"luqmāns|muttaqīn|muḥsinīn|mūsās|qurʾān-duʿāʾ|qurʾān-lesen|"
    r"qurʾān-vers|schahāda|sulaymāns|zakariyyās|ādams|ʿīsās)(?![\w])"
)
ARABIC_UNSEGMENTED=re.compile(r"[\u0621-\u064A]|ﷺ")
# Owner auditory feedback on 21 Oct 2026: these three exact root terms
# require a new approved reading, not another charged German-alias guess.
OWNER_PRONUNCIATION_REVIEW_TERMS=re.compile(
    r"(?i)(?<![\w])(?:ʿibādah|ḥalāl|ḥarām)(?![\w])"
)
# 2026-10-21: owner rejects Qurʾān/Fuṣḥā audio quality.
# German de-DE alias "Qur-aan" is not verified Arabic phonetics.
# True Qurʾān āyāt: ONLY authentic human reciter audio, never TTS.
OWNER_QURAN_REVIEW_TERMS=re.compile(
    r"(?i)(?<![\w])(?:qur[ʾ'’]?ān|quran|qur'an|koran|sūrah|sūrat|surah|āyah|āyāt|tilāwah)(?![\w])"
)

def source_requires_separate_pronunciation_approval(text):
    return bool(ARABIC_UNSEGMENTED.search(text) or UNLISTED_OWNER_TERMS.search(text)
                or OWNER_PRONUNCIATION_REVIEW_TERMS.search(text)
                or OWNER_QURAN_REVIEW_TERMS.search(text))

def choose(plan,registry,protected):
    existing=set((registry.get("textClips") or {}).keys())
    ages=age_for(plan)
    available=[r for r in plan["pendingAudioFragments"] if r["text"] not in existing and r["text"] not in protected
               and not source_requires_separate_pronunciation_approval(r["text"])]
    if len(available)<LIMIT:raise RuntimeError("Remaining unrecorded fragments below batch size")
    selected=[];seen=set()
    def take(r):
        if len(selected)>=LIMIT:return False
        if r["text"] in seen:return False
        if len(r["text"])*RATE+sum(len(x["text"])*RATE for x in selected)>MAX_COST:return False
        seen.add(r["text"]);selected.append(r)
        return True
    # Repeated fragments should be bought once: use common prefixes first.
    common=[r for r in available if len(r["usedBy"])>=20 and len(r["text"])<=75]
    for r in sorted(common,key=lambda x:(-len(x["usedBy"]),len(x["text"]),x["text"]))[:2]:
        take(r)
    # Six question-bearing fragments per age band, spread across all profiles.
    for age in ("4-6","7-8","9-10"):
        candidates=[r for r in available if r["text"].endswith("?") and 16<=len(r["text"])<=95 and
                    any(ages.get(id)==age for id in r["usedBy"])]
        def question_number(r):
            return min(int(id.rsplit("-",1)[-1]) for id in r["usedBy"] if ages.get(id)==age)
        for r in sorted(candidates,key=lambda x:(question_number(x),len(x["text"]))):
            if sum(1 for x in selected if x["text"] in {z["text"] for z in candidates})>=6:break
            take(r)
    for r in sorted(available,key=lambda x:(-len(x["usedBy"]),len(x["text"]),x["text"])):
        if len(selected)>=LIMIT:break
        if len(r["text"])<=85:take(r)
    if len(selected)!=LIMIT:
        raise RuntimeError("Could not select exactly 20 source-authentic V4 texts inside budget")
    estimate=sum(len(x["text"])*RATE for x in selected)
    if estimate>MAX_COST:raise RuntimeError("Exceeded per-batch 1200 credit estimate cap")
    return selected,estimate

def main():
    # The older 20-take pathway is NOT the first-test restart pathway:
    # a single original from the stage-1 guarded producer must be heard first.
    hold=load(PRONUNCIATION_HOLD)
    if hold.get("humanListeningQualityGateReleased") is not True:
        raise RuntimeError("V4_AUDIO_RESTART: large paid batches suspended until one correct canonical-dictionary original is heard and accepted")
    # Reuse the same remotely confirmed SHA checkpoint engine as the
    # already-successful stage1 paid pilot. Import inside the paid pathway to
    # avoid a circular import at module load. Never leave a paid request
    # orphaned on an ephemeral Actions runner.
    from generate_quiz_v4_older_stage1_exact import persist_remote_paid_checkpoint
    import re
    if (BATCH!="KIDS_V4_450_BATCH_02_20"
        and (not re.fullmatch(r"KIDS_V4_450_WAVE_[0-9]{3}_20",BATCH)
             or BATCH=="KIDS_V4_450_WAVE_000_20")):
        raise RuntimeError("Invalid unique paid wave ID, do not start TTS")
    if (os.environ.get("GITHUB_ACTIONS")!="true"
        or os.environ.get("GITHUB_REF_NAME")!="review/kids-quiz-v4-batch-001-020-20261014"):
        raise RuntimeError("Paid original waves require the checkpoint-capable private GitHub review runner")
    key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not key:raise RuntimeError("ElevenLabs API key missing")
    if load(ROOT/"kids/data/quiz-curation-release.json").get("enabled") is not False:
        raise RuntimeError("No original V4 batch when public 450 mode enabled prematurely")
    plan=load(PLAN);qa=load(TECHQA);readiness=load(READY)
    if len(plan.get("recipes",[]))!=450 or plan.get("voiceId")!=VOICE or plan.get("modelId")!=MODEL:
        raise RuntimeError("Curated 450 V4 contract changed; stop")
    if not readiness.get("safeToTryOneDirectV4Original"):
        raise RuntimeError("Read-only direct TTS API probe failed, no paid generation")
    if not qa.get("overallTechnicalPass") or qa.get("savedClipCount",0)<2:
        raise RuntimeError("First 2 paid V4 originals must pass hash/codec and sound-level QA first")
    registry=load(REGISTRY);ledger=load(LEDGER)
    if registry.get("live") is not False or ledger.get("live") is not False:
        raise RuntimeError("Registry is not guaranteed REVIEW ONLY")
    old_for_batch=[x for x in ledger.get("rows",[]) if x.get("batchId")==BATCH]
    if len(old_for_batch)>=LIMIT:
        print("V4_450_BATCH02_ALREADY_COMPLETE: zero new charges on repeat",flush=True)
        return
    if old_for_batch:
        raise RuntimeError("Partially charged batch exists. Reconcile exact saved originals first; never retry")
    attempts=load(ATTEMPTS) if ATTEMPTS.is_file() else {"batchId":BATCH,"entries":[]}
    if attempts.get("batchId")!=BATCH or not isinstance(attempts.get("entries"),list):
        raise RuntimeError("V4 batch02 original write-ahead journal changed; STOP")
    if attempts["entries"]:
        # Any prior request, including HTTP uncertainty, is protected. Never
        # replay an earlier paid batch from a new ephemeral GitHub runner.
        raise RuntimeError("V4 batch02 contains prior paid/uncertain request; recover the exact original first, NEVER re-synthesize")
    protected=protect_paid_texts(ROOT,registry,ledger)
    chosen,estimate=choose(plan,registry,protected)
    # All source-pronunciation defects are rejected BEFORE checking balance or
    # starting the first billable MP3. A late failure could waste prior takes.
    for item in chosen:
        if source_requires_separate_pronunciation_approval(item["text"]):
            raise RuntimeError("V4_PAID_PRECHECK_UNSEGMENTED_ARABIC_OR_UNLISTED_OWNER_PLS")
        exact_payload=build_canonical_v4_payload(item["text"],language="de")
        if exact_payload["pronunciation_dictionary_locators"]!=[{
            "pronunciation_dictionary_id":"Q8w3SxtoVo8NSjsnlJEd",
            "version_id":"wSzgkGpAwEDiTak8DApc"}]:
            raise RuntimeError("V4_PAID_PRECHECK_CANONICAL_LEXICON_MISSING")
    before=subscription(key)
    if before<max(estimate*1.5,estimate+50.0):
        raise RuntimeError("Subscription budget lower than estimated batch: no charges")
    print(f"V4_450_BATCH02_PLAN clips={len(chosen)} estimated_max={MAX_COST} estimate={estimate:.2f}",flush=True)
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for n,item in enumerate(chosen,1):
        text=item["text"]
        prohibit_prepaid_selection(text,protected)
        if text in registry["textClips"]:
            raise RuntimeError("Original already exists; do not synthesize again")
        code=hashlib.sha256((VOICE+"\n"+MODEL+"\n"+text).encode("utf-8")).hexdigest()
        dest=OUTPUT/(code[:32]+".mp3")
        if dest.exists():
            raise RuntimeError("Original bytes exist without ledger. Do NOT synthesize again")
        # Remote write-ahead checkpoint succeeds BEFORE any ElevenLabs POST.
        # A timeout, 402, ambiguous error or runner restart can therefore
        # never silently cause a fresh charge for this exact source SHA.
        text_sha=hashlib.sha256(text.encode("utf-8")).hexdigest()
        attempt={"textSHA256":text_sha,"status":"REQUEST_STARTED_UNCONFIRMED",
                 "batchId":BATCH,"startedAt":datetime.now(timezone.utc).isoformat(),
                 "masterDictionaryId":"Q8w3SxtoVo8NSjsnlJEd",
                 "masterDictionaryVersionId":"wSzgkGpAwEDiTak8DApc"}
        attempts["entries"].append(attempt)
        save(ATTEMPTS,attempts)
        persist_remote_paid_checkpoint(ATTEMPTS,purpose="batch02-request-"+text_sha[:12])
        audio,request_id=original_mp3(key,text)
        dest.write_bytes(audio)
        actual=hashlib.sha256(audio).hexdigest()
        registry["textClips"][text]={
            "url":"/"+str(dest.relative_to(ROOT)),
            "sha256":actual,"textSha256":hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "bytes":len(audio),"modelId":MODEL,"voiceId":VOICE,
            "audioListeningApproved":False,"qaApproval":"pending-human-auditory-review",
            "source":"official-direct-v4-text-to-speech-api",
            "status":"completed-original-mp3-on-review-branch-not-live",
            "providerRequestId":request_id
        }
        ledger["rows"].append({
            "batchId":BATCH,"text":text,"textSha256":registry["textClips"][text]["textSha256"],
            "estimatedCreditsAtObservedRate":round(len(text)*RATE,4),
            "exactBilledCredits":None,"mp3Sha256":actual,
            "providerRequestId":request_id,"createdAt":datetime.now(timezone.utc).isoformat(),
            "note":"Provider charged for audio; verify exact billing; no blind retries"
        })
        attempt["status"]="ORIGINAL_MP3_SAVED"
        attempt["mp3SHA256"]=actual
        attempt["providerRequestId"]=request_id
        save(REGISTRY,registry);save(LEDGER,ledger);save(ATTEMPTS,attempts)
        persist_remote_paid_checkpoint(
            ATTEMPTS,REGISTRY,LEDGER,dest,
            purpose="batch02-original-"+text_sha[:12])
        print(f"V4_450_BATCH02_ORIGINAL_SAVED locally={n}/{len(chosen)} sha={actual[:16]} size={len(audio)}",flush=True)
        if n<len(chosen):time.sleep(0.65)
    after=subscription(key)
    billing_delta=max(0,before-after)
    stats={"batchId":BATCH,"newOriginalMP3s":len(chosen),
           "estimatedCreditsAtObservedRate":round(estimate,2),
           "observedSubscriptionUsageDelta":round(billing_delta,2),
           "billableExpenseApproximate":True,
           "source":"eleven_v4","savedOnRunner":True,
           "listeningApproved":False,"live":False}
    save(USAGE,stats)
    persist_remote_paid_checkpoint(USAGE,
                                   purpose="batch02-final-usage")
    print("V4_450_BATCH02_SAVED_ALL "+json.dumps(stats,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
