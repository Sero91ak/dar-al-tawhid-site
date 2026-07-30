/**
 * DAR AL TAWḤĪD – Widget theme tokens (centralized colors)
 */
(function (global) {
  "use strict";

  const VERSION = "widget-theme-v1";

  const THEMES = {
    light: {
      id: "light",
      label: "Hell",
      backgroundColor: "#f4f1ea",
      surfaceColor: "#ffffff",
      primaryTextColor: "#1a1a1a",
      secondaryTextColor: "#5a564e",
      accentColor: "#8a6d2f",
      borderColor: "rgba(40,36,28,.14)",
      highlightColor: "#efe6d2",
      errorColor: "#8b3a3a"
    },
    dark: {
      id: "dark",
      label: "Dunkel",
      backgroundColor: "#0c0c0c",
      surfaceColor: "#161616",
      primaryTextColor: "#f3efe5",
      secondaryTextColor: "#b9b5ac",
      accentColor: "#c8a85a",
      borderColor: "rgba(255,255,255,.12)",
      highlightColor: "#24211a",
      errorColor: "#e8a0a0"
    },
    royal: {
      id: "royal",
      label: "Royal Nachtblau",
      backgroundColor: "#061426",
      surfaceColor: "#0a1c32",
      primaryTextColor: "#f5f1e7",
      secondaryTextColor: "#c2c8cd",
      accentColor: "#d6b963",
      borderColor: "rgba(225,198,126,.22)",
      highlightColor: "#132f4d",
      errorColor: "#e8a0a0"
    }
  };

  function resolveMode(mode, appTheme) {
    const m = String(mode || "auto").toLowerCase();
    if (m === "light" || m === "dark" || m === "royal") return m;
    const app = String(appTheme || "dark").toLowerCase();
    if (app === "light" || app === "soft") return "light";
    if (app === "royal") return "royal";
    return "dark";
  }

  function getTheme(mode, appTheme) {
    const id = resolveMode(mode, appTheme);
    return THEMES[id] || THEMES.dark;
  }

  function applyCssVars(el, theme) {
    if (!el || !theme) return;
    const map = {
      "--pw-bg": theme.backgroundColor,
      "--pw-surface": theme.surfaceColor,
      "--pw-text": theme.primaryTextColor,
      "--pw-muted": theme.secondaryTextColor,
      "--pw-accent": theme.accentColor,
      "--pw-border": theme.borderColor,
      "--pw-highlight": theme.highlightColor,
      "--pw-error": theme.errorColor
    };
    Object.keys(map).forEach((k) => el.style.setProperty(k, map[k]));
    el.setAttribute("data-pw-theme", theme.id);
  }

  global.DarWidgetTheme = {
    VERSION,
    THEMES,
    resolveMode,
    getTheme,
    applyCssVars
  };
})(typeof window !== "undefined" ? window : globalThis);
