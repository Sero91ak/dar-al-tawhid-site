/* DĀR AL TAWḤĪD Kids · Duʿāʾ Hub v1223
   Premium hybrid library + smart learning entry + profile avatars.
   Keeps the shared bottom navigation system intact and adds Duʿāʾ as a native fifth tab. */
(() => {
  "use strict";

  const VERSION = 1223;
  const DATA_URL = "/kids/data/dua-kids.json?v=1223";
  const PROFILE_KEY = "kids.profiles.v1";
  const ACTIVE_PROFILE_KEY = "kids.activeProfile";
  const LAST_KEY = "kids.duaHub.last.v1";
  const CONTINUE_KEY = "kids.duaHub.continue.v1";
  const PROGRESS_PREFIX = "kids.dua.progress.v2.";

  let items = [];
  let activeCategory = "all";
  let activeQuery = "";
  let detailItem = null;
  let fallbackAudio = null;
  let lastShellScroll = 0;

  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const escapeHtml = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  function loadProfiles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  function activeProfile() {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
    return loadProfiles().find(p => String(p.id) === id) || null;
  }

  function activeGender() {
    const profile = activeProfile();
    const app = q(".app");
    return String(profile?.gender || app?.getAttribute("data-gender") || "boy") === "girl" ? "girl" : "boy";
  }

  function activeAge() {
    const app = q(".app");
    return String(app?.getAttribute("data-age") || localStorage.getItem("kids.age") || "6–8");
  }

  function ageRange() {
    const age = activeAge();
    if (age === "4–5") return { min: 4, max: 5 };
    if (age === "6–8") return { min: 6, max: 8 };
    return { min: 9, max: 10 };
  }

  function availableItems() {
    const range = ageRange();
    return items.filter(d =>
      d && d.verification === "verified" &&
      Number(d.ageMin) <= range.min &&
      Number(d.ageMax) >= range.max
    );
  }

  function progress(id) {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_PREFIX + id) || "null");
      return raw && typeof raw === "object" ? raw : { stage: "new", attempts: 0, reviewPasses: 0 };
    } catch (_) {
      return { stage: "new", attempts: 0, reviewPasses: 0 };
    }
  }

  function setLast(id) {
    try { localStorage.setItem(LAST_KEY, String(id || "")); } catch (_) {}
    renderResume();
  }

  function setContinue(id) {
    try { localStorage.setItem(CONTINUE_KEY, String(id || "")); } catch (_) {}
    renderResume();
  }

  function getStoredItem(key) {
    let id = "";
    try { id = localStorage.getItem(key) || ""; } catch (_) {}
    return availableItems().find(d => d.id === id) || null;
  }

  function categoryOf(d) {
    const hay = [d.id, d.title, d.scene, d.symbol, d.childPrompt].join(" ").toLowerCase();
    if (/sleep|schlaf|wake|aufwach|morning|morgen/.test(hay)) return "sleep";
    if (/food|essen|trink/.test(hay)) return "food";
    if (/mosque|moschee/.test(hay)) return "mosque";
    if (/parent|eltern|family|famil/.test(hay)) return "family";
    if (/home|house|haus|toilet/.test(hay)) return "home";
    if (/protect|schutz|afiy|vergebung|guidance|taqwa|heart|repent/.test(hay)) return "protection";
    return "knowledge";
  }

  function categoryLabel(key) {
    return ({
      all: "Alle",
      sleep: "Schlafen & Morgen",
      food: "Essen",
      home: "Zuhause",
      mosque: "Moschee",
      family: "Familie",
      protection: "Schutz",
      knowledge: "Wissen"
    })[key] || "Alle";
  }

  function artKind(d) {
    const cat = typeof d === "string" ? d : categoryOf(d || {});
    return ({
      sleep: "moon",
      food: "food",
      home: "home",
      mosque: "mosque",
      family: "family",
      protection: "shield",
      knowledge: "book"
    })[cat] || "book";
  }

  function assetHash(seed) {
    const s = String(seed || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function artAsset(kind, seed) {
    const raw = String(kind || "");
    if (/^action-/.test(raw)) {
      return ({
        "action-library": "/kids/assets/dua-premium/action-library-v1222.png?v=1233",
        "action-learn": "/kids/assets/dua-premium/action-learn-v1222.png?v=1233",
        "action-random": "/kids/assets/dua-premium/action-random-v1222.png?v=1233"
      })[raw] || "/kids/assets/dua-premium/action-library-v1222.png?v=1233";
    }
    const k = artKind(kind);
    const sets = {
      book: [
        "/kids/assets/dua-premium/knowledge-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/knowledge-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/knowledge-3-v1233.jpg?v=1233"
      ],
      family: [
        "/kids/assets/dua-premium/family-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/family-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/family-3-v1233.jpg?v=1233"
      ],
      shield: [
        "/kids/assets/dua-premium/protection-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/protection-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/protection-3-v1233.jpg?v=1233"
      ],
      moon: [
        "/kids/assets/dua-premium/sleep-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/sleep-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/sleep-3-v1233.jpg?v=1233"
      ],
      food: [
        "/kids/assets/dua-premium/food-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/food-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/food-3-v1233.jpg?v=1233"
      ],
      home: [
        "/kids/assets/dua-premium/home-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/home-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/home-3-v1233.jpg?v=1233"
      ],
      mosque: [
        "/kids/assets/dua-premium/mosque-v1222.jpg?v=1233",
        "/kids/assets/dua-premium/mosque-2-v1233.jpg?v=1233",
        "/kids/assets/dua-premium/mosque-3-v1233.jpg?v=1233"
      ]
    };
    const list = sets[k] || sets.book;
    return list[assetHash(seed || k) % list.length];
  }

  function artMarkup(kind, extraClass, seed) {
    const raw = String(kind || "");
    const k = /^action-/.test(raw) ? raw : artKind(kind);
    return '<img class="duahub-3d ' + escapeHtml(k) + " " + (extraClass || "") +
      '" src="' + artAsset(kind, seed) + '" alt="" aria-hidden="true" loading="lazy" decoding="async">';
  }

  function detailSceneAsset(d) {
    return artAsset(categoryOf(d), d && d.id);
  }

  function avatarSvg(gender, className) {
    const girl = gender === "girl";
    const uid = "av" + Math.random().toString(36).slice(2, 8);
    return '<span class="kids-profile-avatar ' + (className || "") + '" data-avatar="' + (girl ? "girl" : "boy") + '" aria-hidden="true">' +
      '<svg viewBox="0 0 96 96" focusable="false">' +
      '<defs>' +
      '<radialGradient id="' + uid + 'skin" cx="44%" cy="30%" r="70%"><stop offset="0" stop-color="#ffe3c7"/><stop offset=".72" stop-color="#dca879"/><stop offset="1" stop-color="#b77b54"/></radialGradient>' +
      '<linearGradient id="' + uid + 'navy" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#173a66"/><stop offset="1" stop-color="#071d38"/></linearGradient>' +
      '<linearGradient id="' + uid + 'gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0b6"/><stop offset=".5" stop-color="#d8a944"/><stop offset="1" stop-color="#8b5b16"/></linearGradient>' +
      '</defs>' +
      '<circle cx="48" cy="48" r="45" fill="url(#' + uid + 'navy)" stroke="url(#' + uid + 'gold)" stroke-width="3"/>' +
      (girl
        ? '<path d="M22 71c1-25 5-48 26-52 21 4 25 27 26 52-8 10-18 15-26 15S30 81 22 71z" fill="#d9b068"/><path d="M27 68c2-23 7-42 21-45 14 3 19 22 21 45-6 8-13 12-21 12s-15-4-21-12z" fill="#efe0bd"/>'
        : '<path d="M24 35c3-16 12-24 24-24s21 8 24 24c-8-5-16-7-24-7s-16 2-24 7z" fill="#f7f0dd" stroke="#d7b76f" stroke-width="1.5"/><path d="M28 31c6-5 13-7 20-7 8 0 15 2 21 7" fill="none" stroke="#b99756" stroke-width="1.5"/>') +
      '<ellipse cx="48" cy="51" rx="22" ry="24" fill="url(#' + uid + 'skin)"/>' +
      '<ellipse cx="39" cy="49" rx="3.7" ry="5" fill="#1d1a19"/><ellipse cx="57" cy="49" rx="3.7" ry="5" fill="#1d1a19"/>' +
      '<circle cx="40" cy="47.5" r="1.2" fill="#fff"/><circle cx="58" cy="47.5" r="1.2" fill="#fff"/>' +
      '<path d="M41 61c4 3 10 3 14 0" fill="none" stroke="#8b4d42" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="31" cy="57" r="3" fill="#e59b8b" opacity=".35"/><circle cx="65" cy="57" r="3" fill="#e59b8b" opacity=".35"/>' +
      '<path d="M29 83c4-11 11-16 19-16 9 0 16 5 20 16" fill="' + (girl ? "#d4ad64" : "#f3ead2") + '"/>' +
      '</svg></span>';
  }

  function profileDisplayName() {
    const p = activeProfile();
    return p?.name || "Mein Profil";
  }

  function buildView() {
    if (q("#view-dua")) return q("#view-dua");
    const quran = q("#view-quran");
    if (!quran) return null;
    const view = document.createElement("section");
    view.id = "view-dua";
    view.className = "view duahub-view";
    view.innerHTML =
      '<div class="duahub-home" id="duaHubHome">' +
        '<header class="duahub-head">' +
          '<div class="duahub-head-copy"><small>HÖREN · VERSTEHEN · MERKEN</small><h2>Duʿāʾ</h2><p>Deine Duʿāʾ für jeden Tag.</p></div>' +
        '</header>' +
        '<div class="duahub-actions" aria-label="Duʿāʾ Bereiche">' +
          '<button type="button" class="duahub-action select" data-duahub-action="library">' + artMarkup("action-library", "duahub-action-art") + '<strong>Duʿāʾ auswählen</strong><span>Finde die passende Duʿāʾ</span><i class="duahub-arrow">›</i></button>' +
          '<button type="button" class="duahub-action learn" data-duahub-action="learn">' + artMarkup("action-learn", "duahub-action-art") + '<strong>Duʿāʾ lernen</strong><span>Hören · nachsprechen · merken</span><i class="duahub-arrow">›</i></button>' +
          '<button type="button" class="duahub-action random" data-duahub-action="random">' + artMarkup("action-random", "duahub-action-art") + '<strong>Zufalls-Duʿāʾ</strong><span>Entdecke etwas Neues</span><i class="duahub-arrow">›</i></button>' +
        '</div>' +
        '<section class="duahub-resume" id="duaHubResume"></section>' +
        '<section class="duahub-library" id="duaHubLibrary">' +
          '<div class="duahub-section-title"><div><small>DEINE BIBLIOTHEK</small><h3>Duʿāʾ auswählen</h3></div><span id="duaHubCount"></span></div>' +
          '<label class="duahub-search"><span aria-hidden="true"></span><input id="duaHubSearch" type="search" inputmode="search" autocomplete="off" placeholder="Welche Duʿāʾ suchst du?"></label>' +
          '<div class="duahub-chips" id="duaHubChips"></div>' +
          '<div class="duahub-grid" id="duaHubGrid"><div class="duahub-loading">Duʿāʾ werden geladen …</div></div>' +
        '</section>' +
      '</div>' +
      '<section class="duahub-detail" id="duaHubDetail" aria-hidden="true">' +
        '<div class="duahub-detail-scroll" id="duaHubDetailScroll">' +
          '<button type="button" class="duahub-detail-back" id="duaHubBack" aria-label="Zur Duʿāʾ-Bibliothek">‹ <span>Zurück</span></button>' +
          '<div class="duahub-detail-hero" id="duaHubDetailHero">' +
            '<div class="duahub-detail-titlewrap">' +
              '<div class="duahub-detail-kicker" id="duaHubDetailKicker">GEPRÜFT</div>' +
              '<h2 id="duaHubDetailTitle">Duʿāʾ</h2>' +
              '<p id="duaHubDetailPrompt" class="duahub-detail-prompt"></p>' +
            '</div>' +
          '</div>' +
          '<div class="duahub-detail-actions">' +
            '<button type="button" id="duaHubListen" class="duahub-listen"><span class="duahub-play">▶</span><b>Anhören</b></button>' +
            '<button type="button" id="duaHubLearn" class="duahub-learn"><span class="duahub-bookmark">◆</span><b>Lernen</b></button>' +
          '</div>' +
          '<article class="duahub-textcard">' +
            '<div class="duahub-arabic" id="duaHubArabic" dir="rtl" lang="ar"></div>' +
            '<div class="duahub-translit" id="duaHubTranslit"></div>' +
            '<div class="duahub-rule"></div>' +
            '<div class="duahub-meaning" id="duaHubMeaning"></div>' +
            '<button type="button" class="duahub-german-audio" id="duaHubGerman">Erklärung hören</button>' +
            '<div class="duahub-source" id="duaHubSource"></div>' +
          '</article>' +
        '</div>' +
      '</section>';
    quran.parentNode.insertBefore(view, quran);
    return view;
  }

  function installNav() {
    const nav = q(".bottom-nav");
    if (!nav) return;
    let btn = q('.nav-btn[data-target="dua"]', nav);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "nav-btn duahub-nav";
      btn.dataset.target = "dua";
      btn.innerHTML = '<span class="ico duahub-nav-ico" aria-hidden="true"><img src="/kids/assets/dua-premium/nav-dua-v1222.png?v=1222" alt="" decoding="async"></span><span class="lab">Duʿāʾ</span>';
      const stories = q('.nav-btn[data-target="stories"]', nav);
      if (stories?.nextSibling) nav.insertBefore(btn, stories.nextSibling);
      else nav.appendChild(btn);
    }
    if (!btn.dataset.duahubBound) {
      btn.dataset.duahubBound = "1";
      btn.addEventListener("click", activate);
    }
  }

  function activate() {
    const view = q("#view-dua");
    if (!view) return;
    const current = q(".view.active");
    if (current && current !== view) current.classList.remove("active");
    view.classList.add("active");
    qa(".bottom-nav .nav-btn").forEach(b => b.classList.toggle("active", b.dataset.target === "dua"));
    document.documentElement.setAttribute("data-view", "dua");
    closeDetail(false);
    const shell = q(".shell");
    requestAnimationFrame(() => {
      if (shell) {
        try { shell.scrollTo({ top: 0, left: 0, behavior: "auto" }); }
        catch (_) { shell.scrollTop = 0; }
      }
    });
    renderResume();
    renderLibrary();
  }

  function installNavCoherence() {
    const nav = q(".bottom-nav");
    if (!nav || nav.dataset.duahubCoherence) return;
    nav.dataset.duahubCoherence = "1";
    nav.addEventListener("click", e => {
      const b = e.target.closest(".nav-btn[data-target]");
      if (!b || b.dataset.target === "dua") return;
      closeDetail(false);
    }, true);
  }

  function filteredLibrary() {
    const query = activeQuery.trim().toLocaleLowerCase("de");
    return availableItems().filter(d => {
      if (activeCategory !== "all" && categoryOf(d) !== activeCategory) return false;
      if (!query) return true;
      return [d.title, d.childPrompt, d.meaning, d.transliteration, d.source]
        .join(" ").toLocaleLowerCase("de").includes(query);
    });
  }

  function renderChips() {
    const box = q("#duaHubChips");
    if (!box) return;
    const cats = ["all", "sleep", "food", "home", "mosque", "family", "protection", "knowledge"];
    box.innerHTML = cats.map(cat =>
      '<button type="button" class="' + (cat === activeCategory ? "active" : "") + '" data-duahub-cat="' + cat + '">' +
      escapeHtml(categoryLabel(cat)) + "</button>"
    ).join("");
    qa("[data-duahub-cat]", box).forEach(b => {
      b.addEventListener("click", () => {
        activeCategory = b.dataset.duahubCat || "all";
        renderChips();
        renderLibrary();
      });
    });
  }

  function stageLabel(d) {
    const p = progress(d.id);
    if (p.stage === "secure") return "Sicher gelernt";
    if (p.stage === "review") return "Wiederholen";
    if (p.attempts > 0 || p.stage === "learning") return "Weiterlernen";
    return "Neu";
  }

  function renderLibrary() {
    const box = q("#duaHubGrid");
    if (!box) return;
    const list = filteredLibrary();
    const count = q("#duaHubCount");
    if (count) count.textContent = list.length + " Duʿāʾ";
    if (!list.length) {
      box.innerHTML = '<div class="duahub-empty"><b>Nichts gefunden</b><span>Versuche eine andere Kategorie oder Suche.</span></div>';
      return;
    }
    box.innerHTML = list.map(d => {
      const cat = categoryOf(d);
      return '<button type="button" class="duahub-card cat-' + cat + '" data-duahub-id="' + escapeHtml(d.id) + '">' +
        '<span class="duahub-card-art">' + artMarkup(cat, "", d.id) + '</span>' +
        '<span class="duahub-card-copy"><small>' + escapeHtml(categoryLabel(cat)) + '</small><strong>' + escapeHtml(d.title) + '</strong><em>' + escapeHtml(stageLabel(d)) + '</em></span>' +
        '<span class="duahub-card-go">›</span>' +
      "</button>";
    }).join("");
    qa("[data-duahub-id]", box).forEach(b => {
      b.addEventListener("click", () => {
        const d = availableItems().find(x => x.id === b.dataset.duahubId);
        if (d) openDetail(d);
      });
    });
  }

  function renderResume() {
    const box = q("#duaHubResume");
    if (!box) return;
    let cont = getStoredItem(CONTINUE_KEY);
    let last = getStoredItem(LAST_KEY);
    if (!cont) {
      cont = availableItems().find(d => {
        const p = progress(d.id);
        return p.stage === "learning" || p.stage === "review" || Number(p.attempts || 0) > 0;
      }) || null;
    }
    if (!last && availableItems().length) last = availableItems()[0];
    const rows = [];
    if (cont) rows.push(resumeRow("Weiterlernen", cont, "continue"));
    if (last && (!cont || last.id !== cont.id)) rows.push(resumeRow("Zuletzt gehört", last, "last"));
    if (!rows.length) {
      box.innerHTML = "";
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = rows.join("");
    qa("[data-duahub-resume]", box).forEach(b => {
      b.addEventListener("click", () => {
        const d = availableItems().find(x => x.id === b.dataset.duahubResume);
        if (d) openDetail(d);
      });
    });
  }

  function resumeRow(label, d, type) {
    const p = progress(d.id);
    const passes = Math.max(0, Math.min(3, Number(p.reviewPasses || 0)));
    const percent = p.stage === "secure" ? 100 : Math.round((passes / 3) * 100);
    return '<div class="duahub-resume-block">' +
      '<div class="duahub-resume-head"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(stageLabel(d)) + '</span></div>' +
      '<button type="button" class="duahub-resume-card" data-duahub-resume="' + escapeHtml(d.id) + '">' +
        '<span class="duahub-resume-art">' + artMarkup(categoryOf(d), "", d.id) + '</span>' +
        '<span class="duahub-resume-copy"><strong>' + escapeHtml(d.title) + '</strong><span class="duahub-mini-progress"><i style="width:' + percent + '%"></i></span><small>' + (type === "continue" ? "Lernweg fortsetzen" : "Noch einmal anhören") + '</small></span>' +
        '<span class="duahub-resume-go">›</span>' +
      '</button></div>';
  }

  function scrollToLibrary() {
    const library = q("#duaHubLibrary");
    const shell = q(".shell");
    if (!library) return;
    if (shell) {
      const y = Math.max(0, library.offsetTop - 18);
      try { shell.scrollTo({ top: y, behavior: "smooth" }); } catch (_) { shell.scrollTop = y; }
    } else {
      library.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => q("#duaHubSearch")?.focus({ preventScroll: true }), 480);
  }

  function canSmartLearn(d) {
    return !!(d && d.smartLearningReady !== false && Array.isArray(d.learningSegments) && d.learningSegments.length);
  }

  function hasReadyAudio(d) {
    return !!(d && d.audioStatus === "ready");
  }

  function smartLearnItem(d) {
    if (!d) return;
    if (!canSmartLearn(d)) {
      openDetail(d);
      return;
    }
    setContinue(d.id);
    setLast(d.id);
    stopAudio();
    if (window.DARDuaSmartLearn && typeof window.DARDuaSmartLearn.open === "function") {
      window.DARDuaSmartLearn.open(d);
    } else {
      openDetail(d);
    }
  }

  function nextLearnItem() {
    const list = availableItems().filter(canSmartLearn);
    if (!list.length) return null;
    return list.find(d => progress(d.id).stage !== "secure") || list[0];
  }

  function randomItem() {
    const list = availableItems();
    if (!list.length) return null;
    let index = Math.floor(Math.random() * list.length);
    try {
      if (crypto?.getRandomValues) {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        index = a[0] % list.length;
      }
    } catch (_) {}
    return list[index];
  }

  function heroSceneClass(d) {
    return "scene-" + categoryOf(d);
  }

  function clearDuaLocks() {
    const shell = q(".shell");
    const nav = q(".bottom-nav");
    const home = q("#duaHubHome");
    [shell, nav, home].forEach(el => {
      if (!el) return;
      el.removeAttribute("inert");
      if (el === nav) el.removeAttribute("aria-hidden");
    });
    if (shell) {
      shell.style.removeProperty("overflow");
      shell.style.removeProperty("touch-action");
    }
    document.body?.style.removeProperty("overflow");
  }

  function openDetail(d) {
    detailItem = d;
    setLast(d.id);
    const detail = q("#duaHubDetail");
    const home = q("#duaHubHome");
    if (!detail || !home) return;
    clearDuaLocks();

    const hero = q("#duaHubDetailHero");
    if (hero) {
      hero.className = "duahub-detail-hero " + heroSceneClass(d);
      hero.style.setProperty("--duahub-detail-image", 'url("' + detailSceneAsset(d) + '")');
    }
    q("#duaHubDetailKicker").textContent = "✓ GEPRÜFT · " + categoryLabel(categoryOf(d)).toUpperCase();
    q("#duaHubDetailTitle").textContent = d.title || "Duʿāʾ";
    q("#duaHubDetailPrompt").textContent = d.childPrompt || "";
    q("#duaHubArabic").textContent = d.arabic || "";
    q("#duaHubTranslit").textContent = d.transliteration || "";
    q("#duaHubMeaning").textContent = d.meaning || "";

    const audioReady = hasReadyAudio(d);
    const learnReady = canSmartLearn(d);
    const listenButton = q("#duaHubListen");
    const learnButton = q("#duaHubLearn");
    const germanButton = q("#duaHubGerman");
    if (listenButton) {
      listenButton.disabled = !audioReady;
      const label = q("b", listenButton);
      if (label) label.textContent = audioReady ? "Anhören" : "Audio folgt";
      listenButton.setAttribute("aria-disabled", audioReady ? "false" : "true");
    }
    if (learnButton) {
      learnButton.disabled = !learnReady;
      const label = q("b", learnButton);
      if (label) label.textContent = learnReady ? "Lernen" : "Lern-Audio folgt";
      learnButton.setAttribute("aria-disabled", learnReady ? "false" : "true");
    }
    if (germanButton) {
      germanButton.disabled = !audioReady;
      germanButton.textContent = audioReady ? "Erklärung hören" : "Erklärung lesen";
      germanButton.setAttribute("aria-disabled", audioReady ? "false" : "true");
    }

    const source = q("#duaHubSource");
    source.innerHTML = '<span>Quelle</span><b>' + escapeHtml(d.source || "Geprüfter Eintrag") + '</b>' +
      (d.sourceUrl ? '<a href="' + escapeHtml(d.sourceUrl) + '" target="_blank" rel="noopener">Nachweis öffnen</a>' : "");

    const shell = q(".shell");
    lastShellScroll = shell ? (Number(shell.scrollTop) || 0) : 0;
    home.hidden = true;
    home.setAttribute("aria-hidden", "true");
    detail.classList.add("open");
    detail.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("duahub-detail-open");
    requestAnimationFrame(() => {
      if (shell) {
        try { shell.scrollTo({ top: 0, left: 0, behavior: "auto" }); }
        catch (_) { shell.scrollTop = 0; }
      }
    });
  }

  function closeDetail(restore = true) {
    stopAudio();
    const detail = q("#duaHubDetail");
    const home = q("#duaHubHome");
    if (!detail || !home) {
      clearDuaLocks();
      document.documentElement.classList.remove("duahub-detail-open");
      return;
    }
    detail.classList.remove("open");
    detail.setAttribute("aria-hidden", "true");
    home.hidden = false;
    home.removeAttribute("aria-hidden");
    clearDuaLocks();
    document.documentElement.classList.remove("duahub-detail-open");
    detailItem = null;
    if (restore) {
      const shell = q(".shell");
      requestAnimationFrame(() => {
        if (shell) {
          try { shell.scrollTo({ top: lastShellScroll, left: 0, behavior: "auto" }); } catch (_) { shell.scrollTop = lastShellScroll; }
        }
      });
      q("#view-dua")?.focus?.({ preventScroll: true });
    }
  }

  function stopAudio() {
    try {
      if (window.DARDuaSmartLearn?.stop) window.DARDuaSmartLearn.stop();
    } catch (_) {}
    try {
      if (window.DARKidsOwnerVoice?.stop) window.DARKidsOwnerVoice.stop();
    } catch (_) {}
    if (fallbackAudio) {
      try { fallbackAudio.pause(); fallbackAudio.src = ""; } catch (_) {}
      fallbackAudio = null;
    }
    qa(".duahub-listen.is-playing").forEach(el => el.classList.remove("is-playing"));
  }

  function everyAyahUrl(ref) {
    const surah = String(Number(ref.surah) || 1).padStart(3, "0");
    const ayah = String(Number(ref.ayah) || 1).padStart(3, "0");
    return "https://everyayah.com/data/Husary_128kbps/" + surah + ayah + ".mp3";
  }

  function playQuranRefs(refs, index = 0) {
    if (!Array.isArray(refs) || index >= refs.length) {
      q("#duaHubListen")?.classList.remove("is-playing");
      return;
    }
    fallbackAudio = new Audio(everyAyahUrl(refs[index]));
    fallbackAudio.playsInline = true;
    fallbackAudio.onended = () => playQuranRefs(refs, index + 1);
    fallbackAudio.onerror = () => q("#duaHubListen")?.classList.remove("is-playing");
    fallbackAudio.play().catch(() => q("#duaHubListen")?.classList.remove("is-playing"));
  }

  function playArabic(d) {
    if (!d || !hasReadyAudio(d)) return;
    stopAudio();
    const button = q("#duaHubListen");
    button?.classList.add("is-playing");
    setLast(d.id);
    const smart = window.DARDuaSmartLearn;
    if (smart && typeof smart.playPreview === "function") {
      Promise.resolve(smart.playPreview(d, 1))
        .catch(() => {
          if (window.DARKidsOwnerVoice?.play) {
            window.DARKidsOwnerVoice.play(String(d.audioArabicText || d.arabic || ""), { source: "kids-dua-hub-serhat-fusha" });
          }
        })
        .finally(() => setTimeout(() => button?.classList.remove("is-playing"), 650));
      return;
    }
    if (window.DARKidsOwnerVoice?.play) {
      window.DARKidsOwnerVoice.play(String(d.audioArabicText || d.arabic || ""), { source: "kids-dua-hub-serhat-fusha" });
    }
  }

  function playGerman(d) {
    if (!d || !hasReadyAudio(d)) return;
    stopAudio();
    const text = String(d.audioGermanText || ((d.childPrompt || "") + " " + (d.meaning || ""))).replace(/\s+/g, " ").trim();
    if (window.DARKidsOwnerVoice?.play) window.DARKidsOwnerVoice.play(text, { source: "kids-dua-hub-german" });
  }

  function bindView() {
    const view = q("#view-dua");
    if (!view || view.dataset.duahubBound) return;
    view.dataset.duahubBound = "1";
    qa("[data-duahub-action]", view).forEach(b => {
      b.addEventListener("click", () => {
        const action = b.dataset.duahubAction;
        if (action === "library") scrollToLibrary();
        if (action === "learn") smartLearnItem(nextLearnItem());
        if (action === "random") {
          const d = randomItem();
          if (d) openDetail(d);
        }
      });
    });
    q("#duaHubSearch")?.addEventListener("input", e => {
      activeQuery = e.target.value || "";
      renderLibrary();
    });
    q("#duaHubBack")?.addEventListener("click", () => closeDetail());
    q("#duaHubListen")?.addEventListener("click", () => {
      if (q("#duaHubListen")?.classList.contains("is-playing")) stopAudio();
      else playArabic(detailItem);
    });
    q("#duaHubLearn")?.addEventListener("click", () => smartLearnItem(detailItem));
    q("#duaHubGerman")?.addEventListener("click", () => playGerman(detailItem));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAudio();
      else if (!q("#duaHubDetail")?.classList.contains("open")) clearDuaLocks();
    }, { passive: true });
    window.addEventListener("pageshow", () => {
      if (!q("#duaHubDetail")?.classList.contains("open")) clearDuaLocks();
    }, { passive: true });
  }

  function enhanceProfileRows() {
    const box = q("#profileList");
    if (!box) return;
    const profiles = loadProfiles();
    const active = localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
    qa(".profile-row", box).forEach(row => {
      const button = q("[data-profile]", row);
      if (!button || button.dataset.avatarReady) return;
      const id = button.getAttribute("data-profile") || "";
      const p = profiles.find(x => String(x.id) === id) || {};
      const name = p.name || "Kind";
      const isActive = id === active;
      button.dataset.avatarReady = "1";
      button.classList.add("profile-person");
      button.innerHTML = avatarSvg(p.gender === "girl" ? "girl" : "boy", "profile-row-avatar") +
        '<span class="profile-person-copy"><strong>' + escapeHtml(name) + '</strong><small>' +
        (p.gender === "girl" ? "Mädchenprofil" : "Jungenprofil") + (p.age ? " · " + escapeHtml(p.age) : "") +
        '</small></span>' + (isActive ? '<span class="profile-active-badge">Aktiv</span>' : '<span class="profile-switch-chev">›</span>');
    });
  }

  function enhanceProfileCard() {
    const card = q("#profileCard");
    const list = q("#profileList");
    if (!card || !list) return;
    let banner = q("#kidsActiveProfileBanner", card);
    const p = activeProfile();
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "kidsActiveProfileBanner";
      banner.className = "kids-active-profile-banner";
      list.parentNode.insertBefore(banner, list);
    }
    const gender = p?.gender === "girl" ? "girl" : activeGender();
    banner.innerHTML = avatarSvg(gender, "active-profile-avatar") +
      '<div><small>AKTIVES PROFIL</small><strong>' + escapeHtml(p?.name || "Gastprofil") + '</strong><span>' +
      (gender === "girl" ? "Mädchen" : "Junge") + " · " + escapeHtml(p?.age || activeAge()) + '</span></div>';
    enhanceProfileRows();
  }

  function enhanceJoinChoices() {
    qa('#kidsJoin [data-gender]').forEach(b => {
      if (b.dataset.avatarReady) return;
      const gender = b.dataset.gender === "girl" ? "girl" : "boy";
      b.dataset.avatarReady = "1";
      b.classList.add("join-profile-choice");
      b.innerHTML = avatarSvg(gender, "join-choice-avatar") + '<span><strong>' + (gender === "girl" ? "Mädchen" : "Junge") + '</strong><small>Profil auswählen</small></span>';
    });
  }

  function enhanceHeaderProfile() {
    const dot = q(".brand-line .profile-dot");
    if (!dot) return;
    const gender = activeGender();
    const p = activeProfile();
    dot.classList.add("profile-dot-avatar");
    dot.setAttribute("aria-label", p ? "Aktives Profil: " + (p.name || "Kind") : "Kinderprofil");
    dot.innerHTML = avatarSvg(gender, "header-profile-avatar");
  }

  function observeProfiles() {
    const list = q("#profileList");
    if (list && !list.dataset.avatarObserver) {
      list.dataset.avatarObserver = "1";
      const observer = new MutationObserver(() => {
        enhanceProfileRows();
        enhanceHeaderProfile();
      });
      observer.observe(list, { childList: true, subtree: true });
    }
    const app = q(".app");
    if (app && !app.dataset.avatarObserver) {
      app.dataset.avatarObserver = "1";
      new MutationObserver(() => {
        enhanceHeaderProfile();
        enhanceProfileCard();
        const profile = q("#duaHubProfile");
        if (profile) profile.innerHTML = avatarSvg(activeGender(), "duahub-profile-avatar") + '<span>' + escapeHtml(profileDisplayName()) + '</span>';
        renderLibrary();
      }).observe(app, { attributes: true, attributeFilter: ["data-gender", "data-age"] });
    }
  }

  function bindGlow() {
    document.addEventListener("pointerdown", e => {
      const el = e.target.closest?.(".duahub-action,.duahub-card,.duahub-resume-card,.duahub-chips button,.join-profile-choice,.profile-person");
      if (!el) return;
      el.classList.remove("duahub-touch");
      void el.offsetWidth;
      el.classList.add("duahub-touch");
      setTimeout(() => el.classList.remove("duahub-touch"), 520);
    }, true);
  }

  async function loadData() {
    try {
      const res = await fetch(DATA_URL, { cache: "force-cache" });
      if (!res.ok) throw new Error("dua-data");
      const data = await res.json();
      items = Array.isArray(data.items) ? data.items.filter(d => d.verification === "verified") : [];
    } catch (_) {
      items = [];
    }
    renderChips();
    renderLibrary();
    renderResume();
  }

  function init() {
    if (!q(".app") || !q(".bottom-nav") || !q("#view-quran")) {
      setTimeout(init, 120);
      return;
    }
    buildView();
    installNav();
    installNavCoherence();
    bindView();
    renderChips();
    enhanceHeaderProfile();
    enhanceProfileCard();
    enhanceJoinChoices();
    observeProfiles();
    bindGlow();
    loadData();

    window.DARKidsDuaHub = Object.freeze({
      version: VERSION,
      open: activate,
      openDetail: id => {
        const d = availableItems().find(x => x.id === id);
        if (d) { activate(); openDetail(d); }
      },
      closeDetail,
      refresh: () => { renderChips(); renderLibrary(); renderResume(); enhanceProfileCard(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();