#!/usr/bin/env node
/* Regression: published daily IDs must be the same IDs used by rotation and
   displayed by the adult daily resolver. Does not send notifications. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const { adoptCanonicalSelection, pickWithoutRepeat } = require('./rotate-daily-content');

const daily = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/updates/daily.json'), 'utf8'));
const rotation = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/admin/daily-content-rotation.json'), 'utf8'));
assert.equal(daily.timezone, 'Europe/Berlin');
assert.ok(daily.dua?.id && daily.recommendation?.id && daily.recommendation?.file);

if (rotation.date === daily.date && daily.source === 'dar-daily-no-repeat-rotation') {
  for (const [lane, key] of [['dua', daily.dua.id], ['recommendation', daily.recommendation.file]]) {
    const state = rotation[lane];
    // Older production history may lag behind daily.json. The code, not a
    // committed one-day JSON snapshot, must reconcile it safely upon rotation.
    const reconciled = adoptCanonicalSelection(
      state, key, [...(state.usedKeys || []), key]
    );
    assert.equal(reconciled.lastKey, key, lane + ' must adopt the published item');
    assert.equal(new Set(reconciled.usedKeys).size, reconciled.usedKeys.length, lane + ' repeats history entries');
    assert.ok(reconciled.usedKeys.includes(key), lane + ' does not record published item');
    assert.equal(reconciled.remaining, Math.max(0, state.poolSize - reconciled.usedKeys.length));
  }
}

// A stale lastKey must not win over a newer published value, even on reruns.
const old = { cycle: 0, lastKey: 'old', usedKeys: ['old'], poolSize: 4, remaining: 3 };
const first = adoptCanonicalSelection(old, 'today', ['old', 'today', 'third', 'fourth']);
assert.equal(first.lastKey, 'today');
assert.deepEqual(first.usedKeys, ['old', 'today']);
assert.equal(first.remaining, 2);
const second = adoptCanonicalSelection(first, 'today', ['old', 'today', 'third', 'fourth']);
assert.deepEqual(second, first, 'repeated same-day reconciliation must be idempotent');
assert.throws(() => adoptCanonicalSelection(first, 'unknown', ['old', 'today']), /kanonischen Pool/);

// When the state remembers a stale item, yesterday's published ID wins
// and must not be selected again at midnight.
const repairedTomorrow = pickWithoutRepeat(
  ['old', 'today', 'future'], x => x,
  { cycle: 0, lastKey: 'old', usedKeys: ['old'] }, 'today', '2026-11-24'
);
assert.equal(repairedTomorrow.item, 'future');
assert.equal(repairedTomorrow.state.lastKey, 'future');
assert.ok(repairedTomorrow.state.usedKeys.includes('today'));

// No item is repeated until all available ones have been used.
const pool = ['a', 'b', 'c', 'd'];
let state = { cycle: 0, lastKey: '', usedKeys: [] };
const firstCycle = [];
for (let i = 0; i < pool.length; i++) {
  const selection = pickWithoutRepeat(pool, x => x, state, '', '2026-11-' + String(i + 1).padStart(2, '0'));
  assert.ok(selection.item);
  firstCycle.push(selection.item);
  state = selection.state;
}
assert.equal(new Set(firstCycle).size, pool.length);
assert.equal(state.remaining, 0);
const next = pickWithoutRepeat(pool, x => x, state, '', 'next-cycle');
assert.ok(next.item !== firstCycle[firstCycle.length - 1], 'new cycle repeats yesterday');
assert.equal(next.state.cycle, 1);

const resolver = fs.readFileSync(path.join(ROOT, 'assets/dar-canonical-daily-v1.js'), 'utf8');
new vm.Script(resolver, { filename: 'dar-canonical-daily-v1.js' });
assert.ok(resolver.includes('text(item.snippet)') && resolver.includes('text(item.category)') && resolver.includes('text(item.scholar)'), 'global recommendation must not display stale metadata');
assert.ok(resolver.includes('function onForeground()'), 'foreground refresh must avoid forced repeat fetches');
const homeSource = fs.readFileSync(path.join(ROOT, 'scripts/home-premium-v380-fragment.js'), 'utf8');
new vm.Script(homeSource, { filename: 'home-premium-v380-fragment.js' });
const rowBlock = homeSource.split('function renderHomeRecommendedRow(')[1]?.split('function renderHomeRamadanRow(')[0] || '';
assert.ok(rowBlock.includes('DARCanonicalDailyV1'), 'global Home row must use the canonical resolver');
assert.ok(!rowBlock.includes('recommendedPost('), 'global Home row must not use per-profile ranking');

console.log('Daily rotation and global recommendation regression checks passed.');
