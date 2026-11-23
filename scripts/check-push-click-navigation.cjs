#!/usr/bin/env node
/* Push-click smoke checks for production root worker, dedicated PWA and the
   shared adult SPA. No OneSignal request is made and no live push is sent. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://dar-al-tawhid.de';
const files = {
  root: path.join(ROOT, 'service-worker.js'),
  pwa: path.join(ROOT, 'pwa/service-worker.js'),
  daily: path.join(ROOT, 'assets/dar-canonical-daily-v1.js'),
  androidShell: path.join(ROOT, 'android/app/src/main/java/de/daraltawhid/app/DarShell.kt'),
  androidActivity: path.join(ROOT, 'android/app/src/main/java/de/daraltawhid/app/MainActivity.kt')
};

class ReplyChannel {
  constructor() {
    this.port1 = { onmessage: null, close() {} };
    this.port2 = { postMessage: data => queueMicrotask(() =>
      this.port1.onmessage?.({ data })) };
  }
}

async function clickWorker(file, notificationData, { acknowledged = true } = {}) {
  const handlers = {};
  const observed = { messages: [], loads: [], windows: [], focused: 0 };
  const client = {
    url: ORIGIN + '/pwa/?pwa=1#home',
    async focus() { observed.focused += 1; },
    postMessage(data, ports) {
      observed.messages.push(data);
      if (acknowledged && ports?.[0]) ports[0].postMessage({ handled: true });
    },
    async navigate(url) { observed.loads.push(url); }
  };
  const self = {
    location: new URL(file.includes('/pwa/') ? '/pwa/service-worker.js' : '/service-worker.js', ORIGIN),
    addEventListener(type, fn) { handlers[type] = fn; },
    clients: {
      async matchAll() { return [client]; },
      async openWindow(url) { observed.windows.push(url); }
    },
    skipWaiting() {},
    registration: {}
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    self, caches: {}, fetch: async () => {},
    MessageChannel: ReplyChannel, URL,
    setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 20)),
    clearTimeout,
    console
  }, { filename: file, timeout: 2000 });
  assert.equal(typeof handlers.notificationclick, 'function');
  let completion;
  handlers.notificationclick({
    notification: { data: notificationData, close() {} },
    waitUntil(promise) { completion = promise; }
  });
  await completion;
  return observed;
}

async function run() {
  for (const worker of [files.root, files.pwa]) {
    for (const [type, kind, id] of [
      ['daily_dua', 'dua', 'dua-037-rabbana-ghfir-lana-dhunubana'],
      ['daily_recommendation', 'post', 'recommended-123'],
      ['post', 'post', 'new-post-456']
    ]) {
      const data = { type, content_id: id, url: ORIGIN + '/#' + kind + '/' + id };
      const warm = await clickWorker(worker, data);
      assert.equal(warm.messages.length, 1, 'exactly one SPA message');
      assert.equal(warm.messages[0].kind, kind, 'wrong content type');
      assert.equal(warm.messages[0].id, id, 'lost content ID');
      assert.equal(warm.loads.length, 0, 'warm app must not reload');
      assert.equal(warm.windows.length, 0, 'warm app must not open a new window');
      const old = await clickWorker(worker, data, { acknowledged: false });
      assert.equal(old.loads.length, 1, 'old client must receive cold navigation fallback');
      assert.match(old.loads[0], new RegExp('#' + kind + '/' + id + '$'));
    }
    const legacy = await clickWorker(worker, { postId: 'legacy-post' });
    assert.equal(legacy.messages[0]?.kind, 'post', 'postId-only notification lost');
    assert.equal(legacy.messages[0]?.id, 'legacy-post');
    const untrusted = await clickWorker(worker, { url: 'https://evil.invalid/#post/fake' });
    assert.equal(untrusted.messages.length, 0, 'untrusted URL was treated as content');
    assert.ok(untrusted.loads.every(x => !x.includes('evil.invalid')));
  }

  const dailySource = fs.readFileSync(files.daily, 'utf8');
  new vm.Script(dailySource, { filename: files.daily });
  const start = dailySource.indexOf('function onServiceWorkerOpen(');
  const end = dailySource.indexOf('function onDayChange()', start);
  assert.ok(start >= 0 && end > start, 'adult SPA push-click listener missing');
  const calls = [];
  const location = { origin: ORIGIN, href: ORIGIN + '/#home', hash: '#home' };
  const fakeWindow = { location, navigate: (...args) => calls.push(args) };
  const handler = vm.runInNewContext(dailySource.slice(start, end) + ';onServiceWorkerOpen;', {
    w: fakeWindow, text: value => String(value ?? '').trim(), URL
  });
  const acknowledgements = [];
  handler({
    data: { type: 'DAR_OPEN_CONTENT', kind: 'dua', id: 'dua-037', url: ORIGIN + '/pwa/?pwa=1#dua/dua-037' },
    ports: [{ postMessage: data => acknowledgements.push(data) }]
  });
  assert.deepEqual(calls[0], ['dua', 'dua-037'], 'SPA must open exact Duʿāʾ ID');
  assert.equal(acknowledgements[0].handled, true);
  handler({
    data: { type: 'DAR_OPEN_CONTENT', kind: 'post', id: 'fake', url: 'https://evil.invalid/#post/fake' },
    ports: [{ postMessage: data => acknowledgements.push(data) }]
  });
  assert.equal(acknowledgements.at(-1).handled, false);

  const androidShell = fs.readFileSync(files.androidShell, 'utf8');
  const androidActivity = fs.readFileSync(files.androidActivity, 'utf8');
  assert.ok(androidShell.includes('getQueryParameter("src")'), 'Android app_url src not decoded');
  assert.ok(androidShell.includes('isOwnHost(target)'), 'Android untrusted redirects are possible');
  assert.ok(androidActivity.includes('openIncomingRoute(url)'), 'Android warm routing absent');
  assert.ok(androidActivity.includes('window.navigate(view,value)'), 'Android SPA navigation absent');
  assert.ok(!androidActivity.includes('pendingUrl = url\n        webView.loadUrl(url)'), 'Android unconditional reload returned');
  console.log('Push-click navigation smoke checks passed for both service workers and Android source.');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
