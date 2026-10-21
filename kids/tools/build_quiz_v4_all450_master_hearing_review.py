#!/usr/bin/env python3
"""Bundle the current, actual 450 KIDS V4 hearing pages and MP3s together.

The two existing offline hearing builders remain the authoritative source.
All 450 question sound references and every real MP3's SHA256 are validated.
This creates ONLY a private GitHub Actions artifact, with NO ElevenLabs API,
no audio synthesis, no automatic human approvals and no live deployment.
"""
from __future__ import annotations

import hashlib
import json
import posixpath
import re
from collections import Counter
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED

from build_quiz_v4_first150_hearing_review import main as build_younger
from build_quiz_v4_age7to10_hearing_review import main as build_older

ROOT=Path(__file__).resolve().parents[2]
REVIEW=ROOT/"kids/review-only"
ZIP_YOUNGER=REVIEW/"quiz-v4-first150-hearing-bundle.zip"
ZIP_OLDER=REVIEW/"quiz-v4-age7to10-hearing-bundle.zip"
OUT=REVIEW/"quiz-v4-450-master-hearing-bundle.zip"
SUMMARY=REVIEW/"QUIZ-V4-GESAMT-HOERPRUEFUNG-STATUS.md"
VOICE="DkU7j9uO4ZEtLD2iRZSH"
MODEL="eleven_v4"
HTML_NAMES=(
    "kids/review-only/quiz-v4-first150-hearing-review.html",
    "kids/review-only/quiz-v4-age7to10-hearing-review.html",
)
HTML_DATA=re.compile(r'<script type="application/json" id="review-data">(.*?)</script>',re.S)

INDEX="""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>TAWḤĪD KIDS – V4-Hörprüfung (450 Fragen)</title>
<style>
body{margin:0;background:#102b2b;color:#f3f3e8;font:16px system-ui,-apple-system,sans-serif}
main{max-width:740px;margin:auto;padding:32px 20px}
h1{font-family:Georgia,serif;color:#dfc999}
a{display:block;background:#1b3935;color:#f3e1a6;margin:16px 0;padding:19px;
  border:1px solid #52635a;border-radius:16px;text-decoration:none}
small{display:block;color:#c5d5cf;margin-top:6px}
p{line-height:1.6}
</style></head>
<body><main>
<h1>TAWḤĪD KIDS</h1>
<h2>Original-V4-Hörprüfung · 450 Fragen</h2>
<p>Alle verfügbaren, schon gespeicherten Original-V4-Hörteile sind hier
für eine persönliche Hörkontrolle zusammengeführt. Keine automatische
Aussprachefreigabe und keine Veröffentlichung.</p>
<a href="kids/review-only/quiz-v4-first150-hearing-review.html">
Hörprüfung 4–6 Jahre
<small>150 Fragen · persönliche Hörprüfung der vorhandenen MP3s</small>
</a>
<a href="kids/review-only/quiz-v4-age7to10-hearing-review.html">
Hörprüfung 7–10 Jahre
<small>300 Fragen · persönliche Hörprüfung der vorhandenen MP3s</small>
</a>
<p>Das Archiv vollständig entpacken und <strong>START-HIER.html</strong>
im Browser öffnen. Die Unterordner und MP3-Dateinamen unverändert lassen.
Verbindlich: <strong>eleven_v4</strong>, Serhat-Masterstimme.
Fehlende V4-Takes nicht durch ältere Stimmen ersetzen.</p>
</main></body></html>
"""


def check(ok,message):
    if not ok:
        raise RuntimeError("Private V4 master bundle invalid: "+message)


def main():
    # Use the real original-only hearing pages, not hardcoded audio counts.
    build_younger()
    build_older()
    sources=(ZIP_YOUNGER,ZIP_OLDER)
    content={}
    stats=[]
    referenced=[]
    for archive in sources:
        with ZipFile(archive) as z:
            check(z.testzip() is None, "source ZIP CRC failed")
            filenames=z.namelist()
            check(len(filenames)==len(set(filenames)),"duplicate source ZIP file path")
            pages=[x for x in filenames if x.endswith(".html")]
            check(len(pages)==1 and pages[0] in HTML_NAMES,
                  "each original review ZIP must include one known HTML file")
            for name in filenames:
                check(name.startswith(("kids/review-only/","kids/assets/kids-quiz-audio/")),
                      "unsafe ZIP file path")
                check(".." not in Path(name).parts and not name.startswith("/"),
                      "ZIP contains traversal or absolute path")
                check(name.endswith((".mp3",".html")),"Unexpected ZIP content")
                raw=z.read(name)
                if name in content:
                    check(hashlib.sha256(raw).digest()==hashlib.sha256(content[name]).digest(),
                          "two different originals share one MP3 path")
                else:
                    content[name]=raw
            page_name=pages[0]
            page=z.read(page_name).decode("utf-8")
            found=HTML_DATA.search(page)
            check(bool(found),"human-hearing review data is missing")
            data=json.loads(found.group(1))
            check(data.get("questionCount") in (150,300),"invalid question count")
            check(len(data.get("parts") or [])==data["questionCount"],
                  "missing question rows in offline hearing page")
            all_four=0
            parts_available=0
            part_missing=0
            for q in data["parts"]:
                actual_complete=True
                for part in q["parts"]:
                    source=part.get("src")
                    if not source:
                        part_missing+=1
                        actual_complete=False
                        continue
                    parts_available+=1
                    resolved=posixpath.normpath(posixpath.join(
                        posixpath.dirname(page_name),source))
                    check(resolved.startswith("kids/assets/kids-quiz-audio/")
                          and resolved in content,"auditory track MP3 missing from ZIP")
                    check(hashlib.sha256(content[resolved]).hexdigest()==part.get("audioSha"),
                          "spoken track SHA mismatch")
                    referenced.append(resolved)
                check(bool(q["complete"])==actual_complete,
                      "question completion marker is not truthful")
                all_four+=int(actual_complete)
            check(all_four==data.get("fullQuestions"),"full-questions count incorrect")
            stats.append({"ageRange":"4-6" if data["questionCount"]==150 else "7-10",
                          "questionCount":data["questionCount"],
                          "fourPartFullyRecorded":all_four,
                          "presentPartAssignments":parts_available,
                          "missingPartAssignments":part_missing,
                          "originalHtmlFile":page_name})
    check(sum(x["questionCount"] for x in stats)==450,"must contain 450 questions")
    total_present=sum(x["presentPartAssignments"] for x in stats)
    unique_audio={k:hashlib.sha256(v).hexdigest() for k,v in content.items() if k.endswith(".mp3")}
    unique_hash_count=len(set(unique_audio.values()))
    check(total_present+sum(x["missingPartAssignments"] for x in stats)==1800,
          "expected 450 * 4 voice parts")
    check(len({unique_audio[k] for k in referenced})==unique_hash_count,
          "included original MP3 is not referenced by a question")
    require_counts={"questions":450,"full":sum(x["fourPartFullyRecorded"] for x in stats),
                    "presentParts":total_present,"uniqueOriginalMp3Hashes":unique_hash_count}
    manifest={"schemaVersion":1,"app":"TAWḤĪD KIDS",
              "scope":"PRIVATE_HUMAN_HEARING_REVIEW_ONLY",
              "modelId":MODEL,"masterVoiceId":VOICE,
              **require_counts,"ageRanges":stats,
              "humanListeningApprovals":0,"publicReleaseAllowed":False,
              "newElevenLabsCreditsSpent":0,
              "mp3Sha256ByRelativePath":unique_audio}
    REVIEW.mkdir(parents=True,exist_ok=True)
    with ZipFile(OUT,"w",compression=ZIP_DEFLATED,compresslevel=3) as output:
        output.writestr("START-HIER.html",INDEX)
        output.writestr("V4-HOERPRUEFUNG-NACHWEIS.json",
                        json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
        for name,raw in sorted(content.items()):
            output.writestr(name,raw,
                            compress_type=ZIP_STORED if name.endswith(".mp3") else ZIP_DEFLATED)
    with ZipFile(OUT) as checkzip:
        check(checkzip.testzip() is None,"combined ZIP failed integrity check")
    SUMMARY.write_text(
        "# TAWḤĪD KIDS – gesamte Original-V4-Hörprüfung\n\n"
        "Nur privater Prüfbestand, keine öffentliche App, keine neuen Sprachcredits.\n\n"
        f"- Alter 4–6: **{stats[0]['fourPartFullyRecorded']}/150** Fragen komplett.\n"
        f"- Alter 7–10: **{stats[1]['fourPartFullyRecorded']}/300** Fragen komplett.\n"
        f"- Alle 450 Fragen: **{require_counts['full']}** vierteilig komplett.\n"
        f"- **{unique_hash_count}** unterschiedliche echte MP3-SHAs; "
        f"**{total_present}** vorhandene Hörteilzuordnungen.\n"
        "- Hörfreigaben: **0**; Veröffentlichung: **aus**.\n"
        "- Erzeugung: `python3 kids/tools/build_quiz_v4_all450_master_hearing_review.py`.\n"
        "- Exportiertes Offline-Paket: GitHub-Actions-Artefakt "
        "`tawhid-kids-v4-all450-human-hearing-offline-bundle`.\n"
        "- Enthält `START-HIER.html`, beide interaktiven Einzelhörprüfungen, "
        "Original-MP3s und Prüfsummennachweis.\n",
        encoding="utf-8")
    print("TAWHID_KIDS_MASTER_V4_HEARING_BUNDLE "+json.dumps({
        **require_counts,"humanApprovals":0,"creditsSpent":0,
        "zipBytes":OUT.stat().st_size,"publicRelease":False},
        ensure_ascii=False),flush=True)


if __name__=="__main__":
    main()
