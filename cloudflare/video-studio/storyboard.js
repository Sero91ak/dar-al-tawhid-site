import { DAR_VIDEO_PROFILE } from "./profile.js";
import { resolveThemeAtmosphere } from "./theme-presets.js";
import { depictionPromptBlock, isProphetRelatedStatement, motionNegativePrompt } from "./depiction-rules.js";

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
  /* Bildbeitrag-Stil: nur Kernbegriffe dezent gold unterstreichen – kein Flash aller langen Wörter */
  return String(text || "")
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const bare = token.replace(/[^\p{L}\p{N}ʾʿāīūĀĪŪ]/gu, "").toLowerCase();
      const important = HIGHLIGHT_WORDS.has(bare) || /allāh|allah|qurʾ?ān|quran|tawḥ?īd|tauhid/i.test(bare);
      if (!important) return escapeHtml(token);
      return `<span style="color:#efd78e;font-weight:600;text-decoration:underline;text-decoration-color:rgba(239,215,142,.75);text-underline-offset:3px;text-decoration-thickness:1px">${escapeHtml(token)}</span>`;
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
 * Abschnittsweise Einblendungen – ruhig, lesbar wie Bildbeitrag (kein Topic/Dhikr-Flash).
 */
export function buildCaptionPlan(statement, { totalSec = 20 } = {}) {
  const brand = DAR_VIDEO_PROFILE.branding;
  const speakerLine = buildSpeakerLine(statement);
  const de = String(statement?.de || "").trim();
  const source = String(statement?.source || "").trim();
  const blocks = splitStatementBlocks(de, 2, 3);
  const duration = Math.max(16, Number(totalSec) || 20);

  const speakerChars = speakerLine.length;
  const statementChars = Math.max(1, de.length);
  const sourceChars = source.length + 8;
  const ctaChars = brand.followLine.length + 40;
  const totalChars = speakerChars + statementChars + sourceChars + ctaChars;

  let cursor = 0.45;
  const overlays = [
    {
      role: "brand",
      at: 0.15,
      length: 2.0,
      text: brand.title,
      /* Kein Topic (Dhikr etc.) – Branding nur über Logo-Wasserzeichen + dezente Markenzeile */
      topic: null,
      htmlEmphasis: false
    },
    {
      role: "speaker",
      at: cursor,
      length: Math.max(3.2, Math.min(4.8, (speakerChars / totalChars) * duration + 1.6)),
      text: speakerLine,
      htmlEmphasis: false
    }
  ];
  cursor += overlays[1].length + 0.35;

  const statementBudget = Math.max(7, duration - cursor - 8);
  blocks.forEach((block, index) => {
    const share = block.length / statementChars;
    const length = Math.max(3.4, Math.min(6.2, statementBudget * share));
    overlays.push({
      role: "statement",
      at: cursor,
      length,
      text: block,
      htmlEmphasis: true,
      blockIndex: index
    });
    cursor += length + 0.28;
  });

  overlays.push({
    role: "source",
    at: Math.min(cursor + 0.2, duration - 7.0),
    length: 4.0,
    text: source ? `Quelle: ${source}` : "",
    htmlEmphasis: false
  });

  overlays.push({
    role: "cta",
    at: Math.max(duration - 6.2, overlays[overlays.length - 1].at + overlays[overlays.length - 1].length + 0.2),
    length: 6.0,
    text: brand.followLine,
    credit: brand.credit,
    social: {
      telegram: brand.telegram,
      website: brand.website,
      instagram: brand.instagram
    },
    htmlEmphasis: false
  });

  return {
    version: 4,
    templateId: DAR_VIDEO_PROFILE.id,
    voiceScript: buildVoiceScript(statement),
    overlays,
    captionLines: overlays.map((o) => ({
      at: o.at,
      text: o.role === "cta"
        ? `${o.text} · ${brand.telegram} · ${brand.website} · ${brand.instagram} · ${brand.credit}`
        : o.text,
      role: o.role
    }))
  };
}

export function buildStoryboard(statement, { sceneImageUrl = "", clipCount = 3 } = {}) {
  const theme = String(statement?.topic || "Wissen").trim();
  const de = String(statement?.de || "").trim();
  const atmosphere = resolveThemeAtmosphere(theme, de);
  const fromStill = Boolean(sceneImageUrl);
  const prophetSafe = isProphetRelatedStatement(statement);
  const depiction = depictionPromptBlock(statement);

  const figureAction = prophetSafe
    ? "no human figure representing a prophet; only environment, objects, manuscripts, architecture, or distant anonymous people not portraying the prophet"
    : "anonymous symbolic figure only — back/side/cropped/shadowed face, never identifiable as the named person";

  const motionScenes = [
    {
      id: "s1",
      role: "opening",
      durationSec: 5,
      camera: "slow push-in, natural handheld micro-motion",
      setting: fromStill
        ? "Continue the exact same scene identity as the provided still frame; preserve person, clothing, room, light, palette, and historical era"
        : prophetSafe
          ? `${atmosphere.opening}; empty or environment-led frame, no prophetic figure`
          : atmosphere.opening,
      action: fromStill
        ? `gentle atmospheric motion only: soft light shift, dust motes, fabric micro-movement; ${figureAction}`
        : prophetSafe
          ? "slow reveal of historically fitting space with dust and light; no prophetic body depiction"
          : "anonymous figure enters from behind, walks slowly toward window light, face never visible, modest historically fitting clothing",
      promptFocus: "premium cinematic opening, real motion, noble calm DAR image-post mood, theme-bound, no text, no logos"
    },
    {
      id: "s2",
      role: "reflection",
      durationSec: 5,
      camera: fromStill ? "gentle lateral drift / soft orbit" : "gentle orbit or slow drift",
      setting: fromStill
        ? "Same locked visual identity as start frame; no wardrobe, architecture, or era change"
        : prophetSafe
          ? atmosphere.reflection.replace(/anonymous figure[^,]*/gi, "quiet empty scholarly niche")
          : atmosphere.reflection,
      action: fromStill
        ? `subtle environmental motion; ${figureAction}`
        : prophetSafe
          ? "pages, light, or curtains move gently in an empty historically plausible room"
          : "anonymous figure seated with back to camera, reading quietly, modest robe, face fully hidden",
      promptFocus: "consistent identity, contemplative, historically plausible, no cheap stock look, no morphing"
    },
    {
      id: "s3",
      role: "emphasis",
      durationSec: 5,
      camera: fromStill ? "slow pull-back revealing more of the same space" : "slow tilt or pull-back, never revealing a face",
      setting: fromStill
        ? `Same scene continuity; thematic calm: ${de.slice(0, 80)}`
        : prophetSafe
          ? `${atmosphere.emphasis}; symbolic objects only; thematic cue: ${de.slice(0, 80)}`
          : `${atmosphere.emphasis}; thematic cue: ${de.slice(0, 90)}`,
      action: fromStill
        ? `natural light change, dust; ${figureAction}; anatomically correct hands if a non-prophet anonymous figure is visible`
        : prophetSafe
          ? "hands of anonymous non-prophet figure only if needed and face-hidden; else objects/manuscripts only; correct anatomy"
          : "hands carefully interact with books or quiet objects; fingers anatomically correct; modest sleeves",
      promptFocus: "accurate anatomy, cinematic depth, real movement, no freeze-zoom fake motion"
    }
  ].slice(0, Math.max(1, Math.min(3, Number(clipCount) || 3)));

  const captionPlan = buildCaptionPlan(statement, {
    totalSec: motionScenes.reduce((n, s) => n + s.durationSec, 0)
  });

  return {
    version: 3,
    profileId: DAR_VIDEO_PROFILE.id,
    templateId: DAR_VIDEO_PROFILE.id,
    theme,
    themePreset: atmosphere.id,
    themeLabel: atmosphere.label,
    prophetRelated: prophetSafe,
    sceneImageUrl: sceneImageUrl || null,
    motionSeconds: motionScenes.reduce((n, s) => n + s.durationSec, 0),
    statementId: statement?.id || "",
    speaker: statement?.speaker || "",
    source: statement?.source || "",
    voiceScript: captionPlan.voiceScript,
    captionPlan,
    captionLines: captionPlan.captionLines,
    scenes: motionScenes.map((scene) => ({
      ...scene,
      negativePrompt: motionNegativePrompt(statement),
      fullPrompt: [
        scene.setting,
        scene.action,
        scene.camera,
        scene.promptFocus,
        depiction,
        DAR_VIDEO_PROFILE.promptSafetySuffix
      ].join(". ")
    })),
    createdAt: new Date().toISOString()
  };
}

export { escapeHtml, splitStatementBlocks };
