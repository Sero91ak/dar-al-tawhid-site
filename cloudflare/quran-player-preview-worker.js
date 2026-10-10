// An isolated preview-only worker: never handles dar-al-tawhid.de or installed apps.
function previewHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("X-Dar-Quran-Preview", "isolated-v3");
  headers.delete("ETag");
  headers.delete("Content-Length");
  return new Response(response.body, {status:response.status, statusText:response.statusText,headers});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed",{status:405,headers:{Allow:"GET, HEAD"}});
    if (url.pathname === "/health") return Response.json({ok:true,service:"dar-quran-players-showcase-v3",version:3},{
      headers:{"Cache-Control":"no-store","Access-Control-Allow-Origin":"*"}
    });
    if (url.pathname === "/") url.pathname = "/index.html";
    const result = await env.ASSETS.fetch(new Request(url,request));
    if (!result.ok) return new Response("Diese Vorschau wurde nicht gefunden.",{status:result.status,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
    return /\.html$/i.test(url.pathname) ? previewHeaders(result) : result;
  }
};
