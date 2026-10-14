# DĀR AL TAWḤĪD KIDS AKADEMI · Zweite klassische Fiqh-Quellenrunde 174–192

**14.10.2026 · nur geschützter Entwurf, kein Merge, kein Live-Deploy, keine generierte Stimme.**

## Ergebnis

Vier bereits vorhandene Lektions-IDs sind jetzt im zentralen `kids-akademie/research/SOURCE_REGISTRY.json` mit **individuell zugeordneten klassischen Rechtsquellen** aus **Ibn Qudāmah, al-Mughnī** abgesichert. Im aktuellen Quellenregister war der Fātiḥah-Beleg **180** bereits von einer anderen redaktionellen Teilrunde vorhanden; er wurde **nicht dupliziert**. Neu hinzugekommen sind die drei Links **174, 186, 192**.

| Slot | Primärnachweis | Tatsächliche Quellenabgrenzung |
|---|---|---|
| **174** Takbīrat al-Iḥrām | [al-Mughnī 15/533, Masʾalah 640](https://www.islamweb.net/ar/library/content/15/533), `SRC-FIQH174-MUGHNI-533` | `والتكبير ركن في الصلاة`: Der Eröffnungstakbīr ist ein Gebetsbestandteil. Qurʾān 17:111 ist ein allgemeiner Lobpreisbeleg, keine vollständige Gebetsanleitung |
| **180** Fātiḥah-Rezitation | [al-Mughnī 15/553, Bd. 1 S. 284, Masʾalah 666](https://www.islamweb.net/ar/library/content/15/553), bereits vorhandenes `SRC-FIQH180-MUGHNI-553` | `قراءة الفاتحة واجبة في الصلاة وركن من أركانها`. Nicht alle Sonderfälle des mitbetenden Maʾmūm sind dadurch abgeschlossen |
| **186** Rukūʿ | [al-Mughnī 15/570, Bd. 1 S. 295–296, Masʾalah 691](https://www.islamweb.net/ar/library/content/15/570), `SRC-FIQH186-MUGHNI-570` | **Erforderliche Verbeugung** und **empfohlene Handhaltung** auf den Knien sind getrennt; bei verletzten Händen kein pauschaler Zwang |
| **192** Aufrichten nach Rukūʿ | [al-Mughnī 15/574, Bd. 1 S. 297–298, Masʾalah 697](https://www.islamweb.net/ar/library/content/15/574), `SRC-FIQH192-MUGHNI-574` | Aufrichten und Gebetsworte `سمع الله لمن حمده` benötigen getrennte Sunnah-/Fiqh-Belege; es werden unterschiedliche Auffassungen erwähnt |

### Prüfung und Kennzeichnung

Die Stellen **174, 186, 192** wurden über die indizierten arabischen Originaltextauszüge von Islamweb am 14.10.2026 gegengeprüft. Da der unmittelbare Basis-Seitenaufruf nicht zuverlässig verfügbar war, tragen diese drei Einträge den Status `primary-index-excerpt-cross-checked-2026-10-14-direct-fetch-unavailable`. **Lektion 180** trägt separat den bereits vorhandenen Status `primary-classical-fiqh-page-directly-read-2026-10-14-not-approved`; diese bessere Bestandsdokumentation wurde bewahrt, nicht herabgestuft.

Die read-only CI-Prüfung `kids/tools/test-academy-primary-source-registry-v1.cjs` wurde um alle vier Quellenreferenzen erweitert. Sie sichert, dass Lektions-ID und klassischer Quellenpfad erhalten bleiben und dass die drei nur indizierten Stellen **nicht als direkt oder endgültig verifiziert** bezeichnet werden.

### Noch offen

- Vollständiger arabischer Primärtext und einschlägige authentische Hadithüberlieferungen für jedes Detailszenario, Abweichungen innerhalb der hanbalitischen Schule und gesundheitliche Ausnahmen
- Die klassische Fiqh-Stelle für **198 Suǧūd** liegt in der vorhandenen Forschungsakte bei al-Mughnī `15/592`; ein neuer unabhängiger Direktabgleich ist hier **nicht** gelungen, daher wurde für 198 in diesem Arbeitsschritt kein nur behaupteter frischer Primärlesestatus erstellt
- Tatsächliche CI-Ausführung des letzten GitHub-Commits, manuelle Browser-/App-Prüfung und qualifizierte wissenschaftliche Freigabe

**Gesamt:** weiterhin **208/208 Unterrichtsentwürfe**, **624/624 Altersfassungen als Entwürfe**, **0/624 wissenschaftlich endgültige Freigaben**. Bestehende Quiz-, Profil-, Fortschritts- und Altersfassungsobjekte sind unverändert.
