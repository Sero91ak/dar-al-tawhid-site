export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return Response.redirect(`${url.origin}/test/${url.search || ""}`, 302);
    }

    if (url.pathname === "/test" || url.pathname === "/test/") {
      if (url.searchParams.get("dqp") !== "924") {
        url.searchParams.set("dqp", "924");
        return Response.redirect(url.toString(), 302);
      }
    }

    if (url.pathname === "/version.json") {
      const testVersionUrl = new URL("/test/version.json", url.origin);
      return env.ASSETS.fetch(new Request(testVersionUrl.toString(), request));
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const bust = /\/test\/(index\.html)?$/.test(path)
      || /dar-quran-player\.(js|css)$/.test(path)
      || /adaptive-layout\.(js|css)$/.test(path)
      || /fold-split\.(js|css)$/.test(path)
      || /fold-thumb-nav\.(js|css)$/.test(path)
      || path.endsWith("/test/version.json")
      || path.endsWith("/test/service-worker.js");
    if (!bust || !asset) return asset;
    const out = new Response(asset.body, asset);
    out.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    out.headers.set("Pragma", "no-cache");
    return out;
  }
};
