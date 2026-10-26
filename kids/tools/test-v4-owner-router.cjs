"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const src=fs.readFileSync("kids/owner-voice.js","utf8");
const m=src.match(/  window\.quizSpeak=function\(text,options\)\{[\s\S]*?\n  \};/);
assert.ok(m,"ownerVoice must route quizSpeak global override");
const q={id:"kids-quiz-001",ageBand:"4-6",source:"Qurʾān 1:5"};
const plays=[];
const approved={
 has(question,part){return question===q&&part==="question"},
 play(question,part,opts){plays.push(["new",question.id,part]);return true},
 stop(){plays.push(["stop"])}
};
const win={DARKidsQuizV4Approved:approved}; // Test without any globally published question pool.
const legacy=(text,opts)=>{plays.push(["old",text]);return true};
const assign=new Function("window","play",m[0]+"\nreturn window.quizSpeak;");
const route=assign(win,legacy);
assert.equal(route("old",{quizId:q.id,quizQuestion:q,quizPart:"question",source:"kids-quiz-question"}),true);
assert.equal(plays.filter(z=>z[0]==="new").length,1);
assert.equal(plays.filter(z=>z[0]==="old").length,0);
assert.equal(route("fallback",{quizId:"wrong-id",quizQuestion:q,quizPart:"question"}),true);
assert.equal(plays.filter(z=>z[0]==="old").length,1);
assert.equal(route("normal dua narration",{source:"dua"}),true);
assert.equal(plays.filter(z=>z[0]==="old").length,2);
for(const path of ["kids/index.html","kids/start.html","kids/shell.html"]){
 const html=fs.readFileSync(path,"utf8");
 assert.ok(html.includes('quizPart:"question"'),path+" missing question ID");
 assert.ok(html.includes('quizPart:"correct"'),path+" missing correct ID");
 assert.ok(html.includes('quizPart:"retry"'),path+" missing retry ID");
 assert.ok(html.includes('quizPart:"explanation"'),path+" missing explanation ID");
 assert.ok(html.includes("/kids/quiz-v4-approved-player.js"),path+" missing approved player");
}
console.log("PASS: real global owner-voice overrides quizSpeak safely route 450 V4 ID clips; legacy other audio unaffected");
