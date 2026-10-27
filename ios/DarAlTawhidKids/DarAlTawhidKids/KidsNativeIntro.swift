import SwiftUI
import UIKit

// KIDS_NATIVE_CLEAN_START_V2: visitor always runs the original full-screen app.
// Creator controls compile ONLY with KIDS_CREATOR_TEST and cannot leak into App Store.
struct KidsRootView: View {
#if KIDS_CREATOR_TEST
    @State private var showCreatorPanel = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            KidsWebAppView()
                .ignoresSafeArea()
                .background(Color(red: 12.0 / 255, green: 38.0 / 255, blue: 54.0 / 255))

            Button {
                showCreatorPanel = true
            } label: {
                Label("TEST", systemImage: "wrench.adjustable")
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .foregroundStyle(Color(red: 0.08, green: 0.16, blue: 0.22))
                    .background(Color(red: 0.93, green: 0.81, blue: 0.59))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.6), lineWidth: 1))
                    .shadow(color: .black.opacity(0.35), radius: 9, y: 3)
            }
            .accessibilityLabel("KIDS Ersteller-Übersicht öffnen")
            .padding(.trailing, 13)
            .padding(.bottom, 102)
        }
        .sheet(isPresented: $showCreatorPanel) {
            KidsCreatorPanel { destination in
                showCreatorPanel = false
                DispatchQueue.main.async {
                    NotificationCenter.default.post(
                        name: Notification.Name("DarKidsCreatorNavigate"),
                        object: destination
                    )
                }
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }
#else
    // PUBLIC APP 1.0.2: native loading covers the complete first WebView navigation.
    // A separate visitor-only JS bridge disables the web splash to avoid a double opener.
    @State private var visitorStartVisible = true
    @State private var visitorLoadProgress = 0
    @State private var visitorLoadFailed = false
    @State private var visitorLoadSlow = false

    var body: some View {
        ZStack {
            KidsWebAppView()
                .ignoresSafeArea()
                .background(Color(red: 12.0 / 255, green: 38.0 / 255, blue: 54.0 / 255))

            if visitorStartVisible {
                GeometryReader { geometry in
                    ZStack(alignment: .bottom) {
                        Image("KidsVisitorLaunchPoster")
                            .resizable()
                            .scaledToFill()
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .clipped()

                        KidsVisitorLaunchProgress(
                            percent: visitorLoadProgress,
                            failed: visitorLoadFailed,
                            slow: visitorLoadSlow,
                            retry: {
                                visitorLoadProgress = 0
                                visitorLoadFailed = false
                                visitorLoadSlow = false
                                NotificationCenter.default.post(
                                    name: Notification.Name("DarKidsVisitorRetryInitialLoad"),
                                    object: nil
                                )
                            }
                        )
                        .padding(.horizontal, 22)
                        .padding(.bottom, max(geometry.safeAreaInsets.bottom, 16) + 32)
                    }
                    .frame(width: geometry.size.width, height: geometry.size.height)
                }
                .ignoresSafeArea()
                .transition(.opacity)
                .zIndex(2)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("DarKidsVisitorLoadProgress"))) { notice in
            guard visitorStartVisible, !visitorLoadFailed, visitorLoadProgress < 100,
                  let value = notice.object as? Double else { return }
            withAnimation(.easeOut(duration: 0.22)) {
                visitorLoadProgress = min(95, max(visitorLoadProgress, Int(value * 100)))
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("DarKidsVisitorPageLoaded"))) { _ in
            guard visitorStartVisible, !visitorLoadFailed else { return }
            visitorLoadSlow = false
            withAnimation(.easeOut(duration: 0.2)) {
                visitorLoadProgress = 100
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                guard visitorStartVisible else { return }
                withAnimation(.easeInOut(duration: 0.45)) {
                    visitorStartVisible = false
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("DarKidsVisitorLoadFailed"))) { _ in
            guard visitorStartVisible else { return }
            visitorLoadFailed = true
        }
        .task {
            try? await Task.sleep(nanoseconds: 15_000_000_000)
            if !Task.isCancelled && visitorStartVisible && visitorLoadProgress < 100 {
                visitorLoadSlow = true
            }
        }
    }
#endif
}

#if KIDS_CREATOR_TEST
private struct KidsCreatorPanel: View {
    let navigate: (String) -> Void

    private let gold = Color(red: 0.93, green: 0.81, blue: 0.59)
    private let night = Color(red: 0.05, green: 0.14, blue: 0.20)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Eigene iOS-Test-App · getrennte Testdaten")
                        .font(.subheadline)
                        .foregroundStyle(Color.white.opacity(0.84))
                    Text("Hier prüfst du die komplette vorhandene KIDS-Oberfläche. Unterrichtssperren sind noch nicht zentral für den Ersteller freigegeben.")
                        .font(.footnote)
                        .foregroundStyle(Color.white.opacity(0.88))

                    button("Quiz · echte V4-Fuṣḥā-Hörvorschau", "waveform.circle.fill", "quiz-v4")
                    Text("450 Fragen · Frage, Lob, Ermutigung und Erklärung. Audio ist nur zur Hörprüfung, nicht zur endgültigen Kinderfreigabe.")
                        .font(.caption)
                        .foregroundStyle(gold.opacity(0.9))
                    button("Prüfzentrale · Jahresplan & alle Bereiche", "square.grid.2x2.fill", "console")
                    button("Startseite & Testprofile", "house.fill", "home")
                    button("Qurʾān", "book.closed.fill", "quran")
                    button("Hörbücher & Prophetengeschichten", "headphones", "stories")
                    button("Duʿāʾ", "heart.text.square.fill", "dua")
                    button("Elternbereich", "person.2.fill", "parents")
                    button("Akademie · 38 vorhandene Lektionen", "graduationcap.fill", "academy")

                    Divider().overlay(gold.opacity(0.4))
                    Text("Prüfen → Änderungen besprechen → nur nach deiner Freigabe veröffentlichen.")
                        .font(.footnote)
                        .foregroundStyle(gold)
                    Text("Noch offen: echte Ersteller-Freigaben für gesperrte Lektionen und unabhängiger Test-Build vor der Besucher-App. Kein automatisches Live-Publishing.")
                        .font(.caption)
                        .foregroundStyle(Color.white.opacity(0.70))
                }
                .padding(17)
            }
            .background(night)
            .navigationTitle("KIDS TEST")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(night, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .tint(gold)
    }

    private func button(_ title: String, _ symbol: String, _ destination: String) -> some View {
        Button {
            navigate(destination)
        } label: {
            HStack(spacing: 11) {
                Image(systemName: symbol)
                    .frame(width: 23)
                    .foregroundStyle(gold)
                Text(title)
                    .multilineTextAlignment(.leading)
                    .foregroundStyle(.white)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .foregroundStyle(gold)
            }
            .padding(13)
            .frame(maxWidth: .infinity, minHeight: 49, alignment: .leading)
            .background(Color.white.opacity(0.07))
            .clipShape(RoundedRectangle(cornerRadius: 13))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(gold.opacity(0.35)))
        }
        .buttonStyle(.plain)
    }
}
#endif


#if !KIDS_CREATOR_TEST
/// The illustrated first frame is native: actual WebKit progress, completed page at 100%.
private struct KidsVisitorLaunchProgress: View {
    let percent: Int
    let failed: Bool
    let slow: Bool
    let retry: () -> Void

    private let gold = Color(red: 0.93, green: 0.81, blue: 0.59)

    var body: some View {
        VStack(spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text(failed ? "Verbindung fehlgeschlagen" :
                     slow ? "Laden dauert länger" : "Kinderwelt wird vorbereitet")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                Spacer(minLength: 4)
                Text("\(percent) %")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(gold)
            }
            ProgressView(value: Double(percent), total: 100)
                .progressViewStyle(.linear)
                .tint(gold)
                .accessibilityLabel("Ladefortschritt")
                .accessibilityValue("\(percent) Prozent")
            if failed || slow {
                Button(action: retry) {
                    Label("Erneut laden", systemImage: "arrow.clockwise")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                }
                .buttonStyle(.borderedProminent)
                .tint(gold)
                .foregroundStyle(Color(red: 0.06, green: 0.15, blue: 0.20))
            }
        }
        .padding(.horizontal, 19)
        .padding(.vertical, 17)
        .frame(maxWidth: 420)
        .background(
            RoundedRectangle(cornerRadius: 21, style: .continuous)
                .fill(Color(red: 0.04, green: 0.12, blue: 0.19).opacity(0.91))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 21, style: .continuous)
                .stroke(gold.opacity(0.35), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.24), radius: 16, y: 7)
    }
}
#endif
