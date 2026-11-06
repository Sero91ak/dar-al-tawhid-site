/* Public browser-home greeting only. Mirrors the shared nine-locale adult preference.
 * Does not touch visitor app, Kids, prayer, navigation, scroll controllers or push. */
(function(w,d){"use strict";
var api=w.DARAdultComponentI18nV1;
if(!api)return;
var copy={
 de:{welcome:"Willkommen bei DĀR AL TAWḤĪD",summary:"Beiträge aus Qurʾān, authentischer Sunnah und den Āṯār der frühen Imāme. Dazu Duʿāʾ aus Qurʾān und Sunnah."},
 ar:{welcome:"مرحبًا بكم في دار التوحيد",summary:"مقالات من القرآن والسنة الصحيحة وآثار الأئمة المتقدمين، مع أدعية من القرآن والسنة."},
 en:{welcome:"Welcome to DĀR AL TAWḤĪD",summary:"Articles from the Qurʾān, authentic Sunnah and reports of the early Imams, plus Duʿāʾ from the Qurʾān and Sunnah."},
 tr:{welcome:"DĀR AL TAWḤĪD'e hoş geldiniz",summary:"Kur’an, sahih Sünnet ve ilk dönem imamlarının rivayetlerinden yazılar. Ayrıca Kur’an ve Sünnet’ten dualar."},
 ku:{welcome:"Bi xêr hatin DĀR AL TAWḤĪD",summary:"Nivîs ji Qurʾān, Sunnah ya rast û vegotinên îmamên berê. Her wiha duʿā ji Qurʾān û Sunnah."},
 ckb:{welcome:"بەخێربێن بۆ دار التوحید",summary:"بابەت لە قورئان و سوننەتی ڕاست و گێڕانەوەکانی ئیمامانی پێشوو، لەگەڵ دوعاکان لە قورئان و سوننەت."},
 bs:{welcome:"Dobro došli u DĀR AL TAWḤĪD",summary:"Tekstovi iz Kur’ana, vjerodostojnog sunneta i predaja ranih imama, uz dove iz Kur’ana i sunneta."},
 fr:{welcome:"Bienvenue à DĀR AL TAWḤĪD",summary:"Des articles du Qurʾān, de la Sunnah authentique et des récits des premiers imams, ainsi que des duʿāʾ du Qurʾān et de la Sunnah."},
 es:{welcome:"Bienvenido a DĀR AL TAWḤĪD",summary:"Artículos del Qurʾān, la Sunnah auténtica y los relatos de los primeros imames, junto con duʿāʾ del Qurʾān y la Sunnah."}
};
api.register("v8-home-welcome",copy);
function update(){
 var shell=d.getElementById("darV8TopWelcome");
 var title=d.getElementById("darV8WelcomeTitle");
 var summary=d.getElementById("darV8WelcomeSummary");
 if(!shell||!title||!summary)return;
 var locale=api.locale(),full=api.t("v8-home-welcome","welcome",locale);
 var names=["DĀR AL TAWḤĪD","دار التوحيد","دار التوحید"];
 var match=null;
 for(var i=0;i<names.length;i++){var at=full.indexOf(names[i]);if(at!==-1){match={at:at,name:names[i]};break;}}
 if(match){
  var strong=d.createElement("strong");strong.textContent=match.name;
  title.replaceChildren(d.createTextNode(full.slice(0,match.at)),strong,d.createTextNode(full.slice(match.at+match.name.length)));
 }else title.textContent=full;
 summary.textContent=api.t("v8-home-welcome","summary",locale);
 var body=shell.querySelector(".v8-copy");
 if(body){body.setAttribute("lang",locale);body.setAttribute("dir",api.direction(locale));}
 shell.setAttribute("aria-label",full);
}
update();
api.subscribe(update);
w.addEventListener("dar-v8-locale-changed",update);
w.addEventListener("dar-adult-locale-changed",update);
})(window,document);
