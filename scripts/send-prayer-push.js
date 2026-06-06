#!/usr/bin/env node

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de/#prayer";

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
      de: "DAR AL TAWḤID – Gebetszeiten",
      en: "DAR AL TAWḤID – Prayer Times"
    },
    contents: {
      de: "Test erfolgreich: Gebetszeiten-Push ist verbunden.",
      en: "Test successful: Prayer push is connected."
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

  if (!res.ok) {
    console.error(`OneSignal Fehler ${res.status}:`, text);
    process.exit(1);
  }

  console.log("Sofort-Test-Push gesendet:", text);
}

sendTestPush();
