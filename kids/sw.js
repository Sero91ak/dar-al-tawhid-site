const CACHE_NAME="dar-al-tawhid-kids-v1313";
const KIDS_OFFLINE_CACHE="dar-al-tawhid-kids-offline-v1";
const KIDS_BUILD_ID="kids-shell-v201-dua-v4-1306";
const DUA_AUDIO_RUNTIME="1244";
// QUIZ_HOME_RESTORE_V1225: refresh installed PWAs with the restored Quiz entry.
const CORE_PRECACHE=[
  "/kids/assets/kids-salah-v1272/hero-home.png?v=1272",
  "/kids/assets/kids-salah-v1272/hero-home.png?v=1274",
  "/kids/akademie/index.html",
  "/kids/assets/kids-salah-v1272/hero-day.png?v=1277",
  "/kids/assets/kids-salah-v1272/fajr.png?v=1277",
  "/kids/assets/kids-salah-v1272/dhuhr.png?v=1277",
  "/kids/assets/kids-salah-v1272/asr.png?v=1277",
  "/kids/assets/kids-salah-v1272/maghrib.png?v=1277",
  "/kids/assets/kids-salah-v1272/isha.png?v=1277",
  "/kids/assets/kids-salah-v1262/cinematic-still.jpg",
  "/kids/prayer-stage-v1261.css?v=1304",
  "/kids/prayer-stage-v1261.js?v=1306",
  "/kids/assets/kids-home-v1222/dar-title-reference-clean.svg?v=1229",
  "/kids/assets/kids-home-v1219/dar-title-reference.png?v=1229",
  "/kids/assets/kids-home-v1219/dar-title-reference.png?v=1229",
  "/kids/start",
  "/kids/start.html",
  "/kids/manifest.webmanifest",
  "/kids/version.json",
  "/kids/section-heroes-v1095.css?v=1255-parent-hero-safe",
  "/kids/profile-stability-v1256.css?v=1258",
  "/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",
  "/kids/assets/kids-art/section-quran-v1090.jpg?v=1090",
  "/kids/assets/kids-art/section-parents-v1097.png?v=1097-real3",
  "/kids/assets/parents-hero/boy-profile-v1254.jpg",
  "/kids/assets/parents-hero/girl-profile-v1254.jpg",
  "/kids/assets/kids-art/home-journey-v11-clean2.jpg",
  "/kids/assets/kids-art/knowledge-courtyard-v11.jpg",
  "/kids/assets/kids-art/dua-home-v11.jpg",
  "/kids/assets/kids-art/hero-entdecke.png",
  "/kids/assets/kids-home-v1176/hero-cinema.png",
  "/kids/assets/kids-home-v1179/hero-poster.png?v=1188",
  "/kids/assets/kids-home-v1191/hero-static-reference.jpg?v=1199",
  "/kids/assets/kids-home-v1215/hero-clean-reference.jpg?v=1215",
  "/kids/assets/kids-home-v1219/dar-title-reference.png?v=1229",
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
  "/kids/global-detail-dock-v1247.css?v=1297",
  "/kids/global-detail-dock-v1247.js?v=1278",
  "/kids/data/deen-lessons.json?v=3",
  "/kids/assets/deen/deen-entry.jpg?v=1206",
  "/kids/assets/deen/tawhid.jpg?v=1206",
  "/kids/assets/deen/iman.jpg?v=1206",
  "/kids/assets/deen/asma-sifat.jpg?v=1206",
  "/kids/assets/deen/ibadah.jpg?v=1206",
  "/kids/assets/deen/adab-akhlaq.jpg?v=1206",
  "/kids/assets/deen/akhirah.jpg?v=1206",
  "/kids/data/dua-kids.json?v=1244",
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
  "/kids/story-follow-reader.js?v=17",
  "/kids/story-hub.css?v=12",
  "/kids/stories-home-v1133.css?v=1152",
  "/kids/stories-home-v1138.css?v=1152",
  "/kids/story-hub.js?v=25",
  "/kids/global-story-glow-v1216.css?v=1217",
  "/kids/global-story-glow-v1216.js?v=1239",
  "/kids/dua-hub-v1219.css?v=1278",
  "/kids/term-learning.js?v=1",
  // KIDS_TERM_AUDIO_PRECACHE_START
  "/kids/data/term-learning-audio.json?v=1",
  "/kids/assets/kids-term-audio/dua-basic-9e98890d5ea8.m4a",
  "/kids/assets/kids-term-audio/dua-deep-8e02908cd81d.m4a",
  "/kids/assets/kids-term-audio/salah-basic-e71b84bf3061.m4a",
  "/kids/assets/kids-term-audio/salah-deep-1090a20afb5c.m4a",
  "/kids/assets/kids-term-audio/wudu-basic-984b65822206.m4a",
  "/kids/assets/kids-term-audio/wudu-deep-19b4c7cfd6b4.m4a",
  "/kids/assets/kids-term-audio/sawm-basic-335fd1ba9d65.m4a",
  "/kids/assets/kids-term-audio/sawm-deep-5dcc4ed0bd54.m4a",
  "/kids/assets/kids-term-audio/zakat-basic-ddba6e6757b1.m4a",
  "/kids/assets/kids-term-audio/zakat-deep-828bb57c6c9b.m4a",
  "/kids/assets/kids-term-audio/tawhid-basic-34d28d5f88e9.m4a",
  "/kids/assets/kids-term-audio/tawhid-deep-e4f9de89c531.m4a",
  "/kids/assets/kids-term-audio/iman-basic-ec0364cea9d4.m4a",
  "/kids/assets/kids-term-audio/iman-deep-e866b9472708.m4a",
  "/kids/assets/kids-term-audio/sunnah-basic-05495797ca64.m4a",
  "/kids/assets/kids-term-audio/sunnah-deep-ae42ef7042ca.m4a",
  "/kids/assets/kids-term-audio/hadith-basic-4ca8212fb47e.m4a",
  "/kids/assets/kids-term-audio/hadith-deep-3ab14633e844.m4a",
  "/kids/assets/kids-term-audio/tawakkul-basic-9288f5008910.m4a",
  "/kids/assets/kids-term-audio/tawakkul-deep-794bd2fa787e.m4a",
  "/kids/assets/kids-term-audio/shirk-basic-64375cb12cba.m4a",
  "/kids/assets/kids-term-audio/shirk-deep-c56d4b61d31a.m4a",
  "/kids/assets/kids-term-audio/sahabah-basic-a73126e46118.m4a",
  "/kids/assets/kids-term-audio/sahabah-deep-b7d69746e2de.m4a",
  "/kids/assets/kids-term-audio/ayah-basic-8efb3d960c9e.m4a",
  "/kids/assets/kids-term-audio/ayah-deep-751c91595bf5.m4a",
  "/kids/assets/kids-term-audio/surah-basic-c38ca4f39adb.m4a",
  "/kids/assets/kids-term-audio/surah-deep-41c98027b4f3.m4a",
  "/kids/assets/kids-term-audio/ibadah-basic-6c2cdfc5797b.m4a",
  "/kids/assets/kids-term-audio/ibadah-deep-3fd75ba82d20.m4a",
  "/kids/assets/kids-term-audio/dhikr-basic-0211e533409e.m4a",
  "/kids/assets/kids-term-audio/dhikr-deep-cfde6d8199a7.m4a",
  "/kids/assets/kids-term-audio/istighfar-basic-9d1bd062f243.m4a",
  "/kids/assets/kids-term-audio/istighfar-deep-a2b52653799b.m4a",
  "/kids/assets/kids-term-audio/shayatin-basic-61c60d5712f6.m4a",
  "/kids/assets/kids-term-audio/shayatin-deep-88325399338e.m4a",
    // KIDS_TERM_AUDIO_PRECACHE_END
  "/kids/dua-hub-v1219.js?v=1279",
  "/kids/assets/profile-avatars/boy-kufi-v1235.svg",
  "/kids/assets/profile-avatars/girl-hijab-pink-v1235.svg",
  "/kids/assets/dua-premium/hero-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/nav-dua-v1222.png?v=1233",
  "/kids/assets/dua-premium/action-library-v1222.png?v=1233",
  "/kids/assets/dua-premium/action-learn-v1222.png?v=1233",
  "/kids/assets/dua-premium/action-random-v1222.png?v=1233",
  "/kids/assets/dua-premium/knowledge-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/family-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/protection-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/sleep-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/food-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/home-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/mosque-v1222.jpg?v=1233",
  "/kids/assets/dua-premium/knowledge-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/knowledge-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/family-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/family-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/protection-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/protection-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/sleep-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/sleep-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/food-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/food-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/home-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/home-3-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/mosque-2-v1233.jpg?v=1233",
  "/kids/assets/dua-premium/mosque-3-v1233.jpg?v=1233",
  "/kids/assets/dua-3d/book.svg?v=1221",
  "/kids/assets/dua-3d/family.svg?v=1221",
  "/kids/assets/dua-3d/moon.svg?v=1221",
  "/kids/assets/dua-3d/food.svg?v=1221",
  "/kids/assets/dua-3d/home.svg?v=1221",
  "/kids/assets/dua-3d/mosque.svg?v=1221",
  "/kids/assets/dua-3d/shield.svg?v=1221",
  "/kids/navigation-v1182.js?v=1299",
  "/kids/kids-age-typography.css?v=5",
  "/kids/story-library-cards.css?v=9",
  "/kids/kids-touch-rail.css?v=16",
  "/kids/kids-card-interaction.js?v=6",
  "/kids/kids-age-typography.js?v=3",
  "/kids/owner-voice.js?v=8",
  "/kids/dua-smart-learn.css?v=1261",
  "/kids/dua-layout-v1259.css?v=1311",
  "/kids/dua-learn-cinema-v1261.css?v=1261",
  "/kids/dua-word-meanings-v1.js?v=2",
  "/kids/dua-phonetic-alignment-v1.js?v=1",
  "/kids/dua-smart-learn.js?v=1312",
  "/kids/dua-learn-trilingual-v1282.css?v=1291",
  "/kids/dua-learn-elastic-v1286.css?v=1286",
  "/kids/content-studio-feed.js?v=studio8",
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
  "/kids/quiz-library.css?v=1237",
  "/kids/quiz-library.js?v=9",
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

// KIDS_FAST_FIRST_PAINT_V1313: do not block SW installation on 255+ heavy
// illustrations/audio clips. Save the EXACT image used by the final homepage CSS.
// Larger visual and voice libraries download separately in resumable packs.
const KIDS_BOOT_PRECACHE=[
  "/kids/start",
  "/kids/start.html",
  "/kids/index.html",
  "/kids/akademie/index.html",
  "/kids/prayer-stage-v1261.css?v=1304",
  "/kids/prayer-stage-v1261.js?v=1306",
  "/kids/assets/kids-salah-v1272/hero-home.png?v=1274",
  "/kids/assets/kids-home-v1222/dar-title-reference-clean.svg?v=1229",
  "/kids/manifest.webmanifest"
];

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
  // Install only the first-paint shell. Full downloads use KIDS_OFFLINE_START.
  // Concurrent small requests allow the opening artwork to be ready sooner.
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(KIDS_BOOT_PRECACHE.map(function(path){
        return addQuiet(cache,path);
      }));
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener("activate",function(event){
  // Stable startup: claiming control must never navigate/reload an already-open app.
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key.indexOf("dar-al-tawhid-kids-v")===0&&key!==CACHE_NAME;
      }).map(function(key){return caches.delete(key)}));
    }).then(function(){return self.clients.claim()})
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
  // Full audio is cached as soon as it is used; Range requests must receive
  // valid 206 responses from stored full files on iOS/Safari in airplane mode.
  if(/\.(?:m4a|mp3|ogg|wav|aac)$/i.test(url.pathname)){
    event.respondWith(kidsCachedAudio(request,event));
    return;
  }
  // The quiz owner-voice router must update immediately after German speech fixes.
  // Network-first prevents an installed Kids PWA from retaining an obsolete
  // audio lookup even while its 900-question catalogue and manifest are fresh.
  // Keep the Kids Duʿāʾ V4 voice player fresh after an installed PWA update.
  if(url.pathname==="/kids/dua-smart-learn.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname==="/kids/owner-voice.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(url.pathname==="/kids/data/quiz-audio.json"||url.pathname==="/kids/data/dua-audio.json"||url.pathname==="/kids/data/dua-arabic-audio.json"||url.pathname==="/kids/data/dua-arabic-slow-audio.json"||url.pathname==="/kids/data/dua-word-audio.json"||url.pathname==="/kids/data/dua-kids.json"||url.pathname==="/kids/data/owner-voice-audio.json"||url.pathname==="/kids/data/academy-audio.json"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* QUIZ LEARNING CENTER: network-first so 900-question data, dashboard logic and layout never regress to a stale pack. */
  if(url.pathname==="/kids/data/quiz-kids.json"||url.pathname==="/kids/quiz-library.js"||url.pathname==="/kids/quiz-library.css"){
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
  /* DETAIL DOCK: network-first to prevent an old oval control reappearing. */
  if(url.pathname==="/kids/global-detail-dock-v1247.css"||url.pathname==="/kids/global-detail-dock-v1247.js"){
    event.respondWith(networkFirst(request));
    return;
  }
  /* HOME VIEWPORT FIT: load current sizing CSS and measurement JS first.
     On an offline first-open, networkFirst transparently returns the cached
     matching release; avoid one-launch stale hero geometry from SWR. */
  if(url.pathname==="/kids/prayer-stage-v1261.css"||url.pathname==="/kids/prayer-stage-v1261.js"){
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

/* KIDS_RESUMABLE_OFFLINE_LIBRARY_V1
 * Dedicated persistent cache: survives shell and PWA updates without purging
 * student downloads. No cross-app URL may be stored in this namespace.
 */
const KIDS_OFFLINE_SEEDS=[
  "/kids/akademie/index.html",
  "/kids/data/academy-audio.json",
  "/kids/data/prophet-stories.json",
  "/kids/data/mubashshirun-stories.json",
  "/kids/data/sahabiyyat-stories.json",
  "/kids/data/story-hub.json",
  "/kids/data/dua-kids.json",
  "/kids/data/dua-audio.json",
  "/kids/data/dua-arabic-audio.json",
  "/kids/data/dua-arabic-slow-audio.json",
  "/kids/data/dua-word-audio.json",
  "/kids/data/quiz-audio.json",
  "/kids/data/owner-voice-audio.json",
  "/kids/data/quiz-kids.json",
  "/kids/data/deen-lessons.json",
  "/kids/data/term-learning-audio.json",
  "/kids/data/verified-content.json",
  "/kids/data/short-stories-voice.json",
  "/kids/data/academy-lessons.json"
];
let kidsOfflineRunning=false,kidsOfflineCancel=false,kidsOfflineNext=null;
const KIDS_OFFLINE_META="/kids/data/offline-pack-status-v1.json";
function kidsOfflineRequest(input){
  try{
    const u=new URL(input,self.location.origin);
    if(u.origin!==self.location.origin||!u.pathname.startsWith("/kids/"))return null;
    // Do not store dynamic endpoints, cross-origin content, video/Range segments
    // or guessed URLs. All offline files have a static extension.
    if(!/\.(?:html|css|js|json|webmanifest|png|jpe?g|webp|gif|svg|avif|woff2?|m4a|mp3|ogg|wav|aac)$/i.test(u.pathname))return null;
    return u.href;
  }catch(_){return null;}
}
function kidsCachedFull(request){
  const url=typeof request==="string"?request:request.url;
  return caches.match(new Request(url));
}
async function kidsPutFull(url,cache){
  const full=kidsOfflineRequest(url);
  if(!full)return false;
  const key=new Request(full,{method:"GET"});
  if(await cache.match(key))return true;
  // Preserve a copy even if it was already present in a release-specific
  // cache which may be cleaned during the next Kids SW activation.
  const earlier=await caches.match(key);
  if(earlier&&earlier.status===200){
    try{await cache.put(key,earlier.clone());return true;}catch(_){}
  }
  try{
    const response=await fetch(key,{cache:"no-store"});
    if(!response||!response.ok||response.status!==200)return false;
    const type=response.headers.get("content-type")||"";
    const path=new URL(full).pathname;
    if(/\.(?:m4a|mp3|ogg|wav|aac)$/i.test(path)&&/text\/html/i.test(type))return false;
    await cache.put(key,response);
    return true;
  }catch(_){return false;}
}
async function kidsCachedAudio(request,event){
  const full=await kidsCachedFull(request);
  if(full&&full.status===200){
    const range=request.headers.get("Range");
    if(!range)return full;
    const match=/^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if(!match)return new Response(null,{status:416});
    const file=await full.arrayBuffer(),length=file.byteLength;
    const suffix=match[1]==="";
    let from=suffix?Math.max(0,length-Number(match[2])):Number(match[1]);
    let to=suffix?length-1:match[2]?Math.min(length-1,Number(match[2])):length-1;
    if(!length||!Number.isFinite(from)||!Number.isFinite(to)||from>to||from>=length)
      return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+length}});
    const headers=new Headers();
    headers.set("Content-Type",full.headers.get("Content-Type")||"audio/mpeg");
    headers.set("Accept-Ranges","bytes");
    headers.set("Content-Range","bytes "+from+"-"+to+"/"+length);
    headers.set("Content-Length",String(to-from+1));
    return new Response(file.slice(from,to+1),{status:206,headers});
  }
  // Streaming remains instant while online. Warm a *complete* representation
  // separately because HTTP 206 partial files cannot be safely cached as audio.
  if(request.headers.has("Range")){
    if(event&&event.waitUntil)event.waitUntil(
      caches.open(KIDS_OFFLINE_CACHE).then(c=>kidsPutFull(request.url,c)).catch(()=>{})
    );
    return fetch(request);
  }
  return fetch(request).then(async response=>{
    if(response&&response.status===200&&response.ok){
      try{const copy=response.clone();event.waitUntil(caches.open(KIDS_OFFLINE_CACHE).then(c=>c.put(new Request(request.url),copy)).catch(()=>{}));}catch(_){}
    }
    return response;
  });
}
function kidsAssetRefs(raw){
  // Static /kids/ references only. JSON contains voice URLs and story artwork.
  const hits=String(raw||"").match(/\/kids\/(?:assets|data|icons)\/[^\s"'<>\\)]+/g)||[];
  const out=[];
  for(const hit of hits){
    const found=kidsOfflineRequest(hit.replace(/[;,]+$/,""));
    if(found)out.push(found);
  }
  return out;
}
async function kidsSendOffline(source,type,detail){
  if(source&&typeof source.postMessage==="function")try{source.postMessage(Object.assign({type},detail||{}))}catch(_){}
}
async function kidsOfflineDownload(source,mode){
  if(kidsOfflineRunning){
    if(mode==="full"){
      kidsOfflineCancel=true;
      kidsOfflineNext={source,mode};
      kidsSendOffline(source,"KIDS_OFFLINE_QUEUED");
    }else kidsSendOffline(source,"KIDS_OFFLINE_BUSY");
    return;
  }
  kidsOfflineRunning=true;kidsOfflineCancel=false;
  const cache=await caches.open(KIDS_OFFLINE_CACHE);
  try{
    // Tiny automatic visual warm-up, not a surprise multi-hundred-MB download.
    // The explicit full package includes all known images, lessons and audio.
    const first=mode==="visual"
      ?CORE_PRECACHE.filter(p=>/\.(?:png|jpe?g|webp|gif|svg|avif)(?:\?|$)/i.test(p)).slice(0,50)
      :CORE_PRECACHE.concat(KIDS_OFFLINE_SEEDS);
    const paths=new Map();
    function append(raw){
      const u=kidsOfflineRequest(raw);
      if(u&&!paths.has(u))paths.set(u,1);
    }
    first.forEach(append);
    if(mode!=="visual"){
      // Read the actual published manifests; never fabricate audio paths.
      // Enumerate nested static audio/images referenced by stories, lessons,
      // Du'a, quiz and academy, with a cap against accidental recursive bloat.
      for(const seed of KIDS_OFFLINE_SEEDS){
        if(kidsOfflineCancel)break;
        const url=kidsOfflineRequest(seed);if(!url)continue;
        if(!/\.(?:json|html)$/i.test(new URL(url).pathname))continue;
        let response;
        try{response=await caches.match(url)||await fetch(url,{cache:"no-store"});}catch(_){continue;}
        if(!response||!response.ok)continue;
        const text=await response.clone().text().catch(()=>"");
        for(const item of kidsAssetRefs(text)){
          if(paths.size>=6500)break;
          append(item);
        }
        try{await cache.put(url,response)}catch(_){}
      }
    }
    let queue=[...paths.keys()],done=0,failed=0;
    const report=async(force)=>{if(force||done%10===0)await kidsSendOffline(source,"KIDS_OFFLINE_PROGRESS",{mode,done,total:queue.length,failed,complete:false});};
    await report(true);
    let cursor=0;
    async function worker(){
      while(cursor<queue.length&&!kidsOfflineCancel){
        const url=queue[cursor++];
        if(!await kidsPutFull(url,cache))failed++;
        done++;await report(false);
      }
    }
    await Promise.all([worker(),worker(),worker()]);
    const complete=!kidsOfflineCancel&&failed===0;
    if(mode==="full"&&!kidsOfflineCancel){
      try{
        await cache.put(KIDS_OFFLINE_META,new Response(JSON.stringify({
          complete,done,total:queue.length,failed,checkedAt:Date.now(),
          shell:KIDS_BUILD_ID
        }),{headers:{"Content-Type":"application/json"}}));
      }catch(_){}
    }
    await kidsSendOffline(source,"KIDS_OFFLINE_PROGRESS",{
      mode,done,total:queue.length,failed,
      complete:complete&&mode==="full",cancelled:kidsOfflineCancel,
      visualReady:complete&&mode==="visual"
    });
  }finally{
    kidsOfflineRunning=false;kidsOfflineCancel=false;
    if(kidsOfflineNext){
      const next=kidsOfflineNext;kidsOfflineNext=null;
      await kidsOfflineDownload(next.source,next.mode);
    }
  }
}
self.addEventListener("message",function(event){
  const msg=event.data||{};
  if(msg.type==="KIDS_OFFLINE_CANCEL"){kidsOfflineCancel=true;return;}
  if(msg.type==="KIDS_OFFLINE_STATUS"){
    event.waitUntil((async()=>{
      const cache=await caches.open(KIDS_OFFLINE_CACHE),keys=await cache.keys();
      let record={};try{record=await (await cache.match(KIDS_OFFLINE_META))?.json()||{}}catch(_){}
      await kidsSendOffline(event.source,"KIDS_OFFLINE_STATUS",{
        count:keys.filter(x=>!x.url.endsWith("/offline-pack-status-v1.json")).length,
        complete:record.complete===true&&keys.length>=record.total,
        failed:record.failed||0
      });
    })());return;
  }
  if(msg.type==="KIDS_OFFLINE_START"&&(msg.mode==="full"||msg.mode==="visual")){
    event.waitUntil(kidsOfflineDownload(event.source,msg.mode));
  }
});
