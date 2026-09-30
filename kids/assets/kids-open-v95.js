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
    native=!!(window.DAR_KIDS_IOS_APP||window.DAR_IOS_NATIVE_APP||document.documentElement.classList.contains("kids-ios-app"));
  }catch(e){}
  if(native){
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
    if(d&&isFinite(d)&&d>0)progress(el.currentTime/d);
    raf=requestAnimationFrame(tick);
  }

  function closeIntro(){
    if(done)return;
    done=true;
    cancelAnimationFrame(raf);
    progress(1);
    launch.classList.add("is-bloom");
    window.setTimeout(function(){
      launch.classList.add("is-ending");
      try{
        [film,greeting].forEach(function(el){
          if(!el)return;
          el.pause();
          el.removeAttribute("src");
          el.load();
        });
      }catch(e){}
      window.setTimeout(function(){
        if(launch.parentNode)launch.parentNode.removeChild(launch);
      },520);
    },480);
  }

  function playMedia(){
    if(spoken||done)return;
    spoken=true;
    var el=film||greeting;
    if(!el){window.setTimeout(closeIntro,400);return}
    el.muted=false;
    el.volume=0.96;
    try{el.currentTime=0}catch(e){}
    var p;
    try{p=el.play()}catch(err){spoken=false;return}
    if(p&&typeof p.catch==="function")p.catch(function(){
      if(film){
        film.muted=true;
        film.play().then(function(){film.muted=false}).catch(function(){spoken=false});
      }else spoken=false;
    });
    tick();
  }

  launch.addEventListener("click",function(ev){
    ev.stopPropagation();
    closeIntro();
  });
  launch.addEventListener("touchstart",function(ev){ev.stopPropagation()},{passive:true});
  if(film){
    film.addEventListener("ended",closeIntro);
    film.addEventListener("error",function(){window.setTimeout(closeIntro,350)});
  }
  if(greeting){
    greeting.addEventListener("ended",function(){if(!film)closeIntro()});
    greeting.addEventListener("error",function(){if(!film)window.setTimeout(closeIntro,350)});
  }
  playMedia();
  window.setTimeout(function(){if(!done)closeIntro()},18000);
})();
