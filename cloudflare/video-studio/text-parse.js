/**
 * Strukturiert manuell eingefügte Textbeiträge (Admin-/Feed-Format) –
 * ohne inhaltliche Umformulierung.
 */

/** Mathematische Unicode-Fett/Kursiv → normale Buchstaben (z. B. 𝒔𝒂𝒈𝒕𝒆 → sagte). */
function unwrapFancyUnicode(input) {
  let out = "";
  for (const ch of String(input || "")) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x1d400 && cp <= 0x1d419) out += String.fromCharCode(65 + (cp - 0x1d400));
    else if (cp >= 0x1d41a && cp <= 0x1d433) out += String.fromCharCode(97 + (cp - 0x1d41a));
    else if (cp >= 0x1d434 && cp <= 0x1d44d) out += String.fromCharCode(65 + (cp - 0x1d434));
    else if (cp >= 0x1d44e && cp <= 0x1d467) out += String.fromCharCode(97 + (cp - 0x1d44e));
    else if (cp >= 0x1d468 && cp <= 0x1d481) out += String.fromCharCode(65 + (cp - 0x1d468));
    else if (cp >= 0x1d482 && cp <= 0x1d49b) out += String.fromCharCode(97 + (cp - 0x1d482));
    else if (cp >= 0x1d4d0 && cp <= 0x1d4e9) out += String.fromCharCode(65 + (cp - 0x1d4d0));
    else if (cp >= 0x1d4ea && cp <= 0x1d503) out += String.fromCharCode(97 + (cp - 0x1d4ea));
    else if (cp >= 0x1d56c && cp <= 0x1d585) out += String.fromCharCode(65 + (cp - 0x1d56c));
    else if (cp >= 0x1d586 && cp <= 0x1d59f) out += String.fromCharCode(97 + (cp - 0x1d586));
    else if (cp >= 0x1d5d4 && cp <= 0x1d5ed) out += String.fromCharCode(65 + (cp - 0x1d5d4));
    else if (cp >= 0x1d5ee && cp <= 0x1d607) out += String.fromCharCode(97 + (cp - 0x1d5ee));
    else if (cp >= 0x1d63c && cp <= 0x1d655) out += String.fromCharCode(65 + (cp - 0x1d63c));
    else if (cp >= 0x1d656 && cp <= 0x1d66f) out += String.fromCharCode(97 + (cp - 0x1d656));
    else if (cp >= 0x1d670 && cp <= 0x1d689) out += String.fromCharCode(65 + (cp - 0x1d670));
    else if (cp >= 0x1d68a && cp <= 0x1d6a3) out += String.fromCharCode(97 + (cp - 0x1d68a));
    else out += ch;
  }
  return out;
}

function stripMdDecor(s) {
  return String(s || "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^[\"„“«»]+|[\"„“«»]+$/g, "")
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

function cleanSpeaker(raw) {
  return stripMdDecor(String(raw || ""))
    .replace(/^[🖋️📌📖]*\s*/u, "")
    .replace(/\s*(رضي الله عنه|رضى الله عنه|رحمه الله|عليه السلام|ﷺ)\s*/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanStatement(raw) {
  let s = stripMdDecor(String(raw || ""))
    .replace(/^[\s"„“«»]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/[“”"»]+$/u, "").trim();
  return s;
}

function cleanSource(raw) {
  return stripMdDecor(String(raw || ""))
    .replace(/^[📝📌]*\s*/u, "")
    .replace(/^(quelle|fundstelle|source)\s*[:：]\s*/iu, "")
    .replace(/\s*[🌙🖋️].*$/u, "")
    .replace(/\s*(?:Fazit|Schluss)\s*[:：].*$/iu, "")
    .trim();
}

function parseFrontmatter(raw) {
  const m = String(raw || "").match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { body: String(raw || ""), meta: {} };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    meta[kv[1]] = String(kv[2] || "").replace(/^["']|["']$/g, "").trim();
  }
  return { body: String(raw || "").slice(m[0].length), meta };
}

export function parseContributionText(raw) {
  const original = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!original) {
    return { ok: false, reason: "Kein Textbeitrag" };
  }

  const { body, meta } = parseFrontmatter(original);
  const text = unwrapFancyUnicode(body || original);
  let speaker = cleanSpeaker(meta.scholar || meta.speaker || "");
  let source = cleanSource(meta.source || meta.book || "");
  let fazit = "";
  let cta = "";
  let de = "";
  let topic = String(meta.topic || meta.category || "").trim();

  // 1) Sprecher … sagte: „Aussage“
  const saidRe =
    /(?:^|\n)\s*(?:🖋️\s*)?(?:\*\*)?([^\n*]{2,120}?)(?:\*\*)?\s*(?:رضي الله عنه|رضى الله عنه|رحمه الله|عليه السلام)?\s*sagte\s*[:：]\s*([\s\S]*?)(?=(?:\n\s*(?:📝|🌙|Quelle|Fundstelle|Fazit|Schluss|Folgt für)|$))/iu;
  const said = text.match(saidRe);
  if (said) {
    speaker = cleanSpeaker(said[1]);
    de = cleanStatement(said[2]);
  }

  // 2) Quelle / 𝐐𝐮𝐞𝐥𝐥𝐞 / 📝 Quelle
  const srcRe =
    /(?:📝\s*)?(?:\*\*)?(?:Quelle|Fundstelle|Source)(?:\*\*)?\s*[:：]\s*([^\n🌙]+?)(?=\s*(?:🌙|Fazit|Schluss|Folgt für|$))/iu;
  const src = text.match(srcRe);
  if (src) source = cleanSource(src[1]);

  // Inline „📝 Quelle:“ im Fließtext
  if (!source) {
    const inline = text.match(/📝\s*(?:Quelle|Fundstelle)?\s*[:：]?\s*([^\n🌙]+?)(?=\s*(?:🌙|Fazit|Schluss|$))/iu);
    if (inline) source = cleanSource(inline[1]);
  }

  // 3) Fazit / Schluss
  const fazitRe =
    /(?:🌙\s*)?(?:\*\*)?(?:Fazit|Schluss|Fazit\/Schluss)(?:\*\*)?\s*[:：]\s*([\s\S]*?)(?=(?:\n\s*(?:Folgt für|Telegram:|Instagram:|Website:|By Serhat)|$))/iu;
  const fz = text.match(fazitRe);
  if (fz) fazit = cleanStatement(fz[1]);

  // 4) CTA-Block
  const ctaLines = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (/folgt für mehr wissen/i.test(t) || /^telegram:/i.test(t) || /^instagram:/i.test(t) || /^website:/i.test(t) || /^by serhat/i.test(t)) {
      ctaLines.push(t);
    }
  }
  if (ctaLines.length) cta = ctaLines.join("\n");

  // Fallback: Zeilenweise (einfaches Format)
  if (!speaker || !de) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const bodyLines = [];
    for (const line of lines) {
      if (/^(quelle|fundstelle)\s*[:：]/i.test(line) || /^📝/.test(line)) {
        if (!source) source = cleanSource(line.replace(/^(📝\s*)?(quelle|fundstelle)\s*[:：]\s*/i, ""));
        continue;
      }
      if (/^(fazit|schluss)\s*[:：]/i.test(line) || /^🌙/.test(line)) {
        if (!fazit) fazit = cleanStatement(line.replace(/^(🌙\s*)?(?:\*\*)?(fazit|schluss)(?:\*\*)?\s*[:：]\s*/i, ""));
        continue;
      }
      if (/folgt für mehr wissen/i.test(line) || /^telegram:/i.test(line) || /^instagram:/i.test(line) || /^website:/i.test(line) || /^by serhat/i.test(line)) {
        continue;
      }
      if (!speaker && /sagte\s*:/i.test(line)) {
        speaker = cleanSpeaker(line.replace(/\s*sagte\s*:.*$/i, ""));
        const after = line.split(/sagte\s*:/i)[1];
        if (after && after.trim()) bodyLines.push(cleanStatement(after));
        continue;
      }
      if (!speaker && /^(imām|imam|ibn|al-|ʿ|schaykh|scheich|abū|abu)/i.test(line) && line.length < 90) {
        speaker = cleanSpeaker(line.replace(/[:：]\s*$/, ""));
        continue;
      }
      if (/^\*\*\*/.test(line) || /^["„]/.test(line)) {
        bodyLines.push(cleanStatement(line));
        continue;
      }
      bodyLines.push(line);
    }
    if (!de) de = cleanStatement(bodyLines.join(" ")) || cleanStatement(text);
  }

  // Aussage ohne Quelle/Fazit-Reste
  if (de) {
    de = de
      .replace(/\s*📝[\s\S]*$/u, "")
      .replace(/\s*🌙[\s\S]*$/u, "")
      .replace(/\s*(?:Quelle|Fundstelle)\s*[:：][\s\S]*$/iu, "")
      .replace(/\s*(?:Fazit|Schluss)\s*[:：][\s\S]*$/iu, "")
      .trim();
  }

  if (!speaker) speaker = "Überlieferung";
  if (!source) source = "Quelle manuell prüfen";
  if (!de) de = cleanStatement(text);
  if (!topic) topic = guessTopic(`${de} ${fazit}`);

  return {
    ok: true,
    statement: {
      id: `manual_${Date.now().toString(36)}`,
      speaker,
      de,
      source,
      topic,
      fazit: fazit || "",
      cta: cta || "",
      verified: Boolean(de && speaker && speaker !== "Überlieferung" && source && source !== "Quelle manuell prüfen"),
      manual: true,
      raw: original
    },
    preview: {
      speaker,
      de: de.slice(0, 220) + (de.length > 220 ? "…" : ""),
      source,
      fazit: fazit ? fazit.slice(0, 160) + (fazit.length > 160 ? "…" : "") : "—",
      cta: cta ? "vorhanden" : "Standard-CTA"
    }
  };
}

function guessTopic(de) {
  const t = String(de || "").toLowerCase();
  if (/dhikr|gedenken|herz|taqw/.test(t)) return "Dhikr";
  if (/zuhd|duny|ākhir|akhir|jenzeit/.test(t)) return "Zuhd";
  if (/sunnah|manhaj|glauben|aqidah|ʿaq/.test(t)) return "Sunnah";
  if (/familie|adab|kind/.test(t)) return "Adab";
  if (/fasten|gebet|ṣalāh|salah/.test(t)) return "Ibadah";
  if (/wissen|gelehrt|lernen/.test(t)) return "Wissen";
  return "Wissen";
}

export function estimateVideoCost({ clipCount = 3, durationSec = 15, voiceChars = 400 } = {}) {
  const videoEur = Number((durationSec * 0.05).toFixed(2));
  const voiceEur = Number(((voiceChars / 1000) * 0.18).toFixed(2));
  const renderEur = 0.05;
  const totalMin = Number((videoEur + voiceEur + renderEur).toFixed(2));
  const totalMax = Number((totalMin * 1.25).toFixed(2));
  return {
    mode: "günstig · 3 × 5 s Bewegung",
    clipCount,
    durationSec,
    breakdown: { videoEur, voiceEur, renderEur },
    estimateMinEur: totalMin,
    estimateMaxEur: totalMax
  };
}
