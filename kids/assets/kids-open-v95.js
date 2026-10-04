(function(){
  var launch=document.getElementById("kidsLaunch");
  var film=document.getElementById("kidsOpenFilm");
  var greeting=document.getElementById("kidsOwnerGreeting");
  var ring=document.getElementById("kidsLaunchRing");
  var pct=document.getElementById("kidsLaunchPct");
  var seal=document.getElementById("kidsLaunchSeal");
  if(!launch)return;

  var native=false;
  try{
    var ua=String(navigator.userAgent||"");
    native=!!(window.DAR_KIDS_IOS_APP||window.DAR_IOS_NATIVE_APP||document.documentElement.classList.contains("kids-ios-app")||/DarAlTawhidKids-iOS/i.test(ua));
  }catch(e){}
  if(native){
    try{launch.classList.add("is-ending")}catch(e2){}
    if(launch.parentNode)launch.parentNode.removeChild(launch);
    return;
  }

  var C=339.292;
  var done=false;
  var spoken=false;
  var raf=0;

  function progress(p){
    p=Math.max(0,Math.min(1,p));
    if(ring)ring.style.strokeDashoffset=String(C*(1-p));
    if(pct)pct.textContent=Math.round(p*100)+"%";
    if(seal)seal.style.transform="scale("+(0.86+p*0.16)+")";
  }

  function media(){return film||greeting}

  function tick(){
    if(done)return;
    var el=media();
    if(!el)return;
    var d=el.duration;
    if(d&&isFinite(d)&&d>0){
      progress(el.currentTime/d);
      if(el.currentTime>=d-0.35){closeIntro();return}
    }
    raf=requestAnimationFrame(tick);
  }

  function closeIntro(){
    if(done)return;
    done=true;
    cancelAnimationFrame(raf);
    progress(1);
    try{launch.classList.add("is-bloom","is-ending")}catch(e0){}
    try{
      [film,greeting].forEach(function(el){
        if(!el)return;
        el.pause();
        el.removeAttribute("src");
        el.load();
      });
    }catch(e){}
    window.setTimeout(function(){
      try{if(launch&&launch.parentNode)launch.parentNode.removeChild(launch)}catch(e2){}
    },80);
  }

  function playMedia(){
    if(spoken||done)return;
    spoken=true;
    var el=film||greeting;
    if(!el){window.setTimeout(closeIntro,200);return}
    el.muted=false;
    el.volume=0.96;
    try{el.currentTime=0}catch(e){}
    var p;
    try{p=el.play()}catch(err){window.setTimeout(closeIntro,300);return}
    if(p&&typeof p.catch==="function")p.catch(function(){
      if(film){
        film.muted=true;
        film.play().then(function(){film.muted=false}).catch(function(){window.setTimeout(closeIntro,300)});
      }else window.setTimeout(closeIntro,300);
    });
    tick();
  }

  function maybeEnded(el){
    if(!el||done)return;
    var d=el.duration;
    if(d&&isFinite(d)&&d>0&&el.currentTime>=Math.max(0,d-0.4))closeIntro();
  }

  launch.addEventListener("click",function(ev){ev.stopPropagation();closeIntro()});
  launch.addEventListener("touchend",function(ev){ev.preventDefault();closeIntro()},{passive:false});
  [film,greeting].forEach(function(el){
    if(!el)return;
    el.addEventListener("ended",closeIntro);
    el.addEventListener("pause",function(){maybeEnded(el)});
    el.addEventListener("timeupdate",function(){maybeEnded(el)});
    el.addEventListener("error",function(){window.setTimeout(closeIntro,200)});
  });
  playMedia();
  window.setTimeout(function(){if(!done)closeIntro()},14000);
})();
