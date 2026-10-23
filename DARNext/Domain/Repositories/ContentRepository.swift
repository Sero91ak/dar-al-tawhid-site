import Foundation

protocol ContentRepository: Sendable {
    func dashboardSnapshot() async throws -> DashboardSnapshot
}
