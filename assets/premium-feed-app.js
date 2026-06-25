/**
 * DAR AL TAWḤID — Premium-Feed (vertikal, Tab „Feed“)
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darPremiumFeedStylesV40';
  var FONTS_ID = 'darPremiumFeedFontsV40';
  var FEED_COL_PHONE = 0;
  var FEED_COL_FOLD = 520;
  var FEED_COL_TABLET = 540;
  var FEED_COL_DESKTOP = 420;
  var FEED_SHELL_PAD = 10;
  var FEED_CARD_GAP = 14;
  var FEED_CARD_RADIUS = 22;
  var FEED_SCENE_RATIO = 1.08;
  var FEED_SCENE_RATIO_FULL = 1.08;
  var FEED_SCENE_MIN_H = 228;
  var FEED_SCENE_MAX_VH = 0.55;
  var EMPHASIS_SCRIPT = '"Great Vibes",cursive';
  var APP_LOGO = '/watermark-my-logo-full.png';
  var SCENE_WATERMARK = '/watermark-my-logo-full.png';
  var BRAND = {
    site: 'dar-al-tawhid.de',
    instagram: '@dar_at_tawhid',
    telegram: '@dar_al_tauhid',
    signature: 'by Serhat Abu Malik'
  };
  var FEED_BG_POOL = [];
  var FEED_BG_CACHE_VER = 0;
  var FEED_BG_PREFS = {
    quran: { categories: ['quran', 'nature', 'abstract'], tags: ['himmel', 'licht', 'berge', 'wolken', 'mushaf', 'kalligraphie', 'quran'] },
    dua: { categories: ['dua', 'nature', 'abstract'], tags: ['himmel', 'regen', 'wolken', 'nebel', 'ruhe', 'pflanzen', 'dua'] },
    tawhid: { categories: ['tawhid', 'aqidah', 'nature', 'mosque', 'abstract'], tags: ['berge', 'wüste', 'himmel', 'stark', 'klarheit', 'tawhid', 'aqidah'] },
    knowledge: { categories: ['knowledge', 'books', 'abstract'], tags: ['bücher', 'pergament', 'feder', 'tinte', 'ilm', 'hadith', 'sunnah', 'adab'] },
    akhirah: { categories: ['nature', 'abstract', 'dua', 'akhirah'], tags: ['nebel', 'abend', 'ruhe', 'wüste', 'berge', 'akhirah', 'zuhd', 'tazkiyah', 'sabr'] },
    default: { categories: ['abstract', 'nature', 'gradients'], tags: [] }
  };
  var THEME_OVERLAYS = {
    dark: 'linear-gradient(180deg,rgba(0,0,0,.20) 0%,rgba(0,0,0,.62) 100%)',
    light: 'linear-gradient(180deg,rgba(255,248,235,.20) 0%,rgba(255,248,235,.60) 100%)',
    soft: 'linear-gradient(180deg,rgba(255,248,241,.22) 0%,rgba(80,48,60,.48) 100%)',
    royal: 'linear-gradient(180deg,rgba(7,17,29,.18) 0%,rgba(7,17,29,.72) 100%)',
    bordeaux: 'linear-gradient(180deg,rgba(74,31,36,.18) 0%,rgba(20,11,12,.72) 100%)'
  };
  var H2C_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  var GRADIENT_BGS = {
    dark: [
      'radial-gradient(circle at 18% 14%,rgba(239,215,142,.14),transparent 38%),linear-gradient(165deg,#1a150f 0%,#0a0908 52%,#080806 100%)',
      'radial-gradient(circle at 82% 18%,rgba(155,122,60,.16),transparent 40%),linear-gradient(180deg,#14110e 0%,#080706 55%,#080806 100%)',
      'radial-gradient(circle at 50% 88%,rgba(90,70,30,.2),transparent 46%),linear-gradient(200deg,#12100e,#0a0908,#080806)'
    ],
    light: [
      'radial-gradient(circle at 18% 14%,rgba(236,210,155,.26),transparent 40%),linear-gradient(165deg,#fff8eb 0%,#f5e6c0 52%,#ecd9a0 100%)',
      'radial-gradient(circle at 82% 18%,rgba(155,122,60,.14),transparent 40%),linear-gradient(180deg,#fff4e4 0%,#f5e6c0 55%,#edd9a0 100%)',
      'radial-gradient(circle at 50% 88%,rgba(109,78,36,.12),transparent 46%),linear-gradient(200deg,#fffaf0,#f5e6c0,#ecd9a0)'
    ],
    soft: [
      'radial-gradient(circle at 18% 14%,rgba(218,190,203,.28),transparent 40%),linear-gradient(165deg,#fff8f1 0%,#f0ded9 52%,#e7d0d4 100%)',
      'radial-gradient(circle at 82% 18%,rgba(116,76,98,.14),transparent 40%),linear-gradient(180deg,#fff8f1 0%,#f0ded9 55%,#e7d0d4 100%)',
      'radial-gradient(circle at 50% 88%,rgba(125,83,104,.12),transparent 46%),linear-gradient(200deg,#fff8f1,#f0ded9,#e7d0d4)'
    ],
    royal: [
      'radial-gradient(circle at 18% 14%,rgba(239,215,142,.14),transparent 38%),linear-gradient(165deg,#102b50 0%,#081a33 52%,#041023 100%)',
      'radial-gradient(circle at 82% 18%,rgba(57,112,170,.18),transparent 40%),linear-gradient(180deg,#0c203f 0%,#081a33 55%,#041023 100%)',
      'radial-gradient(circle at 50% 88%,rgba(42,93,145,.16),transparent 46%),linear-gradient(200deg,#102746,#081a33,#041023)'
    ],
    bordeaux: [
      'radial-gradient(circle at 18% 14%,rgba(214,190,132,.14),transparent 38%),linear-gradient(165deg,#5B232A 0%,#321317 52%,#140B0C 100%)',
      'radial-gradient(circle at 82% 18%,rgba(120,42,50,.18),transparent 40%),linear-gradient(180deg,#4A1F24 0%,#321317 55%,#140B0C 100%)',
      'radial-gradient(circle at 50% 88%,rgba(91,35,42,.16),transparent 46%),linear-gradient(200deg,#5B232A,#321317,#140B0C)'
    ]
  };
  var DUA_READABLE_FONTS = [
    { css: '"Source Serif 4", Georgia, serif' },
    { css: '"EB Garamond", Georgia, serif' },
    { css: '"Lora", Georgia, serif' },
    { css: '"Merriweather", Georgia, serif' },
    { css: '"Libre Baskerville", Georgia, serif' },
    { css: '"Crimson Pro", Georgia, serif' },
    { css: '"Spectral", Georgia, serif' },
    { css: '"Raleway", sans-serif' },
    { css: '"Inter", sans-serif' },
    { css: '"Amiri", serif' },
    { css: '"Cormorant Garamond", serif' },
    { css: '"Playfair Display", serif' },
    { css: '"Montserrat", sans-serif' }
  ];
  var DUA_STYLISH_FONTS = [
    { css: '"Allura", cursive' },
    { css: '"Dancing Script", cursive' },
    { css: '"Great Vibes", cursive' },
    { css: '"Pinyon Script", cursive' },
    { css: '"Sacramento", cursive' },
    { css: '"Italianno", cursive' },
    { css: '"Parisienne", cursive' },
    { css: '"Tangerine", cursive' },
    { css: '"Cormorant Garamond", serif', extra: 'font-style:italic' },
    { css: '"Playfair Display", serif', extra: 'font-style:italic' },
    { css: '"EB Garamond", serif', extra: 'font-style:italic;font-weight:600' },
    { css: '"Crimson Pro", serif', extra: 'font-style:italic' },
    { css: '"Spectral", serif', extra: 'font-style:italic' },
    { css: '"Libre Baskerville", serif', extra: 'font-style:italic' },
    { css: '"Amiri", serif', extra: 'font-style:italic' }
  ];
  var DUA_SACRED_TERMS = {
    allah: 1, allāh: 1, herr: 1, gott: 1, paradies: 1, jannah: 1, vergebung: 1,
    reue: 1, rizq: 1, geduld: 1, barmherzigkeit: 1, gnade: 1, frieden: 1,
    schutz: 1, leitung: 1, führung: 1, wissen: 1, bedürftig: 1, beduerftig: 1
  };
  var FEED_FONTS = [
    { id: 'amiri', css: '"Amiri", serif', size: 'clamp(17px,4.1vw,21px)' },
    { id: 'cormorant', css: '"Cormorant Garamond", serif', size: 'clamp(18px,4.3vw,22px)' },
    { id: 'eb-garamond', css: '"EB Garamond", serif', size: 'clamp(17px,4.1vw,21px)' },
    { id: 'lora', css: '"Lora", serif', size: 'clamp(16px,3.9vw,20px)' },
    { id: 'merriweather', css: '"Merriweather", serif', size: 'clamp(15px,3.7vw,19px)' },
    { id: 'playfair', css: '"Playfair Display", serif', size: 'clamp(17px,4.1vw,21px)' },
    { id: 'libre-baskerville', css: '"Libre Baskerville", serif', size: 'clamp(15px,3.7vw,19px)' },
    { id: 'crimson', css: '"Crimson Pro", serif', size: 'clamp(17px,4.1vw,21px)' },
    { id: 'source-serif', css: '"Source Serif 4", serif', size: 'clamp(16px,3.8vw,20px)' },
    { id: 'spectral', css: '"Spectral", serif', size: 'clamp(16px,3.8vw,20px)' },
    { id: 'raleway', css: '"Raleway", sans-serif', size: 'clamp(15px,3.6vw,18px)' },
    { id: 'montserrat', css: '"Montserrat", sans-serif', size: 'clamp(14px,3.5vw,17px)' },
    { id: 'cinzel', css: '"Cinzel", serif', size: 'clamp(15px,3.6vw,18px)' },
    { id: 'noto-naskh', css: '"Noto Naskh Arabic", serif', size: 'clamp(20px,4.8vw,26px)' }
  ];
  var SEEN_KEY = 'darPremiumFeedSeenV1';
  var LIKES_KEY = 'darPremiumFeedLikesV1';
  var DEVICE_KEY = 'darFeedDeviceSeedV1';
  var REFRESH_KEY = 'darPremiumFeedRefreshSeedV1';
  var BATCH = 10;
  var INITIAL = 12;


  var state = {
    allItems: [],
    visible: [],
    filter: 'all',
    offset: 0,
    loading: false,
    done: false,
    seed: '',
    manualLoaded: false
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clamp(s, n) {
    var t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length <= n ? t : t.slice(0, n - 1).trim() + '…';
  }

  function publisherLabel() {
    return 'DAR AL TAWḤID';
  }

  function logoImgHtml(extraClass) {
    return '<img class="sf-logo-img' + (extraClass ? ' ' + extraClass : '') + '" src="' + APP_LOGO + '" alt="DAR AL TAWḤID" loading="lazy" decoding="async">';
  }

  function cardSubline(item) {
    var map = { post: 'Beitrag', archive: 'Beitrag', dua: 'Duʿāʾ', quran: 'Qurʾān', custom: 'Beitrag' };
    var kind = map[item.type] || 'Inhalt';
    return item.category ? item.category + ' · ' + kind : kind;
  }

  function itemBackgroundMode(item) {
    var mode = String(item && item.backgroundMode || '').toLowerCase();
    if (mode === 'manual' || mode === 'auto' || mode === 'gradient' || mode === 'none') return mode;
    if (itemBgIsGradient(item) || item && item.bgType === 'gradient') return 'gradient';
    return 'auto';
  }

  function isFeedBgSafe(bg) {
    if (!bg || !bg.src) return false;
    if (bg.status !== 'active' || bg.active === false) return false;
    if (!bg.approved || bg.securityStatus !== 'approved') return false;
    if (bg.containsHumans || bg.containsAnimals || bg.containsFaces) return false;
    var allowed = bg.allowedFor || ['feed'];
    if (typeof allowed === 'string') allowed = allowed.split(/[,;|]+/);
    return allowed.indexOf('feed') >= 0;
  }

  function findFeedBgById(id) {
    if (!id) return null;
    for (var i = 0; i < FEED_BG_POOL.length; i++) {
      if (String(FEED_BG_POOL[i].id) === String(id)) return FEED_BG_POOL[i];
    }
    return null;
  }

  function bgImageUrl(bg, mobile) {
    if (!bg) return '';
    var u = mobile ? (bg.srcMobile || bg.thumbnail || bg.src) : (bg.src || bg.srcMobile || bg.thumbnail);
    return String(u || '').trim();
  }

  function overlayForTheme(theme, hint) {
    if (hint === 'light') return THEME_OVERLAYS.light;
    if (hint === 'royal') return THEME_OVERLAYS.royal;
    if (hint === 'bordeaux') return THEME_OVERLAYS.bordeaux;
    if (hint === 'warm-dark') return 'linear-gradient(180deg,rgba(42,30,18,.18) 0%,rgba(12,8,6,.68) 100%)';
    if (theme === 'light') return THEME_OVERLAYS.light;
    if (theme === 'soft') return THEME_OVERLAYS.soft;
    if (theme === 'royal') return THEME_OVERLAYS.royal;
    if (theme === 'bordeaux') return THEME_OVERLAYS.bordeaux;
    return THEME_OVERLAYS.dark;
  }

  function itemBgPreferences(item) {
    var type = String(item && item.type || '').toLowerCase();
    var cat = String(item && item.category || '').toLowerCase();
    var topic = String(item && item.topic || item.duaCat || '').toLowerCase();
    var hay = (cat + ' ' + topic + ' ' + String(item && item.title || '') + ' ' + String(item && item.scholar || '')).toLowerCase();
    if (type === 'quran' || cat.indexOf('qur') >= 0 || cat.indexOf('tafs') >= 0) return FEED_BG_PREFS.quran;
    if (type === 'dua' || cat.indexOf('du') >= 0 || cat.indexOf('duʿ') >= 0) return FEED_BG_PREFS.dua;
    if (cat.indexOf('taw') >= 0 || cat.indexOf('aqid') >= 0 || hay.indexOf('tawhid') >= 0 || hay.indexOf('tawḥ') >= 0) return FEED_BG_PREFS.tawhid;
    if (cat.indexOf('wiss') >= 0 || cat.indexOf('adab') >= 0 || cat.indexOf('hadith') >= 0 || cat.indexOf('sunnah') >= 0 || cat.indexOf('athar') >= 0 || cat.indexOf('fiqh') >= 0 || hay.indexOf('ilm') >= 0) return FEED_BG_PREFS.knowledge;
    if (cat.indexOf('akhir') >= 0 || hay.indexOf('zuhd') >= 0 || hay.indexOf('tazkiy') >= 0 || hay.indexOf('sabr') >= 0) return FEED_BG_PREFS.akhirah;
    return FEED_BG_PREFS.default;
  }

  function scoreFeedBgCandidate(bg, prefs, item) {
    var score = Number(bg.priority || 0) * 10;
    var i;
    if (prefs.categories.indexOf(bg.category) >= 0) score += 40 - prefs.categories.indexOf(bg.category) * 5;
    var tags = bg.tags || [];
    var topics = bg.topics || [];
    for (i = 0; i < prefs.tags.length; i++) {
      if (tags.indexOf(prefs.tags[i]) >= 0) score += 8;
      if (topics.indexOf(prefs.tags[i]) >= 0) score += 6;
    }
    var cat = String(item && item.category || '').toLowerCase();
    if (tags.indexOf(cat) >= 0 || topics.indexOf(cat) >= 0) score += 12;
    return score;
  }

  function selectFeedBackground(item, theme) {
    theme = theme || getThemeKey();
    var mode = itemBackgroundMode(item);
    if (mode === 'gradient' || mode === 'none') {
      return { kind: 'gradient', value: gradientStyleFor(item), reason: 'mode-gradient' };
    }
    if (mode === 'manual' && item && item.backgroundId) {
      var manual = findFeedBgById(item.backgroundId);
      if (isFeedBgSafe(manual)) {
        return bgToScene(manual, item, theme, 'manual');
      }
    }
    if (mode === 'auto' || mode === 'manual') {
      var prefs = itemBgPreferences(item);
      var candidates = FEED_BG_POOL.filter(isFeedBgSafe);
      var scored = candidates.map(function (bg) {
        return { bg: bg, score: scoreFeedBgCandidate(bg, prefs, item) };
      }).filter(function (row) { return row.score > 0; });
      if (!scored.length) {
        scored = candidates.map(function (bg) {
          return { bg: bg, score: Number(bg.priority || 0) };
        });
      }
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.bg.id).localeCompare(String(b.bg.id));
      });
      if (scored.length) {
        var seed = String(item && item.uid || item && item.id || '') + '|' + String(item && item.category || '') + '|bg';
        var pick = scored[hashNum(seed) % scored.length].bg;
        return bgToScene(pick, item, theme, 'auto');
      }
    }
    return { kind: 'gradient', value: gradientStyleFor(item), reason: 'fallback-no-match' };
  }

  function bgToScene(bg, item, theme, reason) {
    var mobile = false;
    try { mobile = global.innerWidth > 0 && global.innerWidth <= 700; } catch (e) {}
    var url = bgImageUrl(bg, mobile);
    var fp = bg.focusPoint || { x: 50, y: 50 };
    return {
      kind: 'image',
      value: url,
      bgId: bg.id,
      overlay: overlayForTheme(theme, bg.overlayHint),
      focusX: fp.x,
      focusY: fp.y,
      alt: bg.alt || bg.title || '',
      reason: reason || 'auto'
    };
  }

  function fetchFeedBackgrounds() {
    var staging = isStaging();
    var jsonPath = staging ? '/content/staging/feed-backgrounds/feed-backgrounds.json' : '/content/feed-backgrounds/feed-backgrounds.json';
    var apiPath = '/api/feed-backgrounds?staging=' + (staging ? '1' : '0');
    function loadJson(path) {
      return fetch(path + '?v=' + encodeURIComponent(String(FEED_BG_CACHE_VER || todayKey())), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    return loadJson(apiPath).then(function (data) {
      if (data && data.items) return data;
      return loadJson(jsonPath);
    }).then(function (data) {
      FEED_BG_CACHE_VER = Number(data && data.cacheVersion) || 1;
      FEED_BG_POOL = (data && data.items || []).filter(function (it) {
        return it && it.src;
      }).map(function (it) {
        return {
          id: it.id,
          title: it.title,
          category: it.category,
          tags: it.tags || [],
          topics: it.topics || [],
          allowedFor: it.allowedFor || ['feed'],
          src: it.src,
          srcMobile: it.srcMobile,
          thumbnail: it.thumbnail,
          alt: it.alt,
          priority: it.priority,
          active: it.active !== false && it.status === 'active',
          approved: it.approved === true,
          status: it.status || 'draft',
          securityStatus: it.securityStatus || 'unchecked',
          containsHumans: !!it.containsHumans,
          containsAnimals: !!it.containsAnimals,
          containsFaces: !!it.containsFaces,
          overlayHint: it.overlayHint || 'dark',
          focusPoint: it.focusPoint || { x: 50, y: 50 }
        };
      });
    });
  }

  function preloadFeedImages(items, limit) {
    var n = limit || 3;
    var urls = [];
    items.slice(0, n).forEach(function (item) {
      var bg = selectFeedBackground(item, getThemeKey());
      if (bg.kind === 'image' && bg.value && urls.indexOf(bg.value) < 0) urls.push(bg.value);
    });
    urls.forEach(function (u) {
      var img = new Image();
      img.decoding = 'async';
      img.src = u;
    });
  }

  function getThemeKey() {
    try {
      var t = document.documentElement.getAttribute('data-theme') || 'dark';
      if (t === 'aurora' || t === 'emerald' || t === 'smaragd') return 'dark';
      return t;
    } catch (e) {
      return 'dark';
    }
  }

  function readThemeVar(name, fallback) {
    try {
      var v = global.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v) return v;
    } catch (e) {}
    return fallback || '';
  }

  function gradientStyleFor(item) {
    var fromCss = readThemeVar('--theme-feed-grad', '');
    if (fromCss) return fromCss;
    var theme = getThemeKey();
    var pool = GRADIENT_BGS[theme] || GRADIENT_BGS.dark;
    var idx = hashNum(String(item && item.uid || '') + '|grad|' + todayKey()) % pool.length;
    return pool[idx];
  }

  function itemBgIsGradient(item) {
    return !!(item && (item.bgType === 'gradient' || item.imageGradient === true));
  }

  function itemImageAllowed(item) {
    if (!item) return true;
    if (item.imageSafe === false || item.safeImage === false) return false;
    return true;
  }

  function resolveSceneBg(item) {
    return selectFeedBackground(item, getThemeKey());
  }

  function allBgFallbacks(item) {
    var prefs = itemBgPreferences(item);
    var urls = [];
    FEED_BG_POOL.filter(isFeedBgSafe).forEach(function (bg) {
      if (scoreFeedBgCandidate(bg, prefs, item) > 0) {
        var u = bgImageUrl(bg, false);
        if (u && urls.indexOf(u) < 0) urls.push(u);
      }
    });
    if (!urls.length) {
      FEED_BG_POOL.filter(isFeedBgSafe).slice(0, 6).forEach(function (bg) {
        var u2 = bgImageUrl(bg, false);
        if (u2 && urls.indexOf(u2) < 0) urls.push(u2);
      });
    }
    return urls;
  }

  function contentWeight(ar, main, extra) {
    return (ar ? ar.length * 1.35 : 0) + String(main || '').length + (extra ? extra.length * 0.55 : 0);
  }

  function readAppDuaSizes() {
    try {
      var cs = global.getComputedStyle(document.documentElement);
      return {
        ar: parseFloat(cs.getPropertyValue('--dua-arabic-size')) || 23,
        tr: parseFloat(cs.getPropertyValue('--dua-trans-size')) || 16.5,
        de: parseFloat(cs.getPropertyValue('--dua-de-size')) || 16.5,
        src: parseFloat(cs.getPropertyValue('--post-source-size')) || 13.5
      };
    } catch (e) {
      return { ar: 23, tr: 16.5, de: 16.5, src: 13.5 };
    }
  }

  function resolveDuaFields(item) {
    var out = { ar: '', tr: '', de: '', cat: '', sourceLabel: 'Duʿāʾ', bookRef: '' };
    if (!item) return out;
    var d = null;
    try {
      var list = [];
      if (item.duaId && global.DUAS && global.DUAS.length) list = global.DUAS;
      else if (item.duaId) {
        var ctx = getCtx();
        if (ctx && ctx.duas && ctx.duas.length) list = ctx.duas;
      }
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === String(item.duaId)) { d = list[i]; break; }
      }
    } catch (e) {}
    if (d) {
      out.ar = String(d.ar || '').trim();
      out.tr = String(d.tr || '').trim();
      out.de = String(d.de || '').trim();
      out.cat = String(d.cat || '').trim();
      out.bookRef = String(d.src || d.ref || '').replace(/^📝\s*/, '').trim();
    } else {
      out.ar = String(item.ar || '').trim();
      out.tr = String(item.tr || '').trim();
      out.de = String(item.de || '').trim();
      out.cat = String(item.duaCat || item.cat || '').trim();
      out.bookRef = String(item.bookRef || '').replace(/^📝\s*/, '').trim();
    }
    if (!out.bookRef) {
      var rawSrc = String(item.sourceDetail || item.ref || '').replace(/^📝\s*/, '').trim();
      if (rawSrc && rawSrc.indexOf('Duʿāʾ ·') !== 0) out.bookRef = rawSrc;
    }
    if (!out.ar && !out.de) {
      var txt = String(item.preview || '');
      var dash = txt.indexOf(' — ');
      if (dash > 0) {
        out.ar = txt.slice(0, dash).trim();
        out.de = txt.slice(dash + 3).trim();
      } else {
        out.de = txt.trim();
      }
    }
    if (!out.de && item.title) out.de = String(item.title).trim();
    out.sourceLabel = out.cat ? ('Duʿāʾ · ' + out.cat) : String(item.source || item.ref || 'Duʿāʾ').trim();
    return out;
  }

  function computeTypeSizes(item, ar, main, tr, hasScholar, hasSource) {
    var trText = String(tr || '');
    var w = contentWeight(ar, main, trText);
    if (hasScholar) w += 28;
    if (hasSource) w += 32;
    var mainPx;
    var arPx;
    var trPx;
    var srcPx;
    if (item && item.type === 'dua') {
      var app = readAppDuaSizes();
      mainPx = app.de;
      arPx = app.ar;
      trPx = app.tr;
      srcPx = Math.max(11, app.src);
    } else {
      mainPx = w > 240 ? 14 : w > 180 ? 15 : w > 130 ? 16 : w > 85 ? 17 : w > 50 ? 17.5 : 18;
      arPx = 22;
      trPx = 0;
      srcPx = Math.max(11, mainPx * 0.72);
    }
    return {
      main: mainPx,
      ar: arPx,
      tr: trPx || Math.max(12, mainPx * 0.95),
      scholar: Math.max(11, mainPx * 0.82),
      source: srcPx,
      mark: Math.max(17, mainPx * 1.3)
    };
  }

  function typeVarsStyle(sizes) {
    return '--sf-main-size:' + sizes.main + 'px;--sf-ar-size:' + sizes.ar + 'px;--sf-tr-size:' + sizes.tr + 'px;--sf-scholar-size:' + sizes.scholar + 'px;--sf-src-size:' + sizes.source + 'px;--sf-mark-size:' + sizes.mark + 'px;';
  }

  function layoutAlignFor(item, textLen) {
    if (item && (item.type === 'dua' || item.type === 'quran')) return 'center';
    if (textLen > 85) return 'center';
    return fontStyleFor(item).align;
  }

  function duaTypographyFor(item) {
    var uid = String(item && item.uid || '');
    var trIdx = hashNum(uid + '|dua-tr') % DUA_READABLE_FONTS.length;
    var deIdx = hashNum(uid + '|dua-de') % DUA_READABLE_FONTS.length;
    var tr = DUA_READABLE_FONTS[trIdx];
    var de = DUA_READABLE_FONTS[deIdx];
    return {
      trStyle: 'font-family:' + tr.css + ';font-style:normal;font-weight:500;letter-spacing:.02em;',
      deStyle: 'font-family:' + de.css + ';font-style:normal;font-weight:400;'
    };
  }

  function pickDuaEmphasisSet(words, uid) {
    var candidates = [];
    var stop = {
      der: 1, die: 1, das: 1, den: 1, dem: 1, des: 1, ein: 1, eine: 1, und: 1,
      ich: 1, du: 1, mir: 1, mich: 1, dir: 1, dich: 1, in: 1, im: 1, an: 1, auf: 1,
      aus: 1, von: 1, zu: 1, mit: 1, für: 1, ist: 1, sind: 1, war: 1, bin: 1, bist: 1,
      hat: 1, haben: 1, sein: 1, mein: 1, meine: 1, dein: 1, deine: 1, wir: 1, uns: 1,
      nicht: 1, aber: 1, oder: 1, als: 1, auch: 1, nur: 1, noch: 1, so: 1, sehr: 1,
      bei: 1, nach: 1, über: 1, unter: 1, was: 1, wer: 1, wie: 1, wenn: 1, dass: 1,
      es: 1, er: 1, sie: 1, es: 1, an: 1, um: 1, am: 1, zum: 1, zur: 1, vom: 1, ans: 1
    };
    words.forEach(function (w, i) {
      var bare = w.replace(/[^\wäöüÄÖÜß]/gi, '');
      if (bare.length < 4) return;
      var low = bare.toLowerCase();
      if (stop[low]) return;
      var score = bare.length + (DUA_SACRED_TERMS[low] ? 24 : 0);
      candidates.push({ i: i, score: score });
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    var count = Math.min(4, Math.max(1, Math.floor(words.length / 7) + 1));
    var picked = {};
    var seed = hashNum(uid + '|emph');
    for (var j = 0; j < count && j < candidates.length; j++) {
      var c = candidates[(seed + j * 5) % candidates.length];
      picked[c.i] = true;
    }
    return picked;
  }

  function formatEmphasizedText(text, uid, salt) {
    if (!text) return '';
    if (/\*\*[^*]+\*\*|\*\*\*[^*]+\*\*\*|\*[^*\n]+\*/.test(text)) {
      return formatMarkedEmphasis(text);
    }
    if (salt === 'quote') {
      return formatQuotePlainEmphasis(text);
    }
    var words = String(text).split(/\s+/).filter(Boolean);
    var emph = pickDuaEmphasisSet(words, uid + '|' + (salt || 'em'));
    var tokens = String(text).split(/(\s+)/);
    var wIdx = 0;
    var out = '';
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (/^\s+$/.test(t)) { out += t; continue; }
      var m = t.match(/^([^\wäöüÄÖÜß]*)([\wäöüÄÖÜß]+)([^\wäöüÄÖÜß]*)$/i);
      if (!m) { out += esc(t); wIdx++; continue; }
      if (emph[wIdx]) {
        out += esc(m[1]) + '<span class="sf-text-em">' + esc(m[2]) + '</span>' + esc(m[3]);
      } else {
        out += esc(t);
      }
      wIdx++;
    }
    return out;
  }

  function formatDuaGerman(text, uid, typo) {
    return formatEmphasizedText(text, uid, 'dua-de');
  }

  function panelStyleFor(item, text, alignOverride) {
    var fs = fontStyleFor(item);
    var align = alignOverride || layoutAlignFor(item, String(text || '').length);
    return 'font-family:' + fs.css + ';text-align:' + align + ';';
  }

  function fontStyleFor(item) {
    var fonts = FEED_FONTS;
    if (!fonts.length) return { css: 'Georgia, serif', size: 'clamp(16px,3.9vw,19px)', color: 'var(--theme-feed-panel-text)', align: 'center' };
    var idx = hashNum(String(item && item.uid || '') + '|font|' + todayKey()) % fonts.length;
    var f = fonts[idx];
    var aligns = ['left', 'center', 'right', 'left'];
    var align = aligns[hashNum(String(item && item.uid || '') + '|align') % aligns.length];
    return { css: f.css, size: f.size, color: 'var(--theme-feed-panel-text)', align: align };
  }

  function postSourceDetail(post) {
    if (!post) return '';
    try {
      if (global && typeof global.sourceTextFromPost === 'function') {
        var s = global.sourceTextFromPost(post);
        if (s) return String(s).trim();
      }
    } catch (e) {}
    var direct = String(post.source || '').replace(/^📝\s*/, '').trim();
    if (direct) return direct;
    var parts = [post.book, post.scholar].filter(Boolean);
    return parts.join(' · ');
  }

  function exactSourceFromItem(item) {
    if (!item) return '';
    var raw = String(item.source || '').trim();
    if (!raw && item.sourceDetail) raw = String(item.sourceDetail).trim();
    if (!raw && item.book) raw = String(item.book).trim();
    return raw.replace(/^📝\s*/, '').trim();
  }

  function cleanQuoteBody(bodyText, scholar) {
    var t = String(bodyText || '').trim();
    if (!t) return '';
    t = t.replace(/^>\s?/gm, '').trim();
    t = t.replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
    t = t.replace(/^[„"«]\s*/, '').replace(/\s*[""»„]$/g, '').trim();
    var speakers = [];
    if (scholar) speakers.push(String(scholar).trim());
    speakers.forEach(function (sp) {
      if (!sp) return;
      var escSp = sp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp('^' + escSp + '\\s+sagte(?:\\s+sinngemäß)?\\s*:\\s*', 'i'), '');
    });
    t = t.replace(/^[^\n„""]{0,120}?\s+sagte\s+sinngemäß\s*:\s*/i, '');
    t = t.replace(/^[^\n„""]{0,120}?\s+sagte\s*:\s*/i, '');
    return t.trim();
  }

  function feedQuoteBody(item) {
    if (!item) return '';
    if (item.type === 'dua') return '';
    var raw = item.statement || item.preview || '';
    var scholar = item.scholar || '';
    try {
      if (global && typeof global.parseImageEditorBodySource === 'function') {
        var parsed = global.parseImageEditorBodySource(String(raw), scholar);
        var body = String(parsed.bodyText || '').trim();
        if (body) return cleanQuoteBody(body, scholar || parsed.nameLine || '');
      }
    } catch (e) {}
    return cleanQuoteBody(feedStatementOnly(raw, scholar), scholar);
  }

  function formatMarkedEmphasis(text) {
    if (!text) return '';
    var raw = String(text);
    var out = '';
    var i = 0;
    while (i < raw.length) {
      if (raw.charAt(i) === '\n') { out += '\n'; i++; continue; }
      if (raw.substr(i, 3) === '***') {
        var end3 = raw.indexOf('***', i + 3);
        if (end3 > i) {
          out += '<span class="sf-text-em">' + esc(raw.slice(i + 3, end3)) + '</span>';
          i = end3 + 3;
          continue;
        }
      }
      if (raw.substr(i, 2) === '**') {
        var end2 = raw.indexOf('**', i + 2);
        if (end2 > i) {
          out += '<span class="sf-text-em">' + esc(raw.slice(i + 2, end2)) + '</span>';
          i = end2 + 2;
          continue;
        }
      }
      if (raw.charAt(i) === '*') {
        var end1 = raw.indexOf('*', i + 1);
        if (end1 > i) {
          out += '<span class="sf-text-em">' + esc(raw.slice(i + 1, end1)) + '</span>';
          i = end1 + 1;
          continue;
        }
      }
      var next = raw.slice(i).search(/[\n*]/);
      var chunk = next < 0 ? raw.slice(i) : raw.slice(i, i + next);
      out += esc(chunk);
      i += chunk.length;
    }
    return out;
  }

  function formatQuotePlainEmphasis(text) {
    if (!text) return '';
    var tokens = String(text).split(/(\s+)/);
    var out = '';
    tokens.forEach(function (t) {
      if (/^\s+$/.test(t)) { out += t; return; }
      var bare = t.replace(/^[^\wäöüÄÖÜß]+|[^\wäöüÄÖÜß:,]+$/gi, '');
      var em = /^sinngemäß:$/i.test(bare) ||
        /^[A-ZÄÖÜ][\wäöüÄÖÜß-]+,$/.test(t.trim()) ||
        (/^[A-ZÄÖÜ][\wäöüÄÖÜß-]{5,}$/.test(bare) && /Gerechtigkeit|Barmherzigkeit|Weisheit|Nutzen|Sharī|Shariah|Sunnah|Tawhid|Tawḥīd/i.test(bare));
      if (em) out += '<span class="sf-text-em">' + esc(t) + '</span>';
      else out += esc(t);
    });
    return out;
  }

  function sourceLinesFor(item) {
    if (!item) return { scholar: '', detail: '' };
    if (item.type === 'dua') {
      var dua = resolveDuaFields(item);
      return { scholar: dua.sourceLabel, detail: dua.bookRef };
    }
    var scholar = String(item.scholar || '').trim();
    if (!scholar) {
      var raw = item.statement || item.preview || '';
      try {
        if (global && typeof global.parseImageEditorBodySource === 'function') {
          var parsed = global.parseImageEditorBodySource(String(raw), '');
          if (parsed.nameLine) scholar = String(parsed.nameLine).trim();
        }
      } catch (e) {}
    }
    var detail = exactSourceFromItem(item);
    return { scholar: scholar, detail: detail };
  }

  function sourceLineFor(item) {
    var lines = sourceLinesFor(item);
    if (lines.scholar && lines.detail && lines.detail.indexOf(lines.scholar) < 0) {
      return lines.scholar + ' · ' + lines.detail;
    }
    return lines.detail || lines.scholar || '';
  }

  function feedOverlayBundle(item) {
    if (!item) return { text: '', source: '' };
    if (item.type === 'dua') {
      var dua = resolveDuaFields(item);
      return { text: dua.de, source: dua.sourceLabel };
    }
    var srcLine = sourceLinesFor(item);
    var quote = feedQuoteBody(item);
    if (!quote) quote = String(item.preview || item.title || '').trim();
    return {
      text: quote,
      source: srcLine.detail || srcLine.scholar || '',
      scholar: srcLine.scholar,
      detail: srcLine.detail
    };
  }

  function isFeedSkipLine(t) {
    var s = String(t || '').trim();
    if (!s) return false;
    if (/^👉/.test(s)) return true;
    if (/^🌙/.test(s) || /^Fazit:/i.test(s)) return true;
    if (/^Erklärung/i.test(s)) return true;
    if (/^Einordnung/i.test(s)) return true;
    if (/^Das bedeutet/i.test(s)) return true;
    if (/^zum Had/i.test(s) || /^zur Had/i.test(s) || /^Zum Had/i.test(s)) return true;
    if (/^Hier (wird|bedeutet)/i.test(s)) return true;
    if (/^Diese Aussage/i.test(s)) return true;
    if (/^Im Bild/i.test(s)) return true;
    return false;
  }

  function feedStatementOnly(text, scholar) {
    var raw = String(text || '').trim();
    if (!raw) return '';
    try {
      if (global && typeof global.normalizeImageEditorMainText === 'function') {
        var norm = global.normalizeImageEditorMainText(raw, scholar || '');
        if (norm) return clamp(stripMd(norm), 320);
      }
    } catch (e) {}
    var lines = stripMd(raw).split('\n');
    var body = [];
    var phase = 'scan';
    var skipBlock = false;
    lines.forEach(function (line) {
      var t = String(line || '').replace(/^>\s?/, '').trim();
      if (!t) {
        if (body.length && phase === 'body' && !skipBlock) body.push('');
        return;
      }
      if (isFeedSkipLine(t)) {
        skipBlock = true;
        phase = 'skip';
        return;
      }
      if (phase === 'skip') {
        if (!t) phase = 'body';
        return;
      }
      if (/^🖋️/.test(t) && /sagte/i.test(t)) return;
      if (/^(?:🖋️\s*)?.+?\s+sagte\s*:?\s*$/i.test(t)) return;
      body.push(t);
      phase = 'body';
    });
    var out = body.join('\n').trim();
    out = out.replace(/^(?:🖋️\s*)?[^\n]+?\s+sagte\s*:?\s*/gim, '').replace(/^>\s?/gm, '').trim();
    return clamp(out, 320);
  }

  function overlayTextFor(item) {
    return feedOverlayBundle(item).text;
  }

  function overlaySourceFor(item) {
    return feedOverlayBundle(item).source;
  }

  function readLikes() {
    try {
      var raw = JSON.parse(localStorage.getItem(LIKES_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function isLiked(uid) {
    return !!readLikes()[String(uid || '')];
  }

  function toggleLike(uid) {
    if (!uid) return false;
    try {
      var likes = readLikes();
      var key = String(uid);
      if (likes[key]) delete likes[key];
      else likes[key] = Date.now();
      localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
      return !!likes[key];
    } catch (e) {
      return false;
    }
  }

  function feedContentTypes() {
    return ['post', 'archive', 'dua', 'custom'];
  }

  function isFeedContentItem(item) {
    return feedContentTypes().indexOf(item && item.type) >= 0;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return 'Gerade eben';
    var ts = Date.parse(String(dateStr));
    if (!Number.isFinite(ts)) return String(dateStr);
    var diff = Date.now() - ts;
    if (diff < 60000) return 'Gerade eben';
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + ' Min.';
    if (diff < 86400000) return Math.max(1, Math.floor(diff / 3600000)) + ' Std.';
    if (diff < 604800000) return Math.max(1, Math.floor(diff / 86400000)) + ' T.';
    try {
      return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(new Date(ts));
    } catch (e) {
      return String(dateStr);
    }
  }

  function likeCountHtml(liked) {
    return liked ? '<span class="sf-like-count">1</span>' : '';
  }

  function feedTabBarInset() {
    try {
      var rootCs = global.getComputedStyle(document.documentElement);
      var frame = parseFloat(rootCs.getPropertyValue('--app-frame-inset-x'));
      if (Number.isFinite(frame) && frame >= 0) return Math.round(frame);
    } catch (e) {}
    return FEED_SHELL_PAD;
  }

  function feedPageGutter() {
    try {
      var rootCs = global.getComputedStyle(document.documentElement);
      var gx = parseFloat(rootCs.getPropertyValue('--page-gutter-x'));
      if (Number.isFinite(gx) && gx >= 0) return Math.round(gx);
      var px = parseFloat(rootCs.getPropertyValue('--page-padding-x'));
      if (Number.isFinite(px) && px >= 0) return Math.round(px);
    } catch (e) {}
    return FEED_SHELL_PAD;
  }

  function feedShellPad() {
    var isFullscreen = false;
    try { isFullscreen = document.body && document.body.classList.contains('is-feed-fullscreen'); } catch (e) {}
    if (isFullscreen) return feedTabBarInset();
    try {
      var rootCs = global.getComputedStyle(document.documentElement);
      var inset = parseFloat(rootCs.getPropertyValue('--content-inset'));
      if (Number.isFinite(inset) && inset >= 0) return Math.round(inset);
    } catch (e) {}
    return feedPageGutter();
  }

  function isFeedFullscreen() {
    try { return !!(document.body && document.body.classList.contains('is-feed-fullscreen')); } catch (e) { return false; }
  }

  function feedDeviceProfile() {
    var vv = global.visualViewport;
    var w = Math.round((vv && vv.width) ? vv.width : (global.innerWidth || 390));
    if (w >= 1024) {
      return { kind: 'desktop', colMax: FEED_COL_DESKTOP, ratio: 1.08, maxVh: 0.55 };
    }
    if (w >= 768) {
      return { kind: 'tablet', colMax: Math.min(FEED_COL_TABLET, w - 24), ratio: 1.08, maxVh: 0.55 };
    }
    if (w >= 600) {
      return { kind: 'fold', colMax: Math.min(FEED_COL_FOLD, w - 20), ratio: 1.08, maxVh: 0.55 };
    }
    return { kind: 'phone', colMax: FEED_COL_PHONE, ratio: FEED_SCENE_RATIO_FULL, maxVh: FEED_SCENE_MAX_VH };
  }

  function feedSceneWidth(root) {
    var host = root && root.querySelector ? root : document.getElementById(MOUNT_ID);
    if (host) {
      var post = host.querySelector('.sf-post');
      if (post && post.clientWidth > 0) return Math.round(post.clientWidth);
      var feed = host.querySelector('.sf-feed');
      if (feed && feed.clientWidth > 0) {
        var cs = global.getComputedStyle(feed);
        var pl = parseFloat(cs.paddingLeft) || 0;
        var pr = parseFloat(cs.paddingRight) || 0;
        var inner = Math.round(feed.clientWidth - pl - pr);
        if (inner > 200) return inner;
      }
      if (host.clientWidth > 0) {
        var app = host.querySelector('.sf-app');
        var shellPad = feedShellPad();
        if (app) {
          var appCs = global.getComputedStyle(app);
          var gl = parseFloat(appCs.getPropertyValue('--sf-gutter-left')) || 0;
          var gr = parseFloat(appCs.getPropertyValue('--sf-gutter-right')) || 0;
          if (gl > 0) shellPad = Math.max(shellPad, Math.round((gl + gr) / 2));
        }
        return Math.max(280, Math.round(host.clientWidth - shellPad * 2));
      }
    }
    var vv = global.visualViewport;
    var vw = (vv && vv.width) ? vv.width : (global.innerWidth || 390);
    var shell = feedShellPad();
    return Math.max(280, Math.round(vw - shell * 2));
  }

  function feedSceneHeight(root) {
    var w = feedSceneWidth(root);
    var fullscreen = isFeedFullscreen();
    var profile = feedDeviceProfile();
    var ratio = fullscreen ? profile.ratio : FEED_SCENE_RATIO;
    var h = Math.round(w * ratio);
    if (fullscreen) {
      var vv = global.visualViewport;
      var vh = (vv && vv.height) ? vv.height : (global.innerHeight || 800);
      h = Math.min(h, Math.round(vh * profile.maxVh));
    }
    return Math.max(FEED_SCENE_MIN_H, h);
  }

  function syncSceneLayout(root) {
    var w = feedSceneWidth(root);
    var h = feedSceneHeight(root);
    var fullscreen = isFeedFullscreen();
    var profile = feedDeviceProfile();
    var shell = feedShellPad();
    var colMaxPx = profile.colMax > 0 ? profile.colMax : 0;
    var footerH = fullscreen ? Math.max(32, Math.round(h * 0.088)) : Math.max(40, Math.round(h * 0.105));
    var topPad = fullscreen ? Math.max(4, Math.round(h * 0.012)) : Math.max(6, Math.round(h * 0.018));
    var panelPad = fullscreen ? Math.max(11, Math.round(w * 0.028)) : Math.max(13, Math.round(w * 0.036));
    var panelInset = fullscreen ? Math.max(4, Math.round(w * 0.010)) : Math.max(10, Math.round(w * 0.028));
    var badgeSize = fullscreen
      ? Math.min(44, Math.max(34, Math.round(w * 0.095)))
      : Math.min(56, Math.max(42, Math.round(w * 0.118)));
    var host = root && root.querySelector ? root : document;
    var app = host.querySelector ? (host.querySelector('.sf-app') || host) : document;
    if (app && app.style) {
      app.style.setProperty('--sf-scene-w', w + 'px');
      app.style.setProperty('--sf-scene-h', h + 'px');
      app.style.setProperty('--sf-footer-h', footerH + 'px');
      app.style.setProperty('--sf-side-pad', '0px');
      app.style.setProperty('--sf-panel-pad', panelPad + 'px');
      app.style.setProperty('--sf-panel-inset', panelInset + 'px');
      app.style.setProperty('--sf-panel-inset-x', panelInset + 'px');
      app.style.setProperty('--sf-shell-pad', shell + 'px');
      app.style.setProperty('--sf-feed-col-max', colMaxPx > 0 ? (colMaxPx + 'px') : '100%');
      if (colMaxPx > 0) {
        app.style.setProperty('--sf-gutter-left', '8px');
        app.style.setProperty('--sf-gutter-right', '8px');
      } else {
        app.style.setProperty('--sf-gutter-left', 'var(--app-frame-inset-left, max(' + shell + 'px, env(safe-area-inset-left, 0px)))');
        app.style.setProperty('--sf-gutter-right', 'var(--app-frame-inset-right, max(' + shell + 'px, env(safe-area-inset-right, 0px)))');
      }
      app.style.setProperty('--sf-card-gap', (fullscreen ? '12px' : (FEED_CARD_GAP + 'px')));
      app.style.setProperty('--sf-card-radius', (fullscreen ? '20px' : (FEED_CARD_RADIUS + 'px')));
      app.style.setProperty('--sf-badge-size', badgeSize + 'px');
      app.style.setProperty('--sf-badge-top', (fullscreen ? '12px' : '18px'));
      app.style.setProperty('--sf-badge-left', (fullscreen ? '12px' : '18px'));
    }
    try {
      if (document.body) document.body.setAttribute('data-sf-device', profile.kind);
    } catch (e) {}
    var scenes = (host.querySelectorAll ? host.querySelectorAll('.sf-post__scene') : []);
    Array.prototype.forEach.call(scenes, function (scene) {
      var isDua = scene.getAttribute('data-sf-dua') === '1';
      var padTop = isDua ? Math.max(4, Math.round(topPad * 0.65)) : topPad;
      scene.style.width = '100%';
      scene.style.height = h + 'px';
      scene.style.minHeight = h + 'px';
      scene.style.maxHeight = h + 'px';
      scene.style.aspectRatio = 'auto';
      scene.style.padding = padTop + 'px 0 ' + footerH + 'px';
    });
  }

  function applyPanelScale(panel, scale, bases) {
    panel.style.setProperty('--sf-main-size', Math.max(13, bases.main * scale) + 'px');
    panel.style.setProperty('--sf-ar-size', Math.max(18, bases.ar * scale) + 'px');
    panel.style.setProperty('--sf-tr-size', Math.max(12, bases.tr * scale) + 'px');
    panel.style.setProperty('--sf-scholar-size', Math.max(10.5, bases.scholar * scale) + 'px');
    panel.style.setProperty('--sf-src-size', Math.max(10.5, bases.src * scale) + 'px');
    panel.style.setProperty('--sf-mark-size', Math.max(16, bases.mark * scale) + 'px');
  }

  function readPanelBases(panel) {
    var cs = global.getComputedStyle(panel);
    return {
      main: parseFloat(cs.getPropertyValue('--sf-main-size')) || 15,
      ar: parseFloat(cs.getPropertyValue('--sf-ar-size')) || 22,
      tr: parseFloat(cs.getPropertyValue('--sf-tr-size')) || 14,
      scholar: parseFloat(cs.getPropertyValue('--sf-scholar-size')) || 11,
      src: parseFloat(cs.getPropertyValue('--sf-src-size')) || 10,
      mark: parseFloat(cs.getPropertyValue('--sf-mark-size')) || 20
    };
  }

  function panelFitRatio(panel, sceneW, isDuaPanel) {
    var text = String(panel.textContent || '').replace(/\s+/g, ' ').trim();
    var len = text.length;
    if (isDuaPanel) {
      if (len > 220) return 0.92;
      if (len > 140) return 0.84;
      return 0.76;
    }
    if (len > 180) return 0.86;
    if (len > 100) return 0.74;
    if (len > 55) return 0.64;
    return 0.54;
  }

  function tuneScenePanels(root) {
    if (!root) return;
    syncSceneLayout(root);
    root.querySelectorAll('.sf-post__scene').forEach(function (scene) {
      var panel = scene.querySelector('.sf-post__textpanel');
      var inner = scene.querySelector('.sf-post__scene-inner');
      if (!panel || !inner) return;

      inner.style.justifyContent = 'center';
      inner.style.alignItems = 'center';

      var cs = global.getComputedStyle(scene);
      var footerReserve = parseFloat(cs.paddingBottom) || 50;
      var topReserve = parseFloat(cs.paddingTop) || 10;
      var isDuaPanel = panel.classList.contains('sf-post__textpanel--dua');
      var fullscreen = false;
      try { fullscreen = document.body && document.body.classList.contains('is-feed-fullscreen'); } catch (e) {}
      var inset = isDuaPanel
        ? Math.max(2, Math.round(scene.clientWidth * 0.008))
        : (fullscreen ? Math.max(3, Math.round(scene.clientWidth * 0.012)) : Math.max(10, Math.round(scene.clientWidth * 0.034)));
      var safeGap = isDuaPanel ? 2 : (fullscreen ? 3 : Math.max(6, Math.round(scene.clientWidth * 0.018)));
      var maxPanelW = Math.max(150, scene.clientWidth - inset * 2 - safeGap * 2);
      var maxPanelH = Math.max(68, scene.clientHeight - footerReserve - topReserve - inset * 2 - safeGap * 2);

      inner.style.maxHeight = (scene.clientHeight - footerReserve - topReserve) + 'px';
      var insetX = isDuaPanel
        ? (fullscreen ? Math.max(4, Math.round(scene.clientWidth * 0.012)) : Math.max(8, Math.round(scene.clientWidth * 0.022)))
        : (fullscreen ? Math.max(4, Math.round(scene.clientWidth * 0.012)) : Math.max(10, Math.round(scene.clientWidth * 0.028)));
      inner.style.paddingTop = inset + 'px';
      inner.style.paddingBottom = inset + 'px';
      inner.style.paddingLeft = insetX + 'px';
      inner.style.paddingRight = insetX + 'px';
      var fitCap = panelFitRatio(panel, scene.clientWidth, isDuaPanel);
      var fitMaxW = Math.max(140, Math.round(scene.clientWidth * fitCap));
      maxPanelW = Math.min(maxPanelW, fitMaxW);
      panel.style.setProperty('--sf-panel-fit-max', Math.round(fitCap * 100) + '%');
      panel.style.maxWidth = maxPanelW + 'px';
      panel.style.width = 'auto';
      panel.style.maxHeight = maxPanelH + 'px';
      panel.style.overflow = 'hidden';

      var bases = readPanelBases(panel);
      var scale = 1;
      applyPanelScale(panel, scale, bases);
      for (var i = 0; i < 18; i++) {
        var fitsH = panel.scrollHeight <= maxPanelH - 2;
        var fitsW = panel.scrollWidth <= maxPanelW - 2;
        if (fitsH && fitsW) break;
        scale = Math.max(0.9, scale - 0.012);
        applyPanelScale(panel, scale, bases);
      }
      var naturalW = Math.ceil(panel.scrollWidth) + 2;
      var snugW = Math.max(132, Math.min(maxPanelW, naturalW));
      panel.style.width = snugW + 'px';
    });
  }

  var tuneResizeTimer = null;
  function scheduleTunePanels(root) {
    syncSceneLayout(root);
    global.requestAnimationFrame(function () {
      tuneScenePanels(root);
      global.clearTimeout(tuneResizeTimer);
      tuneResizeTimer = global.setTimeout(function () {
        syncSceneLayout(root);
        tuneScenePanels(root);
      }, 320);
    });
  }

  function postStatementText(post) {
    if (!post) return '';
    if (post.statement) return feedStatementOnly(post.statement, post.scholar || post.author || '');
    return postPreview(post);
  }

  function todayKey() {
    try {
      if (typeof darTodayKeyBerlin === 'function') return darTodayKeyBerlin();
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function hijriLabel() {
    try {
      if (typeof islamicCalendarNow === 'function') {
        var c = islamicCalendarNow();
        if (c && c.day && c.monthNameDe) return c.day + '. ' + c.monthNameDe + ' ' + (c.year || '');
      }
    } catch (e) {}
    return '';
  }

  function deviceSeed() {
    try {
      var id = localStorage.getItem(DEVICE_KEY);
      if (!id) {
        id = Math.random().toString(36).slice(2, 12);
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id;
    } catch (e) {
      return 'dev';
    }
  }

  function feedSeed() {
    var extra = '';
    try {
      extra = sessionStorage.getItem(REFRESH_KEY) || '';
    } catch (e) {}
    return todayKey() + '|' + deviceSeed() + (extra ? '|' + extra : '');
  }

  function hashNum(str) {
    var h = 2166136261;
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededPick(arr, seed, n) {
    if (!arr || !arr.length) return [];
    var copy = arr.slice();
    var s = hashNum(seed);
    for (var i = copy.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      var j = s % (i + 1);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy.slice(0, n);
  }

  function getCtx() {
    try {
      if (typeof darPremiumFeedAppContext === 'function') return darPremiumFeedAppContext();
    } catch (e) {}
    return {};
  }

  function isStaging() {
    try {
      if (typeof IS_STAGING_APP !== 'undefined' && IS_STAGING_APP) return true;
    } catch (e) {}
    return /\/test(?:\/|$)/.test(String(location.pathname || ''));
  }

  function comparePosts(a, b) {
    try {
      if (typeof comparePostsNewestFirst === 'function') return comparePostsNewestFirst(a, b);
    } catch (e) {}
    return String(b && b.date || '').localeCompare(String(a && a.date || ''));
  }

  function stripMd(s) {
    try {
      if (global && typeof global.stripMd === 'function') return global.stripMd(s);
    } catch (e) {}
    return String(s || '').replace(/[#*_`~\[\]]/g, '').trim();
  }

  function postPreview(post) {
    if (!post) return '';
    if (post.excerpt) return stripMd(post.excerpt);
    try {
      if (typeof findQuote === 'function') {
        var q = findQuote(post);
        if (q) return clamp(stripMd(q), 160);
      }
    } catch (e) {}
    if (post.statement) return clamp(stripMd(post.statement), 160);
    return clamp(post.title || '', 100);
  }

  function postImage(post) {
    if (!post) return '';
    if (post.imageSafe === false || post.safeImage === false) return '';
    return post.thumbnail || post.image || post.cover || '';
  }

  function normCat(c) {
    try {
      if (typeof normalizePostCategory === 'function') return normalizePostCategory(c);
    } catch (e) {}
    return String(c || '').trim() || 'Allgemein';
  }

  function readSeen() {
    try {
      var raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function markSeen(id) {
    if (!id) return;
    try {
      var list = readSeen();
      if (list.indexOf(String(id)) < 0) {
        list.unshift(String(id));
        localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(0, 400)));
      }
    } catch (e) {}
  }

  function cardKey(item) {
    return String(item.type || '') + '|' + String(item.uid || item.id || '');
  }

  function themeFor(type, seed) {
    var palettes = {
      post: ['#2a4538', '#101814'],
      archive: ['#3a3428', '#161410'],
      dua: ['#284838', '#0e1612'],
      quran: ['#243850', '#0e1218'],
      news: ['#4a2838', '#180e14'],
      prayer: ['#383828', '#141410'],
      category: ['#2a3848', '#101418']
    };
    var p = palettes[type] || palettes.post;
    var i = hashNum(seed) % 3;
    return { gradientFrom: p[0], gradientTo: p[1], accent: i === 0 ? '#d4b86a' : '#c9ae72' };
  }

  function fetchManual() {
    var staging = isStaging();
    var urls = [
      '/api/feed?staging=' + (staging ? '1' : '0') + '&v=' + encodeURIComponent(todayKey()),
      (staging ? '/content/staging/focus-feed/feed-index.json' : '/content/focus-feed/feed-index.json') + '?v=' + encodeURIComponent(todayKey())
    ];
    function tryNext(i) {
      if (i >= urls.length) return Promise.resolve({ items: [] });
      return fetch(urls[i], { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) return tryNext(i + 1);
          return r.json();
        })
        .catch(function () {
          return tryNext(i + 1);
        });
    }
    return tryNext(0);
  }

  function normalizeManual(raw) {
    if (!raw || raw.status === 'deleted') return null;
    if (raw.status && raw.status !== 'live') return null;
    var now = Date.now();
    if (raw.startsAt && Date.parse(raw.startsAt) > now) return null;
    if (raw.expiresAt && Date.parse(raw.expiresAt) <= now) return null;
    var tt = String(raw.targetType || 'none');
    var tid = String(raw.targetId || '');
    var target = raw.targetUrl || '';
    if (!target && tt === 'post' && tid) target = 'post:' + tid;
    if (!target && tt === 'dua' && tid) target = 'dua:' + tid;
    if (!target && tt === 'quran' && tid) target = 'quran:' + tid;
    if (!target && tt === 'category' && tid) target = 'topic:' + tid;
    if (!target && tt === 'news' && tid) target = 'news-detail:' + tid;
    if (!target && tt === 'prayer') target = 'prayer';
    if (!raw.title) return null;
    var badges = [];
    if (raw.badgeNeu) badges.push('Neu');
    if (raw.badgeEmpfohlen) badges.push('Empfohlen');
    if (raw.badgeWichtig) badges.push('Wichtig');
    return {
      uid: 'm-' + raw.id,
      id: raw.id,
      type: raw.type === 'manual' ? 'custom' : raw.type || 'custom',
      cardType: raw.cardSize === 'premium' ? 'lg' : raw.cardSize === 'mini' ? 'sm' : 'md',
      title: raw.title,
      preview: raw.preview || raw.text || '',
      category: raw.category || '',
      scholar: raw.scholar || '',
      date: raw.dateLabel || '',
      badges: badges,
      image: raw.imageSafe === false ? '' : (raw.thumbnailUrl || raw.imageUrl || ''),
      bgType: raw.bgType || '',
      imageSafe: raw.imageSafe !== false,
      imageGradient: raw.bgType === 'gradient' || raw.imageGradient === true,
      gradientFrom: raw.gradientFrom,
      gradientTo: raw.gradientTo,
      backgroundId: raw.backgroundId || '',
      backgroundMode: raw.backgroundMode || (raw.bgType === 'gradient' ? 'gradient' : 'auto'),
      backgroundSafe: raw.backgroundSafe !== false,
      topic: raw.topic || '',
      target: target,
      sort: typeof raw.order === 'number' ? raw.order - 1000 : -500,
      pinned: !!raw.pinned,
      manual: true
    };
  }

  function buildDemoItems() {
    var hijri = hijriLabel();
    var now = new Date().toISOString();
    return [
      {
        uid: 'demo-athar-1',
        type: 'post',
        title: 'Wissen ist Gottesfurcht',
        statement: 'Wissen besteht für den Menschen nicht in der Vielzahl der Überlieferungen, sondern Wissen ist Gottesfurcht.',
        preview: 'Echtes Wissen führt das Herz zu Taqwā — nicht nur zu vielen Worten.',
        category: 'Athar',
        date: now,
        hijriDate: hijri,
        badges: ['Vorschau', 'Athar'],
        image: '',
        target: 'topics',
        sort: -40,
        demo: true
      },
      {
        uid: 'demo-aqidah-1',
        type: 'post',
        title: 'Maßstab der Überlieferung',
        statement: 'Dieses Wissen ist Dīn, so schaut, von wem ihr euren Dīn nehmt.',
        preview: 'Ibn Sīrīn über Isnād, Quelle und Vertrauen in die Überlieferung.',
        category: 'Aqīdah',
        date: now,
        hijriDate: hijri,
        badges: ['Vorschau', 'Aqīdah'],
        image: '',
        target: 'topics',
        sort: -39,
        demo: true
      },
      {
        uid: 'demo-dua-1',
        type: 'dua',
        title: 'Duʿāʾ bei Bedrängnis',
        statement: '',
        preview: 'رَبِّ إِنِّي مَغْلُوبٌ فَانْتَصِرْ — Mein Herr, ich bin überwältigt, so hilf du mir.',
        category: 'Duʿāʾ',
        date: now,
        badges: ['Vorschau', 'Duʿāʾ'],
        target: 'duas',
        sort: -38,
        demo: true
      },
      {
        uid: 'demo-adab-1',
        type: 'post',
        title: 'Sprich Gutes oder schweige',
        statement: 'Wer an ALLAH und den Jüngsten Tag glaubt, der sage Gutes oder schweige.',
        preview: 'Adab der Zunge — aus authentischer Sunnah.',
        category: 'Adab',
        date: now,
        badges: ['Vorschau', 'Adab'],
        image: '',
        target: 'topics',
        sort: -36,
        demo: true
      }
    ];
  }

  function buildPools(ctx, seed) {
    var hijri = hijriLabel();
    var posts = (ctx.posts || []).slice().sort(comparePosts);
    var duas = ctx.duas || [];
    var newest = posts.slice(0, 8);
    var archive = posts.slice(8);
    var pools = { newest: [], archive: [], dua: [], quran: [], news: [], hint: [], category: [], manual: [] };

    newest.forEach(function (p, i) {
      if (!p || !p.id) return;
      var th = themeFor('post', seed + 'n' + p.id);
      pools.newest.push({
        uid: 'post-new-' + p.id,
        type: 'post',
        cardType: i < 2 ? 'lg' : 'md',
        title: p.title || 'Beitrag',
        preview: postPreview(p),
        statement: postStatementText(p),
        category: normCat(p.category),
        scholar: p.scholar || p.author || '',
        source: p.source || '',
        sourceDetail: postSourceDetail(p),
        book: p.book || '',
        date: p.date || '',
        hijriDate: i < 3 ? hijri : '',
        badges: i === 0 ? ['Neu', 'Heute'] : i < 3 ? ['Neu'] : [],
        image: postImage(p),
        imageSafe: p.imageSafe === true,
        target: 'post:' + p.id,
        sort: 10 + i,
        postId: String(p.id)
      });
    });

    seededPick(archive, seed + 'arch', Math.min(archive.length, 40)).forEach(function (p, i) {
      if (!p || !p.id) return;
      pools.archive.push({
        uid: 'post-arch-' + p.id,
        type: 'archive',
        cardType: 'md',
        title: p.title || 'Beitrag',
        preview: postPreview(p),
        statement: postStatementText(p),
        category: normCat(p.category),
        scholar: p.scholar || '',
        source: p.source || '',
        sourceDetail: postSourceDetail(p),
        book: p.book || '',
        date: p.date || '',
        badges: ['Aus dem Archiv'],
        image: postImage(p),
        imageSafe: p.imageSafe === true,
        target: 'post:' + p.id,
        sort: 200 + i,
        postId: String(p.id)
      });
    });

    try {
      if (typeof dailyDua === 'function') {
        var dd = dailyDua();
        if (dd) {
          pools.dua.push({
            uid: 'dua-day-' + dd.id,
            type: 'dua',
            cardType: 'md',
            title: dd.title || 'Duʿāʾ des Tages',
            preview: (dd.ar ? dd.ar + ' — ' : '') + (dd.de || dd.tr || ''),
            ar: dd.ar || '',
            tr: dd.tr || '',
            de: dd.de || '',
            duaCat: dd.cat || '',
            bookRef: String(dd.src || dd.ref || '').replace(/^📝\s*/, '').trim(),
            source: dd.cat ? 'Duʿāʾ · ' + dd.cat : (dd.ref || dd.source || 'Duʿāʾ des Tages'),
            category: 'Duʿāʾ',
            date: todayKey(),
            hijriDate: hijri,
            badges: ['Heute', 'Duʿāʾ'],
            target: 'dua:' + dd.id,
            sort: 30,
            duaId: String(dd.id)
          });
        }
      }
    } catch (e) {}

    seededPick(duas.filter(function (d) { return d && d.id; }), seed + 'duas', 8).forEach(function (d, i) {
      pools.dua.push({
        uid: 'dua-' + d.id,
        type: 'dua',
        cardType: 'sm',
        title: d.title || 'Duʿāʾ',
        preview: (d.ar ? d.ar + ' — ' : '') + (d.de || d.tr || d.ar || ''),
        ar: d.ar || '',
        tr: d.tr || '',
        de: d.de || '',
        duaCat: d.cat || '',
        bookRef: String(d.src || d.ref || '').replace(/^📝\s*/, '').trim(),
        source: d.cat ? 'Duʿāʾ · ' + d.cat : (d.ref || d.source || 'Duʿāʾ'),
        category: 'Duʿāʾ',
        badges: ['Duʿāʾ'],
        target: 'dua:' + d.id,
        sort: 220 + i,
        duaId: String(d.id)
      });
    });

    try {
      var qm = ctx.quranMeta || {};
      var surahs = qm.surahs || qm.popular || [];
      seededPick(surahs.filter(function (s) { return s && (s.id || s.surah); }), seed + 'q', 6).forEach(function (s, i) {
        var sid = s.id || s.surah;
        pools.quran.push({
          uid: 'quran-' + sid,
          type: 'quran',
          cardType: i === 0 ? 'md' : 'sm',
          title: s.transliteration || s.title || 'Sure ' + sid,
          preview: clamp(s.translation || s.meaning || s.note || '', 120),
          category: 'Qurʾān',
          badges: ['Qurʾān', 'Empfohlen'],
          target: 'quran:' + sid,
          sort: 240 + i
        });
      });
    } catch (e) {}

    try {
      if (typeof activeCurrentUpdates === 'function') {
        activeCurrentUpdates().slice(0, 4).forEach(function (n, i) {
          pools.news.push({
            uid: 'news-' + (n.id || i),
            type: 'news',
            cardType: i === 0 ? 'md' : 'sm',
            title: n.title || 'Neu im Fokus',
            preview: clamp(n.text || n.body || '', 120),
            category: 'News',
            date: n.date || '',
            badges: ['Neu', n.ttlHours ? '24h' : ''],
            target: 'news-detail:' + (n.id || i),
            sort: 20 + i
          });
        });
      }
    } catch (e) {}

    return pools;
  }

  function mergeFeed(pools, manualItems, seed) {
    var out = [];
    var seen = {};

    manualItems.forEach(function (m) {
      var n = normalizeManual(m);
      if (!n) return;
      seen[cardKey(n)] = true;
      out.push(n);
    });

    out.sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0);
    });

    var head = pools.newest.slice(0, 5);
    head.forEach(function (item) {
      if (seen[cardKey(item)]) return;
      seen[cardKey(item)] = true;
      out.push(item);
    });

    var mix = []
      .concat(pools.dua.slice(0, 3))
      .concat(pools.archive)
      .concat(pools.dua.slice(3));

    mix = seededPick(mix.filter(function (it) {
      return it && !seen[cardKey(it)];
    }), seed + 'mix', mix.length);

    var weights = { newest: 0.5, archive: 0.3, extra: 0.2 };
    var ni = 0;
    var ai = 0;
    var mi = 0;
    while (ni < pools.newest.length || ai < mix.length) {
      var r = (hashNum(seed + 'w' + out.length) % 100) / 100;
      if (r < weights.newest && ni < pools.newest.length) {
        var nItem = pools.newest[ni++];
        if (!seen[cardKey(nItem)]) {
          seen[cardKey(nItem)] = true;
          out.push(nItem);
        }
      } else if (r < weights.newest + weights.archive && mi < mix.length) {
        var mItem = mix[mi++];
        if (!seen[cardKey(mItem)]) {
          seen[cardKey(mItem)] = true;
          out.push(mItem);
        }
      } else if (ai < pools.archive.length) {
        var aItem = pools.archive[ai++];
        if (!seen[cardKey(aItem)]) {
          seen[cardKey(aItem)] = true;
          out.push(aItem);
        }
      } else if (mi < mix.length) {
        var x = mix[mi++];
        if (!seen[cardKey(x)]) {
          seen[cardKey(x)] = true;
          out.push(x);
        }
      } else break;
    }

    while (mi < mix.length) {
      var rest = mix[mi++];
      if (!seen[cardKey(rest)]) {
        seen[cardKey(rest)] = true;
        out.push(rest);
      }
    }

    return dedupeAdjacent(out);
  }

  function dedupeAdjacent(list) {
    if (list.length < 2) return list;
    var out = list.slice();
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 1; i < out.length; i++) {
        if (cardKey(out[i]) === cardKey(out[i - 1]) || (out[i].type === out[i - 1].type && out[i].title === out[i - 1].title)) {
          for (var j = i + 1; j < out.length; j++) {
            if (cardKey(out[j]) !== cardKey(out[i]) && out[j].type !== out[i].type) {
              var tmp = out[i];
              out[i] = out[j];
              out[j] = tmp;
              break;
            }
          }
        }
      }
    }
    return out;
  }

  function filterItems(items) {
    var base = items.filter(isFeedContentItem);
    var f = state.filter;
    if (f === 'all') return base;
    if (f === 'posts') return base.filter(function (it) { return it.type === 'post' || it.type === 'archive' || it.type === 'custom'; });
    if (f === 'duas') return base.filter(function (it) { return it.type === 'dua'; });
    return base;
  }

  function ctaLabel(item) {
    if (item.type === 'post' || item.type === 'archive') return item.type === 'archive' ? 'Entdecken' : 'Beitrag lesen';
    if (item.type === 'dua') return 'Duʿāʾ öffnen';
    if (item.type === 'quran') return 'Qurʾān öffnen';
    if (item.type === 'news') return 'Meldung öffnen';
    if (item.type === 'prayer') return 'Gebetszeiten';
    if (item.type === 'category') return 'Kategorie öffnen';
    return 'Öffnen';
  }

  function injectFonts() {
    if (document.getElementById(FONTS_ID)) return;
    var families = [
      'Amiri:wght@400;700',
      'Cormorant+Garamond:wght@400;500;600;700',
      'EB+Garamond:wght@400;500;600;700',
      'Lora:wght@400;500;600;700',
      'Merriweather:wght@400;700',
      'Playfair+Display:wght@400;500;600;700',
      'Libre+Baskerville:wght@400;700',
      'Crimson+Pro:wght@400;500;600;700',
      'Source+Serif+4:wght@400;500;600;700',
      'Spectral:wght@400;500;600;700',
      'Raleway:wght@400;500;600;700',
      'Montserrat:wght@400;500;600;700',
      'Cinzel:wght@400;500;600;700',
      'Noto+Naskh+Arabic:wght@400;500;600;700',
      'Allura',
      'Dancing+Script',
      'Great+Vibes',
      'Pinyon+Script',
      'Sacramento',
      'Italianno',
      'Parisienne',
      'Tangerine',
      'Inter:wght@400;500;600'
    ];
    var link = document.createElement('link');
    link.id = FONTS_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + families.join('&family=') + '&display=swap';
    document.head.appendChild(link);
  }

  function injectStyles() {
    injectFonts();
    var old = document.getElementById(STYLES_ID);
    if (old) old.remove();
    var css =
      '.sf-app{position:relative;display:flex;flex-direction:column;align-items:stretch;min-height:inherit;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)));color:var(--theme-text,var(--text));overflow:hidden;width:100%;max-width:100%;box-sizing:border-box}' +
      '.sf-app:before{content:"";position:absolute;inset:0;pointer-events:none;background:var(--theme-feed-aura,transparent);z-index:0}' +
      '.sf-app>*{position:relative;z-index:1}' +
      '#premiumFeedMount,.pf-mount-root{width:100%;max-width:100%;margin:0;padding:0;box-sizing:border-box;overflow-x:hidden}' +
      '.sf-top{position:sticky;top:0;z-index:8;padding:12px var(--sf-gutter-right,var(--sf-shell-pad,10px)) 10px var(--sf-gutter-left,var(--sf-shell-pad,10px));background:var(--theme-feed-top,linear-gradient(180deg,rgba(8,8,6,.97),transparent));border-bottom:1px solid var(--theme-feed-head-border,var(--theme-border,var(--line)));backdrop-filter:blur(16px) saturate(1.1);width:100%;max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto;box-sizing:border-box}' +
      '.sf-top-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}' +
      '.sf-brand{display:flex;align-items:center;gap:10px;min-width:0}' +
      '.sf-brand-mark{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--theme-border,var(--line));box-shadow:0 4px 18px rgba(0,0,0,.18);flex:0 0 36px;overflow:hidden;background:var(--theme-glass,rgba(12,10,8,.72))}' +
      '.sf-logo-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}' +
      '.sf-brand-text{min-width:0}' +
      '.sf-brand-kicker{display:block;font-size:8px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--theme-feed-accent-soft,var(--theme-muted,var(--muted)));margin-bottom:2px}' +
      '.sf-brand h1{margin:0;font-family:var(--serif,Cinzel,serif);font-size:18px;font-weight:700;color:var(--theme-accent,var(--gold2));letter-spacing:.06em;line-height:1}' +
      '.sf-refresh{border:1px solid var(--theme-border,var(--line));background:var(--theme-feed-act-bg,rgba(255,255,255,.06));color:var(--theme-accent,var(--gold2));width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:17px;box-shadow:0 4px 14px rgba(0,0,0,.12)}' +
      '.sf-switch{display:flex;gap:4px;padding:4px;background:var(--theme-feed-switch-bg,rgba(255,255,255,.05));border-radius:999px;border:1px solid var(--theme-feed-switch-border,var(--theme-border,var(--line)))}' +
      '.sf-switch-btn{flex:1;border:0;background:transparent;color:var(--theme-muted,var(--muted));border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer}' +
      '.sf-switch-btn.is-active{background:var(--theme-feed-switch-active,linear-gradient(135deg,rgba(214,190,132,.24),rgba(155,122,60,.18)));color:var(--theme-text,var(--text));border:1px solid var(--theme-border,var(--line));box-shadow:0 4px 14px rgba(0,0,0,.12)}' +
      '.sf-filters{display:flex;gap:7px;overflow-x:auto;padding:2px var(--sf-gutter-right,var(--sf-shell-pad,10px)) 12px var(--sf-gutter-left,var(--sf-shell-pad,10px));scrollbar-width:none;-webkit-overflow-scrolling:touch;width:100%;max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto;box-sizing:border-box}' +
      '.sf-filters::-webkit-scrollbar{display:none}' +
      '.sf-filter{flex:0 0 auto;border:1px solid var(--theme-feed-filter-border,var(--theme-border,var(--line)));background:var(--theme-feed-filter-bg,rgba(255,255,255,.04));color:var(--theme-text,var(--text));border-radius:999px;padding:7px 13px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap;opacity:.88}' +
      '.sf-filter.is-active{border-color:var(--theme-border,var(--line));background:var(--theme-feed-filter-active,linear-gradient(135deg,rgba(214,190,132,.18),rgba(90,70,30,.12)));color:var(--theme-accent,var(--gold2));opacity:1}' +
      '.sf-feed{display:flex;flex-direction:column;gap:var(--sf-card-gap,20px);padding:0 var(--sf-gutter-right,var(--sf-shell-pad,10px)) calc(24px + env(safe-area-inset-bottom)) var(--sf-gutter-left,var(--sf-shell-pad,10px));width:100%;max-width:var(--sf-feed-col-max,100%);box-sizing:border-box;margin-left:auto;margin-right:auto;min-width:0}' +
      '.sf-post{margin:0;border-radius:var(--sf-card-radius,26px);overflow:hidden;cursor:pointer;background:var(--theme-feed-card,var(--theme-surface,transparent));border:1px solid var(--theme-border,var(--line));box-shadow:var(--premium-shadow,none);width:100%;max-width:100%;min-width:0;box-sizing:border-box;align-self:stretch}' +
      '.sf-post--demo{border-color:var(--theme-border,var(--line));box-shadow:var(--premium-shadow,0 12px 32px rgba(0,0,0,.28))}' +
      '.sf-post__head{display:flex;align-items:center;gap:10px;padding:10px 12px 8px;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)))}' +
      '.sf-avatar{width:40px;height:40px;border-radius:50%;background:var(--theme-feed-avatar-bg,linear-gradient(145deg,rgba(239,215,142,.42),rgba(90,70,30,.62)));border:1.5px solid var(--theme-border,var(--line));display:grid;place-items:center;font-size:14px;font-weight:900;color:var(--theme-text,var(--text));flex:0 0 40px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.16)}' +
      '.sf-avatar img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sf-post__meta{flex:1;min-width:0}' +
      '.sf-user{display:block;font-size:13px;font-weight:800;color:var(--theme-text,var(--text));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sf-sub{display:block;font-size:10px;color:var(--theme-muted,var(--muted));margin-top:1px}' +
      '.sf-more{border:0;background:var(--theme-feed-act-bg,rgba(255,255,255,.05));color:var(--theme-text,var(--text));font-size:16px;line-height:1;padding:6px 8px;border-radius:999px;cursor:pointer;opacity:.82}' +
      '.sf-post__media{position:relative;background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));min-height:180px;overflow:hidden;border-radius:0;width:100%;max-width:100%;min-width:0;box-sizing:border-box;line-height:0;font-size:0}' +
      '.sf-post__scene{position:relative;width:100%;height:var(--sf-scene-h,auto);min-height:228px;display:flex;align-items:stretch;justify-content:center;padding:8px 0 var(--sf-footer-h,42px);overflow:hidden;max-width:100%;min-width:0;margin:0;isolation:isolate;transform:translateZ(0);-webkit-transform:translateZ(0);background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));box-sizing:border-box}' +
      '.sf-post__bg,.sf-post__bg--grad{position:absolute;inset:0;left:0;right:0;top:0;bottom:0;width:100%;height:100%;min-width:100%;min-height:100%;object-fit:cover;object-position:center;z-index:0;display:block;background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));image-rendering:auto;box-sizing:border-box}' +
      '.sf-post__bg--grad{background-size:cover;background-position:center;background-repeat:no-repeat}' +
      '.sf-post__scene-shade{position:absolute;inset:0;z-index:1;background:var(--theme-feed-overlay,linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,.52)));pointer-events:none}' +
      '.sf-scene-badge{position:absolute;top:var(--sf-badge-top,18px);left:var(--sf-badge-left,18px);z-index:5;width:var(--sf-badge-size,46px);height:var(--sf-badge-size,46px);border-radius:50%;padding:3px;background:var(--theme-feed-badge-bg,var(--theme-glass,rgba(8,7,5,.48)));backdrop-filter:blur(10px) saturate(1.1);-webkit-backdrop-filter:blur(10px) saturate(1.1);border:1px solid var(--theme-feed-badge-border,var(--theme-border,var(--line)));box-shadow:0 4px 16px rgba(0,0,0,.22);pointer-events:none;display:grid;place-items:center}' +
      '.sf-scene-badge .sf-badge-logo{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}' +
      '.sf-scene-brand{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:6px 8px 7px;background:var(--theme-feed-brand-bar,linear-gradient(180deg,transparent,rgba(0,0,0,.76)));display:flex;flex-direction:column;gap:3px;align-items:center;pointer-events:none}' +
      '.sf-brand-signature-row{display:flex;flex-wrap:nowrap;align-items:center;justify-content:center;gap:clamp(3px,1vw,7px);max-width:100%;padding:0 2px}' +
      '.sf-brand-chip{display:inline-flex;align-items:center;gap:2px;font-size:clamp(6px,1.8vw,7.5px);font-weight:800;color:var(--theme-feed-shade-text,var(--theme-text,var(--text)));background:var(--theme-feed-chip,rgba(8,7,5,.42));border:1px solid var(--theme-border,var(--line));border-radius:999px;padding:2px 5px;line-height:1;white-space:nowrap;flex:0 0 auto}' +
      '.sf-brand-chip svg{width:clamp(8px,2.4vw,10px);height:clamp(8px,2.4vw,10px);flex:0 0 auto;display:block}' +
      '.sf-brand-site{display:inline-flex;align-items:center;gap:3px;font-size:clamp(6px,1.7vw,7px);letter-spacing:.1em;text-transform:uppercase;color:var(--theme-feed-accent-soft,var(--theme-muted,var(--muted)));font-weight:800;line-height:1}' +
      '.sf-brand-site svg{width:clamp(8px,2.2vw,10px);height:clamp(8px,2.2vw,10px);flex:0 0 auto}' +
      '.sf-brand-signature{font-family:"Allura","Brush Script MT",cursive;font-size:clamp(11px,3vw,13px);color:var(--theme-feed-signature,var(--theme-accent,var(--gold2)));line-height:1;letter-spacing:.015em;flex:0 1 auto;min-width:0;text-align:center;white-space:nowrap}' +
      '.sf-post__scene-inner{position:relative;z-index:3;width:100%;max-width:100%;min-width:0;display:flex;align-items:center;justify-content:center;padding:var(--sf-panel-inset-top,4px) var(--sf-panel-inset-x,var(--sf-panel-inset,12px)) var(--sf-panel-inset-bottom,4px);max-height:calc(100% - var(--sf-footer-h,50px));box-sizing:border-box;margin:0}' +
      '.sf-post__textpanel{width:auto;max-width:min(100%,var(--sf-panel-fit-max,88%));min-width:min(52%,10.5rem);padding:var(--sf-panel-pad,clamp(12px,3.2vw,16px));border-radius:clamp(14px,3.6vw,18px);background:var(--theme-feed-panel,rgba(255,248,240,.09));border:1px solid var(--theme-feed-panel-border,var(--theme-border,var(--line)));box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 2px 16px rgba(0,0,0,.08);backdrop-filter:blur(20px) saturate(1.22);-webkit-backdrop-filter:blur(20px) saturate(1.22);box-sizing:border-box;text-align:center;overflow:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;backface-visibility:hidden;-webkit-backface-visibility:hidden;color:var(--theme-feed-panel-text,var(--theme-text,var(--text)))}' +
      '.sf-post__img{width:100%;max-width:100%;min-width:100%;height:auto;display:block;aspect-ratio:4/5;object-fit:cover;object-position:center;background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));border-radius:0;vertical-align:top}' +
      '.sf-post__quote{margin:0;line-height:1.55;text-shadow:none;width:100%;color:var(--theme-feed-panel-text,var(--theme-text,var(--text)))}' +
      '.sf-quote-mark{display:block;font-size:var(--sf-mark-size,20px);line-height:1;color:var(--theme-feed-mark,var(--theme-accent,var(--gold2)));font-family:Georgia,serif;margin-bottom:8px}' +
      '.sf-quote-text{display:block;margin:0;max-width:100%;word-wrap:break-word;overflow-wrap:anywhere;line-height:1.5;font-size:var(--sf-main-size,15px);color:var(--theme-accent,var(--gold2));font-weight:700}' +
      '.sf-quote-source{margin-top:10px;padding-top:8px;border-top:1px solid var(--theme-feed-dua-divider,var(--theme-border,var(--line)));font-size:var(--sf-src-size,10px);line-height:1.45;opacity:.88;font-style:italic;color:var(--theme-muted,var(--muted));word-wrap:break-word;overflow-wrap:anywhere;white-space:normal}' +
      '.sf-quote-scholar{margin-top:10px;font-size:var(--sf-scholar-size,11px);line-height:1.42;opacity:.92;font-weight:700;color:var(--theme-accent,var(--gold2))}' +
      '.sf-post__dua{margin:0;padding:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:clamp(9px,2.2vw,12px);width:100%;text-align:center}' +
      '.sf-post__dua-ar{direction:rtl;font-family:"Noto Naskh Arabic",serif;font-size:var(--sf-ar-size,22px);line-height:1.52;margin:0;width:100%;text-align:center;text-shadow:none;color:var(--theme-feed-panel-text,var(--theme-text,var(--text)));opacity:1;font-weight:500;letter-spacing:.01em}' +
      '.sf-post__dua-tr{font-size:var(--sf-tr-size,15px);line-height:1.46;letter-spacing:.025em;color:var(--theme-feed-trans,var(--theme-accent,var(--gold2)));width:100%;text-align:center;text-shadow:none;font-style:italic;font-weight:500;opacity:.93}' +
      '.sf-post__dua-de{font-size:var(--sf-main-size,15px);line-height:1.5;margin:0;width:100%;text-align:center;text-shadow:none;color:var(--theme-feed-panel-text,var(--theme-text,var(--text)));opacity:.97;font-weight:400}' +
      '.sf-dua-em,.sf-text-em{display:inline;font-family:' + EMPHASIS_SCRIPT + ';font-size:1.22em;line-height:1.05;font-weight:400;font-style:normal;color:var(--theme-feed-em,var(--theme-accent,var(--gold2)));text-decoration:underline;text-decoration-color:var(--theme-feed-em-underline,var(--theme-accent,var(--gold2)));text-underline-offset:4px;text-decoration-thickness:1px;white-space:nowrap;box-decoration-break:clone;-webkit-box-decoration-break:clone}' +
      '.sf-dua-source{margin-top:8px;padding-top:8px;border-top:1px solid var(--theme-feed-dua-divider,var(--theme-border,var(--line)));width:100%;text-align:center;display:flex;flex-direction:column;gap:3px;align-items:center}' +
      '.sf-dua-cat{font-size:var(--sf-src-size,11px);line-height:1.35;font-weight:800;color:var(--theme-accent,var(--gold2));letter-spacing:.02em}' +
      '.sf-dua-book{font-size:max(10.5px,var(--sf-src-size,11px));line-height:1.42;font-style:italic;opacity:.9;color:var(--theme-muted,var(--muted));max-width:100%;word-wrap:break-word}' +
      '.sf-post__textpanel--dua{max-width:min(100%,var(--sf-panel-fit-max,92%))!important;width:auto;border-radius:clamp(10px,2.4vw,14px)}' +
      '.sf-post__scene-inner--full{padding-top:4px!important;padding-bottom:4px!important;padding-left:var(--sf-panel-inset-x,var(--sf-panel-inset,12px))!important;padding-right:var(--sf-panel-inset-x,var(--sf-panel-inset,12px))!important;width:100%;max-width:100%;min-width:0;margin:0!important}' +
      '.sf-post__actions{display:flex;align-items:center;padding:8px 12px 10px;gap:8px;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)))}' +
      '.sf-actions-left{display:flex;align-items:center;gap:4px;flex:1}' +
      '.sf-act{border:0;background:var(--theme-feed-act-bg,rgba(255,255,255,.04));color:var(--theme-text,var(--text));min-width:42px;height:38px;border-radius:12px;cursor:pointer;font-size:20px;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 10px;border:1px solid var(--theme-feed-act-border,var(--theme-border,var(--line)));transition:transform .15s ease,background .15s ease,color .15s ease}' +
      '.sf-act:active{transform:scale(.94)}' +
      '.sf-act.is-liked{color:#ff6b81;background:rgba(255,107,129,.12);border-color:rgba(255,107,129,.28)}' +
      '.sf-act.is-saved{color:var(--theme-accent,var(--gold2));background:rgba(239,215,142,.1);border-color:var(--theme-border,var(--line))}' +
      '.sf-act.is-busy{opacity:.55;pointer-events:none}' +
      '.sf-like-count{font-size:12px;font-weight:800;color:var(--theme-muted,var(--muted));min-width:1.2em}' +
      '.sf-act-label{font-size:11px;font-weight:700;letter-spacing:.02em}' +
      '.sf-post__body{padding:0 14px 16px}' +
      '.sf-caption{margin:0 0 6px;font-size:13px;line-height:1.45;color:var(--theme-text,var(--text))}' +
      '.sf-caption b{font-weight:800;color:var(--theme-accent,var(--gold2))}' +
      '.sf-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
      '.sf-tag{font-size:9px;padding:4px 9px;border-radius:999px;background:var(--theme-feed-filter-bg,rgba(255,255,255,.06));border:1px solid var(--theme-feed-filter-border,var(--theme-border,var(--line)));color:var(--theme-text,var(--text));opacity:.9;font-weight:700}' +
      '.sf-tag--demo{border-color:var(--theme-border,var(--line));color:var(--theme-accent,var(--gold2));background:var(--theme-feed-filter-active,transparent)}' +
      '.sf-loader{padding:20px;text-align:center;color:var(--theme-feed-loader,var(--theme-muted,var(--muted)));font-size:12px}' +
      '.sf-empty{padding:32px 20px;text-align:center;color:var(--theme-muted,var(--muted));font-size:13px;line-height:1.5}' +
      'body.is-feed-fullscreen .sf-app{width:100%;max-width:100%;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)));box-sizing:border-box;align-items:center}' +
      'body.is-feed-fullscreen .sf-top,body.is-feed-fullscreen .sf-filters,body.is-feed-fullscreen .sf-feed{width:100%;max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto}' +
      'body.is-feed-fullscreen .sf-feed{padding:0 var(--sf-gutter-right,var(--sf-shell-pad,10px)) calc(24px + env(safe-area-inset-bottom)) var(--sf-gutter-left,var(--sf-shell-pad,10px));gap:var(--sf-card-gap,20px);max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box;min-width:0}' +
      'body.is-feed-fullscreen .sf-post{border-radius:var(--sf-card-radius,26px);margin:0;border:none;background:var(--theme-feed-card,var(--theme-surface,transparent));box-shadow:var(--premium-shadow,none);width:100%;max-width:100%;min-width:0;box-sizing:border-box;align-self:stretch}' +
      'body.is-feed-fullscreen .sf-post__media{border-radius:0;width:100%;max-width:100%;min-width:0;overflow:hidden;line-height:0}' +
      'body.is-feed-fullscreen .sf-post__scene{width:100%;max-width:100%;min-width:0;margin:0;padding-left:0;padding-right:0}' +
      'body.is-feed-fullscreen .sf-post__bg,body.is-feed-fullscreen .sf-post__bg--grad{width:100%;min-width:100%;left:0;right:0;object-fit:cover;object-position:center}' +
      'body.is-feed-fullscreen .sf-post__img{width:100%;max-width:100%;min-width:100%;display:block;object-fit:cover;object-position:center;vertical-align:top}' +
      'body.is-feed-fullscreen .sf-post__head,body.is-feed-fullscreen .sf-post__actions{background:var(--theme-feed-bg,var(--outer-bg,var(--bg)))}' +
      'body.is-feed-fullscreen .sf-top,body.is-feed-fullscreen .sf-filters{max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto}' +
      'body.is-feed-fullscreen .sf-top{padding-left:var(--sf-gutter-left,var(--sf-shell-pad,10px));padding-right:var(--sf-gutter-right,var(--sf-shell-pad,10px))}' +
      'body.is-feed-fullscreen .sf-filters{padding-left:var(--sf-gutter-left,var(--sf-shell-pad,10px));padding-right:var(--sf-gutter-right,var(--sf-shell-pad,10px))}' +
      'body.is-premium-feed-view .sf-feed,body.is-premium-feed-view .sf-post,body.is-premium-feed-view .sf-post__media,body.is-premium-feed-view .sf-post__scene,body.is-premium-feed-view .sf-post__bg,body.is-premium-feed-view .sf-post__img{width:100%;max-width:100%;min-width:0;box-sizing:border-box}' +
      'body.is-premium-feed-view .float-actions{opacity:.45;pointer-events:none}' +
      '@media(max-width:700px){.sf-feed{padding:0 var(--sf-gutter-right,var(--sf-shell-pad,10px)) calc(24px + env(safe-area-inset-bottom)) var(--sf-gutter-left,var(--sf-shell-pad,10px))}body.is-feed-fullscreen .sf-feed{padding:0 var(--sf-gutter-right,var(--sf-shell-pad,10px)) calc(24px + env(safe-area-inset-bottom)) var(--sf-gutter-left,var(--sf-shell-pad,10px))}.sf-feed,.sf-top,.sf-filters{max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box}}' +
      '@media(max-width:360px){.sf-brand-signature{font-size:9px}.sf-brand-chip{font-size:6px;padding:1px 4px}}' +
      '@media(min-width:768px){.sf-app{width:100%;max-width:100%}.sf-feed,.sf-top,.sf-filters{width:100%;max-width:var(--sf-feed-col-max,100%);margin-left:auto;margin-right:auto;box-sizing:border-box}}';

    var el = document.createElement('style');
    el.id = STYLES_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function brandIconSvg(kind) {
    if (kind === 'telegram') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#2AABEE"/><path d="M17.6 6.8 5.8 11.35c-.8.32-.8.77-.15.97l3.03.95 1.17 3.74c.15.42.08.58.52.58.34 0 .49-.15.68-.34l1.64-1.6 3.42 2.53c.63.35 1.08.17 1.24-.58l2.1-9.9c.24-.92-.35-1.34-.94-1.07Zm-1.82 2.17-5.74 5.18-.23 2.44-.95-3.05 6.92-4.37Z" fill="#fff"/></svg>';
    }
    if (kind === 'instagram') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sfIg" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#feda75"/><stop offset="35%" stop-color="#fa7e1e"/><stop offset="65%" stop-color="#d62976"/><stop offset="100%" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#sfIg)"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.25" fill="#fff"/></svg>';
    }
    if (kind === 'web') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="rgba(239,215,142,.85)" stroke-width="1.6"/><path d="M4 12h16M12 4c2.8 2.8 4 6 4 8s-1.2 5.2-4 8M12 4c-2.8 2.8-4 6-4 8s1.2 5.2 4 8" fill="none" stroke="rgba(239,215,142,.85)" stroke-width="1.4"/></svg>';
    }
    return '';
  }

  function brandStripHtml() {
    return (
      '<div class="sf-scene-brand" aria-hidden="true">' +
        '<span class="sf-brand-site">' + brandIconSvg('web') + esc(BRAND.site) + '</span>' +
        '<div class="sf-brand-signature-row">' +
          '<span class="sf-brand-chip">' + brandIconSvg('instagram') + esc(BRAND.instagram) + '</span>' +
          '<span class="sf-brand-signature">' + esc(BRAND.signature) + '</span>' +
          '<span class="sf-brand-chip">' + brandIconSvg('telegram') + esc(BRAND.telegram) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function sceneBadgeHtml() {
    return (
      '<div class="sf-scene-badge" aria-hidden="true">' +
        '<img class="sf-badge-logo" src="' + APP_LOGO + '" alt="" loading="eager" decoding="async">' +
      '</div>'
    );
  }

  function sceneBgHtml(item, fallbacks, eager) {
    var bg = resolveSceneBg(item);
    item._sceneBg = bg;
    if (bg.kind === 'gradient') {
      return '<div class="sf-post__bg sf-post__bg--grad" style="background:' + bg.value + '" aria-hidden="true"></div>';
    }
    var loadMode = eager ? 'eager' : 'lazy';
    var fpX = bg.focusX != null ? bg.focusX : 50;
    var fpY = bg.focusY != null ? bg.focusY : 50;
    return (
      '<img class="sf-post__bg" src="' + esc(bg.value) + '" alt="' + esc(bg.alt || '') + '" decoding="async" loading="' + loadMode + '" ' +
      'style="object-position:' + fpX + '% ' + fpY + '%" ' +
      'data-sf-bg-fallbacks="' + esc(fallbacks) + '" data-sf-bg-idx="0" ' +
      'data-sf-grad="' + esc(gradientStyleFor(item)) + '">'
    );
  }

  function sourceHtml(item, fs) {
    var lines = sourceLinesFor(item);
    if (!lines.scholar && !lines.detail) return '';
    var style = 'font-family:' + (fs && fs.css ? fs.css : 'Georgia,serif') + ';text-align:center';
    var html = '';
    if (lines.scholar && item.type !== 'dua') {
      html += '<div class="sf-quote-scholar" style="' + style + '">' + esc(lines.scholar) + '</div>';
    }
    if (lines.detail) {
      html += '<div class="sf-quote-source" style="' + style + '">' + esc(lines.detail) + '</div>';
    }
    return html;
  }

  function sceneBlock(item, inner, style, textForSize, typeSizes, opts) {
    opts = opts || {};
    var fs = style || fontStyleFor(item);
    var fallbacks = allBgFallbacks(item).join('|');
    var bgPreview = resolveSceneBg(item);
    var shadeStyle = bgPreview.overlay ? 'background:' + bgPreview.overlay : '';
    var fpX = bgPreview.focusX != null ? bgPreview.focusX : 50;
    var fpY = bgPreview.focusY != null ? bgPreview.focusY : 50;
    var sceneStyle = '--sf-focus-x:' + fpX + '%;--sf-focus-y:' + fpY + '%';
    var mainText = textForSize || overlayTextFor(item) || '';
    var lines = sourceLinesFor(item);
    var sizes = typeSizes || computeTypeSizes(item, '', mainText, '', !!lines.scholar, !!lines.detail);
    var align = layoutAlignFor(item, mainText.length);
    var panelStyle = panelStyleFor(item, mainText, align) + typeVarsStyle(sizes);
    var innerStyle = 'justify-content:center;align-items:center';
    var innerClass = 'sf-post__scene-inner' + (opts.innerExtra ? ' ' + opts.innerExtra : '');
    var panelClass = 'sf-post__textpanel' + (opts.panelExtra ? ' ' + opts.panelExtra : '');
    var sceneExtra = opts.isDua ? ' data-sf-dua="1"' : '';
    var eager = !!opts.eagerBg;
    return (
      '<div class="sf-post__scene"' + sceneExtra + ' style="' + sceneStyle + '">' +
        sceneBgHtml(item, fallbacks, eager) +
        '<div class="sf-post__scene-shade"' + (shadeStyle ? ' style="' + shadeStyle + '"' : '') + '></div>' +
        sceneBadgeHtml() +
        '<div class="' + innerClass + '" style="' + innerStyle + '">' +
          '<div class="' + panelClass + '" style="' + panelStyle + '">' + inner + '</div>' +
        '</div>' +
        brandStripHtml() +
      '</div>'
    );
  }

  function bindSceneBackgrounds(root) {
    if (!root) return;
    root.querySelectorAll('img.sf-post__bg').forEach(function (img) {
      if (img.dataset.sfBgBound === '1') return;
      img.dataset.sfBgBound = '1';
      img.addEventListener('load', function () {
        scheduleTunePanels(root.closest('.sf-app') || root);
      });
      img.addEventListener('error', function () {
        var list = String(img.getAttribute('data-sf-bg-fallbacks') || '').split('|').filter(Boolean);
        var idx = (parseInt(img.getAttribute('data-sf-bg-idx') || '0', 10) || 0) + 1;
        if (idx < list.length) {
          img.setAttribute('data-sf-bg-idx', String(idx));
          img.src = list[idx];
          return;
        }
        var grad = img.getAttribute('data-sf-grad') || '';
        var scene = img.closest('.sf-post__scene');
        if (scene && grad && !scene.querySelector('.sf-post__bg--grad')) {
          img.style.display = 'none';
          var div = document.createElement('div');
          div.className = 'sf-post__bg sf-post__bg--grad';
          div.setAttribute('aria-hidden', 'true');
          div.style.background = grad;
          scene.insertBefore(div, scene.firstChild);
        }
      });
    });
    root.querySelectorAll('.sf-badge-logo').forEach(function (img) {
      if (img.dataset.sfLogoBound === '1') return;
      img.dataset.sfLogoBound = '1';
      img.addEventListener('error', function () {
        if (img.dataset.sfLogoFallback === '1') return;
        img.dataset.sfLogoFallback = '1';
        img.src = APP_LOGO + '?v=fallback';
      }, { once: true });
    });
    root.querySelectorAll('img.sf-post__img').forEach(function (img) {
      if (img.dataset.sfImgBound === '1') return;
      img.dataset.sfImgBound = '1';
      img.addEventListener('error', function () {
        var media = img.closest('.sf-post__media');
        if (!media || media.querySelector('.sf-post__bg--grad')) return;
        img.style.display = 'none';
        var div = document.createElement('div');
        div.className = 'sf-post__bg sf-post__bg--grad';
        div.setAttribute('aria-hidden', 'true');
        div.style.cssText = 'position:relative;inset:auto;width:100%;aspect-ratio:4/5;display:block;background:' +
          (img.getAttribute('data-sf-grad') || gradientStyleFor({}));
        media.appendChild(div);
      }, { once: true });
    });
  }

  function mediaHtml(item, eager) {
    var sceneOpts = { eagerBg: !!eager };
    if (item.image && item.imageSafe === true && itemImageAllowed(item) && (item.type === 'post' || item.type === 'archive' || item.type === 'custom')) {
      return (
        '<img class="sf-post__img" src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" ' +
        'data-sf-grad="' + esc(gradientStyleFor(item)) + '">'
      );
    }
    var fs = fontStyleFor(item);
    if (item.type === 'dua') {
      var dua = resolveDuaFields(item);
      var typo = duaTypographyFor(item);
      var duaSizes = computeTypeSizes(item, dua.ar, dua.de, dua.tr, false, true);
      return sceneBlock(item,
        '<div class="sf-post__dua">' +
          (dua.ar ? '<div class="sf-post__dua-ar">' + esc(dua.ar) + '</div>' : '') +
          (dua.tr ? '<div class="sf-post__dua-tr" style="' + typo.trStyle + '">' + esc(dua.tr) + '</div>' : '') +
          (dua.de ? '<div class="sf-post__dua-de" style="' + typo.deStyle + '">' + formatDuaGerman(dua.de, item.uid, typo) + '</div>' : '') +
          '<div class="sf-dua-source">' +
            '<div class="sf-dua-cat">' + esc(dua.sourceLabel) + '</div>' +
            (dua.bookRef ? '<div class="sf-dua-book">' + esc(dua.bookRef) + '</div>' : '') +
          '</div>' +
        '</div>',
        null,
        dua.ar + dua.tr + dua.de,
        duaSizes,
        { panelExtra: 'sf-post__textpanel--dua', innerExtra: 'sf-post__scene-inner--full', isDua: true, eagerBg: !!eager }
      );
    }
    var bundle = feedOverlayBundle(item);
    var quote = feedQuoteBody(item) || bundle.text;
    if (!quote) return sceneBlock(item, '', fs, '', null, sceneOpts);
    var srcLines = sourceLinesFor(item);
    var quoteSizes = computeTypeSizes(item, '', quote, '', !!srcLines.scholar, !!srcLines.detail);
    var qStyle = 'font-family:' + fs.css + ';color:' + fs.color + ';text-align:' + layoutAlignFor(item, quote.length);
    return sceneBlock(item,
      '<blockquote class="sf-post__quote" style="' + qStyle + '"><span class="sf-quote-mark" aria-hidden="true">❝</span><span class="sf-quote-text">' + formatEmphasizedText(quote, item.uid, 'quote') + '</span>' + sourceHtml(item, fs) + '</blockquote>',
      fs,
      quote,
      quoteSizes,
      sceneOpts
    );
  }

  function cardHtml(item, cardIdx) {
    var liked = isLiked(item.uid);

    return (
      '<article class="sf-post' + (item.demo ? ' sf-post--demo' : '') + '" data-pf-id="' + esc(item.uid) + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="' + esc(item.type) + '" data-pf-post="' + esc(item.postId || '') + '" tabindex="0" role="button">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + logoImgHtml() + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(publisherLabel()) + '</span>' +
          '</div>' +
        '</header>' +
        '<div class="sf-post__media">' + mediaHtml(item, cardIdx < 3) + '</div>' +
        '<div class="sf-post__actions">' +
          '<div class="sf-actions-left">' +
            '<button type="button" class="sf-act sf-like' + (liked ? ' is-liked' : '') + '" data-pf-like="' + esc(item.uid) + '" aria-label="Gefällt mir"><span aria-hidden="true">' + (liked ? '♥' : '♡') + '</span>' + likeCountHtml(liked) + '</button>' +
            '<button type="button" class="sf-act sf-share" aria-label="Teilen"><span aria-hidden="true">↗</span><span class="sf-act-label">Teilen</span></button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function navigateTarget(item) {
    if (!item || !item.target) return;
    try {
      if (typeof saveNavScroll === 'function' && typeof currentRoute !== 'undefined') {
        saveNavScroll(currentRoute, window.scrollY);
      }
    } catch (e) {}
    markSeen(item.uid);
    var t = String(item.target);
    if (typeof navigate !== 'function') return;
    if (t.indexOf('post:') === 0) { navigate('post', t.slice(5)); return; }
    if (t.indexOf('dua:') === 0) { navigate('dua', t.slice(4)); return; }
    if (t.indexOf('quran:') === 0) {
      var qp = t.slice(6).split(':');
      if (typeof openQuranSurah === 'function') openQuranSurah(qp[0], qp[1]);
      else navigate('quran-surah', qp[1] ? qp[0] + '/' + qp[1] : qp[0]);
      return;
    }
    if (t.indexOf('topic:') === 0) { navigate('topic', t.slice(6)); return; }
    if (t.indexOf('news-detail:') === 0) { navigate('news-detail', t.slice(12)); return; }
    if (t === 'prayer') { navigate('prayer'); return; }
  }

  function loadHtml2Canvas() {
    if (global.html2canvas) return Promise.resolve(global.html2canvas);
    return new Promise(function (resolve, reject) {
      if (document.getElementById('darHtml2Canvas')) {
        var n = 0;
        var t = setInterval(function () {
          n++;
          if (global.html2canvas) { clearInterval(t); resolve(global.html2canvas); }
          if (n > 160) { clearInterval(t); reject(new Error('h2c')); }
        }, 50);
        return;
      }
      var s = document.createElement('script');
      s.id = 'darHtml2Canvas';
      s.src = H2C_URL;
      s.onload = function () { resolve(global.html2canvas); };
      s.onerror = function () { reject(new Error('h2c')); };
      document.head.appendChild(s);
    });
  }

  function waitForImages(root) {
    var imgs = Array.prototype.slice.call((root || document).querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 6000);
      });
    }));
  }

  function prepareImagesCors(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('img'), function (img) {
      try {
        var src = img.currentSrc || img.getAttribute('src') || img.src || '';
        if (!src) return;
        if (src.indexOf('/') === 0) src = new URL(src, global.location.origin).href;
        if (/^https?:\/\//i.test(src) && src.indexOf(global.location.origin) !== 0) {
          img.crossOrigin = 'anonymous';
          img.src = src;
        }
      } catch (e) {}
    });
  }

  function shareExportScale() {
    var dpr = global.devicePixelRatio || 1;
    return Math.max(2, Math.min(4, Math.round(dpr * 2)));
  }

  function applyCaptureSafeStyles(root) {
    if (!root) return;
    var captureBg = 'rgba(22, 18, 14, 0.74)';
    var captureBorder = 'rgba(239, 215, 142, 0.22)';
    try {
      var cs = global.getComputedStyle(document.documentElement);
      var bgVar = cs.getPropertyValue('--theme-feed-panel-capture').trim();
      var borderVar = cs.getPropertyValue('--theme-feed-panel-border').trim();
      if (bgVar) captureBg = bgVar;
      if (borderVar) captureBorder = borderVar;
    } catch (e) {}
    root.querySelectorAll('.sf-post__textpanel').forEach(function (el) {
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
      el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)';
      el.style.background = captureBg;
      el.style.border = '1px solid ' + captureBorder;
      el.style.textShadow = 'none';
    });
    root.querySelectorAll('.sf-brand-chip').forEach(function (el) {
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
    });
    root.querySelectorAll('.sf-post__quote, .sf-post__dua-ar, .sf-post__dua-tr, .sf-post__dua-de, .sf-quote-scholar, .sf-quote-source, .sf-dua-source').forEach(function (el) {
      el.style.textShadow = 'none';
    });
  }

  function html2canvasOpts(el, w, h, scale) {
    return {
      scale: scale,
      width: w,
      height: h,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 25000,
      scrollX: -global.scrollX,
      scrollY: -global.scrollY,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      onclone: function (doc, node) {
        applyCaptureSafeStyles(node);
      }
    };
  }

  function captureCloneExact(el) {
    var rect = el.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var scale = shareExportScale();
    var host = document.createElement('div');
    host.className = 'sf-share-capture-host';
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:' + w + 'px;height:' + h + 'px;overflow:hidden;opacity:0;z-index:-1;pointer-events:none;background:#1a1814;';

    var clone = el.cloneNode(true);
    clone.style.width = w + 'px';
    clone.style.height = h + 'px';
    clone.style.minHeight = '0';
    clone.style.maxHeight = 'none';
    clone.style.maxWidth = '100%';
    clone.style.margin = '0';
    clone.style.aspectRatio = 'auto';

    prepareImagesCors(clone);
    applyCaptureSafeStyles(clone);
    host.appendChild(clone);
    document.body.appendChild(host);

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return fontsReady
      .then(function () { return waitForImages(clone); })
      .then(function () { return new Promise(function (r) { setTimeout(r, 200); }); })
      .then(function () { return loadHtml2Canvas(); })
      .then(function (h2c) {
        return h2c(clone, {
          scale: scale,
          width: w,
          height: h,
          useCORS: true,
          allowTaint: false,
          backgroundColor: null,
          logging: false,
          imageTimeout: 25000,
          onclone: function (doc, node) {
            applyCaptureSafeStyles(node);
          }
        });
      })
      .finally(function () {
        try { host.remove(); } catch (e) {}
      });
  }

  function captureElementWysiwyg(el) {
    if (!el) return Promise.reject(new Error('no el'));
    try {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    } catch (e) {}

    prepareImagesCors(el);

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var scale = shareExportScale();

    return new Promise(function (r) { setTimeout(r, 120); })
      .then(function () { return fontsReady; })
      .then(function () { return waitForImages(el); })
      .then(function () { return new Promise(function (r) { setTimeout(r, 180); }); })
      .then(function () { return loadHtml2Canvas(); })
      .then(function (h2c) {
        var rect = el.getBoundingClientRect();
        var w = Math.max(1, Math.round(rect.width));
        var h = Math.max(1, Math.round(rect.height));
        return h2c(el, html2canvasOpts(el, w, h, scale));
      })
      .catch(function () {
        return captureCloneExact(el);
      });
  }

  function captureSceneForShare(card) {
    var scene = card && card.querySelector('.sf-post__scene');
    if (!scene) return Promise.reject(new Error('no scene'));
    return captureElementWysiwyg(scene);
  }

  function captureMediaForShare(card) {
    var scene = card && card.querySelector('.sf-post__scene');
    if (scene) return captureSceneForShare(card);
    var img = card && card.querySelector('.sf-post__img');
    if (img) return captureElementWysiwyg(img.closest('.sf-post__media') || img);
    return Promise.reject(new Error('no media'));
  }
  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) {
        canvas.toBlob(function (b) { resolve(b); }, 'image/png', 0.92);
        return;
      }
      try {
        var bin = atob(canvas.toDataURL('image/png').split(',')[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        resolve(new Blob([arr], { type: 'image/png' }));
      } catch (e) {
        resolve(null);
      }
    });
  }

  function downloadShareBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name || 'dar-al-tawhid-beitrag.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
  }

  function shareItem(item, ev) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    var btn = ev && ev.currentTarget;
    var card = btn && btn.closest('.sf-post');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('is-busy');
    }
    var capture = card ? captureMediaForShare(card) : Promise.reject(new Error('no card'));
    capture.then(function (canvas) {
      return canvasToBlob(canvas).then(function (blob) {
        if (!blob) throw new Error('blob');
        var file = new File([blob], 'dar-al-tawhid-beitrag.png', { type: 'image/png' });
        if (global.navigator && global.navigator.canShare && global.navigator.canShare({ files: [file] })) {
          return global.navigator.share({
            files: [file],
            title: item.title || 'DAR AL TAWḤID'
          });
        }
        downloadShareBlob(blob);
        try {
          alert('Beitragsbild wurde gespeichert. Öffne WhatsApp, Instagram oder Facebook und wähle das Bild zum Teilen.');
        } catch (e) {}
      });
    }).catch(function () {
      var statement = overlayTextFor(item) || item.preview || '';
      var text = (statement || item.title || '') + '\n\n' + BRAND.site + '\n' + BRAND.instagram + ' · ' + BRAND.telegram;
      if (global.navigator && global.navigator.share) {
        global.navigator.share({ title: item.title, text: text }).catch(function () {});
        return;
      }
      try {
        if (global.navigator && global.navigator.clipboard) global.navigator.clipboard.writeText(text);
      } catch (e) {}
    }).finally(function () {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('is-busy');
      }
    });
  }

  function bindList(root) {
    root.querySelectorAll('.sf-post').forEach(function (card) {
      var uid = card.getAttribute('data-pf-id');
      var item = state.visible.find(function (x) { return x.uid === uid; });
      function open() {
        if (item) navigateTarget(item);
      }
      card.addEventListener('click', function (ev) {
        if (ev.target.closest('.sf-act')) return;
        open();
      });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); }
      });
    });
    root.querySelectorAll('.sf-like').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var uid = btn.getAttribute('data-pf-like');
        if (!uid) return;
        var on = toggleLike(uid);
        btn.classList.toggle('is-liked', on);
        var icon = btn.querySelector('span[aria-hidden="true"]');
        if (icon) icon.textContent = on ? '♥' : '♡';
        var countEl = btn.querySelector('.sf-like-count');
        if (on) {
          if (!countEl) {
            countEl = document.createElement('span');
            countEl.className = 'sf-like-count';
            btn.appendChild(countEl);
          }
          countEl.textContent = '1';
        } else if (countEl) {
          countEl.remove();
        }
      });
    });
    root.querySelectorAll('.sf-share').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        var card = btn.closest('.sf-post');
        var uid = card && card.getAttribute('data-pf-id');
        var item = state.visible.find(function (x) { return x.uid === uid; });
        if (item) shareItem(item, ev);
      });
    });
    root.querySelectorAll('.sf-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-pf-filter') || 'all';
        state.offset = 0;
        state.done = false;
        state.visible = [];
        appendBatch(true);
        renderFilters(root.closest('.sf-app') || root);
        renderListMount(root.closest('.sf-app') || root);
      });
    });
    root.querySelectorAll('[data-sf-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-sf-mode') || '';
        if (typeof navigate === 'function') navigate('feed', mode);
      });
    });
    var refreshBtn = root.querySelector('[data-sf-refresh]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        refreshMix();
      });
    }
  }

  function renderFilters(page) {
    if (!page) return;
    var bar = page.querySelector('.sf-filters');
    if (!bar) return;
    var filters = [
      ['all', 'Für dich'],
      ['posts', 'Beiträge'],
      ['duas', 'Duʿāʾ']
    ];
    bar.innerHTML = filters.map(function (f) {
      return '<button type="button" class="sf-filter' + (state.filter === f[0] ? ' is-active' : '') + '" data-pf-filter="' + f[0] + '">' + f[1] + '</button>';
    }).join('');
    bindList(page);
  }

  function renderTopBar() {
    return (
      '<header class="sf-top">' +
        '<div class="sf-top-inner">' +
          '<div class="sf-top-row">' +
            '<div class="sf-brand">' +
              '<div class="sf-brand-mark" aria-hidden="true">' + logoImgHtml() + '</div>' +
              '<div class="sf-brand-text">' +
                '<span class="sf-brand-kicker">DAR AL TAWḤID</span>' +
                '<h1>Feed</h1>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="sf-refresh" data-sf-refresh aria-label="Feed aktualisieren">↻</button>' +
          '</div>' +
          '<nav class="sf-switch" aria-label="Feed-Ansicht">' +
            '<button type="button" class="sf-switch-btn is-active" data-sf-mode="">Feed</button>' +
            '<button type="button" class="sf-switch-btn" data-sf-mode="topics">Alle Beiträge</button>' +
          '</nav>' +
        '</div>' +
      '</header>'
    );
  }

  function appendBatch(reset) {
    var filtered = filterItems(state.allItems);
    if (reset) {
      state.visible = filtered.slice(0, INITIAL);
      state.offset = state.visible.length;
      state.done = state.offset >= filtered.length;
    } else {
      if (state.done || state.loading) return;
      state.loading = true;
      var next = filtered.slice(state.offset, state.offset + BATCH);
      state.visible = state.visible.concat(next);
      state.offset += next.length;
      state.done = state.offset >= filtered.length;
      state.loading = false;
    }
  }

  function renderListMount(mount) {
    var list = mount.querySelector('.sf-feed');
    if (!list) return;
    if (!state.visible.length) {
      list.innerHTML = '<div class="sf-empty">Noch keine Beiträge im Feed. Sobald Inhalte geladen sind, erscheinen sie hier automatisch.</div>';
      return;
    }
    list.innerHTML = state.visible.map(function (item, idx) { return cardHtml(item, idx); }).join('') +
      (state.done ? '' : '<div class="sf-loader" id="pfLoader">Weitere Beiträge laden…</div>');
    bindList(mount);
    bindSceneBackgrounds(mount);
    setupInfinite(mount);
    scheduleTunePanels(mount);
  }

  var observer = null;
  function setupInfinite(mount) {
    if (observer) observer.disconnect();
    var loader = mount.querySelector('#pfLoader');
    if (!loader || state.done) return;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !state.loading && !state.done) {
          appendBatch(false);
          renderListMount(mount);
        }
      });
    }, { rootMargin: '120px' });
    observer.observe(loader);
  }

  function renderPage(mount) {
    if (!mount) return;
    injectStyles();
    document.body.classList.add('is-premium-feed-view');
    if (!global.__darFeedThemeBound) {
      global.__darFeedThemeBound = true;
      global.addEventListener('dar-theme-change', function () {
        var m = document.getElementById(MOUNT_ID);
        if (!m) return;
        injectStyles();
        scheduleTunePanels(m);
      });
    }
    if (!global.__darFeedTuneBound) {
      global.__darFeedTuneBound = true;
      var onFeedLayout = function () {
        var m = document.getElementById(MOUNT_ID);
        if (m) scheduleTunePanels(m);
      };
      global.addEventListener('resize', onFeedLayout);
      global.addEventListener('orientationchange', function () {
        global.setTimeout(onFeedLayout, 360);
      });
      if (global.visualViewport) {
        global.visualViewport.addEventListener('resize', onFeedLayout);
      }
    }

    mount.innerHTML =
      '<div class="sf-app">' +
        renderTopBar() +
        '<div class="sf-filters"></div>' +
        '<div class="sf-feed"></div>' +
      '</div>';

    renderFilters(mount);
    syncSceneLayout(mount);
    appendBatch(true);
    renderListMount(mount);
  }

  function applyFeedData(mount, manualItems) {
    var ctx = getCtx();
    var pools = buildPools(ctx, state.seed);
    var merged = mergeFeed(pools, manualItems || [], state.seed);
    if (!merged.length) merged = buildDemoItems();
    state.allItems = merged.filter(isFeedContentItem);
    state.offset = 0;
    state.done = false;
    state.visible = [];
    state.loading = false;
    if (!mount.querySelector('.sf-app')) {
      renderPage(mount);
      return;
    }
    appendBatch(true);
    renderListMount(mount);
    preloadFeedImages(state.visible, 3);
  }

  function rebuild(force) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      document.body.classList.remove('is-premium-feed-view');
      return;
    }
    state.seed = feedSeed();
    fetchFeedBackgrounds().finally(function () {
      applyFeedData(mount, []);
      fetchManual().then(function (data) {
        var mount2 = document.getElementById(MOUNT_ID);
        if (!mount2) return;
        var manual = (data && data.items) || [];
        if (manual.length) applyFeedData(mount2, manual);
      }).catch(function () {});
    });
  }

  function refreshMix() {
    try {
      sessionStorage.setItem(REFRESH_KEY, String(Date.now()));
    } catch (e) {}
    rebuild(true);
  }

  function destroy() {
    document.body.classList.remove('is-premium-feed-view');
    if (observer) observer.disconnect();
  }

  global.DAR_PREMIUM_FEED = {
    mount: renderPage,
    rebuild: rebuild,
    refresh: refreshMix,
    destroy: destroy,
    selectFeedBackground: selectFeedBackground,
    getFeedBackgroundPool: function () { return FEED_BG_POOL.slice(); },
    onAppReady: function (opts) {
      rebuild(opts && opts.force);
    }
  };

  function isFeedRoute() {
    try {
      var parts = String(global.location && global.location.hash || '#').replace(/^#/, '').split('/');
      return parts[0] === 'feed' && parts[1] !== 'topics';
    } catch (e) {
      return false;
    }
  }

  function autoMountFeed() {
    if (!isFeedRoute()) return;
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    rebuild(true);
  }

  if (global && global.addEventListener) {
    global.addEventListener('hashchange', autoMountFeed);
    global.addEventListener('load', autoMountFeed);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMountFeed);
  } else {
    autoMountFeed();
  }
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
