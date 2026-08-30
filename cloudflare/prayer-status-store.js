export class PrayerStatusStore {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const method = String(request.method || "GET").toUpperCase();
    const url = new URL(request.url);
    const raw = url.pathname.replace(/^\/+|\/+$/g, "") || "prayer";
    const key = raw === "latest" ? "prayer" : raw;
    if (!["prayer", "jummah", "daily", "zakat"].includes(key)) {
      return Response.json({ ok: false, error: "Unbekannter Status-Schlüssel" }, { status: 400 });
    }

    if (method === "PUT") {
      const status = await request.json().catch(() => null);
      if (!status || typeof status !== "object" || !status.updatedAt) {
        return Response.json({ ok: false, error: "Ungültiger Push-Status" }, { status: 400 });
      }
      await this.state.storage.put(key, status);
      return Response.json({ ok: true, saved: true, key, updatedAt: status.updatedAt });
    }

    if (method === "GET") {
      const status = await this.state.storage.get(key);
      return Response.json({ ok: Boolean(status), key, status: status || null });
    }

    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
}

function statusStub(env) {
  const namespace = env?.PRAYER_STATUS_STORE;
  if (!namespace) return null;
  const id = namespace.idFromName("prayer-push-global-status");
  return namespace.get(id);
}

export async function writeNamedStatusToStore(env, name, status) {
  const stub = statusStub(env);
  if (!stub) return { saved: false, source: "durable-object", reason: "PRAYER_STATUS_STORE binding fehlt" };
  const key = name === "latest" ? "prayer" : name;

  try {
    const response = await stub.fetch(`https://prayer-status.internal/${key}`, {
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

export async function writePrayerStatusToStore(env, status) {
  return writeNamedStatusToStore(env, "prayer", status);
}

export async function readNamedStatusFromStore(env, name) {
  const stub = statusStub(env);
  if (!stub) return { ok: false, source: "durable-object", reason: "PRAYER_STATUS_STORE binding fehlt", status: null };
  const key = name === "latest" ? "prayer" : name;

  try {
    const response = await stub.fetch(`https://prayer-status.internal/${key}`, { method: "GET" });
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

export async function readPrayerStatusFromStore(env) {
  return readNamedStatusFromStore(env, "prayer");
}
