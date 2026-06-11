/* DAR AL TAWḤID – keep this file for OneSignal compatibility and old browser registrations. */
self.addEventListener("notificationclick", (event) => {
  const data = event.notification && event.notification.data ? event.notification.data : {};
  const custom = data.custom || data;
  const extra = data.additionalData || data.data || custom.a || {};
  const targetUrl = data.url || data.launchURL || data.web_url || custom.u || custom.url || extra.url || "/#recent";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

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
