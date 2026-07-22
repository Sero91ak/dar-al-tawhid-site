#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const syncBuildIds = path.join(__dirname, 'sync-app-build-ids.js');
const canonicalLibraryBuilder = path.join(__dirname, 'build-canonical-books-index.js');
const testLibraryPatcher = path.join(__dirname, 'patch-test-canonical-library.js');
const visitorLibraryPublisher = path.join(__dirname, 'publish-visitor-canonical-library.js');

execFileSync(process.execPath, [syncBuildIds], {
  cwd: root,
  stdio: 'inherit'
});

execFileSync(process.execPath, [canonicalLibraryBuilder], {
  cwd: root,
  stdio: 'inherit'
});

execFileSync(process.execPath, [testLibraryPatcher], {
  cwd: root,
  stdio: 'inherit'
});

const coverGenerator = path.join(__dirname, 'generate-qsrc-covers.js');
execFileSync(process.execPath, [coverGenerator], {
  cwd: root,
  stdio: 'inherit'
});

execFileSync(process.execPath, [visitorLibraryPublisher], {
  cwd: root,
  stdio: 'inherit'
});

execFileSync(process.execPath, [syncBuildIds], {
  cwd: root,
  stdio: 'inherit'
});

console.log('CF Pages: kanonischer Bücher-/Autorenindex geprüft und erstellt.');
console.log('CF Pages: Besucher-App mit geprüfter Quellenbibliothek verbunden.');
console.log('CF Pages: statisches Deploy aus Repo-Root (index.html, assets/, content/, data/).');
