#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const Q_ROOT = path.join(ROOT, 'q');

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function hasEither(html, doubleQuotedClass, singleQuotedClass) {
  return html.includes(doubleQuotedClass) || html.includes(singleQuotedClass);
}

async function main() {
  const entries = await fs.readdir(Q_ROOT, { withFileTypes: true });
  const numbered = entries
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const failures = [];
  const warnings = [];

  for (const entry of numbered) {
    const file = path.join(Q_ROOT, entry.name, 'index.html');
    if (!(await exists(file))) {
      failures.push(`q/${entry.name}/index.html fehlt`);
      continue;
    }

    const html = await fs.readFile(file, 'utf8');
    const hasCardContainer = hasEither(html, 'class="qsource-links"', "class='qsource-links'");
    const hasLinkCard = html.includes('qsource-link web') || html.includes('qsource-link pdf') || html.includes('qsource-link scan');
    const hasSocial = hasEither(html, 'class="qsource-social"', "class='qsource-social'");
    const hasOldList = html.includes('qsource-link-list');
    const lastLinksIndex = Math.max(html.lastIndexOf('class="qsource-links"'), html.lastIndexOf("class='qsource-links'"));
    const socialIndex = Math.max(html.lastIndexOf('class="qsource-social"'), html.lastIndexOf("class='qsource-social'"));
    const hasTextFragmentOrPdfAnchor = html.includes('#:~:text=') || html.includes('#page=');
    const hasFallback = html.includes(`href="/q/${entry.name}/"`) || html.includes(`href='/q/${entry.name}/'`);

    if (!hasCardContainer) failures.push(`q/${entry.name}: qsource-links-Kartenbereich fehlt`);
    if (!hasLinkCard) failures.push(`q/${entry.name}: keine qsource-link-Karten gefunden`);
    if (!hasSocial) failures.push(`q/${entry.name}: qsource-social Social-Leiste fehlt`);
    if (hasSocial && lastLinksIndex !== -1 && socialIndex < lastLinksIndex) failures.push(`q/${entry.name}: qsource-social steht nicht nach den Quellenkarten`);
    if (hasOldList) failures.push(`q/${entry.name}: alte qsource-link-list gefunden`);

    if (!hasTextFragmentOrPdfAnchor) warnings.push(`q/${entry.name}: kein Textfragment oder PDF-Seitenanker gefunden`);
    if (!hasFallback) warnings.push(`q/${entry.name}: kein interner Fallback /q/${entry.name}/ gefunden`);
  }

  if (warnings.length) {
    console.warn('Q-Quellenlink-Standard Hinweise:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (failures.length) {
    console.error('Q-Quellenlink-Standard nicht erfüllt:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`OK: ${numbered.length} nummerierte Q-Quellenseiten erfüllen den Pflichtstandard.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
