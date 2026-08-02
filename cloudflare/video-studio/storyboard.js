import { DAR_VIDEO_PROFILE } from "./profile.js";

export function buildStoryboard(statement) {
  const theme = String(statement?.topic || "Wissen").trim();
  const de = String(statement?.de || "").trim();
  const scenes = [
    {
      id: "s1",
      role: "opening",
      durationSec: 5,
      camera: "slow push-in, natural handheld micro-motion",
      setting: `quiet study space at dawn related to ${theme}`,
      action: "anonymous figure enters frame from behind, walks slowly toward soft light",
      promptFocus: "establishing atmosphere, warm natural light, dust motes"
    },
    {
      id: "s2",
      role: "reflection",
      durationSec: 5,
      camera: "gentle orbit around seated silhouette",
      setting: `bookshelf and parchment environment for ${theme}`,
      action: "anonymous figure seated with back to camera, reading by window light",
      promptFocus: "consistent clothing and room palette, face fully hidden"
    },
    {
      id: "s3",
      role: "emphasis",
      durationSec: 5,
      camera: "slow tilt from hands to environment, never revealing face",
      setting: `symbolic detail shot connected to: ${de.slice(0, 80)}`,
      action: "hands carefully turn pages or hold a book; fingers anatomically correct",
      promptFocus: "accurate hands, modest sleeves, cinematic depth of field"
    },
    {
      id: "s4",
      role: "closing",
      durationSec: 5,
      camera: "pull-back revealing room silhouette",
      setting: "peaceful corridor or courtyard at soft dusk",
      action: "anonymous figure walks away into soft shadow, contemplative ending",
      promptFocus: "real walking motion, no freeze, no zoom-only still"
    }
  ];

  return {
    version: 1,
    theme,
    statementId: statement?.id || "",
    speaker: statement?.speaker || "",
    source: statement?.source || "",
    voiceScript: buildVoiceScript(statement),
    captionLines: buildCaptionLines(statement),
    scenes: scenes.map((scene) => ({
      ...scene,
      negativePrompt: "face visible, front portrait, celebrity, prophet, named companion, deformed hands, extra fingers, horror, mask, music waveform, text, watermark, logo, collage, still image zoom",
      fullPrompt: [
        scene.setting,
        scene.action,
        scene.camera,
        scene.promptFocus,
        DAR_VIDEO_PROFILE.promptSafetySuffix
      ].join(". ")
    })),
    createdAt: new Date().toISOString()
  };
}

export function buildVoiceScript(statement) {
  const speaker = String(statement?.speaker || "Überlieferung").trim();
  const de = String(statement?.de || "").trim();
  const source = String(statement?.source || "").trim();
  return [
    `${speaker} sagte:`,
    de,
    `Quelle: ${source}.`,
    DAR_VIDEO_PROFILE.branding.followLine
  ].join(" ");
}

export function buildCaptionLines(statement) {
  return [
    { at: 0.4, text: String(statement?.speaker || "") },
    { at: 2.2, text: String(statement?.de || "") },
    { at: 16.5, text: `Quelle: ${String(statement?.source || "")}` },
    { at: 19.5, text: DAR_VIDEO_PROFILE.branding.followLine },
    { at: 22.0, text: `${DAR_VIDEO_PROFILE.branding.telegram} · ${DAR_VIDEO_PROFILE.branding.website}` },
    { at: 24.0, text: `${DAR_VIDEO_PROFILE.branding.instagram} · ${DAR_VIDEO_PROFILE.branding.credit}` }
  ].filter((line) => line.text);
}
