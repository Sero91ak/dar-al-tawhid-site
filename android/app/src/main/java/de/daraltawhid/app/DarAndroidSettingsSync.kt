package de.daraltawhid.app

/**
 * Android-only bridge for the existing visitor UI.
 *
 * Production schedulers target Supabase prayer_push_registrations; OneSignal tags
 * alone do not put a native Android device into that list. This script runs only
 * inside the trusted dar-al-tawhid.de Android WebView. No server code is changed.
 */
object DarAndroidSettingsSync {
    val javascript: String = """
        (function () {
          if (window.__darAndroidSettingsSyncInstalled) return;
          window.__darAndroidSettingsSyncInstalled = true;
          var lastSettings = "";
          var lastRegistered = "";
          var registrationBusy = false;
          var timer = 0;
          function isAndroid() {
            return window.DAR_ANDROID_NATIVE_APP === true &&
              /DarAlTawhidAndroid/i.test(String(navigator.userAgent || ""));
          }
          function prefs() {
            try { return typeof getPrayerSettings === "function" ? getPrayerSettings() : null; }
            catch (e) { return null; }
          }
          function yes(value, fallback) {
            if (value == null) return !!fallback;
            return value === true || value === "true" || value === 1 || value === "1";
          }
          function clock(value, fallback) {
            var text = String(value || fallback);
            var parts = /^(\d{1,2}):(\d{2})$/.exec(text);
            if (!parts) return fallback;
            var h = Number(parts[1]), m = Number(parts[2]);
            return h >= 0 && h <= 23 && m >= 0 && m <= 59 ?
              String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") : fallback;
          }
          function safeCoords(settings) {
            if (!yes(settings.locationGranted, false) || settings.lat == null || settings.lon == null) return null;
            var lat = Number(settings.lat), lon = Number(settings.lon);
            return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ?
              {lat:lat, lon:lon} : null;
          }
          function status(value) {
            if (window.DAR_ANDROID_REGISTRATION_STATUS === value) return;
            window.DAR_ANDROID_REGISTRATION_STATUS = value;
            window.dispatchEvent(new Event("darAndroidRegistrationUpdated"));
          }
          function createRegistration(settings, subscriptionId, token, deviceId) {
            var coords = safeCoords(settings);
            var prayer = yes(settings.reminder, false) && !!coords;
            var jummah = yes(settings.jummahNotifications, false);
            var timezone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "Europe/Berlin";
            var advance = Number(settings.advanceMinutes);
            if (![5,10,15].includes(advance)) advance = 15;
            var jummahAdvance = Number(settings.jummahAdvanceMinutes);
            if (![15,30,45,60].includes(jummahAdvance)) jummahAdvance = 30;
            var tahajjud = String(settings.tahajjudMode || "off");
            if (!["off","before30","before60","before90","lastThird"].includes(tahajjud)) tahajjud = "off";
            var method = Number(settings.angle);
            if (!Number.isFinite(method) || method < 0 || method > 30) method = 12;
            var factor = Number(settings.asrFactor) === 2 ? 2 : 1;
            var row = {
              device_id: deviceId,
              subscription_id: subscriptionId,
              push_token: token,
              timezone: timezone,
              daily_dua_enabled: yes(settings.dailyDua, true),
              daily_recommendation_enabled: yes(settings.dailyRecommendation, true),
              daily_dua_time: clock(settings.dailyDuaTime, "09:00"),
              daily_recommendation_time: clock(settings.dailyRecommendationTime, "12:00"),
              push_opted_in: true,
              user_agent: String(navigator.userAgent || "").slice(0, 280),
              last_synced_at: new Date().toISOString(),
              enabled: prayer,
              jummah_notifications: jummah,
              jummah_use_manual_time: yes(settings.jummahUseManualTime, false),
              jummah_manual_time: clock(settings.jummahManualTime, "13:30"),
              jummah_morning_time: clock(settings.jummahMorningTime, "09:00"),
              jummah_advance_minutes: jummahAdvance
            };
            ["fajr","dhuhr","asr","maghrib","isha"].forEach(function(name) {
              var key = "prayer" + name[0].toUpperCase() + name.slice(1);
              row["prayer_" + name + "_enabled"] = yes(settings[key], true);
            });
            if (coords) {
              row.lat = coords.lat;
              row.lon = coords.lon;
              row.city = String(settings.city || "").slice(0,120);
              row.method_angle = method;
              row.asr_factor = factor;
              row.advance_minutes = advance;
              row.tahajjud_mode = tahajjud;
            }
            return row;
          }
          async function sync() {
            if (!isAndroid()) return;
            var settings = prefs();
            if (!settings) return;
            var text = JSON.stringify(settings);
            if (text !== lastSettings) {
              try {
                if (window.DarNative && typeof window.DarNative.pushSettings === "function") {
                  window.DarNative.pushSettings(text);
                  lastSettings = text;
                }
              } catch(e) {}
            }
            var sub = String(window.DAR_ANDROID_ONESIGNAL_ID || "").trim();
            var token = String(window.DAR_ANDROID_PUSH_TOKEN || "").trim();
            var device = String(window.DAR_ANDROID_DEVICE_ID || "").trim();
            if (window.DAR_ANDROID_POST_NOTIFICATIONS_GRANTED !== true) {
              status("permission-required");
              return;
            }
            if (!sub || !token || !device) {
              status("subscription-missing");
              return;
            }
            if (typeof supabaseRest !== "function" ||
                typeof hasSupabaseCfg !== "function" || !hasSupabaseCfg()) {
              status("registration-unavailable");
              return;
            }
            var fingerprint = sub + "|" + token + "|" + text;
            if (lastRegistered === fingerprint || registrationBusy) return;
            registrationBusy = true;
            status("syncing");
            var row = createRegistration(settings,sub,token,device);
            try {
              await supabaseRest("prayer_push_registrations?on_conflict=device_id", {
                method:"POST", prefer:"resolution=merge-duplicates,return=minimal", body:row
              });
              lastRegistered = fingerprint;
              status("synced");
            } catch (e) {
              // Some older Supabase schemas lack individual-prayer columns.
              try {
                ["fajr","dhuhr","asr","maghrib","isha"].forEach(function(key) {
                  delete row["prayer_" + key + "_enabled"];
                });
                await supabaseRest("prayer_push_registrations?on_conflict=device_id", {
                  method:"POST", prefer:"resolution=merge-duplicates,return=minimal", body:row
                });
                lastRegistered = fingerprint;
                status("synced");
              } catch (retryError) {
                status("registration-error");
              }
            } finally {
              registrationBusy = false;
            }
          }
          function queue() {
            clearTimeout(timer);
            timer = setTimeout(function () { sync().catch(function(){status("registration-error")}); }, 320);
          }
          document.addEventListener("DOMContentLoaded", queue);
          document.addEventListener("click", queue, true);
          document.addEventListener("change", queue, true);
          document.addEventListener("input", queue, true);
          document.addEventListener("visibilitychange", function () {
            if (!document.hidden) queue();
          });
          window.addEventListener("online", queue);
          window.addEventListener("pageshow", queue);
          window.addEventListener("darAndroidBridgeUpdated", queue);
          queue();
        })();
    """.trimIndent()
}
