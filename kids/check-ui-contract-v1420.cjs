#!/usr/bin/env node
"use strict";
// V1421 supersedes the V1420 five-tab expectation. Kept at old path for CI.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("kids/index.html"),css=read("kids/kids-ui-contract-v1420.css"),navCss=read("kids/kids-nav-v1421.css");
const dua=read("kids/dua-hub-v1219.js"),academy=read("kids/akademie/index.html"),sw=read("kids/sw.js");
const salaf=read("kids/salaf-library-v1.js"),v=JSON.parse(read("kids/version.json"));
for(const shell of ["kids/start.html","kids/shell.html"])
  assert.equal(html,read(shell),"All published Kids shells must remain byte-identical");
const nav=html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0];
assert.ok(nav,"Bottom navigation missing");
assert.equal((nav.match(/class="nav-btn/g)||[]).length,5,"Exactly five tabs");
const marks=['data-target="today"','data-target="stories"','class="nav-btn kids-academy-tab"','data-target="dua"','data-target="parents"'];
let pos=-1;
for(const mark of marks){const n=nav.indexOf(mark);assert.ok(n>pos,"Wrong nav order: "+mark);pos=n;}
assert.ok(nav.includes('data-academy-open="1"')&&html.includes("/kids/kids-academy-portal-v1421.js?v=1421"),"Lernen must open same-app Academy without a full page reload");
assert.ok(!nav.includes('href="/kids/akademie/index.html"'),"Navigation must not trigger a full page reload");
assert.ok(html.includes('kids-academy-girl-seam-v1421.css?v=1421'),"Account modal gender correction must load");
const portalJs=read("kids/kids-academy-portal-v1421.js");
const portalCss=read("kids/kids-academy-girl-seam-v1421.css");
assert.ok(portalJs.includes('frame.src="/kids/akademie/index.html?kidsPortal=1"'),"Academy must be embedded in the existing app");
assert.ok(portalJs.includes('DAR_KIDS_ACADEMY_PAUSE_V1421')&&portalJs.includes('DAR_KIDS_ACADEMY_CLOSE_V1421'),"Portal must handle child app exit and pause");
assert.ok(academy.includes("KIDS_SEAMLESS_PORTAL_V1421")&&academy.includes("returnToKids();"),"Academy back button must close portal");
assert.ok(academy.includes('$("#academyNavHome").onclick=()=>returnToKids(true)'),"Academy house must return to Heute without page reload");
assert.ok(portalJs.includes('event.data.goHome===true')&&portalJs.includes('today.click()'),"House must navigate Home tab without hard reload");
assert.ok(html.includes('join.dataset.gender=')&&html.includes('name==="login"?"none"'),"Login must track gender and hide duplicate cancel");
assert.ok(portalCss.includes('#kidsJoin[data-gender="girl"]')&&!portalCss.includes('.app[data-gender="boy"]'),"Girl login must have a separate profile-scoped palette");
assert.ok(sw.includes('/kids/kids-academy-portal-v1421.js?v=1421')&&sw.includes('/kids/kids-academy-girl-seam-v1421.css?v=1421'),"New navigation and girls CSS must be offline cached");
assert.ok(!nav.includes('data-target="salaf"')&&!nav.includes('data-target="quran"'),"No stale or retired tab");
assert.ok(dua.includes('const order = [today, stories, learn, dua, parents]'),"Stale iOS nav healing must exist");
assert.ok(dua.includes("event.stopImmediatePropagation()"),"Old tab handlers must not hijack Duʿāʾ");
assert.ok(dua.includes("function enhanceHeaderProfile()")&&dua.includes("function enhanceProfileCard()"),"Child avatars preserved");
assert.ok(dua.includes('!q("#view-today")')&&dua.includes('!q("#view-parents")'),"Profile init valid");
assert.ok(!dua.includes('!q("#view-quran")'),"Removed Quran UI must not block profiles");
assert.ok(html.includes('const KIDS_QURAN_LEARNING_REMOVED=true'),"Alif-Bāʾ retirement preserved");
assert.ok(!html.includes('<section id="view-quran"'),"Removed Quran lesson must remain retired");
assert.ok(html.includes('/kids/kids-ui-contract-v1420.css?v=1421')&&html.includes('/kids/kids-nav-v1421.css?v=1421'),"New versioned CSS missing");
assert.ok(academy.includes('kids-ui-contract-v1420.css'),"Shared Academy geometry preserved");
assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"),"Hörwelten three wide cards missing");
assert.ok(navCss.includes("learning-book-premium-v1421.svg"),"Lernen icon missing");
assert.ok(read("kids/assets/kids-icons/learning-book-premium-v1421.svg").includes("<svg"),"Study book SVG missing");
assert.ok(navCss.includes("dua-real-v12.png"),"Duʿāʾ icon missing");
assert.ok(html.includes("kids-salaf-listening-hero")&&html.includes('data-go="salaf"'),"Salaf must be in Hören");
for(const k of ["salaf-cinema-hero-boy-v1353.jpg","salaf-cinema-hero-girl-v1353.jpg"])
 assert.ok(navCss.includes(k),"Gendered Salaf hero missing "+k);
for(const k of ["kids-academy-hero-boys-v1.jpg","kids-academy-hero-girls-v1.jpg"])
 assert.ok(css.includes(k),"Academy hero missing "+k);
assert.ok(salaf.includes('salaf-story-nav kids-detail-appbar'),"Shared reader header must remain");
assert.ok(html.includes('if(name==="dua"&&window.DARKidsDuaHub'),"Duʿāʾ tab must open real hub");
assert.equal(v.buildId,"kids-shell-v1421-learn-center-dua-fourth-salaf-in-hoeren");
assert.ok(sw.includes('dar-al-tawhid-kids-v1422')&&sw.includes('kids-nav-v1421.css?v=1421'),"PWA cache must be updated");
assert.ok(sw.includes('kids-shell-v1421-learn-center-dua-fourth-salaf-in-hoeren'),"SW build ID must match");

const navigation=read("kids/navigation-v1182.js"),motion=read("kids/kids-motion-v1422.css");
assert.ok(html.includes('/kids/navigation-v1182.js?v=1422'),"Visitor must load low-jank navigation");
assert.ok(html.includes('/kids/kids-motion-v1422.css?v=1422'),"Visitor must load light transition CSS");
assert.ok(sw.includes('/kids/navigation-v1182.js?v=1422')&&sw.includes('/kids/kids-motion-v1422.css?v=1422'),"iOS PWA must cache smooth navigation files");
assert.ok(navigation.includes("if(after===before)return;"),"Do not scroll-reset a second time after a tab tap");
assert.ok(!navigation.includes("requestAnimationFrame(restartHomeMotion);"),"Home logo must not replay on every return");
assert.ok(!navigation.includes("if(!surfaceIds().length&&active)resetMainTop();"),"pageshow must not reset scroll for browser back");
assert.ok(motion.includes("prefers-reduced-motion:reduce"),"Respect device reduced-motion setting");
assert.ok(motion.includes("190ms"),"Short GPU opacity entrance duration required");

console.log("PASS Kids V1421: 5 official tabs, Duʿāʾ fourth, learning center, Salaf Hören, gender heroes, restored avatars, Quran retirement");
