"use strict";
/**
 * Adult visitor UI only: the entire capsule outline must exist before focus
 * and be inside horizontal slider paintports. No global fallback CSS.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const v3 = fs.readFileSync(path.join(root,"assets/dar-home-v31-visitor.css"),"utf8");
const premium = fs.readFileSync(path.join(root,"scripts/home-premium-v380-fragment.css"),"utf8");

const postGroup = v3.match(/html\.dar-home-v3 body\.is-home-route \.dv3-posts\{([^}]*)\}/);
assert(postGroup, "Visitor posts container not found");
for(const declaration of ["overflow:visible", "border:1px solid var(--dv3-line)", "border-image:none", "border-radius:16px"]) {
 assert(postGroup[1].includes(declaration), "V3 resting posts border incomplete: " + declaration);
}
assert(!postGroup[1].includes("overflow:hidden"), "V3 posts container clips its lower rim");
for(const component of [".home-v380-post-preview", ".home-v380-lib-card"]) {
 const lines = premium.split("\n");
 const index = lines.findIndex(line => line.trimStart() === component + "{");
 assert(index>=0, "Premium component missing: " + component);
 const rule = lines.slice(index).join("\n").split("}")[0];
 for(const declaration of ["box-sizing:border-box", "border-image:none", "border-radius:14px"]) {
  assert(rule.includes(declaration), component + " loses part of resting outline: " + declaration);
 }
}
for(const component of [".home-v380-lib-slider", ".home-v380-lib-grid.home-v380-lib-grid--slider"]) {
 const start = premium.indexOf(component+"{");
 assert(start!==-1, "Horizontal library slider missing: " + component);
 const rule = premium.slice(start,premium.indexOf("}",start)+1);
 assert(rule.includes("overflow-x:auto"), "Unexpected library scroll owner: " + component);
 assert(rule.includes("padding-block:2px"), "Lower library card border clips at scrollport: "+component);
}
console.log("PASS: adult visitor Home capsule borders complete without focus or hover.");
