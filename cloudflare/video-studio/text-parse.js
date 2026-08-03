/**
 * Strukturiert manuell eingefügte Textbeiträge – ohne inhaltliche Umformulierung.
 */
export function parseContributionText(raw) {
  const text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) {
    return { ok: false, reason: "Kein Textbeitrag" };
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let speaker = "";
  let source = "";
  let cta = "";
  const bodyLines = [];

  for (const line of lines) {
    if (/^(quelle|fundstelle)\s*[:：]/i.test(line)) {
      source = line.replace(/^(quelle|fundstelle)\s*[:：]\s*/i, "").trim();
      continue;
    }
    if (/folgt für mehr wissen/i.test(line) || /^telegram:/i.test(line) || /^instagram:/i.test(line) || /^website:/i.test(line) || /^by serhat/i.test(line)) {
      cta = cta ? `${cta}\n${line}` : line;
      continue;
    }
    if (!speaker && /sagte\s*:/i.test(line)) {
      speaker = line.replace(/\s*sagte\s*:.*$/i, "").replace(/\s*رحمه الله\s*$/i, "").trim();
      const after = line.split(/sagte\s*:/i)[1];
      if (after && after.trim()) bodyLines.push(after.trim());
      continue;
    }
    if (!speaker && /^(imām|imam|ibn|al-|ʿ|schaykh|scheich)/i.test(line) && line.length < 80) {
      speaker = line.replace(/[:：]\s*$/, "").trim();
      continue;
    }
    bodyLines.push(line);
  }

  const de = bodyLines.join(" ").replace(/\s+/g, " ").trim() || text;
  if (!source) {
    const srcMatch = text.match(/(?:Quelle|Fundstelle)\s*[:：]\s*(.+)$/im);
    if (srcMatch) source = srcMatch[1].trim();
  }

  return {
    ok: true,
    statement: {
      id: `manual_${Date.now().toString(36)}`,
      speaker: speaker || "Überlieferung",
      de,
      source: source || "Quelle manuell prüfen",
      topic: guessTopic(de),
      cta: cta || "",
      verified: Boolean(de && (speaker || source)),
      manual: true,
      raw: text
    },
    preview: {
      speaker: speaker || "Überlieferung",
      de: de.slice(0, 220) + (de.length > 220 ? "…" : ""),
      source: source || "—",
      cta: cta ? "vorhanden" : "Standard-CTA"
    }
  };
}

function guessTopic(de) {
  const t = String(de || "").toLowerCase();
  if (/dhikr|gedenken|herz|taqw/.test(t)) return "Dhikr";
  if (/sunnah|manhaj|glauben|aqidah|ʿaq/.test(t)) return "Sunnah";
  if (/familie|adab|kind/.test(t)) return "Adab";
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
