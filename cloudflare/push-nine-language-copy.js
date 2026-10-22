/**
 * DĀR adult push localizations, editorially approved and EXACT emoji parity.
 * Only presentation: no scheduling, prayer calculation, subscription creation,
 * provider-side sends, location changes, or opt-in.
 */
const SUPPORTED_BY_ONESIGNAL = Object.freeze(["de","en","tr","ar","bs","fr","es"]);
// OneSignal does not accept 3-letter ckb as a notification language map.
// Kurdish locales ku/ckb must be routed per device by protected subscription
// locale delivery (English-key, one targeted subscription), not pretended to work.
const ALL_LOCAL_CODES = Object.freeze(["de","ar","en","tr","ku","ckb","bs","fr","es"]);
const EMOJI = Object.freeze({fajr:"✨",dhuhr:"☀️",asr:"🌤️",maghrib:"🌥️",isha:"🌙",tahajjud:"🌙"});

function approvedValue(catalog,lang,key,vars){
 const record=catalog?.copy?.[lang]?.[key];
 if(record?.status!=="approved")return null;
 const fill=s=>String(s||"").replace(/\{(minutes|time)\}/g,(_,k)=>{
  if(!(k in vars))throw new Error("Missing token "+k);
  return String(vars[k]);
 });
 const title=fill(record.title),body=fill(record.body);
 if(!title||!body||/\{[^}]+\}/.test(title+body))throw new Error("Bad localized copy "+lang+"/"+key);
 return {title,body};
}
function localizedMessage(catalog,key,vars={},targetLocale=null) {
 if(targetLocale!==null){
  const code=String(targetLocale).toLowerCase();
  if(!ALL_LOCAL_CODES.includes(code))throw new Error("Unsupported app locale");
  const one=approvedValue(catalog,code,key,vars) || approvedValue(catalog,"de",key,vars);
  if(!one)throw new Error("No approved fallback");
  // Individual subscription targeting; en is a technical OneSignal key.
  return {headings:{en:one.title},contents:{en:one.body}};
 }
 const headings={},contents={};
 for(const code of SUPPORTED_BY_ONESIGNAL){
  const loc=approvedValue(catalog,code,key,vars);
  if(loc){headings[code]=loc.title;contents[code]=loc.body;}
 }
 if(!headings.en||!contents.en)throw new Error("Provider requires approved English copy");
 return {headings,contents};
}
function prayerMessage(catalog,prayerKey,mode,advanceMinutes,time,locale=null){
 const p=String(prayerKey||"").toLowerCase();
 if(!EMOJI[p])throw Error("Invalid prayer key");
 if(!["entry","advance"].includes(mode))throw Error("Invalid prayer mode");
 if(mode==="advance"){
  if(![5,10,15].includes(Number(advanceMinutes)))throw Error("Invalid selected prewarning");
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(time||"")))throw Error("Invalid computed target time");
 }
 const key="prayer_"+p+"_"+mode;
 const map=localizedMessage(catalog,key,{minutes:Number(advanceMinutes),time},locale);
 for(const title of Object.values(map.headings)){
  if(!title.startsWith(EMOJI[p]+" "))throw Error("German emoji parity failed");
 }
 return map;
}
function dailyMessage(catalog,kind,locale=null){
 if(!["daily_dua","daily_recommendation"].includes(kind))throw Error("Unsupported daily type");
 return localizedMessage(catalog,kind,{},locale);
}
export {SUPPORTED_BY_ONESIGNAL,ALL_LOCAL_CODES,EMOJI,localizedMessage,prayerMessage,dailyMessage};
