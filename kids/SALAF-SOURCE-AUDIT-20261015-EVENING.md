# Interner Beleg- und Freigabebericht · Schätze der Salaf · 15.10.2026, Abend

## Ziel
Vier **veröffentlichte, vollständig belegte** Kindergeschichten pro acht Themen = 32 freigegebene Mastertexte. Keine ungeprüften Kinder-Platzhalter, keine fremden Sektenfiguren, kein technischer Freigabestatus im Besuchermodus.

## Im vorliegenden Release geprüft

### 1. Imām al-Bukhārī – die ehrliche Korrektur (`sidq`)

- Frühislamischer sunnitischer Ḥadīṯ-Imām, verst. 256 n. H., persönlich aus dem Ahl-al-Ḥadīṯ-Kontext; keine bereits benutzte Hauptperson.
- Ibn Ḥaǧar, *Taġlīq at-Taʿlīq*, Bd. 5, S. 386–387, „Ḏikr manšaʾihī wa-ṭalabihī al-ḥadīṯ“: https://www.islamweb.net/ar/library/content/1062/1848/
- Berichtkette im Buch über die Überlieferung von al-Firabrī bis zu **Muḥammad ibn Abī Ḥātim, al-Bukhārīs Schreiber**; dieser fragte al-Bukhārī direkt nach seinem Lernbeginn. Originalanker: «قال: ألهمت حفظ الحديث وأنا في الكتاب ... فقال له بعض أصحابه: ابن كم كنت إذ رددت عليه؟ فقال له: ابن إحدى عشرة سنة».
- Verifizierbarer Sachverhalt: al-Bukhārī erinnerte sich, mit etwa elf Jahren die Angabe „Abū az-Zubayr“ in einem Überliefererweg zu beanstanden; sein Lehrer prüfte die Buchvorlage und korrigierte zu „az-Zubayr ibn ʿAdī“. Das Beispiel zeigt prüfbares Wissen, nicht den Wert einer außergewöhnlichen Begabung.
- **Nicht übernommen:** Elternträume, Wunderbehauptungen, nicht belegte Kinder-Dialoge oder Bühnenhandlung.

### 2. Bakr ibn ʿAbdillāh al-Muzanī – aufrichtiger Rat (`adab`)

- Vertrauenswürdiger früher Tābiʿī und Schüler der Ṣaḥābah; nicht mit einer bestehenden Hauptperson identisch.
- adh-Dhahabī, *Siyar Aʿlām an-Nubalāʾ*, Bd. 4, S. 532–536, https://www.islamweb.net/ar/library/content/60/665/
- Originalanker, Bd. 4, S. 536: «قال قتيبة: حدثنا معاوية بن عبد الكريم الثقفي، سمعت بكر بن عبد الله يقول يوم الجمعة: لو قيل لي خذ بيد خير أهل المسجد، لقلت: دلوني على أنصحهم لعامتهم ...».
- Die Überlieferung enthält die **explizite Direkthör-Formel** „samiʿtu Bakr ...“ von Muʿāwiyah; Qutaybah übermittelt sie weiter. Bakrs hypothetische Formulierung („wenn man mich fragte“) wird **nicht** als tatsächlich durchgeführte Moscheewahl erzählt.
- Kinderbeispiele vom Spielen ausdrücklich als moderne didaktische Beispiele markiert; keine erfundenen Treffen, Rollen oder Aussagen.

## Qualitäts- und Besucher-App-Grenzen

- Jeder Text 500+ Wörter, gleicher Wortlaut für alle Altersstufen und Mädchen/Jungen.
- Kein neuer TTS/MP3-Import, `audioMaster:null`; nicht „Hören“ behaupten, wo keine Audiodatei liegt.
- Titel, arabische Fachnamen und deutsche Erklärungen bleiben lesbar. Arabische Belege sind **intern** im Quellenbestand; nach Kinder-App-Regel **keine externen klickbaren Quellenlinks**.
- `humanEditorialApproval:false` bleibt ehrlich; eigenständige redaktionelle Quellenkontrolle per ausdrücklicher Nutzeranweisung, kein erfundenes menschliches Review.
- Keine Eingriffe in andere App-Bereiche, iOS-App-Store, Android APK, Gebetszeiten, Duʿāʾ, Offline-Audios, Academy/Quiz oder Profildesign.
- `verification: approved` plus `editorialRelease:true` nur für die zwei geprüften Texte. Die vorhandenen zwei unvollständig belegten Kandidaten (`umar-ibn-abd-al-aziz-...`, `abu-hazim-...`) verbleiben mit beiden Freigabesperren auf „aus“.
- Relevanter Katalog wird in der KIDS PWA **network-first** geholt. Dennoch gilt: GitHub-Commit oder Merge allein beweist **keinen Live-Deploy**. Cloudflare-Publisher-Freigabe sowie veröffentlichte Katalogantwort sind gesondert zu kontrollieren.

## Verifizierte Etappe
**Rebasierter neuer Hauptzweig:** Vor diesem PR bereits 23 genehmigte, 2 verdeckte Entwürfe. Nach diesen zwei Geschichten 25 genehmigte, 2 verdeckte. `ilm`: bereits 4/4, `adab`: jetzt 4/4, `sidq`: jetzt 3/4. Zur 32er-Erstausstattung fehlen 7 weitere gesicherte Geschichten. Der erste PR hatte einen Konflikt durch parallel veröffentlichte Geschichten; keine Hauptzweig-Einträge wurden überschrieben.
