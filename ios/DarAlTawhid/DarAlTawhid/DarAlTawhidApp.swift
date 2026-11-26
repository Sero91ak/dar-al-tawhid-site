import SwiftUI
import UIKit
import WebKit
import WidgetKit

final class DarAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        DarInAppOpenGuard.install()
        DarPushNotifications.bootstrap(launchOptions: launchOptions)
        if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem,
           let destination = shortcutDestination(for: shortcut.type) {
            DarQuickActions.set(destination)
            return false
        }
        return true
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard let destination = shortcutDestination(for: shortcutItem.type) else {
            completionHandler(false)
            return
        }
        DarQuickActions.set(destination)
        NotificationCenter.default.post(
            name: .darOpenShortcut,
            object: nil,
            userInfo: ["destination": destination.rawValue]
        )
        completionHandler(true)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        DarPushNotifications.didRegister(deviceToken: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    private func shortcutDestination(for type: String) -> DarDeepLink.Destination? {
        switch type.lowercased().split(separator: ".").last.map(String.init) {
        case "prayer": return .prayer
        case "qibla": return .qibla
        case "quran": return .quran
        case "duas", "dua": return .duas
        default: return nil
        }
    }
}

extension Notification.Name {
    static let darOpenShortcut = Notification.Name("darOpenShortcut")
}

@main
struct DarAlTawhidApp: App {
    @UIApplicationDelegateAdaptor(DarAppDelegate.self) private var appDelegate
    @StateObject private var router = DarAppRouter()
    @StateObject private var localeBridge = DarNativeLocaleBridge()

    init() {
        let ink = DarWidgetStore.load().inkHex.trimmingCharacters(in: .whitespacesAndNewlines)
        let bootInk: UIColor
        if ink.hasPrefix("#"), ink.count == 7, let value = Int(ink.dropFirst(), radix: 16) {
            bootInk = UIColor(
                red: CGFloat((value >> 16) & 0xFF) / 255.0,
                green: CGFloat((value >> 8) & 0xFF) / 255.0,
                blue: CGFloat(value & 0xFF) / 255.0,
                alpha: 1.0
            )
        } else {
            bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        }
        UIWindow.appearance().backgroundColor = bootInk
        let snap = DarDailyContent.refresh(DarWidgetStore.load())
        DarWidgetStore.save(snap)
        Task.detached {
            let live = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
            DarWidgetStore.save(live)
            await MainActor.run {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ZStack {
                WebAppView(destination: router.destination, openURL: router.webURL, openNonce: router.openNonce)
                    .ignoresSafeArea()
                DarNativeLanguageHost(bridge: localeBridge)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .ignoresSafeArea()
            }
            .background(Color(uiColor: WebAppView.Coordinator.storedSurfaceColor()))
            .onOpenURL { url in
                router.open(url)
            }
            .onAppear {
                router.openPendingQuickAction()
                localeBridge.start()
            }
            .onReceive(NotificationCenter.default.publisher(for: .darOpenShortcut)) { note in
                guard let raw = note.userInfo?["destination"] as? String,
                      let destination = DarDeepLink.Destination(rawValue: raw) else { return }
                router.openShortcut(destination)
            }
            .onReceive(NotificationCenter.default.publisher(for: .darOpenPush)) { note in
                let info = note.userInfo ?? [:]
                router.openPush(
                    type: String(describing: info["type"] ?? ""),
                    postId: String(describing: info["postId"] ?? ""),
                    url: String(describing: info["url"] ?? "")
                )
            }
            .sheet(isPresented: $localeBridge.sheetPresented) {
                DarNativeLanguageSheet(bridge: localeBridge)
                    .environment(\.layoutDirection, localeBridge.isRTL ? .rightToLeft : .leftToRight)
            }
        }
        #if os(macOS) || targetEnvironment(macCatalyst)
        .defaultSize(width: 1100, height: 780)
        #endif
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}

/// Native globe for the adult TestFlight shell.
/// The committed Xcode target has no separate brand-header view; the visible
/// rail is the web header inside the WKWebView. This control occupies the
/// language slot immediately before the profile button and writes the same
/// `darAdultPreferredLocaleV1` key the website already uses.
final class DarNativeLocaleBridge: ObservableObject {
    struct Choice: Identifiable {
        let code: String
        let name: String
        let rtl: Bool
        var id: String { code }
    }

    struct Snapshot {
        var ready: Bool
        var kids: Bool
        var code: String
        var hasWebLanguage: Bool
        var language: CGRect?
    }

    static let choices: [Choice] = [
        Choice(code: "de", name: "Deutsch", rtl: false),
        Choice(code: "ar", name: "العربية", rtl: true),
        Choice(code: "en", name: "English", rtl: false),
        Choice(code: "tr", name: "Türkçe", rtl: false),
        Choice(code: "ku", name: "Kurmancî", rtl: false),
        Choice(code: "ckb", name: "سۆرانی", rtl: true),
        Choice(code: "bs", name: "Bosanski", rtl: false),
        Choice(code: "fr", name: "Français", rtl: false),
        Choice(code: "es", name: "Español", rtl: false)
    ]

    private static let allowed = Set(choices.map(\.code))
    private static let copy: [String: (language: String, choose: String, close: String)] = [
        "de": ("Sprache", "Sprache wählen", "Schließen"),
        "ar": ("اللغة", "اختر اللغة", "إغلاق"),
        "en": ("Language", "Choose language", "Close"),
        "tr": ("Dil", "Dil seçin", "Kapat"),
        "ku": ("Ziman", "Ziman hilbijêre", "Bigire"),
        "ckb": ("زمان", "زمان هەڵبژێرە", "داخستن"),
        "bs": ("Jezik", "Odaberite jezik", "Zatvori"),
        "fr": ("Langue", "Choisir la langue", "Fermer"),
        "es": ("Idioma", "Elegir idioma", "Cerrar")
    ]

    @Published var code = "de"
    @Published var sheetPresented = false
    var onSnapshot: ((Snapshot) -> Void)?
    private var timer: Timer?
    private weak var webView: WKWebView?

    var isRTL: Bool { code == "ar" || code == "ckb" }
    var chooseTitle: String { Self.copy[code]?.choose ?? Self.copy["de"]!.choose }
    var closeTitle: String { Self.copy[code]?.close ?? "Schließen" }
    var accessibilityLabel: String {
        let pack = Self.copy[code] ?? Self.copy["de"]!
        let name = Self.choices.first { $0.code == code }?.name ?? "Deutsch"
        return "\(pack.language): \(name). \(pack.choose)"
    }

    func start() {
        probe()
        guard timer == nil else { return }
        let timer = Timer(timeInterval: 1.2, repeats: true) { [weak self] _ in
            self?.probe()
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    func choose(_ raw: String) {
        let next = raw.lowercased()
        guard Self.allowed.contains(next) else { return }
        code = next
        sheetPresented = false
        guard let webView = locateWebView() else { return }
        let js = """
        (function(){
          var code="\(next)";
          var known={de:1,ar:1,en:1,tr:1,ku:1,ckb:1,bs:1,fr:1,es:1};
          if(!known[code]) return false;
          try{localStorage.setItem("darAdultPreferredLocaleV1", code)}catch(e){}
          if(window.DARAdultUI18n&&typeof window.DARAdultUI18n.setLocale==="function"){
            return window.DARAdultUI18n.setLocale(code)===true;
          }
          document.documentElement.lang=code;
          document.documentElement.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
          try{document.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));}catch(e){}
          return true;
        })()
        """
        webView.evaluateJavaScript(js) { _, _ in
            DispatchQueue.main.async {
                self.probe()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { self.probe() }
            }
        }
    }

    private func probe() {
        guard let webView = locateWebView() else {
            onSnapshot?(Snapshot(ready: false, kids: false, code: code, hasWebLanguage: false, language: nil))
            return
        }
        webView.evaluateJavaScript(Self.probeScript) { [weak self] result, _ in
            DispatchQueue.main.async {
                self?.applyProbe(result)
            }
        }
    }

    private func applyProbe(_ result: Any?) {
        let dict = Self.dictionary(result) ?? [:]
        let kids = Self.flag(dict["kids"])
        let ready = Self.flag(dict["ready"])
        let next = String(describing: dict["code"] ?? code).lowercased()
        let resolved = Self.allowed.contains(next) ? next : code
        if resolved != code { code = resolved }
        let hasWeb = Self.flag(dict["hasWebLanguage"])
        let frame = Self.box(dict["language"])
        if ready, hasWeb, frame != nil {
            webView?.evaluateJavaScript(Self.hideWebLanguageScript, completionHandler: nil)
        }
        onSnapshot?(Snapshot(ready: ready, kids: kids, code: resolved, hasWebLanguage: hasWeb, language: frame))
    }

    private func locateWebView() -> WKWebView? {
        if let webView, webView.window != nil { return webView }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let windows = scenes.flatMap(\.windows)
        let ordered = windows.sorted { lhs, rhs in
            if lhs.isKeyWindow != rhs.isKeyWindow { return lhs.isKeyWindow && !rhs.isKeyWindow }
            return false
        }
        var best: WKWebView?
        var bestArea: CGFloat = 0
        for window in ordered {
            func walk(_ view: UIView) {
                if let web = view as? WKWebView {
                    let area = web.bounds.width * web.bounds.height
                    if area > bestArea {
                        best = web
                        bestArea = area
                    }
                }
                view.subviews.forEach(walk)
            }
            walk(window)
        }
        webView = best
        return best
    }

    private static func flag(_ value: Any?) -> Bool {
        if let value = value as? Bool { return value }
        if let value = value as? NSNumber { return value.boolValue }
        return false
    }

    private static func dictionary(_ value: Any?) -> [String: Any]? {
        if let dict = value as? [String: Any] { return dict }
        guard let dict = value as? NSDictionary else { return nil }
        var out: [String: Any] = [:]
        for (key, val) in dict {
            if let key = key as? String { out[key] = val }
        }
        return out
    }

    private static func box(_ value: Any?) -> CGRect? {
        guard let dict = dictionary(value) else { return nil }
        func num(_ key: String) -> CGFloat? {
            if let number = dict[key] as? NSNumber { return CGFloat(truncating: number) }
            if let number = dict[key] as? Double { return CGFloat(number) }
            return nil
        }
        guard let x = num("x"), let y = num("y"), let w = num("w"), let h = num("h"), w >= 8, h >= 8 else { return nil }
        return CGRect(x: x, y: y, width: w, height: h)
    }

    private static let probeScript = """
    (function(){
      try{
        var path=String(location.pathname||"");
        if(/\\/kids(?:\\/|$)/.test(path)) return {ready:false,kids:true};
        var header=document.getElementById("darAdultBrandHeaderV2");
        if(!header) return {ready:false};
        var rtl=document.documentElement.getAttribute("dir")==="rtl";
        var known={de:1,ar:1,en:1,tr:1,ku:1,ckb:1,bs:1,fr:1,es:1};
        var code="";
        try{
          var params=new URLSearchParams(location.search||"");
          code=String(params.get("lang")||params.get("locale")||"").toLowerCase();
        }catch(e){}
        if(!known[code]) code="";
        if(!code){
          try{code=String(localStorage.getItem("darAdultPreferredLocaleV1")||"").toLowerCase()}catch(e){}
        }
        if(!known[code]) code="de";
        function box(el){
          if(!el) return null;
          var r=el.getBoundingClientRect();
          if(r.width<8||r.height<8) return null;
          return {x:r.x,y:r.y,w:r.width,h:r.height};
        }
        var profile=document.getElementById("darVisitorProfileButtonV1");
        var lang=document.getElementById("darVisitorLanguageButtonV1");
        var language=box(lang);
        var profileBox=box(profile);
        if(!language && profileBox){
          var gap=6;
          language=rtl
            ? {x:profileBox.x+profileBox.w+gap,y:profileBox.y,w:profileBox.w,h:profileBox.h}
            : {x:profileBox.x-gap-profileBox.w,y:profileBox.y,w:profileBox.w,h:profileBox.h};
        }
        if(!language){
          var top=8;
          try{
            var probe=document.createElement("div");
            probe.style.cssText="position:fixed;top:0;padding-top:env(safe-area-inset-top);visibility:hidden";
            document.body.appendChild(probe);
            top=(probe.getBoundingClientRect().height||0)+8;
            probe.remove();
          }catch(e){}
          var size=42,gap=6,edge=12;
          language=rtl
            ? {x:edge+size+gap+size+gap,y:top,w:size,h:size}
            : {x:Math.max(edge,window.innerWidth-edge-(size*3)-(gap*2)),y:top,w:size,h:size};
        }
        return {ready:true,code:code,rtl:rtl,language:language,hasWebLanguage:!!lang&&!!box(lang)};
      }catch(e){
        return {ready:false};
      }
    })()
    """

    private static let hideWebLanguageScript = """
    (function(){
      var id="dar-native-language-hide-v1";
      if(document.getElementById(id)) return;
      var css=document.createElement("style");
      css.id=id;
      css.textContent="html.dar-ios-native-app #darAdultBrandHeaderV2 #darVisitorLanguageButtonV1{opacity:0!important;pointer-events:none!important}";
      (document.head||document.documentElement).appendChild(css);
    })()
    """
}

struct DarNativeLanguageSheet: View {
    @ObservedObject var bridge: DarNativeLocaleBridge

    var body: some View {
        NavigationStack {
            List(DarNativeLocaleBridge.choices) { item in
                Button {
                    bridge.choose(item.code)
                } label: {
                    HStack(spacing: 12) {
                        Text(item.name)
                            .font(.body.weight(item.code == bridge.code ? .semibold : .regular))
                            .foregroundStyle(.primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        if item.code == bridge.code {
                            Image(systemName: "checkmark")
                                .foregroundStyle(Color(red: 0.73, green: 0.60, blue: 0.35))
                                .accessibilityHidden(true)
                        }
                    }
                    .padding(.vertical, 6)
                }
                .accessibilityAddTraits(item.code == bridge.code ? .isSelected : [])
                .listRowBackground(
                    item.code == bridge.code
                    ? Color(red: 0.73, green: 0.60, blue: 0.35).opacity(0.16)
                    : Color.clear
                )
            }
            .navigationTitle(bridge.chooseTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(bridge.closeTitle) { bridge.sheetPresented = false }
                }
            }
        }
        .environment(\.layoutDirection, bridge.isRTL ? .rightToLeft : .leftToRight)
    }
}

struct DarNativeLanguageHost: UIViewRepresentable {
    @ObservedObject var bridge: DarNativeLocaleBridge

    func makeUIView(context: Context) -> DarNativeLanguageButtonHost {
        let host = DarNativeLanguageButtonHost()
        host.bridge = bridge
        bridge.onSnapshot = { [weak host] snapshot in
            host?.apply(snapshot)
        }
        bridge.start()
        return host
    }

    func updateUIView(_ uiView: DarNativeLanguageButtonHost, context: Context) {
        uiView.bridge = bridge
        uiView.refreshLabel()
    }
}

final class DarNativeLanguageButtonHost: UIView {
    weak var bridge: DarNativeLocaleBridge?
    private let button = UIButton(type: .custom)

    override init(frame: CGRect) {
        super.init(frame: frame)
        isOpaque = false
        backgroundColor = .clear
        var config = UIButton.Configuration.plain()
        config.image = Self.globeImage
        config.imagePadding = 0
        config.contentInsets = NSDirectionalEdgeInsets(top: 7, leading: 7, bottom: 7, trailing: 7)
        config.background.backgroundColor = UIColor.secondarySystemBackground.withAlphaComponent(0.94)
        config.background.cornerRadius = 14
        config.background.strokeColor = UIColor.separator
        config.background.strokeWidth = 1
        button.configuration = config
        button.accessibilityIdentifier = "darNativeLanguageButton"
        button.isHidden = true
        button.addTarget(self, action: #selector(openLanguages), for: .touchUpInside)
        addSubview(button)
    }

    required init?(coder: NSCoder) { nil }

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        return hit === self ? nil : hit
    }

    func refreshLabel() {
        button.accessibilityLabel = bridge?.accessibilityLabel
    }

    func apply(_ snapshot: DarNativeLocaleBridge.Snapshot) {
        refreshLabel()
        guard bounds.width > 40, bounds.height > 40 else {
            button.isHidden = true
            return
        }
        guard snapshot.ready, !snapshot.kids, let webFrame = snapshot.language, let webView = largestWebView() else {
            button.isHidden = true
            placed = false
            return
        }
        let origin = webView.convert(webFrame.origin, to: self)
        var frame = CGRect(origin: origin, size: webFrame.size)
        let limit = bounds.insetBy(dx: 4, dy: 0)
        if frame.maxX > limit.maxX { frame.origin.x = limit.maxX - frame.width }
        if frame.minX < limit.minX { frame.origin.x = limit.minX }
        if frame.width < 8 || frame.height < 8 || frame.maxY < 0 || frame.minY > bounds.height {
            button.isHidden = true
            return
        }
        button.frame = frame.integral
        button.isHidden = false
    }

    @objc private func openLanguages() {
        bridge?.sheetPresented = true
    }

    private func largestWebView() -> WKWebView? {
        guard let root = window else { return nil }
        var best: WKWebView?
        var bestArea: CGFloat = 0
        func walk(_ view: UIView) {
            if let web = view as? WKWebView {
                let area = web.bounds.width * web.bounds.height
                if area > bestArea {
                    best = web
                    bestArea = area
                }
            }
            view.subviews.forEach(walk)
        }
        walk(root)
        return best
    }

    private static let globeImage: UIImage = {
        let raw = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAASFBMVEUAAACujF5rTyhWMBTLomuRYS/TtYzny6SWc0twbEtnJBJrYhU3FQZuSSlraGeWZiyVZzBxSyelbC/25MZSLA1XMhSrXVavoVQx8IBTAAAAGHRSTlMA/Pr3+/r8/Pv7EQn1XwZhnKIW/KRcCQu495GeAAAEC0lEQVR42qVWAXKjMAy0bMvIdgiBQPr/n95KhiYzFxpoPdcmR9F6tSvJdu7gmtyf1uRu7vH78EfxkYqrf2AQOJTy+yzKwBwQ/nUy7muaEPJVrzMTM9/w6Hoi79fthEIAhDtO4nWnceTISw8AimeUdxRTZyuS8OzcjWKMx32PCL/fO/vpEgnID9EQPmahdkfd+d6RZJeco+yFCG7ELsavT/Wg6a8bIypvy+c8Kq94YH9pu7tE6QkACO/BIbrhUxKSlMCdiIWRQ85kvwGQCTowfxLB0qd1RcoEQMoiYAAhblpR+30F8GQJSLx3joQQmlLqEpIXZk+usFJ47Ar4iCuBDjbCPYqiwSo/FmeqRuGHLAwA1B05COGQPwA0CwOgjcKugyDdJcGOMJ8Qh98oxKzGAACiyAMUhp0BhcwIDMjokohAQq86wgljgLqAET/loPVvOePlCAEi+ZyioIqE9VnCfzSHaaeGCt7o4L/GNh5OzeucVgEeKQBVA3hfzwsDIHoGe90e2ifxTN1dUALoBziaqL95iPDOyOJGUdOFve5reZiSsDVDWgY7MBgG74e3DCrKzDbBW94zo5eAY0MhwRyYaAA3A5jemgCHNF4rgYHASoUbgpoD/ugvBbjtAIwsTwAsIc+xjSWkQPhHcQWo7zVYUwBfjccQ5HWsYWUtCqxxV4MCFyCdISSlDxme8VqUMMdLbwDlrYiLVosB6EEAAOpWBDMQGUBW2LgjIkBxBrIhCJuGAEhbvJqDKeMnH/z0lgGayeMF05GaBdrNLVZ/dL7LOOls2zkDXU+ovIjXowFQ9NJtAIjXZ5rB+J6AQoh2grU+XpbO+0YA9iWNZ7DHT90b7Q/Xq9WqJF4D+1b+GkptpoVl0Ax2D9latIDJxkEDWuOBAAF8mFXCfv9suYKCtHHcZkL7YGsMFEGopsD1pzN1Q3guE7/FF8T7sivhVs/+PwyxIgxusASmD+d670PwCrLh6HyBgaE4SDv+uP+GgIU7iXwvLap5unmNfxy4nhRAcFAebSjg67wMbPFHVm0Xu5eFcN3+YHzrbB8usy43L0s/tOHUH72mobFRbrb36GakYpn0Z27MIfLFADiqFCDfF3f8sqsMwuLKMgemMCOJ9eQ7c71thuB+GcrLg5N35OIMoJb6m+AKxUuIMfTnLskvteD6gCHpQ389DWER/eiDXkrgwlkIHPTLmLWWcVSTuplzX88IqQ35vbbvYz1K4jpa/wS0ocY7aTh+vB7iUOpsJcisw8xOSGodGUI9gFDdrANFRwptZ7T4LZkjDOqlVT8Cs316/VyVKAcolMtF+0gJiMVjoloK+nw50FAKcGkStl29fbnYKsesXCm8emkAZ2pxfvrf4s+38pk/vHmzHgz+B0+QLEhfBOTPAAAAAElFTkSuQmCC"
        if let data = Data(base64Encoded: raw), let image = UIImage(data: data) {
            return image.withRenderingMode(.alwaysOriginal)
        }
        return UIImage(systemName: "globe") ?? UIImage()
    }()
}
