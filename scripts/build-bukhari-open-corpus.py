#!/usr/bin/env python3
"""Build the Dar Test Bukhari corpus: Kitab -> Bab -> Hadith, one Arabic file per kitab.

Primary source (CC BY 4.0 dataset, public-domain matn and isnad):
  open-hadith-data by samt-qa - https://github.com/samt-qa/open-hadith-data - CC BY 4.0
  Release v0.1.0, open-hadith-data-0.1.0.zip -> jsonl/bukhari.jsonl.gz
  Sultaniyya edition (Bulaq 1311 H., Shamela 1681), Fuad numbering as reference.
Cross-check only, for numbers the primary source does not carry:
  fawazahmed0/hadith-api edition ara-bukhari (Unlicense).

Usage:
  python3 scripts/build-bukhari-open-corpus.py /path/bukhari.jsonl.gz /path/ara-bukhari.min.json

Translations are not built here. They live in i18n/k-NN/<lang>.json and are loaded lazily.
"""
from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/hadith/open/sahih-al-bukhari"
LANGS = ["ar", "de", "en", "tr", "fr", "es", "bs", "ku", "ckb"]

# Kitab 1 has no bab heading in the dataset (parser gap). The Sultaniyya edition opens with this tarjama,
# followed by an-Nisa 4:163. Documented in SOURCE.md.
KITAB1_BAB = "كيف كان بدء الوحي إلى رسول الله صلى الله عليه وسلم"

TITLES = [
(1,"بدء الوحي","Badʾ al-Waḥy","The beginning of revelation","Vahyin başlangıcı","Le début de la révélation","El inicio de la revelación","Početak objave","Destpêka wehyê","دەستپێکی وەحی"),
(2,"الإيمان","al-Īmān","Faith","İman","La foi","La fe","Iman","Îman","ئیمان"),
(3,"العلم","al-ʿIlm","Knowledge","İlim","La science","El conocimiento","Znanje","Îlim","زانست"),
(4,"الوضوء","al-Wuḍūʾ","Ablution","Abdest","Les ablutions","La ablución","Abdest","Destnimêj","دەستنوێژ"),
(5,"الغسل","al-Ġusl","The full ritual bath","Gusül","Le bain rituel","El baño ritual","Gusul","Gustil","غوسل"),
(6,"الحيض","al-Ḥayḍ","Menstruation","Hayız","Les menstrues","La menstruación","Hajz","Hayz","حەیز"),
(7,"التيمم","at-Tayammum","Dry ablution","Teyemmüm","Le tayammum","El tayammum","Tejemmum","Teyemmum","تەیەمموم"),
(8,"الصلاة","aṣ-Ṣalāh","The prayer","Namaz","La prière","La oración","Namaz","Nimêj","نوێژ"),
(9,"مواقيت الصلاة","Mawāqīt aṣ-Ṣalāh","Times of the prayer","Namaz vakitleri","Les horaires de la prière","Los horarios de la oración","Vaktovi namaza","Wextên nimêjê","کاتەکانی نوێژ"),
(10,"الأذان","al-Aḏān","The call to prayer","Ezan","L'appel à la prière","La llamada a la oración","Ezan","Banga nimêjê","بانگ"),
(11,"الجمعة","al-Ǧumʿa","The Friday prayer","Cuma","La prière du vendredi","La oración del viernes","Džuma","Înî","هەینی"),
(12,"صلاة الخوف","Ṣalāt al-Ḫawf","The fear prayer","Korku namazı","La prière de la peur","La oración del miedo","Namaz straha","Nimêja tirsê","نوێژی ترس"),
(13,"العيدين","al-ʿĪdayn","The two festivals","İki bayram","Les deux fêtes","Las dos fiestas","Dva bajrama","Herdu cejn","دوو جەژن"),
(14,"الوتر","al-Witr","The witr prayer","Vitir","Le witr","El witr","Vitr","Witr","ویتر"),
(15,"الاستسقاء","al-Istisqāʾ","Prayer for rain","Yağmur duası","La prière pour la pluie","La rogativa de lluvia","Dova za kišu","Duaya baranê","نوێژی باران"),
(16,"الكسوف","al-Kusūf","The eclipse prayer","Küsuf","L'éclipse","El eclipse","Pomračenje","Girtina rojê","گیرانی خۆر و مانگ"),
(17,"سجود القرآن","Suǧūd al-Qurʾān","Prostration of recitation","Tilavet secdesi","La prosternation de récitation","La postración de la recitación","Sedžda učenja","Secdeya xwendinê","سوجوودی خوێندنەوە"),
(18,"التقصير","at-Taqṣīr","Shortening the prayer","Namazı kısaltmak","Le raccourcissement de la prière","El acortamiento de la oración","Skraćivanje namaza","Kurtkirina nimêjê","کورتکردنەوەی نوێژ"),
(19,"التهجد","at-Tahǧǧud","Night prayer","Teheccüd","La prière de nuit","La oración nocturna","Noćni namaz","Nimêja şevê","نوێژی شەو"),
(20,"فضل الصلاة في مسجد مكة والمدينة","Faḍl aṣ-ṣalāh fī masǧiday Makka wa-l-Madīna","Prayer in the mosques of Makkah and Madinah","Mekke ve Medine mescidinde namaz","La prière dans les deux mosquées","La oración en las dos mezquitas","Namaz u dva mesdžida","Nimêj di herdu mizgeftan de","نوێژ لە دوو مزگەوت"),
(21,"العمل في الصلاة","al-ʿAmal fī ṣ-ṣalāh","Actions during the prayer","Namazdaki davranış","Les actes dans la prière","Los actos en la oración","Radnje u namazu","Kiryar di nimêjê de","کردار لە نوێژدا"),
(22,"السهو","as-Sahw","Forgetfulness in prayer","Namazda yanılma","L'oubli dans la prière","El olvido en la oración","Zaborav u namazu","Jibîrîn di nimêjê de","لەبیرچوون لە نوێژدا"),
(23,"الجنائز","al-Ǧanāʾiz","Funerals","Cenazeler","Les funérailles","Los funerales","Dženaze","Cenaze","جەنازە"),
(24,"الزكاة","az-Zakāh","The obligatory alms","Zekât","L'aumône obligatoire","El azaque","Zekat","Zekat","زەکات"),
(25,"الحج","al-Ḥaǧǧ","The pilgrimage","Hac","Le pèlerinage","La peregrinación","Hadždž","Hec","حەج"),
(26,"العمرة","al-ʿUmra","The lesser pilgrimage","Umre","La ʿumra","La umra","Umra","Umre","عومرە"),
(27,"المحصر","al-Muḥṣar","The one prevented from completing the pilgrimage","Hacdan alıkonan","L'empêché","Quien es impedido","Spriječeni","Yê astengkirî","ئەوەی ڕێگری لێکراوە"),
(28,"جزاء الصيد","Ǧazāʾ aṣ-ṣayd","The penalty for hunting","Av cezası","La peine de la chasse","La pena de la caza","Kazna lova","Cezaya nêçîrê","سزای ڕاو"),
(29,"فضائل المدينة","Faḍāʾil al-Madīna","The virtues of Madinah","Medine'nin faziletleri","Les mérites de Médine","Las virtudes de Medina","Vrline Medine","Fezîletên Medîneyê","فەزڵی مەدینە"),
(30,"الصوم","aṣ-Ṣawm","Fasting","Oruç","Le jeûne","El ayuno","Post","Rojî","ڕۆژوو"),
(31,"صلاة التراويح","Ṣalāt at-tarāwīḥ","The night prayer of Ramaḍān","Teravih","Les tarāwīḥ","El tarawih","Teravih","Terawîh","تەڕاویح"),
(32,"فضل ليلة القدر","Faḍl laylat al-qadr","The night of the decree","Kadir gecesi","La nuit du décret","La noche del decreto","Lejletul-kadr","Şeva qedrê","شەوی قەدر"),
(33,"الاعتكاف","al-Iʿtikāf","Retreat in the mosque","İtikâf","La retraite à la mosquée","El retiro en la mezquita","Itikaf","Iʿtikaf","ئیعتیکاف"),
(34,"البيوع","al-Buyūʿ","Sales","Alışveriş","Les ventes","Las compraventas","Kupoprodaja","Kirîn û firotin","کڕین و فرۆشتن"),
(35,"السلم","as-Salam","Advance payment for later delivery","Selem","La vente à livraison différée","La venta a plazo","Selem","Selem","سەلەم"),
(36,"الشفعة","aš-Šufʿa","Pre-emption","Şüf'a","La préemption","El retracto","Šuf'a","Şufʿa","شوفعە"),
(37,"الإجارة","al-Iǧāra","Hiring","İcare","La location","El arrendamiento","Iznajmljivanje","Kirê","کرێ"),
(38,"الحوالة","al-Ḥawāla","Transfer of a debt","Havale","Le transfert de dette","La cesión de deuda","Prijenos duga","Veguhestina deyn","حەواڵە"),
(39,"الكفالة","al-Kafāla","Surety","Kefalet","La caution","La fianza","Jemstvo","Kefalet","کەفالەت"),
(40,"الوكالة","al-Wakāla","Agency","Vekâlet","Le mandat","La representación","Zastupanje","Wekalet","وەکالەت"),
(41,"الحرث والمزارعة","al-Ḥarṯ wa-l-muzāraʿa","Agriculture","Ziraat","L'agriculture","La agricultura","Poljoprivreda","Çandinî","کشتوکاڵ"),
(42,"المساقاة","al-Musāqāh","Irrigation partnership","Su ortaklığı","Le contrat d'irrigation","El contrato de riego","Navodnjavanje","Hevpariya avê","هاوبەشی ئاو"),
(43,"الاستقراض","al-Istiqrāḍ","Loans","Borç","Les prêts","Los préstamos","Zajmovi","Deyn","قەرز"),
(44,"الخصومات","al-Ḫuṣūmāt","Disputes","Davalar","Les litiges","Las disputas","Sporovi","Nîqaş","ناکۆکی"),
(45,"اللقطة","al-Luqaṭa","Found property","Lukata","L'objet trouvé","El hallazgo","Nađeno","Tişta dîtin","شتی دۆزراو"),
(46,"المظالم","al-Maẓālim","Wrongs","Zulümler","Les injustices","Las injusticias","Nepravde","Zilm","ستەم"),
(47,"الشركة","aš-Šarika","Partnership","Ortaklık","L'association","La sociedad","Ortakluk","Hevparî","هاوبەشی"),
(48,"الرهن","ar-Rahn","Pledges","Rehin","Le gage","La prenda","Zalog","Rehin","بارمتە"),
(49,"العتق","al-ʿItq","Freeing slaves","Köle azadı","L'affranchissement","La manumisión","Oslobađanje","Azadkirin","ئازادکردن"),
(50,"المكاتب","al-Mukātab","The contract of manumission","Mükâtebe","Le mukātab","El contrato de libertad","Mukateb","Mukâteb","موکاتەب"),
(51,"الهبة","al-Hiba","Gifts","Hibe","Les dons","Las donaciones","Pokloni","Diyarî","بەخشین"),
(52,"الشهادات","aš-Šahādāt","Testimony","Şahitlik","Les témoignages","Los testimonios","Svjedočenje","Şehadet","شایەتی"),
(53,"الصلح","aṣ-Ṣulḥ","Reconciliation","Sulh","La réconciliation","La conciliación","Pomirenje","Aştî","ئاشتی"),
(54,"الشروط","aš-Šurūṭ","Conditions","Şartlar","Les conditions","Las condiciones","Uslovi","Merc","مەرج"),
(55,"الوصايا","al-Waṣāyā","Bequests","Vasiyet","Les testaments","Los testamentos","Oporuke","Wesiyet","وەسیەت"),
(56,"الجهاد","al-Ǧihād","Striving in the path of Allah","Cihad","L'effort dans le chemin d'Allah","El esfuerzo en el camino de Allah","Džihad","Cihad","جیهاد"),
(57,"فرض الخمس","Farḍ al-ḫums","The fifth of the gains","Humus","Le cinquième","El quinto","Petina","Pêncek","پێنجەک"),
(58,"الجزية والموادعة","al-Ǧizya wa-l-muwādaʿa","The levy and the truce","Cizye","La capitation et la trêve","El tributo y la tregua","Džizja","Cizye","جیزە"),
(59,"بدء الخلق","Badʾ al-ḫalq","The beginning of creation","Yaratılışın başlangıcı","Le début de la création","El inicio de la creación","Početak stvaranja","Destpêka afirandinê","دەستپێکی دروستکردن"),
(60,"أحاديث الأنبياء","Aḥādīṯ al-anbiyāʾ","The prophets","Peygamberler","Les prophètes","Los profetas","Poslanici","Pêxember","پێغەمبەران"),
(61,"المناقب","al-Manāqib","Virtues","Menkıbeler","Les mérites","Las virtudes","Vrline","Fezîlet","فەزڵ"),
(62,"فضائل أصحاب النبي","Faḍāʾil aṣḥāb an-nabī","The companions of the Prophet","Sahabe faziletleri","Les compagnons du Prophète","Los compañeros del Profeta","Ashabi","Fezîletên sehaban","فەزڵی هاوەڵان"),
(63,"مناقب الأنصار","Manāqib al-anṣār","The helpers of Madinah","Ensar","Les auxiliaires","Los auxiliares","Ensarije","Ensar","ئەنسار"),
(64,"المغازي","al-Maġāzī","The expeditions","Gazveler","Les expéditions","Las expediciones","Pohodi","Sefer","سەفەرەکان"),
(65,"التفسير","at-Tafsīr","Explanation of the Qurʾān","Tefsir","L'explication du Coran","La explicación del Corán","Tefsir","Tefsîr","تەفسیر"),
(66,"فضائل القرآن","Faḍāʾil al-Qurʾān","Virtues of the Qurʾān","Kur'an'ın faziletleri","Les mérites du Coran","Las virtudes del Corán","Vrline Kur'ana","Fezîletên Qurʾānê","فەزڵی قورئان"),
(67,"النكاح","an-Nikāḥ","Marriage","Nikâh","Le mariage","El matrimonio","Brak","Mahr","مارە"),
(68,"الطلاق","aṭ-Ṭalāq","Divorce","Talak","Le divorce","El divorcio","Razvod","Talaq","تەڵاق"),
(69,"النفقات","an-Nafaqāt","Maintenance","Nafaka","L'entretien","El mantenimiento","Izdržavanje","Nefeqe","نەفەقە"),
(70,"الأطعمة","al-Aṭʿima","Food","Yiyecekler","Les aliments","Los alimentos","Hrana","Xwarin","خواردن"),
(71,"العقيقة","al-ʿAqīqa","The birth sacrifice","Akika","L'aqīqa","La aqíqa","Akika","Aqîqa","عەقیقە"),
(72,"الذبائح والصيد","aḏ-Ḏabāʾiḥ wa-ṣ-ṣayd","Slaughter and hunting","Kesim ve av","L'abattage et la chasse","El sacrificio y la caza","Klanje i lov","Serjêkirin û nêçîr","سەر بڕین و ڕاو"),
(73,"الأضاحي","al-Aḍāḥī","The festival sacrifice","Kurban","Le sacrifice de fête","El sacrificio festivo","Kurban","Qurban","قوربانی"),
(74,"الأشربة","al-Ašriba","Drinks","İçecekler","Les boissons","Las bebidas","Pića","Vexwarin","خواردنەوە"),
(75,"المرضى","al-Marḍā","The sick","Hastalar","Les malades","Los enfermos","Bolesnici","Nexweş","نەخۆش"),
(76,"الطب","aṭ-Ṭibb","Medicine","Tıp","La médecine","La medicina","Medicina","Tib","پزیشکی"),
(77,"اللباس","al-Libās","Clothing","Giyim","Les vêtements","La vestimenta","Odjeća","Cil","جل و بەرگ"),
(78,"الأدب","al-Adab","Good conduct","Edep","La bienséance","La conducta","Adab","Adab","ئەدەب"),
(79,"الاستئذان","al-Istiʾḏān","Asking permission","İzin isteme","Demander permission","Pedir permiso","Traženje dozvole","Destûr xwestin","داوای مۆڵەت"),
(80,"الدعوات","ad-Daʿawāt","Invocations","Dualar","Les invocations","Las invocaciones","Dova","Dua","دوعا"),
(81,"الرقاق","ar-Riqāq","What softens the heart","Kalbi yumuşatanlar","Ce qui attendrit le cœur","Lo que ablanda el corazón","Ono što mekša srce","Tiştên nermkirina dil","نەرمکردنی دڵ"),
(82,"القدر","al-Qadar","The divine decree","Kader","Le décret","El decreto","Kader","Qeder","قەدەر"),
(83,"الأيمان والنذور","al-Aymān wa-n-nuḏūr","Oaths and vows","Yeminler ve adaklar","Les serments et les vœux","Los juramentos y los votos","Zakletve i zavjeti","Sond û adak","سوێند و نەزر"),
(84,"الكفارات","al-Kaffārāt","Expiations","Keffaretler","Les expiations","Las expiaciones","Iskupljenja","Keffaret","کەفارەت"),
(85,"الفرائض","al-Farāʾiḍ","Inheritance shares","Miras payları","Les parts d'héritage","Las cuotas hereditarias","Nasljedni udjeli","Parve mirasê","پشکی میرات"),
(86,"الحدود","al-Ḥudūd","The set punishments","Hadler","Les peines fixées","Los castigos fijados","Propisane kazne","Sınorên diyarkirî","سزاکانی دیاریکراو"),
(87,"الديات","ad-Diyāt","Blood money","Diyet","Le prix du sang","La compensación","Krvnina","Diya","دیە"),
(88,"استتابة المرتدين","Istitābat al-murtaddīn","Those who leave Islam","Dinden dönenler","Ceux qui quittent l'islam","Quienes abandonan el islam","Oni koji napuste islam","Yên ku islamê dihêlin","ئەوانەی لە ئیسلام دەگەڕێنەوە"),
(89,"الإكراه","al-Ikrāh","Coercion","İkrah","La contrainte","La coacción","Prisila","Zor","ناچارکردن"),
(90,"الحيل","al-Ḥiyal","Artifice","Hileler","Les artifices","Los ardides","Varke","Hile","حیلە"),
(91,"التعبير","at-Taʿbīr","Dreams","Rüya tabiri","Les songes","Los sueños","Snovi","Xewn","خەون"),
(92,"الفتن","al-Fitan","Trials","Fitneler","Les épreuves","Las pruebas","Iskušenja","Fitne","فیتنە"),
(93,"الأحكام","al-Aḥkām","Judgments","Hükümler","Les jugements","Los juicios","Presude","Hukim","حوکم"),
(94,"التمني","at-Tamannī","Wishes","Temenni","Les souhaits","Los deseos","Želje","Hêvî","ئارەزوو"),
(95,"أخبار الآحاد","Aḫbār al-āḥād","Reports of single narrators","Âhâd haberler","Les récits isolés","Los relatos singulares","Pojedinačna predanja","Ragihandinên yekane","هەواڵی تاک"),
(96,"الاعتصام بالكتاب والسنة","al-Iʿtiṣām bi-l-kitāb wa-s-sunna","Holding to the Book and the Sunnah","Kitap ve Sünnet'e sarılmak","S'attacher au Livre et à la Sunna","Aferrarse al Libro y a la Sunna","Držanje Knjige i Sunneta","Girêdana bi Kitêb û Sunnetê","پەیوەستبوون بە کتێب و سوننەت"),
(97,"التوحيد","at-Tawḥīd","The oneness of Allah","Tevhid","L'unicité d'Allah","La unicidad de Allah","Tevhid","Tewhîd","تەوحید"),
]



def titles_for(row):
    return dict(zip(["ar", "de", "en", "tr", "fr", "es", "bs", "ku", "ckb"], row[1:]))


def num_id(row):
    return row["id"].split(":", 1)[1]


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/bukhari.jsonl.gz")
    fz_src = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/ara-bukhari.min.json")
    rows = [json.loads(line) for line in gzip.open(src, "rt", encoding="utf-8")]
    title_by_no = {row[0]: row for row in TITLES}
    kitabs = {}
    order = []
    for row in rows:
        k = row["kitab"]["n"]
        if k not in kitabs:
            kitabs[k] = {"source": row["kitab"]["title"], "babs": {}, "border": []}
            order.append(k)
        kb = kitabs[k]
        b = row["bab"]["n"]
        if b not in kb["babs"]:
            title = row["bab"]["title"]
            opening = False
            if k == 1 and b == 0 and not title:
                title = KITAB1_BAB
            elif b == 0 and not title:
                opening = True
            kb["babs"][b] = {"n": b, "id": "k-%02d-b-%03d" % (k, b), "ar": title or "", "opening": opening, "hadiths": []}
            kb["border"].append(b)
        text = row["text"]
        matn = row.get("matn") or ""
        item = {"n": num_id(row), "p": row["numbers"]["printed"], "ar": text}
        if row["numbers"].get("sub"):
            item["sub"] = row["numbers"]["sub"]
        at = text.find(matn) if matn else -1
        if at > 0:
            item["mi"] = at
        kb["babs"][b]["hadiths"].append(item)
    printed = set(p for row in rows for p in row["numbers"]["printed"])
    # Fuad numbers absent from the primary source: keep the cross-check wording, clearly flagged.
    fz = json.loads(fz_src.read_text(encoding="utf-8"))
    loose = []
    for h in fz["hadiths"]:
        n = h["hadithnumber"]
        if isinstance(n, float):
            continue
        if n not in printed and h.get("text"):
            loose.append({"n": str(n), "p": [n], "ar": h["text"], "crossCheck": True})
    (OUT / "kitab").mkdir(parents=True, exist_ok=True)
    for old in (OUT / "kitab").glob("k-*.json"):
        old.unlink()
    toc = []
    numbers = {}
    total = 0
    bab_total = 0
    for k in order:
        kb = kitabs[k]
        babs = [kb["babs"][b] for b in kb["border"]]
        count = sum(len(b["hadiths"]) for b in babs)
        kid = "k-%02d" % k
        names = titles_for(title_by_no[k])
        payload = {"workId": "sahih-al-buhari", "kitabNo": k, "id": kid, "loose": False,
                   "sourceTitle": kb["source"], "titles": names, "babs": babs}
        (OUT / "kitab" / (kid + ".json")).write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        toc.append({"no": k, "id": kid, "loose": False, "count": count, "babCount": len(babs),
                    "sourceTitle": kb["source"], "titles": names})
        for b in babs:
            for h in b["hadiths"]:
                numbers[h["n"]] = k
                for p in h["p"]:
                    numbers.setdefault(str(p), k)
        total += count
        bab_total += len(babs)
    if loose:
        names = {"ar": "أحاديث من نشرة المقابلة", "de": "Weitere Ḥadīṯe", "en": "Further ḥadīths",
                 "tr": "Diğer hadisler", "fr": "Autres ḥadīths", "es": "Otros ḥadīṯes", "bs": "Ostali hadisi",
                 "ku": "Hedîsên din", "ckb": "حەدیسی تر"}
        payload = {"workId": "sahih-al-buhari", "kitabNo": 0, "id": "k-00", "loose": True, "sourceTitle": "",
                   "titles": names, "babs": [{"n": 0, "id": "k-00-b-000", "ar": "", "opening": False, "hadiths": loose}]}
        (OUT / "kitab" / "k-00.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        toc.append({"no": 0, "id": "k-00", "loose": True, "count": len(loose), "babCount": 1, "sourceTitle": "", "titles": names})
        for h in loose:
            numbers[h["n"]] = 0
    (OUT / "toc.json").write_text(json.dumps({
        "workId": "sahih-al-buhari",
        "edition": "open-hadith-data v0.1.0 (Sultaniyya, Shamela 1681)",
        "attribution": "open-hadith-data by samt-qa - https://github.com/samt-qa/open-hadith-data - CC BY 4.0",
        "hadithCount": total + len(loose),
        "kitabCount": len(order),
        "babCount": bab_total,
        "kitab": toc,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "numbers.json").write_text(json.dumps(numbers, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("kitab", len(order), "bab", bab_total, "hadith", total, "crossCheck", len(loose), "numbers", len(numbers))


if __name__ == "__main__":
    main()
