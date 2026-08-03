import { normalizeBudget } from "./budget.js";
import {
  assertVideoStudioRateLimit,
  deleteJob,
  listJobs,
  readJob,
  readMonthSpend,
  saveJob
} from "./job-store.js";
import { createVideoStudioJob, processVideoStudioJob, publicJob, runVideoStudioPipelineLoop, refreshVideoStudioJobUrls } from "./pipeline.js";
import { providersStatus, probeFalAuth } from "./providers/index.js";
import { getVideoAsset, verifySignedAssetRequest } from "./storage.js";
import { isVoiceConfigured, probeElevenAuth } from "./voice.js";
import { isComposerConfigured, shotstackEnvironment, probeShotstackAuth } from "./compose.js";

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
  });
}

function matchVideoStudioRoute(pathname) {
  const base = "/api/admin/video-studio";
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length) || "/";
  return rest;
}

function assertVideoStudioAuthorized(request, env, assertAuthorized) {
  const headerSecret = request.headers.get("X-Admin-Secret") || "";
  const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const testToken = String(env.VIDEO_STUDIO_TEST_TOKEN || "").trim();
  if (testToken && (headerSecret === testToken || bearer === testToken)) return;
  assertAuthorized(request, env);
}

export async function handleVideoStudioRequest(request, env, ctx, { cors, assertAuthorized, helpers }) {
  const url = new URL(request.url);
  const rest = matchVideoStudioRoute(url.pathname);
  if (rest == null) return null;

  // Signed asset download may use query signature instead of admin header
  if (request.method === "GET" && rest.startsWith("/assets/")) {
    return serveSignedAsset(request, env, url, rest, cors);
  }

  assertVideoStudioAuthorized(request, env, assertAuthorized);

  if (request.method === "GET" && rest === "/providers/status") {
    const spentEur = await readMonthSpend(env);
    const shotstack = shotstackEnvironment(env);
    const [falProbe, voiceProbe, shotstackProbe] = await Promise.all([
      probeFalAuth(env),
      probeElevenAuth(env),
      probeShotstackAuth(env)
    ]);
    return json({
      ok: true,
      providers: providersStatus(env),
      voiceConfigured: isVoiceConfigured(env),
      composerConfigured: isComposerConfigured(env),
      shotstackHost: shotstack.host,
      shotstackStageOnly: shotstack.isStage,
      r2Configured: Boolean(env.VIDEO_STUDIO_R2 || env.VIDEO_STUDIO_BUCKET),
      storeConfigured: Boolean(env.VIDEO_STUDIO_STORE),
      signingConfigured: Boolean(String(env.VIDEO_STUDIO_SIGNING_SECRET || env.ADMIN_PUBLISH_SECRET || "").trim()),
      monthSpendEur: spentEur,
      probes: {
        fal: falProbe,
        elevenlabs: voiceProbe,
        shotstack: shotstackProbe
      }
    }, cors);
  }

  if (request.method === "GET" && rest === "/jobs") {
    const limit = Number(url.searchParams.get("limit") || 20);
    const jobs = (await listJobs(env, limit)).map(publicJob);
    return json({ ok: true, jobs }, cors);
  }

  if (request.method === "POST" && rest === "/jobs") {
    await assertVideoStudioRateLimit(env, request);
    const input = await request.json().catch(() => ({}));
    const result = await createVideoStudioJob(env, input, helpers, ctx);
    return json(result, cors, result.job?.status === "setup_required" ? 200 : 200);
  }

  const jobMatch = rest.match(/^\/jobs\/([^/]+)(?:\/(cancel|retry|approve|refresh-urls))?$/);
  if (jobMatch) {
    const jobId = decodeURIComponent(jobMatch[1]);
    const action = jobMatch[2] || "";

    if (request.method === "GET" && !action) {
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      return json({ ok: true, job: publicJob(job) }, cors);
    }

    if (request.method === "DELETE" && !action) {
      await deleteJob(env, jobId);
      return json({ ok: true, deleted: true, id: jobId }, cors);
    }

    if (request.method === "POST" && action === "cancel") {
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      if (job.status === "completed") {
        return json({ ok: false, error: "Fertiger Auftrag kann nicht abgebrochen werden" }, cors, 409);
      }
      const saved = await saveJob(env, {
        ...job,
        status: "cancelled",
        message: "Auftrag abgebrochen",
        updatedAt: new Date().toISOString()
      });
      return json({ ok: true, job: publicJob(saved) }, cors);
    }

    if (request.method === "POST" && action === "retry") {
      await assertVideoStudioRateLimit(env, request);
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      const input = {
        brief: job.brief || "",
        mode: job.mode || "auto",
        voiceProfile: job.voiceProfile || "dar-male",
        budget: normalizeBudget(job.budget || {}),
        profile: job.profile || "dar-standard-v2",
        format: "9:16",
        manualApproval: true,
        composePreview: job.composePreview === true,
        client: job.client || {}
      };
      const result = await createVideoStudioJob(env, input, helpers, ctx);
      return json(result, cors);
    }

    if (request.method === "POST" && action === "approve") {
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      if (job.status !== "completed") {
        return json({ ok: false, error: "Nur fertige Aufträge können freigegeben werden" }, cors, 409);
      }
      const saved = await saveJob(env, {
        ...job,
        approval: {
          approved: true,
          approvedAt: new Date().toISOString(),
          note: "Interne Freigabe – keine automatische Besucher-Veröffentlichung und kein Push"
        },
        message: "Intern freigegeben (noch nicht veröffentlicht)",
        updatedAt: new Date().toISOString()
      });
      return json({ ok: true, job: publicJob(saved) }, cors);
    }

    if (request.method === "POST" && action === "refresh-urls") {
      const refreshed = await refreshVideoStudioJobUrls(env, jobId);
      return json({ ok: true, job: refreshed }, cors);
    }
  }

  if (request.method === "POST" && rest.startsWith("/jobs/") && rest.endsWith("/process")) {
    const jobId = decodeURIComponent(rest.slice("/jobs/".length, -"/process".length));
    // Ein Pipeline-Tick synchron (Client-Polling / Autotest), Rest läuft im Hintergrund weiter
    const progressed = await processVideoStudioJob(env, jobId, helpers);
    if (ctx && ["queued", "running"].includes(progressed?.status)) {
      ctx.waitUntil(runVideoStudioPipelineLoop(env, jobId, helpers, { maxTicks: 20 }).catch(() => {}));
    }
    const job = await readJob(env, jobId);
    return json({ ok: true, job: publicJob(job || progressed) }, cors);
  }

  return json({ ok: false, error: "Video-Studio Route nicht gefunden" }, cors, 404);
}

async function serveSignedAsset(request, env, url, rest, cors) {
  const jobId = decodeURIComponent(rest.slice("/assets/".length).split("?")[0]);
  const key = url.searchParams.get("key") || "";
  const exp = url.searchParams.get("exp") || "";
  const sig = url.searchParams.get("sig") || "";
  const valid = await verifySignedAssetRequest(env, { jobId, key, exp, sig });
  if (!valid) return json({ ok: false, error: "Signatur ungültig oder abgelaufen" }, cors, 403);
  const object = await getVideoAsset(env, key);
  if (!object) return json({ ok: false, error: "Datei nicht gefunden" }, cors, 404);
  const headers = new Headers(cors || {});
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=60");
  headers.set("Content-Disposition", `inline; filename="${key.split("/").pop() || "asset.bin"}"`);
  return new Response(object.body, { status: 200, headers });
}

export async function resumeStuckVideoStudioJobs(env, helpers = {}) {
  const jobs = await listJobs(env, 20);
  const stuck = jobs.filter((job) => job.status === "running" || job.status === "queued");
  const results = [];
  for (const job of stuck.slice(0, 3)) {
    try {
      results.push(await runVideoStudioPipelineLoop(env, job.id, helpers, { maxTicks: 12, delayMs: 2000 }));
    } catch (error) {
      results.push({ id: job.id, status: "failed", message: error.message || String(error) });
    }
  }
  return { processed: results.length, results };
}
