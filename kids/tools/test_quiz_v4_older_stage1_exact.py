#!/usr/bin/env python3
"""Read-only first 20 older-age quiz V4 source and spend regression.

No ElevenLabs network, no voice synthesis, no human approvals. Explicitly
proves the first ten stage-1 texts and stage's future 65-original queue
cannot accidentally rebuy earlier paid speech or change the master voice.
"""
from __future__ import annotations
import json
import os
import sys
from types import SimpleNamespace
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import generate_quiz_v4_older_stage1_exact as stage1
import audit_quiz_v4_stage1_paid_audio_integrity as actual_paid_audio

def must(ok,msg):
    if not ok:raise AssertionError("V4_STAGE1_DRYRUN_FAILED: "+msg)

def main():
    registry,ledger,source,missing,protected=stage1.prepare()
    # Real bytes, not just registry metadata: this makes the long-standing,
    # successfully exercised no-credit regression check any new charged MP3s
    # even when a newly introduced workflow requires GitHub owner approval.
    real=actual_paid_audio.validate()
    expected_stage1=sum(x.get("batchId")==stage1.BATCH for x in ledger["rows"])
    must(real["realMP3BytesChecked"]==expected_stage1 and
         real["totalNewOriginals"]==expected_stage1,
         "actual paid original MP3 bytes are missing, forged or out of sync")
    # Forensic sourceRemaining counts every Stage-1 take NOT in this
    # *direct-paid* receipt ledger. It therefore still includes the
    # connected Flow originals that are already imported and those
    # reserved/not yet delivered; neither class is eligible for re-buy.
    stored=sum(item["spokenText"] in registry["textClips"]
               for item in source["originalTextRecordingQueue"])
    reserved=len(source["_reservedUnimportedTextSHA256"])
    uncertain=len(source.get("_uncertainPaidRequestTextSHA256",[]))
    flow_saved=stored-expected_stage1
    must(flow_saved>=0 and stored+reserved+uncertain+len(missing)==65
         and real["sourceRemaining"]==len(missing)+reserved+uncertain+flow_saved,
         "direct-paid receipt remainder was confused with unreserved new V4 speech queue")
    must(real.get("uncertainOriginalRequestCount")==uncertain
         and real.get("uncertainOriginalRequestTextSHA256")==sorted(source.get("_uncertainPaidRequestTextSHA256",[])),
         "uncertain charged original lacks explicit review-only quarantine evidence")
    must(not {p["spokenTextSHA256"] for p in missing}.intersection(
         source.get("_uncertainPaidRequestTextSHA256",[])),
         "an unresolved provider request was selected again for paid synthesis")
    must(not {p["spokenTextSHA256"] for p in missing}.intersection(
         source["_reservedUnimportedTextSHA256"]),
         "reserved/purchased connected Flow voice original was selected for repurchase")
    must(real["requestJournalReconciled"] is True and
         real["newCreditsSpentByThisAudit"]==0 and
         real["publicReleaseAllowed"] is False,
         "paid journal failed verification or audit allowed a public release")
    batch,estimate,complete_qids=stage1.candidate_batch(missing,source)
    qids={q["questionId"] for q in source["questions"]}
    must(len(qids)==20,"20 original question IDs must remain unchanged")
    must(len(source["originalTextRecordingQueue"])==65,"first stage must contain 65 exact V4 original texts")
    must(sum(q["ageBand"]=="7-8" for q in source["questions"])==10 and
         sum(q["ageBand"]=="9-10" for q in source["questions"])==10,
         "stage1 should span ten questions per older age band")
    must(stage1.VOICE=="DkU7j9uO4ZEtLD2iRZSH" and stage1.MODEL=="eleven_v4",
         "model/voice drift")
    must(0<=len(batch)<=10 and estimate<=850,
         "unapproved unexpected spend")
    # 850 is the ABSOLUTE per-run ceiling, not a minimum balance requirement.
    # Older behaviour refused an economical ~237-credit batch unless 850 were
    # available. The new cushion is proportional and never starts a request
    # without some margin for account/model billing differences.
    must(stage1.required_subscription_credits(237.42)==356.13,
         "next economical V4 batch requires an excessive or insufficient balance")
    must(stage1.required_subscription_credits(10)==60.0
         and stage1.required_subscription_credits(850)==1275.0,
         "subscription cushion must scale to the actual selected batch")
    try:
        stage1.required_subscription_credits(850.01)
    except RuntimeError:pass
    else:raise AssertionError("cost greater than fixed safety ceiling accepted")

    assert len(complete_qids)==len(set(complete_qids))
    if len(missing)==65:
        must(len(complete_qids)>=2,
             "first ten original MP3s should finish real questions rather than arbitrary A-Z fragments")
        age_by_id={q["questionId"]:q["ageBand"] for q in source["questions"]}
        must({age_by_id[q] for q in complete_qids}=={"7-8","9-10"},
             "first ten MP3s should advance both older age profiles")
    must(all(item["spokenText"] not in protected
             and item["spokenText"] not in registry["textClips"] for item in batch),
         "an original MP3 would be purchased twice")
    must(all(stage1.sha(item["spokenText"])==item["spokenTextSHA256"] for item in batch),
         "candidate text doesn't match immutable first-stage SHA")
    must(0<=len(missing)<=65,"wrong first-stage remainder")
    if len(missing)==65:
        must(len(batch)==10,"initial first-ten candidate queue changed")
        must(sum(len(x["spokenText"]) for x in missing)==1842,
             "the first 65 source texts must remain exactly 1842 Unicode characters")
    must(registry["live"] is False and ledger["live"] is False,
         "producer may not touch public audio")

    # Fail on tampering with the original stage's canonical speech SHA.
    with tempfile.TemporaryDirectory() as temp:
        invalid=json.loads(stage1.PREP.read_text(encoding="utf-8"))
        invalid["originalTextRecordingQueue"][0]["spokenTextSHA256"]="0"*64
        modified=Path(temp)/"tampered-stage1.json"
        modified.write_text(json.dumps(invalid,ensure_ascii=False),encoding="utf-8")
        original=stage1.PREP
        try:
            stage1.PREP=modified
            try:stage1.prepare()
            except RuntimeError:pass
            else:raise AssertionError("Tampered V4 original text was accepted")
        finally:stage1.PREP=original
    # Every paid billing/checkpoint write must atomically replace its own
    # complete file, leaving no partial sidecar after a successful update.
    with tempfile.TemporaryDirectory() as folder:
        dst=Path(folder)/"test-ledger.json"
        stage1.write(dst,{"revision":1,"notes":"unmodified original"})
        stage1.write(dst,{"revision":2,"notes":"still intact"})
        must(json.loads(dst.read_text(encoding="utf-8"))==
             {"revision":2,"notes":"still intact"},
             "paid ledger was not replaced by the complete new JSON")
        must(not dst.with_name(dst.name+".pending").exists(),
             "atomic write left a partial ledger/checkpoint next to its final file")
    source_code=Path(stage1.__file__).read_text(encoding="utf-8")
    must('temporary.replace(path)' in source_code and
         'staged.replace(path)' in source_code,
         "paid original MP3 and charge ledger must both use atomic replacement")

    # Recalculate after an imagined first ten genuine MP3s. This only
    # mutates in-memory lists; it NEVER invents or commits actual MP3s.
    completed_first={part["spokenTextSHA256"] for part in batch}
    remaining_after_first=[
        item for item in missing
        if item["spokenTextSHA256"] not in completed_first
    ]
    second,cost_second,second_finished=stage1.candidate_batch(remaining_after_first,source)
    must(not ({p["spokenTextSHA256"] for p in second}&completed_first),
         "next ten would pay for a text from an earlier batch again")
    must(len(second)<=10 and cost_second<=850,
         "second batch ignores fixed original count or estimated cost ceiling")
    must(all(qid in qids for qid in second_finished),
         "projected completions refer to a nonselected question")
    # Once all exact originals exist, no fake request is necessary: never
    # generate or misidentify an already-recorded text as an unpaid test.
    if missing:
        # Simulate a paid request with an uncertain provider result. Its SHA is
        # metadata ONLY: no mock MP3 and no provider network activity.
        with tempfile.TemporaryDirectory() as temp:
            saved_usage=stage1.USAGE
            saved_attempts=stage1.ATTEMPTS
            try:
                stage1.USAGE=Path(temp)/"usage-already-backed-up.json"
                stage1.ATTEMPTS=Path(temp)/"requests-local.json"
                test_attempt={
                    "textSHA256":missing[0]["spokenTextSHA256"],
                    "batchId":stage1.BATCH,"status":"REQUEST_STARTED_UNCONFIRMED",
                    "startedAt":"2026-10-17T00:00:00+00:00"}
                original_journal=stage1.read(saved_attempts)
                journal={"schemaVersion":1,"modelId":stage1.MODEL,
                         "voiceId":stage1.VOICE,
                         "purpose":"DO_NOT_REGENERATE_UNCERTAIN_PAID_REQUESTS",
                         "entries":[*original_journal["entries"],test_attempt]}
                stage1.durable_attempts(journal)
                backup=json.loads(stage1.USAGE.read_text(encoding="utf-8"))
                must(backup["requestJournal"]==journal and
                     json.loads(stage1.ATTEMPTS.read_text(encoding="utf-8"))==journal,
                     "uncertain paid POST journal not present in existing always-uploaded usage backup")
                # Demonstrate that the backup alone blocks a retry even if the
                # local journal is missing on the next runner.
                stage1.ATTEMPTS.unlink()
                _r,_l,sim_stage,sim_missing,_protected=stage1.prepare()
                must(test_attempt["textSHA256"] in sim_stage["_uncertainPaidRequestTextSHA256"],
                     "unconfirmed original was not quarantined using the mirrored backup journal")
                must(test_attempt["textSHA256"] not in {x["spokenTextSHA256"] for x in sim_missing},
                     "an uncertain paid original was reselected for spending")
                sim_batch,_,_=stage1.candidate_batch(sim_missing,sim_stage)
                must(test_attempt["textSHA256"] not in {x["spokenTextSHA256"] for x in sim_batch},
                     "the next cost-limited batch selected a text with an unresolved prior paid POST")
            finally:
                stage1.USAGE=saved_usage
                stage1.ATTEMPTS=saved_attempts

        # Checkpoint requires the real GitHub review runner and cannot silently
        # continue to ElevenLabs if the remote commit is not possible.
        original_git=stage1.subprocess.run
        initial_environ=dict(os.environ)
        calls=[]
        def fake_git(args,**kwargs):
            calls.append(args)
            return SimpleNamespace(returncode=0,
                stdout=("kids/data/quiz-v4-450-original-clip-registry.json\n"
                        if args[1:3]==["diff","--cached"] else ""),stderr="")
        try:
            stage1.subprocess.run=fake_git
            os.environ.pop("GITHUB_ACTIONS",None)
            try:
                stage1.persist_remote_paid_checkpoint(stage1.REG,purpose="test-block")
            except RuntimeError as exc:
                must("checkpoint-capable GitHub review runner" in str(exc),
                     "untrusted local execution was not rejected")
            else:
                raise AssertionError("Paid audio could proceed outside the review runner")
            must(not calls,"called GitHub from an untrusted non-workflow context")
            os.environ["GITHUB_ACTIONS"]="true"
            os.environ["GITHUB_REF_NAME"]="review/kids-quiz-v4-batch-001-020-20261014"
            stage1.persist_remote_paid_checkpoint(stage1.REG,purpose="test-checkpoint")
            must(any(args[1]=="commit" for args in calls)
                 and any(args[1]=="push" for args in calls),
                 "real paid GitHub checkpoint must commit and push before TTS")
            calls.clear()
            def failed_git(args,**kwargs):
                calls.append(args)
                if args[1]=="push":
                    return SimpleNamespace(returncode=1,stdout="",stderr="REMOTE_REJECTED")
                return fake_git(args,**kwargs)
            stage1.subprocess.run=failed_git
            try:
                stage1.persist_remote_paid_checkpoint(stage1.REG,purpose="test-deny")
            except RuntimeError as exc:
                must("GitHub paid original checkpoint failed" in str(exc),
                     "failed paid checkpoint should stop the next provider POST")
            else:
                raise AssertionError("Remote push failure did not block new ElevenLabs charges")
        finally:
            stage1.subprocess.run=original_git
            os.environ.clear()
            os.environ.update(initial_environ)
        generator_source=Path(stage1.__file__).read_text(encoding="utf-8")
        must(generator_source.index('purpose="request-"+sha(text)[:12]')<
             generator_source.index('audio,request_id=original_mp3(key,text)')<
             generator_source.index('purpose="original-"+sha(text)[:12]'),
             "remote request checkpoint must precede TTS, and original MP3 checkpoint follow it")

    # Even with both manual YES inputs, a wrong exact-batch fingerprint must
    # stop the producer BEFORE obtaining provider balance or sending paid TTS.
    def should_never_call_provider(*_args,**_kwargs):
        raise AssertionError("Provider accessed for a stale V4 recording batch!")
    saved_environ=dict(os.environ)
    saved_argv=sys.argv[:]
    old_subscription=stage1.subscription
    old_tts=stage1.original_mp3
    try:
        os.environ["KIDS_V4_STAGE1_APPROVED_CANONICAL_450"]="YES"
        os.environ["KIDS_V4_STAGE1_EXPLICIT_SPEND_APPROVAL"]="YES"
        os.environ["KIDS_V4_STAGE1_EXPECTED_BATCH_SHA256"]="0"*64
        os.environ["ELEVENLABS_API_KEY"]="DO-NOT-USE-TEST-CREDENTIAL"
        sys.argv=[saved_argv[0],"--produce"]
        stage1.subscription=should_never_call_provider
        stage1.original_mp3=should_never_call_provider
        try:
            stage1.main()
        except RuntimeError as exc:
            must("batch SHA" in str(exc),
                 "wrong batch was refused for a reason other than its stale fingerprint")
        else:
            raise AssertionError("Bad batch fingerprint was incorrectly accepted")
    finally:
        stage1.subscription=old_subscription
        stage1.original_mp3=old_tts
        sys.argv=saved_argv
        os.environ.clear()
        os.environ.update(saved_environ)
    print("PASS: stale batch approval rejected before provider access, "
          "safe second 10-take source selection, 0 credits")
    print("PASS: exact first-20 older quiz V4 stage; 65 original texts, "
          "first ten SHA matched, no prepaid duplicate, 0 new ElevenLabs credits")

if __name__=="__main__":main()
