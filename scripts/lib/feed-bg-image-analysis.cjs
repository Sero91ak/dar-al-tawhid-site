/**
 * Luminanz-/Kontrast-Metadaten für Feed-Hintergründe (Node + ffmpeg).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

function hexLuminance(hex) {
  const h = String(hex || "").replace(/^0x/i, "#").replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function analyzeRawGray(buf, w, h) {
  const zones = {
    top: { y0: 0, y1: Math.floor(h / 3) },
    middle: { y0: Math.floor(h / 3), y1: Math.floor((2 * h) / 3) },
    bottom: { y0: Math.floor((2 * h) / 3), y1: h }
  };
  const out = {};
  let total = 0;
  let totalN = 0;
  let varianceSum = 0;
  for (const key of Object.keys(zones)) {
    const { y0, y1 } = zones[key];
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        const v = buf[y * w + x] / 255;
        sum += v;
        n++;
        total += v;
        totalN++;
      }
    }
    out[key + "Luminance"] = n ? sum / n : 0.5;
  }
  const avg = totalN ? total / totalN : 0.5;
  for (let i = 0; i < buf.length; i++) {
    const d = buf[i] / 255 - avg;
    varianceSum += d * d;
  }
  const busyScore = Math.min(1, Math.sqrt(varianceSum / Math.max(1, buf.length)) * 3.2);
  const safeTextZones = [];
  [["top", out.topLuminance], ["middle", out.middleLuminance], ["bottom", out.bottomLuminance]].forEach(([z, lum]) => {
    if (Math.abs(lum - 0.5) > 0.12 && busyScore < 0.62) safeTextZones.push(z);
  });
  if (!safeTextZones.length) safeTextZones.push("middle", "bottom");
  const recommendedTextTone = avg >= 0.58 ? "dark" : avg <= 0.42 ? "light" : (out.middleLuminance >= 0.55 ? "dark" : "light");
  let recommendedOverlay = "none";
  if (busyScore >= 0.52) recommendedOverlay = "soft-light-protection";
  else if (avg >= 0.62 || avg <= 0.32) recommendedOverlay = "soft-light-protection";
  let contrastHint = "good";
  if (busyScore >= 0.55) contrastHint = "busy";
  else if (Math.abs(out.middleLuminance - 0.5) < 0.08) contrastHint = "low";
  return {
    averageLuminance: round3(avg),
    topLuminance: round3(out.topLuminance),
    middleLuminance: round3(out.middleLuminance),
    bottomLuminance: round3(out.bottomLuminance),
    busyScore: round3(busyScore),
    recommendedTextTone,
    recommendedOverlay,
    contrastHint,
    safeTextZones
  };
}

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

function analyzeImageFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const w = 48;
  const h = 60;
  const tmp = path.join(os.tmpdir(), `feed-lum-${Date.now()}-${Math.random().toString(36).slice(2)}.raw`);
  try {
    execSync(
      `ffmpeg -y -hide_banner -loglevel error -i "${filePath}" -vf "scale=${w}:${h},format=gray" -frames:v 1 -f rawvideo "${tmp}"`,
      { stdio: "pipe" }
    );
    const buf = fs.readFileSync(tmp);
    if (buf.length < w * h) return null;
    return analyzeRawGray(buf, w, h);
  } catch (e) {
    return null;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

function metaFromDominantColor(dominantColor) {
  const lum = hexLuminance(dominantColor);
  return {
    averageLuminance: round3(lum),
    topLuminance: round3(lum * 0.96),
    middleLuminance: round3(lum),
    bottomLuminance: round3(lum * 0.88),
    busyScore: 0.18,
    recommendedTextTone: lum >= 0.55 ? "dark" : "light",
    recommendedOverlay: lum >= 0.62 ? "soft-light-protection" : "none",
    contrastHint: "good",
    safeTextZones: ["middle", "bottom"]
  };
}

module.exports = { analyzeImageFile, analyzeRawGray, metaFromDominantColor, hexLuminance };
