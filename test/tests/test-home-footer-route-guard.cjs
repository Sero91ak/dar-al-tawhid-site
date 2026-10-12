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
console.log("OK: branded footer remains on Startseite only; inner routes release its scroll space");
