#!/usr/bin/env node
const fs=require('node:fs');
const txt=fs.readFileSync('index.html','utf8');
console.log('INDEX_LENGTH',txt.length,'LINES',txt.split('\n').length);
function show(term,max=18,before=230,after=520) {
 const arr=[];let idx=0;
 while((idx=txt.indexOf(term,idx))>=0&&arr.length<max) {
   arr.push(txt.slice(Math.max(0,idx-before),Math.min(txt.length,idx+after)).replace(/\s+/g,' ').slice(0,before+after)); idx+=term.length;
 }
 console.log('TERM',term,'COUNT_SHOWN',arr.length);
 arr.forEach((x,i)=>console.log('MATCH',i,x));
}
for(const term of [
'.post-slide','slide-title','slide-body','slide-content','slide-quote','slide-stage',
'slideReader','slides-panel','slide-card','SLIDE ', 'postSlide',
'--slide-bg','function renderPostSlides','slidePages','slideIndex',
'min-height:100vh','min-height: 100vh','space-between','grid-template-rows:'
])show(term,term==='space-between'||term==='grid-template-rows:'?8:16,220,390);

console.log('--- SLIDE TRACK RENDER AND LATE OVERRIDES ---');
for(const term of ['post-slide-track','post-slide-window','post-slide-footer','post-slide-kicker','post-slide-quote','slide-index','slideTrack','slidesTrack','data-slide-index','data-slide-nav','post-slide-count']) {
 const all=[];let i=0;
 while((i=txt.indexOf(term,i))>=0) {all.push(i);i+=term.length;}
 console.log('ALL',term,'COUNT',all.length);
 for(const pos of all.slice(-15)){
   const n=txt.slice(0,pos).split('\n').length;
   console.log('ATLINE',n,txt.slice(Math.max(0,pos-280),Math.min(txt.length,pos+660)).replace(/\s+/g,' ').slice(0,940));
 }
}
