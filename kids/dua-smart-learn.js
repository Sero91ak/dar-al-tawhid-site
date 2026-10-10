(function(){
  /* DUA_AUDIO_RELEASE_1244_FINAL_SYNCED · V4_NATURAL_WORD_EDGES_20261010 */
  "use strict";

  // FUSHA_AUDIO_RELEASE_20261007_V3 · full v2 · slow/word v3 · exact vocalized Arabic
  var GERMAN_URL="/kids/data/dua-audio.json?v=8";
  var ARABIC_URL="/kids/data/dua-arabic-audio.json?v=9";
  var SLOW_URL="/kids/data/dua-arabic-slow-audio.json?v=4";
  var WORD_URL="/kids/data/dua-word-audio.json?v=4";
  var STORE_KEY="kids.dua.smart.progress.v2";

  var packs=null;
  var packPromise=null;
  var root=null;
  var audio=new Audio();
  var audioAttached=false;
  var warmers=[];
  var currentDua=null;
  var currentIndex=0;
  var playing=false;
  var mode="";
  var playToken=0;
  // Cancels pending phrase/preview promises when a child switches audio modes.
  var latestPhraseRequest=0;
  // Seamless Fuṣḥā player: decode words once, schedule with an accurate audio clock.
  // Conservative silence cropping removes synthetic padding, not Arabic phonemes.
  var cleanContext=null, cleanPlayback=null;
  var cleanWordCache=new Map();
  var cleanCacheMax=55;
  var CLEAN_GAP=0.19;
  var CLEAN_SLOW_RATE=0.86;
  function cleanContextReady(){
    try{
      var Ctor=window.AudioContext||window.webkitAudioContext;
      if(!Ctor||!window.fetch)return null;
      if(!cleanContext)cleanContext=new Ctor();
      return cleanContext;
    }catch(_){return null}
  }
  function cleanWordWindow(buffer){
    // Only trim padding at the beginning/end of isolated words.
    // Never gate inside Arabic speech: weak ه / ح and final vowels must survive.
    var rate=buffer.sampleRate,data=buffer.getChannelData(0);
    var step=Math.max(128,Math.round(rate*.012)),rms=[],peak=0;
    for(var pos=0;pos<data.length;pos+=step){
      var sum=0,len=Math.min(step,data.length-pos);
      for(var j=0;j<len;j++){var sample=data[pos+j];sum+=sample*sample}
      var level=Math.sqrt(sum/Math.max(1,len));
      rms.push(level);if(level>peak)peak=level;
    }
    var duration=buffer.duration,whole={buffer:buffer,start:0,end:duration};
    if(!peak||duration<.22||rms.length<6)return whole;
    // The voice peak, rather than a single click, defines the speech floor.
    var sorted=rms.slice().sort(function(a,b){return a-b});
    var reference=Math.max(sorted[Math.floor(sorted.length*.96)]||0,peak*.5);
    var voiceGate=Math.max(.0023,reference*.16);
    var quietGate=Math.max(.0010,reference*.052);
    var first=-1,last=-1;
    for(var i=0;i<rms.length-1;i++){
      if(rms[i]>=voiceGate&&rms[i+1]>=voiceGate){first=i;break}
    }
    for(var k=rms.length-1;k>0;k--){
      if(rms[k]>=voiceGate&&rms[k-1]>=voiceGate){last=k;break}
    }
    if(first<0||last<=first)return whole;
    // Keep quiet neighbouring consonants before/after the voiced nucleus.
    var leadSteps=0,tailSteps=0;
    while(first>0&&leadSteps<8&&rms[first-1]>=quietGate){first--;leadSteps++}
    while(last<rms.length-1&&tailSteps<10&&rms[last+1]>=quietGate){last++;tailSteps++}
    var start=Math.max(0,first*step/rate-.090);
    var end=Math.min(duration,(last+1)*step/rate+.120);
    if(end-start<Math.min(.22,duration*.28))return whole;
    return{buffer:buffer,start:start,end:end};
  }
  function cleanDecode(url){
    if(cleanWordCache.has(url))return cleanWordCache.get(url);
    var ctx=cleanContextReady();
    if(!ctx)return Promise.reject(new Error("web-audio-unavailable"));
    var promise=fetch(url,{cache:"force-cache"}).then(function(res){
      if(!res.ok)throw new Error("word-audio-"+res.status);
      return res.arrayBuffer();
    }).then(function(bytes){
      return ctx.decodeAudioData(bytes.slice(0));
    }).then(function(buffer){return cleanWordWindow(buffer)}).catch(function(err){
      cleanWordCache.delete(url);throw err;
    });
    cleanWordCache.set(url,promise);
    if(cleanWordCache.size>cleanCacheMax){
      var oldest=cleanWordCache.keys().next().value;
      if(oldest!==url)cleanWordCache.delete(oldest);
    }
    return promise;
  }
  function cleanStop(){
    if(!cleanPlayback)return;
    var previous=cleanPlayback;
    cleanPlayback=null;
    if(previous.raf)cancelAnimationFrame(previous.raf);
    (previous.sources||[]).forEach(function(s){try{s.onended=null;s.stop(0)}catch(_){}});
  }
  function playCleanSequence(urls,segs,whichMode,label,onFailure){
    var ctx=cleanContextReady();
    if(!ctx||!Array.isArray(urls)||!urls.length)return false;
    // Set state synchronously within the user's tap gesture.
    stopAudio();
    var token=playToken,dua=currentDua;
    playing=true;mode=whichMode;
    paintControls();setStatus(label,"");
    var audioGate={sources:[],raf:0};
    cleanPlayback=audioGate;
    Promise.resolve(ctx.resume()).then(function(){
      return Promise.all(urls.map(cleanDecode));
    }).then(function(rows){
      if(token!==playToken||cleanPlayback!==audioGate||currentDua!==dua)return;
      var starts=[],elapsed=0,first=ctx.currentTime+.065;
      rows.forEach(function(item,index){
        var duration=Math.max(.06,item.end-item.start),when=first+elapsed;
        starts.push(when);
        var source=ctx.createBufferSource();
        source.buffer=item.buffer;
        var gain=ctx.createGain();
        source.connect(gain);gain.connect(ctx.destination);
        var fade=Math.min(.032,duration*.16);
        gain.gain.setValueAtTime(0,when);
        gain.gain.linearRampToValueAtTime(1,when+fade);
        gain.gain.setValueAtTime(1,when+duration-fade);
        gain.gain.linearRampToValueAtTime(0,when+duration);
        source.start(when,item.start,duration);
        source.stop(when+duration+.001);
        audioGate.sources.push(source);
        elapsed+=duration+(index===rows.length-1?0:CLEAN_GAP);
      });
      function updateFocus(){
        if(token!==playToken||cleanPlayback!==audioGate)return;
        var now=ctx.currentTime,at=0;
        for(var i=1;i<starts.length;i++){if(now>=starts[i])at=i;else break}
        if(now>=starts[0]&&segs[at]&&currentIndex!==segs[at].index){
          currentIndex=segs[at].index;
          paintSelection();saveProgress();queueFocusedWord();
        }
        if(now>=first+elapsed+.08){
          cleanPlayback=null;playing=false;mode="";paintControls();
          setStatus(whichMode==="follow"?"Du hast die ganze Duʿāʾ gehört.":"Fertig.","good");
          return;
        }
        audioGate.raf=requestAnimationFrame(updateFocus);
      }
      audioGate.raf=requestAnimationFrame(updateFocus);
    }).catch(function(){
      if(token!==playToken||cleanPlayback!==audioGate)return;
      cleanStop();
      // If decoding is unsupported for a particular iPhone, keep approved HTMLAudio fallback.
      playing=false;mode="";paintControls();
      if(typeof onFailure==="function")onFailure();
      else setStatus("Diese Aufnahme ist derzeit nicht verfügbar.","bad");
    });
    return true;
  }
  var layoutFrame=0;
  var fitObserver=null;

  audio.preload="auto";
  audio.setAttribute("playsinline","");
  audio.setAttribute("webkit-playsinline","");
  audio.setAttribute("disableremoteplayback","");
  audio.volume=1;
  audio.muted=false;

  function ensureAudioAttached(){
    if(audioAttached&&audio.isConnected)return;
    var attach=function(){
      if(!document.body)return;
      if(!audio.isConnected){
        audio.style.display="none";
        audio.setAttribute("aria-hidden","true");
        document.body.appendChild(audio);
      }
      audioAttached=true;
    };
    if(document.body)attach();
    else document.addEventListener("DOMContentLoaded",attach,{once:true});
  }
  function warmUrl(url){
    if(!url)return;
    try{
      var node=new Audio();
      node.preload="auto";
      node.setAttribute("playsinline","");
      node.setAttribute("webkit-playsinline","");
      node.src=String(url);
      node.load();
      warmers.push(node);
      while(warmers.length>8){
        var stale=warmers.shift();
        try{stale.pause();stale.removeAttribute("src");stale.load()}catch(e){}
      }
    }catch(e){}
  }
  ensureAudioAttached();

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function norm(s){
    var value=String(s||"").replace(/\s+/g," ").trim();
    try{return value.normalize("NFD")}catch(e){return value}
  }
  function manifestEntryIndex(manifest){
    if(!manifest||!manifest.entries)return null;
    if(manifest.__darCanonicalEntries)return manifest.__darCanonicalEntries;
    var index=Object.create(null);
    Object.keys(manifest.entries).forEach(function(key){
      index[norm(key)]=manifest.entries[key];
    });
    try{Object.defineProperty(manifest,"__darCanonicalEntries",{value:index,configurable:true})}
    catch(e){manifest.__darCanonicalEntries=index}
    return index;
  }
  function arabicText(d){return norm(d&&(d.audioArabicText||d.arabic))}
  function fetchJson(url){
    return fetch(url,{cache:"no-store"}).then(function(r){
      if(!r.ok)throw new Error("dua-audio-manifest-"+r.status);
      return r.json();
    });
  }
  function loadPacks(){
    if(packs)return Promise.resolve(packs);
    if(packPromise)return packPromise;
    packPromise=Promise.all([fetchJson(GERMAN_URL),fetchJson(ARABIC_URL),fetchJson(SLOW_URL),fetchJson(WORD_URL)])
      .then(function(rows){
        var german=rows[0]||{},normal=rows[1]||{},slow=rows[2]||{},word=rows[3]||{};
        if(german.modelId!=="eleven_v4"||normal.modelId!=="eleven_v4"||slow.modelId!=="eleven_v4"||word.modelId!=="eleven_v4"){
          throw new Error("dua-audio-not-v4");
        }
        if(german.voiceProfileId!=="serhat-owner-voice-2026"||
           normal.voiceProfileId!=="serhat-owner-voice-2026"||
           slow.voiceProfileId!=="serhat-owner-voice-2026"||
           word.voiceProfileId!=="serhat-owner-voice-2026"){
          throw new Error("dua-audio-not-serhat-master");
        }
        packs={german:german,normal:normal,slow:slow,word:word};
        return packs;
      })
      .catch(function(err){packPromise=null;throw err});
    return packPromise;
  }
  function entry(manifest,text){
    var index=manifestEntryIndex(manifest);
    return index&&index[norm(text)]||null;
  }

  function store(){
    try{return JSON.parse(localStorage.getItem(STORE_KEY)||"{}")||{}}catch(e){return{}}
  }
  function saveProgress(){
    if(!currentDua)return;
    try{
      var all=store();
      all[currentDua.id]={index:currentIndex,updatedAt:Date.now()};
      localStorage.setItem(STORE_KEY,JSON.stringify(all));
    }catch(e){}
  }
  function restoreIndex(dua){
    try{
      var x=Number((store()[dua.id]||{}).index);
      if(Number.isFinite(x))return Math.max(0,Math.min(getSegments(dua).length-1,x));
    }catch(e){}
    return 0;
  }

  function stripArabicPunct(s){
    return norm(s).split(/\s+/).map(function(x){
      return x
        .replace(/[\u06D6-\u06DC]/g,"")
        .replace(/^[،؛؟,.!…«»"'()\[\]{}]+|[،؛؟,.!…«»"'()\[\]{}]+$/g,"");
    }).filter(function(x){
      return Boolean(x)&&/[\u0621-\u064A\u0671]/.test(x);
    });
  }
  function latinParts(s){
    return norm(s).replace(/[،,؛;؟?!…]/g," ").split(/\s+/).filter(Boolean);
  }
  function alignTranslit(full,count){
    var p=latinParts(full);
    if(!count)return[];
    if(p.length<count){
      var expanded=[];
      p.forEach(function(tok){
        var bits=tok.split("-").filter(Boolean);
        if(bits.length>1)bits.forEach(function(b,j){expanded.push((j?"-":"")+b)});
        else expanded.push(tok);
      });
      if(expanded.length>=p.length)p=expanded;
    }
    if(p.length===count)return p;
    var out=[];
    for(var i=0;i<count;i++){
      var a=Math.floor(i*p.length/count);
      var b=Math.floor((i+1)*p.length/count);
      if(b<=a)b=Math.min(p.length,a+1);
      out.push(p.slice(a,b).join(" "));
    }
    return out;
  }
  function getSegments(dua){
    if(!dua)return[];
    var words=stripArabicPunct(dua.audioArabicText||dua.arabic||"");
    var old=Array.isArray(dua.learningSegments)?dua.learningSegments:[];
    var trans=alignTranslit(dua.transliteration||"",words.length);
    var phonetic=(window.DARKidsDuaPhoneticAlignment&&window.DARKidsDuaPhoneticAlignment.get)?
      window.DARKidsDuaPhoneticAlignment.get(dua,words):null;
    var reviewed=(window.DARKidsDuaWordMeanings&&window.DARKidsDuaWordMeanings.get)?
      window.DARKidsDuaWordMeanings.get(dua,words):null;
    return words.map(function(word,i){
      var row=old[i]||{};
      return {
        index:i,
        arabic:word,
        transliteration:norm(row.transliteration||(phonetic&&phonetic[i])||trans[i]||""),
        german:String(row.german||row.meaning||(reviewed&&reviewed[i])||"").trim(),
        audioKey:word,
        audioUrl:String(row.audioUrl||"")
      };
    });
  }

  function setStatus(text,kind){
    var el=document.getElementById("dslStatus");
    if(!el)return;
    el.textContent=String(text||"");
    el.classList.toggle("good",kind==="good");
    el.classList.toggle("bad",kind==="bad");
  }
  function paintControls(){
    if(!root)return;
    var full=root.querySelector('[data-dsl="full"]');
    var slow=root.querySelector('[data-dsl="slow"]');
    var follow=root.querySelector('[data-dsl="follow"]');
    if(full)full.textContent=playing&&mode==="full"?"Stopp":"Ganz hören";
    if(slow)slow.textContent=playing&&mode==="slow"?"Stopp":"Langsam hören";
    if(follow)follow.textContent=playing&&mode==="follow"?"Stopp":"Wort für Wort";
    root.classList.toggle("phrase-playing",playing&&(mode==="full"||mode==="slow"));
  }
  function paintSelection(){
    if(!root||!currentDua)return;
    var segs=getSegments(currentDua);
    var seg=segs[currentIndex]||{};
    root.querySelectorAll("[data-seg]").forEach(function(n){
      n.classList.toggle("active",Number(n.getAttribute("data-seg"))===currentIndex);
    });
    var ar=document.getElementById("dslFocusAr");
    var tr=document.getElementById("dslFocusTr");
    var count=document.getElementById("dslCount");
    var prog=document.getElementById("dslProgress");
    if(ar)ar.textContent=seg.arabic||"";
    if(tr)tr.textContent=seg.transliteration||"";
    var de=document.getElementById("dslGermanCurrent");
    // Even in an internally scrollable long Duʿāʾ all three active levels stay visible.
    if(de)de.textContent=seg.german?[seg.arabic,seg.transliteration,seg.german].filter(Boolean).join(" · "):"Gesamtbedeutung des Duʿāʾs";
    if(count)count.textContent=(currentIndex+1)+" / "+Math.max(1,segs.length);
    if(prog)prog.style.width=(((currentIndex+1)/Math.max(1,segs.length))*100).toFixed(1)+"%";
  }
  function setReady(on){
    if(!root)return;
    root.classList.toggle("exact-ready",!!on);
    root.querySelectorAll("[data-seg]").forEach(function(n){n.disabled=!on});
    ["follow","prev","next","full","slow"].forEach(function(a){
      var b=root.querySelector('[data-dsl="'+a+'"]');
      if(b)b.disabled=!on;
    });
  }
  // v1259: focused Arabic word scrolls within the learning viewport only.
  // The Arabic and transliteration rows now wrap; no horizontal slider exists.
  function keepFocusedWordVisible(){
    if(!root||!root.classList.contains("open"))return;
    function follow(container,word,inset){
      if(!container||!word)return;
      var view=container.getBoundingClientRect();
      var rect=word.getBoundingClientRect();
      if(rect.top<view.top+inset||rect.bottom>view.bottom-inset){
        var desired=container.scrollTop+(rect.top-view.top)-(view.height-rect.height)*.35;
        try{container.scrollTo({top:Math.max(0,desired),behavior:"smooth"})}
        catch(e){container.scrollTop=Math.max(0,desired)}
      }
    }
    if(root.classList.contains("dsl-long-content")){
      // Long Duʿāʾs use three vertically bounded reading lanes.
      // The ACTIVE Arabic, Latin and German words must all remain visible.
      [".dsl-arabic",".dsl-translit",".dsl-german"].forEach(function(selector){
        var layer=root.querySelector(selector);
        if(!layer)return;
        var word=layer.querySelector('[data-seg="'+currentIndex+'"]');
        follow(layer,word,8);
      });
      return;
    }
    var stage=root.querySelector(".dsl-reading-stage")||root.querySelector(".dsl-scroll");
    follow(stage,root.querySelector('.dsl-arabic [data-seg="'+currentIndex+'"]'),10);
    // On a tiny screen make the German counterpart visible as well.
    if(stage&&stage.scrollHeight>stage.clientHeight){
      follow(stage,root.querySelector('.dsl-german [data-seg="'+currentIndex+'"]'),8);
    }
  }
  function queueFocusedWord(){requestAnimationFrame(keepFocusedWordVisible)}
  // KIDS_DUA_ELASTIC_CENTER_V1286
  // Short duas stay optically centered. Medium-length duas grow outwards from
  // the center. Long text stays readable in three independently tracked lanes.
  function measureLines(selector){
    if(!root)return 0;
    var rows=Object.create(null);
    root.querySelectorAll(selector).forEach(function(el){
      rows[Math.round(el.offsetTop/3)*3]=true;
    });
    return Object.keys(rows).length;
  }
  function fitReadingStage(){
    if(!root||!root.classList.contains("open")||!currentDua)return;
    var stage=root.querySelector(".dsl-reading-stage");
    if(!stage||!stage.clientHeight)return;
    var count=getSegments(currentDua).length;
    var short=count<=5;
    var medium=count<=14;
    var extensive=count>22;
    root.classList.remove("dsl-long-content","dsl-reader-short","dsl-reader-medium","dsl-reader-long");
    root.classList.add(short?"dsl-reader-short":(medium?"dsl-reader-medium":"dsl-reader-long"));
    // Keep the active accessibility highlight on all three languages;
    // never reduce type to tiny unreadable text just to eliminate scrolling.
    var floor=short?[46,21,18]:medium?[42,20.5,18]:extensive?[38,18.5,16.5]:[38,19,17];
    var ceiling=short?[62,28,23]:medium?[58,27,23]:extensive?[47,23,19.5]:[52,25,21];
    var allowedArabic=short?3:(medium?4:7);
    var allowedLatin=short?3:(medium?3:5);
    var available=stage.clientHeight;
    var chosen=null;
    function apply(values){
      root.style.setProperty("--dsl-ar-size",values[0].toFixed(2)+"px");
      root.style.setProperty("--dsl-tr-size",values[1].toFixed(2)+"px");
      root.style.setProperty("--dsl-de-size",values[2].toFixed(2)+"px");
    }
    function fits(){
      var arabic=stage.querySelector(".dsl-arabic");
      var latin=stage.querySelector(".dsl-translit");
      var german=stage.querySelector(".dsl-german");
      var current=stage.querySelector(".dsl-german-current");
      var natural=(arabic?arabic.scrollHeight:0)+(latin?latin.scrollHeight:0)+
        (german?german.scrollHeight:0)+(current&&getComputedStyle(current).display!=="none"?current.scrollHeight:0);
      return natural<=available-9&&stage.scrollHeight<=available+2&&
        measureLines(".dsl-arabic .dsl-word")<=allowedArabic&&
        measureLines(".dsl-translit .dsl-word")<=allowedLatin;
    }
    // Two passes through a bounded 3D type scale; the final fit is measured
    // using the actual on-screen font and width, not the item count alone.
    for(var i=0;i<=18;i++){
      var fraction=i/18;
      var trial=floor.map(function(min,j){return min+(ceiling[j]-min)*fraction});
      apply(trial);
      if(!fits())break;
      chosen=trial;
    }
    if(chosen){
      apply(chosen);
    }else{
      // No safe text fit: give each language its own bounded scroll lane.
      // The focused Arabic, Latin, German tokens stay jointly visible.
      apply(floor);
      root.classList.add("dsl-long-content");
    }
    if(extensive)root.classList.add("dsl-long-content");
    queueFocusedWord();
  }
  function queueReaderFit(){
    if(layoutFrame)cancelAnimationFrame(layoutFrame);
    layoutFrame=requestAnimationFrame(function(){
      layoutFrame=0;
      fitReadingStage();
    });
  }
  function selectIndex(i,opts){
    opts=opts||{};
    var segs=getSegments(currentDua);
    if(!segs.length)return;
    currentIndex=Math.max(0,Math.min(segs.length-1,Number(i)||0));
    saveProgress();
    paintSelection();
    if(opts.play)playWord(currentIndex);
    if(opts.scroll!==false)queueFocusedWord();
  }


  // Continuous phrase audio: exact reviewed markers for the audio SOURCE, otherwise
  // approximate word cues derived from actual full-clip and word durations.
  function phraseWordStarts(d,slow,duration,segs){
    var approved=d&&d.audioWordTimes&&d.audioWordTimes[slow?"slow":"normal"];
    if(Array.isArray(approved)&&approved.length===segs.length){
      var exact=approved.map(function(x){return Number(typeof x==="number"?x:x&&x.startSeconds)});
      if(exact.every(function(x,i){return Number.isFinite(x)&&x>=0&&x<=duration&&(i===0||x>exact[i-1])}))return exact;
    }
    var weights=segs.map(function(seg){
      var e=packs&&entry(packs.word,seg.audioKey||seg.arabic),v=Number(e&&e.durationSeconds);
      var letters=(seg.arabic.match(/[\u0621-\u064A\u0671-\u06D3]/g)||[]).length;
      var t=Math.max(.30,Math.sqrt(Math.max(1,letters))*.42);
      var w=Number.isFinite(v)&&v>0?Math.max(.32,v-.78):t;
      return Math.min(2.6,Math.max(.30,w*.65+t*.35));
    });
    var total=weights.reduce(function(a,b){return a+b},0)||1;
    var cursor=Math.min(.16,duration*.025);
    var usable=Math.max(.01,duration-cursor-Math.min(.10,duration*.02));
    return weights.map(function(w){var start=cursor;cursor+=w/total*usable;return start});
  }
  function attachPhraseFollow(d,slow,token){
    if(!root||!root.classList.contains("open")||!d)return;
    var segs=getSegments(d),lastDuration=0,starts=[];
    if(!segs.length)return;
    var m=packs&&entry(slow?packs.slow:packs.normal,arabicText(d));
    var fallback=Number(m&&m.durationSeconds);
    function update(){
      if(token!==playToken||currentDua!==d||!root.classList.contains("open"))return;
      var duration=Number(audio.duration);
      if(!Number.isFinite(duration)||duration<=0)duration=fallback;
      if(!Number.isFinite(duration)||duration<=0)return;
      if(duration!==lastDuration){lastDuration=duration;starts=phraseWordStarts(d,slow,duration,segs)}
      var seconds=Math.max(0,Number(audio.currentTime)||0),index=0;
      for(var i=1;i<starts.length;i++){if(seconds>=starts[i])index=i;else break}
      if(index!==currentIndex){currentIndex=index;paintSelection();queueFocusedWord()}
    }
    audio.ontimeupdate=update;audio.onloadedmetadata=update;audio.onseeked=update;
    currentIndex=0;paintSelection();queueFocusedWord();
    var tickCount=0;
    function tick(){
      if(token!==playToken||!playing||currentDua!==d)return;
      if((tickCount++%4)===0)update();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function stopAudio(){
    playToken++;
    latestPhraseRequest++;
    cleanStop();
    playing=false;
    mode="";
    try{audio.pause()}catch(e){}
    audio.onended=null;
    audio.onerror=null;
    audio.oncanplay=null;
    audio.onloadedmetadata=null;
    audio.ontimeupdate=null;
    audio.onseeked=null;
    paintControls();
    try{if(window.DARKidsOwnerVoice&&typeof window.DARKidsOwnerVoice.stop==="function")window.DARKidsOwnerVoice.stop()}catch(e){}
  }
  function playUrl(url,whichMode,label,playRate){
    stopAudio();
    if(!url){setStatus("Audio ist noch nicht verfügbar.","bad");return Promise.reject(new Error("missing-audio"))}
    playToken++;
    var token=playToken;
    playing=true;
    mode=whichMode||"full";
    paintControls();
    setStatus(label||"Hör gut zu …","");
    return new Promise(function(resolve,reject){
      var finish=function(ok){
        if(token!==playToken)return;
        playing=false;mode="";paintControls();
        if(ok){setStatus("Fertig.","good");resolve(true)}
        else{setStatus("Audio konnte nicht gestartet werden.","bad");reject(new Error("audio-playback"))}
      };
      try{
        ensureAudioAttached();
        audio.muted=false;
        audio.volume=1;
        audio.src=String(url);
        audio.currentTime=0;
        audio.playbackRate=Number(playRate)||1;
        audio.preservesPitch=true;
        if('webkitPreservesPitch' in audio)audio.webkitPreservesPitch=true;
        audio.onended=function(){finish(true)};
        audio.onerror=function(){finish(false)};
        try{audio.load()}catch(e){}
        if((mode==="full"||mode==="slow")&&root&&root.classList.contains("open")&&currentDua){
          // HTMLAudio.currentTime is the SOURCE clock even when playbackRate
          // is 0.86. Use NORMAL word markers for slowed normal recordings.
          // Use SLOW markers only for a distinct approved native slow clip.
          var approvedSlow=mode==="slow"?approvedNativeSlowUrl(currentDua):"";
          var nativeSlow=!!approvedSlow&&String(url)===approvedSlow;
          attachPhraseFollow(currentDua,nativeSlow,token);
        }
        var p=audio.play();
        if(p&&p.catch)p.catch(function(){finish(false)});
      }catch(e){finish(false)}
    });
  }
  // Each native Serhat Fuṣḥā word clip advances focus on its REAL ended
  // event. Unlike estimated offsets into the uninterrupted phrase, this
  // creates exact focus synchronization without invented timestamps.
  function playWordSequenceLegacy(){
    var dua=currentDua;
    var segs=getSegments(dua);
    if(!segs.length)return false;
    var urls=segs.map(function(seg){
      var row=packs&&entry(packs.word,seg.audioKey||seg.arabic);
      return seg.audioUrl||(row&&row.url)||"";
    });
    if(urls.some(function(url){return !url}))return false;
    stopAudio();
    var token=playToken;
    playing=true;
    mode="follow";
    paintControls();
    setStatus("Wort für Wort: Die Markierung folgt genau der Aufnahme.","");
    ensureAudioAttached();
    function fail(){
      if(token!==playToken)return;
      stopAudio();
      setStatus("Eine Wortaufnahme konnte nicht abgespielt werden.","bad");
    }
    function advance(i){
      if(token!==playToken||currentDua!==dua)return;
      if(i>=segs.length){
        audio.onended=null;
        playing=false;
        mode="";
        paintControls();
        setStatus("Du hast die ganze Duʿāʾ gehört.","good");
        return;
      }
      currentIndex=i;
      saveProgress();
      paintSelection();
      queueFocusedWord();
      try{
        audio.pause();
        audio.onended=null;
        audio.onerror=null;
        audio.src=String(urls[i]);
        audio.currentTime=0;
        audio.playbackRate=1;
        audio.muted=false;
        audio.volume=1;
        audio.onended=function(){advance(i+1)};
        audio.onerror=fail;
        var p=audio.play();
        if(p&&p.catch)p.catch(fail);
      }catch(e){fail()}
    }
    advance(0);
    return true;
  }
  function playWordSequence(){
    var dua=currentDua,segs=getSegments(dua);
    if(!segs.length)return false;
    var urls=segs.map(function(seg){
      var row=packs&&entry(packs.word,seg.audioKey||seg.arabic);
      return seg.audioUrl||(row&&row.url)||"";
    });
    if(urls.some(function(url){return !url}))return playWordSequenceLegacy();
    if(playCleanSequence(urls,segs,"follow","Wort für Wort: Die Markierung folgt direkt der Fuṣḥā-Aufnahme.",playWordSequenceLegacy))return true;
    return playWordSequenceLegacy();
  }
  // Newly rendered dedicated slow takes are used only after explicit
  // pronunciation + breath/listening QA. Old automatic batches are not approved.
  function approvedNativeSlowUrl(dua){
    var row=packs&&entry(packs.slow,arabicText(dua));
    return row&&row.audioListeningApproved===true&&
      row.qaApproval==="human-reviewed-natural-fusha"&&row.url?String(row.url):"";
  }
  function playWhole(slow){
    if(!currentDua)return false;
    var requestedDua=currentDua,requestId=++latestPhraseRequest;
    var nativeSlow=slow?approvedNativeSlowUrl(requestedDua):"";
    if(nativeSlow){
      return playUrl(nativeSlow,"slow","Natürlich langsame, freigegebene Fuṣḥā-Aufnahme …",1);
    }
    // Reuse the same uninterrupted Fuṣḥā master. The prior separately
    // synthesized 'slow' take carried audible pacing/breath artefacts.
    // Moderate native pitch-preserving playback slows evenly; no separately generated breath cues.
    var rate=slow?CLEAN_SLOW_RATE:1;
    var direct=requestedDua.audioArabicUrl;
    if(direct){
      return playUrl(direct,slow?"slow":"full",
        slow?"Gleichmäßig langsame Fuṣḥā-Aufnahme …":"Flüssige Fuṣḥā-Gesamtaufnahme …",rate);
    }
    var run=function(p){
      if(requestId!==latestPhraseRequest||currentDua!==requestedDua)return false;
      var e=entry(p.normal,arabicText(requestedDua));
      if(!e||!e.url)throw new Error("missing-phrase");
      return playUrl(e.url,slow?"slow":"full",
        slow?"Langsam und gleichmäßig zuhören …":"Duʿāʾ anhören …",rate);
    };
    if(packs){
      try{return run(packs)}catch(e){setStatus("Diese Aufnahme ist nicht verfügbar.","bad");return false}
    }
    return loadPacks().then(run).catch(function(){
      if(requestId===latestPhraseRequest&&currentDua===requestedDua)
        setStatus("Diese Aufnahme konnte nicht geladen werden.","bad");
      return false;
    });
  }
  function playWord(i){
    var segs=getSegments(currentDua);
    var seg=segs[Number(i)];
    if(!seg)return false;
    selectIndex(i,{scroll:true,play:false});
    if(seg.audioUrl&&playCleanSequence([seg.audioUrl],[seg],"word","Nur dieses Wort: "+(seg.transliteration||seg.arabic),function(){
      playUrl(seg.audioUrl,"word","Nur dieses Wort: "+(seg.transliteration||seg.arabic));
    }))return true;
    if(seg.audioUrl){
      return playUrl(seg.audioUrl,"word","Nur dieses Wort: "+(seg.transliteration||seg.arabic));
    }
    var run=function(p){
      var e=entry(p.word,seg.audioKey||seg.arabic);
      if(!e||!e.url)throw new Error("missing-word");
      return playUrl(e.url,"word","Nur dieses Wort: "+(seg.transliteration||seg.arabic));
    };
    if(packs){
      try{return run(packs)}catch(e){setStatus("Die Einzelaufnahme ist nicht verfügbar.","bad");return false}
    }
    return loadPacks().then(run).catch(function(){
      setStatus("Die Einzelaufnahme konnte nicht geladen werden.","bad");
      return false;
    });
  }
  function germanText(d){
    return norm(d&&(d.audioGermanText||((d.childPrompt||"")+" "+(d.meaning||""))));
  }
  function playGerman(dua){
    if(!dua)return false;
    if(dua.audioGermanUrl){
      return playUrl(dua.audioGermanUrl,"german","Erklärung anhören …");
    }
    var run=function(p){
      var text=germanText(dua);
      var e=entry(p.german,text);
      if(!e||!e.url)throw new Error("missing-german");
      return playUrl(e.url,"german","Erklärung anhören …");
    };
    if(packs){
      try{return run(packs)}catch(e){return false}
    }
    return loadPacks().then(run).catch(function(){return false});
  }
  function prepare(dua){
    if(!dua)return loadPacks();
    if(dua.audioArabicUrl)warmUrl(dua.audioArabicUrl);
    if(dua.audioArabicSlowUrl)warmUrl(dua.audioArabicSlowUrl);
    if(dua.audioGermanUrl)warmUrl(dua.audioGermanUrl);
    var directSegs=getSegments(dua);
    for(var di=0;di<Math.min(3,directSegs.length);di++){
      if(directSegs[di].audioUrl)warmUrl(directSegs[di].audioUrl);
    }
    if(dua.directAudioReady&&directSegs.every(function(s){return !!s.audioUrl}))return Promise.resolve(true);
    return loadPacks().then(function(p){
      var normal=entry(p.normal,arabicText(dua));
      var slow=entry(p.slow,arabicText(dua));
      var german=entry(p.german,germanText(dua));
      if(normal&&normal.url)warmUrl(normal.url);
      if(slow&&slow.url)warmUrl(slow.url);
      if(german&&german.url)warmUrl(german.url);
      var segs=getSegments(dua);
      for(var i=0;i<Math.min(3,segs.length);i++){
        var w=entry(p.word,segs[i].audioKey||segs[i].arabic);
        if(w&&w.url)warmUrl(w.url);
      }
      return allReady(dua,p);
    });
  }

  function ensureRoot(){
    if(root)return root;
    root=document.createElement("div");
    root.id="duaSmartLearn";
    root.className="dsl";
    root.setAttribute("aria-hidden","true");
    root.innerHTML=
      '<div class="dsl-backdrop" data-dsl="close"></div>'+
      '<section class="dsl-sheet" role="dialog" aria-modal="true" aria-labelledby="dslTitle">'+
        '<header class="dsl-head kids-detail-appbar" data-kids-unified-header="v1287">'+
          '<button class="dsl-close kids-detail-dock-back" type="button" data-dsl="close" aria-label="Zurück zu Mein Duʿāʾ"></button>'+
          '<div class="dsl-headcopy kids-detail-appbar-copy"><strong class="kids-detail-appbar-title" id="dslTitle">Duʿāʾ lernen</strong><span class="kids-detail-appbar-subtitle" id="dslSub">Mein Duʿāʾ · Fuṣḥā &amp; Wort für Wort</span></div>'+
          '<div class="dsl-count" id="dslCount">1 / 1</div>'+
          '<div class="dsl-progress" role="progressbar" aria-label="Lernfortschritt"><i id="dslProgress"></i></div>'+
        '</header>'+
        '<div class="dsl-scroll">'+
          '<div class="dsl-guide">Tippe auf ein Wort und höre es einzeln.</div>'+ 
          '<div class="dsl-reading-stage">'+
          '<div class="dsl-arabic" id="dslArabic" dir="rtl" lang="ar"></div>'+
          '<div class="dsl-translit" id="dslTranslit"></div>'+
          '<div class="dsl-german" id="dslGerman" lang="de"></div>'+
          '<div class="dsl-german-current" id="dslGermanCurrent" aria-live="off"></div>'+
          '</div>'+ 
          '<div class="dsl-bottom-block">'+
          '<div class="dsl-controls">'+
            '<button class="dsl-play primary" type="button" data-dsl="full">Ganz hören</button>'+
            '<button class="dsl-play slow" type="button" data-dsl="slow">Langsam hören</button>'+
 
            '<button class="dsl-play follow" type="button" data-dsl="follow">Wort für Wort</button>'+
          '</div>'+
          '<div class="dsl-speednote">Flüssig hören · Langsam mitlesen · Wörter einzeln lernen</div>'+
          '<div class="dsl-stepnav">'+
            '<button type="button" data-dsl="prev">‹ Vorheriges Wort</button>'+
            '<button type="button" data-dsl="next">Nächstes Wort ›</button>'+
          '</div>'+
          '<div class="dsl-status" id="dslStatus">Audio wird geprüft …</div>'+
          '</div>'+
        '</div>'+
      '</section>';
    document.body.appendChild(root);
    root.addEventListener("click",onClick);
    return root;
  }
  function render(){
    ensureRoot();
    var segs=getSegments(currentDua);
    document.getElementById("dslTitle").textContent=currentDua?currentDua.title:"Duʿāʾ lernen";
    document.getElementById("dslArabic").innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word ar" data-seg="'+i+'" aria-label="'+esc(s.transliteration||s.arabic)+'">'+esc(s.arabic)+'</button>';
    }).join(" ");
    document.getElementById("dslTranslit").innerHTML=segs.map(function(s,i){
      return '<button type="button" class="dsl-word tr" data-seg="'+i+'">'+esc(s.transliteration||"•")+'</button>';
    }).join(" ");
    var german=document.getElementById("dslGerman");
    var complete=segs.length>0&&segs.every(function(s){return Boolean(s.german)});
    root.classList.toggle("dsl-reviewed-words",complete);
    german.innerHTML=complete?segs.map(function(s,i){
      return '<button type="button" class="dsl-word de" data-seg="'+i+'">'+esc(s.german)+'</button>';
    }).join(" "):'<p class="dsl-german-phrase">'+esc(currentDua&&currentDua.meaning||"")+'</p>';
    paintSelection();
    paintControls();
    queueFocusedWord();
  }
  function allReady(dua,p){
    var text=arabicText(dua);
    if(!entry(p.normal,text)||!entry(p.slow,text))return false;
    return getSegments(dua).every(function(s){return !!entry(p.word,s.audioKey||s.arabic)});
  }
  function open(dua){
    if(!dua||!arabicText(dua))return;
    ensureRoot();
    stopAudio();
    currentDua=dua;
    currentIndex=restoreIndex(dua);
    render();
    root.classList.add("open");
    root.setAttribute("aria-hidden","false");
    queueReaderFit();
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queueReaderFit).catch(function(){});
    if(!fitObserver&&window.ResizeObserver){
      fitObserver=new ResizeObserver(function(){queueReaderFit()});
      fitObserver.observe(root.querySelector(".dsl-sheet"));
    }
    var view=root.querySelector(".dsl-reading-stage")||root.querySelector(".dsl-scroll");
    if(view)view.scrollTop=0;
    queueFocusedWord();
    document.documentElement.classList.add("dua-smart-open");
    document.body.classList.add("dua-smart-open");
    setReady(false);
    setStatus("Die Fuṣḥā-Aufnahmen werden geladen …","");
    loadPacks().then(function(p){
      if(currentDua!==dua)return;
      var ok=allReady(dua,p);
      setReady(ok);
      setStatus(ok?"Bereit. Jedes Wort hat eine eigene Fuṣḥā-Aufnahme.":"Einzelne Aufnahmen werden noch vorbereitet.",ok?"good":"");
    }).catch(function(){
      setReady(false);
      setStatus("Die Audio-Pakete konnten noch nicht geladen werden.","bad");
    });
  }
  function close(){
    stopAudio();
    saveProgress();
    if(root){
      root.classList.remove("open");
      root.setAttribute("aria-hidden","true");
    }
    document.documentElement.classList.remove("dua-smart-open");
    document.body.classList.remove("dua-smart-open");
    if(layoutFrame){cancelAnimationFrame(layoutFrame);layoutFrame=0}
    currentDua=null;
  }
  function onClick(ev){
    var seg=ev.target.closest&&ev.target.closest("[data-seg]");
    if(seg){
      var i=Number(seg.getAttribute("data-seg"));
      playWord(i);
      return;
    }
    var b=ev.target.closest&&ev.target.closest("[data-dsl]");
    if(!b)return;
    var a=b.getAttribute("data-dsl");
    if(a==="close"){close();return}
    if(a==="full"){
      if(playing&&mode==="full"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else playWhole(false);
      return;
    }
    if(a==="slow"){
      if(playing&&mode==="slow"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else playWhole(true);
      return;
    }
    if(a==="follow"){
      if(playing&&mode==="follow"){stopAudio();setStatus("Wiedergabe gestoppt.","")}
      else if(!playWordSequence())setStatus("Wortaufnahmen noch nicht vollständig verfügbar.","bad");
      return;
    }
    if(a==="prev"){selectIndex(currentIndex-1,{play:true});return}
    if(a==="next"){selectIndex(currentIndex+1,{play:true});return}
  }
  function preview(dua,rate){
    if(!dua)return false;
    var requestId=++latestPhraseRequest;
    var slow=Number(rate||1)<.9;
    currentDua=dua;
    var approved=slow?approvedNativeSlowUrl(dua):"";
    if(approved)return playUrl(approved,"slow","Freigegebene langsame Fuṣḥā-Aufnahme …",1);
    // Keep preview and full-screen lesson on the SAME verified phrase source.
    // Do not route preview through the old [slowly] master with breath artefacts.
    var direct=dua.audioArabicUrl,playRate=slow?CLEAN_SLOW_RATE:1;
    if(direct)return playUrl(direct,slow?"slow":"full",slow?"Ruhig und natürlich zuhören …":"Duʿāʾ anhören …",playRate);
    var run=function(p){
      if(requestId!==latestPhraseRequest||currentDua!==dua)return false;
      var native=slow?approvedNativeSlowUrl(dua):"";
      var e=entry(p.normal,arabicText(dua));
      if(!native&&(!e||!e.url))throw new Error("missing-preview");
      return playUrl(native||(e&&e.url),slow?"slow":"full",
        slow?"Ruhig und natürlich zuhören …":"Duʿāʾ anhören …",native?1:playRate);
    };
    if(packs)return run(packs);
    return loadPacks().then(run);
  }

  document.addEventListener("visibilitychange",function(){if(document.hidden)stopAudio()});
  window.addEventListener("resize",queueReaderFit,{passive:true});
  window.addEventListener("orientationchange",queueReaderFit,{passive:true});
  window.addEventListener("pageshow",function(){
    if(!root||!root.classList.contains("open")){
      document.documentElement.classList.remove("dua-smart-open");
      document.body.classList.remove("dua-smart-open");
    }
  });
  window.DARDuaSmartLearn={
    open:open,
    close:close,
    stop:stopAudio,
    playPreview:preview,
    playGerman:playGerman,
    prepare:prepare,
    isReady:function(){return !!packs}
  };
  loadPacks().catch(function(){});
})();
// DUA_AUDIO_RELEASE_FUSHA_V3_20261007
