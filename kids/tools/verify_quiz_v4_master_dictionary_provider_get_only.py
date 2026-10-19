#!/usr/bin/env python3
"""Read-only audit against the *actual* linked ElevenLabs master dictionary.

NEVER synthesizes, purchases, changes or uploads a voice/dictionary. This
compares the user's current provider version and rule count against the
pinned 10,099-rule GitHub PLS and prints only safe metadata.
"""
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]


def main():
    config=json.loads((ROOT/"data/pronunciation/elevenlabs-production.json").read_text(encoding="utf-8"))
    d=config["pronunciationDictionary"]
    api_key=os.environ.get("ELEVENLABS_API_KEY","").strip()
    if not api_key:
        raise SystemExit("READ_ONLY_PROVIDER_DICTIONARY_CHECK_BLOCKED: missing credential")
    url="https://api.elevenlabs.io/v1/pronunciation-dictionaries/"+d["id"]
    request=urllib.request.Request(url,method="GET",headers={"xi-api-key":api_key,"Accept":"application/json"})
    try:
        with urllib.request.urlopen(request,timeout=40) as resp:
            if resp.status!=200:
                raise RuntimeError("Dictionary GET returned unexpected status")
            raw=resp.read(5_000_000)
    except urllib.error.HTTPError as error:
        raise SystemExit("READ_ONLY_DICTIONARY_GET_FAILED_HTTP_"+str(error.code))
    remote=json.loads(raw)
    actual_version=remote.get("latest_version_id")
    actual_rules=remote.get("latest_version_rules_num")
    assert remote.get("id")==d["id"],"Provider dictionary ID mismatch"
    assert actual_version==d["versionId"],"PRONUNCIATION_DICTIONARY_VERSION_STALE_STOP_NO_AUDIO"
    assert actual_rules==d["ruleCount"]==10099,"PRONUNCIATION_DICTIONARY_RULE_COUNT_CHANGED_STOP_NO_AUDIO"
    print("PASS_KIDS_V4_PROVIDER_MASTER_DICTIONARY_GET_ONLY "+json.dumps({
        "modelId":config["modelId"],
        "voiceId":config["masterVoice"]["voiceId"],
        "dictionaryId":remote["id"],
        "dictionaryName":remote.get("name"),
        "versionId":actual_version,
        "ruleCount":actual_rules,
        "verifiedAgainstCurrentProvider":True,
        "newSpeechCalls":0,
        "creditsSpent":0
    },ensure_ascii=False))


if __name__=="__main__":
    main()
