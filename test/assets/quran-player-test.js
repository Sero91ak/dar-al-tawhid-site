/* DĀR AL TAWḤĪD — Test-App Qurʾān Player V1
   Dedicated test-only full-screen player. Visitor/live app is untouched. */
(function (global) {
  "use strict";
  if (global.__DAR_QURAN_PLAYER_TEST_V1__) return;
  global.__DAR_QURAN_PLAYER_TEST_V1__ = true;

  var ROOT_ID = "dar-quran-player-test";
  var ROUTE = "quran-player";
  var META_URL = "/content/quran/surahs.json";
  var SURAH_BASE = "/content/quran/";
  var AUDIO_BASE = "https://api.alquran.cloud/v1/surah/";
  var STORAGE_KEY = "darQuranPlayerTestV1";
  var FOLLOW_IDLE_MS = 3600;

  var RECITERS = [
    ["ar.alafasy","Mišārī Rāšid al-ʿAfāsī"],
    ["ar.sudais","ʿAbd ar-Raḥmān as-Sudays"],
    ["ar.shuraim","Saʿūd aš-Šuraym"],
    ["ar.mahermuaiqly","Māhir al-Muʿayqlī"],
    ["ar.minshawi","Muḥammad Ṣiddīq al-Minšāwī"],
    ["ar.abdulbasit","ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad"],
    ["ar.husary","Maḥmūd Ḫalīl al-Ḥuṣarī"],
    ["ar.hudhaify","ʿAlī al-Ḥuḏayfī"],
    ["ar.muhammadayoub","Muḥammad Ayyūb"],
    ["ar.ajamy","Aḥmad ibn ʿAlī al-ʿAǧamī"],
    ["ar.muhammadjibreel","Muḥammad Ǧibrīl"],
    ["ar.saadalghamdi","Saʿd al-Ġāmidī"],
    ["ar.shaatree","Abū Bakr aš-Šāṭirī"],
    ["ar.hanirifai","Hānī ar-Rifāʿī"],
    ["ar.abdullahbasfar","ʿAbdullāh Baṣfar"],
    ["ar.faresabbad","Fāris ʿAbbād"],
    ["ar.yasserdossari","Yāsir ad-Dawsarī"],
    ["ar.nasseralqatami","Nāṣir al-Qaṭāmī"],
    ["ar.salahalbudair","Ṣalāḥ al-Budayr"],
    ["ar.ibrahimakhbar","Ibrāhīm al-Aḫḍar"]
  ].map(function (x) { return { id: x[0], name: x[1] }; });

  var audio = new Audio();
  audio.preload = "metadata";
  audio.setAttribute("playsinline", "");
  var metadata = null;
  var surah = null;
  var audioMap = {};
  var requestToken = 0;
  var mounting = false;
  var followTimer = null;
  var saveTick = 0;
  var sheetType = "";
  var state = readState();

  function defaultState() {
    return {
      surah: 1,
      ayah: 1,
      reciter: "ar.alafasy",
      textMode: "both",
      shuffle: "off",
      repeat: "off",
      follow: true,
      position: 0
    };
  }

  function readState() {
    var d = defaultState();
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (raw && typeof raw === "object") Object.assign(d, raw);
    } catch (e) {}
    d.surah = Math.min(114, Math.max(1, Number(d.surah) || 1));
    d.ayah = Math.max(1, Number(d.ayah) || 1);
    if (!RECITERS.some(function (r) { return r.id === d.reciter; })) d.reciter = "ar.alafasy";
    if (!/^(ar|de|both)$/.test(d.textMode)) d.textMode = "both";
    if (!/^(off|surah|reciter|both)$/.test(d.shuffle)) d.shuffle = "off";
    if (!/^(off|surah|ayah)$/.test(d.repeat)) d.repeat = "off";
    return d;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function pad3(n) { return String(Number(n) || 1).padStart(3, "0"); }
  function routeName() { return String(location.hash || "#home").replace(/^#/, "").split(/[/?&]/)[0]; }
  function isPlayerRoute() { return routeName() === ROUTE; }
  function isQuranRoute() { return routeName() === "quran"; }
  function currentReciter() { return RECITERS.find(function (r) { return r.id === state.reciter; }) || RECITERS[0]; }
  function currentVerse() {
    if (!surah || !Array.isArray(surah.verses)) return null;
    return surah.verses.find(function (v) { return Number(v.id) === Number(state.ayah); }) || surah.verses[0] || null;
  }
  function currentSurahMeta() {
    var list = metadata && Array.isArray(metadata.surahs) ? metadata.surahs : [];
    return list.find(function (s) { return Number(s.id) === Number(state.surah); }) || null;
  }
  function totalAyahs() {
    return surah && Array.isArray(surah.verses) ? surah.verses.length : (currentSurahMeta()?.total_verses || 0);
  }

  function fmtTime(sec) {
    sec = Math.max(0, Number(sec) || 0);
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  async function fetchJSON(url) {
    var res = await fetch(url, { credentials: "same-origin", cache: "default" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  async function ensureMetadata() {
    if (metadata && Array.isArray(metadata.surahs)) return metadata;
    metadata = await fetchJSON(META_URL);
    if (!metadata || !Array.isArray(metadata.surahs) || metadata.surahs.length < 114) {
      throw new Error("Sūrah-Verzeichnis unvollständig");
    }
    return metadata;
  }

  async function loadAudioMap(surahNo, reciterId, token) {
    var url = AUDIO_BASE + encodeURIComponent(String(surahNo)) + "/" + encodeURIComponent(reciterId);
    var data = await fetchJSON(url);
    if (token !== requestToken) return null;
    var ayahs = data && data.data && Array.isArray(data.data.ayahs) ? data.data.ayahs : [];
    var map = {};
    ayahs.forEach(function (a) {
      if (a && a.numberInSurah && a.audio) map[Number(a.numberInSurah)] = a.audio;
    });
    if (!Object.keys(map).length) throw new Error("Keine Audio-Dateien für diesen Rezitator");
    return map;
  }

  async function loadSurah(opts) {
    opts = opts || {};
    var token = ++requestToken;
    setStatus("Qurʾān wird geladen…", false);
    try {
      await ensureMetadata();
      var sNo = Math.min(114, Math.max(1, Number(state.surah) || 1));
      var textPromise = fetchJSON(SURAH_BASE + pad3(sNo) + ".json");
      var audioPromise = loadAudioMap(sNo, state.reciter, token);
      var results = await Promise.all([textPromise, audioPromise]);
      if (token !== requestToken) return;
      surah = results[0];
      audioMap = results[1] || {};
      var max = Array.isArray(surah.verses) ? surah.verses.length : 1;
      state.ayah = Math.min(max, Math.max(1, Number(state.ayah) || 1));
      renderPlayerContent();
      await prepareAudio(!!opts.autoplay, opts.resume ? Number(state.position) || 0 : 0);
      setStatus("", false);
    } catch (err) {
      if (token !== requestToken) return;
      setStatus("Audio/Text konnte nicht geladen werden. Bitte Verbindung prüfen oder einen anderen Rezitator wählen.", true);
      renderDynamic();
    }
  }

  function expectedAudioURL() { return audioMap[Number(state.ayah)] || ""; }

  async function prepareAudio(autoplay, seekTo) {
    var src = expectedAudioURL();
    if (!src) {
      setStatus("Für diese Āyah ist keine Audiodatei verfügbar.", true);
      return;
    }
    var changed = audio.src !== src;
    if (changed) {
      audio.pause();
      audio.src = src;
      audio.load();
    }
    if (seekTo > 0) {
      var applySeek = function () {
        try { audio.currentTime = Math.min(seekTo, Math.max(0, (audio.duration || seekTo) - 0.1)); } catch (e) {}
      };
      if (audio.readyState >= 1) applySeek();
      else audio.addEventListener("loadedmetadata", applySeek, { once: true });
    }
    if (autoplay) {
      try { await audio.play(); } catch (e) {
        setStatus("Tippe auf Wiedergabe, um die Rezitation zu starten.", false);
      }
    }
    updateMediaSession();
    renderDynamic();
  }

  async function togglePlay() {
    if (!surah) return;
    if (audio.paused) {
      if (!expectedAudioURL()) await loadSurah({ autoplay: true });
      else {
        try { await audio.play(); } catch (e) { setStatus("Wiedergabe konnte nicht gestartet werden.", true); }
      }
    } else {
      audio.pause();
    }
    renderDynamic();
  }

  async function playAyah(n, autoplay) {
    var max = totalAyahs() || 1;
    state.ayah = Math.min(max, Math.max(1, Number(n) || 1));
    state.position = 0;
    state.follow = true;
    saveState();
    highlightCurrent(true);
    await prepareAudio(autoplay !== false, 0);
  }

  async function nextAyah(autoplay) {
    var max = totalAyahs() || 1;
    if (state.ayah < max) return playAyah(state.ayah + 1, autoplay !== false);
    if (state.repeat === "surah") {
      state.ayah = 1;
      state.position = 0;
      saveState();
      return playAyah(1, autoplay !== false);
    }
    await advanceSurah(autoplay !== false);
  }

  async function previousAyah() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (state.ayah > 1) return playAyah(state.ayah - 1, true);
    var target = state.surah > 1 ? state.surah - 1 : 114;
    state.surah = target;
    state.ayah = 1;
    state.position = 0;
    saveState();
    await loadSurah({ autoplay: true });
  }

  function randomDifferent(max, current) {
    if (max <= 1) return 1;
    var n = current;
    while (n === current) n = 1 + Math.floor(Math.random() * max);
    return n;
  }

  function randomReciter() {
    if (RECITERS.length < 2) return state.reciter;
    var next = state.reciter;
    while (next === state.reciter) next = RECITERS[Math.floor(Math.random() * RECITERS.length)].id;
    return next;
  }

  async function advanceSurah(autoplay) {
    if (state.shuffle === "surah" || state.shuffle === "both") state.surah = randomDifferent(114, state.surah);
    else state.surah = state.surah >= 114 ? 1 : state.surah + 1;
    if (state.shuffle === "reciter" || state.shuffle === "both") state.reciter = randomReciter();
    state.ayah = 1;
    state.position = 0;
    saveState();
    await loadSurah({ autoplay: autoplay !== false });
  }

  async function setSurah(n, autoplay) {
    state.surah = Math.min(114, Math.max(1, Number(n) || 1));
    state.ayah = 1;
    state.position = 0;
    saveState();
    closeSheet();
    await loadSurah({ autoplay: !!autoplay });
  }

  async function setReciter(id) {
    if (!RECITERS.some(function (r) { return r.id === id; })) return;
    var wasPlaying = !audio.paused;
    state.reciter = id;
    state.position = 0;
    saveState();
    closeSheet();
    await loadSurah({ autoplay: wasPlaying });
  }

  function setTextMode(mode) {
    if (!/^(ar|de|both)$/.test(mode)) return;
    state.textMode = mode;
    saveState();
    var root = document.getElementById(ROOT_ID);
    if (root) root.setAttribute("data-text-mode", mode);
    updateModeButtons();
  }

  function cycleRepeat() {
    state.repeat = state.repeat === "off" ? "surah" : state.repeat === "surah" ? "ayah" : "off";
    saveState();
    renderDynamic();
  }

  function setShuffle(mode) {
    if (!/^(off|surah|reciter|both)$/.test(mode)) return;
    state.shuffle = mode;
    saveState();
    closeSheet();
    renderDynamic();
  }

  function seek(delta) {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }

  function setProgress(value) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, (Number(value) / 1000) * audio.duration));
  }

  function disableFollowTemporarily() {
    state.follow = false;
    renderFollowButton();
    clearTimeout(followTimer);
    followTimer = setTimeout(function () {
      state.follow = true;
      renderFollowButton();
    }, FOLLOW_IDLE_MS);
  }

  function enableFollow() {
    clearTimeout(followTimer);
    state.follow = true;
    saveState();
    renderFollowButton();
    highlightCurrent(true);
  }

  function setStatus(message, isError) {
    var el = document.querySelector("#" + ROOT_ID + " .qpt-status");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-error", !!isError);
    el.hidden = !message;
  }

  function surahTitle(meta) {
    if (!meta) return "Sūrah " + state.surah;
    return "Sūrah " + (meta.transliteration || meta.name || state.surah);
  }

  function pageMarkup() {
    return '<div id="' + ROOT_ID + '" class="qpt" data-text-mode="' + esc(state.textMode) + '">' +
      '<header class="qpt-topbar">' +
        '<button class="qpt-icon-btn qpt-back" data-qpt-action="back" aria-label="Zurück zum Qurʾān">‹</button>' +
        '<div class="qpt-brand"><span>DĀR AL TAWḤĪD</span><strong>QURʾĀN PLAYER</strong></div>' +
        '<button class="qpt-icon-btn" data-qpt-action="more" aria-label="Player-Optionen">⋯</button>' +
      '</header>' +
      '<main class="qpt-stage">' +
        '<section class="qpt-now">' +
          '<div class="qpt-art" aria-hidden="true"><div class="qpt-art-lines"></div><div class="qpt-art-kicker">القرآن الكريم</div><div class="qpt-art-mark">۞</div></div>' +
          '<div class="qpt-now-meta">' +
            '<button class="qpt-pick qpt-surah-pick" data-qpt-action="surah-sheet"><span class="qpt-pick-label">Sūrah</span><strong id="qpt-surah-title">—</strong><span class="qpt-pick-arrow">⌄</span></button>' +
            '<button class="qpt-pick qpt-reciter-pick" data-qpt-action="reciter-sheet"><span class="qpt-pick-label">Rezitator</span><strong id="qpt-reciter-title">' + esc(currentReciter().name) + '</strong><span class="qpt-pick-arrow">⌄</span></button>' +
          '</div>' +
          '<div class="qpt-progress-wrap">' +
            '<input id="qpt-progress" class="qpt-progress" type="range" min="0" max="1000" step="1" value="0" aria-label="Wiedergabeposition">' +
            '<div class="qpt-time"><span id="qpt-time-current">0:00</span><span id="qpt-ayah-count">Āyah —</span><span id="qpt-time-total">0:00</span></div>' +
          '</div>' +
          '<div class="qpt-controls">' +
            '<button data-qpt-action="prev" aria-label="Vorherige Āyah">⏮</button>' +
            '<button data-qpt-action="back15" aria-label="15 Sekunden zurück"><span>↶</span><small>15</small></button>' +
            '<button class="qpt-play" data-qpt-action="play" aria-label="Wiedergabe"><span id="qpt-play-glyph">▶</span></button>' +
            '<button data-qpt-action="forward15" aria-label="15 Sekunden vor"><span>↷</span><small>15</small></button>' +
            '<button data-qpt-action="next" aria-label="Nächste Āyah">⏭</button>' +
          '</div>' +
          '<div class="qpt-tools">' +
            '<button id="qpt-shuffle-btn" data-qpt-action="shuffle-sheet"><span>⤨</span><small>Zufall</small></button>' +
            '<button id="qpt-repeat-btn" data-qpt-action="repeat"><span>↻</span><small>Wiederholen</small></button>' +
            '<button data-qpt-action="surah-sheet"><span>114</span><small>Sūrah</small></button>' +
            '<button data-qpt-action="reciter-sheet"><span>Q</span><small>Qāriʾ</small></button>' +
          '</div>' +
          '<div class="qpt-status" hidden></div>' +
        '</section>' +
        '<section class="qpt-reader">' +
          '<div class="qpt-reader-head">' +
            '<div><span class="qpt-reader-kicker">MITLESEN</span><strong>Synchron zur Rezitation</strong></div>' +
            '<div class="qpt-mode" role="group" aria-label="Textdarstellung">' +
              '<button data-qpt-mode="ar">عربي</button><button data-qpt-mode="de">Deutsch</button><button data-qpt-mode="both">Beides</button>' +
            '</div>' +
          '</div>' +
          '<div class="qpt-verses" id="qpt-verses"><div class="qpt-loading">Qurʾān wird geladen…</div></div>' +
          '<button id="qpt-follow" class="qpt-follow" data-qpt-action="follow" hidden>Zur aktuellen Āyah</button>' +
        '</section>' +
      '</main>' +
      '<div id="qpt-sheet-host"></div>' +
    '</div>';
  }

  function renderPlayerContent() {
    var root = document.getElementById(ROOT_ID);
    if (!root || !surah) return;
    var meta = currentSurahMeta();
    var title = root.querySelector("#qpt-surah-title");
    if (title) title.textContent = surahTitle(meta);
    var rec = root.querySelector("#qpt-reciter-title");
    if (rec) rec.textContent = currentReciter().name;
    var verses = root.querySelector("#qpt-verses");
    if (verses) {
      verses.innerHTML = surah.verses.map(function (v) {
        return '<article class="qpt-ayah" data-qpt-ayah="' + Number(v.id) + '" tabindex="0">' +
          '<div class="qpt-ayah-no"><span>' + Number(v.id) + '</span></div>' +
          '<div class="qpt-ayah-copy">' +
            '<p class="qpt-ar" dir="rtl" lang="ar">' + esc(v.ar) + '</p>' +
            '<p class="qpt-de" lang="de">' + esc(v.de) + '</p>' +
          '</div>' +
          '<button class="qpt-ayah-play" data-qpt-action="ayah-play" data-ayah="' + Number(v.id) + '" aria-label="Āyah ' + Number(v.id) + ' abspielen">▶</button>' +
        '</article>';
      }).join("");
    }
    updateModeButtons();
    renderDynamic();
    requestAnimationFrame(function () { highlightCurrent(true); });
  }

  function updateModeButtons() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.querySelectorAll("[data-qpt-mode]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-qpt-mode") === state.textMode);
    });
  }

  function renderFollowButton() {
    var el = document.getElementById("qpt-follow");
    if (el) el.hidden = !!state.follow;
  }

  function highlightCurrent(scroll) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.querySelectorAll(".qpt-ayah.is-current").forEach(function (el) { el.classList.remove("is-current"); });
    var target = root.querySelector('.qpt-ayah[data-qpt-ayah="' + Number(state.ayah) + '"]');
    if (target) {
      target.classList.add("is-current");
      if (scroll && state.follow) {
        try { target.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
      }
    }
    renderDynamic();
  }

  function repeatLabel() {
    return state.repeat === "ayah" ? "Āyah" : state.repeat === "surah" ? "Sūrah" : "Wiederholen";
  }
  function shuffleLabel() {
    return state.shuffle === "off" ? "Zufall" : state.shuffle === "surah" ? "Sūrah zufällig" : state.shuffle === "reciter" ? "Qāriʾ zufällig" : "Beides zufällig";
  }

  function renderDynamic() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var play = root.querySelector("#qpt-play-glyph");
    if (play) play.textContent = audio.paused ? "▶" : "Ⅱ";
    var count = root.querySelector("#qpt-ayah-count");
    if (count) count.textContent = "Āyah " + (Number(state.ayah) || 1) + " / " + (totalAyahs() || "—");
    var cur = root.querySelector("#qpt-time-current");
    var total = root.querySelector("#qpt-time-total");
    if (cur) cur.textContent = fmtTime(audio.currentTime);
    if (total) total.textContent = Number.isFinite(audio.duration) ? fmtTime(audio.duration) : "0:00";
    var slider = root.querySelector("#qpt-progress");
    if (slider && Number.isFinite(audio.duration) && audio.duration > 0) {
      slider.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    } else if (slider) slider.value = "0";
    var sh = root.querySelector("#qpt-shuffle-btn");
    if (sh) {
      sh.classList.toggle("is-active", state.shuffle !== "off");
      var small = sh.querySelector("small"); if (small) small.textContent = shuffleLabel();
    }
    var rp = root.querySelector("#qpt-repeat-btn");
    if (rp) {
      rp.classList.toggle("is-active", state.repeat !== "off");
      var rs = rp.querySelector("small"); if (rs) rs.textContent = repeatLabel();
    }
    renderFollowButton();
  }

  function renderSheet(type) {
    sheetType = type;
    var host = document.getElementById("qpt-sheet-host");
    if (!host) return;
    var body = "";
    var title = "";
    if (type === "surah") {
      title = "Sūrah auswählen";
      var list = metadata && Array.isArray(metadata.surahs) ? metadata.surahs : [];
      body = '<div class="qpt-sheet-search"><input id="qpt-sheet-search" type="search" placeholder="Sūrah suchen…" autocomplete="off"></div>' +
        '<div class="qpt-sheet-list" id="qpt-sheet-list">' +
        list.map(function (s) {
          var active = Number(s.id) === Number(state.surah) ? " is-active" : "";
          return '<button class="qpt-sheet-row' + active + '" data-qpt-select-surah="' + Number(s.id) + '" data-search="' + esc((s.id + " " + (s.transliteration || "") + " " + (s.name || "")).toLowerCase()) + '">' +
            '<span class="qpt-sheet-num">' + Number(s.id) + '</span><span class="qpt-sheet-main"><strong>' + esc(s.transliteration || ("Sūrah " + s.id)) + '</strong><small>' + esc(s.name || "") + ' · ' + Number(s.total_verses || 0) + ' Āyāt</small></span><span>›</span>' +
          '</button>';
        }).join("") + '</div>';
    } else if (type === "reciter") {
      title = "Rezitator auswählen";
      body = '<div class="qpt-sheet-search"><input id="qpt-sheet-search" type="search" placeholder="Rezitator suchen…" autocomplete="off"></div>' +
        '<div class="qpt-sheet-list" id="qpt-sheet-list">' +
        RECITERS.map(function (r, i) {
          var active = r.id === state.reciter ? " is-active" : "";
          return '<button class="qpt-sheet-row' + active + '" data-qpt-select-reciter="' + esc(r.id) + '" data-search="' + esc(r.name.toLowerCase()) + '">' +
            '<span class="qpt-sheet-num">' + (i + 1) + '</span><span class="qpt-sheet-main"><strong>' + esc(r.name) + '</strong><small>Qurʾān-Rezitation</small></span><span>›</span>' +
          '</button>';
        }).join("") + '</div>';
    } else if (type === "shuffle") {
      title = "Zufallswiedergabe";
      var opts = [["off","Aus"],["surah","Sūrah zufällig"],["reciter","Rezitator zufällig"],["both","Sūrah + Rezitator zufällig"]];
      body = '<div class="qpt-sheet-list qpt-sheet-list--short">' + opts.map(function (o) {
        return '<button class="qpt-sheet-row' + (state.shuffle === o[0] ? " is-active" : "") + '" data-qpt-select-shuffle="' + o[0] + '"><span class="qpt-radio">' + (state.shuffle === o[0] ? "●" : "○") + '</span><span class="qpt-sheet-main"><strong>' + esc(o[1]) + '</strong></span></button>';
      }).join("") + '</div>';
    } else return;
    host.innerHTML = '<div class="qpt-sheet-backdrop" data-qpt-action="close-sheet"></div><section class="qpt-sheet" aria-modal="true" role="dialog"><div class="qpt-sheet-grab"></div><header><strong>' + esc(title) + '</strong><button data-qpt-action="close-sheet" aria-label="Schließen">×</button></header>' + body + '</section>';
    var input = host.querySelector("#qpt-sheet-search");
    if (input) {
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 80);
      input.addEventListener("input", function () {
        var q = String(input.value || "").trim().toLowerCase();
        host.querySelectorAll("[data-search]").forEach(function (row) {
          row.hidden = q && !String(row.getAttribute("data-search") || "").includes(q);
        });
      });
    }
  }

  function closeSheet() {
    sheetType = "";
    var host = document.getElementById("qpt-sheet-host");
    if (host) host.innerHTML = "";
  }

  function updateMediaSession() {
    try {
      if (!("mediaSession" in navigator) || !surah) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: surahTitle(currentSurahMeta()) + " · Āyah " + state.ayah,
        artist: currentReciter().name,
        album: "DĀR AL TAWḤĪD · Qurʾān Player"
      });
    } catch (e) {}
  }

  function bindMediaSession() {
    try {
      if (!("mediaSession" in navigator)) return;
      navigator.mediaSession.setActionHandler("play", function () { togglePlay(); });
      navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); renderDynamic(); });
      navigator.mediaSession.setActionHandler("previoustrack", function () { previousAyah(); });
      navigator.mediaSession.setActionHandler("nexttrack", function () { nextAyah(true); });
      navigator.mediaSession.setActionHandler("seekbackward", function (d) { seek(-(d && d.seekOffset || 15)); });
      navigator.mediaSession.setActionHandler("seekforward", function (d) { seek((d && d.seekOffset || 15)); });
    } catch (e) {}
  }

  function bindPlayerEvents(root) {
    root.addEventListener("click", function (ev) {
      var ayahCard = ev.target.closest("[data-qpt-ayah]");
      var actionEl = ev.target.closest("[data-qpt-action]");
      if (actionEl) {
        var a = actionEl.getAttribute("data-qpt-action");
        if (a === "back") { location.hash = "#quran"; return; }
        if (a === "play") { togglePlay(); return; }
        if (a === "prev") { previousAyah(); return; }
        if (a === "next") { nextAyah(true); return; }
        if (a === "back15") { seek(-15); return; }
        if (a === "forward15") { seek(15); return; }
        if (a === "repeat") { cycleRepeat(); return; }
        if (a === "surah-sheet") { renderSheet("surah"); return; }
        if (a === "reciter-sheet") { renderSheet("reciter"); return; }
        if (a === "shuffle-sheet") { renderSheet("shuffle"); return; }
        if (a === "close-sheet") { closeSheet(); return; }
        if (a === "follow") { enableFollow(); return; }
        if (a === "ayah-play") {
          ev.stopPropagation();
          playAyah(Number(actionEl.getAttribute("data-ayah")), true);
          return;
        }
        if (a === "more") { renderSheet("shuffle"); return; }
      }
      var mode = ev.target.closest("[data-qpt-mode]");
      if (mode) { setTextMode(mode.getAttribute("data-qpt-mode")); return; }
      var srow = ev.target.closest("[data-qpt-select-surah]");
      if (srow) { setSurah(Number(srow.getAttribute("data-qpt-select-surah")), false); return; }
      var rrow = ev.target.closest("[data-qpt-select-reciter]");
      if (rrow) { setReciter(rrow.getAttribute("data-qpt-select-reciter")); return; }
      var shrow = ev.target.closest("[data-qpt-select-shuffle]");
      if (shrow) { setShuffle(shrow.getAttribute("data-qpt-select-shuffle")); return; }
      if (ayahCard) playAyah(Number(ayahCard.getAttribute("data-qpt-ayah")), true);
    });

    var slider = root.querySelector("#qpt-progress");
    if (slider) slider.addEventListener("input", function () { setProgress(slider.value); });

    var verses = root.querySelector("#qpt-verses");
    if (verses) {
      ["touchstart","pointerdown","wheel"].forEach(function (name) {
        verses.addEventListener(name, disableFollowTemporarily, { passive: true });
      });
    }
  }

  function mountPlayer() {
    if (mounting || !isPlayerRoute()) return;
    var appView = document.getElementById("appView");
    if (!appView) return;
    mounting = true;
    try {
      document.body.classList.add("is-quran-player-route");
      var existing = document.getElementById(ROOT_ID);
      if (!existing || existing.parentNode !== appView) {
        appView.innerHTML = pageMarkup();
        var root = document.getElementById(ROOT_ID);
        if (root) bindPlayerEvents(root);
        ensureMetadata().then(function () {
          if (!isPlayerRoute()) return;
          loadSurah({ resume: true, autoplay: false });
        }).catch(function () {
          setStatus("Qurʾān-Daten konnten nicht geladen werden.", true);
        });
      } else {
        renderDynamic();
      }
    } finally {
      mounting = false;
    }
  }

  function unmountPlayerRoute() {
    document.body.classList.remove("is-quran-player-route");
    closeSheet();
  }

  function injectQuranEntry() {
    if (!isQuranRoute()) return;
    var view = document.getElementById("appView");
    if (!view || view.querySelector("#qpt-entry")) return;
    var page = view.querySelector(".qov-page") || view;
    if (!page) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "qpt-entry";
    btn.className = "qpt-entry";
    btn.setAttribute("aria-label", "Qurʾān Player öffnen");
    btn.innerHTML = '<span class="qpt-entry-orb">▶</span><span class="qpt-entry-copy"><small>NEUER BEREICH</small><strong>Qurʾān Player</strong><em>Rezitation · Arabisch / Deutsch · 20 Rezitatoren</em></span><span class="qpt-entry-chevron">›</span>';
    btn.addEventListener("click", function () { location.hash = "#quran-player"; });
    var header = page.querySelector(".qov-header");
    if (header && header.parentNode) header.insertAdjacentElement("afterend", btn);
    else page.insertAdjacentElement("afterbegin", btn);
  }

  function syncRoute() {
    if (isPlayerRoute()) mountPlayer();
    else {
      unmountPlayerRoute();
      if (isQuranRoute()) setTimeout(injectQuranEntry, 30);
    }
  }

  audio.addEventListener("play", function () { renderDynamic(); updateMediaSession(); });
  audio.addEventListener("pause", renderDynamic);
  audio.addEventListener("loadedmetadata", renderDynamic);
  audio.addEventListener("durationchange", renderDynamic);
  audio.addEventListener("timeupdate", function () {
    state.position = Number(audio.currentTime) || 0;
    var now = Date.now();
    if (now - saveTick > 1800) { saveTick = now; saveState(); }
    renderDynamic();
  });
  audio.addEventListener("ended", function () {
    state.position = 0;
    if (state.repeat === "ayah") {
      audio.currentTime = 0;
      audio.play().catch(function () {});
      return;
    }
    nextAyah(true);
  });
  audio.addEventListener("error", function () {
    setStatus("Diese Audiodatei konnte nicht geladen werden. Bitte Rezitator wechseln oder erneut versuchen.", true);
    renderDynamic();
  });

  function boot() {
    bindMediaSession();
    syncRoute();
    global.addEventListener("hashchange", function () { setTimeout(syncRoute, 20); });
    global.addEventListener("popstate", function () { setTimeout(syncRoute, 20); });
    document.addEventListener("dar:render", function () { setTimeout(syncRoute, 20); });
    try {
      var mo = new MutationObserver(function () {
        if (mounting) return;
        if (isPlayerRoute()) {
          var root = document.getElementById(ROOT_ID);
          if (!root) setTimeout(mountPlayer, 0);
        } else if (isQuranRoute()) {
          setTimeout(injectQuranEntry, 0);
        }
      });
      var appView = document.getElementById("appView");
      if (appView) mo.observe(appView, { childList: true, subtree: false });
      else mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  global.DARQuranPlayerTest = {
    open: function () { location.hash = "#quran-player"; },
    play: togglePlay,
    pause: function () { audio.pause(); },
    audio: audio
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(window);
