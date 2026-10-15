#!/usr/bin/env node
"use strict";
/* KIDS TEST-only gender parity guard. No public or other views modified. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
const raw=read("kids/design-v2-profile-parity-v1.css");
const css=raw.replace(/\/\*[\s\S]*?\*\//g,"");
const prophet=read("kids/prophet-stories.js");
const salaf=read("kids/salaf-library-v1.js");
assert.equal(shells[0],shells[1],"KIDS test index/start mismatch");
assert.equal(shells[1],shells[2],"KIDS test start/shell mismatch");
assert.equal((shells[0].match(/\/kids\/design-v2-profile-parity-v1\.css\?v=/g)||[]).length,1,"Girls palette CSS exactly once");
assert.ok(shells[0].includes("/kids/prophet-stories.js?v=20261015-gender1"),"Fresh Prophet runtime missing");
assert.ok(shells[0].includes('url("/kids/assets/kids-salah-v1272/hero-home.png?v=1274")'),"Protected Home art not found");
assert.ok(shells[0].includes("/kids/test-console/return-to-studio.js"),"TEST button bridge missing");
assert.ok(shells[0].includes("/kids/design-v2-salaf-pilot.css"),"Salaf V2 baseline missing");
assert.ok(shells[0].includes("/kids/design-v2-prophets-pilot.css"),"Prophet V2 baseline missing");
assert.ok(css.includes('#view-salaf.view.active[data-profile="girl"]'),"Girls Salaf surface not selected");
assert.ok(css.includes('--salaf-shell-surface:#2b2035!important'),"Girls shell fix missing");
assert.ok(css.includes('#psLibraryPage.ps-library-page[data-profile="girl"]'),"Girls Prophet library not selected");
assert.ok(css.includes('#psModal.ps-modal[data-profile="girl"]'),"Girls Prophet detail not selected");
assert.ok(css.includes("background:#2b2035!important"),"Girl surface not explicitly pink/plum");
assert.ok((css.match(/\{/g)||[]).length===(css.match(/\}/g)||[]).length,"Palette CSS braces mismatch");
for(const invalid of ["#view-today","#kidsSalahDailyPage",".bottom-nav","#darKidsCreatorBack",".ps-row-scene",".salaf-topic-image",".ps-library-scroll","serviceWorker","@import"])
 assert.ok(!css.includes(invalid),"Unexpected CSS change to protected feature: "+invalid);
assert.ok(prophet.includes("function syncProphetVisualProfile()"),"Prophet explicit gender sync missing");
assert.ok(prophet.includes('surface.dataset.profile=profile'),"Prophet overlay marker missing");
assert.ok(prophet.includes('function openLibrary(){\n  const page=$("#psLibraryPage");if(!page)return;\n  syncProphetVisualProfile();'),"Prophet open must refresh profile");
assert.ok(prophet.includes('function openStory(id){\n  active=items.find(x=>x.id===id);if(!active)return;\n  syncProphetVisualProfile();'),"Prophet story must refresh profile");
assert.ok(prophet.includes('const MODE_KEY="kids.contentMode.v19"'),"Existing audio/reading mode cannot change");
assert.ok(salaf.includes("root.dataset.profile=gender();"),"Existing Salaf gender sync cannot change");
assert.equal(JSON.parse(read("kids/data/prophet-stories.json")).items.length,25,"Prophet story count changed");
console.log("KIDS_V2_GENDER_PARITY_PASS | girls Salaf + Prophet overlays | 25 stories | Home + nav protected");
