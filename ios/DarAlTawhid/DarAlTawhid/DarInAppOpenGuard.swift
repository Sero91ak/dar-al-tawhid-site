import UIKit
import ObjectiveC

/// Stops OneSignal and any other code from opening dar-al-tawhid.de in Safari.
enum DarInAppOpenGuard {
    private static var installed = false

    static func install() {
        guard !installed else { return }
        installed = true
        let cls: AnyClass = UIApplication.self
        let originalSelector = #selector(UIApplication.open(_:options:completionHandler:))
        let swizzledSelector = #selector(UIApplication.dar_keepInApp_open(_:options:completionHandler:))
        guard
            let original = class_getInstanceMethod(cls, originalSelector),
            let swizzled = class_getInstanceMethod(cls, swizzledSelector)
        else { return }
        method_exchangeImplementations(original, swizzled)
    }
}

extension UIApplication {
    @objc func dar_keepInApp_open(
        _ url: URL,
        options: [UIApplication.OpenExternalURLOptionsKey: Any],
        completionHandler: ((Bool) -> Void)?
    ) {
        if DarAppShell.isOwnHost(url) {
            DarPushNotifications.openFromNotification(userInfo: [
                "type": "",
                "postId": DarAppShell.postId(from: DarAppShell.sourceURL(from: url) ?? url),
                "url": url.absoluteString
            ])
            completionHandler?(true)
            return
        }
        dar_keepInApp_open(url, options: options, completionHandler: completionHandler)
    }
}
