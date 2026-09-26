(() => {
"use strict";

const API_BASE = "https://dar-admin-publisher.sero91ak.workers.dev";
const MODE_KEY = "kids.contentMode.v1";
const CACHE_KEY = "kids.studioContent.cache.v1";
const REFRESH_MS = 60000;

let state = { items: [], fetchedAt: 0, openId: "", mode: readMode(), busy: false };

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function abs(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https:\/\//i.test(value)) return value;
  try { return new URL(value, location.origin).toString(); } catch (_) { return value; }
}
function readMode() {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return ["both", "listen", "read"].includes(v) ? v : "both";
  } catch (_) { return "both"; }
}
function writeMode(mode) {
  state.mode = ["both", "listen", "read"].includes(mode) ? mode : "both";
  try { localStorage.setItem(MODE_KEY, state.mode); } catch (_) {}
  renderAll();
}
function ageGroup() {
  const age = String(document.querySelector(".app")?.getAttribute("data-age") || "6–8");
  if (age === "4–5") return { label: age, min: 4, max: 5 };
  if (age === "9–10") return { label: age, min: 9, max: 10 };
  return { label: "6–8", min: 6, max: 8 };
}
function itemFitsProfile(item) {
  const r = ageGroup();
  if (Number(item?.ageMin || 0) > r.min || Number(item?.ageMax || 99) < r.max) return false;
  const modes = item?.modes || {};
  if (state.mode === "listen" && modes.listen === false) return false;
  if (state.mode === "read" && modes.read === false) return false;
  return item?.status === "published" && (item?.appTarget === "kids" || item?.appTarget === "both");
}
function relevantItems() {
  return state.items.filter(itemFitsProfile);
}
function kindLabel(kind) {
  return ({story:"Geschichte",quiz:"Quiz",game:"Spiel",lesson:"Lernen"})[kind] || "Inhalt";
}
function durationLabel(item) {
  const sec = Number(item?.audio?.durationSec || 0);
  if (!sec) return "";
  const min = Math.max(1, Math.round(sec / 60));
  return "ca. " + min + " Min.";
}
function modeLabels(item) {
  const out = [];
  if (item?.modes?.listen !== false && item?.audio?.url) out.push("Hören");
  if (item?.modes?.read !== false && item?.text) out.push("Lesen");
  return out.join(" · ");
}
function summaryText(item) {
  return String(item?.summary || item?.subtitle || item?.topic || item?.category || "").trim();
}
function loadCached() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Array.isArray(cached.items)) state.items = cached.items;
  } catch (_) {}
}
function cache(items) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items })); } catch (_) {}
}
async function refresh(force = false) {
  if (state.busy) return;
  if (!force && Date.now() - state.fetchedAt < 15000) return;
  state.busy = true;
  try {
    const url = API_BASE + "/api/kids/content?staging=1&appTarget=kids&cb=" + Date.now();
    const res = await fetch(url, { cache: "no-store", credentials: "omit" });
    if (!res.ok) throw new Error("Kids-Content " + res.status);
    const data = await res.json();
    state.items = Array.isArray(data?.items) ? data.items : [];
    state.fetchedAt = Date.now();
    cache(state.items);
    renderAll();
    openDeepLink();
  } catch (error) {
    if (!state.items.length) console.warn("[Kids Content Studio]", error);
    renderAll();
  } finally {
    state.busy = false;
  }
}
function injectStyles() {
  if (document.getElementById("darKidsStudioContentStyle")) return;
  const st = document.createElement("style");
  st.id = "darKidsStudioContentStyle";
  st.textContent = `
  .studio-new-section{margin:18px 0 4px}
  .studio-new-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 3px 10px}
  .studio-new-head small{display:block;color:var(--gold);font-size:9px;font-weight:950;letter-spacing:.12em}
  .studio-new-head h3{margin:3px 0 0;font-size:20px}
  .studio-new-age{font-size:10px;color:var(--muted);white-space:nowrap}
  .studio-new-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .studio-content-card{position:relative;min-height:184px;border:1px solid rgba(255,255,255,.1);border-radius:24px;overflow:hidden;background:#15313b;text-align:left;color:#fff;padding:0;cursor:pointer;box-shadow:0 15px 36px rgba(0,0,0,.16)}
  .studio-content-card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,19,27,.02),rgba(4,19,27,.14) 42%,rgba(4,19,27,.9))}
  .studio-content-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .studio-card-copy{position:absolute;z-index:2;left:13px;right:13px;bottom:12px}
  .studio-card-badges{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
  .studio-badge{padding:4px 7px;border-radius:999px;background:rgba(8,25,31,.72);border:1px solid rgba(255,255,255,.12);font-size:8px;font-weight:950;letter-spacing:.06em}
  .studio-badge.new{background:rgba(216,177,93,.92);color:#10232a;border-color:transparent}
  .studio-card-copy strong{display:block;font-size:15px;line-height:1.15}
  .studio-card-copy span{display:block;margin-top:4px;color:rgba(255,255,255,.76);font-size:10px;line-height:1.3}
  .studio-story-list{display:grid;gap:8px;margin:8px 0 14px}
  .studio-story-row{display:grid;grid-template-columns:76px minmax(0,1fr) 24px;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);border-radius:20px;padding:8px;color:var(--ink);text-align:left;cursor:pointer}
  .studio-story-row img{width:76px;height:76px;object-fit:cover;border-radius:15px;background:#16333b}
  .studio-story-row strong{display:block;font-size:14px}.studio-story-row small{display:block;color:var(--muted);font-size:9px;margin-top:4px;line-height:1.35}
  .studio-story-row .chev{font-size:21px;color:var(--soft)}
  .studio-content-empty{padding:12px 2px;color:var(--muted);font-size:11px;line-height:1.5}
  .studio-content-modal{position:fixed;inset:0;z-index:10080;background:rgba(2,12,18,.82);display:none;align-items:flex-end;justify-content:center;overscroll-behavior:contain}
  .studio-content-modal.open{display:flex}
  .studio-content-sheet{width:min(100%,780px);max-height:94dvh;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:30px 30px 0 0;background:#0b2029;box-shadow:0 -28px 80px rgba(0,0,0,.4);display:flex;flex-direction:column}
  .studio-content-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07)}
  .studio-content-top b{font-size:12px;color:var(--gold)}.studio-content-close{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:24px}
  .studio-content-scroll{overflow-y:auto;overscroll-behavior:contain;padding:0 15px calc(28px + env(safe-area-inset-bottom))}
  .studio-content-cover{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:0 0 25px 25px;background:#17343d}
  .studio-content-title{font-size:27px;line-height:1.08;margin:17px 0 5px}.studio-content-meta{font-size:10px;color:var(--gold);font-weight:900}
  .studio-content-summary{color:var(--muted);font-size:13px;line-height:1.5;margin:8px 0 14px}
  .studio-mode-tabs{display:flex;gap:8px;margin:10px 0 14px}.studio-mode-tabs button{flex:1;min-height:44px;border-radius:15px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:var(--ink);font-weight:900}.studio-mode-tabs button.active{background:var(--gold);color:#11252c;border-color:transparent}
  .studio-audio{width:100%;margin:3px 0 15px}.studio-read{white-space:pre-wrap;font-size:16px;line-height:1.75;color:rgba(255,255,255,.91);padding:6px 0 20px}
  .studio-quiz-q{border-top:1px solid rgba(255,255,255,.08);padding:14px 0}.studio-quiz-q h4{margin:0 0 9px;font-size:16px}.studio-quiz-answer{width:100%;text-align:left;margin:5px 0;padding:11px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);color:var(--ink)}
  .studio-quiz-answer.correct{border-color:rgba(107,211,150,.5);background:rgba(107,211,150,.12)}.studio-quiz-answer.wrong{border-color:rgba(236,120,120,.5);background:rgba(236,120,120,.12)}
  .studio-content-mode-settings{margin:16px 0;padding:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:22px}.studio-content-mode-settings h3{margin:0 0 4px;font-size:16px}.studio-content-mode-settings p{margin:0 0 10px;color:var(--muted);font-size:11px}
  .studio-pref-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.studio-pref-buttons button{min-height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:var(--ink);font-weight:850}.studio-pref-buttons button.active{background:var(--gold);color:#12262d}
  @media(max-width:520px){.studio-new-grid{grid-template-columns:1fr 1fr}.studio-content-card{min-height:160px}.studio-content-title{font-size:24px}}
  `;
  document.head.appendChild(st);
}
function ensureModal() {
  if (document.getElementById("studioContentModal")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div id="studioContentModal" class="studio-content-modal" aria-hidden="true">
      <div class="studio-content-sheet" role="dialog" aria-modal="true" aria-labelledby="studioContentTitle">
        <div class="studio-content-top"><b>DĀR AL TAWḤĪD Kids</b><button id="studioContentClose" class="studio-content-close" type="button" aria-label="Schließen">×</button></div>
        <div id="studioContentBody" class="studio-content-scroll"></div>
      </div>
    </div>`);
  const modal = document.getElementById("studioContentModal");
  document.getElementById("studioContentClose")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
}
function setBackgroundInert(on) {
  [document.querySelector(".shell"), document.querySelector(".bottom-nav")].filter(Boolean).forEach(el => {
    try { el.inert = !!on; } catch (_) {}
    if (on) el.setAttribute("aria-hidden","true"); else el.removeAttribute("aria-hidden");
  });
}
function closeModal() {
  const modal = document.getElementById("studioContentModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  setBackgroundInert(false);
  const audio = modal.querySelector("audio");
  try { audio?.pause(); } catch (_) {}
  state.openId = "";
}
function allowedModes(item) {
  const read = item?.modes?.read !== false && !!String(item?.text || "").trim();
  const listen = item?.modes?.listen !== false && !!String(item?.audio?.url || "").trim();
  if (state.mode === "read") return { read, listen: false };
  if (state.mode === "listen") return { read: false, listen };
  return { read, listen };
}
function renderQuiz(item) {
  const qs = Array.isArray(item?.quiz?.questions) ? item.quiz.questions : [];
  if (!qs.length) return "";
  return '<div class="studio-quiz">' + qs.map((q, qi) => {
    const answers = Array.isArray(q?.answers) ? q.answers : [];
    return '<div class="studio-quiz-q" data-quiz-q="'+qi+'"><h4>'+esc(q?.question || ("Frage "+(qi+1)))+'</h4>' +
      answers.map((a, ai) => '<button class="studio-quiz-answer" type="button" data-q="'+qi+'" data-a="'+ai+'" data-correct="'+(a?.correct?"1":"0")+'">'+esc(a?.label || a?.text || "")+'</button>').join("") +
      '<div class="studio-quiz-feedback" aria-live="polite"></div></div>';
  }).join("") + "</div>";
}
function renderGame(item) {
  const g = item?.game && typeof item.game === "object" ? item.game : null;
  if (!g) return "";
  const cues = Array.isArray(g.voiceCues) ? g.voiceCues : [];
  return '<div class="studio-read"><strong>'+esc(g.type || "Spiel")+'</strong>\n\n'+esc(g.instructions || "")+
    (cues.length ? "\n\nSprachbausteine:\n• "+cues.map(esc).join("\n• ") : "")+'</div>';
}
function openItem(id) {
  const item = state.items.find(x => String(x.id) === String(id));
  if (!item || !itemFitsProfile(item)) return;
  ensureModal();
  const modes = allowedModes(item);
  let initial = modes.listen ? "listen" : "read";
  const body = document.getElementById("studioContentBody");
  const cover = abs(item?.cover?.url);
  body.innerHTML =
    (cover ? '<img class="studio-content-cover" src="'+esc(cover)+'" alt="">' : "") +
    '<div class="studio-content-meta">'+esc(kindLabel(item.kind))+' · '+esc(item.category || "Kids")+' · '+Number(item.ageMin)+'–'+Number(item.ageMax)+' Jahre</div>'+
    '<h2 id="studioContentTitle" class="studio-content-title">'+esc(item.title)+'</h2>'+
    (summaryText(item) ? '<div class="studio-content-summary">'+esc(summaryText(item))+'</div>' : "")+
    ((modes.read && modes.listen) ? '<div class="studio-mode-tabs"><button type="button" data-studio-mode="listen">Hören</button><button type="button" data-studio-mode="read">Lesen</button></div>' : "")+
    '<div id="studioContentPayload"></div>';
  const payload = document.getElementById("studioContentPayload");
  function paint(mode) {
    initial = mode;
    body.querySelectorAll("[data-studio-mode]").forEach(b => b.classList.toggle("active", b.dataset.studioMode === mode));
    if (item.kind === "quiz") {
      payload.innerHTML = renderQuiz(item);
      bindQuiz(item);
      return;
    }
    if (item.kind === "game") {
      payload.innerHTML = renderGame(item);
      return;
    }
    if (mode === "listen" && modes.listen) {
      payload.innerHTML = '<audio class="studio-audio" controls playsinline preload="metadata" src="'+esc(abs(item.audio.url))+'"></audio>' +
        (modes.read ? '<div class="studio-content-summary">Du kannst oben jederzeit auf „Lesen“ wechseln.</div>' : "");
      const audio = payload.querySelector("audio");
      audio?.addEventListener("ended", () => {
        try { localStorage.setItem("kids.story."+item.id, "1"); } catch (_) {}
      });
    } else {
      payload.innerHTML = '<div class="studio-read">'+esc(item.text || "").replace(/\n/g,"<br>")+'</div>';
    }
  }
  body.querySelectorAll("[data-studio-mode]").forEach(b => b.addEventListener("click", () => paint(b.dataset.studioMode)));
  paint(item.kind === "quiz" || item.kind === "game" ? "read" : initial);
  const modal = document.getElementById("studioContentModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  setBackgroundInert(true);
  state.openId = item.id;
}
function bindQuiz(item) {
  const payload = document.getElementById("studioContentPayload");
  payload?.querySelectorAll(".studio-quiz-answer").forEach(btn => btn.addEventListener("click", () => {
    const q = Array.isArray(item?.quiz?.questions) ? item.quiz.questions[Number(btn.dataset.q)] : null;
    const box = btn.closest(".studio-quiz-q");
    box?.querySelectorAll(".studio-quiz-answer").forEach(b => {
      b.disabled = true;
      if (b.dataset.correct === "1") b.classList.add("correct");
    });
    if (btn.dataset.correct !== "1") btn.classList.add("wrong");
    const feedback = box?.querySelector(".studio-quiz-feedback");
    if (feedback) feedback.textContent = btn.dataset.correct === "1" ? (q?.success || "Richtig.") : (q?.retry || "Fast. Schau dir die richtige Antwort an.");
    if (btn.dataset.correct === "1") {
      try { localStorage.setItem("kids.quiz.correct", String(Number(localStorage.getItem("kids.quiz.correct") || 0) + 1)); } catch (_) {}
    }
  }));
}
function cardHtml(item) {
  const cover = abs(item?.cover?.url);
  const meta = [kindLabel(item.kind), durationLabel(item), modeLabels(item)].filter(Boolean).join(" · ");
  return '<button type="button" class="studio-content-card" data-studio-content="'+esc(item.id)+'">'+
    (cover ? '<img src="'+esc(cover)+'" alt="" loading="lazy">' : "")+
    '<span class="studio-card-copy"><span class="studio-card-badges">'+
    (item.isNew ? '<span class="studio-badge new">NEU</span>' : "")+
    '<span class="studio-badge">'+esc(kindLabel(item.kind))+'</span></span>'+
    '<strong>'+esc(item.title)+'</strong><span>'+esc(meta || summaryText(item))+'</span></span></button>';
}
function rowHtml(item) {
  const cover = abs(item?.cover?.url);
  return '<button type="button" class="studio-story-row" data-studio-content="'+esc(item.id)+'">'+
    (cover ? '<img src="'+esc(cover)+'" alt="" loading="lazy">' : '<span></span>')+
    '<span><strong>'+esc(item.title)+'</strong><small>'+esc([item.category,durationLabel(item),modeLabels(item)].filter(Boolean).join(" · "))+'</small></span><span class="chev">›</span></button>';
}
function ensureTodaySection() {
  const view = document.getElementById("view-today");
  if (!view || document.getElementById("studioNewSection")) return;
  const hero = view.querySelector(".hero");
  const section = document.createElement("section");
  section.id = "studioNewSection";
  section.className = "studio-new-section";
  section.innerHTML = '<div class="studio-new-head"><div><small>NEU FÜR DICH</small><h3>Frisch in deiner Kinderwelt</h3></div><span id="studioNewAge" class="studio-new-age"></span></div><div id="studioNewGrid" class="studio-new-grid"></div>';
  if (hero?.parentNode) hero.insertAdjacentElement("afterend", section); else view.prepend(section);
}
function ensureStoriesSection() {
  const view = document.getElementById("view-stories");
  if (!view || document.getElementById("studioStorySection")) return;
  const head = view.querySelector(".page-head");
  const section = document.createElement("section");
  section.id = "studioStorySection";
  section.className = "studio-new-section";
  section.innerHTML = '<div class="studio-new-head"><div><small>DĀR CONTENT STUDIO</small><h3>Neue geprüfte Geschichten</h3></div></div><div id="studioStoryList" class="studio-story-list"></div>';
  if (head?.parentNode) head.insertAdjacentElement("afterend", section); else view.prepend(section);
}
function ensureParentPreference() {
  const view = document.getElementById("view-parents");
  if (!view || document.getElementById("studioContentPreferences")) return;
  const box = document.createElement("section");
  box.id = "studioContentPreferences";
  box.className = "studio-content-mode-settings";
  box.innerHTML = '<h3>Geschichten anzeigen</h3><p>Lege für dieses Kinderprofil fest, ob neue Studio-Inhalte zum Lesen, Hören oder in beiden Formen gezeigt werden.</p><div class="studio-pref-buttons"><button type="button" data-pref="both">Lesen & Hören</button><button type="button" data-pref="listen">Nur Hören</button><button type="button" data-pref="read">Nur Lesen</button></div>';
  view.appendChild(box);
  box.querySelectorAll("[data-pref]").forEach(btn => btn.addEventListener("click", () => writeMode(btn.dataset.pref)));
}
function renderAll() {
  ensureTodaySection();
  ensureStoriesSection();
  ensureParentPreference();
  const group = ageGroup();
  const newAge = document.getElementById("studioNewAge");
  if (newAge) newAge.textContent = group.label + " Jahre";
  document.querySelectorAll("#studioContentPreferences [data-pref]").forEach(btn => btn.classList.toggle("active", btn.dataset.pref === state.mode));

  const items = relevantItems();
  const fresh = items.filter(x => x.isNew).slice(0, 4);
  const grid = document.getElementById("studioNewGrid");
  const section = document.getElementById("studioNewSection");
  if (grid) grid.innerHTML = fresh.length ? fresh.map(cardHtml).join("") : '<div class="studio-content-empty">Für dieses Profil gibt es gerade keinen neuen Studio-Inhalt.</div>';
  if (section) section.hidden = !fresh.length;

  const stories = items.filter(x => x.kind === "story").slice(0, 30);
  const list = document.getElementById("studioStoryList");
  const storySection = document.getElementById("studioStorySection");
  if (list) list.innerHTML = stories.length ? stories.map(rowHtml).join("") : '<div class="studio-content-empty">Noch keine neue Studio-Geschichte für diese Altersstufe.</div>';
  if (storySection) storySection.hidden = !stories.length;

  document.querySelectorAll("[data-studio-content]").forEach(btn => {
    if (btn.dataset.studioBound === "1") return;
    btn.dataset.studioBound = "1";
    btn.addEventListener("click", () => openItem(btn.dataset.studioContent));
  });
}
function openDeepLink() {
  let id = "";
  try { id = new URL(location.href).searchParams.get("content") || ""; } catch (_) {}
  if (!id || state.openId === id) return;
  const item = state.items.find(x => x.id === id);
  if (!item || !itemFitsProfile(item)) return;
  const target = item.kind === "story" ? "stories" : "today";
  document.querySelector('.nav-btn[data-target="'+target+'"]')?.click();
  setTimeout(() => openItem(id), 80);
}
function observeProfile() {
  const app = document.querySelector(".app");
  if (!app || !("MutationObserver" in window)) return;
  const observer = new MutationObserver(records => {
    if (records.some(r => r.attributeName === "data-age")) renderAll();
  });
  observer.observe(app, { attributes: true, attributeFilter: ["data-age"] });
}
function boot() {
  injectStyles();
  ensureModal();
  loadCached();
  renderAll();
  observeProfile();
  refresh(true);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  window.addEventListener("focus", () => refresh());
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
}
window.DarKidsStudioContent = { refresh, open: openItem, get items(){ return state.items.slice(); } };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
else boot();
})();
