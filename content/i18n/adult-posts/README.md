# DĀR AL TAWḤĪD: zentrale ID und Sprachpakete für Erwachsenenbeiträge

- Kanonische Content-ID für Q48: `post:hasan-al-basri-selbstpruefung-20261021-481`, Revisionskennung `868ec2af55b71a2441e24848d9e149f106f538d8d52b3bf085afb7168f937465`.
- Im statisch abrufbaren Manifest `/content/i18n/adult-posts/hasan-al-basri-selbstpruefung-20261021-481.json` sind alle sieben Sprachen und ihre Sprachdatei-Pfade zentral registriert.
- Deutsch wird aus `/content/posts/hasan-al-basri-selbstpruefung-20261021-481.md` geladen. Sechs zusätzliche Sprachmanuskripte liegen als DRAFT im bestehenden Mehrsprachigkeitskern, nicht als ungeprüft freizugebende Besuchertexte.
- Ein Client darf eine Fremdsprachenfassung nur mit status=approved, passender ID und sourceHash sowie nach Fach- und Sprachprüfung anzeigen. Bis dahin deutsch mit sichtbarem Übersetzungshinweis.
- Keine Duplikate der kanonischen Quellenlinks, Arabisch-Originale oder IDs je App; die nativen/Web-Konsumenten müssen erst mit dem bestehenden zentralen i18n-Core verbunden und separat geprüft werden.
- Kids-App ausgeschlossen. TV erst nach der gesonderten Erwachsenen-/TV-Integration. OneSignal nur nach eigener Freigabe.
- Der Manuskriptgenerator überspringt bereits erstellte DRAFTs, um Kostenfallen durch doppelte KI-Generierung zu vermeiden. Nur fehlende oder veraltete Fassungen werden automatisch erneut erzeugt.
