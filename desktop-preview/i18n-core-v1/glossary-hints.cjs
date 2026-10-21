"use strict";
/* Source-limited canonical spelling hints, never Islamic definitions or rulings. */
const fs=require("node:fs"),path=require("node:path");
const entries=JSON.parse(fs.readFileSync(path.join(__dirname,"terms.json"),"utf8")).entries;
const folded=x=>" "+String(x||"").toLowerCase().normalize("NFKD").replace(/\p{M}/gu,"").replace(/[ʿʾʼ‘’]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim()+" ";
function glossaryHints(fields){
 const raw=Object.values(fields||{}).flat().filter(x=>typeof x==="string").join(" "),text=folded(raw);
 return entries.filter(t=>[t.id,t.arabic,...(t.aliases||[])].some(a=>{const term=folded(a).trim();return term.length>=3&&text.includes(" "+term+" ")}))
   .slice(0,32).map(t=>({conceptId:t.id,arabicSpelling:t.arabic,domain:t.domain}));
}
module.exports={glossaryHints,folded};
