// DAR AL TAWḤĪD – Standortbasierte Gebetszeiten-Tags für OneSignal
// Diese Datei verändert kein Layout.
// Sie speichert pro Installation Push-Status, Standort und App-Umgebung.

(function () {
  const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
  const INSTALLATION_KEY = "darPrayerInstallationIdV1";

  function log() {
    try { console.log("[PrayerPushTags]", ...arguments); } catch (e) {}
  }

  function currentEnvironment() {
    const path = String(location.pathname || "");
    return window.__DAR_STAGING_APP === true || path === "/test" || path.startsWith("/test/")
      ? "test"
      : "production";
  }

  function currentAppName() {
    return currentEnvironment() === "test" ? "Dar Test" : "DAR AL TAWHID";
  }

  function getInstallationId() {
    try {
      let id = localStorage.getItem(INSTALLATION_KEY);
      if (id) return id;
      id = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `install-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(INSTALLATION_KEY, id);
      return id;
    } catch (e) {
      return `install-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
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

  async function waitForSubscriptionId(OneSignal, timeoutMs = 15000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const id = String(OneSignal?.User?.PushSubscription?.id || "").trim();
      if (id) return id;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return "";
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

  async function syncRegistrationEnvironment(OneSignal) {
    const subscriptionId = await waitForSubscriptionId(OneSignal);
    if (!subscriptionId) {
      log("Keine OneSignal-Subscription für Umgebungs-Sync gefunden.");
      return false;
    }

    const appEnvironment = currentEnvironment();
    const appName = currentAppName();
    const installationId = getInstallationId();

    try {
      await OneSignal.User.addTags({
        prayer_environment: appEnvironment,
        prayer_app_name: appName,
        prayer_installation_id: installationId,
        prayer_version: "4"
      });
    } catch (err) {
      log("OneSignal-Umgebungs-Tags konnten nicht gesetzt werden:", err);
    }

    try {
      const url = `${SUPABASE_URL}/rest/v1/prayer_push_registrations?subscription_id=eq.${encodeURIComponent(subscriptionId)}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          app_environment: appEnvironment,
          app_name: appName,
          installation_id: installationId
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase ${response.status}: ${text.slice(0, 200)}`);
      }

      log("Push-Installation gekennzeichnet:", { appEnvironment, appName, installationId });
      return true;
    } catch (err) {
      log("Supabase-Umgebungs-Sync fehlgeschlagen:", err);
      return false;
    }
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
    const appEnvironment = currentEnvironment();
    const appName = currentAppName();
    const installationId = getInstallationId();

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
        prayer_environment: appEnvironment,
        prayer_app_name: appName,
        prayer_installation_id: installationId,
        prayer_version: "4"
      });

      await syncRegistrationEnvironment(OneSignal);

      log("Gebetszeiten-Tags gesetzt:", {
        prayer_lat: lat,
        prayer_lon: lon,
        prayer_timezone: timezone,
        prayer_environment: appEnvironment
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

  // Bei jedem App-Start Test- und Live-Installation erneut eindeutig markieren.
  setTimeout(async function () {
    const OneSignal = await waitForOneSignal(20000);
    if (OneSignal) await syncRegistrationEnvironment(OneSignal);
  }, 1200);

  window.DarAlTawhidSetPrayerPushTags = setPrayerTags;
  window.DarAlTawhidSyncPrayerEnvironment = async function () {
    const OneSignal = await waitForOneSignal(20000);
    return OneSignal ? syncRegistrationEnvironment(OneSignal) : false;
  };
})();
