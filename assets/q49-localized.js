/* DĀR AL TAWḤĪD — Q49 source/lesson locale adapter.
   One source ID across nine independently reviewable adult-language drafts.
   App language wins; explicit ?lang= may override for a linked source. No OS fallback.
   No external translator, backend AI, notification, or Kids dependency. */
(function(){
"use strict";
var DATA="/assets/q49-locales.json";
var LANGUAGES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var root=document.documentElement, path=location.pathname;
var isSource=/^\/(?:test\/)?q\/49\/?(?:index\.html)?$/.test(path);
var isQuiz=/^\/(?:test\/)?lernen\/recht-der-mutter\/?(?:index\.html)?$/.test(path);
if(!isSource&&!isQuiz)return;
function normalized(value){var v=String(value||"").trim().toLowerCase().replace(/_/g,"-");if(v==="kr")v="ku";if(v==="ku-sorani")v="ckb";return LANGUAGES.indexOf(v)>=0?v:"";}
function selected(){var p=new URLSearchParams(location.search),code=normalized(p.get("lang")||p.get("locale"));if(code)return code;try{return normalized(localStorage.getItem("darAdultPreferredLocaleV1"))||"de"}catch(_){return "de"}}
function link(path,code){var u=new URL(path,location.origin);u.searchParams.set("lang",code);return u.pathname+u.search}
function node(tag,klass,value){var el=document.createElement(tag);if(klass)el.className=klass;if(value!==undefined&&value!==null)el.textContent=String(value);return el}
function text(parent,tag,klass,value){var x=node(tag,klass,value);parent.appendChild(x);return x}
function section(parent,index,title){var s=node("section","qsource-section q49-localized-section");s.id="q49-section-"+index;var h=node("div","qsource-section-head");text(h,"div","qsource-num",index);text(h,"h3","qsource-section-title",title);s.appendChild(h);parent.appendChild(s);return s}
function paragraph(parent,value,klass){return text(parent,"p",klass||"q49-note",value)}
function label(parent,value){return text(parent,"p","q49-label",value)}
function original(parent,value){if(!value)return;var p=paragraph(parent,value,"q49-ar qsource-arabic");p.lang="ar";p.dir="rtl"}
function addChoiceControl(parent,pack,code){
 var bar=node("div","q49-language-bar"),lab=node("label","q49-language-label",pack.ui.language+" · ");
 lab.htmlFor="q49-language-select";
 var sel=node("select","q49-language-select");sel.id="q49-language-select";sel.setAttribute("aria-label",pack.ui.language);
 LANGUAGES.forEach(function(k){if(!window.__darQ49AvailableLocales||!window.__darQ49AvailableLocales[k])return;
 var op=node("option","",window.__darQ49AvailableLocales[k].name);op.value=k;op.selected=k===code;sel.appendChild(op)});
 sel.addEventListener("change",function(){location.href=link(isQuiz?"/lernen/recht-der-mutter/":"/q/49/",sel.value)});
 bar.appendChild(lab);bar.appendChild(sel);
 var badge=text(bar,"small","q49-draft-note",pack.ui.draftNotice);badge.setAttribute("role","status");
 parent.insertBefore(bar,parent.querySelector(".qsource-hero")||parent.querySelector(".card")||parent.firstChild);
}
function action(parent,title,url){var a=node("a","q49-action",title);a.href=url;parent.appendChild(a);return a}
function chatContext(pack,code){return pack.ui.chatAction+": "+pack.title+". Q49 · al-Adab al-Mufrad 4; Ṣaḥīḥ al-Buḫārī 5971; Muslim 2548. "+pack.primary}
function addActions(parent,pack,code){
 var bar=node("div","q49-actions");action(bar,pack.ui.quizAction,link("/lernen/recht-der-mutter/",code));
 var chat=action(bar,pack.ui.chatAction,"/#ilm");
 chat.dataset.qsourceId="qsource:49";chat.dataset.locale=code;
 chat.addEventListener("click",function(){try{sessionStorage.setItem("darIlmQ49ContextV1",JSON.stringify({sourceId:"qsource:49",locale:code,question:chatContext(pack,code),sourceUrl:link("/q/49/",code)}))}catch(_){}});
 parent.appendChild(bar);
}
function localizedSource(pack,code,data){
 var main=document.querySelector(".qsource-page");if(!main)return;
 var old=Array.prototype.slice.call(main.querySelectorAll(".qsource-section"));
 if(old.length!==6)return; /* Never blank a card if its original structure changed. */
 var originalArabic=old.slice(0,4).map(function(s){var e=s.querySelector(".q49-ar");return e?e.textContent:""});
 var grouped=old[4].querySelectorAll(".qsource-links");
 if(grouped.length!==3)return;
 var sourceGroups=Array.prototype.map.call(grouped,function(g){return g.cloneNode(true)});
 var hero=main.querySelector(".qsource-hero");
 if(hero){var t=hero.querySelector(".qsource-title"),q=hero.querySelector(".qsource-quote"),meta=hero.querySelector(".qsource-meta");
 if(t)t.textContent=pack.title.toLocaleUpperCase(code==="tr"?"tr-TR":undefined);
 if(q)q.textContent="“"+pack.primary+"”";
 if(meta){meta.replaceChildren();var row=node("div","qsource-meta-row");
 text(row,"div","qsource-meta-label",pack.ui.sourceTitle);
 text(row,"div","qsource-meta-value","Q49 · al-Adab al-Mufrad 4 · Ṣaḥīḥ al-Buḫārī 5971 · Muslim 2548");
 meta.appendChild(row)}
 }
 var first=old[0],wrapper=node("div","q49-translated-content");wrapper.lang=code;wrapper.dir=pack.dir;
 var a=section(wrapper,1,pack.ui.primaryTitle);
 label(a,"🖋️ "+pack.speaker);
 paragraph(a,"“"+pack.primary+"”","q49-statement");
 label(a,pack.ui.arabicOriginal);original(a,originalArabic[0]||data.sourceArabic.primary);
 paragraph(a,pack.ui.mawqufNote);
 paragraph(a,pack.ui.chain+": Saʿīd ibn Abī Maryam → Muḥammad ibn Ǧaʿfar ibn Abī Kaṯīr → Zayd ibn Aslam → ʿAṭāʾ ibn Yasār → Ibn ʿAbbās.");
 var b=section(wrapper,2,pack.ui.contextTitle);
 paragraph(b,pack.context);label(b,pack.ui.arabicOriginal);original(b,originalArabic[1]);paragraph(b,pack.ui.rightsLimit);
 var c=section(wrapper,3,pack.ui.hadithTitle);
 label(c,"🖋️ "+pack.secondarySpeaker);paragraph(c,pack.secondary,"q49-statement");
 label(c,pack.ui.arabicOriginal);original(c,originalArabic[2]||data.sourceArabic.secondary);
 paragraph(c,pack.ui.classification+": marfūʿ · ṣaḥīḥ · al-Buḫārī 5971 · Muslim 2548");
 paragraph(c,pack.ui.chain+": Qutaybah ibn Saʿīd → Ǧarīr ibn ʿAbd al-Ḥamīd → ʿUmārah ibn al-Qaʿqāʿ → Abū Zurʿah → Abū Hurayrah → Prophet ﷺ.");
 var d=section(wrapper,4,pack.ui.sharhTitle);
 paragraph(d,pack.sharh);
 label(d,pack.ui.arabicOriginal);original(d,originalArabic[3]);
 paragraph(d,pack.ui.sharhLimit);
 paragraph(d,pack.ui.precedenceNote);
 var e=section(wrapper,5,pack.ui.referencesTitle);
 [pack.ui.sourceGroupA,pack.ui.sourceGroupB,pack.ui.sourceGroupC].forEach(function(title,i){
 label(e,String.fromCharCode(65+i)+" · "+title);
 var g=sourceGroups[i];
 var offset=i===0?0:(i===1?3:5);
 Array.prototype.forEach.call(g.querySelectorAll(".qsource-link-title"),function(title,n){if(data.sourceLinkTitles&&data.sourceLinkTitles[offset+n])title.textContent=data.sourceLinkTitles[offset+n]});
 Array.prototype.forEach.call(g.querySelectorAll(".qsource-link-sub"),function(sub){sub.textContent=pack.ui.sourceAction});
 e.appendChild(g);
 });
 paragraph(e,pack.ui.arabicPreserved,"q49-small");
 var f=section(wrapper,6,pack.ui.conclusionTitle);
 paragraph(f,pack.conclusion);
 paragraph(f,pack.ui.editorialNotice);
 addActions(wrapper,pack,code);
 main.insertBefore(wrapper,first);
 old.forEach(function(s){s.hidden=true;s.style.display="none"});
 var oldLink=main.querySelector(".qsource-learning");
 if(oldLink){oldLink.hidden=true;oldLink.style.display="none";}
 document.title=pack.title+" | Q49 · DĀR AL TAWḤĪD";
}
function localizedQuiz(pack,code){
 var oldQuiz=document.getElementById("quiz"),oldResult=document.getElementById("result");
 if(!oldQuiz||!oldResult||!Array.isArray(pack.questions)||pack.questions.length!==4)return;
 /* Clone removes German fallback listeners, but leaves the existing screen design untouched. */
 var quiz=oldQuiz.cloneNode(true),result=oldResult.cloneNode(true);
 oldQuiz.parentNode.replaceChild(quiz,oldQuiz);oldResult.parentNode.replaceChild(result,oldResult);
 var el=function(id){return document.getElementById(id)},index=0,points=0,answered=false,ui=pack.quizUi;
 var title=document.querySelector("h1");if(title)title.textContent=ui.title.toLocaleUpperCase(code==="tr"?"tr-TR":undefined);
 var kicker=document.querySelector(".kicker");if(kicker)kicker.textContent=ui.title+" · 4";
 document.title=ui.title+" | Q49 · DĀR AL TAWḤĪD";
 var header=document.querySelector("main header");
 if(header)addChoiceControl(header,pack,code);
 function render(){
 answered=false;var q=pack.questions[index];el("count").textContent=ui.question+" "+(index+1)+" "+ui.of+" "+pack.questions.length;
 el("score").textContent=points+" "+ui.correct;el("question").textContent=q.question;
 el("feedback").textContent="";el("next").disabled=true;
 el("next").textContent=index===pack.questions.length-1?ui.result:ui.next;
 var opts=el("options");opts.replaceChildren();
 q.choices.forEach(function(answer,n){var b=node("button","option",String.fromCharCode(65+n)+". "+answer);
 b.type="button";b.addEventListener("click",function(){if(answered)return;answered=true;if(n===q.correct)points++;
 Array.prototype.forEach.call(opts.querySelectorAll("button"),function(x,i){x.disabled=true;if(i===q.correct)x.dataset.state="right";else if(i===n)x.dataset.state="wrong"});
 el("feedback").textContent=(n===q.correct?ui.yes:ui.no)+" "+q.explanation;el("score").textContent=points+" "+ui.correct;el("next").disabled=false});opts.appendChild(b)});
 }
 el("next").addEventListener("click",function(){if(!answered)return;if(index<pack.questions.length-1){index++;render()}else{quiz.hidden=true;result.hidden=false;result.querySelector("h2").textContent=ui.finished;el("final").textContent=points+" "+ui.of+" "+pack.questions.length+" "+ui.correct;el("retry").textContent=ui.retry;}});
 el("retry").addEventListener("click",function(){index=0;points=0;result.hidden=true;quiz.hidden=false;render()});
 render();
}
function style(){
 var c=node("style");c.textContent=".q49-language-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0;padding:13px 16px;border:1px solid #ad9c7b;border-radius:15px;background:rgba(165,141,93,.07);color:inherit}.q49-language-label{font-weight:750}.q49-language-select{font:inherit;color:inherit;background:transparent;border:1px solid #ad9c7b;border-radius:9px;min-height:40px;padding:5px 10px;max-width:100%}.q49-draft-note{font-size:.76rem;opacity:.85;flex-basis:100%}.q49-actions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 28px}.q49-action{display:inline-flex;align-items:center;min-height:45px;padding:10px 15px;border-radius:12px;background:rgba(168,139,77,.16);border:1px solid #b49b6b;color:inherit;text-decoration:none;font-weight:700}.q49-return{margin:10px 0}.q49-translated-content .q49-statement{white-space:pre-line}.q49-translated-content .q49-ar{text-align:right;direction:rtl}.q49-translated-content[dir=rtl]{text-align:right}.q49-translated-content[dir=rtl] .qsource-links{text-align:right}.q49-translated-content[dir=rtl] .qsource-section-head{direction:rtl}html[dir=rtl] .option{text-align:right;direction:rtl}html[dir=rtl] .feedback{text-align:right}html[dir=rtl] .progress{direction:rtl}html[dir=rtl] .q49-language-bar{direction:rtl}";
 document.head.appendChild(c);
}
fetch(DATA,{cache:"no-store",credentials:"same-origin"}).then(function(res){if(!res.ok)throw Error("Q49 locale asset HTTP "+res.status);return res.json()}).then(function(data){
 if(data.qSourceId!=="qsource:49"||!data.locales)throw Error("Invalid Q49 locale payload");
 window.__darQ49AvailableLocales=data.locales;
 var requested=selected(),code=data.locales[requested]?requested:"de",pack=data.locales[code];
 if(!pack||!pack.primary||!Array.isArray(pack.questions))throw Error("Missing Q49 locale");
 root.lang=code;root.dir=pack.dir;style();
 if(isSource){var main=document.querySelector(".qsource-page");if(main){addChoiceControl(main,pack,code);if(code!=="de")localizedSource(pack,code,data);
 else{var title=document.querySelector(".qsource-title");if(title)title.textContent=pack.title.toLocaleUpperCase("de-DE");
 addActions(main,pack,code);var oldLink=main.querySelector(".qsource-learning");if(oldLink)oldLink.href=link("/lernen/recht-der-mutter/",code);}}}
 if(isQuiz)localizedQuiz(pack,code);
 window.dispatchEvent(new CustomEvent("dar:q49:locale-ready",{detail:{contentId:data.contentId,qSourceId:data.qSourceId,locale:code,reviewStatus:pack.reviewStatus}}));
}).catch(function(error){/* Existing German source and fallback quiz must remain readable. */
 if(!isSource)return;var main=document.querySelector(".qsource-page");if(main){var p=node("p","q49-note","Quellen- und Sprachauswahl vorübergehend nicht verfügbar. Der deutsche Originaltext bleibt unten lesbar.");main.insertBefore(p,main.querySelector(".qsource-section")||main.firstChild)}
 console.warn("[Q49] locale data unavailable; original page retained",error&&error.message);
});
})();
