#!/usr/bin/env node
"use strict";
// Q35 slide regression: parse source, preserve user text, prevent Slide 1 von 1.
// Does not publish, update the index or send a notification.
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const postPath="content/posts/2026-10-08-isa-ibn-maryam-nuzul-frueher-ikhtilaf-slides.md";
const post=fs.readFileSync(postPath,"utf8");
const worker=fs.readFileSync("cloudflare/worker.js","utf8");
const parser=fs.readFileSync("assets/slide-post-parser.js","utf8");
const marker=post.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
assert.ok(marker,"Q35 frontmatter missing");
const yaml=marker[1],body=marker[2];
const titles=[...yaml.matchAll(/^  - title:\s*(.+)$/gm)].map(m=>m[1]);
assert.equal(titles.length,20,"Q35 must have 20 independent slide cards");
assert.equal((yaml.match(/^    source:/gm)||[]).length,20,"Every slide needs a properly nested source");
assert.equal((yaml.match(/^    links:/gm)||[]).length,20,"Every slide needs nested source links");
assert.equal((yaml.match(/^        url: "\/q\/35\/"$/gm)||[]).length,20,"Every slide must link Q35");
assert.equal((yaml.match(/^source:/gm)||[]).length,1,"Only global source may be at root");
assert.equal((yaml.match(/^links:/gm)||[]).length,1,"Only global links may be at root");
assert.doesNotMatch(yaml,/^(?:scholar|author):/m,"Do not attribute mixed Quran/hadith/athar material to one speaker");
assert.doesNotMatch(post,/#DarAlTawhid|📥 Telegram|🌐 Website|📸 Instagram/,"No social extras in visitor post");
const numbers=[...body.matchAll(/<!-- slide: (\d+) -->/g)].map(m=>Number(m[1]));
assert.deepEqual(numbers,Array.from({length:20},(_,i)=>i+1),"Slide body numbers must be sequential");
for(const term of ["4:157–158","39:42","6:60","ʿAlī ibn Abī Ṭalḥah","Maṭar al-Warrāq","Ibn Zayd","Al-Ḥasan al-Baṣrī","Ṣaḥīḥ Muslim, Nr. 156","Ṣaḥīḥ Muslim, Nr. 2937","Ibn Baṭṭah","Abū ʿAmr ad-Dānī","Fazit"]){
  assert.ok(post.includes(term),"User-supplied section missing: "+term);
}
const sandbox={window:{},global:{}};
sandbox.global=sandbox.window;
vm.runInNewContext(parser,sandbox,{timeout:2000});
const result=sandbox.window.DARSlidePostParser.analyzeSlideMarkdown(post);
assert.equal(result.slideCount,20,"Public slide parser lost slides");
assert.equal(result.errors.length,0,"Slide parser errors: "+result.errors.join(", "));

// One slide can carry exactly two SHORT statements, but both attributions and
// the common verified source must remain together; longer statements stay alone.
const blocks=yaml.split(/(?=^  - title:)/m).filter(x=>x.startsWith("  - title:"));
const pairOne=blocks.find(x=>x.includes('Maṭar al-Warrāq und al-Ḥasan'));
const pairTwo=blocks.find(x=>x.includes('Qatādah und Muǧāhid'));
assert.ok(pairOne&&pairOne.includes('🖋️ Maṭar al-Warrāq')&&pairOne.includes('🖋️ Al-Ḥasan al-Baṣrī'),"Both mutawaffīka statements must retain speakers");
assert.ok(pairTwo&&pairTwo.includes('🖋️ Qatādah')&&pairTwo.includes('🖋️ Muǧāhid'),"Both az-Zuḫruf 43:61 statements must retain speakers");
for(const b of [pairOne,pairTwo]){
  assert.equal((b.match(/^    source:/gm)||[]).length,1,"Grouped statements must have matching single source");
  assert.match(b,/^        url: "\/q\/35\/"$/m,"Grouped slide must link original source");
}
const css=fs.readFileSync('assets/adaptive-layout.css','utf8');
const js=fs.readFileSync('assets/adaptive-layout.js','utf8');
assert.match(css,/\.post-slides \.post-slide-track\s*\{\s*align-items:flex-start/,"Track must not stretch short slides");
assert.match(css,/grid-auto-rows:max-content/,"Slide rows must retain natural height");
assert.match(js,/__DAR_SLIDE_CONTENT_HEIGHT_V1/,"Active slide must control carousel height");
assert.match(js,/var height = Math\.ceil\(Math\.max\(activeSlide\.scrollHeight, activeSlide\.offsetHeight\)\)/,"Height must be measured from active slide only");

const start=worker.indexOf("function repairYamlFrontmatter(markdown)");
const end=worker.indexOf("\nfunction normalizeMarkdownForStorage(markdown)",start);
assert.ok(start>=0&&end>start,"Publisher YAML normalizer not found");
const repair=vm.runInNewContext("("+worker.slice(start,end)+")",{}, {timeout:2000});
const normalized=repair(post);
assert.equal((normalized.match(/^    source:/gm)||[]).length,20,"Publisher must retain nested slide sources");
assert.equal((normalized.match(/^    links:/gm)||[]).length,20,"Publisher must retain nested slide links");
assert.equal((normalized.match(/^  - title:/gm)||[]).length,20,"Publisher must retain all slide entries");
const again=repair(normalized);
assert.equal(again,normalized,"Publisher YAML repair must be idempotent");
console.log("Q35 compact slides PASS: 20 slides; two short source-matched double statements; natural viewport height; no push.");
