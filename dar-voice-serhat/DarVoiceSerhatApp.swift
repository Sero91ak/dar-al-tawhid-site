import Cocoa
import WebKit

@main
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var engineProcess: Process?
    private let port = 8789

    private var home: String { FileManager.default.homeDirectoryForCurrentUser.path }
    private var appHome: String { home + "/Applications/DAR-Voice-Serhat" }
    private var voiceHome: String { home + "/SerhatVoice/DARVoiceStandalone" }
    private var pythonPath: String { home + "/SerhatVoice/.venv/bin/python" }
    private var enginePath: String { appHome + "/local-engine.py" }
    private var iconPath: String { appHome + "/voice-studio-icon.png" }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        applyIcon()
        buildWindow()
        startEngineIfNeeded()
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let p = engineProcess, p.isRunning {
            p.terminate()
        }
    }

    private func applyIcon() {
        if let image = NSImage(contentsOfFile: iconPath) {
            NSApp.applicationIconImage = image
        }
    }

    private func buildWindow() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 860),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "DĀR Voice by Serhat Abu Malik"
        window.titleVisibility = .visible
        window.center()
        window.minSize = NSSize(width: 900, height: 640)
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        showLoadingPage("Serhat Engine wird gestartet …")
    }

    private func showLoadingPage(_ message: String) {
        let escaped = message
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
        let html = """
        <!doctype html><html><head><meta charset="utf-8">
        <style>
        html,body{height:100%;margin:0;background:#06131f;color:#f7f2e8;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}
        .w{height:100%;display:grid;place-items:center;text-align:center}
        .card{padding:30px 38px;border:1px solid rgba(214,183,102,.18);border-radius:20px;background:#0c2234;box-shadow:0 24px 70px rgba(0,0,0,.25)}
        h1{font-size:26px;margin:0 0 8px}p{color:#9eafb8;margin:0}
        .gold{color:#efd98d;font-size:12px;letter-spacing:.1em;margin-top:8px}
        </style></head><body><div class="w"><div class="card">
        <h1>DĀR Voice</h1><p>(escaped)</p><div class="gold">by Serhat Abu Malik</div>
        </div></div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    private func healthURL() -> URL {
        URL(string: "http://127.0.0.1:\(port)/health")!
    }

    private func appURL() -> URL {
        URL(string: "http://127.0.0.1:\(port)/studio/free/")!
    }

    private func checkHealth(_ completion: @escaping (Bool) -> Void) {
        var req = URLRequest(url: healthURL())
        req.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        req.timeoutInterval = 0.8
        URLSession.shared.dataTask(with: req) { _, resp, _ in
            let ok = (resp as? HTTPURLResponse)?.statusCode == 200
            DispatchQueue.main.async { completion(ok) }
        }.resume()
    }

    private func startEngineIfNeeded() {
        checkHealth { [weak self] ok in
            guard let self else { return }
            if ok {
                self.loadApp()
                return
            }
            self.launchEngine()
        }
    }

    private func launchEngine() {
        let fm = FileManager.default
        guard fm.isExecutableFile(atPath: pythonPath), fm.fileExists(atPath: enginePath) else {
            showLoadingPage("Installation unvollständig. Bitte den Installer erneut ausführen.")
            return
        }

        try? fm.createDirectory(atPath: voiceHome, withIntermediateDirectories: true)

        let process = Process()
        process.executableURL = URL(fileURLWithPath: pythonPath)
        process.arguments = [enginePath]
        process.currentDirectoryURL = URL(fileURLWithPath: appHome, isDirectory: true)

        var env = ProcessInfo.processInfo.environment
        env["DAR_VOICE_APP_HOME"] = appHome
        env["DAR_VOICE_HOME"] = voiceHome
        env["DAR_VOICE_PORT"] = String(port)
        env["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
        env["DAR_VOICE_DISABLE_MLX"] = "0"

        let master = home + "/SerhatVoice/Serhat_Adobe_MASTER.wav"
        let fallback = home + "/SerhatVoice/Serhat_FINAL_REF.wav"
        if fm.fileExists(atPath: master) {
            env["SERHAT_VOICE_REF"] = master
        } else if fm.fileExists(atPath: fallback) {
            env["SERHAT_VOICE_REF"] = fallback
        }

        let ar = home + "/SerhatVoice/Serhat_AR_MASTER.wav"
        if fm.fileExists(atPath: ar) {
            env["SERHAT_VOICE_REF_AR"] = ar
        }

        process.environment = env

        let outPath = appHome + "/engine.log"
        let errPath = appHome + "/engine-error.log"
        fm.createFile(atPath: outPath, contents: nil)
        fm.createFile(atPath: errPath, contents: nil)
        process.standardOutput = FileHandle(forWritingAtPath: outPath)
        process.standardError = FileHandle(forWritingAtPath: errPath)

        do {
            try process.run()
            engineProcess = process
            waitForEngine(attempt: 0)
        } catch {
            showLoadingPage("Engine konnte nicht gestartet werden: \(error.localizedDescription)")
        }
    }

    private func waitForEngine(attempt: Int) {
        if attempt > 90 {
            showLoadingPage("Engine wurde nicht rechtzeitig bereit. Bitte App neu öffnen.")
            return
        }
        checkHealth { [weak self] ok in
            guard let self else { return }
            if ok {
                self.loadApp()
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
                    self.waitForEngine(attempt: attempt + 1)
                }
            }
        }
    }

    private func loadApp() {
        webView.load(URLRequest(url: appURL(), cachePolicy: .reloadIgnoringLocalAndRemoteCacheData))
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}
