#!/usr/bin/env node
/** Lightweight unit checks for DAR video studio core (no network, no secrets). */
import assert from "node:assert/strict";
import { normalizeBudget, assertWithinBudget } from "../cloudflare/video-studio/budget.js";
import {
  buildStoryboard,
  buildCaptionPlan,
  buildVoiceScript,
  buildSpeakerLine
} from "../cloudflare/video-studio/storyboard.js";
import { runQualityChecks } from "../cloudflare/video-studio/quality.js";
import { selectStatement } from "../cloudflare/video-studio/statements.js";
import { DAR_VIDEO_PROFILE } from "../cloudflare/video-studio/profile.js";
import { buildShotstackTimeline, shotstackEnvironment } from "../cloudflare/video-studio/compose.js";
import { resolveThemeAtmosphere } from "../cloudflare/video-studio/theme-presets.js";
import { isProphetRelatedStatement } from "../cloudflare/video-studio/depiction-rules.js";
import { DAR_CAPTION_SLOTS, PRESERVE_SCENE_PROMPT } from "../cloudflare/video-studio/timeline.js";
import { validateGlyphCoverage } from "../cloudflare/video-studio/glyphs.js";
import { runVideoValidation } from "../cloudflare/video-studio/validation.js";
import { stripVoiceNoise } from "../cloudflare/video-studio/voice-prep.js";

assert.equal(DAR_VIDEO_PROFILE.id, "dar-standard-v4");
assert.equal(DAR_VIDEO_PROFILE.width, 1080);
assert.equal(DAR_VIDEO_PROFILE.height, 1920);
assert.equal(DAR_VIDEO_PROFILE.durationSec, 15);
assert.equal(DAR_VIDEO_PROFILE.safety.noForeignWatermarkOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noShotstackStageOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noModernVehicles, true);
assert.equal(DAR_VIDEO_PROFILE.safety.singleCenteredWatermark, true);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkOpacity) >= 0.07);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkOpacity) <= 0.10);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkScale) >= 0.35);
assert.ok(Number(DAR_VIDEO_PROFILE.safeArea.sidePx) >= 80);
assert.equal(DAR_VIDEO_PROFILE.branding.credit, "by Serhat Abu Malik");
assert.ok(PRESERVE_SCENE_PROMPT.includes("Do not introduce any new people"));

assert.equal(resolveThemeAtmosphere("Dhikr").id, "dhikr");
assert.equal(resolveThemeAtmosphere("Sunnah").id, "manhaj");
assert.equal(resolveThemeAtmosphere("Wissen").id, "ilm");
assert.equal(
  isProphetRelatedStatement({ speaker: "Der Prophet ﷺ", de: "…", source: "x", topic: "y" }),
  true
);
assert.equal(
  isProphetRelatedStatement({ speaker: "Ibn Masʿūd", de: "Wissen suchen", source: "x", topic: "Wissen" }),
  false
);

const glyphOk = validateGlyphCoverage("ʿAbdullāh ibn Masʿūd رضي الله عنه sagte:");
assert.equal(glyphOk.ok, true);
assert.equal(validateGlyphCoverage("bad\uFFFD").ok, false);

assert.equal(stripVoiceNoise("Siehe https://x.test #tag 🖋️ Text").includes("http"), false);
assert.equal(stripVoiceNoise("Siehe https://x.test #tag Text").includes("#"), false);

const budget = normalizeBudget({ monthlyEur: 15, maxPerVideoEur: 1.2 });
assert.equal(budget.maxPerVideoEur, 1.2);
assert.equal(assertWithinBudget({ estimateEur: 0.9, spentMonthEur: 0, budget }).ok, true);
assert.equal(assertWithinBudget({ estimateEur: 1.5, spentMonthEur: 0, budget }).ok, false);

const selected = await selectStatement({}, { brief: "" }, {});
assert.equal(selected.ok, true);
assert.ok(selected.statement.source);
assert.ok(selected.statement.de);

const withHonorific = buildSpeakerLine({
  speaker: "ʿAbdullāh ibn Masʿūd رضي الله عنه",
  de: "x",
  source: "y"
});
assert.match(withHonorific, /رضي الله عنه sagte:$/);
assert.equal(withHonorific.includes("رحمه الله"), false);

const speakerLine = buildSpeakerLine(selected.statement);
assert.match(speakerLine, /sagte:$/);

const voice = buildVoiceScript(selected.statement);
assert.ok(voice.includes(selected.statement.de));
assert.ok(voice.includes(selected.statement.speaker.split(/\s/)[0]));
assert.ok(voice.includes(DAR_VIDEO_PROFILE.branding.followLine));

const board = buildStoryboard(selected.statement, { sceneImageUrl: "https://example.com/still.jpg" });
assert.equal(board.scenes.length, 3);
assert.equal(board.motionSeconds, 15);
assert.ok(board.scenes.every((s) => /Preserve the original composition/i.test(s.fullPrompt)));
assert.ok(/car|automobile|vehicle|motorcycle/i.test(board.scenes[0].negativePrompt));

const plan = buildCaptionPlan({ ...selected.statement, topic: "Dhikr" }, { totalSec: 15 });
const roles = plan.overlays.map((o) => o.role);
assert.ok(roles.includes("brand"));
assert.ok(roles.includes("speaker"));
assert.ok(roles.includes("statement"));
assert.ok(roles.includes("source"));
assert.ok(roles.includes("cta"));
assert.equal(plan.overlays.find((o) => o.role === "brand")?.topic, null);
assert.equal(plan.overlays.find((o) => o.role === "brand")?.at, DAR_CAPTION_SLOTS.brand.at);
assert.equal(plan.overlays.find((o) => o.role === "speaker")?.at, DAR_CAPTION_SLOTS.speaker.at);
assert.equal(plan.overlays.find((o) => o.role === "source")?.at, DAR_CAPTION_SLOTS.source.at);
assert.equal(plan.overlays.find((o) => o.role === "source")?.length, 2);
assert.equal(plan.overlays.find((o) => o.role === "cta")?.at, DAR_CAPTION_SLOTS.cta.at);
assert.ok(plan.overlays.filter((o) => o.role === "statement").length >= 2);
assert.ok(plan.overlays.find((o) => o.role === "cta")?.social?.telegram, "@dar_al_tauhid");

const stage = shotstackEnvironment({ SHOTSTACK_HOST: "https://api.shotstack.io/edit/stage" }, { final: false });
assert.equal(stage.isStage, true);
const prod = shotstackEnvironment({ SHOTSTACK_PROD_HOST: "https://api.shotstack.io/edit/v1" }, { final: true });
assert.equal(prod.isProd, true);

const timeline = buildShotstackTimeline({
  clipUrls: ["https://example.com/a.mp4", "https://example.com/b.mp4", "https://example.com/c.mp4"],
  voiceUrl: "https://example.com/voice.mp3",
  captionPlan: plan,
  watermarkUrl: "https://dar-al-tawhid.de/watermark-my-logo-full.png",
  sceneDurationSec: 5
});
assert.equal(timeline.output.size.width, 1080);
assert.equal(timeline.output.size.height, 1920);
assert.equal(timeline.meta.durationSec, 15);
assert.equal(timeline.meta.watermarkCount, 1);
assert.equal(timeline.meta.watermark.position, "center");
assert.ok(timeline.meta.watermark.opacity <= 0.1);
assert.ok(timeline.meta.lastClipCoversEnd);
assert.deepEqual(timeline.meta.previewFrames, [2, 6, 11, 14]);
assert.equal(timeline.timeline.background, "#1a1814");
assert.ok(JSON.stringify(timeline.timeline).includes("DAR AL TAWḤĪD"));
assert.equal(JSON.stringify(timeline.timeline).includes("Dhikr"), false);

const validation = runVideoValidation({
  statement: selected.statement,
  storyboard: board,
  captionPlan: plan,
  render: {
    ok: true,
    audioAttached: true,
    provider: "shotstack",
    shotstackEnv: "v1",
    foreignWatermarkRisk: false,
    brandingApplied: true,
    durationSeconds: 15
  },
  timelineMeta: timeline.meta
});
assert.equal(validation.ok, true, validation.errors.join(" · "));

const qualityFail = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [],
  voice: { ok: false, bytes: 0 },
  render: null,
  captionPlan: plan,
  providerMeta: { simulated: true }
});
assert.equal(qualityFail.ok, false);

const qualityStage = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [
    { r2Key: "a", durationSec: 5 },
    { r2Key: "b", durationSec: 5 },
    { r2Key: "c", durationSec: 5 }
  ],
  voice: { ok: true, bytes: 5000 },
  render: {
    ok: true,
    width: 1080,
    height: 1920,
    fps: 30,
    mime: "video/mp4",
    audioAttached: true,
    hasMusic: false,
    brandingApplied: true,
    shotstackEnv: "stage",
    foreignWatermarkRisk: true,
    durationSeconds: 15
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityStage.ok, false);
assert.equal(qualityStage.checks.noForeignWatermark, false);

const qualityOk = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [
    { r2Key: "a", durationSec: 5 },
    { r2Key: "b", durationSec: 5 },
    { r2Key: "c", durationSec: 5 }
  ],
  voice: { ok: true, bytes: 5000 },
  render: {
    ok: true,
    width: 1080,
    height: 1920,
    fps: 30,
    mime: "video/mp4",
    audioAttached: true,
    hasMusic: false,
    brandingApplied: true,
    shotstackEnv: "v1",
    foreignWatermarkRisk: false,
    provider: "shotstack",
    durationSeconds: 15,
    timelineMeta: timeline.meta
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityOk.ok, true, qualityOk.reasons.join(" · "));
assert.equal(qualityOk.checks.brandingComplete, true);
assert.equal(qualityOk.checks.darLogoCentered, true);
assert.equal(qualityOk.checks.noInventedCategory, true);
assert.equal(qualityOk.checks.durationValid, true);

const qualityFal = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [
    { r2Key: "a", durationSec: 5 },
    { r2Key: "b", durationSec: 5 },
    { r2Key: "c", durationSec: 5 }
  ],
  voice: { ok: true, bytes: 5000 },
  render: {
    ok: true,
    width: 1080,
    height: 1920,
    fps: 30,
    mime: "video/mp4",
    audioAttached: true,
    hasMusic: false,
    brandingApplied: false,
    shotstackEnv: null,
    foreignWatermarkRisk: false,
    provider: "fal-ffmpeg",
    composeFallback: "fal-ffmpeg",
    durationSeconds: 15
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityFal.ok, false, "fal ohne Branding darf QA nicht bestehen");
assert.equal(qualityFal.falComposeFallback, true);

import { parseContributionText } from "../cloudflare/video-studio/text-parse.js";
import { readFileSync } from "node:fs";

const fancy =
  "🖋️ ʿAbdullāh ibn Masʿūd رضي الله عنه 𝒔𝒂𝒈𝒕𝒆: „Ihr seid 𝒎𝒆𝒉𝒓 𝒊𝒎 𝑭𝒂𝒔𝒕𝒆𝒏.“ 📝 𝐐𝐮𝐞𝐥𝐥𝐞: Ibn Abī Šaybah, Athar Nr. 1 🌙 𝐅𝐚𝐳𝐢𝐭: Die Herzen zählten mehr als die Menge.";
const parsedFancy = parseContributionText(fancy);
assert.equal(parsedFancy.ok, true);
assert.match(parsedFancy.statement.speaker, /Masʿūd|Mas.ud/);
assert.match(parsedFancy.statement.de, /Fasten|mehr/i);
assert.match(parsedFancy.statement.source, /Šaybah|Shaybah|Ibn/i);
assert.notEqual(parsedFancy.statement.topic, "Dhikr");

const md = readFileSync(new URL("../content/posts/zuhd-437-sei-von-den-kindern-der-akhirah.md", import.meta.url), "utf8");
const parsedMd = parseContributionText(md);
assert.equal(parsedMd.statement.speaker.includes("Alī") || parsedMd.statement.speaker.includes("Ali"), true);
assert.match(parsedMd.statement.source, /Zuhd|Ḥanbal|Hanbal/i);
assert.ok(parsedMd.statement.de.length > 40);

console.log("video-studio unit checks ok");
