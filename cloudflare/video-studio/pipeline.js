import { normalizeBudget, assertWithinBudget } from "./budget.js";
import { composeFinalVideo, isComposerConfigured, pollShotstackRender, pollFalMerge } from "./compose.js";
import { saveJob, readJob, addMonthSpend, readMonthSpend, readUsedStatementIds, markStatementUsed } from "./job-store.js";
import { chooseProvider, getProviderByMode } from "./providers/index.js";
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
    setup: job.setup || null,
    staging: true,
    noVisitorPush: true
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

function uniqueStages(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function collectSetupGaps(env) {
  const missing = [];
  if (!String(env.FAL_KEY || env.FAL_API_KEY || env.RUNWAY_API_KEY || "").trim()) {
    missing.push("Video-Anbieter (FAL_KEY empfohlen)");
  }
  if (!isVoiceConfigured(env)) missing.push("DAR-Stimme (ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID)");
  if (!isComposerConfigured(env)) missing.push("Compose (SHOTSTACK_API_KEY Stage empfohlen)");
  if (!hasVideoStudioR2(env)) missing.push("R2 Binding VIDEO_STUDIO_R2");
  if (!env.VIDEO_STUDIO_STORE) missing.push("Durable Object VIDEO_STUDIO_STORE");
  if (!String(env.VIDEO_STUDIO_SIGNING_SECRET || env.ADMIN_PUBLISH_SECRET || "").trim()) {
    missing.push("VIDEO_STUDIO_SIGNING_SECRET");
  }
  return missing;
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
    providerJobs: [],
    tick: 0
  };

  await saveJob(env, job);
  if (!setup.length && ctx) {
    ctx.waitUntil(runVideoStudioPipelineLoop(env, id, helpers).catch((error) => {
      console.error("video studio job failed", id, error?.message || error);
    }));
  }
  return { ok: true, job: publicJob(job) };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Mehrere Pipeline-Ticks hintereinander (Worker waitUntil / Cron). */
export async function runVideoStudioPipelineLoop(env, jobId, helpers = {}, { maxTicks = 36, delayMs = 2800 } = {}) {
  let last = null;
  for (let i = 0; i < maxTicks; i++) {
    last = await processVideoStudioJob(env, jobId, helpers);
    if (["completed", "failed", "cancelled", "setup_required"].includes(last?.status)) return last;
    await sleep(delayMs);
  }
  return last;
}

/**
 * Fortsetzbare Pipeline: jeder Aufruf macht begrenzte Arbeit und speichert Zwischenstand.
 * Cron / erneute API-Aufrufe setzen fort, bis completed/failed.
 */
export async function processVideoStudioJob(env, jobId, helpers = {}) {
  let job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  if (["completed", "cancelled", "setup_required"].includes(job.status)) return publicJob(job);

  const setup = collectSetupGaps(env);
  if (setup.length) {
    return publicJob(await patchJob(env, jobId, {
      status: "setup_required",
      message: `Einrichtung nötig: ${setup.join(" · ")}`,
      setup: { missing: setup }
    }));
  }

  job = await patchJob(env, jobId, {
    status: "running",
    tick: Number(job.tick || 0) + 1,
    message: "Produktion läuft (Hintergrund)"
  });

  try {
    // 1) Statement
    if (!job.statement) {
      const usedIds = await readUsedStatementIds(env);
      const selected = await selectStatement(env, { brief: job.brief, usedIds }, helpers);
      if (!selected.ok) throw httpError(selected.reason || "Aussage fehlgeschlagen", 422);
      await markStatementUsed(env, selected.statement.id);
      job = await patchJob(env, jobId, {
        stage: "statement",
        statement: selected.statement,
        completedStages: uniqueStages([...(job.completedStages || []), "statement"]),
        message: "Aussage geprüft"
      });
    }

    // 2) Storyboard
    if (!job.storyboard) {
      const storyboard = buildStoryboard(job.statement);
      // 3 Szenen für Budget-/Laufzeitkontrolle (~15 s Clips)
      storyboard.scenes = storyboard.scenes.slice(0, 3);
      const spentMonthEur = await readMonthSpend(env);
      const choice = await chooseProvider(env, {
        mode: job.mode,
        scenes: storyboard.scenes,
        maxPerVideoEur: job.budget.maxPerVideoEur
      });
      if (!choice.ok) {
        return publicJob(await patchJob(env, jobId, {
          status: choice.setupRequired ? "setup_required" : "failed",
          message: choice.message,
          setup: choice.setupRequired ? { missing: [choice.message] } : null
        }));
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
        stage: "storyboard",
        storyboard,
        provider: choice.provider.id,
        estimateEur: choice.estimateEur,
        completedStages: uniqueStages([...(job.completedStages || []), "statement", "storyboard"]),
        message: "Storyboard erstellt · Budget geprüft",
        artifacts: {
          ...(job.artifacts || {}),
          providerId: choice.provider.id
        }
      });
      return publicJob(job);
    }

    // 3) References
    if (!(job.completedStages || []).includes("references")) {
      job = await patchJob(env, jobId, {
        stage: "references",
        references: {
          characterBible: "anonymous modest figure, consistent robe palette charcoal/cream, always back-facing or silhouetted",
          roomPalette: "warm dawn light, wooden textures, soft dust",
          locked: true
        },
        completedStages: uniqueStages([...(job.completedStages || []), "references"]),
        message: "Referenzprofil gesetzt"
      });
      return publicJob(job);
    }

    // 4) Clips – start or poll one scene per tick
    const provider = getProviderByMode(job.artifacts?.providerId || job.provider || job.mode);
    if (!provider.isConfigured(env)) throw httpError("Anbieter nicht konfiguriert", 503);
    const scenes = job.storyboard.scenes || [];
    let clips = Array.isArray(job.artifacts?.clips) ? [...job.artifacts.clips] : [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      let clip = clips.find((c) => c.sceneId === scene.id);
      if (clip?.status === "completed" && (clip.url || clip.r2Key)) continue;

      if (!clip?.providerJobId) {
        const created = await provider.createClip(env, { scene });
        clip = {
          sceneId: scene.id,
          providerJobId: created.providerJobId,
          modelPath: created.modelPath || provider.modelPath,
          status: "running",
          estimatedCostEur: created.estimatedCostEur || 0,
          durationSec: created.durationSec || scene.durationSec || 5
        };
        clips = [...clips.filter((c) => c.sceneId !== scene.id), clip];
        job = await patchJob(env, jobId, {
          stage: "clips",
          artifacts: { ...(job.artifacts || {}), clips },
          message: `Clip ${i + 1}/${scenes.length} gestartet`
        });
        return publicJob(job);
      }

      const st = await provider.getStatus(env, clip.providerJobId, clip.modelPath || provider.modelPath);
      if (st.status === "running") {
        job = await patchJob(env, jobId, {
          stage: "clips",
          artifacts: { ...(job.artifacts || {}), clips },
          message: `Clip ${i + 1}/${scenes.length} wird gerendert`
        });
        return publicJob(job);
      }
      if (st.status === "failed") throw httpError(st.reason || `Clip ${scene.id} fehlgeschlagen`, 502);

      const downloaded = await provider.downloadResult(env, clip.providerJobId, clip.modelPath || provider.modelPath);
      const key = `jobs/${jobId}/clips/${scene.id}.mp4`;
      await putVideoAsset(env, key, downloaded.bytes, downloaded.contentType || "video/mp4");
      clip = {
        ...clip,
        status: "completed",
        url: downloaded.url,
        r2Key: key,
        bytes: downloaded.bytes.byteLength
      };
      clips = [...clips.filter((c) => c.sceneId !== scene.id), clip];
      const clipCost = clips.reduce((n, c) => n + Number(c.estimatedCostEur || 0), 0);
      job = await patchJob(env, jobId, {
        stage: "clips",
        artifacts: { ...(job.artifacts || {}), clips },
        costEur: Number(clipCost.toFixed(4)),
        message: `Clip ${i + 1}/${scenes.length} gespeichert`
      });
      return publicJob(job);
    }

    if (!(job.completedStages || []).includes("clips")) {
      job = await patchJob(env, jobId, {
        completedStages: uniqueStages([...(job.completedStages || []), "clips"]),
        message: "Alle Clips fertig"
      });
    }

    // 5) Voice
    if (!job.artifacts?.voice?.r2Key) {
      job = await patchJob(env, jobId, { stage: "voice", message: "DAR-Männerstimme wird erzeugt" });
      const voice = await synthesizeDarVoice(env, job.storyboard.voiceScript);
      if (!voice.ok) throw httpError(voice.reason || "Stimme fehlgeschlagen", voice.setupRequired ? 503 : 502);
      const voiceKey = `jobs/${jobId}/voice/dar-male.mp3`;
      await putVideoAsset(env, voiceKey, voice.bytes, voice.contentType || "audio/mpeg");
      const voiceSigned = await createSignedAssetUrl(env, { jobId, key: voiceKey, ttlSec: 7200 });
      job = await patchJob(env, jobId, {
        artifacts: {
          ...(job.artifacts || {}),
          voice: {
            r2Key: voiceKey,
            bytes: voice.bytes.byteLength,
            ok: true,
            url: voiceSigned.url || null
          }
        },
        costEur: Number((Number(job.costEur || 0) + Number(voice.estimatedCostEur || 0)).toFixed(4)),
        completedStages: uniqueStages([...(job.completedStages || []), "voice"]),
        message: "Stimme gespeichert"
      });
      return publicJob(job);
    }

    // 6) Captions prepared
    if (!(job.completedStages || []).includes("captions")) {
      job = await patchJob(env, jobId, {
        stage: "captions",
        completedStages: uniqueStages([...(job.completedStages || []), "captions"]),
        message: "Untertitel und Quellenzeilen gesetzt"
      });
      return publicJob(job);
    }

    // 7) Render / compose (Shotstack Stage bevorzugt; Clips/Stimme über signierte R2-URLs)
    if (!job.artifacts?.render?.r2Key) {
      const clipUrls = [];
      for (const clip of job.artifacts?.clips || []) {
        if (clip?.r2Key) {
          const signed = await createSignedAssetUrl(env, { jobId, key: clip.r2Key, ttlSec: 7200 });
          if (signed.ok && signed.url) clipUrls.push(signed.url);
          else if (clip.url) clipUrls.push(clip.url);
        } else if (clip?.url) {
          clipUrls.push(clip.url);
        }
      }
      if (clipUrls.length < 3) throw httpError("Zu wenige Clips für den Schnitt", 502);

      let voiceUrl = job.artifacts?.voice?.url || "";
      if (job.artifacts?.voice?.r2Key) {
        const voiceSigned = await createSignedAssetUrl(env, {
          jobId,
          key: job.artifacts.voice.r2Key,
          ttlSec: 7200
        });
        if (voiceSigned.ok && voiceSigned.url) voiceUrl = voiceSigned.url;
      }

      if (!job.artifacts?.render?.renderId) {
        job = await patchJob(env, jobId, { stage: "render", message: "Shotstack Stage-Render gestartet" });
        const compose = await composeFinalVideo(env, {
          clipUrls,
          voiceUrl: voiceUrl || clipUrls[0],
          captionLines: job.storyboard.captionLines,
          logoUrl: String(env.VIDEO_STUDIO_LOGO_URL || "").trim() || undefined
        });
        if (!compose.ok) throw httpError(compose.reason || "Render fehlgeschlagen", compose.setupRequired ? 503 : 502);
        job = await patchJob(env, jobId, {
          artifacts: {
            ...(job.artifacts || {}),
            render: {
              provider: compose.provider,
              renderId: compose.renderId,
              status: "running"
            }
          },
          message: compose.provider === "shotstack"
            ? "Render läuft (Shotstack Stage)"
            : "Render läuft (fal ffmpeg Fallback)"
        });
        return publicJob(job);
      }

      const renderState = await pollCompose(env, job.artifacts.render);
      if (renderState.status === "running") {
        job = await patchJob(env, jobId, {
          stage: "render",
          message: "Finales MP4 wird gerendert"
        });
        return publicJob(job);
      }
      if (renderState.status === "failed" || renderState.ok === false) {
        throw httpError(renderState.reason || "Render fehlgeschlagen", 502);
      }

      const finalKey = `jobs/${jobId}/final/master.mp4`;
      await putVideoAsset(env, finalKey, renderState.bytes, renderState.mime || "video/mp4");
      const outputSigned = await createSignedAssetUrl(env, { jobId, key: finalKey, ttlSec: 7200 });
      const posterKey = `jobs/${jobId}/final/poster.jpg`;
      // Poster optional – use first clip URL metadata placeholder
      job = await patchJob(env, jobId, {
        artifacts: {
          ...(job.artifacts || {}),
          render: {
            r2Key: finalKey,
            posterKey,
            mime: renderState.mime || "video/mp4",
            width: renderState.width || 1080,
            height: renderState.height || 1920,
            fps: renderState.fps || 30,
            ok: true,
            audioAttached: Boolean(renderState.audioAttached),
            hasMusic: Boolean(renderState.hasMusic),
            status: "completed"
          }
        },
        outputUrl: outputSigned.url || null,
        posterUrl: (job.artifacts?.clips || [])[0]?.url || null,
        durationSeconds: (job.storyboard.scenes || []).reduce((n, s) => n + Number(s.durationSec || 0), 0),
        completedStages: uniqueStages([...(job.completedStages || []), "render"]),
        message: "MP4 gespeichert"
      });
      return publicJob(job);
    }

    // 8) Review
    job = await patchJob(env, jobId, { stage: "review", message: "Qualitätsprüfung" });
    const fresh = await readJob(env, jobId);
    const quality = runQualityChecks({
      statement: fresh.statement,
      storyboard: fresh.storyboard,
      clips: fresh.artifacts?.clips || [],
      voice: { ok: true, bytes: fresh.artifacts?.voice?.bytes || 0 },
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

    await addMonthSpend(env, Number(fresh.costEur || fresh.estimateEur || 0));
    return publicJob(await patchJob(env, jobId, {
      status: "completed",
      stage: "review",
      completedStages: PIPELINE_STAGES.slice(),
      qualityChecks: quality.checks,
      message: "Video fertig – nur Admin-Vorschau, keine Besucher-Veröffentlichung",
      costEur: Number(fresh.costEur || fresh.estimateEur || 0)
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

async function pollCompose(env, renderMeta) {
  if (renderMeta.provider === "shotstack") {
    return pollShotstackRender(env, renderMeta.renderId);
  }
  return pollFalMerge(env, renderMeta.renderId);
}

export { publicJob, collectSetupGaps };
