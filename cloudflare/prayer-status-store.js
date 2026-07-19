export class PrayerStatusStore {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const method = String(request.method || "GET").toUpperCase();

    if (method === "PUT") {
      const status = await request.json().catch(() => null);
      if (!status || typeof status !== "object" || !status.updatedAt) {
        return Response.json({ ok: false, error: "Ungültiger Gebets-Push-Status" }, { status: 400 });
      }
      await this.state.storage.put("latest", status);
      return Response.json({ ok: true, saved: true, updatedAt: status.updatedAt });
    }

    if (method === "GET") {
      const status = await this.state.storage.get("latest");
      return Response.json({ ok: Boolean(status), status: status || null });
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
