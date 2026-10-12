/* Home-only social footer regression for the current app HTML. Node 20, no AI review. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const count = (fragment) => html.split(fragment).length - 1;
assert.equal(count("DAR_HOME_ONLY_SOCIAL_FOOTER_V1344"), 1, "Exactly one footer repair marker");
assert.equal(count('<footer class="footer">'), 1, "Exactly one shared brand footer");
const first = html.indexOf('<footer class="footer">');
const last = html.indexOf("</footer>", first);
assert.ok(first > 0 && last > first, "Shared footer must close normally");
const footer = html.slice(first, last);
for (const label of ["DĀR AL TAWḤĪD", "Folgt für mehr Wissen", "Telegram", "WhatsApp", "Instagram", "by Serhat Abu Malik"]) {
  assert.ok(footer.includes(label), "Home content missing: " + label);
}
assert.ok(html.includes('function isHomeRoute(route){return String(route?.view||"home")==="home"}'),
  "Home route determination must remain exact");
assert.ok(html.includes('document.body.classList.toggle("is-home-route",isHome)'),
  "Route changes must update the existing body class");
const style = html.match(/<style id="dar-home-only-social-footer-v1344">([\s\S]*?)<\/style>/);
assert.ok(style, "Explicit home-only stylesheet must exist");
const css = style[1];
assert.ok(css.includes("body:not(.is-home-route) > .app > footer.footer"), "Only non-home footer hidden");
assert.match(css, /display\s*:\s*none\s*!important/i, "Footer must leave the layout flow");
assert.match(css, /margin\s*:\s*0\s*!important/i, "No residual footer margin");
assert.match(css, /padding\s*:\s*0\s*!important/i, "No residual footer padding");
assert.ok(!css.includes("#bottomNav") && !css.includes(".bottom-nav"),
  "Fixed bottom nav must remain untouched");
const appliedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!appliedCss.includes("#appView") && !appliedCss.includes("safe-area-inset-bottom"),
  "Existing reader and fixed-nav safe clearance must remain untouched");
const sharedCss=fs.readFileSync(path.resolve(__dirname,"../assets/dar-app-chrome.css"),"utf8");
const testHtml=fs.readFileSync(path.resolve(__dirname,"../test/index.html"),"utf8");
const testFooterStart=testHtml.indexOf('<footer class="footer">');
const testFooterEnd=testHtml.indexOf("</footer>",testFooterStart);
assert.ok(testFooterStart>0&&testFooterEnd>testFooterStart,
  "Dar Test must retain one complete home footer");
assert.equal(testHtml.slice(testFooterStart,testFooterEnd+9),html.slice(first,last+9),
  "Dar Test home footer markup must match the Live home footer exactly");
const testAtmosphere=fs.readFileSync(
  path.resolve(__dirname,"../test/assets/dar-home-atmosphere-v1202.css"),"utf8");
assert.ok(!testAtmosphere.includes("body.has-bottom-nav:has(.footer)"),
  "Test styles must never alter every route merely because a footer exists");
assert.ok(testAtmosphere.includes("body.has-bottom-nav.is-home-route:has(footer.footer) #appView.view"),
  "Test app content spacing may be modified only on the home route");
assert.ok(testAtmosphere.includes("padding-bottom:8px!important"),
  "Dar Test home footer must not have duplicate bottom navigation clearance");

assert.ok(sharedCss.includes("DAR_HOME_ONLY_SOCIAL_FOOTER_GLOBAL_V1345"),
  "Shared adult stylesheet must contain home-only footer guard");
const sharedRule=sharedCss.slice(sharedCss.indexOf("DAR_HOME_ONLY_SOCIAL_FOOTER_GLOBAL_V1345"));
assert.match(sharedRule,/body:not\(\.is-home-route\) > div\.app > footer\.footer/,
  "The shared adult rule must match non-home app footer only");
assert.match(sharedRule,/display\s*:\s*none\s*!important/i,
  "Shared footer must leave document flow on inner pages");
assert.match(sharedRule,/height\s*:\s*0\s*!important/i,
  "Hidden footer should contribute zero document height");
assert.match(sharedRule,/margin\s*:\s*0\s*!important/i);
assert.match(sharedRule,/padding\s*:\s*0\s*!important/i);
assert.match(sharedRule,/border\s*:\s*0\s*!important/i);
assert.ok(!sharedRule.includes("#appView")&&!sharedRule.includes("#bottomNav"),
  "Reader content and fixed main navigation must remain unchanged");
assert.ok(testHtml.includes('<link rel="stylesheet" href="/assets/dar-app-chrome.css?'),
  "Dar Test must use the same shared adult footer stylesheet");
assert.ok(testHtml.includes('document.body.classList.toggle("is-home-route",isHome)'),
  "Dar Test must use the same home-route state as visitor app");
assert.ok(!fs.readFileSync(path.resolve(__dirname,"../kids/index.html"),"utf8")
  .includes("/assets/dar-app-chrome.css"),
  "KIDS must not load the adult home-only footer style");
console.log("OK: branded footer remains on Startseite only; inner routes release its scroll space");
