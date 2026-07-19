/**
 * DAR AL TAWḤID — Global Design System component helpers (Phase 3+)
 * Complements DARSpatial; safe no-op when spatial is unavailable.
 */
(function (global) {
  "use strict";

  function esc(value) {
    if (typeof global.esc === "function") return global.esc(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderButton(label, options = {}) {
    const variant = options.variant || "default";
    const classes = ["dar-btn"];
    if (variant === "primary") classes.push("dar-btn--primary");
    if (variant === "ghost") classes.push("dar-btn--ghost");
    if (variant === "danger") classes.push("dar-btn--danger");
    if (variant === "pill") classes.push("dar-btn--pill");
    if (options.compact) classes.push("dar-btn--compact");
    if (options.block) classes.push("dar-btn--block");
    if (options.className) classes.push(options.className);
    const attrs = [];
    if (options.id) attrs.push(`id="${esc(options.id)}"`);
    if (options.type) attrs.push(`type="${esc(options.type)}"`);
    else attrs.push('type="button"');
    if (options.nav) attrs.push(`data-nav="${esc(options.nav)}"`);
    if (options.value) attrs.push(`data-value="${esc(options.value)}"`);
    if (options.disabled) attrs.push("disabled");
    if (options.ariaLabel) attrs.push(`aria-label="${esc(options.ariaLabel)}"`);
    return `<button class="${classes.join(" ")}" ${attrs.join(" ")}>${esc(label)}</button>`;
  }

  function renderSearch(inputHtml, options = {}) {
    const shellClass = ["dar-search-shell", "spatial-glass-toolbar"];
    if (options.className) shellClass.push(options.className);
    if (global.DARSpatial && typeof DARSpatial.renderGlassSearch === "function") {
      return DARSpatial.renderGlassSearch(inputHtml, options.shellClass || "");
    }
    return `<div class="${shellClass.join(" ")}"><img src="/assets/icons/ui/search.svg" width="18" height="18" alt="" aria-hidden="true">${inputHtml}</div>`;
  }

  function renderCard(inner, options = {}) {
    const classes = ["dar-card"];
    if (options.elevated) classes.push("dar-card--elevated");
    if (options.flat) classes.push("dar-card--flat");
    if (options.className) classes.push(options.className);
    const tag = options.tag || "article";
    return `<${tag} class="${classes.join(" ")}">${inner}</${tag}>`;
  }

  function renderFeatureCard(item, options = {}) {
    if (global.DARSpatial && typeof DARSpatial.renderFeatureCard === "function") {
      return DARSpatial.renderFeatureCard(item, options);
    }
    if (!item) return "";
    return `<article class="dar-feature-card" data-feature-card="${esc(item.id)}">
      <span class="dar-feature-card__copy"><h4>${esc(item.title)}</h4><p>${esc(item.desc || "")}</p></span>
    </article>`;
  }

  function renderReadingSurface(inner, options = {}) {
    const classes = ["dar-reading-surface"];
    if (options.className) classes.push(options.className);
    return `<section class="${classes.join(" ")}">${inner}</section>`;
  }

  function renderEmpty(message, options = {}) {
    const classes = ["dar-empty", "dar-state-empty", "empty"];
    if (options.className) classes.push(options.className);
    return `<div class="${classes.join(" ")}">${esc(message || "Keine Einträge.")}</div>`;
  }

  function renderLoading(message, options = {}) {
    const classes = ["dar-loading", "dar-state-loading", "loading"];
    if (options.className) classes.push(options.className);
    return `<div class="${classes.join(" ")}">${esc(message || "Wird geladen…")}</div>`;
  }

  function renderError(message, options = {}) {
    const classes = ["dar-error", "dar-state-error"];
    if (options.className) classes.push(options.className);
    return `<div class="${classes.join(" ")}" role="alert">${esc(message || "Ein Fehler ist aufgetreten.")}</div>`;
  }

  function pageShell(pageId, inner) {
    const id = String(pageId || "page").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return `<div class="dar-page-shell dar-page-${esc(id)}" data-dar-page="${esc(id)}">${inner}</div>`;
  }

  function enableDesignSystem() {
    document.documentElement.classList.add("dar-design-system");
    document.body.classList.add("dar-design-system");
    const nav = document.getElementById("bottomNav");
    if (nav) nav.classList.add("dar-bottom-nav");
  }

  const api = {
    renderButton,
    renderSearch,
    renderCard,
    renderFeatureCard,
    renderReadingSurface,
    renderEmpty,
    renderLoading,
    renderError,
    pageShell,
    enableDesignSystem
  };

  global.DARDesign = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enableDesignSystem);
  } else {
    enableDesignSystem();
  }
})(typeof window !== "undefined" ? window : globalThis);
