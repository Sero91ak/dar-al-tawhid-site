
/* DĀR AL TAWḤĪD ʿUmrah — additive, local-first enhancement. No analytics or uploads. */
(function () {
  'use strict';
  var ROOT = '/umrah/';
  var SETTINGS_KEY = 'dar-umrah-ui-v1';
  var settings = { provider: 'internal', language: 'de', sort: 'new', search: '' };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (_) {}
  function persist() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {} }
  function el(id) { return document.getElementById(id); }
  function refLink(href) {
    var u;
    try { u = new URL(href, location.href); } catch (_) { return null; }
    var host = u.hostname.replace(/^www\./, '').toLowerCase();
    var path = u.pathname;
    if (host === 'quran.com') {
      var verse = path.match(/^\/(\d+)\/(\d+)/);
      if (verse) return ROOT + 'quellen.html#quran-' + verse[1] + '-' + verse[2];
    }
    if (host === 'sunnah.com') {
      var hadith = path.match(/^\/(muslim|bukhari):([\w-]+)/);
      if (hadith) return ROOT + 'quellen.html#hadith-' + hadith[1] + '-' + hadith[2];
    }
    if (host === 'umrah.nusuk.sa' || host === 'www.nusuk.sa' || host === 'nusuk.sa') return ROOT + 'quellen.html#service-nusuk';
    if (host === 'alharamain.gov.sa') return ROOT + 'quellen.html#service-haramayn';
    return null;
  }
  function rewriteReferences(scope) {
    if (!scope) return;
    scope.querySelectorAll('a[href]').forEach(function (a) {
      var local = refLink(a.getAttribute('href'));
      if (!local || a.getAttribute('href') === local) return;
      a.href = local;
      a.target = '_self';
      a.removeAttribute('rel');
      a.removeAttribute('onclick');
      a.setAttribute('aria-label', a.textContent.trim() + ' – interne DĀR-Erklärung');
    });
  }
  function initReferences() {
    rewriteReferences(document);
    ['source-list', 'ritual-stage', 'quellen-area'].forEach(function (id) {
      var target = el(id);
      if (!target) return;
      new MutationObserver(function (mutations) {
        if (mutations.some(function (m) { return m.addedNodes.length; })) rewriteReferences(target);
      }).observe(target, { childList: true, subtree: true });
    });
  }

  var placeTranslations = {
    de: { haram: 'Heilige Moschee · Kaʿbah', safa: 'Ṣafā und Marwah', nour: 'Jabal an-Nūr · Höhle Ḥirāʾ', arafat: 'ʿArafāt · Berg der Barmherzigkeit', nabawi: 'Prophetenmoschee', quba: 'Qubāʾ-Moschee', uhud: 'Berg Uḥud' },
    en: { haram: 'Grand Mosque · Kaaba', safa: 'Safa and Marwa', nour: 'Mount of Light · Hira Cave', arafat: 'Arafat · Mount of Mercy', nabawi: "Prophet's Mosque", quba: 'Quba Mosque', uhud: 'Mount Uhud' },
    ar: { haram: 'المسجد الحرام · الكعبة', safa: 'الصفا والمروة', nour: 'جبل النور · غار حراء', arafat: 'عرفات · جبل الرحمة', nabawi: 'المسجد النبوي', quba: 'مسجد قباء', uhud: 'جبل أحد' }
  };
  function currentPlace() {
    if (typeof LOCATIONS === 'undefined' || typeof state === 'undefined') return null;
    var places = LOCATIONS[state.city] || [];
    return places.find(function (p) { return p.id === state.place; }) || places[0];
  }
  function externalMapURL(provider, place) {
    var coord = place.lat.toFixed(5) + ',' + place.lng.toFixed(5);
    if (provider === 'google') return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(coord) + '&travelmode=walking';
    if (provider === 'apple') return 'https://maps.apple.com/?daddr=' + encodeURIComponent(coord) + '&dirflg=w';
    return 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(place.lat) + '&mlon=' + encodeURIComponent(place.lng) + '#map=16/' + place.lat + '/' + place.lng;
  }
  function updateLegend() {
    var places = typeof LOCATIONS === 'undefined' || typeof state === 'undefined' ? [] : (LOCATIONS[state.city] || []);
    document.querySelectorAll('#map-canvas .map-legend span').forEach(function (span, i) {
      var p = places[i];
      if (!p) return;
      var b = span.querySelector('b');
      var name = (placeTranslations[settings.language] || placeTranslations.de)[p.id] || p.name;
      span.textContent = '';
      if (b) span.append(b);
      span.append(document.createTextNode(' ' + name));
      span.lang = settings.language;
      span.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    });
  }
  function syncMapView() {
    var place = currentPlace(), canvas = el('map-canvas'), message = el('dar-map-message');
    if (!place || !canvas || !message) return;
    var translated = (placeTranslations[settings.language] || placeTranslations.de)[place.id] || place.name;
    el('dar-map-place').textContent = translated;
    el('dar-map-place').lang = settings.language;
    el('dar-map-place').dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    var current = el('dar-map-action');
    if (current) current.remove();
    var action = document.createElement('a');
    action.id = 'dar-map-action';
    action.className = 'dar-map-action';
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    var button = el('load-live-map');
    if (settings.provider === 'osm') {
      button.textContent = 'Live-Karte aktualisieren';
      message.textContent = 'Live-Karte: OpenStreetMap. Die Straßennamen stammen aus den Kartendaten und können nicht zuverlässig in eine andere Sprache umgestellt werden. Die eigene Ortsliste ist sprachwählbar.';
      if (navigator.onLine) {
        var p = 0.017;
        var bbox = [place.lng - p, place.lat - p * 0.7, place.lng + p, place.lat + p * 0.7].join(',');
        var frame = document.createElement('iframe');
        frame.title = 'OpenStreetMap – ' + translated;
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + encodeURIComponent(bbox) + '&layer=mapnik&marker=' + place.lat + '%2C' + place.lng;
        canvas.replaceChildren(frame);
      } else {
        if (typeof renderOfflineMap === 'function') renderOfflineMap(state.city, place);
        updateLegend();
        message.textContent = 'Offline: Die interne Koordinatenübersicht bleibt verfügbar.';
      }
      action.href = externalMapURL('osm', place);
      action.textContent = 'OpenStreetMap öffnen';
    } else {
      if (typeof renderOfflineMap === 'function') renderOfflineMap(state.city, place);
      updateLegend();
      if (settings.provider === 'google' || settings.provider === 'apple') {
        action.href = externalMapURL(settings.provider, place);
        action.textContent = settings.provider === 'google' ? 'Google Maps starten' : 'Apple Karten starten';
        button.textContent = 'Gewählte Karten-App öffnen';
        message.textContent = 'Die Standortübersicht bleibt hier in DĀR AL TAWḤĪD. Die interaktive Navigation wird auf Wunsch in der gewählten Karten-App geöffnet.';
      } else {
        button.textContent = 'Live-Karte laden';
        message.textContent = 'Interne Orientierung mit eigenen Standortnamen in der gewählten Sprache; keine erfundenen Straßen, Strecken oder Entfernungen.';
        action.href = externalMapURL('osm', place);
        action.textContent = 'Optionale externe Karte öffnen';
      }
    }
    message.after(action);
  }
  function initMaps() {
    var container = document.querySelector('#page-orte .map-workspace');
    if (!container) return;
    var controls = document.createElement('div');
    controls.className = 'dar-map-controls';
    controls.setAttribute('aria-label', 'Kartendarstellung und Sprache');
    controls.innerHTML =
      '<label for="dar-map-provider">Kartenansicht<select id="dar-map-provider">' +
        '<option value="internal">DĀR · intern / offline</option>' +
        '<option value="osm">OpenStreetMap · live</option>' +
        '<option value="google">Google Maps · Navigation</option>' +
        '<option value="apple">Apple Karten · Navigation</option>' +
      '</select></label>' +
      '<label for="dar-map-language">Ortsnamen<select id="dar-map-language">' +
        '<option value="de">Deutsch</option><option value="en">English</option><option value="ar">العربية</option>' +
      '</select></label>';
    container.querySelector('.map-header').after(controls);
    var label = document.createElement('small');
    label.id = 'dar-map-place';
    label.className = 'dar-place-label';
    controls.after(label);
    var message = document.createElement('p');
    message.id = 'dar-map-message';
    message.className = 'dar-map-message';
    label.after(message);
    if (!['internal', 'osm', 'google', 'apple'].includes(settings.provider)) settings.provider = 'internal';
    if (!['de', 'en', 'ar'].includes(settings.language)) settings.language = 'de';
    el('dar-map-provider').value = settings.provider;
    el('dar-map-language').value = settings.language;
    el('dar-map-provider').addEventListener('change', function (e) { settings.provider = e.target.value; persist(); syncMapView(); });
    el('dar-map-language').addEventListener('change', function (e) { settings.language = e.target.value; persist(); syncMapView(); });
    el('load-live-map').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var place = currentPlace();
      if (!place) return;
      if (settings.provider === 'google' || settings.provider === 'apple') {
        window.open(externalMapURL(settings.provider, place), '_blank', 'noopener,noreferrer');
      } else {
        settings.provider = 'osm';
        el('dar-map-provider').value = 'osm';
        persist();
        syncMapView();
      }
    }, true);
    var title = el('selected-place-title');
    if (title) new MutationObserver(function () {
      if (el('page-orte').classList.contains('active')) syncMapView();
    }).observe(title, { childList: true, characterData: true, subtree: true });
    syncMapView();
  }

  var sortLock = false;
  function arrangeGallery() {
    if (sortLock || typeof state === 'undefined') return;
    var gallery = el('photo-gallery');
    if (!gallery) return;
    var cards = Array.from(gallery.querySelectorAll(':scope > .photo-card'));
    if (!cards.length) return;
    var records = cards.map(function (card) {
      var note = card.querySelector('[data-photo-note]');
      var id = note && note.dataset.photoNote;
      var meta = state.photoMeta.find(function (item) { return item.id === id; }) || {};
      return { card: card, meta: meta };
    });
    records.sort(function (a, b) {
      if (settings.sort === 'name') return (a.meta.name || '').localeCompare(b.meta.name || '', 'de');
      if (settings.sort === 'place') return (a.meta.place || '').localeCompare(b.meta.place || '', 'de') || (a.meta.name || '').localeCompare(b.meta.name || '');
      if (settings.sort === 'old') return (a.meta.id || '').localeCompare(b.meta.id || '');
      return (b.meta.id || '').localeCompare(a.meta.id || '');
    });
    var query = (settings.search || '').trim().toLocaleLowerCase('de');
    records.forEach(function (entry) {
      var text = [entry.meta.name, entry.meta.place, entry.meta.caption, entry.card.querySelector('textarea')?.value].join(' ').toLocaleLowerCase('de');
      entry.card.hidden = !!query && !text.includes(query);
    });
    if (!records.every(function (item, i) { return item.card === cards[i]; })) {
      sortLock = true;
      records.forEach(function (item) { gallery.appendChild(item.card); });
      sortLock = false;
    }
  }
  function initJournal() {
    var page = el('page-journal'), gallery = el('photo-gallery');
    if (!page || !gallery) return;
    var tools = document.createElement('div');
    tools.className = 'dar-journal-tools';
    tools.innerHTML =
      '<label for="dar-photo-search">Fotos durchsuchen<input id="dar-photo-search" type="search" placeholder="Name, Bildnotiz, Ort …" autocomplete="off"></label>' +
      '<label for="dar-photo-sort">Fotos sortieren<select id="dar-photo-sort">' +
      '<option value="new">Neueste zuerst</option><option value="old">Älteste zuerst</option>' +
      '<option value="name">Dateiname A–Z</option><option value="place">Nach Ort</option></select></label>';
    gallery.before(tools);
    el('dar-photo-sort').value = settings.sort;
    el('dar-photo-search').value = settings.search;
    el('dar-photo-sort').addEventListener('change', function (event) { settings.sort = event.target.value; persist(); arrangeGallery(); });
    el('dar-photo-search').addEventListener('input', function (event) { settings.search = event.target.value; persist(); arrangeGallery(); });
    gallery.addEventListener('input', function (event) {
      if (event.target.matches('[data-photo-note]')) arrangeGallery();
    });
    new MutationObserver(function (ms) {
      if (sortLock || !ms.some(function (m) { return m.addedNodes.length; })) return;
      queueMicrotask(arrangeGallery);
    }).observe(gallery, { childList: true });
    ['dragenter', 'dragover'].forEach(function (name) {
      page.addEventListener(name, function (e) {
        if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return;
        e.preventDefault(); gallery.classList.add('dar-dropzone');
      });
    });
    page.addEventListener('dragleave', function (e) {
      if (!page.contains(e.relatedTarget)) gallery.classList.remove('dar-dropzone');
    });
    page.addEventListener('drop', async function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault(); gallery.classList.remove('dar-dropzone');
      if (typeof addPhotos === 'function') await addPhotos(Array.from(e.dataTransfer.files));
      arrangeGallery();
    });
    var privacy = document.createElement('p');
    privacy.className = 'dar-local-only';
    privacy.textContent = 'iPad, Smartphone und Desktop: Bilder auswählen oder am Desktop hier hineinziehen. Die Fotos bleiben auf diesem Gerät; Geräte-Synchronisation erfolgt nicht automatisch.';
    tools.after(privacy);
    arrangeGallery();
  }

  function initReport() {
    if (typeof window.buildReport !== 'function') return;
    var original = window.buildReport;
    window.buildReport = async function () {
      var report = await original();
      var sections = Array.from(report.querySelectorAll('section.pr-page'));
      sections.forEach(function (section) {
        var figures = Array.from(section.querySelectorAll(':scope > figure.pr-photo'));
        if (!figures.length) return;
        figures.forEach(function (figure) { figure.remove(); });
        var heading = section.querySelector('h2');
        var title = heading ? heading.textContent : 'Persönliche Erinnerungen';
        var anchor = section;
        for (var i = 0; i < figures.length; i += 2) {
          var page = document.createElement('section');
          page.className = 'pr-page pr-photo-page';
          var h2 = document.createElement('h2');
          h2.textContent = title + ' · Bilder ' + (i + 1) + '–' + Math.min(i + 2, figures.length);
          page.appendChild(h2);
          var spread = document.createElement('div');
          spread.className = 'pr-photo-spread';
          spread.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6mm;align-items:start;break-inside:avoid;page-break-inside:avoid';
          figures.slice(i, i + 2).forEach(function (figure) {
            figure.style.cssText = 'display:block;width:100%;max-width:100%;margin:0;break-inside:avoid;page-break-inside:avoid';
            var img = figure.querySelector('img');
            if (img) img.style.cssText = 'display:block;width:100%;max-width:100%;height:145mm;max-height:145mm;object-fit:contain';
            spread.appendChild(figure);
          });
          page.appendChild(spread);
          anchor.after(page);
          anchor = page;
        }
        if (!section.querySelector('.pr-note')) section.remove();
      });
      var style = document.createElement('style');
      style.textContent = '@media print{@page{size:A4;margin:14mm}.pr-photo-page{page-break-before:always;break-before:page;min-height:235mm}.pr-photo-spread{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6mm;break-inside:avoid}.pr-photo-spread img{width:100%;height:145mm;max-height:145mm;object-fit:contain}.pr-photo-spread figure{margin:0;break-inside:avoid}}';
      report.prepend(style);
      return report;
    };
  }
  function init() {
    if (!el('shell') || !el('page-journal') || !el('page-orte')) return;
    initReferences();
    initMaps();
    initJournal();
    initReport();
    document.documentElement.dataset.umrahUpgrade = 'v1';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
