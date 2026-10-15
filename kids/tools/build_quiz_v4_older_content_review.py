#!/usr/bin/env python3
"""Create one private mobile-friendly offline pedagogical inspection page.

The KIDS V4 first 40 priority question/voice manifests are reviewed as text,
not speech; do not claim pronunciation was heard, source evidence was
externally verified, or generation was approved. Package as Actions artifact
ONLY. No URLs, voice API requests, or publication.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / ".github/reports"
FILES = [REPORTS / f"kids-v4-older-age-stage{i}-exact-voice-preflight.json"
         for i in (1, 2)]
HTML = ROOT / "kids/review-only/quiz-v4-older-40-text-content-review.html"
ZIP = ROOT / "kids/review-only/quiz-v4-older-40-text-content-review.zip"
AUDIT = REPORTS / "kids-v4-older40-editorial-source-findings.json"
RELEASE = ROOT / "kids/data/quiz-curation-release.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def validate(items):
    if load(RELEASE).get("enabled") is not False:
        raise RuntimeError("Never create a private reviewer page while public release enabled")
    texts = set()
    ids = set()
    for i, stage in enumerate(items, 1):
        if (stage["stage"] != i or stage["numberOfQuestions"] != 20
                or stage["numberOfNewOriginalTexts"] != (65 if i == 1 else 85)
                or stage["numberOfNewCharacters"] != (1842 if i == 1 else 3089)
                or stage["published"] is not False
                or stage["voiceGenerationAuthorized"] is not False
                or stage["newCreditsSpent"] != 0
                or stage["humanHearingApproved"] is not False):
            raise RuntimeError("Private review stage does not match verified no-credit contract")
        bands = {"7-8": 0, "9-10": 0}
        for q in stage["questions"]:
            if q["questionId"] in ids:
                raise RuntimeError("Duplicate selected question across stages")
            ids.add(q["questionId"])
            bands[q["ageBand"]] += 1
            if q["humanSourceApproval"] is not False or q["manualRecordingAuthorization"] is not False:
                raise RuntimeError("Question previously claimed reviewed or authorized")
            if len(q["answers"]) != 3 or q["correctAnswer"] not in q["answers"]:
                raise RuntimeError("Question choice mismatch")
        if bands != {"7-8": 10, "9-10": 10}:
            raise RuntimeError("Wrong age-group split")
        for t in stage["originalTextRecordingQueue"]:
            value = t["spokenText"]
            text_sha = hashlib.sha256(value.encode("utf-8")).hexdigest()
            if (text_sha != t["spokenTextSHA256"] or value in texts
                    or t["existingOriginalMP3"] is not False
                    or t["newRecordingStarted"] is not False
                    or t["explicitRecordingAuthorization"] is not False
                    or t["paidCreditsSpent"] != 0):
                raise RuntimeError("Original voice script repeated, modified, or authorized")
            texts.add(value)
    if len(texts) != 150 or len(ids) != 40:
        raise RuntimeError("Expected exactly 150 distinct text fragments and 40 questions")


PAGE = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>TAWḤĪD KIDS · Interne 40-Fragen-Quellenprüfung</title>
<style>
:root {color-scheme:light;--bg:#f5f2eb;--paper:#fffefa;--ink:#19322d;--muted:#57706b;--line:#d7e0d8;--accent:#2e5b4a;--gold:#9b7831}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--bg);margin:0}
main{max-width:950px;margin:auto;padding:22px 14px 80px}
h1{font-size:clamp(24px,5vw,33px);line-height:1.2;color:var(--accent);margin:6px 0}
h2{font-size:19px;margin:18px 0 12px}
header>p{color:var(--muted);max-width:760px;line-height:1.5}
.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:19px 0}
.summary>div{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:13px}
.summary strong{font-size:clamp(20px,4vw,26px);display:block}
.summary span{color:var(--muted);font-size:12px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}
button,select,input[type=search]{border:1px solid #afc4b6;background:var(--paper);color:var(--ink);border-radius:9px;padding:11px;font:inherit}
button{cursor:pointer}button:hover{border-color:var(--accent)}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent)}
input[type=search]{flex:1;min-width:170px}
.card{background:var(--paper);border:1px solid var(--line);padding:16px;border-radius:13px;margin:12px 0}
.card h3{font-size:17px;margin:0 0 7px}
.metadata{font-size:12px;color:var(--gold);font-weight:650}
.editorial-findings{border:1px solid #c79b6c;border-radius:9px;padding:11px;margin:12px 0;background:#fff8ea;font-size:14px}
.editorial-findings p{margin:7px 0 0}
.evidence-links{margin:9px 0;padding-left:22px;font-size:13px;overflow-wrap:anywhere}
.evidence-links a{color:var(--accent);text-decoration:underline}
.card p{line-height:1.5;margin:8px 0;overflow-wrap:anywhere}
.caption{font-size:12px;color:var(--muted)}
blockquote{border-left:3px solid #8da89a;margin:12px 0;padding:4px 10px;color:var(--ink)}
.review{margin-top:12px;display:block;font-size:14px;line-height:1.4}
.review input{width:18px;height:18px;accent-color:var(--accent);vertical-align:middle}
.nota{font-size:12px;color:var(--muted)}
.fragment{border-left:2px solid #b5cabb;padding:10px 11px;margin:9px 0;background:#fbfcfa;border-radius:0 8px 8px 0}
.fragment p{margin:0 0 8px;line-height:1.45;overflow-wrap:anywhere}
.fragment .caption{overflow-wrap:anywhere}
#empty{color:var(--muted)}
.footer{font-size:12px;color:var(--muted);margin-top:22px}
@media(max-width:580px){main{padding:17px 10px 70px}.card{padding:13px}.summary>div{padding:9px}}
</style>
</head>
<body>
<main>
<header>
<h1>TAWḤĪD KIDS · Interne Quellen- & Sprechtextprüfung</h1>
<p>40 ausgewählte Fragen für 7–8 und 9–10 Jahre · 2 Etappen · 150 noch nicht erzeugte Originalaufnahmen.
Prüfe den korrekten Inhalt, die Antworten und die Quellen. <strong>Das ist keine Hörprüfung und keine Freigabe zur kostenpflichtigen Aufnahme oder Veröffentlichung.</strong></p>
</header>
<div class="summary">
<div><strong>40</strong><span>Quellfragen</span></div>
<div><strong>150</strong><span>Neue Sprechtexte</span></div>
<div><strong id="reviewed">0</strong><span>Textuell geprüft</span></div>
</div>
<div class="toolbar">
<select id="stage"><option value="all">Beide Etappen</option><option value="1">Etappe 1 · 65 Texte</option><option value="2">Etappe 2 · 85 Texte</option></select>
<select id="age"><option value="all">Beide Altersgruppen</option><option value="7-8">7–8 Jahre</option><option value="9-10">9–10 Jahre</option></select>
<input id="search" type="search" placeholder="Frage, Quelle oder Text suchen" aria-label="Quelleninhalt durchsuchen">
<button type="button" id="toggle">Sprechtexte zeigen</button>
<button type="button" id="export">Text-Prüfvermerk als JSON sichern</button>
</div>
<section id="questions"><h2>Fragen mit Originalquellen</h2><div id="question-list"></div></section>
<section id="texts" hidden><h2>Original-Sprechtexte</h2><p class="nota">Diese MP3s existieren noch nicht. Die Texte dürfen nicht erneut berechnet werden, wenn bereits eine passende Originalaufnahme vorliegt.</p><div id="text-list"></div></section>
<p id="empty" hidden>Keine Einträge in der aktuellen Auswahl.</p>
<p class="footer">Interne Offline-Qualitätssicherung. Häkchen bedeuten ausschließlich eigenhändig durchgeführte TEXTprüfung, keine Quellenauthentifizierung durch den Computer, keine Anhörung, keine synthetische Sprache und keinerlei Aufnahmeberechtigung. Es gibt keinen automatischen Upload und keine Änderung der Kinder-App.</p>
</main>
<script type="application/json" id="review-data">__STAGE_REVIEW_DATA__</script>
<script type="application/json" id="editorial-data">__EDITORIAL_REVIEW_DATA__</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("review-data").textContent);
const audit=JSON.parse(document.getElementById("editorial-data").textContent);
const editorialFindings=new Map(audit.findings.map(x=>[x.questionId,x]));
const reviewed=new Set();
const stageEl=document.getElementById("stage");
const ageEl=document.getElementById("age");
const searchEl=document.getElementById("search");
const questions=document.getElementById("question-list");
const texts=document.getElementById("text-list");
let showingTexts=false;
function tag(name,cls,txt){const el=document.createElement(name);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
function render(){
 const stage=stageEl.value,age=ageEl.value,query=searchEl.value.toLocaleLowerCase("de");
 questions.replaceChildren();texts.replaceChildren();
 let shown=0;
 for(const block of data){
  if(stage!=="all"&&String(block.stage)!==stage)continue;
  for(const q of block.questions){
   if(age!=="all"&&q.ageBand!==age)continue;
   if(query&&![q.questionId,q.originalQuestion,q.originalSource,q.spokenQuestion,q.explanation,...q.answers].some(s=>String(s||"").toLocaleLowerCase("de").includes(query)))continue;
   shown++;
   const card=tag("article","card");
   card.append(tag("p","metadata","ETAPPE "+block.stage+" · "+q.ageBand+" Jahre · "+q.questionId));
   card.append(tag("h3",null,q.originalQuestion));
   card.append(tag("p",null,"Antworten: "+q.answers.map((a,i)=>(i+1)+". "+a).join("  ·  ")));
   card.append(tag("p",null,"Richtige Antwort: "+q.correctAnswer));
   card.append(tag("p",null,"Quelle laut Originalkatalog: "+String(q.originalSource||"Nicht angegeben")));
   const speech=tag("blockquote",null,"Fragentext: "+q.spokenQuestion);card.append(speech);
   card.append(tag("p","caption","Erklärung: "+q.explanation));
   const editorial=editorialFindings.get(q.questionId);
   if(!editorial)throw Error("Interner Prüfeintrag fehlt");
   if(editorial.editorialFlags.length){
     const note=tag("section","editorial-findings");
     note.append(tag("strong",null,"Redaktionell vor Audioaufnahme prüfen"));
     editorial.editorialFlags.forEach(f=>note.append(tag("p",null,f.reviewSuggestion)));
     card.append(note);
   }
   const citation=tag("p","caption",
      editorial.sourceSpotcheckEvidence.length
       ?"Quellenstichprobe vorhanden – trotzdem keine vollständige Freigabe"
       :"Quelle noch nicht extern einzeln abgeglichen");
   card.append(citation);
   if(editorial.sourceSpotcheckEvidence.length){
     const sources=tag("ul","evidence-links");
     editorial.sourceSpotcheckEvidence.forEach(item=>{
       const li=tag("li",null);
       const a=tag("a",null,item.source);
       a.href=item.url;a.rel="noreferrer noopener";a.target="_blank";
       li.append(a);sources.append(li);
     });
     card.append(sources);
   }
   if(q.automaticTextWarnings.length)card.append(tag("p","metadata","Prüfhinweis: "+q.automaticTextWarnings.join("; ")));
   const label=tag("label","review");
   const input=document.createElement("input");input.type="checkbox";input.checked=reviewed.has(q.questionId);
   input.addEventListener("change",()=>{if(input.checked)reviewed.add(q.questionId);else reviewed.delete(q.questionId);document.getElementById("reviewed").textContent=reviewed.size;});
   label.append(input,document.createTextNode(" Inhalt und Quellenzuordnung eigenhändig textuell kontrolliert"));
   card.append(label);
   questions.append(card);
  }
  for(const t of block.originalTextRecordingQueue){
   if(age!=="all"&&!t.neededBy.some(u=>block.questions.some(q=>q.questionId===u.questionId&&q.ageBand===age)))continue;
   if(query&&!t.spokenText.toLocaleLowerCase("de").includes(query))continue;
   const el=tag("div","fragment");el.append(tag("p",null,t.spokenText));
   el.append(tag("p","caption","Etappe "+block.stage+" · "+t.characters+" Zeichen · SHA-256 "+t.spokenTextSHA256));
   texts.append(el);
  }
 }
 document.getElementById("empty").hidden=shown!==0;
}
document.getElementById("toggle").addEventListener("click",()=>{
 showingTexts=!showingTexts;
 document.getElementById("questions").hidden=showingTexts;
 document.getElementById("texts").hidden=!showingTexts;
 document.getElementById("toggle").textContent=showingTexts?"Fragen zeigen":"Sprechtexte zeigen";
 render();
});
document.getElementById("export").addEventListener("click",()=>{
 const output={scope:"TAWHID_KIDS_OLDER_AGE_TEXT_ONLY_QA",schemaVersion:1,
  notAudioApproval:true,notAuthorizedPaidSynthesis:true,livePublished:false,
  exportedAt:new Date().toISOString(),reviewedQuestionIds:[...reviewed].sort()};
 const blob=new Blob([JSON.stringify(output,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="tawhid-kids-v4-40-text-review-only.json";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
[stageEl,ageEl].forEach(x=>x.addEventListener("change",render));searchEl.addEventListener("input",render);
render();
</script>
</body></html>
""".strip()


def main():
    manifest = [load(path) for path in FILES]
    validate(manifest)
    editorial = load(AUDIT)
    if (editorial.get("allSourcesVerified") is not False or
            editorial.get("humanSourceSignoffGranted") is not False or
            editorial.get("paidVoiceGenerationAuthorized") is not False or
            len(editorial.get("findings") or []) != 40):
        raise RuntimeError("External-source editorial review is absent or falsely approved")
    if {q["questionId"] for stage in manifest for q in stage["questions"]} != {
            q["questionId"] for q in editorial["findings"]}:
        raise RuntimeError("The external editorial review covers different questions")
    data = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    data = data.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    if PAGE.count("__STAGE_REVIEW_DATA__") != 1:
        raise RuntimeError("Missing unique HTML data placeholder")
    verified = json.dumps(editorial, ensure_ascii=False, separators=(",", ":"))
    verified = verified.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    if PAGE.count("__EDITORIAL_REVIEW_DATA__") != 1:
        raise RuntimeError("Missing unique editorial data placeholder")
    html = (PAGE.replace("__STAGE_REVIEW_DATA__", data)
            .replace("__EDITORIAL_REVIEW_DATA__", verified))
    HTML.parent.mkdir(parents=True, exist_ok=True)
    HTML.write_text(html, encoding="utf-8")
    with ZipFile(ZIP, "w", compression=ZIP_DEFLATED) as z:
        z.write(HTML, str(HTML.relative_to(ROOT)))
        for path in FILES + [AUDIT]:
            z.write(path, str(path.relative_to(ROOT)))
    with ZipFile(ZIP) as z:
        if z.testzip() is not None or len(z.namelist()) != 4:
            raise RuntimeError("Offline private content ZIP corrupt")
    print("PASS_KIDS_V4_40_SOURCE_TEXT_REVIEW_OFFLINE_ONLY " + json.dumps({
        "questions": 40, "originalTextsNotYetRecorded": 150,
        "editorialFlagsShown": editorial["questionsWithEditorialFlags"],
        "spotcheckedSourceReferences": editorial["sourceReferencesExternallySpotchecked"],
        "creditsSpent": 0, "textApprovalsGrantedByGenerator": 0,
        "voiceSynthesisAuthorized": False, "published": False,
        "file": str(ZIP.relative_to(ROOT)),
        "zipBytes": ZIP.stat().st_size,
    }), flush=True)


if __name__ == "__main__":
    main()
