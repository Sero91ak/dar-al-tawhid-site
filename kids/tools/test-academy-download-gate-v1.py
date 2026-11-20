#!/usr/bin/env python3
"""Credit-free security tests for the original ElevenLabs Ṣidq download gate."""
from __future__ import annotations
import importlib.util
import pathlib
import time
import urllib.parse

SOURCE = pathlib.Path(__file__).with_name("download-academy-elevenlabs-originals-v1.py")
spec = importlib.util.spec_from_file_location("safe_academy_download", SOURCE)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

session, generation = "sElA123cde", "gEN456original"
path = (
    "https://elevenlabsusercontent.com/database/workspace/9e52ab872d7b4775b36e50d2e07d17be/"
    "content_generation/" + session + "/" + generation + "/content.mp3"
)
query = urllib.parse.urlencode({
    "Expires": str(int(time.time()) + 86400),
    "KeyName": "assets-cdn-key-1", "Signature": "signed-token",
})
valid = path + "?" + query
assert module.safe_signed_url(valid, generation, session) == valid

bad = [
    valid.replace("elevenlabsusercontent.com", "elevenlabsusercontent.com.evil.test"),
    valid.replace("https://", "http://", 1),
    valid.replace("/" + generation + "/content.mp3", "/WRONG/content.mp3"),
    valid.replace("/" + session + "/", "/WRONG/"),
    valid.replace("/content.mp3", "/not-audio.mp3"),
    valid.replace("Signature=signed-token", "Signature="),
    path + "?Expires=1&KeyName=test&Signature=test",
    valid + "#fragment",
    valid.replace(module.WORKSPACE, "another-user-workspace"),
    path + "?Expires=not-a-time&KeyName=test&Signature=test",
]
for candidate in bad:
    try:
        module.safe_signed_url(candidate, generation, session)
    except (RuntimeError, ValueError):
        pass
    else:
        raise AssertionError("Unsafe signed URL was accepted")

originals = module.source_inventory()
assert len(originals) == 76
assert len(set(originals)) == 76
assert len({x["sessionId"] for x in originals.values()}) == 76
print("PASS: Academy V4 original download host/signature/session/expiry guard; 76 unique generation receipts; zero network calls, zero credits.")
