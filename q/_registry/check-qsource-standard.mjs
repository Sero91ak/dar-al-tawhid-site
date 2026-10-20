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
const minCompleteNavigation = 46; // Q46 and newer require real four-icon social links and a working, related learning module.
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
  if (entry.status === 'active') {
    const canonical = '/q/' + n + '/';
    if (entry.shortPath !== canonical) {
      fail.push('Register: Q' + n + ' hat einen ungültigen kanonischen Kurzpfad');
    }
    if (entry.targetPath !== canonical) {
      // Q1–7 precede the new canonical /q/N/ scheme. Their existing /quelle/
      // pages remain usable legacy navigation targets, not primary evidence.
      const legacy = n <= 7 && /^\/quelle\/[a-z0-9-]+\/$/.test(entry.targetPath || '');
      const local = legacy ? path.join(root, entry.targetPath.slice(1), 'index.html') : '';
      if (!legacy || !(await fs.stat(local).catch(() => null))?.isFile()) {
        fail.push('Register: Q' + n + ' hat einen ungültigen kanonischen Pfad');
      }
    }
  }
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
      if (/^\/q\/[1-9]\d*\/?$/.test(url.pathname)) continue; // Self fallback, never original evidence.
      // Historical source cards may also offer an OWN, separately labelled
      // internal reader page. Verify it exists, but NEVER count it as an
      // external scholarly original. New Q43+ remain strictly external.
      const legacy = n < minStrict && /^\/quelle\/[a-z0-9-]+\/$/.test(url.pathname);
      if (legacy) {
        const file = path.join(root, url.pathname.slice(1), 'index.html');
        if ((await fs.stat(file).catch(() => null))?.isFile()) continue;
      }
      // Two Q8 original manuscript scans are served as LOCAL image assets.
      // Permit verified image files only for PDF/Scan cards; still require
      // at least one distinct, external original source for the Q page.
      const scan = n < minStrict && classes.some(x => ['scan', 'pdf'].includes(x)) &&
        /^\/assets\/sources\/[a-zA-Z0-9_./%-]+\.(?:pdf|jpe?g|png|webp)$/i.test(url.pathname);
      if (scan) {
        const asset = path.resolve(root, '.' + url.pathname);
        if (asset.startsWith(root + path.sep) && (await fs.stat(asset).catch(() => null))?.isFile()) continue;
      }
      fail.push(label + 'Nachweiskarte zeigt nur auf eine interne Nicht-Beleg-Seite');
      continue;
    }
    realEvidence++;
    if (href.includes('#:~:text=') || /#page=[1-9]\d*/i.test(href)) hasMarkedEvidence = true;
    if (n >= minStrict && !permitted(url.hostname))
      fail.push(label + 'neue externe Nachweisdomain nicht freigegeben: ' + url.hostname);
  }
  // SOURCE_CARD_FOOTER_AND_LEARNING_GATE_V1
  // Checking only the nav container used to pass pages with a single homepage
  // link; verify every required icon destination instead.
  if (n >= minCompleteNavigation) {
    const nav = /<nav\b[^>]*class\s*=\s*(["'])[^"']*\bqsource-social\b[^"']*\1[^>]*>([\s\S]*?)<\/nav>/i.exec(html);
    const social = nav ? [...nav[2].matchAll(/<a\b[^>]*>/gi)].map(x => x[0]) : [];
    const requiredSocial = {
      telegram: 'https://t.me/dar_al_tauhid',
      instagram: 'https://www.instagram.com/dar_at_tawhid/',
      whatsapp: 'https://whatsapp.com/channel/0029VbBK0YaDp2Q8A0kW1F3g',
      web: '/'
    };
    for (const [cls, expected] of Object.entries(requiredSocial)) {
      const found = social.find(tag => attr(tag, 'class').split(/\s+/).includes(cls));
      if (!found) {
        fail.push(label + 'Social-Icon fehlt: ' + cls);
      } else if (attr(found, 'href') !== expected) {
        fail.push(label + 'Social-Icon mit falscher Adresse: ' + cls);
      } else if (!attr(found, 'aria-label')) {
        fail.push(label + 'Social-Icon ohne barrierefreie Beschriftung: ' + cls);
      }
    }
    const learning = anchorTags.find(tag => attr(tag, 'class').split(/\s+/).includes('qsource-learning'));
    if (!learning) {
      fail.push(label + 'zugehöriger Lernbereich-Link (.qsource-learning) fehlt');
    } else {
      const href = attr(learning, 'href');
      if (!/^\/lernen\/[a-z0-9-]+\/$/.test(href)) {
        fail.push(label + 'Lernbereich-Link muss auf /lernen/<slug>/ zeigen');
      } else {
        const lessonFile = path.join(root, href.slice(1), 'index.html');
        const exists = (await fs.stat(lessonFile).catch(() => null))?.isFile();
        if (!exists) fail.push(label + 'verlinkte Lernseite fehlt: ' + href);
        else {
          const lessonHtml = await fs.readFile(lessonFile, 'utf8');
          if (n < 47 && !lessonHtml.includes('/q/' + n + '/'))
            fail.push(label + 'verlinkter Lernbereich enthält keinen Rücklink zu Q' + n);
          if (!/<body\b[^>]*class\s*=\s*(["'])[^"']*\bheritage-learning\b[^"']*\1/i.test(lessonHtml))
            fail.push(label + 'Lernbereich verwendet nicht die gemeinsame Learning-Heritage-Vorlage');
          // QUIZ_SOURCE_SEPARATION_GATE_20261020: Q47+ quiz pages are quiz only.
          // Source excerpts, commentary and external evidence belong on /q/N/.
          if (n >= 47) {
            const quizSourceLinks = [...lessonHtml.matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1/gi)]
              .filter(match => /^\/q\/[1-9]\d*\/?(?:[?#].*)?$/.test(match[2]));
            if (quizSourceLinks.length)
              fail.push(label + 'Quizseite enthält verbotene Quellenlinks');
            if (/Was wird hier erläutert\?/.test(lessonHtml))
              fail.push(label + 'Quizseite enthält verbotenen Erklärungskasten');
            if (!/<(?:section|main)\b[^>]*id\s*=\s*(["'])[^"']*quiz[^"']*\1/i.test(lessonHtml))
              fail.push(label + 'Lernbereich enthält keinen Quizabschnitt');
          }
        }
        if (!attr(learning, 'aria-label')) fail.push(label + 'Lernbereich-Link ohne Beschriftung');
      }
      const lessonPos = html.indexOf(learning);
      if (socialPos >= 0 && lessonPos > socialPos)
        fail.push(label + 'Lernbereich gehört vor die Social-Icon-Leiste');
      if (sourcePos >= 0 && lessonPos < sourcePos)
        fail.push(label + 'Lernbereich gehört nach den Originalnachweisen');
    }
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
