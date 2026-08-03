import { DAR_VIDEO_PROFILE, emptyQualityChecks } from "./profile.js";

export function runQualityChecks({
  statement,
  storyboard,
  clips,
  voice,
  render,
  providerMeta,
  captionPlan
}) {
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

  const overlays = captionPlan?.overlays || storyboard?.captionPlan?.overlays || [];
  const roles = new Set(overlays.map((o) => o.role));
  checks.captionsSafe = overlays.length >= 4 && roles.has("speaker") && roles.has("statement") && roles.has("source") && roles.has("cta");
  if (!checks.captionsSafe) reasons.push("Texthierarchie/Einblendungen unvollständig");

  checks.textHierarchyOk = roles.has("speaker") && roles.has("statement") && roles.has("cta");
  if (!checks.textHierarchyOk) reasons.push("Sprecher-/Aussage-/CTA-Hierarchie fehlt");

  checks.brandingComplete = Boolean(
    render?.brandingApplied ||
    overlays.some((o) => o.role === "brand" || o.role === "cta") ||
    storyboard?.captionLines?.some((l) => /dar_al_tauhid|dar-al-tauhid|Serhat|DAR AL/i.test(l.text || ""))
  );
  if (!checks.brandingComplete) reasons.push("DAR-Branding fehlt");

  // Endfassung: kein Shotstack-Stage (Fremdwasserzeichen)
  const stageRisk = Boolean(render?.foreignWatermarkRisk) || String(render?.shotstackEnv || "") === "stage";
  checks.noForeignWatermark = Boolean(render?.ok) && !stageRisk && String(render?.shotstackEnv || "") !== "stage";
  if (render?.provider === "fal-ffmpeg" && !render?.brandingApplied) {
    checks.noForeignWatermark = true; // kein Shotstack-Wasserzeichen, aber Branding fehlt separat
  }
  if (!checks.noForeignWatermark) {
    reasons.push("Fremdwasserzeichen-Risiko (Shotstack Stage) – Endfassung braucht Production/v1");
  }

  checks.safeAreasOk = overlays.every((o) => Number(o.at || 0) >= 0 && Number(o.length || 0) >= 1.2);
  if (!checks.safeAreasOk) reasons.push("Einblendungs-Zeiten ungültig / Safe-Area-Risiko");

  const exactVoice = String(storyboard?.voiceScript || captionPlan?.voiceScript || "");
  checks.voiceExact = Boolean(
    exactVoice &&
    exactVoice.includes(String(statement?.de || "").trim()) &&
    exactVoice.includes(String(statement?.speaker || "").trim()) &&
    /sagte:/i.test(exactVoice)
  );
  if (!checks.voiceExact) reasons.push("Erzählertext weicht von Sprecher/Aussage ab");

  const clipOk = Array.isArray(clips) && clips.length >= 3 && clips.every((c) => c?.url || c?.providerJobId || c?.r2Key);
  checks.noFrozenFrames = clipOk && clips.every((c) => Number(c.durationSec || 0) >= 3);
  if (!checks.noFrozenFrames) reasons.push("Zu wenige oder zu kurze Bewegungsclips");

  const formatOk = Boolean(render?.width === 1080 && render?.height === 1920 && render?.fps === 30);
  checks.iphoneCompatible = Boolean(render?.ok && formatOk && /mp4|h264|avc/i.test(String(render?.mime || "video/mp4")));
  checks.androidCompatible = checks.iphoneCompatible;
  if (!checks.iphoneCompatible) reasons.push("MP4-Export noch nicht iPhone/Android-kompatibel");

  if (providerMeta?.simulated) reasons.push("Nur Simulationslauf – kein echter Anbieterclip");
  if (render?.provider === "fal-ffmpeg" && !render?.brandingApplied) {
    reasons.push("Compose ohne DAR-Texthierarchie/Wasserzeichen (Shotstack Production nötig)");
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
    "androidCompatible",
    "noForeignWatermark",
    "textHierarchyOk",
    "safeAreasOk",
    "voiceExact"
  ];
  const brandingGate = !(render?.provider === "fal-ffmpeg" && !render?.brandingApplied);
  const ok =
    required.every((key) => checks[key] === true) &&
    !providerMeta?.simulated &&
    brandingGate;

  return {
    ok,
    checks,
    reasons,
    reviewedAt: new Date().toISOString()
  };
}
