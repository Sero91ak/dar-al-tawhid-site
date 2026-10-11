/* DĀR AL TAWḤĪD KIDS · script-only narration planner for creator test.
 * DO NOT synthesize Qurʾān, pretend master audio exists, or attach unapproved MP3s.
 * Every new Arabic term is explained immediately after the first spoken mention.
 * Audio production uses the existing canonical Serhat kids_story V4 pipeline only.
 */
(function(){
"use strict";
function build(lesson,age){
 const terms=window.DARKidsAcademyTermsV1;
 if(!lesson||!["4-5","6-8","9-10"].includes(age)||!terms)return null;
 const recorded=[],seen=new Set(),v=lesson.ageText?.[age]||{},MAX_TERMS=6;
 function say(text,explain=true){
  const phrase=String(text||"").trim();if(!phrase)return;
  recorded.push(phrase);
  if(!explain)return;
  const detected=terms.find(phrase,10);
  for(const entry of detected){
   if(seen.has(entry.id)||seen.size>=MAX_TERMS)continue;
   seen.add(entry.id);
   // German plain-language text is deliberately adjacent to the encountered foreign word.
   recorded.push(entry.voiceScript[age]||entry.voiceScript["4-5"]);
  }
 }
 say("As-salāmu ʿalaykum. Schön, dass du mitlernst.",false);
 say("Unser heutiges Thema: "+(lesson.topic||lesson.title||"Neues Wissen")+".");
 say(v.intro||lesson.lead||"");
 const lines=v.lines||lesson.lines||[];
 lines.forEach(line=>say(line));
 say("Das üben wir jetzt gemeinsam: "+(v.activity||lesson.goal||""),false);
 say("Und zum Schluss merken wir uns: "+(lesson.goal||lesson.lead||""),false);
 return {text:recorded.join("\n\n"),sections:recorded,explainedTerms:[...seen],voice:"Serhat Abu Malik – Master",model:"eleven_v4",voiceProfile:"kids_story",readyForVoiceGeneration:false,audioApproved:false};
}
window.DARKidsAcademyNarrationV1=Object.freeze({version:"20261011-v1",build,statement:"This is an editorial voice text, not a recording."});
})();
