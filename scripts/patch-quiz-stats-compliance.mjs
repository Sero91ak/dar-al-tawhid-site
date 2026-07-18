#!/usr/bin/env node
/**
 * Patch test/index.html: ensure test-isolated quiz telemetry (stats UI stays in app).
 */
import fs from "fs";

const path = "test/index.html";
let html = fs.readFileSync(path, "utf8");

const telemetryBlock = `function quizRouteMode(){return String(currentRoute.value||"").trim().toLowerCase()||"home"}
const __QUIZ_TELEMETRY_QUEUE_KEY="darQuizTelemetryQueueV1";
const __QUIZ_ANON_SESSION_KEY="darQuizAnonSessionV1";
const QUIZ_STATS_WORKER_URL="https://dar-admin-publisher.sero91ak.workers.dev";
let __quizQuestionShownAt=0;
function quizTelemetryMeta(){return{environment:"test",app_variant:"test",app_version:typeof APP_BUILD_ID==="string"?APP_BUILD_ID:""};}
function quizAnonSessionId(){let id="";try{id=localStorage.getItem(__QUIZ_ANON_SESSION_KEY)||""}catch(e){}if(!id){id="anon-test-"+Date.now()+"-"+Math.random().toString(36).slice(2,10);try{localStorage.setItem(__QUIZ_ANON_SESSION_KEY,id)}catch(e){}}return id}
function quizTelemetryUserId(){try{return accountSession()?.id||null}catch(e){return null}}
function quizTelemetryQueue(){return getJson(__QUIZ_TELEMETRY_QUEUE_KEY,{sessions:[],attempts:[]})}
function quizTelemetrySaveQueue(q){setJson(__QUIZ_TELEMETRY_QUEUE_KEY,{sessions:(q.sessions||[]).slice(-80),attempts:(q.attempts||[]).slice(-400)})}
function quizTelemetryClientAttemptId(){return "att-test-"+Date.now()+"-"+Math.random().toString(36).slice(2,12)}
function quizTelemetryEnqueueSession(payload){try{const q=quizTelemetryQueue();q.sessions.push(payload);quizTelemetrySaveQueue(q);quizTelemetryFlushAsync()}catch(e){}}
function quizTelemetryEnqueueAttempt(payload){try{const q=quizTelemetryQueue();q.attempts.push(payload);quizTelemetrySaveQueue(q);quizTelemetryFlushAsync()}catch(e){}}
async function quizTelemetryFlushAsync(){try{const q=quizTelemetryQueue();if(!q.sessions?.length&&!q.attempts?.length)return;const payload={sessions:q.sessions||[],attempts:q.attempts||[]};const res=await fetch(QUIZ_STATS_WORKER_URL+"/api/quiz/stats/ingest-test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});if(!res.ok)return;quizTelemetrySaveQueue({sessions:[],attempts:[]})}catch(e){}}
function quizTelemetryTrackSession(session,status){if(!session)return;const now=Date.now();const values=session.questionIds.map(id=>session.answers?.[id]).filter(Boolean);const right=values.filter(a=>a.correct).length;const wrong=values.filter(a=>a.evaluated&&!a.correct).length;quizTelemetryEnqueueSession({client_session_id:session.id,user_id:quizTelemetryUserId(),anonymous_session_id:quizTelemetryUserId()?null:quizAnonSessionId(),mode:session.config?.mode||"standard",...quizTelemetryMeta(),started_at:new Date(session.startedAt||now).toISOString(),completed_at:status==="completed"?new Date().toISOString():null,abandoned_at:status==="abandoned"?new Date().toISOString():null,total_questions:session.questionIds.length,answered_questions:right+wrong,correct_answers:right,wrong_answers:wrong,skipped_answers:Math.max(0,session.questionIds.length-right-wrong),duration_ms:Math.max(0,now-Number(session.startedAt||now))})}
function quizTelemetryTrackAttempt(session,q,selectedIndex,isCorrect,attemptNumber,isFirst){if(!session||!q)return;const responseMs=__quizQuestionShownAt?Math.max(0,Date.now()-__quizQuestionShownAt):0;quizTelemetryEnqueueAttempt({client_attempt_id:quizTelemetryClientAttemptId(),client_session_id:session.id,user_id:quizTelemetryUserId(),anonymous_session_id:quizTelemetryUserId()?null:quizAnonSessionId(),question_id:String(q.id),question_number:(session.index||0)+1,question_version:String(q.version||q.questionVersion||"1"),question_content_hash:String(quizStableHash((q.question||"")+"|"+(q.answers||[]).join("|"))),category:String(q.category||q.topic||""),topic:String(q.topic||""),level:String(q.level||""),selected_answer_index:selectedIndex,correct_answer_index:Number(q.correctIndex),is_correct:!!isCorrect,is_skipped:false,attempt_number:attemptNumber||1,is_first_attempt:!!isFirst,response_time_ms:responseMs,answered_at:new Date().toISOString(),created_offline:!navigator.onLine,...quizTelemetryMeta()})}
function quizSnapshotStats(){`;

if (!html.includes("quizTelemetryMeta")) {
  html = html.replace(
    /function quizRouteMode\(\)\{return String\(currentRoute\.value\|\|""\)\.trim\(\)\.toLowerCase\(\)\|\|"home"\}\nfunction quizSnapshotStats\(\)\{/g,
    telemetryBlock
  );
}

html = html.replace(
  /function bindQuizEvents\(\)\{if\(currentRoute\.view!=="quiz"\)return;const start=/g,
  'function bindQuizEvents(){if(currentRoute.view!=="quiz")return;__quizQuestionShownAt=Date.now();quizTelemetryFlushAsync();const start='
);

html = html.replace(
  /saveQuizSession\(quizBuildSession\(cfg\)\);navigate\("quiz","session"\)/g,
  'const s=quizBuildSession(cfg);saveQuizSession(s);quizTelemetryTrackSession(s,"started");navigate("quiz","session")'
);

html = html.replace(
  /saveQuizHistoryEntry\(s\);saveQuizSession\(s\)\}navigate\("quiz","session"\)\}\};/g,
  'saveQuizHistoryEntry(s);quizTelemetryTrackSession(s,"abandoned");saveQuizSession(s)}navigate("quiz","session")}};'
);

html = html.replace(
  /s\.answers\[q\.id\]=\{selectedIndex:idx,evaluated:true,correct:isCorrect\};if\(!isCorrect\)\{s\.retries=s\.retries\|\|\{\};s\.retries\[q\.id\]=\(Number\(s\.retries\[q\.id\]\|\|0\)\+1\)\}s\.updatedAt=Date\.now\(\);saveQuizSession\(s\);render\(\)\}\}\);/g,
  's.answers[q.id]={selectedIndex:idx,evaluated:true,correct:isCorrect};if(!isCorrect){s.retries=s.retries||{};s.retries[q.id]=(Number(s.retries[q.id]||0)+1)}const attemptNo=Number(s.retries?.[q.id]||0)+1;quizTelemetryTrackAttempt(s,q,idx,isCorrect,attemptNo,attemptNo===1);s.updatedAt=Date.now();saveQuizSession(s);render()}});'
);

html = html.replace(
  /saveQuizHistoryEntry\(s\);saveQuizSession\(s\);navigate\("quiz","session"\);return/g,
  'saveQuizHistoryEntry(s);quizTelemetryTrackSession(s,"completed");saveQuizSession(s);navigate("quiz","session");return'
);

fs.writeFileSync(path, html);
console.log("Patched", path);
