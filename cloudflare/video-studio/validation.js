/**
 * Pflichtprüfungen vor Export (Sprach-Bildbeitrag).
 */
import { DAR_VIDEO_PROFILE } from "./profile.js";
import { DAR_VIDEO_DURATION_SEC, isForbiddenAutoLabel } from "./timeline.js";
import { validateGlyphCoverage } from "./glyphs.js";

export function emptyVideoValidation() {
  return {
    noForeignWatermark: false,
    noMissingGlyphs: false,
    onlyOneDarLogo: false,
    darLogoCentered: false,
    socialIconsValid: false,
    sourceReadable: false,
    textInsideSafeArea: false,
    noAnachronisticObjects: false,
    noVisibleFaces: false,
    noEmptyEndScreen: false,
    noInventedCategory: false,
    audioPresent: false,
    durationValid: false
  };
}

function textBlob(statement, captionPlan) {
  const parts = [
    statement?.speaker,
    statement?.honorific,
    statement?.de,
    statement?.source,
    statement?.fazit,
    ...(captionPlan?.overlays || []).map((o) => o.text)
  ];
  return parts.filter(Boolean).join("\n");
}

/**
 * Strukturelle Validierung vor/nach Compose (ohne Pixelanalyse).
 */
export function runVideoValidation({
  statement,
  storyboard,
  captionPlan,
  render,
  timelineMeta = null
} = {}) {
  const checks = emptyVideoValidation();
  const errors = [];
  const plan = captionPlan || storyboard?.captionPlan || {};
  const overlays = plan.overlays || [];
  const roles = new Set(overlays.map((o) => o.role));
  const brandCfg = DAR_VIDEO_PROFILE.branding;
  const safe = DAR_VIDEO_PROFILE.safeArea;
  const speechImage =
    storyboard?.mode === "speech-image" ||
    plan?.mode === "speech-image" ||
    timelineMeta?.mode === "speech-image" ||
    DAR_VIDEO_PROFILE.safety?.stillImageOnly === true;

  const glyph = validateGlyphCoverage(textBlob(statement, plan), {
    fonts: ["Amiri", "Noto Naskh Arabic", "Cormorant Garamond"]
  });
  checks.noMissingGlyphs = glyph.ok;
  if (!glyph.ok) {
    errors.push(`Glyphen fehlen (${glyph.missing.slice(0, 8).join(" ") || "unbekannt"}) – Export blockiert`);
  }

  const stageRisk =
    Boolean(render?.foreignWatermarkRisk) ||
    String(render?.shotstackEnv || "") === "stage" ||
    render?.composeFallback === "shotstack-stage";
  checks.noForeignWatermark = Boolean(render?.ok) && !stageRisk;
  if (!checks.noForeignWatermark) {
    errors.push("Fremdwasserzeichen-Risiko (SHOTSTACK Stage o.ä.) – Export blockiert");
  }

  const mark = timelineMeta?.watermark || {};
  checks.onlyOneDarLogo = Number(timelineMeta?.watermarkCount ?? 1) === 1;
  if (!checks.onlyOneDarLogo) errors.push("Mehr als ein DAR-Logo – Export blockiert");

  checks.darLogoCentered =
    String(mark.position || "center") === "center" &&
    Number(mark.scale || 0) >= 0.32 &&
    Number(mark.opacity || 0) > 0 &&
    Number(mark.opacity || 0) <= 0.12;
  if (!checks.darLogoCentered) {
    errors.push("DAR-Logo muss mittig, groß und dezent (7–10 % Deckkraft) sein");
  }

  const cta = overlays.find((o) => o.role === "cta");
  checks.socialIconsValid = Boolean(
    cta?.social?.telegram === brandCfg.telegram &&
      cta?.social?.instagram === brandCfg.instagram &&
      cta?.social?.website === brandCfg.website
  );
  if (!checks.socialIconsValid) errors.push("Social-Icons/Handles unvollständig oder abweichend");

  const source = overlays.find((o) => o.role === "source");
  const sourceText = String(source?.text || statement?.source || "").trim();
  checks.sourceReadable =
    sourceText.length >= 8 && Number(source?.length || 0) >= 2;
  if (!checks.sourceReadable) errors.push("Quelle unlesbar oder zu kurz eingeblendet (<2s)");

  checks.textInsideSafeArea =
    Number(safe.topPx || 0) >= 80 &&
    Number(safe.bottomPx || 0) >= 80 &&
    Number(safe.sidePx || 0) >= 56 &&
    overlays.every((o) => Number(o.at || 0) >= 0 && Number(o.length || 0) >= 1.2);
  if (!checks.textInsideSafeArea) errors.push("Text/Safe-Area verletzt");

  if (speechImage) {
    // Standbild bleibt unverändert – keine generativen Prompt-Checks
    checks.noAnachronisticObjects = Boolean(storyboard?.fromStill || storyboard?.sceneImageUrl || timelineMeta?.sceneImageUrl);
    checks.noVisibleFaces = checks.noAnachronisticObjects;
  } else {
    const prompts = (storyboard?.scenes || []).map((s) => `${s.fullPrompt || ""} ${s.negativePrompt || ""}`).join(" ").toLowerCase();
    checks.noAnachronisticObjects =
      /no modern|historically|preserve the original|no cars|automobile|vehicle/.test(prompts) &&
      /car|vehicle|automobile|motorcycle/.test((storyboard?.scenes || []).map((s) => s.negativePrompt || "").join(" ").toLowerCase());
    checks.noVisibleFaces =
      /face|hidden|silhouette|back|anonymous|cropped|shadow/.test(prompts) || Boolean(storyboard?.prophetRelated);
  }
  if (!checks.noAnachronisticObjects) errors.push("Anachronismus-/Fahrzeug-Regeln unklar");
  if (!checks.noVisibleFaces) errors.push("Gesichtsregeln unklar");

  const duration = Number(
    render?.durationSeconds || timelineMeta?.durationSec || storyboard?.durationSec || DAR_VIDEO_DURATION_SEC
  );
  checks.noEmptyEndScreen = Boolean(
    roles.has("cta") &&
      Number(cta?.length || 0) >= 2 &&
      Number(cta?.at || 0) + Number(cta?.length || 0) >= duration - 0.6 &&
      (timelineMeta?.lastClipCoversEnd === true || timelineMeta?.background !== "#070b14")
  );
  if (!checks.noEmptyEndScreen) errors.push("Leeres/schwarzes Schlussbild-Risiko");

  const topic = String(statement?.topic || storyboard?.theme || "").trim();
  const hay = `${statement?.de || ""} ${statement?.raw || ""} ${statement?.fazit || ""}`;
  const brandOverlay = overlays.find((o) => o.role === "brand");
  checks.noInventedCategory = !brandOverlay?.topic && !overlays.some((o) =>
    o.role === "brand" && isForbiddenAutoLabel(o.text)
  );
  if (isForbiddenAutoLabel(topic) && !hay.toLowerCase().includes(topic.toLowerCase()) && brandOverlay?.topic) {
    checks.noInventedCategory = false;
  }
  if (!checks.noInventedCategory) {
    errors.push("Erfundenes Kategorie-Label im Brand-Overlay (z.B. Dhikr)");
  }

  checks.audioPresent = Boolean(render?.audioAttached) || render?.provider === "shotstack";
  if (render && !checks.audioPresent) errors.push("Audiospur fehlt");

  checks.durationValid = duration >= 8 && duration <= 180;
  if (!checks.durationValid) errors.push(`Dauer ungültig (${duration}s, erwartet 8–180s je nach Stimme)`);

  const required = Object.keys(checks);
  const ok = required.every((k) => checks[k] === true);
  return {
    ok,
    checks,
    errors,
    glyph,
    previewFrameHints: timelineMeta?.previewFrames || [2, 6, 11, 14],
    blocked: !ok
  };
}

/** Export blockieren, wenn Pflichtchecks fehlschlagen */
export function assertExportAllowed(validation) {
  if (validation?.ok) return { ok: true };
  return {
    ok: false,
    blocked: true,
    reason: (validation?.errors || ["Validierung fehlgeschlagen"]).join(" · ")
  };
}
