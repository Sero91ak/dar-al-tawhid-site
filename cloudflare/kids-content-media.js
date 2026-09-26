/**
 * Medienablage für Content Studio.
 * Staging: versionierte statische Test-Assets im Repo.
 * Live: eigene öffentliche assets/kids-content Struktur.
 * Große Produktions-WAVs werden nicht erwartet; Studio lädt für Audio kompaktes M4A/AAC hoch.
 */
const MAX_COVER_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_BYTES = 32 * 1024 * 1024;

function clean(v, max = 500) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

function safeId(v) {
  return clean(v, 90)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw mediaError("Ungültige Mediendatei", 422);
  const mime = clean(match[1], 120).toLowerCase();
  const base64 = match[2].replace(/\s+/g, "");
  let bytes;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch {
    throw mediaError("Base64-Mediendaten ungültig", 422);
  }
  return { mime, base64, bytes };
}

function extFor(mime, role) {
  const m = String(mime || "").toLowerCase();
  if (role === "cover") {
    if (m.includes("png")) return "png";
    if (m.includes("webp")) return "webp";
    if (m.includes("avif")) return "avif";
    return "jpg";
  }
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("aac")) return "aac";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  return "m4a";
}

async function sha256Hex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validateMime(role, mime) {
  const m = String(mime || "").toLowerCase();
  if (role === "cover") {
    if (!/^image\/(png|jpeg|jpg|webp|avif)$/.test(m)) throw mediaError("Cover-Format nicht erlaubt", 415);
    return;
  }
  if (role === "audio") {
    if (!/^audio\/(mp4|m4a|aac|mpeg|mp3|wav|x-wav)$/.test(m)) throw mediaError("Audio-Format nicht erlaubt", 415);
    return;
  }
  throw mediaError("Medienrolle muss cover oder audio sein", 422);
}

export async function persistKidsContentMedia(env, input, helpers) {
  const id = safeId(input?.id);
  const role = clean(input?.role, 20).toLowerCase();
  const staging = input?.staging !== false;
  if (!id) throw mediaError("Content-ID fehlt", 400);
  if (!["cover", "audio"].includes(role)) throw mediaError("Unbekannte Medienrolle", 422);

  let payload;
  if (input?.dataUrl) {
    payload = decodeDataUrl(input.dataUrl);
  } else if (input?.remoteUrl) {
    const remote = clean(input.remoteUrl, 1800);
    if (!/^https:\/\//i.test(remote)) throw mediaError("Nur HTTPS-Remote-URLs sind erlaubt", 422);
    const response = await fetch(remote, { redirect: "follow" });
    if (!response.ok) throw mediaError(`Remote-Medium nicht erreichbar (${response.status})`, 502);
    const bytes = new Uint8Array(await response.arrayBuffer());
    payload = {
      mime: clean(response.headers.get("content-type") || (role === "cover" ? "image/jpeg" : "audio/mp4"), 120).split(";")[0].toLowerCase(),
      bytes,
      base64: bytesToBase64(bytes)
    };
  } else {
    throw mediaError("Mediendaten fehlen", 400);
  }

  validateMime(role, payload.mime);
  const max = role === "cover" ? MAX_COVER_BYTES : MAX_AUDIO_BYTES;
  if (payload.bytes.byteLength > max) {
    throw mediaError(`${role === "cover" ? "Cover" : "Audio"} zu groß (max. ${Math.round(max / 1024 / 1024)} MB)`, 413);
  }
  if (payload.bytes.byteLength < 128) throw mediaError("Mediendatei ist leer oder beschädigt", 422);

  const sha256 = await sha256Hex(payload.bytes);
  const ext = extFor(payload.mime, role);
  const short = sha256.slice(0, 14);
  const root = staging ? "test/kids/media/studio" : "assets/kids-content";
  const path = `${root}/${id}/${role}-${short}.${ext}`;

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const batch = await helpers.githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    [{ path, binary: true, contentBase64: payload.base64 }],
    `Kids Studio ${staging ? "staging " : ""}${role} ${id} ${short}`
  );

  return {
    ok: true,
    id,
    role,
    staging,
    asset: {
      url: "/" + path,
      key: path,
      mime: payload.mime,
      bytes: payload.bytes.byteLength,
      sha256,
      source: input?.source ? clean(input.source, 80) : "studio-upload",
      type: role,
      originalName: clean(input?.originalName, 160)
    },
    commitSha: batch?.commitSha || ""
  };
}

export async function promoteKidsContentMedia(env, item, helpers) {
  if (!item) throw mediaError("Content-Paket fehlt", 400);
  const id = safeId(item.id);
  const entries = [];
  const replacements = {};

  for (const role of ["cover", "audio"]) {
    const asset = item?.[role];
    const key = clean(asset?.key, 800).replace(/^\/+/, "");
    if (!key) continue;
    if (!key.startsWith("test/kids/media/studio/")) {
      replacements[role] = asset;
      continue;
    }

    const owner = env.GITHUB_OWNER || "Sero91ak";
    const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
    const branch = env.GITHUB_BRANCH || "main";
    const file = await helpers.githubGet(env, owner, repo, key, branch);
    const b64 = String(file?.content || "").replace(/\s+/g, "");
    if (!b64) throw mediaError(`Staging-${role} fehlt: ${key}`, 404);

    const ext = key.split(".").pop() || extFor(asset?.mime, role);
    const livePath = `assets/kids-content/${id}/${role}-${clean(asset?.sha256, 100).slice(0, 14) || Date.now().toString(36)}.${ext}`;
    entries.push({ path: livePath, binary: true, contentBase64: b64 });
    replacements[role] = { ...asset, key: livePath, url: "/" + livePath, source: "studio-promoted" };
  }

  if (entries.length) {
    await helpers.githubCommitBatch(
      env,
      env.GITHUB_OWNER || "Sero91ak",
      env.GITHUB_REPO || "dar-al-tawhid-site",
      env.GITHUB_BRANCH || "main",
      entries,
      `Promote Kids Studio media ${id}`
    );
  }

  return { ok: true, cover: replacements.cover || item.cover, audio: replacements.audio || item.audio };
}

function bytesToBase64(bytes) {
  let out = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    out += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(out);
}

function mediaError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const KIDS_CONTENT_MEDIA_LIMITS = Object.freeze({
  coverBytes: MAX_COVER_BYTES,
  audioBytes: MAX_AUDIO_BYTES
});
