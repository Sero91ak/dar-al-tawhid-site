import SwiftUI
import UIKit

// KIDS_NATIVE_CLEAN_START_V2
// No legacy intro-ios.mp4 overlay. The actual Kids interface is the launch content.
// iOS itself displays the static system LaunchScreen while the WKWebView is created.
// Keeping the WebView mounted as the root also prevents its navigation from being
// concealed by an obsolete four-second full-screen movie.
struct KidsRootView: View {
    var body: some View {
        KidsWebAppView()
            .ignoresSafeArea()
            .background(Color(red: 12.0 / 255, green: 38.0 / 255, blue: 54.0 / 255))
    }
}
