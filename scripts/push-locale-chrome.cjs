"use strict";

const data = require("../cloudflare/push-locale-chrome-data.json");
const CODES = data.codes;

function fill(fallback, map) {
  const out = {};
  for (const code of CODES) out[code] = (map && map[code]) || fallback;
  if (!out.de) out.de = fallback;
  if (!out.en) out.en = out.de || fallback;
  return out;
}

function localizedNotification(title, body, titleMap, bodyMap) {
  return {
    headings: fill(title, titleMap),
    contents: fill(body, bodyMap)
  };
}

function chromePack(name) {
  return data[name] || null;
}

function dailyHeadings(kind) {
  const draft = require("../desktop-preview/i18n-core-v1/push-copy-nine-languages-draft.json");
  const key = kind === "dua" ? "daily_dua" : "daily_recommendation";
  const map = {};
  for (const code of CODES) {
    const rec = draft.copy && draft.copy[code] && draft.copy[code][key];
    if (rec && rec.status === "approved" && rec.title) map[code] = rec.title;
  }
  return map;
}

module.exports = { localizedNotification, chromePack, dailyHeadings };
