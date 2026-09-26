#!/bin/bash
set -euo pipefail

SITE="https://dar-al-tawhid.de"
RAW="https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/3c82e2e41731532f8a8ef613e7019a48faa4f2d9"
TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
APP="$HOME/Applications/DĀR Voice Studio.app"
MACOS="$APP/Contents/MacOS"
RESOURCES="$APP/Contents/Resources"
PLIST="$APP/Contents/Info.plist"
LAUNCH="$HOME/Library/LaunchAgents/com.daraltawhid.voice-engine.plist"
LABEL="com.daraltawhid.voice-engine"
STAGE="$TARGET/.update-stage-$$"
BACKUPS="$TARGET/backups"

cleanup_stage() {
  rm -rf "$STAGE" >/dev/null 2>&1 || true
}
trap cleanup_stage EXIT

# Vor einem Update muss die bereits laufende App wirklich beendet werden.
# Sonst aktiviert macOS am Ende nur die alte Binary erneut.
osascript -e 'tell application id "de.dar-al-tawhid.voice-studio" to quit' >/dev/null 2>&1 || true
pkill -TERM -x DARVoiceStudio >/dev/null 2>&1 || true
sleep 1
pkill -KILL -x DARVoiceStudio >/dev/null 2>&1 || true

# Die vorhandene App bleibt während Download, Validierung und Engine-Start unangetastet.
# Erst ein vollständig gebautes und signiertes neues Bundle ersetzt sie atomar.
mkdir -p "$TARGET" "$VOICE_HOME" "$HOME/Library/LaunchAgents" "$BACKUPS"
rm -rf "$STAGE"
mkdir -p "$STAGE"

say_status() {
  /usr/bin/osascript -e "display notification \"$1\" with title \"DĀR Voice Studio\"" >/dev/null 2>&1 || true
}

say_status "DĀR Voice Studio wird eingerichtet …"

# Neue Version zuerst vollständig in einen isolierten Staging-Ordner laden.
# Die funktionierende Installation wird erst nach allen Prüfungen ersetzt.
curl -fsSL "$RAW/voice-studio/local-engine.py?v=271" -o "$STAGE/local-engine.py"
curl -fsSL "$RAW/voice-studio/index.html?v=271" -o "$STAGE/studio.html"
curl -fsSL "$RAW/data/pronunciation/pronunciation-rules.json?v=271" -o "$STAGE/pronunciation-rules.json"
curl -fsSL "$RAW/data/pronunciation/voice-production-profile.json?v=271" -o "$STAGE/voice-production-profile.json"
curl -fsSL "$RAW/data/pronunciation/islamic-master-library.json?v=271" -o "$STAGE/islamic-master-library.json"
curl -fsSL "$RAW/data/pronunciation/voice-regression-fixtures.json?v=271" -o "$STAGE/voice-regression-fixtures.json"
curl -fsSL "$RAW/scripts/voice-studio/validate-v2.py?v=271" -o "$STAGE/validate-v2.py"
curl -fsSL "$RAW/watermark-my-logo-full.png?v=271" -o "$STAGE/watermark-my-logo-full.png" || true
curl -fsSL "$RAW/app-icon-512.png?v=271" -o "$STAGE/app-icon-512.png" || true

for required in local-engine.py studio.html pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  if [ ! -s "$STAGE/$required" ]; then
    echo "FEHLER: Update-Datei fehlt oder ist leer: $required"
    exit 1
  fi
done

# Vorhandene Stimmreferenz bevorzugen.
REF="$VOICE_HOME/Serhat_Adobe_MASTER.wav"
if [ ! -f "$REF" ]; then
  ALT="$VOICE_HOME/Serhat_FINAL_REF.wav"
  if [ -f "$ALT" ]; then
    REF="$ALT"
  else
    PICKED="$(/usr/bin/osascript <<'APPLESCRIPT'
try
  set f to choose file with prompt "Wähle deine bereinigte Serhat-Stimmreferenz (WAV/Audio)."
  POSIX path of f
on error
  return ""
end try
APPLESCRIPT
)"
    if [ -z "$PICKED" ]; then
      /usr/bin/osascript -e 'display dialog "Keine Stimmreferenz ausgewählt. Die Einrichtung wurde abgebrochen." buttons {"OK"} default button 1 with icon caution'
      exit 1
    fi
    cp "$PICKED" "$VOICE_HOME/Serhat_Adobe_MASTER.wav"
    REF="$VOICE_HOME/Serhat_Adobe_MASTER.wav"
  fi
fi

# Optionale zweite Referenz für arabische Fachbegriffe. Sie wird nur benutzt,
# wenn sie wirklich vorhanden ist; sonst bleibt die bestätigte deutsche Masterstimme aktiv.
AR_REF="$VOICE_HOME/Serhat_AR_MASTER.wav"
if [ ! -f "$AR_REF" ]; then
  AR_REF=""
fi

# Bestehende funktionierende Umgebung wiederverwenden.
PY=""
if [ -x "$VENV/bin/python" ]; then
  PY="$VENV/bin/python"
else
  for cand in /opt/homebrew/bin/python3.11 /usr/local/bin/python3.11 "$(command -v python3.11 2>/dev/null || true)" "$(command -v python3 2>/dev/null || true)"; do
    [ -n "$cand" ] || continue
    [ -x "$cand" ] || continue
    if "$cand" - <<'PYTEST' >/dev/null 2>&1
import sys
raise SystemExit(0 if (3,10) <= sys.version_info[:2] < (3,14) else 1)
PYTEST
    then
      PY="$cand"
      break
    fi
  done
  if [ -z "$PY" ] && command -v brew >/dev/null 2>&1; then
    say_status "Python 3.11 wird einmalig installiert …"
    brew install python@3.11
    PY="/opt/homebrew/bin/python3.11"
    [ -x "$PY" ] || PY="$(brew --prefix python@3.11)/bin/python3.11"
  fi
  if [ -z "$PY" ]; then
    /usr/bin/osascript -e 'display dialog "Python 3.10–3.13 fehlt. Bitte Python 3.11 installieren und das Setup erneut starten." buttons {"OK"} default button 1 with icon caution'
    exit 1
  fi
  "$PY" -m venv "$VENV"
  PY="$VENV/bin/python"
fi

if ! "$PY" -c 'from chatterbox.mtl_tts import ChatterboxMultilingualTTS' >/dev/null 2>&1; then
  say_status "Chatterbox wird einmalig installiert …"
  "$PY" -m pip install --upgrade pip setuptools wheel
  "$PY" -m pip install chatterbox-tts
fi

# Apple Silicon: MLX ist der primäre Production-Renderer. Er nutzt Apples Metal/MLX
# statt PyTorch/MPS und unterstützt Chatterbox Multilingual v3 inkl. Voice Cloning.
if [ "$(uname -m)" = "arm64" ]; then
  if ! "$PY" -c 'import mlx, mlx_audio' >/dev/null 2>&1; then
    say_status "MLX High-Speed Engine wird einmalig installiert …"
    "$PY" -m pip install --upgrade 'mlx-audio>=0.5.6,<0.6'
  fi
  if "$PY" -c 'import mlx, mlx_audio' >/dev/null 2>&1; then
    echo "MLX High-Speed Engine: bereit"
  else
    echo "Hinweis: MLX konnte nicht aktiviert werden. PyTorch/MPS bleibt als sicherer Fallback aktiv."
  fi
fi

# STRENGE VORPRÜFUNG: Erst Syntax und komplette Voice-2.0-Regression prüfen.
# Bis hier wurde an der funktionierenden Installation noch nichts ersetzt.
if ! "$PY" -m py_compile "$STAGE/local-engine.py"; then
  echo "FEHLER: Neue Voice-Engine ist syntaktisch ungültig. Alte Installation bleibt unverändert."
  exit 1
fi

if ! "$PY" "$STAGE/validate-v2.py"     "$STAGE/pronunciation-rules.json"     "$STAGE/voice-production-profile.json"     "$STAGE/local-engine.py"     "$STAGE/voice-regression-fixtures.json"; then
  echo "FEHLER: Voice-Studio-2.7.1-Regressionsprüfung fehlgeschlagen. Alte Installation bleibt unverändert."
  exit 1
fi

# Erst nach bestandener Prüfung sichern und atomar übernehmen.
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$BACKUPS/$STAMP"
mkdir -p "$BACKUP"
for old in local-engine.py studio.html pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  [ -f "$TARGET/$old" ] && cp "$TARGET/$old" "$BACKUP/$old" || true
done

for fresh in local-engine.py studio.html pronunciation-rules.json voice-production-profile.json islamic-master-library.json voice-regression-fixtures.json validate-v2.py; do
  mv "$STAGE/$fresh" "$TARGET/$fresh"
done
for optional in watermark-my-logo-full.png app-icon-512.png; do
  [ -s "$STAGE/$optional" ] && mv "$STAGE/$optional" "$TARGET/$optional" || true
done

echo "Voice Studio 2.7.1 Validierung bestanden. Backup: $BACKUP"

if ! command -v ffmpeg >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  brew install ffmpeg >/dev/null 2>&1 || true
fi

FFMPEG_BIN="$(command -v ffmpeg 2>/dev/null || true)"
if [ -z "$FFMPEG_BIN" ]; then
  for cand in /opt/homebrew/bin/ffmpeg /usr/local/bin/ffmpeg /opt/local/bin/ffmpeg; do
    if [ -x "$cand" ]; then
      FFMPEG_BIN="$cand"
      break
    fi
  done
fi

# Vorherige Engine/LaunchAgent-Reste sauber lösen.
pkill -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
launchctl bootout "gui/$UID" "$LAUNCH" >/dev/null 2>&1 || true
launchctl remove "$LABEL" >/dev/null 2>&1 || true
sleep 1

# LaunchAgent: lokale Serhat-Engine beim Login starten. Ein launchctl-Fehler
# darf die App-Installation niemals mehr abbrechen.
cat > "$LAUNCH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$VENV/bin/python</string>
    <string>$TARGET/local-engine.py</string>
  </array>
  <key>WorkingDirectory</key><string>$TARGET</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>DAR_VOICE_APP_HOME</key><string>$TARGET</string>
    <key>SERHAT_VOICE_REF</key><string>$REF</string>
    <key>SERHAT_VOICE_REF_AR</key><string>$AR_REF</string>
    <key>PYTORCH_ENABLE_MPS_FALLBACK</key><string>1</string>
    <key>DAR_VOICE_DISABLE_MLX</key><string>0</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>DAR_FFMPEG_BIN</key><string>$FFMPEG_BIN</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>$TARGET/engine.log</string>
  <key>StandardErrorPath</key><string>$TARGET/engine-error.log</string>
</dict>
</plist>
PLIST

/usr/bin/plutil -lint "$LAUNCH" >/dev/null
chmod 600 "$LAUNCH"

LAUNCH_OK=0
: > "$TARGET/launchctl-bootstrap.log"
if launchctl bootstrap "gui/$UID" "$LAUNCH" 2>"$TARGET/launchctl-bootstrap.log"; then
  launchctl enable "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  launchctl kickstart -k "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  LAUNCH_OK=1
else
  echo "Hinweis: macOS launchctl bootstrap wurde abgelehnt. Die Engine wird direkt gestartet."
  cat "$TARGET/launchctl-bootstrap.log" || true
fi

# Warten, ob LaunchAgent die Engine erfolgreich hochgebracht hat.
ENGINE_OK=0
for i in $(seq 1 20); do
  if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
    ENGINE_OK=1
    break
  fi
  sleep 0.5
done

# Robuster Fallback: LaunchAgent zuerst vollständig aus dem Spiel nehmen,
# damit nie LaunchAgent + Direktstart gleichzeitig um Port 8787 konkurrieren.
if [ "$ENGINE_OK" -ne 1 ]; then
  echo "LaunchAgent antwortet nicht – wechsle auf genau einen Direktstart …"
  launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
  launchctl bootout "gui/$UID" "$LAUNCH" >/dev/null 2>&1 || true
  launchctl remove "$LABEL" >/dev/null 2>&1 || true
  pkill -TERM -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
  sleep 1
  pkill -KILL -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true

  nohup env \
    DAR_VOICE_APP_HOME="$TARGET" \
    SERHAT_VOICE_REF="$REF" \
    SERHAT_VOICE_REF_AR="$AR_REF" \
    PYTORCH_ENABLE_MPS_FALLBACK=1 \
    DAR_VOICE_DISABLE_MLX=0 \
    "$VENV/bin/python" "$TARGET/local-engine.py" \
    >>"$TARGET/engine.log" 2>>"$TARGET/engine-error.log" </dev/null &
  echo $! > "$TARGET/engine.pid"

  for i in $(seq 1 40); do
    if curl -fsS --max-time 1 "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
      ENGINE_OK=1
      break
    fi
    sleep 0.5
  done
fi

if [ "$ENGINE_OK" -ne 1 ]; then
  echo "FEHLER: Serhat Engine konnte nicht gestartet werden."
  echo "---- engine-error.log ----"
  tail -n 80 "$TARGET/engine-error.log" 2>/dev/null || true
  echo "---- engine.log ----"
  tail -n 80 "$TARGET/engine.log" 2>/dev/null || true
  exit 1
fi

echo "Serhat Engine erreichbar: http://127.0.0.1:8787/health"

# Native macOS-App wird zuerst vollständig in einem separaten Bundle gebaut.
# Die bisher installierte App bleibt bis nach Build, plist-Lint und Codesign startbar.
APP_BUILD="$TARGET/.DĀR Voice Studio.app.build"
APP_PREVIOUS="$TARGET/.DĀR Voice Studio.app.previous"
rm -rf "$APP_BUILD" "$APP_PREVIOUS"
MACOS="$APP_BUILD/Contents/MacOS"
RESOURCES="$APP_BUILD/Contents/Resources"
PLIST="$APP_BUILD/Contents/Info.plist"
mkdir -p "$MACOS" "$RESOURCES"

# Native macOS-App: eigenes Fenster mit WKWebView, kein Safari/Chrome.
cat > "$TARGET/VoiceStudioApp.swift" <<'SWIFT'
import Cocoa
import WebKit
import Foundation
import Darwin

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var engineProcess: Process?
    private var engineOutHandle: FileHandle?
    private var engineErrHandle: FileHandle?

    private let studioURL = URL(string: "http://127.0.0.1:8787/studio/")!
    private let healthURL = URL(string: "http://127.0.0.1:8787/health")!

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        buildMenus()

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.applicationNameForUserAgent = "DĀRVoiceStudioMac/2.7.1"

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1500, height: 940),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "DĀR AL TAWḤĪD · Voice Studio"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.backgroundColor = NSColor(red: 0.024, green: 0.075, blue: 0.094, alpha: 1)
        window.minSize = NSSize(width: 1000, height: 680)
        window.contentView = webView
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        showLoading()
        waitForEngine(attempt: 0)
    }

    private func menuItem(_ title: String, action: Selector?, key: String = "",
                          modifiers: NSEvent.ModifierFlags = [.command],
                          target: AnyObject? = nil) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: action, keyEquivalent: key)
        item.keyEquivalentModifierMask = key.isEmpty ? [] : modifiers
        item.target = target
        return item
    }

    private func buildMenus() {
        let main = NSMenu()
        NSApp.mainMenu = main

        let appRoot = NSMenuItem()
        main.addItem(appRoot)
        let appMenu = NSMenu(title: "DĀR Voice Studio")
        appRoot.submenu = appMenu
        appMenu.addItem(menuItem("Über DĀR Voice Studio", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:))))
        appMenu.addItem(.separator())
        appMenu.addItem(menuItem("DĀR Voice Studio ausblenden", action: #selector(NSApplication.hide(_:)), key: "h"))
        let hideOthers = menuItem("Andere ausblenden", action: #selector(NSApplication.hideOtherApplications(_:)), key: "h", modifiers: [.command, .option])
        appMenu.addItem(hideOthers)
        appMenu.addItem(menuItem("Alle einblenden", action: #selector(NSApplication.unhideAllApplications(_:))))
        appMenu.addItem(.separator())
        appMenu.addItem(menuItem("DĀR Voice Studio beenden", action: #selector(NSApplication.terminate(_:)), key: "q"))

        let fileRoot = NSMenuItem()
        main.addItem(fileRoot)
        let fileMenu = NSMenu(title: "Ablage")
        fileRoot.submenu = fileMenu
        fileMenu.addItem(menuItem("Fenster schließen", action: #selector(NSWindow.performClose(_:)), key: "w"))

        let editRoot = NSMenuItem()
        main.addItem(editRoot)
        let editMenu = NSMenu(title: "Bearbeiten")
        editRoot.submenu = editMenu

        editMenu.addItem(menuItem("Widerrufen", action: Selector(("undo:")), key: "z"))
        editMenu.addItem(menuItem("Wiederholen", action: Selector(("redo:")), key: "z", modifiers: [.command, .shift]))
        editMenu.addItem(.separator())
        editMenu.addItem(menuItem("Ausschneiden", action: Selector(("cut:")), key: "x"))
        editMenu.addItem(menuItem("Kopieren", action: Selector(("copy:")), key: "c"))
        editMenu.addItem(menuItem("Einsetzen", action: Selector(("paste:")), key: "v"))
        editMenu.addItem(menuItem("Einsetzen und Stil anpassen", action: Selector(("pasteAsPlainText:")), key: "v", modifiers: [.command, .option, .shift]))
        editMenu.addItem(menuItem("Löschen", action: Selector(("delete:"))))
        editMenu.addItem(.separator())
        editMenu.addItem(menuItem("Alles auswählen", action: Selector(("selectAll:")), key: "a"))

        let viewRoot = NSMenuItem()
        main.addItem(viewRoot)
        let viewMenu = NSMenu(title: "Darstellung")
        viewRoot.submenu = viewMenu
        viewMenu.addItem(menuItem("Neu laden", action: #selector(reloadStudio(_:)), key: "r", target: self))
        viewMenu.addItem(.separator())
        viewMenu.addItem(menuItem("Vergrößern", action: #selector(zoomIn(_:)), key: "+", target: self))
        viewMenu.addItem(menuItem("Verkleinern", action: #selector(zoomOut(_:)), key: "-", target: self))
        viewMenu.addItem(menuItem("Originalgröße", action: #selector(resetZoom(_:)), key: "0", target: self))
        viewMenu.addItem(.separator())
        viewMenu.addItem(menuItem("Vollbild", action: #selector(toggleFullScreen(_:)), key: "f", modifiers: [.command, .control], target: self))

        let windowRoot = NSMenuItem()
        main.addItem(windowRoot)
        let windowMenu = NSMenu(title: "Fenster")
        windowRoot.submenu = windowMenu
        windowMenu.addItem(menuItem("Minimieren", action: #selector(NSWindow.performMiniaturize(_:)), key: "m"))
        windowMenu.addItem(menuItem("Zoom", action: #selector(NSWindow.performZoom(_:))))
        NSApp.windowsMenu = windowMenu
    }

    @objc private func reloadStudio(_ sender: Any?) {
        webView.reload()
    }

    @objc private func zoomIn(_ sender: Any?) {
        webView.pageZoom = min(webView.pageZoom + 0.10, 2.0)
    }

    @objc private func zoomOut(_ sender: Any?) {
        webView.pageZoom = max(webView.pageZoom - 0.10, 0.5)
    }

    @objc private func resetZoom(_ sender: Any?) {
        webView.pageZoom = 1.0
    }

    @objc private func toggleFullScreen(_ sender: Any?) {
        window.toggleFullScreen(sender)
    }

    private func ensureEngine() {
        var request = URLRequest(url: healthURL)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 1.0

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            guard let self = self else { return }
            let ok = (response as? HTTPURLResponse)?.statusCode == 200 && error == nil
            if !ok {
                self.startEngineDirectly()
            }
        }.resume()
    }

    private func startEngineDirectly() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            if let p = self.engineProcess, p.isRunning { return }

            let fm = FileManager.default
            let home = fm.homeDirectoryForCurrentUser
            let target = home.appendingPathComponent("Applications/DAR-Voice-Studio")
            let python = home.appendingPathComponent("SerhatVoice/.venv/bin/python")
            let engine = target.appendingPathComponent("local-engine.py")
            let adobe = home.appendingPathComponent("SerhatVoice/Serhat_Adobe_MASTER.wav")
            let fallback = home.appendingPathComponent("SerhatVoice/Serhat_FINAL_REF.wav")
            let arabic = home.appendingPathComponent("SerhatVoice/Serhat_AR_MASTER.wav")

            guard fm.isExecutableFile(atPath: python.path),
                  fm.fileExists(atPath: engine.path) else {
                return
            }

            let process = Process()
            process.executableURL = python
            process.arguments = [engine.path]
            process.currentDirectoryURL = target

            var env = ProcessInfo.processInfo.environment
            env["DAR_VOICE_APP_HOME"] = target.path
            env["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
            env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
            for ffmpeg in ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/opt/local/bin/ffmpeg"] {
                if FileManager.default.isExecutableFile(atPath: ffmpeg) {
                    env["DAR_FFMPEG_BIN"] = ffmpeg
                    break
                }
            }
            if fm.fileExists(atPath: adobe.path) {
                env["SERHAT_VOICE_REF"] = adobe.path
            } else if fm.fileExists(atPath: fallback.path) {
                env["SERHAT_VOICE_REF"] = fallback.path
            }
            if fm.fileExists(atPath: arabic.path) {
                env["SERHAT_VOICE_REF_AR"] = arabic.path
            }
            process.environment = env

            let logURL = target.appendingPathComponent("engine.log")
            let errURL = target.appendingPathComponent("engine-error.log")
            if !fm.fileExists(atPath: logURL.path) { fm.createFile(atPath: logURL.path, contents: nil) }
            if !fm.fileExists(atPath: errURL.path) { fm.createFile(atPath: errURL.path, contents: nil) }

            let out = FileHandle(forWritingAtPath: logURL.path)
            let err = FileHandle(forWritingAtPath: errURL.path)
            try? out?.seekToEnd()
            try? err?.seekToEnd()
            process.standardOutput = out
            process.standardError = err

            self.engineProcess = process
            self.engineOutHandle = out
            self.engineErrHandle = err

            process.terminationHandler = { [weak self] _ in
                self?.engineProcess = nil
            }

            do {
                try process.run()
            } catch {
                NSLog("DĀR Voice engine start failed: \(error)")
                self.engineProcess = nil
            }
        }
    }

    private func showLoading() {
        let html = """
        <!doctype html><html><head><meta charset="utf-8">
        <style>
        html,body{margin:0;height:100%;background:#061318;color:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
        body{display:grid;place-items:center}.box{text-align:center}
        .brand{font-family:Georgia,serif;letter-spacing:.15em;color:#e8d29a;font-weight:700;font-size:18px}
        .sub{margin-top:12px;color:#91a4a8;font-size:13px}
        .dot{width:8px;height:8px;border-radius:50%;background:#73bea1;display:inline-block;margin-right:8px;box-shadow:0 0 0 5px rgba(115,190,161,.10)}
        </style></head><body><div class="box">
        <div class="brand">DĀR AL TAWḤĪD</div>
        <div class="sub"><span class="dot"></span>Serhat Engine wird gestartet …</div>
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    private func waitForEngine(attempt: Int) {
        var request = URLRequest(url: healthURL)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 1.5

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            guard let self = self else { return }
            let ok = (response as? HTTPURLResponse)?.statusCode == 200 && error == nil
            if ok {
                DispatchQueue.main.async {
                    self.webView.load(URLRequest(url: self.studioURL, cachePolicy: .reloadIgnoringLocalCacheData))
                }
                return
            }

            if attempt < 80 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
                    self.waitForEngine(attempt: attempt + 1)
                }
            } else {
                DispatchQueue.main.async {
                    self.showFailure()
                }
            }
        }.resume()
    }

    private func escapedHTML(_ text: String) -> String {
        text
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
    }

    private func errorTail() -> String {
        let path = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Applications/DAR-Voice-Studio/engine-error.log")
        guard let data = try? Data(contentsOf: path),
              let text = String(data: data, encoding: .utf8) else { return "" }
        return String(text.suffix(5000))
    }

    private func showFailure() {
        let details = escapedHTML(errorTail())
        let detailBlock = details.isEmpty ? "" : "<pre>\(details)</pre>"
        let html = """
        <!doctype html><html><head><meta charset="utf-8">
        <style>
        html,body{margin:0;height:100%;background:#061318;color:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
        body{display:grid;place-items:center}.box{width:min(760px,85vw);padding:36px;text-align:center}
        h1{font-size:21px}p{color:#9cafb4;line-height:1.55}
        pre{text-align:left;white-space:pre-wrap;max-height:320px;overflow:auto;background:#031016;border:1px solid rgba(255,255,255,.1);padding:14px;border-radius:12px;color:#e8c7c7;font-size:11px}
        </style></head><body><div class="box">
        <h1>Serhat Engine konnte nicht gestartet werden</h1>
        <p>Die App hat die Engine automatisch erneut gestartet. Unten steht der aktuelle Fehler aus dem lokalen Protokoll.</p>
        \(detailBlock)
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        if let host = url.host, host != "127.0.0.1" && host != "localhost" {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let p = engineProcess, p.isRunning {
            p.terminate()
        }
        try? engineOutHandle?.close()
        try? engineErrHandle?.close()
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
SWIFT

# Native Mac-App bauen. Auf sehr neuen macOS-Versionen darf swiftc nicht
# automatisch gegen die aktuelle Systemversion (z. B. macOS 27) targeten,
# wenn die installierte Toolchain dafür noch keine Standardbibliothek hat.
SWIFTC="$(xcrun --sdk macosx --find swiftc 2>/dev/null || true)"
SDK_PATH="$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)"
ARCH="$(uname -m)"
DEPLOY_TARGET="13.0"
BUILD_OK=0

if [ -n "$SWIFTC" ] && [ -n "$SDK_PATH" ]; then
  echo "Baue native DĀR Voice Studio App …"
  echo "Swift: $SWIFTC"
  echo "SDK:   $SDK_PATH"
  echo "Target: ${ARCH}-apple-macosx${DEPLOY_TARGET}"
  if MACOSX_DEPLOYMENT_TARGET="$DEPLOY_TARGET" "$SWIFTC"       -sdk "$SDK_PATH"       -target "${ARCH}-apple-macosx${DEPLOY_TARGET}"       "$TARGET/VoiceStudioApp.swift"       -o "$MACOS/DARVoiceStudioNative"       -framework Cocoa       -framework WebKit; then
    BUILD_OK=1
  fi
fi

# Falls nur die Command Line Tools kaputt/veraltet sind, noch einmal explizit
# mit einer vorhandenen Voll-Xcode-Installation versuchen.
if [ "$BUILD_OK" -ne 1 ] && [ -d "/Applications/Xcode.app/Contents/Developer" ]; then
  XSWIFTC="$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --sdk macosx --find swiftc 2>/dev/null || true)"
  XSDK="$(DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)"
  if [ -n "$XSWIFTC" ] && [ -n "$XSDK" ]; then
    echo "Erster Swift-Build fehlgeschlagen – versuche vollständiges Xcode …"
    if MACOSX_DEPLOYMENT_TARGET="$DEPLOY_TARGET" "$XSWIFTC"         -sdk "$XSDK"         -target "${ARCH}-apple-macosx${DEPLOY_TARGET}"         "$TARGET/VoiceStudioApp.swift"         -o "$MACOS/DARVoiceStudioNative"         -framework Cocoa         -framework WebKit; then
      BUILD_OK=1
    fi
  fi
fi

# Der Bundle-Einstieg ist immer ein kleiner robuster Launcher. Er schreibt ein eigenes
# Startprotokoll, startet notfalls die lokale Engine und übergibt dann an die native WKWebView.
# Falls die Swift-Toolchain keine Native-Binary bauen konnte, öffnet er die Studio-URL als
# Chrome-/Edge-App-Fenster bzw. als letzten Fallback im Standardbrowser.
if [ "$BUILD_OK" -ne 1 ]; then
  echo "Swift-Toolchain weiterhin inkompatibel – Browser-App-Fallback wird verwendet."
fi

cat > "$MACOS/DARVoiceStudio" <<'APPSTART'
#!/bin/bash
set -u

TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
URL="http://127.0.0.1:8787/studio/"
HEALTH="http://127.0.0.1:8787/health"
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
NATIVE="$SELF_DIR/DARVoiceStudioNative"
LOG="$TARGET/app-launch.log"

mkdir -p "$TARGET"
touch "$LOG"

{
  echo ""
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') DĀR Voice Studio start ==="
  echo "Executable: $0"
  echo "Native: $NATIVE"

  if ! /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1; then
    echo "Engine nicht erreichbar – versuche genau einen LaunchAgent-Start."
    launchctl kickstart -k "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true

    for i in $(seq 1 16); do
      /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1 && break
      sleep 0.4
    done
  fi

  if ! /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1; then
    echo "LaunchAgent ohne Health – stoppe nur eigene alte Engine und starte einmal direkt."
    launchctl bootout "gui/$UID/com.daraltawhid.voice-engine" >/dev/null 2>&1 || true
    pkill -TERM -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true
    sleep 1
    pkill -KILL -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true

    if [ -x "$VENV/bin/python" ] && [ -f "$TARGET/local-engine.py" ]; then
      /usr/bin/nohup /usr/bin/env \
        DAR_VOICE_APP_HOME="$TARGET" \
        PYTORCH_ENABLE_MPS_FALLBACK=1 \
        DAR_VOICE_DISABLE_MLX=0 \
        PATH="/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
        "$VENV/bin/python" "$TARGET/local-engine.py" \
        >>"$TARGET/engine.log" 2>>"$TARGET/engine-error.log" </dev/null &
      echo "Engine PID: $!"
    else
      echo "Engine/Python fehlt: $VENV/bin/python / $TARGET/local-engine.py"
    fi

    for i in $(seq 1 40); do
      /usr/bin/curl -fsS --max-time 1 "$HEALTH" >/dev/null 2>&1 && break
      sleep 0.5
    done
  fi


  if [ -x "$NATIVE" ]; then
    echo "Starte native WKWebView-App."
    exec "$NATIVE"
  fi

  echo "Native Binary fehlt – verwende Browser-App-Fallback."
  if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"       --app="$URL"       --user-data-dir="$HOME/Library/Application Support/DAR Voice Studio"       --no-first-run       --no-default-browser-check
  fi

  if [ -x "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" ]; then
    exec "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"       --app="$URL"       --user-data-dir="$HOME/Library/Application Support/DAR Voice Studio"       --no-first-run       --no-default-browser-check
  fi

  /usr/bin/open "$URL"
} >>"$LOG" 2>&1
APPSTART

chmod +x "$MACOS/DARVoiceStudio"
[ -f "$MACOS/DARVoiceStudioNative" ] && chmod +x "$MACOS/DARVoiceStudioNative" || true


# App-Icon aus bestehendem DĀR-Icon erzeugen.
if [ -s "$TARGET/app-icon-512.png" ]; then
  ICONSET="$TARGET/AppIcon.iconset"
  rm -rf "$ICONSET"
  mkdir -p "$ICONSET"
  for spec in "16 icon_16x16.png" "32 icon_16x16@2x.png" "32 icon_32x32.png" "64 icon_32x32@2x.png" "128 icon_128x128.png" "256 icon_128x128@2x.png" "256 icon_256x256.png" "512 icon_256x256@2x.png" "512 icon_512x512.png" "1024 icon_512x512@2x.png"; do
    set -- $spec
    sips -z "$1" "$1" "$TARGET/app-icon-512.png" --out "$ICONSET/$2" >/dev/null 2>&1 || true
  done
  iconutil -c icns "$ICONSET" -o "$RESOURCES/AppIcon.icns" >/dev/null 2>&1 || true
fi

cat > "$PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>DĀR Voice Studio</string>
  <key>CFBundleDisplayName</key><string>DĀR Voice Studio</string>
  <key>CFBundleIdentifier</key><string>de.dar-al-tawhid.voice-studio</string>
  <key>CFBundleVersion</key><string>2.7.1</string>
  <key>CFBundleShortVersionString</key><string>2.7.1</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>DARVoiceStudio</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsLocalNetworking</key><true/>
    <key>NSAllowsArbitraryLoadsInWebContent</key><true/>
  </dict>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key><string>DĀR Voice Studio</string>
      <key>CFBundleURLSchemes</key><array><string>darvoice</string></array>
    </dict>
  </array>
</dict>
</plist>
PLIST
/usr/bin/plutil -lint "$PLIST" >/dev/null

# Lokales ad-hoc Codesigning nach jedem Neuaufbau. Dadurch behandelt macOS
# Bundle, Binary, Info.plist und Ressourcen als eine konsistente neue App.
if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_BUILD" >/dev/null 2>&1 || true
fi

# Bundle vor dem Austausch technisch prüfen.
if [ ! -x "$MACOS/DARVoiceStudio" ]; then
  echo "FEHLER: Neuer App-Launcher fehlt. Die vorhandene App bleibt erhalten."
  exit 1
fi
if command -v codesign >/dev/null 2>&1; then
  codesign --verify --deep "$APP_BUILD" >/dev/null 2>&1 || {
    echo "FEHLER: Neues App-Bundle ist nicht konsistent signiert. Die vorhandene App bleibt erhalten."
    exit 1
  }
fi

# Erst jetzt die alte App austauschen. Bei einem mv-Fehler wird sie wiederhergestellt.
if [ -d "$APP" ]; then
  mv "$APP" "$APP_PREVIOUS"
fi
if mv "$APP_BUILD" "$APP"; then
  rm -rf "$APP_PREVIOUS"
else
  echo "FEHLER: Neues App-Bundle konnte nicht aktiviert werden."
  rm -rf "$APP"
  [ -d "$APP_PREVIOUS" ] && mv "$APP_PREVIOUS" "$APP"
  exit 1
fi

# Alte LaunchServices-Zuordnung entfernen und die frisch gebaute App registrieren.
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
"$LSREGISTER" -u "$APP" >/dev/null 2>&1 || true
"$LSREGISTER" -f "$APP" >/dev/null 2>&1 || true

# Finder/LaunchServices kurz Zeit geben, die neue Binary zu übernehmen.
sleep 1

# App bei LaunchServices registrieren, dann öffnen.
say_status "DĀR Voice Studio 2.7.1 ist installiert."
if ! open -n "$APP"; then
  echo "LaunchServices konnte die App nicht öffnen – starte Bundle-Executable direkt."
  "$APP/Contents/MacOS/DARVoiceStudio" >/dev/null 2>&1 &
fi

sleep 2
if [ -f "$TARGET/app-launch.log" ]; then
  echo "---- letzter App-Start ----"
  tail -n 20 "$TARGET/app-launch.log" || true
fi
