#!/usr/bin/env node
/**
 * PRODUCTION_LANE_ISOLATION_GUARD
 * Hard rule: exactly one workflow may publish dar-al-tawhid-site.
 */
const fs=require("fs");
const path=require("path");
const ROOT=path.join(__dirname,"..");
const M="PRODUCTION_LANE_ISOLATION_GUARD";
let failed=0;
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
function check(ok,msg){if(ok)console.log(M+" OK: "+msg);else{failed++;console.error(M+" FAIL: "+msg)}}

const prod=read(".github/workflows/cloudflare-pages-deploy.yml");
const admin=read(".github/workflows/deploy-live-admin-app.yml");
const kids=read(".github/workflows/deploy-kids-live.yml");
const canon=read(".github/workflows/canonical-islamic-content-live.yml");
const quelle=read(".github/workflows/quelle-pages-deploy.yml");
const testLib=read(".github/workflows/deploy-test-library-canonical.yml");
const rootWrangler=read("wrangler.toml");
const testWrangler=read("wrangler.test.toml");

check(prod.includes("PRODUCTION_SINGLE_OWNER_V1"),"central visitor workflow is marked sole production owner");
check(prod.includes("command: deploy")||prod.includes("npx wrangler deploy"),"central visitor workflow retains production publish");
for(const [name,src] of [["admin",admin],["kids",kids],["canonical",canon],["quelle",quelle]]){
  check(!src.includes("wrangler-action@v3")&&!/\bwrangler deploy\b/.test(src),name+" lane cannot publish production worker directly");
}
check(testLib.includes("wrangler deploy -c wrangler.test.toml"),"test-library lane targets isolated test worker");
check(!/command:\s*deploy(?:\s|$)/m.test(testLib),"test-library lane has no implicit root-config deploy");
check(rootWrangler.includes('watch_paths = [".cloudflare-manual-only/**"]'),"Cloudflare visitor repository auto-publish disabled");
check(testWrangler.includes('watch_paths = [".cloudflare-test-manual-only/**"]'),"Cloudflare test repository auto-publish disabled");

if(failed)process.exit(1);
console.log(M+": single-owner production deployment enforced");
