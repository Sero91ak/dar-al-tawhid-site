/* KIDS_BIRTH_MONTH_AUTO_AGE_V1431
 * Month + year only; no day/date of birth. Local device storage outside the
 * kids.* account bag so these details are not included in cloud sync.
 * Birth month transitions take effect on the 1st (not an exact birthday).
 */
(function(root){
"use strict";
const PREFIX="dar.kids.birthMonth.v1.";
function localNow(){return new Date()}
function parse(v){
  const match=/^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(v||""));
  if(!match)return null;
  return {year:Number(match[1]),month:Number(match[2])};
}
function ageAt(value,when){
  const p=parse(value),today=when instanceof Date?when:localNow();
  if(!p||Number.isNaN(today.getTime()))return null;
  const valueAge=today.getFullYear()-p.year-(today.getMonth()+1<p.month?1:0);
  return valueAge>=0&&valueAge<=120?valueAge:null;
}
function groupAt(value,when){
  const age=ageAt(value,when);
  if(age===null)return null;
  return age<=5?"4–5":age<=8?"6–8":"9–10";
}
function isEligible(value,when){
  const a=ageAt(value,when);
  return a!==null&&a>=4&&a<=10;
}
function key(id){return PREFIX+encodeURIComponent(String(id||""))}
function get(id){
  if(id===null||id===undefined||id==="")return null;
  try{const raw=localStorage.getItem(key(id));return parse(raw)?raw:null}catch(_){return null}
}
function set(id,value){
  if(!id||!isEligible(value))return false;
  try{localStorage.setItem(key(id),value);return true}catch(_){return false}
}
function clear(id){
  if(id===null||id===undefined||id==="")return false;
  try{localStorage.removeItem(key(id));return true}catch(_){return false}
}
function resolve(id,fallback,when){
  return groupAt(get(id),when)||(["4–5","6–8","9–10"].includes(fallback)?fallback:"6–8");
}
root.DARKidsBirthMonth=Object.freeze({prefix:PREFIX,parse,ageAt,groupAt,isEligible,get,set,clear,resolve});
})(window);
