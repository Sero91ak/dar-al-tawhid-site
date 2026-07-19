/* DAR AL TAWḤĪD – Premium 3D Feature Icons (WebP/PNG) */
(function (global) {
  const SIZES = { sm: 42, md: 56, lg: 64, xl: 72, hero: 84 };
  const BASE = '/assets/icons/features';

  const ID_MAP = {
    feed: 'feed',
    quiz: 'din-quiz',
    ilm: 'ilm',
    hadith: 'hadith-library',
    topics: 'posts',
    posts: 'posts',
    quran: 'quran',
    duas: 'dua',
    dua: 'dua',
    scholars: 'scholars',
    books: 'books',
    prayer: 'prayer-times',
    jummah: 'jummah',
    qibla: 'qibla',
    calendar: 'islamic-calendar',
    zakat: 'zakat',
    wasiyyah: 'wasiyyah',
    widgets: 'widgets',
    'image-editor': 'image-editor',
    image: 'image-editor',
    saved: 'saved',
    account: 'account',
    news: 'news',
    about: 'about',
    ramadan: 'ramadan',
    mosque: 'prayer-times',
    'prayer-times': 'prayer-times',
    'din-quiz': 'din-quiz',
    'hadith-library': 'hadith-library',
    'islamic-calendar': 'islamic-calendar',
    newBadge: 'news',
    sparkle: 'news',
    scale: 'about',
    warning: 'about',
    users: 'scholars',
    link: 'posts',
    oneFinger: 'ilm',
    folder: 'posts',
    tafsir: 'quran',
    pen: 'wasiyyah',
    document: 'wasiyyah',
    kaaba: 'qibla',
    compass: 'qibla',
    bell: 'news',
    heart: 'saved',
    location: 'qibla',
    refresh: 'news',
    sun: 'ramadan',
    moon: 'ramadan',
    shield: 'about',
    family: 'scholars',
    food: 'dua',
    travel: 'qibla',
    rain: 'islamic-calendar',
    wind: 'feed',
    leaf: 'zakat',
  };

  function resolveFeatureName(name) {
    const key = String(name || '').trim();
    return ID_MAP[key] || key || 'fallback';
  }

  function featureIcon(name, size, alt) {
    const asset = resolveFeatureName(name);
    const px = SIZES[size] || (typeof size === 'number' ? size : 56);
    const label = alt || '';
    return '<img class="feature-icon-img feature-icon-img--' + (SIZES[size] ? size : 'custom') + '" src="' + BASE + '/' + asset + '.webp" width="' + px + '" height="' + px + '" alt="' + label.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" draggable="false">';
  }

  function featureIconEmblem(name, size, alt) {
    size = size || 'md';
    return '<span class="feature-icon-emblem emoji-emblem" aria-hidden="true">' + featureIcon(name, size, alt) + '</span>';
  }

  function featureIconFromMarkup(type, value, fallback) {
    const key = String(type + ' ' + value + ' ' + fallback).toLowerCase();
    if (key.includes('hadith')) return 'hadith-library';
    if (key.includes('duas') || key.includes('dua') || key.includes('duʿ') || key.includes("du'a") || key.includes('bitt') || key.includes('krank')) return 'dua';
    if (key.includes('topics') || key.includes('themen') || key.includes('kategorien') || key.includes('topic')) return 'posts';
    if (key.includes('scholars') || key.includes('gelehrte')) return 'scholars';
    if (key.includes('books') || key.includes('bücher') || key.includes('buch') || key.includes('book')) return 'books';
    if (key.includes('recent') || key.includes('neueste')) return 'news';
    if (key.includes('saved') || key.includes('gespeichert')) return 'saved';
    if (key.includes('about') || key.includes('maßstab') || key.includes('manhaj')) return 'about';
    if (key.includes('moschee') || key.includes('gebet') || key.includes('prayer')) return 'prayer-times';
    if (key.includes('quran') || key.includes('qur')) return 'quran';
    if (key.includes('quiz')) return 'din-quiz';
    if (key.includes('ilm')) return 'ilm';
    if (key.includes('feed')) return 'feed';
    if (key.includes('zakat')) return 'zakat';
    if (key.includes('wasiyyah') || key.includes('testament')) return 'wasiyyah';
    if (key.includes('calendar') || key.includes('kalender')) return 'islamic-calendar';
    if (key.includes('ramadan')) return 'ramadan';
    return 'fallback';
  }

  function featureIconFromTopic(title) {
    const k = String(title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/shirk/.test(k)) return 'about';
    if (/bid[a']?ah|ahl al-bid/.test(k)) return 'scholars';
    if (/hukm|muhakamah|tahakum|takfir/.test(k)) return 'about';
    if (/sifat|sifa allah/.test(k)) return 'quran';
    if (/sahabah|sahaba|aussagen/.test(k)) return 'scholars';
    if (/du'a|dua|bittgeb/.test(k)) return 'dua';
    if (/tawhid|tauhid/.test(k)) return 'ilm';
    if (/sunnah/.test(k)) return 'hadith-library';
    if (/qur|quran|tafsir/.test(k)) return 'quran';
    if (/isnad|quelle|methodik|uberlief/.test(k)) return 'posts';
    return 'posts';
  }

  function featureIconFromUpdate(item) {
    const key = String([item.type, item.title, item.badge, item.nav, item.value].filter(Boolean).join(' ')).toLowerCase();
    if (/quiz/.test(key)) return 'din-quiz';
    if (/zakat|zakāt/.test(key)) return 'zakat';
    if (/dua|duʿā|bitt/.test(key)) return 'dua';
    if (/serie|hukm|muhakamah/.test(key)) return 'about';
    if (/qur|tafsir/.test(key)) return 'quran';
    if (/post|beitrag/.test(key)) return 'posts';
    if (/ilm/.test(key)) return 'ilm';
    if (/hadith/.test(key)) return 'hadith-library';
    return 'news';
  }

  global.featureIcon = featureIcon;
  global.featureIconEmblem = featureIconEmblem;
  global.featureIconFromMarkup = featureIconFromMarkup;
  global.featureIconFromTopic = featureIconFromTopic;
  global.featureIconFromUpdate = featureIconFromUpdate;
  global.FEATURE_ICON_SIZES = SIZES;
  global.FeatureIcon = featureIcon;
})(typeof window !== 'undefined' ? window : globalThis);
