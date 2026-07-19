const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/opt/cursor/artifacts/screenshots';
const BASE = 'http://127.0.0.1:8765';

const prayerSettings = {
  city: 'Rheinbach', lat: 50.6256, lon: 6.9491, angle: 12, asrFactor: 1,
  advanceMinutes: 15, tahajjudMode: 'off', reminder: true, dailyDua: true,
  dailyRecommendation: true, jummahNotifications: false, jummahUseManualTime: false,
  jummahManualTime: '13:30', jummahMorningTime: '09:00', jummahAdvanceMinutes: 30,
  locationGranted: true,
};

async function prepare(page, theme, hash) {
  await page.goto(`${BASE}/test/${hash}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ theme, prayerSettings }) => {
    localStorage.setItem('darThemeV1', theme);
    localStorage.setItem('darPrayerSettingsV1', JSON.stringify(prayerSettings));
    localStorage.setItem('darPrayerPushAccordionOpenV1', '0');
  }, { theme, prayerSettings });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await page.evaluate(() => {
    if (window.hydrateUiIcons) window.hydrateUiIcons(document);
    else if (window.hydrateAppIcons) window.hydrateAppIcons(document);
  });
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  await prepare(page, 'dar-al-layl', '#home');
  await shot(page, 'icons-home-dar-al-layl.png');

  await prepare(page, 'bordeaux', '#home');
  await shot(page, 'icons-home-bordeaux.png');

  await prepare(page, 'soft', '#home');
  await shot(page, 'icons-home-soft.png');

  await prepare(page, 'dark', '#more');
  await shot(page, 'icons-more-dark.png');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'icons-more-lernen-dark.png');
  await page.evaluate(() => {
    const g = document.querySelector('[data-more-group] h3');
    if (g && g.textContent.includes('Alltag')) g.closest('[data-more-group]').scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'icons-more-alltag-dark.png');
  await page.evaluate(() => {
    const groups = [...document.querySelectorAll('[data-more-group] h3')];
    const g = groups.find(el => el.textContent.includes('Werkzeuge'));
    if (g) g.closest('[data-more-group]').scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'icons-more-werkzeuge-dark.png');

  await prepare(page, 'dark', '#quran');
  await shot(page, 'icons-quran-dark.png');

  await prepare(page, 'dark', '#duas');
  await shot(page, 'icons-dua-dark.png');

  await prepare(page, 'dark', '#topics');
  await shot(page, 'icons-posts-dark.png');

  await prepare(page, 'dark', '#quiz');
  await shot(page, 'icons-quiz-dark.png');

  await prepare(page, 'dark', '#ilm');
  await shot(page, 'icons-ilm-dark.png');

  // Bottom nav close-up via home
  await prepare(page, 'dar-al-layl', '#home');
  const nav = page.locator('#bottomNav');
  if (await nav.count()) await nav.screenshot({ path: path.join(OUT, 'icons-bottom-nav-dar-al-layl.png') });

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
