export class PrayerStatusStore {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const method = String(request.method || "GET").toUpperCase();
    const url = new URL(request.url);
    const path = String(url.pathname || "/").replace(/\/+$/, "") || "/";

    if (method === "POST" && path === "/claim") {
      const body = await request.json().catch(() => null);
      const seed = String(body?.seed || "").trim();
      const day = String(body?.day || "").trim();
      if (!seed || !day) {
        return Response.json({ ok: false, error: "seed/day fehlen" }, { status: 400 });
      }
      const key = `claims:${day}`;
      const bag = (await this.state.storage.get(key)) || {};
      if (bag[seed]) {
        return Response.json({
          ok: true,
          claimed: false,
          duplicate: true,
          claimedAt: bag[seed].claimedAt || null
        });
      }
      bag[seed] = { claimedAt: new Date().toISOString() };
      await this.state.storage.put(key, bag);
      await pruneClaimDays(this.state.storage, day);
      return Response.json({ ok: true, claimed: true, duplicate: false, claimedAt: bag[seed].claimedAt });
    }

    if (method === "POST" && path === "/release") {
      const body = await request.json().catch(() => null);
      const seed = String(body?.seed || "").trim();
      const day = String(body?.day || "").trim();
      if (!seed || !day) {
        return Response.json({ ok: false, error: "seed/day fehlen" }, { status: 400 });
      }
      const key = `claims:${day}`;
      const bag = (await this.state.storage.get(key)) || {};
      if (bag[seed]) {
        delete bag[seed];
        await this.state.storage.put(key, bag);
      }
      return Response.json({ ok: true, released: true });
    }

    if (method === "PUT" && (path === "/latest" || path === "/")) {
      const status = await request.json().catch(() => null);
      if (!status || typeof status !== "object" || !status.updatedAt) {
        return Response.json({ ok: false, error: "Ungültiger Gebets-Push-Status" }, { status: 400 });
      }
      await this.state.storage.put("latest", status);
      return Response.json({ ok: true, saved: true, updatedAt: status.updatedAt });
    }

    if (method === "GET" && (path === "/latest" || path === "/")) {
      const status = await this.state.storage.get("latest");
      return Response.json({ ok: Boolean(status), status: status || null });
    }

    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
}

async function pruneClaimDays(storage, keepDay) {
  try {
    const keep = new Set([keepDay]);
    const parts = keepDay.split("-").map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      const prev = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - 1));
      keep.add(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-${String(prev.getUTCDate()).padStart(2, "0")}`);
    }
    const listed = await storage.list({ prefix: "claims:" });
    for (const key of listed.keys()) {
      const day = String(key).slice("claims:".length);
      if (!keep.has(day)) await storage.delete(key);
    }
  } catch (_) {
    /* ignore prune errors */
  }
}

function statusStub(env) {
  const namespace = env?.PRAYER_STATUS_STORE;
  if (!namespace) return null;
  const id = namespace.idFromName("prayer-push-global-status");
  return namespace.get(id);
}

export async function writePrayerStatusToStore(env, status) {
  const stub = statusStub(env);
  if (!stub) return { saved: false, source: "durable-object", reason: "PRAYER_STATUS_STORE binding fehlt" };

  try {
    const response = await stub.fetch("https://prayer-status.internal/latest", {
      method: "PUT",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(status)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.saved) {
      return { saved: false, source: "durable-object", reason: result?.error || `HTTP ${response.status}` };
    }
    return { saved: true, source: "durable-object", updatedAt: result.updatedAt || status.updatedAt };
  } catch (error) {
    return { saved: false, source: "durable-object", reason: error.message || String(error) };
  }
}

export async function readPrayerStatusFromStore(env) {
  const stub = statusStub(env);
  if (!stub) return { ok: false, source: "durable-object", reason: "PRAYER_STATUS_STORE binding fehlt", status: null };

  try {
    const response = await stub.fetch("https://prayer-status.internal/latest", { method: "GET" });
    const result = await response.json().catch(() => ({}));
    const status = result?.status || null;
    return {
      ok: Boolean(response.ok && status?.updatedAt),
      source: "durable-object",
      status,
      reason: response.ok ? null : (result?.error || `HTTP ${response.status}`)
    };
  } catch (error) {
    return { ok: false, source: "durable-object", reason: error.message || String(error), status: null };
  }
}

/** PRAYER_PUSH_CLAIM_LOCK: ein Claim pro seed/Tag – verhindert Doppel-Push über Cron-Läufe. */
export async function claimPrayerPushSeed(env, seed, day) {
  const stub = statusStub(env);
  const cleanSeed = String(seed || "").trim();
  const cleanDay = String(day || "").trim();
  if (!cleanSeed || !cleanDay) return { ok: false, claimed: false, unavailable: true, reason: "seed/day fehlen" };
  if (!stub) return { ok: false, claimed: false, unavailable: true, reason: "PRAYER_STATUS_STORE binding fehlt" };

  try {
    const response = await stub.fetch("https://prayer-status.internal/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ seed: cleanSeed, day: cleanDay })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, claimed: false, unavailable: true, reason: result?.error || `HTTP ${response.status}` };
    }
    return {
      ok: true,
      claimed: Boolean(result.claimed),
      duplicate: Boolean(result.duplicate),
      claimedAt: result.claimedAt || null
    };
  } catch (error) {
    return { ok: false, claimed: false, unavailable: true, reason: error.message || String(error) };
  }
}

export async function releasePrayerPushSeed(env, seed, day) {
  const stub = statusStub(env);
  const cleanSeed = String(seed || "").trim();
  const cleanDay = String(day || "").trim();
  if (!stub || !cleanSeed || !cleanDay) return { ok: false, released: false };
  try {
    const response = await stub.fetch("https://prayer-status.internal/release", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ seed: cleanSeed, day: cleanDay })
    });
    const result = await response.json().catch(() => ({}));
    return { ok: Boolean(response.ok), released: Boolean(result.released) };
  } catch (_) {
    return { ok: false, released: false };
  }
}
