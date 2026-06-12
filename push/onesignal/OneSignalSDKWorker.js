/* DAR AL TAWḤID – OneSignal worker with deterministic post deep-links. */
function readOneSignalClickUrl(notification) {
  const data = notification && notification.data ? notification.data : {};
  const custom = data.custom || {};
  const extra = data.additionalData || data.data || custom.a || {};
  const candidates = [
    data.url,
    data.launchURL,
    data.web_url,
    data.open_url,
    custom.u,
    custom.url,
    custom.web_url,
    extra.url,
    extra.web_url,
    extra.launchURL
  ];
  const postId = data.post_id || data.postId || extra.post_id || extra.postId;
  const targetUrl = candidates.find(Boolean) || (postId ? `/#post/${encodeURIComponent(postId)}` : "/#recent");
  return new URL(targetUrl, self.location.origin).href;
}

self.addEventListener("notificationclick", (event) => {
  const absoluteUrl = readOneSignalClickUrl(event.notification);

  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if ("navigate" in client) {
        await client.navigate(absoluteUrl);
        return client.focus();
      }
    }
    return clients.openWindow(absoluteUrl);
  })());
});
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
