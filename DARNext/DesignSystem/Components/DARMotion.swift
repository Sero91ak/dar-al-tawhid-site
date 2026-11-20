import SwiftUI

enum DARMotion {
    static func usesZoomTransition(reduceMotion: Bool) -> Bool {
        !reduceMotion
    }
}

extension View {
    @ViewBuilder
    func darMatchedTransitionSource<ID: Hashable>(
        id: ID,
        in namespace: Namespace.ID,
        isEnabled: Bool = true
    ) -> some View {
        if #available(iOS 18.0, *), isEnabled {
            matchedTransitionSource(id: id, in: namespace)
        } else {
            self
        }
    }

    @ViewBuilder
    func darZoomNavigationTransition<ID: Hashable>(
        sourceID: ID,
        in namespace: Namespace.ID,
        isEnabled: Bool = true
    ) -> some View {
        if #available(iOS 18.0, *), isEnabled {
            navigationTransition(.zoom(sourceID: sourceID, in: namespace))
        } else {
            self
        }
    }
}
