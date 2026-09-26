import { falKey, falQueue, falStatus, falResult } from "./video-studio/providers/base.js";
import { depictionPromptBlock } from "./video-studio/depiction-rules.js";

const MODEL = "fal-ai/flux/schnell";

function clean(v, max = 1000) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export function buildKidsCoverPrompt(input = {}) {
  const title = clean(input.title, 180);
  const topic = clean(input.topic || input.category || "islamische Kindergeschichte", 220);
  const text = clean(input.text, 700);
  const prophetId = clean(input.prophetId, 100);
  const ageMin = Number(input.ageMin || 4);
  const ageMax = Number(input.ageMax || 10);
  const statement = {
    speaker: prophetId ? `Prophet ${prophetId}` : "",
    topic: [topic, prophetId].filter(Boolean).join(" · "),
    de: [title, text].filter(Boolean).join(". "),
    source: clean((input.sourceRefs || []).join?.(" · ") || input.source || "", 300)
  };

  return [
    "Premium illustrated cover for DĀR AL TAWḤĪD Kids, portrait 4:5.",
    "Joyful, warm, airy children's storybook illustration; refined 3D-painted comic feel, soft rounded shapes, lively depth, rich but calm colors, inviting light.",
    "Not icy, not sterile, not flat stock art, not childish scribble, not cluttered.",
    "One clear visual focal scene with generous breathing room. No collage.",
    `Intended age: ${ageMin} to ${ageMax} years.`,
    "Historically and temporally plausible environment for the story; architecture, landscape, objects, clothing and light sources must fit the period.",
    depictionPromptBlock(statement),
    "For stories about prophets: represent only the environment, landscape, architecture, objects, animals or non-identifiable background context. Never depict the prophet in any human form.",
    "For named Sahabah, Sahabiyyat, Ahl al-Bayt, Tabiin or early scholars: never create an identifiable portrait or figure intended to be that named person.",
    `Story title/theme for visual context only: ${title || topic}.`,
    `Narrative context: ${text}.`,
    "Absolutely no text, no letters, no Arabic calligraphy, no logo, no watermark, no UI, no social icons.",
    "No visible facial portrait as the main subject. No extra fingers, deformed anatomy, horror, fantasy magic, neon, modern electronics, cars or plastic unless the story period explicitly requires modern context.",
    "Composition must still work when the app overlays a small title and NEW badge."
  ].join(" ");
}

export async function generateKidsCover(env, input = {}) {
  if (!falKey(env)) {
    return { ok: false, setupRequired: true, reason: "FAL_KEY fehlt für Kids-Cover" };
  }
  if (!clean(input.title || input.topic || input.text, 20)) {
    return { ok: false, reason: "Titel oder Thema für Cover fehlt" };
  }
  const prompt = buildKidsCoverPrompt(input);
  const queued = await falQueue(env, MODEL, {
    prompt,
    image_size: { width: 1024, height: 1280 },
    num_images: 1,
    enable_safety_checker: true
  }, { preferAsync: true });

  const immediate =
    queued?.images?.[0]?.url ||
    queued?.image?.url ||
    queued?.output?.url ||
    "";
  if (immediate) {
    return { ok: true, status: "completed", url: immediate, prompt, model: MODEL, estimatedCostEur: 0.05 };
  }

  const requestId = String(queued.request_id || queued.requestId || "").trim();
  if (!requestId) return { ok: false, reason: "Kids-Cover-Queue ohne request_id" };

  for (let i = 0; i < 24; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const st = await falStatus(env, MODEL, requestId, { statusUrl: queued.status_url || queued.statusUrl });
    const state = String(st.status || "").toUpperCase();
    if (state === "FAILED" || state === "ERROR") {
      return { ok: false, reason: st.error || st.detail || "Kids-Cover fehlgeschlagen", requestId };
    }
    if (state === "COMPLETED" || state === "OK") {
      const result = await falResult(env, MODEL, requestId, { responseUrl: queued.response_url || queued.responseUrl });
      const url = result?.images?.[0]?.url || result?.image?.url || result?.output?.url || "";
      if (!url) return { ok: false, reason: "Kids-Cover ohne URL", requestId };
      return { ok: true, status: "completed", url, prompt, model: MODEL, estimatedCostEur: 0.05, requestId };
    }
  }
  return { ok: false, reason: "Kids-Cover-Timeout – bitte erneut versuchen", requestId };
}

export function kidsCoverSafety() {
  return {
    format: "4:5",
    width: 1024,
    height: 1280,
    noText: true,
    noProphetDepiction: true,
    noProphetSilhouette: true,
    noIdentifiableCompanions: true,
    historicallyPlausible: true,
    kidsStorybookStyle: true
  };
}
