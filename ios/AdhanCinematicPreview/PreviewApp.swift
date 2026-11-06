import SwiftUI

// Standalone simulator QA harness: same DarAdhanCinematicDemo.swift as the
// existing iOS visitor application, without OneSignal/vendor frameworks.
@main
struct DarAdhanCinematicPreviewApp: App {
    @State private var presenting = true

    var body: some Scene {
        WindowGroup {
            Group {
                if presenting {
                    DarAdhanCinematicDemo {
                        presenting = false
                    }
                } else {
                    ZStack {
                        Color(red: 0.025, green: 0.06, blue: 0.055).ignoresSafeArea()
                        VStack(spacing: 18) {
                            Text("DĀR AL TAWḤĪD")
                                .font(.system(size: 20, weight: .semibold, design: .serif))
                                .foregroundStyle(.yellow.opacity(0.75))
                            Button("Adhān Cinematic öffnen") {
                                presenting = true
                            }
                            .font(.headline)
                            .foregroundStyle(.white)
                        }
                    }
                }
            }
        }
    }
}
