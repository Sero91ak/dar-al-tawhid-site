/* DĀR AL TAWḤĪD – central verified Ḥadīṯ data bridge
 * Source of truth: GitHub branch apple-tv-hadith-staging / apple-tv/hadith/
 * Used by Test App and prepared live/iOS Ḥadīṯ library.
 */
(function () {
  "use strict";
  if (window.__DAR_HADITH_LIBRARY_DATA_V2) return;
  window.__DAR_HADITH_LIBRARY_DATA_V2 = true;

  var RAW_ROOT = "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/hadith/";
  var RAW_CATALOG = RAW_ROOT + "catalog.json";
  var LOCAL_ROOT = "/apple-tv/hadith/";
  var LOCAL_CATALOG = LOCAL_ROOT + "catalog.json";

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
    return !!(
      record &&
      record.sharhStatus === "verified" &&
      record.sharhText &&
      record.sharhScholar &&
      record.sharhBook &&
      record.sharhReference
    );
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

  function rootForCatalog(url) {
    return String(url).indexOf("raw.githubusercontent.com/") >= 0 ? RAW_ROOT : LOCAL_ROOT;
  }

  function absolute(root, relative) {
    var rel = String(relative || "").replace(/^\/+/, "");
    if (/^https?:\/\//i.test(rel)) return rel;
    return String(root).replace(/\/+$/, "/") + rel;
  }

  function loadSeries(root, series, version) {
    var indexUrl = absolute(root, series.indexPath || ("series/" + series.id + "/index.json"));
    return fetchJson(indexUrl, version).then(function (index) {
      var files = Array.isArray(index.files) ? index.files : [];
      var seriesDir = String(series.indexPath || ("series/" + series.id + "/index.json"))
        .replace(/index\.json$/i, "");
      return Promise.all(files.map(function (file) {
        return fetchJson(absolute(root, seriesDir + file), version);
      })).then(function (records) {
        return records
          .filter(hasVerifiedSharh)
          .map(function (record) {
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
        sourceCandidates.push(RAW_CATALOG);
        sourceCandidates.push(LOCAL_CATALOG);

        return firstJson(sourceCandidates, Date.now()).then(function (sourceHit) {
          var sourceCatalog = sourceHit.data;
          var root = rootForCatalog(sourceHit.url);
          var version = sourceCatalog.latestId || sourceCatalog.latestPublishedId || Date.now();
          var sourceSeries = Array.isArray(sourceCatalog.series) ? sourceCatalog.series.slice() : [];

          if (Array.isArray(options.series) && options.series.length) {
            sourceSeries = sourceSeries.filter(function (series) {
              return options.series.indexOf(series.id) !== -1;
            });
          }

          return Promise.all(sourceSeries.map(function (series) {
            return loadSeries(root, series, version);
          })).then(function (chunks) {
            var records = sortRecords([].concat.apply([], chunks));
            var complete = records.filter(hasVerifiedSharh);
            var open = records.filter(function (record) { return !hasVerifiedSharh(record); });

            return {
              libraryCatalog: libraryCatalog,
              sourceCatalog: sourceCatalog,
              sourceCatalogURL: sourceHit.url,
              dataRoot: root,
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
    version: "2.0.0"
  };
})();
