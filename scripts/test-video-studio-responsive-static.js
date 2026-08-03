#!/usr/bin/env node
/** Static responsive sanity checks for DAR Sprach-Bildbeitrag HTML (no browser). */
import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../admin/video-studio.html", import.meta.url), "utf8");
const required = [
  "viewport-fit=cover",
  "safe-area-inset-top",
  "safe-area-inset-bottom",
  "overflow-x:hidden",
  "min-height:44px",
  "object-fit:contain",
  "Sprach-Bildbeitrag",
  "Textbeitrag einfügen",
  "Bild hochladen",
  "Aus Bibliothek",
  "Sprach-Bildbeitrag erstellen",
  "Sprach-Bildbeiträge",
  "api/admin/video-studio",
  "X-Admin-Secret",
  "costConfirmed",
  "speech-image",
  "Im Feed veröffentlichen",
  "Besucher-Push senden",
  "Textaufteilung bearbeiten",
  "Stimme freigeben",
  "Gestaltung",
  "panelVoice",
  "panelDesign",
  "approve-voice",
  "confirm-design",
  "Kompositionsvorschau",
  "compPreview",
  "by Serhat Abu Malik",
  "Audiovorschau"
];
for (const needle of required) {
  assert.ok(html.includes(needle), `missing: ${needle}`);
}
assert.ok(!html.includes("Stimme &amp; Gestaltung"), "combined voice/design step must be gone");
assert.ok(!html.includes("KI-Video-Studio"), "old KI-Video-Studio title must be gone");
assert.ok(!html.includes("Optional: KI-Szenenbild"), "optional KI scene gen must be gone");
assert.ok(!html.includes("Video-Beitrag erstellen"), "old create button must be gone");
assert.ok(!html.includes("Bewegungsclip"), "clip UI must be gone");
assert.ok(html.includes("vom ersten bis letzten Frame") || html.includes("vom ersten bis zum letzten"), "full-frame branding copy missing");
assert.ok(!/FAL_KEY|ELEVENLABS_API_KEY|SHOTSTACK_API_KEY|sk-[a-zA-Z0-9]{10,}/.test(html), "no provider secrets in HTML");
console.log("video-studio responsive static checks ok");
