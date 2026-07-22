#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'posts.json');
const AUTHORITY_PATH = path.join(ROOT, 'data', 'library-authority.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'canonical-books-index.json');
const REPORT_PATH = path.join(ROOT, 'data', 'library-metadata-report.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function normalizePerson(value) {
  return normalize(value)
    .replace(/\b(imam|shaykh|scheich|hafiz|al hafiz)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAuthorityLookup(authority) {
  const lookup = new Map();
  for (const work of authority.works || []) {
    const titles = [work.title, ...(work.aliases || [])];
    for (const title of titles) {
      const key = normalize(title);
      if (key) lookup.set(key, work);
    }
  }
  return lookup;
}

function sourceAuthor(post) {
  const source = String(post.source || '');
  const match = source.match(/^📝\s*([^,;]+),\s*/u);
  return match ? match[1].trim() : '';
}

function resolveWork(post, lookup) {
  const rawTitle = String(post.book || '').trim();
  const key = normalize(rawTitle);
  const exact = lookup.get(key);
  if (exact) return { work: exact, confidence: 'verified-registry' };

  let best = null;
  for (const [alias, work] of lookup.entries()) {
    if (!alias || !key) continue;
    if (key === alias || key.includes(alias) || alias.includes(key)) {
      if (!best || alias.length > best.alias.length) best = { alias, work };
    }
  }
  if (best) return { work: best.work, confidence: 'verified-alias' };

  const explicitAuthor = String(post.author || '').trim();
  const parsedSourceAuthor = sourceAuthor(post);
  const safeAuthor = explicitAuthor || parsedSourceAuthor;
  return {
    work: {
      id: `unverified-${key || 'unknown'}`,
      title: rawTitle || 'Werk nicht angegeben',
      aliases: [],
      author: safeAuthor || 'Autor nicht verifiziert',
      category: String(post.category || 'Nicht eingeordnet')
    },
    confidence: explicitAuthor ? 'explicit-post-author' : parsedSourceAuthor ? 'source-prefix-review-required' : 'unverified'
  };
}

function postFingerprint(post) {
  return [
    normalize(post.title),
    normalize(post.book),
    normalize(post.source),
    normalize(post.statement)
  ].join('|');
}

function main() {
  const posts = readJson(POSTS_PATH);
  const authority = readJson(AUTHORITY_PATH);
  const lookup = buildAuthorityLookup(authority);

  const books = new Map();
  const scholars = new Map();
  const seenIds = new Set();
  const seenFingerprints = new Map();
  const duplicateIds = [];
  const duplicateContent = [];
  const unverifiedWorks = [];
  const suspiciousRoleCollisions = [];

  for (const post of Array.isArray(posts) ? posts : []) {
    const id = String(post.id || '').trim();
    if (id && seenIds.has(id)) {
      duplicateIds.push({ id, title: post.title || '', book: post.book || '' });
      continue;
    }
    if (id) seenIds.add(id);

    const fingerprint = postFingerprint(post);
    if (fingerprint.replace(/\|/g, '')) {
      if (seenFingerprints.has(fingerprint)) {
        duplicateContent.push({
          keptId: seenFingerprints.get(fingerprint),
          duplicateId: id,
          title: post.title || '',
          book: post.book || ''
        });
        continue;
      }
      seenFingerprints.set(fingerprint, id);
    }

    const resolved = resolveWork(post, lookup);
    const work = resolved.work;
    const quotedScholar = String(post.scholar || '').trim();
    const actualAuthor = String(work.author || 'Autor nicht verifiziert').trim();

    if (resolved.confidence === 'unverified' || resolved.confidence === 'source-prefix-review-required') {
      unverifiedWorks.push({
        postId: id,
        title: post.title || '',
        rawBook: post.book || '',
        candidateAuthor: actualAuthor,
        confidence: resolved.confidence
      });
    }

    if (quotedScholar && actualAuthor && actualAuthor !== 'Autor nicht verifiziert' && normalizePerson(quotedScholar) === normalizePerson(actualAuthor)) {
      const source = normalize(post.source);
      if (!source.includes(normalizePerson(actualAuthor))) {
        suspiciousRoleCollisions.push({ postId: id, scholar: quotedScholar, book: work.title, author: actualAuthor });
      }
    }

    const bookId = work.id;
    if (!books.has(bookId)) {
      books.set(bookId, {
        id: bookId,
        title: work.title,
        author: actualAuthor,
        category: work.category || 'Nicht eingeordnet',
        aliases: work.aliases || [],
        verification: resolved.confidence.startsWith('verified') ? 'verified' : 'review-required',
        postIds: [],
        quotedScholars: []
      });
    }

    const book = books.get(bookId);
    book.postIds.push(id);
    if (quotedScholar && !book.quotedScholars.includes(quotedScholar)) book.quotedScholars.push(quotedScholar);

    if (quotedScholar) {
      const scholarKey = normalizePerson(quotedScholar) || quotedScholar;
      if (!scholars.has(scholarKey)) {
        scholars.set(scholarKey, {
          id: scholarKey.replace(/\s+/g, '-'),
          name: quotedScholar,
          role: 'quotedScholar',
          postIds: [],
          citedWorkIds: []
        });
      }
      const scholar = scholars.get(scholarKey);
      scholar.postIds.push(id);
      if (!scholar.citedWorkIds.includes(bookId)) scholar.citedWorkIds.push(bookId);
    }
  }

  const bookList = [...books.values()]
    .map((book) => ({
      ...book,
      postIds: [...new Set(book.postIds)],
      quotedScholars: [...new Set(book.quotedScholars)].sort((a, b) => a.localeCompare(b, 'de')),
      postCount: new Set(book.postIds).size
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'de') || a.author.localeCompare(b.author, 'de') || a.title.localeCompare(b.title, 'de'));

  const scholarList = [...scholars.values()]
    .map((scholar) => ({
      ...scholar,
      postIds: [...new Set(scholar.postIds)],
      citedWorkIds: [...new Set(scholar.citedWorkIds)],
      postCount: new Set(scholar.postIds).size
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy: authority.policy,
    stats: {
      sourcePosts: Array.isArray(posts) ? posts.length : 0,
      canonicalBooks: bookList.length,
      quotedScholars: scholarList.length,
      duplicateIdsRemoved: duplicateIds.length,
      duplicateContentRemoved: duplicateContent.length,
      unverifiedWorks: unverifiedWorks.length
    },
    categories: [...new Set(bookList.map((book) => book.category))].sort((a, b) => a.localeCompare(b, 'de')),
    books: bookList,
    scholars: scholarList
  };

  const report = {
    generatedAt: output.generatedAt,
    rules: [
      'scholar is always a quoted person, never an inferred book author',
      'author comes only from the authority registry or an explicit author field',
      'same work is merged by canonical work id',
      'duplicate ids and identical content are excluded',
      'unverified authors are not presented as verified authors'
    ],
    duplicateIds,
    duplicateContent,
    unverifiedWorks,
    suspiciousRoleCollisions
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Canonical library index built: ${bookList.length} books, ${scholarList.length} quoted scholars.`);
  console.log(`Duplicates removed: ${duplicateIds.length + duplicateContent.length}; unverified works: ${unverifiedWorks.length}.`);
}

main();
