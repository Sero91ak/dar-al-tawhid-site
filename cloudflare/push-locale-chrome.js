/**
 * Adult push chrome in the seven OneSignal language codes.
 * ku/ckb are not OneSignal language codes. No send, no schedule, no prayer math.
 */
import data from "./push-locale-chrome-data.json" with { type: "json" };

const CODES = data.codes;

function fill(fallback, map) {
  const out = {};
  for (const code of CODES) out[code] = map?.[code] || fallback;
  if (!out.de) out.de = fallback;
  if (!out.en) out.en = out.de || fallback;
  return out;
}

export function localizedNotification(title, body, titleMap, bodyMap) {
  return {
    headings: fill(title, titleMap),
    contents: fill(body, bodyMap)
  };
}

export function jummahLocale(mode, german) {
  const pack = data.jummah[mode] || data.jummah.entry;
  return localizedNotification(german.title, german.body, pack.title, pack.body);
}

export function chromePack(name) {
  return data[name] || null;
}
