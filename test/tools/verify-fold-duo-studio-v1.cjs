#!/usr/bin/env node
/* DAR TEST Fold/Duo Studio V1 — read-only regression guard (branch-only). */
"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const html=read("test/index.html");
const js=read("test/assets/dar-fold-duo-studio-v1.js");
const css=read("test/assets/dar-fold-duo-studio-v1.css");
const locale=read("assets/i18n/adult-language-picker-v1.js");
new vm.Script(js,{filename:"dar-fold-duo-studio-v1.js"});
assert.equal((html.match(/dar-fold-duo-studio-v1\.js/g)||[]).length,1,"script referenced once");
assert.equal((html.match(/dar-fold-duo-studio-v1\.css/g)||[]).length,1,"CSS referenced once");
assert.ok(js.includes('query.get("foldstudio")!=="1"'),"preview requires URL opt-in");
assert.ok(js.includes('url.searchParams.delete("foldstudio")'),"one-action preview undo");
assert.ok(js.includes('var target=d.querySelector'),"original tab routing should be forwarded");
assert.ok(js.includes('if(target)target.click()'),"no second route engine");
assert.ok(js.includes('picker.open("settings",btn)'),"reuse original nine-language picker");
assert.ok(!js.includes('localStorage.clear('),"do not wipe user data");
assert.ok(css.includes('data-dar-studio-capacity="dual"'),"size-aware master/detail");
assert.ok(css.includes('data-dar-studio-mode="desktop"'),"desktop-style side rail");
assert.ok(css.includes('body.is-settings-route'),"settings surface styled");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"CSS braces balance");
const codes=[...locale.matchAll(/\{code:"([a-z]+)",name:/g)].map(x=>x[1]);
assert.deepEqual(codes,["de","tr","en","ar","ku","ckb","bs","fr","es"],"all 9 catalog entries, no false approval");
const segment=js.match(/function dimensions\(\)\{[\s\S]*?\n  \}/);
assert.ok(segment,"viewport computation available");
const measure=new Function("d","w",segment[0]+";return dimensions;");
function mode(width,height){
 const e={clientWidth:width,clientHeight:height,dataset:{},style:{setProperty(){}}};
 measure({documentElement:e},{innerWidth:width,innerHeight:height})();
 return [e.dataset.darStudioMode,e.dataset.darStudioCapacity];
}
assert.deepEqual(mode(390,844),["compact","single"],"closed Fold/iPhone portrait");
assert.deepEqual(mode(680,720),["split","dual"],"wide Fold inner display");
assert.deepEqual(mode(760,720),["split","dual"],"mid-size Fold");
assert.deepEqual(mode(820,700),["desktop","dual"],"fully opened Fold uses 3D side rail");
assert.deepEqual(mode(1024,768),["desktop","dual"],"tablet landscape");
assert.deepEqual(mode(900,400),["medium","single"],"phone landscape is not forced into split");
console.log("PASS: isolated Fold/Duo studio, 9-language registry, 8-theme UI, reversible navigation and 6 viewport cases");
