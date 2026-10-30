"use strict";
/**
 * DĀR TEST: the active Home publications must use the established posts
 * collection directly, not hidden V3 HTML elements or a second API.
 * Tests visible content and live updates without any V3 DOM.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.resolve(__dirname, "../assets/dar-home-html-parity-v1.js"), "utf8");
new vm.Script(source);
const start = source.indexOf("function recent(){");
const end = source.indexOf("\nfunction quran(){", start);
assert(start >= 0 && end > start, "Active recent() implementation missing");
const code = source.slice(start, end);
assert(!code.includes("document.querySelectorAll"), "Latest posts still depend on legacy HTML");
assert(code.includes('typeof posts!=="undefined"'), "Canonical posts model missing");
assert(code.includes(".slice(0,2)"), "Historical number of visible cards changed");

function el(tag) {
 return {
  tagName: tag, className: "", textContent: "", dataset: {}, children: [],
  append(...nodes) { this.children.push(...nodes); },
  replaceChildren(...nodes) { this.children = [...nodes]; }
 };
}
const target = el("div"), todayName = el("span"), todayArticle = el("button");
const box = {
 querySelector(selector) {
  return { "#dhpPosts": target, "#dhpTodayName": todayName, "#dhpTodayArticle": todayArticle }[selector] || null;
 }
};
const document = {
 getElementById(id) { assert.equal(id, "darHomeHtmlParityV1"); return box; },
 createElement: el
};
const posts = [
 { id: "q-101", title: "Die Seele zur Rechenschaft ziehen", scholar: "al-Ḥasan al-Baṣrī", category: "Tazkiyah" },
 { id: "q-102", title: "Tawḥīd, Īmān und Akhlāq – ein Dīn", scholar: "Ibn ʿAbbās", category: "ʿAqīdah / Tawḥīd" },
 { id: "q-103", title: "Nicht sichtbar", scholar: "Test", category: "Test" }
];
const context = vm.createContext({
 ID: "darHomeHtmlParityV1", document, posts, lastItems: "", console
});
vm.runInContext(code + "\nrecent();", context);
assert.equal(target.children.length, 2, "Unexpected number of publication capsules");
assert.equal(target.children[0].className, "dhp-panel dhp-feature dhp-post-capsule");
assert.equal(target.children[1].className, "dhp-article dhp-post-capsule");
assert.equal(target.children[0].children[1].textContent, posts[0].title);
assert.equal(target.children[1].children[0].children[0].textContent, posts[1].title);
assert.equal(target.children[0].children[2].textContent, "al-Ḥasan al-Baṣrī · Tazkiyah");
assert.equal(target.children[1].children[0].children[1].textContent, "Ibn ʿAbbās · ʿAqīdah / Tawḥīd");
assert.equal(todayName.textContent, posts[0].title);
assert.equal(todayArticle.dataset.dhpValue, "q-101");
const first = target.children[0];
vm.runInContext("recent();", context);
assert.strictEqual(target.children[0], first, "Unchanged data should not re-render");
context.posts = [{id:"q-104",title:"Neuer geprüfter Beitrag",scholar:"",category:""}];
vm.runInContext("recent();", context);
assert.equal(target.children.length, 1, "Refresh did not replace old publications");
assert.equal(target.children[0].children[1].textContent, "Neuer geprüfter Beitrag");
assert.equal(target.children[0].children[2].textContent, "Qurʾān · Sunnah · Aṯār");
assert.equal(todayArticle.dataset.dhpValue, "q-104");
console.log("PASS — latest publications read canonical posts directly; geometry, text and update semantics preserved.");
