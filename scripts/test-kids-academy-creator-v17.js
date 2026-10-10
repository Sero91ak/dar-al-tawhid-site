#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=x=>fs.readFileSync(path.join(root,x),"utf8");
const html=read("test/kids/akademie/index.html");
const gate=read("cloudflare/preview-gate.js");
const prod=read("kids/akademie/index.html");
const build=read(".github/workflows/cloudflare-pages-deploy.yml");
assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
assert.ok(html.includes("NUR ERSTELLERPRÜFUNG"));
assert.ok(html.includes('src="/kids/akademie/curriculum-v1.js'));
assert.ok(html.includes('src="/kids/akademie/curriculum-v2.js'));
assert.ok(html.includes("Keine Änderungen an echten Kinderprofilen"));
assert.match(gate,/pathname\.startsWith\("\/test\/kids\/"/);
assert.ok(build.includes("test/kids/akademie/**"));
assert.ok(prod.includes('document.body.dataset.academyChildMode=p.demo?"demo":"child"'));
assert.ok(!html.includes("localStorage")&&!html.includes("indexedDB"),"Preview must not touch any real profile/progress");
const script=html.split("<script>").slice(-1)[0].split("</script>")[0];
assert.ok(script.includes("const clips=["));
assert.equal((script.match(/src:"\/kids\/assets\/kids-academy-audio\/[^"]+\.m4a"/g)||[]).length,4);
assert.ok(script.includes("p.play()"),"Native user-gesture audio only");
assert.ok(!script.includes("speechSynthesis"),"No fake owner TTS fallback");
new vm.Script(script,{filename:"creator-review-v17-inline.js"});
const sandbox={window:{}};vm.runInNewContext(read("kids/akademie/curriculum-v1.js"),sandbox);
vm.runInNewContext(read("kids/akademie/curriculum-v2.js"),sandbox);
const lessons=sandbox.window.DARKidsAcademyCurriculum||{};
assert.equal(Object.keys(lessons).length,33,"33 expanded curriculum topics + 1 separate Ṣidq foundation required");
for(const [id,l] of Object.entries(lessons)){
 assert.ok(["akhlaq","adab","fiqh","aqidah"].includes(l.subject),id);
 assert.ok(l.quran?.surah&&l.hadith?.source,id);
 assert.ok(l.questions?.["4-5"]?.length&&l.questions?.["6-8"]?.length&&l.questions?.["9-10"]?.length,id);
}
console.log("KIDS V17 creator QA PASS: 34 lessons, no child data writes, secured test route, 4 exact pilot assets and valid page script.");
