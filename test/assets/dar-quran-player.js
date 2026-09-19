(function () {
  "use strict";
  if (window.DARQuranPlayer) return;

  var KEY = "darQuranPlayerStateV1";
  var RECITERS = [
    { id: "alafasy", name: "Mišārī Rāšid al-ʿAfāsī", folder: "Alafasy_128kbps", edition: "ar.alafasy" },
    { id: "minshawi", name: "Muḥammad Ṣiddīq al-Minšāwī", folder: "Minshawy_Murattal_128kbps", edition: "ar.minshawi" },
    { id: "husary", name: "Maḥmūd Ḫalīl al-Ḥuṣarī", folder: "Husary_128kbps", edition: "ar.husary" },
    { id: "basit", name: "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", folder: "Abdul_Basit_Murattal_192kbps", edition: "ar.abdulbasitmurattal" },
    { id: "sudais", name: "ʿAbd ar-Raḥmān as-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", edition: "ar.abdurrahmaansudais" },
    { id: "maher", name: "Māhir al-Muʿayqlī", folder: "MaherAlMuaiqly128kbps", edition: "ar.mahermuaiqly" }
  ];
  var SHUFFLE = ["off", "surah", "reciter", "both"];
  var REPEAT = ["off", "ayah", "surah"];
  var TEXT = ["both", "ar", "de"];
  var TEXT_L = { both: "Beides", ar: "عربي", de: "Deutsch" };
  var SHUFFLE_L = { off: "Aus", surah: "Nur Sūrah zufällig", reciter: "Nur Qāriʾ zufällig", both: "Sūrah + Qāriʾ zufällig" };
  var REPEAT_L = { off: "Aus", ayah: "Āyah", surah: "Sūrah" };
  var TIMER_MINS = [0, 5, 10, 15, 30, 45, 60];

  var state = {
    surah: 1, ayah: 1, reciter: "alafasy",
    shuffle: "off", repeat: "off", text: "both",
    playing: false, duration: 0, current: 0, resumeAt: 0,
    loading: true, error: "", layer: 0,
    timerMin: 0, timerUntil: 0
  };
  var verses = [];
  var meta = null;
  var seekLock = false;
  var urlIndex = 0;
  var lastSurahs = [];
  var lastReciters = [];
  var saveTimer = 0;
  var sleepTimer = 0;

  function reciterById(id) {
    return RECITERS.find(function (r) { return r.id === id; }) || RECITERS[0];
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n, w) { return String(n).padStart(w || 3, "0"); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function verseAt(n) {
    var id = Number(n);
    var found = verses.find(function (v) { return Number(v.id) === id; });
    if (found) return found;
    return verses[id - 1] || null;
  }
  function totalAyat() { return (meta && meta.total_verses) || verses.length || 1; }
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
      if (Number(raw.resumeAt) > 0) state.resumeAt = Number(raw.resumeAt);
      if (TIMER_MINS.indexOf(Number(raw.timerMin)) >= 0) state.timerMin = Number(raw.timerMin);
      if (Array.isArray(raw.lastSurahs)) lastSurahs = raw.lastSurahs.map(Number).filter(Boolean);
      if (Array.isArray(raw.lastReciters)) lastReciters = raw.lastReciters.filter(Boolean);
    } catch (e) {}
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        surah: state.surah, ayah: state.ayah, reciter: state.reciter,
        shuffle: state.shuffle, repeat: state.repeat, text: state.text,
        resumeAt: state.current || state.resumeAt || 0,
        timerMin: state.timerMin,
        lastSurahs: lastSurahs.slice(-12),
        lastReciters: lastReciters.slice(-8)
      }));
    } catch (e) {}
  }
  function rememberSurah(id) {
    lastSurahs.push(Number(id));
    if (lastSurahs.length > 16) lastSurahs = lastSurahs.slice(-16);
  }
  function rememberReciter(id) {
    lastReciters.push(id);
    if (lastReciters.length > 10) lastReciters = lastReciters.slice(-10);
  }
  function audioEl() {
    var a = document.getElementById("darQuranPlayerAudio");
    if (a) return a;
    a = document.createElement("audio");
    a.id = "darQuranPlayerAudio";
    a.preload = "auto";
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    a.style.display = "none";
    document.body.appendChild(a);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", function () { state.playing = true; paintChrome(); });
    a.addEventListener("pause", function () { state.playing = false; paintChrome(); });
    a.addEventListener("error", tryFallback);
    a.addEventListener("canplay", function () { state.error = ""; paintError(); });
    return a;
  }
  function preloadEl() {
    var a = document.getElementById("darQuranPlayerAudioNext");
    if (a) return a;
    a = document.createElement("audio");
    a.id = "darQuranPlayerAudioNext";
    a.preload = "auto";
    a.style.display = "none";
    document.body.appendChild(a);
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
  function urlsFor(surah, ayah) {
    var rec = reciterById(state.reciter);
    var s = pad(surah, 3);
    var a = pad(ayah, 3);
    return [
      "https://everyayah.com/data/" + rec.folder + "/" + s + a + ".mp3",
      "https://cdn.islamic.network/quran/audio/128/" + rec.edition + "/" + globalAyah(surah, ayah) + ".mp3"
    ];
  }
  function loadAudio(autoplay, keepTime) {
    urlIndex = 0;
    state.error = "";
    var a = audioEl();
    a.src = urlsFor(state.surah, state.ayah)[0];
    a.load();
    if (keepTime && state.resumeAt > 0) {
      a.addEventListener("loadedmetadata", function once() {
        a.removeEventListener("loadedmetadata", once);
        if (state.resumeAt < (a.duration || 1e9)) a.currentTime = state.resumeAt;
        state.resumeAt = 0;
      });
    }
    if (autoplay) a.play().catch(function () {});
    paintAyah(true);
    paintChrome();
    preloadNext();
  }
  function preloadNext() {
    var nextA = state.ayah < totalAyat() ? state.ayah + 1 : (state.repeat === "surah" ? 1 : 0);
    if (!nextA) return;
    var p = preloadEl();
    p.src = urlsFor(state.surah, nextA)[0];
    try { p.load(); } catch (e) {}
  }
  function tryFallback() {
    var urls = urlsFor(state.surah, state.ayah);
    urlIndex += 1;
    if (urlIndex >= urls.length) {
      state.error = "Rezitation konnte nicht geladen werden.";
      paintError();
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
    if (state.timerUntil && Date.now() >= state.timerUntil) {
      state.timerUntil = 0;
      state.timerMin = 0;
      a.pause();
      saveState();
      paintChrome();
    }
    if (!saveTimer) saveTimer = setTimeout(function () { saveTimer = 0; saveState(); }, 1800);
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
    paintStatus();
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
    var parts = String(value || "").split("/").filter(Boolean);
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
      prev: '<path d="M6 6h2v12H6zM20 6l-10 6 10 6z" fill="currentColor"/>',
      next: '<path d="M4 6l10 6-10 6zM18 6h2v12h-2z" fill="currentColor"/>',
      play: '<path d="M8 6.2l12 5.8L8 17.8z" fill="currentColor"/>',
      pause: '<path d="M7 6h3.4v12H7zM13.6 6H17v12h-3.4z" fill="currentColor"/>',
      back30: '<path d="M7 8a7 7 0 1 1-1 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 5.5v3.2h3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="12" y="14.2" text-anchor="middle" font-size="7.2" fill="currentColor" font-family="sans-serif">30</text>',
      fwd30: '<path d="M17 8a7 7 0 1 0 1 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M18 5.5v3.2h-3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="12" y="14.2" text-anchor="middle" font-size="7.2" fill="currentColor" font-family="sans-serif">30</text>',
      airplay: '<path d="M6 15.2A7 7 0 0 1 12 5.5a7 7 0 0 1 6 9.7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 19l4-5H8z" fill="currentColor"/>',
      queue: '<path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      reciter: '<circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 19c1.2-3.4 3.4-5 6.5-5s5.3 1.6 6.5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
      shuffle: '<path d="M4 7h4l3 5 3-5h6M4 17h4l3-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 5l3 2-3 2M16 15l3 2-3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      repeat: '<path d="M7 8h9l-2-2M17 16H8l2 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      timer: '<circle cx="12" cy="13" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 13V9.8M9.4 4.6h5.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (p[name] || "") + "</svg>";
  }
  function airplayReady() {
    var a = audioEl();
    return !!(a && (typeof a.webkitShowPlaybackTargetPicker === "function" || (a.remote && typeof a.remote.prompt === "function")));
  }
  function openAirplay() {
    var a = audioEl();
    try {
      if (a && typeof a.webkitShowPlaybackTargetPicker === "function") {
        a.webkitShowPlaybackTargetPicker();
        return;
      }
      if (a && a.remote && typeof a.remote.prompt === "function") {
        a.remote.prompt().catch(function () {});
      }
    } catch (e) {}
  }
  function renderShell() {
    return (
      '<div id="darQuranPlayer" data-text="' + esc(state.text) + '">' +
        '<div class="dqp-top">' +
          '<button class="dqp-min" type="button" data-dqp="min" aria-label="Schließen">‹</button>' +
          '<div class="dqp-text-modes" role="tablist" aria-label="Textmodus">' +
            '<button type="button" data-dqp-text="ar">عربي</button>' +
            '<button type="button" data-dqp-text="de">Deutsch</button>' +
            '<button type="button" data-dqp-text="both">Beides</button>' +
          "</div>" +
          "<span></span>" +
        "</div>" +
        '<div class="dqp-stage">' +
          '<div class="dqp-ayah" data-dqp-ayah>' +
            '<div class="dqp-ayah-ar" lang="ar" dir="rtl"></div>' +
            '<div class="dqp-ayah-de"></div>' +
            '<div class="dqp-status">Wird geladen …</div>' +
          "</div>" +
        "</div>" +
        '<div class="dqp-rule"></div>' +
        '<div class="dqp-who">' +
          '<button type="button" class="dqp-artist" data-dqp="pick-reciter">—</button>' +
          '<button type="button" class="dqp-title" data-dqp="pick-surah">—</button>' +
          '<div class="dqp-ayah-ref" data-ref></div>' +
        "</div>" +
        '<section class="dqp-progress">' +
          '<span class="dqp-times" data-dqp-cur>00:00:00</span>' +
          '<input class="dqp-slider" data-dqp="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
          '<span class="dqp-times is-end" data-dqp-dur>00:00:00</span>' +
        "</section>" +
        '<div class="dqp-controls">' +
          '<button class="dqp-skip" type="button" data-dqp="prev" aria-label="Vorherige Āyah">' + icon("prev") + "</button>" +
          '<button class="dqp-play" type="button" data-dqp="play" aria-label="Wiedergabe">' + icon("play") + "</button>" +
          '<button class="dqp-skip" type="button" data-dqp="next" aria-label="Nächste Āyah">' + icon("next") + "</button>" +
        "</div>" +
        '<div class="dqp-skip30">' +
          '<button type="button" data-dqp="back30" aria-label="30 Sekunden zurück">' + icon("back30") + "</button>" +
          '<button type="button" data-dqp="repeat" aria-label="Wiederholen">' + icon("repeat") + "</button>" +
          '<button type="button" data-dqp="fwd30" aria-label="30 Sekunden vor">' + icon("fwd30") + "</button>" +
        "</div>" +
        '<div class="dqp-rule"></div>' +
        '<div class="dqp-dock">' +
          '<button type="button" data-dqp="timer" aria-label="Timer">' + icon("timer") + '<span class="dqp-dock-label" data-dqp-timer-lab>Timer</span></button>' +
          '<button type="button" data-dqp="shuffle" aria-label="Zufall">' + icon("shuffle") + '<span class="dqp-dock-label">Zufall</span></button>' +
          '<button type="button" data-dqp="pick-surah" aria-label="Sūrah">' + icon("queue") + '<span class="dqp-dock-label">Sūrah</span></button>' +
          '<button type="button" data-dqp="pick-reciter" aria-label="Qāriʾ">' + icon("reciter") + '<span class="dqp-dock-label">Qāriʾ</span></button>' +
          '<button type="button" data-dqp="airplay" aria-label="Audioausgabe">' + icon("airplay") + '<span class="dqp-dock-label">AirPlay</span></button>' +
        "</div>" +
        '<div class="dqp-sheet" data-dqp-sheet hidden></div>' +
      "</div>"
    );
  }
  function paintAyah(animate) {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var el = root.querySelector("[data-dqp-ayah]");
    if (!el) return;
    var v = verseAt(state.ayah);
    var apply = function () {
      var st = el.querySelector(".dqp-status");
      if (st) st.remove();
      var ar = el.querySelector(".dqp-ayah-ar");
      var de = el.querySelector(".dqp-ayah-de");
      if (ar) ar.textContent = (v && (v.ar || v.arabic)) || (state.loading ? "" : "Āyah wird geladen …");
      if (de) de.textContent = (v && (v.de || v.translation)) || "";
      el.classList.remove("is-leave", "is-enter");
      fitAyah(el);
      paintError();
      paintInfo();
    };
    if (!animate) { apply(); return; }
    el.classList.add("is-leave");
    setTimeout(function () {
      apply();
      el.classList.add("is-enter");
      requestAnimationFrame(function () { el.classList.remove("is-enter"); });
    }, 160);
  }
  function fitAyah(el) {
    var ar = el.querySelector(".dqp-ayah-ar");
    var de = el.querySelector(".dqp-ayah-de");
    if (!ar) return;
    var n = (ar.textContent || "").length;
    var px = n > 220 ? 22 : n > 140 ? 26 : n > 80 ? 30 : 34;
    ar.style.fontSize = px + "px";
    ar.style.lineHeight = n > 140 ? "1.55" : "1.72";
    if (de) de.style.fontSize = Math.max(12, Math.round(px * 0.46)) + "px";
    var box = el.parentElement || el;
    if (!box || box.clientHeight < 40) return;
    var guard = 0;
    while (el.scrollHeight > box.clientHeight - 4 && px > 16 && guard < 18) {
      px -= 1;
      ar.style.fontSize = px + "px";
      ar.style.lineHeight = "1.5";
      if (de) de.style.fontSize = Math.max(11, Math.round(px * 0.46)) + "px";
      guard += 1;
    }
  }
  function paintStatus() {
    var el = document.querySelector("#darQuranPlayer .dqp-status");
    if (el) el.textContent = state.loading ? "Sūrah wird geladen …" : "";
  }
  function paintError() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var on = root.querySelector("[data-dqp-ayah]");
    if (!on) return;
    var old = on.querySelector(".dqp-err");
    if (old) old.remove();
    if (!state.error) return;
    var box = document.createElement("div");
    box.className = "dqp-err";
    box.innerHTML = "<div>" + esc(state.error) + '</div><button type="button" data-dqp="retry">Erneut versuchen</button>';
    on.appendChild(box);
  }
  function paintInfo() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var m = meta || {};
    var lat = root.querySelector(".dqp-title");
    var q = root.querySelector(".dqp-artist");
    var ref = root.querySelector("[data-ref]");
    if (lat) lat.textContent = m.transliteration ? ("Sūrah " + m.transliteration) : "—";
    if (q) q.textContent = reciterById(state.reciter).name;
    if (ref) ref.textContent = (m.id || state.surah) + " · Āyah " + state.ayah + " / " + totalAyat();
    syncMediaSession();
  }
  function paintProgress() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var cur = root.querySelector("[data-dqp-cur]");
    var dur = root.querySelector("[data-dqp-dur]");
    var sl = root.querySelector("[data-dqp=seek]");
    if (cur) cur.textContent = fmt(state.current);
    if (dur) dur.textContent = fmt(state.duration || 0);
    if (sl) {
      var pct = state.duration ? (state.current / state.duration) * 1000 : 0;
      sl.value = String(Math.round(pct));
      sl.style.setProperty("--dqp-fill", (pct / 10) + "%");
    }
  }
  function paintChrome() {
    var root = document.getElementById("darQuranPlayer");
    if (root) {
      root.setAttribute("data-text", state.text);
      var play = root.querySelector("[data-dqp=play]");
      if (play) {
        play.innerHTML = icon(state.playing ? "pause" : "play");
        play.setAttribute("aria-label", state.playing ? "Pause" : "Wiedergabe");
      }
      root.querySelectorAll("[data-dqp-text]").forEach(function (btn) {
        btn.classList.toggle("is-on", btn.getAttribute("data-dqp-text") === state.text);
      });
      var sh = root.querySelector("[data-dqp=shuffle]");
      var rp = root.querySelector("[data-dqp=repeat]");
      var tm = root.querySelector("[data-dqp=timer]");
      var ap = root.querySelector("[data-dqp=airplay]");
      if (sh) sh.classList.toggle("is-on", state.shuffle !== "off");
      if (rp) rp.classList.toggle("is-on", state.repeat !== "off");
      if (tm) tm.classList.toggle("is-on", state.timerMin > 0);
      var lab = root.querySelector("[data-dqp-timer-lab]");
      if (lab) lab.textContent = state.timerMin ? (state.timerMin + " min") : "Timer";
      if (ap) {
        var ok = airplayReady();
        ap.classList.toggle("is-off", !ok);
        ap.setAttribute("aria-disabled", ok ? "false" : "true");
        ap.title = ok ? "Audioausgabe" : "AirPlay auf diesem Gerät vorbereitet";
      }
      syncMediaSession();
    }
    paintMini();
  }
  function syncMediaSession() {
    if (!navigator.mediaSession) return;
    var m = meta || {};
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (m.transliteration || "Qurʾān") + " · Āyah " + state.ayah,
        artist: reciterById(state.reciter).name,
        album: "DĀR AL TAWḤĪD"
      });
      navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", function () { audioEl().play().catch(function () {}); });
      navigator.mediaSession.setActionHandler("pause", function () { audioEl().pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { prevAyah(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextAyah(false); });
      navigator.mediaSession.setActionHandler("seekbackward", function () { skip(-30); });
      navigator.mediaSession.setActionHandler("seekforward", function () { skip(30); });
    } catch (e) {}
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
    var a = audioEl();
    var live = !!(a.src && (!a.paused || state.playing || a.currentTime > 0));
    el.classList.toggle("is-on", !document.documentElement.classList.contains("is-quran-player-route") && live);
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
    if (!sh) return;
    sh.classList.remove("is-open");
    setTimeout(function () { sh.hidden = true; sh.innerHTML = ""; }, 280);
  }
  function openSheet(title, html) {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (!sh) return;
    sh.hidden = false;
    sh.innerHTML = '<div class="dqp-sheet-card"><div class="dqp-sheet-head"><span>' + esc(title) + '</span><button type="button" class="dqp-hit" data-dqp="sheet-close">Fertig</button></div>' + html + "</div>";
    requestAnimationFrame(function () { sh.classList.add("is-open"); });
  }
  function pickRandomSurah() {
    var id, n = 0;
    do {
      id = 1 + Math.floor(Math.random() * 114);
      n += 1;
    } while ((id === state.surah || lastSurahs.indexOf(id) >= 0) && n < 24);
    return id;
  }
  function pickRandomReciter() {
    var pool = RECITERS.filter(function (r) { return r.id !== state.reciter; });
    if (!pool.length) pool = RECITERS.slice();
    var filtered = pool.filter(function (r) { return lastReciters.indexOf(r.id) < 0; });
    if (filtered.length) pool = filtered;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }
  async function gotoAyah(ayah, autoplay) {
    state.ayah = Math.max(1, Math.min(totalAyat(), Number(ayah) || 1));
    state.resumeAt = 0;
    writeHash();
    saveState();
    paintProgress();
    loadAudio(autoplay !== false && (state.playing || autoplay === true), false);
  }
  async function gotoSurah(id, ayah, autoplay, keepReciter) {
    var next = Math.max(1, Math.min(114, Number(id) || 1));
    rememberSurah(next);
    state.surah = next;
    state.ayah = Number(ayah) || 1;
    state.resumeAt = 0;
    if (!keepReciter && (state.shuffle === "reciter" || state.shuffle === "both")) {
      state.reciter = pickRandomReciter();
      rememberReciter(state.reciter);
    }
    await ensureData();
    paintInfo();
    writeHash();
    loadAudio(!!autoplay || state.playing, false);
  }
  async function nextAyah(fromEnd) {
    if (state.ayah < totalAyat()) return gotoAyah(state.ayah + 1, true);
    if (state.repeat === "surah") return gotoAyah(1, true);
    if (state.shuffle === "reciter") {
      state.reciter = pickRandomReciter();
      rememberReciter(state.reciter);
      paintInfo();
      return gotoAyah(1, true);
    }
    if (state.shuffle === "surah" || state.shuffle === "both") {
      return gotoSurah(pickRandomSurah(), 1, true, state.shuffle === "surah");
    }
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
  function skip(d) {
    var a = audioEl();
    a.currentTime = Math.max(0, Math.min(a.duration || 0, (a.currentTime || 0) + d));
  }
  function armTimer(mins) {
    state.timerMin = Number(mins) || 0;
    clearTimeout(sleepTimer);
    if (!state.timerMin) {
      state.timerUntil = 0;
      saveState();
      paintChrome();
      return;
    }
    state.timerUntil = Date.now() + state.timerMin * 60 * 1000;
    saveState();
    paintChrome();
  }
  function openSurahSheet() {
    var list = (window.quranMeta && window.quranMeta.surahs) || [];
    var rows = list.map(function (s) {
      var ay = Number(s.total_verses) || 0;
      return '<button type="button" class="dqp-opt' + (Number(s.id) === state.surah ? " is-on" : "") + '" data-dqp-opt="s-' + s.id + '" data-q="' + esc((s.transliteration + " " + s.name + " " + s.id).toLowerCase()) + '"><span>' + s.id + "  " + esc(s.transliteration) + "</span><small>" + esc(s.name) + " · " + ay + " Āyāt</small></button>";
    }).join("");
    openSheet("Sūrah auswählen", '<input class="dqp-search" data-dqp-search type="search" placeholder="Suche" autocomplete="off">' + rows);
  }
  function openReciterSheet() {
    openSheet("Qāriʾ", RECITERS.map(function (r) {
      return '<button type="button" class="dqp-opt' + (r.id === state.reciter ? " is-on" : "") + '" data-dqp-opt="r-' + r.id + '">' + (r.id === state.reciter ? "✓ " : "") + esc(r.name) + "</button>";
    }).join(""));
  }
  function openShuffleSheet() {
    openSheet("Zufall", SHUFFLE.map(function (id) {
      return '<button type="button" class="dqp-opt' + (id === state.shuffle ? " is-on" : "") + '" data-dqp-opt="sh-' + id + '">' + esc(SHUFFLE_L[id]) + "</button>";
    }).join(""));
  }
  function openTimerSheet() {
    openSheet("Timer", TIMER_MINS.map(function (n) {
      var lab = n ? (n + " Minuten") : "Aus";
      return '<button type="button" class="dqp-opt' + (n === state.timerMin ? " is-on" : "") + '" data-dqp-opt="t-' + n + '">' + esc(lab) + "</button>";
    }).join(""));
  }
  async function onOpt(id) {
    if (id.indexOf("s-") === 0) { closeSheet(); return gotoSurah(Number(id.slice(2)), 1, state.playing, true); }
    if (id.indexOf("r-") === 0) {
      closeSheet();
      state.reciter = id.slice(2);
      rememberReciter(state.reciter);
      state.resumeAt = audioEl().currentTime || 0;
      saveState();
      paintInfo();
      loadAudio(state.playing, true);
      return;
    }
    if (id.indexOf("sh-") === 0) {
      closeSheet();
      state.shuffle = id.slice(3);
      saveState();
      paintChrome();
      return;
    }
    if (id.indexOf("t-") === 0) {
      closeSheet();
      armTimer(Number(id.slice(2)));
    }
  }
  function bind(force) {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    if (root.dataset.bound && !force) {
      paintInfo();
      paintChrome();
      paintProgress();
      return;
    }
    root.dataset.bound = "1";
    root.addEventListener("click", function (ev) {
      var textBtn = ev.target.closest("[data-dqp-text]");
      if (textBtn) {
        state.text = textBtn.getAttribute("data-dqp-text");
        saveState();
        paintChrome();
        fitAyah(root.querySelector("[data-dqp-ayah]"));
        return;
      }
      var t = ev.target.closest("[data-dqp],[data-dqp-opt]");
      if (!t) return;
      var act = t.getAttribute("data-dqp");
      if (act === "min") {
        if (typeof window.navigate === "function") window.navigate("quran");
        else location.hash = "#quran";
        setTimeout(paintMini, 40);
        return;
      }
      if (act === "play") {
        var a = audioEl();
        if (a.paused) a.play().catch(function () {});
        else a.pause();
        return;
      }
      if (act === "prev") { prevAyah(); return; }
      if (act === "next") { nextAyah(false); return; }
      if (act === "back30") { skip(-30); return; }
      if (act === "fwd30") { skip(30); return; }
      if (act === "retry") { state.error = ""; loadAudio(true, false); return; }
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "shuffle") { openShuffleSheet(); return; }
      if (act === "repeat") { state.repeat = REPEAT[(REPEAT.indexOf(state.repeat) + 1) % REPEAT.length]; saveState(); paintChrome(); return; }
      if (act === "timer") { openTimerSheet(); return; }
      if (act === "airplay") { if (airplayReady()) openAirplay(); return; }
      if (act === "pick-surah") { openSurahSheet(); return; }
      if (act === "pick-reciter") { openReciterSheet(); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    });
    root.addEventListener("input", function (ev) {
      if (ev.target.hasAttribute("data-dqp-search")) {
        var needle = String(ev.target.value || "").toLowerCase();
        root.querySelectorAll(".dqp-opt[data-q]").forEach(function (opt) {
          opt.style.display = !needle || String(opt.getAttribute("data-q")).indexOf(needle) >= 0 ? "" : "none";
        });
      }
    });
    var sl = root.querySelector("[data-dqp=seek]");
    if (sl) {
      sl.addEventListener("input", function () {
        seekLock = true;
        var a = audioEl();
        if (a.duration) a.currentTime = (Number(sl.value) / 1000) * a.duration;
        state.current = a.currentTime || 0;
        paintProgress();
      });
      sl.addEventListener("change", function () { seekLock = false; saveState(); });
    }
    var sheet = root.querySelector("[data-dqp-sheet]");
    if (sheet) sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    paintChrome();
    paintProgress();
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
      if (host.dataset.ready === "1") { bind(false); return; }
      bind(false);
      ensureData().then(function () {
        var node = document.getElementById("darQuranPlayer");
        if (!node) return;
        node.dataset.ready = "1";
        paintInfo();
        paintAyah(false);
        writeHash();
        var a = audioEl();
        var want = pad(state.surah, 3) + pad(state.ayah, 3);
        if (!a.getAttribute("src") || String(a.src).indexOf(want) < 0) loadAudio(false, true);
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
})();
