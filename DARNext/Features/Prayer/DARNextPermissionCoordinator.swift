import CoreLocation
import Observation
import UIKit
import UserNotifications

@MainActor
@Observable
final class DARNextPermissionCoordinator: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    var locationStatus: CLAuthorizationStatus = .notDetermined
    var notificationsEnabled = false

    override init() {
        super.init()
        locationManager.delegate = self
        locationStatus = locationManager.authorizationStatus
        Task { await refreshNotificationStatus() }
    }

    var locationDescription: String {
        switch locationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            return "Standort ist freigegeben"
        case .denied:
            return "Standort ist deaktiviert"
        case .restricted:
            return "Standort ist eingeschränkt"
        case .notDetermined:
            return "Standortfreigabe einrichten"
        @unknown default:
            return "Standortstatus unbekannt"
        }
    }

    func requestLocation() {
        if locationStatus == .denied || locationStatus == .restricted {
            openSettings()
            return
        }
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }

    func requestNotifications() async {
        _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
        await refreshNotificationStatus()
    }

    func refreshNotificationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        notificationsEnabled = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
    }

    func openSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        locationStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
            manager.startUpdatingLocation()
        }
    }
}
