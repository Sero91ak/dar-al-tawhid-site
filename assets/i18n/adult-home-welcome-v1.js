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
/* ONE_OWNER_HOME_WELCOME_LAYOUT_V2
 * Existing nine-language Home component: two-line Latin greeting and a
 * progressive short-to-long editorial paragraph. Never touch page routing.
 * All display work is confined to the existing greeting/summary nodes. */
var SALAM_FIRST="As-Salāmu ʿAlaikum";
var SALAM_SECOND="Wa Raḥmatullāhi Wa Barakātuh";
var canvas=null;
function measureContext(){
 try{if(!canvas)canvas=d.createElement("canvas");return canvas.getContext("2d")}catch(_){return null}
}
function measureFont(el,weight){
 var css=w.getComputedStyle(el);
 return (css.fontStyle||"normal")+" "+(weight||css.fontWeight||"400")+" "+(css.fontSize||"16px")+" "+(css.fontFamily||"serif");
}
function splitSalam(el,full,l){
 if(!el)return;
 var latin=l!=="ar"&&l!=="ckb"&&full===SALAM_FIRST+" "+SALAM_SECOND;
 if(!latin){
  if(el.getAttribute("data-dar-welcome-two-lines")==="1")el.textContent=full;
  el.removeAttribute("data-dar-welcome-two-lines");el.style.removeProperty("font-size");
  return;
 }
 if(el.getAttribute("data-dar-welcome-two-lines")!=="1"||
    el.textContent.trim()!==full){
  var top=d.createElement("span"),bottom=d.createElement("span");
  top.className="dar-welcome-salam-line";top.textContent=SALAM_FIRST+" ";
  bottom.className="dar-welcome-salam-line";bottom.textContent=SALAM_SECOND;
  top.style.display=bottom.style.display="block";
  top.style.whiteSpace=bottom.style.whiteSpace="nowrap";
  el.replaceChildren(top,bottom);
  el.setAttribute("data-dar-welcome-two-lines","1");
 }
 el.setAttribute("aria-label",full);
 // Fit the longer original line to the actual pane: two lines, no overflow.
 el.style.removeProperty("font-size");
 var ctx=measureContext(),available=el.getBoundingClientRect().width;
 if(!ctx||available<140)return;
 var cs=w.getComputedStyle(el),size=parseFloat(cs.fontSize)||20;
 ctx.font=measureFont(el);
 var required=Math.max(ctx.measureText(SALAM_FIRST).width,ctx.measureText(SALAM_SECOND).width);
 var tracking=Math.max(0,parseFloat(cs.letterSpacing)||0)*SALAM_SECOND.length;
 required+=tracking;
 if(required>available*.97)
  el.style.setProperty("font-size",Math.max(12,Math.floor(size*(available*.95/required)*10)/10)+"px","important");
}
function pyramidTokens(text,l){
 var raw=text.trim().split(/\s+/),out=[];
 for(var i=0;i<raw.length;i++){
  if(l==="de"&&raw.slice(i,i+4).join(" ")==="Āṯār der frühen Imāme"){
   out.push("Āṯār der frühen Imāme");i+=3;
  }else out.push(raw[i]);
 }
 return out;
}
function pyramidLines(el,text,l){
 if(!el)return;
 el.style.setProperty("max-width","100%","important");
 el.style.setProperty("width","100%","important");
 var width=el.getBoundingClientRect().width,ctx=measureContext();
 if(!ctx||width<170)return;
 var style=w.getComputedStyle(el),font=measureFont(el);
 var key=l+"|"+Math.round(width)+"|"+font+"|"+text.length;
 if(el.getAttribute("data-dar-welcome-pyramid")===key&&el.querySelector(".dar-welcome-pyramid-line"))return;
 var tokens=pyramidTokens(text,l),n=tokens.length;
 if(n<4)return;
 ctx.font=font;
 var limit=width*.965,metrics=[],space=ctx.measureText(" ").width;
 for(var i=0;i<n;i++)metrics.push(ctx.measureText(tokens[i]).width*1.045);
 var prefix=[0];for(i=0;i<n;i++)prefix.push(prefix[i]+metrics[i]);
 function spanWidth(start,end){return prefix[end]-prefix[start]+space*1.045*Math.max(0,end-start-1)}
 var total=spanWidth(0,n);
 var first=Math.max(2,Math.ceil(total/limit)+1),last=Math.min(9,n);
 var cuts=null;
 for(var count=first;count<=last&&!cuts;count++){
  var misses=new Set(),iterations=0;
  function walk(start,prev,remaining){
   if(++iterations>16000)return null;
   if(remaining===1){
    var tail=spanWidth(start,n);
    return tail<=limit&&tail>prev+1?[n]:null;
   }
   var id=start+"|"+Math.round(prev)+"|"+remaining;
   if(misses.has(id))return null;
   var candidates=[],availableTotal=spanWidth(start,n);
   var ideal=availableTotal/remaining*.82;
   for(var end=start+1;end<=n-remaining+1;end++){
    var current=spanWidth(start,end);
    if(current>limit)break;
    if(current<=prev+1)continue;
    if(spanWidth(end,n)>limit*(remaining-1)+10*remaining)continue;
    candidates.push({end:end,cost:Math.abs(current-ideal)});
   }
   candidates.sort(function(a,b){return a.cost-b.cost});
   for(var k=0;k<candidates.length;k++){
    var at=candidates[k].end,found=walk(at,spanWidth(start,at),remaining-1);
    if(found)return [at].concat(found);
   }
   misses.add(id);return null;
  }
  cuts=walk(0,0,count);
 }
 if(!cuts){
  // On extreme text scaling, preserve readable, naturally wrapped full text.
  mark(el,text,"summary",l);
  el.removeAttribute("data-dar-welcome-pyramid");
  return;
 }
 var frag=d.createDocumentFragment(),begin=0;
 for(i=0;i<cuts.length;i++){
  var end=cuts[i],line=d.createElement("span");
  line.className="dar-welcome-pyramid-line";
  line.style.display="block";
  line.style.whiteSpace="nowrap";
  // Keep the canonical textContent including the inter-line whitespace.
  var fragment=tokens.slice(begin,end).join(" ")+(i<cuts.length-1?" ":"");
  mark(line,fragment,"summary",l);
  frag.appendChild(line);begin=end;
 }
 el.replaceChildren(frag);
 el.setAttribute("data-dar-welcome-pyramid",key);
}
function layoutExistingWelcome(){
 var l=lang(),t=texts[l];
 [
 ["#darV8TopWelcome",".v8-copy h1","#darV8WelcomeSummary"],
 ["#darAdultHomeWelcomeV5",".dar-adult-home-salam-v5",".dar-adult-home-desc-v7"],
 ["#darHomeV47Welcome",".dar-v47-salam",".dar-v47-intro"],
 ["#darHomeHtmlParityV1 .dhp-welcome",".dhp-greeting",".dhp-intro"]
 ].forEach(function(a){
  var root=d.querySelector(a[0]);if(!root)return;
  splitSalam(root.querySelector(a[1]),t[0],l);
  pyramidLines(root.querySelector(a[2]),t[2],l);
 });
}

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
 layoutExistingWelcome();
}
w.DARAdultHomeWelcomeV1=Object.freeze({apply:apply,lang:lang});
function start(){apply();d.addEventListener("dar:view-rendered",apply);
 ["dar-v8-locale-changed","dar-adult-locale-changed","dar-adult-ui-languages-ready","pageshow"].forEach(function(e){w.addEventListener(e,apply)});
 w.addEventListener("storage",function(e){if(e.key===KEY)apply()});
 // Reflow exactly the same Home mounts on rotation, responsive pane resize,
 // or late font arrival. No extra scroll/DOM observers.
 var queued=false;
 function queue(){if(queued)return;queued=true;w.requestAnimationFrame(function(){queued=false;layoutExistingWelcome()})}
 w.addEventListener("resize",queue,{passive:true});
 w.addEventListener("orientationchange",queue,{passive:true});
 try{if(d.fonts&&d.fonts.ready)d.fonts.ready.then(queue)}catch(_){}
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
