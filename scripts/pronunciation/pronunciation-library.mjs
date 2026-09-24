import fs from "node:fs";

const DEFAULT_PATH = new URL("../../data/pronunciation/pronunciation-rules.json", import.meta.url);

export function loadPronunciationLibrary(file = DEFAULT_PATH) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const rules = Array.isArray(data.rules) ? data.rules : [];
  return {
    ...data,
    rules,
    buckets: buildBuckets(rules)
  };
}

export function buildBuckets(rules) {
  const buckets = new Map();
  for (const rule of rules) {
    const input = String(rule.string_to_replace || "");
    if (!input) continue;
    const first = [...input][0];
    if (!buckets.has(first)) buckets.set(first, []);
    buckets.get(first).push(rule);
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => String(b.string_to_replace).length - String(a.string_to_replace).length);
  }
  return buckets;
}

export function prepareNarrationText(text, library, mode = "alias") {
  const source = String(text ?? "");
  const buckets = library?.buckets || buildBuckets(library?.rules || []);
  const chars = [...source];
  let out = "";
  for (let i = 0; i < chars.length;) {
    const list = buckets.get(chars[i]) || [];
    let matched = null;
    for (const rule of list) {
      const needle = [...String(rule.string_to_replace || "")];
      if (!needle.length || i + needle.length > chars.length) continue;
      let ok = true;
      for (let j = 0; j < needle.length; j++) {
        if (chars[i + j] !== needle[j]) { ok = false; break; }
      }
      if (ok) { matched = { rule, len: needle.length }; break; }
    }
    if (!matched) {
      out += chars[i++];
      continue;
    }
    const value = mode === "ipa" ? matched.rule.ipa : matched.rule.alias;
    out += String(value || matched.rule.string_to_replace);
    i += matched.len;
  }
  return out;
}

export function findPronunciation(term, library) {
  const q = String(term || "");
  return (library?.rules || []).find((r) => r.string_to_replace === q) || null;
}
