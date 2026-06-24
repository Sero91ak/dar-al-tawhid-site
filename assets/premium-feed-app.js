/**
 * DAR AL TAWḤID — Premium-Feed (vertikal, Tab „Feed“)
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darPremiumFeedStylesV11';
  var FONTS_ID = 'darPremiumFeedFontsV11';
  var APP_LOGO = '/watermark-my-logo-full.png';
  var BRAND = {
    site: 'dar-al-tawhid.de',
    instagram: '@dar_at_tawhid',
    telegram: '@dar_al_tauhid'
  };
  var BG_VERIFIED = {
    islamic: [
      '1512632578888-169bbbc64f33', '1542816417-0983c9c9ad53', '1519817650390-64a93db51149',
      '1519818187420-8e49de7adeef', '1513072064285-240f87fa81e8', '1596163177973-aa0e47c735dc',
      '1580418827493-f2b22c0a76cb', '1574246604907-db69e30ddb97', '1590273089302-ebbc53986b6e',
      '1631432526080-5abd83dafc8a', '1587617425953-9075d28b8c46', '1537181534458-45dcee76ae90',
      '1578662996442-48f60103fc96', '1519741497674-611481863552', '1558618666-fcd25c85cd64',
      '1540959733332-eab4deabeeaf', '1600814832809-579119f47045', '1590075865003-e48277faa558',
      '1553755088-ef1973c7b4a1'
    ],
    nature: [
      '1506905925346-21bda4d32df4', '1469474968028-56623f02e42e', '1470071459604-3b5ec3a7fe05',
      '1439066615861-d1af74d74000', '1501785888041-af3ef285b470', '1519682337058-a94d519337bc',
      '1441974231531-c6227db76b6e', '1472214103451-9374bd1c798e', '1518837695005-2083093ee35b',
      '1507525428034-b723cf961d3e', '1511593358241-7eea1f3c84e5', '1465146633011-14f8e0781093',
      '1507003211169-0a1dd7228f2d'
    ]
  };
  var ISLAMIC_BG = {
    dua: BG_VERIFIED.islamic.concat(BG_VERIFIED.nature.slice(0, 4)),
    quran: ['1542816417-0983c9c9ad53', '1590075865003-e48277faa558', '1580418827493-f2b22c0a76cb',
      '1574246604907-db69e30ddb97', '1631432526080-5abd83dafc8a', '1537181534458-45dcee76ae90'].concat(BG_VERIFIED.nature.slice(0, 3)),
    knowledge: ['1542816417-0983c9c9ad53', '1631432526080-5abd83dafc8a', '1519741497674-611481863552',
      '1578662996442-48f60103fc96', '1512632578888-169bbbc64f33'].concat(BG_VERIFIED.nature),
    default: BG_VERIFIED.islamic.concat(BG_VERIFIED.nature)
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

  var CUSTOM_BG = [];
  var H2C_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

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

  function unsplashUrl(pid) {
    return 'https://images.unsplash.com/photo-' + pid + '?auto=format&fit=crop&w=3840&q=85';
  }

  function fetchCustomBackgrounds() {
    var staging = isStaging();
    var path = staging ? '/content/staging/feed-backgrounds/backgrounds-index.json' : '/content/feed-backgrounds/backgrounds-index.json';
    return fetch(path + '?v=' + encodeURIComponent(todayKey()), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .catch(function () { return { items: [] }; })
      .then(function (data) {
        CUSTOM_BG = (data && data.items || []).filter(function (it) {
          return it && (it.url || it.src);
        }).map(function (it) {
          var u = String(it.url || it.src || '').trim();
          if (u.indexOf('/') === 0) {
            try { u = new URL(u, global.location.origin).href; } catch (e) {}
          }
          return u;
        }).filter(Boolean);
      });
  }

  function customBgFor(item) {
    if (!CUSTOM_BG.length) return '';
    var key = String(item && item.uid || '') + '|custom|' + todayKey();
    return CUSTOM_BG[hashNum(key) % CUSTOM_BG.length];
  }

  function allBgFallbacks(item) {
    var primary = islamicBgPoolFor(item) || ISLAMIC_BG.default;
    var merged = primary.map(unsplashUrl);
    ISLAMIC_BG.default.forEach(function (pid) {
      var u = unsplashUrl(pid);
      if (merged.indexOf(u) < 0) merged.push(u);
    });
    CUSTOM_BG.forEach(function (url) {
      if (merged.indexOf(url) < 0) merged.unshift(url);
    });
    return merged;
  }

  function islamicBgPoolFor(item) {
    var type = item && item.type || 'post';
    var cat = String(item && item.category || '').toLowerCase();
    if (type === 'dua' || cat.indexOf('du') >= 0 || cat.indexOf('duʿ') >= 0) return ISLAMIC_BG.dua;
    if (type === 'quran' || cat.indexOf('qur') >= 0 || cat.indexOf('tafs') >= 0) return ISLAMIC_BG.quran;
    if (cat.indexOf('aqid') >= 0 || cat.indexOf('athar') >= 0 || cat.indexOf('hadith') >= 0 || cat.indexOf('sunnah') >= 0 || cat.indexOf('fiqh') >= 0) return ISLAMIC_BG.knowledge;
    return ISLAMIC_BG.default;
  }

  function islamicBgFor(item) {
    var custom = customBgFor(item);
    if (custom && hashNum(String(item && item.uid || '') + '|cbg') % 4 === 0) return custom;
    var pool = islamicBgPoolFor(item);
    if (!pool || !pool.length) return custom || unsplashUrl(ISLAMIC_BG.default[0]);
    var key = String(item && item.uid || '') + '|' + String(item && item.type || '') + '|' + todayKey();
    return unsplashUrl(pool[hashNum(key) % pool.length]);
  }

  function fontStyleFor(item) {
    var fonts = FEED_FONTS;
    if (!fonts.length) return { css: 'Georgia, serif', size: 'clamp(16px,3.9vw,19px)', color: '#fff9e8', align: 'center' };
    var idx = hashNum(String(item && item.uid || '') + '|font|' + todayKey()) % fonts.length;
    var f = fonts[idx];
    var tone = hashNum(String(item && item.uid || '') + '|tone') % 4;
    var colors = ['#fff9e8', '#f5ecd4', '#efe2c4', '#fdf6e3'];
    var aligns = ['left', 'center', 'right', 'left'];
    var align = aligns[hashNum(String(item && item.uid || '') + '|align') % aligns.length];
    return { css: f.css, size: f.size, color: colors[tone], align: align };
  }

  function postSourceDetail(post) {
    if (!post) return '';
    try {
      if (global && typeof global.sourceTextFromPost === 'function') {
        var s = global.sourceTextFromPost(post);
        if (s) return clamp(String(s).replace(/\s+/g, ' ').trim(), 140);
      }
    } catch (e) {}
    var direct = String(post.source || '').replace(/\s+/g, ' ').trim();
    if (direct) return clamp(direct, 140);
    var parts = [post.book, post.scholar].filter(Boolean);
    return clamp(parts.join(' · '), 140);
  }

  function sourceLinesFor(item) {
    if (!item) return { scholar: '', detail: '' };
    if (item.type === 'dua') {
      return { scholar: '', detail: item.ref || item.source || 'Duʿāʾ' };
    }
    var scholar = '';
    var raw = item.statement || item.preview || '';
    try {
      if (global && typeof global.parseImageEditorBodySource === 'function') {
        var parsed = global.parseImageEditorBodySource(String(raw), item.scholar || '');
        if (parsed.nameLine) scholar = String(parsed.nameLine).trim();
      }
    } catch (e) {}
    if (!scholar && item.scholar) scholar = String(item.scholar).trim();
    var detail = item.sourceDetail || item.source || '';
    if (!detail && item.book) detail = String(item.book);
    detail = String(detail).replace(/\s+/g, ' ').trim();
    return { scholar: clamp(scholar, 90), detail: clamp(detail, 140) };
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
      var txt = String(item.preview || '');
      var dash = txt.indexOf(' — ');
      return {
        text: clamp(dash > 0 ? txt.slice(dash + 3).trim() : txt, 280),
        source: sourceLineFor(item)
      };
    }
    var raw = item.statement || item.preview || '';
    var scholar = item.scholar || '';
    try {
      if (global && typeof global.parseImageEditorBodySource === 'function') {
        var parsed = global.parseImageEditorBodySource(String(raw), scholar);
        parsed.fazit = '';
        var body = String(parsed.bodyText || '').trim();
        if (!body && item.preview) body = stripMd(item.preview);
        var srcLine = sourceLinesFor(item);
        var src = srcLine.detail || srcLine.scholar || '';
        if (body) return { text: clamp(stripMd(body), 320), source: src, scholar: srcLine.scholar, detail: srcLine.detail };
      }
    } catch (e) {}
    var srcLine = sourceLinesFor(item);
    return {
      text: feedStatementOnly(raw, scholar) || clamp(stripMd(item.preview || item.title || ''), 280),
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

  function fakeEngagement(uid) {
    var likes = (hashNum(uid + 'lk') % 820) + 38;
    var comments = (hashNum(uid + 'cm') % 24) + 1;
    return { likes: likes, comments: comments };
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
      image: raw.thumbnailUrl || raw.imageUrl || '',
      gradientFrom: raw.gradientFrom,
      gradientTo: raw.gradientTo,
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
            preview: (dd.ar ? dd.ar + ' — ' : '') + clamp(dd.de || dd.tr || '', 140),
            source: dd.ref || dd.source || 'Duʿāʾ des Tages',
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
        preview: (d.ar ? d.ar + ' — ' : '') + clamp(d.de || d.tr || d.ar || '', 120),
        source: d.ref || d.source || (d.cat ? 'Duʿāʾ · ' + d.cat : 'Duʿāʾ'),
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
      'Noto+Naskh+Arabic:wght@400;500;600;700'
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
      '.sf-app{position:relative;display:flex;flex-direction:column;min-height:inherit;background:#050504;color:#fff8e8;overflow:hidden}' +
      '.sf-app:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% -8%,rgba(239,215,142,.16),transparent 42%),radial-gradient(circle at 88% 4%,rgba(155,122,60,.12),transparent 36%);z-index:0}' +
      '.sf-app>*{position:relative;z-index:1}' +
      '.sf-top{position:sticky;top:0;z-index:8;padding:12px 14px 10px;background:linear-gradient(180deg,rgba(5,5,4,.97),rgba(5,5,4,.88) 72%,transparent);border-bottom:1px solid rgba(214,190,132,.12);backdrop-filter:blur(16px) saturate(1.1)}' +
      '.sf-top-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}' +
      '.sf-brand{display:flex;align-items:center;gap:10px;min-width:0}' +
      '.sf-brand-mark{width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(255,240,200,.45);box-shadow:0 4px 18px rgba(212,184,106,.28);flex:0 0 36px;overflow:hidden;background:#1a1408}' +
      '.sf-logo-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}' +
      '.sf-brand-text{min-width:0}' +
      '.sf-brand-kicker{display:block;font-size:8px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(214,190,132,.72);margin-bottom:2px}' +
      '.sf-brand h1{margin:0;font-family:var(--serif,Cinzel,serif);font-size:18px;font-weight:700;color:#f0dfa0;letter-spacing:.06em;line-height:1}' +
      '.sf-refresh{border:1px solid rgba(214,190,132,.28);background:rgba(255,255,255,.06);color:#f0dfa0;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:17px;box-shadow:0 4px 14px rgba(0,0,0,.22)}' +
      '.sf-switch{display:flex;gap:4px;padding:4px;background:rgba(255,255,255,.05);border-radius:999px;border:1px solid rgba(214,190,132,.16)}' +
      '.sf-switch-btn{flex:1;border:0;background:transparent;color:rgba(248,239,212,.68);border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer}' +
      '.sf-switch-btn.is-active{background:linear-gradient(135deg,rgba(214,190,132,.24),rgba(155,122,60,.18));color:#fff9e5;border:1px solid rgba(214,190,132,.38);box-shadow:0 4px 14px rgba(0,0,0,.18)}' +
      '.sf-filters{display:flex;gap:7px;overflow-x:auto;padding:2px 14px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '.sf-filters::-webkit-scrollbar{display:none}' +
      '.sf-filter{flex:0 0 auto;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:rgba(248,239,212,.82);border-radius:999px;padding:7px 13px;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}' +
      '.sf-filter.is-active{border-color:rgba(214,190,132,.5);background:linear-gradient(135deg,rgba(214,190,132,.18),rgba(90,70,30,.12));color:#fff9e5}' +
      '.sf-feed{display:flex;flex-direction:column;gap:10px;padding:0 10px calc(10px + env(safe-area-inset-bottom))}' +
      '.sf-post{margin:0;border-radius:22px;overflow:hidden;cursor:pointer;background:linear-gradient(180deg,rgba(18,16,12,.96),rgba(8,8,6,.98));border:1px solid rgba(214,190,132,.18);box-shadow:0 16px 40px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.04)}' +
      '.sf-post--demo{border-color:rgba(214,190,132,.32);box-shadow:0 18px 44px rgba(0,0,0,.34),0 0 0 1px rgba(239,215,142,.08) inset}' +
      '.sf-post__head{display:flex;align-items:center;gap:10px;padding:10px 12px 8px}' +
      '.sf-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(145deg,rgba(239,215,142,.42),rgba(90,70,30,.62));border:1.5px solid rgba(239,215,142,.42);display:grid;place-items:center;font-size:14px;font-weight:900;color:#fff8e8;flex:0 0 40px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.24)}' +
      '.sf-avatar img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sf-post__meta{flex:1;min-width:0}' +
      '.sf-user{display:block;font-size:13px;font-weight:800;color:#fff9e5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sf-sub{display:block;font-size:10px;opacity:.62;margin-top:1px}' +
      '.sf-more{border:0;background:rgba(255,255,255,.05);color:inherit;font-size:16px;line-height:1;padding:6px 8px;border-radius:999px;cursor:pointer;opacity:.82}' +
      '.sf-post__media{position:relative;background:#1a1814;min-height:180px;overflow:hidden}' +
      '.sf-post__scene{position:relative;min-height:min(36vh,320px);max-height:360px;display:flex;align-items:center;justify-content:center;padding:12px 10px 54px;overflow:hidden;aspect-ratio:4/5;max-width:100%;margin:0 auto}' +
      '.sf-post__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0;display:block;background:#2a2418}' +
      '.sf-post__scene-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.14) 0%,rgba(0,0,0,.38) 58%,rgba(0,0,0,.52) 100%);pointer-events:none}' +
      '.sf-scene-logo{position:absolute;left:20px;top:20px;right:auto;z-index:4;width:34px;height:34px;border-radius:50%;overflow:hidden;border:1px solid rgba(239,215,142,.32);box-shadow:0 4px 14px rgba(0,0,0,.38);background:rgba(8,7,5,.55);backdrop-filter:blur(4px)}' +
      '.sf-scene-logo img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sf-scene-brand{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:8px 10px 10px;background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.48) 38%,rgba(0,0,0,.72) 100%);display:flex;flex-direction:column;gap:4px;align-items:center;pointer-events:none}' +
      '.sf-scene-brand-row{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%}' +
      '.sf-brand-chip{display:inline-flex;align-items:center;gap:4px;font-size:8.5px;font-weight:800;color:rgba(248,239,212,.9);background:rgba(8,7,5,.42);border:1px solid rgba(239,215,142,.14);border-radius:999px;padding:3px 7px;line-height:1;white-space:nowrap}' +
      '.sf-brand-chip svg{width:13px;height:13px;flex:0 0 13px;display:block}' +
      '.sf-brand-site{display:inline-flex;align-items:center;gap:4px;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(214,190,132,.78);font-weight:800;line-height:1}' +
      '.sf-brand-site svg{width:11px;height:11px;flex:0 0 11px}' +
      '.sf-post__scene-inner{position:relative;z-index:2;width:100%;display:flex;align-items:center;padding:44px 10px 10px;max-height:calc(100% - 48px)}' +
      '.sf-post__textpanel{max-width:min(94%,34em);padding:14px 13px;border-radius:16px;background:rgba(8,7,5,.5);backdrop-filter:blur(8px) saturate(1.08);border:1px solid rgba(239,215,142,.16);box-shadow:0 10px 28px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.05)}' +
      '.sf-post__img{width:100%;max-height:min(72vh,520px);object-fit:cover;display:block;aspect-ratio:4/5;background:#1a1814}' +
      '.sf-post__quote{margin:0;line-height:1.62;text-shadow:0 2px 12px rgba(0,0,0,.42)}' +
      '.sf-quote-mark{display:block;font-size:24px;line-height:1;color:rgba(239,215,142,.58);font-family:Georgia,serif;margin-bottom:6px}' +
      '.sf-quote-text{display:block;margin:0;max-width:100%;word-wrap:break-word;overflow-wrap:anywhere}' +
      '.sf-quote-source{margin-top:6px;padding-top:6px;border-top:1px solid rgba(239,215,142,.1);font-size:10px;line-height:1.4;opacity:.82;font-style:italic;color:rgba(248,239,212,.88)}' +
      '.sf-quote-scholar{margin-top:8px;font-size:11px;line-height:1.35;opacity:.88;font-weight:700;color:rgba(239,215,142,.92)}' +
      '.sf-post__dua{margin:0;padding:0;background:transparent}' +
      '.sf-post__dua-ar{direction:rtl;font-size:clamp(22px,5vw,28px);line-height:1.75;margin-bottom:10px;text-shadow:0 2px 12px rgba(0,0,0,.42)}' +
      '.sf-post__dua-de{font-size:clamp(14px,3.5vw,17px);line-height:1.55;text-shadow:0 2px 10px rgba(0,0,0,.38)}' +
      '.sf-post__actions{display:flex;align-items:center;padding:8px 12px 10px;gap:8px}' +
      '.sf-actions-left{display:flex;align-items:center;gap:4px;flex:1}' +
      '.sf-act{border:0;background:rgba(255,255,255,.04);color:rgba(248,239,212,.92);min-width:42px;height:38px;border-radius:12px;cursor:pointer;font-size:20px;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 10px;border:1px solid rgba(255,255,255,.06);transition:transform .15s ease,background .15s ease,color .15s ease}' +
      '.sf-act:active{transform:scale(.94)}' +
      '.sf-act.is-liked{color:#ff6b81;background:rgba(255,107,129,.12);border-color:rgba(255,107,129,.28)}' +
      '.sf-act.is-saved{color:#f0dfa0;background:rgba(239,215,142,.1);border-color:rgba(239,215,142,.24)}' +
      '.sf-act.is-busy{opacity:.55;pointer-events:none}' +
      '.sf-like-count{font-size:12px;font-weight:800;color:rgba(248,239,212,.78);min-width:1.2em}' +
      '.sf-act-label{font-size:11px;font-weight:700;letter-spacing:.02em}' +
      '.sf-post__body{padding:0 14px 16px}' +
      '.sf-caption{margin:0 0 6px;font-size:13px;line-height:1.45;color:rgba(248,239,212,.92)}' +
      '.sf-caption b{font-weight:800;color:#fff9e5}' +
      '.sf-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
      '.sf-tag{font-size:9px;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);opacity:.9;font-weight:700}' +
      '.sf-tag--demo{border-color:rgba(239,215,142,.35);color:#f0dfa0;background:rgba(239,215,142,.08)}' +
      '.sf-loader{padding:20px;text-align:center;opacity:.6;font-size:12px}' +
      '.sf-empty{padding:32px 20px;text-align:center;opacity:.7;font-size:13px;line-height:1.5}' +
      'html[data-theme="light"] .sf-post,html[data-theme="soft"] .sf-post{background:var(--page-bg,#faf8f4);border-bottom-color:rgba(0,0,0,.08)}' +
      'html[data-theme="light"] .sf-top,html[data-theme="soft"] .sf-top{background:linear-gradient(180deg,rgba(250,248,244,.98),rgba(250,248,244,.9))}' +
      'html[data-theme="light"] .sf-user,html[data-theme="soft"] .sf-user{color:var(--text,#3e2b17)}' +
      'html[data-theme="light"] .sf-post__quote,html[data-theme="soft"] .sf-post__quote{color:var(--text,#3e2b17)}' +
      'body.is-premium-feed-view .float-actions{opacity:.45;pointer-events:none}' +
      '@media(max-width:700px){.sf-post__scene{min-height:260px;max-height:320px;aspect-ratio:4/5}.sf-post__textpanel{padding:12px 11px}.sf-post__dua-ar{font-size:clamp(18px,4.6vw,24px)!important}.sf-quote-text{font-size:clamp(13px,3.6vw,16px)!important}}' +
      '@media(min-width:768px){.sf-feed,.sf-top-inner{max-width:500px;margin-left:auto;margin-right:auto;width:100%}.sf-filters{max-width:500px;margin:0 auto}.sf-post__scene{max-height:400px}}';

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
        '<div class="sf-scene-brand-row">' +
          '<span class="sf-brand-chip">' + brandIconSvg('instagram') + esc(BRAND.instagram) + '</span>' +
          '<span class="sf-brand-chip">' + brandIconSvg('telegram') + esc(BRAND.telegram) + '</span>' +
        '</div>' +
        '<span class="sf-brand-site">' + brandIconSvg('web') + esc(BRAND.site) + '</span>' +
      '</div>'
    );
  }

  function sceneLogoHtml() {
    return '<div class="sf-scene-logo" aria-hidden="true"><img src="' + APP_LOGO + '" alt="" loading="lazy" decoding="async"></div>';
  }

  function sourceHtml(item, fs) {
    var lines = sourceLinesFor(item);
    if (!lines.scholar && !lines.detail) return '';
    var style = 'font-family:' + (fs && fs.css ? fs.css : 'Georgia,serif') + ';color:' + (fs && fs.color ? fs.color : '#f5ecd4');
    var html = '';
    if (lines.scholar && item.type !== 'dua') {
      html += '<div class="sf-quote-scholar" style="' + style + '">' + esc(lines.scholar) + '</div>';
    }
    if (lines.detail) {
      html += '<div class="sf-quote-source" style="' + style + '">' + esc(lines.detail) + '</div>';
    }
    return html;
  }

  function sceneBlock(item, inner, style) {
    var bg = item.image || islamicBgFor(item);
    var fs = style || fontStyleFor(item);
    var fallbacks = allBgFallbacks(item).join('|');
    var panelStyle = 'font-family:' + fs.css + ';color:' + fs.color + ';font-size:' + fs.size + ';text-align:' + fs.align;
    var innerStyle = 'justify-content:' + (fs.align === 'left' ? 'flex-start' : fs.align === 'right' ? 'flex-end' : 'center');
    return (
      '<div class="sf-post__scene">' +
        '<img class="sf-post__bg" src="' + esc(bg) + '" alt="" decoding="async" loading="eager" data-sf-bg-fallbacks="' + esc(fallbacks) + '" data-sf-bg-idx="0">' +
        '<div class="sf-post__scene-shade"></div>' +
        sceneLogoHtml() +
        '<div class="sf-post__scene-inner" style="' + innerStyle + '">' +
          '<div class="sf-post__textpanel" style="' + panelStyle + '">' + inner + '</div>' +
        '</div>' +
        brandStripHtml() +
      '</div>'
    );
  }

  function bindSceneBackgrounds(root) {
    if (!root) return;
    root.querySelectorAll('.sf-post__bg').forEach(function (img) {
      if (img.dataset.sfBgBound === '1') return;
      img.dataset.sfBgBound = '1';
      img.addEventListener('error', function () {
        var list = String(img.getAttribute('data-sf-bg-fallbacks') || '').split('|').filter(Boolean);
        var idx = (parseInt(img.getAttribute('data-sf-bg-idx') || '0', 10) || 0) + 1;
        if (idx < list.length) {
          img.setAttribute('data-sf-bg-idx', String(idx));
          img.src = list[idx];
        }
      });
    });
  }

  function mediaHtml(item) {
    if (item.image && (item.type === 'post' || item.type === 'archive' || item.type === 'custom')) {
      return '<img class="sf-post__img" src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async">';
    }
    var fs = fontStyleFor(item);
    if (item.type === 'dua') {
      var txt = String(item.preview || '');
      var dash = txt.indexOf(' — ');
      var ar = dash > 0 ? txt.slice(0, dash).trim() : '';
      var de = overlayTextFor(item) || item.title || '';
      var arAlign = fs.align === 'right' ? 'right' : fs.align === 'left' ? 'left' : 'center';
      var arStyle = 'font-family:"Noto Naskh Arabic",serif;color:' + fs.color + ';font-size:clamp(22px,5vw,28px);text-align:' + arAlign;
      var deStyle = 'font-family:' + fs.css + ';color:' + fs.color + ';font-size:clamp(14px,3.5vw,17px);text-align:' + fs.align;
      return sceneBlock(item,
        '<div class="sf-post__dua">' +
          (ar ? '<div class="sf-post__dua-ar" style="' + arStyle + '">' + esc(ar) + '</div>' : '') +
          '<div class="sf-post__dua-de" style="' + deStyle + '">' + esc(de) + '</div>' +
          sourceHtml(item, fs) +
        '</div>',
        fs
      );
    }
    var bundle = feedOverlayBundle(item);
    var quote = bundle.text;
    if (!quote) return sceneBlock(item, '', fs);
    var qStyle = 'font-family:' + fs.css + ';color:' + fs.color + ';font-size:' + fs.size + ';text-align:' + fs.align;
    return sceneBlock(item,
      '<blockquote class="sf-post__quote" style="' + qStyle + '"><span class="sf-quote-mark" aria-hidden="true">❝</span><span class="sf-quote-text">' + esc(quote) + '</span>' + sourceHtml(item, fs) + '</blockquote>',
      fs
    );
  }

  function cardHtml(item) {
    var liked = isLiked(item.uid);
    var eng = fakeEngagement(item.uid);
    var likeCount = eng.likes + (liked ? 1 : 0);

    return (
      '<article class="sf-post' + (item.demo ? ' sf-post--demo' : '') + '" data-pf-id="' + esc(item.uid) + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="' + esc(item.type) + '" data-pf-post="' + esc(item.postId || '') + '" tabindex="0" role="button">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + logoImgHtml() + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(publisherLabel()) + '</span>' +
          '</div>' +
        '</header>' +
        '<div class="sf-post__media">' + mediaHtml(item) + '</div>' +
        '<div class="sf-post__actions">' +
          '<div class="sf-actions-left">' +
            '<button type="button" class="sf-act sf-like' + (liked ? ' is-liked' : '') + '" data-pf-like="' + esc(item.uid) + '" aria-label="Gefällt mir"><span aria-hidden="true">' + (liked ? '♥' : '♡') + '</span><span class="sf-like-count">' + likeCount + '</span></button>' +
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
          imageTimeout: 25000
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
        return h2c(el, {
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
          windowHeight: document.documentElement.clientHeight
        });
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
        var card = btn.closest('.sf-post');
        var item = state.visible.find(function (x) { return x.uid === uid; });
        if (item) {
          var eng = fakeEngagement(uid);
          var countEl = btn.querySelector('.sf-like-count');
          if (countEl) countEl.textContent = String(eng.likes + (on ? 1 : 0));
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
    list.innerHTML = state.visible.map(cardHtml).join('') +
      (state.done ? '' : '<div class="sf-loader" id="pfLoader">Weitere Beiträge laden…</div>');
    bindList(mount);
    bindSceneBackgrounds(mount);
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
    document.body.classList.add('is-premium-feed-view');

    mount.innerHTML =
      '<div class="sf-app">' +
        renderTopBar() +
        '<div class="sf-filters"></div>' +
        '<div class="sf-feed"></div>' +
      '</div>';

    renderFilters(mount);
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
  }

  function rebuild(force) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      document.body.classList.remove('is-premium-feed-view');
      return;
    }
    state.seed = feedSeed();
    fetchCustomBackgrounds().finally(function () {
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
