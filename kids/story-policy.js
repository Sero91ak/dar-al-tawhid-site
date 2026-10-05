(() => {
"use strict";
const AGE_KEYS=["4-5","6-8","9-10"];
const clean=value=>String(value==null?"":value).trim();
const words=value=>(clean(value).match(/\S+/g)||[]).length;
function longest(values){
  return (Array.isArray(values)?values:[]).map(clean).filter(Boolean)
    .sort((a,b)=>words(b)-words(a)||b.length-a.length)[0]||"";
}
function canonicalText(item){
  if(!item||typeof item!=="object")return"";
  const explicit=clean(item.masterStoryText);
  if(explicit)return explicit;
  const scripts=item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  const fromScripts=longest(AGE_KEYS.map(key=>scripts[key]));
  if(fromScripts)return fromScripts;
  const candidates=[item.voiceScript,item.fullText,item.storyText,item.text,item.story];
  if(Array.isArray(item.blocks)&&item.blocks.length)candidates.push(item.blocks.join("\n\n"));
  if(Array.isArray(item.chapters)&&item.chapters.length){
    const full=item.chapters.slice();
    for(const key of ["older","older1","older2"]){const extra=clean(item[key]);if(extra)full.push(extra)}
    candidates.push(full.join("\n\n"));
  }
  return longest(candidates);
}
function normalizeItem(item){
  if(!item||typeof item!=="object")return item;
  const text=canonicalText(item);if(!text)return item;
  const scripts={...(item.scripts&&typeof item.scripts==="object"?item.scripts:{})};
  for(const key of AGE_KEYS)scripts[key]=text;
  return {...item,masterStoryText:text,scripts};
}
function hasSingleMasterAcrossAges(item){
  const master=canonicalText(item);
  if(!master)return true;
  const scripts=item&&item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  return AGE_KEYS.every(key=>clean(scripts[key])===master);
}
window.DARKidsStoryPolicy=Object.freeze({
  version:2,
  sourcePriority:Object.freeze(["masterStoryText","scripts","voiceScript","fallbackText"]),
  ageKeys:Object.freeze(AGE_KEYS.slice()),
  canonicalText,
  normalizeItem,
  hasSingleMasterAcrossAges
});
})();
