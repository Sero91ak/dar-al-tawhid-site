/* Qurʾān recitation availability + opt-in offline pack. No audio downloads at app boot. */
(function () {
  if (window.__darQuranAudioPackBoot) return;
  window.__darQuranAudioPackBoot = true;
  var VER = "1063";
  var DB_NAME = "dar-quran-audio-pack";
  var STORE = "mp3";
  var CACHE_NAME = "dar-quran-audio-v" + VER;
  var AYAH_TOTAL = 6236;
  var AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  var DEFAULT_EDITION = "ar.alafasy";
  var SEED_SURAHS = [1, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  var FALLBACK_RECITERS = [
    { id: "alafasy", name: "Mišārī Rāšid al-ʿAfāsī", folder: "Alafasy_128kbps", edition: "ar.alafasy" },
    { id: "sudais", name: "ʿAbd ar-Raḥmān as-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", edition: "ar.abdurrahmaansudais" },
    { id: "shuraim", name: "Saʿūd aš-Šuraym", folder: "Saood_ash-Shuraym_128kbps", edition: "ar.saoodshuraym" },
    { id: "husary", name: "Maḥmūd Ḫalīl al-Ḥuṣarī", folder: "Husary_128kbps", edition: "ar.husary" },
    { id: "husarymujawwad", name: "al-Ḥuṣarī (Muǧawwad)", folder: "Husary_Mujawwad_128kbps", edition: "ar.husarymujawwad" },
    { id: "minshawi", name: "Muḥammad Ṣiddīq al-Minšāwī", folder: "Minshawy_Murattal_128kbps", edition: "ar.minshawi" },
    { id: "minshawimujawwad", name: "al-Minšāwī (Muǧawwad)", folder: "Minshawy_Mujawwad_192kbps", edition: "ar.minshawimujawwad" },
    { id: "basit", name: "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", folder: "Abdul_Basit_Murattal_192kbps", edition: "ar.abdulbasitmurattal" },
    { id: "abdulbasitmujawwad", name: "ʿAbd al-Bāsiṭ (Muǧawwad)", folder: "Abdul_Basit_Mujawwad_128kbps", edition: "ar.abdulbasitmujawwad" },
    { id: "ajamy", name: "Aḥmad ibn ʿAlī al-ʿAǧamī", folder: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net", edition: "ar.ahmedajamy" },
    { id: "muhammadayoub", name: "Muḥammad Ayyūb", folder: "Muhammad_Ayyoub_128kbps", edition: "ar.muhammadayoub" },
    { id: "hudhaify", name: "ʿAlī al-Ḥuḏayfī", folder: "Hudhaify_128kbps", edition: "ar.hudhaify" },
    { id: "muhammadjibreel", name: "Muḥammad Ǧibrīl", folder: "Muhammad_Jibreel_128kbps", edition: "ar.muhammadjibreel" },
    { id: "maher", name: "Māhir al-Muʿayqlī", folder: "MaherAlMuaiqly128kbps", edition: "ar.mahermuaiqly" },
    { id: "shaatree", name: "Abū Bakr aš-Šāṭirī", folder: "Abu_Bakr_Ash-Shaatree_128kbps", edition: "ar.shaatree" },
    { id: "hanirifai", name: "Hānī ar-Rifāʿī", folder: "Hani_Rifai_192kbps", edition: "ar.hanirifai" },
    { id: "abdullahbasfar", name: "ʿAbdullāh Baṣfar", folder: "Abdullah_Basfar_192kbps", edition: "ar.abdullahbasfar" },
    { id: "yasseraldossari", name: "Yāsir ad-Dawsarī", folder: "Yasser_Ad-Dussary_128kbps", edition: "ar.yasseraldossari" },
    { id: "aymanswoaid", name: "Ayman Suwayd", folder: "Ayman_Sowaid_64kbps", edition: "ar.aymanswoaid" }
  ];
  var reciters = FALLBACK_RECITERS.slice();
  var surahs = [];
  var cachedKeys = Object.create(null);
  var pending = Object.create(null);
  var retryCounts = Object.create(null);
  var inflight = 0;
  var MAX_INFLIGHT = 1;
  var queue = [];
  var pumpTimer = 0;
  var seeded = false;
  var cancelled = Object.create(null);
  var status = { have: 0, queued: 0, seed: false, reciter: "" };

  function key(edition, ayah) {
    return String(edition || "") + ":" + String(ayah || 0);
  }
  function proxyUrl(edition, ayah) {
    return "/quran-audio/" + encodeURIComponent(edition) + "/" + ayah + ".mp3?v=" + VER;
  }
  function openDb() {
    return new Promise(function (res, rej) {
      try {
        var r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
  }
  function verseCounts() {
    if (surahs.length >= 114) return surahs;
    try {
      var meta = (window.quranMeta && window.quranMeta.surahs) || [];
      if (meta.length >= 114) {
        var mapped = meta.map(function (s) {
          return { id: Number(s.id || s.number), verses: Number(s.total_verses || s.ayahs || 0) };
        });
        var ok = mapped.length >= 114 && mapped.every(function (s) { return s.verses > 0; });
        if (ok) {
          surahs = mapped;
          return surahs;
        }
      }
    } catch (e) {}
    surahs = AYAH_COUNTS.map(function (v, i) { return { id: i + 1, verses: v }; });
    return surahs;
  }
  function globalAyah(surah, ayah) {
    var n = 0;
    var list = verseCounts();
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].id) < surah) n += Number(list[i].verses) || 0;
    }
    return n + ayah;
  }
  function ayahsForSurah(surah) {
    var list = verseCounts();
    var found = list.filter(function (s) { return Number(s.id) === Number(surah); })[0];
    var verses = found ? Number(found.verses) : 0;
    var start = globalAyah(surah, 1);
    var out = [];
    for (var i = 0; i < verses; i++) out.push(start + i);
    return out;
  }
  function seedAyahs() {
    var out = [];
    SEED_SURAHS.forEach(function (s) { out = out.concat(ayahsForSurah(s)); });
    if (!out.length) {
      for (var i = 1; i <= 7; i++) out.push(i);
      for (var j = 6160; j <= AYAH_TOTAL; j++) out.push(j);
    }
    return out;
  }
  function url(edition, ayah) {
    return proxyUrl(edition, ayah);
  }
  function isTvPlayback() {
    try {
      if (window.DAR_APPLE_TV_APP === true) return true;
      var ua = String(navigator.userAgent || "");
      if (/AppleTV|Apple TV|tvOS|DarAlTawhid-tvOS/i.test(ua)) return true;
    } catch (eTv) {}
    return false;
  }
  function markHave(edition, ayah) {
    var k = key(edition, ayah);
    if (cachedKeys[k]) return;
    cachedKeys[k] = true;
    status.have += 1;
  }
  var hydrated = null;
  function hydrate() {
    if (hydrated) return hydrated;
    hydrated = (async function () {
      try {
        var db = await openDb();
        var store = db.transaction(STORE, "readonly").objectStore(STORE);
        await new Promise(function (done) {
          var timer = setTimeout(done, 8000);
          var finish = function () { clearTimeout(timer); done(); };
          if (typeof store.getAllKeys === "function") {
            var reqKeys = store.getAllKeys();
            reqKeys.onsuccess = function () {
              (reqKeys.result || []).forEach(function (k) {
                var parts = String(k).split(":");
                if (parts[0] !== "adhan") markHave(parts[0], Number(parts[1]));
              });
              finish();
            };
            reqKeys.onerror = finish;
            return;
          }
          var req = store.openKeyCursor ? store.openKeyCursor() : store.openCursor();
          req.onsuccess = function () {
            var cur = req.result;
            if (!cur) { finish(); return; }
            var parts = String(cur.key).split(":");
            if (parts[0] !== "adhan") markHave(parts[0], Number(parts[1]));
            cur.continue();
          };
          req.onerror = finish;
        });
      } catch (e) {}
    })();
    return hydrated;
  }
  function readBlob(k) {
    return openDb().then(function (db) {
      return new Promise(function (res) {
        try {
          var req = db.transaction(STORE, "readonly").objectStore(STORE).get(k);
          req.onsuccess = function () {
            var b = req.result;
            res(b instanceof Blob && b.size > 800 ? b : null);
          };
          req.onerror = function () { res(null); };
        } catch (eGet) { res(null); }
      });
    }).catch(function () { return null; });
  }
  function blobUrl(edition, ayah) {
    return readBlob(key(edition, ayah)).then(function (b) {
      if (!b) return null;
      markHave(edition, ayah);
      return URL.createObjectURL(b.type ? b : new Blob([b], { type: "audio/mpeg" }));
    });
  }
  function has(edition, ayah) {
    return !!cachedKeys[key(edition, ayah)];
  }
  function adhanKey(id) {
    return "adhan:" + String(id || "");
  }
  function adhanBlobUrl(id) {
    return readBlob(adhanKey(id)).then(function (b) {
      return b ? URL.createObjectURL(b.type ? b : new Blob([b], { type: "audio/mpeg" })) : null;
    });
  }
  async function cacheAdhan(id, src) {
    if (!id || !src) return false;
    if (await readBlob(adhanKey(id))) return true;
    try {
      var res = await fetch(src, { credentials: "omit" });
      if (!res.ok) return false;
      var blob = await res.blob();
      if (!blob || blob.size < 800) return false;
      var db = await openDb();
      db.transaction(STORE, "readwrite").objectStore(STORE).put(blob, adhanKey(id));
      return true;
    } catch (eAdhan) {
      return false;
    }
  }
  var WANT_KEY = "darQuranAudioPackWantV1";
  function readWanted() {
    try {
      var list = JSON.parse(localStorage.getItem(WANT_KEY) || "[]");
      return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch (eWant) { return []; }
  }
  function writeWanted(list) {
    try { localStorage.setItem(WANT_KEY, JSON.stringify(list)); } catch (eWantW) {}
  }
  function enqueue(edition, ayah, urgent) {
    var k = key(edition, ayah);
    if (cancelled[edition]) return;
    if (cachedKeys[k] || pending[k]) return;
    pending[k] = true;
    if (urgent) queue.unshift({ edition: edition, ayah: ayah });
    else queue.push({ edition: edition, ayah: ayah });
    status.queued = queue.length;
    pump();
  }
  async function fetchOne(edition, ayah) {
    var k = key(edition, ayah);
    if (cancelled[edition]) {
      pending[k] = false;
      return;
    }
    try {
      var urls = [
        proxyUrl(edition, ayah),
        "https://cdn.islamic.network/quran/audio/128/" + encodeURIComponent(edition) + "/" + ayah + ".mp3"
      ];
      var res = null;
      for (var ui = 0; ui < urls.length; ui++) {
        try {
          res = await fetch(urls[ui], { credentials: ui === 0 ? "same-origin" : "omit" });
          if (res && res.ok) break;
        } catch (eFetch) { res = null; }
      }
      if (!res || !res.ok) throw new Error("proxy");
      var blob = await res.blob();
      if (!blob || blob.size < 800) throw new Error("empty");
      if (cancelled[edition]) {
        pending[k] = false;
        return;
      }
      try {
        var db = await openDb();
        await new Promise(function (done, fail) {
          var tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put(blob, k);
          tx.oncomplete = done;
          tx.onerror = function () { fail(tx.error); };
          tx.onabort = function () { fail(tx.error); };
        });
      } catch (ePut) {
        throw new Error("store");
      }
      markHave(edition, ayah);
      delete retryCounts[k];
      failStreak = 0;
    } catch (e) {
      pending[k] = false;
      failStreak += 1;
      retryCounts[k] = (retryCounts[k] || 0) + 1;
      if (!cancelled[edition] && e && e.message !== "store" && retryCounts[k] < 3) {
        pending[k] = true;
        queue.push({ edition: edition, ayah: ayah });
      }
      return;
    }
    pending[k] = false;
  }
  var failStreak = 0;
  function waitPump(ms) {
    if (pumpTimer) return;
    pumpTimer = setTimeout(function () {
      pumpTimer = 0;
      pump();
    }, ms);
  }
  function pump() {
    if (!queue.length) return;
    var st = window.quranAudioState || {};
    if (window.__DAR_ADHAN_ACTIVE === true || st.isLoading) return waitPump(1500);
    if (navigator.onLine === false) return waitPump(15000);
    if (failStreak >= 3) {
      failStreak = 0;
      return waitPump(30000);
    }
    var gap = st.isPlaying ? 1200 : 150;
    while (inflight < MAX_INFLIGHT && queue.length) {
      var job = queue.shift();
      status.queued = queue.length;
      inflight += 1;
      fetchOne(job.edition, job.ayah).then(function () {
        inflight -= 1;
        waitPump(gap);
      }, function () {
        inflight -= 1;
        waitPump(gap);
      });
    }
  }
  function ensure(edition, surah, ayah) {
    if (!edition) return;
    if (isTvPlayback()) return;
    var g = globalAyah(surah, ayah);
    if (g < AYAH_TOTAL) enqueue(edition, g + 1, true);
  }
  function prefetchSurah() {}
  function startSeed() {
    if (seeded) return;
    seeded = true;
    status.seed = true;
    seedAyahs().forEach(function (n) { enqueue(DEFAULT_EDITION, n, true); });
  }
  function haveCount(edition) {
    var n = 0;
    var prefix = String(edition || "") + ":";
    Object.keys(cachedKeys).forEach(function (k) {
      if (k.indexOf(prefix) === 0) n += 1;
    });
    return n;
  }
  function reciterProgress(edition) {
    var have = haveCount(edition);
    var queuedFor = 0;
    queue.forEach(function (job) {
      if (job.edition === edition) queuedFor += 1;
    });
    var downloading = queuedFor > 0 || status.reciter === edition;
    return {
      have: have,
      total: AYAH_TOTAL,
      queued: queuedFor,
      downloading: downloading,
      complete: have === AYAH_TOTAL
    };
  }
  function downloadLabel(edition) {
    var p = reciterProgress(edition);
    if (p.complete) return "Gespeichert";
    if (p.downloading) return "Lädt " + p.have + "/" + p.total;
    if (p.have > 0) return "Fortsetzen " + p.have + "/" + p.total;
    return "Download";
  }
  function downloadReciter(edition) {
    if (!edition) return;
    cancelled[edition] = false;
    status.reciter = edition;
    var wanted = readWanted();
    if (wanted.indexOf(edition) === -1) {
      wanted.push(edition);
      writeWanted(wanted);
    }
    return hydrate().then(function () {
      if (cancelled[edition]) return;
      for (var n = 1; n <= AYAH_TOTAL; n++) enqueue(edition, n, false);
    });
  }
  function isWanted(edition) {
    return readWanted().indexOf(String(edition || "")) !== -1;
  }
  function cancelEdition(edition) {
    var ed = String(edition || "");
    if (!ed) return;
    writeWanted(readWanted().filter(function (w) { return w !== ed; }));
    cancelled[ed] = true;
    queue = queue.filter(function (job) { return job.edition !== ed; });
    Object.keys(pending).forEach(function (k) {
      if (k.indexOf(ed + ":") === 0) delete pending[k];
    });
    Object.keys(retryCounts).forEach(function (k) {
      if (k.indexOf(ed + ":") === 0) delete retryCounts[k];
    });
    if (status.reciter === ed) status.reciter = "";
    status.queued = queue.length;
  }
  async function removeReciter(edition) {
    var ed = String(edition || "");
    if (!ed) return;
    cancelEdition(ed);
    var prefix = ed + ":";
    Object.keys(cachedKeys).forEach(function (k) {
      if (k.indexOf(prefix) === 0) delete cachedKeys[k];
    });
    status.have = Object.keys(cachedKeys).length;
    try {
      var db = await openDb();
      var store = db.transaction(STORE, "readwrite").objectStore(STORE);
      await new Promise(function (done) {
        var req = store.openCursor();
        req.onsuccess = function () {
          var cur = req.result;
          if (!cur) { done(); return; }
          if (String(cur.key).indexOf(prefix) === 0) cur.delete();
          cur.continue();
        };
        req.onerror = function () { done(); };
      });
    } catch (eIdb) {}
    try {
      if ("caches" in window) {
        var cache = await caches.open(CACHE_NAME);
        var reqs = await cache.keys();
        var needle = "/quran-audio/" + encodeURIComponent(ed) + "/";
        await Promise.all(reqs.map(function (req) {
          var u = req.url || "";
          return u.indexOf(needle) !== -1 ? cache.delete(req) : Promise.resolve();
        }));
      }
    } catch (eCacheDel) {}
  }
  async function loadCatalog() {
    var urls = [
      "/data/quran-reciters.json?v=" + VER,
      "/apple-tv/quran/audio/catalog.json?v=" + VER
    ];
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (!res.ok) continue;
        var data = await res.json();
        var list = (data && data.reciters) || [];
        if (Array.isArray(list) && list.length) {
          reciters = list;
          break;
        }
      } catch (e) {}
    }
    try {
      if (!verseCounts().length) {
        var sres = await fetch("/content/quran/surahs.json", { cache: "force-cache" });
        var sj = await sres.json();
        surahs = (sj.surahs || []).map(function (s) {
          return { id: Number(s.id), verses: Number(s.total_verses) };
        });
      }
    } catch (e2) {}
  }
  window.DARQuranAudioPack = {
    url: url,
    proxyUrl: proxyUrl,
    ensure: ensure,
    prefetchSurah: prefetchSurah,
    blobUrl: blobUrl,
    has: has,
    isWanted: isWanted,
    cacheAdhan: cacheAdhan,
    adhanBlobUrl: adhanBlobUrl,
    downloadReciter: downloadReciter,
    cancelEdition: cancelEdition,
    removeReciter: removeReciter,
    startSeed: startSeed,
    haveCount: haveCount,
    reciterProgress: reciterProgress,
    downloadLabel: downloadLabel,
    reciters: function () { return reciters.slice(); },
    status: function () { return { have: status.have, queued: queue.length, seed: status.seed, reciter: status.reciter }; }
  };
  (async function boot() {
    try { await loadCatalog(); } catch (eCat) {}
    await hydrate();
    var wanted = readWanted();
    if (!wanted.length) return;
    setTimeout(function () {
      readWanted().forEach(function (ed) {
        if (reciterProgress(ed).complete) return;
        cancelled[ed] = false;
        for (var n = 1; n <= AYAH_TOTAL; n++) enqueue(ed, n, false);
      });
    }, 20000);
  })();
})();
