/* Local Qurʾān recitation pack: IDB + Cache API, seed (Gebet/Juz 30) then full reciter. */
(function () {
  if (window.__darQuranAudioPackBoot) return;
  window.__darQuranAudioPackBoot = true;
  var VER = "1059";
  var DB_NAME = "dar-quran-audio-pack";
  var STORE = "mp3";
  var CACHE_NAME = "dar-quran-audio-v" + VER;
  var AYAH_TOTAL = 6236;
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
  var inflight = 0;
  var MAX_INFLIGHT = 2;
  var queue = [];
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
    if (surahs.length) return surahs;
    try {
      var meta = (window.quranMeta && window.quranMeta.surahs) || [];
      if (meta.length) {
        surahs = meta.map(function (s) {
          return { id: Number(s.id || s.number), verses: Number(s.total_verses || s.ayahs || 0) };
        });
        return surahs;
      }
    } catch (e) {}
    return [];
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
  async function hydrate() {
    try {
      var db = await openDb();
      var tx = db.transaction(STORE, "readonly");
      var store = tx.objectStore(STORE);
      await new Promise(function (done) {
        var timed = false;
        var timer = setTimeout(function () {
          timed = true;
          done();
        }, isTvPlayback() ? 400 : 1200);
        var req = store.openCursor();
        req.onsuccess = function () {
          if (timed) return;
          var cur = req.result;
          if (!cur) {
            clearTimeout(timer);
            done();
            return;
          }
          var parts = String(cur.key).split(":");
          if (cur.value instanceof Blob && cur.value.size > 800) markHave(parts[0], Number(parts[1]));
          cur.continue();
        };
        req.onerror = function () {
          clearTimeout(timer);
          done();
        };
      });
    } catch (e) {}
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
      markHave(edition, ayah);
      try {
        var db = await openDb();
        db.transaction(STORE, "readwrite").objectStore(STORE).put(blob, k);
      } catch (ePut) {}
      try {
        if ("caches" in window) {
          var cache = await caches.open(CACHE_NAME);
          await cache.put(proxyUrl(edition, ayah), new Response(blob, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000" } }));
        }
      } catch (eCache) {}
    } catch (e) {
      pending[k] = false;
      return;
    }
    pending[k] = false;
  }
  function pump() {
    while (inflight < MAX_INFLIGHT && queue.length) {
      var job = queue.shift();
      status.queued = queue.length;
      inflight += 1;
      fetchOne(job.edition, job.ayah).then(function () {
        inflight -= 1;
        pump();
      }, function () {
        inflight -= 1;
        pump();
      });
    }
  }
  function ensure(edition, surah, ayah) {
    if (!edition) return;
    var g = globalAyah(surah, ayah);
    enqueue(edition, g, true);
    var verses = ayahsForSurah(surah);
    verses.forEach(function (n) { enqueue(edition, n, n === g); });
    [g + 1, g + 2, g + 3].forEach(function (n) {
      if (n <= AYAH_TOTAL) enqueue(edition, n, true);
    });
  }
  function prefetchSurah(edition, surah) {
    ayahsForSurah(surah).forEach(function (n) { enqueue(edition, n, false); });
  }
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
      complete: have >= AYAH_TOTAL - 5
    };
  }
  function downloadLabel(edition) {
    var p = reciterProgress(edition);
    if (p.complete) return "Gespeichert";
    if (p.downloading || p.have > 0) return "Lädt " + p.have + "/" + p.total;
    return "Download";
  }
  function downloadReciter(edition) {
    if (!edition) return;
    cancelled[edition] = false;
    status.reciter = edition;
    for (var n = 1; n <= AYAH_TOTAL; n++) enqueue(edition, n, false);
  }
  function cancelEdition(edition) {
    var ed = String(edition || "");
    if (!ed) return;
    cancelled[ed] = true;
    queue = queue.filter(function (job) { return job.edition !== ed; });
    Object.keys(pending).forEach(function (k) {
      if (k.indexOf(ed + ":") === 0) delete pending[k];
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
    try { startSeed(); } catch (eSeed) {}
    hydrate();
  })();
})();
