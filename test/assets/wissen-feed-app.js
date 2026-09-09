/**
 * DĀR AL TAWḤĪD — Wissens-Post-Feed (Prüf-App)
 * Textkarten als Standard. Bild nur optional. Ersetzt die Feed-Oberfläche der Prüf-App.
 */
(function (global) {
  'use strict';

  var MOUNT_ID = 'premiumFeedMount';
  var STYLES_ID = 'darWissenFeedStylesV1';
  var DATA_URL = '/test/data/feed-posts.json';
  var CACHE_KEY = 'darWissenFeedCacheV1';
  var LIKES_KEY = 'darWissenFeedLikesV1';
  var FILTER_KEY = 'darWissenFeedFilterV1';
  var APP_LOGO = '/watermark-my-logo-full.png';
  var BRAND = 'DĀR AL TAWḤĪD';

  var TYPE_LABELS = {
    quran: 'Qurʾān',
    hadith: 'Ḥadīṯ',
    athar: 'Athar',
    salaf: 'Salaf',
    dua: 'Duʿāʾ',
    beitrag: 'Beitrag',
    frauenbereich: 'Frauen im Islam',
    'app-hinweis': 'App-Hinweis'
  };

  var CHIP_FILTERS = [
    { id: 'alle', label: 'Alle' },
    { id: 'quran', label: 'Qurʾān' },
    { id: 'dua', label: 'Duʿāʾ' },
    { id: 'wissen', label: 'Wissen' },
    { id: 'frauen', label: 'Frauen' },
    { id: 'athar', label: 'Athār' }
  ];

  var state = {
    items: [],
    offline: false,
    filter: 'alle',
    search: '',
    likes: {},
    loaded: false
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function currentFeedValue() {
    try {
      if (typeof currentRoute !== 'undefined' && currentRoute && currentRoute.view === 'feed') {
        return String(currentRoute.value || '').trim();
      }
    } catch (e) {}
    try {
      if (typeof readRoute === 'function') {
        var r = readRoute();
        if (r && r.view === 'feed') return String(r.value || '').trim();
      }
    } catch (e2) {}
    return '';
  }

  function isAlleMode(value) {
    var v = String(value || '').toLowerCase();
    return v === 'alle' || v === 'topics';
  }

  function visibleShortLink(url) {
    var s = String(url || '').trim();
    var m = s.match(/(?:^|\/)q\/(\d+)\/?$/i) || s.match(/^\/q\/(\d+)/i);
    if (m) return 'dar-al-tawhid.de/q/' + m[1];
    return '';
  }

  function isInternalProof(url) {
    var s = String(url || '').trim();
    if (!s) return false;
    if (/^#quran-surah\//i.test(s)) return true;
    if (/^\/q\/\d+/i.test(s)) return true;
    if (/dar-al-tawhid\.de\/q\/\d+/i.test(s)) return true;
    return false;
  }

  function isReligiousType(typ) {
    return typ !== 'app-hinweis';
  }

  function isEligible(post) {
    if (!post || post.sichtbar === false) return false;
    var typ = String(post.typ || '');
    var quelle = String(post.quelle || '').trim();
    var proof = String(post.direktnachweisUrl || '').trim();
    if (typ === 'app-hinweis') return true;
    if (!quelle) return false;
    if (!proof || !isInternalProof(proof)) return false;
    return true;
  }

  function typeLabel(post) {
    if (post && post.kategorie) return post.kategorie;
    return TYPE_LABELS[post && post.typ] || 'Beitrag';
  }

  function formatWhen(datum) {
    var d = String(datum || '').slice(0, 10);
    if (!d) return '';
    var today = new Date();
    var iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    if (d === iso) return 'Heute';
    var yest = new Date(today.getTime() - 86400000);
    var yiso = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0');
    if (d === yiso) return 'Gestern';
    var parts = d.split('-');
    if (parts.length === 3) return parts[2] + '.' + parts[1] + '.' + parts[0];
    return d;
  }

  function matchesChip(post, chip) {
    if (!chip || chip === 'alle') return true;
    var t = String(post.typ || '');
    if (chip === 'quran') return t === 'quran';
    if (chip === 'dua') return t === 'dua';
    if (chip === 'wissen') return t === 'beitrag' || t === 'hadith';
    if (chip === 'frauen') return t === 'frauenbereich';
    if (chip === 'athar') return t === 'athar' || t === 'salaf';
    return true;
  }

  function matchesSearch(post, q) {
    if (!q) return true;
    var hay = [post.titel, post.kurztext, post.volltext, post.quelle, post.kategorie, TYPE_LABELS[post.typ]]
      .join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function sortedItems() {
    return state.items.slice().sort(function (a, b) {
      return String(b.datum || '').localeCompare(String(a.datum || ''));
    });
  }

  function filteredList(forAlle) {
    var chip = state.filter || 'alle';
    var q = String(state.search || '').trim().toLowerCase();
    return sortedItems().filter(function (p) {
      if (!matchesChip(p, chip)) return false;
      if (forAlle && q && !matchesSearch(p, q)) return false;
      return true;
    });
  }

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    var css = ''
      + '.wf-app{width:100%;max-width:100%;margin:0;padding:0;box-sizing:border-box;min-height:calc(100dvh - 70px - env(safe-area-inset-bottom,0px));background:transparent;color:var(--theme-text,var(--text,#f4ead2));font-family:Manrope,Inter,system-ui,sans-serif}'
      + '.wf-top{position:sticky;top:0;z-index:6;padding:max(10px,env(safe-area-inset-top,0px)) 14px 8px;background:linear-gradient(180deg,var(--theme-feed-bg,var(--outer-bg,var(--bg,#080806))) 70%,transparent)}'
      + '.wf-brand{display:flex;align-items:center;gap:10px}'
      + '.wf-logo{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid rgba(201,168,106,.42)}'
      + '.wf-brand-name{display:block;font-family:Georgia,"Times New Roman",serif;font-size:15px;letter-spacing:.04em;color:var(--gold2,#efd78e);text-transform:none}'
      + '.wf-offline{margin:8px 0 0;font-size:11px;color:var(--muted,#cbbd9a);opacity:.9}'
      + '.wf-switch{display:flex;gap:6px;margin-top:12px;padding:4px;border-radius:14px;border:1px solid rgba(201,168,106,.28);background:rgba(255,255,255,.03)}'
      + '.wf-switch button{flex:1;border:0;background:transparent;color:var(--muted,#cbbd9a);font:inherit;font-size:13px;font-weight:700;padding:9px 8px;border-radius:11px}'
      + '.wf-switch button.is-on{background:rgba(201,168,106,.16);color:var(--theme-text,var(--text,#f4ead2))}'
      + '.wf-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 14px 4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}'
      + '.wf-chips::-webkit-scrollbar{display:none}'
      + '.wf-chip{flex:0 0 auto;border:1px solid rgba(201,168,106,.28);background:rgba(255,255,255,.03);color:var(--muted,#cbbd9a);border-radius:999px;padding:7px 12px;font:inherit;font-size:12px;font-weight:650}'
      + '.wf-chip.is-on{border-color:rgba(201,168,106,.55);background:rgba(201,168,106,.14);color:var(--theme-text,var(--text,#f4ead2))}'
      + '.wf-search{display:block;width:calc(100% - 28px);margin:8px 14px 0;box-sizing:border-box;border-radius:12px;border:1px solid rgba(201,168,106,.28);background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:14px;padding:10px 12px}'
      + '.wf-list{padding:8px 12px calc(28px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px}'
      + '.wf-card{border:1px solid rgba(201,168,106,.22);border-radius:16px;background:linear-gradient(165deg,rgba(255,255,255,.055),rgba(255,255,255,.02));padding:12px 12px 10px;display:flex;flex-direction:column;gap:8px}'
      + '.wf-card__head{display:flex;align-items:center;gap:10px}'
      + '.wf-card__meta{display:flex;flex-direction:column;gap:1px;min-width:0}'
      + '.wf-card__brand{font-size:12px;font-weight:800;letter-spacing:.03em;color:var(--gold2,#efd78e)}'
      + '.wf-card__sub{font-size:11px;color:var(--muted,#cbbd9a)}'
      + '.wf-card__title{margin:2px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:18px;line-height:1.25;color:var(--theme-text,var(--text,#f4ead2));font-weight:600}'
      + '.wf-card__text{margin:0;font-size:13.5px;line-height:1.45;color:var(--theme-text,var(--text,#f4ead2));opacity:.92}'
      + '.wf-src{margin:0;font-size:12px;line-height:1.4;color:var(--muted,#cbbd9a)}'
      + '.wf-src b{font-weight:700;color:inherit}'
      + '.wf-proof{margin:0;font-size:12px;line-height:1.35}'
      + '.wf-proof a,.wf-card a.wf-q{color:var(--gold2,#efd78e);text-decoration:none}'
      + '.wf-thumb{width:72px;height:72px;border-radius:12px;object-fit:cover;border:1px solid rgba(201,168,106,.25);align-self:flex-end;margin-top:-4px}'
      + '.wf-card__foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}'
      + '.wf-heart,.wf-read,.wf-back,.wf-share{border:0;background:transparent;color:var(--gold2,#efd78e);font:inherit;font-size:13px;font-weight:700;padding:6px 0}'
      + '.wf-heart{font-size:18px;color:var(--muted,#cbbd9a)}'
      + '.wf-heart.is-on{color:#c9a86a}'
      + '.wf-empty{padding:28px 16px;text-align:center;color:var(--muted,#cbbd9a);font-size:14px;line-height:1.5}'
      + '.wf-detail{padding:8px 16px 32px}'
      + '.wf-detail h1{font-family:Georgia,"Times New Roman",serif;font-size:24px;line-height:1.2;margin:10px 0 8px;font-weight:600}'
      + '.wf-detail .wf-full{white-space:pre-wrap;font-size:15px;line-height:1.55;margin:0 0 10px}'
      + 'html[data-theme="light"] .wf-card,html[data-theme="eisgold"] .wf-card{background:linear-gradient(165deg,rgba(255,255,255,.55),rgba(255,255,255,.22))}'
      + '@media(max-width:390px){.wf-card__title{font-size:17px}.wf-chips{padding-left:12px}}';
    var el = document.createElement('style');
    el.id = STYLES_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function loadLikes() {
    var raw = readJson(LIKES_KEY, {});
    state.likes = raw && typeof raw === 'object' ? raw : {};
  }

  function toggleLike(id) {
    state.likes[id] = !state.likes[id];
    writeJson(LIKES_KEY, state.likes);
  }

  function applyPayload(data, fromCache) {
    var list = data && Array.isArray(data.beitraege) ? data.beitraege : [];
    state.items = list.filter(isEligible);
    state.offline = !!fromCache && !navigator.onLine;
    state.loaded = true;
    if (!fromCache) writeJson(CACHE_KEY, { at: Date.now(), data: data });
  }

  function fetchFeed() {
    loadLikes();
    var cached = readJson(CACHE_KEY, null);
    if (cached && cached.data) applyPayload(cached.data, true);
    var urls = [DATA_URL, 'data/feed-posts.json', '/test/data/feed-posts.json'];
    function tryUrl(i) {
      if (i >= urls.length) return Promise.reject(new Error('feed'));
      return fetch(urls[i], { cache: 'no-store' }).then(function (res) {
        if (!res.ok) return tryUrl(i + 1);
        return res.json();
      }).catch(function () { return tryUrl(i + 1); });
    }
    return tryUrl(0).then(function (data) {
      applyPayload(data, false);
      state.offline = !navigator.onLine;
    }).catch(function () {
      if (cached && cached.data) {
        applyPayload(cached.data, true);
        state.offline = true;
      } else {
        state.items = [];
        state.loaded = true;
        state.offline = !navigator.onLine;
      }
    });
  }

  function proofBlock(post, compact) {
    if (post.typ === 'app-hinweis') return '';
    var shortL = visibleShortLink(post.direktnachweisUrl);
    var label = post.direktnachweisText || '→ Quelle öffnen';
    var href = post.direktnachweisUrl || '';
    var html = '<p class="wf-src"><b>Quelle</b><br>' + esc(post.quelle) + '</p>';
    if (shortL) {
      html += '<p class="wf-proof">🔗 <a class="wf-q" href="' + esc(href) + '" rel="noopener">' + esc(shortL) + '</a></p>';
    } else if (href) {
      html += '<p class="wf-proof"><a class="wf-q" href="' + esc(href) + '">' + esc(label) + '</a></p>';
    }
    if (compact) return html;
    return html;
  }

  function cardHtml(post) {
    var liked = !!state.likes[post.kennung];
    var when = formatWhen(post.datum);
    var sub = [typeLabel(post), when].filter(Boolean).join(' · ');
    var img = String(post.bildUrl || '').trim();
    var thumb = '';
    if (img) {
      thumb = '<img class="wf-thumb" src="' + esc(img) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">';
    }
    return (
      '<article class="wf-card" data-wf-id="' + esc(post.kennung) + '">' +
        '<header class="wf-card__head">' +
          '<img class="wf-logo" src="' + APP_LOGO + '" alt="">' +
          '<div class="wf-card__meta">' +
            '<span class="wf-card__brand">' + esc(BRAND) + '</span>' +
            '<span class="wf-card__sub">' + esc(sub) + '</span>' +
          '</div>' +
        '</header>' +
        '<h2 class="wf-card__title">📖 ' + esc(post.titel) + '</h2>' +
        '<p class="wf-card__text">' + esc(post.kurztext) + '</p>' +
        proofBlock(post, true) +
        thumb +
        '<div class="wf-card__foot">' +
          '<button type="button" class="wf-heart' + (liked ? ' is-on' : '') + '" data-wf-like="' + esc(post.kennung) + '" aria-label="Speichern">' + (liked ? '♥' : '♡') + '</button>' +
          '<button type="button" class="wf-read" data-wf-open="' + esc(post.kennung) + '">Beitrag lesen →</button>' +
        '</div>' +
      '</article>'
    );
  }

  function compactRow(post) {
    var when = formatWhen(post.datum);
    return (
      '<article class="wf-card" data-wf-id="' + esc(post.kennung) + '">' +
        '<header class="wf-card__head">' +
          '<img class="wf-logo" src="' + APP_LOGO + '" alt="">' +
          '<div class="wf-card__meta">' +
            '<span class="wf-card__brand">' + esc(post.titel) + '</span>' +
            '<span class="wf-card__sub">' + esc([typeLabel(post), when].filter(Boolean).join(' · ')) + '</span>' +
          '</div>' +
        '</header>' +
        '<p class="wf-card__text">' + esc(post.kurztext) + '</p>' +
        '<div class="wf-card__foot">' +
          '<span></span>' +
          '<button type="button" class="wf-read" data-wf-open="' + esc(post.kennung) + '">Beitrag lesen →</button>' +
        '</div>' +
      '</article>'
    );
  }

  function detailHtml(post) {
    var when = formatWhen(post.datum);
    var img = String(post.bildUrl || '').trim();
    var share = '';
    if (global.navigator && typeof navigator.share === 'function') {
      share = '<button type="button" class="wf-share" data-wf-share="' + esc(post.kennung) + '">Teilen</button>';
    }
    return (
      '<div class="wf-detail">' +
        '<button type="button" class="wf-back" data-wf-back>← Zurück zum Feed</button>' +
        '<p class="wf-card__sub">' + esc([typeLabel(post), when].filter(Boolean).join(' · ')) + '</p>' +
        '<h1>' + esc(post.titel) + '</h1>' +
        (img ? '<img class="wf-thumb" style="width:100%;height:auto;max-height:180px;object-fit:cover" src="' + esc(img) + '" alt="" onerror="this.remove()">' : '') +
        '<p class="wf-full">' + esc(post.volltext || post.kurztext) + '</p>' +
        proofBlock(post, false) +
        share +
      '</div>'
    );
  }

  function openPost(id) {
    if (typeof navigate === 'function') navigate('feed', id);
  }

  function openProof(ev, href) {
    ev.preventDefault();
    var s = String(href || '');
    if (/^#quran-surah\//i.test(s)) {
      var rest = s.replace(/^#quran-surah\//i, '');
      var parts = rest.split('/');
      if (typeof openQuranSurah === 'function') openQuranSurah(parts[0], parts[1]);
      else if (typeof navigate === 'function') navigate('quran-surah', rest);
      return;
    }
    var m = s.match(/\/q\/(\d+)/i);
    if (m) {
      global.open('/q/' + m[1] + '/', '_blank', 'noopener');
      return;
    }
  }

  function bind(root) {
    if (!root) return;
    root.querySelectorAll('[data-wf-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-wf-mode') || '';
        if (typeof navigate === 'function') navigate('feed', mode);
      });
    });
    root.querySelectorAll('[data-wf-chip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.filter = btn.getAttribute('data-wf-chip') || 'alle';
        writeJson(FILTER_KEY, state.filter);
        paint(root);
      });
    });
    var search = root.querySelector('#wfSearch');
    if (search) {
      search.addEventListener('input', function () {
        state.search = search.value || '';
        paint(root, true);
      });
    }
    root.querySelectorAll('[data-wf-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { openPost(btn.getAttribute('data-wf-open')); });
    });
    root.querySelectorAll('[data-wf-like]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var id = btn.getAttribute('data-wf-like');
        toggleLike(id);
        btn.classList.toggle('is-on', !!state.likes[id]);
        btn.textContent = state.likes[id] ? '♥' : '♡';
      });
    });
    root.querySelectorAll('[data-wf-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof navigate === 'function') navigate('feed', '');
      });
    });
    root.querySelectorAll('[data-wf-share]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var post = state.items.find(function (p) { return p.kennung === btn.getAttribute('data-wf-share'); });
        if (!post || !navigator.share) return;
        var shortL = visibleShortLink(post.direktnachweisUrl);
        var text = (post.volltext || post.kurztext || '') + (post.quelle ? '\nQuelle: ' + post.quelle : '') + (shortL ? '\n🔗 ' + shortL : '');
        navigator.share({ title: post.titel, text: text }).catch(function () {});
      });
    });
    root.querySelectorAll('a.wf-q').forEach(function (a) {
      a.addEventListener('click', function (ev) { openProof(ev, a.getAttribute('href')); });
    });
  }

  function topBar(alleOn) {
    var off = state.offline ? '<p class="wf-offline">Offline – letzter Stand wird angezeigt</p>' : '';
    return (
      '<header class="wf-top">' +
        '<div class="wf-brand">' +
          '<img class="wf-logo" src="' + APP_LOGO + '" alt="">' +
          '<span class="wf-brand-name">' + esc(BRAND) + '</span>' +
        '</div>' +
        off +
        '<nav class="wf-switch" aria-label="Feed-Ansicht">' +
          '<button type="button" class="' + (alleOn ? '' : 'is-on') + '" data-wf-mode="">Feed</button>' +
          '<button type="button" class="' + (alleOn ? 'is-on' : '') + '" data-wf-mode="alle">Alle Beiträge</button>' +
        '</nav>' +
      '</header>'
    );
  }

  function chipsHtml() {
    return '<div class="wf-chips" role="tablist">' + CHIP_FILTERS.map(function (c) {
      var on = (state.filter || 'alle') === c.id;
      return '<button type="button" class="wf-chip' + (on ? ' is-on' : '') + '" data-wf-chip="' + esc(c.id) + '">' + esc(c.label) + '</button>';
    }).join('') + '</div>';
  }

  function paint(mount, keepSearchFocus) {
    if (!mount) return;
    injectStyles();
    var value = currentFeedValue();
    var detail = null;
    if (value && !isAlleMode(value)) {
      detail = state.items.find(function (p) { return p.kennung === value; }) || null;
    }
    var alleOn = isAlleMode(value);
    var searchVal = state.search || '';
    var body;
    if (detail) {
      body = detailHtml(detail);
    } else if (alleOn) {
      var rows = filteredList(true);
      body = chipsHtml()
        + '<input id="wfSearch" class="wf-search" type="search" placeholder="Beiträge suchen" value="' + esc(searchVal) + '" autocomplete="off">'
        + '<div class="wf-list">'
        + (rows.length ? rows.map(compactRow).join('') : '<div class="wf-empty">Keine Beiträge zu dieser Auswahl.</div>')
        + '</div>';
    } else {
      var cards = filteredList(false);
      body = chipsHtml()
        + '<div class="wf-list">'
        + (cards.length ? cards.map(cardHtml).join('') : '<div class="wf-empty">Noch keine geprüften Beiträge in dieser Auswahl.</div>')
        + '</div>';
    }
    mount.innerHTML = '<div class="wf-app">' + topBar(alleOn) + body + '</div>';
    bind(mount);
    if (keepSearchFocus) {
      var inp = mount.querySelector('#wfSearch');
      if (inp) {
        inp.focus();
        try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {}
      }
    }
  }

  function rebuild(opts) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;
    document.body.classList.add('is-premium-feed-view');
    var stored = readJson(FILTER_KEY, 'alle');
    if (typeof stored === 'string') state.filter = stored;
    var go = function () { paint(mount); };
    if (state.loaded && !(opts && opts.force)) { go(); return; }
    fetchFeed().then(go);
  }

  global.addEventListener('online', function () {
    if (document.getElementById(MOUNT_ID)) rebuild({ force: true });
  });
  global.addEventListener('offline', function () {
    state.offline = true;
    var mount = document.getElementById(MOUNT_ID);
    if (mount) paint(mount);
  });

  global.DAR_PREMIUM_FEED = {
    rebuild: rebuild,
    onAppReady: rebuild,
    onPostsUpdated: function () { rebuild({ force: true }); },
    saveState: function () {}
  };
})(window);
