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
  var SHUFFLE_L = { off: "Aus", surah: "Sūrah zufällig", reciter: "Rezitator zufällig", both: "Sūrah + Rezitator" };
  var REPEAT_L = { off: "Aus", ayah: "Āyah", surah: "Sūrah" };

  var state = {
    surah: 1, ayah: 1, reciter: "alafasy",
    shuffle: "off", repeat: "off", text: "both",
    playing: false, sessionActive: false, duration: 0, current: 0, resumeAt: 0,
    loading: true, error: "", layer: 0
  };
  var verses = [];
  var meta = null;
  var seekLock = false;
  var urlIndex = 0;
  var lastSurahs = [];
  var saveTimer = 0;

  function reciterById(id) {
    return RECITERS.find(function (r) { return r.id === id; }) || RECITERS[0];
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n, w) { return String(n).padStart(w || 3, "0"); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }
  function verseAt(n) {
    var id = Number(n);
    var found = verses.find(function (v) { return Number(v.id) === id; });
    if (found) return found;
    return verses[id - 1] || null;
  }
  function totalAyat() { return (meta && meta.total_verses) || verses.length || 1; }
  function loadState(opts) {
    opts = opts || {};
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || typeof raw !== "object") return;
      if (opts.keepLiveSession && state.sessionActive) {
        if (Number(raw.resumeAt) > 0 && !state.current) state.resumeAt = Number(raw.resumeAt);
        return;
      }
      if (Number(raw.surah) >= 1 && Number(raw.surah) <= 114) state.surah = Number(raw.surah);
      if (Number(raw.ayah) >= 1) state.ayah = Number(raw.ayah);
      if (reciterById(raw.reciter).id === raw.reciter) state.reciter = raw.reciter;
      if (SHUFFLE.indexOf(raw.shuffle) >= 0) state.shuffle = raw.shuffle;
      if (REPEAT.indexOf(raw.repeat) >= 0) state.repeat = raw.repeat;
      if (TEXT.indexOf(raw.text) >= 0) state.text = raw.text;
      if (Number(raw.resumeAt) > 0) state.resumeAt = Number(raw.resumeAt);
      if (raw.sessionActive === true) state.sessionActive = true;
      if (Array.isArray(raw.lastSurahs)) lastSurahs = raw.lastSurahs.map(Number).filter(Boolean);
    } catch (e) {}
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        surah: state.surah, ayah: state.ayah, reciter: state.reciter,
        shuffle: state.shuffle, repeat: state.repeat, text: state.text,
        resumeAt: state.current || state.resumeAt || 0,
        sessionActive: !!state.sessionActive,
        lastSurahs: lastSurahs.slice(-12)
      }));
    } catch (e) {}
  }
  function rememberSurah(id) {
    lastSurahs.push(Number(id));
    if (lastSurahs.length > 16) lastSurahs = lastSurahs.slice(-16);
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
    a.addEventListener("play", function () { state.playing = true; state.sessionActive = true; saveState(); paintChrome(); });
    a.addEventListener("pause", function () {
      state.playing = false;
      saveState();
      paintChrome();
    });
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
      grab: "",
      more: '<circle cx="12" cy="6" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="18" r="1.6" fill="currentColor"/>',
      prev: '<path d="M6 6h2v12H6zM20 6l-10 6 10 6z" fill="currentColor"/>',
      next: '<path d="M16 6l10 0" fill="none"/><path d="M4 6l10 6-10 6zM18 6h2v12h-2z" fill="currentColor"/>',
      play: '<path d="M8 6.2l12 5.8L8 17.8z" fill="currentColor"/>',
      pause: '<path d="M7 6h3.4v12H7zM13.6 6H17v12h-3.4z" fill="currentColor"/>',
      lyrics: '<path d="M6 5.5h12v10.5H9.2L6 19z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      airplay: '<path d="M6 15.2A7 7 0 0 1 12 5.5a7 7 0 0 1 6 9.7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 19l4-5H8z" fill="currentColor"/>',
      queue: '<path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
      volmin: '<path d="M4 10h2.4L10 7.2v9.6L6.4 14H4z" fill="currentColor"/>',
      volmax: '<path d="M4 10h2.4L10 7.2v9.6L6.4 14H4z" fill="currentColor"/><path d="M13 9.2a3.4 3.4 0 0 1 0 5.6M15.4 7.2a6 6 0 0 1 0 9.6" fill="none" stroke="currentColor" stroke-width="1.5"/>',
      shuffle: '<path d="M4 7h4l3 5 3-5h6M4 17h4l3-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      repeat: '<path d="M7 8h9l-2-2M17 16H8l2 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.8" fill="currentColor"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (p[name] || "") + "</svg>";
  }
  function renderShell() {
    return (
      '<div id="darQuranPlayer" data-text="' + esc(state.text) + '">' +
        '<button class="dqp-grab" type="button" data-dqp="min" aria-label="Minimieren"></button>' +
        '<div class="dqp-art">' +
          '<div class="dqp-ayah" data-dqp-ayah>' +
            '<div class="dqp-ayah-ref" data-ref></div>' +
            '<div class="dqp-ayah-ar" lang="ar" dir="rtl"></div>' +
            '<div class="dqp-ayah-de"></div>' +
            '<div class="dqp-status">Wird geladen …</div>' +
          "</div>" +
        "</div>" +
        '<div class="dqp-meta">' +
          '<button type="button" class="dqp-title" data-dqp="pick-surah">—</button>' +
          '<button type="button" class="dqp-more" data-dqp="menu" aria-label="Optionen">' + icon("more") + "</button>" +
          '<button type="button" class="dqp-artist" data-dqp="pick-reciter">—</button>' +
        "</div>" +
        '<section class="dqp-progress">' +
          '<input class="dqp-slider" data-dqp="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
          '<div class="dqp-times"><span data-dqp-cur>0:00</span><span data-dqp-dur>-0:00</span></div>' +
        "</section>" +
        '<div class="dqp-controls">' +
          '<button class="dqp-skip" type="button" data-dqp="prev" aria-label="Vorige Āyah">' + icon("prev") + "</button>" +
          '<button class="dqp-play" type="button" data-dqp="play" aria-label="Wiedergabe">' + icon("play") + "</button>" +
          '<button class="dqp-skip" type="button" data-dqp="next" aria-label="Nächste Āyah">' + icon("next") + "</button>" +
        "</div>" +
        '<div class="dqp-volume">' +
          icon("volmin") +
          '<input class="dqp-vol" data-dqp="vol" type="range" min="0" max="100" value="100" aria-label="Lautstärke">' +
          icon("volmax") +
        "</div>" +
        '<div class="dqp-dock">' +
          '<button type="button" data-dqp="text" aria-label="Textmodus">' + icon("lyrics") + "</button>" +
          '<button type="button" data-dqp="repeat" aria-label="Wiederholen">' + icon("airplay") + "</button>" +
          '<button type="button" data-dqp="pick-surah" aria-label="Sūrah / Queue">' + icon("queue") + "</button>" +
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
      var ref = el.querySelector("[data-ref]");
      var ar = el.querySelector(".dqp-ayah-ar");
      var de = el.querySelector(".dqp-ayah-de");
      if (ref) ref.textContent = state.surah + " · Āyah " + state.ayah;
      if (ar) ar.textContent = (v && (v.ar || v.arabic)) || (state.loading ? "" : "Āyah wird geladen …");
      if (de) de.textContent = (v && (v.de || v.translation)) || "";
      el.classList.remove("is-leave", "is-enter");
      fitAyah(el);
      paintError();
    };
    if (!animate) { apply(); return; }
    el.classList.add("is-leave");
    setTimeout(function () {
      apply();
      el.classList.add("is-enter");
      requestAnimationFrame(function () {
        el.classList.remove("is-enter");
      });
    }, 160);
  }
  function fitAyah(el) {
    var ar = el.querySelector(".dqp-ayah-ar");
    var de = el.querySelector(".dqp-ayah-de");
    if (!ar) return;
    var n = (ar.textContent || "").length;
    var px = n > 220 ? 24 : n > 140 ? 27 : n > 80 ? 31 : 34;
    ar.style.fontSize = px + "px";
    if (de) de.style.fontSize = Math.max(13, Math.round(px * 0.46)) + "px";
    var box = el.parentElement;
    if (!box || box.clientHeight < 40) return;
    var guard = 0;
    while (el.scrollHeight > box.clientHeight - 8 && px > 18 && guard < 14) {
      px -= 1;
      ar.style.fontSize = px + "px";
      if (de) de.style.fontSize = Math.max(12, Math.round(px * 0.46)) + "px";
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
    if (lat) lat.textContent = m.transliteration ? ("Sūrah " + m.transliteration) : "—";
    if (q) q.textContent = reciterById(state.reciter).name;
    syncMediaSession();
  }
  function paintProgress() {
    var root = document.getElementById("darQuranPlayer");
    if (!root) return;
    var cur = root.querySelector("[data-dqp-cur]");
    var dur = root.querySelector("[data-dqp-dur]");
    var n = root.querySelector("[data-dqp-n]");
    var sl = root.querySelector("[data-dqp=seek]");
    if (cur) cur.textContent = fmt(state.current);
    if (dur) dur.textContent = "-" + fmt(Math.max(0, (state.duration || 0) - (state.current || 0)));
    if (n) n.textContent = "Āyah " + state.ayah + " / " + totalAyat();
    if (sl) {
      var pct = state.duration ? (state.current / state.duration) * 1000 : 0;
      sl.value = String(Math.round(pct));
      sl.style.setProperty("--dqp-fill", (pct / 10) + "%");
    }
    var miniFill = document.querySelector("#darQuranMiniPlayer .dqp-top-progress");
    if (miniFill) miniFill.style.transform = "scaleX(" + (state.duration ? Math.max(0, Math.min(1, state.current / state.duration)) : 0) + ")";
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
      var sh = root.querySelector("[data-dqp=shuffle]");
      var rp = root.querySelector("[data-dqp=repeat]");
      var tx = root.querySelector("[data-dqp=text]");
      if (sh) sh.classList.toggle("is-on", state.shuffle !== "off");
      if (rp) rp.classList.toggle("is-on", state.repeat !== "off");
      if (tx) tx.classList.toggle("is-on", state.text !== "both");
      syncMediaSession();
    }
    paintMini();
  }
  function syncMediaSession() {
    if (!navigator.mediaSession) return;
    try {
      if (!state.sessionActive) {
        navigator.mediaSession.playbackState = "none";
        try { navigator.mediaSession.metadata = null; } catch (e1) {}
        ["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward"].forEach(function (act) {
          try { navigator.mediaSession.setActionHandler(act, null); } catch (e2) {}
        });
        return;
      }
      var m = meta || surahMeta(state.surah) || {};
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (m.transliteration || "Qurʾān") + " · Āyah " + state.ayah,
        artist: reciterById(state.reciter).name,
        album: "DĀR AL TAWḤĪD"
      });
      navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", function () { togglePlay(true); });
      navigator.mediaSession.setActionHandler("pause", function () { audioEl().pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { prevAyah(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextAyah(false); });
      navigator.mediaSession.setActionHandler("seekbackward", function () { skip(-15); });
      navigator.mediaSession.setActionHandler("seekforward", function () { skip(15); });
      try { navigator.mediaSession.setActionHandler("stop", function () { stopSession(); }); } catch (e3) {}
    } catch (e) {}
  }
  function audioHasSrc(a) {
    if (!a) return false;
    var src = String(a.currentSrc || a.getAttribute("src") || "");
    return src && src.indexOf("http") === 0;
  }
  function isFullPlayerRoute() {
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    if (hash.split("/")[0] === "quran-player") return true;
    return document.documentElement.classList.contains("is-quran-player-route")
      || (document.body && document.body.classList.contains("is-quran-player-route"));
  }
  function setPlayerLayout(showOval) {
    var html = document.documentElement;
    var body = document.body;
    html.classList.toggle("player-active", !!state.sessionActive);
    html.classList.toggle("dar-quran-top-capsule-on", !!showOval);
    if (body) {
      body.classList.toggle("player-active", !!state.sessionActive);
      body.classList.toggle("dar-quran-top-capsule-on", !!showOval);
    }
  }
  function openFullPlayer() {
    var value = state.surah + "/" + state.ayah;
    if (typeof window.navigate === "function") window.navigate("quran-player", value);
    else location.hash = "#quran-player/" + value;
    setTimeout(paintMini, 30);
  }
  function togglePlay(forcePlay) {
    state.sessionActive = true;
    saveState();
    var a = audioEl();
    if (!audioHasSrc(a)) {
      loadAudio(true, true);
      return;
    }
    if (forcePlay === true || a.paused) a.play().catch(function () {});
    else a.pause();
  }
  function stopSession() {
    state.sessionActive = false;
    state.playing = false;
    state.resumeAt = 0;
    var a = document.getElementById("darQuranPlayerAudio");
    if (a) {
      try { a.pause(); } catch (e) {}
      try { a.removeAttribute("src"); a.removeAttribute("srcObject"); a.load(); } catch (e2) {}
    }
    saveState();
    syncMediaSession();
    paintChrome();
    paintMini();
  }
  function miniEl() {
    var el = document.getElementById("darQuranMiniPlayer");
    if (!el) {
      el = document.createElement("div");
      el.id = "darQuranMiniPlayer";
      el.setAttribute("data-size", "normal");
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Qurʾān Wiedergabe");
      el.innerHTML =
        '<button type="button" data-dqp-mini="open" class="dqp-top-open">' +
          '<span class="dqp-top-mark" aria-hidden="true">📖</span>' +
          '<span class="dqp-top-text"><b></b><span></span></span>' +
        "</button>" +
        '<button type="button" class="dqp-top-ctrl" data-dqp-mini="play" aria-label="Wiedergabe"></button>' +
        '<button type="button" class="dqp-top-ctrl dqp-top-stop" data-dqp-mini="stop" aria-label="Stopp"></button>' +
        '<i class="dqp-top-progress" aria-hidden="true"></i>';
      el.addEventListener("click", function (e) {
        var t = e.target.closest("[data-dqp-mini]");
        if (!t) return;
        var act = t.getAttribute("data-dqp-mini");
        if (act === "play") { e.preventDefault(); e.stopPropagation(); togglePlay(); return; }
        if (act === "stop") { e.preventDefault(); e.stopPropagation(); stopSession(); return; }
        openFullPlayer();
      });
    }
    if (document.body && el.parentNode !== document.body) document.body.appendChild(el);
    return el;
  }
  function paintMini() {
    var el = miniEl();
    var onFull = isFullPlayerRoute();
    var show = !!state.sessionActive && !onFull;
    el.classList.toggle("is-on", show);
    el.setAttribute("aria-hidden", show ? "false" : "true");
    setPlayerLayout(show);
    var m = meta || surahMeta(state.surah) || {};
    var latin = m.transliteration ? ("Sūrah " + m.transliteration) : "Qurʾān";
    var b = el.querySelector(".dqp-top-text b");
    var s = el.querySelector(".dqp-top-text span");
    var p = el.querySelector("[data-dqp-mini=play]");
    var st = el.querySelector("[data-dqp-mini=stop]");
    if (b) b.textContent = latin + " · Āyah " + state.ayah;
    if (s) s.textContent = reciterById(state.reciter).name;
    if (p) {
      p.innerHTML = icon(state.playing ? "pause" : "play");
      p.setAttribute("aria-label", state.playing ? "Pause" : "Wiedergabe");
    }
    if (st) st.innerHTML = icon("stop");
    var miniFill = el.querySelector(".dqp-top-progress");
    if (miniFill) miniFill.style.transform = "scaleX(" + (state.duration ? Math.max(0, Math.min(1, state.current / state.duration)) : 0) + ")";
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
  function cycle(list, cur) { return list[(list.indexOf(cur) + 1) % list.length]; }
  function pickRandomSurah() {
    var id, n = 0;
    do {
      id = 1 + Math.floor(Math.random() * 114);
      n += 1;
    } while (lastSurahs.indexOf(id) >= 0 && n < 20);
    return id;
  }
  function pickRandomReciter() { return RECITERS[Math.floor(Math.random() * RECITERS.length)].id; }
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
    if (!keepReciter && (state.shuffle === "reciter" || state.shuffle === "both")) state.reciter = pickRandomReciter();
    await ensureData();
    paintInfo();
    writeHash();
    loadAudio(!!autoplay || state.playing, false);
  }
  async function nextAyah(fromEnd) {
    if (state.shuffle === "reciter" || state.shuffle === "both") {
      state.reciter = pickRandomReciter();
      paintInfo();
    }
    if (state.ayah < totalAyat()) return gotoAyah(state.ayah + 1, true);
    if (state.repeat === "surah") return gotoAyah(1, true);
    if (state.shuffle === "surah" || state.shuffle === "both") return gotoSurah(pickRandomSurah(), 1, true, state.shuffle === "surah");
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
    a.currentTime = Math.max(0, (a.currentTime || 0) + d);
  }
  function openSurahSheet() {
    var list = (window.quranMeta && window.quranMeta.surahs) || [];
    var rows = list.map(function (s) {
      return '<button type="button" class="dqp-opt' + (Number(s.id) === state.surah ? " is-on" : "") + '" data-dqp-opt="s-' + s.id + '" data-q="' + esc((s.transliteration + " " + s.name + " " + s.id).toLowerCase()) + '"><span>' + s.id + "  " + esc(s.transliteration) + "</span><small>" + esc(s.name) + "</small></button>";
    }).join("");
    openSheet("Sūrah auswählen", '<input class="dqp-search" data-dqp-search type="search" placeholder="Suche" autocomplete="off">' + rows);
  }
  function openReciterSheet() {
    openSheet("Qāriʾ", RECITERS.map(function (r) {
      return '<button type="button" class="dqp-opt' + (r.id === state.reciter ? " is-on" : "") + '" data-dqp-opt="r-' + r.id + '">' + (r.id === state.reciter ? "✓ " : "") + esc(r.name) + "</button>";
    }).join(""));
  }
  function openMenu() {
    openSheet("Optionen", [
      '<button type="button" class="dqp-opt" data-dqp-opt="m-shuffle">Zufall · ' + esc(SHUFFLE_L[state.shuffle]) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-repeat">Wiederholen · ' + esc(REPEAT_L[state.repeat]) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-text">Text · ' + esc(TEXT_L[state.text]) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-back15">−15 Sekunden</button>',
      '<button type="button" class="dqp-opt" data-dqp-opt="m-fwd15">+15 Sekunden</button>',
      '<button type="button" class="dqp-opt" data-dqp="pick-surah">Sūrah wechseln</button>',
      '<button type="button" class="dqp-opt" data-dqp="pick-reciter">Qāriʾ wechseln</button>',
      '<button type="button" class="dqp-opt" data-dqp-opt="m-read">Sūrah lesen</button>',
      '<button type="button" class="dqp-opt" data-dqp-opt="m-stop">Wiedergabe beenden</button>'
    ].join(""));
  }
  async function onOpt(id) {
    if (id.indexOf("s-") === 0) { closeSheet(); return gotoSurah(Number(id.slice(2)), 1, state.playing, true); }
    if (id.indexOf("r-") === 0) {
      closeSheet();
      state.reciter = id.slice(2);
      state.resumeAt = audioEl().currentTime || 0;
      saveState();
      paintInfo();
      loadAudio(state.playing, true);
      return;
    }
    if (id === "m-shuffle") { closeSheet(); state.shuffle = cycle(SHUFFLE, state.shuffle); saveState(); paintChrome(); return; }
    if (id === "m-repeat") { closeSheet(); state.repeat = cycle(REPEAT, state.repeat); saveState(); paintChrome(); return; }
    if (id === "m-text") { closeSheet(); state.text = cycle(TEXT, state.text); saveState(); paintChrome(); return; }
    if (id === "m-back15") { closeSheet(); skip(-15); return; }
    if (id === "m-fwd15") { closeSheet(); skip(15); return; }
    if (id === "m-read") {
      closeSheet();
      if (typeof window.navigate === "function") window.navigate("quran-surah", String(state.surah) + "/" + state.ayah);
      return;
    }
    if (id === "m-stop") { closeSheet(); stopSession(); return; }
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
    var holdSkip = false;
    root.addEventListener("click", function (ev) {
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
        togglePlay();
        return;
      }
      if (act === "prev") { if (holdSkip) { holdSkip = false; return; } prevAyah(); return; }
      if (act === "next") { if (holdSkip) { holdSkip = false; return; } nextAyah(false); return; }
      if (act === "back15") { skip(-15); return; }
      if (act === "fwd15") { skip(15); return; }
      if (act === "retry") { state.error = ""; loadAudio(true, false); return; }
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "menu") { openMenu(); return; }
      if (act === "shuffle") { state.shuffle = cycle(SHUFFLE, state.shuffle); saveState(); paintChrome(); return; }
      if (act === "repeat") { state.repeat = cycle(REPEAT, state.repeat); saveState(); paintChrome(); return; }
      if (act === "text") { state.text = cycle(TEXT, state.text); saveState(); paintChrome(); return; }
      if (act === "pick-surah") { openSurahSheet(); return; }
      if (act === "pick-reciter") { openReciterSheet(); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    });
    root.addEventListener("input", function (ev) {
      var q = ev.target.getAttribute && ev.target.getAttribute("data-dqp-search");
      if (q == null && !(ev.target && ev.target.hasAttribute && ev.target.hasAttribute("data-dqp-search"))) return;
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
    var vol = root.querySelector("[data-dqp=vol]");
    if (vol) {
      vol.value = String(Math.round((audioEl().volume || 1) * 100));
      vol.style.setProperty("--dqp-fill", vol.value + "%");
      vol.addEventListener("input", function () {
        audioEl().volume = Number(vol.value) / 100;
        vol.style.setProperty("--dqp-fill", vol.value + "%");
      });
    }
    root.querySelectorAll("[data-dqp=prev],[data-dqp=next]").forEach(function (btn) {
      var timer = 0;
      btn.addEventListener("pointerdown", function () {
        holdSkip = false;
        timer = setTimeout(function () {
          holdSkip = true;
          skip(btn.getAttribute("data-dqp") === "prev" ? -15 : 15);
        }, 450);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        btn.addEventListener(ev, function () { clearTimeout(timer); });
      });
    });
    var sheet = root.querySelector("[data-dqp-sheet]");
    if (sheet) sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    paintChrome();
    paintProgress();
  }

  window.DARQuranPlayer = {
    render: function (value) {
      loadState({ keepLiveSession: true });
      var parts = String(value || "").split("/").filter(Boolean);
      if (parts.length) parseRoute(value);
      return renderShell();
    },
    bind: function () {
      var host = document.getElementById("darQuranPlayer");
      if (!host) { paintMini(); return; }
      if (host.dataset.ready === "1") { bind(false); paintMini(); return; }
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
        var src = String(a.currentSrc || a.getAttribute("src") || "");
        if (audioHasSrc(a) && src.indexOf(want) >= 0) {
          state.current = a.currentTime || 0;
          state.duration = a.duration || 0;
          state.playing = !a.paused;
          if (!a.paused || state.sessionActive) state.sessionActive = true;
          paintAyah(false);
          paintChrome();
          paintProgress();
        } else {
          loadAudio(!!state.sessionActive && state.playing, true);
        }
        paintMini();
      });
    },
    stop: stopSession,
    store: function () {
      return {
        isSessionActive: !!state.sessionActive,
        isPlaying: !!state.playing,
        currentSurah: state.surah,
        currentAyah: state.ayah,
        currentQari: reciterById(state.reciter).name,
        reciterId: state.reciter,
        currentPosition: state.current,
        duration: state.duration,
        textMode: state.text,
        shuffleMode: state.shuffle,
        shuffle: state.shuffle,
        repeatMode: state.repeat,
        repeat: state.repeat
      };
    }
  };

  loadState();
  function onRoutePaint() { setTimeout(paintMini, 16); }
  window.addEventListener("hashchange", onRoutePaint);
  window.addEventListener("pageshow", onRoutePaint);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") paintMini();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { paintMini(); }, { once: true });
  } else {
    paintMini();
  }
})();
