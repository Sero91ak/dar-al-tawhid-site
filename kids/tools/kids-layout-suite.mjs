import pkg from '/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = pkg;
const BASE = process.env.KIDS_BASE || 'http://127.0.0.1:38287';
const START = BASE.replace(/\/$/, '') + '/kids/start.html';
const PRIVACY = BASE.replace(/\/$/, '') + '/privacy/index.html';
const ROOT = process.env.KIDS_QA_OUT || '/workspace/kids-qa-suite-20261127';
mkdirSync(ROOT, { recursive: true });

const VIEWPORTS = [
  { id: 'iphone-se', width: 375, height: 667, dpr: 2, mobile: true },
  { id: 'iphone-mini', width: 375, height: 812, dpr: 2, mobile: true },
  { id: 'iphone-standard', width: 390, height: 844, dpr: 2, mobile: true },
  { id: 'iphone-pro-max', width: 430, height: 932, dpr: 2, mobile: true },
  { id: 'galaxy-s', width: 360, height: 780, dpr: 3, mobile: true },
  { id: 'fold-closed', width: 344, height: 882, dpr: 2, mobile: true },
  { id: 'fold-closed-land', width: 882, height: 344, dpr: 2, mobile: true },
  { id: 'fold-open', width: 673, height: 841, dpr: 2, mobile: true },
  { id: 'fold-open-land', width: 841, height: 673, dpr: 2, mobile: true },
  { id: 'ipad-mini-port', width: 768, height: 1024, dpr: 1.5, mobile: true },
  { id: 'ipad-mini-land', width: 1024, height: 768, dpr: 1.5, mobile: true },
  { id: 'ipad-air-port', width: 820, height: 1180, dpr: 1.5, mobile: true },
  { id: 'ipad-air-land', width: 1180, height: 820, dpr: 1.5, mobile: true },
  { id: 'ipad-pro-port', width: 1024, height: 1366, dpr: 1.5, mobile: true },
  { id: 'ipad-pro-land', width: 1366, height: 1024, dpr: 1.5, mobile: true },
  { id: 'mac', width: 1440, height: 900, dpr: 1, mobile: false },
];
const ONLY = (process.env.KIDS_VP || '').split(',').map(s => s.trim()).filter(Boolean);
const VIEWPORTS_RUN = ONLY.length ? VIEWPORTS.filter(v => ONLY.includes(v.id)) : VIEWPORTS;
if (ONLY.length && !VIEWPORTS_RUN.length) {
  console.error('No viewports matched KIDS_VP=', process.env.KIDS_VP);
  process.exit(2);
}

function seedProfile() {
  window.DAR_KIDS_TEST_CONTAINER = true;
  localStorage.setItem('kids.profiles.v1', JSON.stringify([
    { id: 'qa-boy-68', name: 'Test12', gender: 'boy', age: '6–8' }
  ]));
  localStorage.setItem('kids.activeProfile', 'qa-boy-68');
  localStorage.setItem('kids.age', '6–8');
}

const AUDIT_FN = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const issues = [];
  const round = (n) => Math.round(n);
  const dock = document.querySelector('.bottom-nav, .app > nav.bottom-nav');
  const dr = dock && dock.getBoundingClientRect();
  const dockTop = (dr && dr.height > 24) ? dr.top : vh;
  const bodyText = (document.body && document.body.innerText) || '';
  if (/serhat/i.test(bodyText)) {
    const m = bodyText.match(/[^.\n]{0,40}[Ss]erhat[^.\n]{0,40}/);
    issues.push({ type: 'serhat-visible', sample: (m && m[0]) || 'serhat' });
  }
  for (const img of document.querySelectorAll('.logo-wrap img, img[src*="legal-logo"]')) {
    if (!img.naturalWidth) issues.push({ type: 'broken-logo', src: (img.getAttribute('src') || '').slice(0, 120) });
  }
  const pageW = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
  if (pageW > vw + 4) issues.push({ type: 'page-overflow-x', pageW, vw });

  const isRail = (el) => {
    if (!el || !el.nodeType) return false;
    try {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 4) return true;
    } catch (e) {}
    return !!(el.closest && el.closest('.duahub-chips, .dua-chips, .kids-touch-rail, .kfr-controls, [class*="chip-rail"]'));
  };
  const ignored = (el) => {
    if (!el || !el.tagName) return true;
    const tag = el.tagName;
    const cls = (el.className || '').toString();
    if (tag === 'HTML' || tag === 'BODY') return true;
    if (tag === 'MAIN' && /\bshell\b/.test(cls)) return true;
    if (tag === 'SECTION' && /\bview\b/.test(cls)) return true;
    if (el.closest && el.closest('.bottom-nav, #kids-visitor-boot')) return true;
    return false;
  };
  const scrollParents = (el) => {
    const out = [];
    let p = el.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 2) out.push(p);
      p = p.parentElement;
    }
    if (document.scrollingElement) out.push(document.scrollingElement);
    return out;
  };
  const canScrollClear = (el, limit) => {
    const r = el.getBoundingClientRect();
    const need = r.bottom - limit + 8;
    if (need <= 0) return true;
    for (const sp of scrollParents(el)) {
      const room = (sp.scrollHeight - sp.clientHeight) - sp.scrollTop;
      if (room + 2 >= need) return true;
    }
    return false;
  };

  const isUnrendered = (el) => {
    let p = el;
    while (p && p.nodeType === 1) {
      const pcs = getComputedStyle(p);
      if (pcs.display === 'none' || pcs.visibility === 'hidden' || Number(pcs.opacity) === 0) return true;
      if (p.hidden || p.hasAttribute('hidden') || p.getAttribute('aria-hidden') === 'true' || p.inert) return true;
      if (p.tagName === 'DIALOG' && !p.open) return true;
      p = p.parentElement;
    }
    return el.getClientRects().length === 0;
  };
  const inDock = (el) => !!(el.closest && el.closest('.bottom-nav, nav.bottom-nav, .kids-detail-dock'));

  const interactors = document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="tab"],[role="link"],.nav-btn,.kids-tap-card,.pill,.choice,.salaf-topic,.tracker-item');
  const visible = [];
  for (const el of interactors) {
    const cs = getComputedStyle(el);
    if (isUnrendered(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) {
      const clip = (cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none') || (cs.position === 'absolute' && (parseFloat(cs.height) < 2 || parseFloat(cs.width) < 2) && (cs.overflow === 'hidden' || Number(cs.opacity) === 0));
      if (!clip && el.tabIndex !== -1) {
        issues.push({ type: 'zero-size-interactive', tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), id: el.id });
      }
      continue;
    }
    const onScreen = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    if (!onScreen) continue;
    visible.push({ el, r });
    if (r.width < 43.5 || r.height < 43.5) {
      const inlineLink = el.tagName === 'A' && (
        el.closest('p,li,blockquote,address,footer,.story-copy,.kfr-read,.parent-card p,.page-shell')
        || el.matches('a[href^="mailto:"], a[href^="tel:"]')
      ) && !el.classList.contains('pill') && !el.classList.contains('nav-btn') && !el.classList.contains('kids-tap-card');
      if (!inlineLink) {
        issues.push({ type: 'tap-target-small', tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), id: el.id, w: round(r.width), h: round(r.height), text: (el.textContent || '').trim().slice(0, 40) });
      }
    }
  }
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i], b = visible[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (inDock(a.el) || inDock(b.el)) continue;
      const x = Math.max(0, Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left));
      const y = Math.max(0, Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top));
      if (x * y > 24) {
        issues.push({ type: 'tap-target-overlap', a: ((a.el.className || a.el.tagName) + '').toString().slice(0, 40), b: ((b.el.className || b.el.tagName) + '').toString().slice(0, 40), area: round(x * y) });
        if (issues.filter(it => it.type === 'tap-target-overlap').length > 12) break;
      }
    }
    if (issues.filter(it => it.type === 'tap-target-overlap').length > 12) break;
  }

  const nodes = document.querySelectorAll('h1,h2,h3,h4,p,li,button,a,label,strong,small,time,input,.salaf-topic-copy,.choice,.hero-salam,.knowledge-title,.section-title,.overview-copy,img');
  for (const el of nodes) {
    if (ignored(el) || isUnrendered(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (!isRail(el) && !isRail(el.parentElement) && r.right > vw + 5 && r.left < vw && r.height > 10 && r.top < vh && r.bottom > 0) {
      issues.push({ type: 'overflow-x', tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), id: el.id, right: round(r.right), vw, text: (el.textContent || '').trim().slice(0, 40) });
    }
    if (r.bottom > dockTop + 8 && r.top < dockTop && r.width > 24 && r.top < vh && r.bottom > 0) {
      const heading = el.matches('h1, .page-head h1, .page-head h2, .hero h1, .salaf-hero h2, .overview-copy h1, .wm-kids, .knowledge-title') || (el.tagName === 'H2' && el.closest('.page-head'));
      const reachable = canScrollClear(el, dockTop);
      const text = (el.textContent || '').trim().slice(0, 50);
      if (!reachable) {
        issues.push({ type: 'unreachable-under-dock', tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), id: el.id, top: round(r.top), bottom: round(r.bottom), dockTop: round(dockTop), text });
      } else if (heading && r.top < dockTop && r.top > 24 && (r.bottom - dockTop) > 10) {
        // Title of the current screen sits under the dock on first paint.
        issues.push({ type: 'title-under-dock', tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), id: el.id, top: round(r.top), bottom: round(r.bottom), dockTop: round(dockTop), text });
      }
    }
  }
  return { vw, vh, dockTop: Math.round(dockTop), issues };
};

async function waitApp(page) {
  await page.waitForSelector('.bottom-nav, #view-today, .app', { timeout: 25000 });
  await page.waitForTimeout(500);
  for (const label of ['Überspringen', 'Weiter', 'Verstanden', 'Schließen']) {
    const b = page.getByRole('button', { name: label });
    if (await b.count()) { try { await b.first().click({ timeout: 700 }); } catch {} }
  }
}

async function showTab(page, name) {
  await page.evaluate((n) => {
    if (typeof window.showTab === 'function') window.showTab(n);
    else {
      const btn = document.querySelector(`.bottom-nav .nav-btn[data-target="${n}"]`);
      if (btn) btn.click();
    }
  }, name);
  await page.waitForTimeout(450);
}

async function auditNow(page) {
  const parent = await page.evaluate(AUDIT_FN);
  let frameIssues = [];
  try {
    const frame = page.frames().find(f => /akademie/.test(f.url()));
    if (frame) {
      const inner = await frame.evaluate(AUDIT_FN);
      const dockTop = parent.dockTop;
      // Re-check iframe headings against the parent dock using bounding boxes in the parent page.
      const mapped = await page.evaluate(({ dockTop }) => {
        const issues = [];
        const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
        if (!f || !f.contentDocument) return issues;
        const fr = f.getBoundingClientRect();
        const h1 = f.contentDocument.querySelector('h1, .overview-copy h1, .lesson-heading h1, .stage-surface h1');
        if (h1) {
          const r = h1.getBoundingClientRect();
          const top = fr.top + r.top, bottom = fr.top + r.bottom;
          if (bottom > dockTop + 8 && top < dockTop && top > 24) {
            issues.push({ type: 'title-under-dock', tag: 'IFRAME-H1', text: (h1.textContent || '').trim().slice(0, 50), top: Math.round(top), bottom: Math.round(bottom), dockTop });
          }
        }
        const serhat = /serhat/i.test((f.contentDocument.body && f.contentDocument.body.innerText) || '');
        if (serhat) issues.push({ type: 'serhat-visible', sample: 'iframe' });
        return issues;
      }, { dockTop });
      frameIssues = inner.issues.concat(mapped);
    }
  } catch (e) {}
  return { ...parent, issues: parent.issues.concat(frameIssues) };
}

async function shot(page, dir, name) {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name + '.png');
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  const audit = await auditNow(page).catch(err => ({ issues: [{ type: 'audit-error', sample: String(err).slice(0, 200) }] }));
  return { path, audit, fail: (audit.issues || []).length > 0 };
}

const LESSON_STEPS = [
  { step: 0, name: 'lesson-willkommen' },
  { step: 1, name: 'lesson-verstehen' },
  { step: 2, name: 'lesson-belege' },
  { step: 3, name: 'lesson-mitdenken' },
  { step: 4, name: 'lesson-merken' },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const summary = { base: BASE, at: new Date().toISOString(), viewports: [] };
let failCount = 0, checkCount = 0;

for (const vp of VIEWPORTS_RUN) {
  const dir = join(ROOT, vp.id);
  mkdirSync(dir, { recursive: true });
  const rec = { viewport: vp.id, width: vp.width, height: vp.height, pages: {} };

  // Splash
  {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr, userAgent: 'DarAlTawhidKids-iOS CreatorTest',
      locale: 'de-DE', hasTouch: vp.mobile, isMobile: vp.mobile,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.DAR_KIDS_IOS_APP = true; window.DAR_KIDS_NATIVE_START = false; });
    try {
      await page.goto(START, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForSelector('#kids-visitor-boot', { timeout: 8000 });
      await page.evaluate(() => {
        window.__KIDS_VISITOR_SPLASH_1__ = 1;
        document.documentElement.classList.add('kids-visitor-booting');
        const p = document.querySelector('#kids-visitor-boot .ktb-percent');
        const fill = document.querySelector('#kids-visitor-boot .ktb-fill');
        if (p) p.textContent = '62%';
        if (fill) fill.style.width = '62%';
      });
      await page.waitForTimeout(200);
      rec.pages.splash = await shot(page, dir, 'splash');
    } catch (e) {
      rec.pages.splash = { error: String(e).slice(0, 240) };
    }
    await ctx.close();
  }

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr, userAgent: 'DarAlTawhidKids-iOS CreatorTest',
    locale: 'de-DE', hasTouch: vp.mobile, isMobile: vp.mobile,
  });
  const page = await ctx.newPage();
  await page.addInitScript(seedProfile);
  try {
    await page.goto(START, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await waitApp(page);

    await showTab(page, 'today');
    rec.pages.heute = await shot(page, dir, 'heute');

    // Salah day modal / sheet
    try {
      await page.evaluate(() => {
        const b = document.querySelector('#kidsSalahOpenDay, .kids-salah-open-day');
        if (b) b.click();
      });
      await page.waitForTimeout(500);
      if (await page.locator('.kids-salah-day, #kidsSalahDay').count()) {
        rec.pages.salah_day = await shot(page, dir, 'salah-day');
        await page.evaluate(() => {
          const c = document.querySelector('.kids-salah-day [data-close], .kids-salah-day-back, .kids-salah-day button[aria-label*="Zurück"], .kids-salah-day button[aria-label*="schließen" i]');
          if (c) c.click();
          const day = document.querySelector('.kids-salah-day');
          if (day) day.setAttribute('hidden', '');
        });
        await page.waitForTimeout(250);
      }
    } catch {}

    await showTab(page, 'stories');
    rec.pages.hoeren = await shot(page, dir, 'hoeren');

    try {
      await page.evaluate(() => {
        if (window.DARKidsDuaHub && typeof window.DARKidsDuaHub.open === 'function') window.DARKidsDuaHub.open();
        else {
          const b = document.querySelector('.bottom-nav .nav-btn[data-target="dua"]');
          if (b) b.click();
        }
      });
      await page.waitForTimeout(600);
      rec.pages.dua = await shot(page, dir, 'dua');
      await page.evaluate(() => {
        const close = document.querySelector('[data-close-dua], .dua-hub-close, .kids-dua-close');
        if (close) close.click();
        document.documentElement.classList.remove('kids-dua-open');
      });
    } catch (e) {
      rec.pages.dua = { error: String(e).slice(0, 200) };
    }

    await showTab(page, 'parents');
    rec.pages.eltern = await shot(page, dir, 'eltern');

    // Lesebereich
    try {
      await showTab(page, 'stories');
      await page.waitForTimeout(250);
      await page.evaluate(() => {
        const salaf = document.querySelector('[data-go="salaf"], .kids-salaf-listening-hero');
        if (salaf) salaf.click();
      });
      await page.waitForTimeout(700);
      rec.pages.lesebereich = await shot(page, dir, 'lesebereich');
      const lesen = page.getByRole('button', { name: /^(Lesen|Hören & Mitlesen|Mitlesen)$/ }).first();
      const card = page.locator('#view-salaf button.salaf-topic, #view-salaf button, .salaf-topic').first();
      if (await card.count()) {
        await card.click({ timeout: 2500 }).catch(() => {});
        await page.waitForTimeout(400);
      }
      if (await lesen.count()) {
        await lesen.click({ timeout: 2500 }).catch(() => {});
        await page.waitForTimeout(600);
        rec.pages.lesen_player = await shot(page, dir, 'lesen-player');
        await page.evaluate(() => {
          const c = document.querySelector('.kfr-close, .kids-detail-dock-back, button[aria-label*="Zurück"]');
          if (c) c.click();
          document.documentElement.classList.remove('kids-follow-reader-open');
        });
      }
    } catch (e) {
      rec.pages.lesebereich = rec.pages.lesebereich || { error: String(e).slice(0, 200) };
    }

    // Lernen portal + lesson steps
    try {
      await page.evaluate(() => {
        const learn = document.querySelector('.kids-academy-tab, [data-academy-open="1"]');
        if (learn) learn.click();
      });
      await page.waitForFunction(() => {
        const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
        try { return !!(f && f.contentDocument && f.contentDocument.querySelector('#academyHome, main, .overview-hero')); }
        catch { return false; }
      }, { timeout: 20000 });
      await page.waitForTimeout(600);
      rec.pages.lernen = await shot(page, dir, 'lernen');

      await page.evaluate(() => {
        const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
        if (f) f.src = '/kids/akademie/index.html?kidsPortal=1&edgeScroll=1428&lektion=sidq';
      });
      await page.waitForFunction(() => {
        const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
        try { return !!(f && f.contentDocument && f.contentDocument.querySelector('#forwardStep, [data-jump-step]')); }
        catch { return false; }
      }, { timeout: 20000 });
      await page.waitForTimeout(700);
      for (const st of LESSON_STEPS) {
        for (let i = 0; i < 16; i++) {
          const cur = await page.evaluate(() => {
            const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
            try { return Number(f.contentDocument.body.dataset.academyStep || 0); }
            catch { return 0; }
          });
          if (cur >= st.step) break;
          const clicked = await page.evaluate(() => {
            const f = document.querySelector('.kids-academy-portal iframe, iframe[src*="akademie"]');
            const d = f && f.contentDocument;
            if (!d) return false;
            const visible = (el) => el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
            const step = Number(d.body.dataset.academyStep || 0);
            if (step === 3) {
              const choice = [...d.querySelectorAll('.answer-options .pill, .answer-options .choice, .question-panel .pill, button.choice')].find(visible);
              if (choice && !choice.classList.contains('is-selected')) { choice.click(); return true; }
              const confirm = d.querySelector('#confirmAnswer, #checkAnswer, .question-panel [data-confirm], #forwardStep, [data-focus-next], #backAfterLesson');
              if (visible(confirm) && !confirm.disabled) { confirm.click(); return true; }
            }
            const fwd = d.querySelector('#forwardStep');
            const focusNext = d.querySelector('.focus-page-navigation button[data-focus-next]');
            const recap = d.querySelector('#backAfterLesson, [data-open-recap]');
            const btn = visible(fwd) ? fwd : (visible(focusNext) ? focusNext : null);
            if (!btn || btn.disabled) return false;
            btn.click();
            return true;
          });
          if (!clicked) break;
          await page.waitForTimeout(320);
        }
        rec.pages[st.name] = await shot(page, dir, st.name);
      }
    } catch (e) {
      rec.pages.lernen = rec.pages.lernen || { error: String(e).slice(0, 240) };
    }
  } catch (e) {
    rec.error = String(e).slice(0, 300);
  }
  await ctx.close();

  // Privacy
  {
    const ctxp = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr, locale: 'de-DE', hasTouch: vp.mobile, isMobile: vp.mobile,
    });
    const pagep = await ctxp.newPage();
    try {
      await pagep.goto(PRIVACY, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pagep.waitForTimeout(350);
      rec.pages.privacy = await shot(pagep, dir, 'privacy');
    } catch (e) {
      rec.pages.privacy = { error: String(e).slice(0, 200) };
    }
    await ctxp.close();
  }

  const flags = [];
  for (const [name, info] of Object.entries(rec.pages)) {
    checkCount++;
    const n = (info.audit && info.audit.issues && info.audit.issues.length) || (info.error ? 1 : 0);
    if (n) { failCount += n; flags.push(`${name}:${n}`); }
  }
  console.log(vp.id, flags.length ? ('FAIL ' + flags.join(',')) : 'OK');
  summary.viewports.push(rec);
}

await browser.close();
const out = join(ROOT, 'audit.json');
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log('WROTE', out, 'checks', checkCount, 'issue-instances', failCount);
process.exit(failCount > 0 ? 1 : 0);
