import { falKey, falQueue, falStatus, falResult } from "./providers/base.js";
import { resolveThemeAtmosphere } from "./theme-presets.js";
import { DAR_VIDEO_PROFILE } from "./profile.js";
import { depictionPromptBlock } from "./depiction-rules.js";

const SCENE_IMAGE_MODEL = "fal-ai/flux/schnell";

export function buildSceneImagePrompt(statement, { purpose = "video", format = "9:16", requestToken = "" } = {}) {
  const theme = String(statement?.topic || "Wissen");
  const de = String(statement?.de || "").slice(0, 180);
  const atmosphere = resolveThemeAtmosphere(theme, de);
  const isShare = purpose === "share";
  return [
    isShare
      ? `Photorealistic vertical ${format || "4:5"} cinematic still frame for a newly generated Islamic educational share card background.`
      : "Photorealistic vertical 9:16 cinematic still frame for an Islamic educational short film.",
    "Premium DAR AL TAWHID visual style: noble, calm, elegant, realistic, not cartoon, not fantasy.",
    atmosphere.opening,
    "Theme-bound to the statement — not a random stock background.",
    isShare
      ? "Create a brand-new original scene for this individual share request. Never reuse, imitate, or reference an existing app image, poster, cover, feed image, library image, or previously generated share background."
      : "Create an original scene for this production.",
    "Leave calm negative space in the center and lower third for later text overlays.",
    depictionPromptBlock(statement),
    `Thematic mood related to: ${de}`,
    requestToken ? `Fresh-generation token: ${String(requestToken).slice(0, 64)}.` : "",
    "Absolutely no text, no letters, no calligraphy overlays, no logos, no watermarks, no social icons, no UI."
  ].filter(Boolean).join(" ");
}

export async function generateSceneImage(env, {
  statement,
  purpose = "video",
  format = "9:16",
  width,
  height,
  requestToken = ""
} = {}) {
  if (!falKey(env)) {
    return { ok: false, setupRequired: true, reason: "FAL_KEY fehlt für Szenenbild" };
  }
  const isShare = purpose === "share";
  const outWidth = Number(width) || (isShare ? 864 : 768);
  const outHeight = Number(height) || (isShare ? 1080 : 1344);
  const prompt = buildSceneImagePrompt(statement, { purpose, format: isShare ? (format || "4:5") : format, requestToken });
  const queued = await falQueue(env, SCENE_IMAGE_MODEL, {
    prompt,
    image_size: { width: outWidth, height: outHeight },
    num_images: 1,
    enable_safety_checker: true
  }, { preferAsync: true });

  const requestId = String(queued.request_id || queued.requestId || "").trim();
  const immediate =
    queued?.images?.[0]?.url ||
    queued?.image?.url ||
    queued?.output?.url ||
    "";

  if (immediate) {
    return {
      ok: true,
      status: "completed",
      url: immediate,
      prompt,
      model: SCENE_IMAGE_MODEL,
      purpose,
      format: isShare ? (format || "4:5") : format,
      estimatedCostEur: 0.05
    };
  }

  if (!requestId) {
    return { ok: false, reason: "Szenenbild-Queue ohne request_id" };
  }

  // Kurz pollen (Worker-Tick)
  for (let i = 0; i < 24; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const st = await falStatus(env, SCENE_IMAGE_MODEL, requestId, {
      statusUrl: queued.status_url || queued.statusUrl
    });
    const state = String(st.status || "").toUpperCase();
    if (state === "FAILED" || state === "ERROR") {
      return { ok: false, reason: st.error || st.detail || "Szenenbild fehlgeschlagen" };
    }
    if (state === "COMPLETED" || state === "OK") {
      const result = await falResult(env, SCENE_IMAGE_MODEL, requestId, {
        responseUrl: queued.response_url || queued.responseUrl
      });
      const url =
        result?.images?.[0]?.url ||
        result?.image?.url ||
        result?.output?.url ||
        "";
      if (!url) return { ok: false, reason: "Szenenbild ohne URL" };
      return {
        ok: true,
        status: "completed",
        url,
        prompt,
        model: SCENE_IMAGE_MODEL,
        purpose,
        format: isShare ? (format || "4:5") : format,
        estimatedCostEur: 0.05,
        requestId
      };
    }
  }
  return { ok: false, reason: "Szenenbild-Timeout – bitte erneut versuchen", requestId };
}

export function sceneImageSafetyNotes() {
  return {
    noText: true,
    noLogo: true,
    noSocial: true,
    facesHidden: DAR_VIDEO_PROFILE.safety.facesFullyHidden,
    format: "9:16"
  };
}
