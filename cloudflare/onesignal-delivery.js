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

  const accepted = parseAcceptedRecipientCount(parsed);
  // Gezielte Pushs (Willkommen/Test): 0 Empfänger = noch nicht zustellbar.
  // Fehlendes recipients-Feld darf eine gültige Notification-ID nicht verwerfen.
  if (Number.isFinite(accepted) && accepted <= 0) {
    return {
      delivered: false,
      notificationId: parsed.id,
      reason:
        "OneSignal meldet 0 Empfänger – Gerät noch nicht bereit. Willkommens-Push wird automatisch erneut versucht.",
      recipients: accepted
    };
  }

  return {
    delivered: true,
    notificationId: parsed.id,
    reason: null,
    recipients: Number.isFinite(accepted) ? accepted : null
  };
}

function parseAcceptedRecipientCount(parsed = {}) {
  const candidates = [parsed?.recipients, parsed?.total_count, parsed?.successful];
  for (const value of candidates) {
    const count = Number(value);
    if (Number.isFinite(count)) return count;
  }
  return null;
}

/** True when a broadcast attempt (Supabase batch, segment, or tag filter) actually reached someone. */
export function broadcastPushAttemptSucceeded(parsed, payload = {}) {
  const notificationId = parsed?.id || parsed?.notificationId || null;
  if (!notificationId) return false;

  const accepted = parseAcceptedRecipientCount(parsed);
  // Explizit 0 Empfänger = kein Erfolg. Fehlendes Feld darf einen gültigen ID-Send nicht verwerfen.
  if (Number.isFinite(accepted) && accepted === 0) return false;

  const subscriptionIds = Array.isArray(payload.include_subscription_ids)
    ? payload.include_subscription_ids.filter(Boolean)
    : [];

  // Batch-Send: Notification-ID bedeutet Annahme durch OneSignal.
  // invalid_player_ids / invalid_subscription_ids betreffen nur tote IDs —
  // gültige Empfänger haben die Push bereits erhalten. Nicht als Totalausfall werten,
  // sonst folgen Segment-Fallbacks und Doppelzustellung.
  if (subscriptionIds.length) return true;

  if (!Number.isFinite(accepted)) return true;
  return accepted > 0;
}
