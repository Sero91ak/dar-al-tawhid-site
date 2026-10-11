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
    var body: some View {
        KidsWebAppView()
            .ignoresSafeArea()
            .background(Color(red: 12.0 / 255, green: 38.0 / 255, blue: 54.0 / 255))
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
