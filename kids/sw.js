const CACHE_NAME="dar-al-tawhid-kids-v125";
const PRECACHE=[
  "/kids/manifest.webmanifest",
  "/kids/assets/kids-art/quran-reise-v11-clean.png",
  "/kids/assets/kids-art/hero-entdecke.png",
  "/kids/assets/kids-art/home-journey-v11-clean2.jpg",
  "/kids/data/alphabet-kids.json",
  "/kids/data/alphabet-audio.json",
  "/kids/data/dua-kids.json",
  "/kids/data/quiz-kids.json",
  "/kids/data/quiz-audio.json",
  "/kids/quiz-owner-voice.js?v=1",
  "/kids/data/stories-authentic.json",
  "/kids/data/prophet-stories.json",
  "/kids/prophet-stories.css?v=21",
  "/kids/prophet-muhammad-v22.css?v=38",
  "/kids/prophet-stories.js?v=37",
  "/kids/assets/prophet-scenes/library.webp",
  "/kids/assets/prophet-scenes/garden.webp",
  "/kids/assets/prophet-scenes/ocean.webp",
  "/kids/assets/prophet-scenes/desert.webp",
  "/kids/assets/prophet-scenes/mountain.webp",
  "/kids/assets/prophet-scenes/royal.webp",
  "/kids/assets/prophet-scenes/water.webp",
  "/kids/assets/prophet-scenes/night.webp",
  "/kids/assets/story-wow/muhammad-hero.jpg",
  "/kids/assets/story-wow/muhammad-route.jpg",
  "/kids/assets/story-wow/muhammad-hira.jpg",
  "/kids/assets/story-wow/muhammad-madinah.jpg",
  "/kids/assets/story-wow/v22-muhammad-hero.jpg",
  "/kids/assets/story-wow/v22-muhammad-route.jpg",
  "/kids/assets/story-wow/v22-muhammad-hira.jpg",
  "/kids/assets/story-wow/v22-muhammad-madinah.jpg",
  "/kids/assets/story-wow/v22-stories-header.jpg",
  "/kids/assets/story-wow/v22-prophet-library.jpg",
  "/kids/assets/story-wow/v22-coin-story.jpg",
  "/kids/stories-reference-v31.css?v=46",
  "/kids/assets/story-wow/v30-muhammad-home.jpg",
  "/kids/assets/story-wow/v30-muhammad-birth.jpg",
  "/kids/assets/story-wow/v31-story-water.jpg",
  "/kids/assets/story-wow/v31-story-helper.jpg",
  "/kids/assets/story-wow/v31-story-kindword.jpg",
  "/kids/assets/story-wow/v32-story-water.jpg",
  "/kids/assets/story-wow/v32-story-helper.jpg",
  "/kids/assets/story-wow/v32-story-kindword.jpg",
  "/kids/assets/story-wow/v36-coin-story.jpg",
  "/kids/assets/prophet-symbols/muhammad.webp",
  "/kids/assets/prophet-symbols/adam.webp",
  "/kids/assets/prophet-symbols/idris.webp",
  "/kids/assets/prophet-symbols/nuh.webp",
  "/kids/assets/prophet-symbols/hud.webp",
  "/kids/assets/prophet-symbols/salih.webp",
  "/kids/assets/prophet-symbols/ibrahim.webp",
  "/kids/data/verified-content.json",
  "/kids/icons/icon-192.png?v=logo28",
  "/kids/icons/icon-512.png?v=logo28",
  "/kids/icons/apple-touch-icon.png?v=logo28"
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
  return url.pathname.indexOf("/kids/")===0||url.pathname.indexOf("/assets/kids-alphabet-audio/")===0;
}
function networkFirst(request,fallback){
  return fetch(request,{cache:"no-store"}).then(function(response){
    if(response&&response.ok){
      var copy=response.clone();
      caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)}).catch(function(){});
    }
    return response;
  }).catch(function(){
    return caches.match(request,{ignoreSearch:true}).then(function(hit){
      if(hit)return hit;
      return fallback?caches.match(fallback,{ignoreSearch:true}):Response.error();
    });
  });
}
function cacheFirst(request){
  return caches.match(request,{ignoreSearch:true}).then(function(hit){
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

  if(request.mode==="navigate"||request.destination==="document"||url.pathname==="/kids/start"||url.pathname==="/kids/start.html"||url.pathname==="/kids/start/"||url.pathname==="/kids/"||url.pathname==="/kids/index.html"||url.pathname==="/kids/shell.html"){
    event.respondWith(fetch(request,{cache:"no-store"}));
    return;
  }
  if(url.pathname.indexOf("/kids/assets/kids-cinema/")===0&&url.pathname.indexOf(".mp4")>0){
    event.respondWith(fetch(request));
    return;
  }
  if(url.pathname==="/kids/version.json"||url.pathname==="/kids/prophet-stories.js"||url.pathname==="/kids/prophet-stories.css"||url.pathname==="/kids/prophet-muhammad-v22.css"||url.pathname==="/kids/stories-reference-v31.css"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname.indexOf("/kids/data/")===0){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
