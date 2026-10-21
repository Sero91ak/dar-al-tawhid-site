#!/usr/bin/env python3
"""Assemble only AVAILABLE paid V4 audio for KIDS age 7–8 and 9–10 offline QA.

Zero ElevenLabs requests, zero credits, no live/public files or human approvals.
Creates one non-versioned, portable ZIP for manual review using verified real
audio clips; unavailable questions/explanations remain explicitly unavailable.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
from collections import Counter
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile

from quiz_v4_first150_offline_join import source_mp3, assemble, probe

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
REGISTRY = ROOT / "kids/data/quiz-v4-450-original-clip-registry.json"
SWITCH = ROOT / "kids/data/quiz-curation-release.json"
REVIEW = ROOT / "kids/review-only/quiz-v4-older300"
ZIP = ROOT / "kids/review-only/quiz-v4-older300-review.zip"
PARTS = ("question", "correct", "retry", "explanation")
BANDS = ("7-8", "9-10")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(data):
    return hashlib.sha256(data).hexdigest()


def file_digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def available_part(part, registry):
    if part["mode"] == "existing-paid-exact":
        gid = part["generationId"]
        clip = registry["generationClips"].get(gid)
        if clip is None:
            return None, ["paid-original-not-imported:" + gid]
        # Exact old paid generation ID MUST match its historical spoken text.
        if clip.get("textSha256") != digest(part["text"].encode("utf-8")):
            raise RuntimeError("Paid V4 generation ID points to conflicting text: " + gid)
        return [source_mp3(clip)], []
    if part["mode"] != "compose-from-segments":
        raise RuntimeError("Unexpected ElevenLabs V4 plan mode")
    fragments = part["segments"]
    if not fragments or " ".join(fragments) != part["text"]:
        raise RuntimeError("Composition changes the canonical spoken wording")
    pauses = part.get("pauseAfterMs", [])
    if len(pauses) != len(fragments) - 1:
        raise RuntimeError("Missing or extra segment pause in audio plan")
    if any(not isinstance(ms, (float, int)) or not 0 <= ms <= 2000 for ms in pauses):
        raise RuntimeError("Unapproved pause duration")
    missing = [t for t in fragments if t not in registry["textClips"]]
    if missing:
        return None, missing
    return [source_mp3(registry["textClips"][t]) for t in fragments], []


def main():
    if load(SWITCH).get("enabled") is not False:
        raise RuntimeError("No offline preparation when release is enabled")
    plan, registry = load(PLAN), load(REGISTRY)
    if plan.get("status") is None or len(plan.get("recipes", [])) != 450:
        raise RuntimeError("The canonical 450-question speech plan must be intact")
    if (plan.get("voiceId"), plan.get("modelId")) != (VOICE, MODEL):
        raise RuntimeError("Incorrect original voice / model in production plan")
    if (registry.get("voiceId"), registry.get("modelId"), registry.get("live")) != (
        VOICE, MODEL, False
    ):
        raise RuntimeError("Original MP3 registry must be V4 review-only")
    for band in BANDS:
        rows = [q for q in plan["recipes"] if q["ageBand"] == band]
        if len(rows) != 150:
            raise RuntimeError("Expected exactly 150 selected questions for " + band)
    all_rows = [q for q in plan["recipes"] if q["ageBand"] in BANDS]
    if len(all_rows) != 300 or len(set(q["questionId"] for q in all_rows)) != 300:
        raise RuntimeError("Expected 300 distinct older-child question IDs")

    # Only read existing original assets. All output is in the ignored review path.
    REVIEW.mkdir(parents=True, exist_ok=True)
    AUDIO = REVIEW / "audio"
    AUDIO.mkdir(parents=True, exist_ok=True)
    previews, missing, by_band = {}, Counter(), {}
    verified_source_sha = {}
    for band in BANDS:
        rows = [q for q in all_rows if q["ageBand"] == band]
        per_part = dict.fromkeys(PARTS, 0)
        complete, question_rows = 0, []
        for q in rows:
            fields = {}
            for part_name in PARTS:
                part = q[part_name]
                clips, gaps = available_part(part, registry)
                if clips is None:
                    for fragment in gaps:
                        missing[fragment] += 1
                    fields[part_name] = {
                        "available": False, "text": part["text"],
                        "missingFragments": gaps,
                    }
                    continue
                if part["mode"] == "compose-from-segments" and len(clips) > 1:
                    # Include pause distribution in the fingerprint, not just text.
                    key = digest((VOICE + "|" + MODEL + "|" + part["text"] + "|" +
                                  json.dumps(part["pauseAfterMs"])).encode("utf-8"))
                    composed = AUDIO / (key + ".mp3")
                    if not composed.exists():
                        assemble(clips, part["pauseAfterMs"], composed)
                    src = composed
                else:
                    src = clips[0]
                sha = file_digest(src)
                if src == clips[0]:
                    # Existing files are independently checked by source_mp3.
                    verified_source_sha[str(src)] = sha
                filename = sha + ".mp3"
                dest = AUDIO / filename
                if not dest.exists():
                    shutil.copyfile(src, dest)
                if file_digest(dest) != sha or dest.stat().st_size < 1500:
                    raise RuntimeError("Packed original MP3 corrupted")
                probe(dest)
                audio = {"available": True, "text": part["text"],
                         "audio": "audio/" + filename, "sha256": sha}
                old = previews.get(part["text"])
                if old is not None and old != {"audio": audio["audio"], "sha256": sha}:
                    raise RuntimeError("The same V4 utterance has conflicting recordings")
                previews[part["text"]] = {"audio": audio["audio"], "sha256": sha}
                fields[part_name] = audio
                per_part[part_name] += 1
            ready = all(fields[k]["available"] for k in PARTS)
            complete += int(ready)
            question_rows.append({"id": q["questionId"], "ageBand": band,
                                  "fullyAvailable": ready, "parts": fields})
        by_band[band] = {"questions": len(rows), "completeFourPartQuestions": complete,
                         "availableFieldCounts": per_part,
                         "missingFieldAssignments": 600 - sum(per_part.values()),
                         "questionsList": question_rows}

    report = {
        "schemaVersion": 1, "app": "TAWḤĪD KIDS",
        "scope": "OLDER_300_PRIVATE_V4_OFFLINE_EXISTING_AUDIO_ONLY",
        "voiceId": VOICE, "modelId": MODEL,
        "published": False, "audioListeningApproved": False, "readyForLive": False,
        "newElevenLabsCreditsSpent": 0,
        "originalAudioFilesModified": False,
        "humanSourceAndPronunciationVerificationRequired": True,
        "originalFragmentsVerifiedReadOnly": len(verified_source_sha),
        "uniquePlayableUtterances": len(previews),
        "uniqueMissingFragments": len(missing),
        "mostFrequentlyMissingFragments": [
            {"fragment": s, "requiredByParts": n}
            for s, n in missing.most_common(25)
        ],
        "bands": by_band,
    }
    (REVIEW / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    page = """<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>TAWḤĪD KIDS – Altersgruppen 7–8 und 9–10 – private V4-Hörvorschau</title><style>
:root{color-scheme:dark;font:15px system-ui;--back:#101c1f;--panel:#183036;--gold:#ebd3a7;--text:#f2f6f5}
body{background:var(--back);color:var(--text);margin:0}main{max-width:880px;margin:auto;padding:22px}
h1{color:var(--gold);font-size:26px}p{line-height:1.5}input,select{font:inherit;background:var(--panel);color:var(--text);padding:10px;border:1px solid #4e6464;border-radius:8px;max-width:100%}
nav{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}
details{background:var(--panel);margin:9px 0;padding:14px;border-radius:10px}summary{cursor:pointer;font-weight:650;color:var(--gold)}
article{padding:10px 0;border-top:1px solid #536267}audio{width:100%;max-width:580px}
.missing{font-size:13px;color:#eec8bc}.small{color:#afc7c7;font-size:13px}
</style></head><body><main><h1>TAWḤĪD KIDS · V4-Hörvorschau für 7–10 Jahre</h1>
<p>Interne Offline-Vorschau. Nur tatsächlich vorhandene und technisch überprüfte Originalstimmen werden abgespielt. Fehlende Fragen und Erklärungen bleiben markiert. Dies ist keine Hörfreigabe und keine öffentliche Kinder-App.</p>
<nav><select id="age" aria-label="Altersgruppe"><option value="all">Beide Gruppen</option><option value="7-8">7–8 Jahre</option><option value="9-10">9–10 Jahre</option></select>
<input id="search" type="search" placeholder="Fragenummer oder Suchwort" aria-label="Suche"></nav>
<p id="summary" class="small"></p><section id="items"></section></main>
<script type="application/json" id="reviewdata">__REVIEW_DATA__</script>
<script>
"use strict";
const data=JSON.parse(document.querySelector("#reviewdata").textContent);
const names={question:"Frage",correct:"Lob",retry:"Erneut versuchen",explanation:"Erklärung"};
const list=document.getElementById("items");
function display(){
 const age=document.getElementById("age").value,search=document.getElementById("search").value.toLowerCase();
 list.replaceChildren();let count=0,complete=0;
 for(const row of data){
   if(age!=="all"&&row.ageBand!==age)continue;
   if(search&&!row.id.toLowerCase().includes(search)&&!Object.values(row.parts).some(p=>p.text.toLowerCase().includes(search)))continue;
   count++;complete+=Number(row.fullyAvailable);
   const details=document.createElement("details");
   const summary=document.createElement("summary");
   summary.textContent=row.id+" · "+row.ageBand+" Jahre · "+(row.fullyAvailable?"4/4 vorhanden":"Audio noch unvollständig");
   details.append(summary);
   details.addEventListener("toggle",()=>{if(!details.open||details.dataset.built)return;details.dataset.built="yes";
     for(const [kind,part] of Object.entries(row.parts)){
       const box=document.createElement("article"),name=document.createElement("strong"),txt=document.createElement("p");
       name.textContent=names[kind];txt.textContent=part.text;box.append(name,txt);
       if(part.available){const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.src=part.audio;box.append(audio);}
       else{const note=document.createElement("p");note.className="missing";note.textContent="Noch keine authentische Original-MP3 vorhanden.";box.append(note)}
       details.append(box);
     }
   });
   list.append(details);
 }
 document.getElementById("summary").textContent=count+" Fragen · "+complete+" davon mit vier Audioteilen. Keine Aufnahmen neu generiert.";
}
document.getElementById("age").addEventListener("change",display);
document.getElementById("search").addEventListener("input",display);display();
</script></body></html>"""
    page = page.replace(
        "__REVIEW_DATA__",
        json.dumps(
            [q for age in BANDS for q in by_band[age]["questionsList"]],
            ensure_ascii=False, separators=(",", ":")
        ).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    )
    (REVIEW / "index.html").write_text(page, encoding="utf-8")
    # Archive only the generated local review folder; GitHub artifact, never git.
    with ZipFile(ZIP, "w", ZIP_STORED) as archive:
        for path in sorted(REVIEW.rglob("*")):
            if path.is_file():
                archive.write(path, arcname=path.relative_to(REVIEW).as_posix())
    print("KIDS_V4_OLDER300_OFFLINE_AUDIO_PASS " + json.dumps({
        "bands": {
            band: {key: value for key, value in by_band[band].items()
                   if key != "questionsList"}
            for band in BANDS
        },
        "uniquePlayableUtterances": len(previews),
        "uniqueMissingFragments": len(missing),
        "existingSourceMP3Verified": len(verified_source_sha),
        "offlineArchiveBytes": ZIP.stat().st_size,
        "elevenLabsCreditsSpent": 0,
        "humanApproved": False, "livePublished": False,
    }, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
