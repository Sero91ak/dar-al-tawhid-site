#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS = fs.readFileSync(path.join(__dirname, 'header-prayer-compact-v367.css'), 'utf8');
const BLOCK = `<style id="header-prayer-compact-v367">\n${CSS}</style>\n\n`;

for (const rel of ['index.html', 'test/index.html']) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  const marker = '<style id="header-prayer-compact-v367">';
  if (html.includes(marker)) {
    const start = html.indexOf(marker);
    const end = html.indexOf('</style>', start) + 8;
    html = html.slice(0, start) + BLOCK.trim() + html.slice(end);
  } else {
    const anchor = '</style>\n\n<style id="quiz-premium-v3">';
    const afterV364 = '<style id="header-prayer-unified-v364">';
    if (html.includes(afterV364)) {
      const v364End = html.indexOf('</style>', html.indexOf(afterV364)) + 8;
      html = html.slice(0, v364End) + '\n\n' + BLOCK.trim() + html.slice(v364End);
    } else if (html.includes(anchor)) {
      html = html.replace(anchor, `</style>\n\n${BLOCK}<style id="quiz-premium-v3">`);
    } else {
      throw new Error(`Anchor not found in ${rel}`);
    }
  }
  fs.writeFileSync(file, html);
  console.log(`Applied header-prayer-compact-v367 to ${rel}`);
}
