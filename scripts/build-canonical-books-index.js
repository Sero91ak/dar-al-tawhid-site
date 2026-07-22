#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_PATH = path.join(ROOT, 'posts.json');
const AUTHORITY_PATH = path.join(ROOT, 'data', 'library-authority.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'canonical-books-index.json');
const PUBLIC_BOOKS_PATH = path.join(ROOT, 'data', 'books-library.json');
const PUBLIC_SCHOLARS_PATH = path.join(ROOT, 'data', 'scholars-library.json');
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
}

function buildAuthorityLookup(authority) {
  const lookup = new Map();
  const authorityErrors = [];
  const seenIds = new Set();
  const seenTitles = new Map();

  for (const work of authority.works || []) {
    if (!work || !work.id || !work.title || !work.author || work.verified === false) {
      authorityErrors.push({ work, reason: 'incomplete-or-unverified-authority-entry' });
      continue;
    }
    if (seenIds.has(work.id)) authorityErrors.push({ workId: work.id, reason: 'duplicate-authority-id' });
    seenIds.add(work.id);

    for (const title of [work.title, ...(work.aliases || [])]) {
      const key = normalize(title);
      if (!key) continue;
      if (seenTitles.has(key) && seenTitles.get(key) !== work.id) {
        authorityErrors.push({ normalizedTitle: key, workIds: [seenTitles.get(key), work.id], reason: 'authority-title-collision' });
        continue;
      }
      seenTitles.set(key, work.id);
      lookup.set(key, work);
    }
  }

  return { lookup, authorityErrors };
}

function resolveVerifiedWork(post, lookup) {
  const rawTitle = String(post.book || '').trim();
  const key = normalize(rawTitle);
  if (!key) return { work: null, confidence: 'missing-book' };

  const exact = lookup.get(key);
  if (exact) return { work: exact, confidence: 'verified-registry' };

  let best = null;
  for (const [alias, work] of lookup.entries()) {
    if (key === alias || key.includes(alias) || alias.includes(key)) {
      if (!best || alias.length > best.alias.length) best = { alias, work };
    }
  }
  if (best) return { work: best.work, confidence: 'verified-alias' };

  return { work: null, confidence: 'unverified' };
}

function postFingerprint(post) {
  return [normalize(post.title), normalize(post.book), normalize(post.source), normalize(post.statement)].join('|');
}

function assertPublicOutput(bookList, scholarList) {
  const errors = [];
  const bookIds = new Set();
  const normalizedBookTitles = new Map();
  const scholarIds = new Set();
  const normalizedScholarNames = new Map();

  for (const book of bookList) {
    if (!book.id || !book.title || !book.author || !book.category) errors.push({ type: 'incomplete-public-book', book });
    if (book.verification !== 'verified') errors.push({ type: 'unverified-public-book', bookId: book.id });
    if (/nicht verifiziert|unbekannt|nicht angegeben/i.test(`${book.author} ${book.title}`)) {
      errors.push({ type: 'placeholder-visible-publicly', bookId: book.id });
    }
    if (bookIds.has(book.id)) errors.push({ type: 'duplicate-public-book-id', bookId: book.id });
    bookIds.add(book.id);

    const titleKey = normalize(book.title);
    if (normalizedBookTitles.has(titleKey) && normalizedBookTitles.get(titleKey) !== book.id) {
      errors.push({ type: 'duplicate-public-book-title', title: book.title, bookIds: [normalizedBookTitles.get(titleKey), book.id] });
    }
    normalizedBookTitles.set(titleKey, book.id);
  }

  for (const scholar of scholarList) {
    if (!scholar.id || !scholar.name || scholar.role !== 'quotedScholar') errors.push({ type: 'invalid-public-scholar', scholar });
    if (!scholar.citedWorkIds?.length || scholar.citedWorkIds.some((id) => !bookIds.has(id))) {
      errors.push({ type: 'scholar-linked-to-hidden-work', scholarId: scholar.id });
    }
    if (scholarIds.has(scholar.id)) errors.push({ type: 'duplicate-public-scholar-id', scholarId: scholar.id });
    scholarIds.add(scholar.id);

    const nameKey = normalizePerson(scholar.name);
    if (normalizedScholarNames.has(nameKey) && normalizedScholarNames.get(nameKey) !== scholar.id) {
      errors.push({ type: 'duplicate-public-scholar-name', name: scholar.name, scholarIds: [normalizedScholarNames.get(nameKey), scholar.id] });
    }
    normalizedScholarNames.set(nameKey, scholar.id);
  }

  if (errors.length) {
    const error = new Error(`Strict library validation failed with ${errors.length} public metadata error(s).`);
    error.validationErrors = errors;
    throw error;
  }
}

function main() {
  const posts = readJson(POSTS_PATH);
  const authority = readJson(AUTHORITY_PATH);
  const { lookup, authorityErrors } = buildAuthorityLookup(authority);

  if (authorityErrors.length) {
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), authorityErrors }, null, 2)}\n`);
    throw new Error(`Authority registry contains ${authorityErrors.length} invalid or colliding entry/entries.`);
  }

  const books = new Map();
  const scholars = new Map();
  const seenIds = new Set();
  const seenFingerprints = new Map();
  const duplicateIds = [];
  const duplicateContent = [];
  const quarantinedWorks = [];
  const suspiciousRoleCollisions = [];
  const acceptedPostIds = new Set();

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
        duplicateContent.push({ keptId: seenFingerprints.get(fingerprint), duplicateId: id, title: post.title || '', book: post.book || '' });
        continue;
      }
      seenFingerprints.set(fingerprint, id);
    }

    const resolved = resolveVerifiedWork(post, lookup);
    if (!resolved.work) {
      quarantinedWorks.push({
        postId: id,
        title: post.title || '',
        rawBook: post.book || '',
        scholar: post.scholar || '',
        source: post.source || '',
        reason: resolved.confidence,
        publicVisibility: 'hidden'
      });
      continue;
    }

    const work = resolved.work;
    const quotedScholar = String(post.scholar || '').trim();
    const actualAuthor = String(work.author || '').trim();

    if (quotedScholar && normalizePerson(quotedScholar) === normalizePerson(actualAuthor)) {
      const source = normalize(post.source);
      if (!source.includes(normalizePerson(actualAuthor))) {
        suspiciousRoleCollisions.push({ postId: id, scholar: quotedScholar, book: work.title, author: actualAuthor });
      }
    }

    acceptedPostIds.add(id);

    if (!books.has(work.id)) {
      books.set(work.id, {
        id: work.id,
        title: work.title,
        author: actualAuthor,
        category: work.category || 'Nicht eingeordnet',
        aliases: work.aliases || [],
        verification: 'verified',
        postIds: [],
        quotedScholars: []
      });
    }

    const book = books.get(work.id);
    book.postIds.push(id);
    if (quotedScholar) book.quotedScholars.push(quotedScholar);

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
      scholar.citedWorkIds.push(work.id);
    }
  }

  const bookList = [...books.values()]
    .map((book) => ({
      ...book,
      postIds: uniqueSorted(book.postIds),
      quotedScholars: uniqueSorted(book.quotedScholars),
      postCount: new Set(book.postIds).size
    }))
    .filter((book) => book.postCount > 0 && book.verification === 'verified')
    .sort((a, b) => a.category.localeCompare(b.category, 'de') || a.author.localeCompare(b.author, 'de') || a.title.localeCompare(b.title, 'de'));

  const visibleBookIds = new Set(bookList.map((book) => book.id));
  const scholarList = [...scholars.values()]
    .map((scholar) => ({
      ...scholar,
      postIds: uniqueSorted(scholar.postIds.filter((id) => acceptedPostIds.has(id))),
      citedWorkIds: uniqueSorted(scholar.citedWorkIds.filter((id) => visibleBookIds.has(id)))
    }))
    .filter((scholar) => scholar.postIds.length > 0 && scholar.citedWorkIds.length > 0)
    .map((scholar) => ({ ...scholar, postCount: scholar.postIds.length }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  assertPublicOutput(bookList, scholarList);

  const generatedAt = new Date().toISOString();
  const publicPolicy = {
    verifiedOnly: true,
    hideUnverifiedWorks: true,
    hideUnverifiedAuthors: true,
    neverInferAuthorFromScholar: true,
    deduplicateBooksByCanonicalId: true,
    deduplicateScholarsByNormalizedName: true,
    failBuildOnPublicMetadataError: true
  };

  const output = {
    version: 3,
    generatedAt,
    policy: publicPolicy,
    stats: {
      sourcePosts: Array.isArray(posts) ? posts.length : 0,
      publicCanonicalBooks: bookList.length,
      publicQuotedScholars: scholarList.length,
      duplicateIdsRemoved: duplicateIds.length,
      duplicateContentRemoved: duplicateContent.length,
      quarantinedPosts: quarantinedWorks.length
    },
    categories: uniqueSorted(bookList.map((book) => book.category)),
    books: bookList,
    scholars: scholarList
  };

  const publicBooks = { version: output.version, generatedAt, policy: publicPolicy, categories: output.categories, books: bookList };
  const publicScholars = { version: output.version, generatedAt, policy: publicPolicy, scholars: scholarList };
  const report = {
    generatedAt,
    publicOutputIsVerifiedOnly: true,
    rules: [
      'A quoted scholar is never inferred as the author of a cited work.',
      'Only works present in the authority registry with a verified author are public.',
      'Unknown, ambiguous or incomplete works are quarantined and excluded from every public list.',
      'Books are merged by canonical work id.',
      'Scholars are merged by normalized person name.',
      'Duplicate ids and identical content are excluded before grouping.',
      'The public interface must read data/books-library.json and data/scholars-library.json only.',
      'The deployment build fails if unverified, duplicated or incomplete metadata reaches public output.'
    ],
    authorityErrors,
    duplicateIds,
    duplicateContent,
    quarantinedWorks,
    suspiciousRoleCollisions
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(PUBLIC_BOOKS_PATH, `${JSON.stringify(publicBooks, null, 2)}\n`);
  fs.writeFileSync(PUBLIC_SCHOLARS_PATH, `${JSON.stringify(publicScholars, null, 2)}\n`);
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Public verified library built: ${bookList.length} books, ${scholarList.length} quoted scholars.`);
  console.log(`Removed duplicates: ${duplicateIds.length + duplicateContent.length}; quarantined: ${quarantinedWorks.length}.`);
}

try {
  main();
} catch (error) {
  if (error.validationErrors) {
    console.error(JSON.stringify({ validationErrors: error.validationErrors }, null, 2));
  }
  console.error(error.stack || error.message || error);
  process.exit(1);
}
