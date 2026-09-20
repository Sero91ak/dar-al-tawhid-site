"use strict";

function nfc(s) {
  return String(s == null ? "" : s).normalize("NFC");
}

function collapseSpaces(s) {
  return nfc(s).replace(/[\u00A0\u202F]/g, " ").replace(/\s+/g, " ").trim();
}

const STANDARD_MAP = [
  ["ṯ", "th"], ["Ṯ", "Th"],
  ["ḏ", "dh"], ["Ḏ", "Dh"],
  ["ǧ", "j"], ["Ǧ", "J"],
  ["ḫ", "kh"], ["Ḫ", "Kh"],
  ["š", "sh"], ["Š", "Sh"],
  ["ġ", "gh"], ["Ġ", "Gh"]
];

const READABLE_MAP = STANDARD_MAP.concat([
  ["ā", "aa"], ["Ā", "Aa"],
  ["ī", "ee"], ["Ī", "Ee"],
  ["ū", "oo"], ["Ū", "Oo"],
  ["ḥ", "h"], ["Ḥ", "H"],
  ["ṣ", "s"], ["Ṣ", "S"],
  ["ḍ", "d"], ["Ḍ", "D"],
  ["ṭ", "t"], ["Ṭ", "T"],
  ["ẓ", "z"], ["Ẓ", "Z"],
  ["ʿ", "’"], ["ʾ", "’"]
]);

function mapChars(text, pairs) {
  var s = nfc(text);
  var out = "";
  var i = 0;
  var table = Object.create(null);
  pairs.forEach(function (p) { table[p[0]] = p[1]; });
  while (i < s.length) {
    var ch = s[i];
    if (Object.prototype.hasOwnProperty.call(table, ch)) out += table[ch];
    else out += ch;
    i += 1;
  }
  return collapseSpaces(out);
}

function toStandard(scientific) {
  return mapChars(scientific, STANDARD_MAP);
}

function toReadable(scientific) {
  return mapChars(scientific, READABLE_MAP);
}

module.exports = {
  nfc: nfc,
  collapseSpaces: collapseSpaces,
  toStandard: toStandard,
  toReadable: toReadable
};
