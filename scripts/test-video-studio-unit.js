#!/usr/bin/env node
/** Lightweight unit checks for DAR video studio core (no network, no secrets). */
import assert from "node:assert/strict";
import { normalizeBudget, assertWithinBudget } from "../cloudflare/video-studio/budget.js";
import { buildStoryboard } from "../cloudflare/video-studio/storyboard.js";
import { runQualityChecks } from "../cloudflare/video-studio/quality.js";
import { selectStatement } from "../cloudflare/video-studio/statements.js";
import { DAR_VIDEO_PROFILE } from "../cloudflare/video-studio/profile.js";

const budget = normalizeBudget({ monthlyEur: 15, maxPerVideoEur: 1.2 });
assert.equal(budget.maxPerVideoEur, 1.2);
assert.equal(assertWithinBudget({ estimateEur: 0.9, spentMonthEur: 0, budget }).ok, true);
assert.equal(assertWithinBudget({ estimateEur: 1.5, spentMonthEur: 0, budget }).ok, false);
assert.equal(assertWithinBudget({ estimateEur: 1.0, spentMonthEur: 14.5, budget }).ok, false);

const selected = await selectStatement({}, { brief: "" }, {});
assert.equal(selected.ok, true);
assert.ok(selected.statement.source);
assert.ok(selected.statement.de);

const board = buildStoryboard(selected.statement);
assert.equal(board.scenes.length, 4);
assert.ok(board.scenes.every((s) => /silhouette|hidden|back|shadow|anonymous/i.test(s.fullPrompt)));
assert.ok(board.voiceScript.includes(DAR_VIDEO_PROFILE.branding.followLine));

const qualityFail = runQualityChecks({
  statement: selected.statement,
  storyboard: board,
  clips: [],
  voice: { ok: false, bytes: 0 },
  render: null,
  providerMeta: { simulated: true }
});
assert.equal(qualityFail.ok, false);

console.log("video-studio unit checks ok");
