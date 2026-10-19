#!/usr/bin/env python3
"""Zero-credit negative tests for original paid V4 ElevenLabs history recovery.

No audio is generated, faked, imported or mapped in this test. All history
responses are in-memory metadata. Only real provider GET bytes may be imported.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/"kids/tools/recover_quiz_v4_uncertain_history.py"
spec=importlib.util.spec_from_file_location("paid_history",SOURCE)
assert spec is not None and spec.loader is not None
recovery=importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)

def verify(ok,why):
    if not ok:raise AssertionError("V4_HISTORY_RECOVERY_TEST_FAILED: "+why)

def main():
    registry,ledger,journal,usage,waiting=recovery.targets()
    verify(registry["modelId"]=="eleven_v4","master V4 model changed")
    verify(registry["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH","master voice changed")
    verify(usage["requestJournal"]==journal,"protected paid request mirror lost")
    verify(registry["live"] is False and ledger["live"] is False,
           "production/public audio must remain blocked")
    verify(len(waiting)<=65,"unexpected stage audio count")

    example={
        "history_item_id":"Qh8Yt7PS3BkZzv5o6nXc",
        "date_unix":1711200000,
        "text":"Exact immutable lesson audio, not a substitute",
        "model_id":recovery.MODEL,"voice_id":recovery.VOICE,
        "source":"TTS","request_id":"ORIGINAL_USER_PAID"
    }
    verify(len(recovery.matching([example],example["text"],example["date_unix"]))==1,
           "exact original should be uniquely identifiable")
    errors=[
        dict(example,model_id="eleven_multilingual_v2"),
        dict(example,voice_id="other_voice"),
        dict(example,source="Flows"),
        dict(example,text="Different TTS text"),
        dict(example,date_unix=1711300000),
        dict(example,history_item_id=""),
    ]
    for changed in errors:
        verify(not recovery.matching([changed],example["text"],example["date_unix"]),
               "wrong-voice, text, source, time or ID must never recover")
    verify(len(recovery.matching([example,dict(example,history_item_id="secondPaidTake")],
                                  example["text"],example["date_unix"]))==2,
           "two matching originals must be declared ambiguous, not guessed")
    request_source=SOURCE.read_text(encoding="utf-8")
    verify("urllib.request.Request" in request_source and
           'method="GET"' in request_source and
           'method="POST"' not in request_source,
           "history recovery must never call synthesis POST")
    try:recovery.download("NEVER_REAL_KEY","../../tts")
    except RuntimeError:pass
    else:raise AssertionError("Unsafe history path bypassed allowlist")

    # An offline invocation must not contact ElevenLabs or change MP3 state.
    with patch.dict("os.environ",{"ELEVENLABS_API_KEY":""}):
        with patch.object(recovery.urllib.request,"urlopen",
                          side_effect=AssertionError("NO NETWORK")):
            # Skip running actual recover() here: it intentionally writes a
            # real status report. Exercise source-only matching and audit.
            rows=[x[0] for x in waiting]
            verify(len(rows)==len(set(rows)),"duplicate paid source hash")
            for digest,text,_,epoch in waiting:
                verify(recovery.sha_text(text)==digest,"original paid text modified")
                verify(epoch>0,"historical TTS call missing timestamp")
    print(json.dumps({
        "result":"PASS_READ_ONLY_PROVIDER_ORIGINAL_HISTORY_GUARD",
        "unconfirmedOldPaidOriginals":len(waiting),
        "synthesisRequests":0,"newCreditsSpent":0,
        "newMP3BytesCreated":0,"liveRelease":False
    }))

if __name__=="__main__":main()
