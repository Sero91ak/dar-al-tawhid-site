#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "apple-tv", "hadith");
const outDir = path.join(root, "test", "data", "hadith");
const collectionsDir = path.join(outDir, "collections");

function slugify(value) {
  return String(value || "sammlung")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "sammlung";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadRecords() {
  const catalog = readJson(path.join(srcRoot, "catalog.json"));
  const records = [];
  for (const series of catalog.series || []) {
    const indexPath = path.join(srcRoot, series.indexPath);
    if (!fs.existsSync(indexPath)) continue;
    const index = readJson(indexPath);
    for (const name of index.files || []) {
      const file = path.join(path.dirname(indexPath), name);
      if (!fs.existsSync(file)) continue;
      records.push(readJson(file));
    }
  }
  return records;
}

function stripMd(text) {
  return String(text || "").replace(/\*\*/g, "").trim();
}

function main() {
  fs.mkdirSync(collectionsDir, { recursive: true });
  const records = loadRecords();
  const byBook = new Map();
  for (const rec of records) {
    const title = rec.sourceBook || rec.source || "Ḥadīṯ-Sammlung";
    const id = slugify(title);
    if (!byBook.has(id)) {
      byBook.set(id, {
        id,
        title,
        arabicTitle: rec.sourceBookArabic || "",
        status: "imported",
        importStatusLabel: "Test-Aufbau",
        hadithCount: 0,
        verifiedGermanCount: 0,
        collectionPath: `/test/data/hadith/collections/${id}.json`,
        chapters: new Map()
      });
    }
    const book = byBook.get(id);
    const chapterKey = rec.sourceChapter || rec.categoryLabel || "Allgemein";
    const chapterId = slugify(chapterKey);
    if (!book.chapters.has(chapterId)) {
      book.chapters.set(chapterId, {
        id: chapterId,
        title: chapterKey,
        titleDe: chapterKey,
        titleEn: rec.sourceSection || chapterKey,
        hadiths: []
      });
    }
    const german = stripMd(rec.textMarkdown || rec.sharhText || "");
    const verified = rec.sharhStatus === "verified" || rec.grade === "Ṣaḥīḥ" || rec.grade === "Sahih";
    book.hadiths = book.hadiths || [];
    const hadith = {
      id: rec.id,
      hadithNumber: rec.sourceHadithNumber || rec.id,
      arabic: rec.arabicText || rec.arabic || "",
      german,
      germanStatus: verified ? "verified" : (german ? "review" : "missing"),
      grade: rec.grade || "",
      tags: [rec.categoryLabel, rec.sourceChapter].filter(Boolean),
      chapterTitle: chapterKey,
      chapterId,
      bookTitle: title,
      narratorLine: rec.narratorLine || "",
      speakerLabel: rec.speakerLabel || "",
      source: rec.source || title,
      sharhText: rec.sharhText || "",
      sharhScholar: rec.sharhScholar || "",
      links: []
    };
    book.chapters.get(chapterId).hadiths.push(hadith);
    book.hadithCount += 1;
    if (hadith.germanStatus === "verified") book.verifiedGermanCount += 1;
  }

  const books = [];
  const search = [];
  for (const book of byBook.values()) {
    const collection = {
      id: book.id,
      title: book.title,
      chapters: [...book.chapters.values()]
    };
    fs.writeFileSync(
      path.join(collectionsDir, `${book.id}.json`),
      JSON.stringify(collection, null, 2)
    );
    for (const chapter of collection.chapters) {
      for (const h of chapter.hadiths) {
        search.push({
          id: h.id,
          bookId: book.id,
          bookTitle: book.title,
          chapterTitle: chapter.title,
          hadithNumber: h.hadithNumber,
          tags: h.tags,
          german: h.german,
          arabic: h.arabic,
          grade: h.grade,
          germanStatus: h.germanStatus
        });
      }
    }
    books.push({
      id: book.id,
      title: book.title,
      arabicTitle: book.arabicTitle,
      status: "imported",
      importStatusLabel: "Test-Aufbau",
      hadithCount: book.hadithCount,
      verifiedGermanCount: book.verifiedGermanCount,
      collectionPath: book.collectionPath
    });
  }

  books.sort((a, b) => String(a.title).localeCompare(String(b.title), "de"));
  fs.writeFileSync(path.join(outDir, "books.json"), JSON.stringify(books, null, 2));
  fs.writeFileSync(path.join(outDir, "search-index.json"), JSON.stringify(search, null, 2));
  console.log(`test hadith library: ${books.length} books, ${search.length} hadiths`);
}

main();
