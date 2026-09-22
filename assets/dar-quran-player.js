(function () {
  "use strict";
    var PLAYER_BUILD = 948;
  /* LEARN_PLAYER_ONLY: Besucher-Web ohne Voll-Player. Test-App und iOS-App: Voll-Player. */
  function isOfficialIosApp() {
    try {
      if (window.DAR_OFFICIAL_IOS_APP === true) return true;
      if (window.DAR_IOS_NATIVE_APP === true) return true;
      var ua = String(navigator.userAgent || "");
      if (/DarAlTawhid-iOS/i.test(ua) || /DarAlTawhidOfficialIOS/i.test(ua)) return true;
      var root = document.documentElement;
      if (root && (root.classList.contains("dar-ios-native-app") || root.classList.contains("dar-ios-native-tabs"))) return true;
    } catch (eOff) {}
    return false;
  }
  function isTestAppPath() {
    try {
      var p = String(location.pathname || "");
      return p === "/test" || p.indexOf("/test/") === 0;
    } catch (eT) { return false; }
  }
  var LEARN_PLAYER_ONLY = !isOfficialIosApp() && !isTestAppPath();
  if (window.__DAR_QURAN_PLAYER_BUILD === PLAYER_BUILD && window.DARQuranPlayer) return;
  try {
    var staleAudio = document.getElementById("darQuranPlayerAudio");
    if (staleAudio) {
      try { staleAudio.pause(); } catch (e0) {}
      try { staleAudio.removeAttribute("src"); } catch (e1) {}
      staleAudio.remove();
    }
    var staleNext = document.getElementById("darQuranPlayerAudioNext");
    if (staleNext) staleNext.remove();
  } catch (e2) {}
  window.DARQuranPlayer = null;
  window.__DAR_QURAN_PLAYER_BUILD = PLAYER_BUILD;

  var KEY = "darQuranPlayerStateV1";
  var LEARN_KEY = "darQuranLearnResumeV1";
  var MODE_KEY = "darQuranPlayerModeV1";
  var RECITERS = [
    { id: "alafasy", name: "Mišārī Rāšid al-ʿAfāsī", folder: "Alafasy_128kbps", edition: "ar.alafasy" },
    { id: "sudais", name: "ʿAbd ar-Raḥmān as-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", edition: "ar.abdurrahmaansudais" },
    { id: "shuraim", name: "Saʿūd aš-Šuraym", folder: "Saood_ash-Shuraym_128kbps", edition: "ar.saudalshuraim" },
    { id: "husary", name: "Maḥmūd Ḫalīl al-Ḥuṣarī", folder: "Husary_128kbps", edition: "ar.husary" },
    { id: "minshawi", name: "Muḥammad Ṣiddīq al-Minšāwī", folder: "Minshawy_Murattal_128kbps", edition: "ar.minshawi" },
    { id: "minshawimujawwad", name: "al-Minšāwī (Muǧawwad)", folder: "Minshawy_Mujawwad_192kbps", edition: "ar.minshawimujawwad" },
    { id: "basit", name: "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", folder: "Abdul_Basit_Murattal_192kbps", edition: "ar.abdulbasitmurattal" },
    { id: "abdulbasitmujawwad", name: "ʿAbd al-Bāsiṭ (Muǧawwad)", folder: "Abdul_Basit_Mujawwad_128kbps", edition: "ar.abdulbasitmujawwad" },
    { id: "ajamy", name: "Aḥmad ibn ʿAlī al-ʿAǧamī", folder: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net", edition: "ar.ahmedajamy" },
    { id: "muhammadayoub", name: "Muḥammad Ayyūb", folder: "Muhammad_Ayyoub_128kbps", edition: "ar.muhammadayyoub" },
    { id: "hudhaify", name: "ʿAlī al-Ḥuḏayfī", folder: "Hudhaify_128kbps", edition: "ar.hudhaify" },
    { id: "muhammadjibreel", name: "Muḥammad Ǧibrīl", folder: "Muhammad_Jibreel_128kbps", edition: "ar.muhammadjibreel" },
    { id: "maher", name: "Māhir al-Muʿayqlī", folder: "MaherAlMuaiqly128kbps", edition: "ar.mahermuaiqly" },
    { id: "shaatree", name: "Abū Bakr aš-Šāṭirī", folder: "Abu_Bakr_Ash-Shaatree_128kbps", edition: "ar.shaatree" },
    { id: "hanirifai", name: "Hānī ar-Rifāʿī", folder: "Hani_Rifai_192kbps", edition: "ar.hanirifai" },
    { id: "abdullahbasfar", name: "ʿAbdullāh Baṣfar", folder: "Abdullah_Basfar_192kbps", edition: "ar.abdullahbasfar" },
    { id: "yasseraldossari", name: "Yāsir ad-Dawsarī", folder: "Yasser_Ad-Dussary_128kbps", edition: "ar.yasseraldossari" }
  ];
  var SHUFFLE = ["off", "surah", "reciter", "both"];
  var REPEAT = ["off", "ayah", "surah"];
  var TEXT = ["both", "ar", "de"];
  var TEXT_QUICK = [
    { ar: true, de: true, lat: false, tad: false, taf: false },
    { ar: true, de: false, lat: false, tad: false, taf: false },
    { ar: false, de: true, lat: false, tad: false, taf: false },
    { ar: true, de: true, lat: true, tad: false, taf: false },
    { ar: true, de: true, lat: false, tad: true, taf: false }
  ];
  var LEARN_RATES = [0.75, 1, 1.25, 1.5];
  var TEXT_L = { both: "Beides", ar: "عربي", de: "Deutsch" };
  var SHUFFLE_L = { off: "Aus", surah: "Sūrah zufällig", reciter: "Rezitator zufällig", both: "Sūrah + Rezitator" };
  var REPEAT_L = { off: "Aus", ayah: "Āyah", surah: "Sūrah" };

  var state = {
    surah: 1, ayah: 1, reciter: "alafasy",
    shuffle: "off", repeat: "off", text: "both",
    playing: false, sessionActive: false, duration: 0, current: 0, resumeAt: 0,
    loading: true, error: "", layer: 0, textScale: 7, volume: 1,
    layers: { ar: true, de: true, lat: false, tad: false, taf: false },
    learnMode: false, learnLoop: true, learnStay: true, learnRate: 1,
    playerMode: "none"
  };
  var sleepUntil = 0;
  var sleepWatch = 0;
  var sleepPicked = 15;
  var leaveLock = false;
  var fullUiWanted = false;
  var dismissUntil = 0;
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
  var tadCatalogReady = null;
  var translitCache = Object.create(null);
  var tafsirCache = Object.create(null);
  var ignoreEndedUntil = 0;
  var trackHeard = false;
  var playGen = 0;
  var allowAdvance = false;
  var engine = { started: false, lastUrl: "" };

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
  function resumeVolCtx() {
    if (volCtx && volCtx.state === "suspended") {
      try { volCtx.resume(); } catch (eR) {}
    }
  }
  function ensureVolGraph() {
    var a = audioEl();
    if (!a) return null;
    if (volGain && volSrc) return volGain;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      if (!volCtx) volCtx = new Ctx();
      if (!volSrc) {
        volSrc = volCtx.createMediaElementSource(a);
        volGain = volCtx.createGain();
        volSrc.connect(volGain);
        volGain.connect(volCtx.destination);
      }
    } catch (eG) {
      return volGain;
    }
    return volGain;
  }
  function applyVolume() {
    var v = Math.max(0, Math.min(1, Number(state.volume)));
    if (!isFinite(v)) v = 1;
    state.volume = v;
    var a = audioEl();
    a.muted = v <= 0.001;
    var nativeOk = probeVolume();
    if (nativeOk) {
      try { a.volume = v; } catch (e) {}
    } else {
      try { a.volume = 1; } catch (e2) {}
      var g = ensureVolGraph();
      if (g && g.gain) {
        try { g.gain.value = v; } catch (e3) {}
      }
      resumeVolCtx();
    }
    var track = document.querySelector("#darQuranPlayer [data-dqp-vol-track]");
    var fillPct = (v * 100) + "%";
    if (track) track.style.setProperty("--dqp-fill", fillPct);
    var vfill = document.querySelector("#darQuranPlayer .dqp-volume .dqp-fill");
    if (vfill) vfill.style.transform = "scaleX(" + Math.max(0, Math.min(1, v)).toFixed(4) + ")";
    var vol = document.querySelector("#darQuranPlayer [data-dqp=vol]");
    if (vol) {
      vol.value = String(Math.round(v * 100));
      vol.style.setProperty("--dqp-fill", fillPct);
    }
    var hint = document.querySelector("[data-dqp-vol-hint]");
    if (hint) hint.hidden = true;
  }
  function bindVolumeSlider(root) {
    if (!root) return;
    var vol = root.querySelector("[data-dqp=vol]");
    var track = root.querySelector("[data-dqp-vol-track]");
    if (!vol || vol.getAttribute("data-dqp-vol-bound") === "1") return;
    vol.setAttribute("data-dqp-vol-bound", "1");
    function fromClientX(clientX) {
      var el = track || vol;
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      state.volume = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      applyVolume();
      saveState();
    }
    function onInput() {
      state.volume = Number(vol.value) / 100;
      applyVolume();
      saveState();
    }
    vol.addEventListener("input", onInput);
    vol.addEventListener("change", onInput);
    var dragging = false;
    var host = track || vol;
    host.addEventListener("pointerdown", function (e) {
      dragging = true;
      try { if (host.setPointerCapture) host.setPointerCapture(e.pointerId); } catch (err) {}
      fromClientX(e.clientX);
      e.preventDefault();
      e.stopPropagation();
    });
    host.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      fromClientX(e.clientX);
      e.preventDefault();
      e.stopPropagation();
    });
    function endDrag() { dragging = false; }
    host.addEventListener("pointerup", endDrag);
    host.addEventListener("pointercancel", endDrag);
    applyVolume();
  }
  function setTextScale(n) {
    state.textScale = Math.max(1, Math.min(10, Math.round(Number(n) || 7)));
    saveState();
    var root = document.getElementById("darQuranPlayer");
    if (root) root.style.setProperty("--dqp-scale", String(state.textScale));
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
  function cycleTextQuick() {
    var i;
    var hit = -1;
    for (i = 0; i < TEXT_QUICK.length; i++) {
      var q = TEXT_QUICK[i];
      if (!!q.ar === !!state.layers.ar && !!q.de === !!state.layers.de && !!q.lat === !!state.layers.lat && !!q.tad === !!state.layers.tad) {
        hit = i;
        break;
      }
    }
    var next = TEXT_QUICK[(hit + 1) % TEXT_QUICK.length];
    state.layers = { ar: !!next.ar, de: !!next.de, lat: !!next.lat, tad: !!next.tad, taf: !!state.layers.taf && !!next.taf };
    state.text = state.layers.ar && state.layers.de ? "both" : (state.layers.ar ? "ar" : "de");
    saveState();
    paintChrome();
    paintAyah(false);
  }

  var FALLBACK_QARI = "alafasy";
  var availCache = Object.create(null);
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
    var mm = String(m).padStart(2, "0");
    var ss = String(s).padStart(2, "0");
    if (h > 0) return String(h).padStart(2, "0") + ":" + mm + ":" + ss;
    return mm + ":" + ss;
  }
  function audioDuration(a) {
    try {
      var d = Number(a && a.duration);
      if (isFinite(d) && d > 0) return d;
    } catch (eD) {}
    var s = Number(state.duration);
    return isFinite(s) && s > 0 ? s : 0;
  }
  function setAllText(sel, txt) {
    var list;
    try { list = document.querySelectorAll(sel); } catch (eQ) { return; }
    for (var i = 0; i < list.length; i++) {
      if (list[i].textContent !== txt) list[i].textContent = txt;
    }
  }
  function verseAt(n) {
    var id = Number(n);
    var found = verses.find(function (v) { return Number(v.id) === id; });
    if (found) return found;
    return verses[id - 1] || null;
  }
  function totalAyat() { return (meta && meta.total_verses) || verses.length || 1; }
  function qlog(tag, data) {
    try {
      if (data !== undefined) console.log(tag, data);
      else console.log(tag);
    } catch (eLog) {}
  }
  function lsGet(k) {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (eG) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (eS) {}
  }
  function nativePersist(kind, payload) {
    try {
      var w = window.webkit && window.webkit.messageHandlers;
      if (w && w.darQuranState) w.darQuranState.postMessage({ kind: kind, payload: payload });
    } catch (eN) {}
  }
  function readMode() {
    var m = "";
    try { m = String(localStorage.getItem(MODE_KEY) || state.playerMode || "none"); } catch (eM) { m = state.playerMode || "none"; }
    if (m === "learning") m = "learning-quran";
    if (m === "global") m = "global-quran";
    if (m !== "global-quran" && m !== "learning-quran") m = "none";
    return m;
  }
  function writeMode(mode) {
    if (mode !== "global-quran" && mode !== "learning-quran") mode = "none";
    state.playerMode = mode;
    try { localStorage.setItem(MODE_KEY, mode); } catch (eW) {}
    nativePersist("mode", mode);
    qlog("[QURAN_ROUTE] mode = " + mode);
  }
  function captureTime() {
    try {
      var a = document.getElementById("darQuranPlayerAudio");
      if (a) {
        var t = Number(a.currentTime);
        if (isFinite(t) && t >= 0) {
          state.current = t;
          state.resumeAt = t;
        }
      }
    } catch (eT) {}
    return Number(state.current || state.resumeAt) || 0;
  }
  function captureScroll() {
    try {
      var y = Number(window.scrollY || document.documentElement.scrollTop || 0);
      return isFinite(y) ? y : 0;
    } catch (eSc) { return 0; }
  }
  function viewSettings() {
    try {
      if (typeof window.getQuranViewSettings === "function") return window.getQuranViewSettings() || {};
    } catch (eV) {}
    return {};
  }
  function globalBlob() {
    captureTime();
    return {
      surah: state.surah, ayah: state.ayah, reciter: state.reciter,
      shuffle: state.shuffle, repeat: state.repeat, text: state.text,
      layers: state.layers,
      textScale: state.textScale, textScaleFit: 1, volume: state.volume,
      resumeAt: state.current || state.resumeAt || 0,
      currentTime: state.current || state.resumeAt || 0,
      duration: state.duration || 0,
      playing: !!state.playing,
      sessionActive: LEARN_PLAYER_ONLY ? false : !!state.sessionActive,
      lastSurahs: lastSurahs.slice(-12),
      timestamp: Date.now()
    };
  }
  function learnBlob() {
    captureTime();
    var vs = viewSettings();
    var m = surahMeta(state.surah) || {};
    var juz = 0;
    try {
      if (typeof window.quranJuzForAyah === "function") juz = Number(window.quranJuzForAyah(state.surah, state.ayah)) || 0;
    } catch (eJ) {}
    var a = document.getElementById("darQuranPlayerAudio");
    return {
      surahNumber: state.surah,
      ayahNumber: state.ayah,
      surahName: m.transliteration || "",
      juz: juz,
      qari: state.reciter,
      audioUrl: engine && engine.lastUrl ? engine.lastUrl : (a ? String(a.currentSrc || "") : ""),
      currentTime: state.current || state.resumeAt || 0,
      duration: state.duration || 0,
      isPlaying: !!state.playing,
      wasPaused: !state.playing,
      scrollTop: captureScroll(),
      selectedTextMode: state.text,
      arabicVisible: vs.showArabic !== false,
      translationVisible: vs.showGerman !== false,
      transliterationVisible: !!vs.showTransliteration,
      tafsirVisible: !!state.layers.taf,
      tadabburVisible: !!state.layers.tad,
      textSize: state.textScale,
      layers: state.layers,
      learnLoop: !!state.learnLoop,
      learnStay: !!state.learnStay,
      learnRate: Number(state.learnRate) || 1,
      timestamp: Date.now()
    };
  }
  function saveGlobalState(reason) {
    var blob = globalBlob();
    lsSet(KEY, blob);
    nativePersist("global", blob);
    qlog("[QURAN_STATE] save global player state", { reason: reason || "", surah: blob.surah, ayah: blob.ayah, t: blob.currentTime });
  }
  function saveLearningState(reason) {
    var blob = learnBlob();
    lsSet(LEARN_KEY, blob);
    nativePersist("learning", blob);
    try {
      if (typeof window.saveQuranAutomaticProgress === "function") {
        window.saveQuranAutomaticProgress({
          surahNumber: blob.surahNumber,
          ayahNumber: blob.ayahNumber,
          surahName: blob.surahName,
          juzNumber: blob.juz,
          scrollOffset: 0
        }, { force: true, allowWhileManual: true });
      }
    } catch (eP) {}
    qlog("[QURAN_STATE] save learning state", { reason: reason || "", surah: blob.surahNumber, ayah: blob.ayahNumber, t: blob.currentTime });
  }
  function persistCurrent(reason) {
    captureTime();
    if (state.learnMode) {
      writeMode("learning-quran");
      saveLearningState(reason);
      return;
    }
    if (state.sessionActive && !LEARN_PLAYER_ONLY) {
      writeMode("global-quran");
      saveGlobalState(reason);
      return;
    }
    saveGlobalState(reason || "idle");
  }
  function applyGlobalBlob(raw) {
    if (!raw || typeof raw !== "object") return;
    if (Number(raw.surah) >= 1 && Number(raw.surah) <= 114) state.surah = Number(raw.surah);
    if (Number(raw.ayah) >= 1) state.ayah = Number(raw.ayah);
    if (reciterById(raw.reciter).id === raw.reciter) state.reciter = raw.reciter;
    if (SHUFFLE.indexOf(raw.shuffle) >= 0) state.shuffle = raw.shuffle;
    if (REPEAT.indexOf(raw.repeat) >= 0) state.repeat = raw.repeat;
    if (TEXT.indexOf(raw.text) >= 0) state.text = raw.text;
    if (raw.layers && typeof raw.layers === "object") {
      state.layers.ar = raw.layers.ar !== false;
      state.layers.de = raw.layers.de !== false;
      state.layers.lat = raw.layers.lat === true;
      state.layers.tad = raw.layers.tad === true;
      state.layers.taf = raw.layers.taf === true;
    }
    if (raw.textScaleFit === 1 && Number(raw.textScale) >= 1 && Number(raw.textScale) <= 10) {
      state.textScale = Math.round(Number(raw.textScale));
    }
    if (Number(raw.volume) >= 0 && Number(raw.volume) <= 1) state.volume = Number(raw.volume);
    var t = Number(raw.currentTime != null ? raw.currentTime : raw.resumeAt) || 0;
    if (t > 0) { state.resumeAt = t; state.current = t; }
    if (!LEARN_PLAYER_ONLY && raw.sessionActive === true) state.sessionActive = true;
    if (Array.isArray(raw.lastSurahs)) lastSurahs = raw.lastSurahs.map(Number).filter(Boolean);
  }
  function applyLearnBlob(raw) {
    if (!raw || typeof raw !== "object") return false;
    var s = Number(raw.surahNumber || raw.surah);
    var a = Number(raw.ayahNumber || raw.ayah);
    if (!(s >= 1 && s <= 114) || !(a >= 1)) return false;
    state.surah = s;
    state.ayah = a;
    if (raw.qari && reciterById(raw.qari).id === raw.qari) state.reciter = raw.qari;
    var t = Number(raw.currentTime) || 0;
    if (t > 0) { state.resumeAt = t; state.current = t; }
    if (Number(raw.duration) > 0) state.duration = Number(raw.duration);
    if (Number(raw.textSize) >= 1 && Number(raw.textSize) <= 10) state.textScale = Math.round(Number(raw.textSize));
    if (TEXT.indexOf(raw.selectedTextMode) >= 0) state.text = raw.selectedTextMode;
    if (raw.layers && typeof raw.layers === "object") state.layers = {
      ar: raw.layers.ar !== false, de: raw.layers.de !== false,
      lat: !!raw.layers.lat, tad: !!raw.layers.tad, taf: !!raw.layers.taf
    };
    if (raw.learnLoop != null) state.learnLoop = !!raw.learnLoop;
    if (raw.learnStay != null) state.learnStay = !!raw.learnStay;
    if (Number(raw.learnRate) > 0) state.learnRate = Number(raw.learnRate);
    return true;
  }
  function readLearn() { return lsGet(LEARN_KEY); }
  function readGlobal() { return lsGet(KEY); }
  function loadState(opts) {
    opts = opts || {};
    try {
      var raw = readGlobal();
      if (!raw || typeof raw !== "object") return;
      if (opts.keepLiveSession && state.sessionActive) {
        if (Number(raw.resumeAt) > 0 && !state.current) state.resumeAt = Number(raw.resumeAt);
        return;
      }
      applyGlobalBlob(raw);
      var mode = readMode();
      if (mode === "learning-quran") state.playerMode = "learning-quran";
      else if (mode === "global-quran") state.playerMode = "global-quran";
    } catch (e) {}
  }
  function saveState() {
    persistCurrent("saveState");
  }
  function rememberSurah(id) {
    lastSurahs.push(Number(id));
    if (lastSurahs.length > 16) lastSurahs = lastSurahs.slice(-16);
  }
  function audioDebug() {
    try { return window.__DAR_QURAN_AUDIO_DEBUG === true; } catch (e) { return false; }
  }
  function logAudio(msg, data) {
    if (!audioDebug()) return;
    if (data !== undefined) console.log("[QURAN_AUDIO] " + msg, data);
    else console.log("[QURAN_AUDIO] " + msg);
  }
  function snapAudio(a) {
    a = a || document.getElementById("darQuranPlayerAudio");
    if (!a) return { missing: true };
    return {
      src: String(a.currentSrc || a.getAttribute("src") || ""),
      paused: a.paused,
      readyState: a.readyState,
      networkState: a.networkState,
      currentTime: a.currentTime,
      duration: a.duration,
      muted: a.muted,
      volume: a.volume,
      error: a.error ? a.error.code : null
    };
  }
  function bindAudioListeners(a) {
    if (!a || a.dataset.dqpEngineBound === "1") return;
    a.dataset.dqpEngineBound = "1";
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", onPlayEv);
    a.addEventListener("pause", onPauseEv);
    a.addEventListener("error", onAudioError);
  }
  function audioEl() {
    var a = document.getElementById("darQuranPlayerAudio");
    if (a) {
      bindAudioListeners(a);
      return a;
    }
    a = document.createElement("audio");
    a.id = "darQuranPlayerAudio";
    a.preload = "auto";
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    a.playsInline = true;
    a.controls = false;
    a.muted = false;
    a.defaultMuted = false;
    a.style.display = "none";
    document.body.appendChild(a);
    bindAudioListeners(a);
    try { ensureVolGraph(); } catch (eVol) {}
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
    var g = globalAyah(surah, ayah);
    return [
      "https://everyayah.com/data/" + rec.folder + "/" + s + a + ".mp3",
      "https://cdn.islamic.network/quran/audio/128/" + rec.edition + "/" + g + ".mp3"
    ];
  }
  function probeAudioUrl(url) {
    return fetch(url, { method: "HEAD", mode: "cors", cache: "no-store" }).then(function (r) {
      if (!r) return true;
      if (r.status === 404 || r.status === 403) return false;
      return true;
    }).catch(function () {
      return true;
    });
  }
  function resolvePlayable(qari, surah, ayah) {
    var chain = [qari];
    if (qari !== FALLBACK_QARI) chain.push(FALLBACK_QARI);
    var i = 0;
    function nextQari() {
      if (i >= chain.length) return Promise.resolve(null);
      var id = chain[i++];
      var key = id + ":" + surah + ":" + ayah;
      if (availCache[key] === false) return nextQari();
      if (availCache[key] && availCache[key].url) return Promise.resolve(availCache[key]);
      var rec = reciterById(id);
      var list = urlsForWithRec(rec, surah, ayah);
      return (function walk(j) {
        if (j >= list.length) {
          availCache[key] = false;
          console.log("[QURAN_AUDIO] missing audio", { qari: id, surah: surah, ayah: ayah, url: list[0] || "" });
          return nextQari();
        }
        return probeAudioUrl(list[j]).then(function (ok) {
          if (!ok) return walk(j + 1);
          var hit = { qari: id, url: list[j] };
          availCache[key] = hit;
          return hit;
        });
      })(0);
    }
    return nextQari();
  }
  function urlsForWithRec(rec, surah, ayah) {
    rec = rec || reciterById(state.reciter);
    var s = pad(surah, 3);
    var a = pad(ayah, 3);
    var g = globalAyah(surah, ayah);
    return [
      "https://everyayah.com/data/" + rec.folder + "/" + s + a + ".mp3",
      "https://cdn.islamic.network/quran/audio/128/" + rec.edition + "/" + g + ".mp3"
    ];
  }
  function missingAudioHalt(qari, surah, ayah, url) {
    state.playing = false;
    allowAdvance = false;
    engine.started = false;
    state.error = "Diese Rezitation ist für diesen Qāriʾ nicht verfügbar.";
    console.log("[QURAN_AUDIO] missing audio", { qari: qari, surah: surah, ayah: ayah, url: url || "" });
    paintError();
    paintChrome();
    paintMini();
  }
  function runPlay(a, gen) {
    a.muted = false;
    a.defaultMuted = false;
    logAudio("play request", {
      surah: state.surah,
      ayah: state.ayah,
      qari: state.reciter,
      url: engine.lastUrl,
      snap: snapAudio(a)
    });
    resumeVolCtx();
    applyVolume();
    var p = a.play();
    if (!p || !p.then) {
      engine.started = true;
      allowAdvance = false;
      return;
    }
    p.then(function () {
      if (gen !== playGen) return;
      engine.started = true;
      state.playing = true;
      state.sessionActive = true;
      logAudio("play resolved", snapAudio(a));
      paintChrome();
      paintMini();
    }).catch(function (err) {
      if (gen !== playGen) return;
      var name = err && err.name;
      logAudio("play rejected", { name: name, message: err && err.message, snap: snapAudio(a) });
      if (name === "AbortError") return;
      if (name === "NotAllowedError") {
        state.playing = false;
        state.error = "Tippe erneut auf Wiedergabe, um den Ton zu starten.";
        paintError();
        paintChrome();
        return;
      }
      tryFallback();
    });
  }
  function loadAudio(autoplay, keepTime) {
    var gen = ++playGen;
    urlIndex = 0;
    state.error = "";
    trackHeard = false;
    allowAdvance = false;
    engine.started = false;
    ignoreEndedUntil = Date.now() + 1200;
    var wantQari = state.reciter;
    var surah = state.surah;
    var ayah = state.ayah;
    resolvePlayable(wantQari, surah, ayah).then(function (hit) {
      if (gen !== playGen) return;
      if (!hit) {
        missingAudioHalt(wantQari, surah, ayah, "");
        return;
      }
      if (hit.qari !== wantQari) {
        state.reciter = hit.qari;
        state.error = "Diese Āyah ist bei diesem Qāriʾ nicht verfügbar. Es wird vorübergehend " + reciterById(hit.qari).name + " abgespielt.";
      }
      var a = audioEl();
      engine.lastUrl = hit.url;
      logAudio("loadAudio", { autoplay: !!autoplay, keepTime: !!keepTime, url: hit.url, qari: hit.qari, before: snapAudio(a) });
      a.muted = false;
      a.defaultMuted = false;
      a.src = hit.url;
      logAudio("src after", snapAudio(a));
      if (keepTime && state.resumeAt > 0) {
        a.addEventListener("loadedmetadata", function once() {
          a.removeEventListener("loadedmetadata", once);
          if (gen !== playGen) return;
          if (state.resumeAt < (a.duration || 1e9)) a.currentTime = state.resumeAt;
          state.resumeAt = 0;
        });
      }
      if (autoplay) {
        state.playing = true;
        state.sessionActive = true;
        runPlay(a, gen);
      }
      applyLearnRate();
      syncProgressSample(true);
      if (state.playing) startProgressClock();
      paintAyah(false);
      paintChrome();
      paintMini();
      followPlayingAyah(false);
    });
  }
  function preloadNext() {}
  function tryFallback() {
    var urls = urlsFor(state.surah, state.ayah);
    urlIndex += 1;
    if (urlIndex >= urls.length) {
      resolvePlayable(FALLBACK_QARI, state.surah, state.ayah).then(function (hit) {
        if (!hit || hit.url === engine.lastUrl) {
          missingAudioHalt(state.reciter, state.surah, state.ayah, engine.lastUrl);
          return;
        }
        if (hit.qari !== state.reciter) {
          state.reciter = hit.qari;
          state.error = "Diese Āyah ist bei diesem Qāriʾ nicht verfügbar. Es wird vorübergehend " + reciterById(hit.qari).name + " abgespielt.";
        }
        ignoreEndedUntil = Date.now() + 1200;
        engine.started = false;
        allowAdvance = false;
        engine.lastUrl = hit.url;
        audioEl().src = hit.url;
        if (state.playing || state.sessionActive) runPlay(audioEl(), playGen);
        paintChrome();
      });
      return;
    }
    ignoreEndedUntil = Date.now() + 1200;
    engine.started = false;
    allowAdvance = false;
    var a = audioEl();
    engine.lastUrl = urls[urlIndex];
    logAudio("fallback url", { url: engine.lastUrl, index: urlIndex });
    a.src = engine.lastUrl;
    if (state.playing || state.sessionActive) runPlay(a, playGen);
  }
  function onTime() {
    if (seekLock) return;
    var a = audioEl();
    state.duration = audioDuration(a);
    syncProgressSample(false);
    if (engine.started && (Number(state.current) || 0) > 0.25 && isFinite(state.duration) && state.duration > 1) {
      trackHeard = true;
      allowAdvance = true;
    }
    if (!saveTimer) saveTimer = setTimeout(function () { saveTimer = 0; saveState(); }, 1800);
    if (sleepUntil && Date.now() >= sleepUntil) fireSleepTimer();
    var now = Date.now();
    if (now - posTick > 450) {
      posTick = now;
      syncMediaPosition();
    }
  }
  function onMeta() {
    var a = audioEl();
    state.duration = audioDuration(a);
    logAudio("loadedmetadata", snapAudio(a));
    syncProgressSample(true);
    paintProgress();
    if (state.playing) startProgressClock();
  }
  function onCanPlay() {
    logAudio("canplay", snapAudio());
    if (state.error) {
      state.error = "";
      paintError();
    }
  }
  function onPlayEv() {
    if (LEARN_PLAYER_ONLY && !isQuranArea()) {
      try { audioEl().pause(); } catch (ePlayLeave) {}
      persistCurrent("blocked-play-off-quran");
      state.playing = false;
      state.sessionActive = false;
      paintMini();
      return;
    }
    state.playing = true;
    state.sessionActive = true;
    if (state.learnMode) writeMode("learning-quran");
    else if (!LEARN_PLAYER_ONLY) writeMode("global-quran");
    applyLearnRate();
    persistCurrent("play");
    paintChrome();
    paintMini();
    markPlayingAyah();
    syncProgressSample(true);
    startProgressClock();
  }
  function onPauseEv() {
    state.playing = false;
    saveState();
    paintChrome();
    paintMini();
    markPlayingAyah();
    syncProgressSample(true);
    stopProgressClock();
    try {
      state.current = Number(audioEl().currentTime) || state.current || 0;
      state.resumeAt = state.current;
    } catch (ePause) {}
    paintProgress();
  }
  function onAudioError() {
    var a = audioEl();
    var code = a.error && a.error.code;
    logAudio("error", { code: code, snap: snapAudio(a) });
    if (code === 1) return;
    if (engine.fallbackTimer) clearTimeout(engine.fallbackTimer);
    engine.fallbackTimer = setTimeout(function () {
      engine.fallbackTimer = 0;
      var el = audioEl();
      if (engine.started && !el.paused && el.readyState >= 2) return;
      if (el.readyState >= 3) return;
      tryFallback();
    }, 450);
  }
  function trackReallyFinished() {
    var a = audioEl();
    var src = String(a.currentSrc || a.getAttribute("src") || "");
    if (!src) {
      logAudio("ended ignored: empty src");
      return false;
    }
    if (Date.now() < ignoreEndedUntil) {
      logAudio("ended ignored: src-change window");
      return false;
    }
    if (!engine.started || !allowAdvance || !trackHeard) {
      logAudio("ended ignored: not actually started", snapAudio(a));
      return false;
    }
    var t = Number(a.currentTime || 0);
    var d = Number(a.duration || 0);
    if (!isFinite(d) || d < 1.2) {
      logAudio("ended ignored: invalid duration", snapAudio(a));
      return false;
    }
    if (t < Math.max(1, d * 0.85)) {
      logAudio("ended ignored: not near end", snapAudio(a));
      return false;
    }
    return true;
  }
  async function onEnded() {
    logAudio("ended", snapAudio());
    if (!trackReallyFinished()) return;
    trackHeard = false;
    allowAdvance = false;
    engine.started = false;
    if (state.learnMode && state.learnLoop) {
      var a = audioEl();
      a.currentTime = 0;
      applyLearnRate();
      runPlay(a, playGen);
      return;
    }
    if (state.learnMode && state.learnStay) {
      state.playing = false;
      paintChrome();
      paintMini();
      return;
    }
    if (state.repeat === "ayah") {
      var b = audioEl();
      b.currentTime = 0;
      runPlay(b, playGen);
      return;
    }
    await nextAyah(true);
  }
  function quranRouteName() {
    return String(location.hash || "").replace(/^#\/?/, "").split("/")[0].toLowerCase();
  }
  function isReaderRoute() {
    var name = quranRouteName();
    return name === "quran-surah"
      || (document.body && document.body.classList.contains("is-quran-reader-route"))
      || document.documentElement.classList.contains("is-quran-reader-route");
  }
  function isQuranArea() {
    var name = quranRouteName();
    if (name === "quran" || name === "quran-surah") return true;
    var body = document.body;
    var html = document.documentElement;
    if (body && (body.classList.contains("is-quran-reader-route") || body.classList.contains("is-quran-overview"))) return true;
    if (html && (html.classList.contains("is-quran-reader-route") || html.classList.contains("is-quran-overview"))) return true;
    return false;
  }
  function playerModeNow() {
    var stored = readMode();
    if (state.learnMode && isQuranArea()) return "learning-quran";
    if (!LEARN_PLAYER_ONLY && state.sessionActive && !state.learnMode) return "global-quran";
    if (stored === "learning-quran" || stored === "global-quran") return stored;
    return "none";
  }
  function showLearningPlayer() {
    return isQuranArea()
      && (playerModeNow() === "learning-quran" || !!state.learnMode)
      && Number(state.ayah) >= 1
      && !!state.sessionActive;
  }
  function cleanupLearningPlayerOnRouteLeave() {
    state.playerMode = playerModeNow();
    if (isQuranArea()) {
      applyLearnChrome();
      return;
    }
    if (state.learnMode) {
      persistCurrent("route-leave-learning");
      try { audioEl().pause(); } catch (eLeave) {}
      state.playing = false;
      state.learnMode = false;
      state.sessionActive = false;
      writeMode("learning-quran");
      applyLearnChrome();
      paintMini();
      qlog("[QURAN_ROUTE] learning paused off-route");
      return;
    }
    applyLearnChrome();
  }
  function applyLearnRate() {
    var rate = state.learnMode ? (Number(state.learnRate) || 1) : 1;
    try {
      var a = audioEl();
      try { a.preservesPitch = true; } catch (eP) {}
      try { a.webkitPreservesPitch = true; } catch (eW) {}
      if (Math.abs((Number(a.playbackRate) || 1) - rate) > 0.001) a.playbackRate = rate;
      var hold = currentProgressTime();
      progSampleT = hold;
      progSampleAt = performance.now();
      state.current = hold;
    } catch (e) {}
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
    try {
      if (typeof window.syncQuranLearnChromeLock === "function") window.syncQuranLearnChromeLock();
    } catch (eLearnChrome) {}
  }
  var lastFollowKey = "";
  function playingAyahNode() {
    return document.getElementById("ayah-" + state.ayah);
  }
  function ayahNeedsFollow(el) {
    if (!el) return true;
    var r = el.getBoundingClientRect();
    var chrome = document.getElementById("qrcChrome");
    var mini = document.getElementById("darQuranMiniPlayer");
    var topPad = 24;
    if (chrome && !chrome.classList.contains("is-hidden")) {
      topPad = Math.max(topPad, chrome.getBoundingClientRect().bottom + 8);
    }
    if (mini && mini.classList.contains("is-on")) {
      topPad = Math.max(topPad, mini.getBoundingClientRect().bottom + 8);
    }
    var vh = window.innerHeight || 0;
    if (r.bottom < topPad + 20) return true;
    if (r.top > vh - 88) return true;
    return false;
  }
  function revealPlayingAyah(force) {
    if (!isReaderRoute() || !state.sessionActive) return;
    var ayah = Number(state.ayah);
    if (!(ayah >= 1)) return;
    var el = playingAyahNode();
    if (!el) return;
    markPlayingAyah();
    if (!force && !ayahNeedsFollow(el)) return;
    if (typeof window.scrollToQuranAyah === "function") {
      try { window.scrollToQuranAyah(ayah, { scrollOffset: 0 }); } catch (eScroll) {}
    } else {
      try { el.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (eView) {}
    }
    markPlayingAyah();
  }
  function followPlayingAyah(force) {
    if (!state.learnMode || !isReaderRoute() || !state.sessionActive) return;
    var key = state.surah + ":" + state.ayah;
    if (!force && state.learnLoop) return;
    if (!force && lastFollowKey === key) return;
    lastFollowKey = key;
    revealPlayingAyah(!!force || !state.learnLoop);
  }
  function markPlayingAyah() {
    document.querySelectorAll(".quran-ayah.is-dqp-playing").forEach(function (n) {
      n.classList.remove("is-dqp-playing");
    });
    document.querySelectorAll("[data-qrc-ayah-play].is-on").forEach(function (n) {
      n.classList.remove("is-on");
    });
    if (!state.sessionActive) return;
    var node = playingAyahNode();
    if (node) node.classList.add("is-dqp-playing");
    var btn = document.querySelector('[data-qrc-ayah-play="' + state.surah + ":" + state.ayah + '"]');
    if (btn && state.playing) btn.classList.add("is-on");
  }
  function syncLearnFromRoute() {
    cleanupLearningPlayerOnRouteLeave();
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
    ensureTadCatalog();
    loadTranslit(state.surah);
    loadTafsir(state.surah);
  }
  function parseRoute(value) {
    var parts = String(value || "").split("/").filter(Boolean);
    var s = Number(parts[0]);
    var a = Number(parts[1]);
    if (s >= 1 && s <= 114) state.surah = s;
    if (a >= 1) state.ayah = a;
  }
  function writeHash() {
    if (LEARN_PLAYER_ONLY) return;
    if (!fullUiWanted || Date.now() < dismissUntil) return;
    if (!isFullPlayerRoute()) return;
    if (isReaderRoute() || state.learnMode) return;
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
    if (!isQuranArea()) return;
    enterLearnMode();
    writeMode("learning-quran");
    state.playerMode = "learning-quran";
    state.sessionActive = true;
    persistCurrent("ayah-play");
    var a = audioEl();
    var same = state.surah === surah && state.ayah === ayah && audioHasSrc(a);
    if (same) {
      togglePlay(true);
      applyLearnRate();
      paintMini();
      revealPlayingAyah(true);
      return;
    }
    lastFollowKey = "";
    state.surah = surah;
    state.ayah = ayah;
    state.resumeAt = 0;
    saveState();
    loadAudio(true, false);
    ensureData().then(function () {
      paintInfo();
      paintAyah(false);
      paintMini();
      revealPlayingAyah(true);
    });
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
        '<div class="dqp-topbar">' +
          '<button class="dqp-back" type="button" data-dqp="home" aria-label="Zurück zur Startseite">Zurück</button>' +
          '<button class="dqp-grab" type="button" data-dqp="min" aria-label="Minimieren"></button>' +
        "</div>" +
        '<div class="dqp-art">' +
          '<div class="dqp-ayah" data-dqp-ayah>' +
            '<div class="dqp-ayah-ref" data-ref></div>' +
            '<section class="dqp-sec dqp-sec-ar" data-sec="ar"><div class="dqp-sec-h">عربي</div><div class="dqp-ayah-ar" lang="ar" dir="rtl"></div></section>' +
            '<section class="dqp-sec dqp-sec-de" data-sec="de"><div class="dqp-sec-h">Deutsch</div><div class="dqp-ayah-de"></div></section>' +
            '<section class="dqp-sec dqp-sec-lat" data-sec="lat"><div class="dqp-sec-h">Lautschrift</div><div class="dqp-ayah-lat" data-lat></div></section>' +
            '<section class="dqp-sec dqp-sec-tad" data-sec="tad"><div class="dqp-sec-h">Tadabbur</div><div class="dqp-ayah-tad" data-tad></div></section>' +
            '<section class="dqp-sec dqp-sec-taf" data-sec="taf"><div class="dqp-sec-h">Tafsīr</div><div class="dqp-ayah-taf" data-taf></div></section>' +
            '<div class="dqp-status">Wird geladen …</div>' +
          "</div>" +
        "</div>" +
        '<div class="dqp-foot">' +
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
      paintLat(el);
      paintTad(el);
      paintTaf(el);
      el.classList.remove("is-leave", "is-enter");
      fitAyah(el);
      paintError();
      Promise.all([ensureTadCatalog(), loadTranslit(state.surah), loadTafsir(state.surah)]).then(function () {
        paintLat(el);
        paintTad(el);
        paintTaf(el);
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
  function ingestTadItems(items) {
    var by = window.__DAR_TADABBUR_BY_REF && typeof window.__DAR_TADABBUR_BY_REF === "object"
      ? window.__DAR_TADABBUR_BY_REF
      : {};
    var list = Array.isArray(window.__DAR_TADABBUR_ITEMS) ? window.__DAR_TADABBUR_ITEMS.slice() : [];
    var seen = {};
    list.forEach(function (it) { if (it && it.id) seen[it.id] = 1; });
    (items || []).forEach(function (it) {
      if (!it || !it.reference || !it.reflection) return;
      if (it.id && seen[it.id]) return;
      if (it.id) seen[it.id] = 1;
      list.push(it);
      if (!by[it.reference]) by[it.reference] = it;
    });
    window.__DAR_TADABBUR_ITEMS = list;
    window.__DAR_TADABBUR_BY_REF = by;
    return by;
  }
  function parseTadCatalog(raw) {
    var rows = [];
    if (Array.isArray(raw)) rows = raw;
    else if (raw && Array.isArray(raw.items)) rows = raw.items;
    var out = [];
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      var id = String(row.id || "").trim();
      var ref = String(row.reference || "").trim();
      var reflection = String(row.reflection || "").trim();
      if (!ref || reflection.length < 20) continue;
      if (seen[id || ref]) continue;
      seen[id || ref] = 1;
      out.push({
        id: id || ref,
        reference: ref,
        verse: String(row.verse || "").trim(),
        reflection: reflection,
        narrator: String(row.narrator || "").trim(),
        generation: String(row.generation || "").trim(),
        source: String(row.source || "").trim()
      });
    }
    ingestTadItems(out);
    return out;
  }
  function ensureTadCatalog() {
    var existing = window.__DAR_TADABBUR_BY_REF;
    if (existing && Object.keys(existing).length) return Promise.resolve(existing);
    if (tadCatalogReady) return tadCatalogReady;
    var urls = [
      "/apple-tv/tadabbur/catalog.json",
      "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/tadabbur/catalog.json"
    ];
    tadCatalogReady = (function next(i) {
      if (i >= urls.length) return Promise.resolve(window.__DAR_TADABBUR_BY_REF || {});
      return fetch(urls[i], { cache: "no-store" }).then(function (r) {
        if (!r.ok) return next(i + 1);
        return r.json().then(parseTadCatalog).then(function () { return window.__DAR_TADABBUR_BY_REF || {}; });
      }).catch(function () { return next(i + 1); });
    })(0);
    return tadCatalogReady;
  }
  function tadEntryFor(surah, ayah) {
    var by = window.__DAR_TADABBUR_BY_REF || {};
    return by[Number(surah) + ":" + Number(ayah)] || null;
  }
  window.DARTadabburCatalog = {
    ensure: ensureTadCatalog,
    get: tadEntryFor
  };
  window.addEventListener("dar-tadabbur-ready", function () {
    var root = playerRoot();
    var el = root && root.querySelector("[data-dqp-ayah]");
    if (el) {
      paintTad(el);
      fitAyah(el);
    }
  });
  function loadJsonPad(dir, cache) {
    var id = Number(state.surah);
    var hit = cache[id];
    if (hit && typeof hit.then !== "function") return Promise.resolve(hit);
    if (hit && typeof hit.then === "function") return hit;
    var url = dir + pad(id, 3) + ".json";
    cache[id] = fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) { cache[id] = null; return null; }
      return r.json().then(function (json) { cache[id] = json; return json; });
    }).catch(function () { cache[id] = null; return null; });
    return cache[id];
  }
  function loadTranslit(surah) {
    state.surah = Number(surah) || state.surah;
    return loadJsonPad("/content/quran-translit/", translitCache);
  }
  function loadTafsir(surah) {
    state.surah = Number(surah) || state.surah;
    return loadJsonPad("/content/tafsir/de/", tafsirCache);
  }
  function verseRow(doc, ayah) {
    var rows = (doc && doc.verses) || [];
    var id = Number(ayah);
    return rows.find(function (v) { return Number(v.id) === id; }) || rows[id - 1] || null;
  }
  function latPlain() {
    var doc = translitCache[Number(state.surah)];
    if (doc && typeof doc.then === "function") return "";
    var row = verseRow(doc, state.ayah);
    var t = row && row.transliteration;
    if (!t) return "";
    return String(t.scientific || t.standard || t.readable || "").trim();
  }
  function tafPlain() {
    var doc = tafsirCache[Number(state.surah)];
    if (doc && typeof doc.then === "function") return "";
    var row = verseRow(doc, state.ayah);
    var hit = pickTafsirLine(row);
    if (!hit) return "";
    return (hit.source ? hit.source + "\n" : "") + hit.text;
  }
  function tadPlain() {
    var catalog = tadEntryFor(state.surah, state.ayah);
    if (!catalog || !catalog.reflection) return "";
    var meta = [catalog.narrator, catalog.generation].filter(Boolean).join(" · ");
    var tail = [meta, catalog.source].filter(Boolean).join("\n");
    return tail ? (catalog.reflection + "\n\n" + tail) : catalog.reflection;
  }
  function loadTadForSurah() {
    return ensureTadCatalog();
  }
  function packForAyah() {
    return {};
  }
  function paintLat(el) {
    if (!el) return;
    var node = el.querySelector("[data-lat]");
    var sec = el.querySelector('[data-sec="lat"]');
    var text = latPlain();
    if (node) node.textContent = text || "Lautschrift wird geladen …";
    if (sec) sec.hidden = !state.layers.lat;
  }
  function paintTad(el) {
    if (!el) return;
    var tadEl = el.querySelector("[data-tad]");
    var sec = el.querySelector('[data-sec="tad"]');
    var text = tadPlain();
    if (tadEl) tadEl.textContent = text || "Kein Tadabbur-Eintrag zu dieser Āyah.";
    if (sec) sec.hidden = !state.layers.tad;
  }
  function paintTaf(el) {
    if (!el) return;
    var node = el.querySelector("[data-taf]");
    var sec = el.querySelector('[data-sec="taf"]');
    var text = tafPlain();
    if (node) node.textContent = text || "Keine geprüfte Tafsīr-Zeile zu dieser Āyah.";
    if (sec) sec.hidden = !state.layers.taf;
  }
  function fitAyah(el) {
    var ar = el.querySelector(".dqp-ayah-ar");
    var de = el.querySelector(".dqp-ayah-de");
    var lat = el.querySelector("[data-lat]");
    var tad = el.querySelector("[data-tad]");
    var taf = el.querySelector("[data-taf]");
    if (!ar) return;
    var box = el.parentElement;
    var scale = Number(state.textScale) || 7;
    var layersOn = (state.layers.ar ? 1 : 0) + (state.layers.de ? 1 : 0) + (state.layers.lat ? 1 : 0) + (state.layers.tad ? 1 : 0) + (state.layers.taf ? 1 : 0);
    var prefer = 13 + scale * 2.2;
    if (layersOn >= 4) prefer *= 0.78;
    else if (layersOn === 3) prefer *= 0.86;
    var n = (ar.textContent || "").length + ((de && state.layers.de ? de.textContent : "") || "").length * 0.72;
    if (n > 420) prefer *= 0.82;
    else if (n > 240) prefer *= 0.9;
    var deRatio = 0.72;
    var applyPx = function (px) {
      ar.style.lineHeight = "1.45";
      ar.style.fontSize = px + "px";
      var root = document.getElementById("darQuranPlayer");
      if (root) {
        root.style.setProperty("--dqp-ar", px + "px");
        root.style.setProperty("--dqp-de", Math.max(13, Math.round(px * deRatio)) + "px");
      }
      if (de) {
        de.style.fontSize = Math.max(13, Math.round(px * deRatio)) + "px";
        de.style.lineHeight = "1.45";
      }
      if (lat) {
        lat.style.fontSize = Math.max(12, Math.round(px * 0.52)) + "px";
        lat.style.lineHeight = "1.45";
      }
      if (tad) {
        tad.style.fontSize = Math.max(12, Math.round(px * 0.44)) + "px";
        tad.style.lineHeight = "1.42";
      }
      if (taf) {
        taf.style.fontSize = Math.max(12, Math.round(px * 0.44)) + "px";
        taf.style.lineHeight = "1.42";
      }
    };
    var px = Math.round(prefer);
    var minPx = Math.max(12, Math.round(10 + scale * 1.15));
    var maxPx = Math.round(15 + scale * (layersOn >= 4 ? 2.6 : 3.6));
    applyPx(px);
    if (!box || box.clientHeight < 40) return;
    var room = box.clientHeight - 8;
    var guard = 0;
    while (el.scrollHeight > room && px > minPx && guard < 48) {
      px -= 1;
      applyPx(px);
      guard += 1;
    }
    el.style.justifyContent = "flex-start";
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
    applyProgressVisual(currentProgressTime(), Number(state.duration) || 0);
  }
  var progressClock = 0;
  var progressTimer = 0;
  var progSampleT = 0;
  var progSampleAt = 0;
  var progRate = 1;
  var progCache = null;
  var lastProgPct = -1;
  var lastProgPaintAt = 0;
  var PROG_HZ = 120;
  var PROG_FRAME_MS = 1000 / PROG_HZ;
  function invalidateProgressCache() { progCache = null; lastProgPct = -1; }
  var lastSeekUiAt = 0;
  function progressEls() {
    var mini = document.getElementById("darQuranMiniPlayer");
    var root = playerRoot();
    if (
      progCache &&
      progCache.mini === mini &&
      progCache.root === root &&
      (!mini || (progCache.cur && progCache.cur.isConnected)) &&
      (!root || root.hidden || (progCache.pcur && progCache.pcur.isConnected && progCache.pfill && progCache.pfill.isConnected))
    ) {
      return progCache;
    }
    progCache = {
      mini: mini,
      root: root,
      el: root && !root.hidden ? root : mini,
      cur: mini ? mini.querySelector("[data-dqp-mini-cur]") : null,
      dur: mini ? mini.querySelector("[data-dqp-mini-dur]") : null,
      fill: mini ? mini.querySelector(".dqp-top-fill") : null,
      shift: mini ? mini.querySelector(".dqp-top-knob-shift") : null,
      pfill: root ? root.querySelector(".dqp-progress .dqp-fill") : null,
      pcur: root ? root.querySelector("[data-dqp-cur]") : null,
      pdur: root ? root.querySelector("[data-dqp-dur]") : null,
      sl: root ? root.querySelector("[data-dqp=seek]") : null,
      msl: mini ? mini.querySelector("[data-dqp-mini=seek]") : null
    };
    return progCache;
  }
  function audioRate() {
    try { return Number(audioEl().playbackRate) || 1; } catch (eR) { return 1; }
  }
  function syncProgressSample(force) {
    try {
      var a = audioEl();
      var audioT = Number(a.currentTime) || 0;
      var d = audioDuration(a);
      if (d) state.duration = d;
      var now = performance.now();
      var rate = audioRate();
      progRate = rate;
      if (!force && state.playing && !seekLock && progSampleAt) {
        var vis = progSampleT + (now - progSampleAt) / 1000 * (progRate || rate || 1);
        if (audioT + 0.03 < vis && vis - audioT < 0.45) return;
      }
      progSampleT = audioT;
      progSampleAt = now;
      state.current = audioT;
    } catch (eS) {}
  }
  function currentProgressTime() {
    if (seekLock || !state.playing) return Number(state.current) || progSampleT || 0;
    var t = progSampleT + (performance.now() - (progSampleAt || performance.now())) / 1000 * (progRate || 1);
    var d = Number(state.duration) || 0;
    if (t < 0) t = 0;
    if (d > 0 && t > d) t = d;
    return t;
  }
  function applyProgressVisual(t, d) {
    var ui = progressEls();
    d = Number(d) || audioDuration(audioEl()) || 0;
    var ready = d > 0 && isFinite(d);
    var pct = ready ? Math.max(0, Math.min(1, t / d)) : 0;
    var xform = "translate3d(" + (pct * 100).toFixed(4) + "%,0,0)";
    var scale = "scaleX(" + pct.toFixed(5) + ")";
    if (ui && ui.fill) ui.fill.style.transform = scale;
    if (ui && ui.shift) ui.shift.style.transform = xform;
    if (ui && ui.pfill) ui.pfill.style.transform = scale;
    var fills = document.querySelectorAll("#darQuranPlayer .dqp-progress .dqp-fill, #darQuranMiniPlayer .dqp-top-fill");
    for (var fi = 0; fi < fills.length; fi++) fills[fi].style.transform = scale;
    lastProgPct = pct;
    var curTxt = fmt(t);
    var durTxt = ready ? fmt(d) : "00:00";
    var remainTxt = ready ? ("-" + fmt(Math.max(0, d - t))) : "00:00";
    setAllText("#darQuranMiniPlayer [data-dqp-mini-cur]", curTxt);
    setAllText("#darQuranMiniPlayer [data-dqp-mini-dur]", durTxt);
    setAllText("#darQuranPlayer [data-dqp-cur]", curTxt);
    setAllText("#darQuranPlayer [data-dqp-dur]", remainTxt);
    if (!seekLock) {
      var now = performance.now();
      if (now - lastSeekUiAt > 80) {
        lastSeekUiAt = now;
        var nextVal = String(Math.round(pct * 1000));
        var sliders = document.querySelectorAll("#darQuranPlayer [data-dqp=seek], #darQuranMiniPlayer [data-dqp-mini=seek]");
        for (var si = 0; si < sliders.length; si++) {
          if (sliders[si].value !== nextVal) sliders[si].value = nextVal;
        }
      }
    }
  }
  function progressClockTick() {
    if (!state.sessionActive && !state.playing && !isFullPlayerRoute()) {
      stopProgressClock();
      return;
    }
    if (seekLock) return;
    var t = currentProgressTime();
    state.current = t;
    applyProgressVisual(t, audioDuration(audioEl()));
  }
  function startProgressClock() {
    syncProgressSample(true);
    lastProgPaintAt = 0;
    if (!progressClock) {
      function rafLoop() {
        progressClock = requestAnimationFrame(rafLoop);
        var now = performance.now();
        if (now - lastProgPaintAt < PROG_FRAME_MS * 0.55) return;
        lastProgPaintAt = now;
        progressClockTick();
      }
      progressClock = requestAnimationFrame(rafLoop);
    }
    if (!progressTimer) {
      progressTimer = setInterval(function () {
        progressClockTick();
      }, 8);
    }
  }
  function stopProgressClock() {
    if (progressClock) cancelAnimationFrame(progressClock);
    if (progressTimer) clearInterval(progressTimer);
    progressClock = 0;
    progressTimer = 0;
  }
  function requestProgressPaint() {
    applyProgressVisual(currentProgressTime(), Number(state.duration) || 0);
  }
  function paintProgress() {
    var root = playerRoot();
    if (root) {
      var n = root.querySelector("[data-dqp-n]");
      if (n) n.textContent = "Āyah " + state.ayah + " / " + totalAyat();
    }
    lastProgPct = -1;
    applyProgressVisual(currentProgressTime(), Number(state.duration) || 0);
  }
  function paintChrome() {
    var root = playerRoot();
    if (root) {
      root.setAttribute("data-text", state.text);
      root.setAttribute("data-ar", state.layers.ar ? "1" : "0");
      root.setAttribute("data-de", state.layers.de ? "1" : "0");
      root.setAttribute("data-lat", state.layers.lat ? "1" : "0");
      root.setAttribute("data-tad", state.layers.tad ? "1" : "0");
      root.setAttribute("data-taf", state.layers.taf ? "1" : "0");
      root.style.setProperty("--dqp-scale", String(state.textScale));
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
      if (tx) tx.classList.toggle("is-on", !!(state.layers.lat || state.layers.tad || state.layers.taf));
      applyVolume();
      var ayah = root.querySelector("[data-dqp-ayah]");
      if (ayah) fitAyah(ayah);
      syncMediaSession();
    }
    paintMini();
  }
  var posTick = 0;
  function isTestShell() {
    try {
      var p = String(location.pathname || "");
      return p.indexOf("/test") === 0;
    } catch (eTs) {
      return false;
    }
  }
  function nowPlayingArtworkUrl() {
    var origin = "";
    try { origin = String(location.origin || ""); } catch (eArt) {}
    if (isTestShell()) return origin + "/test/assets/quran-player-artwork-512.png?v=" + PLAYER_BUILD;
    return origin + "/assets/quran-player-artwork-512.png?v=" + PLAYER_BUILD;
  }
  function nowPlayingArtwork() {
    var src = nowPlayingArtworkUrl();
    return [
      { src: src, sizes: "512x512", type: "image/png" }
    ];
  }
  function nowPlayingRoute() {
    return "quran-surah/" + state.surah + "/" + state.ayah;
  }
  function postNowPlaying(clear) {
    try {
      var h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.darQuranNowPlaying;
      if (!h) return;
      if (clear || (!state.playing && !state.sessionActive)) {
        h.postMessage({ clear: true });
        return;
      }
      var m = meta || surahMeta(state.surah) || {};
      h.postMessage({
        title: (m.transliteration || "Qurʾān") + " · Āyah " + state.ayah,
        artist: reciterById(state.reciter).name,
        album: "DĀR AL TAWḤĪD",
        playing: !!state.playing,
        elapsed: Number(state.current) || 0,
        duration: Number(state.duration) || 0,
        surah: state.surah,
        ayah: state.ayah,
        qari: state.reciter,
        sourceApp: isTestShell() ? "dar-test" : "dar-live",
        targetRoute: nowPlayingRoute(),
        artwork: nowPlayingArtworkUrl(),
        inPlayer: true
      });
    } catch (eNp) {}
  }
  function syncMediaPosition() {
    try {
      if (!navigator.mediaSession || !state.sessionActive) return;
      var d = Number(state.duration) || 0;
      var t = Number(state.current) || 0;
      if (d > 0 && typeof navigator.mediaSession.setPositionState === "function") {
        navigator.mediaSession.setPositionState({
          duration: d,
          playbackRate: Number(state.learnMode ? state.learnRate : 1) || 1,
          position: Math.max(0, Math.min(d, t))
        });
      }
      postNowPlaying(false);
    } catch (ePos) {}
  }
  function syncMediaSession() {
    if (!state.playing && !state.sessionActive) {
      if (navigator.mediaSession) {
        try {
          navigator.mediaSession.playbackState = "none";
          try { navigator.mediaSession.metadata = null; } catch (e1) {}
          ["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"].forEach(function (act) {
            try { navigator.mediaSession.setActionHandler(act, null); } catch (e2) {}
          });
        } catch (eMs) {}
      }
      postNowPlaying(true);
      return;
    }
    if (!navigator.mediaSession) {
      postNowPlaying(!state.sessionActive);
      return;
    }
    try {
      if (!state.sessionActive) {
        navigator.mediaSession.playbackState = "none";
        try { navigator.mediaSession.metadata = null; } catch (e1) {}
        ["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"].forEach(function (act) {
          try { navigator.mediaSession.setActionHandler(act, null); } catch (e2) {}
        });
        postNowPlaying(true);
        return;
      }
      var m = meta || surahMeta(state.surah) || {};
      navigator.mediaSession.metadata = new MediaMetadata({
        title: (m.transliteration || "Qurʾān") + " · Āyah " + state.ayah,
        artist: reciterById(state.reciter).name,
        album: "DĀR AL TAWḤĪD",
        artwork: nowPlayingArtwork()
      });
      navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", function () { togglePlay(true); });
      navigator.mediaSession.setActionHandler("pause", function () { audioEl().pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { prevAyah(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextAyah(false); });
      navigator.mediaSession.setActionHandler("seekbackward", function () { skip(-10); });
      navigator.mediaSession.setActionHandler("seekforward", function () { skip(10); });
      try { navigator.mediaSession.setActionHandler("stop", function () { stopSession(); }); } catch (e3) {}
      try {
        navigator.mediaSession.setActionHandler("seekto", function (det) {
          var a = audioEl();
          if (!a || !det) return;
          if (typeof det.seekTime === "number") a.currentTime = det.seekTime;
        });
      } catch (eSeek) {}
      syncMediaPosition();
    } catch (e) {}
  }
  function audioHasSrc(a) {
    if (!a) return false;
    var src = String(a.currentSrc || a.getAttribute("src") || "");
    return src && src.indexOf("http") === 0;
  }
  function srcMatchesAyah(src, surah, ayah) {
    src = String(src || "");
    if (!src) return false;
    var packed = pad(surah, 3) + pad(ayah, 3);
    if (src.indexOf(packed) >= 0) return true;
    var g = String(globalAyah(surah, ayah));
    if (g && src.indexOf("/" + g + ".mp3") >= 0) return true;
    return false;
  }
  function hideFullPlayerUi() {
    var root = playerRoot();
    if (root) {
      root.hidden = true;
      root.style.display = "none";
      root.classList.remove("is-leaving");
      try { root.setAttribute("inert", ""); } catch (e) {}
      try { if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur(); } catch (e2) {}
    }
  }
  function dismissFullPlayer() {
    fullUiWanted = false;
    dismissUntil = Date.now() + 8000;
    hideFullPlayerUi();
  }
  function wantFullPlayer() {
    dismissUntil = 0;
    fullUiWanted = true;
  }
  function isFullPlayerRoute() {
    if (Date.now() < dismissUntil) return false;
    var hash = String(location.hash || "").replace(/^#\/?/, "");
    if (hash.split("/")[0] === "quran-player") return true;
    return document.documentElement.classList.contains("is-quran-player-route")
      || (document.body && document.body.classList.contains("is-quran-player-route"));
  }
  function playerRoot() {
    var nodes = document.querySelectorAll("#darQuranPlayer");
    if (!nodes.length) return null;
    var visible = null;
    var bodyOne = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.parentNode === document.body) bodyOne = n;
      if (!n.hidden && String(n.style.display || "") !== "none") visible = visible || n;
    }
    if (isFullPlayerRoute()) return visible || bodyOne || nodes[0];
    return bodyOne || visible || nodes[0];
  }
  function ensureFreshShell(root) {
    if (root && root.querySelector && root.querySelector(".dqp-back") && root.querySelector(".dqp-foot")) return root;
    var wrap = document.createElement("div");
    wrap.innerHTML = renderShell();
    var neu = wrap.firstElementChild;
    if (!neu) return root;
    if (root && root.parentNode) root.parentNode.replaceChild(neu, root);
    else if (document.body) document.body.appendChild(neu);
    return neu;
  }
  function navigateApp(view, value) {
    if (typeof window.navigateToTabRootReplace === "function") {
      window.navigateToTabRootReplace(view, value || "");
      return;
    }
    if (typeof window.navigate === "function") window.navigate(view, value || "", { noAnim: true, skipPush: true });
    else {
      var hash = "#" + view + (value ? "/" + value : "");
      try { history.replaceState(null, "", location.pathname + (location.search || "") + hash); } catch (e) { location.hash = hash; }
      try { window.dispatchEvent(new HashChangeEvent("hashchange")); } catch (e2) {}
    }
  }
  function leavePlayerRoute(kind) {
    persistCurrent("leave-full");
    writeMode("global-quran");
    dismissFullPlayer();
    function go() {
      document.documentElement.classList.remove("is-quran-player-route");
      if (document.body) {
        document.body.classList.remove("is-quran-player-route", "dar-quran-player-open");
      }
      var root = playerRoot();
      if (root) {
        root.hidden = true;
        root.style.display = "none";
        try { root.setAttribute("inert", ""); } catch (e0) {}
      }
      if (kind === "read") navigateApp("quran-surah", String(state.surah) + "/" + state.ayah);
      else navigateApp("home");
      try {
        if (kind !== "read") {
          history.replaceState(null, "", location.pathname + (location.search || "") + "#home");
        }
      } catch (e1) {}
      paintMini();
      setTimeout(function () {
        dismissFullPlayer();
        hideFullPlayerUi();
        if (kind !== "read") {
          var hash = String(location.hash || "").replace(/^#\/?/, "");
          if (hash.split("/")[0] === "quran-player") navigateApp("home");
        }
        paintMini();
      }, 40);
      setTimeout(function () {
        if (Date.now() < dismissUntil) {
          var hash2 = String(location.hash || "").replace(/^#\/?/, "");
          if (hash2.split("/")[0] === "quran-player") navigateApp(kind === "read" ? "quran-surah" : "home", kind === "read" ? String(state.surah) + "/" + state.ayah : "");
          hideFullPlayerUi();
          paintMini();
        }
      }, 280);
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
  function sleepLeftMs() {
    if (!sleepUntil) return 0;
    return Math.max(0, sleepUntil - Date.now());
  }
  function sleepLabel() {
    var left = sleepLeftMs();
    if (!left) return "Sleep-Timer";
    var s = Math.ceil(left / 1000);
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return "Sleep-Timer · " + mm + ":" + String(ss).padStart(2, "0");
  }
  function sleepClock() {
    var left = sleepLeftMs();
    if (!left) return "00:00";
    var s = Math.ceil(left / 1000);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function paintSleepLive() {
    var box = document.querySelector("[data-dqp-sleep-box]");
    if (!box) return;
    var on = sleepLeftMs() > 0;
    box.classList.toggle("is-on", on);
    var clock = box.querySelector("[data-dqp-sleep-clock]");
    var stateEl = box.querySelector("[data-dqp-sleep-state]");
    var sl = box.querySelector("[data-dqp=sleep-mins]");
    var nEl = box.querySelector("[data-dqp-sleep-n]");
    var shown = on ? Math.max(1, Math.ceil(sleepLeftMs() / 60000)) : sleepPicked;
    if (clock) clock.textContent = on ? sleepClock() : "— —";
    if (stateEl) stateEl.textContent = on ? "Aktiv · zählt herunter" : "Bereit";
    if (nEl) nEl.textContent = String(shown);
    if (sl && document.activeElement !== sl) {
      sl.value = String(shown);
      sl.style.setProperty("--dqp-fill", (shown / 60 * 100) + "%");
    }
    box.querySelectorAll("[data-dqp-opt^='sleep-']").forEach(function (b) {
      var id = String(b.getAttribute("data-dqp-opt") || "");
      if (id === "sleep-off") return;
      var mins = Number(id.slice(6));
      b.classList.toggle("is-on", !on && mins === sleepPicked);
    });
  }
  function clearSleepTimer() {
    sleepUntil = 0;
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
    paintSleepLive();
  }
  function fireSleepTimer() {
    if (!sleepUntil) return;
    sleepUntil = 0;
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
    paintSleepLive();
    stopSession();
  }
  function armSleepTimer(ms) {
    ms = Math.max(0, Number(ms) || 0);
    if (sleepWatch) {
      clearInterval(sleepWatch);
      sleepWatch = 0;
    }
    if (ms < 1000) {
      sleepUntil = 0;
      paintSleepLive();
      return;
    }
    sleepUntil = Date.now() + ms;
    sleepWatch = setInterval(function () {
      if (!sleepUntil) {
        clearInterval(sleepWatch);
        sleepWatch = 0;
        paintSleepLive();
        return;
      }
      paintSleepLive();
      if (Date.now() >= sleepUntil) fireSleepTimer();
    }, 250);
    paintSleepLive();
  }
  function setSleepMinutes(mins) {
    mins = Math.max(1, Math.min(60, Math.round(Number(mins) || 0)));
    sleepPicked = mins;
    armSleepTimer(mins * 60000);
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
    var show = (showLearningPlayer() || (!LEARN_PLAYER_ONLY && !!state.sessionActive)) && !isFullPlayerRoute();
    if (isReaderRoute()) {
      capsuleCollapsed = false;
      capsuleDimmed = false;
    }
    var collapsed = show && capsuleCollapsed;
    var expanded = show && !capsuleCollapsed;
    html.classList.toggle("player-active", show);
    html.classList.toggle("player-expanded", expanded);
    html.classList.toggle("player-collapsed", collapsed);
    html.classList.toggle("player-stopped", !show);
    html.classList.toggle("dar-quran-top-capsule-on", show);
    if (body) {
      body.classList.toggle("player-active", show);
      body.classList.toggle("player-expanded", expanded);
      body.classList.toggle("player-collapsed", collapsed);
      body.classList.toggle("player-stopped", !show);
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
    persistCurrent("open-full");
    if (LEARN_PLAYER_ONLY) {
      restoreLearning({ play: !!state.playing || !!(readLearn() && readLearn().isPlaying), from: "open-full-learn-only" });
      return;
    }
    restoreGlobalPlayer({ play: !!state.playing, from: "open-full" });
  }
  function waitForAyahRender(ayah) {
    return new Promise(function (resolve) {
      var n = 0;
      function tick() {
        if (document.getElementById("ayah-" + ayah)) return resolve(true);
        if (n > 50) return resolve(false);
        n += 1;
        setTimeout(tick, 80);
      }
      tick();
    });
  }
  function highlightAyah(ayah) {
    var el = document.getElementById("ayah-" + ayah);
    if (!el) return;
    el.classList.add("is-dqp-resume-flash");
    setTimeout(function () { try { el.classList.remove("is-dqp-resume-flash"); } catch (eH) {} }, 1600);
  }
  function restoreLearning(opts) {
    opts = opts || {};
    qlog("[QURAN_STATE] restore learning state", opts);
    var snap = readLearn();
    if (!applyLearnBlob(snap || {})) {
      var fallback = null;
      try {
        if (typeof window.getPreferredQuranProgress === "function") {
          var p = window.getPreferredQuranProgress();
          if (p && Number(p.surahNumber) >= 1) {
            fallback = {
              surahNumber: Number(p.surahNumber),
              ayahNumber: Number(p.ayahNumber) || 1,
              surahName: p.surahName || "",
              qari: state.reciter
            };
          }
        }
      } catch (eFb) {}
      if (!fallback) {
        fallback = { surahNumber: state.surah, ayahNumber: state.ayah, qari: state.reciter, currentTime: state.resumeAt };
      }
      applyLearnBlob(fallback);
    }
    enterLearnMode();
    writeMode("learning-quran");
    state.sessionActive = true;
    var s = state.surah;
    var a = state.ayah;
    var play = !!opts.play;
    qlog("[QURAN_ROUTE] restored surah/ayah", { mode: "learning-quran", surah: s, ayah: a, play: play });
    if (typeof window.openQuranSurah === "function") window.openQuranSurah(s, a, { scrollOffset: 0 });
    else if (typeof window.navigate === "function") window.navigate("quran-surah", s + "/" + a, { noAnim: true });
    else location.hash = "#quran-surah/" + s + "/" + a;
    waitForAyahRender(a).then(function () {
      if (typeof window.scrollToQuranAyah === "function") {
        try { window.scrollToQuranAyah(a, { behavior: "smooth", block: "center" }); } catch (eSc) {}
      } else revealPlayingAyah(true);
      highlightAyah(a);
      qlog("[QURAN_ROUTE] scrollToAyah complete", { ayah: a });
      if (play) {
        state.resumeAt = Number((snap && snap.currentTime) || state.resumeAt) || 0;
        loadAudio(true, true);
      } else {
        paintMini();
        markPlayingAyah();
      }
    });
  }
  function restoreGlobalPlayer(opts) {
    opts = opts || {};
    if (LEARN_PLAYER_ONLY) {
      restoreLearning({ play: !!opts.play, from: "global-blocked-learn-only" });
      return;
    }
    qlog("[QURAN_STATE] restore global player state", opts);
    var snap = readGlobal();
    applyGlobalBlob(snap);
    state.learnMode = false;
    writeMode("global-quran");
    wantFullPlayer();
    state.sessionActive = true;
    var value = String(state.surah) + "/" + String(state.ayah);
    qlog("[QURAN_ROUTE] restored surah/ayah", { mode: "global-quran", surah: state.surah, ayah: state.ayah });
    if (typeof window.navigate === "function") window.navigate("quran-player", value, { noAnim: true });
    else location.hash = "#quran-player/" + value;
    setTimeout(function () {
      wantFullPlayer();
      var a = audioEl();
      var hold = Number(state.resumeAt || state.current) || 0;
      if (opts.play) loadAudio(true, true);
      else if (!audioHasSrc(a)) loadAudio(false, true);
      else if (hold > 0.2) {
        try { a.currentTime = hold; } catch (eSeek) {}
      }
      paintMini();
    }, 40);
  }
  function launchGlobalPlayer() {
    persistCurrent("launch-global-icon");
    qlog("[QURAN_ROUTE] mode = global-quran", { from: "header-icon" });
    restoreGlobalPlayer({ play: false, from: "header-icon" });
  }
  function launchLearnPlayer() {
    qlog("[QURAN_ROUTE] mode = learning-quran", { from: "learn-launch-bar" });
    restoreLearning({ play: false, from: "learn-launch-bar" });
  }
  function launchPlayback() {
    launchGlobalPlayer();
  }
  function onPinnedPlayerClick() {
    persistCurrent("pinned-click");
    var mode = playerModeNow();
    qlog("[QURAN_ROUTE] pinned player clicked", { mode: mode, learn: !!state.learnMode, route: quranRouteName() });
    if (mode === "learning-quran" || state.learnMode) {
      if (isReaderRoute()) {
        revealPlayingAyah(true);
        highlightAyah(state.ayah);
        return;
      }
      restoreLearning({ play: !!state.playing, from: "pinned-learn" });
      return;
    }
    restoreGlobalPlayer({ play: !!state.playing, from: "pinned-global" });
  }
  function togglePlay(forcePlay) {
    if (LEARN_PLAYER_ONLY && !isQuranArea()) {
      cleanupLearningPlayerOnRouteLeave();
      return;
    }
    logAudio(forcePlay === true ? "play clicked" : "play/pause clicked", {
      surah: state.surah,
      ayah: state.ayah,
      qari: state.reciter
    });
    state.sessionActive = true;
    saveState();
    var a = audioEl();
    if (!audioHasSrc(a)) {
      loadAudio(true, true);
      return;
    }
    if (forcePlay === true || a.paused) {
      var hold = Number(state.resumeAt || state.current) || 0;
      if (hold > 0.2) {
        try {
          if (Math.abs((Number(a.currentTime) || 0) - hold) > 0.35) a.currentTime = hold;
        } catch (eHold) {}
      }
      state.playing = true;
      runPlay(a, playGen);
    } else {
      logAudio("pause clicked", snapAudio(a));
      a.pause();
    }
  }
  function stopSession() {
    playGen += 1;
    ignoreEndedUntil = Date.now() + 4000;
    trackHeard = false;
    allowAdvance = false;
    engine.started = false;
    stopProgressClock();
    if (engine.fallbackTimer) { clearTimeout(engine.fallbackTimer); engine.fallbackTimer = 0; }
    var hold = 0;
    try { hold = Number(audioEl().currentTime) || Number(state.current) || 0; } catch (eHold) { hold = Number(state.current) || 0; }
    persistCurrent("stop");
    state.sessionActive = false;
    state.playing = false;
    state.current = hold;
    state.resumeAt = hold;
    var a = document.getElementById("darQuranPlayerAudio");
    if (a) {
      try { a.pause(); } catch (e) {}
    }
    saveState();
    capsuleCollapsed = false;
    capsuleDimmed = false;
    clearSleepTimer();
    state.learnMode = false;
    state.learnLoop = false;
    state.learnStay = false;
    state.learnRate = 1;
    lastFollowKey = "";
    state.playerMode = "none";
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
      if (act === "learn-reciter") {
        e.preventDefault();
        openReciterSheet();
        return;
      }
      if (act === "prev") { e.preventDefault(); prevAyah(); return; }
      if (act === "next") { e.preventDefault(); nextAyah(false); return; }
      if (act === "vol") return;
      if (act === "open" || !act) {
        e.preventDefault();
        onPinnedPlayerClick();
        return;
      }
      onPinnedPlayerClick();
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
        var d = Number(a.duration) || Number(state.duration) || 0;
        if (d) a.currentTime = (Number(range.value) / 1000) * d;
        state.current = a.currentTime || 0;
        syncProgressSample(true);
        lastProgPct = -1;
        applyProgressVisual(state.current, d);
      });
      range.addEventListener("change", function () {
        seekLock = false;
        syncProgressSample(true);
        if (state.playing) startProgressClock();
        saveState();
      });
    }
    var prevBtn = el.querySelector("[data-dqp-mini=prev]");
    var nextBtn = el.querySelector("[data-dqp-mini=next]");
    if (prevBtn) {
      prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        prevAyah();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        nextAyah(false);
      });
    }
    var vol = el.querySelector("[data-dqp-mini=vol]");
    if (vol) {
      vol.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      vol.addEventListener("click", function (e) { e.stopPropagation(); });
      vol.addEventListener("input", function () {
        state.volume = Number(vol.value) / 100;
        applyVolume();
      });
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
          '<span class="dqp-top-knob-rail" aria-hidden="true"><span class="dqp-top-knob-shift"><span class="dqp-top-knob"></span></span></span>' +
          '<input class="dqp-top-range" data-dqp-mini="seek" type="range" min="0" max="1000" value="0" aria-label="Fortschritt">' +
        "</div>" +
        '<span class="dqp-top-time" data-dqp-mini-dur>00:00</span>' +
      "</div>" +
      '<div class="dqp-learn" data-dqp-learn hidden>' +
        '<button type="button" class="dqp-learn-btn dqp-learn-reciter" data-dqp-mini="learn-reciter" aria-label="Qāriʾ wählen"><span class="dqp-learn-lab">Qāriʾ</span></button>' +
        '<button type="button" class="dqp-learn-btn" data-dqp-mini="learn-loop" aria-pressed="true" aria-label="Āyah wiederholen"><span class="dqp-learn-lab">Wiederholen</span></button>' +
        '<button type="button" class="dqp-learn-btn" data-dqp-mini="learn-stay" aria-pressed="true" aria-label="Bei der Āyah bleiben"><span class="dqp-learn-lab">Bleiben</span></button>' +
        '<button type="button" class="dqp-learn-btn dqp-learn-rate" data-dqp-mini="learn-rate" aria-label="Tempo"><span class="dqp-learn-lab" data-dqp-learn-rate-lab>1×</span></button>' +
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
    if (
      !el.querySelector(".dqp-top-track") ||
      !el.querySelector(".dqp-top-knob-shift") ||
      !el.querySelector("[data-dqp-mini=seek]") ||
      !el.querySelector("[data-dqp-learn]") ||
      !el.querySelector(".dqp-learn-lab") ||
      !el.querySelector("[data-dqp-mini=learn-reciter]") ||
      !el.querySelector("[data-dqp-mini=pause]") ||
      !el.querySelector("[data-dqp-mini=stop]") ||
      el.querySelector("[data-dqp-mini=prev]") ||
      el.querySelector("[data-dqp-mini=vol]")
    ) {
      el.innerHTML = miniMarkup();
      el.dataset.dqpMiniBound = "";
      invalidateProgressCache();
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
    var show = ((showLearningPlayer() || (!LEARN_PLAYER_ONLY && !!state.sessionActive)) && !onFull);
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
    var pv = el.querySelector("[data-dqp-mini=prev]");
    var nx = el.querySelector("[data-dqp-mini=next]");
    if (pv) pv.innerHTML = icon("prev");
    if (nx) nx.innerHTML = icon("next");
    var volIco = el.querySelector(".dqp-top-vol-ico");
    if (volIco) volIco.innerHTML = icon("volmin");
    var vol = el.querySelector("[data-dqp-mini=vol]");
    if (vol) vol.value = String(Math.round((Number(state.volume) || 1) * 100));
    applyLearnChrome();
    var learn = el.querySelector("[data-dqp-learn]");
    var recBtn = el.querySelector("[data-dqp-mini=learn-reciter]");
    var loopBtn = el.querySelector("[data-dqp-mini=learn-loop]");
    var stayBtn = el.querySelector("[data-dqp-mini=learn-stay]");
    var rateBtn = el.querySelector("[data-dqp-mini=learn-rate]");
    if (recBtn) recBtn.setAttribute("title", reciterById(state.reciter).name);
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
      var rateLab = rateBtn.querySelector("[data-dqp-learn-rate-lab]") || rateBtn;
      rateLab.textContent = String(rate).replace(/\.00$/, "") + "×";
      rateBtn.classList.toggle("is-on", rate !== 1);
    }
    if (b && state.learnMode && isReaderRoute()) {
      b.textContent = "Lernen · Āyah " + state.ayah;
    }
    markPlayingAyah();
    paintMiniProgress();
    syncMediaSession();
    if (state.learnMode && !state.learnLoop) followPlayingAyah(false);
  }
  function bindLearnSheet(sh) {
    if (!sh || sh.dataset.dqpSheetBound === "1") return;
    sh.dataset.dqpSheetBound = "1";
    sh.addEventListener("click", function (ev) {
      if (ev.target === sh) { closeSheet(); return; }
      var t = ev.target.closest ? ev.target.closest("[data-dqp],[data-dqp-opt]") : null;
      if (!t || !sh.contains(t)) return;
      ev.preventDefault();
      ev.stopPropagation();
      var act = t.getAttribute("data-dqp");
      if (act === "sheet-close") { closeSheet(); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    });
  }
  function learnSheet() {
    var sh = document.getElementById("dqpLearnSheet");
    if (!sh) {
      sh = document.createElement("div");
      sh.id = "dqpLearnSheet";
      sh.className = "dqp-sheet dqp-learn-sheet";
      sh.setAttribute("data-dqp-sheet", "");
      sh.hidden = true;
      if (document.body) document.body.appendChild(sh);
    }
    bindLearnSheet(sh);
    return sh;
  }
  function closeSheet() {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (!sh) return;
    sh.classList.remove("is-open");
    setTimeout(function () { sh.hidden = true; sh.innerHTML = ""; }, 280);
  }
  function openSheet(title, html) {
    var sh = document.querySelector("[data-dqp-sheet]");
    if (!sh) sh = learnSheet();
    if (!sh) return;
    bindLearnSheet(sh);
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
  function pickRandomReciter() {
    var tries = 0;
    var id = RECITERS[Math.floor(Math.random() * RECITERS.length)].id;
    while (tries < 8) {
      var key = id + ":" + state.surah + ":" + state.ayah;
      if (availCache[key] !== false) return id;
      id = RECITERS[Math.floor(Math.random() * RECITERS.length)].id;
      tries += 1;
    }
    return FALLBACK_QARI;
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
    if (!keepReciter && (state.shuffle === "reciter" || state.shuffle === "both")) state.reciter = pickRandomReciter();
    writeHash();
    loadAudio(!!autoplay || state.playing, false);
    ensureData().then(function () {
      paintInfo();
      paintAyah(false);
    });
  }
  function ayahCount(surah) {
    var list = (window.quranMeta && window.quranMeta.surahs) || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(surah)) return Number(list[i].total_verses) || 1;
    }
    return totalAyat();
  }
  async function nextAyah(fromEnd) {
    logAudio(fromEnd ? "advance after ended" : "next clicked", { surah: state.surah, ayah: state.ayah, qari: state.reciter });
    var guard = 0;
    var surah = state.surah;
    var ayah = state.ayah;
    var qari = state.reciter;
    if (state.shuffle === "reciter" || state.shuffle === "both") qari = pickRandomReciter();
    while (guard < 24) {
      guard += 1;
      if (ayah < ayahCount(surah)) ayah += 1;
      else if (state.repeat === "surah") ayah = 1;
      else if (state.shuffle === "surah" || state.shuffle === "both") {
        surah = pickRandomSurah();
        ayah = 1;
      } else if (surah < 114) {
        surah += 1;
        ayah = 1;
      } else {
        surah = 1;
        ayah = 1;
      }
      if (state.shuffle === "reciter" || state.shuffle === "both") qari = pickRandomReciter();
      var hit = await resolvePlayable(qari, surah, ayah);
      if (hit) {
        state.reciter = hit.qari;
        var keepPlay = fromEnd ? true : !!state.playing;
        if (surah !== state.surah) return gotoSurah(surah, ayah, keepPlay, true);
        return gotoAyah(ayah, keepPlay);
      }
    }
    missingAudioHalt(state.reciter, state.surah, state.ayah, engine.lastUrl);
  }
  async function prevAyah() {
    logAudio("previous clicked", { surah: state.surah, ayah: state.ayah, qari: state.reciter });
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
    openSheet("Qāriʾ", '<div class="dqp-opt-list">' + RECITERS.map(function (r) {
      var key = r.id + ":" + state.surah + ":" + state.ayah;
      var mark = availCache[key] === false ? "nicht verfügbar" : (r.id === FALLBACK_QARI ? "vollständig" : "");
      return '<button type="button" class="dqp-opt' + (r.id === state.reciter ? " is-on" : "") + '" data-dqp-opt="r-' + r.id + '"><span class="dqp-opt-name">' + esc(r.name) + "</span>" + (mark ? '<span class="dqp-opt-meta">' + esc(mark) + "</span>" : "") + "</button>";
    }).join("") + "</div>");
  }
  function openMenu() {
    openSheet("Optionen", [
      '<div class="dqp-text-panel">',
      '<div class="dqp-text-modes">',
      '<button type="button" class="dqp-opt-chip' + (state.layers.ar ? " is-on" : "") + '" data-dqp-opt="m-layer-ar">Arabisch</button>',
      '<button type="button" class="dqp-opt-chip' + (state.layers.de ? " is-on" : "") + '" data-dqp-opt="m-layer-de">Deutsch</button>',
      '<button type="button" class="dqp-opt-chip' + (state.layers.lat ? " is-on" : "") + '" data-dqp-opt="m-layer-lat">Lautschrift</button>',
      '<button type="button" class="dqp-opt-chip' + (state.layers.tad ? " is-on" : "") + '" data-dqp-opt="m-layer-tad">Tadabbur</button>',
      '<button type="button" class="dqp-opt-chip' + (state.layers.taf ? " is-on" : "") + '" data-dqp-opt="m-layer-taf">Tafsīr</button>',
      "</div>",
      '<div class="dqp-text-label">Stufe <span data-dqp-scale-n>' + state.textScale + "</span> / 10</div>",
      '<div class="dqp-scale-row">',
      '<button type="button" class="dqp-scale-btn" data-dqp-opt="m-scale-minus" aria-label="Kleiner">−</button>',
      '<input class="dqp-scale-range" data-dqp="text-scale" type="range" min="1" max="10" step="1" value="' + state.textScale + '" aria-label="Textgröße">',
      '<button type="button" class="dqp-scale-btn" data-dqp-opt="m-scale-plus" aria-label="Größer">+</button>',
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
    var shown = sleepLeftMs() > 0 ? Math.max(1, Math.ceil(sleepLeftMs() / 60000)) : sleepPicked;
    openSheet("Sleep-Timer", [
      '<div class="dqp-sleep" data-dqp-sleep-box>',
      '<div class="dqp-sleep-clock" data-dqp-sleep-clock>' + (sleepLeftMs() > 0 ? sleepClock() : "— —") + "</div>",
      '<div class="dqp-sleep-state" data-dqp-sleep-state>' + (sleepLeftMs() > 0 ? "Aktiv · zählt herunter" : "Bereit") + "</div>",
      '<div class="dqp-sleep-presets">',
      [5, 15, 30, 50].map(function (m) {
        return '<button type="button" class="dqp-opt-chip' + (!sleepLeftMs() && m === sleepPicked ? " is-on" : "") + '" data-dqp-opt="sleep-' + m + '">' + m + " Min</button>";
      }).join(""),
      "</div>",
      '<div class="dqp-sleep-slide">',
      '<div class="dqp-sleep-slide-lab"><span>1 Min</span><span><b data-dqp-sleep-n>' + shown + "</b> Min</span><span>60 Min</span></div>",
      '<input class="dqp-sleep-range" data-dqp="sleep-mins" type="range" min="1" max="60" step="1" value="' + shown + '" aria-label="Minuten">',
      "</div>",
      '<button type="button" class="dqp-opt dqp-sleep-off" data-dqp-opt="sleep-off">Timer aus</button>',
      "</div>"
    ].join(""));
    paintSleepLive();
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
    if (id === "m-shuffle") {
      state.shuffle = cycle(SHUFFLE, state.shuffle);
      saveState();
      paintChrome();
      var shBtn = document.querySelector('[data-dqp-opt="m-shuffle"]');
      if (shBtn) shBtn.textContent = "Zufall · " + SHUFFLE_L[state.shuffle];
      return;
    }
    if (id === "m-repeat") {
      state.repeat = cycle(REPEAT, state.repeat);
      saveState();
      paintChrome();
      var rpBtn = document.querySelector('[data-dqp-opt="m-repeat"]');
      if (rpBtn) rpBtn.textContent = "Wiederholen · " + REPEAT_L[state.repeat];
      return;
    }
    if (id === "m-text") { openMenu(); return; }
    if (id.indexOf("m-layer-") === 0) {
      var key = id.slice(8);
      if (Object.prototype.hasOwnProperty.call(state.layers, key)) {
        state.layers[key] = !state.layers[key];
        if (!state.layers.ar && !state.layers.de && !state.layers.lat && !state.layers.tad && !state.layers.taf) {
          state.layers.ar = true;
        }
        state.text = state.layers.ar && state.layers.de ? "both" : (state.layers.ar ? "ar" : "de");
        saveState();
        paintChrome();
        paintAyah(false);
        document.querySelectorAll(".dqp-text-modes button").forEach(function (b) {
          var k = String(b.getAttribute("data-dqp-opt") || "").replace("m-layer-", "");
          b.classList.toggle("is-on", !!state.layers[k]);
        });
      }
      return;
    }
    if (id === "m-text-ar" || id === "m-text-de" || id === "m-text-both") {
      state.text = id === "m-text-ar" ? "ar" : id === "m-text-de" ? "de" : "both";
      state.layers.ar = state.text !== "de";
      state.layers.de = state.text !== "ar";
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
    if (id === "sleep-off") { clearSleepTimer(); return; }
    if (id.indexOf("sleep-") === 0) {
      setSleepMinutes(Number(id.slice(6)));
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
    root.style.display = "";
    try { root.removeAttribute("inert"); } catch (e) {}
    try {
      var extras = document.querySelectorAll("#darQuranPlayer");
      for (var xi = 0; xi < extras.length; xi++) {
        if (extras[xi] !== root) extras[xi].remove();
      }
    } catch (eX) {}
    invalidateProgressCache();
    if (state.playing || state.sessionActive) startProgressClock();
    paintProgress();
  }
  function bind(force) {
    var root = playerRoot();
    if (!root) return;
    root = ensureFreshShell(root);
    if (!root) return;
    if (!fullUiWanted) {
      hideFullPlayerUi();
      return;
    }
    mountPlayerPage(root);
    function syncLiveAudio() {
      seekLock = false;
      var a = audioEl();
      if (audioHasSrc(a)) {
        state.current = a.currentTime || 0;
        state.duration = audioDuration(a);
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
      if (act === "seek" || act === "vol" || act === "text-scale" || act === "sleep-mins") return;
      ev.stopPropagation();
      if (act === "min" || act === "home") { leavePlayerRoute("home"); return; }
      if (act === "play") { togglePlay(); return; }
      if (act === "prev") { if (holdSkip) { holdSkip = false; return; } prevAyah(); return; }
      if (act === "next") { if (holdSkip) { holdSkip = false; return; } nextAyah(false); return; }
      if (act === "back15") { skip(-15); return; }
      if (act === "fwd15") { skip(15); return; }
      if (act === "retry") { state.error = ""; loadAudio(true, false); return; }
      if (act === "sheet-close") { closeSheet(); return; }
      if (act === "menu") { openMenu(); return; }
      if (act === "sleep-apply") {
        var slp = root.querySelector("[data-dqp=sleep-mins]");
        setSleepMinutes(slp ? slp.value : sleepPicked);
        return;
      }
      if (act === "shuffle") { state.shuffle = cycle(SHUFFLE, state.shuffle); saveState(); paintChrome(); return; }
      if (act === "repeat") { state.repeat = cycle(REPEAT, state.repeat); saveState(); paintChrome(); return; }
      if (act === "text") { cycleTextQuick(); return; }
      if (act === "pick-surah") { openSurahSheet(); return; }
      if (act === "pick-reciter") { openReciterSheet(); return; }
      var opt = t.getAttribute("data-dqp-opt");
      if (opt) onOpt(opt);
    }
    root.addEventListener("click", onPlayerAction);
    root.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
      onPlayerAction(ev);
    });
    root.addEventListener("input", function (ev) {
      if (ev.target && ev.target.getAttribute("data-dqp") === "text-scale") {
        setTextScale(ev.target.value);
        return;
      }
      if (ev.target && ev.target.getAttribute("data-dqp") === "sleep-mins") {
        setSleepMinutes(ev.target.value);
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
    bindVolumeSlider(root);
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
    var swipeFromText = false;
    root.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches[0]) return;
      var t = e.target;
      if (t.closest && (t.closest("[data-dqp-sheet]") || t.closest("input") || t.closest(".dqp-range") || t.closest(".dqp-top-range") || t.closest("button") || t.closest(".dqp-meta") || t.closest(".dqp-progress") || t.closest(".dqp-controls") || t.closest(".dqp-volume") || t.closest(".dqp-dock"))) {
        dismissY = null;
        swipeX = null;
        grabClose = false;
        swipeFromText = false;
        return;
      }
      grabClose = !!(t.closest && t.closest(".dqp-grab"));
      swipeFromText = !!(t.closest && t.closest("[data-dqp-ayah]"));
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
      if (!swipeFromText || swipeX == null) return;
      var dx = e.touches[0].clientX - swipeX;
      var dy = e.touches[0].clientY - swipeY;
      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2) e.preventDefault();
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
      var fromText = swipeFromText;
      dismissY = null;
      swipeX = null;
      swipeY = null;
      grabClose = false;
      swipeFromText = false;
      if (grab && (ady > 22 || (adx < 14 && ady < 14))) {
        leavePlayerRoute("home");
        return;
      }
      if (fromText && adx > 48 && adx > ady * 1.15) {
        if (dx < 0) nextAyah(false);
        else prevAyah();
      }
    }, { passive: true });
    paintChrome();
    paintProgress();
  }

  if (!window.__dqpHomeGuard) {
    window.__dqpHomeGuard = true;
    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("#darQuranPlayer .dqp-back, #darQuranPlayer [data-dqp=home], #darQuranPlayer [data-dqp=min]") : null;
      if (!t) return;
      ev.preventDefault();
      ev.stopPropagation();
      leavePlayerRoute("home");
    }, true);
  }

  window.DARQuranPlayer = {
    __build: PLAYER_BUILD,
    render: function (value) {
      if (LEARN_PLAYER_ONLY) return "";
      if (Date.now() < dismissUntil) return "";
      wantFullPlayer();
      loadState({ keepLiveSession: true });
      var parts = String(value || "").split("/").filter(Boolean);
      if (parts.length) parseRoute(value);
      return renderShell();
    },
    bind: function () {
      if (LEARN_PLAYER_ONLY) {
        hideFullPlayerUi();
        cleanupLearningPlayerOnRouteLeave();
        paintMini();
        return;
      }
      if (Date.now() < dismissUntil) {
        hideFullPlayerUi();
        paintMini();
        return;
      }
      var hash = String(location.hash || "").replace(/^#\/?/, "");
      var onPage = hash.split("/")[0] === "quran-player";
      if (!onPage) {
        fullUiWanted = false;
        hideFullPlayerUi();
        paintMini();
        return;
      }
      wantFullPlayer();
      var host = playerRoot();
      if (!host) { paintMini(); return; }
      if (host.dataset.ready === "1") { bind(false); paintMini(); return; }
      bind(false);
      ensureData().then(function () {
        var node = playerRoot();
        if (!node || !fullUiWanted) return;
        node.dataset.ready = "1";
        paintInfo();
        paintAyah(false);
        writeHash();
        var a = audioEl();
        var src = String(a.currentSrc || a.getAttribute("src") || "");
        if (audioHasSrc(a) && srcMatchesAyah(src, state.surah, state.ayah)) {
          seekLock = false;
          state.current = a.currentTime || 0;
          state.duration = audioDuration(a);
          state.playing = !a.paused;
          if (!a.paused || state.sessionActive) state.sessionActive = true;
          paintAyah(false);
          paintChrome();
          paintProgress();
        } else if (state.playing && !audioHasSrc(a)) {
          loadAudio(true, true);
        }
        paintMini();
      });
    },
    stop: stopSession,
    open: launchPlayback,
    playFromReader: playFromReader,
    revealPlayingAyah: revealPlayingAyah,
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
    },
    isQuranArea: isQuranArea,
    showLearningPlayer: showLearningPlayer,
    playerMode: function () { return playerModeNow(); },
    cleanupLearningPlayerOnRouteLeave: cleanupLearningPlayerOnRouteLeave,
    launchPlayback: launchPlayback,
    launchGlobalPlayer: launchGlobalPlayer,
    launchLearnPlayer: launchLearnPlayer,
    restoreLearning: function (play) { restoreLearning({ play: !!play, from: "api" }); },
    learnResume: readLearn,
    persistNow: persistCurrent
  };

  window.DARQuranAudio = {
    playAyah: function (opts) {
      opts = opts || {};
      if (opts.qariId) state.reciter = reciterById(opts.qariId).id;
      if (Number(opts.surahNumber) >= 1) state.surah = Number(opts.surahNumber);
      if (Number(opts.ayahNumber) >= 1) state.ayah = Number(opts.ayahNumber);
      if (LEARN_PLAYER_ONLY || isQuranArea()) {
        playFromReader(state.surah, state.ayah);
        return;
      }
      state.resumeAt = 0;
      saveState();
      loadAudio(true, false);
    },
    pause: function () { audioEl().pause(); },
    resume: function () { togglePlay(true); },
    stop: stopSession,
    nextAyah: function () { return nextAyah(false); },
    previousAyah: function () { return prevAyah(); },
    seek: function (seconds) {
      var a = audioEl();
      a.currentTime = Math.max(0, Number(seconds) || 0);
    },
    setVolume: function (value) {
      state.volume = value;
      applyVolume();
    },
    getState: function () {
      var a = audioEl();
      return {
        isSessionActive: !!state.sessionActive,
        isLoading: a.readyState < 3 && !!audioHasSrc(a) && state.playing,
        isPlaying: !!state.playing && !a.paused,
        currentSurah: state.surah,
        currentAyah: state.ayah,
        currentQari: reciterById(state.reciter).id,
        currentUrl: engine.lastUrl || String(a.currentSrc || ""),
        currentTime: state.current,
        duration: state.duration,
        error: state.error || ""
      };
    }
  };

  loadState();
  ensureTadCatalog();
  function resumeVisibleSession() {
    loadState({ keepLiveSession: true });
    if (LEARN_PLAYER_ONLY && !isQuranArea()) {
      cleanupLearningPlayerOnRouteLeave();
      paintMini();
      return;
    }
    if (state.sessionActive && !LEARN_PLAYER_ONLY && readMode() === "global-quran") {
      var a = audioEl();
      if (!audioHasSrc(a) && state.playing) loadAudio(true, true);
    }
    paintMini();
  }
  var persistBeat = 0;
  function armPersistBeat() {
    if (persistBeat) return;
    persistBeat = setInterval(function () {
      if (state.playing || state.sessionActive || state.learnMode) persistCurrent("heartbeat");
    }, 4000);
  }
  armPersistBeat();
  function onRoutePaint() {
    if (routePaintT) clearTimeout(routePaintT);
    routePaintT = setTimeout(function () {
      routePaintT = 0;
      persistCurrent("route");
      cleanupLearningPlayerOnRouteLeave();
      paintMini();
    }, 0);
  }
  var routePaintT = 0;
  window.addEventListener("hashchange", onRoutePaint);
  window.addEventListener("popstate", onRoutePaint);
  var learnTapAt = 0;
  function onLearnLaunchTap(ev) {
    var learnBar = ev.target && ev.target.closest ? ev.target.closest(".qov-learn-launch, [data-dqp-learn-resume], [data-qov-learn-launch], #qovLearnLaunchBtn") : null;
    if (!learnBar) return false;
    ev.preventDefault();
    ev.stopPropagation();
    var now = Date.now();
    if (now - learnTapAt < 450) return true;
    learnTapAt = now;
    launchLearnPlayer();
    return true;
  }
  document.addEventListener("click", function (ev) {
    if (onLearnLaunchTap(ev)) return;
    var globalIcon = ev.target && ev.target.closest ? ev.target.closest(".qov-player-icon, [data-qa-action='quran-player']") : null;
    if (globalIcon && !globalIcon.closest(".qov-learn-launch, [data-dqp-learn-resume], [data-qov-learn-launch]")) {
      ev.preventDefault();
      ev.stopPropagation();
      launchGlobalPlayer();
      return;
    }
    var t = ev.target && ev.target.closest ? ev.target.closest("[data-nav],.bottom-nav-btn,a[href^='#']") : null;
    if (!t) return;
    if (t.closest && t.closest(".qov-learn-launch, [data-dqp-learn-resume], [data-qov-learn-launch]")) return;
    onRoutePaint();
    setTimeout(onRoutePaint, 48);
  }, true);
  document.addEventListener("pointerup", function (ev) {
    onLearnLaunchTap(ev);
  }, true);
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("[data-dqp-learn-resume]") : null;
    if (!btn) return;
    ev.preventDefault();
    restoreLearning({ play: false, from: "continue-card" });
  }, true);
  function watchQuranBodyClass() {
    if (!document.body || window.__dqpQuranBodyWatch) return;
    window.__dqpQuranBodyWatch = true;
    new MutationObserver(onRoutePaint).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(onRoutePaint).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  window.addEventListener("pageshow", function () { persistCurrent("pageshow"); resumeVisibleSession(); });
  window.addEventListener("pagehide", function () { persistCurrent("pagehide"); });
  window.addEventListener("beforeunload", function () { persistCurrent("beforeunload"); });
  document.addEventListener("visibilitychange", function () {
    persistCurrent("visibilitychange");
    if (document.visibilityState === "visible") resumeVisibleSession();
  });
  window.addEventListener("resize", function () {
    var el = document.querySelector("#darQuranPlayer [data-dqp-ayah]");
    if (el) fitAyah(el);
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      watchQuranBodyClass();
      cleanupLearningPlayerOnRouteLeave();
      paintMini();
    }, { once: true });
  } else {
    watchQuranBodyClass();
    cleanupLearningPlayerOnRouteLeave();
    paintMini();
  }
})();
