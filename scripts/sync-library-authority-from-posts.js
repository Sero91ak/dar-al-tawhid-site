#!/usr/bin/env node

/**
 * Scans all production posts and syncs missing books into library-authority.json.
 * Extracts authors from source lines, merges aliases, and keeps verified works public.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_INDEX_PATH = path.join(ROOT, 'content', 'posts', 'posts-index.json');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const AUTHORITY_PATH = path.join(ROOT, 'data', 'library-authority.json');
const SYNC_REPORT_PATH = path.join(ROOT, 'data', 'library-authority-sync-report.json');

const KNOWN_WORK_AUTHORS = {
  'al-adab al-mufrad': 'Muḥammad ibn Ismāʿīl al-Bukhārī',
  'az-zuhd': 'Aḥmad ibn Ḥanbal',
  'az-zuhd li-ahmad': 'Aḥmad ibn Ḥanbal',
  'masail al-imam ahmad riwayat ibnuhu abdullah': 'ʿAbd Allāh ibn Aḥmad ibn Ḥanbal',
  'masail al-imam ahmad riwayat abdullah': 'ʿAbd Allāh ibn Aḥmad ibn Ḥanbal',
  'ar-radd ala az-zanadiqah wa-l-jahmiyyah': 'ʿAbd Allāh ibn Aḥmad ibn Ḥanbal',
  'kitab al-iman': 'Ibn Mandah',
  'gharib al-hadith': 'Abū ʿUbaid al-Qāsim ibn Sallām',
  'gharib al hadith': 'Abū ʿUbaid al-Qāsim ibn Sallām'
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function parseValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseFrontMatter(markdown, filename) {
  const src = String(markdown || '').replace(/^\uFEFF/, '');
  const match = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const yaml = match ? match[1] || '' : '';
  const frontmatter = {};
  for (const line of yaml.split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;
    frontmatter[keyMatch[1]] = parseValue(keyMatch[2]);
  }
  return {
    id: frontmatter.id || filename.replace(/\.md$/i, ''),
    title: frontmatter.title || '',
    book: frontmatter.book || '',
    scholar: frontmatter.scholar || '',
    source: frontmatter.source || '',
    category: frontmatter.category || ''
  };
}

function loadProductionPosts() {
  if (!fs.existsSync(POSTS_INDEX_PATH)) return [];
  const index = readJson(POSTS_INDEX_PATH);
  const posts = [];
  for (const entry of index.files || []) {
    const filePath = path.join(POSTS_DIR, entry.name);
    if (!fs.existsSync(filePath)) continue;
    posts.push(parseFrontMatter(fs.readFileSync(filePath, 'utf8'), entry.name));
  }
  return posts;
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʿʾ'’`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'werk';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanSource(source) {
  return String(source || '')
    .replace(/^[\s📝📖📚✍️]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleOverlap(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  const aParts = na.split(' ').filter((part) => part.length > 2);
  const bParts = new Set(nb.split(' ').filter((part) => part.length > 2));
  if (!aParts.length || !bParts.size) return 0;
  const shared = aParts.filter((part) => bParts.has(part)).length;
  return shared / Math.max(aParts.length, bParts.size);
}

function extractAuthorFromSource(source, bookTitle) {
  const text = cleanSource(source);
  const bookKey = normalize(bookTitle);
  const textKey = normalize(text);
  if (!text) return '';

  if (/^qur\s*an\b/i.test(textKey) || bookKey.startsWith('quran') || /^sura[h]?\s/i.test(bookKey)) {
    return 'Qurʾān';
  }

  if (/\bzu\s+surah\b/i.test(textKey) || /\bsurah\b/.test(bookKey)) {
    const scholars = [];
    if (/\btabari\b/.test(textKey)) scholars.push('Muḥammad ibn Jarīr aṭ-Ṭabarī');
    if (/\bibn kathir\b/.test(textKey)) scholars.push('Ismāʿīl ibn ʿUmar Ibn Kathīr');
    if (/\bshawkani\b/.test(textKey)) scholars.push('Muḥammad ash-Shawkānī');
    if (scholars.length) return scholars.join(' / ');
    return 'Qurʾān';
  }

  const known = KNOWN_WORK_AUTHORS[bookKey];
  if (known) return known;

  const commaParts = text.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const candidate = commaParts[0];
    const remainder = commaParts.slice(1).join(', ');
    if (titleOverlap(remainder, bookTitle) >= 0.35 || titleOverlap(candidate, bookTitle) < 0.35) {
      if (candidate.length >= 3 && candidate.length <= 80 && !/^(band|bd|kitab|bab|abschnitt|teil|s\.|nr\.)/i.test(candidate)) {
        return candidate;
      }
    }
  }

  const riwayahMatch = bookTitle.match(/riwāyat\s+(.+)$/i) || bookTitle.match(/riwayat\s+(.+)$/i);
  if (riwayahMatch) return riwayahMatch[1].trim();

  const vonMatch = text.match(/\bvon\s+([^,;]+)/i);
  if (vonMatch) return vonMatch[1].trim();

  const zitiertMatch = text.match(/zitiert in\s+([^,;]+)/i);
  if (zitiertMatch) return zitiertMatch[1].trim();

  return '';
}

function inferLibraryCategory(bookTitle, postCategory, source) {
  const blob = normalize([bookTitle, postCategory, source].join(' '));
  if (blob.includes('quran') || blob.includes('surah')) return 'Qurʾān';
  if (blob.includes('tafsir') || blob.includes('bayan') && blob.includes('quran')) return 'Tafsīr';
  if (blob.includes('hadith') || blob.includes('sahih') || blob.includes('sunan') || blob.includes('musnad') || blob.includes('musannaf')) return 'Ḥadīṯ';
  if (blob.includes('fatawa') || blob.includes('fatawa')) return 'Fatāwā';
  if (blob.includes('aqidah') || blob.includes('aqida') || blob.includes('sunnah') || blob.includes('itiqad') || blob.includes('iman')) return 'ʿAqīdah und Sunnah';
  if (blob.includes('zuhd') || blob.includes('adab') || blob.includes('akhlaq')) return 'Adab und Tazkiyah';
  if (blob.includes('tabaqat') || blob.includes('tarikh') || blob.includes('siyar') || blob.includes('rijal') || blob.includes('jarh')) return 'Biografien und Tārīkh';
  if (blob.includes('usul') || blob.includes('fiqh') || blob.includes('hukm')) return 'Fiqh und Uṣūl';
  if (blob.includes('tawhid')) return 'Tawḥīd';
  return 'Quellenwerk';
}

function buildAuthorityLookup(works) {
  const lookup = new Map();
  for (const work of works) {
    for (const title of unique([work.title, ...(work.aliases || [])])) {
      const key = normalize(title);
      if (!key) continue;
      if (!lookup.has(key)) lookup.set(key, work);
    }
  }
  return lookup;
}

function resolveExistingWork(bookTitle, lookup) {
  const key = normalize(bookTitle);
  if (!key) return null;
  const exact = lookup.get(key);
  if (exact) return exact;

  let best = null;
  for (const [alias, work] of lookup.entries()) {
    const score = titleOverlap(bookTitle, alias);
    if (score >= 0.72 || key.includes(alias) || alias.includes(key)) {
      if (!best || score > best.score || alias.length > best.alias.length) {
        best = { work, score, alias };
      }
    }
  }
  return best?.work || null;
}

function ensureUniqueId(baseId, usedIds) {
  let id = baseId;
  let counter = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter += 1;
  }
  usedIds.add(id);
  return id;
}

function canonicalTitleFromPosts(bookTitle, samples) {
  const counts = new Map();
  for (const sample of samples) {
    const source = cleanSource(sample.source);
    const commaParts = source.split(',').map((part) => part.trim()).filter(Boolean);
    for (const part of commaParts.slice(0, 3)) {
      if (titleOverlap(part, bookTitle) >= 0.5 && part.length >= bookTitle.length - 4) {
        counts.set(part, (counts.get(part) || 0) + 1);
      }
    }
  }
  if (!counts.size) return bookTitle;
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
}

function main() {
  const posts = loadProductionPosts();
  const authority = readJson(AUTHORITY_PATH);
  const works = Array.isArray(authority.works) ? [...authority.works] : [];
  const lookup = buildAuthorityLookup(works);
  const usedIds = new Set(works.map((work) => work.id));

  const bookSamples = new Map();
  for (const post of posts) {
    const bookTitle = String(post.book || '').trim();
    if (!bookTitle) continue;
    if (!bookSamples.has(bookTitle)) bookSamples.set(bookTitle, []);
    bookSamples.get(bookTitle).push(post);
  }

  const added = [];
  const aliased = [];
  const skipped = [];

  for (const [rawBookTitle, samples] of bookSamples.entries()) {
    const existing = resolveExistingWork(rawBookTitle, lookup);
    if (existing) {
      if (rawBookTitle !== existing.title && !(existing.aliases || []).includes(rawBookTitle)) {
        existing.aliases = unique([...(existing.aliases || []), rawBookTitle]);
        lookup.set(normalize(rawBookTitle), existing);
        aliased.push({ book: rawBookTitle, workId: existing.id });
      }
      continue;
    }

    const authorVotes = new Map();
    const categoryVotes = new Map();
    for (const sample of samples) {
      const author = extractAuthorFromSource(sample.source, rawBookTitle);
      if (author) authorVotes.set(author, (authorVotes.get(author) || 0) + 1);
      const category = inferLibraryCategory(rawBookTitle, sample.category, sample.source);
      categoryVotes.set(category, (categoryVotes.get(category) || 0) + 1);
    }

    const author = [...authorVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const category = [...categoryVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Quellenwerk';

    if (!author) {
      skipped.push({ book: rawBookTitle, postCount: samples.length, reason: 'author-not-found' });
      continue;
    }

    const title = canonicalTitleFromPosts(rawBookTitle, samples);
    const id = ensureUniqueId(slugify(title || rawBookTitle), usedIds);
    const aliases = unique(rawBookTitle !== title ? [rawBookTitle] : []);

    const work = {
      id,
      title,
      aliases,
      author,
      category,
      verified: true,
      autoDiscovered: true
    };

    works.push(work);
    for (const alias of unique([title, ...aliases])) {
      lookup.set(normalize(alias), work);
    }

    added.push({
      id,
      title,
      author,
      category,
      aliases,
      postCount: samples.length
    });
  }

  authority.works = works.sort((a, b) => {
    const category = (a.category || '').localeCompare(b.category || '', 'de');
    if (category) return category;
    return (a.title || '').localeCompare(b.title || '', 'de');
  });

  writeJson(AUTHORITY_PATH, authority);
  writeJson(SYNC_REPORT_PATH, {
    generatedAt: new Date().toISOString(),
    scannedPosts: posts.length,
    uniqueBooksInPosts: bookSamples.size,
    addedWorks: added.length,
    aliasedTitles: aliased.length,
    skippedBooks: skipped.length,
    added,
    aliased,
    skipped
  });

  console.log(`Authority sync: ${added.length} new works, ${aliased.length} aliases, ${skipped.length} skipped.`);
  if (skipped.length) {
    console.log('Skipped (no author):', skipped.map((entry) => entry.book).join(', '));
  }
}

main();
