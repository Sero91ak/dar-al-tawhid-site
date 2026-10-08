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
