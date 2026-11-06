/* Canonical adult Home greeting · nine languages · website/iOS/PWA/DAR Test.
 * Only the existing four Home greeting mounts; no new scroll/navigation owners. */
(function(w,d){"use strict";
if(w.DARAdultHomeWelcomeV1)return;
var KEY="darAdultPreferredLocaleV1";
var texts={
de:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Willkommen bei DĀR AL TAWḤĪD","Eine geordnete Wissensplattform mit Beiträgen aus Qurʾān, authentischer Sunnah und den Āṯār der frühen Imāme – sowie einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah."],
ar:["السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ","مرحبًا بكم في دار التوحيد","منصة معرفية منظّمة تضم مقالات من القرآن والسنة الصحيحة وآثار الأئمة المتقدمين، إلى جانب مجموعة واسعة من الأدعية من القرآن والسنة الصحيحة."],
en:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Welcome to DĀR AL TAWḤĪD","An organized knowledge platform with articles from the Qurʾān, authentic Sunnah and reports of the early Imams, as well as an extensive collection of Duʿāʾ from the Qurʾān and authentic Sunnah."],
tr:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","DĀR AL TAWḤĪD'e hoş geldiniz","Kur’an, sahih Sünnet ve ilk dönem imamlarının rivayetlerinden yazıların bulunduğu düzenli bir ilim platformu; ayrıca Kur’an ve sahih Sünnet’ten geniş bir dua derlemesi."],
ku:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Bi xêr hatin DĀR AL TAWḤĪD","Platformeke zanînê ya rêkûpêk bi nivîsên ji Qurʾān, Sunnah ya rast û vegotinên îmamên destpêkê, her wiha berhevokeke fireh a duʿāyan ji Qurʾān û Sunnah ya rast."],
ckb:["السلام علیکم ورحمة الله وبرکاته","بەخێربێن بۆ دار التوحید","پلاتفۆرمێکی ڕێکخراوی زانست بە بابەت لە قورئان و سوننەتی ڕاست و گێڕانەوەکانی ئیمامانی پێشوو، هەروەها کۆمەڵەیەکی فراوانی دوعا لە قورئان و سوننەتی ڕاست."],
bs:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Dobro došli u DĀR AL TAWḤĪD","Uređena platforma znanja s tekstovima iz Kur’ana, vjerodostojnog sunneta i predaja ranih imama, kao i opsežnom zbirkom dova iz Kur’ana i vjerodostojnog sunneta."],
fr:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Bienvenue à DĀR AL TAWḤĪD","Une plateforme de savoir structurée proposant des articles tirés du Qurʾān, de la Sunnah authentique et des récits des premiers imams, ainsi qu’une vaste collection de duʿāʾ issus du Qurʾān et de la Sunnah authentique."],
es:["As-Salāmu ʿAlaikum Wa Raḥmatullāhi Wa Barakātuh","Bienvenido a DĀR AL TAWḤĪD","Una plataforma de conocimiento organizada con artículos del Qurʾān, la Sunnah auténtica y los relatos de los primeros imames, además de una amplia colección de duʿāʾ del Qurʾān y la Sunnah auténtica."]
};
var registry=w.DARAdultComponentI18nV1;
if(registry&&registry.register){
 var catalogs={};
 Object.keys(texts).forEach(function(l){catalogs[l]={greeting:texts[l][0],title:texts[l][1],summary:texts[l][2]}});
 registry.register("adult-home-welcome",catalogs);
}
function lang(){try{var k=w.localStorage.getItem(KEY)||"de";return texts[k]?k:"de"}catch(_){return"de"}}
function mark(el,s,kind,l){if(!el||el.textContent.trim()===s)return;
 var words=kind==="title"?["DĀR AL TAWḤĪD","دار التوحيد","دار التوحید"]:(l==="de"?["Āṯār der frühen Imāme","Duʿāʾ-Sammlung","Qurʾān","Sunnah"]:[]);
 if(!words.length){el.textContent=s;return}
 var out=[],at=0;while(at<s.length){var found=null,index=s.length;words.forEach(function(word){var i=s.indexOf(word,at);if(i>=0&&i<index){index=i;found=word}});
  if(!found){out.push(d.createTextNode(s.slice(at)));break}
  if(index>at)out.push(d.createTextNode(s.slice(at,index)));
  var b=d.createElement("strong");b.textContent=found;out.push(b);at=index+found.length;
 }
 el.replaceChildren.apply(el,out)}
function apply(){var l=lang(),t=texts[l],rtl=l==="ar"||l==="ckb";
 var mounts=[
 ["#darV8TopWelcome",".v8-copy h1","#darV8WelcomeTitle","#darV8WelcomeSummary"],
 ["#darAdultHomeWelcomeV5",".dar-adult-home-salam-v5",".dar-adult-home-title-v7",".dar-adult-home-desc-v7"],
 ["#darHomeV47Welcome",".dar-v47-salam",".dar-v47-title",".dar-v47-intro"],
 ["#darHomeHtmlParityV1 .dhp-welcome",".dhp-greeting",".dhp-welcome-title",".dhp-intro"]
 ];
 mounts.forEach(function(a){var root=d.querySelector(a[0]);if(!root)return;
  var greet=root.querySelector(a[1]),ttl=root.querySelector(a[2]),sum=root.querySelector(a[3]);
  if(greet&&greet.textContent.trim()!==t[0])greet.textContent=t[0];
  mark(ttl,t[1],"title",l);mark(sum,t[2],"summary",l);
  root.setAttribute("lang",l);root.setAttribute("dir",rtl?"rtl":"ltr");
  root.setAttribute("aria-label",t[1]);
  if(greet){greet.setAttribute("lang",rtl?l:"ar-Latn");greet.setAttribute("dir",rtl?"rtl":"ltr")}
 })
}
w.DARAdultHomeWelcomeV1=Object.freeze({apply:apply,lang:lang});
function start(){apply();d.addEventListener("dar:view-rendered",apply);
 ["dar-v8-locale-changed","dar-adult-locale-changed","dar-adult-ui-languages-ready","pageshow"].forEach(function(e){w.addEventListener(e,apply)});
 w.addEventListener("storage",function(e){if(e.key===KEY)apply()});
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
