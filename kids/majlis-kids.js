/* DAR KIDS MAJLIS · preview. No free-form AI answer without an approved server. */
(function () {
  "use strict";
  if (window.DarKidsMajlis || !document.querySelector("#view-today .big-choice-grid")) return;
  var state = { open:false, approved:false, busy:false, age:"6–8", turns:0,
    audio:null, recording:null, microphone:null, recordingTimer:null, audioUrl:null, player:null, lastAnswer:null, serverReady:false, serverAuthorized:false, canSpeak:false, canTranscribe:false };
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
    {rx:/(was ist schirk|was ist shirk|was ist ʿaqīdah|was ist aqida|glaubenslehre)/i,answer:"ʿAqīdah ist das, was wir über Allah und unseren Glauben lernen. Tawḥīd bedeutet, Allah allein anzubeten. Schwierige Fragen über einzelne Menschen klären wir gemeinsam mit den Eltern.",source:"Qurʾān 112:1–4; 4:36"},
    {rx:/(was ist iman|was ist īmān|sechs säulen des glaubens|sechs glaubenssäulen|glaube an die engel)/i,answer:"Īmān bedeutet Glaube. Im Ḥadīṯ von Ǧibrīl lernen wir die sechs Glaubensgrundlagen: Allah, Seine Engel, Seine Bücher, Seine Gesandten, den Jüngsten Tag und die Vorherbestimmung. Wir lernen sie Schritt für Schritt.",source:"Ṣaḥīḥ Muslim, Nr. 8"},
    {rx:/(allahs namen|namen allahs|eigenschaften allahs|asm[aā]ʾ|asma wa sifat)/i,answer:"Allah hat die schönsten Namen. Wir rufen Ihn mit Seinen schönen Namen an. Allah ist einzigartig; niemand ist so wie Er.",source:"Qurʾān 7:180; 42:11"},
    {rx:/(was ist ibadah|was ist ʿibādah|was bedeutet anbetung|was ist anbetung)/i,answer:"ʿIbādah heißt, Allah zu dienen. Dazu gehören das Gebet, Duʿāʾ und gute Taten mit aufrichtiger Absicht. Allah hat uns erschaffen, damit wir Ihm dienen.",source:"Qurʾān 51:56; Ṣaḥīḥ al-Buḫārī, Nr. 1"},
    {rx:/(was ist adab|was ist akhlaq|guter charakter|gutes benehmen|freundlich sein|gutes wort)/i,answer:"Adab bedeutet gutes Benehmen. Sprich freundlich, halte dein Versprechen und sei hilfsbereit. Ein gutes Wort ist schon eine schöne Tat.",source:"Ṣaḥīḥ al-Buḫārī, Nr. 2989; 6018"},
    {rx:/(jüngster tag|jüngste tag|leben nach dem tod|auferstehung|was ist akhirah|āḫirah)/i,answer:"Der Jüngste Tag gehört zu unserem Glauben. Allah wird die Menschen auferwecken und gerecht über ihre Taten urteilen. Wir dürfen auf Allahs Barmherzigkeit hoffen und Gutes tun.",source:"Qurʾān 22:7; 99:7–8"},
    {rx:/(meine nachbarn|meinen nachbarn|nachbar|nachbarin)/i,answer:"Zum guten islamischen Verhalten gehört, freundlich zu unseren Nachbarn zu sein und ihnen nichts Böses zuzufügen.",source:"Ṣaḥīḥ al-Buḫārī, Nr. 6014"},
    {rx:/(qibla|qiblah|kaaba|kaʿba|wohin beten wir|in welche richtung beten)/i,answer:"Wenn wir beten, wenden wir uns in Richtung der Kaʿbah in Makkah. Diese Gebetsrichtung heißt Qiblah. Deine Eltern können dir zeigen, wo sie bei euch liegt.",source:"Qurʾān 2:144"},
    {rx:/(niyyah|niyya|gute absicht|warum ist absicht wichtig)/i,answer:"Niyyah bedeutet Absicht. Allah weiß, was wir im Herzen vorhaben. Darum ist es schön, eine gute Tat aufrichtig für Allah zu tun.",source:"Ṣaḥīḥ al-Buḫārī, Nr. 1"}
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
  var codeLabel=el("label","km-code-label","Eltern-Zugangscode für die geschützte Sprachfunktion");
  var codeField=el("input","km-code-input");codeField.type="password";codeField.autocomplete="off";
  codeField.placeholder="Nur für Erwachsene";codeField.setAttribute("aria-label","Eltern-Zugangscode");
  codeLabel.appendChild(codeField);gate.appendChild(codeLabel);
  var gateInfo=el("p","km-gate-info","Vorschau: Hier kannst du feste Lernantworten ausprobieren. Für Spracherkennung und die Masterstimme muss der geschützte Elternzugang eingerichtet sein.");
  gate.appendChild(gateInfo);
  var approve=el("button","","Lernbereich öffnen");approve.type="button";approve.disabled=true;
  gate.appendChild(approve);guardian.appendChild(gate);
  root.appendChild(top);root.appendChild(notice);root.appendChild(chat);root.appendChild(form);root.appendChild(guardian);
  document.body.appendChild(root);
  function activeGender(){
    var gender=(document.querySelector(".app")||{}).getAttribute?.("data-gender")||"";
    try{
      var active=localStorage.getItem("kids.activeProfile"),profiles=JSON.parse(localStorage.getItem("kids.profiles.v1")||"[]");
      var profile=Array.isArray(profiles)?profiles.find(function(p){return String(p.id)===String(active)}):null;
      if(profile?.gender)gender=profile.gender;
    }catch(_){}
    return gender==="girl"?"girl":"boy";
  }
  function familyWord(){return activeGender()==="girl"?"Schwester":"Bruder";}
  function protectedAudioUrl(url){
    var s=String(url||"");
    if(/^\/kids\/assets\/kids-dua-(?:arabic-|arabic-slow-|word-)?audio\/[a-zA-Z0-9._-]+\.m4a\?v=[a-zA-Z0-9._-]+$/.test(s))return s;
    if(/^\/quran-audio\/ar\.alafasy\/[1-9]\d{0,3}\.mp3\?v=1063$/.test(s))return s;
    return null;
  }
  async function playPrepared(url,label){
    var safe=protectedAudioUrl(url);
    if(!safe){status.textContent="Diese Audiodatei ist nicht freigegeben.";return;}
    stopPlayback();
    try{
      var sound=new Audio(safe);state.player=sound;sound.preload="none";
      sound.onended=function(){if(state.player===sound){stopPlayback();status.textContent="Aufnahme fertig angehört."}};
      await sound.play();
      status.textContent=label||"Aufnahme wird abgespielt.";
    }catch(_){stopPlayback();status.textContent="Die Aufnahme ist momentan nicht erreichbar. Bitte versuche es später erneut.";}
  }
  function openQuranVerse(surah,ayah){
    var s=Number(surah),a=Number(ayah);
    if(!Number.isInteger(s)||s<1||s>114||!Number.isInteger(a)||a<1||a>286)return;
    stopPlayback();
    var wasMajlis=!!history.state?.kidsMajlis;
    close();
    if(wasMajlis)history.replaceState({kidsMajlis:false},"",window.location.href);
    try{
      if(typeof window.openQuranSurah==="function")window.openQuranSurah(s,a,{scrollOffset:0});
      else if(typeof window.navigate==="function")window.navigate("quran-surah",s+"/"+a);
      else location.hash="#quran-surah/"+s+"/"+a;
    }catch(_){status.textContent="Bitte öffne den Qurʾān-Bereich.";}
  }
  function mediaCard(box,media){
    if(!media||!["dua","quran","quran_results","hadith","early","lesson"].includes(media.kind))return;
    if(["hadith","early","lesson"].includes(media.kind)){
      var item=el("section","km-media km-sunnah");
      item.appendChild(el("strong","km-verse-head",String(media.title||"Geprüfter Lerntext")));
      if(media.person)item.appendChild(el("small","km-source","Überliefert von: "+String(media.person)));
      if(media.text){
        item.appendChild(el("small","km-translation-note","Vorhandene deutsche Übertragung · kein arabischer Originaltext"));
        item.appendChild(el("p","km-meaning",String(media.text)));
      }else{
        item.appendChild(el("small","km-translation-note","Kindgerechte Lernzusammenfassung · kein wörtliches Ḥadīṯ-Zitat"));
      }
      item.appendChild(el("p","km-media-note",String(media.explanation||"")));
      if(media.grade)item.appendChild(el("small","km-source","Einstufung der vorhandenen Quelle: "+String(media.grade)));
      item.appendChild(el("small","km-source","Quelle: "+String(media.source||"")));
      if(typeof media.sourceUrl==="string"&&/^https:\/\/dorar\.net\//.test(media.sourceUrl)){
        var link=el("a","km-related","Originalfundstelle ansehen ›");
        link.href=media.sourceUrl;link.target="_blank";link.rel="noopener noreferrer";
        item.appendChild(link);
      }
      box.appendChild(item);
      return;
    }
    if(media.kind==="quran_results"){
      var results=Array.isArray(media.results)?media.results:[];
      results.slice(0,5).forEach(function(verse){
        if(!verse||!Number.isInteger(verse.surah)||!Number.isInteger(verse.ayah)||
          typeof verse.arabic!=="string"||typeof verse.german!=="string"||
          !protectedAudioUrl(verse.recitationUrl))return;
        var card=el("section","km-verse");
        card.appendChild(el("strong","km-verse-head",verse.reference+" · "+(verse.surahName||"Qurʾān")));
        card.appendChild(el("p","km-arabic",verse.arabic));
        card.appendChild(el("p","km-meaning",verse.german));
        card.appendChild(el("small","km-translation-note","Deutsche Übersetzung aus dem vorhandenen Qurʾān-Korpus"));
        var actions=el("div","km-media-actions");
        var play=el("button","km-media-button","▶ Rezitation");play.type="button";
        play.addEventListener("click",function(){
          playPrepared(verse.recitationUrl,"Rezitation durch "+(verse.reciter||"den Qāriʾ")+" · "+verse.reference);
        });
        var open=el("button","km-media-button","Zum Vers");open.type="button";
        open.addEventListener("click",function(){openQuranVerse(verse.surah,verse.ayah);});
        actions.appendChild(play);actions.appendChild(open);card.appendChild(actions);box.appendChild(card);
      });
      var next=Number(media.nextOffset)||0,total=Number(media.total)||0;
      if(typeof media.query==="string"&&next>0&&next<total&&next<=6236){
        var more=el("button","km-related","Weitere 5 Fundstellen anzeigen ("+next+" von "+total+")  ›");
        more.type="button";
        more.addEventListener("click",async function(){
          if(!state.open||more.disabled)return;
          more.disabled=true;more.textContent="Weitere Qurʾān-Verse werden gesucht …";
          try{
            var found=await window.DarKidsQuranSearch.search(media.query,{offset:next});
            if(!state.open||!box.isConnected)return;
            if(found.status!=="found"||!found.results?.length||Number(found.offset)!==next||Number(found.nextOffset)<=next)
              throw Error("no-safe-results");
            more.remove();
            mediaCard(box,{kind:"quran_results",results:found.results,query:media.query,
              nextOffset:found.nextOffset,total:found.total});
            chat.scrollTop=chat.scrollHeight;
            status.textContent="Weitere geprüfte Qurʾān-Fundstellen angezeigt.";
          }catch(_){
            if(box.isConnected){more.disabled=false;more.textContent="Erneut versuchen · weitere Fundstellen";status.textContent="Weitere Treffer sind gerade nicht verfügbar.";}
          }
        });
        box.appendChild(more);
      }
      return;
    }
    var panel=el("section","km-media");
    var prompt=el("p","km-media-prompt",media.kind==="dua"?
      "Möchtest du diese Duʿāʾ direkt hier lesen, anhören oder Wort für Wort lernen?":
      "Möchtest du diesen Qurʾān-Vers im Chat anhören?");
    panel.appendChild(prompt);
    var row=el("div","km-media-actions");
    function button(label,run){
      var btn=el("button","km-media-button",label);btn.type="button";
      btn.addEventListener("click",run);row.appendChild(btn);return btn;
    }
    var details=el("div","km-media-details");details.hidden=true;
    if(media.kind==="dua"){
      button("Ja, lesen",function(){
        details.hidden=!details.hidden;
        if(!details.hasChildNodes()){
          details.appendChild(el("p","km-arabic",media.arabic||""));
          details.appendChild(el("p","km-translit",media.transliteration||""));
          details.appendChild(el("p","km-meaning",media.meaning||""));
          details.appendChild(el("span","km-source","Quelle: "+String(media.source||"")));
        }
        status.textContent=details.hidden?"Lesekarte geschlossen.":"Arabischer Text und Bedeutung eingeblendet.";
      });
      if(media.audio?.arabic)button("▶ Arabisch",function(){playPrepared(media.audio.arabic,"Du hörst die vorhandene Fuṣḥā-Masteraufnahme.");});
      if(media.audio?.german)button("▶ Deutsch",function(){playPrepared(media.audio.german,"Du hörst die deutsche Masteraufnahme.");});
      if(media.audio?.arabicSlow)button("▶ Langsam",function(){playPrepared(media.audio.arabicSlow,"Langsames arabisches Vorlesen.");});
      if(Array.isArray(media.segments)&&media.segments.length){
        var chunks=el("details","km-word-panel"),summary=el("summary","","Wort für Wort üben");
        chunks.appendChild(summary);var words=el("div","km-words");
        media.segments.slice(0,30).forEach(function(part){
          if(!protectedAudioUrl(part.audioUrl))return;
          var b=el("button","km-word","");
          b.type="button";b.appendChild(el("strong","",part.arabic||""));
          b.appendChild(el("small","",part.transliteration||""));
          b.addEventListener("click",function(){playPrepared(part.audioUrl,"Ein arabisches Wort aus deiner Duʿāʾ.");});
          words.appendChild(b);
        });
        chunks.appendChild(words);panel.appendChild(chunks);
      }
      if(media.quran?.recitationUrl)button("▶ Qurʾān-Rezitation",function(){
        playPrepared(media.quran.recitationUrl,"Originalrezitation von "+(media.quran.reciter||"dem Qāriʾ")+".");
      });
    } else {
      panel.appendChild(el("span","km-source",String(media.reference||"Qurʾān")));
      panel.appendChild(el("p","km-media-note","Die Rezitation stammt von einem Qāriʾ – nicht von einer KI-Stimme."));
      if(media.excerpt?.arabic){
        var verseSnippet=el("div","km-quran-excerpt");
        verseSnippet.appendChild(el("small","","Belegter Duʿāʾ-Ausschnitt · nicht der vollständige Vers"));
        verseSnippet.appendChild(el("p","km-arabic",media.excerpt.arabic));
        verseSnippet.appendChild(el("p","km-meaning",media.excerpt.meaning||""));
        panel.appendChild(verseSnippet);
      }
      if(media.recitationUrl)button("▶ Rezitation",function(){playPrepared(media.recitationUrl,"Qurʾān-Rezitation: "+String(media.reference||"")+".");});
      if(Number.isInteger(Number(media.surah))&&Number.isInteger(Number(media.ayah)))button("Zum Vers im Qurʾān",function(){openQuranVerse(media.surah,media.ayah)});
    }
    panel.appendChild(row);panel.appendChild(details);box.appendChild(panel);
  }
  function message(who,text,source) {
    var box=el("article","km-msg"+(who==="you"?" km-you":""));
    box.appendChild(el("small","",who==="you"?"DEINE FRAGE":"DEIN LERNBEGLEITER"));
    box.appendChild(el("div","",text));
    if(source){
      box.appendChild(el("span","km-source","Quelle: "+source));
      var isDua=/Meine Duʿāʾ|arabische[sr]? Duʿāʾ|Bittgebet|Duʿāʾ kannst/i.test(String(text));
      var related=isDua?"dua":/Qurʾān/i.test(String(source))?"quran":/Ṣaḥīḥ|Muslim|Buḫārī/i.test(String(source))?"quiz":null;
      var dest=related==="dua"?"openDuaButton":related==="quiz"?"openQuizButton":null;
      var label=related==="dua"?"Meine Duʿāʾ öffnen":related==="quran"?"Im Qurʾān weiterlernen":"Wissen im Quiz üben";
      if(related){
        var next=el("button","km-related",label+"  ›");next.type="button";
        next.addEventListener("click",function(){
          var previous=!!(history.state&&history.state.kidsMajlis);
          close();
          if(previous)history.back();
          var target=dest?document.getElementById(dest):document.querySelector('.choice.quran[data-go="quran"]');
          if(target)target.click();
        });
        box.appendChild(next);
      }
    }
    chat.appendChild(box);chat.scrollTop=chat.scrollHeight;
    return box;
  }
  function picks() {
    var row=el("div","km-picks");
    ["Wer ist Allah?","Wo steht im Qurʾān etwas über Geduld?","Qurʾān 2:255","Duʿāʾ vor dem Schlafen","Was ist Īmān?","Was ist Wuḍūʾ?"].forEach(function(q){
      var b=el("button","",q);b.type="button";b.addEventListener("click",function(){submitQuestion(q)});
      row.appendChild(b);
    });chat.appendChild(row);
  }
  function welcome() {
    chat.replaceChildren();
    message("guide","As-salāmu ʿalaykum, liebe"+(activeGender()==="girl"?"":"r")+" "+familyWord()+"! 🌟 Schön, dass du da bist. Frag mich alles über den Dīn. Wir lernen liebevoll und mit echten Quellen. Wenn ich etwas nicht sicher weiß, sage ich: Wa-Allāhu aʿlam – Allah weiß es am besten. Was möchtest du entdecken?");
    picks();status.textContent="Wähle eine Frage oder schreibe selbst.";
  }
  var indexRequest=null;
  function previewNorm(s){
    return String(s||"").normalize("NFKD").toLowerCase()
      .replace(/[\u0300-\u036f\u064b-\u065f]/g,"").replace(/[^a-z0-9\u0621-\u064a]+/g," ")
      .replace(/\s+/g," ").trim();
  }
  async function previewIndex(){
    if(indexRequest)return indexRequest;
    indexRequest=fetch("/kids/data/majlis-knowledge-v1.json?v=1",{cache:"force-cache"})
      .then(function(r){if(!r.ok)throw Error("knowledge-unavailable");return r.json()})
      .then(function(data){return data?.schemaVersion===1&&Array.isArray(data.duas)&&Array.isArray(data.quran?.ayahCounts)?data:null})
      .catch(function(){return null});
    return indexRequest;
  }
  function previewVerse(q,index){
    var m=String(q).match(/(\d{1,3})\s*[:/]\s*(\d{1,3})\b/);
    if(!m||!/qur|koran|sura|sure|vers|ayah|ayat/i.test(q))return null;
    var s=Number(m[1]),a=Number(m[2]),list=index.quran.ayahCounts;
    if(s<1||s>114||a<1||a>list[s-1])return null;
    var global=list.slice(0,s-1).reduce(function(x,y){return x+y},0)+a;
    var label="Qurʾān "+s+":"+a;
    return {answer:"Gern, "+familyWord()+"! "+label+" kannst du direkt anhören. Beim Qurʾān bleibt die Rezitation bei einem richtigen Qāriʾ. Für eine genaue Erklärung kannst du den Qurʾān-Bereich öffnen.",
      source:label,media:{kind:"quran",surah:s,ayah:a,reference:label,reciter:"Mišārī Rāšid al-ʿAfāsī",
        recitationUrl:"/quran-audio/ar.alafasy/"+global+".mp3?v=1063"}};
  }
  function previewDua(q,index){
    var text=previewNorm(q);
    if(!/(?:\bdua\b|\bdu a\b|bittgebet|arabisch|اللهم|ربنا|ربي)/i.test(text))return null;
    var selected=null,score=0;
    index.duas.forEach(function(d){
      var title=previewNorm(d.title),trans=previewNorm(d.transliteration),meaning=previewNorm(d.meaning);
      var value=0;
      if(title.length>=7&&text.includes(title))value=10;
      if(trans.length>=9&&text.includes(trans))value=11;
      if(meaning.length>=12&&text.includes(meaning))value=11;
      if(value>score){selected=d;score=value;}
    });
    if(!selected||score<10)return null;
    var allowed=state.age==="4–5"?selected.ageMin<=4&&selected.ageMax>=5:
      state.age==="9–10"?selected.ageMin<=9&&selected.ageMax>=10:
      selected.ageMin<=6&&selected.ageMax>=8;
    if(!allowed)return {answer:"Diese Duʿāʾ lernst du lieber mit deinen Eltern, wenn du dafür alt genug bist. Allāhu aʿlam.",source:null};
    var a=selected.audio||{};
    if(!protectedAudioUrl(a.arabic)||!protectedAudioUrl(a.german)||!protectedAudioUrl(a.slow))return null;
    var info={kind:"dua",id:selected.id,title:selected.title,arabic:selected.arabic,transliteration:selected.transliteration,
      meaning:selected.meaning,source:selected.source,audio:{arabic:a.arabic,german:a.german,arabicSlow:a.slow},
      segments:(selected.segments||[]).slice(0,30)};
    return {answer:"Sehr gern, "+familyWord()+"! Diese Duʿāʾ heißt „"+selected.title+"“. Möchtest du sie auf Arabisch hören, auf Deutsch verstehen oder Wort für Wort lernen? Die Bedeutung: "+selected.meaning,
      source:selected.source,media:info};
  }
  var sunnahDataRequest=null,sunnahCoreRequest=null;
  function mightBeSunnahQuestion(q){
    return /\b(hadith|hadis|hadit|sunnah|buchari|bukhari|muslim|wahrheit|wahrhaftigkeit|ehrlich|lugen|nachbar|gast|gutes wort|gute worte|freundliches wort|wohltat|schweigen|ansar|aisha|aishah|scham|tawhid|tauhid|iman|glaubenssaulen|glaubensgrundlagen|ibadah|anbetung|adab|akhlaq|akhirah|auferstehung|rechenschaft|charakter)\b/.test(previewNorm(q))||
      /allahs namen|allahs eigenschaften|namen und eigenschaften|jungste tag/.test(previewNorm(q));
  }
  async function previewSunnah(question){
    if(!mightBeSunnahQuestion(question))return null;
    try{
      if(!sunnahDataRequest)sunnahDataRequest=fetch("/kids/data/majlis-sunnah-v1.json?v=1",{credentials:"same-origin",cache:"force-cache"})
        .then(function(r){if(!r.ok)throw Error("sunnah-data-unavailable");return r.json();})
        .catch(function(){return null});
      if(!sunnahCoreRequest)sunnahCoreRequest=import("/kids/majlis-sunnah-core.js?v=1").catch(function(){return null});
      var pair=await Promise.all([sunnahDataRequest,sunnahCoreRequest]);
      var data=pair[0],core=pair[1];
      var answer=data&&core?.findSunnahFromCorpus?.(question,state.age,activeGender(),data);
      return answer?{answer:answer.text,source:answer.source,media:answer.media}:null;
    }catch(_){return null;}
  }
  async function previewResponse(question){
    var sunnah=await previewSunnah(question);
    if(sunnah)return sunnah;
    var data=await previewIndex();
    if(!data)return null;
    return previewVerse(question,data)||previewDua(question,data);
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
    return {answer:"Wa-Allāhu aʿlam – Allah weiß es am besten, meine liebe"+(activeGender()==="girl"?"":"r")+" "+familyWord()+". Dazu habe ich keine eindeutig geprüfte Antwort. Ich möchte nichts erfinden. Frag bitte deine Eltern, damit ihr gemeinsam nach einem Beleg suchen könnt.",source:null};
  }
  async function submitQuestion(value) {
    if(!state.approved||state.busy)return;
    var q=String(value||"").trim().slice(0,350);if(!q){status.textContent="Schreib erst eine Frage.";return;}
    stopPlayback();
    var suggestions=chat.querySelector(".km-picks");if(suggestions)suggestions.remove();
    if(/angst vor|jemand tut mir weh|schlägt mich|will sterben|verletze mich|missbrauch|suizid|selbst verletzen|bin in gefahr/i.test(q)){
      message("you","[Private Frage – geschützt]");
      message("guide","Das klingt wichtig. Bitte sprich jetzt mit einem Erwachsenen, dem du vertraust. Wenn du gerade in Gefahr bist, hol sofort Hilfe. Du musst damit nicht allein bleiben.");
      input.value="";state.audio=null;state.lastAnswer=null;listen.disabled=true;
      status.textContent="Diese Frage wird geschützt behandelt und nicht an einen KI-Dienst gesendet.";
      return;
    }
    if(/adresse|telefonnummer|passwort|mein name ist|ich wohne|schick.*foto|(?:\+?\d[\d\s()-]{8,})/i.test(q)){
      message("you","[Private Angaben geschützt]");
      message("guide","Persönliche Daten gehören nicht in einen Chat. Bitte sprich mit deinen Eltern darüber.");
      input.value="";state.audio=null;state.lastAnswer=null;listen.disabled=true;
      status.textContent="Private Angaben wurden weder als Frage abgeschickt noch gespeichert.";
      return;
    }
    message("you",q);input.value="";state.audio=null;
    var item=null;
    var quranSearch=window.DarKidsQuranSearch;
    if(quranSearch?.isQuestion?.(q)){
      state.busy=true;send.disabled=true;
      status.textContent="Ich suche in allen 6.236 Qurʾān-Versen nach passenden Stellen …";
      try{
        var result=await quranSearch.search(q);
        if(result.status==="found"){
          var amount=result.results.length;
          var msg=result.exact?"Ich habe den gewünschten Qurʾān-Vers gefunden.":
            "Ich habe "+amount+" passende Qurʾān-Stelle"+(amount===1?"":"n")+" gefunden"+(result.total>amount?" (von "+result.total+" Worttreffern)":"")+".";
          item={answer:"Al-ḥamdu lillāh, mein"+(activeGender()==="girl"?"e liebe":" lieber")+" "+familyWord()+"! "+msg+" Du kannst den originalen arabischen Vers, die vorhandene deutsche Übersetzung und die Rezitation direkt unten öffnen. Ich füge keine eigene Tafsīr-Auslegung hinzu.",
            source:null,media:{kind:"quran_results",results:result.results,query:q,total:result.total,
               nextOffset:result.nextOffset||0},answerId:null};
        }else if(result.status==="too_broad"){
          item={answer:"Diese Suche ist sehr allgemein. Nenne bitte ein genaueres Wort, eine Sūrah oder eine Versnummer. Dann finden wir die passende Stelle. Wa-Allāhu aʿlam.",source:null};
        }else if(result.status==="not_found"){
          item={answer:"Wa-Allāhu aʿlam – Allah weiß es am besten. Ich habe in der vorhandenen Qurʾān-Übersetzung keine eindeutige Stelle zu diesen Wörtern gefunden. Versuch eine andere Formulierung oder frage deine Eltern.",source:null};
        }else{
          item={answer:"Der vollständige Qurʾān-Suchindex ist gerade nicht verfügbar. Ich möchte dir keine Verse aus dem Gedächtnis zuordnen. Bitte öffne den Qurʾān-Bereich oder versuche es erneut.",source:null};
        }
      }catch(_){
        item={answer:"Die Qurʾān-Suche ist derzeit nicht verfügbar. Versuche es später erneut oder öffne den Qurʾān-Bereich.",source:null};
      }finally{state.busy=false;send.disabled=false}
    }else if(state.serverAuthorized){
      state.busy=true;send.disabled=true;status.textContent="Geprüfte Antwort wird gesucht …";
      try{
        var response=await fetch("/kids/api/majlis/answer",{
          method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({question:q,age:state.age,gender:activeGender()})
        });
        if(!response.ok)throw Error("answer-unavailable");
        var data=await response.json();
        if(!data.ok||!data.answer)throw Error("answer-invalid");
        item={answer:String(data.answer),source:data.source||null,answerId:data.answerId||null,media:data.media||null};
      }catch(_){
        item={answer:"Die Verbindung zum geschützten Lernbereich funktioniert gerade nicht. Bitte versuche es später erneut oder frage deine Eltern.",source:null};
      }finally{state.busy=false;send.disabled=false}
    } else {
      item=await previewResponse(q)||responseFor(q);
    }
    if(!state.open)return;
    state.lastAnswer=item;
    var lastBox=message("guide",item.answer,item.source);
    if(item.media)mediaCard(lastBox,item.media);
    listen.disabled=!(state.serverAuthorized&&state.canSpeak&&item.answerId);
    state.turns++;
    status.textContent=state.serverAuthorized?(item.source?(state.canSpeak?"Geprüfte Antwort · mit Masterstimme anhörbar.":"Geprüfte Antwort · Sprachfunktion noch nicht aktiviert."):"Für diese Frage ist die Antwort bewusst begrenzt."):"Vorschau ohne Sprach-KI · nur feste Lernantworten.";
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
  function stopPlayback(){
    if(state.player){
      try{state.player.pause();state.player.removeAttribute("src");state.player.load()}catch(_){}
      state.player=null;
    }
    if(state.audioUrl){URL.revokeObjectURL(state.audioUrl);state.audioUrl=null;}
    listen.textContent="▶ Antwort anhören";
  }
  async function hear() {
    if(state.player&&!state.player.paused){stopPlayback();status.textContent="Wiedergabe beendet.";return;}
    if(!state.serverAuthorized||!state.canSpeak||!state.lastAnswer?.answerId||state.busy)return;
    // No browser TTS fallback: the product promises Serhat's actual master voice.
    state.busy=true;listen.disabled=true;status.textContent="Masterstimme wird angefragt …";
    try {
      var res=await fetch("/kids/api/majlis/speak",{method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({answerId:state.lastAnswer.answerId})});
      if(!res.ok||!(res.headers.get("Content-Type")||"").includes("audio/"))throw Error("voice-unavailable");
      var audioBlob=await res.blob();
      stopPlayback();
      if(!state.open)return;
      state.audioUrl=URL.createObjectURL(audioBlob);
      var audio=new Audio(state.audioUrl);
      state.player=audio;audio.preload="auto";
      audio.onended=function(){if(state.player===audio){stopPlayback();status.textContent="Antwort fertig angehört.";}};
      await audio.play();
      listen.textContent="■ Stoppen";
      status.textContent="Du hörst die Antwort mit der Masterstimme.";
    }catch(_){stopPlayback();status.textContent="Die Serhat-Masterstimme ist aktuell nicht verfügbar. Die Textantwort bleibt erhalten."}
    finally{state.busy=false;listen.disabled=!(state.open&&state.serverAuthorized&&state.canSpeak&&state.lastAnswer?.answerId)}
  }
  async function startOrStopMic(){
    if(state.recording && state.recording.state==="recording"){state.recording.stop();return;}
    if(!state.approved||state.busy)return;
    if(!state.serverAuthorized||!state.canTranscribe){status.textContent="Die Spracherkennung ist noch nicht freigeschaltet. Du kannst deine Frage schreiben.";return;}
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
        state.audio=state.open?new Blob(parts,{type:state.recording.mimeType||"audio/webm"}):null;
        mic.textContent="🎙";mic.setAttribute("aria-label","Sprachnachricht aufnehmen");
        status.textContent="Aufnahme bereit. Tippe auf ↑, um deine Wörter erkennen zu lassen. Du bestätigst den Text danach.";
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
      state.busy=false;state.audio=null;input.value=transcript;input.focus();
      status.textContent="Das habe ich verstanden. Prüfe oder korrigiere die Wörter und tippe dann auf ↑.";
    }catch(_){status.textContent="Die Spracherkennung klappt gerade nicht. Bitte tippe deine Frage ein."}
    finally{state.busy=false;send.disabled=false;mic.disabled=false}
  }
  function close(){
    if(state.recording&&state.recording.state==="recording")state.recording.stop();
    stopPlayback();
    state.open=false;state.approved=false;state.serverAuthorized=false;state.canSpeak=false;state.canTranscribe=false;state.audio=null;codeField.value="";
    var app=document.querySelector(".app");if(app)app.inert=false;
    root.classList.remove("km-open","km-parent-open");document.body.style.removeProperty("overflow");
    entry.focus({preventScroll:true});
  }
  function open(){
    if(state.open)return;
    var age=(document.querySelector(".app")||{}).getAttribute?.("data-age");
    if(["4–5","6–8","9–10"].includes(age))state.age=age;
    state.open=true;state.approved=false;state.serverAuthorized=false;state.serverReady=false;state.canSpeak=false;state.canTranscribe=false;check.checked=false;approve.disabled=true;codeField.value="";codeField.style.display="none";codeLabel.style.display="none";
    root.classList.add("km-open","km-parent-open");
    var app=document.querySelector(".app");if(app)app.inert=true;
    welcome();check.focus();
    fetch("/kids/api/majlis/session",{method:"GET",credentials:"same-origin",cache:"no-store"})
      .then(function(r){return r.ok?r.json():null})
      .then(function(data){
        if(!state.open)return;
        state.serverReady=!!(data&&data.ok);
        state.serverAuthorized=!!(data&&data.authorized);
        state.canSpeak=!!data?.capabilities?.voice;state.canTranscribe=!!data?.capabilities?.transcribe;
        if(state.serverReady){
          gateInfo.textContent=state.serverAuthorized?
            "Deine geschützte Elternfreigabe ist noch gültig. Du kannst den Bereich öffnen.":
            "Bitte gib den Eltern-Zugangscode ein. Ohne Code bleibt nur die sichere Vorschau verfügbar.";
          if(!state.serverAuthorized){codeField.style.display="block";codeLabel.style.display="grid";}
          approve.textContent="Geschützten Majlis öffnen";
        }else{
          gateInfo.textContent="Vorschau ohne Mikrofon oder KI-Stimme. Die geschützten Funktionen sind noch nicht freigeschaltet.";
          approve.textContent="Lernvorschau öffnen";
        }
      }).catch(function(){});
    history.pushState({kidsMajlis:true},"",window.location.href);
  }
  entry.addEventListener("click",open);
  back.addEventListener("click",function(){if(history.state&&history.state.kidsMajlis)history.back();else close()});
  window.addEventListener("popstate",function(){if(state.open)close()});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&state.open){ev.preventDefault();back.click()}});
  check.addEventListener("change",function(){approve.disabled=!check.checked});
  approve.addEventListener("click",async function(){
    if(!check.checked||state.busy)return;
    if(state.serverReady&&!state.serverAuthorized){
      var code=codeField.value.trim();
      if(code.length<24){gateInfo.textContent="Der Eltern-Zugangscode fehlt oder ist zu kurz.";return;}
      state.busy=true;approve.disabled=true;
      try{
        var r=await fetch("/kids/api/majlis/session",{
          method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code:code})
        });
        codeField.value="";
        if(!r.ok)throw Error("parent-code");
        var data=await r.json();
        if(!data.authorized)throw Error("no-session");
        state.serverAuthorized=true;state.canSpeak=!!data?.capabilities?.voice;state.canTranscribe=!!data?.capabilities?.transcribe;
      }catch(_){gateInfo.textContent="Elternfreigabe fehlgeschlagen. Bitte prüfe deinen Zugangscode.";return;}
      finally{state.busy=false;approve.disabled=false}
    }
    state.approved=true;root.classList.remove("km-parent-open");
    status.textContent=state.serverAuthorized?(state.canSpeak&&state.canTranscribe?"Geschützter Sprach- und Textchat bereit.":"Geschützter Textchat bereit. Audio noch nicht aktiviert."):"Vorschau: Schreibe oder wähle eine Frage.";
    input.focus();
  });
  form.addEventListener("submit",function(ev){ev.preventDefault();if(state.audio&&!input.value.trim())sendAudio();else submitQuestion(input.value)});
  input.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&!ev.shiftKey){ev.preventDefault();form.requestSubmit()}});
  mic.addEventListener("click",startOrStopMic);listen.addEventListener("click",hear);
  document.addEventListener("visibilitychange",function(){if(document.hidden&&state.recording&&state.recording.state==="recording")state.recording.stop()});
  reset.addEventListener("click",function(){stopPlayback();state.turns=0;state.lastAnswer=null;state.audio=null;listen.disabled=true;welcome()});
  window.DarKidsMajlis={open:open,close:close,version:"kids-majlis-safe-beta-2"};
})();