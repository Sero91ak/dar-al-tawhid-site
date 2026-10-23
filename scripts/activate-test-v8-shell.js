#!/usr/bin/env node

/**
 * Activates the integrated V8 shell on the adult Test app only.
 *
 * The staging overlay intentionally protects test/index.html because the
 * library branch must not replace the complete app shell. V8 is therefore
 * promoted explicitly as its two versioned assets plus these two references.
 */
const fs = require("node:fs");

const htmlPath = "test/index.html";
const cssPath = "test/assets/v8-integrated-shell-v1.css";
const jsPath = "test/assets/v8-integrated-shell-v1.js";
const cssHref = "/test/assets/v8-integrated-shell-v1.css?v=20261022-integrated-1";
const jsSrc = "/test/assets/v8-integrated-shell-v1.js?v=20261022-integrated-1";

for (const file of [htmlPath, cssPath, jsPath]) {
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
        throw new Error(`V8-Testdatei fehlt oder ist leer: ${file}`);
    }
}

let html = fs.readFileSync(htmlPath, "utf8");
const cssTag = `<link rel="stylesheet" id="darV8IntegratedShellCSS" href="${cssHref}">`;
const jsTag = `<script id="darV8IntegratedShellJS" src="${jsSrc}" defer></script>`;
const homeParitySrc = "/test/assets/dar-home-html-parity-v1.js?v=20261023-v60-single-visible-home";
const homeParityTag = `<script defer id="darTestHomeHtmlParityV1" src="${homeParitySrc}"></script>`;
const homeGeometryTag = '<link rel="stylesheet" id="darTestHomeV3ActualRoute" href="/test/assets/dar-home-v3-compact.css?v=20261023-home-geometry-v3">';

html = html.replace(/\s*<link\b[^>]*\bid=["']darV8IntegratedShellCSS["'][^>]*>\s*/gi, "\n");
html = html.replace(/\s*<script\b[^>]*\bid=["']darV8IntegratedShellJS["'][^>]*><\/script>\s*/gi, "\n");

// Apply to the *built static HTML* as well as the Worker-rewritten shell.
// On Cloudflare static-asset HIT the Worker rewrite can be skipped, so a
// script-only update is otherwise invisible on an installed Test PWA.
html = html.replace(/\s*<script\b(?=[^>]*\bid=["']darTestHomeHtmlParityV1["'])[^>]*><\/script>\s*/gi, "\n");
html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*\/dar-home-html-parity-v1\.js[^"']*["'][^>]*><\/script>\s*/gi, "\n");
html = html.replace(/\s*<link\b(?=[^>]*\bid=["']darTestHomeV3ActualRoute["'])[^>]*>\s*/gi, "\n");
const insertion = `\n${cssTag}\n${jsTag}\n${homeGeometryTag}\n${homeParityTag}\n`;
if (html.includes("</head>")) {
    html = html.replace("</head>", `${insertion}</head>`);
} else if (/<head\b[^>]*>/i.test(html)) {
    // The current compact Test shell intentionally has no closing head tag;
    // placing the links directly after <head> is valid HTML and keeps both
    // resources in the document head.
    html = html.replace(/(<head\b[^>]*>)/i, `$1${insertion}`);
} else {
    throw new Error("V8-Test-App-Shell enthält keinen <head>-Bereich");
}
fs.writeFileSync(htmlPath, html);
console.log("V8-Test-Shell aktiviert:", cssHref, jsSrc);
