#!/usr/bin/env node

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = "https://dar-al-tawhid.de/";

if (!API_KEY) {
  console.error("Fehlt: GitHub Secret ONESIGNAL_APP_API_KEY");
  process.exit(1);
}

async function sendTestPush() {
  const body = {
    app_id: APP_ID,
    target_channel: "push",
    included_segments: ["Subscribed Users"],
    headings: {
      en: "DAR AL TAWḤID – Test",
      de: "DAR AL TAWḤID – Test"
    },
    contents: {
      en: "Test-Push erfolgreich verbunden.",
      de: "Test-Push erfolgreich verbunden."
    },
    url: SITE_URL,
    isAnyWeb: true
  };

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Key ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  console.log("OneSignal Antwort:", text);

  if (!res.ok) {
    console.error(`OneSignal Fehler ${res.status}:`, text);
    process.exit(1);
  }
}

sendTestPush();
