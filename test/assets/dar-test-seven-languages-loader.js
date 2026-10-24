/* Static adult UI pack loader.
 * No OpenAI API, no translation billing; no source or user data uploaded.
 * Used only by DAR TEST until formally reviewed for public clients.
 */
(function(global){"use strict";
const path=String(global.location?.pathname||"");
if(!/^\/test(?:\/|$)/.test(path)||/^\/test\/kids(?:\/|$)/.test(path))return;
if(global.__DarTestSevenLocalesLoading)return;
global.__DarTestSevenLocalesLoading=true;
const endpoint="/test/i18n/adult-ui-locales-seven.json?v=20261024-ui-more-15";
global.fetch(endpoint,{credentials:"same-origin",cache:"default"})
 .then(response=>{if(!response.ok)throw Error("Static language pack unavailable: "+response.status);return response.json()})
 .then(data=>{
  if(!global.DarTestTurkishUI?.registerLocaleData?.(data))
   throw Error("Invalid static multilingual UI pack");
  // Separate editorial headline drafts; source IDs/titles are exact-matched, never body copy.
  global.fetch("/test/i18n/adult-visible-title-drafts-seven.json?v=20261024-titles-fr-es",{credentials:"same-origin",cache:"default"})
   .then(r=>{if(!r.ok)throw Error("No heading draft pack");return r.json()})
   .then(t=>{global.DarTestTurkishUI?.registerTitleData?.(t)})
   .catch(_=>{/* original German headings remain, no paid request */});
  global.__DarTestSevenLocalesReady=true;
  global.dispatchEvent(new CustomEvent("dar-adult-ui-languages-ready",{
   detail:{locales:data.availableLocales||[],noPaidProvider:true}
  }));
 })
 .catch(e=>{
  global.__DarTestSevenLocalesReady=false;
  if(global.console?.warn)global.console.warn("DĀR TEST locale fallback: German original remains available.",e);
 });
})(window);
