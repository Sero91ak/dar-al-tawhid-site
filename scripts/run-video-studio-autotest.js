#!/usr/bin/env node
/**
 * Autonomer Staging-Testauftrag für DAR KI-Video-Studio.
 * Nutzt VIDEO_STUDIO_TEST_TOKEN (Cloudflare Secret) – keine Provider-Keys im Repo.
 *
 * Usage:
 *   VIDEO_STUDIO_TEST_TOKEN=... node scripts/run-video-studio-autotest.js
 *   # oder Token aus .local/video-studio-test-token
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const workerBase = (
  process.env.VIDEO_STUDIO_WORKER_URL ||
  "https://dar-admin-publisher.sero91ak.workers.dev"
).replace(/\/$/, "");

function loadToken() {
  if (process.env.VIDEO_STUDIO_TEST_TOKEN) return process.env.VIDEO_STUDIO_TEST_TOKEN.trim();
  if (process.env.ADMIN_PUBLISH_SECRET) return process.env.ADMIN_PUBLISH_SECRET.trim();
  const localPath = path.join(root, ".local", "video-studio-test-token");
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, "utf8").trim();
  throw new Error("VIDEO_STUDIO_TEST_TOKEN fehlt (Env oder .local/video-studio-test-token)");
}

async function api(token, route, options = {}) {
  const res = await fetch(`${workerBase}/api/admin/video-studio${route}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Admin-Secret": token,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const token = loadToken();
  console.log("Worker:", workerBase);
  const status = await api(token, "/providers/status");
  console.log("Providers:", JSON.stringify(status, null, 2));

  if (!status.r2Configured || !status.voiceConfigured || !status.composerConfigured || !status.signingConfigured) {
    throw new Error("Setup unvollständig: " + JSON.stringify({
      r2: status.r2Configured,
      voice: status.voiceConfigured,
      composer: status.composerConfigured,
      signing: status.signingConfigured,
      shotstackStageOnly: status.shotstackStageOnly
    }));
  }
  if (status.shotstackStageOnly === false) {
    throw new Error("Shotstack Host ist nicht Stage – Abbruch zum Schutz vor Prod-Kosten");
  }
  if (status.probes?.fal && status.probes.fal.ok === false) {
    throw new Error(`FAL_KEY ungültig: ${status.probes.fal.reason || "auth failed"} (length=${status.probes.fal.length})`);
  }
  // ElevenLabs: warnen, aber nicht hart blockieren falls nur Voice-Probe strikt ist —
  // Stimme wird im Job selbst benötigt; bei 401 dann Job-Fehler.
  if (status.probes?.elevenlabs && status.probes.elevenlabs.ok === false) {
    console.warn("WARN ElevenLabs Probe:", status.probes.elevenlabs.reason || status.probes.elevenlabs.httpStatus);
  }
  if (status.probes?.shotstack && status.probes.shotstack.ok === false) {
    throw new Error(`SHOTSTACK_API_KEY ungültig: ${status.probes.shotstack.reason || "auth failed"}`);
  }

  const created = await api(token, "/jobs", {
    method: "POST",
    body: JSON.stringify({
      brief: "Wissen und Demut – autonomer Staging-Test",
      mode: "auto",
      voiceProfile: "dar-male",
      budget: { monthlyEur: 15, maxPerVideoEur: 1.2 },
      profile: "dar-standard-v1",
      format: "9:16",
      manualApproval: true,
      client: { source: "run-video-studio-autotest", viewport: "autotest" }
    })
  });

  let job = created.job;
  console.log("Job erstellt:", job.id, job.status, job.message);
  const started = Date.now();
  const maxMs = Number(process.env.VIDEO_STUDIO_AUTOTEST_TIMEOUT_MS || 25 * 60 * 1000);

  while (!["completed", "failed", "cancelled", "setup_required"].includes(job.status)) {
    if (Date.now() - started > maxMs) throw new Error(`Timeout nach ${maxMs}ms – letzter Status: ${job.status} ${job.stage} ${job.message}`);
    await sleep(5000);
    const tick = await api(token, `/jobs/${encodeURIComponent(job.id)}/process`, {
      method: "POST",
      body: "{}"
    });
    job = tick.job;
    console.log(
      `[${Math.round((Date.now() - started) / 1000)}s]`,
      job.status,
      job.stage,
      `cost=${Number(job.costEur || 0).toFixed(4)}€`,
      job.message || ""
    );
  }

  const report = {
    ok: job.status === "completed",
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    message: job.message,
    provider: job.provider,
    costEur: job.costEur,
    estimateEur: job.estimateEur,
    durationSeconds: job.durationSeconds,
    outputUrl: job.outputUrl,
    posterUrl: job.posterUrl,
    qualityChecks: job.qualityChecks,
    statement: job.statement,
    shotstackHost: status.shotstackHost,
    monthSpendEur: status.monthSpendEur,
    elapsedSec: Math.round((Date.now() - started) / 1000)
  };

  const outDir = path.join(root, ".local");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "video-studio-autotest-report.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log("Report:", outFile);
  console.log(JSON.stringify(report, null, 2));

  if (job.status !== "completed") {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("AUTOTEST FAILED:", error.message || error);
  if (error.data) console.error(JSON.stringify(error.data, null, 2));
  process.exit(1);
});
