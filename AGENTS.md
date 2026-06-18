# DAR AL TAWHID Projektregeln

Du darfst nur den ausdrücklich genannten Bereich ändern.

Bestehende Funktionen, Buttons, Layouts, Push-Benachrichtigungen, Gebetszeiten, Qibla-Kompass, Beiträge, Suchfunktion, Filter, Service Worker, Manifest und App-Struktur dürfen nicht entfernt, vereinfacht oder umgebaut werden.

Bei jeder Aufgabe:
1. Zuerst die passende Stelle in index.html suchen.
2. Nur den betroffenen Abschnitt ändern.
3. Keine unnötigen Formatierungen im restlichen Code.
4. Keine bestehenden IDs, Klassen oder Funktionen löschen.
5. Keine alten Beiträge löschen.
6. Keine Push-Funktion, Service Worker oder Manifest-Dateien verändern, außer ich verlange es ausdrücklich.
7. Nach der Änderung kurz sagen, welche Datei und welcher Bereich geändert wurde.
8. Wenn Unsicherheit besteht, erst fragen und nicht eigenständig umbauen.
9. Neue Änderungen, Beiträge, Funktionen, Layouts und Reparaturen immer zuerst in der Dar Test-App/Staging oder in einem Prüf-PR bereitstellen. Nicht direkt live für Besucher veröffentlichen.
10. Live-Veröffentlichung auf `main` oder in die Besucher-App nur nach ausdrücklicher Freigabe des Nutzers, z. B. „push live“, „live veröffentlichen“ oder „freigeben“.
11. Push-Benachrichtigungen aus Test/Staging dürfen niemals an alle Besucher gehen; dort nur Admin-/Test-Pushs nutzen.
