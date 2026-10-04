import Cocoa

// 2.9.42 rollout compatibility for existing CI only: DĀRVoiceStudioMac/2.9.26
import WebKit
import Foundation
import Darwin
import CoreAudio
import CoreImage

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var engineProcess: Process?
    private var engineOutHandle: FileHandle?
    private var engineErrHandle: FileHandle?

    private let studioURL = URL(string: "http://127.0.0.1:8787/studio/")!
    private let healthURL = URL(string: "http://127.0.0.1:8787/health")!
    private let updateManifestURL = URL(string: "https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/voice-studio/version.json?ref=main")!
    private var latestKnownVersion = ""
    private var updateAvailable = false

    private var currentVersion: String {
        (Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String) ?? "2.9.94"
    }

    private var externalEngineOwner: Bool {
        ProcessInfo.processInfo.environment["DAR_VOICE_ENGINE_OWNER"] == "launcher"
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        applyAppIcon()
        buildMenus()

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.applicationNameForUserAgent = "DĀRVoiceStudioMac/\(currentVersion)"
        config.userContentController.add(self, name: "darAudioOutput")
        config.userContentController.add(self, name: "darUpdater")
        config.userContentController.add(self, name: "darCompanion")

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
        ensureEngine()
        waitForEngine(attempt: 0)
    }

    private func bundledIconURL() -> URL? {
        Bundle.main.url(forResource: "VoiceStudioIcon", withExtension: "png")
    }

    private func applyAppIcon() {
        guard let url = bundledIconURL(), let icon = NSImage(contentsOf: url) else { return }
        icon.size = NSSize(width: 512, height: 512)
        NSApp.applicationIconImage = icon
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
        appMenu.addItem(menuItem("Nach Updates suchen…", action: #selector(checkForUpdatesFromMenu(_:)), target: self))
        appMenu.addItem(menuItem("Update jetzt installieren…", action: #selector(installUpdateFromMenu(_:)), target: self))
        appMenu.addItem(menuItem("Update-Protokoll öffnen…", action: #selector(openUpdateLog(_:)), target: self))
        appMenu.addItem(menuItem("iPad / iPhone verbinden…", action: #selector(showCompanionPairing(_:)), target: self))
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

        let productionRoot = NSMenuItem()
        main.addItem(productionRoot)
        let productionMenu = NSMenu(title: "Produktion")
        productionRoot.submenu = productionMenu
        productionMenu.addItem(menuItem(
            "Neuer Inhalt",
            action: #selector(newContent(_:)),
            key: "n",
            target: self
        ))
        productionMenu.addItem(menuItem(
            "Zum Text",
            action: #selector(focusText(_:)),
            key: "1",
            target: self
        ))
        productionMenu.addItem(menuItem(
            "Freie Stimme",
            action: #selector(openFreeVoice(_:)),
            key: "2",
            target: self
        ))
        productionMenu.addItem(.separator())
        productionMenu.addItem(menuItem(
            "Audio + Cover erzeugen",
            action: #selector(produceContent(_:)),
            key: "e",
            modifiers: [.command, .shift],
            target: self
        ))
        productionMenu.addItem(menuItem(
            "In Test veröffentlichen",
            action: #selector(publishTestContent(_:)),
            key: "t",
            modifiers: [.command, .shift],
            target: self
        ))
        productionMenu.addItem(menuItem(
            "Live veröffentlichen",
            action: #selector(publishLiveContent(_:)),
            key: "l",
            modifiers: [.command, .shift],
            target: self
        ))

        let audioRoot = NSMenuItem()
        main.addItem(audioRoot)
        let audioMenu = NSMenu(title: "Audio")
        audioRoot.submenu = audioMenu
        audioMenu.addItem(menuItem(
            "Audio-Ausgabe wählen…",
            action: #selector(showAudioOutputMenu(_:)),
            key: "o",
            modifiers: [.command, .option],
            target: self
        ))
        audioMenu.addItem(menuItem(
            "Toneinstellungen öffnen…",
            action: #selector(openSoundSettings(_:)),
            target: self
        ))

        let windowRoot = NSMenuItem()
        main.addItem(windowRoot)
        let windowMenu = NSMenu(title: "Fenster")
        windowRoot.submenu = windowMenu
        windowMenu.addItem(menuItem("Minimieren", action: #selector(NSWindow.performMiniaturize(_:)), key: "m"))
        windowMenu.addItem(menuItem("Zoom", action: #selector(NSWindow.performZoom(_:))))
        NSApp.windowsMenu = windowMenu
    }

    private func runStudioAction(_ javascript: String) {
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(javascript, completionHandler: nil)
        }
    }

    @objc private func newContent(_ sender: Any?) {
        runStudioAction("window.DarContentStudio && window.DarContentStudio.newCurrentItem && window.DarContentStudio.newCurrentItem();")
    }

    @objc private func focusText(_ sender: Any?) {
        runStudioAction("window.setStudioMode && window.setStudioMode('production'); window.DarContentStudio && window.DarContentStudio.goToWorkflowStep && window.DarContentStudio.goToWorkflowStep('text');")
    }

    @objc private func openFreeVoice(_ sender: Any?) {
        runStudioAction("window.setStudioMode && window.setStudioMode('free');")
    }

    @objc private func produceContent(_ sender: Any?) {
        runStudioAction("window.DarContentStudio && window.DarContentStudio.produce && window.DarContentStudio.produce();")
    }

    @objc private func publishTestContent(_ sender: Any?) {
        runStudioAction("window.DarContentStudio && window.DarContentStudio.publishTest && window.DarContentStudio.publishTest();")
    }

    @objc private func publishLiveContent(_ sender: Any?) {
        runStudioAction("window.DarContentStudio && window.DarContentStudio.publishLive && window.DarContentStudio.publishLive();")
    }

    private func companionToken() -> String? {
        let path = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Applications/DAR-Voice-Studio/ipad-pairing-token.txt")
        guard let raw = try? String(contentsOf: path, encoding: .utf8) else { return nil }
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return token.isEmpty ? nil : token
    }

    private func localIPv4Address() -> String? {
        var address: String?
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0, let first = ifaddr else { return nil }
        defer { freeifaddrs(ifaddr) }

        var pointer: UnsafeMutablePointer<ifaddrs>? = first
        var fallback: String?
        while let current = pointer {
            let interface = current.pointee
            defer { pointer = interface.ifa_next }
            guard let addr = interface.ifa_addr,
                  addr.pointee.sa_family == UInt8(AF_INET) else { continue }

            let name = String(cString: interface.ifa_name)
            if name == "lo0" { continue }

            var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            let length = socklen_t(addr.pointee.sa_len)
            let result = getnameinfo(
                addr,
                length,
                &host,
                socklen_t(host.count),
                nil,
                0,
                NI_NUMERICHOST
            )
            guard result == 0 else { continue }
            let value = String(cString: host)
            if value.hasPrefix("169.254.") { continue }
            if name == "en0" || name == "en1" {
                address = value
                break
            }
            if fallback == nil { fallback = value }
        }
        return address ?? fallback
    }

    private func companionPairingURL() -> String? {
        guard let ip = localIPv4Address(),
              let token = companionToken() else { return nil }
        var components = URLComponents()
        components.scheme = "http"
        components.host = ip
        components.port = 8787
        components.path = "/mobile/"
        components.queryItems = [URLQueryItem(name: "pair", value: token)]
        return components.url?.absoluteString
    }

    private func qrImage(for text: String, size: CGFloat = 220) -> NSImage? {
        guard let data = text.data(using: .utf8),
              let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        guard let output = filter.outputImage else { return nil }

        let scale = max(1, floor(size / max(output.extent.width, output.extent.height)))
        let transformed = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        let context = CIContext(options: [.useSoftwareRenderer: false])
        guard let cg = context.createCGImage(transformed, from: transformed.extent) else { return nil }
        return NSImage(cgImage: cg, size: NSSize(width: size, height: size))
    }

    @objc private func showCompanionPairing(_ sender: Any?) {
        let alert = NSAlert()
        alert.alertStyle = .informational
        alert.messageText = "DĀR Voice auf iPad / iPhone öffnen"

        guard let url = companionPairingURL() else {
            alert.informativeText = "Keine lokale WLAN-Adresse oder kein Kopplungsschlüssel verfügbar. Verbinde den Mac mit demselben WLAN wie dein iPad/iPhone und starte Voice Studio erneut."
            alert.addButton(withTitle: "OK")
            alert.runModal()
            return
        }

        alert.informativeText = "Scanne den QR-Code mit dem iPad/iPhone im selben WLAN oder kopiere den Link. Beim ersten Öffnen wird das Gerät sicher mit diesem Mac gekoppelt.\n\nDen Kopplungslink nicht an andere Personen weitergeben."
        if let image = qrImage(for: url) {
            let imageView = NSImageView(frame: NSRect(x: 0, y: 0, width: 220, height: 220))
            imageView.image = image
            imageView.imageScaling = .scaleProportionallyUpOrDown
            alert.accessoryView = imageView
        }
        alert.addButton(withTitle: "Link kopieren")
        alert.addButton(withTitle: "Schließen")
        let response = alert.runModal()
        if response == .alertFirstButtonReturn {
            let pasteboard = NSPasteboard.general
            pasteboard.clearContents()
            pasteboard.setString(url, forType: .string)
        }
    }

    private func versionParts(_ value: String) -> [Int] {
        value.split(separator: ".").map { part in
            Int(part.prefix { $0.isNumber }) ?? 0
        }
    }

    private func isVersion(_ candidate: String, newerThan installed: String) -> Bool {
        let a = versionParts(candidate)
        let b = versionParts(installed)
        let count = max(a.count, b.count)
        for i in 0..<count {
            let left = i < a.count ? a[i] : 0
            let right = i < b.count ? b[i] : 0
            if left != right { return left > right }
        }
        return false
    }

    private func publishUpdateState(_ state: String, latest: String? = nil, message: String = "") {
        let payload: [String: Any] = [
            "state": state,
            "current": currentVersion,
            "latest": latest ?? latestKnownVersion,
            "message": message
        ]
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(
                "window.darUpdateStateChanged && window.darUpdateStateChanged(\(json));",
                completionHandler: nil
            )
        }
    }

    private func manifestObject(from data: Data) -> [String: Any]? {
        guard let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        if object["version"] is String { return object }
        guard let content = object["content"] as? String else { return object }
        let cleaned = content.replacingOccurrences(of: "\\s", with: "", options: .regularExpression)
        guard let decoded = Data(base64Encoded: cleaned),
              let inner = try? JSONSerialization.jsonObject(with: decoded) as? [String: Any] else { return object }
        return inner
    }

    private func updateManifestSources() -> [URL] {
        let stamp = String(Int(Date().timeIntervalSince1970))
        var urls: [URL] = [updateManifestURL]
        if let site = URL(string: "https://dar-al-tawhid.de/voice-studio/version.json?update_check=\(stamp)") {
            urls.append(site)
        }
        return urls
    }

    private func finishUpdateCheck(with object: [String: Any], userInitiated: Bool) {
        guard let latest = object["version"] as? String, !latest.isEmpty else {
            publishUpdateState("error", message: "Update-Datei enthält keine gültige Versionsnummer.")
            return
        }

        latestKnownVersion = latest
        updateAvailable = isVersion(latest, newerThan: currentVersion)
        if updateAvailable {
            // Stabilitätsmodus:
            // Beim App-Start nur anzeigen, NIEMALS automatisch installieren.
            // Ein automatischer Installationsstart beendet die laufende App und
            // konnte bei einem Installerproblem einen scheinbaren Crash-Loop erzeugen.
            publishUpdateState("available", latest: latest, message: "Update verfügbar · Installation nur nach deinem Klick")
        } else {
            publishUpdateState(
                "current",
                latest: latest,
                message: userInitiated ? "Voice Studio ist aktuell." : ""
            )
        }
    }

    private func checkUpdateWithSystemCurl(
        userInitiated: Bool,
        failures: [String]
    ) {
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self = self else { return }

            let candidates: [(URL, Bool)] = self.updateManifestSources().map {
                ($0, $0.host == "api.github.com")
            }
            var curlFailures = failures

            for (url, isGitHubAPI) in candidates {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
                var args = [
                    "-fsSL",
                    "--connect-timeout", "5",
                    "--max-time", "15",
                    "--retry", "2",
                    "--retry-delay", "1",
                    "-H", "Cache-Control: no-cache",
                    "-H", "User-Agent: DAR-Voice-Studio-Updater/\(self.currentVersion)"
                ]
                if isGitHubAPI {
                    args += ["-H", "Accept: application/vnd.github.raw+json"]
                } else {
                    args += ["-H", "Accept: application/json"]
                }
                args.append(url.absoluteString)
                process.arguments = args

                let pipe = Pipe()
                let errPipe = Pipe()
                process.standardOutput = pipe
                process.standardError = errPipe

                do {
                    try process.run()
                    process.waitUntilExit()
                    let data = pipe.fileHandleForReading.readDataToEndOfFile()
                    if process.terminationStatus == 0,
                       let object = self.manifestObject(from: data),
                       object["version"] is String {
                        self.finishUpdateCheck(with: object, userInitiated: userInitiated)
                        return
                    }

                    let errData = errPipe.fileHandleForReading.readDataToEndOfFile()
                    let errText = String(data: errData, encoding: .utf8)?
                        .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                    curlFailures.append(
                        "curl \(url.host ?? "Quelle"): " +
                        (errText.isEmpty ? "Status \(process.terminationStatus)" : errText)
                    )
                } catch {
                    curlFailures.append(
                        "curl \(url.host ?? "Quelle"): \(error.localizedDescription)"
                    )
                }
            }

            let detail = curlFailures.suffix(4).joined(separator: " · ")
            self.publishUpdateState(
                "error",
                message: detail.isEmpty
                    ? "Update-Prüfung derzeit nicht erreichbar."
                    : "Update-Prüfung derzeit nicht erreichbar. \(detail)"
            )
        }
    }

    private func checkUpdateSource(
        _ sources: [URL],
        index: Int,
        userInitiated: Bool,
        failures: [String]
    ) {
        guard index < sources.count else {
            checkUpdateWithSystemCurl(
                userInitiated: userInitiated,
                failures: failures
            )
            return
        }

        let url = sources[index]
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 7
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.setValue("DAR-Voice-Studio-Updater/\(currentVersion)", forHTTPHeaderField: "User-Agent")
        if url.host == "api.github.com" {
            request.setValue("application/vnd.github.raw+json", forHTTPHeaderField: "Accept")
        } else {
            request.setValue("application/json", forHTTPHeaderField: "Accept")
        }

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0

            if error == nil,
               status == 200,
               let data = data,
               let object = self.manifestObject(from: data),
               object["version"] is String {
                self.finishUpdateCheck(with: object, userInitiated: userInitiated)
                return
            }

            var nextFailures = failures
            if let error = error {
                nextFailures.append("\(url.host ?? "Quelle"): \(error.localizedDescription)")
            } else {
                nextFailures.append("\(url.host ?? "Quelle"): HTTP \(status)")
            }
            self.checkUpdateSource(
                sources,
                index: index + 1,
                userInitiated: userInitiated,
                failures: nextFailures
            )
        }.resume()
    }

    private func checkForUpdates(userInitiated: Bool = false) {
        if userInitiated {
            publishUpdateState("checking", message: "Neue Version wird geprüft …")
        }
        checkUpdateSource(
            updateManifestSources(),
            index: 0,
            userInitiated: userInitiated,
            failures: []
        )
    }

    @objc private func checkForUpdatesFromMenu(_ sender: Any?) {
        checkForUpdates(userInitiated: true)
    }

    @objc private func installUpdateFromMenu(_ sender: Any?) {
        installAvailableUpdate()
    }

    private func updateLogURL() -> URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Applications/DAR-Voice-Studio/update.log")
    }

    @objc private func openUpdateLog(_ sender: Any?) {
        let url = updateLogURL()
        if FileManager.default.fileExists(atPath: url.path) {
            NSWorkspace.shared.open(url)
        } else {
            let alert = NSAlert()
            alert.messageText = "Noch kein Update-Protokoll vorhanden"
            alert.informativeText = "Sobald ein Update gestartet wurde, wird hier ein Protokoll angelegt."
            alert.runModal()
        }
    }

    private func installAvailableUpdate() {
        let helper = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Applications/DAR-Voice-Studio/update-mac.command")
        guard FileManager.default.fileExists(atPath: helper.path) else {
            publishUpdateState(
                "error",
                message: "Lokaler Updater fehlt. Die Installation ist unvollständig."
            )
            return
        }

        publishUpdateState(
            "installing",
            latest: latestKnownVersion,
            message: "Update wird vorbereitet · die vorhandene App bleibt bis zur erfolgreichen Prüfung erhalten."
        )

        let logURL = updateLogURL()
        let fm = FileManager.default
        if !fm.fileExists(atPath: logURL.path) {
            fm.createFile(atPath: logURL.path, contents: nil)
        }
        let logHandle = FileHandle(forWritingAtPath: logURL.path)
        try? logHandle?.seekToEnd()

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/bash")
        process.arguments = [helper.path]
        process.standardOutput = logHandle ?? FileHandle.nullDevice
        process.standardError = logHandle ?? FileHandle.nullDevice
        process.terminationHandler = { [weak self] p in
            try? logHandle?.close()
            guard p.terminationStatus != 0 else { return }
            let code = p.terminationStatus
            self?.publishUpdateState(
                "error",
                message: "Update-Helper beendet mit Code \(code). Öffne „Update-Protokoll“ für die genaue Ursache."
            )
        }
        do {
            try process.run()
        } catch {
            try? logHandle?.close()
            publishUpdateState("error", message: "Updater konnte nicht gestartet werden: \(error.localizedDescription)")
        }
    }

    private func outputDeviceIDs() -> [AudioDeviceID] {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDevices,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var dataSize: UInt32 = 0
        guard AudioObjectGetPropertyDataSize(
            AudioObjectID(kAudioObjectSystemObject),
            &address,
            0,
            nil,
            &dataSize
        ) == noErr else { return [] }

        let count = Int(dataSize) / MemoryLayout<AudioDeviceID>.size
        guard count > 0 else { return [] }
        var devices = [AudioDeviceID](repeating: 0, count: count)
        let status = devices.withUnsafeMutableBufferPointer { buffer -> OSStatus in
            guard let base = buffer.baseAddress else { return OSStatus(kAudio_ParamError) }
            return AudioObjectGetPropertyData(
                AudioObjectID(kAudioObjectSystemObject),
                &address,
                0,
                nil,
                &dataSize,
                base
            )
        }
        guard status == noErr else { return [] }
        return devices.filter { hasOutputStreams($0) }
    }

    private func hasOutputStreams(_ deviceID: AudioDeviceID) -> Bool {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioDevicePropertyStreams,
            mScope: kAudioDevicePropertyScopeOutput,
            mElement: kAudioObjectPropertyElementMain
        )
        var size: UInt32 = 0
        return AudioObjectGetPropertyDataSize(deviceID, &address, 0, nil, &size) == noErr &&
            size >= UInt32(MemoryLayout<AudioStreamID>.size)
    }

    private func audioDeviceName(_ deviceID: AudioDeviceID) -> String {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioObjectPropertyName,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var name: CFString = "Audio-Gerät" as CFString
        var size = UInt32(MemoryLayout<CFString>.size)
        let status = AudioObjectGetPropertyData(deviceID, &address, 0, nil, &size, &name)
        return status == noErr ? (name as String) : "Audio-Gerät"
    }

    private func defaultOutputDeviceID() -> AudioDeviceID? {
        var address = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultOutputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var deviceID = AudioDeviceID(0)
        var size = UInt32(MemoryLayout<AudioDeviceID>.size)
        let status = AudioObjectGetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &address,
            0,
            nil,
            &size,
            &deviceID
        )
        return status == noErr && deviceID != 0 ? deviceID : nil
    }

    @discardableResult
    private func setDefaultOutputDevice(_ deviceID: AudioDeviceID) -> Bool {
        var output = deviceID
        var outputAddress = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultOutputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        let size = UInt32(MemoryLayout<AudioDeviceID>.size)
        let outputStatus = AudioObjectSetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &outputAddress,
            0,
            nil,
            size,
            &output
        )

        var system = deviceID
        var systemAddress = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultSystemOutputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        _ = AudioObjectSetPropertyData(
            AudioObjectID(kAudioObjectSystemObject),
            &systemAddress,
            0,
            nil,
            size,
            &system
        )
        return outputStatus == noErr
    }

    private func javascriptStringLiteral(_ value: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              let json = String(data: data, encoding: .utf8),
              json.count >= 2 else {
            return "\"Audio-Ausgabe\""
        }
        return String(json.dropFirst().dropLast())
    }

    private func publishCurrentAudioOutput(_ explicitName: String? = nil) {
        let name = explicitName ?? defaultOutputDeviceID().map(audioDeviceName) ?? "Systemausgabe"
        let literal = javascriptStringLiteral(name)
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(
                "window.darAudioOutputChanged && window.darAudioOutputChanged(\(literal));",
                completionHandler: nil
            )
        }
    }

    @objc private func showAudioOutputMenu(_ sender: Any?) {
        let devices = outputDeviceIDs()
        let current = defaultOutputDeviceID()
        let menu = NSMenu(title: "Audio-Ausgabe")

        if devices.isEmpty {
            let empty = NSMenuItem(
                title: "Keine verfügbaren Audio-Ausgänge gefunden",
                action: nil,
                keyEquivalent: ""
            )
            empty.isEnabled = false
            menu.addItem(empty)
        } else {
            let sorted = devices.sorted { left, right in
                if left == current && right != current { return true }
                if right == current && left != current { return false }
                return audioDeviceName(left).localizedCaseInsensitiveCompare(audioDeviceName(right)) == .orderedAscending
            }
            for device in sorted {
                let item = NSMenuItem(
                    title: audioDeviceName(device),
                    action: #selector(selectAudioOutput(_:)),
                    keyEquivalent: ""
                )
                item.target = self
                item.representedObject = NSNumber(value: device)
                item.state = device == current ? .on : .off
                menu.addItem(item)
            }
        }

        menu.addItem(.separator())
        let settings = NSMenuItem(
            title: "Toneinstellungen öffnen…",
            action: #selector(openSoundSettings(_:)),
            keyEquivalent: ""
        )
        settings.target = self
        menu.addItem(settings)

        menu.popUp(positioning: nil, at: NSEvent.mouseLocation, in: nil)
    }

    @objc private func selectAudioOutput(_ sender: NSMenuItem) {
        guard let number = sender.representedObject as? NSNumber else { return }
        let deviceID = AudioDeviceID(number.uint32Value)
        let name = audioDeviceName(deviceID)
        if setDefaultOutputDevice(deviceID) {
            publishCurrentAudioOutput(name)
        } else {
            let alert = NSAlert()
            alert.messageText = "Audio-Ausgabe konnte nicht gewechselt werden"
            alert.informativeText = "Bitte prüfe, ob das Gerät verbunden ist, und versuche es erneut."
            alert.alertStyle = .warning
            alert.runModal()
        }
    }

    @objc private func openSoundSettings(_ sender: Any?) {
        if let url = URL(string: "x-apple.systempreferences:com.apple.Sound-Settings.extension") {
            NSWorkspace.shared.open(url)
        }
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        if message.name == "darAudioOutput" {
            DispatchQueue.main.async { [weak self] in
                self?.showAudioOutputMenu(nil)
            }
            return
        }

        if message.name == "darUpdater" {
            let body = message.body as? [String: Any]
            let action = String(describing: body?["action"] ?? "check")
            if action == "install" {
                installAvailableUpdate()
            } else {
                checkForUpdates(userInitiated: true)
            }
        }

        if message.name == "darCompanion" {
            DispatchQueue.main.async { [weak self] in
                self?.showCompanionPairing(nil)
            }
        }
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

    private func healthMatchesCurrentEngine(data: Data?, response: URLResponse?, error: Error?) -> Bool {
        guard error == nil,
              (response as? HTTPURLResponse)?.statusCode == 200,
              let data = data,
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let version = object["engine_version"] as? String else {
            return false
        }
        return version == currentVersion
    }

    private func stopStaleInstalledEngine() {
        let home = FileManager.default.homeDirectoryForCurrentUser
        let target = home.appendingPathComponent("Applications/DAR-Voice-Studio/local-engine.py").path
        let uid = getuid()

        func run(_ executable: String, _ arguments: [String]) {
            let p = Process()
            p.executableURL = URL(fileURLWithPath: executable)
            p.arguments = arguments
            p.standardOutput = FileHandle.nullDevice
            p.standardError = FileHandle.nullDevice
            try? p.run()
            p.waitUntilExit()
        }

        run("/bin/launchctl", ["bootout", "gui/\(uid)/com.daraltawhid.voice-engine"])
        run("/usr/bin/pkill", ["-TERM", "-f", target])
        usleep(350_000)
        run("/usr/bin/pkill", ["-KILL", "-f", target])
    }

    private func ensureEngine() {
        // 2.9.68 Stabilitätsmodus: Wenn der Bundle-Launcher die Engine besitzt,
        // bleibt die native WKWebView-App vollständig passiv. Dadurch gibt es
        // keinen zweiten Prozessmanager, der dieselbe Engine beendet/neustartet.
        if externalEngineOwner { return }

        var request = URLRequest(url: healthURL)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 1.0

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            if self.healthMatchesCurrentEngine(data: data, response: response, error: error) {
                return
            }

            // HTTP 200 von einer alten Engine ist kein gesunder Zustand.
            // Sie muss vollständig beendet werden, sonst belegt sie Port 8787
            // und die neue Engine kann nie starten.
            DispatchQueue.global(qos: .userInitiated).async {
                self.stopStaleInstalledEngine()
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
            let pairFile = target.appendingPathComponent("ipad-pairing-token.txt")
            if let rawPair = try? String(contentsOf: pairFile, encoding: .utf8) {
                let pair = rawPair.trimmingCharacters(in: .whitespacesAndNewlines)
                if !pair.isEmpty {
                    env["DAR_VOICE_NETWORK_MODE"] = "1"
                    env["DAR_VOICE_PAIR_TOKEN"] = pair
                }
            }
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
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
        :root{color-scheme:dark}
        *{box-sizing:border-box}
        html,body{margin:0;height:100%;background:#06131f;color:#f6f0e4;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}
        body{display:grid;place-items:center;overflow:hidden;background:
          radial-gradient(circle at 50% 34%,rgba(25,104,150,.24),transparent 35rem),
          radial-gradient(circle at 50% 88%,rgba(217,182,111,.10),transparent 28rem),
          linear-gradient(145deg,#041019,#071d2a 52%,#092735)}
        .box{width:min(520px,82vw);text-align:center;animation:appear .28s ease-out}
        .logo-shell{width:184px;height:184px;margin:0 auto 23px;border-radius:42px;padding:5px;background:linear-gradient(145deg,#f2d58e,#6c4614);box-shadow:0 26px 70px rgba(0,0,0,.42),0 0 0 1px rgba(244,216,150,.22)}
        .logo-shell img{width:100%;height:100%;object-fit:contain;border-radius:38px;display:block;background:#06131f}
        .brand{font-family:Georgia,serif;letter-spacing:.12em;color:#efd89d;font-weight:700;font-size:22px}
        .studio{margin-top:7px;font-size:12px;font-weight:800;letter-spacing:.28em;color:#c4d0d5}
        .status{margin-top:25px;color:#9fb0b8;font-size:12px;min-height:18px}
        .progress{height:5px;margin:14px auto 0;border-radius:99px;background:rgba(255,255,255,.09);overflow:hidden}
        .progress>i{display:block;width:8%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c99d4b,#f1d897,#8bb9cf);transition:width .32s cubic-bezier(.2,.8,.2,1)}
        .percent{margin-top:9px;color:#d8c18a;font-size:10px;font-weight:850;letter-spacing:.08em}
        @keyframes appear{from{opacity:0;transform:translateY(7px) scale(.985)}to{opacity:1;transform:none}}
        </style></head><body><div class="box">
          <div class="logo-shell"><img src="VoiceStudioIcon.png" alt="DĀR AL TAWḤĪD Voice Studio"></div>
          <div class="brand">DĀR AL TAWḤĪD</div>
          <div class="studio">VOICE STUDIO</div>
          <div id="status" class="status">Studio wird vorbereitet …</div>
          <div class="progress"><i id="bar"></i></div>
          <div id="percent" class="percent">8 %</div>
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: Bundle.main.resourceURL)
    }

    private func updateLoadingProgress(_ percent: Int, status: String) {
        let value = max(0, min(100, percent))
        let statusJS = javascriptStringLiteral(status)
        let js = """
        (() => {
          const bar=document.getElementById('bar');
          const pct=document.getElementById('percent');
          const status=document.getElementById('status');
          if(bar)bar.style.width='\(value)%';
          if(pct)pct.textContent='\(value) %';
          if(status)status.textContent=\(statusJS);
        })();
        """
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func waitForEngine(attempt: Int) {
        // Der Balken zeigt ausschließlich den Start-/Verbindungszustand.
        // Modell-Warmup und Aussprachebibliothek laufen im Engine-Prozess
        // separat und dürfen den sichtbaren App-Start nicht blockieren.
        let progress = min(92, 12 + min(attempt, 80))
        let phase: String
        if attempt < 3 {
            phase = "Serhat Engine wird verbunden …"
        } else if attempt < 12 {
            phase = "Engine-Version und lokale Voice-Dienste werden geprüft …"
        } else if attempt < 32 {
            phase = "Serhat Engine startet …"
        } else {
            phase = "Engine wird automatisch neu verbunden …"
        }
        updateLoadingProgress(progress, status: phase)

        var request = URLRequest(url: healthURL)
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 1.5

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            let ok = self.healthMatchesCurrentEngine(data: data, response: response, error: error)
            if ok {
                self.updateLoadingProgress(100, status: "Bereit")
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.24) {
                    self.webView.load(URLRequest(
                        url: self.studioURL,
                        cachePolicy: .reloadIgnoringLocalCacheData
                    ))
                }
                return
            }

            // Falls LaunchAgent oder Direktstart beendet wurde, nicht 40+ Sekunden
            // blind weiterzählen: kontrolliert erneut prüfen/starten.
            if attempt == 12 || attempt == 30 || attempt == 50 {
                self.ensureEngine()
            }

            if attempt < 80 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
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

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        publishCurrentAudioOutput()
        if webView.url?.host == "127.0.0.1" || webView.url?.host == "localhost" {
            publishUpdateState("checking", message: "")
            checkForUpdates()
        }
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
        if !externalEngineOwner, let p = engineProcess, p.isRunning {
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