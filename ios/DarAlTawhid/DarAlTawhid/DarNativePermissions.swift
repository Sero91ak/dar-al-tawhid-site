import CoreLocation
import CoreMotion
import Foundation
import UIKit
import WebKit
import WidgetKit

final class DarNativePermissions: NSObject, CLLocationManagerDelegate {
    static let shared = DarNativePermissions()

    private let locationManager = CLLocationManager()
    private let motionManager = CMMotionManager()
    private weak var webView: WKWebView?
    private var pendingGeoDecisions: [(WKPermissionDecision) -> Void] = []
    private var liveQibla = false
    private var trackingRegularly = false
    private var observingLifecycle = false
    private var mostRecentLocation: CLLocation?
    private let backgroundPreferenceKey = "dar.ios.location.background.optin"

    private var backgroundOptIn: Bool {
        UserDefaults.standard.bool(forKey: backgroundPreferenceKey)
    }

    func attach(webView: WKWebView) {
        self.webView = webView
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.distanceFilter = 500
        locationManager.pausesLocationUpdatesAutomatically = true
        if !observingLifecycle {
            observingLifecycle = true
            NotificationCenter.default.addObserver(self, selector: #selector(appBecameActive),
                name: UIApplication.didBecomeActiveNotification, object: nil)
            NotificationCenter.default.addObserver(self, selector: #selector(appEnteredBackground),
                name: UIApplication.didEnterBackgroundNotification, object: nil)
        }
    }

    func handleWebMessage(_ body: Any) {
        guard let dict = body as? [String: Any], let type = dict["type"] as? String else { return }
        switch type {
        case "geolocation", "location", "prayer", "location-resume":
            requestLocationIfNeeded()
        case "location-background":
            enableBackgroundMonitoring()
        case "location-open-settings":
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }

        case "qibla", "motion", "qibla-compass":
            startLiveQibla()
        case "qibla-stop":
            stopLiveQibla()
        case "notifications", "push":
            DarPushNotifications.requestAuthorization()
        default:
            break
        }
    }

    func startLiveQibla() {
        liveQibla = true
        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.desiredAccuracy = kCLLocationAccuracyBest
            locationManager.distanceFilter = 20
            locationManager.headingFilter = 1
            locationManager.startUpdatingLocation()
            if CLLocationManager.headingAvailable() {
                locationManager.startUpdatingHeading()
            }
        default:
            break
        }
    }

    func stopLiveQibla() {
        liveQibla = false
        locationManager.stopUpdatingHeading()
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.distanceFilter = 500
        if UIApplication.shared.applicationState == .active {
            startForegroundTracking()
        } else {
            locationManager.stopUpdatingLocation()
            trackingRegularly = false
        }
    }

    func closeAppToHomeScreen() {
        stopLiveQibla()
        UIControl().sendAction(#selector(URLSessionTask.suspend), to: UIApplication.shared, for: nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            exit(0)
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

    /// Called after WKWebView is ready. First use requests When In Use, never
    /// quietly upgrades a user to Always authorization.
    func requestLocationIfNeeded() {
        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            startForegroundTracking()
            locationManager.requestLocation()
            replayLastLocation()
        default:
            sendLocationStatus()
        }
    }

    private func startForegroundTracking() {
        guard UIApplication.shared.applicationState == .active else { return }
        guard CLLocationManager.locationServicesEnabled() else { return }
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.desiredAccuracy = liveQibla ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters
            locationManager.distanceFilter = liveQibla ? 20 : 500
            locationManager.startUpdatingLocation()
            trackingRegularly = true
            if backgroundOptIn && locationManager.authorizationStatus == .authorizedAlways {
                locationManager.allowsBackgroundLocationUpdates = true
                locationManager.startMonitoringSignificantLocationChanges()
            }
        default: break
        }
        sendLocationStatus()
    }

    private func enableBackgroundMonitoring() {
        // Triggered only by an explicit action from the location settings page.
        UserDefaults.standard.set(true, forKey: backgroundPreferenceKey)
        switch locationManager.authorizationStatus {
        case .notDetermined: locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse: locationManager.requestAlwaysAuthorization()
        case .authorizedAlways:
            locationManager.allowsBackgroundLocationUpdates = true
            locationManager.startMonitoringSignificantLocationChanges()
            startForegroundTracking()
        default: sendLocationStatus()
        }
    }

    @objc private func appBecameActive() {
        startForegroundTracking()
        if locationManager.authorizationStatus == .authorizedWhenInUse || locationManager.authorizationStatus == .authorizedAlways {
            locationManager.requestLocation()
        }
        replayLastLocation()
    }

    @objc private func appEnteredBackground() {
        locationManager.stopUpdatingHeading()
        locationManager.stopUpdatingLocation()
        trackingRegularly = false
        if backgroundOptIn && locationManager.authorizationStatus == .authorizedAlways {
            locationManager.allowsBackgroundLocationUpdates = true
            locationManager.startMonitoringSignificantLocationChanges()
        }
    }

    private func replayLastLocation() {
        if let last = mostRecentLocation { deliver(last) }
    }

    private func sendLocationStatus() {
        let allowed = locationManager.authorizationStatus
        let state: String
        switch allowed {
        case .authorizedAlways: state = "always"
        case .authorizedWhenInUse: state = "when-in-use"
        case .notDetermined: state = "not-determined"
        case .denied: state = "denied"
        case .restricted: state = "restricted"
        @unknown default: state = "unknown"
        }
        let js = "window.dispatchEvent(new CustomEvent('dar-native-location-status',{detail:{authorization:'\\(state)',backgroundOptIn:\\(backgroundOptIn ? "true" : "false")}}));"
        webView?.evaluateJavaScript(js, completionHandler: nil)
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
            if liveQibla { startLiveQibla() } else { startForegroundTracking() }
            if backgroundOptIn && manager.authorizationStatus == .authorizedAlways {
                manager.allowsBackgroundLocationUpdates = true
                manager.startMonitoringSignificantLocationChanges()
            }
            manager.requestLocation()
            flushGeoDecisions(.grant)
        case .denied, .restricted:
            manager.stopUpdatingLocation()
            manager.stopMonitoringSignificantLocationChanges()
            trackingRegularly = false
            flushGeoDecisions(.deny)
        default: break
        }
        sendLocationStatus()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last(where: {
            CLLocationCoordinate2DIsValid($0.coordinate) &&
            $0.horizontalAccuracy >= 0 && $0.horizontalAccuracy <= 2500 &&
            abs($0.timestamp.timeIntervalSinceNow) < 600
        }) else { return }
        if let previous = mostRecentLocation,
           loc.distance(from: previous) < 300,
           abs(loc.timestamp.timeIntervalSince(previous.timestamp)) < 900 { return }
        mostRecentLocation = loc
        deliver(loc)
        DarPushNotifications.applyNativeLocation(loc)
        WidgetCenter.shared.reloadAllTimelines()
    }

    private func deliver(_ loc: CLLocation) {
        let timestamp = Int(loc.timestamp.timeIntervalSince1970 * 1000)
        let js = """
        window.__darNativeLocation={lat:\(loc.coordinate.latitude),lng:\(loc.coordinate.longitude),acc:\(loc.horizontalAccuracy),timestamp:\(timestamp)};
        window.DAR_NATIVE_LOCATION=window.__darNativeLocation;
        window.dispatchEvent(new CustomEvent('dar-native-location',{detail:window.__darNativeLocation}));
        """
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        let deg = newHeading.trueHeading >= 0 ? newHeading.trueHeading : newHeading.magneticHeading
        guard deg >= 0 else { return }
        webView?.evaluateJavaScript("window.DAR_NATIVE_HEADING=\(deg);", completionHandler: nil)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // A transient location error must not discard the last known prayer city.
        let code = (error as NSError).code
        webView?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('dar-native-location-error',{detail:{code:\(code)}}));",
            completionHandler: nil
        )
    }

    private func flushGeoDecisions(_ decision: WKPermissionDecision) {
        let handlers = pendingGeoDecisions
        pendingGeoDecisions.removeAll()
        handlers.forEach { $0(decision) }
    }
}
