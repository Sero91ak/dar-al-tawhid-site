// DAR AL TAWḤID – Standortbasierte Gebetszeiten-Tags für OneSignal
// Diese Datei verändert kein Layout.
// Sie speichert pro Nutzer: Push aktiv, Standort, Zeitzone, Methode.

(function () {
  function log() {
    try { console.log("[PrayerPushTags]", ...arguments); } catch (e) {}
  }

  async function waitForOneSignal(timeoutMs = 15000) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.addTags) {
        return window.OneSignal;
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return null;
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation wird von diesem Gerät nicht unterstützt."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000 * 60 * 60
        }
      );
    });
  }

  async function setPrayerTags() {
    const OneSignal = await waitForOneSignal();

    if (!OneSignal) {
      alert("OneSignal ist noch nicht bereit. Bitte kurz warten und erneut versuchen.");
      return false;
    }

    let position;

    try {
      position = await getPosition();
    } catch (err) {
      alert("Standort konnte nicht erkannt werden. Bitte Standort erlauben und erneut versuchen.");
      log("Standort-Fehler:", err);
      return false;
    }

    const lat = Number(position.coords.latitude).toFixed(5);
    const lon = Number(position.coords.longitude).toFixed(5);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";

    try {
      await OneSignal.User.addTags({
        prayer_notifications: "true",
        prayer_lat: lat,
        prayer_lon: lon,
        prayer_timezone: timezone,
        prayer_method: "12deg",
        prayer_asr_factor: "1",
        prayer_location_mode: "device",
        prayer_site: "dar-al-tawhid",
        prayer_source: "pwa",
        prayer_version: "2"
      });

      log("Gebetszeiten-Tags gesetzt:", {
        prayer_lat: lat,
        prayer_lon: lon,
        prayer_timezone: timezone
      });

      return true;
    } catch (err) {
      alert("Gebetszeiten-Push konnte nicht gespeichert werden.");
      log("OneSignal Tag Fehler:", err);
      return false;
    }
  }

  function isPrayerButton(el) {
    if (!el) return false;

    const text = (el.innerText || el.textContent || "").toLowerCase();

    return text.includes("erinnerung aktivieren") ||
           text.includes("gebetszeiten") ||
           text.includes("standort verwenden") ||
           text.includes("push aktivieren");
  }

  document.addEventListener("click", function (event) {
    const btn = event.target && event.target.closest
      ? event.target.closest("button, a")
      : null;

    if (isPrayerButton(btn)) {
      setTimeout(setPrayerTags, 600);
    }
  }, true);

  window.DarAlTawhidSetPrayerPushTags = setPrayerTags;
})();
