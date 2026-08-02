import { DAR_VIDEO_PROFILE, emptyQualityChecks } from "./profile.js";

export function runQualityChecks({ statement, storyboard, clips, voice, render, providerMeta }) {
  const checks = emptyQualityChecks();
  const reasons = [];

  checks.sourceVerified = Boolean(statement?.verified && statement?.source && statement?.de);
  if (!checks.sourceVerified) reasons.push("Quelle oder Aussage nicht verifiziert");

  const prompts = (storyboard?.scenes || []).map((s) => String(s.fullPrompt || "").toLowerCase()).join(" ");
  checks.facesHidden = /face|gesicht|hidden|silhouette|back|rücken|shadow/.test(prompts) && !/front portrait|face visible/.test(prompts);
  if (!checks.facesHidden) reasons.push("Gesichtsregeln im Storyboard unklar");

  checks.handsAcceptable = /accurate hands|anatomically correct|keine deformierten/.test(prompts) || /hands/.test(prompts);
  if (!checks.handsAcceptable) reasons.push("Hand-/Körperregeln fehlen");

  checks.noMusic = DAR_VIDEO_PROFILE.safety.noMusic === true && !Boolean(render?.hasMusic);
  if (!checks.noMusic) reasons.push("Musikspur erkannt oder erlaubt");

  checks.audioValid = Boolean(voice?.ok && voice?.bytes > 1000) || Boolean(render?.audioAttached);
  if (!checks.audioValid) reasons.push("Stimme/Audio fehlt oder ist ungültig");

  checks.captionsSafe = Array.isArray(storyboard?.captionLines) && storyboard.captionLines.length >= 3;
  if (!checks.captionsSafe) reasons.push("Untertitel/Quellenzeilen unvollständig");

  checks.brandingComplete = Boolean(
    storyboard?.captionLines?.some((l) => /dar_al_tauhid|dar-al-tauhid|Serhat/i.test(l.text || ""))
  );
  if (!checks.brandingComplete) reasons.push("Branding-Zeilen fehlen");

  const clipOk = Array.isArray(clips) && clips.length >= 3 && clips.every((c) => c?.url || c?.providerJobId);
  checks.noFrozenFrames = clipOk && clips.every((c) => Number(c.durationSec || 0) >= 3);
  if (!checks.noFrozenFrames) reasons.push("Zu wenige oder zu kurze Bewegungsclips");

  const formatOk = Boolean(render?.width === 1080 && render?.height === 1920 && render?.fps === 30);
  checks.iphoneCompatible = Boolean(render?.ok && formatOk && /mp4|h264|avc/i.test(String(render?.mime || "video/mp4")));
  checks.androidCompatible = checks.iphoneCompatible;
  if (!checks.iphoneCompatible) reasons.push("MP4-Export noch nicht iPhone/Android-kompatibel");

  if (providerMeta?.simulated) {
    reasons.push("Nur Simulationslauf – kein echter Anbieterclip");
  }

  const required = [
    "sourceVerified",
    "facesHidden",
    "handsAcceptable",
    "noMusic",
    "audioValid",
    "captionsSafe",
    "brandingComplete",
    "noFrozenFrames",
    "iphoneCompatible",
    "androidCompatible"
  ];
  const ok = required.every((key) => checks[key] === true) && !providerMeta?.simulated;

  return {
    ok,
    checks,
    reasons,
    reviewedAt: new Date().toISOString()
  };
}
