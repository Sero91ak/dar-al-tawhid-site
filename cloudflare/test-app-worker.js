export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    const path = url.pathname;
    const kids = path === "/test/kids" || path.startsWith("/test/kids/");
    if (kids && url.hostname !== "kids-assets.internal" && request.headers.get("X-Kids-Asset") !== "1") {
      const assetPath = path === "/test/kids" || path === "/test/kids/"
        ? "/test/kids/index.html"
        : path;
      const assetResponse = await env.ASSETS.fetch(new Request(`https://kids-assets.internal${assetPath}${url.search}`, {
        method: "GET",
        headers: { "X-Kids-Asset": "1" }
      }));
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      headers.set("X-Kids-Build", "kids-shell-v12-start1");
      headers.delete("ETag");
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }

    const asset = await env.ASSETS.fetch(request);
    const bust = kids
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
