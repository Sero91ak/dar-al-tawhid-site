/* Verbindliches DAR-Video-Profil (dar-standard-v2) – Bildbeitrags-Optik */

export const DAR_VIDEO_PROFILE = Object.freeze({
  id: "dar-standard-v2",
  format: "9:16",
  width: 1080,
  height: 1920,
  fps: 30,
  codec: "h264",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  audioCodec: "aac",
  audioProfile: "aac_low",
  fastStart: true,
  voiceProfile: "dar-male",
  typography: Object.freeze({
    display: "Georgia, 'Times New Roman', serif",
    body: "Georgia, 'Times New Roman', serif",
    ui: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    gold: "#efd78e",
    cream: "#fff8e8",
    soft: "#d9c9a4",
    ink: "#0b1020"
  }),
  safeArea: Object.freeze({
    topPx: 110,
    bottomPx: 168,
    sidePx: 56
  }),
  branding: Object.freeze({
    title: "DAR AL TAWḤĪD",
    logoHint: "Original-Logo DAR AL TAWḤĪD",
    watermark: "dezentes DAR-Wasserzeichen",
    logoPublicPath: "/app-logo-original.png",
    watermarkPublicPath: "/watermark-my-logo-full.png",
    followLine: "Folgt für mehr Wissen aus Qurʾān & Sunnah",
    telegram: "@dar_al_tauhid",
    telegramUrl: "https://t.me/dar_al_tauhid",
    website: "dar-al-tauhid.de",
    websiteUrl: "https://dar-al-tauhid.de",
    instagram: "@dar_at_tawhid",
    instagramUrl: "https://www.instagram.com/dar_at_tawhid",
    credit: "by Serhat Abu Malik"
  }),
  safety: Object.freeze({
    noProphetDepiction: true,
    noProphetSilhouette: true,
    noIdentifiableCompanions: true,
    anonymousFiguresOnly: true,
    facesFullyHidden: true,
    historicallyPlausible: true,
    themeBoundScenes: true,
    noMusic: true,
    naturalAtmosphereOnly: true,
    manualApprovalRequired: true,
    noVisitorPush: true,
    noAutoFeedPublish: true,
    noForeignWatermarkOnFinal: true,
    uploadFirstSceneImage: true
  }),
  promptSafetySuffix: [
    "Photorealistic cinematic Islamic educational short film, vertical 9:16, premium calm atmosphere.",
    "Theme-bound scene derived from the statement — not a generic stock mosque, desert, or library template.",
    "Historically and temporally plausible architecture, clothing, tools, and lighting for the topic era.",
    "Only anonymous symbolic figures when people appear: backs turned, cropped, or fully face-hidden; never identifiable portraits.",
    "Never depict any prophet as a person in any form (no face, back, silhouette, shadow-person, veiled body, or body crop of a prophet).",
    "Modest clothing, anatomically correct hands, gentle camera motion, real movement, no horror masks.",
    "No text overlays in the generated clip, no logos, no watermarks, no music, no collage, no readable invented writing on props."
  ].join(" ")
});

export const PIPELINE_STAGES = Object.freeze([
  "statement",
  "storyboard",
  "references",
  "clips",
  "voice",
  "captions",
  "render",
  "review"
]);

export function emptyQualityChecks() {
  return {
    facesHidden: false,
    handsAcceptable: false,
    sourceVerified: false,
    captionsSafe: false,
    audioValid: false,
    iphoneCompatible: false,
    androidCompatible: false,
    noMusic: false,
    brandingComplete: false,
    noFrozenFrames: false,
    noForeignWatermark: false,
    textHierarchyOk: false,
    safeAreasOk: false,
    voiceExact: false,
    prophetSafe: false,
    historicallyPlausible: false,
    motionSecondsOk: false
  };
}

export function publicBrandAssetUrl(env, path) {
  const base = String(
    env.VIDEO_STUDIO_BRAND_BASE ||
    env.ALLOWED_ORIGIN ||
    "https://dar-al-tawhid.de"
  ).replace(/\/$/, "");
  const rel = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}
