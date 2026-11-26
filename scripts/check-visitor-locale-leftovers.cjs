#!/usr/bin/env node
/**
 * Visitor locale leftover gate.
 * A non-de locale must not keep visible German: catalog entries translate the
 * known UI strings, and the runtime replaces anything still German with a
 * notice in the active language. Blocked strings are listed, not shown.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const LOCALES = ["ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
const GERMAN_STOP = /(^|[^\p{L}\p{N}])(und|oder|nicht|keine|keiner|eine|einer|einem|eines|ist|sind|wird|werden|mit|für|auf|von|der|die|das|den|dem|ein|im|zum|zur|vom|beim|auch|nach|bei|aus|wenn|aber|noch|nur|sich|sowie|diese|dieser|dieses|dein|deine|deinen)(?=$|[^\p{L}\p{N}])/giu;
const UI_DE = /(^|[^\p{L}\p{N}])(Standort|Startseite|Vollansicht|Wissenschat|Wissensfinder|Quellenarchiv|Gebetszeiten|Einstellungen|Demnächst|Impressum|Datenschutz|Überlieferung|Rezitation|Fundamente|Aussage|Gelehrten|Installieren|Installationshilfe|Kurzfazit|Originalwortlaut|Einordnung|Fundstellen|richtig|Beiträge|Schließen|Zurück|Weiter|Lernbereich|Frage|Hinweis|Sprecher|Quellen|Teilen|öffnen|Suche|Gebet|Antwort|auswählen|wiederholen|gearbeitet|Verständnis|Anmeldung|Originalquelle|Themen|Gelehrte|Werkzeuge|Sammlungen|Bittgebete|Fachbegriffe|Fundstelle|Nachweis|Überlieferungen|Bewertung|Sprache|Wähle|Waehle)(?=$|[^\p{L}\p{N}])/iu;

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function looksGerman(value) {
  const s = String(value || "").replace(/\s+/g, " ").trim();
  if (!s || s.length < 4) return false;
  const ar = (s.match(/[\u0600-\u06ff]/g) || []).length;
  const lat = (s.match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
  if (ar > lat && ar > 8) return false;
  if (UI_DE.test(s)) return true;
  const hits = s.match(new RegExp(GERMAN_STOP.source, "giu"));
  if (/ß/.test(s)) return true;
  if (/[äöüÄÖÜ]/.test(s) && hits && hits.length >= 1) return true;
  return !!(hits && hits.length >= 2);
}

const runtime = fs.readFileSync(path.join(ROOT, "assets/i18n/adult-ui-translate.js"), "utf8");
if (!runtime.includes("data-canonical-content") || !runtime.includes("post-body")) {
  fail("runtime lost the visitor parity tokens");
}
for (const token of ["looksGerman", "rememberBlocked", "applyTemplates", "phraseReplace", "scheduleTimer"]) {
  if (!runtime.includes(token)) fail("runtime missing " + token);
}
const learn = fs.readFileSync(path.join(ROOT, "lernen/wissen-adab/index.html"), "utf8");
if (!learn.includes("/assets/i18n/adult-ui-translate.js")) fail("lernen/wissen-adab does not load the locale runtime");

const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/i18n/visitor-leftover-strings-v1.json"), "utf8"));
const strings = pack.strings || {};
const keys = Object.keys(strings);
if (keys.length < 70) fail("leftover dictionary too small: " + keys.length);
const catalogs = {};
for (const code of LOCALES) {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/i18n/catalog/" + code + ".json"), "utf8"));
  catalogs[code] = cat.entries || {};
  for (const de of keys) {
    const to = catalogs[code][de];
    if (!to) fail(code + " catalog missing " + de);
    if (to === de) fail(code + " translation equals German: " + de);
    if (looksGerman(to)) fail(code + " translation still looks German: " + de + " => " + to);
  }
}
console.log("OK: leftover dictionary", keys.length, "keys in", LOCALES.length, "catalogs");

function crawlLocale(code) {
  const samples = [
    "Standort",
    "ISLAMISCHES WISSEN · FUNDAMENTE",
    "⌂ Startseite",
    "FRAGE 2 VON 4",
    "3 richtig",
    "Quelle Q46 ↗",
    "Aussagen mit prüfbaren Quellen, Themen und Gelehrten.",
    "Diese Erklärung steht nur auf Deutsch und bleibt sonst verborgen.",
    "DĀR AL TAWḤĪD",
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
  ];
  const texts = samples.map((value) => ({ value, tag: "span" }));
  texts.push({ value: "Deutsch", tag: "option" });

  function makeEl(tag) {
    const attrs = {};
    const el = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      parentElement: null,
      childNodes: [],
      getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
      setAttribute(name, value) { attrs[name] = String(value); },
      closest(sel) {
        let cur = el;
        while (cur) {
          if (sel === "select,option" && (cur.tagName === "SELECT" || cur.tagName === "OPTION")) return cur;
          if (sel.indexOf("data-dar-no-translate") >= 0 && cur.getAttribute && cur.getAttribute("data-dar-no-translate") != null) return cur;
          cur = cur.parentElement;
        }
        return null;
      }
    };
    return el;
  }

  const body = makeEl("body");
  const nodes = [];
  for (const sample of texts) {
    const parent = makeEl(sample.tag);
    parent.parentElement = sample.tag === "option" ? makeEl("select") : body;
    if (sample.tag !== "option") body.childNodes.push(parent);
    const text = { nodeType: 3, nodeValue: sample.value, parentElement: parent };
    parent.childNodes.push(text);
    nodes.push(text);
  }

  const catalog = catalogs[code];
  const listeners = {};
  const context = {
    window: null,
    console,
    setTimeout,
    clearTimeout,
    setInterval() { return 0; },
    clearInterval() {},
    URLSearchParams,
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    MutationObserver: class { constructor() {} observe() {} disconnect() {} },
    NodeFilter: { SHOW_ELEMENT: 1, SHOW_TEXT: 4 }
  };
  const document = {
    readyState: "complete",
    title: "Wissen und Adab · 4 Verständnisfragen | DĀR AL TAWḤĪD",
    documentElement: { lang: "", dir: "" },
    body,
    head: makeEl("head"),
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    getElementById() { return null; },
    querySelector() { return null; },
    createElement(tag) { return makeEl(tag); },
    createTreeWalker() {
      const flat = [];
      (function walk(node) {
        flat.push(node);
        (node.childNodes || []).forEach(walk);
      })(body);
      let i = 0;
      return { nextNode() { return i < flat.length ? flat[i++] : null; } };
    }
  };
  document.head.appendChild = function (node) { document.head.childNodes.push(node); };
  const storage = { darAdultPreferredLocaleV1: code };
  const location = { pathname: "/", search: "?lang=" + code, hash: "", href: "https://dar-al-tawhid.de/?lang=" + code };
  context.window = context;
  context.document = document;
  context.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
  context.dispatchEvent = () => {};
  context.location = location;
  context.localStorage = {
    getItem(k) { return storage[k] || null; },
    setItem(k, v) { storage[k] = String(v); }
  };
  context.fetch = async (url) => {
    const name = String(url);
    let file = null;
    if (name.indexOf("/assets/i18n/catalog/") >= 0) file = path.join(ROOT, "assets/i18n/catalog/" + code + ".json");
    if (name.indexOf("/assets/i18n/content/hadith-") >= 0) file = path.join(ROOT, "assets/i18n/content/hadith-" + code + ".json");
    else if (name.indexOf("/assets/i18n/content/") >= 0) file = path.join(ROOT, "assets/i18n/content/" + code + ".json");
    if (!file || !fs.existsSync(file)) return { ok: false, json: async () => ({}) };
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
  };
  context.DARAdultLanguagePickerV1 = { available: () => true };
  vm.createContext(context);
  vm.runInContext(runtime, context, { filename: "adult-ui-translate.js" });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (context.DARAdultUI18n) context.DARAdultUI18n.apply();
        const leftovers = [];
        if (looksGerman(document.title)) leftovers.push("title: " + document.title);
        for (const node of nodes) {
          if (node.parentElement && node.parentElement.tagName === "OPTION") continue;
          if (looksGerman(node.nodeValue)) leftovers.push(node.nodeValue);
        }
        const blocked = context.DARAdultUI18n ? context.DARAdultUI18n.blocked : [];
        if (!blocked.length) leftovers.push("blocked list empty; untranslated German was not recorded");
        if (looksGerman(nodes[0].nodeValue)) leftovers.push("known UI string stayed German");
        resolve({ leftovers, blocked: blocked.length, title: document.title });
      } catch (error) {
        reject(error);
      }
    }, 400);
  });
}

(async () => {
  for (const code of LOCALES) {
    const result = await crawlLocale(code);
    if (result.leftovers.length) fail(code + " crawl still has German: " + result.leftovers.join(" | "));
    console.log("OK:", code, "crawl clean; blocked notices", result.blocked);
  }
})().catch((error) => fail(error && error.stack ? error.stack : error));
