const CACHE_NAME="dar-al-tawhid-kids-v1093";
const PRECACHE=[
  "/kids/manifest.webmanifest",
  "/kids/section-heroes-v1095.css?v=1097-real3",
  "/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",
  "/kids/assets/kids-art/section-quran-v1090.jpg?v=1090",
  "/kids/assets/kids-art/section-parents-v1097.png?v=1097-real3",
  "/kids/assets/kids-art/quran-reise-v11-clean.png",
  "/kids/assets/kids-art/quran-home-v1053.jpg",
  "/kids/assets/kids-art/quran-alphabet-v1053.jpg",
  "/kids/assets/kids-art/quran-surahs-v1053.jpg",
  "/kids/assets/kids-art/quran-verses-v1053.jpg",
  "/kids/assets/kids-art/surah-001-al-fatihah-v13.jpg",
  "/kids/assets/kids-art/surah-112-al-ikhlas-v13.jpg",
  "/kids/assets/kids-art/surah-113-al-falaq-v13.jpg",
  "/kids/assets/kids-art/surah-114-an-nas-v13.jpg",
  "/kids/assets/kids-art/surah-108-al-kawthar-v13.jpg",
  "/kids/assets/kids-art/surah-103-al-asr-v13.jpg",
  "/kids/assets/kids-art/surah-105-al-fil-v13.jpg",
  "/kids/assets/kids-art/surah-106-quraysh-v13.jpg",
  "/kids/assets/kids-art/surah-109-al-kafirun-v13.jpg",
  "/kids/assets/kids-art/surah-110-an-nasr-v13.jpg",
  "/kids/assets/kids-art/hero-entdecke.png",
  "/kids/assets/kids-art/home-journey-v11-clean2.jpg",
  "/kids/data/alphabet-kids.json",
  "/kids/data/alphabet-audio.json",
  "/kids/data/dua-kids.json",
  "/kids/data/quiz-kids.json",
  "/kids/data/quiz-audio.json",
  "/kids/data/owner-voice-audio.json",
  "/kids/owner-voice.js?v=1",
  "/kids/data/stories-authentic.json",
  "/kids/data/prophet-stories.json",
  "/kids/data/mubashshirun-stories.json",
  "/kids/assets/sahaba-mubashshirun/abu-bakr.jpg",
  "/kids/assets/sahaba-mubashshirun/umar.jpg",
  "/kids/assets/sahaba-mubashshirun/uthman.jpg",
  "/kids/assets/sahaba-mubashshirun/ali.jpg",
  "/kids/assets/sahaba-mubashshirun/talha.jpg",
  "/kids/assets/sahaba-mubashshirun/zubayr.jpg",
  "/kids/assets/sahaba-mubashshirun/abd-ar-rahman.jpg",
  "/kids/assets/sahaba-mubashshirun/sad.jpg",
  "/kids/assets/sahaba-mubashshirun/said.jpg",
  "/kids/assets/sahaba-mubashshirun/abu-ubaydah.jpg",
  "/kids/mubashshirun-stories.css?v=15",
  "/kids/mubashshirun-stories.js?v=15-audioonly2",
  "/kids/story-follow-reader.css?v=4",
  "/kids/story-follow-reader.js?v=5",
  "/kids/content-studio-feed.js?v=studio4",
  "/kids/kids-age-typography.css?v=4",
  "/kids/kids-age-typography.js?v=3",
  "/kids/prophet-stories.css?v=28",
  "/kids/stories-final-v1088.css?v=1088",
  "/kids/prophet-stories.js?v=28-audioonly2",
  "/kids/assets/prophet-scenes/library.webp",
  "/kids/assets/prophet-scenes/garden.webp",
  "/kids/assets/prophet-scenes/ocean.webp",
  "/kids/assets/prophet-scenes/desert.webp",
  "/kids/assets/prophet-scenes/mountain.webp",
  "/kids/assets/prophet-scenes/royal.webp",
  "/kids/assets/prophet-scenes/water.webp",
  "/kids/assets/prophet-scenes/night.webp",
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

  if(request.mode==="navigate"||request.destination==="document"||url.pathname==="/kids/start"||url.pathname==="/kids/start.html"||url.pathname==="/kids/start/"||url.pathname==="/kids/"||url.pathname==="/kids/index.html"||url.pathname==="/kids/shell.html"){
    event.respondWith(fetch(request,{cache:"no-store"}));
    return;
  }
  if(url.pathname.indexOf("/kids/assets/kids-cinema/")===0&&url.pathname.indexOf(".mp4")>0){
    event.respondWith(fetch(request));
    return;
  }
  if(url.pathname.indexOf("/kids/assets/prophet-story-audio/")===0||url.pathname.indexOf("/kids/assets/mubashshirun-story-audio/")===0||url.pathname.indexOf("/kids/assets/kids-owner-voice/")===0||url.pathname.indexOf("/kids/assets/kids-quiz-audio/")===0){
    // Native <audio> / iOS sends Range requests. Do not satisfy those from Cache API,
    // otherwise seeking and resume can receive a full 200 response instead of 206.
    event.respondWith(fetch(request));
    return;
  }
  if(url.pathname==="/kids/version.json"||url.pathname==="/kids/prophet-stories.js"||url.pathname==="/kids/prophet-stories.css"||url.pathname==="/kids/stories-final-v1088.css"||url.pathname==="/kids/mubashshirun-stories.js"||url.pathname==="/kids/mubashshirun-stories.css"||url.pathname==="/kids/story-follow-reader.js"||url.pathname==="/kids/story-follow-reader.css"||url.pathname==="/kids/content-studio-feed.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname.indexOf("/kids/data/")===0){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
