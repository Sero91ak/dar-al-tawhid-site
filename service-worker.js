/* DAR AL TAWḤID – combined Service Worker for OneSignal Web Push.
   Important: keep this file in the ROOT of the site: /service-worker.js */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener("install", function(event){
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(self.clients.claim());
});
