import { falKey, falQueue, falStatus, falResult } from "./video-studio/providers/base.js";
import { isProphetRelatedStatement } from "./video-studio/depiction-rules.js";
import { assertShareImageRateLimit } from "./video-studio/job-store.js";

const SHARE_IMAGE_MODEL = "fal-ai/flux/schnell";

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(cors || {}), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function clean(value, max = 360) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function randomSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return Number(a[0] || Date.now());
}

export function buildFreshShareImagePrompt(input = {}) {
  const title = clean(input.title, 140);
  const category = clean(input.category, 80);
  const body = clean(input.body || input.text, 420);
  const source = clean(input.source, 140);
  const statement = { speaker: "", de: body, topic: category || title, source };
  const prophetRelated = isProphetRelatedStatement(statement);

  const topicHint = [category, title, body].filter(Boolean).join(" · ");
  return [
    "Create a completely new, unique photorealistic 4:5 background image for a premium Islamic educational quote card.",
    "This is a fresh generation for this single share action, not a recreation of an existing app image, stock photo, template, or previously generated scene.",
    "DĀR AL TAWḤĪD visual language: noble, quiet, historically plausible, refined dark emerald or deep night-blue atmosphere with restrained warm gold light, cinematic realism, natural materials, elegant depth.",
    "Build the scene from the meaning of the supplied topic. Prefer architecture, an empty study space, manuscripts/books with unreadable or blank surfaces, desert, mountains, sky, garden, mosque details, arches, lamps appropriate to the historical atmosphere, or other non-figurative objects that fit the subject.",
    "Composition: important visual interest toward the outer edges; preserve calm negative space through the center and upper-middle for later typography. Avoid visual clutter behind text.",
    "ABSOLUTE: no people, no human figures, no faces, no silhouettes, no hands, no body parts, no portraits, no named historical person.",
    prophetRelated
      ? "PROPHET TOPIC: depict no prophet or human representation whatsoever; use only empty historically fitting places, landscapes, architecture, and objects."
      : "Even when the topic names a Companion, scholar, woman, child, or family member, do not depict a person; communicate the theme only through place, light, architecture, nature, and objects.",
    "ABSOLUTE: no written text, no letters, no readable Arabic, no calligraphy, no Qur'an verse, no invented writing on books or manuscripts, no logos, no watermarks, no social-media icons, no UI, no App Store badge.",
    "No modern electronics, cars, plastic, neon, fantasy architecture, collage, illustration, cartoon, oversaturated HDR, distorted books, or fake script.",
    "The final image itself must contain only the visual scene. Typography and branding are applied later by the app.",
    "Subject context: " + (topicHint || "Islamic knowledge and learning")
  ].join(" ");
}

async function generateFreshShareImage(env, input) {
  if (!falKey(env)) {
    const err = new Error("Bildgenerator ist derzeit nicht konfiguriert.");
    err.status = 503;
    throw err;
  }

  const prompt = buildFreshShareImagePrompt(input);
  const seed = randomSeed();
  const queued = await falQueue(env, SHARE_IMAGE_MODEL, {
    prompt,
    image_size: { width: 1024, height: 1280 },
    num_images: 1,
    seed,
    enable_safety_checker: true
  }, { preferAsync: true });

  const immediate =
    queued?.images?.[0]?.url ||
    queued?.image?.url ||
    queued?.output?.url ||
    "";

  if (immediate) return { url: immediate, seed };

  const requestId = String(queued.request_id || queued.requestId || "").trim();
  if (!requestId) throw new Error("Bildgenerator lieferte keine request_id.");

  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const state = await falStatus(env, SHARE_IMAGE_MODEL, requestId, {
      statusUrl: queued.status_url || queued.statusUrl
    });
    const status = String(state.status || "").toUpperCase();
    if (status === "FAILED" || status === "ERROR") {
      throw new Error(clean(state.error || state.detail || "Bildgenerierung fehlgeschlagen.", 220));
    }
    if (status === "COMPLETED" || status === "OK") {
      const result = await falResult(env, SHARE_IMAGE_MODEL, requestId, {
        responseUrl: queued.response_url || queued.responseUrl
      });
      const url =
        result?.images?.[0]?.url ||
        result?.image?.url ||
        result?.output?.url ||
        "";
      if (!url) throw new Error("Bildgenerator lieferte kein Bild.");
      return { url, seed, requestId };
    }
  }

  const err = new Error("Bildgenerierung dauert zu lange. Bitte erneut versuchen.");
  err.status = 504;
  throw err;
}

export async function handleShareImageBackground(request, env, cors) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "POST required" }, cors, 405);
  }

  try {
    await assertShareImageRateLimit(env, request);
    const input = await request.json().catch(() => ({}));
    const body = clean(input.body || input.text, 1600);
    const title = clean(input.title, 240);
    if (!body && !title) {
      return json({ ok: false, error: "Inhalt für Bildgenerierung fehlt." }, cors, 422);
    }

    const generated = await generateFreshShareImage(env, {
      title,
      body,
      category: clean(input.category, 120),
      source: clean(input.source, 260)
    });

    const imageResponse = await fetch(generated.url, {
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    if (!imageResponse.ok) {
      throw new Error("Generiertes Bild konnte nicht geladen werden.");
    }

    const headers = new Headers(cors || {});
    headers.set("Content-Type", imageResponse.headers.get("content-type") || "image/jpeg");
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    headers.set("X-DAR-Share-Image", "fresh-ai-v1");
    headers.set("X-DAR-Share-Seed", String(generated.seed));
    return new Response(imageResponse.body, { status: 200, headers });
  } catch (error) {
    const status = Number(error?.status || 0) || (/rate|Zu viele/i.test(String(error?.message || "")) ? 429 : 502);
    return json({ ok: false, error: clean(error?.message || error, 260) || "Bildgenerierung fehlgeschlagen." }, cors, status);
  }
}
