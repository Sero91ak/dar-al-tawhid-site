/* DĀR AL TAWḤĪD – Ḥadīṯ-Bibliothek data bridge
 * Gemeinsame Quelle: /apple-tv/hadith/
 * Apple TV rendert nur Kurzfelder; die Test-/iOS-Ḥadīṯ-Bibliothek nutzt zusätzlich Sharḥ-Felder.
 */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_DATA_V1) return;
  window.__DAR_HADITH_LIBRARY_DATA_V1 = true;

  var DEFAULT_LIBRARY_CATALOG = "/test/data/hadith-library/catalog.json";
  var DEFAULT_SOURCE_CATALOG = "/apple-tv/hadith/catalog.json";
  var DEFAULT_DATA_ROOT = "/apple-tv/hadith/";

  function normalizePath(path) {
    return String(path || "").replace(/\/+/g, "/");
  }

  function joinPath(root, path) {
    var r = String(root || "/");
    var p = String(path || "");
    if (/^https?:\/\//i.test(p) || p.charAt(0) === "/") return normalizePath(p);
    if (!r.endsWith("/")) r += "/";
    return normalizePath(r + p);
  }

  function fetchJson(path) {
    return fetch(path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Ḥadīṯ-Bibliothek konnte nicht laden: " + path + " (" + res.status + ")");
      return res.json();
    });
  }

  function pad4(value) {
    return String(value).padStart(4, "0");
  }

  function idNumber(id) {
    var m = String(id || "").match(/HAD-(\d{4})/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function seriesDirectoryFromIndexPath(indexPath) {
    var p = String(indexPath || "");
    return p.replace(/\/index\.json$/i, "");
  }

  function recordPathFromFile(dataRoot, series, file) {
    var dir = seriesDirectoryFromIndexPath(series.indexPath || series.sourceIndexPath || "");
    return joinPath(dataRoot, dir + "/" + file);
  }

  function hasVerifiedSharh(record) {
    return !!(record && record.sharhStatus === "verified" && record.sharhText && record.sharhScholar && record.sharhBook && record.sharhReference);
  }

  function toAppleTvRecord(record) {
    return {
      id: record.id,
      recordType: record.recordType || "hadith",
      language: record.language || "de",
      categoryLabel: record.categoryLabel || null,
      narratorLine: record.narratorLine || "",
      speakerLabel: record.speakerLabel || "",
      textMarkdown: record.textMarkdown || "",
      source: record.source || "",
      sourceBook: record.sourceBook || null,
      sourceChapter: record.sourceChapter || null,
      sourceSection: record.sourceSection || null,
      sourceHadithNumber: record.sourceHadithNumber || null,
      grade: record.grade || ""
    };
  }

  function toLibraryRecord(record) {
    var out = Object.assign({}, record);
    out.recordType = out.recordType || "hadith";
    out.hasVerifiedSharh = hasVerifiedSharh(record);
    out.libraryStatus = out.hasVerifiedSharh ? "complete" : "open-sharh";
    out.bookCategory = out.bookCategory || out.categoryLabel || (out.recordType === "athar" ? "Āṯār" : "Ḥadīṯ");
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

  function loadSeriesRecords(options, sourceCatalog, series) {
    var dataRoot = options.dataRoot || DEFAULT_DATA_ROOT;
    var indexPath = joinPath(dataRoot, series.indexPath || series.sourceIndexPath);
    return fetchJson(indexPath).then(function (seriesIndex) {
      var files = Array.isArray(seriesIndex.files) ? seriesIndex.files : [];
      var limit = options.limitPerSeries || 0;
      if (limit > 0) files = files.slice(0, limit);
      return Promise.all(files.map(function (file) {
        return fetchJson(recordPathFromFile(dataRoot, series, file));
      })).then(function (records) {
        return records.map(function (record) {
          var libraryRecord = toLibraryRecord(record);
          libraryRecord.seriesId = series.id || seriesIndex.series || null;
          libraryRecord.seriesFirstId = series.firstId || seriesIndex.firstId || null;
          libraryRecord.seriesLastId = series.lastId || seriesIndex.lastId || null;
          return libraryRecord;
        });
      });
    });
  }

  function load(options) {
    options = options || {};
    var libraryCatalogPath = options.libraryCatalogPath || DEFAULT_LIBRARY_CATALOG;
    return fetchJson(libraryCatalogPath).then(function (libraryCatalog) {
      var sourceCatalogPath = libraryCatalog.sourceOfTruth || DEFAULT_SOURCE_CATALOG;
      var dataRoot = libraryCatalog.dataRoot || DEFAULT_DATA_ROOT;
      return fetchJson(sourceCatalogPath).then(function (sourceCatalog) {
        var sourceSeries = Array.isArray(sourceCatalog.series) ? sourceCatalog.series : [];
        var onlySeries = Array.isArray(options.series) && options.series.length ? options.series : null;
        if (onlySeries) {
          sourceSeries = sourceSeries.filter(function (series) { return onlySeries.indexOf(series.id) !== -1; });
        }
        if (options.maxSeries && options.maxSeries > 0) sourceSeries = sourceSeries.slice(0, options.maxSeries);
        return Promise.all(sourceSeries.map(function (series) {
          return loadSeriesRecords(Object.assign({}, options, { dataRoot: dataRoot }), sourceCatalog, series);
        })).then(function (chunks) {
          var records = sortRecords([].concat.apply([], chunks));
          var complete = records.filter(hasVerifiedSharh);
          var open = records.filter(function (record) { return !hasVerifiedSharh(record); });
          return {
            libraryCatalog: libraryCatalog,
            sourceCatalog: sourceCatalog,
            records: records,
            completeRecords: complete,
            openRecords: open,
            bySourceBook: groupBy(records, "sourceBook"),
            byCategory: groupBy(records, "bookCategory"),
            toAppleTvRecord: toAppleTvRecord,
            toLibraryRecord: toLibraryRecord,
            stats: {
              total: records.length,
              verifiedSharh: complete.length,
              openSharh: open.length
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
    version: "1.0.0"
  };
})();
