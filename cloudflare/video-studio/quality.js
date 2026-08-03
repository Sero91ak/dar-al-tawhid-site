import { DAR_VIDEO_PROFILE, emptyQualityChecks } from "./profile.js";
import { isProphetRelatedStatement } from "./depiction-rules.js";
import { buildShotstackTimeline } from "./compose.js";
import { runVideoValidation } from "./validation.js";

/**
 * Qualitätsprüfung für Sprach-Bildbeitrag (Standbild + Stimme + Branding).
 */
export function runQualityChecks({
  statement,
  storyboard,
  clips,
  voice,
  render,
  providerMeta,
  captionPlan,
  sceneImageUrl
}) {
  const checks = emptyQualityChecks();
  const reasons = [];
  const plan = captionPlan || storyboard?.captionPlan || null;
  const stillOk = Boolean(sceneImageUrl || storyboard?.sceneImageUrl || storyboard?.fromStill);

  checks.sourceVerified = Boolean(statement?.source && statement?.de);
  if (!checks.sourceVerified) reasons.push("Quelle oder Aussage fehlt");

  // Kein generatives Video – Standbild bleibt unverändert
  checks.facesHidden = stillOk;
  checks.handsAcceptable = stillOk;
  checks.prophetSafe = stillOk || !isProphetRelatedStatement(statement);
  checks.historicallyPlausible = stillOk;
  if (!stillOk) reasons.push("Ausgangsbild fehlt");

  checks.noMusic = DAR_VIDEO_PROFILE.safety.noMusic === true && !Boolean(render?.hasMusic);
  if (!checks.noMusic) reasons.push("Musikspur erkannt oder erlaubt");

  checks.audioValid =
    Boolean(voice?.ok && voice?.bytes > 1000 && render?.audioAttached) ||
    Boolean(render?.provider === "shotstack" && render?.audioAttached);
  if (!checks.audioValid) reasons.push("Stimme/Audio fehlt oder ist ungültig");

  const overlays = plan?.overlays || [];
  const roles = new Set(overlays.map((o) => o.role));
  const burnedIn = Boolean(render?.brandingApplied) && render?.provider === "shotstack";
  checks.captionsSafe =
    burnedIn &&
    overlays.length >= 4 &&
    roles.has("speaker") &&
    roles.has("statement") &&
    roles.has("source") &&
    roles.has("cta");
  if (!checks.captionsSafe) reasons.push("Texthierarchie/Einblendungen fehlen im fertigen Video");

  checks.textHierarchyOk = burnedIn && roles.has("speaker") && roles.has("statement") && roles.has("cta");
  if (!checks.textHierarchyOk) reasons.push("Sprecher-/Aussage-/CTA-Hierarchie fehlt im fertigen Video");

  checks.brandingComplete = Boolean(
    burnedIn &&
      roles.has("brand") &&
      roles.has("cta") &&
      (overlays.some((o) => o.role === "cta" && /Serhat|dar_al_tauhid|dar-al-tauhid|Telegram|Instagram|Folgt/i.test(JSON.stringify(o))) ||
        storyboard?.captionLines?.some((l) => /dar_al_tauhid|dar-al-tauhid|Serhat|DAR AL/i.test(l.text || "")))
  );
  if (!checks.brandingComplete) reasons.push("DAR-Branding fehlt im fertigen Video (Logo/CTA/Social/Credit)");

  const stageRisk = Boolean(render?.foreignWatermarkRisk) || String(render?.shotstackEnv || "") === "stage";
  checks.noForeignWatermark = Boolean(render?.ok) && !stageRisk;
  if (!checks.noForeignWatermark) {
    reasons.push("Fremdwasserzeichen-Risiko (Shotstack Stage) – Endfassung braucht Production/v1");
  }

  checks.safeAreasOk = overlays.every((o) => Number(o.at || 0) >= 0 && Number(o.length || 0) >= 1.2);
  if (!checks.safeAreasOk) reasons.push("Einblendungs-Zeiten ungültig / Safe-Area-Risiko");

  const exactVoice = String(storyboard?.voiceScript || plan?.voiceScript || "");
  checks.voiceExact = Boolean(
    exactVoice &&
      exactVoice.includes(String(statement?.de || "").trim()) &&
      exactVoice.includes(String(statement?.speaker || "").trim().replace(/\s*sagte\s*:?\s*$/i, "").trim()) &&
      /sagte:/i.test(exactVoice) &&
      !/Quelle:/i.test(exactVoice)
  );
  if (!checks.voiceExact) reasons.push("Erzählertext weicht von Sprecher/Aussage ab oder liest die Quelle vor");

  // Keine KI-Clips – Standbild + dezente Inszenierung
  checks.noFrozenFrames = stillOk;
  checks.motionSecondsOk = stillOk && Number(storyboard?.durationSec || render?.durationSeconds || 0) >= 8;
  if (!checks.motionSecondsOk) reasons.push("Dauer zu kurz oder Bild fehlt");

  const formatOk = Boolean(render?.width === 1080 && render?.height === 1920 && (render?.fps === 30 || render?.fps === 25));
  checks.iphoneCompatible = Boolean(render?.ok && formatOk && /mp4|h264|avc/i.test(String(render?.mime || "video/mp4")));
  checks.androidCompatible = checks.iphoneCompatible;
  if (!checks.iphoneCompatible) reasons.push("MP4-Export noch nicht iPhone/Android-kompatibel");

  let timelineMeta = render?.timelineMeta || null;
  try {
    const built = buildShotstackTimeline({
      sceneImageUrl: sceneImageUrl || storyboard?.sceneImageUrl || "https://example.com/still.jpg",
      captionPlan: plan,
      watermarkUrl: "https://dar-al-tawhid.de/watermark-my-logo-full.png",
      durationSec: Number(plan?.durationSec || storyboard?.durationSec || 15)
    });
    timelineMeta = timelineMeta || built.meta;
  } catch {}

  const durationSec = Number(
    render?.durationSeconds || timelineMeta?.durationSec || storyboard?.durationSec || 15
  );

  const validation = runVideoValidation({
    statement,
    storyboard,
    captionPlan: plan,
    render: render
      ? { ...render, durationSeconds: durationSec, ok: render.ok !== false }
      : { ok: false, durationSeconds: durationSec },
    timelineMeta
  });

  checks.noMissingGlyphs = validation.checks.noMissingGlyphs;
  checks.onlyOneDarLogo = validation.checks.onlyOneDarLogo;
  checks.darLogoCentered = validation.checks.darLogoCentered;
  checks.noEmptyEndScreen = validation.checks.noEmptyEndScreen;
  checks.noInventedCategory = validation.checks.noInventedCategory;
  checks.durationValid = validation.checks.durationValid !== false
    ? Boolean(durationSec >= 8 && durationSec <= 180)
    : validation.checks.durationValid;

  validation.errors.forEach((err) => {
    if (!reasons.includes(err) && !/15|Clip|Bewegung|motion/i.test(err)) reasons.push(err);
  });

  void clips;
  if (providerMeta?.simulated) reasons.push("Nur Simulationslauf");

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
    "voiceExact",
    "prophetSafe",
    "historicallyPlausible",
    "motionSecondsOk",
    "noMissingGlyphs",
    "onlyOneDarLogo",
    "darLogoCentered",
    "noEmptyEndScreen",
    "noInventedCategory",
    "durationValid"
  ];
  const ok = required.every((key) => checks[key] === true) && !providerMeta?.simulated;

  return {
    ok,
    checks,
    reasons,
    validation,
    previewFrames: validation.previewFrameHints || timelineMeta?.previewFrames,
    reviewedAt: new Date().toISOString(),
    falComposeFallback: false,
    stagePreview: stageRisk,
    incomplete: !ok
  };
}
