import { monthKey } from "./budget.js";

export class VideoStudioStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = String(request.method || "GET").toUpperCase();
    const path = url.pathname;

    try {
      if (method === "GET" && path === "/jobs") {
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
        const jobs = await this.listJobs(limit);
        return Response.json({ ok: true, jobs });
      }

      if (method === "GET" && path.startsWith("/jobs/")) {
        const id = decodeURIComponent(path.slice("/jobs/".length));
        const job = await this.getJob(id);
        if (!job) return Response.json({ ok: false, error: "Auftrag nicht gefunden" }, { status: 404 });
        return Response.json({ ok: true, job });
      }

      if (method === "PUT" && path.startsWith("/jobs/")) {
        const id = decodeURIComponent(path.slice("/jobs/".length));
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return Response.json({ ok: false, error: "Ungültiger Auftrag" }, { status: 400 });
        }
        const saved = await this.putJob(id, body);
        return Response.json({ ok: true, job: saved });
      }

      if (method === "DELETE" && path.startsWith("/jobs/")) {
        const id = decodeURIComponent(path.slice("/jobs/".length));
        await this.deleteJob(id);
        return Response.json({ ok: true, deleted: true, id });
      }

      if (method === "GET" && path === "/budget") {
        const key = url.searchParams.get("month") || monthKey();
        const spent = Number((await this.state.storage.get(`budget:${key}`)) || 0);
        return Response.json({ ok: true, month: key, spentEur: spent });
      }

      if (method === "POST" && path === "/budget/add") {
        const body = await request.json().catch(() => ({}));
        const key = body.month || monthKey();
        const add = Number(body.amountEur || 0);
        const current = Number((await this.state.storage.get(`budget:${key}`)) || 0);
        const next = Number((current + add).toFixed(4));
        await this.state.storage.put(`budget:${key}`, next);
        return Response.json({ ok: true, month: key, spentEur: next });
      }

      if (method === "GET" && path === "/used-statements") {
        const used = (await this.state.storage.get("usedStatements")) || [];
        return Response.json({ ok: true, usedIds: used });
      }

      if (method === "POST" && path === "/used-statements") {
        const body = await request.json().catch(() => ({}));
        const id = String(body.id || "").trim();
        const used = new Set((await this.state.storage.get("usedStatements")) || []);
        if (id) used.add(id);
        const list = [...used];
        await this.state.storage.put("usedStatements", list);
        return Response.json({ ok: true, usedIds: list });
      }

      if (method === "GET" && path === "/rate") {
        const key = String(url.searchParams.get("key") || "global");
        const bucket = (await this.state.storage.get(`rate:${key}`)) || { count: 0, resetAt: 0 };
        return Response.json({ ok: true, bucket });
      }

      if (method === "POST" && path === "/rate") {
        const body = await request.json().catch(() => ({}));
        const key = String(body.key || "global");
        const max = Number(body.max || 8);
        const windowMs = Number(body.windowMs || 60 * 60 * 1000);
        const now = Date.now();
        let bucket = (await this.state.storage.get(`rate:${key}`)) || { count: 0, resetAt: now + windowMs };
        if (now >= Number(bucket.resetAt || 0)) bucket = { count: 0, resetAt: now + windowMs };
        if (bucket.count >= max) {
          return Response.json({ ok: false, limited: true, bucket }, { status: 429 });
        }
        bucket.count += 1;
        await this.state.storage.put(`rate:${key}`, bucket);
        return Response.json({ ok: true, bucket });
      }

      if (method === "GET" && path === "/editor/templates") {
        const templates = (await this.state.storage.get("editorTemplates")) || [];
        return Response.json({ ok: true, templates });
      }
      if (method === "PUT" && path === "/editor/templates") {
        const body = await request.json().catch(() => ({}));
        const templates = Array.isArray(body.templates) ? body.templates.slice(0, 40) : [];
        await this.state.storage.put("editorTemplates", templates);
        return Response.json({ ok: true, templates });
      }
      if (method === "GET" && path === "/editor/pronunciation") {
        const dict = (await this.state.storage.get("pronunciationDict")) || {};
        return Response.json({ ok: true, dict });
      }
      if (method === "PUT" && path === "/editor/pronunciation") {
        const body = await request.json().catch(() => ({}));
        const dict = body.dict && typeof body.dict === "object" ? body.dict : {};
        await this.state.storage.put("pronunciationDict", dict);
        return Response.json({ ok: true, dict });
      }

      return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    } catch (error) {
      return Response.json({ ok: false, error: error.message || String(error) }, { status: 500 });
    }
  }

  async listJobs(limit) {
    const index = (await this.state.storage.get("jobIndex")) || [];
    const jobs = [];
    for (const id of index.slice(0, limit)) {
      const job = await this.state.storage.get(`job:${id}`);
      if (job) jobs.push(job);
    }
    return jobs;
  }

  async getJob(id) {
    return (await this.state.storage.get(`job:${id}`)) || null;
  }

  async putJob(id, job) {
    const prev = (await this.state.storage.get(`job:${id}`)) || {};
    const saved = {
      ...prev,
      ...job,
      id,
      updatedAt: new Date().toISOString()
    };
    await this.state.storage.put(`job:${id}`, saved);
    const index = (await this.state.storage.get("jobIndex")) || [];
    const next = [id, ...index.filter((x) => x !== id)].slice(0, 200);
    await this.state.storage.put("jobIndex", next);
    return saved;
  }

  async deleteJob(id) {
    await this.state.storage.delete(`job:${id}`);
    const index = (await this.state.storage.get("jobIndex")) || [];
    await this.state.storage.put("jobIndex", index.filter((x) => x !== id));
  }
}

function storeStub(env) {
  const ns = env?.VIDEO_STUDIO_STORE;
  if (!ns) return null;
  return ns.get(ns.idFromName("dar-video-studio-global"));
}

async function storeFetch(env, path, init = {}) {
  const stub = storeStub(env);
  if (!stub) return { ok: false, missingStore: true, error: "VIDEO_STUDIO_STORE Binding fehlt" };
  const res = await stub.fetch(`https://video-studio.internal${path}`, init);
  const data = await res.json().catch(() => ({}));
  return { ...data, httpStatus: res.status, ok: data.ok !== false && res.ok };
}

export async function saveJob(env, job) {
  const id = String(job.id || "").trim();
  if (!id) throw new Error("job.id fehlt");
  const result = await storeFetch(env, `/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job)
  });
  if (result.missingStore) {
    // Ephemeral fallback for local/dev without DO binding
    globalThis.__DAR_VIDEO_JOBS__ = globalThis.__DAR_VIDEO_JOBS__ || new Map();
    const saved = { ...job, updatedAt: new Date().toISOString() };
    globalThis.__DAR_VIDEO_JOBS__.set(id, saved);
    const idx = globalThis.__DAR_VIDEO_JOB_INDEX__ || [];
    globalThis.__DAR_VIDEO_JOB_INDEX__ = [id, ...idx.filter((x) => x !== id)].slice(0, 200);
    return saved;
  }
  if (!result.ok) throw new Error(result.error || "Job speichern fehlgeschlagen");
  return result.job;
}

export async function readJob(env, id) {
  const result = await storeFetch(env, `/jobs/${encodeURIComponent(id)}`);
  if (result.missingStore) {
    return (globalThis.__DAR_VIDEO_JOBS__ || new Map()).get(String(id)) || null;
  }
  if (result.httpStatus === 404) return null;
  return result.job || null;
}

export async function listJobs(env, limit = 20) {
  const result = await storeFetch(env, `/jobs?limit=${limit}`);
  if (result.missingStore) {
    const idx = globalThis.__DAR_VIDEO_JOB_INDEX__ || [];
    const map = globalThis.__DAR_VIDEO_JOBS__ || new Map();
    return idx.slice(0, limit).map((id) => map.get(id)).filter(Boolean);
  }
  return result.jobs || [];
}

export async function deleteJob(env, id) {
  const result = await storeFetch(env, `/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (result.missingStore) {
    (globalThis.__DAR_VIDEO_JOBS__ || new Map()).delete(String(id));
    globalThis.__DAR_VIDEO_JOB_INDEX__ = (globalThis.__DAR_VIDEO_JOB_INDEX__ || []).filter((x) => x !== id);
    return true;
  }
  return Boolean(result.ok);
}

export async function readMonthSpend(env) {
  const result = await storeFetch(env, `/budget?month=${monthKey()}`);
  if (result.missingStore) {
    const key = `budget:${monthKey()}`;
    return Number(globalThis.__DAR_VIDEO_BUDGET__?.[key] || 0);
  }
  return Number(result.spentEur || 0);
}

export async function addMonthSpend(env, amountEur) {
  const result = await storeFetch(env, "/budget/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountEur, month: monthKey() })
  });
  if (result.missingStore) {
    globalThis.__DAR_VIDEO_BUDGET__ = globalThis.__DAR_VIDEO_BUDGET__ || {};
    const key = `budget:${monthKey()}`;
    globalThis.__DAR_VIDEO_BUDGET__[key] = Number(((globalThis.__DAR_VIDEO_BUDGET__[key] || 0) + Number(amountEur || 0)).toFixed(4));
    return globalThis.__DAR_VIDEO_BUDGET__[key];
  }
  return Number(result.spentEur || 0);
}

export async function readUsedStatementIds(env) {
  const result = await storeFetch(env, "/used-statements");
  if (result.missingStore) return globalThis.__DAR_VIDEO_USED_STATEMENTS__ || [];
  return result.usedIds || [];
}

export async function markStatementUsed(env, id) {
  const result = await storeFetch(env, "/used-statements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (result.missingStore) {
    const set = new Set(globalThis.__DAR_VIDEO_USED_STATEMENTS__ || []);
    set.add(String(id));
    globalThis.__DAR_VIDEO_USED_STATEMENTS__ = [...set];
    return globalThis.__DAR_VIDEO_USED_STATEMENTS__;
  }
  return result.usedIds || [];
}

export async function assertVideoStudioRateLimit(env, request) {
  const key =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("X-Admin-Secret")?.slice(0, 12) ||
    "unknown";
  const result = await storeFetch(env, "/rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, max: Number(env.VIDEO_STUDIO_RATE_MAX || 8), windowMs: 60 * 60 * 1000 })
  });
  if (result.missingStore) return { ok: true };
  if (result.limited || result.httpStatus === 429) {
    const err = new Error("Zu viele Video-Aufträge. Bitte später erneut versuchen.");
    err.status = 429;
    throw err;
  }
  return { ok: true };
}

export async function listEditorTemplates(env) {
  const result = await storeFetch(env, "/editor/templates");
  if (result.missingStore) return globalThis.__DAR_EDITOR_TEMPLATES__ || [];
  return result.templates || [];
}

export async function saveEditorTemplates(env, templates) {
  const list = Array.isArray(templates) ? templates.slice(0, 40) : [];
  const result = await storeFetch(env, "/editor/templates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templates: list })
  });
  if (result.missingStore) {
    globalThis.__DAR_EDITOR_TEMPLATES__ = list;
    return list;
  }
  if (!result.ok) throw new Error(result.error || "Vorlagen speichern fehlgeschlagen");
  return result.templates || list;
}

export async function readPronunciationDict(env) {
  const result = await storeFetch(env, "/editor/pronunciation");
  if (result.missingStore) return globalThis.__DAR_PRONUNCIATION__ || {};
  return result.dict || {};
}

export async function savePronunciationDict(env, dict) {
  const next = dict && typeof dict === "object" ? dict : {};
  const result = await storeFetch(env, "/editor/pronunciation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dict: next })
  });
  if (result.missingStore) {
    globalThis.__DAR_PRONUNCIATION__ = next;
    return next;
  }
  if (!result.ok) throw new Error(result.error || "Aussprache speichern fehlgeschlagen");
  return result.dict || next;
}
