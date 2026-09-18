(function () {
  "use strict";
  if (window.DARQuranPlayer) return;

  var KEY = "darQuranPlayerStateV1";
  var RECITERS = [
    { id: "alafasy", name: "Mišārī Rāšid al-ʿAfāsī", folder: "Alafasy_128kbps", edition: "ar.alafasy" },
    { id: "husary", name: "Maḥmūd Ḫalīl al-Ḥuṣarī", folder: "Husary_128kbps", edition: "ar.husary" },
    { id: "sudais", name: "ʿAbd ar-Raḥmān as-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", edition: "ar.abdurrahmaansudais" },
    { id: "maher", name: "Māhir al-Muʿayqlī", folder: "MaherAlMuaiqly128kbps", edition: "ar.mahermuaiqly" },
    { id: "minshawi", name: "Muḥammad Ṣiddīq al-Minšāwī", folder: "Minshawy_Murattal_128kbps", edition: "ar.minshawi" }
  ];
  var SHUFFLE = ["off", "surah", "reciter", "both"];
  var REPEAT = ["off", "ayah", "surah"];
  var TEXT = ["both", "ar", "de"];
  var TEXT_LABEL = { both: "AR+DE", ar: "AR", de: "DE" };
  var SHUFFLE_LABEL = { off: "Aus", surah: "Sūrah zufällig", reciter: "Rezitator zufällig", both: "Sūrah + Rezitator" };
  var REPEAT_LABEL = { off: "Aus", ayah: "Aktuelle Āyah", surah: "Aktuelle Sūrah" };
  var SLEEP = [0, 5, 10, 15, 30, 45];

  var state = {
    surah: 1, ayah: 1, reciter: "alafasy",
    shuffle: "off", repeat: "off", text: "both",
    playing: false, duration: 0, current: 0,
    loading: true, error: "", sleepMin: 0, sleepAt: 0
  };
  var verses = [];
  var meta = null;
  var seekLock = false;
  var urlIndex = 0;
  var ayahPainted = 0;
  var sleepTimer = 0;

  function reciterById(id) {
    return RECITERS.find(function (r) { return r.id === id; }) || RECITERS[0];
  }
  function reciterIndex() {
    return Math.max(0, RECITERS.findIndex(function (r) { return r.id === state.reciter; }));
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n, w) { return String(n).padStart(w || 3, "0"); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function verseAt(n) {
    return verses.find(function (v) { return Number(v.id) === Number(n); }) || null;
  }
  function totalAyat() {
    return (meta && meta.total_verses) || verses.length || 1;
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
        surah: state.surah, ayah: state.ayah, reciter: state.reciter,
        shuffle: state.shuffle, repeat: state.repeat, text: state.text
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
    a.addEventListener("play", function () { state.playing = true; paintChrome(); });
    a.addEventListener("pause", function () { state.playing = false; paintChrome(); });
    a.addEventListener("error", tryFallback);
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
  function loadAudio(autoplay) {
    urlIndex = 0;
    var a = audioEl();
    a.src = audioUrls()[0];
    a.load();
    if (autoplay) a.play().catch(function () {});
    paintAyah(true);
    paintChrome();
  }
  function tryFallback() {
    var urls = audioUrls();
    urlIndex += 1;
    if (urlIndex >= urls.length) {
      state.error = "Audio nicht verfügbar.";
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
    return typeof window.quranSurahMeta === "function"
      ? window.quranSurahMeta(id)
      : ((window.quranMeta && window.quranMeta.surahs) || []).find(function (s) { return Number(s.id) === Number(id); });
  }
  async function ensureData() {
    state.loading = true;
    if (typeof window.loadQuranIndex === "function") await window.loadQuranIndex();
    if (typeof window.loadQuranSurah === "function") {
      var doc = await window.loadQuranSurah(state.surah);
      verses = (doc && doc.verses) || [];
    } else verses = [];
    meta = surahMeta(state.surah);
    if (state.ayah > totalAyat()) state.ayah = totalAyat();
    if (state.ayah < 1) state.ayah = 1;
    state.loading = false;
    saveState();
  }
  function parseRoute(value) {
    var parts = String(value || (location.hash || "").replace(/^#quran-player\/?/, "")).split("/").filter(Boolean);
    if (parts[0] === "quran-player") parts = parts.slice(1);
    var s = Number(parts[0]);
    var a = Number(parts[1]);
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
      chevron: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      ellipsis: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
      prev: '<path d="M18 6l-8 6 8 6M7 6v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      next: '<path d="M6 6l8 6-8 6M17 6v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      back15: '<path d="M8 8a7 7 0 1 0 8 0" fill="none" stroke="currentColor" stroke-width="1.55"/><path d="M8 8V4M8 8h4" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/><text x="12" y="15.2" text-anchor="middle" font-size="6.2" fill="currentColor" font-weight="700">15</text>',
      fwd15: '<path d="M16 8a7 7 0 1 1-8 0" fill="none" stroke="currentColor" stroke-width="1.55"/><path d="M16 8V4M16 8h-4" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/><text x="12" y="15.2" text-anchor="middle" font-size="6.2" fill="currentColor" font-weight="700">15</text>',
      play: '<path d="M9 7l10 5-10 5z" fill="currentColor"/>',
      pause: '<path d="M8 7h3v10H8zM13 7h3v10h-3z" fill="currentColor"/>',
      shuffle: '<path d="M4 7h4l3 5 3-5h6M17 7l3 0M4 17h4l3-5" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>',
      repeat: '<path d="M7 8h9l-2-2M17 16H8l2 2" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (p[name] || "") + "</svg>";
  }
  function hue() {
    return 168 + ((state.surah * 11 + reciterIndex() * 7) % 28);
  }
  function renderShell() {
    var m = meta || {};
    var rec = reciterById(state.reciter);
    return (
      '<div id="darQuranPlayer" data-text="' + esc(state.text) + '" style="--dqp-hue:' + hue() + '">' +
        '<header class="dqp-top">' +
          '<button type="button" data-dqp="min" aria-label="Minimieren">' + icon("chevron") + "</button>" +
          '<div><span class="dqp-kicker">DĀR AL TAWḤĪD</span><h1 class="dqp-head-title">QURʾĀN PLAYER</h1></div>' +
          '<button type="button" data-dqp="menu" aria-label="Optionen">' + icon("ellipsis") + "</button>" +
        "</header>" +
        '<div class="dqp-art-wrap"><div class="dqp-art"><div class="dqp-art-inner">' +
          '<div class="dqp-art-brand">DĀR AL TAWḤĪD</div>' +
          '<div class="dqp-art-label">سورة</div>' +
          '<div class="dqp-art-ar" lang="ar" dir="rtl">' + esc(m.name || "…") + "</div>" +
        "</div></div></div>" +
        '<div class="dqp-meta">' +
          '<button type="button" class="dqp-surah-btn" data-dqp="pick-surah">' + esc(m.transliteration || "…") + "</button>" +
          '<button type="button" class="dqp-reciter-btn" data-dqp="pick-reciter">' + esc(rec.name) + "</button>" +
        "</div>" +
        '<section class="dqp-stage">' +
          '<div class="dqp-ghost" data-dqp-prev></div>' +
          '<div class="dqp-now" data-dqp-now>' +
            '<div class="dqp-now-ar" lang="ar" dir="rtl"></div>' +
            '<div class="dqp-now-de"></div>' +
          "</div>" +
          '<div class="dqp-ghost" data-dqp-next></div>' +
        "</section>" +
        '<section class="dqp-progress">' +
          '<div class="dqp-times"><span data-dqp-cur>0:00</span><span data-dqp-dur>0:00</span></div>' +
          '<input class="dqp-slider" data-dqp="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
          '<div class="dqp-count" data-dqp-ayah></div>' +
        "</section>" +
        '<div class="dqp-controls">' +
          '<button class="dqp-ctrl" type="button" data-dqp="prev" aria-label="Vorige Āyah">' + icon("prev") + "</button>" +
          '<button class="dqp-ctrl" type="button" data-dqp="back15" aria-label="15 Sekunden zurück">' + icon("back15") + "</button>" +
          '<button class="dqp-play" type="button" data-dqp="play" aria-label="Wiedergabe">' + icon("play") + "</button>" +
          '<button class="dqp-ctrl" type="button" data-dqp="fwd15" aria-label="15 Sekunden vor">' + icon("fwd15") + "</button>" +
          '<button class="dqp-ctrl" type="button" data-dqp="next" aria-label="Nächste Āyah">' + icon("next") + "</button>" +
        "</div>" +
        '<div class="dqp-secondary">' +
          '<button class="dqp-ico" type="button" data-dqp="shuffle" aria-label="Zufall">' + icon("shuffle") + "</button>" +
          '<div class="dqp-seg" role="tablist" aria-label="Textmodus">' +
            '<button type="button" data-dqp="text-ar">AR</button>' +
            '<button type="button" data-dqp="text-de">DE</button>' +
            '<button type="button" data-dqp="text-both">AR+DE</button>' +
          "</div>" +
          '<button class="dqp-ico" type="button" data-dqp="repeat" aria-label="Wiederholen">' + icon("repeat") + "</button>" +
        "</div>" +
        '<div class="dqp-sheet" data-dqp-sheet hidden></div>' +
      "</div>"
    );
  }
  function lineFor(v) {
    if (!v) return "";
    if (state.text === "de") return v.de || "";
    return v.ar || "";
  }
  function paintAyah(animate) {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var now = root.querySelector("[data-dqp-now]");
    var prev = root.querySelector("[data-dqp-prev]");
    var next = root.querySelector("[data-dqp-next]");
    var ar = root.querySelector(".dqp-now-ar");
    var de = root.querySelector(".dqp-now-de");
    var cur = verseAt(state.ayah);
    var apply = function () {
      if (ar) ar.textContent = (cur && cur.ar) || (state.loading ? "…" : "");
      if (de) de.textContent = (cur && cur.de) || "";
      if (prev) prev.textContent = lineFor(verseAt(state.ayah - 1));
      if (next) next.textContent = lineFor(verseAt(state.ayah + 1));
      ayahPainted = state.ayah;
      if (now) { now.classList.remove("is-out"); now.classList.add("is-in"); setTimeout(function () { now.classList.remove("is-in"); }, 400); }
    };
    if (animate && now && ayahPainted && ayahPainted !== state.ayah) {
      now.classList.add("is-out");
      setTimeout(apply, 220);
    } else apply();
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
    if (ay) ay.textContent = state.ayah + " / " + totalAyat();
    if (sl) {
      var pct = state.duration ? (state.current / state.duration) * 1000 : 0;
      sl.value = String(Math.round(pct));
      sl.style.setProperty("--dqp-fill", (pct / 10) + "%");
    }
  }
  function paintChrome() {
    var root = document.getElementById("darQuranPlayer");
    if (root) {
      root.style.setProperty("--dqp-hue", String(hue()));
      root.setAttribute("data-text", state.text);
      var play = root.querySelector("[data-dqp=play]");
      if (play) {
        play.innerHTML = icon(state.playing ? "pause" : "play");
        play.setAttribute("aria-label", state.playing ? "Pause" : "Wiedergabe");
      }
      var sh = root.querySelector("[data-dqp=shuffle]");
      var rp = root.querySelector("[data-dqp=repeat]");
      if (sh) sh.classList.toggle("is-on", state.shuffle !== "off");
      if (rp) rp.classList.toggle("is-on", state.repeat !== "off");
      root.querySelectorAll("[data-dqp^=text-]").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-dqp") === "text-" + state.text);
      });
    }
    paintMini();
  }
  function miniEl() {
    var el = document.getElementById("darQuranMiniPlayer");
    if (el) return el;
    el = document.createElement("div");
    el.id = "darQuranMiniPlayer";
    el.innerHTML = '<button type="button" data-dqp-mini="open" class="dqp-mini-copy"><b></b><span></span></button><button type="button" data-dqp-mini="play" aria-label="Wiedergabe"></button>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var t = e.target.closest("[data-dqp-mini]");
      if (!t) return;
      if (t.getAttribute("data-dqp-mini") === "play") {
        var a = audioEl();
        if (a.paused) a.play().catch(function () {});
        else a.pause();
        return;
      }
      if (typeof window.navigate === "function") window.navigate("quran-player", state.surah + "/" + state.ayah);
      else location.hash = "#quran-player/" + state.surah + "/" + state.ayah;
    });
    return el;
  }
  function paintMini() {
    var el = miniEl();
    var onPlayer = document.documentElement.classList.contains("is-quran-player-route");
    var a = audioEl();
    var live = !!(a.src && (!a.paused || state.playing || a.currentTime > 0));
    el.classList.toggle("is-on", !onPlayer && live);
    var m = meta || surahMeta(state.surah) || {};
    var b = el.querySelector("b");
    var s = el.querySelector("span");
    var p = el.querySelector("[data-dqp-mini=play]");
    if (b) b.textContent = m.transliteration || "Qurʾān";
    if (s) s.textContent = reciterById(state.reciter).name;
    if (p) p.innerHTML = icon(a.paused ? "play" : "pause");
  }
  function closeSheet() {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (sh) { sh.hidden = true; sh.innerHTML = ""; }
  }
  function openSheet(title, rows) {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (!sh) return;
    sh.hidden = false;
    sh.innerHTML = '<div class="dqp-sheet-card"><div class="dqp-sheet-head"><span>' + esc(title) + '</span><button type="button" data-dqp="sheet-close">Fertig</button></div>' +
      rows.map(function (r) {
        return '<button type="button" class="dqp-opt' + (r.on ? " is-on" : "") + '" data-dqp-opt="' + esc(r.id) + '">' + esc(r.label) + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</button>";
      }).join("") + "</div>";
  }
  function pickRandomSurah() { return 1 + Math.floor(Math.random() * 114); }
  function pickRandomReciter() { return RECITERS[Math.floor(Math.random() * RECITERS.length)].id; }
  async function gotoAyah(ayah, autoplay) {
    state.ayah = Math.max(1, Math.min(totalAyat(), Number(ayah) || 1));
    writeHash();
    saveState();
    paintProgress();
    loadAudio(autoplay !== false && (state.playing || autoplay === true));
  }
  async function gotoSurah(id, ayah, autoplay, keepReciter) {
    state.surah = Math.max(1, Math.min(114, Number(id) || 1));
    state.ayah = Number(ayah) || 1;
    if (!keepReciter && (state.shuffle === "reciter" || state.shuffle === "both")) state.reciter = pickRandomReciter();
    await ensureData();
    var host = document.getElementById("darQuranPlayer");
    if (host && host.parentNode) {
      host.parentNode.innerHTML = renderShell();
      bind(true);
      var readyGo = document.getElementById("darQuranPlayer");
      if (readyGo) readyGo.dataset.ready = "1";
    }
    loadAudio(!!autoplay || state.playing);
  }
  async function nextAyah(fromEnd) {
    if (state.shuffle === "reciter" || state.shuffle === "both") state.reciter = pickRandomReciter();
    if (state.ayah < totalAyat()) return gotoAyah(state.ayah + 1, true);
    if (state.repeat === "surah") return gotoAyah(1, true);
    if (state.shuffle === "surah" || state.shuffle === "both") return gotoSurah(pickRandomSurah(), 1, true);
    if (state.surah < 114) return gotoSurah(state.surah + 1, 1, fromEnd || state.playing, true);
    return gotoSurah(1, 1, fromEnd || state.playing, true);
  }
  async function prevAyah() {
    if (state.ayah > 1) return gotoAyah(state.ayah - 1, state.playing);
    if (state.surah > 1) {
      await gotoSurah(state.surah - 1, 1, state.playing, true);
      return gotoAyah(totalAyat(), state.playing);
    }
  }
  function skip(delta) {
    var a = audioEl();
    a.currentTime = Math.max(0, (a.currentTime || 0) + delta);
  }
  function cycle(list, cur) { return list[(list.indexOf(cur) + 1) % list.length]; }
  function setSleep(min) {
    state.sleepMin = min;
    clearTimeout(sleepTimer);
    if (!min) { state.sleepAt = 0; return; }
    state.sleepAt = Date.now() + min * 60000;
    sleepTimer = setTimeout(function () { audioEl().pause(); }, min * 60000);
  }
  function openMenu() {
    var sleepNote = state.sleepMin ? state.sleepMin + " Min." : "Aus";
    openSheet("Optionen", [
      { id: "m-shuffle", label: "Zufall: " + SHUFFLE_LABEL[state.shuffle], on: state.shuffle !== "off" },
      { id: "m-repeat", label: "Wiederholen: " + REPEAT_LABEL[state.repeat], on: state.repeat !== "off" },
      { id: "m-text", label: "Textmodus: " + TEXT_LABEL[state.text] },
      { id: "m-surah", label: "Sūrah wechseln" },
      { id: "m-reciter", label: "Rezitator wechseln" },
      { id: "m-sleep", label: "Sleep Timer: " + sleepNote },
      { id: "m-queue", label: "Queue" },
      { id: "m-read", label: "Sūrah lesen" }
    ]);
  }
  function openShuffleSheet() {
    openSheet("Zufall", SHUFFLE.map(function (id) {
      return { id: "sh-" + id, label: SHUFFLE_LABEL[id], on: state.shuffle === id };
    }));
  }
  function openRepeatSheet() {
    openSheet("Wiederholen", REPEAT.map(function (id) {
      return { id: "rp-" + id, label: REPEAT_LABEL[id], on: state.repeat === id };
    }));
  }
  function openSleepSheet() {
    openSheet("Sleep Timer", SLEEP.map(function (n) {
      return { id: "sl-" + n, label: n ? n + " Minuten" : "Aus", on: state.sleepMin === n };
    }));
  }
  function openQueue() {
    var rows = [];
    for (var i = state.ayah; i <= totalAyat(); i++) {
      var v = verseAt(i);
      rows.push({ id: "q-" + i, label: "Āyah " + i, sub: (v && v.ar) || "", on: i === state.ayah });
    }
    openSheet("Queue", rows);
  }
  function openSurahSheet() {
    var list = (window.quranMeta && window.quranMeta.surahs) || [];
    openSheet("Sūrah", list.map(function (s) {
      return { id: "s-" + s.id, label: s.id + ". " + s.transliteration, sub: s.name, on: Number(s.id) === state.surah };
    }));
  }
  function openReciterSheet() {
    openSheet("Rezitator", RECITERS.map(function (r) {
      return { id: "r-" + r.id, label: r.name, on: r.id === state.reciter };
    }));
  }
  async function onOpt(id) {
    closeSheet();
    if (id.indexOf("s-") === 0) return gotoSurah(Number(id.slice(2)), 1, state.playing, true);
    if (id.indexOf("r-") === 0) {
      state.reciter = id.slice(2);
      saveState();
      loadAudio(state.playing);
      var recBtn = document.querySelector(".dqp-reciter-btn");
      if (recBtn) recBtn.textContent = reciterById(state.reciter).name;
      paintChrome();
      return;
    }
    if (id.indexOf("sh-") === 0) { state.shuffle = id.slice(3); saveState(); paintChrome(); return; }
    if (id.indexOf("rp-") === 0) { state.repeat = id.slice(3); saveState(); paintChrome(); return; }
    if (id.indexOf("sl-") === 0) { setSleep(Number(id.slice(3))); return; }
    if (id.indexOf("q-") === 0) return gotoAyah(Number(id.slice(2)), true);
    if (id === "m-shuffle") return openShuffleSheet();
    if (id === "m-repeat") return openRepeatSheet();
    if (id === "m-text") { state.text = cycle(TEXT, state.text); saveState(); paintAyah(false); paintChrome(); return; }
    if (id === "m-surah") return openSurahSheet();
    if (id === "m-reciter") return openReciterSheet();
    if (id === "m-sleep") return openSleepSheet();
    if (id === "m-queue") return openQueue();
    if (id === "m-read" && typeof window.navigate === "function") window.navigate("quran-surah", String(state.surah) + "/" + state.ayah);
  }
  function minimize() {
    if (typeof window.navigate === "function") window.navigate("quran");
    else location.hash = "#quran";
    setTimeout(paintMini, 40);
  }
  function bind(force) {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    if (root.dataset.bound && !force) {
      paintChrome();
      paintProgress();
      paintAyah(false);
      return;
    }
    root.dataset.bound = "1";
    root.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-dqp],[data-dqp-opt]");
      if (!t) return;
      var act = t.getAttribute("data-dqp");
      if (act === "min") { minimize(); return; }
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
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "menu") { openMenu(); return; }
      if (act === "shuffle") { openShuffleSheet(); return; }
      if (act === "repeat") { openRepeatSheet(); return; }
      if (act === "pick-surah") { openSurahSheet(); return; }
      if (act === "pick-reciter") { openReciterSheet(); return; }
      if (act === "text-ar" || act === "text-de" || act === "text-both") {
        state.text = act.replace("text-", "");
        saveState();
        paintAyah(false);
        paintChrome();
        return;
      }
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
    var sheet = root.querySelector("[data-dqp-sheet]");
    if (sheet) sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    paintChrome();
    paintProgress();
    paintAyah(false);
  }

  window.DARQuranPlayer = {
    render: function (value) {
      loadState();
      parseRoute(value);
      return renderShell();
    },
    bind: function () {
      var host = document.getElementById("darQuranPlayer");
      if (!host) { paintMini(); return; }
      if (host.dataset.ready === "1") {
        bind(false);
        return;
      }
      bind(false);
      ensureData().then(function () {
        var node = document.getElementById("darQuranPlayer");
        if (!node || !node.parentNode) return;
        node.parentNode.innerHTML = renderShell();
        bind(true);
        var ready = document.getElementById("darQuranPlayer");
        if (ready) ready.dataset.ready = "1";
        writeHash();
        var a = audioEl();
        var want = pad(state.surah, 3) + pad(state.ayah, 3);
        if (!a.getAttribute("src") || String(a.src).indexOf(want) < 0) loadAudio(false);
        else {
          state.current = a.currentTime || 0;
          state.duration = a.duration || 0;
          state.playing = !a.paused;
          paintAyah(false);
          paintChrome();
          paintProgress();
        }
      });
    }
  };
  document.addEventListener("visibilitychange", paintMini);
})();
