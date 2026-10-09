#!/usr/bin/env node
"use strict";
/* Real Chromium navigation for the isolated 2D preview. Not a device or fiqh approval. */
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadPlaywright() {
  const Module = require("node:module");
  const extra = String(process.env.NODE_PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  const paths = extra.concat(Module._nodeModulePaths(process.cwd()));
  const id = require.resolve("playwright", { paths });
  return require(id);
}

const root = path.join(__dirname, "..", "..", "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".svg": "image/svg+xml"
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const file = path.normalize(path.join(root, urlPath.replace(/^\//, "")));
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, buf) => {
        if (err) {
          res.writeHead(404);
          res.end("missing");
          return;
        }
        res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
        res.end(buf);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

async function main() {
  let playwright;
  try {
    playwright = await loadPlaywright();
  } catch (err) {
    console.log("SKIP playwright not installed: " + err.message);
    process.exit(0);
  }
  const server = await startServer();
  const port = server.address().port;
  const browser = await playwright.chromium.launch({ headless: true });
  const passed = [];
  const fail = (label, err) => {
    console.error("FAIL " + label);
    throw err;
  };
  const ok = (label) => {
    passed.push(label);
    console.log("PASS " + label);
  };

  async function runPage(url, gender, viewport) {
    const page = await browser.newPage({ viewport });
    const failed = [];
    page.on("pageerror", (e) => failed.push(String(e)));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#kidsMeinGebetEntry");
    const navCount = await page.locator(".nav-btn").count();
    if (url.includes("home-fixture")) assert.equal(navCount, 4);
    await page.click("#kidsMeinGebetEntry");
    await page.waitForSelector("#view-mein-gebet.active");
    const src = await page.locator("#view-mein-gebet .kmg-figure").getAttribute("src");
    assert.match(src, gender === "girl" ? /figur-maedchen-original\.png/ : /figur-junge-original\.png/);
    await page.click('[data-kmg-lesson="what"]');
    await page.waitForSelector("#kmgDetail:not([hidden])");
    await page.click("[data-kmg-topic='0']");
    await page.waitForSelector("#kmgStation:not([hidden])");
    const title = await page.locator("#kmgStationTitle").innerText();
    assert.ok(title.length > 3);
    await page.goBack();
    await page.waitForSelector("#kmgDetail:not([hidden])");
    await page.goBack();
    await page.waitForSelector("#kmgOverview:not([hidden])");
    await page.goBack();
    await page.waitForSelector("#view-today.active");
    const meinActive = await page.locator("#view-mein-gebet.active").count();
    assert.equal(meinActive, 0);
    assert.equal(failed.length, 0, failed.join("\n"));
    await page.close();
  }

  try {
    await runPage(
      "http://127.0.0.1:" + port + "/kids/mein-gebet/demo-junge.html",
      "boy",
      { width: 390, height: 844 }
    );
    ok("iPhone-sized boy demo: open, station, browser back to home");
    await runPage(
      "http://127.0.0.1:" + port + "/kids/mein-gebet/demo-maedchen.html",
      "girl",
      { width: 768, height: 1024 }
    );
    ok("iPad-sized girl demo: matching original figure and history");
    await runPage(
      "http://127.0.0.1:" + port + "/kids/mein-gebet/qa/home-fixture.html",
      "boy",
      { width: 360, height: 800 }
    );
    ok("Kids Home fixture: four tabs, test entry under Hörwelten, no extra tab");
    void pathToFileURL;
    console.log("OK playwright preview checks: " + passed.length);
  } catch (err) {
    fail(err.message || err, err);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
