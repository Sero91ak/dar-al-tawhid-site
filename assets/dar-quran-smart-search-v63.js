/* Qurʾān V6.3 – multilingual retrieval aid, not tafsīr or automatic translation. */
(function(root){"use strict";if(root.DarQuranSmartSearch?.version==="6.3.0")return;
const AR=/[\u0600-\u06FF]/;
const LEX={
taghut:["taghut","tagut","tagoot","taghoot","taghout","taghouth","taghutt","taaghoot","taaghut","ṭāghūt","ṭāġūt","طاغوت","الطاغوت","طواغيت","الطواغيت","falsche gottheit","falsche gottheiten"],
tawhid:["tawhid","tauhid","tawheed","tawḥīd","توحيد","einzigkeit allahs"],
shirk:["shirk","schirk","širk","شرك","beigesellung"],
iman:["iman","īman","iiman","īmān","إيمان","ايمان","glaube"],
kufr:["kufr","kafir","kaafir","كفر","كافر","unglaube"],
salah:["salah","salat","ṣalāh","الصلاة","صلاة","gebet"],
rahma:["rahma","raḥmah","رحمة","barmherzigkeit"],
jannah:["jannah","جنة","paradies"],
huda:["hudā","huda","هدى","rechtleitung"],
taqwa:["taqwa","taqwā","تقوى","gottesfurcht"],
sabr:["sabr","ṣabr","صبر","geduld"]
};
function norm(v){return String(v??"").toLocaleLowerCase("de").normalize("NFKD")
.replace(/\u0670/g,"ا") /* dagger alif is a written long ā, not disposable punctuation */
.replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g,"")
.replace(/[\u0300-\u036f]/g,"")
.replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ة/g,"ه")
.replace(/[ʿʾ‘’´']/g,"").replace(/\x60/g,"").replace(/[ḥḫẖ]/g,"h").replace(/[ṣšś]/g,"s")
.replace(/ṭ/g,"t").replace(/ḍ/g,"d").replace(/ẓ/g,"z").replace(/[ġḡ]/g,"g")
.replace(/ā/g,"a").replace(/[īï]/g,"i").replace(/ū/g,"u")
.replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ß/g,"ss")
.replace(/[\u200c\u200d\u200e\u200f]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim()}
function phon(v){const s=norm(v);return AR.test(s)?s:s.replace(/gh/g,"g").replace(/kh/g,"h").replace(/th/g,"t").replace(/sh/g,"s")
.replace(/aa+/g,"a").replace(/oo+/g,"u").replace(/uu+/g,"u").replace(/ee+/g,"i").replace(/ii+/g,"i").replace(/ou/g,"u")}
function typo(a,b){if(a===b)return true;if(!a||!b||Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1||AR.test(a+b))return false;
let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++n>1)return false;
if(a.length>b.length)i++;else if(a.length<b.length)j++;else{i++;j++}}return n+(a.length-i)+(b.length-j)<=1}
function concept(q,keywords){const query=norm(q),p=phon(q);if(!query)return null;
const rows=Object.entries(LEX).map(([id,terms])=>({id,terms:terms.slice()}));
for(const x of (Array.isArray(keywords)?keywords:[])){if(!x?.id)continue;let r=rows.find(y=>y.id===x.id);
if(!r){r={id:String(x.id),terms:[]};rows.push(r)}r.terms.push(x.label||"",...(Array.isArray(x.terms)?x.terms:[]))}
let similar=null;for(const row of rows){const terms=[...new Set([row.id,...row.terms].map(norm).filter(Boolean))];
if(terms.some(t=>t===query||phon(t)===p))return {...row,terms};
if(query.length>=5&&terms.some(t=>typo(phon(t),p)))similar={...row,terms}}
return similar}
function expand(query,keywords=[]){const q=norm(query),p=phon(query),c=concept(query,keywords);
const terms=[...new Set([q,p,...(c?.terms||[])].flatMap(t=>[norm(t),phon(t)]).filter(t=>t.length>=2))];
return {query:q,phonetic:p,concept:c?.id||null,terms}}
function has(s,t){if(!t||t.length<2)return false;const n=norm(s);return n.includes(t)||(!AR.test(n+t)&&phon(n).includes(phon(t)))}
function inspect(row,e){const ar=row.ar||row.arabic||"",tr=[row.tr,row.tr_readable,row.tr_academic,row.transliteration?.readable,row.transliteration?.scientific,row.transliteration?.standard].filter(x=>typeof x==="string").join(" "),de=row.de||row.german||"";
for(const f of [{s:ar,type:"arabisch"},{s:tr,type:"lautschrift"},{s:de,type:"deutsch"}])if(has(f.s,e.query))return{score:110,type:f.type};
if(e.phonetic!==e.query&&[ar,tr,de].some(s=>has(s,e.phonetic)))return{score:100,type:"umschrift"};
if(e.concept)for(const t of e.terms){if(t===e.query||t===e.phonetic)continue;
if(has(ar,t))return{score:92,type:"arabische Begriffsform"};
if(has(tr,t))return{score:81,type:"Lautschrift-Variante"};
if(has(de,t))return{score:65,type:"Begriffsverwandt"}}
return null}
function searchVerses(rows,query,{keywords=[],limit=0}={}){const ex=expand(query,keywords);if(!ex.query||!Array.isArray(rows))return [];
const found=[];for(const r of rows){const m=inspect(r,ex);if(m)found.push({...r,_smartMatch:m.type,_smartScore:m.score,_smartConcept:ex.concept})}
found.sort((a,b)=>(Number(b._smartScore)||0)-(Number(a._smartScore)||0)||Number(a.id||a.ayah)-Number(b.id||b.ayah));
return limit>0?found.slice(0,limit):found}
root.DarQuranSmartSearch=Object.freeze({version:"6.3.0",normalize:norm,phonetic:phon,expand,inspect,searchVerses});
})(window);