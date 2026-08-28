/** Keep website clicks on the website, native iOS clicks inside the app (never Safari). */

export function separatePushLaunchUrls(payload = {}) {
  const web = String(payload.web_url || payload.url || "").trim();
  const next = { ...payload };
  delete next.url;
  if (!web) return next;
  next.web_url = web;
  next.app_url = `daraltawhid://in-app?src=${encodeURIComponent(web)}`;
  return next;
}
