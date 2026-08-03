function r2(env) {
  return env.VIDEO_STUDIO_R2 || env.VIDEO_STUDIO_BUCKET || null;
}

export function hasVideoStudioR2(env) {
  return Boolean(r2(env));
}

export async function putVideoAsset(env, key, bytes, contentType = "application/octet-stream") {
  const bucket = r2(env);
  if (!bucket) return { ok: false, reason: "VIDEO_STUDIO_R2 Binding fehlt" };
  const path = String(key || "").replace(/^\/+/, "");
  await bucket.put(path, bytes, {
    httpMetadata: { contentType },
    customMetadata: { createdAt: new Date().toISOString() }
  });
  return { ok: true, key: path, contentType, bytes: bytes?.byteLength || bytes?.length || 0 };
}

export async function getVideoAsset(env, key) {
  const bucket = r2(env);
  if (!bucket) return null;
  return bucket.get(String(key || "").replace(/^\/+/, ""));
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let out = 0;
  for (let i = 0; i < left.length; i++) out |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return out === 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(message || "")));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSignedAssetUrl(env, { jobId, key, ttlSec = 900, baseUrl }) {
  const secret = String(env.VIDEO_STUDIO_SIGNING_SECRET || env.ADMIN_PUBLISH_SECRET || "").trim();
  if (!secret) return { ok: false, reason: "VIDEO_STUDIO_SIGNING_SECRET fehlt" };
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, Number(ttlSec) || 900);
  const payload = `${jobId}:${key}:${exp}`;
  const sig = await hmacHex(secret, payload);
  const origin = String(
    baseUrl ||
    env.VIDEO_STUDIO_PUBLIC_BASE ||
    "https://dar-admin-publisher.sero91ak.workers.dev"
  ).replace(/\/$/, "");
  const url = `${origin}/api/admin/video-studio/assets/${encodeURIComponent(jobId)}?key=${encodeURIComponent(key)}&exp=${exp}&sig=${sig}`;
  return { ok: true, url, exp };
}

export async function verifySignedAssetRequest(env, { jobId, key, exp, sig }) {
  const secret = String(env.VIDEO_STUDIO_SIGNING_SECRET || env.ADMIN_PUBLISH_SECRET || "").trim();
  const expires = Number(exp || 0);
  if (!secret || !jobId || !key || !expires || !sig) return false;
  if (expires < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacHex(secret, `${jobId}:${key}:${expires}`);
  return timingSafeEqual(expected, String(sig));
}

export async function listVideoPrefix(env, prefix) {
  const bucket = r2(env);
  if (!bucket?.list) return [];
  const listed = await bucket.list({ prefix: String(prefix || "").replace(/^\/+/, ""), limit: 200 });
  return listed?.objects || [];
}

export async function deleteVideoPrefix(env, prefix) {
  const objects = await listVideoPrefix(env, prefix);
  const bucket = r2(env);
  for (const obj of objects) {
    if (obj?.key) await bucket.delete(obj.key);
  }
  return { ok: true, deleted: objects.length };
}
