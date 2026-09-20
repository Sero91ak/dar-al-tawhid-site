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
  var LEARN_RATES = [0.75, 1, 1.25, 1.5];
  var TEXT_L = { both: "Beides", ar: "عربي", de: "Deutsch" };
  var SHUFFLE_L = { off: "Aus", surah: "Sūrah zufällig", reciter: "Rezitator zufällig", both: "Sūrah + Rezitator" };
  var REPEAT_L = { off: "Aus", ayah: "Āyah", surah: "Sūrah" };

  var state = {
    surah: 1, ayah: 1, reciter: "alafasy",
    shuffle: "off", repeat: "off", text: "both",
    playing: false, sessionActive: false, duration: 0, current: 0, resumeAt: 0,
    loading: true, error: "", layer: 0, textScale: 7, volume: 1,
    learnMode: false, learnLoop: true, learnStay: true, learnRate: 1
  };
  var sleepUntil = 0;
  var sleepWatch = 0;
  var leaveLock = false;
  var verses = [];
  var meta = null;
  var seekLock = false;
  var urlIndex = 0;
  var lastSurahs = [];
  var saveTimer = 0;
  var capsuleCollapsed = false;
  var capsuleDimmed = false;
  var volGain = null;
  var volCtx = null;
  var volSrc = null;
  var volNativeOk = null;
  var tadCache = Object.create(null);

  function probeVolume() {
    if (volNativeOk != null) return volNativeOk;
    var a = audioEl();
    try {
      var prev = a.volume;
      a.volume = 0.41;
      volNativeOk = Math.abs(a.volume - 0.41) < 0.08;
      a.volume = prev;
    } catch (e) { volNativeOk = false; }
    return volNativeOk;
  }
  function applyVolume() {
    var v = Math.max(0, Math.min(1, Number(state.volume)));
    if (!isFinite(v)) v = 1;
    state.volume = v;
    var a = audioEl();
    a.muted = v <= 0.001;
    try { a.volume = v; } catch (e) {}
    try {
      if (!volSrc) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          volCtx = volCtx || new AC();
          volGain = volCtx.createGain();
          volSrc = volCtx.createMediaElementSource(a);
          volSrc.connect(volGain);
          volGain.connect(volCtx.destination);
        }
      }
      if (volGain) volGain.gain.value = v;
      if (volCtx && volCtx.state === "suspended") volCtx.resume().catch(function () {});
    } catch (e2) {
      volSrc = volSrc || null;
    }
    var nativeOk = false;
    try { nativeOk = Math.abs((a.volume || 0) - v) < 0.08 || v >= 0.97; } catch (e3) {}
    var track = document.querySelector("#darQuranPlayer [data-dqp-vol-track]");
    var fillPct = (v * 100) + "%";
    if (track) track.style.setProperty("--dqp-fill", fillPct);
    var vol = document.querySelector("#darQuranPlayer [data-dqp=vol]");
    if (vol) {
      vol.value = String(Math.round(v * 100));
      vol.style.setProperty("--dqp-fill", fillPct);
    }
    var hint = document.querySelector("[data-dqp-vol-hint]");
    if (hint) {
      var ok = nativeOk || !!volGain;
      hint.hidden = ok;
      if (!ok) hint.textContent = "Lautstärke über die Gerätetasten. Dieser Browser gibt die Wiedergabelautstärke nicht frei.";
    }
  }
  function setTextScale(n) {
    state.textScale = Math.max(1, Math.min(10, Math.round(Number(n) || 7)));
    saveState();
    var el = document.querySelector("#darQuranPlayer [data-dqp-ayah]");
    if (el) fitAyah(el);
    var lab = document.querySelector("[data-dqp-scale-n]");
    if (lab) lab.textContent = String(state.textScale);
    var sl = document.querySelector("[data-dqp=text-scale]");
    if (sl) {
      sl.value = String(state.textScale);
      sl.style.setProperty("--dqp-fill", ((state.textScale - 1) / 9 * 100) + "%");
    }
  }

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
      if (raw.textScaleFit === 1 && Number(raw.textScale) >= 1 && Number(raw.textScale) <= 10) {
        state.textScale = Math.round(Number(raw.textScale));
      } else {
        state.textScale = 7;
      }
      if (Number(raw.volume) >= 0 && Number(raw.volume) <= 1) state.volume = Number(raw.volume);
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
        textScale: state.textScale, textScaleFit: 1, volume: state.volume,
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
    a.addEventListener("play", function () { state.playing = true; state.sessionActive = true; applyVolume(); applyLearnRate(); saveState(); paintChrome(); paintMini(); markPlayingAyah(); });
    a.addEventListener("pause", function () {
      state.playing = false;
      saveState();
      paintChrome();
      paintMini();
      markPlayingAyah();
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
    applyLearnRate();
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
    if (sleepUntil && Date.now() >= sleepUntil) fireSleepTimer();
  }
  function onMeta() {
    state.duration = audioEl().duration || 0;
    paintProgress();
  }
  async function onEnded() {
    if (state.learnMode && state.learnLoop) {
      var a = audioEl();
      a.currentTime = 0;
      applyLearnRate();
      a.play().catch(function () {});
      return;
    }
    if (state.learnMode && state.learnStay) {
      state.playing = false;
      paintChrome();
      paintMini();
      return;
    }
    if (state.repeat === "ayah") {
      audioEl().currentTime = 0;
      audioEl().play().catch(function () {});
      return;
    }
    await nextAyah(true);
  }
  function isReaderRoute() {
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    return hash.split("/")[0] === "quran-surah"
      || (document.body && document.body.classList.contains("is-quran-reader-route"));
  }
  function applyLearnRate() {
    var rate = state.learnMode ? (Number(state.learnRate) || 1) : 1;
    try { audioEl().playbackRate = rate; } catch (e) {}
  }
  function exitLearnMode(keepPlaying) {
    if (!state.learnMode) {
      applyLearnChrome();
      return;
    }
    state.learnMode = false;
    state.learnLoop = false;
    state.learnStay = false;
    state.learnRate = 1;
    applyLearnRate();
    applyLearnChrome();
    markPlayingAyah();
    if (!keepPlaying) paintMini();
    else paintMini();
  }
  function applyLearnChrome() {
    var html = document.documentElement;
    var body = document.body;
    var onLearn = !!state.learnMode && isReaderRoute();
    var onDock = isReaderRoute() && !!state.sessionActive && !isFullPlayerRoute();
    html.classList.toggle("player-learn", onLearn);
    html.classList.toggle("player-reader-dock", onDock);
    if (body) {
      body.classList.toggle("player-learn", onLearn);
      body.classList.toggle("player-reader-dock", onDock);
    }
    var el = document.getElementById("darQuranMiniPlayer");
    if (el) {
      el.classList.toggle("is-learn", onLearn);
      el.classList.toggle("is-reader-dock", onDock);
    }
  }
  function markPlayingAyah() {
    document.querySelectorAll(".quran-ayah.is-dqp-playing").forEach(function (n) {
      n.classList.remove("is-dqp-playing");
    });
    document.querySelectorAll("[data-qrc-ayah-play].is-on").forEach(function (n) {
      n.classList.remove("is-on");
    });
    if (!state.sessionActive) return;
    var node = document.getElementById("ayah-" + state.ayah);
    if (node) node.classList.add("is-dqp-playing");
    var btn = document.querySelector('[data-qrc-ayah-play="' + state.surah + ":" + state.ayah + '"]');
    if (btn && state.playing) btn.classList.add("is-on");
  }
  function syncLearnFromRoute() {
    if (state.learnMode && !isReaderRoute()) exitLearnMode(true);
    else applyLearnChrome();
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
    loadTadForSurah(state.surah);
  }
  function parseRoute(value) {
    var parts = String(value || "").split("/").filter(Boolean);
    var s = Number(parts[0]);
    var a = Number(parts[1]);
    if (s >= 1 && s <= 114) state.surah = s;
    if (a >= 1) state.ayah = a;
  }
  function writeHash() {
    if (isReaderRoute() || (state.learnMode && !isFullPlayerRoute())) return;
    var next = "#quran-player/" + state.surah + "/" + state.ayah;
    if (location.hash !== next) {
      try { history.replaceState(null, "", location.pathname + (location.search || "") + next); } catch (e) {}
    }
  }
  function enterLearnMode() {
    state.learnMode = true;
    state.learnLoop = true;
    state.learnStay = true;
    if (LEARN_RATES.indexOf(Number(state.learnRate)) < 0) state.learnRate = 1;
    applyLearnRate();
    applyLearnChrome();
  }
  async function playFromReader(surah, ayah) {
    surah = Number(surah);
    ayah = Number(ayah);
    if (!(surah >= 1 && surah <= 114) || !(ayah >= 1)) return;
    enterLearnMode();
    state.sessionActive = true;
    var a = audioEl();
    var same = state.surah === surah && state.ayah === ayah && audioHasSrc(a);
    if (same) {
      togglePlay();
      applyLearnRate();
      paintMini();
      markPlayingAyah();
      return;
    }
    state.surah = surah;
    state.ayah = ayah;
    state.resumeAt = 0;
    saveState();
    await ensureData();
    loadAudio(true, false);
    paintMini();
    markPlayingAyah();
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
      reciter: '<circle cx="12" cy="8.2" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.4 19c.9-3 2.9-4.6 5.6-4.6s4.7 1.6 5.6 4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
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
            '<div class="dqp-ayah-tad" data-tad hidden></div>' +
            '<div class="dqp-status">Wird geladen …</div>' +
          "</div>" +
        "</div>" +
        '<div class="dqp-meta">' +
          '<button type="button" class="dqp-title" data-dqp="pick-surah">—</button>' +
          '<button type="button" class="dqp-more" data-dqp="menu" aria-label="Optionen">' + icon("more") + "</button>" +
          '<button type="button" class="dqp-artist" data-dqp="pick-reciter">—</button>' +
        "</div>" +
        '<section class="dqp-progress">' +
          '<div class="dqp-track" data-dqp-seek-track>' +
            '<span class="dqp-groove" aria-hidden="true"></span>' +
            '<span class="dqp-fill" aria-hidden="true"></span>' +
            '<input class="dqp-range" data-dqp="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
          "</div>" +
          '<div class="dqp-times"><span data-dqp-cur>––:––</span><span data-dqp-dur>––:––</span></div>' +
        "</section>" +
        '<div class="dqp-controls">' +
          '<button class="dqp-skip" type="button" data-dqp="prev" aria-label="Vorige Āyah">' + icon("prev") + "</button>" +
          '<button class="dqp-play" type="button" data-dqp="play" aria-label="Wiedergabe">' + icon("play") + "</button>" +
          '<button class="dqp-skip" type="button" data-dqp="next" aria-label="Nächste Āyah">' + icon("next") + "</button>" +
        "</div>" +
        '<div class="dqp-volume">' +
          icon("volmin") +
          '<div class="dqp-track" data-dqp-vol-track>' +
            '<span class="dqp-groove" aria-hidden="true"></span>' +
            '<span class="dqp-fill" aria-hidden="true"></span>' +
            '<input class="dqp-range" data-dqp="vol" type="range" min="0" max="100" value="100" aria-label="Lautstärke">' +
          "</div>" +
          icon("volmax") +
          '<p class="dqp-vol-note" data-dqp-vol-hint hidden></p>' +
        "</div>" +
        '<div class="dqp-dock">' +
          '<button type="button" data-dqp="text" aria-label="Textmodus">' + icon("lyrics") + "</button>" +
          '<button type="button" data-dqp="pick-reciter" aria-label="Qāriʾ wählen">' + icon("reciter") + "</button>" +
          '<button type="button" data-dqp="pick-surah" aria-label="Sūrah wählen">' + icon("queue") + "</button>" +
        "</div>" +
        '<div class="dqp-sheet" data-dqp-sheet hidden></div>' +
      "</div>"
    );
  }
  function paintAyah(animate) {
    var root = playerRoot();
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
      paintTad(el);
      el.classList.remove("is-leave", "is-enter");
      fitAyah(el);
      paintError();
      loadTadForSurah(state.surah).then(function () {
        paintTad(el);
        fitAyah(el);
      });
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
  function isPlaceholderTad(text) {
    var t = String(text || "");
    return /erklärt diese Ayah im Zusammenhang|deutsche Übertragung ergänzt|fasst den Sinn dieser Ayah|bereitet den Leser auf|gehört zum mekkanischen Offenbarungskorpus|kein gesondertes Marfuʿ|sobald der geprüfte Text vorliegt/i.test(t);
  }
  function normTad(s) {
    return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function pickTafsirLine(entry) {
    var rows = Array.isArray(entry && entry.tafsir) ? entry.tafsir : [];
    var i;
    for (i = 0; i < rows.length; i++) {
      var tx = String((rows[i] && rows[i].text) || "").trim();
      if (!tx || isPlaceholderTad(tx)) continue;
      var src = String((rows[i] && rows[i].source) || "").trim();
      return { source: src || "Tafsīr", text: tx };
    }
    return null;
  }
  function pickAtharLines(atharEntry) {
    var rows = Array.isArray(atharEntry && atharEntry.athar) ? atharEntry.athar : [];
    var out = [];
    var seen = {};
    var i;
    for (i = 0; i < rows.length && out.length < 2; i++) {
      var tx = String((rows[i] && rows[i].text) || "").replace(/^\s*\.\.\.\s*/, "").trim();
      if (!tx || isPlaceholderTad(tx)) continue;
      var key = normTad(tx).slice(0, 80);
      if (seen[key]) continue;
      seen[key] = 1;
      var who = String((rows[i] && (rows[i].person || rows[i].name)) || "").trim();
      var src = String((rows[i] && rows[i].source) || "").trim();
      if (/tabari/i.test(src)) src = "Tafsīr aṭ-Ṭabarī";
      out.push({ source: [who, src].filter(Boolean).join(" · "), text: tx });
    }
    return out;
  }
  function tadPlain(pack) {
    pack = pack || {};
    var de = "";
    var v = verseAt(state.ayah);
    if (v) de = String(v.de || v.translation || "").trim();
    var tafsirEntry = pack.tafsirEntry || null;
    var meaning = String((tafsirEntry && tafsirEntry.meaning) || "").trim();
    var lines = [];
    var tafsirLine = pickTafsirLine(tafsirEntry);
    if (tafsirLine) lines.push(tafsirLine);
    pickAtharLines(pack.atharEntry).forEach(function (row) { lines.push(row); });
    var deN = normTad(de);
    var meaningN = normTad(meaning);
    if (meaning && meaningN !== deN && meaningN.indexOf(deN) !== 0 && deN.indexOf(meaningN) !== 0) {
      lines.unshift({ source: "", text: meaning });
    }
    var parts = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      var row = lines[i];
      var body = String(row.text || "").trim();
      if (!body) continue;
      if (deN && normTad(body) === deN) continue;
      if (row.source) parts.push(row.source + "\n" + body);
      else parts.push(body);
    }
    var tad = parts.join("\n\n").trim();
    if (tad.length > 780) tad = tad.slice(0, 760).replace(/\s+\S*$/, "") + " …";
    return tad;
  }
  function loadTadForSurah(surah) {
    surah = Number(surah);
    if (!(surah >= 1 && surah <= 114)) return Promise.resolve(null);
    if (tadCache[surah] && tadCache[surah].ready) return Promise.resolve(tadCache[surah]);
    var jobs = [];
    if (typeof window.loadTafsirSurah === "function") jobs.push(window.loadTafsirSurah(surah).catch(function () { return null; }));
    else jobs.push(Promise.resolve(null));
    if (typeof window.loadQuranAtharSurah === "function") jobs.push(window.loadQuranAtharSurah(surah).catch(function () { return null; }));
    else jobs.push(Promise.resolve(null));
    return Promise.all(jobs).then(function (docs) {
      tadCache[surah] = { ready: true, tafsir: docs[0] || null, athar: docs[1] || null };
      return tadCache[surah];
    });
  }
  function packForAyah(surah, ayah) {
    var pack = tadCache[surah] || {};
    var tafsirEntry = null;
    var atharEntry = null;
    if (typeof window.ayahTafsirEntry === "function") tafsirEntry = window.ayahTafsirEntry(pack.tafsir, ayah);
    else if (pack.tafsir && pack.tafsir.verses && typeof pack.tafsir.verses.get === "function") tafsirEntry = pack.tafsir.verses.get(Number(ayah));
    if (typeof window.ayahAtharEntry === "function") atharEntry = window.ayahAtharEntry(pack.athar, ayah);
    else if (pack.athar && pack.athar.verses && typeof pack.athar.verses.get === "function") atharEntry = pack.athar.verses.get(Number(ayah));
    return { tafsirEntry: tafsirEntry, atharEntry: atharEntry };
  }
  function paintTad(el) {
    if (!el) return;
    var tadEl = el.querySelector("[data-tad]");
    if (!tadEl) return;
    var text = tadPlain(packForAyah(state.surah, state.ayah));
    tadEl.hidden = !text;
    tadEl.textContent = text ? ("Taddabur\n" + text) : "";
  }
  function fitAyah(el) {
    var ar = el.querySelector(".dqp-ayah-ar");
    var de = el.querySelector(".dqp-ayah-de");
    var tad = el.querySelector("[data-tad]");
    if (!ar) return;
    var box = el.parentElement;
    var scale = Number(state.textScale) || 7;
    var prefer = 15 + scale * 2.55;
    if (state.text === "ar") prefer += 3;
    if (state.text === "de") prefer += 1;
    var n = (ar.textContent || "").length + ((de && state.text !== "ar" ? de.textContent : "") || "").length * 0.72;
    if (n > 420) prefer *= 0.82;
    else if (n > 240) prefer *= 0.9;
    var deRatio = state.text === "de" ? 0.92 : 0.76;
    var tadPx = function (px) { return Math.max(12, Math.round(px * 0.42)); };
    var applyPx = function (px) {
      ar.style.lineHeight = px > 28 ? "1.62" : "1.48";
      ar.style.fontSize = px + "px";
      if (de) {
        de.style.fontSize = Math.max(13, Math.round(px * deRatio)) + "px";
        de.style.lineHeight = "1.45";
      }
      if (tad) {
        tad.style.fontSize = tadPx(px) + "px";
        tad.style.lineHeight = "1.4";
      }
    };
    var px = Math.round(prefer);
    var minPx = 14;
    var maxPx = Math.round(15 + scale * 3.1);
    applyPx(px);
    if (!box || box.clientHeight < 40) return;
    var room = box.clientHeight - 8;
    var guard = 0;
    while (el.scrollHeight < room * 0.7 && px < maxPx && guard < 22) {
      px += 1;
      applyPx(px);
      guard += 1;
    }
    guard = 0;
    while (el.scrollHeight > room && px > minPx && guard < 40) {
      px -= 1;
      applyPx(px);
      guard += 1;
    }
    el.style.justifyContent = el.scrollHeight > room ? "flex-start" : "center";
  }
  function paintStatus() {
    var el = document.querySelector("#darQuranPlayer .dqp-status");
    if (el) el.textContent = state.loading ? "Sūrah wird geladen …" : "";
  }
  function paintError() {
    var root = playerRoot();
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
    var root = playerRoot();
    if (!root) return;
    var m = meta || {};
    var lat = root.querySelector(".dqp-title");
    var q = root.querySelector(".dqp-artist");
    if (lat) lat.textContent = m.transliteration
      ? ("Sūrah " + m.transliteration + " · Āyah " + state.ayah)
      : ("Āyah " + state.ayah);
    if (q) q.textContent = reciterById(state.reciter).name;
    syncMediaSession();
  }
  function paintMiniProgress() {
    var el = document.getElementById("darQuranMiniPlayer");
    if (!el) return;
    var pct = state.duration ? Math.max(0, Math.min(1, state.current / state.duration)) : 0;
    var cur = el.querySelector("[data-dqp-mini-cur]");
    var dur = el.querySelector("[data-dqp-mini-dur]");
    var sl = el.querySelector("[data-dqp-mini=seek]");
    if (cur) cur.textContent = fmt(state.current);
    if (dur) dur.textContent = fmt(state.duration || 0);
    var fillPct = (pct * 100) + "%";
    var track = el.querySelector(".dqp-top-track");
    if (track) track.style.setProperty("--dqp-fill", fillPct);
    if (sl && !seekLock) {
      sl.value = String(Math.round(pct * 1000));
      sl.style.setProperty("--dqp-fill", fillPct);
    }
  }
  function paintProgress() {
    var root = playerRoot();
    if (root) {
      var cur = root.querySelector("[data-dqp-cur]");
      var dur = root.querySelector("[data-dqp-dur]");
      var n = root.querySelector("[data-dqp-n]");
      var sl = root.querySelector("[data-dqp=seek]");
      var ready = state.duration && isFinite(state.duration) && state.duration > 0;
      if (cur) cur.textContent = ready ? fmt(state.current) : "––:––";
      if (dur) dur.textContent = ready ? ("-" + fmt(Math.max(0, state.duration - (state.current || 0)))) : "––:––";
      if (n) n.textContent = "Āyah " + state.ayah + " / " + totalAyat();
      if (sl) {
        var pct = ready ? (state.current / state.duration) * 1000 : 0;
        if (!seekLock) sl.value = String(Math.round(pct));
        var fillPct = ready ? ((state.current / state.duration) * 100) + "%" : "0%";
        sl.style.setProperty("--dqp-fill", fillPct);
        var track = root.querySelector("[data-dqp-seek-track]");
        if (track) track.style.setProperty("--dqp-fill", fillPct);
      }
    }
    paintMiniProgress();
  }
  function paintChrome() {
    var root = playerRoot();
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
      applyVolume();
      var ayah = root.querySelector("[data-dqp-ayah]");
      if (ayah) fitAyah(ayah);
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
  function playerRoot() {
    var nodes = document.querySelectorAll("#darQuranPlayer");
    var bodyOne = null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode === document.body) bodyOne = nodes[i];
    }
    if (bodyOne) {
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j] !== bodyOne) {
          try { nodes[j].remove(); } catch (e) {}
        }
      }
      return bodyOne;
    }
    return nodes[0] || null;
  }
  function navigateApp(view, value) {
    if (typeof window.navigate === "function") window.navigate(view, value || "", { noAnim: true });
    else location.hash = "#" + view + (value ? "/" + value : "");
  }
  function leavePlayerRoute(kind) {
    function go() {
      if (kind === "read") navigateApp("quran-surah", String(state.surah) + "/" + state.ayah);
      else navigateApp("home");
      setTimeout(function () {
        if (kind !== "read" && isFullPlayerRoute()) navigateApp("home");
        paintMini();
      }, 40);
    }
    var root = playerRoot();
    if (!root || !isFullPlayerRoute()) {
      leaveLock = false;
      go();
      return;
    }
    if (leaveLock) {
      go();
      return;
    }
    leaveLock = true;
    root.classList.add("is-leaving");
    go();
    setTimeout(function () {
      if (root) {
        root.classList.remove("is-leaving");
        if (!isFullPlayerRoute()) root.hidden = true;
      }
      leaveLock = false;
      paintMini();
    }, 280);
  }
  function sleepLabel() {
    if (!sleepUntil) return "Sleep-Timer";
    var s = Math.max(0, Math.round((sleepUntil - Date.now()) / 1000));
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return "Sleep-Timer · " + mm + ":" + String(ss).padStart(2, "0");
  }
  function clearSleepTimer() {
    sleepUntil = 0;
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
  }
  function fireSleepTimer() {
    if (!sleepUntil) return;
    sleepUntil = 0;
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
    stopSession();
    if (isFullPlayerRoute()) leavePlayerRoute("home");
  }
  function armSleepTimer(ms) {
    ms = Math.max(0, Number(ms) || 0);
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
    if (ms < 1000) {
      sleepUntil = 0;
      return;
    }
    sleepUntil = Date.now() + ms;
    sleepWatch = setInterval(function () {
      if (!sleepUntil) {
        clearInterval(sleepWatch);
        sleepWatch = 0;
        return;
      }
      if (Date.now() >= sleepUntil) fireSleepTimer();
    }, 1000);
  }
  function setSleepMinutes(mins) {
    armSleepTimer(Math.max(0, Number(mins) || 0) * 60000);
  }
  function slotEl() {
    var s = document.getElementById("darQuranPlayerSlot");
    if (!s) {
      s = document.createElement("div");
      s.id = "darQuranPlayerSlot";
      s.setAttribute("aria-hidden", "true");
    }
    if (document.body && s.parentNode !== document.body) {
      var app = document.querySelector(".app");
      if (app && app.parentNode === document.body) document.body.insertBefore(s, app);
      else document.body.insertBefore(s, document.body.firstChild);
    }
    return s;
  }
  function applyCapsuleMode() {
    var html = document.documentElement;
    var body = document.body;
    var el = document.getElementById("darQuranMiniPlayer");
    var show = !!state.sessionActive && !isFullPlayerRoute();
    if (isReaderRoute()) {
      capsuleCollapsed = false;
      capsuleDimmed = false;
    }
    var collapsed = show && capsuleCollapsed;
    var expanded = show && !capsuleCollapsed;
    html.classList.toggle("player-active", !!state.sessionActive);
    html.classList.toggle("player-expanded", expanded);
    html.classList.toggle("player-collapsed", collapsed);
    html.classList.toggle("player-stopped", !state.sessionActive);
    html.classList.toggle("dar-quran-top-capsule-on", show);
    if (body) {
      body.classList.toggle("player-active", !!state.sessionActive);
      body.classList.toggle("player-expanded", expanded);
      body.classList.toggle("player-collapsed", collapsed);
      body.classList.toggle("player-stopped", !state.sessionActive);
      body.classList.toggle("dar-quran-top-capsule-on", show);
    }
    if (el) {
      el.classList.toggle("player-expanded", expanded);
      el.classList.toggle("player-collapsed", collapsed);
      el.classList.toggle("player-dim", show && capsuleDimmed);
      el.classList.remove("is-away");
    }
    html.classList.toggle("player-dim", show && capsuleDimmed);
    if (body) body.classList.toggle("player-dim", show && capsuleDimmed);
    applyLearnChrome();
  }
  function setPlayerDim() {
    capsuleDimmed = false;
    applyCapsuleMode();
  }
  function setCapsuleCollapsed() {
    capsuleCollapsed = false;
    applyCapsuleMode();
  }
  function bindScrollAway() {
    if (window.__dqpScrollAwayBound) return;
    window.__dqpScrollAwayBound = true;
    var lastY = 0;
    var ticking = false;
    var pendingY = 0;
    function readY(target) {
      if (target && target !== document && target !== window && typeof target.scrollTop === "number") {
        return target.scrollTop || 0;
      }
      return window.scrollY || document.documentElement.scrollTop || 0;
    }
    function onFrame() {
      ticking = false;
      if (!state.sessionActive || isFullPlayerRoute()) {
        setCapsuleCollapsed(false);
        setPlayerDim(false);
        return;
      }
      var y = pendingY;
      var dy = y - lastY;
      setCapsuleCollapsed(false);
      if (y < 24 || dy < -8) setPlayerDim(false);
      else if (dy > 6 && y > 14) setPlayerDim(true);
      lastY = y;
    }
    function onScroll(ev) {
      if (ev && ev.target && ev.target.closest && ev.target.closest("#darQuranMiniPlayer")) return;
      pendingY = readY(ev && ev.target);
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onFrame);
    }
    lastY = readY(window);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("touchmove", onScroll, { passive: true, capture: true });
    var view = document.getElementById("appView");
    if (view) view.addEventListener("scroll", onScroll, { passive: true });
  }
  function setPlayerLayout(showOval) {
    slotEl();
    if (!showOval) capsuleCollapsed = false;
    applyCapsuleMode();
    bindScrollAway();
  }
  function openFullPlayer() {
    var value = String(state.surah) + "/" + String(state.ayah);
    if (typeof window.navigate === "function") window.navigate("quran-player", value, { noAnim: true });
    else location.hash = "#quran-player/" + value;
    setTimeout(paintMini, 30);
  }
  function togglePlay(forcePlay) {
    state.sessionActive = true;
    saveState();
    applyVolume();
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
    capsuleCollapsed = false;
    capsuleDimmed = false;
    clearSleepTimer();
    state.learnMode = false;
    state.learnLoop = false;
    state.learnStay = false;
    state.learnRate = 1;
    var mini = document.getElementById("darQuranMiniPlayer");
    if (mini) mini.classList.remove("is-away", "player-collapsed", "player-expanded", "player-dim", "is-learn", "is-reader-dock");
    syncMediaSession();
    paintChrome();
    paintMini();
  }
  function bindMiniChrome(el) {
    if (el.dataset.dqpMiniBound === "1") return;
    el.dataset.dqpMiniBound = "1";
    el.addEventListener("pointerdown", function () { setPlayerDim(false); });
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target.closest("[data-dqp-mini]");
      var act = t ? t.getAttribute("data-dqp-mini") : "";
      if (act === "play") { e.preventDefault(); togglePlay(true); return; }
      if (act === "pause") { e.preventDefault(); audioEl().pause(); return; }
      if (act === "stop") { e.preventDefault(); stopSession(); return; }
      if (act === "learn-loop") {
        e.preventDefault();
        state.learnLoop = !state.learnLoop;
        paintMini();
        return;
      }
      if (act === "learn-stay") {
        e.preventDefault();
        state.learnStay = !state.learnStay;
        paintMini();
        return;
      }
      if (act === "learn-rate") {
        e.preventDefault();
        var i = LEARN_RATES.indexOf(Number(state.learnRate));
        state.learnRate = LEARN_RATES[(i + 1) % LEARN_RATES.length];
        applyLearnRate();
        paintMini();
        return;
      }
      if (act === "seek" || act === "learn-loop" || act === "learn-stay" || act === "learn-rate") return;
      if (state.learnMode || isReaderRoute()) return;
      openFullPlayer();
    });
    var playBtn = el.querySelector("[data-dqp-mini=play]");
    var pauseBtn = el.querySelector("[data-dqp-mini=pause]");
    var stopBtn = el.querySelector("[data-dqp-mini=stop]");
    if (playBtn) {
      playBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        togglePlay(true);
      });
    }
    if (pauseBtn) {
      pauseBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        audioEl().pause();
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        stopSession();
      });
    }
    var range = el.querySelector("[data-dqp-mini=seek]");
    if (range) {
      range.addEventListener("pointerdown", function (e) { e.stopPropagation(); seekLock = true; });
      range.addEventListener("click", function (e) { e.stopPropagation(); });
      range.addEventListener("input", function () {
        seekLock = true;
        var a = audioEl();
        if (a.duration) a.currentTime = (Number(range.value) / 1000) * a.duration;
        state.current = a.currentTime || 0;
        var fillPct = (Number(range.value) / 10) + "%";
        range.style.setProperty("--dqp-fill", fillPct);
        var track = el.querySelector(".dqp-top-track");
        if (track) track.style.setProperty("--dqp-fill", fillPct);
        var cur = el.querySelector("[data-dqp-mini-cur]");
        if (cur) cur.textContent = fmt(state.current);
      });
      range.addEventListener("change", function () { seekLock = false; saveState(); });
    }
  }
  function miniMarkup() {
    return (
      '<div class="dqp-top-main">' +
        '<span class="dqp-top-mark" aria-hidden="true">📖</span>' +
        '<button type="button" data-dqp-mini="open" class="dqp-top-open">' +
          '<span class="dqp-top-text"><b></b><span></span></span>' +
        "</button>" +
        '<div class="dqp-top-actions">' +
          '<button type="button" class="dqp-top-ctrl" data-dqp-mini="play" aria-label="Wiedergabe"></button>' +
          '<button type="button" class="dqp-top-ctrl dqp-top-pause" data-dqp-mini="pause" aria-label="Pause"></button>' +
          '<button type="button" class="dqp-top-ctrl dqp-top-stop" data-dqp-mini="stop" aria-label="Stopp"></button>' +
        "</div>" +
      "</div>" +
      '<div class="dqp-top-seek">' +
        '<span class="dqp-top-time" data-dqp-mini-cur>00:00</span>' +
        '<div class="dqp-top-track">' +
          '<span class="dqp-top-groove" aria-hidden="true"></span>' +
          '<span class="dqp-top-fill" aria-hidden="true"></span>' +
          '<input class="dqp-top-range" data-dqp-mini="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
        "</div>" +
        '<span class="dqp-top-time" data-dqp-mini-dur>00:00</span>' +
      "</div>" +
      '<div class="dqp-learn" data-dqp-learn hidden>' +
        '<button type="button" class="dqp-learn-btn" data-dqp-mini="learn-loop" aria-pressed="true" aria-label="Āyah wiederholen">⟳</button>' +
        '<button type="button" class="dqp-learn-btn" data-dqp-mini="learn-stay" aria-pressed="true" aria-label="Bei der Āyah bleiben">◉</button>' +
        '<button type="button" class="dqp-learn-btn dqp-learn-rate" data-dqp-mini="learn-rate" aria-label="Tempo">1×</button>' +
      "</div>"
    );
  }
  function miniEl() {
    var el = document.getElementById("darQuranMiniPlayer");
    if (!el) {
      el = document.createElement("div");
      el.id = "darQuranMiniPlayer";
      el.setAttribute("data-size", "normal");
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Qurʾān Wiedergabe");
    }
    if (!el.querySelector(".dqp-top-track") || !el.querySelector("[data-dqp-mini=seek]") || !el.querySelector("[data-dqp-learn]") || !el.querySelector("[data-dqp-mini=pause]")) {
      el.innerHTML = miniMarkup();
      el.dataset.dqpMiniBound = "";
    }
    bindMiniChrome(el);
    if (document.body && el.parentNode !== document.body) document.body.appendChild(el);
    bindScrollAway();
    return el;
  }
  function paintMini() {
    var el = miniEl();
    var onFull = isFullPlayerRoute();
    var page = playerRoot();
    if (onFull) mountPlayerPage(page);
    else if (page && page.parentNode === document.body) page.hidden = true;
    var show = !!state.sessionActive && !onFull;
    el.classList.toggle("is-on", show);
    el.setAttribute("aria-hidden", show ? "false" : "true");
    setPlayerLayout(show);
    var m = meta || surahMeta(state.surah) || {};
    var latin = m.transliteration ? ("Sūrah " + m.transliteration) : "Qurʾān";
    var b = el.querySelector(".dqp-top-text b");
    var s = el.querySelector(".dqp-top-text span");
    var p = el.querySelector("[data-dqp-mini=play]");
    var pa = el.querySelector("[data-dqp-mini=pause]");
    var st = el.querySelector("[data-dqp-mini=stop]");
    if (b) b.textContent = latin + " · Āyah " + state.ayah;
    if (s) s.textContent = reciterById(state.reciter).name;
    if (p) {
      p.innerHTML = icon("play");
      p.setAttribute("aria-label", "Wiedergabe");
      p.classList.toggle("is-on", !state.playing && !!state.sessionActive);
    }
    if (pa) {
      pa.innerHTML = icon("pause");
      pa.setAttribute("aria-label", "Pause");
      pa.classList.toggle("is-on", !!state.playing);
    }
    if (st) st.innerHTML = icon("stop");
    applyLearnChrome();
    var learn = el.querySelector("[data-dqp-learn]");
    var loopBtn = el.querySelector("[data-dqp-mini=learn-loop]");
    var stayBtn = el.querySelector("[data-dqp-mini=learn-stay]");
    var rateBtn = el.querySelector("[data-dqp-mini=learn-rate]");
    if (learn) learn.hidden = !(state.learnMode && isReaderRoute());
    if (loopBtn) {
      loopBtn.classList.toggle("is-on", !!state.learnLoop);
      loopBtn.setAttribute("aria-pressed", state.learnLoop ? "true" : "false");
    }
    if (stayBtn) {
      stayBtn.classList.toggle("is-on", !!state.learnStay);
      stayBtn.setAttribute("aria-pressed", state.learnStay ? "true" : "false");
    }
    if (rateBtn) {
      var rate = Number(state.learnRate) || 1;
      rateBtn.textContent = String(rate).replace(/\.00$/, "") + "×";
      rateBtn.classList.toggle("is-on", rate !== 1);
    }
    if (b && state.learnMode && isReaderRoute()) {
      b.textContent = "Lernen · Āyah " + state.ayah;
    }
    markPlayingAyah();
    paintMiniProgress();
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
      '<div class="dqp-text-panel">',
      '<div class="dqp-text-label">Textanzeige</div>',
      '<div class="dqp-text-modes">',
      '<button type="button" class="dqp-opt-chip' + (state.text === "ar" ? " is-on" : "") + '" data-dqp-opt="m-text-ar">Arabisch</button>',
      '<button type="button" class="dqp-opt-chip' + (state.text === "de" ? " is-on" : "") + '" data-dqp-opt="m-text-de">Deutsch</button>',
      '<button type="button" class="dqp-opt-chip' + (state.text === "both" ? " is-on" : "") + '" data-dqp-opt="m-text-both">Beides</button>',
      "</div>",
      '<div class="dqp-text-label">Textgröße · Stufe <span data-dqp-scale-n>' + state.textScale + "</span> / 10</div>",
      '<div class="dqp-scale-row">',
      '<button type="button" data-dqp-opt="m-scale-minus" aria-label="Kleiner">−</button>',
      '<input class="dqp-vol" data-dqp="text-scale" type="range" min="1" max="10" step="1" value="' + state.textScale + '" aria-label="Textgröße">',
      '<button type="button" data-dqp-opt="m-scale-plus" aria-label="Größer">+</button>',
      "</div></div>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-shuffle">Zufall · ' + esc(SHUFFLE_L[state.shuffle]) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-repeat">Wiederholen · ' + esc(REPEAT_L[state.repeat]) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp-opt="m-sleep">' + esc(sleepLabel()) + "</button>",
      '<button type="button" class="dqp-opt" data-dqp="pick-surah">Sūrah wechseln</button>',
      '<button type="button" class="dqp-opt" data-dqp="pick-reciter">Qāriʾ wechseln</button>',
      '<button type="button" class="dqp-opt" data-dqp-opt="m-read">Sūrah lesen</button>',
      '<button type="button" class="dqp-opt" data-dqp-opt="m-stop">Wiedergabe beenden</button>'
    ].join(""));
    var sl = document.querySelector("[data-dqp=text-scale]");
    if (sl) sl.style.setProperty("--dqp-fill", ((state.textScale - 1) / 9 * 100) + "%");
  }
  function openSleepSheet() {
    var presets = [5, 10, 15, 20, 30, 40];
    var left = sleepUntil ? Math.max(0, sleepUntil - Date.now()) : 0;
    openSheet("Sleep-Timer", [
      '<div class="dqp-text-panel">',
      '<div class="dqp-text-label">Wiedergabe beenden nach</div>',
      '<div class="dqp-sleep-presets">',
      presets.map(function (m) {
        return '<button type="button" class="dqp-opt-chip" data-dqp-opt="sleep-' + m + '">' + m + " Min</button>";
      }).join(""),
      "</div>",
      '<div class="dqp-text-label">Eigene Zeit</div>',
      '<div class="dqp-sleep-custom">',
      '<label>Stunden<input class="dqp-sleep-num" data-dqp-sleep-h type="number" min="0" max="12" step="1" value="0" inputmode="numeric"></label>',
      '<label>Minuten<input class="dqp-sleep-num" data-dqp-sleep-m type="number" min="0" max="59" step="1" value="0" inputmode="numeric"></label>',
      '<button type="button" class="dqp-opt-chip is-on" data-dqp="sleep-apply">Setzen</button>',
      "</div>",
      left ? ('<p class="dqp-vol-note">Läuft noch ' + sleepLabel().replace("Sleep-Timer · ", "") + "</p>") : "",
      '<button type="button" class="dqp-opt" data-dqp-opt="sleep-off">Timer aus</button>',
      "</div>"
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
    if (id === "m-text") { state.text = cycle(TEXT, state.text); saveState(); paintChrome(); return; }
    if (id === "m-text-ar" || id === "m-text-de" || id === "m-text-both") {
      state.text = id === "m-text-ar" ? "ar" : id === "m-text-de" ? "de" : "both";
      saveState();
      paintChrome();
      document.querySelectorAll(".dqp-text-modes button").forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-dqp-opt") === id);
      });
      return;
    }
    if (id === "m-scale-minus") { setTextScale(state.textScale - 1); return; }
    if (id === "m-scale-plus") { setTextScale(state.textScale + 1); return; }
    if (id === "m-sleep") { openSleepSheet(); return; }
    if (id === "sleep-off") { clearSleepTimer(); closeSheet(); return; }
    if (id.indexOf("sleep-") === 0) {
      setSleepMinutes(Number(id.slice(6)));
      closeSheet();
      return;
    }
    if (id === "m-read") {
      closeSheet();
      leavePlayerRoute("read");
      return;
    }
    if (id === "m-stop") { closeSheet(); stopSession(); return; }
  }
  function mountPlayerPage(root) {
    root = root || playerRoot();
    if (!root || !document.body) return;
    if (root.parentNode !== document.body) document.body.appendChild(root);
    root.hidden = false;
  }
  function bind(force) {
    var root = playerRoot();
    if (!root) return;
    mountPlayerPage(root);
    function syncLiveAudio() {
      seekLock = false;
      var a = audioEl();
      if (audioHasSrc(a)) {
        state.current = a.currentTime || 0;
        state.duration = a.duration || 0;
        state.playing = !a.paused;
        if (!a.paused) state.sessionActive = true;
      }
      applyLearnRate();
      paintInfo();
      paintChrome();
      paintProgress();
      paintAyah(false);
    }
    if (root.dataset.bound && !force) {
      syncLiveAudio();
      return;
    }
    root.dataset.bound = "1";
    var holdSkip = false;
    var dismissY = null;
    var swipeX = null;
    var swipeY = null;
    var grabClose = false;
    function onPlayerAction(ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-dqp],[data-dqp-opt]") : null;
      if (!t) return;
      var act = t.getAttribute("data-dqp");
      if (act === "seek" || act === "vol" || act === "text-scale") return;
      ev.stopPropagation();
      if (act === "min") { leavePlayerRoute("home"); return; }
      if (act === "play") { togglePlay(); return; }
      if (act === "prev") { if (holdSkip) { holdSkip = false; return; } prevAyah(); return; }
      if (act === "next") { if (holdSkip) { holdSkip = false; return; } nextAyah(false); return; }
      if (act === "back15") { skip(-15); return; }
      if (act === "fwd15") { skip(15); return; }
      if (act === "retry") { state.error = ""; loadAudio(true, false); return; }
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "menu") { openMenu(); return; }
      if (act === "sleep-apply") {
        var hEl = root.querySelector("[data-dqp-sleep-h]");
        var mEl = root.querySelector("[data-dqp-sleep-m]");
        var h = Math.max(0, Math.min(12, Number(hEl && hEl.value) || 0));
        var m = Math.max(0, Math.min(59, Number(mEl && mEl.value) || 0));
        armSleepTimer(((h * 60) + m) * 60000);
        closeSheet();
        return;
      }
      if (act === "shuffle") { state.shuffle = cycle(SHUFFLE, state.shuffle); saveState(); paintChrome(); return; }
      if (act === "repeat") { state.repeat = cycle(REPEAT, state.repeat); saveState(); paintChrome(); return; }
      if (act === "text") { state.text = cycle(TEXT, state.text); saveState(); paintChrome(); paintAyah(false); return; }
      if (act === "pick-surah") { openSurahSheet(); return; }
      if (act === "pick-reciter") { openReciterSheet(); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    }
    root.addEventListener("click", onPlayerAction);
    root.addEventListener("input", function (ev) {
      if (ev.target && ev.target.getAttribute("data-dqp") === "text-scale") {
        setTextScale(ev.target.value);
        return;
      }
      if (ev.target && ev.target.hasAttribute("data-dqp-search")) {
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
      applyVolume();
      vol.addEventListener("input", function () {
        state.volume = Number(vol.value) / 100;
        applyVolume();
        saveState();
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
    root.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches[0]) return;
      var t = e.target;
      if (t.closest && (t.closest("[data-dqp-sheet]") || t.closest("input") || t.closest(".dqp-range") || t.closest(".dqp-top-range"))) {
        dismissY = null;
        swipeX = null;
        grabClose = false;
        return;
      }
      grabClose = !!(t.closest && t.closest(".dqp-grab"));
      dismissY = e.touches[0].clientY;
      swipeX = e.touches[0].clientX;
      swipeY = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener("touchmove", function (e) {
      if (!e.touches || !e.touches[0]) return;
      if (grabClose) {
        e.preventDefault();
        return;
      }
      if (swipeX == null) return;
      var dx = e.touches[0].clientX - swipeX;
      var dy = e.touches[0].clientY - swipeY;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.05) e.preventDefault();
    }, { passive: false });
    root.addEventListener("touchend", function (e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var x = e.changedTouches[0].clientX;
      var y = e.changedTouches[0].clientY;
      var dy = dismissY == null ? 0 : y - dismissY;
      var dx = swipeX == null ? 0 : x - swipeX;
      var adx = Math.abs(dx);
      var ady = Math.abs(swipeY == null ? dy : y - swipeY);
      var grab = grabClose;
      dismissY = null;
      swipeX = null;
      swipeY = null;
      grabClose = false;
      if (adx > 40 && adx > ady * 0.95 && dx > 0) {
        leavePlayerRoute("home");
        return;
      }
      if (grab && (ady > 22 || (adx < 14 && ady < 14))) leavePlayerRoute("home");
    }, { passive: true });
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
      var host = playerRoot();
      if (!host) { paintMini(); return; }
      if (host.dataset.ready === "1") { bind(false); paintMini(); return; }
      bind(false);
      ensureData().then(function () {
        var node = playerRoot();
        if (!node) return;
        node.dataset.ready = "1";
        paintInfo();
        paintAyah(false);
        writeHash();
        var a = audioEl();
        var want = pad(state.surah, 3) + pad(state.ayah, 3);
        var src = String(a.currentSrc || a.getAttribute("src") || "");
        if (audioHasSrc(a) && src.indexOf(want) >= 0) {
          seekLock = false;
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
    open: openFullPlayer,
    playFromReader: playFromReader,
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
        textScale: state.textScale,
        volume: state.volume,
        shuffleMode: state.shuffle,
        shuffle: state.shuffle,
        repeatMode: state.repeat,
        repeat: state.repeat
      };
    }
  };

  loadState();
  function resumeVisibleSession() {
    loadState({ keepLiveSession: true });
    if (state.sessionActive) {
      var a = audioEl();
      if (!audioHasSrc(a)) loadAudio(!!state.playing, true);
    }
    paintMini();
  }
  function onRoutePaint() {
    setTimeout(function () {
      syncLearnFromRoute();
      paintMini();
    }, 16);
  }
  window.addEventListener("hashchange", onRoutePaint);
  window.addEventListener("pageshow", function () { resumeVisibleSession(); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") resumeVisibleSession();
  });
  window.addEventListener("resize", function () {
    var el = document.querySelector("#darQuranPlayer [data-dqp-ayah]");
    if (el) fitAyah(el);
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { paintMini(); }, { once: true });
  } else {
    paintMini();
  }
})();
