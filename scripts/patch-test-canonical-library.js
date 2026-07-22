#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEST_INDEX = path.join(ROOT, 'test', 'index.html');
const SERVICE_WORKER = path.join(ROOT, 'service-worker.js');
const ADDON_SRC = '/test/assets/library/canonical-library-addon.js';

function patchTestIndex() {
  let html = fs.readFileSync(TEST_INDEX, 'utf8');
  if (html.includes(ADDON_SRC)) return;

  const patterns = [
    /(<script[^>]+src=["'][^"']*assets\/library\/library-app\.js[^"']*["'][^>]*><\/script>)/i,
    /(<script[^>]+src=["']\/test\/assets\/library\/library-app\.js[^"']*["'][^>]*><\/script>)/i
  ];

  let patched = false;
  for (const pattern of patterns) {
    if (!pattern.test(html)) continue;
    html = html.replace(pattern, `$1\n<script src="${ADDON_SRC}"></script>`);
    patched = true;
    break;
  }

  if (!patched) {
    const closingBody = /<\/body>/i;
    if (!closingBody.test(html)) {
      throw new Error('Test index has no </body> and library-app.js script could not be located.');
    }
    html = html.replace(closingBody, `<script src="${ADDON_SRC}"></script>\n</body>`);
  }

  fs.writeFileSync(TEST_INDEX, html);
}

function bumpTestCache() {
  if (!fs.existsSync(SERVICE_WORKER)) return;
  let sw = fs.readFileSync(SERVICE_WORKER, 'utf8');
  const next = "const CACHE_VERSION = 'dar-al-tawhid-offline-light-v301-test-canonical';";
  const pattern = /const CACHE_VERSION = ['"]dar-al-tawhid-offline-light-[^'"]+['"];?/;
  if (!pattern.test(sw)) throw new Error('Service worker cache version declaration not found.');
  sw = sw.replace(pattern, next);

  const required = [
    "  '/data/books-library.json',",
    "  '/data/scholars-library.json',",
    "  '/test/assets/library/canonical-library-addon.js',"
  ];
  const anchor = "  '/data/offline-content-manifest.json',";
  if (!sw.includes(anchor)) throw new Error('Service worker APP_SHELL anchor not found.');
  const missing = required.filter((entry) => !sw.includes(entry));
  if (missing.length) sw = sw.replace(anchor, `${anchor}\n${missing.join('\n')}`);
  fs.writeFileSync(SERVICE_WORKER, sw);
}

patchTestIndex();
bumpTestCache();
console.log('Test-App: geprüfte Quellenbibliothek eingebunden und Cache aktualisiert.');
