/* DĀR AL TAWḤĪD · reusable nine-language UI contract for NEW adult components.
 * Register one complete nine-locale catalog per namespace, no remote translation,
 * no modification to canonical religious quotations or existing app controls. */
(function(w){'use strict';
if(w.DARAdultComponentI18nV1)return;
var KEY="darAdultPreferredLocaleV1";
var LANGUAGES=Object.freeze(["de","ar","en","tr","ku","ckb","bs","fr","es"]);
var catalogs=Object.create(null),listeners=[];
function locale(){try{var code=String(w.localStorage.getItem(KEY)||"de").toLowerCase().replace("_","-");return LANGUAGES.indexOf(code)>=0?code:"de"}catch(_){return"de"}}
function valid(c){if(!c||typeof c!=="object")return false;
 var keys=Object.keys(c.de||{});if(!keys.length)return false;
 return LANGUAGES.every(function(l){return !!c[l]&&keys.every(function(k){return typeof c[l][k]==="string"&&c[l][k].trim().length>0})})}
function register(namespace,data){if(!/^[a-z][a-z0-9-]{2,50}$/.test(String(namespace))||!valid(data))throw Error("Adult UI module must provide complete de/ar/en/tr/ku/ckb/bs/fr/es translations: "+namespace);
 catalogs[namespace]=data;return true}
function text(namespace,key,lang){var c=catalogs[namespace];if(!c)return"";var l=LANGUAGES.indexOf(lang)>=0?lang:locale();return c[l]&&c[l][key]||c.de[key]||""}
function notify(){listeners.slice().forEach(function(fn){try{fn(locale())}catch(e){}})}
function subscribe(fn){if(typeof fn!=="function")return function(){};listeners.push(fn);return function(){listeners=listeners.filter(function(f){return f!==fn})}}
w.DARAdultComponentI18nV1=Object.freeze({languages:LANGUAGES,locale:locale,direction:function(l){return ["ar","ckb"].includes(l||locale())?"rtl":"ltr"},register:register,t:text,subscribe:subscribe});
w.addEventListener("dar-adult-locale-changed",notify);
w.addEventListener("dar-adult-ui-languages-ready",notify);
w.addEventListener("storage",function(e){if(e.key===KEY)notify()});
})(window);
