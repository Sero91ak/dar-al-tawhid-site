export function evaluateOneSignalDelivery(parsed = {}) {
  if (!parsed || typeof parsed !== "object") {
    return {
      delivered: false,
      reason: "OneSignal-Antwort ungültig – Push-Verbindung prüfen."
    };
  }

  const errors = parsed.errors;
  if (errors) {
    const invalidSub = errors.invalid_subscription_ids || errors.invalid_player_ids;
    if (Array.isArray(invalidSub) && invalidSub.length) {
      return {
        delivered: false,
        reason:
          "Dieses Gerät ist bei OneSignal nicht mehr aktiv. Bitte Push in der App erneut aktivieren und die App über das Home-Bildschirm-Icon öffnen.",
        notificationId: parsed.id || null,
        invalidSubscriptionIds: invalidSub
      };
    }
    if (Array.isArray(errors) && errors.length) {
      return {
        delivered: false,
        reason: errors.slice(0, 3).join(" · "),
        notificationId: parsed.id || null
      };
    }
    if (typeof errors === "object" && Object.keys(errors).length) {
      return {
        delivered: false,
        reason: `OneSignal: ${JSON.stringify(errors).slice(0, 160)}`,
        notificationId: parsed.id || null
      };
    }
  }

  if (!parsed.id) {
    return {
      delivered: false,
      reason:
        "Kein gültiges Push-Gerät gefunden. Bitte Benachrichtigungen erlauben und die App vom Home-Bildschirm öffnen."
    };
  }

  return {
    delivered: true,
    notificationId: parsed.id,
    reason: null
  };
}
