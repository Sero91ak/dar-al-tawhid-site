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
  "#home", "#recent", "#topics", "#post", "#quran", "#quran-surah",
  "#quran-topic", "#quran-player", "#hadith", "#dua", "#duas", "#frauen",
  "#propheten", "#scholars", "#scholar", "#bibliothek", "#books",
  "#catalog", "#library", "#quiz", "#more", "#settings",
  "#notifications", "#account", "#about", "#news", "#calendar",
  "#zakat", "#ramadan", "#prayer", "#jummah", "#ilm", "#wasiyyah",
  "#sources", "#saved"
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
    // Specialist fullscreen players intentionally replace the global dock.
    // Their hidden/covered global nav is not a defect in its accessibility.
    const immersive = document.body.classList.contains("is-quran-player-route")
      || document.body.classList.contains("is-library-reader-route");
    const navStyle = nav ? getComputedStyle(nav) : null;
    const globalNavActive = !!nav && !immersive && navStyle.display !== "none"
      && navStyle.visibility !== "hidden" && navStyle.pointerEvents !== "none";
    const navButtons = [...(globalNavActive ? nav.querySelectorAll("button,a,[role=button]") : [])]
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
    // Fullscreen Qurʾān playback owns navigation while its overlay is open.
    // Do not mistake the intentionally hidden global tab bar for a defect:
    // instead verify the actual close/back and play buttons are reachable.
    const player = document.querySelector("#darQuranPlayer");
    const playerActive = document.body.classList.contains("is-quran-player-route")
      || document.documentElement.classList.contains("is-quran-player-route");
    const playerControls = playerActive ? [".dqp-back", ".dqp-play"].map(selector => {
      const button = player?.querySelector(selector);
      if (!button) return { selector, exists: false, reachable: false };
      const r = button.getBoundingClientRect();
      const centerX = r.left + r.width / 2, centerY = r.top + r.height / 2;
      const inScreen = r.width >= 28 && r.height >= 28
        && centerX >= 0 && centerY >= 0 && centerX < innerWidth && centerY < innerHeight;
      const hit = inScreen ? document.elementFromPoint(centerX, centerY) : null;
      const style = getComputedStyle(button);
      return { selector, exists: true, reachable: !!inScreen &&
        style.visibility !== "hidden" && style.display !== "none" &&
        !!hit && (hit === button || button.contains(hit)) };
    }) : [];
    const route = [...document.body.classList].filter(x => /^is-[a-z0-9-]+-(route|overview)$/.test(x));
    const appRect = rect(view);
    const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
    const width = root.clientWidth || innerWidth;
    const anchorLinks = [...document.querySelectorAll('#appView a[href^="#"],#bottomNav a[href^="#"]')]
      .filter(a => a.getBoundingClientRect().width > 0)
      .map(a => a.getAttribute("href")).filter(h => h && h !== "#" && !h.startsWith("#!"));
    // Most visitor pages navigate through data-nav buttons, not href anchors.
    // Include those routes in discovery without clicking account/write actions.
    const navLinks = [...document.querySelectorAll(
      '#appView [data-nav],#bottomNav [data-bottom-nav]'
    )].filter(el => el.getBoundingClientRect().width > 0)
      .map(el => "#" + (el.getAttribute("data-nav") || el.getAttribute("data-bottom-nav") || ""))
      .filter(h => h.length > 1 && !h.includes("{"));
    const links = [...new Set(anchorLinks.concat(navLinks))].slice(0, 150);
    return {
      path: location.pathname, hash: location.hash, route,
      width, height: root.clientHeight,
      mode: root.getAttribute("data-layout"),
      foldDual: root.getAttribute("data-fold-dual"),
      orientation: root.getAttribute("data-orientation"),
      contentLength: (view?.textContent || "").trim().length,
      appRect, navRect: rect(nav), navButtons, links, playerActive, playerControls,
      expectedMode: window.DarAdaptiveLayout?.resolveLayoutMode?.(root.clientWidth, root.clientHeight) || null,
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
        // Match the actual Swift WKWebView customUserAgent; without it the
        // public desktop router redirects the browser to desktop-preview.
        userAgent: "DarAlTawhid-iOS/1.0 WKWebView",
        locale: "de-DE", reducedMotion: "reduce"
      });
      const page = await context.newPage();
      const item = { ...profile, pages: [], failures: [], visitedRoutes: [] };
      report.profiles.push(item);
      page.on("pageerror", e => item.failures.push({ type: "runtime", hash: new URL(page.url()).hash, message: String(e.message).slice(0, 300), stack: String(e.stack || "").slice(0, 900) }));
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
          if (state.expectedMode && state.mode !== state.expectedMode)
            pageIssues.push("stale-layout-mode:" + state.mode + "!=" + state.expectedMode);
          if (state.navButtons.some(b => !b.accessible)) pageIssues.push("covered-navigation");
          if (state.playerActive && state.playerControls.some(control => !control.reachable))
            pageIssues.push("blocked-player-back-or-play");
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
      // Read-only navigation into actual detail templates; merely setting a
      // top-level hash would miss the card-to-reader path and related handlers.
      item.deepRoutes = [];
      for (const entry of [
        { home: "#recent", selector: '#appView [data-nav="post"]' },
        { home: "#quran", selector: '#appView [data-nav="quran-surah"]' },
        { home: "#scholars", selector: '#appView [data-nav="scholar"]' },
        { home: "#bibliothek", selector: '#appView [data-library-open]' }
      ]) {
        try {
          await page.evaluate(h => { location.hash = h; }, entry.home);
          await page.waitForTimeout(650);
          const target = page.locator(entry.selector).first();
          if (!await target.count() || !await target.isVisible()) {
            item.deepRoutes.push({ entry, result: "no-visible-card" });
            continue;
          }
          await target.scrollIntoViewIfNeeded({ timeout: 3500 });
          await target.click({ timeout: 6500 });
          await page.waitForTimeout(650);
          const detail = await snapshot(page);
          const issues = [];
          if (detail.horizontalOverflow > 3) issues.push("detail-page-overflow:" + detail.horizontalOverflow);
          if (!detail.appRect || detail.appRect.w < 30) issues.push("detail-page-not-rendered");
          item.deepRoutes.push({ entry, actualRoute: detail.route, hash: detail.hash, issues });
          if (issues.length) item.failures.push({ type: "deep-reader-route", entry, issues });
        } catch (e) {
          const diagnose = await page.evaluate(selector => {
            const el = document.querySelector(selector);
            if (!el) return { reason: "no-target-node" };
            const r = el.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const at = document.elementFromPoint(x, y);
            const cs = getComputedStyle(el);
            const describe = element => element && {
              tag: element.tagName, id: element.id,
              className: String(element.className || "").slice(0, 120),
              parentClass: String(element.parentElement?.className || "").slice(0, 120)
            };
            return { hash: location.hash, element: describe(el), hit: describe(at),
              hitOwned: at === el || el.contains(at), pointerEvents: cs.pointerEvents,
              opacity: cs.opacity, display: cs.display, x, y,
              viewport: [innerWidth, innerHeight], rect: {
                x: r.x, y: r.y, width: r.width, height: r.height
              }};
          }, entry.selector).catch(error => ({ diagnosticError: String(error).slice(0, 200) }));
          const filename = safeName(profile.id + "-" + entry.home + "-detail-click") + ".png";
          await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: false }).catch(() => {});
          item.failures.push({ type: "deep-reader-route", entry,
            error: String(e.message).slice(0, 550), diagnose, screenshot: filename });
        }
      }
      // Actual fold/unfold/rotate transitions on the SAME SPA route.
      // A matrix of separate loads would miss stale mode, lost content, or
      // navigation state that only appears during dynamic window resizing.
      item.transitions = [];
      for (const activeHash of ["#home", "#quran", "#hadith", "#dua", "#quiz", "#frauen"]) {
        try {
          await page.evaluate(h => { location.hash = h; }, activeHash);
          await page.waitForTimeout(650);
          const before = await snapshot(page);
          for (const target of [
            { w: 390, h: 844 }, { w: 1024, h: 1366 },
            { w: 1366, h: 1024 }, { w: 390, h: 844 }
          ]) {
            await page.setViewportSize({ width: target.w, height: target.h });
            await page.waitForTimeout(500);
            const after = await snapshot(page);
            const issues = [];
            if (after.horizontalOverflow > 3) issues.push("overflow-after-resize:" + after.horizontalOverflow);
            if (!after.appRect || after.appRect.w < 30) issues.push("lost-app-content");
            if (after.hash !== before.hash) issues.push("lost-active-route");
            if (!after.mode) issues.push("lost-layout-controller");
            if (after.expectedMode && after.mode !== after.expectedMode)
              issues.push("stale-layout-after-fold:" + after.mode + "!=" + after.expectedMode);
            item.transitions.push({ hash: activeHash, target, beforeMode: before.mode,
              afterMode: after.mode, issues });
            if (issues.length) item.failures.push({ type: "fold-rotate-transition", hash: activeHash, target, issues });
          }
        } catch (e) {
          item.failures.push({ type: "fold-rotate-transition", hash: activeHash,
            error: String(e.message).slice(0, 240) });
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
