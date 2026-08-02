/* Verbindliches DAR-Video-Profil (dar-standard-v1) */

export const DAR_VIDEO_PROFILE = Object.freeze({
  id: "dar-standard-v1",
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
  branding: Object.freeze({
    logoHint: "Original-Logo DAR AL TAWḤĪD",
    watermark: "dezentes Wasserzeichen",
    followLine: "Folgt für mehr Wissen aus Qurʾān & Sunnah",
    telegram: "@dar_al_tauhid",
    website: "dar-al-tauhid.de",
    instagram: "@dar_at_tawhid",
    credit: "by Serhat Abu Malik"
  }),
  safety: Object.freeze({
    noProphetDepiction: true,
    noIdentifiableCompanions: true,
    anonymousFiguresOnly: true,
    facesFullyHidden: true,
    noMusic: true,
    naturalAtmosphereOnly: true,
    manualApprovalRequired: true,
    noVisitorPush: true
  }),
  promptSafetySuffix: [
    "Photorealistic cinematic Islamic educational short film, vertical 9:16.",
    "Only anonymous symbolic figures: backs turned, silhouettes, deep shadow, or cropped so faces are completely hidden.",
    "No depiction of the Prophet, no identifiable Sahabah, Salaf, or scholars.",
    "Modest clothing, natural lighting, gentle camera motion, real movement, no horror masks, no deformed hands or bodies.",
    "No text overlays in the generated clip, no logos, no watermarks, no music."
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
    noFrozenFrames: false
  };
}
