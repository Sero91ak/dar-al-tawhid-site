const KIDS_VERSION_BODY = JSON.stringify({
  buildId: "kids-shell-v12-tab31",
  label: "KIDS · V0.31"
});

function kidsVersionResponse() {
  return new Response(KIDS_VERSION_BODY, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}

function isKidsHtmlPath(path) {
  return path === "/test/kids/start"
    || path === "/test/kids/start.html"
    || path === "/test/kids/index.html"
    || path === "/test/kids/shell.html"
    || path === "/test/kids"
    || path === "/test/kids/";
}

function patchKidsHtml(html) {
  if (!html) return html;
  if (!html.includes("kidsOverlayKillV1")) {
    html = html.replace(
      "</head>",
      '<style id="kidsOverlayKillV1">.kids-update-layer,.kids-update-layer.is-open{display:none!important;visibility:hidden!important;pointer-events:none!important;transform:none!important;height:0!important;overflow:hidden!important}</style></head>'
    );
  }
  html = html.replace("location.replace(u.toString());", "void 0;");
  html = html.replace(
    'try{ return localStorage.getItem(SEEN_KEY)!=="1"; }catch(e2){ return true; }',
    "return false;"
  );
  html = html.replace(
    "if(remote && remote!==KIDS_BUILD_ID)",
    "if(false && remote && remote!==KIDS_BUILD_ID)"
  );
  return html;
}

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

    // Kids-Haupteinstieg immer auf die kanonische /start-Oberfläche führen.
    // Dadurch nutzt /test/kids/ exakt dieselbe App-Shell wie der funktionierende
    // /test/kids/start-Aufruf und alte darsw-Cache-Buster können keine ältere
    // Root-Darstellung mit abgesetzter unterer Safe-Area mehr festhalten.
    if (url.pathname === "/test/kids" || url.pathname === "/test/kids/") {
      const target = new URL(request.url);
      target.pathname = "/test/kids/start";
      target.searchParams.delete("darsw");
      target.searchParams.set("kv", "kids-shell-v12-tab31");
      return Response.redirect(target.toString(), 307);
    }

    if (url.pathname === "/test/kids/version.json") {
      return kidsVersionResponse();
    }

    const asset = await env.ASSETS.fetch(request);
    const path = url.pathname;
    const kidsPath = path === "/test/kids" || path.startsWith("/test/kids/");
    if (kidsPath) {
      if (asset && asset.ok && isKidsHtmlPath(path)) {
        const html = patchKidsHtml(await asset.text());
        const headers = new Headers(asset.headers);
        headers.set("Content-Type", "text/html; charset=utf-8");
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        headers.delete("Content-Length");
        return new Response(html, { status: asset.status, statusText: asset.statusText, headers });
      }
      return asset;
    }
    const bust = /\/test\/(index\.html)?$/.test(path)
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
