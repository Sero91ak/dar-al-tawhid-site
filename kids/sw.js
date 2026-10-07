const CACHE_NAME="dar-al-tawhid-kids-v1225";
const KIDS_BUILD_ID="kids-shell-v129-quiz-restore1225";
const CORE_PRECACHE=[
  "/kids/assets/kids-home-v1219/dar-title-reference.png?v=1223",
  "/kids/start",
  "/kids/start.html",
  "/kids/manifest.webmanifest",
  "/kids/version.json",
  "/kids/section-heroes-v1095.css?v=1123-dua-quiz-art",
  "/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",
  "/kids/assets/kids-art/section-quran-v1090.jpg?v=1090",
  "/kids/assets/kids-art/section-parents-v1097.png?v=1097-real3",
  "/kids/assets/kids-art/home-journey-v11-clean2.jpg",
  "/kids/assets/kids-art/knowledge-courtyard-v11.jpg",
  "/kids/assets/kids-art/dua-home-v11.jpg",
  "/kids/assets/kids-art/hero-entdecke.png",
  "/kids/assets/kids-home-v1176/hero-cinema.png",
  "/kids/assets/kids-home-v1179/hero-poster.png?v=1188",
  "/kids/assets/kids-home-v1191/hero-static-reference.jpg?v=1199",
  "/kids/assets/kids-home-v1215/hero-clean-reference.jpg?v=1215",
  "/kids/assets/kids-home-v1219/dar-title-reference.png?v=1220",
  "/assets/fonts/cinzel-latin-600-normal.woff2",
  "/kids/assets/kids-home-v1176/world-stories.png",
  "/kids/assets/kids-home-v1176/world-quran.png",
  "/kids/assets/kids-home-v1176/world-dua.png",
  "/kids/assets/kids-brand/hero-warm-world.png?v=1175",
  "/kids/assets/stories-home/prophets-v1133.webp?v=1136",
  "/kids/assets/stories-home/sahaba-v1133.webp?v=1136",
  "/kids/assets/stories-home/sahabiyyat-v1133.webp?v=1136",
  "/kids/assets/stories-home/coin-v1133.webp?v=1136",
  "/kids/data/stories-authentic.json",
  "/kids/data/prophet-stories.json",
  "/kids/data/mubashshirun-stories.json",
  "/kids/data/sahabiyyat-stories.json",
  "/kids/assets/sahabiyyat/khadijah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/aishah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/fatimah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/hafsah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/zaynab-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/asma-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/umm-sulaym-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/umm-atiyyah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/umm-habibah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/umm-salamah-v1124.webp?v=1124",
  "/kids/assets/sahabiyyat/sawdah-v1128.jpg?v=1128",
  "/kids/assets/sahabiyyat/juwayriyyah-v1128.jpg?v=1128",
  "/kids/assets/sahabiyyat/safiyyah-v1128.jpg?v=1128",
  "/kids/assets/sahabiyyat/maymunah-v1128.jpg?v=1128",
  "/kids/data/story-hub.json?v=7",
  "/kids/deen-learning-v1199.css?v=1199",
  "/kids/deen-lessons.css?v=2",
  "/kids/deen-lessons.js?v=4",
  "/kids/data/deen-lessons.json?v=3",
  "/kids/assets/deen/deen-entry.jpg?v=1206",
  "/kids/assets/deen/tawhid.jpg?v=1206",
  "/kids/assets/deen/iman.jpg?v=1206",
  "/kids/assets/deen/asma-sifat.jpg?v=1206",
  "/kids/assets/deen/ibadah.jpg?v=1206",
  "/kids/assets/deen/adab-akhlaq.jpg?v=1206",
  "/kids/assets/deen/akhirah.jpg?v=1206",
  "/kids/data/dua-kids.json",
  "/kids/data/dua-audio.json",
  "/kids/data/dua-arabic-audio.json",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-afiyah.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-after-eating.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-eating.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-guidance-taqwa.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-leave-home.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-mosque-enter.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-mosque-exit.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-sleep.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-toilet-enter.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-toilet-exit.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-wake.m4a",
  "/kids/assets/kids-dua-arabic-audio/v4-20261007/dua-ya-muqallib.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-accept-deeds.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-afiyah.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-after-eating.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-clear-speech.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-eating.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-guidance-taqwa.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-heart-guidance.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-knowledge.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-leave-home.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-mosque-enter.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-mosque-exit.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-parents.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-protection.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-rabbana-atina.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-repentance.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-sleep.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-toilet-enter.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-toilet-exit.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-wake.m4a",
  "/kids/assets/kids-dua-audio/v4-20261007/dua-ya-muqallib.m4a",
  "/kids/assets/kids-owner-voice/996533039c958c21c976.m4a",
  "/kids/assets/kids-owner-voice/cd31c4ca743ad8173e90.m4a",
  "/kids/data/verified-content.json",
  "/kids/prophet-stories.css?v=42",
  "/kids/story-policy.js?v=2",
  "/kids/prophet-stories.js?v=42",
  "/kids/mubashshirun-stories.css?v=29",
  "/kids/sahabiyyat-stories.css?v=7",
  "/kids/story-card-system.css?v=2",
  "/kids/mubashshirun-stories.js?v=31",
  "/kids/sahabiyyat-stories.js?v=23",
  "/kids/story-follow-reader.css?v=10",
  "/kids/screen-awake.js?v=1",
  "/kids/story-follow-reader.js?v=16",
  "/kids/story-hub.css?v=12",
  "/kids/stories-home-v1133.css?v=1152",
  "/kids/stories-home-v1138.css?v=1152",
  "/kids/story-hub.js?v=25",
  "/kids/global-story-glow-v1216.css?v=1217",
  "/kids/global-story-glow-v1216.js?v=1217",
  "/kids/dua-hub-v1219.css?v=1221",
  "/kids/dua-hub-v1219.js?v=1221",
  "/kids/assets/dua-3d/book.svg?v=1221",
  "/kids/assets/dua-3d/family.svg?v=1221",
  "/kids/assets/dua-3d/moon.svg?v=1221",
  "/kids/assets/dua-3d/food.svg?v=1221",
  "/kids/assets/dua-3d/home.svg?v=1221",
  "/kids/assets/dua-3d/mosque.svg?v=1221",
  "/kids/assets/dua-3d/shield.svg?v=1221",
  "/kids/navigation-v1182.js?v=1183",
  "/kids/kids-age-typography.css?v=5",
  "/kids/story-library-cards.css?v=9",
  "/kids/kids-touch-rail.css?v=12",
  "/kids/kids-card-interaction.js?v=5",
  "/kids/kids-age-typography.js?v=3",
  "/kids/owner-voice.js?v=6",
  "/kids/dua-smart-learn.css?v=2",
  "/kids/dua-smart-learn.js?v=2",
  "/kids/content-studio-feed.js?v=studio7",
  "/kids/assets/kids-open-v95.css?v=97",
  "/kids/assets/kids-open-v95.js?v=97",
  "/kids/icons/icon-192.png?v=logo28",
  "/kids/icons/icon-512.png?v=logo28",
  "/kids/icons/apple-touch-icon.png?v=logo28",
  "/kids/assets/prophets-v2/muhammad-card.jpg?v=22"
];
const PRECACHE=CORE_PRECACHE.concat([
  "/kids/assets/kids-art/quran-reise-v11-clean.png",
  "/kids/assets/kids-art/quran-home-v1053.jpg",
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
  "/kids/assets/quiz-scenes/quiz-4-6.svg?v=20261004-real1",
  "/kids/assets/quiz-scenes/quiz-4-6-v2.png?v=20261004-v2",
  "/kids/assets/quiz-scenes/quiz-7-8-v2.png?v=20261004-v2",
  "/kids/assets/quiz-scenes/quiz-9-10-v2.png?v=20261004-v2",
  "/kids/assets/quiz-scenes/topic-creation-v2.png?v=20261004-v2",
  "/kids/assets/quiz-scenes/quiz-7-8.svg?v=20261004-real1",
  "/kids/assets/quiz-scenes/quiz-9-10.svg?v=20261004-real1",
  "/kids/assets/quiz-scenes/topic-creation.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-quran.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-home.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-salah.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-adab.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-dua.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-charity.svg?v=20261004-topic1",
  "/kids/assets/quiz-scenes/topic-prophets.svg?v=20261004-topic2",
  "/kids/assets/quiz-scenes/topic-tawhid.svg?v=20261004-topic2",
  "/kids/assets/quiz-scenes/topic-iman.svg?v=20261004-topic2",
  "/kids/assets/quiz-scenes/topic-akhlaq.svg?v=20261004-topic2",
  "/kids/assets/quiz-scenes/topic-patience.svg?v=20261004-topic3",
  "/kids/assets/quiz-scenes/topic-justice.svg?v=20261004-topic3",
  "/kids/data/quiz-kids.json",
  "/kids/data/quiz-audio.json",
  "/kids/data/dua-audio.json",
  "/kids/data/owner-voice-audio.json",
  "/kids/quiz-library.css?v=7",
  "/kids/quiz-library.js?v=7",
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
  "/kids/stories-final-v1088.css?v=1148",
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
  "/kids/assets/prophet-symbols/ibrahim.webp"
]);

function addQuiet(cache,url){
  return cache.add(url).catch(function(){});
}
function fillCache(urls){
  return caches.open(CACHE_NAME).then(function(cache){
    var chain=Promise.resolve();
    urls.forEach(function(url){
      chain=chain.then(function(){return addQuiet(cache,url)});
    });
    return chain;
  });
}

self.addEventListener("install",function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){
        return Promise.all(CORE_PRECACHE.map(function(url){return addQuiet(cache,url)}));
      })
      .then(function(){return self.skipWaiting()})
  );
});

self.addEventListener("activate",function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key.indexOf("dar-al-tawhid-kids-")===0&&key!==CACHE_NAME;
      }).map(function(key){return caches.delete(key)}));
    }).then(function(){
      return self.clients.claim();
    }).then(function(){
      // Große Bilder und Zusatzmedien nicht mehr automatisch vorladen.
      // Sie werden erst beim tatsächlichen Öffnen des Bereichs geladen und danach gecacht.
      return self.clients.matchAll({type:"window",includeUncontrolled:true});
    }).then(function(clients){
      return Promise.all(clients.map(function(client){
        try{
          var u=new URL(client.url);
          if(u.origin!==self.location.origin||u.pathname.indexOf("/kids/")!==0)return Promise.resolve();
          if(u.searchParams.get("kv")===KIDS_BUILD_ID)return Promise.resolve();
          u.pathname="/kids/start";
          u.search="";
          u.searchParams.set("kv",KIDS_BUILD_ID);
          if(typeof client.navigate==="function")return client.navigate(u.toString()).catch(function(){});
        }catch(e){}
        return Promise.resolve();
      }));
    })
  );
});

function isKidsRequest(url){
  if(url.origin!==self.location.origin)return false;
  return url.pathname.indexOf("/kids/")===0;
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
    return caches.match(new URL(request.url).pathname).then(function(bare){
      if(bare)return bare;
      return fetch(request).then(function(response){
        if(response&&(response.ok||response.type==="opaque")){
          var copy=response.clone();
          caches.open(CACHE_NAME).then(function(cache){cache.put(request,copy)}).catch(function(){});
        }
        return response;
      });
    });
  });
}
function staleWhileRevalidate(request){
  return caches.open(CACHE_NAME).then(function(cache){
    return cache.match(request).then(function(hit){
      var fresh=fetch(request).then(function(response){
        if(response&&response.ok)cache.put(request,response.clone());
        return response;
      }).catch(function(){return null});
      if(hit){
        fresh.catch(function(){});
        return hit;
      }
      return fresh.then(function(response){return response||Response.error()});
    });
  });
}

self.addEventListener("fetch",function(event){
  var request=event.request;
  if(request.method!=="GET")return;
  var url=new URL(request.url);
  if(!isKidsRequest(url))return;

  if(request.mode==="navigate"||request.destination==="document"||url.pathname==="/kids/start"||url.pathname==="/kids/start.html"||url.pathname==="/kids/start/"||url.pathname==="/kids/"||url.pathname==="/kids/index.html"||url.pathname==="/kids/shell.html"){
    event.respondWith(networkFirst(request,"/kids/start"));
    return;
  }
  /* Safari/iOS video uses HTTP Range requests. Never serve MP4 through cacheFirst,
     otherwise a cached full response can make the hero appear completely static. */
  if(request.destination==="video"||/\.mp4$/i.test(url.pathname)){
    event.respondWith(fetch(request));
    return;
  }
  if(url.pathname.indexOf("/kids/assets/prophet-story-audio/")===0||url.pathname.indexOf("/kids/assets/mubashshirun-story-audio/")===0||url.pathname.indexOf("/kids/assets/sahabiyyat-story-audio/")===0||url.pathname.indexOf("/kids/assets/kids-owner-voice/")===0||url.pathname.indexOf("/kids/assets/kids-quiz-audio/")===0||url.pathname.indexOf("/kids/assets/kids-dua-audio/")===0||url.pathname.indexOf("/kids/assets/kids-dua-arabic-audio/")===0){
    event.respondWith(fetch(request));
    return;
  }
  if(url.pathname==="/kids/data/quiz-audio.json"||url.pathname==="/kids/data/dua-audio.json"||url.pathname==="/kids/data/dua-arabic-audio.json"||url.pathname==="/kids/data/dua-learning-timings.json"||url.pathname==="/kids/data/owner-voice-audio.json"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* PROPHET LIBRARY RUNTIME: network-first so card structure/text changes are immediate. */
  if(url.pathname==="/kids/prophet-stories.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* STORY LIBRARY RUNTIME: network-first so restored structure is immediate on iOS/PWA. */
  if(url.pathname==="/kids/mubashshirun-stories.js"||url.pathname==="/kids/sahabiyyat-stories.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* DĪN DETAIL RUNTIME: network-first so reading/mode repairs are immediate. */
  if(url.pathname==="/kids/deen-lessons.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* GLOBAL CARD INTERACTION: network-first so touch glow/runtime updates immediately. */
  if(url.pathname==="/kids/kids-card-interaction.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* GLOBAL TOUCH RAIL: always network-first so interaction styling updates immediately. */
  if(url.pathname==="/kids/kids-touch-rail.css"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* STORY LIBRARY CSS: always network-first so visual repairs appear immediately on iOS/PWA. */
  if(url.pathname==="/kids/story-library-cards.css"||url.pathname==="/kids/story-card-system.css"||url.pathname==="/kids/mubashshirun-stories.css"||url.pathname==="/kids/sahabiyyat-stories.css"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname==="/kids/stories-home-v1133.css"||url.pathname==="/kids/stories-home-v1138.css"||url.pathname==="/kids/stories-final-v1088.css"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname==="/kids/version.json"){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if(url.pathname.indexOf("/kids/data/")===0){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if(url.pathname.indexOf("/kids/assets/")===0||url.pathname.indexOf("/kids/icons/")===0){
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
