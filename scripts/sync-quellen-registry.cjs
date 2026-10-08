#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "q/_registry/shortlinks.json");
const page = path.join(root, "quellen/index.html");
const publicJson = path.join(root, "quellen/shortlinks.json");
const data = JSON.parse(fs.readFileSync(source, "utf8"));
if (!Array.isArray(data.links)) throw Error("Quellenregister fehlt");
const numbers = new Set();
const links = data.links.filter(x => x.status !== "inactive").map(item => {
  const n = Number(item.number);
  if (!Number.isSafeInteger(n) || n < 1 || numbers.has(n)) throw Error("Doppelte/ungültige Q-Nummer: " + item.number);
  numbers.add(n);
  if (!fs.existsSync(path.join(root, "q", String(n), "index.html"))) throw Error("Quellenseite fehlt: Q" + n);
  return {
    number:n,
    title:String(item.title||""),
    topic:String(item.topic||""),
    speaker:String(item.speaker||""),
    statementSummary:String(item.statementSummary||""),
    sourceLabel:String(item.sourceLabel||""),
    status:item.status||"active"
  };
});
links.sort((a,b)=>a.number-b.number);
if (!links.length) throw Error("Quellenliste leer; Veröffentlichung abgebrochen");
const output = JSON.stringify({
  version:1,
  generatedFrom:"q/_registry/shortlinks.json",
  nextNumber:data.nextNumber,
  links
}, null, 2)+"\n";
const snapshot = JSON.stringify({links}).replace(/</g,"\\u003c");
const html = fs.readFileSync(page,"utf8");
const start = "<!-- QL_SOURCE_SNAPSHOT_START -->";
const end = "<!-- QL_SOURCE_SNAPSHOT_END -->";
const block = start+"\n<script id=\"qlSourceSnapshot\" type=\"application/json\">"+snapshot+"</script>\n"+end;
if (!html.includes(start)||!html.includes(end)) throw Error("Quellenbibliothek Snapshot-Anker fehlen");
const next = html.replace(new RegExp(start+"[\\s\\S]*?"+end),block);
if (process.argv.includes("--check")) {
  if (fs.readFileSync(publicJson,"utf8")!==output || html!==next) throw Error("Öffentliches Quellen-Snapshot nicht aktuell");
  console.log("Quellen-Snapshot geprüft: "+links.length+" Q-Links");
} else {
  fs.writeFileSync(publicJson,output);
  fs.writeFileSync(page,next);
  console.log("Quellen-Snapshot synchronisiert: "+links.length+" Q-Links");
}
