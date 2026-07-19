/**
 * DAR AL TAWḤID — Spatial Premium 2026
 * Central icon registry and component render helpers.
 */
(function (global) {
  "use strict";

  const FEATURE_ICON_BASE = "/assets/icons/features/";
  const UI_ICON_BASE = "/assets/icons/ui/";

  const FEATURE_ICON_ALIASES = {
    prayer: "prayer-times",
    duas: "duas",
    dua: "duas",
    posts: "topics",
    topics: "topics",
    "din-quiz": "quiz",
    quiz: "quiz",
    ilm: "ilm",
    hadith: "hadith",
    "hadith-library": "hadith",
    "image-editor": "image-editor",
    zakat: "zakat",
    wasiyyah: "wasiyyah"
  };

  const BOTTOM_NAV_ICONS = {
    home: "home",
    ilm: "ilm",
    feed: "feed",
    quran: "quran",
    more: "menu"
  };

  const UI_LABELS = {
    home: "Start",
    quiz: "ʿIlm",
    feed: "Feed",
    quran: "Qurʾān",
    more: "Mehr"
  };

  function resolveFeatureIconId(id) {
    const key = String(id || "").trim().toLowerCase();
    return FEATURE_ICON_ALIASES[key] || key || "about";
  }

  function featureIconUrl(id) {
    return `${FEATURE_ICON_BASE}${resolveFeatureIconId(id)}.svg`;
  }

  function uiIconUrl(name) {
    return `${UI_ICON_BASE}${String(name || "home").trim()}.svg`;
  }

  function esc(value) {
    if (typeof global.esc === "function") return global.esc(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFeatureIcon(id, options = {}) {
    const size = Number(options.size) || 56;
    const label = options.label || "";
    const decorative = options.decorative !== false;
    const iconId = resolveFeatureIconId(id);
    const alt = decorative ? "" : ` alt="${esc(label)}"`;
    const aria = decorative ? ' aria-hidden="true"' : "";
    return `<span class="spatial-feature-icon" style="width:${size}px;height:${size}px"${aria}><img src="${featureIconUrl(iconId)}" width="${size}" height="${size}" loading="lazy" decoding="async"${alt}></span>`;
  }

  function renderUiIcon(name, options = {}) {
    const size = Number(options.size) || 22;
    const label = options.label || name || "";
    const className = options.className || "nav-icon-spatial";
    return `<span class="${esc(className)}" role="img" aria-label="${esc(label)}"><img src="${uiIconUrl(name)}" width="${size}" height="${size}" alt="" decoding="async"></span>`;
  }

  function renderBadge(badge) {
    if (!badge) return "";
    return `<span class="spatial-badge">${esc(badge)}</span>`;
  }

  function renderFeatureCard(item, options = {}) {
    if (!item) return "";
    const pinned = options.pinned;
    const pinBtn = options.showPin
      ? `<button class="feature-pin" type="button" data-feature-pin="${esc(item.id)}" aria-label="${pinned ? "Schnellzugriff entfernen" : "Schnellzugriff anpinnen"}">${pinned ? "★" : "☆"}</button>`
      : "";
    const actions = options.showPin
      ? `<div class="feature-card-actions"><button class="feature-open" type="button" data-nav="${esc(item.nav)}" ${item.value ? `data-value="${esc(item.value)}"` : ""}>${esc(item.button || "Öffnen")}</button>${pinBtn}</div>`
      : "";
    const tag = options.asButton === false ? "article" : "button";
    const typeAttr = tag === "button" ? ' type="button"' : "";
    const navAttrs = options.asButton === false
      ? ""
      : ` data-nav="${esc(item.nav)}"${item.value ? ` data-value="${esc(item.value)}"` : ""}`;
    const search = options.searchText
      ? ` data-feature-search="${esc(options.searchText)}"`
      : "";
    return `<${tag} class="spatial-feature-card spatial-more-row" data-feature-card="${esc(item.id)}"${typeAttr}${navAttrs}${search}>
      <span class="spatial-feature-card__copy">
        <h4>${esc(item.title)}${renderBadge(item.badge)}</h4>
        <p>${esc(item.desc || "")}</p>
      </span>
      <span class="spatial-feature-card__art">${renderFeatureIcon(item.id, { size: options.iconSize || 52, label: item.title })}</span>
      ${actions}
    </${tag}>`;
  }

  function renderMoreFeatureRow(item) {
    const search = [item.title, item.desc, item.group, item.badge].filter(Boolean).join(" ").toLowerCase();
    return renderFeatureCard(item, { asButton: true, searchText: search, iconSize: 48 });
  }

  function renderHomeFeatureCard(item) {
    const pinned = typeof global.isFeaturePinned === "function" ? global.isFeaturePinned(item.id) : false;
    return `<article class="spatial-feature-card" data-feature-card="${esc(item.id)}">
      <span class="spatial-feature-card__copy">
        <h4>${esc(item.title)}${renderBadge(item.badge)}</h4>
        <p>${esc(item.desc || "")}</p>
      </span>
      <span class="spatial-feature-card__art">${renderFeatureIcon(item.id, { size: 48, label: item.title })}</span>
      <div class="feature-card-actions">
        <button class="feature-open" type="button" data-nav="${esc(item.nav)}" ${item.value ? `data-value="${esc(item.value)}"` : ""}>${esc(item.button || "Öffnen")}</button>
        <button class="feature-pin" type="button" data-feature-pin="${esc(item.id)}" aria-label="${pinned ? "Schnellzugriff entfernen" : "Schnellzugriff anpinnen"}">${pinned ? "★" : "☆"}</button>
      </div>
    </article>`;
  }

  function bottomNavIconMarkup(tab) {
    const icon = BOTTOM_NAV_ICONS[tab] || "home";
    const label = UI_LABELS[tab] || tab;
    return renderUiIcon(icon, { label, size: 22 });
  }

  function enableSpatialPremium() {
    document.documentElement.classList.add("spatial-premium-2026");
    document.body.classList.add("spatial-premium-2026");
    const nav = document.getElementById("bottomNav");
    if (nav) nav.classList.add("spatial-glass-nav");
  }

  const api = {
    FEATURE_ICON_BASE,
    UI_ICON_BASE,
    resolveFeatureIconId,
    featureIconUrl,
    uiIconUrl,
    renderFeatureIcon,
    renderUiIcon,
    renderFeatureCard,
    renderMoreFeatureRow,
    renderHomeFeatureCard,
    bottomNavIconMarkup,
    enableSpatialPremium
  };

  global.DARSpatial = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enableSpatialPremium);
  } else {
    enableSpatialPremium();
  }
})(typeof window !== "undefined" ? window : globalThis);
