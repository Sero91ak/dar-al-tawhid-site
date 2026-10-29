/* DĀR AL TAWḤĪD KIDS · V24 begriffssicherer Unterricht.
 * These are child-friendly pedagogical paraphrases, NEVER forged Salaf quotations.
 * No generative audio; verified Serhat V4 clips only, and only after human approval.
 */
(function(){
"use strict";
const entries=[
  {
    "id": "tawhid",
    "term": "Tawḥīd",
    "aliases": [
      "tauhid",
      "tawhid"
    ],
    "age": {
      "4-5": "Allah allein anbeten.",
      "6-8": "Wir glauben, dass Allah Einer ist, und wir beten nur Ihn an.",
      "9-10": "Tawḥīd bedeutet, Allah als den Einen anzuerkennen und die Anbetung allein an Ihn zu richten."
    },
    "source": {
      "reference": "Qurʾān 112:1; 1:5",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "iman",
    "term": "Īmān",
    "aliases": [
      "iman",
      "imaan"
    ],
    "age": {
      "4-5": "An Allah glauben.",
      "6-8": "Īmān heißt Glaube an Allah und das, was Er uns gelehrt hat.",
      "9-10": "Īmān umfasst die Glaubensgrundlagen, über die uns der Qurʾān und die authentische Sunnah berichten."
    },
    "source": {
      "reference": "Ṣaḥīḥ Muslim 8a (Ḥadīṯ Ǧibrīl)",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "ikhlas",
    "term": "Ikhlāṣ",
    "aliases": [
      "ikhlas",
      "ikhlas"
    ],
    "age": {
      "4-5": "Etwas Gutes für Allah tun.",
      "6-8": "Ikhlāṣ bedeutet, eine gute Tat aufrichtig für Allah zu tun, statt nur gelobt zu werden.",
      "9-10": "Ikhlāṣ ist Aufrichtigkeit in der Anbetung: Die Absicht richtet sich an Allah und nicht an die Bewunderung anderer."
    },
    "source": {
      "reference": "Qurʾān 98:5; Ṣaḥīḥ al-Buḫārī 1",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "aqidah",
    "term": "ʿAqīdah",
    "aliases": [
      "aqidah",
      "akida",
      "aqida"
    ],
    "age": {
      "4-5": "Das, was wir über Allah glauben.",
      "6-8": "ʿAqīdah heißt unsere Glaubenslehre: was wir über Allah und die Grundlagen des Glaubens lernen.",
      "9-10": "ʿAqīdah bezeichnet die islamischen Glaubensgrundlagen aus Qurʾān und authentischer Sunnah."
    },
    "source": {
      "reference": "Qurʾān 2:285; Ṣaḥīḥ Muslim 8a",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "adab",
    "term": "Adab",
    "aliases": [
      "adab"
    ],
    "age": {
      "4-5": "Gutes Benehmen.",
      "6-8": "Adab bedeutet freundliches, rücksichtsvolles Verhalten und gute Umgangsformen.",
      "9-10": "Adab beschreibt angemessenes Benehmen, Respekt und Rücksicht, die wir aus islamischen Lehren lernen."
    },
    "source": {
      "reference": "Qurʾān 49:11; 17:23",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "akhlaq",
    "term": "Akhlāq",
    "aliases": [
      "akhlaq",
      "akhlaq"
    ],
    "age": {
      "4-5": "Ein guter Charakter.",
      "6-8": "Akhlāq bedeutet, wie wir uns verhalten, zum Beispiel ehrlich und freundlich.",
      "9-10": "Akhlāq umfasst die Eigenschaften und Gewohnheiten eines Menschen, etwa Ehrlichkeit, Geduld und Güte."
    },
    "source": {
      "reference": "Qurʾān 68:4; 16:90",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "tarbiyah",
    "term": "Tarbiyah",
    "aliases": [
      "tarbiya",
      "tarbiyya"
    ],
    "age": {
      "4-5": "Schritt für Schritt Gutes lernen.",
      "6-8": "Tarbiyah bedeutet, beim Lernen und Großwerden liebevoll begleitet zu werden.",
      "9-10": "Tarbiyah ist Erziehung und Förderung guter Gewohnheiten, Wissen und verantwortlichen Handelns."
    },
    "source": {
      "reference": "Pädagogische Begriffserklärung; keine wörtliche Überlieferung",
      "kind": "fachdefinition"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "nafs",
    "term": "Nafs",
    "aliases": [
      "nafs"
    ],
    "age": {
      "4-5": "Dein eigenes Ich und deine Gefühle.",
      "6-8": "Nafs ist ein arabisches Wort für die eigene Person. Auch unsere Wünsche gehören zu uns.",
      "9-10": "Nafs kann die eigene Person und das innere Selbst bezeichnen. Im Unterricht lernen wir, Wünsche und Gefühle verantwortlich zu lenken."
    },
    "source": {
      "reference": "Qurʾān 91:7–10",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "tazkiyah",
    "term": "Tazkiyah",
    "aliases": [
      "tazkiyat",
      "tazkiya",
      "tazkiyat an nafs"
    ],
    "age": {
      "4-5": "Gute Dinge im Herzen wachsen lassen.",
      "6-8": "Tazkiyah bedeutet, an unserem Verhalten zu arbeiten und schlechte Gewohnheiten zu verbessern.",
      "9-10": "Tazkiyat an-Nafs ist die Arbeit an der eigenen inneren Haltung und an guten Taten, wie es der Qurʾān beim Reinigen der Seele anspricht."
    },
    "source": {
      "reference": "Qurʾān 91:9–10",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "sabr",
    "term": "Ṣabr",
    "aliases": [
      "sabr"
    ],
    "age": {
      "4-5": "Geduldig bleiben.",
      "6-8": "Ṣabr bedeutet, ruhig und standhaft zu bleiben, auch wenn etwas schwer ist.",
      "9-10": "Ṣabr ist Geduld und Standhaftigkeit: nicht aufgeben, eine schwierige Lage gut bewältigen und Allah um Hilfe bitten."
    },
    "source": {
      "reference": "Qurʾān 2:153",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "amanah",
    "term": "Amānah",
    "aliases": [
      "amanah"
    ],
    "age": {
      "4-5": "Auf etwas gut aufpassen.",
      "6-8": "Amānah bedeutet etwas, das dir anvertraut wurde, sorgsam zu behandeln.",
      "9-10": "Amānah ist eine anvertraute Sache oder Verantwortung, die wir ehrlich und zuverlässig erfüllen sollen."
    },
    "source": {
      "reference": "Qurʾān 23:8",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "sidq",
    "term": "Ṣidq",
    "aliases": [
      "sidq",
      "sidq"
    ],
    "age": {
      "4-5": "Die Wahrheit sagen.",
      "6-8": "Ṣidq bedeutet Ehrlichkeit und Wahrhaftigkeit beim Sprechen und Handeln.",
      "9-10": "Ṣidq heißt Wahrhaftigkeit. Sie umfasst ehrliche Worte und ein Verhalten, das zu diesen Worten passt."
    },
    "source": {
      "reference": "Qurʾān 9:119; Ṣaḥīḥ Muslim 2607",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "salam",
    "term": "Salām",
    "aliases": [
      "salam",
      "salaam"
    ],
    "age": {
      "4-5": "Ein Friedensgruß.",
      "6-8": "Salām ist unser freundlicher Gruß. Wir wünschen Frieden.",
      "9-10": "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh ist ein islamischer Friedensgruß. Wir antworten respektvoll und freundlich."
    },
    "source": {
      "reference": "Qurʾān 4:86",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "wudu",
    "term": "Wuḍūʾ",
    "aliases": [
      "wudu",
      "wudhu",
      "woodoo"
    ],
    "age": {
      "4-5": "Die Waschung vor dem Gebet.",
      "6-8": "Wuḍūʾ heißt Gebetswaschung. Dabei reinigen wir bestimmte Körperteile.",
      "9-10": "Wuḍūʾ ist die rituelle Gebetswaschung nach den im Qurʾān und der Sunnah beschriebenen Schritten."
    },
    "source": {
      "reference": "Qurʾān 5:6",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "taharah",
    "term": "Ṭahārah",
    "aliases": [
      "taharah",
      "tahara"
    ],
    "age": {
      "4-5": "Rein sein.",
      "6-8": "Ṭahārah bedeutet Reinheit; dazu gehört auch, auf Sauberkeit zu achten.",
      "9-10": "Ṭahārah umfasst im Fiqh die religiöse Reinheit. Sie ist nicht mit gewöhnlichem Aufräumen gleichzusetzen."
    },
    "source": {
      "reference": "Qurʾān 5:6",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "salah",
    "term": "Ṣalāh",
    "aliases": [
      "salah",
      "salat"
    ],
    "age": {
      "4-5": "Das Gebet für Allah.",
      "6-8": "Ṣalāh ist das islamische Gebet, das wir Schritt für Schritt lernen.",
      "9-10": "Ṣalāh ist das vorgeschriebene rituelle Gebet. Seine Durchführung lernen wir aus Qurʾān und authentischer Sunnah."
    },
    "source": {
      "reference": "Qurʾān 20:14; Ṣaḥīḥ al-Buḫārī 631",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "dua",
    "term": "Duʿāʾ",
    "aliases": [
      "dua",
      "duaa"
    ],
    "age": {
      "4-5": "Allah um etwas bitten.",
      "6-8": "Duʿāʾ ist ein Bittgebet. Wir wenden uns dabei an Allah.",
      "9-10": "Duʿāʾ ist die Hinwendung an Allah im Bittgebet. Menschen dürfen wir um gewöhnliche praktische Hilfe bitten."
    },
    "source": {
      "reference": "Qurʾān 40:60; 1:5",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "sunnah",
    "term": "Sunnah",
    "aliases": [
      "sunna",
      "sunnah"
    ],
    "age": {
      "4-5": "Was der Prophet ﷺ uns gelehrt hat.",
      "6-8": "Sunnah nennen wir die überlieferte Lehre und das Vorbild des Propheten Muḥammad ﷺ.",
      "9-10": "Sunnah umfasst die authentisch überlieferten Aussagen, Handlungen und Bestätigungen des Propheten ﷺ."
    },
    "source": {
      "reference": "Qurʾān 59:7; Ṣaḥīḥ al-Buḫārī 631",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "quran",
    "term": "Qurʾān",
    "aliases": [
      "quran",
      "qur'an",
      "koran"
    ],
    "age": {
      "4-5": "Allahs Wort.",
      "6-8": "Der Qurʾān ist Allahs Offenbarung, die wir auf Arabisch hören und lesen.",
      "9-10": "Der Qurʾān ist die von Allah offenbarte Schrift. Der arabische Vers und seine deutsche Übersetzung sind nicht dasselbe."
    },
    "source": {
      "reference": "Qurʾān 2:2; 12:2",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "hadith",
    "term": "Ḥadīṯ",
    "aliases": [
      "hadith",
      "hadis"
    ],
    "age": {
      "4-5": "Ein Bericht über den Propheten ﷺ.",
      "6-8": "Ein Ḥadīṯ berichtet, was der Prophet ﷺ gesagt oder getan hat.",
      "9-10": "Ein Ḥadīṯ ist eine Überlieferung über den Propheten ﷺ; wir prüfen die Authentizität der Überlieferung."
    },
    "source": {
      "reference": "Fachbegriff der Ḥadīṯ-Wissenschaft; keine wörtliche Qurʾān-Definition",
      "kind": "fachdefinition"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "sahabah",
    "term": "Ṣaḥābah",
    "aliases": [
      "sahaba",
      "sahabah"
    ],
    "age": {
      "4-5": "Die Gefährten des Propheten ﷺ.",
      "6-8": "Ṣaḥābah nennen wir die muslimischen Menschen, die dem Propheten ﷺ begegnet sind.",
      "9-10": "Ṣaḥābah sind die Gefährten des Propheten ﷺ. Ihre Berichte müssen mit der Überlieferung und ihrem Zusammenhang geprüft werden."
    },
    "source": {
      "reference": "Qurʾān 9:100 (Lob früher Gefährten); Fachdefinition",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "tabiin",
    "term": "Tābiʿīn",
    "aliases": [
      "tabiin",
      "tabi'in",
      "tabiin"
    ],
    "age": {
      "4-5": "Die Generation nach den Gefährten.",
      "6-8": "Tābiʿīn nennt man Muslime, die Gefährten des Propheten ﷺ kennengelernt haben.",
      "9-10": "Tābiʿīn sind Angehörige der nachfolgenden Generation, die Ṣaḥābah trafen. Einzelne Aussagen benötigen überprüfbare Überlieferungen."
    },
    "source": {
      "reference": "Qurʾān 9:100 (Nachfolgende); historische Fachdefinition",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "salaf",
    "term": "Salaf",
    "aliases": [
      "salaf",
      "salafus salihin"
    ],
    "age": {
      "4-5": "Die frühen rechtschaffenen Muslime.",
      "6-8": "Salaf bezeichnet die frühen Generationen der Muslime, von denen wir belegtes Wissen lernen.",
      "9-10": "Mit as-Salaf aṣ-Ṣāliḥ werden die rechtschaffenen frühen muslimischen Generationen bezeichnet. Ihre einzelnen Aussagen müssen quellenkritisch belegt werden."
    },
    "source": {
      "reference": "Ṣaḥīḥ al-Buḫārī 2652 (frühe Generationen); historische Fachdefinition",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "rahmah",
    "term": "Raḥmah",
    "aliases": [
      "rahma",
      "rahmah"
    ],
    "age": {
      "4-5": "Barmherzigkeit.",
      "6-8": "Raḥmah ist Barmherzigkeit: Wir gehen freundlich mit anderen und mit Tieren um.",
      "9-10": "Raḥmah heißt Barmherzigkeit und liebevolle Fürsorge. Allahs Barmherzigkeit ist nicht wie die der Geschöpfe."
    },
    "source": {
      "reference": "Qurʾān 7:156; Ṣaḥīḥ al-Buḫārī 2363",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "bismillah",
    "term": "Bismillāh",
    "aliases": [
      "bismillah",
      "bismilla"
    ],
    "age": {
      "4-5": "Im Namen Allahs.",
      "6-8": "Bismillāh sagen wir zum Beispiel vor dem Essen. Es heißt: Im Namen Allahs.",
      "9-10": "Bismillāh heißt Im Namen Allahs. Der Prophet ﷺ lehrte den Jungen ʿUmar ibn Abī Salamah, Allahs Namen vor dem Essen zu nennen."
    },
    "source": {
      "reference": "Ṣaḥīḥ al-Buḫārī 5376",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "ibadah",
    "term": "ʿIbādah",
    "aliases": [
      "ibadah",
      "ibada"
    ],
    "age": {
      "4-5": "Allah dienen und Ihn anbeten.",
      "6-8": "ʿIbādah ist Anbetung. Wir beten Allah allein an und richten unser Bittgebet an Ihn.",
      "9-10": "ʿIbādah umfasst gottesdienstliche Handlungen, die wir allein Allah widmen, nach Qurʾān und authentischer Sunnah."
    },
    "source": {
      "reference": "Qurʾān 1:5; 51:56",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "niyyah",
    "term": "Niyyah",
    "aliases": [
      "niya",
      "niyyah",
      "niyyat"
    ],
    "age": {
      "4-5": "Eine Absicht haben.",
      "6-8": "Niyyah bedeutet Absicht. Ich weiß, warum ich etwas tue.",
      "9-10": "Niyyah ist die innere Absicht hinter einer Handlung. Der Prophet ﷺ erklärte die Bedeutung der Absichten."
    },
    "source": {
      "reference": "Ṣaḥīḥ al-Buḫārī 1; Ṣaḥīḥ Muslim 1907",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "dhikr",
    "term": "Ḏikr",
    "aliases": [
      "dhikr",
      "zikr",
      "adhkar",
      "adkar"
    ],
    "age": {
      "4-5": "An Allah denken.",
      "6-8": "Ḏikr bedeutet, Allah mit guten Worten zu gedenken.",
      "9-10": "Ḏikr ist das bewusste Gedenken Allahs; Aḏkār sind mehrere überlieferte Gedenkformeln."
    },
    "source": {
      "reference": "Qurʾān 13:28",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "qadar",
    "term": "Qadar",
    "aliases": [
      "qadar",
      "al qadar"
    ],
    "age": {
      "4-5": "Allahs Wissen und Bestimmung.",
      "6-8": "Qadar gehört zu unserem Glauben. Allah kennt alles, und wir bemühen uns, Gutes zu tun.",
      "9-10": "Qadar ist der Glaube an Allahs Bestimmung. Allahs vollkommenes Wissen hebt unsere Verantwortung zum Handeln nicht auf."
    },
    "source": {
      "reference": "Ṣaḥīḥ Muslim 8a (Ḥadīṯ Ǧibrīl)",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "shirk",
    "term": "Shirk",
    "aliases": [
      "shirk",
      "schirk"
    ],
    "age": {
      "4-5": "Allah jemanden gleichstellen.",
      "6-8": "Shirk heißt, jemandem oder etwas die Anbetung zu geben, die nur Allah zusteht.",
      "9-10": "Shirk bezeichnet das Beigesellen bei Allah in der Anbetung. Kinder sollen dies als Glaubensgrundlage verstehen, nicht Menschen beurteilen."
    },
    "source": {
      "reference": "Qurʾān 4:36; 31:13",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "sira",
    "term": "Sīrah",
    "aliases": [
      "sirah",
      "sira"
    ],
    "age": {
      "4-5": "Die Lebensgeschichte des Propheten ﷺ.",
      "6-8": "Sīrah erzählt von der Lebensgeschichte des Propheten Muḥammad ﷺ.",
      "9-10": "Die Sīrah beschreibt das Leben des Propheten ﷺ. Berichte werden nach ihrer Überlieferung und dem historischen Zusammenhang geprüft."
    },
    "source": {
      "reference": "Historische Fachbezeichnung; Ereignisse jeweils gesondert belegen",
      "kind": "fachdefinition"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "zakat",
    "term": "Zakāh",
    "aliases": [
      "zakat",
      "zakah"
    ],
    "age": {
      "4-5": "Etwas vom eigenen Vermögen abgeben.",
      "6-8": "Zakāh ist eine vorgeschriebene Abgabe für Menschen, die die Voraussetzungen erfüllen.",
      "9-10": "Zakāh ist eine verpflichtende Vermögensabgabe unter bestimmten Voraussetzungen; diese werden im Fiqh genauer erklärt."
    },
    "source": {
      "reference": "Qurʾān 2:43",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  },
  {
    "id": "ramadan",
    "term": "Ramaḍān",
    "aliases": [
      "ramadan",
      "ramazan"
    ],
    "age": {
      "4-5": "Der Monat des Fastens.",
      "6-8": "Ramaḍān ist ein besonderer Monat für Muslime. Kinder lernen darüber ohne Zwang zu fasten.",
      "9-10": "Ramaḍān ist der neunte islamische Monat, in dem erwachsene, verpflichtete Muslime fasten; Kinder lernen altersgerecht darüber."
    },
    "source": {
      "reference": "Qurʾān 2:185",
      "kind": "quran-sunnah-grounded"
    },
    "contentType": "pädagogische Paraphrase – kein wörtliches Gelehrtenzitat",
    "reviewStatus": "requires-owner-language-review-before-audio-approval"
  }
];
function plain(text){
 return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .replace(/[ḥḤ]/g,"h").replace(/[ṣṢ]/g,"s").replace(/[ṭṬ]/g,"t").replace(/[ḍḌ]/g,"d")
 .replace(/[ṯṮ]/g,"th").replace(/[ḏḎ]/g,"dh").replace(/[ǧǦ]/g,"g")
 .replace(/[ʿʾ‘’']/g,"").toLocaleLowerCase("de");
}
function termsFor(lesson,age,limit=7){
 const t=lesson||{},a=t.ageText?.[age]||{};
 const leading=[t.title,t.topic,t.lead,a.intro].filter(Boolean).join(" ");
 const others=[...(a.lines||t.lines||[]),a.evidence,t.hadith?.text,t.quran?.label].filter(Boolean).join(" ");
 const all=plain(leading+" "+others+" Qurʾān Sunnah");
 const primary=plain(leading);
 return entries.map(entry=>{
  const aliases=[entry.term,...entry.aliases].map(plain).filter(Boolean);
  const found=aliases.some(v=>new RegExp("(^|[^\\p{L}])"+v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?=$|[^\\p{L}])","u").test(all));
  const priority=aliases.some(v=>new RegExp("(^|[^\\p{L}])"+v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?=$|[^\\p{L}])","u").test(primary));
  return {entry,found,priority};
 }).filter(t=>t.found).sort((a,b)=>Number(b.priority)-Number(a.priority)).slice(0,limit).map(t=>t.entry);
}
function phrase(entry,age){
 const a=String(entry?.age?.[age]||entry?.age?.["6-8"]||"").trim();
 if(!a)return null;
 // An age-level definition that already begins with its term must not be
 // prefixed a second time. It is a pedagogical explanation, not a quote.
 const spoken=plain(a),word=plain(entry.term);
 const startsWithTerm=spoken===word||spoken.startsWith(word+" ")||spoken.startsWith(word+":");
 const startsWithVariant=(entry.id==="tazkiyah"&&spoken.startsWith("tazkiyat an nafs"))||
  (entry.id==="salam"&&spoken.startsWith("as salamu"));
 return startsWithTerm||startsWithVariant?a:entry.term+" bedeutet: "+a;
}
function approvedVoiceFor(entry,age,owner){
 const text=phrase(entry,age);
 const e=text&&owner?.masterEntry?.(text);
 return !!(e&&e.url&&e.approvedForPlayback===true&&
  e.voiceId==="DkU7j9uO4ZEtLD2iRZSH"&&e.voiceProfileId==="serhat-owner-voice-2026"&&
  e.modelId==="eleven_v4"&&e.voiceSettingsProfile==="kids_story"&&
  e.sourceVoice==="authorized-owner-voice"&&e.sourceSpeaker==="Serhat Abu Malik");
}
function mount(host,lesson,age,options={}){
 if(!host)return [];
 host.replaceChildren();
 const matches=termsFor(lesson,age);
 host.hidden=!matches.length;
 if(!matches.length)return [];
 const heading=document.createElement("strong");heading.className="academy-term-heading";heading.textContent="Wörter einfach erklärt";
 const note=document.createElement("p");note.className="academy-term-note";note.textContent="Tippe auf ein Wort. Wir erklären es dir.";
 const line=document.createElement("div");line.className="academy-term-list";
 const detail=document.createElement("section");detail.className="academy-term-detail";detail.hidden=true;
 const title=document.createElement("strong"),desc=document.createElement("p"),source=document.createElement("p"),audioStatus=document.createElement("p");
 source.className="academy-term-source";source.hidden=age==="4-5";audioStatus.className="academy-term-audio-status";audioStatus.setAttribute("role","status");
 detail.append(title,desc,source,audioStatus);
 let active=null;
 for(const term of matches){
  const btn=document.createElement("button");btn.type="button";btn.className="academy-term-button";btn.textContent=term.term;
  btn.setAttribute("aria-expanded","false");btn.setAttribute("aria-label",term.term+" einfach erklären");
  btn.addEventListener("click",()=>{
   options.stopAudio?.();
   // Preschool sees the first explanation already expanded. Tapping the word
   // must still start its approved voice clip; do not interpret it as a close.
   for(const x of line.children)x.setAttribute("aria-expanded","false");
   active=term.id;btn.setAttribute("aria-expanded","true");detail.hidden=false;
   title.textContent=term.term;
   desc.textContent=term.age[age]||term.age["6-8"];
   source.textContent="Lernbezug: "+term.source.reference+" · kindgerechte Erklärung, kein Originalzitat.";
   const owner=window.DARKidsOwnerVoice;
   if(!approvedVoiceFor(term,age,owner)){
    audioStatus.textContent="Du kannst die Erklärung lesen. Zum Anhören fehlt noch die passende Aufnahme.";
    return;
   }
   audioStatus.textContent="Du hörst jetzt die Erklärung.";
   const spoken=phrase(term,age);
   try{
    const ok=owner.play(spoken,{source:"kids-academy-term-v24",rate:1,
     onended:()=>{if(active===term.id)audioStatus.textContent="Erklärung angehört.";},
     onerror:()=>{if(active===term.id)audioStatus.textContent="Die Aufnahme konnte nicht abgespielt werden. Die Erklärung steht oben als Text."}});
    if(!ok)audioStatus.textContent="Die Aufnahme konnte nicht gestartet werden. Lies die Erklärung oben.";
   }catch(_){audioStatus.textContent="Die Aufnahme konnte nicht gestartet werden. Lies die Erklärung oben."}
  });
  line.append(btn);
 }
 host.append(heading,note,line,detail);
 if(age==="4-5"&&matches.length){
  const first=matches[0];active=first.id;detail.hidden=false;
  line.firstChild?.setAttribute("aria-expanded","true");
  title.textContent=first.term;desc.textContent=first.age[age];
  source.textContent="Lernbezug: "+first.source.reference+" · kindgerechte Erklärung, kein Originalzitat.";
  audioStatus.textContent="Zum Anhören tippe auf das Wort.";
 }
 return matches;
}
window.DARKidsAcademyTermCoach=Object.freeze({version:"v24",entries,plain,termsFor,phrase,approvedVoiceFor,mount});
})();
