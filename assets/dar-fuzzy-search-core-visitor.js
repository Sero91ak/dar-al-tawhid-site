/* DĀR Test – normalized fuzzy search core. Adult test only. */
(function(g){"use strict";
if(g.DarTestFuzzyCore)return;
var groups={
 tawhid:"tawhid tauhid tawheed tevhid tewhid tawhied tawhit",
 iman:"iman imaan iiman eman imann",
 quran:"quran koran quraan koranvers",
 hadith:"hadith hadis hadeeth hadit",
 aqidah:"aqidah aqida akida akidah aqeedah",
 dua:"dua duaa bittgebet",
 shirk:"shirk schirk schirkh",
 taghut:"taghut tagut taghoot taghout",
 salah:"salah salat namaz gebet",
 sunnah:"sunnah sunna",
 athar:"athar athaar",
 dhikr:"dhikr zikr"
};
var rev=Object.create(null);
function norm(v){return String(v||"").toLowerCase().normalize("NFKD")
 .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g,"")
 .replace(/ß/g,"ss").replace(/æ/g,"ae").replace(/œ/g,"oe")
 .replace(/[ʾʿ‘’'\x60´ʻʼ]/g,"").replace(/[^\p{L}\p{N}]+/gu," ")
 .trim().replace(/\s+/g," ");}
for(const key of Object.keys(groups))for(const word of groups[key].split(" "))rev[norm(word)]=key;
var ignore=new Set(["der","die","das","den","dem","des","ein","eine","einen","im","in","und","oder","mit","von","vom","zu","uber","für","fur","über"]);
function words(v){return norm(v).split(" ").filter(x=>x&&!ignore.has(x)).map(x=>rev[x]||x);}
function lev(a,b){
 if(Math.abs(a.length-b.length)>2)return 3;
 var prev=Array.from({length:b.length+1},(_,i)=>i),next=new Array(b.length+1);
 for(var i=1;i<=a.length;i++){
  next[0]=i;var minimum=i;
  for(var j=1;j<=b.length;j++){
   next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(next[j]<minimum)minimum=next[j];
  }
  if(minimum>2)return 3;
  var swap=prev;prev=next;next=swap;
 }
 return prev[b.length];
}
function make(label,group,route,aliases,hash){
 const termList=words(label+" "+(aliases||""));
 return {label:String(label).slice(0,160),group,route,hash:hash||"",tokens:[...new Set(termList)]};
}
function score(query,item){
 const ask=words(query),cand=item.tokens||[];
 if(!ask.length)return 0;var points=0;
 for(const q of ask){
  if(cand.includes(q))points+=12;
  else if(cand.some(w=>q.length>=3&&w.startsWith(q)))points+=8;
  else if(q.length>=4&&cand.some(w=>w.length>=4&&lev(q,w)<=(q.length<=5?1:2)))points+=4;
  else return 0;
 }
 if(norm(item.label)===norm(query))points+=12;
 return points;
}
g.DarTestFuzzyCore={norm,words,lev,make,score};
})(window);
