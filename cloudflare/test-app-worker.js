const QURAN_AUDIO_EDITIONS = new Set([
  "ar.alafasy",
  "ar.abdurrahmaansudais",
  "ar.saoodshuraym",
  "ar.saudalshuraim",
  "ar.husary",
  "ar.husarymujawwad",
  "ar.minshawi",
  "ar.minshawimujawwad",
  "ar.abdulbasitmurattal",
  "ar.abdulbasitmujawwad",
  "ar.abdullahbasfar",
  "ar.ahmedajamy",
  "ar.hanirifai",
  "ar.hudhaify",
  "ar.mahermuaiqly",
  "ar.muhammadayyoub",
  "ar.muhammadjibreel",
  "ar.shaatree",
  "ar.yasseraldossari",
  "ar.aymanswoaid"
]);

async function proxyQuranAudio(request, url) {
  const match = url.pathname.match(/^\/quran-audio\/([^/]+)\/(\d+)\.mp3$/);
  if (!match) return null;
  const edition = decodeURIComponent(match[1] || "");
  const ayah = Number(match[2]);
  if (!QURAN_AUDIO_EDITIONS.has(edition) || !Number.isInteger(ayah) || ayah < 1 || ayah > 6236) {
    return new Response("Bad recitation request", { status: 400 });
  }
  const upstream = `https://cdn.islamic.network/quran/audio/128/${edition}/${ayah}.mp3`;
  const headers = new Headers();
  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);
  headers.set("Accept", "audio/mpeg,audio/*;q=0.9,*/*;q=0.8");
  const res = await fetch(upstream, {
    headers,
    cf: { cacheTtl: 31536000, cacheEverything: true, cacheKey: upstream }
  });
  const out = new Headers(res.headers);
  out.set("Cache-Control", "public, max-age=31536000, immutable");
  out.set("CDN-Cache-Control", "public, max-age=31536000, immutable");
  out.set("Access-Control-Allow-Origin", "*");
  out.set("Content-Type", res.headers.get("Content-Type") || "audio/mpeg");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const audio = await proxyQuranAudio(request, url);
      if (audio) return audio;
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return Response.redirect(`${url.origin}/test/${url.search || ""}`, 302);
    }

    if (url.pathname === "/test" || url.pathname === "/test/") {
      if (url.searchParams.get("dqp") !== "915") {
        url.searchParams.set("dqp", "915");
        return Response.redirect(url.toString(), 302);
      }
    }

    if (url.pathname === "/version.json") {
      const testVersionUrl = new URL("/test/version.json", url.origin);
      return env.ASSETS.fetch(new Request(testVersionUrl.toString(), request));
    }

    // Kids-Haupteinstieg immer auf die kanonische /start-Oberfläche führen.
    // Dadurch nutzt /test/kids/ exakt dieselbe App-Shell wie der funktionierende
    // /test/kids/start-Aufruf und alte darsw-Cache-Buster können keine ältere
    // Root-Darstellung mit abgesetzter unterer Safe-Area mehr festhalten.
    if (url.pathname === "/test/kids" || url.pathname === "/test/kids/") {
      const target = new URL(request.url);
      target.pathname = "/test/kids/start";
      target.searchParams.delete("darsw");
      target.searchParams.delete("kv");
      return Response.redirect(target.toString(), 307);
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const kidsPath = path === "/test/kids" || path.startsWith("/test/kids/");
    const bust = kidsPath
      || /\/test\/(index\.html)?$/.test(path)
      || /dar-quran-player\.(js|css)$/.test(path)
      || path.endsWith("/test/version.json")
      || path.endsWith("/test/service-worker.js");
    if (!bust || !asset) return asset;
    const out = new Response(asset.body, asset);
    out.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    out.headers.set("Pragma", "no-cache");
    return out;
  }
};
