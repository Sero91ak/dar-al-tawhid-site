(function () {
  "use strict";
  if (window.DARQuranLearnStudio && window.__DAR_QURAN_LEARN_STUDIO === 2) return;
  window.__DAR_QURAN_LEARN_STUDIO = 2;

  var KEY = "darQuranLearnStudioV1";
  var AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  var session = 0;
  var state = {
    open: false, surah: 1, ayah: 1, verse: null, meta: null,
    words: [], marks: [], listenOn: false, speakOn: false,
    recorded: false, passed: false, heard: "", clock: 0
  };
  var audioEl = null;
  var recStream = null;
  var rec = null;
  var recChunks = [];
  var recTimer = 0;
  var recStarted = 0;
  var recOk = false;
  var recog = null;
  var meterRaf = 0;
  var analyser = null;
  var audioCtx = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
    });
  }
  function pad(n, w) { return String(n).padStart(w || 3, "0"); }
  function ayahCount(s) { return AYAH_COUNTS[Number(s) - 1] || 1; }
  function readStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function writeStore(patch) {
    var cur = readStore();
    Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
    cur.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    return cur;
  }
  function doneKey(s, a) { return String(s) + ":" + String(a); }
  function isDone(s, a) {
    var d = readStore().done || {};
    return !!d[doneKey(s, a)];
  }
  function markDone(s, a) {
    var d = readStore().done || {};
    d[doneKey(s, a)] = true;
    writeStore({ done: d, surah: s, ayah: a });
  }
  function doneCount(s) {
    var d = readStore().done || {};
    var n = 0, i, total = ayahCount(s);
    for (i = 1; i <= total; i++) if (d[doneKey(s, i)]) n += 1;
    return n;
  }

  function stripAr(s) {
    return String(s || "")
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
      .replace(/ـ/g, "")
      .replace(/ٱ/g, "ا")
      .replace(/[أإآ]/g, "ا")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[^\u0621-\u064A\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function stripLat(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[ʾʼ'`´]/g, "")
      .replace(/[āáàâ]/g, "a").replace(/[īíìî]/g, "i").replace(/[ūúùû]/g, "u")
      .replace(/ḥ/g, "h").replace(/ḫ|kh/g, "kh").replace(/ʿ|ʻ/g, "")
      .replace(/ġ|gh/g, "gh").replace(/ṣ/g, "s").replace(/ḍ/g, "d")
      .replace(/ṭ/g, "t").replace(/ẓ/g, "z").replace(/š|sh/g, "sh")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function tokens(s, kind) {
    var n = kind === "ar" ? stripAr(s) : stripLat(s);
    return n ? n.split(" ").filter(Boolean) : [];
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, prev = new Array(n + 1), cur = new Array(n + 1), j, i, t;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  function sim(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    return Math.max(0, 1 - lev(a, b) / Math.max(a.length, b.length));
  }
  function scorePair(expectedAr, expectedLat, heard) {
    var ha = stripAr(heard), hl = stripLat(heard);
    var ea = stripAr(expectedAr), el = stripLat(expectedLat);
    return Math.max(sim(ea, ha), sim(el, hl), sim(ea, hl), sim(el, ha));
  }

  function splitWords(verse) {
    var ar = String((verse && verse.ar) || "").trim().split(/\s+/).filter(Boolean);
    var latSrc = "";
    if (verse && verse.transliteration) {
      latSrc = verse.transliteration.readable || verse.transliteration.standard || verse.transliteration.scientific || "";
    }
    if (!latSrc) latSrc = verse && (verse.tr_readable || verse.tr) || "";
    var lat = String(latSrc).trim().split(/\s+/).filter(Boolean);
    var tw = Array.isArray(verse && verse.tr_words) ? verse.tr_words : [];
    return ar.map(function (w, i) {
      var latin = "";
      if (tw[i] && (tw[i].readable || tw[i].text || tw[i].tr)) latin = tw[i].readable || tw[i].text || tw[i].tr;
      else latin = lat[i] || "";
      return { ar: w, lat: latin };
    });
  }

  function alignHeard(heardText) {
    var words = state.words;
    var marks = words.map(function () { return "wait"; });
    var arHeard = tokens(heardText, "ar");
    var latHeard = tokens(heardText, "lat");
    var heard = arHeard.length >= latHeard.length ? arHeard : latHeard;
    var i = 0, h = 0;
    while (i < words.length && h < heard.length) {
      var best = 0, bestJ = h, j;
      for (j = h; j < Math.min(heard.length, h + 3); j++) {
        var s = scorePair(words[i].ar, words[i].lat, heard[j]);
        if (s > best) { best = s; bestJ = j; }
      }
      if (best >= 0.82) { marks[i] = "ok"; i += 1; h = bestJ + 1; }
      else if (best >= 0.55) { marks[i] = "near"; i += 1; h = bestJ + 1; }
      else if (h === heard.length - 1) { marks[i] = state.speakOn ? "now" : "bad"; break; }
      else h += 1;
    }
    if (i < words.length && state.speakOn) marks[i] = marks[i] === "wait" ? "now" : marks[i];
    if (!state.speakOn && heard.length) {
      for (; i < words.length; i++) if (marks[i] === "wait") marks[i] = "bad";
    }
    state.marks = marks;
    state.heard = heardText;
    paintWords();
  }

  function ensureRoot() {
    var el = $("dqlRoot");
    if (el) return el;
    el = document.createElement("div");
    el.id = "dqlRoot";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="dql-shell">' +
        '<div class="dql-head">' +
          '<button type="button" data-dql="close" aria-label="Schließen">←</button>' +
          '<div class="dql-meta"><b data-dql="title">Qurʾān</b><small data-dql="sub">Lernen</small></div>' +
          '<button type="button" data-dql="prev" aria-label="Vorherige Āyah">‹</button>' +
          '<button type="button" data-dql="next" aria-label="Nächste Āyah">›</button>' +
        "</div>" +
        '<div class="dql-prog" aria-hidden="true"><i data-dql="bar"></i></div>' +
        '<div class="dql-body">' +
          '<div class="dql-ar" data-dql="ar" lang="ar" dir="rtl"></div>' +
          '<div class="dql-lat" data-dql="lat"></div>' +
          '<div class="dql-de" data-dql="de"></div>' +
          '<div class="dql-status" data-dql="status">Tippe auf HÖREN, dann auf SPRECHEN.</div>' +
          '<div class="dql-mic" data-dql="mic">' +
            '<div class="dql-mic-top"><span><span class="dql-dot"></span><span data-dql="micState">Mikrofon bereit</span></span><span data-dql="clock">00:00</span></div>' +
            '<div class="dql-meter"><i data-dql="level"></i></div>' +
          "</div>" +
        "</div>" +
        '<div class="dql-actions">' +
          '<button type="button" class="dql-listen" data-dql="listen">HÖREN</button>' +
          '<button type="button" class="dql-speak" data-dql="speak">SPRECHEN</button>' +
        "</div>" +
        '<div class="dql-after" data-dql="after">' +
          '<button type="button" data-dql="retry">NOCHMAL SPRECHEN</button>' +
          '<button type="button" class="dql-done" data-dql="done">GESCHAFFT</button>' +
        "</div>" +
        '<div class="dql-nav">' +
          '<button type="button" data-dql="prev2">Zurück</button>' +
          '<button type="button" data-dql="next2">Weiter</button>' +
        "</div>" +
      "</div>" +
      '<audio id="dqlAudio" playsinline webkit-playsinline preload="auto"></audio>';
    document.body.appendChild(el);
    el.addEventListener("click", onClick);
    audioEl = $("dqlAudio");
    audioEl.addEventListener("playing", function () {
      state.listenOn = true;
      paintListen();
      setStatus("Rezitation läuft …", "");
    });
    audioEl.addEventListener("pause", function () {
      state.listenOn = false;
      paintListen();
    });
    audioEl.addEventListener("ended", function () {
      state.listenOn = false;
      paintListen();
      setStatus("Gehört. Tippe auf SPRECHEN.", "ok");
    });
    audioEl.addEventListener("error", function () { tryFallback(); });
    return el;
  }

  function setStatus(text, kind) {
    var el = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=status]");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-err", kind === "err");
    el.classList.toggle("is-ok", kind === "ok");
  }
  function paintListen() {
    var btn = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=listen]");
    if (btn) {
      btn.textContent = state.listenOn ? "STOPP" : "HÖREN";
      btn.classList.toggle("is-on", !!state.listenOn);
    }
  }
  function paintSpeak() {
    var root = $("dqlRoot");
    if (!root) return;
    var btn = root.querySelector("[data-dql=speak]");
    var mic = root.querySelector("[data-dql=mic]");
    if (btn) {
      btn.textContent = state.speakOn ? "STOPP" : "SPRECHEN";
      btn.classList.toggle("is-on", !!state.speakOn);
    }
    if (mic) {
      mic.classList.toggle("is-live", !!state.speakOn && recOk);
      mic.classList.toggle("is-err", !recOk && state.speakOn === false && mic.classList.contains("was-err"));
    }
  }
  function paintWords() {
    var box = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=ar]");
    if (!box) return;
    box.classList.toggle("long", state.words.length > 14);
    box.innerHTML = state.words.map(function (w, i) {
      var m = state.marks[i] || "wait";
      var cls = m === "ok" ? "is-ok" : m === "near" ? "is-near" : m === "bad" ? "is-bad" : m === "now" ? "is-now" : "";
      return '<span class="dql-word ' + cls + '">' + esc(w.ar) + "</span>";
    }).join(" ");
  }
  function paintMeta() {
    var root = $("dqlRoot");
    if (!root) return;
    var name = (state.meta && (state.meta.transliteration || state.meta.name)) || ("Sūrah " + state.surah);
    root.querySelector("[data-dql=title]").textContent = name;
    var total = ayahCount(state.surah);
    var done = doneCount(state.surah);
    root.querySelector("[data-dql=sub]").textContent = "Āyah " + state.ayah + " / " + total + " · gelernt " + done + "/" + total;
    var bar = root.querySelector("[data-dql=bar]");
    if (bar) bar.style.width = Math.round((done / Math.max(1, total)) * 100) + "%";
    var lat = root.querySelector("[data-dql=lat]");
    var de = root.querySelector("[data-dql=de]");
    var showLat = true, showDe = true;
    try {
      var vs = JSON.parse(localStorage.getItem("quranViewSettingsV1") || "{}");
      if (vs && vs.showTransliteration === false) showLat = false;
      if (vs && vs.showGerman === false) showDe = false;
    } catch (e) {}
    var v = state.verse || {};
    var latTxt = "";
    if (v.transliteration) latTxt = v.transliteration.readable || v.transliteration.standard || v.transliteration.scientific || "";
    if (!latTxt) latTxt = v.tr_readable || v.tr || "";
    lat.hidden = !showLat;
    de.hidden = !showDe;
    lat.textContent = showLat ? latTxt : "";
    de.textContent = showDe ? String(v.de || "") : "";
    var after = root.querySelector("[data-dql=after]");
    after.classList.toggle("is-on", !!state.recorded && !state.speakOn);
  }

  function audioUrls(surah, ayah) {
    var reciter = { folder: "Alafasy_128kbps", edition: "ar.alafasy" };
    try {
      if (window.DARQuranPlayer && typeof window.DARQuranPlayer.getState === "function") {
        var st = window.DARQuranPlayer.getState();
        if (st && st.currentQari) {
          /* keep default; reciter folder map is in player */
        }
      }
    } catch (e) {}
    var s = pad(surah, 3), a = pad(ayah, 3);
    var g = 0, i;
    for (i = 1; i < surah; i++) g += AYAH_COUNTS[i - 1] || 0;
    g += ayah;
    var list = [
      "https://everyayah.com/data/" + reciter.folder + "/" + s + a + ".mp3"
    ];
    if (window.DARQuranAudioPack && typeof window.DARQuranAudioPack.url === "function") {
      list.push(window.DARQuranAudioPack.url(reciter.edition, g));
    }
    list.push("/quran-audio/" + reciter.edition + "/" + g + ".mp3");
    return list;
  }
  var urlI = 0;
  var urlList = [];
  function loadAudio() {
    urlI = 0;
    urlList = audioUrls(state.surah, state.ayah);
    if (!audioEl) audioEl = $("dqlAudio");
    audioEl.src = urlList[0];
  }
  function tryFallback() {
    urlI += 1;
    if (urlI >= urlList.length) {
      setStatus("Rezitation konnte nicht geladen werden.", "err");
      return;
    }
    audioEl.src = urlList[urlI];
    if (state.listenOn) audioEl.play().catch(function () {});
  }
  function stopAudio() {
    state.listenOn = false;
    try { audioEl.pause(); } catch (e) {}
    paintListen();
  }

  function stopMeter() {
    if (meterRaf) cancelAnimationFrame(meterRaf);
    meterRaf = 0;
  }
  function startMeter(stream) {
    stopMeter();
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (audioCtx) { try { audioCtx.close(); } catch (e0) {} }
      audioCtx = new Ctx();
      var src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      var data = new Uint8Array(analyser.frequencyBinCount);
      function draw() {
        if (!analyser) return;
        analyser.getByteFrequencyData(data);
        var sum = 0, i;
        for (i = 0; i < data.length; i++) sum += data[i];
        var pct = Math.max(4, Math.min(100, (sum / Math.max(1, data.length) / 80) * 100));
        var el = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=level]");
        if (el) el.style.width = pct.toFixed(1) + "%";
        meterRaf = requestAnimationFrame(draw);
      }
      draw();
    } catch (e) {}
  }
  function stopClock() {
    clearInterval(recTimer);
    recTimer = 0;
  }
  function startClock() {
    stopClock();
    recStarted = Date.now();
    var clock = $("dqlRoot").querySelector("[data-dql=clock]");
    clock.textContent = "00:00";
    recTimer = setInterval(function () {
      if (!recOk || !state.speakOn) return;
      var sec = Math.floor((Date.now() - recStarted) / 1000);
      clock.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
    }, 250);
  }
  function releaseMic() {
    stopClock();
    stopMeter();
    recOk = false;
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) {} }
    rec = null;
    if (recStream) {
      recStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e2) {} });
      recStream = null;
    }
    if (audioCtx) { try { audioCtx.close(); } catch (e3) {} audioCtx = null; }
  }
  function stopRecog() {
    if (recog) {
      try { recog.onresult = null; recog.onerror = null; recog.onend = null; recog.stop(); } catch (e) {}
      recog = null;
    }
  }
  function stopSpeak(keepEval) {
    state.speakOn = false;
    stopRecog();
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) {} }
    stopClock();
    paintSpeak();
    if (keepEval) {
      state.recorded = true;
      alignHeard(state.heard);
      var okN = state.marks.filter(function (m) { return m === "ok"; }).length;
      var nearN = state.marks.filter(function (m) { return m === "near"; }).length;
      setStatus("Auswertung: " + okN + " korrekt, " + nearN + " ähnlich, " + (state.words.length - okN - nearN) + " offen.", okN === state.words.length ? "ok" : "");
      paintMeta();
    }
  }

  function SpeechCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }
  function startRecog() {
    stopRecog();
    var Ctor = SpeechCtor();
    if (!Ctor) {
      setStatus("Live-Worterkennung ist auf diesem Gerät nicht verfügbar. Aufnahme läuft trotzdem.", "err");
      return;
    }
    var r = new Ctor();
    recog = r;
    r.lang = "ar-SA";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.onresult = function (ev) {
      if (!state.speakOn || session !== state._sid) return;
      var text = "";
      var i;
      for (i = 0; i < ev.results.length; i++) {
        text += " " + (ev.results[i][0] && ev.results[i][0].transcript || "");
      }
      alignHeard(text);
      setStatus("Ich höre: " + String(text).trim(), "");
    };
    r.onerror = function () {};
    r.onend = function () {
      if (state.speakOn && recog === r) {
        try { r.start(); } catch (e) {}
      }
    };
    try { r.start(); } catch (e) {}
  }

  function startSpeak() {
    var sid = ++session;
    state._sid = sid;
    stopAudio();
    stopSpeak(false);
    state.recorded = false;
    state.heard = "";
    state.marks = state.words.map(function () { return "wait"; });
    paintWords();
    paintMeta();
    var micState = $("dqlRoot").querySelector("[data-dql=micState]");
    var mic = $("dqlRoot").querySelector("[data-dql=mic]");
    mic.classList.remove("is-err", "was-err");
    if (window.isSecureContext === false) {
      mic.classList.add("is-err", "was-err");
      micState.textContent = "Mikrofon blockiert";
      setStatus("Mikrofon braucht eine sichere Verbindung.", "err");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mic.classList.add("is-err", "was-err");
      micState.textContent = "Kein Mikrofon";
      setStatus("Dieses Gerät stellt kein Mikrofon bereit.", "err");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      if (sid !== session) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        return;
      }
      var track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== "live") {
        stream.getTracks().forEach(function (t) { t.stop(); });
        mic.classList.add("is-err", "was-err");
        micState.textContent = "Kein Mikrofon-Signal";
        setStatus("Es wurde kein aktives Mikrofon gefunden.", "err");
        return;
      }
      recStream = stream;
      recOk = true;
      recChunks = [];
      state.speakOn = true;
      startMeter(stream);
      startClock();
      micState.textContent = "Aufnahme läuft";
      setStatus("Sprich die Āyah. Die Wörter gehen mit.", "");
      paintSpeak();
      startRecog();
      try {
        rec = new MediaRecorder(stream);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
        rec.start(250);
      } catch (eRec) {}
    }).catch(function (err) {
      recOk = false;
      state.speakOn = false;
      mic.classList.add("is-err", "was-err");
      var denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      micState.textContent = denied ? "Mikrofon gesperrt" : "Mikrofonfehler";
      setStatus(denied ? "Mikrofonzugriff ist nicht freigegeben." : "Mikrofon konnte nicht geöffnet werden.", "err");
      paintSpeak();
    });
  }

  function resetAyahRuntime() {
    session += 1;
    stopAudio();
    stopSpeak(false);
    releaseMic();
    stopRecog();
    state.listenOn = false;
    state.speakOn = false;
    state.recorded = false;
    state.passed = false;
    state.heard = "";
    recOk = false;
    var clock = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=clock]");
    if (clock) clock.textContent = "00:00";
    var micState = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=micState]");
    if (micState) micState.textContent = "Mikrofon bereit";
    var mic = $("dqlRoot") && $("dqlRoot").querySelector("[data-dql=mic]");
    if (mic) mic.classList.remove("is-live", "is-err", "was-err");
  }

  function applyVerse(verse, meta) {
    state.verse = verse;
    state.meta = meta;
    state.words = splitWords(verse);
    state.marks = state.words.map(function () { return "wait"; });
    paintWords();
    paintMeta();
    paintListen();
    paintSpeak();
    loadAudio();
    setStatus("Tippe auf HÖREN, dann auf SPRECHEN.", "");
  }

  async function loadAyah(surah, ayah, keepOpen) {
    surah = Math.max(1, Math.min(114, Number(surah) || 1));
    ayah = Math.max(1, Math.min(ayahCount(surah), Number(ayah) || 1));
    resetAyahRuntime();
    state.surah = surah;
    state.ayah = ayah;
    writeStore({ surah: surah, ayah: ayah });
    if (!keepOpen) ensureRoot();
    var box = $("dqlRoot").querySelector("[data-dql=ar]");
    box.textContent = "Wird geladen …";
    var verse = null, meta = null;
    try {
      if (typeof window.loadQuranSurah === "function") {
        var doc = await window.loadQuranSurah(surah);
        verse = ((doc && doc.verses) || []).find(function (v) { return Number(v.id) === ayah; }) || null;
        meta = doc || (typeof window.quranSurahMeta === "function" ? window.quranSurahMeta(surah) : null);
      }
    } catch (e) {}
    if (!verse) {
      box.textContent = "Āyah konnte nicht geladen werden.";
      setStatus("Text fehlt.", "err");
      return;
    }
    applyVerse(verse, meta || { transliteration: "", total_verses: ayahCount(surah) });
  }

  function toggleListen() {
    if (state.speakOn) stopSpeak(true);
    if (!audioEl) loadAudio();
    if (state.listenOn) {
      stopAudio();
      setStatus("Zuhören beendet.", "");
      return;
    }
    audioEl.play().then(function () {
      state.listenOn = true;
      paintListen();
    }).catch(function () {
      tryFallback();
      audioEl.play().catch(function () {
        setStatus("Wiedergabe wurde vom Gerät blockiert. Nochmal tippen.", "err");
      });
    });
  }

  function go(delta) {
    var nextA = state.ayah + delta;
    var s = state.surah;
    if (nextA < 1) {
      if (s <= 1) return;
      s -= 1;
      nextA = ayahCount(s);
    } else if (nextA > ayahCount(s)) {
      if (s >= 114) return;
      s += 1;
      nextA = 1;
    }
    loadAyah(s, nextA, true);
  }

  function completeAyah() {
    markDone(state.surah, state.ayah);
    state.passed = true;
    setStatus("Āyah gespeichert. Nächste Āyah wird geladen.", "ok");
    paintMeta();
    go(1);
  }

  function onClick(ev) {
    var t = ev.target.closest ? ev.target.closest("[data-dql]") : null;
    if (!t) return;
    var act = t.getAttribute("data-dql");
    if (act === "close") { close(); return; }
    if (act === "listen") { toggleListen(); return; }
    if (act === "speak") {
      if (state.speakOn) stopSpeak(true);
      else startSpeak();
      return;
    }
    if (act === "retry") { startSpeak(); return; }
    if (act === "done") { completeAyah(); return; }
    if (act === "prev" || act === "prev2") { go(-1); return; }
    if (act === "next" || act === "next2") { go(1); return; }
  }

  function lockBg(on) {
    document.documentElement.classList.toggle("dql-open", !!on);
    document.body.classList.toggle("dql-open", !!on);
    var view = $("appView");
    if (view) {
      if (on) view.setAttribute("inert", "");
      else view.removeAttribute("inert");
    }
  }

  function open(surah, ayah) {
    ensureRoot();
    var store = readStore();
    var s = Number(surah) || Number(store.surah) || 1;
    var a = Number(ayah) || Number(store.ayah) || 1;
    $("dqlRoot").classList.add("is-open");
    state.open = true;
    lockBg(true);
    loadAyah(s, a, true);
  }
  function close() {
    resetAyahRuntime();
    releaseMic();
    state.open = false;
    var el = $("dqlRoot");
    if (el) el.classList.remove("is-open");
    lockBg(false);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state.open) {
      stopAudio();
      stopSpeak(false);
      releaseMic();
      stopRecog();
    }
  });

  window.DARQuranLearnStudio = {
    open: open,
    close: close,
    isOpen: function () { return !!state.open; }
  };
})();
