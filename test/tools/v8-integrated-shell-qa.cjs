const fs = require("node:fs");

const html = fs.readFileSync("test/index.html", "utf8");
const js = fs.readFileSync("test/assets/v8-integrated-shell-v1.js", "utf8");
const css = fs.readFileSync("test/assets/v8-integrated-shell-v1.css", "utf8");
const locales = JSON.parse(fs.readFileSync("test/i18n/adult-ui-locales-nine-v8.json", "utf8"));

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert((html.match(/id="darV8IntegratedShellJS"/g) || []).length === 1, "integrated JS must be included exactly once");
assert((html.match(/id="darV8IntegratedShellCSS"/g) || []).length === 1, "integrated CSS must be included exactly once");
assert(!/v8-(?:duo-lab|complete-app-shell|global-shell|global-app-shell)-v1\.(?:js|css)/.test(html), "legacy V8 shell must not be active");
assert(!/dar-test-(?:v8-overhaul|duo-v8)\.(?:js|css)/.test(html), "alternative V8 shell must not be active");
assert(/width >= 760/.test(js) && /height >= 560/.test(js) && /keyboard/.test(js), "capacity-based fold logic missing");
assert(/usageKey/.test(js) && /rankedUsage/.test(js) && /Standard wiederherstellen/.test(js), "local explainable personalization missing");
assert(/data-v8-original-reader/.test(js) || /v8OriginalReader/.test(js), "original-reader protection markers missing");
assert(/prefers-reduced-motion/.test(css) && /safe-area-inset/.test(css), "motion or safe-area handling missing");
assert(Array.isArray(locales.availableLocales) && locales.availableLocales.join(",") === "de,tr,en,ar,ku,ckb,bs,fr,es", "nine-locale registry mismatch");
assert(locales.rtlLocales.join(",") === "ar,ckb", "RTL registry mismatch");
assert(locales.reviewStatus.fr === "draft-incomplete" && locales.reviewStatus.es === "draft-incomplete", "unfinished locales must remain marked incomplete");
assert(Object.keys(locales.reviewStatus).every(key => locales.availableLocales.includes(key)), "review status contains invalid locale keys");

if (failures.length) {
    console.error(failures.map(item => `FAIL: ${item}`).join("\n"));
    process.exit(1);
}

console.log("V8 integrated shell QA passed");
