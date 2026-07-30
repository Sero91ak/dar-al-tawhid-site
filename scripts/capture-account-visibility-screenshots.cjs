const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/opt/cursor/artifacts/screenshots';
const BASE = process.env.SCREENSHOT_BASE || 'http://127.0.0.1:8765';

async function shotPage(page, file) {
  const target = path.join(OUT, file);
  await page.screenshot({ path: target, fullPage: false });
  console.log('saved', target);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/test/#home`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('darUserAccountSessionV1');
    localStorage.removeItem('darAccountIntroDismissedV1');
    localStorage.setItem('darThemeV1', 'dar-al-layl');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shotPage(page, 'account-home-logged-out.png');

  await page.goto(`${BASE}/test/#more`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-more-logged-out.png');

  await page.goto(`${BASE}/test/#account/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-login.png');

  await page.goto(`${BASE}/test/#account/register`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-register.png');

  await page.evaluate(() => {
    localStorage.setItem('darUserAccountSessionV1', JSON.stringify({ id: 'demo-user', username: 'demo' }));
    localStorage.setItem('darAccountLastSyncV1', new Date().toISOString());
    localStorage.setItem('darAccountSyncStateV1', 'synced');
  });
  await page.goto(`${BASE}/test/#account`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-synced.png');

  await page.evaluate(() => {
    localStorage.setItem('darAccountSyncStateV1', 'pending');
    localStorage.setItem('darOfflineQueueCountV1', '2');
  });
  await page.goto(`${BASE}/test/#more`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-pending.png');

  await page.evaluate(() => {
    localStorage.setItem('darAccountSyncStateV1', 'error');
    localStorage.removeItem('darOfflineQueueCountV1');
  });
  await page.goto(`${BASE}/test/#more`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shotPage(page, 'account-sync-error.png');

  const offlinePage = await context.newPage();
  await offlinePage.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('supabase') || url.includes('/rest/v1/')) {
      route.abort();
      return;
    }
    route.continue();
  });
  await offlinePage.goto(`${BASE}/test/#home`, { waitUntil: 'domcontentloaded' });
  await offlinePage.evaluate(() => {
    localStorage.setItem('darUserAccountSessionV1', JSON.stringify({ id: 'demo-user', username: 'demo' }));
    localStorage.setItem('darAccountSyncStateV1', 'pending');
    localStorage.setItem('darOfflineQueueCountV1', '1');
  });
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await offlinePage.screenshot({ path: path.join(OUT, 'account-offline.png'), fullPage: false });
  console.log('saved', path.join(OUT, 'account-offline.png'));

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
