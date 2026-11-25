#!/usr/bin/env node
"use strict";
/* Builds public adult locale packs from existing manuscripts plus owner-approved
 * in-repo gap fills. No network and no paid translation API.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const root = path.resolve(__dirname, "../..");
const LOCALES = ["ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
const REVIEW = "machine-translation-owner-approved";

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}
function writeJson(rel, data) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data));
}
function optionalJson(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}
function sha(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}
function front(text) {
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  const meta = {};
  let body = text;
  if (m) {
    body = text.slice(m[0].length).trim();
    for (const line of m[1].split(/\r?\n/)) {
      const mm = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
      if (mm) meta[mm[1]] = mm[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body };
}
function norm(s) {
  return String(s || "").replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}

const EXTRA = {
  alle: { ar: "الكل", en: "All", tr: "Tümü", ku: "Hemû", ckb: "هەموو", bs: "Sve", fr: "Tous", es: "Todos" },
  gebet: { ar: "صلاة", en: "prayer", tr: "namaz", ku: "nimêj", ckb: "نوێژ", bs: "namaz", fr: "prière", es: "oración" },
  Noch: { ar: "بعد", en: "Still", tr: "Hâlâ", ku: "Hîn", ckb: "هێشتا", bs: "Još", fr: "Encore", es: "Aún" },
  "Noch ca.": { ar: "بعد نحو", en: "About", tr: "Yaklaşık", ku: "Nêzîkî", ckb: "نزیکەی", bs: "Otprilike", fr: "Environ", es: "Aprox." },
  öffnen: { ar: "فتح", en: "open", tr: "aç", ku: "veke", ckb: "کردنەوە", bs: "otvori", fr: "ouvrir", es: "abrir" },
  "MEISTE BEITRÄGE": { ar: "أكثر المقالات", en: "MOST POSTS", tr: "EN ÇOK YAZI", ku: "ZÊDETIRÎN NIVÎS", ckb: "زۆرترین بابەت", bs: "NAJVIŠE ČLANAKA", fr: "LE PLUS D’ARTICLES", es: "MÁS ARTÍCULOS" },
  nicht: { ar: "ليس", en: "not", tr: "değil", ku: "ne", ckb: "نا", bs: "nije", fr: "pas", es: "no" },
  "WENIGSTE BEITRÄGE": { ar: "أقل المقالات", en: "FEWEST POSTS", tr: "EN AZ YAZI", ku: "KÊMTIRÎN NIVÎS", ckb: "کەمترین بابەت", bs: "NAJMANJE ČLANAKA", fr: "LE MOINS D’ARTICLES", es: "MENOS ARTÍCULOS" },
  "· öffnen": { ar: "· فتح", en: "· open", tr: "· aç", ku: "· veke", ckb: "· کردنەوە", bs: "· otvori", fr: "· ouvrir", es: "· abrir" },
  "/5 gewählt": { ar: "/5 محدد", en: "/5 selected", tr: "/5 seçildi", ku: "/5 hilbijartî", ckb: "/5 هەڵبژێردراو", bs: "/5 odabrano", fr: "/5 choisi", es: "/5 elegido" },
  anfänger: { ar: "مبتدئ", en: "beginner", tr: "başlangıç", ku: "destpêk", ckb: "سەرەتایی", bs: "početnik", fr: "débutant", es: "principiante" },
  auswählen: { ar: "اختيار", en: "select", tr: "seç", ku: "hilbijêre", ckb: "هەڵبژاردن", bs: "odaberi", fr: "choisir", es: "elegir" },
  "Für eine Beurteilung des persönlichen Einzelfalls müssen der tatsächliche Grund und die Umstände geprüft werden. Wa-Allāhu aʿlam.": {
    ar: "للحكم على الحالة الشخصية لا بد من النظر في السبب الحقيقي والظروف. والله أعلم.",
    en: "Judging a personal case requires the actual reason and the circumstances. Allah knows best.",
    tr: "Kişisel bir durumun hükmü için gerçek sebep ve şartlar incelenmelidir. Allah en doğrusunu bilir.",
    ku: "Ji bo hukmê rewşeke kesane divê sedema rast û merc werin lêkolîn. Allah çêtir dizane.",
    ckb: "بۆ حوکم لەسەر حاڵەتێکی کەسی دەبێت هۆکاری ڕاستەقینە و بارودۆخەکان بپشکنرێن. خوا باشتر دەزانێت.",
    bs: "Za ocjenu ličnog slučaja moraju se provjeriti stvarni razlog i okolnosti. Allah najbolje zna.",
    fr: "Juger un cas personnel exige d’examiner la raison réelle et les circonstances. Allah sait mieux.",
    es: "Para valorar un caso personal hay que examinar el motivo real y las circunstancias. Alá sabe más."
  },
  gläubigen: { ar: "المؤمن", en: "believer", tr: "mümin", ku: "bawermend", ckb: "بڕوادار", bs: "vjernik", fr: "croyant", es: "creyente" },
  keine: { ar: "لا شيء", en: "none", tr: "yok", ku: "tune", ckb: "نییە", bs: "nema", fr: "aucune", es: "ninguna" },
  märz: { ar: "مارس", en: "March", tr: "mart", ku: "adar", ckb: "ئازار", bs: "mart", fr: "mars", es: "marzo" },
  "nicht nach dem richtet": { ar: "لا يحكم بحسب", en: "does not judge by", tr: "göre hükmetmez", ku: "li gorî hukm nake", ckb: "بەپێی ئەوە حوکم نادات", bs: "ne sudi prema", fr: "ne juge pas selon", es: "no juzga según" },
  noch: { ar: "بعد", en: "still", tr: "hâlâ", ku: "hîn", ckb: "هێشتا", bs: "još", fr: "encore", es: "aún" },
  ungläubigen: { ar: "الكافر", en: "disbeliever", tr: "kâfir", ku: "kafir", ckb: "بێباوەڕ", bs: "nevjernik", fr: "mécréant", es: "incrédulo" },
  wird: { ar: "سيصبح", en: "will", tr: "olur", ku: "dibe", ckb: "دەبێت", bs: "bit će", fr: "sera", es: "será" },
  Kurzfazit: { ar: "الخلاصة", en: "Brief conclusion", tr: "Kısa sonuç", ku: "Encama kurt", ckb: "کۆتایی کورت", bs: "Kratak zaključak", fr: "Conclusion brève", es: "Conclusión breve" },
  "Direkte Quellenstellen öffnen": { ar: "فتح مواضع المصادر", en: "Open the source passages", tr: "Kaynak yerlerini aç", ku: "Cihên çavkaniyê veke", ckb: "شوێنی سەرچاوەکان بکەرەوە", bs: "Otvori izvorna mjesta", fr: "Ouvrir les passages sources", es: "Abrir los pasajes fuente" },
  "Arabischer Originalwortlaut": { ar: "النص العربي الأصلي", en: "Original Arabic wording", tr: "Arapça özgün metin", ku: "Gotina resen a erebî", ckb: "دەقی ڕەسەنی عەرەبی", bs: "Izvorni arapski tekst", fr: "Texte arabe original", es: "Texto árabe original" },
  Originalwortlaut: { ar: "النص الأصلي", en: "Original wording", tr: "Özgün metin", ku: "Gotina resen", ckb: "دەقی ڕەسەن", bs: "Izvorni tekst", fr: "Texte original", es: "Texto original" },
  "WISSEN AUS QURʾĀN, SUNNAH UND ĀṮĀR": { ar: "علم من القرآن والسنة والآثار", en: "KNOWLEDGE FROM THE QURʾĀN, SUNNAH AND ĀTHĀR", tr: "KUR'ÂN, SÜNNET VE ÂSÂRDAN İLİM", ku: "ZANÎN JI QURʾĀN, SUNNAH Û ÂTHÂR", ckb: "زانست لە قورئان و سوننەت و ئاسار", bs: "ZNANJE IZ KUR'ANA, SUNNETA I ASARA", fr: "SAVOIR DU QURʾĀN, DE LA SUNNAH ET DES ĀTHĀR", es: "SABER DEL QURʾĀN, LA SUNNAH Y LOS ĀTHĀR" },
  "Interne Quellenseite": { ar: "صفحة المصدر الداخلية", en: "Internal source page", tr: "Dahili kaynak sayfası", ku: "Rûpela çavkaniya navxweyî", ckb: "پەڕەی ناوخۆیی سەرچاوە", bs: "Interna stranica izvora", fr: "Page source interne", es: "Página interna de la fuente" },
  Quellenwerk: { ar: "كتاب المصدر", en: "Source work", tr: "Kaynak eser", ku: "Berhema çavkaniyê", ckb: "کتێبی سەرچاوە", bs: "Izvorno djelo", fr: "Ouvrage source", es: "Obra fuente" },
  Kurzlink: { ar: "رابط مختصر", en: "Short link", tr: "Kısa bağlantı", ku: "Girêdana kurt", ckb: "بەستەری کورت", bs: "Kratka veza", fr: "Lien court", es: "Enlace corto" },
  Originalnachweise: { ar: "المصادر الأصلية", en: "Original references", tr: "Özgün kaynaklar", ku: "Çavkaniyên resen", ckb: "سەرچاوە ڕەسەنەکان", bs: "Izvorne reference", fr: "Références originales", es: "Referencias originales" },
  "Direkte Aussage:": { ar: "القول المباشر:", en: "Direct statement:", tr: "Doğrudan söz:", ku: "Gotina rasterast:", ckb: "وتەی ڕاستەوخۆ:", bs: "Izravna izjava:", fr: "Propos direct :", es: "Declaración directa:" },
  "Quellen:": { ar: "المصادر:", en: "Sources:", tr: "Kaynaklar:", ku: "Çavkanî:", ckb: "سەرچاوەکان:", bs: "Izvori:", fr: "Sources :", es: "Fuentes:" },
  "Einordnung der Aussage": { ar: "تصنيف القول", en: "Classification of the statement", tr: "Sözün tasnifi", ku: "Tesnîfa gotinê", ckb: "پۆلێنی وتە", bs: "Klasifikacija izjave", fr: "Classification du propos", es: "Clasificación de la declaración" },
  "Übersetzung:": { ar: "الترجمة:", en: "Translation:", tr: "Çeviri:", ku: "Werger:", ckb: "وەرگێڕان:", bs: "Prijevod:", fr: "Traduction :", es: "Traducción:" },
  "📚 Lernbereich öffnen": { ar: "📚 فتح قسم التعلم", en: "📚 Open the learning section", tr: "📚 Öğrenme bölümünü aç", ku: "📚 Beşa fêrbûnê veke", ckb: "📚 بەشی فێربوون بکەرەوە", bs: "📚 Otvori odjeljak za učenje", fr: "📚 Ouvrir l’apprentissage", es: "📚 Abrir el aprendizaje" },
  "Isnād-Bereich": { ar: "موضع الإسناد", en: "Isnād section", tr: "İsnad bölümü", ku: "Beşa isnadê", ckb: "بەشی ئیس ناد", bs: "Odjeljak isnada", fr: "Section de l’isnād", es: "Sección del isnād" },
  "Deutsch:": { ar: "الألمانية:", en: "German:", tr: "Almanca:", ku: "Almanî:", ckb: "ئەڵمانی:", bs: "Njemački:", fr: "Allemand :", es: "Alemán:" },
  "Deutsche Bedeutung:": { ar: "المعنى الألماني:", en: "German meaning:", tr: "Almanca anlam:", ku: "Wateya almanî:", ckb: "واتای ئەڵمانی:", bs: "Njemačko značenje:", fr: "Sens allemand :", es: "Significado alemán:" },
  "Was belegt diese Stelle?": { ar: "ماذا تثبت هذه الفقرة؟", en: "What does this passage establish?", tr: "Bu yer neyi belgeler?", ku: "Ev cih çi îsbat dike?", ckb: "ئەم شوێنە چی دەسەلمێنێت؟", bs: "Šta ovo mjesto dokazuje?", fr: "Que établit ce passage ?", es: "¿Qué prueba este pasaje?" },
  "Klarstellung:": { ar: "توضيح:", en: "Clarification:", tr: "Açıklama:", ku: "Ronîkirin:", ckb: "ڕوونکردنەوە:", bs: "Pojašnjenje:", fr: "Précision :", es: "Aclaración:" },
  Textart: { ar: "نوع النص", en: "Text type", tr: "Metin türü", ku: "Cureya nivîsê", ckb: "جۆری دەق", bs: "Vrsta teksta", fr: "Type de texte", es: "Tipo de texto" },
  "Direkte Originalnachweise": { ar: "المصادر الأصلية المباشرة", en: "Direct original references", tr: "Doğrudan özgün kaynaklar", ku: "Çavkaniyên resen ên rasterast", ckb: "سەرچاوە ڕەسەنە ڕاستەوخۆکان", bs: "Izravne izvorne reference", fr: "Références originales directes", es: "Referencias originales directas" },
  "QURʾĀN · SUNNAH · ĀṮĀR": { ar: "القرآن · السنة · الآثار", en: "QURʾĀN · SUNNAH · ĀTHĀR", tr: "KUR'ÂN · SÜNNET · ÂSÂR", ku: "QURʾĀN · SUNNAH · ÂTHÂR", ckb: "قورئان · سوننەت · ئاسار", bs: "KUR'AN · SUNNET · ASARI", fr: "QURʾĀN · SUNNAH · ĀTHĀR", es: "QURʾĀN · SUNNAH · ĀTHĀR" },
  "PDF/Scan öffnen": { ar: "فتح PDF / المسح", en: "Open PDF / scan", tr: "PDF / taramayı aç", ku: "PDF / skanê veke", ckb: "PDF / سکان بکەرەوە", bs: "Otvori PDF / sken", fr: "Ouvrir le PDF / scan", es: "Abrir PDF / escaneo" },
  "Beiträge nach Qurʾān, Sunnah & Āthār": { ar: "مقالات من القرآن والسنة والآثار", en: "Articles from the Qurʾān, Sunnah and Āthār", tr: "Kur'ân, Sünnet ve âsâra göre yazılar", ku: "Nivîsên li ser Qurʾān, Sunnah û âthâr", ckb: "بابەتەکان لە قورئان و سوننەت و ئاسار", bs: "Članci iz Kur'ana, sunneta i asara", fr: "Articles d’après le Qurʾān, la Sunnah et les Āthār", es: "Artículos según el Qurʾān, la Sunnah y los Āthār" },
  Sprecher: { ar: "القائل", en: "Speaker", tr: "Söyleyen", ku: "Gotûbêj", ckb: "گوێزەرەوە", bs: "Govornik", fr: "Locuteur", es: "Quien habla" },
  Thema: { ar: "الموضوع", en: "Topic", tr: "Konu", ku: "Mijar", ckb: "بابەت", bs: "Tema", fr: "Thème", es: "Tema" },
  "Hinweis:": { ar: "تنبيه:", en: "Note:", tr: "Not:", ku: "Nîşe:", ckb: "تێبینی:", bs: "Napomena:", fr: "Note :", es: "Nota:" },
  "Fundstelle prüfen": { ar: "تحقق من موضع النص", en: "Check the passage", tr: "Yeri kontrol et", ku: "Cihê metnê kontrol bike", ckb: "شوێنی دەق بپشکنە", bs: "Provjeri mjesto", fr: "Vérifier le passage", es: "Comprobar el pasaje" },
  "Wissen vertiefen": { ar: "تعميق المعرفة", en: "Deepen your knowledge", tr: "Bilgiyi derinleştir", ku: "Zanînê kûr bike", ckb: "زانست قووڵتر بکە", bs: "Produbi znanje", fr: "Approfondir", es: "Profundizar" },
  "Vier Verständnisfragen · private Selbstprüfung · kein weiteres Gelehrtenzitat": {
    ar: "أربعة أسئلة فهم · مراجعة خاصة · ليس اقتباسًا إضافيًا من عالم",
    en: "Four comprehension questions · private self-check · not another scholar’s quotation",
    tr: "Dört anlama sorusu · kişisel öz denetim · ek bir âlim sözü değildir",
    ku: "Çar pirsên fêmkirinê · kontrola taybet · ne gotineke zêde ya alimekî ye",
    ckb: "چوار پرسیاری تێگەیشتن · پشکنینی تایبەت · وتەیەکی زیادەی زانایەک نییە",
    bs: "Četiri pitanja razumijevanja · lična provjera · nije dodatni citat učenjaka",
    fr: "Quatre questions de compréhension · examen personnel · pas une nouvelle citation de savant",
    es: "Cuatro preguntas de comprensión · revisión personal · no es otra cita de un sabio"
  }
};

const ui = readJson("test/i18n/adult-ui-locales-seven.json");
for (const [de, pack] of Object.entries(EXTRA)) {
  for (const locale of LOCALES) {
    if (!ui.translations[locale]) ui.translations[locale] = {};
    if (!ui.translations[locale][de]) ui.translations[locale][de] = pack[locale];
  }
}
if (!ui.availableLocales.includes("fr")) ui.availableLocales.push("fr", "es");
ui.names = ui.names || {};
ui.names.ar = "العربية";
ui.names.fr = "Français";
ui.names.es = "Español";
ui.review = REVIEW;
ui.publicDisplayAllowed = true;
ui.humanReligiousReview = false;
fs.writeFileSync(path.join(root, "test/i18n/adult-ui-locales-seven.json"), JSON.stringify(ui));

const posts = {};
const postDir = path.join(root, "desktop-preview/i18n-core-v1/translations");
for (const locale of LOCALES) posts[locale] = {};
for (const locale of LOCALES) {
  const dir = path.join(postDir, locale, "post");
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
    const id = String(doc.id || "").replace(/^post:/, "");
    if (!id || !doc.fields) continue;
    posts[locale][id] = { title: doc.fields.title || "", body: doc.fields.body || "" };
  }
}
const postGap = optionalJson("content/i18n/agent-posts-gap-20261125.json");
if (postGap && postGap.items) {
  for (const [id, pack] of Object.entries(postGap.items)) {
    for (const locale of LOCALES) {
      const row = pack[locale];
      if (row && row.title && row.body) posts[locale][id] = { title: row.title, body: row.body };
    }
  }
}

const hadithGerman = new Map();
for (const file of fs.readdirSync(path.join(root, "apple-tv/hadith"), { recursive: true })) {
  if (!String(file).endsWith(".json") || !path.basename(String(file)).startsWith("HAD-")) continue;
  const doc = JSON.parse(fs.readFileSync(path.join(root, "apple-tv/hadith", file), "utf8"));
  hadithGerman.set(doc.id || path.basename(String(file), ".json"), norm(doc.textMarkdown || ""));
}
const surface = readJson("test/i18n/adult-surface-drafts.json");
const duas = {};
const duaByMeaning = {};
const quiz = {};
const learning = {};
const hadith = {};
for (const locale of LOCALES) {
  duas[locale] = {};
  duaByMeaning[locale] = {};
  quiz[locale] = {};
  learning[locale] = {};
  hadith[locale] = {};
}
for (const rec of Object.values(surface.records || {})) {
  const kind = rec.kind;
  const id = String(rec.id || "").slice(kind.length + 1);
  for (const locale of LOCALES) {
    const tr = rec.translations && rec.translations[locale];
    if (!tr) continue;
    if (kind === "dua") {
      duas[locale][id] = { title: tr.title || "", occasion: tr.occasion || "", meaning: tr.meaning || "" };
      if (rec.german && rec.german.meaning) duaByMeaning[locale][norm(rec.german.meaning)] = duas[locale][id];
      if (rec.german && rec.german.title) duaByMeaning[locale][norm(rec.german.title)] = duas[locale][id];
    } else if (kind === "quiz" || kind === "learning") {
      const answers = ["a0", "a1", "a2", "a3"].map((k) => tr[k]).filter((x) => typeof x === "string");
      const row = { question: tr.question || "", explanation: tr.explanation || "", answers };
      if (kind === "quiz") quiz[locale][id] = row;
      else learning[locale][id] = row;
    } else if (kind === "hadith") {
      const current = hadithGerman.get(id);
      const draft = norm(rec.german && rec.german.text);
      if (current && draft && current !== draft) continue;
      hadith[locale][id] = {
        text: tr.text || "",
        narrator: tr.narratorLine || "",
        speaker: tr.speakerLabel || "",
        sharh: tr.sharh || ""
      };
    }
  }
}

const blocked = readJson("desktop-preview/i18n-core-v1/blocked-source-review.json");
const blockedIds = new Set((blocked.items || []).map((x) => x.id));
for (const locale of LOCALES) {
  for (const id of blockedIds) {
    if (id.startsWith("hadith:")) delete hadith[locale][id.slice(7)];
    if (id.startsWith("post:")) delete posts[locale][id.slice(5)];
  }
}

const hadithGap = optionalJson("content/i18n/agent-hadith-gap-20261125.json");
if (hadithGap && hadithGap.items) {
  for (const [id, pack] of Object.entries(hadithGap.items)) {
    if (blockedIds.has("hadith:" + id)) continue;
    for (const locale of LOCALES) {
      const text = pack.text && pack.text[locale];
      if (!text) continue;
      hadith[locale][id] = {
        text,
        narrator: (pack.narrator && pack.narrator[locale]) || "",
        speaker: (pack.speaker && pack.speaker[locale]) || "",
        sharh: (pack.sharh && pack.sharh[locale]) || ""
      };
    }
  }
}

const qQuotes = {};
for (const locale of LOCALES) qQuotes[locale] = {};
const quoteFile = optionalJson("content/i18n/agent-q-quotes-20261125.json");
if (quoteFile && quoteFile.quotes) {
  for (const row of Object.values(quoteFile.quotes)) {
    const de = norm(row.de || "");
    if (!de) continue;
    for (const locale of LOCALES) if (row[locale]) qQuotes[locale][de] = row[locale];
  }
}

const stamp = {
  schemaVersion: 1,
  review: REVIEW,
  publicDisplayAllowed: true,
  humanReligiousReview: false,
  source: "existing-machine-drafts-plus-in-repo-gap-fill",
  paidApiCalls: 0
};
for (const locale of LOCALES) {
  const entries = ui.translations[locale] || {};
  writeJson("assets/i18n/catalog/" + locale + ".json", Object.assign({ locale, entries }, stamp));
  writeJson("assets/i18n/content/" + locale + ".json", Object.assign({
    locale,
    posts: posts[locale],
    duas: duas[locale],
    duaByMeaning: duaByMeaning[locale],
    quiz: quiz[locale],
    learning: learning[locale],
    qQuotes: qQuotes[locale]
  }, stamp));
  writeJson("assets/i18n/content/hadith-" + locale + ".json", Object.assign({
    locale, items: hadith[locale]
  }, stamp));
}

function countPosts() {
  return fs.readdirSync(path.join(root, "content/posts")).filter((n) => n.endsWith(".md")).length;
}
function countQ() {
  return fs.readdirSync(path.join(root, "q")).filter((n) => /^\d+$/.test(n)).length;
}
const postTotal = countPosts();
const qTotal = countQ();
const qLocaleFiles = fs.readdirSync(path.join(root, "assets")).filter((n) => /^q\d+-locales\.json$/.test(n)).length;
const coverage = { schemaVersion: 1, review: REVIEW, humanReligiousReview: false, generatedAt: "2026-11-25", locales: {} };
for (const locale of ["de"].concat(LOCALES)) {
  const uiKeys = locale === "de" ? Object.keys(ui.translations.en || {}).length : Object.keys(ui.translations[locale] || {}).length;
  coverage.locales[locale] = {
    uiKeys,
    posts: locale === "de" ? postTotal : Object.keys(posts[locale] || {}).length,
    postsTotal: postTotal,
    dua: locale === "de" ? Object.keys(duas.tr).length : Object.keys(duas[locale]).length,
    quiz: locale === "de" ? Object.keys(quiz.tr).length : Object.keys(quiz[locale]).length,
    hadith: locale === "de" ? Object.keys(hadith.tr).length + blocked.items.filter((x) => x.kind === "hadith").length : Object.keys(hadith[locale]).length,
    hadithPublished: locale === "de" ? null : Object.keys(hadith[locale]).length,
    qCardsWithOwnLocaleFile: qLocaleFiles,
    qCards: qTotal,
    qPrimaryQuotes: locale === "de" ? 0 : Object.keys(qQuotes[locale]).length,
    learningQuestions: locale === "de" ? Object.keys(learning.tr).length : Object.keys(learning[locale]).length
  };
}
writeJson("content/i18n/adult-nine-locale-coverage-20261125.json", coverage);
const gap = {
  schemaVersion: 1,
  review: REVIEW,
  humanReligiousReview: false,
  note: "Only items that must not be machine-filled. Existing drafts and in-repo gap fills are published with review machine-translation-owner-approved.",
  blockedSources: {
    count: blocked.summary.blockedItems,
    tasks: blocked.summary.blockedTranslationTasks,
    byKind: blocked.summary.byKind,
    cause: "awaiting source review; not translated and not published",
    ids: (blocked.items || []).map((x) => x.id)
  },
  quranMeanings: { count: 6236, reason: "Verse-by-verse Qurʾān meanings are a separate finite corpus and are not filled by this locale pack." },
  onesignalLanguageCodes: { localesWithoutCode: ["ku", "ckb"], reason: "Kurmancî and Soranî have no OneSignal language code. Push sending was not changed." }
};
writeJson("content/i18n/adult-nine-locale-gaps-20261125.json", gap);
const policy = {
  schemaVersion: 1,
  review: REVIEW,
  publicDisplayAllowed: true,
  humanReligiousReview: false,
  approvedBy: "Serhat",
  approvedAt: "2026-11-25",
  note: "Owner decision: existing machine translations and the in-repo gap fill may be shown. This is not a human religious review.",
  locales: ["de"].concat(LOCALES),
  frUnlocked: true,
  esUnlocked: true,
  autoTranslateSwitch: false
};
writeJson("content/i18n/adult-machine-translation-approval-v1.json", policy);
console.log(JSON.stringify(coverage.locales.tr, null, 2));
console.log("quotes tr", Object.keys(qQuotes.tr).length, "hadith tr", Object.keys(hadith.tr).length, "posts tr", Object.keys(posts.tr).length);
