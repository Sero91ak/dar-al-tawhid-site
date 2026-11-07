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

/* One semantic title, two visual levels. The original localised sentence
 * stays intact as the accessible label (especially Turkish word order). */
function splitTitle(el,title,l){
 if(!el)return;
 var brands=["DĀR AL TAWḤĪD","دار التوحيد","دار التوحید"];
 var brand=brands.find(function(v){return title.indexOf(v)!==-1});
 if(!brand){mark(el,title,"title",l);return}
 var stamp=l+"|"+title;
 if(el.getAttribute("data-dar-welcome-title")===stamp&&el.querySelector(".dar-welcome-brand"))return;
 var intro=l==="tr"?"Hoş geldiniz":title.replace(brand,"").trim();
 if(!intro){mark(el,title,"title",l);return}
 var kicker=d.createElement("span"),name=d.createElement("strong");
 kicker.className="dar-welcome-kicker";
 name.className="dar-welcome-brand";
 kicker.textContent=intro+" ";name.textContent=brand;
 el.replaceChildren(kicker,name);
 el.setAttribute("data-dar-welcome-title",stamp);
 el.setAttribute("aria-label",title);
}

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
 var first=SALAM_FIRST,second=SALAM_SECOND;
 if(l==="ar"){first="السَّلَامُ عَلَيْكُمْ";second="وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ"}
 if(l==="ckb"){first="السلام علیکم";second="ورحمة الله وبرکاته"}
 if(full!==first+" "+second){
  if(el.getAttribute("data-dar-welcome-two-lines")==="1")el.textContent=full;
  el.removeAttribute("data-dar-welcome-two-lines");el.style.removeProperty("font-size");
  return;
 }
 if(el.getAttribute("data-dar-welcome-two-lines")!=="1"||
    el.textContent.trim()!==full){
  var top=d.createElement("span"),bottom=d.createElement("span");
  top.className="dar-welcome-salam-line";top.textContent=first+" ";
  bottom.className="dar-welcome-salam-line";bottom.textContent=second;
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
 var required=Math.max(ctx.measureText(first).width,ctx.measureText(second).width);
 var tracking=Math.max(0,parseFloat(cs.letterSpacing)||0)*Math.max(first.length,second.length);
 required+=tracking;
 if(required>available*.97)
  el.style.setProperty("font-size",Math.max(12,Math.floor(size*(available*.95/required)*10)/10)+"px","important");
}
function pyramidTokens(text,l){
 // Individual words give narrow panes enough natural break opportunities.
 // Long highlighted phrases are still highlighted word by word below.
 return text.trim().split(/\s+/);
}
function pyramidLines(el,text,l){
 if(!el)return;
 // Fill actual content width (Fold/Stage Manager) but keep long desktop
 // paragraphs comfortably readable: never a narrow phone column on iPad.
 el.style.setProperty("width","100%","important");
 el.style.setProperty("max-width","min(100%, 980px)","important");
 var width=el.getBoundingClientRect().width,ctx=measureContext();
 if(!ctx||width<165){mark(el,text,"summary",l);return}
 var style=w.getComputedStyle(el),font=measureFont(el);
 var key=l+"|"+Math.round(width)+"|"+font+"|"+text;
 if(el.getAttribute("data-dar-welcome-pyramid")===key&&el.querySelector(".dar-welcome-pyramid-line"))return;
 var tokens=pyramidTokens(text,l),n=tokens.length;
 if(n<4){mark(el,text,"summary",l);return}
 // Measure bold emphasis at its actual weight instead of treating it
 // as normal text: visual lines must not overflow after highlighting.
 var strongWords=l==="de"?["Āṯār der frühen Imāme","Duʿāʾ-Sammlung","Qurʾān","Sunnah"]:[];
 var emphasis=strongWords.map(function(v){var pos=text.indexOf(v);return{start:pos,end:pos+v.length}})
  .filter(function(x){return x.start>=0});
 var at=0,tokenPositions=tokens.map(function(token){
  var pos=text.indexOf(token,at);at=pos+token.length;return pos
 });
 function highlighted(index){
  return emphasis.some(function(r){return tokenPositions[index]>=r.start&&tokenPositions[index]<r.end})
 }
 var metrics=[],space=0;
 ctx.font=font;space=ctx.measureText(" ").width*1.04;
 for(var i=0;i<n;i++){
  ctx.font=measureFont(el,highlighted(i)?"750":null);
  metrics.push(ctx.measureText(tokens[i]).width*1.055);
 }
 var prefix=[0];for(i=0;i<n;i++)prefix.push(prefix[i]+metrics[i]);
 function spanWidth(start,end){return prefix[end]-prefix[start]+space*Math.max(0,end-start-1)}
 var limit=width*.94,total=spanWidth(0,n);
 var fromCount=Math.max(2,Math.ceil(total/limit)),toCount=Math.min(9,n);
 var cuts=null;
 // Minimise raggedness against a gently rising width target. A short
 // first line such as "Eine geordnete" is never a desirable pyramid.
 for(var count=fromCount;count<=toCount&&!cuts;count++){
  var weights=Array.from({length:count},function(_,idx){return .56+.44*idx/Math.max(1,count-1)});
  var weightSum=weights.reduce(function(a,b){return a+b},0);
  var attempts=0,memo=new Map();
  function solve(row,start,previous){
   if(row===count)return start===n?{score:0,cuts:[]}:null;
   if(++attempts>24000)return null;
   var id=row+"|"+start+"|"+Math.round(previous*10);
   if(memo.has(id))return memo.get(id);
   var best=null,last=n-(count-row-1);
   for(var end=start+1;end<=last;end++){
    var current=spanWidth(start,end);
    if(current>limit)break;
    // Gentle taper is preferred but a small last-line decrease is better
    // than starting with a two-word orphan or clipping an important term.
    if(row===0&&count>2&&current<limit*.40)continue;
    if(row===count-1&&end!==n)continue;
    if(row<count-1&&spanWidth(end,n)>(count-row-1)*limit+space)continue;
    var target=total*weights[row]/weightSum;
    var score=Math.pow((current-target)/limit,2);
    if(row>0&&current<previous)
     score+=1.5+16*Math.pow((previous-current)/limit,2);
    else if(row>0&&current<previous+7)score+=.12;
    var tail=solve(row+1,end,current);
    if(!tail)continue;
    var candidate={score:score+tail.score,cuts:[end].concat(tail.cuts)};
    if(!best||candidate.score<best.score)best=candidate;
   }
   memo.set(id,best);return best;
  }
  var result=solve(0,0,0);
  if(result)cuts=result.cuts;
 }
 if(!cuts){
  el.replaceChildren();
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
  for(var j=begin;j<end;j++){
   if(j>begin)line.appendChild(d.createTextNode(" "));
   if(highlighted(j)){
    var strong=d.createElement("strong");strong.textContent=tokens[j];line.appendChild(strong);
   }else line.appendChild(d.createTextNode(tokens[j]));
  }
  if(i<cuts.length-1)line.appendChild(d.createTextNode(" "));
  frag.appendChild(line);begin=end;
 }
 el.replaceChildren(frag);
 // Rendering, language switches and large-text zoom all retain the entire
 // string. If a font replaces late and makes a line too wide, unwrap safely.
 if(Array.from(el.children).some(function(line){return line.scrollWidth>width+2})){
  el.replaceChildren();
  mark(el,text,"summary",l);
  el.removeAttribute("data-dar-welcome-pyramid");
  return;
 }
 el.setAttribute("aria-label",text);
 el.setAttribute("data-dar-welcome-pyramid",key);
}
var resizeObserver=null,layoutQueued=false;
function queueLayout(){
 if(layoutQueued)return;layoutQueued=true;
 w.requestAnimationFrame(function(){layoutQueued=false;layoutExistingWelcome()})
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
  var summary=root.querySelector(a[2]);
  pyramidLines(summary,t[2],l);
  if(summary&&typeof w.ResizeObserver==="function"){
   if(!resizeObserver)resizeObserver=new w.ResizeObserver(queueLayout);
   if(!summary.hasAttribute("data-dar-welcome-observed")){
    resizeObserver.observe(summary);
    summary.setAttribute("data-dar-welcome-observed","1");
   }
  }
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
  splitTitle(ttl,t[1],l);mark(sum,t[2],"summary",l);
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
 // One existing component owner; resize only the measured welcome pane.
 w.addEventListener("resize",queueLayout,{passive:true});
 w.addEventListener("orientationchange",queueLayout,{passive:true});
 try{if(d.fonts&&d.fonts.ready)d.fonts.ready.then(queueLayout)}catch(_){}
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
