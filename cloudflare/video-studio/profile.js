/* Verbindliches DAR-Video-Profil – Spezifikation automatische Videobeiträge */

import { DAR_VIDEO_DURATION_SEC, PRESERVE_SCENE_PROMPT } from "./timeline.js";

export const DAR_VIDEO_PROFILE = Object.freeze({
  id: "dar-speech-image-v1",
  productName: "Sprach-Bildbeitrag",
  format: "9:16",
  width: 1080,
  height: 1920,
  fps: 30,
  /** Richtwert; echte Dauer folgt der Stimme */
  durationSec: DAR_VIDEO_DURATION_SEC,
  durationMode: "voice-driven",
  codec: "h264",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  audioCodec: "aac",
  audioProfile: "aac_low",
  fastStart: true,
  voiceProfile: "dar-male",
  typography: Object.freeze({
    display: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    body: "'Cormorant Garamond', 'Libre Baskerville', Georgia, serif",
    source: "'Libre Baskerville', 'EB Garamond', Georgia, serif",
    script: "'Great Vibes', 'Instrument Serif', Georgia, serif",
    arabic: "'Amiri', 'Noto Naskh Arabic', 'Noto Sans Arabic', serif",
    ui: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
    gold: "#efd78e",
    cream: "#fff8e8",
    soft: "#e8dcc0",
    muted: "#c9b896",
    ink: "#0b1020",
    panelBg: "rgba(12,14,16,0.78)",
    panelBorder: "rgba(230,200,130,0.28)",
    dimOverlay: "rgba(0,0,0,0.34)"
  }),
  fonts: Object.freeze({
    base: "https://dar-al-tawhid.de/assets/fonts",
    faces: [
      { family: "Cormorant Garamond", weight: 600, file: "cormorant-garamond-latin-600-normal.woff2" },
      { family: "Cormorant Garamond", weight: 700, file: "cormorant-garamond-latin-700-normal.woff2" },
      { family: "EB Garamond", weight: 500, style: "italic", file: "eb-garamond-latin-500-italic.woff2" },
      { family: "Amiri", weight: 400, file: "amiri-arabic-400-normal.woff2" },
      { family: "Amiri", weight: 700, file: "amiri-arabic-700-normal.woff2" },
      { family: "Noto Naskh Arabic", weight: 400, file: "noto-naskh-arabic-arabic-400-normal.woff2" },
      { family: "Great Vibes", weight: 400, file: "great-vibes-latin-400-normal.woff2" },
      { family: "Instrument Serif", weight: 400, file: "instrument-serif-latin-400-normal.woff2" },
      { family: "Manrope", weight: 600, file: "manrope-latin-600-normal.woff2" }
    ]
  }),
  safeArea: Object.freeze({
    topPx: 96,
    bottomPx: 120,
    sidePx: 80
  }),
  branding: Object.freeze({
    title: "DAR AL TAWḤĪD",
    logoHint: "Originales rundes DAR-Logo",
    watermark: "einmal mittig, groß, Deckkraft 5–8 %, Breite 30–38 %",
    logoPublicPath: "/app-logo-original.png",
    watermarkPublicPath: "/watermark-my-logo-full.png",
    watermarkScale: 0.34,
    watermarkOpacity: 0.065,
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
    noShotstackStageOnFinal: true,
    uploadFirstSceneImage: true,
    noModernVehicles: true,
    preserveUploadedScene: true,
    singleCenteredWatermark: true,
    fixedDuration15s: false,
    noGenerativeVideo: true,
    noFalVideo: true,
    stillImageOnly: true,
    subtleKenBurnsOnly: true
  }),
  preserveScenePrompt: PRESERVE_SCENE_PROMPT,
  promptSafetySuffix: [
    "Speech-image contribution only: preserve the uploaded 9:16 still.",
    "No generative video, no new people, faces, clothing, architecture, or objects.",
    "Only subtle non-generative camera motion (slow push-in / drift).",
    "No music, no foreign watermarks, no text baked into the source image."
  ].join(" ")
});

export const PIPELINE_STAGES = Object.freeze([
  "statement",
  "image",
  "voice",
  "layout",
  "render",
  "review"
]);

/** Statusmeldungen für die kompakte Oberfläche */
export const PIPELINE_STAGE_LABELS = Object.freeze({
  statement: "Text geprüft",
  image: "Bild vorbereitet",
  voice: "Stimme wird erzeugt",
  voice_pending: "Stimme wartet auf Freigabe",
  layout: "Gestaltung wird vorbereitet",
  design_pending: "Gestaltung prüfen",
  render: "MP4 wird gerendert",
  review: "Qualitätsprüfung",
  completed: "Fertig"
});

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
    motionSecondsOk: false,
    noMissingGlyphs: false,
    onlyOneDarLogo: false,
    darLogoCentered: false,
    noEmptyEndScreen: false,
    noInventedCategory: false,
    durationValid: false
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
