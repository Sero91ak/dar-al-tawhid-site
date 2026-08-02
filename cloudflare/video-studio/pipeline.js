import { normalizeBudget, assertWithinBudget } from "./budget.js";
import { composeFinalVideo, isComposerConfigured } from "./compose.js";
import { saveJob, readJob, addMonthSpend, readMonthSpend, readUsedStatementIds, markStatementUsed } from "./job-store.js";
import { chooseProvider } from "./providers/index.js";
import { DAR_VIDEO_PROFILE, PIPELINE_STAGES, emptyQualityChecks } from "./profile.js";
import { runQualityChecks } from "./quality.js";
import { selectStatement } from "./statements.js";
import { createSignedAssetUrl, putVideoAsset, hasVideoStudioR2 } from "./storage.js";
import { buildStoryboard } from "./storyboard.js";
import { isVoiceConfigured, synthesizeDarVoice } from "./voice.js";

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function nowIso() {
  return new Date().toISOString();
}

function newJobId() {
  return `video_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    completedStages: job.completedStages || [],
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    message: job.message || "",
    provider: job.provider || null,
    costEur: job.costEur || 0,
    estimateEur: job.estimateEur || 0,
    durationSeconds: job.durationSeconds || null,
    outputUrl: job.outputUrl || null,
    posterUrl: job.posterUrl || null,
    qualityChecks: job.qualityChecks || emptyQualityChecks(),
    approval: job.approval || { approved: false },
    statement: job.statement
      ? {
          id: job.statement.id,
          speaker: job.statement.speaker,
          de: job.statement.de,
          source: job.statement.source,
          topic: job.statement.topic
        }
      : null,
    setup: job.setup || null
  };
}

async function patchJob(env, id, patch) {
  const current = (await readJob(env, id)) || { id };
  const next = {
    ...current,
    ...patch,
    id,
    updatedAt: nowIso()
  };
  await saveJob(env, next);
  return next;
}

function markStage(job, stage) {
  const completed = new Set(job.completedStages || []);
  const idx = PIPELINE_STAGES.indexOf(stage);
  for (let i = 0; i < idx; i++) completed.add(PIPELINE_STAGES[i]);
  return {
    stage,
    completedStages: [...completed]
  };
}

export async function createVideoStudioJob(env, input = {}, helpers = {}, ctx = null) {
  const budget = normalizeBudget(input.budget || {});
  const mode = String(input.mode || "auto");
  const brief = String(input.brief || "").trim();
  const id = newJobId();

  const setup = collectSetupGaps(env);
  const job = {
    id,
    status: setup.length ? "setup_required" : "queued",
    stage: "statement",
    completedStages: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    brief,
    mode,
    voiceProfile: String(input.voiceProfile || "dar-male"),
    budget,
    profile: String(input.profile || DAR_VIDEO_PROFILE.id),
    format: "9:16",
    manualApproval: input.manualApproval !== false,
    client: input.client || {},
    message: setup.length
      ? `Einrichtung nötig: ${setup.join(" · ")}`
      : "Auftrag in Warteschlange",
    setup: setup.length ? { missing: setup } : null,
    costEur: 0,
    qualityChecks: emptyQualityChecks(),
    approval: { approved: false },
    artifacts: {},
    providerJobs: []
  };

  await saveJob(env, job);

  if (!setup.length && ctx) {
    ctx.waitUntil(processVideoStudioJob(env, id, helpers).catch((error) => {
      console.error("video studio job failed", id, error?.message || error);
    }));
  }

  return { ok: true, job: publicJob(job) };
}

function collectSetupGaps(env) {
  const missing = [];
  if (!chooseProviderSyncConfigured(env)) missing.push("Video-Anbieter (FAL_KEY empfohlen)");
  if (!isVoiceConfigured(env)) missing.push("DAR-Stimme (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID)");
  if (!isComposerConfigured(env)) missing.push("Compose (SHOTSTACK_API_KEY oder FAL_KEY/ffmpeg)");
  if (!hasVideoStudioR2(env)) missing.push("R2 Binding VIDEO_STUDIO_R2");
  if (!env.VIDEO_STUDIO_STORE) missing.push("Durable Object VIDEO_STUDIO_STORE");
  return missing;
}

function chooseProviderSyncConfigured(env) {
  return Boolean(String(env.FAL_KEY || env.FAL_API_KEY || env.RUNWAY_API_KEY || "").trim());
}

export async function processVideoStudioJob(env, jobId, helpers = {}) {
  let job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  if (["completed", "cancelled"].includes(job.status)) return publicJob(job);
  if (job.status === "setup_required") return publicJob(job);

  job = await patchJob(env, jobId, { status: "running", message: "Produktion läuft" });

  try {
    // 1) Statement
    job = await patchJob(env, jobId, { ...markStage(job, "statement"), message: "Aussage wird gewählt und geprüft" });
    const usedIds = await readUsedStatementIds(env);
    const selected = await selectStatement(env, { brief: job.brief, usedIds }, helpers);
    if (!selected.ok) throw httpError(selected.reason || "Aussage fehlgeschlagen", 422);
    await markStatementUsed(env, selected.statement.id);
    job = await patchJob(env, jobId, {
      statement: selected.statement,
      completedStages: uniqueStages([...(job.completedStages || []), "statement"])
    });

    // 2) Storyboard
    job = await patchJob(env, jobId, { ...markStage(job, "storyboard"), message: "Storyboard wird erstellt" });
    const storyboard = buildStoryboard(selected.statement);
    job = await patchJob(env, jobId, {
      storyboard,
      completedStages: uniqueStages([...(job.completedStages || []), "storyboard"])
    });

    // Provider + budget gate before paid work
    const spentMonthEur = await readMonthSpend(env);
    const choice = await chooseProvider(env, {
      mode: job.mode,
      scenes: storyboard.scenes,
      maxPerVideoEur: job.budget.maxPerVideoEur
    });
    if (!choice.ok) {
      const status = choice.setupRequired ? "setup_required" : "failed";
      return publicJob(await patchJob(env, jobId, { status, message: choice.message, setup: choice.setupRequired ? { missing: [choice.message] } : null }));
    }
    const budgetGate = assertWithinBudget({
      estimateEur: choice.estimateEur,
      spentMonthEur,
      budget: job.budget
    });
    if (!budgetGate.ok) {
      return publicJob(await patchJob(env, jobId, { status: "failed", message: budgetGate.message }));
    }
    job = await patchJob(env, jobId, {
      provider: choice.provider.id,
      estimateEur: choice.estimateEur
    });

    // 3) References (prompt-locked character bible; no separate paid image required)
    job = await patchJob(env, jobId, { ...markStage(job, "references"), message: "Referenzprofil für anonyme Figuren gesetzt" });
    const references = {
      characterBible: "anonymous modest figure, consistent robe palette charcoal/cream, always back-facing or silhouetted",
      roomPalette: "warm dawn light, wooden textures, soft dust",
      locked: true
    };
    job = await patchJob(env, jobId, {
      references,
      completedStages: uniqueStages([...(job.completedStages || []), "references"])
    });

    // 4) Clips
    job = await patchJob(env, jobId, { ...markStage(job, "clips"), message: "Videoclips werden erzeugt" });
    const clips = [];
    let clipCost = 0;
    for (const scene of storyboard.scenes) {
      const created = await choice.provider.createClip(env, { scene });
      let final = created;
      const providerJobId = created.providerJobId;
      if (providerJobId) {
        for (let attempt = 0; attempt < 40; attempt++) {
          await sleep(3000);
          const st = await choice.provider.getStatus(env, providerJobId, created.modelPath);
          if (st.status === "completed") {
            const downloaded = await choice.provider.downloadResult(env, providerJobId, created.modelPath);
            const key = `jobs/${jobId}/clips/${scene.id}.mp4`;
            await putVideoAsset(env, key, downloaded.bytes, downloaded.contentType || "video/mp4");
            final = {
              ...created,
              sceneId: scene.id,
              url: downloaded.url,
              r2Key: key,
              durationSec: scene.durationSec,
              status: "completed"
            };
            break;
          }
          if (st.status === "failed") throw httpError(st.reason || `Clip ${scene.id} fehlgeschlagen`, 502);
        }
        if (final.status !== "completed" && !final.r2Key) {
          throw httpError(`Clip ${scene.id} Zeitüberschreitung`, 504);
        }
      }
      clipCost += Number(final.estimatedCostEur || 0);
      clips.push(final);
      job = await patchJob(env, jobId, { artifacts: { ...(job.artifacts || {}), clips } });
    }
    job = await patchJob(env, jobId, {
      artifacts: { ...(job.artifacts || {}), clips },
      completedStages: uniqueStages([...(job.completedStages || []), "clips"]),
      costEur: Number((clipCost).toFixed(4))
    });

    // 5) Voice
    job = await patchJob(env, jobId, { ...markStage(job, "voice"), message: "DAR-Männerstimme wird erzeugt" });
    const voice = await synthesizeDarVoice(env, storyboard.voiceScript);
    if (!voice.ok) throw httpError(voice.reason || "Stimme fehlgeschlagen", voice.setupRequired ? 503 : 502);
    const voiceKey = `jobs/${jobId}/voice/dar-male.mp3`;
    await putVideoAsset(env, voiceKey, voice.bytes, voice.contentType || "audio/mpeg");
    // Temporary public-ish URL for compose providers that need HTTP access: signed worker URL later; for now use data upload via R2 public if configured
    const voiceSigned = await createSignedAssetUrl(env, { jobId, key: voiceKey, ttlSec: 3600 });
    job = await patchJob(env, jobId, {
      artifacts: {
        ...(job.artifacts || {}),
        voice: { r2Key: voiceKey, bytes: voice.bytes.byteLength, ok: true, url: voiceSigned.url || null }
      },
      costEur: Number((Number(job.costEur || 0) + Number(voice.estimatedCostEur || 0)).toFixed(4)),
      completedStages: uniqueStages([...(job.completedStages || []), "voice"])
    });

    // 6) Captions prepared
    job = await patchJob(env, jobId, {
      ...markStage(job, "captions"),
      message: "Untertitel und Quellenzeilen gesetzt",
      completedStages: uniqueStages([...(job.completedStages || []), "captions"])
    });

    // 7) Render / compose
    job = await patchJob(env, jobId, { ...markStage(job, "render"), message: "Finales MP4 wird gerendert" });
    const clipUrls = clips.map((c) => c.url).filter(Boolean);
    if (clipUrls.length < 3) throw httpError("Zu wenige Clips für den Schnitt", 502);
    const compose = await composeFinalVideo(env, {
      clipUrls,
      voiceUrl: voiceSigned.url || clips[0]?.url,
      captionLines: storyboard.captionLines,
      logoUrl: String(env.VIDEO_STUDIO_LOGO_URL || "").trim() || undefined
    });
    if (!compose.ok) throw httpError(compose.reason || "Render fehlgeschlagen", compose.setupRequired ? 503 : 502);

    let render = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      render = await compose.poll();
      if (render.status === "completed" && render.ok !== false) break;
      if (render.status === "failed" || render.ok === false) throw httpError(render.reason || "Render fehlgeschlagen", 502);
      await sleep(5000);
    }
    if (!render || render.status !== "completed") throw httpError("Render Zeitüberschreitung", 504);

    const finalKey = `jobs/${jobId}/final/master.mp4`;
    await putVideoAsset(env, finalKey, render.bytes, render.mime || "video/mp4");
    const outputSigned = await createSignedAssetUrl(env, { jobId, key: finalKey, ttlSec: 3600 });
    job = await patchJob(env, jobId, {
      artifacts: {
        ...(job.artifacts || {}),
        render: {
          r2Key: finalKey,
          mime: render.mime || "video/mp4",
          width: render.width || 1080,
          height: render.height || 1920,
          fps: render.fps || 30,
          ok: true,
          audioAttached: Boolean(render.audioAttached),
          hasMusic: Boolean(render.hasMusic)
        }
      },
      outputUrl: outputSigned.url || null,
      durationSeconds: storyboard.scenes.reduce((n, s) => n + Number(s.durationSec || 0), 0),
      completedStages: uniqueStages([...(job.completedStages || []), "render"])
    });

    // 8) Review
    job = await patchJob(env, jobId, { ...markStage(job, "review"), message: "Qualitätsprüfung läuft" });
    const fresh = await readJob(env, jobId);
    const quality = runQualityChecks({
      statement: fresh.statement,
      storyboard: fresh.storyboard,
      clips: fresh.artifacts?.clips || [],
      voice: { ok: true, bytes: voice.bytes.byteLength },
      render: fresh.artifacts?.render,
      providerMeta: { simulated: false }
    });
    if (!quality.ok) {
      return publicJob(await patchJob(env, jobId, {
        status: "failed",
        stage: "review",
        qualityChecks: quality.checks,
        message: `Qualitätsprüfung fehlgeschlagen: ${quality.reasons.join(" · ")}`
      }));
    }

    await addMonthSpend(env, Number(fresh.costEur || choice.estimateEur || 0));
    return publicJob(await patchJob(env, jobId, {
      status: "completed",
      stage: "review",
      completedStages: PIPELINE_STAGES.slice(),
      qualityChecks: quality.checks,
      message: "Video fertig – wartet auf manuelle Freigabe",
      costEur: Number(fresh.costEur || choice.estimateEur || 0)
    }));
  } catch (error) {
    const message = error?.message || String(error);
    return publicJob(await patchJob(env, jobId, {
      status: "failed",
      message,
      lastError: message
    }));
  }
}

function uniqueStages(list) {
  return [...new Set(list.filter(Boolean))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { publicJob };
