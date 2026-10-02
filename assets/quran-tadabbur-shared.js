/**
 * DĀR AL TAWḤĪD — Shared verified Qurʾān Tadabbur loader
 * Canonical source: /apple-tv/quran/tadabbur/
 * Used by Web App and iOS WebView. Apple TV already reads the same catalog natively.
 */
(function () {
  "use strict";
  if (window.__DAR_QURAN_TADABBUR_SHARED_V1) return;
  window.__DAR_QURAN_TADABBUR_SHARED_V1 = true;

  var BASE = "/apple-tv/quran/tadabbur/";
  var SNAPSHOT_CACHE = "dar-quran-tadabbur-shared-v1";
  var SNAPSHOT_KEY = "/__dar_quran_tadabbur_verified_snapshot_v1__.json";
  var SOURCE_LABEL = "DĀR AL TAWḤĪD – geprüfter Qurʾān-Tadabbur";
  var FALLBACK = "Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor.";
  var snapshotPromise = null;
  var groupedBySurah = null;
  var activeCount = 0;

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function fetchJson(path, options) {
    var response = await fetch(BASE + path, Object.assign({ cache: "no-store" }, options || {}));
    if (!response.ok) throw new Error("Tadabbur HTTP " + response.status + " · " + path);
    return response.json();
  }

  async function readCachedSnapshot(expectedCount) {
    if (!("caches" in window)) return null;
    try {
      var cache = await caches.open(SNAPSHOT_CACHE);
      var response = await cache.match(SNAPSHOT_KEY);
      if (!response) return null;
      var payload = await response.json();
      if (!payload || Number(payload.entriesCount) !== Number(expectedCount) || !Array.isArray(payload.entries)) return null;
      if (payload.entries.length !== Number(expectedCount)) return null;
      return payload.entries;
    } catch (e) {
      return null;
    }
  }

  async function writeCachedSnapshot(entriesCount, entries) {
    if (!("caches" in window)) return;
    try {
      var cache = await caches.open(SNAPSHOT_CACHE);
      await cache.put(
        SNAPSHOT_KEY,
        new Response(JSON.stringify({
          version: 1,
          entriesCount: entriesCount,
          cachedAt: new Date().toISOString(),
          entries: entries
        }), { headers: { "content-type": "application/json; charset=utf-8" } })
      );
    } catch (e) {}
  }

  function validateEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (!/^[0-9]{1,3}:[0-9]{1,3}$/.test(clean(entry.reference))) return false;
    return !!(
      clean(entry.text) &&
      clean(entry.narrator) &&
      clean(entry.generation) &&
      clean(entry.source) &&
      clean(entry.grading)
    );
  }

  function validateAll(entries, expectedCount) {
    if (!Array.isArray(entries) || entries.length !== Number(expectedCount)) {
      throw new Error("Tadabbur Gesamtzahl stimmt nicht.");
    }
    var seen = new Set();
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (!validateEntry(entry)) throw new Error("Ungültiger Taddabur-Eintrag.");
      if (seen.has(entry.reference)) throw new Error("Doppelte Taddabur-Referenz " + entry.reference);
      seen.add(entry.reference);
    }
    return entries;
  }

  async function loadFilesWithLimit(files, limit) {
    var results = new Array(files.length);
    var next = 0;

    async function worker() {
      while (true) {
        var index = next++;
        if (index >= files.length) return;
        var file = files[index];
        var envelope = await fetchJson(file.path);
        var rows = Array.isArray(envelope && envelope.entries) ? envelope.entries : [];
        if (rows.length !== Number(file.count)) {
          throw new Error("Tadabbur-Dateizahl stimmt nicht: " + file.path);
        }
        results[index] = rows;
      }
    }

    var workers = [];
    var workerCount = Math.max(1, Math.min(Number(limit) || 8, files.length || 1));
    for (var i = 0; i < workerCount; i++) workers.push(worker());
    await Promise.all(workers);

    var merged = [];
    for (var r = 0; r < results.length; r++) merged.push.apply(merged, results[r] || []);
    return merged;
  }

  async function buildSnapshot() {
    var catalog = await fetchJson("catalog.json");
    var expectedCount = Number(catalog && catalog.entriesCount);
    if (!Number.isFinite(expectedCount) || expectedCount < 1) throw new Error("Ungültiger Taddabur-Katalog.");

    var cached = await readCachedSnapshot(expectedCount);
    if (cached) {
      activeCount = cached.length;
      return validateAll(cached, expectedCount);
    }

    var index = await fetchJson(clean(catalog.entriesIndexPath) || "entries-index.json");
    var files = Array.isArray(index && index.files) ? index.files : [];
    if (Number(index && index.totalVerifiedEntries) !== expectedCount || !files.length) {
      throw new Error("Taddabur-Index stimmt nicht mit Katalog überein.");
    }

    var entries = await loadFilesWithLimit(files, 8);
    validateAll(entries, expectedCount);
    activeCount = entries.length;
    await writeCachedSnapshot(expectedCount, entries);
    return entries;
  }

  function groupEntries(entries) {
    var grouped = new Map();
    entries.forEach(function (entry) {
      var parts = clean(entry.reference).split(":");
      var surah = Number(parts[0]);
      var ayah = Number(parts[1]);
      if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return;
      if (!grouped.has(surah)) grouped.set(surah, new Map());
      grouped.get(surah).set(ayah, {
        id: ayah,
        source: SOURCE_LABEL,
        athar: [{
          person: entry.narrator,
          name: entry.narrator,
          generation: entry.generation,
          category: entry.relation || entry.generation || "Tadabbur",
          text: entry.text,
          source: entry.source,
          grading: entry.grading,
          note: entry.note || "",
          sourceUrl: entry.sourceUrl || "",
          relation: entry.relation || "",
          reference: entry.reference
        }]
      });
    });
    return grouped;
  }

  async function ensureSnapshot() {
    if (!snapshotPromise) {
      snapshotPromise = buildSnapshot()
        .then(function (entries) {
          groupedBySurah = groupEntries(entries);
          return entries;
        })
        .catch(function (error) {
          snapshotPromise = null;
          try { console.warn("[dar-tadabbur] geprüfter Katalog konnte nicht geladen werden", error); } catch (e) {}
          throw error;
        });
    }
    await snapshotPromise;
    return groupedBySurah;
  }

  async function loadVerifiedSurah(surahId) {
    var surah = Number(surahId);
    if (!Number.isFinite(surah) || surah < 1 || surah > 114) return null;
    try {
      var grouped = await ensureSnapshot();
      var verses = grouped && grouped.get(surah) ? grouped.get(surah) : new Map();
      return {
        source: SOURCE_LABEL,
        updated: "",
        verified: true,
        entriesCount: activeCount,
        verses: verses
      };
    } catch (e) {
      return {
        source: SOURCE_LABEL,
        updated: "",
        verified: false,
        entriesCount: activeCount,
        verses: new Map()
      };
    }
  }

  function renderVerifiedPanel(entry, active) {
    var items = Array.isArray(entry && entry.athar) ? entry.athar : [];
    var body;

    if (items.length) {
      body = '<div class="quran-athar-list">' + items.map(function (item) {
        var sourceUrl = clean(item.sourceUrl);
        var source = sourceUrl
          ? '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.source || "Quelle") + '</a>'
          : escapeHtml(item.source || "Quelle");
        return '<article class="quran-athar-card">' +
          '<div class="quran-athar-card-head"><h4>' + escapeHtml(item.person || item.name || "Überlieferung") + '</h4>' +
          '<span class="quran-athar-badge">' + escapeHtml(item.generation || item.category || "Tadabbur") + '</span></div>' +
          '<p class="quran-athar-text">' + escapeHtml(item.text || "") + '</p>' +
          '<div class="quran-athar-source"><b>Quelle:</b> ' + source +
          (item.grading ? '<span class="quran-athar-note">Einstufung: ' + escapeHtml(item.grading) + '</span>' : '') +
          (item.relation ? '<span class="quran-athar-note">' + escapeHtml(item.relation) + '</span>' : '') +
          (item.note ? '<span class="quran-athar-note">' + escapeHtml(item.note) + '</span>' : '') +
          '</div></article>';
      }).join("") + '</div>';
    } else {
      body = '<div class="quran-tafsir-empty">' + escapeHtml(FALLBACK) + '</div>';
    }

    return '<div class="quran-tafsir-panel' + (active ? ' active' : '') + '" data-tafsir-panel="athar">' +
      '<div class="quran-tafsir-panel-title">Tadabbur · geprüfte Überlieferungen</div>' +
      body +
      '</div>';
  }

  function installOverrides() {
    window.quranAtharFile = function () { return BASE + "catalog.json"; };
    window.loadQuranAtharSurah = loadVerifiedSurah;
    window.renderAtharPanel = renderVerifiedPanel;

    window.DarQuranTadabbur = {
      source: SOURCE_LABEL,
      fallback: FALLBACK,
      reload: function () {
        snapshotPromise = null;
        groupedBySurah = null;
        activeCount = 0;
        return ensureSnapshot();
      },
      loadSurah: loadVerifiedSurah,
      get loadedCount() { return activeCount; }
    };

    try {
      window.dispatchEvent(new CustomEvent("dar:quran-tadabbur-ready", {
        detail: { source: SOURCE_LABEL }
      }));
    } catch (e) {}
  }

  installOverrides();
})();
