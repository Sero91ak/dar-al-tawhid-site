#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const canonicalLibraryBuilder = path.join(__dirname, 'build-canonical-books-index.js');
const testLibraryPatcher = path.join(__dirname, 'patch-test-canonical-library.js');

execFileSync(process.execPath, [canonicalLibraryBuilder], {
  cwd: root,
  stdio: 'inherit'
});

execFileSync(process.execPath, [testLibraryPatcher], {
  cwd: root,
  stdio: 'inherit'
});

console.log('CF Pages: kanonischer Bücher-/Autorenindex geprüft und erstellt.');
console.log('CF Pages: Test-App mit geprüfter Quellenbibliothek verbunden.');
console.log('CF Pages: statisches Deploy aus Repo-Root (index.html, assets/, content/, data/).');
