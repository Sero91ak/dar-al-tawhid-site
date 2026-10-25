# DAR TEST V8 · Rücksetzung auf einen festen Stand

Ausgangsstand vor dem V8-Umbau: `44076f298b9966999ed16d955409a08c408145a4`
Unveränderte Sicherung: `backup/dar-test-before-v8-overhaul-20261022`
Aktueller Entwicklungspfad: `feature/dar-test-v8-overhaul-20261022`

**Auslöser:** Der Nutzer schreibt **ZURÜCKSETZEN**. Es bedarf keiner neuen Design-Diskussion. Alle seit dem festgelegten Stand vorgenommenen Änderungen an der Erwachsenen-Test-App sollen vollständig zurückgenommen werden, auch wenn der Umbau später fortgesetzt wurde.

**Geltungsbereich:** `/test/` für die Erwachsenen-Test-App mit dazugehörigen Test-Assets, Sprachen und Einstellungen. `/test/kids/`, die produktive Besucher-App, iOS- und Android-Releases, Widgets und `main` außerhalb der Test-Dateien bleiben unberührt.

**Wiederherstellung:** Durch die unveränderliche Basis-Commit-ID sind Git-Änderungen prüfbar. `node scripts/restore-dar-test-v8.cjs` ist eine Vorschau; `DAR_TEST_V8_ROLLBACK_APPROVED=YES node scripts/restore-dar-test-v8.cjs --apply` stellt alle seit dem Basis-Commit abweichenden Erwachsenen-Test-Dateien wieder her und entfernt zusätzliche. Die Ausführung muss nach der Nutzeranweisung, in einem sauberen gesonderten Branch, mit Review und Tests erfolgen. Erst nach den Schutzprüfungen wird die isolierte Test-App neu deployed; keine Änderung der produktiven Besucher-App.

**Wichtig:** Eine reine Git-Rücksetzung entfernt keine bereits gespeicherten lokalen Gerätepräferenzen (z. B. in localStorage) und ersetzt keine Datenbankoperationen. Die V8-spezifischen Präferenzen `dat-test-v8-density` und `dat-test-v8-motion` werden von der alten App ignoriert. Browser-/PWA-Caches müssen nach dem tatsächlichen Rollback des Test-Deployments aktualisiert werden.

Status 22.10.2026: V8-Änderungen liegen derzeit ausschließlich auf dem Umbauzweig und sind noch nicht in die Live-Test-App übertragen.
