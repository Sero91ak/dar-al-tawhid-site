# DĀR AL TAWḤĪD · Globale Mehrsprachigkeits-Publikationsregel

**Verbindlicher Zielablauf für Erwachsenen-Spuren** (Website, Browser/PWA, iOS, Android; Apple TV, wenn Inhalt Ḥadīṯ/Āṯār/Qurʾān betrifft). **Kids ist eine unabhängige App und ausgeschlossen.**

## 1. Original und eine einzige Inhalts-ID
- Der Bearbeiter erstellt und prüft **zuerst Deutsch**. Das deutsche Original wird veröffentlicht wie bisher; keine Übersetzungswarteschlange darf diese vorhandene Push-Spur blockieren.
- Derselbe kanonische `id` plus `sourceHash` identifiziert jede Fassung. Neue oder geänderte Beiträge, Q-Nachweise, Ḥadīṯe/Āṯār, Duʿāʾs, Lern- und Quiztexte werden als Aufträge erkannt.
- Arabischer Qurʾān-Wortlaut, vorhandene ursprüngliche Ḥadīṯ-Worte, Überlieferungsgrad, Quellenlink, Sprecher, Originalnummern und Quiz-Antwortindex dürfen durch das Generieren **nie** überschrieben werden.

## 2. Sprachmanuskripte
- Zusätzliche redaktionelle Sprachfassungen: `ar` (klassisch-korrektes Fuṣḥā), `en`, `tr` (Türkisch), `ku` (Kurmancî), `ckb` (Soranî, RTL), `bs` (Bosnisch).
- Ein serverseitiger Modellaufruf wird ausschließlich bei aktiviertem `DAR_I18N_AI_GENERATE_ENABLED=true`, bestätigter Anbieterfreigabe `DAR_I18N_PROVIDER_APPROVED=yes` und geheimem Provider-Schlüssel ausgeführt.
- **Kosten begrenzt:** Standardlauf maximal zwei neue Beitragsdateien und maximal sechs Modellanfragen je Beitragsdatei; historischer Rückstand bleibt separat. Kein GitHub-Models-Dienst (eingestellt).
- Modellantworten sind ausnahmslos **Entwürfe** (`status=draft`). Sie werden, wenn GitHub-PR-Erstellung zugelassen ist, als **Draft Pull Request** hinterlegt; ansonsten als kurzlebiges Actions-Prüfartefakt. **Nie** automatisch freigeben oder live publizieren.

## 3. Redaktionelle Freigabe
Jede Sprachfassung muss eine lückenlose Fach- und Sprachprüfung durchlaufen:
1. Vollständige Wiedergabe und genaue Fachtermini;
2. Originalbelege und eindeutige Zuschreibung;
3. korrekte Einordnung und unveränderte Ḥadīṯ-/Āṯār-Bewertung;
4. identische Reihenfolge und unveränderte Lösung bei Quizfragen;
5. für Arabisch keine Rückübersetzung als angebliches originales Qurʾān-/Ḥadīṯ-Zitat;
6. `approved` erst bei dokumentierter sprachlicher **und** religiöser Prüfung, passender Ursprungsrevision und Quellfreigabe.

Bei Originaländerung ist die alte Fassung **stale** und darf nicht weiter als aktuelle geprüfte Übersetzung erscheinen.

## 4. Globaler Publikationsweg (vollständige Integration noch offen)
- Zukunftsziel: `Approved locale content pack` unter derselben ID und Revision zentral auf dar-al-tawhid.de bereitstellen; Website, Web-/PWA-, iOS-/Android- und zuständige TV-Spuren lesen dieselbe Sprachfassung. Nicht sieben Datenkopien pro App pflegen.
- Existiert noch keine geprüfte Sprachfassung, wird **sichtbar** der deutsche Originaltext mit Hinweis angezeigt, keine erfundene Übersetzung.
- Nutzerpräferenz kann lokal gehalten werden. Kontoübergreifende Präferenz-Synchronisierung setzt eine authentifizierte transportierende Backend-Anbindung voraus; der vorhandene Adapter allein kann dies nicht.
- Die globale Benutzer-/Push-Kette ist noch **nicht** an den neuen Generator angeschlossen. Die bisherigen OneSignal-, Tages-, Gebets-, Quell- und Beitrags-Push-Spuren bleiben unangetastet.

## 5. Derzeitiger technischer Stand und verbleibende Grenzen
- Implementiert: term-indexierte Suche (Grundlage), sieben UI-Lokalisierungen, Quellenerkennung, Versionsvergleich, Entwurfsgenerator, streng kontrollierter Übersetzungsstatus, GitHub-Workflow und Freigabe-Packbuilder.
- Ohne einen vom Eigentümer eingerichteten Anbieter, Secret und Kostenfreigabe erzeugt die GitHub-Automatik keine neuen KI-Manuskripte. Das ist beabsichtigter Schutz und **kein** stiller Fehler.
- Die 4.000+ bestehenden Inhalte wurden noch nicht in sechs Sprachen fertig geprüft. Der Rückstand bleibt in der Inventur sichtbar.
- Die Veröffentlichung geprüfter Language Packs in alle nativen Apps, Web-Spuren und der neue Sprachwahlschalter der Produktivoberfläche sind weiterhin Integrationsarbeiten.
- Die öffentliche V8-Website-Gestaltung besitzt einen eigenen Release- und Rollback-Weg und ist ausdrücklich **keine** Berechtigung zur Änderung von Push, Worker-Secrets, Widget-, Kids- oder Apple-TV-Code.
