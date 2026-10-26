#!/usr/bin/env node
"use strict";
/* DAR adult visitor viewport matrix.
   Browser: npx -y -p playwright node ios/DarAlTawhid/Tests/adult-all-routes-visual-audit.cjs
   Preferred: npm install --no-save playwright && npx playwright install chromium
   Local/CI URL: DAR_AUDIT_BASE_URL=https://<authorized-preview> ...
   This script does not click write actions, transmit credentials, or bypass gates.
*/
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const BASE = String(process.env.DAR_AUDIT_BASE_URL || "https://dar-al-tawhid.de/")
  .replace(/#.*$/, "");
const OUTPUT = path.resolve(process.env.DAR_AUDIT_OUTPUT || "dar-adult-viewport-evidence");
const ENGINE = process.env.DAR_AUDIT_ENGINE === "webkit" ? webkit : chromium;
const MAX_LINKS = Math.min(150, Math.max(1, Number(process.env.DAR_AUDIT_MAX_LINKS || 50)));
const ALL_PROFILES = [
  { id: "fold-exterior-portrait", w: 390, h: 844 },
  { id: "fold-exterior-landscape", w: 844, h: 390 },
  { id: "iphone-large-portrait", w: 430, h: 932 },
  { id: "iphone-large-landscape", w: 932, h: 430 },
  { id: "fold-interior-portrait", w: 1024, h: 1366 },
  { id: "fold-interior-landscape", w: 1366, h: 1024 },
  { id: "ipad-portrait", w: 820, h: 1180 },
  { id: "ipad-landscape", w: 1180, h: 820 },
  { id: "ipad-split-window", w: 375, h: 1000 }
];
const seeds = [
  "#home", "#topics", "#quran", "#hadith", "#dua", "#frauen", "#quiz",
  "#more", "#settings", "#notifications", "#account", "#about",
  "#news", "#calendar", "#zakat", "#ramadan", "#sources"
];
const allow = new Set((process.env.DAR_AUDIT_PROFILES || "")
  .split(",").map(s => s.trim()).filter(Boolean));
const profiles = allow.size ? ALL_PROFILES.filter(p => allow.has(p.id)) : ALL_PROFILES;
fs.mkdirSync(OUTPUT, { recursive: true });
const report = {
  started: new Date().toISOString(), base: BASE, browser: ENGINE === webkit ? "webkit" : "chromium",
  profiles: [], failures: []
};
function safeName(s) {
  return String(s).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 65);
}
async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const view = document.querySelector("#appView");
    const nav = document.querySelector("#bottomNav");
    const rect = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const navButtons = [...(nav?.querySelectorAll("button,a,[role=button]") || [])]
      .filter(el => el.getBoundingClientRect().width > 0)
      .slice(0, 18).map(el => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const inScreen = x >= 0 && y >= 0 && x < innerWidth && y < innerHeight;
        const over = inScreen ? document.elementFromPoint(x, y) : null;
        return {
          label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 45),
          w: Math.round(r.width), h: Math.round(r.height),
          accessible: !inScreen || over === el || el.contains(over)
        };
      });
    const route = [...document.body.classList].filter(x => /^is-[a-z0-9-]+-(route|overview)$/.test(x));
    const appRect = rect(view);
    const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
    const width = root.clientWidth || innerWidth;
    const links = [...document.querySelectorAll('#appView a[href^="#"],#bottomNav a[href^="#"]')]
      .filter(a => a.getBoundingClientRect().width > 0)
      .map(a => a.getAttribute("href")).filter(h => h && h !== "#" && !h.startsWith("#!"))
      .slice(0, 150);
    return {
      path: location.pathname, hash: location.hash, route,
      width, height: root.clientHeight,
      mode: root.getAttribute("data-layout"),
      foldDual: root.getAttribute("data-fold-dual"),
      orientation: root.getAttribute("data-orientation"),
      contentLength: (view?.textContent || "").trim().length,
      appRect, navRect: rect(nav), navButtons, links,
      horizontalOverflow: Math.max(0, scrollWidth - width),
      blocked: Boolean(document.querySelector("[aria-modal=true]:not([hidden]), #darTestLock"))
    };
  });
}
(async () => {
  const browser = await ENGINE.launch({ headless: true, args: ENGINE === chromium ? ["--no-sandbox"] : [] });
  try {
    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: { width: profile.w, height: profile.h },
        deviceScaleFactor: 2, hasTouch: true, isMobile: true,
        locale: "de-DE", reducedMotion: "reduce"
      });
      const page = await context.newPage();
      const item = { ...profile, pages: [], failures: [], visitedRoutes: [] };
      report.profiles.push(item);
      page.on("pageerror", e => item.failures.push({ type: "runtime", message: String(e.message).slice(0, 300) }));
      await page.goto(BASE + "#home", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForFunction(() => !!document.querySelector("#appView"), null, { timeout: 15000 });
      await page.waitForTimeout(1000);
      const queue = [...seeds];
      const seen = new Set();
      const routeNames = new Set();
      while (queue.length && seen.size < MAX_LINKS) {
        const hash = queue.shift();
        if (!hash || seen.has(hash)) continue;
        seen.add(hash);
        try {
          await page.evaluate(nextHash => { location.hash = nextHash; }, hash);
          await page.waitForTimeout(750);
          const state = await snapshot(page);
          state.route.forEach(x => routeNames.add(x));
          const pageIssues = [];
          if (!state.appRect || state.appRect.w < 30) pageIssues.push("empty-or-hidden-shell");
          if (state.horizontalOverflow > 3) pageIssues.push("horizontal-page-overflow:" + state.horizontalOverflow);
          if (state.appRect && state.appRect.x < -5) pageIssues.push("negative-content-offset");
          if (!state.mode) pageIssues.push("no-adaptive-layout");
          if (state.navButtons.some(b => !b.accessible)) pageIssues.push("covered-navigation");
          const row = { hash, route: state.route, size: [profile.w, profile.h],
            layout: state.mode, foldDual: state.foldDual, issues: pageIssues };
          item.pages.push(row);
          if (pageIssues.length) {
            const filename = safeName(profile.id + "-" + hash) + ".png";
            await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: false }).catch(() => {});
            item.failures.push({ ...row, screenshot: filename });
          }
          for (const link of state.links) {
            if (!seen.has(link) && !queue.includes(link) && queue.length < 160) queue.push(link);
          }
        } catch (e) {
          item.failures.push({ hash, error: String(e.message).slice(0, 240) });
        }
      }
      item.visitedRoutes = [...routeNames].sort();
      await context.close();
      console.log(profile.id + ": " + item.pages.length + " pages, " +
        item.visitedRoutes.length + " route families, " + item.failures.length + " findings");
      report.failures.push(...item.failures.map(x => ({ profile: profile.id, ...x })));
    }
  } finally {
    await browser.close();
    report.ended = new Date().toISOString();
    fs.writeFileSync(path.join(OUTPUT, "report.json"), JSON.stringify(report, null, 2) + "\n");
    console.log("Evidence: " + path.join(OUTPUT, "report.json"));
  }
  if (report.failures.length) process.exitCode = 1;
})().catch(e => { console.error(e.stack || String(e)); process.exitCode = 1; });
