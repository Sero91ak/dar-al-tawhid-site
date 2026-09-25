(() => {
  const ROOT = "/kids/test/";
  const SHARED = {
    surahs: "/content/quran/surahs.json",
    quiz: "/data/quiz-questions.json",
    daily: "/content/updates/daily.json",
    stories: ROOT + "data/kids-stories.json"
  };
  const AGE_KEY = "darKidsTestAgeV1";
  const state = { tab: "heute", stories: null, shared: {}, age: localStorage.getItem(AGE_KEY) || "8-10", story: null };

  const $ = (sel) => document.querySelector(sel);
  const app = $("#app");

  async function getJson(url) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  function profile() {
    const ages = state.stories?.ageProfiles || [];
    return ages.find((a) => a.id === state.age) || ages[0] || { id: "8-10", label: "8–10 Jahre" };
  }

  function nav(tab) {
    const items = [
      ["heute", "☀", "Heute"],
      ["geschichten", "🎧", "Geschichten"],
      ["quran", "📖", "Qurʾān"],
      ["eltern", "⚙", "Eltern"]
    ];
    return `<nav class="nav">${items.map(([id, ico, label]) =>
      `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${ico}</span>${label}</button>`
    ).join("")}</nav>`;
  }

  function home() {
    const list = Array.isArray(state.shared.surahs)
      ? state.shared.surahs
      : (state.shared.surahs?.surahs || []);
    const resume = list.find((s) => Number(s.id) === 20) || list[0] || { transliteration: "Ṭā-Hā", name: "طه" };
    return `
      <div class="kicker"><span class="test-badge">TEST</span><small>KIDS · V0.9</small></div>
      <h1>Was möchtest du machen?</h1>
      <button class="card" data-tab="geschichten">
        <div class="card-copy"><b>Geschichte</b><span>hören & entdecken</span></div>
        <div class="card-art" style="background-image:url('${ROOT}assets/covers/nuh-arche.jpg')"></div>
      </button>
      <button class="card" data-tab="quran">
        <div class="card-copy"><b>Mein Qurʾān</b><span>hören & mitsprechen</span></div>
        <div class="card-art" style="background-image:url('${ROOT}assets/covers/ibrahim-feuer.jpg')"></div>
      </button>
      <button class="card" data-go="daily">
        <div class="card-copy"><b>Meine Duʿāʾ</b><span>hören · verstehen · lernen</span></div>
        <div class="card-art" style="background-image:url('${ROOT}assets/covers/yusuf-geduld.jpg')"></div>
      </button>
      <button class="card" data-go="quiz">
        <div class="card-copy"><b>Quiz spielen</b><span>hören · tippen · lernen</span></div>
        <div class="card-art" style="background-image:url('${ROOT}assets/covers/musa-meer.jpg')"></div>
      </button>
      <button class="resume" data-tab="quran">
        <span>▶</span>
        <div><b>Da weitermachen, wo du warst</b><small>${resume.transliteration || resume.name || "Qurʾān"} · aus der Haupt-App geladen</small></div>
      </button>
      <p class="hint">Nur ein paar Minuten reichen. Danach darf die Kinderwelt Pause machen.</p>
    `;
  }

  function storiesPage() {
    if (state.story) {
      const st = state.story;
      const p = profile();
      const paras = (st.readingText && (st.readingText[p.id] || st.readingText["8-10"])) || [];
      const showRead = p.showReading && paras.length;
      return `
        <button class="back" data-close-story>← Geschichten</button>
        <h2>${st.title}</h2>
        <p class="hint">${st.teaser || ""}</p>
        <button class="resume" data-speak="${st.id}"><span>▶</span><div><b>Anhören</b><small>${p.label}</small></div></button>
        ${showRead ? `<div class="panel">${paras.map((x) => `<p>${x}</p>`).join("")}</div>` : `<div class="panel"><p>Für dieses Alter nur Audio.</p></div>`}
      `;
    }
    const list = state.stories?.stories || [];
    return `
      <h2>Geschichten</h2>
      <p class="hint">Eigene Kids-Inhalte. Quellen und Qurʾān kommen aus der Haupt-App, die Oberfläche bleibt Kids.</p>
      ${list.map((st) => `
        <button class="story" data-story="${st.id}">
          <img src="${st.cover}" alt="">
          <div><b>${st.title}</b><small>${st.teaser || ""}</small></div>
        </button>
      `).join("")}
    `;
  }

  function quranPage() {
    const list = Array.isArray(state.shared.surahs)
      ? state.shared.surahs
      : (state.shared.surahs?.surahs || []);
    const first = list[0] || { id: 1, name: "الفاتحة", transliteration: "Al-Fātiḥah" };
    return `
      <h2>Mein Qurʾān</h2>
      <div class="panel">
        <p>Index aus der Haupt-App, Anzeige nur in Kids Test.</p>
        <p class="ayah">${first.name || "بِسْمِ ٱللَّهِ"}</p>
        <p class="ayah-de">${first.transliteration || "Al-Fātiḥah"}</p>
      </div>
    `;
  }

  function elternPage() {
    const ages = state.stories?.ageProfiles || [];
    const daily = state.shared.daily;
    return `
      <h2>Eltern</h2>
      <div class="panel"><p>Kids Test läuft getrennt von der Besucher-App. Alter steuert Audio und Text.</p></div>
      <div class="ages">
        ${ages.map((a) => `<button type="button" data-age="${a.id}" class="${a.id === state.age ? "on" : ""}"><b>${a.label}</b><br><small>${a.description}</small></button>`).join("")}
      </div>
      <div class="panel" style="margin-top:12px"><p>${daily?.recommendation?.title ? "Heute aus der Haupt-App: " + daily.recommendation.title : "Tagesinhalt der Haupt-App noch nicht geladen."}</p></div>
    `;
  }

  function quizPage() {
    const qs = Array.isArray(state.shared.quiz)
      ? state.shared.quiz
      : (state.shared.quiz?.questions || []);
    const n = Array.isArray(qs) ? qs.length : 0;
    const q = Array.isArray(qs) ? qs[0] : null;
    return `
      <button class="back" data-tab="heute">← Heute</button>
      <h2>Quiz</h2>
      <div class="panel">
        <p>${n ? n + " Fragen aus der Haupt-App (nur gelesen)." : "Quizdaten werden geladen…"}</p>
        ${q ? `<p><b>${q.question || q.text || ""}</b></p>` : ""}
      </div>
    `;
  }

  function dailyPage() {
    const d = state.shared.daily?.dua || state.shared.daily;
    return `
      <button class="back" data-tab="heute">← Heute</button>
      <h2>Meine Duʿāʾ</h2>
      <div class="panel"><p>${d?.title || d?.snippet || "Duʿāʾ des Tages kommt aus der Haupt-App, sobald daily.json erreichbar ist."}</p></div>
    `;
  }

  function render() {
    let body = "";
    if (state.tab === "heute") body = home();
    else if (state.tab === "geschichten") body = storiesPage();
    else if (state.tab === "quran") body = quranPage();
    else if (state.tab === "eltern") body = elternPage();
    else if (state.tab === "quiz") body = quizPage();
    else if (state.tab === "daily") body = dailyPage();
    else body = home();
    const showNav = true;
    app.innerHTML = `<main class="app">${body}</main>${nav(["quiz", "daily"].includes(state.tab) ? "heute" : state.tab)}`;
    bind();
  }

  function speakStory(id) {
    const st = (state.stories?.stories || []).find((x) => x.id === id);
    if (!st || !window.speechSynthesis) return;
    const p = profile();
    const text = (st.audioText && (st.audioText[p.id] || st.audioText["8-10"])) || st.title;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "de-DE";
    speechSynthesis.speak(u);
  }

  function bind() {
    app.parentElement.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.onclick = () => {
        state.tab = btn.getAttribute("data-tab");
        state.story = null;
        render();
      };
    });
    document.querySelectorAll("[data-go]").forEach((btn) => {
      btn.onclick = () => { state.tab = btn.getAttribute("data-go"); render(); };
    });
    document.querySelectorAll("[data-story]").forEach((btn) => {
      btn.onclick = () => {
        state.story = (state.stories?.stories || []).find((x) => x.id === btn.getAttribute("data-story")) || null;
        render();
      };
    });
    document.querySelectorAll("[data-close-story]").forEach((btn) => {
      btn.onclick = () => { state.story = null; state.tab = "geschichten"; render(); };
    });
    document.querySelectorAll("[data-age]").forEach((btn) => {
      btn.onclick = () => {
        state.age = btn.getAttribute("data-age");
        localStorage.setItem(AGE_KEY, state.age);
        render();
      };
    });
    document.querySelectorAll("[data-speak]").forEach((btn) => {
      btn.onclick = () => speakStory(btn.getAttribute("data-speak"));
    });
  }

  async function boot() {
    const [stories, surahs, quiz, daily] = await Promise.all([
      getJson(SHARED.stories),
      getJson(SHARED.surahs),
      getJson(SHARED.quiz),
      getJson(SHARED.daily)
    ]);
    state.stories = stories;
    state.shared = { surahs, quiz, daily };
    render();
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(ROOT + "sw.js").catch(() => {});
  }
  boot();
})();
