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
import { getVideoAsset, verifySignedAssetRequest, putVideoAsset, createSignedAssetUrl, deleteVideoPrefix } from "./storage.js";
import { isVoiceConfigured, probeElevenAuth } from "./voice.js";
import { isComposerConfigured, shotstackEnvironment, probeShotstackAuth, submitShotstackTimeline, composeFinalVideo } from "./compose.js";
import { createProjectFromJob, normalizeProject, scaleProjectDuration, projectToCaptionPlan, DAR_EDITOR_TEMPLATES } from "./project.js";
import { buildTimelineFromProject } from "./project-compose.js";
import { runVideoValidation } from "./validation.js";
import { parseContributionText, estimateVideoCost } from "./text-parse.js";
import { generateSceneImage } from "./scene-image.js";

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

  if (request.method === "POST" && rest === "/parse-text") {
    const body = await request.json().catch(() => ({}));
    const parsed = parseContributionText(body.text || body.contributionText || "");
    if (!parsed.ok) return json({ ok: false, error: parsed.reason }, cors, 422);
    return json({ ok: true, ...parsed, estimate: estimateVideoCost({ voiceChars: (parsed.statement?.de || "").length + 120 }) }, cors);
  }

  if (request.method === "POST" && rest === "/estimate") {
    const body = await request.json().catch(() => ({}));
    return json({ ok: true, estimate: estimateVideoCost(body) }, cors);
  }

  if (request.method === "POST" && rest === "/scene-image") {
    await assertVideoStudioRateLimit(env, request);
    const body = await request.json().catch(() => ({}));
    let statement = body.statement;
    if (!statement && (body.text || body.contributionText)) {
      const parsed = parseContributionText(body.text || body.contributionText);
      if (!parsed.ok) return json({ ok: false, error: parsed.reason }, cors, 422);
      statement = parsed.statement;
    }
    if (!statement?.de) return json({ ok: false, error: "Text/Aussage für Szenenbild fehlt" }, cors, 422);
    const generated = await generateSceneImage(env, { statement });
    if (!generated.ok) {
      return json({ ok: false, error: generated.reason || "Szenenbild fehlgeschlagen" }, cors, generated.setupRequired ? 503 : 502);
    }
    const sceneId = `scene_${Date.now().toString(36)}`;
    const key = `library/scenes/${sceneId}.jpg`;
    try {
      const imgRes = await fetch(generated.url);
      const bytes = await imgRes.arrayBuffer();
      await putVideoAsset(env, key, bytes, imgRes.headers.get("content-type") || "image/jpeg");
      const signed = await createSignedAssetUrl(env, { jobId: "library", key, ttlSec: 24 * 3600 });
      return json({
        ok: true,
        sceneImage: {
          id: sceneId,
          url: signed.ok ? signed.url : generated.url,
          sourceUrl: generated.url,
          r2Key: key,
          estimatedCostEur: generated.estimatedCostEur || 0.05
        }
      }, cors);
    } catch {
      return json({ ok: true, sceneImage: { id: sceneId, url: generated.url, r2Key: null, estimatedCostEur: generated.estimatedCostEur || 0.05 } }, cors);
    }
  }

  if (request.method === "POST" && rest === "/scene-image/upload") {
    await assertVideoStudioRateLimit(env, request);
    const body = await request.json().catch(() => ({}));
    const dataUrl = String(body.dataUrl || "").trim();
    const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
    if (!match) return json({ ok: false, error: "Ungültiges Bild (dataUrl erwartet)" }, cors, 422);
    const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
    let bin;
    try {
      bin = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    } catch {
      return json({ ok: false, error: "Bild-Base64 ungültig" }, cors, 422);
    }
    if (bin.byteLength > 12 * 1024 * 1024) {
      return json({ ok: false, error: "Bild zu groß (max. 12 MB nach Vorbereitung)" }, cors, 413);
    }
    const sceneId = `upload_${Date.now().toString(36)}`;
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const key = `library/scenes/${sceneId}.${ext}`;
    await putVideoAsset(env, key, bin, mime);
    const signed = await createSignedAssetUrl(env, { jobId: "library", key, ttlSec: 24 * 3600 });
    return json({
      ok: true,
      sceneImage: {
        id: sceneId,
        url: signed.url || null,
        r2Key: key,
        uploaded: true,
        source: String(body.source || "manual-upload"),
        originalName: String(body.originalName || "").slice(0, 120)
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
    try {
      const result = await createVideoStudioJob(env, input, helpers, ctx);
      return json(result, cors, result.job?.status === "setup_required" ? 200 : 200);
    } catch (error) {
      return json({ ok: false, error: error.message || String(error) }, cors, error.status || 500);
    }
  }

  const editorMatch = rest.match(/^\/jobs\/([^/]+)\/(project|editor-export)$/);
  if (editorMatch) {
    const jobId = decodeURIComponent(editorMatch[1]);
    const action = editorMatch[2];

    async function resolveJobMedia(job) {
      const clipUrls = [];
      for (const clip of job.artifacts?.clips || []) {
        if (clip.r2Key) {
          const signed = await createSignedAssetUrl(env, clip.r2Key, { expiresSec: 3600 });
          if (signed.ok && signed.url) clipUrls.push(signed.url);
          else if (clip.url) clipUrls.push(clip.url);
        } else if (clip.url) clipUrls.push(clip.url);
      }
      let voiceUrl = "";
      if (job.artifacts?.voice?.r2Key) {
        const signed = await createSignedAssetUrl(env, job.artifacts.voice.r2Key, { expiresSec: 3600 });
        voiceUrl = signed.url || job.artifacts.voice.url || "";
      } else {
        voiceUrl = job.artifacts?.voice?.url || "";
      }
      let sceneImageUrl = job.sceneImageUrl || "";
      if (job.artifacts?.sceneImage?.r2Key) {
        const signed = await createSignedAssetUrl(env, job.artifacts.sceneImage.r2Key, { expiresSec: 3600 });
        sceneImageUrl = signed.url || sceneImageUrl;
      }
      return { clipUrls, voiceUrl, sceneImageUrl };
    }

    if (request.method === "GET" && action === "project") {
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      const media = await resolveJobMedia(job);
      let project = job.editorProject ? normalizeProject(job.editorProject) : null;
      if (!project) {
        project = createProjectFromJob({
          jobId,
          name: job.statement?.speaker ? `${job.statement.speaker} – Video` : "DAR Video",
          statement: job.statement || {},
          captionPlan: job.storyboard?.captionPlan || null,
          sceneImageUrl: media.sceneImageUrl,
          voiceUrl: media.voiceUrl,
          clipUrls: media.clipUrls,
          durationSec: job.durationSeconds || 15
        });
      } else {
        project.background = {
          ...project.background,
          clipUrls: media.clipUrls.length ? media.clipUrls : project.background?.clipUrls || [],
          assetUrl: media.sceneImageUrl || project.background?.assetUrl || ""
        };
        if (media.voiceUrl && project.audioTracks?.[0]) {
          project.audioTracks[0].url = media.voiceUrl;
        }
      }
      return json({
        ok: true,
        job: publicJob(job),
        project,
        templates: DAR_EDITOR_TEMPLATES,
        media
      }, cors);
    }

    if ((request.method === "PUT" || request.method === "PATCH") && action === "project") {
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      let project = normalizeProject(body.project || body);
      if (!project) return json({ ok: false, error: "Ungültiges Projekt" }, cors, 422);
      if (body.scaleDuration != null) {
        project = scaleProjectDuration(project, body.scaleDuration, {
          proportional: body.proportional !== false
        });
      }
      const saved = await saveJob(env, {
        ...job,
        editorProject: project,
        message: "Editor-Projekt gespeichert",
        updatedAt: new Date().toISOString()
      });
      return json({ ok: true, project, job: publicJob(saved) }, cors);
    }

    if (request.method === "POST" && action === "editor-export") {
      await assertVideoStudioRateLimit(env, request);
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      const media = await resolveJobMedia(job);
      let project = normalizeProject(body.project || job.editorProject);
      if (!project) {
        project = createProjectFromJob({
          jobId,
          statement: job.statement || {},
          captionPlan: job.storyboard?.captionPlan || null,
          sceneImageUrl: media.sceneImageUrl,
          voiceUrl: media.voiceUrl,
          clipUrls: media.clipUrls,
          durationSec: job.durationSeconds || 15
        });
      }
      project.background = {
        ...project.background,
        clipUrls: media.clipUrls,
        assetUrl: media.sceneImageUrl || project.background?.assetUrl || ""
      };
      if (project.audioTracks?.[0]) project.audioTracks[0].url = media.voiceUrl || project.audioTracks[0].url;

      if (!media.clipUrls.length) {
        return json({ ok: false, error: "Keine Bewegungsclips – zuerst Video erzeugen" }, cors, 409);
      }

      const timeline = buildTimelineFromProject(env, project);
      const validation = runVideoValidation({
        statement: job.statement,
        storyboard: job.storyboard,
        captionPlan: projectToCaptionPlan(project),
        render: {
          ok: true,
          audioAttached: Boolean(media.voiceUrl),
          provider: "shotstack",
          shotstackEnv: "v1",
          foreignWatermarkRisk: false,
          brandingApplied: true,
          durationSeconds: project.duration
        },
        timelineMeta: timeline.meta
      });

      if (body.previewOnly === true) {
        await saveJob(env, { ...job, editorProject: project, validation, updatedAt: new Date().toISOString() });
        return json({ ok: true, validation, project, previewOnly: true }, cors);
      }

      if (validation.blocked && body.force !== true) {
        return json({
          ok: false,
          error: "Export blockiert durch Qualitätsprüfung",
          validation,
          blocked: true
        }, cors, 422);
      }

      let compose = await submitShotstackTimeline(env, timeline, { final: true });
      if (!compose.ok) {
        const code = Number(compose.httpStatus || 0);
        if (code === 401 || code === 403) {
          // Kein Stage (Fremdwasserzeichen) – fal nur als unvollständige Vorschau
          compose = await composeFinalVideo(env, {
            clipUrls: media.clipUrls,
            voiceUrl: media.voiceUrl,
            captionPlan: projectToCaptionPlan(project),
            final: true
          });
        }
      }

      if (!compose.ok) {
        return json({ ok: false, error: compose.reason || "Export fehlgeschlagen", compose }, cors, 502);
      }

      const saved = await saveJob(env, {
        ...job,
        editorProject: project,
        validation,
        status: "running",
        stage: "render",
        artifacts: {
          ...(job.artifacts || {}),
          render: {
            provider: compose.provider,
            renderId: compose.renderId,
            status: "running",
            statusUrl: compose.statusUrl || null,
            responseUrl: compose.responseUrl || null,
            falPhase: compose.falPhase || null,
            voiceUrl: media.voiceUrl || null,
            shotstackEnv: compose.shotstackEnv || null,
            foreignWatermarkRisk: Boolean(compose.foreignWatermarkRisk),
            brandingApplied: Boolean(compose.brandingApplied),
            composeFallback: compose.composeFallback || "editor",
            timelineMeta: compose.timelineMeta || timeline.meta,
            fromEditor: true
          }
        },
        message: "Editor-Export läuft…",
        updatedAt: new Date().toISOString()
      });

      if (ctx?.waitUntil) {
        ctx.waitUntil(runVideoStudioPipelineLoop(env, jobId, helpers, { maxTicks: 24, delayMs: 2500 }));
      }

      return json({
        ok: true,
        job: publicJob(saved),
        project,
        validation,
        renderId: compose.renderId,
        provider: compose.provider
      }, cors);
    }
  }

  const jobMatch = rest.match(/^\/jobs\/([^/]+)(?:\/(cancel|retry|approve|refresh-urls|publish-feed|request-push|regenerate))?$/);
  if (jobMatch) {
    const jobId = decodeURIComponent(jobMatch[1]);
    const action = jobMatch[2] || "";

    if (request.method === "GET" && !action) {
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      return json({ ok: true, job: publicJob(job) }, cors);
    }

    if (request.method === "PATCH" && !action) {
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      const nextStatement = {
        ...(job.statement || {}),
        ...(body.statement && typeof body.statement === "object" ? body.statement : {})
      };
      if (body.speaker != null) nextStatement.speaker = String(body.speaker).trim();
      if (body.de != null) nextStatement.de = String(body.de).trim();
      if (body.source != null) nextStatement.source = String(body.source).trim();
      if (body.topic != null) nextStatement.topic = String(body.topic).trim();
      if (body.fazit != null) nextStatement.fazit = String(body.fazit).trim();
      if (!nextStatement.de) return json({ ok: false, error: "Aussage darf nicht leer sein" }, cors, 422);
      const contributionText =
        body.contributionText != null ? String(body.contributionText) : job.contributionText || "";
      const saved = await saveJob(env, {
        ...job,
        statement: {
          ...nextStatement,
          manual: true,
          verified: Boolean(nextStatement.speaker && nextStatement.de && nextStatement.source)
        },
        contributionText,
        message: "Text aktualisiert (noch nicht neu gerendert)",
        updatedAt: new Date().toISOString()
      });
      return json({ ok: true, job: publicJob(saved) }, cors);
    }

    if (request.method === "POST" && action === "regenerate") {
      await assertVideoStudioRateLimit(env, request);
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      let statement = { ...(job.statement || {}) };
      if (body.statement && typeof body.statement === "object") {
        statement = { ...statement, ...body.statement };
      }
      ["speaker", "de", "source", "topic", "fazit"].forEach((k) => {
        if (body[k] != null) statement[k] = String(body[k]).trim();
      });
      if (body.contributionText) {
        const parsed = parseContributionText(body.contributionText);
        if (parsed.ok) statement = { ...statement, ...parsed.statement, id: statement.id || parsed.statement.id };
      }
      if (!statement.de) return json({ ok: false, error: "Aussage fehlt für Neu-Erzeugung" }, cors, 422);
      const keepScene = job.sceneImageUrl || job.artifacts?.sceneImage || null;
      const saved = await saveJob(env, {
        ...job,
        status: "queued",
        stage: "statement",
        statement: { ...statement, manual: true, verified: true },
        contributionText: body.contributionText || job.contributionText || "",
        sceneImageUrl: job.sceneImageUrl || keepScene?.url || null,
        storyboard: null,
        completedStages: ["statement"],
        artifacts: {
          sceneImage: keepScene?.r2Key || keepScene?.url ? keepScene : job.artifacts?.sceneImage || null,
          clips: [],
          voice: null,
          render: null
        },
        outputUrl: null,
        posterUrl: null,
        qualityChecks: null,
        approval: { approved: false },
        costEur: 0,
        message: "Neu-Erzeugung vorbereitet – Produktion startet",
        updatedAt: new Date().toISOString()
      });
      const progressed = await processVideoStudioJob(env, jobId, helpers);
      return json({ ok: true, job: publicJob(progressed || saved), regenerated: true }, cors);
    }

    if (request.method === "DELETE" && !action) {
      const mode = String(url.searchParams.get("mode") || "list");
      const job = await readJob(env, jobId);
      if (mode === "assets" || mode === "all") {
        await deleteVideoPrefix(env, `jobs/${jobId}/`);
      }
      if (mode !== "assets") {
        await deleteJob(env, jobId);
      } else if (job) {
        await saveJob(env, {
          ...job,
          artifacts: { ...(job.artifacts || {}), clips: [], voice: null, render: null },
          outputUrl: null,
          message: "Rohdateien gelöscht, Auftrag bleibt in der Liste",
          updatedAt: new Date().toISOString()
        });
      }
      return json({ ok: true, deleted: true, id: jobId, mode }, cors);
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
        profile: job.profile || "dar-standard-v4",
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
      if (job.qualityIncomplete || job.composePreview) {
        return json({
          ok: false,
          error: "Unvollständige Vorschau – Freigabe erst nach bestandener Pflichtprüfung / Production-Endfassung"
        }, cors, 409);
      }
      if (job.artifacts?.render?.foreignWatermarkRisk || job.artifacts?.render?.shotstackEnv === "stage") {
        return json({
          ok: false,
          error: "Stage-/Vorschau-Render mit Fremdwasserzeichen-Risiko – bitte Production-Endfassung erzeugen"
        }, cors, 409);
      }
      if (job.artifacts?.render?.provider === "fal-ffmpeg" && !job.artifacts?.render?.brandingApplied) {
        return json({
          ok: false,
          error: "fal-ffmpeg-Merge ohne DAR-Texte/Wasserzeichen – Freigabe erst nach Shotstack Production-Endfassung"
        }, cors, 409);
      }
      if (job.validation?.blocked || (job.validation && job.validation.ok === false)) {
        return json({
          ok: false,
          error: `Export-Validierung blockiert: ${(job.validation.errors || []).join(" · ") || "Pflichtchecks fehlgeschlagen"}`
        }, cors, 409);
      }
      const saved = await saveJob(env, {
        ...job,
        approval: {
          approved: true,
          approvedAt: new Date().toISOString(),
          note: "Interne Freigabe – Feed und Push bleiben getrennt manuell"
        },
        message: "Intern freigegeben (noch nicht veröffentlicht)",
        updatedAt: new Date().toISOString()
      });
      return json({ ok: true, job: publicJob(saved) }, cors);
    }

    if (request.method === "POST" && action === "publish-feed") {
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      if (!job.approval?.approved) {
        return json({ ok: false, error: "Zuerst intern freigeben" }, cors, 409);
      }
      if (body.confirm !== true) {
        return json({ ok: false, error: "Feed-Veröffentlichung erfordert confirm:true" }, cors, 400);
      }
      // Nie automatisch und nie still an Live-Besucher – nur manuelle Markierung / Staging-Vorbereitung
      const saved = await saveJob(env, {
        ...job,
        publication: {
          ...(job.publication || {}),
          feed: {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "manual_pending",
            note: "Manuell vorgemerkt – kein automatischer Live-Feed. Live nur nach ausdrücklicher Freigabe."
          }
        },
        message: "Feed manuell vorgemerkt – noch nicht live veröffentlicht",
        updatedAt: new Date().toISOString()
      });
      return json({
        ok: true,
        job: publicJob(saved),
        published: false,
        message: "Feed nur vorgemerkt. Keine automatische Live-Veröffentlichung."
      }, cors);
    }

    if (request.method === "POST" && action === "request-push") {
      const body = await request.json().catch(() => ({}));
      const job = await readJob(env, jobId);
      if (!job) return json({ ok: false, error: "Auftrag nicht gefunden" }, cors, 404);
      if (!job.approval?.approved) {
        return json({ ok: false, error: "Zuerst intern freigeben" }, cors, 409);
      }
      if (body.confirm !== true) {
        return json({ ok: false, error: "Push erfordert confirm:true" }, cors, 400);
      }
      // Staging: niemals an alle Besucher senden
      const allowVisitor = String(env.VIDEO_STUDIO_ALLOW_VISITOR_PUSH || "").trim() === "true";
      const saved = await saveJob(env, {
        ...job,
        publication: {
          ...(job.publication || {}),
          push: {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: allowVisitor ? "manual_pending_live" : "blocked_staging",
            sent: false,
            note: allowVisitor
              ? "Manuell vorgemerkt – noch kein Versand ohne separates Live-OK."
              : "Staging-Schutz: kein Besucher-Push. Nur Admin-/Test-Pushs erlaubt."
          }
        },
        message: allowVisitor
          ? "Push manuell vorgemerkt – noch nicht versendet"
          : "Push blockiert (Staging) – kein Versand an Besucher",
        updatedAt: new Date().toISOString()
      });
      return json({
        ok: true,
        job: publicJob(saved),
        sent: false,
        message: saved.message
      }, cors);
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
