#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const path="content/posts/2026-10-08-miraj-ruyah-ikhtilaf-kein-pauschaler-takfir-slides.md";
const text=fs.readFileSync(path,"utf8"),q=fs.readFileSync("q/36/index.html","utf8");
const match=text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
assert.ok(match,"Q36 requires YAML frontmatter and complete body");
const yaml=match[1],body=match[2],sourceLinks=[...q.matchAll(/href="([^"]+)"[^>]*>/g)]
  .map(m=>m[1].replace(/&amp;/g,"&")).filter(u=>u.includes("#:~:text="));
const slideBlocks=yaml.split(/(?=^  - title:)/m).filter(x=>x.startsWith("  - title:"));
assert.equal(slideBlocks.length,8,"Expected 8 cards from sourced Q36");
assert.equal((yaml.match(/^    source:/gm)||[]).length,8,"Every slide must have its own source");
assert.equal((yaml.match(/^    links:/gm)||[]).length,8,"Every slide must have its own links");
assert.equal((yaml.match(/^source:/gm)||[]).length,1,"Only one global source");
assert.doesNotMatch(yaml,/^(?:scholar|author):/m,"Do not conflate different cited speakers");
for(const [i,slide] of slideBlocks.entries()){
  assert.ok(slide.includes('url: "/q/36/"'),"Q36 library missing at "+(i+1));
  assert.ok(slide.includes("→ Originaltext direkt markieren"),"Direct primary source missing at "+(i+1));
  assert.ok(sourceLinks.some(link=>slide.includes(link)),"Slide "+(i+1)+" direct source not registered in Q36");
}
const markers=[...body.matchAll(/<!-- slide: (\d+) -->/g)].map(m=>+m[1]);
assert.deepEqual(markers,[1,2,3,4,5,6,7,8],"Slides not sequential");
assert.doesNotMatch(text,/#DarAlTawhid|📥 Telegram|🌐 Website|📸 Instagram/,"Visitor post must not contain social extras");
const parser=fs.readFileSync("assets/slide-post-parser.js","utf8");
const sandbox={window:{},global:{}};sandbox.global=sandbox.window;
vm.runInNewContext(parser,sandbox);
const parsed=sandbox.window.DARSlidePostParser.analyzeSlideMarkdown(text);
assert.equal(parsed.slideCount,8,"Slide parser must retain eight slides");
assert.equal(parsed.errors.length,0,"Slide parser errors: "+parsed.errors.join("; "));
const worker=fs.readFileSync("cloudflare/worker.js","utf8");
const start=worker.indexOf("function repairYamlFrontmatter(markdown)");
const end=worker.indexOf("\nfunction normalizeMarkdownForStorage",start);
assert.ok(start>=0&&end>start,"Publisher YAML normalization absent");
const normalize=vm.runInNewContext("("+worker.slice(start,end)+")",{});
const output=normalize(text);
assert.equal((output.match(/^    source:/gm)||[]).length,8,"Publisher broke nested sources");
assert.equal((output.match(/^    links:/gm)||[]).length,8,"Publisher broke nested links");
assert.equal(normalize(output),output,"Repeated normalization must not destroy slides");
console.log("Q36 slide-source guard PASS: 8 slides, original highlighted citations, Q36 library, publisher-safe YAML, no push");
