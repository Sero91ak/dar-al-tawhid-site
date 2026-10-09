package de.daraltawhid.app

/**
 * Android-only UI compatibility for the shared website. This corrects
 * presentation labels and the icon picker without changing the protected
 * push infrastructure, deliveries, subscription flags or OneSignal SDK.
 */
object DarAndroidUi {
    val SCRIPT = """
        (function(){
          if(!window.DAR_ANDROID_NATIVE_APP || !document.body)return;
          var nativeNote="In der Android-App werden Mitteilungen nativ verwaltet. Die Android-Berechtigung und eine aktive Registrierung sind erforderlich.";
          function updatePlatformLabels(){
            document.querySelectorAll(".prayer-push-status-item span,.notification-status-chip").forEach(function(el){
              if(el.textContent.trim()==="iOS-App")el.textContent="Android-App";
            });
            document.querySelectorAll(".prayer-push-status-note").forEach(function(el){
              if(el.textContent.indexOf("In der iOS-App")!==-1 && el.textContent!==nativeNote)el.textContent=nativeNote;
            });
          }
          function updateIconPicker(){
            var panel=document.getElementById("darAppIconPanel");
            if(!panel)return;
            var rail=panel.querySelector(".app-icon-rail");
            if(!rail)return;
            var original=rail.querySelector('[data-dar-android-original="1"]');
            if(!original){
              original=document.createElement("button");
              original.type="button";
              original.className="app-icon-choice";
              original.setAttribute("data-app-icon-select","default");
              original.setAttribute("data-dar-android-original","1");
              original.setAttribute("aria-label","Originales DAR AL TAWḤĪD App-Symbol auswählen");
              try{
                var data=DarNative.getDefaultIconDataUri();
                if(data){
                  var img=document.createElement("img");
                  img.src=data;
                  img.alt="";
                  img.width=56;
                  img.height=56;
                  original.appendChild(img);
                }
              }catch(e){}
              var text=document.createElement("span");
              text.textContent="DAR AL TAWḤĪD · Original";
              original.appendChild(text);
              original.addEventListener("click",function(ev){
                ev.preventDefault();
                ev.stopImmediatePropagation();
                try{
                  if(DarNative.setAppIcon("default")){
                    localStorage.setItem("darAppIconV1","default");
                    updateIconPicker();
                  }
                }catch(e){}
              },true);
              rail.insertBefore(original,rail.firstChild);
            }
            var info=panel.querySelector(".theme-switch-note");
            var infoText="Das DAR AL TAWḤĪD-Original ist der Android-Standard. Du kannst jederzeit zurückwechseln.";
            if(info && info.textContent!==infoText)info.textContent=infoText;
            var selected="default";
            try{selected=String(DarNative.getAppIcon()||"default")}catch(e){}
            rail.querySelectorAll("[data-app-icon-select]").forEach(function(btn){
              var active=btn.getAttribute("data-app-icon-select")===selected;
              btn.classList.toggle("is-active",active);
              var aria=active?"true":"false";
              if(btn.getAttribute("aria-pressed")!==aria)btn.setAttribute("aria-pressed",aria);
            });
          }
          function update(){
            updatePlatformLabels();
            updateIconPicker();
          }
          window.__darAndroidRefreshUi=update;
          if(!window.__darAndroidUiObserver){
            var scheduled=false;
            var observer=new MutationObserver(function(){
              if(scheduled)return;
              scheduled=true;
              Promise.resolve().then(function(){scheduled=false;update()});
            });
            observer.observe(document.body,{childList:true,subtree:true});
            window.__darAndroidUiObserver=observer;
          }
          update();
        })();
    """.trimIndent()
}
