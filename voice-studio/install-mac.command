#!/bin/bash
set -euo pipefail

SITE="https://dar-al-tawhid.de"
TARGET="$HOME/Applications/DAR-Voice-Studio"
VOICE_HOME="$HOME/SerhatVoice"
VENV="$VOICE_HOME/.venv"
APP="$HOME/Applications/DĀR Voice Studio.app"
MACOS="$APP/Contents/MacOS"
RESOURCES="$APP/Contents/Resources"
PLIST="$APP/Contents/Info.plist"
LAUNCH="$HOME/Library/LaunchAgents/com.daraltawhid.voice-engine.plist"
LABEL="com.daraltawhid.voice-engine"

mkdir -p "$TARGET" "$VOICE_HOME" "$MACOS" "$RESOURCES" "$HOME/Library/LaunchAgents"

say_status() {
  /usr/bin/osascript -e "display notification \"$1\" with title \"DĀR Voice Studio\"" >/dev/null 2>&1 || true
}

say_status "DĀR Voice Studio wird eingerichtet …"

# Aktuelle Studio-Dateien lokal spiegeln.
curl -fsSL "$SITE/voice-studio/local-engine.py?setup=10" -o "$TARGET/local-engine.py"
curl -fsSL "$SITE/voice-studio/index.html?setup=10" -o "$TARGET/studio.html"
curl -fsSL "$SITE/data/pronunciation/pronunciation-rules.json?setup=10" -o "$TARGET/pronunciation-rules.json"
curl -fsSL "$SITE/data/pronunciation/voice-production-profile.json?setup=10" -o "$TARGET/voice-production-profile.json"
curl -fsSL "$SITE/watermark-my-logo-full.png?setup=10" -o "$TARGET/watermark-my-logo-full.png" || true
curl -fsSL "$SITE/app-icon-512.png?setup=10" -o "$TARGET/app-icon-512.png" || true

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

if ! command -v ffmpeg >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
  brew install ffmpeg >/dev/null 2>&1 || true
fi

# Alte lokale Engine beenden, damit LaunchAgent sauber übernehmen kann.
pkill -f "$TARGET/local-engine.py" >/dev/null 2>&1 || true

# LaunchAgent: lokale Serhat-Engine beim Login starten und am Leben halten.
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
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProcessType</key><string>Interactive</string>
  <key>StandardOutPath</key><string>$TARGET/engine.log</string>
  <key>StandardErrorPath</key><string>$TARGET/engine-error.log</string>
</dict>
</plist>
PLIST
/usr/bin/plutil -lint "$LAUNCH" >/dev/null

launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$UID" "$LAUNCH"
launchctl kickstart -k "gui/$UID/$LABEL" >/dev/null 2>&1 || true

# Native macOS-App: eigenes Fenster mit WKWebView, kein Safari/Chrome.
cat > "$TARGET/VoiceStudioApp.swift" <<'SWIFT'
import Cocoa
import WebKit
import Foundation
import Darwin

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private let studioURL = URL(string: "http://127.0.0.1:8787/studio/")!
    private let healthURL = URL(string: "http://127.0.0.1:8787/health")!

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.applicationNameForUserAgent = "DĀRVoiceStudioMac/1.0"

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

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
        kickEngine()
        waitForEngine(attempt: 0)
    }

    private func kickEngine() {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/bin/launchctl")
        task.arguments = ["kickstart", "-k", "gui/\(getuid())/com.daraltawhid.voice-engine"]
        try? task.run()
    }

    private func showLoading() {
        let html = """
        <!doctype html><html><head><meta charset="utf-8">
        <style>
        html,body{margin:0;height:100%;background:#061318;color:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
        body{display:grid;place-items:center}
        .box{text-align:center}
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
            guard let self else { return }
            let ok = (response as? HTTPURLResponse)?.statusCode == 200 && error == nil
            if ok {
                DispatchQueue.main.async {
                    self.webView.load(URLRequest(url: self.studioURL, cachePolicy: .reloadIgnoringLocalCacheData))
                }
                return
            }

            if attempt < 60 {
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

    private func showFailure() {
        let html = """
        <!doctype html><html><head><meta charset="utf-8">
        <style>
        html,body{margin:0;height:100%;background:#061318;color:#f5f1e8;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
        body{display:grid;place-items:center}.box{max-width:560px;padding:36px;text-align:center}
        h1{font-size:21px}p{color:#9cafb4;line-height:1.55}
        </style></head><body><div class="box">
        <h1>Serhat Engine konnte nicht gestartet werden</h1>
        <p>Schließe die App und starte sie erneut. Falls der Fehler bleibt, liegt das Protokoll unter ~/Applications/DAR-Voice-Studio/engine-error.log.</p>
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
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
SWIFT

# Swift-Compiler aus den Apple Command Line Tools verwenden.
SWIFTC="$(xcrun --find swiftc 2>/dev/null || true)"
if [ -z "$SWIFTC" ]; then
  /usr/bin/osascript -e 'display dialog "Für die native DĀR Voice Studio Mac-App werden einmalig die kostenlosen Apple Command Line Tools benötigt. Bitte installieren und danach denselben Setup-Befehl erneut ausführen." buttons {"Installieren","Abbrechen"} default button 1 with icon caution'
  xcode-select --install >/dev/null 2>&1 || true
  exit 1
fi

"$SWIFTC" "$TARGET/VoiceStudioApp.swift"   -o "$MACOS/DARVoiceStudio"   -framework Cocoa   -framework WebKit
chmod +x "$MACOS/DARVoiceStudio"

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
  <key>CFBundleVersion</key><string>1.4.0</string>
  <key>CFBundleShortVersionString</key><string>1.4</string>
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

# App bei LaunchServices registrieren, dann öffnen.
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
"$LSREGISTER" -f "$APP" >/dev/null 2>&1 || true

say_status "DĀR Voice Studio ist als Mac-App installiert."
open "$APP"
