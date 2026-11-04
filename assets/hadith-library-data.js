/* DĀR AL TAWḤĪD – central verified Ḥadīṯ data bridge
 * Source of truth: /apple-tv/hadith/ on dar-al-tawhid.de (same tree for Web, iOS, Android, Apple TV).
 * Used by Test App, live WebView and Apple TV catalog/screensaver.
 */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_DATA_V2) return;
  window.__DAR_HADITH_LIBRARY_DATA_V2 = true;

  var LIVE_ROOT = "https://dar-al-tawhid.de/apple-tv/hadith/";
  var LIVE_CATALOG = LIVE_ROOT + "catalog.json";
  var LOCAL_ROOT = "/apple-tv/hadith/";
  var LOCAL_CATALOG = LOCAL_ROOT + "catalog.json";
  var RAW_ROOT = "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/apple-tv/hadith/";
  var RAW_CATALOG = RAW_ROOT + "catalog.json";

  function isTestPath() {
    try {
      var p = String(location.pathname || "");
      return p === "/test" || p.indexOf("/test/") === 0;
    } catch (_) {
      return false;
    }
  }

  function libraryCatalogPath() {
    return isTestPath()
      ? "/test/data/hadith-library/catalog.json"
      : "/data/hadith-library/catalog.json";
  }

  function cacheBust(url, token) {
    var sep = String(url).indexOf("?") >= 0 ? "&" : "?";
    return String(url) + sep + "darHadith=" + encodeURIComponent(String(token || Date.now()));
  }

  function fetchJson(url, token) {
    return fetch(cacheBust(url, token), {
      cache: "no-store",
      credentials: /^\//.test(String(url)) ? "same-origin" : "omit"
    }).then(function (res) {
      if (!res.ok) throw new Error("Ḥadīṯ-Daten konnten nicht geladen werden: " + url + " (" + res.status + ")");
      return res.json();
    });
  }

  function firstJson(candidates, token) {
    var i = 0;
    function next() {
      if (i >= candidates.length) return Promise.reject(new Error("Keine Ḥadīṯ-Datenquelle erreichbar."));
      var url = candidates[i++];
      return fetchJson(url, token)
        .then(function (data) { return { data: data, url: url }; })
        .catch(next);
    }
    return next();
  }

  function idNumber(id) {
    var m = String(id || "").match(/HAD-(\d{4})/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function hasVerifiedSharh(record) {
    // The mere presence of commentary text is NOT editorial verification.
    return !!(record &&
      record.sharhStatus === "verified" &&
      ["sharhText", "sharhScholar", "sharhBook", "sharhReference"].every(function (key) {
        return typeof record[key] === "string" && record[key].trim().length > 0;
      }));
  }

  function toAppleTvRecord(record) {
    // Preserve exact-source references and only editorially VERIFIED commentary.
    var out = {
      id: record.id,
      recordType: record.recordType || "hadith",
      language: record.language || "de",
      categoryLabel: record.categoryLabel || null,
      narratorLine: record.narratorLine || "",
      speakerLabel: record.speakerLabel || "",
      textMarkdown: record.textMarkdown || "",
      source: record.source || "",
      sourceBook: record.sourceBook || null,
      sourceVolume: record.sourceVolume || null,
      sourcePage: record.sourcePage || null,
      sourceChapter: record.sourceChapter || null,
      sourceSection: record.sourceSection || null,
      sourceHadithNumber: record.sourceHadithNumber || null,
      sourceEdition: record.sourceEdition || null,
      grade: record.grade || "",
      verificationNote: record.verificationNote || null,
      sharhStatus: hasVerifiedSharh(record) ? "verified" : (record.sharhStatus || null)
    };
    if (hasVerifiedSharh(record)) {
      ["sharhText", "sharhLanguage", "sharhScholar", "sharhBook",
       "sharhVolume", "sharhPage", "sharhChapter", "sharhSection",
       "sharhEdition", "sharhReference"].forEach(function (key) {
        out[key] = record[key] || null;
      });
    }
    return out;
  }

  function toLibraryRecord(record) {
    var out = Object.assign({}, record);
    out.recordType = out.recordType || "hadith";
    out.hasVerifiedSharh = hasVerifiedSharh(record);
    out.libraryStatus = out.recordType === "athar" ? "athar-no-sharh-required" :
      (out.hasVerifiedSharh ? "complete" : "open-sharh");
    out.bookCategory = out.bookCategory || out.categoryLabel ||
      (out.recordType === "athar" ? "Āṯār" : "Ḥadīṯ");
    // Public readers must never render an unverified/draft Sharḥ.
    if (!out.hasVerifiedSharh) {
      out.sharhText = "";
      out.sharhScholar = "";
      out.sharhBook = "";
      out.sharhReference = "";
    }
    return out;
  }

  function sortRecords(records) {
    return records.slice().sort(function (a, b) {
      return idNumber(a.id) - idNumber(b.id);
    });
  }

  function groupBy(records, key) {
    return records.reduce(function (acc, record) {
      var value = record[key] || "Ohne Angabe";
      if (!acc[value]) acc[value] = [];
      acc[value].push(record);
      return acc;
    }, {});
  }

  function rootForCatalog(url) {
    var value = String(url || "");
    if (value.indexOf("/apple-tv/hadith/") === 0) return LOCAL_ROOT;
    if (value.indexOf("dar-al-tawhid.de/apple-tv/hadith/") >= 0) return LIVE_ROOT;
    if (value.indexOf("raw.githubusercontent.com/") >= 0) return RAW_ROOT;
    return LOCAL_ROOT;
  }

  function absolute(root, relative) {
    var rel = String(relative || "").replace(/^\/+/, "");
    if (/^https?:\/\//i.test(rel)) return rel;
    return String(root).replace(/\/+$/, "/") + rel;
  }

  function createQueuedFetcher(maxParallel) {
    var max = Math.max(1, Math.min(16, Number(maxParallel) || 12));
    var active = 0;
    var jobs = [];
    function pump() {
      while (active < max && jobs.length) {
        var job = jobs.shift();
        active++;
        fetchJson(job.url, job.token).then(job.resolve, job.reject)
          .finally(function () { active--; pump(); });
      }
    }
    return function (url, token) {
      return new Promise(function (resolve, reject) {
        jobs.push({ url: url, token: token, resolve: resolve, reject: reject });
        pump();
      });
    };
  }

  function loadSeries(root, series, version, queuedFetch) {
    var indexPath = series.indexPath || ("series/" + series.id + "/index.json");
    var indexUrl = absolute(root, indexPath);
    return queuedFetch(indexUrl, version).then(function (index) {
      var files = Array.isArray(index.files) ? index.files : [];
      if (files.length !== Number(index.count) || files.length !== Number(series.count)) {
        throw new Error("Ḥadīṯ-Serie und Index stimmen nicht überein: " + series.id);
      }
      var seriesDir = String(indexPath).replace(/index\.json$/i, "");
      return Promise.all(files.map(function (file) {
        if (!/^HAD-[0-9]{4}\.json$/.test(file)) {
          throw new Error("Ungültiger Ḥadīṯ-Dateipfad in " + series.id);
        }
        return queuedFetch(absolute(root, seriesDir + file), version);
      })).then(function (records) {
        return records.map(function (record) {
          if (!record || !/^HAD-[0-9]{4}$/.test(String(record.id || "")) ||
              !["hadith", "athar"].includes(record.recordType || "hadith") ||
              !String(record.textMarkdown || "").trim() ||
              !String(record.source || "").trim() ||
              !String(record.grade || "").trim()) {
            throw new Error("Ḥadīṯ/Āṯar-Eintrag unvollständig in " + series.id);
          }
          var out = toLibraryRecord(record);
          out.seriesId = series.id || index.series || null;
          out.seriesFirstId = series.firstId || index.firstId || null;
          out.seriesLastId = series.lastId || index.lastId || null;
          return out;
        });
      });
    });
  }

  function fallbackLibraryCatalog() {
    return {
      project: "DĀR AL TAWḤĪD – Ḥadīṯ-Bibliothek",
      sourceOfTruth: RAW_CATALOG,
      dataRoot: RAW_ROOT,
      access: {
        enabled: isTestPath(),
        status: isTestPath() ? "test-open" : "in-progress"
      }
    };
  }

  function load(options) {
    options = options || {};
    var localLibraryCatalog = options.libraryCatalogPath || libraryCatalogPath();

    return fetchJson(localLibraryCatalog, Date.now())
      .catch(function () { return fallbackLibraryCatalog(); })
      .then(function (libraryCatalog) {
        var sourceCandidates = [];
        if (options.sourceCatalogPath) sourceCandidates.push(options.sourceCatalogPath);
        sourceCandidates.push(LOCAL_CATALOG, LIVE_CATALOG, RAW_CATALOG);
        return firstJson(sourceCandidates, Date.now()).then(function (sourceHit) {
          var sourceCatalog = sourceHit.data;
          var root = rootForCatalog(sourceHit.url);
          var version = sourceCatalog.latestId || sourceCatalog.latestPublishedId || Date.now();
          var sourceSeries = Array.isArray(sourceCatalog.series) ? sourceCatalog.series.slice() : [];
          if (!sourceSeries.length) throw new Error("Ḥadīṯ-Katalog hat keine Serien.");
          if (Array.isArray(options.series) && options.series.length) {
            sourceSeries = sourceSeries.filter(function (series) {
              return options.series.indexOf(series.id) !== -1;
            });
          }
          var queuedFetch = createQueuedFetcher(options.maxConcurrentFetches);
          return Promise.all(sourceSeries.map(function (series) {
            return loadSeries(root, series, version, queuedFetch);
          })).then(function (chunks) {
            var records = sortRecords([].concat.apply([], chunks));
            var seen = new Set();
            records.forEach(function (record) {
              if (seen.has(record.id)) throw new Error("Doppelte HAD-ID: " + record.id);
              seen.add(record.id);
            });
            if (!(Array.isArray(options.series) && options.series.length) &&
                records.length !== Number(sourceCatalog.publishedCount || sourceCatalog.totalCount)) {
              throw new Error("Ḥadīṯ-Gesamtzahl stimmt nicht mit dem Katalog überein.");
            }
            var hadith = records.filter(function (r) { return r.recordType !== "athar"; });
            var athar = records.filter(function (r) { return r.recordType === "athar"; });
            var complete = hadith.filter(hasVerifiedSharh);
            var open = hadith.filter(function (r) { return !hasVerifiedSharh(r); });
            return {
              libraryCatalog: libraryCatalog,
              sourceCatalog: sourceCatalog,
              sourceCatalogURL: sourceHit.url,
              dataRoot: root,
              records: records,
              hadithRecords: hadith,
              atharRecords: athar,
              completeRecords: complete,
              openRecords: open,
              bySourceBook: groupBy(records, "sourceBook"),
              byCategory: groupBy(records, "bookCategory"),
              toAppleTvRecord: toAppleTvRecord,
              toLibraryRecord: toLibraryRecord,
              stats: {
                total: records.length,
                hadith: hadith.length,
                athar: athar.length,
                verifiedSharh: complete.length,
                openSharh: open.length,
                latestId: sourceCatalog.latestId || sourceCatalog.latestPublishedId || null
              }
            };
          });
        });
      });
  }

  window.DARHadithLibraryData = {
    load: load,
    fetchJson: fetchJson,
    toAppleTvRecord: toAppleTvRecord,
    toLibraryRecord: toLibraryRecord,
    hasVerifiedSharh: hasVerifiedSharh,
    sourceCatalog: RAW_CATALOG,
    sourceRoot: RAW_ROOT,
    version: "2.1.0+HAD-3359+sharh-athar-global"
  };
})();
