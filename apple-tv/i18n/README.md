# Apple TV: dieselben neun Sprachen

Die Erwachsenen-App speichert die Sprache unter `darAdultPreferredLocaleV1`. Ohne gespeicherte Wahl bleibt Deutsch. Arabisch und Sorani sind rechtsläufig.

Dieses Paket übersetzt keine Qurʾān-Verse, keinen Tadabbur und keine fehlenden Ḥadīṯe neu. Es liest die Pakete, die die Website schon verwendet.

## Quellen

| Bereich | Deutsch | Weitere Sprachen |
| --- | --- | --- |
| Bedienung | `apple-tv/i18n/ui.json` | dieselben Schlüssel, Texte aus Sprachwähler, `locales.json` und `assets/i18n/catalog` |
| Beiträge | `/content/posts/` | `/assets/i18n/content/{sprache}.json` → `posts` |
| Ḥadīṯ und Āṯār | `/apple-tv/hadith/library-shell.json` | `/assets/i18n/content/hadith-{sprache}.json` |
| Duʿāʾ | `/content/duas/duas.json` (`ar` und `src` bleiben) | dasselbe Inhaltspaket → `duas` |
| Qurʾān-Bedeutung | `/content/quran/{Sure}.json` Feld `de` (Bubenheim & Elyas) | keine Projektfassung; Deutsch bleibt. Feld `tr` ist nur Lautschrift |
| Tadabbur | `/apple-tv/quran/tadabbur/` | nur Deutsch. Die Ansicht listet `entries.json` und zeigt die Gesamtzahl aus `entries-index.json` |

Interne `HAD-####` bleiben unsichtbar. Die Lücken stehen in `coverage.json`.

## In Xcode prüfen

Im Repository gibt es kein tvOS-Ziel neben der iOS-App. Die Übersetzung ist das lokale Paket `apple-tv/xcode/TVLocalization`.

1. tvOS-Projekt öffnen.
2. File → Add Package Dependencies → Add Local… → `apple-tv/xcode/TVLocalization`.
3. `import DarAlTawhidTVLocalization` und `TVLocalizationRootView()` auf einen Tab oder in die Einstellungen legen. Wiedergabe und Bildschirmschoner nicht ersetzen.
4. Scheme: Apple TV Simulator. Product → Run.
5. Sprache auf العربية oder سۆرانی stellen: Liste und Fokus laufen von rechts. Dann English: Beiträge, Ḥadīth, Āṯār und Duʿāʾ zeigen die Paketfassung. Qurʾān und Tadabbur bleiben Deutsch, mit dem Hinweis aus `fallbackNotice`.
6. Eine Kennung aus `content/i18n/adult-nine-locale-gaps-20261125.json` bleibt Deutsch.

Prüfung ohne Mac: `node apple-tv/i18n/check-tv-locales.mjs`. Ein Xcode-Build braucht das tvOS-SDK und wurde hier nicht ausgeführt.
