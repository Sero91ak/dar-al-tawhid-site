/* DAR KIDS MAJLIS · preview. No free-form AI answer without an approved server. */
(function () {
  "use strict";
  if (window.DarKidsMajlis || !document.querySelector("#view-today .big-choice-grid")) return;
  var state = { open:false, approved:false, busy:false, age:"6–8", turns:0,
    audio:null, recording:null, microphone:null, recordingTimer:null, audioUrl:null, lastAnswer:null };
  try { var savedAge=localStorage.getItem("kids.age"); if(["4–5","6–8","9–10"].includes(savedAge)) state.age=savedAge; } catch (_) {}
  var entries = [
    {rx:/(wer ist allah|wer ist gott|wer ist unser schöpfer|was ist tawhid|was ist tawḥīd|einzigkeit allahs)/i,answer:"Allah ist unser Schöpfer. Er ist Einer und niemand ist so wie Er. Das lernen wir in Sūrah al-Ikhlāṣ. Magst du die kurze Sūrah im Qurʾān-Bereich hören?",source:"Qurʾān 112:1–4"},
    {rx:/(was ist islam|was bedeutet islam)/i,answer:"Islam bedeutet, dass wir Allah allein anbeten und auf Ihn hören. Dazu gehören zum Beispiel das Gebet, die Zakāh und das Fasten im Ramaḍān. Wir lernen das Schritt für Schritt.",source:"Ṣaḥīḥ Muslim, Ḥadīṯ von Ǧibrīl (Nr. 8)"},
    {rx:/(wer ist muhammad|wer war muhammad|wer ist der prophet|letzte prophet)/i,answer:"Muḥammad ﷺ ist der Gesandte Allahs und der letzte Prophet. Wir lieben und achten ihn und lernen aus seiner Sunnah, wie wir gut handeln.",source:"Qurʾān 33:40"},
    {rx:/(warum beten|was ist salah|was ist ṣalah|was ist das gebet|wie oft beten)/i,answer:"Wir beten, um Allah zu dienen und uns an Ihn zu erinnern. Es gibt fünf Pflichtgebete am Tag. In unserem Gebetstrainer kannst du ihre Bewegungen und Worte in Ruhe lernen.",source:"Qurʾān 20:14; Ṣaḥīḥ al-Buḫārī, Nr. 46"},
    {rx:/(wudu|wuḍū|gebetswaschung|waschen vor dem gebet)/i,answer:"Vor dem Gebet machen wir die Gebetswaschung, die Wuḍūʾ heißt. Dazu gehören Gesicht und Arme zu waschen, über den Kopf zu streichen und die Füße zu waschen. Die genauen Schritte kannst du mit deinen Eltern üben.",source:"Qurʾān 5:6"},
    {rx:/(was ist dua|was ist duʿā|warum dua|bittgebet)/i,answer:"Duʿāʾ bedeutet, Allah um etwas Gutes zu bitten. Du darfst Ihn um Hilfe bitten und Ihm danken. In ‚Meine Duʿāʾ‘ kannst du kleine authentische Bittgebete hören und lernen.",source:"Qurʾān 40:60"},
    {rx:/(was ist der quran|was ist der qurʾan|warum quran|koran)/i,answer:"Der Qurʾān ist Allahs Offenbarung. Er zeigt uns den richtigen Weg. Du kannst mit kurzen Sūren anfangen, sie hören und Wort für Wort mitlernen.",source:"Qurʾān 2:2; 17:9"},
    {rx:/(ramadan|ramaḍān|fasten)/i,answer:"Im Ramaḍān fasten Muslime, für die das Fasten Pflicht ist. Wir üben Geduld, Dankbarkeit und gute Taten. Für Kinder gelten andere Regeln als für Erwachsene; besprich das mit deinen Eltern.",source:"Qurʾān 2:183"},
    {rx:/(meine eltern|mama|papa|mutter|vater|eltern helfen)/i,answer:"Allah lehrt uns, liebevoll und respektvoll mit unseren Eltern umzugehen. Du kannst ihnen mit kleinen Dingen helfen und freundlich mit ihnen sprechen.",source:"Qurʾān 17:23–24"},
    {rx:/(lügen|wahrheit|ehrlich sein|ehrlichkeit)/i,answer:"Die Wahrheit zu sagen ist eine schöne Eigenschaft. Auch wenn du einen Fehler gemacht hast, darfst du ehrlich sein und versuchen, es besser zu machen.",source:"Qurʾān 9:119"},
    {rx:/(zakat|zakāh|armen helfen|spenden)/i,answer:"Zakāh ist eine Pflichtabgabe unter bestimmten Bedingungen. Damit wird auch bedürftigen Menschen geholfen. Kinder können schon heute lernen, großzügig und hilfsbereit zu sein.",source:"Qurʾān 2:43"},
    {rx:/(was ist schirk|was ist shirk|was ist ʿaqīdah|was ist aqida|glaubenslehre)/i,answer:"ʿAqīdah ist das, was wir über Allah und unseren Glauben lernen. Tawḥīd bedeutet, Allah allein anzubeten. Schwierige Fragen über einzelne Menschen klären wir gemeinsam mit den Eltern.",source:"Qurʾān 112:1–4; 4:36"}
  ];
  function el(tag,cls,text) {
    var n=document.createElement(tag); if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;return n;
  }
  var link=document.createElement("link");link.rel="stylesheet";link.href="/kids/majlis-kids.css?v=1";document.head.appendChild(link);
  var entry=el("button");entry.id="kidsMajlisEntry";entry.type="button";
  entry.setAttribute("aria-label","Majlis al-ʿIlm öffnen – Fragen, hören und lernen");
  entry.appendChild(el("span","km-emblem","✧"));
  var entryCopy=el("span","km-entry-text");
  entryCopy.appendChild(el("small","","ENTDECKEN · FRAGEN · LERNEN"));
  entryCopy.appendChild(el("strong","","Majlis al-ʿIlm"));
  entryCopy.appendChild(el("span","km-entry-description","Deine Fragen über den Islam – kindgerecht erklärt."));
  entry.appendChild(entryCopy);entry.appendChild(el("span","km-arrow","›"));
  var grid=document.querySelector("#view-today .big-choice-grid");grid.insertAdjacentElement("afterend",entry);
  var root=el("section");root.id="kidsMajlisRoot";root.setAttribute("role","dialog");
  root.setAttribute("aria-modal","true");root.setAttribute("aria-label","Majlis al-ʿIlm – Kinderlernchat");
  var top=el("header","km-top"),back=el("button","","‹");back.type="button";back.setAttribute("aria-label","Majlis schließen");
  var title=el("div","km-heading");title.appendChild(el("small","","DĀR AL TAWḤĪD · KIDS"));
  title.appendChild(el("strong","","Majlis al-ʿIlm"));top.appendChild(back);top.appendChild(title);
  var notice=el("p","km-guardian","Dein digitaler Lernbegleiter. Keine echte Person im Chat. Schwierige Fragen kannst du mit deinen Eltern besprechen.");
  var chat=el("div","km-chat");chat.setAttribute("role","log");chat.setAttribute("aria-live","polite");
  var form=el("form","km-form"),status=el("p","km-status","Schreibe deine Frage oder tippe auf das Mikrofon.");
  var controls=el("div","km-controls"),input=el("textarea");input.rows=1;input.maxLength=350;
  input.placeholder="Was möchtest du über den Islam wissen?";input.setAttribute("aria-label","Deine Frage");
  var mic=el("button","","🎙");mic.type="button";mic.setAttribute("aria-label","Sprachnachricht aufnehmen");
  var send=el("button","km-send","↑");send.type="submit";send.setAttribute("aria-label","Frage abschicken");
  controls.appendChild(input);controls.appendChild(mic);controls.appendChild(send);
  var actions=el("div","km-actions"),listen=el("button","","▶ Antwort anhören"),reset=el("button","","Neues Gespräch");
  listen.type="button";reset.type="button";listen.disabled=true;
  actions.appendChild(listen);actions.appendChild(reset);form.appendChild(status);form.appendChild(controls);form.appendChild(actions);
  var guardian=el("div","km-parent"),gate=el("div","km-parent-panel");
  gate.appendChild(el("h2","","Für die Eltern"));
  gate.appendChild(el("p","","Diese Kinder-Vorschau beginnt mit geprüften Basisantworten. Spracherkennung und KI-Antworten benötigen später eine gesicherte, elterlich freigegebene Serveranbindung. Daten werden hier nicht in einem Gesprächsarchiv gespeichert."));
  var checkLabel=el("label"),check=el("input");check.type="checkbox";
  checkLabel.appendChild(check);checkLabel.appendChild(el("span","","Ich bin eine erziehungsberechtigte Person und öffne den Lernbereich für dieses Kind."));
  gate.appendChild(checkLabel);
  var approve=el("button","","Lernbereich öffnen");approve.type="button";approve.disabled=true;
  gate.appendChild(approve);guardian.appendChild(gate);
  root.appendChild(top);root.appendChild(notice);root.appendChild(chat);root.appendChild(form);root.appendChild(guardian);
  document.body.appendChild(root);
  function message(who,text,source) {
    var box=el("article","km-msg"+(who==="you"?" km-you":""));
    box.appendChild(el("small","",who==="you"?"DEINE FRAGE":"DEIN LERNBEGLEITER"));
    box.appendChild(el("div","",text));
    if(source) box.appendChild(el("span","km-source","Quelle: "+source));
    chat.appendChild(box);chat.scrollTop=chat.scrollHeight;
    return box;
  }
  function picks() {
    var row=el("div","km-picks");
    ["Wer ist Allah?","Warum beten wir?","Was ist Duʿāʾ?","Was ist Wuḍūʾ?"].forEach(function(q){
      var b=el("button","",q);b.type="button";b.addEventListener("click",function(){submitQuestion(q)});
      row.appendChild(b);
    });chat.appendChild(row);
  }
  function welcome() {
    chat.replaceChildren();
    message("guide","As-salāmu ʿalaykum! 🌟 Hier darfst du fragen und entdecken. Ich antworte kurz und mit einer geprüften Quelle. Was möchtest du heute lernen?");
    picks();status.textContent="Wähle eine Frage oder schreibe selbst.";
  }
  function responseFor(question) {
    var q=String(question||"").normalize("NFKC").trim();
    if (/(adresse|telefonnummer|passwort|mein name ist|ich wohne|schick.*foto)/i.test(q))
      return {answer:"Persönliche Daten gehören nicht in einen Chat. Sprich darüber mit deinen Eltern, ja?",source:null};
    if (/(angst vor|jemand tut mir weh|schlägt mich|will sterben|verletze mich|missbrauch)/i.test(q))
      return {answer:"Das klingt wichtig. Bitte sprich jetzt mit einem Erwachsenen, dem du vertraust. Wenn du gerade in Gefahr bist, hol sofort Hilfe. Du musst damit nicht allein bleiben.",source:null};
    for(var i=0;i<entries.length;i++)if(entries[i].rx.test(q)) {
      var item=entries[i];
      var answer=state.age==="4–5" ? item.answer.split(/(?<=[.!?])\s+/).slice(0,2).join(" ") : item.answer;
      return {answer:answer,source:item.source};
    }
    return {answer:"Das ist eine interessante Frage! Dafür habe ich hier noch keine ausreichend geprüfte Kinderantwort. Frag bitte deine Eltern. Gemeinsam könnt ihr in den Wissensbereichen unserer App nachschauen.",source:null};
  }
  function submitQuestion(value) {
    if(!state.approved||state.busy)return;
    var q=String(value||"").trim().slice(0,350);if(!q){status.textContent="Schreib erst eine Frage.";return;}
    var suggestions=chat.querySelector(".km-picks");if(suggestions)suggestions.remove();
    message("you",q);input.value="";state.audio=null;
    var item=responseFor(q);
    state.lastAnswer=item;
    message("guide",item.answer,item.source);
    listen.disabled=false;state.turns++;
    status.textContent=item.source?"Aus einer geprüften Quelle erklärt · zum Anhören tippen.":"Für diese Frage ist die Antwort bewusst begrenzt.";
    if(state.turns%3===0){
      var row=el("div","km-picks"),b=el("button","","✨ Kleine Denkfrage");
      b.type="button";b.addEventListener("click",function(){
        message("guide","Mini-Quiz: Wie viele Pflichtgebete gibt es am Tag? ✨");
        var opts=el("div","km-picks");
        ["3","5","7"].forEach(function(v){var bb=el("button","",v);bb.type="button";bb.addEventListener("click",function(){message("guide",v==="5"?"Richtig! Sehr gut aufgepasst.":"Fast! Es sind fünf Pflichtgebete am Tag.","Ṣaḥīḥ al-Buḫārī, Nr. 46");opts.remove();});opts.appendChild(bb);});
        chat.appendChild(opts);chat.scrollTop=chat.scrollHeight;
      });row.appendChild(b);chat.appendChild(row);
    }
  }
  async function hear() {
    if(!state.lastAnswer||state.busy)return;
    // No browser TTS fallback: the product promises Serhat's actual master voice.
    state.busy=true;listen.disabled=true;status.textContent="Masterstimme wird angefragt …";
    try {
      var res=await fetch("/kids/api/majlis/speak",{method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({text:state.lastAnswer.answer})});
      if(!res.ok||!(res.headers.get("Content-Type")||"").includes("audio/"))throw Error("voice-unavailable");
      var audioBlob=await res.blob();
      if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);
      state.audioUrl=URL.createObjectURL(audioBlob);
      var audio=new Audio(state.audioUrl);audio.preload="auto";await audio.play();
      status.textContent="Du hörst die Antwort mit der Masterstimme.";
    }catch(_){status.textContent="Die Serhat-Masterstimme ist in dieser Vorschau noch nicht freigeschaltet. Die Textantwort bleibt verfügbar."}
    finally{state.busy=false;listen.disabled=false}
  }
  async function startOrStopMic(){
    if(state.recording && state.recording.state==="recording"){state.recording.stop();return;}
    if(!state.approved||state.busy)return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){
      status.textContent="Auf diesem Gerät ist die Aufnahme hier nicht verfügbar. Du kannst deine Frage schreiben.";return;
    }
    try{
      state.microphone=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      var parts=[];state.recording=new MediaRecorder(state.microphone);
      state.recording.ondataavailable=function(ev){if(ev.data&&ev.data.size)parts.push(ev.data)};
      state.recording.onstop=function(){
        clearTimeout(state.recordingTimer);
        state.microphone.getTracks().forEach(function(t){t.stop()});
        state.audio=new Blob(parts,{type:state.recording.mimeType||"audio/webm"});
        mic.textContent="🎙";mic.setAttribute("aria-label","Sprachnachricht aufnehmen");
        status.textContent="Aufnahme bereit. Tippe auf ↑, um sie erkennen zu lassen und abzuschicken.";
      };
      state.recording.start();mic.textContent="■";mic.setAttribute("aria-label","Aufnahme beenden");
      status.textContent="Du sprichst … Tippe auf ■ zum Beenden (maximal 15 Sekunden).";
      state.recordingTimer=setTimeout(function(){if(state.recording&&state.recording.state==="recording")state.recording.stop()},15000);
    }catch(_){status.textContent="Mikrofon nicht freigegeben. Du kannst deine Frage einfach schreiben."}
  }
  async function sendAudio(){
    if(!state.audio||state.busy)return;
    var audio=state.audio;state.audio=null;state.busy=true;send.disabled=true;mic.disabled=true;
    status.textContent="Sprachnachricht wird sicher verarbeitet …";
    try{
      var fd=new FormData();fd.append("audio",audio,(audio.type||"").includes("mp4")?"question.m4a":"question.webm");
      var res=await fetch("/kids/api/majlis/transcribe",{method:"POST",credentials:"same-origin",body:fd});
      if(!res.ok)throw Error("no-transcription");
      var result=await res.json(),transcript=String(result.text||"").trim();
      if(!transcript)throw Error("empty-transcription");
      state.busy=false;submitQuestion(transcript);
    }catch(_){status.textContent="Spracherkennung noch nicht freigeschaltet. Bitte tippe deine Frage ein."}
    finally{state.busy=false;send.disabled=false;mic.disabled=false}
  }
  function close(){
    if(state.recording&&state.recording.state==="recording")state.recording.stop();
    if(state.audioUrl){URL.revokeObjectURL(state.audioUrl);state.audioUrl=null}
    state.open=false;state.approved=false;state.audio=null;
    var app=document.querySelector(".app");if(app)app.inert=false;
    root.classList.remove("km-open","km-parent-open");document.body.style.removeProperty("overflow");
    entry.focus({preventScroll:true});
  }
  function open(){
    if(state.open)return;
    var age=(document.querySelector(".app")||{}).getAttribute?.("data-age");
    if(["4–5","6–8","9–10"].includes(age))state.age=age;
    state.open=true;state.approved=false;check.checked=false;approve.disabled=true;
    root.classList.add("km-open","km-parent-open");
    var app=document.querySelector(".app");if(app)app.inert=true;
    welcome();check.focus();
    history.pushState({kidsMajlis:true},"",window.location.href);
  }
  entry.addEventListener("click",open);
  back.addEventListener("click",function(){if(history.state&&history.state.kidsMajlis)history.back();else close()});
  window.addEventListener("popstate",function(){if(state.open)close()});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&state.open){ev.preventDefault();back.click()}});
  check.addEventListener("change",function(){approve.disabled=!check.checked});
  approve.addEventListener("click",function(){if(!check.checked)return;state.approved=true;root.classList.remove("km-parent-open");input.focus()});
  form.addEventListener("submit",function(ev){ev.preventDefault();if(state.audio&&!input.value.trim())sendAudio();else submitQuestion(input.value)});
  input.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();form.requestSubmit()}});
  mic.addEventListener("click",startOrStopMic);listen.addEventListener("click",hear);
  document.addEventListener("visibilitychange",function(){if(document.hidden&&state.recording&&state.recording.state==="recording")state.recording.stop()});
  reset.addEventListener("click",function(){state.turns=0;state.lastAnswer=null;state.audio=null;listen.disabled=true;welcome()});
  window.DarKidsMajlis={open:open,close:close,version:"kids-majlis-safe-beta-1"};
})();