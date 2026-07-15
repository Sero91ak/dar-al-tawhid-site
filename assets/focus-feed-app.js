/**
 * DAR AL TAWḤID — Im Fokus / Feed-Slider (Besucher-App)
 * Horizontal snap-scroll cards: posts, duʿāʾ, Qurʾān, news, prayer, categories.
 */
(function () {
  'use strict';

  function darDiag(context, err) {
    try {
      if (typeof console !== 'undefined' && console.debug) console.debug('[dar-focus-feed] ' + context, err);
    } catch (_e) {}
  }

  var MOUNT_ID = 'focusFeedMount';
  var SCROLL_KEY = 'darFocusFeedScrollV1';
  var ANCHOR_KEY = 'darFocusFeedAnchorY';
  var RETURN_KEY = 'darFocusFeedReturnV1';
  var MAX_AUTO = 14;
  var MAX_TOTAL = 24;
  var FEED_API_ORIGIN = 'https://dar-admin-publisher.sero91ak.workers.dev';
  var ALLOWED_IMG_PREFIXES = ['/assets/', '/content/', '/logo', '/favicon', '/apple-touch', '/notification-icon'];

  var CARD = {
    premium: { w: 'min(84vw, 360px)', h: 'min(52vw, 210px)' },
    medium: { w: 'min(68vw, 260px)', h: 'min(40vw, 158px)' },
    mini: { w: 'min(46vw, 180px)', h: 'min(32vw, 108px)' }
  };

  var TYPE_LABELS = {
    post: 'Beitrag',
    dua: 'Duʿāʾ',
    quran: 'Qurʾān',
    news: 'Neu im Fokus',
    prayer: 'Gebetszeiten',
    category: 'Ordner',
    series: 'Serie',
    custom: 'Empfehlung'
  };

  var state = {
    items: [],
    backgrounds: [],
    filter: 'all',
    loading: false,
    scrollLeft: 0
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clampText(s, n) {
    var t = String(s || '').replace(/\s+/g, ' ').trim();
    if (t.length <= n) return t;
    return t.slice(0, n - 1).trim() + '…';
  }

  function todayKey() {
    try {
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

  function isStaging() {
    try {
      if (typeof IS_STAGING_APP !== 'undefined' && IS_STAGING_APP) return true;
    } catch (e) {}
    return /\/test(?:\/|$)/.test(String(location.pathname || ''));
  }

  function feedJsonUrl() {
    var staging = isStaging();
    var v = encodeURIComponent(todayKey());
    return FEED_API_ORIGIN + '/api/feed?staging=' + (staging ? '1' : '0') + '&v=' + v;
  }

  function feedJsonFallbackUrl() {
    var base = isStaging() ? '/content/staging/focus-feed/feed-index.json' : '/content/focus-feed/feed-index.json';
    return base + '?v=' + encodeURIComponent(todayKey());
  }

  function feedBgApiUrl() {
    var v = encodeURIComponent(todayKey());
    return FEED_API_ORIGIN + '/api/feed-backgrounds?staging=' + (isStaging() ? '1' : '0') + '&v=' + v;
  }

  function feedBgFallbackUrl() {
    var base = isStaging() ? '/content/staging/feed-backgrounds/feed-backgrounds.json' : '/content/feed-backgrounds/feed-backgrounds.json';
    return base + '?v=' + encodeURIComponent(todayKey());
  }

  function sanitizeImageUrl(raw) {
    var u = String(raw || '').trim();
    if (!u) return '';
    if (/^(javascript|data|vbscript|blob):/i.test(u)) return '';
    if (u.startsWith('//')) return '';
    if (u.startsWith('/')) {
      if (ALLOWED_IMG_PREFIXES.some(function (p) { return u.indexOf(p) === 0; })) return u;
      if (/^\/assets\/feed-backgrounds\//.test(u)) return u;
      return '';
    }
    if (/^https:\/\/dar-al-tawhid\.de\//i.test(u)) {
      return u.replace(/^https:\/\/dar-al-tawhid\.de/i, '');
    }
    return '';
  }

  function isSelectableBg(bg) {
    if (!bg) return false;
    if (bg.status !== 'active' || !bg.approved) return false;
    if (bg.securityStatus && bg.securityStatus !== 'approved') return false;
    if (bg.isIslamicallySafe === false) return false;
    var src = String(bg.source || '').toLowerCase();
    if (src === 'wikimedia') return false;
    var allowed = bg.allowedFor || ['feed'];
    if (Array.isArray(allowed) && allowed.indexOf('feed') < 0) return false;
    if (!(bg.src || bg.srcMobile || bg.thumbnail)) return false;
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
    if (bg.hasWatermark || bg.hasLogo || bg.hasTextOverlay) return false;
    return true;
  }

  function bgCategoryForItem(item) {
    var hay = [item.tag, item.category, item.type, item.topic, item.title].join(' ').toLowerCase();
    if (/zakat|zakāt|gold|nisab/.test(hay)) return 'abstract';
    if (/dua|duʿ|duʿā/.test(hay)) return 'dua';
    if (/quran|qurʾ|sure|sura/.test(hay)) return 'quran';
    if (/moschee|mosque|jumu|gebet|prayer|salah/.test(hay)) return 'mosque';
    if (/buch|book|ilm|hadith|sunnah|wissen/.test(hay)) return 'books';
    if (/aqidah|tauhid|tawhid|glaube/.test(hay)) return 'tawhid';
    if (/adab|charakter|akhlaq/.test(hay)) return 'adab';
    if (/akhirah|jenseits|grab/.test(hay)) return 'akhirah';
    if (/natur|berg|himmel|meer|wüste/.test(hay)) return 'nature';
    return 'abstract';
  }

  function pickBgImageUrl(bg) {
    var mobile = false;
    try {
      mobile = window.matchMedia && window.matchMedia('(max-width:767px)').matches;
    } catch (e) {}
    var src = mobile ? (bg.srcMobile || bg.thumbnail || bg.src) : (bg.src || bg.srcMobile || bg.thumbnail);
    return sanitizeImageUrl(src);
  }

  function resolveCardVisual(item, backgrounds) {
    var mode = String(item.backgroundMode || item.bgType || 'auto').toLowerCase();
    if (item.imageSafe === false || item.backgroundSafe === false) mode = 'gradient';
    if (mode === 'gradient' || item.bgType === 'gradient') {
      return {
        image: '',
        gradientFrom: item.gradientFrom || '',
        gradientTo: item.gradientTo || ''
      };
    }
    var direct = sanitizeImageUrl(item.image || item.thumbnailUrl || item.imageUrl || item.thumbnail);
    if (direct && mode === 'url') {
      return { image: direct, gradientFrom: item.gradientFrom || '', gradientTo: item.gradientTo || '' };
    }
    if (mode === 'manual' && item.backgroundId) {
      var manualBg = (backgrounds || []).find(function (b) { return b && b.id === item.backgroundId; });
      if (isSelectableBg(manualBg)) {
        var manualImg = pickBgImageUrl(manualBg);
        if (manualImg) return { image: manualImg, gradientFrom: item.gradientFrom || '', gradientTo: item.gradientTo || '' };
      }
    }
    var pool = (backgrounds || []).filter(isSelectableBg);
    if (pool.length && (mode === 'auto' || mode === 'manual' || !direct)) {
      var cat = bgCategoryForItem(item);
      var matched = pool.filter(function (b) { return b.category === cat; });
      if (!matched.length) matched = pool.filter(function (b) { return b.category === 'abstract' || b.category === 'nature'; });
      if (!matched.length) matched = pool;
      var picked = hashPick(matched, todayKey() + '|' + (item.id || item.title || item.type || ''), 1)[0];
      if (picked) {
        var autoImg = pickBgImageUrl(picked);
        if (autoImg) return { image: autoImg, gradientFrom: item.gradientFrom || '', gradientTo: item.gradientTo || '' };
      }
    }
    if (direct) return { image: direct, gradientFrom: item.gradientFrom || '', gradientTo: item.gradientTo || '' };
    return { image: '', gradientFrom: item.gradientFrom || '', gradientTo: item.gradientTo || '' };
  }

  function enrichItemsVisuals(items, backgrounds) {
    return (items || []).map(function (item) {
      var vis = resolveCardVisual(item, backgrounds);
      return Object.assign({}, item, {
        image: vis.image || '',
        gradientFrom: vis.gradientFrom || item.gradientFrom || '',
        gradientTo: vis.gradientTo || item.gradientTo || ''
      });
    });
  }

  function fetchBackgrounds() {
    var primary = feedBgApiUrl();
    var fallback = feedBgFallbackUrl();
    return fetch(primary, { cache: 'no-store', mode: 'cors' })
      .then(function (r) {
        if (r.ok) return r.json();
        return fetch(fallback, { cache: 'no-store' }).then(function (r2) {
          if (!r2.ok) return { items: [] };
          return r2.json();
        });
      })
      .catch(function (err) {
        darDiag('background primary fetch failed, trying fallback', err);
        return fetch(fallback, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : { items: [] }; })
          .catch(function (fallbackErr) {
            darDiag('background fallback fetch failed', fallbackErr);
            return { items: [] };
          });
      })
      .then(function (data) { return (data && data.items) || []; });
  }

  function getCtx() {
    try {
      if (typeof darFocusFeedAppContext === 'function') return darFocusFeedAppContext();
    } catch (e) {}
    return {};
  }

  function comparePosts(a, b) {
    try {
      if (typeof comparePostsNewestFirst === 'function') return comparePostsNewestFirst(a, b);
    } catch (e) {}
    var da = (a && a.date) || '';
    var db = (b && b.date) || '';
    return db.localeCompare(da);
  }

  function stripMd(s) {
    try {
      if (typeof window.stripMd === 'function') return window.stripMd(s);
    } catch (e) {}
    return String(s || '').replace(/[#*_`~\[\]]/g, '').trim();
  }

  function postPreview(post) {
    if (!post) return '';
    if (post.excerpt) return stripMd(post.excerpt);
    if (post.content) return clampText(stripMd(post.content), 120);
    if (post.title) return clampText(post.title, 80);
    return '';
  }

  function postImage(post) {
    if (!post) return '';
    if (post.image) return post.image;
    if (post.cover) return post.cover;
    if (post.thumbnail) return post.thumbnail;
    return '';
  }

  function normalizeCategory(cat) {
    try {
      if (typeof normalizePostCategory === 'function') return normalizePostCategory(cat);
    } catch (e) {}
    return String(cat || '').trim() || 'Allgemein';
  }

  function hashPick(arr, seed, n) {
    if (!arr || !arr.length) return [];
    var copy = arr.slice();
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    for (var j = copy.length - 1; j > 0; j--) {
      h = ((h << 5) - h + j) | 0;
      var k = Math.abs(h) % (j + 1);
      var tmp = copy[j];
      copy[j] = copy[k];
      copy[k] = tmp;
    }
    return copy.slice(0, n);
  }

  function cardId(item) {
    return [item.type, item.target || '', item.title || ''].join('|');
  }

  function normalizeManual(raw) {
    if (!raw) return null;
    var type = String(raw.contentType || raw.type || 'manual').toLowerCase();
    if (type === 'manual') type = 'custom';
    var badges = [];
    if (raw.badgeNeu || raw.badge === 'neu') badges.push('neu');
    if (raw.badgeEmpfohlen || raw.badge === 'empfohlen') badges.push('empfohlen');
    if (raw.badgeWichtig || raw.badge === 'wichtig') badges.push('wichtig');
    (raw.badges || []).forEach(function (b) {
      if (b && badges.indexOf(String(b).toLowerCase()) < 0) badges.push(String(b).toLowerCase());
    });
    var targetType = String(raw.targetType || '').toLowerCase();
    var targetId = String(raw.targetId || '').trim();
    var targetUrl = String(raw.targetUrl || raw.target || raw.link || raw.href || '').trim();
    var target = targetUrl;
    if (!target && targetType && targetType !== 'none') {
      if (targetType === 'external') target = targetUrl;
      else if (targetType === 'post') target = 'post:' + targetId;
      else if (targetType === 'dua') target = 'dua:' + targetId;
      else if (targetType === 'quran') target = 'quran:' + targetId;
      else if (targetType === 'category') target = 'topic:' + targetId;
      else if (targetType === 'news') target = 'news-detail:' + targetId;
      else if (targetType === 'prayer') target = 'prayer';
      else target = targetType + (targetId ? ':' + targetId : '');
    }
    var image = sanitizeImageUrl(raw.thumbnailUrl || raw.imageUrl || raw.image || raw.backgroundImage || '');
    if (!image && raw.gradientFrom) {
      image = '';
    }
    return {
      id: raw.id || ('m-' + Math.random().toString(36).slice(2, 10)),
      type: type === 'series' ? 'series' : type,
      variant: raw.cardSize || raw.variant || (raw.premium ? 'premium' : 'medium'),
      title: raw.title || '',
      preview: raw.preview || raw.subtitle || raw.shortText || raw.text || '',
      tag: raw.category || raw.tag || raw.topic || '',
      category: raw.category || raw.tag || '',
      topic: raw.topic || '',
      scholar: raw.scholar || raw.theme || raw.book || '',
      date: raw.dateLabel || raw.date || '',
      hijriDate: raw.hijriDate || '',
      image: image,
      imageUrl: sanitizeImageUrl(raw.imageUrl || ''),
      thumbnailUrl: sanitizeImageUrl(raw.thumbnailUrl || raw.imageUrl || ''),
      gradientFrom: raw.gradientFrom || '',
      gradientTo: raw.gradientTo || '',
      backgroundMode: raw.backgroundMode || (raw.bgType === 'gradient' ? 'gradient' : 'auto'),
      backgroundId: raw.backgroundId || '',
      bgType: raw.bgType || '',
      imageSafe: raw.imageSafe !== false,
      backgroundSafe: raw.backgroundSafe !== false,
      target: target,
      badges: badges,
      sort: typeof raw.order === 'number' ? raw.order : (typeof raw.sort === 'number' ? raw.sort : 999),
      manual: true,
      pinned: !!raw.pinned,
      status: raw.status || 'live'
    };
  }

  function isVisibleManual(item) {
    if (!item) return false;
    if (item.status === 'deleted') return false;
    if (item.status && item.status !== 'live') return false;
    if (item.visible === false) return false;
    var now = Date.now();
    var startAt = item.startsAt || item.startAt;
    var endAt = item.expiresAt || item.endAt;
    if (startAt) {
      var s = Date.parse(startAt);
      if (!isNaN(s) && now < s) return false;
    }
    if (endAt) {
      var e = Date.parse(endAt);
      if (!isNaN(e) && now > e) return false;
    }
    var n = normalizeManual(item);
    if (n && !n.target) return false;
    return true;
  }

  function getCategoryList(ctx) {
    var layout = ctx.categoryLayout;
    var fromLayout = layout && layout.main && layout.main.length ? layout.main.slice()
      : (layout && layout.order && layout.order.length ? layout.order.slice() : []);
    var postCats = [];
    (ctx.posts || []).forEach(function (p) {
      var c = normalizeCategory(p && p.category);
      if (c && c !== 'Unbekannt' && postCats.indexOf(c) < 0) postCats.push(c);
    });
    var merged = fromLayout.concat(postCats.filter(function (c) { return fromLayout.indexOf(c) < 0; }));
    return merged.slice(0, 12);
  }

  function buildAutoCards(ctx) {
    var out = [];
    var seed = todayKey();
    var hijri = hijriLabel();
    var posts = (ctx.posts || []).slice().sort(comparePosts);
    var duas = ctx.duas || [];

    /* Premium: recommended / daily */
    try {
      if (typeof recommendedPost === 'function') {
        var rec = recommendedPost();
        if (rec) {
          out.push({
            id: 'auto-rec-' + rec.id,
            type: 'post',
            variant: 'premium',
            title: rec.title || 'Empfohlen',
            preview: postPreview(rec),
            tag: normalizeCategory(rec.category),
            scholar: rec.author || rec.scholar || '',
            date: rec.date || '',
            image: sanitizeImageUrl(postImage(rec)),
            backgroundMode: 'auto',
            target: 'post:' + rec.id,
            badges: ['empfohlen', 'heute'],
            sort: 10
          });
        }
      }
    } catch (e) {}

    /* Daily duʿāʾ */
    try {
      if (typeof dailyDua === 'function') {
        var dd = dailyDua();
        if (dd) {
          out.push({
            id: 'auto-dua-' + (dd.id || seed),
            type: 'dua',
            variant: 'premium',
            title: dd.title || 'Duʿāʾ des Tages',
            preview: clampText(dd.text || dd.arabic || '', 100),
            tag: 'Duʿāʾ',
            date: hijri || seed,
            image: sanitizeImageUrl(dd.image || ''),
            backgroundMode: 'auto',
            target: 'dua:' + (dd.id || ''),
            badges: ['heute'],
            sort: 20
          });
        }
      }
    } catch (e) {}

    /* News / current updates */
    try {
      if (typeof activeCurrentUpdates === 'function') {
        var news = activeCurrentUpdates();
        if (news && news.length) {
          news.slice(0, 2).forEach(function (n, i) {
            out.push({
              id: 'auto-news-' + (n.id || i),
              type: 'news',
              variant: i === 0 ? 'premium' : 'medium',
              title: n.title || 'Neu im Fokus',
              preview: clampText(n.text || n.body || '', 90),
              tag: 'News',
              date: n.date || '',
              image: sanitizeImageUrl(n.image || ''),
              backgroundMode: 'auto',
              target: n.link || n.href || ('news-detail:' + (n.id || i)),
              badges: ['neu'],
              sort: 30 + i
            });
          });
        }
      }
    } catch (e) {}

    /* Jumuʿah hint on Friday */
    try {
      var wd = new Date().getDay();
      if (wd === 5) {
        out.push({
          id: 'auto-jumuah',
          type: 'prayer',
          variant: 'medium',
          title: 'Jumuʿah',
          preview: 'Gebetszeiten und Hinweise für heute',
          tag: 'Jumuʿah',
          date: hijri || seed,
          target: 'prayer',
          backgroundMode: 'auto',
          badges: ['heute', 'empfohlen'],
          sort: 25
        });
      } else {
        out.push({
          id: 'auto-prayer',
          type: 'prayer',
          variant: 'mini',
          title: 'Gebetszeiten',
          preview: 'Zeiten für heute',
          tag: 'Gebetszeiten',
          target: 'prayer',
          backgroundMode: 'auto',
          badges: ['heute'],
          sort: 90
        });
      }
    } catch (e) {}

    /* Qurʾān */
    try {
      var qm = ctx.quranMeta || {};
      if (qm.popular && qm.popular.length) {
        hashPick(qm.popular, seed + 'q', 2).forEach(function (q, i) {
          out.push({
            id: 'auto-quran-' + (q.surah || i),
            type: 'quran',
            variant: 'medium',
            title: q.title || ('Sura ' + (q.surah || '')),
            preview: clampText(q.note || q.ayah || '', 80),
            tag: 'Qurʾān',
            target: 'quran:' + (q.surah || '') + (q.ayah ? ':' + q.ayah : ''),
            backgroundMode: 'auto',
            badges: ['empfohlen'],
            sort: 40 + i
          });
        });
      }
    } catch (e) {}

    /* Categories */
    var cats = getCategoryList(ctx);
    if (cats.length) {
      hashPick(cats, seed + 'cat', 3).forEach(function (catName, i) {
        out.push({
          id: 'auto-cat-' + i + '-' + catName.slice(0, 12),
          type: 'category',
          variant: 'mini',
          title: catName,
          preview: 'Ordner öffnen',
          tag: catName,
          target: 'topic:' + catName,
          backgroundMode: 'auto',
          badges: [],
          sort: 50 + i
        });
      });
    }

    /* Newest posts */
    hashPick(posts.filter(function (p) { return p && p.id; }), seed + 'p', 6).forEach(function (p, i) {
      out.push({
        id: 'auto-post-' + p.id,
        type: 'post',
        variant: i < 2 ? 'medium' : 'mini',
        title: p.title || 'Beitrag',
        preview: postPreview(p),
        tag: normalizeCategory(p.category),
        scholar: p.author || '',
        date: p.date || '',
        image: sanitizeImageUrl(postImage(p)),
        backgroundMode: 'auto',
        target: 'post:' + p.id,
        badges: i === 0 ? ['neu'] : [],
        sort: 60 + i
      });
    });

    /* Extra duʿāʾ */
    if (duas.length) {
      hashPick(duas, seed + 'd', 2).forEach(function (d, i) {
        if (!d) return;
        out.push({
          id: 'auto-dua2-' + (d.id || i),
          type: 'dua',
          variant: 'mini',
          title: d.title || 'Duʿāʾ',
          preview: clampText(d.text || '', 70),
          tag: 'Duʿāʾ',
          target: 'dua:' + (d.id || i),
          badges: [],
          sort: 70 + i
        });
      });
    }

    return out.slice(0, MAX_AUTO);
  }

  function mergeItems(manual, auto) {
    var map = {};
    var merged = [];

    manual.forEach(function (m) {
      if (!isVisibleManual(m)) return;
      var n = normalizeManual(m);
      if (!n || !n.title) return;
      if (n.pinned) n.sort = (n.sort || 999) - 1000;
      map[cardId(n)] = true;
      merged.push(n);
    });

    auto.forEach(function (a) {
      if (map[cardId(a)]) return;
      merged.push(a);
    });

    merged.sort(function (a, b) {
      var sa = typeof a.sort === 'number' ? a.sort : 500;
      var sb = typeof b.sort === 'number' ? b.sort : 500;
      if (sa !== sb) return sa - sb;
      return String(b.date || '').localeCompare(String(a.date || ''));
    });

    return merged.slice(0, MAX_TOTAL);
  }

  function fetchManual() {
    var primary = feedJsonUrl();
    var fallback = feedJsonFallbackUrl();
    return fetch(primary, { cache: 'no-store', mode: 'cors' })
      .then(function (r) {
        if (r.ok) return r.json();
        return fetch(fallback, { cache: 'no-store' }).then(function (r2) {
          if (!r2.ok) return { items: [] };
          return r2.json();
        });
      })
      .catch(function (err) {
        darDiag('manual feed primary fetch failed, trying fallback', err);
        return fetch(fallback, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : { items: [] }; })
          .catch(function (fallbackErr) {
            darDiag('manual feed fallback fetch failed', fallbackErr);
            return { items: [] };
          });
      });
  }

  function badgeHtml(badges, tag, hijri, date) {
    var chips = [];
    if (tag) chips.push('<span class="ff-chip ff-chip--tag">' + esc(tag) + '</span>');
    (badges || []).forEach(function (b) {
      var cls = 'ff-chip';
      if (b === 'neu') cls += ' ff-chip--new';
      if (b === 'empfohlen') cls += ' ff-chip--rec';
      if (b === 'wichtig') cls += ' ff-chip--imp';
      if (b === 'heute') cls += ' ff-chip--today';
      chips.push('<span class="' + cls + '">' + esc(b) + '</span>');
    });
    if (hijri) chips.push('<span class="ff-chip ff-chip--date">' + esc(hijri) + '</span>');
    else if (date) chips.push('<span class="ff-chip ff-chip--date">' + esc(date) + '</span>');
    if (!chips.length) return '';
    return '<div class="ff-badges">' + chips.join('') + '</div>';
  }

  function typeIcon(type) {
    var icons = {
      post: '📄',
      dua: '🤲',
      quran: '📖',
      news: '✨',
      prayer: '🕌',
      category: '📁',
      series: '📚',
      custom: '★'
    };
    return icons[type] || '•';
  }

  function cardHtml(item, hijri) {
    var v = item.variant || 'medium';
    if (item.manual && item.variant === 'premium') v = 'premium';
    var dims = CARD[v] || CARD.medium;
    var cardHijri = item.hijriDate || (v === 'premium' ? hijri : '');
    var cardDate = item.date || '';
    var bgStyle = '';
    var imgHtml = '';
    var imgSrc = sanitizeImageUrl(item.image || '');
    if (imgSrc) {
      imgHtml = '<img class="ff-card__img" src="' + esc(imgSrc) + '" alt="" loading="lazy" decoding="async" draggable="false" onerror="this.style.display=\'none\'">';
    } else if (item.gradientFrom && item.gradientTo) {
      bgStyle = 'background:linear-gradient(145deg,' + esc(item.gradientFrom) + ',' + esc(item.gradientTo) + ');';
    } else {
      var hues = { post: '210', dua: '158', quran: '172', news: '265', prayer: '38', category: '200' };
      var hue = hues[item.type] || '200';
      bgStyle = 'background:linear-gradient(145deg,hsla(' + hue + ',32%,22%,0.95),hsla(' + hue + ',24%,12%,0.98));';
    }

    var cta = item.type === 'post' ? 'Öffnen' : item.type === 'dua' ? 'Duʿāʾ' : item.type === 'quran' ? 'Öffnen' : 'Ansehen';
    var scholar = item.scholar ? '<span class="ff-scholar">' + esc(item.scholar) + '</span>' : '';
    var preview = item.preview ? '<p class="ff-preview">' + esc(item.preview) + '</p>' : '';

    return (
      '<article class="ff-card ff-card--' + v + '" role="button" tabindex="0" data-target="' + esc(item.target || '') + '" data-type="' + esc(item.type) + '" style="width:' + dims.w + ';min-height:' + dims.h + '">' +
        '<div class="ff-card__bg"' + (bgStyle ? ' style="' + bgStyle + '"' : '') + '>' + imgHtml + '</div>' +
        '<div class="ff-card__glass"></div>' +
        '<div class="ff-card__body">' +
          badgeHtml(item.badges, item.tag, cardHijri, cardDate) +
          '<div class="ff-card__main">' +
            '<span class="ff-type-icon" aria-hidden="true">' + typeIcon(item.type) + '</span>' +
            '<h3 class="ff-title">' + esc(item.title) + '</h3>' +
            (v !== 'mini' ? preview : '') +
            scholar +
          '</div>' +
          (v === 'premium' ? '<span class="ff-cta">' + esc(cta) + ' →</span>' : '') +
        '</div>' +
      '</article>'
    );
  }

  function injectStyles() {
    if (document.getElementById('focusFeedStyles')) return;
    var css =
      '#focusFeedMount{margin:0 0 1.15rem;padding:0;position:relative;z-index:1}' +
      '.ff-section{--ff-border:rgba(239,215,142,.30);--ff-glass-top:rgba(8,12,18,.12);--ff-glass-mid:rgba(8,12,18,.52);--ff-glass-bot:rgba(8,12,18,.90);--ff-chip-bg:rgba(255,255,255,.11);--ff-chip-border:rgba(255,255,255,.16);--ff-cta-bg:rgba(255,255,255,.12);--ff-title:var(--premium-title,#fff7dc);--ff-sub:var(--premium-body,#d9cfb0);padding:0 0 0.5rem}' +
      'html[data-theme="light"] .ff-section,html[data-theme="soft"] .ff-section{--ff-border:rgba(155,122,60,.34);--ff-glass-top:rgba(255,252,245,.08);--ff-glass-mid:rgba(255,252,245,.42);--ff-glass-bot:rgba(24,18,10,.78);--ff-chip-bg:rgba(255,255,255,.55);--ff-chip-border:rgba(120,90,40,.22);--ff-cta-bg:rgba(255,255,255,.62);--ff-title:#3e2b17;--ff-sub:#5a4630}' +
      'html[data-theme="royal"] .ff-section{--ff-border:rgba(239,215,142,.36);--ff-glass-bot:rgba(4,12,28,.92)}' +
      'html[data-theme="bordeaux"] .ff-section{--ff-border:rgba(214,190,132,.38);--ff-glass-bot:rgba(20,11,12,.92);--ff-title:#F7EED8}' +
      '.ff-head{display:flex;align-items:flex-end;justify-content:space-between;gap:0.75rem;margin:0 0 0.75rem;padding:0 0.25rem}' +
      '.ff-head h2{margin:0;font-size:1.06rem;font-weight:600;letter-spacing:0.03em;color:var(--ff-title);font-family:var(--serif,Cinzel,serif)}' +
      '.ff-sub{margin:0.15rem 0 0;font-size:0.72rem;color:var(--ff-sub);opacity:0.88}' +
      '.ff-filters{display:flex;gap:0.35rem;flex-wrap:wrap;justify-content:flex-end;max-width:52%}' +
      '.ff-filter{border:1px solid var(--ff-chip-border);background:var(--ff-chip-bg);color:inherit;border-radius:999px;padding:0.25rem 0.55rem;font-size:0.66rem;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}' +
      '.ff-filter.is-active{border-color:var(--ff-border);box-shadow:0 0 0 1px rgba(239,215,142,.14)}' +
      '.ff-scroller{display:flex;gap:0.7rem;overflow-x:auto;overflow-y:hidden;padding:0.12rem 3.4rem 0.62rem 0.5rem;margin:0 -0.5rem;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain;touch-action:pan-x pan-y}' +
      '.ff-scroller::-webkit-scrollbar{display:none}' +
      '.ff-card{flex:0 0 auto;scroll-snap-align:start;scroll-snap-stop:always;position:relative;border-radius:18px;overflow:hidden;cursor:pointer;border:1px solid var(--ff-border);box-shadow:0 10px 30px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.06);transition:transform .18s ease,box-shadow .18s ease;will-change:transform}' +
      '.ff-card:active{transform:scale(0.985)}' +
      '.ff-card__bg{position:absolute;inset:0;background-size:cover;background-position:center}' +
      '.ff-card__img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.9) contrast(1.02)}' +
      '.ff-card__glass{position:absolute;inset:0;background:linear-gradient(180deg,var(--ff-glass-top) 0%,var(--ff-glass-mid) 52%,var(--ff-glass-bot) 100%)}' +
      '.ff-card__body{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.72rem 0.82rem;box-sizing:border-box;color:var(--ff-title)}' +
      '.ff-badges{display:flex;flex-wrap:wrap;gap:0.28rem;margin-bottom:0.32rem}' +
      '.ff-chip{font-size:0.6rem;padding:0.14rem 0.42rem;border-radius:999px;background:var(--ff-chip-bg);border:1px solid var(--ff-chip-border);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);text-transform:lowercase;letter-spacing:0.03em;line-height:1.2}' +
      '.ff-chip--tag{text-transform:none;font-weight:600}' +
      '.ff-chip--new{border-color:rgba(120,200,160,.35)}' +
      '.ff-chip--rec{border-color:rgba(200,180,120,.42)}' +
      '.ff-chip--imp{border-color:rgba(220,140,120,.4)}' +
      '.ff-chip--today{border-color:rgba(140,180,220,.35)}' +
      '.ff-chip--date{text-transform:none;opacity:.92}' +
      '.ff-card__main{flex:1;display:flex;flex-direction:column;gap:0.22rem;min-height:0}' +
      '.ff-type-icon{font-size:0.82rem;opacity:0.88}' +
      '.ff-title{margin:0;font-size:0.94rem;line-height:1.24;font-weight:650;color:var(--ff-title);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 12px rgba(0,0,0,.28)}' +
      '.ff-card--premium .ff-title{font-size:1.12rem;-webkit-line-clamp:3}' +
      '.ff-card--mini .ff-title{font-size:0.8rem;-webkit-line-clamp:2}' +
      '.ff-preview{margin:0;font-size:0.71rem;line-height:1.34;color:var(--ff-sub);opacity:0.92;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.ff-card--premium .ff-preview{-webkit-line-clamp:3;font-size:0.76rem}' +
      '.ff-scholar{font-size:0.64rem;color:var(--ff-sub);opacity:0.82;margin-top:auto}' +
      '.ff-cta{font-size:0.7rem;font-weight:650;align-self:flex-start;margin-top:0.45rem;padding:0.34rem 0.62rem;border-radius:999px;background:var(--ff-cta-bg);border:1px solid var(--ff-border)}' +
      '.ff-more-wrap{display:flex;justify-content:center;margin-top:0.3rem}' +
      '.ff-more{border:1px solid var(--ff-chip-border);background:transparent;color:inherit;border-radius:999px;padding:0.38rem 0.95rem;font-size:0.72rem;cursor:pointer}' +
      '@media (min-width:768px){.ff-scroller{padding-right:1rem;margin:0}.ff-card--premium{min-width:320px}.ff-card--medium{min-width:240px}}' +
      '@media (min-width:1024px){.ff-scroller{gap:0.85rem}.ff-card--premium{min-width:340px}}';

    var el = document.createElement('style');
    el.id = 'focusFeedStyles';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function saveHomeScrollAnchor() {
    try {
      if (typeof saveNavScroll === 'function') {
        saveNavScroll({ view: 'home', value: '' }, window.scrollY);
      }
      var mount = document.getElementById(MOUNT_ID);
      if (mount) {
        var y = Math.max(0, mount.getBoundingClientRect().top + (window.scrollY || 0) - 8);
        sessionStorage.setItem(ANCHOR_KEY, String(Math.round(y)));
        sessionStorage.setItem(RETURN_KEY, '1');
      }
    } catch (e) {}
  }

  function restoreHomeAnchor() {
    try {
      if (sessionStorage.getItem(RETURN_KEY) !== '1') return;
      sessionStorage.removeItem(RETURN_KEY);
      var y = parseInt(sessionStorage.getItem(ANCHOR_KEY) || '0', 10);
      if (y > 0) {
        if (global.DARScrollManager && global.DARScrollManager.stableScrollTo) {
          global.DARScrollManager.stableScrollTo(y, { force: true });
        } else {
          window.scrollTo({ top: y, behavior: 'auto' });
        }
      }
    } catch (e) {}
  }

  function saveScroll() {
    var sc = document.querySelector('.ff-scroller');
    if (!sc) return;
    state.scrollLeft = sc.scrollLeft;
    try {
      sessionStorage.setItem(SCROLL_KEY, String(sc.scrollLeft));
    } catch (e) {}
  }

  function restoreScroll() {
    var sc = document.querySelector('.ff-scroller');
    if (!sc) return;
    var saved = state.scrollLeft;
    try {
      var stored = parseInt(sessionStorage.getItem(SCROLL_KEY) || '0', 10);
      if (stored > 0) saved = stored;
    } catch (e) {}
    if (saved > 0) sc.scrollLeft = saved;
  }

  function navigateTo(item) {
    if (!item) return;
    if (!item.target) return;
    saveScroll();
    saveHomeScrollAnchor();
    var t = String(item.target || '');
    var type = item.type;

    try {
      if (typeof navigate !== 'function') return;

      if (t.indexOf('http') === 0) {
        window.location.href = t;
        return;
      }

      if (t.indexOf('post:') === 0) {
        navigate('post', t.slice(5));
        return;
      }
      if (t.indexOf('dua:') === 0) {
        navigate('dua', t.slice(4));
        return;
      }
      if (t.indexOf('quran:') === 0) {
        var qparts = t.slice(6).split(':');
        if (typeof openQuranSurah === 'function') {
          openQuranSurah(qparts[0], qparts[1]);
        } else {
          var qval = qparts[1] ? qparts[0] + '/' + qparts[1] : qparts[0];
          navigate('quran-surah', qval);
        }
        return;
      }
      if (t.indexOf('topic:') === 0 || t.indexOf('category:') === 0) {
        navigate('topic', t.split(':').slice(1).join(':'));
        return;
      }
      if (t.indexOf('news-detail:') === 0) {
        navigate('news-detail', t.slice(12));
        return;
      }
      if (t === 'zakat' || type === 'zakat') {
        navigate('zakat');
        return;
      }
      if (t === 'prayer' || type === 'prayer') {
        navigate('prayer');
        return;
      }
      if (t === 'news' || type === 'news') {
        navigate('recent');
        return;
      }
      if (t === 'recent' || t === 'posts') {
        navigate('recent');
        return;
      }
      if (type === 'post' && t) {
        navigate('post', t);
        return;
      }
      if (type === 'dua' && t) {
        navigate('dua', t);
        return;
      }
      if (type === 'quran' && t) {
        if (typeof openQuranSurah === 'function') openQuranSurah(t);
        else navigate('quran-surah', t);
        return;
      }
      if (t) navigate(t);
    } catch (e) {
      console.warn('[focus-feed] navigate', e);
    }
  }

  function bindCards(root) {
    root.querySelectorAll('.ff-card').forEach(function (card) {
      function open() {
        navigateTo({
          type: card.getAttribute('data-type'),
          target: card.getAttribute('data-target')
        });
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          open();
        }
      });
    });

    var sc = root.querySelector('.ff-scroller');
    if (sc) {
      sc.addEventListener('scroll', function () {
        state.scrollLeft = sc.scrollLeft;
      }, { passive: true });
    }

    root.querySelectorAll('.ff-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-filter') || 'all';
        render(root.closest('#' + MOUNT_ID) || document.getElementById(MOUNT_ID));
      });
    });

    var more = root.querySelector('.ff-more');
    if (more) {
      more.addEventListener('click', function () {
        try {
          if (typeof navigate === 'function') navigate('recent');
        } catch (e) {}
      });
    }
  }

  function filteredItems() {
    if (state.filter === 'all') return state.items;
    var map = { posts: 'post', duas: 'dua', quran: 'quran' };
    var want = map[state.filter] || state.filter;
    return state.items.filter(function (it) {
      return it.type === want;
    });
  }

  function render(mount) {
    if (!mount) return;
    injectStyles();
    var items = filteredItems();
    var hijri = hijriLabel();

    if (!items.length) {
      mount.innerHTML = '';
      mount.hidden = true;
      return;
    }
    mount.hidden = false;

    var cards = items.map(function (it) {
      return cardHtml(it, hijri);
    }).join('');

    mount.innerHTML =
      '<section class="ff-section" aria-label="Im Fokus">' +
        '<div class="ff-head">' +
          '<div><h2>Im Fokus</h2><p class="ff-sub">Neue Inhalte · Empfehlungen · Heute</p></div>' +
          '<div class="ff-filters">' +
            '<button type="button" class="ff-filter' + (state.filter === 'all' ? ' is-active' : '') + '" data-filter="all">Alle</button>' +
            '<button type="button" class="ff-filter' + (state.filter === 'posts' ? ' is-active' : '') + '" data-filter="posts">Beiträge</button>' +
            '<button type="button" class="ff-filter' + (state.filter === 'duas' ? ' is-active' : '') + '" data-filter="duas">Duʿāʾ</button>' +
            '<button type="button" class="ff-filter' + (state.filter === 'quran' ? ' is-active' : '') + '" data-filter="quran">Qurʾān</button>' +
          '</div>' +
        '</div>' +
        '<div class="ff-scroller">' + cards + '</div>' +
        '<div class="ff-more-wrap"><button type="button" class="ff-more">Alle Inhalte</button></div>' +
      '</section>';

    bindCards(mount);
    requestAnimationFrame(function () {
      restoreScroll();
      restoreHomeAnchor();
    });
  }

  function loadAndRender(force) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    if (state.loading && !force) return;
    state.loading = true;

    var ctx = getCtx();
    Promise.all([fetchManual(), fetchBackgrounds()])
      .then(function (results) {
        var data = results[0];
        var backgrounds = results[1] || [];
        state.backgrounds = backgrounds;
        var manual = (data && data.items) || [];
        var auto = buildAutoCards(ctx);
        state.items = enrichItemsVisuals(mergeItems(manual, auto), backgrounds);
        state.loading = false;
        render(mount);
      })
      .catch(function (err) {
        console.error('[dar-focus-feed] load/render pipeline failed', err);
        state.loading = false;
        render(mount);
      });
  }

  window.DAR_FOCUS_FEED = {
    refresh: function (opts) {
      loadAndRender(opts && opts.force);
    },
    onAppReady: function (opts) {
      loadAndRender(opts && opts.force);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadAndRender(false);
    });
  } else {
    loadAndRender(false);
  }
})();
