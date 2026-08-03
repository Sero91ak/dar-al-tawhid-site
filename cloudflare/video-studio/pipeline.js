import { normalizeBudget, assertWithinBudget } from "./budget.js";
import { composeFinalVideo, isComposerConfigured, pollShotstackRender } from "./compose.js";
import { saveJob, readJob, addMonthSpend, readMonthSpend, readUsedStatementIds, markStatementUsed } from "./job-store.js";
import { DAR_VIDEO_PROFILE, PIPELINE_STAGES, PIPELINE_STAGE_LABELS, emptyQualityChecks } from "./profile.js";
import { runQualityChecks } from "./quality.js";
import { selectStatement } from "./statements.js";
import { createSignedAssetUrl, putVideoAsset, hasVideoStudioR2 } from "./storage.js";
import { buildStoryboard, buildCaptionPlan } from "./storyboard.js";
import { estimateVoiceDurationSec, computeSpeechImageDurationSec } from "./timeline.js";
import { isVoiceConfigured, synthesizeDarVoice } from "./voice.js";
import { parseContributionText, estimateVideoCost } from "./text-parse.js";

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
    mode: job.mode || "speech-image",
    productName: job.productName || DAR_VIDEO_PROFILE.productName || "Sprach-Bildbeitrag",
    costEur: job.costEur || 0,
    estimateEur: job.estimateEur || 0,
    durationSeconds: job.durationSeconds || null,
    outputUrl: job.outputUrl || null,
    posterUrl: job.posterUrl || null,
    sceneImageUrl: job.sceneImageUrl || job.artifacts?.sceneImage?.url || null,
    costBreakdown: job.costBreakdown || null,
    costConfirmed: Boolean(job.costConfirmed),
    voiceApproved: Boolean(job.voiceApproved),
    designConfirmed: Boolean(job.designConfirmed),
    awaitingVoiceApproval: job.status === "awaiting_voice_approval",
    awaitingDesign: job.status === "awaiting_design",
    voiceUrl: job.artifacts?.voice?.url || null,
    voiceDurationSec: job.artifacts?.voice?.durationSec || null,
    design: job.design || null,
    qualityChecks: job.qualityChecks || emptyQualityChecks(),
    qualityIncomplete: Boolean(job.qualityIncomplete),
    validation: job.validation || null,
    previewFrames: job.previewFrames || [2, 6, 11, 14],
    hasEditorProject: Boolean(job.editorProject?.id),
    approval: job.approval || { approved: false },
    statement: job.statement
      ? {
          id: job.statement.id,
          speaker: job.statement.speaker,
          de: job.statement.de,
          source: job.statement.source,
          topic: job.statement.topic,
          fazit: job.statement.fazit || "",
          cta: job.statement.cta || "",
          manual: Boolean(job.statement.manual)
        }
      : null,
    contributionText: job.contributionText || job.statement?.raw || null,
    setup: job.setup || null,
    composePreview: job.composePreview === true,
    renderMeta: job.artifacts?.render
      ? {
          shotstackEnv: job.artifacts.render.shotstackEnv || null,
          foreignWatermarkRisk: Boolean(job.artifacts.render.foreignWatermarkRisk),
          brandingApplied: Boolean(job.artifacts.render.brandingApplied),
          isPreview: Boolean(job.artifacts.render.isPreview)
        }
      : null,
    staging: true,
    noVisitorPush: true,
    noAutoFeedPublish: true,
    publication: job.publication || null
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

function normalizeDesign(input = {}) {
  const brand = DAR_VIDEO_PROFILE.branding;
  return {
    textScale: Math.min(1.2, Math.max(0.85, Number(input.textScale) || 1)),
    watermarkOpacity: Math.min(0.08, Math.max(0.05, Number(input.watermarkOpacity) || Number(brand.watermarkOpacity) || 0.065)),
    watermarkScale: Math.min(0.38, Math.max(0.3, Number(input.watermarkScale) || Number(brand.watermarkScale) || 0.34)),
    dimOpacity: Math.min(0.45, Math.max(0.08, Number(input.dimOpacity) || 0.18)),
    layoutVariant: String(input.layoutVariant || "classic").trim() || "classic"
  };
}

/** Legacy + aktuelle Stufen für alte Jobs und UI-Kompatibilität */
function allCompletedStages(extra = []) {
  return uniqueStages([
    ...PIPELINE_STAGES,
    "storyboard",
    "references",
    "clips",
    "captions",
    ...extra
  ]);
}

async function resolveSceneImageUrl(env, job, jobId) {
  let sceneImageUrl = job.sceneImageUrl || job.artifacts?.sceneImage?.url || "";
  if (!sceneImageUrl && job.artifacts?.sceneImage?.r2Key) {
    const signed = await createSignedAssetUrl(env, {
      jobId,
      key: job.artifacts.sceneImage.r2Key,
      ttlSec: 7200
    });
    if (signed.ok) sceneImageUrl = signed.url;
  }
  return sceneImageUrl || "";
}

function collectSetupGaps(env) {
  const missing = [];
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
  const mode = String(input.mode || "speech-image");
  const brief = String(input.brief || "").trim();
  const contributionText = String(input.contributionText || input.text || "").trim();
  const id = newJobId();
  const setup = collectSetupGaps(env);

  let statement = null;
  if (input.statement && typeof input.statement === "object") {
    statement = {
      ...input.statement,
      de: String(input.statement.de || "").trim(),
      speaker: String(input.statement.speaker || "Überlieferung").trim(),
      source: String(input.statement.source || "").trim(),
      topic: String(input.statement.topic || "Wissen").trim(),
      verified: true,
      manual: true
    };
  } else if (contributionText) {
    const parsed = parseContributionText(contributionText);
    if (!parsed.ok) throw httpError(parsed.reason || "Text ungültig", 422);
    statement = parsed.statement;
  }

  const sceneImageUrl = String(input.sceneImageUrl || "").trim();
  const sceneImageR2Key = String(input.sceneImageR2Key || "").trim();
  if (!setup.length && !sceneImageUrl && !sceneImageR2Key) {
    throw httpError("Szenenbild fehlt – bitte zuerst erzeugen oder auswählen", 422);
  }
  if (!setup.length && input.costConfirmed !== true) {
    throw httpError("Kostenbestätigung fehlt (costConfirmed:true)", 422);
  }

  const voiceSeed = String(statement?.de || contributionText || brief);
  const roughVoiceDur = estimateVoiceDurationSec(voiceSeed);
  const durationSec = computeSpeechImageDurationSec(roughVoiceDur);
  const costPreview = estimateVideoCost({
    voiceChars: voiceSeed.length + 120,
    durationSec
  });

  const job = {
    id,
    status: setup.length ? "setup_required" : "queued",
    stage: "statement",
    completedStages: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    brief: brief || contributionText.slice(0, 180),
    contributionText,
    mode,
    productName: DAR_VIDEO_PROFILE.productName || "Sprach-Bildbeitrag",
    voiceProfile: String(input.voiceProfile || "dar-male"),
    budget,
    profile: String(input.profile || DAR_VIDEO_PROFILE.id),
    format: "9:16",
    manualApproval: input.manualApproval !== false,
    composePreview: input.composePreview === true,
    pauseAfterVoice: input.pauseAfterVoice !== false,
    voiceApproved: input.voiceApproved === true,
    designConfirmed: input.designConfirmed === true,
    design: normalizeDesign(input.design),
    costConfirmed: input.costConfirmed === true,
    costBreakdown: costPreview,
    sceneImageUrl: sceneImageUrl || null,
    client: input.client || {},
    message: setup.length
      ? `Einrichtung nötig: ${setup.join(" · ")}`
      : "Sprach-Bildbeitrag in Warteschlange",
    setup: setup.length ? { missing: setup } : null,
    costEur: 0,
    estimateEur: costPreview.estimateMaxEur,
    durationSeconds: durationSec,
    qualityChecks: emptyQualityChecks(),
    approval: { approved: false },
    statement: statement || null,
    artifacts: {
      sceneImage: sceneImageUrl || sceneImageR2Key
        ? { url: sceneImageUrl || null, r2Key: sceneImageR2Key || null }
        : null
    },
    providerJobs: [],
    tick: 0
  };

  await saveJob(env, job);
  if (!setup.length && ctx) {
    ctx.waitUntil(runVideoStudioPipelineLoop(env, id, helpers).catch((error) => {
      console.error("video studio job failed", id, error?.message || error);
    }));
  }
  return { ok: true, job: publicJob(job), estimate: costPreview };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Mehrere Pipeline-Ticks hintereinander (Worker waitUntil / Cron). */
export async function runVideoStudioPipelineLoop(env, jobId, helpers = {}, { maxTicks = 36, delayMs = 2800 } = {}) {
  let last = null;
  for (let i = 0; i < maxTicks; i++) {
    last = await processVideoStudioJob(env, jobId, helpers);
    if (
      [
        "completed",
        "failed",
        "cancelled",
        "setup_required",
        "awaiting_voice_approval",
        "awaiting_design"
      ].includes(last?.status)
    ) {
      return last;
    }
    await sleep(delayMs);
  }
  return last;
}

/**
 * Fortsetzbare Pipeline: Sprach-Bildbeitrag (Standbild + Stimme + Gestaltung).
 * Cron / erneute API-Aufrufe setzen fort, bis completed/failed.
 */
export async function processVideoStudioJob(env, jobId, helpers = {}) {
  let job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  if (["completed", "cancelled", "setup_required", "awaiting_voice_approval", "awaiting_design"].includes(job.status)) {
    return publicJob(job);
  }

  const setup = collectSetupGaps(env);
  if (setup.length) {
    return publicJob(await patchJob(env, jobId, {
      status: "setup_required",
      message: `Einrichtung nötig: ${setup.join(" · ")}`,
      setup: { missing: setup }
    }));
  }

  // Fehlgeschlagener Render ohne MP4 verwerfen, damit Resume neu submitten kann
  if (
    job.status === "failed" &&
    job.artifacts?.render?.renderId &&
    !job.artifacts?.render?.r2Key
  ) {
    job = await patchJob(env, jobId, {
      artifacts: {
        ...(job.artifacts || {}),
        render: null
      },
      message: "Render wird neu gestartet"
    });
  }

  job = await patchJob(env, jobId, {
    status: "running",
    tick: Number(job.tick || 0) + 1,
    message: "Sprach-Bildbeitrag wird erzeugt"
  });

  try {
    // 1) Statement
    if (!job.statement) {
      if (job.contributionText) {
        const parsed = parseContributionText(job.contributionText);
        if (!parsed.ok) throw httpError(parsed.reason || "Aussage fehlgeschlagen", 422);
        job = await patchJob(env, jobId, {
          stage: "statement",
          statement: parsed.statement,
          completedStages: uniqueStages([...(job.completedStages || []), "statement"]),
          message: PIPELINE_STAGE_LABELS.statement
        });
      } else {
        const usedIds = await readUsedStatementIds(env);
        const selected = await selectStatement(env, { brief: job.brief, usedIds }, helpers);
        if (!selected.ok) throw httpError(selected.reason || "Aussage fehlgeschlagen", 422);
        await markStatementUsed(env, selected.statement.id);
        job = await patchJob(env, jobId, {
          stage: "statement",
          statement: selected.statement,
          completedStages: uniqueStages([...(job.completedStages || []), "statement"]),
          message: PIPELINE_STAGE_LABELS.statement
        });
      }
    } else if (!(job.completedStages || []).includes("statement")) {
      job = await patchJob(env, jobId, {
        stage: "statement",
        completedStages: uniqueStages([...(job.completedStages || []), "statement"]),
        message: PIPELINE_STAGE_LABELS.statement
      });
    }

    // 2) Plan / Storyboard (kein Provider, kein Clip-Budget)
    if (!job.storyboard) {
      const sceneImageUrl = await resolveSceneImageUrl(env, job, jobId);
      const storyboard = buildStoryboard(job.statement, { sceneImageUrl });
      const voiceChars = String(storyboard.voiceScript || job.statement?.de || "").length + 40;
      const costPreview = estimateVideoCost({
        voiceChars,
        durationSec: storyboard.durationSec || computeSpeechImageDurationSec(
          estimateVoiceDurationSec(storyboard.voiceScript || "")
        )
      });
      const spentMonthEur = await readMonthSpend(env);
      const budgetGate = assertWithinBudget({
        estimateEur: costPreview.estimateMaxEur,
        spentMonthEur,
        budget: job.budget
      });
      if (!budgetGate.ok) {
        return publicJob(await patchJob(env, jobId, { status: "failed", message: budgetGate.message }));
      }
      job = await patchJob(env, jobId, {
        stage: "statement",
        storyboard,
        sceneImageUrl: sceneImageUrl || job.sceneImageUrl || null,
        estimateEur: costPreview.estimateMaxEur,
        costBreakdown: costPreview,
        durationSeconds: storyboard.durationSec || null,
        completedStages: uniqueStages([...(job.completedStages || []), "statement", "storyboard"]),
        message: `${PIPELINE_STAGE_LABELS.statement} · Plan gespeichert`,
        artifacts: {
          ...(job.artifacts || {}),
          sceneImage: {
            ...(job.artifacts?.sceneImage || {}),
            url: sceneImageUrl || job.artifacts?.sceneImage?.url || null
          }
        }
      });
      return publicJob(job);
    }

    // 3) Bild vorbereitet (früher: references)
    if (
      !(job.completedStages || []).includes("image") &&
      !(job.completedStages || []).includes("references")
    ) {
      job = await patchJob(env, jobId, {
        stage: "image",
        references: {
          characterBible: "anonymous modest figure locked to scene still, always face-hidden",
          roomPalette: "locked to selected scene image",
          sceneImageUrl: job.sceneImageUrl || job.artifacts?.sceneImage?.url || null,
          locked: true
        },
        completedStages: uniqueStages([...(job.completedStages || []), "image", "references"]),
        message: PIPELINE_STAGE_LABELS.image
      });
      return publicJob(job);
    }

    // 4) Clips überspringen – kein generatives Video
    if (!(job.completedStages || []).includes("clips")) {
      job = await patchJob(env, jobId, {
        stage: "image",
        artifacts: {
          ...(job.artifacts || {}),
          clips: []
        },
        completedStages: uniqueStages([...(job.completedStages || []), "clips"]),
        message: "Keine generativen Clips – Sprach-Bildbeitrag nutzt nur das Standbild"
      });
      return publicJob(job);
    }

    // 5) Voice
    if (!job.artifacts?.voice?.r2Key) {
      job = await patchJob(env, jobId, {
        stage: "voice",
        message: PIPELINE_STAGE_LABELS.voice
      });
      const voice = await synthesizeDarVoice(env, job.storyboard.voiceScript);
      if (!voice.ok) throw httpError(voice.reason || "Stimme fehlgeschlagen", voice.setupRequired ? 503 : 502);
      const voiceKey = `jobs/${jobId}/voice/dar-male.mp3`;
      await putVideoAsset(env, voiceKey, voice.bytes, voice.contentType || "audio/mpeg");
      const voiceSigned = await createSignedAssetUrl(env, { jobId, key: voiceKey, ttlSec: 7200 });
      const voiceDur = estimateVoiceDurationSec(job.storyboard.voiceScript);
      const captionPlan = buildCaptionPlan(job.statement, { voiceDurationSec: voiceDur });
      const nextStoryboard = {
        ...job.storyboard,
        captionPlan,
        captionLines: captionPlan.captionLines,
        durationSec: captionPlan.durationSec,
        voiceDurationSec: voiceDur,
        voiceScript: captionPlan.voiceScript || job.storyboard.voiceScript
      };
      job = await patchJob(env, jobId, {
        storyboard: nextStoryboard,
        durationSeconds: captionPlan.durationSec,
        artifacts: {
          ...(job.artifacts || {}),
          voice: {
            r2Key: voiceKey,
            bytes: voice.bytes.byteLength,
            ok: true,
            url: voiceSigned.url || null,
            durationSec: voiceDur,
            chars: voice.chars || 0,
            estimatedCostEur: voice.estimatedCostEur || 0
          },
          clips: []
        },
        costEur: Number((Number(job.costEur || 0) + Number(voice.estimatedCostEur || 0)).toFixed(4)),
        completedStages: uniqueStages([...(job.completedStages || []), "voice"]),
        status: job.voiceApproved || job.pauseAfterVoice === false ? "running" : "awaiting_voice_approval",
        message:
          job.voiceApproved || job.pauseAfterVoice === false
            ? "Stimme gespeichert"
            : PIPELINE_STAGE_LABELS.voice_pending
      });
      return publicJob(job);
    }

    if (!job.voiceApproved && job.pauseAfterVoice !== false) {
      return publicJob(await patchJob(env, jobId, {
        status: "awaiting_voice_approval",
        stage: "voice",
        message: PIPELINE_STAGE_LABELS.voice_pending
      }));
    }

    // 6) Layout / Gestaltung (früher: captions)
    if (
      !(job.completedStages || []).includes("layout") &&
      !(job.completedStages || []).includes("captions")
    ) {
      const voiceDur =
        Number(job.artifacts?.voice?.durationSec) > 0
          ? Number(job.artifacts.voice.durationSec)
          : estimateVoiceDurationSec(job.storyboard.voiceScript);
      const captionPlan = buildCaptionPlan(job.statement, { voiceDurationSec: voiceDur });
      const nextStoryboard = {
        ...job.storyboard,
        captionPlan,
        captionLines: captionPlan.captionLines,
        durationSec: captionPlan.durationSec,
        voiceDurationSec: voiceDur
      };
      job = await patchJob(env, jobId, {
        stage: "layout",
        storyboard: nextStoryboard,
        durationSeconds: captionPlan.durationSec,
        completedStages: uniqueStages([...(job.completedStages || []), "layout", "captions"]),
        status: job.designConfirmed ? "running" : "awaiting_design",
        message: job.designConfirmed ? PIPELINE_STAGE_LABELS.layout : PIPELINE_STAGE_LABELS.design_pending
      });
      return publicJob(job);
    }

    if (!job.designConfirmed) {
      return publicJob(await patchJob(env, jobId, {
        status: "awaiting_design",
        stage: "layout",
        message: PIPELINE_STAGE_LABELS.design_pending
      }));
    }

    // 7) Render – Standbild + Stimme + Ken Burns (Shotstack)
    if (!job.artifacts?.render?.r2Key) {
      const sceneImageUrl = await resolveSceneImageUrl(env, job, jobId);
      if (!sceneImageUrl) throw httpError("Ausgangsbild (sceneImageUrl) fehlt für den Render", 502);

      let voiceUrl = job.artifacts?.voice?.url || "";
      if (job.artifacts?.voice?.r2Key) {
        const voiceSigned = await createSignedAssetUrl(env, {
          jobId,
          key: job.artifacts.voice.r2Key,
          ttlSec: 7200
        });
        if (voiceSigned.ok && voiceSigned.url) voiceUrl = voiceSigned.url;
      }
      if (!voiceUrl) throw httpError("Stimme fehlt für den Render", 502);

      const wantFinal = job.composePreview !== true;
      const staleRender = job.artifacts?.render;
      const staleFailed =
        staleRender?.renderId &&
        !staleRender?.r2Key &&
        /Shotstack HTTP 403|Shotstack HTTP 401|Render fehlgeschlagen/i.test(
          String(job.message || job.lastError || "")
        );
      if (staleFailed) {
        job = await patchJob(env, jobId, {
          artifacts: {
            ...(job.artifacts || {}),
            render: null
          },
          message: "Render wird neu gestartet"
        });
      }
      if (!job.artifacts?.render?.renderId) {
        job = await patchJob(env, jobId, {
          stage: "render",
          message: wantFinal
            ? PIPELINE_STAGE_LABELS.render
            : "Interne Stage-Vorschau wird gerendert"
        });
        const compose = await composeFinalVideo(env, {
          sceneImageUrl,
          voiceUrl,
          captionPlan: job.storyboard?.captionPlan,
          durationSec: job.storyboard?.durationSec || job.durationSeconds,
          voiceStartSec: job.storyboard?.captionPlan?.voiceStart,
          kenBurns: "zoomIn",
          design: job.design || normalizeDesign({}),
          final: wantFinal
        });
        if (!compose.ok) throw httpError(compose.reason || "Render fehlgeschlagen", compose.setupRequired ? 503 : 502);
        job = await patchJob(env, jobId, {
          artifacts: {
            ...(job.artifacts || {}),
            render: {
              provider: compose.provider,
              renderId: compose.renderId,
              status: "running",
              statusUrl: compose.statusUrl || null,
              responseUrl: compose.responseUrl || null,
              voiceUrl: voiceUrl || null,
              shotstackEnv: compose.shotstackEnv || null,
              foreignWatermarkRisk: Boolean(compose.foreignWatermarkRisk),
              brandingApplied: Boolean(compose.brandingApplied),
              isPreview: Boolean(compose.isPreview || compose.shotstackEnv === "stage"),
              durationSeconds: compose.durationSeconds || job.storyboard?.durationSec || null
            }
          },
          message: compose.foreignWatermarkRisk
            ? "Render läuft (Stage – nur interne Vorschau)"
            : "Render läuft (Production / DAR-Branding)"
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
        await patchJob(env, jobId, {
          artifacts: {
            ...(job.artifacts || {}),
            render: null
          },
          message: renderState.reason || "Render fehlgeschlagen – erneut versuchen"
        });
        throw httpError(renderState.reason || "Render fehlgeschlagen", 502);
      }

      const finalKey = `jobs/${jobId}/final/master.mp4`;
      await putVideoAsset(env, finalKey, renderState.bytes, renderState.mime || "video/mp4");
      const outputSigned = await createSignedAssetUrl(env, { jobId, key: finalKey, ttlSec: 7200 });
      const posterKey = `jobs/${jobId}/final/poster.jpg`;
      const prevRender = job.artifacts?.render || {};
      const shotstackEnv =
        renderState.shotstackEnv ||
        prevRender.shotstackEnv ||
        (job.composePreview === true ? "stage" : "v1");
      const foreignWatermarkRisk = Boolean(
        renderState.foreignWatermarkRisk ??
        prevRender.foreignWatermarkRisk ??
        shotstackEnv === "stage"
      );
      const durationSeconds = Number(
        renderState.durationSeconds ||
        prevRender.durationSeconds ||
        job.storyboard?.durationSec ||
        job.durationSeconds ||
        15
      );
      job = await patchJob(env, jobId, {
        artifacts: {
          ...(job.artifacts || {}),
          render: {
            ...prevRender,
            provider: prevRender.provider || renderState.provider || "shotstack",
            renderId: prevRender.renderId || null,
            r2Key: finalKey,
            posterKey,
            mime: renderState.mime || "video/mp4",
            width: renderState.width || 1080,
            height: renderState.height || 1920,
            fps: renderState.fps || 30,
            ok: true,
            audioAttached: Boolean(renderState.audioAttached),
            hasMusic: Boolean(renderState.hasMusic),
            status: "completed",
            shotstackEnv,
            foreignWatermarkRisk,
            brandingApplied: Boolean(
              renderState.brandingApplied ??
              prevRender.brandingApplied ??
              (prevRender.provider === "shotstack" && shotstackEnv !== "stage")
            ),
            isPreview: shotstackEnv === "stage",
            durationSeconds
          }
        },
        outputUrl: outputSigned.url || null,
        posterUrl: sceneImageUrl || job.sceneImageUrl || null,
        durationSeconds,
        completedStages: uniqueStages([...(job.completedStages || []), "render"]),
        message: foreignWatermarkRisk
          ? "MP4-Vorschau gespeichert (Stage – Fremdwasserzeichen, nicht freigeben)"
          : "MP4 gespeichert (Production / DAR-Standard)"
      });
      return publicJob(job);
    }

    // 8) Review – Qualitätsprüfung Sprach-Bildbeitrag
    job = await patchJob(env, jobId, {
      stage: "review",
      message: PIPELINE_STAGE_LABELS.review
    });
    const fresh = await readJob(env, jobId);
    const sceneForQc =
      fresh.sceneImageUrl ||
      fresh.artifacts?.sceneImage?.url ||
      (await resolveSceneImageUrl(env, fresh, jobId));
    const quality = runQualityChecks({
      statement: fresh.statement,
      storyboard: fresh.storyboard,
      clips: [],
      sceneImageUrl: sceneForQc,
      voice: {
        ok: true,
        bytes: fresh.artifacts?.voice?.bytes || 0,
        script: fresh.storyboard?.voiceScript || "",
        durationSec: fresh.artifacts?.voice?.durationSec || null
      },
      render: fresh.artifacts?.render,
      captionPlan: fresh.storyboard?.captionPlan || null,
      providerMeta: {
        simulated: false,
        brandingApplied: Boolean(fresh.artifacts?.render?.brandingApplied),
        foreignWatermarkRisk: Boolean(fresh.artifacts?.render?.foreignWatermarkRisk),
        shotstackEnv: fresh.artifacts?.render?.shotstackEnv || null
      }
    });
    const draftPreview =
      Boolean(fresh.artifacts?.render?.r2Key) &&
      (Boolean(fresh.artifacts?.render?.isPreview) ||
        String(fresh.artifacts?.render?.shotstackEnv || "") === "stage");

    if (!quality.ok && !draftPreview) {
      return publicJob(await patchJob(env, jobId, {
        status: "failed",
        stage: "review",
        qualityChecks: quality.checks,
        message: `Qualitätsprüfung fehlgeschlagen: ${quality.reasons.join(" · ")}`
      }));
    }

    await addMonthSpend(env, Number(fresh.costEur || fresh.estimateEur || 0));
    const incompleteMsg = draftPreview
      ? quality.reasons?.length
        ? `Sprach-Bildbeitrag als Admin-Vorschau fertig – DAR-Standard noch offen: ${quality.reasons.slice(0, 3).join(" · ")}. Keine Freigabe/Feed/Push.`
        : "Sprach-Bildbeitrag als Admin-Vorschau fertig – Endfassung (Shotstack Production) noch nötig. Keine Freigabe/Feed/Push."
      : "Sprach-Bildbeitrag fertig – Vorschau/Download/Teilen möglich. Feed und Push nur manuell, nie automatisch.";
    return publicJob(await patchJob(env, jobId, {
      status: "completed",
      stage: "review",
      completedStages: allCompletedStages(fresh.completedStages || []),
      qualityChecks: quality.checks,
      qualityIncomplete: Boolean(draftPreview || !quality.ok),
      validation: quality.validation || null,
      previewFrames: quality.previewFrames || [2, 6, 11, 14],
      posterUrl: sceneForQc || fresh.posterUrl || null,
      durationSeconds:
        fresh.durationSeconds ||
        fresh.storyboard?.durationSec ||
        fresh.artifacts?.render?.durationSeconds ||
        null,
      message: incompleteMsg,
      costEur: Number(fresh.costEur || fresh.estimateEur || 0)
    }));
  } catch (error) {
    const message = error?.message || String(error);
    const clearRender = /Shotstack HTTP 403|Shotstack HTTP 401|Render fehlgeschlagen/i.test(message);
    const prev = await readJob(env, jobId);
    return publicJob(await patchJob(env, jobId, {
      status: "failed",
      message,
      lastError: message,
      ...(clearRender
        ? {
            artifacts: {
              ...(prev?.artifacts || {}),
              render: null
            }
          }
        : {})
    }));
  }
}

async function pollCompose(env, renderMeta) {
  const final = String(renderMeta.shotstackEnv || "") !== "stage";
  return pollShotstackRender(env, renderMeta.renderId, { final });
}

export { publicJob, collectSetupGaps, normalizeDesign };

/** Stimme freigeben → Gestaltung prüfen. */
export async function approveVideoStudioVoice(env, jobId, ctx = null) {
  const job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  if (!job.artifacts?.voice?.r2Key) throw httpError("Keine Stimme vorhanden", 409);
  const next = await patchJob(env, jobId, {
    voiceApproved: true,
    status: "queued",
    stage: "layout",
    message: "Stimme freigegeben – Gestaltung wird vorbereitet"
  });
  if (ctx) {
    ctx.waitUntil(runVideoStudioPipelineLoop(env, jobId, {}).catch((error) => {
      console.error("approve voice continue failed", jobId, error?.message || error);
    }));
  }
  return publicJob(next);
}

/** Stimme neu erzeugen (Freigabe zurücksetzen). */
export async function regenerateVideoStudioVoice(env, jobId, ctx = null) {
  const job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  const next = await patchJob(env, jobId, {
    voiceApproved: false,
    designConfirmed: false,
    status: "queued",
    stage: "voice",
    message: "Stimme wird erneut erzeugt",
    completedStages: (job.completedStages || []).filter((s) => !["voice", "layout", "captions", "render", "review"].includes(s)),
    artifacts: {
      ...(job.artifacts || {}),
      voice: null,
      render: null
    }
  });
  if (ctx) {
    ctx.waitUntil(runVideoStudioPipelineLoop(env, jobId, {}).catch((error) => {
      console.error("regenerate voice failed", jobId, error?.message || error);
    }));
  }
  return publicJob(next);
}

/** Gestaltung bestätigen → MP4 rendern. */
export async function confirmVideoStudioDesign(env, jobId, designInput = {}, ctx = null) {
  const job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  if (!job.voiceApproved) throw httpError("Zuerst die Stimme freigeben", 409);
  const design = normalizeDesign({ ...(job.design || {}), ...designInput });
  const next = await patchJob(env, jobId, {
    design,
    designConfirmed: true,
    status: "queued",
    stage: "render",
    message: "Gestaltung bestätigt – MP4 wird gerendert",
    artifacts: {
      ...(job.artifacts || {}),
      render: null
    }
  });
  if (ctx) {
    ctx.waitUntil(runVideoStudioPipelineLoop(env, jobId, {}).catch((error) => {
      console.error("confirm design continue failed", jobId, error?.message || error);
    }));
  }
  return publicJob(next);
}

/** Frische signierte Download-URLs für fertige Aufträge (Admin-Vorschau/Download). */
export async function refreshVideoStudioJobUrls(env, jobId) {
  const job = await readJob(env, jobId);
  if (!job) throw httpError("Auftrag nicht gefunden", 404);
  const finalKey = job.artifacts?.render?.r2Key || `jobs/${jobId}/final/master.mp4`;
  const outputSigned = await createSignedAssetUrl(env, { jobId, key: finalKey, ttlSec: 24 * 3600 });
  let posterUrl = job.posterUrl || job.sceneImageUrl || job.artifacts?.sceneImage?.url || null;
  if (job.artifacts?.render?.posterKey) {
    const posterSigned = await createSignedAssetUrl(env, {
      jobId,
      key: job.artifacts.render.posterKey,
      ttlSec: 24 * 3600
    });
    if (posterSigned.ok) posterUrl = posterSigned.url;
  } else if (job.artifacts?.sceneImage?.r2Key && !posterUrl) {
    const sceneSigned = await createSignedAssetUrl(env, {
      jobId,
      key: job.artifacts.sceneImage.r2Key,
      ttlSec: 24 * 3600
    });
    if (sceneSigned.ok) posterUrl = sceneSigned.url;
  }
  const next = await patchJob(env, jobId, {
    outputUrl: outputSigned.ok ? outputSigned.url : job.outputUrl,
    posterUrl,
    message: job.status === "completed"
      ? "Sprach-Bildbeitrag fertig – Download/Vorschau-Link erneuert (nur Admin)"
      : job.message
  });
  return publicJob(next);
}
