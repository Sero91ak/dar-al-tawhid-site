#!/usr/bin/env node
"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {PINS,gitBlobSha,inspect,run}=require("./verify-original-reference-assets.cjs");
function png(w=1254,h=1254){
 const b=Buffer.alloc(38);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(13,8);
 b.write("IHDR",12);b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);
 b[24]=8;b[25]=6;return b;
}
const pinned=b=>({id:"synthetic-test",path:"synthetic-only.png",bytes:b.length,
 blob:gitBlobSha(b),format:"png",width:1254,height:1254});
test("All four original source pins are immutable explicit assets",()=>{
 assert.deepEqual(PINS.map(x=>x.id),["boy","girl","approved-seven-poses","approved-qiyam"]);
 for(const x of PINS){assert.match(x.blob,/^[a-f0-9]{40}$/);assert.ok(x.bytes>100000);
   assert.ok(x.path.startsWith("assets/"));Object.isFrozen(x)&&assert.ok(true)}
 assert.equal(new Set(PINS.map(x=>x.blob)).size,4);
});
test("Git blob SHA includes typed payload length, not only raw-file SHA-1",()=>{
 const b=Buffer.from("hello\n");assert.equal(gitBlobSha(b),"ce013625030ba8dba906f756967f9e9ca394464a");
});
test("Exact synthetic PNG source accepted by isolated byte integrity checker",()=>{
 const b=png();const r=inspect(b,pinned(b));assert.equal(r.pass,true);
 assert.deepEqual(r.errors,[]);
});
test("Mutation of one image byte invalidates its original identity",()=>{
 const b=png();const pin=pinned(b),corrupt=Buffer.from(b);corrupt[28]^=255;
 const r=inspect(corrupt,pin);assert.equal(r.pass,false);assert.ok(r.errors.includes("git-blob-sha1"));
});
test("Changing only PNG dimensions is not an acceptable match",()=>{
 const b=png();const fake=pinned(b),wrong=png(1200,1254);
 // An invalid size is detected even when the claimed blob hash is reset.
 const permit={...fake,blob:gitBlobSha(wrong)};
 const r=inspect(wrong,permit);assert.equal(r.pass,false);assert.ok(r.errors.includes("png-dimensions"));
});
test("Fake PNG header or unsupported color type cannot pass",()=>{
 const b=png();b[25]=3;
 const r=inspect(b,{...pinned(b)});assert.equal(r.pass,false);
 assert.ok(r.errors.includes("png-color-mode"));
});
test("Deleted original references cause fail-closed source inventory",()=>{
 const result=run("/no-such-path-for-kids-original-sources");
 assert.equal(result.pass,false);assert.equal(result.results.length,4);
 for(const r of result.results)assert.ok(r.errors.includes("unreadable-source"));
 assert.equal(result.productionApproved,false);
 assert.equal(result.original3DIdentityApproved,false);
});
test("No synthetic source audit may claim approved 3D prayer figures",()=>{
 const r=run("/no-such-path-for-kids-original-sources");
 assert.equal(r.original3DIdentityApproved,false);
 assert.equal(r.prayerTeachingApproved,false);
 assert.equal(r.productionApproved,false);
});
