#!/usr/bin/env python3
"""Split the open Arabic Bukhari edition into one JSON file per kitāb.

Source file: /tmp/ara-bukhari.min.json
(download: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json)

The English edition of that dataset is not copied. It is a copyrighted translation.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/tmp/ara-bukhari.min.json")
OUT = ROOT / "data/hadith/open/sahih-al-bukhari"
I18N = OUT / "i18n-kitab-01.json"

# no, ar, de, en, tr, fr, es, bs, ku, ckb
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
    keys = ["ar", "de", "en", "tr", "fr", "es", "bs", "ku", "ckb"]
    return dict(zip(keys, row[1:]))


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    sections = data["metadata"]["sections"]
    extra = {}
    if I18N.exists():
        extra = json.loads(I18N.read_text(encoding="utf-8")).get("hadiths", {})
    groups = {i: [] for i in range(0, 98)}
    for hadith in data["hadiths"]:
        book = int(hadith["reference"]["book"])
        number = hadith["hadithnumber"]
        number_s = str(int(number)) if isinstance(number, float) and number.is_integer() else str(number)
        if isinstance(number, float) and not number.is_integer():
            number_s = ("%s" % number).rstrip("0").rstrip(".") if False else str(number)
        item = {"n": number_s, "ar": hadith["text"]}
        add = extra.get(number_s)
        if add:
            item.update(add)
        groups.setdefault(book, []).append(item)
    OUT.joinpath("kitab").mkdir(parents=True, exist_ok=True)
    title_by_no = {row[0]: row for row in TITLES}
    toc = []
    numbers = {}
    for book in range(0, 98):
        rows = groups.get(book) or []
        kid = "k-%02d" % book
        loose = book == 0
        if loose:
            names = {
                "ar": "أحاديث بلا كتاب في هذه النشرة",
                "de": "Weitere Ḥadīṯe",
                "en": "Further ḥadīths",
                "tr": "Diğer hadisler",
                "fr": "Autres ḥadīths",
                "es": "Otros ḥadīṯes",
                "bs": "Ostali hadisi",
                "ku": "Hedîsên din",
                "ckb": "حەدیسی تر",
            }
        else:
            names = titles_for(title_by_no[book])
        payload = {
            "workId": "sahih-al-buhari",
            "kitabNo": book,
            "id": kid,
            "loose": loose,
            "sourceTitle": sections.get(str(book), ""),
            "titles": names,
            "hadiths": rows,
        }
        (OUT / "kitab" / ("%s.json" % kid)).write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        toc.append({
            "no": book,
            "id": kid,
            "loose": loose,
            "count": len(rows),
            "sourceTitle": sections.get(str(book), ""),
            "titles": names,
        })
        for row in rows:
            numbers[row["n"]] = book
    (OUT / "toc.json").write_text(json.dumps({
        "workId": "sahih-al-buhari",
        "edition": "ara-bukhari",
        "hadithCount": sum(item["count"] for item in toc),
        "kitabCount": 97,
        "kitab": toc,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "numbers.json").write_text(json.dumps(numbers, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("kitab", len(toc), "hadith", sum(item["count"] for item in toc), "numbers", len(numbers))


if __name__ == "__main__":
    main()
