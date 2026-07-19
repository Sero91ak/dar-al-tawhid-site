#!/usr/bin/env node
/**
 * Generates premium 3D-style feature icons as SVG + WebP for DAR AL TAWḤĪD.
 * Own illustrations – consistent lighting from top-left, soft shadow, 3/4 view.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT = path.resolve('assets/icons/features');
const SIZE = 512;

const STYLE = `
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8e8"/>
      <stop offset="100%" stop-color="#c9a85c"/>
    </linearGradient>
    <linearGradient id="shadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.22"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <ellipse cx="256" cy="430" rx="150" ry="28" fill="url(#shadow)"/>
`;

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">${STYLE}${body}</svg>`;
}

const ICONS = {
  feed: wrap(`
    <g filter="url(#soft)">
      <rect x="148" y="168" width="176" height="128" rx="18" fill="#f4ead8" stroke="#d4b46a" stroke-width="3"/>
      <rect x="162" y="182" width="148" height="18" rx="6" fill="#e8dcc4"/>
      <rect x="162" y="210" width="110" height="10" rx="4" fill="#ddd0b8"/>
      <rect x="162" y="228" width="126" height="10" rx="4" fill="#ddd0b8"/>
      <path d="M300 120l18 44 48 4-36 28 12 46-42-28-42 28 12-46-36-28 48-4z" fill="url(#lg)"/>
      <circle cx="318" cy="138" r="10" fill="#fff6d8" opacity=".85"/>
    </g>
  `),
  ilm: wrap(`
    <g filter="url(#soft)">
      <path d="M156 320c0-88 44-132 100-132s100 44 100 132v44H156z" fill="#2f4a3a"/>
      <path d="M196 188c0-62 28-92 60-92s60 30 60 92v176H196z" fill="#3d6248"/>
      <path d="M256 96c-34 0-60 26-60 60v8c22-18 48-26 60-26s38 8 60 26v-8c0-34-26-60-60-60z" fill="#4a7a58"/>
      <rect x="248" y="120" width="16" height="220" rx="4" fill="#d8c18b"/>
      <ellipse cx="256" cy="150" rx="70" ry="24" fill="#fff2c8" opacity=".45"/>
      <path d="M330 150l34 18-8 24-26-42z" fill="#8b5a2b"/>
      <path d="M338 146l8 10-14 6z" fill="#c49a5c"/>
    </g>
  `),
  'din-quiz': wrap(`
    <g filter="url(#soft)">
      <rect x="150" y="130" width="212" height="260" rx="22" fill="#f3ead8" stroke="#c8a96a" stroke-width="4"/>
      <rect x="178" y="162" width="156" height="20" rx="8" fill="#e0d2b4"/>
      <text x="256" y="230" text-anchor="middle" font-size="72" font-weight="700" fill="#6b4f2a">?</text>
      <circle cx="350" cy="330" r="44" fill="#3d7a52"/>
      <path d="M332 330l14 14 28-30" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  `),
  'hadith-library': wrap(`
    <g filter="url(#soft)">
      <rect x="120" y="300" width="272" height="24" rx="8" fill="#5a3d28"/>
      <rect x="148" y="170" width="56" height="130" rx="8" fill="#6b2f2f"/>
      <rect x="210" y="158" width="56" height="142" rx="8" fill="#2f4f62"/>
      <rect x="272" y="176" width="56" height="124" rx="8" fill="#4a3a28"/>
      <rect x="334" y="188" width="48" height="112" rx="8" fill="#5a4a32"/>
      <rect x="154" y="176" width="44" height="8" rx="2" fill="#d8c18b" opacity=".7"/>
      <rect x="216" y="166" width="44" height="8" rx="2" fill="#d8c18b" opacity=".7"/>
      <path d="M176 170l8-18h20l-8 18z" fill="#c49a5c"/>
    </g>
  `),
  posts: wrap(`
    <g filter="url(#soft)">
      <rect x="168" y="210" width="176" height="132" rx="16" fill="#efe4cf" stroke="#c8a96a" stroke-width="3"/>
      <rect x="148" y="186" width="176" height="132" rx="16" fill="#f7f0df" stroke="#d4b46a" stroke-width="3"/>
      <rect x="128" y="162" width="176" height="132" rx="16" fill="#fffaf0" stroke="#e0c98a" stroke-width="3"/>
      <rect x="146" y="182" width="88" height="10" rx="4" fill="#d8ccb0"/>
      <rect x="146" y="202" width="120" height="10" rx="4" fill="#d8ccb0"/>
      <rect x="146" y="222" width="96" height="10" rx="4" fill="#d8ccb0"/>
      <rect x="248" y="150" width="36" height="18" rx="6" fill="#c49a5c"/>
    </g>
  `),
  quran: wrap(`
    <g filter="url(#soft)">
      <path d="M176 140h160v250c-26 10-54 14-80 14s-54-4-80-14V140z" fill="#1f4d3b"/>
      <path d="M256 140v264c26-4 52-10 80-14V140z" fill="#2a634c"/>
      <path d="M196 168h120v12H196z" fill="url(#lg)" opacity=".85"/>
      <ellipse cx="256" cy="250" rx="52" ry="52" fill="none" stroke="#d8c18b" stroke-width="4"/>
      <path d="M150 360h212l-18 28H168z" fill="#8b5a2b"/>
      <path d="M168 388h176l-10 16H178z" fill="#6b4428"/>
    </g>
  `),
  dua: wrap(`
    <g filter="url(#soft)">
      <path d="M196 300c0-70 26-110 60-110s60 40 60 110v70H196z" fill="#e8d8bc"/>
      <path d="M150 250c-18 36-18 78 0 120" stroke="#d4b88c" stroke-width="28" stroke-linecap="round"/>
      <path d="M362 250c18 36 18 78 0 120" stroke="#d4b88c" stroke-width="28" stroke-linecap="round"/>
      <ellipse cx="256" cy="180" rx="46" ry="18" fill="#fff4dc" opacity=".55"/>
      <path d="M236 150c8-16 24-24 20-24s12 8 20 24" fill="url(#lg)" opacity=".7"/>
    </g>
  `),
  scholars: wrap(`
    <g filter="url(#soft)">
      <ellipse cx="256" cy="360" rx="120" ry="28" fill="#4a3828" opacity=".35"/>
      <rect x="170" y="300" width="172" height="56" rx="10" fill="#5a4028"/>
      <path d="M210 300V220c0-30 20-50 46-50s46 20 46 50v80" fill="#d8c8b0"/>
      <ellipse cx="256" cy="206" rx="38" ry="42" fill="#e8d8c4"/>
      <path d="M220 188c8-20 22-30 36-30s28 10 36 30" fill="#4a3828"/>
      <rect x="228" y="268" width="56" height="40" rx="6" fill="#f2ead8" stroke="#c8a96a" stroke-width="2"/>
    </g>
  `),
  books: wrap(`
    <g filter="url(#soft)">
      <rect x="156" y="210" width="64" height="150" rx="8" fill="#6b2f2f"/>
      <rect x="208" y="190" width="64" height="170" rx="8" fill="#2f4a62"/>
      <rect x="260" y="200" width="64" height="160" rx="8" fill="#5a4028"/>
      <rect x="164" y="220" width="48" height="10" rx="3" fill="#d8c18b" opacity=".65"/>
      <rect x="216" y="200" width="48" height="10" rx="3" fill="#d8c18b" opacity=".65"/>
      <path d="M236 186l8-20h16l-8 20z" fill="#c49a5c"/>
      <rect x="268" y="210" width="48" height="10" rx="3" fill="#d8c18b" opacity=".65"/>
    </g>
  `),
  'prayer-times': wrap(`
    <g filter="url(#soft)">
      <path d="M176 300h160v70H176z" fill="#d8c8a8"/>
      <path d="M216 180h80v120h-80z" fill="#efe4cf"/>
      <ellipse cx="256" cy="180" rx="64" ry="36" fill="#f5ead0" stroke="#c8a96a" stroke-width="3"/>
      <rect x="148" y="250" width="20" height="120" rx="6" fill="#d4b88c"/>
      <rect x="344" y="250" width="20" height="120" rx="6" fill="#d4b88c"/>
      <circle cx="380" cy="210" r="34" fill="#f7f0df" stroke="#c8a96a" stroke-width="3"/>
      <path d="M380 194v10M380 226v10M364 210h10M386 210h10" stroke="#8b6a3a" stroke-width="3" stroke-linecap="round"/>
      <rect x="372" y="206" width="16" height="8" rx="2" fill="#6b4f2a"/>
    </g>
  `),
  jummah: wrap(`
    <g filter="url(#soft)">
      <path d="M176 300h160v70H176z" fill="#d8c8a8"/>
      <ellipse cx="256" cy="180" rx="64" ry="36" fill="#f5ead0" stroke="#c8a96a" stroke-width="3"/>
      <rect x="148" y="250" width="20" height="120" rx="6" fill="#d4b88c"/>
      <rect x="344" y="250" width="20" height="120" rx="6" fill="#d4b88c"/>
      <rect x="196" y="130" width="120" height="34" rx="10" fill="#6b2f3a"/>
      <text x="256" y="154" text-anchor="middle" font-size="18" font-weight="700" fill="#f5ead0">JUMUʿAH</text>
    </g>
  `),
  qibla: wrap(`
    <g filter="url(#soft)">
      <circle cx="256" cy="256" r="120" fill="#f2ead8" stroke="#c8a96a" stroke-width="6"/>
      <path d="M256 148l16 56-16-12-16 12z" fill="#8b2f2f"/>
      <path d="M256 364l-16-56 16 12 16-12z" fill="#4a4a4a" opacity=".5"/>
      <path d="M206 220h100v120l-50-28z" fill="#1a1a1a"/>
      <path d="M256 220h50v120l-50-28z" fill="#2a2a2a"/>
      <path d="M236 220h40v18H236z" fill="url(#lg)"/>
    </g>
  `),
  'islamic-calendar': wrap(`
    <g filter="url(#soft)">
      <rect x="150" y="150" width="212" height="220" rx="20" fill="#f7f0df" stroke="#c8a96a" stroke-width="4"/>
      <rect x="150" y="150" width="212" height="52" rx="20" fill="#6b2f3a"/>
      <circle cx="190" cy="126" r="10" fill="#c8a96a"/>
      <circle cx="322" cy="126" r="10" fill="#c8a96a"/>
      <path d="M330 120c18-10 34-4 34 14 0 24-30 42-54 42s-54-18-54-42c0-18 16-24 34-14" fill="url(#lg)"/>
      <rect x="182" y="224" width="36" height="36" rx="8" fill="#e8dcc4"/>
      <rect x="238" y="224" width="36" height="36" rx="8" fill="#e8dcc4"/>
      <rect x="294" y="224" width="36" height="36" rx="8" fill="#d4b88c"/>
    </g>
  `),
  zakat: wrap(`
    <g filter="url(#soft)">
      <path d="M156 300h200" stroke="#8b6a3a" stroke-width="8" stroke-linecap="round"/>
      <path d="M256 300V180" stroke="#8b6a3a" stroke-width="8"/>
      <path d="M176 180h160l-20 40H196z" fill="#c8a96a"/>
      <ellipse cx="196" cy="330" rx="52" ry="16" fill="#d4b46a"/>
      <ellipse cx="316" cy="330" rx="52" ry="16" fill="#d4b46a"/>
      <circle cx="196" cy="300" r="28" fill="url(#lg)" stroke="#b8924a" stroke-width="3"/>
      <circle cx="316" cy="300" r="28" fill="url(#lg)" stroke="#b8924a" stroke-width="3"/>
    </g>
  `),
  wasiyyah: wrap(`
    <g filter="url(#soft)">
      <path d="M150 140c0-20 16-36 36-36h140c20 0 36 16 36 36v220c0 20-16 36-36 36H186c-20 0-36-16-36-36z" fill="#efe0c4"/>
      <path d="M170 160h172v180H170z" fill="#f8f0de"/>
      <path d="M330 150l34 18-8 24-26-42z" fill="#8b5a2b"/>
      <circle cx="330" cy="300" r="34" fill="#8b2f2f"/>
      <text x="330" y="310" text-anchor="middle" font-size="22" fill="#f5ead0">و</text>
    </g>
  `),
  widgets: wrap(`
    <g filter="url(#soft)">
      <rect x="170" y="130" width="172" height="260" rx="28" fill="#2a2a2a"/>
      <rect x="186" y="160" width="140" height="88" rx="14" fill="#f7f0df"/>
      <rect x="198" y="176" width="72" height="10" rx="4" fill="#c8a96a"/>
      <rect x="198" y="196" width="96" height="10" rx="4" fill="#d8ccb0"/>
      <rect x="186" y="260" width="64" height="64" rx="14" fill="#3d6248"/>
      <rect x="262" y="260" width="64" height="64" rx="14" fill="#6b2f3a"/>
    </g>
  `),
  'image-editor': wrap(`
    <g filter="url(#soft)">
      <rect x="140" y="150" width="232" height="180" rx="18" fill="#f7f0df" stroke="#c8a96a" stroke-width="4"/>
      <path d="M160 290l48-44 40 36 36-28 56 72H160z" fill="#7aa87a"/>
      <circle cx="210" cy="210" r="16" fill="#f5d87a"/>
      <rect x="300" y="170" width="52" height="52" rx="10" fill="#fffaf0" stroke="#d4b46a" stroke-width="3"/>
    </g>
  `),
  saved: wrap(`
    <g filter="url(#soft)">
      <path d="M256 120l48 44 64 8-46 46 12 66-78-42-78 42 12-66-46-46 64-8z" fill="url(#lg)" stroke="#c8a96a" stroke-width="3"/>
      <path d="M256 168v120" stroke="#fff8e8" stroke-width="8" stroke-linecap="round" opacity=".5"/>
    </g>
  `),
  account: wrap(`
    <g filter="url(#soft)">
      <rect x="170" y="230" width="172" height="110" rx="18" fill="#4a3828"/>
      <path d="M210 230v-36c0-26 20-46 46-46s46 20 46 46v36" stroke="#c8a96a" stroke-width="14" fill="none"/>
      <circle cx="256" cy="286" r="22" fill="#f7f0df"/>
      <rect x="300" y="250" width="56" height="56" rx="12" fill="url(#lg)"/>
    </g>
  `),
  news: wrap(`
    <g filter="url(#soft)">
      <path d="M256 110l52 106 118 14-86 78 24 116-108-60-108 60 24-116-86-78 118-14z" fill="url(#lg)" stroke="#c8a96a" stroke-width="3"/>
      <circle cx="360" cy="160" r="28" fill="#8b2f2f"/>
      <text x="360" y="168" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">!</text>
    </g>
  `),
  about: wrap(`
    <g filter="url(#soft)">
      <circle cx="256" cy="256" r="110" fill="#f7f0df" stroke="#c8a96a" stroke-width="5"/>
      <circle cx="256" cy="210" r="10" fill="#6b4f2a"/>
      <rect x="244" y="236" width="24" height="72" rx="10" fill="#6b4f2a"/>
      <path d="M180 330h152" stroke="#8b6a3a" stroke-width="8" stroke-linecap="round"/>
      <path d="M196 310l40 40M316 310l-40 40" stroke="#8b6a3a" stroke-width="8" stroke-linecap="round"/>
    </g>
  `),
  ramadan: wrap(`
    <g filter="url(#soft)">
      <path d="M330 150c40 20 56 68 34 112-24 48-78 68-122 48" fill="url(#lg)"/>
      <path d="M182 250c-24-48-8-106 34-126" fill="#f5ead0" opacity=".35"/>
      <rect x="220" y="280" width="72" height="96" rx="10" fill="#d4a64a"/>
      <ellipse cx="256" cy="270" rx="36" ry="10" fill="#c49a5c"/>
      <path d="M256 220v24" stroke="#f5d87a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="256" cy="250" r="16" fill="#fff2b8"/>
    </g>
  `),
  fallback: wrap(`
    <g filter="url(#soft)">
      <circle cx="256" cy="256" r="96" fill="#f7f0df" stroke="#c8a96a" stroke-width="5"/>
      <path d="M256 196v80M216 256h80" stroke="#8b6a3a" stroke-width="10" stroke-linecap="round"/>
    </g>
  `),
};

// Map feature catalog ids to asset names
const ID_MAP = {
  feed: 'feed',
  quiz: 'din-quiz',
  ilm: 'ilm',
  hadith: 'hadith-library',
  topics: 'posts',
  quran: 'quran',
  duas: 'dua',
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
  saved: 'saved',
  account: 'account',
  news: 'news',
  about: 'about',
  ramadan: 'ramadan',
};

fs.mkdirSync(OUT, { recursive: true });

const manifest = { icons: {}, idMap: ID_MAP, version: 1, license: 'Original illustrations for DAR AL TAWḤĪD – proprietary' };

for (const [name, svg] of Object.entries(ICONS)) {
  const svgPath = path.join(OUT, `${name}.svg`);
  const webpPath = path.join(OUT, `${name}.webp`);
  const pngPath = path.join(OUT, `${name}.png`);
  fs.writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg)).resize(SIZE, SIZE).webp({ quality: 88 }).toFile(webpPath);
  await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(pngPath);
  manifest.icons[name] = { svg: `/assets/icons/features/${name}.svg`, webp: `/assets/icons/features/${name}.webp`, png: `/assets/icons/features/${name}.png` };
  console.log('generated', name);
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('done', Object.keys(ICONS).length, 'icons');
