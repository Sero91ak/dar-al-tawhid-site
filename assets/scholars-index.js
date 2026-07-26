/**
 * DAR AL TAWḤID — Gelehrten-Index v482
 * Search, filter, sort, historical grouping, scroll state.
 */
(function (global) {
  'use strict';

  const STATE_KEY = 'darScholarsIndexStateV1';
  const SORT_KEY = 'darScholarsIndexSortV1';
  const RECENT_KEY = 'darScholarsRecentV1';
  const META_URL = '/data/scholar-index-meta.json';

  const SORT_OPTIONS = [
    { id: 'generation', label: 'Historische Generation' },
    { id: 'alpha', label: 'Alphabetisch' },
    { id: 'count_desc', label: 'Meiste Beiträge' },
    { id: 'count_asc', label: 'Wenigste Beiträge' },
    { id: 'recent', label: 'Zuletzt angesehen' },
  ];

  const FILTER_DEFS = [
    { id: 'all', label: 'Alle' },
    { id: 'prophet', label: 'Prophet' },
    { id: 'sahabah', label: 'Ṣaḥābah' },
    { id: 'tabiun', label: 'Tābiʿūn' },
    { id: 'atba', label: 'Atbāʿ at-Tābiʿīn' },
    { id: 'imam', label: 'Imāme' },
    { id: 'muhaddith', label: 'Muḥaddithūn' },
    { id: 'faqih', label: 'Fuqahāʾ' },
    { id: 'mufassir', label: 'Mufassirūn' },
    { id: 'weitere', label: 'Weitere' },
  ];

  const ROLE_LABELS = {
    prophet: 'Prophet',
    sahabi: 'Ṣaḥābī',
    tabi: 'Tābiʿī',
    imam: 'Imām',
    muhaddith: 'Muḥaddith',
    faqih: 'Fāqih',
    mufassir: 'Mufassir',
  };

  const SECTION_LABELS = {
    prophet: 'PROPHET',
    sahabah: 'ṢAḤĀBAH',
    tabiun: 'TĀBIʿŪN',
    atba: 'ATBĀʿ AT-TĀBIʿĪN',
    early_imam: 'FRÜHE IMĀME UND MUḤADDITHŪN',
    later: 'SPÄTERE GELEHRTE',
    weitere: 'WEITERE',
  };

  const SECTION_ORDER = ['prophet', 'sahabah', 'tabiun', 'atba', 'early_imam', 'later', 'weitere'];

  let metaCache = null;
  let metaPromise = null;
  let searchTimer = 0;
  let boundRoot = null;

  function getJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }

  function readSession(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ʿʻ''`´]/g, "'")
      .replace(/[‐‑–—]/g, '-')
      .replace(/\b(al|ar|at|adh|as|ash|ad|ibn|b|bin|abu|abdu|abd|umm)\b/g, ' ')
      .replace(/[^a-z0-9\u0600-\u06ff'\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildMonogram(name, explicit) {
    if (explicit) return explicit;
    const clean = String(name || '').replace(/[ﷺ]/g, '').trim();
    if (!clean) return '◆';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0].replace(/^al-|^ash-|^at-|^adh-|^as-/i, '');
    const last = parts[parts.length - 1];
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  function contributionLabel(n) {
    const c = Number(n) || 0;
    return c === 1 ? '1 Beitrag' : `${c} Beiträge`;
  }

  function roleLine(roles) {
    if (!roles || !roles.length) return '';
    return roles.map((r) => ROLE_LABELS[r] || r).join(' · ');
  }

  function loadMeta() {
    if (metaCache) return Promise.resolve(metaCache);
    if (metaPromise) return metaPromise;
    metaPromise = fetch(META_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        metaCache = data && data.scholars ? data : { scholars: {} };
        return metaCache;
      });
    return metaPromise;
  }

  function enrichCatalog(catalog) {
    const meta = metaCache?.scholars || {};
    return catalog.map((item) => {
      const m = meta[item.key] || {};
      const roles = m.roles || [];
      const displayName = m.displayName || item.label;
      return {
        id: item.key,
        displayName,
        count: item.count,
        route: item.key,
        primaryGroup: m.primaryGroup || 'weitere',
        generationGroup: m.generationGroup || 'weitere',
        generationOrder: Number(m.generationOrder) || 8000,
        roles,
        aliases: m.aliases || [],
        kuniyah: m.kuniyah || '',
        monogram: buildMonogram(displayName, m.monogram),
        searchHaystack: normalizeSearchText(
          [displayName, m.kuniyah, ...(m.aliases || [])].filter(Boolean).join(' ')
        ),
        alphaKey: normalizeSearchText(displayName).charAt(0).toUpperCase() || '#',
      };
    });
  }

  function readState() {
    const saved = readSession(STATE_KEY, {});
    const sort = getJson(SORT_KEY, 'generation');
    return {
      query: saved.query || '',
      filter: saved.filter || 'all',
      sort: SORT_OPTIONS.some((o) => o.id === sort) ? sort : 'generation',
      scrollY: Number(saved.scrollY) || 0,
    };
  }

  function saveState(patch) {
    const prev = readSession(STATE_KEY, {});
    writeSession(STATE_KEY, { ...prev, ...patch });
  }

  function readRecent() {
    const list = getJson(RECENT_KEY, []);
    return Array.isArray(list) ? list.slice(0, 3) : [];
  }

  function pushRecent(scholar) {
    if (!scholar?.id) return;
    const list = readRecent().filter((x) => x.id !== scholar.id);
    list.unshift({ id: scholar.id, name: scholar.displayName, at: Date.now() });
    setJson(RECENT_KEY, list.slice(0, 3));
  }

  function filterScholars(items, state) {
    const q = normalizeSearchText(state.query);
    return items.filter((s) => {
      if (state.filter !== 'all') {
        const matchPrimary = s.primaryGroup === state.filter;
        const matchRole = (s.roles || []).includes(state.filter);
        if (!matchPrimary && !matchRole) return false;
      }
      if (!q) return true;
      return s.searchHaystack.includes(q);
    });
  }

  function sortScholars(items, sortId, recentIds) {
    const list = [...items];
    if (sortId === 'alpha') {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'de', { sensitivity: 'base' }));
      return list;
    }
    if (sortId === 'count_desc') {
      list.sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName, 'de'));
      return list;
    }
    if (sortId === 'count_asc') {
      list.sort((a, b) => a.count - b.count || a.displayName.localeCompare(b.displayName, 'de'));
      return list;
    }
    if (sortId === 'recent') {
      const rank = new Map(recentIds.map((id, i) => [id, i]));
      list.sort((a, b) => {
        const ra = rank.has(a.id) ? rank.get(a.id) : 999;
        const rb = rank.has(b.id) ? rank.get(b.id) : 999;
        if (ra !== rb) return ra - rb;
        return a.displayName.localeCompare(b.displayName, 'de');
      });
      return list;
    }
    list.sort((a, b) => {
      const ga = SECTION_ORDER.indexOf(a.generationGroup);
      const gb = SECTION_ORDER.indexOf(b.generationGroup);
      if (ga !== gb) return ga - gb;
      if (a.generationOrder !== b.generationOrder) return a.generationOrder - b.generationOrder;
      return a.displayName.localeCompare(b.displayName, 'de');
    });
    return list;
  }

  function groupScholars(items, sortId) {
    if (sortId === 'alpha') {
      const map = new Map();
      items.forEach((s) => {
        const letter = /^[A-Z]$/.test(s.alphaKey) ? s.alphaKey : '#';
        if (!map.has(letter)) map.set(letter, []);
        map.get(letter).push(s);
      });
      return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'de'))
        .map(([letter, rows]) => ({ id: 'alpha-' + letter, label: letter, count: rows.length, items: rows }));
    }
    const map = new Map();
    items.forEach((s) => {
      const g = s.generationGroup || 'weitere';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(s);
    });
    return SECTION_ORDER.filter((id) => map.has(id)).map((id) => ({
      id,
      label: SECTION_LABELS[id] || id.toUpperCase(),
      count: map.get(id).length,
      items: map.get(id),
    }));
  }

  function availableFilters(items) {
    const set = new Set(['all']);
    items.forEach((s) => {
      set.add(s.primaryGroup);
      s.roles.forEach((r) => {
        if (FILTER_DEFS.some((f) => f.id === r)) set.add(r);
      });
    });
    return FILTER_DEFS.filter((f) => set.has(f.id));
  }

  function renderRow(s, esc) {
    const roles = roleLine(s.roles);
    const aria = `${s.displayName}${roles ? ', ' + roles.replace(/ · /g, ', ') : ''}, ${contributionLabel(s.count)} öffnen`;
    return `<button type="button" class="scholars-index__row" data-scholar-open="${esc(s.id)}" aria-label="${esc(aria)}">
      <span class="scholars-index__mono${s.primaryGroup === 'prophet' ? ' scholars-index__mono--prophet' : ''}" aria-hidden="true">${esc(s.monogram)}</span>
      <span class="scholars-index__copy">
        <span class="scholars-index__name">${esc(s.displayName)}</span>
        ${roles ? `<span class="scholars-index__roles">${esc(roles)}</span>` : ''}
        <span class="scholars-index__countline">${esc(contributionLabel(s.count))}</span>
      </span>
      <span class="scholars-index__chev" aria-hidden="true">›</span>
    </button>`;
  }

  function renderSortSheet(state, esc) {
    return `<div id="scholarsSortSheet" class="scholars-sort-sheet" hidden role="dialog" aria-modal="true" aria-labelledby="scholarsSortTitle">
      <div class="scholars-sort-sheet__panel">
        <h3 id="scholarsSortTitle" class="scholars-sort-sheet__title">Sortierung</h3>
        ${SORT_OPTIONS.map(
          (o) =>
            `<button type="button" class="scholars-sort-sheet__opt" data-scholars-sort="${esc(o.id)}" aria-checked="${state.sort === o.id ? 'true' : 'false'}">${esc(o.label)}${state.sort === o.id ? ' ✓' : ''}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  function renderPage(catalog, esc, opts) {
    opts = opts || {};
    const state = opts.state || readState();
    const loading = !!opts.loading;
    const error = !!opts.error;
    const items = enrichCatalog(catalog || []);
    const filtered = filterScholars(items, state);
    const recent = readRecent();
    const recentIds = recent.map((r) => r.id);
    const sorted = sortScholars(filtered, state.sort, recentIds);
    const groups = groupScholars(sorted, state.sort);
    const filters = availableFilters(items);
    const sortLabel = (SORT_OPTIONS.find((o) => o.id === state.sort) || SORT_OPTIONS[0]).label;
    const useCols = global.innerWidth >= 720;
    const alphaLetters = state.sort === 'alpha'
      ? [...new Set(sorted.map((s) => (/^[A-Z]$/.test(s.alphaKey) ? s.alphaKey : '#')))]
      : [];

    const recentHtml =
      recent.length && !state.query
        ? `<section class="scholars-index__recent" aria-label="Zuletzt angesehen">
            <span class="scholars-index__recent-label">ZULETZT ANGESEHEN</span>
            <div class="scholars-index__recent-links">${recent
              .map(
                (r) =>
                  `<button type="button" class="scholars-index__recent-link" data-scholar-open="${esc(r.id)}">${esc(r.name)}</button>`
              )
              .join('<span aria-hidden="true"> · </span>')}</div>
          </section>`
        : '';

    let bodyHtml = '';
    if (loading) {
      bodyHtml = `<div class="scholars-index__skeleton" aria-busy="true">${Array.from({ length: 8 })
        .map(() => '<div class="scholars-index__skel-row"></div>')
        .join('')}</div>`;
    } else if (error) {
      bodyHtml = `<div class="scholars-index__error" role="alert"><h3>Gelehrte konnten nicht geladen werden</h3><p>Bitte Verbindung prüfen und erneut versuchen.</p><button type="button" class="scholars-index__reset" id="scholarsRetryBtn">Erneut versuchen</button></div>`;
    } else if (!sorted.length) {
      bodyHtml = `<div class="scholars-index__empty" role="status">
        <h3>Keine passende Person gefunden</h3>
        <p>Prüfe die Schreibweise oder entferne einen aktiven Filter.</p>
        <button type="button" class="scholars-index__reset" id="scholarsResetBtn">Filter zurücksetzen</button>
      </div>`;
    } else {
      bodyHtml = `<div class="scholars-index__body">${groups
        .map(
          (g) => `<section class="scholars-index__group" id="scholars-group-${esc(g.id)}" aria-labelledby="scholars-group-label-${esc(g.id)}">
            <header class="scholars-index__group-head">
              <h2 class="scholars-index__group-title" id="scholars-group-label-${esc(g.id)}">${esc(g.label)}</h2>
              <span class="scholars-index__group-count">${g.count}</span>
            </header>
            <div class="scholars-index__list${useCols ? ' scholars-index__list--cols' : ''}" role="list">
              ${g.items.map((s) => renderRow(s, esc)).join('')}
            </div>
          </section>`
        )
        .join('')}</div>`;
    }

    return `<section class="scholars-index" id="scholarsIndexRoot" data-scholars-index>
      <header class="scholars-index__header">
        <p class="scholars-index__eyebrow">PERSONEN &amp; ÜBERLIEFERER</p>
        <h1 class="scholars-index__title">Gelehrte</h1>
        <p class="scholars-index__subtitle">Beiträge nach Ṣaḥābah, Tābiʿīn, Imāmen und frühen Gelehrten</p>
        <hr class="scholars-index__rule" aria-hidden="true">
      </header>
      <div class="scholars-index__sticky">
        <div class="scholars-index__search-wrap">
          <svg class="scholars-index__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="scholarsSearchInput" class="scholars-index__search" type="search" placeholder="Gelehrte nach Name, Kuniyah oder Schreibweise suchen" value="${esc(state.query)}" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Gelehrte suchen">
          <button type="button" id="scholarsSearchClear" class="scholars-index__search-clear" aria-label="Suche löschen" ${state.query ? '' : 'hidden'}>×</button>
        </div>
        <div class="scholars-index__meta-row">
          <span id="scholarsResultCount" class="scholars-index__count">${filtered.length} ${filtered.length === 1 ? 'Treffer' : 'Treffer'}</span>
          <button type="button" id="scholarsSortBtn" class="scholars-index__sort-btn" aria-haspopup="dialog" aria-controls="scholarsSortSheet">Sortierung: ${esc(sortLabel)}</button>
        </div>
        <div class="scholars-index__filters" role="toolbar" aria-label="Gelehrten filtern">
          ${filters
            .map(
              (f) =>
                `<button type="button" class="scholars-index__chip" data-scholars-filter="${esc(f.id)}" aria-selected="${state.filter === f.id ? 'true' : 'false'}">${esc(f.label)}</button>`
            )
            .join('')}
        </div>
        ${
          alphaLetters.length
            ? `<div class="scholars-index__alpha" role="navigation" aria-label="Alphabetischer Index">${alphaLetters
                .map(
                  (l) =>
                    `<button type="button" class="scholars-index__alpha-btn" data-scholars-alpha="${esc(l)}">${esc(l)}</button>`
                )
                .join('')}</div>`
            : ''
        }
      </div>
      ${recentHtml}
      ${bodyHtml}
      ${renderSortSheet(state, esc)}
    </section>`;
  }

  function rerender(root, catalog, esc, patch) {
    const state = { ...readState(), ...patch };
    saveState(state);
    if (patch && Object.keys(patch).every((k) => k === 'scrollY')) {
      saveState(state);
      return;
    }
    const html = renderPage(catalog, esc, { state });
    root.outerHTML = html;
    const next = document.getElementById('scholarsIndexRoot');
    if (next) {
      delete next.dataset.bound;
      bind(next, catalog, esc);
    }
  }

  function openSortSheet(root) {
    const sheet = root.querySelector('#scholarsSortSheet');
    if (!sheet) return;
    sheet.hidden = false;
    document.body.classList.add('scholars-sort-open');
    sheet.querySelector('[aria-checked="true"]')?.focus();
  }

  function closeSortSheet(root) {
    const sheet = root.querySelector('#scholarsSortSheet');
    if (!sheet) return;
    sheet.hidden = true;
    document.body.classList.remove('scholars-sort-open');
    root.querySelector('#scholarsSortBtn')?.focus();
  }

  function bindRowActions(root, esc) {
    root.querySelectorAll('[data-scholar-open]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-scholar-open');
        const catalogItem = (global.buildScholarCatalog?.() || []).find((s) => s.key === id);
        if (catalogItem) pushRecent({ id, displayName: catalogItem.label });
        saveState({ scrollY: global.scrollY || 0 });
        if (typeof global.navigate === 'function') global.navigate('scholar', id);
      };
    });
  }

  function bindAlpha(root) {
    root.querySelectorAll('[data-scholars-alpha]').forEach((btn) => {
      btn.onclick = () => {
        const letter = btn.getAttribute('data-scholars-alpha');
        const target = root.querySelector(`#scholars-group-alpha-${CSS.escape(letter)}`);
        if (target) {
          const top = target.getBoundingClientRect().top + global.scrollY - 120;
          global.DARScrollManager?.stableScrollTo?.(top, { force: true }) || global.scrollTo({ top, behavior: 'auto' });
        }
      };
    });
  }

  function bind(root, catalog, esc) {
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    boundRoot = root;

    const search = root.querySelector('#scholarsSearchInput');
    if (search) {
      search.oninput = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => rerender(root, catalog, esc, { query: search.value || '' }), 120);
      };
    }
    const clear = root.querySelector('#scholarsSearchClear');
    if (clear) {
      clear.onclick = () => {
        if (search) search.value = '';
        rerender(root, catalog, esc, { query: '' });
        search?.focus();
      };
    }
    root.querySelectorAll('[data-scholars-filter]').forEach((btn) => {
      btn.onclick = () => rerender(root, catalog, esc, { filter: btn.getAttribute('data-scholars-filter') || 'all' });
    });
    const sortBtn = root.querySelector('#scholarsSortBtn');
    if (sortBtn) sortBtn.onclick = () => openSortSheet(root);
    root.querySelectorAll('[data-scholars-sort]').forEach((btn) => {
      btn.onclick = () => {
        const sort = btn.getAttribute('data-scholars-sort') || 'generation';
        setJson(SORT_KEY, sort);
        closeSortSheet(root);
        rerender(root, catalog, esc, { sort });
      };
    });
    const sheet = root.querySelector('#scholarsSortSheet');
    if (sheet) {
      sheet.onclick = (e) => {
        if (e.target === sheet) closeSortSheet(root);
      };
    }
    if (!global.__darScholarsEscBound) {
      global.__darScholarsEscBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const open = document.querySelector('#scholarsSortSheet:not([hidden])');
        if (open) closeSortSheet(open.closest('[data-scholars-index]'));
      });
    }
    bindRowActions(root, esc);
    bindAlpha(root);
    const retry = root.querySelector('#scholarsRetryBtn');
    if (retry) retry.onclick = () => global.render?.();
    const reset = root.querySelector('#scholarsResetBtn');
    if (reset) reset.onclick = () => rerender(root, catalog, esc, { query: '', filter: 'all' });

    const y = readState().scrollY;
    if (y > 0) {
      requestAnimationFrame(() => {
        global.DARScrollManager?.stableScrollTo?.(y, { force: true, retry: true }) || global.scrollTo({ top: y, behavior: 'auto' });
        saveState({ scrollY: 0 });
      });
    }
  }

  function renderScholars(catalog, esc) {
    const state = readState();
    return renderPage(catalog, esc, { state, loading: !catalog?.length });
  }

  function bindScholars(catalog, esc) {
    loadMeta().finally(() => {
      const root = document.getElementById('scholarsIndexRoot');
      if (!root) return;
      delete root.dataset.bound;
      const state = readState();
      root.outerHTML = renderPage(catalog, esc, { state });
      const next = document.getElementById('scholarsIndexRoot');
      bind(next, catalog, esc);
    });
    const root = document.getElementById('scholarsIndexRoot');
    if (root) bind(root, catalog, esc);
  }

  global.DARScholarsIndex = {
    renderScholars,
    bindScholars,
    loadMeta,
    pushRecent,
    normalizeSearchText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
