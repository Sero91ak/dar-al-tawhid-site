/**
 * DAR AL TAWḤID — Premium-Feed (vertikal, Tab „Feed“)
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darPremiumFeedStylesV2';
  var SEEN_KEY = 'darPremiumFeedSeenV1';
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

  function authorLabel(item) {
    if (!item) return 'DAR AL TAWḤID';
    if (item.scholar) return item.scholar;
    if (item.type === 'dua') return 'Duʿāʾ-Sammlung';
    if (item.type === 'quran') return 'Qurʾān';
    if (item.type === 'news') return 'Neu im Fokus';
    if (item.type === 'prayer') return 'Gebetszeiten';
    if (item.category) return item.category;
    return 'DAR AL TAWḤID';
  }

  function avatarLetter(item) {
    var label = authorLabel(item);
    var m = label.match(/[\p{L}\p{N}]/u);
    return m ? m[0].toUpperCase() : 'D';
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
    if (post.statement) return clamp(stripMd(post.statement), 320);
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
      if (typeof global.stripMd === 'function') return global.stripMd(s);
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
            preview: clamp(dd.de || dd.tr || dd.ar || '', 140),
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
        preview: clamp(d.de || d.tr || d.ar || '', 120),
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

    var wd = new Date().getDay();
    if (wd === 5) {
      pools.hint.push({
        uid: 'jumuah',
        type: 'prayer',
        cardType: 'md',
        title: 'Jumuʿah',
        preview: 'Gebetszeiten und Hinweise für heute — rechtzeitig vorbereiten.',
        category: 'Jumuʿah',
        hijriDate: hijri,
        badges: ['Heute', 'Jumuʿah'],
        target: 'prayer',
        sort: 25
      });
    } else {
      pools.hint.push({
        uid: 'prayer-hint',
        type: 'prayer',
        cardType: 'sm',
        title: 'Gebetszeiten',
        preview: 'Zeiten für heute und Erinnerungen.',
        category: 'Gebetszeiten',
        badges: ['Heute'],
        target: 'prayer',
        sort: 260
      });
    }

    var layout = ctx.categoryLayout;
    var cats = layout && layout.main && layout.main.length ? layout.main.slice() : [];
    if (!cats.length && posts.length) {
      posts.forEach(function (p) {
        var c = normCat(p.category);
        if (c && cats.indexOf(c) < 0) cats.push(c);
      });
    }
    seededPick(cats, seed + 'cat', 6).forEach(function (cat, i) {
      pools.category.push({
        uid: 'cat-' + i + '-' + cat.slice(0, 16),
        type: 'category',
        cardType: 'sm',
        title: cat,
        preview: 'Thema entdecken — Beiträge in diesem Ordner.',
        category: cat,
        badges: [cat],
        target: 'topic:' + cat,
        sort: 280 + i
      });
    });

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
      .concat(pools.news)
      .concat(pools.dua.slice(0, 2))
      .concat(pools.quran.slice(0, 2))
      .concat(pools.hint)
      .concat(pools.archive)
      .concat(pools.dua.slice(2))
      .concat(pools.quran.slice(2))
      .concat(pools.category);

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
    var f = state.filter;
    if (f === 'all') return items;
    if (f === 'posts') return items.filter(function (it) { return it.type === 'post' || it.type === 'archive'; });
    if (f === 'duas') return items.filter(function (it) { return it.type === 'dua'; });
    if (f === 'quran') return items.filter(function (it) { return it.type === 'quran'; });
    if (f === 'news') return items.filter(function (it) { return it.type === 'news'; });
    if (f === 'recommended') return items.filter(function (it) {
      return (it.badges || []).indexOf('Empfohlen') >= 0 || (it.badges || []).indexOf('Heute') >= 0;
    });
    if (f === 'archive') return items.filter(function (it) { return it.type === 'archive'; });
    return items;
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

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    var css =
      '.sf-app{display:flex;flex-direction:column;min-height:inherit;background:var(--page-bg,#070707)}' +
      '.sf-top{position:sticky;top:0;z-index:6;padding:10px 14px 8px;background:linear-gradient(180deg,rgba(7,7,7,.98) 0%,rgba(7,7,7,.92) 70%,transparent 100%);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(12px)}' +
      '.sf-top-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}' +
      '.sf-brand{display:flex;align-items:center;gap:8px;min-width:0}' +
      '.sf-brand-mark{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#d4b86a,#8a6b2e);display:grid;place-items:center;font-size:12px;font-weight:900;color:#1a1408;flex:0 0 28px}' +
      '.sf-brand h1{margin:0;font-family:var(--serif,Cinzel,serif);font-size:17px;font-weight:700;color:var(--gold2,#e8d08a);letter-spacing:.04em}' +
      '.sf-refresh{border:0;background:rgba(255,255,255,.08);color:inherit;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px}' +
      '.sf-switch{display:flex;gap:4px;padding:3px;background:rgba(255,255,255,.06);border-radius:999px;border:1px solid rgba(255,255,255,.1)}' +
      '.sf-switch-btn{flex:1;border:0;background:transparent;color:rgba(248,239,212,.72);border-radius:999px;padding:7px 12px;font-size:11px;font-weight:800;cursor:pointer}' +
      '.sf-switch-btn.is-active{background:rgba(214,190,132,.18);color:#fff9e5;border:1px solid rgba(214,190,132,.35)}' +
      '.sf-filters{display:flex;gap:6px;overflow-x:auto;padding:8px 14px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '.sf-filters::-webkit-scrollbar{display:none}' +
      '.sf-filter{flex:0 0 auto;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;border-radius:999px;padding:6px 12px;font-size:10px;font-weight:700;cursor:pointer}' +
      '.sf-filter.is-active{border-color:rgba(214,190,132,.45);background:rgba(214,190,132,.14);color:#fff9e5}' +
      '.sf-feed{display:flex;flex-direction:column;gap:0;padding-bottom:calc(8px + env(safe-area-inset-bottom))}' +
      '.sf-post{background:var(--page-bg,#070707);border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer}' +
      '.sf-post__head{display:flex;align-items:center;gap:10px;padding:12px 14px 10px}' +
      '.sf-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,rgba(214,190,132,.35),rgba(90,70,30,.55));border:1.5px solid rgba(214,190,132,.45);display:grid;place-items:center;font-size:13px;font-weight:900;color:#fff8e8;flex:0 0 36px;overflow:hidden}' +
      '.sf-avatar img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sf-post__meta{flex:1;min-width:0}' +
      '.sf-user{display:block;font-size:13px;font-weight:800;color:#fff9e5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sf-sub{display:block;font-size:10px;opacity:.62;margin-top:1px}' +
      '.sf-more{border:0;background:transparent;color:inherit;font-size:18px;line-height:1;padding:4px 6px;cursor:pointer;opacity:.75}' +
      '.sf-post__media{position:relative;background:#0e0e0e}' +
      '.sf-post__img{width:100%;max-height:min(72vh,520px);object-fit:cover;display:block;aspect-ratio:4/5;background:#111}' +
      '.sf-post__quote{margin:0;padding:18px 16px;font-family:var(--serif,Cinzel,serif);font-size:clamp(15px,3.8vw,18px);line-height:1.55;color:#fff8e8;text-align:center;background:radial-gradient(circle at 50% 0%,rgba(239,215,142,.08),transparent 50%),linear-gradient(180deg,rgba(16,14,10,.96),rgba(8,8,6,.98));border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);min-height:120px;display:flex;align-items:center;justify-content:center}' +
      '.sf-post__dua{margin:0;padding:16px;background:linear-gradient(180deg,rgba(12,18,14,.98),rgba(8,12,10,.98));border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05)}' +
      '.sf-post__dua-ar{direction:rtl;text-align:right;font-size:20px;line-height:1.7;color:#fff9e8;margin-bottom:8px}' +
      '.sf-post__dua-de{font-size:13px;line-height:1.45;opacity:.88}' +
      '.sf-post__actions{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 4px}' +
      '.sf-actions-left,.sf-actions-right{display:flex;align-items:center;gap:2px}' +
      '.sf-act{border:0;background:transparent;color:inherit;width:40px;height:36px;border-radius:8px;cursor:pointer;font-size:22px;line-height:1;display:grid;place-items:center}' +
      '.sf-act.is-saved{color:#e85d75}' +
      '.sf-post__stats{padding:0 14px 4px;font-size:12px;font-weight:800;color:#fff9e5}' +
      '.sf-post__body{padding:0 14px 14px}' +
      '.sf-caption{margin:0 0 6px;font-size:13px;line-height:1.45;color:rgba(248,239,212,.92)}' +
      '.sf-caption b{font-weight:800;color:#fff9e5}' +
      '.sf-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}' +
      '.sf-tag{font-size:9px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);opacity:.85}' +
      '.sf-loader{padding:20px;text-align:center;opacity:.6;font-size:12px}' +
      '.sf-empty{padding:32px 20px;text-align:center;opacity:.7;font-size:13px;line-height:1.5}' +
      'html[data-theme="light"] .sf-post,html[data-theme="soft"] .sf-post{background:var(--page-bg,#faf8f4);border-bottom-color:rgba(0,0,0,.08)}' +
      'html[data-theme="light"] .sf-top,html[data-theme="soft"] .sf-top{background:linear-gradient(180deg,rgba(250,248,244,.98),rgba(250,248,244,.9))}' +
      'html[data-theme="light"] .sf-user,html[data-theme="soft"] .sf-user{color:var(--text,#3e2b17)}' +
      'html[data-theme="light"] .sf-post__quote,html[data-theme="soft"] .sf-post__quote{color:var(--text,#3e2b17)}' +
      'body.is-premium-feed-view .float-actions{opacity:.45;pointer-events:none}' +
      '@media(min-width:768px){.sf-feed{max-width:480px;margin:0 auto;width:100%}.sf-top-inner{max-width:480px;margin:0 auto}}';

    var el = document.createElement('style');
    el.id = STYLES_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function mediaHtml(item) {
    if (item.image) {
      return '<img class="sf-post__img" src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async">';
    }
    if (item.type === 'dua') {
      var parts = String(item.preview || '').split(' — ');
      return (
        '<div class="sf-post__dua">' +
          (parts[0] ? '<div class="sf-post__dua-ar">' + esc(parts[0]) + '</div>' : '') +
          '<div class="sf-post__dua-de">' + esc(item.preview || item.title) + '</div>' +
        '</div>'
      );
    }
    var quote = item.statement || item.preview || item.title || '';
    if (!quote) return '';
    return '<blockquote class="sf-post__quote">' + esc(quote) + '</blockquote>';
  }

  function cardHtml(item) {
    var author = authorLabel(item);
    var when = timeAgo(item.date);
    var eng = fakeEngagement(item.uid);
    var saved = false;
    try {
      if (item.postId && typeof isSaved === 'function') saved = isSaved(item.postId);
    } catch (e) {}
    var chips = (item.badges || []).filter(Boolean).slice(0, 2).map(function (b) {
      return '<span class="sf-tag">' + esc(b) + '</span>';
    });
    if (item.category) chips.unshift('<span class="sf-tag">' + esc(item.category) + '</span>');
    var caption = item.preview || item.statement || '';
    var avatarInner = item.image && (item.type === 'post' || item.type === 'archive')
      ? '<img src="' + esc(item.image) + '" alt="">'
      : esc(avatarLetter(item));

    return (
      '<article class="sf-post" data-pf-id="' + esc(item.uid) + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="' + esc(item.type) + '" data-pf-post="' + esc(item.postId || '') + '" tabindex="0" role="button">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + avatarInner + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(author) + '</span>' +
            '<span class="sf-sub">' + esc(when) + (item.hijriDate ? ' · ' + esc(item.hijriDate) : '') + '</span>' +
          '</div>' +
          '<button type="button" class="sf-more" aria-label="Mehr">⋯</button>' +
        '</header>' +
        mediaHtml(item) +
        '<div class="sf-post__actions">' +
          '<div class="sf-actions-left">' +
            '<button type="button" class="sf-act sf-like' + (saved ? ' is-saved' : '') + '" aria-label="Gefällt mir">' + (saved ? '♥' : '♡') + '</button>' +
            '<button type="button" class="sf-act sf-comment" aria-label="Kommentare">💬</button>' +
            '<button type="button" class="sf-act sf-share" aria-label="Teilen">↗</button>' +
          '</div>' +
          '<div class="sf-actions-right">' +
            (item.postId ? '<button type="button" class="sf-act sf-save' + (saved ? ' is-saved' : '') + '" data-pf-save="' + esc(item.postId) + '" aria-label="Speichern">' + (saved ? '🔖' : '📑') + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="sf-post__stats">' + eng.likes.toLocaleString('de-DE') + ' Gefällt mir · ' + eng.comments + ' Kommentare</div>' +
        '<div class="sf-post__body">' +
          '<p class="sf-caption"><b>' + esc(item.title) + '</b>' + (caption ? ' ' + esc(clamp(caption, 180)) : '') + '</p>' +
          (chips.length ? '<div class="sf-tags">' + chips.join('') + '</div>' : '') +
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

  function shareItem(item, ev) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    var text = (item.title || '') + '\n\n' + (item.preview || '') + '\n\nDAR AL TAWḤID';
    if (global.navigator && global.navigator.share) {
      global.navigator.share({ title: item.title, text: text }).catch(function () {});
      return;
    }
    try {
      global.navigator.clipboard.writeText(text);
    } catch (e) {}
  }

  function bindList(root) {
    root.querySelectorAll('.sf-post').forEach(function (card) {
      var uid = card.getAttribute('data-pf-id');
      var item = state.visible.find(function (x) { return x.uid === uid; });
      function open() {
        if (item) navigateTarget(item);
      }
      card.addEventListener('click', function (ev) {
        if (ev.target.closest('.sf-act') || ev.target.closest('.sf-more')) return;
        open();
      });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); }
      });
    });
    root.querySelectorAll('.sf-save, .sf-like').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var card = btn.closest('.sf-post');
        var pid = btn.getAttribute('data-pf-save') || (card && card.getAttribute('data-pf-post'));
        if (pid && typeof toggleSaved === 'function') {
          toggleSaved(pid);
          var on = typeof isSaved === 'function' && isSaved(pid);
          if (card) {
            card.querySelectorAll('[data-pf-save="' + pid + '"], .sf-like').forEach(function (b) {
              b.classList.toggle('is-saved', on);
              if (b.classList.contains('sf-save')) b.textContent = on ? '🔖' : '📑';
              if (b.classList.contains('sf-like')) b.textContent = on ? '♥' : '♡';
            });
          }
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
    root.querySelectorAll('.sf-comment').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var card = btn.closest('.sf-post');
        var uid = card && card.getAttribute('data-pf-id');
        var item = state.visible.find(function (x) { return x.uid === uid; });
        if (item) navigateTarget(item);
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
      ['duas', 'Duʿāʾ'],
      ['quran', 'Qurʾān'],
      ['news', 'News'],
      ['recommended', 'Empfohlen'],
      ['archive', 'Archiv']
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
              '<div class="sf-brand-mark" aria-hidden="true">D</div>' +
              '<h1>Feed</h1>' +
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
    state.allItems = mergeFeed(pools, manualItems || [], state.seed);
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
    applyFeedData(mount, []);

    fetchManual().then(function (data) {
      var mount2 = document.getElementById(MOUNT_ID);
      if (!mount2) return;
      var manual = (data && data.items) || [];
      if (manual.length) applyFeedData(mount2, manual);
    }).catch(function () {});
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
})();
