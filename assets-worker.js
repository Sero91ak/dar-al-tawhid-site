/**
 * Ensures /test/ always serves test/index.html (fixes stale directory-index CDN drift).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/test" || path === "/test/") {
      url.pathname = "/test/index.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  }
};
