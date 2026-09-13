/** Keep website clicks on the website, native iOS clicks inside the app (never Safari). */

export function withReliableIosPush(payload = {}) {
  const next = { ...payload };
  const data = next.data && typeof next.data === "object" && !Array.isArray(next.data)
    ? { ...next.data }
    : {};
  const launch = String(next.web_url || next.url || data.url || "").trim();
  if (launch && !data.url) data.url = launch;
  next.data = data;
  next.target_channel = next.target_channel || "push";
  next.ios_sound = next.ios_sound || "default";
  next.extra = { ...(next.extra || {}), ios_sound: next.ios_sound };
  next.ttl = Number(next.ttl) > 0 ? Number(next.ttl) : 3600;
  if (next.priority == null) next.priority = 10;
  if (!next.ios_interruption_level) next.ios_interruption_level = "active";
  return next;
}

export function separatePushLaunchUrls(payload = {}) {
  const web = String(payload.web_url || payload.url || "").trim();
  const next = { ...payload };
  if (web) {
    next.url = web;
    next.web_url = web;
    if (!next.app_url) next.app_url = `daraltawhid://in-app?src=${encodeURIComponent(web)}`;
  }
  return withReliableIosPush(next);
}
