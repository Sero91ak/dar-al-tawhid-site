#!/usr/bin/env node
/**
 * Offline contract test for existing adult-post OneSignal Worker.
 *
 * IMPORTANT: Never reaches OneSignal: fetch is replaced before the worker is called.
 * This exposes actual sender payload choices without any secrets or notifications.
 */
import assert from 'node:assert/strict';
import { sendNewPostPush } from '../cloudflare/post-push-admin.js';

const calls = [];
const savedFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  assert.equal(String(url), 'https://api.onesignal.com/notifications', 'Unexpected network destination');
  assert.equal(init?.method, 'POST', 'Unexpected HTTP method');
  const payload = JSON.parse(init.body);
  assert.equal(payload.target_channel, 'push');
  assert.equal(payload.data?.type, 'post');
  calls.push(payload);
  // Fake OneSignal success to test which audience the sender chooses FIRST.
  return new Response(JSON.stringify({
    id: '00000000-0000-4000-8000-000000000001',
    recipients: 1
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

try {
  const fakeEnv = {
    ONESIGNAL_APP_ID: '786d7cd6-0455-4434-ab14-0c10a7bc6b1e',
    ONESIGNAL_API_KEY_NEW: 'OFFLINE_FAKE_KEY_NOT_A_REAL_SECRET',
    SITE_URL: 'https://dar-al-tawhid.de'
  };
  const options = {
    postId: 'offline-only-contract-not-a-real-post',
    postTitle: 'NICHT VERÖFFENTLICHEN – Offline-QA',
    filename: 'offline-only-contract-not-a-real-post.md',
    publishedAt: '2026-10-12T18:00:00+02:00'
  };
  const a = await sendNewPostPush(fakeEnv, options);
  const b = await sendNewPostPush(fakeEnv, options);
  assert(a.sent && b.sent, 'Fake OneSignal response should be recognized');
  assert.equal(calls.length, 2, 'Expected one mock request per independent send');
  assert(calls.every(call => call.idempotency_key), 'Worker missing idempotency key');
  const sameIdempotency = calls[0].idempotency_key === calls[1].idempotency_key;
  assert(sameIdempotency, 'Identical Worker payload lost deterministic idempotency');
  const firstTarget = calls[0].included_segments?.[0] || '<no segment>';
  const isBroad = calls.some(call => (call.included_segments || []).includes('Subscribed Users')
    || (call.included_segments || []).includes('Total Subscriptions'));
  const result = {
    kind: 'offline-mocked-OneSignal-contract',
    requestsToRealOneSignal: 0,
    mockedCalls: calls.length,
    firstTarget,
    broadSegmentRequested: isBroad,
    stableWorkerIdempotency: sameIdempotency,
    productionSafe: !isBroad && firstTarget === 'DAR_PUSH',
    warning: isBroad
      ? 'BLOCKED: Worker tries a broad segment before scoped adult recipients.'
      : 'Code-side target review passed; actual OneSignal segment filters and opt-ins remain unverified.'
  };
  console.log('DAR_POST_ONESIGNAL_CONTRACT ' + JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import('node:fs');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '\n### Offline OneSignal Worker contract\n'
      + '- No notifications sent; network mocked entirely.\n'
      + '- Actual first target: `' + firstTarget + '`\n'
      + '- Broad audience first: **' + (isBroad ? 'YES (BLOCKED)' : 'no') + '**\n'
      + '- Stable Worker idempotency: **' + sameIdempotency + '**\n');
  }
  if (process.argv.includes('--require-safe-target') && !result.productionSafe) process.exitCode = 2;
} catch (error) {
  console.error('DAR_POST_ONESIGNAL_CONTRACT ERROR', error);
  process.exitCode = 1;
} finally {
  globalThis.fetch = savedFetch;
}
