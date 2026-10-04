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
  const profile = clean(input.profile, 60).toLowerCase();
  const statement = { speaker: "", de: body, topic: category || title, source };
  const prophetRelated = isProphetRelatedStatement(statement);
  const womenHistorical = profile === "women-historical";

  const topicHint = [category, title, body].filter(Boolean).join(" · ");
  const womenDirection = womenHistorical ? [
    "WOMEN SECTION PROFILE: the image must look clearly different from the normal DĀR share artwork and belong visually to the historical women section.",
    "Use a historically plausible early-Islamic-era atmosphere, roughly 7th–9th century Arabia and nearby Muslim lands: clay or stone courtyard architecture, carved wooden screens, woven textiles, linen, leather, brass or clay lamps, reed mats, wooden chests, ink pots, parchment, book stands, palm gardens, wells, travel tents, simple domestic scholarly spaces.",
    "Choose the scene from the subject: knowledge/fiqh -> private study room or women’s teaching corner; marriage/family -> refined historical courtyard/home objects; modesty/hijab -> layered period textiles, doorway, screen or travel cloak; biographies/history -> historically plausible courtyard, desert camp, caravan rest or learning setting.",
    "A single anonymous historical Muslim woman may appear only when it strengthens the scene: fully modest period clothing, seen from behind or far side profile, face completely hidden or outside frame, no identifiable facial features, no glamour pose, no modern abaya fashion styling. Never portray a named woman as an identifiable likeness.",
    "Use a distinct women-section palette: warm ivory, muted olive, deep burgundy, dusty rose-brown, dark emerald and restrained antique gold; avoid the standard generic night-blue-only look.",
    "Keep the result dignified, scholarly and historical rather than decorative, romanticized, fashion-oriented or modern."
  ] : [];

  const standardHistoricalDirection = womenHistorical ? [] : [
    "STANDARD DĀR SHARE PROFILE: whenever the subject is shown through architecture, objects, learning spaces, travel, towns or daily life, the visual world must be historically plausible for roughly 1000–1400 years ago, especially the early Islamic centuries (about 7th–11th century).",
    "Use period-appropriate clay, mud-brick or stone architecture, simple arches, palm-wood or carved wooden doors, woven mats, wool and linen textiles, leather, brass or clay oil lamps, parchment, ink pots, wooden book stands, wells, courtyards, caravan rests, desert roads and old scholarly rooms. Nothing should look Ottoman-modern, Gulf-modern, contemporary or fantasy.",
    "Timeless natural backgrounds are equally valid when they fit the statement: desert, mountains, rocky valleys, sky, clouds, sea, palms, gardens, dawn, dusk or night landscapes. Nature must remain realistic and free of modern traces.",
    "Do not copy the women-section palette or domestic-women composition. The standard profile may use deep night blue, dark green, sand, stone, warm amber and restrained antique-gold light depending on the topic."
  ];

  return [
    "Create a completely new, unique photorealistic 4:5 background image for a premium Islamic educational quote card.",
    "This is a fresh generation for this single share action, not a recreation of an existing app image, stock photo, template, or previously generated scene.",
    "DĀR AL TAWḤĪD visual language: noble, quiet, historically plausible, refined, cinematic realism, natural materials, elegant depth.",
    ...womenDirection,
    ...standardHistoricalDirection,
    womenHistorical
      ? "Build the scene specifically for the women-section topic and do not recycle the visual language of the normal feed, Qurʾān, library, kids, or generic share backgrounds."
      : "Build the scene from the meaning of the supplied topic. Prefer historically plausible early-Islamic architecture and objects or a timeless natural landscape. Use empty study spaces, manuscripts/books with unreadable or blank surfaces, desert, mountains, sky, sea, gardens, old mosque details, arches and period lamps only when they fit the subject.",
    "Composition: important visual interest toward the outer edges; preserve calm negative space through the center and upper-middle for later typography. Avoid visual clutter behind text.",
    prophetRelated
      ? "PROPHET TOPIC: depict no prophet or human representation whatsoever; use only empty historically fitting places, landscapes, architecture, and objects."
      : womenHistorical
        ? "Never depict a named Companion woman, Mother of the Believers, scholar, or historical woman as a recognizable portrait. If a female figure is used, she must remain anonymous and facially unidentifiable."
        : "ABSOLUTE: no people, no human figures, no faces, no silhouettes, no hands, no body parts, no portraits, no named historical person.",
    "ABSOLUTE: no written text, no letters, no readable Arabic, no calligraphy, no Qur'an verse, no invented writing on books or manuscripts, no logos, no watermarks, no social-media icons, no UI, no App Store badge.",
    "No modern electronics, cars, plastic, neon, fantasy architecture, collage, illustration, cartoon, oversaturated HDR, distorted books, fake script, contemporary fashion photography, studio portrait lighting, or modern interiors.",
    "The final image itself must contain only the visual scene. Typography and branding are applied later by the app.",
    "Subject context: " + (topicHint || "Islamic knowledge and learning")
  ].join(" ");
}

function buildWorkersAiSharePrompt(input = {}) {
  const profile = clean(input.profile, 60).toLowerCase();
  const womenHistorical = profile === "women-historical";
  const subject = clean(
    [input.category, input.title, input.body || input.text].filter(Boolean).join(" · "),
    700
  );
  return [
    "SUBJECT: " + (subject || "Islamic knowledge and learning") + ".",
    "Create one new unique photorealistic 4:5 premium Islamic educational background.",
    womenHistorical
      ? "WOMEN SECTION: clearly separate visual identity; historically plausible early-Islamic atmosphere, roughly 7th–9th century Arabia or nearby Muslim lands. Use clay/stone courtyards, carved wooden screens, woven textiles, linen, leather, brass or clay lamps, reed mats, wooden chests, ink pots, parchment, book stands, palm gardens, wells or travel tents. A single anonymous Muslim woman may appear only if useful: fully modest period clothing, face completely hidden or outside frame, never a named historical likeness."
      : "STANDARD DĀR PROFILE: historically plausible visual world roughly 1000–1400 years ago, especially 7th–11th century. Use clay, mud-brick or stone architecture, simple arches, palm-wood doors, woven mats, wool/linen, leather, brass/clay oil lamps, parchment, ink pots, wooden book stands, wells, courtyards, caravan rests, desert roads or old scholarly rooms. Timeless realistic nature is also valid: desert, mountains, rocky valleys, sky, sea, palms, gardens, dawn, dusk or night.",
    womenHistorical
      ? "Palette: warm ivory, muted olive, deep burgundy, dusty rose-brown, dark emerald, restrained antique gold. No modern fashion styling."
      : "Palette may use night blue, dark green, sand, stone, warm amber and restrained antique-gold light. No people, faces, silhouettes, hands or body parts.",
    "Keep calm negative space through center and upper-middle for later typography.",
    "No written text, letters, Arabic writing, calligraphy, logos, watermarks, UI, App Store badge, modern electronics, cars, plastic, neon, contemporary interiors, fantasy architecture, collage, illustration or cartoon."
  ].join(" ").slice(0, 2000);
}

function base64Bytes(value) {
  const raw = atob(String(value || ""));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function generateWorkersAiShareImage(env, input) {
  if (!env?.AI || typeof env.AI.run !== "function") return null;
  const prompt = buildWorkersAiSharePrompt(input);
  const seed = randomSeed();
  const result = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", {
    prompt,
    negative_prompt: "text, letters, Arabic writing, calligraphy, logo, watermark, UI, modern electronics, cars, plastic, neon, contemporary fashion, visible face, portrait, hands, body parts, fantasy architecture, distorted books",
    width: 1024,
    height: 1280,
    num_steps: 8,
    guidance: 7.5,
    seed
  });

  if (result instanceof ReadableStream) {
    const bytes = new Uint8Array(await new Response(result).arrayBuffer());
    if (!bytes.length) throw new Error("Cloudflare Workers AI lieferte ein leeres Bild.");
    return { bytes, contentType: "image/png", seed, provider: "cloudflare-workers-ai" };
  }
  if (result?.image) {
    const bytes = base64Bytes(result.image);
    if (!bytes.length) throw new Error("Cloudflare Workers AI lieferte ein leeres Bild.");
    return { bytes, contentType: "image/jpeg", seed, provider: "cloudflare-workers-ai" };
  }
  throw new Error("Cloudflare Workers AI lieferte kein gültiges Bild.");
}

async function generateFalShareImage(env, input) {
  if (!falKey(env)) return null;

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

async function generateFreshShareImage(env, input) {
  let workersAiError = null;
  if (env?.AI && typeof env.AI.run === "function") {
    try {
      return await generateWorkersAiShareImage(env, input);
    } catch (error) {
      workersAiError = error;
    }
  }

  if (falKey(env)) {
    try {
      const fallback = await generateFalShareImage(env, input);
      if (fallback) return { ...fallback, provider: "fal" };
    } catch (falError) {
      const err = new Error(
        "Bildgenerierung fehlgeschlagen (Cloudflare AI: " +
        clean(workersAiError?.message || "nicht verfügbar", 120) +
        "; FAL: " +
        clean(falError?.message || falError, 120) +
        ")."
      );
      err.status = Number(falError?.status || 0) || 502;
      throw err;
    }
  }

  const err = new Error(
    workersAiError
      ? "Cloudflare Bildgenerator ist verbunden, konnte aber kein Bild erzeugen: " + clean(workersAiError?.message || workersAiError, 180)
      : "Bildgenerator ist derzeit nicht konfiguriert."
  );
  err.status = 503;
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
      source: clean(input.source, 260),
      profile: clean(input.profile, 60)
    });

    let imageBody = generated.bytes || null;
    let contentType = generated.contentType || "image/jpeg";
    if (!imageBody) {
      const imageResponse = await fetch(generated.url, {
        headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*" },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      if (!imageResponse.ok) {
        throw new Error("Generiertes Bild konnte nicht geladen werden.");
      }
      imageBody = imageResponse.body;
      contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    const headers = new Headers(cors || {});
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    headers.set("X-DAR-Share-Image", "fresh-ai-v1");
    headers.set("X-DAR-Share-Profile", clean(input.profile, 60) || "default");
    headers.set("X-DAR-Share-Seed", String(generated.seed));
    headers.set("X-DAR-Share-Provider", generated.provider || (generated.bytes ? "cloudflare-workers-ai" : "fal"));
    return new Response(imageBody, { status: 200, headers });
  } catch (error) {
    const status = Number(error?.status || 0) || (/rate|Zu viele/i.test(String(error?.message || "")) ? 429 : 502);
    return json({ ok: false, error: clean(error?.message || error, 260) || "Bildgenerierung fehlgeschlagen." }, cors, status);
  }
}
