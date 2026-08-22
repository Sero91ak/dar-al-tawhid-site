#!/usr/bin/env node
/** Lightweight unit checks for DAR Sprach-Bildbeitrag core (no network, no secrets). */
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
import { DAR_VIDEO_PROFILE, PIPELINE_STAGES } from "../cloudflare/video-studio/profile.js";
import { buildShotstackTimeline, shotstackEnvironment, isComposerConfigured } from "../cloudflare/video-studio/compose.js";
import { resolveThemeAtmosphere } from "../cloudflare/video-studio/theme-presets.js";
import { isProphetRelatedStatement } from "../cloudflare/video-studio/depiction-rules.js";
import {
  PRESERVE_SCENE_PROMPT,
  estimateVoiceDurationSec,
  computeSpeechImageDurationSec
} from "../cloudflare/video-studio/timeline.js";
import { validateGlyphCoverage } from "../cloudflare/video-studio/glyphs.js";
import { runVideoValidation } from "../cloudflare/video-studio/validation.js";
import { stripVoiceNoise, prepareVoiceScript } from "../cloudflare/video-studio/voice-prep.js";
import { estimateVideoCost, parseContributionText } from "../cloudflare/video-studio/text-parse.js";
import { readFileSync } from "node:fs";

assert.equal(DAR_VIDEO_PROFILE.id, "dar-speech-image-v1");
assert.equal(DAR_VIDEO_PROFILE.productName, "Sprach-Bildbeitrag");
assert.equal(DAR_VIDEO_PROFILE.width, 1080);
assert.equal(DAR_VIDEO_PROFILE.height, 1920);
assert.equal(DAR_VIDEO_PROFILE.safety.noForeignWatermarkOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noShotstackStageOnFinal, true);
assert.equal(DAR_VIDEO_PROFILE.safety.noGenerativeVideo, true);
assert.equal(DAR_VIDEO_PROFILE.safety.stillImageOnly, true);
assert.equal(DAR_VIDEO_PROFILE.safety.singleCenteredWatermark, true);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkOpacity) >= 0.05);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkOpacity) <= 0.08);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkScale) >= 0.3);
assert.ok(Number(DAR_VIDEO_PROFILE.branding.watermarkScale) <= 0.38);
assert.ok(Number(DAR_VIDEO_PROFILE.safeArea.sidePx) >= 80);
assert.equal(DAR_VIDEO_PROFILE.branding.credit, "by Serhat Abu Malik");
assert.ok(PRESERVE_SCENE_PROMPT.includes("Do not introduce any new people"));
assert.deepEqual([...PIPELINE_STAGES], ["statement", "image", "voice", "layout", "render", "review"]);

assert.equal(isComposerConfigured({}), false);
assert.equal(isComposerConfigured({ SHOTSTACK_API_KEY: "x" }), true);
assert.equal(isComposerConfigured({ FAL_KEY: "x" }), false);

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
const prepared = prepareVoiceScript({
  speakerLine: "Ibn Masʿūd sagte:",
  quote: "Wissen suchen.",
  source: "Sahih",
  followLine: DAR_VIDEO_PROFILE.branding.followLine
});
assert.equal(prepared.includes("Quelle:"), false);
assert.equal(prepared.includes("Folgt"), false);

const budget = normalizeBudget({ monthlyEur: 15, maxPerVideoEur: 1.2 });
assert.equal(budget.maxPerVideoEur, 1.2);
assert.equal(assertWithinBudget({ estimateEur: 0.9, spentMonthEur: 0, budget }).ok, true);
assert.equal(assertWithinBudget({ estimateEur: 1.5, spentMonthEur: 0, budget }).ok, false);

const cost = estimateVideoCost({ voiceChars: 400, durationSec: 18 });
assert.equal(cost.clipCount, 0);
assert.match(cost.mode, /Sprach-Bildbeitrag/);
assert.ok(cost.breakdown.voiceEur > 0);
assert.equal(cost.breakdown.videoEur, 0);

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
assert.equal(voice.includes(DAR_VIDEO_PROFILE.branding.followLine), false);
assert.equal(/Quelle:/i.test(voice), false);

const voiceDur = estimateVoiceDurationSec(voice);
assert.ok(voiceDur >= 4);
const totalDur = computeSpeechImageDurationSec(voiceDur);
assert.ok(totalDur > voiceDur);

const board = buildStoryboard(selected.statement, {
  sceneImageUrl: "https://example.com/still.jpg",
  voiceDurationSec: voiceDur
});
assert.equal(board.mode, "speech-image");
assert.equal(board.scenes.length, 0);
assert.equal(board.motionSeconds, 0);
assert.ok(board.durationSec >= 10);
assert.equal(board.fromStill, true);
assert.equal(board.kenBurns, "zoomIn");

const plan = buildCaptionPlan({ ...selected.statement, topic: "Dhikr" }, { voiceDurationSec: voiceDur });
const roles = plan.overlays.map((o) => o.role);
assert.ok(roles.includes("brand"));
assert.ok(roles.includes("speaker"));
assert.ok(roles.includes("statement"));
assert.ok(roles.includes("source"));
assert.ok(roles.includes("cta"));
assert.ok(plan.overlays.find((o) => o.role === "brand")?.length >= plan.durationSec - 0.5);
assert.ok(plan.overlays.find((o) => o.role === "cta")?.length >= plan.durationSec - 0.5);
assert.equal(plan.overlays.find((o) => o.role === "brand")?.at, 0);
assert.equal(plan.overlays.find((o) => o.role === "cta")?.at, 0);
assert.equal(plan.noEndCard, true);
assert.equal(plan.layout, "full-brand-frame");
assert.ok(plan.overlays.find((o) => o.role === "source")?.length >= 2);
assert.ok(plan.overlays.filter((o) => o.role === "statement").length >= 2);
assert.ok(plan.overlays.find((o) => o.role === "cta")?.social?.telegram, "@dar_al_tauhid");

const stage = shotstackEnvironment({ SHOTSTACK_HOST: "https://api.shotstack.io/edit/stage" }, { final: false });
assert.equal(stage.isStage, true);
const prod = shotstackEnvironment({ SHOTSTACK_PROD_HOST: "https://api.shotstack.io/edit/v1" }, { final: true });
assert.equal(prod.isProd, true);

const timeline = buildShotstackTimeline({
  sceneImageUrl: "https://example.com/still.jpg",
  voiceUrl: "https://example.com/voice.mp3",
  captionPlan: plan,
  watermarkUrl: "https://dar-al-tawhid.de/watermark-my-logo-full.png",
  durationSec: plan.durationSec,
  kenBurns: "zoomIn"
});
assert.equal(timeline.output.size.width, 1080);
assert.equal(timeline.output.size.height, 1920);
assert.equal(timeline.meta.mode, "speech-image");
assert.equal(timeline.meta.noEndCard, true);
assert.equal(timeline.meta.brandPersistent, true);
assert.equal(timeline.meta.ctaPersistent, true);
assert.ok(timeline.meta.durationSec >= 10);
assert.equal(timeline.meta.watermarkCount, 1);
assert.equal(timeline.meta.watermark.position, "center");
assert.ok(timeline.meta.watermark.opacity >= 0.05 && timeline.meta.watermark.opacity <= 0.08);
assert.ok(timeline.meta.lastClipCoversEnd);
assert.equal(timeline.timeline.background, "#1a1814");
assert.ok(JSON.stringify(timeline.timeline).includes("DAR AL TAWḤĪD"));
assert.equal(JSON.stringify(timeline.timeline).includes("Dhikr"), false);
assert.ok(JSON.stringify(timeline.timeline).includes('"type":"image"'));
assert.equal(JSON.stringify(timeline.timeline).includes('"type":"video"'), false);

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
    durationSeconds: plan.durationSec
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
  sceneImageUrl: "https://example.com/still.jpg",
  providerMeta: { simulated: true }
});
assert.equal(qualityFail.ok, false);

const qualityStage = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [],
  sceneImageUrl: "https://example.com/still.jpg",
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
    provider: "shotstack",
    durationSeconds: plan.durationSec
  },
  captionPlan: plan,
  providerMeta: { simulated: false }
});
assert.equal(qualityStage.ok, false);
assert.equal(qualityStage.checks.noForeignWatermark, false);

const qualityOk = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [],
  sceneImageUrl: "https://example.com/still.jpg",
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
    durationSeconds: plan.durationSec,
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
assert.equal(qualityOk.falComposeFallback, false);

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

import { createProjectFromJob, scaleProjectDuration, projectToCaptionPlan } from "../cloudflare/video-studio/project.js";
import { buildTimelineFromProject } from "../cloudflare/video-studio/project-compose.js";

const proj = createProjectFromJob({
  jobId: "job_test",
  statement: selected.statement,
  captionPlan: plan,
  sceneImageUrl: "https://example.com/still.jpg",
  voiceUrl: "https://example.com/voice.mp3",
  clipUrls: [],
  durationSec: plan.durationSec
});
assert.equal(proj.width, 1080);
assert.equal(proj.height, 1920);
assert.ok(proj.elements.some((e) => e.role === "watermark"));
assert.ok(proj.elements.some((e) => e.role === "speaker"));
assert.ok(proj.elements.some((e) => e.role === "social"));
assert.equal(proj.elements.filter((e) => e.role === "watermark").length, 1);
const scaled = scaleProjectDuration(proj, 30, { proportional: true });
assert.equal(scaled.duration, 30);
assert.ok(scaled.elements.find((e) => e.role === "social")?.timing.end > 20);
const plan2 = projectToCaptionPlan(proj);
assert.ok(plan2.overlays.length >= 4);
const tl = buildTimelineFromProject({}, {
  ...proj,
  background: {
    ...proj.background,
    assetUrl: "https://example.com/still.jpg",
    clipUrls: []
  }
});
assert.equal(tl.meta.fromEditor, true);
assert.equal(tl.meta.mode, "speech-image");
assert.equal(tl.meta.watermarkCount, 1);
assert.ok(tl.meta.watermark.opacity <= 0.12);

import {
  recommendedReadingSeconds,
  contrastRatio,
  checkTextContrast,
  redistributeTimings,
  interpolateKeyframes,
  addKeyframe,
  applyHighlightToSelection,
  snapshotVersion,
  HIGHLIGHT_PRESETS,
  ANIMATION_PRESETS
} from "../cloudflare/video-studio/editor-lib.js";

assert.ok(recommendedReadingSeconds("Kurzer Text.", { role: "source" }) >= 2);
assert.ok(recommendedReadingSeconds("Ein etwas längerer Satz mit mehreren Wörtern für die Lesedauer.", { role: "quote" }) >= 2.4);
assert.ok(contrastRatio("#fff8e8", "#12141a") >= 4.5);
assert.equal(checkTextContrast({ color: "#fff8e8", background: { mode: "none" } }).ok, true);
assert.ok(HIGHLIGHT_PRESETS["dar-gold"]);
assert.ok(ANIMATION_PRESETS.fade);

const redistributed = redistributeTimings(proj.elements, plan.durationSec, voice);
assert.ok(Array.isArray(redistributed));
assert.ok(redistributed.every((e) => e.timing.end > e.timing.start));

const withKf = addKeyframe({ transform: { x: 0, y: 0 }, opacity: 1 }, 0, { x: 10, y: 20, opacity: 1 });
const withKf2 = addKeyframe(withKf, 2, { x: 30, y: 40, opacity: 0.5 });
const mid = interpolateKeyframes(withKf2.keyframes, 1);
assert.ok(mid.x > 10 && mid.x < 30);

const hi = applyHighlightToSelection("Dies ist ein Testsatz.", { start: 9, end: 12 }, "dar-gold");
assert.equal(hi.segments.length, 1);
assert.equal(hi.segments[0].text, "ein");
assert.equal(hi.segments[0].color, "#efd78e");

const snap = snapshotVersion(proj, "unit");
assert.equal(snap.label, "unit");
assert.ok(snap.project.duration === plan.durationSec || snap.project.duration === proj.duration);

console.log("video-studio unit checks ok");
