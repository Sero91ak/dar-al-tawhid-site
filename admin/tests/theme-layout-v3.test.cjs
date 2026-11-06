#!/usr/bin/env node
"use strict";
/* Admin V3 theme and responsive-source contract; offline, no API or publishing access. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("admin/index.html"),inline=html.slice(html.indexOf("<style>")+7,html.indexOf("</style>"));
const appearance=read("admin/appearance-v2.css"),nav=read("admin/command-center-v2.css"),v3=read("admin/intelligence-v3.css");
const files=["admin/appearance-v2.css","admin/command-center-v2.css","admin/redaktion/appearance.css","admin/library-admin.css","admin/live-edit.css","admin/social-review.css","admin/wissensbereich-push.css"];
const forbidden=/#(?:05080f|09111d|0a111c|101a29|8fc7ff|90c8ff|081522|15283b|0d1f2c|102031|0b1c2a)\b|rgba?\(\s*(?:90\s*,\s*140\s*,\s*220|140\s*,\s*190\s*,\s*255|120\s*,\s*180\s*,\s*220)\b/i;
for(const [p,source] of [["admin/index.html (CSS)",inline],...files.map(p=>[p,read(p)])]){
 assert.doesNotMatch(source,forbidden,p+" retains hardcoded old blue/navy");
}
assert.doesNotMatch(inline,/--(?:blue|green)\s*:/,"Legacy third palette");
const palette={};
for(const id of ["layl","salbei"]){
 const start=appearance.indexOf('html[data-dar-admin-theme="'+id+'"]{'),end=appearance.indexOf("\n}",start);
 assert.ok(start>=0&&end>start,"Missing palette "+id);
 const part=appearance.slice(start,end);
 palette[id]=part;
 for(const name of ["--bg","--ink","--v2ink","--v2gold","--admin-solid-base","--admin-solid-panel","--admin-accent","--admin-panel-background","--admin-input-background","--admin-primary-button","--admin-primary-ink","--admin-success-ink","--admin-error-ink"]){
  assert.ok(part.includes(name+":"),"Missing "+name+" in "+id);
 }
}
assert.equal((appearance.match(/html\[data-dar-admin-theme="(?:layl|salbei)"\]\s*\{/g)||[]).length,2);
const solid=(part,name)=>part.match(new RegExp(name+":(#[a-f0-9]{6})","i"))?.[1];
function linear(x){return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}
function luminance(h){const a=[1,3,5].map(i=>linear(parseInt(h.slice(i,i+2),16)/255));return a[0]*.2126+a[1]*.7152+a[2]*.0722}
function contrast(a,b){const l=luminance(a),r=luminance(b);return (Math.max(l,r)+.05)/(Math.min(l,r)+.05)}
for(const id of ["layl","salbei"]){
 const p=palette[id],ink=solid(p,"--v2ink"),base=solid(p,"--admin-solid-base"),btn=solid(p,"--admin-primary-button"),txt=solid(p,"--admin-primary-ink");
 assert.ok(ink&&base&&btn&&txt,"Missing solid swatches in "+id);
 assert.ok(contrast(ink,base)>=7,"Text contrast insufficient for "+id);
 assert.ok(contrast(txt,btn)>=4.5,"Button contrast insufficient for "+id);
}
assert.match(html,/admin\/intelligence-v3\.js\?v=\d+/);
assert.match(html,/admin\/intelligence-v3\.css\?v=\d+/);
assert.match(html,/class="dar-v3-legacy-tools"/);
assert.match(v3,/has\(> #darV3Dashboard\)/);
assert.match(nav,/@media\(min-width:720px\) and \(max-width:979px\)/);
assert.match(nav,/@media\(max-width:719px\)/);
assert.match(nav,/--v2rail:clamp\(215px,17vw,250px\)/);
assert.match(nav,/@container dar-admin-content \(max-width:540px\)/);
assert.match(v3,/@container \(max-width:540px\)/);
assert.match(v3,/@container \(max-width:850px\)/);
assert.match(v3,/prefers-reduced-motion/);
assert.match(read("admin/command-center-v2.js"),/DARAdminIntelligenceV3\.sync\(getStats\(\)\)/);
assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1/);
assert.match(read("admin/appearance-v2.js"),/#10100f/);
assert.match(read("admin/appearance-v2.js"),/darAdminAppearanceV2/);
console.log("PASS: two admin themes, AA contrast, no old blue, responsive iPad/phone, zoom, V3 integration");
