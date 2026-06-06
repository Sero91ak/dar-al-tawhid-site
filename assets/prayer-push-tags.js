/* DAR AL TAWḤID – OneSignal Gebetszeiten-Tags
   Ergänzung ohne Layout-Änderung. Überschreibt nur den Klick auf „Erinnerung aktivieren“. */
(function(){
  const LOG_PREFIX = "[DAR Prayer Push]";

  function slug(value){
    return String(value || "ort")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "ort";
  }

  async function waitForOneSignal(timeoutMs){
    const start = Date.now();
    while(Date.now() - start < (timeoutMs || 12000)){
      try{
        if(window.OneSignal && window.DAR_ONE_SIGNAL_READY) return window.OneSignal;
      }catch(e){}
      await new Promise(resolve => setTimeout(resolve, 180));
    }
    return window.OneSignal || null;
  }

  function hasLocation(settings){
    if(typeof window.hasPrayerLocation === "function") return window.hasPrayerLocation(settings);
    return !!settings && Number.isFinite(Number(settings.lat)) && Number.isFinite(Number(settings.lon)) && settings.locationGranted === true;
  }

  function getSettings(){
    if(typeof window.getPrayerSettings === "function") return window.getPrayerSettings();
    try{return JSON.parse(localStorage.getItem("darPrayerSettingsV1") || "{}");}catch(e){return {};}
  }

  function saveSettings(update){
    if(typeof window.setPrayerSettings === "function") return window.setPrayerSettings(update);
    try{
      const current = JSON.parse(localStorage.getItem("darPrayerSettingsV1") || "{}");
      localStorage.setItem("darPrayerSettingsV1", JSON.stringify(Object.assign(current, update)));
    }catch(e){}
  }

  async function optInAndTag(){
    const settings = getSettings();
    if(!hasLocation(settings)){
      alert("Bitte zuerst Standort freigeben oder Ort suchen.");
      return false;
    }

    const OneSignal = await waitForOneSignal(12000);
    if(!OneSignal || !OneSignal.User){
      alert("OneSignal ist noch nicht bereit. Bitte Seite neu laden und erneut versuchen.");
      return false;
    }

    try{
      if(OneSignal.Notifications && typeof OneSignal.Notifications.isPushSupported === "function" && !OneSignal.Notifications.isPushSupported()){
        alert("Dieser Browser unterstützt Web-Push-Benachrichtigungen nicht.");
        return false;
      }

      if(OneSignal.User.PushSubscription && typeof OneSignal.User.PushSubscription.optIn === "function"){
        await OneSignal.User.PushSubscription.optIn();
      }else if(OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === "function"){
        await OneSignal.Notifications.requestPermission();
      }else if(window.Notification && typeof Notification.requestPermission === "function"){
        await Notification.requestPermission();
      }

      if(window.Notification && Notification.permission === "denied"){
        alert("Benachrichtigungen sind im Browser blockiert. Bitte zuerst in den Browser-Einstellungen erlauben.");
        return false;
      }

      const city = String(settings.city || "Aktueller Standort");
      const citySlug = slug(city);
      const asrName = Number(settings.asrFactor) === 2 ? "hanafi" : "standard";
      const timezone = (Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin");
      const tags = {
        prayer_notifications: "true",
        prayer_city: city,
        prayer_city_slug: citySlug,
        prayer_lat: String(Number(settings.lat).toFixed(5)),
        prayer_lon: String(Number(settings.lon).toFixed(5)),
        prayer_asr: asrName,
        prayer_method: "12deg",
        prayer_timezone: timezone,
        prayer_updated_at: String(Math.floor(Date.now()/1000))
      };

      if(typeof OneSignal.User.addTags === "function"){
        OneSignal.User.addTags(tags);
      }else if(typeof OneSignal.User.addTag === "function"){
        Object.entries(tags).forEach(([key,value]) => OneSignal.User.addTag(key, value));
      }else{
        throw new Error("OneSignal addTags nicht verfügbar");
      }

      saveSettings({reminder:true, oneSignalPrayer:true, oneSignalCitySlug:citySlug});
      try{ if(typeof window.scheduleLocalPrayerReminders === "function") window.scheduleLocalPrayerReminders(); }catch(e){}
      alert("Gebetszeiten-Push ist aktiviert. OneSignal hat deine Gebetszeiten-Tags gespeichert.");
      console.log(LOG_PREFIX, "Tags gesetzt", tags);
      return true;
    }catch(error){
      console.error(LOG_PREFIX, error);
      alert("Gebetszeiten-Push konnte nicht aktiviert werden. Bitte OneSignal, Service Worker und Browser-Berechtigung prüfen.");
      return false;
    }
  }

  window.DAR_activatePrayerOneSignalTags = optInAndTag;

  document.addEventListener("click", function(event){
    const target = event.target && event.target.closest ? event.target.closest("#enablePrayerReminderBtn") : null;
    if(!target) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    optInAndTag();
  }, true);
})();
