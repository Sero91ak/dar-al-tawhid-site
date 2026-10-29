import SwiftUI
import UIKit

/// Native NEXT shell. Content that has not yet been migrated remains available
/// through one explicit WebKit adapter instead of being silently duplicated.
struct TawhidKidsNextRootView: View {
    @State private var selectedTab: NextTab = .today
    @State private var selectedProfile: NextProfile = .boy
    @State private var showingWebContent = false
    @AppStorage("kids.next.activeProfile") private var storedProfile = NextProfile.boy.rawValue

    var body: some View {
        TabView(selection: $selectedTab) {
            NextTodayView(
                profile: selectedProfile,
                openWebContent: { showingWebContent = true },
                selectTab: { selectedTab = $0 }
            )
            .tabItem { NextTabLabel(tab: .today) }
            .tag(NextTab.today)

            NextListeningView(
                profile: selectedProfile,
                openWebContent: { showingWebContent = true }
            )
            .tabItem { NextTabLabel(tab: .listening) }
            .tag(NextTab.listening)

            NextLearningView(
                profile: selectedProfile,
                openWebContent: { showingWebContent = true }
            )
            .tabItem { NextTabLabel(tab: .learning) }
            .tag(NextTab.learning)

            NextDuaView(openWebContent: { showingWebContent = true })
                .tabItem { NextTabLabel(tab: .dua) }
                .tag(NextTab.dua)

            NextParentsView(
                selectedProfile: $selectedProfile,
                openWebContent: { showingWebContent = true }
            )
            .tabItem { NextTabLabel(tab: .parents) }
            .tag(NextTab.parents)
        }
        .tint(NextDesign.gold)
        .onAppear {
            selectedProfile = NextProfile(rawValue: storedProfile) ?? .boy
        }
        .onChange(of: selectedProfile) { _, profile in
            storedProfile = profile.rawValue
        }
        .sheet(isPresented: $showingWebContent) {
            NavigationStack {
                KidsWebAppView()
                    .ignoresSafeArea(edges: .bottom)
                    .navigationTitle("KIDS Inhalte")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Schließen") { showingWebContent = false }
                        }
                    }
            }
        }
    }
}

private enum NextTab: Hashable {
    case today, listening, learning, dua, parents

    var title: String {
        switch self {
        case .today: "Heute"
        case .listening: "Hören"
        case .learning: "Lernen"
        case .dua: "Duʿāʾ"
        case .parents: "Eltern"
        }
    }
}

private struct NextTabLabel: View {
    let tab: NextTab

    var body: some View {
        Label {
            Text(tab.title)
        } icon: {
            if let image = NextOriginalAssets.image(named: tab.assetName, extension: "png") {
                image
                    .resizable()
                    .scaledToFit()
            } else {
                Image(systemName: "photo")
                    .accessibilityLabel("Originalsymbol fehlt: \(tab.title)")
            }
        }
    }
}

private enum NextOriginalAssets {
    static func image(named name: String, extension fileExtension: String) -> Image? {
        guard let url = Bundle.main.url(forResource: name, withExtension: fileExtension),
              let image = UIImage(contentsOfFile: url.path) else {
            return nil
        }
        return Image(uiImage: image)
    }
}

private extension NextTab {
    var assetName: String {
        switch self {
        case .today: "home-real-v12"
        case .listening: "headphones-real-v12"
        case .learning: "learning-book-3d-v1422"
        case .dua: "dua-real-v12"
        case .parents: "parents-real-v12"
        }
    }
}

private enum NextProfile: String, CaseIterable, Identifiable {
    case boy, girl

    var id: String { rawValue }
    var title: String { self == .boy ? "Jungenprofil" : "Mädchenprofil" }
    var accent: Color { self == .boy ? NextDesign.petrol : NextDesign.plum }
    var symbol: String { self == .boy ? "person.fill" : "person.crop.circle.fill" }
}

enum NextDesign {
    static let night = Color(red: 0.047, green: 0.149, blue: 0.212)
    static let petrol = Color(red: 0.08, green: 0.42, blue: 0.45)
    static let plum = Color(red: 0.45, green: 0.22, blue: 0.40)
    static let cream = Color(red: 0.98, green: 0.95, blue: 0.87)
    static let gold = Color(red: 0.93, green: 0.81, blue: 0.59)
}

private struct NextPage<Content: View>: View {
    let title: String
    let subtitle: String
    let accent: Color
    @ViewBuilder let content: Content

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text(title)
                            .font(.system(.largeTitle, design: .rounded).weight(.bold))
                            .foregroundStyle(NextDesign.cream)
                        Text(subtitle)
                            .font(.callout)
                            .foregroundStyle(NextDesign.cream.opacity(0.78))
                    }
                    content
                }
                .frame(maxWidth: 760, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.vertical, 24)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .background(NextDesign.night.ignoresSafeArea())
            .toolbarBackground(NextDesign.night, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }
}

struct NextActionCard: View {
    let title: String
    let detail: String
    let symbol: String
    let accent: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: symbol)
                    .font(.title2)
                    .foregroundStyle(accent)
                    .frame(width: 36, height: 36)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(NextDesign.cream)
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(NextDesign.cream.opacity(0.72))
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .foregroundStyle(NextDesign.gold)
                    .accessibilityHidden(true)
            }
            .padding(16)
            .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
            .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(accent.opacity(0.35)))
        }
        .buttonStyle(.plain)
        .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct NextTodayView: View {
    let profile: NextProfile
    let openWebContent: () -> Void
    let selectTab: (NextTab) -> Void

    var body: some View {
        NextPage(title: "Salām", subtitle: "Dein nächster ruhiger Schritt in der Kinderwelt.", accent: profile.accent) {
            VStack(alignment: .leading, spacing: 12) {
                if let hero = NextOriginalAssets.image(named: "home-title-hero", extension: "png") {
                    GeometryReader { geometry in
                        hero
                            .resizable()
                            .scaledToFill()
                            .frame(width: geometry.size.width, height: min(geometry.size.height, 220))
                            .clipped()
                    }
                    .frame(height: 190)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(NextDesign.gold.opacity(0.4), lineWidth: 1)
                    )
                    .accessibilityLabel("Originales KIDS-Startmotiv")
                } else {
                    ContentUnavailableView(
                        "Startmotiv nicht verfügbar",
                        systemImage: "photo",
                        description: Text("Die originale KIDS-Hero-Datei wurde im App-Bundle nicht gefunden.")
                    )
                    .frame(height: 190)
                    .foregroundStyle(NextDesign.cream)
                    .accessibilityAddTraits(.isStaticText)
                }

                Label(profile.title, systemImage: profile.symbol)
                    .font(.headline)
                    .foregroundStyle(profile.accent)
                    .accessibilityLabel("Aktives Profil: \(profile.title)")

                Text("Heute weiterlernen")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(NextDesign.cream)

                NextActionCard(
                    title: "Weiterhören",
                    detail: "Setze deine letzte Geschichte an der gespeicherten Stelle fort.",
                    symbol: "play.circle.fill",
                    accent: profile.accent,
                    action: { selectTab(.listening) }
                )
                NextActionCard(
                    title: "Weiterlernen",
                    detail: "Öffne die vorhandenen Lernbereiche und den aktuellen Fortschritt.",
                    symbol: "book.circle.fill",
                    accent: NextDesign.gold,
                    action: { selectTab(.learning) }
                )
                NextActionCard(
                    title: "Bestehende KIDS-Inhalte",
                    detail: "Noch nicht native Bereiche bleiben über den geprüften WebKit-Adapter erreichbar.",
                    symbol: "rectangle.inset.filled.and.person.filled",
                    accent: NextDesign.petrol,
                    action: openWebContent
                )
            }
        }
    }
}

private struct NextListeningView: View {
    let profile: NextProfile
    let openWebContent: () -> Void

    var body: some View {
        NextPage(title: "Hören", subtitle: "Geschichten, Qurʾān und vorhandene Audio-Inhalte.", accent: profile.accent) {
            NextActionCard(title: "Hören & Mitlesen", detail: "Die vorhandene Bibliothek bleibt als Hybridbereich erreichbar.", symbol: "text.book.closed.fill", accent: profile.accent, action: openWebContent)
            NextActionCard(title: "Zuletzt gehört", detail: "Fortschritt und Resume-Zustand werden in der Migration weitergeführt.", symbol: "clock.arrow.circlepath", accent: NextDesign.gold, action: openWebContent)
        }
    }
}

private struct NextLearningView: View {
    let profile: NextProfile
    let openWebContent: () -> Void
    @State private var showingQuiz = false

    var body: some View {
        NextPage(title: "Lernen", subtitle: "Akademie, Quiz und Lernfortschritt.", accent: profile.accent) {
            NextActionCard(title: "Lernbereiche öffnen", detail: "Bestehende Inhalte werden über den isolierten KIDS-Test-Worker geladen.", symbol: "square.grid.2x2.fill", accent: profile.accent, action: openWebContent)
            NextActionCard(title: "Quiz starten", detail: "900 freigegebene Fragen aus der kanonischen KIDS-Quelle.", symbol: "questionmark.circle.fill", accent: NextDesign.gold, action: { showingQuiz = true })
        }
        .sheet(isPresented: $showingQuiz) { NextQuizView() }
    }
}

private struct NextDuaView: View {
    let openWebContent: () -> Void

    var body: some View {
        NextPage(title: "Duʿāʾ", subtitle: "Arabisch, Lautschrift, Bedeutung und Audio bleiben quellengebunden.", accent: NextDesign.gold) {
            NextDuaLibraryView(openWebContent: openWebContent)
        }
    }
}

private struct NextParentsView: View {
    @Binding var selectedProfile: NextProfile
    let openWebContent: () -> Void

    var body: some View {
        NextPage(title: "Eltern", subtitle: "Profile, Schutz und Lernfortschritt bleiben lokal und getrennt.", accent: NextDesign.gold) {
            if let profileArt = NextOriginalAssets.image(
                named: selectedProfile == .boy ? "parents-hero-boy-v1254" : "parents-hero-girl-v1254",
                extension: "jpg"
            ) {
                profileArt
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: 340, maxHeight: 180)
                    .frame(maxWidth: .infinity)
                    .accessibilityLabel("Originales Profilmotiv für \(selectedProfile.title)")
            }

            Picker("Profil", selection: $selectedProfile) {
                ForEach(NextProfile.allCases) { profile in
                    Text(profile.title).tag(profile)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Kinderprofil auswählen")

            NextActionCard(title: "Elternverwaltung öffnen", detail: "Die bestehende Profil- und Schutzlogik bleibt im Hybridbereich verfügbar.", symbol: "lock.shield.fill", accent: NextDesign.gold, action: openWebContent)
        }
    }
}
