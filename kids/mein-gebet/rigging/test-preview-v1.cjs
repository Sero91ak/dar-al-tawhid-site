#!/usr/bin/env node
"use strict";
/* Isolated 2D preview contract. Does not approve 3D, fiqh, audio or device QA. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const preview = fs.readFileSync(path.join(root, "preview-v1.js"), "utf8");
const demoBoy = fs.readFileSync(path.join(root, "demo-junge.html"), "utf8");
const demoGirl = fs.readFileSync(path.join(root, "demo-maedchen.html"), "utf8");
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, "PROJECT-STATUS-RELEASE-GATES.json"), "utf8"));
const hanbali = JSON.parse(fs.readFileSync(path.join(root, "content/hanbali-review.json"), "utf8"));
let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log("PASS " + label);
}

check("demos load local preview-v1.js instead of GitHub raw copies", () => {
  assert.match(demoBoy, /<script src="preview-v1\.js"><\/script>/);
  assert.match(demoGirl, /<script src="preview-v1\.js"><\/script>/);
  assert.doesNotMatch(demoBoy, /raw\.githubusercontent\.com/);
  assert.doesNotMatch(demoGirl, /raw\.githubusercontent\.com/);
});

check("preview resolves assets next to the script, not a foreign CDN", () => {
  assert.match(preview, /function assetDir\(/);
  assert.match(preview, /figur-junge-original\.png/);
  assert.match(preview, /figur-maedchen-original\.png/);
  assert.doesNotMatch(preview, /raw\.githubusercontent\.com/);
});

check("iOS-style history exists via pushState/popstate", () => {
  assert.match(preview, /history\.pushState/);
  assert.match(preview, /popstate/);
  assert.match(preview, /function restore\(/);
});

check("no fifth capsule or permanent bottom tab is introduced", () => {
  assert.match(preview, /never a new bottom tab/);
  assert.doesNotMatch(preview, /dataset\.target==="mein-gebet"/);
});

check("production and religious gates remain blocked", () => {
  assert.equal(gates.productionReady, false);
  assert.equal(gates.boy.glbAvailableInRepository, false);
  assert.equal(gates.reviewGates.hanbaliSourceReview, false);
  assert.equal(hanbali.approvedToAnimate, false);
  assert.equal(hanbali.approvedToTeach, false);
});

check("boy and girl demo shells pin distinct original profiles", () => {
  assert.match(demoBoy, /data-gender="boy"/);
  assert.match(demoGirl, /data-gender="girl"/);
  assert.doesNotMatch(demoBoy, /data-gender="girl"/);
  assert.doesNotMatch(demoGirl, /data-gender="boy"/);
  assert.match(demoBoy, /prefers-reduced-motion/);
  assert.match(demoGirl, /safe-area-inset-top/);
});

check("four draft lessons stay in the preview source", () => {
  ["what", "why", "how", "viewer"].forEach((id) => {
    assert.match(preview, new RegExp('id:"' + id + '"'));
  });
});

function makeEl(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    className: "",
    id: "",
    hidden: false,
    textContent: "",
    children: [],
    attributes: {},
    dataset: {},
    src: "",
    alt: "",
    type: "",
    disabled: false,
    decoding: "",
    loading: "",
    listeners: {},
    parent: null,
    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === "id") this.id = String(v);
      if (k.startsWith("data-")) {
        const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        this.dataset[key] = String(v);
      }
    },
    getAttribute(k) {
      if (k === "id") return this.id || null;
      if (k === "data-gender") return this.attributes["data-gender"] || null;
      return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null;
    },
    appendChild(child) {
      this.children.push(child);
      child.parent = this;
      return child;
    },
    insertAdjacentElement(_pos, child) {
      this.parent.appendChild(child);
      return child;
    },
    replaceChildren() {
      this.children = Array.prototype.slice.call(arguments);
    },
    addEventListener(type, fn) {
      (this.listeners[type] || (this.listeners[type] = [])).push(fn);
    },
    click() {
      const ev = { target: this, key: "" };
      let n = this;
      while (n) {
        (n.listeners.click || []).forEach((fn) => fn(ev));
        n = n.parent;
      }
    },
    querySelector(sel) {
      return find(this, sel);
    },
    querySelectorAll(sel) {
      const out = collect(this, sel);
      out.forEach = Array.prototype.forEach;
      return out;
    },
    closest(sel) {
      let n = this;
      while (n) {
        if (match(n, sel)) return n;
        n = n.parent;
      }
      return null;
    }
  };
  node.classList = {
    contains: (name) => (" " + node.className + " ").indexOf(" " + name + " ") >= 0,
    add(name) {
      if (!this.contains(name)) node.className = (node.className + " " + name).trim();
    },
    remove(name) {
      node.className = node.className.split(/\s+/).filter((x) => x && x !== name).join(" ");
    },
    toggle(name, on) {
      if (on) this.add(name);
      else this.remove(name);
    }
  };
  return node;
}

function walk(n, fn) {
  fn(n);
  (n.children || []).forEach((c) => walk(c, fn));
}
function match(n, sel) {
  if (!n || !n.tagName) return false;
  if (sel === "main.shell") return n.tagName === "MAIN" && n.classList.contains("shell");
  if (sel === ".big-choice-grid") return n.classList.contains("big-choice-grid");
  if (sel === ".app") return n.classList.contains("app");
  if (sel === "main.shell > section.view.active") {
    return n.tagName === "SECTION" && n.classList.contains("view") && n.classList.contains("active");
  }
  if (sel.charAt(0) === "." && sel.indexOf(" ") < 0 && sel.indexOf("[") < 0) {
    return n.classList.contains(sel.slice(1));
  }
  if (sel === "[data-kmg-lesson]") return !!n.dataset.kmgLesson;
  if (sel === "[data-kmg-topic]") return n.dataset.kmgTopic != null;
  if (sel.charAt(0) === "#") return n.id === sel.slice(1);
  return false;
}
function find(root, sel) {
  let found = null;
  walk(root, (n) => {
    if (!found && match(n, sel)) found = n;
  });
  return found;
}
function collect(root, sel) {
  const out = [];
  walk(root, (n) => {
    if (match(n, sel)) out.push(n);
  });
  return out;
}

function boot(gender) {
  const html = makeEl("html");
  const head = makeEl("head");
  const body = makeEl("body");
  const app = makeEl("div");
  app.className = "app";
  app.setAttribute("data-gender", gender);
  const shell = makeEl("main");
  shell.className = "shell";
  const home = makeEl("section");
  home.className = "view active";
  home.id = "view-today";
  const grid = makeEl("div");
  grid.className = "big-choice-grid";
  home.appendChild(grid);
  shell.appendChild(home);
  app.appendChild(shell);
  body.appendChild(app);
  html.appendChild(head);
  html.appendChild(body);
  const docListeners = {};
  const winListeners = {};
  const historyStack = [];
  const document = {
    readyState: "complete",
    head,
    body,
    documentElement: html,
    currentScript: { src: "https://example.test/kids/mein-gebet/preview-v1.js?v=1" },
    getElementById(id) {
      return find(html, "#" + id);
    },
    querySelector(sel) {
      return find(html, sel);
    },
    querySelectorAll(sel) {
      const out = collect(html, sel);
      out.forEach = Array.prototype.forEach;
      return out;
    },
    getElementsByTagName(tag) {
      const out = [];
      walk(html, (n) => {
        if (n.tagName === String(tag).toUpperCase()) out.push(n);
      });
      return out;
    },
    createElement: makeEl,
    addEventListener(type, fn) {
      (docListeners[type] || (docListeners[type] = [])).push(fn);
    }
  };
  const windowObj = {
    DAR_KIDS_MEIN_GEBET_ENABLED: true,
    document,
    MutationObserver: function () { this.observe = function () {}; },
    addEventListener(type, fn) {
      (winListeners[type] || (winListeners[type] = [])).push(fn);
    },
    history: {
      _stack: [{ state: null }],
      get state() {
        return this._stack[this._stack.length - 1].state;
      },
      pushState(state) {
        const copy = JSON.parse(JSON.stringify(state));
        this._stack.push({ state: copy });
        historyStack.push(copy);
      },
      replaceState(state) {
        const copy = JSON.parse(JSON.stringify(state));
        this._stack[this._stack.length - 1] = { state: copy };
        historyStack[historyStack.length - 1] = copy;
      },
      back() {
        if (this._stack.length < 2) return;
        this._stack.pop();
        const st = this._stack[this._stack.length - 1].state;
        (winListeners.popstate || []).forEach((fn) => fn({ state: st }));
      }
    },
    scrollTo() {},
    localStorage: { getItem() { return null; } }
  };
  windowObj.window = windowObj;
  vm.runInNewContext(preview, {
    window: windowObj,
    document,
    history: windowObj.history,
    MutationObserver: windowObj.MutationObserver,
    localStorage: windowObj.localStorage
  });
  return { document, historyStack, winListeners, html, history: windowObj.history };
}

check("preview mounts Home entry, four lessons, and the boy original figure", () => {
  const { document, historyStack } = boot("boy");
  assert.ok(document.getElementById("kidsMeinGebetEntry"));
  assert.ok(document.getElementById("view-mein-gebet"));
  const ids = [];
  document.querySelectorAll("[data-kmg-lesson]").forEach((n) => ids.push(n.dataset.kmgLesson));
  assert.deepEqual(ids, ["what", "why", "how", "viewer"]);
  let boyArt = 0;
  walk(document.documentElement, (n) => {
    if (n.tagName === "IMG" && String(n.src).indexOf("figur-junge-original.png") >= 0) boyArt += 1;
    if (n.tagName === "IMG") assert.equal(String(n.src).indexOf("figur-maedchen-original.png"), -1);
  });
  assert.ok(boyArt >= 1);
  assert.equal(historyStack.length, 0);
});

check("entry, lesson and station clicks drive history and girl original art", () => {
  const { document, historyStack } = boot("girl");
  document.getElementById("kidsMeinGebetEntry").click();
  assert.equal(document.getElementById("view-mein-gebet").classList.contains("active"), true);
  const lesson = document.querySelectorAll("[data-kmg-lesson]")[0];
  lesson.click();
  const topic = document.querySelectorAll("[data-kmg-topic]")[0];
  assert.ok(topic);
  topic.click();
  const station = document.getElementById("kmgStation");
  assert.equal(station.hidden, false);
  assert.match(document.getElementById("kmgStationTitle").textContent, /Ṣalāh|Salah|Gebet/i);
  let girlArt = 0;
  walk(document.documentElement, (n) => {
    if (n.tagName === "IMG" && String(n.src).indexOf("figur-maedchen-original.png") >= 0) girlArt += 1;
  });
  assert.ok(girlArt >= 1);
  assert.ok(historyStack.length >= 2);
  assert.equal(historyStack[historyStack.length - 1].kmg, true);
});

check("browser back restores lesson, overview, then home", () => {
  const ctx = boot("boy");
  ctx.document.getElementById("kidsMeinGebetEntry").click();
  ctx.document.querySelectorAll("[data-kmg-lesson]")[0].click();
  ctx.document.querySelectorAll("[data-kmg-topic]")[0].click();
  assert.equal(ctx.document.getElementById("kmgStation").hidden, false);
  ctx.history.back();
  assert.equal(ctx.document.getElementById("kmgStation").hidden, true);
  assert.equal(ctx.document.getElementById("kmgDetail").hidden, false);
  ctx.history.back();
  assert.equal(ctx.document.getElementById("kmgOverview").hidden, false);
  ctx.history.back();
  assert.equal(ctx.document.getElementById("view-today").classList.contains("active"), true);
  assert.equal(ctx.document.getElementById("view-mein-gebet").classList.contains("active"), false);
});

check("next station replaces history so back returns to the lesson list", () => {
  const ctx = boot("boy");
  ctx.document.getElementById("kidsMeinGebetEntry").click();
  ctx.document.querySelectorAll("[data-kmg-lesson]")[0].click();
  ctx.document.querySelectorAll("[data-kmg-topic]")[0].click();
  const next = ctx.document.querySelector(".kmg-primary");
  assert.ok(next);
  next.click();
  assert.match(ctx.document.getElementById("kmgStationTitle").textContent, /fünf|Pflicht/i);
  ctx.history.back();
  assert.equal(ctx.document.getElementById("kmgStation").hidden, true);
  assert.equal(ctx.document.getElementById("kmgDetail").hidden, false);
});

console.log("OK preview-v1 isolated checks: " + passed);
