/* Home-only social footer regression: visitor and test must not append a
 * second scroll-length footer to inner routes. Run with Node 20. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
function count(s){return html.split(s).length - 1;}
const marker = "DAR_HOME_ONLY_SOCIAL_FOOTER_V1344";
assert.equal(count(marker),1,"Home-only footer fix must exist exactly once");
assert.equal(count('<footer class="footer">'),1,"There must be one shared app footer");
assert.equal(count('by Serhat Abu Malik'),1,"Home signature must be preserved");
assert.match(html,/<footer class="footer">[\\s\\S]*?Telegram[\\s\\S]*?WhatsApp[\\s\\S]*?Instagram[\\s\\S]*?by Serhat Abu Malik[\\s\\S]*?<\\/footer>/,
  "Original social buttons and signature must stay intact");
assert.match(html,/function isHomeRoute\\(route\\)\\{return String\\(route\\?\\.view\\|\\|"home"\\)==="home"\\}/,
  "Home must be identified by current route, not bottom-nav section");
assert.match(html,/document\\.body\\.classList\\.toggle\\("is-home-route",isHome\\)/,
  "Route changes must synchronize home-only footer visibility");
const css = html.match(/<style id="dar-home-only-social-footer-v1344">([\\s\\S]*?)<\\/style>/);
assert.ok(css,"Footer-only rule must be a scoped style");
assert.match(css[1],/body:not\\(\\.is-home-route\\) > \\.app > footer\\.footer/);
assert.match(css[1],/display:none\\s*!important/,"Non-home footer must leave layout flow");
assert.match(css[1],/margin:0\\s*!important/,"No stale footer margin");
assert.match(css[1],/padding:0\\s*!important/,"No stale footer padding");
assert.doesNotMatch(css[1],/\\#bottomNav|\\.bottom-nav/,"Do not modify fixed tab navigation");
assert.doesNotMatch(css[1],/\\#appView\\.view\\s*\\{|\\#appView\\s*\\{/,"Do not remove navigation safe clearance from content");
console.log("OK: shared footer is kept only on Startseite; all inner routes lose footer spacing; nav unaffected");
