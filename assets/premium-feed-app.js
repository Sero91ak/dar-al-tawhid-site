/**
 * DAR AL TAWḤID — Premium-Feed (vertikal, Tab „Feed“)
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darPremiumFeedStylesV79';
  var FONTS_ID = 'darPremiumFeedFontsV73';
  var FEED_EXPORT_MIN_W = 1080;
  var FEED_EXPORT_RATIO = 1.08;
  var FEED_SHARE_CACHE = Object.create(null);
  var FEED_SHARE_WARMING = Object.create(null);
  var FEED_SHARE_BUSY = Object.create(null);
  var FEED_SHARE_IO = null;
  var FEED_API_ORIGIN = 'https://dar-admin-publisher.sero91ak.workers.dev';
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
  var FONT_UI = '"Manrope","Inter",system-ui,sans-serif';
  var FONT_FEED_QUOTE = '"Cormorant Garamond",Georgia,serif';
  var FONT_SOURCE = '"EB Garamond",Georgia,serif';
  var FONT_ARABIC = '"Amiri","Noto Naskh Arabic",serif';
  var FONT_ACCENT = '"Great Vibes","Allura",cursive';
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
  var FEED_BG_RECENT = [];
  var FEED_BG_RECENT_MAX = 15;
  var FEED_BG_PREFS = {
    quran: { categories: ['quran', 'nature', 'abstract'], tags: ['himmel', 'licht', 'berge', 'wolken', 'mushaf', 'kalligraphie', 'quran'] },
    dua: { categories: ['dua', 'nature', 'abstract'], tags: ['himmel', 'regen', 'wolken', 'nebel', 'ruhe', 'pflanzen', 'dua'] },
    tawhid: { categories: ['tawhid', 'aqidah', 'nature', 'mosque', 'abstract'], tags: ['berge', 'wüste', 'himmel', 'stark', 'klarheit', 'tawhid', 'aqidah'] },
    knowledge: { categories: ['knowledge', 'books', 'abstract'], tags: ['bücher', 'pergament', 'feder', 'tinte', 'ilm', 'hadith', 'sunnah', 'adab'] },
    akhirah: { categories: ['nature', 'abstract', 'dua', 'akhirah'], tags: ['nebel', 'abend', 'ruhe', 'wüste', 'berge', 'akhirah', 'zuhd', 'tazkiyah', 'sabr'] },
    default: { categories: ['abstract', 'nature', 'gradients'], tags: [] }
  };
  var THEME_OVERLAYS = {
    dark: 'linear-gradient(180deg,rgba(0,0,0,.06) 0%,rgba(0,0,0,.38) 100%)',
    light: 'linear-gradient(180deg,rgba(255,248,235,.12) 0%,rgba(255,248,235,.42) 100%)',
    soft: 'linear-gradient(180deg,rgba(255,248,241,.14) 0%,rgba(80,48,60,.32) 100%)',
    royal: 'linear-gradient(180deg,rgba(7,17,29,.08) 0%,rgba(7,17,29,.42) 100%)',
    bordeaux: 'linear-gradient(180deg,rgba(74,31,36,.08) 0%,rgba(20,11,12,.42) 100%)'
  };
  var H2C_URL = '/assets/html2canvas.min.js';
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
  var SEEN_KEY = 'darPremiumFeedSeenV1';
  var LIKES_KEY = 'darPremiumFeedLikesV1';
  var DEVICE_KEY = 'darFeedDeviceSeedV1';
  var REFRESH_KEY = 'darPremiumFeedRefreshSeedV1';
  var FEED_STATE_KEY = 'darPremiumFeedStateV2';
  var FEED_LAYOUT_REV = 9;
  var FEED_MIN_POST_NUM = 431;
  var FEED_LUM_CACHE = Object.create(null);
  var BATCH = 10;
  var INITIAL = 12;


  var state = {
    allItems: [],
    visible: [],
    filter: 'posts',
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
    if (bg.isIslamicallySafe === false) return false;
    var src = String(bg.source || '').toLowerCase();
    if (src === 'wikimedia') return false;
    var allowed = bg.allowedFor || ['feed'];
    if (typeof allowed === 'string') allowed = allowed.split(/[,;|]+/);
    if (allowed.indexOf('feed') < 0) return false;
    var strictFields = [
      'containsHumans', 'containsFaces', 'containsBodyParts', 'containsNudity',
      'containsAnimals', 'containsBirds', 'containsWildlife', 'containsPets',
      'containsInsects', 'containsFish', 'containsWatermark', 'containsLogo',
      'containsTextOverlay', 'containsCross', 'containsChurch',
      'isLowQuality', 'isBlurred', 'isTooBusy'
    ];
    var i;
    for (i = 0; i < strictFields.length; i++) {
      if (bg[strictFields[i]] !== false) return false;
    }
    if (bg.containsHumans === true || bg.containsAnimals === true || bg.containsFaces === true) return false;
    if (bg.hasWatermark || bg.hasLogo || bg.hasTextOverlay) return false;
    return true;
  }

  function trackRecentBg(id) {
    if (!id) return;
    FEED_BG_RECENT = FEED_BG_RECENT.filter(function (x) { return x !== id; });
    FEED_BG_RECENT.unshift(id);
    if (FEED_BG_RECENT.length > FEED_BG_RECENT_MAX) FEED_BG_RECENT.length = FEED_BG_RECENT_MAX;
  }

  function isRecentlyUsedBg(id) {
    return FEED_BG_RECENT.indexOf(id) >= 0;
  }

  function findFeedBgById(id) {
    if (!id) return null;
    for (var i = 0; i < FEED_BG_POOL.length; i++) {
      if (String(FEED_BG_POOL[i].id) === String(id)) return FEED_BG_POOL[i];
    }
    return null;
  }

  function normalizeBgAssetUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    s = s.replace(/^\/\/workspace\//, '/');
    s = s.replace(/^\/workspace\//, '/');
    return s;
  }

  function bgImageUrl(bg, mobile) {
    if (!bg) return '';
    var u = mobile ? (bg.srcMobile || bg.thumbnail || bg.src) : (bg.src || bg.srcMobile || bg.thumbnail);
    return normalizeBgAssetUrl(u);
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
    if (bg.category === 'nature') score += 22;
    if (bg.studioGenerated || bg.source === 'studio') score += 8;
    if (bg.source === 'pexels' || bg.source === 'unsplash' || bg.source === 'pixabay') score += 16;
    if (Number(bg.qualityScore || 0) >= 95) score += 10;
    return score;
  }

  function metaForGradient(theme) {
    theme = theme || getThemeKey();
    var lightTheme = theme === 'light' || theme === 'soft';
    var avg = lightTheme ? 0.74 : 0.28;
    return {
      averageLuminance: avg,
      topLuminance: avg,
      middleLuminance: avg,
      bottomLuminance: avg,
      busyScore: 0.18,
      recommendedTextTone: lightTheme ? 'dark' : 'light',
      isGradient: true,
      safeTextZones: ['middle', 'bottom']
    };
  }

  function gradientScene(item, theme, reason) {
    theme = theme || getThemeKey();
    var lightTheme = theme === 'light' || theme === 'soft';
    return {
      kind: 'gradient',
      value: gradientStyleFor(item),
      reason: reason || 'gradient',
      backgroundMeta: metaForGradient(theme),
      overlay: overlayForTheme(theme, lightTheme ? (theme === 'soft' ? undefined : 'light') : 'dark')
    };
  }

  function selectFeedBackground(item, theme) {
    theme = theme || getThemeKey();
    var mode = itemBackgroundMode(item);
    if (item && item.backgroundSafe === false) {
      return gradientScene(item, theme, 'background-unsafe');
    }
    if (mode === 'gradient' || mode === 'none') {
      return gradientScene(item, theme, 'mode-gradient');
    }
    if (mode === 'manual' && item && item.backgroundId) {
      var manual = findFeedBgById(item.backgroundId);
      if (isFeedBgSafe(manual)) {
        trackRecentBg(manual.id);
        return bgToScene(manual, item, theme, 'manual');
      }
    }
    if (mode === 'auto' || mode === 'manual') {
      var prefs = itemBgPreferences(item);
      var candidates = FEED_BG_POOL.filter(isFeedBgSafe);
      var scored = candidates.map(function (bg) {
        var score = scoreFeedBgCandidate(bg, prefs, item);
        if (isRecentlyUsedBg(bg.id)) score -= 120;
        return { bg: bg, score: score };
      }).filter(function (row) { return row.score > -100; });
      if (!scored.length) {
        scored = candidates.map(function (bg) {
          var score = Number(bg.priority || 0);
          if (isRecentlyUsedBg(bg.id)) score -= 50;
          return { bg: bg, score: score };
        });
      }
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.bg.id).localeCompare(String(b.bg.id));
      });
      if (scored.length) {
        var seedBase = String(item && item.uid || item && item.id || '') + '|' + String(item && item.category || '') + '|bg';
        var top = scored.slice(0, Math.min(12, scored.length));
        var pick = top[hashNum(seedBase) % top.length].bg;
        trackRecentBg(pick.id);
        return bgToScene(pick, item, theme, 'auto');
      }
    }
    return gradientScene(item, theme, 'fallback-no-match');
  }

  function bgToScene(bg, item, theme, reason) {
    var mobile = false;
    try { mobile = global.innerWidth > 0 && global.innerWidth <= 700; } catch (e) {}
    var url = bgImageUrl(bg, mobile);
    var fp = bg.focusPoint || { x: 50, y: 50 };
    return {
      kind: 'image',
      value: url,
      thumb: bgImageUrl(bg, true),
      bgId: bg.id,
      overlay: overlayForTheme(theme, bg.overlayHint),
      focusX: fp.x,
      focusY: fp.y,
      alt: bg.alt || bg.title || '',
      reason: reason || 'auto',
      backgroundMeta: metaFromPoolBg(bg)
    };
  }

  function numOr(v, d) {
    var n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function parseDomColorLum(hex) {
    var h = String(hex || '').trim();
    if (!h) return 0.5;
    if (/^0x/i.test(h)) h = '#' + h.slice(2);
    if (h.charAt(0) !== '#') return 0.5;
    var x = h.replace('#', '');
    if (x.length === 3) x = x.split('').map(function (c) { return c + c; }).join('');
    if (x.length < 6) return 0.5;
    var r = parseInt(x.slice(0, 2), 16) / 255;
    var g = parseInt(x.slice(2, 4), 16) / 255;
    var b = parseInt(x.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function metaFromPoolBg(bg) {
    if (!bg) return null;
    var avg = numOr(bg.averageLuminance, -1);
    if (avg < 0 && bg.dominantColor) avg = parseDomColorLum(bg.dominantColor);
    if (avg < 0) avg = bg.overlayHint === 'light' ? 0.72 : 0.32;
    return {
      averageLuminance: numOr(bg.averageLuminance, avg),
      topLuminance: numOr(bg.topLuminance, avg),
      middleLuminance: numOr(bg.middleLuminance, avg),
      bottomLuminance: numOr(bg.bottomLuminance, avg),
      busyScore: numOr(bg.busyScore, 0.25),
      recommendedTextTone: bg.recommendedTextTone || '',
      recommendedOverlay: bg.recommendedOverlay || '',
      contrastHint: bg.contrastHint || '',
      safeTextZones: Array.isArray(bg.safeTextZones) && bg.safeTextZones.length ? bg.safeTextZones.slice() : ['middle', 'bottom'],
      dominantColor: bg.dominantColor || ''
    };
  }

  function zoneLuminance(meta, zone) {
    if (!meta) return 0.5;
    if (zone === 'top') return numOr(meta.topLuminance, meta.averageLuminance);
    if (zone === 'bottom') return numOr(meta.bottomLuminance, meta.averageLuminance);
    return numOr(meta.middleLuminance, meta.averageLuminance);
  }

  function getSafeReadableFeedStyle() {
    return {
      dataTone: 'dark-bg',
      protection: 'strong',
      cssVars: {
        '--feed-text-primary': '#fff4dc',
        '--feed-text-secondary': '#f3e3c0',
        '--feed-text-accent': '#e6c26f',
        '--feed-text-source': 'rgba(255,244,220,0.88)',
        '--feed-text-shadow': '0 2px 8px rgba(0,0,0,0.75)',
        '--feed-text-stroke': 'transparent',
        '--feed-panel-scrim': 'transparent',
        '--feed-protection-bg': 'none',
        '--feed-protection-opacity': '0',
        '--feed-overlay-strength': '0'
      }
    };
  }

  function getAdaptiveFeedTextStyle(backgroundMeta, textZone, theme) {
    return getSafeReadableFeedStyle();
  }

  function enforceReadablePanels(root) {
    if (!root) return;
    root.querySelectorAll('.sf-post__textpanel').forEach(function (panel) {
      panel.classList.add('feed-quote-panel');
      panel.setAttribute('data-tone', 'dark-bg');
      panel.setAttribute('data-protection', 'strong');
      var style = getSafeReadableFeedStyle();
      Object.keys(style.cssVars).forEach(function (k) {
        panel.style.setProperty(k, style.cssVars[k]);
      });
    });
  }

  function enforceReadableExportMode(root) {
    if (!root) return;
    root.classList.add('feed-export-mode');
    enforceReadablePanels(root);
    root.querySelectorAll('.sf-post__textpanel').forEach(function (panel) {
      panel.style.background = 'linear-gradient(180deg, rgba(12,14,16,0.88), rgba(10,11,13,0.80))';
      panel.style.backdropFilter = 'none';
      panel.style.webkitBackdropFilter = 'none';
      panel.style.border = '1px solid rgba(230,200,130,0.28)';
      panel.style.boxShadow = '0 18px 55px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)';
    });
  }

  function adaptiveStyleToString(style) {
    if (!style || !style.cssVars) return '';
    var s = '';
    Object.keys(style.cssVars).forEach(function (k) { s += k + ':' + style.cssVars[k] + ';'; });
    return s;
  }

  function applyAdaptiveSceneTone(scene, backgroundMeta, textZone) {
    if (!scene) return;
    try {
      var style = getAdaptiveFeedTextStyle(backgroundMeta, textZone || 'middle', getThemeKey());
      scene.setAttribute('data-tone', style.dataTone);
      scene.setAttribute('data-protection', style.protection);
      var panel = scene.querySelector('.sf-post__textpanel');
      if (panel) {
        panel.setAttribute('data-tone', style.dataTone);
        panel.setAttribute('data-protection', style.protection);
        Object.keys(style.cssVars).forEach(function (k) {
          panel.style.setProperty(k, style.cssVars[k]);
        });
      }
    } catch (e) {}
  }

  function analyzeThumbClient(url, cb) {
    if (!url || typeof cb !== 'function') return;
    if (FEED_LUM_CACHE[url]) { cb(FEED_LUM_CACHE[url]); return; }
    try {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var w = 32;
          var h = 40;
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { cb(null); return; }
          ctx.drawImage(img, 0, 0, w, h);
          var data = ctx.getImageData(0, 0, w, h).data;
          var buf = new Uint8Array(w * h);
          var p = 0;
          for (var i = 0; i < data.length; i += 4, p++) {
            buf[p] = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
          }
          function zoneAvg(y0, y1) {
            var sum = 0;
            var n = 0;
            for (var y = y0; y < y1; y++) {
              for (var x = 0; x < w; x++) { sum += buf[y * w + x]; n++; }
            }
            return n ? sum / n / 255 : 0.5;
          }
          var top = zoneAvg(0, Math.floor(h / 3));
          var mid = zoneAvg(Math.floor(h / 3), Math.floor(2 * h / 3));
          var bot = zoneAvg(Math.floor(2 * h / 3), h);
          var avg = (top + mid + bot) / 3;
          var meta = {
            averageLuminance: avg,
            topLuminance: top,
            middleLuminance: mid,
            bottomLuminance: bot,
            busyScore: 0.3,
            recommendedTextTone: avg >= 0.56 ? 'dark' : 'light',
            safeTextZones: ['middle', 'bottom']
          };
          FEED_LUM_CACHE[url] = meta;
          cb(meta);
        } catch (e) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = url;
    } catch (e2) { cb(null); }
  }

  function scheduleAdaptiveTone(scene, bgPreview) {
    if (!scene) return;
    var meta = bgPreview && bgPreview.backgroundMeta;
    if (meta && meta.averageLuminance != null) {
      applyAdaptiveSceneTone(scene, meta, 'middle');
      return;
    }
    var thumb = bgPreview && bgPreview.thumb;
    if (!thumb) {
      var gradMeta = metaForGradient(getThemeKey());
      if (bgPreview && bgPreview.kind === 'gradient') gradMeta = bgPreview.backgroundMeta || gradMeta;
      applyAdaptiveSceneTone(scene, gradMeta, 'middle');
      return;
    }
    analyzeThumbClient(thumb, function (clientMeta) {
      applyAdaptiveSceneTone(scene, clientMeta || metaFromPoolBg({ overlayHint: 'dark' }), 'middle');
    });
  }

  function fetchFeedBackgrounds() {
    var staging = isStaging();
    var jsonPath = staging ? '/content/staging/feed-backgrounds/feed-backgrounds.json' : '/content/feed-backgrounds/feed-backgrounds.json';
    var apiPath = FEED_API_ORIGIN + '/api/feed-backgrounds?staging=' + (staging ? '1' : '0');
    var cacheVer = encodeURIComponent(String(FEED_BG_CACHE_VER || todayKey()));
    function loadJson(path, cors) {
      var sep = path.indexOf('?') >= 0 ? '&' : '?';
      var opts = { cache: 'no-store' };
      if (cors) opts.mode = 'cors';
      return fetch(path + sep + 'v=' + cacheVer, opts)
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    return loadJson(apiPath, true).then(function (data) {
      if (data && Array.isArray(data.items) && data.items.length) return data;
      return loadJson(jsonPath, false);
    }).then(function (data) {
      FEED_BG_CACHE_VER = Number(data && data.cacheVersion) || 1;
      FEED_BG_POOL = (data && data.items || []).filter(function (it) {
        return it && it.src;
      }).map(function (it) {
        function safetyFlag(v) { return v === true; }
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
          securityStatus: it.securityStatus || (it.approved ? 'approved' : 'unchecked'),
          isIslamicallySafe: it.isIslamicallySafe !== false,
          containsHumans: safetyFlag(it.containsHumans),
          containsFaces: safetyFlag(it.containsFaces),
          containsBodyParts: safetyFlag(it.containsBodyParts),
          containsNudity: safetyFlag(it.containsNudity),
          containsAnimals: safetyFlag(it.containsAnimals),
          containsBirds: safetyFlag(it.containsBirds),
          containsWildlife: safetyFlag(it.containsWildlife),
          containsPets: safetyFlag(it.containsPets),
          containsInsects: safetyFlag(it.containsInsects),
          containsFish: safetyFlag(it.containsFish),
          containsWatermark: safetyFlag(it.containsWatermark),
          containsLogo: safetyFlag(it.containsLogo),
          containsTextOverlay: safetyFlag(it.containsTextOverlay),
          containsCross: safetyFlag(it.containsCross),
          containsChurch: safetyFlag(it.containsChurch),
          isLowQuality: safetyFlag(it.isLowQuality),
          isBlurred: safetyFlag(it.isBlurred),
          isTooBusy: safetyFlag(it.isTooBusy),
          hasWatermark: safetyFlag(it.hasWatermark),
          hasLogo: safetyFlag(it.hasLogo),
          hasTextOverlay: safetyFlag(it.hasTextOverlay),
          qualityScore: Number(it.qualityScore) || 0,
          source: it.source || '',
          studioGenerated: !!it.studioGenerated,
          autoSynced: !!it.autoSynced,
          overlayHint: it.overlayHint || 'dark',
          focusPoint: it.focusPoint || { x: 50, y: 50 },
          averageLuminance: it.averageLuminance,
          topLuminance: it.topLuminance,
          middleLuminance: it.middleLuminance,
          bottomLuminance: it.bottomLuminance,
          busyScore: it.busyScore,
          recommendedTextTone: it.recommendedTextTone,
          recommendedOverlay: it.recommendedOverlay,
          contrastHint: it.contrastHint,
          safeTextZones: it.safeTextZones,
          dominantColor: it.dominantColor
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
    return 'center';
  }

  function duaTypographyFor(item) {
    return { trStyle: '', deStyle: '' };
  }

  function formatEmphasizedText(text, uid, salt) {
    if (!text) return '';
    if (/\*\*[^*]+\*\*|\*\*\*[^*]+\*\*\*|\*[^*\n]+\*/.test(text)) {
      return formatMarkedEmphasis(text);
    }
    return esc(text);
  }

  function formatDuaGerman(text, uid, typo) {
    return formatEmphasizedText(text, uid, 'dua-de');
  }

  function panelStyleFor(item, text, alignOverride) {
    var align = alignOverride || layoutAlignFor(item, String(text || '').length);
    return 'text-align:' + align + ';';
  }

  function fontStyleFor(item) {
    return {
      css: FONT_FEED_QUOTE,
      size: 'clamp(17px,4.1vw,22px)',
      color: 'var(--theme-feed-panel-text)',
      align: 'center'
    };
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
    return ['post', 'archive', 'dua', 'custom', 'postFeed'];
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

  var FEED_POST_STATS = Object.create(null);
  var FEED_VIEW_STATS = Object.create(null);
  var FEED_STATS_PROMISE = null;


  function resetFeedStatsCache() {
    FEED_STATS_PROMISE = null;
    Object.keys(FEED_POST_STATS).forEach(function (k) { delete FEED_POST_STATS[k]; });
    Object.keys(FEED_VIEW_STATS).forEach(function (k) { delete FEED_VIEW_STATS[k]; });
  }

  function loadFeedStats() {
    if (FEED_STATS_PROMISE) return FEED_STATS_PROMISE;
    FEED_STATS_PROMISE = Promise.resolve().then(function () {
      if (!global.DarAnalytics || typeof global.DarAnalytics.fetchDashboard !== 'function') {
        return honestFeedStats('');
      }
      if (global.DarAnalytics.hasSupabase && !global.DarAnalytics.hasSupabase()) {
        return honestFeedStats('');
      }
      return global.DarAnalytics.fetchDashboard().then(function (data) {
        (data && data.totals || []).forEach(function (row) {
          var id = String(row.content_id || '');
          if (!id) return;
          if (row.content_type === 'post') {
            if (!FEED_POST_STATS[id]) FEED_POST_STATS[id] = { shares: 0 };
            FEED_POST_STATS[id].shares = Math.max(FEED_POST_STATS[id].shares, Number(row.shares) || 0);
          } else if (row.content_type === 'feed') {
            if (!FEED_VIEW_STATS[id]) FEED_VIEW_STATS[id] = { views: 0 };
            FEED_VIEW_STATS[id].views = Math.max(FEED_VIEW_STATS[id].views, Number(row.views) || 0);
          }
        });
        return FEED_VIEW_STATS;
      }).catch(function () { return FEED_VIEW_STATS; });
    });
    return FEED_STATS_PROMISE;
  }

  function honestFeedStats(postId) {
    var id = String(postId || '');
    return {
      views: Number(FEED_VIEW_STATS[id] && FEED_VIEW_STATS[id].views) || 0,
      shares: Number(FEED_POST_STATS[id] && FEED_POST_STATS[id].shares) || 0
    };
  }

  function feedStatsFor(postId) {
    return honestFeedStats(postId);
  }

  function feedBarStatsParts(postId) {
    var stats = honestFeedStats(postId);
    var parts = [];
    if (stats.views > 0) parts.push('<strong>' + formatStatCount(stats.views) + '</strong> Aufrufe');
    if (stats.shares > 0) parts.push('<strong>' + formatStatCount(stats.shares) + '</strong> geteilt');
    return parts;
  }

  function refreshFeedStatsSoon(mount) {
    resetFeedStatsCache();
    loadFeedStats().finally(function () {
      refreshFeedEngagement(mount || global.document.getElementById(MOUNT_ID));
    });
  }

  function formatStatCount(n) {
    n = Number(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + ' Mio.';
    if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + ' Tsd.';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + ' Tsd.';
    return String(n);
  }

  function feedEngagementRowHtml(item, liked) {
    return postFeedBarHtml(item, liked);
  }

  function postFeedBarHtml(item, liked) {
    var postUrl = item.postUrl || ('/#post/' + encodeURIComponent(item.postId || ''));
    var preview = item.image || '';
    var orig = item.originalImage || preview || '';
    var parts = feedBarStatsParts(item.postId);
    var statsHtml = parts.length
      ? '<span class="sf-bar-stats">' + parts.join(' · ') + '</span>'
      : '<span class="sf-bar-stats sf-bar-stats--empty"></span>';
    var readBtn = '<button type="button" class="sf-read-more" data-pf-open-post="' + esc(item.postId || '') + '" aria-label="Vollständigen Beitrag lesen">Beitrag lesen →</button>';
    return (
      '<div class="sf-post__bar feed-bar">' +
        '<button type="button" class="sf-act sf-like' + (liked ? ' is-liked' : '') + '" data-pf-like="' + esc(item.uid) + '" aria-label="Gefällt mir"><span aria-hidden="true">' + (liked ? '♥' : '♡') + '</span></button>' +
        (item.shareEnabled !== false ?
          '<button type="button" class="sf-act sf-share feed-share-button share-image-btn" data-post-id="' + esc(item.postId || '') + '" data-original-image="' + esc(orig) + '" data-feed-preview-image="' + esc(preview) + '" data-post-url="' + esc(postUrl) + '" data-post-title="' + esc(item.title || '') + '" aria-label="Bild teilen"><span aria-hidden="true">↗</span></button>' :
          '') +
        statsHtml +
        readBtn +
      '</div>'
    );
  }

  function feedEngagementHtml(item, liked) {
    return feedEngagementRowHtml(item, liked);
  }

  function trackFeedEvent(eventType, item) {
    if (!item || !item.postId) return;
    var contentType = (eventType === 'feed_click' || eventType === 'feed_view') ? 'feed' : 'post';
    try {
      if (typeof global.trackAnalytics === 'function') {
        global.trackAnalytics(eventType, {
          contentType: contentType,
          contentId: String(item.postId),
          contentTitle: item.title || ''
        });
      } else if (global.DarAnalytics && global.DarAnalytics.track) {
        global.DarAnalytics.track(eventType, {
          contentType: contentType,
          contentId: String(item.postId),
          contentTitle: item.title || ''
        });
      }
    } catch (e) {}
  }

  function refreshFeedEngagement(root) {
    if (!root) return;
    root.querySelectorAll('.sf-post--image-feed').forEach(function (card) {
      var uid = card.getAttribute('data-pf-id');
      var item = state.visible.find(function (x) { return x.uid === uid; });
      if (!item) return;
      var liked = isLiked(uid);
      var parts = feedBarStatsParts(item.postId);
      var statsEl = card.querySelector('.sf-bar-stats');
      if (statsEl) {
        statsEl.innerHTML = parts.join(' · ');
        statsEl.classList.toggle('sf-bar-stats--empty', !parts.length);
      }
      var likeBtn = card.querySelector('[data-pf-like]');
      if (likeBtn) {
        likeBtn.classList.toggle('is-liked', liked);
        var icon = likeBtn.querySelector('span[aria-hidden="true"]');
        if (icon) icon.textContent = liked ? '♥' : '♡';
      }
    });
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
    enforceReadablePanels(root);
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

  function saveFeedState() {
    if (!state.visible.length) return;
    try {
      global.sessionStorage.setItem(
        FEED_STATE_KEY,
        JSON.stringify({
          scrollY: global.scrollY || 0,
          filter: state.filter,
          seed: state.seed,
          offset: state.offset,
          done: state.done,
          visibleIds: state.visible.map(function (x) {
            return x.uid;
          }),
          ts: Date.now()
        })
      );
    } catch (e) {}
  }

  function loadFeedState() {
    try {
      var raw = global.sessionStorage.getItem(FEED_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearFeedState() {
    try {
      global.sessionStorage.removeItem(FEED_STATE_KEY);
    } catch (e) {}
  }

  function tryRestoreFeedState() {
    var saved = loadFeedState();
    if (!saved || !Array.isArray(saved.visibleIds) || !saved.visibleIds.length) return false;
    if (!state.allItems.length) return false;
    var mount = global.document.getElementById(MOUNT_ID);
    if (!mount) return false;

    state.filter = saved.filter || 'all';
    state.seed = saved.seed || state.seed || feedSeed();
    state.offset = Math.max(0, Number(saved.offset) || 0);
    state.done = !!saved.done;
    state.visible = saved.visibleIds
      .map(function (id) {
        return state.allItems.find(function (x) {
          return x.uid === id;
        });
      })
      .filter(Boolean);
    if (!state.visible.length) return false;

    if (!mount.querySelector('.sf-app')) {
      renderPage(mount);
    } else {
      renderFilters(mount);
      renderListMount(mount);
      syncSceneLayout(mount);
    }

    var y = Math.max(0, Number(saved.scrollY) || 0);
    if (global.DARScrollManager && global.DARScrollManager.stableScrollTo) {
      global.DARScrollManager.stableScrollTo(y);
    } else {
      global.requestAnimationFrame(function () {
        global.scrollTo({ top: y, behavior: 'auto' });
      });
    }
    return true;
  }

  function rerenderFeedPhotosIfNeeded(mount) {
    if (!mount || !FEED_BG_POOL.filter(isFeedBgSafe).length) return;
    if (!mount.querySelector('.sf-feed')) return;
    renderListMount(mount);
    bindSceneBackgrounds(mount);
    syncSceneLayout(mount);
  }

  function startFeedMount(opts) {
    opts = opts || {};
    var mount = global.document.getElementById(MOUNT_ID);
    if (!mount) {
      document.body.classList.remove('is-premium-feed-view');
      return;
    }
    try {
      var revKey = 'darPremiumFeedLayoutRev';
      var prevRev = Number(localStorage.getItem(revKey) || 0);
      if (prevRev < FEED_LAYOUT_REV) {
        localStorage.setItem(revKey, String(FEED_LAYOUT_REV));
        clearFeedState();
        opts.force = true;
      }
    } catch (eRev) {}
    fetchFeedBackgrounds().finally(function () {
      var savedScroll = null;
      if (!opts.force) {
        var saved = loadFeedState();
        if (saved && Array.isArray(saved.visibleIds) && saved.visibleIds.length) {
          savedScroll = Math.max(0, Number(saved.scrollY) || 0);
        }
      }
      if (opts.force || !state.allItems.length) state.seed = feedSeed();
      applyFeedData(mount, [], savedScroll, { force: !!opts.force });
    });
  }

  function feedItemsSignature(items) {
    return (items || []).map(function (it) {
      return String(it.uid || '') + '|' + String(it.image || '') + '|' + String(it.date || '') + '|' + String(it.postId || '');
    }).join(';');
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
      if (typeof global.darPremiumFeedAppContext === 'function') return global.darPremiumFeedAppContext();
      if (typeof darPremiumFeedAppContext === 'function') return darPremiumFeedAppContext();
    } catch (e) {}
    return {};
  }

  function feedEnabledFlag(val) {
    return val === true || val === 'true';
  }

  function postFeedNumber(post) {
    if (!post) return 0;
    var parts = [post.id, post._sourceFile, post.title].filter(Boolean).join(' ');
    var nums = [];
    var re = /(?:^|[-_])(\d{2,4})(?:[.\-_]|$)/g;
    var m;
    while ((m = re.exec(parts))) {
      var n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) nums.push(n);
    }
    if (!nums.length) {
      re = /(\d{2,4})/g;
      while ((m = re.exec(parts))) {
        var n2 = Number(m[1]);
        if (Number.isFinite(n2) && n2 > 10) nums.push(n2);
      }
    }
    return nums.length ? Math.max.apply(null, nums) : 0;
  }

  function resolvePostFeedMeta(post) {
    if (!post) return null;
    if (post._feedExplicit !== true) return null;
    if (postFeedNumber(post) < FEED_MIN_POST_NUM) return null;
    var feed = post.feed || {};
    var image = String(feed.image || '').trim();
    if (feedEnabledFlag(feed.enabled) && image) {
      return {
        enabled: true,
        image: image,
        originalImage: String(feed.originalImage || image),
        alt: feed.alt || ('Bildbeitrag zu: ' + (post.title || 'Beitrag')),
        shareEnabled: feed.shareEnabled !== false
      };
    }
    return null;
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
      FEED_API_ORIGIN + '/api/feed?staging=' + (staging ? '1' : '0') + '&v=' + encodeURIComponent(todayKey()),
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

  function buildPostFeedPool(posts) {
    return (posts || [])
      .map(function (p) {
        var meta = resolvePostFeedMeta(p);
        return meta ? { post: p, meta: meta } : null;
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return comparePosts(a.post, b.post);
      })
      .map(function (entry, i) {
        var p = entry.post;
        var meta = entry.meta;
        var preview = String(meta.image || '');
        var original = String(meta.originalImage || preview.replace(/feed-preview(\.[a-z0-9]+)?$/i, 'feed-original$1'));
        return {
          uid: 'post-feed-' + p.id,
          type: 'postFeed',
          title: p.title || 'Beitrag',
          category: normCat(p.category),
          image: preview,
          originalImage: original,
          alt: meta.alt || ('Bildbeitrag zu: ' + (p.title || 'Beitrag')),
          shareEnabled: meta.shareEnabled !== false,
          target: 'post:' + p.id,
          postId: String(p.id),
          postUrl: '/p/' + encodeURIComponent(String(p.id)),
          sort: -2000 - i,
          date: p.date || ''
        };
      });
  }

  function buildPools(ctx, seed) {
    var hijri = hijriLabel();
    var posts = (ctx.posts || []).slice().sort(comparePosts);
    var duas = ctx.duas || [];
    var newest = posts.slice(0, 8);
    var archive = posts.slice(8);
    var pools = { newest: [], archive: [], dua: [], quran: [], news: [], hint: [], category: [], manual: [], postFeed: buildPostFeedPool(posts) };

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
    var out = (pools.postFeed || []).slice();
    out.sort(function (a, b) {
      var da = Date.parse(a.date || '') || 0;
      var db = Date.parse(b.date || '') || 0;
      if (db !== da) return db - da;
      return (a.sort || 0) - (b.sort || 0);
    });
    return out;
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
    return items.filter(function (it) { return it && it.type === 'postFeed'; });
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
    var link = document.createElement('link');
    link.id = FONTS_ID;
    link.rel = 'stylesheet';
    link.href = '/assets/fonts/feed-fonts.css?v=43';
    document.head.appendChild(link);
  }

  function injectStyles() {
    injectFonts();
    var old = document.getElementById(STYLES_ID);
    if (old) old.remove();
    var css =
      ':root{--font-ui:' + FONT_UI + ';--font-feed-quote:' + FONT_FEED_QUOTE + ';--font-source:' + FONT_SOURCE + ';--font-arabic:' + FONT_ARABIC + ';--font-accent:' + FONT_ACCENT + '}' +
      '.feed-quote,.sf-quote-text,.sf-post__dua-de{font-family:var(--font-feed-quote);font-weight:600;line-height:1.22;letter-spacing:.01em}' +
      '.feed-source,.sf-quote-source,.sf-dua-book,.sf-post__dua-tr{font-family:var(--font-source);font-style:italic;font-weight:500;line-height:1.25}' +
      '.feed-chip,.feed-button,.sf-filter,.sf-switch-btn,.sf-tag,.sf-act,.sf-dua-cat,.sf-brand-kicker,.sf-user,.sf-sub,.sf-like-count,.sf-act-label,.sf-brand-chip,.sf-brand-site,.sf-quote-scholar,.sf-loader,.sf-empty,.sf-caption{font-family:var(--font-ui)}' +
      '.feed-chip,.feed-button,.sf-filter,.sf-switch-btn,.sf-tag,.sf-act,.sf-dua-cat,.sf-brand-kicker,.sf-user,.sf-like-count,.sf-brand-chip,.sf-brand-site,.sf-quote-scholar{font-weight:700}' +
      '.arabic,.quran-arabic,.dua-arabic,.sf-post__dua-ar{font-family:var(--font-arabic);line-height:1.8}' +
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
      '.sf-brand-title{font-family:var(--serif,Cinzel,serif);font-size:clamp(13px,3.6vw,15px);font-weight:700;color:var(--theme-accent,var(--gold2));letter-spacing:.08em;text-transform:none;margin-bottom:0;line-height:1.1}' +
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
      '.sf-post--image-feed{cursor:default;border:1px solid var(--theme-border,var(--line));background:var(--theme-feed-card,var(--theme-surface,transparent));box-shadow:var(--premium-shadow,0 12px 32px rgba(0,0,0,.18));position:relative;max-width:680px;margin:0 auto;overflow:hidden}' +
      '.sf-post--image-feed .sf-post__head{background:var(--theme-feed-bg,var(--outer-bg,var(--bg)));padding:12px 14px 10px}' +
      '.sf-post--image-feed .sf-post__media--feed-img{display:block;position:relative;background:var(--theme-feed-img-fallback,#0a0908);border-top:1px solid color-mix(in srgb,var(--theme-border,var(--line)) 65%,transparent);border-bottom:1px solid color-mix(in srgb,var(--theme-border,var(--line)) 65%,transparent);line-height:0;overflow:hidden;min-height:clamp(220px,48vw,420px)}' +
      '.feed-image-frame{position:relative;display:block;width:100%;aspect-ratio:4/5;margin:0;padding:0;background:var(--theme-feed-img-fallback,#0a0908);pointer-events:none;user-select:none;-webkit-user-select:none;overflow:hidden}' +
      '.feed-image{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center;background:var(--theme-feed-img-fallback,#0a0908);pointer-events:none;-webkit-user-drag:none;user-drag:none}' +
      '.sf-post--image-feed .sf-post__bar{display:flex;align-items:center;gap:6px;padding:8px 12px 10px;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)));flex-wrap:nowrap;position:relative;z-index:20;pointer-events:auto}' +
      '.sf-post--image-feed .sf-post__bar .sf-act{flex:0 0 auto;width:36px;height:36px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:10px}' +
      '.sf-post--image-feed .sf-post__bar .sf-act .sf-act-label{display:none}' +
      '.sf-bar-stats{flex:1 1 auto;min-width:0;margin:0;font-size:11px;line-height:1.35;color:var(--theme-text,var(--text));opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sf-bar-stats strong{font-weight:800;color:var(--theme-text,var(--text))}' +
      '.sf-bar-stats--empty{min-height:1px}' +
      '.sf-post--image-feed .sf-read-more{display:inline-flex;align-items:center;gap:2px;border:0;background:transparent;padding:0;font-size:11px;font-weight:800;color:var(--theme-accent,var(--gold2));cursor:pointer;font-family:var(--font-ui);flex:0 0 auto;white-space:nowrap;margin-left:2px}' +
      '.sf-post--image-feed .sf-read-more:hover{text-decoration:underline}' +
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
      '.sf-post__bg,.sf-post__bg--grad,.sf-post__bg--photo{position:absolute;inset:0;left:0;right:0;top:0;bottom:0;width:100%;height:100%;min-width:100%;min-height:100%;object-fit:cover;object-position:center;z-index:0;display:block;background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));image-rendering:auto;box-sizing:border-box}' +
      '.sf-post__bg--photo{background-repeat:no-repeat;background-color:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));filter:brightness(1.08) saturate(1.14) contrast(1.04)}' +
      '.sf-post__bg--img{opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden}' +
      '.sf-post__bg--grad{background-size:cover;background-position:center;background-repeat:no-repeat}' +
      '.sf-post__scene-shade{position:absolute;inset:0;z-index:1;background:var(--theme-feed-overlay,linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.18)));pointer-events:none;opacity:.92}' +
      '.sf-scene-badge{position:absolute;top:var(--sf-badge-top,18px);left:var(--sf-badge-left,18px);z-index:5;width:var(--sf-badge-size,clamp(40px,11vw,52px));height:var(--sf-badge-size,clamp(40px,11vw,52px));border-radius:50%;padding:3px;background:var(--theme-feed-badge-bg,var(--theme-glass,rgba(8,7,5,.48)));backdrop-filter:blur(10px) saturate(1.1);-webkit-backdrop-filter:blur(10px) saturate(1.1);border:1px solid var(--theme-feed-badge-border,var(--theme-border,var(--line)));box-shadow:0 4px 16px rgba(0,0,0,.22),0 0 0 1px rgba(255,255,255,.04);pointer-events:none;display:grid;place-items:center}' +
      '.sf-scene-badge .sf-badge-logo{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}' +
      '.sf-scene-brand{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:6px 8px 7px;background:var(--theme-feed-brand-bar,linear-gradient(180deg,transparent,rgba(0,0,0,.76)));display:flex;flex-direction:column;gap:3px;align-items:center;pointer-events:none}' +
      '.sf-brand-signature-row{display:flex;flex-wrap:nowrap;align-items:center;justify-content:center;gap:clamp(3px,1vw,7px);max-width:100%;padding:0 2px}' +
      '.sf-brand-chip{display:inline-flex;align-items:center;gap:2px;font-size:clamp(6px,1.8vw,7.5px);font-weight:800;color:var(--theme-feed-shade-text,var(--theme-text,var(--text)));background:var(--theme-feed-chip,rgba(8,7,5,.42));border:1px solid var(--theme-border,var(--line));border-radius:999px;padding:2px 5px;line-height:1;white-space:nowrap;flex:0 0 auto}' +
      '.sf-brand-chip svg{width:clamp(8px,2.4vw,10px);height:clamp(8px,2.4vw,10px);flex:0 0 auto;display:block}' +
      '.sf-brand-site{display:inline-flex;align-items:center;gap:3px;font-size:clamp(6px,1.7vw,7px);letter-spacing:.1em;text-transform:uppercase;color:var(--theme-feed-accent-soft,var(--theme-muted,var(--muted)));font-weight:800;line-height:1}' +
      '.sf-brand-site svg{width:clamp(8px,2.2vw,10px);height:clamp(8px,2.2vw,10px);flex:0 0 auto}' +
      '.sf-brand-signature{font-family:var(--font-accent);font-size:clamp(11px,3vw,13px);color:var(--theme-feed-signature,var(--theme-accent,var(--gold2)));line-height:1;letter-spacing:.015em;flex:0 1 auto;min-width:0;text-align:center;white-space:nowrap}' +
      '.sf-post__scene-inner{position:relative;z-index:3;width:100%;max-width:100%;min-width:0;display:flex;align-items:center;justify-content:center;padding:var(--sf-panel-inset-top,4px) var(--sf-panel-inset-x,var(--sf-panel-inset,12px)) var(--sf-panel-inset-bottom,4px);max-height:calc(100% - var(--sf-footer-h,50px));box-sizing:border-box;margin:0}' +
      '.sf-post__textpanel{position:relative;width:auto;max-width:min(100%,var(--sf-panel-fit-max,92%));min-width:min(48%,9.5rem);padding:var(--sf-panel-pad,clamp(12px,3vw,18px));border-radius:28px;background:linear-gradient(180deg,rgba(12,14,16,.86),rgba(10,11,13,.78));border:1px solid rgba(230,200,130,.28);box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(10px) saturate(115%);-webkit-backdrop-filter:blur(10px) saturate(115%);box-sizing:border-box;text-align:center;overflow:visible;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;color:#fff4dc}' +
      '.sf-post__textpanel.feed-quote-panel,.feed-quote-panel{background:linear-gradient(180deg,rgba(12,14,16,.86),rgba(10,11,13,.78))!important;border:1px solid rgba(230,200,130,.28)!important;box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.08)!important;border-radius:28px!important;backdrop-filter:blur(10px) saturate(115%)!important;-webkit-backdrop-filter:blur(10px) saturate(115%)!important}' +
      '.sf-post__textpanel::before,.feed-quote-panel::before{display:none!important}' +
      '.sf-post__textpanel[data-tone=light-bg],.sf-post__textpanel[data-tone=dark-bg]{--feed-text-primary:#fff4dc;--feed-text-secondary:#f3e3c0;--feed-text-accent:#e6c26f;--feed-text-source:rgba(255,244,220,.88)}' +
      '.feed-quote-main,.sf-quote-text,.sf-post__dua-de.feed-quote-main{color:#fff4dc!important;text-shadow:0 2px 8px rgba(0,0,0,.75)!important;font-weight:600!important;-webkit-text-stroke:0!important}' +
      '.feed-quote-scholar,.sf-quote-scholar{color:#e6c26f!important;text-shadow:0 2px 8px rgba(0,0,0,.8)!important;font-weight:800!important}' +
      '.feed-quote-source,.sf-quote-source,.sf-dua-book.feed-quote-source,.sf-dua-cat.feed-quote-source{color:rgba(255,244,220,.88)!important;text-shadow:0 2px 7px rgba(0,0,0,.85)!important;font-weight:500!important}' +
      '.sf-post__dua-ar{color:#fff4dc!important;text-shadow:0 2px 8px rgba(0,0,0,.75)!important;font-weight:600!important;-webkit-text-stroke:0!important}' +
      '.sf-post__dua-tr{color:#e6c26f!important;text-shadow:0 2px 8px rgba(0,0,0,.78)!important;font-weight:500!important}' +
      '.sf-quote-mark{color:#e6c26f!important;text-shadow:0 2px 8px rgba(0,0,0,.75)!important;opacity:.95}' +
      '.feed-export-mode .feed-quote-panel,.feed-export-mode .sf-post__textpanel{background:linear-gradient(180deg,rgba(12,14,16,.88),rgba(10,11,13,.80))!important}' +
      '.feed-export-mode .feed-quote-main,.feed-export-mode .feed-quote-source,.feed-export-mode .sf-quote-text,.feed-export-mode .sf-post__dua-de,.feed-export-mode .sf-post__dua-ar{color:#fff4dc!important;text-shadow:0 2px 8px rgba(0,0,0,.85)!important}' +
      '.feed-export-mode .feed-quote-scholar,.feed-export-mode .sf-quote-scholar,.feed-export-mode .sf-post__dua-tr{color:#e6c26f!important;text-shadow:0 2px 8px rgba(0,0,0,.9)!important}' +
      '.sf-post__img{width:100%;max-width:100%;min-width:100%;height:auto;display:block;aspect-ratio:4/5;object-fit:cover;object-position:center;background:var(--theme-feed-img-fallback,var(--theme-feed-bg,var(--bg)));border-radius:0;vertical-align:top}' +
      '.sf-post__quote{margin:0;line-height:1.22;text-shadow:var(--feed-text-shadow,none);width:100%;color:var(--feed-text-primary,var(--theme-feed-panel-text,var(--theme-text,var(--text))))}' +
      '.sf-quote-mark{display:block;font-size:var(--sf-mark-size,20px);line-height:1;color:var(--feed-text-accent,var(--theme-feed-mark,var(--theme-accent,var(--gold2))));font-family:var(--font-feed-quote);margin-bottom:8px;text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-quote-text{display:block;margin:0;max-width:100%;word-wrap:break-word;overflow-wrap:anywhere;font-size:var(--sf-main-size,15px);color:var(--feed-text-primary,var(--theme-feed-panel-text,var(--theme-text,var(--text))));text-shadow:var(--feed-text-shadow,none);-webkit-text-stroke:0.3px var(--feed-text-stroke,transparent)}' +
      '.sf-quote-source{margin-top:10px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--feed-text-accent,var(--theme-accent,var(--gold2))) 28%,transparent);font-size:var(--sf-src-size,10px);opacity:.92;color:var(--feed-text-source,var(--theme-muted,var(--muted)));word-wrap:break-word;overflow-wrap:anywhere;white-space:normal;text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-quote-scholar{margin-top:10px;font-size:var(--sf-scholar-size,11px);line-height:1.42;opacity:.94;color:var(--feed-text-accent,var(--theme-accent,var(--gold2)));text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-post__dua{margin:0;padding:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:clamp(9px,2.2vw,12px);width:100%;text-align:center}' +
      '.sf-post__dua-ar{direction:rtl;font-size:var(--sf-ar-size,22px);margin:0;width:100%;text-align:center;text-shadow:var(--feed-text-shadow,none);color:var(--feed-text-primary,var(--theme-feed-panel-text,var(--theme-text,var(--text))));opacity:1;font-weight:600;letter-spacing:.01em;-webkit-text-stroke:0.35px var(--feed-text-stroke,transparent)}' +
      '.sf-post__dua-tr{font-size:var(--sf-tr-size,15px);letter-spacing:.02em;color:var(--feed-text-accent,var(--theme-feed-trans,var(--theme-accent,var(--gold2))));width:100%;text-align:center;text-shadow:var(--feed-text-shadow,none);opacity:.96;font-weight:500}' +
      '.sf-post__dua-de{font-size:var(--sf-main-size,15px);margin:0;width:100%;text-align:center;text-shadow:var(--feed-text-shadow,none);color:var(--feed-text-secondary,var(--feed-text-primary,var(--theme-feed-panel-text,var(--theme-text,var(--text)))));opacity:.98}' +
      '.sf-dua-em,.sf-text-em{display:inline;font-family:var(--font-accent);font-size:1.1em;line-height:1.1;font-weight:400;font-style:normal;color:var(--feed-text-accent,var(--theme-feed-em,var(--theme-accent,var(--gold2))));text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--feed-text-accent,var(--theme-accent,var(--gold2))) 75%,transparent);text-underline-offset:3px;text-decoration-thickness:1px;white-space:nowrap;box-decoration-break:clone;-webkit-box-decoration-break:clone;text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-dua-source{margin-top:8px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--feed-text-accent,var(--theme-accent,var(--gold2))) 24%,transparent);width:100%;text-align:center;display:flex;flex-direction:column;gap:3px;align-items:center}' +
      '.sf-dua-cat{font-size:var(--sf-src-size,11px);line-height:1.35;color:var(--feed-text-accent,var(--theme-accent,var(--gold2)));letter-spacing:.02em;text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-dua-book{font-size:max(10.5px,var(--sf-src-size,11px));opacity:.92;color:var(--feed-text-source,var(--theme-muted,var(--muted)));max-width:100%;word-wrap:break-word;text-shadow:var(--feed-text-shadow,none)}' +
      '.sf-post__textpanel--dua{max-width:min(100%,var(--sf-panel-fit-max,94%))!important;width:auto;border-radius:18px}' +
      '.sf-post__scene-inner--full{padding-top:4px!important;padding-bottom:4px!important;padding-left:var(--sf-panel-inset-x,var(--sf-panel-inset,12px))!important;padding-right:var(--sf-panel-inset-x,var(--sf-panel-inset,12px))!important;width:100%;max-width:100%;min-width:0;margin:0!important}' +
      '.sf-post__actions{display:flex;align-items:center;padding:8px 12px 10px;gap:8px;background:var(--theme-feed-bg,var(--outer-bg,var(--bg)));position:relative;z-index:20;pointer-events:auto}' +
      '.feed-actions,.feed-share-button{pointer-events:auto;position:relative;z-index:20;cursor:pointer}' +
      '.feed-share-button{-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      '.sf-actions-left{display:flex;align-items:center;gap:4px;flex:1}' +
      '.sf-act{border:0;background:var(--theme-feed-act-bg,rgba(255,255,255,.04));color:var(--theme-text,var(--text));min-width:42px;height:38px;border-radius:12px;cursor:pointer;font-size:20px;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 10px;border:1px solid var(--theme-feed-act-border,var(--theme-border,var(--line)));transition:transform .15s ease,background .15s ease,color .15s ease}' +
      '.sf-act:active{transform:scale(.94)}' +
      '.sf-act.is-liked{color:#ff6b81;background:rgba(255,107,129,.12);border-color:rgba(255,107,129,.28)}' +
      '.sf-act.is-saved{color:var(--theme-accent,var(--gold2));background:rgba(239,215,142,.1);border-color:var(--theme-border,var(--line))}' +
      '.sf-act.is-busy,.feed-share-button.is-loading{opacity:.72}' +
      '.app-toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);max-width:min(92vw,420px);padding:12px 16px;border-radius:999px;background:rgba(12,18,24,.92);color:#fff4dc;font-weight:700;font-size:14px;line-height:1.35;opacity:0;z-index:99999;pointer-events:none;transition:opacity .25s ease,transform .25s ease;box-shadow:0 18px 45px rgba(0,0,0,.35)}' +
      '.app-toast.is-visible{opacity:1;transform:translateX(-50%) translateY(0)}' +
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
    var fpX = bg.focusX != null ? bg.focusX : 50;
    var fpY = bg.focusY != null ? bg.focusY : 50;
    var url = esc(bg.value);
    var pos = fpX + '% ' + fpY + '%';
    return (
      '<div class="sf-post__bg sf-post__bg--photo" data-sf-bg-src="' + url + '" data-sf-bg-fallbacks="' + esc(fallbacks) + '" data-sf-bg-idx="0" ' +
      'data-sf-grad="' + esc(gradientStyleFor(item)) + '" ' +
      'style="background-image:url(' + url + ');background-size:cover;background-position:' + pos + ';" aria-hidden="true"></div>' +
      '<img class="sf-post__bg sf-post__bg--img" src="' + url + '" alt="' + esc(bg.alt || '') + '" decoding="async" loading="' + (eager ? 'eager' : 'lazy') + '" crossorigin="anonymous" ' +
      'style="object-position:' + pos + '" data-sf-bg-fallbacks="' + esc(fallbacks) + '" data-sf-bg-idx="0" ' +
      'data-sf-grad="' + esc(gradientStyleFor(item)) + '" aria-hidden="true">'
    );
  }

  function sourceHtml(item) {
    var lines = sourceLinesFor(item);
    if (!lines.scholar && !lines.detail) return '';
    var html = '';
    if (lines.scholar && item.type !== 'dua') {
      html += '<div class="sf-quote-scholar feed-quote-scholar">' + esc(lines.scholar) + '</div>';
    }
    if (lines.detail) {
      html += '<div class="sf-quote-source feed-source feed-quote-source">' + esc(lines.detail) + '</div>';
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
    var adaptInit = getAdaptiveFeedTextStyle(bgPreview.backgroundMeta, 'middle', getThemeKey());
    var mainText = textForSize || overlayTextFor(item) || '';
    var lines = sourceLinesFor(item);
    var sizes = typeSizes || computeTypeSizes(item, '', mainText, '', !!lines.scholar, !!lines.detail);
    var align = layoutAlignFor(item, mainText.length);
    var panelStyle = panelStyleFor(item, mainText, align) + typeVarsStyle(sizes) + adaptiveStyleToString(adaptInit);
    var innerStyle = 'justify-content:center;align-items:center';
    var innerClass = 'sf-post__scene-inner' + (opts.innerExtra ? ' ' + opts.innerExtra : '');
    var panelClass = 'sf-post__textpanel feed-quote-panel' + (opts.panelExtra ? ' ' + opts.panelExtra : '');
    var sceneExtra = opts.isDua ? ' data-sf-dua="1"' : '';
    var metaJson = '';
    try {
      if (bgPreview.backgroundMeta) metaJson = esc(JSON.stringify(bgPreview.backgroundMeta));
    } catch (eM) {}
    var eager = !!opts.eagerBg;
    return (
      '<div class="sf-post__scene"' + sceneExtra + ' data-tone="' + esc(adaptInit.dataTone) + '" data-protection="' + esc(adaptInit.protection) + '"' +
        (metaJson ? ' data-sf-bg-meta="' + metaJson + '"' : '') +
        ' style="' + sceneStyle + '">' +
        sceneBgHtml(item, fallbacks, eager) +
        '<div class="sf-post__scene-shade"' + (shadeStyle ? ' style="' + shadeStyle + '"' : '') + '></div>' +
        sceneBadgeHtml() +
        '<div class="' + innerClass + '" style="' + innerStyle + '">' +
          '<div class="' + panelClass + '" data-tone="' + esc(adaptInit.dataTone) + '" data-protection="' + esc(adaptInit.protection) + '" style="' + panelStyle + '">' + inner + '</div>' +
        '</div>' +
        brandStripHtml() +
      '</div>'
    );
  }

  function bindSceneBackgrounds(root) {
    if (!root) return;
    function applyPhotoFallback(el) {
      var list = String(el.getAttribute('data-sf-bg-fallbacks') || '').split('|').filter(Boolean);
      var idx = (parseInt(el.getAttribute('data-sf-bg-idx') || '0', 10) || 0) + 1;
      if (idx < list.length) {
        el.setAttribute('data-sf-bg-idx', String(idx));
        var next = list[idx];
        if (el.classList.contains('sf-post__bg--photo')) {
          el.style.backgroundImage = 'url(' + next + ')';
          el.setAttribute('data-sf-bg-src', next);
        } else {
          el.src = next;
        }
        return next;
      }
      return '';
    }
    function swapToGradient(el) {
      var grad = el.getAttribute('data-sf-grad') || '';
      var scene = el.closest('.sf-post__scene');
      if (!scene || !grad || scene.querySelector('.sf-post__bg--grad')) return;
      if (el.classList.contains('sf-post__bg--photo')) el.style.backgroundImage = 'none';
      else el.style.display = 'none';
      var div = document.createElement('div');
      div.className = 'sf-post__bg sf-post__bg--grad';
      div.setAttribute('aria-hidden', 'true');
      div.style.background = grad;
      scene.insertBefore(div, scene.firstChild);
      scheduleAdaptiveTone(scene, { kind: 'gradient', backgroundMeta: metaForGradient(getThemeKey()) });
    }
    root.querySelectorAll('.sf-post__bg--photo').forEach(function (photo) {
      if (photo.dataset.sfBgBound === '1') return;
      photo.dataset.sfBgBound = '1';
      var src = photo.getAttribute('data-sf-bg-src') || '';
      if (!src) return;
      var probe = new Image();
      probe.decoding = 'async';
      probe.onload = function () {
        var scene = photo.closest('.sf-post__scene');
        if (scene) {
          var meta = null;
          try {
            var raw = scene.getAttribute('data-sf-bg-meta');
            if (raw) meta = JSON.parse(raw);
          } catch (eJ) {}
          scheduleAdaptiveTone(scene, { backgroundMeta: meta, thumb: photo.getAttribute('data-sf-bg-src') });
        }
        scheduleTunePanels(root.closest('.sf-app') || root);
      };
      probe.onerror = function () {
        var next = applyPhotoFallback(photo);
        if (next) {
          probe.src = next;
          return;
        }
        swapToGradient(photo);
      };
      probe.src = src;
    });
    root.querySelectorAll('img.sf-post__bg--img').forEach(function (img) {
      if (img.dataset.sfBgBound === '1') return;
      img.dataset.sfBgBound = '1';
      img.addEventListener('load', function () {
        var scene = img.closest('.sf-post__scene');
        if (scene) scheduleAdaptiveTone(scene, { thumb: img.src });
        scheduleTunePanels(root.closest('.sf-app') || root);
      });
      img.addEventListener('error', function () {
        if (applyPhotoFallback(img)) return;
        swapToGradient(img);
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
          (dua.de ? '<div class="sf-post__dua-de feed-quote-main" style="' + typo.deStyle + '">' + formatDuaGerman(dua.de, item.uid, typo) + '</div>' : '') +
          '<div class="sf-dua-source">' +
            '<div class="sf-dua-cat feed-quote-source">' + esc(dua.sourceLabel) + '</div>' +
            (dua.bookRef ? '<div class="sf-dua-book feed-quote-source">' + esc(dua.bookRef) + '</div>' : '') +
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
    var qStyle = 'text-align:' + layoutAlignFor(item, quote.length);
    return sceneBlock(item,
      '<blockquote class="sf-post__quote feed-quote" style="' + qStyle + '"><span class="sf-quote-mark" aria-hidden="true">❝</span><span class="sf-quote-text feed-quote-main">' + formatEmphasizedText(quote, item.uid, 'quote') + '</span>' + sourceHtml(item) + '</blockquote>',
      fs,
      quote,
      quoteSizes,
      sceneOpts
    );
  }

  function postFeedCardHtml(item, cardIdx) {
    var liked = isLiked(item.uid);
    var eager = cardIdx != null && cardIdx < 3;
    var sub = [item.category, timeAgo(item.date)].filter(Boolean).join(' · ');
    return (
      '<article class="sf-post feed-card sf-post--image-feed" data-feed-card-id="' + esc(item.uid) + '" data-pf-id="' + esc(item.uid) + '" data-post-id="' + esc(item.postId || '') + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="postFeed" data-pf-post="' + esc(item.postId || '') + '">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + logoImgHtml() + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(publisherLabel()) + '</span>' +
            (sub ? '<span class="sf-sub">' + esc(sub) + '</span>' : '') +
          '</div>' +
        '</header>' +
        '<div class="sf-post__media sf-post__media--feed-img">' +
          '<div class="feed-image-frame" aria-hidden="true">' +
            '<img class="feed-image" src="' + esc(item.image) + '" alt="' + esc(item.alt || item.title || '') + '" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async" draggable="false">' +
          '</div>' +
        '</div>' +
        postFeedBarHtml(item, liked) +
      '</article>'
    );
  }

  function cardHtml(item, cardIdx) {
    if (item.type === 'postFeed') return postFeedCardHtml(item);
    var liked = isLiked(item.uid);

    return (
      '<article class="sf-post feed-card' + (item.demo ? ' sf-post--demo' : '') + '" data-feed-card-id="' + esc(item.uid) + '" data-pf-id="' + esc(item.uid) + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="' + esc(item.type) + '" data-pf-post="' + esc(item.postId || '') + '" tabindex="0" role="button">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + logoImgHtml() + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(publisherLabel()) + '</span>' +
          '</div>' +
        '</header>' +
        '<div class="sf-post__media">' + mediaHtml(item, cardIdx < 3) + '</div>' +
        '<div class="sf-post__actions feed-actions">' +
          '<div class="sf-actions-left">' +
            '<button type="button" class="sf-act sf-like' + (liked ? ' is-liked' : '') + '" data-pf-like="' + esc(item.uid) + '" aria-label="Gefällt mir"><span aria-hidden="true">' + (liked ? '♥' : '♡') + '</span>' + likeCountHtml(liked) + '</button>' +
            '<button type="button" class="sf-act sf-share feed-share-button" data-feed-share-id="' + esc(item.uid) + '" aria-label="Teilen"><span aria-hidden="true">↗</span><span class="sf-act-label">Teilen</span></button>' +
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
      if (window.DAR_PREMIUM_FEED && typeof window.DAR_PREMIUM_FEED.saveState === 'function') {
        window.DAR_PREMIUM_FEED.saveState();
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

  /* ── Feed Teilen (neu): nur PNG, kein Text-Fallback ── */

  function feedShareLoadH2c() {
    if (global.html2canvas) return Promise.resolve(global.html2canvas);
    return new Promise(function (resolve, reject) {
      var started = Date.now();
      function poll() {
        if (global.html2canvas) { resolve(global.html2canvas); return; }
        if (Date.now() - started > 8000) { reject(new Error('h2c-timeout')); return; }
        setTimeout(poll, 40);
      }
      if (!document.getElementById('darHtml2Canvas')) {
        var s = document.createElement('script');
        s.id = 'darHtml2Canvas';
        s.src = H2C_URL;
        s.onerror = function () { reject(new Error('h2c-load')); };
        document.head.appendChild(s);
      }
      poll();
    });
  }

  function feedShareInit() {
    feedShareLoadH2c().catch(function () {});
  }

  function feedShareAbsUrl(src) {
    try {
      if (!src) return '';
      if (src.indexOf('//') === 0) return global.location.protocol + src;
      if (src.indexOf('/') === 0) return new URL(src, global.location.origin).href;
      return src;
    } catch (e) {
      return src || '';
    }
  }

  function feedShareLoadImg(src) {
    src = feedShareAbsUrl(src);
    return new Promise(function (resolve, reject) {
      if (!src) { reject(new Error('img-src')); return; }
      var img = new Image();
      try {
        if (new URL(src).origin !== global.location.origin) img.crossOrigin = 'anonymous';
      } catch (eC) {}
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('img-load')); };
      img.src = src;
    });
  }

  function feedShareDrawCover(ctx, img, w, h) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var ir = iw / ih;
    var dr = w / h;
    var sx = 0;
    var sy = 0;
    var sw = iw;
    var sh = ih;
    if (ir > dr) {
      sw = ih * dr;
      sx = (iw - sw) / 2;
    } else {
      sh = iw / dr;
      sy = (ih - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }

  function feedShareDims(scene) {
    var rect = scene.getBoundingClientRect();
    var srcW = Math.max(1, Math.round(rect.width));
    var srcH = Math.max(1, Math.round(rect.height));
    var scale = Math.min(2.5, Math.max(2, Math.ceil(FEED_EXPORT_MIN_W / srcW)));
    var outW = Math.max(FEED_EXPORT_MIN_W, Math.round(srcW * scale));
    var outH = Math.max(Math.round(outW * FEED_EXPORT_RATIO), Math.round(outW * (srcH / srcW)));
    return { srcW: srcW, srcH: srcH, outW: outW, outH: outH, scale: outW / srcW };
  }

  function feedShareShade(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0.22)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.42)');
    g.addColorStop(1, 'rgba(0,0,0,0.58)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function feedShareOffscreen(node, w, h) {
    var host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:0;top:0;width:' + w + 'px;height:' + h + 'px;overflow:hidden;pointer-events:none;transform:translateX(-200vw);opacity:1;z-index:-1;';
    host.appendChild(node);
    document.body.appendChild(host);
    return host;
  }

  function feedSharePrepOverlay(root) {
    if (!root) return;
    enforceReadableExportMode(root);
    root.querySelectorAll('.sf-post__textpanel').forEach(function (el) {
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
      el.style.background = 'linear-gradient(180deg, rgba(12,14,16,0.88), rgba(10,11,13,0.80))';
      el.style.border = '1px solid rgba(230,200,130,0.28)';
      el.style.boxShadow = '0 18px 55px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)';
    });
    root.querySelectorAll('.sf-brand-chip,.sf-scene-badge').forEach(function (el) {
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
    });
    Array.prototype.forEach.call(root.querySelectorAll('img'), function (img) {
      try {
        var src = img.currentSrc || img.getAttribute('src') || img.src || '';
        if (!src) return;
        if (src.indexOf('/') === 0) src = new URL(src, global.location.origin).href;
        if (/^https?:\/\//i.test(src) && src.indexOf(global.location.origin) !== 0) {
          img.crossOrigin = 'anonymous';
        }
      } catch (e) {}
    });
  }

  function feedShareCanvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (b) {
          if (b) resolve(b);
          else reject(new Error('blob-fail'));
        }, 'image/png', 1);
        return;
      }
      try {
        var bin = atob(canvas.toDataURL('image/png').split(',')[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        resolve(new Blob([arr], { type: 'image/png' }));
      } catch (e) {
        reject(new Error('blob-fail'));
      }
    });
  }

  async function feedSharePaintBg(ctx, scene, dims) {
    var photo = scene.querySelector('.sf-post__bg--photo');
    var gradEl = scene.querySelector('.sf-post__bg--grad');
    var bgSrc = photo && photo.getAttribute('data-sf-bg-src');
    if (bgSrc) {
      try {
        var img = await Promise.race([
          feedShareLoadImg(bgSrc),
          new Promise(function (_, rej) { setTimeout(function () { rej(new Error('bg-timeout')); }, 3500); })
        ]);
        ctx.fillStyle = '#1a1814';
        ctx.fillRect(0, 0, dims.outW, dims.outH);
        feedShareDrawCover(ctx, img, dims.outW, dims.outH);
      } catch (eBg) {
        ctx.fillStyle = '#1a1814';
        ctx.fillRect(0, 0, dims.outW, dims.outH);
      }
    } else if (gradEl) {
      var gclone = gradEl.cloneNode(true);
      gclone.style.cssText = 'position:absolute;inset:0;width:' + dims.srcW + 'px;height:' + dims.srcH + 'px;';
      var ghost = feedShareOffscreen(gclone, dims.srcW, dims.srcH);
      try {
        var h2c = await feedShareLoadH2c();
        var gcv = await h2c(gclone, {
          scale: dims.scale,
          width: dims.srcW,
          height: dims.srcH,
          backgroundColor: '#1a1814',
          logging: false,
          useCORS: true,
          allowTaint: false
        });
        ctx.drawImage(gcv, 0, 0, dims.outW, dims.outH);
      } finally {
        try { ghost.remove(); } catch (eG) {}
      }
    } else {
      ctx.fillStyle = '#1a1814';
      ctx.fillRect(0, 0, dims.outW, dims.outH);
    }
    feedShareShade(ctx, dims.outW, dims.outH);
  }

  async function feedSharePaintFg(ctx, scene, dims) {
    var clone = scene.cloneNode(true);
    clone.style.width = dims.srcW + 'px';
    clone.style.height = dims.srcH + 'px';
    clone.style.margin = '0';
    clone.style.minHeight = '0';
    clone.style.maxHeight = 'none';
    clone.style.background = 'transparent';
    clone.querySelectorAll('.sf-post__bg,.sf-post__bg--photo,.sf-post__bg--grad,.sf-post__bg--img,.sf-post__scene-shade').forEach(function (el) {
      el.remove();
    });
    feedSharePrepOverlay(clone);
    var host = feedShareOffscreen(clone, dims.srcW, dims.srcH);
    try {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 350); })]);
      }
      var h2c = await feedShareLoadH2c();
      var fg = await h2c(clone, {
        scale: dims.scale,
        width: dims.srcW,
        height: dims.srcH,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 6000,
        onclone: function (doc, node) { feedSharePrepOverlay(node); }
      });
      ctx.drawImage(fg, 0, 0, dims.outW, dims.outH);
    } finally {
      try { host.remove(); } catch (eH) {}
    }
  }

  async function feedShareBuild(card, feedItemId) {
    var scene = card && card.querySelector('.sf-post__scene');
    if (!scene) throw new Error('Kein Feed-Bildbereich');
    var dims = feedShareDims(scene);
    var canvas = document.createElement('canvas');
    canvas.width = dims.outW;
    canvas.height = dims.outH;
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas nicht verfügbar');
    await feedSharePaintBg(ctx, scene, dims);
    await feedSharePaintFg(ctx, scene, dims);
    var blob = await feedShareCanvasBlob(canvas);
    return new File([blob], 'dar-al-tawhid-feed-' + feedItemId + '.png', { type: 'image/png' });
  }

  async function feedSharePresent(file, feedItemId) {
    if (
      global.navigator &&
      global.navigator.share &&
      global.navigator.canShare &&
      global.navigator.canShare({ files: [file] })
    ) {
      await global.navigator.share({ files: [file] });
      return;
    }
    var url = URL.createObjectURL(file);
    var a = document.createElement('a');
    a.href = url;
    a.download = file.name || ('dar-al-tawhid-feed-' + feedItemId + '.png');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    showToast('Teilen als Bild wird hier nicht unterstützt. Das Bild wurde gespeichert.');
  }

  function feedShareWarm(feedItemId) {
    if (!feedItemId || FEED_SHARE_CACHE[feedItemId] || FEED_SHARE_WARMING[feedItemId]) return;
    var card = document.querySelector('[data-feed-card-id="' + feedItemId + '"]');
    if (!card) return;
    FEED_SHARE_WARMING[feedItemId] = true;
    feedShareBuild(card, feedItemId)
      .then(function (file) { FEED_SHARE_CACHE[feedItemId] = file; })
      .catch(function () {})
      .finally(function () { delete FEED_SHARE_WARMING[feedItemId]; });
  }

  function feedShareWarmVisible(root) {
    if (!root) return;
    root.querySelectorAll('[data-feed-card-id]').forEach(function (card, idx) {
      if (idx > 5) return;
      var id = card.getAttribute('data-feed-card-id');
      if (id) feedShareWarm(id);
    });
  }

  function feedShareObserve(root) {
    if (!root || typeof IntersectionObserver === 'undefined') return;
    if (FEED_SHARE_IO) FEED_SHARE_IO.disconnect();
    FEED_SHARE_IO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute('data-feed-card-id');
        if (id) feedShareWarm(id);
      });
    }, { rootMargin: '300px 0px', threshold: 0.05 });
    root.querySelectorAll('[data-feed-card-id]').forEach(function (card) {
      FEED_SHARE_IO.observe(card);
    });
  }

  function showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { try { toast.remove(); } catch (e) {} }, 300);
    }, 3000);
  }

  function setFeedShareLoading(feedItemId, isLoading) {
    var button = document.querySelector('[data-feed-share-id="' + feedItemId + '"]');
    if (!button) return;
    button.classList.toggle('is-loading', isLoading);
    button.classList.toggle('is-busy', isLoading);
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    var label = button.querySelector('.sf-act-label');
    if (label) label.textContent = isLoading ? 'Bild wird vorbereitet…' : 'Teilen';
    else button.textContent = isLoading ? 'Bild wird vorbereitet…' : 'Teilen';
  }

  async function feedShareRun(feedItemId) {
    if (FEED_SHARE_BUSY[feedItemId]) return;
    FEED_SHARE_BUSY[feedItemId] = true;
    setFeedShareLoading(feedItemId, true);
    try {
      var card = document.querySelector('[data-feed-card-id="' + feedItemId + '"]');
      if (!card) throw new Error('card-missing');
      var file = FEED_SHARE_CACHE[feedItemId];
      if (!file) {
        file = await feedShareBuild(card, feedItemId);
        FEED_SHARE_CACHE[feedItemId] = file;
      }
      await feedSharePresent(file, feedItemId);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      delete FEED_SHARE_CACHE[feedItemId];
      showToast('Bild konnte nicht geteilt werden. Bitte kurz warten und erneut versuchen.');
    } finally {
      setFeedShareLoading(feedItemId, false);
      FEED_SHARE_BUSY[feedItemId] = false;
    }
  }

  function getExtensionFromMime(mime) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  }

  function createSafeFileName(title, extension) {
    var cleanTitle = String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\- ]/gi, '')
      .replace(/\s+/g, '-')
      .slice(0, 80);
    return (cleanTitle || 'dar-al-tawhid-bildbeitrag') + '.' + extension;
  }

  function downloadFeedBlob(blob, fileName) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) {}
  }

  function feedShareImageCandidates(original, preview) {
    var urls = [];
    var add = function (u) {
      u = String(u || '').trim();
      if (!u || urls.indexOf(u) >= 0) return;
      urls.push(u);
    };
    add(original);
    add(preview);
    urls.slice().forEach(function (u) {
      add(u.replace(/\.jpe?g(\?.*)?$/i, '.png$1'));
      add(u.replace(/\.png(\?.*)?$/i, '.jpg$1'));
      add(u.replace(/feed-original(\.[a-z0-9]+)?(\?.*)?$/i, 'feed-preview$1$2'));
      add(u.replace(/feed-preview(\.[a-z0-9]+)?(\?.*)?$/i, 'feed-original$1$2'));
    });
    return urls;
  }

  async function fetchFeedImageBlobFromCandidates(urls) {
    var lastErr = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        return await fetchFeedImageBlob(urls[i]);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('img-load');
  }

  async function fetchFeedImageBlob(imageUrl) {
    var abs = feedShareAbsUrl(imageUrl);
    if (!abs) throw new Error('img-src');
    try {
      var response = await fetch(abs, { cache: 'no-store', credentials: 'same-origin' });
      if (response.ok) return await response.blob();
    } catch (eFetch) {}
    var img = await feedShareLoadImg(imageUrl);
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, img.naturalWidth || img.width || 1);
    canvas.height = Math.max(1, img.naturalHeight || img.height || 1);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('blob-fail'));
      }, 'image/png');
    });
  }

  async function shareOriginalFeedImage(opts) {
    var postUrl = opts && opts.postUrl;
    var postId = opts && opts.postId;
    var title = (opts && opts.title) || 'DAR AL TAWḤID';
    var urls = Array.isArray(opts && opts.imageUrls) && opts.imageUrls.length
      ? opts.imageUrls.slice()
      : feedShareImageCandidates(opts && opts.imageUrl, opts && opts.previewUrl);
    if (!urls.length) {
      showToast('Kein Bild zum Teilen gefunden.');
      return false;
    }
    try {
      var blob = await fetchFeedImageBlobFromCandidates(urls);
      var extension = getExtensionFromMime(blob.type);
      var fileName = createSafeFileName(title, extension);
      var mime = blob.type || ('image/' + (extension === 'jpg' ? 'jpeg' : extension));
      var file = new File([blob], fileName, { type: mime });
      if (global.navigator.share && global.navigator.canShare && global.navigator.canShare({ files: [file] })) {
        await global.navigator.share({ files: [file] });
        if (postId && typeof global.trackPostShare === 'function') global.trackPostShare(postId);
        return true;
      }
      if (global.navigator.share) {
        try {
          await global.navigator.share({ title: title, files: [file] });
          if (postId && typeof global.trackPostShare === 'function') global.trackPostShare(postId);
          return true;
        } catch (eShare) {
          if (eShare && eShare.name === 'AbortError') return false;
        }
      }
      downloadFeedBlob(blob, fileName);
      showToast('Bild gespeichert — du kannst es jetzt in deiner Galerie teilen.');
      if (postId && typeof global.trackPostShare === 'function') global.trackPostShare(postId);
      return true;
    } catch (error) {
      if (error && error.name === 'AbortError') return false;
      console.error(error);
      try {
        downloadFeedBlob(await fetchFeedImageBlobFromCandidates(urls), createSafeFileName(title, 'png'));
        showToast('Bild gespeichert — du kannst es jetzt teilen.');
        if (postId && typeof global.trackPostShare === 'function') global.trackPostShare(postId);
        return true;
      } catch (e2) {
        showToast('Bild konnte nicht geteilt werden.');
        return false;
      }
    }
  }

  function feedShareOnClick(event) {
    var button = event.target.closest('[data-feed-share-id]');
    if (!button || button.classList.contains('is-loading')) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    var feedItemId = button.getAttribute('data-feed-share-id');
    if (!feedItemId) return false;
    feedShareRun(feedItemId);
    return true;
  }

  function renderFeedCardToFile(cardElement, feedItemId) {
    return feedShareBuild(cardElement, feedItemId);
  }

  function shareFeedCardAsImage(feedItemId) {
    return feedShareRun(feedItemId);
  }

  function ensureFeedShareDelegation(root) {
    var feed = null;
    if (root && root.querySelector) feed = root.querySelector('.sf-feed');
    else if (root && root.classList && root.classList.contains('sf-feed')) feed = root;
    if (!feed || feed.dataset.pfShareDelegated === '1') return;
    feed.dataset.pfShareDelegated = '1';
    feed.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.share-image-btn');
      if (!btn || !feed.contains(btn)) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      ev.stopPropagation();
      if (btn.classList.contains('is-loading')) return;
      btn.classList.add('is-loading');
      var postId = btn.getAttribute('data-post-id');
      var urls = feedShareImageCandidates(
        btn.getAttribute('data-original-image'),
        btn.getAttribute('data-feed-preview-image')
      );
      shareOriginalFeedImage({
        imageUrls: urls,
        postId: postId,
        postUrl: btn.getAttribute('data-post-url'),
        title: btn.getAttribute('data-post-title') || 'DAR AL TAWḤID'
      }).then(function (shared) {
        if (shared) {
          global.setTimeout(function () { refreshFeedStatsSoon(feed.closest('.sf-app') ? feed : global.document.getElementById(MOUNT_ID)); }, 3000);
        }
      }).finally(function () {
        btn.classList.remove('is-loading');
      });
    }, true);
  }

  function bindList(root) {
    root.querySelectorAll('.sf-post').forEach(function (card) {
      if (card.dataset.pfCardBound === '1') return;
      card.dataset.pfCardBound = '1';
      var uid = card.getAttribute('data-pf-id');
      var item = state.visible.find(function (x) { return x.uid === uid; });
      function open() {
        if (item) navigateTarget(item);
      }
      function openPostFromFeed() {
        var postId = card.getAttribute('data-post-id') || (item && item.postId);
        if (postId && typeof navigate === 'function') {
          markSeen(uid);
          if (item) trackFeedEvent('feed_click', item);
          navigate('post', postId);
        } else if (item) {
          navigateTarget(item);
        }
      }
      card.addEventListener('click', function (ev) {
        if (ev.target.closest('.sf-act') || ev.target.closest('[data-feed-share-id]') || ev.target.closest('.feed-share-button') || ev.target.closest('.share-image-btn')) return;
        if (item && item.type === 'postFeed') {
          ev.preventDefault();
          openPostFromFeed();
          return;
        }
        if (ev.target.closest('.sf-read-more') || ev.target.closest('[data-pf-open-post]')) {
          openPostFromFeed();
          return;
        }
        open();
      });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          if (item && item.type === 'postFeed') openPostFromFeed();
          else open();
        }
      });
    });
    root.querySelectorAll('.sf-like').forEach(function (btn) {
      if (btn.dataset.pfLikeBound === '1') return;
      btn.dataset.pfLikeBound = '1';
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var uid = btn.getAttribute('data-pf-like');
        if (!uid) return;
        var on = toggleLike(uid);
        btn.classList.toggle('is-liked', on);
        var icon = btn.querySelector('span[aria-hidden="true"]');
        if (icon) icon.textContent = on ? '♥' : '♡';
        var card = btn.closest('.sf-post');
        var item = state.visible.find(function (x) { return x.uid === uid; });
        if (card && item && card.classList.contains('sf-post--image-feed')) {
          var statsEl = card.querySelector('.sf-bar-stats');
          if (statsEl) {
            var parts = feedBarStatsParts(item.postId);
            statsEl.innerHTML = parts.join(' · ');
            statsEl.classList.toggle('sf-bar-stats--empty', !parts.length);
          }
        }
      });
    });
    ensureFeedShareDelegation(root);
    root.querySelectorAll('[data-feed-share-id]').forEach(function (btn) {
      if (btn.dataset.sfShareBound === '1') return;
      btn.dataset.sfShareBound = '1';
      btn.addEventListener('pointerdown', function () {
        var id = btn.getAttribute('data-feed-share-id');
        if (id) feedShareWarm(id);
      }, { passive: true });
      btn.addEventListener('click', function (ev) {
        feedShareOnClick(ev);
      }, true);
    });
    if (typeof IntersectionObserver !== 'undefined') {
      if (!root._sfImpObs) {
        root._sfImpObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var card = en.target;
            if (card.dataset.feedImpression === '1') return;
            card.dataset.feedImpression = '1';
            var uid = card.getAttribute('data-pf-id');
            var item = state.visible.find(function (x) { return x.uid === uid; });
            if (item) trackFeedEvent('feed_view', item);
            root._sfImpObs.unobserve(card);
          });
        }, { threshold: 0.45 });
      }
      root.querySelectorAll('.sf-post--image-feed:not([data-feed-impression])').forEach(function (card) {
        root._sfImpObs.observe(card);
      });
    }
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
    bar.innerHTML = '';
    bar.style.display = 'none';
  }

  function renderTopBar() {
    return (
      '<header class="sf-top">' +
        '<div class="sf-top-inner">' +
          '<div class="sf-top-row">' +
            '<div class="sf-brand">' +
              '<div class="sf-brand-mark" aria-hidden="true">' + logoImgHtml() + '</div>' +
              '<div class="sf-brand-text">' +
                '<span class="sf-brand-kicker sf-brand-title">DAR AL TAWḤID</span>' +
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
      list.innerHTML = '<div class="sf-empty">Noch keine Bildbeiträge im Feed.<br>Sobald du einen Beitrag mit Feed-Bild veröffentlichst, erscheint er hier automatisch.</div>';
      return;
    }
    list.innerHTML = state.visible.map(function (item, idx) { return cardHtml(item, idx); }).join('') +
      (state.done ? '' : '<div class="sf-loader" id="pfLoader">Weitere Beiträge laden…</div>');
    bindList(mount);
    var hasSceneCards = state.visible.some(function (it) { return it && it.type !== 'postFeed'; });
    if (hasSceneCards) {
      bindSceneBackgrounds(mount);
      scheduleTunePanels(mount);
      global.setTimeout(function () {
        enforceReadablePanels(mount);
        feedShareWarmVisible(mount);
        feedShareObserve(mount);
      }, 120);
    } else {
      feedShareWarmVisible(mount);
    }
    setupInfinite(mount);
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
    feedShareInit();
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

  function applyFeedData(mount, manualItems, restoredScroll, opts) {
    opts = opts || {};
    var ctx = getCtx();
    var pools = buildPools(ctx, state.seed);
    var merged = mergeFeed(pools, manualItems || [], state.seed);
    var nextSig = feedItemsSignature(merged);
    var sameItems = !!state._feedSig && nextSig === state._feedSig;
    state.allItems = merged;
    state._feedSig = nextSig;
    if (sameItems && !opts.force && mount.querySelector('.sf-feed') && state.visible.length) {
      loadFeedStats().finally(function () {
        refreshFeedEngagement(mount);
      });
      if (restoredScroll != null) {
        if (global.DARScrollManager && global.DARScrollManager.stableScrollTo) {
          global.DARScrollManager.stableScrollTo(restoredScroll);
        } else {
          global.requestAnimationFrame(function () {
            global.scrollTo({ top: restoredScroll, behavior: 'auto' });
          });
        }
      }
      return;
    }
    state.offset = 0;
    state.done = false;
    state.visible = [];
    state.loading = false;
    function finishRender() {
      if (!mount.querySelector('.sf-app')) {
        renderPage(mount);
      } else {
        appendBatch(true);
        renderListMount(mount);
        preloadFeedImages(state.visible, 3);
      }
      if (restoredScroll != null) {
        if (global.DARScrollManager && global.DARScrollManager.stableScrollTo) {
          global.DARScrollManager.stableScrollTo(restoredScroll);
        } else {
          global.requestAnimationFrame(function () {
            global.scrollTo({ top: restoredScroll, behavior: 'auto' });
          });
        }
      }
    }
    loadFeedStats().finally(finishRender);
  }

  function rebuild(force) {
    startFeedMount({ force: !!force });
  }

  function refreshMix() {
    try {
      sessionStorage.setItem(REFRESH_KEY, String(Date.now()));
    } catch (e) {}
    clearFeedState();
    rebuild(true);
  }

  function destroy() {
    saveFeedState();
    document.body.classList.remove('is-premium-feed-view');
    if (observer) observer.disconnect();
  }

  global.DAR_PREMIUM_FEED = {
    mount: renderPage,
    rebuild: rebuild,
    refresh: refreshMix,
    destroy: destroy,
    saveState: saveFeedState,
    tryRestore: tryRestoreFeedState,
    clearState: clearFeedState,
    selectFeedBackground: selectFeedBackground,
    getAdaptiveFeedTextStyle: getAdaptiveFeedTextStyle,
    getFeedBackgroundPool: function () { return FEED_BG_POOL.slice(); },
    shareFeedCardAsImage: shareFeedCardAsImage,
    renderFeedCardToFile: renderFeedCardToFile,
    onAppReady: function (opts) {
      startFeedMount({ force: opts && opts.force });
    },
    onPostsUpdated: function () {
      if (!isFeedRoute()) return;
      var ctx = getCtx();
      var pools = buildPools(ctx, state.seed);
      var merged = mergeFeed(pools, [], state.seed);
      var nextSig = feedItemsSignature(merged);
      if (state._feedSig === nextSig && state.visible.length && global.document.querySelector('#' + MOUNT_ID + ' .sf-feed')) {
        return;
      }
      startFeedMount({ force: false });
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
    if (!mount || mount.querySelector('.sf-app')) return;
    rebuild(true);
  }

  if (global && global.addEventListener) {
    feedShareInit();
    global.addEventListener('hashchange', autoMountFeed);
    global.addEventListener('load', autoMountFeed);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMountFeed);
  } else {
    autoMountFeed();
  }
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
