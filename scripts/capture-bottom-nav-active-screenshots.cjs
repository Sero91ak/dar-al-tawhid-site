const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/opt/cursor/artifacts/screenshots';
const BASE = process.env.SCREENSHOT_BASE || 'http://127.0.0.1:8765';

const themes = [
  { id: 'dar-al-layl', file: 'bottom-nav-dar-al-layl.png', activeTab: 'quran' },
  { id: 'bordeaux', file: 'bottom-nav-bordeaux.png', activeTab: 'quran' },
  { id: 'royal', file: 'bottom-nav-royal.png', activeTab: 'quran' },
  { id: 'soft', file: 'bottom-nav-soft.png', activeTab: 'quran' },
  { id: 'light', file: 'bottom-nav-light.png', activeTab: 'quran' },
  { id: 'dark', file: 'bottom-nav-dark.png', activeTab: 'quran' },
];

async function shotLocator(locator, file) {
  const target = path.join(OUT, file);
  await locator.screenshot({ path: target });
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

  for (const { id, file, activeTab } of themes) {
    await page.goto(`${BASE}/test/#${activeTab}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((theme) => {
      localStorage.setItem('darThemeV1', theme);
    }, id);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const nav = page.locator('#bottomNav');
    await nav.waitFor({ state: 'visible' });
    await shotLocator(nav, file);
  }

  const videoDir = '/opt/cursor/artifacts';
  const switchPage = await context.newPage();
  await switchPage.goto(`${BASE}/test/#home`, { waitUntil: 'domcontentloaded' });
  await switchPage.evaluate(() => localStorage.setItem('darThemeV1', 'dar-al-layl'));
  await switchPage.reload({ waitUntil: 'networkidle' });
  await switchPage.waitForTimeout(1200);

  const frames = [];
  const tabs = ['home', 'quiz', 'feed', 'quran', 'more'];
  for (const tab of tabs) {
    await switchPage.locator(`[data-bottom-nav="${tab}"]`).click();
    await switchPage.waitForTimeout(260);
    const buf = await switchPage.locator('#bottomNav').screenshot();
    frames.push(buf);
  }

  fs.writeFileSync(path.join(videoDir, 'bottom-nav-tab-switch-notes.txt'), [
    'Tab switch sequence captured as frame buffers.',
    `Frames: ${frames.length}`,
    'Use external tool to assemble GIF if needed.',
  ].join('\n'));
  console.log('tab switch frames', frames.length);

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
