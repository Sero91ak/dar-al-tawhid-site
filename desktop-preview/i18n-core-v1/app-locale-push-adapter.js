/* DĀR Zentrum – INACTIVE browser app-locale-to-push adapter.
 * Explicitly installed ONLY after protected push/scope/password approvals.
 * No permission request, user login, subscription change or notification.
 * A OneSignal.User tag is user-scoped and MUST NOT be used as
 * per-subscription truth when the same OneSignal user has multiple devices.
 */
(function (root) {
  "use strict";
  function normalized(code, registry) {
    if (!registry || !registry.locales || !registry.defaultLocale) {
      throw new Error("Validated locale registry is required");
    }
    var raw = String(code || "").trim().toLowerCase().replace(/_/g, "-");
    if (Object.prototype.hasOwnProperty.call(registry.locales, raw)) return raw;
    var base = raw.split("-")[0];
    return Object.prototype.hasOwnProperty.call(registry.locales, base)
      ? base : registry.defaultLocale;
  }

  /**
   * updateRegistration MUST call an authenticated server endpoint,
   * not the unrestricted public Supabase PostgREST table.
   * The server checks subscription ownership, existing consent and
   * writes to the private service-role-only locale mapping.
   * It then returns {ok:true, subscriptionId:<same>, appLocale:<same>}.
   *
   * This client code cannot authenticate ownership merely from the
   * public OneSignal subscription ID. The production bridge is disabled
   * until the secure server endpoint exists and its auth is verified.
   */
  async function syncSelectedAppLocale(chosenCode, config) {
    config = config || {};
    var locale = normalized(chosenCode, config.registry);
    var OS = config.oneSignal;
    var push = OS && OS.User && OS.User.PushSubscription;
    // Native WKWebView/Android WebView may not have the Web OneSignal SDK.
    // A bridge may supply device-scoped subscription state for the exact app
    // installation. This is a UI hint ONLY: the server independently verifies
    // ownership, app ID, environment and consent before changing its mapping.
    if (!push && typeof config.getNativeSubscriptionState === "function") {
      push = await config.getNativeSubscriptionState();
    }
    if (!push) return {synced:false,reason:"subscription_state_unavailable",locale:locale};
    var id = String(push.id || "").trim();
    if (!id) return {synced:false,reason:"no_subscription",locale:locale};
    if (push.optedIn !== true) {
      return {synced:false,reason:"push_not_opted_in",locale:locale};
    }
    if (typeof config.updateRegistration !== "function") {
      return {synced:false,reason:"secure_backend_not_integrated",locale:locale};
    }
    const ack = await config.updateRegistration({
      subscriptionId:id,appLocale:locale
    });
    if (!ack || ack.ok !== true ||
        String(ack.subscriptionId || "") !== id ||
        String(ack.appLocale || "") !== locale) {
      return {synced:false,reason:"server_ack_invalid",locale:locale};
    }
    return {synced:true,locale:locale,subscriptionId:id};
  }

  root.DarAppLocalePushDraft = Object.freeze({
    normalizeLocale:normalized,
    syncSelectedAppLocale:syncSelectedAppLocale
  });
})(typeof window === "object" ? window : globalThis);
