import Foundation

@MainActor
struct DependencyContainer {
    let contentRepository: LocalContentRepository

    static func live() -> DependencyContainer {
        DependencyContainer(contentRepository: LocalContentRepository())
    }
}
