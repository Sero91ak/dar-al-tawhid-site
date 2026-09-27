const CACHE_NAME="dar-al-tawhid-kids-v45";
const PRECACHE=[
  "/test/kids/index.html",
  "/test/kids/start.html",
  "/test/kids/shell.html",
  "/test/kids/manifest.webmanifest",
  "/test/kids/data/alphabet-kids.json",
  "/test/kids/data/alphabet-audio.json",
  "/test/kids/data/dua-kids.json",
  "/test/kids/data/quiz-kids.json",
  "/test/kids/data/stories-authentic.json",
  "/test/kids/data/verified-content.json",
  "/test/kids/icons/icon-192.png?v=logo28",
  "/test/kids/icons/icon-512.png?v=logo28",
  "/test/kids/icons/apple-touch-icon.png?v=logo28"
];

self.addEventListener("install",function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){return cache.addAll(PRECACHE)})
      .then(function(){return self.skipWaiting()})
  );
});

self.addEventListener("activate",function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key.indexOf("dar-al-tawhid-kids-")===0&&key!==CACHE_NAME;
      }).map(function(key){return caches.delete(key)}));
    }).then(function(){return self.clients.claim()})
  );
});

function isKidsRequest(url){
  if(url.origin!==self.location.origin)return false;
  return url.pathname.indexOf("/test/kids/")===0||url.pathname.indexOf("/assets/kids-alphabet-audio/")===0;
}
function networkFirst(request,fallback){
  return fetch(request,{cache:"no-store"}).then(function(response){
    if(response&&response.ok){
      var copy=response.clone();
      caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)}).catch(function(){});
    }
    return response;
  }).catch(function(){
    return caches.match(request).then(function(hit){
      if(hit)return hit;
      return fallback?caches.match(fallback):Response.error();
    });
  });
}
function cacheFirst(request){
  return caches.match(request).then(function(hit){
    if(hit)return hit;
    return fetch(request).then(function(response){
      if(response&&(response.ok||response.type==="opaque")){
        var copy=response.clone();
        caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)}).catch(function(){});
      }
      return response;
    });
  });
}
function staleWhileRevalidate(request){
  return caches.open(CACHE_NAME).then(function(cache){
    return cache.match(request).then(function(hit){
      var fresh=fetch(request,{cache:"no-store"}).then(function(response){
        if(response&&response.ok)cache.put(request,response.clone());
        return response;
      }).catch(function(){return null});
      return hit||fresh.then(function(response){return response||Response.error()});
    });
  });
}

self.addEventListener("fetch",function(event){
  var request=event.request;
  if(request.method!=="GET")return;
  var url=new URL(request.url);
  if(!isKidsRequest(url))return;

  if(request.mode==="navigate"||request.destination==="document"){
    event.respondWith(networkFirst(request,"/test/kids/start.html"));
    return;
  }
  if(url.pathname==="/test/kids/version.json"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname.indexOf("/test/kids/data/")===0){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
