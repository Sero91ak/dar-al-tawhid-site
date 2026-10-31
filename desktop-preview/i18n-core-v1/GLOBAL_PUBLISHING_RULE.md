# DĀR AL TAWḤĪD · Globale Mehrsprachigkeits-Publikationsregel

**Verbindlicher Zielablauf für Erwachsenen-Spuren** (Website, Browser/PWA, iOS, Android; Apple TV, wenn Inhalt Ḥadīṯ/Āṯār/Qurʾān betrifft). **Kids ist eine unabhängige App und ausgeschlossen.**

## 1. Original und eine einzige Inhalts-ID
- Der Bearbeiter erstellt und prüft **zuerst Deutsch**. Das deutsche Original wird veröffentlicht wie bisher; keine Übersetzungswarteschlange darf diese vorhandene Push-Spur blockieren.
- Derselbe kanonische `id` plus `sourceHash` identifiziert jede Fassung. Neue oder geänderte Beiträge, Q-Nachweise, Ḥadīṯe/Āṯār, Duʿāʾs, Lern- und Quiztexte werden als Aufträge erkannt.
- Arabischer Qurʾān-Wortlaut, vorhandene ursprüngliche Ḥadīṯ-Worte, Überlieferungsgrad, Quellenlink, Sprecher, Originalnummern und Quiz-Antwortindex dürfen durch das Generieren **nie** überschrieben werden.

## 2. Sprachmanuskripte
- Zusätzliche redaktionelle Sprachfassungen laut dynamischem `locales.json` (Stand 22.10.2026): `ar` (klassisch-korrektes Fuṣḥā), `en`, `tr` (Türkisch), `ku` (Kurmancî), `ckb` (Soranî, RTL), `bs` (Bosnisch), `fr` (Französisch), `es` (Spanisch). Zusammen mit deutschem Original `de` sind es neun Sprachen. Keine harte Beschränkung auf diese neun bei späteren Erweiterungen.
- Ein serverseitiger Modellaufruf wird ausschließlich bei aktiviertem `DAR_I18N_AI_GENERATE_ENABLED=true`, bestätigter Anbieterfreigabe `DAR_I18N_PROVIDER_APPROVED=yes` und geheimem Provider-Schlüssel ausgeführt.
- **Kosten begrenzt:** Standardlauf maximal zwei neue Beitragsdateien und maximal sechs Modellanfragen je Beitragsdatei pro Standardlauf; alle acht Zielsprachen benötigen derzeit mehrere kontrollierte Teilbatches oder eine ausdrücklich freigegebene Limit-Erweiterung; historischer Rückstand bleibt separat. Kein GitHub-Models-Dienst (eingestellt).
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

## 6. ZENTRUM-Regel: **1 Beitrag · 1 ID · 1 Q-Link · N Sprachen** (Nutzerauftrag 22.10.2026)

**Verbindliches redaktionelles Zielschema** für DĀR AL TAWḤĪD Erwachsene:
- **Ein kanonischer Beitrag** erhält genau eine unveränderliche `post:<id>`-Kennung. Alle Sprachfassungen tragen exakt dieselbe Kennung und dieselbe geprüfte `sourceHash`-Revision; keine duplizierten Post-IDs, keine neu vergebenen Nummern je Sprache.
- **Genau eine Q-Nummer** je zugeordnetem Quellenbeleg. Der kanonische Quellenlink `/q/<N>/` bleibt in jeder Sprache gleich. Titel, Quellenbeschreibung, Erläuterung und Fazit können lokalisiert werden; arabische Originalzitate, exakte Primärnachweise, Sprecher, Nummern und Fundstellen bleiben unverändert. Die **tatsächlich freie Nummer** darf nur nach Abgleich mit `q/_registry/shortlinks.json` und den bestehenden `q/<N>/`-Pfaden vergeben werden. Nichts vortäuschen.
- **Ein dynamisches Sprachverzeichnis**: `desktop-preview/i18n-core-v1/locales.json` ist die zentrale Registrierungsquelle. Ausgangssprachen: `de`, `ar`, `en`, `tr`, `ku`, `ckb`, `bs`. Die 8., 9., 10. usw. Sprache wird mit Sprachcode, Name, Schreibrichtung und vollständigen UI-Texten dort registriert. Worklist, Validierung, Sprachpakete und neue Manuskriptaufträge leiten ihre Sprachliste dynamisch ab; **nie eine fixe Obergrenze sieben**. Altbestände erhalten automatisch offene Übersetzungsaufträge für neue Codes; noch ungeprüfte Sprachfassungen werden **nicht** freigeschaltet.
- **Ein App-Sprachwert als Anzeigegrundlage**: Browser-/PWA- und native Erwachsenen-Oberflächen wählen den geprüften Inhalt anhand der **in der App gewählten** Sprache und derselben kanonischen Content-ID. Betriebssystemsprache gilt allenfalls als initialer Default, nicht als Ersatz für eine explizite App-Einstellung. Für Arabisch/Soranî RTL beachten, ebenso dynamische weitere RTL-Sprachen. Falls Sprache noch nicht geprüft: deutsches Original mit eindeutigem sichtbarem Hinweis. Kein stilles angebliches Übersetzen.
- **Ziel für Geräte-Pushes nach eigenständiger Implementierung/Freigabe**: Für **denselben** Beitrag erhalten Empfänger je nach gespeicherter **App-Sprachpräferenz** genau eine lokalisierte Benachrichtigung (Titel/Text), mit einem Deep-Link auf die kanonische Beitrags-ID und derselben Q-Quelle. Die Registrierung muss die tatsächlich gewählte App-Sprache je Push-Abonnement/Installation an den Zustellweg übertragen, nicht bloß die Betriebssystemsprache vermuten. Idempotenz/Deduplizierung über Benachrichtigungsereignis + Content-ID + Empfänger; keine sieben Benachrichtigungen pro Nutzer. Fehlt eine geprüfte Fassung, transparenter Fallback. Push-Opt-in, bestehende Sendespuren, Berechtigungen und Deduplizierung unverändert wahren.
- **Auch Tages-/Gebetsinhalte**: Duʿāʾ des Tages, Tagesverse, Empfehlungen, Gebetsbezeichnungen, Countdown-/Erinnerungstexte und Benachrichtigungstitel/-texte benötigen dieselbe Sprachlogik. Die religiösen Originaltexte und **berechneten Zeiten**, Gebetsplan, Zeitfenster und bestehende Cron-/Geräte-Trigger ändern sich dadurch nicht.
- **Zehner-Batches im Altbestand**: Zehn eindeutige geprüfte kanonische **Beiträge** pro Block (nicht zehn Übersetzungsdateien). Alle derzeit registrierten Fremdsprachen pro Beitrag behandeln, geprüfte existierende Fassungen überspringen; gleiche ID/Q-Link/Quelle prüfen; transliterierte religiöse Begriffe sorgfältig korrigieren. Lesbare Vorschau und Sprach-/Fachprüfung vor Freigabe. Das read-only Skript `select-post-batch.cjs` erzeugt reproduzierbare Zehner-Arbeitslisten **ohne** API-Aufrufe, Kosten oder Push.
- **Kostenmodell**: Chatgestützte manuelle Redaktion kann ohne zusätzlichen *bezahlten Übersetzungsdienst* erfolgen. **Autonomer serverseitiger Live-Durchlauf über OpenAI/ElevenLabs oder andere APIs kann Nutzungskosten verursachen** und setzt eine gesonderte ausdrückliche Freigabe voraus. Keine Modellkosten automatisch auslösen; keine unbelegbare Garantie auf komplett kostenfreien Betrieb.
- **Veröffentlichung (Präzisierung vom 01.11.2026)**: `push live`/„Beitrag pushen“ bei einem neuen, ausdrücklich freigegebenen Erwachsenen-Beitrag umfasst **Inhalts-Publikation und anschließend eine einzige OneSignal-Gerätebenachrichtigung an `DAR_PUSH`**, nachdem die öffentliche Beitrags- und Q-URL, das Abonnementsegment und ein möglicher früherer Versand geprüft wurden. Die zwei Schritte sind unabhängig nachzuweisen; der bestehende Chat-Publisher veröffentlicht nur Inhalte und muss den separaten Geräteversand über den bereits freigegebenen Beitrags-Push-Weg ausführen lassen. Eine reine Übersetzungsfreigabe löst keinen Versand aus. Für bestehende Beiträge verhindern Status `sent`, OneSignal-ID und Idempotenz weitere Sendungen. Unverändert: KIDS ausgeschlossen, Sprachzustellungs-Integrationsstand unvollständig, Sperren für Änderungen am Push-Code bleiben wirksam.

### Implementierungs- und Freigabestand

Die zentrale Arbeitsliste und Erkennung **neu registrierter Sprachen** sind vorbereitet; das ist **keine** Behauptung, dass die Besucher-App, alle Native-Spuren oder OneSignal die App-Sprache bereits automatisch bis zum Gerät übertragen. Die produktive Lokalisierung der Push-Lanes (Beiträge, Tagesinhalt, Gebete), App-Registrierung und der Live-Resolver benötigen eigene technische Integration, QA, Scope-Freigaben und gemäß geschützter Push-Richtlinie die expliziten Freigabemarker. **Keine Änderung an Push-Worker, Cron, OneSignal oder Nutzerabonnements durch diese Regeldatei.**

## 7. Erweiterung 22.10.2026 – neun Sprachen und OneSignal-Vorlagen

- **Sprachen 8 und 9 sind registriert:** `fr` Französisch und `es` Spanisch. Aktueller Katalog: `de, ar, en, tr, ku, ckb, bs, fr, es`. Auch jeder neue Beitrag erhält eine einzige kanonische ID / Q-Nummer und künftig **neun redaktionell geprüfte Fassungen**. Eine weitere Sprache wird stets aus `locales.json` erkannt; die zusätzlichen Texte und Pushvorlagen werden als **Prüf-/Übersetzungsrückstand** registriert, nicht ohne Prüfung automatisch live geschaltet.
- **OneSignal – aktuell 15 *nicht sendende* Vorlagen vorbereitet:** eindeutige IDs und Zuordnung stehen in `desktop-preview/i18n-core-v1/onesignal-nine-language-drafts.json`. Gebetszeit-Eintritt (5 Gebete + Taḥajjud), Vorwarnung (5 Gebete), Tages-Duʿāʾ, Tagesbeitrag, Tages-Āyah und neuer Beitrag. Die Vorlagen enthalten neun redaktionelle Textentwürfe. Bei jedem weiteren Sprachcode müssen deren Übersetzungen erweitert und geprüft werden.
- **Keine Behauptung einer Live-Zustellung:** Die produktiven Worker benutzen weiterhin ihre bisherigen Inhalte, Zeiten, Opt-ins, Idempotenz und Deep-Links. Das OneSignal-Standardsprachfeld darf **nicht** einfach als in der App gewählte Sprache angenommen werden. Richtige Umsetzung erfordert eine vom Nutzer gesetzte **App-Sprache je Installation/Subscription**, einen gespeicherten und nach jeder Änderung synchronisierten Sprachwert, Sprachzuordnung pro Versand, dieselbe inhaltliche Ereignis-ID, genau eine Nachricht pro Empfänger, korrekt lokalisierte Inhalte unter derselben ID und eine geprüfte Fallback-Sprache.
- **Gebets-Push** darf weder Uhrzeit/Ort/Gebetsart noch 5/10/15-Minuten-Vorwarnung durch statische OneSignal-Vorlagen verfälschen. Bestehende Scheduler erst nach gesonderter Spur-Freigabe ändern; an einsprachigen Feldern `headings.en = headings.de` darf nicht ohne wirksame Sprachzuordnung vorbei publiziert werden.
- **Tages-Āyah:** Ein separater geprüfter kanonischer Āyah-Datensatz und aktive Scheduler-/Opt-in-Integration müssen vor einem automatischen Versand erst hergestellt werden. Eine Vorlagenanlage ist **keine** Aktivierung eines neuen Versandtyps.
- **Push-Lock / Berechtigung:** Für Änderungen geschützter Spuren sind die in `AGENTS.md`, `content/admin/push-lanes-lock.json` und CI verlangten gesonderten Berechtigungs-/Passwort-/Markerprüfungen verpflichtend. Kein geheimer Push-Code oder reale Zugangsdaten ins Repository. Kids bleibt ausgeschlossen. Testlauf mit ausgewählten Test-Subscriptions, nie ungeprüfter Massenversand.
- **Kosten:** Redaktion im Chat und OneSignal-Entwurfsvorlagen benötigen keine separate kostenpflichtige Übersetzungs-API. Hosting, Versand- und API-Kosten können unabhängig davon entstehen. Keine unautorisierten Modellaufrufe.


## Redaktionelle Textprüfung und Freigabe vom 22.10.2026

- Der Eigentümer hat die AI-gestützte sprachliche und fachliche Redaktion der **Benachrichtigungstexte** ausdrücklich delegiert. Die 9 × 15 = **135 kurzen Textpaare** in push-copy-nine-languages-draft.json sind nach Prüfung von Sinn, orthographischem Gebrauch, technischen Platzhaltern und islamischen Gebetsbegriffen **redaktionell als approved** markiert. Der ursprüngliche Dateiname „draft“ wird aus Kompatibilitätsgründen beibehalten, der Status jedes Eintrags ist maßgeblich.
- Insgesamt **19 konkrete Korrekturen**: türkischer Fajr-Name „Sabah“ statt unüblichem „Fecr namazı“, soranischer Dhuhr-Begriff „نیوەڕۆ“, bosnische lokale Gebetsnamen mit korrekt gebeugtem „-namaz“ und idiomatischer spanischer Eintrittstext. Arabischer Wortlaut und Kürzel für Inhalte sind davon nicht betroffen.
- Die Prüfung erfolgt durch ChatGPT als KI-gestützte Redaktion auf Verantwortung des Projektinhabers, **nicht** durch neun unabhängige menschliche Muttersprachler/Fachgelehrte. Die Metadaten enthalten diesen Unterschied (`reviewMethod=AI_assisted_editorial`, `nativeSpeakerCertified=false`).
- Freigegeben sind **nur die generischen Titel-/Erinnerungsformulierungen**. Beim Duʿāʾ-, Āyah- und Beitrag des Tages bleibt die jeweilige konkrete Quelle, Inhalt-Revision, zugehörige kanonische Beitrags-ID, Q-Registry, Deep-Link und Abonnementeinwilligung bei jedem Versand eigenständig zu verifizieren. Freigabe generischer Sätze ist keine Freigabe eines konkreten ungeprüften Artikels.
- **Kein Zusammenhang mit einer Änderung der Gebetszeitberechnung.** Zeiten/Methoden/Standort/Countdowns/Cron werden in diesem Arbeitsschritt weder geprüft noch bearbeitet. Die schon vorhandenen dynamischen Platzhalter werden lediglich unverändert transportiert und auf korrekte Textdarstellung geprüft.
- **Keine Live-/Provider-Freigabe:** Die 15 OneSignal-Vorlagen und ihre IDs bleiben als nicht versendende Vorlagen bestehen; OneSignal-Sender, SDK, Datenbank und bestehende Nutzer-Pushs bleiben unverändert. Produktionsfreigaben/Code-Spursperren bleiben wirksam.
