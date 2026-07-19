/* DAR AL TAWḤĪD – Premium App Icon System (SVG, theme-aware via currentColor) */
(function (global) {
  const SIZES = { xs: 14, sm: 16, md: 18, lg: 20, xl: 24, hero: 28 };

  const ICONS = {
    home: '<path fill="currentColor" d="M4.5 10.2 12 4l7.5 6.2V19a1.6 1.6 0 0 1-1.6 1.6H14.8v-5.2H9.2V20.6H6.1A1.6 1.6 0 0 1 4.5 19V10.2Z"/><path fill="currentColor" fill-opacity=".35" d="M8.2 11.2h7.6v8.4H8.2z"/>',
    quiz: '<path fill="currentColor" d="M7.2 4.8h9.6c2.2 0 4 1.8 4 4v1.2c0 2.2-1.8 4-4 4h-5.2l-3.2 3.4V14H7.2c-2.2 0-4-1.8-4-4V8.8c0-2.2 1.8-4 4-4Z"/><path fill="currentColor" fill-opacity=".42" d="M9.4 8.2h5.2v1.5H9.4V8.2Zm0 3.1h3.4v1.5H9.4v-1.5Z"/>',
    feed: '<path fill="currentColor" d="M12 3.2l1.4 4.3h4.6l-3.7 2.7 1.4 4.3L12 11.8 8.3 14.5l1.4-4.3-3.7-2.7h4.6L12 3.2Z"/><path fill="currentColor" fill-opacity=".35" d="M12 6.8v7.6l2.8 2 1-3.1-3.8-2.8V6.8Z"/>',
    quran: '<path fill="currentColor" d="M6.2 5.2c2.4-.8 4.8-.8 7.2 0 1.2.4 2.4.4 3.6 0v12.8c-1.2.4-2.4.4-3.6 0-2.4-.8-4.8-.8-7.2 0V5.2Z"/><path fill="currentColor" fill-opacity=".38" d="M12 5.8c1.8.2 3.6.6 5.2 1.2v10.4c-1.6-.6-3.4-1-5.2-1.2V5.8Z"/><path fill="currentColor" fill-opacity=".55" d="M9.2 9.4h5.6v1.3H9.2V9.4Zm0 2.8h4.2v1.3H9.2v-1.3Z"/>',
    more: '<path fill="currentColor" d="M5.2 6.4h13.6v1.8H5.2V6.4Zm0 5.2h13.6v1.8H5.2v-1.8Zm0 5.2h13.6v1.8H5.2v-1.8Z"/>',
    ilm: '<path fill="currentColor" d="M5.4 6.8c2.8-1.2 5.8-1.2 8.6 0 .8.3 1.6.3 2.4 0l.8 9.8c-.8.3-1.6.3-2.4 0-2.8-1.2-5.8-1.2-8.6 0-.8.3-1.6.3-2.4 0l.8-9.8Z"/><path fill="currentColor" fill-opacity=".4" d="M12 7.6c1.6.2 3.2.6 4.6 1.2v7.4c-1.4-.6-3-.9-4.6-1.2V7.6Z"/><path fill="currentColor" d="M11.2 4.2l.8 2.4h2.6l-2.1 1.6.8 2.4-2.1-1.6-2.1 1.6.8-2.4-2.1-1.6h2.6l.8-2.4Z"/>',
    posts: '<path fill="currentColor" d="M5.8 6.2h5.2v12.4H5.8V6.2Zm6.4 2.4h5.2v10H12.2V8.6Zm-8.8 2h3.6v8.4H3.4v-8.4Zm12.8 2.4h3.6v6H16.2v-6Z"/><path fill="currentColor" fill-opacity=".35" d="M7.2 8.4h2.4v8H7.2v-8Zm6.4 2.4h2.4v5.6h-2.4v-5.6Z"/>',
    dua: '<path fill="currentColor" d="M8.2 8.8c.8-1.6 2.4-2.6 4-2.6s3.2 1 4 2.6c1.4 1.2 2.2 3 2.2 4.9V16c0 .8-.6 1.4-1.4 1.4h-9.6c-.8 0-1.4-.6-1.4-1.4v-2.3c0-1.9.8-3.7 2.2-4.9Z"/><path fill="currentColor" fill-opacity=".42" d="M10.2 11.2h3.6v1.4h-3.6v-1.4Zm-.8 3.2h5.2v1.4h-5.2v-1.4Z"/>',
    scholars: '<circle fill="currentColor" cx="12" cy="8.2" r="3.2"/><path fill="currentColor" d="M5.8 18.4c.6-3 3.2-5.2 6.2-5.2s5.6 2.2 6.2 5.2"/><path fill="currentColor" fill-opacity=".38" d="M14.8 12.4l2.8 1.6-1.2 2.2-2.4-1.4v-2.4Z"/>',
    books: '<path fill="currentColor" d="M4.8 6.4h6.8v12.8H4.8V6.4Zm8 2.4h6.8v10.4h-6.8V8.8Z"/><path fill="currentColor" fill-opacity=".38" d="M6.4 8.4h3.6v9.2H6.4V8.4Zm8 2h3.6v7.2h-3.6v-7.2Z"/>',
    prayer: '<path fill="currentColor" d="M5.4 10.2V19h1.2v-8.4l-.4-1.1 1-.6.45 1V19h1.2v-9.6L7 9.2 5.4 10.2Zm13.2 0V19h1.2v-8.4l-.4-1.1 1-.6.45 1V19H22v-9.6l-1.4-1.1-1.6 1.1Z"/><path fill="currentColor" d="M9.4 13.4h5.2v6.2c0 .4-.3.8-.8.8h-3.6c-.4 0-.8-.4-.8-.8v-6.2Z"/><path fill="currentColor" fill-opacity=".45" d="M12 5.2c-2.2 0-4 1.6-4.4 3.7h8.8C16 6.8 14.2 5.2 12 5.2Z"/><path fill="currentColor" d="M12 3.4c-2.8 0-5.1 2.1-5.5 4.8h11C17.1 5.5 14.8 3.4 12 3.4Z"/>',
    jummah: '<path fill="currentColor" d="M5.4 10.2V19h1.2v-8.4l-.4-1.1 1-.6.45 1V19h1.2v-9.6L7 9.2 5.4 10.2Zm13.2 0V19h1.2v-8.4l-.4-1.1 1-.6.45 1V19H22v-9.6l-1.4-1.1-1.6 1.1Z"/><path fill="currentColor" d="M9.4 13.4h5.2v6.2c0 .4-.3.8-.8.8h-3.6c-.4 0-.8-.4-.8-.8v-6.2Z"/><path fill="currentColor" fill-opacity=".45" d="M12 5.2c-2.2 0-4 1.6-4.4 3.7h8.8C16 6.8 14.2 5.2 12 5.2Z"/>',
    qibla: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="7.8"/><path fill="currentColor" d="M12 4.2 13.4 10H12l-1.4-5.8Z"/><path fill="currentColor" fill-opacity=".45" d="M12 20l-1.4-6H12l1.4 6Z"/><circle fill="currentColor" cx="12" cy="12" r="1.4"/>',
    kaaba: '<path fill="currentColor" d="M6.8 9.2 12 6.2l5.2 3v9.4H6.8V9.2Z"/><path fill="currentColor" fill-opacity=".38" d="M8.4 10.4h7.2v7.2H8.4v-7.2Z"/><path fill="currentColor" d="M10.2 8.8h3.6v1.4h-3.6V8.8Z"/>',
    calendar: '<path fill="currentColor" d="M6.4 5.6h11.2c1 0 1.8.8 1.8 1.8v11.2c0 1-.8 1.8-1.8 1.8H6.4c-1 0-1.8-.8-1.8-1.8V7.4c0-1 .8-1.8 1.8-1.8Z"/><path fill="currentColor" fill-opacity=".35" d="M5.2 9.2h13.6v9.4H5.2V9.2Z"/><path fill="currentColor" d="M8.2 4.2v3.2M15.8 4.2v3.2M8.6 12.4h2.4v2.4H8.6v-2.4Zm4.4 0h2.4v2.4H13v-2.4Z"/>',
    zakat: '<path fill="currentColor" d="M7.2 7.4h9.6c1.2 0 2.2 1 2.2 2.2v7.2c0 1.2-1 2.2-2.2 2.2H7.2c-1.2 0-2.2-1-2.2-2.2V9.6c0-1.2 1-2.2 2.2-2.2Z"/><path fill="currentColor" fill-opacity=".38" d="M8.8 10.4h6.4v5.6H8.8v-5.6Z"/><path fill="currentColor" d="M10.4 6.2h3.2v2.2h-3.2V6.2Zm-1.6 11.2h6.4v1.4H8.8v-1.4Z"/>',
    wasiyyah: '<path fill="currentColor" d="M7.2 4.8h9.6c.8 0 1.4.6 1.4 1.4v12.8c0 .8-.6 1.4-1.4 1.4H7.2c-.8 0-1.4-.6-1.4-1.4V6.2c0-.8.6-1.4 1.4-1.4Z"/><path fill="currentColor" fill-opacity=".38" d="M9 7.4h6v1.4H9V7.4Zm0 2.8h6v1.4H9v-1.4Zm0 2.8h4.2v1.4H9v-1.4Z"/><path fill="currentColor" d="M15.8 16.2l2.4 2.4-1 1-2.4-2.4 1-1Z"/>',
    widgets: '<path fill="currentColor" d="M5.2 5.2h6.4v6.4H5.2V5.2Zm7.2 0h6.4v6.4h-6.4V5.2ZM5.2 12.4h6.4v6.4H5.2v-6.4Zm7.2 3.2h2.4v3.2h-2.4v-3.2Zm4 0h2.4v3.2h-2.4v-3.2Z"/>',
    image: '<path fill="currentColor" d="M5.2 6.4h13.6c.8 0 1.4.6 1.4 1.4v10.4c0 .8-.6 1.4-1.4 1.4H5.2c-.8 0-1.4-.6-1.4-1.4V7.8c0-.8.6-1.4 1.4-1.4Z"/><path fill="currentColor" fill-opacity=".38" d="M7.2 14.2l2.8-2.4 3.2 2.8 2.4-2 3.2 4.8H7.2v-3.2Z"/><circle fill="currentColor" cx="9.2" cy="10.2" r="1.4"/>',
    saved: '<path fill="currentColor" d="M12 5.2 14.8 9l4.4.6-3.2 3.1.8 4.4L12 15.4 7.2 17.1l.8-4.4-3.2-3.1 4.4-.6L12 5.2Z"/>',
    account: '<rect fill="currentColor" x="5.2" y="10.4" width="13.6" height="9.2" rx="1.6"/><path fill="currentColor" d="M8.8 10.4V8.8c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2v1.6"/><circle fill="currentColor" fill-opacity=".42" cx="12" cy="14.2" r="1.6"/>',
    news: '<path fill="currentColor" d="M12 3.2l1.6 4.8h5l-4 2.9 1.5 4.8L12 12.8 7.9 15.7l1.5-4.8-4-2.9h5L12 3.2Z"/><path fill="currentColor" fill-opacity=".35" d="M8.8 16.4h6.4v1.6H8.8v-1.6Zm0 2.4h4.8v1.6H8.8v-1.6Z"/>',
    settings: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="3.2"/><path fill="currentColor" d="M12 4.2v2.2M12 17.6v2.2M4.2 12h2.2M17.6 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M6.1 17.9l1.6-1.6M16.3 7.7l1.6-1.6"/>',
    about: '<circle fill="currentColor" cx="12" cy="12" r="8.2"/><path fill="currentColor" fill-opacity=".35" d="M12 7.2v1.4M11.2 11.2h1.6v5.2h-1.6v-5.2Z"/>',
    ramadan: '<path fill="currentColor" d="M14.8 5.2c3.2.8 5.6 3.6 5.6 7 0 4-3.2 7.2-7.2 7.2-3.4 0-6.2-2.4-7-5.6 2.8.4 5.4-1.2 6.2-3.8-.8 2.6-3.4 4.2-6.2 3.8 1.2-3.4 4.2-5.8 7.8-5.8 0-.4 0-.8-.4-1.2Z"/>',
    compass: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="7.8"/><path fill="currentColor" d="M12 4.6 13.2 10H12l-1.2-5.4Z"/><path fill="currentColor" fill-opacity=".45" d="M12 19.4l-1.2-6H12l1.2 6Z"/><circle fill="currentColor" cx="12" cy="12" r="1.2"/>',
    bell: '<path fill="currentColor" d="M12 4.2c-2.4 0-4.4 2-4.4 4.4v3.2L5.8 14.8h12.4L16.4 11.8V8.6C16.4 6.2 14.4 4.2 12 4.2Z"/><path fill="currentColor" fill-opacity=".42" d="M10.2 16.8c0 1 0.8 1.8 1.8 1.8s1.8-0.8 1.8-1.8"/><path fill="currentColor" d="M9.2 5.8c.8-1.4 2.4-2.4 4.2-2.4"/>',
    heart: '<path fill="currentColor" d="M12 6.2c1.4-1.8 4.2-2 5.8-.4 1.6 1.6 1.6 4.2 0 5.8L12 18.2 6.2 11.6c-1.6-1.6-1.6-4.2 0-5.8 1.6-1.6 4.4-1.4 5.8.4Z"/>',
    location: '<path fill="currentColor" d="M12 3.2c-3.4 0-6.2 2.8-6.2 6.2 0 4.6 6.2 11.4 6.2 11.4s6.2-6.8 6.2-11.4C18.2 6 15.4 3.2 12 3.2Z"/><circle fill="currentColor" fill-opacity=".42" cx="12" cy="9.4" r="2"/>',
    search: '<circle fill="none" stroke="currentColor" stroke-width="1.8" cx="10.6" cy="10.6" r="5.8"/><path fill="currentColor" d="M15.2 15.2 19.4 19.4"/>',
    filter: '<path fill="currentColor" d="M4.8 6.2h14.4v1.8H4.8V6.2Zm2.4 5.2h9.6v1.8H7.2v-1.8Zm2.4 5.2h4.8v1.8h-4.8v-1.8Z"/>',
    share: '<path fill="currentColor" d="M14.8 5.2 19.4 9.8l-4.6 4.6V11.2c-3.2 0-5.8 1-7.6 3.4.8-3.8 2.8-6.8 7.6-9.4Z"/><path fill="currentColor" fill-opacity=".42" d="M6.8 14.2c0 3 2.4 5.4 5.4 5.4h2.6v-2.2H12.2c-1.8 0-3.2-1.4-3.2-3.2v-4.4Z"/>',
    copy: '<rect fill="currentColor" x="8.2" y="8.2" width="9.6" height="9.6" rx="1.4"/><path fill="currentColor" fill-opacity=".42" d="M6.2 6.2h9.6v9.6H6.2V6.2Z"/>',
    source: '<path fill="currentColor" d="M6.4 5.2h11.2c.8 0 1.4.6 1.4 1.4v12c0 .8-.6 1.4-1.4 1.4H6.4c-.8 0-1.4-.6-1.4-1.4V6.6c0-.8.6-1.4 1.4-1.4Z"/><path fill="currentColor" fill-opacity=".38" d="M8.4 8.8h7.2v1.4H8.4V8.8Zm0 2.8h7.2v1.4H8.4v-1.4Zm0 2.8h4.8v1.4H8.4v-1.4Z"/>',
    bookmark: '<path fill="currentColor" d="M7.2 4.8h9.6v14.4l-4.8-3.2-4.8 3.2V4.8Z"/>',
    tafsir: '<path fill="currentColor" d="M5.4 6.8c2.8-1.2 5.8-1.2 8.6 0 .8.3 1.6.3 2.4 0l.8 9.8c-.8.3-1.6.3-2.4 0-2.8-1.2-5.8-1.2-8.6 0-.8.3-1.6.3-2.4 0l.8-9.8Z"/><path fill="currentColor" fill-opacity=".4" d="M12 7.6c1.6.2 3.2.6 4.6 1.2v7.4c-1.4-.6-3-.9-4.6-1.2V7.6Z"/>',
    sun: '<circle fill="currentColor" cx="12" cy="12" r="4"/><path fill="currentColor" d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>',
    moon: '<path fill="currentColor" d="M14.8 5.2c3.2.8 5.6 3.6 5.6 7 0 4-3.2 7.2-7.2 7.2-3.4 0-6.2-2.4-7-5.6 2.8.4 5.4-1.2 6.2-3.8-.8 2.6-3.4 4.2-6.2 3.8 1.2-3.4 4.2-5.8 7.8-5.8 0-.4 0-.8-.4-1.2Z"/>',
    sunrise: '<path fill="currentColor" d="M4.8 15.2h14.4M12 6.8V4.2M7.4 8.8l-1.7-1.7M16.6 8.8l1.7-1.7M6.2 12.4l-1.4 1.4M17.8 12.4l1.4 1.4"/><path fill="currentColor" fill-opacity=".42" d="M7.2 15.2c0-2.6 2.2-4.8 4.8-4.8s4.8 2.2 4.8 4.8"/>',
    sunset: '<path fill="currentColor" d="M4.8 15.2h14.4M7.4 10.4l-1.7 1.7M16.6 10.4l1.7 1.7"/><path fill="currentColor" fill-opacity=".42" d="M7.2 15.2c0-2.6 2.2-4.8 4.8-4.8s4.8 2.2 4.8 4.8"/>',
    shield: '<path fill="currentColor" d="M12 3.2 6.8 5.6v5.8c0 3.8 2.2 7.2 5.2 8.8 3-1.6 5.2-5 5.2-8.8V5.6L12 3.2Z"/><path fill="currentColor" fill-opacity=".38" d="M12 7.2v8.4"/>',
    family: '<path fill="currentColor" d="M6.8 11.2h10.4v8H6.8v-8Z"/><path fill="currentColor" d="M9.2 8.8c0-1.2 1-2.2 2.2-2.2h1.2c1.2 0 2.2 1 2.2 2.2v2.4H9.2V8.8Z"/><path fill="currentColor" fill-opacity=".42" d="M5.2 19.2h13.6v1.2H5.2v-1.2Z"/>',
    food: '<circle fill="currentColor" cx="12" cy="12" r="6.8"/><path fill="currentColor" fill-opacity=".38" d="M8.2 12h7.6M12 8.2v7.6"/>',
    travel: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="7.8"/><path fill="currentColor" d="M12 4.6 13.2 10H12l-1.2-5.4Z"/>',
    rain: '<path fill="currentColor" d="M7.2 8.8c0-2.6 2.2-4.8 4.8-4.8s4.8 2.2 4.8 4.8"/><path fill="currentColor" fill-opacity=".42" d="M8.2 12.4v2.4M12 13.6v2.4M15.8 12.4v2.4"/>',
    wind: '<path fill="currentColor" d="M5.2 8.8h8.4c1.2 0 2.2-1 2.2-2.2S14.8 4.4 13.6 4.4H12"/><path fill="currentColor" fill-opacity=".42" d="M5.2 12.4h10.4c1.6 0 2.8 1.2 2.8 2.8s-1.2 2.8-2.8 2.8H10.4"/><path fill="currentColor" d="M5.2 16h6.4"/>',
    leaf: '<path fill="currentColor" d="M12 4.2c4.2 2.4 6.8 6.2 6.8 10.6 0 .8-.6 1.4-1.4 1.4-3.2 0-6-1.4-8-3.8C7.8 8.8 9.6 5.8 12 4.2Z"/><path fill="currentColor" fill-opacity=".42" d="M8.8 14.8 12 18.2"/>',
    warning: '<path fill="currentColor" d="M12 4.2 20.2 18H3.8L12 4.2Z"/><path fill="currentColor" fill-opacity=".35" d="M12 9.2v4.8"/><circle fill="currentColor" cx="12" cy="16.4" r="1"/>',
    scale: '<path fill="currentColor" d="M12 4.2v15.2M6.8 7.2h10.4"/><path fill="currentColor" fill-opacity=".42" d="M5.2 9.2 8.8 14h-7.6Zm14.8 0L16.4 14h7.6Z"/>',
    users: '<circle fill="currentColor" cx="8.8" cy="9.2" r="2.4"/><circle fill="currentColor" cx="15.2" cy="9.2" r="2.4"/><path fill="currentColor" fill-opacity=".42" d="M4.8 17.6c.4-2.4 2.4-4 4-4s3.6 1.6 4 4M13.2 17.6c.4-2.4 2.4-4 4-4"/>',
    link: '<path fill="currentColor" d="M9.2 14.8 14.8 9.2"/><path fill="currentColor" fill-opacity=".42" d="M10.4 8.8h5.6v5.6M8.8 10.4v5.6H14.4"/>',
    check: '<path fill="currentColor" d="M5.2 12.4 9.8 17l9-9.2"/>',
    close: '<path fill="currentColor" d="M7.2 7.2 16.8 16.8M16.8 7.2 7.2 16.8"/>',
    'chevron-down': '<path fill="currentColor" d="M6.8 9.2 12 14.4l5.2-5.2"/>',
    'chevron-up': '<path fill="currentColor" d="M6.8 14.8 12 9.6l5.2 5.2"/>',
    'chevron-right': '<path fill="currentColor" d="M9.2 6.8 14.4 12l-5.2 5.2"/>',
    'chevron-left': '<path fill="currentColor" d="M14.8 6.8 9.6 12l5.2 5.2"/>',
    'arrow-right': '<path fill="currentColor" d="M5.2 12h11.6M13.6 8.8 17.2 12l-3.6 3.2"/>',
    'arrow-left': '<path fill="currentColor" d="M18.8 12H7.2M10.4 8.8 6.8 12l3.6 3.2"/>',
    'arrow-up-right': '<path fill="currentColor" d="M7.2 16.8 16.8 7.2M11.2 7.2h5.6v5.6"/>',
    menu: '<path fill="currentColor" d="M5.2 6.4h13.6v1.8H5.2V6.4Zm0 5.2h13.6v1.8H5.2v-1.8Zm0 5.2h13.6v1.8H5.2v-1.8Z"/>',
    pin: '<path fill="currentColor" d="M12 3.2 13.6 8.8h4.4l-3.6 2.8 1.4 5.6-5.4-3.8-5.4 3.8 1.4-5.6-3.6-2.8h4.4L12 3.2Z"/>',
    'pin-outline': '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3.2 13.6 8.8h4.4l-3.6 2.8 1.4 5.6-5.4-3.8-5.4 3.8 1.4-5.6-3.6-2.8h4.4L12 3.2Z"/>',
    star: '<path fill="currentColor" d="M12 4.2 14.4 9.2l5.2.8-3.8 3.6.9 5.2L12 15.8 7.3 18.8l.9-5.2-3.8-3.6 5.2-.8L12 4.2Z"/>',
    'star-outline': '<path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 4.2 14.4 9.2l5.2.8-3.8 3.6.9 5.2L12 15.8 7.3 18.8l.9-5.2-3.8-3.6 5.2-.8L12 4.2Z"/>',
    pen: '<path fill="currentColor" d="M15.2 5.2 18.8 8.8 8.8 18.8H5.2v-3.6L15.2 5.2Z"/><path fill="currentColor" fill-opacity=".42" d="M13.6 6.8 17.2 10.4"/>',
    document: '<path fill="currentColor" d="M7.2 4.8h7.2l3.6 3.6v11.6H7.2V4.8Z"/><path fill="currentColor" fill-opacity=".38" d="M14.4 4.8V8.4h3.6"/><path fill="currentColor" d="M9.2 12h5.6v1.4H9.2V12Zm0 2.8h4.2v1.4H9.2v-1.4Z"/>',
    refresh: '<path fill="currentColor" d="M18.4 8.8V5.2h-3.6"/><path fill="currentColor" fill-opacity=".42" d="M5.6 15.2v3.6h3.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M6.8 8.8A6 6 0 0 1 17.2 7.2M17.2 15.2A6 6 0 0 1 6.8 16.8"/>',
    lock: '<rect fill="currentColor" x="6.8" y="10.4" width="10.4" height="8.8" rx="1.6"/><path fill="currentColor" d="M9.2 10.4V8.4c0-1.6 1.2-2.8 2.8-2.8s2.8 1.2 2.8 2.8v2"/>',
    eye: '<path fill="currentColor" d="M3.2 12s3.2-5.6 8.8-5.6S20.8 12 20.8 12s-3.2 5.6-8.8 5.6S3.2 12 3.2 12Z"/><circle fill="currentColor" fill-opacity=".42" cx="12" cy="12" r="2.4"/>',
    folder: '<path fill="currentColor" d="M4.8 7.2h5.2l1.6 1.6h7.6c.8 0 1.4.6 1.4 1.4v8c0 .8-.6 1.4-1.4 1.4H4.8c-.8 0-1.4-.6-1.4-1.4V8.6c0-.8.6-1.4 1.4-1.4Z"/>',
    newBadge: '<circle fill="currentColor" cx="12" cy="12" r="7.8"/><path fill="currentColor" fill-opacity=".35" d="M8.8 12h6.4M12 8.8v6.4"/>',
    sparkle: '<path fill="currentColor" d="M12 3.2l1.4 4.3h4.6l-3.7 2.7 1.4 4.3L12 11.8 8.3 14.5l1.4-4.3-3.7-2.7h4.6L12 3.2Z"/>',
    hadith: '<path fill="currentColor" d="M6.2 5.2c2.4-.8 4.8-.8 7.2 0 1.2.4 2.4.4 3.6 0v12.8c-1.2.4-2.4.4-3.6 0-2.4-.8-4.8-.8-7.2 0V5.2Z"/><path fill="currentColor" fill-opacity=".38" d="M12 7.2v9.2"/><path fill="currentColor" d="M15.8 16.2l2.4 2.4-1 1-2.4-2.4 1-1Z"/>',
    puzzle: '<path fill="currentColor" d="M8.8 5.2h6.4c.8 0 1.4.6 1.4 1.4v2.2c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2v2.2c0 .8-.6 1.4-1.4 1.4H8.8c-.8 0-1.4-.6-1.4-1.4v-2.2c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2V6.6c0-.8.6-1.4 1.4-1.4Z"/>',
    receipt: '<path fill="currentColor" d="M7.2 4.8h9.6l1.4 2.2v12.2c0 .8-.6 1.4-1.4 1.4H7.2c-.8 0-1.4-.6-1.4-1.4V6.2c0-.8.6-1.4 1.4-1.4Z"/><path fill="currentColor" fill-opacity=".38" d="M9.2 9.2h5.6v1.4H9.2V9.2Zm0 2.8h5.6v1.4H9.2V12Zm0 2.8h4.2v1.4H9.2v-1.4Z"/>',
    info: '<circle fill="currentColor" cx="12" cy="12" r="8.2"/><path fill="currentColor" fill-opacity=".35" d="M12 7.2v1.4M11.2 11.2h1.6v5.2h-1.6v-5.2Z"/>',
    key: '<circle fill="currentColor" cx="8.8" cy="12" r="3.6"/><path fill="currentColor" d="M11.6 12h8.4v2.2h-2.4v2.2h-2.2V12Z"/>',
    back: '<path fill="currentColor" d="M14.8 6.8 9.6 12l5.2 5.2"/><path fill="currentColor" fill-opacity=".42" d="M18.8 12H9.2"/>',
    stop: '<rect fill="currentColor" x="7.2" y="7.2" width="9.6" height="9.6" rx="1.2"/>',
    send: '<path fill="currentColor" d="M5.2 12 18.8 5.2 12 18.8l2.4-6.6L5.2 12Z"/>',
    history: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="7.8"/><path fill="currentColor" d="M12 7.2V12l3.2 2.4"/>',
    dots: '<circle fill="currentColor" cx="6.8" cy="12" r="1.4"/><circle fill="currentColor" cx="12" cy="12" r="1.4"/><circle fill="currentColor" cx="17.2" cy="12" r="1.4"/>',
    oneFinger: '<path fill="currentColor" d="M12 4.2c1.2 0 2.2 1 2.2 2.2v5.6l1.4 2.8c.2.4 0 .8-.4 1-.4.2-.8 0-1-.4l-1.8-3.6V6.4c0-.6-.4-1-1-1s-1 .4-1 1v7.2l-1.2 2.4c-.2.4-.6.6-1 .4-.4-.2-.6-.6-.4-1l1.4-2.8V6.4c0-1.2 1-2.2 2.2-2.2Z"/>',
    hands: '<path fill="currentColor" d="M8.2 8.8c.8-1.6 2.4-2.6 4-2.6s3.2 1 4 2.6c1.4 1.2 2.2 3 2.2 4.9V16c0 .8-.6 1.4-1.4 1.4h-9.6c-.8 0-1.4-.6-1.4-1.4v-2.3c0-1.9.8-3.7 2.2-4.9Z"/>',
    circle: '<circle fill="none" stroke="currentColor" stroke-width="1.6" cx="12" cy="12" r="6"/>'
  };

  function appIconLabel(name, text, size, extraClass) {
    return appIcon(name, size, extraClass) + ' ' + String(text || '');
  }

  function setBtnIconLabel(btn, iconName, text, size) {
    if (!btn) return;
    btn.innerHTML = appIconLabel(iconName, text, size || 'sm');
  }

  function appIcon(name, size, extraClass) {
    const px = SIZES[size] || (typeof size === 'number' ? size : 18);
    const paths = ICONS[name] || ICONS.folder;
    const cls = ['app-icon', size && SIZES[size] ? 'app-icon--' + size : '', extraClass || ''].filter(Boolean).join(' ');
    return '<svg class="' + cls + '" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }

  function appIconEmblem(name, size) {
    size = size || 'lg';
    return '<span class="app-icon-emblem emoji-emblem" aria-hidden="true">' + appIcon(name, size) + '</span>';
  }

  function iconNameFromMarkup(type, value, fallback) {
    const key = String(type + ' ' + value + ' ' + fallback).toLowerCase();
    if (key.includes('hadith') || key.includes('hadithe') || key.includes('ḥadīth')) return 'hadith';
    if (key.includes('duas') || key.includes('dua') || key.includes('duʿ') || key.includes("du'a") || key.includes('bitt') || key.includes('krankheit') || key.includes('krank') || key.includes('eltern')) return 'dua';
    if (key.includes('topics') || key.includes('themen') || key.includes('kategorien') || key.includes('topic') || key.includes('adab') || key.includes('aqid') || key.includes('akhl')) return 'posts';
    if (key.includes('scholars') || key.includes('gelehrte') || key.includes('scholar')) return 'scholars';
    if (key.includes('books') || key.includes('bücher') || key.includes('buch') || key.includes('werke') || key.includes('book')) return 'books';
    if (key.includes('recent') || key.includes('neueste') || key.includes('aktuell')) return 'newBadge';
    if (key.includes('saved') || key.includes('gespeichert')) return 'saved';
    if (key.includes('about') || key.includes('über die app') || key.includes('maßstab') || key.includes('manhaj')) return 'scale';
    if (key.includes('morgen') || key.includes('abend')) return 'sunrise';
    if (key.includes('schlaf')) return 'moon';
    if (key.includes('aufwachen')) return 'sun';
    if (key.includes('reise')) return 'travel';
    if (key.includes('essen')) return 'food';
    if (key.includes('moschee') || key.includes('gebet')) return 'prayer';
    if (key.includes('schutz')) return 'shield';
    if (key.includes('familie')) return 'family';
    if (key.includes('rizq')) return 'leaf';
    if (key.includes('regen')) return 'rain';
    if (key.includes('wind')) return 'wind';
    return 'folder';
  }

  function iconNameFromTopic(title) {
    const k = String(title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/shirk/.test(k)) return 'warning';
    if (/bid[a']?ah|ahl al-bid/.test(k)) return 'users';
    if (/hukm|muhakamah|tahakum|takfir/.test(k)) return 'scale';
    if (/sifat|sifa allah/.test(k)) return 'sparkle';
    if (/sahabah|sahaba|aussagen/.test(k)) return 'users';
    if (/du'a|dua|bittgeb/.test(k)) return 'quran';
    if (/tawhid|tauhid/.test(k)) return 'oneFinger';
    if (/sunnah/.test(k)) return 'prayer';
    if (/qur|quran|tafsir/.test(k)) return 'quran';
    if (/isnad|quelle|methodik|uberlief/.test(k)) return 'link';
    return 'posts';
  }

  function iconNameFromUpdate(item) {
    const key = String([item.type, item.title, item.badge, item.nav, item.value].filter(Boolean).join(' ')).toLowerCase();
    if (/quiz/.test(key)) return 'quiz';
    if (/zakat|zakāt/.test(key)) return 'zakat';
    if (/dua|duʿā|bitt/.test(key)) return 'dua';
    if (/serie|hukm|muhakamah|muḥākamah/.test(key)) return 'scale';
    if (/qur|tafsir/.test(key)) return 'quran';
    if (/post|beitrag/.test(key)) return 'posts';
    return 'sparkle';
  }

  function hydrateAppIcons(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-app-icon]').forEach(function (el) {
      const name = el.getAttribute('data-app-icon');
      const size = el.getAttribute('data-app-icon-size') || 'md';
      if (!name) return;
      el.innerHTML = appIcon(name, size, el.className.replace('nav-icon', '').trim());
      el.removeAttribute('data-app-icon');
      el.removeAttribute('data-app-icon-size');
    });
  }

  global.appIcon = appIcon;
  global.appIconEmblem = appIconEmblem;
  global.appIconLabel = appIconLabel;
  global.setBtnIconLabel = setBtnIconLabel;
  global.iconNameFromMarkup = iconNameFromMarkup;
  global.iconNameFromTopic = iconNameFromTopic;
  global.iconNameFromUpdate = iconNameFromUpdate;
  global.hydrateAppIcons = hydrateAppIcons;
  global.APP_ICON_SIZES = SIZES;

  document.addEventListener('DOMContentLoaded', function () {
    hydrateAppIcons(document);
  });
})(typeof window !== 'undefined' ? window : globalThis);
