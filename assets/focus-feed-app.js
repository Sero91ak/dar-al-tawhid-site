/**
 * DAR AL TAWḤID — Im Fokus / Feed-Slider (Besucher-App)
 * Horizontal snap-scroll cards: posts, duʿāʾ, Qurʾān, news, prayer, categories.
 */
(function () {
  'use strict';

  var MOUNT_ID = 'focusFeedMount';
  var SCROLL_KEY = 'darFocusFeedScrollV1';
  var MAX_AUTO = 14;
  var MAX_TOTAL = 24;

  var CARD = {
    premium: { w: 'min(88vw, 340px)', h: 'min(58vw, 220px)' },
    medium: { w: 'min(72vw, 280px)', h: 'min(44vw, 168px)' },
    mini: { w: 'min(52vw, 200px)', h: 'min(36vw, 120px)' }
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
    if (typeof location !== 'undefined') {
      var api = '/api/feed?staging=' + (staging ? '1' : '0') + '&v=' + encodeURIComponent(todayKey());
      return api;
    }
    var base = staging ? '/content/staging/focus-feed/feed-index.json' : '/content/focus-feed/feed-index.json';
    return base + '?v=' + encodeURIComponent(todayKey());
  }

  function feedJsonFallbackUrl() {
    var base = isStaging() ? '/content/staging/focus-feed/feed-index.json' : '/content/focus-feed/feed-index.json';
    return base + '?v=' + encodeURIComponent(todayKey());
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
    var image = String(raw.thumbnailUrl || raw.imageUrl || raw.image || raw.backgroundImage || '').trim();
    if (!image && raw.gradientFrom) {
      image = '';
    }
    return {
      id: raw.id || ('m-' + Math.random().toString(36).slice(2, 10)),
      type: type === 'series' ? 'series' : type,
      variant: raw.cardSize || raw.variant || (raw.premium ? 'premium' : 'medium'),
      title: raw.title || '',
      preview: raw.preview || raw.subtitle || raw.shortText || raw.text || '',
      tag: raw.category || raw.tag || '',
      scholar: raw.scholar || raw.theme || raw.book || '',
      date: raw.dateLabel || raw.date || '',
      image: image,
      gradientFrom: raw.gradientFrom || '',
      gradientTo: raw.gradientTo || '',
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
            image: postImage(rec),
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
            image: dd.image || '',
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
              image: n.image || '',
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
        image: postImage(p),
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
    return fetch(primary, { cache: 'no-store' })
      .then(function (r) {
        if (r.ok) return r.json();
        return fetch(fallback, { cache: 'no-store' }).then(function (r2) {
          if (!r2.ok) return { items: [] };
          return r2.json();
        });
      })
      .catch(function () {
        return fetch(fallback, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : { items: [] }; })
          .catch(function () { return { items: [] }; });
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
    var bgStyle = '';
    if (item.image) {
      bgStyle = 'background-image:url(' + esc(item.image) + ');';
    } else if (item.gradientFrom && item.gradientTo) {
      bgStyle = 'background:linear-gradient(145deg,' + esc(item.gradientFrom) + ',' + esc(item.gradientTo) + ');';
    } else {
      var hues = { post: '210', dua: '158', quran: '172', news: '265', prayer: '38', category: '200' };
      var hue = hues[item.type] || '200';
      bgStyle = 'background:linear-gradient(145deg,hsla(' + hue + ',32%,22%,0.95),hsla(' + hue + ',24%,12%,0.98));';
    }

    var cta = item.type === 'post' ? 'Lesen' : item.type === 'dua' ? 'Duʿāʾ' : item.type === 'quran' ? 'Öffnen' : 'Ansehen';
    var scholar = item.scholar ? '<span class="ff-scholar">' + esc(item.scholar) + '</span>' : '';
    var preview = item.preview ? '<p class="ff-preview">' + esc(item.preview) + '</p>' : '';

    return (
      '<article class="ff-card ff-card--' + v + '" role="button" tabindex="0" data-target="' + esc(item.target || '') + '" data-type="' + esc(item.type) + '" style="width:' + dims.w + ';min-height:' + dims.h + '">' +
        '<div class="ff-card__bg" style="' + bgStyle + '"></div>' +
        '<div class="ff-card__glass"></div>' +
        '<div class="ff-card__body">' +
          badgeHtml(item.badges, item.tag, v === 'premium' ? hijri : '', v !== 'premium' ? item.date : '') +
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
      '#focusFeedMount{margin:0 0 1.25rem;padding:0}' +
      '.ff-section{padding:0 0 0.5rem}' +
      '.ff-head{display:flex;align-items:flex-end;justify-content:space-between;gap:0.75rem;margin:0 0 0.85rem;padding:0 0.25rem}' +
      '.ff-head h2{margin:0;font-size:1.05rem;font-weight:600;letter-spacing:0.02em;color:var(--text,#eae6df)}' +
      '.ff-sub{margin:0.15rem 0 0;font-size:0.72rem;opacity:0.65}' +
      '.ff-filters{display:flex;gap:0.35rem;flex-wrap:wrap;justify-content:flex-end}' +
      '.ff-filter{border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:inherit;border-radius:999px;padding:0.25rem 0.55rem;font-size:0.68rem;cursor:pointer;backdrop-filter:blur(8px)}' +
      '.ff-filter.is-active{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.22)}' +
      '.ff-scroller{display:flex;gap:0.75rem;overflow-x:auto;overflow-y:hidden;padding:0.15rem 0.5rem 0.65rem;margin:0 -0.5rem;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain}' +
      '.ff-scroller::-webkit-scrollbar{display:none}' +
      '.ff-card{flex:0 0 auto;scroll-snap-align:start;position:relative;border-radius:16px;overflow:hidden;cursor:pointer;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 28px rgba(0,0,0,0.22);transition:transform 0.22s ease,box-shadow 0.22s ease}' +
      '.ff-card:active{transform:scale(0.98)}' +
      '.ff-card__bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(0.92)}' +
      '.ff-card__glass{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,18,0.15) 0%,rgba(8,12,18,0.55) 55%,rgba(8,12,18,0.88) 100%)}' +
      '.ff-card__body{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.75rem 0.85rem;box-sizing:border-box}' +
      '.ff-badges{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.35rem}' +
      '.ff-chip{font-size:0.62rem;padding:0.15rem 0.45rem;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.14);backdrop-filter:blur(6px);text-transform:lowercase;letter-spacing:0.03em}' +
      '.ff-chip--tag{text-transform:none;font-weight:500}' +
      '.ff-chip--new{border-color:rgba(120,200,160,0.35)}' +
      '.ff-chip--rec{border-color:rgba(200,180,120,0.35)}' +
      '.ff-chip--imp{border-color:rgba(220,140,120,0.4)}' +
      '.ff-chip--today{border-color:rgba(140,180,220,0.35)}' +
      '.ff-card__main{flex:1;display:flex;flex-direction:column;gap:0.25rem;min-height:0}' +
      '.ff-type-icon{font-size:0.85rem;opacity:0.85}' +
      '.ff-title{margin:0;font-size:0.95rem;line-height:1.25;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.ff-card--premium .ff-title{font-size:1.15rem;-webkit-line-clamp:3}' +
      '.ff-card--mini .ff-title{font-size:0.82rem;-webkit-line-clamp:2}' +
      '.ff-preview{margin:0;font-size:0.72rem;line-height:1.35;opacity:0.88;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.ff-card--premium .ff-preview{-webkit-line-clamp:3;font-size:0.78rem}' +
      '.ff-scholar{font-size:0.65rem;opacity:0.75;margin-top:auto}' +
      '.ff-cta{font-size:0.72rem;font-weight:600;align-self:flex-start;margin-top:0.5rem;padding:0.35rem 0.65rem;border-radius:999px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18)}' +
      '.ff-empty{padding:1rem;text-align:center;opacity:0.6;font-size:0.85rem}' +
      '.ff-more-wrap{display:flex;justify-content:center;margin-top:0.35rem}' +
      '.ff-more{border:1px solid rgba(255,255,255,0.14);background:transparent;color:inherit;border-radius:999px;padding:0.4rem 1rem;font-size:0.75rem;cursor:pointer}' +
      '@media (min-width:768px){.ff-scroller{padding-left:0;padding-right:0;margin:0}.ff-card--premium{min-width:320px}}';

    var el = document.createElement('style');
    el.id = 'focusFeedStyles';
    el.textContent = css;
    document.head.appendChild(el);
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
    saveScroll();
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
    requestAnimationFrame(restoreScroll);
  }

  function loadAndRender(force) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    if (state.loading && !force) return;
    state.loading = true;

    var ctx = getCtx();
    fetchManual().then(function (data) {
      var manual = (data && data.items) || [];
      var auto = buildAutoCards(ctx);
      state.items = mergeItems(manual, auto);
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
