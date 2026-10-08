#!/usr/bin/env node
"use strict";
// Uses the existing Admin Publisher; never edits application, Test, Kids or Apple TV.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const PREFIX = "content/admin/chat-publish-requests/";
const COMMANDS = new Set(["global live pushen", "push is live", "push live", "global live veröffentlichen", "global live veroeffentlichen"]);
function requireValid(ok, reason) { if (!ok) throw Error("Chat Publish: " + reason); }
function field(yaml, key) {
  const m = yaml.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}
function inspect(request) {
  requireValid(request?.version === 1, "version");
  requireValid(request.audience === "adult-visitors", "only adult visitors");
  requireValid(request.approved === true, "explicit approval missing");
  requireValid(COMMANDS.has(String(request.command || "").toLowerCase().trim()), "unknown approval command");
  requireValid(request.push === true || request.push === false, "push flag missing");
  requireValid(request.mode === "single" || request.mode === "slide", "post mode");
  const markdown = String(request.markdown || "");
  requireValid(markdown.length > 70 && markdown.length < 150000, "markdown length");
  const fm = markdown.match(/^---\s*\n([\s\S]+?)\n---\s*\n/);
  requireValid(Boolean(fm), "frontmatter");
  const id = field(fm[1], "id");
  requireValid(/^[a-z0-9][a-z0-9-]{2,130}$/.test(id), "id");
  requireValid(field(fm[1], "title") && field(fm[1], "category") && field(fm[1], "source"), "required metadata");
  const slide = /^(?:type:\s*["']?slides?|layout:\s*["']?slides?)["']?\s*$/m.test(fm[1]);
  requireValid((request.mode === "slide") === slide, "mode mismatch");
  if (slide) requireValid(/^(slides:\s*$)/m.test(fm[1]) || /<!--\s*slide:\s*\d+\s*-->/.test(markdown), "slide content missing");
  const sourceRefs = [...new Set([...markdown.matchAll(/\/q\/([1-9]\d*)/g)].map(m => Number(m[1])))];
  requireValid(sourceRefs.length > 0, "shortlink missing");
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "q/_registry/shortlinks.json"), "utf8"));
  for (const number of sourceRefs) {
    requireValid(registry.links.some(link => Number(link.number) === number && link.status === "active"), "unregistered source");
    requireValid(fs.existsSync(path.join(ROOT, "q", String(number), "index.html")), "source page missing");
  }
  requireValid(!/https?:\/\/(?!dar-al-tawhid\.de\/q\/)/i.test(markdown), "foreign URL in reader content");
  const filename = String(request.filename || "").trim();
  requireValid(!filename || /^[a-z0-9][a-z0-9-]{2,130}\.md$/.test(filename), "unsafe filename");
  return { markdown, filename, id, sourceRefs };
}
async function run() {
  const mode = process.argv[2];
  const file = String(process.argv[3] || "");
  requireValid(mode === "--check" || mode === "--publish", "mode");
  requireValid(new RegExp("^" + PREFIX + "[a-z0-9][a-z0-9-]{5,100}\\.json$").test(file), "request path");
  const request = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const post = inspect(request);
  console.log("Chat Publish validated", post.id, request.mode, post.sourceRefs.length, "source(s)");
  if (mode === "--check") return;
  requireValid(process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_REF === "refs/heads/main", "Actions main only");
  const secret = String(process.env.ADMIN_PUBLISH_SECRET || "");
  requireValid(Boolean(secret), "Admin Publisher connection missing");
  const endpoint = "https://dar-admin-publisher.sero91ak.workers.dev/api/admin/publish";
  const response = await fetch(endpoint, {
    method: "POST", headers: {"Content-Type": "application/json", "X-Admin-Secret": secret},
    body: JSON.stringify({ markdown: post.markdown, filename: post.filename, skipPush: !request.push }),
    signal: AbortSignal.timeout(90000)
  });
  const result = await response.json().catch(() => ({}));
  requireValid(response.ok && result.ok, "Admin Publisher rejected request (HTTP " + response.status + ")");
  console.log("Admin Publisher accepted", result.postId, result.commitSha, result.push?.sent ? "push sent" : result.push?.pending ? "push pending" : "push not confirmed");
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
