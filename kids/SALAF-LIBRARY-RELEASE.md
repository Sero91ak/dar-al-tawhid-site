# Schätze der Salaf — verbindlicher Master-Standard V2

## Genau eine Erzählung für alle Kinder

Jede Geschichte besitzt **genau ein Feld `masterStoryText`** für alle Altersprofile 4–5, 6–8 und 9–10 Jahre. **Keine eigenen Texte pro Altersstufe**, keine automatische Verkürzung. Genau **eine vollständige Masteraufnahme** im optionalen Feld `masterAudio` gehört zu dieser Geschichte. Altersabhängig sind ausschließlich Darstellung, Schrift und pädagogische Oberflächen möglich.

Der verbindliche Anfang lautet:

> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, liebe Kinder.

Es folgt eine warme Ansprache für Bruder und Schwester. Der Schluss lautet:

> Und Allah weiß es am besten.
>
> Möge Allah euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses, schenken.
>
> As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.

Der Text ist sprechfertig und entspricht bei späterer Aufnahme exakt dem einzigen Master-Audio. Keine ausgedachten historischen Szenen, Gefühle, Gespräche oder erfundenen Aussagen.

## Datenmodell

- `id`, `category`, `title`, `person`, `summary`, `image`, `hero` / optional `heroGirl`
- `masterStoryText`: ein deutscher, zusammenhängender, liebevoller, vollständiger Hör- und Lesetext
- `masterAudio`: zunächst null, später `{ "url": "/kids/audio/salaf/slug-master.mp3", "timings": [] }`
- `sources`: mindestens eine sorgfältig kontrollierte historische Buchquelle `{author,work,reference,assessment:"verified",url}` mit exaktem Werk und Direktlink
- `verification: "approved"` und `editorialRelease: true` nur für freigegebene Geschichten

Eine geprüfte Textüberlieferung ist nicht automatisch ein als ṣaḥīḥ eingestufter prophetischer Ḥadīṯ. Bericht und erzählerische Erklärung bleiben klar getrennt. Zweifelhaft überlieferte Geschichten bleiben unveröffentlicht, insbesondere Berichte, die allein auf kritisch bewerteten Überlieferern beruhen.

## Keine öffentlichen Entwicklungsanzeigen

Kinder sehen die Geschichte, nicht den Quellenfreigabeprozess. Die Quellen finden sich unter »Unsere Quellen« mit anklickbarem Originalbeleg. Texte sind bereits lesbar, während die authentische Masteraufnahme noch produziert werden muss; die App darf niemals eine nicht vorhandene Aufnahme als spielbar darstellen.

## Schutz

Die ursprünglichen Propheten-, Ṣaḥābah- und Ṣaḥābiyyāt-Bibliotheken, ihre Mastertexte, die globale schwebende Leiste, die freigestellten 3D-Icons sowie das gesamte Today-Hero- und Gebetslayout bleiben unverändert. Der neue Salaf-Inhaltskatalog wird online aktuell und offline aus dem Cache gelesen.
