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

assert.equal(DAR_VIDEO_PROFILE.id, "dar-standard-v3");
assert.equal(DAR_VIDEO_PROFILE.width, 1080);
assert.equal(DAR_VIDEO_PROFILE.height, 1920);
assert.equal(DAR_VIDEO_PROFILE.safety.noForeignWatermarkOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noShotstackStageOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noModernVehicles, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noAutoFeedPublish, true);
assert.equal(DAR_VIDEO_PROFILE.safety.uploadFirstSceneImage, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noProphetSilhouette, true);
assert.equal(DAR_VIDEO_PROFILE.branding.credit, "by Serhat Abu Malik");
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkScale) >= 0.35);
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

const budget = normalizeBudget({ monthlyEur: 15, maxPerVideoEur: 1.2 });
assert.equal(budget.maxPerVideoEur, 1.2);
assert.equal(assertWithinBudget({ estimateEur: 0.9, spentMonthEur: 0, budget }).ok, true);
assert.equal(assertWithinBudget({ estimateEur: 1.5, spentMonthEur: 0, budget }).ok, false);
assert.equal(assertWithinBudget({ estimateEur: 1.0, spentMonthEur: 14.5, budget }).ok, false);

const selected = await selectStatement({}, { brief: "" }, {});
assert.equal(selected.ok, true);
assert.ok(selected.statement.source);
assert.ok(selected.statement.de);

const speakerLine = buildSpeakerLine(selected.statement);
assert.match(speakerLine, /رحمه الله sagte:$/);

const voice = buildVoiceScript(selected.statement);
assert.ok(voice.includes(selected.statement.de));
assert.ok(voice.includes(selected.statement.speaker));
assert.ok(voice.includes(DAR_VIDEO_PROFILE.branding.followLine));
assert.equal(voice.includes("Umformulierung"), false);

const board = buildStoryboard(selected.statement);
assert.equal(board.scenes.length, 3);
assert.equal(board.motionSeconds, 15);
assert.ok(board.scenes.every((s) => /silhouette|hidden|back|shadow|anonymous/i.test(s.fullPrompt)));
assert.ok(board.voiceScript.includes(DAR_VIDEO_PROFILE.branding.followLine));
assert.ok(board.captionPlan?.overlays?.length >= 5);

const plan = buildCaptionPlan({ ...selected.statement, topic: "Dhikr" }, { totalSec: 20 });
const roles = plan.overlays.map((o) => o.role);
assert.ok(roles.includes("brand"));
assert.ok(roles.includes("speaker"));
assert.ok(roles.includes("statement"));
assert.ok(roles.includes("source"));
assert.ok(roles.includes("cta"));
assert.equal(plan.overlays.find((o) => o.role === "brand")?.topic, null, "Topic/Dhikr darf nicht im Brand-Overlay stehen");
assert.equal(JSON.stringify(plan).includes("Dhikr"), false, "Dhikr nicht in Caption-Overlays");
assert.ok(plan.overlays.filter((o) => o.role === "statement").length >= 2);
assert.ok(plan.overlays.find((o) => o.role === "source")?.text?.startsWith("Quelle:"));
assert.ok(plan.overlays.find((o) => o.role === "cta")?.social?.telegram, "@dar_al_tauhid");
assert.equal(plan.overlays.find((o) => o.role === "cta")?.credit, "by Serhat Abu Malik");
assert.ok(board.themePreset);
assert.ok(/car|automobile|vehicle|motorcycle/i.test(board.scenes[0].negativePrompt));

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
assert.ok(timeline.timeline.tracks.length >= 2);
assert.equal(timeline.timeline.background, "#1a1814");
const markClip = timeline.timeline.tracks.flatMap((t) => t.clips).find((c) => c.asset?.type === "image");
assert.ok(markClip, "DAR-Wasserzeichen-Clip fehlt");
assert.equal(markClip.position, "center");
assert.ok(Number(markClip.scale) >= 0.35, "Wasserzeichen muss groß mittig sein");
assert.ok(JSON.stringify(timeline).includes("DAR AL TAWḤĪD"));
assert.ok(JSON.stringify(timeline).includes("@dar_al_tauhid"));
assert.ok(JSON.stringify(timeline).includes("Cormorant Garamond") || JSON.stringify(timeline).includes("Amiri"));
assert.equal(JSON.stringify(timeline).includes("Dhikr"), false);
const lastVideo = timeline.timeline.tracks.find((t) => t.clips?.some((c) => c.asset?.type === "video"))?.clips?.at(-1);
const cta = plan.overlays.find((o) => o.role === "cta");
assert.ok(lastVideo && cta);
assert.ok(lastVideo.start + lastVideo.length >= cta.at + cta.length - 0.05, "Letzter Clip muss CTA abdecken (kein schwarzes Ende)");

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
assert.equal(qualityFail.checks.noForeignWatermark, false);

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
    foreignWatermarkRisk: true
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
    provider: "shotstack"
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityOk.ok, true, qualityOk.reasons.join(" · "));
assert.equal(qualityOk.checks.brandingComplete, true);
assert.equal(qualityOk.checks.textHierarchyOk, true);
assert.equal(qualityOk.checks.voiceExact, true);

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
    composeFallback: "fal-ffmpeg"
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityFal.ok, false, "fal ohne Branding darf QA nicht bestehen");
assert.equal(qualityFal.falComposeFallback, true);
assert.equal(qualityFal.checks.noForeignWatermark, true);
assert.equal(qualityFal.checks.brandingComplete, false);
assert.equal(qualityFal.checks.captionsSafe, false);

import { parseContributionText } from "../cloudflare/video-studio/text-parse.js";
import { readFileSync } from "node:fs";

const fancy =
  "🖋️ ʿAbdullāh ibn Masʿūd رضي الله عنه 𝒔𝒂𝒈𝒕𝒆: „Ihr seid 𝒎𝒆𝒉𝒓 𝒊𝒎 𝑭𝒂𝒔𝒕𝒆𝒏.“ 📝 𝐐𝐮𝐞𝐥𝐥𝐞: Ibn Abī Šaybah, Athar Nr. 1 🌙 𝐅𝐚𝐳𝐢𝐭: Die Herzen zählten mehr als die Menge.";
const parsedFancy = parseContributionText(fancy);
assert.equal(parsedFancy.ok, true);
assert.match(parsedFancy.statement.speaker, /Masʿūd|Mas.ud/);
assert.match(parsedFancy.statement.de, /Fasten|mehr/i);
assert.match(parsedFancy.statement.source, /Šaybah|Shaybah|Ibn/i);
assert.match(parsedFancy.statement.fazit, /Herzen|Menge/i);
assert.equal(parsedFancy.statement.verified, true);

const md = readFileSync(new URL("../content/posts/zuhd-437-sei-von-den-kindern-der-akhirah.md", import.meta.url), "utf8");
const parsedMd = parseContributionText(md);
assert.equal(parsedMd.statement.speaker.includes("Alī") || parsedMd.statement.speaker.includes("Ali"), true);
assert.match(parsedMd.statement.source, /Zuhd|Ḥanbal|Hanbal/i);
assert.ok(parsedMd.statement.de.length > 40);
assert.ok(parsedMd.statement.fazit.length > 20);

console.log("video-studio unit checks ok");
