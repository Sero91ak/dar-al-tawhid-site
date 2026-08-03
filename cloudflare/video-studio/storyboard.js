import { DAR_VIDEO_PROFILE } from "./profile.js";

const HIGHLIGHT_WORDS = new Set([
  "allah", "allāh", "iman", "īmān", "glauben", "sunnah", "sunna", "qur", "qurʾān", "quran",
  "wissen", "demut", "geduld", "tawhid", "tawḥīd", "tauhid", "rechtleitung", "ummah", "umma"
]);

function splitStatementBlocks(text, minBlocks = 2, maxBlocks = 4) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.split(/(?<=[.,;:!?…])\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= minBlocks && parts.length <= maxBlocks) return parts;
  if (parts.length > maxBlocks) {
    const out = [];
    const size = Math.ceil(parts.length / maxBlocks);
    for (let i = 0; i < parts.length; i += size) out.push(parts.slice(i, i + size).join(" "));
    return out.slice(0, maxBlocks);
  }
  // Wortweise in 2–4 Blöcke
  const words = clean.split(" ");
  const blockCount = Math.min(maxBlocks, Math.max(minBlocks, Math.ceil(words.length / 10)));
  const per = Math.ceil(words.length / blockCount);
  const blocks = [];
  for (let i = 0; i < words.length; i += per) blocks.push(words.slice(i, i + per).join(" "));
  return blocks.filter(Boolean);
}

export function emphasizeHtml(text) {
  return String(text || "")
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const bare = token.replace(/[^\p{L}\p{N}ʾʿāīūĀĪŪ]/gu, "").toLowerCase();
      const important = bare.length >= 7 || HIGHLIGHT_WORDS.has(bare) || /allāh|allah|qur/i.test(bare);
      if (!important) return escapeHtml(token);
      return `<span style="color:#efd78e;font-weight:700">${escapeHtml(token)}</span>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSpeakerLine(statement) {
  const speaker = String(statement?.speaker || "Überlieferung").trim();
  return `${speaker} رحمه الله sagte:`;
}

/**
 * Exakter Vorlesetext – keine Umformulierung.
 * Pausen nur über Satzzeichen (ElevenLabs liest SSML-Tags sonst ggf. vor).
 */
export function buildVoiceScript(statement) {
  const speakerLine = buildSpeakerLine(statement);
  const de = String(statement?.de || "").trim();
  const source = String(statement?.source || "").trim();
  return [
    speakerLine,
    de,
    source ? `Quelle: ${source}.` : "",
    DAR_VIDEO_PROFILE.branding.followLine
  ].filter(Boolean).join("\n\n");
}

/**
 * Abschnittsweise Einblendungen mit geschätzter Synchronität zur Stimme.
 */
export function buildCaptionPlan(statement, { totalSec = 20 } = {}) {
  const brand = DAR_VIDEO_PROFILE.branding;
  const speakerLine = buildSpeakerLine(statement);
  const de = String(statement?.de || "").trim();
  const source = String(statement?.source || "").trim();
  const blocks = splitStatementBlocks(de, 2, 4);
  const duration = Math.max(16, Number(totalSec) || 20);

  const speakerChars = speakerLine.length;
  const statementChars = Math.max(1, de.length);
  const sourceChars = source.length + 8;
  const ctaChars = brand.followLine.length + 40;
  const totalChars = speakerChars + statementChars + sourceChars + ctaChars;

  let cursor = 0.6;
  const overlays = [
    {
      role: "brand",
      at: 0.25,
      length: 2.4,
      text: brand.title,
      htmlEmphasis: false
    },
    {
      role: "speaker",
      at: cursor,
      length: Math.max(2.8, Math.min(4.2, (speakerChars / totalChars) * duration + 1.2)),
      text: speakerLine,
      htmlEmphasis: false
    }
  ];
  cursor += overlays[1].length + 0.25;

  const statementBudget = Math.max(6, duration - cursor - 7);
  blocks.forEach((block, index) => {
    const share = block.length / statementChars;
    const length = Math.max(2.6, Math.min(5.5, statementBudget * share));
    overlays.push({
      role: "statement",
      at: cursor,
      length,
      text: block,
      htmlEmphasis: true,
      blockIndex: index
    });
    cursor += length + 0.18;
  });

  overlays.push({
    role: "source",
    at: Math.min(cursor + 0.15, duration - 6.2),
    length: 3.2,
    text: source,
    htmlEmphasis: false
  });

  overlays.push({
    role: "cta",
    at: Math.max(duration - 5.8, overlays[overlays.length - 1].at + 2.8),
    length: 5.4,
    text: brand.followLine,
    social: {
      telegram: brand.telegram,
      website: brand.website,
      instagram: brand.instagram
    },
    htmlEmphasis: false
  });

  return {
    version: 2,
    voiceScript: buildVoiceScript(statement),
    overlays,
    captionLines: overlays.map((o) => ({
      at: o.at,
      text: o.role === "cta"
        ? `${o.text} · ${brand.telegram} · ${brand.website} · ${brand.instagram}`
        : o.text,
      role: o.role
    }))
  };
}

export function buildStoryboard(statement) {
  const theme = String(statement?.topic || "Wissen").trim();
  const de = String(statement?.de || "").trim();
  const scenes = [
    {
      id: "s1",
      role: "opening",
      durationSec: 5,
      camera: "slow push-in, natural handheld micro-motion",
      setting: `quiet scholarly study room at soft dawn, theme ${theme}, warm wooden shelves, parchment, calm islamic atmosphere`,
      action: "anonymous figure enters from behind, walks slowly toward window light, face never visible",
      promptFocus: "premium cinematic opening, dust motes, noble calm mood"
    },
    {
      id: "s2",
      role: "reflection",
      durationSec: 5,
      camera: "gentle orbit around seated silhouette",
      setting: `bookshelf and reading niche related to ${theme}, warm lamp light`,
      action: "anonymous figure seated with back to camera, reading quietly, modest robe, face fully hidden",
      promptFocus: "consistent clothing and room palette, contemplative"
    },
    {
      id: "s3",
      role: "emphasis",
      durationSec: 5,
      camera: "slow tilt from hands to environment, never revealing face",
      setting: `symbolic detail connected to: ${de.slice(0, 90)}`,
      action: "hands carefully turn pages or hold a book; fingers anatomically correct; modest sleeves",
      promptFocus: "accurate hands, cinematic depth of field, no deformed anatomy"
    },
    {
      id: "s4",
      role: "closing",
      durationSec: 5,
      camera: "pull-back revealing room silhouette",
      setting: "peaceful corridor or courtyard at soft dusk, islamic architecture, quiet dignity",
      action: "anonymous figure walks away into soft shadow, contemplative ending, real walking motion",
      promptFocus: "real movement, no freeze, no zoom-only still"
    }
  ];

  const captionPlan = buildCaptionPlan(statement, {
    totalSec: scenes.reduce((n, s) => n + s.durationSec, 0)
  });

  return {
    version: 2,
    profileId: DAR_VIDEO_PROFILE.id,
    theme,
    statementId: statement?.id || "",
    speaker: statement?.speaker || "",
    source: statement?.source || "",
    voiceScript: captionPlan.voiceScript,
    captionPlan,
    captionLines: captionPlan.captionLines,
    scenes: scenes.map((scene) => ({
      ...scene,
      negativePrompt:
        "face visible, front portrait, celebrity, prophet, named companion, deformed hands, extra fingers, horror, mask, music waveform, text, watermark, logo, collage, still image zoom, western office, neon",
      fullPrompt: [
        scene.setting,
        scene.action,
        scene.camera,
        scene.promptFocus,
        DAR_VIDEO_PROFILE.promptSafetySuffix
      ].join(". ")
    })),
    createdAt: new Date().toISOString()
  };
}

export { escapeHtml, splitStatementBlocks };
