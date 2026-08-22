import { DAR_VIDEO_PROFILE } from "./profile.js";
import { resolveThemeAtmosphere } from "./theme-presets.js";
import { depictionPromptBlock, isProphetRelatedStatement, motionNegativePrompt } from "./depiction-rules.js";
import {
  DAR_CAPTION_SLOTS,
  DAR_VIDEO_DURATION_SEC,
  PRESERVE_SCENE_PROMPT,
  PRESERVE_SCENE_NEGATIVE,
  sanitizeTopicLabel
} from "./timeline.js";
import { prepareVoiceScript } from "./voice-prep.js";

/** Kernbegriffe / Phrasen für elegante Hervorhebung (Script nur DE) */
const HIGHLIGHT_WORDS = new Set([
  "allah", "allāh", "iman", "īmān", "glauben", "sunnah", "sunna", "qurʾān", "quran",
  "wissen", "demut", "geduld", "tawhid", "tawḥīd", "tauhid", "rechtleitung", "ummah", "umma",
  "dunyā", "dunya", "jenseits", "ākhirah", "akhirah"
]);

const HIGHLIGHT_PHRASES = [
  /besser als ihr/gi,
  /enthaltsamer gegenüber der duny[aā]/gi,
  /strebten stärker nach dem jenseits/gi,
  /mehr im fasten/gi,
  /herzen zählten/gi
];

function splitStatementBlocks(text, minBlocks = 2, maxBlocks = 3) {
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
  const words = clean.split(" ");
  const blockCount = Math.min(maxBlocks, Math.max(minBlocks, Math.ceil(words.length / 12)));
  const per = Math.ceil(words.length / blockCount);
  const blocks = [];
  for (let i = 0; i < words.length; i += per) blocks.push(words.slice(i, i + per).join(" "));
  return blocks.filter(Boolean);
}

function hasArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/.test(String(text || ""));
}

export function emphasizeHtml(text) {
  const raw = String(text || "");
  const held = [];
  let work = raw;
  HIGHLIGHT_PHRASES.forEach((re) => {
    work = work.replace(re, (m) => {
      if (hasArabic(m)) return m;
      const i = held.length;
      held.push(
        `<span style="font-family:${DAR_VIDEO_PROFILE.typography.script};font-size:1.12em;color:${DAR_VIDEO_PROFILE.typography.gold};font-weight:400;text-decoration:underline;text-decoration-color:rgba(239,215,142,.7);text-underline-offset:4px">${escapeHtml(m)}</span>`
      );
      return `\0PH${i}\0`;
    });
  });
  const out = work
    .split(/(\s+|\0PH\d+\0)/)
    .map((token) => {
      if (!token) return "";
      if (/^\s+$/.test(token)) return token;
      const ph = token.match(/^\0PH(\d+)\0$/);
      if (ph) return held[Number(ph[1])] || "";
      const bare = token.replace(/[^\p{L}\p{N}ʾʿāīūĀĪŪ]/gu, "").toLowerCase();
      if (hasArabic(token)) return escapeHtml(token);
      const important = HIGHLIGHT_WORDS.has(bare) || /allāh|allah|qurʾ?ān|quran|tawḥ?īd|tauhid/i.test(bare);
      if (!important) return escapeHtml(token);
      return `<span style="color:${DAR_VIDEO_PROFILE.typography.gold};font-weight:600;text-decoration:underline;text-decoration-color:rgba(239,215,142,.75);text-underline-offset:3px;text-decoration-thickness:1px">${escapeHtml(token)}</span>`;
    })
    .join("");
  return out;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HONORIFIC_RE = /رضي الله عنه|رضي الله عنها|رحمه الله|رحمها الله|عليه السلام|ﷺ/;

export function buildSpeakerLine(statement) {
  let speaker = String(statement?.speaker || "Überlieferung").trim();
  speaker = speaker.replace(/\s*sagte\s*:?\s*$/i, "").trim();
  if (HONORIFIC_RE.test(speaker)) {
    return `${speaker} sagte:`;
  }
  const honorific = String(statement?.honorific || "رحمه الله").trim() || "رحمه الله";
  return `${speaker} ${honorific} sagte:`;
}

/**
 * Exakter Vorlesetext – bereinigt (kein Markdown/Emoji/URL), keine Umformulierung.
 */
export function buildVoiceScript(statement) {
  return prepareVoiceScript({
    speakerLine: buildSpeakerLine(statement),
    quote: String(statement?.de || "").trim(),
    source: String(statement?.source || "").trim(),
    followLine: DAR_VIDEO_PROFILE.branding.followLine
  });
}

/**
 * Feste 15s-Einblendungen laut Spezifikation.
 */
export function buildCaptionPlan(statement, { totalSec = DAR_VIDEO_DURATION_SEC } = {}) {
  const brand = DAR_VIDEO_PROFILE.branding;
  const duration = DAR_VIDEO_DURATION_SEC;
  void totalSec;
  const speakerLine = buildSpeakerLine(statement);
  const de = String(statement?.de || "").trim();
  const source = String(statement?.source || "").trim();
  const blocks = splitStatementBlocks(de, 2, 3);
  const slots = DAR_CAPTION_SLOTS;

  const statementStart = slots.statement.at;
  const statementEnd = slots.statement.end;
  const statementWindow = statementEnd - statementStart;
  const gap = 0.22;
  const usable = statementWindow - gap * Math.max(0, blocks.length - 1);
  const totalChars = Math.max(1, blocks.reduce((n, b) => n + b.length, 0));

  const overlays = [
    {
      role: "brand",
      at: slots.brand.at,
      length: slots.brand.length,
      text: brand.title,
      topic: null,
      htmlEmphasis: false
    },
    {
      role: "speaker",
      at: slots.speaker.at,
      length: slots.speaker.length,
      text: speakerLine,
      htmlEmphasis: false
    }
  ];

  let cursor = statementStart;
  blocks.forEach((block, index) => {
    const share = block.length / totalChars;
    const length = Math.max(1.8, usable * share);
    const remainingBlocks = blocks.length - index - 1;
    const maxLen = statementEnd - cursor - remainingBlocks * (1.8 + gap);
    const len = Math.min(length, Math.max(1.8, maxLen));
    overlays.push({
      role: "statement",
      at: cursor,
      length: len,
      text: block,
      htmlEmphasis: true,
      blockIndex: index
    });
    cursor += len + gap;
  });

  overlays.push({
    role: "source",
    at: slots.source.at,
    length: slots.source.length,
    text: source,
    htmlEmphasis: false
  });

  overlays.push({
    role: "cta",
    at: slots.cta.at,
    length: slots.cta.length,
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
    version: 5,
    templateId: DAR_VIDEO_PROFILE.id,
    durationSec: duration,
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
  const hay = `${statement?.de || ""} ${statement?.raw || ""} ${statement?.fazit || ""}`;
  const theme = sanitizeTopicLabel(statement?.topic || "", hay) || "Wissen";
  const de = String(statement?.de || "").trim();
  const atmosphere = resolveThemeAtmosphere(theme, de);
  const fromStill = Boolean(sceneImageUrl);
  const prophetSafe = isProphetRelatedStatement(statement);
  const depiction = depictionPromptBlock(statement);

  const figureAction = prophetSafe
    ? "no human figure representing a prophet; only environment, objects, manuscripts, architecture already in frame"
    : "if a person already exists in the still, keep the same anonymous figure only — back/side/cropped/shadowed face";

  const motionScenes = [
    {
      id: "s1",
      role: "opening",
      durationSec: 5,
      camera: "slow push-in, natural micro-motion, max subtle zoom",
      setting: fromStill
        ? PRESERVE_SCENE_PROMPT
        : prophetSafe
          ? `${atmosphere.opening}; empty or environment-led frame, no prophetic figure`
          : atmosphere.opening,
      action: fromStill
        ? `gentle atmospheric motion only: soft light shift, dust motes, fabric micro-movement; ${figureAction}`
        : prophetSafe
          ? "slow reveal of historically fitting space with dust and light; no prophetic body depiction"
          : "anonymous figure enters from behind, walks slowly toward window light, face never visible, modest historically fitting clothing",
      promptFocus: fromStill
        ? "preserve composition; subtle motion only; no new objects"
        : "premium cinematic opening, real motion, noble calm DAR image-post mood, theme-bound, no text, no logos"
    },
    {
      id: "s2",
      role: "reflection",
      durationSec: 5,
      camera: fromStill ? "gentle lateral drift" : "gentle orbit or slow drift",
      setting: fromStill
        ? `${PRESERVE_SCENE_PROMPT} Same locked visual identity as start frame.`
        : prophetSafe
          ? atmosphere.reflection.replace(/anonymous figure[^,]*/gi, "quiet empty scholarly niche")
          : atmosphere.reflection,
      action: fromStill
        ? `subtle environmental motion; ${figureAction}`
        : prophetSafe
          ? "pages, light, or curtains move gently in an empty historically plausible room"
          : "anonymous figure seated with back to camera, reading quietly, modest robe, face fully hidden",
      promptFocus: fromStill
        ? "no wardrobe, architecture, or era change; no new vehicles or people"
        : "consistent identity, contemplative, historically plausible, no morphing"
    },
    {
      id: "s3",
      role: "emphasis",
      durationSec: 5,
      camera: fromStill ? "slow pull-back within same space" : "slow tilt or pull-back, never revealing a face",
      setting: fromStill
        ? `${PRESERVE_SCENE_PROMPT} Continuity of the uploaded still.`
        : prophetSafe
          ? `${atmosphere.emphasis}; symbolic objects only; thematic cue: ${de.slice(0, 80)}`
          : `${atmosphere.emphasis}; thematic cue: ${de.slice(0, 90)}`,
      action: fromStill
        ? `natural light change, dust; ${figureAction}`
        : prophetSafe
          ? "objects/manuscripts only; correct anatomy if any non-prophet anonymous hands"
          : "hands carefully interact with books or quiet objects; fingers anatomically correct; modest sleeves",
      promptFocus: fromStill
        ? "accurate continuity; no freeze-zoom fake motion; no new buildings or cars"
        : "accurate anatomy, cinematic depth, real movement"
    }
  ].slice(0, Math.max(1, Math.min(3, Number(clipCount) || 3)));

  const captionPlan = buildCaptionPlan(statement, { totalSec: DAR_VIDEO_DURATION_SEC });

  return {
    version: 4,
    profileId: DAR_VIDEO_PROFILE.id,
    templateId: DAR_VIDEO_PROFILE.id,
    theme,
    themePreset: atmosphere.id,
    themeLabel: atmosphere.label,
    prophetRelated: prophetSafe,
    fromStill,
    sceneImageUrl: sceneImageUrl || null,
    motionSeconds: DAR_VIDEO_DURATION_SEC,
    statementId: statement?.id || "",
    speaker: statement?.speaker || "",
    source: statement?.source || "",
    voiceScript: captionPlan.voiceScript,
    captionPlan,
    captionLines: captionPlan.captionLines,
    scenes: motionScenes.map((scene) => ({
      ...scene,
      negativePrompt: fromStill
        ? `${PRESERVE_SCENE_NEGATIVE}, ${motionNegativePrompt(statement)}`
        : motionNegativePrompt(statement),
      fullPrompt: fromStill
        ? [PRESERVE_SCENE_PROMPT, scene.action, scene.camera, scene.promptFocus, depiction].join(". ")
        : [
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
