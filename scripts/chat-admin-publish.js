#!/usr/bin/env node
"use strict";
// Uses the existing Admin Publisher; never edits application, Test, Kids or Apple TV.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const PREFIX = "content/admin/chat-publish-requests/";
const COMMANDS = new Set(["global live pushen", "push is live", "push live", "global live veröffentlichen", "global live veroeffentlichen", "global live veröffentlichen mit push", "global live veroeffentlichen mit push"]);
function requireValid(ok, reason) { if (!ok) throw Error("Chat Publish: " + reason); }
function field(yaml, key) {
  const m = yaml.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

// Publication rule: social-media hashtags/footers stay in the draft, never in visitor posts.
// The existing source links and frontmatter structure remain intact.
function stripPublicExtras(markdown) {
  const raw = String(markdown || "").replace(/\r\n/g, "\n");
  const parts = raw.match(/^(---\s*\n)([\s\S]*?)(\n---\s*\n)([\s\S]*)$/);
  if (!parts) return raw;
  let inTags = false;
  const frontmatter = parts[2].split("\n").filter(line => {
    if (/^tags\s*:/.test(line)) { inTags = true; return false; }
    if (inTags && !/^\S/.test(line)) return false;
    inTags = false;
    return true;
  }).join("\n");
  function cleanLine(line) {
    if (/^\s*(?:📥\s*Telegram\b|🌐\s*(?:Website|Webseite)\b|📸\s*Instagram\b|Folgt für mehr Wissen aus Qurʾān\b)/u.test(line)) return "";
    // A real Markdown heading begins '# ' and therefore does not match.
    // Text-fragment anchors like '#:~:text=' also do not match.
    return line.replace(/(^|[ \t])#[\p{L}\p{N}_-]+(?=[ \t,.;:!?'"})\]]|$)/gu, "$1").replace(/[ \t]+$/g, "");
  }
  const cleanedFm = frontmatter.split("\n").map(cleanLine).join("\n");
  const cleanedBody = parts[4].split("\n").map(cleanLine).join("\n");
  return parts[1] + cleanedFm + parts[3] + cleanedBody;
}

function inspect(request) {
  requireValid(request?.version === 1, "version");
  requireValid(request.audience === "adult-visitors", "only adult visitors");
  requireValid(request.approved === true, "explicit approval missing");
  requireValid(COMMANDS.has(String(request.command || "").toLowerCase().trim()), "unknown approval command");
  requireValid(request.push === true || request.push === false, "push flag missing");
  requireValid(request.mode === "single" || request.mode === "slide", "post mode");
  const markdown = stripPublicExtras(request.markdown);
  requireValid(markdown.length > 70 && markdown.length < 150000, "markdown length");
  const fm = markdown.match(/^---\s*\n([\s\S]+?)\n---\s*\n/);
  requireValid(Boolean(fm), "frontmatter");
  const id = field(fm[1], "id");
  requireValid(/^[a-z0-9][a-z0-9-]{2,130}$/.test(id), "id");
  requireValid(field(fm[1], "title") && field(fm[1], "category") && field(fm[1], "source"), "required metadata");
  const slide = /^(?:type:\s*["']?slides?|layout:\s*["']?slides?)["']?\s*$/m.test(fm[1]);
  requireValid((request.mode === "slide") === slide, "mode mismatch");
  if (slide) {
    const yamlSlides = (fm[1].match(/^  - (?:title|text):/gm) || []).length;
    const bodySlides = (markdown.match(/<!--\\s*slide:\\s*\\d+\\s*-->/g) || []).length;
    requireValid(Math.max(yamlSlides, bodySlides) >= 2, "slide mode needs at least two statements");
  }
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
  const stored = JSON.parse(fs.readFileSync(path.join(ROOT, "content/posts/posts-index.json"), "utf8")).files || [];
  for (const entry of stored) {
    const existing = path.join(ROOT, "content/posts", entry.name);
    if (!fs.existsSync(existing)) continue;
    const current = fs.readFileSync(existing, "utf8").match(/^---\\s*\\n([\\s\\S]*?)\\n---/);
    requireValid(!current || field(current[1], "id") !== post.id, "post id already exists");
  }
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
if (require.main === module) run().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { stripPublicExtras };
