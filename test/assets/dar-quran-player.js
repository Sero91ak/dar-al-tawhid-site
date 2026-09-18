(function(){
  "use strict";
  if (window.DARQuranPlayer) return;

  var KEY = "darQuranPlayerStateV1";
  var RECITERS = [
    { id: "alafasy", name: "Mishary Rashid Alafasy", folder: "Alafasy_128kbps", edition: "ar.alafasy" },
    { id: "husary", name: "Mahmoud Khalil Al-Husary", folder: "Husary_128kbps", edition: "ar.husary" },
    { id: "sudais", name: "Abdurrahman As-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", edition: "ar.abdurrahmaansudais" },
    { id: "maher", name: "Maher Al Muaiqly", folder: "MaherAlMuaiqly128kbps", edition: "ar.mahermuaiqly" },
    { id: "minshawi", name: "Mohamed Siddiq El-Minshawi", folder: "Minshawy_Murattal_128kbps", edition: "ar.minshawi" }
  ];
  var SHUFFLE = ["off", "surah", "reciter", "both"];
  var REPEAT = ["off", "ayah", "surah"];
  var TEXT = ["both", "ar", "de"];
  var TEXT_LABEL = { both: "Beides", ar: "Arabisch", de: "Deutsch" };
  var SHUFFLE_LABEL = { off: "Aus", surah: "Sūrah", reciter: "Rezitator", both: "Beides" };
  var REPEAT_LABEL = { off: "Aus", ayah: "Āyah", surah: "Sūrah" };

  var state = {
    surah: 1,
    ayah: 1,
    reciter: "alafasy",
    shuffle: "off",
    repeat: "off",
    text: "both",
    playing: false,
    duration: 0,
    current: 0,
    loading: true,
    error: "",
    followAway: false
  };
  var verses = [];
  var meta = null;
  var seekLock = false;

  function reciterById(id) {
    return RECITERS.find(function (r) { return r.id === id; }) || RECITERS[0];
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n, w) {
    return String(n).padStart(w || 3, "0");
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || typeof raw !== "object") return;
      if (Number(raw.surah) >= 1 && Number(raw.surah) <= 114) state.surah = Number(raw.surah);
      if (Number(raw.ayah) >= 1) state.ayah = Number(raw.ayah);
      if (reciterById(raw.reciter).id === raw.reciter) state.reciter = raw.reciter;
      if (SHUFFLE.indexOf(raw.shuffle) >= 0) state.shuffle = raw.shuffle;
      if (REPEAT.indexOf(raw.repeat) >= 0) state.repeat = raw.repeat;
      if (TEXT.indexOf(raw.text) >= 0) state.text = raw.text;
    } catch (e) {}
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        surah: state.surah,
        ayah: state.ayah,
        reciter: state.reciter,
        shuffle: state.shuffle,
        repeat: state.repeat,
        text: state.text
      }));
    } catch (e) {}
  }
  function audioEl() {
    var a = document.getElementById("darQuranPlayerAudio");
    if (a) return a;
    a = document.createElement("audio");
    a.id = "darQuranPlayerAudio";
    a.preload = "auto";
    a.style.display = "none";
    document.body.appendChild(a);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", function () { state.playing = true; paintControls(); });
    a.addEventListener("pause", function () { state.playing = false; paintControls(); });
    a.addEventListener("error", function () { tryFallback(); });
    return a;
  }
  function globalAyah(surah, ayah) {
    var n = 0;
    var list = (window.quranMeta && window.quranMeta.surahs) || [];
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].id) < surah) n += Number(list[i].total_verses) || 0;
    }
    return n + ayah;
  }
  function audioUrls() {
    var rec = reciterById(state.reciter);
    var s = pad(state.surah, 3);
    var a = pad(state.ayah, 3);
    return [
      "https://everyayah.com/data/" + rec.folder + "/" + s + a + ".mp3",
      "https://cdn.islamic.network/quran/audio/128/" + rec.edition + "/" + globalAyah(state.surah, state.ayah) + ".mp3"
    ];
  }
  var urlIndex = 0;
  function loadAudio(autoplay) {
    var urls = audioUrls();
    urlIndex = 0;
    var a = audioEl();
    a.src = urls[0];
    a.load();
    if (autoplay) a.play().catch(function () {});
  }
  function tryFallback() {
    var urls = audioUrls();
    urlIndex += 1;
    if (urlIndex >= urls.length) {
      state.error = "Audio konnte nicht geladen werden.";
      paintStatus();
      return;
    }
    var a = audioEl();
    a.src = urls[urlIndex];
    a.load();
    if (state.playing) a.play().catch(function () {});
  }
  function onTime() {
    if (seekLock) return;
    var a = audioEl();
    state.current = a.currentTime || 0;
    state.duration = a.duration || 0;
    paintProgress();
  }
  function onMeta() {
    state.duration = audioEl().duration || 0;
    paintProgress();
  }
  async function onEnded() {
    if (state.repeat === "ayah") {
      audioEl().currentTime = 0;
      audioEl().play().catch(function () {});
      return;
    }
    await nextAyah(true);
  }
  function surahMeta(id) {
    return typeof window.quranSurahMeta === "function" ? window.quranSurahMeta(id) : ((window.quranMeta && window.quranMeta.surahs) || []).find(function (s) { return Number(s.id) === Number(id); });
  }
  function typeLabel(t) {
    if (t === "medinan") return "Madanī";
    if (t === "meccan") return "Makkī";
    return "";
  }
  async function ensureData() {
    state.loading = true;
    state.error = "";
    if (typeof window.loadQuranIndex === "function") await window.loadQuranIndex();
    if (typeof window.loadQuranSurah === "function") {
      var doc = await window.loadQuranSurah(state.surah);
      verses = (doc && doc.verses) || [];
    } else {
      verses = [];
    }
    meta = surahMeta(state.surah);
    var total = (meta && meta.total_verses) || verses.length || 1;
    if (state.ayah > total) state.ayah = total;
    if (state.ayah < 1) state.ayah = 1;
    state.loading = false;
    saveState();
  }
  function parseRoute() {
    var raw = String((location.hash || "").replace(/^#/, ""));
    var parts = raw.split("/").filter(Boolean);
    if (parts[0] !== "quran-player") return;
    var s = Number(parts[1]);
    var a = Number(parts[2]);
    if (s >= 1 && s <= 114) state.surah = s;
    if (a >= 1) state.ayah = a;
  }
  function writeHash() {
    var next = "#quran-player/" + state.surah + "/" + state.ayah;
    if (location.hash !== next) {
      try { history.replaceState(null, "", location.pathname + (location.search || "") + next); } catch (e) {}
    }
  }
  function icon(name) {
    var p = {
      back: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      menu: '<path d="M6 8h12M6 12h12M6 16h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      prev: '<path d="M18 6l-8 6 8 6M7 6v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      next: '<path d="M6 6l8 6-8 6M17 6v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      back15: '<path d="M8 8a7 7 0 1 0 8 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 8V4M8 8h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      fwd15: '<path d="M16 8a7 7 0 1 1-8 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V4M16 8h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      play: '<path d="M9 7l10 5-10 5z" fill="currentColor"/>',
      pause: '<path d="M8 7h3v10H8zM13 7h3v10h-3z" fill="currentColor"/>',
      shuffle: '<path d="M4 7h4l3 5 3-5h6M4 17h4l3-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      repeat: '<path d="M7 8h9l-2-2M17 16H8l2 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      book: '<path d="M6 5h12v14H8a2 2 0 0 1-2-2V5z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
      mic: '<rect x="9" y="4" width="6" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 12a5 5 0 0 0 10 0M12 17v3" fill="none" stroke="currentColor" stroke-width="1.6"/>',
      text: '<path d="M6 7h12M8 12h8M10 17h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (p[name] || "") + "</svg>";
  }
  function renderShell() {
    var m = meta || {};
    return (
      '<div id="darQuranPlayer" data-text="' + esc(state.text) + '">' +
        '<header class="dqp-header">' +
          '<button type="button" data-dqp="back" aria-label="Zurück">' + icon("back") + "</button>" +
          '<div><span class="dqp-kicker">DĀR AL TAWḤĪD</span><h1 class="dqp-title">QURʾĀN PLAYER</h1></div>' +
          '<button type="button" data-dqp="menu" aria-label="Optionen">' + icon("menu") + "</button>" +
        "</header>" +
        '<hr class="dqp-line">' +
        '<section class="dqp-info">' +
          '<h2 class="dqp-surah">' + esc(m.transliteration || "…") + "</h2>" +
          '<p class="dqp-ar-name" lang="ar" dir="rtl">' + esc(m.name || "") + "</p>" +
          '<p class="dqp-meta">' + esc(reciterById(state.reciter).name) +
            (m.total_verses ? " · " + m.total_verses + " Āyāt" : "") +
            (typeLabel(m.type) ? " · " + typeLabel(m.type) : "") +
          "</p>" +
        "</section>" +
        '<hr class="dqp-line">' +
        '<section class="dqp-progress">' +
          '<div class="dqp-progress-row"><span data-dqp-cur>0:00</span><span class="dqp-ayah-count" data-dqp-ayah>Āyah ' + state.ayah + " / " + (m.total_verses || "–") + "</span><span data-dqp-dur>0:00</span></div>" +
          '<input class="dqp-slider" data-dqp="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
        "</section>" +
        '<div class="dqp-main-controls">' +
          '<button class="dqp-ctrl" type="button" data-dqp="prev" aria-label="Vorige Āyah">' + icon("prev") + "</button>" +
          '<button class="dqp-ctrl" type="button" data-dqp="back15" aria-label="15 Sekunden zurück">' + icon("back15") + '<span class="dqp-skip-n">15</span></button>' +
          '<button class="dqp-play" type="button" data-dqp="play" aria-label="Wiedergabe">' + icon("play") + "</button>" +
          '<button class="dqp-ctrl" type="button" data-dqp="fwd15" aria-label="15 Sekunden vor">' + icon("fwd15") + '<span class="dqp-skip-n">15</span></button>' +
          '<button class="dqp-ctrl" type="button" data-dqp="next" aria-label="Nächste Āyah">' + icon("next") + "</button>" +
        "</div>" +
        '<div class="dqp-tools">' +
          '<button class="dqp-tool" type="button" data-dqp="shuffle"><span>' + icon("shuffle") + "</span>Zufall<em data-dqp-sh-l></em></button>" +
          '<button class="dqp-tool" type="button" data-dqp="repeat"><span>' + icon("repeat") + "</span>Wiederholen<em data-dqp-rp-l></em></button>" +
          '<button class="dqp-tool" type="button" data-dqp="pick-surah"><span>' + icon("book") + "</span>Sūrah</button>" +
          '<button class="dqp-tool" type="button" data-dqp="pick-reciter"><span>' + icon("mic") + "</span>Rezitator</button>" +
          '<button class="dqp-tool" type="button" data-dqp="text"><span>' + icon("text") + "</span>Textmodus<em data-dqp-tx-l></em></button>" +
        "</div>" +
        '<hr class="dqp-line">' +
        '<div class="dqp-reader" data-dqp-reader>' +
          '<div class="dqp-status">Qurʾān wird vorbereitet…</div>' +
        "</div>" +
        '<button class="dqp-follow" type="button" data-dqp="follow">Zur aktuellen Āyah</button>' +
        '<div class="dqp-sheet" data-dqp-sheet hidden></div>' +
      "</div>"
    );
  }
  function paintProgress() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var cur = root.querySelector("[data-dqp-cur]");
    var dur = root.querySelector("[data-dqp-dur]");
    var ay = root.querySelector("[data-dqp-ayah]");
    var sl = root.querySelector("[data-dqp=seek]");
    if (cur) cur.textContent = fmt(state.current);
    if (dur) dur.textContent = fmt(state.duration);
    if (ay) ay.textContent = "Āyah " + state.ayah + " / " + ((meta && meta.total_verses) || verses.length || "–");
    if (sl) {
      var pct = state.duration ? (state.current / state.duration) * 1000 : 0;
      sl.value = String(Math.round(pct));
      sl.style.setProperty("--dqp-fill", (pct / 10) + "%");
    }
  }
  function paintControls() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var play = root.querySelector("[data-dqp=play]");
    if (play) {
      play.innerHTML = icon(state.playing ? "pause" : "play");
      play.setAttribute("aria-label", state.playing ? "Pause" : "Wiedergabe");
    }
    var sh = root.querySelector("[data-dqp=shuffle]");
    var rp = root.querySelector("[data-dqp=repeat]");
    var tx = root.querySelector("[data-dqp=text]");
    if (sh) sh.classList.toggle("is-on", state.shuffle !== "off");
    if (rp) rp.classList.toggle("is-on", state.repeat !== "off");
    if (tx) tx.classList.toggle("is-on", state.text !== "both");
    var shl = root.querySelector("[data-dqp-sh-l]");
    var rpl = root.querySelector("[data-dqp-rp-l]");
    var txl = root.querySelector("[data-dqp-tx-l]");
    if (shl) shl.textContent = SHUFFLE_LABEL[state.shuffle] || "";
    if (rpl) rpl.textContent = REPEAT_LABEL[state.repeat] || "";
    if (txl) txl.textContent = TEXT_LABEL[state.text] || "";
  }
  function paintStatus() {
    var reader = document.querySelector("[data-dqp-reader]");
    if (!reader) return;
    if (state.loading) {
      reader.innerHTML = '<div class="dqp-status">Qurʾān wird vorbereitet…</div>';
      return;
    }
    if (state.error && !verses.length) {
      reader.innerHTML = '<div class="dqp-status">' + esc(state.error) + "</div>";
      return;
    }
    reader.innerHTML = verses.map(function (v) {
      var id = Number(v.id);
      return '<button type="button" class="dqp-ayah' + (id === state.ayah ? " is-active" : "") + '" data-dqp-ayah-jump="' + id + '" id="dqp-ayah-' + id + '">' +
        '<span class="dqp-ayah-num">' + pad(state.surah, 3) + ":" + pad(id, 3) + "</span>" +
        '<div class="dqp-ayah-ar" lang="ar" dir="rtl">' + esc(v.ar || "") + "</div>" +
        '<div class="dqp-ayah-de">' + esc(v.de || "") + "</div>" +
      "</button>";
    }).join("");
    followActive(true);
  }
  function followActive(force) {
    var root = document.getElementById("darQuranPlayer");
    var el = document.getElementById("dqp-ayah-" + state.ayah);
    var btn = root && root.querySelector("[data-dqp=follow]");
    if (!el) return;
    root.querySelectorAll(".dqp-ayah.is-active").forEach(function (n) { n.classList.remove("is-active"); });
    el.classList.add("is-active");
    if (force || !state.followAway) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      state.followAway = false;
      if (btn) btn.classList.remove("is-visible");
    } else if (btn) btn.classList.add("is-visible");
  }
  function closeSheet() {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (sh) { sh.hidden = true; sh.innerHTML = ""; }
  }
  function openSheet(title, rows) {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (!sh) return;
    sh.hidden = false;
    sh.innerHTML = '<div class="dqp-sheet-card"><div class="dqp-sheet-head"><span>' + esc(title) + '</span><button type="button" data-dqp="sheet-close">Schließen</button></div>' +
      rows.map(function (r) {
        return '<button type="button" class="dqp-opt' + (r.on ? " is-on" : "") + '" data-dqp-opt="' + esc(r.id) + '">' + esc(r.label) + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</button>";
      }).join("") + "</div>";
  }
  function pickRandomSurah() {
    return 1 + Math.floor(Math.random() * 114);
  }
  function pickRandomReciter() {
    return RECITERS[Math.floor(Math.random() * RECITERS.length)].id;
  }
  async function gotoAyah(ayah, autoplay) {
    var total = (meta && meta.total_verses) || verses.length || 1;
    state.ayah = Math.max(1, Math.min(total, Number(ayah) || 1));
    state.followAway = false;
    writeHash();
    saveState();
    paintProgress();
    followActive(true);
    loadAudio(autoplay !== false && (state.playing || autoplay === true));
  }
  async function gotoSurah(id, ayah, autoplay) {
    state.surah = Math.max(1, Math.min(114, Number(id) || 1));
    state.ayah = Number(ayah) || 1;
    await ensureData();
    var host = document.getElementById("darQuranPlayer");
    if (host && host.parentNode) {
      host.parentNode.innerHTML = renderShell();
      bind();
      var ready = document.getElementById("darQuranPlayer");
      if (ready) ready.dataset.ready = "1";
    }
    loadAudio(!!autoplay || state.playing);
  }
  async function nextAyah(fromEnd) {
    if (state.shuffle === "reciter" || state.shuffle === "both") state.reciter = pickRandomReciter();
    var total = (meta && meta.total_verses) || verses.length || 1;
    if (state.ayah < total) return gotoAyah(state.ayah + 1, true);
    if (state.repeat === "surah") return gotoAyah(1, true);
    if (state.shuffle === "surah" || state.shuffle === "both") {
      return gotoSurah(pickRandomSurah(), 1, true);
    }
    if (state.surah < 114) return gotoSurah(state.surah + 1, 1, fromEnd || state.playing);
    return gotoSurah(1, 1, fromEnd || state.playing);
  }
  async function prevAyah() {
    if (state.ayah > 1) return gotoAyah(state.ayah - 1, state.playing);
    if (state.surah > 1) {
      await gotoSurah(state.surah - 1, 1, state.playing);
      return gotoAyah((meta && meta.total_verses) || verses.length || 1, state.playing);
    }
  }
  function skip(delta) {
    var a = audioEl();
    a.currentTime = Math.max(0, (a.currentTime || 0) + delta);
  }
  function cycle(list, cur) {
    return list[(list.indexOf(cur) + 1) % list.length];
  }
  function onTool(kind) {
    if (kind === "shuffle") {
      state.shuffle = cycle(SHUFFLE, state.shuffle);
      saveState();
      paintControls();
      return;
    }
    if (kind === "repeat") { state.repeat = cycle(REPEAT, state.repeat); saveState(); paintControls(); return; }
    if (kind === "text") {
      state.text = cycle(TEXT, state.text);
      saveState();
      var root = document.getElementById("darQuranPlayer");
      if (root) root.setAttribute("data-text", state.text);
      paintControls();
      return;
    }
    if (kind === "pick-surah") {
      var list = (window.quranMeta && window.quranMeta.surahs) || [];
      openSheet("Sūrah wählen", list.map(function (s) {
        return { id: "s-" + s.id, label: s.id + ". " + s.transliteration, sub: s.name, on: Number(s.id) === state.surah };
      }));
      return;
    }
    if (kind === "pick-reciter") {
      openSheet("Rezitator", RECITERS.map(function (r) {
        return { id: "r-" + r.id, label: r.name, on: r.id === state.reciter };
      }));
      return;
    }
    if (kind === "menu") {
      openSheet("Optionen", [
        { id: "m-text", label: "Textmodus: " + TEXT_LABEL[state.text] },
        { id: "m-shuffle", label: "Zufall: " + SHUFFLE_LABEL[state.shuffle] },
        { id: "m-repeat", label: "Wiederholen: " + REPEAT_LABEL[state.repeat] },
        { id: "m-resume", label: "Beim Öffnen fortsetzen", on: true }
      ]);
    }
  }
  async function onOpt(id) {
    closeSheet();
    if (id.indexOf("s-") === 0) return gotoSurah(Number(id.slice(2)), 1, state.playing);
    if (id.indexOf("r-") === 0) {
      state.reciter = id.slice(2);
      saveState();
      loadAudio(state.playing);
      var metaEl = document.querySelector(".dqp-meta");
      if (metaEl && meta) metaEl.textContent = reciterById(state.reciter).name + " · " + meta.total_verses + " Āyāt" + (typeLabel(meta.type) ? " · " + typeLabel(meta.type) : "");
      return;
    }
    if (id === "m-text") onTool("text");
    if (id === "m-shuffle") onTool("shuffle");
    if (id === "m-repeat") onTool("repeat");
  }
  function bind() {
    var root = document.getElementById("darQuranPlayer");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    root.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-dqp],[data-dqp-ayah-jump],[data-dqp-opt]");
      if (!t) return;
      var act = t.getAttribute("data-dqp");
      if (act === "back") { if (typeof window.goBack === "function") window.goBack(); return; }
      if (act === "play") {
        var a = audioEl();
        if (a.paused) a.play().catch(function () {});
        else a.pause();
        return;
      }
      if (act === "prev") { prevAyah(); return; }
      if (act === "next") { nextAyah(false); return; }
      if (act === "back15") { skip(-15); return; }
      if (act === "fwd15") { skip(15); return; }
      if (act === "follow") { state.followAway = false; followActive(true); return; }
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "menu" || act === "shuffle" || act === "repeat" || act === "text" || act === "pick-surah" || act === "pick-reciter") { onTool(act); return; }
      var jump = t.getAttribute("data-dqp-ayah-jump");
      if (jump) { state.playing = true; gotoAyah(Number(jump), true); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    });
    var sl = root.querySelector("[data-dqp=seek]");
    if (sl) {
      sl.addEventListener("input", function () {
        seekLock = true;
        var a = audioEl();
        if (a.duration) a.currentTime = (Number(sl.value) / 1000) * a.duration;
      });
      sl.addEventListener("change", function () { seekLock = false; });
    }
    var reader = root.querySelector("[data-dqp-reader]");
    if (reader) {
      reader.addEventListener("scroll", function () {
        var el = document.getElementById("dqp-ayah-" + state.ayah);
        if (!el) return;
        var r = el.getBoundingClientRect();
        var box = reader.getBoundingClientRect();
        state.followAway = r.top < box.top - 40 || r.bottom > box.bottom + 40;
        var btn = root.querySelector("[data-dqp=follow]");
        if (btn) btn.classList.toggle("is-visible", state.followAway);
      }, { passive: true });
    }
    var sheet = root.querySelector("[data-dqp-sheet]");
    if (sheet) sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    paintControls();
    paintProgress();
    paintStatus();
  }

  window.DARQuranPlayer = {
    render: function (value) {
      loadState();
      parseRoute();
      var parts = String(value || "").split("/").filter(Boolean);
      if (Number(parts[0]) >= 1) state.surah = Number(parts[0]);
      if (Number(parts[1]) >= 1) state.ayah = Number(parts[1]);
      return renderShell();
    },
    bind: function () {
      var host = document.getElementById("darQuranPlayer");
      if (!host) return;
      if (host.dataset.ready === "1") {
        bind();
        paintControls();
        paintProgress();
        return;
      }
      bind();
      ensureData().then(function () {
        var node = document.getElementById("darQuranPlayer");
        if (!node || !node.parentNode) return;
        node.parentNode.innerHTML = renderShell();
        bind();
        var ready = document.getElementById("darQuranPlayer");
        if (ready) ready.dataset.ready = "1";
        writeHash();
        var a = audioEl();
        var want = audioUrls()[0];
        if (!a.getAttribute("src") || a.getAttribute("src").indexOf(pad(state.surah, 3) + pad(state.ayah, 3)) < 0) loadAudio(false);
        else {
          state.current = a.currentTime || 0;
          state.duration = a.duration || 0;
          state.playing = !a.paused;
          paintControls();
          paintProgress();
        }
      });
    }
  };
})();
