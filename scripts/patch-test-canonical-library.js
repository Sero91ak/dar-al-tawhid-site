#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEST_INDEX = path.join(ROOT, 'test', 'index.html');
const SERVICE_WORKER = path.join(ROOT, 'service-worker.js');
const SOURCE_SRC = '/test/assets/library/canonical-source-library.js';
const LEGACY_ADDON_SRC = '/test/assets/library/canonical-library-addon.js';

function patchTestIndex() {
  let html = fs.readFileSync(TEST_INDEX, 'utf8');
  if (html.includes(SOURCE_SRC)) {
    if (html.includes(LEGACY_ADDON_SRC)) {
      html = html.replace(`<script src="${LEGACY_ADDON_SRC}"></script>\n`, '');
      fs.writeFileSync(TEST_INDEX, html);
    }
    return;
  }

  const patterns = [
    new RegExp(`<script[^>]+src=["']${LEGACY_ADDON_SRC.replace(/\//g, '\\/')}[^"']*["'][^>]*><\\/script>`, 'i'),
    /(<script[^>]+src=["'][^"']*assets\/library\/library-app\.js[^"']*["'][^>]*><\/script>)/i,
    /(<script[^>]+src=["']\/test\/assets\/library\/library-app\.js[^"']*["'][^>]*><\/script>)/i
  ];

  let patched = false;
  for (const pattern of patterns) {
    if (!pattern.test(html)) continue;
    html = html.replace(pattern, (match) => {
      if (match.includes('canonical-library-addon') || match.includes('canonical-source-library')) {
        return `<script src="${SOURCE_SRC}?v=1"></script>`;
      }
      return `${match}\n<script src="${SOURCE_SRC}?v=1"></script>`;
    });
    patched = true;
    break;
  }

  if (!patched) {
    const closingBody = /<\/body>/i;
    if (!closingBody.test(html)) {
      throw new Error('Test index has no </body> and library-app.js script could not be located.');
    }
    html = html.replace(closingBody, `<script src="${SOURCE_SRC}?v=1"></script>\n</body>`);
  }

  fs.writeFileSync(TEST_INDEX, html);
}

function bumpTestCache() {
  if (!fs.existsSync(SERVICE_WORKER)) return;
  let sw = fs.readFileSync(SERVICE_WORKER, 'utf8');
  const next = "const CACHE_VERSION = 'dar-al-tawhid-offline-light-v357-header-prayer-mobile-v363';";
  const pattern = /const CACHE_VERSION = ['"]dar-al-tawhid-offline-light-[^'"]+['"];?/;
  if (!pattern.test(sw)) throw new Error('Service worker cache version declaration not found.');
  sw = sw.replace(pattern, next);

  const required = [
    "  '/data/books-library.json',",
    "  '/data/scholars-library.json',",
    `  '${SOURCE_SRC}',`
  ];
  const anchor = "  '/data/offline-content-manifest.json',";
  if (!sw.includes(anchor)) throw new Error('Service worker APP_SHELL anchor not found.');
  let block = sw;
  if (block.includes(LEGACY_ADDON_SRC)) {
    block = block.replace(`  '${LEGACY_ADDON_SRC}',\n`, '');
  }
  const missing = required.filter((entry) => !block.includes(entry.split('?')[0]));
  if (missing.length) block = block.replace(anchor, `${anchor}\n${missing.join('\n')}`);
  fs.writeFileSync(SERVICE_WORKER, block);
}

patchTestIndex();
bumpTestCache();
console.log('Test-App: geprüfte Quellenbibliothek eingebunden und Cache aktualisiert.');
