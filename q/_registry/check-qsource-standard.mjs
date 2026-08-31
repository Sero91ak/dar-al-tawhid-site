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

async function main() {
  const entries = await fs.readdir(Q_ROOT, { withFileTypes: true });
  const numbered = entries
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const failures = [];

  for (const entry of numbered) {
    const file = path.join(Q_ROOT, entry.name, 'index.html');
    if (!(await exists(file))) {
      failures.push(`q/${entry.name}/index.html fehlt`);
      continue;
    }

    const html = await fs.readFile(file, 'utf8');
    const hasCardLinks = html.includes('class="qsource-links"') || html.includes("class='qsource-links'");
    const hasSocial = html.includes('class="qsource-social"') || html.includes("class='qsource-social'");
    const hasOldList = html.includes('qsource-link-list');
    const hasNumberedFallback = html.includes(`href="/q/${entry.name}/"`) || html.includes(`href='/q/${entry.name}/'`);

    if (!hasCardLinks) failures.push(`q/${entry.name}: qsource-links fehlen`);
    if (!hasSocial) failures.push(`q/${entry.name}: qsource-social fehlt`);
    if (hasOldList) failures.push(`q/${entry.name}: alte qsource-link-list gefunden`);
    if (!hasNumberedFallback) failures.push(`q/${entry.name}: interner Fallback /q/${entry.name}/ fehlt`);
  }

  if (failures.length) {
    console.error('Q-Quellenlink-Standard nicht erfüllt:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`OK: ${numbered.length} nummerierte Q-Quellenseiten erfüllen den Standard.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
