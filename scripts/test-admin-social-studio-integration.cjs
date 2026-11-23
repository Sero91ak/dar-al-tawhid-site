#!/usr/bin/env node
"use strict";
/*
 * DAR Admin Social Post Studio integration smoke test.
 * Completely static: no HTTP, deploy, credentials, publishing or pushes.
 * Run: node scripts/test-admin-social-studio-integration.cjs
 */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const source=read("admin/social-review.js");
const css=read("admin/social-review.css");
const nav=read("admin/command-center-v2.js");
const studioCss=read("tools/dar-social-editor-v1/studio.css");
const html=read("admin/index.html");
const studio=read("tools/dar-social-editor-v1/index.html");
const js=read("tools/dar-social-editor-v1/studio.js");
const brand=read("tools/dar-social-editor-v1/brand-data.js");

assert(html.includes("/admin/social-review.js?v=8"),"Editor switcher script version missing");
assert(html.includes("/admin/social-review.css?v=6"),"Editor switcher styles version missing");
assert(css.includes(".dar-studio-switch"),"Missing scoped admin switcher styles");
assert(html.includes("/admin/command-center-v2.js?v=2"),"Admin menu asset version must change");
assert(html.includes('["bildstudio","Bildstudio"]'),"Admin select and saved tab order must include Bildstudio");
assert(html.includes('currentTab==="bildstudio"&&window.DARAdminSocialReview?window.DARAdminSocialReview.renderStudio()'),"Admin tab must render the image editor");
assert(html.includes('if(currentTab==="social"||currentTab==="bildstudio"){stopRefresh();renderShell();return}'),"Direct app load must render both editorial tabs without dashboard request");
assert(html.includes('if(startupTab==="social"||startupTab==="bildstudio")currentTab=startupTab'),"Direct /admin/?tab=bildstudio must be recognized");
assert(nav.includes('"REDAKTION",["quellen","social","bildstudio"'),"Bildstudio missing from primary Admin Redaktion sidebar");
assert(nav.includes('bildstudio:"Bildstudio"'),"Bildstudio sidebar label missing");
assert(studioCss.includes('html[data-dar-admin-theme="salbei"]'),"Studio should adopt Salbei controls without changing canvas");

assert(studio.includes('id="postCanvas"') && studio.includes('id="templateGrid"') && studio.includes('id="exportPng"'),"Studio cannot initialize expected canvas controls");
assert(js.includes("window.DAR_STUDIO_TEST"),"Missing studio ready marker");
assert(brand.includes("DAR_BRAND_DATA"),"Missing embedded original backgrounds");
const mkContext=(search,lang="de")=>{
 const win={};
 const context={window:win,document:{documentElement:{lang}},localStorage:{getItem(){return null},setItem(){}},location:{search},URLSearchParams,console};
 vm.runInNewContext(source,context,{filename:"admin/social-review.js",timeout:1500});
 return win;
};
const normal=mkContext("?tab=social").DARAdminSocialReview.render();
assert(normal.includes('data-dar-studio-mode="redaktion" aria-pressed="true"'),"Default editor should remain original atelier");
assert(normal.includes('src="/admin/redaktion/?v=3"'),"Existing editorial iframe route changed");
const image=mkContext("?tab=social&studio=1").DARAdminSocialReview.render();
assert(image.includes('data-dar-studio-mode="studio" aria-pressed="true"'),"Direct studio link does not select studio");
assert(image.includes('src="/tools/dar-social-editor-v1/index.html?v=1"'),"Social studio iframe route missing");
assert(image.includes('id="darEditorFullscreen"'),"Existing widescreen button missing");
const separate=mkContext("?tab=bildstudio");
const directImage=separate.DARAdminSocialReview.renderStudio();
assert(directImage.includes('src="/tools/dar-social-editor-v1/index.html?v=1"'),"First-class Bildstudio tab does not embed the editor");
const backToEditorial=separate.DARAdminSocialReview.renderEditorial();
assert(backToEditorial.includes('src="/admin/redaktion/?v=3"'),"Editorial tab must stay separate and intact");

for(const locale of ["de","ar","en","tr","ku","ckb","bs","fr","es"]){
 const view=mkContext("?tab=social&studio=1",locale).DARAdminSocialReview.render();
 assert(view.includes("data-dar-studio-mode"),"Locale "+locale+" lost switcher");
}
assert(!source.includes("fetch(DAR_STUDIO_URL"),"No editor uploads or API calls expected from admin switcher");
console.log("PASS: DAR Admin image studio integration, first-class menu, direct link, existing editorial, light/dark palette, i18n controls, locked master assets.");
