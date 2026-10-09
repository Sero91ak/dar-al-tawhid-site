/* DĀR AL TAWḤĪD Kids – Arabisch ↔ Deutsch, gemeinsame Begriffserklärungen. */
(function(){
  "use strict";
  var TERMS=[
    {id:"dua",ar:"دُعَاء",name:"Duʿāʾ",de:"Bittgebet",basic:"Wir bitten Allah um etwas.",deep:"Ein Duʿāʾ ist eine Bitte oder ein Anrufen Allahs.",aliases:["Duʿāʾ","Du'a","Dua","Duā","Bittgebet"]},
    {id:"salah",ar:"صَلَاة",name:"Ṣalāh",de:"rituelles Gebet",basic:"Das Gebet hat festgelegte Worte und Bewegungen.",deep:"Ṣalāh ist das vorgeschriebene Gebet mit bestimmten Handlungen und Worten.",aliases:["Ṣalāh","Salah","Salāh"]},
    {id:"wudu",ar:"وُضُوء",name:"Wuḍūʾ",de:"Gebetswaschung",basic:"Wir waschen bestimmte Körperteile vor dem Gebet.",deep:"Wuḍūʾ bezeichnet die vorgeschriebene rituelle Waschung, zum Beispiel vor der Ṣalāh.",aliases:["Wuḍūʾ","Wudu","Wudhu"]},
    {id:"sawm",ar:"صَوْم",name:"Ṣawm",de:"Fasten",basic:"Beim Fasten verzichten wir tagsüber auf Essen und Trinken.",deep:"Ṣawm ist das Fasten für Allah nach seinen vorgeschriebenen Regeln.",aliases:["Ṣawm","Sawm"]},
    {id:"zakat",ar:"زَكَاة",name:"Zakāh",de:"verpflichtende Abgabe",basic:"Wer die Voraussetzungen erfüllt, gibt einen Teil seines Vermögens an Berechtigte.",deep:"Zakāh ist eine vorgeschriebene Abgabe aus bestimmten Vermögensarten an festgelegte Empfänger.",aliases:["Zakāh","Zakat","Zakāt"]},
    {id:"tawhid",ar:"تَوْحِيد",name:"Tawḥīd",de:"Allahs Einzigkeit",basic:"Allah ist der Eine, und nur Ihn beten wir an.",deep:"Tawḥīd bedeutet, Allahs Einzigkeit anzuerkennen und die Anbetung allein Ihm zu widmen.",aliases:["Tawḥīd","Tawhid","Tauhid"]},
    {id:"iman",ar:"إِيمَان",name:"Īmān",de:"Glaube",basic:"Wir glauben an Allah und das, was Er uns offenbart hat.",deep:"Īmān ist der islamische Glaube; er betrifft Herz, Worte und Taten.",aliases:["Īmān","Iman","Imaan"]},
    {id:"sunnah",ar:"سُنَّة",name:"Sunnah",de:"überlieferter Weg des Propheten ﷺ",basic:"Wir lernen, was der Prophet ﷺ lehrte und tat.",deep:"Sunnah bezeichnet den überlieferten Weg des Propheten ﷺ, seine Aussagen, Handlungen und Billigungen.",aliases:["Sunnah","Sunna"]},
    {id:"hadith",ar:"حَدِيث",name:"Ḥadīṯ",de:"Überlieferung",basic:"Ein Ḥadīṯ berichtet uns etwas über den Propheten ﷺ.",deep:"Ein Ḥadīṯ ist ein überlieferter Bericht über Aussagen, Handlungen oder Billigungen des Propheten ﷺ.",aliases:["Ḥadīṯ","Ḥadīth","Hadith","Hadīth"]},
    {id:"tawakkul",ar:"تَوَكُّل",name:"Tawakkul",de:"Vertrauen auf Allah",basic:"Wir tun, was wir können, und vertrauen auf Allah.",deep:"Tawakkul ist Vertrauen auf Allah, während wir die erlaubten Mittel ergreifen.",aliases:["Tawakkul"]},
    {id:"shirk",ar:"شِرْك",name:"Shirk",de:"Beigesellung",basic:"Shirk bedeutet, Allah andere in der Anbetung beizugesellen.",deep:"Shirk bedeutet, Allah in etwas, das Ihm allein zusteht, etwas oder jemanden beizugesellen.",aliases:["Shirk","Širk"]},
    {id:"sahabah",ar:"الصَّحَابَة",name:"Ṣaḥābah",de:"Gefährten des Propheten ﷺ",basic:"Menschen, die den Propheten ﷺ als Gläubige getroffen haben.",deep:"Ṣaḥābah sind die Gefährten, die dem Propheten ﷺ im Glauben begegneten und als Muslime starben.",aliases:["Ṣaḥābah","Sahaba","Sahabah","Ṣaḥābī","Sahabi"]},
    {id:"ayah",ar:"آيَة",name:"Āyah",de:"Qurʾān-Vers",basic:"Eine Āyah ist ein Vers im Qurʾān.",deep:"Āyah bedeutet Zeichen und bezeichnet im Qurʾān einen einzelnen Vers.",aliases:["Āyah","Ayah","Āyāt"]},
    {id:"surah",ar:"سُورَة",name:"Sūrah",de:"Qurʾān-Kapitel",basic:"Eine Sūrah ist ein Kapitel im Qurʾān.",deep:"Sūrah ist die arabische Bezeichnung für ein Kapitel des Qurʾān.",aliases:["Sūrah","Surah","Sura"]},
    {id:"ibadah",ar:"عِبَادَة",name:"ʿIbādah",de:"Anbetung",basic:"Wir dienen Allah mit dem, was Er liebt.",deep:"ʿIbādah umfasst Anbetung und Gehorsam gegenüber Allah auf die vorgeschriebene Weise.",aliases:["ʿIbādah","Ibadah","ʿIbāda"]},
    {id:"dhikr",ar:"ذِكْر",name:"Ḏikr",de:"Gedenken Allahs",basic:"Wir erinnern uns an Allah und lobpreisen Ihn.",deep:"Ḏikr ist das Gedenken Allahs, etwa durch Lobpreisung und überlieferte Worte.",aliases:["Ḏikr","Dhikr","Zikr"]},
    {id:"istighfar",ar:"اسْتِغْفَار",name:"Istiġfār",de:"Allah um Vergebung bitten",basic:"Wir bitten Allah, uns unsere Sünden zu vergeben.",deep:"Istiġfār heißt, Allah um die Vergebung unserer Sünden zu bitten.",aliases:["Istiġfār","Istighfar"]},
    {id:"shayatin",ar:"شَيَاطِين",name:"Shayāṭīn",de:"Teufel",basic:"Das ist die Mehrzahl von Shayṭān.",deep:"Shayāṭīn ist die arabische Mehrzahl von Shayṭān.",aliases:["Shayāṭīn","Shayatin","Shayṭān","Shaitan"]}
  ];
  function occurs(text,alias){
    var escaped=alias.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&");
    try{return new RegExp("(^|[^\\p{L}\\p{M}])"+escaped+"(?=$|[^\\p{L}\\p{M}])","iu").test(text)}
    catch(_){return text.toLowerCase().indexOf(alias.toLowerCase())!==-1}
  }
  function find(text,opts){
    opts=opts||{};
    var hay=String(text||"").normalize("NFC");
    var hits=opts.forceDua?[TERMS[0]]:[];
    TERMS.forEach(function(t){
      if(hits.indexOf(t)!==-1)return;
      if(t.aliases.some(function(alias){return occurs(hay,alias)})||occurs(hay,t.ar))hits.push(t);
    });
    return hits.slice(0,Math.min(3,Math.max(0,Number(opts.max||2))));
  }
  function ensureStyle(){
    if(document.getElementById("kidsTermLearningStyle"))return;
    var s=document.createElement("style");
    s.id="kidsTermLearningStyle";
    s.textContent=".kids-term-learning{margin:7px 0 4px;padding:7px 2px 2px;border-top:1px solid rgba(222,187,113,.28);color:#f6ebd5;line-height:1.4;text-align:left}.kids-term-learning-label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;color:#eac777;margin-bottom:3px}.kids-term-learning-item{font-size:clamp(12px,3.15vw,15px);padding:3px 0}.kids-term-learning-item strong{font-weight:800;color:#f6d58f}.kids-term-learning-item .kids-term-meaning{display:block;color:#f2e9d8;opacity:.92;font-size:.94em;line-height:1.4}#quizTermLearning.kids-term-learning{margin-top:7px;max-width:560px}@media(min-width:768px){.kids-term-learning-item{font-size:15px}}";
    document.head.appendChild(s);
  }
  function render(slot,text,opts){
    if(!slot)return [];
    opts=opts||{};
    var hits=find(text,opts);
    slot.replaceChildren();
    slot.className="kids-term-learning";
    slot.hidden=!hits.length;
    if(!hits.length)return hits;
    ensureStyle();
    slot.setAttribute("aria-label","Arabische Begriffe und ihre deutsche Bedeutung");
    var head=document.createElement("span");
    head.className="kids-term-learning-label";
    head.textContent="WORTWISSEN · ARABISCH ↔ DEUTSCH";
    slot.appendChild(head);
    var young=/^(4|4-6|4–5)/.test(String(opts.age||""));
    hits.forEach(function(t){
      var row=document.createElement("div");
      row.className="kids-term-learning-item";
      var title=document.createElement("strong");
      title.textContent=t.name+" ("+t.ar+") ↔ "+t.de;
      var definition=document.createElement("span");
      definition.className="kids-term-meaning";
      definition.textContent=young?t.basic:t.deep;
      row.appendChild(title);row.appendChild(definition);slot.appendChild(row);
    });
    return hits;
  }
  window.DARKidsTermLearning={find:find,render:render,terms:TERMS};
})();
