#!/usr/bin/env node
"use strict";
/* Desktop adapter contract: share editorial tokens, preserve existing website,
 * and never hide reading content before the existing reveal observer runs. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const website=fs.readFileSync("desktop-preview/index.html","utf8");
const shared=fs.readFileSync("assets/dar-adult-editorial-system-v1.css","utf8");
assert.match(website,/<html lang="de" class="dar-adult-editorial-v1">/);
assert.equal(website.split('id="darDesktopEditorialTokensV1"').length-1,1);
assert.match(website,/dar-adult-editorial-system-v1\.css\?v=20261107-editorial-preview-v1/);
assert.match(website,/\.section\{padding:var\(--dar-ed-flow-md,23px\) 0\}/);
assert.match(website,/\.reveal\{opacity:1;transform:none;transition:none\}/);
assert.match(website,/@keyframes dar-ed-desktop-enter/);
assert.doesNotMatch(website,/\.reveal\{opacity:0;/,"No hidden page before JS init");
assert.match(website,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(shared,/--dar-ed-flow-md/);
for(const owner of ["darV8ThemeToggle","darV8PrayerSettings","bookShell","postBrowseHeading","main-nav","site-header"]){
 assert.ok(website.includes(owner),"Unchanged desktop owner: "+owner);
}
assert.doesNotMatch(website,/dar-adult-editorial-system-v1\.js\?v=/,"Desktop already owns its reveal JS; no duplicate controller");
console.log("PASS desktop editorial: shared tokens, no duplicate motion runtime, visible-first content, owner contracts");
