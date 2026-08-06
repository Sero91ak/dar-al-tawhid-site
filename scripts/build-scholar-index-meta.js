#!/usr/bin/env node
/**
 * Builds data/scholar-index-meta.json from post catalog + curated metadata.
 * Run: node scripts/build-scholar-index-meta.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT = path.join(ROOT, 'data', 'scholar-index-meta.json');

const PROPHET_SCHOLAR_KEY = '__prophet__';

const GROUPS = {
  prophet: { filterLabel: 'Prophet', sectionLabel: 'PROPHET', order: 0 },
  sahabah: { filterLabel: 'Ṣaḥābah', sectionLabel: 'ṢAḤĀBAH', order: 1 },
  tabiun: { filterLabel: 'Tābiʿūn', sectionLabel: 'TĀBIʿŪN', order: 2 },
  atba: { filterLabel: 'Atbāʿ at-Tābiʿīn', sectionLabel: 'ATBĀʿ AT-TĀBIʿĪN', order: 3 },
  imam: { filterLabel: 'Imāme', sectionLabel: 'FRÜHE IMĀME UND MUḤADDITHŪN', order: 4 },
  muhaddith: { filterLabel: 'Muḥaddithūn', sectionLabel: 'FRÜHE IMĀME UND MUḤADDITHŪN', order: 4 },
  faqih: { filterLabel: 'Fuqahāʾ', sectionLabel: 'FRÜHE IMĀME UND MUḤADDITHŪN', order: 4 },
  mufassir: { filterLabel: 'Mufassirūn', sectionLabel: 'SPÄTERE GELEHRTE', order: 5 },
  weitere: { filterLabel: 'Weitere', sectionLabel: 'WEITERE', order: 6 },
};

const SECTION_ORDER = [
  { id: 'prophet', label: 'PROPHET' },
  { id: 'sahabah', label: 'ṢAḤĀBAH' },
  { id: 'tabiun', label: 'TĀBIʿŪN' },
  { id: 'atba', label: 'ATBĀʿ AT-TĀBIʿĪN' },
  { id: 'early_imam', label: 'FRÜHE IMĀME UND MUḤADDITHŪN' },
  { id: 'later', label: 'SPÄTERE GELEHRTE' },
  { id: 'weitere', label: 'WEITERE' },
];

/** Curated scholar metadata keyed by catalog id */
const CURATED = {
  [PROPHET_SCHOLAR_KEY]: {
    primaryGroup: 'prophet',
    generationGroup: 'prophet',
    generationOrder: 0,
    roles: ['prophet'],
    aliases: ['Prophet ﷺ', 'Der Prophet ﷺ', 'Muhammad ﷺ', 'Prophet Muhammad'],
    monogram: 'PM',
  },
  'abu-hurayrah': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 10, roles: ['sahabi', 'muhaddith'], aliases: ['Abu Hurayrah', 'Abu Hurairah'], monogram: 'AH' },
  'abdullah-ibn-masud': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 11, roles: ['sahabi'], aliases: ['Abdullah ibn Masud', 'Ibn Masud'], monogram: 'ʿA' },
  'ibn-abbas': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 12, roles: ['sahabi', 'mufassir'], aliases: ['Ibn Abbas', 'Abdullah ibn Abbas'], monogram: 'Iʿ' },
  'anas-b-malik': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 13, roles: ['sahabi'], aliases: ['Anas ibn Malik'], monogram: 'AM' },
  's:abdullahibnamr': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 14, roles: ['sahabi'], aliases: ['Abdullah ibn Amr'] },
  's:abdullahbamr': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 14, roles: ['sahabi'], aliases: ['Abdullah b. Amr'] },
  's:abuaddarda': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 15, roles: ['sahabi'], aliases: ['Abu ad-Darda'] },
  's:abudharr': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 16, roles: ['sahabi'], aliases: ['Abu Dharr'] },
  's:abumasudalansari': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 17, roles: ['sahabi'] },
  's:abusaidalkhudri': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 18, roles: ['sahabi'] },
  's:abushurayh': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 19, roles: ['sahabi'] },
  's:abuumamahalbahili': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 20, roles: ['sahabi'] },
  's:abdullahibnumar': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 21, roles: ['sahabi'], aliases: ['Abdullah ibn Umar'] },
  's:ibnumar': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 21, roles: ['sahabi'] },
  's:ibnmasud': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 22, roles: ['sahabi'] },
  's:aliibnabitalib': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 23, roles: ['sahabi'] },
  's:aishah': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 24, roles: ['sahabi'], aliases: ['Aisha', 'Aishah'] },
  's:aishahbintabibakr': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 24, roles: ['sahabi'] },
  's:jabirbabdillah': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 25, roles: ['sahabi'] },
  's:sahlbsad': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 26, roles: ['sahabi'] },
  's:salmanalfarisi': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 27, roles: ['sahabi'] },
  's:ubayyibnkab': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 28, roles: ['sahabi'] },
  's:uthmanbaffan': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 29, roles: ['sahabi'] },
  's:imranbhusayn': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 30, roles: ['sahabi'] },
  's:ubadahbassamit': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 31, roles: ['sahabi'] },
  's:hudayfahibnalyaman': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 32, roles: ['sahabi'] },
  's:hudhayfahibnalyaman': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 32, roles: ['sahabi'] },
  's:amrbshuayb': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 33, roles: ['sahabi'] },
  's:umarbalhattab': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 34, roles: ['sahabi'], aliases: ['Umar ibn al-Khattab'] },
  's:umaribnalkhattab': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 34, roles: ['sahabi'] },
  's:abubakralajurri': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 116, roles: ['imam'] },
  'al-hasan-al-basri': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 41, roles: ['tabi', 'imam'], aliases: ['Hasan al-Basri'] },
  's:sufyanaththawri': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 42, roles: ['tabi', 'imam', 'muhaddith'], aliases: ['Sufyan al-Thawri'] },
  'sufyan-ath-thauri': { primaryGroup: 'tabiun', generationGroup: 'atba', generationOrder: 42, roles: ['tabi', 'imam', 'muhaddith'], aliases: ['Sufyan al-Thawri', 'Sufyān ath-Thawrī'] },
  'malik-ibn-anas': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 50, roles: ['imam', 'faqih', 'muhaddith'], aliases: ['Malik ibn Anas', 'Imam Malik'] },
  'sufyan-ibn-uyaynah': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 43, roles: ['tabi', 'muhaddith'] },
  'al-awzai': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 44, roles: ['tabi', 'faqih'] },
  'ibn-sirin': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 45, roles: ['tabi'] },
  'mujahid': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 46, roles: ['tabi', 'mufassir'] },
  'al-layth': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 47, roles: ['tabi', 'faqih'] },
  's:atababirabah': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 48, roles: ['tabi'] },
  's:amribndinar': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 49, roles: ['tabi'] },
  's:malikibndinar': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 49, roles: ['tabi'] },
  's:rabiah': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 50, roles: ['tabi'] },
  's:tawus': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 51, roles: ['tabi'] },
  's:hammadbzayd': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 52, roles: ['tabi'] },
  'ahmad-ibn-hanbal': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 100, roles: ['imam', 'muhaddith'], aliases: ['Ahmad ibn Hanbal', 'Imam Ahmad', 'Ahmad ibn Hambal'], monogram: 'AḤ' },
  'ash-shafii': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 101, roles: ['imam', 'faqih'], aliases: ['ash-Shafii', 'Imam Shafii', 'Muhammad ibn Idris ash-Shafii'], monogram: 'AS' },
  's:imamassafii': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 101, roles: ['imam', 'faqih'] },
  'al-bukhari': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 102, roles: ['imam', 'muhaddith'], aliases: ['al-Bukhari', 'Bukhari', 'Imam al-Bukhari'], monogram: 'AB' },
  'abu-isa-at-tirmidhi': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 103, roles: ['imam', 'muhaddith'], aliases: ['at-Tirmidhi', 'Tirmidhi', 'Abu Isa at-Tirmidhi'] },
  'abu-hatim-ar-razi': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 104, roles: ['imam', 'muhaddith'], aliases: ['Abu Hatim ar-Razi', 'Abu Hatim'] },
  'abu-zurah-ar-razi': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 105, roles: ['imam', 'muhaddith'], aliases: ['Abu Zurah ar-Razi'] },
  's:abuzurah': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 105, roles: ['muhaddith'] },
  'abu-ubayd': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 106, roles: ['muhaddith'], aliases: ['Abu Ubaid', 'Abu Ubayd al-Qasim ibn Sallam'] },
  'al-barbahari': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 107, roles: ['imam'] },
  's:ishaqibnrahawayh': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 108, roles: ['imam', 'muhaddith'] },
  's:ishaqbrahawayh': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 108, roles: ['imam', 'muhaddith'] },
  'ibn-qudamah': { primaryGroup: 'faqih', generationGroup: 'early_imam', generationOrder: 109, roles: ['faqih', 'imam'] },
  'al-lalakai': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 110, roles: ['imam'] },
  's:abujafarmuhammadibnuthmanibnabishaybah': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 111, roles: ['muhaddith'] },
  's:muhammadibnshihabazzuhri': { primaryGroup: 'muhaddith', generationGroup: 'atba', generationOrder: 60, roles: ['muhaddith'] },
  's:abdullahibnalmubarak': { primaryGroup: 'muhaddith', generationGroup: 'atba', generationOrder: 61, roles: ['imam', 'muhaddith'] },
  's:ibnbattahalukbari': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 112, roles: ['imam'] },
  's:ibnqutaybah': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 113, roles: ['muhaddith'] },
  's:uthmanibnsaidaddarimi': { primaryGroup: 'imam', generationGroup: 'early_imam', generationOrder: 114, roles: ['imam'] },
  'at-tabari': { primaryGroup: 'mufassir', generationGroup: 'later', generationOrder: 200, roles: ['imam', 'mufassir', 'faqih'], aliases: ['at-Tabari', 'Tabari', 'Ibn Jarir at-Tabari'] },
  'ibn-kathir': { primaryGroup: 'mufassir', generationGroup: 'later', generationOrder: 201, roles: ['imam', 'mufassir', 'muhaddith'], aliases: ['Ibn Kathir'] },
  'ibn-taymiyyah': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 202, roles: ['imam', 'faqih'], aliases: ['Ibn Taymiyyah'] },
  'adh-dhahabi': { primaryGroup: 'muhaddith', generationGroup: 'later', generationOrder: 203, roles: ['imam', 'muhaddith'], aliases: ['adh-Dhahabi', 'Dhahabi', 'ad-Dhahabi'], monogram: 'AD' },
  'al-mawardi': { primaryGroup: 'faqih', generationGroup: 'later', generationOrder: 204, roles: ['faqih', 'imam'] },
  'al-qurtubi': { primaryGroup: 'mufassir', generationGroup: 'later', generationOrder: 205, roles: ['mufassir', 'faqih'] },
  'ibn-abd-al-barr': { primaryGroup: 'muhaddith', generationGroup: 'later', generationOrder: 206, roles: ['imam', 'muhaddith'] },
  'an-nawawi': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 207, roles: ['imam', 'faqih', 'muhaddith'] },
  'ibn-hajar': { primaryGroup: 'muhaddith', generationGroup: 'later', generationOrder: 208, roles: ['imam', 'muhaddith'] },
  'ibn-al-jawzi': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 209, roles: ['imam', 'muhaddith'] },
  'al-qadi-iyad': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 210, roles: ['imam', 'faqih'] },
  'al-fudayl': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 53, roles: ['tabi'] },
  's:alfudaylbiyad': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 53, roles: ['tabi'] },
  's:ibnalqayyim': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 211, roles: ['imam', 'faqih'] },
  's:abumijlaz': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 54, roles: ['tabi'] },
  's:umaribnabdalaziz': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 55, roles: ['tabi', 'imam'] },
  's:yahyabmain': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 115, roles: ['imam', 'muhaddith'], aliases: ['Yahya ibn Main'] },
  's:zaydibnamribnnufayl': { primaryGroup: 'weitere', generationGroup: 'weitere', generationOrder: 7000, roles: [] },
  's:ibnabializz': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 212, roles: ['imam'] },
  's:assawkani': { primaryGroup: 'imam', generationGroup: 'later', generationOrder: 213, roles: ['imam'] },
  's:ashshanqiti': { primaryGroup: 'mufassir', generationGroup: 'later', generationOrder: 214, roles: ['mufassir'] },
  's:ummsalamah': { primaryGroup: 'sahabah', generationGroup: 'sahabah', generationOrder: 35, roles: ['sahabi'], aliases: ['Umm Salamah'] },
  's:qatadah': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 57, roles: ['tabi', 'mufassir'], aliases: ['Qatadah'] },
  's:assuddi': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 58, roles: ['tabi', 'mufassir'] },
  's:maymunibnmihran': { primaryGroup: 'tabiun', generationGroup: 'tabiun', generationOrder: 59, roles: ['tabi'] },
  's:abdarrahmanibnmahdi': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 95, roles: ['imam', 'muhaddith'], aliases: ['Abd ar-Rahman ibn Mahdi'] },
  's:abdarrahmanbmahdi': { primaryGroup: 'muhaddith', generationGroup: 'early_imam', generationOrder: 95, roles: ['imam', 'muhaddith'] },
};

function scholarNorm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function splitScholarParts(raw) {
  if (!raw) return [];
  return String(raw).split(/\s*,\s*|\s+und\s+/i).map((s) => s.trim()).filter(Boolean);
}

function mapScholarPart(part) {
  const n = scholarNorm(part);
  if (!n) return null;
  // Scripture / collectives / story-groups — not person folders
  if (
    /^(der)?quran$/.test(n) ||
    /^ahl(us|al)?(as)?sunnah/.test(n) ||
    /^yusufs?bruder/.test(n) ||
    /^(die)?sunnah$/.test(n) ||
    /^(die)?athar$/.test(n) ||
    /^ijma/.test(n) ||
    /^ahlalhadith$/.test(n) ||
    /^salaf$/.test(n)
  ) {
    return null;
  }
  const rules = [
    [PROPHET_SCHOLAR_KEY, 'Prophet Muhammad ﷺ', 0, /^(der)?prophet/],
    ['ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal', 1, /ahmadibnhanbal|imamahmad/],
    ['ash-shafii', 'ash-Shāfiʿī', 1, /muhammadibnidris|imamashshafi|imamasshafi|imamasshafii|ashshafii|shafii/],
    ['abu-hurayrah', 'Abū Hurayrah', 1, /abuhurayrah|abuhurairah/],
    ['abu-ubayd', 'Abū ʿUbayd al-Qāsim ibn Sallām', 1, /abuubaid|abuubayd|qasim.*sallam/],
    ['malik-ibn-anas', 'Mālik ibn Anas', 1, /malikibnanas|imammalik/],
    ['sufyan-ath-thauri', 'Sufyān ath-Thawrī', 1, /sufyanaththauri|sufyanaththawri|sufyanalthauri|sufyanalthawri/],
    ['sufyan-ibn-uyaynah', 'Sufyān ibn ʿUyaynah', 1, /sufyanibnuyaynah/],
    ['al-awzai', 'al-Awzāʿī', 1, /alawzai|alawza/],
    ['abu-hatim-ar-razi', 'Abū Ḥātim ar-Rāzī', 1, /abuhatim.*razi|abuhatin/],
    ['abu-zurah-ar-razi', 'Abū Zurʿah ar-Rāzī', 1, /abuzurah.*razi/],
    ['ibn-taymiyyah', 'Ibn Taymiyyah', 1, /ibntaymiyyah/],
    ['ibn-abd-al-barr', 'Ibn ʿAbd al-Barr', 1, /ibnabd.*barr/],
    ['ibn-sirin', 'Ibn Sīrīn', 1, /ibnsirin/],
    ['al-hasan-al-basri', 'al-Ḥasan al-Baṣrī', 1, /alhasan.*basri|hasanbasri/],
    ['ibn-kathir', 'Ibn Kathīr', 1, /ibnkathir/],
    ['ibn-hajar', 'Ibn Ḥajar', 1, /ibnhajar/],
    ['an-nawawi', 'an-Nawawī', 1, /annawawi|nawawi/],
    ['al-bukhari', 'al-Bukhārī', 1, /albukhari|bukhari/],
    ['ibn-qudamah', 'Ibn Qudāmah', 1, /ibnqudamah/],
    ['at-tabari', 'aṭ-Ṭabarī', 1, /attabari|tabari/],
    ['ibn-abbas', 'Ibn ʿAbbās', 1, /ibnabbas/],
    ['abdullah-ibn-masud', 'ʿAbdullāh ibn Masʿūd', 1, /abdullahibnmasud/],
    ['anas-b-malik', 'Anas b. Mālik', 1, /anasbmalik|anasibnmalik/],
    ['adh-dhahabi', 'adh-Dhahabī', 1, /dhahabi/],
    ['al-layth', 'al-Layth ibn Saʿd', 1, /laythibnsad|allayth/],
    ['al-qadi-iyad', 'al-Qāḍī ʿIyāḍ', 1, /alqadiiyad/],
    ['abu-isa-at-tirmidhi', 'Abū ʿĪsā at-Tirmidhī', 1, /abuisa.*tirmidhi/],
    ['ibn-al-jawzi', 'Ibn al-Jawzī', 1, /ibnaljawzi/],
    ['mujahid', 'Mujāhid', 1, /mujahid/],
    ['ibn-al-arabi', 'Ibn al-ʿArabī', 1, /ibnalarabi/],
    ['al-mawardi', 'al-Māwardī', 1, /almawardi/],
    ['al-qurtubi', 'al-Qurṭubī', 1, /alqurtubi/],
    ['al-fudayl', 'al-Fuḍayl ibn ʿIyāḍ', 1, /alfudaylibniyad/],
    ['al-lalakai', 'al-Lālakāʾī', 1, /allalakai/],
    ['al-barbahari', 'al-Barbahārī', 1, /albarbahari/],
    ['al-ayni', 'al-ʿAynī', 1, /alayni/],
  ];
  for (const [key, label, priority, re] of rules) {
    if (re.test(n)) return { key, label, priority };
  }
  return { key: 's:' + n, label: part.trim(), priority: 999 };
}

function buildCatalog() {
  const map = new Map();
  for (const f of fs.readdirSync(POSTS_DIR).filter((x) => x.endsWith('.md'))) {
    const t = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    const m = t.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    const scholar = (m[1].match(/^scholar:\s*["']?(.+?)["']?\s*$/m) || [])[1];
    if (!scholar) continue;
    splitScholarParts(scholar).forEach((part) => {
      const c = mapScholarPart(part);
      if (!c) return;
      const prev = map.get(c.key);
      if (!prev) map.set(c.key, { ...c, count: 1 });
      else {
        prev.count++;
        if (c.priority < prev.priority) {
          prev.label = c.label;
          prev.priority = c.priority;
        }
      }
    });
  }
  return [...map.values()];
}

const HISTORY_PATH = path.join(ROOT, 'data', 'scholar-history-curated.json');
let HISTORY = {};
try {
  HISTORY = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  delete HISTORY._note;
} catch (e) {
  console.warn('No scholar-history-curated.json:', e.message);
}

const catalog = buildCatalog();
const scholars = {};

for (const item of catalog) {
  const base = CURATED[item.key] || {
    primaryGroup: 'weitere',
    generationGroup: 'weitere',
    generationOrder: 8000 + item.priority,
    roles: [],
    aliases: [],
  };
  const hist = HISTORY[item.key] || {};
  scholars[item.key] = {
    displayName: item.label,
    primaryGroup: base.primaryGroup || 'weitere',
    generationGroup: base.generationGroup || 'weitere',
    generationOrder: base.generationOrder ?? 8000,
    roles: base.roles || [],
    aliases: base.aliases || [],
    monogram: base.monogram || '',
    kuniyah: base.kuniyah || '',
    lifespanLabel: hist.lifespanLabel || '',
    bornHijri: Number.isFinite(hist.bornHijri) ? hist.bornHijri : null,
    diedHijri: Number.isFinite(hist.diedHijri) ? hist.diedHijri : null,
    eraLabel: hist.eraLabel || '',
    bio: hist.bio || '',
    teachers: Array.isArray(hist.teachers) ? hist.teachers : [],
    students: Array.isArray(hist.students) ? hist.students : [],
    works: Array.isArray(hist.works) ? hist.works : [],
  };
}

// Legacy route aliases (old keys → canonical meta)
const ALIASES = {
  's:sufyanaththawri': 'sufyan-ath-thauri',
  's:alfudaylbiyad': 'al-fudayl',
  's:ibnmasud': 'abdullah-ibn-masud',
};
for (const [from, to] of Object.entries(ALIASES)) {
  if (scholars[to] && !scholars[from]) scholars[from] = { ...scholars[to] };
}

const out = {
  version: 2,
  generatedAt: new Date().toISOString(),
  groups: GROUPS,
  sections: SECTION_ORDER,
  scholars,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const withYears = Object.values(scholars).filter((s) => s.lifespanLabel).length;
console.log('Wrote', OUT, 'with', Object.keys(scholars).length, 'scholars,', withYears, 'with lifespan');
