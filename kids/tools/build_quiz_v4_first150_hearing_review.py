#!/usr/bin/env python3
"""Produce an OFFLINE, PRIVATE-REVIEW ONLY listening desk for the first 150 V4 questions.

Never calls ElevenLabs; never approves any audio; never changes a public KIDS
file. The locally opened HTML references authentic, hash-verified MP3s in the
same downloaded review archive and can export human decisions keyed by SHA256.
"""
from __future__ import annotations
import hashlib
import json
import os
import re
from zipfile import ZipFile, ZIP_STORED
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / "kids/data/quiz-v4-curated-450-production-review.json"
PREVIEW = ROOT / "kids/data/quiz-v4-first150-composed-preview.json"
QA = ROOT / "kids/data/quiz-v4-first150-composed-technical-qa.json"
STATUS = ROOT / "kids/data/quiz-v4-first150-audio-status.json"
FLAG = ROOT / "kids/data/quiz-curation-release.json"
OUTPUT = ROOT / "kids/review-only/quiz-v4-first150-hearing-review.html"
ARCHIVE = ROOT / "kids/review-only/quiz-v4-first150-hearing-bundle.zip"
PARTS = ("question", "correct", "retry", "explanation")
VOICE = "DkU7j9uO4ZEtLD2iRZSH"
MODEL = "eleven_v4"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest_file(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def main():
    if load(FLAG).get("enabled") is not False:
        raise RuntimeError("Review site cannot be produced with live release enabled")
    plan, preview, qa, status = [load(p) for p in (PLAN, PREVIEW, QA, STATUS)]
    if plan.get("modelId") != MODEL or plan.get("voiceId") != VOICE:
        raise RuntimeError("Unrecognized owner V4 source plan")
    if preview.get("published") is not False or preview.get("humanListeningApproved") is not False:
        raise RuntimeError("This tool requires an unapproved, unpublished preview")
    if preview.get("modelId") != MODEL or preview.get("voiceId") != VOICE:
        raise RuntimeError("Wrong preview model or voice")
    if qa.get("allCurrentMP3sTechnicallyValid") is not True or qa.get("failedFiles") != 0:
        raise RuntimeError("Cannot offer files that have not passed technical audio QA")
    rows = [q for q in plan["recipes"] if q["ageBand"] == "4-6"]
    if len(rows) != 150 or len(set(q["questionId"] for q in rows)) != 150:
        raise RuntimeError("Expected 150 unique 4–6 questions")
    if status.get("questionCount") != 150 or len(status.get("questions", [])) != 150:
        raise RuntimeError("The 150 question source status is incomplete")
    entries = preview.get("entries") or {}
    if len(entries) != qa.get("originalPreviewAudioFiles"):
        raise RuntimeError("QA count differs from the current MP3 preview")
    checked = {}
    for text, clip in entries.items():
        url = clip.get("url") or ""
        if (not url.startswith("/kids/assets/kids-quiz-audio/")
                or ".." in url or "?" in url or "#" in url):
            raise RuntimeError("An unexpected public or unsafe audio URL was found")
        mp3 = (ROOT / url.lstrip("/")).resolve()
        if not mp3.is_relative_to((ROOT / "kids/assets/kids-quiz-audio").resolve()):
            raise RuntimeError("Audio outside the authorized KIDS review area")
        if not mp3.is_file() or clip.get("modelId") != MODEL or clip.get("voiceId") != VOICE:
            raise RuntimeError("Original MP3 missing or incorrect voice")
        if not re.fullmatch("[0-9a-f]{64}", str(clip.get("sha256") or "")):
            raise RuntimeError("Original MP3 digest absent")
        if digest_file(mp3) != clip["sha256"]:
            raise RuntimeError("Original MP3 changed since technical QA")
        if clip.get("audioListeningApproved") is not False:
            raise RuntimeError("Review-only audio improperly claims hearing approval")
        checked[text] = {"url": os.path.relpath(mp3, OUTPUT.parent).replace(os.sep, "/"),
                         "sha": clip["sha256"],
                         "textSha": hashlib.sha256(text.encode("utf-8")).hexdigest()}
    data = []
    available_counts = dict.fromkeys(PARTS, 0)
    full = 0
    for q in rows:
        parts = []
        present = 0
        for kind in PARTS:
            spoken = q[kind]["text"]
            clip = checked.get(spoken)
            if clip is not None:
                present += 1
                available_counts[kind] += 1
            parts.append({"part": kind, "text": spoken,
                          "textSha": hashlib.sha256(spoken.encode("utf-8")).hexdigest(),
                          "src": clip["url"] if clip else None,
                          "audioSha": clip["sha"] if clip else None})
        full += present == 4
        data.append({"id": q["questionId"], "complete": present == 4, "parts": parts})
    if full != status.get("completeFourPartQuestions"):
        raise RuntimeError("Human review desk coverage differs from real status")
    if available_counts != status.get("availableFieldCounts"):
        raise RuntimeError("Audio field counts differ from real status")
    payload = {"title": "TAWḤĪD KIDS · V4 Hörprüfung · 4–6 Jahre",
               "questionCount": 150, "fullQuestions": full,
               "uniqueAudioFiles": len(checked), "ageBand": "4–6",
               "parts": data}
    # Prevent an utterance from changing the script element context.
    embedded_json = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    embedded_json = embedded_json.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    html = PAGE.replace("__EMBEDDED_REVIEW_DATA__", embedded_json)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html, encoding="utf-8")
    # One portable package: HTML + ONLY the real MP3s referenced by the
    # verified listening index. ZIP is an Actions artifact, never committed.
    source_files = {
        (ROOT / clip["url"].removeprefix("/")).resolve()
        for clip in entries.values()
    }
    with ZipFile(ARCHIVE, "w", compression=ZIP_STORED) as bundle:
        bundle.write(OUTPUT, arcname=str(OUTPUT.relative_to(ROOT)))
        for audio in sorted(source_files):
            if not audio.is_relative_to((ROOT / "kids/assets/kids-quiz-audio").resolve()):
                raise RuntimeError("Cannot package audio outside the verified root")
            bundle.write(audio, arcname=str(audio.relative_to(ROOT)))
    print("KIDS_V4_FIRST150_HEARING_REVIEW_CREATED " + json.dumps({
        "reviewOnly": True, "published": False, "creditsSpent": 0,
        "questions": len(rows), "fullyAvailable": full, "audioEntries": len(checked),
        "humanApprovalsMadeByGenerator": 0, "audioFilesInPackage": len(source_files),
        "packageBytes": ARCHIVE.stat().st_size, "output": str(OUTPUT.relative_to(ROOT))
    }), flush=True)


PAGE = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>TAWḤĪD KIDS · Interne V4-Hörprüfung</title>
<style>
:root { color-scheme: dark; font: 16px system-ui,-apple-system,sans-serif; --bg:#0c1c1c; --panel:#152b29; --ink:#eef5ee; --muted:#b2c6bf; --gold:#dcc68e; --line:#38524b; }
* { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--ink); }
main { max-width:960px; margin:0 auto; padding:22px 16px 70px; }
h1 { font-family:Georgia,serif; color:var(--gold); margin:0 0 9px; font-size:clamp(24px,5vw,36px); }
.intro { color:var(--muted); line-height:1.5; max-width:740px; }
.summary { display:flex; gap:10px; flex-wrap:wrap; margin:22px 0; }
.metric { background:var(--panel); border:1px solid var(--line); padding:12px 16px; border-radius:12px; min-width:150px; }
.metric strong { display:block; font-size:25px; font-variant-numeric:tabular-nums; }
.metric span { color:var(--muted); font-size:13px; }
.toolbar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom:14px; }
button,.file-label,input[type=search],select { font:inherit; color:var(--ink); border:1px solid var(--line); background:var(--panel); border-radius:10px; padding:10px 12px; }
button { cursor:pointer; } button:hover,.file-label:hover { border-color:var(--gold); }
button:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid var(--gold); }
input[type=search] { flex:1; min-width:170px; } .file-label { cursor:pointer; }
.file-label input { display:none; }
details { border:1px solid var(--line); background:var(--panel); border-radius:12px; margin:10px 0; overflow:hidden; }
summary { padding:15px; cursor:pointer; display:flex; justify-content:space-between; gap:12px; align-items:center; }
summary::marker { color:var(--gold); } summary strong { font-size:15px; }
.state { font-size:12px; color:var(--gold); text-align:right; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; padding:0 14px 14px; }
.track { border:1px solid var(--line); border-radius:10px; padding:12px; background:var(--bg); min-width:0; }
.track h3 { color:var(--gold); font-size:14px; margin:0 0 7px; }
.track p { font-size:14px; line-height:1.5; margin:0 0 10px; overflow-wrap:anywhere; }
.track audio { display:block; width:100%; height:38px; margin-bottom:9px; }
.track label { font-size:13px; color:var(--muted); display:flex; gap:8px; align-items:center; }
.track input { accent-color:#89bea4; width:18px; height:18px; }
.unavailable { color:var(--muted); font-size:13px; }
#empty { color:var(--muted); padding:10px; }
.note { margin-top:17px; font-size:13px; color:var(--muted); }
@media(max-width:650px){.grid{grid-template-columns:1fr}.metric{flex:1;min-width:120px} main{padding:20px 12px 60px}}
</style>
</head>
<body>
<main>
<h1>TAWḤĪD KIDS · V4-Hörprüfung</h1>
<p class="intro">Interne Prüfoberfläche für 150 Fragen (4–6 Jahre). Spiele jede vorhandene Aufnahme vollständig ab und bestätige nur nach tatsächlicher menschlicher Kontrolle von Aussprache, Pausen, korrektem Inhalt und kindgerechter Verständlichkeit. Keine Freigabe erfolgt automatisch.</p>
<section class="summary" aria-label="Prüfstand">
<div class="metric"><strong id="questions"></strong><span>vollständige Fragensätze</span></div>
<div class="metric"><strong id="files"></strong><span>einmalige Audioaufnahmen</span></div>
<div class="metric"><strong id="progress">0</strong><span>persönlich freigegebene Aufnahmen</span></div>
</section>
<div class="toolbar">
<input id="search" type="search" placeholder="Frage suchen, z. B. 025" aria-label="Frage suchen">
<select id="filter" aria-label="Fragen filtern"><option value="all">Alle 150</option><option value="complete">Vollständige Fragen</option><option value="missing">Unvollständige Fragen</option></select>
<button id="export" type="button">Hörfreigaben als JSON sichern</button>
<label class="file-label">Freigaben wieder einlesen<input id="import" type="file" accept=".json,application/json"></label>
</div>
<div id="questions-list"></div>
<p id="empty" hidden>Keine Fragen in dieser Auswahl.</p>
<p class="note">Nur für die interne Qualitätssicherung. Eine JSON-Datei enthält ausschließlich eigenhändig gesetzte und an MP3-Prüfsummen gebundene Freigaben. Sie veröffentlicht nichts und verändert die Kinder-App nicht. Zum Abhören bitte die HTML-Datei zusammen mit den MP3-Verzeichnissen aus dem zugehörigen GitHub-Artefakt entpacken.</p>
</main>
<script type="application/json" id="review-data">__EMBEDDED_REVIEW_DATA__</script>
<script>
"use strict";
const data = JSON.parse(document.getElementById("review-data").textContent);
const distinct = new Map();
for (const q of data.parts) for (const p of q.parts) {
  if (p.src) {
    const old = distinct.get(p.textSha);
    if (old && old !== p.audioSha) throw new Error("Conflicting original SHA for one utterance");
    distinct.set(p.textSha, p.audioSha);
  }
}
const played = new Set();
const approved = new Map();
const labels = {question:"Frage",correct:"Richtige Antwort · Lob",retry:"Erneuter Versuch",explanation:"Erklärung"};
const list = document.getElementById("questions-list");
document.getElementById("questions").textContent = data.fullQuestions+" / "+data.questionCount;
document.getElementById("files").textContent = distinct.size;
function progress(){ document.getElementById("progress").textContent = approved.size+" / "+distinct.size; }
function syncChecks(sha){
  document.querySelectorAll('input[data-text-sha="'+sha+'"]').forEach(node => {
    node.disabled = !played.has(sha) && !approved.has(sha);
    node.checked = approved.has(sha);
  });
}
function makePart(p) {
  const section = document.createElement("section"); section.className = "track";
  const h = document.createElement("h3"); h.textContent=labels[p.part]; section.append(h);
  const text = document.createElement("p"); text.textContent=p.text; section.append(text);
  if (!p.src) {
    const missing=document.createElement("span");missing.className="unavailable";
    missing.textContent="Original-MP3 noch nicht vorhanden – keine Hörfreigabe möglich.";
    section.append(missing);
    return section;
  }
  const player = document.createElement("audio");
  player.controls = true; player.preload = "none"; player.src = p.src;
  player.addEventListener("ended", () => {played.add(p.textSha);syncChecks(p.textSha);});
  section.append(player);
  const label=document.createElement("label");
  const checkbox=document.createElement("input");
  checkbox.type="checkbox"; checkbox.dataset.textSha=p.textSha;
  checkbox.disabled=!played.has(p.textSha)&&!approved.has(p.textSha);
  checkbox.checked=approved.has(p.textSha);
  checkbox.addEventListener("change",()=>{
    if (checkbox.checked && !played.has(p.textSha) && !approved.has(p.textSha)) {
      checkbox.checked=false; return;
    }
    if (checkbox.checked) approved.set(p.textSha,p.audioSha);
    else approved.delete(p.textSha);
    syncChecks(p.textSha);progress();
  });
  label.append(checkbox,document.createTextNode("Vollständig angehört und fachlich geprüft"));
  section.append(label);
  return section;
}
function render(){
  const query=document.getElementById("search").value.trim().toLowerCase();
  const filter=document.getElementById("filter").value;
  list.replaceChildren();
  let shown=0;
  for(const q of data.parts){
    if (query && !q.id.toLowerCase().includes(query)) continue;
    if (filter==="complete"&&!q.complete) continue;
    if (filter==="missing"&&q.complete) continue;
    shown++;
    const details=document.createElement("details");
    const summary=document.createElement("summary");
    const id=document.createElement("strong");id.textContent="Frage "+q.id.split("-").pop();
    const state=document.createElement("span");state.className="state";
    state.textContent=q.complete?"4/4 MP3 vorhanden":"Aufnahmen fehlen";
    summary.append(id,state);details.append(summary);
    details.addEventListener("toggle",()=>{
      if (!details.open || details.dataset.built) return;
      details.dataset.built="1";
      const grid=document.createElement("div");grid.className="grid";
      q.parts.forEach(p=>grid.append(makePart(p)));
      details.append(grid);
    });
    list.append(details);
  }
  document.getElementById("empty").hidden=shown!==0;
}
document.getElementById("search").addEventListener("input",render);
document.getElementById("filter").addEventListener("change",render);
document.getElementById("export").addEventListener("click",()=>{
  const output={schemaVersion:1,scope:"TAWHID_KIDS_FIRST150_AGE4_6_HUMAN_AUDIO_LISTENING",
    approvedAudioShaByTextSha:Object.fromEntries([...approved.entries()].sort())};
  const blob=new Blob([JSON.stringify(output,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url;a.download="quiz-v4-first150-human-auditory-approvals.json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.getElementById("import").addEventListener("change",async (event)=>{
  const file=event.target.files[0];if(!file)return;
  try {
    const obj=JSON.parse(await file.text());
    const rows=obj.approvedAudioShaByTextSha;
    if(!rows||typeof rows!=="object"||Array.isArray(rows))throw Error("Ungültige Freigabedatei");
    let restored=0;
    for(const [sha,mp3] of Object.entries(rows)){
      if(distinct.get(sha)===mp3){approved.set(sha,mp3);restored++;}
    }
    for(const sha of distinct.keys())syncChecks(sha);
    progress();
    alert(restored+" zur aktuellen Originaldatei passende Freigaben geladen. Nicht passende Hashes ignoriert.");
  }catch(e){alert("Die Freigabedatei konnte nicht geprüft werden: "+e.message);}
  event.target.value="";
});
progress();render();
</script>
</body>
</html>
""".strip()


if __name__ == "__main__":
    main()
