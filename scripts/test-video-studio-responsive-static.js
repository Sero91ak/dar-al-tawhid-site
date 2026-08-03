#!/usr/bin/env node
/** Static responsive sanity checks for DAR video studio HTML (no browser). */
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
  "KI-Video-Studio",
  "Textbeitrag einfügen",
  "Bild hochladen",
  "Aus Bibliothek",
  "Optional: KI-Szenenbild",
  "Optional erzeugen",
  "Video-Beitrag erstellen",
  "Server-Aufträge",
  "api/admin/video-studio",
  "X-Admin-Secret",
  "costConfirmed",
  "Im Feed veröffentlichen",
  "Besucher-Push senden"
];
for (const needle of required) {
  assert.ok(html.includes(needle), `missing: ${needle}`);
}
assert.ok(html.indexOf("Bild hochladen") < html.indexOf("Optional: KI-Szenenbild"), "Upload must appear before optional KI generation");
assert.ok(!/FAL_KEY|ELEVENLABS_API_KEY|SHOTSTACK_API_KEY|sk-[a-zA-Z0-9]{10,}/.test(html), "no provider secrets in HTML");
console.log("video-studio responsive static checks ok");
