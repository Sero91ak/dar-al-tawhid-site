/* DĀR Zentrum – inactive browser locale-to-push adapter.
 * Explicitly opt-in only; NOT included in any production HTML.
 * This file does not request notification permission, log in, or subscribe.
 */
(function (root) {
  "use strict";
  function normalized(code, registry) {
    if (!registry || !registry.locales || !registry.defaultLocale) {
      throw new Error("A validated locale registry is required");
    }
    var raw = String(code || "").trim().toLowerCase().replace(/_/g, "-");
    if (Object.prototype.hasOwnProperty.call(registry.locales, raw)) return raw;
    var base = raw.split("-")[0];
    return Object.prototype.hasOwnProperty.call(registry.locales, base) ? base : registry.defaultLocale;
  }
  async function syncSelectedAppLocale(chosenCode, config) {
    config = config || {};
    var registry = config.registry;
    var locale = normalized(chosenCode, registry);
    var oneSignal = config.oneSignal;
    if (!oneSignal || !oneSignal.User || typeof oneSignal.User.addTags !== "function") {
      return { synced: false, reason: "onesignal_unavailable", locale: locale };
    }
    // Do not force optIn or create a new subscription merely for a language change.
    var id = String(oneSignal.User.PushSubscription && oneSignal.User.PushSubscription.id || "").trim();
    if (!id) return { synced: false, reason: "no_subscription", locale: locale };
    // Server registration is required as a separate, verified step.
    if (typeof config.updateRegistration !== "function") {
      return { synced: false, reason: "backend_not_integrated", locale: locale };
    }
    // First persist to the current subscription; failure cannot report "synced".
    await config.updateRegistration({ subscriptionId: id, appLocale: locale });
    await oneSignal.User.addTags({ dar_app_locale: locale });
    return { synced: true, locale: locale };
  }
  root.DarAppLocalePushDraft = Object.freeze({
    normalizeLocale: normalized,
    syncSelectedAppLocale: syncSelectedAppLocale
  });
})(typeof window === "object" ? window : globalThis);
