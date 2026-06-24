/**
 * DAR AL TAWḤID — Premium-Feed (vertikal, Tab „Feed“)
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darPremiumFeedStylesV4';
  var APP_LOGO = '/watermark-my-logo-full.png';
  var NATURE_BG = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1419242902214-272b3b66efd7?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1504198453319-5ce911b77409?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1464822759844-d150baec0134?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1494500764472-0c8f2919a3ad?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1475924156734-496f6baa6b2f?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3f4fcc5f?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7ad825403d9?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1447752875215-b9821bf41399?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747f0?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1465146633011-14f8e0781093?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1518173941767-7b394b2896a5?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1523712999612-f77bfc274434?auto=format&fit=crop&w=960&q=80',
    'https://images.unsplash.com/photo-1493246507136-91e8fad9978e?auto=format&fit=crop&w=960&q=80'
  ];
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

  function natureBgFor(item) {
    if (!NATURE_BG.length) return '';
    var key = String(item && item.uid || '') + '|' + todayKey();
    return NATURE_BG[hashNum(key) % NATURE_BG.length];
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

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
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
      '.sf-feed{display:flex;flex-direction:column;gap:14px;padding:0 10px calc(12px + env(safe-area-inset-bottom))}' +
      '.sf-post{margin:0;border-radius:22px;overflow:hidden;cursor:pointer;background:linear-gradient(180deg,rgba(18,16,12,.96),rgba(8,8,6,.98));border:1px solid rgba(214,190,132,.18);box-shadow:0 16px 40px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.04)}' +
      '.sf-post--demo{border-color:rgba(214,190,132,.32);box-shadow:0 18px 44px rgba(0,0,0,.34),0 0 0 1px rgba(239,215,142,.08) inset}' +
      '.sf-post__head{display:flex;align-items:center;gap:10px;padding:13px 14px 11px}' +
      '.sf-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(145deg,rgba(239,215,142,.42),rgba(90,70,30,.62));border:1.5px solid rgba(239,215,142,.42);display:grid;place-items:center;font-size:14px;font-weight:900;color:#fff8e8;flex:0 0 40px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.24)}' +
      '.sf-avatar img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.sf-post__meta{flex:1;min-width:0}' +
      '.sf-user{display:block;font-size:13px;font-weight:800;color:#fff9e5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sf-sub{display:block;font-size:10px;opacity:.62;margin-top:1px}' +
      '.sf-more{border:0;background:rgba(255,255,255,.05);color:inherit;font-size:16px;line-height:1;padding:6px 8px;border-radius:999px;cursor:pointer;opacity:.82}' +
      '.sf-post__media{position:relative;background:#0c0c0a;min-height:220px}' +
      '.sf-post__scene{position:relative;min-height:min(58vh,460px);background-size:cover;background-position:center;background-repeat:no-repeat;display:flex;align-items:flex-end}' +
      '.sf-post__scene-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08) 0%,rgba(0,0,0,.38) 45%,rgba(0,0,0,.82) 100%)}' +
      '.sf-post__scene-inner{position:relative;z-index:1;width:100%;padding:20px 16px 18px;color:#fff9e5}' +
      '.sf-post__img{width:100%;max-height:min(72vh,520px);object-fit:cover;display:block;aspect-ratio:4/5;background:#111}' +
      '.sf-post__quote{margin:0;font-family:var(--serif,Cinzel,serif);font-size:clamp(16px,3.9vw,19px);line-height:1.62;color:#fff9e5;text-align:center;text-shadow:0 2px 18px rgba(0,0,0,.55)}' +
      '.sf-quote-mark{font-size:28px;line-height:1;color:rgba(239,215,142,.42);font-family:Georgia,serif}' +
      '.sf-quote-text{display:block;max-width:34em}' +
      '.sf-post__dua{margin:0;padding:0;background:transparent}' +
      '.sf-post__dua-ar{direction:rtl;text-align:right;font-size:22px;line-height:1.75;color:#fff9e8;margin-bottom:10px;text-shadow:0 2px 16px rgba(0,0,0,.5)}' +
      '.sf-post__dua-de{font-size:14px;line-height:1.5;color:rgba(255,249,229,.94);text-shadow:0 2px 14px rgba(0,0,0,.45)}' +
      '.sf-post__actions{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 4px}' +
      '.sf-actions-left,.sf-actions-right{display:flex;align-items:center;gap:2px}' +
      '.sf-act{border:0;background:transparent;color:inherit;width:42px;height:38px;border-radius:10px;cursor:pointer;font-size:21px;line-height:1;display:grid;place-items:center}' +
      '.sf-act.is-saved{color:#f0dfa0}' +
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
      '@media(min-width:768px){.sf-feed,.sf-top-inner{max-width:500px;margin-left:auto;margin-right:auto;width:100%}.sf-filters{max-width:500px;margin:0 auto}}';

    var el = document.createElement('style');
    el.id = STYLES_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function sceneBlock(item, inner) {
    var bg = item.image || natureBgFor(item);
    return (
      '<div class="sf-post__scene" style="background-image:url(' + esc(bg) + ')">' +
        '<div class="sf-post__scene-shade"></div>' +
        '<div class="sf-post__scene-inner">' + inner + '</div>' +
      '</div>'
    );
  }

  function mediaHtml(item) {
    if (item.image && (item.type === 'post' || item.type === 'archive' || item.type === 'custom')) {
      return '<img class="sf-post__img" src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async">';
    }
    if (item.type === 'dua') {
      var txt = String(item.preview || '');
      var dash = txt.indexOf(' — ');
      var ar = dash > 0 ? txt.slice(0, dash).trim() : '';
      var de = dash > 0 ? txt.slice(dash + 3).trim() : txt;
      return sceneBlock(item,
        '<div class="sf-post__dua">' +
          (ar ? '<div class="sf-post__dua-ar">' + esc(ar) + '</div>' : '') +
          '<div class="sf-post__dua-de">' + esc(de || item.title) + '</div>' +
        '</div>'
      );
    }
    var quote = item.statement || item.preview || item.title || '';
    if (!quote) return sceneBlock(item, '');
    return sceneBlock(item,
      '<blockquote class="sf-post__quote"><span class="sf-quote-mark" aria-hidden="true">❝</span><span class="sf-quote-text">' + esc(quote) + '</span></blockquote>'
    );
  }

  function cardHtml(item) {
    var saved = false;
    try {
      if (item.postId && typeof isSaved === 'function') saved = isSaved(item.postId);
    } catch (e) {}
    var chips = (item.badges || []).filter(function (b) {
      return b && String(b).toLowerCase() !== 'vorschau';
    }).slice(0, 2).map(function (b) {
      return '<span class="sf-tag">' + esc(b) + '</span>';
    });
    if (item.category) chips.unshift('<span class="sf-tag">' + esc(item.category) + '</span>');

    return (
      '<article class="sf-post' + (item.demo ? ' sf-post--demo' : '') + '" data-pf-id="' + esc(item.uid) + '" data-pf-target="' + esc(item.target || '') + '" data-pf-type="' + esc(item.type) + '" data-pf-post="' + esc(item.postId || '') + '" tabindex="0" role="button">' +
        '<header class="sf-post__head">' +
          '<div class="sf-avatar" aria-hidden="true">' + logoImgHtml() + '</div>' +
          '<div class="sf-post__meta">' +
            '<span class="sf-user">' + esc(publisherLabel()) + '</span>' +
            '<span class="sf-sub">' + esc(cardSubline(item)) + '</span>' +
          '</div>' +
        '</header>' +
        '<div class="sf-post__media">' + mediaHtml(item) + '</div>' +
        '<div class="sf-post__actions">' +
          '<div class="sf-actions-left">' +
            '<button type="button" class="sf-act sf-share" aria-label="Teilen">↗</button>' +
          '</div>' +
          '<div class="sf-actions-right">' +
            (item.postId ? '<button type="button" class="sf-act sf-save' + (saved ? ' is-saved' : '') + '" data-pf-save="' + esc(item.postId) + '" aria-label="Speichern">' + (saved ? '🔖' : '📑') + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="sf-post__body">' +
          '<p class="sf-caption"><b>' + esc(item.title) + '</b></p>' +
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
    if (global && global.navigator && global.navigator.share) {
      global.navigator.share({ title: item.title, text: text }).catch(function () {});
      return;
    }
    try {
      if (global && global.navigator && global.navigator.clipboard) global.navigator.clipboard.writeText(text);
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
        if (ev.target.closest('.sf-act')) return;
        open();
      });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); }
      });
    });
    root.querySelectorAll('.sf-save').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var card = btn.closest('.sf-post');
        var pid = btn.getAttribute('data-pf-save') || (card && card.getAttribute('data-pf-post'));
        if (pid && typeof toggleSaved === 'function') {
          toggleSaved(pid);
          var on = typeof isSaved === 'function' && isSaved(pid);
          if (card) {
            card.querySelectorAll('[data-pf-save="' + pid + '"]').forEach(function (b) {
              b.classList.toggle('is-saved', on);
              b.textContent = on ? '🔖' : '📑';
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
