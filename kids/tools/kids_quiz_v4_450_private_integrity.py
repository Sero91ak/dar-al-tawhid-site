#!/usr/bin/env python3
"""TAWḤĪD KIDS: strict read-only age, text and MP3 validation of the private 450 V4 set."""
from collections import Counter
from pathlib import Path
import hashlib
import json

ROOT=Path(__file__).resolve().parents[2]
def read(path):
    return json.loads((ROOT/path).read_text(encoding="utf-8"))

catalog=read("kids/data/quiz-kids.json")["items"]
selected=read("kids/data/quiz-kids-curated-450-review.json")["items"]
reserve=read("kids/data/quiz-kids-expansion-reserve-450.json")["items"]
recipe=read("kids/data/quiz-v4-curated-450-production-review.json")
audio=read("kids/review-only/quiz-v4-final13-450-candidate-review/candidate-450-playback-manifest.json")
hold=read("kids/data/quiz-v4-pronunciation-hold.json")
release=read("kids/data/quiz-curation-release.json")

assert len(catalog)==900 and len(selected)==450 and len(reserve)==450
originals={q["id"]:q for q in catalog}
assert len(originals)==900
assert len({q["id"] for q in selected+reserve})==900
assert all(q==originals[q["id"]] for q in selected+reserve)
assert Counter(q["ageBand"] for q in selected)=={"4-6":150,"7-8":150,"9-10":150}
assert Counter(q["ageBand"] for q in reserve)=={"4-6":150,"7-8":150,"9-10":150}
assert recipe["modelId"]==audio["modelId"]=="eleven_v4"
assert recipe["voiceId"]==audio["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH"
assert audio["reviewOnly"] is True and audio["humanListeningApproved"] is False
assert audio["publicReleaseEnabled"] is False and release["enabled"] is False
assert hold.get("humanPronunciationApproved") is not True
assert len(recipe["recipes"])==450 and len(audio["questions"])==450
spoken={r["questionId"]:r for r in recipe["recipes"]}
assert set(spoken)==set(audio["questions"])=={q["id"] for q in selected}

files={}
for q in selected:
    name=q["id"]
    r=spoken[name]
    meta=audio["questions"][name]
    assert r["ageBand"]==meta["ageBand"]==q["ageBand"]
    assert r["category"]==q["category"]
    assert set(meta["parts"])=={"question","correct","retry","explanation"}
    assert meta["fourPartTechnicallyReady"] is True
    assert meta["humanListeningApproved"] is False
    assert meta["publicPlaybackAuthorized"] is False
    for part in ("question","correct","retry","explanation"):
        p=meta["parts"][part]
        text=r[part]["text"]
        assert hashlib.sha256(text.encode("utf-8")).hexdigest()==p["spokenTextSha256"],(name,part,"spoken text mismatch")
        assert p["voiceId"]=="DkU7j9uO4ZEtLD2iRZSH" and p["modelId"]=="eleven_v4"
        assert p["audioListeningApproved"] is False
        url=p["url"]
        assert url.startswith("/kids/assets/kids-quiz-audio/v4-") and url.endswith(".mp3"),(name,part,"invalid path")
        path=(ROOT/url.lstrip("/")).resolve()
        assert path.is_relative_to((ROOT/"kids/assets/kids-quiz-audio").resolve()),(name,part)
        assert path.is_file(),(name,part,"missing MP3")
        assert path.stat().st_size==p["bytes"],(name,part,"file size")
        if path not in files:
            files[path]=hashlib.sha256(path.read_bytes()).hexdigest()
        assert files[path]==p["sha256"],(name,part,"SHA-256 mismatch")

assert len(files)==884,(len(files),"unexpected number of original MP3 files")
print("PASS: 900 unchanged canonical questions, 150×3 selected + 150×3 reserve")
print("PASS: 1800 exact V4 speech texts mapped by original Question-ID, age and part")
print("PASS: 884 real MP3 files with checked byte sizes and SHA-256")
print("RELEASE HOLD: 0/450 human listening approvals; not authorized for public playback")
