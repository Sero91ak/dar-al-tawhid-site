#!/usr/bin/env node
"use strict";
/* Guard: Hören falls back to the plain answer when "Antwort N:" is missing,
 * and child listen buttons exist for hints, feedback, meanings and pre-questions. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("kids/akademie/index.html","utf8");
assert(html.includes("function resolveSpeakLine(line){"),"resolveSpeakLine helper missing");
assert(html.includes("function academyCanPlay(text){"),"academyCanPlay helper missing");
assert(html.includes("const lines=rawLines.map(resolveSpeakLine);"),"speak() must map lines through the lookup fallback");
assert(html.includes('speak(step,[["Antwort "+(i+1)+": "+t,t]])'),
 "Hören must try the numbered clip first and then the plain answer text");
assert(!html.includes('speak(3,["Antwort "+(i+1)+": "+t])'),
 "Do not look up only the numbered answer clip on a fixed speak index");
assert(html.includes('id="quranMeaningListen"')&&html.includes('id="quranChildListen"'));
assert(html.includes('id="hadithTextListen"')&&html.includes('id="hadithChildListen"'));
assert(html.includes('id="questionBridge"')&&html.includes('id="questionBridgeListen"'));
assert(html.includes('id="feedbackListen"')&&html.includes('id="buddyListen"')&&html.includes('id="teachBackListen"'));
assert(html.includes('if(pre)speak(step,[pre]);'),"Child explanation before a question must autoplay");
assert(html.includes('if(text)speak(step,[text]);')&&html.includes('$("#hint").onclick='),
 "Hints must autoplay through the existing player");
assert(html.includes("autoplayFeedbackText(correct,q.explain||\"\");"),
 "Post-check feedback must autoplay");
assert(html.includes('id="quranChildExplain"')&&html.includes('id="hadithChildExplain"'));
assert(html.includes("function applySourceChildExplains("));
console.log("PASS Kids Academy speak lookup: plain-answer fallback, listen buttons, autoplay hint/feedback/preQuestion.");
