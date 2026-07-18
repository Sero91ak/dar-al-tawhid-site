import fs from "fs";
import path from "path";

const root = path.resolve(".");
const files = ["index.html", "test/index.html"];

const CSS = `
.quiz-shell-result{--quiz-section-gap:8px;--quiz-card-padding:12px}
.quiz-result-compact{display:grid;gap:10px;padding:12px}
.quiz-result-hero{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:10px 12px;border-radius:16px;background:linear-gradient(145deg,var(--quiz-card),var(--quiz-elev));border:1px solid var(--quiz-border)}
.quiz-result-score-ring{--quiz-ring-pct:0;width:68px;height:68px;border-radius:50%;background:conic-gradient(var(--quiz-accent) calc(var(--quiz-ring-pct)*1%),rgba(255,255,255,.08) 0);display:grid;place-items:center;flex-shrink:0}
.quiz-result-score-ring span{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:15px;font-weight:900;color:var(--quiz-title);background:var(--quiz-surface);border:1px solid var(--quiz-border)}
.quiz-result-hero-copy{display:grid;gap:3px;min-width:0}
.quiz-result-hero-copy .quiz-main-title{margin:0;font-size:clamp(20px,5.5vw,26px);line-height:1.1}
.quiz-result-meta{margin:0;font-size:12px;color:var(--quiz-muted)}
.quiz-result-inline-stats{display:flex;flex-wrap:wrap;gap:6px}
.quiz-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid var(--quiz-border);background:var(--quiz-surface)}
.quiz-pill b{font-size:13px}
.quiz-pill.ok{border-color:rgba(125,227,182,.35);background:rgba(56,120,86,.22);color:#b8f0d0}
.quiz-pill.ok b{color:#7de3b6}
.quiz-pill.bad{border-color:rgba(255,158,165,.35);background:rgba(120,56,64,.22);color:#ffc2c7}
.quiz-pill.bad b{color:#ff9ea5}
.quiz-pill.skip{border-color:rgba(180,180,180,.25);background:rgba(80,80,80,.18);color:var(--quiz-muted)}
.quiz-result-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:4px;border-radius:14px;background:var(--quiz-surface);border:1px solid var(--quiz-border)}
.quiz-result-tab{border:0;border-radius:10px;padding:8px 6px;background:transparent;color:var(--quiz-muted);font-size:11px;font-weight:800;cursor:pointer}
.quiz-result-tab.active{background:linear-gradient(145deg,color-mix(in srgb,var(--quiz-accent) 22%,var(--quiz-elev)),var(--quiz-elev));color:var(--quiz-title);box-shadow:0 4px 12px rgba(0,0,0,.18)}
.quiz-result-panels{min-height:0}
.quiz-result-panel{display:grid;gap:8px}
.quiz-result-panel[hidden]{display:none!important}
.quiz-panel-title{margin:0;font-size:13px;font-weight:800;color:var(--quiz-title)}
.quiz-weak-line{margin:0;font-size:12px;line-height:1.45;color:var(--quiz-text-secondary)}
.quiz-result-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.quiz-result-mini{padding:8px;border-radius:12px;text-align:center;background:var(--quiz-surface);border:1px solid var(--quiz-border)}
.quiz-result-mini b{display:block;font-size:16px;color:var(--quiz-title)}
.quiz-result-mini span{display:block;font-size:10px;color:var(--quiz-muted);margin-top:2px}
.quiz-topic-table{display:grid;gap:4px;font-size:12px}
.quiz-topic-table-head,.quiz-topic-table-row{display:grid;grid-template-columns:minmax(0,1fr) 32px 32px 52px;gap:6px;align-items:center;padding:6px 8px}
.quiz-topic-table-head{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--quiz-muted)}
.quiz-topic-table-row{border-radius:10px;background:var(--quiz-surface);border:1px solid var(--quiz-border)}
.quiz-topic-table-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:var(--quiz-text-primary)}
.quiz-topic-table-val{text-align:center;font-weight:800}
.quiz-topic-table-val.ok{color:#7de3b6}
.quiz-topic-table-val.bad{color:#ff9ea5}
.quiz-topic-table-meter{position:relative;height:18px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid var(--quiz-border)}
.quiz-topic-table-meter i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--quiz-accent),color-mix(in srgb,var(--quiz-accent) 55%,#fff 45%));opacity:.85}
.quiz-topic-table-meter b{position:relative;z-index:1;display:grid;place-items:center;height:100%;font-size:10px;font-weight:800;color:var(--quiz-title)}
.quiz-audit-panel{display:grid;gap:8px}
.quiz-audit-filters{display:flex;flex-wrap:wrap;gap:6px}
.quiz-audit-filter{border:1px solid var(--quiz-border);border-radius:999px;padding:5px 10px;background:var(--quiz-surface);color:var(--quiz-muted);font-size:11px;font-weight:800;cursor:pointer}
.quiz-audit-filter.active{color:var(--quiz-title);border-color:rgba(216,193,139,.35);background:rgba(216,193,139,.12)}
.quiz-audit-accordion{display:grid;gap:6px}
.quiz-audit-fold{border:1px solid var(--quiz-border);border-radius:12px;background:var(--quiz-surface);overflow:hidden}
.quiz-audit-fold.ok{border-color:rgba(125,227,182,.28)}
.quiz-audit-fold.bad{border-color:rgba(255,158,165,.32)}
.quiz-audit-fold.skip{border-color:rgba(180,180,180,.2)}
.quiz-audit-fold[hidden]{display:none}
.quiz-audit-fold summary{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:8px;align-items:center;padding:8px 10px;cursor:pointer;list-style:none}
.quiz-audit-fold summary::-webkit-details-marker{display:none}
.quiz-audit-badge{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900}
.quiz-audit-badge.ok{background:rgba(56,120,86,.35);color:#7de3b6}
.quiz-audit-badge.bad{background:rgba(120,56,64,.35);color:#ff9ea5}
.quiz-audit-badge.skip{background:rgba(90,90,90,.35);color:var(--quiz-muted)}
.quiz-audit-qnum{font-size:11px;font-weight:800;color:var(--quiz-muted)}
.quiz-audit-qtext{font-size:12px;font-weight:700;color:var(--quiz-text-primary);line-height:1.35}
.quiz-audit-body{display:grid;gap:6px;padding:0 10px 10px;border-top:1px solid var(--quiz-border)}
.quiz-audit-line{padding:8px 10px;border-radius:10px;border-left:3px solid transparent}
.quiz-audit-line label{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
.quiz-audit-line p{margin:0;font-size:12px;line-height:1.45}
.quiz-audit-line.is-good{background:rgba(56,120,86,.16);border-left-color:#7de3b6}
.quiz-audit-line.is-good label,.quiz-audit-line.is-good p{color:#b8f0d0}
.quiz-audit-line.is-bad{background:rgba(120,56,64,.18);border-left-color:#ff9ea5}
.quiz-audit-line.is-bad label,.quiz-audit-line.is-bad p{color:#ffc2c7}
.quiz-audit-line.is-skip{background:rgba(90,90,90,.14);border-left-color:var(--quiz-muted)}
.quiz-audit-line.is-note{background:rgba(216,193,139,.08);border-left-color:var(--quiz-accent)}
.quiz-audit-line.is-note label{color:var(--quiz-accent)}
.quiz-audit-line.is-source{background:rgba(255,255,255,.03);border-left-color:rgba(216,193,139,.45)}
.quiz-audit-line.is-source label{color:var(--quiz-muted)}
`;

const TOPIC_STATS = `function renderQuizTopicStats(session){const map=new Map();session.questionIds.forEach(id=>{const q=quizQuestionById(id);if(!q)return;const key=String(q.category||q.topic||"Allgemein");const row=map.get(key)||{total:0,right:0,wrong:0};row.total+=1;const ans=session.answers?.[id];if(ans?.evaluated){if(ans.correct)row.right+=1;else row.wrong+=1}map.set(key,row)});const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],"de"));if(!rows.length)return "<div class='quiz-result-empty'>Keine Themenstatistik vorhanden.</div>";return \`<div class="quiz-topic-table"><div class="quiz-topic-table-head"><span>Thema</span><span>✓</span><span>✕</span><span>%</span></div>\${rows.map(([topic,row])=>{const pct=row.total?Math.round((row.right/row.total)*100):0;return \`<div class="quiz-topic-table-row"><span class="quiz-topic-table-name" title="\${esc(topic)}">\${esc(topic)}</span><span class="quiz-topic-table-val ok">\${row.right}</span><span class="quiz-topic-table-val bad">\${row.wrong}</span><span class="quiz-topic-table-meter"><i style="width:\${pct}%"></i><b>\${pct}%</b></span></div>\`}).join("")}</div>\`}`;

const ANSWER_AUDIT = `function renderQuizAnswerAudit(session){const items=session.questionIds.map((id,idx)=>{const q=quizQuestionById(id);if(!q)return null;const answer=session.answers?.[id];const selectedIdx=Number(answer?.selectedIndex);const selectedText=Number.isFinite(selectedIdx)&&Array.isArray(q.answers)?q.answers[selectedIdx]:"—";const correctText=Array.isArray(q.answers)?q.answers[Number(q.correctIndex)]:"—";const state=answer?.evaluated?(answer.correct?"ok":"bad"):"skip";return {idx,state,q,selectedText,correctText}}).filter(Boolean);if(!items.length)return "<div class='quiz-result-empty'>Kein Antwortprotokoll vorhanden.</div>";const okN=items.filter(x=>x.state==="ok").length;const badN=items.filter(x=>x.state==="bad").length;const skipN=items.filter(x=>x.state==="skip").length;return \`<div class="quiz-audit-panel"><div class="quiz-audit-filters" role="tablist">\${\`<button type="button" class="quiz-audit-filter active" data-quiz-audit-filter="all">Alle (\${items.length})</button>\`}\${badN?\`<button type="button" class="quiz-audit-filter" data-quiz-audit-filter="bad">Falsch (\${badN})</button>\`:""}\${okN?\`<button type="button" class="quiz-audit-filter" data-quiz-audit-filter="ok">Richtig (\${okN})</button>\`:""}\${skipN?\`<button type="button" class="quiz-audit-filter" data-quiz-audit-filter="skip">Offen (\${skipN})</button>\`:""}</div><div class="quiz-audit-accordion">\${items.map(item=>\`<details class="quiz-audit-fold \${item.state}" data-quiz-audit-state="\${item.state}"\${item.state==="bad"?" open":""}><summary><span class="quiz-audit-badge \${item.state}">\${item.state==="ok"?"✓":item.state==="bad"?"✕":"–"}</span><span class="quiz-audit-qnum">#\${item.idx+1}</span><span class="quiz-audit-qtext">\${esc(item.q.question||"Frage")}</span></summary><div class="quiz-audit-body"><div class="quiz-audit-line \${item.state==="ok"?"is-good":item.state==="bad"?"is-bad":"is-skip"}"><label>Deine Antwort</label><p>\${esc(item.selectedText)}</p></div>\${item.state!=="ok"?\`<div class="quiz-audit-line is-good"><label>Korrekte Antwort</label><p>\${esc(item.correctText)}</p></div>\`:""}\${item.q.explanation?\`<div class="quiz-audit-line is-note"><label>Erklärung</label><p>\${esc(item.q.explanation)}</p></div>\`:""}<div class="quiz-audit-line is-source"><label>Quelle</label><p>\${esc(item.q.source||"Quelle wird geprüft.")}</p></div></div></details>\`).join("")}</div></div>\`}`;

const QUIZ_RESULT = `function renderQuizResult(session){const total=session.questionIds.length;const values=session.questionIds.map(id=>session.answers?.[id]).filter(Boolean);const right=values.filter(a=>a.correct).length;const wrong=values.filter(a=>a.evaluated&&!a.correct).length;const skipped=Math.max(0,total-right-wrong);const percent=total?Math.round((right/total)*100):0;const duration=Math.max(1,Math.round((Date.now()-Number(session.startedAt||Date.now()))/1000));const topicStats=renderQuizTopicStats(session);const audit=renderQuizAnswerAudit(session);const weakTopics=(quizHistory().slice(-8).flatMap(x=>x.topics||[]).filter(t=>t.wrong>0).sort((a,b)=>b.wrong-a.wrong).slice(0,3).map(t=>\`\${t.topic} (\${t.wrong})\`).join(" · ")||"Noch keine auffälligen Themen");const topicLabel=session.config?.topic==="all"?"Gemischt":session.config?.topic||"Gemischt";const levelLabel=session.config?.level==="all"?"Gemischt":session.config?.level||"Gemischt";return \`\${setPageHeader("Quiz abgeschlossen",\`\${right}/\${total} richtig\`,"Quiz")}<section class="quiz-shell quiz-shell-pro quiz-shell-result"><article class="quiz-result quiz-result-compact"><header class="quiz-result-hero"><div class="quiz-result-score-ring" style="--quiz-ring-pct:\${percent}"><span>\${percent}%</span></div><div class="quiz-result-hero-copy"><span class="quiz-kicker">Quiz abgeschlossen</span><h2 class="quiz-main-title">\${right} / \${total} richtig</h2><p class="quiz-result-meta">\${esc(topicLabel)} · \${esc(levelLabel)} · \${duration}s</p></div></header><div class="quiz-result-inline-stats"><span class="quiz-pill ok"><b>\${right}</b> Richtig</span><span class="quiz-pill bad"><b>\${wrong}</b> Falsch</span><span class="quiz-pill skip"><b>\${skipped}</b> Übersprungen</span></div><div class="quiz-result-tabs" role="tablist"><button type="button" class="quiz-result-tab active" data-quiz-result-tab="overview">Übersicht</button><button type="button" class="quiz-result-tab" data-quiz-result-tab="topics">Themen</button><button type="button" class="quiz-result-tab" data-quiz-result-tab="answers">Antworten</button></div><div class="quiz-result-panels"><section class="quiz-result-panel active" data-quiz-result-panel="overview"><h3 class="quiz-panel-title">Schwächere Themen</h3><p class="quiz-weak-line">\${esc(weakTopics)}</p><div class="quiz-result-mini-grid"><div class="quiz-result-mini"><b>\${percent}%</b><span>Gesamttreffer</span></div><div class="quiz-result-mini"><b>\${duration}s</b><span>Dauer</span></div><div class="quiz-result-mini"><b>\${esc(session.config?.mode||"standard")}</b><span>Modus</span></div></div></section><section class="quiz-result-panel" data-quiz-result-panel="topics" hidden><h3 class="quiz-panel-title">Themen-Statistik</h3>\${topicStats}</section><section class="quiz-result-panel" data-quiz-result-panel="answers" hidden><h3 class="quiz-panel-title">Antworten und Quellen</h3>\${audit}</section></div><div class="quiz-actions quiz-actions-compact"><button class="quiz-btn primary" type="button" id="quizRepeatStartBtn" \${getQuizMarkedIds().size?"":"disabled"}>Fehler wiederholen</button><button class="quiz-btn secondary" type="button" id="quizNewBtn">Neue Runde</button><button class="quiz-btn secondary" type="button" data-nav="quiz" data-value="stats">Statistik öffnen</button><button class="quiz-btn secondary" type="button" data-nav="quiz" data-value="home">Zur Startseite</button></div></article></section>\`}`;

const BIND_APPEND = `document.querySelectorAll("[data-quiz-result-tab]").forEach(btn=>{btn.onclick=()=>{const tab=btn.getAttribute("data-quiz-result-tab");document.querySelectorAll("[data-quiz-result-tab]").forEach(b=>b.classList.toggle("active",b===btn));document.querySelectorAll("[data-quiz-result-panel]").forEach(p=>{const on=p.getAttribute("data-quiz-result-panel")===tab;p.classList.toggle("active",on);p.hidden=!on})}});document.querySelectorAll("[data-quiz-audit-filter]").forEach(btn=>{btn.onclick=()=>{const filter=btn.getAttribute("data-quiz-audit-filter");document.querySelectorAll("[data-quiz-audit-filter]").forEach(b=>b.classList.toggle("active",b===btn));document.querySelectorAll(".quiz-audit-fold").forEach(det=>{const state=det.getAttribute("data-quiz-audit-state");det.hidden=filter!=="all"&&state!==filter})}});`;

for (const file of files) {
  let html = fs.readFileSync(path.join(root, file), "utf8");
  let changed = false;

  if (!html.includes("quiz-result-compact")) {
    html = html.replace(
      /\.quiz-result-section\.compact \.quiz-section-title\{font-size:14px;margin-bottom:6px\}/,
      (m) => `${m}${CSS}`
    );
    changed = true;
  }

  const topicRe = /function renderQuizTopicStats\(session\)\{[\s\S]*?\nfunction renderQuizAnswerAudit/;
  if (topicRe.test(html)) {
    html = html.replace(topicRe, `${TOPIC_STATS}\n${ANSWER_AUDIT}\nfunction renderQuizResult`);
    changed = true;
  }

  const resultRe = /function renderQuizResult\(session\)\{[\s\S]*?\nfunction renderQuizStatsPage/;
  if (resultRe.test(html)) {
    html = html.replace(resultRe, `${QUIZ_RESULT}\nfunction renderQuizStatsPage`);
    changed = true;
  }

  if (!html.includes("data-quiz-result-tab")) {
    html = html.replace(
      /navigate\("quiz","stats"\);return\}/g,
      `navigate("quiz","session");return}`
    );
    html = html.replace(
      /saveQuizSession\(s\)\}navigate\("quiz","stats"\)\}/,
      `saveQuizSession(s)}navigate("quiz","session")}`
    );
  }

  if (!html.includes("[data-quiz-result-tab]")) {
    html = html.replace(
      /(const nextBtn=\$\("quizNextBtn"\);if\(nextBtn\)nextBtn\.onclick=\(\)=>\{[\s\S]*?render\(\)\}\})/,
      `$1${BIND_APPEND}`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path.join(root, file), html);
    console.log(`patched ${file}`);
  } else {
    console.log(`skipped ${file} (already patched)`);
  }
}
