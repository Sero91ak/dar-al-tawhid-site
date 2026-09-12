import CoreLocation
import CoreMotion
import Foundation
import WebKit

final class DarNativePermissions: NSObject, CLLocationManagerDelegate {
    static let shared = DarNativePermissions()

    private let locationManager = CLLocationManager()
    private let motionManager = CMMotionManager()
    private weak var webView: WKWebView?
    private var pendingGeoDecisions: [(WKPermissionDecision) -> Void] = []

    func attach(webView: WKWebView) {
        self.webView = webView
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func handleWebMessage(_ body: Any) {
        guard let dict = body as? [String: Any], let type = dict["type"] as? String else { return }
        switch type {
        case "geolocation", "location", "qibla", "prayer":
            requestLocationIfNeeded()
        case "notifications", "push":
            DarPushNotifications.requestAuthorization()
        case "motion", "qibla-compass":
            warmUpMotion()
        default:
            break
        }
    }

    func decideGeolocation(_ decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
            decisionHandler(.grant)
        case .denied, .restricted:
            decisionHandler(.deny)
        case .notDetermined:
            pendingGeoDecisions.append(decisionHandler)
            locationManager.requestWhenInUseAuthorization()
        @unknown default:
            decisionHandler(.deny)
        }
    }

    func requestLocationIfNeeded() {
        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
        default:
            break
        }
        warmUpMotion()
    }

    func warmUpMotion() {
        guard motionManager.isDeviceMotionAvailable else { return }
        motionManager.deviceMotionUpdateInterval = 0.2
        motionManager.startDeviceMotionUpdates(using: .xMagneticNorthZVertical)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            self?.motionManager.stopDeviceMotionUpdates()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
            flushGeoDecisions(.grant)
        case .denied, .restricted:
            flushGeoDecisions(.deny)
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        let js = """
        window.__darNativeLocation={lat:\(loc.coordinate.latitude),lng:\(loc.coordinate.longitude),acc:\(loc.horizontalAccuracy)};
        window.dispatchEvent(new CustomEvent('dar-native-location',{detail:window.__darNativeLocation}));
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    private func flushGeoDecisions(_ decision: WKPermissionDecision) {
        let handlers = pendingGeoDecisions
        pendingGeoDecisions.removeAll()
        handlers.forEach { $0(decision) }
    }
}
