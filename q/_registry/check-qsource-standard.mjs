#!/usr/bin/env node
/**
 * Q_SOURCE_PUBLICATION_GATE_V2
 * All legacy Q pages: never allow dead/missing original-source links.
 * New Q pages (Q43+): exact marked original evidence and stable metadata.
 * Source authenticity is an editorial task; this validates structure and URLs,
 * not factual correctness or successful rendering on an actual device.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const qRoot = path.join(root, 'q');
const minStrict = 43;
const fail = [];
const warn = [];
const attr = (tag, key) => {
  const match = new RegExp('\\b' + key + '\\s*=\\s*(["\\x27])([\\s\\S]*?)\\1', 'i').exec(tag);
  return match ? match[2].trim() : '';
};
const hasClass = (html, token) => {
  const re = /<(?:div|section|nav|main)\b[^>]*class\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    if (m[2].split(/\s+/).includes(token)) return true;
  }
  return false;
};
const permittedHosts = new Set([
  'islamweb.net','shamela.ws','dorar.net','al-maktaba.org',
  'ketabonline.com','archive.org','waqfeya.net','app.turath.io'
]);
function permitted(host) {
  return [...permittedHosts].some(x => host === x || host.endsWith('.' + x));
}
const files = (await fs.readdir(qRoot, { withFileTypes:true }))
  .filter(x => x.isDirectory() && /^[1-9]\d*$/.test(x.name))
  .map(x => Number(x.name)).sort((a,b) => a-b);
const register = JSON.parse(await fs.readFile(path.join(qRoot, '_registry/shortlinks.json'), 'utf8'));
const entries = Array.isArray(register.links) ? register.links : [];
const seen = new Set();
for (const entry of entries) {
  const n = Number(entry.number);
  if (!Number.isInteger(n) || n < 1 || seen.has(n)) fail.push('Register: ungültige oder doppelte Q-Nummer ' + entry.number);
  seen.add(n);
  if (entry.status === 'active' && !files.includes(n)) fail.push('Register: aktive Q' + n + ' ohne HTML-Datei');
  if (entry.status === 'active' && (entry.shortPath !== '/q/' + n + '/' || entry.targetPath !== '/q/' + n + '/'))
    fail.push('Register: Q' + n + ' hat einen ungültigen kanonischen Pfad');
}
const max = files.length ? files[files.length-1] : 0;
if (register.nextNumber !== max+1) fail.push('Register: nextNumber ist nicht ' + (max+1));
for (const n of files) {
  const p = path.join(qRoot, String(n), 'index.html');
  let html;
  try { html = await fs.readFile(p,'utf8'); }
  catch { fail.push('Q' + n + ': index.html fehlt'); continue; }
  const label = 'Q' + n + ': ';
  if (!seen.has(n)) fail.push(label + 'keine Registry-Zuordnung');
  if (!/<body\b[^>]*class\s*=\s*(["'])[^"']*\bqsource-body\b[^"']*\1/i.test(html) ||
      !hasClass(html, 'qsource-page') || !hasClass(html, 'qsource-links'))
    fail.push(label + 'Quellenkarten-HTML oder Quellenbereich fehlt');
  if (!hasClass(html, 'qsource-social')) fail.push(label + 'Social-Leiste fehlt');
  const sourcePos = html.search(/class\s*=\s*(["'])[^"']*\bqsource-links\b/);
  const socialPos = html.search(/class\s*=\s*(["'])[^"']*\bqsource-social\b/);
  if (sourcePos >= 0 && socialPos < sourcePos) fail.push(label + 'Social-Leiste muss nach Nachweisen stehen');
  if (/qsource-link-list/.test(html)) fail.push(label + 'veraltete Listenstruktur');
  const anchorTags = [...html.matchAll(/<a\b[^>]*>/gi)].map(x => x[0]);
  const sourceTags = anchorTags.filter(tag => attr(tag,'class').split(/\s+/).includes('qsource-link'));
  if (!sourceTags.length) fail.push(label + 'keine anklickbaren Nachweiskarten');
  let realEvidence = 0;
  let hasMarkedEvidence = false;
  for (const tag of sourceTags) {
    const classes = attr(tag,'class').split(/\s+/);
    const href = attr(tag,'href');
    if (!classes.some(x => ['web','pdf','scan'].includes(x)))
      fail.push(label + 'Nachweislink ohne web/pdf/scan-Klasse');
    if (!href || href === '#' || /^#|^(?:javascript|data|file):/i.test(href)) {
      fail.push(label + 'leerer, blockierter oder Platzhalter-Nachweislink');
      continue;
    }
    let url;
    try { url = new URL(href, 'https://dar-al-tawhid.de/'); }
    catch { fail.push(label + 'ungültige Nachweisadresse'); continue; }
    if (!['http:','https:'].includes(url.protocol)) {
      fail.push(label + 'unerlaubtes Linkprotokoll'); continue;
    }
    if (url.hostname === 'dar-al-tawhid.de' || url.hostname === 'www.dar-al-tawhid.de') {
      if (/^\/q\/[1-9]\d*\/?$/.test(url.pathname)) continue; // Self fallback, not evidence.
      fail.push(label + 'Nachweiskarte zeigt nur auf eine interne Nicht-Beleg-Seite');
      continue;
    }
    realEvidence++;
    if (href.includes('#:~:text=') || /#page=[1-9]\d*/i.test(href)) hasMarkedEvidence = true;
    if (n >= minStrict && !permitted(url.hostname))
      fail.push(label + 'neue externe Nachweisdomain nicht freigegeben: ' + url.hostname);
  }
  if (!realEvidence) fail.push(label + 'kein echter externer Originalnachweis');
  if (!hasMarkedEvidence) {
    if (n >= minStrict) fail.push(label + 'neuer Quellenbeleg ohne markierten Originaltext oder geprüfte PDF-Seite');
    else warn.push(label + 'historische Nachweise ohne Text-/PDF-Seitenmarkierung – redaktionell nacharbeiten');
  }
  if (n >= minStrict) {
    if (!html.includes('https://dar-al-tawhid.de/q/' + n + '/'))
      fail.push(label + 'kanonischer Kurzlink fehlt');
    if (!/property=["']og:image["']/.test(html) || !/name=["']twitter:image["']/.test(html))
      fail.push(label + 'öffentliche OpenGraph-/Twitter-Bildmetadaten fehlen');
    if (!/dir=["']rtl["']/.test(html) || !/lang=["']ar["']/.test(html))
      fail.push(label + 'arabischer Originaltext muss kenntlich sein');
    if (/Ein PDF-\/Scan-Seitenanker wird erst ergänzt|keine Freigabe für Besucher|interne Prüfnotiz/i.test(html))
      fail.push(label + 'interne Arbeitsnotiz öffentlich sichtbar');
  }
}
for (const x of warn) console.warn('WARN ' + x);
for (const x of fail) console.error('FEHLER ' + x);
if (fail.length) {
  console.error('Q-Quellenkarten-Freigabe gesperrt: ' + fail.length + ' Fehler.');
  process.exit(1);
}
console.log('Q-Quellenkarten-Gate OK: ' + files.length + ' aktive Bestandskarten, alle Nachweiskarten funktional adressiert; zukünftige Q ab 43 strikt geprüft.');
