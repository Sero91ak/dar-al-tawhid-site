/* DĀR KIDS · Majlis Quran Search v1.
   On-demand, browser-only 6236 verse retrieval: NO child question sent to any third party.
   Does not interpret fiqh, invent text, or use low-confidence editorial keyword tags. */
(function (root) {
  "use strict";
  if (root.DarKidsQuranSearch) return;
  const INDEX="/data/quran-search-index.json";
  const MAX_RESULTS=5, MAX_QUERY=350, EXPECTED=6236;
  const NOISE=new Set(("wo wie was warum woher wer in im ist sind es ich du wir kann kannst kommt stehen steht findet finde mir mich " +
    "quran qur an qurʾan koran qurân sura sure surah suren aya ayah ayat vers verse die der das dem den des und oder " +
    "welcher welche welches welchem welchems eine einen eines ein auf von vom zum zur fur für bei uber über über nach dazu dass ob wird wurde wurden erwahnt erwähnt " +
    "sagt sagte steht geschrieben möchte moechte wissen zeigen erklaren erklären suche suchst lesen hören " +
    "bitte überstelle stelle bitte gib mir wo gibt es welches sprich").split(/\s+/));
  let pending=null, indexed=null;
  function norm(value) {
    return String(value||"").normalize("NFKD").toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"").replace(/[\u0300-\u036f]/g,"")
      .replace(/[\u0640]/g,"").replace(/[ٱإأآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
      .replace(/ß/g,"ss").replace(/æ/g,"ae").replace(/œ/g,"oe")
      .replace(/[^a-z0-9\u0621-\u064a]+/g," ").replace(/\s+/g," ").trim();
  }
  function terms(query){
    return [...new Set(norm(query).split(" ").filter(w=>w.length>=3&&!NOISE.has(w)))].slice(0,10);
  }
  function refFromQuestion(query) {
    const text=String(query||"");
    const colon=text.match(/(?:^|[^\d])(\d{1,3})\s*[:/]\s*(\d{1,3})(?!\d)/);
    if(colon)return {surah:Number(colon[1]),ayah:Number(colon[2])};
    const prose=text.match(/(?:sura|surah|sure|sūrah)\s*(\d{1,3})\s*(?:[,.\- ]+)\s*(?:vers|ayah|āyah|aya|ayat)\s*(\d{1,3})/i);
    if(prose)return {surah:Number(prose[1]),ayah:Number(prose[2])};
    return null;
  }
  function isQuestion(q){
    const s=norm(q);
    return /\b(quran|qur|koran|sura|surah|sure|ayat|ayah|verse?|suren|آيه|سوره|القران)\b/i.test(s)||
      /\b(?:\d{1,3})\s*:\s*\d{1,3}\b/.test(String(q));
  }
  function isValid(a,counts){
    return a&&Number.isInteger(a.surahId)&&a.surahId>=1&&a.surahId<=114&&
      Number.isInteger(a.ayah)&&a.ayah>=1&&a.ayah<=counts[a.surahId-1]&&
      typeof a.ar==="string"&&a.ar.trim()&&typeof a.de==="string"&&a.de.trim();
  }
  function validate(records){
    if(!Array.isArray(records)||records.length!==EXPECTED)return null;
    const counts=Array.from({length:114},()=>0),seen=new Set();
    for(const x of records){
      if(!x||!Number.isInteger(x.surahId)||x.surahId<1||x.surahId>114||!Number.isInteger(x.ayah)||
        x.ayah<1||!x.ar?.trim()||!x.de?.trim())return null;
      const k=x.surahId+":"+x.ayah;if(seen.has(k))return null;seen.add(k);
      counts[x.surahId-1]=Math.max(counts[x.surahId-1],x.ayah);
    }
    if(counts.some((count,index)=>!count||records.filter(r=>r.surahId===index+1).length!==count))return null;
    const byRef=new Map(),prefix=[0];
    for(const n of counts)prefix.push(prefix[prefix.length-1]+n);
    if(prefix[114]!==EXPECTED)return null;
    const indexedRows=records.map(x=>{
      const key=x.surahId+":"+x.ayah;
      const line={surah:x.surahId,ayah:x.ayah,reference:"Qurʾān "+key,
        surahName:x.surahName||"",surahArabic:x.surahArabic||"",arabic:x.ar,german:x.de,transliteration:x.tr||"",
        globalAyah:prefix[x.surahId-1]+x.ayah,
        deNorm:norm(x.de),arNorm:norm(x.ar),trNorm:norm(x.tr||"")};
      byRef.set(key,line);return line;
    });
    return {rows:indexedRows,byRef};
  }
  async function localCache(){
    try {
      if(typeof caches==="undefined"||!caches||typeof caches.open!=="function")return null;
      return await caches.open("dar-kids-majlis-quran-full-v1");
    }catch(_){return null;}
  }
  async function verifiedIndexFromResponse(response){
    if(!response||!response.ok)return null;
    const data=await response.json();
    return validate(data);
  }
  async function load(){
    if(indexed)return indexed;
    if(!pending){
      pending=(async function(){
        // Only after the first child-initiated Qurʾān question. Never prefetch on boot.
        const cache=await localCache();
        try{
          const response=await fetch(INDEX,{cache:"force-cache",credentials:"same-origin"});
          const copy=response?.ok?response.clone():null;
          const verified=await verifiedIndexFromResponse(response);
          if(!verified)throw Error("quran-index-incomplete");
          indexed=verified;
          // Preserve a previously validated corpus for the next offline session.
          if(cache&&copy){try{await cache.put(INDEX,copy)}catch(_){}}
          return indexed;
        }catch(_){
          // Never display an incomplete or modified saved corpus: recheck all 6,236 keys.
          try{
            const saved=cache?await cache.match(INDEX):null;
            const verified=await verifiedIndexFromResponse(saved);
            if(verified){indexed=verified;return indexed;}
          }catch(_saved){}
          return null;
        }
      })();
    }
    try{return await pending}finally{if(!indexed)pending=null}
  }
  function tokensMatched(tokens,haystack){
    let hits=0;
    const ws=new Set(haystack.split(" "));
    for(const word of tokens){
      if(ws.has(word))hits++;
      else if(word.length>=6&&[...ws].some(w=>w.startsWith(word)&&w.length<=word.length+5))hits++;
    }
    return hits;
  }
  function recitationUrl(global){
    return "/quran-audio/ar.alafasy/"+global+".mp3?v=1063";
  }
  function result(row){
    return {kind:"quran",surah:row.surah,ayah:row.ayah,reference:row.reference,
      surahName:row.surahName,arabic:row.arabic,german:row.german,
      reciter:"Mišārī Rāšid al-ʿAfāsī",recitationUrl:recitationUrl(row.globalAyah)};
  }
  function surahReference(index,query,offset=0){
    const q=norm(query);
    if(!/(?:sura|surah|sure|سوره)/.test(q))return null;
    const chapters=index.rows.filter(v=>v.ayah===1);
    let matched=null;
    const numeric=String(query).match(/(?:sura|surah|sure|sūrah)\s*(\d{1,3})(?!\d)/i);
    if(numeric){
      const n=Number(numeric[1]);
      matched=chapters.find(v=>v.surah===n)||null;
    }else{
      const hits=chapters.filter(ch=>{
        const name=norm(ch.surahName),ar=norm(ch.surahArabic||"");
        return (name.length>=5&&q.includes(name))||(ar.length>=4&&q.includes(ar));
      }).sort((a,b)=>b.surahName.length-a.surahName.length);
      if(hits.length===1)matched=hits[0];
    }
    if(!matched)return null;
    const verse=String(query).match(/(?:vers(?:e)?|ayah|āyah|aya|ayat)\s*(\d{1,3})(?!\d)/i);
    if(verse){
      const row=index.byRef.get(matched.surah+":"+Number(verse[1]));
      return row?{status:"found",exact:true,total:1,results:[result(row)]}:
        {status:"not_found",exact:true,total:0,results:[]};
    }
    const items=index.rows.filter(v=>v.surah===matched.surah);
    return {status:"found",exact:false,total:items.length,offset,nextOffset:Math.min(items.length,offset+MAX_RESULTS),results:items.slice(offset,offset+MAX_RESULTS).map(result)};
  }
  // These exact topic->verse references are already present in the verified Kids
  // teaching material. No fuzzy topic tag can invent a Quran reference.
  const EDITORIAL_VERSES=[
    {match:/\ballah\b.*\b(einer|einzig|einziger|einzigkeit)\b|\b(einer|einzig|einzigkeit)\b.*\ballah\b/,surah:112,ayah:1},
    {match:/\b(wudu|gebetswaschung)\b/,surah:5,ayah:6},
    {match:/\b(qibla|qiblah|gebetsrichtung)\b/,surah:2,ayah:144},
    {match:/\b(ramadan|ramadhan)\b.*\b(fasten|fastet|fastenpflicht)\b/,surah:2,ayah:183},
    {match:/\b(rabbi zidni|zidni ilma|mehr wissen)\b/,surah:20,ayah:114}
  ];
  function exactEditorialReference(index,query){
    const q=norm(query);
    for(const item of EDITORIAL_VERSES){
      if(!item.match.test(q))continue;
      const verse=index.byRef.get(item.surah+":"+item.ayah);
      if(verse)return {status:"found",exact:true,total:1,results:[result(verse)]};
    }
    return null;
  }
  function lookup(index,query,offset=0){
    const explicit=refFromQuestion(query);
    if(explicit){
      const row=index.byRef.get(explicit.surah+":"+explicit.ayah);
      return row?{status:"found",exact:true,total:1,results:[result(row)]}:{status:"not_found",exact:true,total:0,results:[]};
    }
    const named=surahReference(index,query,offset);
    if(named)return named;
    const editorial=exactEditorialReference(index,query);
    if(editorial)return editorial;
    const words=terms(query);
    if(!words.length)return {status:"too_broad",exact:false,total:0,results:[]};
    // Require actual Arabic/German/transliteration text. keywordIds and tagText
    // in the inherited Quran index are overbroad and not suitable as evidence.
    const phrase=norm(query).replace(/\b(quran|koran|sure|surah|sura|vers|verse|ayat|ayah)\b/g,"").trim();
    const candidates=[];
    for(const row of index.rows){
      const d=tokensMatched(words,row.deNorm),a=tokensMatched(words,row.arNorm),t=tokensMatched(words,row.trNorm);
      const matched=Math.max(d,a,t),coverage=matched/words.length;
      if(words.length===1){
        if(matched!==1||words[0].length<4)continue;
      } else if(matched<Math.min(2,words.length)||coverage<0.66)continue;
      const phraseHit=phrase.length>=7&&(
        row.deNorm.includes(phrase)||row.arNorm.includes(phrase)||row.trNorm.includes(phrase));
      const points=coverage*14+matched*1.8+(phraseHit?12:0)+(a===words.length?1:0);
      candidates.push({row,points});
    }
    if(!candidates.length)return {status:"not_found",exact:false,total:0,results:[]};
    if(words.length===1&&candidates.length>120)return {status:"too_broad",exact:false,total:candidates.length,results:[]};
    candidates.sort((a,b)=>b.points-a.points||a.row.globalAyah-b.row.globalAyah);
    return {status:"found",exact:false,total:candidates.length,offset,nextOffset:Math.min(candidates.length,offset+MAX_RESULTS),results:candidates.slice(offset,offset+MAX_RESULTS).map(x=>result(x.row))};
  }
  async function search(question,options={}){
    if(typeof question!=="string"||!question.trim()||question.length>MAX_QUERY)
      return {status:"invalid",results:[],total:0};
    const index=await load();
    if(!index)return {status:"unavailable",results:[],total:0};
    const offset=Math.min(EXPECTED,Math.max(0,Math.floor(Number(options?.offset)||0)));
    return lookup(index,question,offset);
  }
  root.DarKidsQuranSearch=Object.freeze({version:1,indexPath:INDEX,isQuestion,search,
    __test:Object.freeze({norm,terms,refFromQuestion,validate,lookup})});
})(typeof window!=="undefined"?window:globalThis);
