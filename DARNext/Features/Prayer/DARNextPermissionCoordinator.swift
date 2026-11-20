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

    static func shouldStartLocationUpdates(for status: CLAuthorizationStatus) -> Bool {
        status == .authorizedWhenInUse || status == .authorizedAlways
    }

    static func shouldStopLocationUpdates(for status: CLAuthorizationStatus) -> Bool {
        !shouldStartLocationUpdates(for: status)
    }

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

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor [weak self] in
            self?.applyLocationAuthorization(status)
        }
    }

    private func applyLocationAuthorization(_ status: CLAuthorizationStatus) {
        locationStatus = status
        if Self.shouldStartLocationUpdates(for: status) {
            locationManager.startUpdatingLocation()
        } else if Self.shouldStopLocationUpdates(for: status) {
            locationManager.stopUpdatingLocation()
        }
    }
}
