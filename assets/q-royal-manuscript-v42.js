/* Royal Manuskript V4.2: non-destructive shared enhancements for /q/N/.
   No source quotation, original attribution, isnād or citation URL is rewritten. */
(() => {
  "use strict";
  const version = "royal-manuscript-v42";
  const themeKey = "dar-quellen-royal-theme";
  const root = document.documentElement;
  const body = document.body;
  if (!body || !body.classList.contains("qsource-body") || root.dataset.qRoyalReady === "1") return;
  root.dataset.qRoyalReady = "1";
  const path = location.pathname.match(/^\/q\/([1-9][0-9]*)\/?/);
  const number = path ? Number(path[1]) : null;
  const readTheme = () => {
    try { return localStorage.getItem(themeKey) === "dark" ? "dark" : "light"; }
    catch (_) { return "light"; }
  };
  const setTheme = (value) => {
    const next = value === "dark" ? "dark" : "light";
    root.setAttribute("data-q-theme", next);
    root.setAttribute("data-theme", next);
    const btn = document.querySelector(".rq-theme");
    if (btn) {
      btn.textContent = next === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", next === "dark" ? "Helles Design einschalten" : "Dunkles Design einschalten");
      btn.setAttribute("title", btn.getAttribute("aria-label"));
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#090c0b" : "#fcfdfc");
    try { localStorage.setItem(themeKey, next); } catch (_) {}
  };
  const page = document.querySelector(".qsource-page");
  const header = document.querySelector(".qsource-header");
  if (!page || !header) return;
  // Header keeps the actual, existing official logo file.
  const logo = header.querySelector(".qsource-logo");
  if (logo && logo.getAttribute("src") !== "/watermark-my-logo-full.png") {
    logo.setAttribute("src", "/watermark-my-logo-full.png");
  }
  if (logo && !logo.getAttribute("alt")) logo.alt = "DĀR AL TAWḤĪD – Original-Logo";
  const brand = header.querySelector(".qsource-brand");
  if (brand) brand.textContent = "DĀR AL TAWḤĪD";
  const sign = header.querySelector(".qsource-sign");
  if (sign) sign.textContent = "by Serhat Abu Malik";
  const change = document.createElement("button");
  change.type = "button";
  change.className = "rq-theme";
  header.appendChild(change);
  change.addEventListener("click", () => setTheme(root.getAttribute("data-q-theme") === "dark" ? "light" : "dark"));
  setTheme(readTheme());
  const top = document.createElement("nav");
  top.className = "rq-topbar";
  top.setAttribute("aria-label", "Quellen-Navigation");
  const back = document.createElement("a");
  back.href = "/quellen/";
  back.textContent = "← Quellenbibliothek";
  top.appendChild(back);
  if (number) {
    const badge = document.createElement("span");
    badge.textContent = "Quelle Q" + number;
    top.appendChild(badge);
  }
  header.insertAdjacentElement("afterend", top);
  // Mark broken placeholder links as unavailable, never masquerade as valid evidence.
  for (const a of page.querySelectorAll('a.qsource-link[href="#"]')) {
    a.addEventListener("click", event => event.preventDefault());
    a.setAttribute("aria-disabled", "true");
    a.title = "Für diesen Originalnachweis ist noch keine gültige Adresse eingetragen.";
  }
  if (number) {
    const actions = document.createElement("div");
    actions.className = "rq-source-actions";
    const address = document.createElement("a");
    address.className = "rq-permalink";
    address.href = "/q/" + number + "/";
    address.textContent = "dar-al-tawhid.de/q/" + number + "/";
    const copy = document.createElement("button");
    copy.className = "rq-copy";
    copy.type = "button";
    copy.textContent = "Kurzlink kopieren";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(new URL(address.href, location.href).href);
        copy.textContent = "Kopiert ✓";
      } catch (_) {
        copy.textContent = "Link auswählen";
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(address);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      setTimeout(() => { copy.textContent = "Kurzlink kopieren"; }, 1900);
    });
    actions.append(address, copy);
    const social = page.querySelector(".qsource-social");
    const footer = page.querySelector(".qsource-footer");
    page.insertBefore(actions, social || footer || null);
    const nav = document.createElement("nav");
    nav.className = "rq-nav";
    nav.setAttribute("aria-label", "Vorherige und nächste Quelle");
    const renderNeighbors = (nums) => {
      nav.replaceChildren();
      const current = nums.indexOf(number);
      if (current < 0) return;
      const prev = nums[current - 1], next = nums[current + 1];
      if (prev) {
        const a = document.createElement("a");
        a.href = "/q/" + prev + "/";
        a.textContent = "← Q" + prev + " · Vorherige";
        nav.appendChild(a);
      }
      if (next) {
        const a = document.createElement("a");
        a.href = "/q/" + next + "/";
        a.textContent = "Nächste · Q" + next + " →";
        nav.appendChild(a);
      }
    };
    page.insertBefore(nav, social || footer || null);
    fetch("/quellen/shortlinks.json", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !Array.isArray(data.links)) return;
        const nums = data.links.filter(x => x && x.status !== "inactive").map(x => Number(x.number))
          .filter(x => Number.isSafeInteger(x) && x > 0).sort((a,b) => a-b);
        renderNeighbors(nums);
      }).catch(() => {});
  }
  body.dataset.qRoyalVersion = version;
})();