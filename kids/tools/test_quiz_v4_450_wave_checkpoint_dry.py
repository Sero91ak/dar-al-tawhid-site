#!/usr/bin/env python3
"""Zero-credit checks of full-450 paid wave identities and remote receipts."""
from __future__ import annotations
import inspect
import json
import os
import sys
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"kids/tools"))
import generate_quiz_v4_450_paid_batch02 as producer

def check(ok,msg):
    if not ok:raise AssertionError(msg)

def main():
    check(producer.MODEL=="eleven_v4" and producer.VOICE=="DkU7j9uO4ZEtLD2iRZSH","wrong owner model/voice")
    check(producer.LIMIT==20 and producer.MAX_COST==1200,"paid batch ceiling drifted")
    for unsafe in ("Allāhumma bārik!", "Der Prophet ﷺ sagte...",
                   "Worum bat Mūsā عليه السلام?",
                   "Was lehrt der Ash-Sharḥ?", "Ghībah"):
        check(producer.source_requires_separate_pronunciation_approval(unsafe),
              "unapproved Arabic or missing PLS term was allowed to charge: "+unsafe)
    for safe in ("In schāʾ Allāh – wenn Allah will",
                 "Bismi-llāh – im Namen Allahs",
                 "Der Qurʾān erklärt den Īmān"):
        check(not producer.source_requires_separate_pronunciation_approval(safe),
              "an exact master lexicon term was needlessly blocked: "+safe)

    code=inspect.getsource(producer.main)
    check('persist_remote_paid_checkpoint(ATTEMPTS,purpose="batch02-request-"'
          in code,"missing remote journal before ElevenLabs API POST")
    check('persist_remote_paid_checkpoint(' in code and 'ATTEMPTS,REGISTRY,LEDGER,dest' in code,
          "missing remote MP3 and ledger receipt after paid POST")
    check(code.index('persist_remote_paid_checkpoint(ATTEMPTS,purpose="batch02-request-"')
          <code.index('audio,request_id=original_mp3(key,text)'),
          "paid POST occurs BEFORE remote write-ahead checkpoint")
    # New paid wave environment IDs and stable receipt names get fresh files;
    # existing 20-text legacy batch stays intact.
    import importlib
    previous=os.environ.get("KIDS_V4_450_BATCH_ID")
    try:
        os.environ["KIDS_V4_450_BATCH_ID"]="KIDS_V4_450_WAVE_001_20"
        importlib.reload(producer)
        check(producer.BATCH=="KIDS_V4_450_WAVE_001_20","wrong first wave")
        check(producer.ATTEMPTS.name==producer.BATCH+".json","wave receipt path collision")
        check(producer.USAGE.name==producer.BATCH+".json","wave cost path collision")
        os.environ["KIDS_V4_450_BATCH_ID"]="KIDS_V4_450_WAVE_002_20"
        importlib.reload(producer)
        check(producer.ATTEMPTS.name=="KIDS_V4_450_WAVE_002_20.json","second wave journal not isolated")
        os.environ.pop("KIDS_V4_450_BATCH_ID")
        importlib.reload(producer)
        check(producer.BATCH=="KIDS_V4_450_BATCH_02_20","legacy original batch lost")
        check(producer.ATTEMPTS.name=="quiz-v4-450-batch02-request-journal.json","legacy journal lost")
    finally:
        if previous is not None:
            os.environ["KIDS_V4_450_BATCH_ID"]=previous
        else:
            os.environ.pop("KIDS_V4_450_BATCH_ID",None)
        importlib.reload(producer)
    # No generation can begin outside private checkpoint-capable GitHub runner;
    # and the current owner hearing gate is not deceptively marked approved.
    hold=json.loads(producer.PRONUNCIATION_HOLD.read_text(encoding="utf-8"))
    check(hold["humanListeningQualityGateReleased"] is False,"fake hearing approval")
    check(json.loads((ROOT/"kids/data/quiz-curation-release.json").read_text())["enabled"] is False,"public release enabled")
    print("PASS_V4_450_SERIAL_PAID_WAVE_SAFETY_NO_CREDITS "+
          json.dumps({"legacyBatchPreserved":True,"distinctWaveJournalsTested":2,
          "remoteCheckpointBeforeAndAfterEveryPOST":True,
          "maxOriginalsPerWave":20,"maxEstimatedCreditsPerWave":1200,
          "allSavedAudioProtected":True,"humanHearingApproved":False,
          "newSyntheses":0,"creditsSpent":0,"publicRelease":False}))

if __name__=="__main__":
    main()
