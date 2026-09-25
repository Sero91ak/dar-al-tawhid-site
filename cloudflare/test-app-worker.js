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

    // Kids: never use the cached /test/kids/ directory document (307/HIT v11).
    // Serve the real file through the worker first.
    let assetUrl = url;
    if (url.pathname === "/test/kids" || url.pathname === "/test/kids/") {
      assetUrl = new URL("/test/kids/index.html", url.origin);
      assetUrl.search = url.search;
    }

    const assetReq = new Request(assetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      redirect: "manual"
    });
    const asset = await env.ASSETS.fetch(assetReq);
    const path = url.pathname;
    const bust = /\/test\/(index\.html)?$/.test(path)
      || /dar-quran-player\.(js|css)$/.test(path)
      || path.endsWith("/test/version.json")
      || path.endsWith("/test/service-worker.js")
      || path === "/test/kids"
      || path === "/test/kids/"
      || path.startsWith("/test/kids/");
    if (!bust || !asset) return asset;
    const out = new Response(asset.body, asset);
    out.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    out.headers.set("Pragma", "no-cache");
    out.headers.set("CDN-Cache-Control", "no-store");
    out.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    if (path === "/test/kids" || path === "/test/kids/" || path.startsWith("/test/kids/")) {
      out.headers.set("X-Kids-Build", "kids-shell-v12-reload1");
    }
    return out;
  }
};
