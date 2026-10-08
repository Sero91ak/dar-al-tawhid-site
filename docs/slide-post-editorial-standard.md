# DAR AL TAWḤĪD · Redaktionsstandard für Slide-Beiträge

Gilt für Besucherbeiträge auf Website, PWA und nativer Erwachsenen-App.

## Slide-Zuschnitt

1. **Eine längere Aussage = ein Slide.** Den Wortlaut nicht kürzen, nicht umdeuten, keine Belege auslassen.
2. **Zwei kurze, zusammengehörige Aussagen dürfen einen Slide teilen**, wenn beide bei lesbarer Schrift mit Name/Sprecher und Quelle ohne große Scrollstrecke passen. **Niemals drei eigenständige Aussagen in einen Slide pressen.**
3. Bei zwei Aussagen pro Slide sind beide Namen mit dem jeweils korrekten Ehrentitel, beide vollständigen Aussagen und alle Belege sichtbar. Quellen dürfen nur zusammengezogen werden, wenn tatsächlich dieselbe Fundstelle gilt.
4. Bei langen Abschnitten lieber auf weitere Slides aufteilen, statt eine minimale Schrift oder künstlich riesige Karten zu erzeugen. Eine Aussage nicht willkürlich auf mehrere Seiten zerreißen.
5. Jede Slide-Karte bekommt einen sachlichen Titel, eigenen Quellenbeleg und einen funktionierenden Q-Direktlink aus der Quellenbibliothek. Keine erfundenen Textfragment- oder PDF-Seitenanker.
6. Arabische Qurʾān-Zitate, Prophetenaussagen und Athār/Gelehrtenworte nicht unter einer pauschalen `scholar:`-Zeile zusammenwerfen. Den Sprecher pro Aussage bestimmen.
7. Die Slide-Nummerierung ist fortlaufend. `slides:`-YAML muss die `source:`- und `links:`-Felder eingerückt **pro Slide** enthalten. `<!-- slide: N -->`-Abschnitte im Body müssen dieselbe Anzahl haben.
8. **Natürlich hohe Slides** statt Einheits-Höhe aller Karten: Die gerade sichtbare Slide bestimmt die Höhe. Titel, Aussage, Quelle und Navigation rücken ohne künstliche Leerflächen zusammen; bei längeren Aussagen darf die Seite natürlich scrollen.
9. Bestehende Beitrags-ID und Quellen-Q-Nummer beim Überarbeiten beibehalten. Keine zweite Veröffentlichung oder globale Benachrichtigung ohne neue ausdrückliche Freigabe.

## Technische Prüfung

Vor Live-Freigabe auf einem iPhone prüfen: Slide 1 von N; alle Seiten erreichbar; keine übergroßen Lücken; Schrift lesbar; Quellen stimmen pro Slide; „Weiter“, „Zurück“ und die untere App-Leiste funktionieren; kurze und lange Slides zeigen keinen abgeschnittenen Text. Besonders eine sehr kurze Slide **nach** der längsten Slide im selben Beitrag prüfen.

Bei Q35 siehe `scripts/q35-slides-recovery-guard.cjs` mit zwei gemeinsamen Kurz-Aussagen und 20 Slides.
