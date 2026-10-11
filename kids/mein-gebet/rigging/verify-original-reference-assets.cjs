#!/usr/bin/env node
"use strict";
/*
 * Fail-closed byte integrity check for the four ORIGINAL user-approved 2D
 * references. Byte identity of source artwork is NOT evidence that a 3D model
 * resembles it, nor permission to animate, teach, merge or release.
 */
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const PINS=Object.freeze([
 Object.freeze({id:"boy",path:"assets/figur-junge-original.png",bytes:704320,
  blob:"8cd94ec07210985aeb2e5d7fe6d2c8219e407369",format:"png",width:1254,height:1254}),
 Object.freeze({id:"girl",path:"assets/figur-maedchen-original.png",bytes:785802,
  blob:"9a9dcdb0499894b95a36c82d42e89d3483aad313",format:"png",width:1254,height:1254}),
 Object.freeze({id:"approved-seven-poses",path:"assets/gebetspositionen-sieben-schritte-user-approved-review.jpg",bytes:301055,
  blob:"976ca881b9e15e34ffdd2e2df60fa214a2f21220",format:"jpg"}),
 Object.freeze({id:"approved-qiyam",path:"assets/qiyam-brusthoehe-user-approved-ref-v1.jpg",bytes:113267,
  blob:"fc01054466533451c7489dd0cc0faeeff937e0e5",format:"jpg"})
]);
const PNG_SIG=Buffer.from([137,80,78,71,13,10,26,10]);
function gitBlobSha(bytes){
 return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
}
function inspect(bytes,pin){
 if(!Buffer.isBuffer(bytes))return {id:pin.id,pass:false,errors:["not-a-buffer"]};
 const errors=[];
 if(bytes.length!==pin.bytes)errors.push("size");
 if(gitBlobSha(bytes)!==pin.blob)errors.push("git-blob-sha1");
 if(pin.format==="png"){
  if(bytes.length<33||!bytes.subarray(0,8).equals(PNG_SIG)||bytes.toString("ascii",12,16)!=="IHDR")
   errors.push("png-header");
  else {
   if(bytes.readUInt32BE(16)!==pin.width||bytes.readUInt32BE(20)!==pin.height)errors.push("png-dimensions");
   const ct=bytes[25];
   if(![2,6].includes(ct))errors.push("png-color-mode");
  }
 }else if(pin.format==="jpg"){
  if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||
     bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)errors.push("jpeg-structure");
 }
 return {id:pin.id,path:pin.path,bytes:bytes.length,gitBlobSha1:gitBlobSha(bytes),
   pass:errors.length===0,errors};
}
function run(base=root){
 const results=PINS.map(pin=>{try{return inspect(fs.readFileSync(path.join(base,pin.path)),pin)}
  catch(e){return {id:pin.id,path:pin.path,pass:false,errors:["unreadable-source"]}}});
 return {pass:results.every(x=>x.pass),results,original3DIdentityApproved:false,
   prayerTeachingApproved:false,productionApproved:false,
   notice:"This verifies exact 2D source bytes, not geometry, 3D identity, skinning or prayer postures."};
}
if(require.main===module){
 const result=run();
 console.log(JSON.stringify(result,null,2));
 process.exitCode=result.pass?0:1;
}
module.exports={PINS,gitBlobSha,inspect,run};
