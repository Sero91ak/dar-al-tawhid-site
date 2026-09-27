/* Local Qurʾān recitation pack: IDB + Cache API, seed (Gebet/Juz 30) then full reciter. */
(function () {
  if (window.__darQuranAudioPackBoot) return;
  window.__darQuranAudioPackBoot = true;
  var VER = "1054";
  var DB_NAME = "dar-quran-audio-pack";
  var STORE = "mp3";
  var CACHE_NAME = "dar-quran-audio-v" + VER;
  var AYAH_TOTAL = 6236;
  var SEED_SURAHS = [1, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  var FALLBACK_RECITERS = [
    { id: "alafasy", edition: "ar.alafasy" },
    { id: "sudais", edition: "ar.abdurrahmaansudais" },
    { id: "shuraim", edition: "ar.saoodshuraym" },
    { id: "husary", edition: "ar.husary" },
    { id: "husarymujawwad", edition: "ar.husarymujawwad" },
    { id: "minshawi", edition: "ar.minshawi" },
    { id: "minshawimujawwad", edition: "ar.minshawimujawwad" },
    { id: "basit", edition: "ar.abdulbasitmurattal" },
    { id: "abdulbasitmujawwad", edition: "ar.abdulbasitmujawwad" },
    { id: "ajamy", edition: "ar.ahmedajamy" },
    { id: "muhammadayoub", edition: "ar.muhammadayyoub" },
    { id: "hudhaify", edition: "ar.hudhaify" },
    { id: "muhammadjibreel", edition: "ar.muhammadjibreel" },
    { id: "maher", edition: "ar.mahermuaiqly" },
    { id: "shaatree", edition: "ar.shaatree" },
    { id: "hanirifai", edition: "ar.hanirifai" },
    { id: "abdullahbasfar", edition: "ar.abdullahbasfar" },
    { id: "yasseraldossari", edition: "ar.yasseraldossari" },
    { id: "aymanswoaid", edition: "ar.aymanswoaid" }
  ];
  var reciters = FALLBACK_RECITERS.slice();
  var surahs = [];
  var localSrc = Object.create(null);
  var pending = Object.create(null);
  var inflight = 0;
  var MAX_INFLIGHT = 3;
  var queue = [];
  var seeded = false;
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
    var k = key(edition, ayah);
    return localSrc[k] || proxyUrl(edition, ayah);
  }
  function rememberBlob(edition, ayah, blob) {
    if (!blob || !blob.size) return;
    var k = key(edition, ayah);
    if (localSrc[k]) {
      try { URL.revokeObjectURL(localSrc[k]); } catch (e) {}
    }
    localSrc[k] = URL.createObjectURL(blob);
    status.have += 1;
  }
  async function hydrate() {
    try {
      var db = await openDb();
      var tx = db.transaction(STORE, "readonly");
      var store = tx.objectStore(STORE);
      await new Promise(function (done) {
        var req = store.openCursor();
        req.onsuccess = function () {
          var cur = req.result;
          if (!cur) { done(); return; }
          var parts = String(cur.key).split(":");
          if (cur.value instanceof Blob) rememberBlob(parts[0], Number(parts[1]), cur.value);
          cur.continue();
        };
        req.onerror = function () { done(); };
      });
    } catch (e) {}
  }
  function enqueue(edition, ayah, urgent) {
    var k = key(edition, ayah);
    if (localSrc[k] || pending[k]) return;
    pending[k] = true;
    if (urgent) queue.unshift({ edition: edition, ayah: ayah });
    else queue.push({ edition: edition, ayah: ayah });
    status.queued = queue.length;
    pump();
  }
  async function fetchOne(edition, ayah) {
    var k = key(edition, ayah);
    try {
      var res = await fetch(proxyUrl(edition, ayah), { credentials: "same-origin" });
      if (!res || !res.ok) throw new Error("proxy");
      var blob = await res.blob();
      if (!blob || blob.size < 800) throw new Error("empty");
      rememberBlob(edition, ayah, blob);
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
    var ayahs = seedAyahs();
    reciters.forEach(function (r) {
      ayahs.forEach(function (n) { enqueue(r.edition, n, r.edition === "ar.alafasy"); });
    });
  }
  function haveCount(edition) {
    var n = 0;
    var prefix = String(edition || "") + ":";
    Object.keys(localSrc).forEach(function (k) {
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
    status.reciter = edition;
    for (var n = 1; n <= AYAH_TOTAL; n++) enqueue(edition, n, false);
  }
  async function loadCatalog() {
    try {
      var res = await fetch("/data/quran-reciters.json?v=" + VER, { cache: "force-cache" });
      if (!res.ok) return;
      var data = await res.json();
      if (data && Array.isArray(data.reciters) && data.reciters.length) reciters = data.reciters;
    } catch (e) {}
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
    startSeed: startSeed,
    haveCount: haveCount,
    reciterProgress: reciterProgress,
    downloadLabel: downloadLabel,
    reciters: function () { return reciters.slice(); },
    status: function () { return { have: status.have, queued: queue.length, seed: status.seed, reciter: status.reciter }; }
  };
  (async function boot() {
    await hydrate();
    await loadCatalog();
  })();
})();
