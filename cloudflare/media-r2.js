const MEDIA_PREFIXES = [
  "/assets/",
  "/kids/assets/",
  "/apple-tv/"
];

const MEDIA_EXT = /\.(?:avif|webp|png|jpe?g|gif|mp4|m4a|mp3|aac|ogg|wav)$/i;

export function isR2MediaPath(pathname) {
  const path = String(pathname || "");
  return MEDIA_EXT.test(path) && MEDIA_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function serveR2Media(request, url, env) {
  if (!env?.APP_MEDIA_R2) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (!isR2MediaPath(url.pathname)) return null;

  const key = url.pathname.replace(/^\/+/, "");
  try {
    const object = await env.APP_MEDIA_R2.get(key, {
      onlyIf: request.headers,
      range: request.headers
    });
    if (!object || !("body" in object)) return null;

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", headers.get("Cache-Control") || "public, max-age=31536000, immutable");
    headers.set("X-DAR-Media-Source", "r2");

    let status = 200;
    if (object.range && Number.isFinite(object.range.offset) && Number.isFinite(object.range.length)) {
      const start = Number(object.range.offset);
      const end = start + Number(object.range.length) - 1;
      headers.set("Content-Range", `bytes ${start}-${end}/${object.size}`);
      headers.set("Content-Length", String(object.range.length));
      status = 206;
    } else if (Number.isFinite(object.size)) {
      headers.set("Content-Length", String(object.size));
    }

    return new Response(request.method === "HEAD" ? null : object.body, {
      status,
      headers
    });
  } catch (_) {
    return null;
  }
}
