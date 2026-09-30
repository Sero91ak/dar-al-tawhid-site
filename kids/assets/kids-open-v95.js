(function(){
  var launch=document.getElementById("kidsLaunch");
  var greeting=document.getElementById("kidsOwnerGreeting");
  var ring=document.getElementById("kidsLaunchRing");
  var pct=document.getElementById("kidsLaunchPct");
  var seal=document.getElementById("kidsLaunchSeal");
  if(!launch)return;

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

  function tick(){
    if(done||!greeting)return;
    var d=greeting.duration;
    if(d&&isFinite(d)&&d>0)progress(greeting.currentTime/d);
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
        if(greeting){
          greeting.pause();
          greeting.removeAttribute("src");
          greeting.load();
        }
      }catch(e){}
      window.setTimeout(function(){
        if(launch.parentNode)launch.parentNode.removeChild(launch);
      },520);
    },1080);
  }

  function playVoice(){
    if(spoken||done||!greeting)return;
    spoken=true;
    greeting.muted=false;
    greeting.volume=0.92;
    try{greeting.currentTime=0}catch(e){}
    var p;
    try{p=greeting.play()}catch(err){spoken=false;return}
    if(p&&typeof p.catch==="function")p.catch(function(){spoken=false});
    tick();
  }

  launch.addEventListener("click",function(ev){ev.stopPropagation()});
  launch.addEventListener("touchstart",function(ev){ev.stopPropagation()},{passive:true});
  if(greeting){
    greeting.addEventListener("ended",closeIntro);
    greeting.addEventListener("error",function(){window.setTimeout(closeIntro,350)});
  }
  playVoice();
  window.setTimeout(function(){if(!done)closeIntro()},16000);
})();
