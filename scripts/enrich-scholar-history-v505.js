#!/usr/bin/env node
/**
 * Enrich data/scholar-history-curated.json with professional Lehrer/Schüler/Werke.
 * Idempotent merge by id/title. Run: node scripts/enrich-scholar-history-v505.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'data', 'scholar-history-curated.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function asPerson(id, name) {
  return { id, name };
}
function asWork(title) {
  return { title };
}
function ensure(id) {
  if (!data[id] || typeof data[id] !== 'object') data[id] = {};
  const e = data[id];
  if (!Array.isArray(e.teachers)) e.teachers = [];
  if (!Array.isArray(e.students)) e.students = [];
  if (!Array.isArray(e.works)) e.works = [];
  return e;
}
function mergePeople(arr, list) {
  const seen = new Set(arr.map((x) => (x && x.id) || ''));
  for (const p of list) {
    if (!p || !p.id || seen.has(p.id)) continue;
    seen.add(p.id);
    arr.push(p);
  }
}
function mergeWorks(arr, titles) {
  const seen = new Set(arr.map((x) => String((x && x.title) || x || '').toLowerCase()));
  for (const t of titles) {
    const title = typeof t === 'string' ? t : t && t.title;
    if (!title) continue;
    const k = title.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    arr.push(asWork(title));
  }
}
function patch(id, { teachers, students, works, bio, eraLabel, lifespanLabel }) {
  const e = ensure(id);
  if (teachers) mergePeople(e.teachers, teachers);
  if (students) mergePeople(e.students, students);
  if (works) mergeWorks(e.works, works);
  if (bio && !e.bio) e.bio = bio;
  if (eraLabel && !e.eraLabel) e.eraLabel = eraLabel;
  if (lifespanLabel && !e.lifespanLabel) e.lifespanLabel = lifespanLabel;
}

const P = asPerson;
const W = (t) => t;

// —— Ṣaḥābah & frühe Überlieferer ——
patch('abu-hurayrah', {
  works: [W('Umfangreiche Ḥadīth-Überlieferungen'), W('Aussagen zur Sunnah und zum Īmān')],
  students: [
    P('s:muhammadibnshihabazzuhri', 'Ibn Shihāb az-Zuhrī'),
    P('ibn-sirin', 'Ibn Sīrīn'),
    P('s:saidalmusayyib', 'Saʿīd ibn al-Musayyib'),
  ],
});
patch('abdullah-ibn-masud', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [
    P('s:alqamah', 'ʿAlqamah ibn Qays'),
    P('s:alaswad', 'al-Aswad ibn Yazīd'),
    P('s:masruq', 'Masrūq ibn al-Ajdaʿ'),
  ],
  works: [W('Qurʾān-Lesart und Tafsīr-Überlieferungen'), W('Ḥadīth- und Fiqh-Überlieferungen')],
});
patch('s:aishah', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ'), P('s:abubakr', 'Abū Bakr aṣ-Ṣiddīq')],
  students: [
    P('ibn-abbas', 'Ibn ʿAbbās'),
    P('s:urwah', 'ʿUrwah ibn az-Zubayr'),
    P('s:qasim', 'al-Qāsim ibn Muḥammad'),
  ],
  works: [W('Ḥadīth-Überlieferungen'), W('Fatāwā und Rechtsgutachten'), W('Erklärungen zu Qurʾān und Sunnah')],
});
patch('s:ummsalamah', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [P('ibn-abbas', 'Ibn ʿAbbās'), P('s:urwah', 'ʿUrwah ibn az-Zubayr')],
  works: [W('Ḥadīth-Überlieferungen'), W('Aussagen zur Sunnah der Frauen')],
});
patch('s:ibnumar', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ'), P('s:umarbalhattab', 'ʿUmar ibn al-Khaṭṭāb')],
  students: [P('nafī', 'Nāfiʿ mawlā Ibn ʿUmar'), P('s:muhammadibnshihabazzuhri', 'az-Zuhrī')],
  works: [W('Ḥadīth-Überlieferungen'), W('Rechtsgutachten')],
});
patch('s:abdullahibnumar', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ'), P('s:umarbalhattab', 'ʿUmar ibn al-Khaṭṭāb')],
  students: [P('nafī', 'Nāfiʿ mawlā Ibn ʿUmar'), P('s:salim', 'Sālim ibn ʿAbdullāh')],
  works: [W('Ḥadīth-Überlieferungen'), W('Rechtsgutachten')],
});
patch('s:uthmanbaffan', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [P('ibn-abbas', 'Ibn ʿAbbās'), P('s:aliibnabitalib', 'ʿAlī ibn Abī Ṭālib')],
  works: [W('Kodifizierung des Muṣḥaf'), W('Ḥadīth-Überlieferungen')],
});
patch('s:abudharr', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [P('s:ibnmasud', 'Ibn Masʿūd'), P('abu-hurayrah', 'Abū Hurayrah')],
  works: [W('Ḥadīth-Überlieferungen'), W('Aussagen zu Zuhd und Tawḥīd')],
});
patch('s:abusaidalkhudri', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [P('s:atababirabah', 'ʿAṭāʾ ibn Abī Rabāḥ'), P('s:saidalmusayyib', 'Saʿīd ibn al-Musayyib')],
  works: [W('Ḥadīth-Überlieferungen')],
});
patch('s:sadibnabiwaqqas', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  students: [P('s:saidalmusayyib', 'Saʿīd ibn al-Musayyib')],
  works: [W('Ḥadīth-Überlieferungen')],
});
patch('s:imranbhusayn', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  works: [W('Ḥadīth-Überlieferungen')],
});
patch('s:abuumamahalbahili', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  works: [W('Ḥadīth-Überlieferungen')],
});
patch('s:abushurayh', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  works: [W('Ḥadīth-Überlieferungen')],
});
patch('s:abdullahbamr', {
  teachers: [P('__prophet__', 'Prophet Muhammad ﷺ')],
  works: [W('Ḥadīth-Überlieferungen'), W('Schriftliche Sammlung von Aḥādīth')],
});
patch('ibn-abbas', {
  works: [
    W('Tafsīr Ibn ʿAbbās (überliefert)'),
    W('Fatāwā und Rechtsgutachten'),
    W('Überlieferungen zum Qurʾān'),
  ],
  students: [
    P('mujahid', 'Mujāhid ibn Jabr'),
    P('s:atababirabah', 'ʿAṭāʾ ibn Abī Rabāḥ'),
    P('s:tawus', 'Ṭāwūs ibn Kaysān'),
    P('s:ikrima', 'ʿIkrimah'),
    P('s:saidibnubayr', 'Saʿīd ibn Jubayr'),
  ],
});

// —— Tābiʿūn ——
patch('al-hasan-al-basri', {
  teachers: [
    P('anas-b-malik', 'Anas ibn Mālik'),
    P('s:aliibnabitalib', 'ʿAlī ibn Abī Ṭālib'),
    P('abdullah-ibn-masud', 'ʿAbdullāh ibn Masʿūd'),
  ],
  students: [
    P('s:qatadah', 'Qatādah'),
    P('s:ayyub', 'Ayyūb as-Sikhtiyānī'),
    P('s:yunus', 'Yūnus ibn ʿUbayd'),
  ],
  works: [W('Predigten und Ermahnungen'), W('Tafsīr-Überlieferungen'), W('Aussagen zu Zuhd und ʿAqīdah')],
});
patch('ibn-sirin', {
  teachers: [P('anas-b-malik', 'Anas ibn Mālik'), P('abu-hurayrah', 'Abū Hurayrah')],
  students: [P('s:ayyub', 'Ayyūb as-Sikhtiyānī'), P('s:hisham', 'Hishām ibn Ḥassān')],
  works: [W('Traumdeutung und Überlieferungen'), W('Fiqh-Gutachten')],
});
patch('sufyan-ibn-uyaynah', {
  teachers: [
    P('s:muhammadibnshihabazzuhri', 'az-Zuhrī'),
    P('s:amribndinar', 'ʿAmr ibn Dīnār'),
    P('s:abuishaq', 'Abū Isḥāq as-Sabīʿī'),
  ],
  students: [
    P('ash-shafii', 'ash-Shāfiʿī'),
    P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal'),
    P('s:aliibnalmadini', 'ʿAlī ibn al-Madīnī'),
  ],
  works: [W('Ḥadīth-Überlieferungen aus Mekka'), W('Aussagen zu Rijāl und Ilal')],
});
patch('s:atababirabah', {
  teachers: [P('ibn-abbas', 'Ibn ʿAbbās'), P('s:abusaidalkhudri', 'Abū Saʿīd al-Khudrī')],
  students: [P('al-awzai', 'al-Awzāʿī'), P('s:ibnjurayj', 'Ibn Jurayj')],
  works: [W('Fiqh- und Ḥadīth-Überlieferungen aus Mekka')],
});
patch('s:amribndinar', {
  teachers: [P('ibn-abbas', 'Ibn ʿAbbās'), P('s:jabir', 'Jābir ibn ʿAbdillāh')],
  students: [P('sufyan-ibn-uyaynah', 'Sufyān ibn ʿUyaynah'), P('s:shufbah', 'Shuʿbah')],
  works: [W('Ḥadīth-Überlieferungen aus Mekka')],
});
patch('s:malikibndinar', {
  teachers: [P('al-hasan-al-basri', 'al-Ḥasan al-Baṣrī')],
  works: [W('Aussagen zu Zuhd und Ermahnung')],
});
patch('s:qatadah', {
  teachers: [
    P('anas-b-malik', 'Anas ibn Mālik'),
    P('al-hasan-al-basri', 'al-Ḥasan al-Baṣrī'),
    P('s:saidalmusayyib', 'Saʿīd ibn al-Musayyib'),
  ],
  students: [P('s:saidibnabiaruba', 'Saʿīd ibn Abī ʿArūbah'), P('s:maamar', 'Maʿmar ibn Rāshid')],
  works: [W('Tafsīr Qatādah'), W('Ḥadīth-Überlieferungen')],
});
patch('s:umaribnabdalaziz', {
  teachers: [
    P('s:ibnumar', 'Ibn ʿUmar'),
    P('s:anass', 'Anas ibn Mālik'),
    P('s:saidalmusayyib', 'Saʿīd ibn al-Musayyib'),
  ],
  students: [P('s:muhammadibnshihabazzuhri', 'az-Zuhrī'), P('s:maymunibnmihran', 'Maymūn ibn Mihrān')],
  works: [W('Briefe und Verwaltungsordnungen'), W('Wiederbelebung der Sunnah')],
});
patch('al-fudayl', {
  teachers: [P('s:mansur', 'Manṣūr ibn al-Muʿtamir'), P('sufyan-ath-thauri', 'Sufyān ath-Thawrī')],
  students: [P('s:ibnmubarak', 'ʿAbdullāh ibn al-Mubārak'), P('s:bishr', 'Bishr al-Ḥāfī')],
  works: [W('Aussagen zu Zuhd und Tawbah'), W('Ermahnungen und Ḥadīth-Überlieferungen')],
});
patch('s:alfudaylbiyad', {
  teachers: [P('s:mansur', 'Manṣūr ibn al-Muʿtamir'), P('sufyan-ath-thauri', 'Sufyān ath-Thawrī')],
  works: [W('Aussagen zu Zuhd und Tawbah')],
});

// —— Frühe Imāme / Muḥaddithūn ——
patch('s:abdarrahmanibnmahdi', {
  teachers: [
    P('sufyan-ath-thauri', 'Sufyān ath-Thawrī'),
    P('s:shufbah', 'Shuʿbah'),
    P('malik-ibn-anas', 'Mālik ibn Anas'),
  ],
  students: [
    P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal'),
    P('s:yahyabmain', 'Yaḥyā ibn Maʿīn'),
    P('s:aliibnalmadini', 'ʿAlī ibn al-Madīnī'),
  ],
  works: [W('Aussagen zu Ilal und Rijāl'), W('Ḥadīth-Überlieferungen')],
});
patch('s:abdarrahmanbmahdi', {
  teachers: [P('sufyan-ath-thauri', 'Sufyān ath-Thawrī'), P('malik-ibn-anas', 'Mālik ibn Anas')],
  students: [P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal'), P('s:yahyabmain', 'Yaḥyā ibn Maʿīn')],
  works: [W('Aussagen zu Ilal und Rijāl')],
});
patch('s:yahyabmain', {
  teachers: [
    P('sufyan-ibn-uyaynah', 'Sufyān ibn ʿUyaynah'),
    P('s:abdarrahmanibnmahdi', 'ʿAbd ar-Raḥmān ibn Mahdī'),
    P('s:waki', 'Wakīʿ ibn al-Jarrāḥ'),
  ],
  students: [P('al-bukhari', 'al-Bukhārī'), P('abu-dawud', 'Abū Dāwūd'), P('muslim', 'Muslim')],
  works: [W('at-Tārīkh'), W('Ilal und Rijāl')],
});
patch('s:ishaqibnrahawayh', {
  teachers: [
    P('sufyan-ibn-uyaynah', 'Sufyān ibn ʿUyaynah'),
    P('s:abdarrazzaq', 'ʿAbd ar-Razzāq'),
    P('s:waki', 'Wakīʿ'),
  ],
  students: [P('al-bukhari', 'al-Bukhārī'), P('muslim', 'Muslim'), P('abu-isa-at-tirmidhi', 'at-Tirmidhī')],
  works: [W('al-Musnad'), W('Ḥadīth-Sammlungen')],
});
patch('s:ishaqbrahawayh', {
  teachers: [P('sufyan-ibn-uyaynah', 'Sufyān ibn ʿUyaynah'), P('s:abdarrazzaq', 'ʿAbd ar-Razzāq')],
  students: [P('al-bukhari', 'al-Bukhārī'), P('muslim', 'Muslim')],
  works: [W('al-Musnad')],
});
patch('abu-hatim-ar-razi', {
  teachers: [
    P('s:adamibnabiIyās', 'Ādam ibn Abī Iyās'),
    P('s:abuwalid', 'Abū al-Walīd aṭ-Ṭayālisī'),
    P('s:yahyabmain', 'Yaḥyā ibn Maʿīn'),
  ],
  students: [
    P('ibn-abi-hatim', 'Ibn Abī Ḥātim'),
    P('abu-zurah-ar-razi', 'Abū Zurʿah ar-Rāzī'),
    P('muslim', 'Muslim'),
  ],
  works: [W('al-Jarḥ wa-t-Taʿdīl (über seinen Sohn)'), W('Aussagen zu Rijāl und Ilal')],
});
patch('abu-zurah-ar-razi', {
  teachers: [
    P('abu-hatim-ar-razi', 'Abū Ḥātim ar-Rāzī'),
    P('s:yahyabmain', 'Yaḥyā ibn Maʿīn'),
    P('s:abuwalid', 'Abū al-Walīd aṭ-Ṭayālisī'),
  ],
  students: [P('ibn-abi-hatim', 'Ibn Abī Ḥātim'), P('muslim', 'Muslim')],
  works: [W('Aussagen zu Rijāl und Ilal'), W('Ḥadīth-Überlieferungen')],
});
patch('s:abuzurah', {
  teachers: [P('abu-hatim-ar-razi', 'Abū Ḥātim ar-Rāzī'), P('s:yahyabmain', 'Yaḥyā ibn Maʿīn')],
  works: [W('Aussagen zu Rijāl und Ilal')],
});
patch('s:uthmanibnsaidaddarimi', {
  teachers: [
    P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal'),
    P('s:yahyabmain', 'Yaḥyā ibn Maʿīn'),
    P('s:aliibnalmadini', 'ʿAlī ibn al-Madīnī'),
  ],
  students: [P('al-bukhari', 'al-Bukhārī'), P('abu-dawud', 'Abū Dāwūd')],
  works: [W('ar-Radd ʿalā al-Jahmiyyah'), W('Sunan ad-Dārimī (Überlieferung)')],
});
patch('al-barbahari', {
  teachers: [P('s:sahlattustari', 'Sahl at-Tustarī'), P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal')],
  students: [P('s:ibnbatta', 'Ibn Baṭṭah'), P('s:alajurri', 'al-Ājurrī')],
  works: [W('Sharḥ as-Sunnah')],
});
patch('al-lalakai', {
  teachers: [P('s:at-tabari', 'aṭ-Ṭabarī'), P('s:ibnabihatim', 'Ibn Abī Ḥātim')],
  students: [P('s:albayhaqi', 'al-Bayhaqī')],
  works: [W('Sharḥ Uṣūl Iʿtiqād Ahl as-Sunnah')],
});
patch('s:abubakralajurri', {
  teachers: [P('al-barbahari', 'al-Barbahārī'), P('s:abumuslim', 'Abū Muslim al-Kajjī')],
  students: [P('s:abunuaym', 'Abū Nuʿaym'), P('s:adaraqutni', 'ad-Dāraquṭnī')],
  works: [W('ash-Sharīʿah'), W('Kitāb al-Arbaʿīn'), W('Adab an-Nufūs')],
});
patch('s:ibnbattahalukbari', {
  teachers: [P('al-barbahari', 'al-Barbahārī'), P('s:abualiqasim', 'Abū ʿAlī')],
  works: [W('al-Ibānah ʿan Sharīʿat al-Firqah an-Nājiyah')],
});
patch('s:abujafarmuhammadibnuthmanibnabishaybah', {
  teachers: [P('s:ibnabishaybah', 'Ibn Abī Shaybah'), P('s:yahyabmain', 'Yaḥyā ibn Maʿīn')],
  works: [W('Ḥadīth- und Rijāl-Überlieferungen')],
});
patch('s:yazidibnharun', {
  teachers: [P('s:shufbah', 'Shuʿbah'), P('s:hammad', 'Ḥammād ibn Salamah')],
  students: [P('ahmad-ibn-hanbal', 'Aḥmad ibn Ḥanbal'), P('s:ishaqibnrahawayh', 'Isḥāq ibn Rāhawayh')],
  works: [W('Ḥadīth-Überlieferungen')],
});

// —— Spätere Gelehrte ——
patch('at-tabari', {
  teachers: [
    P('s:ibnabishaybah', 'Ibn Abī Shaybah'),
    P('s:muhammadibnbashshar', 'Muḥammad ibn Bashshār'),
    P('s:yunus', 'Yūnus ibn ʿAbd al-Aʿlā'),
  ],
  students: [P('s:ibnkamil', 'Ibn Kāmil'), P('s:abubakribnalbalawayh', 'Abū Bakr ibn Balawayh')],
  works: [W('Jāmiʿ al-Bayān (Tafsīr)'), W('Tārīkh ar-Rusul wal-Mulūk'), W('Tahdhīb al-Āthār')],
});
patch('ibn-abd-al-barr', {
  teachers: [P('s:abuumarattalanki', 'Abū ʿUmar aṭ-Ṭalamankī'), P('s:abuwalidalbaji', 'Abū al-Walīd al-Bājī')],
  students: [P('ibn-hazm', 'Ibn Ḥazm'), P('s:abuallialghassani', 'Abū ʿAlī al-Ghassānī')],
  works: [W('at-Tamhīd'), W('al-Istidhkār'), W('Jāmiʿ Bayān al-ʿIlm')],
});
patch('al-qurtubi', {
  teachers: [P('s:abualabbasalqurtubi', 'Abū al-ʿAbbās al-Qurṭubī'), P('ibn-abd-al-barr', 'Ibn ʿAbd al-Barr')],
  students: [P('s:ibnkhaldun', 'Ibn Khaldūn')],
  works: [W('al-Jāmiʿ li-Aḥkām al-Qurʾān'), W('at-Tadhkirah')],
});
patch('ibn-qudamah', {
  teachers: [P('s:abdulqadir', 'ʿAbd al-Qādir al-Jīlānī'), P('ibn-al-jawzi', 'Ibn al-Jawzī')],
  students: [P('ibn-taymiyyah', 'Ibn Taymiyyah'), P('s:diyaalmaqdisi', 'Ḍiyāʾ al-Maqdisī')],
  works: [W('al-Mughnī'), W('al-ʿUmdah'), W('Rawḍat an-Nāẓir'), W('Lumʿat al-Iʿtiqād')],
});
patch('ibn-al-jawzi', {
  teachers: [P('s:ibnnasir', 'Ibn Nāṣir'), P('s:abubakribnazaghwani', 'Abū Bakr ibn az-Zaghwānī')],
  students: [P('s:sibtibnaljawzi', 'Sibṭ ibn al-Jawzī'), P('ibn-qudamah', 'Ibn Qudāmah')],
  works: [W('Zād al-Masīr'), W('Ṣayd al-Khāṭir'), W('Talbīs Iblīs'), W('al-Muntaẓam')],
});
patch('al-qadi-iyad', {
  teachers: [P('s:abualialghassani', 'Abū ʿAlī al-Ghassānī'), P('s:ibnrushd', 'Ibn Rushd al-Jadd')],
  students: [P('s:ibnbashkuwal', 'Ibn Bashkuwāl')],
  works: [W('ash-Shifāʾ'), W('Tartīb al-Madārik'), W('Ikmāl al-Muʿlim')],
});
patch('al-mawardi', {
  teachers: [P('s:abuhamidalisafarayini', 'Abū Ḥāmid al-Isfarāyīnī')],
  works: [W('al-Aḥkām as-Sulṭāniyyah'), W('Adab ad-Dunyā wad-Dīn'), W('al-Ḥāwī al-Kabīr')],
});
patch('s:ibnabializz', {
  teachers: [P('ibn-kathir', 'Ibn Kathīr'), P('s:ibnalqayyim', 'Ibn al-Qayyim')],
  works: [W('Sharḥ al-ʿAqīdah aṭ-Ṭaḥāwiyyah')],
});
patch('s:assawkani', {
  teachers: [P('s:alamirassanani', 'al-Amīr aṣ-Ṣanʿānī'), P('s:ibnamer', 'Ibn al-Amīr')],
  students: [P('s:siddiqhasankhan', 'Ṣiddīq Ḥasan Khān')],
  works: [W('Nayl al-Awṭār'), W('Fatḥ al-Qadīr'), W('Irshād al-Fuḥūl')],
});
patch('s:ashshanqiti', {
  teachers: [P('s:muhammadalaminalshanqiti', 'Lehrtradition der Shanāqiṭah')],
  works: [W('Aḍwāʾ al-Bayān'), W('Mudhakkirah fī Uṣūl al-Fiqh')],
});

// Fix bad display names if present
function fixNames() {
  Object.keys(data).forEach((id) => {
    if (id.startsWith('_')) return;
    const e = data[id];
    ['teachers', 'students'].forEach((k) => {
      (e[k] || []).forEach((p) => {
        if (p && p.id && p.name === p.id) {
          const metaName =
            (data[p.id] && data[p.id].displayName) ||
            String(p.id)
              .replace(/^s:/, '')
              .replace(/-/g, ' ');
          if (metaName && metaName !== p.id) p.name = metaName;
        }
        if (p && p.name === 'abdullah-ibn-masud') p.name = 'ʿAbdullāh ibn Masʿūd';
      });
    });
  });
}
fixNames();

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
const ids = Object.keys(data).filter((k) => !k.startsWith('_'));
let emptyT = 0,
  emptyS = 0,
  emptyW = 0;
ids.forEach((id) => {
  const e = data[id];
  if (!(e.teachers || []).length) emptyT++;
  if (!(e.students || []).length) emptyS++;
  if (!(e.works || []).length) emptyW++;
});
console.log('curated keys', ids.length, 'empty T/S/W', emptyT, emptyS, emptyW);
