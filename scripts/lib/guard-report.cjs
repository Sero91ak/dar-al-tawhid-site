/**
 * Gemeinsame Helfer für die CI-Guard-Skripte (scripts/*-guard.js, app-health-check.js).
 *
 * Bündelt den überall duplizierten Boilerplate:
 *   - ROOT (Repo-Wurzel, unabhängig vom Aufruf-Verzeichnis)
 *   - read(file) / exists(file) relativ zur Repo-Wurzel
 *   - createReporter(prefix): fail/ok/mustInclude/mustNotInclude/mustExist
 *     mit identischer Ausgabe wie zuvor pro Guard dupliziert.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

function createReporter(prefix) {
  const tag = prefix ? `${prefix} ` : "";
  const state = { failed: 0 };

  function fail(msg) {
    console.error(`${tag}FAIL:`, msg);
    state.failed += 1;
  }

  function ok(msg) {
    console.log(`${tag}OK:`, msg);
  }

  function mustInclude(label, content, needles) {
    for (const needle of needles) {
      if (!content.includes(needle)) {
        fail(`${label}: fehlt „${needle}“`);
        return false;
      }
    }
    ok(`${label}: alle Pflicht-Marker (${needles.length})`);
    return true;
  }

  function mustNotInclude(label, content, needles) {
    for (const needle of needles) {
      if (content.includes(needle)) {
        fail(`${label}: verboten – „${needle}“`);
        return false;
      }
    }
    ok(`${label}: keine verbotenen Muster (${needles.length})`);
    return true;
  }

  function mustExist(file) {
    if (!exists(file)) {
      fail(`Datei fehlt: ${file}`);
      return false;
    }
    ok(`Datei vorhanden: ${file}`);
    return true;
  }

  return {
    fail,
    ok,
    mustInclude,
    mustNotInclude,
    mustExist,
    get failed() {
      return state.failed;
    },
  };
}

module.exports = { ROOT, read, exists, createReporter };
