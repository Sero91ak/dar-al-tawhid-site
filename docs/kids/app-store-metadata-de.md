# TAWḤĪD KIDS – App-Store-Metadaten (Entwurf, Stand 28.11.2026)

Alle Texte enthalten **keinen Personennamen**. Der von Apple angezeigte Verkäufername (Einzelunternehmer, bestehendes Entwicklerkonto) ist unvermeidbar und in Ordnung.

## Grunddaten
| Feld | Wert |
|---|---|
| Bundle ID | `de.daraltawhid.kids` |
| App-Name (max. 30) | `TAWḤĪD KIDS` (11 Zeichen). Alternative falls vergeben: `DĀR AL TAWḤĪD Kids` |
| Untertitel (max. 30) | `Islam spielerisch lernen` (24) |
| Primäre Kategorie | Bildung |
| Sekundäre Kategorie | Lifestyle (optional) – oder leer lassen |
| Kids-Kategorie | **Nein** (bewusst nicht gewählt) |
| Altersfreigabe | 4+ (Fragebogen: alles „Nein“; kein uneingeschränkter Webzugang, keine Nutzer-Inhalte) |
| Copyright | `© 2026 DAR AL TAWḤĪD` (ohne Personennamen) |
| Datenschutz-URL | `https://dar-al-tawhid.de/kids/datenschutz.html` (erst nach Merge nach main live) |
| Support-URL | `https://dar-al-tawhid.de/kids/datenschutz.html` oder eigene Support-Seite (offen) |
| Support-E-Mail | `dar.al.tauhid91@gmail.com` – **vorläufig**, Entscheidung offen |
| Preis | kostenlos, keine In-App-Käufe, keine Werbung |
| Exportrecht (Verschlüsselung) | nur Standard-HTTPS → „Ausgenommen“ |

## Schlüsselwörter (max. 100 Zeichen, kommagetrennt, ohne Leerzeichen)
`Kinder,Islam,Koran,Dua,Gebet,Lernen,Quiz,Geschichten,Gebetszeiten,Qibla,Eltern,Ramadan,Muslim`
(= 92 Zeichen; Name/Kategorie nicht wiederholen.)

## Werbetext (max. 170, jederzeit änderbar)
`Neu: Jeden Werktag eine neue kurze Lektion in der Lernakademie – dazu Duʿāʾ zum Hören, Geschichten und ein kleines Quiz.`

## Beschreibung (max. 4000)
TAWḤĪD KIDS ist eine ruhige, werbefreie Lern-App für muslimische Kinder und ihre Familien.

Was Kinder hier finden:
• Heute – ein kleiner Tagesbegleiter mit Gebetszeiten und Qibla-Richtung für den eigenen Ort
• Hören – kurze Geschichten und Erzählungen zum Zuhören
• Lernakademie – kurze, aufeinander aufbauende Lektionen; an jedem Werktag wird eine neue Lektion freigeschaltet
• Duʿāʾ – Bittgebete Schritt für Schritt hören, nachsprechen und lernen, mit Koranrezitation
• Quiz – Wissen spielerisch festigen
• Eltern – ein geschützter Bereich mit Hinweisen, Datenschutz und Support

Für Familien gemacht:
• Kein Konto, keine Anmeldung, keine Registrierung
• Keine Werbung, kein Tracking, keine Analyse-Dienste, keine In-App-Käufe
• Lernfortschritt bleibt auf dem Gerät
• Bereiche für Erwachsene (Datenschutz, Support, E-Mail) sind durch eine Rechenaufgabe für Erwachsene geschützt
• Keine Chats, keine Nutzerinhalte, keine Links ins offene Internet

Ortungsdienste und Bewegungssensoren sind optional und werden nur mit Zustimmung für Gebetszeiten und den Qibla-Kompass verwendet. Die Datenschutzerklärung beschreibt genau, was verarbeitet wird.

Hinweis: Inhalte werden mit Sorgfalt ausgewählt und ersetzen keinen Religionsunterricht; Eltern begleiten ihre Kinder am besten beim Lernen.

## Hinweise für die App-Prüfung (App Review Notes)
```
Sehr geehrtes App-Review-Team,

TAWḤĪD KIDS ist eine kostenlose Lern-App für Kinder (Kategorie Bildung, 4+, nicht Kids-Kategorie).

- Es gibt KEIN Konto, KEINEN Login und keine Registrierung. Zum Testen ist daher kein Demo-Zugang nötig.
- Fortschritt und Profil liegen nur lokal auf dem Gerät. Die App sendet keine personenbezogenen Daten an Dritte, enthält keine Werbung, kein Tracking, keine Analyse-SDKs.
- Die App ist ein nativer Rahmen (WKWebView) um eigene, von uns gehostete Inhalte unter https://dar-al-tawhid.de/kids/. Zusätzlich nativ: Hintergrund-Audio (Hören von Geschichten/Duʿāʾ), optional Standort (Gebetszeiten) und Bewegungssensoren (Qibla-Kompass). Alle Berechtigungen werden erst bei Nutzung mit Hinweistext abgefragt.
- Elternschutz: Der Bereich „Eltern“, die Datenschutzerklärung und E-Mail/Support sind durch eine Rechenaufgabe („Nur für Erwachsene“) geschützt. Die Aufgabe wird mit dem Ziffernblock gelöst (z. B. 15 × 6 + 12).
- Die Lernakademie schaltet pro Werktag eine Lektion frei (Zeitsteuerung, keine Bezahlschranke). Weitere Lektionen sind daher nicht sofort sichtbar – das ist beabsichtigt.
- Es gibt keine externen Links; externe http(s)-Adressen werden von der App nicht geöffnet.
- Support: dar.al.tauhid91@gmail.com

Vielen Dank!
```

## Screenshots
Siehe `/workspace/kids-appstore-screenshots/` (iPhone 6.9″ 1320×2868, iPad 13″ 2064×2752). Zeigen Heute, Hören, Lernakademie, Duʿāʾ, Eltern-Gate; kein Personenname.

## Offene Entscheidungen für Serhat
1. Support-Adresse final festlegen (aktuell überall vorläufig `dar.al.tauhid91@gmail.com`; auf anderen Seiten steht teils `dal.al.tauhid91`).
2. Name `TAWḤĪD KIDS` in App Store Connect verfügbar? Sonst Alternative.
3. Support-URL (eigene Seite oder Datenschutzseite).
4. Lizenz-Check für gehostete Rezitationsdateien (Husary, everyayah-Quelle).
