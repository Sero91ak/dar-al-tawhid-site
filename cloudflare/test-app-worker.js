export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

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

    const kidsEntry =
      path === "/test/kids"
      || path === "/test/kids/start"
      || path === "/test/kids/start.html"
      || path === "/test/kids/index.html";

    if (kidsEntry) {
      const fileUrl = new URL("/test/kids/start.html", url.origin);
      const asset = await env.ASSETS.fetch(new Request(fileUrl.toString(), { method: "GET" }));
      const headers = new Headers(asset.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      headers.set("Pragma", "no-cache");
      headers.set("CDN-Cache-Control", "no-store");
      headers.delete("Location");
      return new Response(asset.body, { status: 200, headers });
    }

    return env.ASSETS.fetch(request);
  }
};
