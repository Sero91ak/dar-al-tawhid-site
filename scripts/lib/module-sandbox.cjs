/**
 * Gemeinsame Helfer für die vm-basierten Modul-Tests
 * (quellen-manager-test.js, kurzlink-manager-test.js, zakat-engine-test.js).
 *
 * loadSandboxModule() lädt ein Browser-Modul (das sich an window.<Name> hängt)
 * in einer vm-Sandbox und gibt den exportierten Namespace zurück.
 * createAssert() liefert die überall gleiche ok/fail/assert-Logik mit failed-Zähler.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function loadSandboxModule(file, globalName, extraGlobals = {}) {
  const sandbox = { window: {}, ...extraGlobals };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read(file), sandbox);
  return sandbox.window[globalName];
}

function createAssert() {
  const state = { failed: 0 };

  function ok(msg) {
    console.log("OK:", msg);
  }

  function fail(msg) {
    console.error("FAIL:", msg);
    state.failed += 1;
  }

  function assert(cond, msg) {
    if (cond) ok(msg);
    else fail(msg);
  }

  return {
    ok,
    fail,
    assert,
    get failed() {
      return state.failed;
    },
  };
}

module.exports = { ROOT, read, loadSandboxModule, createAssert };
