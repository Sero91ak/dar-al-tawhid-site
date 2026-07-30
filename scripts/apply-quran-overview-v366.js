#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEST = path.join(ROOT, 'test', 'index.html');
const STYLES = path.join(__dirname, 'quran-overview-v366-styles.css');
const RENDER = path.join(__dirname, 'quran-overview-v366-render.js');

let html = fs.readFileSync(TEST, 'utf8');
const css = fs.readFileSync(STYLES, 'utf8');
const renderJs = fs.readFileSync(RENDER, 'utf8');

const cssStart = html.indexOf('/* QURAN_OVERVIEW_V366:');
const cssEnd = html.indexOf('</style>', cssStart);
if (cssStart < 0 || cssEnd < 0) throw new Error('QURAN overview CSS block not found');
html = html.slice(0, cssStart) + css + '\n' + html.slice(cssEnd);

const blockStart = html.indexOf('function quranSurahCard(s)');
const blockEnd = html.indexOf('function renderQuranDisplaySheet()');
if (blockStart < 0 || blockEnd < 0) throw new Error('JS block boundaries not found');
html = html.slice(0, blockStart) + renderJs.trim() + '\n' + html.slice(blockEnd);

// Remove duplicate bindQuranOverviewUi / renderQuran if still present before bindQuranQuickPick
html = html.replace(/\nfunction bindQuranOverviewUi\(\)\{[\s\S]*?\n\}\nfunction quranSurahContextMenu/g, '\nfunction quranSurahContextMenu');
html = html.replace(/\nfunction renderQuran\(\)\{quranOverviewFilter=getQuranOverviewFilter\(\);quranOverviewSort=getQuranOverviewSort\(\);applyQuranLineSpacing\(getQuranLineSpacing\(\)\);if\(!quranMeta\)return `<div class="qov-page"><div class="qov-skeleton"><\/div><div class="loading">Qurʾān wird geladen…<\/div><\/div>`;const total=quranMeta\.surahs\.reduce\([\s\S]*?<\/div>`\}\nfunction /, '\nfunction ');

if (!html.includes('bindQuranOverviewUi();')) {
  html = html.replace(
    'bindQuranQuickPick();\n  bindQuranTransliterationPick();',
    'bindQuranQuickPick();\n  bindQuranOverviewUi();\n  bindQuranTransliterationPick();'
  );
}

if (!html.includes('is-quran-overview')) {
  html = html.replace(
    'document.body.classList.toggle("is-hadith-route",route.view==="hadith");',
    'document.body.classList.toggle("is-hadith-route",route.view==="hadith");\n  document.body.classList.toggle("is-quran-overview",route.view==="quran");'
  );
}

// Mark version in comment
html = html.replace('/* QURAN_OVERVIEW_V366:', '/* QURAN_OVERVIEW_V366:');

fs.writeFileSync(TEST, html);
console.log('Applied quran-overview-v366 to test/index.html');
